# THE FRQNCY SEO PLAYBOOK

This is the master strategy. It's written for the founder, but every agent picking up SEO work should read it once before opening a phase doc — the *why* behind each task lives here.

## The thesis in one paragraph

FRQNCY's moat is curation depth across 146 topics × 766 resources, anchored to a real editorial standard, written in a voice nobody else owns. That depth is the SEO compound — every topic page that's better than the rest of the internet pulls weight in the cluster around it, and every resource we vet is a node we own in the knowledge graph. The work is to make that depth legible to four audiences: Google's classical ranker, the AI answer engines (ChatGPT, Claude, Gemini, Perplexity, Copilot), the human reader who arrives via search, and the partner sites who'll eventually link to us. We do not chase keywords. We do not write for search bots. We make every page so unmistakably the best entry on its topic that the bots find us when they're trying to do their job well.

## The five strategic bets, in priority order

### Bet 1 — Topical authority via the cluster model (highest ROI)

The 146 topic pages are pillar pages. The 766 resources are spokes. Every spoke must link to its pillar; every pillar must link to its spokes. That's the cluster. When a cluster is dense and internally linked, Google reads the whole cluster as one body of authority, and individual long-tail queries surface the right page from the cluster.

Concrete: a query like *"best book on the history of meditation"* should return `books/the-mind-illuminated/` (a spoke) **with the topic page `v2/meditation/` (the pillar) ranked beside it**. Same logic for every topic. Right now the books / people / orgs / media pages exist but are weakly cross-linked back to topics. Phase 3 closes this loop.

We don't add topics to chase keywords. We refine the 146 we have until each one is the best public-internet entry on its subject. Better answers what gets indexed; depth is what wins.

### Bet 2 — AI discoverability as the second SERP

In 2026, "search" is no longer one box. It's: Google, Perplexity, ChatGPT search, Claude search, Gemini, Copilot. The ones that aren't Google are growing faster, and they cite differently — they want structured, factual, well-bordered answers with clean source attribution. They love sites that publish:

- a clean `llms.txt` describing what the site is and what's worth crawling
- structured Q&A on every page (FAQPage schema)
- canonical, dated, attributed editorial entries (Article + Person)
- a public MCP server that lets any AI agent query the site as a tool

FRQNCY already has the MCP server (`mcp-servers/frqncy-content/`) which makes the site a *tool* in any AI agent's toolbox. That alone is unusual. Combined with FAQ schema across topic pages and a proper llms.txt, FRQNCY becomes one of the easiest sites for an AI to cite — and AI citations are the next link economy. Phase 4 is this entire bet.

### Bet 3 — Technical foundation as table stakes

We do not "do" technical SEO; we keep it from being a problem. The current state is good — canonical URLs, JSON-LD, valid sitemap, robots.txt. The remaining gaps are FAQPage / HowTo / BreadcrumbList / ItemList schema, real `lastmod` in the sitemap, GSC + Bing Webmaster verification, per-item OG cards (the deferred big one), and migrating Unsplash hero images off external. Phase 2 ships these in three sprints.

We don't chase Core Web Vitals as a goal — the site is already fast and uses minimal JS. We monitor it as a guardrail.

### Bet 4 — Content depth as a forever activity

A topic page is never "done." Every quarter we revisit a slice of the 146 — read the page, ask "is this still the best public-internet entry on this subject?", refresh resources, deepen the explainer block, add new picks. The harness's `compress-memory` and `replay` commands are the right tools for this; freshness becomes a function of cadence, not heroics. Phase 3 establishes the cadence and the rubric.

We add new topics only when the cluster genuinely opens a new branch (not because a keyword has volume). New topics get the full editorial pass — story, picks, schema, OG card, internal links — before they ship.

### Bet 5 — Distribution and backlinks as the multi-quarter compound

This is the slowest of the five and the highest absolute ceiling. We do not buy links. We earn them by:

- Wikipedia entries for FRQNCY-the-org and the FRQNCY Podcast (notable, well-sourced, written in the third person)
- Cross-platform `sameAs` consistency (Twitter, LinkedIn, Crunchbase, AngelList, etc.) so Google's Knowledge Graph can fuse the entity
- Podcast appearances on shows that cover consciousness / regenerative living / network states — every appearance is a link + brand mention + audio with the URL
- Partner pages with sanctuaries, retreat centers, conscious-capital funds — natural reciprocal linking when there's a real relationship
- Content that gets cited because it's the best public reference on the subject (the moat compounds)

Phase 5 is this bet. It's months and years, not weeks.

## What we don't do

**We don't keyword-stuff.** Every page reads first, optimizes second.

**We don't generate AI slop topic pages.** Every topic page is editorially written or rewritten; the LLM is a research and drafting assistant, not the byline.

**We don't run paid SEO ads to compensate for organic gaps.** That's not the strategy. Membership funds the free layer; Google ads do not.

**We don't link-swap or guest-post for SEO juice.** If we're on a partner's site, it's because the relationship is real.

**We don't game featured snippets with question-answer hacks.** We add FAQ schema where it reflects real reader questions; if Google promotes those answers, fine.

**We don't chase trending topics to surf search volume.** The 146 are durable.

## The reader-first contract

Every SEO task has to pass this filter: *would the reader who lands here from search be glad they did?* If a fix would help us rank but would make the page worse for a real reader, we don't ship it. If a fix is invisible to the reader and helps the bots, ship it. If a fix helps both, ship it twice.

Concrete examples of pass/fail:

- ✅ Adding FAQ schema where the answers are real and useful → both bots and readers win
- ✅ Generating per-book OG cards → cleaner social shares, no reader downside
- ✅ Marking up breadcrumbs → invisible to readers, eligible for SERP breadcrumb display
- ❌ Adding "10 best books on meditation" listicle pages to capture commercial intent → off-brand, not how the curation works
- ❌ Padding topic pages with FAQ entries that nobody actually asks → noise, damages signal
- ❌ Buying links from "high DA" SEO marketplaces → off-brand, against editorial values

## The org structure of the SEO program

There are five phases (Phases 1-5). Each is a doc full of agent prompts. Phases 1-2 are **one-shot**: they bring the site to a clean baseline. Phases 3-5 are **continuous**: they're the work that compounds quarter after quarter.

Sequencing recommendation:

- **Sprint 1 (this week):** Phase 1 (Discovery) + Phase 2 partial (FAQ schema rollout, BreadcrumbList sitewide, real sitemap lastmod, GSC + Bing verification, top-level page OG cards)
- **Sprint 2 (next 2 weeks):** Phase 2 complete (per-item OG card pipeline, internal linking pass, Article schema on topic pages with author + dateModified), Phase 4 start (llms.txt, MCP server documentation page)
- **Sprint 3 (month 1):** Phase 3 start (topic-cluster cross-linking, freshness rubric, FAQ depth on top 50 topics)
- **Quarter 1 (months 2-3):** Phase 3 deepening + Phase 4 complete + Phase 5 start (Wikipedia drafts, podcast outreach kit)
- **Quarter 2+:** continuous Phase 3-5

## Success criteria, in plain English

**3 months in:** GSC reporting clean coverage on all 757 pages; FAQ rich results live on at least 30 topic pages; sitewide BreadcrumbList; per-topic Article schema with `dateModified`; llms.txt published and referenced; 5+ AI agents (via MCP) querying frqncy-content per week.

**6 months in:** organic impressions in GSC up 5×; at least 2 topic pages ranking page-one for moderate-difficulty terms; per-item OG cards across at least 50% of items; first podcast appearances logged; first partner backlinks (sanctuaries, conscious-capital partners).

**12 months in:** Wikipedia entry live (or refused with a clear notability case to retry against); Google Knowledge Graph entry detected; first month with >10K organic clicks/month; AI-citation tracking shows FRQNCY referenced as a source by Perplexity / ChatGPT / Claude on at least 5 distinct queries per week.

These are aspirational but not crazy. The curation moat is real; the gap is making it legible.

## How to use the phase docs

Each phase doc has the same structure:

- **What this phase achieves** — the goal in one paragraph
- **Prerequisites** — what must be true before you start (which prior phases need to be partial-or-complete)
- **Tasks** — numbered, paste-ready agent prompts. Each task is **a single agent invocation** — no chains, no branching. Persistent output paths under `audits/seo/runs/`.
- **Verification** — how to confirm the task actually shipped (often: a curl or a grep)
- **Done definition** — the exit criteria for the phase

Tasks across phases are independent unless explicitly noted. You can parallelize freely.

## The sentence to remember

We are not optimizing for Google. We are making FRQNCY so unmistakably the best public reference on its 146 subjects that Google, Perplexity, ChatGPT, Claude, and every reader who finds it agrees.

That's the playbook. Now go to PHASE-1-DISCOVERY.md.
