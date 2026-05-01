# SEO Execution — Session 2 Summary — 2026-04-29

This session continued from the first execution session of the day. Five major surfaces shipped + one cross-cluster audit + the freshness program.

## What was shipped

### `/editorial-standards/index.html` — Phase 3.4 prerequisite

Public, indexable version of the editorial standards (previously only at `proposals/EDITORIAL-STANDARDS.md`, robots-disallowed). FRQNCY chrome, Article + BreadcrumbList JSON-LD, 7 stable section anchors (#what-makes-a-pick, #conflict-of-interest, #who-can-pick, #provenance, #retirement, #reviewing, #integrity-test). Added to sitemap (now 742 entries).

**Why it matters:** E-E-A-T signal for YMYL-adjacent content, prerequisite for topic-page bylines, backs the homepage Organization schema's `publishingPrinciples` claim.

### `/mcp/index.html` — Phase 4.3

Public documentation for the FRQNCY content MCP server. Tool surface, install instructions for Claude Desktop / FRQNCY harness / self-host, sample queries, license/attribution. SoftwareApplication + TechArticle + BreadcrumbList JSON-LD. Added to sitemap (now 743 entries).

**Why it matters:** the highest-leverage AI-agent discoverability surface left. Makes FRQNCY a node in any AI-tool registry. Discoverable by any client crawling public MCP docs.

### `/ask/index.html` — Phase 4.7

Public Q&A surface with 10 real questions and grounded answers. Visible `<details><summary>` accordion entries. **First FAQPage schema on the site** — Featured-snippet eligible. Search form POSTs to existing /search backend. Per-question deep-link anchors. WebPage + FAQPage + BreadcrumbList JSON-LD. Added to sitemap (now 744 entries).

**Why it matters:** AI engines (Perplexity, ChatGPT, Claude, Gemini) weight FAQPage schema heavily when grounding answers. The 10 entries cover the questions FRQNCY most wants AI engines to give well-cited answers to.

### `audits/seo/runs/2026-04-29-phase-2.10-cluster-coverage.md` — Phase 2.10

Cross-cluster audit using `content.json` + `resources.json` + on-disk pages as three sources of truth. Findings:

- **0 topics in content.json missing pages on disk** — clean
- **30 topics on disk with no resources mapped** in resources.json — likely intentional resource-less topics
- **197 page-link mismatches** — resources.json says a resource should be linked from a topic page, but the topic page's HTML doesn't have the link. Indicates a publication-pipeline lag where resources.json was updated but static topic HTML wasn't regenerated.
- **39 orphan items** across sectors (books/people/orgs/media/places) — exist on disk but no entry in resources.json.

The audit script is saved at `audits/seo/runs/2026-04-29-cluster-coverage.py` for re-running quarterly.

### `audits/seo/FRESHNESS-RUBRIC.md` + `audits/seo/QUARTERLY-REVIEW-CALENDAR.md` — Phase 3.6

Operationalized freshness:
- 9 fast-moving topics review every 90 days (artificial-intelligence, ar-vr, bioenergy, biotechnology, blockchain, climate, cryptocurrency, decentralized-networks, network-state)
- 136 evergreen topics review once per year, distributed evenly across 4 quarters (~34/quarter)
- ~17 reviews/month = 2-4 hrs/week of editorial time. Sustainable at current network size.
- Calendar generator script saved for re-runs as the topic taxonomy evolves.

## Schema coverage now

| Schema type | Count |
| --- | ---: |
| BreadcrumbList | 565+ (item pages + new top-level pages) |
| Article | 174 (topic pages) + 2 (editorial-standards + mcp) |
| WebPage hasPart | 148 (topic pages with deep-linkable section anchors) |
| ItemList | 6 (sector indexes) |
| Course | 6 (courses) |
| Organization | 1 (homepage) + nested in schemas across the site |
| Person | 89 (people pages) |
| Book | 284 (book pages) |
| Place | 8 (place pages) |
| PodcastSeries | 4 (podcast media items) + 1 (homepage podcast) |
| CreativeWork | 70 (non-podcast media) |
| **FAQPage** | **1 (/ask/ — new)** |
| **SoftwareApplication** | **1 (/mcp/ — new)** |
| **TechArticle** | **1 (/mcp/ — new)** |

## Memory updated

`spaces/.../memory/project_frqncy_seo.md` updated to reflect the new "what's shipped" and "what's queued" lists. Anyone (Claude or future agent) loading the project memory now gets the accurate post-Session-2 state.

## Files modified this session

```
NEW:
  /editorial-standards/index.html
  /mcp/index.html
  /ask/index.html
  /audits/seo/FRESHNESS-RUBRIC.md
  /audits/seo/QUARTERLY-REVIEW-CALENDAR.md
  /audits/seo/runs/2026-04-29-phase-3.4-editorial-standards.md
  /audits/seo/runs/2026-04-29-phase-4.3-mcp-docs.md
  /audits/seo/runs/2026-04-29-phase-4.7-ask-page.md
  /audits/seo/runs/2026-04-29-phase-2.10-cluster-coverage.md
  /audits/seo/runs/2026-04-29-phase-3.6-freshness-rubric.md
  /audits/seo/runs/2026-04-29-cluster-coverage.py
  /audits/seo/runs/2026-04-29-build-calendar.py
  /audits/seo/runs/2026-04-29-SESSION-2-SUMMARY.md (this file)

MODIFIED:
  /sitemap.xml (+3 entries: editorial-standards, mcp, ask)
  ~/Library/Application Support/Claude/.../memory/project_frqncy_seo.md
```

## Verification on the live site

Once deployed:

```bash
# New pages
curl -sI https://frqncy.network/editorial-standards/ # 200
curl -sI https://frqncy.network/mcp/                 # 200
curl -sI https://frqncy.network/ask/                 # 200

# Sitemap inclusion
curl -s https://frqncy.network/sitemap.xml | grep -E "editorial-standards|/mcp/|/ask/"

# FAQPage schema (first on the site)
curl -s https://frqncy.network/ask/ | grep -c '"@type":"Question"'  # 10

# SoftwareApplication on /mcp/
curl -s https://frqncy.network/mcp/ | grep -oE '"@type":"[^"]+"' | sort -u

# Article schema on /editorial-standards/
curl -s https://frqncy.network/editorial-standards/ | grep -c '"@type":"Article"'
```

Test the new pages on https://search.google.com/test/rich-results — Article, FAQPage, SoftwareApplication, BreadcrumbList all should validate.

## What's queued (priority order)

Per the updated memory file:

1. FAQPage schema on top 30 topic pages with topic-specific Q&A
2. Per-item OG card pipeline (the 549-page social-sharing weakness)
3. Topic-page byline rollout (now that editorial-standards is live)
4. Internal linking pass: items → topics
5. Cluster coverage cleanup (197 page-link mismatches; 39 orphan items)
6. First quarterly freshness smoke-test
7. GSC + Bing verification (Orlando-side)
8. MCP server submission to public registries + `npm publish`
9. HowTo schema on practice courses
10. Knowledge Graph entity briefs (Wikidata)
