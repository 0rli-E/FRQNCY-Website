# Content Roadmap + Ideation

*The pipeline for what gets added to the network and why.*

*Updated: 2026-05-12. Status: working draft.*

---

## How content gets added to FRQNCY

Three lanes:

1. **Beds** (`people.json`, `books.json`, `orgs.json`, `places.json`, `music.json`, `media.json`) — first-class entities. Each gets a profile page, shows up in search, and is wired to one or more topics via `appears_in`.
2. **Topics** (`content.json` → `topics`) — the editorial substrate. New topics are added sparingly; each one has to earn it by being a real thing people would search for and by being supported by at least one entity at launch.
3. **Watch / Audio / Music libraries** — media references hanging off existing topics. Lower bar; more about *coverage* than *curation*.

The bar drops as you move from beds to media libraries. A bed entry says "FRQNCY thinks this person/book/org matters enough to have its own page on the network". A media reference says "FRQNCY thinks this video is worth pointing at from the topic page."

---

## Active content streams

### Stream 1 — Teachers cluster

Adding the people who actually shape consciousness work at scale. Done in batches:

| Status | Wave | What |
|---|---|---|
| ✅ | Wave 1 | Tolle, Shi Heng Yi (20 videos each, c-teachers) |
| ✅ | Wave 2 | Sedona/TFT/EFT cluster — Levenson, Callahan, Craig + orgs |
| ✅ | Wave 3 | Patton, Rohn, Brown, Dyson, Jones, De Stefano, Spivey |
| 🟡 | Wave 4 | Masonbook YouTube guy (task #91 — need handle) |
| 🟡 | Wave 5 | Time-travel video (task #42 — need URL) |
| ⚪ | Wave 6 | Dispenza spotlight + *Frequency* movie (task #54) |

### Stream 2 — Topic expansion

New topics get added when:
- A cluster of entities want a home that doesn't exist yet
- A user-facing search term comes up repeatedly without a landing page
- A pillar/domain has a noticeable gap

| Status | Topic | Why |
|---|---|---|
| ✅ | Intuitive Abilities (`t-abilities`) | Middleway needed a home; ties to remote-viewing |
| ✅ | Network States (`t-networkstates`) | Infinita + the new-cities cluster |
| ✅ | Charter Cities (`t-charter-cities`) | Próspera, ZEDEs, sibling to network states |
| ✅ | Tax & Sovereignty (`t-tax-sov`) | Paraguay, Portugal, UAE, Estonia |
| ✅ | Homeschooling (`t-homeschooling`) | Microschools, pods, parents already searching |
| ✅ | AI Agent Law (`t-ai-agent-law`) | Fast-moving regulatory frontier |
| ✅ | Network Schools (`t-netschools`) | NS, Synthesis, Sora, Acton, Alpha, Praxis cluster |
| ✅ | Etiquette (`t-etiquette`) | Emily Post + the manners-as-craft framing |

Next candidates (require user signoff before adding):
- **Sovereign Individuals** — Davidson-Mogg lineage as its own topic vs. folded into `t-tax-sov`
- **Modular Living** — vans, ADUs, off-grid, fits under `d-places` or `d-lifestyle`
- **Plant Medicine** — distinct topic vs. under `t-medicines`
- **Frequency Music** — Solfeggio, binaural, healing tones (sub-topic of `t-soundheal`?)
- **AGI Safety** — fits in `d-tech`, large enough to be its own thing
- **Longevity Practice** — sibling of `t-bio`?

### Stream 3 — Media libraries

Watch and audio coverage of existing topics. Lower bar.

| Status | Effort | What |
|---|---|---|
| ✅ | HSOM Ep 1–10 | Mike Maloney money documentary on `t-gold`, `t-silver` |
| ✅ | Tolle 20 videos | Under c-teachers |
| ✅ | Shi Heng Yi 20 videos | Under c-teachers |
| 🟡 | Time-travel video (#42) | Awaiting URL |
| 🟡 | Auto-ingest from tracked channels (#53) | Infrastructure project |

### Stream 4 — Places

Slower bar — places have to be real, visit-able, and aligned. Not every retreat or property qualifies.

| Status | Place | Where |
|---|---|---|
| ✅ | Essência (Aljezur, Portugal) | sustainable living retreat |
| 🟡 | Merlin's (location pending) | restaurant on the radar |
| ⚪ | Próspera campus | could be a place entry, not just an org |
| ⚪ | Network School Forest City | campus as a place |

### Stream 5 — Books per pillar

Currently: 6 books per *domain* (task #4 ✅). Open: 6 books per *pillar* (task #65).

The pillar treatment is more curated — at the pillar level, the books carry more weight than at the domain level. Need to pick the *6 books a person should read to understand this pillar*.

Draft picks (will refine):
- **Curate** — Emily Post *Etiquette*, Robert Caro *The Power Broker*, John Ruskin *Unto This Last*, Walter Benjamin *Art in the Age of Mechanical Reproduction* (essay), Jorge Luis Borges *Library of Babel*, Susan Sontag *On Photography*.
- **Education** — John Holt *How Children Learn*, Maria Montessori *The Absorbent Mind*, John Taylor Gatto *Dumbing Us Down*, Ivan Illich *Deschooling Society*, Peter Gray *Free to Learn*, James Bach *Secrets of a Buccaneer-Scholar*.
- **Research** — Robert Sapolsky *Behave*, Carlo Rovelli *Reality Is Not What It Seems*, Iain McGilchrist *The Master and His Emissary*, Donella Meadows *Thinking in Systems*, Karl Popper *The Logic of Scientific Discovery*, Vilayanur Ramachandran *The Tell-Tale Brain*.
- **Media** — Marshall McLuhan *Understanding Media*, Neil Postman *Amusing Ourselves to Death*, Marie Winn *The Plug-In Drug*, Nicholas Carr *The Shallows*, Hito Steyerl *Duty Free Art*, Lawrence Lessig *Free Culture*.
- **Sell** — Robert Cialdini *Influence*, Claude Hopkins *Scientific Advertising*, David Ogilvy *Confessions of an Advertising Man*, Bryan Caplan *The Case Against Education* (anti-credentialism), Seth Godin *This Is Marketing*, Donald Miller *Building a StoryBrand*.
- **Fund** — Howard Marks *The Most Important Thing*, Peter Thiel *Zero to One*, Saifedean Ammous *The Bitcoin Standard*, Charles Mackay *Extraordinary Popular Delusions*, Benjamin Graham *The Intelligent Investor*, Mariana Mazzucato *The Value of Everything*.
- **Build** — Stewart Brand *How Buildings Learn*, Christopher Alexander *A Pattern Language*, Donella Meadows *Thinking in Systems*, Frederick Brooks *The Mythical Man-Month*, Edward Tufte *The Visual Display of Quantitative Information*, Buckminster Fuller *Operating Manual for Spaceship Earth*.
- **Network State** — Balaji Srinivasan *The Network State*, Albert Hirschman *Exit, Voice, and Loyalty*, James Davidson + Lord Rees-Mogg *The Sovereign Individual*, Elinor Ostrom *Governing the Commons*, Yuval Levin *The Fractured Republic*, Patri Friedman writings (essays).

### Stream 6 — Quotes and intros

Each book gets a quote and intro (already in schema). Not all 285 books have both. Audit needed:

```bash
python3 -c "
import json
b = json.load(open('books.json'))['books']
missing_q = [x for x in b if not x.get('quote',{}).get('text')]
missing_i = [x for x in b if not x.get('intro')]
print(f'missing quote: {len(missing_q)} / {len(b)}')
print(f'missing intro: {len(missing_i)} / {len(b)}')
"
```

Open as a backlog stream — fill in for FRQNCY-pick books first, then by appearance frequency.

---

## Ideation queue (not yet committed)

Things mentioned but not committed to a stream:

- **Spiritual technology vs. spiritual materialism** essay (#29) — turn into a flagship piece, then back-reference from related topics
- **Time-travel video** (#42) — could be the kernel of a *Frontier Physics* topic if it's the right video
- **Joe Dispenza Frequency movie** (#54) — a media-bed entry + a Sell-pillar donation flow
- **Studies bed** (#23) — first-class research entities (peer-reviewed studies, working papers) hanging off topics. Schema TBD
- **Concerts hub** (#73) — third leg of music — calendar of aligned shows + festivals

---

## Editorial standards (excerpt)

The full standards live in `proposals/EDITORIAL-STANDARDS.md`. The fast version:

- **No filler**. Every line of a bio has to earn its place.
- **No hedging language**. Not "many believe that...", "some say...", "it is thought that...". State it, attribute it, or leave it out.
- **No mainstream-borrowed jargon**. No "do the work," "manifest," "high vibe," "level up."
- **Two registers held**: physics-precise and sacred-direct. Never alternated, never apologised for.
- **Voice tested against the playbook before publish** (see `FRQNCY-VOICE-PLAYBOOK.md`).

---

## Cadence

Content gets shipped in batches. The rough rhythm:

- **Daily** (when in flight): 1–3 new entities or 1 new topic.
- **Weekly**: 1 batch commit covering 5–10 entities or 1 topic + supporting entities.
- **Monthly**: review of the ideation queue → commit 1–2 streams into active.

This document gets updated whenever a stream changes status or a new candidate enters the queue.

---

## Cross-references

- `proposals/MASTER-ROADMAP.md` — all tasks
- `proposals/EDITORIAL-STANDARDS.md` — the bar content has to clear
- `proposals/FRQNCY-VOICE-PLAYBOOK.md` — voice enforcement
- `proposals/FRQNCY-MANIFESTO.md` — the editorial position
- `proposals/CONTENT-DEPTH-AUDIT.md` — running quality audit of bed entries
