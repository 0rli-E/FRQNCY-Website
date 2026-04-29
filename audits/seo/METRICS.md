# METRICS — what to measure, how, and how often

If we don't measure, we don't know if any of this is working. This doc is the dashboard plan.

## The four metrics that matter most

In priority order, the four numbers I care about:

1. **Organic clicks per month** (GSC, Plausible) — the bottom-line number
2. **AI-citation rate per quarter** (manual audit + Plausible referrers) — the bet of Phases 4-5
3. **Topical-cluster coverage** (count of topic-cluster pairs that have bidirectional internal links) — the leading indicator for #1
4. **Editorial cadence** (count of topic pages reviewed/refreshed per quarter) — the input that drives #3

If those four are trending the right way, the rest follows.

## Tooling stack and setup

**Plausible** (already wired). Cost: $9/mo. Privacy-respecting, no cookie banner, works for organic-traffic baseline + referrers + custom goals. Configure goals per Phase 1.4.

**Google Search Console** (Phase 1.1). Free. The only place to see Google impressions, rankings, click-through rates, manual actions, and indexation issues.

**Bing Webmaster Tools** (Phase 1.2). Free. Same data for Bing/ChatGPT-search/Copilot.

**PageSpeed Insights API** (Phase 2.12). Free. Run via GET request; no key needed. Capture monthly.

**Cloudflare Web Analytics or full Cloudflare logs** (already on infra). Free with Pages plan. Use for AI-bot detection (Phase 4.8).

**Mention.com or Talkwalker free tier** (Phase 5.10). Free. Brand-mention monitoring.

**Google Alerts** (Phase 5.10). Free. Brand-mention monitoring.

**Ahrefs / Semrush / Moz** (Phase 1.9). Recommendation defers until manual research breaks down. Trigger: spending >4 hrs/mo on manual keyword work, OR organic monthly impressions exceed 50K.

## The dashboard cadence

### Weekly (Mondays, 15 minutes)
- Open GSC → Performance → last 7 days. Note total clicks + impressions vs prior week.
- Open Plausible → last 7 days. Note unique visitors + top pages + top referrers.
- Skim Google Alerts inbox for the week.
- Skim Plausible referrers for any AI engine origin (perplexity.ai, chat.openai.com, claude.ai, gemini.google.com).
- If anything novel happened (sudden spike, sudden drop), open the GSC Pages report to find which page changed.

Log to `/Users/orli/Documents/Claude/Projects/FRQNCY WEBSITE/audits/seo/runs/weekly/<YYYY-WW>.md` — one paragraph, takes 5 min.

### Monthly (first Monday, 60 minutes)
- Pull GSC last-30-day report; compare to month-before. Note which pages gained/lost most clicks.
- Pull Plausible last-30-day; same.
- Run PageSpeed Insights on the same 10 pages from the Phase 2.12 list. Compare scores against baseline. Alert on any LCP > 2.5s, CLS > 0.1, INP > 200ms.
- Skim sitemap coverage report in GSC. Any pages dropped from "Indexed" to something else?
- Re-check the SAMEAS-MATRIX (Phase 5.3) — any platforms changed? Any new platforms FRQNCY should be on?
- Update the metric trendline file at `audits/seo/runs/monthly/<YYYY-MM>.md` with: clicks, impressions, top-5 pages, top-5 queries, AI-referrer count, PSI scores summary.

### Quarterly (start of each quarter, 4 hours)
- Run the full freshness review pass per `FRESHNESS-RUBRIC.md` and `QUARTERLY-REVIEW-CALENDAR.md` — touches ~30 topic pages.
- Run the AI-citation audit per Phase 4.8 — 20 queries × 4 engines. Capture in `audits/seo/runs/quarterly/<YYYY-QN>-ai-citation.csv`.
- Run the competitive-landscape refresh per Phase 1.7 — has any new competitor emerged? Has anyone closed a gap?
- Update the keyword-landscape doc with current GSC ranking data for the priority 30 topics.
- Review the partner / press / podcast / HARO trackers — what landed, what didn't, what to retry.
- Review the membership funnel if Stripe is live: signups, trial conversion, retention. Membership is downstream of organic traffic.

Write the quarterly review as a one-page exec summary at `audits/seo/runs/quarterly/<YYYY-QN>.md`.

### Annual (start of year, full day)
- Re-read `SEO-PLAYBOOK.md`. Is the strategy still right?
- Re-read every phase doc. Update with what was learned.
- Audit the 30 thinnest pages from current inventory; triage per Phase 3.9.
- Review backlink portfolio: which links earned in the past year? Which lost? Why?
- Set targets for the year ahead: organic-clicks goal, AI-citation goal, partner-link goal, content-cadence goal.

Annual review writes to `audits/seo/runs/annual/<YYYY>.md`.

## Specific metrics and their thresholds

### Organic Clicks per Month

| State | Range |
| --- | --- |
| Baseline (today) | unknown — fill after Phase 1.8 |
| Healthy growth | +20% MoM for 6 months, +5% MoM after |
| Yellow flag | flat or down for 2 consecutive months |
| Red flag | down >10% for 2 consecutive months without explanation |

Source: GSC Performance → "Total clicks" filtered to last 30 days.

### Average Position for Top 30 Priority Topics

| State | Range |
| --- | --- |
| Baseline | most topics absent from top-50 |
| Healthy | average position < 30 by month 6, < 15 by month 12 |
| Goal | 5+ topics in top-3 by year 2 |

Source: GSC Performance → "Average position" filtered per topic page.

### AI-Citation Rate

| State | Range |
| --- | --- |
| Baseline | likely 0/20 queries per engine |
| Healthy | 1+/20 queries per engine within 90 days of llms.txt + MCP discoverability |
| Goal | 3+/20 per engine within 12 months |

Source: manual quarterly audit per Phase 4.8.

### Indexation Rate

| State | Range |
| --- | --- |
| Baseline | sitemap has 757 entries; check GSC Coverage |
| Healthy | >90% of sitemap entries in "Indexed" state |
| Yellow flag | 75-90% indexed |
| Red flag | <75% indexed (something is blocking) |

Source: GSC Coverage report.

### Core Web Vitals (mobile)

| Metric | Pass | Yellow | Red |
| --- | --- | --- | --- |
| LCP | < 2.5s | 2.5-4.0s | > 4.0s |
| CLS | < 0.1 | 0.1-0.25 | > 0.25 |
| INP | < 200ms | 200-500ms | > 500ms |

Source: PageSpeed Insights API monthly + GSC Core Web Vitals report.

### Backlink portfolio quality

| Class | Count today | Year-end goal |
| --- | --- | --- |
| High-authority (DR 70+) | unknown | ≥ 5 |
| Mid-authority (DR 30-70) | unknown | ≥ 30 |
| Total referring domains | unknown | ≥ 100 |

Source: Ahrefs (when subscribed) or manual audit via Google "link:frqncy.network" workarounds.

### Internal-linking density

| Metric | Today | Goal |
| --- | --- | --- |
| Avg internal links per topic page | unknown | ≥ 15 |
| Topics with ≥ 1 inbound link from a non-index page | unknown | 100% of priority 30 |

Source: a periodic crawl + link-graph analysis (build a one-shot Phase 2 task).

## Reporting format

Monthly and quarterly reports follow this template:

```markdown
# FRQNCY SEO — <Period> Report

## Headline numbers
- Organic clicks: <N> (<Δ% from prior period>)
- Organic impressions: <N>
- Average CTR: <%>
- Indexed pages (sitemap coverage): <%>

## Wins
- (3-5 bullets, ideally with cited URL evidence)

## Losses or flat areas
- (1-3 bullets, with hypothesis on why)

## What we shipped
- (cite the audits/seo/runs/ entries from the period)

## What's next period
- (top 3 priorities)

## AI-citation snapshot
(quarterly only — table of 20 queries × 4 engines, % FRQNCY surfaced)

## Trendline
(small ASCII graph or link to Plausible/GSC dashboard view)
```

## What we don't measure (and why)

**Domain Authority / Domain Rating.** Vanity metric. Ahrefs and Moz disagree, neither correlates well with rankings, and chasing DR pulls focus toward link-spam tactics. We measure backlinks for portfolio quality, not for an aggregate score.

**Keyword density.** A 2008 metric. Modern Google uses BERT and semantic similarity. The right unit is "is this page genuinely useful for these queries?", not "does the phrase appear N times?".

**Page count or word count.** More pages and more words don't equal better SEO. The right measure is depth-per-page and cluster density, not gross output.

**Vanity referrals.** Reddit drive-by traffic that bounces in 2 seconds isn't worth optimizing for. Plausible's session-quality signals matter more than raw visit counts.

## When to revisit this doc

After every quarterly review. The metrics that matter shift as the program matures. Year 1 is about indexation + cluster building. Year 2 is about depth + AI-citation. Year 3 is about the press/partner/Wikipedia compound. Adjust thresholds accordingly.
