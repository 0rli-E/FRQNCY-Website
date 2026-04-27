# Harness Research Notes

Research dump for designing FRQNCY's plug-and-play LLM harness. Five parallel research agents commissioned 2026-04-26. Each section preserves the agent's full report verbatim.

> **Caveat:** Agents 3 (orchestration survey) and 5 (outside-the-radar building blocks) ran without live web access and worked from training-data knowledge (cutoff Jan 2026). Their named tools are well-known and likely accurate, but verify version numbers and current state before committing. Agents 1, 2, 4 had live web and produced verifiable URLs.

---

## Agent 1 — Sequoia + VC harness theses (live web)

### 0. REQUIRED: Sequoia, "From Hierarchy to Intelligence"
- **Authors:** Jack Dorsey (Block) + Roelof Botha (Sequoia)
- **Date:** March 31, 2026
- **URL:** https://sequoiacap.com/article/from-hierarchy-to-intelligence/

Two thousand years of org design has been about routing information through human middle management because no other coordination mechanism existed. AI is the first technology that can actually replace that hierarchy by maintaining a continuously updated "world model" of the company plus a "world model" of the customer. Block is restructuring around four primitives: (1) capabilities (atomic financial primitives), (2) world model (company + customer), (3) intelligence layer (composes capabilities into solutions in real time), (4) interfaces (Square, Cash App). People shrink to three roles: ICs, DRIs, and player-coaches.

Failed precedents named: Spotify squads, Zappos Holacracy, Valve, Haier rendanheyi. Live example: Block — both sides of millions of daily Square + Cash App transactions feed a per-merchant world model that triggers proactive offers (e.g., surfacing a short-term loan to a restaurant before they search for one).

Punchline: "If the answer is nothing, AI is just a cost optimization story… If the answer is deep, AI doesn't augment your company. It reveals what your company actually is."

Quotes (under 15 words):
- "Most companies using AI today are giving everyone a copilot."
- "The intelligence lives in the system. The people are on the edge."
- "Customer reality generates the backlog directly."

**Why this matters for the harness:** Reframes the harness as not just a tool router but the org chart for a one-person company. For a solo founder, the FRQNCY harness is the missing middle management — it routes information between capabilities (search, content gen, social moderation) and the customer signal.

### 1. Sequoia, "2026: This is AGI"
- **Authors:** Pat Grady + Sonya Huang · **Date:** Jan 14, 2026 · **URL:** https://sequoiacap.com/article/2026-this-is-agi/

AGI is here in the functional sense. Pre-training gave knowledge; o1-style inference gave reasoning; long-horizon agents give iteration. Two technical paths are scaling: RL inside the labs, and **agent harnesses** in the application layer. Manus, Claude Code, Factory's Droids name-checked as "exceptionally engineered agent harnesses." 2026/27 apps are doers not talkers.

Quotes:
- "Designing great agent harnesses is the domain of the application layer."
- "Are you obsessively improving your agent harness?"

**Why it matters:** Sequoia explicitly endorsing the harness layer as where founders compete — not the model.

### 2. Bessemer, "AI Infrastructure Roadmap: Five Frontiers for 2026"
- **Author:** Taj Shorter (Bessemer) · **Date:** March 30, 2026 · **URL:** https://www.bvp.com/atlas/ai-infrastructure-roadmap-five-frontiers-for-2026

Five-frontier map: (1) Harness infrastructure (#1!), (2) Continual learning systems, (3) RL platforms, (4) Inference inflection point, (5) Real-world AI. Bessemer claims 78% of AI failures are invisible — neither user nor monitoring catches them — and 93% persist even with stronger models because they stem from interaction dynamics, not capability gaps.

Quotes:
- "78% of AI failures are invisible."
- "Infrastructure designed to harness models becomes more important than ever."

**Why it matters:** Working VC taxonomy: environments, runtime, orchestration, protocols, frameworks. The "invisible failure" stat is the case for evals/observability inside the harness from day one.

### 3. LangChain, "Agent Frameworks, Runtimes, and Harnesses — Oh My!"
- **Author:** Harrison Chase · **Date:** Late Oct 2025 · **URL:** https://blog.langchain.com/agent-frameworks-runtimes-and-harnesses-oh-my/

Three distinct layers: Framework (LangChain — abstractions), Runtime (LangGraph — durable execution, streaming, HITL), Harness (DeepAgents — opinionated batteries-included).

Quotes:
- "Deep Agents are the harness."
- "Harnesses come batteries included."

**Why it matters:** Forces decision on which layer FRQNCY's tooling lives at. For a solo founder you almost certainly want a *harness* (opinionated, default planning + memory + tools) on top of an existing runtime, with a portable model abstraction underneath.

### 4. Hugo Nogueira, "The Agent Harness: Why 2026 is About Infrastructure, Not Intelligence"
- **Date:** Jan 8, 2026 · **URL:** https://www.hugo.im/posts/agent-harness-infrastructure

Coins **"100th Tool Call Problem"**: agents fail because context fills up, summarization kicks in, agents "quietly forget something essential." Walks through four production agents he runs (Sentinel — opens PRs; Hopper — reviews copy for ICP voice; Parenting Coach — sent a single emoji-check during a family medical scare; Chief of Staff — respects a "zero agenda Saturday"). Pillars: durable execution, real memory architecture (Mem0/Zep/Letta), goal management.

Quotes:
- "Intelligence without infrastructure is just a demo."
- "The Agent Harness is the Operating System. The LLM is just the CPU."

**Why it matters:** Most operator-honest piece on the list. The Parenting Coach moment ("good agent behavior is often about restraint, not verbosity") is exactly the FRQNCY ethos.

### 5. Phil Schmid (DeepMind), "The Importance of Agent Harness in 2026"
- **Date:** Early Jan 2026 · **URL:** https://www.philschmid.de/agent-harness-2026

Defines harness as the OS around the model (vs. framework as kernel). Cites Manus refactoring its harness five times in six months — keep the harness lightweight because every model release changes the optimal scaffolding. Trajectory data captured by your harness becomes the dataset that trains the next model.

Quotes:
- "The Harness is the Dataset."
- "Every new model release has a different, optimal way to structure agents."

**Why it matters:** Two design constraints to bake in: keep the harness thin and replaceable; log every trajectory from day one because it's the moat.

### 6. Foundation Capital, "Context Graphs, One Month In"
- **Authors:** Jaya Gupta + Ashu Garg · **Date:** Jan 30, 2026 · **URL:** https://foundationcapital.com/context-graphs-one-month-in/

Direct follow-up to the trillion-dollar essay. Coins **"decision traces."** Reports adoption: Dharmesh Shah (HubSpot) calling context graphs "a system of record for decisions, not just data"; Aaron Levie (Box) declaring "the era of context."

**Why it matters:** The harness should write decision traces, not just call models.

### Honorable mentions (Agent 1)
- Adnan Masood, "Agent Harness Engineering — The Rise of the AI Control Plane" (Medium, Apr 2026): https://medium.com/@adnanmasood/agent-harness-engineering-the-rise-of-the-ai-control-plane-938ead884b1d
- SiliconANGLE, "The agent control plane race hits overdrive at Next 2026" (Apr 22, 2026): https://siliconangle.com/2026/04/22/agent-control-plane-race-hits-overdrive-next-2026-googlecloudnext/
- Cobus Greyling, "The Rise of AI Harness Engineering": https://cobusgreyling.medium.com/the-rise-of-ai-harness-engineering-5f5220de393e
- Parallel Web Systems, "What is an agent harness in the context of large-language models?": https://parallel.ai/articles/what-is-an-agent-harness
- Awesome-Harness-Engineering GitHub list: https://github.com/ai-boost/awesome-harness-engineering
- Anthropic engineering, "Scaling Managed Agents: Decoupling the brain from the body": anthropic.com/engineering/managed-agents

---

## Agent 2 — Hermes + Nous Research (live web)

### Hermes Agent (the headline product)
- **URL:** https://hermes-agent.nousresearch.com/ · GitHub: https://github.com/NousResearch/hermes-agent · Docs: https://hermes-agent.nousresearch.com/docs/
- **Status:** v0.11.0 live as of April 2026; project dropped Feb 25, 2026. **MIT License.**

What it is: an **open-source, self-hostable, long-running personal agent runtime** — not a hosted SaaS, not a model, not an SDK. You install it with `curl … | bash`, run `hermes setup`, and it lives on your server (a $5 VPS suffices) listening across messaging platforms.

Tagline: "An Agent That Grows With You." Sub-claim: "Not a coding copilot tethered to an IDE or a chatbot wrapper around a single API."

**Three-tier architecture:**
1. **Gateway** — 15+ platform adapters (Telegram, Discord, Slack, WhatsApp, Signal, Matrix, Email, SMS, CLI, Home Assistant, etc.)
2. **Core** — `AIAgent` orchestration loop in `run_agent.py` (provider selection, tool execution, retries, fallback, compression, persistence)
3. **Execution backends** — six sandboxes: local, Docker, SSH, Daytona, Singularity, Modal

**Self-improving learning loop**: skills are auto-generated **Markdown documents** describing procedures the agent discovered. Persistent memory across sessions. ~118 bundled skills at launch.

**Provider-agnostic:** "works with any OpenAI-compatible LLM provider" — Nous Portal, OpenRouter, Anthropic, OpenAI, Bedrock, local vLLM. Model can be hot-swapped live.

**Atropos hooks built in**: ships with RL-environment integration so the agent's own tool-calling traces become training data.

vs. Claude Agent SDK / OpenAI Agents SDK: those are libraries you embed in your own service. Hermes Agent is a **deployed daemon** with built-in messaging gateways, multi-backend sandboxing, scheduling, and a self-modifying skill store — closer to "personal AutoGPT-as-a-service that you own" than a programming framework.

**Plug-in for FRQNCY harness:** Treat Hermes Agent as a reference implementation — copy its provider-abstraction layer (any OpenAI-compatible endpoint) and skill-as-Markdown convention. Or run it as the *outer* harness and call your own Claude/GPT calls from inside its skills.

Quotes (under 15 words):
- "An open-source agent that grows with you."
- "Lives where you do."
- "Persistent memory and auto-generated skills."

### Hermes 4 (the models)
- **URL:** https://hermes4.nousresearch.com/ (was unreachable; HF cards live: https://huggingface.co/NousResearch/Hermes-4-70B and `/Hermes-4-405B`) · OpenRouter: https://openrouter.ai/nousresearch/hermes-4-405b
- **Dates:** 14B Jan 2025; 70B and 405B (FP8) Sept 2025; Hermes 4.3 (built on a ByteDance Seed-36B base) Aug 2025

Open-weight family fine-tuned on Llama 3.1. Trained with ~5M-sample / ~60B-token post-training corpus, using Atropos rejection sampling across ~1,000 task-specific verifiers. Distinctive feature: hybrid reasoning mode — model toggles `<think>…</think>` traces for hard problems. Strong on schema-valid JSON, tool-call repair, and dramatically reduced refusal rates.

License: META LLAMA 3 COMMUNITY LICENSE — commercial use allowed with the standard >700M-MAU clause.

OpenRouter pricing (Hermes 4 405B): $1/M input, $3/M output, 131K context window.

**Plug-in:** Slot into the harness as the **long-context, low-refusal fallback** when Claude refuses or budget pressure kicks in. Hermes 4 70B is the cheaper default tool-calling worker.

### Atropos (RL environments framework)
- **URL:** https://github.com/NousResearch/atropos · Intro: https://nousresearch.com/introducing-atropos
- **Date:** Released April 2025

"Language Model RL Environments framework for collecting and evaluating LLM trajectories through diverse environments." Splits training into four independently-scalable services. Used to produce Hermes 4's ~1,000 verifier suite.

Quote: "Managing rollouts efficiently is the crucial first step towards truly scalable asynchronous LLM RL."

**Plug-in:** Probably overkill today, but if FRQNCY ever wants a small fine-tuned model for "consciousness-practice tone matching," Atropos is the cleanest open path.

### Forge (inference orchestration)
- **URL:** https://nousresearch.com/introducing-the-forge-reasoning-api-beta-and-nous-chat
- **Date:** Beta Nov 2024; productized via Nous Portal through 2025–2026

A reasoning-augmented inference API — combines MCTS, Chain-of-Code, and Mixture-of-Agents on top of any underlying model.

Quote: "Allowing users to see, edit, and even train on chain of thought processes."

**Plug-in:** Use Nous Portal/Forge as a third lane in the harness when a query genuinely benefits from MoA-style deliberation.

### Psyche + DisTrO (distributed training)
- **URLs:** https://nousresearch.com/nous-psyche/ · https://psyche.network/ · https://distro.nousresearch.com/ · https://github.com/NousResearch/DisTrO
- **Status:** $50M Series A from Paradigm (April 2025) to scale this

DisTrO is a bandwidth-efficient distributed-training algorithm. Psyche is the network layer on top, coordinating heterogeneous GPUs worldwide via Solana for fault-tolerance/censorship-resistance. Successfully trained a 15B model across 11,000 steps.

Quote: "Train models at a fraction of the cost of centralized approaches."

**Plug-in:** Almost certainly not relevant today. Watch the testnet — if it matures, it becomes the cheapest path to "FRQNCY's own model" later.

### Nous people & ideology
- **Jeffrey Quesnelle** — CEO. **Karan Malhotra** — Head of Behavior. **Teknium** — Head of Post-Training. **Bowen Peng** — research, DisTrO co-author. NYC, ~$65M raised total.
- Karan Malhotra interview on Practical AI #255 ("Data synthesis for SOTA LLMs") is the cleanest long-form on Nous's post-training philosophy.
- Ideology: decentralized, human-centric, open-weight AI. Aligns with FRQNCY's anti-leaderboard / cooperation-over-competition values — Nous is one of the few labs whose politics match the project.

### Direct answers

**1. Self-hostable or API-only?** Self-hostable, MIT-licensed, designed for self-host first. Install script puts it on any VPS. Nous Portal is the optional managed model endpoint, not a required hosted runtime.

**2. Hermes model licensing:** Open weights on Hugging Face, Meta Llama 3 Community License. Commercial use allowed (700M-MAU restriction). Hermes 4.3 on Seed-36B base inherits ByteDance's terms — check separately.

**3. Most pragmatic Hermes-compatibility path for a solo founder harness:**
1. **OpenRouter** (one API key, model name `nousresearch/hermes-4-405b` or `hermes-4-70b`) — zero infra, OpenAI-compatible. **This is the answer for FRQNCY today.**
2. **Nous Portal** direct — slightly cheaper, gets you closer to Forge.
3. **Together AI / Fireworks** — when you need fastest token throughput.
4. **Local via vLLM/Ollama** — only if you have a GPU box.
5. **Hermes Agent itself as the harness** — strongest move if you want the "skill-as-Markdown, persistent memory, multi-backend sandbox" infrastructure for free.

---

## Agent 3 — Multi-model orchestration survey (training-knowledge based; verify versions)

### Framework summaries

**OpenRouter** — gateway only, ~300+ models, OpenAI-compatible, fallback routing is killer feature. Use under a harness, not as one.

**LiteLLM (BerriAI)** — Python SDK + standalone proxy. 100+ providers normalized to OpenAI schema. Strong evals/obs hooks (Langfuse, Helicone, Arize). Best **infrastructure layer** under a TS harness; run as proxy.

**Vercel AI SDK v5** — TS-first. First-party providers for all majors plus OpenRouter (community) and Ollama. Zod-typed tools. v5 added agent loop primitives (`stopWhen`, `prepareStep`, multi-step). AI Elements for UI. **Native fit for Astro/Preact + Cloudflare Workers stack.**

**Mastra** — TS, built on Vercel AI SDK. Higher-level Agent + Workflow abstractions. First-class memory (semantic recall, working memory, thread/resource model). Built-in evals. Local dev playground (`mastra dev`). YC-backed, ~13k stars by early 2026 (verify). **Strongest TS agent framework as of early 2026** if you want batteries-included.

**LangGraph + LangChain** — Python primary; LangGraph.js exists but lags. Strong memory (checkpointers, threads, store API). LangSmith best-in-class tracing if you pay. **Wrong language for FRQNCY's stack.**

**Pydantic AI** — Python. "FastAPI of agents." Pydantic Logfire (OTel-based) excellent. **Wrong language for FRQNCY.**

**OpenAI Agents SDK** — Python primary; TS port released 2025. Multi-provider via OpenAI-compatible endpoints (so OpenRouter/LiteLLM/vLLM work). Anthropic via `LitellmModel` adapter — second-class.

**Claude Agent SDK** — Python + TS. **Anthropic only.** Use for Claude-specific features (computer use, MCP), not as unified harness.

**Google ADK** — Python primary. Gemini-first; LiteLLM adapter for Anthropic/OpenAI. Released Apr 2025, ~9k stars.

**Inngest / Trigger.dev** — Durable execution layers, NOT LLM frameworks. Provider-agnostic. **Pair one with your harness** for background agents. Trigger.dev is the more natural TS fit.

**AutoGen v0.4 / v0.5** — Python, heavy, governance turbulence (original team forked to AG2). Not a fit.

**CrewAI** — Python. Opinionated toward "crews of role-specialized agents." Overkill for a harness.

**Smolagents (HF)** — Python. Code-as-action paradigm. Elegant but unconventional.

**Worth-knowing additions:**
- **BAML** (boundaryml.com) — schema-first prompt language; clean way to define typed LLM functions across providers
- **Cloudflare AI Gateway** — caching/rate-limit/analytics gateway
- **Portkey** — LiteLLM competitor with stronger TS SDK + prompt management UI
- **Genkit (Google/Firebase)** — TS-first, plugin-based provider model

### Top-3 ranked recommendation

#### #1 — Vercel AI SDK v5 as harness core, LiteLLM proxy underneath, OpenRouter as one upstream

- **Harness layer:** Vercel AI SDK in TS. Native to Astro/Preact, runs in Cloudflare Workers, Zod-typed tools, clean provider-swap (`anthropic('claude-sonnet-4.5')` → `openai('gpt-5')` → `openrouter('nous/hermes-4')`), agent loop via `stopWhen` and `prepareStep`
- **Routing layer:** LiteLLM proxy (single Docker container) for unified observability, virtual keys, fallbacks, cost tracking. Point AI SDK at it via `@ai-sdk/openai-compatible` when you want central control; bypass it for direct Anthropic when you need prompt caching
- **Long-tail layer:** OpenRouter as one of LiteLLM's upstreams, used for Hermes/Nous and other open-source models
- **Why:** TS-native, edge-deployable, single dev does not need Python; provider-swap is one line; AI Elements gives UI components for free for the social platform's chat surfaces

#### #2 — Mastra
Batteries included (memory, evals, workflows, local dev UI), thicker abstraction. Built on AI SDK so you don't lose the provider story. Best if FRQNCY agents grow into multi-step workflows.

#### #3 — Roll-your-own thin harness over `@ai-sdk/provider` interface + LiteLLM proxy
Maximum control, minimal dependencies. The AI SDK's `LanguageModelV2` interface is small (~6 methods). Best if you distrust framework churn.

### "Underneath OpenRouter" best practice (2026)

**Direct SDKs for tier-1 providers, OpenRouter for long-tail.**

Reasons to call native SDKs directly:
- Anthropic prompt caching (~90% input cost savings on stable system prompts)
- Anthropic computer use, fine-grained tool streaming, citations
- OpenAI Responses API, structured outputs strict mode, reasoning summaries, Realtime API
- Gemini context caching, grounding with Search, multimodal live API
- Lower latency (one less hop)
- Better error semantics

Reasons OpenRouter still wins for some traffic:
- Open-source models (Hermes 4, Llama, Qwen, DeepSeek)
- Automatic fallback between providers of the same model
- Quick A/B testing of new models
- Single billing relationship for experimentation

**The 2026 pattern (LiteLLM-style routing config):**
```
anthropic/* → native Anthropic SDK (caching enabled)
openai/*    → native OpenAI SDK (Responses API)
gemini/*    → native Google SDK
mistral/*   → native Mistral SDK
nous/*, meta/*, deepseek/*, qwen/* → OpenRouter
fallback for any tier-1 outage → OpenRouter same-model
```

**Anti-pattern to avoid:** routing 100% through OpenRouter "for uniformity." You lose ~30-40% of tier-1 model capability. Caching alone is the difference between a $200/mo and $2000/mo bill at FRQNCY's likely scale.

### Concrete next step
Spike a 200-line `harness.ts` using Vercel AI SDK v5 with three providers (`@ai-sdk/anthropic`, `@ai-sdk/openai`, `@openrouter/ai-sdk-provider`), one Zod tool, and `streamText` with `stopWhen: stepCountIs(10)`. Deploy to a Cloudflare Worker.

---

## Agent 4 — Frontier-lab agent SDKs + engineering essays (live web)

### 1. Effective harnesses for long-running agents
- **Anthropic Applied AI** · **Nov 2025** · https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents

Most important for Orlando's question. The limit on agent autonomy is the context window, not model intelligence. Two-agent harness: an *initializer* runs once to scaffold an `init.sh`, a `claude-progress.txt` log, a baseline git commit, and a JSON `feature_list` that decomposes the user's prompt into hundreds of testable requirements. A *coding* agent then resumes session-after-session, reading those external artifacts to reconstruct context.

Quotes:
- "Each new session begins with no memory of what came before."
- "External artifacts become the agent's memory."

**Takeaway:** Make `progress.md` + `tasks.json` + git history the canonical memory tier; every session boots by reading them, not by replaying chat.

### 2. Building agents with the Claude Agent SDK
- **Anthropic** · **Sept 29, 2025** · https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk

Canonical loop Anthropic ships: agent, tool surface (file ops, bash, web fetch, MCP), permission gate, hierarchical memory (CLAUDE.md → subagent context), automatic context compaction. Frames Skills as the unit of composable, on-demand procedural knowledge.

Quote: "The same tools, agent loop, and context management that power Claude Code."

**Takeaway:** Don't rebuild the loop — wrap an SDK that already does compaction + tool routing + permissions, and add only your domain skills.

### 3. Don't Build Multi-Agents
- **Walden Yan, Cognition** · **June 12, 2025** · https://cognition.ai/blog/dont-build-multi-agents

Two principles: (1) share context and share full agent traces, not just messages; (2) actions carry implicit decisions, conflicting decisions carry bad results. Default to a single linear agent; if you must scale beyond context window, introduce a dedicated *compression model* that summarizes history into key events/decisions (Cognition has fine-tuned a small model for this).

Quotes:
- "Share context, and share full agent traces, not just individual messages."
- "Multi-agents only results in fragile systems."

**Takeaway:** One main loop, one shared trace, one fine-tuned summarizer when you overflow — never sibling agents writing in parallel.

### 4. Harness engineering: leveraging Codex in an agent-first world
- **OpenAI Codex team** · **Jan 2026** · https://openai.com/index/harness-engineering/

OpenAI's parallel to Anthropic's harness post. Shipped a million-line internal product in ~5 months with zero manually-written code, by treating the human role as building scaffolding agents can reason about. Each business domain split into rigid layers with validated dependency directions; engineers enforce *invariants*, not implementations.

Quotes:
- "Enforcing invariants, not micromanaging implementations."
- "Optimized first for Codex's legibility."

**Takeaway:** Architect the codebase (and the agent's workspace) for legibility before architecting the agent — a clean, layered repo is a memory aid.

### 5. We removed 80% of our agent's tools
- **Vercel d0 team** · **Dec 22, 2025** · https://vercel.com/blog/we-removed-80-percent-of-our-agents-tools

Production case study on tool minimalism. Vercel's text-to-SQL agent hit 80% with hand-built tool palette; ripped down to *one* tool — execute arbitrary bash in a sandbox — gave the model raw filesystem access to Cube DSL files. Result: 100% success, 40% fewer tokens, 40% fewer steps, 3.5× faster.

Quotes:
- "What if bash is all you need?"
- "The best agents might be the ones with the fewest tools."

**Takeaway:** Default to bash + filesystem inside a sandbox; only add a bespoke tool when an eval proves the bash baseline can't do it.

### 6. Composer / Composer 1.5 / Composer 2 (Cursor)
- **Cursor** · Composer Oct 29, 2025; Composer 1.5; Composer 2 technical report early 2026
- https://cursor.com/blog/composer · https://cursor.com/blog/composer-1-5 · https://cursor.com/blog/composer-2-technical-report

Deepest published account of training a model *inside* the harness it will ship in. Composer is an MoE optimized by RL where the agent calls real Cursor tools (semantic search, grep, edit, bash) inside hundreds of thousands of concurrent sandboxed cloud VMs.

Quotes:
- "Hundreds of thousands of concurrent sandboxed coding environments."
- "If there's an easy way to … cheat their way to a good [reward], they'll find it."

**Takeaway:** Your eval harness *is* your training harness — same sandbox, same tools, same prompts.

### 7. How Cognition Uses Devin to Build Devin
- **Cognition AI** · **Feb 27, 2026** · https://cognition.ai/blog/how-cognition-uses-devin-to-build-devin

Devin auto-indexes every repo every couple of hours into wikis with architecture diagrams and direct source links; before any task, an exploration phase generates a tailored session prompt rather than dumping the user's raw request.

**Takeaway:** Index the workspace continuously and synthesize a per-task prompt — the user's prompt is never the prompt the model sees.

### 8. Building LangGraph: Designing an Agent Runtime from First Principles
- **Harrison Chase** · **Aug 2025** · https://blog.langchain.com/building-langgraph/

Why a general-purpose agent runtime needs durable execution, checkpointing, and human-in-the-loop interrupts as primitives. Single technical assumption: "LLMs are slow, flaky, and open-ended." Single product axiom: "the biggest competitor to any code framework is no framework."

Quotes:
- "LLMs are slow, flaky, and open-ended."
- "The biggest competitor to any code framework is always no framework."

**Takeaway:** Persist every step to a checkpointer from day one — pause/resume is not a feature, it's the substrate.

### 9. How Claude Code is built (interview with Boris Cherny)
- **Gergely Orosz, The Pragmatic Engineer** · **Sept 2025** · https://newsletter.pragmaticengineer.com/p/how-claude-code-is-built

Stack: TypeScript + React + Ink + Yoga + Bun, deliberately chosen as "on distribution" for the model. ~12 engineers, 5 PRs/engineer/day, 60–100 internal releases/day. 90% of Claude Code's own code is written by Claude Code.

Quotes:
- "The tech stack was chosen to be 'on distribution.'"
- "90% of code in Claude Code is written by itself."

**Takeaway:** Pick languages/frameworks the model has seen most of; harness velocity compounds when the agent can edit itself.

### 10. Agentic Engineering Patterns
- **Simon Willison** · **Feb 23, 2026** · https://simonwillison.net/2026/Feb/23/agentic-engineering-patterns/

Working catalogue of patterns. Defines an agent precisely — "a system that runs tools in a loop to achieve a goal." Argues bash + code execution is the default general-purpose tool surface, that the **lethal trifecta** (private data + untrusted content + outbound network) is the dominant security failure mode for harness designers, and that MCP is the plumbing while Skills are the procedural memory.

Quotes:
- "Runs tools in a loop to achieve a goal."
- "Delivering good code remains significantly more expensive."

**Takeaway:** Treat the lethal-trifecta question as a checklist gate before any new tool ships; never hold all three at once on the same trace.

### 11. Google ADK
- **Google Cloud / DeepMind** · **Apr 2025** ongoing · https://google.github.io/adk-docs

Code-first Python (also TS/Go/Java) toolkit, ecosystem-agnostic via LiteLLM. Ships *workflow agents* (deterministic pipelines) alongside LLM-orchestrated dynamic routing as first-class primitives, plus a managed runtime (Agent Engine) that handles A2A (agent-to-agent) handoff as a protocol.

**Takeaway:** Even in a single-agent harness, define A2A-style typed interfaces for any "tool" that's actually another LLM call.

### 12. Cline: The Open Source Code Agent
- **Saoud Rizwan & Nik Pash interviewed by swyx (Latent Space)** · 2025 · https://www.latent.space/p/cline · https://cline.bot/blog/

Strongest open-source counterweight to Claude Code. Local-first, model-agnostic, "propose and approve" loop where every diff appears as a reviewable action before execution. AST-based file analysis, dynamic context summarization, explicit *Memory Bank* pattern, one of earliest MCP marketplaces.

**Takeaway:** Default to *propose-then-approve* for any state-changing tool; the friction is the feature for personal harnesses.

### Honorable mentions (Agent 4)
- OpenAI "Unrolling the Codex agent loop": https://openai.com/index/unrolling-the-codex-agent-loop/
- OpenAI "Unlocking the Codex harness: how we built the App Server"
- Anthropic "Effective context engineering for AI agents" (Sept 2025): https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- Anthropic "Writing effective tools for AI agents" (Sept 2025): https://www.anthropic.com/engineering/writing-tools-for-agents
- Anthropic "Equipping agents for the real world with Agent Skills" (Dec 2025)
- Anthropic "Scaling Managed Agents: decoupling the brain from the harness"
- Replit "Inside Replit's Snapshot Engine": https://blog.replit.com/inside-replits-snapshot-engine
- Replit "Introducing Agent 3"
- Factory AI "Droid: #1 on Terminal-Bench": https://factory.ai/news/terminal-bench
- Sourcegraph Amp + Jason Liu "Rethinking RAG architecture for the age of agents" (Sept 11, 2025)

---

## Agent 5 — Outside-the-radar building blocks (training-knowledge based; verify versions)

### 1. Agentic memory systems
- **Letta (formerly MemGPT)** — letta.com — OS-inspired memory: small "main context" plus tool-callable archival + recall memory. Agent decides when to page memories in/out.
- **mem0** — mem0.ai — Lightweight memory layer that extracts facts via LLM, stores in vector + graph, deduplicates. Provider-agnostic.
- **Zep / Graphiti** — getzep.com / github.com/getzep/graphiti — Bi-temporal knowledge graph engine. Tracks "fact valid from T1 to T2" — critical for long-lived agents where preferences change.

**Architecture recommendation:** Episodic (Zep/Graphiti) + Semantic (mem0 or pgvector on Supabase) + Procedural (DSPy-optimized prompts). Don't pick one — they solve different problems.

### 2. Evaluation + observability
- **Braintrust** — braintrust.dev — Eval-first; ties prompt edits to eval deltas in CI.
- **Langfuse** — langfuse.com — OSS LangSmith alternative. Self-hostable, OTel support, prompt management.
- **Inspect AI (UK AISI)** — inspect.aisi.org.uk — Built for safety evals. Cleanest abstraction for agent evals (Solver/Scorer/Task), composes like middleware.
- **Helicone** — helicone.ai — One-line proxy for any OpenAI-compatible endpoint.

### 3. Sandboxed code execution
- **E2B** — e2b.dev — Firecracker microVMs, ~150ms cold start, stateful sessions. De facto standard.
- **Modal** — modal.com — Best when agent's code needs GPUs or persistent volumes.
- **Cloudflare Sandbox** — If FRQNCY is on Cloudflare Pages, lowest-latency option.
- **Microsandbox** — microsandbox.dev — New OSS player; runs locally via microVMs.

### 4. Compound AI / agent training
- **DSPy** — dspy.ai (Stanford NLP) — Treats prompts as parameters that get optimized against metrics. `MIPROv2`, `BootstrapFewShot` turn trace data into better prompts automatically.
- **GRPO / TRL** — huggingface.co/docs/trl — DeepSeek's GRPO is now default RL recipe for small models. Pair with Unsloth for cheap fine-tunes on trace data.
- **Berkeley BAIR's Compound AI Systems thesis** — bair.berkeley.edu/blog/2024/02/18/compound-ai-systems/

**Hook for FRQNCY:** Log every tool call + outcome to Supabase. Periodic batch: DSPy-optimize prompts on last week's traces, GRPO-distill the most-called subagent into a 3B model on Modal. Hot path runs the small model; cold path falls back to Claude.

### 5. Multi-agent / swarm coordination
- **LangGraph** — Supervisor + worker pattern, durable state via checkpointers, HITL interrupts.
- **Anthropic's research-system pattern** — anthropic.com/engineering/built-multi-agent-research-system — Lead agent spawns N parallel sub-agents, each with isolated context, results merged. ~90% token overhead but real quality gains on breadth tasks.
- **Magentic-One** (Microsoft) — Orchestrator + WebSurfer/FileSurfer/Coder/Terminal team. Cleanest "task ledger" + "progress ledger" pattern.
- **OpenAI Swarm / Agents SDK** — Handoffs as primitive. Lightweight; production teams graduate to LangGraph for durability.

### 6. Agent UIs
- **CopilotKit** — copilotkit.ai — React components for agent chat + generative UI. `useCoAgent` hook for shared state.
- **AG-UI Protocol** — ag-ui.com — Open protocol for agent ↔ UI streaming events. The "MCP for frontends."
- **Vercel AI Elements / AI SDK 5** — `useChat`, `useObject`, `streamUI`. Best DX for Astro.

### 7. MCP ecosystem (early 2026)
- **Smithery** — smithery.ai — Largest MCP server registry + hosted runtime.
- **MCP Sampling** — Lets server request LLM completions from client.
- **MCP Gateways** — Aggregate many MCP servers behind one endpoint with auth, rate-limit.
- **Auth + remote MCP** — OAuth 2.1 + DCR is now standard.

**For FRQNCY:** an MCP server that exposes search.json + resources.json + the explore graph would let any agent (Claude Desktop, Cursor, your harness) query FRQNCY content uniformly.

### 8. Self-improving / self-modifying agents
- **DSPy optimizers** (MIPROv2, BootstrapFinetune, COPRO) — most production-ready form
- **Voyager-style skill libraries** — github.com/MineDojo/Voyager — Agent writes new tools as code, stores in vector-indexed library, retrieves on demand
- **Self-Refine / Reflexion** — Critic loop: generate → critique → revise. ~10–20% quality boost
- **Trace-based prompt evolution** — Langfuse traces + DSPy + weekly cron

### 9. Background / durable execution
- **Inngest** — inngest.com — Event-driven durable functions. Best fit for TS/Astro + Supabase webhooks.
- **Temporal** — Heavyweight. Workflows survive deploys, run for days, strong consistency.
- **Convex** — Reactive DB + scheduled functions + actions. Worth knowing even if committed to Supabase.

### 10. Specialty primitives
- **BAML** — boundaryml.com — Schema-first structured output DSL, compiles to TS/Python/etc. Provider-agnostic.
- **Latitude** — latitude.so — OSS prompt management with eval integration.
- **LanceDB / Turbopuffer** — Object-storage-backed vector DBs. Cheap enough to log every trace embedding.
- **Promptfoo red-team** — promptfoo.dev — Plug-in jailbreak / prompt-injection test suite.

### Top 5 unknown-unknowns for Orlando

1. **Bi-temporal memory (Graphiti)** — getzep.com/graphiti — Memory that knows when a fact became true and when it stopped. Critical for a consciousness platform where users' practices and teachers evolve.
2. **AG-UI Protocol** — ag-ui.com — Symmetric protocol to MCP, but for UI. If FRQNCY exposes its agent surface via AG-UI, third-party clients (and the Capacitor app) get generative UI streaming for free.
3. **DSPy + GRPO trace-distillation pipeline** — Use Claude for cold paths, distill into a 3B specialist on Modal for hot paths, retrain weekly from Langfuse traces. 100x cost reduction on the 80% of repetitive queries.
4. **Inspect AI's Solver/Scorer abstraction** — inspect.aisi.org.uk — UK AISI's `Solver` (function that mutates `TaskState`) composes like Express middleware. Build the harness *as* an Inspect-compatible system, get world-class safety eval framework for free.
5. **Voyager-style skill library backed by Supabase pgvector** — Give agent a `register_skill(name, description, code)` tool. Code lives in Supabase, embeddings index descriptions, agent retrieves top-K relevant skills per task. Over months, the harness *literally writes its own toolkit* specific to FRQNCY's content/users.
