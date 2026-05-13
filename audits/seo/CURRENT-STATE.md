# CURRENT STATE — FRQNCY SEO baseline as of 2026-04-29

This is the honest "where we are right now" snapshot. Don't trust feels — these are the facts on disk and on the live site.

## What's already strong

**Information architecture and page structure.** 757 pages live in the sitemap, every sector follows a consistent template, breadcrumb nav is present on every item page, and `<html lang="en">` is set everywhere. Canonical URLs are correct on 100% of audited sector pages (books, people, media, orgs, places, courses, membership). Mobile viewport is set everywhere. The site is fast — minimal JS, system-font-stack-friendly with two web fonts (Cormorant + Jost), Plausible analytics is privacy-first.

**Schema.org coverage on item pages.** Every item page in books (284), people (89), media (74), orgs (102), places (8) has correct JSON-LD with the right `@type`: Book, Person, CreativeWork (or PodcastSeries for the 4 confirmed podcasts), Organization, Place. As of 2026-04-29, all 6 courses have proper `Course` schema with computed durations. The homepage carries `WebSite` schema with a `SearchAction` declared (search-box rich result eligible).

**Per-topic OG cards.** 173 of 177 topic pages reference a per-topic 1200×630 PNG at `/og/<slug>.png`. The OG generation pipeline already exists; only 4 topic pages still use the generic placeholder. This is excellent compared to the rest of the site.

**robots.txt is production-grade.** Disallows the right things — `/proposals/`, `/docs/`, `/scripts/`, `/CLAUDE.md`, `/AUDIT-REPORT.md`, archived versions, and the private app routes. References the sitemap correctly. Doesn't accidentally noindex anything important.

**Sanctuary dashboard, social platform, and chart calculator are auth-gated correctly.** Per `HANDOFF-2026-04-28-MAKE-EVERYTHING-LIVE.md`, the auth layer routes private-state pages out of the indexable surface. No PII is leaking to crawlers.

**Topic pages have substantive copy.** Every topic page has a hero, a "why this matters" section, a curated resource list, and a story/explainer block. Average word count is meaningful (manual sample check; full audit in Phase 1). Compare to thin-content competitors who run 50-word topic stubs and lean entirely on backlinks.

**Editorial values are documented.** `proposals/EDITORIAL-STANDARDS.md` exists (referenced from membership page). This is the foundation for E-E-A-T (Experience, Expertise, Authoritativeness, Trust) signals — which Google cares about more on consciousness/well-being content than on most categories because it borders YMYL (Your Money Your Life).

## What's broken or missing

**No `FAQPage` schema anywhere.** Zero pages. This is the highest-leverage rich-result win available on the site — every topic page has natural Q&A material in its body, but Google can't see it as Q&A. Adding FAQ schema to the top 50 topic pages in the right way would unlock featured-snippet eligibility on long-tail queries.

**No `HowTo` schema.** The courses (especially `meditation-101`, `working-with-claude`) and certain topic pages (any `/v2/<slug>/` covering a practice — meditation, breathwork, journaling) are natural HowTo candidates. Zero coverage today.

**No `BreadcrumbList` schema.** Every page has visible breadcrumbs in HTML, but none of them are marked up as `BreadcrumbList`. Easy fix, sitewide, sitewide rich-result win.

**No `ItemList` schema on sector indices.** `/books/`, `/people/`, `/orgs/`, `/media/`, `/places/`, `/v2/courses/`, `/aligned/` are all natural ItemList pages. None marked up. This affects how Google presents the index pages in SERPs.

**Generic OG image on the homepage and most top-level pages.** Homepage, `/about`, `/podcast`, `/start-here`, `/space`, `/membership/` — they all reference `og-image.png`. Twitter, LinkedIn, Slack, iMessage previews look identical when any of these is shared. Topic pages have the per-topic cards; sector pages don't.

**Generic OG image on every item page in books/people/media/orgs.** 549 pages share one OG card. Identified in `audits/SESSION-SUMMARY-2026-04-29.md`. This is the single biggest visual-SERP weakness on the site. Books pages don't even have embedded images, so generating per-item OG cards needs an image pipeline.

**No `llms.txt` or `ai.txt`.** Zero AI-crawler directives. Phase 4 is about this.

**No author bylines or `Person`-attributed `Article` schema on topic pages.** Topic pages read like editorially curated entries but don't claim attribution. For E-E-A-T, naming the editor (Orlando) and dating the entries with `dateModified` is high-leverage. Currently 4 topic pages use `Article`; 142 don't.

**No Google Search Console verification on the live site.** No crawl reports, no impression/click data, no submitted sitemap, no manual-action visibility. Phase 1 fixes this in 5 minutes.

**No Bing Webmaster Tools.** Bing's share is small but growing (powers ChatGPT search and Copilot). Phase 1 fixes.

**No structured `Organization` schema for FRQNCY itself on the homepage.** The homepage uses `WebSite` schema only. A separate `Organization` block (with logo, sameAs links to social profiles, founder, foundingDate) is what feeds Google's Knowledge Graph. Currently absent.

**No `sameAs` social-profile links on the FRQNCY org schema.** Even if added, Google wants the cross-references — Twitter, LinkedIn, Crunchbase, AngelList, Wikipedia (eventually). Phase 5.

**Internal linking is sparse between topic pages and item pages.** A topic page lists its curated resources, but the inverse isn't always true: a book page often doesn't link back to the topic(s) that anchor it. Cross-linking is the cheapest way to deepen topical authority. Phase 3.

**Hero images on topic pages are external Unsplash URLs.** Externally hosted, not optimized for the page, and a third-party dependency. Migrating to self-hosted CDN-served images (or the existing `/og/` PNGs as page heroes) would fix LCP and remove the external dep. Phase 2.

**Plausible is wired but no SEO conversion goals are defined.** Plausible can track outbound clicks, signups, file downloads — none of those are configured. Phase 1.

**Sitemap has `lastmod` dated `2026-04-29` for every entry.** Real lastmod dates would help crawlers prioritize. Easy fix using git mtimes. Phase 2.

**No `webmaster-verification` meta tag in the homepage `<head>`.** Required for GSC verification (alternative to DNS or file-upload methods). Phase 1.

**Membership page has no schema and uses `mailto:` for the CTA.** Once Stripe lands, add `Product` or `Service` schema with `Offer` (price, priceCurrency, availability). For now, a minimal `Service` block describing what's included is appropriate. Phase 3.

**Aligned page is a single landing without item entries or schema.** When `aligned/` grows past one page, ItemList. Phase 3.

**No explicit content freshness policy.** Topic pages, books, people, orgs — they need editorial review on a cadence (annual minimum for evergreen, quarterly for fast-moving topics like crypto/AI). Phase 3 establishes the cadence; the harness's `compress-memory` and `replay` commands are well-suited to running freshness checks.

## What's known but deliberately deferred

**Per-item OG cards for the 549 item pages.** Tracked in `audits/SESSION-SUMMARY-2026-04-29.md`. Needs an image generation pipeline (recommended: a Cloudflare Worker that synthesizes 1200×630 cards from page metadata on demand, then caches; or generate-and-commit). Highest single SEO-and-social unlock available. Recommended Phase 2 stretch goal.

**Wikipedia entries for FRQNCY (the org), the FRQNCY Podcast, and Orlando as founder.** Wikipedia's notability bar is real but not unreasonable; the network has launched, the podcast exists, the Editorial Standards doc and the curation network are externally documentable. Phase 5.

**Google Knowledge Graph entry for FRQNCY.** Earned via Wikipedia + consistent `Organization` schema + cross-platform `sameAs` links. Phase 5.

**Ahrefs/Semrush subscription.** $99-$129/mo. Worth it as soon as the keyword landscape stops fitting in your head; until then, manual web-search + GSC + Plausible is enough. Phase 1 documents the trigger.

## Sector-level scoreboard (one row per sector, as of 2026-04-29)

| Sector | Pages | Canonical | JSON-LD | OG image | Breadcrumb | Per-item OG | FAQ schema | Notes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `/v2/<topic>/` | 146 | ✓ | partial (4 Article) | per-topic | ✓ | ✓ (167 cards) | ✗ | Strong baseline; missing schema for 142 of 146 |
| `/v2/courses/` | 6 | ✓ | ✓ Course | placeholder | ✓ | ✗ | ✗ | Schema added 2026-04-29; OG cards needed |
| `/books/` | 284 | ✓ | ✓ Book | placeholder | ✓ | ✗ | ✗ | No images on page; OG generation gap |
| `/people/` | 89 | ✓ | ✓ Person | placeholder | ✓ | ✗ | ✗ | OG generation gap |
| `/media/` | 74 | ✓ | ✓ (4 PodcastSeries) | placeholder | ✓ | ✗ | ✗ | 4 podcasts upgraded 2026-04-29 |
| `/orgs/` | 102 | ✓ | ✓ Organization | placeholder | ✓ | ✗ | ✗ | OG generation gap |
| `/places/` | 8 | ✓ | ✓ Place | placeholder | ✓ | ✗ | ✗ | Smallest sector, easiest to OG-generate first |
| `/membership/` | 1 | ✓ | ✗ | placeholder | – | – | ✗ | Add Service schema once Stripe lands |
| `/aligned/` | 1 | ✓ | ✗ | placeholder | – | – | ✗ | Add ItemList when items grow |
| `/podcast` | 1 | ✓ | ✓ PodcastSeries + RSS | placeholder | – | ✗ | ✗ | Best top-level page; only weakness is OG card |
| `/about`, `/start-here`, `/space` | 3 | ✓ | partial | placeholder | – | ✗ | ✗ | Top-level brand pages need per-page OG |

✓ = full coverage. ✗ = absent. – = not applicable to single-page surfaces.

## Where to read more

`SEO-PLAYBOOK.md` — the strategy.
`PHASE-2-TECHNICAL.md` — the prompts for fixing every ✗ in the table above.
`PHASE-4-AI-DISCOVERABILITY.md` — the prompts for the AI-citation surface that doesn't appear in this table at all.
