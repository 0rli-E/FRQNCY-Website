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

## Lesson → video map (updated after upload)

15 lessons total. 11 of them have your filmed videos; 2 are supplements (4 + 9); 2 are reading lessons (13 + 15).

| # | Lesson | Source video |
|---|---|---|
| 1 | Set Up Brave Browser | `Brave Download.mov` (1m31s) |
| 2 | Open + Tour Your Kraken Account | `Kraken Intro.mp4` (6m37s) — covers signup + dashboard tour |
| 3 | Install Rabby & Phantom Wallets | `Wallet Setup.mp4` (9m04s) |
| 4 | Seed Phrase Security — Non-Negotiable | **Supplement.** Recommended public sources: Whiteboard Crypto on seed phrases, Andreas Antonopoulos "Bitcoin Security Model". Or film your own. |
| 5 | Send and Receive Transactions | `Sending and Receiving.mov` (4m32s) |
| 6 | Deposit Crypto and Withdraw Fiat on Kraken | `Kraken Deposit and Withdrawal.mov` (10m13s) |
| 7 | Swap Onchain with Defillama | `Swap.defillama.com.mov` (5m59s) |
| 8 | Swap Onchain with Titan Exchange | `Solana Dex Aggregator.mov` (4m43s) — confirmed Titan via app.titan.exchange URL |
| 9 | Common Scams — and How to Avoid Them | **Supplement.** Recommended public sources: Coin Bureau on crypto scams, Whiteboard Crypto on phishing/drainers. Or film your own. |
| 10 | Find Tokens with Dexscreener | `Dexscreener Intro.mov` (7m37s) |
| 11 | Get to Know Coingecko | `Coingecko Intro.mov` (6m17s) |
| 12 | Set Up TradingView | `Tradingview Intro.mov` (13m25s) |
| 13 | Sources on X — The Live List | Reading lesson — already wired to your X list URL. No video needed. |
| 14 | Bridge Between Chains with Bungee | `Bungee Bridging intro.mov` (5m04s) |
| 15 | Join the Live Channel | Reading lesson — already wired to the Telegram channel. No video needed. |

## Two supplement decisions to make

Lessons 4 (Seed Phrase Security) and 9 (Common Scams) are not in your TG sequence. They're the two biggest gaps in any beginner crypto curriculum, so I slotted them in. Three options for each:

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
