# Stream 5 — Sync, Storage, Offline, OTA, Media

Research date: 2026-04-29. Synthesised from training data through Jan 2026 plus the existing FRQNCY architectural context. Anything marked **(verify)** should be confirmed against live sources before commit.

## TL;DR

The April 2024 architectural call still holds in 2026 with one downgrade: **skip @capacitor-community/sqlite for now** — for 766 resources + 146 topics, an in-memory FlexSearch index over the JSON you already ship is faster to build, faster to query, and removes a native-build headache. Keep `@capacitor/preferences` for small KV, `@capacitor/filesystem` for the bundle blob, and add `@capgo/capacitor-updater` for OTA plus `@capgo/capacitor-downloader` (or `capacitor-blob-writer` as a smaller alternative) for media. Service workers in WKWebView under App-Bound Domains are still effectively a no-go for FRQNCY's case — don't fight it; the stale-while-revalidate SyncManager you already have is the right shape.

## Recommended sync architecture (prose)

The current SyncManager (cold-start + resume polling of `/content-version.json`, ETag conditional GET, stale-while-revalidate) is the right primitive — keep it. Layer three things on top: (1) a **content bundle pipeline** where `build-manifest.mjs` emits a single `bundle.json` (search.json + resources.json + content.json merged + a `version` field) plus a sharded variant `bundle/<topic-slug>.json` for lazy-loaded topic detail, all behind ETag and Cache-Control immutable URLs on Cloudflare Pages; (2) an **install-time hydration step** where on first launch the app reads the bundle from the embedded assets dir (shipped with the binary) so cold-start is offline-capable on day zero, then SyncManager replaces it from network when newer; (3) a **media manifest** separate from the content bundle — list of `{id, url, bytes, sha256, moment, topicSlug}` so the downloader can prefetch by `moment` (morning/evening/stillness/release) without re-fetching content JSON. Conflict resolution is unnecessary: content is read-only from a single source of truth (frqncy.network), so last-write-wins on the server is sufficient and the client just mirrors. Background sync should fire on app resume and once per 12h via `@capacitor/background-task` (iOS BGAppRefreshTask) — `@transistorsoft/capacitor-background-fetch` is overkill for a read-only content app and adds licensing complexity.

## Recommended storage stack

| Concern | Plugin / service | Why |
|---|---|---|
| Small KV (settings, sync cursors, last-version, ETags) | `@capacitor/preferences` | Native, encrypted-at-rest on iOS, zero config |
| Content bundle on disk (~1 MB JSON) | `@capacitor/filesystem` (Documents dir) | Survives app updates, single-file write/read, no ORM overhead |
| Search index | **FlexSearch** (in-memory, built at startup) | 766 resources + 146 topics fits in <10 MB heap; <50ms build; sub-ms query; no native plugin |
| Media files (audio MP3/AAC, video MP4) | `@capacitor/filesystem` + `@capgo/capacitor-downloader` | Resumable, progress events, background-friendly on iOS |
| OTA web-bundle updates | `@capgo/capacitor-updater` (Capgo cloud or self-hosted CDN) | Active maintenance, Capacitor 7 support, Apple-policy-compliant |
| Version manifest hosting | Cloudflare Pages (existing) | ETag works, free tier covers it, edge-cached |
| Media origin | Cloudflare R2 (audio) + Cloudflare Stream (video) | Zero egress on R2, Stream handles HLS/DRM/thumbs |
| Background sync | `@capacitor/background-task` (built-in) | Avoids transistorsoft licensing; iOS BGAppRefresh limit (~15 min) is fine for content polling |
| Encryption at rest | OS-default (iOS Data Protection class C) | Wellness content is non-PII, non-regulated; Calm/Headspace don't custom-encrypt media |

**Why drop SQLite (for now):** @capacitor-community/sqlite is still maintained as of late 2025 **(verify)** and FTS5 still works, but: (a) it's a native plugin so Capacitor major-version upgrades have historically lagged a few weeks; (b) build complexity on iOS (sqlcipher linking) eats hours; (c) at 766 rows FTS5 is a solution to a problem you don't have. Revisit when resources cross ~10K or you add user-generated content (notes, journal entries) that needs structured queries. For UGC down the road, op-sqlite is the better choice — it's faster than @capacitor-community/sqlite and has cleaner Capacitor 7/8 support **(verify)**.

**Why service workers stay banished:** Apple's App-Bound Domains (declared via `WKAppBoundDomains` in Info.plist) is what unlocks SW + IndexedDB persistence in WKWebView, but it limits you to 10 declared domains and still has known issues with cache eviction and lifecycle on app backgrounding. For FRQNCY's content model — small JSON, occasional update — you get nothing SW would give you that the SyncManager doesn't already give you, with less debugging surface. Stay with the manual fetch + ETag pattern.

## Media tier cost estimate at 10K MAU

Assumptions: 10K monthly active users, 50 MB/user/month average egress, ~70% audio / 30% video, ~30% cache-hit at edge for audio (returning users re-stream same tracks).

- **Storage:** ~500 GB total origin (assume catalog grows to 1K audio files + 200 video loops). R2: 500 GB × $0.015/GB-month = **$7.50/month**. Stream: $5/1K minutes stored — for 200 short loops × 2 min = 400 min stored = **$2/month**.
- **Egress:** 10K × 50 MB = 500 GB/month total. R2 egress: **$0** (this is the killer feature). Stream delivery: $1/1K minutes delivered — 30% of 500 GB at ~10 MB/min = ~15K min delivered = **$15/month**.
- **Total media: ~$25/month** at 10K MAU. Compare:
  - Bunny.net: ~$0.005/GB egress × 500 GB = $2.50/month egress + $0.01/GB storage = **~$8/month** — cheaper but no native HLS-with-DRM equivalent for video without going to Bunny Stream (~$10/1K minutes delivered).
  - S3 + CloudFront: ~$0.085/GB egress on first tier = **~$42/month egress alone**. Don't.
  - Mux: ~$0.005/min delivered, premium DX, ~$75/month at this scale. Skip unless you need analytics.

R2-for-audio + Stream-for-video is the right call. Bunny is a fine fallback if Cloudflare ever changes terms.

## OTA platform recommendation

**Use @capgo/capacitor-updater, self-host the bundle on Cloudflare Pages.** Rationale:

- **Appflow is dead.** Ionic announced sunset (cease new accounts late 2024, full shutdown through 2025) **(verify exact dates)**. Existing customers were migrated or churned.
- **Capgo** is the active community-maintained alternative — Capacitor-first, well-documented live-updates flow, built-in version pinning and channel-based rollout, Apple/Google policy-compliant when used for *web-asset* updates only (no native code, no behaviour changes that bypass review). Pricing: free self-hosted, ~$12/month for managed cloud at FRQNCY's scale **(verify)**. The plugin is open source so you can self-host — point it at a Cloudflare Pages bucket of `bundle-<version>.zip` files plus a `latest.json` manifest, and you pay $0 in OTA infra.
- **Capawesome** has a paid Cloud Live Update product but it's a smaller ecosystem; Capgo has more battle-testing.
- **DIY** is what self-hosted Capgo essentially is — don't roll your own when the plugin handles signature verification, rollback, and version-pinning for free.

Apple compliance note: keep OTA strictly for HTML/CSS/JS/JSON/static media. Don't ship native plugin updates this way. Don't materially change app behaviour from what was reviewed. Capgo's docs cover this — follow them.

## Top 5 citations

1. `https://github.com/capacitor-community/sqlite` — plugin status, FTS5 docs, Capacitor compat matrix
2. `https://capgo.app/docs/live-updates` — OTA flow, self-hosting guide, Apple policy compliance
3. `https://developers.cloudflare.com/r2/pricing/` — zero-egress pricing model (vs S3 for the cost case)
4. `https://developers.cloudflare.com/stream/` — HLS delivery, per-minute pricing, DRM options
5. `https://webkit.org/blog/10882/app-bound-domains/` — original WKWebView App-Bound Domains spec; still the canonical doc for what you can/can't do with SW + ITP under App-Bound

## Open questions

- Confirm @capacitor-community/sqlite has shipped a Capacitor 7 release (last I'm sure of: late 2025 work-in-progress). If yes, the "drop SQLite" call should be revisited if Orlando wants UGC sooner.
- Confirm Capgo's current managed pricing tier and whether self-hosted bundle signing requires a paid key.
- Should the media downloader prefetch by `moment` field on first launch, or wait for explicit user action? 109/766 tagged means the moment-based UX is partial — does the roadmap include backfilling the other 657, and if so the prefetch logic shouldn't ship until that's done.
- LRU eviction policy for media: bytes-based (cap at 500 MB total) or recency-based (drop anything not played in 30d)? Recommend bytes-based with a user-visible "Storage used: X MB / Clear" affordance — Apple HIG-friendly.
- Does FRQNCY want signed media URLs (R2 supports them via Workers + presigned URLs) or is content fully public? If signed, that's a Worker to write and a token-refresh pattern in the app.
- Encryption at rest: confirmed not needed for content, but if user notes/journal arrive (V2 social), revisit with SQLCipher or iOS Keychain-wrapped per-file keys.
