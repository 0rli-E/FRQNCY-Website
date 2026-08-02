# Claude Handoff · FRQNCY · 2026-05-22

A pragmatic note for the next Claude session. Read this first. It tells you the brand architecture, the conventions, what's working, what's broken, and the safe ways to make changes.

## The one-line picture

FRQNCY is a curated topic graph for consciousness. The repo at `/Users/orli/Documents/Claude/Projects/FRQNCY WEBSITE/` builds a static site deployed to Cloudflare Pages at `frqncy.network`, a Capacitor mobile app at `/app/`, and a Cloudflare Worker harness in a sibling folder. The owner is Orlando Eisenreich, building solo + with one co-founder (Norman Gräter).

## Brand architecture · the trine

This is the most important thing to get right, and the framing the rest of the network now hangs on:

- **FRQNCY** = the network · frequency · the Sun · the Father · the broadcast. The topic graph at `frqncy.network`, the harness, the capital layer. The mother brand.
- **NRG** = the social-media layer · energy · the Earth · the Mother · the ground. Lives at `/social/`, currently an Astro SSR build, accumulating connections/dating/interest-matching logic. The receiving body.
- **VBRTN** ("vibration") = the mobile app · the in-between · the Holy Ghost · the spirit moving. iOS + Android Capacitor binary at `/app/`. App Store / Play Store display name. The personal vibration in each individual that connects sun to earth.

This is documented in:
- `proposals/FRQNCY-V1-ROADMAP.md` — "The shape of FRQNCY" section + cross-cutting row
- `proposals/CLAUDE-HANDOFF.md` (this file)
- The auto-memory at `spaces/.../memory/frqncy-brand-architecture.md`

**What does NOT rename with VBRTN:**
- Bundle ID `network.frqncy.app` (changing means relaunching as a new app in stores — loses installs/reviews)
- Java package `network.frqncy.alarm`
- Repo folder names (`FRQNCY WEBSITE/app/`)
- Kotlin/Swift class names like `FrqncyAlarmPlugin`

Trademarks: the v1 roadmap "Legal" section has a fully costed model. Phase 1 (~€5.5k) = FRQNCY NETWORK in EU/US/UK/CN/SG/MY across 5 classes; then FRQNCY, VBRTN, NRG SOCIAL in phases 2-4 totalling ~€18.3k. Do NOT spend €54k now.

## What's live and working

- **Homepage** (`index.html`) — three-chapter narrative (Why · How · What), explore mini-map inside Chapter 3, then the marquee, then 8 Pillars, then Contact. Order was restored on 2026-05-22 (marquee above the bubble map). Network map renders ~287 nodes; D3 is now deferred.
- **/explore** — full network map. Was broken on 2026-05-22 because of 2 typo'd topic IDs in places.json (`t-energy-fields` should be `t-efields`, `t-network-states` should be `t-networkstates`). Fixed at source + defensive filter in `bootMap()` for future drift.
- **245 topic pages** under `/<slug>/index.html` (was 240 — added wellbeing, grounding, longevity, recovery, technology, crystals, stones, homeopathy, plus earlier sculpture, companies, diy, eco-villages, peptides, portals, new-earth, spiritual-technology).
- **312 people, 317 books, 117 orgs, 73 media, 15 places, 8 music, 34 papers** in their respective beds. All emit into entities.json (961 total entries — papers were missing until 2026-05-22 round-2 audit, now wired through `generate.js`).
- **Sanctuary** (`/my-frqncy/dashboard/`) — pyramid, illuminator, Earth Rhythms (Moon Calendar + Mayan Calendar + live Schumann from Tomsk State University), recommended memberships.
- **Two new calendars** — `/moon-calendar/` (13-month Cotsworth/Eastman perpetual, FRQNCY-voice month names: Wolf, Snow, Worm, Pink, Flower, Strawberry, Sun, Buck, Sturgeon, Harvest, Hunter, Beaver, Cold) and `/mayan-calendar/` (Tzolk'in + Haab' + Long Count with live JS converter). Surfaced in the Discover dropdown global nav.
- **Sacred Geometry v2** (`/sacred-geometry/`) — BESPOKE-LOCK applied. 20 sections including the 42-letter Name + full Ana B'Koach prayer with Hebrew transliteration + sefirot mapping, plus the Laws of the Sun film transcript (timestamped quotes from YouTube ID `mG9Hxo8J8J0`), Atlantis/Lemuria/Tartaria honestly-framed. Don't regenerate this — `generate.js` skips it via the lock marker.
- **App** (`/app/`) — Capacitor 7 shell, alarm feature (FrqncyAlarmPlugin in both Kotlin and Swift), wake/sleep/bedside/settings screens. Display name VBRTN; bundle ID still `network.frqncy.app`.
- **VBRTN alarm hardening** is in active development. Look at recent edits to `app/android/app/src/main/java/network/frqncy/alarm/AlarmService.kt` and `AlarmActivity.kt` — there's good engineering happening on foreground-service typing, audio-focus management, full-screen-intent flow, and WebView fallback for cold-start failures. Don't touch unless asked.
- **Harness** sibling repo. The user has gone with `claude-sdk/claude-sonnet-4-6` as default model (see `frqncy-harness/src/config.ts`).

## Conventions to honour

### Repo conventions
- **BESPOKE-LOCK** comment marker — any page containing this string in its first KB is skipped by `generate.js` and `sync-headers.mjs`. Use it for hand-shaped pages (currently: bitcoin, privacy, spiritual-technology, sacred-geometry, etc.). The sacred set is intentional.
- **`_chrome/global-header.html`** is the canonical header. NEVER edit headers inline on individual pages — they'll get overwritten. Edit this file then run `node scripts/sync-headers.mjs` to propagate to ~314 pages.
- **`generate.js`** is the static-site generator. It rebuilds topic pages, beds, sitemap, entities.json, resources.json, search.json. Run after JSON bed edits.
- **`scripts/build-homepage-marquees.mjs`** rebuilds the marquee on the homepage from `leadIds` (currently 25 curated cards). Edit the array then rerun.
- **Auto-memory** at `/Users/orli/Library/Application Support/Claude/local-agent-mode-sessions/.../spaces/.../memory/MEMORY.md` — the brand architecture lives here. Will be auto-loaded into your next session's context.

### Editorial voice
- Lower-case is the default. Don't use title case unless rendering a name or a wordmark.
- Cormorant serif for headlines/quotes, Jost sans-serif for body and metadata.
- Editorial colours: navy `#0B1C3D`, gold `#C4973A`, gold-light `#E0C06A`, cream text `#C8D8F0`, dim text `#7090B8`. Defined in :root vars.
- The voice playbook lives at `proposals/FRQNCY-VOICE-PLAYBOOK.md`. Honour it. The one explicit exception is the homepage subscribe overlay ("you are love and light…") — it's voice-playbook-excepted by founder approval.
- Do NOT use emojis unless Orlando explicitly asks.

### Path conventions
- Use **root-absolute paths** (`/mobile-nav.js`, `/chat-widget.js`, `/favicon.svg`) for sub-page assets. `../../` from 1-deep pages overshoots root and 404s — round-1 and round-2 audits both caught regressions. Be defensive.
- Topic page URLs are root-level: `/<slug>/`. No `/v2/` prefix. The `/v2/` prefix was a staging artefact that leaked into 7 topic pages' canonical/og:url — fixed 2026-05-22 round 1.
- Don't write `href="/<slug>/index.html"` — use `href="/<slug>/"`. Trailing slash, no index.

### Service worker
- `sw.js` versioned. Bump `const VERSION` on any release that changes precached assets. Current: **v57**. Don't precache versioned URLs (`/index.css?v=…`) — the SW will serve the unversioned copy. CSS/JS precache rotates with VERSION; runtime/image cache survives across versions.

### Conventions for fixing bugs
- Run audits in batches via parallel Agent tool calls (`Agent` with multiple parallel invocations in one message). Each agent gets ~300-word report cap to keep context lean.
- After bed changes, always `node generate.js` and verify entity/topic counts in the output.
- For explore-data.json: it gets auto-synced from beds via `generate.js`. The `.js` wrapper exists for `file://` loading (CORS bypass) — regenerate with the wrapper template (see commit history for the Python one-liner).
- Always bump SW VERSION when shipping JS/CSS changes the user must see on reload.

## Current state · 2026-05-22 end of session

**What just shipped (last commit will be ahead of `7d410ce` after the user pushes):**
- 17 round-2 bug fixes (places/all 15 dead cards, mobile-nav.js breakpoint, dashboard mobile-nav.js, newsletter form JSON, donate dead links, HOME_NODES 3 missing clusters, 3 ghost place nodes removed, SW precache cleanup, papers in entities.json, D3 deferred, --text-faint contrast, skip-nav on 9 pages, h3→h2 promotions on podcast + platform, breadcrumb fixes)
- Round-1 bug fixes (30+ issues) committed as `d2a96ea`
- VBRTN rename across mobile app surfaces (capacitor.config.ts, Info.plist, Android strings.xml, etc.)
- Sacred Geometry v2 with BESPOKE-LOCK
- Moon + Mayan calendars + Schumann Earth Rhythms section in Sanctuary
- Legal/trademark section added to FRQNCY-V1-ROADMAP.md
- Norman Gräter headshot replaced

**Important pending work (deferred backlog):**

Tracked in:
- `proposals/BUG-AUDIT-2026-05-22.md`
- Open tasks #42 (time-travel video), #91 (Masonbook YouTube), #94 (trademark filings)

Deferred to a future round:
1. **HOME_NODES (197) vs explore-data.json (287) gap** — homepage mini-map is missing ~90 topic nodes vs the canonical graph. Needs extraction step in the build pipeline. Don't hardcode — drive from `explore-data.json` at build time.
2. **111 orphan `appears_in` refs** across beds — many entries reference pillar/domain IDs (e.g. `d-meta`) instead of topic IDs (e.g. `t-akashic-records`). Decide: allow domain refs in `appears_in`, or normalize to topics.
3. **139 topic pages on old template** — no prev/next nav, no Explore neighbor grid. Latest template is what the most-recent additions use. Run `node generate.js` after deciding whether to regenerate the older ones (some may be hand-shaped and need BESPOKE-LOCK first).
4. **Pillar count consistency** — about.html says 8 pillars, start-here.html says 6, platform.html now says 18 (the real domain count). Pick a canonical number and propagate. 8 is the conventional FRQNCY number (Curate · Education · Research · Media · Sell · Fund · Build · Network State).
5. **WebP conversion** for `images/sylvan-numismatica.png` (4.3MB), `images/topics/crypto-hero.png` (2.7MB).
6. **2.4MB AuthForm.js** in `social/_astro/` — investigate the vendor bundle.
7. **156KB inline script** in `watch/index.html` — extract to a file.
8. **Pillar pages cross-link missing** — pillar hub pages (`/curate`, `/research`, etc.) don't link to sibling pillars.
9. **Membership page is a topic stub** but global nav advertises it. Either build a real page or relabel the nav entry.
10. **Reduced-motion not respected** by the network map — animation continues regardless of `prefers-reduced-motion`.
11. **5 dashboard inputs missing aria-label**.

## Threads in motion

- **VBRTN alarm reliability** — Stream 2 of the alarm work is active. AlarmService.kt has audio-focus management, MediaSessionCompat readiness for Android 16, foreground-service typing. AlarmActivity has WebView cold-start fallback. Don't touch unless explicitly asked.
- **Crypto stack** — BLNC (stablecoin), FRQNY (token), Veto Council, LP / custody / wrappers. Sequenced in `proposals/FRQNCY-CRYPTO-STACK.md`.
- **First physical retreat** — Q4 target, Essência (Portugal). See `proposals/FIRST-PHYSICAL-MILESTONES.md`.
- **Multilingual** — English → German → Chinese → Spanish. Pipeline not started.

## Recent decisions worth remembering

- 2026-05-22 — **VBRTN is the app name** (Vibration). Bundle IDs stay FRQNCY-namespaced.
- 2026-05-22 — **Brand architecture canonised**: FRQNCY (network) / NRG (social) / VBRTN (app) mapped to Sun/Earth/in-between.
- 2026-05-22 — **Trademarks**: 4-phase filing strategy in roadmap doc. Start with FRQNCY NETWORK (€5.5k).
- 2026-05-22 — **Homepage marquee** sits inside Chapter 3 ABOVE the bubble map, not below. Strawberry moon framing kept.
- 2026-05-22 — **Sacred Geometry page** is BESPOKE-LOCKED. Don't regen.
- 2026-05-22 — **Avoid Wikipedia** as a citation source. Pull primary sources (transcripts, the underlying paper, the actual book).
- 2026-05-22 — **34 papers** are now properly in entities.json. `generate.js` was missing the emission.
- Earlier — Mobile app gets the canonical FRQNCY header injected via webview, but the app shell itself is hand-rolled. Don't sync-headers into the `/app/` folder.

## Surface area you can break inadvertently

These are the high-leverage files. Edit with care:
- `_chrome/global-header.html` (changes propagate to 314 pages on next `sync-headers.mjs` run)
- `generate.js` (the static site generator — bugs here ripple through everything)
- `assets/network-map.js` (homepage mini-map render + dataset)
- `explore-data.json` + `explore-data.js` (the wrapper must stay in sync with the JSON)
- `sw.js` (don't add nonexistent URLs to PRECACHE — addAll() will fail; this happened before)
- The bed JSONs (`people.json`, `books.json`, `orgs.json`, `places.json`, `media.json`, `music.json`, `papers.json`, `videos.json`, `studies.json`, `articles.json`, `transmissions.json`, `aligned-goods.json`, `content.json`)

## How to verify after changes

```bash
cd "/Users/orli/Documents/Claude/Projects/FRQNCY WEBSITE"
node generate.js                    # rebuild everything
node scripts/sync-headers.mjs       # propagate canonical header
node scripts/build-homepage-marquees.mjs  # rebuild marquee bands
```

If you've made user-facing JS/CSS changes that need cache eviction:
1. Bump `const VERSION` in `sw.js`
2. Optionally bump `?v=` query strings on the affected `<script>` / `<link>` tags
3. Commit + push (Cloudflare Pages auto-deploys from main)

If the user reports something broken in their browser after a fix is shipped, the cause is almost always:
- Old service worker still serving stale assets → unregister via DevTools or via JS (`navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()))`)
- Browser extension blocking the CDN (TronLink, uBlock, Privacy Badger occasionally bite)
- Local browser cache → hard refresh `Cmd+Shift+R`

The user has a Chrome MCP extension installed. You can drive their actual browser with `mcp__Claude_in_Chrome__*` tools to unregister SWs, navigate, inspect console, etc. This worked beautifully on 2026-05-22 to confirm the explore map was rendering.

## Personality of the work

Orlando moves fast. He drops asks in short conversational bursts. He values:
- Real fixes over cosmetic ones
- Honest framing (don't oversell, don't hide tradeoffs)
- Editorial substance over scaffolding
- The trine, the Sun, the synthesis — not the catalogue

When in doubt, ask whether to fix at the symptom level (quick, defensive) or the source level (proper, slower). He usually picks source level once you put both options on the table.

When you write copy on his behalf, it lands when it's calm, lower-cased, vaguely poetic, and structurally honest. Cormorant italic for the line that's supposed to land hardest.

---

That's it. Pick up the next thread cleanly.
