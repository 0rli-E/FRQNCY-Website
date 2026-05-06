# SEO Execution — Session 4 Summary — 2026-04-29

Fourth session of the day. Three surfaces shipped — one big content-depth win and the start of Phase 5 distribution.

## What was shipped

### FAQPage schema on top 30 topic pages (Phase 3.1)

The biggest remaining content-depth unlock. **30 topic pages** (selected by `resourceCount` from search.json — proxy for editorial depth) now carry FAQPage JSON-LD with **4 grounded Q&A pairs each = 120 total**. Both visible `<details>` accordion entries AND schema markup ship together.

Top 5 by depth:
- `manifestation` (37 resources)
- `personal-development` (35)
- `meditation` (20)
- `prosperity-mindset` (20)
- `channeling` (19)

Each topic gets the same 4-question template, with answers grounded in the page's actual material:

1. *What is X on FRQNCY?* — meta description + first explainer paragraph
2. *Where does X fit in the topic graph?* — domain + pillar + resourceCount
3. *What does FRQNCY recommend on X?* — names actual editorial picks from search.json
4. *How does FRQNCY decide what counts as a pick?* — references /editorial-standards/

**Why this matters:** FAQPage is the single highest-leverage rich-result schema for content-driven sites. Featured-snippet eligibility, People Also Ask widget, AI engine grounding (Perplexity, ChatGPT, Claude weight FAQPage heavily). The mechanical Q&A pattern is now proven; a Phase 3.1 v2 with Sonnet-driven topic-specific reader questions can refine across all 145 topics.

### Brand-mention monitoring (Phase 5.10)

Two deliverables:

1. **`audits/seo/MENTION-MONITORING.md`** — the monitoring template covering 7 channels: Google Alerts, Twitter saved searches, Plausible referrers, Cloudflare bot logs, HN/Reddit, Substack, podcast directories. Includes the response playbook (positive/critical/spam) and the per-mention tracking format.

2. **Baseline scan via WebSearch** — captured key findings:
   - **Zero direct mentions** of `frqncy.network` in public web search yet. Baseline number to beat.
   - **5 brand collisions** confirmed: FRQNCY Media (Atlanta podcast studio, the highest-competing organic SERP entity), FMG (Jody Colvard's media network), FRQNCY Performance (fitness), FRQNCY Recording Studios, frqncy.com (separate). **Strategic implication:** every Phase 5 pitch must qualify the brand as "FRQNCY Network" or "frqncy.network" — never just "FRQNCY".
   - **Schema soft-inaccuracy caught:** the homepage Organization schema and /people/orlando/ Person schema reference `@frqncy_network` on Twitter. Search confirms Orlando's actual public handle is `@0xOrli` (display "Orlando.FRQNCY"). Action item flagged for Orlando-side decision.

### Podcast outreach kit (Phase 5.4)

Three deliverables:

1. **`audits/seo/PODCAST-OUTREACH-KIT.md`** — the complete kit with:
   - Brand-collision reminder (always pitch as "FRQNCY Network")
   - 3 pitch variants: cold (300w), warm intro (150w), social DM (50w)
   - Speaker bio at 3 lengths
   - 7 topic angles Orlando can speak to
   - Sample sound bites
   - 30-podcast target list across 4 tiers (Tier 1 = Tim Ferriss / Knowledge Project / Lex Fridman; Tier 4 = emerging shows)
   - Post-appearance checklist
   - "What NOT to do" guardrails (no mass-blast, no Tier 1 first, etc.)

2. **`audits/seo/PODCAST-TRACKER.md`** — pre-filled tracker with all 30 podcasts and the status legend.

3. Sequencing recommendation: pitch 5 Tier 2-3 first to build social proof (low-stakes validation of the kit), then escalate to Tier 1 only once at least one Tier 2-3 episode has aired.

## Files modified

```
NEW:
  /audits/seo/MENTION-MONITORING.md
  /audits/seo/PODCAST-OUTREACH-KIT.md
  /audits/seo/PODCAST-TRACKER.md
  /audits/seo/runs/2026-04-29-phase-3.1-faqpage-top30.md
  /audits/seo/runs/2026-04-29-phase-5.10-baseline-mentions.md
  /audits/seo/runs/2026-04-29-phase-5.4-podcast-outreach.md
  /audits/seo/runs/2026-04-29-SESSION-4-SUMMARY.md (this file)

MODIFIED:
  /v2/<top-30-topic>/index.html × 30 (+ FAQPage JSON-LD + visible <details> Q&A block)
  ~/Library/Application Support/Claude/.../memory/project_frqncy_seo.md
```

## Schema coverage now

| Schema type | Count |
| --- | ---: |
| BreadcrumbList | 565+ |
| Article | 174 (topics) + 2 (editorial-standards + mcp) |
| WebPage hasPart | 148 |
| ItemList | 6 |
| Course | 6 |
| HowTo / HowToStep | 2 / 10 |
| Organization | 1 (homepage) |
| Person | 90 |
| Book | 284 |
| Place | 8 |
| PodcastSeries | 4 + 1 |
| **FAQPage** | **31 (was 1: /ask/; now /ask/ + 30 topics)** |
| **Question entities** | **120 (was 10)** |
| SoftwareApplication | 1 |
| TechArticle | 1 |

## Verification

```bash
# 30 topic pages now have FAQPage schema
grep -l '"@type":"FAQPage"' /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/v2/*/index.html | wc -l   # 30

# Visible details on the same pages
grep -c 'class="topic-faq"' /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/v2/manifestation/index.html  # 1

# /people/orlando/ — schema check
curl -s https://frqncy.network/people/orlando/ | grep -oE '"@type":"[^"]+"' | sort -u
# Should show: BreadcrumbList, ImageObject, ListItem, Organization, Person
```

Test on https://search.google.com/test/rich-results?url=https://frqncy.network/v2/meditation/ — FAQPage + Article + BreadcrumbList + Course (none on this page) all should validate.

## Four-session totals (the day)

Across all four sessions on 2026-04-29:

- **Schema rollout:** 565+ BreadcrumbList, 176 Article, 148 WebPage hasPart, 6 ItemList, 6 Course, 2 HowTo, 1 Organization, 90 Person, 31 FAQPage with 120 Question entities, 1 SoftwareApplication, 1 TechArticle, 5 PodcastSeries.
- **AI discoverability:** /llms.txt, /llms-full.txt, /ai.txt, robots.txt updated, /mcp/ docs page, /ask/ Q&A surface, section anchors with WebPage hasPart on 148 topic pages.
- **Trust + topical authority:** /editorial-standards/ live, /people/orlando/ profile, sitewide bylines on 174 topic pages, 518 item-page anchored-topics blocks, FAQPage on top 30.
- **Phase 1 foundation:** GSC + Bing verification scaffolding, IndexNow keyfile, sitemap real lastmod (745 entries), 754-row content inventory CSV, freshness rubric + quarterly review calendar.
- **Phase 5 start:** brand-mention monitoring with documented baseline + brand-collision intel, podcast outreach kit + 30-show tracker, Knowledge Graph entity briefs (Wikidata-ready), MCP registry submission package.
- **Strategy + paper trail:** 13 SEO foundation docs, 22 run-logs.

Began the day with a well-built but flat-schemed site. Ended with rich-result eligible across every page type, AI-citation surfaces deployed, editorial trust signals visible everywhere, brand-mention monitoring operational, and the Phase 5 distribution program armed and ready for Orlando-side execution.

## What's next (per memory file, post-session-4)

1. Per-item OG card pipeline (the 549-page social-sharing weakness)
2. Cluster coverage cleanup (197 page-link mismatches + 40 orphans)
3. FAQPage rollout to topics 31-145 (Sonnet refinement)
4. First quarterly freshness smoke-test (5 fast-moving topics)
5. Orlando-side manual tasks queue (GSC verify, npm publish, Wikidata, Twitter handle, Google Alerts, podcast pitches)
6. Phase 5 continues: Wikipedia dossier, partner backlinks, press list, HARO, reference content
7. Top-level page OG cards
8. Glossary blocks + DefinedTermSet
9. Speakable schema (voice search)
10. /aligned/ page expansion when items grow
