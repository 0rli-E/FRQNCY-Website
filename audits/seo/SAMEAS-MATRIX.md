# SAMEAS Matrix — FRQNCY Network cross-platform identity

**Purpose.** Single source of truth for FRQNCY Network's identity surface across the major platforms. Feeds the homepage `Organization` JSON-LD's `sameAs[]` array and the `/people/orlando/` Person schema's `sameAs[]`. Google's entity-resolution algorithm fuses references across platforms; consistency here decides whether FRQNCY-the-network gets its own Knowledge Graph card or collapses into FRQNCY Media's.

**Cadence.** Re-verify every quarter (next pass: 2026-08-13). Update the canonical sameAs JSON block at the bottom whenever a verified profile lands or a contested one is resolved. Treat the "Last verified" column like a freshness gauge — if it's older than 90 days, re-run the WebSearch on that row before trusting it.

**Brand-collision reality.** The name FRQNCY is contested by at least seven external entities. Every bio on every platform must qualify with "FRQNCY Network" or "the topic graph for consciousness" to avoid Google entity fusion with the wrong FRQNCY. See `MENTION-MONITORING.md` for the full collision landscape. Updated collisions discovered during this audit:

- FRQNCY Media (frqncy.media, Atlanta, Michelle Khouri, 2018) — dominant SERP entity
- FRQNCY Media Group / FMG (fmgnetworks.com, Jody Colvard, 2004) — operates The FRQNCY Podcast on Spotify and Apple Podcasts; this is the biggest podcast-platform collision
- FRQNCY (frqncy.com) — separate brand
- FRQNCY Performance (Islip, NY) — fitness brand
- FRQNCY Recording Studios (Aaron Bucktawor)
- Frequency Holdings (OTC:FRQN) — publicly traded fintech
- **NEW:** @FRQNCY_live (Pickathon livestreaming, Oregon)
- **NEW:** @FRQNCYSA (clothing / lifestyle brand)
- **NEW:** @FRQNCY_shop, @frqncyofficial (additional X handles)
- **NEW:** "FRQNCY - Topic" on YouTube (UCg7qlHd579xMoFIRnUXQ2Ag) — auto-generated channel for a music artist named FRQNCY

The competitive density on the bare term "FRQNCY" is now severe enough that the **canonical brand handle should be `frqncy_network` (or close variants like `frqncy-network`) anywhere it's available** — handles without the qualifier are mostly already claimed and will misattribute.

---

## How to read this matrix

| Column | Meaning |
| --- | --- |
| Platform | The surface being audited |
| Handle | What we use (or recommend) on that platform |
| URL | The canonical link (or the recommended one if not yet created) |
| Status | `live` = verified-ours · `not-yet-created` = vacant · `contested` = name taken by a collision · `declined` = decided against · `unverified` = not yet checked |
| Bio match | Does the on-platform description match FRQNCY voice + the canonical description? `yes` / `no` / `partial` / `n/a` |
| Backlink | Does the profile link to frqncy.network? `yes` / `no` / `n/a` |
| Collision risk | High / Med / Low — likelihood of confusion with a competing FRQNCY entity |
| Priority | High / Med / Low — how urgent it is to fix |
| Last verified | YYYY-MM-DD of the WebSearch check that produced the row |

---

## Platform matrix (2026-05-13)

| Platform | Handle | URL | Status | Bio match | Backlink | Collision risk | Priority | Last verified |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **X / Twitter — brand** | `@frqncy_network` *(recommended)* | https://twitter.com/frqncy_network | `not-yet-created` | n/a | n/a | High (multiple FRQNCY handles exist) | **High** | 2026-05-13 |
| **X / Twitter — founder** | `@0xOrli` | https://x.com/0xorli | `live` | partial (bio reads "Shining light in the darkness" — not aligned with founder framing) | yes (links to frqncy.substack.com, not frqncy.network) | Low | **High** | 2026-05-13 |
| **LinkedIn — company** | `frqncy-network` *(recommended)* | https://linkedin.com/company/frqncy-network | `not-yet-created` | n/a | n/a | High (FRQNCY Media Co. + FRQNCY Media Group already on LinkedIn) | **High** | 2026-05-13 |
| **LinkedIn — founder** | (Orlando's handle, TBD) | (not yet found in WebSearch) | `unverified` | n/a | n/a | Low | **High** | 2026-05-13 |
| **Crunchbase** | `frqncy-network` *(recommended)* | https://crunchbase.com/organization/frqncy-network | `not-yet-created` | n/a | n/a | High (FRQNCY Media has an established Crunchbase entry) | High | 2026-05-13 |
| **AngelList / Wellfound** | `frqncy-network` *(recommended)* | https://wellfound.com/company/frqncy-network | `not-yet-created` | n/a | n/a | Med | Med | 2026-05-13 |
| **GitHub — org** | `frqncy-network` *(recommended)* | https://github.com/frqncy-network | `not-yet-created` | n/a | n/a | Low | Med | 2026-05-13 |
| **GitHub — user (Orlando)** | `0rli-E` | https://github.com/0rli-E | `unverified` (referenced in primary-source dossier; not surfaced in WebSearch — likely exists but not crawled) | n/a | n/a | Low | Med | 2026-05-13 |
| **YouTube — brand** | `@frqncynetwork` *(recommended)* | https://youtube.com/@frqncynetwork | `not-yet-created` | n/a | n/a | High (FRQNCY Media channel + FRQNCY-Topic auto channel) | Med | 2026-05-13 |
| **Spotify — podcast** | "The FRQNCY Podcast" | TBD | `contested` | n/a | n/a | **Critical** — `open.spotify.com/show/0C28UK2c4HxCwws5fDAsCN` is taken by FMG's "FRQNCY" podcast (Jody Colvard) | **High** | 2026-05-13 |
| **Apple Podcasts — podcast** | "The FRQNCY Podcast" | TBD | `contested` | n/a | n/a | **Critical** — Apple Podcasts ID 1850012424 is FMG's | **High** | 2026-05-13 |
| **Substack** | `frqncy` | https://frqncy.substack.com | `live` (Orlando's; last public post Dec 2023; "Daily Crypto Update") | partial (current content is crypto-flavoured; doesn't reflect the topic-graph mission) | yes (Substack itself is the destination; needs reverse-link to frqncy.network in About) | Low | **High** | 2026-05-13 |
| **Mastodon** | `@frqncy_network@mastodon.social` *(recommended)* | https://mastodon.social/@frqncy_network | `not-yet-created` | n/a | n/a | Low | Low | 2026-05-13 |
| **Bluesky** | `frqncy.network` *(custom domain — recommended)* | https://bsky.app/profile/frqncy.network | `not-yet-created` | n/a | n/a | Low | Med | 2026-05-13 |
| **Threads** | `@frqncy.network` *(recommended)* | https://threads.net/@frqncy.network | `not-yet-created` | n/a | n/a | Low | Low | 2026-05-13 |
| **Facebook Page** | `frqncy.network` *(recommended)* | https://facebook.com/frqncy.network | `not-yet-created` | n/a | n/a | Med | Low | 2026-05-13 |
| **Instagram** | `@frqncy.network` *(recommended)* | https://instagram.com/frqncy.network | `not-yet-created` | n/a | n/a | High (FRQNCY Media has an IG presence; FRQNCYSA brand also exists) | Low | 2026-05-13 |
| **Telegram channel** | `@frqncy_network` | https://t.me/frqncy_network | `unverified` (referenced in VISIBILITY-PLAN and TELEGRAM-CHANNEL-LAUNCH proposal; not surfaced in WebSearch — likely set up or about to be) | n/a | n/a | Low | High | 2026-05-13 |
| **Wikidata** | TBD (Q-number pending) | n/a | `not-yet-created` (briefs ready per Phase 4.5) | n/a | n/a | n/a | **High** | 2026-05-13 |
| **Wikipedia** | n/a | n/a | `declined` (notability not yet met per Phase 5.1 dossier) | n/a | n/a | n/a | Low (revisit Q3 2026) | 2026-05-13 |

**Coverage today:** 2 of 20 platforms are verified-live (Substack, @0xOrli). 1 is unverified-but-likely-live (Telegram, GitHub-user). 2 are critically contested (Spotify, Apple Podcasts — by FMG's actual FRQNCY podcast). 15 of 20 are vacant and need claiming.

Phase 5.3 verification target is ≥ 80% platform coverage. Current coverage is ~10%. The gap is the work.

---

## Per-platform setup briefs

The order below is priority order — claim handles top-down. Each brief includes the canonical handle to claim, the bio text in two lengths, the recommended profile photo source, the link target, and the cross-references to set up after creation.

### 1. X / Twitter — @frqncy_network (BRAND)

**Status:** `not-yet-created` · **Priority:** High · **Why it's first:** The homepage Organization schema already claims `https://twitter.com/frqncy_network` as a sameAs URL. Until the handle is claimed, the schema points at a vacancy and Google's entity score collapses on this row.

- **Canonical handle:** `@frqncy_network`
- **Display name:** FRQNCY Network
- **Bio (160 char):** *Topic graph for consciousness — 146 curated maps of how money, energy, mind, and matter actually work. 766+ vetted resources. Founded 2024 by @0xOrli.*  (157 chars)
- **Profile photo:** Use the FRQNCY favicon SVG (`https://frqncy.network/favicon.svg`) rendered as a 400×400 PNG at #1A1A1A background, or the wordmark on the same background. Keep it identical across every platform — entity-resolution rewards image consistency.
- **Header image:** Pull a 1500×500 strip from the index hero or the chart-calculator visual.
- **Link in bio:** `https://frqncy.network/`
- **Location:** "Worldwide" (matches the Organization schema `areaServed`).
- **Cross-references to set up after creation:**
  - Pin a tweet that links to `/about` with the 160-char description.
  - Add the new handle to the Wikidata Entity 1 statements (P2002 Twitter username).
  - Verify the `index.html` Organization sameAs URL still resolves (no change needed if @frqncy_network is the chosen canonical handle; see the handle-decision brief at `audits/seo/runs/2026-05-13-phase-5.3-handle-decision.md` if revising).

### 2. X / Twitter — @0xOrli (FOUNDER)

**Status:** `live` · **Priority:** High (bio rewrite + link target update) · **Why it matters:** This is the only actively-posting FRQNCY-adjacent X handle. Display name is currently "Orlando.FRQNCY" — strong founder-brand link, but bio reads as personal-spiritual and links to frqncy.substack.com instead of frqncy.network. Both should be updated.

- **Display name:** Orlando Eisenreich · FRQNCY *(or keep "Orlando.FRQNCY" — both work, but the full-name version is what gets indexed by Google for the Person entity)*
- **Bio (160 char):** *Building FRQNCY Network — the topic graph for consciousness. 146 topics, 766+ vetted resources, editorial standards published.*  (138 chars)
- **Alternative bio (160 char, more personal):** *Founder, FRQNCY Network — the topic graph for consciousness. Curation, agents, network states. Writing the editorial standards as I go.*  (152 chars)
- **Profile photo:** Keep current if recognisable; otherwise the same headshot used on `/people/orlando/`.
- **Link in bio:** `https://frqncy.network/people/orlando/` (NOT frqncy.substack.com — Substack is one surface; the founder page is the canonical entity ID).
- **Cross-references:**
  - Update the `/people/orlando/` Person schema's `sameAs[]` to include `https://x.com/0xorli`.
  - Add a pinned tweet linking to `/about` or the latest network-state essay.

### 3. LinkedIn — Company Page for FRQNCY Network

**Status:** `not-yet-created` · **Priority:** High · **Why it matters:** LinkedIn is the third-highest-trust signal in Google's Knowledge Graph for organizations (after Wikipedia and the official site). FRQNCY Media and FRQNCY Media Group are both already on LinkedIn — without a competing entity, every B2B search for "FRQNCY" lands on them.

- **Canonical handle:** `frqncy-network` (URL slug: `linkedin.com/company/frqncy-network`)
- **Display name:** FRQNCY Network
- **Tagline (220 char):** *Topic graph for consciousness. 146 curated maps of how money, energy, mind, and matter actually work, supported by 766+ vetted resources across books, people, organizations, podcasts, places, and courses.*  (218 chars)
- **About (500 char):** *FRQNCY Network is a topic graph for consciousness — a curated public library of 146 topics covering how money, energy, mind, and matter actually work, supported by 766+ vetted resources. Built on five pillars: Network State, Fund, Education, Research, and a fifth experiential pillar. Every entry is editorially curated. The free layer is permanent. Membership funds the free layer; it does not gate it. Founded 2024 by Orlando Eisenreich. Editorial standards published at frqncy.network/editorial-standards/.*  (498 chars)
- **Industry:** Media Production / Online Media
- **Company size:** 1-10
- **Headquarters:** "Worldwide" (LinkedIn requires a city — pick Orlando's primary city; can be edited later)
- **Founded:** 2024
- **Specialties (tags):** consciousness, curation, network states, conscious capital, contemplative practice, regenerative living, philosophy, editorial publishing
- **Website:** `https://frqncy.network/`
- **Profile photo:** FRQNCY wordmark on #1A1A1A background, 400×400.
- **Banner image:** Same hero crop used on X.
- **Cross-references:**
  - Orlando's LinkedIn personal profile lists "Founder, FRQNCY Network" as current role linked to this page.
  - Add `https://linkedin.com/company/frqncy-network` to the homepage Organization sameAs array.
  - First post: link to `/about` with the 220-char tagline.

### 4. LinkedIn — Founder Page for Orlando Eisenreich

**Status:** `unverified` · **Priority:** High (find or create + align) · **Why it matters:** B2B reach for founder-style posts; second-largest pool of conscious-capital readership outside X.

- **Headline (220 char):** *Founder, FRQNCY Network — the topic graph for consciousness. Builds curation systems, agent infrastructure, and editorial standards. 146 topics. 766+ vetted resources.*  (171 chars)
- **About (500 char):** *I build FRQNCY Network — a topic graph for consciousness covering 146 subjects across money, energy, mind, and matter. The work sits at the intersection of curation, agent infrastructure, network states, and editorial standards. The free layer is permanent. Membership funds the free layer; it does not gate it. Writing the editorial standards in public at frqncy.network/editorial-standards/.*  (391 chars)
- **Profile photo:** Same headshot as `/people/orlando/`.
- **Featured section:** Pin links to `/about`, `/editorial-standards/`, and the latest deep essay.
- **Cross-references:**
  - Update `/people/orlando/` Person schema's `sameAs[]` to include the LinkedIn URL once confirmed.
  - Add to Wikidata Entity 3 (Orlando Eisenreich) under `LinkedIn ID` (P6634).

### 5. Crunchbase — Company Profile

**Status:** `not-yet-created` · **Priority:** High · **Why it matters:** Wikidata briefs (Phase 4.5) call for a Crunchbase entry as a structured-data citation. Crunchbase entries also surface in Knowledge Graph for company queries. FRQNCY Media's existing entry will keep dominating "FRQNCY" until FRQNCY Network has its own.

- **Company name:** FRQNCY Network
- **About (1000 char):** *FRQNCY Network is a topic graph for consciousness — a curated public library of 146 topics covering how money, energy, mind, and matter actually work, supported by 766+ vetted resources spanning books, people, organizations, podcasts, places, and courses. Structured around five pillars: Network State, Fund, Education, Research, and a fifth experiential pillar. Every entry is editorially curated by founder Orlando Eisenreich; editorial standards are published at frqncy.network/editorial-standards/. The free layer is permanent. Membership funds the free layer; it does not gate it. Distinct from FRQNCY Media (Atlanta podcast studio) and FRQNCY Media Group (FMG conscious-media network). Founded 2024.*  (745 chars — leaves room for additions)
- **Founded date:** 2024
- **Founders:** Orlando Eisenreich
- **Headquarters:** Worldwide
- **Industries:** Media, Information Services, Online Publishing, Curation
- **Website:** `https://frqncy.network/`
- **Social links:** X (@frqncy_network once live), LinkedIn (once live), GitHub (`github.com/0rli-E/frqncy-network`)
- **Cross-references:**
  - Add Crunchbase URL to homepage Organization sameAs.
  - Add Crunchbase ID to Wikidata Entity 1 (property P2088).

### 6. AngelList / Wellfound — Startup Profile

**Status:** `not-yet-created` · **Priority:** Med · **Why it matters:** Adds a structured-data citation; useful if FRQNCY ever raises capital or hires; secondary backlink.

Same content as Crunchbase, condensed to Wellfound's slot-based fields. Optional until hiring or raising starts.

### 7. GitHub — frqncy-network organisation

**Status:** `not-yet-created` · **Priority:** Med · **Why it matters:** The homepage references the harness MCP server; a public org makes the open-source surface coherent and acts as a Wikidata `archives at` (P485) target.

- **Org handle:** `frqncy-network`
- **Display name:** FRQNCY Network
- **Description (200 char):** *Topic graph for consciousness. Public repos for the MCP server, content schemas, and editorial tooling. frqncy.network — 146 topics, 766+ vetted resources.*  (160 chars)
- **Website:** `https://frqncy.network/`
- **Cross-references:**
  - Add `https://github.com/frqncy-network` to homepage Organization sameAs.
  - Migrate or fork `frqncy-content` MCP server repo into the org for institutional ownership.

### 8. Spotify — The FRQNCY Podcast (CONTESTED)

**Status:** `contested` · **Priority:** High · **Why critical:** `open.spotify.com/show/0C28UK2c4HxCwws5fDAsCN` is already taken by Jody Colvard's "FRQNCY" podcast (FMG). Publishing under the bare name "FRQNCY" or "FRQNCY Podcast" will trigger search-result fusion with FMG's show. Two options:

1. **Recommended — publish as "The FRQNCY Network Podcast"** to give Spotify a distinct title to index. The host (`frqncy.network/podcast`) stays the same, the RSS feed `<itunes:title>` and `<title>` use the qualified form.
2. **Alternative — publish as "FRQNCY: The Topic Graph"** if "Network Podcast" feels heavy.

- **Description (1000 char):** *The FRQNCY Network Podcast — long-form conversations with the teachers, builders, researchers, and healers working at the frontier of consciousness, science, money, and human potential. Hosted by Orlando Eisenreich, founder of FRQNCY Network (frqncy.network) — a topic graph for consciousness covering 146 subjects across money, energy, mind, and matter. Every episode maps to one of the 146 topics on the network. Distinct from FRQNCY Media (Atlanta podcast studio) and the FRQNCY podcast by Jody Colvard.*  (516 chars)
- **Cover art:** Square, 3000×3000, FRQNCY wordmark on dark background. Different from FMG's cover to avoid visual collision.
- **Submission:** Spotify for Podcasters → set canonical RSS to `https://frqncy.network/podcast.rss` (when feed is live).
- **Cross-references:**
  - Add Spotify show URL to PodcastSeries JSON-LD on `/podcast`.
  - Submit to Apple Podcasts with the same qualified title.
  - Add to Wikidata Entity 2 (The FRQNCY Podcast).

### 9. Apple Podcasts — The FRQNCY Network Podcast (CONTESTED — same as Spotify)

Same brief as Spotify §8. Submit via Apple Podcasts Connect with the qualified title to avoid being merged into FMG's listing.

### 10. Substack — frqncy.substack.com

**Status:** `live` · **Priority:** High (re-align content + bio) · **Why it matters:** This is one of only two verified-live FRQNCY surfaces. Currently positioned as crypto-update territory under Orlando's name (last post Dec 2023). For the SAMEAS strategy to work, the Substack needs to either become the FRQNCY-Network publication or get clearly handed off as Orlando's personal blog.

**Recommended option — re-position as the FRQNCY Network publication:**

- **Publication name:** FRQNCY Network
- **Subtitle (220 char):** *Long-form essays from the topic graph for consciousness. 146 maps of how money, energy, mind, and matter actually work — read in depth.*  (138 chars)
- **About (500 char):** *FRQNCY Network is a topic graph for consciousness — a curated public library of 146 topics covering how money, energy, mind, and matter actually work, supported by 766+ vetted resources. This Substack publishes the long-form essays — manifesto entries, editorial briefs, network-state thinking, and reading lists. The full library lives at frqncy.network. Membership funds the free layer; it does not gate it.*  (398 chars)
- **Custom domain:** Optional — `essays.frqncy.network` or keep `frqncy.substack.com`.
- **Profile photo:** FRQNCY wordmark.
- **Cross-references:**
  - Update `@0xOrli` X bio link from `frqncy.substack.com` to `frqncy.network/people/orlando/`.
  - Add Substack URL to homepage Organization sameAs.
  - Update homepage VISIBILITY-PLAN owned-channels table once the re-positioning is committed.

### 11. Mastodon — @frqncy_network@mastodon.social

**Status:** `not-yet-created` · **Priority:** Low · **Why it's still worth doing:** Fediverse signals matter for AI-engine crawl coverage (Perplexity and Anthropic both crawl Mastodon). Cheap claim, low maintenance.

- **Handle:** `@frqncy_network` on mastodon.social (or a topic-aligned instance like `mas.to`)
- **Display name:** FRQNCY Network
- **Bio (500 char limit):** *Topic graph for consciousness — 146 curated maps of how money, energy, mind, and matter actually work, supported by 766+ vetted resources. Founded 2024 by Orlando Eisenreich. Editorial standards published. frqncy.network*  (228 chars)
- **Link in bio:** `https://frqncy.network/`
- **Cross-references:** Add to homepage Organization sameAs.

### 12. Bluesky — frqncy.network (custom-domain handle)

**Status:** `not-yet-created` · **Priority:** Med · **Why it's worth doing:** Bluesky's `did:web` handles via custom domains create a strong verification signal — `@frqncy.network` on Bluesky resolved to frqncy.network DNS is a clean entity link. Indexed by AI engines.

- **Handle:** `frqncy.network` (custom-domain verified)
- **Display name:** FRQNCY Network
- **Bio (256 char limit):** *Topic graph for consciousness — 146 maps of how money, energy, mind, and matter actually work. 766+ vetted resources. Editorial standards published.*  (153 chars)
- **Setup steps:**
  - Sign up at bsky.app with any temporary handle.
  - Go to Settings → Advanced → Change Handle → "I have my own domain".
  - Add the prompted TXT record to frqncy.network's DNS (Cloudflare).
  - Verify; handle becomes `@frqncy.network`.
- **Cross-references:** Add Bluesky profile URL to homepage Organization sameAs.

### 13. Threads — @frqncy.network

**Status:** `not-yet-created` · **Priority:** Low · **Why:** Largely Instagram-tied; low signal for FRQNCY's audience but cheap claim.

- **Handle:** `@frqncy.network` (mirror of Instagram once claimed)
- **Display name:** FRQNCY Network
- **Bio (150 char):** *Topic graph for consciousness. 146 maps of how money, energy, mind, and matter actually work. 766+ vetted resources.*  (118 chars)
- **Link:** `https://frqncy.network/`

### 14. Facebook Page — frqncy.network

**Status:** `not-yet-created` · **Priority:** Low · **Why:** Google still weights Facebook Pages for the Knowledge Graph card. Low-effort claim.

- **Page name:** FRQNCY Network
- **Category:** Information & Media → Media/News Company
- **About (255 char):** *Topic graph for consciousness — 146 curated maps of how money, energy, mind, and matter actually work, supported by 766+ vetted resources. The free layer is permanent. Founded 2024 by Orlando Eisenreich. frqncy.network*  (224 chars)

### 15. Instagram — @frqncy.network

**Status:** `not-yet-created` · **Priority:** Low · **Why:** Two existing FRQNCY entities (Media + FRQNCYSA) have strong IG presence; rank collision is high. Skippable until visual content strategy lands.

- **Handle:** `@frqncy.network` (with the dot to keep it readable)
- **Bio (150 char):** *Topic graph for consciousness. 146 maps. 766+ vetted resources. The free layer is permanent. — frqncy.network*  (113 chars)
- **Link:** `https://frqncy.network/`

### 16. Telegram — @frqncy_network

**Status:** `unverified` · **Priority:** High (per VISIBILITY-PLAN Days 1-30) · **Why:** Already in the visibility plan and `proposals/TELEGRAM-CHANNEL-LAUNCH.md`. Confirm the handle is registered and the description matches the canonical bio.

- **Handle:** `@frqncy_network`
- **Channel name:** FRQNCY Network
- **Description (255 char Telegram limit):** *Topic graph for consciousness — 146 curated maps of how money, energy, mind, and matter actually work, supported by 766+ vetted resources. New drops Tue/Thu/Sat. The free layer is permanent. frqncy.network*  (208 chars)
- **Cross-references:** Add `https://t.me/frqncy_network` to homepage Organization sameAs once confirmed live.

### 17. Wikidata — entity Q-numbers (THREE: Network, Podcast, Orlando)

**Status:** `not-yet-created` · **Priority:** High · **Path:** Per Phase 4.5 briefs (`audits/seo/runs/2026-04-29-phase-4.5-knowledge-graph-briefs.md`). Submit to wikidata.org/wiki/Special:NewItem; capture Q-numbers; update Organization JSON-LD's `identifier` property and `sameAs[]` array.

### 18. Wikipedia — entity articles (DEFERRED)

**Status:** `declined` for now · **Priority:** Low until notability lands · **Path:** Per Phase 5.1 dossier (`audits/seo/runs/2026-05-13-phase-5.1-wikipedia-notability-dossier.md`). Re-evaluate Q3 2026.

---

## Canonical sameAs JSON array

The two blocks below are the copy-paste-ready arrays that should land in (a) the homepage Organization JSON-LD and (b) the `/people/orlando/` Person JSON-LD. **Until each URL is verified-live, leave it commented out** — claiming `sameAs` for a non-existent profile is a soft-inaccuracy that hurts the entity score (per the Phase 5.10 baseline finding that triggered this whole task).

### Homepage Organization sameAs (in `index.html`)

Drop-in v2 ready (uncomment lines as profiles go live):

```json
"sameAs": [
  "https://twitter.com/frqncy_network",
  "https://x.com/frqncy_network",
  "https://frqncy.substack.com",
  "https://t.me/frqncy_network"
  // Uncomment as each lands:
  // "https://linkedin.com/company/frqncy-network",
  // "https://crunchbase.com/organization/frqncy-network",
  // "https://wellfound.com/company/frqncy-network",
  // "https://github.com/frqncy-network",
  // "https://www.youtube.com/@frqncynetwork",
  // "https://open.spotify.com/show/<show-id>",
  // "https://podcasts.apple.com/us/podcast/the-frqncy-network-podcast/id<id>",
  // "https://mastodon.social/@frqncy_network",
  // "https://bsky.app/profile/frqncy.network",
  // "https://www.threads.net/@frqncy.network",
  // "https://www.facebook.com/frqncy.network",
  // "https://www.instagram.com/frqncy.network",
  // "https://www.wikidata.org/wiki/Q<n>"
]
```

**Conservative v1.5 (only verified-live profiles — recommended until handle decision lands):**

```json
"sameAs": [
  "https://x.com/0xorli",
  "https://frqncy.substack.com",
  "https://github.com/0rli-E"
]
```

This v1.5 array reflects today's verified surface and removes the soft inaccuracy (the current schema asserts `@frqncy_network` exists; it doesn't yet). See the handle-decision brief for the trade-off.

### Person sameAs (in `/people/orlando/index.html`)

Current state asserts only the self-URL, which is malformed (sameAs should never be the canonical URL — that's what `url` is for). Recommended replacement:

```json
"sameAs": [
  "https://x.com/0xorli",
  "https://github.com/0rli-E",
  "https://frqncy.substack.com"
  // Uncomment as each lands:
  // "https://www.linkedin.com/in/<orlando-handle>",
  // "https://www.wikidata.org/wiki/Q<n>"
]
```

---

## Maintenance protocol

1. **Quarterly re-verify.** Re-run WebSearch on every row whose "Last verified" is older than 90 days. Update the date and the status.
2. **On every new handle claim:** update this matrix BEFORE updating the live JSON-LD. The matrix is the staging area; the schema is downstream.
3. **On every collision discovery:** add to the "Brand-collision reality" list at the top and add a row to `MENTION-MONITORING.md`.
4. **On schema update:** the homepage `Organization` sameAs and the Person sameAs are the only two places this array lives. Don't fan it out — keep the source of truth here and copy from it.
5. **Coverage metric:** count `live` rows / total rows. Phase 5.3 verification needs ≥ 80%. Track in `audits/seo/METRICS.md` once that file accepts a coverage row.

---

## Related materials

- `audits/seo/MENTION-MONITORING.md` — the brand-collision and mention-tracking source of truth
- `audits/seo/runs/2026-04-29-phase-5.10-baseline-mentions.md` — the baseline mention scan that surfaced the @0xOrli vs @frqncy_network mismatch
- `audits/seo/runs/2026-05-13-phase-5.1-wikipedia-notability-dossier.md` — why Wikipedia is deferred
- `audits/seo/runs/2026-04-29-phase-4.5-knowledge-graph-briefs.md` — Wikidata entity briefs ready to submit
- `audits/seo/runs/2026-05-13-phase-5.3-handle-decision.md` — the Twitter/X canonical handle decision
- `audits/seo/runs/2026-05-13-phase-5.3-sameas-matrix.md` — the run log for this matrix
- `proposals/VISIBILITY-PLAN.md` — the 90-day visibility plan
- `proposals/TELEGRAM-CHANNEL-LAUNCH.md` — Telegram channel playbook
