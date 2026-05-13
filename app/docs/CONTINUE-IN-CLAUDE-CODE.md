# Resume FRQNCY app work in Claude Code

This file is the entry point if you're picking the project up in Claude Code
CLI. Open the project folder (`cd ~/Documents/Claude/Projects/FRQNCY\ WEBSITE`),
run `claude`, and start a new session. The first prompt Claude Code sees should
be one of the canned ones below.

---

## State of the project right now (2026-05-13)

The Android app is **source-complete** and **kotlinc-verified clean**. The
remaining gap to APK-on-phone is one terminal pass + one Android Studio build.
iOS is week-2 work; not addressed in the current week.

Every weekly slice of the perfect-week roadmap landed in code:

- **Sunday (foundation):** colors.xml fix (was a real gradle blocker), branded
  splash, status/nav bar tinting, Cloudflare Pages telemetry endpoint at
  `functions/api/alarm-error.js`, `Telemetry.kt` posting from AlarmReceiver.
- **Monday (UX polish):** snooze cap at 2 with "third return — hold to arrive"
  copy, AlarmActivity cold-start hardening (native fallback if WebView fails
  to load in 4s), video-field toggle persistence, error toasts replacing
  alert(), inline About in settings.
- **Tuesday (audio):** four bundled audio variants in `res/raw/`
  (default_morning 90s, default_evening 60s, default_stillness 60s,
  default_release 60s; all loop-clean), AlarmService picks the right one by
  moment, audio focus interruption recovery (pause on call, resume after),
  sleep.html bundled fallback via `app/public/audio/`.
- **Wednesday (first-run UX):** home-tab welcome overlay, smart resume to
  bedside (open app within 12h of arming → Bedside), voice audit pass —
  zero generic-product-speak survives.

Sources of truth, in priority order:

1. `app/docs/SHIPPING-2026-04-29.md` — current state + terminal commands.
2. `app/docs/PERFECT-WEEK-ROADMAP-2026-05-03.md` — day-by-day delivery log.
3. `app/docs/ROADMAP-2026-04-29.md` — 12-week sequenced plan and risk register.
4. `app/docs/research/stream-{1..7}-*.md` — seven research reports that
   informed the architecture.
5. `app/docs/REVIEWER-NOTES.md` — App Store + Play submission templates.
6. `app/docs/SPEC.md` — original April-2024 architectural spec (still
   authoritative where roadmap doesn't override).
7. `app/docs/HANDOFF-2026-04-24.md` — original session handoff.

---

## What's blocked / waiting on Orlando

These need your machine, not Claude Code:

1. `npm install` in the app folder (Cowork sandbox can't finish bindfs
   renames on multi-package post-installs; the user's terminal handles this
   in 60–120 seconds).
2. Android Studio install + first gradle sync (~5–10 minutes the first time
   to download SDK 35 and the AGP/Kotlin gradle plugin cache).
3. `npx cap open android` → ▶ Run on a connected Android phone OR Build →
   Build APK(s) to produce a signed-debug APK.
4. Sideload to phone (AirDrop / Google Drive / USB-debug install).

---

## Canned first-prompts for Claude Code

If your first message to Claude Code is one of these, the session gets you
unstuck fast:

**"Where are we and what's the next step?"**
> Read `app/docs/SHIPPING-2026-04-29.md` and `app/docs/PERFECT-WEEK-ROADMAP-2026-05-03.md`. Summarize where we are, what compiles, and the exact terminal sequence to produce the APK.

**"Verify the build is still clean."**
> Run `/app-verify`. If it errors, paste the error and we'll fix.

**"Cap sync and rebuild the web bundle."**
> Run `/app-sync`. Confirm the synced files in `android/app/src/main/assets/public/`.

**"I got a gradle sync error in Studio."**
> Show the exact error. Most common fixes: kotlinVersion mismatch in
> `variables.gradle`, missing `@color/...` resource, AGP 8.7.2 + Java 21
> mismatch. Walk me through one at a time.

**"I have the APK on my phone — alarm didn't fire."**
> Check the logcat for `FrqncyAlarm` and `FrqncyTelemetry` tags. The most
> common cause on Android 14+ is `ForegroundServiceStartNotAllowedException`
> — that's the exception `AlarmReceiver.kt` already catches and reports to
> `/api/alarm-error`. Pull the Cloudflare Pages log.

**"Continue iOS prep — week 2 work."**
> Read `app/docs/ROADMAP-2026-04-29.md` Phase 2 (iOS bedside end-to-end).
> Manual step is dragging `ios/App/App/FrqncyAlarm/FrqncyAlarmPlugin.swift`
> + `Resources/` into the Xcode project navigator (.pbxproj UI). Everything
> else is source-side prep.

---

## Slash commands

Available in `.claude/commands/`:

- `/app-build` — full Vite build + cap sync.
- `/app-sync` — copy already-built dist into Android assets without rebuilding.
- `/app-verify` — kotlinc compile check against full classpath.
- `/app-apk` — generate signed-debug APK (delegates to gradle; requires Studio
  SDK installed locally).
- `/app-state` — print current state summary (mostly reads SHIPPING + roadmap docs).

---

## What NOT to do (per `proposals/FRQNCY-VOICE-PLAYBOOK.md`)

- No leaderboards, no streaks, no celebrity voices, no shame-based wake
  missions, no sleep scores displayed back, no "you have unlocked X."
- The breath-hold dismiss is the gesture. Don't replace it with a math
  puzzle or a photo capture.
- Honesty about reliability is a marketing posture, not a bug — keep the
  "phone alarms on Android can fail" disclaimer prominent.
- No medical claims. "Frequency" and "consciousness practice" language
  stays poetic, never therapeutic.

---

## Style for chat responses in Claude Code

- Prose for explanations to Orlando, not bullet lists.
- Lean documentation. Headers, short sections, one example per concept.
- Single-line copy-pasteable terminal commands. No backslash continuations.
- Commit messages descriptive but not multi-line in chat suggestions.
