# Agent handoff — session log + open queue

**Date written:** 2026-04-25
**Purpose:** Bring a fresh agent fully up to speed on what was done in this session and what is still queued.

---

## 1. Project state snapshot

**What FRQNCY is:** a community becoming an alternative society / network state in formation. Static site at `/Users/orli/Documents/Claude/Projects/FRQNCY WEBSITE`, deploys to Cloudflare Pages from `github.com/0rli-E/FRQNCY-Website`.

**Founders:** Orlando (Founder), Norman Gräter (Co-Founder).

**World model architecture (the most important thing to understand):**

The site is bed-driven. The eight beds are the source of truth. `generate.js` reads them and emits derived artifacts plus all the generated pages. Topic pages, profile pages, search.json, sitemap.xml, entities.json, resources.json — all regenerated from the beds + `content.json` (the spine).

```
Beds (edit these)              →  Generated artifacts                    →  Public pages
├─ people.json (89)               ├─ entities.json (620)                    ├─ /<topic>/  (159)
├─ books.json (284)               ├─ resources.json (766)                   ├─ /people/<slug>/  (89)
├─ orgs.json (102)                ├─ search.json (146 topics)               ├─ /books/<slug>/  (284)
├─ media.json (74)                └─ sitemap.xml (742 URLs)                 ├─ /orgs/, /media/, /music/, /places/
├─ music.json (8) — NEW in 2026-04-25                                       ├─ /aligned/  (curated picks page)
├─ places.json (1)                                                          └─ /courses/<slug>/
├─ aligned-goods.json (56) — overlay                                          plus /search, /my-frqncy, /chart, /about, /platform, /podcast, /space
└─ courses.json (6)
```

`content.json` carries the spine: 6 pillars (Sanctuary / Fund / Research / Education / Media / Builder) → 15 domains → 146 topics. Every entity in any bed declares `appears_in: [...]` (topic / domain / pillar ids) and optional `picked_in: [...]` for FRQNCY picks. That's how everything connects.

**Editorial values (non-negotiable):**

- Cooperation over competition — no leaderboards, no ranking of people.
- Every teaching lives on the site. External links are footnotes, not destinations.
- No spiritual cliches. Frame practices as experiments, not prescriptions.
- "FRQNCY makes the unable able" was rejected as a slogan — positions readers as incomplete; replaced with "A network of people, building their dream life. We invite you to find yourself."

**Voice playbook canonical:** `proposals/FRQNCY-VOICE-PLAYBOOK.md`. Read before writing any user-facing copy.

---

## 2. Session work log (2026-04-25)

Listed in execution order. Every change is committed and pushed unless flagged.

### Architecture / world-model fixes

- **Fixed `resourcesFor()` in `generate.js`** so beds are truly authoritative. Previously, only entries that had a matching row in `content.json` would render on topic pages — bed-only additions were invisible. Now the function appends any bed entry whose `appears_in` includes the topic id but isn't already covered by content.json. Self-healing.
- **Fixed dedup key collision.** The seen-set was keyed on `type|url`. Two Hill books shared `naphill.org` as their external URL → second always dropped silently. Switched to `type|id` (unique by construction) plus a `pickUnseen()` helper so colliding rows pair off in order.
- **Fixed map crash on label-less topics.** `syncExploreData()` was insert-only; topics added with the wrong field name (`title` instead of `label`) ended up as nameless dots in `v2/explore-data.json`, which crashed the canvas. Replaced the insert logic with `upsertNode()` that backfills missing labels on existing nodes.
- **Renormalised topics that used `title` instead of `label`** in content.json — 6 topics fixed. The convention is `label`.
- **Audit pass with 10 agents** ran and triaged. Findings + fixes captured in `outputs/audit-findings.md`. Real bugs caught and fixed: 9 (courses domain, nav logo href, sitemap clean URLs, /aligned in about dropdown, p-jerry-hicks orphan, my-frqncy null guards, chart.js listener guards, search.html silent-fetch-failure, sw.js precache list).

### New beds + content

- **Music bed (`music.json`) — new.** Schema mirrors books with `artist_is_person_ref`. Seed: 8 entries — 432 Hz, 528 Hz Solfeggio, Snatam Kaur, Deva Premal, Hildegard von Bingen, Arvo Pärt, Bach Goldberg Variations, Pink Floyd Dark Side. Wired through `entitiesIndex`, `resourcesIndex`, sitemap, voice linter, related-topics, plus `/music/` hub + 8 profile pages. ID prefix `mu-` (not `m-`, which is media).
- **6 new topics added to content.json** — water (d-lifestyle), taoism (d-meta), christianity (d-meta), mythology (d-meta), cards (d-money), body-care (d-lifestyle), coffee-tea (d-lifestyle), cookware (d-lifestyle), privacy (d-tech), supplements (d-wellbeing), tools-carry (d-lifestyle), audio (d-arts). 12 in total when counting the second wave.
- **13 Neville Goddard books added** to books.json (1939 At Your Command → 1977 Immortal Man), all author-linked to `p-neville-goddard`. Power of Awareness picked on manifestation.
- **Napoleon Hill: The Master Key to Riches** (1945).
- **The Bible + The Book of Enoch** added so aligned-goods links resolve. The Bible URL is biblegateway.com (free reading), Book of Enoch is sacred-texts.com (R.H. Charles 1917 translation, free).
- **The Art of Money Getting** enriched (year 1880, fuller summary, added to personal-development) and rewired to `p-pt-barnum`.
- **P.T. Barnum** added as a person (NEW). 3-paragraph life_story (Bethel 1810, American Museum, Tom Thumb + Jenny Lind, late-life politics + the Money Getting lecture). Picked on prosperity-mindset.
- **Neville Goddard life_story** added (Barbados origin, Abdullah's tutelage 1931–1936, 33 years of free lectures, Law-to-Promise shift). 3 paragraphs.
- Total profiles with life stories: 33 of 89.

### Aligned Goods major restructure

Was: a flat list of mixed types with category-filter chips and a tier filter.

Now: 12-shelf editorial store with restraint pass.

- **12 categories with 56 picks total:**
  - Water (1) — Water vs Eva Water
  - Food (3) — White Oak Pastures, Frantoio Franci, Manuka Health
  - Body care (4) — Dr. Bronner's, Bite, Native, Boie
  - Supplements (5) — Pure Encapsulations, Nordic Naturals, Thorne, Sun Potion, Four Sigmatic
  - Sleep (5) — Oura, Avocado, Coyuchi, Manta Sleep, Hostage Tape
  - Movement (5) — Manduka PRO, Halfmoon cushion, Theragun, sandalwood mala, Himalayan singing bowl
  - Cookware (5) — Le Creuset, Lodge, Misono UX10, Smithey, Boos Block
  - Coffee & tea (5) — AeroPress, Niche Zero, Fellow Stagg, Heart Roasters, Rishi
  - Audio (5) — AirPods Pro 2, Sennheiser HD 660S2, KEF LSX II, Loop, Hatch Restore
  - Tools & carry (5) — Leuchtturm 1917, Lamy 2000, Leatherman Wave+, Patagonia Black Hole, Klean Kanteen
  - Cards (8) — Amex Platinum, Crypto.com Visa, Mercury, Apple Card, Wise, Revolut, Schwab, Bilt
  - Privacy (5) — 1Password, Mullvad, Proton Mail, Ledger, Brave
- **Sacred texts moved out** — Tao Te Ching, Bible, Book of Enoch are books, not aligned goods. Anthropic Claude moved to courses (new course `c-working-with-claude`).
- **Editor's Choice pattern** — one entry per shelf marked `tier: 'pick'` with the ★ Editor's Choice badge and gold-tinted card. The other 44 entries are `tier: 'aligned'` (held to the same bar but not the canonical recommendation). This restored the meaning of the FRQNCY Pick badge — it had become wallpaper.
- **Page redesigned as shelves.** Sticky horizontal shelf nav at the top, scroll-jumps to each shelf, auto-highlights the shelf in view via IntersectionObserver. Each shelf has numbered eyebrow (`01 · 12`), Cormorant serif title, dim sans tagline, Editor's Choice line, items grid, and a "Last reviewed by FRQNCY · April 2026" footer.
- **Criteria block** — added an editorial section that names the five questions every entry is held against (Used / Clean / Independent / Verifiable / Durable). Replaced the per-card criteria badges, which were spec-sheet visual language.
- **Scroll-bouncing bug fixed** — the IntersectionObserver was calling `link.scrollIntoView()` on a sticky-positioned nav link, which fought page scroll. Replaced with manual horizontal `nav.scrollTo()`.
- **Anti-patterns removed:** stacked badges, criteria spec-sheet on every card, tier filter, per-card category label (redundant inside its own shelf).

The research that informed this is captured in the agent return inline above and in commit `Aligned Goods: editorial restraint pass` — drawn from Wirecutter, Cool Tools, Hodinkee, A24, Mr Porter, Aesop. Two principles: "one badge is curation, three is a sale rack" and "editorial commerce treats the reader as a guest in a curated room rather than a target in a funnel."

### My-FRQNCY personalisation

- Added 4-stage path selector (Curious / Practicing / Integrating / Embodying), HD Type selector, modality multi-select (Science / Mystical / Channeled / Embodied).
- Reads `localStorage['frqncy:chart']` (saved by `/chart` when a chart is generated) and pre-fills the signature.
- Ranks teachers using `HD_AFFINITY` map + modality-domain match.
- Renders a "Tuned to your signature" badge on the result hero.
- All `getElementById` calls now null-guarded.

### Chart.html

- Added `validateFields()` covering future date, pre-1900 year, missing time, missing timezone, lat/lng range, lat/lng paired-or-neither.
- Added `saveChartSignature()` — persists HD type, authority, profile, and Gene Keys primes to `localStorage['frqncy:chart']` so /my-frqncy can read it.
- Form input listeners now null-guarded.

### SEO / Nav / a11y / housekeeping

- All 9 top-level pages: nav logo `href` was `index.html` → now `/`.
- About.html Discover dropdown: missing `/aligned/` link → added.
- Sitemap: top-level URLs were `.html` → now clean (`/about`, `/podcast`, etc., matching the canonical link tags). Added `/chart`, `/my-frqncy`, `/aligned/` that were missing.
- `_redirects`: 301s from `.html` legacy URLs.
- `sw.js`: bumped to v23. Precache list now includes entity hub indexes (`/people/`, `/books/`, `/orgs/`, `/media/`, `/music/`, `/places/`, `/aligned/`), `start-here.html`, plus the search index JSON files.
- Footer unification: every page reads `© 2026 FRQNCY · All frequencies reserved`.
- Generated FOOTER: switched from broken relative paths to the minimal wordmark+copyright pattern.
- Removed TBA membership tier placeholders from `/space/`.
- `p-jerry-hicks` orphan: empty `appears_in` → added `t-manifestation`.

### Strategic docs

- **`proposals/REVENUE-MODEL.md`** — five revenue surfaces (Aligned Goods, Courses, Referrals, Sanctuary / FRQNCY Spaces worldwide, Fund). Editorial standards as precondition. Suggested execution order. Nothing wired yet — design lives there for when ready.

---

## 3. Open queue (NOT YET DONE — next agent: pick these up)

The user asked for these in the most recent messages of the conversation. They are captured here verbatim where useful and have NOT been implemented.

### A. Word Illuminator optimisations

The Word Illuminator is a FRQNCY feature/skill at `prompts/word-illuminator.md` (and template `proposals/WORD-ILLUMINATOR-V2.md`). User asks:

1. **Use these authoritative sources** as the synthesis basis for each illumination:
   - **Authoritative dictionaries** — Oxford English Dictionary, Merriam-Webster, Cambridge, Collins.
   - **Etymology** — Etymonline, A Comprehensive Etymological Dictionary of the English Language, The Oxford Dictionary of English Etymology.
   - **Classical foundations** — Latin and Greek lexicons (e.g., Lewis and Short Latin Dictionary), Proto-Indo-European root studies.
   - **Usage & style** — The Elements of Style, Garner's Modern English Usage.
   - **Philosophical / interpretive layer (optional)** — Aristotle, Wittgenstein, general humanistic writing on meaning and language.
   - The output should *resemble what you'd get if you synthesised these traditions together into one structured explanation*. Not pulled live; written from this synthesis posture.
2. **Output orientation:** when prompting the Word Illuminator, the user wants to read from the top — no scrolling down to find the answer. Whatever the renderer is, the illumination must arrive head-up at first paint.
3. **Quality cross-reference example.** User compared FRQNCY Word Illuminator output for the word **discipline** against ChatGPT's output and prefers ChatGPT's. The reference output (to match or beat in style):

```
Word Illumination: Discipline

1. Definitions
Primary Meanings:
   1. Training to act in accordance with rules; self-control
      * Example: Through daily meditation, she cultivated discipline over her thoughts.
   2. A system of rules governing behavior or activity
      * Example: Military discipline demands obedience and precision.
   3. Punishment intended to correct or train
      * Example: The teacher used discipline not to shame, but to guide improvement.
   4. A branch of knowledge or field of study
      * Example: Philosophy is a discipline that explores existence and truth.

2. Etymology
   * From Latin disciplina — meaning instruction, knowledge, training
   * Derived from discipulus — student, learner
   * Root verb: discere — to learn
Evolution: Originally, discipline did not carry the rigid or punitive tone it often has today. It was rooted in the sacred relationship between teacher and student—an act of learning, of willingly submitting oneself to growth.
Earliest Essence: Not control—but devotion to learning.

3. Synonyms & Antonyms
Synonyms: Self-control · Order · Regulation · Training · Restraint · Mastery
Antonyms: Chaos · Indulgence · Negligence · Disorder · Impulsiveness

4. Derivatives (Word Family Expansion)
a. Disciplined (adjective): Showing self-control; trained to follow rules or a regimen
   - Example: He is a disciplined athlete, never missing a morning workout.
b. Discipline (verb): To train or develop by instruction and practice; to correct behavior
   - Example: She disciplined herself to write every day, regardless of mood.
c. Disciplinarian (noun): A person who enforces rules or advocates strict discipline
   - Example: The coach was a strict disciplinarian, but deeply respected.
d. Disciplinary (adjective): Relating to discipline or enforcement of rules
   - Example: The company took disciplinary action after repeated violations.

5. Deeper Illumination
To embrace discipline is not to cage oneself—but to choose a path repeatedly, even when the mind resists. It is the bridge between intention and embodiment.
At its highest form, discipline is not force—it is alignment.
A question to reflect on: Is your discipline driven by fear… or by devotion to who you are becoming?
```

**Take-aways for the Word Illuminator template:** five-section structure (Definitions / Etymology / Synonyms+Antonyms / Derivatives word-family / Deeper Illumination), every meaning gets a sentence example, etymology traces the root and notes the evolution from original essence, derivatives with their own examples + sister-synonyms, deeper illumination ends in a question to reflect on. The voice is patient, instructive, sacred-but-grounded.

### B. Crypto + Money expansion

User wants the Money and Crypto domains to grow.

1. **Crypto slogan additions:** "Crypto is freedom technology." Plus the values of bitcoin / good of crypto: borderlessness, immutability, censorship-resistance, self-custody, programmable money, sovereignty, transparency, neutrality, etc. List them all on the topic page or as a new sub-topic.
2. **Money attributes (Mike Maloney framework):** add "the attributes of money" as defined by Mike Maloney: portability, durability, divisibility, fungibility, scarcity, recognisability, store of value. Plus the **money vs currency** distinction (currency = medium of exchange; money also stores value). Add to Money domain copy.
3. **Mike Maloney's "Hidden Secrets of Money" series** — add to FRQNCY Watch (the video hub at `/v2/watch/` driven by `videos.json` + `playlists.json`). It's a 10-episode YouTube series. Each episode could be a video entry; the series itself could be a playlist.
4. **"All good things about crypto, leading to good projects and people."** Curate the values, then surface the projects and people that embody them. Build a section on the crypto topic page or a dedicated `/crypto/values/` sub-page. Connect to the existing `t-cryptocurrency` and `p-vitalik-buterin`, `p-andreas-antonopoulos`, `p-david-hoffman`, `p-satoshi-nakamoto`.
5. **Ethos integration** — set up a call with Ethos's founders and with Obi (likely Obi from a crypto org). User wants Ethos integrated into FRQNCY in some form. Needs scoping with the user — what does "integrate" mean? Cross-promotion? Shared standards? Embedded badges?

### C. Roadmap addition

Add to FRQNCY's roadmap (lives in `proposals/EXECUTION-PLAN-90D.md` or could go in a new sub-doc): **at some point we want to run on DeAI** — decentralised AI. Specifically:
- **Chutes** (DeAI inference provider, used by frqncy-harness)
- **Templar's Covenant** (the user said "templars covenant" — likely Templar / Covenant, a DeAI training network)

This is aspirational / down-the-road, not immediate. Belongs as a future-state line on the roadmap.

### D. Kevin Trudeau bibliography

User wants all of Kevin Trudeau's books added to `books.json`, including:
- **YWIYC** — *Your Wish Is Your Command* (audio course, 14 CDs)
- **Gurukev's Book of Secrets** — Trudeau's later esoteric work
- Plus the rest of his canon: *Natural Cures "They" Don't Want You to Know About*, *More Natural Cures Revealed*, *Debt Cures*, *Free Money "They" Don't Want You to Know About*, *The Weight Loss Cure*, *Mega Memory*, etc.

Trudeau is a controversial figure (legal history with FTC) — voice should be honest about that. Don't sanitise; don't dismiss. The teaching has its own life independent of the teacher's biography. He is already in the world model context (`videos.json` has a `t-trudeau` topic bucket from earlier work).

If Trudeau isn't yet in `people.json`, add him as `p-kevin-trudeau` with a 3-paragraph life story that's honest about the FTC ruling, the prison time, AND the fact that the YWIYC course landed for millions of people. Then attach the books.

---

## 4. Architectural invariants (don't break these)

- Beds are authoritative. Edit a bed → run `node generate.js` → everything regenerates. Don't hand-edit `entities.json`, `resources.json`, `search.json`, or `sitemap.xml`.
- IDs use prefix-by-type: `p-` person, `b-` book, `o-` org, `m-` media, `mu-` music, `pl-` places, `c-` courses, `t-` topics, `d-` domains.
- Topics use the field name `label`, not `title`. Six topics had `title` and got renormalised this session — `syncExploreData` now self-heals if a future topic slips through with the wrong field.
- Aligned-goods entries use **slugs** in `topicSlugs`, not topic IDs. Strip any `t-` prefix that sneaks in.
- The dedup key in `resourcesFor()` is `type|id` (unique), never `type|url` (collision-prone).
- Cross-hub nav: `People · Books · Orgs · Media · Music · Places · Search` — present on all 600+ generated entity pages via `nav()` in generate.js.
- Voice linter: bios scanned for banished words on every build. Currently clean.
- CI workflow (`.github/workflows/build.yml`): triggers on every bed file. After this session, includes `music.json`, `aligned-goods.json`, `courses.json`.
- Service worker `sw.js`: bump version when adding new precached routes.

---

## 5. How to run things

```bash
# Regenerate everything from beds
node generate.js

# Regenerate just the courses pages
node generate-courses.js

# Regenerate the Watch hub (videos + playlists)
node generate-watch.js

# Build the AI knowledge base (Cloudflare worker reads this)
node build-kb.js

# Build OG images
node build-og.js

# Check dead external links
npm run check:links
```

Standard end-of-work loop: edit → `node generate.js` → review the diff → commit + push. CI rebuilds and commits any regen-only deltas with `[skip ci]` to avoid loops.

---

## 6. Memory + handoff conventions

- Project memories live at `~/Library/Application Support/Claude/.../memory/` and are loaded into every conversation. Index is `MEMORY.md`. Each memory is a separate `.md` with frontmatter (`name`, `description`, `type`).
- Plan / strategy docs live in `proposals/`. Status snapshots in `proposals/WORLD-MODEL-STATUS.md` and similar.
- This document itself is `proposals/AGENT-HANDOFF-2026-04-25.md` — feel free to write a fresher one and reference it here when picking up substantial new work.

---

*End of handoff.*
