# Media Bed — Draft Notes

**What this is:** First draft of FRQNCY's media list as a first-class entity (podcasts, YouTube channels, newsletters, publications, films, documentaries, research sites). Sits in `proposals/media-draft.json`. Nothing on the live site changes.

**Status:** First pass done. 74 unique media entries. Zero review flags remaining.

---

## What I found

- 77 media entries in `content.json` → **74 unique media** after deduping (Bankless, NASA Astronomy Picture of the Day, Quanta Magazine each appeared twice under different topic buckets).
- 8 titles had em-dashes — resolved two ways:
  - **Creator attribution** (3 titles): the Emoto water films, Sugata Mitra's Hole in the Wall — split into `name` + `creator` fields.
  - **Topical scoping** (5 titles): "Quanta Magazine — Quantum," "Our World in Data — Energy," "Messari — AI Tokens Research," "On Being with Krista Tippett — Poetry Episodes," "Waypoint — Vice Gaming" — kept as their own entries because they point to specific deep links / sections / tags, not the parent publication. These sit alongside their parent (e.g., "Quanta Magazine" and "Quanta Magazine — Quantum" are both entries).

## The schema

```
{
  id                      — stable identifier, "m-" prefix
  name                    — clean media name
  creator                 — EITHER a "p-" person id (if creator is in the people bed)
                            OR a plain string (if known but not yet in the people bed)
                            OR null (institutional or unknown creator)
  creator_is_person_ref   — boolean
  url                     — canonical URL
  bio                     — one-line description in the FRQNCY voice
  appears_in              — topics/domains where the media shows up
  picked_in               — buckets where it gets the ✦ FRQNCY PICK badge
}
```

## Creator linking

- **0 creators currently linked to the people bed** — none of the identified creators are in it yet.
- **15 creators captured as strings** — ready to flip to p-id links once those humans are added.
- **59 media entries have no identified creator** — mostly institutional (NASA, MIT Tech Review, Reuters, scientific journals) where the creator isn't the story.

The 15 creators that became string candidates:

Andrew Huberman, Bruce Schneier, Gwern Branwen, Grant Sanderson, Joe Rogan (not present but template), Joshua Fields Millburn & Ryan Nicodemus, Krista Tippett, Masaru Emoto (2 films), Naval Ravikant, Paul Graham, Roger Ebert, Rupert Sheldrake, Ryan Sean Adams & David Hoffman, Sugata Mitra, Vitalik Buterin.

**Strongest people-bed candidates (solo-operator creators with strong signal):**
- **Andrew Huberman** — your t-neuro topic's Huberman Lab entry, plus he's cited in books, plus he fits voice lineage (teacher figure). Top priority.
- **Vitalik Buterin** — Ethereum's creator, appears in books and media on FRQNCY.
- **Naval Ravikant** — quoted widely.
- **Paul Graham** — startup writing canon.
- **Rupert Sheldrake** — metaphysics adjacency.
- **Bruce Schneier** — cybersecurity anchor.
- **Masaru Emoto** — authored multiple films; metaphysics adjacency.

When any of these go into the people bed, `creator_is_person_ref` flips to true. No schema migration.

## Nothing for you to decide this round

All the ambiguous cases had clear correct answers. If you spot something off in the draft, shout.

## The topical-scoping question (low-priority, for future)

Five entries are topical sections of larger publications:
- Quanta Magazine — Quantum
- Our World in Data — Energy
- Messari — AI Tokens Research
- On Being with Krista Tippett — Poetry Episodes
- Waypoint — Vice Gaming

They sit as their own entries. Alternative later: treat them as deep links of their parents (e.g., a `deep_links` array on the parent). Not a blocker — flag for the future.

## What's next

- **People** (23) — ✓ done
- **Books** (268) — ✓ done
- **Orgs** (102) — ✓ done
- **Media** (74) — ✓ done

All four beds drafted. Next step: **wire up the builder** to read from these files and regenerate topic pages. Visual output stays identical; data consolidates.

Before we wire anything up, I recommend one quick pass: **apply the beds back to content.json** so that person/book/org/media entries in content.json become lightweight references (`{"ref": "p-huberman"}` or similar) rather than fully duplicated rows. That's the cleanest way to keep content.json as the single source of "what appears where" while the beds hold the actual truth.
