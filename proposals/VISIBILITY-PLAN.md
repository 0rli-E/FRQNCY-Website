# FRQNCY Visibility Plan — v2

*One consolidated plan pulling together every visibility / SEO / distribution effort, plus what's still open. Built on top of the work in `audits/seo/`.*

*v1 created 2026-05-12. **v2 re-baselined 2026-08-01** against verified state. Status: live working plan.*

---

## What happened to v1

v1 set a 90-day window (2026-05-12 → 2026-08-10). That window is now effectively closed, so here is the honest accounting: **the on-site work compounded; the off-site work didn't start.**

The site got materially more discoverable. The sitemap went from 759 URLs to **1,166 live** (1,172 in the local tree). The "schema got wiped by the generator" crisis that dominated `audits/seo/PROGRESS.md` is **resolved** — schema is now emitted natively by `generate.js`, so it survives every regen: Article on 138 pages, FAQPage on 103, BreadcrumbList on 1,192, ItemList on 253. The newsletter backend was built and deployed. None of that is in v1's checkboxes because v1 was written before it happened.

What did not move is everything that needs a human to open a browser and claim a name. Zero podcast pitches sent (`PODCAST-TRACKER.md` reads `not pitched` on all 20 rows). No Telegram channel. No X brand handle. No LinkedIn company page. The 21 pre-written Telegram posts in `audits/seo/TELEGRAM-LAUNCH-QUEUE.md` are still sitting in the queue.

**The lesson v2 is built around:** this plan kept mixing two kinds of work — things an agent can ship and things only Orlando can do — into one undifferentiated checklist, and the agent-shippable half quietly ate the attention. v2 splits them. The Orlando list is deliberately tiny.

---

## Verified state — 2026-08-01

Everything below was checked against the repo or against the live network on 2026-08-01, not inherited from v1.

| Item | State | Evidence |
|---|---|---|
| Sitemap | **1,166 URLs live** (was 759); 1,172 in the local tree | `curl frqncy.network/sitemap.xml` |
| Topic-page schema | **Native in the generator** — survives regen | `generate.js` topic/entity `ld` builders |
| Article / FAQPage / BreadcrumbList / ItemList | 138 / 103 / 1,192 / 253 pages | grep across `index.html` |
| Newsletter backend | **Deployed and responding.** `/api/subscribe` validates input in prod | live POST probe returns the validation error correctly |
| Newsletter DB write path | **Unverified.** Needs `SUPABASE_SERVICE_ROLE_KEY` in Cloudflare Pages | same env var that blocks analytics — see memory note |
| `/people/orlando/` Person `sameAs` | **Fixed 2026-08-01.** Was self-referential (pointed only at its own URL); now `x.com/0xorli`, `github.com/0rli-E`, `frqncy.substack.com` | `generate.js` + `people.json` |
| Homepage Organization `sameAs` | 2 entries — **one still points at an unclaimed handle** | `index.html` |
| X — `@frqncy_network` | **Not claimed.** No indexed profile | WebSearch, 2026-08-01 |
| X — `@0xOrli` (founder) | Live | verified 200 |
| Telegram — `@frqncy_network` | **Does not exist.** `t.me/frqncy_network` serves the generic contact page, byte-identical to a nonsense handle | live fetch comparison |
| Telegram launch queue | **21 posts written and waiting** | `audits/seo/TELEGRAM-LAUNCH-QUEUE.md` |
| Podcast pitches | **0 of 20 sent** | `audits/seo/PODCAST-TRACKER.md` |
| Substack | Live but dormant — last public post Dec 2023, still crypto-flavoured | `SAMEAS-MATRIX.md` |
| `/podcast` page | **Live** at `/podcast` (source is root `podcast.html`, 301'd to the clean URL) and already carrying `PodcastSeries` schema | `curl frqncy.network/podcast` → 200, `<h1>The FRQNCY Podcast</h1>` |
| LinkedIn, Crunchbase, Bluesky, YouTube, Wikidata | Not created | `SAMEAS-MATRIX.md` (2 of 20 platforms live) |

---

## The Orlando list

Five actions. Nothing else on this page needs him. Everything here is blocked on a human having an account, and no agent can do any of it.

1. **Claim `@frqncy_network` on X.** The homepage `Organization` schema already asserts `https://x.com/frqncy_network` as a `sameAs`. Right now that assertion points at a vacancy — and the name FRQNCY is contested by seven other entities (`MENTION-MONITORING.md`). If one of them claims the handle, FRQNCY's own homepage hands them the entity association. Bio and profile copy are pre-written in `SAMEAS-MATRIX.md` §1. *Two minutes. Highest-consequence item on the page.*
2. **Create the Telegram channel `@frqncy_network`** and paste in the first three of the 21 queued posts. Playbook: `proposals/TELEGRAM-CHANNEL-LAUNCH.md`.
3. **Add `SUPABASE_SERVICE_ROLE_KEY` to Cloudflare Pages env vars,** then submit one real signup at `/newsletter` to confirm the row lands. This unblocks analytics too — same missing variable.
4. **Send five podcast pitches** from the Tier 2 list in `PODCAST-TRACKER.md` (Tier 1 is Ferriss/Fridman/Parrish — those are aspirational, not a first send). Pitch copy is written. Update the tracker on send.
5. **Approve or swap the podcast target list.** Still the open question from v1: the tiers are a best guess with no knowledge of Orlando's actual relationships. One pass through the table changes what gets pitched.

If only one of these happens, make it #1.

---

## The site list

Work an agent can do without Orlando. Ordered by leverage.

- [x] **Fix `/people/orlando/` Person `sameAs`** — done 2026-08-01. A self-referential `sameAs` gives entity resolvers nothing; the generator now filters frqncy.network URLs out of `sameAs` and reads an optional `sameAs[]` array from `people.json`, so verified profiles feed the schema for any person, not just Orlando.
- [x] **Add founder `sameAs` to the homepage `Organization`** — done 2026-08-01.
- [ ] **Point at `/podcast`.** The page is live with `PodcastSeries` schema already — but nothing links to it from the visibility surfaces, and it isn't in the homepage `Organization` schema. Since the Spotify and Apple handles for "The FRQNCY Podcast" are both taken by FMG, this page is the *only* podcast surface we control; it should be the canonical destination everywhere the podcast is mentioned.
- [ ] **Populate `sameAs` for the other 312 people** in `people.json`. The generator now supports it and 210 entries already carry a `_url_source`. Every populated row is an entity edge from FRQNCY to a known figure — this is how a curation site earns authority, and it's pure data work.
- [ ] **Close the Article-schema gap.** 138 pages carry Article; the topic graph is larger than that. Audit which generated pages fall through and why.
- [ ] **Wikidata item.** Briefs are ready (`WIKIDATA-EXECUTION-GUIDE.md`). Wikidata has no notability bar anywhere near Wikipedia's and feeds Knowledge Graph directly. This is the highest-value earned-surface item that doesn't need press coverage first.
- [ ] **Backlink baseline.** Nobody has ever measured what links to frqncy.network. Without a baseline, none of the Tier C metrics below are checkable.

---

## Where visibility comes from — the five sources

| Source | State (2026-08-01) | What it needs |
|---|---|---|
| **Organic search** | Strongest surface. Foundation shipped, schema native, 1,166 URLs live | Backlinks + Wikidata. Content depth is no longer the bottleneck |
| **Podcast appearances** | Kit ready, 0 sent | Orlando list #4 |
| **Cross-platform mentions** | 2 of 20 platforms live | Orlando list #1–2, then agent-fills the rest |
| **Network effects** | Newsletter deployed, Telegram unstarted | Orlando list #2–3 |
| **Direct reach** | `@0xOrli` live, no cadence | A cadence Orlando will actually keep — 1/week beats 3/week abandoned |

---

## Channels

### Owned *(we control)*

| Channel | Where | Cadence | State |
|---|---|---|---|
| Website | frqncy.network | Always-on | Live, compounding |
| Newsletter | /newsletter | Per-topic | Backend deployed, DB path unverified |
| Telegram | @frqncy_network | Tue/Thu/Sat | 21 posts queued, channel not created |
| Substack | frqncy.substack.com | Bi-weekly | Dormant since Dec 2023 |
| Podcast | /podcast | Per-episode | Page live with `PodcastSeries` schema; no episodes yet |

### Earned *(others amplify us)*

Other podcasts (guest appearances), X and LinkedIn reshares, Wikidata then eventually Wikipedia, and press — press only when there's a real story: Launchpad opening, a retreat shipping, the fund deploying.

### Discovery *(SEO + AI citations)*

Google organic is the live surface. Perplexity / ChatGPT / Claude citation work shipped in Phase 4 and needs continued mentioning to compound. YouTube via `/watch/` has an auto-ingest spec ready but unrun.

---

## What we won't do *(declared)*

- **No paid acquisition** until organic compounds. Paid hides whether the editorial is working.
- **No SEO content farms.** No "best of [year]" listicles, no AI-spam. Every page is a real entry on the network.
- **No begging for engagement.** No "drop a 🔥 if you agree." The voice playbook flags this.
- **No press push without a real story.** Stories first, press second.

---

## Metrics

Three tiers, floors not ceilings. Tier A should already be true; it isn't fully checkable yet, which is itself the finding.

**Tier A · Existence** — indexed for "FRQNCY Network" and "frqncy.network"; all 1,166 live sitemap URLs returning 200; Knowledge Graph card on brand search. *Blocked on: nobody has run the index-coverage check.*

**Tier B · Engagement** — Telegram 1,000 subs · newsletter 1,500 subs · direct traffic exceeding organic · 10+ podcast appearances. *All at zero; all gated on the Orlando list.*

**Tier C · Network effects (year 2)** — 50+ inbound links from non-FRQNCY domains · Wikidata item live, Wikipedia entry with ≥3 citations · aligned media citing FRQNCY unprompted.

---

## Cross-references

| File | Purpose |
|---|---|
| `audits/seo/SAMEAS-MATRIX.md` | Platform-by-platform identity canon + per-platform setup briefs |
| `audits/seo/MENTION-MONITORING.md` | The seven-entity FRQNCY brand collision |
| `audits/seo/PODCAST-TRACKER.md` | Running outreach tracker — update on every send |
| `audits/seo/TELEGRAM-LAUNCH-QUEUE.md` | The 21 pre-written posts |
| `audits/seo/WIKIDATA-EXECUTION-GUIDE.md` | Wikidata briefs |
| `audits/seo/PHASE-5-DISTRIBUTION.md` | Backlinks + Wikipedia + earned media |
| `audits/seo/PROGRESS.md` | Implementation dashboard — **stale as of 2026-05-13; its "schema wiped" finding is resolved** |
| `proposals/PODCAST-OUTREACH-PLAN.md` | Pitch-execution layer |
| `proposals/TELEGRAM-CHANNEL-LAUNCH.md` | TG channel playbook |

---

## Still awaiting input

The notebook content that triggered task #78. There's tactical material in it that has never been surfaced into this plan — handing it over unlocks the next iteration.
