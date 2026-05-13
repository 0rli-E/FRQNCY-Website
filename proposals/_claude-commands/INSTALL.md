# Install the Sanctuary slash commands

The Cowork sandbox can't write inside `.claude/` (protected location). The three Sanctuary slash commands live here in `proposals/_claude-commands/` and need to be moved into `.claude/commands/` once.

From the repo root, one line:

```bash
mv proposals/_claude-commands/sanctuary-verify.md proposals/_claude-commands/sanctuary-state.md proposals/_claude-commands/sanctuary-next.md .claude/commands/ && rmdir proposals/_claude-commands 2>/dev/null
```

After that, in any `claude` session at this repo:

- `/sanctuary-verify` — syntax-check the dashboard's inline JS + HTML balance after any edit.
- `/sanctuary-state` — print the state schema + render-function map.
- `/sanctuary-next` — pick the next concrete Sanctuary task per the roadmap.

They join the existing `app-build`, `app-sync`, `app-verify` commands you already use for the mobile app.
