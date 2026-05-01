# Store reviewer notes — FRQNCY (drafts)

Both stores. Submit alongside the binary. Per Stream 7 research synthesis.

---

## Apple App Store — App Review Information

**Sign-in info:** Not required. FRQNCY is local-first; no auth in v1.

**Notes for the App Review team:**

> FRQNCY is a wellness app combining a consciousness-practice content library
> (loaded from frqncy.network and cached for offline) with a native wake/sleep
> alarm feature. We want to flag that this is a hybrid Capacitor app and call
> out the native features beyond the embedded WebView, because we know hybrid
> apps sometimes raise 4.2 (Minimum Functionality) concerns.
>
> **Native features (beyond WebView):**
> 1. Custom `FrqncyAlarm` plugin scheduling time-sensitive UNNotification with
>    a bundled .caf alarm sound. See the Bedside tab → arm an alarm 1 minute
>    out → lock the device.
> 2. Silent-audio keep-alive via AVAudioSession, gated to armed-alarm state
>    only (never always-on). This is the standard pattern used by Alarmy /
>    Sleep Cycle / Pillow / Rise. The audio is sub-audible (-60dB pink noise)
>    and toggleable in Settings → How You Arrive.
> 3. ActivityKit Live Activity showing the armed alarm pill on the Lock Screen
>    and Dynamic Island (iPhone 14 Pro+).
> 4. `frqncy://wake` deep link from notification → in-app wake screen.
> 5. Read-only HealthKit sleep-stage integration (if user grants) used solely
>    to time the optional smart-wake window. Sleep data is never displayed back
>    to the user in any form.
> 6. Offline content cache via Capacitor Filesystem — search / browse work in
>    airplane mode after first sync.
>
> **Privacy:** FRQNCY collects no user data. PrivacyInfo.xcprivacy declares
> NSPrivacyTracking=false and four required-reason APIs (UserDefaults,
> FileTimestamp, SystemBootTime, DiskSpace). No third-party SDKs. No ATT
> prompt because we have no trackers.
>
> **Background audio (Guideline 2.5.4):** The silent-audio keep-alive is a
> documented feature (Settings → How You Arrive describes it). It runs only
> while a user has explicitly armed an alarm in Bedside Mode. Volume is
> sub-audible by design; we do not hide it as a feature.
>
> **Reliability framing:** We're explicit in onboarding that iOS doesn't
> expose a public alarm API and that wake reliability is ~92-96% under
> recommended conditions. Users are advised to keep a backup alarm in the
> iOS Clock app during their first week.
>
> Thank you.

**Demo video:** N/A (no auth, no paywall, no flow gated behind credentials).

**Notes:** None.

---

## Google Play Console — App content / Reviewer notes

**App access:** No login required. All features available on first launch.

**Notes for review:**

> FRQNCY is a wellness app with a primary native alarm-clock feature and
> a consciousness-practice content library. The app's primary user-facing
> function on Android is the alarm clock, supported by guided wake/sleep
> sessions and offline-cached practice content.
>
> **USE_EXACT_ALARM declaration:**
> Users rely on FRQNCY firing at the precise minute they configure for waking.
> Without `USE_EXACT_ALARM`, alarms could drift by minutes under Doze, which
> is unacceptable for a wake-up product. Under Android 14+'s policy, FRQNCY
> qualifies as an "alarm clock or calendar app" — the alarm is foregrounded
> in screenshots, the bedside tab is the primary surface, and the app's
> short description / subtitle includes the word "alarm."
>
> **FOREGROUND_SERVICE_MEDIA_PLAYBACK declaration:**
> Demo video (unlisted YouTube): [REPLACE WITH YOUTUBE URL BEFORE SUBMIT]
> The video is a 45-second screen recording showing:
>   1. User opens FRQNCY, taps the Bedside tab.
>   2. User picks a time 1 minute out, taps "arm for tonight."
>   3. User backgrounds the app, locks the device.
>   4. At fire time, the alarm rings — the audio is the user-visible feature
>      that the foreground service is playing. Lock-screen full-screen UI
>      shows a breath-hold dismiss ring.
>   5. User holds the ring for 6 seconds; the alarm dismisses; app routes to
>      the wake screen.
>
> The foreground service exists exclusively to play the alarm audio with
> proper audio focus (USAGE_ALARM, bypasses Do Not Disturb if user-allowed)
> and to keep the lock-screen alarm activity alive. It does not collect data,
> does not track location, and does not run while no alarm is armed.
>
> **OEM compatibility:** The first time a user arms an alarm on an aggressive
> OEM (Vivo / Xiaomi / Oppo / OnePlus / Huawei / Honor / Samsung), FRQNCY
> shows manufacturer-specific guidance with deep-links to the relevant
> battery-management settings. Users following the guidance experience
> ~90%+ alarm reliability; users who don't may experience missed alarms.
> We disclose this honestly in onboarding.
>
> **Privacy / Data Safety:** FRQNCY collects no user data. No third-party
> SDKs. No advertising. The Data Safety form is filled to "no data collected,
> not shared with third parties, encrypted in transit, deletion path
> available at frqncy.network/delete."
>
> Thank you.

---

## Play Console — Data Safety form values

| Question | Answer |
|---|---|
| Does your app collect any of the data types from the user? | No |
| Is all of the user data collected by your app encrypted in transit? | Yes |
| Do you provide a way for users to request that their data be deleted? | Yes — frqncy.network/delete |

(All "data collected" toggles → No. All "data shared" toggles → No.)

---

## Apple Privacy Nutrition Label

| Category | Answer |
|---|---|
| Data Used to Track You | None |
| Data Linked to You | None |
| Data Not Linked to You | None |
| **Overall:** | **Data Not Collected** |

---

## App Store Connect "App Privacy" details

- **Data Collection:** No data collected.
- **Tracking:** No tracking.
- **Privacy Policy URL:** https://frqncy.network/v2/privacy.html
- **App Review Sign-in:** Not required.

---

## Play Console — App content

- **Target audience and content:** 13+
- **Ads:** None
- **Government apps:** No
- **Health apps:** No (we are a wellness app, not a health app — we make no
  medical claims, do not store PHI, do not integrate with HIPAA-covered
  systems)
- **News apps:** No
- **COVID-19 apps:** No
- **Account deletion:** Required if accounts added in v1.1+. v1 has no
  accounts so this does not apply.

---

## What to swap before submit

The following placeholders need real values before either submission:

1. `[REPLACE WITH YOUTUBE URL BEFORE SUBMIT]` in the Play reviewer notes →
   record the 45s FGS demo video, upload as unlisted, paste the URL.
2. `frqncy.network/delete` page → must exist and be accessible. Currently a
   stubbed gap; build before submit.
3. Privacy policy URL → confirm `frqncy.network/v2/privacy.html` is live and
   accurate. Should mention: no tracking, no third-party SDKs, on-device data
   only, deletion process.
4. Apple App Privacy: confirm in Connect that all toggles are set per the
   Nutrition Label table above. The interface walks you through it.
