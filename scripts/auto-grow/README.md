# Auto-grow loops (v0)

Per `proposals/EXECUTION-PLAN-90D.md` Phase 4 Wk 7. Three nightly scripts that **draft** content additions for human review. Nothing here auto-merges. The harness (or a plain Node cron) drafts; humans decide.

## The loops

1. **`domain-coverage.mjs`** — **lead loop (v2).** Reads `content.json` (canonical pillars + domains) and `search.json` (topics) and surfaces structure for human judgement. Per domain: current topics, scope intent (if documented), placeholders for likely-missing + off-topic flags. Per pillar: primary-tagged topics and a placeholder for the communication-vs-fact-vs-vision drift check. Also flags orphan domains/pillars (tagged on topics but not declared in `content.json`). Pure read-only, no API keys, no network. **Model:** domain validity = real-world subject scope, NOT topic count; pillars = operating-mode verbs that apply to every topic. This loop never recommends adding or cutting domains/pillars — that's Orlando's call.
1a. **`domain-coverage-enrich.mjs`** — **v0.1 LLM pass.** Reads the structural JSON output above and calls an LLM (default: `google/gemini-2.5-flash` via OpenRouter) once per domain to fill in the *likely-missing topics* and *off-topic-membership flags* placeholders. Conservative prompts — only obvious gaps and obvious mismatches. Suggestions are surfaced for Orlando to judge; never auto-merged. Requires `OPENROUTER_API_KEY`; exit-0 if missing. Override the model via `FRQNCY_ENRICH_MODEL`.
2. **`resource-suggest.mjs`** — scans recent NRG posts for unindexed URLs, drafts candidate `resources.json` entries.
3. **`video-ingest.mjs`** — checks each Watch playlist's channel feed for new uploads, drafts video additions.
4. **`trace-reflect.mjs`** — reads recent harness traces from `~/.frqncy-harness/traces/`, writes a Markdown report on cost trends + top failure modes. Recommendation only; never modifies code.

### History

`topic-balance.mjs` (v1, deleted 2026-05-02) used per-pillar / per-domain count floors. Wrong model — pillars apply to every topic and domain coverage is judged by real-world subject scope, not by counts. Replaced by `domain-coverage.mjs`.

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
