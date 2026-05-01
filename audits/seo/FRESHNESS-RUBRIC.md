# FRQNCY Freshness Rubric

**Purpose.** Make freshness operational across 145+ topic pages and 750+ item pages. Without a written rubric and a calendar, evergreen content quietly decays as competitors update theirs and Google reads "stale" through `dateModified` and link-graph signals.

**Owner.** Editorial. Picks committee per `editorial-standards/§3` reviews; founder retains veto over removals.

**Cadence.** Every topic page gets reviewed at least once a year. Fast-moving topics get reviewed quarterly. Item pages (books, people, orgs, media, places) get reviewed on a 24-month rolling cycle unless the picker flags one for early review.

---

## Why freshness is more than a tag

Freshness is three signals at once:

1. **`dateModified` in the page's Article schema** — Google reads this directly.
2. **The git mtime of the file** — Google's other heuristic (and the one we can't fake without lying).
3. **The reader experience** — outdated facts, broken external links, or a recommendation that no longer holds.

A real freshness review touches all three. Updating only `dateModified` while leaving stale prose is reward-hacking, not editorial work. Don't.

---

## The two cadences

### Quarterly — fast-moving topics

Subjects where 3-12 months produces meaningful change in the field. The list of fast-moving topics for FRQNCY:

- `artificial-intelligence`
- `cryptocurrency`
- `defi`
- `decentralized-networks`
- `blockchain`
- `ar-vr`
- `biotechnology`
- `crispr` (under biotechnology umbrella; review jointly)
- `quantum-computing` (if topic; under technology)
- `psychedelics` (medicalization status changes fast)
- `network-state`
- `regenerative-finance`
- `climate` (data refreshes annually but framing shifts faster)
- `bioenergy`
- `ecological-economics`
- `carbon-markets` (if topic)

**Review frequency:** every 90 days.

### Annual — evergreen topics

Everything else. The 130+ remaining topics in `content.json` review once per year on a balanced rolling calendar (one quarter handles ~32 topics).

Subjects where the underlying material is durable: meditation, breathwork, philosophy, music, cuisine, places, history, mathematics, the body of contemplative wisdom, etc. Picks here change rarely; the prose can stay still as long as it's still the best public introduction.

---

## What a review actually does

Each review applies this checklist to one topic page:

### Read the page in full

- Does the meta description still accurately describe the topic? Tighten if not.
- Does the hero copy still represent FRQNCY's position on the subject? If the editorial framing has evolved, update.
- Does the explainer prose contain any factual claim that's stale (e.g., "as of 2023…", obsolete numbers, dead references)? Refresh.

### Check the resources

- Are the listed picks still available? (External URLs alive, books still published, podcasts still releasing, places still operating.)
- Has anything fundamental changed about a picked entity? (Author repudiated their work; product reformulated; org bought out; teacher's framing changed substantially.) If yes — apply the retirement test from `editorial-standards/§5`.
- Are there 1-3 new candidates worth considering? The reviewer flags them for committee discussion; a single reviewer does not unilaterally add new picks.

### Check the cluster

- Does the topic page link back to every resource that resources.json says belongs to it? (See `audits/seo/runs/2026-04-29-phase-2.10-cluster-coverage.md` for the most recent gap list.)
- Do the inbound resource pages link back to the topic? (Phase 2.9.)

### Update the schema

- Set `dateModified` in the Article JSON-LD to today.
- Bump the `<time datetime>` in the byline (per Phase 3.4).
- If the canonical or og:image changed, update those.

### Log the review

Each review appends a one-line entry to a per-topic review log. The log lives in the topic's directory as `_review.md` (or as a YAML frontmatter block in the index.html — TBD on schema). Format:

```
2026-Q3 — Orlando — refreshed prose, retired 1 pick (X), added 0 picks. No resource changes recommended for editorial committee.
```

The log is editorial accountability. It's also what tells next year's reviewer how to triage.

---

## What "fast-moving" really means

Some topics shift fast in the news cycle but slow in fundamentals. Distinguishing:

- **News-cycle fast** — the field's headlines move every week. Don't try to keep up. FRQNCY isn't a news site.
- **Fundamentals fast** — the canonical resources, the framing, or the picks themselves change in 3-12 month windows. **This is what triggers quarterly review.**

Example: AI moves news-cycle fast but fundamentals also fast — every 6-12 months a new tier-1 model or paper rewrites what an entry-level reader should be pointed at. Quarterly review.

Example: Meditation moves news-cycle fast (new app, new study) but fundamentals slow — the canonical works are decades old. Annual review.

Example: Crypto moves both fast — protocols, tokens, regulation, and the canonical reading list all churn. Quarterly.

When in doubt, default to annual. Move a topic to quarterly only when the last annual review surfaced ≥ 3 changes. Move back to annual when two consecutive quarterly reviews surface ≤ 1 change each.

---

## Capacity math

145 topics × 1 annual review = 145 reviews/year. Spread evenly across 4 quarters = 36 reviews/quarter (≈ 12/month).

15 fast-moving topics × 4 reviews/year = 60 reviews/year. Spread evenly = 15/quarter (≈ 5/month).

Combined: ~17 reviews/month, ~4 per week.

A focused review is 30-60 minutes. Total weekly time: 2-4 hours. This scales to one part-time editorial role at the current network size.

When the network grows past ~25 contributors and the picks committee forms, this work distributes naturally — each pillar lead handles freshness for their pillar's topics.

---

## Tools

- **Read the audit reports first.** `audits/seo/runs/2026-04-29-phase-2.10-cluster-coverage.md` lists topics with missing-link issues; review-and-fix at the same time.
- **External link health** — pair with the periodic `link-audit.md` (the existing 2026-04-16 report) so freshness reviews catch dead URLs.
- **The harness `replay` command** — `frqncy-harness replay <conv-id>` against an updated topic page can compare how an LLM summarizes the page before vs after the refresh. Useful for AI-citation freshness.
- **The harness `compress-memory` command** — applied to topic pages would compress them. Don't apply to pages that need editorial flexibility; do apply to skill READMEs or other stable agent inputs.

---

## Out of scope

- **Item pages (books, people, orgs, media, places) on a 24-month cycle.** Reviews here are lower-priority because the content is more stable. Triggered by either: the calendar coming around, or a flagged change (a teacher's framing shifts; a product reformulates).
- **The /aligned/ page.** Reviewed separately on its own pick-committee cadence; freshness here is downstream of pick decisions, not editorial copy.
- **Top-level pages (homepage, /about, /podcast, /space, /membership, /editorial-standards/, /mcp/, /ask/).** These reflect strategy and update when strategy updates — not on a calendar.

---

## When this rubric changes

After two complete quarterly cycles (i.e., 6 months from first run), review whether:

- Quarterly cadence on fast-moving topics is too aggressive (no changes detected) or not aggressive enough (every review surfaces big changes).
- The 15-topic fast-moving list still reflects which subjects actually move.
- Capacity math still works for the available editorial time.

Adjust the rubric and re-baseline.

---

See `QUARTERLY-REVIEW-CALENDAR.md` for the actual schedule of which topics get reviewed when.
