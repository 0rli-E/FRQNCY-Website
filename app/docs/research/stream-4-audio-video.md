# Stream 4 — Audio & Video Plugin Stack for FRQNCY (Capacitor 7/8, April 2026)

## TL;DR

The April 2024 picks still hold, with one upgrade and one caveat: `@mediagrid/capacitor-native-audio` shipped a `3.0.0` major in early 2026 and is the single best choice for FRQNCY's long-form playback, lock-screen controls and built-in fade APIs — keep it. `@capgo/capacitor-video-player` is still the dominant native video plugin, but its versioning is now strictly major-pinned to Capacitor (v7 → plugin 7.x, v8 → 8.0.19 latest) and only the latest major gets fixes, which means a Capacitor upgrade and a video-player upgrade must happen together. For the wake-screen ambient field, an HTML5 `<video>` in the WebView with locally-bundled MP4/WebM is sufficient and avoids loading a heavy native player just for decoration.

## Recommended audio stack for FRQNCY

Pin `@mediagrid/capacitor-native-audio@^3.0.0` (latest, published Feb 2026 with peerDep on `@capacitor/core` ≥ 6, runs on Capacitor 7 and 8 — the repo had its last commit Jan 23 2026). It bundles MediaSession on Android (via `androidx.media3.session.MediaSessionService`, visible in the manifest in the README) and `MPNowPlayingInfoCenter` on iOS, so you do **not** need `@jofr/capacitor-media-session` (still pinned at Cap 6, no Cap 7 release) or the paywalled `@capawesome/audio-player` + `@capawesome/media-session` combo. Mediagrid v3 supports HLS/m3u8 on both platforms (adds ~4 MB to the APK; disable in build if FRQNCY only serves MP3 from R2), exposes a metadata-poll URL for live track updates, and ships a first-class `setVolume(value, duration)` fade API plus `fadeOut`/`fadeOutDuration` flags on `stop()`. For non-music UI sound effects (taps, transitions, short cues that need to overlap background playback), keep `@capacitor-community/native-audio` — it's the right tool for preloaded short samples and is unrelated to mediagrid's long-form engine. Avoid Howler.js: in 2026 it still doesn't survive iOS background, Android Chromium has tightened restrictions further, and you lose lock-screen controls entirely.

## Recommended video stack for FRQNCY

Pin `@capgo/capacitor-video-player` at the major matching your Capacitor (`7.x` if you stay on Cap 7, `8.0.19` if you go Cap 8 — released ~April 2026). It wraps `AVPlayer` (iOS) and `ExoPlayer/Media3` (Android), supports HLS/MP4, fullscreen, subtitles, and PiP on Android API 24+, iPad iOS 13+, iPhone iOS 14+. The community fork at `jepiqueau/capacitor-video-player` (now mirrored at `harmonwood/capacitor-video-player`) is older (v4.1 era) and explicitly marked unmaintained — don't use it. For the wake-screen ambient frequency field, do **not** instantiate the native player; ship a 1080p H.264 MP4 (or HEVC for size) in the local bundle and render with a plain `<video autoplay loop muted playsinline preload="auto">` inside the WebView. Native players add startup latency and don't seamless-loop better than the WebView for short ambient clips. If you need crossfade between two ambient clips, double-buffer two `<video>` elements and animate `opacity`. Reserve `@capgo/capacitor-video-player` only for actual content video (teachings, interviews) where PiP matters.

## Plugin status table (April 2026)

| Plugin | Latest version | Last commit | Cap-7 ready | Cap-8 ready | Recommend | Notes / alternative |
|---|---|---|---|---|---|---|
| `@mediagrid/capacitor-native-audio` | 3.0.0 | 2026-01-23 | Yes | Yes (peerDep `@capacitor/core` ≥ 6) | **Yes** | Long-form playback, lock-screen, HLS, fade APIs |
| `@capgo/native-audio` | 7.x / 8.x (matched majors) | active 2026 | Yes | Yes | Backup | Cap-go's "native engine" rewrite; HLS via media3-exoplayer-hls; fade-in/out booleans (less granular than mediagrid) |
| `@capacitor-community/native-audio` | active | maintained | Yes | Yes | For SFX only | Preloaded short samples, no background, no MediaSession |
| `@capgo/capacitor-video-player` | 8.0.19 (Cap 8), 7.x (Cap 7) | ~April 2026 | Yes (use 7.x) | Yes (8.0.19) | **Yes** | AVPlayer + ExoPlayer, PiP, HLS; only latest major maintained |
| `jepiqueau / harmonwood capacitor-video-player` | 4.x | stale | partial | no | No | Fork, marked not maintained |
| `@jofr/capacitor-media-session` | 4.x | Cap 6 only | No | No | No | Mediagrid covers this need; jofr stalled at Cap 6 |
| `@capgo/capacitor-media-session` | active | maintained | Yes | Yes | Optional | Use only if you swap to capgo's audio engine |
| `@capawesome/audio-player` + `media-session` | active | maintained | Yes | Yes | No | Insiders-only paywall (license key) — skip while solo/$100 budget |
| `@capgo/capacitor-downloader` | matched majors | active | Yes | Yes | **Yes** | Background, resumable, progress events; capgo flags it "under development" but it's the best option |
| `capacitor-plugin-file-downloader` (veluxa) | active | maintained | Yes | partial | Backup | Simpler, no resume |
| `Howler.js` | n/a | n/a | n/a | n/a | **No** | iOS background broken, Android Chromium restrictions, no lock-screen |
| Web Audio API / Tone.js (in WebView) | n/a | n/a | yes | yes | For procedural only | Use for synth/ambient generators while app is foreground; NOT for background playback |

## Volume-curve implementation

Use mediagrid's built-in API, not a JS polling loop. The signature is `NativeAudio.setVolume({ assetId, volume, duration })` where `duration` triggers a native fade — on iOS this maps to AVAudioPlayer's `setVolume(_:fadeDuration:)`, on Android to ExoPlayer volume ramping. For a sleep timer, call `stop({ fadeOut: true, fadeOutDuration: 600 })` (10-min taper). For a wake-up alarm, schedule playback then immediately `setVolume({ volume: 0.0 })` and `setVolume({ volume: 1.0, duration: 60 })`. Only fall back to a 50–100 ms `setInterval` polling tick if you need a non-linear curve (logarithmic, equal-power) the native API can't express — and even then prefer pre-rendering the curve into the audio file. Polling at 50 ms inside JS while the app is backgrounded is unreliable on iOS (timer throttling) and battery-hostile on Android.

## Top 5 citations

1. [@mediagrid/capacitor-native-audio on npm](https://www.npmjs.com/package/@mediagrid/capacitor-native-audio) — v3.0.0, fade-duration API, HLS support
2. [mediagrid/capacitor-native-audio on GitHub](https://github.com/mediagrid/capacitor-native-audio) — last commit 2026-01-23, MediaSession + MPNowPlayingInfoCenter built in
3. [Cap-go/capacitor-video-player on GitHub](https://github.com/Cap-go/capacitor-video-player) — v8.0.19, AVPlayer + ExoPlayer, PiP support
4. [@capgo/native-audio plugin docs](https://capgo.app/plugins/capacitor-native-audio/) — Cap 7/8 matrix, HLS adds 4 MB, fade-in/out flags
5. [Howler.js Android background regression (Ionic Forum)](https://forum.ionicframework.com/t/howler-js-no-longer-works-on-android/240203) — confirms Howler is no longer viable in Capacitor in 2025–2026

## Open questions

1. **Mediagrid v2 → v3 migration cost.** v3 was a major bump in Feb 2026. Do we know if FRQNCY's existing harness audio code uses APIs that changed? Need to read the v3 changelog before committing.
2. **R2 → mediagrid CORS.** Cloudflare R2 buckets need `Access-Control-Allow-Origin` set for HLS manifests; confirm before launch.
3. **iOS PiP for "evening soundscape with visual."** Audio-only PiP isn't a thing on iOS — PiP requires a video track. For an audio + ambient-loop combo, ship a real video file (audio muxed in) so PiP works; if it's only an aesthetic visual, audio-only background playback is the right call.
4. **Capgo downloader "under development" disclaimer.** It's been the best option for ~2 years now — is the disclaimer stale? Verify with a real download test before relying on it for offline soundscapes.
5. **Tone.js worth wiring up?** Only if there's a concrete procedural-audio feature (binaural beat generator, breath-pacer drone) on the roadmap. For pre-recorded long-form, pure native is faster, lighter, and battery-friendlier.
6. **Bluetooth audio-focus edge cases.** Mediagrid claims automatic AudioFocusRequest handling; needs a real headset interruption test (incoming call mid-meditation, AirPods unpair) before launch. No published evidence either way.
