# FRQNCY Mobile App — Accessibility Audit (2026-05-14)

**Auditor:** strict senior accessibility specialist (Apple Health VoiceOver, MS Teams keyboard, Slack SR)
**Standard:** WCAG 2.2 AA minimum, AAA for body-text contrast
**Viewport:** 390 × 844 (Playwright phone emulation)
**Method:** Computed-style introspection, keyboard traversal, prefers-reduced-motion emulation, source review of `app/src/index.html`, `app/src/app/{bedside,alarm,wake,sleep,settings}.html`, `app/src/main.ts`

Severity legend: **[Blocker]** = ships a barrier to a disability group, **[Major]** = an entire interaction is degraded, **[Minor]** = polish.

---

## 1. [Blocker · WCAG 1.3.1, 4.1.2, 2.1.1] Bedside toggles are `<div role="switch">` with no `tabindex`, no `aria-label`, no keyboard handler

**Location:** `app/src/app/bedside.html` lines 409, 416, 423 — `<div class="switch on" id="prewake" role="switch" aria-checked="true">` (also `#video-field`, `#reflection`).

**Issue:** The three toggles (gentle pre-wake, video field, post-wake reflection) are `<div>` elements. Computed audit shows `tabindex: null`, `aria-label: null`. There is no keyboard listener on `.switch` — only a `pointerdown`/`click` handler in script. A keyboard-only user (Bluetooth keyboard, external switch) cannot reach or toggle them. A screen reader announces the state ("on/off") but has no accessible name for *what* is being switched (the adjacent `.toggle-label` is not associated via `aria-labelledby`).

**Fix:** Change `<div class="switch" role="switch">` to `<button type="button" class="switch" role="switch" aria-checked="true" aria-labelledby="prewake-label">` (or add `aria-label` strings). Add `keydown` for Space/Enter that toggles. Or simpler — use a native `<input type="checkbox">` with a visually-styled label.

---

## 2. [Blocker · WCAG 1.4.4 Resize Text] `user-scalable=no` in viewport meta blocks pinch-zoom

**Location:** `app/src/index.html:5`, `app/src/app/bedside.html:5`, `app/src/app/alarm.html:5`, `app/src/app/wake.html:5`, `app/src/app/sleep.html:5` — every page contains `<meta name="viewport" content="…, user-scalable=no" />`.

**Issue:** Low-vision users cannot zoom in to read 10.5–12.5 px copy that's already below recommended minimums. WCAG 1.4.4 explicitly forbids this. The app contains numerous small text instances (see finding 7) and the only escape would be system-level magnification — which on Android disables touch gestures in many launchers, making the breath-hold ring un-dismissable.

**Fix:** Remove `user-scalable=no` from all five viewport metas. If the concern is iOS Safari double-tap zoom on inputs, set `maximum-scale=5` instead, never 1.

---

## 3. [Blocker · WCAG 2.1.1 Keyboard, 4.1.2 Name Role Value] Sleep-mode chooser cards are non-interactive `<div>`s

**Location:** `app/src/app/sleep.html:211–224` — three `<div class="option" data-moment="…">` elements with descendant text and `cursor: pointer`, listening to a delegated click handler.

**Issue:** No `role`, no `tabindex`, no `aria-label`. A keyboard user cannot reach "stillness", "release", or "drift" — these are the ONLY entry points to the evening practice. Touch users get a hover affordance via `cursor: pointer` (which itself shouldn't appear on a phone) but screen readers see three unlabelled groups.

**Fix:** Change `<div class="option">` to `<button type="button" class="option">`, or add `role="button" tabindex="0"` and `keydown` Space/Enter. Wrap the chooser in `role="listbox"` if you want to express that they are mutually exclusive.

---

## 4. [Blocker · WCAG 1.3.1, 4.1.2] Home & Explore card buttons have no accessible name beyond their text content, but bury the actionable label two levels deep

**Location:** `app/src/index.html:357–376, 391–445` — `<button class="home-card">` contains three nested `<div>` children (eyebrow, title, desc) with no semantic association.

**Issue:** Screen reader concatenates everything: "tonight arm tomorrow's wake set a time. the alarm fades in over 90 seconds. dismissing is one breath, held." That's a 120-character button label with no announced structure. The eyebrow ("tonight") and title ("arm tomorrow's wake") should be programmatically linked as the accessible name, with the description as `aria-describedby`.

**Fix:** Add `aria-labelledby` pointing at the title `<div>` (which gets an `id`) and `aria-describedby` pointing at the desc. Or wrap the title in a heading element so screen readers can announce structure with rotor navigation.

---

## 5. [Blocker · WCAG 2.4.7 Focus Visible] Focus indicators removed on three interactive elements

**Locations:**
- `app/src/app/wake.html:187–191` — `.next button:hover, .next button:focus-visible { … outline: none; }` strips the focus ring from both the "move with me" and "carry on" buttons. Border color does change (to gold) but this is a color-only state cue (1.4.1 violation too).
- `app/src/app/wake.html:148, 149` — `.reflection-field { outline: none; }` (declared on the base rule). The `:focus` selector then only changes border-color and background — both very subtle on navy. Keyboard users typing into the morning reflection cannot tell where focus is.
- `app/src/app/sleep.html:151–162` — `.settle-cta` doesn't define a focus style at all (only `:hover, :active`). Default UA outline lands but is then overridden by reset styles in some browsers.

**Fix:** Add explicit `:focus-visible { outline: 2px solid #C4973A; outline-offset: 2px; }` to every interactive element. Never write `outline: none` without a replacement indicator that meets 3:1 contrast against both states.

---

## 6. [Blocker · WCAG 1.4.6 AAA, 1.4.3 AA edge] Body and supporting copy fails AAA contrast on navy

**Location:** Site-wide. Computed contrast against `#0B1C3D` (navy):

| Element | Color | Ratio | Required (AA) | Required (AAA) |
|---|---|---:|---:|---:|
| `.explore-eyebrow` "browse frqncy" (11 px, 400) | `rgba(245,245,245,0.42)` | **3.74** | 4.5 | 7 |
| `.section-label` "your space", "the network" (11 px) | `rgba(196,151,58,0.7)` | **3.69** | 4.5 | 7 |
| `.home-card-desc` body copy (12.5 px, 300) | `rgba(245,245,245,0.55)` | 5.47 | 4.5 | 7 |
| `.home-card-eyebrow` (10.5 px) | `rgba(196,151,58,0.85)` | 4.86 | 4.5 | 7 |
| `.toggle-sub` (12 px, 300) | `rgba(245,245,245,0.5)` | ~5.0 | 4.5 | 7 |
| `.hint` "hold for one breath" (13 px, 200) | `rgba(245,245,245,0.35)` | ~3.1 | 4.5 | 7 |
| `.reflection-note` (11.5 px) | `rgba(245,245,245,0.4)` | ~3.6 | 4.5 | 7 |
| `.session-timer` (11 px) | `rgba(245,245,245,0.26)` | ~2.4 | 4.5 | 7 |

**Issue:** The two top rows **fail WCAG 2.2 AA** (under 4.5:1). The hint text and session-timer are dangerously low. Settings/Sleep eyebrow rgba(245,245,245,0.4) at 13 px also AA-fails (3.6).

**Fix:** Raise minimum alpha to ~0.78 on white text (gives ~9.3:1 — passes AAA). Gold accents should use full `#C4973A` (6.28:1, passes AA but not AAA for small text — accept AA only for accent eyebrows). The "hold for one breath" hint is the load-bearing instruction on the wake screen and must pass AAA — bump to ~0.78.

---

## 7. [Major · WCAG 1.4.4] Text below 12 px appears throughout

**Location:**
- `.tab` labels in bottom nav (`Home`, `Explore`, `Bedside`, `You`) — **10.5 px** (`index.html:93`).
- `.home-card-eyebrow` — **10.5 px** (`index.html:277`).
- `.session-timer` — **11 px** (`sleep.html:107`).
- `.reflection-note` — **11.5 px** (`wake.html:163`).
- `.explore-eyebrow`, `.section-label`, `.settle-eyebrow`, `.pause-pill` — **11 px**.

**Issue:** Apple HIG minimum is 11 pt, WCAG `1.4.4` requires text to be resizable to 200%. Because `user-scalable=no` is set (finding 2), users cannot enlarge. Tab labels are the principal navigation and read at 10.5 px.

**Fix:** Either remove `user-scalable=no` AND raise minimum body text to 14 px, or accept that this fails accessibility for low-vision users.

---

## 8. [Major · WCAG 2.4.3 Focus Order, 4.1.2] First-run welcome modal does not trap focus or move focus on open

**Location:** `app/src/app/bedside.html:444–453` — `<div class="welcome-overlay" role="dialog" aria-modal="true">` is shown on first launch.

**Issue:** When the overlay appears, `document.activeElement` remains `BODY` (audited). A screen reader user has no signal that a modal opened; a keyboard user must Tab blindly past every element behind the overlay (which is still in the tab order, since the underlying alarm-card buttons are not `inert` or `aria-hidden`). `aria-modal="true"` is a hint, not a focus trap.

**Fix:** On overlay show: (a) move focus to `#welcome-cta` programmatically, (b) trap Tab/Shift+Tab inside the dialog, (c) mark the rest of the page `inert` (or set `aria-hidden="true"` on siblings), (d) restore focus to the triggering control on close. Same issue applies to `.oem-overlay` (lines 456–469) and the sleep `.settle` overlay (`sleep.html:229–237`).

---

## 9. [Major · WCAG 4.1.3 Status Messages] Offline banner appears without screen-reader announcement

**Location:** `app/src/index.html:340` — `<div id="offline-banner">Offline — showing cached content</div>`.

**Issue:** No `role="status"`, no `aria-live`. When network drops, the banner translates into view via CSS `transform: translateY(0)` — sighted users see it, screen-reader users don't hear it. Critical for a sleep/alarm app: a user who armed an alarm needs to know the device went offline.

**Fix:** Add `role="status" aria-live="polite"` on the offline banner. Same omission on `app/src/app/wake.html`'s prompt screen reveal (`#prompt-screen` is `aria-hidden="true"` initially, then has `.visible` toggled but `aria-hidden` is never updated — see finding 13).

---

## 10. [Major · WCAG 4.1.3] Toast pattern has correct role but the snooze "third return" note is invisible to AT

**Locations:**
- `app/src/app/bedside.html:440` — `<div class="toast" id="toast" role="status" aria-live="polite">` (correct).
- `app/src/app/alarm.html:119–134` — `#snooze-final-note` ("this is your third return. hold to arrive.") has **no** `role`, **no** `aria-live`. It animates in via opacity change after a 200ms timeout when the snooze limit is exhausted.

**Issue:** The user who needs the message most (they've snoozed twice and the only path forward is the gesture they may have forgotten) cannot hear it. Same applies to the practice-mode note "practice mode — hold to feel the gesture."

**Fix:** Add `role="status" aria-live="polite"` to `#snooze-final-note`. The toast pattern in `bedside.html` is the model — copy it.

---

## 11. [Major · WCAG 4.1.2, 2.1.1] Sleep session "tap to pause" affordance is a `role="button"` on a `<div>` with multiline content

**Location:** `app/src/app/sleep.html:241` — `<div class="session-content" id="session-content" role="button" aria-label="Tap to pause">`.

**Issue:** The element wraps the moment label, prompt, and timer — all of which are meaningful content a screen reader should be able to read. By declaring `role="button"`, ATs flatten the inner structure and announce only the aria-label "tap to pause", hiding the actual prompt ("what are you carrying?"). No `tabindex` either, so keyboard cannot pause. The pause-pill `#pause-pill` has `aria-live="polite"` but its container has `aria-hidden="true"` until `.visible` is set (line 239 — `aria-hidden` is never toggled in script).

**Fix:** Separate concerns. Make the prompt a region/heading; add a discrete `<button>` for pause (large hit target). Toggle `aria-hidden="false"` on `.session` when it becomes visible — currently it stays `true` even when active (see finding 13).

---

## 12. [Major · WCAG 1.1.1, 4.1.2] Iframe has no accessible name; tablist has no name; tabs have no `aria-selected`

**Locations:**
- `app/src/index.html:451–456` — `<iframe id="site-frame" src="about:blank" …>` has no `title` and no `aria-label`. Failure of 4.1.2 / 2.4.1.
- `app/src/index.html:458` — `<nav id="tab-bar" role="tablist">` has no `aria-label`.
- `app/src/index.html:459–474` — each `.tab` is `role="tab"` but has no `aria-selected`, no `aria-controls`, no `tabindex` management. The `.active` class is set in JS (`main.ts:46`) but never reflected in ARIA state.

**Issue:** A VoiceOver user lands on the tab strip and hears "Home, tab" four times with no indication which is current. The iframe content is announced as just "frame" with no description.

**Fix:**
- `<iframe title="In-app browser">`, and update the title via JS as the iframe URL changes.
- `<nav role="tablist" aria-label="Sections">`.
- On `setActiveTab(route)` in `main.ts:44`, also set `tab.setAttribute('aria-selected', tab.dataset.route === route ? 'true' : 'false')`; manage `tabindex` (active=0, others=-1) for arrow-key navigation per the WAI-ARIA tabs pattern.

---

## 13. [Major · WCAG 4.1.2] `aria-hidden` state never updates on overlays that become active

**Location:**
- `app/src/app/wake.html:208` — `<div class="prompt-screen" id="prompt-screen" aria-hidden="true">`. Script (line 368) adds `.visible` but never sets `aria-hidden="false"`. Result: when the reflection prompt appears after dismissing the alarm, it's invisible to screen readers.
- `app/src/app/sleep.html:229, 239` — `.settle` and `.session` both `aria-hidden="true"`, never toggled in script.

**Issue:** This is the showpiece morning reflection moment, and it is unannounced. The textarea inside is focusable, but its parent is hidden from AT — VoiceOver will skip past or read inconsistently.

**Fix:** When you add `.visible`, also `setAttribute('aria-hidden', 'false')`. When you remove `.visible`, set back to `true`. Symmetrically.

---

## 14. [Major · WCAG 1.4.1 Use of Color, 1.3.1] Switch state and permission status communicated by color alone

**Locations:**
- `app/src/app/bedside.html:131–149` — `.switch` is gray when off, gold when on. There's no shape change, no icon, no text indicator. Deuteranopes (~5% of males) can struggle to distinguish desaturated gold from gray on dark navy. `aria-checked` is set, so AT is OK, but sighted color-blind users may not detect state.
- `app/src/app/settings.html:56–57` — `.row-value.granted { color: rgba(196,151,58,0.95); } .row-value.denied { color: rgba(255,120,120,0.85); }`. The only difference between "granted" and "denied" is gold vs. salmon-pink. Same hue family in low-light conditions.

**Fix:** Add a checkmark glyph or "ON/OFF" text inside `.switch`. For permissions, prefix the value with an icon (✓ / ✗) or word ("granted ✓ / denied ✗").

---

## 15. [Major · WCAG 2.5.5 Target Size AAA, 2.5.8 Target Size Minimum AA] Multiple tap targets under 44 × 44 CSS px

**Locations:**
- `.switch` toggles — **48 × 28** (`bedside.html:132`). Height fails the 24-px AA minimum easily but fails the 44 AAA. With three stacked switches, mis-taps will land on an adjacent label.
- `.close-dot` × close — **32 × 32** (`sleep.html:176–186`). Both `#close-dot` and `#settle-close`. Fails 2.5.8 AAA (44) and is dangerously small for one-handed use at the top-right corner.
- `.time-edit` pill (`bedside.html:93`) — appears to render under 30 px tall.
- `.action-button` "request permissions" (`settings.html:64–71`) — `padding: 8px 14px`, font 12 px → roughly **30 px** tall.
- `.next button` (`wake.html:174–186`) — `padding: 11px 20px` font 13 px → ~**40 px** tall. Just under AAA.
- Iframe `<input type="time">` (`bedside.html:399`) — measured **88 × 34**. Native control, but still under 44.

**Fix:** Raise `.switch` to 48×30 (matches iOS Switch dimensions). Raise `.close-dot` to 44×44 (or wrap in a 44×44 invisible hit area). Touch targets at the bedside / wake / sleep context are used by drowsy or sleep-impaired users — over-engineer for fingers-too-big.

---

## 16. [Major · WCAG 4.1.3] Countdown updates ("in 8h 23m") announced too verbosely

**Location:** `app/src/app/bedside.html:402` — `<div class="time-countdown" id="time-countdown" aria-live="polite">` is updated every 30 s by `renderCountdown()` (line 583).

**Issue:** `aria-live="polite"` with no `aria-atomic` and a full-content rewrite every 30 s means VoiceOver re-announces "in 8 hours 23 minutes" every half-minute while the user is reading the rest of the screen. This is annoying-to-painful for an SR user spending time on this page setting up multiple toggles.

**Fix:** Either drop `aria-live` entirely (the user can re-read on demand), set `aria-live="off"` once the initial value is announced, or use `aria-atomic="true"` and update less frequently (every 5 min unless < 1 hr remains). Also consider only updating when the displayed value actually changes ("in 8h 23m" → "in 8h 22m" is one minute later; don't fire on every tick).

---

## 17. [Major · WCAG 2.4.6 Headings and Labels] Document heading hierarchy is broken across screens

**Locations:**
- `app/src/app/bedside.html:394` — `<h1>bedside</h1>` is styled as a 13 px label (`font-size:13px; color: rgba(245,245,245,0.4)`). The visual hierarchy says it's an eyebrow, not a title; the largest text on the page is `.time-display` (64 px) which is a `<button>`. Heading semantics don't reflect visual importance.
- `app/src/app/settings.html:89` — `<h1>you</h1>` likewise tiny.
- `app/src/app/sleep.html:233` — `<h2 class="settle-title">settle in.</h2>` is the *first* heading on the page (no `<h1>` ever shown), and the `<div class="option-name">` chooser items (`stillness`, `release`, `drift`) — which are the primary nav of the page — aren't headings at all.
- `app/src/app/wake.html` — has no headings at all. The reflection prompt ("what wants your attention today?") is a `<div>` (`#prompt-text` at line 210, `font-size: 24px`).
- `app/src/index.html` — explore-screen `<h1>the whole network, in here.</h1>` competes with home-screen `<h1>welcome to FRQNCY</h1>`; both exist in the DOM simultaneously.

**Fix:** One `<h1>` per visible surface. Use `<h2>` for sections. Where the visual title is large (`.time-display`, `.prompt`), the heading should match visual prominence — promote to `<h1>` or `<h2>` and keep "bedside"/"you" as `<p class="eyebrow">`. Audit so AT users can navigate by heading rotor.

---

## 18. [Major · WCAG 4.1.2] `prompt-text` and `reflection-field` aren't programmatically associated

**Location:** `app/src/app/wake.html:210–217` — the prompt `<div id="prompt-text">` and the textarea `<textarea id="reflection-field" aria-label="Morning reflection">`.

**Issue:** The on-screen prompt (e.g., "what wants your attention today?") is what the textarea is *for*. Currently the textarea has a generic `aria-label="Morning reflection"` that ignores the displayed question. AT users will hear the prompt as floating text, then a separately-labelled textarea — disconnected.

**Fix:** Drop the static `aria-label`. Add `aria-labelledby="prompt-text"` on the textarea. The prompt should also be a heading (`<h2 id="prompt-text">`) — see finding 17.

---

## 19. [Major · WCAG 2.4.3 Focus Order, 2.5.5 Target] Snooze button placement and label clash with reduce-motion users

**Location:** `app/src/app/alarm.html:117` — `<button id="snooze">return · 9 min</button>` positioned at `top: 20px; right: 16px` (line 99–102) in a 14 px font.

**Issue:** This is the alarm-firing screen. A drowsy user needs the snooze affordance to be huge and unmistakable. Current rendered size is **~110 × 35** — fails 2.5.8 (24) for height but is too small for the context. Worse, the only differentiation between "snooze" and "dismiss" is location (top vs. center). A user who reverses them by mistake either keeps the alarm firing or dismisses when they wanted nine more minutes. Add an icon + larger hit area.

The label "return · 9 min" is FRQNCY-poetic but cognitively heavy at 5 AM. Consider "snooze 9 min".

**Fix:** Raise the snooze button to at least 44 × 88 (icon + label). Move further from the ring (top-left, not top-right where right-handers brush). Consider an explicit `aria-label="Snooze for 9 minutes"` for VoiceOver clarity.

---

## 20. [Major · WCAG 3.3.2 Labels or Instructions] `<input type="time">` lacks a visible label

**Location:** `app/src/app/bedside.html:399` — `<input type="time" id="time-input" value="06:45" aria-label="Wake time" />` next to a `.time-display` button.

**Issue:** Sighted users see a giant 06:45 button and a smaller native time control. The relationship between the two (they two-way-bind) is invisible. The native time input has only an aria-label, no `<label for>`. WCAG 3.3.2 wants a visible association. Also: the input is `width: 88px` and the button is `width: 154px`, so the visual hierarchy implies they are two different controls.

**Fix:** Hide the `<input>` visually but keep it focusable (or vice-versa: make the time-display button non-focusable and rely on the input). Add a visible "wake time" label above. Or merge into a single button that opens a picker — current dual-control adds redundancy without affordance.

---

## 21. [Minor · WCAG 1.3.1] The radio-style dismiss-mode selector uses `<label>` without matching `<input>` IDs

**Location:** `app/src/app/settings.html:124–135` — three `<label class="dismiss-option" data-mode="…"><input type="radio" name="dismiss" value="…" /><span>…</span></label>`.

**Issue:** Native `<label>` wrapping its input works for clicks but the `<input>` has no `id` so screen readers may not properly associate the `<span>` content as the accessible name in some implementations. The visible `<em>` description ("· 6 seconds, default") isn't programmatically tied either — it's read as part of the label by happenstance.

**Fix:** Give each `<input>` an explicit `id`; reference it from the surrounding `<label for>`. Use `aria-describedby` to attach the `<em>` description.

---

## 22. [Minor · WCAG 1.3.5 Identify Input Purpose] Reflection textarea has no `autocomplete="off"` despite being personal/private

**Location:** `app/src/app/wake.html:212–217`.

**Issue:** Mobile keyboards may surface autocomplete suggestions ("anything · or nothing" placeholder is italicized but if the user types "I'm worried about…", the next-word suggestion strip will surface — and on shared devices, journal text leaks into autocomplete history). The reflection is supposed to be "private. saved on this device. never shown back to you" (visible note line 218) but the input doesn't enforce it.

**Fix:** Add `autocomplete="off" autocorrect="off" spellcheck="false"` to the textarea, or document the trade-off and let users keep autocorrect.

---

## 23. [Minor · WCAG 1.3.2 Meaningful Sequence] DOM order of `time-display` (button) then `time-input` puts native control after a custom one

**Location:** `app/src/app/bedside.html:398–399`.

**Issue:** Sighted users see the giant 06:45 button first and tap it to open the picker. Tab order matches DOM order, so keyboard users hit the button first, then the input — meaning a keyboard user can never reach the native picker via the button (its handler only calls `showPicker()` which iOS WebKit may not support). They'd Tab to the small input pill instead. Two different affordances for the same task.

**Fix:** Either remove the `<button>` entirely and style the `<input>` to look prominent, or hide the `<input>` visually and use only the button (with a JS-driven picker).

---

## 24. [Minor · WCAG 1.4.11 Non-text Contrast] Switch off-state has 1.2:1 contrast against navy

**Location:** `.switch` off-state background `rgba(245,245,245,0.12)` on `#0B1C3D` ≈ **1.2:1** contrast. WCAG 1.4.11 requires non-text UI components at 3:1.

**Fix:** Raise off-state to `rgba(245,245,245,0.30)` or add a 1-px border at `rgba(255,255,255,0.6)`.

---

## 25. [Minor · WCAG 2.4.4 Link Purpose] External-link rows in Settings show "↗" arrow without screen-reader hint

**Location:** `app/src/app/settings.html:191–193` — `<a href="https://frqncy.network" target="_blank" rel="noopener">frqncy.network ↗</a>` etc.

**Issue:** Screen readers read "↗" as "north east arrow" or skip it depending on AT. Users don't know the link opens externally. Best practice is `aria-label="frqncy.network (opens in new tab)"` or a visually-hidden " (opens in new tab)" suffix.

**Fix:** Add `<span class="sr-only">(opens external)</span>` after the arrow, or rewrite `aria-label`.

---

# Summary of fixes by impact

**Top 3 blockers requiring immediate fix before any external user accessibility test:**

1. **Switches and sleep options are non-interactive `<div>`s** (findings 1 + 3) — keyboard users and screen-reader users cannot toggle bedside settings or pick a sleep practice. This breaks the entire app for assistive-tech users on day one.

2. **`user-scalable=no` across every page** (finding 2) — direct WCAG 1.4.4 fail and disproportionately harms the low-vision demographic that a "softer way to wake" app explicitly courts. Combined with the 10.5–12 px tap-bar labels and body copy (finding 7), low-vision users have no escape hatch.

3. **Focus indicators removed without replacement on `.next button`, `.reflection-field`, and `.settle-cta`** (finding 5), plus the welcome / OEM / settle modals don't move or trap focus (finding 8). Keyboard-only users get stranded with no visible focus mid-flow — the worst possible failure mode on an alarm-dismiss screen at 5 AM.

**Mid-severity items concentrated around:**
- ARIA state mismatches: `aria-hidden` never updated, `aria-selected` missing on tabs, tablist unnamed, iframe untitled (findings 12, 13).
- Color-only state communication for switches and permission status (finding 14).
- Heading hierarchy broken across surfaces — screen reader rotor navigation collapses (finding 17).
- Tap targets routinely 28–34 px tall on navigation and dismiss surfaces used by drowsy users (finding 15).

**The dismiss-gesture accessibility (the app's headline a11y feature) is correctly implemented:** three modes wired into `localStorage`, `prefers-reduced-motion` honored on `breath-pace` animation, `brand-breathe` halo, and `loading-slide` bar (verified via Playwright `emulateMedia({ reducedMotion: 'reduce' })`). The ring has `role="button"`, `tabindex="0"`, and a context-appropriate `aria-label`. Keyboard activation via Enter/Space works (line 267–278 in alarm.html). This is the one place execution matches intent.
