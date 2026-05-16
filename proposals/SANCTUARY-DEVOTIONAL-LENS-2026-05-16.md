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

**The proposal.** Three seconds of intentional arrival, not a splash screen — a *settling*:

- *t=0.0s* — page mounts dark, a single Cormorant-italic line fades in centred: *"You arrived."* (rotated weekly by deterministic seed: *"Welcome back." / "The room is quiet." / "Begin where you are."*)
- *t=1.2s* — three soft dots pulse once each ~700ms apart, the rhythm of three breaths. No text instructing the user to breathe — anyone who notices breathes with them, anyone who doesn't loses nothing.
- *t=3.0s* — line and dots fade. The dashboard reveals beneath, with the user's own dream first if present.

Skippable on tap; remembers skip per device for 24h; respects `prefers-reduced-motion` (line only, 800ms total); no audio by default; suppressed on the very-first land (show the room, not the curtain).

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

**Today's state.** Three offenders: the empty Scoreboard reads as a missing form field; *"No dream written yet — open the Goal Pyramid to begin."* sounds like a 404; *"Add what you want to do every day — wake at 6, gym, read, meditate."* is instructional and slightly hectoring.

**The proposal.** Every empty state as a doorway, present-tense Cormorant italic:

- **Empty Scoreboard.** Replace the bare button with: *"This is where the year's aims will sit. Up to three. Take your time."* — then *Name an aim →* at gold link weight, not button weight.
- **Empty Dream tile.** *"The dream sits at the top. You don't have to write it today. When you do, write it the way you'd say it to one person."*
- **Empty Daily Practice.** *"The small things you keep doing become the shape of your life. Add one when you're ready."* — *+ Add* below at the same visual weight.
- **Empty Vision Board.** Already passes (*"Nothing pinned yet. Drop in the images that hold your future."*) — leave it.

**What to ship.** Four empty-state rewrites in the Cormorant-italic, no-instruction pattern modelled by the Vision Board copy.

---

## 4. The voice on user-input edges — extend the "lives privately" register [Severity: medium]

**Today's state.** The line *"Lives privately on this device. Sign in to sync across devices."* with the lock glyph is the single best piece of micro-copy on the page. It tells the user the truth, uses ordinary English, and respects them. Nothing else on the page operates at that voice level. The save indicator is just *"Saved"*.

**The proposal.** Eight edge moments deserve the same register. Each is one line, present tense, no exclamation:

- **First save of any field, ever.** Replace *Saved* with *"Held."* — once per field type per device, then revert to the quiet dot.
- **Save of the Dream.** *"The dream is held."*
- **Save of a Chief Aim.** *"An aim is held."*
- **Returning after >14 days.** A line above the hero, fades after 6s: *"It's been a while. The room is the way you left it."* — the opposite of streak-loss; it is faithfulness.
- **Returning after >90 days.** *"You're back. Nothing here moved."*
- **Deleting a Dream.** Two-step modal: *"You're about to clear the dream. The old one will be lost from this device."* Confirm: *"Clear it."* Cancel: *"Keep it."* No "are you sure."
- **Deleting a Chief Aim.** *"This aim leaves the room. Its objectives and goals will leave with it."*
- **Sign-out from a synced session.** *"You're signed out. What was synced is on this device too. Nothing was lost."*

Avoid *"safely stored"*, *"successfully saved"*, *"your data"*. The Sanctuary holds *the dream*, *an aim*, *a practice* — never *data*, *content*, *entries*.

**What to ship.** Eight one-line edge-moment strings layered onto the existing save / delete / auth surfaces; first-of-its-kind toasts use *"Held"*, subsequent saves stay quiet.

---

## 5. What to subtract [Severity: high]

A sanctuary is a room you can move through without bumping into a vendor. Three things on the page right now should leave:

### 5a. Recommended Memberships — cut from this surface entirely. [Severity: high]

Six external links (Global Information Network, Toastmasters, Network School, Gaia, Isha Foundation, Sai Maa) opening in new tabs away from the Sanctuary. The bottom 30% of the private room is a recommendation widget pointing at external paid memberships. It serves discovery (a public-site job), not tending; "worth joining" is a comparative claim; and the user came here to look at their own dream, not at someone else's organisation. Recommendations belong on `/v2/explore.html` or a dedicated `/communities/` page. **Ship: remove the entire `<section>` block (~lines 1189–1240).** If something must replace it, it is empty space.

### 5b. The donate button — hide on `/my-frqncy/*`. [Severity: high]

`#frq-donate-btn` at z-index 9997 visibly covers content while scrolling (audit issue 4). Asking for money while a user reads their own private dream is the contextual equivalent of a donation jar inside a therapist's office. **Ship: `body.path-my-frqncy #frq-donate-btn { display: none; }`.** Donations belong on public surfaces.

### 5c. Word Illuminator card on the dashboard — move, don't kill. [Severity: medium]

The Illuminator itself is good. But as a featured card it competes with the user's own work for visual weight. The slide-in panel is already reachable from the hero button and the `#illuminate=` deep-link. **Ship: remove the Illuminator section block ("Companion · lives inside your Sanctuary"); keep the hero button and panel untouched.** Drops one of nine H2s, shortens scroll by ~280px.

### 5d. The keyboard-shortcut tip on touch devices. [Severity: low]

*"Tip · press 1–5 to jump between tabs."* — invisible to phone users in any useful way (audit issue 5). **Ship: hide under `@media (pointer: coarse) { .kbd-hint { display: none; } }`.**

### 5e. The doubled FRQNCY header. [Severity: high]

Audit issue 1. Both the global `#main-nav` and the page's per-section `<nav>` render. **Ship: same body-class pattern as `body.frqncy-embed` — apply `body.path-my-frqncy` and hide the page-level `<nav>`. Reclaims ~56px above the fold.**

---

## 6. The closing moment — a clean way to leave [Severity: medium]

**Today's state.** No leaving affordance. The user closes a tab, navigates away, or kills the app. The Sanctuary makes no acknowledgment.

**The proposal.** A small, optional *Close the room* link in the footer, beneath the slogan. On click: persist pending writes; fade the dashboard ~500ms; show one Cormorant-italic line on the dim background — *"What was tended is held. Until next time."* — for ~2s; redirect to `/` (or `/my-frqncy/` if signed in). The inverse of the arrival ritual: same fade, same register, closing. A *bow at the door*. Users who never click it lose nothing.

**What to ship.** One footer link (*Close the room*) wired to a 2.5s exit fade with one Cormorant line, then redirect.

---

## 7. Two structural fixes that serve the lens, not just UX [Severity: high]

These are from the 2026-05-16 audit (issues 2 and 3) and worth restating in this proposal's frame:

### 7a. Tabs that segment, not anchor-link. [Severity: high]

A 3,872px stack with five tabs that *look* like view-swaps but don't teaches users the tabs are decorative. In a sanctuary, every affordance means what it says. **Ship: wire tabs to true view-swap (the `view-*` containers already exist; hide all but the active).** Phase 0 intent per the roadmap — appears regressed.

### 7b. Horizontal overflow on the mobile tab strip. [Severity: high]

At 390px, 3 of 5 tabs fit; *Daily Practic…* truncates. **Ship: `overflow-x: auto` + 12px gradient fade on the right edge as scroll affordance.**

---

## 8. Inconsistent section glyphs [Severity: low]

Audit issue 7. The H2 glyphs ✦ ◇ ▲ ✧ ◉ vary in stroke weight and optical size. In a sanctuary, typography is the architecture. **Ship: unify to a single four-pointed star ✦ for *all* H2s at fixed gold weight, the way a chapel uses one cross design throughout.** Or commission a 5-glyph SVG set at matching stroke and metrics.

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

## Out of scope

The four-layer schema (Dream → Chief Aim → Objective → Daily Practice) — load-bearing, copy changes only. Cloud sync / auth. The Illuminator system prompt. Membership tiers and the revenue model. Vision Board, Progress charts, Goal Pyramid internals — untouched except where empty-state copy applies.

Every change above passes the Principles checklist in `SANCTUARY-ROADMAP.md` — nothing gamifies, ranks, compares, or extracts. The donate-button and Memberships removals *increase* the room's privacy posture rather than reduce revenue surface; both have public homes elsewhere.

---

*If the Sanctuary becomes a place a person bows at the door of, the rest of FRQNCY is downstream of that. Every other surface can be a topic graph; this one has to be a room.*
