# Proposal 6: Graph First

## Core thesis (1 sentence)

The harness is a graph-builder that happens to ship pages — every loop emits an append-only decision trace, and after eighteen months the FRQNCY Context Graph is a queryable world model of every editorial choice the site has ever made, capable of answering counterfactuals about consciousness-content strategy that no incumbent CMS, analytics tool, or LLM-as-a-service can replicate.

## Lens

Most harness proposals optimize the hot loop: faster agents, more parallelism, better prompts. This one inverts the priority. The CLI is scaffolding; the durable artifact is the trace. If the loop produces a perfect blog post but no reasoning record, we built nothing — Anthropic's next model release deletes our moat. If the loop produces a mediocre blog post but a clean, source-attributed, replayable decision trace, we built compounding capital. Optimize for the exhaust, not the engine.

## Phases

### Phase 0: Schema and event log (Week 1)

- **What to build:** A single append-only `traces.jsonl` per agent worktree plus a `schema.md` defining the canonical decision-trace record (sketched below). One Python emitter (`frqncy_trace.emit()`) wired into every agent's PostToolUse hook. Storage is JSONL on disk, period — no database, no query layer yet. Bi-temporal fields from day one (`event_time` and `ingest_time`) following the Graphiti pattern.
- **Why:** You cannot retrofit a schema onto unstructured logs. The only irreversible mistake in this whole project is failing to capture decision traces in week one. Everything else is recoverable; missing traces are not. Append-only JSONL is the cheapest possible substrate that survives migration to anything.
- **Dependencies:** None. This precedes the harness loop itself. The first commit to `frqncy/harness` is the trace emitter.

### Phase 1: Materialized graph view in DuckDB + Kuzu (Weeks 2-3)

- **What to build:** Two read-side projections of the JSONL log. (1) DuckDB for analytics — `SELECT * FROM traces WHERE decision_type='topic_kept' AND conviction > 0.7`. (2) Kuzu (embedded property graph, Cypher-compatible, no server) for relational walks — "show me every page whose framing was overridden, with the source citation that triggered the override." Both are derived; the JSONL log is truth. Schema-on-read, per Koratana.
- **Why:** DuckDB handles the columnar "what happened in aggregate" queries; Kuzu handles the "what's connected to what" walks. Embedded both — no ops burden, no separate process, runs in the same tmux pane as the agent. This is the 2026 stack: embedded analytics + embedded graph, no server.
- **Dependencies:** Phase 0 schema must be stable enough that derived views aren't constantly rebuilt. A `make rebuild-graph` script that drops both stores and re-projects from JSONL.

### Phase 2: OpenTelemetry GenAI compliance + Langfuse mirror (Weeks 4-5)

- **What to build:** Wrap the trace emitter so every record is also a valid OTel GenAI span (`gen_ai.operation.name`, `gen_ai.agent.name`, `gen_ai.system`). Ship spans to a self-hosted Langfuse instance for the UI — flame graphs, session views, eval scores. Langfuse becomes the human-facing window onto the graph; the JSONL is the source of truth.
- **Why:** OTel GenAI is the lingua franca that prevents lock-in. If we ever want to swap Langfuse for Braintrust or pipe to Galileo for evals, the wire format is portable. This is the standardization gate — past this point, every new agent automatically joins the graph at zero marginal cost.
- **Dependencies:** Phase 1 schema must align with OTel attribute names where they overlap (decisions stay FRQNCY-specific; LLM call spans inherit OTel).

### Phase 3: Conviction and source-authority weights (Weeks 6-8)

- **What to build:** Every node in the graph carries a `source_authority` score (per the Oliv/CRCG model — Michael-the-VP outweighs Jim-the-IC) and every edge carries a `conviction` score (the 0-1 confidence a particular framing won). These are populated by the agents themselves at decision time, not retrofitted. A second agent (the "Auditor") runs nightly and resolves contradictions: when two traces disagree, which precedent governs?
- **Why:** Without weights, the graph is a flat log. With weights, it becomes the "system of reasoning" Foundation Capital describes — and weighted edges are the precondition for simulation in Phase 5. The Auditor is the embodiment of "exceptions become precedent" rather than re-litigating the same edit war every quarter.
- **Dependencies:** Phase 2 stable trace volume (~500 decisions/week minimum) so the Auditor has enough to do.

### Phase 4: Query API + first useful retrievals (Weeks 9-12)

- **What to build:** `frqncy graph ask "..."` CLI that wraps Kuzu Cypher + DuckDB SQL behind natural language. First seven canonical queries (listed below in the 6-month section). Internal-only; no public surface. Every author and every agent reads from the graph before writing — "what did we decide last time about [topic], and why?"
- **Why:** This is when the graph stops being a bookkeeping exercise and starts paying rent. Authors and agents stop re-litigating settled questions. New topic pages cite prior decisions. The fragmentation tax drops to zero internally.
- **Dependencies:** Phase 3 weights make these queries meaningful rather than naive recency-ranked dumps.

### Phase 5: Simulation surface — the world model test (Months 4-6)

- **What to build:** A `frqncy simulate` command that takes a hypothetical ("what if we re-ordered the consciousness section to put practitioner interviews first?") and returns a structured prediction grounded in the trace history: which prior decisions are relevant, which conviction edges would flip, which precedents would be overridden, expected confidence. This is the Koratana test: *if your context graph can't answer "what if," it's just a search index.*
- **Why:** This is the moat. By month six, every editorial change to FRQNCY can be war-gamed against the graph before commit. By month eighteen, the graph is good enough that the simulation outperforms intuition for non-trivial changes. That's the world model.
- **Dependencies:** ~5,000 trace records minimum (~6 months of harness operation at current throughput) for simulation to be non-trivial.

### Phase 6: Graph as published surface (Months 6-12)

- **What to build:** A read-only public view of the FRQNCY decision graph at `frqncy.network/graph`. Not the raw traces — a curated, anonymized walk-through of "why this site looks the way it does." Practitioners see *the reasoning behind the recommendations*, not just the recommendations.
- **Why:** This is the editorial-honesty bar made into a UX feature. Every FRQNCY competitor has the same LLM access we do. None of them can show their work the way the graph lets us. The graph becomes a reason to trust FRQNCY.
- **Dependencies:** Privacy review on practitioner data; legal review on what's publishable.

## Single trace record (sketch)

```jsonc
{
  "trace_id": "tr_2026-04-28_a3f7c2",
  "event_time": "2026-04-28T14:22:08Z",     // when the decision happened
  "ingest_time": "2026-04-28T14:22:09Z",    // when it landed in the log (bi-temporal, per Graphiti)
  "agent": "researcher-3",                   // which loop emitted this
  "session_id": "sess_consciousness_q2",
  "decision_type": "framing_override",       // topic_researched | source_kept | source_discarded | framing_won | framing_override | page_published | a_b_assigned
  "subject": {
    "type": "topic_page",
    "id": "consciousness/dark-night-of-the-soul",
    "ref": "git:8b3c9a1"
  },
  "inputs_considered": [
    {"source": "https://...", "authority": 0.82, "kept": true,  "reason": "primary practitioner account"},
    {"source": "https://...", "authority": 0.31, "kept": false, "reason": "secondary, sensationalist framing"}
  ],
  "alternatives_rejected": [
    {"framing": "pathologize as depression", "conviction_against": 0.91, "reason": "contradicts practitioner corpus"}
  ],
  "decision": {
    "framing": "transitional initiatory phase",
    "conviction": 0.78,
    "precedent_cited": ["tr_2026-03-12_b1e4d8"],     // "why" links — this is the graph
    "overrides": []
  },
  "actor_authority": 0.65,                  // weight of the deciding agent (Auditor can revise)
  "downstream_effects": ["page_published", "internal_link_added:meditation/equanimity"],
  "otel": {
    "gen_ai.operation.name": "invoke_agent",
    "gen_ai.agent.name": "researcher-3",
    "gen_ai.system": "anthropic"
  }
}
```

The fields that matter most: `precedent_cited` (the why-links that build the graph), `alternatives_rejected` (without these you have a System of Record, not a System of Reasoning), and the bi-temporal pair (so you can replay what we believed at any past moment).

## Queries the graph should answer

**At 6 months (~5k traces):**
1. "Show every topic where we overrode our initial framing, and why."
2. "Which sources have authority > 0.7 *and* have been cited in > 5 decisions?"
3. "Which agent has the worst override rate — i.e., whose decisions get reversed most by the Auditor?"
4. "For the consciousness section, what's the precedent chain for current framing on [dark night / kundalini / ego-death]?"
5. "Which A/B-tested page variants won, and what conviction did we have going in vs. coming out?"
6. "What did we believe about [topic] on Jan 1, vs. what we believe today, and what trace caused the shift?"
7. "Surface every decision in the last 90 days with conviction < 0.5 — these are the ones to re-examine."

**At 18 months (~25k traces):**
1. "If we re-ordered the consciousness section to lead with practitioner interviews, which existing precedents would that violate, and which would it reinforce?"
2. "Given a new topic [X], what's the highest-authority framing the graph predicts will win, and at what conviction?"
3. "Which practitioners' citation patterns predict their conviction shifts? (i.e., the world model of FRQNCY's audience)."
4. "Simulate: if we deprecate framing F, which 30 pages need re-editing, in what order, and what's the expected reader-conviction cost?"

## Trend research (with this lens)

1. **Bi-temporal context graphs are now production-grade for agent memory.** Zep's Graphiti — the temporal knowledge graph engine open-sourced in early 2025 — explicitly tracks both *when an event occurred* and *when it was ingested*, with explicit validity intervals on every edge. When new knowledge conflicts with existing knowledge, it doesn't discard — it invalidates with temporal metadata, preserving the precedent chain. This is exactly the "decision trace, not state" primitive the Foundation Capital essay calls for, productized. ([Zep paper](https://arxiv.org/abs/2501.13956), [Graphiti repo](https://github.com/getzep/graphiti), [Neo4j blog on Graphiti](https://neo4j.com/blog/developer/graphiti-knowledge-graph-memory/))

2. **Embedded graph databases (Kuzu, FalkorDB) eliminated the ops cost of running a graph.** Kuzu is an embedded property graph, no server, Cypher-native, with vector and full-text search built in — runs in-process exactly like SQLite. FalkorDB hits sub-140ms queries via GraphBLAS sparse-matrix math and is the default graph backing for mem0 in 2026. There is no longer any infrastructure excuse to skip the graph. ([Kuzu GitHub](https://github.com/kuzudb/kuzu), [FalkorDB GitHub](https://github.com/FalkorDB/FalkorDB), [mem0-falkordb post](https://www.falkordb.com/blog/graph-memory-llm-agents-mem0-falkordb/), [State of AI Agent Memory 2026](https://mem0.ai/blog/state-of-ai-agent-memory-2026))

3. **OpenTelemetry GenAI semantic conventions stabilized enough that wire-format lock-in is now avoidable.** The `gen_ai.operation.name = invoke_agent` / `create_agent` span model is shipped (still experimental but adopted by Datadog, Langfuse, Braintrust, MLflow). Emit OTel-compliant spans and you can swap observability backends without rewriting the trace emitter. ([OTel GenAI agent spans](https://opentelemetry.io/docs/specs/semconv/gen-ai/gen-ai-agent-spans/), [Datadog OTel GenAI support](https://www.datadoghq.com/blog/llm-otel-semantic-convention/))

4. **Event sourcing for autonomous agents was formalized in 2026.** The ESAA paper (Feb 2026) proposes exactly the architecture this proposal advocates: agents emit only structured intentions in validated JSON; a deterministic orchestrator persists events in an append-only `activity.jsonl`; replay verification with hashing ensures forensic traceability. The two case studies (single-agent landing page; 4-agent clinical dashboard) are roughly the scale FRQNCY will hit by month three. ([ESAA paper](https://arxiv.org/abs/2602.23193))

5. **Foundation Capital's "one month in" follow-up confirms the thesis.** Gupta and Garg's late-January 2026 follow-up reports that "context graphs" became one of the most-discussed AI ideas of the year, with HubSpot's Dharmesh Shah ("a system of record for decisions, not just data") and Box's Aaron Levie ("the era of context") publicly endorsing the frame. Arize shipped a product piece on turning agent traces into "durable business assets." This isn't a fringe bet anymore. ([Context graphs, one month in](https://foundationcapital.com/context-graphs-one-month-in/), [Arize on context graphs](https://arize.com/blog/how-context-graphs-turn-agent-traces-into-durable-business-assets/))

6. **PlayerZero's "two clocks" framing is the cleanest statement of the schema problem.** Koratana: every system has a *state clock* (what's true now) and an *event clock* (what happened, in what order, with what reasoning); we built infrastructure for the first and almost none for the second. FRQNCY's git history is a state clock. The trace log is the event clock. Both are needed; only the second compounds. ([PlayerZero context graphs](https://playerzero.ai/campaigns/context-graphs), [PlayerZero engineering world model](https://playerzero.ai/resources/production-world-model-ai-software-defect-prediction))

7. **DuckDB + Parquet is the default analytics layer for agent logs in 2026.** In-process columnar engine, regex-extract first-class for half-structured JSON, predicate pushdown into Parquet so you can leave traces on disk forever and query them in milliseconds. No "log warehouse" needed. ([DuckDB for log analytics](https://medium.com/@jickpatel611/duckdb-for-log-analytics-faster-than-your-coffee-16f106b6e0df), [DuckDB ecosystem Jan 2026](https://motherduck.com/blog/duckdb-ecosystem-newsletter-january-2026/))

## Top 3 risks of this approach

1. **Schema premature lock-in.** If we get the trace shape wrong in week one, every record after is mis-typed and the graph is poisoned. Mitigation: bi-temporal fields make re-projection cheap; everything downstream is derived; we explicitly version the schema (`schema_version: 1`) and accept that v1 traces will need a migration pass at month three.
2. **The graph becomes a graveyard.** Traces accumulate, nobody reads them, the simulation surface never gets built because authors keep doing things by intuition. Mitigation: Phase 4's `frqncy graph ask` is gated as a *hard requirement* — every agent prompt must include a graph-query step, no exceptions. If the graph doesn't pay rent by month three, kill the project.
3. **Conviction/authority scores are subjective and biased.** Garbage weights produce confident wrong simulations — worse than no graph. Mitigation: the Auditor agent runs continuously and is itself audited; conviction is calibrated against actual A/B outcomes (when a "won" framing later loses a test, prior conviction is retroactively penalized). We treat conviction the way a forecasting org treats Brier scores.

## Why this wins (vs. the obvious alternative)

The obvious alternative is **CLI First**: build the tmux/gtr loop, ship pages fast, capture logs as a side effect, "we'll structure them later." This is what every other proposal in this stack will probably argue for, and it's what most teams actually do.

Graph First wins because *later never comes*. The teams that build observability after the fact end up with terabytes of unstructured stdout and no way to ask "why did we decide that?" six months later. They rebuild from scratch — except by then the agents have generated 10,000 commits with no decision traces, and the rebuild can only be forward-looking. The compounding asset never compounds.

CLI First optimizes for *throughput today*. Graph First optimizes for *the value of a trace in 18 months*. If FRQNCY succeeds, the throughput is fungible (any harness can write Astro pages); the trace history is not (no one else has FRQNCY's editorial reasoning). If FRQNCY fails, neither matters. The expected-value calculation is asymmetric.

The other answer: this is the only proposal where the harness doesn't deplete. Every other roadmap has a steady-state — a loop running. Graph First has a *trajectory* — every loop makes the next loop smarter, because the graph it reads from is bigger and better-weighted. That's the world model, and that's the only thing in this whole architecture that can't be reproduced by a better Anthropic model dropping next quarter.

## Counter-argument

A serious operator would say: **"This is the wrong roadmap because you're a one-person consciousness-content site, not an enterprise selling a Customer Relationship Context Graph."**

The Foundation Capital essay is a venture-scale market thesis aimed at startups capturing decision traces in deal desks and revops — places where the fragmentation tax is measured in millions of dollars per year and where six analysts disagreeing about a renewal forecast is a real business problem. FRQNCY's editorial decisions are *one person's editorial decisions* (and a few agents'). The "graph as exhaust" framing assumes a workforce generating heterogeneous trajectories; an autonomous loop generating its own traces and reading its own traces is a closed system that may just amplify its own biases.

The honest version of this objection: the graph might never reach the threshold where simulation is meaningful. Five thousand traces from a single editorial perspective might cluster so tightly that "what if?" queries return only "the same thing you already think." In which case Graph First was over-engineering, and CLI First was right — ship pages, learn from analytics, throw the agents away when better ones come out.

The rebuttal: even at small scale, the trace log is the only thing that survives Anthropic shipping a better model. And the simulation surface is *optional*; Phases 0-4 pay for themselves on retrieval alone ("what did we decide last time?"). Phase 5 is the upside case. The downside case is still strictly better than the CLI-First downside, which is having no log at all.

But Orlando should hold this objection in mind. If, by month four, the graph is producing only tautologies, the answer is to widen the input — invite practitioners to author traces, ingest external sources as first-class graph citizens — not to sunset the project. The graph is the moat; the moat just needs more water.
