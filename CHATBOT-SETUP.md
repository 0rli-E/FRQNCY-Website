# FRQNCY AI Navigator — Setup Guide

The AI chat widget is built and deployed in the site. It runs on **Cloudflare Workers AI** (free, no API key) using the Qwen3 30B-A3B model. The only manual step required is binding Workers AI to the Pages project — one click in the Cloudflare dashboard.

---

## How it works

```
Browser  →  POST /api/chat  →  Cloudflare Pages Function  →  Cloudflare Workers AI
                                (chat.js — uses the AI binding, no API key in code)
```

1. **`chat-widget.js`** — floating gold ✦ button on every page; handles UI and streaming.
2. **`functions/api/chat.js`** — Cloudflare Pages Function. Uses model `@cf/qwen/qwen3-30b-a3b-fp8` via the `env.AI` binding. 2048 max tokens. 20 req/min/IP rate limit. System role messages from clients filtered out for prompt-injection defence.
3. **`functions/api/_kb.js`** — auto-generated knowledge base (all topics + picks).
4. **`build-kb.js`** — regenerates `_kb.js` from `content.json`. Runs automatically via GitHub Actions.

---

## One-time activation step

Bind Workers AI to your Pages project:

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com).
2. Pages → `frqncy-website` → **Settings → Bindings**.
3. Click **Add binding** → **Workers AI**.
4. Variable name: `AI` (exactly that — case-sensitive; the function reads `env.AI`).
5. Click **Save**.
6. Trigger a redeploy (Deployments → Retry latest, or push a commit).

You don't need an Anthropic API key, an OpenAI key, or any other paid provider. Workers AI is included free in Cloudflare's free tier at typical FRQNCY traffic.

### Verify it's working

1. Visit [frqncy.network](https://frqncy.network).
2. Click the gold ✦ button (bottom-right corner).
3. Ask "What is FRQNCY?" and hit Enter.
4. You should see a streaming response.

If the widget returns "Workers AI binding not configured", the `AI` binding isn't set or the deploy hasn't picked it up — check Settings → Bindings, then redeploy.

If the widget returns "AI service temporarily unavailable", check the Pages function logs (Cloudflare Dashboard → Pages → frqncy-website → Functions → Logs) for the error from `env.AI.run()`.

---

## Optional: paid fallback

The widget defaults to free Workers AI. If you want a paid fallback for cases where Workers AI is rate-limited or down, two options:

- **Anthropic Claude** — set `ANTHROPIC_API_KEY` in Pages env vars and add a fallback branch in `chat.js` (~10 LOC). Claude Haiku costs ~$0.05–$1.50 per 1k–10k conversations.
- **OpenRouter** — single key, ~300 models, similar fallback shape. Useful if you want to A/B-test model quality on FRQNCY-specific questions.

Neither is currently wired. The free Qwen3 path is the live system.

---

## Keeping the knowledge base current

When `content.json` changes (new topics, resources, picks), the KB updates automatically:

- **Locally:** `node build-kb.js` before `node generate.js`.
- **GitHub Actions:** the workflow runs `build-kb.js` automatically on every push that touches `content.json`.

---

## Files overview

| File | Purpose |
|------|---------|
| `chat-widget.js` | Frontend widget (injected on all pages) |
| `functions/api/chat.js` | Cloudflare Pages Function — calls `env.AI.run('@cf/qwen/qwen3-30b-a3b-fp8', …)` |
| `functions/api/_kb.js` | Auto-generated knowledge base (do not edit manually) |
| `build-kb.js` | Regenerates `_kb.js` from `content.json` |
| `.github/workflows/build.yml` | Auto-rebuilds KB + pages on content changes |

---

## What changed from earlier versions

This widget originally proxied to the Anthropic API and required `ANTHROPIC_API_KEY` in Pages env. That changed when the Workers AI Qwen3 path landed — free, edge-deployed, fast enough, and good enough for FRQNCY's curated-knowledge-base shape. The Anthropic key is no longer required. Earlier versions of this doc and `SETUP-CHECKLIST.md` told you to set it; both have been corrected as of 2026-04-28.
