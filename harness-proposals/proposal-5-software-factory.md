# Proposal 5: Software Factory

## Core thesis (1 sentence)

FRQNCY's harness is not a CMS-with-AI; it is an **evolutionary engine** in which parallel agents play the role of mutation operators on a population of page variants, an autonomous A/B fitness function selects survivors, and a deploy gate promotes winners to production — the CLI is just how Orlando seeds the genome and watches the species evolve.

## Lens

Read "self-evolving FRQNCY" literally. Loom-style "software factory" (Huntley) is the destination — autonomous loops that propose product changes, ship to staging, measure, and promote winners ([ghuntley.com/loop](https://ghuntley.com/loop/)) — and AlphaEvolve / OpenEvolve / ShinkaEvolve have proven LLMs make excellent **mutation operators** when paired with a real fitness function. Anything less is a CMS with extra tmux. The harness's job is to be the **selection pressure**, not the keyboard.

## Phases

### Phase 0: Genome and Fitness (Week 1–2)

- **What to build.** Define FRQNCY's genome: every page is a structured `.json` "specimen" — frontmatter (title, hook, CTA), section blocks, copy fragments, image refs, plus `lineage` (parent IDs, mutation log) and `fitness`. Astro components render specimens deterministically. Wire up PostHog ([posthog.com/experiments](https://posthog.com/experiments)) with one event schema: `page_view`, `scroll_depth`, `cta_click`, `practitioner_lead`, `time_on_page`. Define the **fitness function** explicitly: `F = 0.5·conversion_rate + 0.3·normalized_time_on_page + 0.2·scroll_depth_75`, with a 95% Bayesian credibility interval gate before any winner is declared. No agents yet — this phase is the chromosome and the scoreboard.
- **Why.** AlphaEvolve's insight is that the LLM is only as good as the evaluator ([deepmind.google/blog/alphaevolve](https://deepmind.google/blog/alphaevolve-a-gemini-powered-coding-agent-for-designing-advanced-algorithms/)). Start with the evaluator, or every later phase is theatre.
- **Dependencies.** Astro content collections refactored to specimen schema; PostHog project; one calibration page hand-rendered to produce baseline fitness numbers.

### Phase 1: Single-Cell Organism — One Loop, One Specimen (Week 3–4)

- **What to build.** A single Claude Agent SDK loop running Huntley-style ralph in tmux against `gtr` worktrees: `loop-mutate` reads one specimen + the live fitness data, proposes a mutation (rewrite hook, swap CTA, restructure section), commits to a `gtr` worktree, opens a Vercel preview, writes the diff + rationale to `mutations.jsonl`. **Human gate** at this phase — Orlando reviews and merges. No autonomous deploy yet.
- **Why.** Huntley's discipline is "watch the loop" before scaling it (harness.md §A). Read a hundred mutations and codify the failure modes — bad copy, off-brand voice, hallucinated stats — into the harness's exception handler before any agent gets the deploy key. It's also the cheapest place to discover that your fitness function is wrong.
- **Dependencies.** Phase 0 specimens + PostHog. Claude Agent SDK + tmux + gtr from harness.md baseline. Vercel preview deploys (now a prerequisite for machine-driven dev — 30% of Vercel deploys are agent-initiated, [vercel.com/blog/agentic-infrastructure](https://vercel.com/blog/agentic-infrastructure)).

### Phase 2: Population — Parallel Mutation Operators (Week 5–7)

- **What to build.** Scale to **N=8 parallel agents** in a single tmux session, each in its own `gtr` worktree, each working on a different specimen from a shared `population/` queue. Add three role-typed loops borrowed straight from OpenEvolve's island model ([github.com/algorithmicsuperintelligence/openevolve](https://github.com/algorithmicsuperintelligence/openevolve)): `loop-explore` (high-temperature, wild rewrites — Gemini-Flash equivalent), `loop-exploit` (low-temperature, refine the current leader), `loop-cross` (combine two high-fitness parents into a child specimen). Add a `loop-critic` that reads diffs against `brand-voice.md` and rejects out-of-voice mutations *before* they reach the deploy queue. All loops write to `mutations.jsonl`; a human still merges, but the queue depth becomes the throttle.
- **Why.** This is the architecture AlphaEvolve / OpenEvolve / ShinkaEvolve converged on: explore/exploit operators with quality-diversity binning beat any single chain-of-thought agent. Huntley's "no multi-agent" warning (harness.md §A) doesn't apply — these aren't peer agents negotiating; they're independent mutation operators on a shared queue with a shared evaluator. Parallel evolution, not microservice spaghetti.
- **Dependencies.** Phase 1 stable. `brand-voice.md` codified. Population queue (just a directory + file lock).

### Phase 3: Autonomous Selection — Bandit-Driven A/B (Week 8–10)

- **What to build.** Replace the human merge gate with a **multi-armed bandit deploy controller**. Top-3 mutations per specimen auto-deploy as PostHog feature-flag variants. A Thompson-sampling bandit shifts traffic toward higher-fitness variants in real time. PostHog's bandit support is a feature-flag workaround ([github.com/PostHog/posthog/issues/25727](https://github.com/PostHog/posthog/issues/25727)) — wrap it in a 200-line `bandit.ts`, or swap to Statsig (native bandits; just acquired by OpenAI for $1.1B: [posthog.com/blog/posthog-vs-statsig](https://posthog.com/blog/posthog-vs-statsig)). Winners auto-promote to 100% and commit to `main`; losers die, lineage logged. **The harness now ships code without Orlando.**
- **Why.** This is where FRQNCY stops being a website and starts being an organism. It's also the riskiest — hence two cheap circuit breakers (n≥1000 sessions; brand-voice critic veto), both deterministic, not LLM-vibes.
- **Dependencies.** Phase 2 stable; ≥10k weekly sessions to make bandits meaningful. Below that, run Phase 2 longer and use AgentA/B-style synthetic-user pre-filter ([arxiv.org/html/2504.09723](https://arxiv.org/html/2504.09723)) to trim population before real traffic.

### Phase 4: Speciation — Cross-Page and Cross-Topic Evolution (Week 11–14)

- **What to build.** Until now, each specimen evolves against itself. Phase 4 adds a `loop-architect` that reads aggregate fitness across the whole site and proposes **new specimens** — new topic pages, new funnel steps, new entry points — by recombining the highest-fitness fragments from existing pages. It also runs the inverse: prunes specimens whose fitness has plateaued below median for 30 days. The site's information architecture is now under selection pressure, not just its copy.
- **Why.** This is the Loom thesis — autonomous loops that "evolve products and optimize for revenue" (harness.md §A; Huntley's Jan 2026 demo of "evolutionary auto-heal" went exactly this way). Without this phase, you've built a paragraph optimizer; with it, you've built a product strategist.
- **Dependencies.** Phase 3 producing winners reliably; SEO and IA guardrails defined (canonical URLs, redirect map, 404 budget).

### Phase 5: Observability and the Lineage Tree (ongoing, starts Phase 1)

- **What to build.** A read-only dashboard (single-page Astro route, gated) that renders the live lineage tree: every specimen, its parents, its mutations, its fitness, its current traffic share, the agent that proposed it. tmux is for piloting; this is for understanding. Plus a nightly `genome-report.md` written by a `loop-historian` agent: "this week mutation M changed the hero CTA, fitness moved from 0.18 to 0.24 over 3,400 sessions, here's the diff."
- **Why.** Traceability is one of the four R.E.S.T pillars in harness.md §2.1 and the only thing standing between "self-evolving" and "self-corrupting." When the system ships something weird, you need to walk the lineage in seconds.
- **Dependencies.** Phase 0 lineage schema; runs in parallel with all subsequent phases.

## Trend research (with this lens)

1. **Loom is real and the demo already happened.** Huntley publicly demoed "the first evolutionary software auto heal" in Jan 2026 — system identified a feature problem, studied the codebase, fixed it, deployed it, verified it, autonomously ([ghuntley.com/loop](https://ghuntley.com/loop/); Loom source opened at [x.com/GeoffreyHuntley/status/2011788568742797565](https://x.com/GeoffreyHuntley/status/2011788568742797565)). His framing: "level 9," beyond Yegge's level 8. Treat it as the proof-of-concept and the target.

2. **AlphaEvolve / OpenEvolve / ShinkaEvolve settled the architecture question.** The pattern that works: LLM-as-mutation-operator + island-based populations + MAP-Elites quality-diversity binning + a deterministic evaluator ([deepmind.google/blog/alphaevolve](https://deepmind.google/blog/alphaevolve-a-gemini-powered-coding-agent-for-designing-advanced-algorithms/), [github.com/algorithmicsuperintelligence/openevolve](https://github.com/algorithmicsuperintelligence/openevolve), [github.com/SakanaAI/ShinkaEvolve](https://github.com/SakanaAI/ShinkaEvolve)). AlphaEvolve beat Strassen's 1969 matmul and shaved 1% off Gemini's training time; the architecture transfers cleanly to "evolve a landing page against conversion rate."

3. **Autonomous PR-shipping is table stakes.** Cursor: >30% of merged PRs are now from cloud agents that spin up VMs, run tests, capture video, and submit ready-to-merge PRs ([nxcode.io/resources/news/cursor-cloud-agents-virtual-machines](https://www.nxcode.io/resources/news/cursor-cloud-agents-virtual-machines-autonomous-coding-guide-2026)). Vercel: >30% of deployments agent-initiated, up 1000% in six months ([vercel.com/blog/agentic-infrastructure](https://vercel.com/blog/agentic-infrastructure)). Vercel's framing: "preview URLs on every commit and instant rollbacks aren't DX upgrades — they are prerequisites for machine-driven software development." Phase 3's deploy gate is the 2026 default, not a moonshot.

4. **Synthetic-user evaluation closes the cold-start problem.** AgentA/B (CMU/Adobe, [arxiv.org/html/2504.09723](https://arxiv.org/html/2504.09723)) runs LLM agents with diverse personas executing realistic multi-step interactions — search, click, filter, purchase — at a cost where you can throw *thousands* of synthetic users at a variant before any real traffic. For FRQNCY at sub-10k weekly sessions, this is the bridge that makes Phase 3 viable now, not after a year of organic growth.

5. **Yegge's Gas Town levels frame the ambition.** Stages 7–8: "10+ agents, hand-managed" and "build your own orchestrator" ([steve-yegge.medium.com/welcome-to-gas-town](https://steve-yegge.medium.com/welcome-to-gas-town-4f25ee16dd04); follow-up "Gas City" Apr 2026 [steve-yegge.medium.com/welcome-to-gas-city](https://steve-yegge.medium.com/welcome-to-gas-city-57f564bb3607)). Huntley's level 9 is the next rung: the orchestrator stops needing human task assignment because the fitness function does the assigning. Phases 0–2 get fluent at level 7; Phase 3 is the level-8/9 jump.

6. **The platform stack is converging.** Statsig (acquired by OpenAI, $1.1B) + GrowthBook + PostHog all ship native experiment SDKs with feature-flag rollouts ([humblytics.com/blog/best-ab-testing-platforms-2026](https://humblytics.com/blog/best-ab-testing-platforms-2026-complete-guide), [posthog.com/blog/best-statsig-alternatives](https://posthog.com/blog/best-statsig-alternatives)). The "autonomous A/B" piece doesn't need to be invented — it needs to be wired up.

## Top 3 risks of this approach

1. **Fitness gaming / Goodhart collapse.** Agents optimize the metric, not the goal. If `F` overweights `cta_click`, you evolve a clickbait farm that tanks long-term trust. **Mitigation:** brand-voice critic veto (deterministic LLM call against `brand-voice.md`) as a hard pre-deploy gate; a non-optimized guardrail set (bounce, return-visitor, complaint volume) that auto-rolls-back any >2σ move; monthly fitness review with fresh eyes.

2. **Brand drift through compounding mutations.** Each mutation is in-voice; the 50th-generation descendant may not be. **Mitigation:** every specimen carries a `voice_anchor` — original human-written hero copy — and the critic scores against the anchor, not the parent. Weekly `loop-archaeologist` diffs high-fitness specimens against originals.

3. **Statistical underpowering at FRQNCY's scale.** Bandits need volume. At ~5k weekly sessions, significance windows run 4–8 weeks and parallel experiments contaminate each other. **Mitigation:** AgentA/B synthetic-user pre-filter trims population 8→2 before real traffic; mutually-exclusive experiment groups; below 10k weekly sessions, Phase 3 stays human-gated.

## Why this wins (vs. the obvious alternative)

The obvious alternative is **"agent-assisted CMS"**: Orlando types prompts, an agent drafts pages, Orlando merges. Yegge level 5–6. Scales Orlando's hours linearly, caps at his attention, never produces a single fact about what actually converts. This proposal scales **the search itself**. By Phase 3 the system runs without him. By Phase 4 it proposes pages he wouldn't have. The fitness function is the boss — works 24/7, never gets bored, never falls in love with its own ideas, tells you in numbers whether the latest mutation deserves to live.

The near-alternative — "Optimizely / VWO / Statsig with a human writing variants" — is what every well-funded growth team does, and it ships maybe 10 variants a quarter. The harness ships 10 a week. Not a 10x; a different category of company.

## Counter-argument

The honest counter comes from Huntley himself. His ralph-loop doctrine (harness.md §A) is monolithic by default: "until single-agent loops are exhausted, multi-agent setups are accidental complexity dressed up as sophistication." A purist would say: skip Phase 2's parallel population, run a single ralph loop serially against the queue, let it cook for three months, and you'll get 80% of the value at 20% of the operational complexity — no race conditions, no shared queues, no critic-vs-mutator frame drift.

Stronger version: **fitness-function design and the deploy gate are 90% of the value of this proposal**, and the parallel-population machinery is the 10% that adds most of the failure modes. A leaner roadmap would do Phase 0 + Phase 1 + Phase 3 (skip the population) and only add Phase 2 if single-loop throughput becomes the bottleneck — which, at FRQNCY's traffic scale, it probably won't for six months.

The defense: the population is what lets the system **explore** rather than just **exploit**, and the explore/exploit split is exactly what AlphaEvolve and OpenEvolve discovered they needed once they tried the single-mutator version. A serial loop against a fitness function converges on a local maximum and stops. Eight loops with different temperatures keep finding new basins. If FRQNCY is going to be a *species* and not a *page*, you need the population. But the staged rollout (0 → 1 → 3 → 2 → 4) is a defensible alternate ordering.
