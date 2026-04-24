#!/bin/bash
# Commit the org pages + media pages round.
# Run this, then `git push`.
set -e
cd "$(dirname "$0")"

echo "— Clearing stale git lock files —"
rm -f .git/index.lock .git/HEAD.lock 2>/dev/null || true

echo "— Staging all changes —"
git add -A

echo "— Committing —"
git commit -m "Org pages + media pages: every entity now has a profile

- Build orgPage() and mediaPage() templates in generate.js — same
  pattern as book/place pages
- Generate /orgs/[slug]/ for 102 orgs. Linked founder (points to
  /people/[slug]/ if founder is in bed). Appears-on topics with PICK
  badges. schema.org Organization JSON-LD
- Generate /media/[slug]/ for 74 media. Linked creator. Appears-on
  topics. schema.org CreativeWork JSON-LD
- Both beds get alphabetical index pages at /orgs/ and /media/
- Org and media rcards on topic pages now link to internal profiles
  via internal_url (same mechanism as person/book/place)
- resources.json emits internal URLs for orgs/media (search now routes
  users to the rich profile first, external URL preserved in 'external')
- entities.json records for orgs/media also route to internal pages
- Sitemap: 517 → 695 URLs (+178 new entity pages)
- Status doc updated

Every first-class entity in the world model now has a dedicated page.
People (82), Books (268), Orgs (102), Media (74), Places (1) — 527
profiles, all linked from every topic, all searchable, all indexed.
"

echo ""
echo "— Done. Now: git push —"
git log --oneline -1
