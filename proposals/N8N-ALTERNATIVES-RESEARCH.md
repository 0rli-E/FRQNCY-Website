---
title: Workflow runtime comparison for FRQNCY OS
date: 2026-04-28
status: draft
author: research subagent (Opus 4.7)
related:
  - proposals/FRQNCY-OS-STATUS.md
  - frqncy-harness/proposals/HARNESS-AS-PHASE2-SUBSTRATE.md
  - proposals/EXECUTION-PLAN-90D.md
---

## TL;DR

**Stay on n8n.** It is the only candidate that scores well on every FRQNCY-specific axis: a one-click Telegram trigger node, first-class AI Agent + LangChain memory nodes, MIT-equivalent self-hosted licence (Sustainable Use), $0 software cost on a $7/mo Hostinger VPS, native Supabase Postgres node for pgvector reads/writes, and an HTTP Request node that shells to the Hermes gateway for the harness substrate without ceremony. The two runners-up — **Activepieces** (true MIT, near-feature-parity, lower lock-in tail risk) and **Windmill** (fastest engine, polyglot, AGPLv3) — are interesting if n8n's recent licence drift becomes a problem, but neither is worth a migration today. **Temporal, Inngest, Trigger.dev, Pipedream, and Cloudflare Workflows are all wrong shape** for a Telegram-fronted, persona-driven, solo-operated org running on a $27/mo budget.

## Scoring matrix

Each criterion scored 0 (bad fit), 1 (workable), or 2 (excellent). Higher is better. Weighted in priority order — Telegram fit and self-hosting carry the most decision weight even though all rows are 0/1/2.

| Criterion | n8n | Temporal | Inngest | Trigger.dev | Activepieces | Pipedream | Windmill | CF Workflows |
|---|---|---|---|---|---|---|---|---|
| 1. Telegram-bot fit | 2 | 0 | 1 | 1 | 2 | 2 | 1 | 1 |
| 2. AI agent node parity | 2 | 0 | 1 | 1 | 2 | 1 | 1 | 0 |
| 3. Self-hosting on $10 VPS | 2 | 0 | 2 | 1 | 2 | 0 | 2 | n/a (1) |
| 4. Harness CLI shell-out | 2 | 1 | 1 | 1 | 2 | 0 | 2 | 0 |
| 5. Cost at FRQNCY scale | 2 | 1 | 1 | 1 | 2 | 0 | 2 | 1 |
| 6. Lock-in risk (OSS exit) | 1 | 2 | 2 | 2 | 2 | 0 | 2 | 0 |
| 7. Maturity | 2 | 2 | 2 | 1 | 1 | 2 | 1 | 1 |
| 8. Supabase memory r/w | 2 | 1 | 1 | 1 | 2 | 2 | 2 | 1 |
| **Total / 16** | **15** | **7** | **11** | **9** | **15** | **7** | **13** | **5** |

Notes on the row-3 Cloudflare Workflows score: there's no VPS to run it on — the question reframes as "does it fit FRQNCY's deploy stack." It does, but at the cost of mandatory vendor coupling (score 0 on row 6).

## Per-candidate deep dive

**n8n.** The current default and the matrix winner. Telegram trigger node auto-registers the webhook the moment a workflow activates ([n8n docs](https://n8n.io/integrations/telegram-trigger/)) — Phase 2B already depends on this. AI Agent nodes wrap LangChain with first-class Memory sub-nodes including Supabase Vector Store, so pgvector long-term memory in Phase 2A is a one-credential job. Self-hosted Community Edition is unlimited executions on the $7/mo Hostinger KVM 2 already paid for. The licence is "Sustainable Use" not OSI-open, which is the only real strike — but commercial competition with n8n GmbH is a non-issue for a solo personal org. Mature, 400+ nodes, well-trodden. ([n8n pricing 2026](https://www.lowcode.agency/blog/n8n-pricing))

**Temporal.** A workflow engine for engineering teams running mission-critical pipelines, not for a solo operator running a Telegram bot. Apache 2.0 and self-hostable, but the operational floor is "1-2 SREs and ~$3,500/mo infra" per the cost analysis ([Temporal Cloud growth tier $200/mo](https://temporal.io/pricing)). No Telegram primitive, no AI agent abstraction, no memory sub-nodes — every persona becomes hand-written workflow code. Code-first is fine; reinventing forty n8n nodes from scratch when you have ~100 hours of total Phase 2 budget is not. Temporal is the right answer if FRQNCY were a 10-engineer fintech. It isn't.

**Inngest.** Apache 2.0 (after a 3-year delayed-OSS clock per their fair-source initiative), self-hosting reached 1.0 in January 2026 ([blog post](https://www.inngest.com/blog/inngest-1-0-announcing-self-hosting-support)). Step-based durable execution with automatic retries — genuinely nice for the kind of multi-step persona dispatching FRQNCY does. But it's still TypeScript/Python code, not a visual editor. No Telegram integration without writing the bot loop yourself. AI agent constructs exist (`step.ai`) but are thinner than n8n's. Strong second-tier option if FRQNCY ever moves off visual workflows entirely; not justified now.

**Trigger.dev.** v3 went open-access early 2025, Apache 2.0, Docker-deployable on a single VPS ([self-hosting docs](https://trigger.dev/docs/self-hosting/overview)). Code-first like Inngest; explicitly AI-aware, with first-class realtime streaming and idempotency. Same downside: no Telegram node, no visual canvas — every persona is a `task` written in TypeScript. The free cloud tier is a generous $5 monthly credit but cloud is irrelevant given the self-host story. Best of the code-first three for AI agent ergonomics, but the Telegram + visual gap is the same as Inngest's. Park for "if we outgrow n8n's visual editor."

**Activepieces.** True MIT licence Community Edition ([licence page](https://www.activepieces.com/docs/about/license)) — strictly cleaner than n8n's Sustainable Use. Telegram Bot piece exists ([Activepieces Telegram](https://www.activepieces.com/pieces/telegram-bot)). MCP-first AI agent posture (~400 MCP servers wired in). Self-hostable on the same Hostinger VPS, unlimited tasks. The honest assessment: this is the migration target if n8n GmbH ever does something hostile with their licence. Today, n8n's ecosystem maturity (400+ nodes, larger community, longer track record) tips the call. Worth a half-day prototype in Phase 4 to know the migration path is real.

**Pipedream.** Hosted-first, with a generous free tier (100 credits/day) and $29/mo Plus tier ([pricing](https://pipedream.com/pricing)). The connector library is genuinely big. But there is no production self-host story — you don't run Pipedream on your VPS, you run on Pipedream's. That's a hard fail on lock-in (criterion 6 = 0), credits-per-run pricing breaks at FRQNCY scale (hundreds → thousands of runs/day rapidly burns the free tier), and shelling to the harness CLI requires their compute environment, which fights the whole "harness is the substrate" architecture. Not viable.

**Windmill.** AGPLv3, self-hostable, community claims fastest workflow engine (13x Airflow per their README), polyglot (TS / Python / Go / PHP / Bash / SQL / Rust). This is the engineer's choice on the list — closest to "Temporal but visual + scriptable." Cloud free tier 1,000 runs/day, self-host unlimited. Telegram integration exists but is thinner than n8n's; AI agent support is real but less polished than n8n's LangChain wrapper. AGPLv3 is more permissive in spirit but actually triggers more legal anxiety at companies than MIT. Strong third-place finisher. The case to switch would be "n8n got slow at thousand-runs/day" — premature today.

**Cloudflare Workflows.** Now GA as of February 2026 ([CF blog](https://blog.cloudflare.com/workflows-ga-production-ready-durable-execution/)). Native to FRQNCY's existing CF Pages deploy. Pricing follows Workers Standard with the genuinely clever feature that *waiting on third-party APIs costs $0* — that's good for the long Council-veto wait pattern. But: no Telegram primitive, no AI agent abstraction, no visual editor, and every workflow is a Workers script. Worse, it locks the whole runtime to Cloudflare — if CF deprecates the product or jacks pricing, FRQNCY has to rewrite. Dead-on-arrival for the Phase 2 use case; worth revisiting if FRQNCY ever needs purely event-driven side-workflows on its existing CF infrastructure.

## "If we pick n8n" / "If we pick X" — decision implications

**If we stay on n8n (recommended):** Phase 2A (pgvector) ships in ~1 hour, Phase 2B' (Telegram + Hermes/harness) in ~6 hours, Phase 2C' (Learning Agent) in ~6 hours, exactly as `HARNESS-AS-PHASE2-SUBSTRATE.md` lays out. The risk we accept is licence drift — n8n GmbH could push the Sustainable Use licence in a more restrictive direction, in which case our exit ramp is Activepieces. We mitigate by (a) keeping every persona's system prompt as plain markdown in `FRQNCY-System-Prompts.html`, decoupled from n8n internals, (b) keeping all state in Supabase + harness traces, not n8n's DB, and (c) using n8n's HTTP Request node pattern (not the proprietary AI Agent node tool surface) wherever we don't need LangChain memory specifically. That keeps the workflow definitions ~80% portable.

**If we pick Activepieces:** Same architectural shape, cleaner licence, slightly less mature ecosystem. Migration would mean re-creating ~6-10 workflows and re-wiring credentials. The Supabase pgvector integration becomes manual HTTP Request calls instead of a first-class Memory sub-node — that's the biggest concrete regression. ~1 day of work to migrate Phase 2's footprint. Not worth doing today; worth knowing it's a 1-day move not a 1-week one.

**If we pick Windmill:** Different architectural shape. Personas become small TypeScript or Python scripts, orchestrated by Windmill's flow builder. We lose the visual AI Agent node abstraction and gain real code with proper version control. Fits well *with* the harness — Windmill scripts can `import` from the harness package directly instead of shelling out. ~2-3 days to migrate Phase 2's footprint. Compelling only if Orli's preference shifts toward code-first or if n8n becomes a performance bottleneck (unlikely at hundreds-of-runs/day).

## Migration cost if we want to switch later

| From → To | Effort | Notes |
|---|---|---|
| n8n → Activepieces | ~1 day | Workflow shapes are nearly isomorphic; redo Telegram + Supabase wiring |
| n8n → Windmill | ~2-3 days | Re-implement personas as scripts; flow builder for orchestration |
| n8n → Trigger.dev / Inngest | ~3-5 days | Full code-first rewrite; lose visual editor entirely |
| n8n → Temporal | ~1-2 weeks | Re-architect around workflow/activity model; build Telegram + AI plumbing from scratch |
| n8n → Cloudflare Workflows | ~1 week | Rewrite as Workers scripts; lose self-host option |

Things that travel cleanly across all targets: Supabase schema (`agent_outputs`, `approvals`, `agent_memory`, `agent_learnings`, `agent_versions`), the 32 system prompts, the harness trace store, and the Hermes daemon. Things that don't: n8n-specific node configs, n8n credentials, Memory sub-node attachments. **The architecture decision that matters most for portability is "the harness is the substrate, n8n is just the conductor"** — exactly the substrate proposal's framing. As long as we honour that, swapping conductors is a contained migration.

## Final recommendation

Stay on n8n. The combined weight of (a) one-step Telegram, (b) first-class AI Agent + Supabase Memory nodes, (c) $0 software on the already-paid VPS, (d) clean shell-out to the harness via HTTP Request → Hermes gateway, and (e) 90 hours of solo Phase 2 budget that needs to ship working software, makes the calculus unambiguous. Activepieces is the parallel-universe answer with marginally better licence hygiene; Windmill is the answer if FRQNCY were one engineer further along the polyglot-code-first axis. Neither marginal upgrade is worth a migration before Phase 2 has shipped.

The single non-negotiable: **the harness substrate proposal must land regardless of which conductor we run.** That's what makes this decision reversible. If we wire personas through `frqncy-harness chat/agent` calls instead of letting n8n hit Groq/OpenRouter directly, the trace store stays the source of truth, and any future migration is a workflow-redraw, not an architectural rebuild.

## Open questions Orlando should answer before locking the choice

1. **Licence tolerance.** Is n8n's Sustainable Use licence acceptable for FRQNCY's posture, or should FRQNCY's substrate be strictly OSI-open? (If the latter → Activepieces.)
2. **Visual vs code editor.** Will Orli ever want to edit workflows herself on the phone, or is "Orli touches Telegram, never n8n" the permanent shape? (If "never n8n" → code-first runtimes become viable; if "occasionally" → visual stays mandatory.)
3. **Scale ceiling.** What's the realistic 12-month run volume? If hundreds/day → n8n trivially. If we're projecting >10,000 runs/day by Q4 → Windmill's perf advantage starts to matter.
4. **VPS vs CF stack consolidation.** Is Hostinger the long-term home, or does FRQNCY want to consolidate everything onto Cloudflare's stack eventually? (If CF consolidation → revisit CF Workflows in Phase 4.)
5. **Council prompt caching.** The substrate proposal calls for `anthropic` direct API for Council voices (prompt caching). Does whichever runtime we pick handle the caching behaviour transparently when shelling to the harness, or do we need custom session handling? (Worth a 30-min spike before Phase 2B'.)
6. **Hermes gateway port and auth.** What localhost port does Hermes listen on, and does n8n's HTTP Request node need an auth token in the header? (Operational, but blocks the first end-to-end test.)

Sources (current as of 2026-04-28):
- [n8n Pricing 2026 — Lowcode.agency](https://www.lowcode.agency/blog/n8n-pricing)
- [n8n Telegram trigger integration](https://n8n.io/integrations/telegram-trigger/)
- [Temporal Pricing](https://temporal.io/pricing)
- [Inngest 1.0 self-hosting announcement](https://www.inngest.com/blog/inngest-1-0-announcing-self-hosting-support)
- [Trigger.dev self-hosting docs](https://trigger.dev/docs/self-hosting/overview)
- [Activepieces licence](https://www.activepieces.com/docs/about/license)
- [Activepieces Telegram Bot piece](https://www.activepieces.com/pieces/telegram-bot)
- [Pipedream pricing](https://pipedream.com/pricing)
- [Windmill pricing](https://www.windmill.dev/pricing)
- [Cloudflare Workflows GA blog](https://blog.cloudflare.com/workflows-ga-production-ready-durable-execution/)
- [Cloudflare Workflows pricing reference](https://developers.cloudflare.com/workflows/reference/pricing/)
