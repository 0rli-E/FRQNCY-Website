#!/bin/bash
# Commit the book pages + place pages + search integration round.
# Run this, then `git push`.
set -e
cd "$(dirname "$0")"

echo "— Clearing stale git lock files —"
rm -f .git/index.lock .git/HEAD.lock 2>/dev/null || true

echo "— Staging all changes —"
git add -A

echo "— Committing —"
git commit -m "Book pages + place pages + search integration

- Build bookPage() and placePage() templates in generate.js
- Generate /books/[slug]/ for 268 books — each with linked author
  (clickable to /people/[slug]/ if the author is in the people bed),
  Appears-on topics with PICK badges, schema.org Book JSON-LD
- Generate /places/[slug]/ for 1 place (Intaaya) — with location,
  Teachers-in-residence section (ready for future places), Practices
  hosted here, schema.org Place JSON-LD
- Both beds get an alphabetical index page at /books/ and /places/
- Book and place rcards on topic pages now link to the internal profile
  via the same internal_url mechanism person cards use
- Regenerate resources.json from the beds (631 rows) — search.html now
  searches the full world model automatically, in sync on every build
- Entity types (person/book/place) route to their internal profile pages
  in search; external URLs preserved in a new 'external' field. Internal
  URLs open same-tab, external open in a new tab.
- Emit entities.json — slim unified index of all 527 first-class entities
  for any future search/discovery features
- Sitemap: 246 → 517 URLs (+271 new entity pages)
- Status doc updated

The world model is now fully navigable from the site — click any entity
anywhere and land on a page that shows its whole footprint.
"

echo ""
echo "— Done. Now: git push —"
git log --oneline -1
