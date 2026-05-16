# Sanctuary streak design — quiet milestones, never penalties

**Date:** 2026-05-16
**Surface:** `https://frqncy.network/my-frqncy/dashboard/` (file: `my-frqncy/dashboard/index.html`)
**Constraint set:** `proposals/SANCTUARY-ROADMAP.md` Principles + `my-frqncy/dashboard/CLAUDE.md` ("Streaks are quietly observed, never penalized. A skipped day resets the count silently.")
**Posture:** can the streak mechanic survive in a contemplative product without becoming a shame machine? Yes — but only if the count is removed from the daily surface and replaced with thresholds that fire once.

---

## 1. The streak mechanic has two failure modes

The streak is, as the UX literature now openly acknowledges, "the crown jewel of behavioural design" — and it works precisely because it weaponises Kahneman and Tversky's loss aversion: losing feels about twice as bad as the equivalent gain feels good. That asymmetry is the engine; it is also the failure mode.

**Failure mode A — shame on miss.** A 45-day meditation streak resets to zero after a single flu day, and the user reads the zero as a verdict on the previous six weeks. Apple Watch Activity Rings produced a documented backlash through 2024: users pacing the living room at 11:30pm to close rings before midnight, shaking wrists in class to earn stand hours, exercising on intended rest days. Apple's watchOS 11 response was to let users program rest days into the streak without breaking it, and to let goals vary by day — an explicit retreat from the original "uniform daily target or you lost it" frame. Headspace's own founder Andy Puddicombe published a public reminder that the run streak is "not about the number" and described a member who, at 1,500 days, deliberately broke the streak to prove he could.

**Failure mode B — addiction on hit.** Long streaks generate completion behaviour that has nothing to do with the underlying practice. Duolingo users have publicly reported tapping through a single one-question lesson during a flight's turbulence at 11:58pm; Sylvi (a competitor) explicitly markets itself as "Duolingo without the guilt." The 2025 academic literature on dark patterns in mobile design now lists "streak login" as a canonical example of temporal manipulation, and a 2025 global survey found 40% of teens voluntarily limiting smartphone use, citing the apps that "reward attention and punish absence" as the trigger.

A contemplative product cannot afford either failure mode. The first turns the Sanctuary into a guilt surface; the second turns it into a slot machine. Both betray the practice the surface exists to support.

## 2. Quiet-milestone design — fire only at thresholds, never as a counter

The design pattern that survives both failure modes is **quiet milestones**: the streak is computed, but the running count is not surfaced. Instead, the system fires a single soft acknowledgment when a meaningful threshold is crossed (7, 30, 90, 365), and goes silent again until the next one.

This is what `renderToday()` in `my-frqncy/dashboard/index.html` already does, partially. Lines 2897–2917 read the per-habit streak, walk a `STREAK_THRESHOLDS = [7, 30, 100, 365]` array, and emit one Cormorant-italic line per crossing — `30 days of meditation. Quiet, repeated devotion is the work.` — gated by a `streakMilestonesSeen` map so each threshold fires exactly once per habit. Cap at three visible at a time so the surface never feels noisy. This is good. The threshold ladder (7 / 30 / 100 / 365) is sound — it matches the temporal ladder humans actually use for practice ("a week", "a month", "a hundred days", "a year") rather than algorithmically convenient powers.

The problem is that the daily surface contradicts the milestone block. Line 2135 renders `🔥${streak}` on every habit chip whenever `streak > 0`. Line 2245 renders `streak ${streakFor(h.id)}` in the 30-day history row. So the user sees the count grow every day, feels loss aversion every day, and the gentle threshold copy becomes a fig leaf over a Duolingo-shaped engine. Quiet-milestone design only works if the count is genuinely absent from the daily eye-line.

The replacement vocabulary is **completion-shape, not count**. The 30-day grid at line 2247–2249 already does this well — it shows a row of cells, gold where done, faint where missed, no number — and the eye reads it as a texture, not a verdict. The same approach should extend to the chip: render the chip in its "done today" state (gold border, faint fill) and stop there. The fact that yesterday was also done is encoded in tomorrow's grid, not in today's badge.

## 3. How to encode "your 30th week of meditation" without ever penalizing a miss

The Sanctuary's `habitLogs` schema is already the right shape. Each entry is a sparse `{ "YYYY-MM-DD": { habitId: true } }` map — there is no notion of a "streak object" stored anywhere. The streak is a derived view, computed at render time by `streakFor(habitId)`. That separation is the single most important architectural decision already in the code: there is nothing to "break." A missed day is just a missing key. The count is recomputed each render. Loss is not persisted.

This means the milestone fire can be reframed from "consecutive days" to **lifetime-with-rhythm**. Concretely: instead of (or in addition to) "30 days in a row," compute "30 weeks in which this habit appeared at least three times" or "your 30th week of meditation." The data is already there — `Object.keys(state.habitLogs)` is the universe; group by ISO week, count weeks-with-≥3-hits, fire a milestone at 7 / 30 / 90 / 365 of those. A flu week with one session still counts. A two-week travel gap still leaves the long arc visible. The pattern reads "you have been at this for thirty weeks" without ever needing the user to have been perfect.

Headspace's framing is the model here: the milestone is a reminder that practice has accumulated, not a score for keeping a chain unbroken. Andy Puddicombe's "the benefit of meditation does not come from a number on the screen, neither does that number on the screen have the capacity to judge us" is the voice target.

## 4. Concrete proposals

**P1 — Remove the per-chip flame counter.** Delete the `🔥${streak}` span at line 2135. The chip's done-state is enough; the count is computed but no longer surfaced. Keep `streakFor()` because the milestone block depends on it.

**P2 — Replace "streak N" in the 30-day history with "N of 30 days."** Line 2245 currently reads `${hits}/30 days · streak ${streakFor(h.id)}`. Drop the streak segment. The grid is the texture; "23 of 30 days" is the only number that should appear, and it counts hits not consecutiveness, so a missed day is a faint cell, not a reset.

**P3 — Add a "weeks-with-rhythm" milestone ladder alongside the day ladder.** Compute `weeksWithAtLeastThreeHits(habitId)`; fire a separate milestone line at 7 / 30 / 90 / 365 of those. Copy: `Your thirtieth week of meditation. The practice has a shape now.` This is the long-arc surface — robust to single missed days, to weeks of illness, to travel.

**P4 — Never write the word "streak" in user-facing copy.** Internal variable names stay (`streakFor`, `streakMilestonesSeen`) — those are mechanical. But the surface vocabulary becomes `days`, `weeks`, `rhythm`, `the shape of the practice`. The word "streak" carries the Duolingo affordance; the Sanctuary doesn't need it.

**P5 — Add a "rest day" annotation, not a "freeze."** Long-pressing a day cell in the 30-day grid lets the user mark it `rest` (a third state alongside done / missed). Rest days don't count as hits, but they don't read as misses either — render them in a neutral tone, distinct from the faint "missed" cell. Apple's watchOS 11 retreat is the precedent; Duolingo's Streak Freeze is the anti-precedent (it monetises anxiety by selling forgiveness).

**P6 — Milestone copy is one Cormorant-italic line; no emoji, no exclamation.** The existing `✦` glyph + Cormorant treatment at line 2916 is correct. Lock the form: one threshold, one line, one dismiss button, gold-light accent, no animation beyond fade-in. A milestone that arrives loudly contradicts what it is celebrating.

**P7 — Surface the year-arc instead of the day-arc as the primary view.** The 30-day grid is fine; it's a small mirror. But the dominant practice-history view should be a year of weeks (52 cells), gold-tinted by rhythm-density per week. The 30-day grid says "have you been doing this lately?" The year grid says "what is the shape of your year?" — and the second question is the one the Sanctuary is for.

## 5. Data schema implication

The Sanctuary's `habitLogs` already supports all seven proposals without migration. The schema is `{ "YYYY-MM-DD": { habitId: true } }`. P5 (rest days) is the only change that needs a value beyond `true` — switch to `{ habitId: 'done' | 'rest' }` and have `streakFor()` and the new `weeksWithAtLeastThreeHits()` treat them appropriately. Existing entries (boolean `true`) are read as `'done'` via a coerce-on-read shim, per the lazy-init convention in `dashboard/CLAUDE.md`. No table changes; the Supabase row is still one JSON blob keyed `name='Sanctuary'`. P3's weekly-rhythm count is fully derived — no new persisted field. P6 and P7 are render-only. `streakMilestonesSeen` already namespaces by `${habitId}-${threshold}` so adding a weekly ladder is just a different key prefix, e.g. `${habitId}-w${threshold}`.

The architectural lesson is the one the code already encodes: **don't persist the count.** Compute it. A missed day cannot break what was never stored. That is the deepest answer to the shame question, and it is already true of this codebase. The remaining work is to make the surface match the schema's quiet honesty.

---

## Sources

- [The Psychology of Hot Streak Game Design: How to Keep Players Coming Back Every Day Without Shame (UX Magazine)](https://uxmag.com/articles/the-psychology-of-hot-streak-game-design-how-to-keep-players-coming-back-every-day-without-shame)
- [Designing streaks for long-term user growth (Mind The Product)](https://www.mindtheproduct.com/designing-streaks-for-long-term-user-growth/)
- [Your Headspace run streak — it's not about the number (Headspace, Andy Puddicombe)](https://www.headspace.com/articles/building-a-meditation-practice)
- [Improving the streak: Forming habits one lesson at a time (Duolingo Blog)](https://blog.duolingo.com/improving-the-streak/)
- [Finally, Apple Watch Will Let You Pause Activity Rings (HowToGeek, watchOS 11)](https://www.howtogeek.com/watchos-11-reveal-wwdc-2024/)
- [Dozens of people on TikTok are ditching their Apple Watches (Fortune Well, Jan 2025)](https://fortune.com/well/2025/01/24/apple-watch-bullied-burn-calories-close-rings-obsession-fitness-trackers-notifications/)
- [The Psychology of Streaks: How Sylvi Weaponized Duolingo's Best Feature Against Them (Trophy)](https://trophy.so/blog/the-psychology-of-streaks-how-sylvi-weaponized-duolingos-best-feature-against-them)
- [Local Legends (Strava) — consistency tier, not speed tier](https://www.strava.com/local-legends)
- [Habitica vs Streaks Habit Tracker — Habitica's no-streak RPG model (Daily Habits)](https://www.dailyhabits.xyz/habit-tracker-app/habitica-vs-streaks)
- [Level Up or Game Over: Exploring How Dark Patterns Shape Mobile Games (arXiv 2412.05039, Dec 2024)](https://arxiv.org/html/2412.05039v1)
- [Winning at What Cost?: The Psychology of Gamification (HEAD Foundation, Sep 2025)](https://digest.headfoundation.org/2025/09/21/winning-at-what-cost-the-psychology-of-gamification-and-the-fight-for-our-focus/)
- [Zazen Meditation App: A Quiet Timer for Silent Sitting Without Pressure (Gassho)](https://gassho.info/blog-page/zazen-meditation-app/)
