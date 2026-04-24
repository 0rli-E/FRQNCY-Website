# FRQNCY World Model — Current Status

**As of 2026-04-24.**

The shift from "content.json only" to "content.json + four first-class beds" is live in `generate.js`. Every build reads from the beds and composes them with the remaining resource types.

---

## What's live now

### Four first-class beds at the repo root

| File | Entries | What's in it |
|---|---|---|
| `people.json` | 35 humans | Teachers, founders, creators, thinkers with structured bios, topic links, pick status, and optional `channels` arrays for humans who channel named entities |
| `books.json` | 268 books | Canonical title, author (p-id link or string), URL, one bio per book, topic links |
| `orgs.json` | 102 orgs | Name, founder (p-id or string), URL, bio, topic links |
| `media.json` | 74 media | Podcasts, channels, newsletters, films, publications with creator links |

**467 first-class entities** across the four beds.

### `generate.js` now reads the beds

At build time, for each topic, the generator merges bed-sourced entities with leftover content.json resources (tools, courses, platforms, apps, websites, references, articles). Output HTML is byte-identical to what was there before, with the approved cleanups (Erin Claire Jones, Lyn Alden, Jovian Archive, etc.).

Fallback: if any bed file is missing, the generator falls back to pure-content.json mode. Safe default.

### Author/founder/creator links

- **21 books** now link their author to a `p-` id (up from 8).
- **8 founders** in orgs (Sadhguru → Isha Foundation being the new one; 7 others from the original extraction with founders still as strings).
- **8 media creators** now link to `p-` ids (up from 0).

---

## Who's in the people bed (35)

### Originally extracted (23)
Alan Watts, Arizona Wilder, Barbara Marciniak (channels The Pleiadians), Bob Lazar, Darryl Anka (channels Bashar), Dolores Cannon, Dr. Joe Dispenza, Emma Grede, Erin Claire Jones, George Green, Graham Hancock, Jenna Zoe, Joe McMoneagle, Karen Curry Parker, Lyn Alden, Marshall Rosenberg, Osho, Ra Uru Hu, Randall Carlson, Rupert Spira, Sai Maa, Sarah (Medical Intuitive), Birgit Fischer.

### Just added (12 priority)
Andrew Huberman, Bruce Schneier, Dr. David R. Hawkins, Masaru Emoto, Michael Pollan, Naval Ravikant, Paramhansa Yogananda, Paul Graham, Rupert Sheldrake, Sadhguru, Thich Nhat Hanh, Vitalik Buterin.

---

## What's still plain strings (future A-work)

### Authors in books.json with 2+ appearances (top candidates)
Swami Muktananda (3), Rhonda Byrne (3), Gurumayi Chidvilasananda (3), Sri Swami Satchidananda, Sean Carroll, Peter Drucker, Paul Selig, Napoleon Hill, Michael A. Singer, Lao Tzu, Kevin Trudeau, Geshe Michael Roach, Dale Carnegie, Carlo Rovelli, Carl Sagan — 2 books each.

### Founders in orgs.json still as strings
Swami Kriyananda, Eileen McKusick, Manly P. Hall, Bill Ryan & Kerry Cassidy, Sylvia Earle, Steven Greer.

### Creators in media.json still as strings
Joe Rogan (if added), Tim Ferriss, Krista Tippett, Joshua Fields Millburn & Ryan Nicodemus, Ryan Sean Adams & David Hoffman, Joe McMoneagle (already linked as person), Ryan Holiday, Lex Fridman.

Each of these is a one-line update away from being linked.

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
