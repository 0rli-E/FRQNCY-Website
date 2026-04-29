# Stream 1 — Capacitor Ecosystem Refresh (April 2026)

## TL;DR

Capacitor 8 shipped (current; 8.0.2 released 27 Jan 2026), there is no Capacitor 9 yet, and the upgrade is real but small enough to do in a sprint — the headline costs are bumping minSdk to 24, compileSdk/targetSdk to 36, and Java to 21 (you're already there). Appflow is dead-walking — discontinued for new customers, EOL 31 Dec 2027 — so any "live updates" plan now means **Capgo** (incumbent OSS leader) or **Capawesome Cloud** (faster M4 builders, integrated native builds + store publishing). The single biggest architectural smell in the FRQNCY app is using `server.url` to load `frqncy.network` directly: that pattern is officially discouraged for production, has a documented App Store rejection risk, and should be replaced by either an iframe inside the local bundle or a pre-warmed WebView pattern with `allowNavigation`.

## Key findings

- **Capacitor 8 is current; no 9 in sight.** Announced as the latest major; CHANGELOG and releases page show 8.0.2 on 27 Jan 2026 with no 9.x branch. Support policy keeps two majors current, so 7.x is still patched but is now the older line. Move when convenient, not panic-mode.
- **Capacitor 8 breaking changes that matter to FRQNCY:** minSdk 24 (you're on 23 — one device-class loss, mostly Android 6 holdouts), compileSdk/targetSdk 36, Gradle 8.14.3 + AGP 8.13.0, Android Studio Otter (2025.2.1) or newer, Java 21 (already aligned). New default for iOS is **Swift Package Manager**, but existing CocoaPods projects keep working. The `android.adjustMarginsForEdgeToEdge` flag is removed in favor of a new System Bars core plugin + CSS env() variables — relevant to the bedside/alarm full-screen screens.
- **Hybrid routing — `server.url` is the wrong default for production.** Capacitor docs and the team's own GitHub discussions repeatedly state `server.url` was meant for live-reload, not production, and has triggered App Store rejections. The community-recommended pattern is: ship a local bundle, render the remote site inside an iframe (or a `Browser.open()` for fully-external content), and use `server.allowNavigation` to whitelist `frqncy.network` so deep links don't bounce out to Safari/Chrome. Custom scheme handlers are still in use but Android WebView 117+ broke path mutation, so they're a last resort.
- **Plugin ecosystem health (verified via npm + GitHub):**
  - `@mediagrid/capacitor-native-audio` — last npm publish 23 Jan 2026, supports background audio + lockscreen notification. Healthy. Best fit for FRQNCY's wake/sleep audio.
  - `@capacitor-community/sqlite` — 7.0.0 (Capacitor 7) on 31 Jan 2025, 7.0.1 patch on 2 Jul 2025; **no Capacitor 8 release listed yet** as of late April 2026 — flag this if you upgrade. Maintained by Robin Genz (also runs Capawesome).
  - `@capgo/capacitor-video-player` — single-major-version policy, tracks latest Capacitor. Active.
  - `@capgo/capacitor-downloader` — npm page literally says "under development, not yet ready for production." Avoid until it stabilises; use `@capacitor/filesystem` + fetch for now.
  - `@transistorsoft/capacitor-background-fetch` — Snyk rates "Sustainable" maintenance, recent npm releases, but no PR/issue activity in the last month. Commercial license model. Works, but not the most lively repo.
- **WebView performance in 2026 — the same issues as 2024, but the floor has risen.** Modern Android WebView and iOS WKWebView ship hardware-accelerated CSS and JIT JS engines that are "close to native" for content rendering. The pain points haven't moved: heavy DOM mutation on the main thread, complex gradient/blur stacks, and large background images cause Android frame drops more than iOS. Pre-warming the WebView, using `content-visibility: auto`, avoiding shadow-heavy CSS on the bedside screen, and lazy-loading images are still the levers.
- **Live updates landscape:** Appflow discontinued; existing customers have until **31 Dec 2027**, no new features. **Capgo** (open-source plugin + cloud, ~449M updates served in Feb 2025, supports Capacitor 5–8 + Electron) is the biggest community option. **Capawesome Cloud** (same maintainer as `@capacitor-community/sqlite`) bundles live updates + native builds + App Store submission, free tier exists, paid starts ~$7/mo first year. Both are credible.
- **CI/CD in 2026 — three live patterns.** GitHub Actions + Fastlane is the cheapest DIY path (~$1.20/build for a 15-min iOS run on private repos). Codemagic is the "EAS for Capacitor" — purpose-built, has a maintained `codemagic.yaml` reference for Capacitor projects, and is cited by teams that migrated off Appflow as cutting build times from 40 min to ~5–6 min. Capawesome Cloud Native Builds is the newer entrant if you want builds + live updates from the same vendor.

## Recommended approach for FRQNCY

Stay on Capacitor 7 through Q2 2026, then plan the Capacitor 8 bump as a focused 1–2 day chore in early Q3. The migration is small (minSdk 23→24, compileSdk/targetSdk 35→36, AGP/Gradle bump, AS Otter+, Java already 21), but `@capacitor-community/sqlite` doesn't yet publish a 8.x line — gate the upgrade on either that landing or you confirming you don't need SQLite. Don't switch the iOS project from CocoaPods to SPM in the same PR; defer.

The architectural priority is the routing layer, not the version bump. If FRQNCY is currently using `server.url` to point at `frqncy.network`, replace it before the next App Store submission: keep a tiny local `index.html` shell that mounts `frqncy.network` in an `<iframe>` with `allowNavigation: ["frqncy.network", "*.frqncy.network"]` whitelisted, and route all wake/sleep/alarm/bedside/settings screens to local HTML files via the shell. The iframe pattern preserves your "live content, local native" split without tripping App Store reviewer concerns, and lets the FrqncyAlarm plugin keep its hooks into the local context.

For audio, install `@mediagrid/capacitor-native-audio` when you're ready to lift the one-at-a-time freeze — it's the healthiest option and matches the wake/sleep alarm use case (background playback + lockscreen controls). Skip `@capgo/capacitor-downloader` until it leaves WIP; do downloads via `@capacitor/filesystem` + fetch.

For OTA + CI, go with **Capgo for live updates + GitHub Actions for builds** as the cheapest credible stack. If you'd rather not run the GHA + Fastlane plumbing, **Codemagic** is the pragmatic single-vendor swap — its Capacitor `codemagic.yaml` template is maintained and the migration stories are public. Capawesome Cloud is a reasonable bet-the-company alternative if you want one vendor for builds + updates + store publishing, but it's younger and more concentrated risk.

Don't add Sentry/New Relic-style monitoring before you've got the iframe shell stable — instrument once, on the new architecture.

## Top 5 citations

1. https://capacitorjs.com/docs/updating/8-0 — Official Capacitor 8 migration guide (minSdk, Gradle, Java, edge-to-edge, SPM).
2. https://github.com/ionic-team/capacitor/releases — Release timeline confirming 8.0.2 (27 Jan 2026) as current; no 9.x.
3. https://capgo.app/blog/appflow-shutdown-alternative/ — Appflow shutdown timeline + alternatives comparison.
4. https://github.com/ionic-team/capacitor/discussions/4080 — Long-running discussion: `server.url` in production is risky, recommended patterns.
5. https://capawesome.io/blog/alternative-to-appflow/ — Capawesome Cloud feature parity vs Appflow; pricing context.

Supporting:
- https://capacitorjs.com/docs/main/reference/support-policy — Capacitor support policy (two majors).
- https://github.com/capacitor-community/sqlite/releases — Confirms 7.x line, no 8.x as of April 2026.
- https://www.npmjs.com/package/@mediagrid/capacitor-native-audio — Recent publish date (Jan 2026).
- https://blog.codemagic.io/continuous-integration-and-delivery-for-ionic-apps-codemagic/ — Codemagic Capacitor pipeline reference.

## Open questions / things I couldn't resolve

- **Exact Capacitor 8 status of `@capacitor-community/sqlite`** — search surfaced 7.0.0/7.0.1 only. Worth checking the GitHub releases page directly before committing to the v8 upgrade if SQLite is in scope.
- **`@capgo/capacitor-video-player` last-commit recency** — search hit a GitHub render error. The repo exists and the README claims active maintenance, but I couldn't read the commit graph; verify before adopting.
- **Capgo vs Capawesome Cloud reliability head-to-head** — both publish marketing-flavored numbers (449M updates / "3–5x faster builds"). No neutral third-party benchmark surfaced. If FRQNCY is going live-update-heavy, run a 30-day pilot on one before committing.
- **Whether the FRQNCY app actually uses `server.url`** today — Stream 1 is research-only and didn't open the repo. The recommendation above is conditional on that being the current pattern; confirm in the audit stream.
- **Capacitor 9 timeline** — no signal. Historical cadence (6.0 → 7.0 → 8.0) suggests roughly annual majors, so a 9.0 in late 2026 is plausible but unannounced. Don't plan around it.
