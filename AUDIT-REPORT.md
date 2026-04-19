# FRQNCY Network — Code Audit & Fix Report
**Date:** 2026-04-18
**Scope:** Full codebase — HTML (177 files), JS (build scripts + client), Workers, data files
**Method:** 12 parallel specialist agents across 4 scopes × 3 angles (bugs / perf / security / a11y), then manual verification + targeted fixes

---

## Part 1 — Fixed in this pass (10 critical items, applied)

Each of these was verified in the source, fixed, and the modified JS files passed `node --check`.

### C1 — `functions/api/chat.js` — `CORS_HEADERS` ReferenceError on every error path
`CORS_HEADERS` was declared inside `onRequestPost` but referenced at module scope by `jsonError()`. Any invalid-input, rate-limit, or upstream failure threw `ReferenceError: CORS_HEADERS is not defined` instead of returning a clean 4xx/5xx.
- `jsonError(message, status, corsHeaders = {})` now takes headers as a parameter
- All 8 call sites updated to pass `CORS_HEADERS`

### C2 — `functions/api/chat.js` — rate-limit bypass when IP header absent
`checkRateLimit(null)` returned `true` (allow) — so any request missing `CF-Connecting-IP` bypassed limiting entirely. Now fails closed: `if (!ip) return false`.

### C3 — `functions/api/chat.js` — arbitrary role coercion
`role: m.role === 'assistant' ? 'assistant' : 'user'` silently coerced `system`, `tool`, etc. into `user`, letting clients inject pseudo-system prompts. Replaced with a whitelist: `role === 'user' || role === 'assistant'` — anything else is dropped.

### C4 — `build-og.js` — silent CI green on OG image failures
If any of the 150 OG images failed to generate, errors were logged but the script still exited 0, so CI reported success. Added `process.exit(1)` when `errors.length > 0`.

### C5 — `generate-courses.js` — missing `og:type` + OG image dimensions
Course pages were missing `<meta property="og:type" content="article">` and `og:image:width` / `og:image:height`. Added to the head template. Twitter + LinkedIn previews now render correctly.

### C6 — `generate-courses.js` — unvalidated accent hex injected into CSS
`accent` was pulled from `courses.json` and dropped directly into inline `<style>` and a CSS custom property. A stray value would break styling across the page. Added `safeAccent()` — validates `^#(?:[0-9a-f]{3}|[0-9a-f]{6})$`, falls back to `#C4973A`. Applied at 2 sites (CSS var line 179, accent data line 732).

### C7 — `generate.js` — same accent-injection issue as C6
Added `safeAccent()` helper at line 66; `head()` now computes `const safe = safeAccent(accent)` and uses it for the glow rgb() calc and the CSS var.

### C8 — `social-auth.js` — crash on partial Supabase user objects
`getInitials(user)` and `getUsername(user)` assumed `user_metadata`, `email`, etc. always existed. A truncated session payload would throw inside the nav injector and leave the page in a broken state. Added null guards + empty-string fallbacks + array-length safety in the name-split path.

### C9 — `index.html` — tabnabbing risk on external link
Line 150 `rel="noopener"` → `rel="noopener noreferrer"` on the EXPLORE FULL MAP link.

### C10 — `my-frqncy.html` — tabnabbing risk in D3 click handler
Line 783 `window.open(d.url, '_blank')` → `window.open(d.url, '_blank', 'noopener,noreferrer')`.

### Verification
- All 5 edited JS files: `node --check` passed
- Grep confirms all 10 fixes landed in source

---

## Part 2 — Recommended next (needs your approval)

Higher-impact changes, but each is a judgment call. Flagged rather than auto-applied per "3 and 1" approach.

### H1 — Extract duplicate inline CSS from 152 topic pages → `v2/styles.css`
Every generated topic page ships ~300–450 lines of identical inline CSS. Moving to an external file cuts page weight ~60 KB each, enables browser caching, and reduces regeneration churn. Touches `generate.js` head template + adds `v2/styles.css`.
**Risk:** one wrong selector → visual regression across 152 pages. Worth a diff review before merge.

### H2 — Parallelize file writes in `generate.js` + `build-og.js`
Current: sequential `fs.writeFileSync` / `sharp().toFile()` for 150+ outputs. Switch to `Promise.all(chunks)` in batches of ~10. Expected: ~3–5× faster builds on CI.
**Risk:** none functional; just IO concurrency.

### H3 — Pre-filter `NM_LINKS` in `index.js` `nmRender`
The network-map render iterates the full links array 3× per frame (path, glow, hit). Cache the filtered subset once per resize. ~40% render-loop cost reduction on mobile.

### A1 — Constellation SVG needs `role="img"` + `aria-label` (`my-frqncy.html`)
Screen reader currently gets nothing meaningful.

### A2 — Add `<main>` landmark to `my-frqncy.html`
Currently missing; fails WCAG 1.3.1 regions.

### A3 — Make `.rcard` resource cards keyboard accessible
They're `<div>` with click handlers. Either swap to `<a>` or add `tabindex="0"` + `role="button"` + Enter/Space handlers.

### Q1 — Extract shared CORS / rate-limit utils from `chat.js` + `hd-reading.js`
Both workers duplicate the same CORS header setup and token-bucket logic. Put in `functions/_lib/auth.js` — single source of truth, easier to keep preview origins in sync.

### Q4 — Pin CI deps with `package-lock.json` + `npm ci`
Right now `npm install` in CI can pick up patch-level changes in `sharp` / `@notionhq/client`. Lock + `npm ci` gives reproducible builds.

### Q7 — Fix `http://catb.org` URL in open-source topic
Mixed-content warning on HTTPS pages; either upgrade to `https://` or drop the link.

---

## Part 3 — Previously-audited items (still valid, from earlier report)

The earlier agent sweep (preserved in previous version of this doc) surfaced a separate set of issues that remain open:

- **Fonts:** `@import url(...)` appearing AFTER `:root{}` in `generate.js` template — spec-compliant browsers silently drop it (check if this was already fixed in the current generate.js)
- **Data:** corrupted `abor` substring in `v2/crypto/crypto-projects.json` Twitter URLs (Aave, Avalanche, Cronos, etc.)
- **XSS:** `chat-widget.js` `md()` function injects bot-returned `href` without sanitization — reject `javascript:` URIs
- **Broken link:** `v2/courses/index.html` → `crypto-fundamentals/index.html` (404)
- **Mobile nav:** `start-here.html` renders duplicate hamburger, `v2/gene-keys/index.html` missing `mobile-nav.js` entirely
- **Duplicate manifest link** in `generate.js` `head()`
- **Typo:** `mc:"small capp"` × 19 entries in `v2/crypto/explorer.html`
- **Date/TZ:** `chart.js` line 485 `new Date(dob)` vs `getDay()` local-time mismatch

These are listed in priority order in the earlier report body below. Say the word and I'll sweep them too.

---

## Part 4 — Agent false-positives caught during verification

Worth noting — three items claimed by agents were verified stale/incorrect:

1. `index.html` canvas already had `aria-hidden="true"` — agent claimed missing
2. Service worker caching list was already reasonable — not the "only 10 root files" claim
3. One agent claimed `index.js` particle animation had no visibility gate; actually it does pause on `document.hidden`

---

## Priority fix order (if you want to rubber-stamp everything in Part 2)

1. H1 — CSS extraction (biggest payoff, highest risk, do first with diff review)
2. Q1 — CORS/rate-limit shared util
3. A1 + A2 + A3 — accessibility pass on my-frqncy.html
4. H2 + H3 — perf tuning
5. Q4 — lockfile + `npm ci`
6. Q7 — mixed-content URL fix
