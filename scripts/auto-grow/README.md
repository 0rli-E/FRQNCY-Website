# Auto-grow loops (v0)

Per `proposals/EXECUTION-PLAN-90D.md` Phase 4 Wk 7. Three nightly scripts that **draft** content additions for human review. Nothing here auto-merges. The harness (or a plain Node cron) drafts; humans decide.

## The three loops

1. **`resource-suggest.mjs`** — scans recent NRG posts for unindexed URLs, drafts candidate `resources.json` entries.
2. **`video-ingest.mjs`** — checks each Watch playlist's channel feed for new uploads, drafts video additions.
3. **`trace-reflect.mjs`** — reads recent harness traces from `~/.frqncy-harness/traces/`, writes a Markdown report on cost trends + top failure modes. Recommendation only; never modifies code.

All three write to `scripts/auto-grow/output/`. The GitHub Actions workflow at `.github/workflows/auto-grow.yml` runs them nightly, opens a single PR if anything changed.

## Why no auto-merge

Editorial standards (`proposals/EDITORIAL-STANDARDS.md`) require human judgment for every pick. A scraped URL is a candidate, not a decision. The pattern is **harness drafts, human merges** — same principle that keeps the picks honest.

## Required env / secrets

For the GitHub Actions runner:
- `SUPABASE_URL` — for resource-suggest's posts query
- `SUPABASE_SERVICE_ROLE_KEY` — same

For local runs of `trace-reflect`: just `~/.frqncy-harness/traces/` populated (the harness writes there automatically).

## Run locally

```bash
node scripts/auto-grow/resource-suggest.mjs
node scripts/auto-grow/video-ingest.mjs
node scripts/auto-grow/trace-reflect.mjs
```

Output lands in `scripts/auto-grow/output/`. Review the JSON / Markdown by hand before merging anything into `resources.json`, `videos.json`, or filing harness fixes.

## Future v0.2

Replace the simple URL scraper with `frqncy-harness agent "..."` — let the harness's own MCP-aware agent do the suggesting, drafting from `frqncy-content` tools instead of raw URL parsing. Same human-merger gate.
