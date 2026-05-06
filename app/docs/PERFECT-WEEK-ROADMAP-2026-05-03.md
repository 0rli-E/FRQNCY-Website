# FRQNCY App — Perfect Week Roadmap (2026-05-03 → 2026-05-08)

**The bar:** Orlando installs a sideload-quality FRQNCY APK on his Android
phone on Friday May 8. Alarm fires, breath-hold dismisses, sleep flow plays
audio with the spec's volume curve, settings + accessibility work, the app
*feels intentional* in every screen.

**Out of scope this week:**
- iOS app (week 2+; pbxproj UI work, Apple Developer payment, beta review).
- Public Play Store launch (week 2; needs FGS demo video + 2-week review).
- Social tab / Privy / Supabase auth (already in main repo, not blocking app).
- Curated audio recordings (synthesized 432Hz tone is acceptable for v1).

**Stack confirmed working:** Capacitor 7, AGP 8.7.2, Kotlin 1.9.25, Java 21,
compileSdk 35, minSdk 23. Vite 5 with `base: './'`. AndroidX without Jetifier.

---

## Definition of "perfect"

Not "every feature shipped." It's: every feature *that ships* feels intentional,
nothing visible to the user is half-finished or stub-y, error states are
graceful, the editorial voice is consistent, and reliability is honest.

A passing perfection checklist:
- App icon, splash, and notification all share the gold-on-black motif.
- Every screen has consistent voice (lowercase + sparse).
- No TODOs visible to user. No "tap this to do nothing" buttons.
- Error states have copy. Network failures, permission denials, OEM kills.
- Animation timings feel paced — not too fast, not too slow.
- Audio sounds intentional (the 432Hz tone has a breathing envelope; it
  doesn't sound like a buzzer).
- Honesty about reliability surfaces unprompted — not buried.
- Privacy claims hold up: nothing leaves the device that the user wouldn't
  expect, and what does (telemetry on FGS failures) is anonymous.

---

## Day-by-day

### Sunday May 3 (today)

**Foundation completion + risk mitigation.** Make sure nothing on the existing
shipping path will surface a real bug.

1. **Wire AlarmReceiver telemetry POST** to the Cloudflare Pages Function
   (already written at `functions/api/alarm-error.js`). Background thread,
   3-second timeout, fire-and-forget. (Started last session, finish today.)
2. **Audit `colors.xml` and theme references.** Stock Capacitor projects ship
   with `colorPrimary`/`colorPrimaryDark`/`colorAccent` as resources. Confirm
   they exist; create `res/values/colors.xml` if missing, with FRQNCY palette
   (gold accent, dark background).
3. **Verify SharedPreferences direct-boot consistency** between JS preference
   writes and native reads. Document the degradation pattern: pre-unlock
   alarms always play audio (safe default), post-unlock respects user pref.
4. **Branded splash screen.** Currently using stock `@drawable/splash`. Replace
   with a 432Hz pulse-ring on FRQNCY black so the launch animation feels
   intentional.
5. **Status bar + nav bar tinting** — set programmatic colors so the system
   bars match the dark theme on every screen.
6. **Static-review pass on every Kotlin file** — re-read each one looking for
   issues a fresh empirical compile would catch.

**Exit criteria:** clean static review, telemetry wired, splash branded,
colors verified.

### Monday May 4

**User experience polish + critical-path bugs.** What does Orlando experience
the first time he opens the app and arms?

1. **AlarmActivity cold-start hardening.** When the alarm fires after a
   process kill, AlarmActivity launches into a freshly-cold WebView. Make
   sure `alarm.html` loads reliably from the bundled assets without depending
   on any in-memory state.
2. **Snooze cap (Stream 6 priority).** Cap snoozes at 2 per alarm; the third
   tap surfaces "this is your third return — hold to arrive" instead. UX
   floor that prevents the snooze-into-oblivion failure mode.
3. **Wire the "video field" toggle on bedside.html.** Currently UI-only.
   Toggle ON renders the radial-gradient field on wake.html (already there);
   OFF skips the field for users who want pure black. Persist preference.
4. **Error states everywhere.**
   - bedside.html: alarm scheduling fails → friendly modal with the OS
     setting deep-link.
   - wake.html: morning resource fetch fails → graceful fallback to silence.
   - sleep.html: no audio plugin and no fetched resource → silent meditation
     timer with periodic prompts.
   - settings.html: no Filesystem read access → don't crash, show "—".
5. **About-page inline content** — replace the link-out to frqncy.network
   with a small inline "about" view. Keeps the app feeling self-contained,
   which is also a 4.2-mitigation for future iOS submission.
6. **Tab bar visual tightening** — the default `index.html` tab bar feels
   placeholder. Real spacing, real iconography (Unicode glyphs are fine for
   v1), color-on-active.

**Exit criteria:** every screen handles its error path without crashing or
showing a stub.

### Tuesday May 5

**Audio ecosystem.** The alarm tone, the sleep audio, the wake "move with
me" session.

1. **Generate a longer loopable morning bed.** 90 seconds, with a 6-second
   breathing envelope, 432Hz fundamental + perfect 5th + a soft 7Hz
   amplitude modulation for "presence." Loops cleanly. Replaces the 30-second
   bed.
2. **Generate evening + stillness + release variants.** Each ~60s, distinct
   tonal character but same brand voice. Bundled in `res/raw/` with
   `default_evening.mp3`, `default_stillness.mp3`, `default_release.mp3`.
3. **Audio focus + interruption recovery in AlarmService.** When a phone
   call interrupts, the alarm should resume playing after the call ends, not
   die silently. `AudioManager.OnAudioFocusChangeListener` with
   `AUDIOFOCUS_LOSS_TRANSIENT` handling.
4. **Sleep.html falls back to bundled defaults** when `resources.json`
   doesn't have a moment-tagged audio URL. The `evening`/`stillness`/`release`
   chooser maps to the bundled defaults so Day 1 users get a real session.
5. **AlarmService picks the right bundled audio by moment.** The `moment`
   parameter is already passed; route morning → default_morning, etc.

**Exit criteria:** every flow has audible audio that fits the moment, even
on a fresh install with no cached resources.

### Wednesday May 6

**First-time UX + onboarding feel.** What's the first 60 seconds like for
someone who just installed FRQNCY?

1. **Home tab welcome flow** — when the user has never opened FRQNCY before,
   the home tab shows a one-screen welcome ("the network of people building
   their dream life") with a single CTA: "set up your first wake-up." Once
   acknowledged, the iframe loads frqncy.network. Mirror of the Bedside
   welcome but at app entry.
2. **Permission denial copy.** When notifications/exact-alarm/full-screen
   are denied, surface inline guidance instead of just `alert()`. Each
   permission has its own friendly explanation referencing what feature
   it unlocks.
3. **Smart resume.** If the user opens the app within 12 hours of an armed
   alarm, route directly to the Bedside tab. Treats the app as a bedside
   companion, not a generic home.
4. **Settings → Accessibility expansion.** Add reduced-motion preference
   (overrides system pref), high-contrast mode for the breath-hold ring,
   font-size adjustment for the reflection prompts.
5. **Brand polish on icons** — the launcher icon has been simplified; do a
   final pass on the foreground vector to make sure it reads at 24dp (status
   bar) and 48dp (launcher list).
6. **Audit voice across all screens** against `proposals/FRQNCY-VOICE-PLAYBOOK.md`.
   Catch any "let's get started" / "tap here to begin" / "you have unlocked"
   language and replace with FRQNCY voice. (None I can think of, but a deliberate
   pass.)

**Exit criteria:** first-launch experience feels paced and intentional;
permission flows have voice; the app reflects FRQNCY's editorial values.

### Thursday May 7

**Real-device verification + bugfix.** Orlando's first dogfood night with
an APK on his phone. Bugs surface; we fix them.

(Plan is necessarily reactive — what surfaces is what we work on. Likely
candidates based on Stream 2: OEM-specific FGS denials, Vivo's aggressive
battery manager killing the service, edge cases in the breath-hold gesture
on certain Android skins, audio output routing through Bluetooth.)

1. **Orlando arms an alarm Wednesday night, sleeps, reports Thursday morning.**
2. **Whatever bugs surface, I fix Thursday.**
3. **Second dogfood pass Thursday night.**
4. **Buffer day for whatever's still flaky.**

**Exit criteria:** alarm fires reliably for 2 consecutive nights on Orlando's
phone with no critical bugs.

### Friday May 8

**Ship.**

1. **Signed release APK** generated via `Build → Generate Signed APK → release`
   with a fresh keystore. Save keystore + password somewhere persistent
   (Bitwarden or 1Password). Same keystore reused for every future release.
2. **Distribute via:**
   - Direct sideload to Orlando + 2-3 trusted testers (AirDrop / Telegram /
     Google Drive link).
   - **OR** Play Internal Testing track if Orlando wants 100-tester capacity
     (instant install, no Play review).
3. **Final shipping doc** — `app/docs/SHIPPED-2026-05-08.md` with the
   distributed APK fingerprint, what's known to work, what's known to be
   flaky, the keystore location, and the path to v1.1.

**Exit criteria:** Orlando's phone running the FRQNCY APK with the alarm
working end-to-end. Day 1 shipped.

---

## Risk register (focused on this week)

| # | Risk | Severity | Plan |
|---|---|---|---|
| 1 | Capacitor's `Preferences` plugin doesn't write to direct-boot-aware storage, so haptic flag is unreadable pre-unlock | LOW | Documented degradation: audio plays (safe default) when flag unreadable. Acceptable. |
| 2 | AlarmActivity WebView fails to load alarm.html after process kill | MED | Cold-start hardening Monday — fallback to a native-Compose "tap to arrive" if WebView times out |
| 3 | OEM kill of the foreground service before alarm fires | HIGH (Vivo/Xiaomi) | OEM-guidance modal shows on first arm; honesty-as-marketing in welcome flow; pair with backup recommendation |
| 4 | gradle sync errors on Orlando's Studio (Kotlin version mismatch, etc.) | MED | Verified compile against full classpath in sandbox. Most likely fix is bumping kotlinVersion in variables.gradle. |
| 5 | Vite + bindfs npm install renames fail | LOW | Already known; Orlando runs `rm -rf node_modules package-lock.json && npm install` in his terminal |
| 6 | Breath-hold gesture too slippery on cheap touchscreens | MED | Three accessibility modes wired; user can pick triple-tap |
| 7 | Audio focus interruption (call, Spotify) kills the alarm | MED | Phase 3 work — wire `OnAudioFocusChangeListener` in AlarmService |
| 8 | Default audio sounds repetitive on the 30s loop | LOW | Tuesday — generate 90s+ bed with breathing modulation |

---

## Tracking

I'm working this roadmap autonomously. Memory updates per day in
`memory/project_frqncy_app_build.md`. Daily progress notes appended to
`app/docs/SHIPPING-2026-04-29.md`.

If I finish the day's slice early, I move to the next day's. If something
takes longer, I cut scope from that day, not future days.

---

## What needs Orlando this week

- **Sunday or Monday:** Install Android Studio if not done. Run `npm install`
  in terminal once. Open `app/android` in Studio, wait for first gradle sync.
  Report back: "synced fine" or paste any errors.
- **Wednesday or Thursday:** First dogfood. Plug in phone, install APK, arm
  an alarm, sleep, report.
- **Thursday/Friday:** Approve final keystore generation; designate trusted
  testers if you want to go beyond just your phone.

That's it from your end. Everything else is mine.
