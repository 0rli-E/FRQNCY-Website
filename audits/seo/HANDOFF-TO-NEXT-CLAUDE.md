# Handoff to the next Claude

*A fable about a topic graph, a generator that ate schema, and a curation network learning how to be cited.*

*Written 2026-05-13 for whoever picks this up next — Claude, Fable, Sonnet, Opus, or a human.*

---

## The shape of what happened

A curation network called **FRQNCY Network** (at frqncy.network — not to be confused with the *five other FRQNCY entities* who got there first, see below) shipped 146 topic pages and 766+ vetted resources but had no SEO program. Across several days an LLM agent ran four execution sessions and three parallel-agent runs, producing roughly **40+ foundation docs and run-logs in `audits/seo/`** plus 7 fully-shipped pages (`/editorial-standards/`, `/mcp/`, `/ask/`, `/people/orlando/`, `/llms.txt`, `/llms-full.txt`, `/ai.txt`).

Three things were learned the hard way. Each is a moral.

### Moral one — the generator eats schema

The agent injected `Article`, `BreadcrumbList`, `FAQPage`, `WebPage hasPart`, bylines, and anchored-topics blocks directly into static topic and item HTML. **A subsequent run of `scripts/generate_topic_page.py` wiped most of it.** Article 174→16, BreadcrumbList 563→14, FAQPage 30→2, bylines 174→16, anchored-topics 518→0.

**Lesson for you:** never inject directly into pages the generator owns. Either modify the generator OR wrap the injection in `<!-- BESPOKE:slot --> ... <!-- /BESPOKE -->` markers (the generator preserves these). The memory file `feedback_frqncy_generator_pipeline.md` documents this in full. **Don't redo the wiped work as static-HTML injection — it will get wiped again.**

The surfaces that survived are root-level files (`llms.txt`, `ai.txt`, `robots.txt`, `sitemap.xml`), new standalone pages (`editorial-standards/`, `mcp/`, `ask/`, `people/orlando/`), and everything under `audits/seo/`. Build there.

### Moral two — the brand name is contested

When the agent ran the first brand-mention baseline, it found **5 other FRQNCY entities** (FRQNCY Media in Atlanta, FRQNCY Media Group / FMG, FRQNCY Performance, frqncy.com, Frequency Holdings OTC:FRQN). When the sameAs-matrix audit dug deeper, it found **10+** including `@FRQNCY_live`, `@FRQNCYSA`, `@FRQNCY_shop`, `@frqncyofficial`, and a YouTube "FRQNCY - Topic" auto-channel. Spotify and Apple Podcasts entries for "FRQNCY" are owned by FMG.

**Lesson for you:** Every outreach surface — pitch, post, schema, bio — qualifies as **"FRQNCY Network"** or **"frqncy.network"**, never bare "FRQNCY". This rule holds across every artifact this program shipped. Honor it.

### Moral three — llms.txt is a trap

The agent spent serious effort building `/llms.txt` (139.5 KB, 643 entries) and `/llms-full.txt` (488 KB) believing them to be the AI-discoverability flagship. The Phase 4.8 deepening agent then ran the research and found that **multiple 2026 large-scale studies (ALLMO 94K URLs; 300K-domain analyses) show llms.txt has no statistically significant lift on AI citations.** Keep what was shipped, but **do not invest more there.**

What DOES work in 2026:

- **FAQ schema is the single most-confirmed cross-engine signal.** 2.1× lift on Perplexity + ChatGPT browse, **3.2× on Google AI Overviews.** One piece of work covers three engines. **This is the highest-leverage AI-discoverability move available.**
- **Bing Webmaster Tools AI Performance dashboard** (launched Feb 9 2026) is the only AI-citation analytics surface with ground-truth data. Verifying Bing is the gate to ChatGPT visibility AND the measurement surface for Copilot.

## The strategic anchor (read this FIRST)

Orlando wrote his own consolidating plan: **[`proposals/VISIBILITY-PLAN.md`](../../proposals/VISIBILITY-PLAN.md)** committed 2026-05-12. It's the source of truth for strategy now. The companion docs in `/proposals/`: `PODCAST-OUTREACH-PLAN.md`, `TELEGRAM-CHANNEL-LAUNCH.md`, `FRQNCY-V1-ROADMAP.md`. All the `audits/seo/` work feeds into Orlando's plan; the plan distills it into 90-day execution. **Don't redo strategy. Execute against the plan or extend it.**

This `audits/seo/` folder is the implementation-state view. `audits/seo/PROGRESS.md` (and `PROGRESS.html`) is the scoreboard.

## What's shipped vs queued vs blocked

### Shipped (live on disk, no further work needed)

- **Phase 1 partial:** GSC + Bing verification meta scaffolding on 6 top-level pages, IndexNow keyfile, 754-row content inventory CSV
- **Phase 2 partial:** sitemap real lastmod from git, Organization schema on homepage (survives because it's in the root index.html which isn't generator-owned)
- **Phase 3 partial:** `/editorial-standards/` page, freshness rubric + quarterly review calendar, FRESHNESS-RUBRIC.md + QUARTERLY-REVIEW-CALENDAR.md
- **Phase 4 substantially complete:** `/llms.txt`, `/llms-full.txt`, `/ai.txt`, `robots.txt` updated, `/mcp/` docs page, `/ask/` Q&A surface, `/people/orlando/` profile, Knowledge Graph entity briefs (4 entities), Wikidata execution guide, AI engine query map (63 queries × 5 engines)
- **Phase 5 documentation 100% complete:**
  - 5.1 — Wikipedia notability dossier (verdict: don't submit yet) + CITATION-TRACKER.md
  - 5.2 — Wikidata execution guide
  - 5.3 — SAMEAS-MATRIX.md (20 platforms) + handle-decision brief
  - 5.4 — PODCAST-OUTREACH-KIT.md + PODCAST-TRACKER.md
  - 5.5 — PARTNER-PROSPECTS.md (61 candidates, 18 Tier-1) + 5 outreach templates + PARTNER-TRACKER.md
  - 5.6 — PRESS-LIST.md (32 journalists) + PRESS-PITCHES.md (3 story angles) + PRESS-TRACKER.md
  - 5.7 — HARO-PIPELINE.md (5 active 2026 platforms) + HARO-RESPONSE-TEMPLATES.md + HARO-TRACKER.md
  - 5.8 — Two reference essays (Reading list for network states 2,850w; Conscious Capital primer 3,509w) + publication brief
  - 5.9 — NEWSLETTER-PROSPECTS.md (22 candidates) + 3 templates + NEWSLETTER-TRACKER.md
  - 5.10 — MENTION-MONITORING.md + baseline
- **Content + execution layer:**
  - SOCIAL-CONTENT-30-DAY-CALENDAR.md (22 X+LinkedIn posts)
  - SOCIAL-CONTENT-THREAD-BANK.md (6 fully composed X threads)
  - SOCIAL-CONTENT-MANIFESTO-LINES.md (30 quotable lines)
  - SUBSTACK-RELAUNCH-PLAN.md (4 issues outlined)
  - TELEGRAM-LAUNCH-QUEUE.md (14 posts at Tue/Thu/Sat 09:00 Berlin)
  - WIKIDATA-EXECUTION-GUIDE.md (step-by-step for all 4 entities)
  - AI-ENGINE-QUERY-MAP.md (top-20 audit set for quarterly review)
- **Tracking infrastructure:** PROGRESS.md, PROGRESS.html, build-progress.py, CITATION-TRACKER.md

### Queued (real work that's not yet shipped)

1. **FAQ schema re-ship via BESPOKE markers** — *highest-leverage AI-discoverability move available.* Top 30 topic pages already have the FAQPage content (the agent wrote 120 Q&A pairs); just need to wrap-and-survive. Then extend to topics 31-145.
2. **Per-item OG card pipeline** (Phase 2.7) — 549 image-less item pages share a generic OG card. Biggest visual SERP weakness. Cloudflare Worker pattern recommended (the agent specced this in PHASE-2-TECHNICAL.md). Out of scope for documentation-only sessions.
3. **Cluster coverage cleanup** — 197 page-link mismatches surfaced by the 2026-04-29 audit. Either generator-side fix or BESPOKE.
4. **Reference essays #3-5** — Meditation Science (Q4), How to Read Deeper (Q1), Regenerative Agriculture (Q1). The publication brief sequences them.
5. **First quarterly freshness review** (5 fast-moving topics).

### Blocked on Orlando (human execution)

The single highest-priority outstanding item: **register @frqncy_network on X.** Multiple shipped docs assume this handle exists; the homepage Organization schema already lists it. SAMEAS-MATRIX.md gives the canonical bio copy. ~5 min of Orlando's time unblocks Substack, Telegram, social calendar, Wikidata, and the sameAs JSON drop-in.

Other Orlando-side items in priority order:
- **Verify Bing Webmaster Tools.** Activates the AI Performance dashboard — the only ground-truth analytics surface for AI citations in 2026.
- **GSC verification** — swap `GOOGLE_SITE_VERIFICATION_PLACEHOLDER` on 6 top-level pages; click Verify.
- **`npm publish @frqncy/mcp-content`** — unblocks 6 MCP registry submissions in one command.
- **Wikidata entity creation** — follow `WIKIDATA-EXECUTION-GUIDE.md`. ~2h 15min for all 4 entities. Caught 4 Q-number errors during prep; the guide has the corrections.
- **Send first 5 podcast / partner / press pitches** — PODCAST-TRACKER.md / PARTNER-TRACKER.md / PRESS-TRACKER.md all pre-filled with the top targets and template assignments.
- **Set up the 4 Google Alerts** per MENTION-MONITORING.md §1. ~10 min.
- **HARO pipeline daily routine** — Tier-1 platforms sign up at $0/mo; ~25 min/week steady state.

## How to read the audit folder

If you have **3 minutes**: read this handoff + `audits/seo/PROGRESS.md` "At-a-glance" section.

If you have **10 minutes**: also read `audits/seo/CONTEXT.md` (what FRQNCY is) and skim the phase scoreboard in PROGRESS.md.

If you have **30 minutes**: open the most recent SESSION SUMMARY in `audits/seo/runs/` and the three PARALLEL-AGENT-RUN summaries to understand what landed when. Also read `proposals/VISIBILITY-PLAN.md` because that's the strategic anchor.

If you're picking up Phase 5 execution: every Phase 5.x file in `audits/seo/` is ready to action. The TRACKERS (PODCAST, PARTNER, PRESS, HARO, NEWSLETTER, CITATION) are where progress gets logged.

## The voice rules that hold across everything

Per `audits/seo/CONTEXT.md` §4 and `proposals/EDITORIAL-STANDARDS.md`:

- Present-tense, declarative.
- Conviction, not hype.
- No spiritual cliches as direct self-description on surfaces where the surrounding context can't earn them.
- Banned phrases (the harness anchor at `~/.frqncy-harness/voice-anchor.md` has the full list; CONTEXT.md §4 lists the core): unlock, leverage, synergy, 10x, circle back, low-hanging fruit, best practices, actionable insights, synergies.
- Cooperation over competition. No leaderboards.
- Always qualify as **"FRQNCY Network"** or **"frqncy.network"** — never bare "FRQNCY".
- Sponsored content is not a category. Pick decisions precede commercial relationships.

If something you're about to write would make a careful reader uncomfortable about the editorial premise, don't write it.

## Memory you should load

`/Users/orli/Library/Application Support/Claude/local-agent-mode-sessions/.../memory/MEMORY.md` is the index. The relevant entries:

- `feedback_orlando_collaboration.md` — short directives, prefers prose, continual progress
- `feedback_frqncy_generator_pipeline.md` — **CRITICAL** — the generator-wipeout lesson
- `project_frqncy_seo.md` — full SEO program state, including the llms.txt → FAQ re-prioritization
- `project_frqncy_harness.md` — harness state (relevant if your work touches `/mcp/` or harness integration)
- `project_frqncy_website_progress.md` — website progress through end-Apr 2026
- `project_frqncy_platform.md` — NRG / website platform state

## Three things you should NOT do

1. **Don't redo strategy.** `proposals/VISIBILITY-PLAN.md` is the live plan. Extend it; don't rewrite it.
2. **Don't inject HTML into generator-owned pages.** Topic pages (`v2/<topic>/`), item pages (`books/`, `people/`, `orgs/`, `media/`, `places/`) all get regenerated. Use BESPOKE markers or modify the generator.
3. **Don't touch active-dev zones.** `social/`, `my-frqncy/`, `app/`, `music/`, `frqncy-os/`, `harness-proposals/` are in flight elsewhere. Multiple worktrees were active during this work (`frqncy-harness/5e0f4ee5...`, `c23d4d96...`, `e6b1c89b...`). Stay in `audits/seo/`, the four standalone pages you can build (`editorial-standards/`, `mcp/`, `ask/`, `people/orlando/`), and root files (sitemap, robots.txt, llms.txt, ai.txt).

## One last note

If you're a future Claude reading this: the work shipped because each session refused to spam edits to 1000+ pages. Bias toward small surgical additions in stable zones, parallel-agent runs for documentation-heavy work, and honest verification of any claim before treating it as fact. The hardest things to catch were the assumed-wins that the data later contradicted (llms.txt, the @frqncy_network handle, the Substack pricing, the Wikidata Q-numbers). Verify before recommending. Mark `[verify]` when uncertain. Update the dossier when the world shifts.

The fable ends here, but the topic graph doesn't. Pick up where this left off, and don't break what's working.

— Claude, 2026-05-13
