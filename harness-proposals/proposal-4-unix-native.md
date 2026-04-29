# Proposal 4: Unix Native

## Core thesis (1 sentence)

The self-evolving FRQNCY harness should ship as a single `harness` binary plus ~400 lines of shell — a pipeable, greppable, tail-able Unix tool whose entire control surface is `tmux`, `gtr`, the Claude Agent SDK in `--output-format stream-json` mode, and a `tasks/` directory of plain markdown — because every harness that has shipped a config schema in the last 18 months has died of its own weight.

## Lens

CLI ergonomics first, framework-thinking last. Geoffrey Huntley's discipline ("watch the loop, codify the failure") only works if the loop is *legible* — visible in `tmux ls`, debuggable with `tail -f`, composable with `xargs` and `jq`. The harness wins by being so small it fits in your head: if you can't print the entire control flow on one page, you've already built the wrong thing.

## Phases

### Phase 0: The one-screen agent (Week 1)

- **What to build.** A single shell script `bin/harness` (~80 lines) that wraps `claude -p "$PROMPT" --output-format stream-json --verbose | jq -c .` into a Ralph-style loop with three flags: `--until "REGEX"`, `--max-iter N`, `--log path/`. No config file. No daemon. Reads stdin, writes stream-json to stdout, stderr is human-readable status. Bonus: `harness ralph "fix the broken topic page" --until "DONE"` exits 0 when the regex matches the agent's last assistant turn.
- **Why.** Until you can run a Ralph loop from a one-liner and pipe its output into `grep`, you don't have a Unix tool — you have a toy. Stream-json is the foundation that makes every later phase (observability, replay, multi-agent) possible. ([Claude Code Docs — headless mode](https://code.claude.com/docs/en/headless), [Background Claude — stream-json changes everything](https://backgroundclaude.com/blog/stream-json))
- **Dependencies.** `claude` CLI (already installed), `jq`, `tmux`, `gtr`. That's it. No Node project yet.

### Phase 1: tmux as the runtime, `gtr` as the workspace (Weeks 2–3)

- **What to build.** Three shell verbs: `harness pane spawn <name> <prompt>` (creates a `gtr` worktree, opens a tmux pane in a session named `frqncy`, starts the Ralph loop with `pipe-pane` redirecting stream-json into `logs/<name>.jsonl`), `harness pane status` (greps the latest assistant events from each pane's log via `jq`), and `harness pane reap` (`gtr clean --merged` plus `tmux kill-pane` for finished panes). All three are plain shell wrapping `tmux send-keys`, `tmux capture-pane`, and `git gtr`.
- **Why.** This is the harness Anthropic's Agent Teams docs and Mario Zechner's pi-mono both converge on — "no background bash, use tmux" — and it's already proven in production by primeline-ai's claude-tmux-orchestration and AWS's `cli-agent-orchestrator`. ([primeline-ai/claude-tmux-orchestration](https://github.com/primeline-ai/claude-tmux-orchestration), [awslabs/cli-agent-orchestrator](https://github.com/awslabs/cli-agent-orchestrator), [pi-mono](https://github.com/badlogic/pi-mono)) Each pane is a process you can `attach` to, each log is a file you can `tail -f`, each worktree is a `git diff` away from a real PR.
- **Dependencies.** Phase 0. `git gtr` installed (`brew tap coderabbitai/tap && brew install git-gtr`).

### Phase 2: Tasks-as-files, the only state schema (Week 4)

- **What to build.** A `tasks/` directory at the repo root. Every task is one markdown file: front-matter for `id`, `goal`, `until`, `worktree`, `pane`. The body is the prompt. `harness queue` is a shell pipeline: `ls tasks/todo/*.md | xargs -n1 harness pane spawn`. `harness done` moves the task to `tasks/done/`. There is no database, no Redis, no JSON state file beyond the per-pane `.jsonl` logs.
- **Why.** Every claim in harness.md about "state belongs on disk" cashes out here. Markdown + git is the simplest possible event log. You can grep tasks (`grep -l 'topic-page' tasks/`), diff the queue between days, and bisect a regression with `git log tasks/`. Aider, Huntley's Loom, and the Ralph plugin all converge on this: the prompt is the spec, and the spec is a file. ([aider — scripting](https://aider.chat/docs/scripting.html), [snwfdhmp/awesome-ralph](https://github.com/snwfdhmp/awesome-ralph))
- **Dependencies.** Phase 1. A convention on the team that the canonical spec for a self-evolving FRQNCY task is a `.md` file, not a Notion doc.

### Phase 3: The TS core — small, pipe-friendly, optional (Weeks 5–6)

- **What to build.** A 600-line TypeScript binary `harness-core` that does exactly four things shell can't do well: (1) PPAF assembly — read the task file, the latest pane log, and the `gtr` diff into a single rehydration prompt; (2) typed exception handling — parse stream-json events, classify into `tool_error`, `rate_limit`, `model_refusal`, `oom`, emit Prometheus-style counters to a TSV log; (3) Feedback Assembler — when the agent says "DONE", run the task's `verify:` block (a literal shell command in the front-matter) and feed its exit code + stdout back as the next user turn; (4) Tool Gateway — a minimal allowlist that wraps `claude --allowedTools` with FRQNCY-specific tool defaults. Output is stream-json on stdout. Input is task files on stdin. Behaves like `cat`, `grep`, or `jq` — composable, single-purpose.
- **Why.** This is where pi-mono and Simon Willison's `llm` CLI are pointing: the binary should *be* a Unix filter. Willison: "an LLM is effectively a function you pipe a prompt to, and get a response back." ([Simon Willison — LLMs on the command line](https://simonwillison.net/2025/May/27/llm-tools/), [pi-mono README](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/README.md)) Everything in the harness model — Tool Gateway, Call Interceptor, Feedback Assembler, Context Manager, Exception Handler — collapses into "a binary that reads stream-json and writes stream-json with side effects on disk."
- **Dependencies.** Phase 2. Claude Agent SDK (TypeScript). Nothing else — no framework, no DI container, no plugin system.

### Phase 4: The self-evolving FRQNCY ralph (Weeks 7–8)

- **What to build.** Three persistent `harness` panes inside a tmux session named `frqncy-evolve`: `pane:topics` (reads `analytics/low-traffic.tsv`, drafts a new topic page in a `gtr` worktree, opens a PR, loops), `pane:abtests` (reads PostHog experiment results, writes the loser's funeral and the winner's promotion as a PR, loops), `pane:conversion` (reads the last 24h of practitioner-signup events, proposes one CTA tweak per loop). Each pane has a one-line spec in `tasks/persistent/`. Each loop's `--until` is a verifiable shell command (`pnpm test && pnpm build && lighthouse-ci ...`).
- **Why.** This is the payoff. By Week 8 you have three Ralph loops running 24/7 on FRQNCY itself, each producing PRs, each fully observable via `tmux attach -t frqncy-evolve` and `tail -f logs/topics.jsonl`. The "self-evolving FRQNCY" thesis becomes a `systemd` unit, not a research project.
- **Dependencies.** Phases 0–3. PostHog/Plausible export script. A merge gate (you, or a fourth `pane:reviewer`).

### Phase 5: Disciplined growth, not feature growth (ongoing)

- **What to build.** Every time a loop fails, the fix lands in *one* of three places: (a) the task's prompt (most common), (b) `harness-core` if it's a structural bug in feedback assembly, (c) a new shell verb under `bin/harness-*` if it's an ergonomics gap. Hard rule: no new flags on `harness` itself unless removing two existing flags. No config files, ever. No "plugin system."
- **Why.** Huntley's "watch the loop, codify the fix" discipline is the actual product. The harness wins by *not* sprawling. ([ghuntley.com/loop](https://ghuntley.com/loop/))
- **Dependencies.** Discipline.

## Trend research (with this lens)

1. **Stream-JSON is now the canonical agent IPC format.** Claude Code's `--output-format stream-json` ships newline-delimited JSON events with `session_id`, tool calls, retry visibility, and full audit trails — turning every agent invocation into a `tail`-able log file. CConductor, Background Claude's analysis, and the Anthropic docs all treat stream-json as the substrate for shell-first harnesses. This is the single most important CLI ergonomics shift of 2026 — it makes `claude -p ... | jq` a primary interaction pattern. ([Claude Code headless docs](https://code.claude.com/docs/en/headless), [Background Claude — stream-json](https://backgroundclaude.com/blog/stream-json), [CConductor on Medium](https://medium.com/@yanivg/cconductor-research-i-can-audit-automate-and-reuse-be26a67f52a7))

2. **The minimalist coding-agent thesis has been validated at scale.** Mario Zechner's pi-mono — four tools (read/write/edit/bash), tiny system prompt, no sub-agents, "use tmux instead of background bash" — powers OpenClaw, the project that hit 250k GitHub stars in three months. Zechner's explicit claim: *frontier models perform better when you strip the harness down*. This is the empirical case against framework-thinking. ([What I learned building an opinionated and minimal coding agent](https://mariozechner.at/posts/2025-11-30-pi-coding-agent/), [pi-mono README](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/README.md))

3. **Ralph is now the *default* mental model for autonomous loops in 2026.** DEV Community ran a flagship "2026 — The Year of the Ralph Loop Agent" piece in Q1; LinearB has a podcast series on it; `awesome-ralph` has aggregated dozens of implementations. The first publicly documented "evolutionary software auto-heal" — a system that found a bug, fixed it, deployed, and verified autonomously — happened in January 2026 on a Ralph loop. The discipline has gone mainstream. ([2026 — The Year of the Ralph Loop Agent](https://dev.to/alexandergekov/2026-the-year-of-the-ralph-loop-agent-1gkj), [Mastering Ralph loops — LinearB](https://linearb.io/blog/ralph-loop-agentic-engineering-geoffrey-huntley), [awesome-ralph](https://github.com/snwfdhmp/awesome-ralph))

4. **Tmux + worktrees + heartbeat logs is the production pattern.** Karan Singh's March-2026 Medium walkthrough, primeline-ai's claude-tmux-orchestration repo (heartbeat monitoring, file-based coordination), AWS Labs' `cli-agent-orchestrator`, and Composio's `agent-orchestrator` all converge on the same shape: tmux session per batch, one `gtr` worktree per pane, `tmux capture-pane -p | tail -1` for status polls, file-based mailboxes for inter-agent messages, adaptive heartbeat intervals (30s stuck / 120s normal / 300s idle). Nobody is shipping a custom scheduler. ([primeline-ai/claude-tmux-orchestration](https://github.com/primeline-ai/claude-tmux-orchestration), [awslabs/cli-agent-orchestrator](https://github.com/awslabs/cli-agent-orchestrator), [Watch Claude Code Agents Work Side by Side — Singh](https://ksingh7.medium.com/watch-claude-code-agents-work-side-by-side-a-tmux-setup-guide-1ef3ba1531c4))

5. **Simon Willison's `llm` CLI has become the proof-of-concept for "Unix-philosophy AI."** `llm 0.30` (March 2026) ships tools, fragments (URL/file/alias context loading via `-f`), and pluggable backends — and its entire idiom is `cat file | llm -t pattern -m claude-opus-4-7`. The pattern composes with `pbpaste`, `xargs`, and `jq` cleanly. Daniel Miessler's Fabric extends this with 200+ named patterns and a 1M-token Opus 4.7 backend (added April 2026). The lesson: small filter-shaped binaries beat monolithic frameworks. ([simonw/llm](https://github.com/simonw/llm), [LLM 0.26 tools blog](https://simonwillison.net/2025/May/27/llm-tools/), [Fabric repo](https://github.com/danielmiessler/Fabric), [Fabric CHANGELOG](https://github.com/danielmiessler/Fabric/blob/main/CHANGELOG.md))

6. **"Bash is all you need" is now a literal repo.** `shareAI-lab/learn-claude-code` reproduces a Claude-Code-class agent in 150 lines of bash + a tiny Python shim, and Nader Dabit's tutorial walks through rebuilding Claude Code from scratch as a 150-line shell project. The reproducibility ceiling for "useful agent harness" has dropped to a single afternoon. If FRQNCY's harness is more than ~600 LOC of TS plus a handful of shell scripts, it's overbuilt. ([shareAI-lab/learn-claude-code](https://github.com/shareAI-lab/learn-claude-code), [Nader Dabit — rebuilding Claude Code in 150 lines](https://x.com/dabit3/status/2009672223859310708))

## Top 3 risks of this approach

1. **Shell scripts rot.** Bash is unreadable past 200 lines, has no types, and breaks subtly on macOS vs Linux. *Mitigation:* hard cap of 80 lines per script; anything bigger moves to `harness-core` (TS). Lint with `shellcheck` in pre-commit. Pin to `bash 5.x` (`#!/usr/bin/env bash`, `set -euo pipefail` on every script, no exceptions).
2. **Tmux is opaque to non-Unix-natives.** If Orlando ever hires a collaborator who works in VS Code's integrated terminal, the harness is invisible to them — Anthropic's own Agent Teams docs note tmux mode "explicitly does not work" in VS Code, Windows Terminal, or Ghostty. *Mitigation:* ship a `harness web` command that streams the same `.jsonl` logs to a 200-line static HTML page (no React, no framework — `EventSource` + a `<pre>` tag). The tmux runtime stays canonical; the web view is read-only observability.
3. **The "no config" rule is a religion that breaks under real complexity.** When you have 12 persistent loops and 4 different `--until` policies, the lack of a config file becomes friction, not freedom. *Mitigation:* the task front-matter *is* the config — distributed, file-per-task, greppable. If you ever need a global config, you've grown past this proposal's sweet spot, and you should fork to Proposal 6 (whatever the "platform" lens proposes).

## Why this wins (vs. the obvious alternative)

The obvious alternative is **"build a proper framework"** — a TS monorepo with a config schema, a job queue (BullMQ or Temporal), a web dashboard, plugin interfaces, an event bus. That approach loses for three reasons:

1. **Time-to-first-loop.** Phase 0 of this proposal — `harness ralph "..." --until "DONE"` — ships in a day. The framework version is at least three weeks before it does anything Claude Code's CLI doesn't already do for free.
2. **Debuggability.** When (not if) the agent gets stuck, the Unix-native version is debugged by `tmux attach`, `tail -f logs/<pane>.jsonl | jq`, and `git diff` in the worktree. The framework version is debugged by reading TypeScript stack traces from a queue worker. Huntley's discipline — "watch the loop, codify the fix" — only works if watching the loop costs nothing.
3. **It composes with everything Orlando already has.** The same `harness ralph` invocation works inside a `gh workflow`, a `cron` entry, a `launchd` plist, a Raycast script, or a `git pre-push` hook. The framework version requires an SDK to do any of those.

The harness should *be* the Unix philosophy applied to LLMs — small sharp tools, one job each, plain text between them. Anything more is a bet that the FRQNCY harness will outgrow Unix, and there's no evidence in 2026 that it will.

## Counter-argument

The honest objection comes from someone who's run an autonomous-agent system in production for a year — call her the **Platform Skeptic**. Her case:

> "Unix-native is a great phase-0 prototype and a terrible production stance. The moment you have three loops competing for rate-limit budget, two PRs that touch the same file, and one loop that silently hangs at 4am, you need: a real scheduler with backoff, a lock manager, structured retry policies, alerting, and a dashboard your non-technical co-founder can read. `tail -f` doesn't page you when the loop has been emitting `tool_error` for six hours. The Huntley discipline is romantic; the on-call rotation is real. Build the boring infrastructure now, because by the time you discover you needed it, you've already shipped a broken PR to FRQNCY's production branch and lost a week of trust with your audience.
>
> Also: 'no config files' is a religion that lasts exactly until the second engineer joins. Markdown front-matter *is* a config schema — you've just hidden it in 14 different files where you can't validate it. JSON Schema with a real loader will save you a month of debugging in year two."

She's not wrong about year two. She's wrong about the order. **Build the Unix-native version first because it forces you to confront whether you actually have a scheduler problem, a lock problem, a paging problem.** Most "platform" needs disappear under three persistent loops with `gtr` isolation and stream-json logs. The ones that don't can be added — `harness-core` is small enough that bolting in a real retry policy or a lock manager is a weekend, not a quarter. The platform-first version locks in complexity *before you know what's load-bearing*. The Unix-native version forces you to earn every abstraction.

If, six months in, you have ten loops, two collaborators, and a real on-call rotation — Proposal 6's platform lens may genuinely be the right next step. But you'll have shipped six months of self-evolving FRQNCY by then, and you'll know exactly which parts of the platform you actually need.

That's the bet. Take it.
