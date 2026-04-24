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

### Entity pages — every first-class entity has a profile

- **`/people/[slug]/`** — 82 profiles + index. Hero, Works (books/orgs/media), Channels, Teaches across. schema.org `Person`.
- **`/books/[slug]/`** — 268 profiles + index. Hero, linked author, Appears on. schema.org `Book`.
- **`/orgs/[slug]/`** — 102 profiles + index. Hero, linked founder (if any), Appears on. schema.org `Organization`.
- **`/media/[slug]/`** — 74 profiles + index. Hero, linked creator (if any), Appears on. schema.org `CreativeWork`.
- **`/places/[slug]/`** — 1 profile + index (Intaaya). Hero with location, Teachers in residence, Practices hosted here. schema.org `Place`.

**Every entity name on every topic page now links to its profile.** The world model is fully navigable — click a book on a topic, land on the book's profile, click its author, land on the person, click their media, land on the media, click back to a related topic, and so on. Each node in the graph has a home you can visit.

### Search integration

`resources.json` is now **regenerated from the beds on every build** (631 rows, one per entity-topic pair) — so search.html always reflects the current world model. Entity types (person/book/place) use the internal profile URL as their `url` so search results route users to the rich profile first; external URLs preserved as `external` for anyone needing them. Search opens internal links in the same tab and external links in a new tab.

Also emitted: **`entities.json`** — a slim unified index of all 527 first-class entities (across the five beds) with type, topics, and pick status. Available for any future search or discovery feature that wants to query the world model without loading the full bed files.

### Sitemap + discoverability

**695 URLs now in the sitemap** (up from 163):
- 155 topic/domain/pillar pages
- 82 person profiles + index
- 268 book profiles + index
- 102 org profiles + index
- 74 media profiles + index
- 1 place profile + index
- Site-level pages (about, platform, podcast, etc.)

### Entity hubs in the main nav

The Discover dropdown in the site header now exposes all five entity hubs: **People / Books / Orgs / Media / Places**. Applied across all 9 root-level pages that carry the main nav. Readers can now jump straight from any page to the relevant hub.

### Enriched entity index pages

Each entity index (`/people/`, `/books/`, `/orgs/`, `/media/`, `/places/`) is now a discovery tool, not just an alphabetical dump:
- **Picks first** — FRQNCY's curated selections surface at the top
- **Appearance count** on each card — "5 appearances" signals how woven an entity is across the network
- **✦ PICK badge** — gold, in the FRQNCY voice
- Header tagline updates automatically: "82 teachers, founders, creators, and thinkers. Picks first."

Current pick density on each hub:
- `/people/` — 32 of 82 picked
- `/books/` — 106 of 268 picked
- `/orgs/` — 14 of 102 picked
- `/media/` — 15 of 74 picked
- `/places/` — 1 of 1 picked

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
