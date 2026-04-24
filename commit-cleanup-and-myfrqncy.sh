#!/bin/bash
# Tech debt sweep + dead-link checker script + My-FRQNCY reads the beds.
set -e
cd "$(dirname "$0")"

echo "— Clearing stale git lock files —"
rm -f .git/index.lock .git/HEAD.lock 2>/dev/null || true

echo "— Tech debt: remove orphan directories —"
rm -rf v2/people/ v2.pre-beds-backup/ social-app.superseded/ versions/
rm -f _tmp_content_bed.json _tmp_generate_bed.js
rm -f proposals/_tmp_content_bed.json proposals/_tmp_generate_bed.js

echo "— Tech debt: remove old commit-*.sh scripts (all commits are on main) —"
rm -f commit-all-entity-pages.sh commit-book-place-search.sh commit-enriched-indexes.sh
rm -f commit-nav-and-fixes.sh commit-nav-hubs.sh commit-nice-to-haves.sh
rm -f commit-org-media-pages.sh commit-person-pages.sh commit-world-model.sh
rm -f commit-tech-debt-sweep.sh

git add -A

git commit -m "Tech debt sweep + link-health checker + My-FRQNCY reads the beds

Three improvements bundled:

1. Repository cleanup
   Removed orphan directories and stranded artifacts:
   - v2/people/                legacy empty from before People moved to /people/
   - v2.pre-beds-backup/       safety copy from migration, redundant w/ git
   - social-app.superseded/    explicitly superseded Astro build (960K)
   - versions/                 old map iteration backups (7 files, 236K)
   - _tmp_*.json, _tmp_*.js    migration scratch files at root + in proposals/
   - 10 old commit-*.sh scripts (all commits already on main)
   ~1.2MB lighter, materially more readable.

2. Dead external link checker
   New scripts/check-links.mjs. Walks every URL across content.json +
   the 5 beds, HEAD/GET with 8s timeout, writes link-health.json with
   ok/redirects/broken buckets. Run monthly via 'npm run check:links'.
   Report-only; you review and decide replacements.

3. My-FRQNCY uses the beds
   - my-frqncy.html now fetches entities.json alongside search.json
     and resources.json
   - Teacher selection upgraded: prefer FRQNCY picks first, then people
     with the most overlap across the user's selected domains. 'Also
     teaches across N of your topics · ✦ PICK' shows on cards.
   - Internal profile URLs (/people/[slug]/) open in the same tab
     instead of a new window — click = deeper dive, not context switch.
   - Graceful fallback to the old resources.json logic if entities.json
     fails to load.
"

echo ""
echo "— Done. Now: git push —"
git log --oneline -1
