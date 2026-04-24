#!/bin/bash
# Fix regressions surfaced in the audit + polish.
set -e
cd "$(dirname "$0")"

rm -f .git/index.lock .git/HEAD.lock 2>/dev/null || true
git add -A

git commit -m "Fix cross-hub nav, thin profiles, duplicate search hits

Honest audit found three real regressions/gaps. All three fixed.

1. Cross-hub nav on every generated page
   - generate.js nav() used relative paths (../watch/, ../../search.html)
     so it only worked from /v2/[topic]/. New entity pages at /people/,
     /books/, etc. had the same nav but with broken relative paths.
   - Rewrote nav() to use absolute paths AND include all five entity
     hubs (People / Books / Orgs / Media / Places) directly in the
     header. Every topic page, domain page, pillar page, and entity
     profile now has one-click navigation between hubs without going
     home first. 682 of 691 generated pages now carry all 5 hub links;
     remaining 9 are hand-maintained hubs (crypto, courses, watch)
     with their own navs.

2. Thin person/book/org/media profiles
   - Profile pages rendered only topic-level entries from appears_in.
     Entities attached at domain or pillar level (Osho → d-meta,
     adrienne maree brown → d-society) rendered empty 'teaches across'
     sections even though they had real appearances.
   - New appearancesFor() helper returns topics, domains, AND pillars
     with per-card eyebrow labels ('Topic' / 'Domain' / 'Pillar') and
     PICK badges preserved. Applied to person, book, org, media, place
     profile templates via shared appearsOnSection() helper.
   - Osho's page now shows Meditation (Topic) + Metaphysics (Domain)
     instead of just Meditation.

3. Duplicate search hits for multi-topic entities
   - resources.json emits one row per entity-topic pair. Searching
     'Hawkins' returned 5 identical cards, all linking to the same
     profile. Noisy and wasteful.
   - search.html now dedupes entity hits by internal URL and shows
     'across N topics' in the meta line instead of N copies of the
     card. External URLs (orgs without a profile, etc.) retain their
     per-topic rows since they carry meaningful topic context.

Every generated page regenerated with the new nav + appearance logic.
"

echo ""
echo "— Done. Now: git push —"
git log --oneline -1
