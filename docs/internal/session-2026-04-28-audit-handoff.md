# Session Handoff — 2026-04-28 audit + PDF fix + podcast edit

**Audience:** another agent (Cowork, Claude Code, Cursor, harness, etc.) opening this repo and trying to understand what changed and why.

**TL;DR:** Three pieces of work landed across this session — a PDF download bug fix, a podcast page edit on founder titles, and a full bug/UX audit with 12 critical fixes applied. A folder reorg was scoped and scripted but the user declined to run it. None of the fix commits have been pushed yet *except* the PDF rewrite (committed and pushed as `501fc1c`); everything else is staged in the working tree waiting on a commit the user will run themselves.

---

## 1. PDF download fix (`chart.js`)

**Problem:** "in the generate chart area when you download the pdf the pdf gets cut off and is very unreadable."

**Diagnosis:** five compounding issues — naive pixel slicing cutting result-cards in half mid-line, variable capture width across viewports, JPEG chroma-subsampling halos around white text on the navy background, interactive elements (download button, AI CTA) being captured into the PDF, and no branding.

**Fix:** rewrote `downloadChartPDF()` in `chart.js` (~60 lines → ~230 lines, +198/-30). Approach:
- Build an off-screen clone of `#result-area` at a fixed 760px width into a `position:fixed; left:-10000px` container so capture is viewport-independent
- Strip interactive elements (`#btn-download-pdf`, AI CTA) from the clone before render
- Strip all `id` attributes from clone children to avoid duplicate-IDs in the live DOM during the render pass
- Wait for `document.fonts.ready` + one `requestAnimationFrame` so layout is settled
- Capture with html2canvas at scale 2, then collect safe page-break Y-coords by walking direct children with `getBoundingClientRect()` relative to the clone
- Page-plan loop snaps each cut to the rightmost break ≤ ideal page end (so cards don't get sliced); falls back to a hard cut if no break sits in the ideal window
- PNG output (no JPEG halos), per-chart-type filename (`human-design.pdf` / `gene-keys.pdf` / `birth-chart.pdf`), branded header+footer

**Test:** browser automation wasn't available in the sandbox (no Chromium for arm64, no sudo for apt). Pivoted to a pure-JS unit test of the page-plan algorithm — `outputs/pdf-test/algo-test.js` — 7 scenarios, 17 assertions, all pass. The test mirrors the algorithm verbatim and exercises: single-page fit, multi-page natural break, giant-element fallback, exact boundary, safety-valve termination, empty canvas, and the "break-at-y must skip" guard that prevents an infinite loop when a break coincides with the start of a page.

**Status:** committed (`501fc1c main → main`) and pushed.

---

## 2. Podcast page — Norman Gräter as Co-Founder

**Edit on `podcast.html`:**
- Norman's role badge `Co-Host` → `Co-Host & Co-Founder`
- Norman's bio: prepended `Co-founder of FRQNCY.`
- Norman's image alt text: now reads "co-host and co-founder"
- Orlando stays as **`Co-Host & Founder`** (NOT Co-Founder). The titles are deliberately asymmetric — Orlando is Founder, Norman is Co-Founder. Do NOT flatten them to match.

I initially flattened both to "Co-Host & Co-Founder" in parallel, the user corrected me, I reverted Orlando's title and saved a feedback memory so future sessions don't repeat the mistake.

**Memory saved:** `~/Library/Application Support/Claude/.../memory/project_frqncy_founders.md` — "Orlando is Founder, Norman Gräter is Co-Founder. Asymmetric, not parallel."

**Status:** uncommitted. The change is in the working tree alongside the audit fixes.

---

## 3. Full audit + UX/security pass

User asked: "go through all pages and fix bugs and UI / UX issues. Find the errors first by spawning agents."

**Agents spawned (10 in parallel):**

Bug-hunt (5):
- Core HTML pages (index, search, my-frqncy, chart, podcast, about, courses, start-here, 404, etc.)
- v2/ topic pages + special pages (explore, courses, crypto/explorer, gene-keys, open-source)
- All client + build JS files
- Cloudflare Workers + data files (`functions/api/*`, search.json, resources.json, sitemap.xml, _headers, _redirects, manifest.json, sw.js, package.json)
- Mobile UX + WCAG 2.1 AA cross-cutting review

Folder-structure research (5):
- General JAMstack conventions (Astro, Eleventy, Hugo, 11ty, Next static)
- Cloudflare Pages specific constraints
- Build-time vs runtime separation patterns
- Asset/media organisation
- Docs + project-meta layout (ADRs, internal docs, deploy exclusion)

### 3a. Fixes auto-applied (12 items)

**Security**
1. **`chat-widget.js`** — XSS bypass closed in markdown link rewriter. Old code unescaped `&amp;` then tested for `javascript:` etc. Browser would still decode `&#115;` → `s` at render time, bypassing the test. Fix: full HTML entity decoding (named, numeric, hex) before the protocol test, plus a strict allowlist — only `https?:`, `mailto:`, `#anchor`, or `/relative` paths get rendered. External links also get `noopener noreferrer`.
2. **`functions/api/subscribe.js`** — CORS was `access-control-allow-origin: *`. Now uses an `ALLOWED_ORIGINS` whitelist matching the pattern in `functions/api/crypto/*` (production hostnames + `.frqncy-website.pages.dev` previews + localhost dev). Added `Vary: Origin`. Also replaced the `arguments[0]` anti-pattern in `onRequest` with proper context destructuring.
3. **`sw.js`** — `caches.addAll(PRECACHE)` was atomic; one missing URL bricked the entire install silently. Switched to per-URL `cache.add()` with individual `.catch()` handlers. Single missing precache asset just gets logged.
4. **`robots.txt`** — added `Disallow:` for `/proposals/`, `/docs/`, `/scripts/`, `/AUDIT-REPORT.md`, `/CLAUDE.md`. Cloudflare Pages has no `.cfignore`, so internal docs are technically uploaded; this at least keeps them out of search engines.

**Mixed content (5 → https on served pages)**
5. `v2/open-source/index.html:256` — `http://www.catb.org/...` → `https://`
6. `books/the-cathedral-and-the-bazaar/index.html:243` — same catb.org link, different page
7. `social/space/research/index.html` — both `http://www.righto.com/...` references (lines 149 + 370)

After these, a repo-wide grep across served pages (excluding `/social-src/`, `/proposals/`, `/app/`) returns zero `http://` external links.

**Accessibility**
8. **`my-frqncy.html`** constellation SVG — added `role="img"` + descriptive `aria-label`. Closes the long-standing A1 from earlier audits.
9. **`my-frqncy.html`** `.choice-tile` divs (8 instances across intent + depth radiogroups) — added `role="radio"` + `tabindex="0"` + `aria-checked="false"` + `onkeydown` handler that triggers `selectIntent`/`selectDepth` on Space or Enter. Existing JS already managed `aria-checked` updates.

**Mobile UX (44px tap targets + focus rings)**
10. **`search.html`** — `.clear-btn` 36×36 → 44×44; `.ftab` mobile 36 → 44px min-height; both got `:focus-visible` outline rings.
11. **`chart.html`** — `.ctab` mobile 40 → 44px min-height + focus-visible ring.
12. **`chart.html`** form fields — `autocomplete="bday"` on `#dob`, `autocomplete="off"` on `#tob` and `#tz`.

**Visual / readability**
- **`v2/explore.html`** — `.leg-item` color rgba(255,255,255,0.36) ≈ 4.3:1 (fails WCAG AA) → 0.72 ≈ 8:1 (AA-compliant). Mobile font 8px → 10px so the legend is legible.

**Verification:**
- All 16 audited/modified JS files pass `node --check`
- HTML structural balance (`<main>`, `<body>`) intact on every touched page
- All 742 `sitemap.xml` URLs resolve to files on disk
- Repo-wide grep finds zero `http://` external links remaining in served pages

### 3b. Surfaced for the user's call (not auto-applied)

These are real issues but weren't auto-fixed because they need a judgment pass or affect generated output across many pages:

- **`index.js` event listener leaks** at lines 108 (overlay trapHandler), 191 (global keydown), 203 (scroll). On a static MPA each leaks only over a single page-view's lifetime (navigation tears them down with the document) so impact is bounded, but still a clean candidate for an IIFE-with-cleanup refactor.
- **`v2/explore.html` missing `<main>` landmark** — confirmed in HTML scan. Wrap network-map content in `<main>`.
- **Topic page heading hierarchy** — `generate.js` template emits `<h1>` then jumps to `<h3>` with no `<h2>`. Affects ~150 generated topic pages from one template line.
- **Small-text contrast on dark navy** — `--text-dim` (`#7090B8` on `#0B1C3D`) is ~2.8:1, fails AA for body text. Most usage is intentionally de-emphasised metadata, but worth a `axe` pass.
- **Service worker cache versioning** — `frqncy-v23` is monotonic numeric; every release invalidates the entire cache. Content-hash versioning would preserve unchanged assets between deploys.

### 3c. False positives caught

The earlier `AUDIT-REPORT.md` flagged two issues that weren't actually present:
- `v2/courses/index.html` link to `crypto-fundamentals` — file actually exists at `v2/courses/crypto-fundamentals/index.html`. False alarm.
- "small capp" typos × 19 in `v2/crypto/explorer.html` — 0 matches in current source. Already fixed in a prior pass.

---

## 4. Folder reorganisation — scoped, scripted, declined

The 5 research agents converged on a clean layout: build scripts in `scripts/`, internal docs in `docs/{audits,setup,internal}/`, served paths unchanged. I generated `outputs/reorg.sh` — idempotent, uses `git mv` (preserves history), patches `ROOT = __dirname` constants in moved build scripts to `path.resolve(__dirname, '..')`, updates `package.json` script paths, syntax-checks every moved file.

**Why I couldn't run it from the sandbox:** the bindfs mount blocks file deletions (it can write/edit but not unlink). `mv` requires deleting the source. Verified by attempting `rm` on a sandbox-created file — "Operation not permitted".

**User decision:** "okay forget the reorg for now". The script still exists in `outputs/reorg.sh` if a future agent or session wants to run it. It's harmless to ignore.

**Constraint that informed the design:** Cloudflare Pages has no `.cfignore` mechanism (verified via Cloudflare community thread + workers-sdk issue #3176). The only way to truly exclude `proposals/`, `docs/`, `scripts/` from a Pages deploy is to set "Build output directory" to a subfolder (e.g., `public/`) and move served content into it. That's the textbook-clean answer but it's a much larger restructure with deploy implications. Out of scope for this pass.

---

## 5. State of the working tree

**Committed and pushed:**
- `501fc1c` — `chart.js` PDF download cut-off fix

**Uncommitted but staged in the working tree** (this is what the user will commit next):
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
podcast.html         (Norman as Co-Founder)
AUDIT-REPORT.md      (rewritten with this pass's results)
docs/internal/session-2026-04-28-audit-handoff.md   (this file)
```

**Plus** ~200 unrelated modified files in `git status` from earlier sessions (mostly regenerated `v2/*/index.html` topic pages, `about.html`, `podcast.html`, `sw.js`, `sitemap.xml`). Those are not from this session and the user has explicitly chosen not to bundle them. If a later agent wants to clean those up, do it as a separate diff review.

**Not committed, not staged, by design:**
- `outputs/reorg.sh` (sits outside the project folder anyway)

---

## 6. What a future agent should know

1. **Don't redo the audit** — the agent fan-out covered HTML, v2 topic pages, JS, workers, data, mobile, a11y, and 5 angles on folder structure. If an issue *isn't* in the AUDIT-REPORT.md "Surfaced for your call" list, it's either fixed or a false positive.
2. **The PDF fix is the real test of the page-break algo** — if a regression shows up there, run `outputs/pdf-test/algo-test.js` first; if those 17 assertions pass, the bug is in the canvas-capture path or the clone preparation, not the page-plan logic.
3. **Founder titles are asymmetric** — Orlando = Founder, Norman = Co-Founder. Don't flatten.
4. **Sandbox file ops** — if you're another instance running in the same Cowork sandbox, you'll hit the same bindfs deletion block. Reorg-style operations have to happen on the user's actual machine. Pre-staging files in new locations + a cleanup script is the workaround.
5. **Cloudflare Pages constraints** — `functions/`, `_headers`, `_redirects`, `_routes.json` must live at the deploy output root. Currently the deploy output root *is* the repo root. If anyone proposes `src/` + `dist/`, that means flipping the Pages "Build output directory" setting and is a bigger change than it looks.
6. **Editorial values still apply** to anything user-facing: cooperation over competition, no leaderboards, every teaching lives on the site. See `CLAUDE.md` and `proposals/FRQNCY-VOICE-PLAYBOOK.md`.
7. **The "Makes the unable able" slogan is locked-rejected.** Don't propose it. Hero copy is "A network of people, building their dream life. We invite you to find yourself."

---

## 7. Suggested commit (for the user to run)

```bash
rm -f .git/index.lock .git/HEAD.lock
git add chat-widget.js sw.js functions/api/subscribe.js robots.txt \
        v2/open-source/index.html books/the-cathedral-and-the-bazaar/index.html \
        social/space/research/index.html my-frqncy.html search.html chart.html \
        v2/explore.html podcast.html AUDIT-REPORT.md \
        docs/internal/session-2026-04-28-audit-handoff.md
git commit -m "audit: security, a11y, mobile UX pass

Security: chat-widget XSS allowlist; subscribe CORS whitelist; sw per-URL
cache.add(); robots.txt blocks internal paths.

A11y: my-frqncy constellation aria-label + choice-tile keyboard support.

Mobile: 44px tap targets + focus rings on search/chart.
Visual: v2/explore legend contrast 4.3:1 to 8:1 (AA).
Mixed content: catb.org + righto.com upgraded to https.

podcast: Norman Gräter listed as Co-Founder."
git push
```

---

*Written 2026-04-28. If you read this in a session months later: re-verify items in §3b before acting on them — the codebase moves.*
