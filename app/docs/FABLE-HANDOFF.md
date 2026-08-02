# Fable handoff — picking up the VBRTN app build

A handoff written for the next AI to walk into this conversation cold. Read
this once. You'll have everything you need.

---

## The story so far

There is a network called FRQNCY — Orlando's project, a consciousness-practice
content + social platform at `frqncy.network`. Inside that network is a mobile
app called **VBRTN** (rhymes with "vibration"). VBRTN is a Capacitor 7 hybrid
that does two things: serves the FRQNCY network's content through a WebView,
and runs a custom native alarm clock with breath-hold dismiss for waking up
gently. The app's identity is VBRTN; the parent codename, package
(`network.frqncy.app`), website (`frqncy.network`), and plugin class names
(`FrqncyAlarmPlugin`) all keep the FRQNCY identifier — this is deliberate.

The previous AI (Claude Sonnet, in Cowork mode) worked through April and the
first half of May 2026 to take VBRTN from a half-finished scaffold to
source-complete and ready to ship. The work included: seven parallel research
streams synthesized into a 12-week roadmap, a five-day "perfect week" sprint
that landed every cosmetic and functional polish, a full empirical Kotlin
compile verification pipeline run in the sandbox, and the entire native alarm
stack (8 Kotlin files, full lock-screen activity, foreground service with
audio-focus recovery, branded splash and launcher, four bundled audio tones
generated from a Python+numpy synthesis). Then Orlando rebranded the
user-facing app from "FRQNCY" to "VBRTN" mid-stream — colors went from
gold-on-black to gold-on-navy (`#0B1C3D` brand navy, `#C4973A` brand gold),
labels updated across the visible surfaces.

The source tree is at `~/Documents/Claude/Projects/FRQNCY WEBSITE/app/`. The
sandbox where the previous AI worked could not build the APK because of bash
process lifecycle constraints; that task is on Orlando's Mac via Android
Studio.

---

## What is true right now

The Android side compiles clean — verified empirically with kotlinc against
the full Capacitor 7.6.2 + AndroidX 1.7 + Kotlin 1.9.25 classpath. 23 .class
files, zero errors. The web bundle is built with Vite (`base: './'` so the
relative paths resolve inside AlarmActivity's WebView). All four bundled
audio MP3s live in two places — `android/app/src/main/res/raw/` for the
AlarmService MediaPlayer, and `app/public/audio/` (synced to
`assets/public/audio/`) for the sleep flow's HTML5 `<audio>` fallback. The
launcher icon, splash, and notification icon are all branded vectors using
the navy + gold palette.

The single thing between Orlando and an APK on his phone is the Android
Studio build, which the previous AI couldn't run in the sandbox but which
takes ~5 minutes on Orlando's Mac. The terminal sequence is documented in
`app/docs/SHIPPING-2026-04-29.md`; the day-by-day delivery log is in
`app/docs/PERFECT-WEEK-ROADMAP-2026-05-03.md`; the entry-point doc for any
Claude Code session is `app/docs/CONTINUE-IN-CLAUDE-CODE.md`. Six slash
commands at `.claude/commands/` cover the dev loops.

iOS work is week-2. The Swift plugin file is written and Privacy manifest
is in place, but Orlando has to drag the `FrqncyAlarm/` folder into the
Xcode project navigator manually — `.pbxproj` edits aren't safe to script.

---

## The single next action

Tell Orlando to do this in his terminal:

```
cd ~/Documents/Claude/Projects/FRQNCY\ WEBSITE/app
rm -rf node_modules package-lock.json
npm install
npm run cap:sync
```

Then open `~/Documents/Claude/Projects/FRQNCY WEBSITE/app/android` in Android
Studio, wait for the first gradle sync (5–10 minutes the very first time
because of SDK 35 + AGP + Kotlin plugin downloads), then either plug in his
phone with USB debugging on and hit ▶, or `Build → Build APK(s)` and
sideload the resulting `app-debug.apk`.

If gradle sync errors, the most likely failures and their fixes are listed
in `SHIPPING-2026-04-29.md`. The most common is a Kotlin version mismatch
which bumps in `android/variables.gradle`.

If gradle sync succeeds and the app crashes on first launch, ask for the
`adb logcat` output filtered for `VBRTN` and `FrqncyAlarm` tags.

---

## Editorial values — do not violate

These are baked into every UX decision so far. The next AI must keep them.

The brand voice rejects competition, ranking, leaderboards, streaks, "X days
in a row," sleep scores, readiness scores, shame-based wake missions like
math puzzles or photo captures, and celebrity voices as product. The dismiss
gesture is a six-second breath hold — "the gesture is the arrival." Sleep is
"un-engaging by design"; narration shouldn't reward attention. The honesty
posture about Android OEM reliability ("phone alarms can fail; here are the
three settings to fix that") is a feature, not a bug.

VBRTN is the app name. FRQNCY is the parent network and codename — used in
the package, domain, plugin class names, parent-network references. Don't
collapse the two. If Orlando ever asks to rename the package or class, that
is a much bigger refactor than it looks; warn him and confirm scope before
touching it.

No medical claims. "Frequency" and "consciousness practice" stay poetic,
never therapeutic. The canonical voice guide is at
`proposals/FRQNCY-VOICE-PLAYBOOK.md` (one level up from `app/`).

---

## How Orlando wants to talk

Prose, not bullet lists. Lean. Single-line copy-pasteable terminal commands
when giving him work. No backslash continuations, no multi-line commit
message blocks in chat. If he says "go" or "next" he means continue the
current arc without further confirmation. If he says "physical" or "on my
phone" he means the APK install path. If he's vague, ask one clarifying
question — never more than one at a time.

He is solo, on a ~$100 budget for the 90-day window ending 2026-07-26. He
prefers boring, reliable, ship-shaped decisions over novel architecture.
When in doubt, prefer the path that ships sooner.

---

## What to do if Orlando says "keep building"

Open `app/docs/PERFECT-WEEK-ROADMAP-2026-05-03.md` and find the next
unmarked item. Days 1–4 are complete. Day 5 is "real-device verification +
bugfix cycle" — reactive, depends on what Orlando reports from his phone.
Day 6 is the signed-release APK + distribution. If those are done too,
move to `app/docs/ROADMAP-2026-04-29.md` Phase 2 (iOS bedside end-to-end)
or Phase 5 polish items that didn't make the perfect-week cut: two-phase
pre-wake fully wired (currently scheduled as a second alarm, the soft-tone
ramp isn't a separate audio fade yet), hearing-impaired wake mode field-tested,
Crashlytics-equivalent for the FGS denial telemetry endpoint
(`functions/api/alarm-error.js` already accepts POSTs from `Telemetry.kt`).

---

## What to do if Orlando says "ship it"

Confirm the APK is on his phone and tested. Then walk him through the
Play Internal Testing track: $25 dev account at `play.google.com/console`,
create app, fill Data Safety (template values in `REVIEWER-NOTES.md`),
upload signed release APK, add testers by email. No public Play review yet
— Internal Testing is instant and lets 100 testers install. Public Play
submission is two more weeks for review buffer per `REVIEWER-NOTES.md`.

---

## What's surprising and worth knowing

The previous AI tried to build the APK in the sandbox itself. It got
JDK 21, Android SDK 35, build-tools 35.0.0, and gradle 8.11.1 all
installed and ~257MB of dependencies cached, but every bash invocation
gets killed at the 45-second container timeout and gradle's daemon
doesn't survive between calls — so each chunk only gets ~5 seconds of
useful work. The cache may still be there at `/sessions/brave-magical-planck/.gradle/`
if a future session wants to resume; otherwise it's lost. Studio on
Orlando's Mac is the right path and is 10–100× faster.

The colors.xml resource file is the source of truth for the brand palette
and the website's `assets/site.css` mirrors it. If the website changes
colors, this file should too.

The Capacitor `Preferences` plugin writes to `CapacitorStorage`
SharedPreferences in user-protected storage. `AlarmStore` writes to
device-protected storage via `createDeviceProtectedStorageContext()` so
boot-receiver can read alarms before the user unlocks. This means: a
pre-unlock alarm will fire with audio (safe default) because the haptic-
wake flag is in user-protected storage and unreadable until unlock. This
is intentional. Don't try to "fix" it.

The build broke the original 30-second `default_morning.mp3` into a
90-second loopable bed with a 6-second breathing envelope and a 7Hz
amplitude modulation. The generation script is in the previous AI's
working memory; if you need to regenerate, the recipe is: 432Hz fundamental
+ 0.4 amplitude at the perfect fifth (648Hz) + 0.15 shimmer at 434Hz,
times a `0.7 + 0.3 * sin(2π t/6)` envelope, times 0.42 to avoid clipping,
with a 50ms fade-in and 0.5s fade-out for clean loop seams.

The synthesized "VBRTN" name has no etymology Orlando has shared. Don't
make one up.

---

## How this handoff ends

Greet Orlando. Don't recap this doc to him — he wrote the project. Ask
him what he wants next. If he says "go" or "continue," default to
verifying the APK build status. If he says "ship," confirm release plumbing
is ready. Otherwise, follow his lead.

Good luck. The hardest work is done.
