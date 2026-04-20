# FRQNCY Crypto — Build Roadmap

**Goal:** evolve the Crypto section from a hand-generated static site into a curated, conscious alternative to CoinGecko — live market data where useful, opinionated curation as the differentiator, all editable from Notion without touching code.

**Guiding principles**

- Curation is the product. Market data is context, not the race.
- Notion is the CMS because Orli already knows it.
- CoinGecko is the live data source — no need to build one.
- Keep the static HTML shells. Hydrate the data on load.
- No leaderboards. No gambling-feed UX. Conviction tiers are self-expression; rankings are not.

---

## Where we are today (April 2026)

Static HTML under `v2/crypto/` with 19 category sub-hubs. Each page has a hardcoded `PROJECTS` array written by `outputs/gen_categories.py`. One Notion-backed endpoint exists at `/api/crypto/projects` powering `v2/crypto/explorer.html`. CoinGecko links appear on project cards but no live price data is pulled.

Pain points: editing a description means editing Python and rerunning the generator; prices are missing; new projects require a code commit.

---

## Phase 1 — Live price overlay (days, not weeks)

**Goal:** every category page shows live price and 24h change next to each project, without rewriting anything.

**What to build**

1. New Pages Function `functions/api/crypto/market.js` — proxies CoinGecko's `/coins/markets?ids=...` endpoint, caches 60–120s in the existing `CRYPTO_CACHE` KV namespace, returns `{ id, symbol, price, change24h, mcap, volume }[]`.
2. Small shared script `v2/crypto/_market.js` that each category page includes. On `DOMContentLoaded` it collects the CoinGecko IDs from the page's `PROJECTS` array, calls `/api/crypto/market`, and patches the DOM — inserts a `.ccard-price` element into each card's footer.
3. Generator update: add a `coingeckoId` field to each project in `gen_categories.py` so the market script knows what to fetch.

**Files touched**

- `functions/api/crypto/market.js` (new)
- `v2/crypto/_market.js` (new)
- `outputs/gen_categories.py` (add `coingeckoId` field, regenerate 18 pages)
- `v2/crypto/bitcoin/index.html` (hand-patch, not generator-produced)

**Done when**

- Any category page shows live price + color-coded 24h change for every project with a `coingeckoId`.
- Projects without an ID (or where CoinGecko fails) render cleanly with no price, not a broken state.
- KV cache keeps CoinGecko calls under 30/min even with traffic.

**Why this phase first:** ships immediate visible value, validates the CoinGecko integration, zero migration risk. If it feels wrong, roll back with one revert.

---

## Phase 2 — Notion as single source of truth

**Goal:** edit any project's thesis, conviction tier, category, or link from Notion. No code changes needed.

**What to build**

1. Extend the existing Notion DB (ID `2885f874cee880d9a5fac5f6b89aecba`) with the fields currently living in `gen_categories.py`:
   - `Primary Category` (select: sov, l1, l2, defi, stablecoins, rwa, depin, oracles, staking, predictions, desci, icm, memes, modular, privacy, ai, gamefi, socialfi, bitcoin)
   - `Secondary Categories` (multi-select — a project can appear in multiple grids)
   - `Why FRQNCY Watches` (rich text — the editorial thesis shown in the card)
   - `Short Description` (plain text — the card's body copy)
   - `CoinGecko ID` (plain text — the `id` string, e.g. "ethereum", not the URL)
   - `Display Type` (select: L1, L2, DEX, Lending, Stablecoin, etc. — the tag pill on cards)
   - `Accent Color` (plain text — hex, optional, falls back to generated hue)
2. One-time migration script `outputs/migrate_to_notion.py` — reads each category's `PROJECTS` list in `gen_categories.py`, creates matching Notion rows, preserves IDs.
3. Decide: keep one master DB and filter by category, or one DB per category? **Recommendation: one master DB.** Filters are free; cross-category queries are useful ("all projects I've rated A-tier across every sector").

**Files touched**

- Notion DB schema (manual or via Notion MCP)
- `outputs/migrate_to_notion.py` (new, run once)
- `functions/api/crypto/projects.js` (add `category` query param filtering)

**Done when**

- Every project visible in a category page exists as a Notion row.
- `/api/crypto/projects?category=defi` returns exactly the DeFi project set.
- Editing "Why FRQNCY watches this" in Notion shows up on the live site within 30 min (KV TTL), or instantly with `?refresh=true`.

**Risk:** Notion's API is rate-limited and occasionally slow. The existing KV cache + stale-while-revalidate pattern in `projects.js` already handles this — keep it.

---

## Phase 3 — Flip category pages to dynamic

**Goal:** retire `gen_categories.py` as the production path. Category pages become thin shells that fetch their projects at render time.

**What to build**

1. Refactor one category page (suggest **DeFi**, biggest, most complex) into the new pattern:
   - HTML shell: breadcrumb, intro card, color theme, section headers — all static.
   - `<main id="grid"></main>` — empty on load, hydrated by JS.
   - Script calls `/api/crypto/projects?category=defi` + `/api/crypto/market` in parallel, merges by `coingeckoId`, renders cards.
   - Loading skeleton for the ~200ms before KV serves the cached response.
2. Once DeFi proves the pattern, flip the remaining 17 (Bitcoin stays handwritten — it's a narrative page).
3. `gen_categories.py` retired from production, kept in `outputs/` as a scaffold-new-category tool: `python3 gen_categories.py --new-category=zk-infra` spits out an HTML shell with the right color theme and structure, then you fill the Notion DB.

**Files touched**

- All 18 generator-produced category pages (simplified shells)
- `v2/crypto/_render.js` (new, shared card rendering logic)
- `outputs/gen_categories.py` (converted to scaffold-only mode)

**Done when**

- Adding a new project is 100% a Notion task, zero git commits.
- Page weight per category drops ~30–40% (no embedded `PROJECTS` JSON).
- Main crypto landing page can also switch to dynamic fetch (same pattern).

---

## Phase 4 — The conscious alternative

**Goal:** the thing that makes this not-CoinGecko. Less ranking, more meaning.

**Features to build** (prioritize based on what feels alive)

- **Themed clusters instead of top-N lists.** "What we're watching in Q2 2026," "Projects solving self-custody for normies," "Bets on the decentralization of AI compute." Curated, narrative, editable in Notion.
- **Conviction history.** When you change a project's tier in Notion, log the change with a date + optional note. Show it on the project card ("Moved from B → A in Feb 2026 after X"). Rewards your thinking over time.
- **Domain links back to FRQNCY.** Every project card links to related topics in the wider FRQNCY network — e.g. Zcash → `/v2/privacy/`, Bittensor → `/v2/ai/`. Crypto becomes one channel of a larger conscious-tech frame, not its own silo.
- **Personal mode.** `/v2/crypto/my/` — pick the tiers and categories you care about, get a filtered, saved view. Uses the same `/api/crypto/projects` endpoint with client-side filters. No accounts needed (localStorage).
- **Price-free mode toggle.** A global switch that hides all price/mcap data and shows only curation + thesis. The anti-CoinGecko button. Default: off. But existing as an option signals the ethos.

---

## Explicit non-goals

- User accounts or logins (use localStorage for any personalization)
- Real-time websocket price streams (30–60s cache is plenty for a curated site)
- A trading or portfolio tool (not what FRQNCY is for)
- Competing with CoinGecko on comprehensiveness (curation is the point — being smaller is a feature)
- Leaderboards, rankings, "top movers" feeds (explicit: anti-FRQNCY values)

---

## Migration path summary

| Phase | Effort | Risk | Unlock |
|---|---|---|---|
| 1 — Live prices | ~1 day | Low | Visible market context on every page |
| 2 — Notion schema + migrate | ~2–3 days | Medium (manual data work) | Edit without code |
| 3 — Dynamic pages | ~2 days | Low (pattern already proven on explorer.html) | Retire the generator |
| 4 — Conscious features | Ongoing | N/A | The real differentiation |

Start with Phase 1. Ship it. See how it feels. Then decide when Phase 2 is worth the data-entry time.
