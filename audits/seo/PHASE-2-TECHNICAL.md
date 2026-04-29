# PHASE 2 — Technical SEO

**Goal:** ship every technical fix that makes FRQNCY's existing curation legible to crawlers and AI engines. After Phase 2, the site is rich-result-eligible across every page type, sitemap is honest, internal linking is dense, and OG cards work.

**Prerequisites:** Phase 1 partial — you need GSC verified to monitor the rollout, but most Phase 2 tasks don't depend on Phase 1 data.

**Done when:** every sector has FAQPage and BreadcrumbList where appropriate, sitemap has real `lastmod` dates, every top-level page has a per-page OG card, every topic page carries Article schema with author and dateModified, internal linking from items back to topics is established, hero images are self-hosted, and the site is rich-result-eligible across every page type.

---

## Run convention

```
frqncy-harness agent "<PROMPT>" --model openrouter/google/gemini-2.5-flash --yolo --cwd ~/Documents/Claude/Projects/FRQNCY\ WEBSITE/
```

Schema-injection tasks are flash-safe. Anything that requires authoring (per-topic FAQ entries) needs Sonnet:

```
--model claude-sdk/claude-sonnet-4-6
```

---

## Task 2.1 — BreadcrumbList schema sitewide

**Why:** every page has visible breadcrumbs in HTML. None of them are marked up. Adding BreadcrumbList JSON-LD enables Google to display breadcrumbs in the SERP (replaces the URL string with a clean nav crumb), which lifts CTR on every result.

```
Walk every published item page under /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/ in sectors {books, people, places, media, orgs, v2/courses}. For each page, find the HTML breadcrumb element (matches class="breadcrumb"). Extract the href + text of each breadcrumb segment. Inject a separate <script type="application/ld+json"> block with @type BreadcrumbList containing itemListElement entries — position 1 = "FRQNCY" (https://frqncy.network/), position 2 = sector name capitalized (https://frqncy.network/<sector>/), position 3 = item name (the page's canonical URL). Add this AFTER any existing JSON-LD block in the same <head>. Do not modify the existing JSON-LD. Skip pages that already have BreadcrumbList. Write a run-log to ~/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/runs/2026-04-29-breadcrumb-rollout.md with per-sector counts (added / skipped-existing / errored). Verify by re-reading 3 random pages per sector and confirming BreadcrumbList parses as valid JSON.
```

**Verification:** `grep -rl '"@type":"BreadcrumbList"' /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/{books,people,places,media,orgs,v2/courses} | wc -l` returns ≥ 563.

---

## Task 2.2 — Real `lastmod` dates in sitemap.xml

**Why:** every entry currently dates to 2026-04-29 because that's when the patch ran. Real lastmod helps crawlers prioritize freshly-changed pages.

```
Walk sitemap.xml at /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/sitemap.xml. For each <url><loc>X</loc> entry, derive the corresponding source file path on disk (e.g., https://frqncy.network/books/blink/ → books/blink/index.html). Run `git log -1 --format=%cI -- <path>` to get the ISO 8601 last-commit date. Update the <lastmod> tag to that date. If git can't find the file (orphan in sitemap), flag it in the run-log. Write to ~/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/runs/2026-04-29-sitemap-lastmod.md the count of entries updated and any orphans found. Validate with python3 -c "import xml.etree.ElementTree as ET; ET.parse('sitemap.xml')" before saving.
```

**Verification:** `grep -c '<lastmod>2026-04-29</lastmod>' sitemap.xml` should drop from ~757 to a much smaller number reflecting only files actually changed today; XML stays valid.

---

## Task 2.3 — ItemList schema on sector index pages

**Why:** sector indices are natural list pages. ItemList lets Google render them as carousels in some SERP contexts.

```
For each of /books/index.html, /people/index.html, /places/index.html, /media/index.html, /orgs/index.html, /v2/courses/index.html, /aligned/index.html, parse the page to extract every <a href> that points to an item page in the same sector (e.g., /books/the-blink/ from /books/index.html). Build a JSON-LD block with @type ItemList, name = "FRQNCY <Sector>", numberOfItems = count, itemListElement = array of { @type ListItem, position, url, name } where name is the item's display text from the link. Inject before </head> after any existing JSON-LD. Skip if ItemList already present. Run-log to ~/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/runs/2026-04-29-itemlist-rollout.md.
```

**Verification:** `grep -l '"@type":"ItemList"' /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/*/index.html | wc -l` returns ≥ 7.

---

## Task 2.4 — Article schema on topic pages with author + dateModified

**Why:** 142 of 146 topic pages have no Article schema. Adding it (with `author: {@type: Person, name: "Orlando Eisenreich", url: "https://frqncy.network/people/orlando/"}` if a person page exists, else `author: {@type: Organization, name: "FRQNCY"}`, plus `datePublished` and `dateModified` derived from git) makes them eligible for the Article rich result and feeds E-E-A-T signals.

**Use `--model claude-sdk/claude-sonnet-4-6` if you want it to also write the dateModified logic correctly per file.**

```
Walk every page under /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/v2/<topic>/index.html (skip v2/explore.html, v2/courses/, v2/watch/, v2/builder/, v2/fund/, v2/og/). For each page that does NOT already have an Article JSON-LD block, build one with: @type Article, headline = h1 text or title without "— FRQNCY Network" suffix, description = meta description, image = the page's og:image (per-topic if present), datePublished = first git commit date for the file (`git log --diff-filter=A --format=%cI -- <path> | head -1`), dateModified = last git commit date, author = { @type: Organization, name: "FRQNCY", url: "https://frqncy.network/" }, publisher = { @type: Organization, name: "FRQNCY", url: "https://frqncy.network/", logo: { @type: ImageObject, url: "https://frqncy.network/favicon.svg" } }, mainEntityOfPage = the canonical URL. Inject AFTER any existing JSON-LD blocks. Run-log to ~/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/runs/2026-04-29-topic-article-schema.md with counts and any files that errored.
```

**Verification:** `grep -rl '"@type":"Article"' /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/v2/*/index.html | wc -l` returns ≥ 146.

---

## Task 2.5 — Organization schema on the homepage

**Why:** the homepage carries WebSite schema only. Adding a separate Organization block (with logo, sameAs, founder, foundingDate) feeds Google's Knowledge Graph algorithm — eventually unlocking the right-side panel for "FRQNCY" and "FRQNCY Network" queries.

```
Read /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/index.html. After the existing WebSite JSON-LD block, inject a second <script type="application/ld+json"> block with: @type Organization, name "FRQNCY", url "https://frqncy.network/", logo { @type: ImageObject, url: "https://frqncy.network/favicon.svg", width: 512, height: 512 }, sameAs [ "https://twitter.com/frqncy_network" ] (only Twitter for now; add LinkedIn / Crunchbase / etc. once they exist), founder { @type: Person, name: "Orlando Eisenreich" }, foundingDate "2024", description (use the same description meta from the homepage), areaServed "Worldwide", knowsAbout [ "consciousness", "regenerative living", "conscious capital", "network states", "contemplative practice" ]. Verify by re-reading the file and confirming both JSON-LD blocks parse. Run-log to ~/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/runs/2026-04-29-homepage-org-schema.md.
```

**Verification:** Google's Rich Results test on https://frqncy.network/ shows both WebSite and Organization detected.

---

## Task 2.6 — Top-level pages get per-page OG cards

**Why:** homepage, /about, /podcast, /start-here, /space, /membership/ all use the generic og-image.png. Each deserves a per-page card.

```
Audit /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/{index.html, about.html, start-here.html, space.html, podcast.html, membership/index.html}. For each, the og:image currently points at https://frqncy.network/og-image.png. The /v2/og/ folder already contains 167 per-topic 1200×630 PNGs that share a visual style. Write a brief at ~/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/runs/2026-04-29-top-level-og-brief.md describing: (a) for each top-level page, what the OG card should depict and the headline/subhead text it should show, (b) recommended visual style consistent with v2/og/, (c) suggested filenames (og-home.png, og-about.png, og-podcast.png, og-start-here.png, og-space.png, og-membership.png), (d) where to source the design (Figma file path if present, or generate with Canva/the existing OG generation script — find the script under scripts/ and document how to run it). Do NOT generate the images yet — Orlando reviews the brief, then a follow-up task generates and commits.
```

**Verification:** the brief is reviewed and approved by Orlando; a follow-up task generates the 6 cards; OG-image previews on Twitter/LinkedIn show the correct per-page card.

---

## Task 2.7 — Per-item OG card pipeline (the deferred big one)

**Why:** 549 item pages (books, people, media, orgs) share one OG card. This is the single biggest social-sharing weakness on the site. Books pages have no embedded images at all, so we need to generate cards.

**This task designs the pipeline; a follow-up task executes it. It's the highest-leverage Phase 2 stretch goal.**

```
Read /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/SESSION-SUMMARY-2026-04-29.md and the existing v2/og/ folder. Identify the script (under scripts/ or proposals/) that generated those topic OG cards. Then design two pipelines and write the spec to ~/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/runs/2026-04-29-og-pipeline-spec.md: Pipeline A (generate-and-commit) — extends the existing topic-OG generator to handle item pages; takes title + sector + accent color + optional cover/portrait image as input; produces 1200×630 PNG; writes to /<sector>/og/<slug>.png; updates each page's og:image meta; incremental (only regenerates when source data changes). Pipeline B (Cloudflare Worker on-demand) — a Worker at og.frqncy.network/<sector>/<slug>.png that synthesizes the card on first request, caches in Cloudflare, no committed PNGs in the repo; pages reference https://og.frqncy.network/... directly. Compare the two on: setup cost, ongoing cost, freshness behavior, repo bloat, deploy complexity, fallback behavior. Recommend one. End the spec with a phased rollout plan: places (8) first as a smoke test, then media/podcasts (use podcast art if available), then people (use portrait sources), then books (use generated cards from title+author since no covers exist), then orgs (use logos from existing sources).
```

**Verification:** the spec is on disk; Orlando picks Pipeline A or B; a follow-up task executes the chosen pipeline starting with places.

---

## Task 2.8 — Migrate Unsplash hero images to self-hosted

**Why:** every topic page hero is an Unsplash URL. External dependency, not optimized for the page, hurts LCP, and creates a license risk if Unsplash changes terms.

```
Walk every page under /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/v2/<topic>/index.html. For each, find the hero <img class="hero-poster" src="https://images.unsplash.com/..."> tag. Extract the URL. Build a manifest at ~/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/runs/2026-04-29-unsplash-migration.md listing topic-slug | unsplash-url | suggested-local-path (e.g., /v2/<slug>/hero.jpg). Recommend pulling each image to a fixed width (e.g., 1920w avif/webp/jpg trio for srcset), self-hosting at /v2/<slug>/hero.{ext}, and updating the page to use a <picture> element with srcset. Do NOT actually download or modify yet — Orlando approves the plan first because Unsplash licensing on commercial use needs a per-image attribution review.
```

**Verification:** the manifest exists and lists every Unsplash URL on every topic page; Orlando reviews licensing; a follow-up task executes the migration with attribution metadata in alt text where required.

---

## Task 2.9 — Internal linking pass: items → topics

**Why:** a book page that lists "this book is anchored to topics: meditation, neuroscience, well-being" with real links into `/v2/meditation/` and `/v2/neuroscience/` and `/v2/wellbeing/` builds topical authority on both sides — the topic page gains an inbound link from a domain-respected sub-page, and the book page becomes part of a cluster.

**This is a content-shape change so dry-run first.**

```
Read /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/content.json to extract the topic-to-resource mapping (topics[].resources[] should reference book/people/org/media slugs). For each item page in books/, people/, orgs/, media/, build a list of every topic that references it. Then for each item page, dry-run an injection: at the bottom of the main content (before the footer), add a section with class "anchored-topics" rendering: "Anchored to: <topic-1>, <topic-2>, <topic-3>" with each topic linking to /v2/<topic-slug>/. Use the same visual treatment as the existing FRQNCY chrome (jost font, gold accent for links). Write the dry-run output to ~/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/runs/2026-04-29-internal-linking-dry-run.md with: (a) summary stats — how many items would gain how many anchored-topic links, (b) a per-sector preview of 3 sample HTML snippets, (c) flag any item that maps to zero topics (those need editorial attention), (d) flag any item that maps to >5 topics (probably needs trimming). Do NOT modify the source pages. Orlando reviews the dry-run, then a follow-up task ships it.
```

**Verification:** dry-run doc has summary stats + sample HTML; orphan items (zero-topic) are listed; the follow-up task ships actual edits sector-by-sector.

---

## Task 2.10 — Internal linking pass: topics → items (verify the reverse)

**Why:** complete the cluster. Topic pages already list resources, but verify that EVERY item referenced in content.json is actually linked from at least one topic page; flag the orphans.

```
Read content.json. Extract every (topic, resource) pair. For each pair, verify the topic page at /v2/<topic-slug>/index.html actually contains a link to the resource at /<sector>/<resource-slug>/. Flag any pair where the link is missing — that's a content.json/page mismatch. Also flag any item page on disk (under books/, people/, orgs/, media/) that does NOT appear in content.json as a resource for any topic (those are orphan items). Write to ~/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/runs/2026-04-29-cluster-coverage.md with two sections: missing-links (topic mentions resource but page doesn't link) and orphan-items (resource on disk but no topic references it). Recommend whether each orphan should be (a) added to a topic, (b) merged into another item, or (c) removed.
```

**Verification:** doc lists ≤ 10 missing-links and ≤ 30 orphan-items; orphans are categorized for editorial follow-up.

---

## Task 2.11 — Mobile + accessibility check

**Why:** mobile UX is a ranking factor; accessibility is the right thing and also a ranking signal. Site is built mobile-first, but we haven't audited.

```
Run a mobile + a11y audit across 10 representative pages: index.html, about.html, podcast.html, v2/explore.html, v2/meditation/index.html, books/blink/index.html, people/carl-jung/index.html, orgs/findhorn-foundation/index.html, places/auroville/index.html, v2/courses/meditation-101/index.html. For each, check: (a) viewport meta correct, (b) text is at least 16px on mobile (find any computed font-size below 14px in the rendered CSS), (c) tap targets ≥ 48×48px (links and buttons), (d) color contrast meets WCAG AA (text vs background, especially the var(--text-dim) color #8FA8CC against var(--navy) #0B1C3D), (e) every <img> has alt or role="presentation", (f) every <button> and <a> has accessible text, (g) the main heading hierarchy is h1 → h2 → h3 with no jumps, (h) any form has labels. Use the design:accessibility-review skill if available. Write findings to ~/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/runs/2026-04-29-mobile-a11y.md with severity (critical/high/medium/low) per finding and suggested fixes.
```

**Verification:** doc has per-page findings; any critical findings open follow-up fix tasks.

---

## Task 2.12 — Performance/Core Web Vitals snapshot

**Why:** track the baseline so we know if we regress. The site is fast today; this is a guardrail.

```
For 10 representative pages (same list as task 2.11), call PageSpeed Insights API and capture: (a) Performance score, (b) Accessibility score, (c) Best Practices score, (d) SEO score, (e) LCP value, (f) CLS value, (g) INP/FID value, (h) TBT value, (i) the top 3 audit failures by impact. The PSI API endpoint: https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=<URL>&category=PERFORMANCE&category=ACCESSIBILITY&category=BEST_PRACTICES&category=SEO. Use mobile strategy by default. Write to ~/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/runs/2026-04-29-cwv-baseline.md with per-page scores, a summary table, and an "alerts" section calling out any LCP > 2.5s, CLS > 0.1, INP > 200ms. Re-run the same template at +30/+60/+90 days for trend.
```

**Verification:** doc has scores for 10 pages; alerts section is empty or tracked.

---

## Done definition for Phase 2

- [ ] BreadcrumbList schema on every item page (≥ 563 pages)
- [ ] Sitemap has real `lastmod` dates derived from git
- [ ] ItemList schema on all 7 sector index pages
- [ ] Article schema on all 146 topic pages with author + dateModified
- [ ] Organization schema on the homepage
- [ ] Top-level pages have per-page OG card briefs (and ideally cards generated)
- [ ] Per-item OG pipeline spec on disk; pipeline chosen and starting rollout
- [ ] Unsplash migration manifest written; legal review passed
- [ ] Internal linking dry-runs reviewed; ship rolling
- [ ] Cluster coverage audit complete; orphans triaged
- [ ] Mobile + a11y findings logged; critical fixes shipped
- [ ] Core Web Vitals baseline captured

After Phase 2, the technical layer is invisible to the reader and bullet-proof for crawlers and AI engines.
