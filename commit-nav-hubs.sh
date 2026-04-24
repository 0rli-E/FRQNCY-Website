#!/bin/bash
# Commit the site-nav update: five entity hubs in the main Discover dropdown.
set -e
cd "$(dirname "$0")"

echo "— Clearing stale git lock files —"
rm -f .git/index.lock .git/HEAD.lock 2>/dev/null || true

echo "— Staging all changes —"
git add -A

echo "— Committing —"
git commit -m "Main nav: add entity hubs (People, Books, Orgs, Media, Places)

Discover dropdown now lists all five entity hubs so readers can land
on the new profile indexes directly from the header, not just by
clicking into a topic page.

- Fix broken 'People' path across all nav instances:
  v2/people/index.html → /people/ (the correct root-level path)
- Add four new entries under Discover:
  · Books   → /books/   (268 curated books)
  · Orgs    → /orgs/    (102 organisations)
  · Media   → /media/   (74 podcasts & publications)
  · Places  → /places/  (physical sanctuaries)

Updated across all 9 root-level pages that carry the main nav:
index, about, chart, my-frqncy, platform, podcast, space,
start-here, search.

Topic/domain/pillar pages under /v2/ use the generate.js breadcrumb
nav and are unaffected.
"

echo ""
echo "— Done. Now: git push —"
git log --oneline -1
