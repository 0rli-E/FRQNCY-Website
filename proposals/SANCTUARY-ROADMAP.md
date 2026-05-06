# Sanctuary — Roadmap

**Surface:** `/my-frqncy/dashboard/` — the private contemplative dashboard.
**Operator:** Orlando (solo, harness as force-multiplier).
**Companion docs:** `EXECUTION-PLAN-90D.md` (the broader plan), `BACKEND-STATUS.md` (infra), `EDITORIAL-VALUES-V2.md` (voice + posture), `FRQNCY-VOICE-PLAYBOOK.md` (copy).
**Last updated:** 2026-04-29.

---

## What Sanctuary is — one paragraph

Sanctuary is the private layer of FRQNCY. The public site is a topic graph; the social platform is a network of voices; Sanctuary is the room where one person works on themselves. Its job is to hold a person's dream, the chief aims that move toward it, the objectives that compose those aims, the goals that compose those objectives, the practice that supports the whole stack, and the daily ritual of arriving and reflecting. It is private by default, encrypted at rest when the user is signed in, exportable as JSON at any moment, and free to use forever. It is not a productivity app — productivity apps are about output. Sanctuary is about coherence between the person you say you are becoming and the way you spent today.

---

## Principles — what Sanctuary is and isn't

These are non-negotiable. They constrain every roadmap item below.

**Is:**
- *Private by default.* Local-first, anonymous works completely. Cloud sync is opt-in via signed-in account.
- *Yours.* Export to JSON at any time, including images. Importable on any device.
- *Slow.* Surfaces written for contemplation, not throughput. Cormorant italic for the things that should land softly.
- *Honest about state.* If migrations aren't applied, the cloud-sync warning is in the console; the experience never silently fails.
- *Tied to the network without depending on it.* The Word Illuminator deep-links from any topic page; the constellation reflects the same chart that powers personalisation; visited topics auto-mark across the site. But Sanctuary remains usable end-to-end with no other FRQNCY surface visited.

**Isn't:**
- *Gamified.* No XP, no points, no levels, no streak-as-leaderboard. Streaks exist as a quiet acknowledgment of devotion (`✦ 30 days of meditation. Quiet, repeated devotion is the work.`), not as a score to beat.
- *Compared.* No "see how others rate", no public ranking, no follower-style follow on goals. The existing FRQNCY editorial standard — cooperation over competition — extends here without exception.
- *Algorithmic.* No "recommended next action" black box. Suggestions are deterministic + transparent (visited topics drop off the learning path; chief aim with the lowest score gets a soft nudge). The user can always trace why a thing is being shown.
- *Spiritual-materialism.* No "level up your consciousness", no progress bars on enlightenment. Per `EDITORIAL-VALUES-V2.md`: tools that equip practice, never tools that adorn the seeker.
- *Extracted.* Sanctuary is not a funnel into a paid tier. The existing membership offer is "support the network" — not "unlock Sanctuary features." All Sanctuary functionality stays free in perpetuity.

If a feature on the roadmap below conflicts with one of these, it gets dropped, not redesigned.

---

## What's shipped (Phase 0)

As of 2026-04-29. Single-page implementation at `my-frqncy/dashboard/index.html` (~2,600 lines) plus the shared `assets/frqncy-supabase.js` for cloud sync.

**The core:**
- Five tabs — Dashboard, Goal Pyramid, Daily Practice, Progress, Vision Board.
- Goal pyramid — Dream → Chief aims (≤3) → Objectives (≤6 per aim) → Goals (per month).
- Daily practice — habits with current streaks, 53-week heatmap, per-habit history.
- Progress — chief-aim score charts, monthly goal hit-rate, habit consistency.
- Vision board — IndexedDB-backed image uploads, optional chief-aim links.
- Word Illuminator — slide-in contemplative chat panel; `#illuminate=<word>` deep-link from any topic page pre-fills the input.
- Cloud sync — opt-in via Supabase `charts` table when signed in. Local-first; cloud merges on attach, union-merges visited + path-progress on signed-in arrival.
- First-run coaching — four-card progressive entry path (Dream / Chief aim / Objective / Practice), self-hides the moment any data exists.
- Today panel — morning-ritual surface above the Scoreboard. Daily intention, yesterday's reflection slot, today's habits at a glance, this month's goals at a glance, streak milestone acknowledgments.
- Privacy banner — accurate per device + auth state. Save indicator on every persist (✦ Saved / ✦ Synced).
- Keyboard shortcuts — 1–5 jump tabs.
- Export / import — round-trippable JSON with images.
- Slogan in footer — *"FRQNCY makes the unable able. FRQNCY empowers the empowering."*

**The shape this roadmap extends:** there's a working contemplative dashboard. The next phases deepen the daily ritual, integrate body + time, and tie Sanctuary to the rest of FRQNCY without compromising privacy.

---

## Phase 1 — Reflection layer (Q2 2026, weeks 1–6)

**Theme:** turn the daily ritual into a long-term practice surface.

The Today panel handles "now". This phase makes Sanctuary something a user comes back to in order to look at their own thinking over time, not just to add to it.

**Ship list:**

1. **The Trail** — slide-out journal of past daily intentions + reflections paired with that day's habit completion. Read-only. Up to 60 days at first; lazy-loads older. Empty days quietly skipped. Accessed via a "Look back" link in the Today panel.
2. **Weekly review** — every Sunday, the Today panel offers a soft prompt: *"It's the week's edge. Look back?"* Click opens a synthesis: which goals were hit, habit ratios, chief-aim score deltas, and three contemplative questions (*What worked? What's calling for attention? What would last week's you have wanted to know?*). Reflections persist as `weeklyReviews[isoWeek]`. Same JSON path as everything else.
3. **Monthly close** — on the last day of each month, a single-pane summary: goals hit / total, dominant habits, the user's three most-written-about words across intentions and reflections. Optional one-line *"What did this month serve?"* — saved as the month's epigraph.
4. **Constellation visit summary on the dashboard** — *"You've opened 14 topics this month. Three of them three or more times: Meditation, Sound Healing, Prosperity Mindset."* Reads from the existing visited-topics tracker. Honors the no-recommendation principle: this is observational, not algorithmic.
5. **Quote pill** — small daily contemplative line on the Today panel, drawn deterministically from a curated set tied to the user's selected modalities. Same line all day, changes at midnight. Set lives in `assets/sanctuary-quotes.json` — editable, not generated.

**Why:** the existing dashboard captures state. This phase captures the *trail* of state. A practice that doesn't compound into a record never becomes a real practice — the reflection layer is what turns daily writing into something the user can be in conversation with.

**Acceptance test:** on a Sunday evening of week 4, a user can click "Look back" from the Today panel and read every intention and reflection they've written that week, paired with their habit ratio for each day, then write a one-line monthly review. None of it requires a network request. None of it required configuration.

**Boundary check:** this phase adds zero gamification, zero comparison, zero algorithm. The "three most-written-about words" is a literal frequency count, openable to inspection.

---

## Phase 2 — Body + time (Q3 2026, weeks 7–12)

**Theme:** the Sanctuary acquires awareness of the body and of time-of-day.

**Ship list:**

1. **Energy / arrival check-in** — the Today panel grows a small *"How are you arriving?"* row: five soft dots (low / settling / steady / charged / brimming). Optional. Persists per day as `state.checkIns[today]`. Surfaces on the trail next to that day's intention so the user can see how their mornings tend to land. No score. No averaging.
2. **Sleep hours** — single number input on the Today panel, *"Hours of sleep last night."* Persists as `state.checkIns[today].sleepHours`. The Progress tab gains a small line chart that overlays sleep against habit completion — observational, not predictive.
3. **Breath / sit timer** — a small two-button strip on the Today panel: *"Sit"* (10 min, configurable) and *"Breathe"* (3 min). Soft chime via WebAudio (no external library). Logged as a habit completion when finished, contributing to the daily count.
4. **Time-aware micro-prompts** — between 5–10 AM the Today panel asks *"What is today's intention?"*; between 6–10 PM it asks *"What did today serve?"* with the day's intention shown above. Outside those windows, both fields are present but neutral. The transition is local-time, not server-driven.
5. **Word Illuminator on selection** — anywhere in Sanctuary, selecting a word and pressing the existing `Esc/Cmd+/` opens the Illuminator pre-filled. The deep-link already supports this; the keyboard binding is the missing piece.

**Why:** the body is the substrate of any practice. A goal pyramid that ignores how the user slept last night is a productivity app, not a Sanctuary. This phase grounds the contemplative work in the physical state it depends on.

**Acceptance test:** at 7 AM, the Today panel asks for an intention; at 7 PM, it asks what today served. The user can sit for 10 minutes via the Sit button, hear the chime, see the sit logged as a habit. The trail shows three days of low-sleep days that lined up with low-habit-ratio days, without the Sanctuary editorialising about it.

**Boundary check:** the body data stays the user's. No leaderboards on sleep. The chart is observational. No "we noticed you slept badly, here's a tip" — that would be the spiritual-materialism trap. Just data, presented honestly.

---

## Phase 3 — Synthesis (Q4 2026, weeks 13–20)

**Theme:** the Word Illuminator pattern, applied to the user's own writing.

**Ship list:**

1. **Ask Sanctuary** — the Illuminator panel grows a second mode: *"Read me back to me."* The user types a question (*"How have I been showing up to gym?"* or *"What is the through-line in my last month of intentions?"*) and a Cloudflare Pages function reads the relevant slice of state, sends it + the question + the existing Sanctuary system prompt to Workers AI (free, same path as the Illuminator and chat-widget), returns a synthesis.
2. **Sanctuary system prompt** — a sister to `functions/illuminator/_prompt.js`, written to the same voice rules. The model is instructed to never prescribe, never rank, never recommend; only to mirror, observe patterns, and ask back. The synthesis is the contemplation, not the answer.
3. **Privacy contract for the synthesis path** — the function never persists the request body; logs are scrubbed of state content; the user is shown a clear *"This sends today's data to a model. Nothing is stored."* line before the first synthesis fires per session. Opt-out is a single toggle in `settings`.
4. **Cross-Sanctuary search** — typing in any input that's grown to ~3 lines surfaces the Illuminator slot at the bottom (*"Ask Sanctuary about this"*) — implicit invitation to widen the contemplation.
5. **Constellation integration** — when synthesizing, the model has access to the user's chart (HD type, primary gates, GK primes) so the language used in the synthesis matches the user's signature. A Manifestor's reflection reads differently from a Reflector's.

**Why:** Sanctuary already holds the data. Phase 3 makes the data legible to the user. The Illuminator pattern (definitions / etymology / deeper illumination) applied to one's own life turns scattered entries into a contemplation surface. The user is the ground; the model is the mirror.

**Acceptance test:** a user types *"What does the last month of my Sanctuary tell you?"* — the panel returns a 4-paragraph contemplation that names three through-lines from their actual writing, ties the language back to their HD type, asks one closing question, and stores nothing. The user can re-run with no accumulation.

**Boundary check:** the model is constrained never to prescribe. *"You should…"* is banned. *"Notice that…"* is allowed. The contract page makes the privacy surface plain. Cost is a fixed $0/mo (Workers AI free tier; ~3000 req/day at current scale is fine).

---

## Phase 4 — Network + place (2027, when capital allows)

**Theme:** Sanctuary remembers physical sanctuaries, and the trail extends into shared spaces.

These items are capital-blocked or depend on FRQNCY Spaces being open. They live here so the architecture decisions in Phases 1–3 don't preclude them.

**Ship list:**

1. **Visit a Space** — when a FRQNCY Space exists physically, the Sanctuary gains a small "Visit" log. *"You sat at FRQNCY Lugano on Tuesday."* Marked manually for v1; QR or beacon when there's bandwidth for it.
2. **Witness invites** — the user can invite one person (a coach, partner, accountability witness) to read-only view of their dream + chief aims (not goals, not journal). The witness sees a curated subset, not the dashboard. Opt-in both directions.
3. **Aligned Goods integration** — when a habit reflects a tool (e.g. *Sit* → meditation cushion), the Sanctuary surfaces the relevant Aligned Goods entry once, with a clear marker that it's a curated pick (not a recommendation). Disclosure follows `proposals/EDITORIAL-STANDARDS.md` exactly.
4. **Mobile-native parity** — the Capacitor mobile app gains the Today panel, the trail, and the Illuminator. PWA install prompt on the dashboard for users who want home-screen access without the App Store path.
5. **Voice intention** — *"Hey, what is today's intention?"* — shipped as a button, not always-listening. Uses the browser's speech recognition (free, local where supported). Output is always shown for the user to confirm before saving.

**Why:** the Sanctuary's long-horizon value is being a place a person tends across years. Tying it to the physical Sanctuary network and to the witnesses who matter is what makes it different from a journal app.

**Acceptance test:** a user visits FRQNCY Lugano in 2027, marks the visit, sees the visit listed in their trail next to that day's intention. Their accountability witness — invited via a single email link — can read the dream and chief aims, can't see goals, can't comment, can't write. The user revokes access in one click.

**Boundary check:** witnesses are read-only by default. The Aligned Goods surface is a single quiet card, never a list, never sorted. No version of "your friends are also using Sanctuary" — that's social-graph extraction, which Sanctuary won't do.

---

## What stays out forever

- **Habit AI nags** ("you missed gym Tuesday — try…"). The user's relationship with their own practice is theirs.
- **Streak-loss penalties.** Streaks reset to 0 quietly. No flame icon dimming, no warning emails.
- **Public profiles for Sanctuary contents.** The dream stays private by default. The Sanctuary handle is *not* the social handle. Witnesses are explicit invites only.
- **Predictive scoring.** No "you're 73% likely to hit this month's goal." The user is the predictor; the Sanctuary is the surface.
- **Third-party integrations that read Sanctuary.** No Zapier, no Notion sync, no Google Calendar push. The export-to-JSON path is the integration surface; anything that wants the data uses that.
- **Subscription paywall on Sanctuary features.** The free Sanctuary stays free. Membership pays for the network's underwriting, not for unlocked features.

---

## Operational notes

- **Schema growth is bounded by feature-flag-on-presence.** Every new field added to `DEFAULT_STATE` arrives with `if (!state.X) state.X = ...` initialization on read so existing JSON loads without migration. This is already the pattern; Phase 1+ keeps it.
- **Cloud sync continues to be the same single `charts` row** keyed `name='Sanctuary'`. Adding fields adds keys to the JSON blob, never adds tables. Migrations 002 + 003 are the only schema work blocking any of this.
- **The dashboard file size** is ~2,600 lines today and will grow. At ~5,000 lines we should split CSS to `my-frqncy/dashboard/dashboard.css` and JS to `dashboard.js`. Until then, single-file lives keep the cognitive cost low.
- **Voice playbook applies on every new surface.** No phrase from the banished list (`high vibe`, `manifest your dreams`, `level up`, etc.) ships in Sanctuary copy without earned context per `FRQNCY-VOICE-PLAYBOOK.md` §7.

---

## How to use this doc

- New idea for Sanctuary → check it against the Principles. If it fails one, drop it.
- Picking the next ship → take the lowest-numbered Phase 1 item not yet done. The phases are sequential by design.
- Conflict between this doc and another proposal → this doc wins for Sanctuary scope. Cross-reference and update both.
- Operator review → quarterly. The 2026-Q3 review should mark Phase 1 complete or note what slipped and why.

---

*Slogan that governs the work: **FRQNCY makes the unable able.** Every Phase ships only if it can pass that test for at least one user.*
