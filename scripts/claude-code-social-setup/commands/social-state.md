---
description: Print the current state of the NRG social platform — what's shipped, what's broken, what's deferred.
---

Read these files in order and produce a tight prose summary:

1. `proposals/ROADMAP-90D-2026-05.md` — current 90-day roadmap (window 2026-05-03 → 2026-08-01)
2. `NRG-LAUNCH-CHECKLIST.md` — full operator-gate state
3. `DEPLOY-WEEK-1.md` — terminal-ready deploy runbook (env-var audit included)
4. `proposals/BLUESKY-TIMELINE-READER.md` — federation surface state (v1 → v1.2 shipped)
5. `proposals/PROTOCOL-LESSONS-2026-05.md` — Lens/Nostr/Farcaster refresh + Ethos recommendation

Then run these checks to verify current state vs source:

```bash
ls -la social-src/dist 2>/dev/null || echo "DIST MISSING — last build did not complete"
ls social/_astro/*.js 2>/dev/null | wc -l
grep -c "script.*type=\"module\"" social/index.html 2>/dev/null || echo "0"
ls supabase/migrations/*.sql | wc -l
```

Output: a 6–8 sentence prose status report covering:

- What's live and working in prod (which features serve real users)
- What's source-complete but blocked on operator gates (migrations, env vars, build)
- What's deferred through the 90-day window (per ROADMAP-90D-2026-05 §"What's deferred")
- The current build state — if `social-src/dist/` is missing or `social/index.html` has 0 module scripts, flag that the deployed `/social/` is non-functional and point at `/social-rebuild`
- The next concrete move per Track 2 of the roadmap

Prose, not bullets. Lead with the most load-bearing thing the operator needs to know.
