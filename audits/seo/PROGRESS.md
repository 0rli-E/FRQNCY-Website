# FRQNCY SEO — Progress Dashboard

**Last updated:** 2026-05-13 (post parallel-agent run · Phase 5.3, 5.5, 5.8 landed)
**Auto-update with:** `python3 audits/seo/runs/build-progress.py`

---

## Strategic anchor (read this FIRST)

The strategic source of truth for the visibility / SEO program is now **[`/proposals/VISIBILITY-PLAN.md`](../../proposals/VISIBILITY-PLAN.md)** (Orlando, 2026-05-12). It consolidates the 5-phase audits/seo/ work into a 90-day plan organized around 5 visibility sources (organic search · podcasts · cross-platform mentions · network effects · direct reach).

Companion docs in proposals/:
- [`/proposals/PODCAST-OUTREACH-PLAN.md`](../../proposals/PODCAST-OUTREACH-PLAN.md) — the operational layer on top of `audits/seo/PODCAST-OUTREACH-KIT.md`
- [`/proposals/TELEGRAM-CHANNEL-LAUNCH.md`](../../proposals/TELEGRAM-CHANNEL-LAUNCH.md) — Telegram channel playbook
- [`/proposals/FRQNCY-V1-ROADMAP.md`](../../proposals/FRQNCY-V1-ROADMAP.md) — broader product roadmap

This dashboard is the implementation-state view; the plan is the strategy view. Read both.

---

## ⚠️ CRITICAL FINDING — read this first

The site has a topic-page generator (`scripts/generate_topic_page.py`) and a likely item-page generator (`generate.js`) that **regenerate static HTML from data sources** (`data/topics/<slug>.yaml`, `resources.json`). Across Sessions 1-4, my approach was to inject schema, bylines, FAQ blocks, and anchored-topics directly into the static HTML files — but **those injections did not survive subsequent generator runs**.

Full details: [CRITICAL-FINDING-build-pipeline.md](runs/2026-04-29-CRITICAL-FINDING-build-pipeline.md).

**What survives** (root-level files, new pages, foundation docs): editorial-standards/, mcp/, ask/, people/orlando/, llms.txt, ai.txt, robots.txt, sitemap.xml, all of audits/seo/.

**What got wiped on regen:** Article schema on topic pages (174→16), BreadcrumbList on item pages (563→14), FAQPage on topics (30→2), bylines (174→16), anchored-topics blocks (518→0), ItemList on sector indexes (6→1), section anchors + WebPage hasPart (372/148→~20/~10).

**The fix:** modify the generator to emit schema natively, OR wrap injections in `<!-- BESPOKE:slot -->...<!-- /BESPOKE -->` markers (the generator preserves these). All future schema work goes through this path.

---

## At-a-glance — actual current state

| Metric | Ever-shipped | Currently live |
| --- | ---: | ---: |
| **Phase tasks shipped (intended)** | 22 | – |
| **Foundation files surviving** | 13 | 13 |
| **Run-logs on disk** | 24 | 24 |
| **Sitemap entries** | 759 | 759 |
| **Standalone pages built** | 4 | 4 (editorial-standards, mcp, ask, orlando) |
| **AI-discoverability files** | 2 | 2 (llms.txt, ai.txt) |
| **Topic pages with Article schema** | 174 | **16** |
| **Topic pages with FAQPage** | 30 | **2** |
| **Topic pages with byline** | 174 | **16** |
| **Item pages with BreadcrumbList** | 563 | **14** |
| **Item pages with anchored-topics** | 518 | **0** |
| **Sector indexes with ItemList** | 6 | **1** |
| **WebPage hasPart on topics** | 148 | **~10** |
| **Days into program** | Day 1 | – |

---

## Phase scoreboard

### Phase 1 — Discovery (5 of 9 shipped)

| # | Task | Status | Run log |
| --- | --- | --- | --- |
| 1.1 | GSC verification meta + checklist | ⏳ scaffolded; awaits Orlando swap | [2026-04-29-phase-1.1-1.2-1.3-verification.md](runs/2026-04-29-phase-1.1-1.2-1.3-verification.md) |
| 1.2 | Bing Webmaster verification | ⏳ scaffolded; awaits Orlando swap | (same) |
| 1.3 | IndexNow keyfile | ✅ shipped | (same) |
| 1.4 | Plausible conversion goals plan | ⬜ pending | – |
| 1.5 | Full content inventory (754-row CSV) | ✅ shipped | [2026-04-29-phase-1.5-content-inventory.md](runs/2026-04-29-phase-1.5-content-inventory.md) |
| 1.6 | Keyword landscape (top 30 topics) | ⬜ pending — Sonnet model | – |
| 1.7 | Competitive landscape | ⬜ pending — Sonnet model | – |
| 1.8 | Baseline metrics snapshot | ⬜ partial (mentions in 5.10) | – |
| 1.9 | Paid SEO tool recommendation | ⬜ pending | – |

**Phase 1 health:** foundation captured; what's missing is the keyword + competitive intel that drives Phase 3 prioritization. Sonnet-model agent run for 1.6 + 1.7 is the next move.

### Phase 2 — Technical SEO (7 of 12 shipped)

| # | Task | Status | Run log |
| --- | --- | --- | --- |
| 2.1 | BreadcrumbList sitewide (563 pages) | ✅ shipped | [2026-04-29-phase-2.1-breadcrumb-rollout.md](runs/2026-04-29-phase-2.1-breadcrumb-rollout.md) |
| 2.2 | Sitemap lastmod from git (152 updated) | ✅ shipped | [2026-04-29-phase-2.2-sitemap-lastmod.md](runs/2026-04-29-phase-2.2-sitemap-lastmod.md) |
| 2.3 | ItemList schema on 6 sector indexes | ✅ shipped | [2026-04-29-phase-2.3-itemlist.md](runs/2026-04-29-phase-2.3-itemlist.md) |
| 2.4 | Article schema on 174 topic pages | ✅ shipped | [2026-04-29-phase-2.4-article-schema.md](runs/2026-04-29-phase-2.4-article-schema.md) |
| 2.5 | Organization schema on homepage | ✅ shipped | [2026-04-29-phase-2.5-organization-schema.md](runs/2026-04-29-phase-2.5-organization-schema.md) |
| 2.6 | Top-level page OG cards | ⬜ deferred — needs design pipeline | – |
| 2.7 | Per-item OG card pipeline (549 pages) | ⬜ deferred — biggest visual unlock left | – |
| 2.8 | Unsplash hero migration | ⬜ pending — needs license review | – |
| 2.9 | Internal linking items → topics (518 pages) | ✅ shipped | [2026-04-29-phase-2.9-internal-linking.md](runs/2026-04-29-phase-2.9-internal-linking.md) |
| 2.10 | Cluster coverage audit + 197 mismatches found | ✅ audit shipped; auto-fix queued | [2026-04-29-phase-2.10-cluster-coverage.md](runs/2026-04-29-phase-2.10-cluster-coverage.md) |
| 2.11 | Mobile + a11y audit | ⬜ pending | – |
| 2.12 | Core Web Vitals baseline | ⬜ pending | – |

**Phase 2 health:** schema rollout substantially done; the visible OG-image gap is the only remaining major weakness.

### Phase 3 — Content & topical authority (5 of 10 shipped)

| # | Task | Status | Run log |
| --- | --- | --- | --- |
| 3.1 | FAQPage schema on top 30 topics (120 Q&A) | ✅ shipped | [2026-04-29-phase-3.1-faqpage-top30.md](runs/2026-04-29-phase-3.1-faqpage-top30.md) |
| 3.1 v2 | FAQPage on remaining 115 topics | ⬜ queued — re-run script | – |
| 3.2 | HowTo schema on practice courses (2 of 6) | ✅ shipped | [2026-04-29-phase-3.2-howto-courses.md](runs/2026-04-29-phase-3.2-howto-courses.md) |
| 3.3 | Glossary blocks + DefinedTermSet | ⬜ pending — 145 topics × ~6 terms | – |
| 3.4 | Editorial-standards page | ✅ shipped | [2026-04-29-phase-3.4-editorial-standards.md](runs/2026-04-29-phase-3.4-editorial-standards.md) |
| 3.4 follow-on | Topic-page bylines (174 pages) | ✅ shipped | [2026-04-29-phase-3.4-bylines.md](runs/2026-04-29-phase-3.4-bylines.md) |
| 3.5 | Contextual cross-linking | ⬜ pending — name-to-URL pass | – |
| 3.6 | Freshness rubric + quarterly calendar | ✅ shipped | [2026-04-29-phase-3.6-freshness-rubric.md](runs/2026-04-29-phase-3.6-freshness-rubric.md) |
| 3.7 | First quarterly freshness smoke-test (5 topics) | ⬜ pending — Sonnet model | – |
| 3.8 | Speakable schema on topic pages | ⬜ pending — quick win | – |
| 3.9 | Thin-content remediation (top 30) | ⬜ pending — needs editorial | – |
| 3.10 | Aligned + Membership schema briefs | ⬜ pending | – |

**Phase 3 health:** trust-signal substrate fully shipped (standards page + bylines + freshness program). The remaining items are content-depth additions.

### Phase 4 — AI discoverability (5 of 9 shipped)

| # | Task | Status | Run log |
| --- | --- | --- | --- |
| 4.1 | llms.txt + llms-full.txt | ✅ shipped | [2026-04-29-phase-4.1-llms-txt.md](runs/2026-04-29-phase-4.1-llms-txt.md) |
| 4.2 | ai.txt + robots.txt AI rules | ✅ shipped | [2026-04-29-phase-4.2-ai-txt.md](runs/2026-04-29-phase-4.2-ai-txt.md) |
| 4.3 | Public /mcp/ docs page | ✅ shipped | [2026-04-29-phase-4.3-mcp-docs.md](runs/2026-04-29-phase-4.3-mcp-docs.md) |
| 4.3 follow-on | MCP registry submission package | ✅ shipped — awaits Orlando-side `npm publish` | [2026-04-29-phase-4.3-followon-mcp-submissions.md](runs/2026-04-29-phase-4.3-followon-mcp-submissions.md) |
| 4.4 | Section anchors + WebPage hasPart | ✅ shipped | [2026-04-29-phase-4.4-section-anchors.md](runs/2026-04-29-phase-4.4-section-anchors.md) |
| 4.5 | Knowledge Graph entity briefs (Wikidata) | ✅ shipped | [2026-04-29-phase-4.5-knowledge-graph-briefs.md](runs/2026-04-29-phase-4.5-knowledge-graph-briefs.md) |
| 4.6 | Author profile (Orlando) | ✅ shipped | (in [2026-04-29-phase-3.4-bylines.md](runs/2026-04-29-phase-3.4-bylines.md)) |
| 4.7 | /ask/ public Q&A surface | ✅ shipped | [2026-04-29-phase-4.7-ask-page.md](runs/2026-04-29-phase-4.7-ask-page.md) |
| 4.8 | AI-citation tracking dashboard | ⏳ tracker template in MENTION-MONITORING.md; first manual audit pending | – |
| 4.9 | AI directory submissions | ⬜ pending — Orlando-side | – |

**Phase 4 health:** the bet of the program. Substantially shipped — `llms.txt`, `ai.txt`, `/mcp/`, `/ask/`, section anchors, Knowledge Graph briefs, author profile. Awaiting Orlando-side submission of the MCP server to public registries.

### Phase 5 — Distribution & backlinks (2 of 10 shipped)

| # | Task | Status | Run log |
| --- | --- | --- | --- |
| 5.1 | Wikipedia notability dossier | ⬜ pending — needs deep web search | – |
| 5.2 | Wikidata entity creation | ⏳ briefs ready (4.5); awaits Orlando-side execution | – |
| 5.3 | sameAs matrix audit | ⬜ partial — found in 5.10 baseline | – |
| 5.4 | Podcast outreach kit | ✅ shipped | [2026-04-29-phase-5.4-podcast-outreach.md](runs/2026-04-29-phase-5.4-podcast-outreach.md) |
| 5.5 | Partner backlink program | ⬜ pending | – |
| 5.6 | Press list + journalist outreach | ⬜ pending | – |
| 5.7 | HARO / Qwoted pipeline | ⬜ pending | – |
| 5.8 | Reference-content moat (5 deep entries/yr) | ⬜ pending | – |
| 5.9 | Newsletter exchanges | ⬜ pending | – |
| 5.10 | Brand-mention monitoring + baseline | ✅ shipped | [2026-04-29-phase-5.10-baseline-mentions.md](runs/2026-04-29-phase-5.10-baseline-mentions.md) |

**Phase 5 health:** earliest stage. Two of ten shipped (podcast kit, monitoring). Multi-quarter compound — long road by design.

---

## Schema coverage scoreboard

What rich results FRQNCY is now eligible for:

| Schema type | Count | Where |
| --- | ---: | --- |
| `BreadcrumbList` | 565+ | every item page + top-level pages |
| `Article` | 176 | every topic page + editorial-standards + mcp |
| `WebPage` w/ `hasPart` | 148 | topic pages with section anchors |
| `ItemList` | 6 | sector indexes |
| `Course` | 6 | course pages |
| `HowTo` + `HowToStep` | 2 + 10 | meditation-101, working-with-claude |
| `Organization` | 1 | homepage |
| `Person` | 90 | every person page incl. /people/orlando/ |
| `Book` | 284 | book pages |
| `Place` | 8 | place pages |
| `PodcastSeries` | 5 | 4 media items + /podcast |
| `FAQPage` | 31 | /ask/ + top 30 topic pages |
| `Question` + `Answer` entities | 130 | from FAQPages |
| `SoftwareApplication` | 1 | /mcp/ |
| `TechArticle` | 1 | /mcp/ |

---

## Blocked-on-Orlando queue

These are gating Phase 5 and full Phase 4 deployment:

1. **GSC verification** — swap `GOOGLE_SITE_VERIFICATION_PLACEHOLDER` in 6 top-level pages with the real string from the GSC dashboard, deploy, click Verify.
2. **Bing Webmaster verification** — same, with `BING_VERIFICATION_PLACEHOLDER`.
3. **`npm publish @frqncy/mcp-content`** — unblocks all 6 MCP registry submissions per `runs/2026-04-29-phase-4.3-followon-mcp-submissions.md`.
4. **Wikidata entity creation** — for FRQNCY, FRQNCY Podcast, Orlando, Intaaya. Briefs ready in `runs/2026-04-29-phase-4.5-knowledge-graph-briefs.md`. ~30-60 min per entity.
5. **Twitter handle decision** — `@frqncy_network` doesn't appear to exist publicly yet. Either register it OR update homepage Org schema + Person schema to use `@0xOrli`. Per `runs/2026-04-29-phase-5.10-baseline-mentions.md`.
6. **Set up 4 Google Alerts** — per `MENTION-MONITORING.md` §1.
7. **Send first 5 podcast pitches** — pick 5 Tier 2-3 shows from `PODCAST-TRACKER.md`, customize with specific-episode references, send 1/day Mon-Fri.
8. **Plausible conversion goals** — when the Phase 1.4 plan is generated, apply the `data-plausible-event-name` attributes to the relevant elements.

These are user-blocking, not Claude-blocking — list them in priority order and work through.

---

## Recommended next agent run (in priority order)

1. **FAQPage rollout to topics 31-145.** Re-run the script that shipped 30 today across the remaining 115. Pure mechanical extension. Output: 145 topic pages with FAQPage instead of 30.
2. **Cluster coverage auto-fix.** Write a script that for each of the 197 page-link mismatches (audited in `runs/2026-04-29-phase-2.10-cluster-coverage.md`), looks up the resource in resources.json, generates a resource-card HTML snippet, and injects it into the topic page. Fixes all 197 in one shot.
3. **Speakable schema sitewide.** Quick voice-search win — every topic page gets `SpeakableSpecification` referencing `.hero-desc` and the first story paragraph.
4. **Phase 5 documentation batch.** Press list (Phase 5.6), HARO/Qwoted setup (5.7), partner backlink program (5.5), reference-content calendar (5.8), newsletter exchange prospects (5.9). All five are documentation tasks that compound — write once, execute over months.
5. **Glossary blocks + DefinedTermSet schema sitewide.** Slower than FAQ rollout but high-leverage; co-occurrence boost for every topic.

---

## Where this dashboard lives

- **`audits/seo/PROGRESS.md`** — this file (markdown source of truth)
- **`audits/seo/PROGRESS.html`** — the renderable interactive version (auto-generated; update when this file changes)
- **`audits/seo/runs/build-progress.py`** — re-generates both from the run-log filenames + a hand-maintained task list

When new runs ship, append the row to the matching phase table here, then re-run `build-progress.py` to refresh PROGRESS.html.

---

## Reading guide

If you have **2 minutes**: read the "At-a-glance" + "Blocked-on-Orlando queue" + "Recommended next agent run" sections.

If you have **10 minutes**: skim every phase scoreboard.

If you have **30 minutes**: open the run-logs for any task marked ⏳ to see what's stuck.

If you're **a future Claude session**: also read `~/Library/.../memory/project_frqncy_seo.md` for the strategic state.
