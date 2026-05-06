# Deploy Week 1 — terminal-ready runbook

Per `proposals/ROADMAP-90D-2026-05.md` Track 1. Until this is done, NRG
features in source are not in production. Estimated total active time:
~3–4 hours. Calendar: spread across 2–3 days.

This is the canonical version of `NRG-LAUNCH-CHECKLIST.md` for the
2026-05-03 deploy window. **Env var list is verified against actual
code consumption** (see `Env-var audit` section below — there's one
missing var that the old checklist didn't catch).

---

## Day 1 (Sat 03 May): Supabase migrations + dashboard prep

### 1. Apply all migrations 002 through 017

Open: <https://supabase.com/dashboard/project/vyazlspbmwmlyncdlezh/sql/new>

Paste + Run each in order. All sixteen are idempotent — safe to re-run if
any single one half-applies. Don't batch them in one paste; run one at a
time so any error message tells you exactly which migration broke.

```
1.  supabase/migrations/002_fix_conversation_rls.sql
2.  supabase/migrations/003_subscribers_charts_storage.sql
3.  supabase/migrations/004_conviction.sql
4.  supabase/migrations/005_search_indexes.sql
5.  supabase/migrations/006_messaging_e2ee.sql
6.  supabase/migrations/007_privy_identity.sql
7.  supabase/migrations/008_group_chat_encryption.sql
8.  supabase/migrations/009_signed_message_mirror.sql
9.  supabase/migrations/010_bluesky_handle.sql
10. supabase/migrations/011_encrypted_message_media.sql
11. supabase/migrations/012_practice_tracker.sql
12. supabase/migrations/013_membership_referrals.sql
13. supabase/migrations/014_course_purchases.sql
14. supabase/migrations/015_referral_rewards.sql
15. supabase/migrations/016_bluesky_uri_on_posts.sql
16. supabase/migrations/017_bluesky_reply_count.sql
```

**Verify after applying:** in SQL editor:

```sql
-- Should return 16+ rows including bluesky_uri, bluesky_reply_count
select column_name from information_schema.columns
 where table_name = 'posts' order by ordinal_position;

-- Should return ref_rewards table + founder_badge column
select column_name from information_schema.columns
 where table_name = 'profiles' and column_name in ('founder_badge', 'ethos_profile_id');
```

(The `ethos_profile_id` row will be NULL for now — that's migration 018,
shipping in Week 4.)

### 2. Create the Privy app (5 min, one-time)

1. Sign up / log in at <https://dashboard.privy.io>.
2. **Create a new app** named "NRG" or "FRQNCY". Pick "Embedded wallets" mode.
3. **App settings → Login methods:** enable Email, Google, External wallets.
4. **App settings → Allowed origins:**
   - `https://frqncy.network`
   - `https://frqncy-website.pages.dev`
   - `http://localhost:4321` (for local dev)
5. **App settings → Embedded wallets:** "Create on login: users without
   wallets". EVM only is fine for v1.
6. Copy the **App ID** (starts with `cmd...`). You'll paste this into
   Cloudflare Pages env vars in step 4.

### 3. Create Stripe products (10 min, one-time)

In Stripe Dashboard (test mode first, then promote to live later):

1. **Products → Add product**:
   - "Network Member · Monthly" — recurring monthly, set your price.
     Copy the price ID (`price_...`) — this is `STRIPE_PRICE_MONTHLY`.
   - "Network Member · Annual" — recurring annual, set your price.
     Copy the price ID — this is `STRIPE_PRICE_ANNUAL`.
   - "Quantum Grammar · Course" — one-time payment, $19. Copy the
     price ID and paste it into `courses.json` under the
     `quantum-grammar` entry as `stripe_price_id`.
2. **Developers → Webhooks → Add endpoint:**
   - URL: `https://frqncy.network/api/stripe-webhook`
   - Events: `checkout.session.completed`,
     `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy the **Signing secret** (`whsec_...`) — this is
     `STRIPE_WEBHOOK_SECRET`.
3. **Developers → API keys**: copy the **Secret key** (`sk_...`) — this
   is `STRIPE_SECRET_KEY`.

---

## Day 2 (Sun 04 May): Cloudflare Pages env vars + GitHub Actions secrets

### 4. Set Cloudflare Pages env vars

Cloudflare Dashboard → Pages → frqncy-website → Settings → Environment
variables. Add each as **Production** (and **Preview** if you want PR
previews working too).

**Required (code will fail-loud or fail-silent without these):**

| Var | Value source | Used by |
|---|---|---|
| `PUBLIC_SUPABASE_URL` | `https://vyazlspbmwmlyncdlezh.supabase.co` | client + every function |
| `PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API → anon/public key | **client SDK + post detail SSR** |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Project Settings → API → service_role key | webhooks, export, check-rewards, subscribe |
| `PUBLIC_PRIVY_APP_ID` | from step 2 (Privy app ID) | PrivyLoginButton |
| `STRIPE_SECRET_KEY` | from step 3 (Stripe secret key) | checkout-session |
| `STRIPE_WEBHOOK_SECRET` | from step 3 (whsec_) | stripe-webhook (signature verify) |
| `STRIPE_PRICE_MONTHLY` | from step 3 (price_ for monthly) | checkout-session |
| `STRIPE_PRICE_ANNUAL` | from step 3 (price_ for annual) | checkout-session |

**Bindings (different UI section, "Functions" → "Bindings"):**

| Binding | Type | Used by |
|---|---|---|
| `AI` | Workers AI | chat widget, illuminator, word illuminator |
| `ASSETS` | Pages built-in (auto) | profile + post SSR shells |
| `CRYPTO_CACHE` | KV namespace (optional) | crypto/market + crypto/projects |

**Optional (features degrade gracefully without):**

| Var | Used by | Fallback |
|---|---|---|
| `RESEND_API_KEY` | subscribe.js (welcome email) | skips email |
| `RESEND_FROM` | subscribe.js (sender) | defaults to `FRQNCY <onboarding@resend.dev>` |
| `NOTION_API_KEY` | crypto/projects.js (Notion-backed list) | endpoint returns empty |

### 5. Wire GitHub Actions secrets

Repo → Settings → Secrets and variables → Actions → New repository secret.

| Secret | Value source | Used by workflow step |
|---|---|---|
| `SUPABASE_URL` | same as PUBLIC_SUPABASE_URL above | resource-suggest, bluesky-counts-refresh |
| `SUPABASE_SERVICE_ROLE_KEY` | same as above | resource-suggest, bluesky-counts-refresh |
| `OPENROUTER_API_KEY` | <https://openrouter.ai/settings/keys> | domain-coverage-enrich |

(GitHub Actions secrets are scoped per-repo; the auto-grow workflow
won't fail if these aren't set — each script is `process.exit(0)` on
missing-env to keep the workflow green even pre-secrets.)

---

## Day 3 (Mon 05 May): Build + deploy + verify

### 6. Build social-src and copy to /social/

From your terminal (sandbox can't do this — bindfs blocks the rename
that npm needs):

```bash
cd ~/Documents/Claude/Projects/FRQNCY\ WEBSITE/social-src
rm -rf node_modules package-lock.json
npm install
npm run build
cp -r dist/* ../social/
```

If `npm install` complains about `@privy-io/react-auth` peer deps,
add `--legacy-peer-deps`. The Privy package wants React 18 strict;
our compat layer handles it.

### 7. Commit + push

```bash
cd ~/Documents/Claude/Projects/FRQNCY\ WEBSITE
git status   # sanity-check what's changed
git add -A
git commit -m "Deploy NRG: Bluesky bridge + reply backflow + count surface + 17 migrations"
git push
```

Cloudflare will auto-deploy. Watch the build: <https://dash.cloudflare.com>
→ Pages → frqncy-website → Deployments. ~2–3 minutes.

### 8. Smoke-test in production

In a fresh incognito browser:

```
[ ] Open https://frqncy.network/social — page loads, no console errors
[ ] Sign up with email — Supabase auth flow completes
[ ] Post a thread — appears in the feed within seconds (realtime)
[ ] Open a second incognito with a second account, follow yourself,
    confirm the follow lands
[ ] Comment on the first account's post from the second account
[ ] DM the first account from the second — encrypted indicator shows
[ ] /api/export?username=<your-handle> returns JSON with signed posts
[ ] Open /membership/ — sees the upgrade CTA, click → Stripe Checkout opens
[ ] Use Stripe test card 4242 4242 4242 4242 — webhook fires, membership
    row appears in Supabase (select * from memberships)
[ ] Connect Bluesky on /social/profile/connections/ (use a test handle +
    app password)
[ ] Post with cross-post toggle ON — confirm post appears on bsky.app
[ ] Open the post detail page on NRG — confirm "↗ on Bluesky" pill is
    NOT visible yet (count not synced) but the BlueskyReplies block IS
    visible if anyone has replied on bsky.app
```

### 9. Trigger the auto-grow workflow manually

```
GitHub repo → Actions → Auto-grow nightly → Run workflow → main
```

Watch the run. The bluesky-counts-refresh step should write counts
to `posts.bluesky_reply_count` for any cross-posted NRG posts. After
it completes, verify in Supabase SQL editor:

```sql
select id, bluesky_uri, bluesky_reply_count, bluesky_replies_synced_at
  from posts
 where bluesky_uri is not null
 order by created_at desc
 limit 10;
```

`bluesky_replies_synced_at` should now be a recent timestamp.

### 10. Day 3 exit criteria

- A logged-out visitor can land on `frqncy.network/social`, sign up,
  post, cross-post to Bluesky, and click through to see the federated
  reply thread.
- A second visitor can upgrade to Membership via Stripe and the webhook
  correctly creates a `memberships` row.
- The auto-grow workflow runs cleanly and writes Bluesky counts.

If all three are green, Track 1 is done. Track 2 (NRG-native depth)
starts Week 2.

---

## Day 4–5 (Tue 06 → Wed 07): Stress + buffer

### 11. Stress-test the Stripe webhook

Use the Stripe CLI:

```bash
brew install stripe/stripe-cli/stripe   # if not already installed
stripe login
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
```

Watch the Cloudflare Pages function logs:
`https://dash.cloudflare.com → Pages → frqncy-website → Functions → Logs`.

Each event should:
- Verify signature (no `signature-mismatch`)
- Either upsert / update / cancel the corresponding membership row

### 12. Test the referral reward flow end-to-end

```
[ ] Sign up account A
[ ] Get account A's ref_code from Supabase: select code from ref_codes where user_id = '<A>'
[ ] Sign up account B with ?ref=<code> in the URL
[ ] Verify ref_signups row created with referrer = A, referred = B, became_member = false
[ ] Upgrade account B to Membership via Stripe test card
[ ] Verify ref_signups.became_member flips to true
[ ] Hit /api/check-rewards?user_id=<A> — should return tier-3 grant
    if A has crossed 3 referrals
```

### 13. Day 4–5 buffer

There will be surprises. Reserve at least one full day for them.
Common ones to expect:

- A migration ordering issue (rare — they're idempotent — but possible
  if RLS state is in a weird shape from earlier manual edits)
- Stripe webhook signature failing on first event because the secret
  was copied with a trailing space
- Privy callback URL not whitelisted (add the prod origin in Privy
  dashboard → App settings → Allowed origins)

---

## Env-var audit (drift caught from previous checklist)

The previous `NRG-LAUNCH-CHECKLIST.md` was missing these — they would
have caused a silent client-side failure:

- **`PUBLIC_SUPABASE_ANON_KEY`** — required by both `social-src/src/lib/supabase.ts`
  (the client SDK) and `functions/social/post/[id].js` (the post-detail
  SSR shell). Without it, every NRG page that talks to Supabase is
  broken on the client side. **Set this before deploying.**
- **`CRYPTO_CACHE`** KV binding — only required if `/api/crypto/*`
  endpoints are in active use. The functions return empty without it
  but don't 500.
- **`NOTION_API_KEY`** — only required for the Notion-backed crypto
  projects list. The function returns empty without it.

Confirmed in code, all required env vars are now in the table in step 4.

---

## What to do if something breaks

- **Migration error:** read the message, find the migration, fix or
  skip. All migrations are wrapped in idempotent `IF NOT EXISTS` /
  `OR REPLACE` patterns; re-running should not break.
- **Cloudflare build fails:** check that all env vars are set with no
  trailing whitespace. Cloudflare's UI silently strips visible
  whitespace but trailing newlines from copy-paste have caused issues.
- **Stripe webhook 400s with signature-mismatch:** the secret was copied
  with extra whitespace, or you're hitting the test endpoint with a
  live event (or vice versa). Each Stripe webhook endpoint has its own
  secret.
- **Privy "redirect_uri not allowed":** add the deployed origin to
  Privy dashboard → App settings → Allowed origins.
- **Bluesky cross-post fails silently:** open browser console while
  posting, look for `[atproto]` warnings. App passwords expire;
  re-generate from Bluesky Settings → App Passwords if needed.

---

## After Week 1: starting Track 2

Once steps 1–13 are green, NRG is live. Move to
`proposals/ROADMAP-90D-2026-05.md` Track 2 Week 2: AI HD reading length
differentiation for members. That's a code change Claude can ship
end-to-end without operator gates.

Track 3 (Ethos read-only surface) starts Week 3 with the 30-min
Privy + Ethos auth spike.

Track 4 (member acquisition) starts Week 2 with homepage hero update
+ /about/why page + og:image for cross-posts. Personal outreach to ~30
people you know starts Week 3.
