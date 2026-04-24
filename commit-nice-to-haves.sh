#!/bin/bash
# Related-teachers on topic pages + Abraham-Hicks + partnership creators.
set -e
cd "$(dirname "$0")"

rm -f .git/index.lock .git/HEAD.lock 2>/dev/null || true
git add -A

git commit -m "Related teachers on topic pages + Abraham-Hicks + partnership creators

Nice-to-haves round. Three improvements.

1. 'Teachers on this topic' section on every topic page
   Computes people who teach the current topic and ranks them by breadth
   (how many OTHER topics they also teach). Cards show 'also teaches N
   other topics' so readers see cross-domain teachers at a glance. 52 of
   134 topic pages now render the section (others have no bed-linked
   teachers yet — will fill in as the people bed grows).

2. Abraham-Hicks voice-lineage added
   - Esther Hicks (channels Abraham, since 1985) with Abraham as a
     first-class channel entry (same pattern as Barbara Marciniak → The
     Pleiadians)
   - Jerry Hicks as a separate person, co-author on the Abraham material
   - The two books ('Ask and It Is Given', 'The Law of Attraction')
     relinked from 'Esther & Jerry Hicks' string to p-esther-hicks

3. Partnership media creators
   Added 4 people: Joshua Fields Millburn + Ryan Nicodemus (The
   Minimalists), Ryan Sean Adams + David Hoffman (Bankless). New
   'co_creators' array field on media entries lets both halves of a
   partnership link. Media pages now render 'By X & Y' with both names
   linked to their profiles. Co-creators get the media in their Works
   section too.

Side notes:
- Long-tail string author extraction (the remaining ~190 single-book
  authors) was scoped out. Stub bios would dilute the voice-doc
  quality standards — the bar should stay high. Keep adding
  case-by-case as names gain meaning.
- v2/people/ is a legacy orphan directory (0 inbound links). Flag for
  manual removal when convenient.

People bed: 82 → 88.
Books with p-id authors: 74 → 76.
Media with p-id creators: 13 → 15.
Sitemap: 695 → 701 URLs.
"

echo ""
echo "— Done. Now: git push —"
git log --oneline -1
