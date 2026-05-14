# Run Log — Telegram launch queue

**Date:** 2026-05-13
**Task source:** `proposals/VISIBILITY-PLAN.md` Days 1-30: "Telegram channel live with 14 pre-queued posts" + Tue/Thu/Sat cadence
**Deliverable:** `audits/seo/TELEGRAM-LAUNCH-QUEUE.md`
**Agent:** SEO / distribution subagent
**Time spent:** ~45 min

---

## What was done

1. Read context in the order specified: `audits/seo/CONTEXT.md`, `proposals/VISIBILITY-PLAN.md`, `proposals/TELEGRAM-CHANNEL-LAUNCH.md` (still present in the repo, not renamed), `audits/seo/MENTION-MONITORING.md`, `proposals/EDITORIAL-STANDARDS.md`, `proposals/FRQNCY-VOICE-PLAYBOOK.md`.
2. Verified Telegram 2026 platform capabilities via WebSearch:
   - Plain-text post max: 4,096 chars (unchanged).
   - Media-attached caption max: 1,024 chars free / 4,096 Premium.
   - Link previews: server-fetched OG meta; full-width banner if og:image ≥ 1280×640 (FRQNCY's 1200×630 cards render correctly).
   - Username rules: 5-32 chars, Latin/digits/underscore, no leading/trailing underscore → `@frqncy_network` (14 chars) is compliant.
3. Audited source material:
   - Skimmed 10 topic pages for voice/anchor: conscious-capital, meditation, charter-cities, network-states, bitcoin, curation, oneness, decentralised-ai, akashic-records, consciousness, abilities.
   - Verified 8 book pages exist for the queue (the-bitcoin-standard, autobiography-of-a-yogi, unto-this-last, albions-seed, behave, building-a-storybrand, braiding-sweetgrass, the-network-state).
   - Verified people pages (orlando, balaji-srinivasan, shi-heng-yi); confirmed yogananda exists under `/people/paramhansa-yogananda/`; confirmed `/people/john-ruskin/` and `/people/chogyam-trungpa/` do NOT exist (corrected references).
   - Verified shipped artifact pages exist: `/editorial-standards/`, `/mcp/`, `/ask/`, `/explore.html`, `/aligned/`, `/membership/`, `/about.html`, `/start-here.html`, `/podcast.html`, `/space.html`.
   - Read the Phase 5.8 reference essay draft at `audits/seo/runs/2026-05-13-phase-5.8-reference-essay-reading-list-network-states.md` and pulled the network-state-as-bet framing into Post 5.
4. Drafted 14 posts in the type-mix specified in the brief: 5 topic spotlights, 3 resource picks, 2 manifesto lines, 2 shipped-artifact announcements, 2 cross-promos.
5. Sequenced the posts intentionally per the brief: Posts 1-3 set expectations, 4-11 mix spotlights with picks and one artifact, 12-14 drive toward action.
6. Mapped the 14 posts onto a Tue/Thu/Sat 09:00 Berlin schedule starting Day 1 = Tue 2026-05-19, landing post 14 on Day 31 (Thu 2026-06-18).
7. Voice-gated every post against `FRQNCY-VOICE-PLAYBOOK.md` banished list. No banned phrases used. British English throughout.

---

## Decisions / deviations from the playbook

- **Channel name** chosen as `FRQNCY Network` (full network framing) over the playbook's "FRQNCY · The Network" option. Reason: `MENTION-MONITORING.md` calls out five other FRQNCY entities competing for the unqualified term; the network framing is the disambiguator and should appear in the channel name itself.
- **Variant A vs B for the description**: defaulted to Variant A (topic-graph framing) for stronger SEO/discovery, kept Variant B as the fallback. The brief asked for "1-2 sentences in FRQNCY voice"; both options are present-tense, declarative, no banished register.
- **Trungpa quote** (in the playbook's sample queue at Day 13) was dropped because no `/people/chogyam-trungpa/` page exists and no FRQNCY-curated book on spiritual materialism is in the corpus. Replaced with a manifesto line from FRQNCY's own corpus ("Curation is conviction with a paper trail") that does the same work without an unverified attribution.
- **`pl-essencia`** (in the playbook's Day 11) was dropped from the 14-post queue because the brief's type mix already absorbs the post slots; Essência is queued for the Days 31-60 continuation.
- **Pin** is Post 1, not a separate pre-Day-1 message — keeps the channel feeling deliberate rather than performative.
- **Plain-text post** (Post 6) intentionally has no link so Telegram renders no preview; the prose is the post.

---

## Voice-gate checks performed

- Banned phrases (per `~/.frqncy-harness/voice-anchor.md` and the playbook): none.
- Spiritual cliches used as direct self-description: none (the "love and light" register stays off the channel surface, consistent with the home meta description fix).
- Engagement-bait phrasing: none.
- "FRQNCY" never appears unqualified in cold copy — always "FRQNCY Network" or contextualised (per brief).
- Hedging openers, rhetorical questions, "It's not X. It's Y." constructions: none.
- British English: civilisation, organised, centre, behaviour, decentralised — verified.

---

## Open items / handoff

- The channel does not exist yet (per the brief). The queue ships ready-to-paste; Orlando creates the channel and schedules the 14 posts.
- Pinning Post 1 has to be done at ~09:05 Berlin on Day 1 because Telegram cannot pre-pin scheduled messages.
- Days 31-60 continuation queue is not in scope here. The deferred Essência pick + a Charter Cities spotlight + a Braiding Sweetgrass pick + a Behave pick + the first auto-summary "drop" should be the foundation of Post 15 onward.

---

## Files written

- `audits/seo/TELEGRAM-LAUNCH-QUEUE.md` — the queue itself, 14 posts + channel positioning + setup checklist.
- `audits/seo/runs/2026-05-13-telegram-launch-queue.md` — this log.

## Files referenced (not modified)

- `proposals/TELEGRAM-CHANNEL-LAUNCH.md`
- `proposals/VISIBILITY-PLAN.md`
- `proposals/EDITORIAL-STANDARDS.md`
- `proposals/FRQNCY-VOICE-PLAYBOOK.md`
- `audits/seo/CONTEXT.md`
- `audits/seo/MENTION-MONITORING.md`
- `audits/seo/runs/2026-05-13-phase-5.8-reference-essay-reading-list-network-states.md`
- Topic pages: `/conscious-capital/`, `/meditation/`, `/network-states/`, `/bitcoin/`, `/curation/`, `/oneness/`, `/consciousness/`, `/decentralised-ai/`, `/charter-cities/`, `/abilities/`
- Book pages: `/books/the-bitcoin-standard/`, `/books/autobiography-of-a-yogi/`, `/books/unto-this-last/`, `/books/albions-seed/`, `/books/behave/`, `/books/building-a-storybrand/`, `/books/braiding-sweetgrass/`, `/books/the-network-state/`
- People/places: `/people/orlando/`, `/people/balaji-srinivasan/`, `/people/shi-heng-yi/`, `/places/essencia/`
- Artifact pages: `/editorial-standards/`, `/mcp/`, `/ask/`, `/explore.html`, `/membership/`, `/start-here.html`

## Constraints honoured

- No topic page, item page, generator, or active-dev directory modified.
- Nothing published to Telegram.
- No Telegram features fabricated — verified via WebSearch.
- No banned phrase used.
- No engagement-bait language.
- "FRQNCY" never pitched alone — always "FRQNCY Network".
- Every link resolves to a real existing page (verified via filesystem checks).
