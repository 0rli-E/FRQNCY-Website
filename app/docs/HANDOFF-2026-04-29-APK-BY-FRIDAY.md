# FRQNCY App — Handoff 2026-04-29 (APK by end of week)

**Goal:** Orlando installs the FRQNCY APK on his Android phone by Friday May 8.
This doc lists exactly what was built source-side, what's still on Orlando's
machine to do, and the day-by-day plan to get there.

iOS is on the same trajectory but stops short of TestFlight this week — App
Store review is a 24-48h round trip and we want at least 5 days of beta on the
APK first. iOS submission is week 2.

---

## What landed source-side today (2026-04-29)

### Android

**Native plugin wired into the project:**
- `android/app/src/main/java/network/frqncy/alarm/` — six Kotlin files:
  - `FrqncyAlarmPlugin.kt` — Capacitor plugin, `setAlarmClock()` on
    schedule, OEM guidance for Xiaomi/Samsung/Huawei/Oppo/OnePlus/Vivo
  - `AlarmRecord.kt` — JSON-serializable payload
  - `AlarmStore.kt` — SharedPreferences-backed, direct-boot-aware
    (Room migration deferred to Phase 1.5)
  - `AlarmReceiver.kt` — receives `AlarmManager` broadcast, starts
    foreground service inside the 5-second budget
  - `AlarmService.kt` — typed `mediaPlayback` FGS, plays alarm tone via
    `MediaPlayer` with `USAGE_ALARM`, fade-in via Handler tick
  - `AlarmActivity.kt` — full-screen lock-screen activity hosting
    `alarm.html` in a WebView with `FrqncyAlarmBridge` JavaScriptInterface
  - `BootReceiver.kt` — re-arms persisted alarms after BOOT_COMPLETED,
    LOCKED_BOOT_COMPLETED, MY_PACKAGE_REPLACED, TIME_SET, TIMEZONE_CHANGED

**Manifest:** all 9 permissions + 2 receivers + 1 service + 1 activity merged
into `android/app/src/main/AndroidManifest.xml`.

**Theme:** `Theme.Frqncy.Alarm` added to `styles.xml`. Edge-to-edge dark.

**Layout:** `res/layout/activity_alarm.xml` — full-screen WebView.

**Gradle:** Kotlin plugin applied (`org.jetbrains.kotlin.android` 1.9.25),
stdlib + core-ktx + lifecycle-runtime-ktx added. Versions in
`variables.gradle`. Root `build.gradle` has the Kotlin classpath.

### iOS

- `ios/App/App/FrqncyAlarm/FrqncyAlarmPlugin.swift` — primary
  `UNNotificationRequest.timeSensitive` + backup at +60s + silent-audio
  keep-alive via `AVAudioSession.playback` with `.mixWithOthers` (the iOS 17.4
  fix — without `.mixWithOthers` the session dies on incoming audio).
- `ios/App/App/Info.plist` — `UIBackgroundModes` (audio + fetch) and
  `NSAppTransportSecurity` for AVPlayer streaming from R2/Stream.
- `ios/App/App/PrivacyInfo.xcprivacy` — required by App Store Connect since
  Feb 2025. Declares `NSPrivacyTracking=false`, no collected data, four
  required-reason APIs (UserDefaults CA92.1, FileTimestamp C617.1,
  SystemBootTime 35F9.1, DiskSpace E174.1).

### JS layer

- `src/app/bedside.html` — arm button now actually calls
  `FrqncyAlarm.schedule()` with the chosen time, includes a permission
  request flow, persists the alarm across app reopens via `FrqncyAlarm.list()`,
  and shows OEM guidance modal on first arm for aggressive manufacturers
  (Vivo/Xiaomi/etc.).
- `src/app/alarm.html` — repurposed as the actual alarm-fire screen (was a
  redirect stub). Breath-hold gesture, snooze button, calls
  `FrqncyAlarmBridge` (Android) or falls through to `wake.html` (iOS).
- `src/app/settings.html` — `last synced`, `downloads`, and three permission
  rows now show real values from `Preferences` / `Filesystem` /
  `FrqncyAlarm.checkPermissions()`. Refresh on app resume via
  `visibilitychange`. "Support FRQNCY" out-of-app Stripe link.

### Content

- `app/scripts/tag-moments.mjs` — broader regex coverage. Re-running
  produced **200/764 resources tagged** (was 109; Phase 4 target hit).
  Distribution: morning=108 evening=33 stillness=71 release=29.

### Docs

- `app/docs/ROADMAP-2026-04-29.md` — 12-week sequenced plan with 7
  research-stream synthesis, locked tech decisions, risk register.
- `app/docs/research/stream-{1..7}-*.md` — the seven research stream reports.

---

## What Orlando does this week

These steps run in your terminal (Cowork sandbox can't do `.git` operations
or full `npm install` with renames).

### Day 1 (Friday, May 1) — install Studio + first build

```bash
cd ~/Documents/Claude/Projects/FRQNCY\ WEBSITE/app
rm -rf node_modules package-lock.json
npm install
npm run build
```

Then install Android Studio (if not done):

1. Download from <https://developer.android.com/studio>
2. Open `~/Documents/Claude/Projects/FRQNCY WEBSITE/app/android` as a project
3. Wait for Gradle Sync (first sync downloads SDK + Kotlin compiler — coffee)

If gradle sync errors on the new alarm classes, paste the exact error to Claude
and we fix together. Most likely fixes:
- Kotlin version mismatch → bump `kotlinVersion` in `variables.gradle`
- `R.layout.activity_alarm` not found → File → Invalidate Caches → Restart
- `core-ktx` resolution → confirm `androidxCoreVersion = '1.15.0'` in
  `variables.gradle`

### Day 2 (Saturday, May 2) — sync + first APK

```bash
cd ~/Documents/Claude/Projects/FRQNCY\ WEBSITE/app
npm run cap:sync
```

This rebuilds the web bundle and copies it into `android/app/src/main/assets/public/`.

In Android Studio:
1. Build → Generate Signed Bundle / APK → choose **APK**
2. Build variant: `debug` (signed with debug keystore — fine for sideload)
3. APK output appears at `android/app/build/outputs/apk/debug/app-debug.apk`

Or, if your phone is plugged in via USB with USB debugging enabled:
1. Click the **Run** button (green play arrow)
2. Studio installs and launches on the device

### Day 3 (Sunday, May 3) — dogfood + report

Set the alarm for the next morning. Plug in. Lock the phone. See what happens.

Things to verify:
- Bedside screen shows; arm button toggles armed state
- After arming, lock the phone — alarm fires at the set time
- Lock-screen UI appears with the breath-hold ring
- Holding for 6 seconds → app navigates to wake.html
- Snooze button triggers a 9-minute re-arm
- After reboot, alarm still fires (BootReceiver works)

If anything breaks: copy the logcat error and paste back — we iterate.

### Day 4-5 (Monday-Tuesday, May 4-5) — fixes + signed release APK

Likely v1 bugs to expect (with mitigations on hand):
- `ForegroundServiceStartNotAllowedException` on Android 14+ →
  request `USE_EXACT_ALARM` via the Settings deep-link flow
  in `FrqncyAlarmPlugin.requestPermissions`
- Vivo/Xiaomi battery manager kills the alarm — OEM guidance modal
  in `bedside.html` should appear; if user dismisses, the alarm may not fire
- Permission ladder: notifications first, then full-screen, then exact alarm

Once the debug APK is solid, generate a release APK:
```bash
keytool -genkey -v -keystore frqncy-release.keystore -alias frqncy -keyalg RSA -keysize 2048 -validity 10000
```
Studio: Build → Generate Signed APK → release variant → use the keystore.

### Day 6-7 (Wednesday-Thursday, May 6-7) — sideload + Play Internal Testing

Two paths:
- **Sideload:** AirDrop/email/Google Drive the APK, install on phones. Done.
- **Play Internal Testing:** create the developer account ($25 one-time), upload
  the release APK to the Internal Testing track, add up to 100 testers by
  email. Play does not review Internal Testing builds — installs are instant.

Either way: by end of week, FRQNCY is on a real Android phone running real
alarms.

---

## What's still TODO before public Play Store launch

These are out of scope for "downloadable end of week" but in the roadmap:

1. **Bundle a default morning audio asset** in `android/app/src/main/res/raw/`
   so the alarm has a tone before users have internet/downloads. v1 falls back
   to system default ringtone — works, but generic.
2. **Install `@mediagrid/capacitor-native-audio`** (Phase 3) for the actual
   sleep flow and wake fade. Currently `MediaPlayer` handles alarm tone only.
3. **Wake.html → movement session** wiring — the "move with me (3 min)"
   button still navigates home; needs to start a morning-tagged resource.
4. **Android Studio Run icon-launcher generation** — `ic_stat_icon` (silver
   notification icon, transparent bg) and `ic_launcher` polish.
5. **Real device QA on Samsung/Xiaomi/Vivo** — only Pixel will be ~99%
   reliable; others need OEM-onboarding to actually work.
6. **Reviewer-notes drafts** (Phase 6) before Play submission.
7. **iOS:** drag `FrqncyAlarm/FrqncyAlarmPlugin.swift` into Xcode (must be
   added to the Xcode project file via UI; can't edit `.pbxproj` reliably from
   script). Also bundle `silent.wav` and `morning.caf`.

---

## Commit plan

The Cowork sandbox can't write `.git/HEAD.lock` so commits go in your terminal.

```bash
cd ~/Documents/Claude/Projects/FRQNCY\ WEBSITE
rm -f .git/index.lock .git/HEAD.lock
git add -A
git status
git commit -m "App: wire FrqncyAlarm plugin into Android + iOS native projects (Phase 0+1)

Android:
- Six Kotlin classes under network.frqncy.alarm — plugin, AlarmRecord,
  AlarmStore (SharedPreferences-backed, direct-boot-aware),
  AlarmReceiver, AlarmService (mediaPlayback FGS), AlarmActivity
  (full-screen lock-screen WebView), BootReceiver.
- AndroidManifest: 9 permissions + 2 receivers + service + activity merged.
- Theme.Frqncy.Alarm style + activity_alarm.xml layout added.
- Kotlin plugin (1.9.25) applied via root and app build.gradle; lifecycle
  + core-ktx deps added.

iOS:
- FrqncyAlarmPlugin.swift in ios/App/App/FrqncyAlarm/ — time-sensitive
  notifications + silent-audio keep-alive (with .mixWithOthers for iOS 17.4
  compatibility) + backup notification at +60s.
- Info.plist: UIBackgroundModes (audio + fetch) and ATS for media streaming.
- PrivacyInfo.xcprivacy: required-reason APIs declared (UserDefaults,
  FileTimestamp, SystemBootTime, DiskSpace), no tracking, no data collected.

JS layer:
- bedside.html: arm button now calls FrqncyAlarm.schedule() with a real
  time picker, permission flow, OEM-guidance modal on first arm, and
  hydration from FrqncyAlarm.list() on load.
- alarm.html: repurposed as the alarm-fire screen with breath-hold gesture
  and FrqncyAlarmBridge JavaScriptInterface for dismiss/snooze/openWake.
- settings.html: real values from Preferences/Filesystem/checkPermissions
  replace placeholders. Out-of-app Stripe support link.

Content:
- tag-moments.mjs: broader regex sweep, 200/764 resources tagged
  (morning=108, evening=33, stillness=71, release=29).

Docs:
- ROADMAP-2026-04-29.md: 12-week plan from 7-stream research synthesis.
- docs/research/stream-{1..7}: full reports preserved in repo.
- HANDOFF-2026-04-29-APK-BY-FRIDAY.md: this file."
git push
```

After the push, the website repo has the source for the APK build. Studio
just needs gradle sync + Run.

---

## If something goes wrong

- **Gradle sync fails on Kotlin** → paste the error; usually a version pin.
- **`R.layout.activity_alarm` not found** → File → Invalidate Caches → Restart.
- **Plugin not registered (Capacitor doesn't see FrqncyAlarm in JS)** →
  confirm `apply plugin: 'org.jetbrains.kotlin.android'` is at the top of
  `android/app/build.gradle`, then `npm run cap:sync`.
- **Alarm fires but no sound** → expected for v1 — bundles default ringtone.
  Add a `default-morning.mp3` in `res/raw/` and wire in
  `AlarmService.playAlarmTone()` to use it as fallback.
- **App crashes on lock-screen alarm UI** → likely the WebView in
  AlarmActivity is failing to load `file:///android_asset/public/app/alarm.html`.
  Run `npm run cap:sync` to ensure the bundle is copied; verify the file
  exists at `android/app/src/main/assets/public/app/alarm.html`.
- **OEM kills alarm before it fires** → expected on Vivo/Xiaomi without the
  battery-manager allowlist. The OEM guidance modal in `bedside.html` should
  surface on first arm; user must follow the steps. Pair with a backup
  alarm clock the first night.

---

## Source-of-truth pointers

- Architecture: `app/docs/SPEC.md` (April 2024 spec, still current except
  where ROADMAP overrides)
- 12-week plan: `app/docs/ROADMAP-2026-04-29.md`
- Research streams: `app/docs/research/stream-{1..7}-*.md`
- Editorial values: `proposals/EDITORIAL-VALUES-V2.md` and
  `proposals/FRQNCY-VOICE-PLAYBOOK.md` (in the parent FRQNCY WEBSITE repo)
- Project conventions: `CLAUDE.md` (parent repo)
