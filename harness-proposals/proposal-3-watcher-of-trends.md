# Proposal 3: Watcher of Trends

## Core thesis (1 sentence)

Build FRQNCY's harness as the thinnest possible **layer of consciousness-domain opinion** on top of the Claude Agent SDK + a tmux/worktree orchestrator + an MCP-native tool surface, and refuse to write a single line of generic infrastructure that the ecosystem will commoditize before Q3 2026.

## Lens

The 2026 risk isn't that your harness fails — it's that you spend three months rebuilding what shipped as a `pip install` last Tuesday. Every "harness primitive" in `harness.md` (tool gateway, call interceptor, feedback assembler, context state manager, exception handler) now exists as a free, open-source, well-trafficked dependency from at least three vendors who can each outspend you 1000x. The job of *this* harness is to inherit all of that for free and reinvest the saved weeks into the only thing nobody else can ship for you: a feedback loop that knows what "good" means for FRQNCY readers.

## Phases

### Phase 0: Trend audit + freeze the foundation (Week 1)

- **What to build:** A two-day spike that *deliberately does not write code*. Read this proposal, install Claude Agent SDK (Python or TS), Sculptor, OpenHands, Mastra. Run the same trivial FRQNCY task ("draft a topic page on coherence breathing, then critique it") through all four. Pick the substrate. Lock the decision in writing.
- **Why:** The single most expensive mistake in 2026 is choosing your runtime by gut. Two days of comparative shopping saves two months of regret. Every other phase is downstream of this choice.
- **Dependencies:** None. Just discipline.
- **Recommendation in advance:** Claude Agent SDK as the agent runtime, Sculptor as the local parallel-agents UI for development, a small custom tmux+worktree script for the production loop (because no off-the-shelf orchestrator yet handles "permanent loop" the way Orlando wants).

### Phase 1: Single-agent loop, 100% off-the-shelf (Weeks 2–3)

- **What to build:** One Claude Agent SDK process running a PPAF loop against the FRQNCY repo. State on disk in `.frqncy/state/`. Tool surface = built-in (Read/Write/Edit/Bash/Glob/Grep/WebSearch/WebFetch) + the official Stripe MCP server + a custom FRQNCY MCP server (3 tools max: `publish_page`, `propose_ab_test`, `read_analytics`).
- **Why:** Prove the loop works before parallelizing it. The Agent SDK already provides the tool gateway, call interceptor, hooks (your exception handler), subagents (your context isolation), and skills (your domain prompts). You write zero infrastructure. You write a SKILL.md and a hooks.py.
- **Dependencies:** Claude Agent SDK, one MCP server, Anthropic credits.

### Phase 2: Eval harness before parallelism (Weeks 4–5)

- **What to build:** Braintrust or Langfuse wired in. A FRQNCY eval set: 20 fixture tasks ("write a page about X in the FRQNCY voice", "propose three A/B test variants for the homepage hero", "rewrite this paragraph to match brand voice"), each with a verifier — half code-based (schema, link validity, word count, banned-word list), half LLM-as-judge (voice match, factual claims). Every PR the agent opens must pass this gate.
- **Why:** Without evals you are flying blind, and "self-evolving" without verifiers is just "self-degrading." The 2026 consensus across LangChain, AWS, and the EDDOps literature is unambiguous: **evals are the harness, not a nice-to-have.** This is also the cheapest insurance against commoditization — a great eval set is yours forever even if you swap models or runtimes monthly.
- **Dependencies:** Phase 1, Braintrust or Langfuse account.

### Phase 3: Parallel agents via tmux + worktree, copying the muxtree pattern (Weeks 6–7)

- **What to build:** A 200-line bash script (steal from `muxtree`, ComposioHQ's `agent-orchestrator`, or `oh-my-codex`) that spawns N Claude Agent SDK processes, each in its own git worktree, each in its own tmux pane, each with a different role-skill (Researcher, Writer, Critic, Publisher). Inter-agent message passing = files in `.frqncy/mailbox/`. No queue, no broker, no Redis.
- **Why:** This is the only genuinely novel piece, and it's still ~200 lines because the substrate (Claude Agent SDK) handles everything inside each pane. Tmux + worktree is now the consensus parallel-agents pattern across the open-source coding-agent world; it's not exotic, it's load-bearing.
- **Dependencies:** Phase 2, tmux, git ≥ 2.5.

### Phase 4: Permanent loop + cost governor (Week 8)

- **What to build:** systemd / launchd unit that keeps the tmux session alive forever. Hooks-based budget killswitch (hard token-budget per agent per day). LangSmith or Langfuse trace viewer always on a second monitor. One-click "kill all and rollback" command.
- **Why:** "Permanent loop" is an operational claim, not a code claim. The hard parts are observability and cost — both already solved by the ecosystem. You just wire them up.
- **Dependencies:** Phase 3.

### Phase 5: Skills library = product (Week 9+, ongoing)

- **What to build:** Treat each FRQNCY agent capability as a SKILL.md file in a versioned skills/ folder. `frqncy-voice-enforcer`, `frqncy-topic-researcher`, `frqncy-conversion-experiment-designer`, `frqncy-ab-publisher`. These are the proprietary asset.
- **Why:** Skills are the new prompt — they travel between models, between runtimes, and they're the part of your harness that competitors can't ship. Anthropic's marketplace already has 4,200+ skills; yours need to be sharper for the consciousness niche than anyone else's.
- **Dependencies:** Everything above.

## Trend research (with this lens)

1. **Claude Agent SDK has eaten the harness layer.** As of April 2026 the SDK ships Read/Write/Edit/Bash/Glob/Grep/WebSearch/WebFetch as built-in tools, plus subagents (your "context isolation"), hooks (your "exception handler" and "call interceptor" — they're literally event-driven deterministic code that runs on PreToolUse/PostToolUse/SessionStart/Stop), Skills (your "domain prompt assembly"), and full MCP support. **Almost every box in `harness.md`'s harness diagram is now a free import.** Building your own equivalents in 2026 is a vanity project. → Use the SDK, contribute the FRQNCY-specific skills back. ([Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview), [Hooks docs](https://platform.claude.com/docs/en/agent-sdk/hooks), [Skills docs](https://platform.claude.com/docs/en/agent-sdk/skills), [Subagents docs](https://platform.claude.com/docs/en/agent-sdk/subagents))

2. **MCP is no longer a bet — it's the integration substrate.** 97M monthly SDK downloads as of March 2026, 17,468 indexed servers, donated to the Linux Foundation, OpenAI/Anthropic/Google all standardized on it, Stripe ships an official MCP server. Every tool FRQNCY will ever need (Stripe billing for paid tiers, Notion for content drafts, GitHub for PRs, Plausible/PostHog for analytics) already has or will have an MCP server within 60 days. **Do not write API wrappers. Wire MCP servers.** ([2026 MCP Roadmap](https://blog.modelcontextprotocol.io/posts/2026-mcp-roadmap/), [Stripe MCP](https://docs.stripe.com/mcp))

3. **tmux + git worktree is the parallel-agents consensus, not a clever hack.** muxtree, AMUX, Composio's agent-orchestrator, oh-my-codex (18.8K stars by mid-April 2026), pasky/pi-side-agents, Sculptor's container model — all converge on the same shape: one agent per worktree, one tmux pane per agent, file-based handoff. Three independent forces drove this: CLI agents got reliable enough to run unattended, worktrees solved isolation, and tmux was already universal. **The harness.md claim is now mainstream.** ([oh-my-codex pattern](https://particula.tech/blog/parallel-coding-agents-worktree-pattern-oh-my-codex), [muxtree](https://dev.to/b-d055/introducing-muxtree-dead-simple-worktree-tmux-sessions-for-ai-coding-2kf2), [Composio agent-orchestrator](https://github.com/ComposioHQ/agent-orchestrator))

4. **Sculptor (Imbue) is the local parallel-agent UI you'd otherwise build yourself.** Mac/Linux desktop app, free in beta, runs Claude Code agents in isolated Docker containers in parallel, "Pairing Mode" syncs an agent's container back to your local repo on one click, session persistence built in. Imbue is well-funded and the team is competent. **Use it for development; don't try to build a UI for the harness yourself.** ([Sculptor by Imbue](https://imbue.com/sculptor/), [GitHub](https://github.com/imbue-ai/sculptor))

5. **Devin, Cursor background agents, and Replit Agent 3 are converging on "the autonomous PR is the unit of work."** Devin 2.2 self-verifies via computer use; Managed Devins coordinate fleets; Cursor runs 8 background agents in parallel that return PRs; Replit Agent 3 runs 200-minute autonomous sessions and *builds other agents*. **The product shape is settled.** FRQNCY's harness should target the same shape — agent opens PR against the FRQNCY repo, eval gate runs, you merge — because that's where every IDE will be in six months and you want to be portable. ([Devin 2026 release notes](https://docs.devin.ai/release-notes/2026), [Cursor changelog](https://cursor.com/changelog/0-50), [Replit Agent 3](https://blog.replit.com/introducing-agent-3-our-most-autonomous-agent-yet))

6. **OpenHands is the open-source escape hatch — keep it as plan B.** Self-hostable, model-agnostic (Claude/GPT/DeepSeek/Qwen/local Ollama), 53%+ on SWE-bench Verified with Claude 4.5, Kubernetes deploy in v1.6.0 (March 2026), $18.8M Series A. **If Anthropic ever decides to throttle, deprecate, or change pricing on the Agent SDK, you can swap to OpenHands in a week** *if and only if* your skills and evals stay model-agnostic. → Design the skills library to be portable. ([OpenHands](https://openhands.dev/), [Modal: Open-source AI agents](https://modal.com/blog/open-ai-agents))

7. **Mastra is the TypeScript path you'd want if FRQNCY were a runtime, not a content site.** 22K stars, 300K weekly npm downloads at v1.0 (Jan 2026), YC W25, Gatsby team — the TypeScript agent framework. Has workflows, RAG, human-in-the-loop, Mastra Studio playground, unified router across 3,300 models. **For FRQNCY's specific use case (content + experiments, not a customer-facing agent product), Mastra is overkill** — but it's worth knowing because if the harness ever grows into a productized agent on FRQNCY itself ("ask FRQNCY about coherence"), Mastra is the obvious frontend. ([Mastra](https://mastra.ai/), [Mastra docs](https://mastra.ai/docs))

8. **Eval-driven development (EDDOps) is the only actual moat.** Red Hat, AWS, LangChain, Anthropic's own engineering blog, the arXiv reference architecture papers — they all say the same thing in April 2026: **agents are TDD systems where the test suite is the product.** Tools converge: Braintrust (eval-first), Langfuse (acquired by Clickhouse Jan 2026, still OSS), LangSmith (lowest overhead), Helicone ($25/mo flat). The pattern is "verifier ladder": deterministic checks (schema, regex, link validity) → LLM-as-judge → periodic human review. **This is the part of FRQNCY's harness nobody can copy: 50 well-designed evals about consciousness/practitioner content quality.** ([AWS Evaluator patterns](https://docs.aws.amazon.com/prescriptive-guidance/latest/agentic-ai-patterns/evaluator-reflect-refine-loop-patterns.html), [Anthropic: Demystifying evals](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents), [Red Hat EDD article](https://developers.redhat.com/articles/2026/03/23/eval-driven-development-build-evaluate-ai-agents))

9. **Sandbox runtimes are commoditized — pick one, don't shop.** Modal ($0.087/hr base, $30/mo free credits), E2B ($0.05/hr, Firecracker microVMs, 150ms cold start), Daytona ($0.067/hr, 27–90ms provisioning, fastest). For FRQNCY's volume (a few autonomous PRs per day, not a fleet), **local Docker via Sculptor or just plain `git worktree` is fine**. Cloud sandboxes only matter when you scale past a single workstation. Do not pre-optimize. ([Superagent sandbox benchmark](https://www.superagent.sh/blog/ai-code-sandbox-benchmark-2026), [E2B vs Daytona](https://northflank.com/blog/daytona-vs-e2b-ai-code-execution-sandboxes))

10. **The IDE wars are a distraction for this project.** Cursor wins on autocomplete and big-codebase navigation; Windsurf wins on autonomous overreach; Zed + Claude Code is the speed-purist's pick; Antigravity is buggy and crashes per Q1 2026 reports. **For Orlando's "permanent loop" goal, none of these matter — the loop runs in tmux, not in an IDE.** Pick whatever you edit FRQNCY in by hand and stop reading IDE comparison posts. ([Cursor vs Windsurf vs Zed 2026](https://dev.to/alexcloudstar/cursor-vs-windsurf-vs-zed-the-ai-ide-showdown-2026-44eo), [Antigravity status](https://aipositive.substack.com/p/from-gemini-cli-to-antigravity-why))

11. **Skills are emerging as the unit of distribution.** Anthropic's skills marketplace has 4,200+ skills + 770 MCP servers + 2,500 marketplaces as of April 2026; SkillsMP claims 900K+ skills compatible across Claude Code/Codex/ChatGPT. **A SKILL.md is portable, version-controllable, and survives runtime swaps.** FRQNCY should treat its skills library as the product — `frqncy-voice-enforcer.skill.md` is more durable than any orchestration code Orlando could write. ([Claude Code Skills docs](https://code.claude.com/docs/en/skills), [Skills Marketplace overview](https://skywork.ai/blog/ai-bot/claude-code-skills-marketplace-ultimate-guide/))

12. **Astro now has explicit AI-agent affordances.** Built-in `build-with-ai` docs, the `astro-flyweb` integration auto-generates `/.well-known/flyweb.json` for agent discovery, and `astro-markdown-for-agents` auto-serves Markdown to agents. **FRQNCY should ship `flyweb.json` next sprint regardless of harness decisions** — it's free agent-readable surface area. There's also a published reference pattern (Agno + AgentOS + OpenRouter) for "agent researches → drafts MD → opens PR" against an Astro repo. Steal the deterministic-workflow shape. ([Astro: building with AI](https://docs.astro.build/en/guides/build-with-ai/), [Autonomous Astro pipeline](https://luismori.dev/article/autonomous-astro-content-pipeline-agno-agentos-openrouter/))

## Top 3 risks of this approach

1. **Vendor concentration on Anthropic.** If you build deeply on Claude Agent SDK + Skills + Hooks, an Anthropic price hike, deprecation, or rate-limit change hits you square. *Mitigation:* keep Skills as plain Markdown, evals model-agnostic, and OpenHands as a tested fallback (run the eval set against it once a quarter).

2. **The "thin wrapper" trap goes the other way.** If Anthropic ships, say, a "permanent autonomous loop" feature in the SDK in Q3 2026 (which they will), even your tmux orchestrator becomes redundant. *Mitigation:* keep the orchestrator under 300 lines and emotionally disposable. The skills and evals are what survive.

3. **Speed of ecosystem change outpaces this proposal itself.** Half the URLs cited here may be stale by July. *Mitigation:* Phase 0 includes a recurring monthly trend audit (1 hour, on calendar). Treat the harness like a portfolio, not a monument.

## Why this wins (vs. the obvious alternative)

The obvious alternative — and the one `harness.md` will pull you toward — is to **build the harness from first principles** because the essays make it sound like a noble craft. Write your own tool gateway. Own your own state manager. Hand-roll your own context assembler. It's intellectually satisfying and it will burn your entire summer.

This proposal wins because it converts "build the harness" into **"configure the ecosystem"** — and reinvests the time saved into the two assets nobody can buy off-the-shelf: (a) a 50-task FRQNCY eval suite that knows what FRQNCY-quality content actually is, and (b) a skills library encoding consciousness-domain editorial judgment as portable Markdown. Those compound. Tool gateways do not.

The other six proposals will likely all build something. This one builds the **smallest possible thing that the rest of the industry will continue to upgrade for free.**

## Counter-argument

The honest objection comes from the "Builder of Foundations" / first-principles camp: *"You're betting Orlando's project on third-party momentum. The whole point of `harness.md` is the realization that the harness is where engineering happens. Outsourcing the harness to Anthropic means giving up the leverage the essays say is the whole game. Also: a thin wrapper is a thin moat — anyone with two days and a credit card can replicate FRQNCY's stack the moment you ship it."*

That argument has teeth. The reply is: **the moat was never the harness in the first place** — it's the eval set, the skills, the editorial judgment, and the FRQNCY audience. A custom harness is a moat only against people who haven't built one yet, which in mid-2026 is approximately nobody. Spend the moat budget on the things that don't commoditize: voice, taste, and verifiers calibrated to consciousness-content quality. Let the wild horse run on someone else's reins.
