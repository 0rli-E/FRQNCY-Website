# FRQNCY World Model — Current Status

**As of 2026-04-24 (updated).**

The shift from "content.json only" to "content.json + five first-class beds" is live in `generate.js`. Every build reads from the beds and composes them with the remaining resource types. The website now shows cross-domain connections computed from shared entities.

---

## What's live now

### Five first-class beds at the repo root

| File | Entries | What's in it |
|---|---|---|
| `people.json` | **82 humans** | Teachers, founders, creators, thinkers with structured bios, topic links, pick status, and optional `channels` arrays for humans who channel named entities |
| `books.json` | 268 books | Canonical title, author (p-id link or string), URL, one bio per book, topic links |
| `orgs.json` | 102 orgs | Name, founder (p-id or string), URL, bio, topic links |
| `media.json` | 74 media | Podcasts, channels, newsletters, films, publications with creator links |
| `places.json` | 1 place (Intaaya) | Physical venues — name, location, URL, bio, topic links, teachers_in_residence |

**527 first-class entities** across the five beds.

### People-bed expansion (waves 2 + 3)

**Wave 2 (27 added):** Swami Muktananda, Rhonda Byrne, Gurumayi Chidvilasananda, Sri Swami Satchidananda, Sean Carroll, Peter Drucker, Paul Selig, Napoleon Hill, Michael A. Singer, Lao Tzu, Kevin Trudeau, Geshe Michael Roach, Dale Carnegie, Carlo Rovelli, Carl Sagan, Sylvia Earle, Manly P. Hall, Eileen McKusick, Swami Kriyananda, Steven Greer, Bill Ryan & Kerry Cassidy, Krista Tippett, Ryan Holiday, Sugata Mitra, Roger Ebert, Grant Sanderson, Gwern Branwen.

**Wave 3 (20 added — cultural heavyweights with single-book presence):** Eckhart Tolle, Viktor Frankl, James Nestor, Fritjof Capra, Peter Wohlleben, Richard Dawkins, Walter Isaacson, adrienne maree brown, Robin Wall Kimmerer, Neville Goddard, Deepak Chopra, Malcolm Gladwell, Satoshi Nakamoto, Andreas Antonopoulos, Balaji Srinivasan, Anita Moorjani, Helen Schucman, Hermes Trismegistus, Three Initiates, Edgar Cayce.

**Cumulative bed-linked references:**
- Books with author → p-id: **74/268 (28%)** — up from 8 → 21 → 54 → 74
- Orgs with founder → p-id: **7/102** — every org with an identifiable founder now linked
- Media with creator → p-id: **13/74**

### New user-visible feature: "Connected through the network"

Every topic page now computes a **related topics section based on shared entities**. If Meditation and Vibration share Dr. David R. Hawkins (books) and Masaru Emoto, they're connected. If Meditation and Permaculture share Intaaya (place), they're connected. The section ranks topics by overlap count and shows "N shared" on each card. **35 of 134 topic pages** now have meaningful cross-network connections (up from 31 after wave 2) — and the density of connections on each page has grown as well.

The existing "More in [Domain]" section still renders, deduped against the new connections so no topic appears twice.

### Network map now reads from the beds too

`v2/explore.html` used to carry its own hand-maintained `NODES` / `RAW` / `NODE_URL` arrays — a third source of truth. That's gone. The map now fetches `v2/explore-data.json` at runtime. On every build, `generate.js` syncs that file with content.json + places.json:

- Adds any new pillar, domain, topic, or place automatically
- Adds primary pillar→domain and domain→topic links automatically
- Adds place→topic links from `places.json` `appears_in`
- **Preserves hand-curated cross-pillar links and map-specific short descriptions**
- **Flags ghost nodes** (in the map but not in content.json or places.json) in a `$ghost_nodes` field for manual review

First sync caught real drift: `t-humandesign` was missing from the map (now added). Four ghost topics (`t-filestorage`, `t-stocks`, `t-commodities`, `t-world-models`) that existed on the map but not in content.json have been **removed** — if you want them back, add them to content.json and they'll reappear on the map automatically.

### Voice linter at build time

Every `node generate.js` run scans all bios (across the five beds) and all descriptions (on topics/domains/pillars/resources in content.json) against the voice doc's banish list: *wellness, holistic, authentic self, vibes, disrupt, game changing, high vibe, join the revolution,* and more. Word-boundary matched so "vibration" doesn't false-trip on "vibes." Proper-noun phrases like Savory's "Holistic Planned Grazing" are allowlisted. Non-fatal — the build completes either way, but drift is visible.

**Current state: `voice: clean — no banished words across beds or content.json descs`.**

### Person pages — `/people/[slug]/`

Every human in the people bed now has a dedicated profile page. **82 person pages + 1 index at `/people/`.** Each profile shows:

- Hero: name, bio, link to their external site
- **Works** — their books, orgs, and media rendered as cards (from the beds via `author_is_person_ref` / `founder_is_person_ref` / `creator_is_person_ref`)
- **Channels** — the named entities they channel (for humans who do — Barbara Marciniak → Pleiadians, Darryl Anka → Bashar)
- **Teaches across** — every topic they appear on, as navigable cards
- schema.org Person JSON-LD markup with sameAs link to their external URL

**The world model is now visibly navigable.** When you see Osho on the Meditation topic page, his name is a link to `/people/osho/` where you see his whole footprint in the network. Same for all 82 humans.

Sitemap updated to include the people index and all 82 profile pages.

### `generate.js` now reads the beds

At build time, for each topic, the generator merges bed-sourced entities with leftover content.json resources (tools, courses, platforms, apps, websites, references, articles). Output HTML is byte-identical to what was there before, with the approved cleanups (Erin Claire Jones, Lyn Alden, Jovian Archive, etc.).

Fallback: if any bed file is missing, the generator falls back to pure-content.json mode. Safe default.

---

## What's still plain strings (remaining work)

### Authors in books.json
**194 books** still reference their author as a plain string. These are the long tail — mostly single-book authors who weren't culturally load-bearing enough for wave 2 or wave 3. Each can be promoted to a `p-` link by adding the person to `people.json` and flipping one field. No code changes needed.

### Founders in orgs.json
Zero remaining. Every org with an identifiable founder in the data is now linked.

### Creators in media.json still as strings
Joshua Fields Millburn & Ryan Nicodemus (The Minimalists — a partnership), Ryan Sean Adams & David Hoffman (Bankless — a partnership). Partnerships are harder to model as single-person entities; defer until we decide whether to split them or allow multi-person creator arrays.

---

## How to keep growing the model

### Adding a new person
1. Add a new entry to `people.json` with id (p-slug), name, url, bio, appears_in, picked_in.
2. If they wrote a book / founded an org / host a media channel, find that entry in the respective bed and set `author` / `founder` / `creator` to the new p-id, flip `*_is_person_ref` to true.
3. Run `node generate.js`. Done.

### Adding a new book / org / media
Same pattern but for the new bed.

### Adding a new topic
Still in content.json for now — the beds reference topic ids, they don't define them.

---

## What's next (options)

- **Finish people bed expansion** — extract the remaining ~100+ author/founder/creator strings into proper person entries. Highest-volume first.
- **Introduce a places bed** — Intaaya is still only in `v2/explore.html` as `p-intaaya`. A proper `places.json` would let topic pages say "taught at Intaaya" automatically.
- **Introduce a channels bed** — if you want The Pleiadians, Bashar, etc. to be their own entities linkable across the graph.
- **Voice as build-time check** — parse bios and hero copy against the voice doc's banished-word list, fail the build if violations appear.
- **Related topics** — auto-compute related-topics sections from shared entities rather than just same-domain listing.

All of these build on what's now in place. None is urgent.
