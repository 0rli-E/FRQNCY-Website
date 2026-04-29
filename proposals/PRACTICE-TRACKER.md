# PRACTICE-TRACKER.md

The Sanctuary daily-use loop. Inhabit pillar surface.

## TL;DR

The Practice Tracker is the daily ritual surface that ties chart + Sanctuary + my-frqncy together. A signed-in user lands on `/my-frqncy/practice/`, sees a single suggestion ("today's path"), begins, logs, returns. Their charts at `/my-frqncy/charts/` show the pattern of their own practice — for them, only.

There is no leaderboard. There is no public surface. There is no comparison between users. This is the Inhabit pillar (sixth) made operational, per `proposals/EDITORIAL-VALUES-V2.md` and the FRQNCY voice playbook.

The loop:

1. `/my-frqncy/` ("Today's path" card) — invitation surface for the signed-in user
2. `/my-frqncy/practice/` — pick, sit, log
3. `/my-frqncy/charts/` — read the pattern of your own practice
4. Back to `/my-frqncy/` next day

## Voice constraints — what we never do here

These are non-negotiable per `CLAUDE.md` and `proposals/FRQNCY-VOICE-PLAYBOOK.md`. Anything new added to this surface gets checked against this list.

- **No leaderboards.** Anywhere. Ever.
- **No public ranking.** Logs are RLS-locked to the owner.
- **No "calls" framing.** No "today's challenge". No "daily challenge". The page says "today's path" — invitation, not assignment.
- **No streaks-as-shame.** "Consistency" never "streak". The metric is "how many days you turned to this in the last 30" — a pattern, not a count to defend.
- **No guilt for missed days.** When the user hasn't practiced in 3+ days, the suggestion is a *short* anchor (5-10 minutes) and the framing acknowledges that the shape of practice returns by sitting once. Never "you missed N days".
- **No comparison surface.** No "share my chart" button. No "see how you compare". No surfacing of one user's logs to another.
- **Practices framed as experiments, not prescriptions.** The reader stays the agent. The 9 curated practices are doors. None is the only door.
- **No banished phrases:** wellness, do the work, hustle, level up, unlock, manifest, vibes, high vibe, soul food, awakened, holistic, self care, authentic self.

## Schema

See `supabase/migrations/012_practice_tracker.sql`. Two surfaces:

- `public.practice_logs` — the canonical table. Owner-locked via RLS (matches the pattern from migrations 001/002/003: `user_id = auth.uid()` on every CRUD policy). One row per session. Never aggregated across users.
- `public.practice_scores` — read-only view of derived per-user stats (total sessions, total minutes, last completed, consistency over 30 days, average mood delta). Inherits RLS from the underlying table.

Mood scale is 1-5 (NULLable). The duration check `> 0 AND <= 600` keeps a single session bounded.

## API surface

`assets/frqncy-practice.js` — vanilla ES module. Imported directly from `/my-frqncy/practice/` and `/my-frqncy/charts/` and the today's-path block in `my-frqncy.html`. Uses `window.frqncy.client` from `assets/frqncy-supabase.js` for all DB calls.

Exports:

- `CURATED_PRACTICES` — 9 hand-picked practices with voice-aligned framings
- `getPractice(slug)` — lookup helper
- `logSession({ practice_slug, duration_minutes, notes?, mood_pre?, mood_post?, started_at? })`
- `listLogs({ practice_slug?, limit?, sinceDays? })`
- `getScores()` — reads `practice_scores`
- `getDailySuggestion()` — see logic below
- `relativeTime(date)` — UI helper

Skipped: a TypeScript copy in `social-src/`. The daily-use surface lives in vanilla HTML to match Sanctuary; a TS port is straightforward when (and if) the same loop ever needs to render inside the social-src Astro app.

## Daily-path logic (the four cases)

`getDailySuggestion()` returns one of four states, all named in invitational voice. Reasoning is exposed as a "why this" tooltip so the rule is transparent:

1. **Practiced today already.** Headline: "You already turned in today." Suggestion: a 10-min `contemplation` (acknowledgement, not a second prescription). Reasoning: "You've already practiced today. This is acknowledgement, not a second assignment — only here if you want it."
2. **No logs in the last 3 days.** Headline: "Today's path." Suggestion: short anchor (≤10 min) — meditation / breathwork / journaling, rotating by day-of-year. Reasoning: "A short anchor. The shape of practice returns by sitting once — duration is not the point today." (Note: explicitly *not* "you missed N days".)
3. **≥3 of last 7 days are logged.** Headline: "Today's path — depth." Suggestion: longer-duration practice (contemplation / study / walking-meditation / fasting), preferring something not done in the last 3 days. Reasoning: "Recent days show consistency. The invitation now is depth — a longer sitting, a fuller question."
4. **Otherwise.** Headline: "Today's path." Suggestion: the practice the user did most recently. Reasoning: "Picking up where you left off. Continuity is its own teaching."

For signed-out users (anywhere the today's-path block is reachable), the function returns a sensible default (5-min meditation) — but the my-frqncy.html injection only renders the section when signed in, so this fallback is only the practice page's own bootstrap.

## Future v1.1

- **Cross-device sync via Sanctuary cloud store.** Already partially done — logs live in Supabase, RLS-locked. Future: bridge into `frqncy.sanctuaryStore` so the existing Sanctuary "daily practice" widget reads/writes the same `practice_logs` table.
- **Word Illuminator integration.** End each practice with an optional "deeper illumination" prompt — a Word Illuminator-style entry on a single word the user surfaces from their session. Uses the structured-output spec from `proposals/WORD-ILLUMINATOR-V2.md`.
- **AI HD reading suggesting personal practice protocol.** When the AI HD reading worker (Phase 2 Week 4) is live, feed the user's chart + log history into a personal-protocol generator: "given your design, here are three practices to experiment with this week." Always experiments. Never a prescription.
- **Invite a friend to practice (without comparison).** Two-person loop where each user sees only their own logs but can see "we both practiced today" — co-presence without ranking. Open question: does this drift toward comparison? Default: don't ship until the framing is airtight.

## Trade-offs explored

- **Why no public surface?** Every public-progress surface in the wild — Strava, Duolingo, RescueTime — drifts toward leaderboard logic, even when "competition" is off by default. The Inhabit pillar is private by design. If a teaching surface for *a specific practice* is wanted publicly, it lives on `/v2/<topic>/`, not on a logs feed.
- **Why "consistency" not "streak"?** Streaks reward fragility. A 30-day streak that breaks on day 31 is a story about failure. "Days turned to this in the last 30" rewards return. Same data, different relationship to it. Voice playbook section 4 (Conviction Without Dogma) — practices framed as experiments, not prescriptions.
- **Why suggest, not assign?** Assignment positions the platform above the user. FRQNCY's voice attribute #1 (Remembrance Over Teaching) keeps the reader as the agent. The headline reads "today's path" — articles included, no imperative verb, no "do this".
- **Why 1-5 mood scale, not 1-10?** A 1-10 scale invites precision the data doesn't support. 5 dots fit on a phone screen, render in a single row, and force the user to commit to a coarse, useful signal. The view exposes the *delta* — the change matters more than the absolute.
- **Why vanilla HTML, not Astro?** `/my-frqncy/` is the existing Sanctuary surface; it's vanilla HTML against `assets/frqncy-supabase.js`. Putting the practice tracker inside social-src would split the daily-use loop across two stacks. The conceptual home is Sanctuary; the implementation matches.
- **Why bake the curated list into the JS module instead of `courses.json`?** `courses.json` is the courses surface. Practices are not courses — they're doors. The 9 curated entries are an editorial pick, not a database row. When the list grows, it's an editorial decision, not a CMS update.

## Files

- `supabase/migrations/012_practice_tracker.sql` — schema + RLS + `practice_scores` view
- `assets/frqncy-practice.js` — API + curated list + daily-path logic
- `my-frqncy/practice/index.html` — practice page (suggestion, timer, log, recent)
- `my-frqncy/charts/index.html` — personal charts (consistency bars, minutes line, mood histogram)
- `my-frqncy.html` — today's-path injection (signed-in only)
- `proposals/PRACTICE-TRACKER.md` — this file
- `NRG-LAUNCH-CHECKLIST.md` — migration 012 added to dashboard step list
- `proposals/EXECUTION-PLAN-90D.md` — Phase 2 Week 3 entries marked shipped

## Personalisation engine v0 (paired)

Sister surface to the today's-path block. Same surface (`my-frqncy.html`), same auth gate, same voice rules. Phase 2 Wk 2 Wed of `proposals/EXECUTION-PLAN-90D.md`.

When a signed-in user has a saved chart (`Constellation` row in `public.charts`), `my-frqncy.html` reveals a **Your design** section above today's-path with two cards:

- **Your domains** — 3-5 topics from `/search.json`, scored against the user's HD type, authority, and Sun gate.
- **Teachers aligned** — 3-5 people from `/people.json`, scored via curated lineage cues + bio substring.

When the user is signed in but has no chart, an empty-state nudge to `/chart/` shows instead. Signed-out visitors see neither — silent no-op.

Matching logic is intentionally crude: substring + tag rules in `assets/frqncy-personalisation.js`. No vector store, no AI call, no embeddings. Each topic/person carries a 6-10 word framing pulled from the source JSON's `desc`/`bio`. Curated fallbacks (5 default topics; the canonical FRQNCY 5 teachers — Neville, Osho, Sadhguru, Sai Maa, Trudeau) ensure the cards are never empty.

Voice constraints inherited from the playbook: never "your destiny", "your path is X", "you must". Headers framed as "topics that often resonate with your type" and "teachers worth reading at your design." Suggestion not prescription, per CLAUDE.md cooperation rule.

Files added/modified:

- `assets/frqncy-personalisation.js` — new ES module: `getUserChart`, `matchTopicsToChart`, `matchPeopleToChart`, `loadTopicsAndPeople`.
- `my-frqncy.html` — new `#your-design` and `#your-design-empty` sections + module script, injected directly above `#todays-path`.

Future v0.1 (cut for time): better signature read for non-Constellation rows, Profile-based matching beyond Osho's 5/1 cue, gate-specific topic mapping (the 64 gates → topic keyword table), and a "why this match?" disclosure tooltip per item.
