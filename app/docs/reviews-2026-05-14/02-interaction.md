# 02 — Interaction review

**Date:** 2026-05-14
**Reviewer:** senior interaction designer (gesture, motion, micro-feedback, perceived performance)
**Target:** FRQNCY mobile app at http://localhost:5173/ — 390×844 viewport (iPhone 14 / 15 baseline)
**Bar:** Apple Sleep Focus, Loftie alarm clock, Endel scene transitions, original Square Cash UI

Findings are numbered, severity-tagged, and traced to exact files and timings. Do not fix in this pass.

---

## 1. Tab bar has no `:active` press state — every tab feels like a glide, not a press [Severity: major]

**Location:** `src/index.html` — `.tab` rule (lines 76–95). No `.tab:active`, `.tab:focus-visible`, or `.tab.pressed` exists. Only `.tab.active { color: #C4973A; }` after class is added.

**Problem:** Tap a tab and the color crossfades over 180ms from `rgba(245,245,245,0.55)` → `#C4973A`. There is zero instantaneous feedback at finger-down. iOS native tab bars compensate for the lack of haptics with an immediate color swap (no transition) + scale on the icon. Here the transition slows the feedback, the icon glyph (◎ ◈ ☾ ◇) doesn't change shape, and there's no `navigator.vibrate` call on the tab handler in `main.ts`. On Android the platform haptic should fire on selection change.

**Fix:** Add `.tab:active { transform: scale(0.94); transition: none; }` on press, fire `navigator.vibrate(6)` on tab change, and consider an instant color flip (`transition: color 0s` on `:active`, then 180ms ease on de-press) so the press visibly lands before the cross-fade.

---

## 2. Surface-swap transition is 200ms opacity-only — Home ↔ Explore feels like a hard cut [Severity: minor]

**Location:** `src/index.html` lines 26–44. `.surface { transition: opacity 200ms ease, visibility 0s linear 200ms; }`.

**Problem:** 200ms is below the perceptual threshold where crossfade reads as motion; it reads as a hard cut with a flicker. There's no scale, no slide. Apple's tab transitions are an instant swap (because the bar is the source of orientation), but a translucent native app reads cleaner with either zero ms (instant) or a real 280–320ms ease-out with a tiny scale-from-0.985. The current 200ms is the worst of both worlds: long enough to notice, too short to feel like motion.

**Fix:** Either drop the opacity transition entirely (`transition: none`) for a clean stack-swap, or extend to 280ms with `cubic-bezier(0.32, 0.72, 0, 1)` and add `transform: scale(0.99) → 1` on the incoming surface.

---

## 3. Iframe loading bar is invisible — wave animation never gets to render [Severity: major]

**Location:** `src/index.html` lines 109–127. `loading-slide` is `1.4s ease-in-out infinite`; bar fades in/out with `opacity 240ms ease`.

**Problem:** Empirically measured: bar shows at t=6ms, removed at t=~150ms for local `/app/*` (iframe `load` fires synchronously fast). For external URLs it stayed ~329ms (frqncy.network/social/). The 1.4s sweep means at 150ms only ~10% of the wave has crossed; at 329ms, ~23%. The 240ms fade-out then masks the rest. **The wave you designed is never seen on local routes and barely seen on external.** Worse, the bar's `transform: translateX(-100%)` starts off-screen left, so the user sees nothing until the wave arrives — by which point load is over.

**Fix:** (a) Replace the slide with an instant-fill indeterminate (full-width gold bar with subtle pulse) so any duration reads as "loading." (b) Set a minimum-visible duration of 400ms before allowing `loading-bar.classList.remove('loading')`. (c) On external URLs, add a 2s "still loading…" fallback if `load` hasn't fired (broken iframes never fire load and the bar fades, leaving a blank frame).

---

## 4. Iframe `load` event lies — CSP-blocked frqncy.network pages clear the bar then show blank [Severity: blocker]

**Location:** `src/main.ts` lines 28–33. `frame.addEventListener('load', () => loadingBar.classList.remove('loading'))`.

**Problem:** If frqncy.network's `frame-ancestors` directive blocks the embed (or if the network is slow), the iframe will either (a) fire `load` on an error document (showing nothing) or (b) hang indefinitely without firing load. In case (a) the user sees the loading bar disappear with no content. In case (b) they wait forever. No timeout. No error UI. No "open in browser" fallback.

**Fix:** Wrap each external load in a 6s timeout. On timeout, show an in-frame "couldn't load — open in browser" affordance. On `load`, post a probe message to the frame; if response isn't received within 200ms (cross-origin will reject), assume the load succeeded but surface an "open externally" pill in case the embed is broken.

---

## 5. Welcome overlay snaps in and out — no fade, no scale [Severity: major]

**Location:** `src/app/bedside.html` lines 298–308. `.welcome-overlay { display: none; }` / `.welcome-overlay.visible { display: flex; }`.

**Problem:** `display: none ↔ flex` toggling cannot be animated. The first-run welcome card materializes instantly and dismisses instantly. There's `transition: all` from browser default (computed), but `display` is not a transitionable property. The user opens Bedside for the first time and the modal cuts in like a JavaScript alert.

**Fix:** Use `opacity` + `visibility` + `pointer-events` instead of `display`. Add `transition: opacity 320ms ease, visibility 0s linear 320ms` for entry; `transition: opacity 240ms ease, visibility 0s linear 240ms` for exit. Animate the card itself with `transform: translateY(8px) → 0` so it rises into the screen rather than appearing.

---

## 6. Bedside has two visible time controls side-by-side — the big "06:45" button and the native time-input pill [Severity: blocker]

**Location:** `src/app/bedside.html` lines 70–101, 397–399. `.time-display` (big 154×64 button) at (45, 76) and `<input type="time">` (88×34 pill labeled "06:45") at (257, 110) are both visible inside `.time-row`. The pill uses `border: 1px solid rgba(245,245,245,0.12)` and is the OS-styled time input.

**Problem:** It looks like two separate controls. The native time picker is meant to be the editor; the big display is the read-only label that opens the same picker on tap (per the JS at line 568). But because the native input is also visible, the user can't tell which one to tap, and tapping the small pill (more discoverable as "tappable") fires the browser's native picker, while the big one calls `.showPicker()` and falls back to focus. Both eventually do the same thing — but visually the duplication is confusing.

**Fix:** Hide the `<input type="time">` (`position: absolute; opacity: 0; pointer-events: none;`) and use it only as a focus target / showPicker trigger. The big "06:45" becomes the only visible control. Add a small "edit" pill ONLY if you want a second affordance.

---

## 7. Breath-hold ring's animation curves disagree — progress is linear, breath is ease-in-out [Severity: major]

**Location:** `src/app/alarm.html` lines 49–57 (breath-pace keyframe, `ease-in-out` 6s) and lines 73 (`stroke-dashoffset 6000ms linear`). Same in `wake.html` lines 61–65 and 86.

**Problem:** Two motion timing functions running side-by-side on the same element. The gold breath-ring scales sinusoidally (slow at apex, fast in middle); the progress ring drains linearly. At t=1.5s the breath-ring is 38% (sine), the progress is 25% (linear) — a noticeable disagreement. By t=3s (apex of inhale, ring at scale 1.12), progress is at 50%. By t=4.5s (exhale midway, ring at scale 1.06), progress is at 75%. The user's body wants to follow one cadence but the visual signals two.

**Fix:** Make both linear (most "breath" exercises use linear because the hold should feel even), OR make both `ease-in-out` (cleaner pacer), but never mixed. Also consider: this is a 6s symmetric box, 10 breaths/minute. Coherent breathing / Loftie's pattern is closer to 5–6 breaths/min (10–12s cycle). The current cadence is at the brisk end of "relaxing."

---

## 8. Wake hint takes 3.8 seconds to appear — user stares at "arrive" with no instruction [Severity: major]

**Location:** `src/app/wake.html` lines 105–108 (`transition: opacity 1800ms ease 2000ms`); line 281 (`setTimeout(() => hint.classList.add('visible'), reducedMotion ? 200 : 2000)`).

**Problem:** On wake screen the hint "hold for one breath" is delayed 2s and fades over 1.8s — fully visible at 3.8s. The bedside practice link is meant for rehearsal, but in production a user wakes up confused and waits nearly 4 seconds before getting the gesture instruction. On the alarm screen the same delay is 1.5s + 1.8s = 3.3s; less bad but still excessive. The hint is also positioned far below the ring (bottom: 80px + safe-area) so peripheral vision may miss it.

**Fix:** Show the hint immediately (delay 200–400ms, fade 800ms) so a sleepy user has guidance within one second. If the design intent is "find it without being told," then move the hint *into* the ring's center ("arrive" → "hold for one breath" → "arrive") rather than below it.

---

## 9. Snooze button is 110×32 on a groggy-user surface — well below 44pt min target [Severity: major]

**Location:** `src/app/alarm.html` line 117 + style block 103–112. Bounding box measured at (264, 20) — 110×32 — top-right corner.

**Problem:** Apple HIG: 44×44pt minimum. Material: 48dp. This is 32 tall. A user at 6am dismissing an alarm, still half-asleep, has to land their thumb in a 110-wide pill at the top corner of the device — physically the hardest reach. The "arrive" ring center is at (195, 422) which is excellent thumb position; snooze is the opposite.

**Fix:** Either grow snooze to ≥48×48 with more padding, OR (better) move snooze to the bottom of the screen mirror-symmetric to the hint, in the bottom safe-area band. Top-right makes sense visually (de-emphasized "escape") but punishes the user when they need it.

---

## 10. Session pause-tap is undiscoverable and unfeedbacked [Severity: major]

**Location:** `src/app/sleep.html` lines 187–204 (`.pause-pill`), 241–246 (session-content tap target), 495–516 (`setPaused`).

**Problem:** Three failures stacked:
- **No visual affordance:** the entire `.session-content` block is tappable (cursor: pointer) but there's no visible cue. No border, no fade-pulse hint on session start, nothing.
- **No `:active` feedback:** there's no `.session-content:active { opacity: 0.7 }` or scale. The tap registers, but nothing changes for 280ms while the pause-pill fades in (`transition: opacity 280ms ease`). The audio pauses immediately; the user wonders if their tap worked.
- **Pause indicator is text 80px above the tab bar, font-size 11.5px** — easy to miss, especially with the screen 240s mid-dim.

**Fix:** (a) On `:active`, immediately dim session-content to 0.6 opacity (instant, no transition) so the tap visibly lands. (b) Make the pause-pill larger (14px+) and pop it in via scale 0.95→1 + opacity 0→1 over 140ms. (c) On first session start, briefly show a "tap to pause" hint that fades after 3s.

---

## 11. Sleep "settle" begin pill is 116×45 — borderline, but `:hover` and `:active` are pooled into the same selector [Severity: minor]

**Location:** `src/app/sleep.html` lines 150–167. `.settle-cta:hover, .settle-cta:active { background: ...; color: ...; }`.

**Problem:** Hover and active are merged: `background: rgba(196, 151, 58, 0.95); color: #0B1C3D;` for both. On touch devices the `:hover` styles get sticky after a tap (the browser keeps the hover state until you tap elsewhere), so the pill stays solid gold long after the user has begun the session — except the session screen has already covered it, so it's invisible. On a desktop or hybrid surface this leaves visual residue.

**Fix:** Separate states: `:hover` for desktop pointer hover, `:active` for touch press (with a faster transition, ~80ms, since `:active` is brief by nature). Use `@media (hover: hover)` to guard `:hover` rules entirely on touch.

---

## 12. Switch toggle has no haptic + no immediate visual confirmation [Severity: major]

**Location:** `src/app/bedside.html` lines 131–149, 547–556.

**Problem:** Tapping a `.switch` flips `on` class. Background transitions 220ms; knob translates 220ms. No `navigator.vibrate`, no `:active` scale, no momentary highlight. iOS UISwitch fires a subtle haptic and the toggle slides with spring physics (slight overshoot). Here the motion is linear and silent. On the welcome overlay flow a user is configuring three switches in a row and gets no sensory confirmation.

**Fix:** Add `navigator.vibrate(8)` in the switch click handler. Replace `transition: transform 220ms ease` on the knob with `cubic-bezier(0.34, 1.56, 0.64, 1)` (overshoot easing) at 280ms to recreate the iOS spring. Add `.switch:active { transform: scale(0.96); }` for direct press feedback.

---

## 13. Arm-for-tonight button has no `:active` state — primary CTA gives no feedback before async work [Severity: blocker]

**Location:** `src/app/bedside.html` lines 150–166. `.arm-btn` rule has no `:active`, no `:hover`, no pending state.

**Problem:** User taps "arm for tonight." On dev/web the flow is synchronous toggle. On device, `arm.click` runs `await FrqncyAlarm.checkPermissions()`, `await requestPermissions()` if denied, `await schedule()`, optional `await schedule(prewake)`, `await armKeepAlive()`. This is 100ms+ on a happy path, seconds on a permission-request path. During that whole time the button shows zero pending state — no spinner, no opacity dim, no disabled cursor. User taps again. Now `armed` flips twice. Race condition + bad feel.

**Fix:** (a) On `:active`, scale(0.985) + opacity 0.8 immediately. (b) On click, disable the button (`arm.disabled = true`) and replace text with "arming…" plus a tiny gold pulse animation. (c) Re-enable on resolve/reject. (d) Same treatment for the `oem-card` ok/later, the `welcome-cta`, and `sleep-entry` button — none have `:active` either.

---

## 14. Reflection textarea doesn't autofocus, but the design rationale ("don't yank attention") leaves the keyboard hidden and the field looking decorative [Severity: minor]

**Location:** `src/app/wake.html` lines 211–219, 369–371 (comment: "Don't autofocus — that yanks attention to a textarea before the user has read the prompt").

**Problem:** Honest tradeoff but pragmatically the user reads the prompt, then has to tap the textarea (a 14px font-size, 140px tall block) to bring up the keyboard. There's no visual indicator that it's an active editable surface vs. a card — the field is `rgba(255,255,255,0.04)` background with `rgba(255,255,255,0.08)` border, identical styling to non-interactive cards elsewhere. The placeholder is `italic` at 0.32 opacity — half-visible on a dim wake screen.

**Fix:** Keep the no-autofocus decision, but make the field obviously editable: increase placeholder contrast to 0.55, add a 1px golden focus-ring affordance even before tap (`border-color: rgba(196,151,58,0.18)`), and add a faint label *above* the field ("write to yourself") so it reads as input, not card.

---

## 15. Reflection field's :focus state is the same border-color change at 200ms — no animated focus ring [Severity: minor]

**Location:** `src/app/wake.html` lines 153–156. `.reflection-field:focus { border-color: rgba(196, 151, 58, 0.45); background: rgba(255, 255, 255, 0.06); }` with `transition: border-color 200ms ease, background 200ms ease`.

**Problem:** Focus is communicated only by a subtle border tint shift. There's no scale, no inset glow, no outline. For an accessibility-flagged surface (Wake screen, low-contrast environment), the focus state needs to be unambiguous. Also: `outline: none` is forced (line 149), so keyboard users lose the focus ring entirely.

**Fix:** Add `box-shadow: 0 0 0 2px rgba(196, 151, 58, 0.18);` on focus for a soft halo. Keep `outline: none` only for mouse focus (`:focus:not(:focus-visible)`), restore `outline` for `:focus-visible` (keyboard navigation).

---

## 16. Brand-mark breath (8s) and alarm-ring breath (6s) disagree — two different breath cadences across the app [Severity: minor]

**Location:** `src/index.html` lines 165–174 (brand-breathe 8s ease-in-out infinite); `src/app/alarm.html` lines 49–57 (breath-pace 6s ease-in-out 1).

**Problem:** Home logo breathes at 7.5 breaths/min. Alarm dismiss ring breathes at 10 breaths/min. The user trains their nervous system on the home cadence then is asked to follow a 33% faster cadence to dismiss. If you're using breath as a design language, lock the cadence.

**Fix:** Pick one cadence — recommend 8s (Andrew Huberman / coherent breathing standard) — and apply to both. If the dismiss has to be 6s for product reasons, decouple the visual ring from "breath" semantically and call it a hold-progress indicator.

---

## 17. Field gradient fades over 60s on alarm but starts immediately on page load even in practice mode [Severity: minor]

**Location:** `src/app/alarm.html` lines 25–31 (`transition: opacity 60s linear`); line 215 (`requestAnimationFrame(() => field.classList.add('active'))`).

**Problem:** The 60s sunrise field is supposed to mirror the alarm's 90s fade-in tone (per `wake.html` it's 90s; on alarm.html it's 60s — itself an inconsistency). In practice mode (`?preview=1`) the same fade runs even though there's no audio, no sunrise narrative. The user practicing the dismiss gesture sees a slowly-brightening field with no source, no story. Worse: the 60s here vs 90s on wake.html is unexplained — same component, two timings.

**Fix:** (a) Unify alarm and wake field fade timing (recommend 60s on both, matching the spec's 90s audio fade-in only by intent). (b) In `?preview=1`, set the field to its final state immediately so practice mode looks like the wake-up endpoint, not a half-finished one.

---

## 18. Time-display button's `:active` is opacity 0.6 with 160ms ease — feels mushy, not pressy [Severity: minor]

**Location:** `src/app/bedside.html` lines 70–84. `.time-display:active { opacity: 0.6; }` with `transition: opacity 160ms ease`.

**Problem:** The big "06:45" should feel like a button you press to open the time picker. Opacity-only press feedback at 160ms reads as fade, not press. Apple's clock app uses a subtle scale + tone shift (the digit itself contracts). Also: `cursor: pointer` is set but on touch there's no scale or color flash to confirm the tap before `showPicker()` is called.

**Fix:** Replace with `transform: scale(0.97); transition: transform 90ms ease`. Drop opacity. The scale should be fast (90ms) so the press registers, with an instant-on transition (`transition: none` on `:active`, normal transition on release).

---

## 19. Bedside-armed mode hides essential controls behind 0.32 opacity — and `:hover` brings them back, but touch doesn't [Severity: major]

**Location:** `src/app/bedside.html` lines 25–39. `body.bedside-armed .toggle-row { opacity: 0.32; }`; `body.bedside-armed .toggle-row:hover { opacity: 1 }`.

**Problem:** Once armed, toggles fade to 32% opacity to reduce stimulation — good intent. But `:hover` only works on pointer devices; on touch, the toggles stay at 32% opacity. To change a setting at night, the user has to find a near-invisible control, tap it, and only on `:focus-within` does it brighten — except `focus-within` only fires for focusable children, and the `.switch` is a `<div>` (not focusable by default). So on touch, the toggles stay dim through interaction. Tap a dim switch, it flips, and nothing visibly brightens.

**Fix:** Add `:active` to the rule: `body.bedside-armed .toggle-row:active`. Make `.switch` focusable (`tabindex="0"`) so `:focus-within` actually triggers. Or simpler: on first `pointerdown` anywhere in `.alarm-card`, add a class that lifts all opacity to 1 for 8s, then fades back to 0.32. The "wake the chrome on touch" pattern from Apple Music's now-playing lock screen.

---

## 20. OEM overlay and welcome overlay both block tab bar interaction without animation — they snap in, they snap out [Severity: minor]

**Location:** `src/app/bedside.html` lines 207–225 (oem-overlay) and lines 298–308 (welcome-overlay). Both use `display: none ↔ flex` toggling.

**Problem:** Same as finding 5 but applies to the OEM (Android battery-management) warning. First time a user arms, on Android, the OEM card cuts in with no fade. Dismissing it via "later" cuts it out. For modals that interrupt a critical flow (arm-the-alarm), the lack of motion makes them feel like errors rather than design choices.

**Fix:** Convert both to opacity + visibility transition (as in finding 5). The card itself should rise (translateY: 12px → 0) over 320ms with `cubic-bezier(0.32, 0.72, 0, 1)`.

---

## 21. Snooze button "return · 9 min" — wording is on-brand, but no progress / count UI on subsequent snoozes until snooze 2 [Severity: minor]

**Location:** `src/app/alarm.html` lines 117 + 193–196.

**Problem:** First snooze: button reads "return · 9 min." Second snooze (1 used, 1 left): button reads "return · 9 min · 1 left." Third return (2 used, 0 left): button hidden, golden note appears. Inconsistency: the first snooze gives no indication that there's a cap. A user who casually returns twice is surprised that the third option is gone.

**Fix:** Show the remaining count from the first snooze onward: "return · 9 min · 2 left" on initial firing. Communicate the cap upfront so the user understands the relationship.

---

## 22. Iframe `src` swap doesn't preserve scroll position cross-iframe-document — every tab swap into Bedside re-renders [Severity: minor]

**Location:** `src/main.ts` lines 56–66. Skip-reload check only fires `if (frame.src !== resolvedSrc)` — but the iframe document state (scroll, form input) persists, so this is correct. However, the *first* time a tab is visited the iframe loads fresh. The fade-in is 200ms but the iframe content paint takes longer (200–400ms in dev, more on cold start). User sees a flash of dark navy before content paints.

**Fix:** Pre-warm critical iframes on app boot. After main bootstrap, do `frame.src = '/app/bedside.html'` then immediately swap to '/' — the iframe is now warmed and tab visits don't repaint. Same trick Apple uses for keyboard pre-render.

---

## 23. Loading bar has no minimum visible duration and no perceived-progress indicator — fast loads feel broken [Severity: minor]

**Location:** Same as finding 3.

**Problem:** Counter-intuitive but true: when a load takes 100ms, the user perceives "nothing happened" even though everything succeeded. A 250ms minimum-visible window makes fast loads feel intentional rather than missing. Square Cash's progress indicators do this — they will *hold* the indicator for a beat to assert the operation completed.

**Fix:** When `startLoading()` runs, record `t0 = Date.now()`. On `load` event, compute `elapsed = Date.now() - t0`. If `elapsed < 400`, `setTimeout(() => loadingBar.classList.remove('loading'), 400 - elapsed)`.

---

## 24. Offline banner positioned at `top: env(safe-area-inset-top)` AND the surface also starts at `top: env(safe-area-inset-top)` — they overlap when banner shows [Severity: minor]

**Location:** `src/index.html` lines 98–107 (offline-banner), 26–28 (.surface), 49–51 (#site-frame).

**Problem:** When `.show` is added, banner slides down (`transform: translateY(-100%)` → `translateY(0)`). It sits in the safe-area-inset-top band — same band as the content surface. The surface doesn't shift down to make room. So when offline, the banner covers the first ~38px of content. On iOS with notch this overlaps the page header.

**Fix:** When `.show` is active on banner, also add a class to body that shifts surfaces down: `body.offline .surface, body.offline #site-frame { top: calc(env(safe-area-inset-top) + 38px); }` with a matching 240ms transition.

---

## 25. Time input field shows native time picker chrome that doesn't match the app's design language [Severity: minor]

**Location:** `src/app/bedside.html` lines 258–266.

**Problem:** The `<input type="time">` styling — rounded rectangle with light gray border, light text on dark, 12px font — is custom styled but the native picker UI that opens (iOS wheel picker, Android dialog) is entirely OS-default and breaks the app's voice. There's no way to fully style the picker. But the *visible field* could be hidden as in finding 6, and the picker invoked solely via `showPicker()`.

**Fix:** Hide the visible input. Use it as an invisible state holder. Triggered only by `.time-display` click via `showPicker()`. Reduces visual debt at the cost of one fewer affordance.

---

## Summary

The app's interaction design has good editorial intent (calm, slow, deliberate) but the execution is missing the micro-feedback that makes "calm" feel intentional rather than absent. The biggest gaps: (a) primary CTAs have no `:active` state, so taps feel disconnected from results; (b) the iframe loading bar is invisible in practice; (c) the welcome and OEM overlays snap in and out via `display: none`; (d) the breath-hold ring's two motion curves disagree; (e) bedside has duplicate time controls visible side-by-side.

Fixing the missing `:active` states across `.arm-btn`, `.sleep-entry button`, `.oem-card button`, `.welcome-cta`, `.tab`, `.switch`, and `.option` would close ~40% of the gap on its own — a tap-anywhere consistent press state is the cheapest haptic substitute on the web.
