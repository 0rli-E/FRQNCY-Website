# Word Illuminator — AI Worker

**Status:** shipped 2026-04-29 (Phase 2, Week 4, Wed of `EXECUTION-PLAN-90D.md`).
**Endpoint:** `/illuminator/word`
**File:** `functions/illuminator/word.js`
**Widget:** `assets/word-illuminator-widget.js`
**Reference:** `proposals/WORD-ILLUMINATOR-V2.md` (locked 5-section template), `prompts/word-illuminator.md` (canonical voice), `proposals/FRQNCY-VOICE-PLAYBOOK.md` (banished phrases).

The hand-curated illuminations under `/v2/word-illuminator/<word>/` remain canonical. The worker exists for the moment a reader wants to illuminate a word the shelf has not yet reached. Curated and generated coexist on every page.

---

## Endpoint

```
GET  /illuminator/word?word=<x>      → JSON
POST /illuminator/word { word: <x> } → JSON
OPTIONS                               → 204 + CORS
```

CORS allowlist: `https://frqncy.network`, `https://frqncy-website.pages.dev`, plus any `*.frqncy-website.pages.dev` preview deploy. All other origins receive the canonical `frqncy.network` header — requests still pass, but cross-origin reads are blocked from third-party sites.

`word` is normalised to lowercase. `WORD_RE = /^[A-Za-z0-9-]{1,30}$/` — anything else is rejected with 400. This bounds model cost and keeps the URL space clean for edge caching.

## Response schema

The worker always emits the locked five sections, in order:

```jsonc
{
  "word": "discipline",
  "definitions": [
    { "sense": "...", "example": "..." }     // 3–5 entries
  ],
  "etymology": {
    "roots": "From Latin disciplina — instruction...\nDerived from discipulus...\nRoot verb: discere — to learn.",
    "evolution": "Originally...",            // short paragraph
    "earliest_essence": "Not control — but devotion to learning."
  },
  "synonyms_antonyms": {
    "synonyms": ["..."],                     // 5–6 each
    "antonyms": ["..."]
  },
  "derivatives": [                           // 3–5 entries
    {
      "word": "...",
      "part_of_speech": "noun | verb | adjective | adverb",
      "definition": "...",
      "example": "...",
      "synonyms": ["..."],
      "antonyms": ["..."]
    }
  ],
  "deeper_illumination": {
    "prose": "2–4 sentences of present-tense, declarative interpretive prose.",
    "reflective_question": "A real second-person question."
  }
}
```

Failed parses are coerced rather than thrown. The validator fills missing fields with empty strings / arrays so the front-end can render a partial illumination without exploding. A regex fallback extracts the basics from prose if the model ignores the JSON instruction entirely — defensive, not relied on.

## Prompt strategy

System prompt is inlined in `word.js` (because Pages Functions only bundle files inside `/functions/`). The canonical source still lives at `prompts/word-illuminator.md`; that file is the source of truth for voice. When voice rules change, edit the markdown first, then mirror the relevant clauses into `word.js`.

The structured-output prompt differs from the conversational chat prompt in three ways:

1. **JSON enforcement.** The schema is described in full inside the system prompt with `OUTPUT FORMAT — strict JSON only`, ending with `Output the JSON object and nothing else.` Workers AI does not yet support a `response_format: json_schema` parameter for Qwen3, so enforcement is prompt-level. The parser handles ```json fences, leading/trailing prose, and `<think>` blocks.
2. **No glyphs.** The conversational illuminator uses ✧ in titles. The structured output is plain JSON — strings have no markdown, no asterisks, no glyphs.
3. **Tighter temperature.** `temperature: 0.6` (vs 0.7 for chat) — slightly more conservative for shape stability.

Voice rules carried verbatim from the playbook:

- **British English locked.** Spellings: behaviour, recognise, organisation. Punctuation: single quotes outermost, em dashes for rhythm.
- **Present tense, declarative shortness.** Triads where natural. No academic hedging.
- **Abundance frame.** The reader is the agent. Practices are experiments, never prescriptions.
- **Banished phrases (refused even if the input word is one of them — illuminate neutrally and critically):** wellness, vibes, manifest (as verb), level up, soul food, hustle, do the work, dive in, game-changer, vibrate higher, unlock your potential, high-vibe, journey (as life metaphor).
- **No spiritual cliches.** "Alignment" and "devotion to becoming" are preferred over "control" or "force". Never rank people. No leaderboard or competition framing.
- **The reflective question is a real question.** Not rhetorical, not a thinly-veiled prescription.

If etymology is uncertain (rare, invented, or compound words), the prompt instructs `"The roots suggest…"` rather than fabrication.

## Rate limit

In-memory bucket per `CF-Connecting-IP`, **5 requests per minute per IP**. Tighter than the chat endpoint's 20/min because each illumination is a 2k-token structured generation — costlier per call — and the 24h edge cache absorbs repeated lookups of the same word anyway.

**Fail-closed on missing IP.** If `CF-Connecting-IP` and `X-Forwarded-For` are both absent, the bucket lookup returns rate-limited rather than open. This prevents spoofed/missing headers from bypassing the limiter. Same pattern as `functions/api/chat.js`.

If `env.AI` is missing → 500 with a clear error message naming the binding to add.

## Edge cache

```
Cache-Control: public, max-age=86400, s-maxage=86400
Vary: Origin
```

24 hours at the edge. Illuminations are deterministic enough at `temperature=0.6` that a re-fetch of the same word within a day should serve the same output, and there is no good reason to regenerate. Different `?word=` query strings cache independently.

The hand-curated pages are static HTML and unaffected.

## Front-end widget

`assets/word-illuminator-widget.js` — vanilla, no framework, no dependencies. ~270 lines including styles. Self-injects a single `<style>` block, then auto-mounts.

Where it mounts:

- **Five of the six illumination pages** (sanctuary, frequency, practice, discernment, devotion) — placeholder `<div data-word-illuminator-widget data-current-word="<word>"></div>` is dropped after `Related illuminations`. The widget renders an "Illuminate again — or try a different word" panel; clicking the page's own word fills the input and re-runs the live worker for comparison.
- **Discipline page** — keeps its bespoke inline `Compare → Illuminate again with AI` block (already shipped, framing matches the page's gold-standard role). Not converted to the shared widget to avoid breaking commissioned content.
- **Landing page** — keeps its existing inline `Illuminate any word` form. Already wired to the same endpoint; no change needed.

Renderer: JSON → DOM into the locked 5-section template. All output strings are HTML-escaped. CSS variables (`--gold`, `--navy`, `--cream`, etc.) inherit from the host page when present, with sensible fallbacks for any future page that loads the script standalone.

Failure mode: a friendly status line ("The Illuminator is resting — try again in a moment.") on any non-200 response or network error. The button re-enables; the user can retry.

## Voice constraints — rendered into the UX itself

- The widget is always framed as "a working illumination — generated, not curated. The page above is the canonical reference." Experiment, not prescription.
- Status copy uses present-tense verbs: "Illuminating…", not "Generating your insight…".
- Headline on per-word pages: "Illuminate again — or try a different word." On the landing page (existing inline form): "Try one not on the shelf."
- Reflective question is rendered with the label "A question to reflect on" — same label used in the curated pages, so the form reads continuously.

## Files

- `functions/illuminator/word.js` — Pages Function. Updated rate limit 10 → 5/min/IP this commit.
- `assets/word-illuminator-widget.js` — new. Shared widget, vanilla JS.
- `v2/word-illuminator/{sanctuary,frequency,practice,discernment,devotion}/index.html` — placeholder + `<script>` tag added.
- `v2/word-illuminator/discipline/index.html` — unchanged (has bespoke inline widget).
- `v2/word-illuminator/index.html` — unchanged (has inline form, already wired).
- `prompts/word-illuminator.md` — unchanged. Canonical voice source.

## What was deliberately not built

- **Worker-generated permanent pages.** Per `WORD-ILLUMINATOR-V2.md` Option C, the production loop is a `frqncy-harness` agent task that takes a queued word, runs the worker, and writes the output as a static HTML file under `/v2/word-illuminator/`. That is a separate piece of work — Phase 4 territory.
- **Caching keyed on a hashed prompt.** Edge cache keyed on the URL is enough for now. Persistent KV cache (per-word, with version stamp tied to prompt revisions) is a Phase 4 improvement once the worker has live traffic.
- **A `response_format` parameter.** Workers AI does not currently expose JSON-schema enforcement for Qwen3. Prompt-level enforcement plus the regex/parser fallback is the floor; upgrade when the platform supports it.
- **Telemetry.** No client-side analytics on widget usage in this pass. Add a simple counter to `BACKEND-STATUS.md` flow when traffic warrants it.
