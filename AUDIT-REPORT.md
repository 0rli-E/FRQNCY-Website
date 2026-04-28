# FRQNCY Network — Code Audit & Fix Report
**Date:** 2026-04-26
**Scope:** Full codebase — HTML (177 files), JS (client + workers + build scripts), data, config
**Method:** 5 parallel audit agents (core HTML, v2 topic pages, JS, workers/data, mobile/a11y) + 5 parallel research agents (JAMstack, Cloudflare Pages, build separation, assets, docs/meta) → fix application → verification.

This report supersedes the 2026-04-18 audit. Earlier-fixed items (C1–C10) are kept in the appendix for traceability.

---

## Part 1 — Fixed in this pass (applied to source)

### Security

**S1 — `chat-widget.js` markdown link XSS bypass**
The `md()` link rewriter only neutralised `&amp;` before testing for `javascript:` / `data:` / `vbscript:` protocols. An attacker could ship `[click](java&#115;cript:alert(1))` — the regex test passed, but the browser decoded `&#115;` → `s` at render time and ran the payload. Replaced with full HTML-entity decoding (numeric `&#NN;` and hex `&#xNN;`) plus a strict allowlist: only `https?:`, `mailto:`, `#anchor`, or `/relative` paths now make it into rendered hrefs. External links also get `noopener noreferrer`.

**S2 — `functions/api/subscribe.js` CORS too permissive + `arguments[0]` anti-pattern**
The endpoint set `access-control-allow-origin: *`, allowing any origin to POST email signups. Now mirrors the pattern in `functions/api/crypto/*` — an `ALLOWED_ORIGINS` whitelist (plus `.frqncy-website.pages.dev` previews and localhost dev), with `Vary: Origin` for correct caching. Replaced `onRequestPost(arguments[0])` with proper context-object pass-through.

**S3 — `sw.js` install can fail silently**
`caches.addAll(PRECACHE)` is atomic — one missing URL aborted the entire install. Switched to per-URL `cache.add()` with individual `.catch()` handlers so a single missing precache asset just gets logged, never bricks the install.

**S4 — `robots.txt` missing internal-doc disallows**
Added `Disallow:` for `/proposals/`, `/docs/`, `/scripts/`, `/AUDIT-REPORT.md`, `/CLAUDE.md`. Cloudflare Pages has no `.cfignore`, so these paths are technically uploaded; robots.txt at least keeps them out of search indices.

### Mixed-content / link hygiene

**M1 — `v2/open-source/index.html:256` and `books/the-cathedral-and-the-bazaar/index.html:243`** — `http://www.catb.org/...` → `https://`
**M2 — `social/space/research/index.html` (lines 149, 370)** — `http://www.righto.com/...` → `https://` (replace_all, both occurrences)

A repo-wide grep now shows zero remaining `http://` external links in served pages (excluding `/social-src/`, `/proposals/`, `/app/` — those are archived or non-deployed).

### Accessibility

**A4 — `my-frqncy.html` constellation SVG** — Added `role="img"` and a descriptive `aria-label` so screen-reader users get a meaningful announcement. (Closes A1 from prior report.)
**A5 — `my-frqncy.html` `.choice-tile` keyboard support** — All 8 radio-group tiles got `role="radio"` + `tabindex="0"` + `aria-checked="false"` initial state + `onkeydown` handler that triggers the click on Space/Enter. The existing `selectIntent`/`selectDepth` functions already managed `aria-checked`, so this now closes the loop for keyboard-only users.

### Mobile UX (tap targets + form polish)

**T1 — `search.html`** — `.clear-btn` 36×36 → 44×44; `.ftab` mobile 36 → 44px min-height (with focus-visible rings on both).
**T2 — `chart.html`** — `.ctab` mobile 40 → 44px min-height + focus-visible ring.
**T3 — `chart.html` form** — Added `autocomplete="bday"` on `#dob` and `autocomplete="off"` on `#tob` and `#tz` (timezone is selected, not autofilled, so off is correct).

### Visual / readability

**V1 — `v2/explore.html` legend contrast** — `.leg-item` raised from `rgba(255,255,255,0.36)` (≈4.3:1, fails WCAG AA) to `0.72` (≈8:1, AA-compliant). Mobile font also bumped from 8px to 10px so the legend is actually legible.

### Verification

- All 16 modified or audited JS files pass `node --check`.
- HTML structural balance (`<main>`, `<body>`) verified intact on every touched page.
- `sitemap.xml` cross-checked: all 742 URLs have a corresponding file on disk.
- Repo-wide grep finds 0 served `http://` external links remaining.

---

## Part 2 — Surfaced for your call (not auto-applied)

**P1 — `index.js` event listener leaks** *(listed by audit; not auto-fixed because the cleanup pattern affects multiple navigation flows and warrants a targeted refactor pass)*
- Line 108 — overlay `trapHandler` only cleaned up on dismissal; if overlay is removed via a different code path, listener stays bound.
- Line 191 — global keydown listener never removed.
- Line 203 — scroll listener accumulated across page reuses.
On a static MPA these leak on a single page-view's lifetime only (page navigation tears the listeners down with the document), so impact is bounded. Still worth a cleanup IIFE per handler — quick and lint-friendly.

**P2 — `v2/explore.html` missing `<main>` landmark** — confirmed by HTML scan. WCAG 1.3.1 region failure. Wrap the network-map content in `<main>`.

**P3 — Heading hierarchy in topic-page template (`generate.js`)** — pages jump `<h1>` → `<h3>` (no `<h2>`). Either demote `<h1>` or insert `<h2>` for the first section label. Affects ~150 topic pages from one template line.

**P4 — Small-text contrast on dark navy** — `--text-dim` (`#7090B8` on `#0B1C3D`) measures ~2.8:1, fails AA for body text. Most usage is for nav links and metadata where reduced emphasis is intentional, but a few sites in the audit (`.name-label`, sub-labels on chart pages) are close to failure. Worth a colour-contrast pass with a tool like `axe`.

**P5 — Service worker cache version is monotonic numeric** (`frqncy-v23`). Every release invalidates the entire cache. Switching to a content-hash versioning strategy preserves unchanged assets between deploys — meaningful win on repeat visits but requires a build-step change.

---

## Part 3 — Folder reorganisation

> **DECISION 2026-04-28: not running.** Inspected `reorg.sh` against current repo state. Risk-to-benefit doesn't justify it: `.github/workflows/build.yml` references `node generate.js` directly, four `package.json` scripts hardcode the same paths, and 13 cross-references across the markdown corpus point at the setup/internal docs by their current root paths. Patching all of that is more work than the aesthetic gain of the cleaner top-level. CLAUDE.md is the navigational entry point; agents and humans both find what they need. Item closed; current layout stays. Re-evaluate only if a `src/` + `public/` + `dist/` separation becomes worth the deploy-semantics change.

**Constraint honoured: no deployed URLs were changed.** Every file currently served stays at its current served path. Only build-time scripts and internal docs are subject to reorg.

The 5 research agents converged on this layout (synthesised from Astro / Eleventy / Hugo / Cloudflare Pages docs / freeCodeCamp / TypeScript-Website / Backstage ADR conventions):

```
FRQNCY WEBSITE/
├── README.md                   ← public-facing (stays at root)
├── package.json
├── _headers / _redirects       ← Cloudflare Pages requires at deploy root
├── functions/                  ← Cloudflare Pages requires at repo root, name fixed
├── manifest.json / sitemap.xml / robots.txt / favicon.svg   ← deploy root
│
├── scripts/                    ← all build-time JS (was scattered at root)
│   ├── build-kb.js
│   ├── build-og.js
│   ├── generate.js
│   ├── generate-courses.js
│   ├── generate-watch.js
│   ├── generate-bed-test.js
│   ├── build-social.sh         (already there)
│   ├── check-links.mjs         (already there)
│   └── sync-notion-crypto.js   (already there)
│
├── docs/                       ← internal — never linked from served HTML
│   ├── audits/
│   │   └── 2026-04-audit-report.md   ← this file
│   ├── setup/
│   │   ├── chatbot-setup.md
│   │   ├── email-setup.md
│   │   ├── setup-checklist.md
│   │   └── setup-next-steps.md
│   ├── internal/
│   │   ├── ideas.md
│   │   ├── codex-tasks.md
│   │   ├── harness.md
│   │   ├── link-audit.md
│   │   ├── name-fixes.md
│   │   ├── nuggets-of-gold.md
│   │   ├── substack-re-engagement-email.md
│   │   ├── vision-strategy-notes.md
│   │   ├── voice-vision-answers.md
│   │   └── voice-vision-questionnaire.md
│   ├── ALIGNED-GOODS-SCHEMA.md (already there)
│   ├── FRQNCY_SOCIAL_RESEARCH_PAPER.md (already there)
│   ├── SEO_PERFORMANCE_AUDIT.md (already there)
│   └── crypto-roadmap.md (already there)
│
├── proposals/                  ← left in place; robots.txt now blocks
├── data files (search.json, resources.json, content.json, …)   ← stay at root: referenced by HTML
├── client JS (index.js, chart.js, chat-widget.js, mobile-nav.js, social-auth.js, sw.js, …)   ← stay at root: linked from HTML
└── all current HTML files      ← unchanged, deployed paths preserved
```

### Why I couldn't run `mv` from the sandbox

The bindfs mount that exposes the project to my workspace blocks file deletions (it can write/edit but not unlink). `mv` requires a delete on the source side, so I couldn't physically move files. Instead I generated a one-shot reorg script that runs on your machine: **[reorg.sh](computer:///Users/orli/Library/Application Support/Claude/local-agent-mode-sessions/c3aab257-136e-4b09-af89-5cad2d1b11b4/6853044b-7e14-4f09-9392-dc35f282d6fc/local_7641bb94-b55e-42f8-b116-17c6b0d2c2fe/outputs/reorg.sh)**.

It is idempotent, uses `git mv` (preserves history), patches the `ROOT = __dirname` constants in each moved build script so paths still resolve correctly, updates `package.json` script paths, and runs `node --check` on every moved file. Re-running it is safe (each step checks for prior state).

```bash
cd "/Users/orli/Documents/Claude/Projects/FRQNCY WEBSITE"
bash "/Users/orli/Library/Application Support/Claude/local-agent-mode-sessions/.../outputs/reorg.sh"
```

### What's deferred

**Asset reorg (`images/people/`, `images/topics/`, `images/og/`)** — the assets agent recommended this but flagged that OG images are referenced by absolute URL in `<meta property="og:image">` and cached by Twitter / Facebook / LinkedIn / Slack scrapers for **weeks**. Moving them breaks every previously-shared link until scrapers re-fetch. Path: leave OG images at their current paths; only nest *new* additions; if you ever consolidate, do it with a Cloudflare 301 from old → new for at least 30 days. Not done in this pass.

**`src/` + `public/` + `dist/` separation** — would require setting Cloudflare Pages "Build output directory" to `public/` and adding a build step. The cleanest long-term layout, but it changes deploy semantics; deferred until you want to invest in it.

---

## Part 4 — Earlier-pass fixes still in effect (2026-04-18)

For traceability — these all remain applied:

- **C1** `functions/api/chat.js` `CORS_HEADERS` ReferenceError on every error path (now passed as parameter)
- **C2** `functions/api/chat.js` rate-limit bypass when IP header absent (fail-closed)
- **C3** `functions/api/chat.js` arbitrary role coercion → strict whitelist
- **C4** `build-og.js` silent CI green on errors → `process.exit(1)` on failures
- **C5** `generate-courses.js` missing `og:type` + image dims → added
- **C6** `generate-courses.js` unvalidated accent hex → `safeAccent()` regex
- **C7** `generate.js` same accent injection issue → `safeAccent()`
- **C8** `social-auth.js` crash on partial Supabase user objects → null guards
- **C9** `index.html` external link `rel="noopener"` → `noopener noreferrer`
- **C10** `my-frqncy.html` D3 `window.open` → adds `noopener,noreferrer`
- **PDF rewrite** `chart.js` `downloadChartPDF` rewritten with element-aware page breaks (committed as `501fc1c`)
- **podcast.html** Norman Gräter listed as Co-Founder; Orlando as Founder

---

## Part 5 — Suggested commit scope

The fixes in Part 1 touched:

```
chat-widget.js
sw.js
functions/api/subscribe.js
robots.txt
v2/open-source/index.html
books/the-cathedral-and-the-bazaar/index.html
social/space/research/index.html
my-frqncy.html
search.html
chart.html
v2/explore.html
podcast.html  (from prior turn — Norman Co-Founder)
```

Suggested commit:

```
audit: security, a11y, mobile UX pass

Security:
- chat-widget: harden href sanitization (entity-decode + protocol allowlist)
- subscribe worker: restrict CORS to whitelisted origins, drop arguments[0]
- sw: per-URL cache.add() with catch — single missing asset no longer bricks install
- robots.txt: disallow internal docs/proposals paths

A11y:
- my-frqncy: constellation SVG role+aria-label, choice-tile keyboard support
- search/chart: 44px tap targets on mobile + focus-visible rings

Visual:
- v2/explore: legend contrast 4.3:1 → 8:1 (passes WCAG AA)
- chart form: autocomplete attrs

Mixed content:
- catb.org, righto.com → https
```

Then run `reorg.sh` as a separate commit so the file moves don't entangle with content fixes.
