# Harness — First Steps

> Plain-English guide to using `frqncy-harness` from your Mac terminal.
> Designed so you can keep working on FRQNCY after this Claude Code
> session ends, without anything magic happening behind the curtain.
> Read once, then keep open in another window for the first week.
>
> Companion to: `frqncy-harness/CHEAT-SHEET.md` (technical reference, sections 1–8).

---

## 0 · What this thing is, in one paragraph

The harness is a tiny program installed on your Mac that lets you talk to *any* AI model from your terminal, with one consistent set of commands, with everything logged so future-you (and future-Claude) can read what happened, with cost guardrails so nothing accidentally bills you $300 overnight, and with the FRQNCY content already loaded in so the AI knows about your topics, resources, books and people without you having to re-explain.

It is **already installed.** You don't need to do anything to get the basics working. The rest of this doc shows you how to use it.

---

## 1 · The terminal, briefly (skip if you know)

"Terminal" = the Mac app called Terminal (or iTerm, or the panel inside VS Code labelled "Terminal"). Open it. You see a blinking cursor. You type commands and press Enter. That's it.

To open Terminal on a Mac:
- Press `Cmd + Space`, type "terminal", press Enter.

A "command" is anything you type. You'll be using one command over and over: `frqncy-harness ...`.

If a command in this guide has spaces, paste the whole thing as one line. Don't add line breaks unless I show them.

---

## 2 · Confirm it works (30 seconds)

In your terminal, type this and press Enter:

```
frqncy-harness --version
```

It should print something like `0.7.0-alpha.1`. If it does, you're set.

Now run:

```
frqncy-harness doctor
```

This is a health check. Green checkmarks = good. The dots `·` next to keys you haven't set up are fine — they're optional.

Right now your machine has:
- ✓ The harness itself
- ✓ OpenRouter (one API key, ~300 models)
- ✓ Tavily and Brave (web search)
- ✓ The Claude Code CLI (so the free `claude-code/sonnet` lane works via your Max subscription)
- ✓ The Codex CLI (free OpenAI work via ChatGPT Pro)
- ✓ The trace store (every conversation gets logged)
- ✓ The FRQNCY content MCP server (so the AI knows your 146 topics + 770+ resources)

Default model set to **`claude-code/sonnet`** — free, top-quality, no bills.

---

## 3 · The four commands you'll actually use

Just four. Master these and you have everything.

### `chat` — ask one question, get one answer

Use for: quick lookups, drafts, voice rewrites, anything one-shot.

```
frqncy-harness chat "what is the difference between currency and money in one paragraph"
```

That's it. Press Enter. Wait a few seconds. Read the answer. Done.

Override the model just for this one call:

```
frqncy-harness chat "research what's new in conscious capitalism in 2026" --model perplexity/sonar-pro
```

**Tip:** Wrap your question in quotes (`"..."`). Use double quotes if your question has apostrophes.

---

### `repl` — keep talking back and forth

Use for: anything that takes more than one round. Brainstorming. Editing a draft together. Working through a problem.

```
frqncy-harness repl
```

You'll get a `>` prompt. Type, press Enter, get a reply. Keep going. To leave, type `/exit` or press `Ctrl + C`.

Useful slash commands while inside:
- `/new` — start a fresh conversation
- `/model claude-sdk/claude-opus-4-6` — switch to a different model mid-conversation
- `/system "you are a brand voice editor for FRQNCY"` — set a system prompt that shapes every reply
- `/help` — full list

---

### `agent` — run a multi-step task with tools

Use for: anything that needs the AI to actually *do* things — read files, write files, search the web, call FRQNCY's content tools.

```
frqncy-harness agent "search the web for 5 fresh resources on permaculture from 2026, write resources.json-shaped entries to /tmp/permaculture-additions.json" --model openrouter/openrouter/free --yolo
```

Two things to know:
1. **`--yolo`** = "skip per-tool approval prompts". Safe for sandboxed work. Be careful when the agent has `write` or `bash` permissions on real files.
2. **`--cwd <folder>`** = "run with this folder as the working directory". The agent then auto-loads `AGENT.md` or `CLAUDE.md` from that folder, so it knows the rules.

For long FRQNCY work:

```
frqncy-harness agent "review the membership page and rewrite the FAQ in voice" --cwd ~/Documents/Claude/Projects/FRQNCY\ WEBSITE
```

The `\` before the space is required — that's how the terminal knows the folder name has a space in it.

---

### `costs` — what you've spent

```
frqncy-harness costs --period 7d
```

Shows the last 7 days. `claude-code/*` and `codex/*` always show $0 because they use your Max / ChatGPT Pro subscriptions. Everything else is real per-token spend.

Other windows: `--period 30d`, `--period all`. Add `--json` if you want a machine-readable dump.

---

## 4 · Which model when

You set `claude-code/sonnet` as your default. That's free, top-quality, no tools. For 80% of daily use it's the right answer.

When to reach for something else:

| You want… | Use this model | Why |
|---|---|---|
| Free chat from your Max sub (default) | `claude-code/sonnet` | $0, top quality, no tool use |
| Free chat *with* tools (web, files, MCP) | `openrouter/openrouter/free` | $0, auto-routes to a working free model |
| Highest-quality work that needs tools | `claude-sdk/claude-opus-4-6` | Real per-token cost, full agent loop with tools |
| Search-grounded answers with citations | `perplexity/sonar-pro` | Returns sources, ideal for research |
| Cheap fast agent for rote tasks | `openrouter/google/gemini-2.5-flash` | Pennies per call, fine for bulk work |
| Code-heavy work | `openrouter/qwen/qwen3-coder:free` | Designed for coding tools, free |
| Free OpenAI via ChatGPT Pro | `codex/default` | $0 from your Pro quota |
| Reasoning task with shown work | `openrouter/deepseek/deepseek-r1:free` | Free, shows its full thinking |

If you forget which to use, just leave it default (`claude-code/sonnet`). It will not bill you, and the answer is good.

---

## 5 · Three FRQNCY recipes — paste these and run

These are the prompts you'll actually use. Copy, paste, adjust.

### Recipe A — Voice review on a draft

When you have copy that needs to sound like FRQNCY:

```
frqncy-harness chat "review this against FRQNCY voice playbook (cooperation over competition, conviction not dogma, present tense, declarative triads, no spiritual cliches, no startup hype). Rewrite for voice, keep meaning intact: <PASTE YOUR DRAFT HERE>"
```

The harness auto-loads `CLAUDE.md` from the cwd, which references `proposals/FRQNCY-VOICE-PLAYBOOK.md`. As long as you run this from inside the FRQNCY WEBSITE folder, the AI knows the rules.

### Recipe B — Research with citations

```
frqncy-harness chat "research the latest 2026 work on conscious capitalism — Sequoia, B Corp, recent papers, Templar Covenant, Bittensor SN3" --model perplexity/sonar-pro
```

You'll get an answer with `[1]`, `[2]`, etc. citations referring to real URLs.

### Recipe C — Add a topic page commission (the artwork pipeline)

This is the big one. Commissioning a new topic page using the procedure in `proposals/TOPIC-COMMISSION-CONTEXT-GRAPH.md`:

```
cd ~/Documents/Claude/Projects/FRQNCY\ WEBSITE
```

```
frqncy-harness agent "Commission Topic 0004 — Crypto. Seed: 'freedom technology.' Follow proposals/TOPIC-COMMISSION-CONTEXT-GRAPH.md. Add 'crypto' to BESPOKE_TOPICS in generate.js BEFORE writing. Replace v2/crypto/index.html with a unique commissioned piece. Voice-pass per proposals/FRQNCY-VOICE-PLAYBOOK.md before finishing." --model claude-sdk/claude-opus-4-6 --yolo
```

This will run for several minutes, do research, write the page, voice-check it. Review the diff with `git diff v2/crypto/index.html` afterwards.

---

## 6 · How to not lose work between sessions

This is the whole reason the harness exists. Two patterns:

### A) Resume an old conversation

Every conversation is logged. To pick up where you left off:

```
frqncy-harness traces --recent 10
```

Shows the last 10 conversations with their UUIDs. Copy a UUID. Then:

```
frqncy-harness repl --resume <paste-uuid-here>
```

You're back in the same conversation with full memory.

### B) Multi-day agent work

When you start an `agent` with `--cwd <folder>`, the harness scaffolds three files in that folder:
- `progress.md` — append-only log of every step
- `tasks.json` — the work decomposed
- `init.sh` — environment setup

If the run halts (window full, you stop it, error), the next run reads those files and resumes:

```
frqncy-harness agent "continue the previous work" --cwd <same-folder> --resume
```

This is how a multi-week piece of work survives any single session ending.

---

## 7 · Connecting the website to the harness — what's already done

Already wired up by this session, no further action needed:

- ✓ FRQNCY content MCP server is connected. The AI can call tools like `frqncy-content__search_topics` or `frqncy-content__get_resource` to read your topic graph and resource library directly.
- ✓ `CLAUDE.md` in the website folder auto-loads on every chat/agent run from inside that folder. The voice playbook reference, editorial values, repo layout — all picked up.
- ✓ Voice playbook locked at `proposals/FRQNCY-VOICE-PLAYBOOK.md`. Reference any agent run to it.
- ✓ Topic commission procedure locked at `proposals/TOPIC-COMMISSION-CONTEXT-GRAPH.md`. Reference for any new topic page.
- ✓ `BESPOKE_TOPICS` set in `generate.js` protects commissioned pages from being overwritten by the static-site regenerator.

---

## 8 · The first thing to do tomorrow morning

Open your terminal. Run:

```
frqncy-harness doctor
```

Confirm green. Then run a chat to confirm the loop:

```
frqncy-harness chat "today's date and a one-line summary of where the FRQNCY OS Phase 2 plan currently sits"
```

You're up.

If anything ever feels stuck, run `frqncy-harness doctor` first. It tells you exactly what's missing or broken before you debug anything else.

---

## 9 · Cheat-sheet of cheat-sheets — five commands to remember

Print this paragraph, stick it on the wall:

```
1. frqncy-harness chat "..."                # one-shot question
2. frqncy-harness repl                       # back-and-forth conversation
3. frqncy-harness agent "..." --yolo         # multi-step task with tools
4. frqncy-harness costs --period 7d          # what you spent
5. frqncy-harness doctor                     # health check when stuck
```

For everything else: `frqncy-harness --help`, or the full reference at `frqncy-harness/CHEAT-SHEET.md`, or ask the harness itself: `frqncy-harness chat "how do I do X with frqncy-harness"`.

---

## 10 · The bigger picture (one paragraph)

You're in Phase 2 of FRQNCY's build. The harness is the LLM substrate underneath everything — every Council voice, every Worker agent, every CMO draft, every Telegram round-trip will eventually run through it. Right now you use it solo, from your laptop, to keep building. Soon (per `proposals/HARNESS-AS-PHASE2-SUBSTRATE.md` and `frqncy-phase2-plan.html`) Hermes will run it as a daemon on your Hostinger VPS, n8n will route Telegram messages through it, and the same trace log that captures your terminal sessions today will capture the org's autonomous work tomorrow. **What you do at the terminal now becomes the muscle memory for what the org does at scale later.** Get comfortable here first.

---

*Last updated: 2026-04-28. Ping the harness anytime — `frqncy-harness chat "what changed since the last guide"` — and update this file when reality shifts.*
