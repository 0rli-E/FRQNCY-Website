# FRQNCY App — Technical & Product Spec

**Status:** Draft v1, 2026-04-24
**Author:** Orlando (Founder), in session with Claude
**Repo:** `/FRQNCY WEBSITE/app/` — sibling to the existing static site

This document is the source of truth. It was synthesized from 7 parallel research streams covering Capacitor architecture, Android alarms, iOS alarms, background audio/video, offline-first sync, wake/sleep UX patterns from leading apps, and App Store / Play Store submission.

---

## 1. What this is

A mobile app (iOS + Android) that delivers the full frqncy.network experience natively and adds a **wake/sleep** feature — audio and video that tune people into themselves as they wake up and fall asleep. On Android it functions as a full alarm-clock replacement; on iOS it is a "bedside mode" that works when the phone is plugged in and the app is open.

## 2. Core principles (non-negotiable)

- **Cooperation over competition.** No leaderboards, no streaks, no "X days in a row."
- **Inner experience over metrics.** No sleep scores, no readiness numbers, no morning performance readouts.
- **Conviction as self-expression, not ranking.** Users can reflect, not compete.
- **The gesture is the arrival.** Dismissing an alarm is a breath, not a math problem.
- **Un-engaging by design for sleep.** Narration that does not reward attention.

## 3. Architecture

**Hybrid Capacitor 7** — one codebase, two delivery modes:

- **WebView** loads the live frqncy.network for all content pages. Automatic sync: updates to the website appear in the app on next launch, no App Store release required.
- **Local bundle** serves native-feeling screens for `/app/wake`, `/app/sleep`, `/app/alarm`, `/app/bedside`, and `/app/settings`. These are HTML/CSS/JS inside the Capacitor bundle so they load instantly, run offline, and can call native plugins.

A custom scheme handler intercepts `/app/*` paths and serves them from the local bundle; everything else hits frqncy.network over the network.

### Content sync model

```
Cloudflare Pages
├── /content-version.json    — tiny manifest (hashes + publishedAt). Polled on boot + resume.
├── /search.json             — 133 topics. Fetched only when hash changed.
├── /resources.json          — 604 resources. Fetched only when hash changed.
├── R2 /media/{id}.mp3       — audio files. On-demand download.
└── Stream /{uid}.m3u8       — video files. Streamed or downloaded to MP4.

App
├── SyncManager   — polls manifest, ETag-conditional GET for JSON
├── ContentStore  — stale-while-revalidate cache in Filesystem
├── SearchIndex   — SQLite FTS5 for fast search over resources
└── MediaManager  — resumable downloads, LRU eviction, 2 GB default quota
```

No service workers. They misbehave in WKWebView under Capacitor (App-Bound Domains conflict). All caching is native via `@capacitor/filesystem` + `@capacitor/preferences` + `@capacitor-community/sqlite`.

## 4. Technical stack (locked)

| Layer | Choice |
|---|---|
| Framework | Capacitor 7.x |
| Bundler | Vite 5 + TypeScript |
| Audio playback | `@mediagrid/capacitor-native-audio` |
| Media session (lock screen) | `@jofr/capacitor-media-session` |
| Video playback | `@capgo/capacitor-video-player` |
| Downloads | `@capgo/capacitor-downloader` |
| Storage (key-value) | `@capacitor/preferences` |
| Storage (files) | `@capacitor/filesystem` |
| Storage (search index) | `@capacitor-community/sqlite` with FTS5 |
| Background tasks | `transistorsoft/capacitor-background-fetch` |
| Notifications | `@capacitor/local-notifications` |
| Haptics | `@capacitor/haptics` |
| Live updates (local bundle only) | Capgo |
| Alarms | **Custom plugin** (`FrqncyAlarm`) — no off-the-shelf plugin covers both platforms |
| Backend media CDN | Cloudflare R2 (audio) + Cloudflare Stream (video) |

## 5. Alarm implementation

### Android (full alarm replacement)

- `AlarmManager.setAlarmClock()` — the only API that survives Doze and App Standby, shows the status-bar alarm icon, and is exempt from battery optimization.
- Permissions: `USE_EXACT_ALARM` (auto-granted to alarm apps), `USE_FULL_SCREEN_INTENT`, `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MEDIA_PLAYBACK`, `RECEIVE_BOOT_COMPLETED`.
- `AlarmReceiver` → starts foreground service with `mediaPlayback` type within 5s → launches `AlarmActivity` with `setShowWhenLocked(true)` + `setTurnScreenOn(true)`.
- `BootReceiver` on `RECEIVE_BOOT_COMPLETED` rehydrates alarms from local SQLite after reboot.
- OEM detection (Xiaomi/Samsung/Oppo/Huawei/OnePlus) triggers a one-time onboarding screen that deep-links to the correct autostart settings.

### iOS (bedside mode)

Apple has no public alarm API. The realistic shipping pattern, used by Alarmy, Sleep Cycle, Rise, Pillow:

- **Primary:** `UNNotificationInterruptionLevel.timeSensitive` local notification with a bundled 30-second `.caf` sound.
- **Reliability layer:** Silent audio keep-alive via `AVAudioSession(.playback)` — gated strictly to armed-alarm state, not always-on. When fire-time hits, in-process handler swaps buffer for the alarm audio and ramps volume.
- **Backup:** second local notification 60 seconds later with a louder fallback.
- **UX:** "Bedside Mode" screen the user taps before sleep. Clear plug-in-and-keep-app-open copy.
- **Do not pursue Critical Alerts entitlement.** Apple reserves it for medical/safety apps; a wellness app will be denied, and we don't want that framing anyway.

Honest reliability ceiling on iOS: ~95-98% when plugged in, app not force-quit, has been unlocked within 24h. Communicate this honestly in onboarding.

## 6. Wake/sleep UX spec

### Wake screen

- **T−15 min:** ambient audio fades in from 0% over 8 minutes. If HealthKit/Health Connect reports light-sleep phase in the window, start earlier.
- **T−0:** video fades in over 90 seconds — a single slow frequency field drawn from the library. No text, no time display yet.
- **T+45 sec:** audio reaches target volume.
- **Dismiss:** long-press anywhere, held for one full breath (~6 seconds). A subtle ring expands with the inhale. No buttons, no swipe, no math. The gesture *is* the arrival.
- **Post-dismiss (optional, default ON, skippable):** one spoken reflection prompt (10-15 seconds). Tap once for a 3-minute movement piece. Tap again to close.
- **"Return" instead of snooze:** restarts the fade-in from 0. No snooze counter.

### Sleep screen

- Entry: three soft targets — **Stillness**, **Release the Day**, **Let me drift**.
- Minute 0-3: orienting breath or spoken arrival.
- Minute 3-25: primary content. Volume curve starts at 100% and eases to 40% by minute 22.
- Minute 25+: ambient tail, fades to silence by minute 45.
- Visual: screen dims to near-black over first 4 minutes; color temp warms throughout.
- Phone face-down detection pauses the visual; audio continues.
- Auto-end: motion-stillness for 12 minutes OR session completion → fade, screen sleeps.
- **"Release the Day" flow:** 3 spoken prompts with long silences — *"what are you carrying?"* ... *"where did you meet yourself today?"* ... *"what can rest now?"* No input captured. Spoken into the room.

### What we explicitly do NOT build

- Snooze button (we have "return" instead)
- Sleep score / readiness / any metric displayed back
- Streaks, weekly rankings, "X days in a row"
- Celebrity voices as product
- Shame-based wake-missions (math, photo, squat)

## 7. Content tagging

Adds a `moment` field to each resource:

```json
{
  "id": "r-432",
  "title": "...",
  "moment": ["morning" | "evening" | "stillness" | "release"],
  ...
}
```

Tagging rules, in priority order:
1. Already tagged `stillness` / `reflection` / `breath` → `stillness`
2. Tags include `meditation` or `quiet` and length ≥ 20 min → `evening`
3. Tags include `motion` / `rhythm` / `gentle movement` → `morning`
4. Tags include `reflection` / `journal` / `release` → `release`

Build-time script: `/app/scripts/tag-moments.mjs`. Runs against `resources.json` and writes `resources.json` back with the new field. Schema is additive — old app versions ignore it.

## 8. Store submission strategy

### Top 5 rejection risks and mitigations

1. **Apple Guideline 4.2 "Minimum Functionality"** — thin wrapper of the website.
   *Mitigation:* Native alarm feature, native tabs, push notifications, offline shell, biometric lock for bedside mode, universal links into topics. These clearly exceed "just a WebView."

2. **iOS background audio not audible during review.**
   *Mitigation:* Reviewer notes with exact steps: *"Open Bedside tab, set alarm 1 min out, lock device. Alarm will ring while device is locked."* Lock-screen now-playing UI wired up via `@jofr/capacitor-media-session`.

3. **Google Play foreground service declaration video too vague.**
   *Mitigation:* 60-second unlisted YouTube video, narrated, showing user tapping play → backgrounding → audio continues → media notification visible.

4. **Play `USE_EXACT_ALARM` declined if alarm seems secondary.**
   *Mitigation:* Alarm must be visibly a first-class feature — prominent in onboarding, listing screenshots, feature copy.

5. **Privacy label / Data Safety mismatch with actual SDKs.**
   *Mitigation:* Complete audit pre-submission. `PrivacyInfo.xcprivacy` with Required Reason APIs. Third-party SDK manifests present. Account deletion flow.

### Positioning

"Wellness / mindfulness / alarm clock." Never "treats," "cures," "clinically proven," "therapeutic." Frequency language stays poetic — never tied to health outcomes. Age rating likely 13+ on both stores.

## 9. Build order

**Week 1** — Scaffold, hybrid router, content sync wired to frqncy.network, local wake/sleep HTML screens stubbed.
**Week 2** — FrqncyAlarm plugin: Android `setAlarmClock` path end-to-end. iOS `UNNotifications` + silent-audio keep-alive.
**Week 3** — Audio/video playback stack, lock-screen controls, sleep fade curves, breath-hold dismiss gesture.
**Week 4** — Resource tagging, search index, offline downloads, storage management UI.
**Week 5** — OEM onboarding flows, bedside mode copy, privacy manifest, Data Safety form.
**Week 6** — Beta (TestFlight + Play Internal Testing), fix reliability issues on real devices.
**Week 7** — Store submission, reviewer notes, Foreground Service declaration video.
**Week 8** — Launch.

## 10. What lives where

```
/FRQNCY WEBSITE/                        ← existing static site, Cloudflare Pages
├── search.json, resources.json         ← existing content
├── content-version.json                ← NEW: generated at deploy, hashes + publishedAt
└── app/                                ← NEW: the mobile app
    ├── capacitor.config.ts
    ├── package.json
    ├── src/
    │   ├── app/                        ← local bundle (wake, sleep, alarm, settings)
    │   ├── lib/                        ← SyncManager, ContentStore, MediaManager
    │   ├── native/                     ← TS interfaces for the custom plugin
    │   └── styles/
    ├── android/                        ← generated by `npx cap add android`
    │   └── app/src/main/java/network/frqncy/alarm/
    │       ├── AlarmReceiver.kt
    │       ├── AlarmService.kt
    │       ├── AlarmActivity.kt
    │       └── BootReceiver.kt
    ├── ios/                            ← generated by `npx cap add ios`
    │   └── App/FrqncyAlarm/
    │       ├── FrqncyAlarmPlugin.swift
    │       └── SilentKeepAlive.swift
    ├── scripts/
    │   ├── tag-moments.mjs             ← tags resources.json with moment field
    │   └── build-manifest.mjs          ← generates content-version.json
    └── docs/
        └── SPEC.md                     ← this file
```

## 11. Open questions

- **Accounts?** Not in v1. Everything is device-local. Add later if favorites/sync-across-devices is wanted.
- **Analytics?** Minimal — PostHog or Plausible, opt-in, no user IDs. Declare on both stores.
- **Payments?** Not in v1. If added, Apple IAP is mandatory for digital subscriptions.
- **HealthKit / Health Connect?** Read-only, used solely to time the wake window. Data is never displayed back as a score.

## 12. Sources

All decisions traced to 7 research streams (2026-04-24). Key references:
- capacitorjs.com/docs (Capacitor 7)
- developer.android.com (AlarmManager, foreground services, exact alarms, full-screen intent)
- developer.apple.com (UNNotifications, AVAudioSession, UIBackgroundModes, App Review 4.2)
- dontkillmyapp.com (OEM battery workarounds)
- github.com/mediagrid/capacitor-native-audio, jofr/capacitor-media-session, capgo/capacitor-video-player
- Apple App Store Review Guidelines 4.2, 2.5.2, 2.5.4
- Google Play Console policy pages (Foreground Service, Exact Alarm)
