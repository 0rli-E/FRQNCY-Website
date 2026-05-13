# Session notes — 2026-04-28 — crypto section UX polish

Handoff for the next agent picking up FRQNCY crypto work. Captures what was changed this session, why, the patterns introduced, and one unresolved sandbox issue that affects how commits land.

## What the user asked for

A single message with four interleaved asks about the crypto section:

1. **Slow load** on `v2/crypto/explorer.html` (the Notion-backed sector view).
2. **Tier filter "doesn't sort top-down"** — clicking a tier pill only changed highlighting; it did not reorder or hide anything.
3. **Pricing missing** — live CoinGecko prices weren't appearing on either Notion-backed page.
4. **Nav confusion** — "what is the difference between Explore by Sector and Curation?"

## Files changed (uncommitted at time of writing)

- `v2/crypto/_market.js` — extended client-side hydration script (+88 lines net)
- `v2/crypto/explorer.html` — heavy rewrite of filter + load flow (~330 lines changed)
- `v2/crypto/projects.html` — added `data-cgid` + repaint hook (+20 lines)
- `v2/crypto/index.html` — landing-page nav cards (+20 lines)

`git diff --stat` total: 4 files, +302 / -156.

## What changed, file by file

### `_market.js` — shared hydration script

- Selector now matches both `.ccard[data-cgid]` and `.pcard[data-cgid]`. Previously only the static-generator pages (which use `.ccard`) got prices.
- `paintCard()` insertion logic walks a list of anchors in order: `.ccard-footer`, `.pcard-footer`, `.pcard-coingecko`, then falls back to `appendChild`. This lets the same script slot a price row into three different card layouts without each layout needing a special case.
- New public API: `window.FRQNCY_MARKET.repaint()`. Caches the last-fetched coin payload in a module-scope `lastCoins` variable. Pages that re-render their cards dynamically (Notion-backed) call this after each render so freshly-built cards get their prices painted without a second API roundtrip. If `lastCoins` is null, it falls through to a full `hydrate()`.
- Auto-runs once on `DOMContentLoaded` as before.

### `explorer.html` — Notion-backed sector view

Three things wrapped together because they touch the same render flow.

**Fast paint via localStorage cache.** New 2-step `loadData()`:

1. Read from `localStorage` key `frqncy_crypto_explorer_v1` (TTL 30 min). If present, hydrate immediately and paint.
2. In parallel, fetch `/api/crypto/projects`. On success, hydrate again with fresh data and overwrite the cache. Silent failure if step 1 already painted.

The cold-load path is unchanged (still 2-5s while Notion responds, KV-cached server-side). The win is repeat visits within 30 min: instant paint, then a near-invisible upgrade in the background.

Refactored to two helpers: `buildChaptersFromPayload(data)` returns the chapter array, `hydrate(data, source)` does the DOM render. Both `loadData()` and the manual `refreshData()` button call `hydrate()`.

**Tier filter that actually filters.** Previously a tier pill click added `.dimmed { opacity: 0.12; pointer-events: none }` to non-matching cards. They were technically still there, just nearly invisible — which read as "the filter is broken." Rewrote `toggleTierFilter(tier)`:

- Adds `.tier-filter-active` to body.
- Iterates `.chapter` elements. Within each, counts matching `.pcard[data-tier="${tier}"]`. Non-matches get `.filter-hidden { display: none }`.
- If a chapter has zero matches, the chapter itself is `.filter-hidden`. If it has matches, force `.open` so the user sees the cards immediately and the count badge updates to "N matches".
- Scrolls to the first match.
- Deactivating (clicking the same pill again, or the clear button) calls `restoreChapterCounts()` which puts the original chapter counts back and removes all `.filter-hidden` classes.

CSS changes: removed the `.pcard.dimmed` rule; added `.pcard.filter-hidden { display: none }`, `.chapter.filter-hidden { display: none }`, and the body-scope `.tier-filter-active` hook.

**Cards now emit `data-cgid`.** New helper `cgIdFromUrl(url)` extracts the slug from `/coins/<id>` URL pattern. `makeCard()` adds `data-cgid="${cgid}"` when present so `_market.js` can paint the price row. After each `hydrate()`, `window.FRQNCY_MARKET.repaint()` is called.

### `projects.html` — Curation (flat catalog)

Same `cgIdFromUrl()` helper added. `makeGridCard()` sets `card.setAttribute('data-cgid', cgid)`. `render()` calls `window.FRQNCY_MARKET.repaint()` at the end.

**Decision not to add `data-cgid` to list rows.** The list view (`.lrow`) is a 6-column CSS grid. Injecting `.mkt-row` (display:flex with three children) would land as a 7th grid child and break the row layout. Left an inline comment explaining the decision. Grid view (the default) gets prices, which covers the common case.

### `index.html` — crypto landing page

Replaced the flat two-button row at the top with a 2-column descriptive card grid. Each card has:

- A numbered eyebrow label (`1 · Learn the map` in accent purple, `2 · Browse by conviction` in gold).
- The action title (`Explore by Sector →` / `View Curation →`) in Cormorant.
- A one-sentence description explaining what each mode is.

Hover state: `transform: translateY(-2px)`. Stacks to single column under 640px via media query.

The semantic distinction now visible before clicking:
- **Explore by Sector** = pedagogical chapter walkthrough. Each chapter introduced first with intro paragraph, then the projects inside it. Organized by what crypto *is*.
- **Curation** = flat tier-first catalog of all 630+ projects with search, category filter, grid/list toggle.

## Technical patterns introduced this session

Worth knowing for future crypto-section work:

**Two-step paint (cache → API).** The pattern in `loadData()` is reusable for any other Notion-backed view that has the same cold-load latency problem. Cache key prefix `frqncy_crypto_*` so multiple pages can have their own caches without colliding.

**Public client API on a hydration script.** `window.FRQNCY_MARKET.repaint()` is the model — a tiny imperative API surfaced from a defer-loaded script so dynamic-render pages can opt in. Same pattern would work for any future overlay script (e.g., a future GitHub-stars or watchlist-status overlay).

**Multi-anchor `paintCard()` insertion.** Instead of forcing every card layout to expose the same anchor element, the script walks a priority list. New card layouts just need to include one of the recognised anchor classes (or rely on the append fallback).

## Static fallback caveat

`v2/crypto/crypto-projects.json` (635 projects, 131 with CG URLs) uses **string tier labels** (`core | conviction | watch | speculative | avoid | unrated`), not letter tiers (`S | A | B | C | D | E | F`). It also has no `chapter` field — chapters are only populated by the Notion API.

This is why `explorer.html`'s new cache uses its own localStorage key seeded only by successful API responses, rather than falling back to the static JSON. Don't be tempted to wire the static JSON in as a fallback without first normalising the tier strings and synthesising chapters.

## Unresolved: commit blocked by sandbox policy

I made all the changes but **could not `git commit` from this session**. Diagnosis:

- The Cowork sandbox bind-mounts the workspace folder via `fuse.bindfs` with a policy that rejects `unlink(2)` system calls. Verified by trying to delete a file I just created — fails with "Operation not permitted" even though I own the file at the Unix layer.
- Git commit needs to delete `.git/index.lock` (and similar) at the end of the operation. The first `commit` attempt creates the lock, fails to clean up, and leaves debris that breaks every subsequent commit.
- This is a sandbox safety policy, not a Unix permissions issue. No amount of user-side `chmod` / `chown` / Full Disk Access can bypass it.

**For the next agent:** assume you cannot commit either. Make the changes, then ask the user to run the commit themselves. They were given the following one-liner this session and asked to paste it (already cd'd into the project folder per their preference):

```
rm -f .git/index.lock .git/HEAD.lock && git commit -m "..." && git push
```

If you see stale `.git/index.lock` or `.git/HEAD.lock`, that's the same issue — only the user can clear it.

## State at end of session

- All four user asks implemented and verified locally (syntax check + curl/grep smoke test on a port-3177 local server).
- Files staged but uncommitted. The user has the commit one-liner ready to paste.
- Task #13 (Verify changes locally) marked completed.

## Quick verification commands the next agent can run

```
node -e "new Function(require('fs').readFileSync('crypto/_market.js','utf8'))" && echo OK
grep -c "data-cgid" crypto/explorer.html crypto/projects.html
grep -c "FRQNCY_MARKET" crypto/_market.js crypto/projects.html crypto/explorer.html
grep -c "filter-hidden" crypto/explorer.html
grep -c "two-ways" crypto/index.html
```

All five greps should return non-zero counts. Syntax check should print `OK`.
