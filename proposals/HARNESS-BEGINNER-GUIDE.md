# FRQNCY Harness — Beginner Guide

You're holding `@frqncy/harness` v0.0.1. Here's how to actually use it, written for someone who's still learning.

This guide assumes you know what a Mac Terminal is and you've copy-pasted commands into it before. It does **not** assume you know what npm, TypeScript, or environment variables are. We'll cover those as they come up.

---

## What you have right now

A folder at `/Users/orli/Documents/Claude/Projects/FRQNCY WEBSITE/frqncy-harness/`. Inside that folder is a JavaScript/TypeScript program that lets you talk to any major AI model (Claude, GPT, Gemini, or anything on OpenRouter) using the same one line of code.

Every conversation you have with it is saved forever in a folder called `~/.frqncy-harness/traces/` on your Mac. Nothing is summarized away. The trace is the truth.

That's it for v0.0.1. The fancy stuff (CLI, tools, agent mode, MCP, etc.) is being built right now.

---

## Step 1 — Make sure your Mac has what it needs

Open Terminal (press `Cmd+Space`, type "Terminal", hit Enter). Then run these one at a time:

```bash
node --version
```

You should see something like `v22.x.x` or higher. If you see "command not found," install Node from https://nodejs.org (pick the LTS version).

```bash
npm --version
```

You should see something like `10.x.x` or higher. (`npm` comes with Node, so if Node is installed, npm is too.)

```bash
git --version
```

Should show `git version 2.x.x`. If not, install via `xcode-select --install`.

That's all the prerequisites.

---

## Step 2 — Get into the harness folder

In Terminal:

```bash
cd "/Users/orli/Documents/Claude/Projects/FRQNCY WEBSITE/frqncy-harness"
```

(`cd` means "change directory" — Terminal-speak for "go to that folder.")

Now you're inside the project folder. To confirm:

```bash
pwd
```

This should print the path you just `cd`-ed into.

---

## Step 3 — What's npm and what does `npm install` do?

`npm` stands for **Node Package Manager**. It's the tool that downloads and manages all the JavaScript libraries this project uses (the AI SDK, Zod for validation, the OpenAI SDK, etc.).

Each project has a file called `package.json` that lists which libraries it needs. When you run `npm install`, npm reads that file and downloads everything into a folder called `node_modules/`.

I've already run `npm install` for you, so you should already see a `node_modules/` folder inside `frqncy-harness/`. To confirm:

```bash
ls node_modules | head -5
```

If you see folders like `@ai-sdk`, `ai`, `zod`, you're set. If `node_modules` doesn't exist or is empty, run:

```bash
npm install
```

(Takes ~30 seconds the first time.)

---

## Step 4 — Set up your API keys

The harness needs an "API key" to talk to a model. An API key is a secret string that proves to (say) Anthropic that you have an account and you're allowed to make calls.

You only need keys for the providers you actually want to use. You can set them as **environment variables** — values that live in your shell and any program you run from there can read them.

### The fast way (just for one terminal session)

Open Terminal and run one or more of these (replace `sk-...` with your real key):

```bash
export ANTHROPIC_API_KEY=sk-ant-api03-XXXXXX...
export OPENAI_API_KEY=sk-proj-XXXXXX...
export GOOGLE_GENERATIVE_AI_API_KEY=AIzaSyXXXXXX...
export OPENROUTER_API_KEY=sk-or-v1-XXXXXX...
```

These keys disappear when you close the Terminal window. If you open a new window, you'll need to re-export them.

### The permanent way (set once, available everywhere)

Edit your shell config file (`~/.zshrc` on modern Macs):

```bash
open -e ~/.zshrc
```

(That opens it in TextEdit. If the file doesn't exist, this creates it.)

Add the same `export` lines at the bottom, save, close. Then either restart Terminal or run:

```bash
source ~/.zshrc
```

To check that a key is set:

```bash
echo $ANTHROPIC_API_KEY
```

(Should print the key. If it prints nothing, the variable isn't set.)

### Where do you get the keys from?

- **Anthropic (Claude):** https://console.anthropic.com/settings/keys → "Create Key"
- **OpenAI:** https://platform.openai.com/api-keys → "Create new secret key"
- **Google Gemini:** https://aistudio.google.com/app/apikey → "Create API key"
- **OpenRouter:** https://openrouter.ai/keys → "Create Key"

You only need ONE key to start. Pick whichever model you want to try first.

⚠️ **Never paste API keys into a shared chat, document, or commit them to git.** They're like passwords — anyone with one can spend your money.

---

## Step 5 — Your first chat

Inside the `frqncy-harness/` folder, run:

```bash
node --input-type=module -e "
import { chat } from './dist/index.js';
const result = await chat({
  model: 'anthropic/claude-sonnet-4-6',
  messages: [{ role: 'user', content: 'reply with the single word: ready' }],
});
console.log('Reply:', result.text);
console.log('Conversation ID:', result.conversationId);
console.log('Usage:', result.usage);
"
```

If you set `ANTHROPIC_API_KEY`, you should see something like:

```
Reply: ready
Conversation ID: 7b3e8a40-1c5f-4d7e-a912-c0f1e7d3b8c9
Usage: { inputTokens: 18, outputTokens: 1, cachedInputTokens: 0 }
```

🎉 You just had a real conversation with Claude through the harness.

To use a different provider, just change the model string:

```javascript
model: 'openai/gpt-5'
model: 'google/gemini-2.5-pro'
model: 'openrouter/nousresearch/hermes-4-405b'
```

The rest of the code stays exactly the same. **That's the whole point of the harness — provider-indifferent calls.**

---

## Step 6 — Where did the conversation go?

Every call writes to a folder under your home directory:

```bash
ls ~/.frqncy-harness/traces/
```

You'll see a folder named with today's date (e.g., `2026-04-26/`). Inside it:

```bash
ls ~/.frqncy-harness/traces/$(date +%Y-%m-%d)/
```

You'll see files like `7b3e8a40-1c5f-4d7e-a912-c0f1e7d3b8c9.jsonl` — one file per conversation.

To read one:

```bash
cat ~/.frqncy-harness/traces/$(date +%Y-%m-%d)/<your-conversation-id>.jsonl | head
```

You'll see something like:

```json
{"ts":"2026-04-26T13:45:12.001Z","conversation_id":"7b3e8a40-...","step":0,"type":"user","role":"user","content":"reply with the single word: ready","schema_version":"0.1.0"}
{"ts":"2026-04-26T13:45:13.412Z","conversation_id":"7b3e8a40-...","step":1,"type":"assistant","role":"assistant","content":"ready","model":"anthropic/claude-sonnet-4-6","provider":"anthropic","usage":{"inputTokens":18,"outputTokens":1,"cachedInputTokens":0},"latency_ms":1411,"schema_version":"0.1.0"}
```

Each line is a JSON record — one for the user message, one for the assistant reply. This file is **append-only and never compacted**. Every call you ever make is permanently captured here.

There's also `~/.frqncy-harness/traces/INDEX.jsonl` which is a one-line summary per conversation — useful for "show me everything I did this week."

```bash
cat ~/.frqncy-harness/traces/INDEX.jsonl
```

---

## Step 7 — Streaming (watch the response come in word-by-word)

The chat above waits for the whole response. To watch it come in live:

```bash
node --input-type=module -e "
import { stream } from './dist/index.js';
for await (const event of stream({
  model: 'anthropic/claude-sonnet-4-6',
  messages: [{ role: 'user', content: 'count slowly from one to five, putting each number on its own line' }],
})) {
  if (event.type === 'text') process.stdout.write(event.delta);
  if (event.type === 'done') {
    console.log('\\n\\n--- final ---');
    console.log('Tokens:', event.result.usage);
  }
}
"
```

You'll see the numbers print as they're generated, then a summary at the end.

---

## Step 8 — Common errors and what they mean

**`Error: ANTHROPIC_API_KEY is not set`** — You didn't set the env var. Re-do Step 4.

**`AI_LoadAPIKeyError: ...`** — Same as above, but for OpenAI/Google/OpenRouter.

**`Invalid model string: foo`** — You wrote a model that doesn't follow `<provider>/<model-name>` format. Try `anthropic/claude-sonnet-4-6`.

**`Unknown provider: mistral`** — v0.0.1 supports `anthropic`, `openai`, `google`, `openrouter`. To use Mistral, route through OpenRouter as `openrouter/mistralai/mistral-large-latest`.

**`Error: model not found` or `404`** — The model string is valid format but the model doesn't exist (or you don't have access). Check the provider's docs for available model IDs.

**`Error: 429 rate limit`** — You're calling too fast or have hit your monthly quota. v0.1+ adds automatic retry with backoff.

**`Error: 401 unauthorized`** — Your API key is wrong or expired. Re-check the key.

---

## Step 9 — Try it on a real task

Once you have it talking, try something useful. From inside `frqncy-harness/`:

```bash
node --input-type=module -e "
import { chat } from './dist/index.js';
const result = await chat({
  model: 'anthropic/claude-sonnet-4-6',
  system: 'You are a writing coach for FRQNCY, a consciousness-practice content platform. You favor cooperation over competition, conviction as self-expression, and never use leaderboard or competitive framing.',
  messages: [
    { role: 'user', content: 'Suggest three taglines for the FRQNCY explore page that fit our values.' },
  ],
});
console.log(result.text);
"
```

That's the same harness — just with a system prompt that gives Claude (or any model) FRQNCY's editorial voice.

---

## Step 10 — Keep going

When v0.1.0 lands (next), you'll have a real CLI:

```bash
frqncy-harness chat "summarize the last meeting notes in /tmp/notes.md"
frqncy-harness repl                         # interactive, swap models with /model
frqncy-harness agent "fix the typo in src/index.ts"   # multi-step with bash + file tools
frqncy-harness costs --period 7d            # how much you spent this week
frqncy-harness doctor                       # checks your setup
frqncy-harness config set defaultModel anthropic/claude-sonnet-4-6
```

Until then, the `node --input-type=module -e "..."` pattern from Step 5 is how you use it.

---

## What just happened, conceptually

You now have a single command that can talk to any major AI model with the same code. Every conversation is permanently logged in a structured format. The harness is the layer between *your* code (which doesn't care which model you use) and the *provider's* code (which has its own quirks and APIs).

This is the **harness layer** that Sequoia, Bessemer, Anthropic, OpenAI, and every operator essay in 2026 says is where founders compete. You just built a tiny version of one. The next sprints add the things that make it actually powerful — tools, agent mode, sandboxing, MCP — but the architectural shape is already correct.

If you're curious about why each piece is the way it is, the four-essay corpus in [`harness.md`](../harness.md) is the full story. The locked architectural decisions are in [`HARNESS-PLAN.md`](./HARNESS-PLAN.md). All 30 default decisions with pros/cons are in [`HARNESS-DEFAULTS-REVIEW.md`](./HARNESS-DEFAULTS-REVIEW.md).

If something's confusing, ask. Building it together is the point.
