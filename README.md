# couple-application

A private, two-person space: a shared journal for ordinary days and a slower,
structured "storm" room for the hard ones. Two people on two devices share one
**room**; everything syncs through Supabase with row-level security.

This is the synced build of the v1 feel-test — same look, copy, and flows, now
backed by a real database instead of one device's local storage.

## How it's built

- **Static, no build step.** Plain `index.html` + `styles.css` + three scripts.
  Deploys as-is to GitHub Pages.
- **`vendor/supabase.js`** — the Supabase JS client (v2 UMD), vendored so there
  is no runtime CDN dependency and it's ready to bundle for the Capacitor phase.
- **`config.js`** — the project URL and the *publishable* key. The publishable
  key is meant to ship in the client; it is not a secret. RLS protects the data.
  The service-role key must never appear here.
- **`sync.js`** — auth, pairing, room load, realtime, and the offline read-cache.
  Builds a state object in the same shape the v1 UI expects.
- **`app.js`** — the ported views and interactions.

## Configuration

Everything client-safe lives in `config.js`:

```js
window.CP_CONFIG = {
  SUPABASE_URL: 'https://sjgnmwlzbejkaoaieihq.supabase.co',
  SUPABASE_KEY: 'sb_publishable_…'   // publishable key — safe in the client
};
```

## ⚠️ Required before sign-in works: enable email auth in the dashboard

The app uses passwordless email one-time-code sign-in. That depends on a
dashboard setting the code can't turn on from here. **Until this is done, "Send
me a code" will fail.** In the Supabase dashboard for project `couple-app`:

1. **Authentication → Providers → Email**: enable the Email provider.
2. **Custom SMTP** is required to edit templates and to send at any real volume.
   The built-in sender is rate-limited and can't be customized. Gmail works:
   host `smtp.gmail.com`, port `465`, username = your Gmail, password = a Google
   **App Password** (needs 2-Step Verification on — a normal password is rejected
   with `534 5.7.9 Application-specific password required`).
3. **Authentication → Email Templates**: add the code line to **both** the
   **"Confirm signup"** and **"Magic Link"** templates — new users get the
   first, returning users the second:
   ```html
   <p style="font-size:28px; font-weight:bold; letter-spacing:6px;">{{ .Token }}</p>
   ```
4. **Authentication → URL Configuration**: set **Site URL** and add a **Redirect
   URL** of the deployed app path (e.g. `https://<user>.github.io/couple-application/`),
   not the account root — otherwise the email's fallback link 404s.
5. **Authentication → Rate limits**: raise "emails per hour" above your expected
   number of testers.

Leaked-password protection can stay off — there are no passwords here.

## Email notifications (optional)

When one partner posts, the other gets a **content-free** email nudge ("… left
something for you — open the app"). The words never leave the app/database. Each
person can turn it off in **Settings → Email notifications** (stored on
`members.email_notifications`).

Backend already applied (migration `couple_app_email_notifications`): the
opt-out column, the `set_email_notifications` RPC, `pg_net`, a Vault secret
`notify_secret`, and AFTER INSERT triggers on `journal_entries` /
`storm_signals` that call the `notify` Edge Function.

To turn it on you must deploy the function and set its secrets:

1. Deploy `supabase/functions/notify/index.ts` (Dashboard → Edge Functions, or
   `supabase functions deploy notify --no-verify-jwt`). It uses custom
   header auth, so JWT verification stays **off**.
2. Set these Edge Function secrets (Dashboard → Edge Functions → Manage secrets):
   - `NOTIFY_SECRET` — must equal the value stored in Vault as `notify_secret`.
   - `GMAIL_USER` — the Gmail address used for SMTP.
   - `GMAIL_APP_PASSWORD` — the same Google App Password used for auth email.

   (`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically.)

Until the function is deployed, the triggers fire harmlessly (the POST just
fails and is swallowed) — writes are never affected.

## Deploy to GitHub Pages

1. Merge to the default branch (or point Pages at this branch).
2. Repo **Settings → Pages → Build and deployment → Source: Deploy from a
   branch**, folder `/ (root)`.
3. Open the published URL. One partner taps **Start a new room** and shares the
   invite code; the other taps **Join with a code**.

## Bringing v1 entries in

If you have a v1 backup file (the JSON the old single-file app exported),
**Settings → Bring in v1 entries** imports its journal entries into your room,
preserving their original dates, tags, acknowledgments, and resolved state. It's
a one-time move — running it twice creates duplicates.

## What's verified vs. what isn't

- **Verified** (headless Chromium, `rendertest.mjs`): every screen renders
  without error; the day-prompt and check-in **sealing** hides the partner's
  unrevealed answers; storm rungs, reveal, and notes work; the sign-in screen
  loads and the Supabase client initializes.
- **Not yet verified end-to-end**: live sign-in and live database reads/writes.
  A session can't be created until the dashboard email step above is done, so
  the queries and realtime — written against the confirmed schema and RLS
  policies — haven't been exercised against a live login. Do one real
  create/join round once auth is enabled.

## Known limitations (carried over deliberately)

- **Intra-room sealing is a client-side courtesy.** Cross-couple isolation is
  enforced by RLS and proven. Within a room, a determined partner could read an
  unrevealed row directly; that moves behind security-definer RPCs before any
  public release. Not a gate for a four-person trial.
- **Realtime** relies on the client's auth token being applied to the realtime
  connection (supabase-js default). If live updates lag, the app still resyncs
  on every action and on reload.
- **Concurrent brand-new storms**: if both partners open a fresh storm in the
  same second, two storm rows could be created. Rare; the next load reconciles
  to one. A `unique(room_id) where closed_at is null` index would close this if
  it ever matters.
- **Renaming**: display names are set when each person joins (the `members`
  table is read-only to clients). Changing a name means leave + rejoin, or a
  small backend RPC if that becomes annoying.

## Local dev / test

```bash
npm install playwright-core          # browsers are pre-provisioned in CI images
node smoketest.mjs                    # boots the app, checks sign-in + no errors
node rendertest.mjs                   # injects an in-room state, renders every view
```
