'use strict';
/* ==================================================================
   sync.js — the client sync layer.

   Turns the single-device v1 (both partners on one localStorage blob,
   toggled by S.active) into two devices sharing one Supabase "room":
   email-OTP auth, pairing by invite code, room-scoped reads/writes,
   realtime, and an offline read-cache.

   The rendered UI lives in app.js. This file owns data only: it builds
   the global `S` in the *same shape v1 used*, so the view functions
   port over almost verbatim.

   Trust model (carried over from the backend design, unchanged):
   cross-couple isolation is enforced by RLS and proven; within a room,
   the sealed check-ins / prompt answers are a client-side courtesy — a
   determined partner could read an unrevealed row directly. That gate
   moves behind security-definer RPCs before any public release.
================================================================== */

let sb = null;                 // Supabase client (global; used by app.js too)
let S = null;                  // app state, v1-shaped (global)
let rtChannel = null;          // realtime subscription
let refetchTimer = null;

/* ---------------- Client ---------------- */
function initClient(){
  if(sb) return sb;
  const c = window.CP_CONFIG;
  sb = window.supabase.createClient(c.SUPABASE_URL, c.SUPABASE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  return sb;
}

/* ---------------- Offline read-cache ----------------
   The cloud is the source of truth; this is only so the app can open
   and show the last-known room while the network is down. Writes still
   require a connection. Keyed by room so switching rooms can't bleed. */
function cacheKey(roomId){ return 'cp_room_cache_' + roomId; }
function lastRoomKey(){ return 'cp_last_room'; }
function saveCache(){
  if(!S || !S.roomId) return;
  try{
    const snap = JSON.stringify({ roomId:S.roomId, mySeat:S.mySeat, data:S });
    localStorage.setItem(cacheKey(S.roomId), snap);
    localStorage.setItem(lastRoomKey(), S.roomId);
  }catch(e){}
}
function loadCache(){
  try{
    const roomId = localStorage.getItem(lastRoomKey());
    if(!roomId) return null;
    const raw = localStorage.getItem(cacheKey(roomId));
    if(!raw) return null;
    const snap = JSON.parse(raw);
    return snap && snap.data ? snap.data : null;
  }catch(e){ return null; }
}
function clearCache(roomId){
  try{
    if(roomId) localStorage.removeItem(cacheKey(roomId));
    localStorage.removeItem(lastRoomKey());
  }catch(e){}
}

/* ---------------- Auth (email OTP) ----------------
   Requires the Email provider + email OTP to be enabled in the Supabase
   dashboard (see README). Until that is on, code delivery will fail. */
async function authSendCode(email){
  // emailRedirectTo points any tap-the-link fallback back at this app (not the
  // account root), so the confirmation link can't 404. The redirect target must
  // also be listed under Auth → URL Configuration → Redirect URLs.
  const redirect = window.location.origin + window.location.pathname;
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true, emailRedirectTo: redirect }
  });
  if(error) throw error;
}
async function authVerify(email, code){
  const token = code.trim();
  // A brand-new user's code arrives via the "Confirm signup" flow (type
  // 'signup'); a returning user's via magic link (type 'email'). Try the
  // common case first, then fall back so first-timers verify too.
  const first = await sb.auth.verifyOtp({ email, token, type: 'email' });
  if(first.error){
    const second = await sb.auth.verifyOtp({ email, token, type: 'signup' });
    if(second.error) throw first.error;
  }
}
async function authSignOut(){
  unsubscribeRealtime();
  const rid = S && S.roomId;
  await sb.auth.signOut();
  clearCache(rid);
  S = null;
}
async function currentUserId(){
  const { data } = await sb.auth.getUser();
  return data && data.user ? data.user.id : null;
}

/* ---------------- Pairing (RPCs) ---------------- */
async function rpcCreateRoom(appName, myName){
  const { data, error } = await sb.rpc('create_room', {
    p_name: appName || '',
    p_display_name: myName,
    p_deck: defaultDeck()
  });
  if(error) throw error;
  return Array.isArray(data) ? data[0] : data;   // { room_id, invite_code, seat }
}
async function rpcJoinRoom(code, myName){
  const { data, error } = await sb.rpc('join_room', {
    p_code: code,
    p_display_name: myName
  });
  if(error) throw error;
  return Array.isArray(data) ? data[0] : data;    // { room_id, seat }
}
async function rpcLeaveRoom(){
  unsubscribeRealtime();
  const rid = S && S.roomId;
  const { error } = await sb.rpc('leave_room');
  if(error) throw error;
  clearCache(rid);
  S = null;
}

/* ---------------- Load a room into S ----------------
   Returns true if the signed-in user is in a room (S populated),
   false if they are not (→ pairing). Throws on network/query error so
   the caller can fall back to the offline cache. */
async function fetchRoom(){
  const uid = await currentUserId();
  if(!uid) return false;

  const mRes = await sb.from('members').select('room_id, user_id, seat, display_name, email_notifications');
  if(mRes.error) throw mRes.error;
  const members = mRes.data || [];
  const mine = members.find(m => m.user_id === uid);
  if(!mine) return false;                 // signed in but not paired yet

  const roomId = mine.room_id;
  const mySeat = mine.seat;

  const roomRes = await sb.from('rooms').select('*').eq('id', roomId).single();
  if(roomRes.error) throw roomRes.error;
  const room = roomRes.data;

  const jRes = await sb.from('journal_entries').select('*')
    .eq('room_id', roomId).order('created_at', { ascending: false });
  if(jRes.error) throw jRes.error;

  const stRes = await sb.from('storms').select('*')
    .eq('room_id', roomId).is('closed_at', null)
    .order('started_at', { ascending: false }).limit(1);
  if(stRes.error) throw stRes.error;

  let storm = null;
  if(stRes.data && stRes.data.length){
    const st = stRes.data[0];
    const [sig, rnd, nts] = await Promise.all([
      sb.from('storm_signals').select('*').eq('storm_id', st.id).order('created_at'),
      sb.from('storm_rounds').select('*').eq('storm_id', st.id).order('round_no'),
      sb.from('storm_notes').select('*').eq('storm_id', st.id).order('created_at')
    ]);
    if(sig.error) throw sig.error;
    if(rnd.error) throw rnd.error;
    if(nts.error) throw nts.error;
    storm = mapStorm(st, sig.data, rnd.data, nts.data);
  }

  buildS(room, members, mySeat, jRes.data || [], storm);
  saveCache();
  return true;
}

/* ---------------- Mapping: rows → v1-shaped S ---------------- */
function ms(ts){ return ts ? new Date(ts).getTime() : Date.now(); }

function mapEntry(row){
  return {
    id: row.id,
    by: row.author_seat,
    ts: ms(row.created_at),
    text: row.text,
    tag: row.tag,
    promptDay: row.prompt_day || undefined,
    resolved: row.resolved_at ? ms(row.resolved_at) : undefined,
    acks: row.acks || {}
  };
}
function mapSignal(row){
  return { id: row.id, by: row.by_seat, text: row.text, ts: ms(row.created_at), seen: !!row.seen };
}
function mapNote(row){
  return { id: row.id, by: row.by_seat, text: row.text, ts: ms(row.created_at) };
}
function mapRound(row){
  return { id: row.id, round_no: row.round_no, a: row.a_answer || null, b: row.b_answer || null, revealed: !!row.revealed };
}
function mapStorm(st, signals, rounds, notes){
  const checkin = (rounds || []).map(mapRound);
  if(!checkin.length) checkin.push({ id: null, round_no: 1, a: null, b: null, revealed: false });
  return {
    id: st.id,
    startedTs: ms(st.started_at),
    signals: (signals || []).map(mapSignal),
    checkin,
    notes: (notes || []).map(mapNote)
  };
}

function buildS(room, members, mySeat, journalRows, storm){
  const prevUi = (S && S.ui) || { view:'home', editing:null };
  const prevLang = (S && S.lang) || localStorage.getItem('cp_lang') || 'en';

  const people = { a:{ name:'' }, b:{ name:'' } };
  for(const m of members){ if(people[m.seat]) people[m.seat].name = m.display_name || ''; }

  const mineRow = members.find(m => m.seat === mySeat);
  const deck = normalizeDeck(room.deck);

  S = {
    v: 1,
    roomId: room.id,
    inviteCode: room.invite_code,
    mySeat,
    active: mySeat,                       // view code reads S.active as "me"
    emailNotify: !mineRow || mineRow.email_notifications !== false,
    partnerPresent: members.length >= 2,
    setup: true,
    appName: room.name || '',
    lang: prevLang,
    people,
    journal: (journalRows || []).map(mapEntry),
    storm,
    deck,
    deckInviteDismissed: !!room.ritual_dismissed,
    ui: prevUi
  };
}

/* Deck lives as jsonb on the room; guard its shape so a partial value
   from an older write can't break the views. */
function normalizeDeck(d){
  const base = defaultDeck();
  if(!d || typeof d !== 'object') return base;
  return {
    signals: Array.isArray(d.signals) ? d.signals : base.signals,
    feelings: Array.isArray(d.feelings) ? d.feelings : base.feelings,
    needs: Array.isArray(d.needs) ? d.needs : base.needs,
    acks: Array.isArray(d.acks) ? d.acks : base.acks
  };
}

/* ---------------- Realtime ----------------
   Any change to the room's rows triggers a debounced full refetch.
   For a two-person room the data is tiny, so refetch-on-change is both
   simpler and less bug-prone than surgical row patching. */
function subscribeRealtime(roomId){
  if(rtChannel) return;
  const f = 'room_id=eq.' + roomId;
  rtChannel = sb.channel('room:' + roomId)
    .on('postgres_changes', { event:'*', schema:'public', table:'journal_entries', filter:f }, scheduleRefetch)
    .on('postgres_changes', { event:'*', schema:'public', table:'storms', filter:f }, scheduleRefetch)
    .on('postgres_changes', { event:'*', schema:'public', table:'members', filter:f }, scheduleRefetch)
    .on('postgres_changes', { event:'*', schema:'public', table:'rooms', filter:'id=eq.' + roomId }, scheduleRefetch)
    .on('postgres_changes', { event:'*', schema:'public', table:'storm_signals' }, scheduleRefetch)
    .on('postgres_changes', { event:'*', schema:'public', table:'storm_rounds' }, scheduleRefetch)
    .on('postgres_changes', { event:'*', schema:'public', table:'storm_notes' }, scheduleRefetch)
    .subscribe();
}
function unsubscribeRealtime(){
  if(rtChannel){ try{ sb.removeChannel(rtChannel); }catch(e){} rtChannel = null; }
  if(refetchTimer){ clearTimeout(refetchTimer); refetchTimer = null; }
}
function scheduleRefetch(){
  if(refetchTimer) clearTimeout(refetchTimer);
  refetchTimer = setTimeout(async () => {
    refetchTimer = null;
    try{ await fetchRoom(); if(typeof render === 'function') render(); }
    catch(e){ /* transient; next event or reconnect will resync */ }
  }, 300);
}
