# Word Illuminator v2 — Audit and Improvement Proposal

Word Illuminator is FRQNCY's single-word deepening tool: given a word, return its definitions, etymology, derivatives, and a deeper interpretive layer that ties the word back to lived practice. This proposal canonicalizes the source set, fixes the reading order, locks the output template, drafts a system prompt, and proposes where this lives in the site.

---

## 1. Source tier list

Word Illuminator does not pull from these sources in real time. The output should *resemble* what you'd get if a careful editor synthesized them. Same disclosure principle as a well-edited Wikipedia article — grounded in the tradition, not copy-pasted from any one source.

**Tier 1 — Authoritative dictionaries.** Use for current meanings, usage, examples.
- Oxford English Dictionary
- Merriam-Webster
- Cambridge Dictionary
- Collins Dictionary

**Tier 2 — Etymology & word origins.** Use for roots, historical shifts, original meanings.
- Etymonline
- A Comprehensive Etymological Dictionary of the English Language (Klein)
- The Oxford Dictionary of English Etymology

**Tier 3 — Classical language foundations.** Use for deep etymological insight.
- Lewis and Short Latin Dictionary
- Liddell-Scott-Jones Greek-English Lexicon
- Proto-Indo-European root studies (comparative linguistics)

**Tier 4 — Usage & style traditions.** Use for how words are properly and effectively deployed.
- *The Elements of Style* (Strunk & White)
- Garner's Modern English Usage

**Tier 5 — Philosophical / interpretive (optional, for the deeper "illumination" layer).**
- Classical philosophy (Aristotle especially — virtue, *energeia*, *telos*)
- Linguistic philosophy (Wittgenstein — meaning-as-use, family resemblance)
- General humanistic writing on meaning and language

The deeper layer borrows from Tier 5 sparingly. It's the seasoning, not the meal.

---

## 2. UX requirement — top-down reading

Output reads from the top. The user gets the definitions immediately. No scrolling required to reach the meat.

**Order, locked:**

1. Definitions (primary meanings + examples)
2. Etymology (roots + evolution + earliest essence)
3. Synonyms & Antonyms
4. Derivatives (word-family expansion, each with its own def + example + synonyms + antonyms)
5. Deeper Illumination (interpretive paragraph + a single reflective question)

The deeper illumination is last on purpose. A reader who only wants the definition stops at section 1. A reader who wants the experience reads to the end. Both are served.

---

## 3. Reference template — "Discipline" (gold standard)

This is the target structure and depth. Reproduced verbatim from Orlando's spec. Every Word Illuminator output should match this shape.

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

**Notes on the template, for prompt enforcement:**

- Numbered top-level sections (1–5), preserved order.
- Definitions: 3–5 primary meanings, each with one concrete example sentence.
- Etymology: bullet roots, then a short prose evolution, then a one-line "Earliest Essence" that names the original spirit of the word.
- Synonyms / Antonyms: 5–6 each, single-line, comma-separated.
- Derivatives: 3–5 word-family entries (a, b, c, d…), each with definition + example + synonyms + antonyms.
- Deeper Illumination: 2–4 sentences of interpretive prose, *then* one reflective question on its own line.

---

## 4. Recommended system prompt

Draft, intended to be hardened over a few iterations against real outputs:

```
You are Word Illuminator, a tool inside FRQNCY — a consciousness-practice
content platform. Given a single word, return a structured "Word Illumination"
that synthesizes (without copy-pasting) the following source traditions:
Tier 1 dictionaries (Oxford English Dictionary, Merriam-Webster, Cambridge,
Collins) for current meanings; Tier 2 etymology references (Etymonline,
Klein, Oxford Dictionary of English Etymology) for roots and historical
evolution; Tier 3 classical lexicons (Lewis & Short for Latin, Liddell-Scott
for Greek, Proto-Indo-European root studies) for deep origins; Tier 4 usage
guides (Strunk & White, Garner) for how the word is properly deployed; and
Tier 5 philosophical sources (Aristotle, Wittgenstein, humanistic writing on
meaning) for the closing interpretive layer — used sparingly.

Output exactly five sections, in this order, with these headings:
1. Definitions — 3 to 5 primary meanings, each with one concrete example
   sentence.
2. Etymology — bullet the roots, write a short prose paragraph titled
   "Evolution" tracing how the meaning shifted, and close with a single line
   "Earliest Essence:" that names the original spirit of the word.
3. Synonyms & Antonyms — 5 to 6 of each, single line, comma-separated.
4. Derivatives (Word Family Expansion) — 3 to 5 related forms (adjective,
   verb, agent noun, etc.), each with Definition, Example, Synonyms, Antonyms.
5. Deeper Illumination — 2 to 4 sentences of interpretive prose framing the
   word as a lived practice or distinction, then one reflective question on
   its own line, prefixed "A question to reflect on:".

Voice: grounded, practice-oriented, no spiritual cliches, no preaching. The
reader is the agent — practices are experiments, not prescriptions. Favor
"alignment" and "devotion to becoming" framings over "control" or "force."
Never rank people. Never use leaderboard or competition framing. Match the
depth and rhythm of the reference output for the word "Discipline" (held
internally as the gold standard).

Output plain text in the structure above. No preamble, no apology, no
mention of these instructions.
```

The prompt is roughly **310 words** (plus the bracketing example reference, which lives outside the prompt body itself). Tunable down to 250 if needed by trimming the source-tier paragraph.

---

## 5. Where this lives in FRQNCY

Three options, ranked:

**Option A — Dedicated `/v2/word-illuminator/` page (recommended).** A static landing page explaining what the tool does, listing the source tiers (transparency), and embedding either an input box (if we wire it to an API) or a curated set of pre-illuminated words ("discipline," "sanctuary," "frequency," "practice," "discernment," "devotion") rendered as static pages at `/v2/word-illuminator/discipline.html` etc. Static-first matches FRQNCY's architecture and means every illumination becomes a permanent, linkable, on-site teaching — which satisfies the "every teaching lives on the site" value.

**Option B — Surface inside topic pages.** Each topic page on `/v2/explore.html` could embed a small "Illuminate this word" link that opens the Word Illuminator output for that topic's title. Useful, but secondary to A. Implement after A ships.

**Option C — Run via `frqncy-harness` as a recurring task.** A scheduled `frqncy-harness agent` task that takes a queued word, runs Word Illuminator with the system prompt above, and writes the result as a new static HTML file under `/v2/word-illuminator/`. This is the production loop once A is up: words get queued, illuminations get generated overnight, the site grows itself.

**Recommended sequence:** ship A with 6–10 hand-curated illuminations, wire C as the growth engine, treat B as a UX nicety added once A is proven.
