# FRQNCY SEO — Plan, Playbook, and Agent Prompts

This folder is the single source of truth for FRQNCY's SEO program. Read it in this order:

1. **[CONTEXT.md](./CONTEXT.md)** — what FRQNCY is, audience, voice, terminology, content schemas. Any new agent starts here. Three-minute read.
2. **[CURRENT-STATE.md](./CURRENT-STATE.md)** — honest baseline of what's already in place, what's broken, what's missing. As of 2026-04-29.
3. **[SEO-PLAYBOOK.md](./SEO-PLAYBOOK.md)** — the master strategy. Topical authority via curation depth, AI-citation as the second SERP, technical foundation as table stakes, off-page as the multi-quarter bet.
4. **[METRICS.md](./METRICS.md)** — what to measure and how, cadence, target thresholds.

Then the phased agent prompts (each phase is a folder of paste-ready prompts; run with `frqncy-harness agent "<prompt>" --model openrouter/google/gemini-2.5-flash --yolo --cwd ~/Documents/Claude/Projects/FRQNCY\ WEBSITE/`):

5. **[PHASE-1-DISCOVERY.md](./PHASE-1-DISCOVERY.md)** — keyword landscape, full content inventory, competitor baseline, current-rankings snapshot.
6. **[PHASE-2-TECHNICAL.md](./PHASE-2-TECHNICAL.md)** — schema rollout, performance, robots/sitemap, canonical sweep, internal linking, mobile, accessibility.
7. **[PHASE-3-CONTENT.md](./PHASE-3-CONTENT.md)** — topic cluster build-out, FAQ schema, evergreen depth, freshness, glossary pages.
8. **[PHASE-4-AI-DISCOVERABILITY.md](./PHASE-4-AI-DISCOVERABILITY.md)** — llms.txt, structured Q&A, knowledge-graph entries, MCP server exposure, ChatGPT/Perplexity/Claude indexability, citation-friendly content.
9. **[PHASE-5-DISTRIBUTION.md](./PHASE-5-DISTRIBUTION.md)** — Wikipedia entries, Google Knowledge Graph, partner sites, podcast appearances, organic mentions tracking.

## How to use this folder

If you're an agent picking up this work cold: read the four foundation docs in order (1 → 4), pick a phase, pick a prompt from that phase, run it. Each prompt is self-contained — you don't need any other context.

If you're Orlando: phases 1-2 are the foundation; phases 3-5 are the unlock. Phase 4 (AI discoverability) is the highest-ROI bet of the next 12 months — being citable by ChatGPT, Claude, Gemini, and Perplexity is becoming a SERP in its own right, and FRQNCY's curation depth is uniquely well-suited to it.

## Important constraints (apply to every agent)

- Never modify content under `social/`, `my-frqncy/`, `app/`, `music/`, `frqncy-os/`, `harness-proposals/` — those are active-development zones.
- Never touch `proposals/`, `docs/`, `scripts/`, `AUDIT-REPORT.md`, `CLAUDE.md` — robots.txt disallows them and they're internal.
- Voice rules in [CONTEXT.md](./CONTEXT.md) §4 are non-negotiable on any page that ships to a SERP or social card.
- Every fix run writes its audit to `~/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/runs/<YYYY-MM-DD>-<task-name>.md` so we have a paper trail.
