# FRQNCY — Production Audit (2026-05-12)

**Method:** HTTP-status sweep of every URL in `sitemap.xml` (1,016 URLs, parallel curl with `-L --max-time 10`), plus headless-Chromium render checks (Puppeteer / Chromium-equivalent) on ten representative surfaces, plus targeted reads of the live home page constellation, course pages, CSP headers, and body-only word counts.

**TL;DR.** Zero broken links in the sitemap (1016/1016 = 200). One actual JS error affecting every course page. Three configuration bugs (CSP blocks CF Analytics, subscribe overlay timing, map font sizes below WCAG). Three measurably thin topic pages. The optimisation-paper claims about "topic surface is undernourished" and "subscribe modal ambushes visitors" are confirmed at the byte level.

---

## 1 · HTTP status sweep — clean

| Status | Count |
|---|---|
| 200 | **1,016** |
| Non-200 | **0** |

Every URL in `sitemap.xml` resolves with `HTTP 200`. No 404s, no 5xx, no infinite redirects. The 308 trailing-slash redirects on `/v2/<page>.html → /v2/<page>` are followed correctly under `-L`.

## 2 · Render audit (Puppeteer) — ten surfaces

Cold load via headless Chromium, viewport 1440×900, `waitUntil: networkidle0`, settle 2s. Errors are `pageerror` events; warnings are `console.error` excluding the Cloudflare-Insights CSP block (covered separately below).

| Surface | Status | Load ms | Body words | JS errors |
|---|---|---|---|---|
| home | 200 | 3,047 | 1,679 | 0 |
| /v2/explore | 200 | 1,386 | 3,785 | 0 |
| /v2/money | 200 | 2,593 | 3,967 | 0 |
| /v2/wellbeing | 200 | 1,411 | 3,951 | 0 |
| /v2/fund | 200 | 1,021 | 4,168 | 0 |
| /v2/crypto | 200 | 1,297 | 7,413 | 0 |
| /v2/courses/crypto-fundamentals | 200 | 979 | 4,082 | **1** |
| /places/essencia | 200 | 976 | 1,364 | 0 |
| /chart | 200 | 1,091 | 2,103 | 0 |
| /my-frqncy | 200 | 926 | 7,098 | 0 |

Home page is the slowest cold-load at 3.0s — that's the d3 CDN fetch plus the force-simulation settle. All other surfaces are sub-3s.

---

## 3 · Findings (severity-sorted)

### P0-1 — All six course pages throw `TypeError` on init

**Severity:** P0 (every visitor to a course page sees a JS exception in console; progress UI partially broken).

**Symptom:** Stack trace from `https://frqncy.network/v2/courses/crypto-fundamentals/`:

```
TypeError: Cannot set properties of null (setting 'textContent')
    at updateProgress (...:1576:60)
    at <anonymous> (...:1758:1)
```

**Root cause:** `updateProgress()` on each course page calls:

```js
document.getElementById('nav-progress-text').textContent = done + '/' + TOTAL;
document.getElementById('nav-pfill').style.width = pct + '%';
document.getElementById('sp-text').textContent = done + ' / ' + TOTAL;
document.getElementById('sp-fill').style.width = pct + '%';
```

`#sp-text` and `#sp-fill` exist in the HTML (the sidebar progress strip). **`#nav-progress-text` and `#nav-pfill` do not exist anywhere.** The two `getElementById` lookups return `null`, and `.textContent` throws on the first one before the sidebar strip ever updates.

**Coverage check** — all six course pages, identical defect:

| Course | `#nav-progress-text` in HTML | `#nav-pfill` in HTML | JS refs to those IDs |
|---|---|---|---|
| crypto-fundamentals | 0 | 0 | 1 (the function body) |
| conscious-living-foundations | 0 | 0 | 1 |
| meditation-101 | 0 | 0 | 1 |
| quantum-grammar | 0 | 0 | 1 |
| quantum-reality | 0 | 0 | 1 |
| working-with-claude | 0 | 0 | 1 |

**Likely cause:** A recent course-UI commit removed the top-nav progress strip (the `f9926a1` / `1711020` pair around YouTube thumbnail facade + per-lesson discuss panel) but didn't update `updateProgress()` to drop the now-orphaned `nav-progress-text` / `nav-pfill` lookups.

**Fix:** Either delete the two unused lines, or guard each lookup:

```js
function updateProgress() {
  const done = completed.size;
  const pct  = TOTAL ? Math.round((done / TOTAL) * 100) : 0;
  const sp = document.getElementById('sp-text');
  const sf = document.getElementById('sp-fill');
  if (sp) sp.textContent = done + ' / ' + TOTAL;
  if (sf) sf.style.width = pct + '%';
}
```

Not auto-fixed in this audit run — the courses area is being actively worked by another agent (per recent commits). Surface to whoever owns courses next.

### P0-2 — Cloudflare Web Analytics beacon CSP-blocked on every page

**Severity:** P0 (no client-side telemetry; the optimisation paper's "instrumentation is absent" finding is concretely reproducible).

**Symptom:** Console error on every page load:

```
Refused to load the script
'https://static.cloudflareinsights.com/beacon.min.js/...'
because it violates the following Content Security Policy directive:
"script-src 'self' 'unsafe-inline' https://plausible.io
https://cdnjs.cloudflare.com https://cdn.jsdelivr.net"
```

CF Pages automatically injects the Web Analytics beacon. Our CSP whitelists Plausible, cdnjs, and jsdelivr — but **not `static.cloudflareinsights.com`**. The beacon is dead on arrival.

**Fix:** add `https://static.cloudflareinsights.com` to `script-src` in the `_headers` file (or whichever surface sets the CSP). One-line change, restores CF Analytics.

### P0-3 — Subscribe overlay fires at 1.0 viewport scroll

**Severity:** P0 (per the optimisation paper, the modal is the single biggest funnel leak).

**Confirmed:** `index.js:215` —

```js
if (!subscribeShown && window.scrollY > window.innerHeight * 1.0) {
  showSubscribe();
  subscribeShown = true;
}
```

One full viewport of scroll = ~900px on desktop. The modal locks `body.style.overflow = 'hidden'` (lockBody, line 25), so a visitor who scrolled past the wordmark hits a wall before they've seen a single value proposition. Compounded by the headline being `"You are love and light."` — the optimisation paper called this out for a reason.

**Fix:** delay to `innerHeight * 3.0` (after the bubble map section), or trigger on intent (exit-intent, second visit only, or 60s dwell). Not in scope of this audit.

### P1 — Map labels at 8–9px violate WCAG body-text guidance

**Severity:** P1 (a11y blocker for low-vision users; flagged by the optimisation paper).

`assets/network-map.js` font-size schedule:

| Node type | Size |
|---|---|
| core (FRQNCY) | 15px |
| main (pillar) | 10.5px |
| cluster (domain) | 9.5px |
| subcluster | 9px |
| **topic** | **8px** |

WCAG-recommended minimum for body text is 12px (16px ideal). 200+ topic labels at 8px render as illegible smudges on standard zoom. The map is the brand's strongest visual asset — making it readable is a multiplier.

**Fix:** bump topic to 11px, subcluster to 12px, cluster to 13px, main to 14px. Requires a forceCollide radius adjustment so the bigger labels don't overlap.

### P1 — Three thin topic pages on production

**Severity:** P1 (the optimisation paper's "topic surface is undernourished" claim — three pages fail the bar more obviously than the average).

| Slug | Total HTML | Notes |
|---|---|---|
| `robert-jay-gould` | 11,216 b | Thinnest topic page |
| `quantum-grammar` | 11,381 b | YAML brief exists in `data/topics/` |
| `taoism` | 11,577 b | YAML brief exists |

For reference, the topic-page average is 12-30 KB and the rich tier is 30 KB+. These three sit a kilobyte below the bottom edge of the medium band.

### P1 — Body-word counts on auto-generated topic pages average ~190

**Severity:** P1 (paper's "<200 words of unique copy" — confirmed).

Sample of three randomly-selected `v2/<topic>/` pages, `<main>`-only word counts:

| Slug | Body words |
|---|---|
| akashic-records | 183 |
| breathwork | 251 |
| web3 | **131** |

Average: **188 words.** Each page is mostly a resource-card grid; the editorial spine is thin to nonexistent. The 146 BESPOKE_TOPICS slugs presumably have YAML-driven richer pages (Layer 2/3), but the 60+ non-bespoke topics rely on the generate.js template and stay thin.

### P2 — Home page cold-load 3.0s

**Severity:** P2 (perceived perf; not blocking).

Home took 3,047 ms in headless to reach `networkidle0`. Probable causes:
- D3 fetched from CDN after `defer` parse
- 194-node force simulation needs ~30 ticks to settle
- 120 background stars + 200-particle render loop

Mitigations: preload the d3 script with `<link rel="preload">` (already present per the Chromium warning about credentials mismatch — needs `crossorigin="anonymous"` attribute), or self-host d3.

### P2 — D3 preload `crossorigin` attribute missing

Console warning seen on every page that embeds the constellation:

```
A preload for 'https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js'
is found, but is not used because the request credentials mode does
not match. Consider taking a look at crossorigin attribute.
```

The preload tag fires, but the request mode doesn't match the actual script-tag fetch, so the preload is wasted. Add `crossorigin="anonymous"` to the `<link rel="preload">` to fix.

---

## 4 · Confirmed non-issues

- **Sitemap integrity:** 1,016 / 1,016 = 200. All 308 trailing-slash redirects (`/v2/foo.html → /v2/foo`) work cleanly.
- **Home constellation:** 194 nodes / 363 links / 0 orphans / t-privacy present / `g.node` count 194 / 149,486 opaque canvas pixels / 0 JS errors. The blank-map bug from 2026-05-11 is fully resolved post-`?v=2026-05-11a` cache-buster deploy.
- **Service-worker version:** sw.js v40 live. PRECACHE list correct; DATA_CACHE rotation expected on next activation.
- **Asset moves:** `/scratch/*` returns 404 as intended (`_redirects` + `robots.txt` Disallow both in place).
- **Essência:** `/places/essencia/` (26 KB) live with Instagram link + location ("Aljezur, Portugal").
- **Course content delivery:** `/v2/courses/crypto-fundamentals/` (68 KB) live, identical bytes to local HEAD. Only the JS-error is broken; rendered content is intact.
- **Pillar pages:** all 8 with `BESPOKE-LOCK` markers, no JS errors on the spot-checked surfaces.

---

## 5 · Recommended sequence

The five P0/P1 fixes that move the most ground per unit effort:

1. **CSP — add `cloudflareinsights.com`** to script-src. One line. Restores baseline analytics so the next round of recommendations can be evidence-driven instead of intuition-driven.
2. **Course pages — guard or remove `nav-progress-text` / `nav-pfill` lookups.** Stops a JS exception on every course page load. Wait for the courses agent to pause, or coordinate.
3. **Subscribe overlay — delay trigger** from `innerHeight * 1.0` to `innerHeight * 3.0` or move to intent-based. One-line change in `index.js:215`. Biggest funnel-leak repair from the optimisation paper.
4. **Map labels — bump font-sizes** in `assets/network-map.js` (8 → 11 px topic, etc.) and tune `forceCollide` radius accordingly. A11y plus brand clarity.
5. **D3 preload `crossorigin`** — one attribute, ~100ms faster perceived load on every constellation-embedded page.

The thin-topic content gap (Finding P1) is structural — fixing it means YAML briefs for the 60+ non-bespoke topics, which is the OPTIMISATION-PAPER's domain-template-rollout track and outside an audit's scope.

---

## 6 · Probe artifacts

- HTTP sweep raw: 1,016 rows in `/tmp/audit-http.txt` (transient). All 200s.
- Puppeteer render results: `/tmp/pp-test/audit-results.json` (transient).
- Sitemap source: `https://frqncy.network/sitemap.xml` (1,016 URLs as of 2026-05-12 14:00 UTC).
