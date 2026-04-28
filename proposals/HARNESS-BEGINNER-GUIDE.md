# FRQNCY Harness — Beginner Guide

You're picking up `@frqncy-network/harness` for the first time. This guide is for someone who knows the Terminal exists but isn't fluent in CLI tooling. It funnels you to the canonical reference docs once you're past the absolute basics.

> **Canonical references:** for daily use → `frqncy-harness/CHEAT-SHEET.md`. For the FRQNCY-flavoured workflows (voice review, research-with-citations, topic commission) → `proposals/HARNESS-FIRST-STEPS.md`. This guide just gets you there.

---

## What it is

A command-line tool that lets you talk to any major AI model — Claude, GPT, Gemini, Perplexity, plus ~300 more via OpenRouter — through one consistent interface. Every conversation is saved as a JSONL trace at `~/.frqncy-harness/traces/<date>/<id>.jsonl`. Nothing is summarised away. The trace is the truth.

Current status: **v0.7.0-alpha.1+** with 9 provider lanes (anthropic, openai, google, openrouter, chutes, perplexity, claude-sdk, claude-code, codex), 7 built-in tools (bash, read, write, grep, glob, web_fetch, web_search), MCP client, gtr sandbox per agent run, $5/$25 cost guardrails, lethal-trifecta gate. 204 tests passing.

It lives in its own repo at `/Users/orli/Documents/Claude/Projects/frqncy-harness/` (sibling to the website folder, not inside it).

---

## Prerequisites

Open Terminal. Confirm these are installed:

```bash
node --version    # need v22.x or higher
npm --version     # comes with node
git --version     # any 2.x
```

Missing Node? Install the LTS from <https://nodejs.org>. Missing git? `xcode-select --install`.

---

## Install

From the harness folder, link the CLI globally on your machine:

```bash
cd ~/Documents/Claude/Projects/frqncy-harness
npm install
npm run build
npm link
```

After `npm link`, the `frqncy-harness` command works from any directory. Verify:

```bash
frqncy-harness --version
frqncy-harness doctor
```

`doctor` prints green/yellow/red status of every provider key, every external CLI, and the trace store. Read its output once now — it tells you exactly what's set up and what's missing.

If you ever update the harness code, re-run `npm run build` (no need to re-link).

---

## First chat (free, no API key needed)

If you have a Claude Max subscription:

```bash
frqncy-harness chat "explain what FRQNCY is in two sentences" --model claude-code/sonnet
```

The `claude-code/*` lane subprocesses Claude Code's official CLI, so you pay nothing — it draws from your Max quota. No tools, but ideal for chat-only work.

---

## Pick your next stop

Three flavours of "next":

1. **You want the cheat-sheet of all daily commands.** → `frqncy-harness/CHEAT-SHEET.md`. Install, auth, the four core commands (`chat`, `repl --agent`, `agent`, `costs`), model-selection guide, troubleshooting.

2. **You want FRQNCY-specific recipes** (voice review, topic-page research with citations, content commission via the artwork pipeline). → `proposals/HARNESS-FIRST-STEPS.md`. Three locked recipes designed for FRQNCY's editorial workflow.

3. **You want to wire your own provider keys.** → `frqncy-harness/CHEAT-SHEET.md` section 2. One key per provider you actually use. None are required to start.

---

## The single most important command to learn

```bash
frqncy-harness repl --agent --model claude-sdk/claude-sonnet-4-6 --yolo
```

This is the persistent agent REPL — a conversation that keeps the same sandbox, MCP connections, and history across turns, with all 18 tools (7 built-in + 11 from the auto-loaded `frqncy-content` MCP server) available. Slash commands inside: `/tools on|off`, `/yolo on|off`, `/model`, `/new`, `/resume`, `/system`, `/help`, `/exit`.

Inside the website folder, the harness auto-loads `CLAUDE.md` as the system prompt and the `frqncy-content` MCP tools as the toolset — so the agent already knows what FRQNCY is and how to query the topic graph + resource library.

---

## What changed from earlier versions of this doc

This file used to describe v0.0.1, when the harness lived at `FRQNCY WEBSITE/frqncy-harness/` and had no CLI. The harness is now its own repo (`~/Documents/Claude/Projects/frqncy-harness/`), shipped as `@frqncy-network/harness`, with everything above. If you're reading old session notes that reference the v0.0.1 path, they're stale.
