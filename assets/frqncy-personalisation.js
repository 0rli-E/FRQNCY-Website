/* ============================================================================
 * FRQNCY — Personalisation Engine v0 (vanilla JS / ES module)
 * ----------------------------------------------------------------------------
 * Reads the signed-in user's saved chart from Supabase and surfaces two
 * tiny, suggestion-shaped cards on /my-frqncy/:
 *   1. "Your domains"           — 3-5 topics from /search.json
 *   2. "Teachers aligned"       — 3-5 people from /people.json
 *
 * Voice is non-negotiable (see proposals/FRQNCY-VOICE-PLAYBOOK.md and
 * proposals/PRACTICE-TRACKER.md). This module never says:
 *   - "your destiny"
 *   - "your path is X"
 *   - "you must"
 *   - any imperative-disguised-as-prescription
 * It frames everything as "topics that often resonate with your type" and
 * "teachers worth reading at your design." Suggestion, not assignment.
 *
 * Matching is intentionally crude — substring + tag rules. This is v0; no
 * vector store, no embeddings, no AI call. The point is to ship the surface
 * with a defensible default ranking, then iterate on the rules with feedback.
 *
 * Requires `/assets/frqncy-supabase.js` to have loaded first.
 * ========================================================================== */

// ── Internal: Supabase client + user ──────────────────────────────────────

async function getClientAndUser() {
  if (!window.frqncy) {
    throw new Error('frqncy-supabase.js must load before frqncy-personalisation.js');
  }
  await window.frqncy.ready;
  const user = await window.frqncy.auth.getUser();
  return { client: window.frqncy.client, user: user || null };
}

// ── getUserChart ──────────────────────────────────────────────────────────

/**
 * Fetch the signed-in user's saved chart signature.
 * Returns a flat object `{ hd_type, authority, profile, sun_gate, gk_primes }`
 * or `null` if there is no chart row for this user.
 *
 * Precedence:
 *   1. The `Constellation` chart row (where chart.js writes the signature).
 *   2. Any chart row whose `data.chart.hd` is populated (defensive fallback).
 *   3. The `Sanctuary` row (rarely holds an HD signature, but we try).
 */
export async function getUserChart() {
  const { client, user } = await getClientAndUser();
  if (!user) return null;

  // Pull a small set of candidate rows; we only ever read the user's own.
  const { data, error } = await client
    .from('charts')
    .select('name, data, updated_at')
    .eq('owner_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(10);

  if (error) {
    console.warn('[frqncy-personalisation] getUserChart error', error);
    return null;
  }
  if (!data || !data.length) return null;

  // Prefer Constellation, then any row with chart.hd, then Sanctuary.
  const byName = (n) => data.find((r) => r.name === n);
  const candidates = [
    byName('Constellation'),
    ...data.filter((r) => r?.data?.chart?.hd),
    byName('Sanctuary'),
    data[0],
  ].filter(Boolean);

  for (const row of candidates) {
    const sig = extractSignature(row.data);
    if (sig && (sig.hd_type || sig.authority || sig.sun_gate)) return sig;
  }
  return null;
}

/**
 * Extract a flat signature `{ hd_type, authority, profile, sun_gate, gk_primes }`
 * from whatever shape the chart row stores. Defensive — empty fields stay
 * empty rather than throwing.
 */
function extractSignature(blob) {
  if (!blob || typeof blob !== 'object') return null;
  const c = blob.chart || blob; // some rows might store chart at root
  const hd = c.hd || {};
  const gk = c.gk || {};
  // Sun gate = the Personality Sun gate, exposed as "Life's Work" prime.
  const lifesWork = (gk.primes || []).find((p) => p && p.name === "Life's Work");
  const sun_gate = lifesWork ? Number(lifesWork.key) : null;
  return {
    hd_type:    hd.type      || null,
    authority:  hd.authority  || null,
    profile:    hd.profile    || null,
    strategy:   hd.strategy   || null,
    sun_gate:   sun_gate,
    gk_primes:  gk.primes     || [],
    dob:        c.dob         || null,
  };
}

// ── loadTopicsAndPeople ───────────────────────────────────────────────────

let _cache = null;
let _cachePromise = null;

/**
 * Fetches /search.json and /people.json once per page session.
 * Returns `{ topics: [...], people: [...] }`. Empty arrays on failure.
 */
export async function loadTopicsAndPeople() {
  if (_cache) return _cache;
  if (_cachePromise) return _cachePromise;
  _cachePromise = (async () => {
    const [topics, peopleBlob] = await Promise.all([
      fetch('/search.json').then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetch('/people.json').then((r) => (r.ok ? r.json() : { people: [] })).catch(() => ({ people: [] })),
    ]);
    const people = Array.isArray(peopleBlob) ? peopleBlob : (peopleBlob.people || []);
    // search.json contains topics + sometimes other surfaces; keep only topic rows.
    const onlyTopics = (topics || []).filter((t) => t && (t.slug || t.url) && t.label);
    _cache = { topics: onlyTopics, people };
    return _cache;
  })();
  return _cachePromise;
}

// ── Matching rules ────────────────────────────────────────────────────────

// Type-keyed keyword bias. Used for substring scan against label + desc + domain.
// Kept short on purpose — each list is the smallest defensible bias, not an
// exhaustive theory of the type. v0.
const TYPE_KEYWORDS = {
  'Generator':              ['practice', 'energy', 'movement', 'work', 'craft', 'body', 'breath', 'meditation', 'nutrition', 'sleep'],
  'Manifesting Generator':  ['practice', 'energy', 'movement', 'creation', 'building', 'design', 'craft', 'breath'],
  'Manifestor':             ['initiation', 'creation', 'leadership', 'building', 'design', 'governance', 'storytelling', 'open source'],
  'Projector':              ['systems', 'guidance', 'strategy', 'wisdom', 'study', 'philosophy', 'consciousness', 'meditation', 'human design'],
  'Reflector':              ['cycles', 'community', 'cosmos', 'astrology', 'natural', 'lunar', 'environment', 'oceans', 'forests'],
};

// Authority-keyed keyword bias. Same matching surface (label + desc + domain).
const AUTHORITY_KEYWORDS = {
  'Sacral':                  ['body', 'movement', 'intuition', 'breath', 'practice', 'somatic', 'nutrition'],
  'Emotional (Solar Plexus)':['emotion', 'cycles', 'relationship', 'art', 'poetry', 'music', 'dialogue', 'patience'],
  'Splenic':                 ['intuition', 'health', 'medicine', 'plant', 'instinct', 'present', 'body'],
  'Ego':                     ['will', 'leadership', 'business', 'commitment', 'enterprise', 'capital'],
  'Self-Projected (G)':      ['identity', 'voice', 'storytelling', 'speaking', 'direction'],
  'Mental (Outer)':          ['dialogue', 'philosophy', 'community', 'language', 'study'],
  'Lunar':                   ['cycles', 'cosmos', 'astrology', 'community', 'natural'],
};

// Curated topic fallback — when no signature/no match, this is what we show.
// Voice-aligned, broad enough to be useful to anyone.
const TOPIC_FALLBACK_SLUGS = [
  'meditation', 'human-design', 'breathwork', 'community', 'natural-cycles',
];

// Canonical FRQNCY 5 — fallback for teachers when nothing matches.
const CANONICAL_PEOPLE_IDS = [
  'p-neville-goddard', 'p-osho', 'p-sadhguru', 'p-sai-maa', 'p-kevin-trudeau',
];

// Lineage-to-cue map — heuristics linking specific teachers to chart signatures.
// Each entry: id (people.json) -> array of cues that should boost the score.
// Cues can be type names, authority labels, profile strings, or gate numbers.
const PERSON_CUES = {
  'p-osho':                 ['Manifestor', '5/1', '5/2', 'Splenic'],
  'p-sadhguru':             ['Generator', 'Manifesting Generator', 'Sacral', 'Splenic', 'Projector', 'Manifestor', 'Reflector'], // all
  'p-neville-goddard':      ['Manifestor', 'Manifesting Generator', 'Self-Projected (G)', 'Ego'],
  'p-sai-maa':              ['Emotional (Solar Plexus)', 'Reflector', 'Projector'],
  'p-kevin-trudeau':        ['Manifestor', 'Manifesting Generator', 'Ego'],
  'p-alan-watts':           ['Projector', 'Mental (Outer)', 'Self-Projected (G)'],
  'p-andrew-huberman':      ['Generator', 'Sacral'],
  'p-anita-moorjani':       ['Reflector', 'Emotional (Solar Plexus)'],
  'p-adrienne-maree-brown': ['Projector', 'Reflector', 'Emotional (Solar Plexus)'],
  'p-balaji-srinivasan':    ['Manifestor', 'Manifesting Generator', 'Ego'],
  'p-barbara-marciniak':    ['Reflector', 'Projector', 'Emotional (Solar Plexus)'],
};

// ── matchTopicsToChart ────────────────────────────────────────────────────

/**
 * Score every topic against the user's chart signature, return the top N.
 * Falls back to a curated default list when nothing matches.
 *
 * Each returned topic carries a `framing` — 6-10 words, suggestion-shaped.
 */
export function matchTopicsToChart(chart, allTopics, limit = 5) {
  const list = Array.isArray(allTopics) ? allTopics : [];
  if (!list.length) return [];

  // No chart at all → curated fallback by slug match.
  if (!chart) {
    return TOPIC_FALLBACK_SLUGS
      .map((s) => list.find((t) => t.slug === s))
      .filter(Boolean)
      .slice(0, limit)
      .map(addTopicFraming);
  }

  const typeKeys     = TYPE_KEYWORDS[chart.hd_type]      || [];
  const authKeys     = AUTHORITY_KEYWORDS[chart.authority] || [];
  const sunGateStr   = chart.sun_gate ? String(chart.sun_gate) : null;
  const primeKeys    = (chart.gk_primes || [])
    .map((p) => (p && p.key ? String(p.key) : null))
    .filter(Boolean);

  const scored = list.map((t) => {
    const hay = `${t.label || ''} ${t.desc || ''} ${t.domain || ''}`.toLowerCase();
    let score = 0;
    for (const kw of typeKeys) if (hay.includes(kw)) score += 2;
    for (const kw of authKeys) if (hay.includes(kw)) score += 2;
    // Gate-number match in description is a strong signal (rare but specific).
    if (sunGateStr && t.desc && t.desc.includes(sunGateStr)) score += 3;
    for (const k of primeKeys) {
      if (t.desc && new RegExp(`\\b${k}\\b`).test(t.desc)) score += 1;
    }
    return { t, score };
  });

  scored.sort((a, b) => b.score - a.score);

  // If the top score is zero, use curated fallback rather than random topics.
  if (!scored[0] || scored[0].score === 0) {
    return TOPIC_FALLBACK_SLUGS
      .map((s) => list.find((tt) => tt.slug === s))
      .filter(Boolean)
      .slice(0, limit)
      .map(addTopicFraming);
  }

  // Take the top N with score > 0.
  return scored
    .filter((s) => s.score > 0)
    .slice(0, limit)
    .map((s) => addTopicFraming(s.t));
}

// 6-10 word framing per topic. Pulled from desc when possible (truncated),
// always neutral / suggestion-shaped, never imperative.
function addTopicFraming(topic) {
  const desc = (topic.desc || '').replace(/[—–]/g, '-').trim();
  // Take first clause or first 12 words, whichever is shorter.
  const firstClause = desc.split(/[.\-]/)[0].trim();
  const words = firstClause.split(/\s+/).slice(0, 12).join(' ');
  return {
    slug:    topic.slug,
    label:   topic.label,
    url:     topic.url || `/v2/${topic.slug}/`,
    framing: words || 'often resonates with this design.',
    domain:  topic.domain || '',
  };
}

// ── matchPeopleToChart ────────────────────────────────────────────────────

/**
 * Score every person against the user's chart signature, return the top N.
 * Falls back to the canonical FRQNCY 5 when nothing matches.
 */
export function matchPeopleToChart(chart, allPeople, limit = 5) {
  const list = Array.isArray(allPeople) ? allPeople : [];
  if (!list.length) return [];

  // No chart at all → canonical 5.
  if (!chart) {
    return CANONICAL_PEOPLE_IDS
      .map((id) => list.find((p) => p.id === id))
      .filter(Boolean)
      .slice(0, limit)
      .map(addPersonFraming);
  }

  const typeName = chart.hd_type || '';
  const auth     = chart.authority || '';
  const profile  = chart.profile || '';

  const scored = list.map((p) => {
    let score = 0;
    const cues = PERSON_CUES[p.id];
    if (cues) {
      for (const c of cues) {
        if (c === typeName) score += 3;
        if (c === auth)     score += 3;
        if (c === profile)  score += 4;
      }
    }
    // Bio substring nudge — keep light so curated cues dominate.
    const bio = (p.bio || '').toLowerCase();
    if (typeName && bio.includes(typeName.toLowerCase())) score += 2;
    if (auth && bio.includes(auth.toLowerCase().split(' ')[0])) score += 1;
    return { p, score };
  });

  scored.sort((a, b) => b.score - a.score);

  if (!scored[0] || scored[0].score === 0) {
    return CANONICAL_PEOPLE_IDS
      .map((id) => list.find((pp) => pp.id === id))
      .filter(Boolean)
      .slice(0, limit)
      .map(addPersonFraming);
  }

  return scored
    .filter((s) => s.score > 0)
    .slice(0, limit)
    .map((s) => addPersonFraming(s.p));
}

function addPersonFraming(person) {
  const slug = person.id.startsWith('p-') ? person.id.slice(2) : person.id;
  // Pull first 8-10 words of bio as framing — neutral, descriptive.
  const bio = (person.bio || '').replace(/[—–]/g, '-').trim();
  const firstClause = bio.split(/[.]/)[0].trim();
  const words = firstClause.split(/\s+/).slice(0, 12).join(' ');
  return {
    id:      person.id,
    slug,
    name:    person.name,
    url:     `/v2/explore.html#${person.id}`,
    framing: words || 'a teacher worth reading at this design.',
  };
}
