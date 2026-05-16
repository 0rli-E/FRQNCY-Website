# Sanctuary — Daily-Use Habit Psychology

**Author:** Behavioral-design researcher (Fogg / Clear / Wood / Duhigg lineage)
**Date:** 2026-05-16
**Surface:** `/my-frqncy/dashboard/` — the Sanctuary
**Question:** What shippable, science-grounded patterns turn the Sanctuary into a day-30 / day-90 / day-365 return surface *without* gamification, leaderboards, or streak-shame?

**Companion docs:** `proposals/SANCTUARY-DAILY-FLOW-2026-05-16.md` (product design), `proposals/FRQNCY-VOICE-PLAYBOOK.md` (voice constraints), `my-frqncy/dashboard/CLAUDE.md` (engineering rules).

---

## The frame

A contemplative user is not a productivity user. They do not return for points, badges, or rank — they return because the surface meets them where they are, makes the next breath of practice trivially small, and never punishes them for being human. The science is unambiguous: habits form through stable context cues, friction reduction, and identity-level rewards — not through extrinsic gamification, which the 2024 literature now confirms erodes intrinsic motivation in exactly the populations a Sanctuary serves. What follows is six concrete, shippable design moves grounded in current (2024–2026) research, each with citation, mechanism, and a one-sentence build instruction for `my-frqncy/dashboard/index.html`.

---

## 1. Anchor the Sanctuary to an existing routine, not to a time of day

**Source.** Keller et al., *Habit formation following routine-based versus time-based cue planning* (RCT, British Journal of Health Psychology, 2021; replicated in the 2024 systematic review on mobile habit-formation apps, *JMIR* / ResearchGate). Routine-based cues produced significantly higher automaticity than time-based reminders, which "engage deliberate decision-making and may impair learning."

**Mechanism.** Wendy Wood's work shows ~43% of daily behavior runs on context cues — physical location, preceding action, time-of-day-as-context, people present. A time-of-day notification ("9pm: reflect") demands a cognitive decision every night; an anchor to an existing action ("After I put my phone on the charger, I open the Sanctuary") rides automaticity already present in the user's day. Fogg calls this the *Anchor* in his ABC recipe: *After I [existing routine], I will [tiny new behavior].*

**What to ship in `index.html`:** On first run, after the user names their first practice, surface one prompt — "What's already true about your morning?" — with four taps (after coffee · after phone-off-airplane-mode · after the kids leave · after I sit down at the desk) and a free-text option; persist as `state.settings.anchorPhrase` and render it as the morning card's subheader in Cormorant italic: *"After your coffee. Today's practice."*

---

## 2. Make the minimum viable behavior smaller than the user proposed

**Source.** Fogg, *Tiny Habits* (the "starter step" doctrine, restated in his 2024–2025 talks); Clear, *Atomic Habits* (the Two-Minute Rule — "scale any new habit down to something that takes just two minutes to start"). The 2024 *JMIR* systematic review on dedicated habit apps found "minimum viable behavior" framings produced the strongest day-30 retention across 11 RCTs.

**Mechanism.** Behavior happens when motivation, ability, and prompt converge (the Fogg Behavior Model). Motivation oscillates wildly day-to-day; ability is the lever a designer can actually pull. A 10-minute sit is impossible on a hard day. A *one-breath* sit is never impossible. The point isn't that one breath equals ten minutes — it's that the one-breath version preserves the *identity*: "I am someone who sits." Identity is the rewardable substrate; duration is negotiable.

**What to ship in `index.html`:** Every practice in `state.habits` gets a `tinyVersion` field (auto-generated on creation: "Sit 10 min" → "One conscious breath"; "Walk 20 min" → "Step outside, three breaths"; user-editable). The morning card's primary CTA reads the full practice; a faint secondary line under it reads *"Or just: one conscious breath."* Tapping either marks complete with the same weight. Both count as showing up.

---

## 3. Replace the streak counter with a "shape of the month" — observation, not score

**Source.** UX Magazine, *The Psychology of Hot Streak Game Design* (2024); the documented Duolingo streak-shame backlash (Lego product director's 9-year-old receiving "How do you say quitter in Spanish?" — Design Buddy, May 2024; deceptive.design's Duolingo dossier). The 2024 *Behavioral Scientist* interview with Wendy Wood explicitly warns that extrinsic metrics "displace the intrinsic context cues that actually carry the habit."

**Mechanism.** Streak counters work via loss aversion — you return to avoid losing the number. This builds *anxiety-driven* return, not devotional return; when the number breaks, the user often abandons the practice entirely because the identity was tied to the count, not the act. Contemplative practice cannot afford that fragility. The replacement is *rhythmic observation*: Apple Health's activity rings, Insight Timer's lifetime-meditation-minutes (which posted 16% day-30 retention vs. Calm/Headspace's <8.5% in 2024 benchmarks — partly because it surfaces accumulation without ranking it).

**What to ship in `index.html`:** Kill the `🔥30` chip badge on habits. Replace it with the week ribbon already specified in `SANCTUARY-DAILY-FLOW-2026-05-16.md` §4.1 — seven hollow/filled dots, no counter, no percentage. At thresholds (7/30/90/365 days of *any* return — not unbroken), surface ONE Cormorant line on the morning card: *"Thirty mornings, returned to. Quiet, repeated devotion is the work."* When the rhythm breaks, the line stops appearing. Nothing turns red. Nothing breaks.

---

## 4. Close the loop with intrinsic reward, not extrinsic celebration

**Source.** Duhigg's cue → routine → reward loop (*The Power of Habit*, 2024 podcast restatements emphasizing reward must be *felt*, not awarded); Fogg's "instant celebration" ABC step, but with the 2024 refinement (Tiny Habits podcast, Jordan Harbinger): the celebration must be *self-generated*, not surface-rendered, or it becomes contingent on the app.

**Mechanism.** The reward step is where the brain decides whether to repeat the loop. Extrinsic rewards (XP, confetti, badges) work short-term but, per Duolingo's own 2024 redesign that *removed* lesson-completion celebrations, they convert practice into performance. The contemplative equivalent is *witnessed silence*: a soft acknowledgment that the user did the thing, paired with a moment of reflection that lets the user generate their own felt sense of why it mattered.

**What to ship in `index.html`:** On habit completion, render the existing `✦ Saved` chip inline, add `navigator.vibrate(8)` for soft haptic, and — only on the first completion of the day — surface ONE Cormorant prompt below the chip strip: *"What did that serve?"* with a one-line input. Saving the input shows `✦ Held.` and fades. Not saving is also fine. The prompt does not nag, does not appear again that day, does not generate a notification. The reflection is the reward.

---

## 5. Reduce friction at the entry point — one tap from "intent to practice" to "in practice"

**Source.** Clear, *Atomic Habits* (Law 3 — Make It Easy; the "reset the room" essay on environment design as friction reduction); the 2024 ResearchGate review *Beyond Self-Tracking and Reminders* — apps that reduced steps-to-first-action by 50% saw 2.3× day-30 automaticity scores; Headspace's documented "breathing in 30 seconds" design heuristic.

**Mechanism.** Every tap between intention and action is a place where motivation can collapse. The Sanctuary today opens to a five-tab strip, a hero, a privacy banner, and a Scoreboard. A user who arrives at 7am with eight seconds of willingness has to find their practice before they can start it. The friction is enough to lose the visit.

**What to ship in `index.html`:** On dashboard load, if `state.habits.length > 0` and no habit has been completed today, the morning card's primary CTA *is* the day's practice — named, sized to thumb-tap, above all other content. No tabs, no scoreboard, no banner above it. If the practice is a meditation, tapping it starts an inline timer in the same card (no navigation, no modal). The intent-to-practice path is one tap, on first paint, every time.

---

## 6. Honor the gap — gap detection as care, not as recovery

**Source.** The 2024 *Beyond Self-Tracking and Reminders* paper explicitly frames "absence acknowledgment without penalty" as a habit-strength predictor; the Streaks app's 2024 redesign added gap-naming language ("welcome back" rather than "streak lost"); Wood's 2024 *Annual Review* article on habit disruption — context disruption is *information*, not failure, and apps that name disruption neutrally produce higher post-gap re-engagement than apps that punish.

**Mechanism.** The 8-day return is the highest-stakes moment in any daily-use app. Three outcomes are possible: (a) the user is shamed and never returns; (b) the user is ignored and feels the app didn't notice — and never returns; (c) the user is met with neutral acknowledgment plus a soft re-entry path — and returns. The contemplative frame requires (c) by default. The gap is data about the user's life, not data about their failure.

**What to ship in `index.html`:** Implement the Soft Welcome-Back from `SANCTUARY-DAILY-FLOW-2026-05-16.md` §3.1 verbatim — on any return after a gap ≥ 4 days, the morning card opens with one Cormorant line naming the gap neutrally (*"Eight days since you were last here. Welcome back."*), one read-only card showing what last-they was working on, and the regular intention input prefilled with their last intention as ghost text. No flame. No "streak broken." No make-up prompt.

---

## What NOT to do — the patterns proven to backfire

These are not stylistic preferences. Each one is a documented failure mode in 2024–2026 research and product writing.

**Never ship a streak counter that punishes the break.** Duolingo's "How do you say quitter in Spanish?" became a case study in deceptive design (deceptive.design, 2024). The "sad Duo" icon update drove engagement *and* documented user reports of guilt and avoidance. Loss-aversion mechanics work — they just produce the wrong user.

**Never gamify with XP, points, levels, or leaderboards.** Hamari et al.'s meta-analyses through 2024 confirm gamification produces short-term lift and long-term intrinsic-motivation erosion in self-development contexts. The Sanctuary's user does not want to be ranked against themselves or anyone else.

**Never use variable rewards (Eyal's "hook" model) on a contemplative surface.** Eyal himself walked this back in *Indistractable* (2019, updated 2024): variable reinforcement is the engine of social-media compulsion, not devotional practice. The Sanctuary's reward is *consistent and quiet*, not unpredictable.

**Never use time-based push notifications as the primary cue.** Routine-based cues outperform time-based cues for automaticity (Keller 2021, replicated 2024). Notifications also build dependence on the app rather than on the user's own life rhythm — the inverse of what a Sanctuary is for.

**Never surface a "you missed yesterday" red state.** Color semantics matter: red = error in every UI convention; on a devotional surface, red converts a gap into a failure. Gold for acknowledgment, faint ink for absence, never red.

**Never auto-suggest practices algorithmically.** The CLAUDE.md rule is non-negotiable: "suggestions must be deterministic and traceable." Algorithmic recommendation on a contemplative surface also displaces the user's own discernment, which is the whole point.

---

## Summary of severity by ship order

**Ship first (highest impact, science-strongest):** §1 anchor phrase · §2 tiny version of every practice · §5 one-tap-from-load to practice. These are the three moves the 2024 literature consistently ranks above all others for day-30 retention without extrinsic motivation.

**Ship next:** §3 week ribbon replacing streak chip · §6 Soft Welcome-Back (already specced in companion doc).

**Ship later:** §4 *"What did that serve?"* prompt on first completion of day — requires careful copy work and one round of user testing before generalizing.

---

*Slogan that governs the work: a contemplative habit is one the user keeps even when the app stops nudging. Design for the day the notifications are off and the user still opens the door.*

---

## Sources

- Fogg, BJ. *Tiny Habits: The Small Changes That Change Everything.* (2020, talks through 2025.) [tinyhabits.com](https://tinyhabits.com/) · [behaviormodel.org](https://www.behaviormodel.org/)
- Clear, James. *Atomic Habits.* Two-Minute Rule, environment design, friction reduction. [jamesclear.com/reset-the-room](https://jamesclear.com/reset-the-room)
- Wood, Wendy. *Good Habits, Bad Habits* (2019). 2024 *Annual Review of Psychology* article on habits, goals, and behavior change. [Behavioral Scientist interview](https://behavioralscientist.org/good-habits-bad-habits-a-conversation-with-wendy-wood/) · [APA Monitor profile](https://www.apa.org/monitor/2026/01-02/wendy-wood-habits-behavior-change)
- Duhigg, Charles. *The Power of Habit.* Cue → routine → reward loop, 2024 podcast restatements. [Tougher Minds 2024 summary](https://www.tougherminds.co.uk/2024/08/27/understanding-the-habit-loop-cue-routine-reward/)
- Keller, J. et al. *Habit formation following routine-based versus time-based cue planning: A randomized controlled trial.* British Journal of Health Psychology, 2021. [Wiley](https://bpspsychub.onlinelibrary.wiley.com/doi/10.1111/bjhp.12504)
- *The Impact of Dedicated Mobile Apps on Habit Formation: A Systematic Review* (2024). [ResearchGate](https://www.researchgate.net/publication/391233961_The_Impact_of_Dedicated_Mobile_Apps_on_Habit_Formation_A_Systematic_Review)
- *Digital Behavior Change Intervention Designs for Habit Formation: Systematic Review* (PMC, 2024). [PMC11161714](https://pmc.ncbi.nlm.nih.gov/articles/PMC11161714/)
- *Beyond Self-Tracking and Reminders: Designing Smartphone Apps That Support Habit Formation.* [ResearchGate](https://www.researchgate.net/publication/278405715)
- UX Magazine. *The Psychology of Hot Streak Game Design: How to Keep Players Coming Back Every Day Without Shame* (2024). [uxmag.com](https://uxmag.com/articles/the-psychology-of-hot-streak-game-design-how-to-keep-players-coming-back-every-day-without-shame)
- Design Buddy. *Is Duolingo unethical?* (May 2024). [designbuddy.substack.com](https://designbuddy.substack.com/p/is-duolingo-unethical)
- deceptive.design. *Featured Brands — Duolingo.* [deceptive.design/brands/duolingo](https://www.deceptive.design/brands/duolingo)
- Eyal, Nir. *Hooked* (2014) and *Indistractable* (2019, updated 2024) on ethical limits of variable reward. [Axbom critique](https://axbom.com/nir-eyal-habit-danger/)
- *App Retention Benchmarks 2026.* Insight Timer 16% day-30 vs. Calm/Headspace <8.5%. [enable3.io](https://enable3.io/blog/app-retention-benchmarks-2025)
