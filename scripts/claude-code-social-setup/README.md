# Claude Code social-platform setup

This bundle adds NRG-specific orientation + slash commands to this repo so you can work on the social platform from Claude Code CLI without re-orienting Claude every session.

## What it installs

**7 slash commands** under `.claude/commands/social-*.md`:

- `/social-state` — current NRG state (shipped vs broken vs deferred). Always run this first in a fresh session.
- `/social-rebuild` — terminal commands to fix the currently-broken production build (missing Astro module entry script).
- `/social-deploy` — Track 1 unblock guide (migrations + env vars + Privy/Stripe + build).
- `/social-smoke` — production smoke test via curl probes.
- `/social-migration` — Supabase migration audit (source vs applied), with a one-shot SQL probe.
- `/social-voice` — voice-playbook review on a user-facing draft. Blocks marketing-register slips before they ship.
- `/social-feature` — orientation to start a new NRG feature, with track-mapping + touch-surface analysis.

**A new section in `CLAUDE.md`** orienting any Claude Code session to the NRG state, voice constraints, build/deploy flow, and which proposals to read.

**A `settings.local.json` patch** (manual merge) allowlisting `npm install`, `npm run build`, `cp`, etc. so the dev loop doesn't prompt for each command.

## Install

From your terminal, at the repo root:

```
bash scripts/claude-code-social-setup/install.sh
```

The script is idempotent — re-running won't duplicate the CLAUDE.md section or overwrite anything except the slash commands themselves (which it always replaces with the latest versions).

Then merge the `settings.local.json` patch manually — the installer prints it for you to copy into the `permissions.allow` array.

## Verify

In Claude Code, after install:

```
/social-state
```

It should produce a 6–8 sentence status report on what's shipped, what's broken (the current build), and what's deferred.

## Updating

When new slash commands are added (or the existing ones change), re-run `install.sh`. It overwrites the command files but keeps your CLAUDE.md and settings.local.json customisations intact.
