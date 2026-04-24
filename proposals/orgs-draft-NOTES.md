# Orgs Bed — Draft Notes

**What this is:** First draft of FRQNCY's orgs list as a first-class entity. Pulled from `content.json`. Sits in `proposals/orgs-draft.json`. Nothing on the live site changes.

**Status:** First pass done. 102 unique orgs. Clean — zero review flags remaining.

---

## What I found

- 105 org entries in `content.json` → **102 unique orgs** after deduping 3 near-duplicates (HeartMath Institute, Rocky Mountain Institute, Rodale Institute — each appeared under two different topic buckets).
- 12 orgs had em-dash titles — split into two categories:
  - **Acronym expansions**: MAPS, IANDS, NREL, GIIN, Jovian Archive. The full expanded name became the canonical `name`.
  - **Founder attributions**: Isha Foundation (Sadhguru), Mission Blue (Sylvia Earle), Ananda (Swami Kriyananda), Biofield Tuning (Eileen McKusick), Cosmic Wisdom (Manly P. Hall), Project Camelot (Bill Ryan & Kerry Cassidy), The Disclosure Project (Steven Greer). Org name + founder field.
- 2 URL conflicts were www-vs-no-www duplicates — normalized automatically.
- **Zero orgs flagged for your review.** Clean bed.

## The schema

```
{
  id                      — stable identifier, "o-" prefix
  name                    — clean org name
  founder                 — EITHER a "p-" person id (if founder is in the people bed)
                            OR a plain string (if known but not yet in the people bed)
                            OR null (no clear founder)
  founder_is_person_ref   — boolean
  url                     — canonical URL
  bio                     — one-line description in the FRQNCY voice
  appears_in              — topics/domains where the org shows up
  picked_in               — buckets where it gets the ✦ FRQNCY PICK badge
}
```

## Founder linking status

- **0 founders currently linked to the people bed** — because the 7 founders I identified (Sadhguru, Sylvia Earle, Swami Kriyananda, Eileen McKusick, Manly P. Hall, Bill Ryan & Kerry Cassidy, Steven Greer) aren't in the people bed yet. All are plain strings for now.
- **95 orgs have no visible founder** — institutional orgs (Santa Fe Institute, EFF, Ellen MacArthur Foundation, MAPS, etc.) where the founder isn't the story.

When any of these 7 founders later gets added to the people bed, flipping `founder_is_person_ref` from false to true is a one-line change. No schema migration.

**Strong candidates for the next people-bed expansion:** Sadhguru (core to FRQNCY's voice lineage per your voice doc), Manly P. Hall, Sylvia Earle, Bill Ryan & Kerry Cassidy.

## Nothing for you to decide this round

All the ambiguous cases had clear correct answers (em-dash acronyms vs founders, www canonical). If you spot something off in the draft, shout.

## What's next

- **People** (23) — ✓ done
- **Books** (268) — ✓ done
- **Orgs** (102) — ✓ done
- **Media** (77) — next

Then wire up the builder to read from all four beds.
