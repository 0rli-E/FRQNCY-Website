# Parallel agent run — Phase 5 expansion — 2026-05-13

Three general-purpose agents spawned in parallel; each scoped to one Phase 5 gap that wouldn't touch the regenerated topic/item pages or any in-flight work.

## Agent 1 — Phase 5.8 reference-content moat (essay #1 of 5/year)

Picked topic: **"The reading list for network states"** — chosen for (a) FRQNCY's dense pre-built anchor library on the network-state pillar, (b) no canonical public synthesis exists for this reading list, (c) FRQNCY can credibly write the canonical version because Lugano is a real first node and the editorial standards predate the essay.

Deliverables on disk:
- `audits/seo/runs/2026-05-13-phase-5.8-reference-essay-reading-list-network-states.md` — **2,850 words** (in the 2,500-3,500 target), 34 internal links (26 unique, all verified against the file tree), 6 external primary-source URLs, 6 `[verify]` markers on uncertain 2026 facts
- `audits/seo/runs/2026-05-13-phase-5.8-publication-brief.md` — 937-word brief covering route (`/essays/<slug>/`), schema (Article + Person author), OG card design, cross-linking strategy (via the generator, not direct injection per the MEMORY directive), and Q3-Q1 cadence sequence

The essay is a draft for Orlando to review before publishing. The publication brief tells you exactly how to ship it.

## Agent 2 — Phase 5.3 sameAs matrix + handle decision

Audited FRQNCY's footprint across **20 platforms** (X brand + founder, LinkedIn × 2, Crunchbase, AngelList, GitHub × 2, YouTube, Spotify, Apple Podcasts, Substack, Mastodon, Bluesky, Threads, Facebook, Instagram, Telegram, Wikidata, Wikipedia).

**Coverage today: ~10-20%** (2-4 of 20 verified live). Phase 5.3 target is 80% — the gap is the next 30-90 days of work, aligned with Orlando's visibility plan.

Deliverables on disk:
- `audits/seo/SAMEAS-MATRIX.md` — canonical matrix doc, per-platform setup briefs, FRQNCY-voice bio copy at 160 / 220 / 500 / 1000 char, drop-in `sameAs` JSON arrays (conservative + full v2)
- `audits/seo/runs/2026-05-13-phase-5.3-handle-decision.md` — Twitter handle decision brief with sed commands for both paths
- `audits/seo/runs/2026-05-13-phase-5.3-sameas-matrix.md` — run log

**Three new findings worth surfacing immediately:**

1. **Brand collision landscape expanded from 5 to 10+ entities.** Discovered `@FRQNCY_live`, `@FRQNCYSA`, `@FRQNCY_shop`, `@frqncyofficial`, plus a YouTube "FRQNCY - Topic" auto-channel. The bare term "FRQNCY" is severely contested. Every recommended handle now uses the `frqncy_network` or `frqncy.network` qualifier.

2. **Spotify and Apple Podcasts FRQNCY entries are owned by FMG** (Jody Colvard's "FRQNCY" podcast). Publishing The FRQNCY Podcast under just "FRQNCY" will trigger search-result fusion. Recommendation: publish as **"The FRQNCY Network Podcast"**.

3. **`/people/orlando/` Person schema is malformed.** Its `sameAs` array contains only the canonical self-URL, which structurally belongs in `url`, not `sameAs`. Fix is in both handle-decision sed blocks. Will get reapplied on regen if the generator is the source of this file too — handle-decision doc explains.

**Recommendation: register `@frqncy_network` as the canonical brand handle (Path A).** Keep `@0xOrli` as founder handle. Institutional/personal separation is structurally correct and matches the homepage Organization + Orlando Person schema duality.

## Agent 3 — Phase 5.5 partner backlink program

Identified **61 partner candidates** across 6 categories (sanctuaries, conscious-capital funds, schools, networks, publications, AI-citation partners).

Deliverables on disk:
- `audits/seo/PARTNER-PROSPECTS.md` — full list with name, URL, why-aligned, FRQNCY-offers, they-offer, contact, status per entry
- `audits/seo/PARTNER-OUTREACH-TEMPLATES.md` — 5 outreach templates (one per category), 200-350 words each, FRQNCY-voice anchored, no SEO-spam phrasing
- `audits/seo/PARTNER-TRACKER.md` — pre-filled tracker mirroring the prospect list, all rows initialised to `not-yet-contacted`
- `audits/seo/runs/2026-05-13-phase-5.5-partner-backlinks.md` — run log

**Notable:**

- **18 prospects are Tier-1** (FRQNCY already covers them in `/places/` or `/orgs/`) — these are the easiest pitches because the relationship is already implicit. Sanctuaries: Esalen, Findhorn, Plum Village, Schumacher College, Tassajara, Monroe, Auroville, Intaaya, Yogaville, Merlin's, Essencia. Orgs: GIIN, Open Philanthropy, B Lab, Conscious Capitalism, Edgeryders, Collective Intelligence Project, Future of Life Institute, Santa Fe Institute.
- **11 `[verify]` flags** on candidates whose 2026 operating status the agent couldn't confirm without further research.
- **Top 5 outreach priorities (in order):** Plum Village, Schumacher College, Esalen, Long Now Foundation, The Stoa (Peter Limberg). Sixth pick: Tom Morgan — What's Important?

## Cross-agent observations

1. **Brand collision is materially worse than the Phase 5.10 baseline reported.** Was 5 entities; is 10+. Every outreach surface (podcast pitches, partner outreach, sameAs setup) needs to lead with "FRQNCY Network" or risk audience-mismatch rejection.

2. **The Person schema fix on /people/orlando/** is now confirmed via independent audit (Agent 2 surfaced it from a different angle than the Phase 5.10 baseline scan). Action item flagged for the next Orlando-side patching session.

3. **The Twitter handle decision is the gating item for sameAs work.** Agent 2's recommendation (register @frqncy_network) aligns with Orlando's visibility plan Day 1-30 task. Until the handle is locked, the homepage Organization schema has a soft inaccuracy.

4. **All three agents respected the constraints.** No edits to topic pages, item pages, generator scripts, or active-dev zones. All deliverables in `audits/seo/runs/` or the stable `audits/seo/` doc surface. Zero conflict with the in-flight book additions, app work, or worktree activity.

## Total files written this session

8 new files in `audits/seo/` and `audits/seo/runs/`:

```
audits/seo/SAMEAS-MATRIX.md
audits/seo/PARTNER-PROSPECTS.md
audits/seo/PARTNER-OUTREACH-TEMPLATES.md
audits/seo/PARTNER-TRACKER.md
audits/seo/runs/2026-05-13-phase-5.8-reference-essay-reading-list-network-states.md
audits/seo/runs/2026-05-13-phase-5.8-publication-brief.md
audits/seo/runs/2026-05-13-phase-5.3-handle-decision.md
audits/seo/runs/2026-05-13-phase-5.3-sameas-matrix.md
audits/seo/runs/2026-05-13-phase-5.5-partner-backlinks.md
audits/seo/runs/2026-05-13-PARALLEL-AGENT-RUN-SUMMARY.md (this file)
```

Plus the Phase 5.1 dossier + CITATION-TRACKER from earlier today, total = **12 files written in the 2026-05-13 session**, all additive, all in stable zones.

## Next priorities

1. **Orlando-side: decide on the Twitter handle.** Open the handle-decision brief, pick a path, run the sed command. ~10 min.
2. **Orlando-side: send the first 5 partner outreach pitches** from the top-5 list. Customize each with a specific shared reference. ~1 hour.
3. **Orlando-side: review the reference essay draft** and decide on the `/essays/` route. ~30 min to read, then publication is a separate task.
4. **Next agent session: ship the remaining Phase 5 docs** — press list (Phase 5.6), HARO/Qwoted pipeline (Phase 5.7), newsletter exchanges (Phase 5.9). All documentation work, none touches generators.
