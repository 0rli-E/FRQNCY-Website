# The Definitive Guide to Harness Engineering

**Source:** TRAE (@Trae_ai) — published Apr 23, 2026
**URL:** https://x.com/Trae_ai/article/2047145274200768969
**Stats at capture:** 61 comments · 182 reposts · 1.2K likes · 345K views
**Saved by:** Orlando — 2026-04-26

> **TL;DR (author's framing):** "Harness Engineering is simply a more evocative, intuitive way to systematically summarize and name these existing AI practices."

---

## 1. What is Harness Engineering?

2026 marks the rise of a new pillar in software engineering: **Harness Engineering**. Following in the footsteps of Prompt and Context Engineering, the name was introduced by **Mitchell Hashimoto** (Co-Founder of HashiCorp) and gained widespread traction after a pivotal OpenAI report.

At its core lies the **"Horse and Reins"** metaphor. Think of an AI agent or any complex software system as a powerful but directionless "wild horse." The "Harness" represents the reins used to constrain, guide, and correct its behavior, ensuring it stays on track with stability and reliability.

The simple equation:

> **AI Agent = SOTA Model (Wild Horse) + Harness (Control System) = An Elite Performer**

You aren't changing the horse's DNA (the model itself), you're designing the professional gear and training protocols required to make it work for you.

> 💬 The Harness is essentially every piece of infrastructure other than the LLM that enables an agent to actually deliver results. It isn't about "better prompts" or "more capable models" — it's about **optimizing the environment and mechanisms the model operates within**. It is an engineering philosophy and framework designed to transform raw AI intelligence into reliable, controllable, and scalable productivity.

The core problem it solves: now that AI has joined your workflow, how do we actually manage this "super intern"?

*[Cover image: stylized "Research Log — The Definitive Guide To Harness Engineering" by TRAE]*

---

## 2. Why Do We Need Harness Engineering?

As AI evolves from simple "answering machines" to autonomous agents capable of planning and executing complex tasks, the engineer's role is undergoing a fundamental paradigm shift.

### 2.1 Building a more reliable Agent system — the R.E.S.T framework

To move agents beyond the toy stage and into production-ready engineering, they must anchor on four core objectives.

**2.1.1 Reliability**
*Definition:* The system's ability to provide stable, continuous service and complete designated tasks under expected/unexpected inputs, environmental shifts, and internal faults.
Key requirements:
- **Fault Recovery** — automatically resume from checkpoints after a task is interrupted
- **Operation Idempotency** — critical writes can be safely retried without corrupting state
- **Behavioral Consistency** — predictable behavior under the same inputs

**2.1.2 Efficiency**
*Definition:* Effective use of compute, storage, and network while meeting functional and reliability needs. Directly drives cost and scalability.
Key requirements:
- **Resource Control** — precise budget management for tokens, API calls, and compute
- **Low-Latency Response** — meaningful feedback fast in interactive scenarios
- **High Throughput** — more tasks per unit time in batch scenarios

**2.1.3 Security**
*Definition:* Protecting the system and its data from unauthorized access, use, or destruction. For autonomous agents, security is a non-negotiable red line.
Key requirements:
- **Least Privilege** — only the minimum permissions necessary for each sub-task
- **Sandboxed Execution** — run all untrusted code/instructions in a strictly isolated sandbox
- **I/O Filtering** — prevent prompt injection, sensitive data leaks, and harmful output

**2.1.4 Traceability**
*Definition:* Sufficient data (logs, metrics, traces) so developers and operators can understand the agent's internal state, decisions, and history.
Key requirements:
- **End-to-End Tracing** — clear, traceable call chain from initial request to final result
- **Explainable Decisions** — every critical decision has a clear attribution record
- **Auditable State** — the complete state at any point in history can be queried and audited

### 2.2 The Engineering Imperative in the Agent-First Era

**2.2.1 Engineering complexity is hitting new heights.** We've moved beyond "Vibe Coding" (Snake/Tetris demos) into serious, production-grade engineering.

**2.2.2 From "Executor" to "Architect."** As AI takes over the line-by-line work, the human engineer's value moves up the stack to system design — drafting blueprints, defining rules, and signing off on output. The author calls this **Spec Coding**.

> **The core philosophy:** when a model hits a wall, we implement an engineered mechanism to ensure that the same class of failure never happens again.

It's a living system. As models iterate, foundational capabilities will be internalized by the models themselves and certain Harness practices will retire — while new application scenarios birth new ones.

---

## 3. Deconstructing Harness Engineering

Under current Transformer-based, autoregressive LLM architectures, raw output is inherently **stochastic and disordered**. Harness Engineering imposes deterministic constraints on that raw compute to enable complex engineering workflows.

A production-ready agent operates on a continuous, four-stage loop:

> **PPAF — Perception → Planning → Action → Feedback/Reflection**

*[Diagram: "The PPAF Loop: Core Architecture of Agent Intelligence" — table with columns Stage / Key Concepts & Functional Description, rows P-Perception, Planning, Action, Feedback]*

The agent stack deconstructs into four core dimensions, each mapped to the PPAF cycle. To map capability boundaries, the author uses a 2D matrix:

**Horizontal axis — AI Cognitive Loop**
- *React (Passive Response)* — single-trigger, predefined deterministic tasks; no autonomous planning or reflection
- *Proactive Plan & Reflect* — pursues long-term goals; multi-step planning, execution, and dynamic adjustment

**Vertical axis — Context Efficiency**
- *Inefficient (Manual/Point-fed)* — context provided manually or via low-efficiency interfaces
- *Efficient (Sandboxed/Automated Injection)* — context auto-captured and injected via system-level interfaces (file systems, API gateways, state engines)

*[Diagram: "The Agent Evolution Matrix" — quadrant chart with Expert Assistant Systems, Autonomous Agents, etc.]*

The matrix's lesson: **the maturity of your harness directly determines whether an agent can leap from the inefficient/passive lower quadrants into the efficient/proactive upper tiers.**

---

## 4. The Architecture of a Harness System

### 4.1 High-Level Abstraction: the Harness as a Managed REPL Container

A Harness is essentially a **REPL (Read-Eval-Print Loop) container** equipped with boundary controls, tool routing, and deterministic feedback — a deterministic shell wrapping the non-deterministic "brain" of the LLM.

> 💬 **The Core Logic of the REPL Harness**
> - **Read** — A *Context Manager* translates the external world (user input, API states) and internal memory into highly structured prompts the LLM can digest. Engineering rigor for the "perception" phase.
> - **Eval** — When the LLM generates a plan (e.g., a Function Call), the *Call Interceptor* catches the intent and routes it to the appropriate tool executor. Every execution is monitored for timeouts, resource quotas, and error handling.
> - **Print** — Tool output (success or exception) is captured by the *Feedback Assembler*, repackaged as a structured "observation," and re-injected into context.
> - **Loop** — Repeats until the agent hits its goal or a termination condition. This loop is the engine driving the PPAF process.

### 4.2 The Underlying Transformation Mechanism: Bridging Infinite State and Finite Tokens

The Transformer architecture is fundamentally a finite, linear token sequence — yet the world's state is essentially infinite. The Harness's central job is an efficient, reliable, bidirectional mapping between the two.

#### 4.2.1 Context Management: from "Infinite State" to "Finite Tokens"

> 💬 **Engineering Decisions: Reduction Rules and Injection Boundaries**
>
> At its core, context management is a set of **Reduction Rules** — explicit rules that determine what to prioritize and what to prune when the token budget is tight.
>
> **Injection Boundary** is equally vital: it dictates exactly *where* external data (e.g., RAG results) gets inserted in the prompt, to maximize performance and avoid the **"Lost in the Middle"** phenomenon.

*[Diagram: Tiered Memory comparison table — Sliding Window / RAG / On-demand Loading / Hierarchical Memory, each with mechanism, best-fit scenarios, and risks/considerations]*

#### 4.2.2 Function Calling: from "Text Prediction" to "Physical Execution"

Function Calling (FC) is the bridge between LLM planning and real-world action. Its lifecycle is rigorous and often fragile:

1. **Schema Serialization** — Harness serializes available tools and their parameters (JSON Schema) into a specific text format and injects into the prompt. This is the only way the LLM knows its capability boundaries.
2. **Trigger Generation** — Through pattern matching, the LLM generates text following a specific syntax (tool name + args) when it determines a tool is needed.
3. **Deterministic Deserialization** — Harness intercepts and deserializes the text into a structured request. **Most brittle stage** — LLM output may violate syntax (malformed JSON, type mismatches).
4. **Observation Injection** — Harness executes the call and wraps the result (success/failure) as an "observation" text block re-injected into the prompt.

**a) Failure Surfaces and Fallback Paths**

*Deserialization Failure*
- **Retry** — feed the LLM the specific error (e.g., "Invalid JSON format") to regenerate
- **Fallback to Text** — request natural-language instructions for a traditional parser

*Execution Failure*
- **Interactive Clarification** — request missing parameters from the user
- **Reflection and Re-planning** — inject error logs to guide the agent toward an alternative path

**b) Core Architectural Decision: the State Separation Principle**

> Treat the LLM strictly as a **stateless compute unit (a "CPU")**. All state requiring cross-turn consistency — user sessions, task progress — must be offloaded to an external **Context State Manager** or persistence engine (Memory/Disk) controlled by the Harness.
>
> **The Anti-Pattern:** forcing the LLM to maintain complex state via prompt engineering leads to chaotic, unpredictable, untraceable behavior.

#### 4.2.3 Core Constraints and Design Principles

When building a Harness, confront **three fundamental constraints** and address them through **six core design principles**.

*[Diagram: "Three Core Constraints" — table with Constraint Category / Description & Engineering Implications]*

**The Six Design Principles**
1. **Design for Failure** — treat exceptions as the norm; every component supports fault tolerance, retries, graceful degradation
2. **Contract-First** — all interactions defined through explicit, machine-readable contracts (Schemas, APIs, Events)
3. **Secure by Default** — least privilege, zero trust, defense-in-depth as starting points, not bolt-ons
4. **Separation of Concerns (Decision vs. Execution)** — decouple "what to do" from "how to do it" both logically and physically
5. **Everything is Measurable** — every behavior, decision, and resource use must be quantifiable
6. **Data-Driven Evolution** — every agent run is a learning opportunity; build a closed loop of data → labeling → feedback

#### 4.2.4 Key Engineering Landmarks

To drive the REPL loop and ground these principles, a Harness needs critical components — "Engineering Landmarks" — across the architecture:

*[Diagram: "Engineering Landmarks" table — Engineering Component / Core Responsibilities / PPAF Stage / Design Essentials. Components shown: Tool Gateway, Call Interceptor, Feedback Assembler, Context State Manager, Exception Handler]*

| Component | Core Responsibility | PPAF Stage |
|---|---|---|
| **Tool Gateway** | Centralized tool registration, discovery, schema provisioning, permission validation | Planning (P) |
| **Call Interceptor** | Cross-cutting logic (logging, metrics, timeouts, quotas) before/after tool execution | Action (A) |
| **Feedback Assembler** | Transforms raw execution results (e.g., Python exceptions) into structured, observable info understandable by the LLM | Feedback (A) |
| **Context State Manager** | Manages token budget; governs retention, eviction, archiving policies for context | Perception / Memory (P) |
| **Exception Handler** | Classifies system-wide exceptions to orchestrate retry and recovery strategies | Action / Feedback |

> Harness Engineering is just the collective name for how we orchestrate LLMs. Whether it's an SDK, an agent, or a custom plugin, the mission is always the same: **stopping the model from making the same mistake twice.**
> These "harnesses" aren't static. As models evolve, today's external guardrails will eventually be baked directly into the models themselves.

---

## 5. Implementing Harness Engineering

### 5.1 Architecture Overview: Control Plane and Data Plane

A production-grade Harness decouples into:

- **Control Plane (the "What")** — high-level logic: task scheduling, resource quotas, behavioral planning, policy enforcement
- **Data Plane (the "How")** — heavy lifting: actual agent runtime instances, state and memory storage, sandboxed execution environment

*[Diagram: "Harness Architecture: Control Plane And Data Plane" — 4-layer table]*

| Layer | Control Plane View | Data Plane View |
|---|---|---|
| **L1 Presentation & Integration** | Exposes agent capabilities externally via a unified entry point (API Gateway, Event Bus) | Integration through Client SDKs, Webhooks, embedded into business applications |
| **L2 Task & State Management** | Orchestrates and triggers long-running tasks (Task Scheduler, Workflow Engine) | Persists task context and checkpoints (State Storage) |
| **L3 Agent Core Engine** | Behavior Planner, Context Strategist | Agent Runtime processes; short-term and long-term memory storage |
| **L4 Execution & Governance** | Policy Engine, Resource Manager — safety & cost governance | Sandbox execution framework, Tool Library |

> Think of the Harness as **"intelligent glue."** It sits between your model's API Gateway and your services, using engineering rigor to stitch disparate infrastructure into a cohesive system.

### 5.2 Core Mechanisms: the Loop, Memory, and Token Pipelines

#### 5.2.1 The Agent Core Loop — Observe → Think → Act
- **Observe** — perceive current state (user inputs, tool outputs, history, task progress)
- **Think** — update goals, decompose tasks, decide next move
- **Act** — execute internal (memory updates) or external (tool calls, replies) operations; results feed back into observation

> 💬 **It's not a simple `while (true)` loop.** In production it must integrate with workflow engines or state machines, support pause/resume, idempotent retries, and concurrent event handling — to solve "context anxiety" in long-running tasks.

#### 5.2.2 Tiered Memory & the Token Pipeline

Most agents rely on external memory. The Harness runs a **Token Transformation Pipeline** to distill multi-source info into a controlled prompt before every call:

1. **Collection** — aggregate user requests, short-term memory, long-term knowledge retrievals
2. **Ranking** — score by recency and semantic relevance
3. **Compression** — summarize/structurally refine high-volume, low-density content
4. **Budgeting** — allocate token limits across information categories
5. **Assembly** — final prompt via structured templates (e.g., `[user_request]`, `[tool_output]` blocks)

> **Bottom line:** Offload attention management to engineering. Don't hope the model "figures out" what to focus on — build the context actively.

#### 5.2.3 Planning Models and Execution Strategies

> 💬 **Recommendation:** Default to **Plan-and-Execute**, layering in re-planning or multi-agent orchestration only as needed. For most enterprise scenarios, a structured plan with "exception-triggered re-planning" is robust enough.

#### 5.2.4 Runtime and Governance: Sandboxing, Security, and Cost

**Sandboxed Execution Frameworks (4 levels)**
- **L1 — Process-level Isolation** — `chroot`, Linux namespaces, `seccomp-bpf`. Fast, shares kernel; trusted internal tools.
- **L2 — Container Isolation** — Docker / containerd. Industry-standard for most tool execution.
- **L3 — MicroVMs** — Firecracker. Independent virtual kernels; ideal for multi-tenant or untrusted code.
- **L4 — Full VMs** — KVM/QEMU. Maximum security at highest cost; reserved for the most sensitive tasks.

> **Strategy:** Default to **L2 (Containers)** with a hardened kernel and read-only root filesystem. Introduce **L3 (MicroVMs)** as a bolstered sandbox for untrusted code or high-sensitivity data.

**Resource Management and Resilience**
- **Budgets and Quotas** — token, API call, CPU caps per platform/tenant/task
- **Timeout Control** — strict timeouts on all network requests and tool execs to prevent a hung downstream from dragging down the whole agent
- **Retry Strategies** — exponential backoff for transient errors; fail fast on permanent ones
- **Circuit Breakers** — temporarily trip on repeated dependency failures to prevent cascading failures
- **Graceful Degradation** — drop to a "weak but safe" mode if critical capabilities go offline (e.g., from "executable code" to "read-only suggestions")

**Security and Compliance: the Policy Gateway**
Sits between Planner and Execution; validates every action.
- **Permissions** — RBAC/ABAC checks
- **Data Filtering** — PII and secret detection on inputs and return values
- **Injection Defense** — detect malicious prompt patterns or command stitching before they hit execution
- **Audit Logging** — "who did what, when, and the result" for postmortems and compliance

**Metrics and Evolution: Growing Through Data**
- **Task Effectiveness** — success rate, instruction-following rate, tool-use efficacy
- **Quality of Service** — end-to-end latency, time-to-first-action, error rates
- **Resource Efficiency** — average token consumption, average tool calls
- **Security & Compliance** — policy denial rates, security incident counts

These aren't dashboard filler — they're the feedback loop driving the Harness's evolution. Plateaued success rates → revisit planner or context strategy. Spiking errors/costs → troubleshoot sandboxing, quotas, or circuit breaker logic.

---

## 6. Final Words

> Harness Engineering isn't a "silver bullet" on a pedestal. It's an engineering philosophy forged in and built for the real world.
>
> While the industry fixates on "disruption" and "replacement" of developers by generative AI, this methodology serves as a grounding reminder: **the engineer's role isn't disappearing. It's evolving. We are shifting from being the creators of code to becoming the guardians of the creation process.**
>
> Architecting a reliable Harness is ultimately an exercise in balancing chaos and order. We don't expect AI to be perfect any more than we expect humans to be infallible. True engineering wisdom lies in building systems that can learn from failure and navigate uncertainty with resilience.
>
> The ultimate goal of these "reins" was never to restrict, but to enable a safer, more complete release of potential. And perhaps, in the near future, models will begin to outgrow these foundational constraints entirely.

---

## Diagrams referenced (visual notes)

The published article is illustrated with branded TRAE "Research Log" infographics. The ones I confirmed visually while reading:

1. **Cover** — "The Definitive Guide To Harness Engineering" (mint-green abstract shapes on light grey)
2. **The PPAF Loop: Core Architecture of Agent Intelligence** — table mapping each PPAF stage (Perception, Planning, Action, Feedback) to key concepts and functional descriptions
3. **The Agent Evolution Matrix** — 2x2 quadrant chart on Cognitive Loop × Context Efficiency axes; quadrants include "Expert Assistant Systems" and "Autonomous Agents"
4. **Tiered Memory comparison** — table with rows Sliding Window / RAG / On-demand Loading / Hierarchical Memory and columns for mechanism, fit, and risks
5. **The Three Core Constraints** — Constraint Category / Description & Engineering Implications table
6. **Engineering Landmarks** — Engineering Component / Core Responsibilities / PPAF Stage / Design Essentials table; rows include Tool Gateway, Call Interceptor, Feedback Assembler, Context State Manager, Exception Handler
7. **Harness Architecture: Control Plane And Data Plane** — 4-layer table (L1 Presentation & Integration → L4 Execution & Governance)

---

## Why this matters for FRQNCY

A few angles where this framework maps onto things already in motion in the project:

- **The social platform research paper** (`docs/FRQNCY_SOCIAL_RESEARCH_PAPER.md`) was written by three research agents — i.e., a Harness orchestrating multiple LLM "wild horses" against a structured scope. The PPAF loop and State Separation Principle name the practice you've already been running.
- **Spec Coding** — the article's term for "engineer-as-architect" — is essentially how the FRQNCY codebase has been built (specs first, agents executing, you signing off).
- **R.E.S.T (Reliability, Efficiency, Security, Traceability)** is a useful checklist for any agent-driven feature on FRQNCY — including future ones like the wake/sleep alarm and Aligned/Sanctuary surfaces from the revenue plan.
- **State Separation Principle** is directly relevant to the Supabase + Astro + Preact stack on the social side: keep state in Postgres, treat the LLM as stateless compute.

---
---

# Companion piece — From CRM to CRCG: A Practical Example of Context Graphs

**Source:** Ishan Chhabra (@ishan_chhabra) — published Dec 31, 2025
**Author bio:** Chief Mad Scientist (& Reluctant CEO) @ Oliv — building a team of AI Agents for sales managers & reps
**URL:** https://x.com/ishan_chhabra/status/2006088709872255002 → https://x.com/i/article/2006074328152952832
**Stats at capture:** 25 comments · 60 reposts · 476 likes · 1.2K bookmarks · 170K views

> Why this is paired with the Harness piece: it's the *architecture* counterpart to TRAE's *operations* manual. TRAE describes how to wrap an LLM in a deterministic shell. Ishan describes the data structure that shell should be reading from and writing into. Both share the same hidden premise — the LLM is a stateless compute unit, and the engineering work is everything *around* it.

---

## The opening setup

Recently, **@ashugarg and @JayaGup10** wrote a wonderful piece that gave words to an idea many AI founders have been struggling to express: there is something fundamentally different about how new agentic AI systems are getting built — meaningfully distinct from what the prior **"Systems of Record"** were doing.

For someone not deep in the trenches of engineering agents, the default reaction is: *"The incumbents will add AI, and this category goes away."* But there is a structural divergence that all AI founders know exists, yet struggle to articulate. Ashu and Jaya gave it a term: **The Context Graph.**

The problem: even after reading the article, people walk away confused — *"What the hell is a context graph?"* The word "graph" makes it harder, because it evokes parallels to graph databases (like Neo4j) or vector-based knowledge graphs.

> **Context Graphs have nothing to do with Graph Databases.**

Context Graphs are an architectural approach trying to encapsulate two key ideas:

1. **Context Engineering** — providing the model with the exact relevant information to solve a task, avoiding catastrophic forgetting or hallucinations.
2. **Decision Graphs** — a graph the agent builds dynamically as it navigates through steps, collecting the specific context it needs to complete a task and **recording why it made decisions**.

The rest of the article walks this through a concrete sales example: moving from a **CRM** (Customer Relationship Management) to a **CRCG** (Customer Relationship Context Graph).

---

## The Problem: Why are our POCs failing?

Setup: I'm a VP of Sales. POCs are taking too much time, draining organizational energy, and not converting into closed deals.

The traditional **CRM way** is to add new fields:
- POC Start Date
- POC End Date
- POC Success Criteria (text field)

Sellers fill them out. In reality, the dates get filled, but "Success Criteria" usually ends up as a one-liner like *"Needs to integrate with email"* or *"User wants to save time."*

But as a leader, the richer questions are:
- *What is the actual definition of success for this specific buyer?*
- *Who are the key people driving this?*
- *If we win the POC, does it align with their organizational goals?*

### The Naive AI Approach

The naive modernization: have an AI fill out those CRM fields for you.

The AI listens to the transcript of meeting #1, writes a summary into the Success Criteria field. Meeting #2 happens; AI looks at the previous value, looks at the new transcript, updates the field.

> You realize very quickly that you are losing context. By the time you try to answer "Can we win this deal?", the field has been overwritten multiple times and contains no decision trace. **You have the state (the current text), but you've lost the reasoning.**

---

## The Context Graph Approach

Hypothetical scenario: we're selling a next-generation CRM to **Dunder Mifflin** and hold two meetings — one with **Jim** (individual contributor / seller) and one with his manager **Michael**.

*[Diagram: "Let's look at an example — A deal with Dunder Mifflin." Timeline showing **Sep 15: Meeting with Jim (Seller)** — "Prospecting and CRM updates are a major time sink" — and **Sep 21: Meeting with Michael (Manager)** — "Forecasting is labor-intensive and still falls short on accuracy." On the right, a "Dunder Mifflin Pains & needs" panel listing time-consuming forecasting (sales managers spend 4+ hours on forecasts) and manual data entry (reps make 60+ CRM updates per week).]*

### Step 1: The Grounding Truth

Before we even talk to the customer, the graph needs a foundation. We start with a document detailing our own product's key capabilities and value props.

Say our product excels at **Forecasting** and **Pipeline Visibility**, but we don't really do **"Lead Generation/Prospecting."**

*[Diagram: Step 1 — A PDF Document feeds into a "Context Graph Root" node, which fans out to two product-capability child nodes: **Accurate Forecasting** ("Oliv helps teams improve forecasting accuracy by …") and **Pipeline Management** ("Oliv helps sellers manage pipeline and …"). Labeled "Product Capabilities & Value Prop" along the bottom.]*

### Step 2: The First Meeting (the User)

We meet with **Jim**, a salesperson at Dunder Mifflin. In the transcript, Jim complains about two things:

1. He spends 5 hours a week prospecting and hates it.
2. CRM updates take too much time.

The **Naive System** would simply log: *"Pain points: Prospecting and Updates."*

The **Context Graph** does something smarter — it compares Jim's inputs against the "Product Capabilities" node established in Step 1.

- *Jim wants better prospecting?* → graph checks Capabilities. **We don't do that.** System flags this as a pain point we cannot solve.
- *Jim wants faster CRM updates?* → graph confirms the Capability and checks external data. Pulls a case study from another paper company, **"Saber Paper,"** which saved 3 hours a week.

### Step 3: The Second Meeting (the Decision Maker)

Next, **Michael**, the Regional Manager. Different perspective: *"We plan to IPO in two years. I spend my whole Friday forecasting, and our accuracy is only 73%. We need 90%+ accuracy to go public."*

If we were just updating a CRM text field, we might append "Forecasting issues" to "CRM updates." But in a Context Graph, we **weigh the source of the information**. Michael is the Manager. His pain point aligns with an organizational goal (IPO).

The Graph updates:
- Links Michael's "Forecasting" pain point directly to our **"Product Capability: Accurate Forecasting"** node (Strong Match).
- Creates a **"Success Metric"** node: *"Increase forecasting accuracy from 73% to 90%."*
- **Prioritizes this over Jim's "CRM Updates"** because Michael is the Decision Maker.

*[Diagram: Full Context Graph for Dunder Mifflin. Nodes and edges: **Pipeline Management** → **Case Study** ("Reps at Saber Paper saved 3h+/week"). **Meeting w/ Jim Halpert (Individual Contributor)** → **Pain Point** ("CRM updates take too much time") → **Success Metrics** ("Save 3h+/week on CRM updates"). **Meeting w/ Michael (Manager)** → **Pain Point** ("Time consuming and inaccurate forecasts") → **Success Metrics** ("Increase forecasting accuracy from 73% to 90+%") → **Accurate Forecasting** ("Oliv helps teams improve forecasting accuracy by …"). Color-coded with Pain Points in red and Success Metrics in dark red.]*

---

## The Result: Why this matters

> If we ask the **naive CRM** "What defines success?" → *"Prospecting, CRM updates, and forecasting."* A soup of keywords without hierarchy.
>
> If we ask the **Context Graph** "What defines success?" → *"The decision-maker (Michael) prioritizes Forecasting to enable an IPO. This aligns with our core Product Capabilities and is the key success criteria. While the end-user (Jim) wants prospecting tools and CRM updates, prospecting doesn't align with our product and CRM updates are a secondary requirement given Jim's low influence in the decision process."*

**We haven't just stored data; we have stored the decision trace.** We know *why* forecasting is the priority (IPO) and *who* decided it (Michael).

---

## The Future: Emerging patterns

Once you build these graphs for every deal, you unlock something powerful: pattern-finding across graphs.

By analyzing the structure of thousands of deal graphs, the AI can see emergent patterns humans miss. It might discover that whenever a "Manager" node links to an "IPO" node, the deal closes 40% faster if you introduce the "Forecasting" module early.

> This is the transition from CRMs, which are passive **Systems of Record**, to Context Graphs, which are active **Systems of Reasoning**. We aren't just digitizing the rolodex anymore; we are digitizing the logic of the business itself.

---

## How this connects to the Harness piece (and to FRQNCY)

Two articles, one underlying claim: **the LLM is the easy part. The hard part is the structured scaffolding around it.**

- TRAE's **Context Manager / Context State Manager** + Ishan's **Context Graph** are the same primitive at different zoom levels. TRAE describes the *runtime component* that injects context into a prompt; Ishan describes the *data structure* the runtime is reading from and writing into.
- TRAE's insistence that the LLM is a *stateless CPU* and all cross-turn state must live in an external store is exactly why a Context Graph is necessary — without it, you have the "soup of keywords" Ishan describes.
- **System of Reasoning vs. System of Record** is a useful frame for FRQNCY. The current 604-resource library + 133 topics on the v2 site is a System of Record (catalog). The conviction-scored, project-anchored social layer described in the social research paper is the start of a System of Reasoning — a graph of *who believed what, when, and was right about it.* That's a Context Graph in everything but name.
- For the Aligned, Courses, Referrals, Sanctuary, Fund revenue surfaces in `proposals/REVENUE-MODEL.md`: each one will eventually need its own Context Graph — practitioner intent, prior interactions, source-weighted preferences — and a Harness wrapping the LLM that reads/writes against it. The two articles together describe the full stack.

---
---

# Companion piece — How to build a context graph

**Source:** Animesh Koratana (@akoratana) — published Dec 28, 2025 (11:42 PM)
**Author bio:** Building PlayerZero, Stanford AI — playerzero.ai
**URL:** https://x.com/akoratana/status/2005303231660867619
**Stats at capture:** 152 comments · 422 reposts · 3.2K likes · 10K bookmarks · 2M views

> Why this is paired with the other two: Ishan's CRCG piece tells you *what* a context graph is and why it beats a system-of-record. Animesh's piece is the *how* — and reframes the whole thing as a **world model** for organizational physics, which is a much sharper claim than "graph database with reasoning attached."

---

## The opening

**@JayaGup10 and @ashugarg** recently wrote about context graphs — the layer that captures decision traces rather than just data. Their argument: the next trillion-dollar platforms won't be built by adding AI to existing systems of record, but by **capturing the reasoning that connects data to action**.

The piece resonated. Ever since, Animesh has gotten the same question: *how do you actually build one?*

> The answer isn't "add memory to your agent" or wire up MCP. In fact, the word *graph* itself is a little misleading. What you're really trying to model is far more dynamic and probabilistic than a static graph suggests.
>
> The honest answer is that this is structurally hard. Not "scale up compute" hard — **rethink your assumptions** hard. Context graphs don't exist today because building them forces us to confront problems we've spent decades ignoring.

Every organization pays a **fragmentation tax**: the cost of manually stitching together context that was never captured in the first place. Different functions use different tools, each with its own partial view of the same underlying reality. A context graph is infrastructure to stop paying that tax. But to build one, you first have to understand why the tax exists.

Three ideas shape how he thinks about this.

---

## 1. The Two Clocks Problem

We've built all our systems around only half of time.

> Your CRM stores the final deal value, not the negotiation. Your ticket system stores "resolved," not the reasoning. Your codebase stores current state, not the two architectural debates that produced it.
>
> We've built trillion-dollar infrastructure for what's true now. **Almost nothing for why it became true.**

This made sense when humans were the reasoning layer — the organizational brain was distributed across human heads, reconstructed on demand through conversation. Now we want AI systems to make decisions, and we've given them nothing to reason from. *"It's like training a lawyer on verdicts without case law."*

Examples of the missing event clock:
- The config file says `timeout=30s`. It used to say `timeout=5s`. Someone tripled it. Why? Git blame shows *who*. The reasoning is gone.
- The CRM says "closed lost." Doesn't say you were the second choice and the winner had one feature you're shipping next quarter.
- The treatment plan says "switched to Drug B." Doesn't say Drug A was working but insurance stopped covering it.
- The contract says 60-day termination clause. Doesn't say the client pushed for 30 and you traded it for the liability cap.

> Every system has a **state clock** — what's true right now — and an **event clock** — what happened, in what order, with what reasoning. We've built elaborate infrastructure for the state clock. The event clock barely exists.
>
> State is easy. It's just a database. Events are hard because they're ephemeral — they happen and they're gone. State overwrites; events must append. And the most important part of the event clock — the reasoning connecting observations to actions — was never treated as data.

**Three things make rebuilding the event clock structurally hard:**

1. **Most systems aren't fully observable.** Real systems have black boxes — legacy code, third-party services, emergent behavior across components. You can't capture reasoning about things you can't see.
2. **There's no universal ontology.** Every organization has its own entities, relationships, semantics. *"Customer"* means something different at a B2B SaaS company than at a consumer marketplace. The context graph can't assume structure; it has to learn it.
3. **Everything is changing.** The system you're modeling changes daily. You're not documenting a static reality — you're tracking change.

These problems interact: you're trying to reconstruct an event clock for a system you can only partially observe, whose structure you have to discover, and which is mutating underneath you. Most "knowledge management" projects fail because they treat this as a static problem — ingest documents, build a graph, query later. But documents are just frozen state. The event clock requires capturing process, and process is dynamic.

> So how do you build an event clock for a system you can't fully see, can't fully schema, and can't hold still?

---

## 2. Agents As Informed Walkers — schema is the *output*, not the input

The ontology problem looks unsolvable at first. Every organization is different. You can't standardize "how decisions work" any more than you can standardize "how companies work."

But there's something that navigates arbitrary systems by definition: **agents**.

When an agent works through a problem — investigating an issue, making a decision, completing a task — it figures out the relevant ontology on the fly. Which entities matter? How do they relate? What information do I need? What actions are available?

> The agent's trajectory through the problem is a trace through state space. **It's an implicit map of the ontology, discovered through use rather than specified upfront.**

### Semantic embeddings encode meaning. Organizational reasoning needs structure.

Typical embeddings are semantic: similar meanings, nearby vectors. That's useful for retrieval, not for what we need. We need embeddings that encode *structure* — not "these concepts mean similar things" but "these entities play similar roles" or "these events co-occur in decision chains."

> The information isn't about meaning. It's about **the shapes of reasoning**. Which entities get touched together when solving problems? Which events precede which? What are the traversal patterns through organizational state space?

### The node2vec analogy

There's an intuition from graph representation learning. Graph embeddings (node2vec) showed you don't need to know graph structure to learn representations of it. **Random walks** — sequences of nodes visited by wandering through edges — are sufficient. Co-occurrence statistics encode structure. Nodes appearing together frequently are related, either directly connected or playing analogous roles in different neighborhoods.

> This inverts the usual assumption. **You don't need to understand a system to represent it. Traverse it enough times and the representation emerges. The schema isn't the starting point. It's the output.**

But the way you walk determines what you learn. Node2vec uses two parameters controlling walk bias:
- **Local walks** (likely to backtrack) learn **homophily** — nodes are similar because they're connected.
- **Global walks** (pushing outward) learn **structural equivalence** — nodes are similar because they play analogous roles, even if never directly connected.

Two senior engineers at a company. One on payments, one on notifications. No shared tickets, no overlapping code, no common Slack channels. Homophily wouldn't see them as similar. But structurally they're equivalent — same role in different subgraphs, similar decision patterns, similar escalation paths. Structural equivalence reveals this.

### Agents are *informed* walkers

When an agent investigates an issue or completes a task, it traverses organizational state space — touches systems, reads data, calls APIs. The trajectory is a walk through the graph of organizational entities.

Unlike random walks, agent trajectories are **problem-directed**. The agent adapts based on what it finds. Investigating a production incident:
- Start broad — what changed recently across all systems? *Global exploration, structural equivalence territory.*
- As evidence accumulates, narrow to specific services, deployment history, request paths. *Local exploration, homophily territory.*

> Random walks discover structure through brute-force coverage. Informed walks discover structure through problem-directed coverage. The agent goes where the problem takes it, and problems reveal what actually matters.
>
> Engineered correctly, **agent trajectories become the event clock.**

Each trajectory samples organizational structure, biased toward parts that matter for real work. Accumulate thousands and you get a learned representation of how the organization functions, discovered through use. Entities appearing repeatedly are entities that matter. Relationships traversed are relationships that are real.

### The economic flywheel

> The agents aren't building the context graph — they're solving problems worth paying for. **The context graph is the exhaust.** Better context makes agents more capable, capable agents get deployed more, deployment generates trajectories, trajectories build context. But it only works if agents do work that justifies the compute.

---

## 3. Context Graphs Are Organizational World Models

A **world model** is a learned, compressed representation of how an environment works. It encodes dynamics (what happens when you take actions in a specific state), captures structure (what entities exist and how they relate), and enables prediction (given current state and a proposed action, what happens next?).

World models demonstrate something important: agents can learn compressed representations of environments and **train entirely inside "dreams"** — simulated trajectories through latent space. The world model becomes a simulator. You can run hypotheticals and get useful answers without executing in the real environment.

The robotics analogy: a world model capturing physics (how objects fall, how forces propagate) lets you simulate robot actions before executing them, train policies in imagination, explore dangerous scenarios safely, transfer to physical hardware. The better your physics model, the more useful your simulations.

The same logic applies to organizations, but **the physics is different**.

> Organizational physics isn't mass and momentum. It's **decision dynamics**. How do exceptions get approved? How do escalations propagate? What happens when you change this configuration while that feature flag is enabled? What's the blast radius of deploying to this service given current dependency state?
>
> State tells you what's true. The event clock tells you how the system behaves — and behavior is what you need to simulate.

A context graph with enough accumulated structure becomes a world model for organizational physics. It encodes how decisions unfold, how state changes propagate, how entities interact. Once you have that, **you can simulate.**

### PlayerZero in practice

> At PlayerZero, we build code simulations — projecting hypothetical changes onto our model of production systems and predicting outcomes. Given a proposed change, current configurations and feature flags, patterns of how users exercise the system: will this break something? What's the failure mode? Which customers get affected?
>
> These simulations aren't magic. They're inference over accumulated structure. We've watched enough trajectories through production problems to learn patterns — which code paths are fragile, which configurations interact dangerously, which deployment sequences cause incidents. The world model encodes this. Simulation is querying the model with hypotheticals.

> **Simulation is the test of understanding. If your context graph can't answer "what if," it's just a search index.**

### Reframing the continual-learning debate

The standard framing of continual learning asks: *how do we update weights from ongoing experience?* That's hard — catastrophic forgetting, distributional shift, expensive retraining.

> World models suggest an alternative: **keep the model fixed, improve the world model it reasons over.** The model doesn't need to learn if the world model keeps expanding.

This is what agents can do over accumulated context graphs. Each trajectory is evidence about organizational dynamics. At decision time, perform inference over this evidence: given everything captured about how this system behaves, given current observations, what's the posterior over what's happening? What actions succeed?

More trajectories → better inference. Not because the model updated, but because the world model expanded.

And because the world model supports simulation, you get **counterfactual reasoning** — not just *"what happened in similar situations?"* but *"what would happen if I took this action?"* The agent imagines futures, evaluates them, chooses accordingly.

> This is what experienced employees have that new hires don't. Not different cognitive architecture — **a better world model**. They've seen enough situations to simulate outcomes. *"If we push this Friday, on-call will have a bad weekend."* That's not retrieval. It's inference over an internal model of system behavior.

The path to economically transformative AI might not require solving continual learning. It might require building world models that let static models behave as if they're learning, through expanding evidence bases and inference-time compute to reason and simulate over them.

> **The model is the engine. The context graph is the world model that makes the engine useful.**

---

## What This Means

Context graphs require solving three problems:

1. **The two clocks problem.** We've built trillion-dollar infrastructure for state and almost nothing for reasoning. The event clock has to be reconstructed.
2. **Schema as output.** You can't predefine organizational ontology. Agent trajectories discover structure through problem-directed traversal. The embeddings are *structural*, not semantic — capturing neighborhoods and reasoning patterns, not meaning.
3. **World models, not retrieval systems.** Context graphs that accumulate enough structure become simulators. They encode organizational physics — decision dynamics, state propagation, entity interactions. Simulation is the test. If you can ask "what if?" and get useful answers, you've built something real.

> The companies that do this will have something qualitatively different. Not agents that complete tasks — **organizational intelligence that compounds**. That simulates futures, not just retrieves pasts. That reasons from learned world models rather than starting from scratch.
>
> That's the unlock. Not better models. Better infrastructure for making deployed intelligence accumulate.

---

---
---

# Foundational piece — AI's trillion-dollar opportunity: Context graphs

**Source:** Jaya Gupta (@JayaGup10) and Ashu Garg (@ashugarg), Foundation Capital — published Dec 22, 2025 (essay) / posted to X Dec 24, 2025
**Author bios:** Jaya — "tweets about AI and other fun stuff. currently @foundationcap; wrote the context graph paper. previously McKinsey, @georgiatech, @stackfolio (acquired)"
**URL:** https://x.com/jayagup10/status/2003525933534179480
**Stats at capture:** 395 comments · 1.3K reposts · 7K likes · 17K bookmarks · 4.8M views

> **This is the source essay** that both Animesh Koratana and Ishan Chhabra are responding to. Both of them open by namechecking @JayaGup10 and @ashugarg. Reading it last (the way I encountered it) is fine, but in the chronology it's the seed. It also frames the whole conversation as a *venture-scale market thesis*, not a technical primer — that's the angle the other two pieces take for granted.

---

## The setup: what the last generation of enterprise software did

> The last generation of enterprise software created a trillion-dollar ecosystem by becoming **systems of record**. Salesforce for customers. Workday for employees. SAP for operations. Own the canonical data, own the workflow, own the lock-in.

The debate right now: do those systems survive the shift to agents? Jamin Ball's recent post **"Long Live Systems of Record"** hit a nerve. Pushing back on the "agents kill everything" narrative, he argues that agents don't replace systems of record — they raise the bar for what a good one looks like.

Jaya & Ashu agree, partly. Agents are cross-system and action-oriented. The UX of work is separating from the underlying data plane. Agents become the interface, but something still has to be canonical underneath.

> Where we go further is this: Ball's framing assumes the data agents need already lives somewhere, and agents just need better access to it plus better governance, semantic contracts, and explicit rules about which definition wins for which purpose.
>
> That's half the picture. The other half is the missing layer that actually runs enterprises: **the decision traces** — the exceptions, overrides, precedents, and cross-system context that currently live in Slack threads, deal desk conversations, escalation calls, and people's heads.

The distinction that matters:

- **Rules** tell an agent what should happen in general — *"use official ARR for reporting."*
- **Decision traces** capture what happened in this specific case — *"we used X definition, under policy v3.2, with a VP exception, based on precedent Z, and here's what we changed."*

Agents don't just need rules. They need **access to the decision traces** that show how rules were applied in the past, where exceptions were granted, how conflicts were resolved, who approved what, and which precedents actually govern reality.

> This is where **systems-of-agents startups have a structural advantage**. They sit in the execution path. They see the full context at decision time: what inputs were gathered across systems, what policy was evaluated, what exception route was invoked, who approved, and what state was written. If you persist those traces, you get something that doesn't exist in most enterprises today: **a queryable record of how decisions were made.**

> We call the accumulated structure formed by those traces a **context graph**: not "the model's chain-of-thought," but a living record of decision traces stitched across entities and time so precedent becomes searchable. Over time, that context graph becomes the real source of truth for autonomy — because it explains not just what happened, but why it was allowed to happen.

The core question isn't whether existing systems of record survive. It's whether **entirely new ones emerge — systems of record for decisions, not just objects** — and whether those become the next trillion-dollar platforms.

---

## What systems of record don't capture

Agents are shipping into real workflows — contract review, quote-to-cash, support resolution — and teams are hitting a wall that governance alone can't solve.

The wall isn't missing data. It's missing decision traces. Specifically:

- **Exception logic that lives in people's heads.** *"We always give healthcare companies an extra 10% because their procurement cycles are brutal."* That's not in the CRM. It's tribal knowledge passed down through onboarding and side conversations.
- **Precedent from past decisions.** *"We structured a similar deal for Company X last quarter — we should be consistent."* No system links those two deals or records why the structure was chosen.
- **Cross-system synthesis.** The support lead checks the customer's ARR in Salesforce, sees two open escalations in Zendesk, reads a Slack thread flagging churn risk, and decides to escalate. That synthesis happens in their head. The ticket just says *"escalated to Tier 3."*
- **Approval chains that happen outside systems.** A VP approves a discount on a Zoom call or in a Slack DM. The opportunity record shows the final price. It doesn't show who approved the deviation or why.

> This is what "never captured" means. Not that the data is dirty or siloed, but that **the reasoning connecting data to action was never treated as data in the first place.**

---

## The context graph is the enduring layer

When startups instrument the agent orchestration layer to emit a decision trace on every run, they get a structured, replayable history of how context turned into action.

**Worked example — a renewal agent:**
- Renewal agent proposes a 20% discount.
- Policy caps renewals at 10% unless a service-impact exception is approved.
- Agent pulls three SEV-1 incidents from PagerDuty, an open "cancel unless fixed" escalation in Zendesk, and the prior renewal thread where a VP approved a similar exception last quarter.
- Routes the exception to Finance. Finance approves.
- The CRM ends up with one fact: *"20% discount."*
- The context graph ends up with **everything that justified it**.

Once you have decision records, the "why" becomes first-class data. Over time these records form a context graph: entities the business already cares about (accounts, renewals, tickets, incidents, policies, approvers, agent runs) connected by **decision events** (the moments that matter) and **"why" links**. Companies can audit and debug autonomy and turn exceptions into precedent instead of re-learning the same edge case in Slack every quarter.

> The feedback loop is what makes this compound. Captured decision traces become searchable precedent. And every automated decision adds another trace to the graph.

It doesn't require full autonomy on day one. It starts with human-in-the-loop: agent proposes, gathers context, routes approvals, records the trace. Over time, as similar cases repeat, more of the path can be automated — because the system has a structured library of prior decisions and exceptions. Even when a human still makes the call, **the graph keeps growing**, because the workflow layer captures the inputs, approval, and rationale as durable precedent.

---

## Why incumbents can't build the context graph

Ball is optimistic that existing players evolve into this architecture. Warehouses become "truth registries"; CRMs become "state machines with APIs." A narrative of evolution, not replacement.

Jaya & Ashu disagree.

### Operational incumbents are siloed and prioritize current state

Salesforce is pushing **Agentforce**, ServiceNow has **Now Assist**, Workday is building agents for HR. Their pitch: *"we have the data, now we add the intelligence."*

But these agents inherit their parent's architectural limitations:

- Salesforce is built on **current state storage** — knows what the opportunity looks like *now*, not what it looked like when the decision was made. When a discount gets approved, the context that justified it isn't preserved. **You can't replay the state of the world at decision time** → you can't audit it, learn from it, or use it as precedent.
- They inherit their parent's blind spots. A support escalation doesn't live in Zendesk alone — it depends on customer tier (CRM), SLA terms (billing), recent outages (PagerDuty), and the Slack thread flagging churn risk. **No incumbent sees this** because no incumbent sits in the cross-system path.

### Warehouse players have a different problem: they're in the *read* path, not the *write* path

Ball positions **Snowflake** and **Databricks** as the "truth registry" layer. Both are leaning in — Snowflake pushing Cortex and acquiring Streamlit; Databricks acquiring Neon and launching Lakebase and AgentBricks.

Warehouses do have a time-based view (historical snapshots, metric change tracking). But they receive data via ETL **after** decisions are made. By the time data lands in Snowflake, the decision context is gone.

> A system that only sees reads, after the fact, can't be the system of record for decision lineage. It can tell you what happened, but it can't tell you why.

Databricks is further along in putting the pieces together. But being close to where agents get built isn't the same as being in the execution path where decisions happen.

### Systems-of-agents startups have the structural advantage

When an agent triages an escalation, responds to an incident, or decides on a discount, it pulls context from multiple systems, evaluates rules, resolves conflicts, and acts. The orchestration layer sees **the full picture** — and because it's executing the workflow, it can capture that context **at decision time**, not after the fact via ETL.

> That's the context graph, and that will be the single most valuable asset for companies in the era of AI.

Incumbents will fight back — acquisitions to bolt on orchestration, locked-down APIs, egress fees, "keep everything in our ecosystem" narratives. But capturing decision traces requires being in the execution path **at commit time**. Incumbents can make extraction harder, but they can't insert themselves into an orchestration layer they were never part of.

---

## Three paths for startups

Three patterns Jaya & Ashu are seeing in the market:

### 1. Replace existing systems of record from day one

A CRM or ERP rebuilt around agentic execution, with event-sourced state and policy capture native to the architecture. Hard because incumbents are entrenched, but viable at transition moments.

> **Example: Regie.** Of the many startups going after the AI SDR category, Regie is building an AI-native sales engagement platform to replace legacy platforms like Outreach/Salesloft (which were designed for humans executing sequences across a fragmented toolchain). Regie is designed for a mixed team where the agent is a first-class actor.

### 2. Replace modules rather than entire systems

Target specific sub-workflows where exceptions and approvals concentrate. Become the system of record for those decisions while syncing final state back to the incumbent.

> **Example: Maximor** in finance — automating cash, close management, and core accounting workflows without ripping out the GL. The ERP remains the ledger; Maximor becomes the source of truth where the *reconciliation logic* lives.

### 3. Create entirely new systems of record

Start as orchestration layers, but persist what enterprises never systematically stored: the decision-making trace. Over time the replayable lineage becomes the authoritative artifact. The agent layer stops being "just automation" and becomes the place the business goes to answer **"why did we do that?"**

> **Example: PlayerZero.** Production engineering sits at the intersection of SRE, support, QA, and dev — a classic "glue function" where humans carry context that software doesn't capture. PlayerZero starts by automating L2/L3 support, but the real asset is the context graph it builds: a living model of how code, config, infrastructure, and customer behavior interact in reality. That graph becomes the source of truth for "why did this break?" and "will this change break production?" — questions no existing system can answer.

### The observability layer

As decision traces accumulate and context graphs grow, enterprises will need to monitor, debug, and evaluate agent behavior at scale.

> **Example: Arize** is building the observability layer for this new stack — visibility into how agents reason, where they fail, and how their decisions perform over time. Just as Datadog became essential infrastructure for monitoring applications, Arize is positioned to become essential infrastructure for monitoring and improving agent decision quality.

---

## Key signals for founders

Two signals apply to all three opportunities:

1. **High headcount.** If a company has 50 people doing a workflow manually (routing tickets, triaging requests, reconciling data between systems), that's a signal. The labor exists because the decision logic is too complex to automate with traditional tooling.
2. **Exception-heavy decisions.** Routine, deterministic workflows don't need decision lineage — the agent just executes. The interesting surfaces are where the logic is complex, where precedent matters, and where *"it depends"* is the honest answer: deal desks, underwriting, compliance reviews, escalation management.

One signal points specifically to **new system-of-record** opportunities:

3. **Organizations that exist at the intersection of systems.** RevOps exists because someone has to reconcile sales, finance, marketing, and CS. DevOps bridges development, IT, and support. Security Ops sits between IT, engineering, and compliance.
   These "glue" functions are a tell. They emerge precisely because no single system of record owns the cross-functional workflow. **The org chart creates a role to carry the context that software doesn't capture.**

> An agent that automates that role doesn't just run steps faster. It can persist the decisions, exceptions, and precedents the role was created to produce. That's the path to a new system of record: not by ripping out an incumbent, but by capturing a category of truth that only becomes visible once agents sit in the workflow.

---

## Closing thesis

> The question isn't whether systems of record survive — they will. The question is whether the next trillion-dollar platforms are built by adding AI to existing data, or **by capturing the decision traces that make data actionable.**
>
> We think it's the latter. And the startups building context graphs today are laying the foundation.

---

## How the four pieces fit together

Four pieces, four layers of the same stack — and there's now a clear *source* essay (Jaya & Ashu) that the other two context-graph pieces are responding to:

| Article | Author | Published | What it answers | The unit of analysis |
|---|---|---|---|---|
| **AI's trillion-dollar opportunity: Context graphs** | Jaya Gupta & Ashu Garg (Foundation Capital) | Dec 22, 2025 | *Why is the next trillion-dollar platform going to be a system of record for **decisions**, not objects?* | The market thesis — incumbents own state, startups own the orchestration path, decision traces become the asset |
| **How to build a context graph** | Animesh Koratana (PlayerZero) | Dec 28, 2025 | *How do you actually build one — and what is it really?* | The world model — agent trajectories as informed walks, schema as output, simulation as the test |
| **From CRM to CRCG** | Ishan Chhabra (Oliv) | Dec 31, 2025 | *What is a context graph and why does it beat a system-of-record?* | The data structure — nodes weighted by source authority, decision trace preserved |
| **The Definitive Guide to Harness Engineering** | TRAE | Apr 23, 2026 | *How do you wrap an LLM in a deterministic shell that can read/write that graph reliably?* | The runtime — REPL container, PPAF loop, sandboxes, policy gateway |

The four converge on the same hidden claim: **the LLM is the easy part.** What matters is what's around it — the harness that constrains it, the graph it reads from, the trajectory log that lets the graph keep growing, and the market thesis that explains why this is a venture-scale opportunity in the first place.

**Implications for FRQNCY:**

- **The two clocks problem applies to FRQNCY's content layer.** The current site stores *state* — 604 resources, 133 topics, finished pages. It barely captures the *event clock* of how a topic page came to be ordered the way it is, why a specific resource got promoted, which conversations shaped the framing. Right now that lives in chat threads with me. If FRQNCY ever wants its own agents to extend the corpus without losing your editorial voice, that event clock needs to be persisted somewhere.
- **The conviction system in the social paper is already a context-graph primitive.** Vector reputation (Social, Conviction, Debate) + Brier-scored predictions + project-anchored content = exactly the kind of *structural* (not semantic) signal Animesh argues for. Two practitioners aren't similar because they wrote similar bios — they're structurally equivalent because they made similar calls on the same projects and were right at similar rates. That's the structural-equivalence signal.
- **"The context graph is the exhaust" reframes the social platform's economics.** People aren't there to build the graph. They're there because they want to compare conviction with each other. The graph is what falls out — and the graph is what makes future agent surfaces (recommender, debate moderator, "who should I talk to about X") qualitatively different from anything an incumbent could bolt on.
- **Simulation as the test is the editorial honesty bar.** Once FRQNCY has accumulated enough trajectory data — what topics each practitioner engaged with, in what order, with what conviction shifts — the test isn't "can the system retrieve a relevant resource." It's "given this practitioner's path so far, can it predict what they'll change their mind about next, and be right." If yes, it's a world model of consciousness practice. If no, it's still a search index dressed up.

---
---

# Tooling note — gtr (Git Worktree Runner)

**Repo:** https://github.com/coderabbitai/git-worktree-runner
**Maintainer:** CodeRabbit (`coderabbitai`)
**License:** Apache 2.0
**Tagline:** *"A portable, cross-platform CLI for managing git worktrees with ease."*
**One-line install (macOS):** `brew tap coderabbitai/tap && brew install git-gtr`
**Hero image in the README:** *"4 AI agents working in parallel across different worktrees."*

> Why this is in the harness doc: it's the missing concrete *isolation primitive* for the runtime layer. TRAE's piece talks about sandbox levels — process isolation, containers, microVMs, full VMs. **`gtr` is the git-level sandbox**: each agent works in its own worktree on its own branch, with its own copy of `.env` files and `node_modules`, so multiple agents can hammer the same repo in parallel without overwriting each other or fighting over branch checkouts. It's the pragmatic version of the State Separation Principle for codebases.

---

## What it actually is

`git worktree` is a built-in git feature that lets you check out multiple branches of the same repo into separate folders simultaneously — instead of stashing/switching, you have parallel working directories. The DX is notoriously bad: `git worktree add ../my-project-feature feature` is verbose, manual, error-prone, and doesn't help you set up env files, install deps, open editors, or launch AI tools.

**`gtr` (invoked as `git gtr`) wraps `git worktree` with quality-of-life features explicitly designed for AI-agent-driven development.** From the README:

> Constantly stashing/switching branches disrupts flow. Running tests on main while working on features requires manual copying. Reviewing PRs means stopping current work. **Parallel AI agents on different branches? Nearly impossible without worktrees.**

---

## The daily-use surface

```bash
# One-time setup per repository
git gtr config set gtr.editor.default cursor
git gtr config set gtr.ai.default claude

# Daily workflow
git gtr new my-feature           # Create worktree folder
git gtr new my-feature --editor  # Create and open in editor
git gtr new my-feature --ai      # Create and start AI tool
git gtr new my-feature -e -a     # Create, open editor, then start AI

# Run commands inside a worktree without cd-ing
git gtr run my-feature npm test

# Navigate (with shell integration)
gtr cd                # Interactive picker (requires fzf)
gtr cd my-feature

# List, remove, batch clean
git gtr list
git gtr rm my-feature
git gtr clean --merged   # Remove worktrees whose PRs/MRs have merged
```

---

## Where it slots into the harness stack

The article cluster above describes four layers — *market thesis → world model → data structure → runtime*. `gtr` sits one level deeper than TRAE's runtime layer: it's the **per-agent execution environment** that makes parallel agent work physically possible on a single dev machine.

| Harness concern (from TRAE) | How `gtr` addresses it |
|---|---|
| **Sandboxed Execution** — every agent should run in an isolated environment | Each worktree is a separate folder on disk with its own checked-out branch and copied env. Agents can't accidentally write into each other's working state. |
| **State Separation Principle** — "the LLM is a stateless CPU; state lives elsewhere" | Each worktree *is* the externalized state for an agent's working session. Branch + folder + env-file copies = the agent's persistent state, fully reified outside any prompt. |
| **Parallel orchestration** — running multiple agents on the same task without conflicts | The README's lead use case — *"4 AI agents working in parallel across different worktrees"* — is the visual definition of multi-agent harness orchestration at the filesystem level. |
| **Reproducibility / fault recovery** — the R in R.E.S.T | A worktree is a deterministic checkout. Crashed agent? Delete the worktree and `git gtr new` again from the same ref. The state is reconstructable from `git` + your `gtr.copy.include` config. |
| **Hooks & lifecycle** — every component supports fault tolerance, retries | `gtr.hook.postCreate = "npm install"`, `gtr.hook.postCd = "source ./vars.sh"`. A managed lifecycle around a primitive that didn't have one. |

It also gestures at one of the implicit moves in the Jaya/Ashu framing: **the orchestration layer is where decision traces get captured.** When you run agents inside `gtr`-managed worktrees, you get a trivial trace per agent: which branch, which ref, which prompts, which `git log` of changes the agent committed. That's the substrate a context graph could be built on.

---

## Editor and AI adapters

The README explicitly enumerates the integration surface:

- **Editors:** Antigravity, Cursor, VS Code, Zed, "and more"
- **AI tools:** Aider, Auggie, Claude (Code), Codex, Continue, Copilot, Cursor, Gemini, OpenCode

Adding new adapters (JetBrains, Neovim, Codeium, etc.) is one of the four "help wanted" areas in CONTRIBUTING.

---

## Why it's worth pinning here

Three reasons it's the right footnote to this doc rather than a passing link:

1. **It makes the abstract concrete.** The four essays argue that orchestration matters; `gtr` is one of the smallest possible tools that makes parallel agent orchestration ergonomic on a real repo today. A reader who finishes the four essays and asks *"OK, but where do I start tomorrow?"* gets a one-liner answer.
2. **It aligns with the FRQNCY working pattern.** Most of the agent work on FRQNCY (the social research paper, the discover-brand piece, the v2 page generation) has been multi-agent batches. Doing those across worktrees instead of serially in the main checkout would let multiple drafts run in parallel without stomping on each other's `dist/`.
3. **It's a clean instance of the "harness" frame.** TRAE's whole metaphor is that you don't change the horse, you build the reins. `gtr` is reins for the filesystem-level horse — git itself.

**Suggested experiment:** install `gtr` on the FRQNCY repo, set `gtr.editor.default cursor` and `gtr.ai.default claude`, and the next time we do a multi-agent batch (e.g., generating four topic pages in parallel), spin each one up as `git gtr new topic-X --ai` so they run in isolated worktrees instead of serially. The `clean --merged` command would then garbage-collect the branches after PRs land.
