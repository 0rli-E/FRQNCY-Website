---
description: Pick the next concrete Sanctuary task per the roadmap, with file targets.
---

The Sanctuary roadmap is in `proposals/SANCTUARY-ROADMAP.md`. Read it first if you haven't this session, then walk Phase 1 → 2 → 3 → 4 looking for the lowest-numbered item not yet shipped.

```bash
echo "=== Roadmap principles + phases ===" && head -120 proposals/SANCTUARY-ROADMAP.md
echo ""
echo "=== Shipped state per memory ===" && cat ~/Library/Application\ Support/Claude/local-agent-mode-sessions/*/spaces/*/memory/project_frqncy_website_progress.md 2>/dev/null | head -80
```

Phase 1 items, in shipping order:

1. **The Trail** — slide-out journal of past `dailyIntentions` + `reflection` pairs from the last 60 days. Read-only. Accessed via a "Look back" link on the Today panel. Renders date in serif, intention in italic gold, reflection in muted body, habit ratio for that day inline.
2. **Weekly review** — Sunday surface prompting *"It's the week's edge. Look back?"* — opens a synthesis: goals hit, habit ratios, chief-aim score deltas, three contemplative prompts. Saves to `state.weeklyReviews[isoWeek]`.
3. **Monthly close** — last day of each month: goals hit/total, dominant habits, most-written-about words, optional one-line `"What did this month serve?"` epigraph.
4. **Constellation visit summary** — observational line on the dashboard reading from `frqncy:visited` localStorage.
5. **Quote pill** — deterministic daily contemplative line from `assets/sanctuary-quotes.json`. Same line all day, changes at midnight.

When picking up, name the item to Orlando first, then read the existing surface, then ship in one pass. Always end with `/sanctuary-verify`.
