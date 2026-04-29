# Session Summary — 2026-04-29 — Non-Topic Sector Audit + Fix Pass

Scope: every published sector except topics, watch, and the active-development zone (social, my-frqncy, app, music, frqncy-os, harness-proposals).

Sectors covered: places (8), v2/courses (6), membership (1), books (284), people (89), media (74), orgs (102). Plus sitemap.xml.

## What was fixed

### v2/courses — Course JSON-LD added to all 6 courses

Every course now has a schema.org `Course` block with name, description, url, provider (FRQNCY Network), educationalLevel, inLanguage, isAccessibleForFree, numberOfLessons, and timeRequired (ISO 8601 duration computed from per-lesson durations).

| Course | Lessons | Duration | Level |
| --- | --- | --- | --- |
| conscious-living-foundations | 5 | PT1H15M | beginner |
| crypto-fundamentals | 6 | PT2H5M | intermediate |
| meditation-101 | 5 | PT53M | beginner |
| quantum-grammar | 5 | PT2H15M | advanced |
| quantum-reality | 4 | PT1H36M | advanced |
| working-with-claude | 5 | PT1H | beginner |

Why this matters: Google indexes Course schema for the Courses search panel; without it the courses are invisible to that surface.

### media — 4 podcasts upgraded from CreativeWork to PodcastSeries

`bankless`, `huberman-lab`, `robots-podcast`, `the-minimalists` were all using a generic `CreativeWork` schema. Upgraded to `PodcastSeries` (a real schema.org type that gets podcast-specific search treatment). All other JSON-LD fields preserved.

### sitemap.xml — 15 entries added, all sectors now 100% covered

| Sector | Was | Added | Now |
| --- | --- | --- | --- |
| places | 1 of 8 | 7 | 8 of 8 |
| v2/courses | 0 | 7 (index + 6 courses) | full |
| membership | 0 | 1 | 1 |

Total entries: 742 → 757. XML validated.

## What was audited (no fix needed)

### places (8 pages) — all clean
JSON-LD `Place` schema, canonical, breadcrumb, og tags, h1, description meta — all present on all 8 pages. The breadcrumb-missing finding from the first scan was a false positive (different href pattern).

### membership — no Substack regression
The page uses a `mailto:hello@frqncy.network` CTA, intentionally — Stripe wiring lands in Phase 3 of the 90-day plan. No fire-and-forget Substack form. No fix needed.

### books / people / media / orgs — basic hygiene 100% green
For all 549 pages combined:
- 0 missing canonical, 0 wrong canonical
- 0 missing JSON-LD
- 0 missing og:image meta tag
- 0 missing breadcrumb
- 0 missing h1
- 0 missing description meta
- 0 missing html lang attribute
- 0 broken breadcrumb targets (all `../index.html` resolve)
- JSON-LD types are correct: books → Book, people → Person, orgs → Organization, media → CreativeWork (with the 4 podcasts now PodcastSeries)

## What was found but NOT fixed (scope/cost)

### Every page uses the same generic og:image placeholder

All 549 pages across books / people / media / orgs reference `https://frqncy.network/og-image.png` for both `og:image` and `twitter:image`. When any FRQNCY page is shared on Twitter, LinkedIn, Slack, or iMessage, the preview will look identical regardless of which book or person was shared. This is a **real SEO and social-sharing weakness** but fixing it is meaningful work:

- Books pages have **no embedded images at all** — no `<img>` tags, no `background-image` URLs. There's no source to pull a unique og:image from on-page.
- The fix path is one of:
  1. Generate per-item OG cards (1200×630 PNG) from item metadata (title, author/role, sector, hex accent) — about 549 images at ~50KB each ≈ 27MB
  2. Pull cover thumbs from external sources (Amazon/Google Books for books, Wikipedia for people, podcast art for media, logos for orgs) — license/freshness concerns
  3. Build a single `og-image-generator` Cloudflare Worker that synthesizes per-URL og cards on demand

Recommended: option 1 (generate-and-commit) for books and people, option 2 for podcasts where the show art is canonical, option 3 if you want to stop thinking about it.

This is the highest-leverage SEO improvement available across the non-topic sectors. Not done in this session because it requires either an image-generation pipeline or external image fetching at scale.

### books pages have no images at all
Probably intentional minimalism in the design, but worth noting: no cover image means no visual signal in search results, social cards, or the book-listing index. If a future direction involves adding cover art, it's also the og:image fix.

## What I didn't do (would benefit from flash)

- **Per-item og:image generation.** Not in scope for a single Claude session. Hand to flash with a generator script or a Cloudflare Worker spec.
- **Author normalization across books.** Spot-checked but didn't run a full pass on every book page to confirm "Author Name" formatting is consistent.
- **"FRQNCY PICK" badge consistency.** Some books / media pages have `✦ FRQNCY PICK` badges; didn't audit whether the criteria for awarding the badge are applied consistently.
- **Reading-time estimate per page.** Useful UX addition but adds a feature rather than fixing a bug.
- **External link health on all sector pages.** The existing `link-audit.md` (2026-04-16) covered topic pages; same sweep across books / media / orgs is worth doing — many of the cited sources are vendor pages that may have moved.

## Files modified

```
v2/courses/conscious-living-foundations/index.html  (+1 jsonld block)
v2/courses/crypto-fundamentals/index.html           (+1 jsonld block)
v2/courses/meditation-101/index.html                (+1 jsonld block)
v2/courses/quantum-grammar/index.html               (+1 jsonld block)
v2/courses/quantum-reality/index.html               (+1 jsonld block)
v2/courses/working-with-claude/index.html           (+1 jsonld block)
media/bankless/index.html                           (CreativeWork → PodcastSeries)
media/huberman-lab/index.html                       (CreativeWork → PodcastSeries)
media/robots-podcast/index.html                     (CreativeWork → PodcastSeries)
media/the-minimalists/index.html                    (CreativeWork → PodcastSeries)
sitemap.xml                                         (+15 entries; 742 → 757)
audits/big-sector-audit.md                          (new)
audits/big-sector-audit-deep.md                     (new)
audits/SESSION-SUMMARY-2026-04-29.md                (new — this file)
```

## Suggested next agent run

Verify on the live site after deploy:
1. `curl -s https://frqncy.network/sitemap.xml | grep -c '<url>'` should show 757
2. Run a Google Rich Results test on `https://frqncy.network/v2/courses/meditation-101/` — should detect the Course schema
3. Run the same on `https://frqncy.network/media/huberman-lab/` — should detect PodcastSeries
4. Hand the og:image gap to flash with a per-sector image-generation prompt; that's the next-biggest SEO unlock available.
