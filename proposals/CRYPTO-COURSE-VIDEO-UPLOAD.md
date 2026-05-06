# Crypto Fundamentals — Video Upload Workflow

The course frame is generated from `courses.json` by `generate-courses.js`. To wire your filmed videos in, you upload to YouTube once, paste the IDs into `courses.json`, and regenerate.

## One-time setup

1. Create a YouTube channel for FRQNCY (or use your existing one).
2. Recommendation: upload **public** rather than unlisted. The course is a free top-of-funnel — public uploads also act as discovery surface and can point back to `frqncy.network/v2/courses/crypto-fundamentals/`.
3. In each video's description, link the course page and the Telegram channel (`https://t.me/+Rl9WA4P0V2AzYWVi`).

## Per-video flow

For each lesson:

1. Upload the video to YouTube.
2. Copy the 11-character video ID from the URL — for `https://www.youtube.com/watch?v=dQw4w9WgXcQ` that's `dQw4w9WgXcQ`.
3. Open `courses.json`, find the matching lesson under `c-crypto-fundamentals`, paste into `youtube_id`.
4. From the repo root, run:

   ```bash
   node generate-courses.js
   ```

5. Commit + push. The course detail page picks up the embed automatically.

While `youtube_id` is empty, the lesson renders a "Video coming soon" placeholder card — safe to ship public.

## Lesson → video map

| # | Lesson | Source video |
|---|---|---|
| 1 | Set Up Brave Browser | TG Step 1 — Brave install (Windows) |
| 2 | Open Your Kraken Account | TG Step 2 — Kraken account setup (06:37) |
| 3 | A Quick Tour of Kraken | TG Step 2 — short Kraken intro |
| 4 | Install Rabby & Phantom Wallets | TG Step 3 — Rabby + Phantom (09:04) |
| 5 | Seed Phrase Security — Non-Negotiable | **Supplement.** Recommended public sources: Whiteboard Crypto on seed phrases, Andreas Antonopoulos "Bitcoin Security Model". Or film your own. |
| 6 | Send and Receive Transactions | TG Step 4 — Rabby + Phantom send/receive (04:32) |
| 7 | Deposit Crypto and Withdraw Fiat on Kraken | TG Step 5 — Kraken deposit/withdraw (10:13) |
| 8 | Swap Onchain with Defillama | TG Step 6 — Defillama swap video (04:43) |
| 9 | Swap Onchain with Titan Exchange | TG Step 6 — Titan swap video (05:59) |
| 10 | Common Scams — and How to Avoid Them | **Supplement.** Recommended public sources: Coin Bureau on crypto scams, Whiteboard Crypto on phishing/drainers. Or film your own. |
| 11 | Find Tokens with Dexscreener | TG Step 7 — Dexscreener intro (07:37) |
| 12 | Get to Know Coingecko | TG Step 8 — Coingecko (06:17) |
| 13 | Set Up TradingView | TG Step 9 — TradingView (13:25) |
| 14 | Sources on X — The Live List | Reading lesson — already wired to your X list URL. No video needed. |
| 15 | Bridge Between Chains with Bungee | TG Step 11 — Bungee bridge (05:04) |
| 16 | Join the Live Channel | Reading lesson — already wired to the Telegram channel. No video needed. |

## Two supplement decisions to make

Lessons 5 (Seed Phrase Security) and 10 (Common Scams) are not in your TG sequence. They're the two biggest gaps in any beginner crypto curriculum, so I slotted them in. Three options for each:

- **Film your own** (recommended — keeps voice consistent, plus more authority for the Telegram channel).
- **Embed a public video** — set `youtube_id` to the video ID of a Whiteboard Crypto / Coin Bureau / Andreas Antonopoulos talk you trust. Crediting in the description is good practice.
- **Drop the lesson** — remove the entry from `courses.json` and regenerate. Not recommended; learners need the seed-phrase warning before lesson 6.

## Schema reference

Each lesson is an object inside `c-crypto-fundamentals.lessons[]`. Three types:

```jsonc
// Video lesson
{ "id": "l1", "title": "...", "type": "video",
  "youtube_id": "dQw4w9WgXcQ",
  "duration": "5 min",
  "desc": "User-facing description shown beneath the title." }

// Reading lesson (link card)
{ "id": "l14", "title": "...", "type": "reading",
  "url": "https://example.com",
  "duration": "5 min",
  "desc": "..." }

// Reflection lesson (prompt + textarea)
{ "id": "l5", "title": "...", "type": "reflection",
  "duration": "10 min",
  "content": "The reflection prompt shown to the learner." }
```

The community CTA (Telegram banner at the top of the course page) lives at the course level:

```jsonc
"community": {
  "label": "Crypto Beginner — live channel",
  "blurb": "Updates, new lessons, and a place to ask questions...",
  "url": "https://t.me/+Rl9WA4P0V2AzYWVi",
  "cta": "Join the Telegram"
}
```

Edit any field, run `node generate-courses.js`, commit, push.
