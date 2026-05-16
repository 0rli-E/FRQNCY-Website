# Sanctuary — daily use, first 90 days

Draft · 2026-05-16

The Sanctuary is the private contemplative dashboard at `/my-frqncy/dashboard/`. As of today it loads with a 4-layer pyramid (Dream → Chief Aim → Objective → Daily Practice), a first-run coaching panel, a scoreboard, a today's-practice strip, the Word Illuminator card, and a memberships block — all visible the moment a signed-in user lands. That is kitchen-sink onboarding. This proposal narrows the entry door, then opens the rest of the room over the first ninety days as a function of *use*, not of time.

## Why the first ninety days matter

Day-7 retention is the strongest leading indicator of long-term cohort survival. The "7% rule" puts a product in the top quartile if 7% of an original cohort returns on day seven; AppsFlyer's 2024 cross-vertical benchmark sits at 24% D1 / 12% D7 / ~5% D30, and Headspace's own work showed that ten consecutive logins is the rough threshold at which a meditation habit calcifies. Behind those numbers sits a small set of repeatable design patterns: Headspace's pre-commitment ("10 days for 10 minutes"), Notion's segment-then-template progressive disclosure, Reflectly's learn-by-doing mood-check first action, Day One's "On This Day" reactivation hook that gets its power only after a year of entries exists, Substack's first-post-or-bust funnel for writers. The Sanctuary should borrow the *shape* of these — pre-commitment, learn-by-doing, segmented surface, memory hook, single first action — without their gamification, comparison, or streak-shame, all of which the Sanctuary CLAUDE.md explicitly forbids.

## Day 0 — what loads on first visit

Today: the dashboard view shows hero + first-run panel + scoreboard placeholder + today's-practice placeholder + pyramid mini + Illuminator card + memberships grid. That is seven surfaces competing for the first thirty seconds.

Proposed: collapse to **one surface, one prompt, one action**. The hero stays. Below it, a single full-width contemplative card — *"Before the room opens, name the one thing."* — with a single text field asking for the Dream. Nothing else. No scoreboard, no pyramid, no memberships, no Illuminator card. The tabs strip still exists (the user can escape into any view at any time) but the default landing view holds one question.

This is Headspace's pre-commitment move adapted: instead of "10 days for 10 minutes," it's "one sentence before the room opens." The Sanctuary's value proposition is *holding* a life, not *optimising* it; the first action should rehearse holding, not configuring. Once the user types and saves, the card collapses and reveals the second prompt — the first Chief Aim. After that, the Daily Practice prompt — pick one habit glyph from the palette and name it. Three prompts, one at a time, each one revealing the next. The pyramid view is *reachable* via tab `2` from second zero, but it is not the default home.

This is also Reflectly's pattern — the app's first screen is a mood check, not a feature tour. The Sanctuary's equivalent is the Dream sentence.

## Days 1–7 — what unlocks, and why

By the end of day 0 the user has a Dream, a Chief Aim, and one habit. The dashboard's default home from day 1 onward becomes **Today's Practice + Dream banner**. The pyramid mini, the scoreboard, the Illuminator card, and memberships all stay reachable through tabs but do not render on the home view yet.

Each return visit (defined as opening the dashboard on a calendar day after the previous open) unlocks one new surface:

- **Day 2 return:** the *Word Illuminator card* appears on the home view, gold-bordered, with the prompt *"A word you're sitting with today?"* pre-filled with the user's Chief Aim's noun. This is the day-2 aha click (more on this below).
- **Day 3 return:** the *Daily Intention* field appears above Today's Practice — a single Cormorant-italic input, "*Today, I'm holding…*", saved to `state.dailyIntentions[YYYY-MM-DD].intention`. Reflection field stays hidden.
- **Day 5 return:** the *Objective* layer of the pyramid mini renders on the home view (previously hidden), with a single prompt to add the first 1–6 month milestone under the Chief Aim. The pyramid view itself was always accessible — this just lifts it onto the home.
- **Day 7 return:** the *evening Reflection* field appears next to the morning Intention (`state.dailyIntentions[YYYY-MM-DD].reflection`). The home view now contains: Dream banner, Intention, Today's Practice, Reflection, Pyramid mini, Illuminator. Roughly the present home minus memberships and scoreboard.

The unlocks are silent. No "Day 3 unlocked!" toast. The new surface simply renders. The voice playbook forbids triumphalist language; the right tone is *the room got bigger because you came back*. Same logic as Notion's dynamically-updating UI based on user choices — the interface reflects the user's accumulation, doesn't announce it.

## Day 30 milestone — Scoreboard and Goals

The Scoreboard (numeric chief-aim scores, current/target, history) is structurally a *measurement* surface — it asks the user to put numbers on their life. Showing it on day 0 frames the Sanctuary as a productivity dashboard, which it is not. Defer it: the Scoreboard surface unlocks on **day 30** (or first return after the 30th distinct day-of-use, whichever comes first), with an invitation framed as *"After a month of holding the aim, you may want to put a number on it. Optional, always."*

The Monthly Goals layer of the pyramid (the bottom row, individual goals under each objective) unlocks at the same moment. Until day 30 the pyramid shows Dream → Chief Aim → Objective only; goals appear day 30 once the user has shown the habit of returning.

## Day 90 milestone — the memory hook

Day One's "On This Day" feature is the canonical example of a reactivation hook that only earns its power once history exists. The Sanctuary should mirror this. On **day 90** (or first return after 90 distinct days of use), a new surface appears on the home view: **"What you wrote three months ago"** — pulling the Dream as originally entered, the Intention from the user's first week, and the first habit they named. It is read-only, contemplative, framed in Cormorant italics. It does not run on day 1 because there's nothing to show; running it on day 90 surfaces the user's own past self at the exact point where the Headspace data shows habits either calcify or die.

The same surface, on every subsequent visit, rotates: 90 days ago, 180 days ago, 365 days ago, etc. — the Sanctuary's version of "On This Day," built on the existing `dailyIntentions` and habit-log data already in state.

## The day-2 aha moment

The single click that determines whether the user comes back on day 3 is — proposed — the **Word Illuminator on a noun from their own Chief Aim**. Day 0 they wrote *"To build a school for my children that teaches them to think."* Day 2 they return and the Illuminator card is pre-filled with `school` or `think` — whichever noun the (deterministic, rule-based) extractor picks. They click it. The Illuminator opens and writes 400 words of etymology + cross-tradition framing + a question back. The user reads it. They have just been given a piece of writing *about their own aim*, which no other app on their phone is doing. That is the day-2 aha.

This is the Sanctuary's equivalent of Substack's first-post moment or Notion's first-template-applied moment — the first time the surface produced something the user couldn't have produced themselves. It uses existing infrastructure (the Illuminator panel, the deep-link convention `#illuminate=<word>`) — no new API, no new model call beyond what already runs.

## Seven concrete proposals

1. **Collapse the day-0 home view to a single prompt.** Replace the current `view-dashboard` initial render with a three-step inline wizard (Dream → Aim → first habit), each step revealing the next on save. The current first-run panel is closer than the rest of the home but still presents four options at once; narrow it to one at a time.
2. **Hide Scoreboard, Memberships, full Pyramid until day 30 / day 5 / day 30 respectively.** Add a `state.firstSeenAt` ISO date field, lazy-initialised on first save, and gate render functions on `daysSinceFirstSeen(state)`.
3. **Add the day-2 Illuminator pre-fill.** Deterministic noun extractor on the user's Chief Aim string; populate the Illuminator card's "ask about a word" prompt with that noun on every return visit until clicked once.
4. **Add the daily Intention field on day 3, the Reflection field on day 7.** Both write to the existing `dailyIntentions` state shape — no schema change needed beyond lazy-init.
5. **Add the "What you wrote three months ago" surface on day 90.** Reads from existing state. Cormorant italic, read-only, rotating window.
6. **Replace the kbd-tip "press 1–5 to jump tabs" with progressive tab labels.** Tabs the user has not yet earned access to via use stay visible but render in `--text-faint`, slightly dimmed; tooltip reads "Opens after you've been here a few days." This is Notion's "show what's possible, don't force the door" pattern — the user can still click them.
7. **Track `state.returnDays` as a deduped array of `YYYY-MM-DD` strings, persisted.** This is the substrate every unlock depends on. Increments once per calendar day on first dashboard render. No streak penalty for gaps — a user who returns on day 30 after a 20-day absence still has 11 entries in `returnDays`, and unlocks fire on count, not consecutiveness. This holds the CLAUDE.md rule that streaks are quietly observed, never penalised.

## What this does not change

The Pyramid view, Practice view, Progress view, and Vision view all stay reachable from second zero via the tabs strip. A user who wants the full kitchen-sink can have it — the change is to the *home view's default density*, not to any user's ceiling. Nothing in this proposal adds gamification, comparison, paywalls, or third-party integration; it only sequences what is already there.

---

## 100-word summary

The Sanctuary's home view today renders seven surfaces at once. Borrowing from Headspace's pre-commitment, Notion's progressive disclosure, Reflectly's single-action onboarding, and Day One's "On This Day" reactivation hook, this proposal collapses day-0 to one prompt (the Dream), then unlocks one surface per return-day through day 7 (Illuminator pre-filled with the user's own noun, Daily Intention, Objective layer, evening Reflection). Scoreboard and Monthly Goals defer to day 30. A "What you wrote three months ago" surface lights up on day 90. The day-2 aha is the Illuminator writing back about the user's own Chief Aim.

---

## Sources

- AppsFlyer — *App marketing benchmarks*, 2024 edition. https://www.appsflyer.com/benchmarks/faq/
- Adjust — D1/D7/D30 cross-vertical retention averages 2024. https://www.adjust.com/
- Amplitude — *The 7% Retention Rule*. https://amplitude.com/blog/7-percent-retention-rule
- Retention.blog — *Deep Dive into Activation and Retention* (three-moments framework). https://www.retention.blog/p/deep-dive-into-activation-and-retention
- HowTheyGrow — *How Headspace Grows: The Monk Who Built a $3B Meditation App*. https://www.howtheygrow.co/p/how-headspace-grows-the-monk-who
- Irrational Labs — *How We Doubled Headspace Course Starts*. https://irrationallabs.com/case-studies/headspace-doubled-course-starts/
- Appcues GoodUX — *Notion's clever onboarding and inspirational templates*. https://goodux.appcues.com/blog/notions-lightweight-onboarding
- Candu — *How Notion Crafts a Personalized Onboarding Experience*. https://www.candu.ai/blog/how-notion-crafts-a-personalized-onboarding-experience-6-lessons-to-guide-new-users
- PageFlows — *Onboarding on Reflectly*. https://pageflows.com/post/ios/onboarding/reflectly/
- Day One — *On This Day*. https://dayoneapp.com/features/on-this-day/
- Substack — *Setting up your Substack for the first time*. https://on.substack.com/p/start-basics
- Plotline — *Streaks and Milestones for Gamification in Mobile Apps*. https://www.plotline.so/blog/streaks-for-gamification-in-mobile-apps
- Chameleon — *How to find your product's "Aha" moment*. https://www.chameleon.io/blog/successful-user-onboarding
