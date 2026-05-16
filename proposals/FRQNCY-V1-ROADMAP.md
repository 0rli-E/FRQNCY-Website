# FRQNCY v1 — Public Roadmap

*What FRQNCY is shipping. Two surfaces — the website you're on, the harness underneath. Where each is today, and what's next.*

*Version 1.0 — 2026-05-12. Updated as items ship.*

---

## Editorial position

> Frqncy is for things not against them as we know we create what we focus on. So we are not against war, terror, inequality or the like. We are for peace, freedom and free will and the free expression of every individual. People will say oh but what people then still want to kill each other for the experience? Well if you come from oneness and love why would you ever want to hurt anyone? People hurting others stems from the fact they are themselves hurting in lack, pain or any other destructive state. When you come from a place of gratitude, wholeness and love you will spread gratitude, wholeness and love.

> The goal has to be to take as many of the undecided as possible to new earth and maybe even some of the deeply negative and lost, and give them everything they need to move on into new earth.

> We are part of birthing new earth.

---

## The shape of FRQNCY

Two parallel tracks, one mission. The **website** is the public face — the topic graph people actually read, browse, fund. The **harness** is the engineering substrate — agents, integrations, the AI layer underneath. Both serve the same editorial line.

```
┌──────────────────────────────────────────────────────┐
│   THE WEBSITE                                        │
│   frqncy.network — the public network                │
│                                                      │
│   227 topics  ·  908 entities  ·  1,116 URLs         │
│   324 books  ·  311 people  ·  115 orgs              │
│   11 places  ·  76 media  ·  8 music  ·  8 studies   │
└──────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────┐
│   THE HARNESS                                        │
│   frqncy-harness — the engineering layer             │
│                                                      │
│   Agents · Integrations · AI · Treasury · Bots       │
└──────────────────────────────────────────────────────┘
```

---

## Track 1 · The Website

### What's live

**Editorial substrate**
- 8 pillars (Curate · Educate · Research · Broadcast · Sell · Fund · Build · Settle)
- 18 domains, 227 topics
- 324 books · 311 people · 115 orgs · 11 places · 76 media · 8 music · 8 studies
- Aligned Goods (curated tools, products, books) at `/aligned/`
- Pillar pages with the 6-book FRQNCY-picks treatment
- Topic + domain + entity pages all auto-generated from beds

**Surfaces shipped**
- Homepage with the network-pulse marquee (one mixed band, image-forward, paused on hover)
- `/about` — vision, manifesto, distinction (spiritual tech + materialism), 100th monkey thesis
- `/start-here` · `/platform` — the entry points
- `/v2/explore.html` — interactive force-directed graph of the network
- `/v2/watch/` — video library
- `/v2/courses/` — 6 long-form courses
- `/music/` · `/music-topic/` · `/v2/concerts/` — three-leg music surface
- `/v2/fund/` · `/v2/crypto/` · `/v2/crypto/projects.html` · `/v2/crypto/explorer.html` — capital pillar pages
- `/podcast` — the FRQNCY podcast page
- `/social/` (NRG) — social layer (auth + feed, Astro-built)
- `/membership/` — membership entry
- `/space` — community space
- `/my-frqncy/dashboard/` · `/my-frqncy/charts/` · `/my-frqncy/practice/` — member dashboards
- **NEW (May 12 batch):** `/donate` · `/launchpad` · `/newsletter` · `/events` · `/v2/concerts/` · `/frqncy-ai`
- `/chart` · `/chart-v2/` — chart generator
- `/aligned/` — the aligned-goods catalogue

**Chrome & infrastructure**
- Canonical header across every page (65 pages auto-synced from `_chrome/global-header.html`)
- Universal back button, breadcrumbs, search bar, My FRQNCY gold CTA
- Tiny floating ♥ Donate button on every page (EVM + Solana wallets, copy-to-clipboard)
- Service worker (v43) with versioned shell, data, and runtime caches
- Cloudflare Pages deploy from `main`

**Editorial chrome**
- Voice playbook + Editorial Standards
- Master Roadmap, Manifesto, Crypto Stack, Projects Paper, Content Roadmap, Physical Milestones, First-retreat plan
- Specs for agents, integrations, and the Telegram channel launch

---

### What's next on the website (Q3 → Q4)

Ordered by who-this-helps-most:

| Priority | Item | Status | Notes |
|---|---|---|---|
| ◉ | First retreat (Essência) ticketing live | spec ready | Needs Luma calendar ID + retreat dates |
| ◉ | Newsletter backend wire-up | UI live, backend stub | Klaviyo or Substack |
| ◉ | Telegram channel launch | playbook ready | See `TELEGRAM-CHANNEL-LAUNCH.md` |
| ○ | Affiliate links across books | schema sketched | Add `affiliate_links[]` to each book entry |
| ○ | Multilingual rollout begin (DE first) | infrastructure spec | EN → DE → ZH → ES |
| ○ | Topic-page Studies surface | bed exists (8 studies) | Render studies block on every relevant topic |
| ○ | Auto-ingest videos from tracked channels | spec ready | Cron + classifier + PR per ingest |
| ◌ | Wikipedia entry for FRQNCY Network | notability dossier needed | Phase 5 of SEO plan |
| ◌ | LinkedIn-style social layer expansion | shell exists at `/social/` | Adds connections + interest matching |

Legend: ◉ ship in next 6 weeks · ○ ship in next quarter · ◌ ship when foundation is denser

---

## Track 2 · The Harness

### What's there today

The harness exists as a working private repo (`github.com/0rli-E/frqncy-harness`). It runs Claude-SDK agents on demand against the website repo — content generation, audits, scraping, codegen. The pieces below describe the *targeted* shape (what the harness will be), not its current minimal state.

### What's next on the harness

| Layer | Agent / piece | Status | Build cost (solo) |
|---|---|---|---|
| Foundation | Runtime + supervision + logging + channel adapters | partial | 3 weeks |
| Outbound | **Hermes** — outbound messenger (Gmail, Telegram, Signal, DM) | spec ready | 3 weeks |
| Inbound | **OpenClaw** — inbound classifier + reply drafter | spec ready | 4 weeks |
| Workflows | **Ironclaw** — end-to-end multi-step workflows | spec ready | 6 weeks |
| Money | **Amex Bot** — transaction classifier + flagger | spec ready | 2 weeks |
| Control | **TG-Topic** — Telegram bot for content patches | spec ready | 2 weeks |
| Control | **TG-Harness** — full harness control from Telegram | spec ready | 1 week (after others) |

Build order (solo): Foundation → Amex → Hermes → OpenClaw → TG-Topic → TG-Harness → Ironclaw. Roughly **5 months elapsed** solo; **2.5 months with one engineer** alongside.

Full specs in `proposals/SPECS-AGENTS.md`.

---

## Track 3 · The Capital Layer *(Q1 → Q2 next year)*

The crypto stack — sequenced separately, gated on website maturity.

| Stage | Item | Target |
|---|---|---|
| T+0 | Treasury setup (multi-sig, council election design) | Q3 |
| T+3mo | **BLNC** stablecoin testnet → mainnet beta | Q4 |
| T+5mo | **FRQNY** governance token contracts + distribution model | Q4 |
| T+6mo | Liquidity bootstrap on Echo (echo.xyz) | Q4 |
| T+6mo | Veto Council elected | Q4 |
| T+6-9mo | AI battletest of the full stack | Q1 next |
| T+9-12mo | Public mainnet + Launchpad live | Q1-Q2 next |

Full sequencing in `proposals/FRQNCY-CRYPTO-STACK.md`.

---

## Track 4 · Physical World

The off-screen surfaces.

| Milestone | Format | Status | Target |
|---|---|---|---|
| First retreat | 5 days · 20-30 people · Essência | spec ready, needs dates + Luma | Q4 |
| Salon programme | Monthly · ~15 people · Lisbon / Berlin / NY | concept | Q4 onwards |
| FRQNCY Days | Quarterly · ~80 people · public ticketing | concept | 2027 Q1 |
| Semi-permanent space | 200-400m² in Lisbon or Berlin | gated on retreat + salon proof | 2027 Q2+ |

Full plan in `proposals/FIRST-PHYSICAL-MILESTONES.md`.

---

## Where you can help

If you're reading this and want in:

- **The retreat.** First cohort opens once dates are locked. Mailing list at `/newsletter` (pick "Events").
- **The Launchpad.** Building a project that fits the editorial line? `launchpad@frqncy.network`.
- **The harness.** One engineer alongside Orlando cuts the build timeline in half. Reach out via `/social/profile/orlando`.
- **The content.** Submit a book, person, org, place, video, or piece of music at `/aligned/submit` (coming) or DM via Telegram once the channel is live.
- **The capital.** Pre-treasury, donations route through the wallets at `/donate`. Post-treasury, Launchpad allocations become public.

---

## From the notebook · 2026-05-15

*Captured from a handwritten roadmap page. Items below are slotted into the four tracks using the same status legend as the rest of this doc.*

### Website + editorial additions

| Priority | Item | Status | Notes |
|---|---|---|---|
| ◉ | A place for truth, honesty, and alignment | positioning live | Make the editorial position explicit on `/about` and `/start-here` — the line that names what FRQNCY *is for* |
| ◉ | Podcast with amazing guests | pipeline live | Tier-1 outreach in `PODCAST-OUTREACH-PLAN.md` |
| ◉ | Referral network | scaffolded | Affiliate links across books, memberships, aligned goods |
| ◉ | Social Media Roadmap | plan ready | See `VISIBILITY-PLAN.md` — owned / earned / discovery channels |
| ○ | Research papers surface | concept | Dedicated bed + topic-level surfacing for studies + papers we've curated |
| ○ | Research · supporting the passionate unrelenting dreamers | concept | Editorial line for the Research pillar — the dreamers who don't get academic funding are who we point at |
| ○ | FRQNCY crypto curation | concept | Crypto-projects curation as its own editorial surface (`/crypto/projects.html` is the seed) |
| ○ | Courses for people to learn | shell live | `/courses/` exists with 6 long-form courses; deepen catalogue + add cohort flow |
| ◌ | Roadmap surface (public) | this doc | A polished public roadmap page on `frqncy.network` — currently markdown only |

### Harness additions

| Layer | Item | Status | Notes |
|---|---|---|---|
| AI | **Mankind-aligned neural Network** (FRQNCY AI) | concept page live | `/frqncy-ai` exists; the mankind-aligned thesis needs build sequencing |
| AI | **Harness that powers the World tree** | concept | Naming for the harness substrate — every FRQNCY surface as a branch off one root system |
| AI | **AI managing Fund** across all topics | concept | An agent that allocates Launchpad / Fund capital across topics based on impact + KPIs |
| Onboarding | **Crypto onboarding "___"** | concept (name pending) | A guided onboarding flow for crypto-curious newcomers — agent name to be chosen |

### Capital-layer additions

| Stage | Item | Status | Notes |
|---|---|---|---|
| Architecture | We integrate on top of all relevant chains and sit on top of them | thesis | FRQNCY as chain-agnostic — every relevant L1/L2 wrapped into one surface |
| T+3mo | **Stablecoin** — BLNC | spec ready | `FRQNCY-CRYPTO-STACK.md` |
| T+5mo | **Crypto token** — FRQNY | spec ready | Governance / coordination / incentivisation / fund functions |
| T+6mo | **FRQNCY LP's** | spec ready | Liquidity pools, custody, wrappers — Orb Markets reference architecture |
| T+6mo | **FRQNCY Janus** "___" finishing touches · Veto Council | spec ready | Veto Council guards monetary attack; Janus is the council/oversight piece (final name pending) |
| Ongoing | Funding research + mankind-aligned projects, scored on impact + KPIs | concept | The allocation logic for the AI-managed Fund above |
| Ongoing | FRQNCY ZPC becomes more autonomous | concept | The Zero-Point Capital piece runs increasingly without manual sign-off |
| North star | FRQNCY lives from its monetary income | thesis | Treasury self-sustaining — no external dependency once liquid |

### Physical-world additions

| Milestone | Item | Status | Notes |
|---|---|---|---|
| Settle | **Physical settlement** | concept | The 8th pillar made real — settlement comes after retreat → salon → space → land |
| Settle | School-like training grounds | concept | Long-form residencies — the "school" model for transmission, not lectures |
| Build | Support energy independence + eco-villages | thesis | Editorial alignment with existing eco-villages; capital allocation through Fund + Launchpad |

### Cross-cutting

| Item | Status | Notes |
|---|---|---|
| NRG · Community Roadmap | scaffolded | Internal roadmap for `/social/` — separate from this doc, plugs into it |
| My FRQNCY Roadmap → chart integration | concept | Roadmap for the My FRQNCY surface: dashboard ↔ chart deeper integration |
| **My FRQNCY = first stop for newcomers** | concept | First-touch experience: a newcomer arrives, generates their Human Design chart, and that becomes their entry point into the network — chart → dashboard → personalised paths through the topic graph |
| All different roadmaps spawning and plugging in | thesis | Each track owns its own roadmap; this v1 doc is the spine they connect to |

Legend (unchanged): ◉ ship in next 6 weeks · ○ ship in next quarter · ◌ ship when foundation is denser

---

## More from the master roadmap

*Everything in `MASTER-ROADMAP.md` that hadn't yet made it into this v1 doc. Mapped into the same four tracks + the social / i18n / visibility cross-cuts.*

### Website — content polish

| Priority | Item | Status | Notes |
|---|---|---|---|
| ◉ | Twitch-style rotating banners on homepage | in build | Mixed marquee shipped; tuning size + speed (#43) |
| ◉ | Luma embed on `/podcast` and `/events` | scaffolded | Replace placeholder iframe with the calendar ID (#2) |
| ◉ | 6-books treatment on pillar pages | shipped on pillars | Carry to remaining surfaces (#65) |
| ○ | Time-travel video added to `/watch/` | blocked | Needs the URL (#42) |
| ○ | "Masonbook" YouTube channel as person/source | blocked | Needs handle (#91) |
| ○ | Spotlight + donation flow for Joe Dispenza's *Frequency* movie | scaffolded | Hero card + dedicated donation CTA on `/media/frequency-movie/` (#54) |
| ○ | Deepen spiritual technology / materialism content | in progress | Continue the editorial thread through `/about` + per-topic intros (#29) |

### Website — platform & infra

| Priority | Item | Status | Notes |
|---|---|---|---|
| ◉ | Service-worker version discipline | partial | Bump `sw.js` version on every JSON/JS shape change |
| ◉ | CI guard: `sync-headers.mjs --check` on every PR | concept | Fail build if any page diverges from canonical header |

### Manifesto · open editorial threads

| Priority | Item | Status | Notes |
|---|---|---|---|
| ○ | "Enlightened Nations" — concept page + reading list + working group | concept | Surface under `d-society`; sequence: page → list → group (#62) |
| ◌ | Single-sentence FRQNCY explainer in DE / ZH / ES | open question | Same line translated, or each language picks its own? Coordinate with i18n |

### Harness — additions

| Layer | Item | Status | Notes |
|---|---|---|---|
| Marketing | **Zusammenfassungen** agent — AI marketing + crypto summaries | partial | Auto-summary of weekly editorial + crypto-stack movement, multi-channel (#67) |
| AI | **FRQNCY AI** — mankind-aligned neural network | concept page live | `/frqncy-ai`; full build is post-harness-foundation (#80) |
| AI | Continuous updates from the sources fed into the **world tree of FRQNCY**, pruned by mankind-aligned AI | concept | The graph stays alive: ingestion agents pull from tracked sources continuously, mankind-aligned AI prunes — removing what's stale, surfacing what's resonant, keeping the editorial line clean without manual sweep every time |

### Capital — additions beyond the stack

| Stage | Item | Status | Notes |
|---|---|---|---|
| Research | FRQNCY Crypto Research stream | started | Initial reading list + coverage backlog (#71, #81) |
| Research | Kick off `crypto.frqncy` meta-sequencing | done as plan | Build sequence from spec into actual ship dates (#92) |
| Surface | Crypto overview page | shipped at `/crypto/` | Keep current as stack matures (#87) |
| Capital flows | Donation buttons: crypto + PayPal + Google Pay | partial (EVM + SOL live) | Add PayPal + Google Pay rails to existing wallet pop (#75) |
| Capital flows | Donation functionality across videos · projects · people · places | partial | Per-entity donate button on every page where it makes sense (#51) |
| Capital flows | Referrals on the Sell pillar | scaffolded | Per-product referral codes in the catalogue (#45) |
| Capital flows | Live-stream capability | concept | Streamed events + paid access through the membership tier (#52) |
| Commerce | **Aligned Goods shop** — online shop for healthy goods, all regions | concept | Builds on `/aligned/` — full e-commerce surface for healthy, FRQNCY-aligned products, with region-aware fulfilment so it serves every market, not just one |

### Social · dating · network state (Layer 5)

| Priority | Item | Status | Notes |
|---|---|---|---|
| ○ | LinkedIn-style social layer (connections + interest matching) | shell live | `/social/` exists; matcher is the next deepening (#63) |
| ○ | Telegram channel — set up + content rhythm | playbook ready | See `TELEGRAM-CHANNEL-LAUNCH.md` (#68) |
| ○ | Topic-based email newsletter | UI live, backend stub | Subscriber picks topics; Klaviyo or Substack (#56) |
| ◌ | Dating layer (designed to be deleted) on the same matcher | concept | Same interest-matching substrate; intentionally ephemeral (#64) |
| ◌ | Integrate with Ethos (reputation layer) | concept | Pull Ethos reputation into FRQNCY profiles (#82) |
| ◌ | Enlightened Nations programme | concept | See manifesto thread above (#62) |

### Internationalisation

| Priority | Item | Status | Notes |
|---|---|---|---|
| ○ | Tier-1 ladder: EN → DE → ZH → ES | infrastructure spec | Start with DE (#83) |
| ◌ | Tier-2 ladder: FR · PT · JP · KO · IT · RU · AR · HI · ID · NL · TR | concept | Sequence after Tier-1 proves the pipeline (#83) |

### Visibility & growth

| Priority | Item | Status | Notes |
|---|---|---|---|
| ◉ | Visibility plan execution | in progress | See `VISIBILITY-PLAN.md` — owned, earned, discovery (#78) |
| ◉ | Podcast guest outreach — finish Tier-1 list | in progress | See `PODCAST-OUTREACH-PLAN.md` (#60) |

### Not on the v1 roadmap (yet)

Things named in the master roadmap as deliberately out of scope for v1:

- A FRQNCY mobile app — adjacent to the network but not the next move.
- A fixed FRQNCY token launch date — the crypto stack is sequenced; launch is conditional on the stack passing AI battletest.
- A FRQNCY physical retreat property purchase — the first retreats use partner properties.

---

## Cross-references

- `MASTER-ROADMAP.md` — every internal task and what layer it lives in
- `FRQNCY-MANIFESTO.md` — the editorial position
- `FRQNCY-CRYPTO-STACK.md` — full crypto sequencing
- `FRQNCY-PROJECTS-PAPER.md` — the projects pipeline inside FRQNCY
- `SPECS-AGENTS.md` — every harness agent specified
- `SPECS-INTEGRATIONS.md` — every backend integration specified
- `FIRST-PHYSICAL-MILESTONES.md` — the retreat + space plan
- `TELEGRAM-CHANNEL-LAUNCH.md` — TG channel playbook
- `CONTENT-ROADMAP-IDEATION.md` — content additions queue
- `OPTIMISATION-PAPER-2026-05-11.md` — the UX / structural P0 paper that kicked this off

---

*This roadmap updates as items move. If anything here is out of date, file an issue or open a PR. The roadmap is only useful if it's current.*
