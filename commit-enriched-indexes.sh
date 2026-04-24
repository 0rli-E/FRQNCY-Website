#!/bin/bash
# Enrich entity indexes: picks-first, appearance counts, PICK badges.
set -e
cd "$(dirname "$0")"

rm -f .git/index.lock .git/HEAD.lock 2>/dev/null || true
git add -A

git commit -m "Enrich entity index pages: picks-first, counts, PICK badges

Turn /people/, /books/, /orgs/, /media/, /places/ from flat alphabetical
grids into discovery tools that surface FRQNCY's taste.

- Unify: all five index pages now use one entityIndexPage() function
  (was inline duplication for /people/ previously)
- Each card shows: entity type eyebrow, appearance count across the
  network (N appearances), and a gold ✦ PICK badge when the entity
  is picked anywhere
- Sort: PICK entities first, alphabetical within each group
- Headers updated: 'The humans FRQNCY points to — 82 teachers,
  founders, creators, and thinkers. Picks first.' etc.

Pick density now visible at a glance:
  /people/  32/82  picks
  /books/   106/268
  /orgs/    14/102
  /media/   15/74
  /places/  1/1
"

echo ""
echo "— Done. Now: git push —"
git log --oneline -1
