# Handoff — Aligned Goods (2026-06-11)

For the next agent (Fable, or anyone) picking up Aligned Goods work. Read this first. Skim time: 5 minutes. Lots got done in the previous session; the system is in a good state and easy to extend. Don't reinvent — the conventions below have been earned.

## TL;DR

Aligned Goods is FRQNCY's curated index of products, places, texts, and tools that help people live in alignment. Magazine format, one Editor's Choice per shelf, no paid placement, pick decisions always precede money flows.

**Today (2026-06-11):**

- 83 entries across 17 shelves in `aligned-goods.json`
- Every shelf has its Editor's Choice (`tier: "pick"`)
- 68 unique merchants, auto-aggregated into the merchants index at the bottom of `/aligned/`
- 17 per-shelf landing pages live at `/aligned/<shelf>/`
- Filterable merchants section (by status + by shelf)
- All Picks strip near the top showing every Editor's Choice at a glance
- 6 high-relevance topic pages have a callout linking back to the right shelf
- Schema.org JSON-LD ItemList for SEO
- 13 entries have placeholder affiliate URLs (`?ref=frqncy`); 0 live, 13 pending, 55 unmonetized
- Service worker at v57

**Deployed:** Yes. The last commit (`d2a96ea` + the audit batch) has all the above. Cloudflare Pages auto-deploys from `main`.

## Files of record — read these before changing anything

The system is small. Five files do most of the work.

**`aligned-goods.json`** — canonical data. Every shelf, every entry, every vendor, every affiliate URL, every `revenue_relationship`. The page renders entirely from this. Edit here first; the page picks it up on next load.

**`aligned/index.html`** — the main page. Self-contained: HTML structure, inline CSS, inline JS that fetches `aligned-goods.json` and renders shelves + All Picks strip + merchants index + JSON-LD. The `CATEGORIES` array near the top of the `<script>` block is the source of truth for shelf order, display name, and tagline. Add a new shelf there; the rendering picks it up automatically.

**`aligned/<shelf>/index.html`** — 17 per-shelf landing pages, one per shelf. Static HTML (data inlined at generation time, not fetched from JSON). If you add or change entries in `aligned-goods.json`, you need to regenerate these. See "Regenerating per-shelf pages" below.

**`sw.js`** — service worker. `const VERSION = 'vXX'` near the top. Bump it any time you change `aligned-goods.json`, `aligned/index.html`, or any of the per-shelf pages, otherwise users get stale JSON and HTML for hours. Current: v57.

**`_chrome/global-header.html`** — canonical site nav. Top-level: About / Discover / Community. Don't change to Why/How/What — Orlando explicitly rejected the Golden Circle variant. After editing, run `node scripts/sync-headers.mjs` to propagate.

## Related docs

- `proposals/ALIGNED-GOODS.md` — the original section handoff. **STALE on counts** (says 12 shelves / 56 entries; reality is 17 shelves / 83 entries). The conventions and rules in it are still right. Worth updating; not blocking.
- `proposals/PARTNER-STRATEGY.md` — outreach playbook. Four-tier ladder, cold-email template, revenue math. Read before making any outreach decision.
- `proposals/ALIGNED-GOODS-MERCHANTS.md` — per-merchant tracking sheet. 68 rows: merchant, shelves, entries, status, owner, last touched, MRR. Hand-maintained; regenerate with the Python snippet in the file's "How to use this sheet" section as needed.
- `proposals/EDITORIAL-STANDARDS.md` — the picking rubric.
- `proposals/FRQNCY-VOICE-PLAYBOOK.md` — canonical voice guide. Worth a pass on the EMCE/Wear/Stay/Library/Learn entries — voice consistency check has not been done on those yet.
- `proposals/REVENUE-MODEL.md` — Aligned is one of five revenue surfaces.

## What was shipped in this session (2026-06)

A lot. Roughly in order:

1. **EMCE shelf** added (Electro Magnetic Chaos Eliminators) with iPyramids' full product line (9 entries covering ~58 SKUs grouped by family), shungite (Karelian Heritage), 3 crystals (Energy Muse), grounding mat (Earthing.com), Faraday phone case (DefenderShield), EMF meter (Trifield), plus copper as the foundational material entry. 17 entries total on this shelf, iTorus PEMF as Editor's Choice.
2. **Eva water → Lauretana.** The Water shelf now points at Italian Piedmont spring water (~14 mg/L TDS).
3. **WBNO migrated** from `nourishment` to `supplements` (where it belongs) and promoted from `flagship` tier to `pick`.
4. **Audio shelf rebuilt** as Turntables — AirPods/Sennheiser/KEF/Loop deleted, replaced with Linn Sondek LP12 (pick) + Rega Planar 6 + Technics SL-1500C + Pro-Ject Debut Carbon EVO + Clearaudio Concept. Hatch Restore moved to Sleep.
5. **Cards pruned** to Amex Platinum only (Editor's Choice). Wise demoted to aligned, then Wise + 6 others deleted entirely. Same gut-cut on Supplements: WBNO only.
6. **4 new shelves built:** Wear (Patagonia pick), Stay (Esalen pick), Library (Tao Te Ching pick), Learn (Waking Up pick). 5 entries per shelf.
7. **Dr. Bronner's promoted** from `flagship` to `pick` for body-care consistency.
8. **Header rolled back** to original About / Discover / Community labels (the Why/How/What Golden Circle was an unwanted experiment).
9. **All Picks strip** added at top of `/aligned/` — 17 mini-cards.
10. **Filterable merchants index** — Status + Shelf filter chip rows with counts.
11. **Card polish** — criteria back as quiet inline labels, gold gradient line across pick-card top edges, heavier pick title weight.
12. **17 per-shelf landing pages** generated at `/aligned/<shelf>/`. Each has hero, breadcrumb, page-level rubric, the shelf's full cards, related-shelf chips. `scripts/sync-headers.mjs` patched to auto-discover them.
13. **Topic page callouts** on `/crystals/`, `/energy-healing/`, `/water/`, `/supplements/`, `/cards/`, `/sleep/`, `/stones/`. Quiet gold-bordered box at the top of each topic page linking to the relevant aligned shelf.
14. **Schema.org JSON-LD ItemList** generated from the goods data, injected into the head of `/aligned/`. One `Product` per entry.
15. **`PARTNER-STRATEGY.md`** written — outreach playbook, cold-email template, revenue projections, the four-tier ladder explained.
16. **`ALIGNED-GOODS-MERCHANTS.md`** generated — 68 rows, status legend, per-shelf rollup, four-step workflow for moving a merchant up the ladder.

## Conventions you must keep

These aren't preferences — break them and the system stops meaning anything.

**One Editor's Choice per shelf.** Never two `tier: "pick"` entries with the same `category`. If a new pick-worthy entry arrives, demote the existing pick to `aligned` first.

**Pick first, money second.** A `revenue_relationship` change never bends a pick. If a brand pays affiliate commission and a non-paying brand is better, the non-paying brand stays the pick. This is the editorial floor; everything else stands on it.

**Affiliate URLs go in `vendor[0].affiliate` AND `vendor[0].url`** (both should be the same `?ref=frqncy` URL). Plus `vendor[0].affiliate_status` set to either `"placeholder — pending [Merchant] affiliate enrollment"` (most current entries) or `"live"` once enrolled. Set `revenue_relationship: "affiliate"` on the entry. The merchants index shows live/pending/none based on these fields.

**Bump `sw.js` VERSION** on any change to `aligned-goods.json`, `aligned/index.html`, or any per-shelf page. Currently at v57. Without the bump, users see stale data for hours.

**Shelves render sorted by depth** (entry count descending) so the single-entry picks (Water, Supplements, Cards) sit at the bottom as the editorial floor. Don't change this — the order is set by JS in `aligned/index.html` (`visibleShelves()` function). The CATEGORIES array order is preserved only as a tiebreaker for equal-count shelves.

**Topic-page callouts** at the top of `/<topic>/index.html` use `class="frqncy-aligned-callout"`. If you add more topic pages, the Python snippet pattern in this session can drop them in.

## Things you must not do

- **Don't add leaderboards, rankings, or "Top 10" framing.** This is in the core CLAUDE.md as a hard rule.
- **Don't add Why/How/What header labels.** Orlando rejected the Golden Circle. The header is About / Discover / Community and stays that way.
- **Don't have two `tier: "pick"` entries on the same shelf.**
- **Don't add entries on paid placement.** No agent or human should be merging a pick because the brand offered money.
- **Don't put a non-affiliate marketing URL in `vendor.affiliate`.** That field is reserved for the tracked URL.

## How to do common things

### Add a new entry

Edit `aligned-goods.json`. Append a new object before the closing `]`. Required fields: `id` (kebab-case), `type` (`tool` / `book` / `place` / `person` / `course` / `material` / `supplement` / `personal-care`), `name`, `desc` (one paragraph in FRQNCY voice), `category` (must match an `id` in CATEGORIES), `tier` (`pick` / `aligned` / `referenced`), `criteria` (subset of `used` / `clean` / `independent` / `verifiable` / `accessible` / `durable` / `ancient-lineage` etc.), `topicSlugs`, `vendor[]` (at least one with name + url), `revenue_relationship` (`null` / `"contributor"` / `"partner"` / `"affiliate"`).

If the new entry is `tier: "pick"`, demote the existing pick on that shelf to `aligned` first.

After editing: bump `sw.js` VERSION, regenerate the affected per-shelf page (see below), and push.

### Add a new shelf

1. Append to `CATEGORIES` array in `aligned/index.html` with `{ id, name, desc }`.
2. Add at least one `tier: "pick"` entry (the Editor's Choice) and ideally 3-5 aligned siblings. Without entries, the shelf hides itself.
3. Regenerate per-shelf pages so the new one gets its own URL.
4. Bump `sw.js` VERSION.
5. Run `node scripts/sync-headers.mjs` to give the new shelf page the canonical nav.
6. Push.

### Regenerate per-shelf pages

Run the generator:

```
node scripts/build-aligned-shelves.mjs
```

It reads `aligned-goods.json` plus the `CATEGORIES` array and shared chrome (head tail + global header) sliced live from `aligned/index.html`, then rewrites every `aligned/<shelf>/index.html`. Pass `--check` for a dry run that exits non-zero if any page is out of sync — wire this into CI or a pre-commit hook to catch drift.

The kebab→label criteria map and the related-shelf rule (first five `CATEGORIES` excluding self) are documented in the script. It was validated by reproducing every committed page byte-for-byte (the only delta on first run was fixing an unescaped `&` in the related-shelf chips). After running: bump `sw.js` VERSION and run `node scripts/sync-headers.mjs`.

### Move an affiliate from pending to live

1. Get the live tracked URL from the merchant's affiliate program.
2. In `aligned-goods.json`, replace the placeholder `?ref=frqncy` URL in `vendor[0].affiliate` with the live URL.
3. Update `vendor[0].url` to the same live URL.
4. Change `vendor[0].affiliate_status` from `"placeholder — pending …"` to `"live"`.
5. Update `proposals/ALIGNED-GOODS-MERCHANTS.md` row for that merchant.
6. Bump `sw.js` VERSION.
7. Push.

The merchants index header auto-recounts and the badge flips from "Affiliate · pending" to "Affiliate · live."

## Open threads — worth picking up

In rough priority order:

1. **Update `proposals/ALIGNED-GOODS.md`.** Says 12 shelves / 56 entries. Reality is 17 / 83 plus the merchants index, per-shelf pages, JSON-LD, partner doc, tracking sheet. Sync the canonical handoff to reality.
2. **Voice playbook pass** on EMCE (10 iPyramids entries + 4 stones/crystals + 3 other), Wear (5), Stay (5), Library (5), Learn (5). I wrote in voice but didn't run against `proposals/FRQNCY-VOICE-PLAYBOOK.md`. Worth a pass.
3. **Save the per-shelf generator as a script.** Currently it's only in the transcript. `scripts/build-aligned-shelves.{mjs,py}` would make regeneration repeatable.
4. **Body-care thin** (4 entries). Orlando's original brief mentioned shampoo specifically — worth adding 1-3 conscious shampoo / hair care entries here.
5. **Food thin** (3 entries). Could add 2-3 more regenerative farms or single-source heritage producers.
6. **No product images on cards.** Some entries have an `image` field (WBNO, Dr. Bronner's, copper); most don't. Adding thumbnails would lift visual hierarchy.
7. **Per-shelf editorial intros are generic.** The 17 deep pages share a single rubric paragraph ("Every entry is held against five questions..."). Each shelf could have a unique 1-2 paragraph editorial intro on its deep page.
8. **Topic page callouts cover only 6 pages.** More aligned-relevant topics could get one (sustainable-living, sustainability, body-care, cookware, coffee-tea, ayurveda, etc.).
9. **Auto-regen of the merchant tracking sheet.** Currently a one-shot Python generation. Wire as `scripts/build-merchants-sheet.py` so it can re-run on demand without losing manual Status / Owner / Last-touched updates (i.e., merge with the existing rows rather than overwrite).

## Quick gotchas

- The shelf id `nourishment` displays as **"Water"** — leftover from when nourishment meant "what goes in the body." Don't rename it; WBNO has already been migrated to `supplements`.
- The merchant aggregation dedupes by URL hostname. If a merchant appears in multiple entries (e.g., Apple = AirPods + Apple Card historically), make sure their vendor blocks are consistent so the dedupe picks the right affiliate status. (We hit this with Patagonia in this session — Black Hole duffel had no affiliate, brand-level Patagonia did. Fix: make both entries' vendor block identical.)
- Hash anchors on the main `/aligned/` page (`#shelf-emce`) still work; per-shelf pages at `/aligned/emce/` are the canonical deep-link.
- The merchants section meta line updates when filters change. If you adjust the filter logic, keep the meta line in sync.
- Cloudflare Pages serves from `main`. Push and the live site updates in ~2 minutes.

## How Orlando wants this work done

Three lessons from the session:

1. **Prose, not bullet-walls.** He prefers paragraphs to ladder lists in chat replies.
2. **Push commands on copy-paste lines.** When giving him terminal work, no backslash continuations, no multi-line commit messages. One command per line. Use `$HOME` quoted paths to avoid the FRQNCY-WEBSITE space.
3. **Don't ask three times.** When he says "next," pick a leveraged direction and execute; don't open an AskUserQuestion every step. Use the question tool only when genuinely blocked.

Good luck. This system is small enough to hold in your head, fast enough to iterate, and worth shipping carefully. The editorial floor is everything.
