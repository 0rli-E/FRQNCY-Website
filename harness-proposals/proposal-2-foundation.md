# Proposal 2: Foundation

## Core thesis (1 sentence)

Build the harness as a two-plane system from day one — a **control plane** (a typed JSON-RPC service that owns the task graph, schema-versioned context store, and policy) cleanly separated from a **data plane** (worker processes that execute PPAF loops in tmux/worktrees) — so that in 2028 you are still composing on top of the same bones instead of rewriting around them.

## Lens

This proposal optimizes for the 36-month curve, not the 30-day demo. Every choice asks "what will we regret ripping out?" and treats the harness like infrastructure (Postgres, OTel, JSON-RPC) rather than a script. Phase 0 delivers zero user-visible features — it delivers schemas, contracts, and observability primitives that everything after stands on.

## Phases

### Phase 0: Bones (Weeks 1–3)
**What to build**
- **Schema-versioned context graph in Postgres.** A single table `nodes(id uuid pk, parent_id uuid, run_id uuid, kind text, schema_version int, payload jsonb, created_at timestamptz, agent_id text, hash text)` plus an `events` table that is append-only. JSONB payload, but every payload is validated against a Zod/JSON-Schema definition tagged with `schema_version`. Migrations land via `drizzle-kit` or `prisma migrate`; old rows stay readable via per-version readers. This is the Pi-style JSONL DAG, but on Postgres so you get indexes, transactions, and `pgvector` for free.
- **Control plane RPC interface (`harness-ctl`).** A tiny TypeScript HTTP+JSON-RPC 2.0 service exposing exactly: `runs.create`, `runs.get`, `runs.list`, `nodes.append`, `nodes.query`, `tasks.claim`, `tasks.complete`, `tasks.fail`, `policies.get`. This is the *only* way data plane workers touch state. Versioned URL prefix (`/v1/`). Every method has a published JSON Schema in `schemas/rpc/v1/`.
- **OpenTelemetry from line one.** Every RPC call, every tool invocation, every PPAF iteration emits a span using the `gen_ai.*` semconv (`gen_ai.operation.name=invoke_agent`, `gen_ai.agent.name`, `gen_ai.request.model`, `gen_ai.usage.*`). Local Jaeger or Tempo + Grafana via docker-compose. No bespoke logging — OTel only.
- **Repo skeleton (pnpm monorepo).** `packages/harness-core` (PPAF loop primitives), `packages/harness-rpc` (RPC client + types, generated from schemas), `packages/harness-ctl` (the service), `packages/harness-worker` (the wild-horse runner), `packages/harness-tools` (Tool Gateway), `apps/cli` (the operator CLI).

**Why**
The two things you can never refactor cheaply later are the **state schema** and the **wire protocol between processes**. Pin them now, with explicit versioning, and everything else is replaceable. This is exactly the LangGraph Platform model: the control plane manages desired state; data plane "listeners" reconcile to it; Postgres is the persistence layer (per [LangGraph Control Plane docs](https://docs.langchain.com/langgraph-platform/control-plane) and [Data Plane docs](https://langchain-ai.github.io/langgraph/concepts/langgraph_data_plane/)).

**Dependencies**
None. Postgres 16 + pgvector locally, Node 22, pnpm, docker-compose for OTel collector.

### Phase 1: Single-agent loop on the bones (Weeks 4–5)
**What to build**
- `harness-worker` runs a Ralph-style loop: stop-hook + completion-promise + `MAX_ITERATIONS`. The loop is a **finite state machine** with explicit states (`PERCEIVING`, `PLANNING`, `ACTING`, `WAITING_TOOL`, `INTEGRATING_FEEDBACK`, `BLOCKED`, `DONE`). Every state transition is one `nodes.append` RPC call.
- **Tool Gateway** (`harness-tools`) is a process-local interceptor: every tool call serializes to a `ToolCall` schema, hits an allowlist policy (read from `policies.get`), executes, and writes a `ToolResult` node referencing the `ToolCall` node by `parent_id`. This is your call interceptor + feedback assembler from harness.md, on rails.
- One agent profile: `frqncy-writer`, with a system prompt loaded from `prompts/frqncy-writer.v1.md` (also schema-versioned — content addressed by hash).

**Why**
Prove the bones hold up under one runner before you put seven runners on them. The FSM-on-Postgres pattern is what durable execution engines like Temporal and Restate converged on (see [Durable Execution comparison](https://devstarsj.github.io/2026/04/03/durable-execution-temporal-restate-dbos-distributed-workflows-2026/)) — we're doing the lite version because the workflow IS the agent loop, not a separate engine.

**Dependencies**
Phase 0 schemas frozen at v1.

### Phase 2: Parallel runtime — tmux + worktrees + scheduler (Weeks 6–8)
**What to build**
- `harness-ctl tasks.claim` becomes a real scheduler: `SELECT … FOR UPDATE SKIP LOCKED` over a `tasks` table partitioned by agent role. This is the proven Postgres queue pattern, no Redis required.
- A wrapper `harness spawn <profile> <task-id>` that: creates a git worktree at `worktrees/<run-id>/`, opens a tmux window named `<run-id>`, launches `harness-worker` inside it pointed at that worktree, and registers the worker with the control plane (heartbeat every 10s).
- A `harness top` TUI that reads from `runs.list` + heartbeats and shows live state of every worker — same vibe as `k9s`, scoped to agents.

**Why**
This is where most harnesses cheat by hardcoding tmux behavior into shell scripts. By making spawn a thin shim over an already-published RPC, a future replacement of tmux (Kubernetes Jobs, Modal sandboxes, local Docker) is a 200-line swap, not a rewrite.

**Dependencies**
Phase 1 worker stable.

### Phase 3: Observability + replay (Weeks 9–10)
**What to build**
- **Trace UI.** Grafana dashboards over the OTel data: cost-per-run, tokens-per-iteration, tool-call distribution, blocked-state heatmap. AgentOps-style "rewind and replay" by re-reading a run's nodes from Postgres and re-rendering the decision tree (per [AgentOps observability](https://aiagentslist.com/agents/agentops)).
- **Deterministic replay.** Given a `run_id`, reconstruct exact context window at iteration N. Because every percept/plan/act is an append-only node with a hash, this is a `SELECT … ORDER BY created_at` away.
- **Eval hooks.** `nodes.query` supports `kind = 'OUTCOME'` so you can run any eval (success/failure, conversion lift, page rendered) against historical runs without re-executing the LLM.

**Why**
You cannot tune what you cannot see. Every serious 2026 platform — LangSmith, AgentOps, Inngest Insights, Datadog LLM Obs — ships observability before features (per [Datadog OTel GenAI](https://www.datadoghq.com/blog/llm-otel-semantic-convention/)). And replay is the *only* way to safely change a system prompt: you can re-score 100 historical runs against the new prompt before deploying.

**Dependencies**
OTel from Phase 0; nodes table from Phase 0.

### Phase 4: Self-evolving FRQNCY workloads (Weeks 11–16)
**What to build**
- Agent profiles: `topic-researcher`, `page-author`, `ab-test-designer`, `conversion-analyst`, `editor-reviewer`. Each one is a Markdown prompt + a tool allowlist + a target output schema — all schema-versioned, all loaded by hash.
- Long-running supervisor loop: a `frqncy-orchestrator` profile that reads analytics, picks an experiment, opens a task graph, and watches downstream agents complete it. This is the "permanent loop" — its `MAX_ITERATIONS` is effectively `MAX_INT`, but each sub-task is a bounded child run.
- PR-gated outputs: every page/A-B test ships as a PR via the GitHub MCP server; humans (or eval agents) approve before merge. The harness writes; humans gate.

**Why**
Now and only now do we touch FRQNCY directly. Everything before this was infrastructure. The supervisor pattern is exactly Mastra's "agent-as-step" composition (per [Mastra agent-as-step](https://mastra.ai/en/examples/workflows/agent-as-step)) but with our own bones underneath.

**Dependencies**
Phases 0–3 stable, OTel dashboards readable.

### Phase 5: Hardening for the 36-month horizon (Weeks 17–24)
**What to build**
- **Schema migration drills.** Bump a payload schema to v2; verify v1-readers still work and v2-writers coexist. Trigger.dev's "atomic versioning" model — old runs finish on old code, new runs use new code (per [Trigger.dev Versioning](https://trigger.dev/docs/versioning)).
- **Backup + PITR for Postgres** (managed: Neon/Supabase or self-hosted with `pgbackrest`).
- **Policy engine.** Tool allowlists become OPA/Rego or a typed TS DSL — declarative, testable, versioned with the prompts.
- **Public-style RPC.** Document `harness-ctl` as if external tools will drive it (because future-you will: a web dashboard, a Slack bot, a cron). This is pi-mono's published-RPC discipline.

**Why**
Month 6 is when you finally test the assumption you built on at week 1. Better to break it on purpose than discover it breaks under load.

## Trend research (with this lens)

1. **The control-plane / data-plane split is the dominant 2026 architecture.** LangGraph Platform explicitly separates a control plane (deployments UI + APIs) from a data plane (per-deployment Servers with their own Postgres). Crucially, "the control plane never connects to the data plane directly" — the data plane *polls* (per [LangGraph Control Plane](https://docs.langchain.com/langgraph-platform/control-plane)). This is the pattern to copy: workers pull tasks; the control plane stays oblivious to where they run. It's what lets Orlando swap tmux for Modal for K8s without touching control logic.

2. **Postgres has become "the substrate" for agent state.** As of 2026, teams are *collapsing* multi-database stacks back into Postgres for agent workloads — pgvector for embeddings, JSONB for flexible payloads, copy-on-write branching (Neon) for safe agent experimentation, `SKIP LOCKED` queues replacing Redis (per [How Postgres Became the AI Agent Substrate](https://www.softwareseni.com/how-postgres-became-the-ai-agent-substrate-for-memory-branching-and-modern-hosting/) and [Agent State Management: Redis vs Postgres](https://www.sitepoint.com/state-management-for-long-running-agents-redis-vs-postgres/)). One Postgres instance is the right answer for the next 24 months.

3. **OpenTelemetry GenAI semconv is the de facto observability schema.** The `gen_ai.*` namespace (`gen_ai.operation.name=invoke_agent`, `gen_ai.agent.name`, `gen_ai.request.model`, token usage metrics) is now adopted by Datadog, Grafana, and the major frameworks (per [OTel GenAI Agent Spans](https://opentelemetry.io/docs/specs/semconv/gen-ai/gen-ai-agent-spans/) and [Datadog announcement](https://www.datadoghq.com/blog/llm-otel-semantic-convention/)). Emit spans in this convention from day one and every observability vendor "just works." Skip it and you'll rewrite your tracing in 2027.

4. **Durable execution is converging on event-journaled FSMs.** Temporal raised $300M at $5B in Feb 2026 on this thesis; Restate ships the same journal/replay model as a sidecar; DBOS does it in Postgres directly (per [Durable Execution comparison](https://devstarsj.github.io/2026/04/03/durable-execution-temporal-restate-dbos-distributed-workflows-2026/)). The lesson for a small harness: **don't adopt Temporal**, but *do* adopt its mental model — every state transition is an append to a journal, crash recovery is replay from the journal. Our `nodes` table IS that journal.

5. **MCP is the right wire protocol for tools, JSON-RPC 2.0 is the right wire protocol for control.** MCP is now governed by the Linux Foundation's Agentic AI Foundation; over 10,000 public servers exist; the spec uses JSON-RPC 2.0 over Streamable HTTP (per [MCP Specification](https://modelcontextprotocol.io/specification/2025-11-25) and [JSON-RPC Renaissance](https://www.fmtdev.dev/blog/json-rpc-2026-ai-agents-mcp)). Make `harness-ctl` JSON-RPC 2.0 too — same paradigm for tools and control means a single transport library, and your control plane can itself be exposed as an MCP server later for free.

## Top 3 risks of this approach

1. **Over-engineering before learning.** Three weeks of "bones" with zero output is hard to defend if FRQNCY-the-business is starving for content. Mitigation: cap Phase 0 strictly at 3 weeks; if it slips, that's a signal the abstractions are wrong, not that more time is needed.
2. **Schema lock-in too early.** v1 schemas chosen at week 2 might be wrong. Mitigation: this is exactly why every payload is `schema_version`-tagged and migrations are practiced in Phase 5 — being wrong is fine if migration is cheap.
3. **Postgres becomes the bottleneck nobody profiles.** A naive `nodes` table with no indexes will fall over at 100k rows. Mitigation: index `(run_id, created_at)` and `(parent_id)` from day one; enable `pg_stat_statements`; Grafana panel for query p99 from Phase 3.

## Why this wins (vs. the obvious alternative)

The obvious alternative is "just write the tmux+SDK+JSONL script — you can refactor later." History says you can't. Every team I've watched build an agent harness as a script ends up in month 4 with a state format they can't change without breaking 200 historical runs, a tracing story that's `console.log` plus regex, and a parallelism model where adding a 5th agent breaks the 1st. The "ship fast, refactor later" path optimizes for week 4 and pays compounding interest forever after.

This proposal pays a 3-week tax up front for: typed RPC (you can rewrite the worker without touching the control plane), schema-versioned state (you can change payload shapes without losing history), OTel from day one (you can answer "why did this run cost $14?" in 2027), and a Postgres substrate (the same one used by LangGraph, Inngest, Trigger.dev, DBOS — you're betting with the field, not against it). In month 12, when you want to add a web UI, swap tmux for K8s, or sell the harness pattern as its own product, all four of those moves are afternoons, not quarters.

## Counter-argument

The honest case against this proposal comes from the **Geoffrey Huntley / Ralph-loop school**: "you're describing enterprise infrastructure for a one-person consciousness website. The whole point of the Ralph Loop is that it's 50 lines of bash and a markdown file. Postgres, OTel, JSON-RPC, FSMs — Orlando, you're going to spend 3 weeks building Kafka for a problem that needs `while true; do claude -p; done`."

That critique has teeth. If FRQNCY's content backlog is the bottleneck, this proposal is roughly 8 weeks late to the first published page. A "ship fast" proposal (Hacker, Velocity) gets you authoring loops in week 1 and learns from real outputs by week 2. The Architect path bets that the *second year* is where compounding happens — that the harness becomes a platform Orlando builds *more* on, not a script he eventually replaces. If FRQNCY is a 6-month project, this is over-engineered. If it's a 3-year project that becomes its own thing, this is the only roadmap that doesn't require a rewrite halfway through.

Pick this if you believe the harness is the product. Pick a lighter proposal if you believe FRQNCY's pages are the product and the harness is disposable scaffolding.
