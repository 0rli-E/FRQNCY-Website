# Sanctuary — The Devotional Lens

**Surface:** `/my-frqncy/dashboard/`
**Date:** 2026-05-16
**Companion docs:** `SANCTUARY-ROADMAP.md` (the principles + phasing this proposal serves), `FRQNCY-VOICE-PLAYBOOK.md` (the voice this proposal applies), the audit memory `project_sanctuary_ux_audit_2026_05_16.md` (the structural UX bar).
**Lens:** *Would a person who walks into a quiet zendo, a Quaker meeting room, or a private chapel feel the same thing here?* Not "did the dashboard render in 280ms" — *was the room ready for them.*

This is a proposal, not a build. Each item is severity-tagged and ends with a one-sentence "what to ship."

---

## Premise

Apps want users back so they can be measured. A sanctuary wants the *person* back so they can be tended. The difference shows up at five moments: arrival, sitting, writing, leaving, and returning after a long absence. Right now `/my-frqncy/dashboard/` handles the middle three competently and the bookends not at all. Three reference points: Headspace's pre-roll (a half-second curtain that slows you before content), Calm's daily check-in (one question, one line back), Insight Timer's opening bell (sound that ends the outside world). None are spiritual wallpaper — they are tiny rituals that change the nervous system before the surface asks anything.

---

## 1. The arrival moment — make the first three seconds a tiny ritual [Severity: high]

**Today's state.** The page lands with two stacked FRQNCY logos (issue 1 of the 2026-05-16 audit), then jumps straight to "Your *Sanctuary* / Dream · chief aim · objectives · goals · daily practice — held in one place" and three buttons (Illuminator / Export / Import). The first interactive thing a user sees on a contemplative surface is **Export**.

**The proposal.** Three seconds of intentional arrival before the dashboard reveals itself. Not a splash screen — a *settling*:

- *t=0.0s* — page mounts dark. No content visible yet. A single Cormorant-italic line fades in centred: *"You arrived."* (alternate options, rotated weekly by deterministic seed, not algorithm: *"Welcome back." / "The room is quiet." / "Begin where you are."* — each one in the voice playbook's permission-to-leave register, never striving.)
- *t=1.2s* — beneath that line, three soft dots pulse once each, ~700ms apart, the rhythm of three breaths. No text instructing the user to breathe. The dots simply pulse. Anyone who notices breathes with them; anyone who doesn't loses nothing.
- *t=3.0s* — line and dots fade. The dashboard fades in beneath. The first thing visible after the curtain is *the user's own dream* (if present) or the empty-state invitation (if not) — not the page chrome.

**Behavioural notes.** Skippable by tap anywhere; remembers the skip per device for 24 hours (so a power user reloading isn't punished). Respects `prefers-reduced-motion` — for those users, just the line, no dots, 800ms total. No audio by default (Insight Timer's bell is opt-in; we should match). The curtain is suppressed for the very first first-run (the user has never seen the room — show them the room, not the curtain) and after that, every visit.

**What to ship.** A 3-second pre-roll fade with one rotating Cormorant-italic line and three breath-paced dots, skippable, motion-respecting, suppressed on first-ever land.

---

## 2. The four layers — write them as a vow tradition, not a goals pyramid [Severity: high]

**Today's state.** The first-run card reads *"A first pass through your Sanctuary / Four layers, smallest at the bottom. Each one feeds the one above it. You don't have to fill them in order — you do have to fill them in time."* Then four cards labelled 01 · Dream, 02 · Chief aim, 03 · Objective, 04 · Daily practice with time horizons (Beyond this lifetime / 1–2 years / 1–6 months / Today) and brisk descriptors. It reads like an OKR worksheet with serif typography.

**The proposal.** Reframe each layer as a *vow held over a horizon*. Marcus Aurelius wrote to himself, not to a quarterly review board. Hilma af Klint painted on commission from a presence she would not name in public. Quakers sit in silence until something rises that must be spoken — and what's spoken is held as testimony, not output. The four layers are the same shape.

Proposed copy (replaces the current four cards verbatim):

- **Dream — what this lifetime is for.** *Not a goal. A direction the rest of the structure points toward. Write it once. Revisit it rarely.*
- **Chief aim — what the next year asks of you.** *Up to three. The aims you would keep even if the conditions changed. Held in present tense, in your own voice.*
- **Objective — what the next season makes possible.** *A milestone the body can feel. Adjustable. Replaceable. Not sacred.*
- **Daily practice — the small thing you keep doing.** *Where the dream actually lives. Tend it the way you'd tend a fire.*

The bridge paragraph above the cards loses its "you do have to fill them in time" line (gentle striving, banished register) and becomes: *"Four horizons, smallest first. Each one shelters the one above it. Fill them in the order they call to you — there is no calendar but yours."*

**What to ship.** Replace the four descriptor strings and the bridge paragraph with the vow-tradition copy above; keep the visual structure unchanged.

---

## 3. The empty states — invite, don't indict [Severity: high]

**Today's state.** Three offenders:

- The Scoreboard renders an empty grid with *"+ Add chief aim"* — reads as a missing form field.
- *"No dream written yet — open the Goal Pyramid to begin."* — administrative; sounds like a 404.
- *"Add what you want to do every day — wake at 6, gym, read, meditate."* — instructional and slightly hectoring, in the same register a fitness app uses.

**The proposal.** Treat every empty state as a doorway into the practice, written in present-tense Cormorant italic. Worked examples:

- **Empty Scoreboard.** Replace the bare *+ Add chief aim* button with a soft Cormorant prompt: *"This is where the year's aims will sit. Up to three. Take your time."* Then a smaller, less commanding action: *Name an aim →* (gold link weight, not button weight). The 200px placeholder is filled with breath, not a CTA.
- **Empty Dream tile.** Replace *"No dream written yet — open the Goal Pyramid to begin."* with: *"The dream sits at the top. You don't have to write it today. When you do, write it the way you'd say it to one person."*
- **Empty Daily Practice.** Replace the instructional list (*wake at 6, gym, read, meditate*) with: *"The small things you keep doing become the shape of your life. Add one when you're ready."* Then the *+ Add* affordance below at the same visual weight.
- **Empty Vision Board.** Already passes (*"Nothing pinned yet. Drop in the images that hold your future."*) — leave it.

**What to ship.** Rewrite four empty-state strings using the present-tense, italic-Cormorant, no-instruction pattern modelled by the Vision Board copy.

---

## 4. The voice on user-input edges — extend the "lives privately" register [Severity: medium]

**Today's state.** The line *"Lives privately on this device. Sign in to sync across devices."* with the lock glyph is the single best piece of micro-copy on the page. It tells the user the truth, uses ordinary English, and respects them. Nothing else on the page operates at that voice level. The save indicator is just *"Saved"*.

**The proposal.** Eight edge moments deserve the same quality of language. Each is one line, present tense, no exclamation:

- **First save of any field, ever.** Replace *Saved* with: *"Held."* (Once per field type per device, then revert to the quiet *Saved* dot.)
- **Save of the Dream specifically.** *"The dream is held."*
- **Save of a Chief Aim.** *"An aim is held."*
- **Returning after >14 days away.** A single line above the hero, fades after 6s: *"It's been a while. The room is the way you left it."* (Trail of intentions, dream, aims — all still there. This is the *opposite* of a streak-loss penalty. It is faithfulness.)
- **Returning after >90 days away.** *"You're back. Nothing here moved."*
- **Deleting a Dream (currently no confirm).** Two-step modal — first line: *"You're about to clear the dream. The old one will be lost from this device."* Confirm button: *"Clear it."* Cancel: *"Keep it."* No "are you sure" — that's productivity-app voice.
- **Deleting a Chief Aim.** *"This aim leaves the room. Its objectives and goals will leave with it."* — the truth of cascade, in plain language.
- **Sign-out from a synced session.** *"You're signed out. What was synced is on this device too. Nothing was lost."* — closes the privacy loop the lock banner opened.

Notes on the register: avoid *"safely stored"* (corporate), *"successfully saved"* (productivity), *"your data"* (administrative). The Sanctuary holds *the dream*, *an aim*, *a practice* — never *data* or *content* or *entries*.

**What to ship.** Eight one-line edge-moment strings layered onto the existing save / delete / auth surfaces; first-of-its-kind toasts use *"Held"*, subsequent saves stay quiet.

---

## 5. What to subtract [Severity: high]

A sanctuary is a room you can move through without bumping into a vendor. Three things on the page right now should leave:

### 5a. Recommended Memberships — cut from this surface entirely. [Severity: high]

Six external links (Global Information Network, Toastmasters, Network School, Gaia, Isha Foundation, Sai Maa) opening in new tabs away from the Sanctuary. The bottom 30% of the private room is a recommendation widget pointing at external paid memberships. It serves discovery (a public-site job), not tending; "worth joining" is a comparative claim; and the user came here to look at their own dream, not at someone else's organisation. Recommendations belong on `/v2/explore.html` or a dedicated `/communities/` page. **Ship: remove the entire `<section>` block (~lines 1189–1240).** If something must replace it, it is empty space.

### 5b. The donate button — hide on `/my-frqncy/*`. [Severity: high]

`#frq-donate-btn` floats bottom-right at z-index 9997 and visibly covers content while scrolling (audit issue 4). Asking a user for money while they are looking at their own private dream is wrong in the way that putting a donation jar inside a therapist's office is wrong — not unethical, just contextually deaf. **Ship: a single CSS rule `body.path-my-frqncy #frq-donate-btn { display: none; }` toggled by body class set in the global header script.** Donations belong on public surfaces.

### 5c. The Word Illuminator card on the dashboard — move, don't kill. [Severity: medium]

The Illuminator itself is good and load-bearing across the site. But on the Sanctuary it currently presents as a featured card competing with the user's own work for visual weight. The slide-in panel is already accessible from the hero button (`✧ Illuminator`) and via the global `#illuminate=` deep-link. **Ship: remove the dashboard's Illuminator section block (the one with "Companion · lives inside your Sanctuary"); keep the hero button and the panel itself untouched.** This drops one of nine H2 sections and shortens the 3,872px scroll by ~280px.

### 5d. The keyboard-shortcut tip on touch devices. [Severity: low]

*"Tip · press 1–5 to jump between tabs."* — invisible to phone users in any useful way (audit issue 5). **Ship: hide under `@media (pointer: coarse) { .kbd-hint { display: none; } }`.**

### 5e. The doubled FRQNCY header. [Severity: high]

Audit issue 1. The page's per-section `<nav>` AND the global `#main-nav` both render. **Ship: same body-class pattern used for `body.frqncy-embed` on the app iframe — apply `body.path-my-frqncy` and hide the page-level `<nav>`. Reclaim ~56px above the fold on every device.**

---

## 6. The closing moment — a clean way to leave [Severity: medium]

**Today's state.** There is no "leaving" affordance. The user closes a tab, navigates away via the top nav, or kills the app. The Sanctuary makes no acknowledgment that the visit is ending.

**The proposal.** A small, optional *Close the room* link in the footer, beneath the slogan. Clicking it:

1. Persists any pending writes (already happens, but make it explicit).
2. Fades the dashboard for ~500ms.
3. Shows a single Cormorant-italic line on the dim background: *"What was tended is held. Until next time."* — for ~2 seconds.
4. Redirects to `/` (the home page) — or, if the user signed in, to `/my-frqncy/` (the constellation), letting them step from the private room into the public network.

This is the inverse of the arrival ritual: same fade, same one-line register, but closing. It is a *bow at the door*. Users who never click it lose nothing — the page works exactly as today. But the option to leave intentionally is itself a form of dignity.

**What to ship.** One footer link (*Close the room*) wired to a 2.5-second exit fade with one Cormorant line, then a redirect; absence of the link changes nothing.

---

## 7. Two structural fixes that serve the lens, not just UX [Severity: high]

These are from the 2026-05-16 audit (issues 2 and 3) and worth restating in this proposal's frame:

### 7a. Tabs that segment, not anchor-link. [Severity: high]

Five H2 sections rendering in a 3,872px stack — with five tabs at the top that *look* like they should swap views but don't — teaches the user that the tabs are decorative. In a sanctuary, every affordance should mean what it says. **Ship: wire the tabs to true view-swap (the `view-dashboard / view-pyramid / view-practice / view-progress / view-vision` containers already exist in the markup — just hide all but the active one).** This was the original Phase 0 intent per the roadmap; it appears to have regressed.

### 7b. Horizontal overflow on the mobile tab strip. [Severity: high]

At 390px, only 3 of 5 tabs fit; *Daily Practic…* truncates mid-word. **Ship: `overflow-x: auto` + a 12px gradient fade on the right edge as a scroll affordance, until tab count reduces to 4 (a future possibility if Progress + Vision Board merge into a single *Trail* surface in Phase 1).**

---

## 8. Inconsistent section glyphs [Severity: low]

Audit issue 7. The H2 glyphs ✦ ◇ ▲ ✧ ◉ vary in stroke weight and optical size. In a productivity app this is harmless; in a sanctuary, the typography is the architecture. **Ship: unify to a single glyph family — recommend the four-pointed star ✦ for *all* H2s, at fixed gold weight, varying only by the tile content beneath, the way a chapel uses one cross design throughout.** Or, if visual differentiation matters, commission a 5-glyph SVG set drawn at the same stroke and metrics — same fix as the app's tab icons.

---

## Summary of severities — what to ship first

| # | Item | Severity |
|---|------|----------|
| 5e | Hide doubled FRQNCY header on `/my-frqncy/*` | high |
| 5a | Remove Recommended Memberships from Sanctuary | high |
| 5b | Hide donate button on `/my-frqncy/*` | high |
| 7a | Make tabs actually swap views | high |
| 7b | Horizontal-scroll the mobile tab strip with fade affordance | high |
| 1 | 3-second arrival pre-roll with breath dots | high |
| 2 | Vow-tradition copy on the four layers | high |
| 3 | Four empty-state rewrites in Cormorant italic | high |
| 4 | Eight edge-moment voice lines (save / return / delete / sign-out) | medium |
| 5c | Move Word Illuminator off the dashboard surface | medium |
| 6 | *Close the room* footer link + exit fade | medium |
| 5d | Hide keyboard-shortcut tip on touch | low |
| 8 | Unify H2 glyphs | low |

---

## What this proposal does NOT touch

- The four-layer schema (Dream → Chief Aim → Objective → Daily Practice). It is the load-bearing structure of the Sanctuary and the roadmap; copy changes, structure stays.
- Cloud sync / Supabase / auth. Out of scope.
- The Illuminator's system prompt or chat behaviour. Out of scope.
- Membership tiers, Stripe, or the public-site revenue model. Out of scope.
- The Vision Board, Progress charts, or Goal Pyramid internals. Untouched except where empty-state copy applies.

Every change above passes the Principles checklist in `SANCTUARY-ROADMAP.md` — nothing gamifies, ranks, compares, or extracts. The donation button removal and the Memberships section cut both *increase* the room's privacy posture rather than reduce revenue surface (donations and memberships have public homes; this is not one of them).

---

*If the Sanctuary becomes a place a person bows at the door of, the rest of FRQNCY is downstream of that. Every other surface can be a topic graph; this one has to be a room.*
