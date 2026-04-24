# Plugin roadmap

The initial install is kept minimal — only official `@capacitor/*` plugins that definitely support Capacitor 7. Everything else gets added when we wire the feature that needs it, one plugin at a time, so a single peer-dep conflict can't block the whole install.

## Installed now (Phase 0: shell works)

| Plugin | Purpose |
|---|---|
| `@capacitor/core`, `/cli`, `/ios`, `/android` | Capacitor runtime |
| `@capacitor/app` | Deep links, back button, lifecycle events |
| `@capacitor/browser` | Open external URLs safely |
| `@capacitor/device` | Device info (OEM detection for Android onboarding) |
| `@capacitor/filesystem` | Cache JSON + downloaded media |
| `@capacitor/haptics` | Wake gesture feedback |
| `@capacitor/local-notifications` | Backup notifications for iOS alarm |
| `@capacitor/network` | Offline banner |
| `@capacitor/preferences` | Keys, ETags, manifest hash |
| `@capacitor/splash-screen` | Launch screen |
| `@capacitor/status-bar` | Dark status bar |

## Add in Phase 1 — audio/video playback

```bash
npm install @mediagrid/capacitor-native-audio
```
Long-form streaming + lock-screen controls on both platforms. If this fails with a peer-dep error, try `--legacy-peer-deps` or pin to the latest version that declares Cap 7 support.

```bash
npm install @capgo/capacitor-video-player
```
Native AVPlayer (iOS) + ExoPlayer (Android) for the wake-up video field and sleep visuals.

## Add in Phase 2 — offline media + search

```bash
npm install @capacitor-community/sqlite
```
FTS5 search index over resources.json. Only needed when we build native search (faster than iterating 600+ resources in JS).

```bash
npm install @capgo/capacitor-downloader
```
Resumable downloads of morning/evening audio for offline use. Only needed when we add the "save for offline" feature.

## Add in Phase 3 — background refresh

```bash
npm install @transistorsoft/capacitor-background-fetch
```
iOS BGAppRefreshTask + Android WorkManager, ~15-min cadence for content manifest polling. Optional — the app syncs on cold start and resume anyway. This just makes first-launch-after-update feel instant.

## Explicitly NOT installing

- **`@jofr/capacitor-media-session`** — declared Cap 4 as peer, broke install. Not needed because `@mediagrid/capacitor-native-audio` already provides `MPNowPlayingInfoCenter` (iOS) and `MediaSessionCompat` (Android) wiring internally.
- Community plugins with no Cap 7 support declared in `peerDependencies` (check before adding).

## Troubleshooting peer-dep errors

If `npm install` fails with EREVOLVE:
1. Read which plugin declares the old peer dep.
2. Check the plugin's GitHub — has it been updated for Cap 7? If so, bump the version in package.json.
3. If no Cap 7 release exists, either (a) find an alternative plugin or (b) install once with `--legacy-peer-deps` and test carefully.
4. Avoid installing many plugins at once during setup — add one, verify build, add the next.
