# OPERATIONS LOG

**Every agent writes here before finishing a turn.** This is the shared record of what
was touched, opened, and closed — so Orlando and the team can see the state of play
without reading a diff, and so the next agent starts informed instead of guessing.

## The rule

Before you hand control back, append an entry to the top of the log below. One entry per
working session, not per tool call. If you did nothing that changed state — a question,
a read-only answer — write nothing.

Every entry states four things:

1. **Did** — what actually changed, in plain language.
2. **Opened** — issues filed, branches created, questions raised. Link the numbers.
3. **Finished** — issues closed, work verified. Say how it was verified.
4. **Left** — what is unfinished, blocked, or unverified. Be specific about what you did *not* check.

## Conventions

- **Newest entry at the top.** Date each one `YYYY-MM-DD`.
- **Reference issue numbers** (`ops#4`) rather than restating detail. Issues live in the
  private tracker `0rli-E/frqncy-ops`; this file is in the **public** repo, so keep
  security-, legal- and money-sensitive specifics in the issue, not here.
- **Never mark something done that you did not verify.** "Committed" is not "deployed", and
  "deployed" is not "works". If you could not check, say so in **Left**.
- **Do not rewrite history.** Correct a past entry with a new entry, not by editing the old one.
- Source of truth for task state is always the issue tracker. This log is narrative, not status —
  if the two disagree, the tracker wins.

---

## 2026-08-01 — state audit, integration, and a tracking system

**Did.** Audited the roadmap against reality and found the core problem is a deploy gap, not a
planning gap: `main` and `vbrtn-live` had diverged (10 / 24) with roughly three months of finished
work never pushed, while four separate status docs asserted a reality that no longer held.
Reconciled the divergence into a single verified branch. Built two tools so the state can be
derived instead of asserted, and stood up an issue tracker as the single source of truth.

**Opened.**
- Branch `integrate-2026-08-01` (worktree `/tmp/frqncy-integrate`) — 28 commits ahead of
  `origin/main`. Merges all outstanding `vbrtn-live` work plus the stranded Aligned Goods fix.
- Private tracker `0rli-E/frqncy-ops` with 20 issues, labelled by owner / status / area.
- Miro board `FRQNCY — To-Do & Live Status`.
- `scripts/status.mjs` — probes git, prod routes, companion health, data beds, doc staleness.
- `scripts/board-sync.mjs` — regenerates the board view from the issue tracker, as a kanban.
- `.githooks/pre-commit` and `.githooks/pre-push` — parallel-agent collision guards.
- This file, plus the tracking / parallel-agent / operations-log sections of `CLAUDE.md`.

**Finished.** The merge conflicts, resolved by content verification rather than patch-id
(`git cherry` is unreliable once `main` carries squashed publishes). Aligned Goods resolved to
main's side after proving the branch's 88 entries were a strict subset of main's 94. VBRTN
resolved to the branch side after proving main's `companion.js` still throws the live prod error.
Verified: `npm run lint`, `node scripts/test-hd-engine.mjs`, six data beds parse, Sanctuary and
VBRTN render locally with no genuine console errors. Caught and fixed a regression the merge would
otherwise have shipped — a book slug rename that would have 404'd an indexed, live URL.

**Left.**
- **Nothing is deployed.** The branch is unpushed, awaiting Orlando's cold walk-through.
  Every prod bug listed in the tracker is still live.
- **No pixel verification** — the Playwright screenshot output directory was unreachable, so UI
  confidence rests on DOM snapshots and console output only.
- The superseded hand-made table on the Miro board needs deleting by hand; the API has no
  table-delete.
- Issues do not auto-close: `status.mjs` will show a route green while its issue sits open.
- GitHub Projects kanban is blocked on a token scope (`gh auth refresh -s project`).
