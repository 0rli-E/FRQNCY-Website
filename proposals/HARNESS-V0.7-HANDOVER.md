# Harness v0.7.0-alpha.1 — sprint handover

**Date shipped:** 2026-04-27
**Commit:** `cdfee25` on `0rli-E/frqncy-harness` `main` (committed and pushed)
**Test status:** 202 / 202 passing on Orlando's Mac

This document is the cross-session handover for the v0.7 sprint of `@frqncy-network/harness`. It exists so any future agent picking up the harness work has the full picture without re-reading the conversation.

## What v0.7 added

Four sprint candidates were on the table at the start of the session. Orlando picked **all four**. Each landed:

1. **AGENT.md / CLAUDE.md auto-load in `chat` and `repl`** — verified, already wired before this conversation, no new code needed.
2. **Skills primitive** — `~/.frqncy-harness/skills/<name>/SKILL.md` packs auto-injected into system prompts when prompts match.
3. **Trace replay + diff** — `frqncy-harness replay <id> --diff` re-runs a saved conversation and compares output.
4. **Cost cap + lethal-trifecta surfaced through hooks** — two new bundled monitor hooks; enforcement still in `stream.ts` because hooks are observers in v0.7.

Plus version bump, README banner update, HELP block additions, and the test count went from 173 → 202 (+29).

## Files touched

### New files

- `src/skills/index.ts` — loader, frontmatter parser, matcher, system-prompt assembler. ~180 LOC.
- `src/commands/skills.ts` — CLI surface (`list | show | path | match`).
- `src/commands/replay.ts` — replay command + Jaccard similarity + side-by-side diff renderer. Exports `jaccardSimilarity` for tests.
- `test/skills.test.ts` — 18 tests covering parser, loader, matcher, formatter, resolver.
- `test/replay.test.ts` — 6 tests on the similarity helper.

### Modified files

- `src/cli.ts` — bumped `VERSION` to `0.7.0-alpha.1`, added `skills` and `replay` commands plus their HELP rows.
- `src/commands/chat.ts` — added skill resolution after AGENT.md/CLAUDE.md load (skipped on `--resume`).
- `src/commands/repl.ts` — pre-loads `always`-skills at REPL start; per-turn matching adds new skills as the conversation drifts; tracks `injectedSkills` set so the same body never gets injected twice.
- `src/commands/agent.ts` — `loadSystemPrompt` now appends matched skill content after project instructions; logs matched skill names to stderr.
- `src/index.ts` — exports for `loadSkills`, `matchSkills`, `parseSkillFile`, `formatSkillsForSystemPrompt`, `resolveSkillsForPrompt`, `DEFAULT_SKILLS_DIR`, `LoadedSkill`, `SkillFrontmatter`, `ResolvedSkills`, plus re-exports of `loadProjectInstructions` / `INSTRUCTION_FILES` / `LoadedInstructions` and the new `bundledCostCapMonitor` / `bundledTrifectaMonitor` hooks and `GuardrailEvents` type.
- `src/hooks/index.ts` — added `GuardrailEvents` interface, extended `PostAgentContext` with optional `guardrails` field, registered two new bundled hooks.
- `src/hooks/bundled.ts` — added `bundledCostCapMonitor` and `bundledTrifectaMonitor`. Both no-ops when their guardrail did not trigger; emit warning text and write to stderr when they did.
- `src/stream.ts` — tracks `costSoftWarnTriggered`, `costHardAbortTriggered`, `trifectaTriggered`. Both post-agent hook firings (success + error path) now pass a `guardrails` snapshot.
- `test/hooks.test.ts` — added 5 tests for the two new monitor hooks (no-op when not triggered, warning path for soft warn, escalation for hard abort, no-op for trifecta-not-triggered, warning emission for trifecta-triggered).
- `package.json` — version bumped to `0.7.0-alpha.1`.
- `README.md` — status banner rewritten to list v0.7 capabilities including skills, replay, hooks, threads, MCP, sandbox, etc.

## Skills primitive — design notes

A skill is a directory under `~/.frqncy-harness/skills/<name>/` containing `SKILL.md` with YAML frontmatter:

```markdown
---
name: my-skill
description: One-line description of when to use this skill
keywords: [optional, list, of, terms]
always: false
---

# Skill body in markdown
```

**Matching algorithm (intentionally simple):**

A skill matches when:

- Its `always` flag is true, OR
- Any of its keywords appears as a whole word in the prompt (case-insensitive), OR
- Any ≥4-character non-stopword from its description appears as a whole word in the prompt.

The matcher uses a regex with non-alphanumeric word boundaries so `hermes` matches `use hermes for this` but not `hermesx topology`. Stopwords like `with`, `that`, `every`, `before` are excluded from description-derived triggers.

Skills are sorted with `always`-skills first, then alphabetically. The system-prompt addendum is formatted as:

```
--- LOADED SKILLS (n) ---

### Skill: name
_description_

body

---

### Skill: name2
...
```

**Behaviour by command:**

- `chat`: resolves once per call against the prompt. Skipped when `--resume` is set.
- `repl`: pre-injects `always`-skills at startup. On each user turn, re-runs the matcher and appends any newly-matched skills to the running system prompt. Tracks injected skills in a `Set<string>` so the same body is never appended twice.
- `agent`: resolves once at the start of the run, prints `skills: <names>` to stderr, appends to the system prompt after project instructions.

**CLI:**

```
frqncy-harness skills path                # prints ~/.frqncy-harness/skills/ and ensures README.md scaffold
frqncy-harness skills list                # lists installed skills with description, keywords, path
frqncy-harness skills show <name>         # prints the full body of a skill
frqncy-harness skills match "<prompt>"    # dry-run: shows which skills would match this prompt
```

`skills path` on first run drops a README.md inside the skills directory explaining the convention.

## Trace replay + diff

`frqncy-harness replay <conv-id-prefix> [--model <m>] [--diff] [--json] [--thread <id>]`

Pulls a conversation from `INDEX.jsonl`, re-runs its user messages (and original system prompt) through the same model — or a different one if `--model` is passed — and reports a Jaccard word-overlap percentage against the original assistant reply. With `--diff`, prints a side-by-side comparison of original vs replay output, dimming matching lines and highlighting changes.

Lookup supports id prefixes (8-char prefixes are typical). If a prefix matches multiple conversations, the command lists them and aborts.

The cheapest possible regression eval: when a new model lands, replay last week's conversations and look at which ones moved.

## Cost cap + trifecta in hooks — what migrated, what stayed

The actual enforcement (hard abort throws, optional trifecta block) **stays in `stream.ts`** because hooks are observers in v0.7 — they cannot block. What migrated is the *report* layer.

`PostAgentContext` got a new optional field:

```ts
interface GuardrailEvents {
  costSoftWarn: boolean;
  costHardAbort: boolean;
  trifectaWarn: boolean;
  cumulativeCostUsd: number;
}

interface PostAgentContext {
  // ... existing fields ...
  guardrails?: GuardrailEvents;
}
```

Two new bundled hooks consume it:

- `frqncy-harness-bundled:cost-cap-monitor` — no-op when no cost trigger fired; otherwise emits `[cost-cap] HARD ABORT at $X.XXXX` or `[cost-cap] soft warn at $X.XXXX` to stderr and returns it as a structured `warning`.
- `frqncy-harness-bundled:trifecta-monitor` — no-op when trifecta did not trigger; otherwise emits `[trifecta] private-data + untrusted-content + outbound-network were all available in conversation <id>` to stderr.

Both are **opt-in** — not part of `DEFAULT_HOOKS`. Add them to `~/.frqncy-harness/config.json`:

```json
{
  "hooks": {
    "post-agent": [
      "frqncy-harness-bundled:auto-commit-traces",
      "frqncy-harness-bundled:macos-notification",
      "frqncy-harness-bundled:cost-cap-monitor",
      "frqncy-harness-bundled:trifecta-monitor"
    ]
  }
}
```

The point of moving these into hooks is **replaceability**. A user can now write a custom post-agent hook that pages PagerDuty / Slack on cost or trifecta events without forking the harness.

When v0.8 lands blocking pre-hooks, the *enforcement* part of cost cap and trifecta can move into hooks too. v0.7 prepares the surface area; v0.8 finishes the migration.

## CLI HELP additions

The `--help` output now includes:

```
skills <subcmd> [args]   list | show <name> | path | match "<prompt>"
                         (Skills are markdown packs at ~/.frqncy-harness/skills/<name>/SKILL.md
                          with YAML frontmatter; auto-injected into chat/repl/agent system prompts
                          when the prompt matches the skill's keywords or description.)
replay <conv-id>         Re-run a saved conversation against a (potentially different) model.
                         Options: --model <m>, --diff, --json, --thread <id>
                         (--diff prints a side-by-side comparison vs the original assistant reply.)
```

## Verification done in-session

- `npm run typecheck` — clean
- `npm run build` — clean
- `node dist/cli.js --version` → `0.7.0-alpha.1`
- `node dist/cli.js --help` shows the two new commands
- `node dist/cli.js skills path` creates the skills dir and prints it
- `node dist/cli.js skills list` (with a test skill installed) lists it correctly
- `node dist/cli.js skills match "tell me about a widget"` matches keyword-based skills
- `node dist/cli.js skills match "completely unrelated weather"` correctly returns "No skills matched"

The vitest suite couldn't run inside the cowork sandbox because of the well-known rollup `darwin-arm64` vs `linux-arm64` native binary mismatch. Orlando's Mac runs `npm test` clean — 202/202 per the commit message.

## Things a future agent should know

**The harness lives in a sibling repo**, not under `FRQNCY WEBSITE/`. Path: `/Users/orli/Documents/Claude/Projects/frqncy-harness/`. GitHub: `0rli-E/frqncy-harness`.

**Stale `.git/index.lock` is normal in the cowork sandbox.** The host process holds it; sandbox git fetches will warn but reads still work. Don't try to `rm` it.

**Tests cannot run in the cowork sandbox.** The rollup native binary mismatch is cosmetic — `tsc --noEmit` and `tsc` (build) work fine. Run `npm test` on the host Mac.

**Don't add tools to `claude-code/*` or `codex/*` providers.** Those are subprocess wrappers around the official CLIs which do their own internal tooling. Tools work on `anthropic / openai / google / openrouter / chutes` (API path). The CLAUDE.md in this repo also notes a forthcoming `claude-sdk` lane that would bridge the harness's HarnessTool array — that work is the v0.8 follow-up, not v0.7.

**Skills file format is intentionally minimal.** No semantic matching, no embeddings, no LLM-based selection in v0.7. Whole-word keyword + description match. Easy to predict, easy to debug, plenty good enough for the ~5–20 skill scale Orlando is at. v0.8+ can revisit.

**The trace store is sacred.** Every conversation's `<id>.jsonl` is append-only. The replay command reads from this; never modifies it. If you need to add fields, bump `TRACE_SCHEMA_VERSION` in `src/types.ts` and write a migration in `src/trace/migrations/`.

**Lethal-trifecta detection lives in `tools/index.ts`** as `detectLethalTrifecta`. Each tool declares `flags: { privateData?, untrustedContent?, outboundNetwork? }`. The gate fires when all three appear in the same tool array.

## Suggested v0.8 sprint candidates

These came up but weren't built:

- **Bridge the harness's `HarnessTool` array into `claude-sdk/*` lane.** Right now claude-sdk uses the SDK's own internal tool registry; bridging the harness tools would unify the surface.
- **Blocking `pre-tool-use` hook event.** Today hooks are pure observers. Blocking pre-tool-use lets users implement per-call gates (e.g., "never let the agent run `rm -rf` on `~/`"). This also unblocks fully migrating cost cap + trifecta enforcement out of `stream.ts`.
- **Trace schema bump to support sub-agents.** `proposals/SUB-AGENTS.md` (in the harness repo) recommends keeping sub-agents off until parent/child `conversation_id` linkage lands in the trace. Currently `disallowedTools: ['Agent']` on the claude-sdk lane.
- **Per-day / per-month cost aggregates.** Cost cap is per-conversation. The user's daily / monthly spend should also be queryable and capped.
- **Perplexity per-request search fees in pricing schema.** The v0.7 cost model assumes per-token; perplexity's sonar models bill per-request for search too. Will silently undercount until the schema bumps.

## How to use the new stuff

```bash
# Install a skill
mkdir -p ~/.frqncy-harness/skills/frqncy-editorial
cat > ~/.frqncy-harness/skills/frqncy-editorial/SKILL.md <<'EOF'
---
name: frqncy-editorial
description: Editorial values and voice rules for FRQNCY content
keywords: [frqncy, editorial, voice, content]
always: false
---

# FRQNCY Editorial values

Cooperation over competition. No leaderboards. Every teaching lives on the site.
See proposals/EDITORIAL-VALUES-V2.md for full guide.
EOF

frqncy-harness skills list
frqncy-harness chat "rewrite this hero copy in our editorial voice: ..."
# stderr will show: [loaded 1 skill(s): frqncy-editorial]

# Replay an old conversation against a different model
frqncy-harness traces list --since 7d
frqncy-harness replay <id-prefix> --model openrouter/google/gemini-2.5-flash --diff

# Enable cost-cap + trifecta monitor hooks
frqncy-harness config set hooks.post-agent.0 frqncy-harness-bundled:auto-commit-traces
# (or edit ~/.frqncy-harness/config.json directly — easier for arrays)
```
