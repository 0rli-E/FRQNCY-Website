#!/bin/bash
# Run this ONE script from the repo root to commit all the world-model work
# from this session. I (Claude) couldn't commit from my sandbox — the mount
# blocks file deletes, which git needs for lock-file cleanup. So you run it.
# After it commits, `git push` as usual.
#
# Safe to run: reads everything that's already in your working tree + staged
# area. No destructive operations. Cleans up any stranded git lock files first.

set -e

cd "$(dirname "$0")"

echo "— Clearing any stale git lock files —"
rm -f .git/index.lock .git/HEAD.lock 2>/dev/null || true

echo "— Status before —"
git status --short | head -20
echo "..."

echo ""
echo "— Staging all changes —"
git add -A

echo ""
echo "— Committing —"
git commit -m "World model: places bed, related topics, map migration, 59 more people, voice linter

- Add places.json (Intaaya as first place) — 5th bed of the world model
- Add 'Connected through the network' section to topic pages — related
  topics computed from shared people/books/orgs/media/places, ranked by
  overlap count, deduped against 'More in [Domain]'
- Migrate v2/explore.html map data to v2/explore-data.json (runtime fetch).
  generate.js now syncs the map with content.json + places.json on every
  build — adds new entities automatically, preserves hand-curated cross-
  pillar links, flags ghost nodes for review
- Remove 4 ghost topics from explore-data.json (t-commodities, t-filestorage,
  t-stocks, t-world-models) — not in content.json; readd by putting them
  in content.json and they'll reappear on the map
- Add voice linter to generate.js — scans all bios + descs against the
  banish list from the voice doc at build time. Currently clean.
- People bed: 35 → 82 (waves 2 + 3). Wave 2 covered authors with 2+
  books, remaining org founders, remaining media creators. Wave 3 covered
  culturally significant single-book authors (Tolle, Frankl, Nestor, Capra,
  Dawkins, Isaacson, adrienne maree brown, Satoshi, Balaji, and more).
- Books with p-id authors: 8 → 74 (28% of catalog)
- Orgs with p-id founders: 1 → 7 (every identifiable founder linked)
- Media with p-id creators: 0 → 13

Total first-class entities across the five beds: 527.

Remaining loose ends (not blocking):
- 194 single-book authors still as strings — diminishing returns; add
  one at a time when the person has meaning for FRQNCY.
- Two partnership media creators (The Minimalists, Bankless hosts) —
  decide whether to split or allow multi-person creator arrays.
"

echo ""
echo "— Done. Now: git push —"
git log --oneline -1
