# FRQNCY Harness — Use Cases

Practical things to point `@frqncy/harness` at. Each one has a concrete command you can paste.

Compiled after the v0.4.0-alpha.1 ship date (2026-04-26) once the harness was producing real traces.

---

## 1. Topic page enrichment

The agent reads an existing FRQNCY explore-page topic, web-searches for fresh resources, drafts proposed additions for you to review.

```
frqncy-harness agent "Read /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/v2/explore.html and pick one topic that looks thin (few resources). Web-search for 5 high-quality recent resources on that topic from 2025-2026. Write a proposed JSON entry to /tmp/proposed-resources.json that I can review and merge into resources.json." --model openrouter/openrouter/free --yolo
```

What you'll get: a JSON file of suggested resources with title + URL + thematic notes, plus a `progress.md` log showing the agent's reasoning.

**Best model:** `openrouter/openrouter/free` (auto-routes; Qwen3 Coder is strong here when up).

---

## 2. Brand voice review (chat-style, free)

Free via your Claude Max subscription. Paste any draft and ask if it matches FRQNCY's editorial voice (cooperation over competition, conviction as self-expression, no leaderboards, etc.).

```
frqncy-harness chat "Here is a draft FRQNCY tagline: '<your draft>'. Review it against FRQNCY's editorial voice: cooperation over competition, conviction as self-expression, no leaderboards, no ranking people, every teaching lives on the site. Suggest three rewrites and explain why each is more on-brand." --model claude-code/sonnet
```

Cost: $0 (Claude Max).

For ongoing brand voice work, set up an `AGENT.md` in `/FRQNCY WEBSITE/` that the agent reads on every run:

```
echo "# AGENT.md\n\nFRQNCY editorial voice: cooperation over competition. Conviction as self-expression. No leaderboards. No ranking people. Every teaching lives on the site - external links are footnotes, not destinations." > /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/AGENT.md
```

Then any agent run from inside that folder picks it up automatically.

---

## 3. Research synthesis

Multi-source web search → write a synthesis you can paste into a proposal.

```
frqncy-harness agent "Research what's new in conscious capitalism in 2025-2026. Look at the latest Sequoia, Bessemer, Foundation Capital essays + any major B Corp news + recent academic papers. Synthesize into a 3-paragraph brief I could paste into a FRQNCY revenue model proposal. Save to /tmp/research-conscious-capitalism.md." --model openrouter/openrouter/free --yolo
```

What you'll get: a markdown file with the brief, plus the trace shows you which sources it used (so you can verify each claim).

---

## 4. Daily check-in

Agent reads your last week's traces, summarizes what you've been thinking about, suggests connections.

```
frqncy-harness agent "Read every JSONL file in ~/.frqncy-harness/traces/ from the last 7 days. Summarize the main themes of my conversations. Identify three threads that keep recurring. Suggest one meta-question I should sit with this week. Save to /tmp/weekly-check-in.md." --model claude-code/sonnet
```

(Note: this works because `agent` mode uses tools, but `claude-code/sonnet` doesn't support tools — swap to `--model openrouter/openrouter/free` if it fails. Or use the API path with a real Anthropic key for prompt caching benefits.)

---

## 5. Sanctuary practice writing

Draft consciousness-practice content for the Sanctuary surface. Free via Claude Max — no token cost.

```
frqncy-harness chat "Write a 200-word morning practice for FRQNCY's Sanctuary surface. The reader is someone in their 20s-30s going through a transition, looking for grounding. Use second-person, present-tense, no jargon. Avoid spiritual cliches. Frame the practice as an experiment, not a prescription." --model claude-code/sonnet
```

For multi-turn refinement, use the REPL:

```
frqncy-harness repl --model claude-code/sonnet
```

Then iteratively: type the request, get the draft, type "make it more grounded, less abstract" etc.

---

## 6. Source-finding for proposals

When you're drafting a proposal and need a citation. Use Tavily-backed agent.

```
frqncy-harness agent "I am writing a FRQNCY proposal that claims 'agent infrastructure is the next trillion-dollar platform layer per multiple major VCs.' Find the three strongest source links I should cite (Sequoia, Bessemer, Foundation Capital, Andreessen Horowitz, etc.) and write the citations as Markdown footnotes I can paste in." --model openrouter/openrouter/free --yolo
```

---

## 7. Code review on FRQNCY website code

The agent has bash + file + grep + glob — it can read code and propose changes.

```
frqncy-harness agent "Look at /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/v2/explore.html. Find any links that look broken (404 candidates). Web-fetch each and verify. Save a report of broken links to /tmp/broken-links.md." --model openrouter/openrouter/free --yolo
```

---

## 8. Conversation replay (test how new models do on old work)

Pick a past conversation that you weren't satisfied with, replay it through a different/newer model:

```
frqncy-harness replay 5cfb5cba-376c-4571-874c-576b8d2ebfa6 --model openrouter/anthropic/claude-sonnet-4
```

(`replay` is wired in the codebase but currently a v0.5 polish item — verify with `frqncy-harness --help` before relying on it. If it's not there yet, just paste the original prompt with `--model X` to compare.)

---

## 9. Use Cowork (this app) as the planning surface, harness as the execution surface

Best division of labor:
- **Cowork** for high-level conversation, planning, doc co-authoring (where I, Claude, am)
- **Harness** for repeatable agent runs you want traced + auditable (cron-like jobs, batch work, things you want to grep later)

Example: I help you draft a research plan in Cowork. You then run the actual research as a `frqncy-harness agent` job. The plan stays in Cowork (and in `proposals/`), the execution gets traced.

---

## 10. Connect FRQNCY data via MCP (high leverage, requires building)

The pattern from HARNESS-PLAN.md decision 6: build an MCP server that exposes FRQNCY content (search.json + resources.json + the explore graph). Then ANY agent — yours through the harness, Claude Desktop, Cursor — can query FRQNCY content uniformly.

Sketch:
1. Build a small Node MCP server at `/FRQNCY WEBSITE/mcp-server/` that wraps the JSON files + offers tools like `search_topics(query)`, `get_resources(topic_id)`, etc.
2. Add it to `~/.frqncy-harness/mcp.json`:

```
frqncy-harness mcp add frqncy-content node /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/mcp-server/index.js
```

3. Now agents can search FRQNCY content as a tool:

```
frqncy-harness agent "Use the FRQNCY search tool to find topics related to 'breath work'. For each, find one new resource via web_search and propose adding it." --yolo
```

This is probably the single highest-leverage extension — turns FRQNCY's content into a tool surface for any model.

---

## Quick reference: which model for which job

| Job | Recommended model | Why |
|---|---|---|
| Casual chat / brand voice review | `claude-code/sonnet` | Free via Max, top quality |
| Research, synthesis, drafting | `claude-code/sonnet` (chat) | Same |
| Multi-step agent with tools | `openrouter/openrouter/free` | Free, auto-routes to working free model |
| Heavy agent / important work | `openrouter/anthropic/claude-sonnet-4` | $$$ but reliable + tool-capable |
| Code-heavy agent | `openrouter/qwen/qwen3-coder:free` | Designed for coding tools, free |
| Reasoning-heavy task | `openrouter/deepseek/deepseek-r1:free` | Shows full chain-of-thought, free |
| Cheap fallback | `openrouter/google/gemini-2.5-flash` | Pennies per call, very fast |
| OpenAI-flavored work | `codex/default` | Free via ChatGPT Pro |
