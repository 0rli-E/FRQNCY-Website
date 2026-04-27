# CLAUDE.md — context for any agent working in this folder

You're working in **FRQNCY**. Read this file before doing anything substantial. It's the orientation pack for Claude Code, `@frqncy/harness`, Cursor, and any other agent that gets pointed at this folder.

## What FRQNCY is

A consciousness-practice content + social platform. Static site at `/v2/` (Astro-style HTML), social platform under `/social-src/` (Astro + Preact + Supabase), hybrid mobile app at `/app/` (Capacitor 7). Deploys to Cloudflare Pages.

**Founders:** Orlando (orlando.eisenreich@gmail.com) is Founder. Norman Gräter is Co-Founder. Asymmetric, not parallel.

## Editorial values — apply to ANY content you generate

These are non-negotiable. Violating them = wrong output.

1. **Cooperation over competition.** No leaderboards. No "calls" framing. No ranking people. Conviction as self-expression is OK; ranking *people* is not.
2. **Every teaching lives on the site.** Long-term: profiles, books, practices should all be readable here. External links are footnotes, not destinations.
3. **Conscious about consciousness.** No spiritual cliches. Frame practices as experiments, not prescriptions.
4. **Default "add" target is `/v2/explore.html`.** When the user says "add X" without a destination, place on the explore page where it fits thematically.

## Repo layout — where things live

- `v2/` — main static site (146 topic pages, content data, page templates)
- `v2/explore.html` — the explore page (the FRQNCY topic graph)
- `v2/decentralised-ai/`, `v2/crypto/`, etc. — per-topic pages
- `search.json` — 146 topics (the topic graph data)
- `resources.json` — 766 resources (people, books, orgs, media, music, places, tools, platforms, courses, websites, apps, articles, references)
- `content.json` — additional content
- `social-src/` — social platform (Supabase + Astro + Preact)
- `app/` — Capacitor mobile app
- `proposals/` — planning docs (read these for any architectural question)
- `mcp-servers/frqncy-content/` — MCP server exposing FRQNCY content as tools
- `harness.md` — the four-essay corpus on harness engineering + context graphs
- `docs/` — additional documentation

## Convention: physical places

Physical places (e.g., a meditation center, a bookshop) live on `/v2/explore.html` with `p-` ID prefix, `type: "topic"`, linked to Sanctuary + thematic topics, with `NODE_URL` → external site. Don't put them in resources.json.

## The harness project (separate repo)

There's a sibling repo at `/Users/orli/Documents/Claude/Projects/frqncy-harness/` — `@frqncy/harness`, Orlando's plug-and-play LLM harness. It's pushed to `github.com/0rli-E/frqncy-harness`.

Current state: **v0.7.0-alpha.1**. Capabilities:
- Seven provider lanes: anthropic, openai, google, openrouter, chutes (API path) + claude-code, codex (subscription subprocess path)
- Tools: bash, read, write, grep, glob, web_fetch, web_search (Tavily/Brave)
- MCP client (Claude Desktop schema-compatible). `frqncy-content` server is NOT auto-configured — wire it manually via `frqncy-harness mcp add ...` or `mcp import-from-claude-desktop`.
- Sandbox: gtr worktree per agent run, tempdir fallback
- Trace storage: `~/.frqncy-harness/traces/<YYYY-MM-DD>/<conversation-id>.jsonl` + INDEX.jsonl. Auto-commit-and-push hook available; intended remote `0rli-E/frqncy-harness-traces` (configure git remote manually).
- Cost guardrails: $5 soft warn / $25 hard abort per conversation. No per-day/per-month aggregates yet.
- Lethal-trifecta gate (Simon Willison): privateData + untrustedContent + outboundNetwork — severity warn / block / allow
- 202 tests passing across 20 test files
- Replay command (`frqncy-harness replay <conversation-id> [--diff]`) for manual regression eval. No autonomous self-optimisation loop yet.

CLI usage:
```bash
frqncy-harness chat "..." --model claude-code/sonnet            # free via Max
frqncy-harness chat "..." --model openrouter/openrouter/free    # free via OpenRouter auto-router
frqncy-harness agent "..." --model openrouter/google/gemini-2.5-flash --yolo  # cheap reliable agent
frqncy-harness doctor
frqncy-harness mcp list
frqncy-harness costs --period 7d
```

For agent runs: tools work on API providers. They do NOT work with `claude-code/*` or `codex/*` (those subprocess the official CLIs which do their own internal tooling).

## Architectural decisions to know about

Read these before changing anything structural:

- `proposals/HARNESS-PLAN.md` — 11 locked decisions for `@frqncy/harness`
- `proposals/HARNESS-DEFAULTS-REVIEW.md` — 30 architectural defaults with pros/cons
- `proposals/HARNESS-USE-CASES.md` — 10 practical use cases for FRQNCY-flavored work
- `proposals/HARNESS-RESEARCH-NOTES.md` — five-agent research dump (VC theses, Hermes, frontier-lab essays)
- `proposals/REVENUE-MODEL.md` — five revenue surfaces (Aligned, Courses, Referrals, Sanctuary, Fund)
- `proposals/HARNESS-BEGINNER-GUIDE.md` — beginner-friendly setup for harness users
- `proposals/EXECUTION-PLAN-90D.md` — current 90-day plan (2026-04-27 → 2026-07-26)
- `proposals/VISION-1H-DEMO.md` — north star: the 1h demo that explains FRQNCY without slides
- `proposals/BACKEND-STATUS.md` — single source of truth on what's alive / scaffolded / zero-state per surface

## What's currently in motion

As of 2026-04-27:

1. **90-day execution plan** is locked in `proposals/EXECUTION-PLAN-90D.md` (window: 2026-04-27 → 2026-07-26, solo, ~$100 budget). Phase 1 = stand up every scaffolded surface; Future Roadmap appendix lists capital-blocked items.
2. **FRQNCY content MCP server** (`mcp-servers/frqncy-content/`). 11 tools: search_topics, get_topic, list_topics, list_domains, list_pillars, search_resources, get_resource, list_resources_for_topic, list_resources_by_type, random_topic, stats. Not auto-wired into harness — add via `frqncy-harness mcp add`.
3. **Trace data** preserved at `~/.frqncy-harness/traces/`. Mirror to a private repo via a manually-configured git remote.
4. **Open ideas** for FRQNCY work via the harness — see `proposals/HARNESS-USE-CASES.md`.

## How to do common tasks

**Add a new topic to FRQNCY's explore page:**
Edit `search.json` (add a new entry following the schema of existing topics), then update `v2/explore.html` accordingly.

**Add a new resource:**
Edit `resources.json` (follow the existing entry shape: `{type, name, desc, url, topicSlug, topicLabel, topicUrl, domain, domainSlug, external}`).

**Run an agent task:**
```bash
frqncy-harness agent "..." --model openrouter/google/gemini-2.5-flash --yolo
```

**Test the FRQNCY MCP server:**
```bash
frqncy-harness mcp test frqncy-content
```

**Search the topic graph from any tool-using agent:**
The `frqncy-content__search_topics`, `frqncy-content__list_topics`, etc. tools are auto-loaded into any `frqncy-harness agent` run.

## What NOT to do

- Don't add leaderboards, ranking, or "calls" framing anywhere.
- Don't add tools to `claude-code/*` or `codex/*` model paths in the harness — they don't support tools.
- Don't bypass the lethal-trifecta gate — surface a warning, let the user decide.
- Don't overwrite `progress.md` or `tasks.json` mid-agent — they're the cross-session memory bridge.
- Don't push trace data to a public repo. The trace store is private (`0rli-E/frqncy-harness-traces`).

## When you finish a task

1. Run any tests that exist for what you touched.
2. Show the user the diff.
3. Commit with a descriptive message.
4. Push if there's a remote.
5. Update this CLAUDE.md if you discovered something a future agent should know.

## Style

Write in prose, not bullet lists, when explaining things to Orlando in chat. He prefers single-line paste-able commands when giving him terminal work — no backslash continuations, no multi-line commit messages. Each command on its own line in code blocks.

For documentation: lean and skimmable. Headers, short sections, one example per concept.
