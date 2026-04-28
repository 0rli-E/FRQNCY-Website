# Handoff — 2026-04-28 — "Make Everything Live"

This is a self-contained handoff doc for the next agent picking up the FRQNCY backend wiring work. Pair with `SETUP-NEXT-STEPS.md` (the user-facing dashboard checklist) and `CLAUDE.md` (the project orientation pack).

## The user's ask

Orlando wanted the website to actually work end-to-end: homepage subscribe forms persist real subscribers, the social platform (auth, posting, DMs, profile uploads) functions, and the personalized chart / Sanctuary dashboard syncs per-user. His exact framing was that if someone signs up they should "actually be signed up and logged in" and everything they do — posts, uploads, chart, dreambuilding — "stays on the website for them to work with and adjust."

He gave three constraining decisions during clarification:
- Email vendor: long-term thinking, not Substack — answer landed on Supabase as the source of truth + Resend for transactional sends.
- Chart persistence: "only for logged-in users." Anonymous visitors keep their localStorage experience.
- Storage: open question, "do research." Answer landed on Supabase Storage now, structured for a clean R2 swap later.

## What was wrong before this session

Three concrete defects on the live site, plus three missing capabilities.

The defects: `/social/messages/` was returning 500 because the `conversation_members_select_member` RLS policy was self-referencing — classic infinite-recursion pattern where a SELECT policy on a table queries the same table inside the policy body. The homepage subscribe form was a fire-and-forget `fetch` to a Substack endpoint with `mode: 'no-cors'` — no record was kept anywhere we control. The Sanctuary dashboard was localStorage-only with no per-user persistence path.

The missing capabilities: no `subscribers` table, no `charts` table, no Supabase Storage buckets for avatars / post media / chart exports.

## What was built

Two SQL migrations, one Cloudflare Pages Function, one shared front-end auth library, edits to the four pages that needed auth UI or cloud sync, and a setup doc.

`supabase/migrations/002_fix_conversation_rls.sql` — drops the recursive policies and replaces them with versions that delegate membership checks to a new `is_conversation_member(_conversation_id UUID, _user_id UUID)` function declared `SECURITY DEFINER STABLE`. SECURITY DEFINER lets the function bypass RLS when checking the membership table, which breaks the recursion. Idempotent — safe to re-run.

`supabase/migrations/003_subscribers_charts_storage.sql` — creates `subscribers` (id, email UNIQUE, profile_id FK nullable, source, referrer, confirmed, confirmed_at, unsubscribed_at, metadata JSONB) and `charts` (id, owner_id FK, name, data JSONB, dreams JSONB, is_public, slug). Inserts three rows into `storage.buckets`: `avatars` (public, 5MB, image types), `post-media` (public, 10MB, image types), `chart-exports` (private, 5MB, png/svg/pdf). RLS policies use the canonical `(storage.foldername(name))[1] = auth.uid()::text` pattern so each user owns their own folder. Idempotent.

`functions/api/subscribe.js` — Cloudflare Pages Function. POST endpoint with a 5/min/IP rate limit, email regex validation, upsert into `subscribers` via Supabase REST with `Prefer: resolution=merge-duplicates,return=representation`. Detects new vs existing subscriber by comparing the row's `created_at` to its `confirmed_at` within a 5-second window. Sends a Resend welcome email if `RESEND_API_KEY` is set; gracefully no-ops if not. Required env vars: `PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. Optional: `RESEND_API_KEY`, `RESEND_FROM`.

`assets/frqncy-supabase.js` — shared front-end library. Hardcodes the public Supabase URL and anon key, lazy-loads `@supabase/supabase-js@2.49.0` from jsdelivr if missing, exposes `window.frqncy` with: `ready` promise, `client`, `onAuth(fn)` subscription, an `auth` namespace (`getUser`, `signUp`, `signIn`, `signInMagic`, `signOut`), a `sanctuaryStore(user)` factory matching the existing `LocalStore` interface so it's a drop-in swap (`getState`, `setState`, `getImages`, `urlFor`, `putImage`, `deleteImage`, `clearImages`), and a `mountAuthPill(el, opts)` helper that renders a gold pill with green dot + username when logged in, grey "Log in" link when not. The cloud store reads/writes from a `charts` row keyed by `name = 'Sanctuary'` per user. Image blobs land in `chart-exports/<uid>/` with 1-hour signed URLs.

Front-end edits:
- `index.js` — homepage subscribe replaced; now POSTs to `/api/subscribe`, parses JSON, handles 429, distinguishes new vs returning ("Already on the list").
- `index.html` — added `<li id="frqncy-auth-pill">` to nav, script include, DOMContentLoaded `mountAuthPill` call, success-copy update.
- `my-frqncy.html`, `chart.html` — auth pill + script include only.
- `my-frqncy/dashboard/index.html` — auth pill + script include + a meaningful logic change: replaced the bare `const store = new LocalStore()` with stateful swap. New `attachCloudStore(user)` function ensures the user's `charts` row exists, migrates local→cloud if cloud is empty, otherwise adopts cloud and re-renders. A `frqncy.onAuth(user => …)` subscription swaps stores live on login/logout.

`SETUP-NEXT-STEPS.md` — three-step user-facing checklist (apply migrations, set env vars, optional Resend) with verification curls.

## What was verified live during the session

Signup hits `/social/login/` correctly — test user was created and a JWT issued. The `handle_new_user` trigger from migration 001 fired and created the profile row. RLS correctly blocked an unauthorized post insertion attempt (Supabase returned `42501` as expected). Migrations 002 and 003 are *not* yet applied — they were written, not executed. See "what's blocked on the user" below.

## What's blocked on the user (and why I cannot do it for them)

Three dashboard-only steps remain. None of them are work I can complete with the credentials I have, and I want this clear for the next agent so you don't waste effort trying.

The Supabase migrations require running DDL (`CREATE TABLE`, `CREATE POLICY`, `INSERT INTO storage.buckets`). I have the public anon key. The anon key talks to PostgREST and can do row CRUD subject to RLS — it cannot run schema migrations. The service-role key wouldn't help either; it also goes through PostgREST. Schema work needs one of: the Supabase SQL editor in the browser dashboard (which blocks AI agents from logging in, per vendor policy), the Management API with a personal access token, or `psql` with the database password. Until the user generates and shares one of those, the migrations sit in the repo waiting.

The Cloudflare Pages env vars (`PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, optionally `RESEND_API_KEY` and `RESEND_FROM`) require Cloudflare dashboard access — same vendor-policy block. Could be done via the Cloudflare API with a token, but again, only if the user provides the token.

The push-to-`main` step is just git — fully unblocked, just hasn't happened yet. The repo state is staged commits ready to push.

## Decisions made (with rationale, so the next agent doesn't relitigate them)

**Supabase as the email source of truth, Resend for transactional sends.** Substack would have meant the list lives somewhere we don't control, and welcome-email branding would be locked to their template. Owning the `subscribers` table means we can query, segment, export, and switch ESPs anytime. Resend is the right transactional layer (3000/mo free, good API, strong DX) and the subscribe function falls back gracefully if `RESEND_API_KEY` is unset.

**Single opt-in for now (`mailer_autoconfirm: true` stays on).** Friction matters most at the start when every signup is precious. Bots/typos aren't a real threat at FRQNCY's scale. Switching to double opt-in is one toggle in Supabase whenever it becomes a real problem.

**Supabase Storage now, R2-ready later.** Supabase Storage is good enough for current volume and keeps the data plane in one place (avoids a second auth model for file access). R2 is meaningfully cheaper at scale and has zero egress fees, so the move makes sense eventually. The image surface area is funnelled through `urlFor` / `putImage` / `deleteImage` in `frqncy-supabase.js` — swapping providers later is a one-file change, no schema or front-end churn.

**Sanctuary cloud sync is auth-gated, not auth-required.** Anonymous users keep the localStorage experience untouched. Logging in is a soft upgrade — the cloud adapter migrates local→cloud on first attach if cloud is empty, or adopts cloud state if it exists. No forced migration, no data loss path.

**Image migration deferred.** The text state of the Sanctuary syncs cleanly. The IndexedDB image blobs do *not* yet auto-upload to `chart-exports` on first cloud-attach. This is intentional — defer until a user actually complains about images not syncing across devices. The wiring's in place; it's a focused follow-up when the time comes.

## Pros/cons on the three deferred items (delivered to user this session)

Captured here so the next agent has the same view of the trade-offs without having to scroll the chat.

**Domain verification for Resend.** Switches the from-address from `onboarding@resend.dev` to `hello@frqncy.network`. Up: brand integrity (especially for FRQNCY's intimacy/presence pitch), better deliverability via SPF/DKIM/DMARC on a non-shared domain, real reply-to. Down: 5–15 min of DNS records (Cloudflare DNS, same dashboard), DNS propagation lag, need a real mailbox at `hello@…` (Cloudflare Email Routing forwarder is fine). Recommendation: do it before any real audience push; fine to skip for friends-and-family soft launch.

**Single vs double opt-in.** Currently single. Up of staying single: zero friction, no spam-folder cliff where would-be subscribers never confirm, simpler UX, immediate value (open chart, write first dream — no email-check intermission). Down of staying single: vulnerable to bot pollution and typo'd addresses (hurts long-term deliverability), weaker compliance posture if challenged. Up of switching to double: list hygiene, bot protection, stronger consent record, modest engagement quality boost. Down of switching: 20–40% conversion hit, more UX surface (confirmation page, resend flow, expired tokens), bad fit for "I want to post right now." Recommendation: stay single until either (a) deliverability matters in dollar terms, or (b) actual abuse appears. Middle path available — single opt-in for account signup, double for the homepage marketing list.

**Sanctuary image upload migration.** Up of fixing now: full device portability, escapes IndexedDB size/eviction limits (Safari ITP can purge), closes the confusing UX gap where text syncs but images don't. Down: bandwidth on first attach (30 images × 2MB = 60MB silent upload — needs UI affordance and chunked queue), storage cost at scale (Supabase free up to 1GB then $0.021/GB-mo; R2 cheaper later), de-dupe edge cases across devices, blob-URL → bucket-URL reference rewrite (transparently in the adapter, or one-shot in state JSON). Recommendation: defer until a user reports the gap. Code's structured to add cleanly when needed (~1 hr of careful work).

## Files touched this session

New:
- `supabase/migrations/002_fix_conversation_rls.sql`
- `supabase/migrations/003_subscribers_charts_storage.sql`
- `functions/api/subscribe.js`
- `assets/frqncy-supabase.js`
- `SETUP-NEXT-STEPS.md`
- `HANDOFF-2026-04-28-MAKE-EVERYTHING-LIVE.md` (this file)

Modified:
- `index.js`
- `index.html`
- `my-frqncy.html`
- `chart.html`
- `my-frqncy/dashboard/index.html`

## What the next agent should do first

Read this doc, read `SETUP-NEXT-STEPS.md`, then ask the user where they are on steps 1–3. If they've done them, the next priority is end-to-end smoke testing against the live site:

```bash
curl -s -o /dev/null -w "subscribers: %{http_code}\n" "https://vyazlspbmwmlyncdlezh.supabase.co/rest/v1/subscribers?limit=1" -H "apikey: sb_publishable_zFdrbkExarUfR2PAe4FcAQ_yvcL31CI" -H "Authorization: Bearer sb_publishable_zFdrbkExarUfR2PAe4FcAQ_yvcL31CI"
curl -s -o /dev/null -w "charts:      %{http_code}\n" "https://vyazlspbmwmlyncdlezh.supabase.co/rest/v1/charts?limit=1" -H "apikey: sb_publishable_zFdrbkExarUfR2PAe4FcAQ_yvcL31CI" -H "Authorization: Bearer sb_publishable_zFdrbkExarUfR2PAe4FcAQ_yvcL31CI"
curl -s -o /dev/null -w "messages:    %{http_code}\n" "https://vyazlspbmwmlyncdlezh.supabase.co/rest/v1/messages?limit=1" -H "apikey: sb_publishable_zFdrbkExarUfR2PAe4FcAQ_yvcL31CI" -H "Authorization: Bearer sb_publishable_zFdrbkExarUfR2PAe4FcAQ_yvcL31CI"
```

All three should be `200`. Before migrations: subscribers and charts return `404`, messages returns `500`.

If they haven't done the steps, the most efficient path is to ask whether they'd rather paste the SQL themselves (5 min total across both migrations) or generate a Supabase personal access token at <https://supabase.com/dashboard/account/tokens> so an agent can run the migrations via the Management API.

After smoke testing, the natural next workstream is the Sanctuary image migration if any user reports the gap, or domain verification for Resend if the user wants to start sharing the site widely.

## What NOT to do

Don't try to run the migrations through the anon key REST API — it doesn't support DDL and you'll waste an hour confirming that.

Don't try to log into the Supabase or Cloudflare dashboards via Claude in Chrome — both vendors block it on purpose and the interstitial will just stop you.

Don't change the `frqncy-supabase.js` interface (`getState`/`setState`/`getImages`/`urlFor`/`putImage`/`deleteImage`/`clearImages`) without updating the Sanctuary dashboard's `attachCloudStore` flow — the swap-on-login logic depends on the cloud store matching the LocalStore shape exactly.

Don't add forced-login walls anywhere. Login is a soft upgrade by design, per Orlando's direction.
