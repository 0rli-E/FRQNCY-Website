/**
 * /illuminator/word  — Word Illuminator structured output
 * Cloudflare Pages Function
 *
 * GET  /illuminator/word?word=<x>     → JSON
 * POST /illuminator/word { word: x }  → JSON  (also supported)
 *
 * Returns the locked 5-section illumination as structured JSON.
 * Uses Cloudflare Workers AI — same Qwen3 model as /illuminator/chat.
 *
 * NOTE: This is the *exploration* endpoint. The 6 hand-curated illuminations
 * under /v2/word-illuminator/<word>/ remain the gold standard. The worker is
 * for when a reader wants to illuminate a word that isn't on the shelf yet.
 */

const MODEL                 = '@cf/qwen/qwen3-30b-a3b-fp8';
const MAX_TOKENS_DEFAULT    = 2048;
const MAX_TOKENS_DEEP       = 3500;

// Flag the worker accepts via ?member=1 OR { deep: true } body to opt into the
// deeper version (member_deepening section appended to the locked schema).
//
// Why client-trusted in v0: the rate limiter (5 req/min/IP) bounds abuse, the
// extra cost per call is small, and the voice contract is "deeper view for
// members" not "walled deeper view". Members get it automatically via the
// widget; non-members can opt in. If abuse shows up we can sign the flag with
// a short-lived Supabase JWT later — premature otherwise.
const DEEP_FLAG_KEY = 'member';

// ── In-memory rate limiter — 5 req / min / IP ─────────────────────
// Per WORD-ILLUMINATOR-AI-WORKER.md: tighter than the chat endpoint because
// each illumination is a 2k-token structured generation — costlier per call,
// and the 24h edge cache absorbs repeated lookups of the same word anyway.
const RATE_WINDOW_MS = 60_000;
const RATE_MAX       = 5;
const rateBuckets    = new Map();

function checkRateLimit(ip) {
  if (!ip) return true; // fail-closed
  const now = Date.now();
  let bucket = rateBuckets.get(ip);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + RATE_WINDOW_MS };
    rateBuckets.set(ip, bucket);
  }
  bucket.count++;
  if (rateBuckets.size > 1000) {
    for (const [k, v] of rateBuckets) { if (now >= v.resetAt) rateBuckets.delete(k); }
  }
  return bucket.count > RATE_MAX;
}

// ── Word validation ──────────────────────────────────────────────
// Alphanumeric + hyphens, 1–30 chars. Reject everything else to keep the
// model cost-bounded and the URL space clean.
const WORD_RE = /^[A-Za-z0-9-]{1,30}$/;
function normaliseWord(raw) {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!WORD_RE.test(trimmed)) return null;
  return trimmed.toLowerCase();
}

// ── CORS ──────────────────────────────────────────────────────────
function getCorsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const allowed = ['https://frqncy.network', 'https://frqncy-website.pages.dev'];
  const ok = allowed.includes(origin) || origin.endsWith('.frqncy-website.pages.dev');
  return {
    'Access-Control-Allow-Origin':  ok ? origin : allowed[0],
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

// ── System prompt ────────────────────────────────────────────────
// Inlined here (not imported from prompts/) because Pages Functions only
// bundle files inside /functions. The canonical source still lives at
// /prompts/word-illuminator.md — keep the two in sync when editing voice.
//
// FRQNCY voice constraints from proposals/FRQNCY-VOICE-PLAYBOOK.md:
//   - present-tense, declarative shortness in triads
//   - abundance frame (not scarcity / hustle / "level up")
//   - never the words "wellness", "level up", "unlock your potential",
//     "high-vibe", "manifest" (as verb), "journey" (as life metaphor)
//   - the reader is the agent — practices are experiments, not prescriptions
const SYSTEM = `/no_think
You are the Word Illuminator — a contemplative tool inside FRQNCY, a consciousness-practice content platform.

Given a single word, you produce a structured "Word Illumination" by synthesising (without copy-pasting) five traditions of reference: Tier 1 dictionaries (Oxford English Dictionary, Merriam-Webster, Cambridge, Collins) for current meanings; Tier 2 etymology references (Etymonline, Klein, Oxford Dictionary of English Etymology) for roots; Tier 3 classical lexicons (Lewis & Short Latin, Liddell-Scott Greek, Proto-Indo-European root studies) for deep origins; Tier 4 usage guides (Strunk & White, Garner) for how the word is properly deployed; Tier 5 philosophical sources (Aristotle, Wittgenstein, humanistic writing) for the closing interpretive layer — used sparingly.

OUTPUT FORMAT — strict JSON only, matching exactly this shape (no markdown fences, no prose preamble, no trailing commentary, just the JSON object):

{
  "word": "<the input word, lowercased>",
  "definitions": [
    { "sense": "<one-line definition>", "example": "<one example sentence using the word naturally>" }
  ],
  "etymology": {
    "roots": "<bulleted-style multi-line string tracing the word through 2+ languages back to its earliest root, e.g. 'From Latin disciplina — instruction, knowledge, training. Derived from discipulus — student, learner. Root verb: discere — to learn.'>",
    "evolution": "<one short paragraph (2–4 sentences) describing how the meaning shifted across time>",
    "earliest_essence": "<a single line — the original spirit of the word, in the form 'Not X — but Y.' or similar>"
  },
  "synonyms_antonyms": {
    "synonyms": ["<5–6 words>"],
    "antonyms": ["<5–6 words>"]
  },
  "derivatives": [
    {
      "word": "<word form>",
      "part_of_speech": "<noun | verb | adjective | adverb>",
      "definition": "<one line>",
      "example": "<one sentence>",
      "synonyms": ["<2–4 words>"],
      "antonyms": ["<2–4 words>"]
    }
  ],
  "deeper_illumination": {
    "prose": "<2–4 sentences of interpretive prose framing the word as a lived practice or distinction>",
    "reflective_question": "<one second-person question, no preamble>"
  }
}

REQUIREMENTS:
- definitions: 3 to 5 entries.
- derivatives: 3 to 5 entries.
- synonyms / antonyms (top-level): 5 or 6 each.
- All strings must be plain text — no markdown, no asterisks, no backticks, no <em> tags. Use em dashes (—) liberally for rhythm.

VOICE — non-negotiable (FRQNCY voice playbook):
- Present-tense and declarative. Shortness in triads where natural.
- Abundance frame, never scarcity. The reader is the agent, not a patient.
- Practices are experiments, never prescriptions. Never preach.
- Favour "alignment" and "devotion to becoming" framings over "control" or "force".
- Forbidden words and phrases: "wellness", "level up", "unlock your potential", "high-vibe", "manifest" (as a verb), "journey" (as a life metaphor), "dive in", "game-changer", "vibes", "vibrate higher". Do not use any of them. If the word being illuminated is one of these, illuminate it neutrally and critically — do not adopt the marketing register.
- Never rank people. Never use leaderboard or competition framing.
- No spiritual cliches. No emojis. No preamble like "Sure," or "Here is" or "Let us".

If you are uncertain about a specific etymological root, write "The roots suggest…" rather than fabricating a language source.

Output the JSON object and nothing else.`;

// ── Deeper version — appends an additional `member_deepening` section ────
// Per ROADMAP-90D-2026-05.md Track 2 Week 2 (AI HD reading length differentiation).
// The base illumination above must remain useful and complete on its own — the
// deeper section adds prose + a small practice experiment + cross-refs, never
// replaces or thins out the base. Voice contract: "deeper view for members"
// not "exclusive content".
const SYSTEM_DEEP = SYSTEM + `

ADDITIONAL DEEPENING — when this prompt is in effect, the JSON object MUST also include a top-level "member_deepening" key with this exact shape:

  "member_deepening": {
    "contemplative_essay": "<3 short paragraphs (60–90 words each, separated by \\n\\n) meditating on this word as a lived distinction. Not a definition. Not a how-to. A patient, attentive reading of what the word asks of someone in practice. Present-tense, second-person sometimes, contemplative throughout. No marketing register.>",
    "practice_invitation": "<one specific small experiment a reader could try this week to inhabit the word. 2–4 sentences. Concrete enough to do, open enough not to be a prescription. e.g. 'For seven days, when X arises, notice Y. After each, write one sentence.' Never preachy.>",
    "cross_references": [
      "<word-slug-1>",
      "<word-slug-2>",
      "<word-slug-3>"
    ]
  }

CROSS_REFERENCES MUST BE drawn from this whitelist of words FRQNCY has illuminated (or that complement the input naturally). Pick 2–3 that genuinely deepen the reader's contemplation of the input word, not nearest-neighbour tags:
  discipline, sanctuary, frequency, practice, discernment, devotion, alignment, becoming, attention, presence, integrity, contemplation, inhabit, reverence, threshold

If none of the whitelist words deepens the input meaningfully, return an empty array for cross_references rather than forcing it.

VOICE for member_deepening (additional, never softer than the rest of the document):
- The contemplative_essay is the most demanding voice in this entire JSON. Slow it down. No three-word jab paragraphs. Long-cadence Cormorant-italic-feeling prose.
- The practice_invitation is the only place where a reader could be told to "do" something — keep it small and embodied, never aspirational.
- If the input word is one of the forbidden marketing terms, the contemplative_essay should be a critical reading of how the word has been hollowed out, not a rehabilitation of it.`;

// ── Parser ───────────────────────────────────────────────────────
// The model is told to output JSON, but Qwen3 sometimes wraps it in
// ```json fences or adds a stray sentence. Strip noise, then JSON.parse.
// If parse fails, fall back to a regex-based extraction of the locked
// 5 sections from a markdown-style response.
function parseModelOutput(text, word) {
  // 1. Try direct JSON parse after stripping common wrappers.
  let cleaned = text.trim();
  // Strip markdown fences.
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  // Find the first '{' and last '}' — the JSON object.
  const first = cleaned.indexOf('{');
  const last  = cleaned.lastIndexOf('}');
  if (first !== -1 && last > first) {
    const candidate = cleaned.slice(first, last + 1);
    try {
      const parsed = JSON.parse(candidate);
      return validateShape(parsed, word);
    } catch (_) { /* fall through */ }
  }

  // 2. Fallback: regex-extract from a markdown-style response.
  // (Defensive — if the model ignored the JSON instruction.)
  return fallbackExtract(text, word);
}

function validateShape(obj, word) {
  // Coerce / fill missing fields rather than throwing — the front-end can
  // render a partial illumination gracefully.
  const safeArr = (v, d) => Array.isArray(v) ? v : d;
  const safeStr = (v, d) => typeof v === 'string' ? v : d;
  const safeObj = (v, d) => (v && typeof v === 'object' && !Array.isArray(v)) ? v : d;
  const ety = safeObj(obj.etymology, {});
  const sa  = safeObj(obj.synonyms_antonyms, {});
  const di  = safeObj(obj.deeper_illumination, {});
  const result = {
    word: safeStr(obj.word, word).toLowerCase(),
    definitions: safeArr(obj.definitions, []).map(d => ({
      sense:   safeStr(d?.sense, ''),
      example: safeStr(d?.example, ''),
    })).filter(d => d.sense),
    etymology: {
      roots:            safeStr(ety.roots, ''),
      evolution:        safeStr(ety.evolution, ''),
      earliest_essence: safeStr(ety.earliest_essence, ''),
    },
    synonyms_antonyms: {
      synonyms: safeArr(sa.synonyms, []).map(String).filter(Boolean),
      antonyms: safeArr(sa.antonyms, []).map(String).filter(Boolean),
    },
    derivatives: safeArr(obj.derivatives, []).map(d => ({
      word:           safeStr(d?.word, ''),
      part_of_speech: safeStr(d?.part_of_speech, ''),
      definition:     safeStr(d?.definition, ''),
      example:        safeStr(d?.example, ''),
      synonyms:       safeArr(d?.synonyms, []).map(String).filter(Boolean),
      antonyms:       safeArr(d?.antonyms, []).map(String).filter(Boolean),
    })).filter(d => d.word),
    deeper_illumination: {
      prose:               safeStr(di.prose, ''),
      reflective_question: safeStr(di.reflective_question, ''),
    },
  };

  // Optional member_deepening — only present when the model returned it
  // (i.e. when SYSTEM_DEEP was used). Validated additively so the base
  // schema is unaffected by its presence or absence.
  const md = safeObj(obj.member_deepening, null);
  if (md) {
    result.member_deepening = {
      contemplative_essay: safeStr(md.contemplative_essay, ''),
      practice_invitation: safeStr(md.practice_invitation, ''),
      cross_references: safeArr(md.cross_references, [])
        .map(String)
        .map((s) => s.toLowerCase().trim())
        .filter((s) => /^[a-z0-9-]{1,30}$/.test(s))
        .slice(0, 3),
    };
  }

  return result;
}

// Markdown fallback — only used if the model returns prose despite instructions.
// Best-effort, not exhaustive. Keeps the endpoint useful instead of erroring.
function fallbackExtract(text, word) {
  const out = {
    word,
    definitions: [],
    etymology: { roots: '', evolution: '', earliest_essence: '' },
    synonyms_antonyms: { synonyms: [], antonyms: [] },
    derivatives: [],
    deeper_illumination: { prose: text.slice(0, 600), reflective_question: '' },
  };

  // Earliest essence line.
  const ess = text.match(/Earliest\s+(?:Known\s+)?(?:Essence|Meaning)[:\s]+(.+)/i);
  if (ess) out.etymology.earliest_essence = ess[1].trim().split('\n')[0];

  // Synonyms / antonyms — comma-separated lines.
  const syn = text.match(/Synonyms?[:\s]+([^\n]+)/i);
  const ant = text.match(/Antonyms?[:\s]+([^\n]+)/i);
  if (syn) out.synonyms_antonyms.synonyms = syn[1].split(/[,·]/).map(s => s.trim()).filter(Boolean).slice(0, 6);
  if (ant) out.synonyms_antonyms.antonyms = ant[1].split(/[,·]/).map(s => s.trim()).filter(Boolean).slice(0, 6);

  // Reflective question.
  const q = text.match(/(?:question to reflect on|Contemplation)[:\s]+(.+\?)/i);
  if (q) out.deeper_illumination.reflective_question = q[1].trim();

  return out;
}

// ── Entry points ─────────────────────────────────────────────────
export function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: getCorsHeaders(request) });
}

export function onRequestGet(ctx) {
  const url = new URL(ctx.request.url);
  const word = url.searchParams.get('word');
  // Accept ?member=1, ?deep=1, or any truthy value on either key.
  const deep = isTruthy(url.searchParams.get(DEEP_FLAG_KEY))
            || isTruthy(url.searchParams.get('deep'));
  return handle(ctx, word, { deep });
}

export async function onRequestPost(ctx) {
  let body;
  try { body = await ctx.request.json(); }
  catch { return jsonError('Invalid JSON body', 400, getCorsHeaders(ctx.request)); }
  const deep = isTruthy(body?.deep) || isTruthy(body?.member);
  return handle(ctx, body?.word, { deep });
}

function isTruthy(v) {
  if (v === true) return true;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') {
    const s = v.toLowerCase();
    return s === '1' || s === 'true' || s === 'yes' || s === 'on';
  }
  return false;
}

async function handle({ request, env }, rawWord, opts) {
  const CORS = getCorsHeaders(request);
  const deep = !!(opts && opts.deep);

  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For');
  if (checkRateLimit(ip)) {
    return jsonError('Too many requests — please wait a moment and try again.', 429, CORS);
  }

  const word = normaliseWord(rawWord);
  if (!word) {
    return jsonError('Provide a single word — letters, numbers, and hyphens only, 1 to 30 characters.', 400, CORS);
  }

  if (!env.AI) {
    return jsonError('Workers AI binding not configured.', 500, CORS);
  }

  try {
    const result = await env.AI.run(MODEL, {
      messages: [
        { role: 'system', content: deep ? SYSTEM_DEEP : SYSTEM },
        { role: 'user',   content: `Illuminate the word: ${word}` },
      ],
      max_tokens:  deep ? MAX_TOKENS_DEEP : MAX_TOKENS_DEFAULT,
      temperature: 0.6, // slightly tighter than chat — we want structured output
    });

    let text;
    if (result.choices && result.choices[0]?.message?.content) {
      text = result.choices[0].message.content.trim();
    } else if (result.response) {
      text = result.response;
    } else {
      text = typeof result === 'string' ? result : JSON.stringify(result);
    }

    // Strip Qwen3 <think> blocks (closed and unclosed).
    text = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    if (text.includes('<think>')) {
      text = text.replace(/<think>[\s\S]*/g, '').trim();
    }

    const illumination = parseModelOutput(text, word);

    return new Response(JSON.stringify(illumination), {
      status: 200,
      headers: {
        'Content-Type':  'application/json',
        // 24h cache at the edge. The cache key already includes the URL
        // querystring (?word=X&member=1 vs ?word=X) so deep + standard
        // versions cache independently. Vary kept on Origin so CORS
        // doesn't bleed across browsers.
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        'Vary':          'Origin',
        ...CORS,
      },
    });

  } catch (err) {
    return jsonError('The Illuminator is resting — please try again in a moment.', 502, CORS);
  }
}

function jsonError(message, status = 400, corsHeaders = {}) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}
