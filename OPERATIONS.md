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

## 2026-08-01 (VBRTN bugfix + app test surface)

**Did.** Fixed all three VBRTN bugs from the 2026-07-30 prod audit, in three focused
commits on `vbrtn-live`. (1) The `/api/companion` 500: the intake stores the music answer
as a textarea string but `buildContext` called `p.music.join()`, and `slimProfile` passed
the bad type through because `String.slice` also returns a string. Both ends now coerce
via `asList()`; the server coerces too, since it cannot trust client shapes. Same pass
fixed `negativeTriggerCount`, which counted *characters* when the field was a string.
(2) The `frqncy-vbrtn-store.js` 404: the asset shipped in `a3cb254` but the page-side
wiring had been sitting uncommitted in the working tree from an earlier session.
(3) `desireMap` collisions: bare-substring matching in `scripts/build-vbrtn-trail.mjs`
routed stability→homeopathy (`home`), purpose→open-source (`source`), peace→anything
whose description used "still". Rewritten to word-boundary matching with stem (`meditat*`)
and exact-slug (`=source`) forms; descriptions are no longer searched at all. The build
now prints all twelve routes so the next collision shows up at build time.

Also rebuilt the Android debug APK to confirm the toolchain still works, and probed the
app's test surface.

**Opened.** Nothing filed. Two facts worth tracking: `app/` has **zero automated tests**
(no test script, no test files — every "verified" claim in `app/docs/*` is manual), and
**Xcode is not installed**, which hard-blocks all iOS work. iOS project and Pods are
otherwise staged.

**Finished.** The three fixes are verified by unit-testing `buildContext` against six
profile shapes (string / array / null / number / raw-string modal operators / `{text,at}`
objects) — the string case used to throw and now returns clean context — plus a DOM-shim
run of `slimProfile` and `threadSeed` in Node. All twelve desire routes were read by hand
after the rewrite. Android APK builds clean in 17s.

**Left.** **Nothing is deployed** — prod still returns 500 on `POST /api/companion`,
confirmed by `scripts/status.mjs` this session. The fixes are all carried by
`integrate-2026-08-01`, which is 30 ahead / 0 behind `origin/main` (clean fast-forward)
and still unpushed, awaiting Orlando's cold walk.

**Not verified: anything visual.** Playwright was blocked the entire session — a live
Chrome owned the MCP profile and `rm SingletonLock` did not help — so there is no
screenshot of the VBRTN page and no confirmation the copy changes look right in place.
UI confidence rests on logic tests only. The rebuilt APK is byte-identical to the 11 July
one (gradle packaging went UP-TO-DATE) because nothing in `app/` changed; it was never
installed on a device, so the app itself remains untested on both platforms.

---

## 2026-08-01 (later) — one kanban, team delegation, Claude's queue

**Did.** Audited all five Miro boards before consolidating anything and found there were no
other kanban boards to collapse — the premise did not hold, so nothing was merged. `FRQNCY
DASHBOARDS` (624 items) is the values and team canvas; `Mein erstes Board` (6,134 items) is an
unrelated LOVELIFEPASSPORT coaching template; two boards are empty. Merging any of them into
the to-do board would have destroyed real work. Instead, made the single existing kanban
delegatable.

**Opened.** Owner labels for the team (`owner:norman`, `owner:katzi`, `owner:petra`,
`owner:nikolaus`, `owner:team`) — names inferred from the values board, so Orlando should
correct them. An `in-progress` label, and a matching "In progress" lane on the kanban. A "Team"
legend frame naming each person and their label. Card titles now lead with `[Owner]`.

**Finished.** `board-sync.mjs` regenerates all six lanes and resolves `in-progress` ahead of
status, so whatever anyone is actively working on surfaces in one column. Verified the lane
positions align with the frames already on the board, so the new lane slotted in without
displacing DO NOW.

**Left.**
- **Nobody but Orlando can see the tracker.** `frqncy-ops` has one collaborator. The team needs
  inviting before delegation means anything — blocked on their GitHub handles.
- Existing cards keep their old titles until the five kanban lane frames are deleted by hand and
  the board regenerated; the Miro API has no frame or card delete.
- Two empty Miro boards were left in place — deletion is irreversible and was not confirmed.
- **Claude cannot be a real Miro or GitHub user.** `owner:claude` is the actual mechanism, not a
  user account. Assigning that label is a real handoff; a fake account would not be.

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
