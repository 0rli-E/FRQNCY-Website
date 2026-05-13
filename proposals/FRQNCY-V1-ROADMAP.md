# FRQNCY v1 — Public Roadmap

*What FRQNCY is shipping. Two surfaces — the website you're on, the harness underneath. Where each is today, and what's next.*

*Version 1.0 — 2026-05-12. Updated as items ship.*

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
