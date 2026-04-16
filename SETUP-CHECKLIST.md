# FRQNCY — Human Setup Checklist

Everything Claude can't do for you. Work through these in order — each section builds on the last.

---

## 1. Push to GitHub

Your local repo has uncommitted work (HD topic data, chart explainer, AI reading, nav redesign, Worker file). This is the first step to get anything live.

- [ ] `git add .` and commit everything
- [ ] Push to `main` (triggers Cloudflare Pages auto-deploy)
- [ ] Verify the GitHub Action in `.github/workflows/build.yml` runs clean

---

## 2. Cloudflare Pages Setup

Your site auto-deploys from GitHub to Cloudflare Pages. If this isn't connected yet:

- [ ] Log into [Cloudflare Dashboard](https://dash.cloudflare.com) → Pages
- [ ] Create a project → Connect your GitHub repo
- [ ] Set build output directory (the repo root — it's a static site)
- [ ] Confirm `frqncy.network` custom domain is pointed to Cloudflare Pages (DNS → CNAME or nameservers)

---

## 3. Deploy the HD AI Reading Worker

This powers the "Get AI Reading" button on chart.html. Without it, the button still works — it falls back to a rich client-side reading — but the Worker adds AI-personalised insights via Qwen on Cloudflare's edge.

- [ ] In your terminal (with Wrangler installed):
  ```bash
  cd workers
  wrangler init frqncy-hd-reading
  ```
- [ ] Copy `hd-reading.js` → `src/index.js` in the new project
- [ ] Add to `wrangler.toml`:
  ```toml
  [ai]
  binding = "AI"
  ```
- [ ] Deploy:
  ```bash
  wrangler deploy
  ```
- [ ] Note your Worker URL (e.g. `https://frqncy-hd-reading.YOUR-SUBDOMAIN.workers.dev`)
- [ ] If it differs from `https://frqncy-hd-reading.frqncy.workers.dev`, update `WORKER_URL` in `chart.html` (line near the top of the `<script>` block)

---

## 4. Chat Widget Backend (Anthropic API Key)

The FRQNCY Navigator chat widget (`chat-widget.js`) calls `/api/chat`, which is a Cloudflare Pages Function at `functions/api/chat.js`. It needs an Anthropic API key to work.

- [ ] Create an account at [console.anthropic.com](https://console.anthropic.com)
- [ ] Generate an API key (starts with `sk-ant-...`)
- [ ] In Cloudflare Dashboard → Pages → your project → Settings → Environment Variables:
  - Add `ANTHROPIC_API_KEY` = your key
  - Set for **Production** environment
- [ ] The chat widget will start working on next deploy — no code changes needed

Detailed instructions are also in `CHATBOT-SETUP.md`.

---

## 5. Email / Newsletter Collection

The subscribe forms on `index.html` and the contact section currently POST to Substack (`frqncy.substack.com`). You have two paths:

### Option A: Keep Substack (simplest)
- [ ] Create a Substack publication at [substack.com](https://substack.com) with handle `frqncy`
- [ ] Verify it's live at `frqncy.substack.com`
- [ ] Done — the forms already point there

### Option B: Switch to Brevo (more control, custom emails)
- [ ] Create a Brevo account at [brevo.com](https://brevo.com)
- [ ] Get your API key (`xkeysib-...` format)
- [ ] Create a contact list called "FRQNCY Waitlist", note the List ID
- [ ] Create the missing `functions/api/subscribe.js` Cloudflare Function (see `EMAIL-SETUP.md` for the template)
- [ ] Add environment variables in Cloudflare Pages:
  - `BREVO_API_KEY` = your key
  - `BREVO_LIST_ID` = your list ID
- [ ] Update `index.js` to POST to `/api/subscribe` instead of Substack

---

## 6. Email Address

`hello@frqncy.network` is referenced as the contact email across the site.

- [ ] Set up email forwarding or a mailbox for `hello@frqncy.network`
  - Cloudflare Email Routing (free, in your Cloudflare dashboard) is the easiest — forward to your personal email
  - Or use a provider like Google Workspace / Zoho

---

## 7. Social / Branding Accounts

Referenced in meta tags and footer:

- [ ] Claim `@frqncy` on Twitter/X (referenced in `<meta name="twitter:site">`)
- [ ] Set up any other social handles you want (Instagram, YouTube, etc.)

---

## 8. After Codex Finishes (v2/ topic pages)

Codex is currently editing the 152 `v2/[topic-slug]/index.html` files. Once it's done:

- [ ] Run `node generate.js` to regenerate all v2 pages (picks up the new Human Design topic + any content.json changes)
- [ ] Re-patch `sitemap.xml` — generate.js overwrites it to 161 URLs, losing 5 manual additions (chart, my-frqncy, search, v2/watch/, v2/courses/). Run:
  ```bash
  python3 patch-sitemap.py  # or ask Claude to re-patch
  ```
- [ ] Commit and push the regenerated files

---

## 9. Analytics Verification

Plausible analytics script is already on every page (`plausible.io/js/script.js` with `data-domain="frqncy.network"`).

- [ ] Log into [plausible.io](https://plausible.io) and verify `frqncy.network` is registered as a site
- [ ] Check that pageviews are flowing after the site is live

---

## 10. Content Gaps to Fill Over Time

These aren't blockers, but will make the library stronger:

- [ ] Add more **people** resources — only 3.5% of the library currently
- [ ] 123 topics have **zero video resources** — add curated YouTube/Vimeo links
- [ ] Eastern tradition topics are underrepresented (Buddhism, Hinduism, Taoism)
- [ ] Add more courses across all domains
- [ ] Generate unique OG images for ~6 topics that have TODO placeholders (gene-keys, human-design, quantum-grammar, money, robert-jay-gould, cryptocurrency)

---

## Priority Order (what to do first)

1. **Push to GitHub** — gets everything live
2. **Anthropic API key** — enables the chat widget
3. **Substack account** — enables email collection
4. **Deploy HD Worker** — upgrades chart reading from client-side to AI
5. **Email forwarding** — so people can reach you
6. **Everything else** — at your own pace
