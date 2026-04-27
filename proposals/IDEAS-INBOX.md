# FRQNCY Ideas Inbox

A rolling dump of accumulated ideas, tasks, content additions, and roadmap notes. Newest entries at the top.

Each entry stays here until it's actioned (turned into a real task / proposal / commit) or explicitly retired. Cross-link to the resulting work when actioned (e.g., "→ implemented in `proposals/HARNESS-PLAN.md` decision 12").

---

## 2026-04-27 — Orlando dump

### A. Word Illuminator optimizations

Word Illuminator is a FRQNCY tool/feature (deepens understanding of a single word — definitions, etymology, derivatives, deeper interpretive layer). Optimizations Orlando wants:

#### A1. Authoritative source set

Word Illuminator should ground its output in these source traditions (synthesized — not copy-pasted):

**Tier 1 — Authoritative dictionaries:**
- Oxford English Dictionary
- Merriam-Webster
- Cambridge Dictionary
- Collins Dictionary
*(Use for: current meanings, usage, examples.)*

**Tier 2 — Etymology & word origins:**
- Etymonline
- A Comprehensive Etymological Dictionary of the English Language
- The Oxford Dictionary of English Etymology
*(Use for: roots, historical shifts, original meanings.)*

**Tier 3 — Classical language foundations:**
- Lewis and Short Latin Dictionary
- Proto-Indo-European root studies (comparative linguistics)
*(Use for: deep etymological insights.)*

**Tier 4 — Usage & style traditions:**
- *The Elements of Style*
- Garner's Modern English Usage
*(Use for: how words are properly and effectively used.)*

**Tier 5 — Philosophical / interpretive (optional, for the deeper "illumination" layer):**
- Classical philosophy (e.g., Aristotle)
- Linguistic philosophy (e.g., Ludwig Wittgenstein)
- General humanistic writing on meaning and language

Important note: Word Illuminator does NOT pull from these in real time. The output should resemble what you'd get if you synthesized these traditions together into one structured explanation. (Same disclosure principle as a well-edited Wikipedia article.)

#### A2. UX — top-of-page reading

When prompting Word Illuminator, the user should read the output **from the top** — no need to scroll down to get to the meat. Lead with the definitions and the most-likely-needed sections; deeper illumination comes after.

#### A3. Reference output template — "Discipline"

Orlando provided a model output for Word Illuminator on the word **Discipline** (says he likes ChatGPT's outcome a lot more — wants to cross-reference our output to this template):

```
Word Illumination: Discipline

1. Definitions

Primary Meanings:
  1. Training to act in accordance with rules; self-control
     - Example: Through daily meditation, she cultivated discipline over her thoughts.
  2. A system of rules governing behavior or activity
     - Example: Military discipline demands obedience and precision.
  3. Punishment intended to correct or train
     - Example: The teacher used discipline not to shame, but to guide improvement.
  4. A branch of knowledge or field of study
     - Example: Philosophy is a discipline that explores existence and truth.

2. Etymology

  - From Latin disciplina — meaning instruction, knowledge, training
  - Derived from discipulus — student, learner
  - Root verb: discere — to learn

  Evolution: Originally, discipline did not carry the rigid or punitive tone it often has today.
  It was rooted in the sacred relationship between teacher and student — an act of learning,
  of willingly submitting oneself to growth.

  Earliest Essence: Not control — but devotion to learning.

3. Synonyms & Antonyms

  Synonyms: Self-control, Order, Regulation, Training, Restraint, Mastery
  Antonyms: Chaos, Indulgence, Negligence, Disorder, Impulsiveness

4. Derivatives (Word Family Expansion)

  a. Disciplined (adjective)
     Definition: Showing self-control; trained to follow rules or a regimen
     Example: He is a disciplined athlete, never missing a morning workout.
     Synonyms: controlled, focused
     Antonyms: erratic, undisciplined

  b. Discipline (verb)
     Definition: To train or develop by instruction and practice; to correct behavior
     Example: She disciplined herself to write every day, regardless of mood.
     Synonyms: train, condition
     Antonyms: neglect, spoil

  c. Disciplinarian (noun)
     Definition: A person who enforces rules or advocates strict discipline
     Example: The coach was a strict disciplinarian, but deeply respected.
     Synonyms: enforcer, strict authority
     Antonyms: lenient person, permissive guide

  d. Disciplinary (adjective)
     Definition: Relating to discipline or enforcement of rules
     Example: The company took disciplinary action after repeated violations.
     Synonyms: corrective, regulatory
     Antonyms: permissive, tolerant

5. Deeper Illumination

  To embrace discipline is not to cage oneself — but to choose a path repeatedly,
  even when the mind resists. It is the bridge between intention and embodiment.
  At its highest form, discipline is not force — it is alignment.

  A question to reflect on: Is your discipline driven by fear… or by devotion to who you are becoming?
```

**Action items:**
- [ ] Review current Word Illuminator output against this template
- [ ] Update prompt / system instructions to enforce the source set in A1 and the structure in A3
- [ ] Verify output reads top-to-bottom without requiring scrolling for the answer

---

### B. Content additions (FRQNCY website)

#### B1. Crypto topic — slogans + values

- [ ] Add slogan "**Crypto is freedom technology**" prominently on `/v2/crypto/`
- [ ] Add the values of Bitcoin: **borderlessness, immutability, censorship resistance, permissionless, scarcity, transparency** (and others as we name them)
- [ ] List **all the good things crypto provides** — financial sovereignty, banking the unbanked, programmable money, etc.
- [ ] Lead readers to the **good projects and good people** in crypto
- [ ] Integrate **Ethos** as a featured project (per Orlando's longstanding interest)
- [ ] Set up a call with **Ethos founders**
- [ ] Set up a call with **Obi** (FRQNCY-aligned)

#### B2. Money topic — Mike Maloney content

- [ ] Add the **attributes of money** as described by Mike Maloney
- [ ] Add the **money vs currency** distinction (one of his core teachings)
- [ ] Add **"Hidden Secrets of Money"** series to FRQNCY's domains/watch (potentially `frqncy.network/watch` or wherever curated video content lives)

#### B3. Books — Kevin Trudeau additions

- [ ] Add all Kevin Trudeau books, including:
  - *YWIYC* (*Your Wish Is Your Command*)
  - *Gurukev* / Trudeau's "GuruKev" content
  - *The Book of Secrets*
- [ ] Other Trudeau titles he's authored (need to enumerate the canon)

---

### C. Editorial values (reminders for ALL content)

These are guideposts to apply across everything generated for FRQNCY:

- **Everything needs to be on the website and stay there down the road if possible.** Re-affirms the "every teaching lives on the site" principle from `CLAUDE.md`.
- **Spiritual technology vs spiritual materialism** as a distinction worth surfacing. (Chögyam Trungpa's framing — *spiritual materialism* is the trap of using spiritual practice to inflate the ego rather than dissolve it.)
- **Cooperation and winning systems.** Reinforces `feedback_frqncy_values` memory: cooperation over competition.
- **Slogans / one-liners worth canonicalizing:**
  - "FRQNCY makes the unable able"
  - "FRQNCY empowers the empowering"

These should:
- [ ] Land somewhere visible on the site (homepage tagline rotation? About page? Footer?)
- [ ] Get woven into Word Illuminator's "deeper illumination" tone and the Sanctuary surface

---

### D. Roadmap — FRQNCY

#### D1. DeAI (decentralized inference) future

- [ ] Add to roadmap: at some point we want to run on **DeAI** — projects like:
  - **Chutes** (decentralized inference network)
  - **Templar's Covenant** (decentralized model training/inference)
- [ ] Track maturity of these networks; flip when they're production-grade
- [ ] Maps to existing thinking about Nous Research / Psyche (HARNESS-RESEARCH-NOTES.md)

---

### E. Roadmap — Harness / CLI tooling

#### E1. Read + integrate Claude Code's Skills + Hooks

- [ ] Read https://code.claude.com/docs/en/skills — Claude Code's Skills system
- [ ] Read https://code.claude.com/docs/en/hooks — Claude Code's Hooks system
- [ ] Update `proposals/HARNESS-PLAN.md` if any of those primitives should be mirrored into `@frqncy/harness`
- [ ] Especially: Skills could map to a Voyager-style auto-skill library (down-the-road v3 already noted) — this is reference material for that

#### E2. iTerm 2 (split views)

- [ ] Download iTerm 2 → `https://iterm2.com/`
- [ ] Use split views to run multiple `frqncy-harness agent` processes side-by-side, watch traces, etc.

#### E3. Claude SDK independent agents

- [ ] Use **Claude Agent SDK** (the renamed Claude Code SDK) to spawn independent agents that run in parallel
- [ ] Patterns: research-agent + writer-agent + reviewer-agent each with their own context and traces
- [ ] Maps to `agent` command potentially gaining a `--parallel <N>` mode in v0.6+

#### E4. Codex MCP + Opus 5.5

- [ ] **(Clarify intent):** "Codex MCP with Opus 5.5" — possibilities:
  - Use OpenAI's Codex CLI as an MCP server (Codex itself exposing tools to other clients)?
  - Wire Codex up to use Claude Opus 5.5 via the Anthropic API as the underlying model?
  - Both?
- [ ] Note: Opus 5.5 is Anthropic's frontier model; Codex is OpenAI's CLI. Cross-pollination might mean using Codex's UX with Anthropic's brain via API.
- [ ] Investigate when Opus 5.5 is current and what's possible.

#### E5. Efficiency boosters — investigate + integrate when sensible

- [ ] **gtr (`coderabbitai/git-worktree-runner`)** — already integrated as the harness sandbox (decision 5). ✓
- [ ] **Caveman (`juliusbrussee/caveman`)** — investigate what it does, when it helps. (Likely a context-management or prompt-optimization tool given the name implies "raw / minimal".)
- [ ] **Neo4j** (`neo4j.com`) — graph database. Candidate for the bi-temporal context-graph layer (down-the-road v2+ in HARNESS-PLAN.md). Pair with Graphiti? Or use directly?
- [ ] For each, document: **what it does, when to use it, what it replaces**, and add to `proposals/HARNESS-PLAN.md` down-the-roads index

---

### F. Daemon deployments

#### F1. OpenClaw setup for Telegram

- [ ] Install/configure **OpenClaw** with a Telegram gateway
- [ ] Wire `@frqncy/harness` as the brain inside OpenClaw
- [ ] Test: send a Telegram message → harness responds with a real `chat` or `agent` run

#### F2. Hermes setup for Telegram

- [ ] Install **Hermes Agent** with Telegram gateway (per existing `hermes-skill.md` in the harness repo)
- [ ] Wire `@frqncy/harness` as a Hermes skill (already documented in `hermes-skill.md`)
- [ ] Confirm: messages routed via Hermes hit the harness, get traced, return responses
- [ ] Compare OpenClaw vs Hermes — which has better Telegram UX, better daemon stability, easier to maintain — and pick one for production

---

## How to use this inbox

1. **New ideas** → add to top, date-stamped, categorized
2. **Actioning** → move to a real proposal doc (`HARNESS-PLAN.md` for harness, `HARNESS-USE-CASES.md` for use cases, `REVENUE-MODEL.md` for revenue, etc.) AND mark the inbox item with `→ moved to proposals/X.md` so we can audit what got actioned
3. **Retiring** → strike through with a one-line note explaining why retired

This file should grow over time. Don't delete entries — strike them through. The history is the point.
