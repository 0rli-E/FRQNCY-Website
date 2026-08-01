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

**Voice guide (canonical):** `proposals/FRQNCY-VOICE-PLAYBOOK.md` — read before writing any user-facing copy. Seven voice attributes, must-use / banished terminology, tone-by-context matrix, open questions blocking live deployment.

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

Current state: **v0.7.0-alpha.1+** (post-2026-04-28 perplexity + claude-sdk lanes). Capabilities:
- **Nine provider lanes:**
  - API path (full tool/streaming support): `anthropic`, `openai`, `google`, `openrouter`, `chutes`, `perplexity` (sonar/sonar-pro/sonar-reasoning, returns structured `sources`)
  - SDK path (in-process agent loop, real per-token cost, structured tool events, MCP/hooks): `claude-sdk` (uses `@anthropic-ai/claude-agent-sdk`'s `query()`)
  - Subscription path (subprocess CLI, no tools, $0 cost from Max/Pro quota): `claude-code`, `codex`
- Tools: bash, read, write, grep, glob, web_fetch, web_search (Tavily/Brave)
- MCP client (Claude Desktop schema-compatible). `frqncy-content` server is NOT auto-configured — wire it manually via `frqncy-harness mcp add ...` or `mcp import-from-claude-desktop`.
- Sandbox: gtr worktree per agent run, tempdir fallback
- Trace storage: `~/.frqncy-harness/traces/<YYYY-MM-DD>/<conversation-id>.jsonl` + INDEX.jsonl. Auto-commit-and-push hook available; intended remote `0rli-E/frqncy-harness-traces` (configure git remote manually).
- Cost guardrails: $5 soft warn / $25 hard abort per conversation. No per-day/per-month aggregates yet. **Caveat:** Perplexity per-request search fees aren't modeled in v0.7's per-token schema (will silently undercount; v0.8 schema bump fixes).
- Lethal-trifecta gate (Simon Willison): privateData + untrustedContent + outboundNetwork — severity warn / block / allow
- **Sub-agents blocked by default on the claude-sdk lane** (`disallowedTools: ['Agent']`) per `proposals/SUB-AGENTS.md` — proposal recommends keeping sub-agents off until trace schema bumps to support parent/child conversation_id linkage. Override per-call via `allowedTools` if you've read the proposal.
- 204 tests passing across 20 test files (was 201 before today's parse-test additions for perplexity + claude-sdk)
- Replay command (`frqncy-harness replay <conversation-id> [--diff]`) for manual regression eval. No autonomous self-optimisation loop yet.

CLI usage:
```bash
frqncy-harness chat "..." --model claude-code/sonnet                   # free via Max (no tools)
frqncy-harness chat "..." --model claude-sdk/claude-sonnet-4-6         # API rate, full tools/MCP/hooks (NEW 2026-04-28)
frqncy-harness chat "..." --model perplexity/sonar-pro                 # search-grounded, returns sources (NEW 2026-04-28)
frqncy-harness chat "..." --model openrouter/openrouter/free           # free via OpenRouter auto-router
frqncy-harness agent "..." --model openrouter/google/gemini-2.5-flash --yolo  # cheap reliable agent
frqncy-harness doctor
frqncy-harness mcp list
frqncy-harness costs --period 7d
```

For agent runs:
- Tools work on API providers (anthropic, openai, google, openrouter, chutes, perplexity) — go through the harness's HarnessTool surface.
- Tools work on `claude-sdk/*` — but use the SDK's own internal tool registry (bash/file/web/MCP); the harness's HarnessTool array is NOT yet bridged into the SDK lane (v0.8 follow-up).
- Tools do NOT work with `claude-code/*` or `codex/*` — those subprocess the official CLIs which do their own internal tooling.

## Architectural decisions to know about

Read these before changing anything structural:

- `proposals/HARNESS-PLAN.md` — 11 locked decisions for `@frqncy/harness`
- `proposals/HARNESS-DEFAULTS-REVIEW.md` — 30 architectural defaults with pros/cons
- `proposals/HARNESS-USE-CASES.md` — 10 practical use cases for FRQNCY-flavored work
- `proposals/HARNESS-RESEARCH-NOTES.md` — five-agent research dump (VC theses, Hermes, frontier-lab essays)
- `proposals/HARNESS-TOOLS-INVESTIGATION.md` — Skills, Hooks, Caveman, Graphiti+Neo4j, DeAI providers — recommendations
- `proposals/REVENUE-MODEL.md` — five revenue surfaces (Aligned, Courses, Referrals, Sanctuary, Fund)
- `proposals/SANCTUARY-ROADMAP.md` — Sanctuary-specific phases + principles + what-stays-out-forever. Required reading before any Sanctuary work.
- `my-frqncy/dashboard/CLAUDE.md` — Sanctuary-scoped orientation: file shape, state schema, voice rules, render conventions, slash commands. Claude Code reads this automatically when you cd into that directory.
- `proposals/EDITORIAL-STANDARDS.md` — what makes a FRQNCY pick, conflict-of-interest disclosure, who can mark a pick
- `proposals/EDITORIAL-VALUES-V2.md` — slogans, voice, posture (slogan-level supersedes this CLAUDE.md)
- `proposals/FRQNCY-VOICE-PLAYBOOK.md` — canonical voice guide (read before writing any user-facing copy)
- `proposals/HARNESS-BEGINNER-GUIDE.md` — beginner-friendly setup for harness users
- `proposals/EXECUTION-PLAN-90D.md` — current 90-day plan (2026-04-27 → 2026-07-26)
- `proposals/VISION-1H-DEMO.md` — north star: the 1h demo that explains FRQNCY without slides
- `proposals/BACKEND-STATUS.md` — single source of truth on what's alive / scaffolded / zero-state per surface
- `proposals/TOPIC-COMMISSION-CONTEXT-GRAPH.md` — the procedure for commissioning a unique topic page (each one is its own piece)
- `proposals/CURATION-AGENT.md` — the "Gardener": an AI that prunes/grows the world tree + constellation + beds with ~1 human steward per topic; four layers (QA senses / memory canon / harness judgment / stewards governance), asymmetric prune gate, eval-calibrated per-sector trust
- `proposals/WORD-ILLUMINATOR-V2.md` — the source-set + 5-section template for Word Illuminator outputs
- `proposals/MY-FRQNCY-VBRTN-COMPANION-2026-05-22.md` — VBRTN cause doc: what My FRQNCY is for, the seven lenses (HD, Gene Keys, astrology, Hawkins, NLP meta-programs, modal operators, triggers), the Milton-Model voice, the four-shape companion behavior, the rules-to-win architecture, the intake questionnaire v0
- `frqncy-harness/proposals/SUB-AGENTS.md` — recommend-against-unless framing on sub-agents in the harness (lives in the sibling repo)

## What's currently in motion

As of 2026-05-13:

1. **FRQNCY mobile app is source-complete and waiting on APK build** at `app/`. Capacitor 7 hybrid, all 8 Kotlin classes + 4 supporting Kotlin files compile clean against API 35 + AppCompat 1.7 + Capacitor 7.6.2 (empirically verified with kotlinc). Web bundle synced into `android/app/src/main/assets/public/`. Branded splash + launcher + notification icons. 4 bundled audio variants (morning/evening/stillness/release). First-launch home welcome, two-phase pre-wake, snooze cap at 2, accessibility (3 dismiss modes + haptic-only wake), error toasts, smart resume, audio focus recovery, telemetry endpoint live in `functions/api/alarm-error.js`. **READ FIRST:** `app/docs/SHIPPING-2026-04-29.md` for the latest state and the to-APK terminal commands. `app/docs/PERFECT-WEEK-ROADMAP-2026-05-03.md` for the day-by-day delivery log.
2. **90-day execution plan** locked in `proposals/EXECUTION-PLAN-90D.md` (window: 2026-04-27 → 2026-07-26, solo, ~$100 budget).
3. **FRQNCY content MCP server** (`mcp-servers/frqncy-content/`). 11 tools. Add to harness via `frqncy-harness mcp add`.
4. **Trace data** preserved at `~/.frqncy-harness/traces/`.

## How to do common tasks

**Resume FRQNCY app work in Claude Code:**
First read `app/docs/SHIPPING-2026-04-29.md` for state and `app/docs/PERFECT-WEEK-ROADMAP-2026-05-03.md` for the day-by-day delivery log. Then check `app/docs/CONTINUE-IN-CLAUDE-CODE.md` for the entry-point prompt. Slash commands at `.claude/commands/` cover the common dev loops (`/app-build`, `/app-sync`, `/app-verify`, `/app-apk`).

**Build the Android APK (Orlando, in terminal):**
```bash
cd ~/Documents/Claude/Projects/FRQNCY\ WEBSITE/app
rm -rf node_modules package-lock.json
npm install
npm run cap:sync
npx cap open android
```
Then in Studio: ▶ on a connected phone or Build → Build APK(s). Output at `android/app/build/outputs/apk/debug/app-debug.apk`.

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
5. **Append an entry to `OPERATIONS.md`** — see below. This is not optional.
6. Update this CLAUDE.md if you discovered something a future agent should know.

## Tracking — where state lives

**One source of truth, many generated views. Never create a second writable tracker.**

Two systems that both hold task state disagree within weeks, after which neither is
trusted. That is exactly how four mutually-contradicting status docs ended up in
`proposals/`. If asked for a Trello / Notion / second board, generate it from the
tracker or explain why not.

- **Task state → `0rli-E/frqncy-ops` issues (private).** File work there, not in
  `proposals/`. The main repo is **public**, so operational, legal, security and money
  detail belongs in the private tracker.
- **`node scripts/status.mjs`** — run this *instead of* reading a roadmap doc. It probes
  git divergence, every branch ahead of origin, prod routes, companion health, data beds
  and status-doc age. Derived, so it cannot go stale.
- **`node scripts/board-sync.mjs`** — regenerates the human view (`--md` for markdown,
  default emits Miro DSL). The Miro board is a *printout*; edits made there are discarded
  on the next regeneration.
- Roadmap docs in `proposals/` are **orientation, not status**. `MASTER-ROADMAP.md` and
  `BACKEND-STATUS.md` are months stale — treat their claims as historical.

## Parallel agents — how not to collide

Multiple agents and terminals write to this repo at once. A git snapshot here is valid
for **minutes, not for a session**. Branches move under you mid-task; this has happened
repeatedly and has destroyed live pages.

**Guards are installed** via `core.hooksPath = .githooks` (set this if you clone fresh):
- `pre-commit` blocks a commit staging more than 20 deletions. Override with
  `FRQNCY_ALLOW_DELETIONS=1` when the bulk delete is genuinely intended.
- `pre-push` blocks pushing to `main` when `main` has commits you lack, which would
  discard them. Override with `FRQNCY_ALLOW_DIVERGED=1` once you have actually reconciled.

**Rules that prevent the collisions the hooks only catch:**

1. **Work in your own worktree on your own branch.** A worktree has its own index, so
   there is no `index.lock` race and no chance of staging another agent's files.
   Ship via a worktree branched off fresh `origin/main`.
2. **Never `git add -A` or `git add .`** when other agents may be active. Stage explicit
   paths. Every destructive incident on record began with a bulk add.
3. **Stage and commit in a single shell invocation** — `git add <paths> && git commit -m "..."`.
   The race lives in the gap between the two.
4. **Re-check `git rev-parse HEAD` immediately before acting on branch state**, not just
   when you first looked. If it moved, a parallel commit ran — inspect `git log -1 --stat`
   before doing anything else.
5. **Read `git diff --cached --stat` before every commit.** If a "build 8 pages" commit
   shows thousands of deletions, abort. That is the failure the pre-commit hook exists for.
6. **Do not trust commit messages** for attribution — auto-sync agents have committed
   unrelated work under unrelated titles. Use `git log --oneline -- <path>` then
   `git show <sha> --stat` to find where something actually landed.
7. **`git cherry` / patch-id is unreliable** once `main` carries squashed publishes. It will
   report commits as missing that are already upstream. Reconcile by content — see
   `scripts/status.mjs` and the reconciliation notes in the ops tracker.

## OPERATIONS.md — the shared log

Before handing control back, append an entry to the top of `OPERATIONS.md` covering
**Did / Opened / Finished / Left**. One entry per working session, not per tool call.
Skip it only if nothing changed state.

The part that matters most is **Left**: what is unfinished, blocked, or *unverified*.
Say explicitly what you did not check. "Committed" is not "deployed" and "deployed" is
not "works" — never record something as finished that you did not verify, and name the
verification method when you do.

## Style

Write in prose, not bullet lists, when explaining things to Orlando in chat. He prefers single-line paste-able commands when giving him terminal work — no backslash continuations, no multi-line commit messages. Each command on its own line in code blocks.

For documentation: lean and skimmable. Headers, short sections, one example per concept.
