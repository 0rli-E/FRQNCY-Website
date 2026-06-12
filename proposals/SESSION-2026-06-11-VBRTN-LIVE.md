# Session — VBRTN goes live (companion + trail + chart engine)

**Date:** 2026-06-11
**Prereq:** `proposals/MY-FRQNCY-VBRTN-COMPANION-2026-05-22.md` (cause doc, canonical)

## What shipped

VBRTN went from a static localStorage mirror to a guiding companion. Three phases, all verified.

### 1. Live AI companion thread
- **`functions/api/companion.js`** — new Pages Function. Two lanes, chosen automatically:
  - Default: keyless Cloudflare Workers AI (Qwen3-30B). Ships today, $0, no key.
  - Upgrade: if `ANTHROPIC_API_KEY` secret is set, VBRTN speaks through Claude (`env.VBRTN_MODEL`, default `claude-sonnet-4-6`) for the fuller Milton-Model voice. **No code change to switch — just add the secret.**
- System prompt encodes the cause doc: Milton Model + FRQNCY register, modal-operator recovery, MTRSYCW + the five rules-to-win, the seven lenses, what-it-never-does.
- **Privacy floor honoured:** the client sends a slimmed `slimProfile` slice (no `avoiding`, no negative-trigger names — only a count); the server redacts again and never re-surfaces a harmful trigger. Stub HD is dropped, never fed to the model. Verified: the assembled prompt carries HD + the user's "I have to…" sentences + the rememberOne seed, and leaks no trigger names.
- **`my-frqncy/vbrtn/index.html`** — the one-way reflect box became a two-way iMessage-style thread (`./api/companion`). Persists to `profile.history.interactions` as `companion-user`/`companion-vbrtn`, runs modal-operator detection on each send (keeps the recovery card fed), seeds an opener from `rememberOne`. Degrades gracefully offline/file://.

### 2. Recommendation trail
- **`scripts/build-vbrtn-trail.mjs`** → **`my-frqncy/vbrtn/trail-data.json`** (102KB). Pre-joins all surfaces by topic slug: 283 books (resources.json), 8 music (music.json), 108 products (aligned-goods.json incl. nutrition + EMC²), 13 courses (courses.json), the curated nine practices, across 178 topics (search.json). Plus a `desireMap` routing each of the 12 intake `dominantDesire` values to ranked topics by keyword.
- **VBRTN** renders "A trail VBRTN hands you" — one practice / book / music / product / course, deterministic + traceable (a plain-language "why this" per item), with a "Hand me another" re-roll (rotation persisted). Heavy JSON stays off the page.
- **Regenerate** when content changes: `node scripts/build-vbrtn-trail.mjs`

### 3. Real chart engine (replaces the `Math.random()` stub)
- **`my-frqncy/charts/hd-engine.js`** + **`my-frqncy/charts/vsop87-data.js`** — dependency-free ES module (browser + Node). Apparent geocentric tropical longitudes via Meeus (Sun ~0.01°, Moon ~0.05°, planets abridged VSOP87 ~0.1°, Pluto ~0.2°, true node), Espenak–Meeus ΔT, design moment solved at Sun −88° of arc. Full HD derivation (type/strategy/authority/profile/centers/channels/incarnation cross), Gene Keys activation, and astro sun/moon/rising.
- **Verified** (`scripts/test-hd-engine.mjs`): Obama → Projector / Emotional / 6-2 / Leo, cross **33/19|2/1** (exact match to published "Left Angle Cross of Refinement"); Einstein → Generator / Emotional / 1-4 / Pisces. Planets within ~0.03° of Astrodienst. `node scripts/test-hd-engine.mjs` exits 0.
- **Intake wiring** (`my-frqncy/intake/index.html`): birth form now captures **timezone (UTC offset)** — browser offset prefilled, DST/historical safe by being explicit — and **optional lat/lon** for Rising. `buildDesignFromBirth()` calls the engine (loaded as a module) when time+tz present; honest stub fallback otherwise. The "Calculating…" note is now truthful (real vs placeholder).

## How to test it (needs the live site / a server — not file://)
The companion `fetch` and the ES-module imports require HTTP. Locally: `npx wrangler pages dev .` then open `/my-frqncy/intake/` (do a fresh intake with a birth time + timezone), then `/my-frqncy/vbrtn/`. Or deploy and walk it cold.

To run on Claude instead of Qwen: set `ANTHROPIC_API_KEY` (and optionally `VBRTN_MODEL`) as Pages secrets — Cloudflare Dashboard → Pages → frqncy-website → Settings → Environment variables.

## Not done / follow-ups
- **Geocoding:** city is still free-text; tz/coords are user-entered. A city→lat/lon/tz autocomplete would remove that friction. Rising only computes when coords are given.
- **Time-unknown births** fall back to the stub (no reliable chart without time).
- **Mindmovies / dreambuilding / guided-audio / podcast** — still copy-only, no assets (Phase 1+ in the cause doc).
- **Dashboard bridge:** the Today card still reads `frqncy.sanctuary.v1`, not the VBRTN profile. Unchanged this session.
- **Aggregate learning loop** (state-before/intervention/state-after triplets) — no infra yet.
