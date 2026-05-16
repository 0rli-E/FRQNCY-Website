# Sanctuary — Daily-Write Affordance Proposal

**Author:** Senior product writer / designer (lens: Day One, Stoic, Notion morning-template ecosystem)
**Date:** 2026-05-16
**Surface:** `/my-frqncy/dashboard/` — the Sanctuary
**Question:** What makes someone open a journaling surface seven days in a row when they don't have to?
**Source code:** `my-frqncy/dashboard/index.html`
**Voice:** `proposals/FRQNCY-VOICE-PLAYBOOK.md`

**Companion docs:** `proposals/SANCTUARY-DAILY-FLOW-2026-05-16.md` · `proposals/SANCTUARY-ROADMAP.md` · `proposals/SANCTUARY-DEVOTIONAL-LENS-2026-05-16.md`

---

## The frame

The Sanctuary's pyramid (Dream → Chief Aim → Objective → Daily Practice) is a *configuration* surface. It tells the app what the user is here for. It does not yet answer the harder question — what does the user write into it today? The pyramid stays still. The writing has to move.

This proposal is the daily-write affordance only — the input surface that gets touched seven days a week. It does not change the pyramid.

---

## 1. The blank-page problem — how peer apps solve it

Every journaling app larger than TextEdit has confronted the same finding: apps without prompts work for established journalers; beginners stop on day three. Day One's team published this directly — the curated prompt database exists because the blank page is the single largest churn driver. Their solution: one prompt that rotates every 24 hours, surfaced in the + menu, tapped to autocreate an entry with the prompt as the first line.

Stoic took a different cut. It locks three time-of-day slots — morning preparation, midday reset, evening review — and rotates the *content within each slot* from a Stoic source canon. The user is never asked *what do I write?* They are asked *where are we?* The slot answers the rest.

Reflectly inverted the problem entirely: it asks the user to *feel* first. A mood slider opens every session; the prompt is chosen from the mood. Writing follows feeling — prompt downstream of state, not upstream.

The Five Minute Journal's success is the opposite of all three: it refuses to rotate. The same six prompts appear every morning and evening, forever. The template is the product. Users return because they know exactly what they will see — the absence of novelty is the affordance.

Four registers, one decision: rotate the prompt (Day One), lock the slot and rotate the content (Stoic), mood-first (Reflectly), refuse to rotate (Five Minute Journal). The Sanctuary's job is to pick one. The voice playbook is the constraint — anything risking "do the work," "high vibe," or hustle register is out before it ships.

---

## 2. Prompt-rotation cadence — daily, weekly, rotating without exhaustion

Day One's 24-hour rotation works at their corpus size (~500+ prompts plus quarterly themed packs). FRQNCY will not have that corpus in 2026. A 24-hour rotation across a small library means users see every prompt inside a month and the library feels exhausted by week six.

The cadence that survives at FRQNCY's scale is **weekly rotation with daily orientation** — one theme per week, anchored to a Sanctuary teaching, with three lightly differentiated daily variants (morning / midday / evening) that keep the week's theme fresh across seven touches. The week is doing the work, not the corpus.

Launch with **52 weekly themes** — one per week of the year, drawn from the eight pillars (Curate, Education, Research, Media, Sell, Fund, Build, Network State). Six or seven weeks per pillar — a year's writing without ever stepping outside what FRQNCY is. The theme rotates Monday morning; the time-of-day variants rotate within the week.

Exhaustion is the failure mode. Mitigations: prompts framed as experiments not prescriptions, per the playbook (`Try this today: name one thing you trust the network with that you don't trust yourself with.`). Skip is always silent. A `write freely` link replaces the prompt with a blank input — prompt as suggestion, not wall.

---

## 3. The "I haven't been here in 11 days" prompt — what to surface

Peer apps split here. Duolingo's pre-2024 streak-loss flame shamed users out permanently — they retired it because lapsed-user return rates collapsed. Day One's "On This Day" surfaces a past entry — a memory, not a metric. Streaks resets the count silently. Reflectly sends a soft push that does not reference the absence.

The Sanctuary cannot say "you missed 11 days." It cannot say "welcome back to your practice" — wellness register, banished. What it *can* say, in Cormorant italic, is the one line that matches the playbook:

> *"It's been a quiet stretch. The dream you wrote is still here."*

Below that line: a read-only ghost-card showing the last chief aim, the last intention, the last reflection — exactly as the user left them. Not a summary, not a count. The user's own writing, mirrored back. The prompt input below it is prefilled with the last intention as faint placeholder ghost text — the bridge from then to now.

Threshold is 7+ days since last `dailyIntentions[date]` write. Below 7: normal morning card. At 7–30: the soft mirror above. At 30+: same mirror, plus one appended Cormorant line — *"The pyramid did not move."* That is the assurance the user needs at 30 days — not that they are welcome, but that the structure they built is still standing. At 90+, the dream itself surfaces as a read-only ribbon — `"You wrote: 'a steady life, full of work I care about.' Still the dream?"` with `yes / reshape`.

No notifications. No emails. No flame. The return surface is always a mirror.

---

## 4. Seven concrete proposals for the daily-write affordance

**4.1 — The Daily Verse, weekly rotation. [high]** One line of Cormorant italic at the top of the morning card, drawn from the week's theme. Format: `This week: <theme>` + one-sentence framing. Example: `This week: Sovereignty. The thing you build is the thing you keep.` Ship: a `WEEKLY_THEMES` array of 52 entries keyed by ISO week.

**4.2 — Morning / midday / evening slot, locked positions, rotating content. [high]** Three inputs, time-of-day-aware. Morning: `Intention for today` (5 AM–11 AM). Midday: `What's present right now?` (11 AM–5 PM). Evening: `What did today serve?` (5 PM–midnight). One is enough. A user opening at 8 PM sees only the evening slot, with morning + midday collapsed below as `you did not write this morning · open`. Ship: time-of-day branching in `renderToday()`, three keyed slots under `dailyIntentions[date]`.

**4.3 — Optional weekly question below the freeform slot. [high]** Below the time-of-day input, one further input — collapsed by default — labelled `the week's question`. It carries the weekly theme's prompt. Example (Sovereignty week): `Where in your life is someone else holding the keys?` Day-One-style prompt, scoped to FRQNCY's pillars. Ship: a collapsible `weekly-prompt-card`, persisted to `state.weeklyPromptAnswers[YYYY-W##]`.

**4.4 — Mood-as-glyph, not slider, not score. [medium]** Reflectly's mood-first finding survives only if the Sanctuary refuses to rank it. Replace the slider with a row of seven Cormorant glyphs — `still · open · stirred · weary · clear · tender · fierce` — one tap selects, no chart, no correlation. The selection seeds prompt choice deterministically (a still day gets a stiller prompt); the user is never told this — personalisation invisible. Ship: persist to `dailyIntentions[date].register`; prompts tagged with register-arrays; no graphs ever.

**4.5 — "On This Day" — last-year's writing, surfaced quietly. [medium]** Below the morning card, a thin Cormorant line: `One year ago, you wrote: "a steady morning, then the deep work."` Tap to expand to the full entry, read-only. Only renders when data exists. Two years, three years — same pattern. This is Day One's most-loved feature and the single best engine for return in the journaling category. Ship: a `past-self-card` querying `dailyIntentions` for the same MM-DD across previous years.

**4.6 — The save chip in the user's eyeline. [high]** The existing save indicator lives in the privacy banner at the top of the page. By the time the user has written at the bottom of the morning card, the save signal is offscreen. Move it inline — below the input, one Cormorant line, three states: `saving…` → `saved` → `synced` (when signed in). 1.4s fade. Ship: sibling `<span class="inline-save">` per input. No iconography, no green, no flash — just the word in faint italic.

**4.7 — Freeform escape hatch. [high]** At the bottom of every prompt, a small Cormorant link: `write freely instead`. Tapping replaces the prompt with a blank input and the placeholder `today.` (one word, lowercase). Prompt as default, blank page one tap away, user never forced. Ship: `state.freeformOverrides[date+slot]`, resets on next day's first paint.

---

## 5. What's load-bearing in Day One's success that FRQNCY can adapt

Three things, in order.

**On This Day is the engine.** Day One's growth team has said publicly that On This Day is the single feature most correlated with multi-year retention. Users come back not for today's prompt — they come back because the app holds a column of their past selves on the same calendar date. The Sanctuary already has the data (`dailyIntentions` is keyed by ISO date). What it lacks is the surfacing. Proposal 4.5 is the cheapest possible adaptation. Highest leverage in the whole document.

**The prompt is a starting line, not a wall.** Day One's prompt is *tap-to-create-an-entry-with-the-prompt-as-the-first-line*. The prompt becomes the title; the user writes whatever they want underneath. This is the difference between a prompt and a form. The Sanctuary's prompt should set the register, then get out of the way — 4.7's freeform escape hatch is the same pattern.

**The reminder is opt-in and silent.** Day One's reminders default to off. One notification per day at a chosen time, no escalation, no shame ladder. The Sanctuary follows this exactly: no notifications by default, an opt-in single daily reminder, language in the playbook's register (`a small chime at 7 AM, as a kindness to your morning self` — not `don't break your streak`).

What FRQNCY should *not* adapt: the streak counter at the top of the screen. Day One ships a streak number; the Sanctuary's voice rules forbid streaks-as-score (see `my-frqncy/dashboard/CLAUDE.md`). The compromise (sibling daily-flow proposal) is a Cormorant line at threshold — *"You've written thirty mornings in a row. Quiet, repeated devotion is the work."* — visible once at 7/30/90/365 days, silent otherwise. Named once, in prose, as recognition. Never as a counter.

---

## Ship order

**First:** 4.1 Daily Verse · 4.2 Time-of-day slots · 4.3 Weekly question · 4.6 Inline save chip · 4.7 Freeform escape hatch.
**Next:** 4.5 On This Day · 4.4 Mood-as-glyph.

---

## What this proposal does not do

No LLM-generated prompts — 52 weekly themes hand-written by Orlando + Norman. No push notifications beyond a single opt-in chime. No social sharing — Sanctuary is private; Witnesses are Phase 4. No mood graphs, sentiment analysis, or correlation surfaces. No changes to the pyramid — this is daily-write only.

---

*The Sanctuary is a mirror. The daily-write affordance is the surface where the mirror is touched — where today's self writes something tomorrow's self can read back. Every proposal above ships only if it can be read as a reflection of the user's own work, not a prescription for it.*
