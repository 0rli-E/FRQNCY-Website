---
title: "NRG · FRQNCY Social — Go-Live Checklist for 100 Users"
date: 2026-05-16
status: ready-for-execution
audience: Orlando (dashboard-only actions)
---

# NRG Go-Live Checklist for 100 Users

What's been done in code (already pushed):
- All 21 Supabase migrations applied to production project `vyazlspbmwmlyncdlezh` (002-021, including a fix for migration 011's invalid `CREATE POLICY IF NOT EXISTS` syntax).
- `@atproto/oauth-client-browser` + `@noble/curves` installed → Bluesky OAuth + Nostr publishing are functional in code.
- OAuth client metadata at `/social/profile/bluesky-oauth-client.json` (publicly resolvable on push to CF Pages).
- Privy button shows honest "Wallet (coming soon)" copy when env var unset (no more dead clicks).
- SetupSecureDMs gated key-gen flow live in `/social/messages/`.
- Nostr keygen UI live in `/social/profile/keys/`.

## Critical (must do before announcing to users)

### 1. Upgrade Supabase to Pro tier — **$25/mo**

Free tier limits will bite at scale:
- **Email throughput:** Free tier sends **4 magic-link emails/hour**. For 100 signups in a launch window, this bottlenecks for ~25 hours.
- **DB size:** 500MB free, 8GB on Pro. Each user's posts/messages/keys = ~50-200KB. 100 active users for 6 months ≈ ~100MB. You'll hit limits around 1,000 users but Pro is the right tier from day one.
- **Egress:** 1GB/mo free, 50GB/mo Pro. With encrypted media in DMs at 100 users, you'll hit free-tier wall in week 1.
- **Concurrent connections:** Free 60, Pro 200. At 100 users browsing simultaneously, free will throttle.

**Action:** https://supabase.com/dashboard/project/vyazlspbmwmlyncdlezh/settings/billing → upgrade to Pro.

### 2. Set up custom SMTP for transactional email

Even on Supabase Pro, the built-in email service is rate-limited and not branded. Use a real provider.

**Recommended:** Resend (https://resend.com) — free tier covers 3,000/mo + 100/day. Perfect for 100 users.

1. Sign up at https://resend.com
2. Add and verify your domain (frqncy.network) — DKIM, SPF, return-path. Takes ~30 min DNS propagation.
3. Get your Resend API key.
4. In Supabase: Dashboard → Project Settings → Authentication → Email → SMTP Settings:
   - Host: `smtp.resend.com`
   - Port: `465`
   - Username: `resend`
   - Password: `<your Resend API key>`
   - Sender email: `hello@frqncy.network` (or whichever address you verified)
   - Sender name: `FRQNCY`
5. Customize the auth email templates while you're there (Magic Link, Reset Password, Confirm Signup). Default templates work but are generic.

### 3. Verify the SetupSecureDMs flow end-to-end

The flow has never been used by a real human. **Before announcing**, do one round-trip yourself:

1. Sign up with a fresh email at https://frqncy.network/social/login
2. Verify the magic-link email arrives (proves SMTP works)
3. Visit `/social/messages/` — confirm the "Set up secure DMs" banner shows
4. Click through → confirm SetupSecureDMs modal flow works (intro → generating → done)
5. Visit `/social/profile/keys/` — confirm your encryption + signing keys show
6. Make a backup with a passphrase you'll remember (test the import flow on a different browser if you can)
7. Post something. Confirm it appears in the feed.
8. Get a friend to do the same and DM each other. Confirm encryption banner shows "end-to-end encrypted" on both ends.

If any step breaks: report back what you saw and we'll fix.

## Important (do soon, not blocking)

### 4. Decide on Privy

Options (pick one):
- **A. Configure Privy** — go to https://dashboard.privy.io, create an app named "NRG · FRQNCY Social", enable email/Google/external-wallet login, get the App ID (`cmd...`), set `PUBLIC_PRIVY_APP_ID` in Cloudflare Pages env vars. **Caveat:** the wallet doesn't currently do anything functional (per the Onchain expert critique). Configuring it without a wallet-affordance ships dead UI.
- **B. Defer Privy** — current state. Button shows "Wallet (coming soon)". No env var needed. Recommended unless you have a wallet feature to ship Q3.

### 5. Connect a Bluesky account for cross-post testing

If you want users to see Bluesky federation working:
1. Have one test account go to `/social/profile/connections/`
2. Connect with the **OAuth flow** (now installed) using your Bluesky handle
3. Post something on NRG. Confirm it appears on bsky.app within seconds.
4. Reply to that post on bsky.app. Confirm the reply appears under the NRG post within ~24h (nightly refresh).

### 6. Stripe membership (optional)

Skip unless you want to charge for Network Member tier:
1. Sign up at https://stripe.com
2. Create a "Network Member" product with two prices: monthly + annual
3. Configure webhook at `https://frqncy.network/api/stripe-webhook` for `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Set Cloudflare Pages env vars: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_ANNUAL`

## Nice-to-have (post-launch)

- Monitoring: Cloudflare Analytics is free + auto-enabled. Supabase has built-in logs in Dashboard → Logs Explorer.
- Moderation tooling: zero exists today. At 100 users, your inbox can be the moderation queue. At 1,000 users, build a block/report flow (new `reports` + `blocks` tables, simple admin view).
- Real LLM Ask backend: `/api/ask` currently redirects to `/browse`. Wire to Anthropic SDK + FRQNCY MCP server for RAG over the 146-topic corpus.

## What's still false / dormant — honest copy guidance

Until the bridges are wired AND users have opted in, the [[nrg-no-decentralization-overclaim]] memory applies. Defensible launch copy:

> "FRQNCY Social (NRG) is in early access. Your posts and profile live on FRQNCY's encrypted backend. Direct messages are end-to-end encrypted (server-blind) when you set up keys. Bluesky and Nostr publishing are opt-in — your content only federates when you turn them on. Membership and embedded-wallet features are on the way."

Banished phrases until bridges activate: "decentralized social", "federated", "user-owned data", "censorship-resistant", "permanent on the open web".

## Test checklist for the first 10 friends

Before opening to 100, get 10 friends through the full flow. Watch for:
- Signup email arrives within 30s
- Magic link works on mobile (not just desktop)
- First post posts
- DM round-trip works with encryption banner
- Profile shows correctly
- No console errors in DevTools
- Mobile Safari + Chrome both work (Preact + Privy peer-dep weirdness happens here)
- Search on `/browse` returns matches

Iterate on whatever breaks. Then open to the wider 100.
