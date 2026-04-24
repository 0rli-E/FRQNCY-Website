# People Bed — Draft Notes

**What this is:** A first draft of FRQNCY's people list as a first-class entity. Pulled from `content.json`. Sits in `proposals/people-draft.json`. Nothing on the live site changes.

**Status:** Orlando-reviewed. Schema v2. 23 unique humans. 4 minor flags remaining (non-blocking).

---

## Decisions locked in this round

1. **Osho bio** — Confirmed. Using the `t-meditation` version (the more substantive one). ✓
2. **Rupert Spira bio** — Confirmed. Using the `d-meta` version. ✓
3. **Channeling structure** — Added a `channels` array on human records. Each channel entry has `name` and `description`. The human stays canonical; the channeled entity gets its own structured card that can be rendered alongside or separately on the live site. Applied to Barbara Marciniak (channels The Pleiadians) and Darryl Anka (channels Bashar). Easy to promote to a standalone `channels.json` later.
4. **Sarah (Medical Intuitive)** — Kept as-is for now. Revisit if a last name surfaces.
5. **Erin Claire Jones** — Simplified. Canonical name is the human. `display_name` dropped. HD Wild can be referenced elsewhere if/when we add a brand/org bed. ✓
6. **URL typo** — Fixed. `erinclairehjones.com` → `erinclairejones.com`. ✓
7. **Scope** — People first (this pilot), then books, then orgs, then media. Each bed gets its own list in the same pattern. ✓

## Still open (non-blocking)

- **Sarah** — waiting on last name.
- **George Green** — URL is a specific interview, not a personal site. If a canonical URL surfaces, swap it.
- **Arizona Wilder** — URL is a podcast feed. Same note.
- **Birgit Fischer** — she channels "Starseed messages and galactic intelligences" (general, not a single named entity). If you'd like to add one or more specific named channels, let me know — otherwise we leave `channels` empty for her.

## The schema (v2)

```
{
  id             — stable identifier, "p-" prefix (matches your Places convention)
  name           — canonical human name, cleaned
  url            — canonical personal link
  bio            — one-paragraph bio in FRQNCY voice
  appears_in     — array of topic/domain ids where the person shows up
  picked_in      — array of bucket ids where they get the ✦ FRQNCY PICK badge
  channels       — (optional) array of {name, description} for channeled entities
  needs_review   — (optional) note if I made a call that should be confirmed
}
```

## How the builder will use this (when we wire it up)

1. Read `content.json` for a topic's non-person resources — as today.
2. Read `people.json`, filter for people whose `appears_in` includes that topic.
3. Render each matching person as a `.rcard` alongside the other resources. PICK badge if `picked_in` includes the topic.
4. For people with `channels`, render a small sub-card or badge showing the channeled entity's name and description.

Readers see the same pages. You edit a person once, every page updates.

## Rollout (not triggered yet)

1. ✓ Extract + review — done.
2. Repeat for books, orgs, media (each gets its own draft file + review round).
3. Extend `generate.js` to read from all four beds.
4. Apply to 3 test topics, diff the HTML, confirm no visual regression.
5. Roll to the remaining topics.
6. Remove now-redundant person/book/org/media entries from `content.json`.
7. Move the four files from `proposals/` to the root as `people.json`, `books.json`, `orgs.json`, `media.json`. Live.

Steps 3–7 happen once all four beds exist and have been reviewed.
