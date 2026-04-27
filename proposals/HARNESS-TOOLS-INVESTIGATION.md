# Harness Tools Investigation

Investigation memo on five external tools/concepts flagged in [IDEAS-INBOX.md](./IDEAS-INBOX.md) sections D and E as roadmap candidates for `@frqncy/harness`. Each section ends with a concrete recommendation. Final section proposes specific edits to [HARNESS-PLAN.md](./HARNESS-PLAN.md) (this memo does not modify it).

Investigation date: 2026-04-27.

---

## 1. Claude Code Skills

Skills are the open [Agent Skills standard](https://agentskills.io) that Anthropic adopted in Claude Code, with extensions for invocation control, subagent execution, and dynamic context injection. The primitive itself is dead simple: a directory containing a `SKILL.md` file with YAML frontmatter (name, description, optional `allowed-tools`, `disable-model-invocation`, `context: fork`) and Markdown body. Skills can include supporting files (reference docs, scripts in any language, examples) that Claude only reads when needed — progressive disclosure. Distribution scopes are personal (`~/.claude/skills/`), project (`.claude/skills/`), enterprise, and plugin (with `plugin-name:skill-name` namespacing).

Three behaviors matter for the harness:

1. **Auto-invocation by description.** Claude reads the frontmatter `description` and auto-loads the skill when the user prompt is a thematic match. This is essentially a router from natural language to a Markdown procedure.
2. **One-shot context injection.** When invoked, the rendered `SKILL.md` enters the conversation as a single message and stays there. The model does not re-read on later turns — write skills as standing instructions.
3. **Subagent execution (`context: fork`).** A skill can run in an isolated subagent with no conversation history, with the skill content as the prompt. Useful for sandboxing risky procedures.

**Relation to Voyager-style skill library (HARNESS-PLAN.md down-the-roads v3):** Skills as Anthropic defines them are *human-authored* Markdown procedures with a description-based router. Voyager's contribution is the *agent-authored* loop: the agent writes its own skill, indexes it (pgvector), and retrieves on similar problems. These are complementary primitives, not competitors. Skills give you the storage/loading layer; Voyager gives you the write/index/retrieve loop on top.

**Recommendation: mirror the Skills primitive in v2, then layer Voyager on top in v3.** Concretely: add a `~/.frqncy-harness/skills/` directory scanned at startup, parse YAML frontmatter, build a description→skill index, inject the matching skill into the system prompt when the user prompt scores above threshold. Reuse the open Agent Skills schema verbatim — that gives free interop with Claude Code, Gemini CLI, and the rest of the ecosystem (e.g., Caveman, see §3, ships as an Agent Skill). Voyager (v3) becomes "the agent writes a new SKILL.md, commits it to the skills dir, and the next run picks it up automatically." The two were planned as separate roadmap items; they collapse into one well-shaped feature where Skills is the noun and Voyager is the verb.

---

## 2. Claude Code Hooks

Hooks are deterministic callbacks at fixed lifecycle points. Configuration lives in `hooks.json` (settings, plugin, or project) with a top-level event name keying an array of `{matcher, hooks: [{type, ...}]}` blocks. Events span the full agent loop: `SessionStart`, `UserPromptSubmit`, `UserPromptExpansion`, `PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `PostToolBatch`, `PermissionRequest`, `PermissionDenied`, `Stop`, `SubagentStop`, `TaskCreated`, `TaskCompleted`, `WorktreeCreate`, `WorktreeRemove`, `CwdChanged`, `TeammateIdle`. Handler types: `command` (shell), `http` (POST to endpoint), `mcp_tool`, `prompt` (LLM), `agent`. Matchers are regex against `tool_name` (so `mcp__memory__.*` filters MCP tools by server). Exit code semantics give hooks real teeth: exit 0 = OK with optional JSON stdout, exit 2 = blocking error (PreToolUse blocks the call, UserPromptSubmit rejects the prompt), other = non-blocking error.

This is exactly the missing primitive for a lot of the harness's planned guardrails. Right now decision 10 (cost caps), the lethal-trifecta gate, and prompt-caching telemetry are scattered across the codebase as ad-hoc checks. Hooks would consolidate them into a single declarative surface.

Use cases this unlocks for `@frqncy/harness`:

- **Cost cap as a `PreToolUse` / `Stop` hook** instead of inline logic. Soft warn / hard abort become two hook scripts, swappable per project.
- **Lethal-trifecta enforcement** as a `PreToolUse` hook on `web_fetch|web_search` after a tool that read untrusted content — reuse the existing gate, just declarative.
- **Auto-commit traces** via a `Stop` hook (replaces the auto-commit logic in decision 7).
- **Editorial-values lint** as a `PostToolUse` hook on `Write|Edit` — block writes to `v2/**/*.html` or `search.json` if they introduce "leaderboard" / "calls" / ranking framing (per CLAUDE.md editorial values). This is a real win: the editorial values become enforced code, not aspirational prose.
- **Skill auto-injection** as a `UserPromptSubmit` hook (cleaner than baking it into the prompt loop).
- **MCP audit trail** by matching `mcp__.*__write.*` for write-operations on any MCP server.

**Recommendation: ship a hooks primitive in v0.6 — sooner than v2.** Hooks are small (a single `runHooks(event, payload)` call at five or six lifecycle points; ~150 LOC), high leverage, and they let us migrate existing ad-hoc guardrails (cost cap, lethal-trifecta, auto-commit) into a uniform declarative surface where users can extend without forking. Adopt the Claude Code event names verbatim (`PreToolUse`, `PostToolUse`, `UserPromptSubmit`, `Stop`, `SessionStart`) for ecosystem compatibility — the hooks.json schema is small enough to copy directly. Start with `command` and `http` handler types; defer `mcp_tool`, `prompt`, `agent` to v2.

---

## 3. Caveman

[`juliusbrussee/caveman`](https://github.com/juliusbrussee/caveman) is a Claude Code skill (and Gemini/Cursor/Windsurf/Copilot extension) that *cuts ~65% of output tokens by instructing the model to talk like a caveman*. Tagline: "why use many token when few token do trick." It's based on the viral observation that caveman-speak preserves technical substance while dropping articles, auxiliary verbs, and conversational filler. Ships as a one-line install (`claude plugin marketplace add JuliusBrussee/caveman && claude plugin install caveman@caveman`), provides a `/caveman` slash command, several modes (LIGHT, MEDIUM, ULTRA), and supplementary skills (`caveman-commit`, `caveman-review`, `caveman-compress`). MIT-licensed, actively maintained, statusline badge integration.

What it actually is: a *system-prompt fragment* that flips the assistant's output style to terse-telegraphic-pidgin. Not a tokenizer hack, not a context compressor on input — purely an output-side compression by style instruction. The 65% number is on output tokens; input tokens are unchanged. So the cost savings appear primarily on output-heavy operations (chat, code review prose) and roughly nothing on tool-use loops where output is mostly tool calls.

Honest take for FRQNCY's use cases:

- **For Word Illuminator and any FRQNCY content generation:** **No.** The outputs are reader-facing, the brand voice is editorial and contemplative ("discipline is not force — it is alignment"), and pidgin-English breaks every editorial value in CLAUDE.md. Hard pass on user-facing surfaces.
- **For internal `agent` runs (tool loops, refactors, the like) where the assistant's prose is just glue between tool calls:** **Marginal.** Tool-use loops are dominated by tool-call tokens and tool-result tokens, neither of which Caveman touches. The savings on the prose glue are real but small in absolute terms, and the trace becomes harder to read on review.
- **For `progress.md` / `tasks.json` writes (decision 9):** **No.** Those are the cross-session memory bridge — they need to read clearly to a future agent or human. Caveman defeats their purpose.

The one place Caveman might earn its keep: a `--terse` flag on `frqncy-harness chat` for raw scratch queries where Orlando just wants the answer. But that's a 5-line shell alias, not a dependency.

**Recommendation: do not integrate. Note in HARNESS-PLAN.md as "evaluated, declined" with the reason (editorial values + tool-loop economics make the savings marginal).** If we ever want output-cost reduction at scale, the right primitive is per-call max_tokens budgeting and prompt-caching tuning, not style-prompting.

---

## 4. Neo4j (vs. Graphiti vs. Zep) for the bi-temporal context graph

The deferred "Bi-temporal memory" item in HARNESS-PLAN.md's down-the-roads has a clean answer in 2026: **the three options are not alternatives, they're a stack.**

- **[Neo4j](https://neo4j.com/)** is the underlying graph database. Cypher query language, mature, free Community edition, hosted Aura tier. It's the storage substrate.
- **[Graphiti](https://github.com/getzep/graphiti)** (open-source, MIT, Zep's project) is a temporal knowledge-graph engine *built on Neo4j*. Adds the bi-temporal model (every edge has `t_valid` / `t_invalid` plus transaction time), incremental updates without recomputing the graph, and a hybrid retrieval combining semantic embeddings + BM25 keyword + graph traversal. P95 retrieval latency ~300ms. No LLM calls at query time (this is the key win over Microsoft GraphRAG, which makes multiple LLM calls per query for community summarization).
- **[Zep](https://www.getzep.com/)** is the hosted commercial product *built on Graphiti*. Memory-as-a-service, the convenience layer. [The Zep paper](https://arxiv.org/abs/2501.13956) shows 94.8% on Deep Memory Retrieval (vs MemGPT's 93.4%).

Bi-temporal modeling matters specifically for FRQNCY's planned use cases. Examples: "what did Orlando believe about Hermes Agent in March 2026?" (valid time), "when did the harness first ingest the editorial-values memory?" (transaction time). Pure vector retrieval can't answer either.

**Recommendation: skip Zep, run Graphiti on self-hosted Neo4j Community when (and only when) JSONL traces stop being adequate.** Graphiti is open-source, sits at the right layer, and inherits Neo4j's maturity. Self-hosted Neo4j Community is free, fits in a single Docker container, and aligns with FRQNCY's "own your stack" instinct. Zep's hosted service is fine but doesn't pay for itself until we have multi-user agent traffic or want managed embeddings — neither is true now.

**Migration triggers — flip from JSONL to Graphiti when at least two of these are true:**

1. Trace store crosses ~500MB (JSONL grep starts feeling slow on `INDEX.jsonl`)
2. We need a query like "show me every conversation where Orlando mentioned Ethos before April" that vector search alone cannot answer cleanly
3. Two or more agents (research + writer + reviewer per E3 in IDEAS-INBOX) are running in parallel and need shared episodic memory
4. We have a real cross-session "what did the agent learn yesterday" requirement that `progress.md` is failing to bridge

Until then, JSONL plus the existing INDEX.jsonl summary is fine. Decision 7's "trace data is sacred, never compacted" remains the law — Graphiti would *layer on top of* JSONL, not replace it. JSONL is the source of truth; Graphiti is an indexed view.

---

## 5. DeAI (decentralized inference) provider lane

The ecosystem moved fast in the last 12 months. State of play April 2026:

- **[Chutes](https://chutes.ai/)** (Bittensor SN64): serverless decentralized inference, ~$0–0.30 per Mtok by aggregating community GPU operators. Reportedly handling ~3T tokens/month at peak. TEE (confidential compute) shipped late 2025. OpenAI-compatible API. Production-grade for non-mission-critical traffic; multi-provider fallback recommended.
- **[Templar / Covenant](https://github.com/one-covenant/templar)** (Bittensor SN3): decentralized *training*, not inference. March 2026 they completed [Covenant-72B](https://news.800.works/news/2026-03-20/bittensor-covenant-72b-decentralized-llm-pretraining/), the largest decentralized LLM pre-training run ever (1.1T tokens, 72B params, performance-competitive with LLaMA-2-70B), using their SparseLoCo algorithm (30 local steps + compressed update). Inference of Covenant-72B is served through Chutes and other Bittensor inference subnets.
- **[Nous Research's Psyche](https://psyche.network/)** ($50M Series A from Paradigm, April 2025): decentralized training network coordinated on Solana. Hermes 4.3 was the first Hermes model trained on Psyche (production milestone). Aligned ideologically with FRQNCY (Nous's open-source ethos, and Hermes Agent is already the v0 daemon plan, decision 11).
- **[Akash](https://akash.network/)**: decentralized GPU rental. General-purpose, not LLM-specific. Useful as a sandbox host, less so as a provider lane.
- **[Render Network](https://rendernetwork.com/)**: GPU compute, originally rendering, expanded into ML. Adjacent.
- **Bittensor (TAO)** is the underlying substrate for Chutes and Templar.

What "DeAI as a harness provider lane" looks like concretely: add `@ai-sdk/openai-compatible` pointed at Chutes' OpenAI-compatible endpoint, gated behind `--provider chutes` or `chutes/<model>` model strings. Probably ~50 LOC.

**Realistic timeline: add Chutes as an *experimental* provider lane in v0.7 (next 1–2 months); don't make it default for anything until ~v2.** The trigger to promote DeAI from experimental to first-class:

1. **Chutes uptime SLA** publicly meets or beats Anthropic's (currently ~99.9%) over a rolling 90-day window
2. **Latency P95** within 2x of OpenRouter for matched open models (Hermes, Llama, Qwen)
3. **At least one Hermes model trained end-to-end on Psyche** (Hermes 4.3 already meets this; Hermes 5 will likely confirm the pattern is durable, not a one-shot)
4. **Confidential compute** (Chutes TEE) verified for routes where editorial content goes through (avoids leaking unreleased FRQNCY content to community node operators)

The thematic alignment is strong — DeAI maps to the crypto values Orlando is canonicalizing on `/v2/crypto/` (borderlessness, censorship resistance, permissionless). Running FRQNCY on DeAI is on-mission, not just opportunistic. But running production traffic on a network where editorial-values-bearing content is processed by anonymous node operators is a real risk until TEE is universal and audited. So: **wire it for non-sensitive workloads now, gate sensitive workloads on TEE maturity**.

---

## Proposed HARNESS-PLAN.md updates

Specific edits to [HARNESS-PLAN.md](./HARNESS-PLAN.md). All cross-reference this memo.

### Add to "Down-the-roads index" table

| When | What | Why we deferred |
|---|---|---|
| **v0.6** | Hooks primitive — `PreToolUse` / `PostToolUse` / `UserPromptSubmit` / `Stop` / `SessionStart` events with command + http handlers; reuse Claude Code schema verbatim. See [HARNESS-TOOLS-INVESTIGATION.md §2](./HARNESS-TOOLS-INVESTIGATION.md#2-claude-code-hooks). | Small primitive; consolidates cost cap + lethal-trifecta + auto-commit into a uniform declarative surface |
| **v0.7** | Chutes experimental provider lane via OpenAI-compatible adapter. See [HARNESS-TOOLS-INVESTIGATION.md §5](./HARNESS-TOOLS-INVESTIGATION.md#5-deai-decentralized-inference-provider-lane). | DeAI maturing fast; cheap to wire as an opt-in lane |
| **v2** | Skills primitive — adopt the open Agent Skills standard (`SKILL.md` + YAML frontmatter, description-routed auto-load, supporting files, `context: fork`). Reuse schema verbatim for ecosystem interop. See [HARNESS-TOOLS-INVESTIGATION.md §1](./HARNESS-TOOLS-INVESTIGATION.md#1-claude-code-skills). | Storage/loading layer for v3 Voyager; collapses two roadmap items into one well-shaped feature |
| **v2 or later** | Bi-temporal memory: **Graphiti on self-hosted Neo4j Community** (skip Zep hosted). See [HARNESS-TOOLS-INVESTIGATION.md §4](./HARNESS-TOOLS-INVESTIGATION.md#4-neo4j-vs-graphiti-vs-zep-for-the-bi-temporal-context-graph) for concrete migration triggers. | Replaces the existing "Graphiti / Zep" entry with a specific recommendation |

### Revise existing v3 entry

Old: *"Voyager-style skill library (agent writes its own tools, indexed in Supabase pgvector)"*

New: *"Voyager-style auto-skill loop: agent writes a new `SKILL.md` to the skills directory (Skills primitive from v2), indexed by description embedding, retrieved on similar problems. Replaces the prior pgvector plan since Skills already gives us the storage/loading layer."*

### Add to "Decisions / Evaluated and declined" (new subsection)

- **Caveman (`juliusbrussee/caveman`)** — evaluated 2026-04-27, declined. Output-style compression that breaks FRQNCY editorial values for content surfaces and yields marginal savings on tool loops. Right primitive for cost reduction is `max_tokens` budgeting + prompt-caching tuning. See [HARNESS-TOOLS-INVESTIGATION.md §3](./HARNESS-TOOLS-INVESTIGATION.md#3-caveman).

### Add a flag to the existing decision 10 (cost guardrails)

Note that in v0.6 the cost cap migrates to a `Stop` hook + `PreToolUse` hook combo, so users can override per-project without forking the harness.

---

## TL;DR

| Tool/Concept | Recommendation | Roadmap slot |
|---|---|---|
| Claude Code Skills | **Mirror the primitive**, reuse the open standard | v2 |
| Claude Code Hooks | **Adopt now (v0.6)** — small + high leverage | v0.6 |
| Caveman | **Decline** — wrong primitive for our use cases | n/a |
| Neo4j / Graphiti / Zep | **Graphiti on self-hosted Neo4j Community** when triggers fire | v2+ |
| Chutes / Templar / Psyche | **Wire Chutes as experimental lane**, promote on TEE + uptime triggers | v0.7 experimental, v2 promote |
