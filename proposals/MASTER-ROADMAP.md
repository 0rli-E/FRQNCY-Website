# FRQNCY Master Roadmap

*Single source of truth for everything being built. Updated as items move.*

*Last sync: 2026-05-12*

---

## How to read this

This is the canonical roadmap. Other roadmap-like docs (`CONTENT-ROADMAP-IDEATION.md`, `FRQNCY-PROJECTS-PAPER.md`, `FRQNCY-CRYPTO-STACK.md`, `OPTIMISATION-PAPER-2026-05-11.md`) are *zoom-ins* on specific sections of this file. If anything is in conflict, this file wins.

Items are grouped by *layer*, not by *date*. Dates get assigned in the working bucket only.

Status legend:
- ✅ shipped
- 🟢 in active build
- 🟡 staged (ready to start, awaiting capacity)
- ⚪ backlog (real work, not next)
- 🔵 concept (not yet committed)

---

## Layer 0 — Platform foundation

These are the things that have to keep working. If any of them break, everything else on the network gets harder.

| Status | Item | Where |
|---|---|---|
| ✅ | Uniform global header across every page | `_chrome/global-header.html` + `scripts/sync-headers.mjs` |
| ✅ | Universal back button | global header |
| ✅ | Search bar in header (no FOUC) | global header critical CSS |
| ✅ | Sign-in removed; My FRQNCY CTA only | global header |
| ✅ | Breadcrumb paths clickable on every page | shared topic template |
| ✅ | 8 pillars in canonical order: Curate · Education · Research · Media · Sell · Fund · Build · Network State | `content.json` + homepage |
| ✅ | Places as a domain (`d-places`) | `content.json` |
| ✅ | Consciousness rename (was Metaphysics) — audit complete | `content.json` + `_redirects` |
| 🟡 | Service-worker version discipline — bump on every JSON/JS shape change | `sw.js` |
| 🟡 | Sync-from-canonical guard in CI (run `sync-headers.mjs --check`) | `scripts/sync-headers.mjs` |

---

## Layer 1 — Content depth

The graph only matters when the nodes are real. This layer is the editorial work.

### People · Books · Orgs · Places · Media · Music · Studies

| Status | Item | Task |
|---|---|---|
| ✅ | Person bed — 309 entries, FRQNCY-voice bios | bed |
| ✅ | Books bed — 285 entries | bed |
| ✅ | Orgs bed — 114 entries | bed |
| ✅ | Places bed — 10 entries | bed |
| ✅ | Media bed — 75 entries | bed |
| ✅ | Music bed — 8 entries | bed |
| ⚪ | Studies / research / discoveries bed + surface on every topic | #23 |
| 🟡 | 6-books treatment applied to pillar pages | #65 |
| 🟡 | Auto-ingest new videos from tracked channels | #53 |

### Topics

The taxonomy is at 216 topics across 16 domains. Recent additions:

| Status | Topic | Task |
|---|---|---|
| ✅ | Intuitive Abilities (`t-abilities`) | #22 |
| ✅ | Network States (`t-networkstates`) | — |
| ✅ | Etiquette (`t-etiquette`) | #76 |
| ✅ | Tax & Sovereignty (`t-tax-sov`) | #77 |
| ✅ | Charter Cities (`t-charter-cities`) | #89 |
| ✅ | Homeschooling (`t-homeschooling`) | #88 |
| ✅ | AI Agent Law (`t-ai-agent-law`) | #90 |
| ✅ | Network Schools (`t-netschools`) | #79 |

### Editorial polish (pending)

| Status | Item | Task |
|---|---|---|
| ⚪ | Verify and finish podcast guest outreach | #60 |
| ⚪ | Music surfaces — Hub, Topic, Concerts (the missing third) | #73 |
| ⚪ | Add time-travel video to watch | #42 |
| ⚪ | Masonbook YouTube channel | #91 |
| ⚪ | Spotlight Dr Joe Dispenza's *Frequency* movie | #54 |
| ⚪ | Deepen spiritual technology / materialism content | #29 |

---

## Layer 2 — Manifesto, voice, brand

The editorial position made explicit. Lives in `proposals/`.

| Status | Doc | Task |
|---|---|---|
| ✅ | FRQNCY Manifesto — first working draft | #26 #28 #32 #33 #36 #62 |
| ✅ | Voice Playbook | — |
| ✅ | Editorial Standards | — |
| ✅ | Optimisation Paper 2026-05-11 | — |
| 🟡 | Content Roadmap + Ideation Paper | #85 |
| 🟢 | Master Roadmap (this doc) | #24 |

Open manifesto threads:
- 🟢 "Enlightened Nations" concept page on the network itself (not just a doc) — needs a surface under d-society, then a reading list, then a working group. (#62)
- ⚪ The single-sentence FRQNCY explainer is canon ("A topic graph for consciousness."). Open question: should it be the same line in DE, ZH, ES, or each language gets its own? See multilingual stream.

---

## Layer 3 — Surfaces (the homepage and pillar/domain pages)

Where visitors land. Where the editorial line is most visible.

| Status | Item | Task |
|---|---|---|
| ✅ | Homepage tagline (three lines under wordmark) | #40 |
| ✅ | "100th Monkey" framing on about page | #66 |
| ✅ | Pillar order on homepage | #19 |
| ✅ | "Unable able" line with explainer | #93 |
| 🟡 | Twitch-style rotating banners (topics + books) on homepage | #43 |
| 🟡 | 6-books treatment applied to pillar pages | #65 |
| ⚪ | Luma embed on /podcast and /events | #2 |

---

## Layer 4 — Crypto stack

The full sequence lives in `proposals/FRQNCY-CRYPTO-STACK.md`. Headline items:

| Status | Item | Task |
|---|---|---|
| ⚪ | FRQNCY Stablecoin: BLNC ("Balance") | #25 |
| ⚪ | FRQNY governance token — Fund · Coordination · Incentivisation · Governance | #59 |
| ⚪ | FRQNY Veto Council (security against monetary attack) | #35 |
| ⚪ | AI battletest of crypto stack | #30 |
| ⚪ | LPs + custody + wrappers (Orb Markets style) | #31 |
| ⚪ | List FRQNCY on Echo (echo.xyz) | #57 |
| ⚪ | Set up crypto overview page | #87 |
| ⚪ | Start FRQNCY Crypto Research stream | #71 |
| ⚪ | Crypto Research — initial reading list + backlog | #81 |
| ⚪ | Kick off crypto.frqncy meta — sequence the build | #92 |

---

## Layer 5 — Social, dating, network state

The relationship and connection layer of the network.

| Status | Item | Task |
|---|---|---|
| ⚪ | LinkedIn-like social layer (connections + interest matching) | #63 |
| ⚪ | Dating layer (designed to be deleted) on the same matcher | #64 |
| ⚪ | Telegram channel — set up + content rhythm | #68 |
| ⚪ | Topic-based email newsletter (subscriber picks topics) | #56 |
| ⚪ | Integrate with Ethos (reputation layer) | #82 |
| 🔵 | Enlightened Nations programme — concept → reading list → working group | #62 |

---

## Layer 6 — Capital flows

The economic substrate underneath the network.

| Status | Item | Task |
|---|---|---|
| ⚪ | Donation buttons: crypto wallets · PayPal · Google Pay | #75 |
| ⚪ | Donation functionality across videos, projects, people, places | #51 |
| ⚪ | Referrals in Sell pillar | #45 |
| ⚪ | Affiliate links — books, memberships, aligned goods | #58 |
| ⚪ | FRQNCY Launchpad — funding + spotlight for aligned projects | #55 |
| ⚪ | Live-stream capability | #52 |

---

## Layer 7 — Physical world

Where the network meets meatspace.

| Status | Item | Task |
|---|---|---|
| ⚪ | Plan FRQNCY physical space | #72 |
| ⚪ | Organise the first FRQNCY retreat | #41 |
| ⚪ | Plan first FRQNCY events programme | #86 |

---

## Layer 8 — Agents & bots

Software that does work on behalf of the network.

| Status | Item | Task |
|---|---|---|
| ⚪ | Amex bot | #46 |
| ⚪ | Hermes agent | #47 |
| ⚪ | OpenClaw agent | #48 |
| ⚪ | Ironclaw agent (sibling to OpenClaw + Hermes) | #74 |
| ⚪ | Telegram → frqncy-harness connection | #50 |
| ⚪ | Telegram bot for topic updates | #49 |
| 🔵 | FRQNCY AI — mankind-aligned neural network | #80 |
| 🟡 | AI marketing + crypto summaries (Zusammenfassungen) | #67 |

---

## Layer 9 — Internationalisation

Reach beyond the English internet.

| Status | Item | Task |
|---|---|---|
| ⚪ | Multilingual — EN → DE → ZH → ES first | #83 |
| 🔵 | All relevant languages down the road (FR, PT, JP, KO, IT, RU, AR, HI, ID, NL, TR) | #83 |

---

## Layer 10 — Visibility & growth

The network has to be found.

| Status | Item | Task |
|---|---|---|
| 🟡 | Visibility boost — execute against the notes in the notebook | #78 |
| ⚪ | Podcast guest outreach finish | #60 |

---

## What's not on the roadmap (yet)

Things that have been mentioned but not committed:

- A FRQNCY mobile app. Adjacent to the network but not the next move.
- A FRQNCY token launch date. The crypto stack is sequenced; the launch is conditional on the stack passing AI battletest.
- A FRQNCY physical retreat property purchase. The first retreats will use partner properties.

---

## Cross-references

- `proposals/FRQNCY-MANIFESTO.md` — the editorial position
- `proposals/FRQNCY-VOICE-PLAYBOOK.md` — how the voice gets enforced
- `proposals/OPTIMISATION-PAPER-2026-05-11.md` — UX / structural P0s, KPIs, three-tier execution plan
- `proposals/CONTENT-ROADMAP-IDEATION.md` — content additions ideation
- `proposals/FRQNCY-PROJECTS-PAPER.md` — FRQNCY-incubated projects pipeline
- `proposals/FRQNCY-CRYPTO-STACK.md` — BLNC, FRQNY, Veto Council, Echo, custody

---

*Update protocol: when a task closes, move its row to ✅ here and `git commit` the same change. When a new task is added in conversation, add the row before the day is out — the roadmap is only useful if it's current.*
