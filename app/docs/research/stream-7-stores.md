# Stream 7 — App Store + Play Store Submission Roadmap for FRQNCY

*Research date: 2026-04-29 · Capacitor 7 · iOS App Store + Google Play · solo founder, ~$100, 90-day plan*

## TL;DR

A Capacitor app that mostly loads frqncy.network is a textbook 4.2 risk, but a native wake/sleep alarm with local notifications, biometric lock, and offline-able content is enough to clear it if the reviewer notes spell out the native surfaces. Google Play is the stricter store in 2026 — the foreground-service video declaration and USE_EXACT_ALARM justification are the two highest-friction items and need to be done right the first time. Ship v1 free with no IAP, no ATT prompt, "Data Not Collected" privacy labels, and a 4+ / Everyone rating; everything else (subscriptions, ads, tracking) is a downstream bridge to burn later.

## Top 5 rejection risks for FRQNCY + mitigations

1. **Apple 4.2 "you wrote a website wrapper"** — single highest risk. Reviewers in 2025/2026 are explicitly raising the bar on hybrid apps. Mitigation: lean hard on the *native* alarm (UNUserNotificationCenter local notifications, full-screen alarm UI, snooze/dismiss as native gestures), Face ID / Touch ID lock on the social tab, native deep-linking from notifications into specific topic pages, an offline shell of the explore graph cached via the Capacitor Filesystem plugin. In reviewer notes, list these *as a bulleted "native features beyond webview"* block.
2. **Play Foreground Service video rejection** — the demonstration video is the #1 source of 2026 alarm-app rejections. Reviewers want to see the literal user steps that trigger the FGS, no marketing voiceover. Mitigation: 30–60s screen recording, no music, no overlay text, narration optional but functional ("user sets an alarm for 7am, closes the app, the alarm fires, user taps dismiss"). Host on an unlisted YouTube link.
3. **USE_EXACT_ALARM declaration** — Google flat-out disallows this for non-alarm/calendar/reminder categories, and an "alarm clock" core function must be visible in screenshots and listing copy. Mitigation: app subtitle/short description must contain the word "alarm." Justification text: ~3 sentences, plain English, "FRQNCY is a wake-and-sleep alarm with consciousness practices. Exact alarms are required because users rely on the alarm firing at the precise minute they configured. Without USE_EXACT_ALARM the alarm could drift by minutes under Doze."
4. **Privacy manifest mismatch (xcprivacy)** — since Feb 2025, App Store Connect rejects binaries whose required-reason API usage isn't declared. Capacitor 7's core uses UserDefaults and FileTimestamp APIs through @capacitor/preferences and @capacitor/filesystem. Mitigation: ship a hand-written `PrivacyInfo.xcprivacy` (block below) and don't trust the auto-generator.
5. **Wellness language drift toward medical claims** — "improves sleep," "reduces anxiety," "clinically proven," "frequency healing," "therapeutic" are all reviewer pushback triggers (Apple 1.4.1 / Play health-claims policy). Mitigation: replace with experiential, non-clinical language — "wake up gently," "wind-down routine," "consciousness practice," "explore," "play with frequencies." Never claim a health *outcome*; only describe the *experience*.

## Privacy declarations FRQNCY needs

### iOS — `PrivacyInfo.xcprivacy` (paste into `App/App/PrivacyInfo.xcprivacy`)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>NSPrivacyTracking</key>
  <false/>
  <key>NSPrivacyTrackingDomains</key>
  <array/>
  <key>NSPrivacyCollectedDataTypes</key>
  <array/>
  <key>NSPrivacyAccessedAPITypes</key>
  <array>
    <dict>
      <key>NSPrivacyAccessedAPIType</key>
      <string>NSPrivacyAccessedAPICategoryUserDefaults</string>
      <key>NSPrivacyAccessedAPITypeReasons</key>
      <array><string>CA92.1</string></array>
    </dict>
    <dict>
      <key>NSPrivacyAccessedAPIType</key>
      <string>NSPrivacyAccessedAPICategoryFileTimestamp</string>
      <key>NSPrivacyAccessedAPITypeReasons</key>
      <array><string>C617.1</string></array>
    </dict>
    <dict>
      <key>NSPrivacyAccessedAPIType</key>
      <string>NSPrivacyAccessedAPICategorySystemBootTime</string>
      <key>NSPrivacyAccessedAPITypeReasons</key>
      <array><string>35F9.1</string></array>
    </dict>
    <dict>
      <key>NSPrivacyAccessedAPIType</key>
      <string>NSPrivacyAccessedAPICategoryDiskSpace</string>
      <key>NSPrivacyAccessedAPITypeReasons</key>
      <array><string>E174.1</string></array>
    </dict>
  </array>
</dict>
</plist>
```

If you add @capacitor/local-notifications, no extra category is needed. If you add Supabase auth via web, no SDK is bundled into the iOS binary so no SDK-level manifest is required. Apple Privacy Nutrition Label: select **Data Not Collected** for every category.

### Google Play — Data Safety form

- Data collected: **None** (assuming no analytics/auth wired in v1)
- Data shared with third parties: **None**
- Data encrypted in transit: **Yes** (HTTPS to frqncy.network)
- Users can request data deletion: **Yes** (link to a frqncy.network/delete page even if it's just an email mailto)
- Security practices: "Data is encrypted in transit"
- If you add Supabase later: declare "Account info → Email address (collected, shared with Supabase, optional, used for app functionality)"

### App Tracking Transparency

**Skip the ATT prompt entirely.** No ad SDKs, no IDFA reads, no third-party trackers means you do not need to present ATT and shouldn't — adding a prompt without a tracking purpose can itself cause a 5.1.2 rejection. Set `NSPrivacyTracking` to `false` in the manifest.

## Reviewer notes templates

### Apple App Store Connect — App Review Information (~150 words)

> FRQNCY is a wellness companion: a wake/sleep alarm clock paired with a curated library of consciousness-practice content (meditation, breath work, frequency exploration). It is *not* a medical or therapeutic product and makes no health claims.
>
> **Native features beyond the embedded web view:**
> - Local notifications via UNUserNotificationCenter (alarm)
> - Full-screen native alarm UI with snooze/dismiss
> - Face ID / Touch ID lock on the social tab
> - Offline-cached topic graph (Capacitor Filesystem)
> - Native share sheet, deep linking from notifications
> - Background audio for sleep sounds
>
> **No login required to test core alarm flow.** To test the optional social tab: email orlando@frqncy.network for a demo account.
>
> **Content sources:** all editorial picks are reviewed by Orlando Eisenreich (founder). External resource links open in SFSafariViewController.
>
> **Alarm permission rationale:** local notifications power the wake/sleep alarm — the app's core feature. We do not use push notifications.
>
> Contact: orlando@frqncy.network

### Google Play Console — Reviewer comments / App content (~150 words)

> FRQNCY is a hybrid wake/sleep alarm clock and consciousness-practice library. The app is in the "Alarm clocks" category for Exact Alarm policy purposes.
>
> **Foreground service usage:** `mediaPlayback` for sleep sounds and alarm audio. Demonstration video: [unlisted YouTube link]. The video shows: (1) user sets a 7:00 alarm, (2) backgrounds the app, (3) alarm fires with full-screen intent, (4) user dismisses.
>
> **USE_EXACT_ALARM justification:** the app's core user-facing function is an alarm clock. Users depend on the alarm firing at the exact minute configured. Inexact alarms drift under Doze and would break the product. We do not use exact alarms for any non-alarm purpose.
>
> **USE_FULL_SCREEN_INTENT:** required to surface the alarm UI when the device is locked.
>
> **No login required** to test alarm. Social tab requires account; demo: orlando@frqncy.network.
>
> Data Safety: no data collected; no third-party SDKs.

## Pricing recommendation (prose)

Ship v1 free with no IAP at all. Calm and Headspace charge ~$70/yr with $400 lifetime tiers, Insight Timer is freemium with a $60/yr Plus tier, Loftie is hardware-led so the app rides along free, and Alarmy is freemium with a $40/yr premium that gates the harder wake-up missions. FRQNCY's positioning — "a network, not a subscription content product" — is the opposite of the Calm/Headspace walled garden; charging for it confuses the story before there's a story. The cleanest v1 move is Free with a "Support FRQNCY" link in settings that opens the website (Stripe link, not in-app) so Apple's 30% doesn't apply because the transaction is not for digital content consumed inside the app. Once the social platform has stickiness (90 days post-launch) revisit a pay-what-feels-right tier or a $3/mo founders' badge, but not before. Keep the App Store category as **Health & Fitness** (better matching for "wake/sleep" than Lifestyle, and avoids Medical category scrutiny).

## Beta channel plan

- **iOS — TestFlight.** Internal group (up to 100 testers, no review needed) for first 2 weeks. Then external group (up to 10,000, beta review takes 24–48h, much lighter than full App Review). Use TestFlight invitation links shared on Twitter / WhatsApp. Builds expire in 90 days — set a calendar reminder to re-upload.
- **Android — Play Internal Testing track.** Up to 100 testers, no review at all, instant install via opt-in URL. Run this in parallel with TestFlight. Promote to Closed Testing track (still internal) once you have ~20 active testers, then Open Testing as the public-beta channel.
- **Cross-platform tooling.** Codemagic gives you one CI pipeline that publishes to TestFlight and Play Internal in one run from a single `codemagic.yaml` — for a solo founder this is the right call (free tier covers ~500 build minutes/mo, plenty for 90 days). Capgo on top of that gives live updates to the webview content layer without re-submitting binaries (massive for iterating copy on frqncy.network without a store round-trip). Avoid Appflow — it sunset and Codemagic is the migration target.
- **Cadence.** Weekly TestFlight + Play Internal builds for the first 4 weeks. Public beta opens at week 6. Store submission targets week 10 of the 90-day plan, leaving 2 weeks of buffer for rejection-and-resubmit.

## Top 5 citations

1. [Apple App Review Guidelines (Section 4.2)](https://developer.apple.com/app-store/review/guidelines/)
2. [Apple Privacy Manifest Files documentation](https://developer.apple.com/documentation/bundleresources/privacy-manifest-files)
3. [Google Play — Foreground Service & Full-Screen Intent requirements](https://support.google.com/googleplay/android-developer/answer/13392821)
4. [Google Play — Permissions and APIs that Access Sensitive Information (USE_EXACT_ALARM)](https://support.google.com/googleplay/android-developer/answer/16558241)
5. [Google Play Data Safety form guide](https://support.google.com/googleplay/android-developer/answer/10787469)

## Open questions

- Does v1 ship with the social tab enabled, or is social a flag-gated week-6 follow-up? If enabled at submission, demo credentials are mandatory and review time roughly doubles.
- What's the exact Capacitor plugin set in the v1 binary? Need to enumerate to finalise the privacy manifest — current draft assumes Preferences + Filesystem + LocalNotifications + Haptics + StatusBar + App + Browser. If Network or Device is added, manifest needs SystemBootTime reason 35F9.1 (already included as a hedge).
- Will the alarm sounds be bundled or streamed from frqncy.network? Streamed = no extra binary size but offline alarm fails if the user's phone has no network. Bundled = +5–20MB but reliable. Reliability wins for an alarm clock.
- Is "FRQNCY" pronounceable enough as a store-search keyword? Subtitle should include "wake / sleep alarm + meditation" to capture intent searches Apple's algorithm won't connect to the brand name.
- Does Norman want co-founder credit in the App Store listing's "Developed by" / "Author" field? That field is locked to the developer account holder's legal name unless you set up an org account ($99/yr Apple, $25 one-time Google).
