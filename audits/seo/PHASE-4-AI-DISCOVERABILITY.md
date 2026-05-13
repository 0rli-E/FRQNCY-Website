# PHASE 4 — AI Discoverability (the second SERP)

**Goal:** make FRQNCY one of the easiest sites for ChatGPT, Claude, Gemini, Perplexity, and Copilot to cite when a user asks them about consciousness, well-being, conscious capital, regenerative living, or any of FRQNCY's 146 subjects. The AI answer engines are becoming a search surface in their own right; this is the bet that the next year's biggest SEO unlock is *not* on Google.

**Prerequisites:** Phase 2 schema rollout (esp. FAQ, Article, Organization, BreadcrumbList) is the substrate; AI engines parse the same schema as Google but value it differently.

**Done when:** llms.txt is live, ai.txt is live, the public MCP server is documented and discoverable, every topic page has machine-readable Q&A and citation-friendly section markers, the site is registered in the major AI-engine indexes (where registration exists), and the first AI-citation-tracking dashboard is in place.

---

## Run convention

```
frqncy-harness agent "<PROMPT>" --model claude-sdk/claude-sonnet-4-6 --yolo --cwd ~/Documents/Claude/Projects/FRQNCY\ WEBSITE/
```

This phase is dense in design decisions; flash will gloss the strategy. Use Sonnet for everything.

---

## Background — why this phase exists

Until 2024 the answer-engine market was nascent; in 2026 it's measurable: Perplexity has tens of millions of MAU, ChatGPT search ships as a default in ChatGPT, Claude has search, Gemini is integrated into Google's main SERP. They share architecture: retrieve a small set of authoritative sources, synthesize an answer, cite them. The retrieval layer is *not* identical to Google's index — it's typically a smaller, more curated subset, weighted toward sources with:

- Clean, structured content (schema-rich)
- Clear authorship and dating
- Explicit Q&A markup
- Robust cross-references and citations
- A sitemap and llms.txt that says "crawl these, here's what they're about"
- Domain authority (yes) but also *editorial signals* — does this site have an editorial process worth trusting?

FRQNCY is shaped *exactly* for this. The 146 topic pages with curated picks, the Editorial Standards doc, the public MCP server — these are the assets answer engines were built to surface. Phase 4 is making sure they can find them.

---

## Task 4.1 — Publish llms.txt

**Why:** [llms.txt](https://llmstxt.org/) is an emerging standard (proposed by Jeremy Howard / Answer.AI) that gives LLM-driven crawlers a curated index of a site's most useful content, in markdown form. It's the AI-native sitemap. Adoption is growing fast in 2026; getting one in early signals to AI crawlers that the site is paying attention.

```
Build /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/llms.txt following the spec at https://llmstxt.org/. Top section: H1 with "FRQNCY", then a > blockquote summarizing the site (one paragraph from /audits/seo/CONTEXT.md §1). Then sections grouped by content type:

## Topics
- [<topic-title>](https://frqncy.network/<slug>/): <one-line summary from the page's meta description>
... (all 146 topic pages)

## Books
- [<book-title>](https://frqncy.network/books/<slug>/): <one-line summary>
... (all 284 book pages)

(repeat for People, Orgs, Media, Places, Courses)

## Pages
- [Vision](https://frqncy.network/about): The mission and structure of FRQNCY
- [Podcast](https://frqncy.network/podcast): The FRQNCY Podcast
- [Editorial Standards](https://frqncy.network/editorial-standards/): How resources are vetted (only if Phase 3.4 has shipped)
... (top-level pages)

Also build /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/llms-full.txt — the same structure but each entry includes the page's full main-content text rather than a summary. This is the variant AI crawlers can actually consume directly without re-crawling.

Validate that llms.txt is < 100KB (target spec); llms-full.txt can be larger (1-5 MB is fine — it's the deep-content variant). Reference llms.txt from robots.txt with a "Sitemap" line: "# AI: https://frqncy.network/llms.txt".

Run-log to ~/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/runs/2026-MM-DD-llms-txt.md with file sizes and entry counts per section.
```

**Verification:** `curl -s https://frqncy.network/llms.txt | head -30` returns a clean markdown index; `curl -sI https://frqncy.network/llms.txt` returns `Content-Type: text/plain` or `text/markdown`. Validate with a llms.txt linter once one exists; until then, manual review.

---

## Task 4.2 — Publish ai.txt with AI crawler policy

**Why:** ai.txt is the proposed companion to llms.txt — it states the site's policy for AI training and crawling. Useful for: (a) explicitly opting in to good-actor crawlers like Anthropic's `ClaudeBot`, OpenAI's `GPTBot`, Common Crawl, (b) opting out of specific abusive crawlers if needed, (c) signaling that the site is AI-friendly.

```
Build /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/ai.txt with a clear opt-in/opt-out matrix for AI crawlers. Default policy: allow all major AI crawlers because FRQNCY's strategy is AI-citation as the second SERP.

Format (per https://site.spawning.ai/ai.txt and similar emerging conventions):

User-Agent: ClaudeBot
Allow: /

User-Agent: GPTBot
Allow: /

User-Agent: PerplexityBot
Allow: /

User-Agent: GoogleOther
Allow: /

User-Agent: ChatGPT-User
Allow: /

User-Agent: anthropic-ai
Allow: /

User-Agent: Applebot-Extended
Allow: /

User-Agent: Bytespider
Disallow: /

User-Agent: cohere-ai
Allow: /

# Disallow paths
Disallow: /my-frqncy/dashboard/
Disallow: /social/
Disallow: /proposals/
Disallow: /docs/
Disallow: /CLAUDE.md

# Reference llms.txt
Sitemap: https://frqncy.network/sitemap.xml
Llms: https://frqncy.network/llms.txt

Update robots.txt to mirror the same User-Agent rules so well-behaved crawlers respect them via either file.

Run-log to ~/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/runs/2026-MM-DD-ai-txt.md.
```

**Verification:** `curl -s https://frqncy.network/ai.txt` returns the policy file; robots.txt mirrors the same UA-specific rules; a follow-up monitoring task watches for any AI crawler in nginx/CF logs that's not in the allow list.

---

## Task 4.3 — Publish the public MCP server documentation page

**Why:** the FRQNCY content MCP server already exists at `mcp-servers/frqncy-content/` in this repo. It's a structured, queryable interface to the 146 topics + 766 resources. ANY AI agent (Claude Desktop, ChatGPT with the new MCP client, Continue, Cursor, Cody, the FRQNCY harness) can connect to it and call it as a tool.

The problem: nobody knows it exists. Publishing a public docs page (with install instructions, the tool surface, sample queries) makes it a node in the AI ecosystem — agents can discover it, integrators can wire it, and FRQNCY shows up in the "tools available to me" list of every AI client that pulls from a public registry.

```
Build /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/mcp/index.html as a standalone page documenting the frqncy-content MCP server. Sections:

1. What it is — one paragraph
2. Why use it — for AI agents to query FRQNCY's curated topics + resources without web-scraping
3. Quick start — three code blocks: (a) Claude Desktop configuration JSON, (b) ChatGPT MCP integration, (c) the FRQNCY harness already-wired example
4. Tool surface — list of MCP tools the server exposes (read mcp-servers/frqncy-content/src/index.ts to enumerate them: get_topic, list_topics, search_resources, get_resource, etc.)
5. Sample queries — 5 worked examples like "list all books on consciousness", "show resources for the meditation topic", "find topics in the Network State pillar"
6. License + rate limits + attribution — public for non-commercial use, attribution requested ("Powered by FRQNCY"), reasonable rate limit
7. How to host your own — point at the GitHub repo

Add proper meta + canonical + JSON-LD WebPage + SoftwareApplication schema. Also register the page in sitemap.xml and reference it from llms.txt as a primary discovery surface.

Then ALSO write a separate brief at ~/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/runs/2026-MM-DD-mcp-registry.md listing the public MCP registries that exist (e.g., https://github.com/modelcontextprotocol/servers, https://www.mcp-marketplace.com/, https://glama.ai/mcp/servers if active) and the steps to submit FRQNCY's MCP server to each.
```

**Verification:** /mcp/ is live; the page passes Rich Results test; the registry brief is on disk; Orlando submits to at least 2 MCP registries.

---

## Task 4.4 — Citation-friendly section markers

**Why:** AI engines like Perplexity and ChatGPT cite by quoting passages. The cleaner the section structure, the cleaner the citation. Adding `id` attributes to every meaningful section (so URLs like `/v2/meditation/#why-meditate` are deep-linkable) plus a small "Cite this section" affordance makes the page citation-grade.

```
For every topic page under /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/v2/<slug>/index.html: walk the <main> section. For every <h2> or <section class="..."> without an id, generate a slug-id from the heading text (kebab-case, lowercase, ASCII-only). Inject id="<slug>". Also add a small CSS-styled "Cite" link next to each h2 that copies the deep-link URL to clipboard on click. Put the cite styling in /v2/_chrome/topic-base.css (don't inline).

Also inject a hidden machine-readable section-map at the top of <main>:

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": "<canonical-url>",
  "hasPart": [
    {"@type": "WebPageElement", "name": "<section title>", "url": "<canonical-url>#<id>"},
    ...
  ]
}
</script>

This gives AI crawlers a structured list of citable sections per page. Run-log to ~/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/runs/2026-MM-DD-section-anchors.md with: pages-modified, anchors-added (count), CSS additions.
```

**Verification:** any topic page's main sections have stable id attributes; deep links work (curl + grep); the WebPage hasPart schema parses.

---

## Task 4.5 — Knowledge graph entries for FRQNCY entities

**Why:** Google Knowledge Graph is the spine of "people also ask," knowledge panels, and AI engine grounding. To get into KG, an entity needs (a) a Wikipedia article (Phase 5), (b) a Wikidata entity ID, (c) consistent `sameAs` cross-references across schema.org entries.

```
Read /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/CONTEXT.md and identify the entities FRQNCY should claim in the knowledge graph: (1) FRQNCY (the network/organization), (2) The FRQNCY Podcast, (3) FRQNCY Network State (the org's network-state thesis as a concept), (4) Orlando Eisenreich (founder; Person entity), (5) any Place entities like Intaaya that FRQNCY is associated with.

For each entity, write a Wikidata-ready brief at /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/runs/2026-MM-DD-knowledge-graph-entities.md with: (a) entity name, (b) one-paragraph description (Wikidata-style: third person, present tense, factual), (c) statements (instance-of, founded-by, founding-year, official-website, located-in, etc.), (d) sameAs URLs (Twitter, LinkedIn, Crunchbase, Spotify if podcast, etc.), (e) sources (URLs that can serve as references when creating the Wikidata entity).

Then update the Organization schema on the homepage (Phase 2.5) to include the sameAs array fully populated. Update each Person/Place page's schema to include sameAs.

Note: actually creating the Wikidata entity is a manual step that Orlando does (Wikidata blocks logged-out edits). The brief is what the Wikidata create-form needs.
```

**Verification:** brief exists; sameAs arrays populated across schema; Orlando creates Wikidata entries (manual); 1-3 weeks later, knowledge graph signals start appearing in GSC.

---

## Task 4.6 — Author and Editor profile pages

**Why:** AI engines weight author profiles heavily. Orlando's profile page (currently `/people/orlando/` if it exists, else create) needs to be a real person page with credentials, bio, sameAs to LinkedIn/Twitter/Substack, and Article schema. Same for any other people who edit topic pages.

```
Verify /people/orlando/index.html exists. If yes, audit its schema, sameAs, and bio. If no, create it following the people sector template. Content: (a) one-line role: "Founder of FRQNCY", (b) bio paragraph (3-5 sentences, third-person, factual, present-tense), (c) what Orlando works on, (d) links to Orlando's external surfaces — Twitter @0rli_e or current handle, LinkedIn, GitHub @0rli-E, Substack if any, podcast appearances list.

Add Person JSON-LD with: name, jobTitle, url, image (favicon for now or a real headshot if available), sameAs (Twitter, LinkedIn, GitHub, etc.), worksFor (FRQNCY Organization), knowsAbout (the topics Orlando edits — pull from the topic-edit history in git log: every topic page Orlando has authored or majorly edited).

Do the same for any other editor/author who has commit history on topic pages (likely just Orlando for now). Run-log to ~/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/runs/2026-MM-DD-author-profiles.md.
```

**Verification:** /people/orlando/ is rich (description, sameAs, knowsAbout); links from every topic page byline (Phase 3.4) resolve correctly.

---

## Task 4.7 — Public Q&A surface (an actual `/ask` page)

**Why:** an explicit "Ask FRQNCY anything" surface — backed by the existing chat-widget Word Illuminator + the MCP content server — is a prime target for AI engine citation. When ChatGPT crawls a site that has a clean Q&A endpoint with structured content, it can present FRQNCY as a *tool* in its own answers ("I asked FRQNCY's Word Illuminator and got: ...").

```
Build /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/ask/index.html as a public Q&A landing surface. Sections:

1. Hero: "Ask FRQNCY anything about consciousness, money, well-being, regenerative living, or any of the 146 topics we cover." A simple search box that POSTs to the existing chat-widget backend.
2. Recent questions — populate with 10-20 actual reader questions from chat-widget logs (manually selected; high-quality), each with a 2-3 sentence FRQNCY-voice answer and links to the source topic pages. Mark up as FAQPage schema.
3. About this surface — one paragraph explaining that answers are grounded in the curated FRQNCY library (146 topics × 766 resources) and link to source.

Add Article + FAQPage schema. Reference from llms.txt as the primary AI-engine entry point. Add to sitemap.xml.

Run-log to ~/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/runs/2026-MM-DD-ask-page.md.
```

**Verification:** /ask/ is live; the FAQPage schema validates; the page is in llms.txt and sitemap.xml; Plausible tracks the chat-widget submissions from this page distinctly.

---

## Task 4.8 — AI-citation tracking dashboard

**Why:** if we don't measure AI citations, we can't know if Phase 4 is working. There's no "GSC for AI" yet, but there are workable proxies.

```
Set up an AI-citation tracking workflow. Methods:

1. Manual quarterly audit: query Perplexity / ChatGPT / Claude / Gemini with 20 representative FRQNCY-relevant prompts ("best book on the science of meditation", "what is conscious capital", "what are network states", etc.) and record whether FRQNCY is cited, what page, what context. Track in a spreadsheet.

2. Referral logs from Plausible: Perplexity, ChatGPT, Claude clients can sometimes leave Referer headers ("perplexity.ai", "chat.openai.com", "claude.ai"). Watch for these in Plausible's referrers report.

3. Brand mention alerts: set up Google Alerts + a free Mention.com / Talkwalker account for "FRQNCY" + "FRQNCY Network" + variations. Watch for AI-engine outputs that surface to text-indexed pages.

4. Direct user-agent logs from Cloudflare: identify ClaudeBot, GPTBot, PerplexityBot, ChatGPT-User in CF logs to see crawl frequency over time.

Build a tracker template at /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/AI-CITATION-TRACKER.md with sections for each of the 4 methods, a quarterly review template, and a baseline-now row to fill in immediately.

Run the first manual audit (method 1) — 20 queries × 4 engines = 80 data points. Capture in a CSV at audits/seo/runs/2026-MM-DD-ai-citation-baseline.csv.

Repeat the audit every quarter aligned with the freshness rubric.
```

**Verification:** tracker template + first baseline audit on disk; Plausible referrer report has filters for AI engines; Cloudflare log queries are documented.

---

## Task 4.9 — Submit to the AI directories that exist

**Why:** there are emerging directories AI engines and integrators check. Free, low-effort, real signal.

```
Identify and submit to:
1. https://www.alltrue.ai/ (or current AI-tool directories)
2. https://www.futuretools.io/
3. https://theresanaiforthat.com/
4. The Anthropic / OpenAI partner programs if applicable
5. Public MCP server registries (per task 4.3)
6. https://chatgpt.com/gpts (if creating a GPT) — a FRQNCY GPT that wraps the MCP server is a natural extension
7. Perplexity Spaces — a public Space curated around FRQNCY topics

For each, list submission requirements + a recommended description (FRQNCY voice). Write the submission tracker to ~/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/runs/2026-MM-DD-ai-directory-submissions.md.

Orlando submits each one. The tracker logs submission date + acceptance status.
```

**Verification:** at least 5 directories submitted; 2-3 accepted within 30 days.

---

## Done definition for Phase 4

- [ ] llms.txt + llms-full.txt live and valid
- [ ] ai.txt live with explicit AI crawler allow/disallow policy
- [ ] /mcp/ documentation page live, registered in MCP registries
- [ ] Section anchors + WebPage hasPart schema on every topic page
- [ ] Knowledge graph briefs ready for Wikidata creation
- [ ] /people/orlando/ profile complete with rich Person schema
- [ ] /ask/ public Q&A surface live with FAQPage schema
- [ ] AI-citation tracker template + first baseline captured
- [ ] AI directory submissions logged

After Phase 4, FRQNCY is one of the most AI-friendly editorial sites on the web. The MCP server gives any agent direct tool access; llms.txt gives crawlers a curated index; structured Q&A gives engines clean citation surfaces; the knowledge-graph briefs queue up the entity-level wins for Phase 5.

This phase is the FRQNCY-shaped bet. Most sites can't follow it because they don't have the curation. We do.
