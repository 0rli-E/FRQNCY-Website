# FRQNCY Harness — Plan & Decisions

Architectural plan for `@frqncy/harness`, the plug-and-play LLM harness that powers FRQNCY's agent surfaces and Orlando's daily workflow. Companion docs: [harness.md](../harness.md) (the four-essay corpus + tooling notes) and [HARNESS-RESEARCH-NOTES.md](./HARNESS-RESEARCH-NOTES.md) (the five-agent research dump).

Last updated: 2026-04-26.

---

## Locked decisions (v0)

These three are committed. Down-the-road plans noted explicitly so we don't lose them.

### 1. Form factor — Standalone TypeScript package + CLI

**v0 commit:** Single npm package `@frqncy/harness`, importable as a library and runnable as a CLI binary (`frqncy-harness`). Install once globally for CLI use, or add as a dependency to any TS project.

**→ Down the road (v2):** Promote to a monorepo. Thin shared core, then expose three surfaces:
1. The standalone npm package + CLI (already exists from v0)
2. A Cowork plugin wrapper (`.plugin` bundle) so it's installable in Cowork mode
3. An import inside the FRQNCY codebase itself (Astro, Capacitor, social-src) for product features

The monorepo move only happens once the standalone package is paying its way — i.e., we have validated the core loop, we have at least one real consumer beyond the CLI, and we have a concrete reason to add a second surface.

**Why not now:** Monorepo plumbing (workspaces, build pipeline, internal versioning) is real upfront work. Easy to over-engineer before the core is validated. The standalone package can be wrapped into a plugin later in ~10 lines.

---

### 2. Language and runtime — TypeScript-first

**v0 commit:** Pure TypeScript. Vercel AI SDK v5 as the underlying provider abstraction. Targets Node 20+ and Cloudflare Workers (the harness should run wherever FRQNCY runs).

**→ Down the road (v2 or later):** Add a Python sidecar for training and evals only — DSPy weekly trace optimization, Inspect AI safety evals, GRPO/Atropos for distilling hot-path subagents into small specialist models. The sidecar runs as a periodic batch job (Modal cron), never on the request path. The TS harness stays the canonical runtime.

**Why not now:** Two languages from day one is twice the build/deploy plumbing. The Python ecosystem advantage only matters once we're optimizing on real trace data — and we have no traces yet. Defer until a Python tool is unambiguously paying for itself.

---

### 3. Provider strategy — Direct SDKs + OpenRouter

**v0 commit:** Native first-party SDKs for tier-1 providers, OpenRouter for the long tail.
- `@ai-sdk/anthropic` — Claude (with prompt caching enabled by default)
- `@ai-sdk/openai` — GPT (Responses API)
- `@ai-sdk/google` — Gemini (context caching)
- `@openrouter/ai-sdk-provider` — Hermes 4, Llama, DeepSeek, Qwen, anything else worth trying
- API keys held as environment variables; harness reads them lazily so unused providers don't require keys

**→ Down the road (v2):** Drop in a **LiteLLM proxy** as a single Docker container that fronts all of the above. Get unified observability, virtual keys, centralized cost tracking, and cross-provider fallbacks in one place. The harness stays the same — it just points its OpenAI-compatible adapter at the LiteLLM endpoint instead of calling providers directly.

The trigger to add LiteLLM: the moment a second application is calling the harness in production, *or* the moment we want centralized cost dashboards + virtual API keys for sharing access.

**Why not now:** One more piece of infra to maintain. Until there's a second consumer, the harness can talk to providers directly.

**Anti-pattern explicitly avoided:** routing 100% through OpenRouter "for uniformity." That move costs ~30–40% of tier-1 capability — most importantly Anthropic prompt caching, which is the difference between a $200/mo and $2,000/mo bill at FRQNCY's likely scale (long stable system prompts about editorial standards, the topic graph, brand voice).

---

## Down-the-roads index (one place to find them all)

| When | What | Why we deferred |
|---|---|---|
| **v2** | Promote standalone → monorepo (3 surfaces: npm CLI / Cowork plugin / FRQNCY embed) | Wait for a second real consumer |
| **v2** | Drop in LiteLLM proxy in front of all providers | Wait for second app or shared cost dashboards |
| **v2 or later** | Python sidecar (DSPy / Inspect AI / GRPO) for training + evals | Wait until we have trace data worth optimizing |
| **v2 or later** | Bi-temporal memory (Graphiti / Zep) | Wait until v0 memory layer is proving inadequate |
| **v2 or later** | MCP server exposing FRQNCY content (search.json + resources.json + explore graph) | Independent project; can ship in parallel |
| **v3** | DSPy + GRPO trace-distillation pipeline (hot-path 3B specialist) | Needs real volume to justify |
| **v3** | Voyager-style skill library (agent writes its own tools, indexed in Supabase pgvector) | Needs the v2 memory layer first |
| **v3** | AG-UI Protocol surface for the Capacitor app | Needs the FRQNCY product surfaces to exist as agent surfaces |

---

## More locked decisions (added 2026-04-26 second round)

### 4. Anthropic authentication — API key only ⚠️ REVISED 2026-04-26

**Original v0 commit (REVOKED):** Harness uses the OAuth flow Claude Code uses, piggybacking on the Claude Max subscription.

**Why revoked:** Web research on 2026-04-26 surfaced Anthropic's updated *Authentication and credential use* policy: *"OAuth authentication is intended exclusively for Claude Code and Claude.ai, and using OAuth tokens obtained through Claude Free, Pro, or Max accounts in any other product, tool, or service is not permitted and constitutes a violation of the Consumer Terms of Service."* Implementing OAuth-against-Claude-Max in a third-party tool like `@frqncy/harness` would put the user in ToS violation. Not shipping it.

**Revised v0 commit:** Harness uses standard `ANTHROPIC_API_KEY` authentication. Keys are obtained from console.anthropic.com (Claude Max users *also* have an API console; usage there is billed against API credits, not the Max subscription's bundled chat usage).

The harness's `auth set anthropic <key>` stores keys at `~/.frqncy-harness/auth/keys.json` (mode 0600) as a stepping stone over per-shell `export ANTHROPIC_API_KEY=...`.

**Down the road:** If Anthropic publishes a B2B OAuth flow (e.g., for organization/team API access that explicitly permits third-party clients), wire that. For now, API key is the only legitimate path.

**Cost reality check:** Claude Max ($200/mo) gives generous chat usage on claude.ai + Claude Code, but API access is *separate* and billed at standard per-token rates. The harness uses API access. Plan accordingly via cost caps (decision 10) and prompt caching (decision A9).

### 5. Sandbox — gtr worktree per agent run

**v0 commit:** Each `agent` invocation creates a temporary git worktree via the gtr CLI, cleaned up on exit. Filesystem-isolated, ~100ms cold start, free.

**Down the road (v2):** Swap to E2B microVMs when product surfaces start running agents on user-supplied prompts (one provider change in the sandbox abstraction).

### 6. Tool surface — bash + file + web + MCP client

**v0 commit:** `bash`, `read`/`write`/`grep`/`glob`, `web_fetch`/`web_search`, plus an MCP client that auto-loads any servers declared in `mcp.json`. Total ~700-800 LOC.

**Down the road:** Skills system (Hermes-style auto-generated Markdown procedures) in v2; Voyager-style self-writing skill library in v3.

### 7. Trace storage — local JSONL + private GitHub repo

**v0 commit:**
- Local working dir: `~/.frqncy-harness/traces/<YYYY-MM-DD>/<conversation-id>.jsonl` (one file per conversation, date-partitioned)
- Plus `~/.frqncy-harness/traces/INDEX.jsonl` — one row per conversation with summary metadata (ts, model, cost, message count, status) — gives the "one big file across everything" view
- `~/.frqncy-harness/traces/` is itself a git repo with remote `github.com/0xOrli/frqncy-harness-traces` (private)
- Auto-commit at end of each conversation; `frqncy-harness sync` to manually flush; `--auto-push` config flag for continuous sync
- **Hard guarantee: no in-context summarization that loses detail. Trace data is the source of truth and is never compacted.**

**Down the road (v2):** Optional Supabase mirror when FRQNCY product code needs to query traces from the website backend. The GitHub repo stays the canonical store.

### 8. In-context handling when window fills — halt and resume via progress.md

**v0 commit:** When model context exceeds 80% of provider max, the harness halts and prints: *"session full, start a new agent with `--resume <id>` to continue from progress.md"*. No automated summarization that would lose detail.

**Why:** Trace data is sacred (decision 7). The Anthropic external-artifacts pattern (decision 9) provides the cross-session continuity bridge.

### 9. External artifacts — full Anthropic pattern in v0 agent mode

**v0 commit:** When `agent` mode runs, harness scaffolds:
- `init.sh` (env setup, dependencies)
- `progress.md` (append-only log of every step + reasoning)
- `tasks.json` (prompt decomposed into testable items, status tracked)
- Baseline git commit at run start

Every agent step appends to `progress.md` and updates `tasks.json`. Cross-session resume reads these files to reconstruct context. Aligns with Anthropic's Nov 2025 *Effective harnesses for long-running agents* essay.

### 11. Daemon / multi-platform gateways — package the harness as a Hermes Agent skill

**v0 commit:** Don't build a daemon ourselves. Ship `@frqncy/harness` as the focused TS CLI + library. **Plus** a `hermes-skill.md` file in the repo that documents how to install the harness as a Hermes Agent skill (Markdown procedure that shells out to `frqncy-harness ...`).

This means the harness has **two deployment surfaces** from v0:
1. **Standalone CLI / library** (primary) — `npm install -g @frqncy/harness`, used directly from terminal or imported into TS code
2. **Hermes Agent skill** (secondary) — a Markdown skill file that lives inside a Hermes Agent installation; Hermes provides Telegram / Discord / Slack / SMS / Email gateways for free; when a message arrives at any gateway, Hermes invokes the skill which shells out to the harness CLI

**Why:** Building Telegram/Discord/Slack/Email gateways into v0 directly would add 1500-2500 LOC and delay first usable version by 3-5 weeks. Hermes Agent (Nous Research, MIT-licensed, self-hostable on a $5 VPS) already does the daemon and multi-platform plumbing. Wrapping the harness as a Hermes skill gets daemon behavior in days, with the harness staying fully self-contained.

**Down the road (v3+):** If the Hermes dependency becomes load-bearing in unhelpful ways, build a native daemon (`frqncy-harness daemon`) that replicates the Hermes gateway pattern. But probably never — Hermes is the right shell for this job.

### 10. Cost guardrails — $5 soft warn / $25 hard abort per conversation

**v0 commit:** Defaults configurable via `frqncy-harness config set costCap.softWarn 10` and `costCap.hardAbort 50`. Soft warn prints to stderr; hard abort kills the loop and writes a final trace row with `status: "aborted_cost_cap"`.

**Why:** Claude Max + cheap models means everyday cost is near zero — the caps are a runaway-bug safety net, not a usage policy.

---

## v0 scope — to be confirmed

Proposed shape of the first working version (~500 LOC, single weekend to build):

### Package surface

```typescript
import { harness } from '@frqncy/harness';

// One-shot chat — model is just a string, swap freely
const reply = await harness.chat({
  model: 'anthropic/claude-sonnet-4-6',  // or 'openai/gpt-5', 'google/gemini-2.5-pro', 'openrouter/nousresearch/hermes-4-405b'
  messages: [{ role: 'user', content: 'hi' }],
});

// Streaming
for await (const chunk of harness.stream({ model, messages })) { /* ... */ }

// Agent loop (tools, multi-step)
const result = await harness.agent({
  model,
  system: '...',
  messages,
  tools: { bash: bashTool, read: readTool, write: writeTool },
  stopWhen: stepCountIs(20),
});
```

### CLI surface

```bash
# One-shot ad-hoc chat (reads from stdin or flag)
frqncy-harness chat --model claude "summarize this: ..."

# Interactive REPL — pick model on the fly with /model
frqncy-harness repl

# Agent mode — runs an agent loop with bash tool in a sandbox
frqncy-harness agent --model gpt-5 "fix the typo in src/index.ts"
```

### What's in v0

- **Provider abstraction:** Anthropic / OpenAI / Google native + OpenRouter for everything else
- **Streaming + non-streaming chat**
- **Tool calling** with Zod-typed tool definitions
- **Single bundled tool: `bash`** (executed in a sandboxed worktree per gtr-style isolation)
- **Conversation persistence:** simple JSONL log per conversation under `~/.frqncy-harness/conversations/`
- **Prompt caching:** auto-enabled for Anthropic when system prompt > 1024 tokens
- **CLI:** `chat`, `repl`, `agent` commands
- **Tests:** vitest suite covering the provider-swap matrix (every provider × every operation)

### What's deliberately NOT in v0

- ❌ Persistent semantic memory (mem0 / Graphiti / Zep) — v2
- ❌ Skills system (Hermes-style auto-generated Markdown procedures) — v2
- ❌ Eval harness (Inspect AI integration) — v2
- ❌ MCP server exposing FRQNCY content — separate project
- ❌ DSPy / GRPO / fine-tuning — v3
- ❌ Cowork plugin wrapper — v2
- ❌ Embedded in FRQNCY product — v2
- ❌ LiteLLM proxy — v2
- ❌ AG-UI / generative UI streaming — v3

### Success criteria for v0

1. Same one-line code call works across all four provider lanes (Claude, GPT, Gemini, Hermes via OpenRouter) with no other change.
2. CLI `repl` lets Orlando swap models mid-conversation without restart.
3. CLI `agent --model X "fix the typo"` produces a real diff via the bash tool, regardless of which X is chosen.
4. Anthropic prompt caching is observable in API responses (look at `cache_creation_input_tokens` and `cache_read_input_tokens` in usage).
5. Cost per chat call is logged per provider per token bucket so we can compare.
