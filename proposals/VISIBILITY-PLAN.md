# FRQNCY Visibility Plan

*One consolidated plan pulling together every existing visibility / SEO / distribution effort, plus what's still open. Built on top of the substantial work already in `audits/seo/`.*

*Created: 2026-05-12. Status: live working plan.*

---

## Where visibility comes from — the five sources

FRQNCY's audience grows from five compounding sources. Each one is at a different maturity. The plan is to take all five from "set up" to "running" in 90 days.

| Source | Current state | What it needs | Owner |
|---|---|---|---|
| **Organic search** | Foundation laid (Phase 2 SEO shipped, structured data live) | Content depth + Wikipedia entry | Editorial |
| **Podcast appearances** | Kit ready, no pitches sent yet | Execute the outreach plan | Orlando + Hermes (when built) |
| **Cross-platform mentions** | Brand-collision tracked | Distinguishing brand handles + monitoring | Orlando + agents |
| **Network effects** | NRG launched, mailing list latent | Newsletter + Telegram + active sharing | Orlando + content team |
| **Direct reach** | X presence (@0xOrli), no LinkedIn cadence | Cadence on existing channels | Orlando |

---

## The 90-day plan

### Days 1–30 · Foundation

The pipes that compound. None of these are exciting; all of them are necessary.

- [ ] **Confirm brand handles.** Lock `@frqncy_network` as the canonical FRQNCY handle (X). Update `Organization` schema on homepage + Person schema on `/people/orlando/` to match Orlando's actual `@0xOrli`. See `audits/seo/MENTION-MONITORING.md`.
- [ ] **Telegram channel** live with 14 pre-queued posts. See `proposals/TELEGRAM-CHANNEL-LAUNCH.md`.
- [ ] **Newsletter backend** wired (Klaviyo or Substack). `/newsletter` UI is already shipped — connect the form to the provider.
- [ ] **Wikipedia notability dossier.** Per `audits/seo/PHASE-5-DISTRIBUTION.md` Task 5.1 — research existing third-party coverage of FRQNCY, write the notability assessment. Don't draft the article yet; first prove notability.
- [ ] **First 5 podcast pitches sent** (Tier 1 list from `PODCAST-OUTREACH-PLAN.md`).
- [ ] **X/Twitter cadence:** 3 posts per week. Pull material from new bed entries, topic explainers, and the manifesto lines.

### Days 31–60 · Compounding

The pipes are now flowing — turn up the volume.

- [ ] **15 podcast pitches sent** (cumulative 20). 3 replies expected, 1 booking expected.
- [ ] **Telegram channel:** 30 posts shipped (the threshold for cross-promotion). Soft launch to the mailing list once you hit it.
- [ ] **First guest post or external essay** — pitch one piece to one of: The Generalist, Common Cog, Stratechery (if Ben Thompson opens guest slots), Future / a16z, Substack's editorial program.
- [ ] **LinkedIn presence:** 2 posts per week, original FRQNCY content. The audience is different from X's, the conversion is higher.
- [ ] **Wikipedia draft.** If the notability dossier from Days 1-30 cleared the bar, draft the article in markdown. Submit when the draft has 5+ independent sources.

### Days 61–90 · Distribution

By now there's content compounding. Now the work is to spread it.

- [ ] **45 cumulative podcast pitches.** 3 episodes taped, 1+ live.
- [ ] **First podcast appearance live.** Promote it across all channels for a week. Update the homepage hero with "Featured on [Show]" once a meaningful one lands.
- [ ] **Telegram:** 90 posts cumulative. Hit ~300 subs.
- [ ] **Newsletter:** 500 subs target. Triggered by Telegram cross-promotion + podcast appearance traffic.
- [ ] **Substack / Mirror cross-posts** of FRQNCY's longest-form content (the manifesto, the spiritual-tech essay, the FRQNCY AI concept page). New surfaces, same content.
- [ ] **Backlink audit.** What links to FRQNCY today (use Ahrefs free or `audits/seo/runs/`)? Reach out to the top 10 referrers, thank them, look for cross-link opportunities.

---

## Channels — what each one does

### Owned channels *(we control)*

| Channel | Where | Cadence | What works |
|---|---|---|---|
| Website | frqncy.network | Always-on | Topic graph, library, surfaces |
| Newsletter | /newsletter | Per-topic | Long-form, structured, deep |
| Telegram | @frqncy_network | Tue/Thu/Sat | Drops, picks, links, signal |
| Substack | frqncy.substack.com | Bi-weekly | Editorial essays |
| Podcast | /podcast | Per-episode | Long conversations |

### Earned channels *(others amplify us)*

| Channel | Mechanic |
|---|---|
| Other podcasts | Guest appearances — see outreach plan |
| Wikipedia | Once notable enough |
| X / Twitter | Posts that get reshared by aligned accounts |
| LinkedIn | Founder-style posts; B2B network reach |
| Press | Targeted only when there's a real story (Launchpad opens, retreat ships, fund deploys) |

### Discovery channels *(SEO + AI citations)*

| Channel | Current state |
|---|---|
| Google organic | Foundation laid; needs content depth + backlinks to compound |
| Bing / DuckDuckGo | Same as Google, lower priority |
| Perplexity / ChatGPT / Claude | Phase 4 AI-discoverability work shipped; needs continued mentioning |
| YouTube (via /watch/) | Auto-ingest spec ready; once running, channel-level discovery |

---

## What we won't do *(declared)*

- **No paid acquisition** until organic compounds. Paid hides whether the editorial is working.
- **No SEO content farms.** No "best of [year]" listicles, no AI-spam. Every page is a real entry on the network.
- **No begging for engagement.** No "drop a 🔥 if you agree." Voice playbook flags this.
- **No press push without a real story.** Stories first, press second.

---

## Visibility metrics — what we'll actually track

Three tiers, simplest first. Numbers are floors, not ceilings.

### Tier A · Existence *(should already be true)*
- FRQNCY indexed in Google for "FRQNCY Network", "FRQNCY topic graph", "frqncy.network"
- All 1,116 sitemap URLs returning 200 status
- Knowledge Graph card visible on brand search (Day 60-90)

### Tier B · Engagement *(target: visible Q4)*
- Telegram: 1,000 subs
- Newsletter: 1,500 subs
- Direct traffic > organic by Q1 next year (signals brand awareness > search reliance)
- 10+ live podcast appearances cumulatively

### Tier C · Network effects *(year 2)*
- 50+ inbound links from non-FRQNCY-owned domains
- Wikipedia entry live, ≥3 citations from other Wikipedia pages
- Aligned media (other Substacks, Telegrams, YouTubes) citing FRQNCY without prompting

---

## Cross-references — where the detailed work lives

| File | Purpose |
|---|---|
| `audits/seo/CURRENT-STATE.md` | Where the SEO program is today |
| `audits/seo/PHASE-1-DISCOVERY.md` | Initial discovery audit |
| `audits/seo/PHASE-2-TECHNICAL.md` | Technical SEO foundation (mostly shipped) |
| `audits/seo/PHASE-3-CONTENT.md` | Content depth program |
| `audits/seo/PHASE-4-AI-DISCOVERABILITY.md` | AI citation work |
| `audits/seo/PHASE-5-DISTRIBUTION.md` | Backlinks + Wikipedia + earned media |
| `audits/seo/PODCAST-OUTREACH-KIT.md` | Pitch variants + brand collision notes |
| `audits/seo/PODCAST-TRACKER.md` | Running outreach tracker |
| `audits/seo/MENTION-MONITORING.md` | Brand-collision tracking |
| `audits/seo/METRICS.md` | KPI definitions |
| `audits/seo/SEO-PLAYBOOK.md` | The umbrella playbook |
| `proposals/PODCAST-OUTREACH-PLAN.md` | This plan's pitch-execution layer |
| `proposals/TELEGRAM-CHANNEL-LAUNCH.md` | TG channel playbook |
| `proposals/SPECS-INTEGRATIONS.md §9` | The visibility-from-notebook slot waiting for input |

---

## Awaiting input

Two pieces would make this plan sharper, currently blocked on Orlando:

1. **The notebook content** that triggered task #78. There's specific tactical material in it that we haven't surfaced into this plan — handing it over unlocks the next iteration.
2. **Initial podcast target list approval** — the Tier 1 list above is my best-guess; Orlando should approve or swap based on existing relationships.

When those land, this doc gets a v2.
