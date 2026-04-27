# Telegram daemon for `@frqncy/harness` — Hermes vs OpenClaw

A practical comparison of the two viable paths to run `@frqncy/harness` as a Telegram bot on Orlando's Mac, ending with a recommendation and concrete next steps.

## Why daemon mode matters

`frqncy-harness chat` and `frqncy-harness agent` are foreground commands today: you invoke them in a terminal, they run, they print, they exit. There is no listener loop, no scheduling, no inbound transport. **HARNESS-PLAN.md decision 11** explicitly routes that work to Hermes Agent rather than building a daemon into the harness — the harness stays a focused CLI/library, and a separate process owns the long-lived "where do messages come from" surface. For a Telegram bot specifically, that means: a daemon listens on the Telegram Bot API, an inbound message triggers a subprocess to `frqncy-harness chat` or `agent`, and the daemon ferries the response back to the chat. We have two real options for that daemon: Hermes Agent (Nous Research, the path the harness already documents) and OpenClaw (a newer MIT-licensed project in the same shape). Below is what each costs to wire up and which one wins for this case.

## Option A — Hermes Agent

Verified at [hermes-agent.nousresearch.com](https://hermes-agent.nousresearch.com/) — currently **v0.11.0**, MIT-licensed, source at [github.com/NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent). Multi-platform gateway (Telegram, Discord, Slack, WhatsApp, Signal, Email, CLI), persistent memory, scheduled automations, real sandboxing across local/Docker/SSH/Singularity/Modal, and a skill system documented at [hermes-agent.nousresearch.com/docs/guides/team-telegram-assistant](https://hermes-agent.nousresearch.com/docs/guides/team-telegram-assistant). Built and maintained by Nous Research.

### Mac setup, end-to-end

Steps that happen in your terminal:

```bash
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
hermes setup
npm install -g @frqncy-network/harness
frqncy-harness doctor
```

Steps that happen in Telegram (manual, you-only):

1. Open Telegram, message `@BotFather`, run `/newbot`, pick a name and handle, save the bot token it returns.
2. Message `@userinfobot` and save the numeric user ID it replies with — this becomes the allowlist so only you can talk to the daemon.

Back in the terminal — when `hermes setup` (or `hermes config`) prompts for a channel, pick Telegram, paste the bot token, paste your user ID. Hermes writes the config and registers the gateway.

Drop the harness's existing skill file:

```bash
mkdir -p ~/.hermes/skills/frqncy-harness
cp /Users/orli/Documents/Claude/Projects/frqncy-harness/hermes-skill.md ~/.hermes/skills/frqncy-harness/SKILL.md
```

(Note: the existing `hermes-skill.md` references `~/.hermes-agent/skills/` as the install path. The current Hermes layout is `~/.hermes/skills/<skill-name>/SKILL.md` per their docs — we should update the harness's `hermes-skill.md` after this proposal lands.)

Wire provider keys so the harness inherits them when Hermes shells out:

```bash
frqncy-harness auth set anthropic sk-ant-...
frqncy-harness auth set openrouter sk-or-...
```

Start the gateway:

```bash
hermes gateway
```

Send a Telegram message to your bot. Hermes routes it through the `frqncy-harness` skill, which shells out to `frqncy-harness chat "${USER_MESSAGE}" --model anthropic/claude-sonnet-4-6 --json` (the exact invocation lives in `hermes-skill.md`). The harness streams, traces, and replies; Hermes forwards the answer back to the chat.

### Pros

- This is the path the harness was designed for. `hermes-skill.md` already exists and codifies the chat-vs-agent routing, the conversation-resume flag, the trace dir, the cost-cap hand-off. Decision 11 in HARNESS-PLAN.md is the architectural commitment to this lane.
- Multi-platform. The same daemon also gives you Discord, Slack, WhatsApp, Signal, Email, and CLI — useful when "talk to the harness from anywhere" stops being a Telegram-only problem.
- Mature. Backed by Nous Research, on v0.11.0, with real docs, a real Discord, a real Portal, scheduled cron-like triggers, persistent memory, and five sandbox backends.
- The harness's existing private trace store (`~/.frqncy-harness/traces/`) keeps working unchanged — Hermes just shells out, the harness logs.

### Cons

- Heavier surface than strictly needed. Hermes is itself an agent platform (skills, memory, scheduled tasks, subagents) — running it just to forward Telegram messages to a different agent is using a tractor to mow a lawn. That said, the lawn is yours and the tractor exists.
- One more long-running process on the Mac. Acceptable, but not zero.

## Option B — OpenClaw

OpenClaw ([openclaw.ai](https://openclaw.ai/), source at [github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), npm package [`openclaw`](https://www.npmjs.com/package/openclaw)) is a newer MIT-licensed self-hosted gateway in the same architectural shape: a single Gateway process you run on your machine that bridges chat platforms (Discord, Google Chat, iMessage, Matrix, Microsoft Teams, Signal, Slack, **Telegram**, WhatsApp, Zalo) to AI coding agents. It is tilted more toward the "headless Claude Code over Telegram" use case — the original proof-of-concept was a ~100-line Telegram-to-Claude-Code bridge ([seedprod/openclaw-prompts-and-skills](https://github.com/seedprod/openclaw-prompts-and-skills)) and the project has grown from there.

It differs from Hermes in three ways that matter:

1. **Smaller, single-purpose.** OpenClaw is a gateway and skill runner. It doesn't try to be its own agent platform with persistent memory and subagents. That's good if all you want is "Telegram in, subprocess out, Telegram back."
2. **Skill model.** OpenClaw skills live in `~/.openclaw/` and are likewise markdown-plus-scripts. There is no published `frqncy-harness` skill for OpenClaw — we would write one from scratch, mirroring the routing logic that's already correct in `hermes-skill.md`.
3. **Younger.** Less docs surface, fewer integrations battle-tested, smaller community than Nous Research's.

### Mac setup sketch

```bash
brew install fnm
fnm install 22
fnm use 22
npm install -g openclaw
npm install -g @frqncy-network/harness
openclaw onboard
```

Telegram bot creation in the Telegram app is identical to the Hermes path (BotFather → `/newbot` → save token; `@userinfobot` → save user ID).

```bash
openclaw config set channels.telegram.botToken "<token>"
openclaw config set channels.telegram.enabled true
```

Then write a custom skill at `~/.openclaw/skills/frqncy-harness/SKILL.md` that shells out to `frqncy-harness chat` / `agent` exactly the way the Hermes skill does, restart the gateway, and send a test message.

Per [docs.openclaw.ai/channels/telegram](https://docs.openclaw.ai/channels/telegram) Telegram is a first-class channel, so the gateway side works fine. The work is on the skill side, where we'd be reinventing what `hermes-skill.md` already encodes.

### Pros

- Lighter footprint. Gateway only, no extra agent-platform machinery.
- Same MIT license, same self-hosted shape, no lock-in.
- If we ever want a stripped-down deployment (e.g., on a Raspberry Pi or a tiny VPS) where Hermes's full feature set is overkill, OpenClaw fits.

### Cons

- **No existing harness integration.** We'd port `hermes-skill.md` to OpenClaw's skill format, which is busywork and a second thing to maintain.
- HARNESS-PLAN.md decision 11 names Hermes specifically. Picking OpenClaw means the harness doc surface, the existing skill file, and the architectural decision diverge from the daemon we actually run.
- Younger project. Less battle-tested, smaller community, more risk of churn in the skill format.

## Comparison

| Dimension                       | Hermes Agent                                                | OpenClaw                                                |
| ------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------- |
| License                         | MIT                                                         | MIT                                                     |
| Multi-platform gateways         | Telegram, Discord, Slack, WhatsApp, Signal, Email, CLI      | Telegram, Discord, Slack, WhatsApp, Signal, iMessage, Matrix, Teams, Google Chat, Zalo |
| Telegram quality                | First-class, documented dedicated guide + tutorial          | First-class, documented dedicated guide                 |
| Daemon stability                | v0.11.0, Nous Research–maintained, multi-backend sandboxing | Younger, npm-distributed, smaller maintainer footprint  |
| Harness integration friction    | **Zero** — `hermes-skill.md` already exists in the harness  | Port the skill from scratch, then maintain the port     |
| Maintenance load                | One config, one skill file, one binary to upgrade           | Same shape, but we own the skill drift                  |
| Architectural alignment         | Matches HARNESS-PLAN.md decision 11                         | Diverges from the documented harness daemon path        |
| Extra capabilities you get free | Memory, scheduling, subagents, multi-sandbox                | Smaller, more focused — fewer "free" extras             |

## Recommendation

**Use Hermes.** The honest reason: the harness is already wired for it. `hermes-skill.md` encodes the chat-vs-agent routing, the conversation-resume flag, the cost guard interaction, the trace path, the `--yolo` decision for daemon mode, and the troubleshooting notes. Decision 11 in HARNESS-PLAN.md is the commitment we already made. Picking OpenClaw means doing the same integration work twice and watching two skill files drift apart.

OpenClaw is real and viable — if Hermes ever feels too heavy on the box, or if some specific gateway (iMessage, Matrix) ships there first and matters, switching is a one-day port of `hermes-skill.md` to OpenClaw's skill format. Keep it as a fallback, not a default. Don't take the maintenance hit when the cheaper, better-documented path is sitting there.

One small fix to make on the way: the existing `hermes-skill.md` references `~/.hermes-agent/skills/` as the install path. The actual current Hermes layout per their docs is `~/.hermes/skills/<skill-name>/SKILL.md`. Worth a quick PR to the harness repo so a future you doesn't trip on the stale path.

## Concrete next steps

In Telegram (these are manual, only you can do them):

1. Message `@BotFather`, run `/newbot`, pick a display name, pick a `_bot`-suffixed handle, copy the token it returns.
2. Message `@userinfobot`, copy the numeric ID it sends back.

In the terminal, single-line paste-able:

```bash
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
```

```bash
hermes setup
```

(Pick Telegram when prompted, paste the bot token, paste your user ID.)

```bash
npm install -g @frqncy-network/harness
```

```bash
frqncy-harness doctor
```

```bash
frqncy-harness auth set anthropic sk-ant-...
```

```bash
frqncy-harness auth set openrouter sk-or-...
```

```bash
mkdir -p ~/.hermes/skills/frqncy-harness
```

```bash
cp /Users/orli/Documents/Claude/Projects/frqncy-harness/hermes-skill.md ~/.hermes/skills/frqncy-harness/SKILL.md
```

```bash
hermes gateway
```

Send a message to your bot in Telegram. If the harness replies, you're done. If not, `hermes logs` and `frqncy-harness doctor` are the two debugging entry points; the troubleshooting section of `hermes-skill.md` covers the common failure modes (missing API key, npm global bin not on PATH, MCP config not readable to the Hermes user).

After it's working, two follow-ups worth queuing: update `hermes-skill.md` in the harness repo to use the `~/.hermes/skills/` path, and decide whether to run `hermes gateway` under launchd (`brew services` style) so it auto-starts on login rather than living in a terminal session.

## See also

- [`hermes-agent.nousresearch.com/docs/user-guide/messaging/telegram`](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/telegram) — Hermes Telegram setup
- [`hermes-agent.nousresearch.com/docs/guides/team-telegram-assistant`](https://hermes-agent.nousresearch.com/docs/guides/team-telegram-assistant) — Team Telegram tutorial
- [`docs.openclaw.ai/channels/telegram`](https://docs.openclaw.ai/channels/telegram) — OpenClaw Telegram setup
- [`/Users/orli/Documents/Claude/Projects/frqncy-harness/hermes-skill.md`](../../frqncy-harness/hermes-skill.md) — the harness's existing Hermes skill
- [`proposals/HARNESS-PLAN.md`](./HARNESS-PLAN.md) — decision 11, the daemon-via-Hermes commitment
