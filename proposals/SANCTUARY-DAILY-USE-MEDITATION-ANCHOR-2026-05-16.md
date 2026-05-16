# Sanctuary — The Daily-Use Meditation Anchor

**Author:** Senior product designer (Insight Timer / Ten Percent Happier / Waking Up lens)
**Date:** 2026-05-16
**Surface:** `/my-frqncy/dashboard/` (the Sanctuary)
**Source file:** `my-frqncy/dashboard/index.html`
**Companion docs:** `SANCTUARY-DAILY-FLOW-2026-05-16.md` · `SANCTUARY-DEVOTIONAL-LENS-2026-05-16.md` · `FRQNCY-VOICE-PLAYBOOK.md` · `WORD-ILLUMINATOR-V2.md`.

**Question:** *How do meditation apps anchor a user's daily return for years, not weeks — and what is FRQNCY's equivalent of the Daily Calm, given that we have no celebrity teachers and no audio library?*

---

## 1. What the peer apps actually do

Five apps, one finding: the daily anchor is **one named thing, voiced by one trusted person, in one fixed time slot, before the rest of the day touches the user.**

**Calm — the Daily Calm.** A 10-minute guided meditation that drops every morning, voiced by Tamara Levitt (on the app since 2014, "responsible for the daily meditation practice of more than two million people"). One theme per session — patience, boundaries, letting go — so it doesn't feel repetitive across a month. Calm's own retention research found that prompting a daily reminder *after the first session* triples retention.

**Waking Up — the Daily Meditation with Sam Harris.** 10–20 minutes, voiced almost entirely by Harris with rotating talks from Joseph Goldstein, Adyashanti, Henry Shukman, Diana Winston. New users are funneled through a gated 28-day Introductory Course; returning users get the rotating daily plus standalone Theory and Practice. The teacher *is* the brand.

**Insight Timer — Daily Insight + Daily Quote + Daily Check-in.** Three anchors stacked: a curated 5–15 min meditation, a single line that fades in on app open, and a mood-rating before/after meditation so the user sees their own shift.

**Ten Percent (now "10% with Dan Harris").** A daily mini-lesson — Dan Harris on video, 3–5 min — paired with a ~10 min audio meditation voiced by Joseph Goldstein. Lesson + meditation bundled as one daily card.

**The shared "before email" anchor.** Every app studied — Calm, Waking Up, Insight Timer, Ten Percent, Headspace — pushes the same behaviour-design principle: anchor the practice to *morning, before phone-as-input-device*. The JMIR randomized trial on Calm (2021) found that morning anchoring was the single strongest predictor of meditation persistence. Tim Ferriss's "airplane mode the night before, 20 min meditation before notifications" is the influencer-grade version. The pattern is now orthodoxy: *do this before checking email.*

---

## 2. Returning vs. new users on the same surface

**Calm** uses progressive disclosure: new users see the Daily Calm prominent with "Start with the Beginner's Course" below; after day 7 the Beginner's affordance disappears. **Waking Up** is directive: new users are *forced* through the 28-day course before the Daily unlocks. **Insight Timer** stabilises the same three components across the lifecycle; only the surrounding carousel personalises. **Ten Percent** lands new users on the two-week course and returning users on today's mini-lesson; the teacher index and live schedule are constant.

**The unifying principle:** *the daily anchor itself does not change shape between new and returning users — only what surrounds it does.* The anchor is the constant. Onboarding scaffolding fades; the anchor remains.

---

## 3. The teacher problem — and FRQNCY's structural answer

Every peer app has a celebrity voice. Levitt is *the* voice of Calm. Harris is *the* voice of Waking Up. Goldstein and Dan Harris are *the* voices of Ten Percent. Even Insight Timer has Davidji and Sarah Blondin as house teachers. The parasocial relationship is part of the anchor — users return partly because they want to hear *that person* again. CTV called Levitt "the voice in millions of bedrooms"; the language is deliberate.

**FRQNCY has no celebrity voice and won't acquire one.** The editorial values rule it out: no ranking people, conviction-as-self-expression over instruction. The voice playbook: *"FRQNCY is a mirror, not a library… not a librarian."* A daily anchor narrated by a single charismatic teacher would violate the remembrance frame at the highest-exposure point of the product.

**What replaces the teacher.** The voice the user hears in the morning is *their own*, refracted through three sources already in FRQNCY: (1) **their Chief Aim**, written by them, surfaced back in Cormorant italic — the "teacher" is last-month's self; (2) **a canonical line**, one line from one of the curated books on the site (A Course in Miracles, Tao Te Ching, Marcus Aurelius, Krishnamurti, Nisargadatta, the 200+ titles), attributed to the source, not narrated by a personality; (3) **the Word Illuminator**, already shipping, already contemplative, already in voice. FRQNCY's brand is *the network of people, building their dream life* — not *one teacher's voice you trust*.

---

## 4. Six proposals for the Sanctuary's daily anchor

These compose with — and do not replace — `SANCTUARY-DAILY-FLOW-2026-05-16` (morning card, week ribbon) and `SANCTUARY-DEVOTIONAL-LENS-2026-05-16` (arrival pre-roll, vow copy). The Daily Anchor is *what sits at the top of the morning card*.

### Proposal 1 — The Daily Line. [Severity: high]

One canonical line, surfaced above the intention input on first paint, deterministically rotated by date (today's line is shared by all users without being social). Format: line · attribution · "source →" link. Example: *"Watch your thoughts; they become words." — Lao Tzu · Tao Te Ching →*. Drawn from the FRQNCY canon (curated books, no Wikipedia, no aggregators). No commentary. Insight Timer's Daily Quote applied to FRQNCY's depth of canon — Calm has no curated reading list; FRQNCY has 200+.

**Ship:** a `daily-line` component picking deterministically from a curated subset of `resources.json` (books with quoteable lines), Cormorant italic above the intention input, attribution + source link in 14px sans below.

### Proposal 2 — The Sit, named and timed. [Severity: high]

Below the Daily Line, one named practice with a duration: *"◇ Sit · 10 min"*. Not a 10-min audio guide (FRQNCY has no library) but a 10-min *timer with silence* — soft bell at start, ambient silence, soft bell at end. The practice name comes from the user's pyramid. If unset: *"You haven't named a daily practice yet. Sit for 10 min anyway? — Begin"*. The bell is the only audio FRQNCY ships in the Sanctuary.

**Ship:** a `sit-timer` with start-bell (low frequency, 1.2s), silent body, end-bell, single circular progress indicator at gold weight. Defaults to 10 min; honors pyramid duration.

### Proposal 3 — The "before email" line. [Severity: medium]

A single Cormorant-italic line below the Sit button: *"Do this before email."* — only between 5 AM and 10 AM local, only if today's sit is incomplete. Names the orthodoxy without instructing. The line every peer app implies; FRQNCY says it out loud.

**Ship:** conditional render gated on time-of-day + completion state. No tooltip, no "why," no learn-more.

### Proposal 4 — The Word of the Day. [Severity: medium]

Surface *one word a day* — drawn from the FRQNCY lexicon (consciousness, sovereignty, frequency, remembrance, knowingness, abundance) — as a chip below the Daily Line. Tapping opens the Illuminator pre-loaded. Makes the Illuminator a *daily ritual* rather than a buried button. 365 contemplative encounters per year with the lexicon. No streak, no count — just *today's word*.

**Ship:** a `daily-word` chip rotating deterministically from ~120 FRQNCY-aligned terms; tap opens the existing Illuminator panel pre-filled.

### Proposal 5 — The Daily Three. [Severity: medium]

Compose the four elements above into a single stacked unit on the morning card: *Daily Line · today's word · the Sit · today's intention*. Everything else sits below. FRQNCY's equivalent of the Daily Calm — but a *triad* in the voice playbook's signature rhythm, not one 10-min audio.

**Ship:** assemble proposals 1–4 into a `morning-anchor-card` occupying ~70% of the mobile viewport between 5 AM and 11 AM. After 11 AM, collapse to a thin "Today: ✦ sat · ✦ word · ✦ line" strip.

### Proposal 6 — Same anchor, different surround. [Severity: medium]

New user on first visit sees the Daily Three with an inline guide tile *("New here? The four layers below shelter today's practice. Start where you're drawn.")*. After day 3 it disappears. After day 7 the week ribbon appears. After day 14 gap-detection activates. The Daily Three stays constant; only the *surround* fades on/off. Mirrors Calm's progressive disclosure and Insight Timer's stabilised check-in.

**Ship:** a `userDayN` derived value (days since `firstVisit` localStorage) gating the new-user tile (n ≤ 3), the week ribbon (n ≥ 7), and gap-detection (gap ≥ 4 days).

### Proposal 7 — The Monthly Voice. [Severity: low]

On the first morning of each month, the Daily Line is replaced by a longer passage (3–5 lines) from one *book of the month*. February the Tao Te Ching, March the Bhagavad Gita, April Marcus Aurelius. The rest of the month's daily lines come from that book. Twelve teachers across twelve months, each represented by their text, not their narration. After three years the user has lived inside 36 books at the daily-anchor layer.

**Ship:** a `bookOfMonth` rotation pinned to a 12-month calendar in `content.json`.

---

## 5. What this proposal does not do

- No audio guidance or narration. FRQNCY ships silence + bell + text.
- No celebrity teacher acquisitions or signed exclusives.
- No social affordances on the daily anchor (no sharing the line, no comparing sit times).
- No paywall on the Daily Three. Free public surface, per the playbook.
- No new notifications. The anchor is the *return*, not the *push*.

## Ship order

**Phase 1 (high):** Proposals 1 (Daily Line) + 2 (Sit timer) + 3 (Do this before email line). Three small components, one composed card. ~one week.

**Phase 2 (medium):** Proposals 4 (Daily Word) + 5 (Daily Three composition) + 6 (new/returning gating).

**Phase 3 (low):** Proposal 7 (Monthly Voice).

---

*Slogan that governs the work: the Sanctuary's daily anchor is one canonical line, one named sit, and one word from the FRQNCY lexicon — the same three things every morning, the same three things for years. The user's voice fills the rest.*
