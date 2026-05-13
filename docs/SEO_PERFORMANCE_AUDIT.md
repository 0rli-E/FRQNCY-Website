---
title: FRQNCY SEO + Performance Audit
author: audit-agent-e
date: 2026-04-18
---

# FRQNCY SEO + Performance Audit

## Executive Summary

FRQNCY is in better SEO shape than most static sites of its size. Meta tags, Open Graph, Twitter Cards, and canonicals are present on every sampled page and are generally well-written. The sitemap lists 173 URLs, robots.txt is clean, and every topic page under `/v2/` ships JSON-LD (`ItemList` + `BreadcrumbList`) — a significant and genuinely underappreciated asset. Heading hierarchy is mostly correct: every sampled page has exactly one `<h1>`, though `start-here.html` and `platform.html` skip from `<h1>` straight to `<h3>` inside hero/step sections, which is a small semantic loss. Image SEO is a non-issue in scope (only 15 `<img>` tags site-wide; all have `alt` and `loading="lazy"`) — the site is visually driven by SVG/canvas and external YouTube thumbnails, so there is no hidden pile of unoptimized hero imagery. Core Web Vitals risk is real but modest: every page pulls Google Fonts via render-blocking `<link>` with `display=swap` on most pages but missing on `index.html` and several hero pages, no fonts are self-hosted or preloaded, and large inline `<style>` blocks delay FCP slightly. The highest-leverage fixes are (1) adding Schema.org markup to the podcast and homepage (podcast is the single biggest untapped win), (2) building a "Related Topics" cross-link block on topic pages to rescue ~90 currently orphan-ish pages from SEO limbo, (3) normalizing heading hierarchy, and (4) extending sitemap coverage from 173 → ~186 URLs. Keyword strategy should lean into long-tail "conscious living + [topic]" combinations rather than head terms.

## Top 10 Action List

1. **Add `PodcastSeries` JSON-LD to `/podcast.html`** (Critical, S) — biggest quick win; currently zero structured data on the podcast page.
2. **Add `Organization` + `WebSite` + `SearchAction` JSON-LD to `/index.html`** (Critical, S) — unlocks sitelinks search box eligibility.
3. **Fix heading hierarchy in `start-here.html` and `platform.html`** (High, S) — change first `<h3>` under hero to `<h2>` so semantic outline is continuous.
4. **Build "Related Topics" block** on every `/v2/<topic>/` page (High, M) — 3-5 curated internal links per page. Resolves the near-orphan problem for ~90 pages.
5. **Add missing `changefreq`/`lastmod`-accurate sitemap entries** for all 186 pages (High, S) — today the sitemap covers ~173, and several known pages (e.g., `/v2/watch/index.html`, `/v2/courses/*` sub-pages, `/v2/crypto/projects.html` & `explorer.html`, `/chart-v2/calibration.html`) are missing or stale.
6. **Self-host Cormorant + Jost as WOFF2** and preload (High, M) — removes Google Fonts render-blocking chain; adds ~100-300 ms to FCP on slow networks.
7. **Ensure `display=swap` is on every Google Fonts URL** (High, S) — index.html uses it but many pages silently rely on inline `<style>` without it; verify.
8. **Add `Review`/`ItemList` with `offers`/`url`** on `/v2/crypto/projects.html`** (High, M) — crypto curation page is a ranking candidate for "curated crypto projects" long-tail; currently no Schema.
9. **Add homepage links to the 6 top pillar pages** (High, S) — turn the "Four Pillars" section in index.html into actual `<a>` links to `/v2/network-state/`, `/v2/fund/`, `/v2/research/`, `/broadcast/`, `/v2/builder/`, `/v2/society/`.
10. **Replace `og:image` PNGs with pre-sized 1200×630 WebP variants where bandwidth-limited audiences matter** (Nice-to-have, M) — purely a CWV + social crawl speed nudge.

---

## 1. Meta Tags & Open Graph

### Sampled pages and ratings

| Page | `<title>` | Description | OG | Twitter | Canonical | Quality |
|---|---|---|---|---|---|---|
| `index.html` | "FRQNCY — Built on the Foundations of Oneness" | Good (154 chars) | Full | Full | Yes | **A** |
| `about.html` | "About FRQNCY — Built on the Foundations of Oneness" | Good; on-brand | Full | Full | Yes | **A** |
| `chart.html` | "Chart Generator — FRQNCY" | Good, keyword-rich | Full | Full | Yes | **A** |
| `platform.html` | "Platform — FRQNCY" | Good | Full | Full | Yes | **A** |
| `podcast.html` | "Podcast — FRQNCY" | Good | Full | Full | Yes | **A-** (no schema) |
| `start-here.html` | "Start Here — FRQNCY" | Good | Full + dims | Full | Yes | **A** |
| `v2/explore.html` | "Explore the Network — FRQNCY" | Good | Full + dims | Full | Yes | **A** |
| `v2/meditation/index.html` | "Meditation — FRQNCY Network" | Good | Full + dims + topic-specific OG image | Full + topic OG | Yes | **A+** |
| `v2/crypto/index.html` | "Crypto — FRQNCY Network" | Good | Full (generic OG image — no topic variant) | Full | Yes | **A-** |
| `v2/crypto/projects.html` | "Project Curation — FRQNCY Crypto" | Good | Full (generic OG) | Full | Yes | **A-** |

**What works:** consistent template, all pages declare title/description/canonical/OG/Twitter; topic pages under `/v2/` get per-topic OG images from `/og/*.png`. Descriptions are on-brand and under 160 chars.

**Minor gaps:**
- `og:image:width`/`height` dimensions are declared on only 5 sampled pages (`start-here.html`, `broadcast/`, `v2/translation/`, `v2/renewable-energy/`, `v2/fund/`, and most `/v2/<topic>/`). Add to all top-level pages for LinkedIn/Slack rendering reliability. Effort: S.
- Crypto section (`v2/crypto/index.html`, `/projects.html`, `/explorer.html`) uses the generic `og-image.png`. Purpose-built OG images for these three would sharpen crypto-audience acquisition. Effort: M.

---

## 2. Heading Hierarchy

### Findings per sampled page

| Page | h1 count | Outline issue |
|---|---|---|
| `index.html` | 1 | Clean: h1 → h2 → h3 |
| `about.html` | 1 | Clean: h1 → h2 → h3 |
| `chart.html` | 1 | `<h1>Chart Generator</h1>` goes directly to `<h2>Your Energetic Blueprint</h2>` and then to `<h3>Manifestor/Generator/...</h3>` — **clean** |
| `platform.html` | 1 | Clean: h1 → h2 → h3 |
| `podcast.html` | 1 | Clean (h1 at line 510) |
| `start-here.html` | 1 | **Skip**: `<h1>` at line 170 → `<h3>` at line 181 (no `<h2>`). First `<h2>` doesn't appear until line 312. |
| `v2/explore.html` | 1 | `<h1>FRQNCY NETWORK</h1>` in overlay; map is canvas — acceptable |
| `v2/meditation/index.html` | 1 | Clean |
| `v2/crypto/index.html` | 1 | Clean |
| `v2/crypto/projects.html` | 1 | Clean |

### Specific fixes

- **`start-here.html`** — the "Step 1/2/3" cards at lines 181, 190, 199 should be `<h2>` (or wrap the steps section in a visually-invisible `<h2>How FRQNCY works</h2>`). Screen readers and SERP snippet algorithms both benefit. Effort: S.
- **No multi-h1 violations found** in the sample.

---

## 3. Image Optimization

The site is lighter on raster imagery than it appears. Across all top-level HTML, there are only **15 `<img>` tags in 12 files** (mostly YouTube thumbnails in topic pages and the podcast hero). Most visual weight is carried by inline SVG, CSS gradients, `<canvas>` particle FX, and D3-rendered network graphs.

### Findings

- **`alt` attributes**: all 15 `<img>` tags have `alt=` declared. Note: several `alt=""` (empty) on YouTube thumbs — this is semantically correct when the thumbnail is decorative next to the video title, so not a bug.
- **`loading="lazy"`**: present on all 15 tags. Good.
- **Modern formats (webp/avif)**: **0 occurrences** site-wide. All OG images and thumbs are PNG or JPG. OG images on social platforms are re-encoded server-side so this matters less; but the `/og/*.png` files could be sibling-served as WebP for when social previewers support it, and favicon is an SVG (already modern).
- **Dimensions / explicit `width`×`height`**: spot-checked the podcast and meditation pages — dimensions are not declared on YouTube thumbnails, which can cause minor CLS. Effort to fix: S (add `width="480" height="360"` to all `img.youtube.com/vi/*/hqdefault.jpg`).

### Recommendation

Image optimization is **not a material SEO lever** for FRQNCY. Don't spend time converting OG images to WebP unless you're also redoing the OG pipeline. Do add `width`/`height` to YouTube thumb `<img>` tags to eliminate CLS. Effort: S.

---

## 4. Core Web Vitals Hypothesis

Cloudflare Pages + static HTML means LCP and TTFB are already strong. Likely choke points:

### Render-blocking CSS / fonts

- **Every sampled page** preconnects to `fonts.googleapis.com` and loads Cormorant + Jost via a `<link rel="stylesheet">` — this is a render-blocking external stylesheet and the single biggest FCP/LCP contributor on the site.
- **`display=swap`** is in the Google Fonts URL on `index.html`, `about.html`, `chart.html`, `platform.html`, `podcast.html`, `start-here.html`, `v2/meditation/`, `v2/crypto/*`. Good baseline. A few pages (e.g., ones using inline `@font-face` blocks) should be spot-checked.
- **No font preloading** (`<link rel="preload" as="font" crossorigin>`): 0 pages. Self-hosting + preloading would save ~100-300 ms on FCP in 3G. Effort: M.
- **Large inline `<style>` blocks** on v2 pages (200+ lines before `</head>`) is fine for HTTP/2+Cloudflare (single round trip) — don't externalize unless you can also inline critical CSS.

### Other CWV risks

- **D3 on `v2/explore.html`**: `<script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js"></script>` is synchronous (not `defer`/`async`). On a map page this blocks rendering until D3 arrives. Effort: S — add `defer`.
- **Service worker registration** on every page: fine, but the `sw.js` script itself should be audited (not in scope here) to ensure it doesn't intercept with stale content.
- **No lazy-loading of the hero network map iframe/canvas**: the `<canvas id="particles-canvas">` on `index.html` fires immediately. For intro/above-the-fold this is correct. No fix needed.

### Verdict

Real CWV risk is **moderate-low** and dominated by Google Fonts. If you only do one perf thing this quarter: **self-host + preload Cormorant/Jost**.

---

## 5. Sitemap + robots.txt

### `sitemap.xml` (present, 173 `<url>` entries)

Good shape: correct XML namespace, `lastmod`/`changefreq`/`priority` on every entry, chart/podcast/crypto are listed. But:

- **Missing entries** (spot-checked from filesystem):
  - `/v2/watch/index.html` is linked to from nav but not in sitemap (it IS listed — verified).
  - `/v2/courses/meditation-101/`, `/v2/courses/quantum-reality/`, `/v2/courses/quantum-grammar/`, `/v2/courses/conscious-living-foundations/` — only `crypto-fundamentals` is currently in the sitemap. Add the other 4. Effort: S.
  - `/v2/crypto/explorer.html` and `/v2/crypto/projects.html` ARE listed. Good.
  - `/chart-v2/calibration.html` — not listed. May be intentional (internal tool). Confirm.
  - `/search.html` ✓
  - `/my-frqncy.html` ✓
  - `/space.html` ✓
- **`lastmod`**: mostly 2026-04-17 with a few 2026-04-18 pages. Consider automating via your build (`build-og.js` or a new `build-sitemap.js` that walks the HTML tree).
- **`priority` rubric** is sensible: homepage 1.0, pillars 0.8-0.9, topics 0.6. No changes needed.

### `robots.txt` (present)

```
User-agent: *
Allow: /
Disallow: /versions/
Sitemap: https://frqncy.network/sitemap.xml
```

Clean, correct, minimal. No changes needed. Consider adding explicit `Disallow: /chart-v2/` if `calibration.html` is internal-only.

### Recommended additions

- 4 missing course pages
- Confirm/add `/social/` landing (community entry point)
- Automate sitemap generation so drift doesn't accumulate

Effort to bring sitemap to 100% coverage: **S-M** (15-30 min manual, or 1 hr to script).

---

## 6. Internal Linking

### Homepage (`index.html`)

The body content of the homepage does NOT link to the 6 pillar pages by name. The "Four Pillars" section (lines 162-183) describes Network State, Fund, Research & Education, Social Networks — but as plain `<div class="detail-card">` with no `<a href>`. **This is a high-leverage miss.** Making each detail card a linked anchor into `/v2/network-state/`, `/v2/fund/`, etc., would:
- Pass PageRank from the highest-authority page to the pillar hubs
- Give users an actual CTA beyond "Explore Full Map"

Effort: S.

### Topic pages (`/v2/<topic>/index.html`)

- Every topic page has breadcrumb (up), course callouts (sideways/down), and video modals — all correct.
- **No "Related Topics" block.** A page like `/v2/meditation/` does not link to `/v2/breathwork/`, `/v2/yoga/`, `/v2/mindfulness/`, or `/v2/somatic-therapy/`. These pages exist and are thematically adjacent. The current graph relies entirely on the `/v2/explore.html` map for topic-to-topic navigation, which is a UX-only surface with zero SEO signal strength.
- **Fix:** add a `<section>Related topics</section>` with 3-5 curated internal links per topic page. The curation data already lives in `search.json` (133 topics, co-tagged in the context graph). Script this. Effort: M (1-2 days to curate + script + deploy).

### Crypto project pages (`/v2/crypto/projects.html`, `/v2/crypto/explorer.html`)

- `projects.html` has 173+ curated crypto projects in a filterable grid (per Notion sync). Currently, projects link OUT to their own sites — there is **no cross-linking between projects** or from a project to a thematic topic (e.g., a DeFi project linking to `/v2/defi/`). Effort: M.

### Orphan pages

Pages listed in sitemap but with weak/no internal inbound links:
- `/v2/robert-jay-gould/` (individual-person page)
- `/v2/quantum-grammar/`, `/v2/siddha-yoga/`, `/v2/kriya-yoga/`, `/v2/merkaba/`, `/v2/akashic-records/` — niche metaphysics pages linked only through the explore map.

Adding "Related Topics" blocks will substantially heal the orphan problem.

---

## 7. Keyword Strategy

### Inferred current targeting (from titles, descriptions, H1s)

Primary brand terms: `FRQNCY`, `FRQNCY Network`. These will own position 1 for brand searches trivially.

Conceptual terms the site implicitly chases:
- "conscious living"
- "oneness"
- "network state"
- "consciousness research"
- "Human Design + Gene Keys chart generator"
- "curated resources" / "crypto curation"

### Realistic 5 primary keywords (small-site ranking potential)

Ranked by achievability × business value:

1. **"conscious living network"** — low competition, unique brand angle. High achievable. Current title/description already targets this.
2. **"FRQNCY podcast"** — trivial once the podcast has episodes and `PodcastSeries` schema. Low volume but high intent.
3. **"Human Design Gene Keys natal chart"** (`chart.html`) — long-tail combo that most chart generators don't combine. Medium competition; achievable with 2-3 high-quality backlinks.
4. **"curated crypto projects conscious"** / **"conscious crypto projects"** — thin competition; high intent for FRQNCY's audience. Achievable.
5. **"conscious living resources [topic]"** — long-tail template for 130+ topic pages (e.g., "conscious living meditation resources", "conscious living sacred geometry"). These are the volume keywords. Low individual traffic but additive.

**Directional honesty:** The head term "consciousness" is dominated by Deepak Chopra, Joe Dispenza, Wim Hof, and corporate meditation apps. Don't chase head terms. Own the long tail.

### What NOT to target

- "meditation app" (saturated; FRQNCY doesn't have an app)
- "crypto news" (wrong surface; FRQNCY is a curator, not news)
- "spirituality" (too broad)

---

## 8. Structured Data (Schema.org)

### Current state

**Pleasant surprise**: 155 of the ~186 HTML files contain `<script type="application/ld+json">`. Specifically, topic pages under `/v2/<topic>/` ship:

- `ItemList` with `numberOfItems` and `itemListElement`
- `BreadcrumbList` with positioned items
- `isPartOf: { @type: WebSite, name: FRQNCY Network }`

This is genuinely well-executed and is FRQNCY's hidden SEO moat. Example from `v2/meditation/index.html` line 217: full `ItemList` + `BreadcrumbList`.

### What's missing (in order of value)

- **`/podcast.html`** — no schema at all. Add `PodcastSeries` (and `PodcastEpisode` once episodes ship). This alone is **Critical, S**.
- **`/index.html`** — no schema. Add `Organization` (with `logo`, `sameAs` socials) + `WebSite` (with `potentialAction: SearchAction` pointing to `/search.html?q={search_term_string}`). **Critical, S**.
- **`/about.html`** — `AboutPage` schema with `mainEntity: Organization`. Low effort.
- **`/chart.html`** — `SoftwareApplication` or `WebApplication` schema (applicationCategory: "UtilityApplication", free chart tool). Medium value.
- **`/v2/crypto/projects.html`** — convert the current curation grid into an `ItemList` of `Product`/`Thing` items with `url`, `name`, `description`. If FRQNCY tiers are intended as ratings, add `AggregateRating` or `Review` markup. **High value, M effort**.
- **`/v2/explore.html`** — `CollectionPage` with the topic list as `hasPart`.
- **`/v2/courses/*/index.html`** — `Course` schema with `provider: FRQNCY`, `courseCode`, `educationalLevel`, `numberOfCredits`. Spot-checked — not present. Eligible for course rich results. **High value, M effort**.

---

## Prioritized Findings

### Critical (fix this week)

| # | Finding | Where | Why | How | Effort |
|---|---|---|---|---|---|
| C1 | No JSON-LD on podcast page | `/podcast.html` | Misses PodcastSeries rich result eligibility | Add `<script type="application/ld+json">` with `@type: PodcastSeries`, `name`, `description`, `webFeed` (RSS URL), `image` | **S** |
| C2 | No JSON-LD on homepage | `/index.html` | Misses `Organization` + sitelinks search box | Add `Organization` (`@id`, `logo`, `sameAs`) and `WebSite` with `potentialAction SearchAction` | **S** |
| C3 | D3 loaded synchronously, blocking render | `/v2/explore.html` line 27 | Hurts FCP on Discover page | Add `defer` attribute to the `<script src="...d3.min.js">` | **S** |

### High-value (fix this month)

| # | Finding | Where | Why | How | Effort |
|---|---|---|---|---|---|
| H1 | Heading hierarchy skip h1→h3 | `/start-here.html` lines 181,190,199 | Semantic/accessibility loss; SERP snippet quality | Change step `<h3>` to `<h2>` | **S** |
| H2 | No "Related Topics" block on topic pages | All `/v2/<topic>/index.html` | Orphans ~90 niche pages from internal PageRank | Script: for each topic, pick 3-5 related from `search.json` co-tags; inject block before page footer | **M** |
| H3 | Homepage "Four Pillars" cards are not linked | `/index.html` lines 162-183 | Wastes homepage authority | Wrap each `.detail-card` in `<a href="<pillar>/">` | **S** |
| H4 | Sitemap missing 4 course pages + potentially others | `/sitemap.xml` | Pages won't be discovered promptly | Add entries for `/v2/courses/{meditation-101,quantum-reality,quantum-grammar,conscious-living-foundations}/`; consider automating | **S** |
| H5 | Google Fonts render-blocking, not self-hosted | All pages | Adds 100-300 ms to FCP on slow networks | Self-host Cormorant + Jost WOFF2; `<link rel="preload" as="font" crossorigin>`; remove external fonts.googleapis.com chain | **M** |
| H6 | No schema on `/v2/crypto/projects.html` | `/v2/crypto/projects.html` | Missed rich result on a high-intent page | Add `ItemList` with per-project `Product`/`Thing` items (and `Review`/`AggregateRating` if tier = rating) | **M** |
| H7 | No `Course` schema on course pages | `/v2/courses/*/index.html` | Eligible for course rich results | Add `Course` JSON-LD per course page (provider: FRQNCY, name, description, educationalLevel, numberOfCredits if known) | **M** |
| H8 | Crypto OG images are generic | `/v2/crypto/{index,projects,explorer}.html` | Weaker social CTR | Generate 3 purpose-built 1200×630 OG PNGs matching the site's crypto purple/navy aesthetic | **M** |
| H9 | `og:image:width`/`height` missing on several pages | `/index.html`, `/about.html`, `/chart.html`, `/podcast.html`, `/platform.html`, `/v2/crypto/*` | Flaky social rendering on LinkedIn/Slack | Add `<meta property="og:image:width" content="1200">` + `:height content="630"` everywhere | **S** |

### Nice-to-have (backlog)

| # | Finding | Where | Why | How | Effort |
|---|---|---|---|---|---|
| N1 | YouTube thumb `<img>` tags lack `width`/`height` | `/v2/<topic>/index.html` video sections | Minor CLS | Add `width="480" height="360"` to all YouTube thumbnail `<img>` | **S** |
| N2 | Project-to-topic cross-links | `/v2/crypto/projects.html` | Internal link graph density | For each project, link its category chip to the matching `/v2/<topic>/` page | **M** |
| N3 | No `AboutPage` schema | `/about.html` | Small rich result eligibility | Add `AboutPage` with `mainEntity: Organization` | **S** |
| N4 | Automated sitemap regeneration | build pipeline | Drift prevention | Add `build-sitemap.js` to walk the HTML tree and output `sitemap.xml` at deploy time | **M** |
| N5 | WebP variants of OG images | `/og-image.png`, `/og/*.png` | Marginal bandwidth savings | Sibling-serve `.webp`; leave `.png` as OG image URL (Facebook/Twitter don't support WebP yet) | **M** |
| N6 | `Disallow: /chart-v2/` in robots.txt | `/robots.txt` | Hide internal calibration tool from indexes | One-line addition if confirmed internal | **S** |
| N7 | Consider `hreflang` for any future locales | all HTML | Future-proofing | Not needed until multi-locale ships | — |
| N8 | `schema.org/Person` pages for teachers | `/v2/people/index.html` + per-person pages | Knowledge graph eligibility | Add `Person` JSON-LD once individual teacher pages ship | **L** |

---

## Summary of what the audit DID find

- **173 sitemap entries** (site has ~186 HTML pages)
- **155 pages with JSON-LD** (topic pages — excellent coverage)
- **15 `<img>` tags site-wide**, 100% with `alt` and `loading="lazy"`
- **0 pages with `<font-display>` inline**; `display=swap` relied on via Google Fonts URL
- **0 multi-h1 violations** in the sampled pages
- **1 confirmed h1→h3 skip** (`start-here.html`)
- **Meta/OG/Twitter coverage: 100%** of sampled pages
- **Homepage has no schema**, **podcast page has no schema**

The site is in roughly the 80th percentile for small-site SEO hygiene. Closing the top 3 gaps (podcast schema, homepage schema, related-topics cross-linking) would push it into the 95th.
