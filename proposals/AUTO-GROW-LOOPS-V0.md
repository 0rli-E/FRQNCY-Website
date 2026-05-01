---
title: NRG / FRQNCY Auto-grow Loops v0 — Phase 4 Wk 7
date: 2026-04-29
status: shipped — v0 (URL-scraper era)
---

# Auto-grow loops (v0)

Per `proposals/EXECUTION-PLAN-90D.md` Phase 4 Wk 7. Three nightly scripts that **draft** content additions for human review. Nothing auto-merges.

## TL;DR

The harness drafts; humans decide. A nightly GitHub Action runs three scripts, writes output JSON/Markdown, opens a PR if anything changed. The picks editorial standard (`proposals/EDITORIAL-STANDARDS.md`) requires human judgment per entry — auto-merging would violate that. The auto-grow layer just removes the work of *finding* candidates so the operator's time goes to the work of *judging* them.

## What's shipped

1. **`scripts/auto-grow/resource-suggest.mjs`** — scans NRG posts (last 7 days, configurable via `DAYS_BACK`) for URLs not already in `resources.json`. Fetches title + description, infers type (video/tool/article/podcast/book/website) from URL pattern, infers `topicSlug` from the source post's `project_tag`. Writes `output/resources-suggested.json` with a `_context` block per entry showing the source post + author.

2. **`scripts/auto-grow/video-ingest.mjs`** — for each Watch playlist with a `channel_url`, scrapes the YouTube channel page for video IDs via the embedded `"videoId":"..."` JSON references. Compares to `playlist.video_ids`. Writes `output/videos-new.json` with up to 5 new candidates per playlist.

3. **`scripts/auto-grow/trace-reflect.mjs`** — reads `~/.frqncy-harness/traces/<YYYY-MM-DD>/*.jsonl` from the last 7 days. Aggregates run count, total cost, avg tool calls, top failure modes. Writes a Markdown report with honest "what's failing" framing (not a wins-highlights reel). Suggests fixes per failure type but never modifies harness code.

4. **`.github/workflows/auto-grow.yml`** — runs the first two nightly at 08:00 UTC, opens a PR via `peter-evans/create-pull-request@v6` if `scripts/auto-grow/output/` changed. Manual trigger via `workflow_dispatch` also available.

## Why no auto-merge

Picks are editorial decisions. A scraped URL is a candidate, not a decision. Three reasons:

1. **Editorial standards** require human vetting per `proposals/EDITORIAL-STANDARDS.md` (independence, verifiability, alignment with FRQNCY's spiritual-technology-not-spiritual-materialism filter).
2. **Voice integrity**. A drafted `desc` from a meta tag doesn't speak in FRQNCY's voice. The human merger rewrites it.
3. **Reversibility**. Drafts in a PR are easy to discard. Drafts in `main` would erode trust in the picks over time.

## Required env / secrets

GitHub Actions secrets:
- `SUPABASE_URL` — for `resource-suggest`'s posts query
- `SUPABASE_SERVICE_ROLE_KEY` — same

For local runs of `trace-reflect`: just `~/.frqncy-harness/traces/` populated (the harness writes there automatically).

## Cost

Zero. Free GitHub Actions tier. No paid model calls — `resource-suggest` does HTML scraping + simple URL pattern matching, not LLM inference.

## Run locally

```bash
node scripts/auto-grow/resource-suggest.mjs
node scripts/auto-grow/video-ingest.mjs
node scripts/auto-grow/trace-reflect.mjs
```

Output lands in `scripts/auto-grow/output/`. Review by hand before merging anything.

## v0.2 candidates

- **Replace URL scraper with `frqncy-harness agent "..."`.** Let the harness's MCP-aware agent do the suggesting, drafting from `frqncy-content` MCP tools instead of raw URL parsing. Same human-merger gate. Better topic inference. Voice-aligned drafts.
- **Sentiment / spam filter on candidates.** Drop URLs from posts marked as low-conviction or spam-flagged.
- **Multi-channel video ingestion.** Currently scrapes YouTube only. Add Vimeo + Rumble + Substack-video.
- **Trace-reflection auto-PRs.** When a failure mode crosses a threshold (e.g., timeout >5% over 3 days), auto-open a follow-up issue in the harness repo with the relevant trace links.

## What this does NOT do (deliberately)

- **Auto-publish**. Never. Editorial gate is the moat.
- **Decide topic placement.** It infers `topicSlug`; the human confirms.
- **Score quality.** All candidates are equal "for review" — no implicit ranking that could pre-bias the human.
- **Notify on social.** No Slack pings, no Telegram pings. The PR is the only notification surface — keeps the editorial work centered in the editorial venue.
