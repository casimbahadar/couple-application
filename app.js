'use strict';
/* ==================================================================
   app.js — views + interactions.

   Ported from the v1 feel-test almost verbatim: same CSS classes, same
   copy, same flows. What changed is only where data comes from and goes
   to. The single-device seat toggle is gone — you are your own seat
   (S.mySeat); the partner is the other seat, filled in over the network.

   Sealing note (unchanged from v1): the daily-prompt answers and the
   check-in rounds are hidden from the partner until both have acted /
   revealed. That is a client-side courtesy, matching the v1 behaviour
   and the backend's documented intra-room trust boundary.
================================================================== */

/* ---------------- Languages / strings ----------------
   Strings are data. English is the shipped language; اردو and پنجابی
   are architectural stubs — translations arrive after native-speaker
   review, per the v1 note. RTL switching is wired but inert until then. */
const LANGS = [
  {code:'en', label:'English', dir:'ltr', ready:true},
  {code:'ur', label:'اردو', dir:'rtl', ready:false},
  {code:'pa', label:'پنجابی', dir:'rtl', ready:false}
];
const T = {
  en: {
    unnamed:'not yet named',
    hardMoment:'We’re in a hard moment',
    stepOut:'Step out for now — this stays open',
    todayPrompt:'Today, if you want it',
    answerPrompt:'Answer quietly',
    sealedUntil:'Sealed until {name} answers — or tomorrow.',
    leaveIt:'Leave it here',
    justShare:'Just sharing',
    worthTalk:'Worth talking about',
    nothingYet:'Nothing here yet. The stream holds whatever either of you leaves in it.',
    waiting:'Something from {name} is waiting.',
    openReady:'Open when you’re ready',
    rung1:'One tap — a signal',
    rung1sub:'No reply needed. It waits until {name} is ready to see it.',
    rung2:'Check in',
    rung2sub:'Three quiet questions. Neither of you sees the other’s answers until you’ve both finished.',
    rung3:'A few words',
    rung3locked:'Opens once you’ve both checked in.',
    rung3sub:'A few sentences, now that you’ve both been heard.',
    q1:'Right now I feel…',
    q1depth:'How deep does it run?',
    q2:'What I need most…',
    q3:'Ready to talk?',
    depth:['A little','A lot','Flooded'],
    ready:['Not yet','Soon','I’m ready'],
    sealHand:'Sealed. It opens when {name} has answered too.',
    bothSealed:'Both sealed. Reveal together?',
    reveal:'Reveal',
    findTitle:'go find each other.',
    findSub:'The rest of this doesn’t happen on a screen.',
    closeStorm:'Close it and put it away',
    skipTalk:'This storm has passed — close it and put it away',
    signalSent:'Left for {name}. It will wait.',
    send:'Leave it for {name}',
    yourWords:'Your words',
    theirWords:'{name}’s words',
    notWritten:'Not written yet.',
    deckTitle:'your deck.',
    deckSub:'These are starting points, not scripts. Edit them together on a calm day, so they sound like the two of you before you ever need them.',
    signals:'Signals', feelings:'Feeling words', needs:'Needs',
    add:'Add', save:'Save', del:'Remove', edit:'Edit', cancel:'Cancel',
    customNote:'Anything you add is kept exactly as you type it — custom lines aren’t auto-translated.',
    settings:'settings.',
    names:'Your names',
    appName:'This app’s name',
    appNameSub:'Name it together — or leave it for later.',
    language:'Language',
    langNote:'Urdu and Punjabi arrive with the public release — after native-speaker review. Emotional words deserve better than machine translation.',
    fresh:'Leave this room',
    freshConfirm:'This erases the journal, the deck edits, and every storm. Are you both sure?',
    yesErase:'Yes, erase everything',
    back:'Back',
    begin:'Begin',
    setupTitle:'two people, one quiet place.',
    setupSub:'A shared stream for ordinary days, and a slower room for the hard ones.',
    nameA:'First person’s name',
    nameB:'Second person’s name',
    holding:'the two of us',
    seenSignals:'Signals you’ve opened',
    stormNote:'Every step here is optional. Skip anything. Leave any time.',
    promptSealedYou:'Yours is sealed here until {name} answers — or tomorrow.',
    flagsTitle:'things we’ve flagged',
    resolveBtn:'we talked ✓',
    talked:'talked about ✓',
    ackFelt:'felt this',
    ackThanks:'thank you',
    ritualTitle:'a calm-day ritual',
    ritualBody:'On a good day, sit together and edit your deck until the words sound like the two of you. Choose them before you need them.',
    ritualOpen:'Open the deck',
    ritualLater:'Got it',
    exportBtn:'Export a backup',
    importBtn:'Restore from a backup',
    importConfirm:'Replace everything here with the backup file?',
    importBad:'That file doesn’t look like one of ours.',
    backupNote:'Your journal lives safely in the cloud now. This just downloads a copy you can keep anywhere — or use to bring old v1 entries in.',
    checkAgain:'Check in again',
    penPassed:'Your note is here for {name}. You can write again after they do.',
    respond:'respond',
    acksLabel:'Acknowledgments',

    /* ---- synced build additions ---- */
    appTitle:'two people, one quiet place.',
    signInSub:'Sign in with your email. We’ll send a one-time code — no password to remember.',
    emailLabel:'Your email',
    sendCode:'Send me a code',
    sending:'Sending…',
    otpTitle:'check your email.',
    otpSub:'We sent a code to {email}. Enter it below (check spam too).',
    codeLabel:'The code',
    verify:'Sign in',
    checking:'Checking…',
    resend:'Send another code',
    changeEmail:'Use a different email',
    badEmail:'That doesn’t look like an email address.',
    enterCode:'Enter the code from your email.',
    badCode:'That code didn’t work — check it or send another.',
    pairTitle:'you’re in.',
    pairSub:'One of you starts the room; the other joins with the code it makes. Only the two of you ever share it.',
    createTitle:'Start a new room',
    createSub:'Do this once, then share the code with them.',
    joinTitle:'Join with a code',
    joinSub:'They started the room and gave you a code.',
    yourNameLabel:'Your name',
    roomNameOpt:'Name for the app (optional)',
    createBtn:'Create our room',
    codeLabelJoin:'The invite code',
    joinBtn:'Join',
    needName:'Add your name first.',
    needCode:'Enter the invite code.',
    already:'You’re already in a room.',
    roomFull:'That room already has two people.',
    noCode:'No room found for that code.',
    waitingTitle:'waiting for them',
    waitingBody:'Share this code with your person. When they join, this turns into your shared space.',
    inviteCodeLabel:'Your invite code',
    copyCode:'Copy code',
    copied:'Copied.',
    youAre:'You',
    them:'Them',
    notJoinedYet:'hasn’t joined yet',
    nameSetNote:'Names are set when you each join. To change yours, you’d leave and rejoin.',
    signOut:'Sign out',
    account:'Account',
    signedInAs:'Signed in as {email}',
    leaveConfirm:'Leave this room? You’ll be unpaired. If no one is left, the room and everything in it is deleted for good.',
    importV1Btn:'Bring in v1 entries',
    importV1Note:'A one-time move: import the journal entries from a v1 backup file into this room. Run it once — running twice makes duplicates.',
    importV1Confirm:'Import {n} entries from this v1 backup into your room?',
    importDone:'Brought in {n} entries.',
    importEmpty:'That backup has no journal entries.',
    errSave:'Couldn’t save — check your connection.',
    errNet:'Couldn’t reach the server.',
    offline:'Offline — showing your last saved copy.',
    closeAnyway:'Some things left here haven’t been seen yet. Close anyway?',
    notifyTitle:'Email notifications',
    notifyOn:'On',
    notifyOff:'Off',
    notifyNote:'When {name} leaves something, we email you a gentle nudge — never the words themselves. Turn this off any time.'
  },
  ur: {}, pa: {}
};
function t(key, vars){
  const lang = (S && S.lang) || 'en';
  let s = (T[lang] && T[lang][key]) || T.en[key] || key;
  if(vars) for(const k in vars) s = s.replaceAll('{'+k+'}', vars[k]);
  return s;
}

/* ---------------- Starter deck ---------------- */
function defaultDeck(){
  return {
    signals: [
      'I need some space right now',
      'I’m ready when you are',
      'I’m okay — just quiet',
      'Can we press pause?',
      'Can we start over?',
      'I don’t want to fight',
      'I’m sorry for my part',
      'That hurt me',
      'We’re on the same team'
    ],
    feelings: ['Hurt','Angry','Overwhelmed','Sad','Anxious','Numb','Guilty','Settling down'],
    needs: [
      'Some time alone',
      'A hug',
      'To be heard',
      'Reassurance',
      'To hear “I’m sorry”',
      'Rest, water, food',
      'To solve it later, not now'
    ],
    acks: ['felt this','thank you','me too','I hear you','I’m here','made me smile','proud of you']
  };
}
const PROMPTS = [
  'One thing you appreciated about today.',
  'Something small that made you smile.',
  'Anything sitting on your mind — big or little.',
  'A memory of us you thought about recently.',
  'One thing you’re looking forward to.',
  'Something you’re carrying that I might not know about.',
  'What helped you get through today?',
  'One thing you’d like more of, from me or from life.',
  'Something funny you forgot to tell me.',
  'How is your body doing today — tired, rested, sore, fine?',
  'One thing about the other person you’re grateful for.',
  'A worry you’d like to set down here.',
  'What would make tomorrow a little easier?',
  'Anything you want me to know, in one line.'
];

/* ---------------- Small helpers ---------------- */
function other(id){ return id==='a' ? 'b' : 'a'; }
function nameOf(id){ return (S.people[id] && S.people[id].name) || (id==='a'?'A':'B'); }
function dayKey(d){ d = d || new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function todayPrompt(){
  const d = new Date();
  const n = d.getFullYear()*372 + (d.getMonth())*31 + d.getDate();
  return PROMPTS[n % PROMPTS.length];
}
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function currentRound(){ const r = S.storm.checkin; return r[r.length-1]; }

/* Draft text survives re-renders (local edits, realtime refetches). */
const drafts = { compose:'', prompt:'', words:'', email:'' };
function readDraft(key){ const el = document.getElementById(key+'Box'); return el ? el.value : (drafts[key]||''); }

let toastTimer = null;
function toast(msg){
  const el = document.getElementById('toast'); if(!el) return;
  el.textContent = msg; el.classList.add('show');
  if(toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>el.classList.remove('show'), 3200);
}

async function safeRefetch(){ try{ await fetchRoom(); render(); }catch(e){} }
async function roomUpdate(patch){
  const { error } = await sb.from('rooms').update(patch).eq('id', S.roomId);
  if(error){ toast(t('errSave')); await safeRefetch(); }
}

/* ==================================================================
   Boot + routing
================================================================== */
let APP_STATE = 'loading';     // loading | signin | otp | pair | ready
let authEmail = '';
let routing = false;

async function boot(){
  initClient();
  sb.auth.onAuthStateChange((event) => {
    if(event === 'SIGNED_OUT'){ APP_STATE = 'signin'; render(); }
    else if(event === 'SIGNED_IN'){ route(); }
  });
  await route();
}

async function route(){
  if(routing) return;
  routing = true;
  try{
    const { data:{ session } } = await sb.auth.getSession();
    if(!session){ APP_STATE = 'signin'; render(); return; }
    APP_STATE = 'loading'; render();
    try{
      const inRoom = await fetchRoom();
      if(inRoom){ APP_STATE = 'ready'; subscribeRealtime(S.roomId); render(); }
      else { APP_STATE = 'pair'; render(); }
    }catch(e){
      const cached = loadCache();
      if(cached){ S = cached; APP_STATE = 'ready'; render(); toast(t('offline')); }
      else { APP_STATE = 'signin'; render(); toast(t('errNet')); }
    }
  } finally { routing = false; }
}

/* ---------------- Render root ---------------- */
const app = document.getElementById('app');
function render(){
  if(APP_STATE !== 'ready'){
    document.documentElement.dataset.room = 'day';
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = 'en';
    let html = '';
    if(APP_STATE === 'loading') html = vLoading();
    else if(APP_STATE === 'signin') html = vSignIn();
    else if(APP_STATE === 'otp') html = vOtp();
    else if(APP_STATE === 'pair') html = vPair();
    app.innerHTML = html;
    return;
  }
  saveCache();
  document.documentElement.dataset.room = (S.ui.view==='storm') ? 'dusk' : 'day';
  const lang = LANGS.find(l=>l.code===S.lang) || LANGS[0];
  document.documentElement.dir = lang.dir;
  document.documentElement.lang = lang.code;
  let html = vHeader();
  if(S.ui.view==='home') html += vHome();
  else if(S.ui.view==='storm') html += vStorm();
  else if(S.ui.view==='deck') html += vDeck();
  else if(S.ui.view==='settings') html += vSettings();
  app.innerHTML = html;
}
function go(view){ if(!S) return; S.ui.view = view; S.ui.editing = null; render(); window.scrollTo(0,0); }

/* ==================================================================
   Auth views
================================================================== */
function vLoading(){
  return `<div class="center" style="padding-top:80px">
    <div class="mark" style="justify-content:center"><i></i><i></i></div>
    <p class="soft">…</p></div>`;
}
function vSignIn(){
  return `
  <div style="padding-top:40px">
    <div class="mark"><i></i><i></i></div>
    <h1>${esc(t('appTitle'))}</h1>
    <p class="soft">${esc(t('signInSub'))}</p>
    <div class="card" style="margin-top:20px">
      <p class="small soft sans">${esc(t('emailLabel'))}</p>
      <input type="email" id="emailBox" autocomplete="email" inputmode="email"
        value="${esc(drafts.email)}" oninput="drafts.email=this.value"
        onkeydown="if(event.key==='Enter')sendCode()">
    </div>
    <button class="big primary" id="sendBtn" onclick="sendCode()">${esc(t('sendCode'))}</button>
  </div>`;
}
function vOtp(){
  return `
  <div style="padding-top:40px">
    <div class="mark"><i></i><i></i></div>
    <h1>${esc(t('otpTitle'))}</h1>
    <p class="soft">${esc(t('otpSub',{email:authEmail}))}</p>
    <div class="card" style="margin-top:20px">
      <p class="small soft sans">${esc(t('codeLabel'))}</p>
      <input type="text" id="codeBox" inputmode="numeric" autocomplete="one-time-code"
        onkeydown="if(event.key==='Enter')verifyCode()">
    </div>
    <button class="big primary" id="verifyBtn" onclick="verifyCode()">${esc(t('verify'))}</button>
    <button class="ghost" onclick="sendCode()">${esc(t('resend'))}</button>
    <button class="ghost" onclick="backToEmail()">${esc(t('changeEmail'))}</button>
  </div>`;
}
async function sendCode(){
  const el = document.getElementById('emailBox');
  const email = ((el ? el.value : authEmail) || '').trim();
  if(!email || email.indexOf('@') < 1){ toast(t('badEmail')); return; }
  authEmail = email;
  const btn = document.getElementById('sendBtn') || document.getElementById('verifyBtn');
  if(btn){ btn.disabled = true; }
  try{
    await authSendCode(email);
    APP_STATE = 'otp'; render();
  }catch(e){ toast(authErr(e)); if(btn) btn.disabled = false; }
}
async function verifyCode(){
  const el = document.getElementById('codeBox');
  const code = ((el && el.value) || '').trim();
  if(!code){ toast(t('enterCode')); return; }
  const btn = document.getElementById('verifyBtn');
  if(btn){ btn.disabled = true; btn.textContent = t('checking'); }
  try{
    await authVerify(authEmail, code);
    await route();
  }catch(e){ toast(t('badCode')); if(btn){ btn.disabled = false; btn.textContent = t('verify'); } }
}
function backToEmail(){ APP_STATE = 'signin'; render(); }
function authErr(e){
  const m = (e && e.message) ? e.message.toLowerCase() : '';
  if(m.indexOf('rate') >= 0 || m.indexOf('limit') >= 0) return 'Too many attempts — wait a minute and try again.';
  return t('errNet');
}

/* ==================================================================
   Pairing views
================================================================== */
function vPair(){
  return `
  <div style="padding-top:36px">
    <div class="mark"><i></i><i></i></div>
    <h1>${esc(t('pairTitle'))}</h1>
    <p class="soft">${esc(t('pairSub'))}</p>

    <div class="card" style="margin-top:18px">
      <p class="eyebrow">${esc(t('createTitle'))}</p>
      <p class="small soft">${esc(t('createSub'))}</p>
      <p class="small soft sans" style="margin-top:8px">${esc(t('yourNameLabel'))}</p>
      <input type="text" id="createMyName">
      <p class="small soft sans" style="margin-top:12px">${esc(t('roomNameOpt'))}</p>
      <input type="text" id="newAppName" placeholder="—">
      <button class="big primary" id="createBtn" style="margin-top:12px" onclick="doCreateRoom()">${esc(t('createBtn'))}</button>
    </div>

    <div class="card">
      <p class="eyebrow">${esc(t('joinTitle'))}</p>
      <p class="small soft">${esc(t('joinSub'))}</p>
      <p class="small soft sans" style="margin-top:8px">${esc(t('yourNameLabel'))}</p>
      <input type="text" id="joinMyName">
      <p class="small soft sans" style="margin-top:12px">${esc(t('codeLabelJoin'))}</p>
      <input type="text" id="joinCode" autocapitalize="characters" autocomplete="off">
      <button class="big primary" id="joinBtn" style="margin-top:12px" onclick="doJoinRoom()">${esc(t('joinBtn'))}</button>
    </div>

    <button class="ghost" onclick="doSignOut()">${esc(t('signOut'))}</button>
  </div>`;
}
async function doCreateRoom(){
  const myName = (document.getElementById('createMyName').value||'').trim();
  const name = (document.getElementById('newAppName').value||'').trim();
  if(!myName){ toast(t('needName')); return; }
  const btn = document.getElementById('createBtn'); if(btn) btn.disabled = true;
  try{ await rpcCreateRoom(name, myName); await route(); }
  catch(e){ toast(pairErr(e)); if(btn) btn.disabled = false; }
}
async function doJoinRoom(){
  const myName = (document.getElementById('joinMyName').value||'').trim();
  const code = (document.getElementById('joinCode').value||'').trim();
  if(!myName){ toast(t('needName')); return; }
  if(!code){ toast(t('needCode')); return; }
  const btn = document.getElementById('joinBtn'); if(btn) btn.disabled = true;
  try{ await rpcJoinRoom(code, myName); await route(); }
  catch(e){ toast(pairErr(e)); if(btn) btn.disabled = false; }
}
function pairErr(e){
  const m = (e && e.message) ? e.message.toLowerCase() : '';
  if(m.indexOf('already in a room') >= 0) return t('already');
  if(m.indexOf('full') >= 0) return t('roomFull');
  if(m.indexOf('no such code') >= 0) return t('noCode');
  return t('errNet');
}
async function doSignOut(){
  try{ await authSignOut(); }catch(e){}
  APP_STATE = 'signin'; authEmail = ''; render();
}

/* ==================================================================
   Header
================================================================== */
function vHeader(){
  const title = S.appName ? esc(S.appName) : `<span class="soft" style="font-style:italic">${esc(t('unnamed'))}</span>`;
  const me = S.mySeat, them = other(me);
  const themChip = S.partnerPresent
    ? `<span class="chip static"><i class="dot ${them}"></i>${esc(nameOf(them))}</span>`
    : `<span class="chip static" style="opacity:.55"><i class="dot ${them}"></i>…</span>`;
  return `
  <header>
    <div>
      <p class="eyebrow">${esc(t('holding'))}</p>
      <div class="who">
        <span class="chip static on"><i class="dot ${me}"></i>${esc(nameOf(me))}</span>
        ${themChip}
      </div>
    </div>
    <div style="text-align:end">
      <button class="gear" onclick="go('settings')" aria-label="Settings">⚙︎</button>
      <p class="small soft" style="margin:0">${title}</p>
    </div>
  </header>`;
}

/* ==================================================================
   Home (day room)
================================================================== */
function vHome(){
  const me = S.mySeat, them = other(me);
  let html = '';

  html += `<button class="door" onclick="enterStorm()">${esc(t('hardMoment'))} →</button>`;

  // Waiting for the partner to join — show the invite code.
  if(!S.partnerPresent){
    html += `<div class="card waitcard">
      <p class="eyebrow">${esc(t('waitingTitle'))}</p>
      <p class="small">${esc(t('waitingBody'))}</p>
      <div class="codebox">${esc(S.inviteCode||'')}</div>
      <button class="big" onclick="copyCode()">${esc(t('copyCode'))}</button>
    </div>`;
  }

  // Waiting signals from the other person (read-when-ready)
  if(S.storm){
    const unseen = S.storm.signals.filter(s=>s.by===them && !s.seen);
    if(unseen.length){
      html += `<div class="card waitcard">
        <p>${esc(t('waiting',{name:nameOf(them)}))}</p>
        <button class="big primary" onclick="enterStorm()">${esc(t('openReady'))}</button>
      </div>`;
    }
  }

  // Daily prompt (optional starter)
  const pk = dayKey();
  const myAns = S.journal.find(e=>e.promptDay===pk && e.by===me);
  const theirAns = S.journal.find(e=>e.promptDay===pk && e.by===them);
  html += `<div class="card">
    <p class="eyebrow">${esc(t('todayPrompt'))}</p>
    <p style="font-size:18px">${esc(todayPrompt())}</p>`;
  if(!myAns){
    html += `<textarea id="promptBox" rows="2" oninput="drafts.prompt=this.value">${esc(drafts.prompt)}</textarea>
      <button class="big primary" style="margin-top:10px" onclick="answerPrompt()">${esc(t('answerPrompt'))}</button>`;
  } else if(!theirAns){
    html += `<p class="sealed small">${esc(t('promptSealedYou',{name:nameOf(them)}))}</p>`;
  }
  html += `</div>`;

  // One-time invitation to the calm-day deck session
  if(!S.deckInviteDismissed){
    html += `<div class="card"><p class="eyebrow">${esc(t('ritualTitle'))}</p>
      <p class="small">${esc(t('ritualBody'))}</p>
      <button class="big primary" style="margin:8px 0 4px" onclick="ritualOpen()">${esc(t('ritualOpen'))}</button>
      <button class="ghost" onclick="ritualDismiss()">${esc(t('ritualLater'))}</button></div>`;
  }

  // Open flags — "worth talking about" entries not yet talked about
  const flags = S.journal.filter(e=>e.tag==='talk' && !e.resolved);
  if(flags.length){
    html += `<div class="card"><p class="eyebrow">${esc(t('flagsTitle'))}</p>`;
    for(const f of flags){
      const short = f.text.length>90 ? f.text.slice(0,90)+'…' : f.text;
      html += `<div class="flagrow"><div style="flex:1">
        <div class="meta"><i class="dot ${f.by}"></i>${esc(nameOf(f.by))}</div>
        <div class="small">${esc(short)}</div></div>
        <button class="chip" onclick="resolveFlag('${f.id}')">${esc(t('resolveBtn'))}</button></div>`;
    }
    html += `</div>`;
  }

  // Compose
  html += `<div class="card">
    <textarea id="composeBox" rows="3" placeholder="…" oninput="drafts.compose=this.value">${esc(drafts.compose)}</textarea>
    <div class="toggle2">
      <button class="chip ${uiTag==='share'?'on':''}" onclick="setTag('share')">${esc(t('justShare'))}</button>
      <button class="chip ${uiTag==='talk'?'on':''}" onclick="setTag('talk')">${esc(t('worthTalk'))}</button>
    </div>
    <button class="big primary" onclick="addEntry()">${esc(t('leaveIt'))}</button>
  </div>`;

  html += vStream(me, them, pk);
  html += `<button class="ghost" onclick="go('deck')">${esc(t('deckTitle'))}</button>`;
  return html;
}
let uiTag = 'share';
function setTag(tg){ uiTag = tg; render(); }

async function answerPrompt(){
  const text = readDraft('prompt').trim(); if(!text) return;
  const { data, error } = await sb.from('journal_entries')
    .insert({ room_id:S.roomId, author_seat:S.mySeat, text, tag:'share', prompt_day:dayKey() })
    .select().single();
  if(error){ toast(t('errSave')); return; }
  drafts.prompt = '';
  S.journal.unshift(mapEntry(data)); render();
}
async function addEntry(){
  const text = readDraft('compose').trim(); if(!text) return;
  const tag = uiTag;
  const { data, error } = await sb.from('journal_entries')
    .insert({ room_id:S.roomId, author_seat:S.mySeat, text, tag })
    .select().single();
  if(error){ toast(t('errSave')); return; }
  drafts.compose = ''; uiTag = 'share';
  S.journal.unshift(mapEntry(data)); render();
}

function vStream(me, them, todayK){
  const visible = S.journal.filter(e=>{
    if(!e.promptDay) return true;
    // Prompt answers: sealed from the other person until both answered, or the next day.
    if(e.promptDay !== dayKey()) return true;
    const bothAnswered = S.journal.some(x=>x.promptDay===e.promptDay && x.by===me) &&
                         S.journal.some(x=>x.promptDay===e.promptDay && x.by===them);
    return e.by===me || bothAnswered;
  });
  if(!visible.length) return `<p class="soft small" style="text-align:center; padding:20px 10px">${esc(t('nothingYet'))}</p>`;
  let html = '', lastDay = '';
  for(const e of visible){
    const d = new Date(e.ts);
    const dk = d.toLocaleDateString(undefined, {weekday:'short', month:'short', day:'numeric'});
    if(dk!==lastDay){ html += `<div class="daydiv">${esc(dk)}</div>`; lastDay = dk; }
    html += `<div class="entry ${e.tag==='talk'?'talk':''}">
      <div class="meta"><i class="dot ${e.by}"></i>${esc(nameOf(e.by))}${e.promptDay?' · prompt':''} · ${d.toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'})}</div>
      <div>${esc(e.text)}</div>
      ${e.tag==='talk'?`<div class="tagline${e.resolved?' done':''}">${esc(e.resolved?t('talked'):t('worthTalk'))}</div>`:''}
      ${ackBlock(e, me)}
    </div>`;
  }
  return `<div class="card" style="padding:6px 14px">${html}</div>`;
}

let ackOpen = null;
function ackBlock(e, me){
  const acks = e.acks || {};
  let html = '';
  for(const pid of ['a','b']){
    if(pid!==me && acks[pid]){
      html += `<div class="ackline"><i class="dot ${pid}"></i>${esc(acks[pid])}</div>`;
    }
  }
  if(e.by!==me){
    if(ackOpen===e.id){
      html += `<div class="ackrow" style="flex-wrap:wrap">`;
      S.deck.acks.forEach((s,i)=>{
        html += `<button class="chip ackchip ${acks[me]===s?'on':''}" onclick="pickAck('${e.id}',${i})">${esc(s)}</button>`;
      });
      html += `<button class="chip ackchip" onclick="closeAckRow()">✕</button></div>`;
    } else {
      html += `<div class="ackrow">
        <button class="chip ackchip ${acks[me]?'on':''}" onclick="openAckRow('${e.id}')">${esc(acks[me] || t('respond'))}</button>
      </div>`;
    }
  }
  return html;
}
function openAckRow(id){ ackOpen = id; render(); }
function closeAckRow(){ ackOpen = null; render(); }
async function pickAck(id, i){
  const e = S.journal.find(x=>x.id===id); if(!e) return;
  const s = S.deck.acks[i];
  const acks = Object.assign({}, e.acks||{});
  if(acks[S.mySeat]===s) delete acks[S.mySeat];
  else acks[S.mySeat] = s;
  ackOpen = null;
  const { data, error } = await sb.from('journal_entries').update({ acks }).eq('id', id).select().single();
  if(error){ toast(t('errSave')); render(); return; }
  e.acks = data.acks || {};
  render();
}
async function resolveFlag(id){
  const e = S.journal.find(x=>x.id===id); if(!e) return;
  const iso = new Date().toISOString();
  const { error } = await sb.from('journal_entries').update({ resolved_at: iso }).eq('id', id);
  if(error){ toast(t('errSave')); return; }
  e.resolved = new Date(iso).getTime(); render();
}
function ritualOpen(){ S.deckInviteDismissed = true; go('deck'); roomUpdate({ ritual_dismissed:true }); }
async function ritualDismiss(){ S.deckInviteDismissed = true; render(); await roomUpdate({ ritual_dismissed:true }); }

function copyCode(){
  const code = S.inviteCode || '';
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(code).then(()=>toast(t('copied')), ()=>toast(code));
  } else { toast(code); }
}

/* ==================================================================
   Storm (dusk room)
================================================================== */
function enterStorm(){
  document.documentElement.dataset.room = 'dusk';
  if(!S.storm){
    // local draft so the room renders instantly; persisted on first action
    S.storm = { id:null, startedTs:Date.now(), signals:[], checkin:[{id:null, round_no:1, a:null, b:null, revealed:false}], notes:[] };
  }
  go('storm');
  ensureStorm().then(()=>render());
}
async function ensureStorm(){
  if(S.storm && S.storm.id) return S.storm;
  const open = await sb.from('storms').select('id').eq('room_id', S.roomId).is('closed_at', null).limit(1);
  if(!open.error && open.data && open.data.length){ await fetchRoom(); return S.storm; }
  const ins = await sb.from('storms').insert({ room_id: S.roomId }).select().single();
  if(ins.error){ await fetchRoom(); return S.storm; }   // partner may have created one concurrently
  await sb.from('storm_rounds').insert({ storm_id: ins.data.id, round_no: 1 });
  await fetchRoom();
  return S.storm;
}

function vStorm(){
  const me = S.mySeat, them = other(me);
  const st = S.storm;
  let html = `<p class="soft small" style="text-align:center">${esc(t('stormNote'))}</p>`;
  html += `<div class="ladder">`;

  // Rung 1 — signal
  html += `<div class="rung card">
    <p class="rungnum">1 · ${esc(t('rung1'))}</p>
    <p class="small soft">${esc(t('rung1sub',{name:nameOf(them)}))}</p>`;
  for(let i=0;i<S.deck.signals.length;i++){
    html += `<button class="opt" onclick="sendSignal(${i})">${esc(S.deck.signals[i])}</button>`;
  }
  const mine = st.signals.filter(s=>s.by===me);
  if(mine.length){
    html += `<p class="small soft">${esc(t('signalSent',{name:nameOf(them)}))}</p>`;
  }
  const unseen = st.signals.filter(s=>s.by===them && !s.seen);
  const seen = st.signals.filter(s=>s.by===them && s.seen);
  if(unseen.length){
    html += `<div class="card waitcard" style="margin-top:8px">
      <p>${esc(t('waiting',{name:nameOf(them)}))}</p>
      <button class="big primary" onclick="openSignals()">${esc(t('openReady'))}</button>
    </div>`;
  }
  if(seen.length){
    html += `<p class="small soft" style="margin-top:8px">${esc(t('seenSignals'))}:</p>`;
    for(const s of seen){ html += `<p style="margin:2px 0">“${esc(s.text)}” <span class="small soft">— ${esc(nameOf(s.by))}</span></p>`; }
  }
  html += `</div>`;

  // Rung 2 — check-ins in rounds; every revealed round stays on the page
  html += `<div class="rung card"><p class="rungnum">2 · ${esc(t('rung2'))}</p>`;
  const rounds = st.checkin;
  const cur = rounds[rounds.length-1];
  for(const r of rounds){
    if(r.revealed){
      const ts = Math.max(r.a?r.a.ts:0, r.b?r.b.ts:0);
      html += `<p class="small soft" style="margin:10px 0 2px">${esc(new Date(ts).toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'}))}</p>`;
      html += vRevealedRound(r, me, them);
    }
  }
  if(!cur.revealed){
    if(cur[me] && cur[them]){
      html += `<p>${esc(t('bothSealed'))}</p>
        <button class="big primary" onclick="revealCheckin()">${esc(t('reveal'))}</button>`;
    } else if(cur[me]){
      html += `<p class="sealed">${esc(t('sealHand',{name:nameOf(them)}))}</p>`;
    } else {
      if(rounds.length===1) html += `<p class="small soft">${esc(t('rung2sub'))}</p>`;
      html += vCheckinForm();
    }
  } else {
    html += `<button class="opt" style="margin-top:10px" onclick="startNewRound()">${esc(t('checkAgain'))}</button>`;
  }
  html += `</div>`;

  // Rung 3 — alternating exchange of a few words; history stays
  const unlocked = rounds.some(r=>r.a && r.b);
  html += `<div class="rung card ${unlocked?'':'locked'}"><p class="rungnum">3 · ${esc(t('rung3'))}</p>`;
  if(!unlocked){
    html += `<p class="sealed small">${esc(t('rung3locked'))}</p>`;
  } else {
    html += `<p class="small soft">${esc(t('rung3sub'))}</p>`;
    for(const n of st.notes){
      html += `<div class="ackline" style="margin-top:8px"><i class="dot ${n.by}"></i>${esc(nameOf(n.by))} · ${esc(new Date(n.ts).toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'}))}</div>
        <p style="margin:2px 0">“${esc(n.text)}”</p>`;
    }
    const last = st.notes[st.notes.length-1];
    const myTurn = !last || last.by !== me;
    if(myTurn){
      html += `<textarea id="wordsBox" rows="3" maxlength="300" oninput="drafts.words=this.value">${esc(drafts.words)}</textarea>
        <button class="big primary" style="margin-top:10px" onclick="sendWords()">${esc(t('send',{name:nameOf(them)}))}</button>`;
    } else {
      html += `<p class="small sealed" style="margin-top:8px">${esc(t('penPassed',{name:nameOf(them)}))}</p>`;
    }
  }
  html += `</div>`;
  html += `</div>`; // close ladder

  // Ready → find each other (based on the latest revealed round)
  let lastRev = null;
  for(let i=rounds.length-1;i>=0;i--){ if(rounds[i].revealed){ lastRev = rounds[i]; break; } }
  if(lastRev && lastRev.a && lastRev.b && lastRev.a.ready===2 && lastRev.b.ready===2){
    html += `<div class="findeachother">
      <div class="mark merged"><i></i><i></i></div>
      <h2>${esc(t('findTitle'))}</h2>
      <p class="soft">${esc(t('findSub'))}</p>
      <button class="big primary" onclick="closeStorm()">${esc(t('closeStorm'))}</button>
    </div>`;
  } else {
    html += `<button class="ghost" onclick="closeStorm()">${esc(t('skipTalk'))}</button>`;
  }
  html += `<button class="ghost" onclick="go('home')">${esc(t('stepOut'))}</button>`;
  return html;
}
async function sendSignal(i){
  const text = S.deck.signals[i];
  const st = await ensureStorm();
  if(!st || !st.id){ toast(t('errSave')); return; }
  const { data, error } = await sb.from('storm_signals')
    .insert({ storm_id: st.id, by_seat: S.mySeat, text }).select().single();
  if(error){ toast(t('errSave')); return; }
  S.storm.signals.push(mapSignal(data)); render();
}
async function openSignals(){
  const them = other(S.mySeat);
  const ids = S.storm.signals.filter(s=>s.by===them && !s.seen).map(s=>s.id);
  if(!ids.length) return;
  S.storm.signals.forEach(s=>{ if(ids.indexOf(s.id)>=0) s.seen = true; });
  render();
  const { error } = await sb.from('storm_signals').update({ seen:true }).in('id', ids);
  if(error){ toast(t('errSave')); await safeRefetch(); }
}

/* check-in form state (per render session, not persisted until submit) */
let ck = {feel:[], depth:null, need:null, ready:null};
function vCheckinForm(){
  let html = `<p style="margin-top:10px"><strong>${esc(t('q1'))}</strong></p><div class="wordchips">`;
  S.deck.feelings.forEach((f,i)=>{
    html += `<button class="chip ${ck.feel.includes(i)?'on':''}" onclick="ckFeel(${i})">${esc(f)}</button>`;
  });
  html += `</div><p class="small soft">${esc(t('q1depth'))}</p><div class="segs">`;
  T.en.depth.forEach((d,i)=>{
    html += `<button class="chip ${ck.depth===i?'on':''}" onclick="ckDepth(${i})">${esc(d)}</button>`;
  });
  html += `</div><p style="margin-top:12px"><strong>${esc(t('q2'))}</strong></p><div class="wordchips">`;
  S.deck.needs.forEach((n,i)=>{
    html += `<button class="chip ${ck.need===i?'on':''}" onclick="ckNeed(${i})">${esc(n)}</button>`;
  });
  html += `</div><p style="margin-top:12px"><strong>${esc(t('q3'))}</strong></p><div class="segs">`;
  T.en.ready.forEach((r,i)=>{
    html += `<button class="chip ${ck.ready===i?'on':''}" onclick="ckReady(${i})">${esc(r)}</button>`;
  });
  html += `</div>
    <button class="big primary" style="margin-top:14px" ${ck.ready===null?'disabled':''} onclick="submitCheckin()">${esc(t('save'))}</button>`;
  return html;
}
function ckFeel(i){
  const at = ck.feel.indexOf(i);
  if(at>=0) ck.feel.splice(at,1);
  else if(ck.feel.length<2) ck.feel.push(i);
  render();
}
function ckDepth(i){ ck.depth=i; render(); }
function ckNeed(i){ ck.need=i; render(); }
function ckReady(i){ ck.ready=i; render(); }
async function submitCheckin(){
  if(ck.ready===null) return;
  const st = await ensureStorm();
  if(!st || !st.id){ toast(t('errSave')); return; }
  const cur = currentRound();
  const ans = { feel: ck.feel.slice(), depth: ck.depth, need: ck.need, ready: ck.ready, ts: Date.now() };
  const patch = S.mySeat==='a' ? { a_answer: ans } : { b_answer: ans };
  const { data, error } = await sb.from('storm_rounds').update(patch).eq('id', cur.id).select().single();
  if(error){ toast(t('errSave')); return; }
  ck = {feel:[], depth:null, need:null, ready:null};
  const r = S.storm.checkin.find(x=>x.id===cur.id);
  if(r){ r.a = data.a_answer||null; r.b = data.b_answer||null; }
  render();
}
async function revealCheckin(){
  const cur = currentRound();
  const { error } = await sb.from('storm_rounds').update({ revealed:true }).eq('id', cur.id);
  if(error){ toast(t('errSave')); return; }
  cur.revealed = true; render();
}
async function startNewRound(){
  const st = S.storm;
  const maxNo = st.checkin.reduce((m,r)=>Math.max(m, r.round_no||0), 0);
  const { data, error } = await sb.from('storm_rounds')
    .insert({ storm_id: st.id, round_no: maxNo+1 }).select().single();
  if(error){ toast(t('errSave')); return; }
  st.checkin.push(mapRound(data)); render();
}
function vRevealedRound(r, me, them){
  function side(id){
    const c = r[id];
    const feels = c.feel.map(i=>S.deck.feelings[i]).join(', ') || '—';
    const depth = c.depth===null ? '' : ' · ' + T.en.depth[c.depth].toLowerCase();
    const need = c.need===null ? '—' : S.deck.needs[c.need];
    return `<div><div class="nm"><i class="dot ${id}"></i>${esc(nameOf(id))}</div>
      <p class="small" style="margin:2px 0">${esc(feels)}${esc(depth)}</p>
      <p class="small" style="margin:2px 0"><span class="soft">needs:</span> ${esc(need)}</p>
      <p class="small" style="margin:2px 0"><span class="soft">talk:</span> ${esc(T.en.ready[c.ready].toLowerCase())}</p></div>`;
  }
  return `<div class="reveal2">${side(me)}${side(them)}</div>`;
}
async function sendWords(){
  const text = readDraft('words').trim(); if(!text) return;
  const st = await ensureStorm();
  if(!st || !st.id){ toast(t('errSave')); return; }
  const { data, error } = await sb.from('storm_notes')
    .insert({ storm_id: st.id, by_seat: S.mySeat, text }).select().single();
  if(error){ toast(t('errSave')); return; }
  drafts.words = '';
  S.storm.notes.push(mapNote(data)); render();
}
async function closeStorm(){
  if(S.storm && S.storm.id){
    const unseen = S.storm.signals.some(s=>!s.seen);
    const cur = currentRound();
    const pendingRound = !cur.revealed && (cur.a || cur.b);
    if((unseen || pendingRound) && !confirm(t('closeAnyway'))) return;
    const { error } = await sb.from('storms').update({ closed_at: new Date().toISOString() }).eq('id', S.storm.id);
    if(error){ toast(t('errSave')); return; }
  }
  S.storm = null; go('home');
}

/* ==================================================================
   Deck (edit together on a calm day)
================================================================== */
function vDeck(){
  let html = `<h2>${esc(t('deckTitle'))}</h2>
    <p class="small soft">${esc(t('deckSub'))}</p>`;
  html += deckSection('signals', t('signals'));
  html += deckSection('feelings', t('feelings'));
  html += deckSection('needs', t('needs'));
  html += deckSection('acks', t('acksLabel'));
  html += `<p class="small soft">${esc(t('customNote'))}</p>`;
  html += `<button class="ghost" onclick="go('home')">${esc(t('back'))}</button>`;
  return html;
}
function deckSection(kind, label){
  let html = `<div class="card"><p class="eyebrow">${esc(label)}</p>`;
  S.deck[kind].forEach((item,i)=>{
    if(S.ui.editing && S.ui.editing.kind===kind && S.ui.editing.i===i){
      html += `<div class="deckrow">
        <input type="text" id="deckEdit" value="${esc(item)}">
        <button onclick="deckSave('${kind}',${i})">✓</button>
        <button onclick="deckCancel()">✕</button>
      </div>`;
    } else {
      html += `<div class="deckrow"><span>${esc(item)}</span>
        <button onclick="deckEdit('${kind}',${i})" aria-label="${esc(t('edit'))}">✎</button>
        <button onclick="deckDel('${kind}',${i})" aria-label="${esc(t('del'))}">✕</button>
      </div>`;
    }
  });
  if(S.ui.editing && S.ui.editing.kind===kind && S.ui.editing.i===-1){
    html += `<div class="deckrow">
      <input type="text" id="deckEdit" value="">
      <button onclick="deckSave('${kind}',-1)">✓</button>
      <button onclick="deckCancel()">✕</button>
    </div>`;
  } else {
    html += `<button class="ghost" style="margin:4px 0 0" onclick="deckAdd('${kind}')">+ ${esc(t('add'))}</button>`;
  }
  html += `</div>`;
  return html;
}
function deckEdit(kind,i){ S.ui.editing = {kind,i}; render(); const el=document.getElementById('deckEdit'); if(el){el.focus();} }
function deckAdd(kind){ S.ui.editing = {kind,i:-1}; render(); const el=document.getElementById('deckEdit'); if(el){el.focus();} }
function deckCancel(){ S.ui.editing = null; render(); }
async function deckSave(kind,i){
  const el = document.getElementById('deckEdit');
  const v = el.value.trim(); if(!v){ deckCancel(); return; }
  if(i===-1) S.deck[kind].push(v);
  else S.deck[kind][i] = v;
  S.ui.editing = null; render();
  await roomUpdate({ deck: S.deck });
}
async function deckDel(kind,i){
  S.deck[kind].splice(i,1); render();
  await roomUpdate({ deck: S.deck });
}

/* ==================================================================
   Settings
================================================================== */
function vSettings(){
  const me = S.mySeat, them = other(me);
  const themName = S.partnerPresent ? esc(nameOf(them)) : `<span class="soft">${esc(t('notJoinedYet'))}</span>`;
  let html = `<h2>${esc(t('settings'))}</h2>
  <div class="card">
    <p class="eyebrow">${esc(t('names'))}</p>
    <p class="small"><i class="dot ${me}"></i>${esc(t('youAre'))} · <strong>${esc(nameOf(me))}</strong></p>
    <p class="small"><i class="dot ${them}"></i>${esc(t('them'))} · ${themName}</p>
    <p class="small soft" style="margin-top:6px">${esc(t('nameSetNote'))}</p>
    <p class="eyebrow" style="margin-top:14px">${esc(t('appName'))}</p>
    <input type="text" id="setApp" value="${esc(S.appName)}" placeholder="—">
    <button class="big primary" style="margin-top:12px" onclick="saveSettings()">${esc(t('save'))}</button>
  </div>
  <div class="card">
    <p class="eyebrow">${esc(t('inviteCodeLabel'))}</p>
    <div class="codebox">${esc(S.inviteCode||'')}</div>
    <button class="big" onclick="copyCode()">${esc(t('copyCode'))}</button>
  </div>
  <div class="card">
    <p class="eyebrow">${esc(t('language'))}</p>
    <div class="segs">`;
  for(const l of LANGS){
    html += `<button class="chip ${S.lang===l.code?'on':''}" ${l.ready?'':'disabled'} onclick="setLang('${l.code}')">${esc(l.label)}</button>`;
  }
  html += `</div><p class="small soft">${esc(t('langNote'))}</p></div>
  <div class="card">
    <p class="eyebrow">backup</p>
    <p class="small soft">${esc(t('backupNote'))}</p>
    <button class="big" onclick="exportData()">${esc(t('exportBtn'))}</button>
    <button class="big" style="margin:0" onclick="document.getElementById('importFile').click()">${esc(t('importV1Btn'))}</button>
    <input type="file" id="importFile" accept="application/json" style="display:none" onchange="importV1(event)">
    <p class="small soft" style="margin-top:8px">${esc(t('importV1Note'))}</p>
  </div>
  <div class="card">
    <p class="eyebrow">${esc(t('notifyTitle'))}</p>
    <div class="segs">
      <button class="chip ${S.emailNotify?'on':''}" onclick="setNotify(true)">${esc(t('notifyOn'))}</button>
      <button class="chip ${!S.emailNotify?'on':''}" onclick="setNotify(false)">${esc(t('notifyOff'))}</button>
    </div>
    <p class="small soft">${esc(t('notifyNote',{name:nameOf(them)}))}</p>
  </div>
  <div class="card">
    <p class="eyebrow">${esc(t('account'))}</p>
    <button class="big" style="margin:0 0 10px" onclick="doSignOut()">${esc(t('signOut'))}</button>
    <button class="big" style="color:var(--danger); margin:0" onclick="startFresh()">${esc(t('fresh'))}</button>
  </div>
  <button class="ghost" onclick="go('home')">${esc(t('back'))}</button>`;
  return html;
}
async function saveSettings(){
  const appName = document.getElementById('setApp').value.trim();
  S.appName = appName;
  go('home');
  await roomUpdate({ name: appName });
}
function setLang(code){ S.lang = code; localStorage.setItem('cp_lang', code); render(); }
async function setNotify(on){
  S.emailNotify = on; render();
  const { error } = await sb.rpc('set_email_notifications', { p_on: on });
  if(error){ toast(t('errSave')); await safeRefetch(); }
}

async function startFresh(){
  if(!confirm(t('leaveConfirm'))) return;
  try{ await rpcLeaveRoom(); }
  catch(e){ toast(t('errNet')); return; }
  APP_STATE = 'pair'; render();
}

/* ---------------- Backup export / v1 import ---------------- */
function exportData(){
  const blob = new Blob([JSON.stringify(S)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = (S.appName ? S.appName.replace(/\s+/g,'-')+'-' : '') + 'backup-' + dayKey() + '.json';
  a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href), 2000);
}
function importV1(ev){
  const f = ev.target.files && ev.target.files[0]; if(!f) return;
  const r = new FileReader();
  r.onload = async () => {
    try{
      const d = JSON.parse(r.result);
      if(!d || d.v!==1 || !d.people || !Array.isArray(d.journal)) throw 0;
      if(!d.journal.length){ alert(t('importEmpty')); return; }
      if(!confirm(t('importV1Confirm',{n:d.journal.length}))) return;
      const rows = d.journal.map(e=>({
        room_id: S.roomId,
        author_seat: (e.by==='a'||e.by==='b') ? e.by : 'a',
        text: String(e.text||'').slice(0,4000),
        tag: (e.tag==='talk') ? 'talk' : 'share',
        prompt_day: e.promptDay || null,
        resolved_at: e.resolved ? new Date(e.resolved).toISOString() : null,
        acks: e.acks || {},
        created_at: e.ts ? new Date(e.ts).toISOString() : new Date().toISOString()
      }));
      const { error } = await sb.from('journal_entries').insert(rows);
      if(error){ toast(t('errSave')); return; }
      toast(t('importDone',{n:rows.length}));
      await safeRefetch();
    }catch(err){ alert(t('importBad')); }
  };
  r.readAsText(f);
  ev.target.value = '';
}

/* ---------------- Go ---------------- */
boot();
