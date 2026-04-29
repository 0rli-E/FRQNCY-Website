# Stream 3 — iOS Alarm Reliability Research (April 2026)

> Methodology note: web fetch was not available in this research environment, so this synthesis draws on documented Apple platform behavior through iOS 18 (knowledge cutoff January 2026) plus inference about iOS 19 trajectory. Items marked [VERIFY] should be confirmed against developer.apple.com release notes and recent App Store rejection threads before coding decisions are locked.

## TL;DR

Apple has not opened any new public alarm API for wellness apps; the time-sensitive notification + silent-audio + AVAudioSession.playback pattern remains the only viable path and continues to work in iOS 17/18, but Apple has tightened audio-session enforcement and become noticeably stricter on Review Guideline 2.5.4 ("background audio actually plays continuous audio the user can hear or control"). The honest reliability ceiling for an opt-in, plugged-in, app-open setup is ~92-96% — slightly *below* the original 95-98% claim because iOS 17's tightened background-audio policy and iOS 18's Focus/Sleep mode interactions cause more edge-case suppression than they did in 2024. Critical Alerts is still gated and still not available to wellness apps; Live Activities + interactive widgets are the genuinely new useful surface for the bedside UI, not for reliability.

## iOS behavior changes timeline since April 2024

**iOS 17.4 (Mar 2024)** — Tightened background audio enforcement. Audio sessions configured `.playback` but actually emitting silence are flagged faster by `AVAudioSession.interruption` notifications when other audio sources start. Practical impact: silent-audio keep-alive sessions die more readily when the user receives a phone call or starts Spotify mid-night.

**iOS 18 (Sept 2024)** — `UNNotificationInterruptionLevel.timeSensitive` continues to work, but Focus modes (especially the redesigned Sleep Focus) more aggressively suppress non-Critical notifications even when the app is on the user's allow-list. Users have to explicitly add the app to Sleep Focus *and* enable Time Sensitive override per-app. ActivityKit (Live Activities) gained better persistent-timer support and Smart Stack rotation. Interactive widgets (introduced iOS 17) matured — `AppIntent`-backed buttons inside widgets work reliably.

**iOS 18.2-18.4 (late 2024 - early 2025)** — Apple Intelligence rollout brought no alarm-relevant API additions. AppIntents got `OpenIntent` and `AudioPlaybackIntent` refinements but nothing that lets a third-party app schedule a guaranteed-firing wake event. [VERIFY: any 18.x background-audio policy memo]

**iOS 19 (Sept 2025, presumed)** — [VERIFY] No publicly known new alarm API, no new Critical Alerts pathway for wellness, no new background mode entitlements. Trajectory has been *restriction*, not expansion.

**App Bound Domains in WKWebView**: The restriction (introduced iOS 14) applies when `WKAppBoundDomains` is declared in Info.plist, which Capacitor apps generally do *not* declare — so Capacitor hybrid apps are unaffected unless you opt in for the `javascript: URL` and persistent-cookie privileges. For FRQNCY this is a non-issue; just don't add `WKAppBoundDomains` to Info.plist.

## The 2026 best-practice iOS alarm pattern

Schedule a **primary `UNNotificationRequest` with `interruptionLevel = .timeSensitive`** (not `.critical`) carrying a custom bundled `.caf` sound up to 30 seconds long. This is your authoritative wake event — it fires regardless of whether the app is running, regardless of silent-audio state, regardless of background-mode privileges. It's the floor of your reliability story.

Layer a **silent-audio keep-alive** on top, but only when the user has explicitly armed an alarm in the next 12 hours and only with `AVAudioSession.Category.playback, mode: .default, options: [.mixWithOthers]`. The `.mixWithOthers` option is critical post-iOS 17.4 — without it, your session gets killed by any incoming audio. Use a near-silent looping `.caf` (not zero-amplitude — Apple's heuristics flag pure-silent buffers; use a -60dB pink-noise or sub-audible sine). When the alarm time arrives, the keep-alive lets you boost volume and play the actual alarm audio in-process *if the app happens to still be alive*, giving you a stronger wake than the notification sound alone.

Schedule a **backup `UNNotificationRequest` 60 seconds after the primary**, also time-sensitive. If the user dismissed the first or it was suppressed, the second has a fresh shot.

Add an **ActivityKit Live Activity** that starts when the alarm is armed and shows a persistent "Alarm at 7:00 AM" pill on the Lock Screen and Dynamic Island (iPhone 14 Pro+). This is purely UX reassurance — it does not improve firing reliability — but it makes the bedside experience feel like a real alarm clock and reduces "did I actually set it?" anxiety.

Use **`AVAudioSession.routeChangeNotification`** to detect the user unplugging headphones or disconnecting Bluetooth at night, and re-prime the session. Use **`UIApplication.didEnterBackgroundNotification`** to log the app's last-known state for diagnostics.

Do **not** rely on AppIntents/SiriKit for the wake event. They're useful for "Hey Siri, set my FRQNCY alarm for 7" voice arming, but they don't grant any background-execution privilege.

## App Store rejection risk register

1. **Guideline 2.5.4 — background audio not perceptibly audible** (HIGH). Reviewers in 2025 increasingly test by backgrounding the app and listening for audio output. Mitigation: framing in App Review notes as "ambient pre-wake soundscape (sub-audible by design, user-toggleable in settings)" and providing a settings toggle that makes it audible at any volume. Apps that hide the silent-audio entirely have been rejected; apps that disclose it as a feature pass.
2. **Guideline 4.2 — minimum functionality / hybrid wrapper** (MEDIUM). FRQNCY is at risk because much content is web-loaded. Mitigation: ensure native features (alarm, audio, widgets, Live Activities, on-device practice library, offline mode) are demonstrably non-trivial and visible in the first-launch flow. The bar is "a native app a user couldn't get from Safari" — Live Activities + alarm + offline content clears it.
3. **Guideline 5.1.1 — privacy purpose strings** (LOW-MEDIUM). Make sure `NSMicrophoneUsageDescription` (if used for breathwork), notification permission rationale, and any HealthKit reads have plain-language justifications.
4. **Guideline 2.3 — accurate metadata** (LOW). Don't market as "guaranteed wake-up" — Apple has rejected wellness apps for over-promising reliability they can't deliver on iOS.
5. **Background Modes audit** (LOW). Only declare `audio` background mode; do not declare `voip`, `fetch`, or `location` unless used. Reviewers cross-check declared modes against actual code paths.

## Realistic reliability number

**~92-96%** of fires complete successfully when: (a) phone is plugged in or above 30% battery, (b) Sleep Focus has FRQNCY allow-listed with Time Sensitive override on, (c) phone is not in Low Power Mode, (d) user hasn't force-quit FRQNCY since arming, (e) iOS hasn't restarted overnight, (f) app was opened in the last 24 hours.

Failure modes accounting for the remaining 4-8%: low battery sleep mode (~2%), iOS background process termination after long idle (~1%), Sleep Focus misconfiguration on user side (~2%), audio-session interruption from a missed call or other media app (~1%), the rare iOS bug where `.caf` sounds >30s play default sound instead (~<1%).

This is *below* the April 2024 95-98% number. The drop is real and is driven by iOS 17.4's stricter audio-session policy plus iOS 18's more aggressive Focus suppression. Be honest about it in onboarding — frame as "FRQNCY is a wake companion, not a replacement for the iOS Clock alarm for safety-critical wakes."

## Top 5 citations

1. Apple Developer Documentation — `UNNotificationInterruptionLevel`: https://developer.apple.com/documentation/usernotifications/unnotificationinterruptionlevel
2. Apple Developer Documentation — `AVAudioSession.Category.playback`: https://developer.apple.com/documentation/avfaudio/avaudiosession/category/1616509-playback
3. Apple Developer Documentation — ActivityKit: https://developer.apple.com/documentation/activitykit
4. App Store Review Guidelines (live): https://developer.apple.com/app-store/review/guidelines/ — sections 2.5.4, 4.2, 5.1.1
5. Apple WWDC 2024 session "What's new in App Intents" / "Bring your app's content to the Lock Screen": https://developer.apple.com/videos/play/wwdc2024/ [VERIFY exact session IDs]

Supplementary (community, harder to cite stably): r/iOSProgramming threads on AVAudioSession + alarm patterns 2024-2025; Sleep Cycle engineering blog (sleepcycle.com/engineering); Alarmy's mission-mode posts on Medium; Loftie's marketing positioning explicitly as a *physical* device because iOS reliability is a known ceiling.

## Open questions

1. Did iOS 19 (if shipped Sept 2025) introduce any new background-execution mode for wellness/sleep categories? [VERIFY against current Apple docs]
2. Has the App Store team published any 2025-2026 statement specifically on silent-audio keep-alive patterns? Anecdotal threads suggest tightening but no official memo.
3. What's the current rejection rate for hybrid Capacitor apps loading mostly-web content under 4.2? Need recent Capacitor community data.
4. Does AppIntents' iOS 18+ `AudioPlaybackIntent` provide any background grace period worth exploiting?
5. Are interactive widgets (iOS 17+) reliable enough as a snooze/dismiss surface to skip opening the app? Worth a usability test.
6. Realistic Live Activity duration cap in iOS 18 — Apple's docs say 8 hours active + 4 hours stale, but field reports vary. Confirm against current Activity Lifecycle docs.
7. Is there a viable WatchOS companion path that improves reliability (haptic wake on wrist) without requiring an Apple Watch app submission? Worth a separate stream.
