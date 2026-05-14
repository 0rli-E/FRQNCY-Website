# 01 — Visual + Brand Review (FRQNCY mobile app)

Reviewer: senior visual designer (Apple Health / Things 3 / Calm / Headspace / Endel / Oak standard).
Surface: `http://localhost:5173/` at 390x844 (iPhone 14-ish).
Date: 2026-05-14.
Mode: ruthless. Only what to fix.

This list is ordered by severity (blocker → major → minor). Each item has [Severity], a precise Location, the Problem, and a Proposed fix.

---

## 1. [BLOCKER] Native `<input type="time">` is unstyled and overlaps the giant clock face
**Location:** Bedside tab → top of alarm card. The 64px display "06:45" + a second tiny dark "06:45" pill with a system clock icon, side-by-side.
**Problem:** `app/src/app/bedside.html` defines `.time-display` (the big readable hero number) but never hides the underlying `<input id="time-input" type="time">` (line 399). The system control renders as the default WebKit/Chromium control: a small dark grey rounded rectangle with an embedded clock SVG, baseline-aligned to the 64px display. Reads as a debug/dev artifact. There is no other place in any mature app on iOS where you'd see a raw HTML5 `<input type="time">` next to a hero numeral. This is the worst-feeling moment in the app.
**Fix:** Visually hide the input (`position: absolute; opacity: 0; inset: 0; width: 100%; height: 100%; pointer-events: auto; cursor: pointer;` over the display button, OR `display: none` and trigger the native picker programmatically via `showPicker()` on tap of the display). Calm and Oak both let the hero number be the tap target; the OS picker opens on tap, nothing else. Reference: Apple Health → Sleep → Schedule.

---

## 2. [BLOCKER] "You" tab routes to a Settings page that lacks the bottom tab bar entirely
**Location:** Tap You (◇) → `/app/settings.html` loads inside the iframe shell, but the page is the only one that scrolls past the bottom of the viewport with NO tab bar overlaid. (Confirmed: the entire You surface, version row, support button, all visible without any tab bar; see screenshot 10.) In the parent shell the tab bar is at `position: fixed`, so it should still cover the iframe. Yet at the bottom of the rendered settings screen there is no chrome — the iframe content scrolls to the body and the tab bar is occluded/missing.
**Problem:** Likely the iframe is being rendered taller than the parent reserves room for, OR the parent's tab-bar is somehow not on top of this iframe. Either way, navigating off "You" requires a swipe-back; the user is stranded. This is also a brand-cohesion break — every other tab shows the bar.
**Fix:** Verify `#site-frame` height matches `calc(100vh - 60px - safe-area)`; verify `#tab-bar` has higher `z-index` than the iframe at runtime and is not getting clobbered. Add a bottom-padding equivalent inside `/app/settings.html` matching `--tab-bar-height` so its own scroll never appears to reach the tab bar.

---

## 3. [BLOCKER] Tapping a tab sometimes triggers wrong page navigation (alarm/wake flows)
**Location:** Repeatedly observed: while clicking the You or Bedside tab the parent navigated to `/app/alarm.html?preview=1` or `/app/wake.html` instead of the requested tab. The browser landed on the wake-ring or wake-reflection screen with no apparent user action.
**Problem:** Some event handler in the shell (likely `main.ts`) is interpreting taps in a way that mis-routes. There appear to be hot reload artifacts or pointer events bubbling from previous flows. This is the kind of behavior that makes a release build feel broken on day one.
**Fix:** Audit `main.ts` tab click handlers; ensure `preventDefault()` and stop propagation; verify there's no global click listener that triggers alarm-preview. Add a single source-of-truth router with route-locking until the destination's `load` event fires.

---

## 4. [BLOCKER] "Offline — showing cached content" banner ships visible by default in dev, and is gold-on-navy with no visual hierarchy
**Location:** Top of every parent-shell surface (Home, Explore). Full-width strip at the top in gold #C4973A on `rgba(196,151,58,0.12)`.
**Problem:** It dominates the first 32px of the screen on Home — directly competing with the brand-mark and home title. The banner is the same gold as the primary CTA, drawing the eye away from the actual action. Apple Health, Calm, Oak — none of them ship a visible network-status banner at idle. It surfaces only on actual offline, briefly, and uses a much quieter neutral chip. Also the message reads like an error during a happy path (dev server is local — there's nothing to be offline from).
**Fix:** Remove from default render in dev. In prod, show only after a confirmed offline window (>3s of failed network), use a neutral pill at the top of the iframe area (NOT spanning the whole shell), 11px text, `rgba(255,255,255,0.06)` background, white at 60% alpha. Don't compete with brand accents.

---

## 5. [MAJOR] Bedside H1 is 13px grey letterspaced caps — there is no page title hierarchy at all
**Location:** `app/src/app/bedside.html` lines 49-56. `h1 { font-size: 13px; font-weight: 300; letter-spacing: 2.4px; color: rgba(245,245,245,0.4); text-transform: lowercase; }`.
**Problem:** The page title "bedside" reads as a tiny grey eyebrow, indistinguishable from a section label. The same applies to the You surface (line 21-28). The 64px clock face becomes the "title" by accident. There's no anchor for the page in a screen-reader pass or a casual glance. Apple Health uses 28-34pt rounded for surface titles; Things 3 uses 28pt; even Calm's minimal headers are 22-24pt. The current setup violates a basic typographic principle: H1 should win the hierarchy battle.
**Fix:** Either (a) drop the visible H1 entirely on Bedside (the clock IS the title — make it semantic via aria-labelledby), or (b) raise H1 to 24-28px regular weight, white at 90% alpha, lowercase OK, letter-spacing back to 0.2px. Pick one. The current half-measure (small grey caps) is the worst of both worlds.

---

## 6. [MAJOR] Two competing button styles on the same Bedside surface — "arm for tonight" (outline gold) vs. "tonight's session" (white-on-card)
**Location:** Bedside main card.
**Problem:** "arm for tonight" uses an outline-on-tinted gold style (`rgba(196,151,58,0.18)` bg, gold border, gold text). "tonight's session" below it uses a translucent grey card with bold white text and NO eyebrow. They look like buttons from two different apps. The visual weight is wrong too — the secondary "tonight's session" reads stronger than the primary "arm for tonight" because white > gold-on-tint at 14px scale. On Home, the primary CTA is solid gold with navy text; on Bedside the primary is outline gold. Inconsistent primary-button language.
**Fix:** Pick one primary style and apply across surfaces. Recommend solid gold #C4973A with navy text (`#0B1C3D`) for the dominant CTA; outline gold for armed/active state; secondary actions use the bordered translucent style. Currently `arm-btn` becomes solid gold only AFTER arming — that's backwards. The "do this now" state should be solid gold; the "armed" state should be quieter, not louder. (Reference: Things 3's "Add To-Do" → solid; once added, the row goes quiet.)

---

## 7. [MAJOR] Inconsistent eyebrow color across surfaces — gold on Home, grey on Sleep chooser, grey on Bedside h1, grey on You section titles
**Location:** Home cards eyebrow `rgba(196,151,58,0.85)`. Explore section labels `rgba(196,151,58,0.7)`. Sleep `.chooser-title` ("tonight") `rgba(245,245,245,0.4)`. Bedside H1 `rgba(245,245,245,0.4)`. Settings `.section-title` `rgba(245,245,245,0.44)`.
**Problem:** Eyebrows are the brand's only consistent gold typographic device — they're the breadcrumb that says "you are in FRQNCY". When five surfaces use three different colors and two different letter-spacings for the same role (eyebrow/section label), the brand reads as built by three teams. Sleep's "tonight" eyebrow being grey when Home's "tonight" eyebrow is gold (same word, same role, same shell) is the clearest tell.
**Fix:** Codify two roles. (a) Section eyebrow = gold `rgba(196,151,58,0.85)`, 10.5px, letter-spacing 2.0px. (b) Page-title eyebrow / breadcrumb = white-44%, 11px, letter-spacing 2.4px. Apply consistently. Sleep's "tonight" is a section eyebrow → must be gold.

---

## 8. [MAJOR] Embedded `frqncy.network` pages still show the site's breadcrumb / footer chrome inside the iframe
**Location:** Tap Home → "sanctuary" card → loads `frqncy.network/my-frqncy/dashboard/`. The iframe shows a "FRQNCY / NRG" breadcrumb at the top and a `© 2026 FRQNCY Network…` footer. (Screenshot 14.)
**Problem:** Per the review brief, "verify the embed mode hides the site's nav." Right now breadcrumb + footer leak through. The user can see they're inside a website, not an app. This is the exact thing the iframe shell exists to suppress. Bonus: the breadcrumb says "NRG" while the card said "sanctuary" — labels don't match (different surfaces, different naming, no continuity).
**Fix:** Add `?embed=1` query param to all `data-external` URLs; server-side or template-level, hide `.global-header`, `nav.breadcrumb`, `.site-footer` when `?embed=1`. CLAUDE.md memory `project_proposals_served_as_raw_md.md` shows you already have content-routing infrastructure; reuse the embed-mode pattern.

---

## 9. [MAJOR] Brand mark ("circle with horizontal line") reads as a "no entry" sign, not a logo
**Location:** Home, top center, 88x88 circle with horizontal gold line bisecting it.
**Problem:** The mark currently looks like the universal "no" symbol (think: no smoking, no entry, "do not"). On dark navy with the line at 50% it's worse — it doesn't read as anything specific, and the negative-space reading is hostile (a prohibition icon). For a wellness brand this is the most visible glyph; it should breathe meaning. Compare: Calm's water-drop, Oak's geometric leaf, Headspace's orange dot — each one carries the brand's posture in one glyph.
**Fix:** Replace with an actual FRQNCY mark (the "Ø"/frequency-stripe lockup from the website, or a horizon/waveform glyph). At minimum, lower the bisecting line opacity (currently 0.85) to 0.35 and lift it 6px above center so it reads as a horizon, not a strikethrough. Tap-target should also become the mark itself (currently `aria-hidden`).

---

## 10. [MAJOR] Tab-bar icons are inconsistent character glyphs (◎ ◈ ☾ ◇) with no shared weight, alignment, or size relationship
**Location:** Bottom tab bar.
**Problem:** Four unicode characters from different fonts/typefaces depending on the OS: `◎` (bullseye, geometric), `◈` (diamond with dot, geometric heavy), `☾` (moon, dingbat thin), `◇` (open diamond, geometric light). They render at different optical sizes — `☾` renders smaller and lower than `◈` and `◇` on macOS Chrome at 20px. There's no consistent stroke weight. This is the single most-seen UI element in the app and it looks like four random symbols. Apple Health, Things 3, Calm — all use a unified custom icon set (or SF Symbols on iOS) with consistent stroke + footprint.
**Fix:** Adopt SF Symbols on iOS / Material Symbols on Android via Capacitor, OR ship a 4-glyph custom icon set as SVGs (sun-rising for Home, network-graph for Explore, moon for Bedside, person for You). Match stroke weight (~1.5px), optical size (24px), align baselines. The current setup violates the calm/anti-stim promise — visual noise from glyph mismatch is stim.

---

## 11. [MAJOR] Tab bar uses ~10.5px label text — under the 11pt iOS HIG floor for nav labels
**Location:** `.tab { font-size: 10.5px; }` (`index.html` line 93).
**Problem:** iOS HIG recommends 11pt minimum for tab bar labels (Apple Human Interface Guidelines, Tab Bars). 10.5px on a 1x screen is sub-legible at arm's length. With letter-spacing 0.3px and 500 weight on system font, it's borderline. Things 3 ships at 11pt. Apple Health at 10pt SF Compact (which is custom-rendered to feel larger). Custom 10.5px on -apple-system without the SF Pro optical-sized variant is the worst combination.
**Fix:** Raise to 11px minimum, OR drop labels entirely and rely on icons (with VoiceOver labels for accessibility). Active label remains gold; inactive labels at 55% white is fine if the size lifts.

---

## 12. [MAJOR] Home brand-mark ring uses `animation: brand-breathe 8s` and `brand-halo 8s` — constant motion on the calm surface
**Location:** Home, brand-mark.
**Problem:** The mark breathes constantly — opacity pulses 0.85→1, scale halo 1→1.06. Even at 8s cycle, perpetual motion at first viewport contradicts the anti-stim brand. Oak's logo is static. Calm's drop sits still. Endel's mark only animates during active sessions. Constant low-amplitude motion is the worst kind for sensitive users — your eye can't quite ignore it. Also the brief calls out "places where the brand promise (calm/anti-stim/conscious) is violated by visual loudness" — this is the canonical example.
**Fix:** Animate only on first paint (one cycle, then settle), or only when arming/on-event. Static at rest. Honor `prefers-reduced-motion` (already done — but apply that posture as the default).

---

## 13. [MAJOR] Sleep chooser cards have no eyebrow, no visual rhythm to Home/Explore cards
**Location:** `/app/sleep.html` chooser → three centered cards: stillness / release / drift.
**Problem:** The chooser cards use centered titles at 20px with centered descriptions. Home and Explore cards are LEFT-aligned with a gold eyebrow above the title. Same component role (a tappable card), three different layouts. The Sleep cards also lack the gold eyebrow that ties everything else to FRQNCY's voice. They feel like a different app.
**Fix:** Either (a) align all cards to the Home/Explore pattern (left-aligned, gold eyebrow, white title, grey desc) — gives uniformity and reads as one product, OR (b) accept that the sleep flow uses a separate "meditation chooser" pattern and commit to it across sleep flows only (with explicit visual rules).

---

## 14. [MAJOR] `practice the dismiss gesture →` is an underweighted text-link in a button-heavy card
**Location:** Bedside main card, below the `arm for tonight` button.
**Problem:** It's tiny (12px, white-42%), an obscure-feeling text-button with a literal "→" Unicode arrow. It's the only place in the app a `→` is used; nowhere else uses inline-arrow ligatures. The action it represents (practice the gesture you'll use to dismiss the alarm) is important — first-time users need to feel it. As built, it looks like a hint that you're meant to ignore.
**Fix:** Promote to a secondary button (matching the Home secondary style — outlined translucent), drop the arrow, label it "practice the gesture". If the intent is to make it discoverable-but-quiet, use Apple Health's pattern: full-width tappable row at 14px white-72% with a chevron indicator at the trailing edge.

---

## 15. [MAJOR] Toggle row labels use 14.5px white-92% but sublabels are 12px white-50% — too tight an opacity contrast at this scale
**Location:** Bedside main card → "gentle pre-wake", "video field", "post-wake reflection" rows.
**Problem:** The sublabel "a faint golden gradient on the wake screen" at white-50% on dark navy is borderline for AA contrast at 12px (~3.8:1 vs 4.5:1 minimum for AA at <14pt regular). Multiple sublabels rendered without enough separation between primary and secondary read as a wall of grey. Things 3 uses 16/13 split with full-white labels and only the sublabel dimmed.
**Fix:** Raise sublabel to `rgba(245,245,245,0.62)` minimum. Add 3-4px more line-height. Consider making sublabels visible only on row tap/hover (Apple Health pattern — "Show Details" reveals).

---

## 16. [MAJOR] Settings "wake by vibration only" checkbox alignment is broken — body text wraps under the checkbox, not beside it
**Location:** You/Settings → "how you arrive" section → vibration-only checkbox row.
**Problem:** The checkbox is 16px square top-left; the text label starts beside it but the `<em>` sub-text (`· for hearing-impaired users — slow rising…`) wraps to a new line that drops back to the left edge UNDER the checkbox. There's no flex alignment compensating for the icon's column. Result: the em sub-text floats orphaned, partially under the checkbox.
**Fix:** Wrap the label content in a flex column with `flex: 1`, give the checkbox a fixed-width column at 24px, and ensure the em text remains in the label's column. Same fix applies to the three radio rows above (they do this slightly better but still have the same indent issue when the em wraps).

---

## 17. [MAJOR] Settings "request permissions" button is a tiny pill at the right edge of an otherwise full-width card
**Location:** You → wake & sleep permissions section.
**Problem:** Above the button are three full-width data rows. Then a tiny outlined pill ("request permissions", 12px, 14px horizontal padding) hangs at the right edge. Looks like a footer/utility action, not the primary task of the section. It IS the primary task — without permissions, the alarm doesn't work. Apple Health, Oak, Calm — all of them make permission-requests a full-width prominent CTA.
**Fix:** Make this a full-width button matching the Home secondary style. Title it "give FRQNCY permission to wake you" (don't make the user translate "request permissions" → "ok yes"). When all three are granted, replace with a satisfied state.

---

## 18. [MAJOR] Bedside's `tonight's session` button is full-width but visually identical to a card (translucent grey + white text), not a CTA
**Location:** Bedside → below alarm card.
**Problem:** It's labeled like a CTA ("tonight's session" = imperative), styled like a card, with no eyebrow / no description / no chevron. The user has no signal whether tapping does something or expands. Compare to Oak's "Start Session" — a single, unambiguous green primary button.
**Fix:** Either make it a primary CTA (solid gold-on-navy if the user is in pre-bedtime context; outline gold otherwise), OR commit to the card pattern and add an eyebrow + description ("tonight" / "begin a 12-minute settling session"). The "looks like a card, acts like a button" middle is the worst of both.

---

## 19. [MINOR] Card border-radius drifts: home cards 14px, sleep options 20px, alarm card 24px, settings sections 14px, dismiss-options 10px
**Location:** All card surfaces.
**Problem:** Five different radii on what are functionally the same component (a content container). The eye reads this as cobbled-together. Apple Health uses 13px throughout iOS 17; Calm uses a consistent 16px. The visual rhythm of FRQNCY breaks at every page boundary because container shape changes.
**Fix:** Codify three roles. Small chips/buttons = 10px or 999px (pill). Cards/sections = 14px. Hero surfaces (alarm card, support-link) = 20px. Sleep chooser is currently 20px which doesn't match its content-density role; recommend 14px.

---

## 20. [MINOR] Home CTA stack's "set up my wake-up" lowercase + 0.8px letter-spacing reads cramped against the round 14px radius
**Location:** Home primary button.
**Problem:** Lowercase + 14px regular + 0.8px tracking on a 14px-radius pill feels typographically pinched. The button is full-width but the text optical center sits slightly low (line-height not tuned). Apple HIG buttons use 0.0 or -0.2 tracking on system font; tightening, not opening.
**Fix:** Drop letter-spacing to 0.2px; bump line-height to 1.2; consider 15-16px font-size to fill the 50px tap target visually. (Currently 14px text on a 50px button leaves too much vertical air.)

---

## 21. [MINOR] "tonight" eyebrow on Home card uses gold, but the same word as page title on Sleep chooser is grey — already noted but worth a second pass
**Location:** Cross-surface inconsistency, also in finding #7.
**Fix:** See #7. Calling out separately because "tonight" appearing in two places, two colors, is the easiest brand-cohesion test to fail.

---

## 22. [MINOR] The reflection textarea on `/app/wake.html` has italic placeholder "anything · or nothing" at 32% white
**Location:** Wake → reflection screen.
**Problem:** Italic placeholders are a deprecated pattern (Apple dropped them from HIG 2019; Material 3 dropped them too). At 32% opacity + italic + serif-flavor (system italic), it reads as a styling glitch on first glance. The middle-dot separator adds a third typographic style to a single string.
**Fix:** Drop italic. Lift to 40% white. Use a single-style placeholder ("write anything, or nothing") or split into placeholder + helper text below the field.

---

## 23. [MINOR] Sleep-session screen shows a close (×) button alone in the top-right corner with no margin from the safe area, and no fallback for tap accuracy
**Location:** Active sleep session (screenshot 13).
**Problem:** A small × at ~32x32px sits 8px from the top edge, 8px from the right edge. Tap target is fine, but the visual prominence is wrong: the only thing on the screen is a tiny close button. The user landing here mid-flow has no orientation. Also it conflicts with iOS dynamic-island region on iPhone 14+.
**Fix:** Move × down to safe-area-top + 16px, leave 20px from the right. Add a barely-visible "tap to leave" microcopy on first session-start (fades after 8s). Apple's Sleep Focus exits via swipe-up + lock-screen pattern, not a × — consider whether this affordance should exist at all.

---

## 24. [MINOR] Brand-mark halo animation overlaps the home-title text on shortest viewports
**Location:** Home, at 390x844 the halo extends 8px past the brand-mark; at 360x780 (iPhone SE) the halo would clip into the H1 baseline.
**Fix:** Cap halo `inset: -6px` (currently -8px) or add `margin-bottom: 36px` to brand-mark so the halo never threatens the title.

---

## 25. [MINOR] Mixed sentence case + lowercase brand styling — "FRQNCY" (all-caps), "frqncy.network" (lowercase), "support frqncy" (lowercase), "© 2026 FRQNCY Network"
**Location:** Across home, settings, footer.
**Problem:** The brand name is rendered three different ways. Lowercase is the dominant FRQNCY voice (per `proposals/FRQNCY-VOICE-PLAYBOOK.md`), but "FRQNCY" in title-case appears in H1 and copyright. Pick one casing for the wordmark.
**Fix:** Codify: brand wordmark = uppercase `FRQNCY` everywhere a logo or proper name appears; lowercase `frqncy` only inside URLs or as the link-style chip "frqncy.network ↗". Update home title to "welcome to FRQNCY" (already is), and "support FRQNCY ◇" link (currently lowercase) → match wordmark.

---

## 26. [MINOR] No haptic/state feedback on tab-bar tap; tabs change instantly without an active-press state
**Location:** Bottom tab bar.
**Problem:** Tapping any tab transitions immediately with no scale/opacity feedback. Apple's tab bars have a built-in 0.4s subtle scale + opacity dip on press. Things 3 has the same. Without it, taps feel digital, not physical.
**Fix:** Add `:active { transform: scale(0.94); opacity: 0.7; }` with a 120ms transition on `.tab`. Combine with `Haptics.impact({ style: 'light' })` from Capacitor when a tab actually switches.

---

## Summary of severity rollup
- 4 blockers (1 broken native control, 1 missing tab bar, 1 mis-routing bug, 1 over-loud offline banner)
- 14 majors (typography hierarchy, button-style fragmentation, eyebrow inconsistency, embed leakage, brand-mark, tab-bar glyphs, animation-at-rest, alignment bugs)
- 8 minors (radius drift, casing, placeholder italics, halo overlap, missing haptics)

These are addressable in roughly this order:
1. Hide the time-input. Fix the You-tab tab-bar. Lock down tab routing. Tone down the offline banner. (Day 1)
2. Codify eyebrow + H1 + card-radius system; apply across all 5 `/app/*.html` files. (Day 2-3)
3. Replace the brand-mark and the four tab glyphs with a custom set. (Day 4-5)
4. Embed-mode = hide site chrome from `frqncy.network` pages when loaded in the iframe. (Day 5-7, depends on site-side changes)
