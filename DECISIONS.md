# Decisions

Append-only, dated. One line each, with the why.

- 2026-07-23 — Ported the v1 feel-test to the live Supabase backend as a static,
  no-build GitHub Pages app (index.html + styles.css + config/sync/app.js).
  Rationale: v1 was a single-device localStorage prototype; the backend (schema,
  RLS, pairing RPCs, realtime) was already deployed and verified.
- 2026-07-23 — Vendored the Supabase JS client at `vendor/supabase.js` instead
  of a CDN `<script>`. Rationale: no runtime CDN dependency, and it's ready to
  bundle for the Capacitor phase. The proxied build/test network also can't
  reach public CDNs.
- 2026-07-23 — Realtime uses debounced full-room refetch on any change rather
  than surgical row patching. Rationale: a two-person room is tiny; refetch is
  simpler and less bug-prone than reconciling individual events.
- 2026-07-23 — Kept intra-room sealing (day prompts, check-in rounds) as a
  client-side courtesy, matching v1 and the backend's documented trust boundary.
  Cross-couple isolation is the real, RLS-enforced wall. Revisit behind
  security-definer RPCs before any public release.
- 2026-07-23 — Did **not** modify the "done" backend. Display-name rename was
  dropped rather than shipped as a silently-failing button, because `members`
  is SELECT-only to clients (no UPDATE policy). Names are set at pairing; a small
  `rename_self` RPC can restore editing later if wanted.
- 2026-07-23 — "Start fresh" became "Leave this room" (calls `leave_room`),
  reflecting the real multi-device semantics: you unpair, and the room is deleted
  only when the last person leaves (cascades everything).
- 2026-07-23 — Included the one-time v1-backup importer (Settings) that inserts a
  v1 export's journal entries into the room with original timestamps preserved —
  completing Phase B's remaining "bring in a backup" item.
- 2026-07-23 — Email notifications: AFTER INSERT triggers on journal_entries and
  storm_signals call an Edge Function (via pg_net) that emails the *other*
  partner a nudge. Emails are deliberately **content-free** — the intimate text
  never leaves the app/DB — per sensitive-app-design. Per-member opt-out lives
  on members.email_notifications, toggled from Settings via the
  set_email_notifications RPC (members is otherwise read-only to clients). The
  trigger is fire-and-forget and swallows errors so a failed notification can
  never block a write. Real native push is deferred to Phase C (Capacitor).
