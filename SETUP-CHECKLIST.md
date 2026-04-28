# FRQNCY — Human Setup Checklist

Everything an agent can't do for you. Work through these in order — each section builds on the last.

> **Status as of 2026-04-28:** the live site is deployed; chat widget runs on free Cloudflare Workers AI; HD AI Reading Worker is deployed (commit `8fc27ff`); Sanctuary cloud-sync code is shipped but blocked on three dashboard steps (migrations + env vars). The current focused checklist is `SETUP-NEXT-STEPS.md` — three steps, ~5 minutes total. **Do those first.** This doc is the broader ongoing checklist.

---

## 1. Apply the pending Supabase migrations + Cloudflare env vars

This is the active blocker for everything else. See `SETUP-NEXT-STEPS.md` and `HANDOFF-2026-04-28-MAKE-EVERYTHING-LIVE.md` for the full context. Three steps:

- [ ] Run `supabase/migrations/002_fix_conversation_rls.sql` and `003_subscribers_charts_storage.sql` in the Supabase SQL editor (project `vyazlspbmwmlyncdlezh`).
- [ ] Add `PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to Cloudflare Pages env vars (Production + Preview).
- [ ] Verify the `AI` Workers AI binding exists on the Pages project (powers the chat widget).
- [ ] Optional: sign up for Resend, verify the `frqncy.network` domain, add `RESEND_API_KEY` and `RESEND_FROM` env vars so subscribe-form welcome emails send from `hello@frqncy.network` instead of `onboarding@resend.dev`.

After this, smoke-test with the three curls in `SETUP-NEXT-STEPS.md`. All three should return 200.

---

## 2. Push any locally staged work

Cowork sandbox can't always commit cleanly (bindfs blocks `.git/HEAD.lock` removal on some commits). When that happens, run from your own terminal:

```bash
cd ~/Documents/Claude/Projects/FRQNCY\ WEBSITE
rm -f .git/HEAD.lock .git/index.lock
git status
git add .
git commit -m "<descriptive message>"
git push
```

Cloudflare Pages auto-deploys from `main` via `.github/workflows/build.yml`.

---

## 3. Cloudflare Pages — confirm setup

The site auto-deploys from GitHub. If a fresh project setup is ever needed:

- [ ] Cloudflare Dashboard → Pages → connect the GitHub repo.
- [ ] Build output directory: repo root (it's a static site).
- [ ] Custom domain: `frqncy.network` pointed to Cloudflare Pages (DNS via Cloudflare nameservers).
- [ ] Bindings: `AI` (Workers AI) — required for chat widget.
- [ ] Env vars: `PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, optionally `RESEND_API_KEY` + `RESEND_FROM`.

---

## 4. HD AI Reading Worker — already deployed

Status: deployed (commit `8fc27ff`, "Deploy: HD reading Cloudflare Worker live").

The "Get AI Reading" button on `/chart.html` calls `workers/hd-reading.js`, deployed as a Cloudflare Worker. If you ever need to redeploy:

```bash
cd workers
wrangler deploy
```

The worker uses the `AI` binding (Workers AI / Qwen 30B). If `WORKER_URL` in `chart.html` ever drifts from the deployed URL, update the constant near the top of the inline `<script>` block.

---

## 5. Chat widget — already wired

Status: deployed and working when the `AI` binding is set on Pages.

Runs on free Cloudflare Workers AI (`@cf/qwen/qwen3-30b-a3b-fp8`) — **no Anthropic API key required**. See `CHATBOT-SETUP.md` for full details. Earlier versions of this doc told you to set `ANTHROPIC_API_KEY` — that requirement has been retired; the key is now optional, paid-fallback only.

---

## 6. Email / Newsletter — Resend wiring

The homepage subscribe forms now POST to `/api/subscribe` (Cloudflare Pages Function), which writes to the `subscribers` Supabase table and sends a welcome email via Resend if `RESEND_API_KEY` is set. Substack is no longer the sink.

- [ ] Resend account at [resend.com](https://resend.com) (free, 3000 emails/month).
- [ ] Verify the `frqncy.network` domain (DNS records in Cloudflare DNS).
- [ ] Set `RESEND_API_KEY` and `RESEND_FROM` (e.g. `FRQNCY <hello@frqncy.network>`) in Pages env vars.
- [ ] Without these, the subscribe endpoint still saves to Supabase and gracefully skips the welcome email.

---

## 7. Email address — `hello@frqncy.network`

Referenced as the contact email across the site.

- [ ] Cloudflare Email Routing (free, in your Cloudflare dashboard) → forward `hello@frqncy.network` to your personal mailbox.
- [ ] Or use Google Workspace / Zoho if you want a real mailbox.

---

## 8. Social / Branding accounts

Referenced in meta tags and footer:

- [ ] `@frqncy` on Twitter/X (already in `<meta name="twitter:site">`).
- [ ] Other social handles as you ship them (Instagram, YouTube, etc.).

---

## 9. Analytics verification

Plausible script lives on every page (`plausible.io/js/script.js`, domain `frqncy.network`).

- [ ] Log into [plausible.io](https://plausible.io), confirm `frqncy.network` is registered.
- [ ] Verify pageviews flow after each deploy.

---

## 10. Content gaps to fill over time

Tracked across `proposals/CONTENT-DEPTH-AUDIT.md` and `proposals/EXECUTION-PLAN-90D.md`. Not blockers; ongoing editorial work:

- [ ] ~50 topic pages still in stub state — each gets a unique commission, one at a time, per the Phase 5 reframe (no more templated batch sweeps).
- [ ] Add more **people** resources (currently ~3.5% of the library).
- [ ] Add curated video resources to topics that have none.
- [ ] Eastern tradition topics underrepresented (Buddhism, Hinduism, Taoism).
- [ ] Generate unique OG images for the ~6 topics with TODO placeholders.

---

## Priority order

1. **Apply the migrations + env vars** (Section 1) — unblocks the whole social platform + Sanctuary sync.
2. **Push local staged work** (Section 2) — gets everything to `main` and auto-deployed.
3. **Verify chat widget binding + Resend wiring** (Sections 5–6) — small, polishes the user-facing surface.
4. **Email forwarding** (Section 7) — makes `hello@frqncy.network` reachable.
5. **Everything else** at your own pace, driven by `EXECUTION-PLAN-90D.md`.
