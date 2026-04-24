# FRQNCY — Make Everything Live (Next Steps)

You only have to do three things. Each one takes 1–5 minutes. After this, the
homepage signups, the social platform (auth, posting, DMs, profile uploads),
and the personalized chart all work on the live site, with everything saved to
your Supabase project for real.

The work I already did is in this commit and will deploy automatically once
you push to `main`. The three steps below are dashboard-only — Supabase and
Cloudflare both block AI automation in their UIs, so you have to click them.

---

## Step 1 — Apply two database migrations (3 min)

These are idempotent (safe to re-run). They:
- Fix a bug that was breaking direct messages (`conversation_members` policy
  was infinitely recursing — that's why /social/messages was throwing 500)
- Add a `subscribers` table for the homepage email signup
- Add a `charts` table for the personalized chart / Sanctuary
- Create three Supabase Storage buckets: `avatars`, `post-media`,
  `chart-exports` — with RLS that ties file access to the owner's user ID

**How:**

1. Open the Supabase SQL Editor:
   <https://supabase.com/dashboard/project/vyazlspbmwmlyncdlezh/sql/new>
2. Open `supabase/migrations/002_fix_conversation_rls.sql` in your editor,
   copy the entire file, paste into the Supabase SQL editor, click **Run**.
3. Repeat with `supabase/migrations/003_subscribers_charts_storage.sql`.

You should see "Success. No rows returned" for each. If you re-run them,
you'll see the same — they're idempotent.

**Verify:**

```bash
URL="https://vyazlspbmwmlyncdlezh.supabase.co"
KEY="sb_publishable_zFdrbkExarUfR2PAe4FcAQ_yvcL31CI"
curl -s -o /dev/null -w "subscribers: %{http_code}\n" "$URL/rest/v1/subscribers?limit=1" -H "apikey: $KEY" -H "Authorization: Bearer $KEY"
curl -s -o /dev/null -w "charts:      %{http_code}\n" "$URL/rest/v1/charts?limit=1"      -H "apikey: $KEY" -H "Authorization: Bearer $KEY"
curl -s -o /dev/null -w "messages:    %{http_code}\n" "$URL/rest/v1/messages?limit=1"    -H "apikey: $KEY" -H "Authorization: Bearer $KEY"
```

You want to see `200` on all three. Before the migrations: subscribers = 404,
charts = 404, messages = 500.

---

## Step 2 — Add the Supabase service-role key to Cloudflare Pages (2 min)

The new `/api/subscribe` endpoint needs the *service-role* key (not the public
anon key) so it can write to `subscribers` from the server side. The service
key is a secret — it lives only in Cloudflare's environment, never in the
browser.

**How:**

1. Get the service-role key:
   <https://supabase.com/dashboard/project/vyazlspbmwmlyncdlezh/settings/api>
   → "Project API keys" → copy the `service_role` value (starts with `eyJ…`).
2. Open Cloudflare Pages:
   Cloudflare Dashboard → Pages → your `frqncy-website` project → **Settings →
   Environment variables**.
3. Add **for Production** (and Preview if you want):

   | Variable name                | Value                                   |
   |------------------------------|-----------------------------------------|
   | `PUBLIC_SUPABASE_URL`        | `https://vyazlspbmwmlyncdlezh.supabase.co` |
   | `SUPABASE_SERVICE_ROLE_KEY`  | (the service_role key from Supabase)    |

4. Click **Save**, then **Deployments → Retry latest** (or just push a commit).

**Why two:** `PUBLIC_SUPABASE_URL` is also baked into the social app at build
time — keeping it in Cloudflare env vars too means future builds pick it up
without you editing files.

---

## Step 3 — (Optional but recommended) Wire up Resend for the welcome email (5 min)

Without this, the homepage subscribe still works — you just don't get a welcome
email sent. With it, every new subscriber gets the gold-on-navy "You are love
and light" welcome email immediately.

**How:**

1. Sign up at <https://resend.com> (free, 3000 emails/month).
2. Go to **API Keys → Create API Key** → copy it (starts with `re_…`).
3. (Optional but better) Verify the `frqncy.network` domain under **Domains →
   Add Domain**, follow the DNS instructions. Until you do this, emails will
   come from `onboarding@resend.dev`, which is fine for testing but ugly.
4. Add to Cloudflare Pages env vars:

   | Variable name      | Value                                          |
   |--------------------|------------------------------------------------|
   | `RESEND_API_KEY`   | `re_your_key_here`                             |
   | `RESEND_FROM`      | `FRQNCY <hello@frqncy.network>` (after domain verify) |

5. Redeploy.

If `RESEND_API_KEY` is unset, the API gracefully skips the email and the
subscription still saves. You can add Resend later without changing any code.

---

## What you get after these three steps

- **Homepage subscribe forms** (overlay + contact section) save real emails to
  `subscribers` in Supabase. You can query `SELECT * FROM subscribers ORDER BY
  created_at DESC` any time. Welcome email goes out automatically.
- **/social/login/** signup, magic link, password login — all already work.
- **/social/** feed, posts, likes, comments, bookmarks, follows — all work.
- **/social/messages/** DMs — fixed by migration 002, will work after deploy.
- **/social/profile/[username]/** profile pages with avatars — work, with
  uploads going to the new `avatars` bucket.
- **My FRQNCY chart** + **Sanctuary dashboard** — when a logged-in user opens
  these pages, an "auth pill" appears in the nav. Their Sanctuary state
  (dream, chief aims, objectives, goals, habits, scoreboards) auto-syncs to
  Supabase — they can switch devices and pick up where they left off.
- **Anonymous visitors** still get the local-storage experience — nothing
  forces login. Login is a soft upgrade.

---

## Troubleshooting

**Subscribe form says "Subscription temporarily unavailable":**
The Cloudflare Function couldn't reach Supabase or its env vars are missing.
Check the Pages deployment logs (Cloudflare Dashboard → Pages → frqncy-website
→ Functions → Logs).

**Signup works but profile page is blank:**
The `handle_new_user` trigger in migration 001 should have created a profile
row. Run `SELECT * FROM profiles WHERE id = 'YOUR_UID'` to confirm. If empty,
re-run migration 001's profile trigger section.

**DMs still 500 after migration 002:**
Re-check that migration 002 ran without errors. The fix is the
`is_conversation_member` SECURITY DEFINER function.

**Sanctuary doesn't sync after login:**
Open browser devtools → Console. Look for `[sanctuary] cloud attach failed`
warnings. Most common cause: migration 003 wasn't applied, so the `charts`
table doesn't exist yet.

---

## Files I changed in this round

- `supabase/migrations/002_fix_conversation_rls.sql` — **new**
- `supabase/migrations/003_subscribers_charts_storage.sql` — **new**
- `functions/api/subscribe.js` — **new** (Cloudflare Pages Function)
- `assets/frqncy-supabase.js` — **new** (shared auth + cloud-sync library)
- `index.js` — homepage subscribe now POSTs to `/api/subscribe` (was
  fire-and-forget Substack)
- `index.html` — adds auth pill, fixes success copy
- `my-frqncy.html`, `chart.html` — adds auth pill
- `my-frqncy/dashboard/index.html` — adds auth pill + cloud sync (when logged
  in, all Sanctuary state mirrors to Supabase; when logged out, falls back to
  localStorage as before)
