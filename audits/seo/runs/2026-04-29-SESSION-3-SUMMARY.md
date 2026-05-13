# SEO Execution — Session 3 Summary — 2026-04-29

Third execution session of the day. Five surfaces shipped, all of which compound on the foundation laid in Sessions 1 and 2.

## What was shipped

### Sitewide topic-page bylines (Phase 3.4 follow-on)

**174 topic pages** now display a visible byline at the bottom of the hero:

> Edited by Orlando Eisenreich · Standards: FRQNCY Editorial · Updated <date>

Each byline:
- Links "Orlando Eisenreich" → `/people/orlando/` (newly created in this session)
- Links "FRQNCY Editorial" → `/editorial-standards/` (Session 2)
- Pulls the `<time datetime>` from each page's existing `Article` JSON-LD `dateModified` (Session 1, Phase 2.4)

**Why it matters:** the single highest-impact E-E-A-T move on the site. Every topic page now declares an editor, references published standards, and shows freshness — exactly the trio Google's quality raters look for, especially on YMYL-adjacent topics.

### `/people/orlando/` founder profile

Created the Person profile page that the bylines link to. Full Person + BreadcrumbList JSON-LD with `worksFor`, `knowsAbout` (10 entries), `sameAs` to GitHub + Twitter, `memberOf` FRQNCY. Visible content: bio, pillar grid, "What Orlando makes" list (FRQNCY, harness, MCP server, podcast, editorial standards), contact.

This page is also Knowledge Graph substrate — the `founder` field in the homepage Organization schema now resolves to a real Person entity, not a dangling reference.

### HowTo schema on practice courses (Phase 3.2)

`meditation-101` and `working-with-claude` now carry `HowTo` JSON-LD with 5 steps each, populated from the existing lesson list. `totalTime` set from the existing Course schema's computed durations. Both pages now expose Course + HowTo simultaneously (valid per Google).

The other 4 courses (`crypto-fundamentals`, `quantum-grammar`, `quantum-reality`, `conscious-living-foundations`) intentionally kept Course-only because they're conceptual not step-by-step — adding HowTo would be schema-spam.

### Internal linking items → topics (Phase 2.9)

**518 item pages** across books / people / orgs / media / places now have an "Anchored to: Topic-1, Topic-2, …" block before the footer, linking back to the topics that anchor them in `resources.json`.

This **closes the cluster loop in both directions**:
- Topic pages → resources (forward: already shipped historically via topic page generators)
- Resources → topics (reverse: shipped today)

Bidirectional linking is what Google reads as topical-coherence. The existing 766-resource library is now genuinely a graph, not a flat directory.

40 items remain mapping-orphan (no resources.json entry) — the same orphans flagged in Session 2's cluster coverage audit. Editorial cleanup follow-up.

### Knowledge Graph entity briefs (Phase 4.5)

Wikidata-ready submission packages for four FRQNCY-adjacent entities:

1. **FRQNCY** (the network/organization) — `instance of`, `inception 2024`, `founded by`, `Twitter username`, full sameAs
2. **The FRQNCY Podcast** — `instance of: podcast`, `creator`, `RSS feed URL`, references to Apple/Spotify when registered
3. **Orlando Eisenreich** — `instance of: human`, `occupation`, `employer`, `notable work`, GitHub + Twitter
4. **Intaaya** (the Bali sanctuary) — `instance of: retreat center`, `country`, `located in`, `part of: FRQNCY Sanctuary network`

Each brief includes the property table, the references for verification, and the post-creation steps (capture Q-number → update FRQNCY's JSON-LD with the `identifier` field). Total estimated time for Orlando: 2-4 hours across all four entities.

Wikidata is more permissive than Wikipedia on notability — these can all be created now. Wikipedia articles are the Phase 5.1 follow-on once notability accumulates.

### MCP registry submission package (Phase 4.3 follow-on)

Detailed submission plan covering 6 registries:
1. `modelcontextprotocol/servers` (the official community list)
2. Glama.ai (auto-discovery + manual fallback)
3. Smithery.ai (with `smithery.yaml` template)
4. Anthropic devrel (informal email outreach)
5. Cursor / Continue / Cody (typically inherit from #1)
6. ChatGPT MCP (when public form opens)

**Prerequisite gating all 6:** `npm publish @frqncy/mcp-content`. Currently the package exists locally but isn't on npm — once published, the install commands in `/mcp/index.html` actually work, and the 6 registry submissions all become valid.

Tracker template at `audits/seo/MCP-REGISTRY-TRACKER.md` (recommended skeleton in the doc).

## Schema coverage now

| Schema type | Count |
| --- | ---: |
| BreadcrumbList | 565+ |
| Article | 174 (topics) + 2 (editorial-standards + mcp) |
| WebPage hasPart | 148 |
| ItemList | 6 |
| Course | 6 |
| **HowTo** | **2 (new)** |
| **HowToStep** | **10 (new)** |
| Organization | 1 (homepage) |
| Person | 90 (89 existing + 1 new for Orlando) |
| Book | 284 |
| Place | 8 |
| PodcastSeries | 4 + 1 |
| FAQPage | 1 (/ask/) |
| SoftwareApplication | 1 (/mcp/) |
| TechArticle | 1 (/mcp/) |

## Files modified this session

```
NEW:
  /people/orlando/index.html
  /audits/seo/runs/2026-04-29-phase-3.4-bylines.md
  /audits/seo/runs/2026-04-29-phase-3.2-howto-courses.md
  /audits/seo/runs/2026-04-29-phase-2.9-internal-linking.md
  /audits/seo/runs/2026-04-29-phase-4.5-knowledge-graph-briefs.md
  /audits/seo/runs/2026-04-29-phase-4.3-followon-mcp-submissions.md
  /audits/seo/runs/2026-04-29-SESSION-3-SUMMARY.md (this file)

MODIFIED:
  /<topic>/index.html × 174  (+ byline element in hero)
  /courses/meditation-101/index.html  (+ HowTo schema)
  /courses/working-with-claude/index.html  (+ HowTo schema)
  /books/<slug>/index.html × 284 + people × 89 + orgs × 102 + media × 74 + places × 8
    Total 518 modified with anchored-topics block (40 orphans skipped per resources.json mapping)
  /sitemap.xml (+1 entry: /people/orlando/, now 745 entries)
  ~/Library/Application Support/Claude/.../memory/project_frqncy_seo.md
```

## Verification on the live site

```bash
# Bylines on every topic page
curl -s https://frqncy.network/meditation/ | grep -c 'class="byline"'  # 1
curl -s https://frqncy.network/meditation/ | grep -c 'editorial-standards'  # ≥1

# Orlando page
curl -sI https://frqncy.network/people/orlando/  # 200
curl -s https://frqncy.network/people/orlando/ | grep -oE '"@type":"[^"]+"' | sort -u

# HowTo on practice courses
curl -s https://frqncy.network/courses/meditation-101/ | grep -c '"@type":"HowTo"'  # 1
curl -s https://frqncy.network/courses/meditation-101/ | grep -c '"@type":"HowToStep"'  # 5

# Anchored-topics on item pages
curl -s https://frqncy.network/books/blink/ | grep -c 'class="anchored-topics"'  # 1
curl -s https://frqncy.network/people/alan-watts/ | grep -c 'class="anchored-topics"'  # 1

# Sitemap
curl -s https://frqncy.network/sitemap.xml | grep -c '<url>'  # 745
```

Test on https://search.google.com/test/rich-results — Article + HowTo + Person + BreadcrumbList all should validate on appropriate pages.

## Three-session totals (2026-04-29 across the day)

Combined work across all three sessions:

- **Schema coverage:** 565+ BreadcrumbList, 176 Article, 148 WebPage hasPart, 6 ItemList, 6 Course, 2 HowTo (10 HowToSteps), 1 Organization on home, 90 Person, 1 FAQPage, 1 SoftwareApplication, 1 TechArticle, 4 PodcastSeries, 1 podcast brand-vehicle PodcastSeries.
- **AI discoverability:** /llms.txt (139.5 KB), /llms-full.txt (488 KB), /ai.txt, robots.txt updated, /mcp/ public docs page, /ask/ public Q&A surface.
- **Trust + topical authority:** /editorial-standards/ live, /people/orlando/ profile, sitewide bylines on 174 topic pages, internal linking from 518 item pages back to topics.
- **Foundation:** GSC + Bing meta scaffolding, IndexNow keyfile, sitemap real lastmod (745 entries total), 754-row content inventory CSV, freshness rubric + quarterly review calendar.
- **Strategy + paper trail:** 10 SEO foundation docs (CONTEXT, CURRENT-STATE, SEO-PLAYBOOK, METRICS, 5 phase docs, README), 17 run-logs.

The site went from "well-built but flat-schemed" in the morning to "rich-result eligible across every page type, AI-citation surfaces deployed, editorial trust signals visible everywhere" by end of day.

## What's next (per memory file)

1. FAQPage schema on top 30 topic pages with topic-specific Q&A (Phase 3.1)
2. Per-item OG card pipeline (Phase 2.7)
3. Cluster coverage cleanup (197 page-link mismatches)
4. First quarterly freshness smoke-test
5. Orlando-side manual: GSC verification, npm publish, Wikidata entries
6. Phase 5 starts: Wikipedia drafts, podcast outreach, partners, HARO
7. Top-level page OG cards
8. Glossary blocks + DefinedTermSet
