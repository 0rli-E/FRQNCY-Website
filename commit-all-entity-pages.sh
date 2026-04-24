#!/bin/bash
# ONE script that commits everything pending since the people-pages commit:
# - Book pages + places pages + search integration
# - Org pages + media pages
# - resources.json regeneration from the beds
# - entities.json emission
# - 156 v2/ topic pages regenerated with internal-URL links
# Run this, then `git push`.
set -e
cd "$(dirname "$0")"

echo "— Clearing stale git lock files —"
rm -f .git/index.lock .git/HEAD.lock 2>/dev/null || true

echo "— Staging all changes —"
git add -A

echo "— Committing —"
git commit -m "Book / org / media / place pages + search integration

Completes the entity-page coverage. Every first-class entity in the
world model now has a dedicated profile page linked from every topic.

Pages generated:
- /books/[slug]/  — 268 book profiles + index. Linked author (clicks
  to /people/[slug]/ when author is in the people bed). Appears-on
  topics with PICK badges. schema.org Book JSON-LD.
- /orgs/[slug]/   — 102 org profiles + index. Linked founder. schema.org
  Organization JSON-LD.
- /media/[slug]/  — 74 media profiles + index. Linked creator. schema.org
  CreativeWork JSON-LD.
- /places/[slug]/ — 1 place profile (Intaaya) + index. Location, teachers
  in residence, practices hosted here. schema.org Place JSON-LD.

Wiring:
- Book / org / media / place rcards on topic pages now link to internal
  profiles via the same internal_url mechanism person cards use. Clicking
  any entity name on a topic page lands you on that entity's profile.
- resources.json regenerated from the beds (631 rows). Search.html
  automatically reflects the world model on every build. Person / book /
  org / media / place types route to their internal profile pages; the
  external URL is preserved in a new 'external' field.
- entities.json emitted — slim unified index of 527 entities (type +
  topics + pick status) for future search/discovery features.
- search.html: internal URLs open same-tab, external URLs open new-tab.

Sitemap: 246 → 695 URLs (+449 new entity pages)

Total first-class entities now covered by pages:
  People  82 + 1 index
  Books   268 + 1 index
  Orgs    102 + 1 index
  Media   74 + 1 index
  Places  1 + 1 index
  ─────────────────────
  527 profiles + 5 indexes
"

echo ""
echo "— Done. Now: git push —"
git log --oneline -1
