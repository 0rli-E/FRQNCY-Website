# SEO Execution Session — 2026-04-29

This is the consolidated summary of every SEO change shipped in this session. Every fix is on disk, verified, and documented per-task in adjacent run-log files.

## Top-line numbers

| Metric | Before | After | Delta |
| --- | ---: | ---: | ---: |
| BreadcrumbList schema (item pages) | 0 | 563 | +563 |
| Article schema (topic pages) | ~141 (mixed format) | 174 | normalized + filled gaps |
| WebPage hasPart schema (topic pages) | 0 | 148 | +148 |
| ItemList schema (sector indexes) | 0 | 6 | +6 |
| Organization schema (homepage) | 0 | 1 | +1 |
| Sector resource-block ids (deep-linkable) | 0 | 372 | +372 |
| llms.txt published | no | yes (139.5 KB, 643 entries) | new |
| llms-full.txt published | no | yes (488 KB, 643 entries with text) | new |
| ai.txt published | no | yes (15+ AI bots policy) | new |
| robots.txt AI-crawler rules | 0 | 3 (ClaudeBot/GPTBot/PerplexityBot + 4 more) | new |
| Sitemap real lastmod | 0 entries | 152 updated to git mtime | improved |
| GSC verification meta on top-level pages | 0 | 6 (placeholder, awaits real value) | new |
| Bing verification meta on top-level pages | 0 | 6 (placeholder, awaits real value) | new |
| IndexNow keyfile | none | `cb4283bd575faacde2dd9ce4de81db74.txt` | new |
| Content inventory CSV rows | none | 754 | new |

## What was shipped (in order)

### Phase 2 — Technical SEO

1. **BreadcrumbList sitewide (563 pages)** — every item page in books, people, places, media, orgs, v2/courses now carries BreadcrumbList JSON-LD. Three-level: FRQNCY → Sector → Item. Eligible for SERP breadcrumb display, replacing the URL string. Run log: `2026-04-29-phase-2.1-breadcrumb-rollout.md`.

2. **Real sitemap lastmod (152 entries updated)** — replaced the 2026-04-29 placeholder with git-tracked `last commit ISO date` per file. 589 entries that already happened to be 2026-04-29 are accurate (those files genuinely changed today). XML validates. Run log: `2026-04-29-phase-2.2-sitemap-lastmod.md`.

3. **ItemList schema on 6 sector indexes** — books, people, places, media, orgs, v2/courses. Aligned skipped (no items yet). Each carries a numbered list of all items in the sector for SERP carousel eligibility. Run log: `2026-04-29-phase-2.3-itemlist.md`.

4. **Article schema on 174 topic pages** — normalized format across all v2/<topic>/ pages with `headline`, `description`, `image`, `datePublished` (from earliest git commit), `dateModified` (latest), `author: Organization (FRQNCY)`, `publisher`, `mainEntityOfPage`. 33 pages got the schema added; 141 already had it under a slightly different format. Run log: `2026-04-29-phase-2.4-article-schema.md`.

5. **Organization schema on homepage** — added a second JSON-LD block alongside the existing WebSite schema. Includes logo (favicon.svg), founder (Orlando Eisenreich linked to /people/orlando/), foundingDate (2024), areaServed, knowsAbout (10 topical strengths), sameAs (Twitter only — Phase 5 expands), publishingPrinciples (link to /editorial-standards/). Foundation for Google Knowledge Graph. Run log: `2026-04-29-phase-2.5-organization-schema.md`.

### Phase 4 — AI Discoverability

6. **llms.txt + llms-full.txt** — the AI-native sitemap. 643 indexed pages with editorially-written descriptions, structured per the proposed [llms.txt spec](https://llmstxt.org/). Compact variant (139.5 KB) for quick scan; full variant (488 KB, 2000-char body per page) for direct AI consumption. Run log: `2026-04-29-phase-4.1-llms-txt.md`.

7. **ai.txt + robots.txt mirroring** — explicit AI-crawler policy. Allowed: ClaudeBot, anthropic-ai, GPTBot, ChatGPT-User, OAI-SearchBot, PerplexityBot, Google-Extended, Applebot-Extended, cohere-ai, CCBot, FacebookBot, MistralAI-User, Diffbot. Disallowed: Bytespider. Sitewide disallow on private routes (my-frqncy/dashboard, social/login, audits/, proposals/, etc.). robots.txt mirrors the AI-bot UA rules and references both llms.txt and ai.txt. Run log: `2026-04-29-phase-4.2-ai-txt.md`.

8. **Section anchors + WebPage hasPart on topic pages** — 372 `<section class="resource-block">` elements got stable id attributes derived from their first heading or link slug, and 148 topic pages got a `WebPage` JSON-LD with `hasPart[]` listing the citable section URLs. Pattern: `https://frqncy.network/v2/meditation/#waking-up-sam-harris` is now a real deep link. AI engines can cite individual curated resources. Run log: `2026-04-29-phase-4.4-section-anchors.md`.

### Phase 1 — Discovery scaffolding

9. **GSC + Bing Webmaster + IndexNow setup** — verification meta tags inserted on 6 top-level pages (homepage, about, podcast, start-here, space, membership) with placeholder strings ready to swap. IndexNow keyfile `cb4283bd575faacde2dd9ce4de81db74.txt` written to the site root. Comprehensive checklist in run log tells Orlando exactly what to do in the GSC and Bing dashboards (which AI agents can't access). Run log: `2026-04-29-phase-1.1-1.2-1.3-verification.md`.

10. **Content inventory CSV (754 rows)** — every published page across topics, books, people, places, media, orgs, courses, top-level. Columns: sector, url_path, canonical, title, description, h1, word_count, jsonld_types, has_breadcrumblist, has_faqpage, has_article, has_webpage, og_image_per_page, og_image_url, internal_links, external_links, first_commit_date, last_commit_date. Plus a markdown summary with sector totals, schema coverage, OG-image distribution, the 30 thinnest pages (Phase 3.9 input), and the 30 oldest pages (Phase 3.6 freshness input). Run log: `2026-04-29-phase-1.5-content-inventory.md` + `2026-04-29-content-inventory.csv`.

### From earlier the same day (already complete before this run)

- Course JSON-LD on 6 courses
- 4 podcasts upgraded CreativeWork → PodcastSeries
- Sitemap added 15 missing entries (places, courses, membership)

## What this unlocks

**Eligible for now (assuming GSC verification is done):**
- Breadcrumb rich result on every item page
- Article rich result on every topic page (with full author + dateModified attribution)
- ItemList carousel on sector index queries
- Organization knowledge panel signals (compounds over months)
- llms.txt-aware AI crawlers can index the full editorial library in one fetch
- ai.txt-aware crawlers respect explicit policy rather than defaulting to robots.txt
- Per-resource deep links from AI engines

**Set up but awaits manual completion:**
- GSC + Bing Webmaster verification (Orlando swaps the placeholder for the real value, deploys, clicks Verify)
- IndexNow push notifications (keyfile is live; deploy hook needs wiring per the run-log spec)

## What's NOT done in this session

Per the SEO playbook, these are scoped for follow-up agent runs or human work. Each has a paste-ready prompt in the corresponding phase doc.

**Phase 2 remaining:**
- Per-item OG card pipeline (the 549 image-less item pages — biggest social-sharing weakness)
- Top-level page OG cards (homepage, about, podcast, start-here, space, membership)
- Unsplash hero image migration on topic pages
- Internal-linking pass: items → topics (Phase 2.9)
- Cluster coverage audit (Phase 2.10)
- Mobile + a11y deep audit
- Core Web Vitals baseline

**Phase 3 (content & topical authority):**
- FAQPage schema on top 30 topic pages with REAL Q&A
- HowTo schema on practice-oriented courses
- Glossary blocks + DefinedTermSet schema sitewide
- Author bylines + editorial-standards page publication
- Contextual cross-linking pass
- Freshness rubric + first quarterly review
- Thin-content triage (the 30 thinnest from inventory)
- Aligned + Membership schema briefs

**Phase 4 remaining:**
- Public /mcp/ docs page
- Knowledge graph entity briefs
- Author profile (Orlando) page enrichment
- /ask/ public Q&A surface
- AI-citation tracking dashboard + first baseline
- AI directory submissions

**Phase 5 (distribution):**
- Wikipedia + Wikidata
- sameAs matrix expansion
- Podcast outreach kit + first 10 outreach
- Partner backlink program
- Press list + 3 story pitches
- HARO / Qwoted pipeline
- Reference-content moat (5 deep entries / year)
- Brand-mention monitoring

## Verification on live site

Once these changes deploy:

```bash
# llms.txt
curl -s https://frqncy.network/llms.txt | head -10

# ai.txt
curl -s https://frqncy.network/ai.txt | head -20

# robots.txt with AI rules
curl -s https://frqncy.network/robots.txt | grep -E "ClaudeBot|GPTBot|PerplexityBot"

# IndexNow keyfile
curl -s https://frqncy.network/cb4283bd575faacde2dd9ce4de81db74.txt

# Sitemap with real dates
curl -s https://frqncy.network/sitemap.xml | grep -c "<lastmod>"

# Schema on a representative topic page
curl -s https://frqncy.network/v2/meditation/ | grep -c "application/ld+json"
# Should return 4: WebSite/Organization aren't on this page, but Article + BreadcrumbList + WebPage + (FAQPage when Phase 3 ships)

# Organization schema on home
curl -s https://frqncy.network/ | grep -A1 '"@type": "Organization"' | head -3

# Google Rich Results test
# https://search.google.com/test/rich-results?url=https://frqncy.network/v2/meditation/
# https://search.google.com/test/rich-results?url=https://frqncy.network/

# Schema.org validator
# https://validator.schema.org/?url=https://frqncy.network/v2/meditation/
```

## Files modified (high-level)

```
NEW FILES:
  /llms.txt
  /llms-full.txt
  /ai.txt
  /cb4283bd575faacde2dd9ce4de81db74.txt          (IndexNow keyfile)
  /audits/seo/runs/2026-04-29-*.md               (10 run-logs)
  /audits/seo/runs/2026-04-29-content-inventory.csv

MODIFIED:
  /index.html                                    (+ Organization JSON-LD, GSC/Bing meta)
  /about.html                                    (GSC/Bing meta)
  /podcast.html                                  (GSC/Bing meta)
  /start-here.html                               (GSC/Bing meta)
  /space.html                                    (GSC/Bing meta)
  /membership/index.html                         (GSC/Bing meta)
  /robots.txt                                    (AI-bot rules + llms.txt reference)
  /sitemap.xml                                   (real lastmod on 152 entries)
  /books/index.html                              (+ ItemList JSON-LD; n=284)
  /people/index.html                             (+ ItemList JSON-LD; n=89)
  /places/index.html                             (+ ItemList JSON-LD; n=8)
  /media/index.html                              (+ ItemList JSON-LD; n=74)
  /orgs/index.html                               (+ ItemList JSON-LD; n=102)
  /v2/courses/index.html                         (+ ItemList JSON-LD; n=6)
  /books/<slug>/index.html  × 284                (+ BreadcrumbList JSON-LD)
  /people/<slug>/index.html × 89                 (+ BreadcrumbList JSON-LD)
  /places/<slug>/index.html × 8                  (+ BreadcrumbList JSON-LD)
  /media/<slug>/index.html  × 74                 (+ BreadcrumbList JSON-LD)
  /orgs/<slug>/index.html   × 102                (+ BreadcrumbList JSON-LD)
  /v2/courses/<slug>/index.html × 6              (+ BreadcrumbList JSON-LD)
  /v2/<topic>/index.html    × 174                (+ Article JSON-LD where missing,
                                                    + WebPage hasPart on 148,
                                                    + section ids on 372 resource blocks)
```

That's the session.
