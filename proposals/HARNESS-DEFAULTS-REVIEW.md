# FRQNCY Harness — Defaults Review

> **STATUS: All defaults locked as of 2026-04-26.** See "Final Locked Decisions" immediately below for the picks; the full pros/cons walkthrough below is preserved for reference.

## Final Locked Decisions (walkthrough output)

| Item | Locked choice |
|---|---|
| **A1. Permission model** | Tier by risk + per-conversation memory (read-only auto, write/exec propose-then-approve, `--yolo` bypass) |
| **A2. Permission allowlists** | None in v0 |
| **A3. Compaction** | 🔒 No compaction; halt + resume via progress.md |
| **A4. Retry / fallback** | 3 retries exponential backoff + silent fallback to OpenRouter version of same model class |
| **A5. Circuit breaker** | Per-provider 60s open state after 5 consecutive failures |
| **A6. Tool failure handling** | Inject error into context, retry/replan, abort after 3 consecutive failures on the same tool |
| **A7. Cost guardrails** | 🔒 $5 soft warn / $25 hard abort per conversation, configurable |
| **A8. Streaming** | AsyncIterator of typed events (`text`, `tool_call`, `tool_result`, `usage`, `done`) |
| **A9. Prompt caching** | Auto-enable for Anthropic when system prompt > 1024 tokens; pass-through for OpenAI/Gemini |
| **B1. Trace schema** | Rich + zod-validated, schema-versioned |
| **B2. External artifacts** | 🔒 Full Anthropic pattern in v0 agent mode (init.sh + progress.md + tasks.json + git baseline) |
| **B3. Conversation continuity** | Asymmetric: `chat` fresh, `repl` resumes most recent, `agent` fresh, `--resume <id>` always available |
| **B4. Memory unit** | Conversation only in v0 (UUID per session); threads/projects deferred |
| **B5. State separation** | 🔒 LLM stateless CPU; all state in trace |
| **B6. Trace replay** | Full replay via `frqncy-harness replay <id> --model X`; new trace, original immutable |
| **C1. Multi-modal** | Text + images + PDFs in v0; audio v2 |
| **C2. Voice / TTS** | Not in v0 |
| **C3. Notifications** | Opt-in via config; default off |
| **C4. Cross-machine sync** | Rely on the private GitHub trace repo |
| **C5. Daemon mode** | **Path C — harness packaged as a Hermes Agent skill** (Hermes provides daemon + multi-platform gateways; harness CLI stays self-contained). See decision 11 in HARNESS-PLAN.md. |
| **C6. TUI rendering** | Ink (React for terminals) |
| **D1. MCP config format** | Hybrid (Claude Desktop schema + `_harness` extensions) + `frqncy-harness mcp import-from-claude-desktop` |
| **D2. System prompt** | `./AGENT.md` → `./CLAUDE.md` → neutral default |
| **D3. Skills directory** | Not in v0 |
| **D4. Product auth** | Not in v0 (local-only) |
| **D5. Lethal trifecta gate** | Yes, ship in v0 as a guard function (default severity = warn, configurable to block) |
| **E1. Cost dashboard** | CLI subcommand `frqncy-harness costs --period 7d` |
| **E2. Doctor** | `frqncy-harness doctor` |
| **E3. Versioning** | Semver from v0.1.0 |
| **E4. Tests** | Vitest with provider-swap matrix |
| **F. Deferred items** | All F1–F10 stay deferred |

---

## Original review (pros/cons reference, kept for future revisits)

Every architectural default I'm proposing for the v0 harness, with options + pros/cons. Skim this end-to-end, mark anything you want to flip, and I'll re-discuss the ones you call out before any code gets written.

Companion docs: [HARNESS-PLAN.md](./HARNESS-PLAN.md) (locked decisions + down-the-roads), [HARNESS-RESEARCH-NOTES.md](./HARNESS-RESEARCH-NOTES.md) (the five-agent research dump), [../harness.md](../harness.md) (the four-essay corpus + tooling notes).

**How to use:** Each item has a one-line concern, the realistic options with brief pros/cons, my pick (★), and a checkbox-style action line. Reply with a list of items you want to flip. Items NOT flipped stay as ★.

**Status legend:** 🔒 = already locked from prior rounds (here for completeness, not for re-debate). ★ = my recommendation for this item. The rest are options.

---

## A. Agent loop mechanics (TRAE territory)

### A1. Permission model — when does the agent ask before acting on a tool?
- **Always auto-execute everything (yolo)** — fastest, riskiest. Fine if you trust the prompt and the sandbox is real.
- **Always require approval for every tool call** — safest, slowest, painful for repetitive work.
- **★ Tier by risk + per-conversation memory** — read-only tools auto-execute, state-changing tools (write, bash, MCP write ops) propose-then-approve. Once you approve a specific tool call within a conversation, the same call doesn't ask again until you exit. `--yolo` flag bypasses everything for trusted runs.
- **Tier by risk only, no per-conversation memory** — same as above but you re-approve the same command every time. More friction, slightly safer.

> **★ Why:** Best balance for personal use. Read-only stays fast; write/exec stays gated; per-conversation memory means you don't re-approve the same `npm install` six times.

`Action: [ keep ★ ]  [ flip to ___ ]`

### A2. Permission allowlists — "always allow X" rules persisted across sessions
- **★ No allowlists in v0** — only the per-conversation memory from A1.
- **Per-tool global allowlist** — config file lists tool names that auto-execute (e.g., `read`, `web_fetch`).
- **Per-tool + pattern allowlist** — config can express "always allow `bash` when command starts with `npm test`". Most powerful, more code.

> **★ Why:** Defer until you find yourself approving the same thing 10x. Easy to add later from real usage data.

`Action: [ keep ★ ]  [ flip to ___ ]`

### A3. Context window compaction strategy — what happens when window fills
- **🔒 LOCKED:** No compaction. When window exceeds 80% of provider max, halt session and require new session that reads `progress.md`. Trace data is sacred (decision 7).

### A4. Retry / fallback strategy — what happens on 429s, 5xx, timeouts
- **No retry** — failures bubble up immediately. Worst UX.
- **Retry with backoff, no fallback** — 3 retries with exponential backoff on the same provider. Errors out if all retries fail.
- **★ Retry + silent fallback to alternative provider** — 3 retries on the requested provider; on persistent failure, silently fall back to OpenRouter version of the same model class (e.g., Claude → `anthropic/claude-sonnet-4-6` via OpenRouter); only surface the error to the user if all paths fail. Trace records every attempt with `attempt_number` and `fallback_reason` fields.
- **Retry + loud fallback** — same as ★ but always surfaces the fallback to the user in the stream as a warning event.

> **★ Why:** Resilience without noise. Trace logs make the silent-fallback observable after the fact for cost analysis.

`Action: [ keep ★ ]  [ flip to ___ ]`

### A5. Circuit breaker — temporarily stop calling a failing provider
- **No breaker** — every call retries from scratch.
- **★ Per-provider 60s open state** after N consecutive failures (default N=5). Breaker auto-closes after 60s; if the next call fails, breaker re-opens.
- **Per-provider per-model breaker** — more granular but more state to track.

> **★ Why:** Prevents thundering-herd retries when a provider is down. 60s is the tested-good default in most operational systems.

`Action: [ keep ★ ]  [ flip to ___ ]`

### A6. Graceful degradation on tool failure — what happens when a tool fails inside an agent loop
- **Abort agent loop on first tool failure** — strictest, most predictable.
- **★ Inject error into context, let model retry/replan; abort after 3 consecutive failures on the same tool** — TRAE pattern.
- **Auto-substitute a less-risky tool** (e.g., switch `write` failures to `read` for inspection) — magical and confusing.

> **★ Why:** Models actually do fix their own tool calls when given the error message. Three strikes is the standard.

`Action: [ keep ★ ]  [ flip to ___ ]`

### A7. Cost guardrails
- **🔒 LOCKED:** $5 soft warn / $25 hard abort per conversation, configurable via `frqncy-harness config set costCap.*`.

### A8. Streaming protocol — how the harness exposes streaming to callers
- **Plain text chunks** — works but loses tool call structure.
- **★ AsyncIterator of typed events** (`text`, `tool_call`, `tool_result`, `usage`, `done`) — Vercel AI SDK pattern. Native to TS, consumable from any JS environment.
- **SSE-format strings** — more interop with non-JS clients, less ergonomic in TS.
- **WebSocket protocol** — overkill for v0.

> **★ Why:** Native to the Vercel AI SDK we're building on. Typed events let UI code render appropriately for each event type.

`Action: [ keep ★ ]  [ flip to ___ ]`

### A9. Prompt caching — when to enable provider-native caching
- **Never** — simplest, most expensive (loses Anthropic's ~90% input savings).
- **Always when supported** — most savings, occasional waste on tiny system prompts.
- **★ Auto when system prompt > 1024 tokens** — balanced. Pass-through for OpenAI / Gemini's native caching where they do it transparently.
- **User must opt in via flag** — most explicit, easiest to forget.

> **★ Why:** This is THE biggest cost lever for Claude Max overflow + API-key fallback paths. 1024 tokens is well below the Anthropic minimum cacheable size, so we always benefit when we cache.

`Action: [ keep ★ ]  [ flip to ___ ]`

---

## B. Memory & state (context graph essays)

### B1. Decision trace schema — what fields each JSONL row contains
- **Minimal: `{ts, role, content}`** — easiest to grep, loses everything else.
- **Standard: above + `model, input_tokens, output_tokens, cost_usd`** — enough for cost analysis.
- **★ Rich + zod-validated, schema-versioned**: `{ts, conversation_id, step, type, role, content, model, provider, tools_called[], input_tokens, output_tokens, cached_input_tokens, cost_usd, latency_ms, schema_version}` with `type` from `{user, assistant, tool_call, tool_result, decision, reflection, error, system}`. Zod schema in the repo, versioned.
- **Open-ended unstructured** — pure JSON dump per call, no schema. Maximum flexibility, harder to query later.

> **★ Why:** The trace IS the moat (per Phil Schmid, "the harness is the dataset"). A rich versioned schema means future evals, distillation, and DSPy optimization all have clean data to read. Schema versioning lets us evolve without breaking old traces.

`Action: [ keep ★ ]  [ flip to ___ ]`

### B2. External artifacts (Anthropic pattern)
- **🔒 LOCKED:** Full pattern in v0 agent mode — `init.sh` + `progress.md` + `tasks.json` + git baseline.

### B3. Conversation continuity — what does the CLI do at start
- **Always start fresh** — simplest, loses chat-thread feel.
- **Always resume the last conversation** — best for chat-like flow, surprising for agent-like flow.
- **★ Asymmetric: `chat` fresh, `repl` resumes most recent, `agent` fresh; `--resume <id>` always available** — semantic split matches user intent.
- **Always require explicit `--new` or `--resume`** — most explicit, most friction.

> **★ Why:** REPL is conversational so resuming the last session feels right. One-shot `chat` is more like a shell command; should start fresh. `agent` runs are tasks, not conversations.

`Action: [ keep ★ ]  [ flip to ___ ]`

### B4. Unit of memory — what's the granularity
- **★ Conversation only in v0** (UUID per session). Threads / projects / workspaces deferred to v2.
- **Conversation + thread** — multiple conversations sharing context (e.g., a "FRQNCY editorial" thread). More complex, real value.
- **Conversation + thread + project** — workspaces. Overkill for v0.

> **★ Why:** Threads come naturally with the v2 memory layer (Graphiti / mem0). Premature in v0 — would just be folders right now.

`Action: [ keep ★ ]  [ flip to ___ ]`

### B5. State separation principle (TRAE)
- **🔒 LOCKED:** LLM is stateless CPU; all cross-turn state lives in the trace.

### B6. Trace replay — can you re-run an old trace through a different model
- **No replay** — traces are read-only history.
- **Read-only replay** — pretty-print an old trace in the UI, no re-execution.
- **★ Full replay**: `frqncy-harness replay <id> --model X` re-calls the model(s) with the same prompts, writes a NEW trace with `replays: <original-id>` metadata. Original is never mutated.
- **Replay + diff** — same as ★ plus a diff view showing how the new model's output differs from the original. Future addition.

> **★ Why:** Replay is essential for evals — "would the new GPT-5 release have done this better?" answered with one command.

`Action: [ keep ★ ]  [ flip to ___ ]`

---

## C. UX

### C1. Multi-modal input — images, PDFs, audio
- **Text only** — simplest, misses content-work value.
- **Text + images** — modest scope.
- **★ Text + images + PDFs** in v0; audio deferred to v2. Vision via Anthropic + OpenAI native vision; PDFs auto-extracted via `pdf-parse`.
- **Text + images + PDFs + audio** — complete but audio is its own rabbit hole.

> **★ Why:** Image and PDF support is what makes the harness useful for content-work (reading proposals, analyzing screenshots). Audio is a v2 addition.

`Action: [ keep ★ ]  [ flip to ___ ]`

### C2. Voice / TTS
- **★ Not in v0** — adds a whole separate dependency tree (audio capture, TTS provider, real-time streaming).
- **Whisper input + ElevenLabs output, opt-in** — speak-to-prompt, hear responses. Real value, real complexity.

> **★ Why:** Defer. The minute you want voice, you also want a phone client, and that's a different project.

`Action: [ keep ★ ]  [ flip to ___ ]`

### C3. Notifications — macOS notification on long-job completion
- **★ Opt-in via config; default off** — `frqncy-harness config set notifications.enabled true`. Sends a native macOS notification when an `agent` run completes or aborts.
- **Always on** — surprises new users.
- **Not in v0** — defer.

> **★ Why:** Cheap to add (~20 LOC via `node-notifier`), genuinely useful for long agent runs.

`Action: [ keep ★ ]  [ flip to ___ ]`

### C4. Cross-machine sync of conversations
- **★ Not in v0; rely on the GitHub trace repo (decision 7) for natural sync** — cloning the repo on a second machine gives you all your traces. Conversation files in `~/.frqncy-harness/` minus the trace repo are local config only.
- **iCloud Drive sync** — Apple-locked, opaque conflict resolution.
- **Custom server** — overkill.

> **★ Why:** The GitHub trace repo basically solves this. Configure it on machine 2, `git clone`, done.

`Action: [ keep ★ ]  [ flip to ___ ]`

### C5. Background / daemon mode — run agents detached
- **★ Not in v0; foreground only** — wrap in `nohup`, `tmux`, or `launchd` if you want background.
- **Built-in `agent --background` flag with PID tracking** — 100 LOC, useful for long jobs.
- **Full daemon (Hermes Agent style)** — listens on multiple platforms, runs continuously. Major v3+ project.

> **★ Why:** Foreground is fine for v0 personal use. The Hermes-style daemon is a separate v3 ambition (it's literally what Hermes Agent already does — could fork or wrap it).

`Action: [ keep ★ ]  [ flip to ___ ]`

### C6. TUI rendering — how the REPL renders
- **Plain readline** — basic, works everywhere.
- **★ Ink (React for terminals)** — what Claude Code uses. Rich rendering, syntax highlighting, in-place updates, "on distribution" for the model.
- **Custom ANSI** — overkill, no benefit.

> **★ Why:** Ink is the de facto choice for high-quality TS CLI tools. The model can edit Ink-based code easily because it's React.

`Action: [ keep ★ ]  [ flip to ___ ]`

---

## D. Integration

### D1. MCP server config format
- **Claude Desktop-compatible JSON** — `mcpServers: { name: { command, args, env } }`. Copy-paste from Claude Desktop. Standard, locked schema, no harness-specific fields.
- **Custom format** — design exactly what the harness needs (cost caps, allowlists, permissions per server). Full flexibility, no portability.
- **★ Hybrid** — Claude Desktop schema as canonical, optional `_harness` namespaced fields per server for cost caps, permissions, enable/disable. Includes `frqncy-harness mcp import-from-claude-desktop` command. File at `~/.frqncy-harness/mcp.json`.
- **Defer MCP entirely to v2** — ship v0 with only bundled tools.

> **★ Why:** Best ergonomics (copy-paste works) + best future flexibility (extensions when you need them). Slight extra parsing complexity is the only cost.

`Action: [ keep ★ ]  [ flip to ___ ]`

### D2. System prompt convention — where per-project agent personality lives
- **Always neutral default** — boring but predictable.
- **Read `./AGENT.md`** — new generic convention.
- **Read `./CLAUDE.md`** — Claude Code convention; tons of existing projects already have this.
- **★ Read `./AGENT.md` first, fall back to `./CLAUDE.md`, fall back to neutral default** — both worlds, generic forward, backward compatible.

> **★ Why:** `CLAUDE.md` is everywhere already; `AGENT.md` is the more generic name as the agent space matures. Reading both means zero friction in either direction.

`Action: [ keep ★ ]  [ flip to ___ ]`

### D3. Skills directory (Hermes-style auto-generated Markdown procedures)
- **★ Not in v0; deferred to v2** — covered by the Voyager-style skill library entry in down-the-roads.
- **Manual skills only in v0** — user can drop Markdown files in `~/.frqncy-harness/skills/` and they're auto-loaded. No auto-generation. Cheap to add.
- **Full Hermes-style auto-generated skills in v0** — agent writes its own procedures from successful trajectories. Real complexity, big v3+ ambition.

> **★ Why:** Defer. Skills require the v2 memory layer to have enough usage data to extract meaningful procedures from. In v0 the trace IS the skill library.

`Action: [ keep ★ ]  [ flip to ___ ]`

### D4. Auth for FRQNCY product use — when product code calls the harness
- **★ Not in v0 — local-only, no auth** — v0 is for your dev workflow. v2 adds API-key auth when first product surface needs to call the harness.
- **API key auth in v0** — premature; nothing is calling the harness from the product yet.
- **JWT auth in v0** — even more premature.

> **★ Why:** Not needed yet. When FRQNCY product code first wants to call the harness, that's the trigger to add API-key auth (one v2 commit).

`Action: [ keep ★ ]  [ flip to ___ ]`

### D5. Lethal trifecta gate (Simon Willison) — refuse to execute traces that hold private data + untrusted content + outbound network simultaneously
- **★ Yes, ship in v0 as a guard function** — `agent` loop checks for the three flags before each step. Configurable severity: warn (default), block, log-only. Each tool tagged with which flags it carries.
- **Defer to v2** — risky given v0 has bash + web + MCP. Lethal trifecta becomes possible early.
- **Always block** — most restrictive.

> **★ Why:** Cheap (~50 LOC), prevents the most common agent security failure mode. Default severity = warn so it doesn't get in the way during development.

`Action: [ keep ★ ]  [ flip to ___ ]`

---

## E. Operations

### E1. Cost dashboard — how user sees what they spent
- **No dashboard** — costs visible only in the JSONL trace.
- **★ CLI subcommand: `frqncy-harness costs --period 7d`** — reads trace files and prints totals by model, by tool, by day. JSON output with `--json` for piping.
- **Web UI** — overkill for v0; the trace repo on GitHub gives you a free remote view if you want.
- **Export to CSV** — `--format csv` flag on the CLI subcommand. Add when needed.

> **★ Why:** CLI is enough for personal use. The trace repo on GitHub is the free analytics dashboard if you ever want to query traces with a different tool.

`Action: [ keep ★ ]  [ flip to ___ ]`

### E2. Doctor / health check
- **★ `frqncy-harness doctor`** — verifies API keys, MCP server reachability, gtr installation, git config, GitHub trace repo write access; runs a smoke test against each provider with a tiny prompt.
- **No doctor** — harder to diagnose issues.
- **Doctor as a separate package** — premature.

> **★ Why:** Standard. gtr has it, Claude Code has it, every well-built CLI has it.

`Action: [ keep ★ ]  [ flip to ___ ]`

### E3. Versioning
- **★ Semver from v0.1.0** — standard.
- **CalVer** — date-based; useful if releases are very frequent.
- **No versioning yet** — chaotic.

> **★ Why:** Semver is the npm-ecosystem default. v0.x signals pre-1.0, breaking changes allowed.

`Action: [ keep ★ ]  [ flip to ___ ]`

### E4. Tests — what counts as v0 test coverage
- **None** — fastest, riskiest.
- **★ Vitest with provider-swap matrix** — for every operation (chat, stream, agent), test it works against every provider lane (Claude, GPT, Gemini, OpenRouter). Plus unit tests for the trace serializer, MCP client, and lethal-trifecta guard.
- **Vitest + Inspect AI eval suite** — adds Python sidecar for full agent evals. Defer Inspect to v2.

> **★ Why:** The provider-swap matrix is the v0 success criterion already. Inspect AI evals come with the Python sidecar in v2.

`Action: [ keep ★ ]  [ flip to ___ ]`

---

## F. Things I haven't asked about that you might want

These are additional concerns from the docs that I haven't surfaced as decisions because I'm leaning "no v0" on all of them. Flag any you want to discuss:

- **F1. Background scheduling** — cron-like triggers (e.g., "every Monday at 9am, run this agent"). Not in v0. Hermes Agent has this. v2+ if useful.
- **F2. Agent-to-agent (A2A) protocol** — Google ADK ships this. Defer until you actually run multi-agent flows. v2+.
- **F3. MCP server creation tooling** — should the harness include a scaffolding command for *creating* MCP servers? Defer; if needed, the FRQNCY content MCP is its own project.
- **F4. Web UI for the harness** — chat in browser instead of CLI. Defer; the v2 monorepo brings a Cowork plugin which fills this gap.
- **F5. Mobile** — Capacitor app integration. Defer entirely; that's a v3 conversation when FRQNCY product surfaces start using the harness.
- **F6. Self-improvement loop** — DSPy weekly trace optimization. v2 with the Python sidecar.
- **F7. Eval suite** — Inspect AI integration. v2 with the Python sidecar.
- **F8. RAG / retrieval baked into the harness** — Defer. Retrieval should live in MCP servers (e.g., the FRQNCY content MCP), not in the harness.
- **F9. Semantic conversation search** — "find the conversation where I asked about X." Defer; grep on the JSONL trace works for v0.
- **F10. Multi-tenant support** — multiple users sharing one harness instance. Defer entirely; v3 product concern.

`Want any of F1–F10 in v0? If yes, list them. If no, all stay deferred.`

---

## How to respond

Three ways to answer this doc, easiest to hardest:

1. **"All defaults look fine"** → I lock everything as ★ and we move to v0 build.
2. **"Flip these: A1, B6, D2"** → I re-discuss only those items with you, then lock.
3. **"Walk me through it"** → We go item by item over chat. Slowest but highest comfort.

Once defaults are locked, the next questions are about *building* — not architecture: project scaffolding, naming, dependency choices, first commit shape. We can go straight to building or you can ask for more architecture detail first.
