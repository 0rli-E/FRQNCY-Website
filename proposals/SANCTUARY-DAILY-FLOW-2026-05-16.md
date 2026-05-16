# Sanctuary — Daily Flow Proposal

**Author:** Senior product designer (Things 3 Today, Duolingo daily, Apple Health Today)
**Date:** 2026-05-16
**Surface:** `/my-frqncy/dashboard/` (the Sanctuary)
**Question:** What does daily use of the Sanctuary look like, end to end?

**Companion docs:**
- `proposals/SANCTUARY-ROADMAP.md` — what's shipped + planned
- `proposals/FRQNCY-VOICE-PLAYBOOK.md` — voice constraints
- `project_sanctuary_ux_audit_2026_05_16.md` — 8 open structural issues
- `proposals/MASTER-ROADMAP.md` — overall ambition

---

## The frame

Today the Sanctuary is a long page that holds a person's pyramid. It is competent at *capture* and silent on *return*. A user can write a Dream, a Chief Aim, and a Practice, then come back a week later and see exactly the same surface — nothing acknowledges the gap, nothing surfaces yesterday's writing, nothing tells today's self what last-week's self was working on. The page treats every visit as the first.

A daily-use surface has a different job than a configurator. Its job is to be the first place you put your eyes in the morning, the place you put them again at 8 minutes past midday when you have thirty seconds, and the place you sit with for twenty-five minutes when you're actually here. The shape of those three visits has to be designed, not assumed.

What follows is the design of those visits, then the design of the long return, then the action-completion micro-flow, then the operational shape of the Pyramid as a living document.

Editorial constraints from the playbook: no streaks-as-score, no leaderboards, no shame, no metrics-as-identity, no notifications screaming, no productivity-app affordances. The Sanctuary is a mirror. The user is the authority.

---

## 1. Morning open — what surfaces first

**The problem.** Today's Sanctuary opens to a five-tab strip, a hero ("Your Sanctuary"), a privacy banner, and a Scoreboard for chief aims that is mostly empty for new users. None of that is the *one* thing a person who just opened the app at 7 AM needs.

**Proposal 1.1 — The Morning Card, above everything. [Severity: high]**
The first paint of the morning open is a single card filling roughly the top 60% of the mobile viewport. It contains, in this order: today's date in Cormorant italic, the user's current Chief Aim (one line, not the whole pyramid), an intention input *prefilled with yesterday's intention* in faint italic ("Yesterday: a steady morning. — tap to write today's."), and a single primary CTA: today's practice, named, with the duration ("◇ Sit · 10 min").

The single most useful thing to surface in the morning is not the practice and not yesterday's reflection — it is **the bridge between them**. The Things 3 Today view works because it shows you the three things you said yesterday were worth doing today; it does not ask you to plan again. Apple Health Today works because it opens to one summary number with the gentle assumption you'll act on it. The Sanctuary's equivalent is: yesterday's intention as ghost text behind today's input, and today's practice as the one thing that can be done from here without scrolling.

**What to ship:** a `morning-card` component that replaces the current `today-section` for the first 6 hours after waking (5 AM–11 AM local), then collapses into a slim "Today's intention: ..." strip below the tabs once filled in.

**Proposal 1.2 — Surface Chief Aim as the morning context, not as a scoreboard. [Severity: high]**
The Scoreboard (chief-aim cards with 1–10 sliders) is a *configuration surface*, not a daily-use surface. It belongs on the Goal Pyramid tab. The Dashboard tab's morning open should show the chief aim as a single line in Cormorant italic — `"This year, you are becoming: a parent who is calm at 6pm."` — directly above the intention input. The aim is the why the intention exists.

**What to ship:** demote the Scoreboard to the Goal Pyramid tab; promote a single-line Chief Aim ribbon to the morning card.

---

## 2. The 30-second visit, the 5-minute visit, the 25-minute visit

A practiced user opens the Sanctuary at three depths. The interface must serve all three without making any of them feel partial.

**Proposal 2.1 — The 30-second path: tap-to-complete the day's practice. [Severity: high]**
Thirty seconds is enough to open the app, see today's practice, tap it done, see the save confirmation, and close. Today this fails because the practice is buried under the Scoreboard and "Today's Practice" section, which renders habit chips but does not surface the single named practice for the day. Duolingo's 30-second loop (open → one lesson tile → tap → "+1 XP" → close) is the model — minus the XP, minus the celebration. The Sanctuary's version: open → morning card with one named practice → tap → quiet save confirmation → close.

**What to ship:** a `today-practice` slot on the morning card that names exactly one thing, tappable, with `aria-pressed` state for completion. If the user has multiple habits, the slot rotates through them with a small dot indicator (no streak count visible at this layer).

**Proposal 2.2 — The 5-minute path: intention + reflection. [Severity: medium]**
Five minutes is enough to write today's intention (one line), read yesterday's intention back, and respond to the reflection prompt ("What did yesterday serve?"). This is the existing Today panel, refined: one input visible at a time (intention first, reflection appears below after intention is saved), Cormorant italic for the prompts, soft autofocus on the intention input on morning open, soft autofocus on the reflection input on evening open.

The Calm Daily Reflection works because it shows one prompt at a time and never multiple inputs simultaneously. The Sanctuary should do the same — staging inputs rather than presenting a form.

**What to ship:** progressive disclosure on the morning card. Intention first, reflection card appears below only after the intention has been written or skipped. Don't render both at once on first paint.

**Proposal 2.3 — The 25-minute path: descent into the Pyramid. [Severity: medium]**
Twenty-five minutes is enough to sit with a chief aim, edit an objective, revise this month's goals, and write a longer reflection. The current tabs (Goal Pyramid / Daily Practice / Progress / Vision Board) serve this depth — but the user has to find them first. Right now the tab strip overflows at 390px (audit issue #2) and three of five tabs are invisible. The 25-minute user is exactly the user who needs Progress and Vision Board.

**What to ship:** fix the tab overflow (horizontal scroll with fade-edge OR collapse into "More ▾" overflow). Add a "Sit with this" affordance on the morning card's chief-aim ribbon — tapping it deep-links to that aim on the Pyramid tab with that aim expanded and its objectives in focus, not the whole pyramid.

---

## 3. The "I haven't been here in 8 days" return

**The problem.** Currently an 8-day return looks identical to a 1-day return. The user is silently restored to a stale intention from 8 days ago (if any), the date in "Today's Practice" jumps forward, and nothing acknowledges the absence. This is the moment most daily apps lose the user — either by shaming them (the old Duolingo streak-loss flame) or by pretending it didn't happen.

**Proposal 3.1 — The Soft Welcome-Back. [Severity: high]**
On first paint after a gap of 4+ days, the morning card replaces the intention prompt with a single sentence in Cormorant italic: *"It's been a quiet stretch — eight days since you were last here. Welcome back."* No flame, no streak-broken language, no make-up prompt. Below it: one CTA — "Look at what last-you was working on" — which expands a small read-only card showing the last intention written, the last reflection written, and the current chief aim. Below that: the regular intention input, prefilled with the last intention as ghost text.

This is the same affordance Streaks (the iOS habit app) added in their 2024 redesign — the gap is named, not punished. The reframing is: a gap is information about the practitioner, not a failure of the practice.

**What to ship:** a gap-detection branch in `renderToday()` (>3 days since last `dailyIntentions[date]` write). Renders the soft welcome-back variant. Self-dismisses on first interaction.

**Proposal 3.2 — Gap-respectful Pyramid surfacing. [Severity: medium]**
On an 8-day return, the Chief Aim ribbon shows the aim *as the user last left it*, with a small affordance underneath: "Still the work? — yes / refine". Tapping "refine" jumps to the Pyramid tab with the aim's name input focused. Tapping "yes" is silent confirmation. This is the same pattern Things 3 uses for stale Today items — it never deletes them; it asks once.

**What to ship:** a `staleness-check` on chief-aim render after a 7+ day gap. Inline confirm/refine affordance. No modal.

---

## 4. What persists across days — the shape of accumulation

**The problem.** A daily practice without a record never becomes a real practice. Right now Sanctuary records intentions and habit completions to local storage, but the user has no surface to *see them*. Every visit looks identical. The Roadmap's Phase 1 calls for "The Trail" — this proposal sharpens it.

**Proposal 4.1 — The Trail as a horizontal week ribbon. [Severity: high]**
Below the morning card on the Dashboard tab, a thin horizontal strip shows the last 7 days as small circular nodes. Each node holds: a date, a dot (filled if any habit was completed that day, hollow if not, faint if no record exists), and the first 4 words of that day's intention as a tooltip on hover/long-press. Tapping a node expands a read-only card with that day's intention, reflection, and habit summary.

This is observational, not metric. There is no count, no percentage, no streak number rendered. The week is a *shape*, not a *score*. Apple Health's activity rings work because they're rhythmic and silent — they tell you the shape of your week without ranking it. The Sanctuary's week ribbon is the same idea minus the ring fill (rings imply a target; the Sanctuary doesn't set targets).

**What to ship:** a `week-ribbon` component, 7 nodes, tap-to-expand. Date + completion-bit + intention-first-line. No counts. Quiet by default.

**Proposal 4.2 — The Quiet Streak Indicator. [Severity: medium]**
Streaks already exist in the data (`streakFor(habitId)` in dashboard.js). The current treatment — `🔥30` on each habit chip — is the wrong register. Replace it with a single line in Cormorant italic on the chief-aim ribbon, only when streak ≥ 7: *"You've sat thirty mornings in a row. Quiet, repeated devotion is the work."* The number is named once, in prose, as recognition — not as a counter visible at all times.

When the streak resets, nothing visible changes. The line just stops appearing. This is the inverse of Duolingo's old streak-shame loop and matches the playbook's "no metrics-as-identity" rule.

**What to ship:** replace the `habit-streak` chip badge with a contextual Cormorant line on the morning card. Only renders at milestone thresholds (7, 30, 90, 365). Below thresholds: silent.

**Proposal 4.3 — Month edges. [Severity: low]**
The Roadmap Phase 1 calls for a Monthly Close. Specifically: on the last day of each month, the morning card grows one extra card: *"This month, you sat 22 of 30 mornings. You wrote about 'patience' six times."* One line. No grade. The user can optionally write a one-line "What did this month serve?" — which becomes the month's epigraph on the trail.

**What to ship:** a `month-edge` card that renders on the last 2 days of the month and the first 2 of the next. Two facts (one count, one word frequency) + one optional input. Self-archives.

---

## 5. The action-completion moment — the micro-flow

**The problem.** Audit issue #8: Edit buttons exist on Dream and Chief Aim cards but there is no save indicator visible during editing. The `#save-indicator` element exists in the DOM (line 1089) but renders far up the page in the privacy banner, where the user's eyes are not when they're editing a chief aim at line 1700+ of the page. The user writes, blurs the input, and has no confirmation the write landed.

**Proposal 5.1 — Inline save chip on every edited field. [Severity: high]**
Each editable input gets a small companion element that renders inline, one line below the input, on save. Three states: `· saving…` (immediately on blur or change), `✦ Saved` (on local persist success, fades after 1.4s), `✦ Synced` (on cloud confirm, fades after 1.4s, only when signed in). The chip is co-located with the input, not in the top banner. This matches Notion's per-block save indicator and Things 3's per-field iCloud sync confirmation.

**What to ship:** wrap the existing `showSaved()` / `showSaveError()` calls so each input that triggers a persist gets its own inline chip. Keep the top-level indicator as a fallback for non-input writes (habit completion, vision-board upload).

**Proposal 5.2 — Habit completion: tap + tactile confirm + quiet. [Severity: high]**
When a user taps a habit chip done: (1) the chip animates to the completed state (the existing `.today-chip.done` style — green border, ✓ glyph), (2) a soft 80ms haptic on mobile (use `navigator.vibrate(8)` — already supported), (3) the save chip renders inline below the chip strip with `✦ Saved`, (4) no toast, no modal, no congratulation, no streak-increment animation. The whole thing is under 200ms and silent.

Duolingo's 2024 redesign removed the celebration animation on lesson completion for the same reason: a daily-use surface should feel like a routine, not a reward. The Sanctuary inherits that posture by default.

**What to ship:** add `navigator.vibrate(8)` on habit-chip completion. Remove any future temptation to add success toasts. Confirm the inline save chip renders within the chip strip's container, not at the page top.

**Proposal 5.3 — Undo affordance. [Severity: medium]**
Marking a practice done by accident is the most common micro-failure in daily-use apps. After a completion, the inline save chip should read `✦ Saved · undo` for the 1.4s window. Tapping `undo` reverses the completion. This is the iOS Reminders pattern — never a modal, never a confirm dialog, just a transient inline reverse.

**What to ship:** add the `undo` link to the inline save chip on habit completion (only — not on every save). 1.4s window matches the fade-out duration.

---

## 6. Goal Pyramid as a living document, not a form

**The problem.** Most goal apps die because the user types once and never returns to the form. The Sanctuary's Pyramid (Dream → Chief Aim → Objective → Goal) is currently a form. It does not get *touched* in daily use — it gets configured once and visited as a reference. That's the failure mode.

**Proposal 6.1 — A single Pyramid prompt, surfaced once per month. [Severity: medium]**
On the first morning of each month, the morning card grows one extra prompt — exactly one — that asks the user to look at one tier of the Pyramid. Cycle: Month 1 = Dream ("Is this still the dream? — one sentence to confirm or reshape."), Month 2 = Chief Aims, Month 3 = Objectives, Month 4 = Goals, then repeat. The user can dismiss with one tap ("still true") or tap "reshape" to jump into the Pyramid tab with that tier in focus.

This is the inverse of "fill it once and never return". The Pyramid stays static unless gently provoked. One tier per month means a four-month rhythm — slow enough to not be a chore, frequent enough that nothing on the pyramid is older than its third look.

**What to ship:** a `pyramid-prompt` card that renders on the 1st of each month, cycles through tiers in a fixed rotation. Two-button affordance (`still true` / `reshape`). State persists as `state.pyramidLastTouched[tier]`.

**Proposal 6.2 — Inline edit from the morning card. [Severity: medium]**
When a chief aim is renamed inline (via the existing inline-edit input), the Pyramid surface updates everywhere it's referenced — the morning card's chief aim ribbon, the Scoreboard on the Pyramid tab, and the Where You're Headed section. The user should never have to navigate to a separate page to refine a chief aim that's visible on the dashboard. This is the Roam Research / Logseq pattern: the document is the database, and you edit it where you see it.

**What to ship:** ensure all chief-aim references re-render on a single chief-aim edit (a single source-of-truth render that runs on `state.chiefAims` change). Already mostly true — verify and harden.

**Proposal 6.3 — The Pyramid Tab as a single scroll, not nested tabs. [Severity: low]**
Right now the Pyramid tab renders four nested sections (Dream / Chief Aims / Objectives / Goals). They should stack vertically with sticky tier headers and a small jump-nav at top ("Dream · Aims · Objectives · Goals"), so the user can scroll-or-jump within the tab. The mental model is one pyramid; the UI should be one column.

**What to ship:** keep the four sections, add a sticky jump-nav at the top of the Pyramid tab.

---

## Summary of severity by ship order

**Ship first (high severity, high impact-per-effort):**
1.1 Morning Card · 1.2 Chief Aim ribbon · 2.1 30-second tap-to-complete · 3.1 Soft Welcome-Back · 4.1 Week ribbon · 5.1 Inline save chip · 5.2 Habit haptic + quiet completion.

**Ship next:** 2.2, 2.3, 3.2, 4.2, 5.3, 6.1, 6.2.

**Ship later:** 4.3, 6.3.

---

## What this proposal does not do

- Does not propose any new analytics, third-party SDKs, or telemetry. The Sanctuary remains local-first.
- Does not propose any LLM-mediated daily flow (that's Roadmap Phase 3 — "Ask Sanctuary").
- Does not propose any social affordance, comparison, leaderboard, or shared view. Witnesses are Phase 4.
- Does not propose any monetisation surface inside Sanctuary. The Recommended Memberships section should be removed from the dashboard tab and demoted to a quiet line in the footer, per the playbook's "never paywall the thesis" rule and audit issue #4.

---

*Slogan that governs the work: the Sanctuary is a mirror, not a teacher. Every proposal above ships only if it can be read as a reflection of the user's own work, not a prescription for it.*
