# Proposal 1: Ship It

## Core thesis (1 sentence)

Build a 400-line TypeScript ralph loop on top of `@anthropic-ai/claude-agent-sdk`, run it under tmux against a git worktree of FRQNCY this week, and let the first useful loop — a "topic page generator + Lighthouse linter" — earn the right to grow into anything more clever.

## Lens

Smallest possible CLI that ships in 7-14 days. Every line of architecture you write before a real loop is running on real FRQNCY content is speculative — it's solving a problem you haven't actually hit yet. The win condition is not "elegant harness"; it's "Orlando merges a PR on Friday that an autonomous loop authored on Wednesday." Bias toward Anthropic's official Claude Agent SDK, copy `pi-mono`'s JSONL session format verbatim, and treat tmux + git worktrees as the runtime. If a feature isn't required for the first useful loop, it's a Phase 4 problem.

## Phases

### Phase 0: Single-file ralph loop (Days 1-2)

- **What to build:** One file at `harness/ralph.ts` (~150 LOC). Uses `query()` from `@anthropic-ai/claude-agent-sdk` (npm published 4 days ago, version 0.2.119) with a Stop hook that reads the assistant's last message, looks for `<promise>DONE</promise>`, and if not present re-injects the original prompt up to `--max-iterations 25`. Dump every turn to `./sessions/<runId>.jsonl` with `{id, parentId, ts, role, content, toolCalls}` — the exact pi-mono shape, no schema invention.
- **Why:** This is the minimum viable harness. The Ralph Wiggum plugin Anthropic ships proves the pattern works; we're not innovating on the loop, we're owning it so we can mutate it. JSONL on disk gives us the "context graph" for free — `jq` is the dashboard for week one.
- **Dependencies:** `@anthropic-ai/claude-agent-sdk` (or the V2 preview if you want `await using session`), `node 22`, `tsx` for run-without-build, an `ANTHROPIC_API_KEY`. Nothing else.

### Phase 1: One useful task on FRQNCY (Days 3-5)

- **What to build:** A single concrete loop: `topic-page-generator`. Input is a row in `harness/tasks/topics.tsv` (slug, h1, audience, source-essay-path). Output is a new `.astro` file under `src/pages/practitioners/` plus an entry in the navigation. The agent runs with `--allowed-tools Read,Edit,Write,Bash(npm run build),Bash(npm run lighthouse)` and a `CLAUDE.md` at the repo root that codifies FRQNCY's voice ("consciousness/practitioner content, no startup-bro register, em-dashes welcome"). Stop condition: `npm run build` exits 0 AND Lighthouse Performance >= 90. If either fails, the failure output is the next iteration's prompt.
- **Why:** This is the smallest loop that makes FRQNCY tangibly bigger. It exercises Perceive (read existing pages), Plan (draft outline), Act (write file), Feedback (build + Lighthouse) — the full PPAF cycle on a real artifact. Once this works once, the same shape generalizes to A/B variants, internal-link rewrites, schema.org additions, etc.
- **Dependencies:** Phase 0 done. A working `npm run build` on FRQNCY (already exists). `@lhci/cli` for Lighthouse-as-a-feedback-channel. A 30-line `CLAUDE.md` written in your voice — copy a few paragraphs from your saved essays as exemplars.

### Phase 2: tmux + worktree multiplexer (Days 6-8)

- **What to build:** A 60-line bash script `harness/spawn.sh` that takes a task file, runs `git worktree add ../frqncy-loops/<runId> -b loop/<runId>`, opens a new tmux window named `<runId>`, and execs `tsx harness/ralph.ts --task tasks/<file> --workdir ../frqncy-loops/<runId>` inside it. Plus a `harness/merge.sh` that runs `npm run build && npm run lighthouse` in the worktree, and on green opens a draft PR via `gh pr create`. No fancy orchestrator — `tmux ls` is the dashboard, `tmux attach -t <runId>` is the debugger.
- **Why:** This is where "self-evolving" stops being theoretical. Three loops run in parallel without stepping on each other's `src/`. You get to watch them in real time. The pattern is documented in 2026 by Sho Ito and `raine/workmux` and is what Anthropic's own `agent-teams` doc recommends for non-experimental use. Skip Anthropic's experimental Agent Teams feature for now — the shared task list is appealing but it's flagged experimental and binds you to their mailbox abstraction. tmux is forever.
- **Dependencies:** Phase 1 working. `git`, `tmux`, `gh` CLI (already installed if you use GitHub). Decide on a worktree location outside the FRQNCY repo (e.g., `~/frqncy-loops/`).

### Phase 3: A second loop type + cron (Days 9-11)

- **What to build:** A `conversion-experiment` loop that: reads `src/pages/index.astro`, generates a B-variant of the hero, drops it behind a `?v=b` query-string check (PostHog feature flag wiring is one Edit), commits, opens a PR. A `cron` (or `launchd` plist, given macOS) that fires `harness/spawn.sh` once an hour against any unprocessed row in `tasks/queue.tsv`. The queue is just a file. You add rows by hand for now.
- **Why:** Two loops and a heartbeat is the threshold where "self-evolving FRQNCY" stops being aspirational and starts being a thing you have to keep up with. Cron-against-a-file-queue is dumb on purpose — no orchestrator service to maintain, no daemon to restart, every input is grep-able and every output is a PR you review.
- **Dependencies:** Phase 2. A PostHog account (free tier works). 5 minutes of `crontab -e`.

### Phase 4: Whatever you actually need (Days 12+)

- **What to build:** Now and only now do you start adding things from harness.md you haven't needed yet. Candidate list, ranked by likelihood you'll actually want it: (a) a tiny SQLite `runs.db` mirror of the JSONL so you can `SELECT` across runs, (b) a budget guardrail in the PreToolUse hook that aborts if `result.usage.total_tokens` for the run exceeds N, (c) a `harness/eval.ts` that replays a JSONL session against a different model to measure regression, (d) a Slack webhook on Stop, (e) Anthropic's experimental Agent Teams once it leaves preview.
- **Why:** Every item in this list is a real feature in the harness.md corpus. Every one of them is also a tax you don't have to pay until a loop you're actually running tells you to. The Mitchell Hashimoto rule applies: "anytime you find an agent makes a mistake, you take the time to engineer a solution such that the agent never makes that mistake again" — not before.
- **Dependencies:** Two weeks of running real loops, with a list of actual failures to point at.

## Trend research (with this lens)

1. **Claude Agent SDK is the pragmatic substrate, and it's in active flight.** The package `@anthropic-ai/claude-agent-sdk` was renamed from `claude-code-sdk` in late 2025 and is shipping fast — version 0.2.119 was published four days ago with SessionStore parity, top-level `skills` config, and OpenTelemetry support behind an `[otel]` extra. This is the SDK you build on. The V2 preview interface (`unstable_v2_createSession` with separate `send()`/`stream()`) removes async-generator gymnastics and is the right bet for a multi-turn loop. Source: [Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview), [@anthropic-ai/claude-agent-sdk on npm](https://www.npmjs.com/package/@anthropic-ai/claude-agent-sdk), [TypeScript V2 preview](https://platform.claude.com/docs/en/agent-sdk/typescript-v2-preview), [SDK release notes](https://github.com/anthropics/claude-agent-sdk-python/releases).

2. **Anthropic ships an official Ralph Loop plugin — copy its shape, don't depend on it.** `claude-code/plugins/ralph-wiggum` and the hosted `claude.com/plugins/ralph-loop` use a Stop hook that blocks exit and re-injects the prompt unless the agent emits a `<promise>DONE</promise>` token, with `--max-iterations` as the actual safety mechanism (the docs explicitly warn the completion promise uses fragile exact string matching). For a Ship-It harness, the right move is to write your own ~30-line Stop hook against the SDK's `Stop` event — which is officially documented — rather than ride on the plugin runtime, because you'll want the loop programmable from a script, not invoked from inside Claude Code's TUI. Source: [Ralph Wiggum plugin README](https://github.com/anthropics/claude-code/blob/main/plugins/ralph-wiggum/README.md), [Ralph Loop plugin page](https://claude.com/plugins/ralph-loop), [Hooks reference](https://platform.claude.com/docs/en/agent-sdk/hooks).

3. **tmux + git-worktree is the de facto parallel runtime in 2026 — and the tooling is still small enough to copy in a day.** Sho Ito's Mar 2026 Medium piece, `raine/workmux`, MindStudio's playbook, and Adam Wulf's `IttyBitty` all describe the same pattern: one Claude per worktree, one worktree per tmux window, shared `CLAUDE.md` for guardrails, independent PRs. Practitioners report 5-6 instances reliable, 10+ with a thin orchestration layer. Anthropic's own Agent Teams docs concede that for non-experimental use the worktree+tmux pattern is what you want. Source: [Parallel Coding Agents with Git Worktree x tmux](https://medium.com/@sean0628/parallel-coding-agents-with-git-worktree-x-tmux-be2a5a290f18), [raine/workmux](https://github.com/raine/workmux), [MindStudio: Parallel agentic dev playbook](https://www.mindstudio.ai/blog/parallel-agentic-development-git-worktrees), [IttyBitty](https://adamwulf.me/2026/01/itty-bitty-ai-agent-orchestrator/), [Agent teams docs](https://code.claude.com/docs/en/agent-teams).

4. **`pi-mono`'s JSONL-tree session is the smallest thing worth copying for the "context graph."** Mario Zechner's pi stores entire sessions as one JSONL file where every entry has `id` + `parentId` — branching happens in place via `/tree` without spawning new files. RPC mode is LF-delimited JSONL, period. This is exactly the durable decision-trace harness.md asks for, and it's ~zero infrastructure. Don't build a Postgres-backed event store on day one when one append-only file gives you the same DAG with `jq` as your query language. Source: [pi-mono coding-agent README](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/README.md), [pi-mono session.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/session.md).

5. **Mitchell Hashimoto's harness-engineering rule maps cleanly onto an `AGENTS.md` file that grows one rule per failure.** Hashimoto's framing — "anytime you find an agent makes a mistake, take the time to engineer a solution such that the agent never makes that mistake again" — is operationalized in the wild as an `AGENTS.md` (or `CLAUDE.md`) at the repo root that gains exactly one bullet every time a loop produces a bad PR. This is the lowest-effort, highest-yield harness you can run. Augment Code and Martin Fowler both back this concretely in 2026 writeups. Source: [Mitchell Hashimoto: My AI Adoption Journey](https://mitchellh.com/writing/my-ai-adoption-journey), [Harness engineering for coding agent users (Fowler)](https://martinfowler.com/articles/harness-engineering.html), [Augment: Harness Engineering for AI Coding Agents](https://www.augmentcode.com/guides/harness-engineering-ai-coding-agents).

6. **Astro is now an agent-friendly content surface, which makes the FRQNCY use case unusually tractable.** Astro 6 ships agent-aware tooling: `astro-flyweb` exposes a `.well-known/flyweb.json` for content discovery, `astro-llm` produces a deterministic build-time context file, and Astro Inline Review explicitly bridges human reviewers and coding agents. PostHog has a tutorial for A/B tests in Astro that's straight wiring. Translation: a topic-page-generator loop and a hero-variant loop are essentially "write a `.astro` file + flip a flag" — small enough to do in a single ralph iteration. Source: [What's new in Astro - Feb 2026](https://astro.build/blog/whats-new-february-2026/), [Build with AI tools (Astro docs)](https://docs.astro.build/en/guides/build-with-ai/), [PostHog: A/B tests in Astro](https://posthog.com/tutorials/astro-ab-tests).

## Top 3 risks of this approach

1. **The first useful loop won't be useful enough.** A topic-page generator that produces mediocre pages is worse than no pages — it dilutes FRQNCY's voice and you become the bottleneck reviewing slop. Mitigation: gate every PR behind your manual merge, treat the first 10 PRs as a calibration set, and add one rule to `CLAUDE.md` per rejected PR. Don't merge anything you wouldn't have merged from a junior writer.

2. **YAGNI now means rework later.** Skipping the SQLite/observability/budget layer gets you running this week but means at run #200 you're grepping JSONL files to figure out what happened, and at run #500 you've burned $400 on a runaway loop because there was no budget cap. Mitigation: token budget is a 5-line PreToolUse hook (the SDK supports it natively); add it on day 4, not day 14. Defer everything else.

3. **Anthropic deprecates or restructures the SDK under you.** The package was renamed from `claude-code-sdk` to `claude-agent-sdk` in late 2025; V2 is in preview right now. If you build directly on `unstable_v2_createSession` it can move. Mitigation: keep all SDK calls behind a single 20-line `harness/llm.ts` wrapper. The whole point of the Ship-It approach is that swapping providers or SDK versions is a one-file diff, not a refactor.

## Why this wins (vs. the obvious alternative)

The obvious alternative is the "build the harness first" roadmap: spend 4-6 weeks designing a Tool Gateway, Call Interceptor, Feedback Assembler, Context State Manager, and Exception Handler as separate modules with clean interfaces, *then* run a loop on top. That proposal will be elegant. It will read like a real system. It will also not have produced a single autonomous PR against FRQNCY by the time this proposal has produced 50.

Three reasons Ship-It wins:

- **The harness specs in harness.md are extracted from systems that already shipped.** Pi, Anthropic's Ralph plugin, Agent Teams, the gtr+tmux pattern — none of them were designed in advance, all of them were carved out of running loops. Trying to design the equivalent up-front, before you've felt where the rough edges are, is the exact "premature abstraction" failure mode the source documents themselves warn about.
- **Self-evolving FRQNCY is a content-rate problem, not an architecture problem.** The scarce thing isn't loop sophistication; it's the queue of well-specified tasks for the loop to execute. A 400-line ralph that runs 20 times this month produces more compounding value than a 4000-line harness that runs once next quarter, because each merged PR feeds the corpus the next loop reads from.
- **You can throw it away.** Everything in Phase 0-3 is replaceable in a weekend. The JSONL sessions are forward-portable to any future harness. The `CLAUDE.md` rules are forward-portable to any future model. The tmux+worktree pattern is forward-portable to any future runtime. Ship-It is not a commitment — it's a week of reconnaissance against a real target.

## Counter-argument

The honest counter-argument comes from the Reliability/Security camp of harness.md (the R.E.S.T. framework: Reliability, Efficiency, Security, Traceability). They would say:

> "You're describing a loop that writes files, runs `npm run build`, and opens PRs against a public marketing site, with a 5-line token guard added on day 4 if you remember. There's no sandboxed execution — the agent gets `Bash(npm run build)` and that's a foothold. There's no I/O filtering — the agent ingests source essays that could contain prompt-injection payloads. There's no auditable state beyond JSONL files on your laptop. You're skipping idempotency and fault recovery entirely. The first time a loop runs at 3am while you're asleep and burns through $200 of tokens regenerating `index.astro` 80 times because of a flaky Lighthouse run, you'll wish you'd built the Exception Handler and Budget Manager first. 'Ship It' is fine for a hackathon; for an autonomous system that touches a production site, it's reckless."

That argument is correct on the substance and wrong on the timing. The right response is: every concern they raise is real, and every one of them is a 50-line addition to a working loop, not a precondition for starting. PreToolUse budget hook, sandboxed worktree (already in Phase 2), prompt-injection filter on essay ingestion, draft-only PRs (no auto-merge ever) — each is a Phase 4 feature triggered by a specific incident. The wrong response is to build all of them speculatively against a loop that doesn't exist yet, because then you'll discover that the actual failure mode was something else entirely, and you've spent two weeks fortifying against the wrong threat model. Ship It says: be reckless about *velocity*, but never about *blast radius*. Worktree-only, draft PRs, manual merge, hard iteration cap — those four constraints alone make the "reckless" critique mostly theoretical for the first month.

Sources:
- [Agent SDK overview - Claude API Docs](https://platform.claude.com/docs/en/agent-sdk/overview)
- [@anthropic-ai/claude-agent-sdk on npm](https://www.npmjs.com/package/@anthropic-ai/claude-agent-sdk)
- [TypeScript V2 preview](https://platform.claude.com/docs/en/agent-sdk/typescript-v2-preview)
- [Hooks reference](https://platform.claude.com/docs/en/agent-sdk/hooks)
- [Ralph Wiggum plugin README](https://github.com/anthropics/claude-code/blob/main/plugins/ralph-wiggum/README.md)
- [Ralph Loop plugin page](https://claude.com/plugins/ralph-loop)
- [Parallel Coding Agents with Git Worktree x tmux (Sho Ito)](https://medium.com/@sean0628/parallel-coding-agents-with-git-worktree-x-tmux-be2a5a290f18)
- [raine/workmux](https://github.com/raine/workmux)
- [MindStudio: Parallel agentic dev playbook](https://www.mindstudio.ai/blog/parallel-agentic-development-git-worktrees)
- [IttyBitty (Adam Wulf)](https://adamwulf.me/2026/01/itty-bitty-ai-agent-orchestrator/)
- [Agent teams docs](https://code.claude.com/docs/en/agent-teams)
- [pi-mono coding-agent README](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/README.md)
- [pi-mono session.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/session.md)
- [Mitchell Hashimoto: My AI Adoption Journey](https://mitchellh.com/writing/my-ai-adoption-journey)
- [Harness engineering for coding agent users (Fowler)](https://martinfowler.com/articles/harness-engineering.html)
- [Augment: Harness Engineering for AI Coding Agents](https://www.augmentcode.com/guides/harness-engineering-ai-coding-agents)
- [What's new in Astro - Feb 2026](https://astro.build/blog/whats-new-february-2026/)
- [PostHog: A/B tests in Astro](https://posthog.com/tutorials/astro-ab-tests)
- [mini-coding-agent (rasbt)](https://github.com/rasbt/mini-coding-agent)
