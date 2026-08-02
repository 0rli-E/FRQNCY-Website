# Handoff — Sanctuary (for Claude Fable)

You're picking up work on the Sanctuary, the private contemplative dashboard at `/my-frqncy/dashboard/`. This doc is built so you can start shipping without re-reading the whole conversation that got us here.

## Read first, in this order

1. `proposals/SANCTUARY-ROADMAP.md` — the Principles section is the constraint set; don't relitigate it.
2. `my-frqncy/dashboard/CLAUDE.md` — file shape, state schema, voice rules. Loaded automatically when you `cd` into that directory.
3. This doc — what's next, what's blocked.

That's it. Don't read every proposal — only those three. Everything else is context you can pull on demand.

## What you're editing

One file: `my-frqncy/dashboard/index.html` (~2,800 lines). Inline `<style>`, inline `<script>`, no build step. Single-page vanilla web app. When it crosses ~5,000 lines, split CSS and JS into sibling files — not before.

Cloud sync is automatic when the user is signed in. Local-first when not. The state schema is in `DEFAULT_STATE` at the top of the script block. Adding fields is safe: initialize lazily on read (`if (!state.X) state.X = ...`) and existing saved JSON loads without migration.

## What just shipped (so you don't accidentally rebuild it)

- **Today panel** — morning ritual surface at the top of the Dashboard tab. Daily intention input, yesterday's reflection slot, today's habits as chips, this month's goals as chips, streak-milestone acknowledgments at 7/30/100/365 days. Function: `renderToday()`. State keys added: `dailyIntentions`, `streakMilestonesSeen`.
- **First-run coaching** — four-card progressive entry path. Hidden the moment any data exists.
- **Word Illuminator deep-link** — `#illuminate=<word>` pre-fills the input and opens the panel. Every topic page has a gold "Illuminate the word X" pill that uses this.
- **Auto-grow Dream textarea**, **symbol palette in habit-add modal**, **Esc-closes-modal globally**, **mobile tab-overflow gradient hint**, **empty vision-board drop zone gentle pulse** — all part of the recent polish pass.
- **Cloud sync** — `assets/frqncy-supabase.js::sanctuaryStore(user)` swaps in transparently on `frqncy.onAuth(...)`.
- **Three slash commands** staged at `proposals/_claude-commands/` — `sanctuary-verify`, `sanctuary-state`, `sanctuary-next`. Install with the one-liner in that directory's `INSTALL.md`.

## What's next — Phase 1 of the roadmap

Ship in this order. Don't skip ahead. Each item gets one focused pass with `/sanctuary-verify` at the end.

### 1. The Trail (next up)

Slide-out journal of past `dailyIntentions` + `reflection` pairs over the last 60 days. Read-only. Empty days quietly skipped.

**Where it lives:** a button "Look back" inside the Today panel (in `renderToday()`), opens a panel modeled on the Illuminator's slide-in pattern (right-edge, transform, backdrop blur). The panel reads from `state.dailyIntentions`, paired with `state.habitLogs` for that day's habit ratio.

**Shape:** date in italic Cormorant gold-light, intention in italic Cormorant (#fff), reflection in body text (text-dim), habit ratio as `3/4 today` or similar small label. Days with no entries skip rendering — the trail compresses to what actually exists.

**Acceptance:** on a Sunday of week 4 the user can click "Look back" and read every intention + reflection they've written that week, paired with their habit ratio for each day, scrolling backward up to 60 days. Nothing requires a network. Closing the panel is Esc or backdrop click — both already wired by the global handler.

### 2. Weekly review

Sunday-only Today-panel prompt: *"It's the week's edge. Look back?"* Click opens a structured synthesis: goals hit count, average habit ratio, chief-aim score deltas, three contemplative questions: *What worked? What's calling for attention? What would last week's you have wanted to know?* Reflections persist as `state.weeklyReviews[isoWeek]` where `isoWeek` is `YYYY-Wnn`.

### 3. Monthly close

On the last day of each month, a single-pane summary card: goals hit / total, top three habits by completion, the user's three most-written-about words across that month's intentions + reflections (literal frequency count, no stop-word filter beyond a/the/and/or). Optional one-line *"What did this month serve?"* — saves as `state.monthlyEpigraphs[YYYY-MM]`.

### 4. Constellation visit summary

Observational line on the dashboard: *"You've opened 14 topics this month. Three of them three or more times: Meditation, Sound Healing, Prosperity Mindset."* Reads `localStorage.frqncy:visited` (the tracker already populates it from `chat-widget.js`). No recommendation, just observation.

### 5. Quote pill

Daily contemplative line on the Today panel. Deterministic — same line all day, changes at midnight. Set lives in `assets/sanctuary-quotes.json` (you'll create this; ~30 entries to start). Selection is by `hash(date + userPrefs) % set.length` so different users see different quotes on the same day.

### 6. One-click dreamboard add (added to roadmap by operator)

Reduce vision-board upload from multi-step (tab → upload → file picker → form) to a single tap from the Today panel and from any topic page. Patterns to support: paste-from-clipboard, drag-and-drop onto a small "Dreamboard target" affordance, screenshot-to-board, PWA share-target on mobile. Auto-suggest chief-aim link from the topic context the image came from (e.g., adding from `/v2/permaculture/` pre-suggests the chief aim touching that domain).

The image still lands in private IndexedDB. Only the input affordance changes.

## What stays out forever (do not propose these)

- Gamification (XP, points, levels, badges-as-status).
- Comparison surfaces (no leaderboards, no "see how others do this").
- Algorithmic recommendation (suggestions must be deterministic + traceable).
- Paywalls on Sanctuary features.
- Third-party data sinks (no Zapier / Notion sync / Google Calendar push).
- "Love and light" used cold in any meta tag, title, or first-paint hero.

## What's blocked on the operator (do not try to do these)

- Apply Supabase migrations 002 + 003 + 006-010 in the Supabase SQL editor. (Cloud sync degrades gracefully without — you'll see `[chart] cloud sync skipped` in console but the local path still works.)
- Set Cloudflare Pages env vars (`PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `PUBLIC_PRIVY_APP_ID`, optional Resend).
- Build `social-src/` — that's a parallel work stream, untouched by Sanctuary work.
- `git push` — sandbox can't write `.git/HEAD.lock`. Operator pushes from terminal.

If the operator hasn't done these, your code still ships clean — the cloud sync surface is feature-flagged by `window.frqncy` presence and degrades silently.

## Conventions you must follow

- Every state mutation persists via `persist().then(renderAll)` — never manual re-render.
- Render functions are idempotent — call them as many times as you want.
- Debounce input handlers at 300ms before calling `persist()`.
- Italic Cormorant for contemplative copy (date, intention prompt, milestones, "what did today serve").
- Gold accent for invitations and acknowledgments. Never red for "failed". Never green for "won".
- Streaks are quietly observed. A skipped day resets to 0 silently. Language is *"30 days of meditation. Quiet, repeated devotion is the work."*
- New CSS lives in the inline `<style>` block, grouped under `/* ── SECTION NAME ── */` comments.
- New render surfaces get `renderXxx()` named in PascalCase-without-prefix style (`renderToday`, `renderFirstRun`, `renderTrail`).

## Verification before saying you're done

Run from repo root:

```bash
python3 -c "
import re, subprocess, tempfile, os
html = open('my-frqncy/dashboard/index.html').read()
scripts = re.findall(r'<script(?![^>]*src=)[^>]*>(.*?)</script>', html, re.DOTALL)
ok = 0
for s in scripts:
    if not s.strip(): continue
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False) as f: f.write(s); p=f.name
    r = subprocess.run(['node','--check',p], capture_output=True, text=True)
    os.unlink(p)
    if r.returncode == 0: ok += 1
    else: print('FAIL:', r.stderr[:300])
print(f'  {ok}/{len(scripts)} script blocks OK')
print('  <body>:', html.count('<body'), '/', html.count('</body>'))
"
```

Or, once `/sanctuary-verify` is installed (one-liner in `proposals/_claude-commands/INSTALL.md`), just call that.

If anything fails — surface it to the operator. Don't patch silently.

## When you finish

1. Update `proposals/SANCTUARY-ROADMAP.md` — move the shipped item to Phase 0 / shipped list, prepend "Phase 1 shipped:" header if you finish multiple in a row.
2. Update auto-memory `project_frqncy_website_progress.md` (under `~/Library/Application Support/Claude/local-agent-mode-sessions/.../memory/`) — append a one-line entry under "What's shipped."
3. Tell the operator three things: what shipped, what to test, what's next.
4. Stop. Don't keep going past one Phase 1 item per session unless the operator says so.

## The slogan governing the work

**FRQNCY makes the unable able.** A change only ships if it can pass that test for at least one user. If it doesn't, drop it.

---

*This doc was written 2026-04-29 after the polish pass landed. If the date on `SANCTUARY-ROADMAP.md` is significantly later than this, re-read the roadmap before picking the next item — Phase order may have shifted.*
