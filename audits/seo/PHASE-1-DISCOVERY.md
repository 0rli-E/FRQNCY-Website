# PHASE 1 — Discovery

**Goal:** establish the baseline. Connect the trackers (GSC, Bing Webmaster, Plausible goals), inventory the full content surface, map the keyword landscape, identify the real competitors, snapshot current rankings. After Phase 1 we have a number to beat.

**Prerequisites:** none. This is the starting line.

**Done when:** Google Search Console + Bing Webmaster verified and crawling, sitemap submitted, content inventory written, keyword landscape doc written, competitor matrix written, baseline metrics captured in `audits/seo/runs/2026-MM-DD-baseline.md`.

---

## Run convention

Every prompt below is paste-ready after this header (substitute model and cwd as needed):

```
frqncy-harness agent "<PROMPT>" --model openrouter/google/gemini-2.5-flash --yolo --cwd ~/Documents/Claude/Projects/FRQNCY\ WEBSITE/
```

For tasks that need real reasoning (competitive analysis, keyword strategy), upgrade the model:

```
--model claude-sdk/claude-sonnet-4-6
```

---

## Task 1.1 — Verify Google Search Console + submit sitemap

**Why:** without GSC there's no impression/click data, no coverage report, no manual-action visibility. Five-minute setup, lights up the whole program.

**This is a manual task** (Google blocks AI agents from logging into the GSC dashboard). Orlando does it; agents prep the artifacts.

```
Read /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/index.html. Add a <meta name="google-site-verification" content="GOOGLE_SITE_VERIFICATION_PLACEHOLDER"> tag inside the <head>, immediately after the <meta name="robots"> line. Also add the same tag to /about.html, /podcast.html, /start-here.html, /space.html, /membership/index.html. Write a manual-checklist file to ~/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/runs/2026-04-29-gsc-setup.md with: (1) the placeholder string used, (2) the GSC URL Orlando should visit (https://search.google.com/search-console/welcome?resource_id=https%3A%2F%2Ffrqncy.network%2F), (3) the steps Orlando should take in the GSC UI to grab the real verification string, (4) a one-line sed command to swap the placeholder for the real string across all 5 files. After that's done, the checklist tells Orlando to submit https://frqncy.network/sitemap.xml under Sitemaps in GSC.
```

**Verification:** after Orlando applies the real verification string and pushes, `curl -s https://frqncy.network/ | grep google-site-verification` should return the real meta tag, and the GSC dashboard should show "Ownership verified."

---

## Task 1.2 — Bing Webmaster Tools verification

**Why:** Bing's organic share is small but it powers ChatGPT search and Microsoft Copilot. Bing also auto-submits to Yandex and DuckDuckGo's web index. Setup mirrors GSC.

```
Read /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/index.html. Add a <meta name="msvalidate.01" content="BING_VERIFICATION_PLACEHOLDER"> tag immediately after the google-site-verification meta. Mirror onto /about.html, /podcast.html, /start-here.html, /space.html, /membership/index.html. Append to the same checklist file ~/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/runs/2026-04-29-gsc-setup.md a Bing section with: (1) URL https://www.bing.com/webmasters/about, (2) instructions to import from GSC if available (faster path), (3) the sed command to swap the placeholder for the real string.
```

**Verification:** `curl -s https://frqncy.network/ | grep msvalidate.01` returns the real value; Bing Webmaster dashboard shows verified.

---

## Task 1.3 — Wire IndexNow for instant crawl notifications

**Why:** IndexNow is a free protocol (Bing + Yandex + Seznam) that lets a site tell engines "this URL changed, recrawl now" — instead of waiting for the bot to discover it. Two-line implementation; instant indexation on edits.

```
In /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/, generate a 32-character hex IndexNow API key (use Python secrets.token_hex(16)). Write the key to a file at the site root named <KEY>.txt with the same key as content (per IndexNow spec — that's how the protocol verifies ownership). Add an entry "/<KEY>.txt" to the checklist file with the URL https://frqncy.network/<KEY>.txt. Commit the keyfile. Then write a one-page note to ~/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/runs/2026-04-29-indexnow.md explaining how to call https://api.indexnow.org/indexnow with a JSON body { host, key, urlList[] } whenever the deploy pipeline ships changes. Include a sample Cloudflare Pages Function template at functions/_middleware-onbuild.js (commented-out by default) that could trigger it post-deploy.
```

**Verification:** `curl -s https://frqncy.network/<KEY>.txt` returns the same hex key as its body. After implementing the post-deploy hook, Bing Webmaster's IndexNow dashboard shows submissions.

---

## Task 1.4 — Plausible conversion goals

**Why:** organic traffic is half the metric; what they do once they arrive is the other half. Plausible Goals tracks outbound clicks, signups, downloads — without this we can't tell which topics actually drive value.

```
Read https://plausible.io/docs/goal-conversions and https://plausible.io/docs/custom-event-goals. Then walk /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/ and identify every: (a) outbound link to a resource page (these are the FRQNCY PICK destinations), (b) the homepage subscribe form, (c) the membership mailto: CTA, (d) the chat-widget open event. Draft a goals plan to ~/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/runs/2026-04-29-plausible-goals.md listing each goal with its trigger (CSS selector, event name, or URL pattern), the suggested goal name, and a paste-ready data-attribute snippet. Do NOT modify the source files yet — Orlando reviews the plan first.
```

**Verification:** Orlando reads the plan, applies the data attributes, and the goals appear in Plausible.

---

## Task 1.5 — Full content inventory

**Why:** before we can target the right keywords or set freshness cadence, we need a single CSV-style index of every page on the site with its sector, slug, title, description, word count, last-modified date, and current schema type.

```
Walk every published page under /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/ (sectors: v2/<topic>, v2/courses, books, people, orgs, media, places, aligned, membership, plus top-level: index.html, about.html, start-here.html, space.html, podcast.html, search.html, chart.html). Skip social/, my-frqncy/, app/, music/, frqncy-os/, harness-proposals/, proposals/, docs/, scripts/. For each page extract: url (canonical or computed), sector, slug, title, description meta, h1 text, word count of main content (exclude nav, footer, scripts), JSON-LD @type, og:image is per-page or generic, hero image src (Unsplash external or self-hosted or none), hero image alt text, last git commit date for the file, the count of internal links it contains, the count of external links it contains. Write to ~/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/runs/2026-04-29-content-inventory.csv as a real CSV. Also write a one-page summary at audits/seo/runs/2026-04-29-content-inventory.md with sector totals, average word count per sector, distribution of word counts (find the thinnest 30 pages), distribution of last-modified dates (find anything not touched in 12+ months), and the count of pages still using generic OG image vs per-page.
```

**Verification:** the CSV exists and has at least 750 rows. The summary document calls out the 30 thinnest pages and the 30 stalest pages. These two lists become the input for Phase 3.

---

## Task 1.6 — Keyword landscape (manual via web search; upgrade model)

**Why:** the 146 topics are durable but we don't yet know which ones have actual search demand vs. which are evergreen-but-quiet. Need the data to prioritize Phase 3 cluster build-out.

**Use `--model claude-sdk/claude-sonnet-4-6` for this one — flash will gloss the analysis.**

```
Read /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/CONTEXT.md and /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/content.json. Extract the list of 146 topic slugs. For the top 30 topics by FRQNCY's editorial priority (use the order in content.json's pillars[].topics if present; else go alphabetically and flag), perform a web_search-based keyword landscape: for each topic, identify (a) the head term (e.g., "meditation"), (b) 5-10 high-intent long-tail variants people actually search ("how does meditation change the brain", "best meditation books for beginners", "what to do when meditation feels boring"), (c) the People Also Ask questions surfacing for the head term (web_search for "<topic> people also ask" or use the search results page directly), (d) what kind of pages currently rank top-3 (Wikipedia, news, listicles, primary sources?), (e) where FRQNCY's curated entry would naturally fit on the SERP, (f) keyword difficulty estimate based on what's ranking (low/med/high). Write each topic as its own H2 section in ~/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/runs/2026-04-29-keyword-landscape.md. End with a top-line section ranking the 30 topics by "opportunity score" — a simple lift × match score where lift = (current quality of top-ranking entry, low score = good for us) and match = (how well FRQNCY's curation actually answers the queries).
```

**Verification:** the doc has 30 ranked topics with concrete long-tail queries, PAA boxes, and a final priority ranking. Orlando reads it and decides which 10 to invest in deeply during Phase 3.

---

## Task 1.7 — Competitive landscape

**Why:** we need to know who FRQNCY is competing with for the same searches — and they're not who you'd think. The competition is *Wikipedia*, *Goodreads*, *Reddit*, *Substack newsletters*, and a long tail of consciousness-niche blogs.

**Upgrade model: `--model claude-sdk/claude-sonnet-4-6`.**

```
Read /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/CONTEXT.md. Then identify FRQNCY's actual SEO competitors across four categories: (1) general curation/aggregator sites that cover similar topical breadth (e.g., Farnam Street, Aeon, Brain Pickings (now Marginalian), Fivebooks, Goodreads, Substack publications like Maps of Meaning, Tom Morgan, etc.), (2) topic-specific sites that own a topic FRQNCY covers (e.g., Lesswrong for rationality, Mind & Life for contemplative neuroscience, Bankless for crypto, Edge.org for science). For each competitor: (a) URL, (b) what they're great at, (c) where they're weak, (d) what FRQNCY does that they don't, (e) what they do that FRQNCY should consider. Also do (3) AI answer engine 'competitors' — when a user asks ChatGPT "what's the best book on the science of meditation," who does ChatGPT cite? Run 5-10 representative queries through Perplexity (web_search "perplexity.ai" or use perplexity directly via web_fetch if available) and note which sources are most-cited for FRQNCY-adjacent queries. Then (4) competitor matrix — a table comparing FRQNCY against the top 5 competitors on: editorial standards public, topical breadth, depth-per-topic, schema completeness, freshness, AI-discoverability surfaces (FAQ schema, llms.txt, MCP server). Write to ~/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/runs/2026-04-29-competitive-landscape.md.
```

**Verification:** the matrix is filled in for FRQNCY plus 5 competitors; AI-citation findings name actual sources Perplexity / ChatGPT favor on FRQNCY's topics; recommendations end with three concrete moves where FRQNCY can leapfrog.

---

## Task 1.8 — Baseline metrics snapshot

**Why:** if you can't measure the start, you can't measure the work. Capture today's numbers so we have something to compare against in 90 days.

```
Capture FRQNCY's current SEO baseline. From Plausible's public dashboard (if available at https://plausible.io/frqncy.network) or via the Plausible API if a key is set, pull (a) last-30-day organic visits, (b) top-20 entry pages, (c) top-20 referrers, (d) bounce rate. From web_search, run "site:frqncy.network" to estimate Google's index size, then run a series of "<head_term> frqncy" queries for the top 30 topics and note for each whether FRQNCY appears in the top-20 results. Run the same queries WITHOUT "frqncy" and note FRQNCY's rank if it appears. From Cloudflare Web Analytics (if accessible) or curl tests, capture homepage TTFB, LCP, CLS via PageSpeed Insights API (https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://frqncy.network/ — public, no key needed). Write to ~/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/runs/2026-04-29-baseline-metrics.md with all numbers, a "current state" rank in each topic where FRQNCY appears, a "gap" rank where it doesn't, and a recommendation of which 10 topics to focus on first based on the gap analysis.
```

**Verification:** the doc is a real numerical snapshot with timestamps; it can be re-run on the same template at +30/+60/+90 days for trend lines.

---

## Task 1.9 — Decide on a paid SEO tool (recommendation only)

**Why:** at some point manual research stops scaling. The right time to add Ahrefs / Semrush / Moz is when you're spending more than 4 hours a month on keyword research that a tool would do in 4 minutes.

```
Read /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/runs/2026-04-29-keyword-landscape.md and the baseline-metrics doc once they exist. Write a one-page recommendation at ~/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/runs/2026-04-29-paid-tool-recommendation.md covering: (a) at what threshold (impressions/mo, organic clicks/mo, time spent on manual research) it makes sense to pay, (b) top 3 candidates (Ahrefs $129/mo, Semrush $139/mo, Moz $99/mo, plus a wildcard like Wincher or Mangools at $49/mo for budget), (c) what each one specifically does that a Plausible + GSC + manual stack does not, (d) recommendation: stay manual for now and revisit at <threshold>. The default recommendation is stay manual; if the analysis shows otherwise based on the topic landscape complexity, flag it.
```

**Verification:** Orlando reads, files, and either signs up or queues for revisit.

---

## Done definition for Phase 1

- [ ] GSC verified, sitemap submitted, no coverage errors yet (will collect over 1-2 weeks)
- [ ] Bing Webmaster verified, sitemap submitted
- [ ] IndexNow keyfile served at root
- [ ] Plausible goals plan written (Orlando applies)
- [ ] Content inventory CSV exists with 750+ rows + summary doc
- [ ] Keyword landscape doc covers 30 topics with concrete queries + opportunity scores
- [ ] Competitive landscape matrix filled with 5+ competitors and AI-engine findings
- [ ] Baseline metrics snapshot captured
- [ ] Paid-tool recommendation filed

After Phase 1, you have everything you need to prioritize Phase 2 and Phase 3. Phase 2 (technical) is mostly do-now-for-everyone work; Phase 3 (content) needs the keyword + competitive intel from Phase 1 to focus on the right 10 topics.
