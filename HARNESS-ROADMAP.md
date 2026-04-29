# FRQNCY Harness Roadmap (v2)

**Decision date:** 2026-04-28
**Supersedes:** the v1 of this file (which planned to build things already shipped in `frqncy-harness` v0.7.0-alpha.1)
**Author:** Synthesis of v0.7 reality + Marius's source set + 4 parallel research agents (April 28)
**Owner:** Orlando
**First job (locked):** Self-evolving FRQNCY — autonomous loops that extend FRQNCY itself, AND a harness that improves its own code via its own loops.

---

## Why this exists (and why v1 was wrong)

The first version of this roadmap was written from a position of not having looked. It planned an 18-week, 8-phase build that started from "Phase 0: write the budget cap and kill flag." All of it would have been redundant: `@frqncy-network/harness` is at **v0.7.0-alpha.1, 200+ tests passing**, with nine provider lanes, full tool surface, MCP client, hooks system, skills system, gtr+tempdir sandbox, never-compacted JSONL traces mirrored to a private GitHub repo, cost guardrails, lethal-trifecta gate, persistent agent REPL, trace replay+diff, and three active development worktrees. The cage is built. The body is built. **The thing missing isn't infrastructure — it's the closed loop that turns the harness into a system that improves itself.**

This v2 starts from where the harness actually is.

---

## What v0.7 actually ships (the picture you should hold in your head)

The harness is a TypeScript library + CLI that compresses TRAE's "Engineering Landmarks" into a single binary you can `npm link` and call from any directory:

| Engineering Landmark (from `harness.md`) | Where it lives in v0.7 |
|---|---|
| Tool Gateway | `bash`, `read`, `write`, `grep`, `glob`, `web_fetch`, `web_search` + MCP client |
| Call Interceptor | Hooks system (`pre-agent` / `post-tool-use` / `post-agent`); 5 bundled hooks |
| Feedback Assembler | `stream()` AsyncIterator with typed events; external-artifacts pattern in `agent` mode |
| Context State Manager | Never-compacted JSONL trace store at `~/.frqncy-harness/traces/<date>/<id>.jsonl` + `INDEX.jsonl`, mirrored to private GitHub; thread + project tagging; skills auto-injected by keyword/always matcher |
| Exception Handler | Cost guardrails ($5 soft / $25 hard, configurable); lethal-trifecta gate (warn/block); per-agent timeout |
| Sandboxed Execution | gtr worktree per agent run, with tempdir fallback when not in a git repo |
| Provider abstraction | Nine lanes — `anthropic` / `openai` / `google` / `openrouter` / `chutes` / `perplexity` / `claude-sdk` (API) + `claude-code` / `codex` (subprocess via Max & ChatGPT Pro subscriptions, $0 to the API budget) |

CLI surface: `chat`, `repl`, `agent`, `doctor`, `config`, `costs`, `mcp`, `auth`, `thread`, `traces`, `replay`, `skills`. Daily-use cheat sheet is in the harness folder at `CHEAT-SHEET.md`.

---

## The actual gap to self-improving FRQNCY

Reframed honestly, the gap is three properties the v0.7 harness doesn't have yet:

1. **A persistent outer loop that calls the harness on a schedule or until a completion-promise fires.** Today every `frqncy-harness agent ...` call is a one-shot. Ralph-style permanent looping is not in the CLI surface.
2. **A fitness signal the loop can optimize against.** PostHog isn't wired; there's no `harness fitness` command; the harness can write FRQNCY pages but has no way to know which were better.
3. **A self-extension loop that turns observed failures into harness improvements.** Hooks, skills, and traces all exist as substrate, but there's no command that reads recent traces, identifies recurring failure modes, and proposes a new hook/skill/test to prevent them. This is the literal "watch the loop, codify the fix" practice, productized.

**Three properties, three new subcommands, ~1000 LOC each. Two weeks of work, not 18.** Plus the optimizations and safety hooks that fall out of Marius's source set and the April-2026 research, which extend the existing surface rather than replace it.

---

## The roadmap (4 phases, ~6-8 weeks)

### Phase 1 — Persistent loop: `harness ralph` (Week 1)

The outer loop, finally. A new subcommand that wraps `agent` mode in a Ralph pattern.

```bash
harness ralph "draft a topic page on equanimity practice" \
  --until "build green && lighthouse > 90" \
  --max-iterations 25 \
  --thread topic-equanimity-001
```

- **Stop hook** (using the existing hooks system) checks the assistant's last message for the `--until` predicate (string match, regex, or shell-evaluated expression).
- If unmet, **re-invokes `agent` mode** in the same `--cwd`, with the same `progress.md` + `tasks.json` + git baseline — Anthropic's external-artifacts pattern continues across iterations naturally.
- Hard cap on `--max-iterations`; soft cap from the existing $5/$25 cost gate; hard exit on `kill.flag` touch.
- Every iteration appends to the existing JSONL trace — no schema changes needed.

**Why first:** This is the missing mechanism that turns the harness from "a CLI you invoke" into "a process you can leave running." Everything downstream depends on it.

**Done when:** A loop you didn't watch for 2 hours produces a draft PR you'd merge.

### Phase 2 — Self-extension: `harness reflect` + `harness codify` (Week 2)

The mechanism that closes the loop on Huntley's "watch the loop, codify the fix" practice. Two subcommands, complementary.

```bash
# Read the last N traces matching a thread/project tag, run a reflection prompt
harness reflect --thread frqncy-content --last 20 --output proposals/reflection-2026-04-28.md

# Take a single failure trace and turn it into a regression test
harness codify <trace-id> --output test/regression/<short-slug>.test.ts
```

- `reflect` is a normal `agent` invocation with a system prompt that instructs: *"Read these traces. Identify the 3 most recurring failure modes. For each, propose either (a) a new hook, (b) a new skill, (c) a system-prompt amendment, (d) a regression test. Output a Markdown proposal."*
- `codify` is the **single highest-leverage primitive in the entire roadmap.** It takes a trace ID and produces a vitest file that would catch the failure if it recurred. This is the discipline operationalized — every time you watch a loop fail, one command makes the fix permanent. The April 2026 research consensus (Microsoft Foundry, LangSmith) is unanimous: this is the meta-skill that compounds.
- Both write to disk; nothing auto-merges. You review.

**Why second:** Phase 1 makes the harness loop. Phase 2 makes the harness *learn from its own loops.* This is the threshold between "agent that writes pages" and "system that improves itself."

**Done when:** A regression test caught by `codify` prevents a real regression on a re-run of an old failed trace.

### Phase 3 — Fitness function: `harness fitness` + PostHog wiring (Weeks 3-4)

Now and only now do we wire FRQNCY-the-product into the loop. Until you have a fitness signal, "self-evolving" is just "self-iterating" — there's no direction.

- Add `posthog/*` provider lane keys to the auth store (one-time op).
- New subcommand: `harness fitness <page-slug>` — reads PostHog events for the page, computes a configurable fitness score (default: `F = 0.5·conversion + 0.3·time_on_page + 0.2·scroll_75`), prints with a 95% Bayesian credibility interval.
- Add `--fitness-gate <expr>` to `harness ralph` — the loop can now use fitness deltas as the `--until` predicate ("until fitness improves by 10% or 5 iterations").
- Cross-model brand-voice judge (a second `chat` call against a different provider lane) as a hard pre-PR gate — uses the existing `editorial-lint` bundled hook surface.

**Why third:** A fitness function without a working loop is a dashboard. A loop without a fitness function is a treadmill. The combination is the search algorithm.

**Done when:** The harness ranks two FRQNCY page variants by predicted fitness and the ranking matches a 7-day post-deploy A/B result.

### Phase 4 — Multi-instance + scheduled: tmux + cron (Weeks 5-6)

Parallelism, finally — but as orchestration over the existing `harness ralph`, not a new harness primitive.

- A small bash wrapper `bin/harness-fleet` that spawns N `harness ralph` processes in named tmux panes, each in its own gtr worktree, each from a row in `tasks/queue.tsv`.
- A launchd plist (macOS) or cron entry that fires `harness-fleet` on a schedule — every hour against the queue, top off to N=4-6 active panes.
- A new `harness top` TUI command that reads the active panes' JSONL logs and renders a `k9s`-style live status. Optional; nice-to-have.
- `tmux pipe-pane` redirects each pane's stream into a shared logs directory for centralized `tail -f | jq`.

**Why last:** Parallelism is leverage on a working single-loop. Building the orchestrator before the loop is solid produces N agents fighting each other; building it after produces N agents compounding.

**Done when:** Three loops run overnight, queue at most one PR conflict (resolved by hand), and morning shows three reviewable PRs.

---

## What this rejects from the v1 roadmap

- **Phase 0 "tripwires"** — already shipped (cost guardrails, lethal-trifecta gate, kill semantics via Ctrl+C in REPL/agent + the cost cap exit path). Don't rebuild.
- **Phase 1 "first useful loop"** — `harness agent` already runs single-shot useful loops. Phase 1 here is the *persistent* layer on top.
- **Phase 2 "genome and fitness"** — the genome (page-as-JSON-specimen) is overkill for FRQNCY's current shape. Use the existing markdown + frontmatter + Astro components and add fitness as a separate signal, not a data-model rewrite.
- **Phase 3 "tmux + gtr"** — gtr is already the harness sandbox. tmux orchestration is a Phase 4 wrapper, not a foundational rewrite.
- **Phase 5 "trace graph"** — the JSONL trace IS the graph in seed form. Layered indexing (Graphiti backed by Neo4j 5.26 Community Edition; FalkorDB as a perf escape hatch) is a v2 question gated on real volume; not a Q2 build.
- **Phase 6 "bandit-driven A/B"** — premature. FRQNCY's traffic doesn't support bandits yet. Human-gated merges + AgentA/B-style synthetic-user pre-filter (CMU/Adobe paper, arXiv:2504.09723) is the right substitute; revisit bandits at 10K+ weekly sessions.
- **Phase 7 "speciation"** — Huntley level-9 is a destination, not a Q2 target. Phase 2's `reflect` + `codify` is the actual entry point to self-evolution.

---

## What's net-new from the April 2026 research (folded into the phases)

These don't get their own phase — they extend the four phases above.

**From `rtk-ai/rtk` (cost reduction, fits Phase 1):**
- Add a `ToolResultFilter` interface in `src/tools/`. Default filters for `bash` (failure-focus, dedup-with-counts), `grep` (signatures-only), `read` (large-file truncation with tee). Each iteration of `harness ralph` runs cheaper.
- **Tee-on-failure** for any filtered tool output — write raw output to `<sandbox>/.tee/<ts>_<cmd>.log` and inject the path; agent retrieves via normal `read` if needed. Lossy-but-recoverable compression.
- `harness gain` — cost decomposition by tool, by filter, by lane. Turns the $5/$25 cap from a limit into a tunable.

**From `juliusbrussee/caveman` (eval discipline, fits Phase 2):**
- **Three-arm eval gate** — every new skill or system-prompt edit must beat both *(no-skill baseline)* AND *(generic terseness modifier)*. Bake into the test suite. Catches the 80% of "improvements" that are placebos.
- `harness compress-memory` — rewrite stable inputs (CLAUDE.md, persona blocks, MCP tool descriptions that load every turn) into token-efficient form, keep `<file>.original.md` sidecars, hash-link the two so edits trigger recompression. Pays for every iteration forever.

**From the official Anthropic Skills + Hooks docs (compatibility, fits Phase 1):**
- Adopt the **JSON output decision protocol** verbatim: hooks emit `{"decision": "block"|"approve", "reason": "...", "hookSpecificOutput": {...}}` on stdout, with **exit 2 = blocking + stderr-as-feedback** semantics. Highest-compatibility, lowest-cost change.
- Add `allowed-tools` and `disable-model-invocation` to skill frontmatter. Schema-compatible with Anthropic; the harness's `always` flag stays as an opinionated extension.
- Expand hook lifecycle minimally: add `UserPromptSubmit`, `SessionStart`, `SessionEnd`, `PreCompact`. The last is the harness's "never-compacted" claim made provable.

**From the April 2026 self-improvement state of the art (safety, fits Phase 2):**
- **Inoculation prompting** (Anthropic Nov 2025): every `harness reflect` and `evolve` invocation gets one system-prompt sentence explicitly naming reward-hacking as a known anti-pattern. Single most counterintuitive and load-bearing safety hook. The Nov 2025 paper showed 75-90% reduction in misalignment generalization even when reward-hacking rates exceed 99%.
- **Voice-anchor hook** — persona-embedding check; refuse self-edits that move the canonical anchor more than threshold distance. Defends against the silent voice-drift documented across the multi-agent lineage research.
- **Rubric-anchor hook** — pin the constitutional rubric file to a Git ref the agent cannot rewrite; rubric edits go through human PR review. The agent-edits-its-own-rubric pattern is the highest-risk operation in the whole self-improvement stack (per the Anthropic reward-hacking paper).

**From the 30-day platform updates (positioning):**
- Track Claude Agent SDK V2 TS preview; evaluate switching the `claude-sdk` lane to V2 once `forking` parity lands. Today V2 is unstable; keep both V1 and V2 paths.
- Anthropic Managed Agents ($0.08/session-hour, public beta) is the hosted competitor — the harness's $0 subscription paths (`claude-code/*`, `codex/*`) plus the never-compacted local trace store are the differentiators. No code changes; ride the gap.
- Google's A2A v1.0 protocol is now production-ready at 150 enterprises. Defer adoption — outbound A2A is a v2 surface, not a current need.

---

## What's coming later (the down-the-roads, with trigger criteria)

| When | What | Trigger |
|---|---|---|
| **v0.8 (next sprint)** | DSPy + GEPA prompt-optimizer plug-in | After Phase 2 produces ≥50 traces with fitness scores |
| **v0.9** | Graphiti + Neo4j 5.26 Community Edition as the trace's read-side projection | When trace store >500MB OR Phase 2 `reflect` queries can't be answered by JSONL grep |
| **v0.9** | A2A v1.0 outbound surface | When a second tool/team needs to call FRQNCY's harness |
| **v1.0** | Public release as `@frqncy-network/harness 1.0` | After Phase 4 stable + at least one non-Orlando contributor |
| **v1.1** | Voyager-style auto-skill library (skill-folder evolution per `EvoSkill`) | When `harness reflect` proposes the same skill 3+ times |
| **v2** | LiteLLM proxy + monorepo split into core / plugin / Cowork wrapper | When a second app calls the harness in production |
| **v2** | Python sidecar (DSPy + GRPO + Inspect AI) for trace optimization | When trace volume justifies fine-tuning a specialist |
| **v3** | Capacitor / AG-UI surface | When FRQNCY product surfaces need agent UX |
| **v3** | Huxley-Gödel-Machine archive of harness-itself agents | When self-extension produces 5+ candidate hook/skill PRs/week |

---

## The one-paragraph why

The harness as it stands at v0.7 is already the rarest thing in the 2026 agent market: a battle-tested, multi-provider, never-compacted, sandboxed TS package that one engineer can hold in their head. Meta paid $2B for Manus's harness and got blocked by China; Fowler canonized the discipline; Sequoia called the harness layer where founders compete. **You already have that layer.** The work in front of you isn't building it — it's closing the three loops that turn it from a tool you use into a system that uses itself: the persistent loop (Phase 1), the failure-codification loop (Phase 2), and the fitness loop (Phase 3). Phase 4 is leverage on those three.

---

## Your Monday

If Monday is a coding day, the literal first commit is on **Phase 1** in the harness repo:

1. Create `src/commands/ralph.ts` — wraps `agent` mode in a stop-hook re-injection pattern with `--until`, `--max-iterations`, `--thread` flags.
2. Add `RalphStopPredicate` evaluator to `src/stream.ts` — string match, regex, or shell-evaluated expression.
3. Wire into `src/cli.ts` with HELP block.
4. Add `test/ralph.test.ts` — three test cases (string match halts, max iterations halts, kill.flag halts).
5. Update `README.md` and `CHEAT-SHEET.md` with the new subcommand.

By Friday: `harness ralph "draft a topic page on equanimity" --until "build green && lighthouse > 90" --max-iterations 10` runs end-to-end against FRQNCY, produces a draft PR you can merge.

The companion plan with concrete optimization details lives at [`/Users/orli/Documents/Claude/Projects/frqncy-harness/proposals/SELF-IMPROVING-HARNESS.md`](../frqncy-harness/proposals/SELF-IMPROVING-HARNESS.md). Read both. The roadmap is the *what*; the optimization plan is the *how*.

---

**Decision:** This roadmap.
**Owner:** Orlando.
**Next action:** `src/commands/ralph.ts`, day 1.
**v1 of this file:** archived in git history; do not consult — it was written before the audit and plans against the wrong baseline.
