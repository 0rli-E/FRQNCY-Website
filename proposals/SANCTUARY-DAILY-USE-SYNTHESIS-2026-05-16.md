---
title: "Sanctuary daily-use — 10-lens synthesis"
date: 2026-05-16
status: synthesis
sources:
  - SANCTUARY-DAILY-USE-HABIT-PSYCH-2026-05-16.md
  - SANCTUARY-DAILY-USE-MORNING-OPEN-2026-05-16.md
  - SANCTUARY-DAILY-USE-JOURNALING-2026-05-16.md
  - SANCTUARY-DAILY-USE-GOAL-TRACKING-2026-05-16.md
  - SANCTUARY-DAILY-USE-MEDITATION-ANCHOR-2026-05-16.md
  - SANCTUARY-DAILY-USE-REENGAGE-NO-SHAME-2026-05-16.md
  - SANCTUARY-DAILY-USE-STREAK-DESIGN-2026-05-16.md
  - SANCTUARY-DAILY-USE-COMMITMENT-RITUAL-2026-05-16.md
  - SANCTUARY-DAILY-USE-FIRST-90-DAYS-2026-05-16.md
  - SANCTUARY-DAILY-USE-QUIET-UX-2026-05-16.md
---

# Sanctuary daily-use — 10-lens synthesis

Ten agents researched ten distinct lenses on what makes a contemplative dashboard a daily-return surface. The convergences below appeared in ≥3 of the 10 docs. These are the load-bearing moves.

## The single biggest move

**Pull the Today card above the hero.** Cited by 6 of 10 lenses. The current Sanctuary buries the morning surface under hero + privacy banner + 5-tab strip. Peer apps that retain (Headspace, Calm, Things 3, Stoic, Apple Health) all surface "one thing for now" as the first viewport. Cap that card at four elements: date, current Chief Aim as a Cormorant italic vow-line, today's intention input with yesterday's intention as ghost-text behind it, one practice CTA.

## The ten ship-first proposals

1. **Today/Morning Card pinned above hero** — the four-element surface above. Tap-completable for the 30-second visit.

2. **Frame Chief Aim as a vow, not a goal.** Vow-language is identity-binding (David Whyte, Hannah Arendt). Goal-language is outcome-binding. The Chief Aim should be read aloud / re-read daily, restated weekly, not scored. UI: render the Chief Aim line in Cormorant italic at the top of the Today card with a single "restate" affordance (not "edit," not "complete").

3. **Evening review block (kept / missed / cue-for-tomorrow).** Marcus Aurelius's hypomnemata as the daily anchor. Three short lines, written in Gollwitzer if-then format for the cue ("When I open my laptop in the morning, I will open the Sanctuary first."). The next morning, the cue greets the user — collapsing morning friction to recognising one's own handwriting.

4. **Kill the 🔥 streak chip; keep the milestone thresholds.** The current dashboard contains a contradiction: lines 2897–2917 do quiet milestones at 7/30/100/365 (good), but lines 2135 and 2245 render `🔥${streak}` per-habit chips and a "streak N" history label (Duolingo's loss-aversion engine the milestones were meant to replace). Drop the chip, rename history to "N of 30 days," and elevate a 52-week year-ribbon as the primary retrospective view.

5. **Progressive disclosure: day-0 shows ONE prompt; the rest unlocks by use.** Day-0 is the Dream prompt only. Day-1 unlocks the Illuminator pre-filled with a noun pulled from the Dream (the aha moment — the system writing about *your* words back to you). Day-2 unlocks Daily Intention. Day-3 unlocks the Objective layer. Day-7 unlocks the evening Reflection. Scoreboard and Monthly Goals defer to day 30. A "What you wrote three months ago" memory surface lights up at day 90. Gate via `state.firstSeenAt` + a deduped `state.returnDays` array — count, not consecutiveness.

6. **Cut Recommended Memberships from this surface.** Three of ten lenses flagged it. Sanctuary is the private room; the room itself doesn't ask for money. Membership lives elsewhere.

7. **Asymmetric email cadence.** One Monthly Letter (opt-in by default). One Weekly Intention Prompt on Sunday (opt-in, not push). One Quiet Return note at the 30-day mark — never the 7-day mark. No streak-loss alarms. Ever. The email subject line for the 30-day return: *"a quiet stretch."* No body shame.

8. **Graceful exit — "Close the room."** Two states: *Pause* (snooze emails for 30/60/90 days) and *Close fully* (JSON export, then delete on confirm). No "are you sure?" 11-step modal. The voice playbook earns trust by letting people leave cleanly.

9. **One breathing gold dot as the signature motion.** Oak's breathing circle re-expressed in FRQNCY's palette. 6-second inhale/exhale, prefers-reduced-motion respected. Sits in the Today card. Becomes the one thing users can locate with their eyes closed.

10. **Anchor to a routine, not a clock.** Habit psych research is unanimous: routine cues beat time cues for automaticity (Keller 2021, replicated 2024). Don't say "every day at 7am." Say *"before email"* (Tim Ferriss's anchor; Calm's research). The Sanctuary's home-card copy should be a routine cue, not a timestamp.

## The next ten (after the ship-first)

11. **Tiny minimum-viable practice on every habit.** One breath counts as showing up. The "did I do it" button accepts any version — Fogg's Tiny Habits. Removes the "I don't have 20 minutes" friction.

12. **Daily Line from the curated book corpus.** FRQNCY can't acquire a celebrity teacher (violates the editorial frame). Replace with: one line from a different book each day, drawn from the existing 200+ book bed. Cormorant italic, attribution beneath. The voice of the canon, not a person.

13. **Weekly theme rotation across the 8 pillars.** 52-week theme corpus mapped to pillars (Curate / Education / Research / Media / Sell / Fund / Build / Network State). The week's theme softly shapes prompts in the Daily Intention input.

14. **The 11-day return surface.** A Cormorant mirror line ("It's been a quiet stretch.") + the user's last entry as a ghost-card. No counter. No shame. One soft "still the work?" affordance on the chief aim.

15. **Scene-based entry over surface-based entry.** Endel's pattern: pick a state (still / reset / arrive / drift), not a surface (tabs). Bigger UX departure — needs a separate roadmap discussion.

16. **Mood as glyph, not slider.** Reflectly's gradient slider is a measurement frame; replace with three Cormorant glyphs (▲ rising · ◇ still · ▽ heavy). Color stays neutral. No green/red.

17. **Day-2 aha: Illuminator pre-filled with a noun from the Chief Aim.** The day-2 click that returns the user on day-3. Uses the existing `#illuminate=<word>` deep-link — no new infrastructure.

18. **Sunday soft prompt.** Replace any thought of a weekly OKR check-in with a Sunday Cormorant line: *"what worked this week? what's still unfinished?"* Two textareas. No score.

19. **Exclusivity discipline.** Cormorant italic appears in only four positions: hero, Chief Aim vow-line, milestone Cormorants, empty-state prompts. Gold appears in only three meanings: invitations, acknowledgments, current state. Anywhere else dilutes both.

20. **Inline save chips replacing the top save indicator.** When the user edits a Goal far down the page, "Saved" should appear next to that input, not in the privacy banner 2400px above.

## Anti-patterns (do not ship)

- Duolingo's owl-shame notification ("you'll lose your streak!").
- Apple Watch ring red-state for missed days.
- Variable-reward animations (Reflectly's confetti, Headspace's clapping seal).
- Comparison surfaces — "users like you also wrote X."
- Algorithmic suggestions on Chief Aim ("based on your dream, you might want…"). Suggestions must be deterministic.
- Generic time-based push ("Time for your meditation!").
- Streak-loss alarms in any form.
- Public sharing rails — the Sanctuary is private by structural design.
- Paywalled features inside the Sanctuary. Per CLAUDE.md: the whole surface stays free in perpetuity.

## The single most-cited research signal

**Anchoring beats discipline.** Calm's internal research (cited by the meditation-anchor lens), the Keller 2021 routine-cue paper (habit psych), Tim Ferriss's pre-email airplane-mode (morning routine), and the Stoic morning-evening lock (commitment) all converge on one mechanism: *daily return is downstream of one named existing routine the practice attaches to.* Don't ask the user when. Ask them what they already do — and offer the Sanctuary as the thing that happens just before.

## Schema implications

The proposals collectively require these new state keys (all backwards-compatible — lazy-initialise on read per the Sanctuary CLAUDE.md convention):

- `state.firstSeenAt` — ISO datetime of first visit (gates progressive disclosure).
- `state.returnDays: string[]` — deduped array of ISO dates (counts visits, never consecutiveness).
- `state.dailyIntentions[date].cueIfThen` — the if-then cue from yesterday's evening review.
- `state.dailyIntentions[date].kept` / `.missed` / `.evening` — split fields for the three-line evening review.
- `state.weeklyReflections["YYYY-WW"]` — Sunday prompt entries.
- `state.emailPrefs: { monthly, weekly, returnNote }` — three independent toggles.
- `state.pausedUntil` / `state.closedAt` — exit states.

No new tables. No schema migration. Existing `LocalStore` + `SanctuaryCloudStore` write-the-whole-blob pattern absorbs all of them.

## Ship order

**This week:** #1 (Today card), #2 (vow framing), #4 (kill 🔥 chip), #6 (cut Recommended Memberships), #10 (routine cue copy). All five are one-day edits.

**Next week:** #3 (evening review), #5 (progressive disclosure), #9 (breathing gold dot), #20 (inline save chips).

**Following week:** #7 (email cadence), #8 (close-the-room), #14 (return surface).

**Backlog (real work):** #15 (scene-based entry), #18 (weekly Sunday prompt), #11–13 (tiny practice, Daily Line, theme rotation).

## Files
Each proposal lives at `proposals/SANCTUARY-DAILY-USE-<LENS>-2026-05-16.md`. Read individually for the full citation chain. This synthesis selects the convergent moves.
