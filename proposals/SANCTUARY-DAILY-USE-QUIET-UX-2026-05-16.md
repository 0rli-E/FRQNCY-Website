# Sanctuary — Daily Use, Quiet UX

*Author: visual + interaction design proposal, 2026-05-16. Lens: Oak, Endel, Things 3, Bear, Stoic, calm-tech canon.*

Source under review: `my-frqncy/dashboard/index.html`. Voice constraint: `proposals/FRQNCY-VOICE-PLAYBOOK.md`. Pillar constraint: no gamification, no comparison, no algorithmic recommendation, no penalty colour.

---

## 1. The "memorable but quiet" tension — how peer apps resolve it

The problem every contemplative app eventually meets: stillness reads as forgettable. If the surface does nothing, the user does nothing, and the habit dies inside a week. The interesting apps don't solve this by getting louder. They solve it by giving the user **one small, repeatable, sensorially specific moment** that the rest of their phone can't imitate.

Oak resolves it by **removing the library**. Kevin Rose's framing — "graduate to app-free meditation" — means the daily opening isn't a content choice; it's a configured session bell. Three taps, the timer runs, you sit. The app is a tool, not a destination, and the memorability comes from a single recognisable visual (the breathing circle) and the sense that opening it costs nothing. Users return because the act is identical every time. Sameness becomes the signature.

Endel resolves it by **scenes, not content**. You don't pick a track; you pick a state — Focus, Sleep, Anxiety Relief, Chill. The interface offers a context, then the soundscape is generated underneath. This collapses the cognitive cost of daily entry into one decision the user already made before opening the app. The visual is dim, the motion is slow, but the entry is decisive.

Things 3 resolves it by **a piece of paper**. Cultured Code's Today view, the smooth transform of an opened to-do into "a clear white piece of paper" — this is the entire design. No streaks, no badges, no overdue red. The app is opened daily because it owns *one* posture (laying out the day) and refuses everything else. Restraint becomes recognisable.

Bear resolves it by **the cursor**. The custom Bear Sans typeface, the hidden markdown, the red-and-white whisper of theme — these exist so that the cursor blinking on a blank page feels like a private studio. The memorability is somatic: typing in Bear *feels* a particular way, and other writing apps don't.

The pattern across all four: **one signature moment, ritualised through repetition, with everything competing for attention stripped out.** Memorability does not come from more — it comes from a single thing the user can locate with their eyes closed.

## 2. Typography, single-line copy, held-back animation

Calm apps that last share three typographic moves.

**A serif (or a humanist sans) for emotional content, a precise sans for operational chrome.** Bear pairs Bear Sans (custom Clarika derivative) with monospace code blocks. iA Writer uses three custom display fonts, all designed for "writing distances." Oak uses a single light geometric sans throughout. The Sanctuary already has the better pairing: **Cormorant for what's meant to land softly, Jost for what the user needs to do**. That split is doing real work and should be defended.

**Single-line copy.** The voice playbook already says present tense, declarative, no spiritual cliché. The visual corollary is: one line, one idea. Stoic's daily prompt is one question. Endel's scenario card is one verb. Things 3's overdue badge is "3d," not "3 days overdue." Single-line copy reads as confident; multi-line copy reads as anxious. The Sanctuary's current italic-Cormorant date line is exactly right — extend the rule, not the words.

**Held-back animation.** Calm-tech canon (Case, principle 3 — *use the periphery*) treats motion as something that earns attention. Most meditation apps over-animate the home screen because the designer is afraid of stillness. The peer apps refuse this: Oak's breathing circle is one shape easing slowly; Things 3's checkbox is a 200ms checkmark and a paper-fold transform; Bear has almost no motion at all. The Sanctuary's current radial gradient on the Today card is the correct ceiling. Anything more than a soft fade, a 200–300ms ease, or a single living element (a slow gold dot, a tide-like gradient) reads as a notification, not a sanctuary.

## 3. Sound design (or its absence) for daily-open moments

Three positions are defensible; the in-between is not.

**Position one: silence by default.** Things 3, Bear, Roots. The opening makes no sound. The user's environment supplies the audio. This is the safest position for any app that opens during meetings, in bed, or in public.

**Position two: a single hand-made sound.** Oak's bells (start, interval, end) — recorded, not synthesised. Stoic's chime. These exist because the daily ritual *is* the sound; the app's job is to deliver it cleanly and then disappear.

**Position three: generative ambient.** Endel. This only works when the app *is* the audio.

The Sanctuary is closer to Things 3 than to Endel. **Default to silence.** If a sound is ever introduced, it should be one optional, hand-recorded, hand-mastered tone — at a specific transition (e.g., marking the intention) — and the user should be able to turn it off in two taps without losing the feature. Synthesised UI dings are banished; they read as productivity-software, not sanctuary.

## 4. Cormorant italic, gold, dark navy — in service of daily memorability

The Sanctuary's palette is already correct. The discipline is to **use it less often, but in identical places every day.** Recognisability comes from positional repetition, not visual volume.

**Cormorant italic** is the soft-landing voice. It should appear on exactly four kinds of surface and nowhere else: the date line, the daily intention prompt, the "what did today serve?" reflection, and milestone acknowledgments. Italic Cormorant in a button, a tab label, or a field hint dilutes the signal — those belong to Jost. The user should learn within a week that *italic Cormorant means a moment that's asking for presence*.

**Gold** (`#C4973A`) is the invitation colour. The playbook already forbids gold-as-reward. The next discipline is to forbid gold-as-decoration. Use gold only on: (a) the active call to enter the daily ritual, (b) the acknowledgment that a quiet repetition has happened (e.g., "30 days of meditation. Quiet, repeated devotion is the work."), and (c) the Illuminator pill. Three uses, three meanings. Gold-on-borders for every card flattens the hierarchy.

**Dark navy** (`#0B1C3D`) is the room. Its job is to be unnoticeable. The temptation will be to lift contrast on cards for "readability." Resist — calm-UX research from 2025 (Raw.Studio, "Aesthetics of Calm UX") explicitly identifies muted, low-contrast surfaces as the marker of the post-2024 calm-design wave. The current `rgba(255,255,255,0.025)` card on navy is correct. If anything reads as too quiet, raise the type weight, not the background.

The signature image: **a navy room with one gold thing in it, set in italic Cormorant.** Every day, in the same position. That is the Sanctuary's memorability.

## 5. Five concrete proposals

**P1. Lock the morning posture to a single signature element.** The Today card currently offers date, intention, reflection, and habits in one block. Pull the intention prompt into a single italic-Cormorant line above everything else, occupying its own breath of vertical space — the way Things 3's "Today" header owns the screen before the list appears. The other elements still render below, but the first thing the eye lands on is one sentence, in one typeface, in one position. Recognisable with the screen at arm's length.

**P2. Replace "streak" counters with quiet-language acknowledgments at thresholds only.** Currently streaks show running counts; this creates exactly the "comparative" pressure the roadmap forbids. Render the count only at meaningful repetitions — 7, 30, 100, 365 days — and only as italic Cormorant copy, never a number-on-its-own. Between thresholds, the habit row shows a soft gold dot for today-done and nothing for today-not-done. No red. No grey "missed." The absence carries the information.

**P3. Introduce one — and only one — living element on the dashboard.** A slow gold dot that breathes (4s ease, 0.6 to 1.0 opacity, repeating) on whichever card represents the user's primary practice for today. This is the Sanctuary's equivalent of Oak's breathing circle: one recognisable motion that earns its motion-budget. Everything else stays static. The dot moves at the pace the user is supposed to breathe; the design teaches the practice.

**P4. Scene-based daily entry, not surface-based.** Borrow from Endel without copying the aesthetic. The first interaction on opening the Sanctuary is a single soft prompt — *"What is today serving?"* — with three or four contemplative answers (a presence, a project, a person, a question). The selected scene determines which of the existing surfaces (intention, chief aim, vision board, habit) is foregrounded for that session. The other surfaces remain accessible but recede. This collapses cognitive cost at the door and means the user opens the Sanctuary with intent already declared.

**P5. Silence by default, one hand-recorded tone available.** No UI sounds on tap, hover, or navigation. Provide one optional tone — a struck singing-bowl or a low temple bell, recorded not synthesised, ~3 second decay — that plays when the user commits the daily intention. Off by default. Setting lives in one tap from the Today card. This puts the Sanctuary in the Oak position: the app's only sound is the practice's sound, and the user can choose silence forever.

**P6. (Bonus) Held-back motion budget across the whole surface.** Audit every transition. The current 200ms ease on buttons is correct; anywhere a transition exceeds 300ms or compounds (e.g., fade + slide + scale), reduce to one axis. Calm tech reads as decisive; over-animated apps read as anxious. Bear and Things 3 are the references — checkmarks, panel slides, nothing else.

**P7. (Bonus) Make Cormorant italic exclusive.** Audit every use site. Demote any non-emotional Cormorant italic (field hints, captions, button labels) back to Jost. The italic becomes a four-place language: date, intention, reflection, milestone. After one week, the user reads italic Cormorant as "this is asking me to be present" without thinking about it. That is the memorable-but-quiet move, made operational.

---

## 100-word summary

Calm apps that survive daily use — Oak, Endel, Things 3, Bear — solve the memorable-but-quiet tension by owning a single signature moment, ritualised through repetition. The Sanctuary already has the right palette (Cormorant italic, gold, dark navy) and the right voice constraints. Seven proposals: lock the morning to one italic-Cormorant prompt; replace streak counters with threshold-only acknowledgments; introduce one living element (a breathing gold dot); offer scene-based entry over surface-based; default to silence with one optional hand-recorded tone; hold the motion budget under 300ms single-axis; make italic Cormorant exclusive to four emotional positions. Recognisability through positional repetition, not visual volume.

---

## Sources

- [Calm Tech Institute — Principles](https://www.calmtech.institute/calm-tech-principles)
- [Principles of Calm Technology — Design Principles](https://principles.design/examples/principles-of-calm-technology)
- [Amber Case — Announcing the Calm Tech Institute (Medium)](https://caseorganic.medium.com/designing-tech-that-finally-respects-our-time-humanity-announcing-the-calm-tech-institute-33bac541b133)
- [IEEE Spectrum — Calm Tech Certified Devices](https://spectrum.ieee.org/calm-tech)
- [Kevin Rose — Introducing Oak (Medium)](https://medium.com/@kevinrose/oak-meditation-f8478d9fc00)
- [TechCrunch — Kevin Rose launches Oak](https://techcrunch.com/2017/10/31/oak-meditation/)
- [Endel — Scenarios](https://endel.io/scenarios)
- [Endel — Soundscapes](https://endel.io/soundscapes)
- [Bear Blog — Meet Bear Sans](https://blog.bear.app/2023/08/learn-about-our-new-custom-font-bear-sans/)
- [Rands in Repose — Bear: Design, Whimsy, Voice](https://randsinrepose.com/archives/bear-an-elegant-combination-of-design-whimsy-and-voice/)
- [Cultured Code — Things 3 Features](https://culturedcode.com/things/features/)
- [Cultured Code — Today, Upcoming, Anytime, Someday](https://culturedcode.com/things/support/articles/4001304/)
- [Raw.Studio — The Aesthetics of Calm UX (2025)](https://raw.studio/blog/the-aesthetics-of-calm-ux-how-blur-and-muted-themes-are-redefining-digital-design/)
- [ScreenBuddy — Apps to stop doomscrolling (2026)](https://www.screenbuddyapp.com/blog/apps-to-stop-doomscrolling)
- [TechCrunch — How to stop doomscrolling (2025)](https://techcrunch.com/2025/03/17/how-to-stop-doomscrolling/)
