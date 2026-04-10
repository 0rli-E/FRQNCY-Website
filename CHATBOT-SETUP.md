# FRQNCY AI Navigator — Setup Guide

The AI chat widget is fully built and deployed in the site. This guide covers the one manual step required to activate it: adding your Anthropic API key to Cloudflare Pages.

---

## How it works

```
Browser  →  POST /api/chat  →  Cloudflare Pages Function  →  Anthropic API
                                (chat.js — your API key lives here, never in the browser)
```

1. **`chat-widget.js`** — floating star button on every page; handles the UI and streaming
2. **`functions/api/chat.js`** — Cloudflare serverless function; proxies requests to Anthropic
3. **`functions/api/_kb.js`** — auto-generated knowledge base (all 130 topics + picks)
4. **`build-kb.js`** — regenerates `_kb.js` from `content.json`; runs automatically via GitHub Actions

---

## One-time activation steps

### 1. Get an Anthropic API key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign in / create an account
3. Navigate to **API Keys** → **Create Key**
4. Copy the key (starts with `sk-ant-...`)

### 2. Add the key to Cloudflare Pages

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Open your FRQNCY Pages project
3. **Settings → Environment Variables**
4. Click **Add variable**
   - **Variable name:** `ANTHROPIC_API_KEY`
   - **Value:** your key (`sk-ant-...`)
   - Set for both **Production** and **Preview**
5. Click **Save**

> You do NOT need to redeploy — the function will pick up the env var immediately on the next request.

### 3. Verify it's working

1. Visit [frqncy.network](https://frqncy.network)
2. Click the gold ✦ button (bottom-right corner)
3. Type a question like "What is FRQNCY?" and hit Enter
4. You should see a streaming response appear

If you see an error in the chat, open your browser's dev tools → Network tab → look at the `/api/chat` request response for details.

---

## Keeping the knowledge base current

Whenever you update `content.json` (add topics, resources, picks), the AI knowledge base updates automatically:

- **Locally:** run `node build-kb.js` before `node generate.js`
- **GitHub Actions:** the workflow already runs `build-kb.js` automatically on every push that touches `content.json`

---

## Cost estimate

The widget uses **Claude Haiku** — Anthropic's fastest, most affordable model.

| Usage | Approx cost |
|-------|-------------|
| 1,000 conversations (avg 5 messages) | ~$0.05–$0.15 |
| 10,000 conversations | ~$0.50–$1.50 |

Costs are negligible at typical site traffic levels. Monitor usage at [console.anthropic.com/usage](https://console.anthropic.com/usage).

---

## Files overview

| File | Purpose |
|------|---------|
| `chat-widget.js` | Frontend widget (injected on all pages) |
| `functions/api/chat.js` | Cloudflare serverless API proxy |
| `functions/api/_kb.js` | Auto-generated knowledge base (do not edit manually) |
| `build-kb.js` | Regenerates `_kb.js` from `content.json` |
| `.github/workflows/build.yml` | Auto-rebuilds KB + pages on content changes |
