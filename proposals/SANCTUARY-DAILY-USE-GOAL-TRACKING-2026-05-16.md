# Sanctuary daily-use goal tracking — proposal

_2026-05-16. Lens: a senior product designer who shipped Things 3's Today, Linear's cycle view, and the original Asana inbox. The question that organizes everything below: what does the Goal Pyramid look like when the user has thirty seconds, not thirty minutes?_

The Sanctuary already has the right pyramid — Dream, Chief Aims, Objectives, Goals, Daily Practice. It also already has the right Today panel: italic-Cormorant date, an intention prompt that doesn't demand anything, habit chips, this month's goals, yesterday's quiet reflection. What's missing is a clear answer to _how often, and for how long, the user is meant to be in here._ Today's note (`renderToday()` at line 2863) and the Goal Pyramid tab (line 1271) are two different rituals living in the same window. Most users will only ever spend thirty seconds. The design should reward that, not punish it.

## The research, briefly

Things 3's Today view is the canonical thirty-second surface in this category — open the app on the watch, see today's list, tap one thing complete, lock the watch. Cultured Code's _This Evening_ shelf is the move people remember: a soft second-half of the day separated from the morning by a horizontal rule and a small moon glyph, not by a deadline. The implicit message is that today is not a single block. Today is two slow halves.

Sunsama, picked by Wirecutter as the best scheduling app of 2025, made the opposite bet — a five-to-ten minute morning planning ritual and a hard shutdown at night. No gamification, no AI doing the choosing, warnings when you over-commit, explicit "stop working" affordance. Calm productivity, but only because the ritual is heavy enough to keep you honest.

Linear's cycle view sits between the two — issues, projects, cycles as the three primitives, and the cultural pattern of a single saved view called "What's blocking us right now?" reviewed at standup. The check-in is a question, not a form. (Linear team docs, 2026 guide.)

The OKR-app market — Mooncamp, Weekdone, Perdoo — gets cited everywhere as the cautionary tale. Weekly check-ins matter more than quarterly planning (Mooncamp's own OKR-mistakes essay says so), but their UI is built around the quarter. Users churn because the weekly form feels like a status report to a manager who isn't there. Weekdone hasn't shipped product updates since March 2023. The market is telling us: heavyweight check-in cadences die.

The new calm-productivity wave — Cron (now Notion Calendar), Amie, Reclaim — competes on cognitive-load reduction, not feature count. Reclaim auto-blocks habits onto your calendar. Amie fuses calendar + tasks + lifestyle signals into one soft surface. None of them ask "did you hit your KR this week?" — they ask "what do you want today to feel like?"

Then the philosophical layer that matters most for FRQNCY. Maia Duerr's _Living from Vow_ essay puts it cleanly: vows shape who you are moment-to-moment, goals shape what you accomplish. Omar Itani's _Intentions vs Goals_ makes the daily UX explicit — goals ask "did I accomplish X?", intentions ask "am I becoming who I want to be?". The bodhisattva-vow tradition has practitioners renew the vow every single morning, not as a status check, but as a re-orientation. The daily UX of vow is _restate, don't measure._

## 1. The 30-second pattern

Open the Sanctuary. Read the date in italic. See one chief aim presented as a sentence — not a score, not a percentage. Tap one habit chip to mark today done. Close the tab. That is the entire interaction.

The Today panel almost gets there. The drag is that it currently shows _all_ habits and _all_ this-month's goals as chip strips. With four habits and six goals, that's ten chips of cognitive load before the user has read anything. The 30-second pattern wants one chief aim, one habit, one tap. Surface what's most behind, or what was logged earliest in the user's morning pattern. The rest can live one scroll down.

## 2. The 5-minute pattern

Set today's intention as a sentence. Tap two or three habit chips. Glance at yesterday's reflection if there is one — and if there isn't, the prompt is a soft "What did yesterday serve?" rather than a form. Open one objective and read the goals under it; mark one done if it actually got done. Close.

Five minutes is the morning-coffee user. They want to feel oriented, not assigned. Sunsama's mistake is making this slot ten minutes minimum with timeboxing and email-triage; Things 3's win is making it optional. The Sanctuary should land closer to Things 3.

## 3. The 25-minute pattern

Open the Goal Pyramid tab. Edit a chief aim's name or score (the scoreboard at chiefAim.score is the only quantitative surface — keep it there). Add a new objective, draft three goals under it, attach a vision-board image. Write a longer reflection in yesterday's textarea. Re-read the dream statement at the top of the pyramid. Twenty-five minutes is the Sunday-morning user, not the Tuesday-morning user — and most weeks they won't show up. Design for them, but never demand them.

## 4. The weekly-review affordance — does the Sanctuary need one?

No. Not as a separate surface, and definitely not as a form.

The OKR-tool graveyard is full of weekly check-ins. Weekdone's weekly status report is exactly the artefact that made the category churn. The Sanctuary's weekly review should be _emergent_, not scheduled — a soft surface that appears on Sundays at the top of the dashboard saying "_Seven days ago, you wrote: 'serve before solving.' How did the week wear that?_" with a single textarea. Optional. No badge, no streak, no missed-week red. If you skip three Sundays, the prompt simply waits. This is the Things 3 _This Evening_ pattern applied to a week — a soft horizontal rule, not a column header.

The Goal Pyramid already supports the structural review (chiefAim.score.history is timestamped) — the user can see the arc. They don't need a wizard to walk them through it.

## 5. Chief-aims-as-vows vs OKRs-as-targets — the daily UX delta

This is the crux. An OKR's daily UX is _measurement_: open the dashboard, look at the percentage, log a "progress" note. The percentage is the affordance. A vow's daily UX is _restatement_: open the page, read the vow aloud (or in the head), close. The reading is the affordance.

Translation into the Sanctuary: the chief aim card on the dashboard should _display the chief-aim sentence in italic Cormorant, large, like a vow_ — not as a row with a progress bar. The scoreboard stays in the Goal Pyramid tab for users who want quantitative feedback (Hill's original "Definite Chief Aim" was a written statement reread daily, not a KR). But the daily face of a chief aim is its sentence.

This is also what differentiates the Sanctuary from every other goal-tracker on the market. Mooncamp, Weekdone, and every Notion goals template lead with the number. The Sanctuary should lead with the language.

## 6. Five-to-seven concrete proposals

**A. _Promote one chief aim to the Today panel, in italic._** Above the date, render the user's first chief aim (or the one most recently scored) as a single italic-Cormorant line. No score, no bar, no edit affordance — tap-to-edit opens the Pyramid tab. This is the 30-second hit.

**B. _Single-habit "morning chip."_** Below the intention input, surface one habit chip — the one the user logged earliest in the morning over the past 14 days, or the one they're least likely to log today by 9am. The other habits collapse behind a "+ N more" disclosure. Two-tap completion stays available; the visual weight changes.

**C. _Replace the goals chip-strip with a single "next undone goal" card._** This month's six goals become one card with the next undone goal's title and the objective + chief aim it serves, breadcrumb-style. "Goals" stays in the Pyramid tab. The dashboard shows direction, not inventory.

**D. _"This Evening" shelf._** Borrow the Things 3 move directly. After 5pm local, a soft horizontal rule appears below the Today card with a small glyph and the prompt "_What is this evening for?_" — a second intention textarea, separate from the morning. Same pattern as `dailyIntentions[today]` but a `.evening` key alongside `.intention` and `.reflection`. Most contemplatives have two slow halves; the app should know that.

**E. _Sunday soft-prompt, not weekly review._** On Sundays only, a single soft card at the top of the dashboard quotes the chief aim and asks how the week wore it. Optional textarea, persisted to a `weeklyReflections` map keyed `"YYYY-WW"`. No streak, no missed-week consequence. Skip three Sundays and it just waits.

**F. _Vow-reading affordance on the Pyramid tab._** Add a small "Read aloud" link beneath each chief aim — opens a focus mode where the chief-aim sentence fills the screen in large italic Cormorant for thirty seconds, then fades. This is the daily-renewal pattern from the bodhisattva tradition, designed in. No data captured; the act _is_ the data.

**G. _Quiet "what shifted?" replacement for KR scores._** Keep the existing `chiefAim.score` numeric history (it's already lightweight and traceable), but on the dashboard surface render score changes as language — "_You raised this aim from 6 to 8 last Tuesday_" — instead of a chart. The chart belongs in the Pyramid tab. The dashboard is where language lives.

---

## Summary (~100 words)

The Sanctuary's pyramid is right; its daily UX is undercooked. The 30-second pattern needs a single chief aim displayed as a vow-line, a single morning habit chip, and a single next-goal card — not the full habit-and-goals inventory the Today panel renders today. The 5-minute pattern keeps the intention prompt and yesterday's reflection. The 25-minute pattern lives in the Pyramid tab and is rare. Skip the weekly-review surface (OKR-tool graveyard); replace it with a Sunday soft prompt. Treat chief aims as vows that are reread, not OKRs that are scored. Seven concrete proposals attached.

Sources:
- [Things 3 Today + This Evening — Cultured Code support](https://culturedcode.com/things/support/articles/4001304/)
- [Things 3: Beauty and Delight in a Task Manager — MacStories](https://www.macstories.net/reviews/things-3-beauty-and-delight-in-a-task-manager/)
- [Sunsama Review 2025 — Productive with Chris](https://productivewithchris.com/tools/sunsama/)
- [Sunsama: A Therapist's Take — SaskADHD](https://saskadhd.com/sunsama-review-a-therapists-take-on-the-daily-planner-that-actually-works-with-your-brain/)
- [Linear App: Complete Guide for Software Teams (2026)](https://productivitystack.io/guides/linear-app-complete-guide/)
- [The 11 Most Common OKR Mistakes — Mooncamp](https://mooncamp.com/blog/okr-mistakes)
- [10 Best Weekdone Alternatives in 2026 — Mooncamp](https://mooncamp.com/blog/weekdone-alternatives)
- [26 Best Productivity Apps: 2026 Review — Reclaim](https://reclaim.ai/blog/productivity-apps)
- [Amie.so Review — AI Tech Story, May 2025](https://www.aitechstory.com/2025/05/30/amie-so-review-a-fresh-take-on-productivity-and-time-management/)
- [Living from Vow — Maia Duerr, The Practice of Life](https://maiaduerr.substack.com/p/living-from-vow)
- [Intentions vs Goals: Why One-Word Intentions Work Better — Omar Itani](https://www.omaritani.com/blog/goals-vs-one-word-intentions)
- [The Bodhisattva Vow: A Daily Practice — Mangala Shri Bhuti](https://mangalashribhuti.org/link/the-bodhisattva-vow-a-daily-practice-link-763/)
