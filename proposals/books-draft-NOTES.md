# Books Bed — Draft Notes

**What this is:** First draft of FRQNCY's books list as a first-class entity. Pulled from `content.json`. Sits in `proposals/books-draft.json`. Nothing on the live site changes.

**Status:** Orlando-reviewed, decisions applied. 268 unique books. Schema v2. Ready for books-bed approval.

---

## What I found

- 299 book entries in `content.json` → **268 unique books** after deduping (including 4 caught as near-duplicates with minor title spelling variations).
- 290 of the 299 entries followed the clean pattern `"Title — Author"`. Easy to parse automatically.
- 22 books appeared under multiple topics with **different custom bios per topic** — these have been consolidated into one canonical bio per book that works across all contexts.
- 9 books didn't follow the title-author pattern (ancient texts, whitepapers, compilations) — authors added manually.
- 4 books had near-duplicate entries because of minor title spelling differences — merged.

## Decisions applied in this pass

1. **One bio per book, not per-topic.** The `bio_overrides` pattern was removed. Each book now has a single canonical bio that makes sense across all the topics where it appears. I synthesized 22 new bios for the multi-topic books.
2. **Longest bio used as default** for single-topic books. Heuristic — swap out any that feel off.
3. **9 authorless books** now have authors:
   - The Kybalion → Three Initiates
   - The Emerald Tablet → Hermes Trismegistus
   - The Guru Gita → anonymous (traditional Sanskrit)
   - A Course in Miracles → Helen Schucman
   - Neville Goddard: The Complete Reader → Neville Goddard
   - Edgar Cayce's Story of the Origin and Destiny of Man → Edgar Cayce
   - Richard Hittleman's Yoga: 28 Day Exercise Plan → Richard Hittleman
   - Noma Guide to Fermentation → René Redzepi & David Zilber
   - The Bittensor Whitepaper → Opentensor Foundation
4. **Alive in Shape and Color** → "Lawrence Block (ed.)" (anthology editor).
5. **9 URL conflicts resolved** — author's own site preferred when available:
   - Braiding Sweetgrass → robinwallkimmerer.com
   - Doughnut Economics → kateraworth.com/doughnut
   - Nonviolent Communication → nonviolentcommunication.com
   - On Dialogue → routledge.com (canonical product page)
   - Play → stuartbrownmd.com (author site)
   - The Design of Everyday Things → nngroup.com (author's org)
   - The Hidden Life of Trees → whataboutrees.com (author site)
   - The Network State → thenetworkstate.com
   - Ways of Seeing → penguin.co.uk (shorter canonical URL)
6. **4 duplicate-id books merged**:
   - "The Kybalion" + "The Kybalion — Three Initiates" → one entry
   - "Drawdown — Paul Hawken (ed.)" + "Drawdown — Paul Hawken" → one entry
   - "The Diamond Cutter — Geshe Michael Roach" + "The Diamond Cutter — Geshe Michael Roach & Lama Christie McNally" → one entry
   - "Power vs Force — David Hawkins" + "Power vs. Force — Dr. David R. Hawkins" → one entry

## The schema

```
{
  id                    — stable identifier, "b-" prefix
  title                 — clean book title (no author in the title string)
  author                — EITHER a "p-" person id (if author is in the people bed)
                          OR a plain string (if author not yet extracted to people bed)
  author_is_person_ref  — boolean. true → author is a linked p-id, false → plain string
  url                   — canonical URL (author's own site preferred)
  bio                   — one canonical description in the FRQNCY voice
  appears_in            — topics/domains where the book shows up
  picked_in             — buckets where it gets the ✦ FRQNCY PICK badge
}
```

No more `bio_overrides`. No more `needs_review` flags. Zero books without an author.

## Author linking status

- **8 authors matched the people bed** — their books link to the p- id
- **260 authors as plain strings** — these are candidates for future people-bed expansion

Top candidates for the next people extraction (authors with multiple books on FRQNCY):

| Author | Books | Worth extracting? |
|---|---|---|
| Dr. David R. Hawkins | 5 | Yes |
| Swami Muktananda | 3 | Probably |
| Rhonda Byrne | 3 | Probably |
| Michael Pollan | 3 | Yes |
| Gurumayi Chidvilasananda | 3 | Probably |
| Sri Swami Satchidananda, Sean Carroll, Peter Drucker, Paul Selig, Paramhansa Yogananda, Napoleon Hill, Michael A. Singer, Lao Tzu, Kevin Trudeau, Geshe Michael Roach, Dale Carnegie, Carlo Rovelli, Carl Sagan | 2 each | Case-by-case |

Flipping `author_is_person_ref` from false to true is a one-line change per author once they're in the people bed. No schema migration needed.

## What's next

- **People** (23 entries) — ✓ done
- **Books** (268 entries) — ✓ done
- **Orgs** (105 entries) — next
- **Media** (77 entries) — after orgs

Then wire up the builder to read from all four beds.
