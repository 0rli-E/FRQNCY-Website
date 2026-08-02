# FRQNCY Coordination Protocol — tasks, agents, and where state lives
> The one-page rule set that ends tracker sprawl. Locked 2026-08-02. Any agent or human touching FRQNCY tasks follows this.

## The architecture (one sentence — Orlando's formulation, locked)
**Notion is the structure for humans. GitHub is the structure for the AI. Miro is ONLY for picturesque overview and creative work.**
Operationally: Notion TASK BOARD = the queue · agents = the workers · git worktrees = the isolation · OPERATIONS.md = the log · frqncy-ops = the mirror · Miro/markdown = pictures, never trackers. The old Miro kanban (68 cards) was fully migrated to Notion on 2026-08-02 and is marked for deletion — no task may ever live on Miro again.

## Where state lives
| Surface | Role | Writable? |
|---|---|---|
| **Notion → FRQNCY HQ → 🏗 TASK BOARD** (https://app.notion.com/p/3b0cb2f25b308128840cfa1a13e35a19) | THE single task tracker. Status, owner, urgency, Agent-ready, Blocked-by, Output link. | ✅ the only writable tracker |
| **Repo `OPERATIONS.md`** | Session log: Did / Opened / Finished / Left, one entry per session. The audit trail agents & humans read to catch up. | ✅ append-only log (not a tracker) |
| **GitHub `0rli-E/frqncy-ops` issues (private)** | Mirror/archive for operational, legal, money detail that must NOT live in the public repo or general Notion. | ✅ mirror, updated in the same pass |
| Miro FRQNCY DASHBOARDS | Visual map / printout. Banner marks it read-only. | ❌ view only |
| Repo markdown to-do docs (SOCIAL-MEDIA-TODO.md etc.) | Orientation, not status. May go stale; the TASK BOARD wins on conflict. | ❌ view only |
| Session task widgets (Cowork/Claude Code) | Ephemeral per-session scratch. | ❌ never authoritative |

## The dual-write rule (THE memory — every session does this)
When any task changes state (started / finished / blocked / new):
1. **Update the Notion TASK BOARD row** — Status, Output link, notes. New work = new row.
2. **Append to `OPERATIONS.md`** at session end — Did / Opened / Finished / **Left** (unfinished, blocked, UNVERIFIED — name the verification method; "committed" ≠ "deployed" ≠ "works").
3. **Mirror to `frqncy-ops`** when the task is operational/legal/financial or when closing something tracked there (a one-line issue comment is enough).
Never mark Done in one place and not the others. If you can only update one (offline, tool down), update Notion and say so in OPERATIONS.md next session.

## The agent queue
- **Definition of agent-ready:** `Owner=Claude` + `Agent-ready=✓` + `Status=Open` + acceptance criteria (2–3 lines) in the row/page + no unresolved "Blocked by".
- **Dispatch:** any Claude session (Cowork, Claude Code, SDK/harness lane) may pull from the queue, sorted by Urgency. Set `Status=In progress` BEFORE starting (this is the claim/lock — prevents two agents taking one task).
- **Repo-touching tasks:** obey CLAUDE.md parallel-agent rules — own worktree, own branch off fresh origin/main, explicit staged paths, never `git add -A`, **max 3 concurrent repo tasks**. Non-repo tasks (research, drafting, outreach prep) may fan out wide.
- **Finish:** output linked in `Output link`, Status=Done, dual-write per above. If blocked: Status stays In progress ONLY while actively worked — otherwise back to Open with `Blocked by` filled.
- **Humans:** Orlando works only the `Owner=Orlando + This week` view. Purple "Decision needed" items are the only ones that wait on him. Weekly Meet reviews the board 15 min.

## Hygiene
- New tasks are born in Notion (not in chat, not in markdown). If discovered mid-session, add the row immediately.
- One task = one outcome. If it needs 3 owners, it's 3 rows.
- The board is pruned in the weekly review: Done rows stay (history), stale In-progress rows get reset to Open.
- Never store credentials or sensitive legal/money detail in Notion rows — reference Bitwarden / frqncy-ops instead.
