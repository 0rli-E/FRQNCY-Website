# FRQNCY Podcast Outreach Plan

*The actionable plan that sits on top of `audits/seo/PODCAST-OUTREACH-KIT.md`. Targets, rhythm, tracking, success criteria.*

*Created: 2026-05-12. Status: ready to execute.*

---

## What this is

The pitch kit (in `audits/seo/PODCAST-OUTREACH-KIT.md`) is the toolbox — pitch variants, brand-collision notes, one-pager. This document is the **operational plan**: who to pitch first, on what cadence, how to track replies, and what counts as success.

**Note on brand collision** (from the kit): always pitch as **FRQNCY Network** or **frqncy.network**, never just "FRQNCY". The unqualified term collides with FRQNCY Media (Atlanta) and gets bounced for audience mismatch.

---

## Pitching targets — three tiers

The kit recommends concentric circles: closest-fit first, expanding outward as the network proves landings.

### Tier 1 — Adjacent-and-friendly *(start here, 10 shows)*

Hosts whose audience already overlaps with FRQNCY's. Highest reply rate. Lowest production cost. Most-likely to land Orlando in the chair.

| Show | Host | Why | Angle |
|---|---|---|---|
| The Stoa | Peter Limberg | Already does curation-of-curators framing | Curation as a moat |
| What is Money? | Robert Breedlove | Sound-money + consciousness crossover | The harness layer |
| Disruptors | Rob Moore | Network-state + entrepreneurship | FRQNCY as network art |
| Aubrey Marcus Podcast | Aubrey Marcus | Wellness + consciousness + capital | Spiritual technology |
| Bankless | David Hoffman / Ryan Sean Adams | DeFi audience, network-state-curious | Curated Crypto / project ratings |
| The Tim Ferriss Show | Tim Ferriss | Long shot, but FRQNCY's structure is Ferriss-shaped | The 6-books treatment as method |
| Modern Wisdom | Chris Williamson | Cross-pillar audience | Editorial bar in algorithm age |
| Lex Fridman Podcast | Lex Fridman | Long shot, but harness work could resonate | Mankind-aligned AI |
| The Network School | Balaji Srinivasan | Direct topical overlap | Settle pillar / network state |
| Forward Guidance | Jack Farley | Macro + bitcoin-curious | Conscious capital |

### Tier 2 — One-degree-removed *(after 3 Tier 1 wins, 15 shows)*

Larger audiences, less-direct fit, but landable once there's social proof.

- The Joe Rogan Experience (impossible, but always ask)
- Diary of a CEO (Steven Bartlett)
- The All-In Podcast
- Acquired (Ben Gilbert + David Rosenthal)
- Huberman Lab
- Tetragrammaton (Rick Rubin)
- This Past Weekend (Theo Von — long-shot but the audience is more conscious than the surface suggests)
- The Daily Stoic (Ryan Holiday)
- The Knowledge Project (Shane Parrish)
- Founders (David Senra)
- Conversations with Tyler (Tyler Cowen)
- The Drive (Peter Attia)
- The Tucker Carlson Show
- The Andrew Huberman live appearances
- Mark Manson's podcast

### Tier 3 — Long arc *(year 2+, dozens)*

The shows that earn coverage by accumulating: regional press, niche YouTube channels, Substack-attached audio. Hand the list to Hermes once it's built.

---

## Cadence

**5 pitches per week.** No more, no less.

- Higher than 5 → quality drops. The pitches stop being personal and start being templated.
- Lower than 5 → momentum dies. Outreach is a flywheel; below threshold it stops spinning.

Send Tuesday-Thursday mornings (9–11am host local time). Skip Mondays (inbox triage), Fridays (deck-clearing).

**Pitch one new show per day, Tuesday-Saturday.** That's 5 fresh pitches + ~5 follow-ups per week. Stop pitching a Tier when you have **3 confirmed bookings** from that tier — focus on producing for the booked ones until taped, then reopen.

---

## Tracking — the spreadsheet that runs the whole thing

Use `audits/seo/PODCAST-TRACKER.md` (already exists) — extend with these columns if missing:

| Column | Values |
|---|---|
| Show | Name |
| Host | Host name(s) |
| Tier | 1 / 2 / 3 |
| Audience size | Episode-average downloads (when known) |
| Sent | Date of first pitch |
| Variant | A (cold full) / B (warm intro) / C (referred) |
| Reply | Yes / No / Not yet (refresh weekly) |
| Status | Sent → Replied → Pre-call → Booked → Taped → Live |
| Follow-up | Date of next planned follow-up |
| Episode URL | When live |
| Backlinks earned | Show notes URL + page weight |
| Subs gained | From episode-attributed sign-ups |
| Notes | Anything to remember for the call |

### Follow-up rules

- **No reply after 7 days** → second pitch, different angle, same thread.
- **No reply after 14 days** → third pitch via a different channel (X DM, LinkedIn, mutual intro).
- **No reply after 21 days** → close the loop, mark as "pass", revisit in 6 months.
- **Polite no** → thank them, ask if they know someone else, log for revisit in 12 months.

---

## What success looks like

| Window | Target |
|---|---|
| Month 1 | 20 pitches sent, 5 replies, 1 booking confirmed |
| Month 3 | 60 pitches sent, 18 replies, 3 episodes taped, 1 live |
| Month 6 | 120 pitches sent, 40 replies, 8 episodes taped, 5 live |
| Year 1 | 200 pitches sent, 70 replies, 20 episodes live |

**Why these numbers:** podcast outreach is a ~10% reply rate, ~30% reply→booking, ~80% booking→taped, ~95% taped→live. Math says 100 pitches becomes roughly 3 live episodes.

---

## The three things that actually move the needle

1. **Be specific in the cold pitch.** Reference a specific episode by number and one specific thread from it. Generic "love your show" pitches get filtered immediately.
2. **Send the FRQNCY one-pager link.** Hosts decide in 90 seconds based on the URL. Make sure `/start-here` or `/about` is the link they get.
3. **Have a fresh angle per quarter.** The same pitch into the same network gets stale. Rotate: Q3 = "curation as moat", Q4 = "the harness layer", Q1 = "spiritual technology", Q2 = "the network state".

---

## Hand-off when Hermes ships

Once the Hermes agent (task #47) is built:

1. Load the full target list into Hermes' queue.
2. Hermes drafts in voice. Orlando reviews and approves before send.
3. Replies route through OpenClaw, which classifies and surfaces.
4. The tracker becomes a Hermes-managed SQLite table; weekly digest auto-posts to Telegram.

Until then: the spreadsheet, the calendar, and 5 fresh pitches every week.

---

## Cross-references

- `audits/seo/PODCAST-OUTREACH-KIT.md` — pitch variants and one-pager
- `audits/seo/PODCAST-TRACKER.md` — the running spreadsheet
- `audits/seo/MENTION-MONITORING.md` — brand-collision notes
- `audits/seo/PHASE-5-DISTRIBUTION.md` — the broader distribution arc
- `proposals/SPECS-AGENTS.md` — Hermes specs
