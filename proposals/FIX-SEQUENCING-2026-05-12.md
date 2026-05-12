# FRQNCY — Fix Sequencing (2026-05-12)

Punch list bridging `OPTIMISATION-PAPER-2026-05-11.md` (ten-agent audit) and `audits/prod/2026-05-12-prod-audit.md` (live-site probe). Lists only what remains. Each item: effort (S/M/L), impact (1-5), surface, and the smallest viable next move.

## Done in this sweep (2026-05-12)

| Fix | Commit | What |
|---|---|---|
| P0-1 (audit) | `02c2279` | Stripped orphan `#nav-progress-text` / `#nav-pfill` lookups from `updateProgress()` on all six course pages. JS error gone, sidebar progress strip works. |
| P0-2 (audit) | `56aa2c6` | Whitelisted `static.cloudflareinsights.com` (script-src) and `cloudflareinsights.com` (connect-src) in `_headers` CSP. Cloudflare Web Analytics beacon now loads — client telemetry shipping for the first time. |
| P0-3 (audit) | `0ae185f` | Subscribe-overlay scroll trigger moved from `innerHeight * 1.0` to `innerHeight * 3.0` so visitors clear the bubble map before the modal locks the page. sw.js bumped v40 → v41 to invalidate the cached shell. |
| Map blank | `950bf92`, `c55d29b` (yesterday) | t-privacy node added to `HOME_NODES`; cache-buster `?v=2026-05-11a` on every `network-map.js` reference. |

## What's left — sequenced by effort × impact

### Tier A · Cheap and high-leverage (do next)

| # | Fix | Effort | Impact | Surface | Smallest move |
|---|---|---|---|---|---|
| 1 | **D3 preload `crossorigin`** | S | 2 | `<link rel="preload">` on every constellation host page | Add `crossorigin="anonymous"` to the preload tag. Stops the "preload not used" warning + actually warms the cache for the script-tag fetch. ~100ms perceived speedup. |
| 2 | **Promote `<meta description>` into hero copy** | S | 4 | `index.html` `#light-intro` | Insert the existing rich meta-description as a sub-headline under the wordmark. Optimisation paper P0-1 (value-prop void). No new copy required — it's already written. |
| 3 | **Subscribe-overlay headline** | S | 4 | `index.html` `#subscribe-overlay h2` | "You are love and light" is on the voice-playbook exception list, but the optimisation paper called it out as the worst-fit moment. If the new 3.0× trigger doesn't lift conversion, consider a posture-shift to "Stay close" (already on `subscribe-sub`) as the lead. |
| 4 | **Map font sizes (a11y)** | S | 3 | `assets/network-map.js` font-size schedule | Topic 8 → 11 px, subcluster 9 → 12, cluster 9.5 → 13, main 10.5 → 14. Then bump `forceCollide` radius by ~30% so labels don't overlap. WCAG body-text floor is 12 px. |
| 5 | **Map keyboard story** | M | 3 | `v2/explore.html` + `assets/network-map.js` | A11y blocker. Minimum: focusable nodes, arrow-key navigation, enter to open. Bigger lift: tab order across pillars → domains → topics. |

### Tier B · Structural, do after Tier A

| # | Fix | Effort | Impact | Surface | Smallest move |
|---|---|---|---|---|---|
| 6 | **Topic page prev/next + related rail** | M | 4 | `generate.js` template + 60-ish non-bespoke topic pages | Optimisation paper: "topic pages have no prev/next, no related rail." Sibling navigation via the `domain` + `appears_in` graph already in `content.json` / beds. |
| 7 | **Editorial paragraph on auto-generated topics** | L | 4 | YAML briefs in `data/topics/` + Python generator | The 60+ non-bespoke topics average **188 body words**. The bespoke (Layer 2/3) tier averages 1000+. Bridge: write a 100-200 word editorial paragraph per non-bespoke topic and slot it above the resource grid. |
| 8 | **Three thin topic pages** | S | 2 | `v2/robert-jay-gould/`, `v2/quantum-grammar/`, `v2/taoism/` | These three sit a kilobyte below the medium-band floor. Either flesh them out via the bespoke pipeline (YAML briefs exist for 2 of 3) or accept they're intentionally lean and remove them from the bespoke set. |
| 9 | **Pillar-count contradiction** | M | 3 | Hero copy, nav, explore-map legend | The site states 6 / 8 / 146 in different places. Pick one canonical framing for the homepage (Golden Circle says: pillars are HOW, so "eight ways we work" beats "146 maps"). |
| 10 | **Map page strips global nav** | S | 2 | `v2/explore.html` | The explore page is an island. Embedding the global nav loses the "this is a network" thread when visitors land map-first. |

### Tier C · Conversion plumbing (after telemetry confirms baselines)

The optimisation paper's "instrumentation is absent" is now a partial-truth — CSP fix in this sweep means CF Web Analytics fires. But specific conversion events still need wiring:

| # | Fix | Effort | Impact | Surface |
|---|---|---|---|---|
| 11 | Chart generator captures email | M | 5 | `chart.html` + `/api/chart-save` |
| 12 | Membership pricing not placeholder | M | 4 | `/membership/index.html` (needs product decision first) |
| 13 | Fund page LP form | M | 3 | `v2/fund/index.html` |
| 14 | Aligned Goods per-category capture | M | 2 | `/aligned/<category>/` pages |

Defer until items 1-10 land and Web Analytics has produced two weeks of baseline funnel data.

### Tier D · Polish, parked

| # | Fix | Effort | Impact | Surface |
|---|---|---|---|---|
| 15 | Self-host d3 (vs CDN) | S | 1 | Bundles cleanly, removes one external request, but jsdelivr is reliable |
| 16 | Sanctuary visual cohesion | M | 2 | `/my-frqncy/dashboard/` — different typography scale than marketing surfaces |
| 17 | Breadcrumb keeps topic + pillar | S | 2 | `generate.js` topic-page template |

## Sequencing constraints

- **Items 1-5 (Tier A)** are independently shippable. No two depend on each other. Can be done in any order.
- **Item 6 (prev/next)** depends on a `generate.js` edit — high-conflict file. Schedule when no parallel agent is mid-flight.
- **Item 7 (editorial paragraphs)** is the biggest content lift on the list. Either claude-direct (per memory: "Claude does editorial work directly") or YAML-brief pipeline. Don't batch — one domain at a time, like the existing domain-template rollout.
- **Tier C** waits on two weeks of CF Web Analytics data to make decisions evidence-based.

## What this sequence buys

Done well, Tier A + B closes the optimisation paper's three diagnoses:
- "Foundation is sound" — already true, kept.
- "Funnel is leaky" — items 2, 3, 6, 11 plug the four leakiest seams.
- "Topic surface is undernourished" — items 6, 7, 8 raise the floor.
- "Instrumentation is absent" — already fixed today (P0-2) + items 11-14 finish the wiring.

The order is structured so that the next ten commits ship visible homepage + topic-page improvements before any backend conversion plumbing. That preserves the "every teaching lives on the site" editorial principle (CLAUDE.md) and lets the topic graph carry the visitor before the funnel asks for the email.
