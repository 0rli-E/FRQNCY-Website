# FRQNCY Network — Full Site Audit Report
**Date:** 2026-04-18 | **Audited by:** 5 parallel agents

---

## CRITICAL BUGS (must fix)

### 1. CSS @import ordering breaks fonts on ALL ~130 topic pages
**Files:** All generated v2 topic pages (quantum/, blockchain/, meditation/, etc.)
**Issue:** Google Fonts `@import` appears AFTER a `:root{...}` block. Per CSS spec, `@import` must precede all other rules. Spec-compliant browsers silently ignore it, causing Cormorant and Jost fonts to fail.
**Fix:** In `generate.js`, move `@import url(...)` before the `:root{...}` block, or better yet switch to `<link>` tags in `<head>`.

### 2. Corrupted Twitter URLs in crypto-projects.json
**File:** `v2/crypto/crypto-projects.json`
**Issue:** 5+ project twitter URLs contain a corrupted `abor` substring (e.g., `https://x.com/aaborave` for Aave, `https://x.com/avaborax` for Avalanche, `https://x.com/cronaborsos_chain` for Cronos). Data corruption from Notion sync.
**Fix:** Manual correction of twitter URLs or fix the sync script's text extraction.

### 3. XSS vector in chat widget markdown renderer
**File:** `chat-widget.js` (lines 252-263)
**Issue:** The `md()` function injects `href` values from bot responses directly into HTML anchor tags without sanitization. A malicious bot response with `href="javascript:alert(1)"` could execute arbitrary code.
**Fix:** Sanitize href values, reject `javascript:` protocol URIs.

### 4. Broken course link: Crypto Fundamentals → 404
**File:** `v2/courses/index.html`
**Issue:** Course card links to `crypto-fundamentals/index.html` but the directory doesn't exist.
**Fix:** Create the course page or remove the card.

### 5. Duplicate hamburger buttons on start-here.html (mobile)
**File:** `start-here.html`
**Issue:** Page has its own `.nav-hamburger` CSS + `mobile-nav.js` injecting a second hamburger. Creates two hamburger buttons on screens 641px-768px. The built-in one targets a `.mobile-menu` div that doesn't exist.
**Fix:** Remove the dead `.nav-hamburger` CSS and HTML from start-here.html.

### 6. gene-keys page missing all mobile nav
**File:** `v2/gene-keys/index.html`
**Issue:** Only page across all 177 HTML files missing `mobile-nav.js`, `nav-dropdown.css`, and service worker registration. Mobile users have zero navigation.
**Fix:** Add the missing script/CSS references.

---

## HIGH-PRIORITY BUGS

### 7. Duplicate `<link rel="manifest">` on multiple pages
**Files:** `v2/courses/index.html`, `v2/people/index.html`, `v2/fund/index.html`, `v2/crypto/index.html`, `v2/crypto/projects.html`, all generated topic pages
**Issue:** Manifest link appears twice per page. Root cause is in `generate.js` `head()` function emitting it twice.
**Fix:** Remove duplicate in `generate.js` head function.

### 8. "small capp" typo in crypto explorer
**File:** `v2/crypto/explorer.html`
**Issue:** 19 project entries have `mc:"small capp"` instead of `mc:"Small Cap"`. Displayed directly to users.
**Fix:** Find/replace in explorer.html.

### 9. Stellar duplicated in explorer
**File:** `v2/crypto/explorer.html`
**Issue:** Stellar appears in both "Smart Contract Platforms" and "Payments" chapters with identical data.
**Fix:** Remove duplicate or differentiate the entries.

### 10. Date parsing timezone bug in chart.js
**File:** `chart.js` (line 485)
**Issue:** `new Date(dob)` interprets date strings as UTC midnight, but `getDay()` returns local time weekday. Can show wrong day-of-week depending on user timezone.
**Fix:** Use `new Date(year, month-1, day)` for local time parsing.

### 11. HTML injection risk in generate.js
**File:** `generate.js` (line 452)
**Issue:** `head()` interpolates `title` and `desc` into `<title>` and `<meta>` tags without escaping quotes.
**Fix:** Escape HTML entities in title/description strings.

### 12. Fund page email form is a dead end
**File:** `v2/fund/index.html`
**Issue:** `handleInterest()` only saves to `localStorage`. User emails are silently discarded.
**Fix:** Wire to an actual backend endpoint or at minimum acknowledge the limitation.

### 13. Dark accent colors invisible on dark background
**File:** `v2/crypto/crypto-projects.json`
**Issue:** Bittensor (#000000), Stellar (#000000), Hedera (#000000), Ethena (#1A1A2E), Worldcoin (#1A1A2E) have accent colors that are invisible against the navy (#0B1C3D) background.
**Fix:** Update to lighter accent colors.

---

## MEDIUM-PRIORITY BUGS

### 14. search.html white footer on dark page
**File:** `search.html`
**Issue:** Footer has `background:#fff` while page is dark navy. Jarring visual break.

### 15. explore.html inconsistent nav
**File:** `v2/explore.html`
**Issue:** Uses custom `explore-nav` class with only 4 links. Missing People, Fund, Crypto, About, Podcast, Space.

### 16. index.js dead hamburger code
**File:** `index.js` (lines 180-217)
**Issue:** References `#nav-hamburger` and `#mobile-menu` which don't exist. Dead code.

### 17. my-frqncy.html domain mismatch risk
**File:** `my-frqncy.html`
**Issue:** `'Well-being'` in DOMAINS array may not match `'Wellbeing'` in search.json, causing missed resource matches.

### 18. Chat widget regex breaks in older Safari
**File:** `chat-widget.js` (line 258)
**Issue:** Negative lookbehind `(?<!["=])` throws syntax error in Safari < 16.4.

### 19. Sitemap missing pages
**File:** `sitemap.xml`
**Issue:** 162 URLs but 177 HTML pages. Missing: crypto/explorer.html, crypto/projects.html, my-frqncy.html, chart.html, and others.

---

## OPTIMIZATIONS

### Performance
- **[ALL topic pages]**: Switch Google Fonts from CSS `@import` to `<link>` tags for faster discovery by preload scanner
- **[index.js]**: Particle animation calls `requestAnimationFrame` even when tab is hidden. Gate on `pageVisible`
- **[index.js]**: Network map iterates 1000 human stars 3x per frame. Consolidate to single loop
- **[index.js]**: Scroll listeners (subscribe overlay + nav update) fire every event without throttle
- **[chart.js]**: Large file (~1272 lines) loaded entirely on page load. Lazy-load astronomy calculations
- **[chart.js]**: Dynamic CDN imports happen on page load even if user never generates a chart
- **[my-frqncy.html]**: D3 loaded synchronously without `defer`, blocking parser
- **[sw.js]**: Precache only covers 10 root files. Add v2 section pages for faster offline
- **[chat-widget.js]**: Client sends 20 messages but server trims to 10. Align to save bandwidth
- **[chat-widget.js]**: 3KB of CSS injected inline via JS. Extract to cacheable file

### Consistency
- **[about/space/podcast/platform]**: 300-450 lines of duplicated inline CSS each. Extract to shared stylesheet
- **[crypto section]**: explorer.html has 107 projects (S-F tiers) vs crypto-projects.json with 37 projects (core/strong/watch). Incompatible tier systems create dual-maintenance burden
- **[crypto index.html]**: 12 featured projects hardcoded, won't update when JSON is synced from Notion
- **[Navigation tiers]**: 3 distinct nav structures (root full nav, section minimal snav, topic minimal snav). User loses navigation when entering v2 section
- **[Font loading]**: Different pages load different Cormorant weight subsets. Inconsistent rendering

### Analytics & SEO
- **[Missing Plausible]**: watch/index.html, courses/index.html, crypto sub-pages, course sub-pages all missing analytics
- **[Missing Twitter cards]**: Crypto pages missing twitter:card meta tags
- **[Missing from sitemap]**: At least 15 pages not in sitemap.xml

### Security
- **[functions/api/chat.js]**: In-memory rate limiter is ineffective on Cloudflare Pages (each isolate gets empty Map)
- **[workers/hd-reading.js]**: CORS hardcoded to 2 origins. Preview deployments blocked
- **[generate.js]**: No HTML escaping on interpolated titles/descriptions

### Accessibility
- **[explorer.html]**: Chapter headers clickable but no `tabindex="0"` or `role="button"`. Keyboard inaccessible
- **[ALL pages]**: No skip-navigation link
- **[ALL pages]**: No `<noscript>` fallback
- **[index.html]**: Subscribe overlay modal has no focus trap
- **[podcast.html]**: Host images missing `width`/`height` attributes (CLS)

### Deployment
- **[Git]**: Branch 1 commit ahead of origin/main, needs push
- **[sw.js]**: No automatic cache version alignment with deploys
- **[manifest.json]**: Only SVG icons. Some Android devices require PNG for PWA install
- **[generate-courses.js / generate-watch.js]**: Use relative paths instead of `path.join(__dirname, ...)`. Must run from project root

---

## PRIORITY FIX ORDER

1. Fix @import ordering in generate.js → regenerate all topic pages
2. Fix corrupted twitter URLs in crypto-projects.json
3. Sanitize chat widget XSS vector
4. Fix/remove broken Crypto Fundamentals course link
5. Fix gene-keys missing mobile nav
6. Remove duplicate manifest links (generate.js)
7. Fix "small capp" typo in explorer
8. Fix chart.js date timezone bug
9. Add missing Plausible analytics to 9+ pages
10. Update sitemap.xml with missing pages
