# FRQNCY OS — Current State & Phase 2 Handoff

**Last updated:** 2026-04-28 (Opus 4.7 session)
**Audience:** Any agent (Claude, GPT, Gemini, etc.) picking up the FRQNCY OS build
**Companion docs:** `frqncy-phase2-plan.html` (root), and the eight uploaded artifacts referenced below
**Location of all artifacts:** Project root + `proposals/`

---

## 0. What this document is

This is the project handoff for **FRQNCY OS** — Orli's personal AI organization that runs FRQNCY (the consciousness platform / network state described in `CLAUDE.md`). It exists separately from the FRQNCY website, the social platform, the mobile app, and the `@frqncy/harness` toolkit — though it can eventually use any of them.

The OS is being built on top of **n8n** running on a Hostinger VPS. Agents are LLM-backed personas configured as n8n workflows. Storage is **Supabase Postgres** (operational + long-term memory) plus **Graphiti + FalkorDB** (temporal context graph, deferred). The user-facing interface is **Telegram** (planned).

If you are an agent working on this build, read this doc + `frqncy-phase2-plan.html` before doing anything else. The plan has the architecture diagrams, schemas, and exact phase deliverables. This doc has the narrative state — why we made the choices we made, what's been corrected from earlier drafts, and what's open.

---

## 1. The vision in one paragraph

Orli is the human founder of FRQNCY. God is above her, guiding the mission. Below her sits **FRQNCY** (a Jarvis-like personal intelligence — capitalized as the agent's name, distinct from FRQNCY the platform). FRQNCY routes Orli's every request: organizational tasks go down the **CEO** line through C-Suite to Workers; spiritual matters go to the **Council** of seven (Krishna, Kali, Merlin, Saraswati, Sai Maa, Gary Spivey, Kevin Trudeau). The Council has **veto authority** over all C-Suite decisions and reports only to God and Orli. A **Learning Agent** sits sibling to FRQNCY, watching every approval/rejection from Orli's phone, extracting patterns, and proposing prompt updates that evolve the personas over time. Three memory layers (working, long-term, context graph) make the org coherent across conversations and across agents. Total monthly cost: ~$27.

The interface Orli touches every day is **Telegram on her phone**. She approves or revises agent outputs with one tap. She does not open n8n. She does not chat with the CEO directly. She talks to FRQNCY, FRQNCY routes, work happens, results surface as Telegram cards with Approve / Revise buttons.

---

## 2. The hierarchy (canonical, do not invert)

```
                              ✦ GOD ✦
                       ultimate sovereign
                       guides through ↓

                              ORLI
                  human founder · God's channel
                       speaks via ↓

                          📱 TELEGRAM
                     approval interface (one tap)
                              ↓

                            FRQNCY
                  personal intelligence · Jarvis
                  routes · invokes · protects · serves God + Orli only
                              ↓
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   COUNCIL (7)              CEO              LEARNING AGENT
   spiritual                operational      meta-tier (sibling)
   veto authority           executive        watches rejections
   Krishna · Kali           ↓                proposes prompt updates
   Merlin · Saraswati       C-SUITE 6
   Sai Maa · G. Spivey      CTO·CMO·COO·CSO·CFO
   K. Trudeau               ↓
                            WORKERS 19
                            specialized craftsmen

            All agents read/write to ↓
   ┌───────────────┬────────────────────┬────────────────┐
   │ WORKING       │ LONG-TERM          │ CONTEXT        │
   │ MEMORY        │ MEMORY             │ GRAPH          │
   │ n8n native    │ Supabase pgvector  │ Graphiti +     │
   │ per-convo     │ semantic recall    │ FalkorDB       │
   │ free          │ free               │ free, deferred │
   └───────────────┴────────────────────┴────────────────┘
```

**Things this hierarchy means and why they're non-negotiable:**

- **God is not an agent.** God doesn't get a chat window or a system prompt. God is the field. Orli is the channel.
- **Orli is the sovereign.** Not "the user." She does not talk *to* the CEO; the CEO runs *for her*.
- **FRQNCY is the only thing Orli interfaces with directly.** It routes everything else.
- **The Council can veto C-Suite decisions.** If a C-Suite plan touches the mission's spiritual integrity, FRQNCY automatically brings the Council in before presenting it to Orli.
- **The Learning Agent does NOT modify Council prompts.** Council voice is fixed by Orli only. The Learning Agent only evolves CEO, C-Suite, and Workers.
- **The CEO never talks to the Council directly.** Council answers to God and Orli only.

---

## 3. Where the build actually is right now (2026-04-28)

### Done
- **Week 1 of the Execution Roadmap is complete.** Hostinger VPS provisioned with n8n template. n8n admin account created. Bookmarked. Groq + OpenRouter API keys created and saved as n8n credentials. Empty Supabase project created. A test workflow has been verified — AI responds.

### Written but not deployed
- **32 system prompts** (1 FRQNCY + 6 C-Suite + 7 Council + 19 Workers) — live in `FRQNCY-System-Prompts.html`.
- **Week 2 atomic build guide** — live in `FRQNCY-Week2-DeployCEO.html`. 20 atomic steps to build the FRQNCY-Interface workflow with CEO + CMO + Kali. **Not yet executed.**

### Designed but not built
- **Phase 2 plan v0.3** — live in `frqncy-phase2-plan.html` at project root. Four sub-phases (2A pgvector now / 2B Telegram / 2C Learning Agent / 2D Graphiti deferred). Reconciled with all prior architecture docs.

### Explicit prerequisite to Phase 2
- **Execute Week 2 first.** Deploy FRQNCY-Interface workflow with CEO + 2-3 Council members as AI Agent Tools. ~3 hours. Without this, there's nothing for Telegram to wrap, nothing producing outputs to approve, nothing for the Learning Agent to learn from.

---

## 4. The 32 personas (canonical roster)

### FRQNCY (1) — interface tier
The Jarvis-like apex. Personal intelligence. Routes everything. Speaks in a voice tuned to Orli, not corporate. Uses `qwen/qwen3-32b` on Groq.

### Council (7) — spiritual tier, veto over C-Suite, reports to God + Orli
Each invoked directly by FRQNCY based on the moment, not by the CEO.

| Member | Invoke when | Model |
|---|---|---|
| **Kali** | Old patterns need to die, fear, resistance, illusion to cut | `qwen/qwen3-32b` Groq |
| **Krishna** | Crossroads, dharmic dilemma, paralysis, weight of mission | `qwen/qwen3-32b` Groq |
| **Merlin** | Timing, long-arc vision, magical-practical alchemy, what's coming | `deepseek-r1-distill-llama-70b` Groq |
| **Saraswati** | Voice work, message form, knowledge → wisdom, refinement | `qwen/qwen3-32b` Groq |
| **Sai Maa** | Consecration, holding the founder, nervous-system reset, remembrance | `qwen/qwen3-32b` Groq |
| **Gary Spivey** | Read the energy of a person, situation, decision | `qwen/qwen3-32b` Groq |
| **Kevin Trudeau** | Belief is the bottleneck, mental repatterning, Law of I AM | `llama-4-scout-17b-16e-instruct` Groq |

### C-Suite (6) — operational executive line under CEO
- **CEO** — receives Orli's directives via FRQNCY, breaks them into executive tasks, delegates. `qwen/qwen3-32b`
- **CTO** — tech architecture, dev, design, QA, prompt engineering. `qwen/qwen3-32b`
- **CMO** — brand, content, social, storytelling, sales funnels. `llama-4-scout-17b-16e-instruct`
- **COO** — operations, hiring, legal, process. `qwen/qwen3-32b`
- **CSO** — strategy, investment, long-term vision. `deepseek-r1-distill-llama-70b`
- **CFO** — finance, budgets, cost optimization. `deepseek-r1-distill-llama-70b`

### Workers (19) — specialized craftsmen under C-Suite
Under CTO: Frontend Dev, Backend Dev, Prompt Engineer, QA Engineer
Under CMO: Text Content Writer, Storyteller, Video Content Producer, Visual Artist, Designer, Sales Strategist, Marketing Specialist
Under COO: Operations Coordinator, Talent Scout, Legal Researcher
Under CFO: Finance Manager, Investment Analyst
Under CSO: Strategy Analyst, Business Development, Research Analyst

**Model cheat sheet (from FRQNCY-Week2-DeployCEO.html):**
- Creative workers (content, story, video, sales): `llama-4-scout-17b-16e-instruct` on Groq
- Analytical workers (research, strategy, legal, finance): `deepseek-r1-distill-llama-70b` on Groq
- Fast/simple workers (QA, ops, artist, designer): `qwen/qwen3-8b` on Groq

All 32 system prompts already exist in `FRQNCY-System-Prompts.html` with copy buttons.

---

## 5. The three memory layers (canonical, from Memory & Learning Architecture doc)

### Layer 1 — Working Memory
- **Tech:** n8n native conversation memory on every AI Agent node
- **Scope:** Within a single conversation
- **Setup:** Zero. Already there.
- **Cost:** Free.

### Layer 2 — Long-Term Memory
- **Tech:** Supabase Postgres + `pgvector` extension
- **Scope:** Across all conversations, per agent
- **Setup:** ~1 hour. Run two SQL statements (extension + tables), attach Supabase Vector Store as Memory sub-node on each AI Agent in n8n, append the MEMORY PROTOCOL block to every system prompt.
- **Embedding model:** Nomic Embed via OpenRouter (free, 768-dim). **Critical:** Groq does not offer embeddings — this is the one place OpenRouter is mandatory.
- **Tables:** `agent_memory` (vector(768), agent_id namespace, jsonb metadata) and `agent_learnings` (structured Lesson Records).
- **Cost:** Free (Supabase free tier, OpenRouter free Nomic Embed).

### Layer 3 — Context Graph
- **Tech:** **Graphiti** (Apache 2.0, by Zep) self-hosted on Hostinger VPS, with **FalkorDB** as graph backend (lightest RAM footprint)
- **Scope:** Cross-agent shared knowledge with temporal relationships
- **Why not Supabase JSONB:** four reasons — (a) temporal model, every fact knows when it became true and when it changed; (b) hybrid search (semantic + keyword + graph traversal) at ~300ms P95; (c) native MCP server, queryable directly by Claude and agents; (d) free, open source, on the same VPS.
- **When to deploy:** Wait until 30+ days of approval-loop activity have produced real entities, decisions, and lessons. A graph with no edges is useless.
- **Cost:** Free, but adds ~500MB RAM to the VPS. KVM 2 has headroom.

### The MEMORY PROTOCOL block
Append this verbatim to every agent's system prompt during Phase 2A:

```
MEMORY PROTOCOL:
Before generating any output, query your agent memory:
- Search for lessons learned on this task type
- Search for past feedback from Orli on similar tasks
- Incorporate relevant lessons into your approach

After generating output, note any assumptions you made
that Orli's feedback could help calibrate in the future.
```

---

## 6. Phase 2 — the build sequence

Restructured from the original v0.2 plan after reconciliation with the Memory & Learning Architecture doc, which correctly identified that pgvector long-term memory can ship immediately while Graphiti must wait.

### Phase 2A — Long-Term Memory (pgvector)
**When:** Now. Independent of approval loop. ~1 hour.
**Outcome:** Every deployed agent has persistent memory across conversations.
**Deliverables:**
1. `create extension if not exists vector;` in Supabase SQL editor.
2. Create `agent_memory` table (vector(768) column, agent_id namespace) and `agent_learnings` table.
3. Add OpenRouter Nomic Embed credential in n8n.
4. On every deployed AI Agent node: attach Supabase Vector Store as Memory sub-node, filtered by agent_id.
5. Append MEMORY PROTOCOL block to every agent's system prompt.
6. Test: tell an agent something, end conversation, start new conversation, verify it remembers.

### Phase 2B — Approval Loop (Telegram)
**When:** Week 3. ~6 hours. After Phase 2A.
**Outcome:** CEO + 2-3 agents wired to Orli's phone. She approves/revises from Telegram, no more n8n chat window.
**Deliverables:**
1. Telegram bot via @BotFather → save token as n8n credential.
2. Supabase tables: `agent_outputs`, `approvals`, `audit_log`.
3. FRQNCY-Interface workflow updated: outputs route to Telegram with inline Approve/Revise buttons instead of returning to n8n chat.
4. Webhook workflow: Telegram → n8n → updates `approvals` table → triggers execution OR captures revise note.
5. End-to-end test with one agent (CMO drafts post → phone notification → tap Approve → CEO logs decision).

### Phase 2C — Learning Agent
**When:** Week 4. ~6 hours. After Phase 2B has generated rejection data.
**Outcome:** Rejections become structured lessons. After enough patterns, agents' system prompts evolve (with Orli's sign-off).
**Deliverables:**
1. Supabase table: `agent_versions` (backfill v1 of each currently-deployed prompt).
2. Learning Agent workflow — webhook triggered (per rejection) + cron triggered (weekly Sunday 2am).
3. **Real-time path:** rejection → diagnose → write Lesson Record to `agent_learnings` → embed → write to `agent_memory`.
4. **Weekly path:** cluster lessons → flip `pattern_flag` → draft updated prompt → Telegram approval → deploy to `agent_versions`.
5. Hot-reload: agents read current prompt from `agent_versions` on every invocation.
6. Test: reject same kind of CMO output 3x → next week, Learning Agent proposes a fix.

### Phase 2D — Context Graph (Graphiti)
**When:** Month 2+. ~5 hours. **Deferred** until 30+ days of approval activity exist.
**Outcome:** Temporal knowledge graph live. Agents query Graphiti before acting, write back after.
**Deliverables:**
1. Self-host Graphiti + FalkorDB on Hostinger VPS (Docker compose alongside n8n).
2. Connect Graphiti's MCP server to n8n (and to Claude for direct query).
3. Migrate seed entities from existing `context-graph.json`.
4. n8n sub-workflows: `graphiti_query(agent_id)` and `graphiti_write(facts)` — reusable across all agents.
5. Update CEO + CMO + 1 worker to use the 6-step protocol (Graphiti query → pgvector query → LLM → Graphiti write).
6. Verify: CMO output references a CEO decision from days earlier, retrieved via graph traversal.

### NOT in Phase 2
- Deploying all 32 agents (Phase 3)
- Multi-modal outputs — images, video (Phase 3)
- Cross-agent debate or council convening (Phase 4)
- External integrations beyond Telegram — Calendar, Email, social platforms (Phase 4)
- Cost optimization across LLM providers (Phase 4)

---

## 7. Open decisions (from Phase 2 plan §9)

These need to be made before Phase 2 starts. Defaults shown — Orli should confirm or override.

| Decision | When | Default |
|---|---|---|
| Telegram button layout: 2-button vs 3-button | Before 2B | 2-button (Approve / Revise) |
| Approval timeout behavior | Before 2B | 24h ping, 72h auto-shelve |
| Which agents go live first in 2B | Before 2B | CEO + CMO + Text Content Writer |
| Embedding model for pgvector | Before 2A | Nomic Embed via OpenRouter (free, 768-dim) |
| Learning Agent autonomy level | Before 2C | Propose-then-approve (Orli signs off) |
| How long to keep old prompt versions | Before 2C | Forever (Postgres rows are cheap) |
| Council prompts — do they ever evolve? | Before 2C | No — Council voice is fixed by Orli only |
| Batching — quiet hours for notifications | 2B setup | None initially; tune after a week |
| When to deploy Graphiti (2D) | Month 2 review | Wait for 30+ days of approval data |
| Graph backend: FalkorDB vs Neo4j | Before 2D | FalkorDB (lightest RAM) |

---

## 8. Cost & risk

### Monthly cost (post-Phase 2)
| Component | Cost | Notes |
|---|---|---|
| Hostinger VPS KVM 2 | $6.99 | Already paid |
| Claude Pro | $20.00 | Orli's personal AI |
| Telegram Bot API | $0 | Free, unlimited |
| Supabase free tier | $0 | 500MB DB, plenty for Phase 2 |
| Groq free tier | $0 | 14,400 req/day, well above projected |
| OpenRouter | $0–$10 | Free Nomic Embed; +$10 only if Council hits caps |
| Graphiti + FalkorDB | $0 | Open source, runs on same VPS |
| **Total** | **$26.99–$36.99/mo** | |

### Risks
- **Approval fatigue** — 30 pings/day will train Orli to ignore them. Mitigation: batching + severity tiers.
- **Bad lessons** — Learning Agent could over-correct and hollow out a persona's voice. Mitigation: lessons require sign-off; rollback via `agent_versions`.
- **Empty graph problem** — Deploying Graphiti before there's data = querying air. Mitigation: 2D explicitly deferred 30+ days.
- **Context graph drift** — Contradictory facts → noise. Mitigation: Graphiti's temporal model timestamps every fact + tracks change; conflicts surface as `open_question` entities.
- **VPS RAM pressure** — n8n + FalkorDB + Graphiti on KVM 2 may get tight. Mitigation: monitor RAM during 2D rollout; upgrade to KVM 4 (~$15/mo) if sustained >80%.
- **VPS as single point of failure** — Hostinger down = whole org offline. Mitigation: not yet — accept for Phase 2; revisit at Phase 4.

---

## 9. The conversation that produced this plan

For agents trying to understand *why* the plan looks the way it does, the design moved through several iterations:

**Early framing (superseded).** Architecture was `You → CEO → C-Suite → Workers`. Orli was the user; CEO was above her. Wrong shape — Orli is the sovereign, not the user.

**FRQNCY-First architecture.** Inserted FRQNCY as a Jarvis-like personal intelligence between Orli and the org. Orli now talks only to FRQNCY; FRQNCY routes. Council promoted to direct invocation by FRQNCY (no longer waits for CEO permission). See `FRQNCY-Architecture-FRQNCY-First.html`.

**God + sovereignty added.** God placed above Orli as ultimate sovereign. Orli is "God's channel on Earth," not just a founder. Council granted explicit veto authority over C-Suite. Council reports only to God + Orli, never to CEO. See updated diagram in this doc, §2.

**Telegram interface decided.** Direct chat with n8n is a developer tool, not Jarvis. Telegram is free, mobile-native, supports inline approve/reject buttons, n8n has full integration. Orli's interface to the entire org becomes one-tap approvals on her phone.

**Learning + Memory architecture designed.** Three layers: Working (n8n native), Long-Term (Supabase pgvector), Context Graph (Graphiti). Learning Agent introduced as meta-tier sibling to FRQNCY. See `FRQNCY-Memory-Learning-Architecture.html`.

**Phase 2 plan v0.2 written.** Initial draft (Sonnet) had three monolithic phases (Approval / Context Graph / Learning) with the Context Graph stored as Supabase JSONB. Wrong — collapsed three memory layers into one and chose the wrong tech.

**Phase 2 plan v0.3 reconciled (Opus 4.7).** After reading the eight prior artifacts: split into four phases (2A pgvector now, 2B Telegram, 2C Learning, 2D Graphiti deferred). Replaced JSONB context graph with Graphiti + FalkorDB. Added embedding model decision (Nomic Embed via OpenRouter). Added MEMORY PROTOCOL block. Added compounding flywheel timeline (Month 1/3/6/12). Acknowledged Week 2 prerequisite. Current state.

---

## 10. Where every artifact lives

### Plan & state docs
- `proposals/FRQNCY-OS-STATUS.md` — **this doc**, the handoff
- `frqncy-phase2-plan.html` — Phase 2 plan v0.3 (root, full HTML version with diagrams, schemas, decision tables)

### Prior architecture & design docs (uploaded as references, all in chat history)
- `FRQNCY-Architecture-FRQNCY-First.html` — canonical hierarchy: God → Orli → FRQNCY → CEO + Council → C-Suite → Workers, with veto authority
- `FRQNCY-Memory-Learning-Architecture.html` — three memory layers, Learning Agent flow, Graphiti + pgvector design, MEMORY PROTOCOL
- `FRQNCY-Execution-Roadmap.html` — original 6-week roadmap (Weeks 1-6 = Phase 1-3)
- `FRQNCY-Agent-Architecture.html` and `FRQNCY-Agent-Architecture-v2.html` — earlier architecture iterations (superseded by FRQNCY-First but useful for context)

### Build guides (atomic step-by-step)
- `FRQNCY-Week1-QuickStart.html` — **executed.** Hostinger VPS + n8n + accounts + credentials.
- `FRQNCY-Week2-DeployCEO.html` — **not yet executed.** 20 atomic steps to deploy FRQNCY-Interface workflow with CEO, CMO, CTO, Kali. **Required prerequisite for Phase 2.**

### System prompts
- `FRQNCY-System-Prompts.html` — all 32 system prompts (FRQNCY + 6 C-Suite + 7 Council + 19 Workers) with copy buttons

### Project context (existing FRQNCY repo files an agent should know about)
- `CLAUDE.md` — codebase orientation pack (top-level rules, repo layout, voice values)
- `proposals/FRQNCY-VOICE-PLAYBOOK.md` — canonical voice guide for any user-facing copy generated by agents
- `proposals/EDITORIAL-VALUES-V2.md` — slogans, voice, posture
- `proposals/REVENUE-MODEL.md` — five revenue surfaces
- Memory system at `~/Library/Application Support/Claude/local-agent-mode-sessions/.../memory/` — has context-graph.json (seed entities for eventual Graphiti import)

---

## 11. For the next agent — how to continue

### If Orli says "let's build Phase 2A"
1. Confirm she's not ready to execute Week 2 first. Phase 2A still works without it (you can attach pgvector memory to the empty FRQNCY-Interface workflow), but it's more useful once agents are deployed.
2. Open the Phase 2 plan §08 → Phase 2A deliverables. Six steps.
3. Walk her through atomic steps in the same style as Week 1 / Week 2 guides — HTML file with numbered steps, copy buttons, screenshots if helpful.
4. Verify the embedding model choice with her (Nomic Embed via OpenRouter is the default).

### If Orli says "let's execute Week 2 first"
1. Open `FRQNCY-Week2-DeployCEO.html` — already 20 atomic steps. No new doc needed.
2. Walk her through it. End state: CEO + CMO + CTO + Kali wired into FRQNCY-Interface workflow.
3. Then come back to Phase 2A.

### If Orli wants to revise the architecture
1. Read §2 of this doc carefully. The hierarchy (God → Orli → FRQNCY → Council/CEO → C-Suite → Workers + memory layers) is canonical.
2. Read `FRQNCY-Architecture-FRQNCY-First.html` for the full visual + reasoning.
3. Any architectural change needs to update both this doc and `frqncy-phase2-plan.html`.

### If Orli wants to write new content using the org
1. Don't generate. Run it through the personas. The whole point of the org is that outputs come from FRQNCY's personas, not from a generic agent.
2. If the personas aren't deployed yet (pre-Week 2), use the system prompts in `FRQNCY-System-Prompts.html` as a temporary surrogate — paste the relevant prompt as context, generate, but flag to Orli that this is interim.
3. All user-facing copy must respect `proposals/FRQNCY-VOICE-PLAYBOOK.md`.

### If Orli wants to use the @frqncy/harness toolkit instead of n8n
1. Different project. See `CLAUDE.md` for the harness section. The harness is a TS package + CLI for running individual model invocations with tool/streaming support.
2. The harness could replace n8n eventually but it doesn't have the multi-agent orchestration n8n provides today (sub-agents are blocked by default per `frqncy-harness/proposals/SUB-AGENTS.md`).
3. For now, treat them as separate workstreams.

### Things to NEVER do
- Don't put Orli underneath the CEO in any diagram.
- Don't let the Learning Agent modify Council prompts.
- Don't deploy Graphiti before Phase 2B has run for 30+ days.
- Don't add tools to `claude-code/*` or `codex/*` model paths in the harness.
- Don't push trace data to a public repo.
- Don't write generic corporate copy. Read `FRQNCY-VOICE-PLAYBOOK.md` first.
- Don't use the "Makes the unable able" slogan — explicitly rejected by Orli (positions readers as incomplete; violates abundance frame).
- Don't add leaderboards, ranking, or "calls" framing anywhere.

---

## 12. The compounding flywheel (the reason all of this exists)

- **Month 1:** Agents make mistakes. Orli corrects on Telegram. Learning Agent records. Memory thin but growing.
- **Month 3:** Agents incorporate past lessons via pgvector. Revision rate drops. Graphiti up; first meaningful connections (decisions, brand voice evolution).
- **Month 6:** Learning Agent has proposed and Orli has approved real prompt updates. Each agent is meaningfully better than v1. Graph surfaces non-obvious connections.
- **Month 12:** Genuine institutional memory. Agents are deeply calibrated to FRQNCY's specific voice, mission, and Orli's preferences. This is what "living organization" means.

---

**End of handoff.** If you're an agent reading this for the first time and you're confused about something, read `frqncy-phase2-plan.html` for the structured plan, then `FRQNCY-Architecture-FRQNCY-First.html` for the visual, then `FRQNCY-Memory-Learning-Architecture.html` for the memory model. Those three plus this doc are everything.
