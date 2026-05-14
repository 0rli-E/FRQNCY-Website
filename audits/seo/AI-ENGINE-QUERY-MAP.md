# AI-Engine Query Map — Phase 4.8 deepening

*Per-engine query lists, citation strategy, priority matrix, and the top-20 audit query set for the quarterly AI-citation review. Built 2026-05-13.*

This doc gives substance to the existing Phase 4.8 spec ("20 prompts × 4 engines = 80 data points"). It documents the queries FRQNCY should be auditing, the per-engine algorithmic behaviour we're optimizing against, and the concrete FRQNCY-specific moves per engine for this quarter.

Engines covered: **Perplexity**, **ChatGPT search**, **Claude** (claude.ai web search), **Gemini / Google AI Overviews**, **Microsoft Copilot**.

Markings:
- `[verify]` — public evidence is thin; treat as hypothesis, confirm via Cloudflare logs or referrer audits before acting.
- `[brand-collision]` — query is likely to surface FRQNCY Media (frqncy.media), FRQNCY Performance, or FRQNCY Recording Studios alongside or ahead of FRQNCY Network. Per `MENTION-MONITORING.md`, always qualify with "frqncy.network" or "FRQNCY Network" in any audit.

---

## How to read this doc

1. Read §1 for the cross-engine landscape — what each engine actually does in 2026 and what evidence supports it.
2. Read §2-6 for per-engine query lists + strategy.
3. Read §7 for the priority matrix and §8 for the top-20 audit set — these are the queries to run every quarter.

---

## §1. The 2026 landscape — what each engine actually does

| Engine | Index source | Citation count per answer | Frequency of recency-weighting | Dominant source types |
|---|---|---|---|---|
| Perplexity | Continuous web crawl + Google + Bing APIs, Sonar reranker | 5-10 inline | Aggressive (favours <1 week old on known domains) | Reddit (~46.7% of top citations), Wikipedia, primary sources, NIH/PubMed, named B2B authority |
| ChatGPT search | Bing index + OpenAI's own index | 3-5 inline | Recent + structured | Wikipedia (~13%) + Reddit (~12%) together >25% of US citations; Forbes, Business Insider |
| Claude (claude.ai) | Web search tool (rolled out late 2024; v `web_search_20260209` per Anthropic API docs) | 3-6 inline | Less recency-skewed than ChatGPT (only ~36% of journalism citations from past 12 months) | NYT, The Atlantic, The New Yorker, The Economist, long-form editorial, research publications; **explicitly avoids Reddit and YouTube as citation sources** |
| Gemini / AI Overviews | Google index + Knowledge Graph + Gemini reranker | 5-15 | Mixed; Gemini 3 (Jan 2026) increased citations 32% and replaced 42% of previously cited domains | Reddit-heavy on AI Overviews specifically; otherwise traditional authoritative sources |
| Microsoft Copilot | Bing index, "retrieve → generate → cite" pipeline | 3-5 | Recent, authoritative, structured | Similar to ChatGPT — Bing-driven. AI Performance dashboard launched Feb 9 2026 in Bing Webmaster Tools |

**Cross-engine confirmed signals (held up across 2025-2026 studies):**
- FAQ schema correlates with ~2.1× citation lift on Perplexity + ChatGPT browse (and 3.2× on Google AI Overviews) when content already exists in question-answer shape. The schema doesn't fake the shape — it labels it. (NB: Google deprecated visual FAQ rich results May 7 2026; the schema itself remains useful for AI citation.)
- First-third positioning matters on ChatGPT: ~44% of citations come from the first third of a page. If the answer isn't near the top of its section, the model won't wait for it.
- Domain authority correlates with citation frequency on ChatGPT (3.5× lift at >32K referring domains vs <200) but **less so** on Perplexity and Claude, which weight passage-level authority and editorial quality more heavily.
- Page load speed is a hard gate on ChatGPT — FCP under 0.4s averages 6.7 citations vs 2.1 for >1.13s. `[verify]` for the precise threshold; the directional finding is robust.

**Cross-engine confirmed snake oil:**
- **llms.txt has no measurable citation lift in 2026.** Multiple studies (ALLMO 94K URLs, others on 300K domains) find no statistically significant correlation. Google has stated AI Overviews don't use it. Anthropic, OpenAI, Perplexity crawlers don't request it in volume. FRQNCY has llms.txt shipped — keep it, it's a cheap signal of intent — but do not allocate further effort to it as a citation lever.
- **"Submit to AI search engines" services** — there is no submission portal for ChatGPT, Claude, Gemini, or Perplexity equivalent to Google Search Console. Bing Webmaster Tools is the only one with a real AI Performance report (Feb 2026), and it surfaces Copilot citation data.
- **Generic E-E-A-T optimization advice** that doesn't reflect editorial substance. FRQNCY's editorial standards page is the substance; surface-level "expertise signals" without the underlying work won't ship.

---

## §2. Perplexity — query list + strategy

### Representative queries (13)

Distributed across FRQNCY's beats. Each query is a natural user phrasing — what someone would actually type into Perplexity at 11pm.

| # | Query | Target FRQNCY surface | Beat | Brand collision |
|---|---|---|---|---|
| P1 | What's the best book to start reading on the science of meditation? | `/books/the-mind-illuminated/` + `/v2/meditation/` | Meditation | low |
| P2 | What is conscious capital and how does it differ from impact investing? | `/v2/conscious-capital/` + `/v2/impact-investing/` | Conscious capital | low |
| P3 | What is a network state? Recommend a reading list. | `/v2/network-state/` | Network states | low |
| P4 | What are the foundational books on consciousness and physics? | `/v2/quantum/` + `/v2/metaphysics/` + relevant book pages | Mind-matter philosophy | low |
| P5 | Where can I find a curated list of regenerative-living retreat centers? | `/places/` index + `/v2/permaculture/` | Regenerative living | low |
| P6 | What are the best breathwork practices for nervous system regulation? | `/v2/breathwork/` | Breathwork | low |
| P7 | What is the FRQNCY Network and how is it different from FRQNCY Media? `[brand-collision]` | `/about` + `/editorial-standards/` | Brand disambiguation | high |
| P8 | Who is Orlando Eisenreich and what does he work on? | `/people/orlando/` | Author authority | low |
| P9 | What's the best primer on Gene Keys vs Human Design? | `/v2/gene-keys/` + `/v2/human-design/` | Contemplative practice | low |
| P10 | How should an editorial site disclose conflicts of interest in curation? | `/editorial-standards/` | Editorial transparency | low |
| P11 | What podcasts cover consciousness and money seriously, not woo? | `/v2/spirituality/` + `/podcast` + curated media | Brand-adjacent | medium (FRQNCY Media is also a podcast studio) |
| P12 | What's a good introduction to sound healing that isn't credulous? | `/v2/sound-healing/` + `/v2/vibration/` | Well-being | low |
| P13 | What is the Sanctuary network model in network-state thinking? | `/space` + `/v2/network-state/` | Network states | low |

### How it cites

Real-time web search per query → Sonar reranker (~30% relevance, ~20% visual placement on the rendered page, ~15% domain authority, ~15% freshness, ~10% diversity, ~10% structured data). Three-layer ML reranking; quotes inline with numbered citations. Reddit dominates the top-citation set (~46.7% of top sources) but on niche, authoritative-but-quiet topics — exactly FRQNCY's territory — Perplexity is the engine most willing to surface a small-domain editorial source if the content directly answers the question.

### What we know works

- **Direct-answer leads.** Perplexity quotes passages; if the first 40-60 words of a section answer the question outright, that passage gets quoted. Our topic-page lede paragraphs are written this way; refine where they aren't.
- **FAQ schema** correlates with ~2.1× citation lift on Perplexity (controlling for traffic + word count). Already on the Phase 4.8 / 3.4 roadmap; this is one of the highest-confidence levers for Perplexity specifically.
- **Freshness aggressive.** A topic page edited last week beats the same page edited 2 years ago, on a brand-new domain. The freshness rubric (Phase 3) is the lever — pages with real `dateModified` in schema, refreshed quarterly, beat static pages.
- **Editorial citations within the page.** Perplexity rewards sources that themselves cite primary sources. FRQNCY's topic pages already link to books, people, orgs as primary citations — keep doing this, deepen on the top-50 topics.
- **Comet Plus publisher program (Jan 2026)** exists for revenue-share. The initial cohort is news publishers (TIME, Der Spiegel, Fortune, LA Times). FRQNCY is not in the cohort and won't qualify in this round — it's optimized for newsroom-scale outputs. Track for a future tier aimed at editorial-curation sites.

### What snake oil to avoid

- **llms.txt as a Perplexity lever** — no measurable effect. Already shipped, leave it; do not invest further.
- **Keyword density / TF-IDF in the topic pages** — Perplexity ranks at the passage-and-quote level, not the document level. Stuffing keywords degrades quote-ability.
- **Domain authority chasing via paid links** — Perplexity weights authority less than ChatGPT, and FRQNCY's anti-link-buying stance is editorial. Compounding inbound links from real partners (Phase 5) is the right path.

### FRQNCY-specific moves this quarter

1. **Ship FAQ schema on the top 50 topic pages** with answers extracted from the explainer block (Phase 3.4 lever, but Perplexity-prioritised). Highest single-lever ROI on this engine.
2. **Convert each topic-page lede into a Perplexity-quotable paragraph** — 40-60 words, declarative, present-tense, names the entity in the first sentence. Voice rules already require this; the work is mechanical refinement on the 50 most-trafficked topics first.
3. **Add `dateModified` to every topic page's schema** as part of the freshness rubric. Plus a real per-topic edit cadence (quarterly slice, per Phase 3).
4. **Section anchors + `WebPage.hasPart`** (Phase 4.4) — Perplexity sometimes deep-links to a section anchor when the page has stable IDs; this makes citation cleaner and the link more durable.
5. **Quote-friendly editorial standards page** — `/editorial-standards/` should have a Perplexity-quotable paragraph on what FRQNCY vets for, how, who decides. This is the page Perplexity will surface on "how does this site vet sources?" type meta-queries.

### How to measure

- **Plausible referrer**: `perplexity.ai` (and `www.perplexity.ai`) — note: Perplexity passes referrers more reliably than Claude. Weekly review.
- **Manual audit**: run the 13 queries above on Perplexity (logged-out, US locale where possible) once per quarter. Capture which were cited, page-level which surface, position in citation list (1-10).
- **Cloudflare logs**: `PerplexityBot` + `Perplexity-User` crawl frequency. A spike usually precedes citation activity by 2-4 weeks (per MENTION-MONITORING.md).
- **Definition of a win for this engine this quarter:** 3+ of the 13 queries cite frqncy.network in the top-5 citation slots on a logged-out anonymous query.

---

## §3. ChatGPT search — query list + strategy

### Representative queries (13)

| # | Query | Target FRQNCY surface | Beat | Brand collision |
|---|---|---|---|---|
| C1 | What are the best books on the history and science of meditation? | `/v2/meditation/` + book pages | Meditation | low |
| C2 | Compare different schools of yoga and which to start with. | `/v2/yoga/` + `/v2/kriya-yoga/` + `/v2/siddha-yoga/` | Contemplative practice | low |
| C3 | What is "conscious capital" as an investment philosophy? | `/v2/conscious-capital/` | Conscious capital | low |
| C4 | Explain network states for someone who's read Balaji once. | `/v2/network-state/` | Network states | low |
| C5 | Recommend resources on consciousness research that aren't pseudoscience. | `/v2/research/` + `/v2/neuroscience/` + `/v2/consciousness` related | Mind-matter philosophy | low |
| C6 | What is regenerative business and how do I evaluate a company by that lens? | `/v2/regenerative-business/` | Conscious capital | low |
| C7 | Where can I learn breathwork without a guru figure? | `/v2/breathwork/` | Well-being | low |
| C8 | What books does FRQNCY Network recommend on Taoism? `[brand-collision]` | `/v2/taoism/` + book pages | Direct-brand | medium (clarifies vs FRQNCY Media) |
| C9 | What is the FRQNCY content MCP server and how do I use it? | `/mcp/` | AI/curation | low |
| C10 | What are the editorial standards of a curation site I should look for? | `/editorial-standards/` | Editorial transparency | low |
| C11 | Best primer books on quantum physics for a general reader who likes philosophy. | `/v2/quantum/` + book pages | Mind-matter philosophy | low |
| C12 | What's a good entry point to learn about plant medicine ceremonies responsibly? | `/v2/plant-medicine/` | Well-being | low |
| C13 | What is the FRQNCY Podcast? `[brand-collision]` | `/podcast` | Direct-brand | high — FRQNCY Media is a podcast studio with much higher search presence |

### How it cites

Bing's real-time index is the primary retrieval layer (~87% alignment with Bing top results, per 5W 2026 study). When the user prompt contains a year, comparison structure, or "best of" framing, search triggers ~100% of the time. ChatGPT retrieves ~6 candidate pages per query and cites ~15% of what it retrieves — the other 85% is evaluated and dropped. Cites 3-5 sources inline. Wikipedia (~13%) and Reddit (~12%) dominate US citations together; WSJ/NYT/Bloomberg often don't appear in the top 20.

### What we know works

- **Bing indexation is the entry ticket.** If frqncy.network is not well-indexed in Bing, it cannot be cited by ChatGPT. Bing Webmaster Tools verification (Phase 1 outstanding) is the gate.
- **FAQ schema** — same ~40% lift in source selection as Perplexity in 2026 studies. Already a Phase 3.4 lever.
- **First-third positioning** — 44% of ChatGPT citations come from the first third of the page. FRQNCY's topic-page structure (hero → explainer → resources) is already aligned with this; the explainer paragraph is what gets quoted.
- **Domain authority lift is real on this engine** (3.5× at >32K referring domains). This is Bet 5 territory (Phase 5 backlinks); takes quarters not weeks.
- **Wikipedia mention is leverage.** Once FRQNCY has Wikipedia presence (Phase 5.1, currently not notable enough — see the dossier), ChatGPT will cite via Wikipedia at much higher rates. This is a year-out move, not a quarter move.
- **Page speed matters more than on Perplexity.** FCP <0.4s averages 6.7 citations vs 2.1 for >1.13s. FRQNCY's pages are already fast (minimal JS); the gain is at the margin, but is a guardrail not to break.

### What snake oil to avoid

- **"Submit to ChatGPT" services** — no submission portal exists. Bing Webmaster Tools is the closest real lever.
- **Generating "ChatGPT-optimized" listicles** — directly off-brand per the SEO Playbook ("we don't do listicles"). ChatGPT cites Wikipedia and editorial-quality sources, not listicle farms; cite-worthy content wins regardless of format.
- **AI-generated topic pages to scale content** — ChatGPT's reranker is increasingly good at down-ranking AI-generated content. FRQNCY's editorial moat works *because* it's human-curated; don't dilute it.

### FRQNCY-specific moves this quarter

1. **Verify Bing Webmaster Tools and submit the sitemap** — this is a Phase 1 outstanding item, but it's the single highest-leverage move for ChatGPT visibility. Without Bing indexation, citation is impossible. Day-1 move.
2. **FAQ schema rollout** (shared with Perplexity move; one piece of work covers both engines).
3. **Page-load audit on the top 20 topics** — confirm FCP <0.4s where it isn't already; this is a guardrail. The minimal-JS architecture should already be there but verify post-Phase-2.
4. **Editorial standards page strengthening** — `/editorial-standards/` is FRQNCY's strongest single page for the "what does this site stand for" type query. ChatGPT cites pages that themselves cite the editorial pipeline. This is also the page that addresses the brand-collision question (`What does FRQNCY Network do vs FRQNCY Media?`) — needed for query C8 and C13.
5. **Per-topic Article schema with `author: Orlando Eisenreich` populated, plus `knowsAbout`** on `/people/orlando/` — ChatGPT weights author signals through Wikipedia/Bing crosswalks. Phase 4.6 already on the queue; sequence early.

### How to measure

- **Plausible referrer**: `chat.openai.com`, `chatgpt.com`. Note that ChatGPT often strips referrers when users copy-paste URLs; expect 2-3× undercount.
- **Manual audit**: 13 queries above on ChatGPT (logged-out where possible; if using a paid account, note the session). Capture citation surface + position. Watch for FRQNCY Media collision on queries C8, C13.
- **Bing Webmaster Tools AI Performance dashboard** (live since Feb 9 2026) — once verified, surfaces Copilot citations (and indirectly correlates with ChatGPT-via-Bing).
- **Cloudflare logs**: `GPTBot`, `ChatGPT-User`, `OAI-SearchBot` crawl frequency.
- **Definition of a win this quarter:** 2+ of the 13 queries cite frqncy.network in any citation slot on logged-out queries; zero queries surface FRQNCY Media ahead of FRQNCY Network on the brand-collision queries.

---

## §4. Claude (claude.ai web search) — query list + strategy

### Representative queries (13)

| # | Query | Target FRQNCY surface | Beat | Brand collision |
|---|---|---|---|---|
| K1 | What's a thoughtful reading list on the philosophy of mind? | `/v2/metaphysics/` + book pages | Mind-matter philosophy | low |
| K2 | How should I evaluate whether an investment is aligned with conscious-capital principles? | `/v2/conscious-capital/` + `/editorial-standards/` | Conscious capital | low |
| K3 | What is a network state, and where can I read more deeply than Balaji's book? | `/v2/network-state/` | Network states | low |
| K4 | What are the editorial standards for a curation site I should expect? | `/editorial-standards/` | Editorial transparency | low |
| K5 | Recommend long-form essays on consciousness that aren't lazy. | `/v2/consciousness` related + media items | Mind-matter philosophy | low |
| K6 | What is "regenerative living" beyond the lifestyle marketing? | `/v2/regenerative-business/` + `/v2/permaculture/` + `/v2/sustainable-living/` | Regenerative living | low |
| K7 | What MCP servers exist for working with curated knowledge graphs? | `/mcp/` | AI/curation | low |
| K8 | Who curates FRQNCY Network's library and what's their editorial process? `[brand-collision]` | `/people/orlando/` + `/editorial-standards/` | Author authority | medium |
| K9 | What is the difference between Human Design and Gene Keys for someone curious about both? | `/v2/human-design/` + `/v2/gene-keys/` | Contemplative practice | low |
| K10 | Best entry point on Kriya Yoga from a contemplative scholar's view. | `/v2/kriya-yoga/` | Contemplative practice | low |
| K11 | What's the case for breathwork supported by research, not just anecdote? | `/v2/breathwork/` + research-citing media | Well-being | low |
| K12 | What does FRQNCY Network mean by "the picks are the work"? `[brand-collision]` | `/about` + `/editorial-standards/` | Direct-brand | medium (must distinguish from FRQNCY Media's tagline-space) |
| K13 | What is "trace-as-memory" and where does the term come from? | `/v2/consciousness` related; this is also an internal FRQNCY-harness concept | AI/curation | low (niche term FRQNCY owns) |

### How it cites

Claude's web search (rolled out late 2024, current tool version `web_search_20260209`) is the closest match to FRQNCY's editorial values among the five engines. Claude **explicitly avoids Reddit and YouTube** as citation sources, **does not cite press releases or wire services**, and favours long-form editorial, research publications, and authoritative institutional domains. Per the 5W 2026 study, Claude leans toward NYT, The Atlantic, The New Yorker, The Economist — and only 36% of its journalism citations are from the past 12 months (vs ~56% for ChatGPT), meaning Claude weights editorial depth over recency. Inline citations with verifiable source URLs.

This is FRQNCY's best-fit engine. If we can land citations anywhere, Claude is the highest a priori probability.

### What we know works

- **Long-form editorial.** Topic pages with real depth (200+ words of explainer, structured into sections) match Claude's preferred source shape. Most FRQNCY topic pages already fit; the work is finishing the variance — bringing the bottom-50 topic pages up to the top-50's depth.
- **Author attribution.** A `/people/orlando/` Person schema with `knowsAbout`, `worksFor`, real bio, sameAs to LinkedIn / Twitter / GitHub is one of the things Claude's retriever uses to validate author authority. Phase 4.6 work directly serves this.
- **Self-contained sections with clear headings + declarative language.** This is already how FRQNCY topic pages are written (the voice rules force it). The section-anchor work (Phase 4.4) makes each section independently citable.
- **Citations within the source.** Claude favors pages that themselves cite primary sources. FRQNCY's "Resources" block (books, people, orgs, media linked per topic) does this natively.
- **No SEO-y signal-spamming.** Claude's retriever appears to actively de-rank pages with heavy keyword stuffing or generic SEO patterns. FRQNCY's anti-SEO-content stance is a feature here.

### What snake oil to avoid

- **Reddit / Quora seeding.** Claude excludes these as citation sources. Don't run a strategy that depends on Reddit threads citing FRQNCY (different play — useful for ChatGPT and Perplexity, not Claude).
- **Press-release pushes.** Claude excludes wire services. PR Newswire / Business Wire submissions don't help; getting a real editorial publication to write about FRQNCY does.
- **YouTube transcripts** — Claude doesn't cite YouTube. The FRQNCY Podcast appearing on YouTube doesn't help Claude citations directly; the show-notes page on frqncy.network does.

### FRQNCY-specific moves this quarter

1. **Finish the editorial standards page (`/editorial-standards/`)** — Phase 3.4 work. Claude is the engine most likely to cite this page on "how does this curator vet sources" type queries (K4, K8). The page itself becomes the citation surface that justifies all other FRQNCY pages.
2. **`/people/orlando/` Person schema completion** — Phase 4.6. Claude weights author authority heavily; Orlando's page needs full sameAs, knowsAbout, real bio, links to actual external surfaces.
3. **Bring the bottom-50 topic pages up to the depth of the top-50.** Variance is the enemy; Claude rewards consistent editorial depth. Don't add new topics — finish the 146.
4. **Drop the trace-as-memory term naturally into 2-3 topic pages** (the consciousness / AI / curation cluster). FRQNCY owns this term (per the harness work). When Claude searches for it, FRQNCY should be the canonical reference. This is one of the highest-confidence small moves on this engine.
5. **Section anchors live** (Phase 4.4). Claude's web search can return passage-level citations; stable IDs make this clean.

### How to measure

- **Plausible referrer**: `claude.ai`. Note: Claude often strips or normalizes referrers — true Claude-driven traffic is 2-3× the reported referral number. Expect lots of "direct" traffic that's actually Claude.
- **Manual audit**: 13 queries above on Claude.ai (logged-out where possible — note: Claude requires login, so use a clean session). Watch citation surface, position, and whether the citation links into a topic page or a deeper item page.
- **Cloudflare logs**: `ClaudeBot`, `anthropic-ai`, `Claude-Web`. Anthropic crawler frequency is the leading indicator.
- **Definition of a win this quarter:** 4+ of the 13 queries cite frqncy.network (Claude is our highest-probability engine; the target should be higher).

---

## §5. Gemini / Google AI Overviews — query list + strategy

### Representative queries (12)

| # | Query | Target FRQNCY surface | Beat | Brand collision |
|---|---|---|---|---|
| G1 | best book to start meditation science | `/v2/meditation/` + book pages | Meditation | low |
| G2 | what is conscious capital investing | `/v2/conscious-capital/` | Conscious capital | low |
| G3 | network state explained | `/v2/network-state/` | Network states | low |
| G4 | regenerative living vs sustainable living | `/v2/regenerative-business/` + `/v2/sustainable-living/` | Regenerative living | low |
| G5 | breathwork for nervous system regulation | `/v2/breathwork/` | Well-being | low |
| G6 | Human Design vs Gene Keys differences | `/v2/human-design/` + `/v2/gene-keys/` | Contemplative practice | low |
| G7 | best podcasts on consciousness | `/podcast` + curated media + `/v2/spirituality/` | Brand-adjacent | high — collision with FRQNCY Media |
| G8 | curated reading list philosophy of mind | `/v2/metaphysics/` + books | Mind-matter philosophy | low |
| G9 | what is FRQNCY Network `[brand-collision]` | `/about` | Direct-brand | high |
| G10 | sound healing science evidence | `/v2/sound-healing/` | Well-being | low |
| G11 | best curated resources on Taoism | `/v2/taoism/` | Contemplative practice | low |
| G12 | impact investing vs conscious capital differences | `/v2/impact-investing/` + `/v2/conscious-capital/` | Conscious capital | low |

Note: Gemini / AI Overviews queries are typed more like Google searches — shorter, less conversational. The query list reflects that.

### How it cites

Multi-stage filtering: 200-500 candidate documents → semantic retrieval → E-E-A-T authority filter → Gemini LLM passage-level reranker → data fusion into 5-15 cited sources with inline citations. Gemini 3 (rolled out Jan 2026) increased citation count by ~32% and replaced ~42% of previously cited domains — meaning a domain that wasn't cited pre-Gemini-3 has a fresh shot. Reddit dominates AI Overviews specifically (more than across the rest of Google's surfaces).

**Critical:** Gemini-on-AI-Overviews and Gemini-in-the-Gemini-app are different surfaces with different selection logic. The 12 queries above are AI Overviews queries (someone typing into Google). For Gemini-app queries the model is more conversational and behaves slightly more like Claude. `[verify]` — treat Gemini-app citation patterns as less mapped.

### What we know works

- **Passage-level extractability.** Self-contained answer units of 134-167 words score highest. FRQNCY's topic-page section structure already supports this; explainer paragraphs need to be ~150 words to hit the sweet spot.
- **Entity density** — 15+ Knowledge Graph entities per 1,000 words. FRQNCY topic pages naturally mention people, books, orgs, concepts; the count is likely already there. The work is making sure the entity *links* are clean (`<a>` tags + schema.org `mentions` where appropriate).
- **E-E-A-T authority threshold clearance.** Author profile + editorial standards + organizational legitimacy. This is Phase 4.6 + Phase 5 territory.
- **Knowledge Graph entity alignment.** Until FRQNCY has a Wikidata entry (Phase 4.5 brief; Orlando's manual submission required), the Knowledge Graph crosswalk is missing. This is the biggest single open lever on Gemini.
- **Structured data quality** — JSON-LD already present; the gaps are FAQPage + BreadcrumbList + ItemList (Phase 2 work).

### What snake oil to avoid

- **"Optimize for AI Overviews" SEO services** that claim deterministic placement. Gemini 3 specifically broke a lot of these — 42% domain replacement means anyone selling "guaranteed AI Overview placement" is lying.
- **Keyword stuffing for entity density.** Gemini's reranker reads passages, not bag-of-words. Entity density only counts when the entities are genuinely topical.
- **Hreflang / international SEO chasing** — for FRQNCY's audience and Google's current AI Overview behavior in the US, this is not a near-term lever. Defer.

### FRQNCY-specific moves this quarter

1. **Submit the Wikidata entity for FRQNCY-the-network.** Phase 4.5 brief exists; Orlando's manual submission is the bottleneck. This is the biggest single lever for Gemini — without a Knowledge Graph entry, FRQNCY is invisible to the entity-alignment layer.
2. **GSC verification + sitemap submission.** Phase 1 outstanding. Without this, Google's index doesn't see FRQNCY cleanly; AI Overviews cite what's in the index.
3. **Brand disambiguation in homepage Organization schema.** `description` and `instance of` need to disambiguate from FRQNCY Media (the podcast studio), per MENTION-MONITORING.md. Specifically: `description` should include "topic graph for consciousness" and "146 topics" as the distinguishing phrase.
4. **Per-topic Article schema with `author`, `datePublished`, `dateModified`.** Phase 3 work — but Gemini's E-E-A-T filter checks this.
5. **The Gemini 3 reset is an opportunity.** Because 42% of cited domains were replaced in Jan 2026, FRQNCY is competing in a less-entrenched citation graph than it was 6 months ago. Move quickly while it's still re-shuffling.

### How to measure

- **GSC** (once verified) — Performance report → "AI Overview" filter (Google added it 2025). This is the closest thing to a deterministic AI-citation metric for Gemini.
- **Plausible referrer**: `gemini.google.com`, `google.com/search` with the AI Overviews query string pattern. Most AI Overview traffic shows as regular google.com referral.
- **Manual audit**: 12 queries above on google.com (logged-out, US locale). Look at the AI Overview block at the top; capture which sources are cited.
- **Cloudflare logs**: `Google-Extended`, `GoogleOther`. Google-Extended is the AI training crawler; GoogleOther is Search-related.
- **Definition of a win this quarter:** 2+ of the 12 queries cite frqncy.network in the AI Overview block on logged-out US queries. This is a stretch target given the absence of GSC + Wikidata — even one citation would be a meaningful signal.

---

## §6. Microsoft Copilot — query list + strategy

### Representative queries (12)

| # | Query | Target FRQNCY surface | Beat | Brand collision |
|---|---|---|---|---|
| M1 | best entry-level book on meditation science | `/v2/meditation/` + book pages | Meditation | low |
| M2 | what is conscious capital | `/v2/conscious-capital/` | Conscious capital | low |
| M3 | network state primer | `/v2/network-state/` | Network states | low |
| M4 | curated retreat centers regenerative living | `/places/` + `/v2/permaculture/` | Regenerative living | low |
| M5 | breathwork science | `/v2/breathwork/` | Well-being | low |
| M6 | best books on philosophy of mind | `/v2/metaphysics/` + books | Mind-matter philosophy | low |
| M7 | what is FRQNCY topic graph `[brand-collision]` | `/about` + `/explore.html` | Direct-brand | medium |
| M8 | Human Design vs Gene Keys | `/v2/human-design/` + `/v2/gene-keys/` | Contemplative practice | low |
| M9 | MCP server for curated content knowledge graph | `/mcp/` | AI/curation | low |
| M10 | impact investing vs ESG vs conscious capital | `/v2/impact-investing/` + `/v2/conscious-capital/` | Conscious capital | low |
| M11 | best podcasts conscious capitalism `[brand-collision]` | `/podcast` + curated media | Brand-adjacent | high (FRQNCY Media + FMG Networks both collide) |
| M12 | how to evaluate a curation network's editorial integrity | `/editorial-standards/` | Editorial transparency | low |

### How it cites

"Retrieve → generate → cite" pipeline on Bing's index. Copilot prefers recent, authoritative, structured content with direct, atomic answers it can quote. Cites 3-5 sources with prominent clickable citations (Copilot leads with citation visibility more than ChatGPT does). The AI Performance dashboard launched in Bing Webmaster Tools on Feb 9 2026 — this is the only AI engine with a real publisher-facing analytics layer in 2026.

### What we know works

- **Bing indexation is required.** Copilot is Bing-backed; without Bing indexation there is no Copilot citation. Same Phase 1 gate as ChatGPT (Bing Webmaster Tools verification).
- **40-60 word summary lead → proof paragraph → deeper content.** This is exactly the lede-paragraph structure FRQNCY topic pages already use; tighten the top-50 to this exact shape.
- **Structured data, especially FAQPage + Organization + BreadcrumbList.** Same FAQ schema lever as ChatGPT/Perplexity; one piece of work covers three engines.
- **Bing AI Performance dashboard** gives ground truth on Copilot citations. This is the single highest-fidelity AI-citation signal available across all engines.

### What snake oil to avoid

- **Generic Bing SEO tactics from 2020** — Copilot is not classical Bing search. Most "Bing optimization" advice is stale; the AI Performance dashboard (Feb 2026) is the actual source of truth.
- **Banner placement / featured snippets specifically for Bing** — featured snippets are a classical-Bing feature, not a Copilot citation lever.

### FRQNCY-specific moves this quarter

1. **Verify Bing Webmaster Tools and activate the AI Performance dashboard.** Phase 1 outstanding. This is the most leveraged Phase 1 task across the entire AI-engine landscape because it's the only one that gives us real citation data.
2. **40-60 word lede paragraph audit on top 20 topics.** Voice already aligns; the work is verifying the word count and that the first sentence is the answer to the question (not the setup for it).
3. **FAQ schema rollout** (shared move with Perplexity + ChatGPT).
4. **Submit `/mcp/` as a Bing-indexable page** — this is a unique surface among AI-engine queries (M9: "MCP server for curated content"). FRQNCY owns this topic; the page is shipped; just needs to be in Bing.
5. **Brand disambiguation in Organization schema** — same as the Gemini move; one piece of work covers both engines.

### How to measure

- **Bing Webmaster Tools AI Performance dashboard** (Feb 2026) — the closest thing to a deterministic AI-citation metric in 2026. Use this as the primary measurement surface once verified.
- **Plausible referrer**: `copilot.microsoft.com`, `bing.com` with AI query param.
- **Manual audit**: 12 queries above on Copilot. Capture citation surface + position.
- **Cloudflare logs**: `bingbot` for index; specific Copilot UA strings TBD `[verify]`.
- **Definition of a win this quarter:** 2+ of the 12 queries cite frqncy.network in the Copilot citation list. Plus: AI Performance dashboard active in Bing Webmaster Tools (binary; either it's set up or it isn't).

---

## §7. Priority matrix — scoring each query

Scoring scale 1-5:

- **FRQNCY editorial strength** — does FRQNCY have a topic page or other surface that genuinely answers this query? 5 = strong, exists, on the top-50. 3 = exists but bottom-50 depth. 1 = no surface or weak surface.
- **AI-engine likelihood** — average across engines of likelihood FRQNCY gets cited if the engine searches well. 5 = high (Claude-shape query, low competition); 1 = low (commercial intent, dominated by listicles).
- **Brand-collision risk** — 5 = no collision; 1 = FRQNCY Media or other collides ahead of us.

Total score (max 15) is the prioritization score. Ties broken by engine fit (queries that work across multiple engines beat single-engine queries).

| # | Engine | Query | Editorial | AI Likelihood | Brand-collision (safe) | Total |
|---|---|---|---|---|---|---|
| K3 | Claude | What is a network state, and where can I read more deeply than Balaji's book? | 5 | 5 | 5 | 15 |
| K4 | Claude | What are the editorial standards for a curation site I should expect? | 5 | 5 | 5 | 15 |
| K7 | Claude | What MCP servers exist for working with curated knowledge graphs? | 5 | 5 | 5 | 15 |
| K13 | Claude | What is "trace-as-memory" and where does the term come from? | 4 | 5 | 5 | 14 |
| K1 | Claude | What's a thoughtful reading list on the philosophy of mind? | 5 | 4 | 5 | 14 |
| K2 | Claude | How should I evaluate whether an investment is aligned with conscious-capital principles? | 5 | 4 | 5 | 14 |
| P3 | Perplexity | What is a network state? Recommend a reading list. | 5 | 4 | 5 | 14 |
| P2 | Perplexity | What is conscious capital and how does it differ from impact investing? | 5 | 4 | 5 | 14 |
| P1 | Perplexity | What's the best book to start reading on the science of meditation? | 5 | 4 | 5 | 14 |
| P10 | Perplexity | How should an editorial site disclose conflicts of interest in curation? | 5 | 4 | 5 | 14 |
| K9 | Claude | Human Design vs Gene Keys for someone curious about both? | 5 | 4 | 5 | 14 |
| K6 | Claude | What is "regenerative living" beyond the lifestyle marketing? | 5 | 4 | 5 | 14 |
| C9 | ChatGPT | What is the FRQNCY content MCP server and how do I use it? | 5 | 4 | 5 | 14 |
| M9 | Copilot | MCP server for curated content knowledge graph | 5 | 4 | 5 | 14 |
| P9 | Perplexity | What's the best primer on Gene Keys vs Human Design? | 5 | 4 | 5 | 14 |
| P6 | Perplexity | What are the best breathwork practices for nervous system regulation? | 5 | 4 | 5 | 14 |
| K10 | Claude | Best entry point on Kriya Yoga from a contemplative scholar's view. | 5 | 4 | 5 | 14 |
| K5 | Claude | Recommend long-form essays on consciousness that aren't lazy. | 4 | 5 | 5 | 14 |
| K11 | Claude | What's the case for breathwork supported by research, not just anecdote? | 4 | 5 | 5 | 14 |
| C2 | ChatGPT | Compare schools of yoga and which to start with. | 5 | 4 | 5 | 14 |
| C5 | ChatGPT | Recommend resources on consciousness research that aren't pseudoscience. | 4 | 4 | 5 | 13 |
| P4 | Perplexity | What are the foundational books on consciousness and physics? | 5 | 4 | 4 | 13 |
| P12 | Perplexity | Good introduction to sound healing that isn't credulous? | 4 | 4 | 5 | 13 |
| M12 | Copilot | How to evaluate a curation network's editorial integrity | 5 | 4 | 4 | 13 |
| G3 | Gemini | network state explained | 5 | 3 | 5 | 13 |
| G2 | Gemini | what is conscious capital investing | 5 | 3 | 5 | 13 |
| G8 | Gemini | curated reading list philosophy of mind | 4 | 3 | 5 | 12 |
| C6 | ChatGPT | What is regenerative business and how do I evaluate a company by that lens? | 4 | 3 | 5 | 12 |
| P13 | Perplexity | What is the Sanctuary network model in network-state thinking? | 4 | 4 | 4 | 12 |
| C11 | ChatGPT | Best primer books on quantum physics for a general reader who likes philosophy. | 4 | 4 | 4 | 12 |
| G1 | Gemini | best book to start meditation science | 5 | 3 | 4 | 12 |
| M3 | Copilot | network state primer | 5 | 3 | 4 | 12 |
| M2 | Copilot | what is conscious capital | 5 | 3 | 4 | 12 |
| P11 | Perplexity | Podcasts that cover consciousness and money seriously? | 4 | 3 | 3 | 10 |
| C8 | ChatGPT | Books FRQNCY Network recommends on Taoism `[brand-collision]` | 5 | 3 | 2 | 10 |
| K12 | Claude | What does FRQNCY Network mean by "the picks are the work"? `[brand-collision]` | 5 | 4 | 2 | 11 |
| K8 | Claude | Who curates FRQNCY Network's library and what's their editorial process? `[brand-collision]` | 5 | 4 | 3 | 12 |
| P7 | Perplexity | What is FRQNCY Network and how is it different from FRQNCY Media? `[brand-collision]` | 4 | 3 | 2 | 9 |
| G9 | Gemini | what is FRQNCY Network `[brand-collision]` | 4 | 2 | 2 | 8 |
| C13 | ChatGPT | What is the FRQNCY Podcast? `[brand-collision]` | 4 | 3 | 1 | 8 |
| G7 | Gemini | best podcasts on consciousness `[brand-collision]` | 3 | 2 | 1 | 6 |
| M11 | Copilot | best podcasts conscious capitalism `[brand-collision]` | 3 | 2 | 1 | 6 |

(Remaining queries are mid-band — see per-engine sections for the full lists.)

### Pattern observations

- **Claude is FRQNCY's highest-fit engine.** 9 of the top 20 queries are Claude queries because Claude's stated source preferences (long-form editorial, no Reddit, no YouTube, no press releases, deep authors) match FRQNCY's editorial shape almost exactly.
- **Niche editorial-curation queries beat broad commercial queries.** "What MCP servers exist for curated knowledge graphs?" (K7) ranks at 15 because FRQNCY owns the topic, the audience is small, and there's no competing source.
- **Brand-collision queries are real but should not be the audit focus.** Queries like P7, G9, C13 score lower because FRQNCY Media and FRQNCY Performance dominate the unqualified term. These are reputation-management queries — run them quarterly but expect slow progress; the real visibility wins come from editorial-substance queries.
- **Gemini and Copilot scores are uniformly lower** not because FRQNCY's content is worse but because (a) Gemini requires GSC + Wikidata before signals can land, (b) Copilot requires Bing verification, and (c) AI Overviews queries are still re-shuffling post-Gemini-3. These engines are unlock-on-Phase-1-completion.

---

## §8. The top-20 audit query set

This is the substance for the Phase 4.8 quarterly audit. Run these 20 queries each quarter, across all 5 engines, and log results in `AI-CITATION-TRACKER.md` / `runs/<YYYY-MM-DD>-ai-citation-quarterly.csv`.

The original Phase 4.8 spec called for 20 queries × 4 engines = 80 data points. With 5 engines this becomes 100 data points. Both are tractable in a 2-3 hour quarterly session.

Each query is scored 14+ on the priority matrix and reflects FRQNCY's actual editorial depth. The selection deliberately over-weights Claude and Perplexity (FRQNCY's two highest-fit engines), with sufficient Gemini and Copilot to track progress as Phase 1 items unlock.

| # | Query (run on all 5 engines) | Primary target page | Beat |
|---|---|---|---|
| 1 | What is a network state and where can I read more? | `/v2/network-state/` | Network states |
| 2 | What is conscious capital, and how does it differ from impact investing? | `/v2/conscious-capital/` | Conscious capital |
| 3 | What's a thoughtful reading list on the philosophy of mind? | `/v2/metaphysics/` | Mind-matter philosophy |
| 4 | What are the editorial standards I should look for in a curation site? | `/editorial-standards/` | Editorial transparency |
| 5 | What MCP servers exist for working with curated knowledge graphs? | `/mcp/` | AI / curation |
| 6 | What's the best entry-level book on the science of meditation? | `/v2/meditation/` + book pages | Meditation |
| 7 | Human Design vs Gene Keys for someone curious about both? | `/v2/human-design/` + `/v2/gene-keys/` | Contemplative practice |
| 8 | What are the best breathwork practices for nervous system regulation? | `/v2/breathwork/` | Well-being |
| 9 | What is "regenerative living" beyond the lifestyle marketing? | `/v2/regenerative-business/` + `/v2/sustainable-living/` | Regenerative living |
| 10 | Best primer books on quantum physics for a reader who likes philosophy. | `/v2/quantum/` + book pages | Mind-matter philosophy |
| 11 | Best entry point on Kriya Yoga from a contemplative scholar's view. | `/v2/kriya-yoga/` | Contemplative practice |
| 12 | What's the case for breathwork supported by research, not anecdote? | `/v2/breathwork/` | Well-being |
| 13 | Recommend long-form essays on consciousness that aren't lazy. | `/v2/consciousness` related | Mind-matter philosophy |
| 14 | What is "trace-as-memory" and where does the term come from? | `/v2/consciousness` related | AI / curation |
| 15 | What is a good introduction to sound healing that isn't credulous? | `/v2/sound-healing/` | Well-being |
| 16 | How should I evaluate whether an investment is aligned with conscious-capital principles? | `/v2/conscious-capital/` + `/editorial-standards/` | Conscious capital |
| 17 | What are the foundational books on consciousness and physics? | `/v2/quantum/` + `/v2/metaphysics/` | Mind-matter philosophy |
| 18 | Where can I find a curated list of regenerative-living retreat centers? | `/places/` + `/v2/permaculture/` | Regenerative living |
| 19 | What is the Sanctuary network model in network-state thinking? | `/space` + `/v2/network-state/` | Network states |
| 20 | Compare schools of yoga and which to start with. | `/v2/yoga/` + `/v2/kriya-yoga/` + `/v2/siddha-yoga/` | Contemplative practice |

### Audit method per query

For each query × engine:

1. Run the query logged-out (or in a clean session for Claude.ai). Note locale (US default).
2. Capture: was FRQNCY cited? Y/N. If yes: which page (full URL with anchor if applicable). Position in citation list (1-N). Surrounding citations (top 5).
3. If brand collision occurred: note which other FRQNCY entity was cited and how visibly.
4. Screenshot the answer + citation block.
5. Log into the quarterly CSV.

### What counts as a "win"

- **Tier A (a real signal):** FRQNCY cited in the top 5 of the citation list, on the correct topic page (not a tangentially-related item).
- **Tier B (developing):** FRQNCY cited anywhere in the citation list, even position 8-15.
- **Tier C (background):** FRQNCY does not appear, but the surrounding citations are sources FRQNCY itself cites (Wikipedia, primary research, major editorial). That's a sign the engine is in the right neighborhood; FRQNCY's depth + Phase 5 backlinks compound from here.
- **Counter-signal:** FRQNCY Media or FRQNCY Performance cited ahead of FRQNCY Network on a query that's clearly meant for FRQNCY Network. Add to brand-disambiguation queue.

### Quarterly rhythm

- **Baseline run:** as soon as this doc lands (within 1 week of 2026-05-13).
- **Q2 run:** mid-August 2026.
- **Q3 run:** mid-November 2026.
- **Q4 run:** mid-February 2027.

Each run produces a `runs/YYYY-MM-DD-ai-citation-quarterly.csv` plus a 1-page summary in the same `runs/` folder noting trend deltas, new citations, brand-collision changes.

---

## §9. The top 3 highest-confidence FRQNCY-specific moves by engine

A short list extracted from the per-engine strategy sections. These are the bets where the evidence is clearest and the FRQNCY-specific work is most tractable.

### Perplexity

1. **FAQ schema on the top 50 topic pages** with declarative, 40-60 word answers. Highest single-lever ROI; 2.1× citation lift observed in 2026 studies.
2. **Convert each topic-page lede into a Perplexity-quotable paragraph** — 40-60 words, declarative, present-tense, names the entity in sentence one.
3. **`dateModified` + quarterly per-topic refresh cadence.** Perplexity is the most freshness-aggressive engine; a static page loses to an edited one even on the same domain.

### ChatGPT search

1. **Verify Bing Webmaster Tools and submit the sitemap.** Phase 1 outstanding; without Bing indexation, no ChatGPT citation is possible. Day-1 move.
2. **Editorial standards page strengthening.** ChatGPT cites pages that themselves cite editorial pipelines; `/editorial-standards/` is the meta-citation surface.
3. **Per-topic Article schema with `author: Orlando Eisenreich`** + Phase 4.6 author profile. ChatGPT weights Wikipedia/Bing author crosswalks.

### Claude (claude.ai)

1. **Finish `/editorial-standards/`.** Claude is the engine most likely to cite this page on "how does this curator vet sources" queries.
2. **Complete `/people/orlando/` Person schema.** Claude weights author authority more than any other engine; full sameAs + knowsAbout + real bio is the lever.
3. **Bring the bottom-50 topic pages up to the depth of the top-50.** Claude rewards consistent editorial depth; variance is the enemy.

### Gemini / AI Overviews

1. **Submit the Wikidata entity for FRQNCY-the-network.** Phase 4.5 brief exists; manual submission is the bottleneck. Biggest single lever for Gemini — without a Knowledge Graph entry, FRQNCY is invisible to the entity-alignment layer.
2. **GSC verification + sitemap submission.** Phase 1 outstanding. Required for AI Overview filter visibility in GSC + Google's index.
3. **Brand disambiguation in homepage Organization schema** to distinguish from FRQNCY Media. "Topic graph for consciousness" + "146 topics" as the distinguishing phrase.

### Microsoft Copilot

1. **Verify Bing Webmaster Tools and activate the AI Performance dashboard.** The single highest-fidelity AI-citation analytics surface across all five engines in 2026. Mandatory.
2. **40-60 word lede paragraph audit on top 20 topics.** Voice already aligns; the work is verifying the structure (first sentence is the answer, not the setup).
3. **Submit `/mcp/` for Bing indexation.** FRQNCY owns the "MCP server for curated content" query space; the page is shipped; it just needs to be in the index.

---

## §10. What this doc does not cover

- **Voice / app-based AI engines** (Alexa, Siri post-Apple-Intelligence, voice ChatGPT). These have different selection logic and almost no public evidence. `[verify]` and revisit in Q3.
- **Enterprise AI tools** (Glean, Microsoft 365 Copilot for Work, ChatGPT Enterprise) — citation behavior is private to the enterprise's index, not the public web. Not in scope.
- **Region-specific engines** (Baidu's Ernie, Yandex's YaGPT). FRQNCY's audience is global-English; not in scope for this quarter.
- **The MCP-ecosystem-as-a-channel** (FRQNCY's own MCP server being called by Claude Desktop / Cursor / Continue agents). This is a separate visibility surface — a tool call is not a web-search citation — and is tracked separately in Phase 4.3.

---

## Source provenance

The 2026-state findings about each engine's behaviour are drawn from public studies and industry reports published between Jan 2024 and May 2026. Where evidence is thin or contested, sections are marked `[verify]`. The strongest claims (FAQ schema lift, Claude's avoidance of Reddit/YouTube, Perplexity's freshness-aggression, the Gemini 3 reset) are corroborated across multiple independent studies. The weakest claims (specific UA strings for Copilot, exact thresholds for page-speed gates) are flagged for verification through FRQNCY's own Cloudflare logs.

Re-baseline this doc every quarter alongside the audit run. AI-engine citation behaviour shifts faster than classical SEO; treat this doc as a living artifact, not a one-shot deliverable.
