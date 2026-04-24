#!/bin/bash
# Commit the person-pages round.
# Run this, then `git push`.
set -e
cd "$(dirname "$0")"

echo "— Clearing stale git lock files —"
rm -f .git/index.lock .git/HEAD.lock 2>/dev/null || true

echo "— Staging all changes —"
git add -A

echo "— Committing —"
git commit -m "People pages: 82 profile pages + index at /people/

- Build personPage() template in generate.js rendering hero, works
  (books/orgs/media from the beds), channels, and topics-they-teach
- Generate /people/[slug]/index.html for every person in people.json
  (82 pages total) plus an alphabetical /people/ index
- Person name on every .rcard across topic/domain/pillar pages now
  links to the internal profile page (via new internal_url field).
  External 'Visit →' button still goes to the person's own site.
- schema.org Person JSON-LD on each profile with sameAs → external URL
- Sitemap extended with /people/ index + all 82 profile URLs (+83 URLs)
- Status doc updated

The world model now renders its first dedicated entity type.
"

echo ""
echo "— Done. Now: git push —"
git log --oneline -1
