# Edge cases and shipping issues — FRQNCY app (2026-05-14)

Reviewer: senior mobile shipping engineer. Approach: read `app/src/main.ts`, `app/src/lib/sync-manager.ts`, `app/src/native/frqncy-alarm.ts`, and the five `app/src/app/*.html` surfaces; then attack the running Vite dev build at http://localhost:5173/ with Playwright MCP. Goal: surface what a real user (drained battery, 3G, OEM, screen-reader, fat fingers, lost network) will break. No fixes applied here.

The findings are numbered. Severity is one of blocker / major / minor. "Location" is line-based and points to the file as it exists on disk today.

---

## 1. Loading bar stays on forever if the iframe fails to load — [Severity: blocker]

**Location:** `app/src/main.ts:31-36, 50-97`; `app/src/index.html:120-148` (#loading-bar).

**Repro:** in the app, point `frame.src` at any URL whose host won't resolve (DNS fail, captive-portal, real-world 3G timeout). Empirically reproduced in Playwright: `frame.src = 'https://10.255.255.1/never-resolves'` → loading bar still has class `loading` 3000ms later. The HTML only has `frame.addEventListener('load', ...)`. There is no `error` listener and no inactivity timeout.

**Why it's a blocker:** the moment a user opens Sanctuary while on a flaky cell connection — exactly the moment FRQNCY needs to feel calm — the slim gold strip pulses indefinitely at the top of the screen until the user kills the app. There's no path that ever fires the `load` event for a failed cross-origin iframe in WebKit-based WebViews, so it strands itself.

**Fix surface:** wire an `error` listener on the iframe, plus an inactivity timeout (e.g., 12s → hide the bar and show the offline banner) inside `startLoading()`. Same fix needs to clear the banner on success.

---

## 2. Arm/disarm has no in-flight guard — double `schedule()`, double permission prompt — [Severity: blocker]

**Location:** `app/src/app/bedside.html:610-713` (the `arm` click handler).

**Repro:** the handler reads `armed` (closure-local boolean), awaits `FrqncyAlarm.checkPermissions()`, then `FrqncyAlarm.requestPermissions()`, then `FrqncyAlarm.schedule()`. The `armed = true` is only assigned *after* `schedule()` resolves. If the user double-taps "arm for tonight" (or the device dispatches a synthetic second click during a layout shift), the second handler enters with `armed === false`, kicks off a second permission request and a second `schedule()` for the same `ALARM_ID`. On Android that means two side-by-side permission dialogs and a duplicate AlarmManager registration; on iOS it means two `requestAuthorization` calls and double work.

**Why it's a blocker:** the visible failure mode is "user taps arm, sees nothing happen, taps again, gets two OS dialogs and a `cancel failed` warning when they try to disarm because the duplicate schedule survived." There's nothing in the disarm path that maps to multiple in-flight scheduling either.

**Fix surface:** introduce `let arming = false` at the top of the handler, return early if set, clear in `finally`. Same applies to `cancel()` path.

---

## 3. `radial-gradient` `field` 60s fade-in keeps running while paused — [Severity: major]

**Location:** `app/src/app/sleep.html:79` (`transition: opacity 1200ms ease 600ms, background 240s linear;`) and `alarm.html:30` (`transition: opacity 60s linear;`) and `wake.html:33` (90s linear).

The visual ramp is implemented as a pure CSS transition. The JS pause logic in sleep.html (`setPaused`) pauses the audio + the tick timer and freezes `elapsedMs()`, but **the CSS transition keeps animating regardless**. If a user pauses at minute 2, comes back at minute 30, the background is already 14% of the way to "minute 4 warm near-black" — `session.dimming` adds at 100ms unconditionally — so the visual aging is decoupled from the actual session age. Compound: there's no way to tell from the screen how much real session time has elapsed.

**Fix surface:** either freeze the transition via `transition: none` on pause (and re-apply the remaining duration on resume), or drive the gradient from JS so it respects `pausedAt`.

---

## 4. Sleep session aria-hidden never updated after open; chooser aria-hidden never set — [Severity: major]

**Location:** `app/src/app/sleep.html:239` (session aria-hidden=true at load), `sleep.html:431-434` (startSession only adds `.visible`, doesn't update aria-hidden), `sleep.html:539-547` (settle open/close *does* update aria-hidden).

**Repro:** Playwright eval after `option.click() → settle-cta.click()` → `session.getAttribute('aria-hidden')` returns `"true"` while `session.classList.contains('visible')` is true. So screen readers will treat the live prompt area as hidden the entire time.

**Why major:** users on VoiceOver/TalkBack get no audible cue for the prompt rotations (`'arrive where you are.'` etc.) — defeats the whole purpose of `aria-live` on `#session-prompt`.

**Fix surface:** mirror `aria-hidden` to `!visible` on session and chooser, the way settle already does.

---

## 5. Modal overlays have `aria-modal="true"` but no focus management or focus trap — [Severity: major]

**Location:** `app/src/app/bedside.html:444-469` (welcome-overlay), `455-469` (oem-overlay). Same pattern.

**Repro:** Playwright eval on fresh bedside.html: `document.activeElement.tagName` is `BODY` while the welcome overlay is showing with `aria-modal="true"`. There is no autofocus on `#welcome-cta`, no Tab-key trap, no Esc-to-close, no `inert` on the page behind. Screen-reader users tabbing forward step right out of the modal into the time input below; sighted users on hardware keyboards (Bluetooth on phones is real, especially for accessibility) escape similarly.

**Why major:** `aria-modal="true"` is a *promise* that focus is trapped. Breaking that promise is worse than not having the attribute.

**Fix surface:** on `.visible`, call `welcomeCta.focus()`, capture `lastFocus = document.activeElement`, trap Tab inside the dialog, restore focus on close, listen for Esc.

---

## 6. `?embed=1` lost on every internal navigation inside the iframe — [Severity: major]

**Location:** `app/src/main.ts:78-108` (`openExternal` + `withEmbed`).

**Repro:** `openExternal('https://frqncy.network/my-frqncy/dashboard/')` sets `frame.src = '...?embed=1'`. The site reads that and hides its own header. Good. Now the user clicks any link inside the embedded page — `<a href="/social/">`. The iframe navigates to `https://frqncy.network/social/` *without* `?embed=1`. The site's `body.frqncy-embed` class is now absent → site header reappears → the user sees both FRQNCY's site-nav and the app's bottom tab bar. Doubled chrome on the very first internal link.

**Fix surface:** either set a sticky cookie / sessionStorage flag on the embed origin (`frqncy-embed=1`) that the site reads in addition to the query, or intercept the same-origin iframe's anchor clicks (when the frame is same-origin in dev) and rewrite URLs. Easiest: site-side change to remember `?embed=1` for the session.

---

## 7. Iframe history `wentBack` flag set to true even when `iframe.history.back()` is a no-op — [Severity: major]

**Location:** `app/src/main.ts:163-185` (Android backButton handler).

The cross-origin branch (`catch { try { iframe.history.back(); wentBack = true; }`) sets `wentBack = true` regardless of whether there's history to go back through. On any cross-origin iframe (i.e., live frqncy.network), Android back becomes a black hole: each press calls `back()` which silently does nothing once at depth 1, and the app *never* falls through to the "return to active tab" branch or `App.exitApp()`. The user can't back out of Sanctuary on Android by pressing back.

**Fix surface:** on cross-origin, don't blindly set `wentBack = true`. Listen for the iframe's `popstate` (won't fire cross-origin) — a cleaner option is to track an internal "back-pressed-twice-with-no-effect" counter and exit then.

---

## 8. `frame.contentDocument` / `contentWindow` accessed without same-origin guard — [Severity: major]

**Location:** `app/src/main.ts:167-180`.

The code does `const iframe = frame.contentWindow;` then `iframe.history.length`. The first access succeeds even cross-origin (`contentWindow` is non-null), but `iframe.history.length` throws `SecurityError`. The code does catch this — but a more dangerous case is `frame.contentDocument`, which can be `null` (cross-origin) or `null` during a navigation. There's no place in main.ts that touches `contentDocument`, so this is only a near-miss — but the existing pattern of "treat the iframe as same-origin" will bite anyone who adds a feature in this surface area.

**Fix surface:** factor a `safeIframeAccess(fn)` helper that checks origin before any read, returns null otherwise.

---

## 9. `cancel failed` warning swallowed — user never knows the alarm didn't disarm — [Severity: major]

**Location:** `app/src/app/bedside.html:624-639` (the disarm branch).

If `FrqncyAlarm.cancel(...)` rejects (permission revoked mid-session, plugin error, race with native side), the catch block logs `console.warn('cancel failed', err)` and **returns silently**. The visual state of the button is NOT rolled back — the user sees "armed · tap to disarm" still highlighted. They tap again, second cancel may succeed or fail, no toast, no indication. Their phone will ring tomorrow morning.

**Fix surface:** `showToast("couldn't disarm — try again, or kill the app to force-cancel")` on the catch path. Don't change `armed` until cancel resolves; if it rejects, leave armed=true (which the code already does), but tell the user.

---

## 10. Pre-wake schedule failure leaves user thinking primary alarm is pre-wake — [Severity: major]

**Location:** `app/src/app/bedside.html:667-685` (the pre-wake schedule block).

If `FrqncyAlarm.schedule(...)` for the primary alarm succeeds, then the pre-wake schedule fails (`catch (e) { console.warn(... 'pre-wake scheduling failed') }`), the code continues as if pre-wake is armed. The toggle still says "gentle pre-wake" is ON. The label on the lock-screen says "FRQNCY · gently" only when the pre-wake fires — except it never does. The user wakes up at the actual time, then thinks: "I never got the gentle pre-wake. The app is broken."

**Fix surface:** if pre-wake fails, either flip the prewake switch off visually, show a one-line toast ("gentle pre-wake unavailable — primary alarm is set"), or both.

---

## 11. `localStorage` is the only store for dismiss-mode + switches; survives WebView reset but not user "Clear data" — [Severity: major]

**Location:** `app/src/app/bedside.html:531-556` (SWITCH_PREFS), `app/src/app/settings.html:361-374` (dismiss-mode radios). Compare to `settings.html:380-401` (haptic-wake, which writes to both Preferences and localStorage).

The dismiss-mode preference is the difference between "old man with arthritis can dismiss the alarm" and "old man with arthritis sleeps through the alarm forever because he can't hold for 6 seconds." It's stored only in `localStorage`. Android's "Clear cache" wipes localStorage. After that the user is back on `breath` default; their accessibility need is silently lost. Capacitor's `@capacitor/preferences` is the right durable store, and it's already wired (haptic-wake writes to it). Dismiss-mode and the bedside toggles should too.

**Fix surface:** mirror the pattern from haptic-wake — write to Preferences AND localStorage, read Preferences first.

---

## 12. Haptic-wake checkbox renders unchecked, then async-loads true — flash + race — [Severity: major]

**Location:** `app/src/app/settings.html:380-401`.

`hapticToggle.checked` defaults to false because the HTML has no `checked` attribute. `loadHapticPref()` is async; between page load and Preferences.get resolving, the user can already toggle the checkbox. The change handler then writes `'false'` (visible state) to Preferences, clobbering the stored `'true'`. Even without a user race, sighted users see the box briefly uncheck-then-check.

Same race exists for `loadSyncStatus`, `loadPermissions`, `loadDownloadsSize` — but those are read-only labels, so the only damage is a flash. Haptic-wake is the dangerous one because the user can write before the read finishes.

**Fix surface:** disable the input until the load resolves, or have the change handler ignore events until a "ready" flag flips. SSR-style: stamp the initial state via inline `<script>` reading localStorage *before* render.

---

## 13. Reflection log: 90-day cap silently truncates from the OLD end — [Severity: minor]

**Location:** `app/src/app/wake.html:347-349`.

`log.slice(-90)` keeps the last 90 entries. If the user takes a multi-month break and comes back, the slice still works. Edge case: the log search uses `log.findIndex(e => e.date === today)`. If today's entry is already in the log and the log has 91 items, `slice(-90)` drops the OLDEST (which today is not). Fine. But: the `date` field is `new Date().toISOString().slice(0, 10)` — uses UTC. A user reflecting at 11:30 PM local in UTC+13 (NZ) writes a `date` for *tomorrow* UTC; if they reflect again at 12:01 AM local the next day, they overwrite tomorrow's UTC entry. Local timezone mismatches truncate one day per ~24h cycle for any non-UTC user near the date line.

**Fix surface:** derive `date` from `new Date()` local components (`getFullYear()/getMonth()/getDate()`), not `toISOString`.

---

## 14. Tap-outside-to-dismiss welcome overlay also dismisses on the OEM overlay path, but OEM overlay has no equivalent — [Severity: minor]

**Location:** `app/src/app/bedside.html:523-526` (welcome) versus `bedside.html:736-745` (OEM).

Welcome listens for tap on the overlay backdrop and dismisses. OEM does not. The user reads the OEM modal, taps outside expecting "later," nothing happens. Inconsistent affordance. Worse: on tiny phones the welcome modal can extend past viewport and the "outside" tap zone is unreachable — they'd have to scroll to reach the `welcome-cta`.

**Fix surface:** unify the modal pattern; either both have tap-outside, or neither.

---

## 15. Snooze button on alarm.html navigates to `../index.html` in dev fallback — loses snooze count — [Severity: minor]

**Location:** `app/src/app/alarm.html:300-306`.

The fallback path for snooze (no bridge) is `window.location.replace('../index.html')`. The dev/web user never sees the snooze cap or the "this is your third return" copy because every snooze just navigates home. That's fine for production (where the bridge handles it), but the dev fallback is silently lossy and can mask a regression where the bridge stops getting injected on real devices.

**Fix surface:** for the no-bridge case, increment `snoozeCount` via localStorage and reload with updated `?snoozeCount=N` so the snooze-cap UX is testable in dev.

---

## 16. Pointer-event handling: second `pointerdown` overwrites `holdTimer` reference without clearing the first — [Severity: minor]

**Location:** `app/src/app/alarm.html:219-233` and `app/src/app/wake.html:284-298`.

`onStart` does `holdTimer = setTimeout(arrive, 6000)`. If a second pointer (second finger) lands before the first finger lifts, `onStart` runs again, sets a NEW `holdTimer`, and the FIRST timer is orphaned (still scheduled). If the user lifts the second finger, `onEnd` fires once and clears whatever `holdTimer` currently is — the second one. The first one fires 6s after the FIRST press, possibly even after the user lifted both fingers, triggering an unwanted `arrive()`. The `arrived` guard in `arrive()` protects against a *fired* arrive; it doesn't protect against the user being mid-tap.

**Fix surface:** clear `holdTimer` at the top of `onStart` before assigning. Or filter by `pointerId`: only honor `pointerdown` from the first active pointer.

---

## 17. `wirePauseToggle` only called once but adds two anonymous listeners — leaks if startSession is ever called twice — [Severity: minor]

**Location:** `app/src/app/sleep.html:469, 517-525`.

`startSession` calls `wirePauseToggle()` which adds a click listener and a keydown listener to `sessionContent`. If the session ever restarts in the same document (currently it can't, but a future "begin another" flow could trigger it), each `startSession` adds new listeners without removing the old ones. Each click then toggles pause N times — even N = same final state, odd N = inverted, audio fights itself.

**Fix surface:** wire the listeners ONCE at script init, gate them on a `sessionActive` flag.

---

## 18. `endSession` doesn't await `stopPlayback` before navigating, but uses 1200ms timeout — partial-cleanup race — [Severity: minor]

**Location:** `app/src/app/sleep.html:481-490`.

```
async function endSession() {
  clearInterval(tickTimer);
  await stopPlayback();
  await disarmWakeKeepAlive();
  session.classList.remove('visible');
  setTimeout(() => {
    chooser.classList.remove('hidden');
    window.location.href = '../index.html';
  }, 1200);
}
```

`stopPlayback` is awaited, good. But `NativeAudio.stop` and `unload` are themselves wrapped in `try { ... } catch {}` and **NOT awaited inside `stopPlayback`** — well actually they are awaited (line 405-406). OK. The real race: the 1200ms timeout fires regardless of stopPlayback's outcome — so if NativeAudio's `unload` hangs (e.g., decoder still draining), the navigation happens with audio still resident. On Android this manifests as audio continuing to play after navigating back to /.

**Fix surface:** wait for `stopPlayback` to fully resolve OR fire `MediaSession`'s explicit "stop" command before navigating.

---

## 19. `Network.getStatus()` only awaited once at boot; listener may miss reconnect if user is on Capacitor < 7 — [Severity: minor]

**Location:** `app/src/main.ts:138-144`.

`await Network.getStatus()` then `Network.addListener(...)`. If the network state changes between those two lines (rare but possible on Android's `onCreate` flurry of intents), the listener registers AFTER the state changed and the initial banner is wrong until the next change. Also: `Network.addListener` returns a `PluginListenerHandle` which is never stored — if the WebView ever re-runs main.ts (HMR, deep-link reload), a new listener is added on top of the old one. Each network flip then fires the banner toggle multiple times, which causes the CSS transform transition to chase itself.

**Fix surface:** store the handle; remove on `pagehide` or before adding a new one.

---

## 20. `withEmbed` URL constructor swallows errors but the fallback is wrong for fragments — [Severity: minor]

**Location:** `app/src/main.ts:99-108`.

The catch branch appends `?embed=1` or `&embed=1` with a string `.includes('?')`. If `url = 'https://frqncy.network/explore.html#consciousness'`, `?` is absent → appends `?embed=1` after the fragment: `https://frqncy.network/explore.html#consciousness?embed=1`. The query is now inside the fragment, embedded server can't read it. Same issue if URL has both fragment and existing query in the wrong order.

In practice all the `data-external` values in `index.html` are well-formed and constructor-parseable, so this is dormant — but the moment someone adds a URL with a hash, it silently breaks embed mode.

**Fix surface:** the URL-constructor path handles fragments correctly; just make the fallback throw / log instead of silently producing a wrong URL.

---

## 21. `radio[name=dismiss]` change handler writes localStorage but doesn't broadcast — alarm.html caches the value at module load — [Severity: minor]

**Location:** `app/src/app/settings.html:369-373`; `app/src/app/alarm.html:167-171`, `app/src/app/wake.html:251-254`.

`alarm.html` reads `localStorage.getItem(DISMISS_MODE_KEY) || 'breath'` ONCE at module evaluation. If the user is on the alarm screen (preview mode or actual fire) and somehow changes the setting (deep-link, multi-window), the alarm script keeps the old mode. Not reachable today — the alarm screen has no path back to settings — but the practice link from bedside.html (`practice → alarm.html?preview=1`) means a user can go: settings → change mode → bedside → practice. That practice run uses the new mode because it's a fresh page load. OK in practice today. Worth a comment in the source.

**Fix surface:** add a code comment that the dismiss mode is read at page load only; or have alarm.html re-read on `pageshow`.

---

## 22. Bedside countdown timer drifts: `setInterval(renderCountdown, 30_000)` — [Severity: minor]

**Location:** `app/src/app/bedside.html:594-598`.

Every 30 seconds the countdown rerenders. setInterval drifts on slow devices, can stop entirely if the tab is throttled by Chrome's background throttling. After waking from background the displayed countdown can be 90 minutes stale. Negligible if user is staring at it actively, but the whole point of bedside is the user closes their eyes — they may glance up an hour later and see "in 8h 23m" when it should be "in 7h 23m."

**Fix surface:** use `requestAnimationFrame`-driven recomputation OR re-anchor on `visibilitychange`.

---

## 23. The "smart resume" auto-routes to bedside even when the user explicitly tapped a non-bedside tab from a notification or external launch — [Severity: minor]

**Location:** `app/src/main.ts:235-239`.

`shouldSmartResume()` returns true if `last_arm_ts` was set within 12h. `bootstrap()` then runs `navigate('/app/bedside.html')`. If the user, with an armed alarm, tapped Settings via Android quick settings, or tapped Home from a notification, the app yanks them to Bedside anyway. There's no opt-out for the current cold-start. A user trying to change a permission has to navigate back.

**Fix surface:** check the deep-link intent path (e.g., `frqncy://settings`) before applying smart resume — the deep link should win. main.ts wires `appUrlOpen` AFTER the smart-resume routing decision is made, so deep-links don't suppress it.

---

## 24. `Filesystem.readFile` directory `'DATA'` is a string, not the enum — works at runtime but inconsistent — [Severity: minor]

**Location:** `app/src/app/sleep.html:296` and `app/src/app/wake.html:391`, contrasted with `app/src/lib/sync-manager.ts:50, 60` which use the imported `Directory.Data` enum.

The HTML files pass the literal string `'DATA'`. Capacitor's Filesystem plugin accepts the string form because the enum values are themselves strings, but this is fragile: any future Capacitor major version that switches the enum to an opaque object breaks these calls. The mismatched style also reads as "these are different APIs" to the next maintainer.

**Fix surface:** import the Filesystem plugin via ES module in the HTML scripts the same way main.ts and sync-manager do. (Vite already supports it for these surfaces.)

---

## 25. `Browser.open` falls back to `window.open` — opens system browser, abandoning the app — [Severity: minor]

**Location:** `app/src/app/wake.html:456-462`.

If `NativeAudio` is missing or the resource isn't a direct audio URL, the code tries `Browser.open(...)`; if that also fails, `window.open(pick.url, '_blank')`. Inside Capacitor's WebView, `window.open` typically kicks out to the system browser (Chrome / Safari) — the user leaves FRQNCY entirely at 6:47 AM. The "morning movement" flow is a one-way ejector seat.

**Fix surface:** if no Browser and no NativeAudio, navigate the existing WebView in-place via `location.href = url` (cross-origin permitting), or show a toast with "open in browser?" + a "skip" option.

---

# Cross-cutting patterns worth noting

- **Empty `catch {}` everywhere.** 40+ instances across the bedside, sleep, wake, settings scripts. Every one is a silent failure surface. The bias toward "fail open so the UI keeps working" is good for a calming app, but it means a permission flip, plugin outage, or storage error never reaches the user or the telemetry endpoint. Recommend funneling all bridge failures through a single `recordSilent('bedside.cancel', err)` that pings the existing `/api/alarm-error.js` endpoint with a low-severity tag.

- **No retry on `FrqncyAlarm.schedule` failures.** Single attempt, friendly toast, done. Real users on flaky OEMs (Xiaomi, OPPO) get random transient denials. A single retry with jitter would absorb many of these.

- **No idempotency on the `frqncy:content-updated` event.** Multiple subscribers in `settings.html` (`loadSyncStatus`, `loadDownloadsSize`) re-read disk every time SyncManager finishes — fine — but the listener is added on every page load and never removed. Tab back-and-forth between Bedside and Settings accumulates listeners; eventually one disk-read fans out to N copies. (Not catastrophic for a Filesystem.readdir, but a leak.)

- **No telemetry on the dismiss gesture itself.** We know the user dismissed (the alarm cleared), but we have no signal on which mode they used, how long the hold actually was, how many retries they made. That data would let the team validate the 6-second default empirically.

---

# Top three to act on first

1. **Loading bar never clears on iframe failure (#1)** — visible immediately on any flaky network, and the app's main external surface is the iframe.
2. **Arm has no in-flight guard (#2)** — double-tap is normal mobile UX; double-scheduling is catastrophic for the hero feature.
3. **Sleep session aria-hidden never updated (#4)** + **Modal focus management missing (#5)** — accessibility on the wake/sleep surfaces is currently broken in two distinct ways, both invisible to sighted-mouse-using developers.
