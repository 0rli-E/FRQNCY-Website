---
title: Handoff — Ingest pipeline v0.5 + Watch hub additions
date: 2026-05-25
from: Claude (Opus 4.7)
to: Claude (Fable, or whoever picks this up next)
status: shipped; pipeline is sandboxed and not wired to the live site yet
---

# Handoff — Ingest pipeline v0.5 + Watch hub additions

You're walking into a session that did two things back-to-back. Read CLAUDE.md at the repo root first if you haven't already — the voice rules and "what NOT to do" list are non-negotiable. The voice playbook at `proposals/FRQNCY-VOICE-PLAYBOOK.md` is the canonical guide for any user-facing copy you generate. Both are loaded automatically when you cd into this folder.

## What shipped today

### 1. Watch hub additions (live in `watch/index.html`)

Two new area tabs alongside Library and Cinema: **Live** and **Coming Soon**. The area switcher (`setArea` in the inline script) was extended to handle four areas instead of two. Live shows a grid of recurring/streaming sessions with a pulsing red LIVE badge — currently Gary Spivey's *Tapping In*, Stargate Experience sessions, Abraham (Esther Hicks) workshops, and Joe Dispenza retreats. Coming Soon features Frequency: The Secret of Everything (thefrequencymovie.com) with poster, screening tour, and three CTAs.

Jerry & Esther Hicks (Abraham) videos were added to `t-channeling` in `videos.json` (7 entries, `v-hicks-1` through `v-hicks-7`) alongside the existing Bashar/Anka collection. A new chapter `pl-hicks` was added to `playlists.json` under the c-domains collection. The watch hub was regenerated via `node generate-watch.js` — final count: 367 videos, 18 playlists across 3 collections.

### 2. Ingest pipeline (`scripts/ingest/`)

Five `.mjs` scripts plus config + docs. Listens to YouTube uploads from every tracked teacher via RSS, generates FRQNCY-voiced blurbs via Claude Haiku, writes dated proposal files in a shape that's mechanical to merge. **Nothing here is wired into the live site.** No videos.json or playlists.json mutation. The pipeline only writes to `scripts/ingest/output/`.

Files (read these in order if you need to understand the system):

```
scripts/ingest/
├── README.md              # operator's guide — start here
├── teachers.json          # ingestion rules per playlist (caps, rotation, exclusions)
├── resolve-handles.mjs    # one-time @handle → UC… channel ID resolver
├── listen.mjs             # RSS-based diff against live videos.json
├── enrich.mjs             # optional: YouTube Data API metadata
├── blurb.mjs              # optional: Claude Haiku FRQNCY-voice blurbs
├── propose.mjs            # orchestrator → output/proposals/INGEST-YYYY-MM-DD.{json,md}
└── output/
    ├── channel-ids.json   # resolved channel ID cache (committed)
    └── proposals/         # dated proposals (committed for audit trail)
```

GitHub Actions stub at `.github/workflows/ingest.yml` is `workflow_dispatch`-only. The `schedule:` line is commented — uncomment it when you're ready to enable daily runs.

## What is verified

Run today's dry-run end-to-end produced these results, all on the live data:

- Resolver mapped all 16 teacher channel URLs to stable `UC…` IDs.
- Listener detected **206 new uploads** across 15 teachers (Osho, Sadhguru, Trudeau, Sai Maa, Neville, Shi Heng Yi, Tolle, Hancock, Local Project, Joe Dispenza, Kitchen Nightmares, Master Key Society, Abraham Hicks, Gary Spivey, GoldSilver — Planet Wild had nothing new).
- Proposal written to `scripts/ingest/output/proposals/INGEST-2026-05-25.json` (470 KB) + `INGEST-2026-05-25.md` (75 KB summary).
- `videos.json`, `playlists.json`, and `watch/index.html` sha256 hashes match pre-pipeline state. Confirmed untouched.

Without `ANTHROPIC_API_KEY` or `YOUTUBE_API_KEY` set, the pipeline fell back gracefully — every blurb came from the raw YouTube description, no durations populated. That's the expected behaviour; both keys are optional.

## What is NOT done

These are the obvious next moves. I'd suggest the order below but use your judgment.

**Shorts filter.** The 206-candidate count is inflated by YouTube Shorts (sub-60-second videos) and re-uploads. Adding a `min_duration_seconds: 90` field per teacher in `teachers.json`, plus a filter in `listen.mjs` (when enrich.mjs has populated durations) or in `propose.mjs`, would cut the noise by maybe 70%. The OSHO Hindi channel in particular is mostly Shorts and meditation re-loops — at minimum, add those video IDs to `excluded_video_ids` after one manual review pass.

**Voice playbook in `blurb.mjs` is a condensed extract, not the full doc.** The system prompt in `scripts/ingest/blurb.mjs` line ~32 has the seven rules inlined for token economy. If Orlando updates `proposals/FRQNCY-VOICE-PLAYBOOK.md`, the system prompt won't auto-update. Two options: (a) leave it manual, sync periodically; (b) have `blurb.mjs` read the playbook at runtime and inject a key section. Option (a) is what I shipped. Option (b) would catch drift but costs more tokens per call.

**Live and Coming Soon areas are hardcoded.** The cards in `watch/index.html` (between `<!-- ═══ LIVE AREA ═══ -->` and `</div><!-- /area-soon -->`) are static HTML. The Frequency Movie screening tour list, the four live-session cards — all hand-written. The natural next step is a `live.json` + `coming-soon.json` data file pattern matching what `videos.json` does, so these surfaces can be data-driven and (eventually) auto-populated by extending the ingest pipeline. The Live surface in particular is a candidate for auto-detection — YouTube's Atom feed exposes a livestream indicator we could read.

**No PR-bot wired up.** The Actions workflow drafts a PR via `peter-evans/create-pull-request@v6` but the actual merge is manual. That's intentional per the auto-grow pattern (`proposals/AUTO-GROW-LOOPS-V0.md`) — human gate on every editorial decision. If Orlando wants to test auto-merge under quarantine (with a `pending: true` flag on new videos so they don't render until reviewed), that's a v0.6 conversation.

**Live data files are larger than ideal.** `videos.json` is at 367 entries and growing; `watch/index.html` inlines all of it at build time and is now ~63K tokens (too big to Read whole in this tool). Sharding becomes worth doing around 1000 videos. Not urgent.

## How to validate anything you change

Don't break these. In rough order of stakes:

1. `node generate-watch.js` runs clean and outputs the "videos / playlists / collections inlined" line. This re-builds the watch hub from `videos.json` + `playlists.json` + `providers.json`.
2. `npm run lint` passes (validates the JSON files parse).
3. The four area tabs (Library, Cinema, Live, Coming Soon) render and the switcher works. The simplest manual test: `npx serve . -p 3000` and visit `http://localhost:3000/watch/`.
4. For the ingest pipeline: `node scripts/ingest/listen.mjs --json` writes `output/diff.json` and prints a summary. `node scripts/ingest/propose.mjs` writes a dated proposal. Neither should ever touch `videos.json`, `playlists.json`, or `watch/index.html` — the dry-run check I used was sha256 hashes before and after.

## Known gotchas

- **Paths with spaces.** This repo lives at `~/Documents/Claude/Projects/FRQNCY WEBSITE/` (space in the folder name). Several Node import.meta.url checks need to compare against `new URL(\`file://${process.argv[1]}\`).href` (which URL-encodes the space) rather than `\`file://${process.argv[1]}\`` (which doesn't). I hit this in all three runnable .mjs files — fixed, but worth knowing if you add a fourth.
- **Playlists in c-domains, not just c-teachers.** Nine of the sixteen tracked teachers actually live in the `c-domains` collection (pl-hicks, pl-spirituality, pl-money, etc.), not `c-teachers`. The ingest scripts walk both collections. The original v0 scraper at `scripts/auto-grow/video-ingest.mjs` only walks `c-teachers` — a bug, but the v0.5 pipeline supersedes it once you swap them over.
- **Channel IDs are stable; @handles are not.** YouTube lets channels rename their handle. The resolver caches the `UC…` ID for this reason. If a channel disappears entirely, the listener silently skips it (logs "feed fetch failed") — investigate manually if it persists.
- **The Bashar videos aren't in a playlist yet.** They live in `t-channeling` directly (you can see them in `videos.json`). There's no `pl-bashar` and the ingest pipeline therefore doesn't auto-track Darryl Anka's channel. If Orlando wants ongoing Bashar ingestion, create a `pl-bashar` in `playlists.json` (probably under c-domains, topic-mapped to `t-channeling`), add the corresponding entry to `teachers.json`, and run `resolve-handles.mjs`.
- **`pl-hicks` ingest topic_override.** Hicks videos go into `t-channeling` (the topic), not `t-hicks`. The `topic_override: "t-channeling"` field in `teachers.json` makes the pipeline route them correctly. If you add other multi-channel topics (e.g., a second channeller in `t-channeling`), use the same pattern.

## Where the live site is right now

The 90-day plan in `proposals/EXECUTION-PLAN-90D.md` is the source of truth on what's prioritised. As of today's session:

- Watch hub: Library + Cinema + Live + Coming Soon. Working.
- FRQNCY mobile app: source-complete, waiting on APK build. See `app/docs/SHIPPING-2026-04-29.md`.
- Topic graph: 146 topics in `search.json`, 766 resources in `resources.json`.
- Ingest pipeline: built, dry-run clean, not enabled.
- Auto-grow loops: v0 shipped (`scripts/auto-grow/`), v0.5 pipeline above is the upgrade path.

## If you're picking this up cold

Three things to do first:

1. Read `CLAUDE.md` at the repo root. Voice rules + "what NOT to do" are non-negotiable.
2. Read `scripts/ingest/README.md`. It's the operator's guide for the pipeline.
3. Read `proposals/FRQNCY-VOICE-PLAYBOOK.md` if you're going to generate any user-facing copy — descriptions, microcopy, anything that renders for a reader.

If Orlando asks you to "merge the proposal" without further detail, he means the most recent file in `scripts/ingest/output/proposals/`. The merge procedure is in the README under "Merging (the human step)". Apply the deltas, run `node generate-watch.js`, commit, push.

If he asks you to "turn on the ingest cron," that's the `schedule:` line in `.github/workflows/ingest.yml`. Uncomment it, push, done — but check with him first that he's set `ANTHROPIC_API_KEY` and `YOUTUBE_API_KEY` as repo secrets, otherwise the blurbs will be raw-description fallbacks.

If he asks for a v0.6 of the pipeline, the README's "What's next" section lists the candidate moves. The Shorts filter is the highest-value one.

## Style notes from this session

Per CLAUDE.md: prose over bullets in chat, single-line paste-able terminal commands, lean docs. I tried to honour those. The one place I leaned heavily on tables and lists was the README's "files" section and the `teachers.json` field reference — both genuinely tabular content where prose would obscure the structure.

— Claude (Opus 4.7), 2026-05-25
