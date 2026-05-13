# CLAUDE.md — Sanctuary dashboard

You're working on the Sanctuary — the private contemplative dashboard at `/my-frqncy/dashboard/`. Read this file before changing anything substantial.

The roadmap lives at `proposals/SANCTUARY-ROADMAP.md`. The Principles section there is the constraint set; every change has to clear it. If a change feels gamified, comparative, algorithmic, or extractive, drop it.

## What you're editing

A single-file vanilla web app: `my-frqncy/dashboard/index.html` (~2,800 lines as of 2026-04-29). Inline `<style>` block, single inline `<script>` block — no build step, no bundler, no framework. Cloud sync via `assets/frqncy-supabase.js`; private storage via `localStorage` + `IndexedDB`.

When the file crosses ~5,000 lines, split CSS into `dashboard.css` and JS into `dashboard.js`. Not before — single-file lives keep cognitive cost low.

## File shape

The HTML reads top-to-bottom in five sections:

1. `<head>` + inline CSS (lines 1–820). One big block, organized by surface: nav, layout, buttons, illuminator, scoreboard, pyramid, habits, graphs, vision board, modal, toast, tabs, Today panel, Illuminator chat panel, focus rings.
2. Nav + Supabase loader (820–840).
3. `<main>` markup (840–1090). Hero, privacy banner, tabs, five views (`view-dashboard` / `view-pyramid` / `view-practice` / `view-progress` / `view-vision`), Today section placeholder, first-run placeholder.
4. Modals + Illuminator panel (1090–1140).
5. Inline `<script>` (1140–end). One big IIFE-feeling block — storage adapter, cloud-store attach, state schema, persist + save indicator, modal helpers, render functions per surface, tab switcher, Illuminator chat panel, export/import, init().

## State schema

```js
DEFAULT_STATE = {
  dream: '',
  chiefAims: [],          // {id, name, score:{current, target, history:[{date,value}]}, position}
  objectives: [],         // {id, chiefAimId, title, durationMonths, position}
  goals: [],              // {id, objectiveId, title, month:"YYYY-MM", completed, completedDate}
  habits: [],             // {id, name, icon, createdAt, archived}
  habitLogs: {},          // {"YYYY-MM-DD": {habitId: true}}
  dailyIntentions: {},    // {"YYYY-MM-DD": {intention, reflection}}
  streakMilestonesSeen: {}, // {"<habitId>-<threshold>": true}
  settings: { name: '' }
}
```

Persisted via `LocalStore` (localStorage + IndexedDB for vision-board images). Logged-in users get `SanctuaryCloudStore` from `assets/frqncy-supabase.js`, same interface, swap is transparent on `frqncy.onAuth(...)`.

**Adding a field?** Initialize lazily on read (`if (!state.X) state.X = ...`) so existing saved JSON loads without migration.

**The cloud store reads + writes the entire state blob as a single Supabase `charts` row** keyed `name='Sanctuary'`. New fields are new JSON keys, never new tables.

## Render conventions

- Every surface has a `render<Surface>()` function. They're idempotent — call as many times as you want.
- `renderAll()` calls them all. Use it after any state mutation.
- Don't manually re-render in the same handler that calls `persist()` — `persist().then(renderAll)` is the canonical pattern.
- `persist()` returns a promise. Always await it (or chain `.then`) — the save indicator + cloud sync depend on it.

## Voice rules (apply to any copy you write here)

- Present tense, declarative, no spiritual cliché used cold. Read `proposals/FRQNCY-VOICE-PLAYBOOK.md` first.
- Italic Cormorant for things meant to land softly (date, intention prompt, milestones, "What did today serve?").
- Gold accent (`var(--gold)`, `#C4973A`) for invitations and acknowledgments. Never red for "you missed". Never green for "you won". This isn't a productivity app.
- Streaks are quietly observed, never penalized. A skipped day resets the count silently; the language is `30 days of meditation. Quiet, repeated devotion is the work.` not `streak in danger`.
- Slogans canonicalized: `FRQNCY makes the unable able. FRQNCY empowers the empowering.` They live in the footer; don't multiply.

## What you should never do

- Add gamification — XP, points, levels, badges-as-status.
- Add comparison surfaces — no "how others use this", no leaderboards on goals or habits.
- Add algorithmic recommendation — suggestions must be deterministic and traceable.
- Add a paywall on Sanctuary features. The whole surface stays free in perpetuity. Membership pays for the network; it doesn't unlock the room.
- Push to a third-party data sink (Zapier / Notion / Google Calendar). The export-to-JSON button is the integration surface.
- Surface "love and light" as direct self-description in a place where the surrounding context can't earn it. (See `proposals/HOMEPAGE-HERO-REWRITE.md` for the operator note.)

## Common workflows

### Adding a new field to state
1. Add to `DEFAULT_STATE` literal.
2. Lazy-initialize on first read in any function that touches it: `if (!state.X) state.X = ...`.
3. Cloud sync is automatic — `SanctuaryCloudStore.setState()` writes the whole blob.

### Adding a new render surface
1. Add HTML placeholder in the relevant view (`view-dashboard`, `view-pyramid`, etc.) with `id="my-surface"`.
2. Add CSS in the inline style block, grouped under a comment header `/* ── MY SURFACE ── */`.
3. Write `renderMySurface()` near sibling renderers.
4. Call from `renderAll()`.
5. Wire any input events to a debounced `persist()` (300ms is the convention).

### Touching the Illuminator
- System prompt lives at `functions/illuminator/_prompt.js`. Mirror to `/prompts/word-illuminator.md` if changing voice.
- Deep-link convention: `#illuminate` opens the panel; `#illuminate=<word>` pre-fills the input. Used by every topic page's gold pill button.
- Don't change the panel's element IDs (`illum-panel`, `illum-input`, etc.) — they're referenced at parse time.

### Adding a habit-icon glyph
The palette is in `promptAddHabit()`. Append to the `PALETTE` array — first contemplative glyph order, then lifestyle emoji. Don't grow past ~20.

## Slash commands available

From the repo root:
- `/sanctuary-verify` — syntax check the dashboard's inline JS + HTML balance. Run after any edit.
- `/sanctuary-state` — print the current schema by inspecting `DEFAULT_STATE`. Useful when adding fields.

## Things in motion (don't disturb)

- E2EE messaging via libsodium — `social-src/`. Not a Sanctuary concern.
- Privy embedded-wallet auth — same.
- Hybrid signed-message mirror — same.
- Bluesky cross-post bridge — same.
- Membership Stripe — `membership/index.html` is converging on real Stripe in parallel. The Sanctuary doesn't need to know.

## When you finish a task

1. Run `/sanctuary-verify` (or its inline equivalent).
2. Show the user the diff.
3. Update `proposals/SANCTUARY-ROADMAP.md` if a Phase item is now shipped.
4. Update the auto-memory file `project_frqncy_website_progress.md` if it's outdated.
5. Commit + push happens from Orlando's terminal — sandbox can't write `.git/HEAD.lock`.

## Style

Per top-level `CLAUDE.md`: prose, not bullet lists, in chat. Single-line paste-able commands when giving Orlando terminal work. Lean and skimmable docs.
