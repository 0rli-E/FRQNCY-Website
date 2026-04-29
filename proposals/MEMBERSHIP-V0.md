# Membership v0 — design notes

Per `EXECUTION-PLAN-90D.md` Phase 3 Wk 5 Mon–Tue. FRQNCY's first revenue surface goes live as one tier (Network Member) with a Stripe-test-mode-first wiring and a quiet referral attribution layer. No leaderboard. No tier ladder. No paywalled teaching.

---

## Why one tier

`REVENUE-MODEL.md` lists five revenue surfaces. Membership is one of them and the simplest one to ship under a $100 budget. The principle that constrains the design is that **every teaching lives on the site** (per `CLAUDE.md`), so the membership offer cannot be "unlock the deeper teaching." It has to be "support the network."

One tier (Network Member) is the smallest experiment that tests whether the offer resonates. A multi-tier ladder pushes people toward upgrades they don't need and turns membership into a status game. We can add a second tier later when the first FRQNCY Space opens (Space-member access) — but the digital network stays one membership.

## What membership is

- A way to **support the editorial work and the infrastructure** that keeps the public site free for everyone else.
- A small set of practical conveniences that come from being closer to how the work is made.

## What membership is NOT

- It is not "exclusive insights," "premium content," "members-only teaching." Those phrases would violate the editorial value that every teaching lives on the site.
- It is not a FOMO surface. There is no "founding member discount expires in 24 hours," no "limited time," no countdown.
- It is not a leaderboard. Referrers are attributed but never publicly ranked. Per `CLAUDE.md`: "no ranking people."

## What members get

Honest list. The whole list visible on `/membership/`:

1. **Early access to commissioned content.** When a topic page or profile gets the bespoke "every page is its own piece" treatment (Phase 5 reframe in the 90-day plan), members see it first. It still lands on the public site shortly after.
2. **Monthly community gathering.** A small live call. No replays gated, no upsell.
3. **Member-only Substack thread.** A working channel — what's being made, what's being decided, what's stuck.
4. **Name on the colophon.** Public list of people who underwrite the network. Opt-in.

These are real and small. None gate teaching content.

## What members fund (transparency)

`/membership/` lists four lines under "What your support funds":

1. Editorial work — the picks, the topic pages, the resource curation, the voice.
2. Infrastructure — hosting, search, AI chat, the chart engine, the Sanctuary backend.
3. Contributor honoraria — when a teacher's work shapes a topic page, they get paid.
4. The Fund seed — small carve-out to the longer-horizon Fund pillar.

This is the precondition for the offer being credible. People paying need to know what the money does.

## Voice constraints

These are non-negotiable in any membership-related copy (page, email, dropdown text, social post):

- **NEVER** "exclusive," "premium content," "members only insights," "unlock the deeper teaching" — every teaching lives on the site.
- **NEVER** scarcity / FOMO framing — "limited time," "founding member discount expires," "only 100 spots."
- **NEVER** ranking referrers — "top referrer this month," "leaderboard," "your rank."
- **DO** frame as "support the network," "be named on the colophon," "join the gathering," "fund the editorial work."

If a phrase would feel at home on a typical SaaS pricing page, it's wrong here.

## Architecture

### Storage

Migration 013 adds three tables in `supabase/migrations/013_membership_referrals.sql`:

- `memberships` — one row per profile. Tier, status (active / past_due / canceled / trialing), Stripe customer + subscription IDs, current period end. RLS: owner-only SELECT. INSERT/UPDATE only via the service-role webhook.
- `ref_codes` — 6-char per-profile referral codes. PRIMARY KEY on `code`. Public-readable so `/?ref=XYZ` resolves at signup time. Codes are not secrets.
- `ref_signups` — attribution log. `referrer_id`, `referred_id`, `ref_code`, `became_member` flag. RLS: referrer sees rows where they referred someone, referred sees their own row, no public aggregation surface anywhere.

### Stripe wiring

Two Cloudflare Pages Functions:

- `functions/api/checkout-session.js` — `POST /api/checkout-session` opens a Stripe Checkout Session in subscription mode. Body: `{ tier, user_id, email, ref_code? }`. Returns `{ url }`. Calls Stripe REST directly via `fetch` — no SDK. Carries `client_reference_id = user_id` and `metadata.ref_code` for the webhook.
- `functions/api/stripe-webhook.js` — `POST /api/stripe-webhook` verifies the Stripe signature using `STRIPE_WEBHOOK_SECRET`, then handles three events: `checkout.session.completed` upserts the membership row and flips any matching `ref_signups.became_member` to true; `customer.subscription.updated` syncs status + `current_period_end`; `customer.subscription.deleted` sets status = `canceled`. Uses the service-role key, bypassing RLS.

If `STRIPE_SECRET_KEY` or `STRIPE_WEBHOOK_SECRET` is unset, both endpoints return 503 with a clear error message. Failing loud beats failing silent.

### Required env vars (Cloudflare Pages → Settings → Environment variables)

- `STRIPE_SECRET_KEY` — `sk_test_...` for testing, `sk_live_...` for production.
- `STRIPE_WEBHOOK_SECRET` — `whsec_...` for the configured webhook endpoint.
- `STRIPE_PRICE_MONTHLY` — `price_...` for the monthly Network Member price.
- `STRIPE_PRICE_ANNUAL` — `price_...` for the annual Network Member price.
- `PUBLIC_SUPABASE_URL` — already set for the existing subscribe endpoint.
- `SUPABASE_SERVICE_ROLE_KEY` — already set for the existing subscribe endpoint.

### Stripe dashboard setup

Required steps before the page can charge anyone:

1. Create a "Network Member" product in Stripe.
2. Add a recurring monthly price → copy the price id into `STRIPE_PRICE_MONTHLY`.
3. Add a recurring annual price → copy the price id into `STRIPE_PRICE_ANNUAL`.
4. Configure a webhook endpoint at `https://frqncy.network/api/stripe-webhook` subscribed to: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`. Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
5. Test in Stripe test mode with the standard 4242 4242 4242 4242 card. Confirm the membership row lands in Supabase.
6. Switch to live keys when ready to soft-launch.

The page deliberately shows a "$X/mo, $Y/yr — to be set in Stripe" placeholder until the operator picks the price.

### Client wiring

- `assets/frqncy-membership.js` — vanilla ES module. Exports: `getMyMembership`, `getOrCreateRefCode`, `getMyRefSignups`, `attributeSignup`, `captureRefFromUrl`, `readStoredRefCode`. Uses the existing `window.frqncy.client` from `assets/frqncy-supabase.js`.
- `membership/index.html` — vanilla page. Two CTAs (`Become a member` monthly + annual) call `/api/checkout-session`. Referral block renders only when signed in: shows the user's 6-char code, a copyable `frqncy.network/?ref=XYZ` link, and a count of friends who joined via them.
- Inline `?ref=XYZ` capture script in `index.html` mirrors `captureRefFromUrl()` so signups via Privy or Supabase auth pick up the referrer.
- `social-src/src/components/AuthForm.tsx` — after a successful signup, if a ref code is in localStorage, `attributeSignup(refCode, newUserId)` is called fire-and-forget. Never blocks the signup confirmation message.
- `social-src/src/components/NavAuth.tsx` — `Membership` link added to the user dropdown below `Connections`.
- `my-frqncy.html` — small "Become a member" pill rendered when the user is signed in but has no active/trialing membership row. Hidden for members and signed-out visitors.

## What's deferred

- **Member-only surfaces.** The 90-day plan Wk 5 Wed lists "behind member: advanced charts, AI HD reading, full course lessons." That gating logic isn't in v0. Membership currently grants no access changes — only attribution and a colophon entry. The teaching layer remains the same for everyone. We will revisit per-surface gating once the first paying members exist and we know what they actually want.
- **Crypto payments.** Stripe-only for v0. Crypto path is queued.
- **Member-only Substack thread setup.** Manual for now — operator adds members to the thread by hand from the Stripe customer list.
- **Colophon page.** A public colophon listing supporting members lands as a follow-up (members can already opt in via a profile flag we'll add).

## Files in this change

Created:
- `supabase/migrations/013_membership_referrals.sql`
- `functions/api/checkout-session.js`
- `functions/api/stripe-webhook.js`
- `assets/frqncy-membership.js`

Modified:
- `membership/index.html` — rebuilt around the one-tier offer + referral block.
- `index.html` — inline `?ref=XYZ` capture script in `<head>`.
- `my-frqncy.html` — "Become a member" pill section + script.
- `social-src/src/components/NavAuth.tsx` — Membership link in dropdown.
- `social-src/src/components/AuthForm.tsx` — fire-and-forget `attributeSignup` after signup.

Documentation:
- `proposals/MEMBERSHIP-V0.md` — this doc.
- `proposals/EXECUTION-PLAN-90D.md` — Phase 3 Wk 5 Mon–Tue marked shipped.
- `NRG-LAUNCH-CHECKLIST.md` — migration 013 + Stripe env vars + dashboard steps added.

## Acceptance test (manual)

1. Apply migration 013 in Supabase.
2. Set `STRIPE_SECRET_KEY` (test mode), `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_ANNUAL`, `STRIPE_WEBHOOK_SECRET` in Cloudflare Pages env vars.
3. Configure the webhook in Stripe dashboard.
4. Sign in as a test user. Visit `/membership/`. Confirm the referral card appears with a 6-char code.
5. Click "Become a member". Stripe checkout opens. Use `4242 4242 4242 4242`. Complete checkout.
6. Land back on `/membership/?status=success`. Refresh after a few seconds. Confirm a row exists in `memberships` with `status='active'`.
7. Open a different browser. Visit `/?ref=<the-code>`. Sign up as a new user. Confirm a `ref_signups` row exists with `referred_id = the-new-user`, `became_member = false`.
8. As that new user, click "Become a member" → checkout → success. Confirm the `ref_signups` row's `became_member` flips to `true`.

When all eight steps pass, Membership v0 is live.
