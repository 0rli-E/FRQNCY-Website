# FRQNCY Agents — Specifications

*Single-pager covering all FRQNCY-owned agents. Each one is sketched here at a level of detail that a competent engineer can pick up and build.*

*Updated: 2026-05-12. Status: spec-only — none of these are built yet.*

---

## Why these agents

Every agent on the FRQNCY harness does one specific job. They sit between the network and the world, doing things that would otherwise be manual or impossible. Each one is named after its function, not its tech stack. The same engineering harness runs all of them.

| Agent | Function | Task |
|---|---|---|
| **Amex Bot** | Watches Amex transactions, classifies them, surfaces aligned-spend patterns and tax-relevant detail. | #46 |
| **Hermes** | Outbound messenger — sends podcast outreach, Launchpad follow-ups, partner intros. Reads from a queue, writes to the right channel (Gmail / TG / DM), keeps state. | #47 |
| **OpenClaw** | Inbound interpreter — reads incoming messages across channels, classifies, drafts replies, surfaces what needs human attention. | #48 |
| **Ironclaw** | The sibling. Heavier-weight version of OpenClaw — drives multi-step workflows (book a flight, set up a Próspera intro, register a domain) end-to-end. | #74 |
| **TG-Topic** | Telegram bot that takes a message like "add a new topic on X" or "amend the desc of t-bitcoin" and proposes a content.json patch for review. | #49 |
| **TG-Harness** | Telegram bridge to the full FRQNCY harness — issue any agent command from a TG chat, get the response back. | #50 |

---

## Shared infrastructure

All agents share a single runtime — the **FRQNCY harness**. Architecture:

- **Runtime**: Node (TypeScript) or Python, each agent is one process. Long-running, supervised. Restarts on crash.
- **Storage**: SQLite local + Postgres remote for shared state. JSON event log to disk for replay.
- **Identity**: Each agent runs under its own credentials. Tokens vaulted (1Password CLI or `pass`). No agent has more access than its job requires.
- **Channels**: Gmail, Telegram, Signal, Discord, Slack — each agent declares which channels it speaks. Channel adapters live in a shared module.
- **Editorial check**: Anything an agent says publicly (replies, posts, messages on behalf of FRQNCY) goes through the voice playbook. The check is a lightweight call to `FRQNCY-VOICE-PLAYBOOK.md` rules, fail-closed if uncertain.
- **Logging**: Every action logged with timestamp + agent + intent + result. Searchable, exportable, auditable.

The harness itself is the unbuilt piece behind half of these. Building it once unlocks all six agents.

---

## 1 · Amex Bot *(task #46)*

**Job:** Watch the Amex feed, classify every transaction, surface what's interesting.

### Inputs
- Amex transaction feed (CSV export → eventually push API or Plaid pull)
- A rules file: `~/.frqncy/amex-rules.yml`

### Behaviour
1. Pulls new transactions nightly.
2. Classifies each one: category (food / travel / software / FRQNCY-aligned), business vs personal, tax-deductible y/n, anomaly y/n.
3. Pushes a daily digest to a private Telegram (you choose which).
4. Flags anything unusual — first time at a merchant, amount above the 95th percentile for that category, foreign-currency edge cases.
5. Produces a monthly tax-ready CSV.

### Stretch
- Auto-tag transactions that align with FRQNCY purchases (Network School fees, retreat deposits, etc.) so the FRQNCY tax line is clean.
- Spot subscription drift — anything that's been billing for 90 days and you haven't logged into.

### Build cost
~2 weeks. Trivial once Plaid is wired; the classification rules take longer than the code.

---

## 2 · Hermes *(task #47)*

**Job:** Outbound messenger. Sends what you tell it to send, in the channel and voice it's supposed to use.

### Inputs
- A queue of `messages_to_send` (TaskList row + a draft body)
- A channel registry: which contact lives where
- Voice playbook reference

### Behaviour
1. Polls the queue.
2. For each row: opens the right channel, drafts in voice, sends.
3. If draft fails voice check → kick back to human review.
4. Tracks reply state. If no response after N days → optional follow-up (configurable per row).

### Use cases
- Podcast guest outreach. Hermes sends; OpenClaw classifies replies; the queue updates.
- Launchpad partner intros.
- "Thanks for the call" notes after every podcast recording.
- Following up on the people you owe a reply to.

### Stretch
- Conversation memory: Hermes knows what's been said in prior threads with each contact, doesn't repeat itself.

### Build cost
~3 weeks. The hard part is the channel adapters; Gmail and Telegram each take ~3 days to wire properly.

---

## 3 · OpenClaw *(task #48)*

**Job:** Inbound interpreter. Reads everything that comes in, decides what matters, drafts the response.

### Inputs
- All inbound channels (Gmail, Telegram, Signal, Discord DM, Slack DM)
- A priority rubric: what to surface immediately, what to batch, what to ignore.

### Behaviour
1. Streams new messages.
2. For each: classify (cold pitch / important reply / friend / spam / business / FRQNCY-network).
3. Drafts a reply in voice for the ones that warrant one.
4. Surfaces the high-priority ones to a TG digest every morning.
5. Auto-archives the obvious noise.

### Why it matters
The inbox is the single biggest tax on attention for a network operator. OpenClaw doesn't *answer* for you — it sorts and drafts, and you approve or rewrite. The goal is to take a four-hour daily inbox down to fifteen minutes.

### Build cost
~4 weeks. Classification needs real training data (your last 6 months of email), and the drafting needs the voice playbook tight.

---

## 4 · Ironclaw *(task #74)*

**Job:** Multi-step workflows. The "do the thing end-to-end" agent.

### Use cases (each a different workflow)
- Book a flight: search, present options, confirm, pay, calendar-block.
- Set up a Próspera intro: write to contact, schedule call, prep brief, send follow-up.
- Register a domain + Cloudflare + Pages site for a new project.
- Run a podcast booking: research guest, draft outreach, schedule, send prep doc, confirm tech check.

### Architecture
- Workflow definition language (YAML or TypeScript objects).
- Each workflow has stages with explicit checkpoints — human approval gates at irreversible steps.
- All actions logged. Rollback documented per workflow.

### Why Ironclaw and not OpenClaw
OpenClaw handles individual messages. Ironclaw handles *projects* — sequences of messages, calls, payments, scheduling. Different beast.

### Build cost
~6 weeks. The framework is a real piece of work; individual workflows are 1–3 days each once the framework exists.

---

## 5 · TG-Topic *(task #49)*

**Job:** Update FRQNCY content from Telegram.

### Example interaction
> Me: `/add t-network-schools desc "Education organised as a network rather than a building..."`
> Bot: ✅ Drafted patch to content.json. Review here: https://github.com/0rli-E/FRQNCY-Website/pull/123

### Behaviour
1. Telegram commands: `/add-topic`, `/edit-topic`, `/add-person`, `/add-book`, `/picked`, etc.
2. Each command produces a structured patch to the relevant bed file.
3. Patch is committed to a `bot/auto-content` branch and a PR is opened.
4. You approve in GitHub (or via /merge in TG).

### Why TG and not a web form
You're already in TG. Adding a topic should be the friction of a sentence, not a form.

### Build cost
~2 weeks. TG bot is easy; the patch validation against schema is the work.

---

## 6 · TG-Harness *(task #50)*

**Job:** Full FRQNCY harness control from Telegram.

### Use cases
- `/status` — what's the network doing right now? Active agents, queue depth, last commit.
- `/agent hermes send orlando@frqncy "the prep doc is up"` — fire a Hermes job.
- `/agent ironclaw start podcast-booking guest=X` — kick off a workflow.
- `/queue` — show pending decisions waiting for you.

### Why it matters
You're not always at a laptop. The harness should be reachable from a phone — every command available as a TG message.

### Build cost
~1 week once Hermes / OpenClaw / Ironclaw exist. Mostly translating their APIs to TG commands.

---

## Sequencing

Build order, chained on dependencies:

1. **Harness foundation** — runtime, supervision, logging, channel adapters. (~3 weeks)
2. **Amex Bot** — lowest-risk first agent, sharpens the harness. (~2 weeks)
3. **Hermes** — outbound. Used for podcast outreach starting immediately. (~3 weeks)
4. **OpenClaw** — inbound. Needs Hermes' contact registry. (~4 weeks)
5. **TG-Topic** — fastest way to add value while harness is hardening. (~2 weeks parallel)
6. **TG-Harness** — once 3 agents exist, this is glue. (~1 week)
7. **Ironclaw** — biggest payoff, biggest lift, last. (~6 weeks)

Total: ~5 months elapsed if built solo. ~2.5 months if there's one engineer alongside the founder.

---

## Open questions

- Cloud vs local? Lean toward Cloudflare Workers + Durable Objects for the long-running pieces, local Mac for the LLM-heavy inference until cost lines up.
- LLM choice? FRQNCY-aligned model (see `/frqncy-ai`) is the eventual target. Until it exists: Claude Sonnet for drafting + classification, GPT-4-mini for cheap routing.
- Single-tenant or multi-tenant from day one? Start single-tenant. Multi-tenant when the harness is rock-solid and other network members ask.

---

## Cross-references

- `proposals/MASTER-ROADMAP.md` Layer 8 — the bots
- `proposals/FRQNCY-PROJECTS-PAPER.md` — internal projects
- `proposals/FRQNCY-VOICE-PLAYBOOK.md` — what the agents speak
- `/frqncy-ai` — the aligned model layer underneath
