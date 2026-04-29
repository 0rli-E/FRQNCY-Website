# CONTEXT — what every SEO agent needs to know about FRQNCY

Read this first. It's the three-minute primer that lets any agent ramp without re-discovering what FRQNCY is, who it's for, or how it talks.

## 1. What FRQNCY is, in one paragraph

FRQNCY is a topic graph for consciousness — a curated public library of 146 topics covering how money, energy, mind, and matter actually work, supported by 766+ vetted resources (books, people, organizations, podcasts, places, courses), structured around five pillars: Network State, Fund, Education, Research, and a fifth experiential pillar. It's not a content farm, not a community-voted aggregator, and not an algorithmic feed. Every entry is editorially curated. The free layer is permanent. Membership funds the free layer; it does not gate it. The site lives at `https://frqncy.network`.

## 2. Information architecture (you must understand this before touching anything)

```
/                          — homepage, hero + pillar grid + featured topics + chart calculator
/v2/explore.html           — the 146-topic discovery surface (the main entry to topic pages)
/v2/<topic-slug>/          — 146 topic pages (e.g., /v2/meditation/, /v2/conscious-capital/)
/v2/courses/               — 6 courses (intentionally separate from topics)
/v2/courses/<course-slug>/ — individual course pages with lesson lists
/v2/watch/                 — Watch library (skip; being worked on separately)
/v2/og/<slug>.png          — per-topic OG card (1200×630, generated)

/books/                    — 284 book pages
/people/                   — 89 people pages
/orgs/                     — 102 org pages
/media/                    — 74 media items (podcasts, blogs, journals, films)
/places/                   — 8 place pages (sanctuaries, retreat centers)
/aligned/                  — Aligned Goods landing (single page, curated products)
/membership/               — Membership offer (soft launch, mailto CTA until Stripe lands)

/podcast                   — The FRQNCY Podcast (separate top-level brand vehicle)
/about                     — Vision page
/start-here                — Onboarding entry
/space                     — Sanctuary network teaser
/chart                     — Personal chart calculator (anonymous works; logged-in syncs)
/search                    — Internal site search (search.html + search.json)

/social/                   — Social platform (skip; active dev)
/my-frqncy/                — Personalized dashboard (skip; active dev)
/app/                      — Capacitor mobile app (skip; active dev)
/music/                    — Music sector (skip; active dev as of 2026-04-28)
/frqncy-os/                — FRQNCY OS planning docs (skip; not for crawlers)

/sitemap.xml               — 757 url entries as of 2026-04-29
/robots.txt                — production-tuned; disallows /proposals/, /docs/, /scripts/, /CLAUDE.md, archives, and private routes
/content.json              — site content map (5836 lines; pillars, topics, taxonomy)
/search.json               — search index (built from content.json)
/manifest.json             — PWA manifest
/og-image.png              — generic site og image (used for top-level pages and any item without a per-page card)
```

The five pillars (in `content.json` under `pillars[]`):

- **Network State** (`#4A7AE8`) — sovereign community, physical and digital sanctuaries
- **Fund** (`#C4973A`) — capital allocation toward conscious-civilisation builders
- **Education** (`#7AAB7A`) — curated teachers, courses, wisdom traditions
- **Research** (`#7B4AE8`) — frontiers of science, philosophy, consciousness
- (read content.json for the fifth and any updates)

Every topic page is tagged with one or more pillars and shows the pillar accent in its hero eyebrow.

## 3. Audience — who is this for, in plain language

The reader is someone who already feels there's more to reality than the consensus offers and has the literacy to hold both rigor and reverence at once. They're across consciousness, philosophy, science, money, regenerative living, and contemplative practice without being captured by any single tribe. They're usually building something — a company, a practice, a piece of work — and they want primary sources, not summaries of summaries. They came in via Twitter, a podcast, or a friend who showed them a topic page. They're not on the site to be entertained; they're on it to learn or to plan.

What this means for SEO copy: never patronize, never sell, never use the spiritual cliches (no "unlock," no "vibrations" used as direct self-description, no "leverage," no "10x"), and always assume the reader can handle dense ideas if the prose carries them.

## 4. Voice rules (non-negotiable on any page that surfaces in search results or social cards)

- **Present-tense, declarative.** "FRQNCY is a topic graph" — not "FRQNCY aims to be" or "we believe FRQNCY can become."
- **Conviction, not hype.** Conviction is "this is the best book on the science of consciousness." Hype is "the ULTIMATE guide" or "you NEED to read this."
- **No spiritual cliches as self-description.** Internal pages can talk about consciousness, presence, wisdom — those are topics. Surfaces (homepage meta, social cards, top-level descriptions) can't lean on those words to describe the site itself; the surrounding context isn't there to earn them.
- **No "unlock," "leverage," "synergy," "10x," "circle back," "low-hanging fruit."** See `~/.frqncy-harness/voice-anchor.md` for the full ban list.
- **Cooperation over competition.** FRQNCY does not pitch itself as "the alternative to" anything. It points to what it's for.
- **No leaderboards, no follower counts, no engagement bait.** The product strategy is intentionally counter-engagement.
- **The picks are the work.** When in doubt, the curatorial layer is the thing being marketed — depth, taste, no paid placement, editorial standards.

The ban list and tone reference live at `~/.frqncy-harness/voice-anchor.md` (active during `evolve` runs as a banned-phrase gate). Treat the same words as banned in any SEO surface copy.

## 5. Page type taxonomy and current schema usage

Every page on FRQNCY belongs to exactly one of these page types. Schema.org @type per type as of 2026-04-29:

| Page type | URL pattern | Current JSON-LD @type |
| --- | --- | --- |
| Homepage | `/` | `WebSite` (with `SearchAction`) |
| Topic page | `/v2/<slug>/` | mostly absent (4 use `Article`); 142 of 146 unsclemaed |
| Course landing | `/v2/courses/` | (none — should be `ItemList` of Course) |
| Course | `/v2/courses/<slug>/` | `Course` (added 2026-04-29) |
| Book | `/books/<slug>/` | `Book` |
| Person | `/people/<slug>/` | `Person` |
| Org | `/orgs/<slug>/` | `Organization` |
| Media item (generic) | `/media/<slug>/` | `CreativeWork` |
| Media item (podcast) | `/media/<podcast-slug>/` | `PodcastSeries` (4 confirmed: bankless, huberman-lab, robots-podcast, the-minimalists) |
| Place | `/places/<slug>/` | `Place` |
| Sector index | `/<sector>/` | `WebSite` (each item also wraps in `isPartOf:WebSite`) |
| Membership | `/membership/` | (none — should add `Offer`/`Service` once Stripe lands) |
| Podcast brand vehicle | `/podcast` | `PodcastSeries` (with RSS feed) |
| Aligned goods | `/aligned/` | (none — should add `ItemList`) |

Conspicuously absent: `FAQPage`, `HowTo`, `BreadcrumbList`, `ItemList`. Adding these is a Phase 3/4 priority because they unlock rich-result eligibility.

## 6. Content shape conventions

Every well-formed item page (book / person / media / org / place) follows the same pattern:

```
<head>
  <title>{Item} — FRQNCY Network</title>
  <meta name="description" content="..."> (1-2 sentences, present-tense, conviction)
  <link rel="canonical" href="https://frqncy.network/{sector}/{slug}/">
  <meta property="og:type" content="website">
  <meta property="og:image" content="https://frqncy.network/og-image.png">  <!-- generic placeholder; per-item cards are a known gap -->
  <script type="application/ld+json">{ ... item schema ... }</script>
</head>
<body>
  <nav.snav>  <!-- breadcrumb to /<sector>/, sector cross-nav, ← Main -->
  <section.hero>  <!-- h1, eyebrow, description -->
  <main>
    <section.section-label>  <!-- e.g. "Why this matters" / "Resources" / "Story" -->
    ...
  </main>
  <footer>  <!-- standard FRQNCY footer with links to /aligned, /space, /about -->
</body>
```

The ✦ FRQNCY PICK badge marks editorial picks; it appears next to resource entries on topic and book pages.

## 7. The chrome (don't break it when editing)

Every topic page imports `/v2/_chrome/topic-base.css` and one of the treatment overlays in `/v2/_chrome/treatments/` (`monastic.css`, etc.). Item pages in books / people / etc. inline their CSS per page. The shared widgets are:

- `nav.snav` — top nav bar with breadcrumb + sector links + ← Main
- `chat-widget.js` — Word Illuminator chat bubble (FRQNCY's grounded chat)
- `mobile-nav.js` — mobile burger menu
- Plausible analytics tag (`https://plausible.io/js/script.js` with `data-domain="frqncy.network"`)

Don't strip these in the name of "cleanup."

## 8. Active workstreams (don't step on these)

As of 2026-04-29, parallel workstreams are active in:

- `social/` — auth, posts, DMs, profile uploads (per `HANDOFF-2026-04-28-MAKE-EVERYTHING-LIVE.md`)
- `my-frqncy/` — Sanctuary dashboard, charts, dreambuilding
- `app/` — Capacitor mobile app
- `music/` — music sector pages (10 items, modified within last 24h)
- `frqncy-os/` — internal planning (do not crawl, robots disallow not yet — verify)

Topic pages (`v2/<slug>/`) and `v2/watch/` are also being iterated on but at a slower cadence — coordinate before touching them.

## 9. Where things live for the SEO program specifically

```
audits/seo/                       — this folder; the SEO source of truth
audits/seo/runs/<YYYY-MM-DD>...md — every agent fix-run writes its log here
sitemap.xml                       — 757 entries as of 2026-04-29
robots.txt                        — well-tuned; only edit per Phase 2 prompts
v2/og/                            — per-topic OG cards (167 PNGs)
content.json                      — pillars, topics, taxonomy
search.json                       — site search index
```

## 10. Tools and connectors

- **Plausible** is wired (`plausible.io/js/script.js` deferred on every page). Privacy-respecting, GDPR-fine, no cookie banner needed. Use Plausible for the organic-traffic baseline.
- **Cloudflare Pages** hosts the site (per HANDOFF doc).
- **Supabase** powers `social/`, `my-frqncy/`, the `subscribers` table, and the `charts` table.
- **No Google Search Console hookup yet** — Phase 1 includes adding the verification record and submitting the sitemap.
- **No Bing Webmaster** — same, do it in Phase 1.
- **No Ahrefs/Semrush/Moz** — Phase 1 docs propose connecting one (Ahrefs cheapest credible at $99/mo; or stay manual via web search + GSC).
- **MCP server `frqncy-content`** lives at `mcp-servers/frqncy-content/` in this repo and serves the 146 topics + 766 resources to any harness agent. This is also leverage for AI discoverability — see Phase 4.

That's the primer. Read CURRENT-STATE.md next for the honest baseline, then SEO-PLAYBOOK.md for the strategy.
