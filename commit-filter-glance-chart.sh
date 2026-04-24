#!/bin/bash
# Filter chips + at-a-glance + chart generator bed integration
set -e
cd "$(dirname "$0")"

rm -f .git/index.lock .git/HEAD.lock 2>/dev/null || true

git add -A

git commit -m "Filter chips on hubs + at-a-glance on topic pages + chart -> people

Three improvements:

1. Filter chips on all 5 entity hubs
   - Each of /people/, /books/, /orgs/, /media/, /places/ now has filter
     chips at the top: All, ✦ Picks only, and one per pillar the entity
     touches (Network State, Fund, Education, Research, Media, Builder).
   - Pillars derived from each entity's appears_in (topic → domain →
     pillar). An entity spanning multiple pillars shows up under each.
   - Cards carry data-pillars attribute. Small vanilla-JS click handler
     filters in place — no re-render, instant. 'No entities match'
     state for empty filters.
   - Chip counts render right on each chip so readers see distribution
     at a glance: 'Research · 14' etc.

2. At-a-glance summary on every topic page
   - One-line meta bar above the Curated Resources filter tabs:
     '10 resources · 2 teachers · 4 books · 1 place · 1 tool ·
      1 platform · 1 app · 3 ✦ picks' (picks in gold)
   - Renders for every topic with resources. Gives readers the shape
     of this topic in one sentence before diving in.

3. Chart generator wired to the people bed
   - chart.html now has a 'Teachers to go deeper with' section at the
     bottom that loads /people.json at runtime and renders the teachers
     whose appears_in covers Human Design or Gene Keys topics.
   - Sort: picks first, then bio richness. Currently Jenna Zoe and
     Ra Uru Hu surface top (both ✦ picks).
   - Graceful fallback: if people.json fails to load, shows a message
     pointing to /people/.
   - This closes the loop your meta description promises: 'the on-ramp
     into Education' — chart → type → specific teacher.
"

echo ""
echo "— Done. Now: git push —"
git log --oneline -1
