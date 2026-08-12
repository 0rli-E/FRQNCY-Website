/**
 * /api/sanctuary-extract — turn what was just said into a PROPOSAL, never a write.
 *
 * WHY. The companion could read the Sanctuary (goals, chief aims) but never
 * update it, so a person could tell VBRTN "I finished the landing page" and the
 * Sanctuary would still show it open forever. Someone who has to re-type every
 * commitment into a second surface stops using one of them.
 *
 * WHAT IT DOES NOT DO. It does not write. It returns proposals; the client
 * renders them as a card the person taps to accept. Nothing enters anyone's
 * Sanctuary without them saying yes — an agent that silently edits your goals
 * is not a mirror, it is a manager. That rule is the whole design.
 *
 * Deliberately conservative: on a malformed model reply, an unparseable body,
 * a missing binding, or any thrown error, it answers { proposals: [] } with 200.
 * A failed extraction must never break the conversation happening above it.
 *
 * POST { messages:[{role,content}], goals:{ chiefAims, thisMonth } }
 * →    { proposals:[ {type,title,...} ] }   // 0-3, may be empty
 */

const WORKERS_MODEL = '@cf/qwen/qwen3-30b-a3b-fp8';
const MAX_TOKENS = 300;
const MAX_TURNS = 4;      // only the recent exchange matters
const MAX_CONTENT = 2000;
const MAX_PROPOSALS = 3;

const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 30;
const rateBuckets = new Map();

function rateLimited(ip) {
  if (!ip) return true;
  const now = Date.now();
  let b = rateBuckets.get(ip);
  if (!b || now >= b.resetAt) { b = { count: 0, resetAt: now + RATE_WINDOW_MS }; rateBuckets.set(ip, b); }
  b.count++;
  if (rateBuckets.size > 1000) for (const [k, v] of rateBuckets) if (now >= v.resetAt) rateBuckets.delete(k);
  return b.count > RATE_MAX;
}

const clip = (v, n) => String(v == null ? '' : v).replace(/[\r\n]+/g, ' ').trim().slice(0, n);

const EXTRACT_PROMPT = `You read a short exchange between a person and their companion, and report ONLY what the person themselves explicitly committed to or explicitly completed. You are a scribe, not an advisor.

Output STRICT JSON and nothing else. No prose, no markdown fence, no explanation:
{"proposals":[]}

Each proposal is one of:
{"type":"goal_add","title":"<the commitment, in the person's own words, max 90 chars>"}
{"type":"goal_complete","title":"<the EXACT text of one currently-open goal listed below>"}
{"type":"aim_progress","name":"<EXACT name of one chief aim listed below>","current":<integer>}

HARD RULES — breaking any of these makes the output worthless:
- Only the PERSON's own words count. Never turn the companion's question, suggestion or reflection into a proposal.
- Only what is EXPLICIT. "I'll finish the deck tomorrow" is a goal_add. "I should probably exercise more" is NOT — it is a wish, not a commitment. When unsure, leave it out.
- goal_complete requires the person to state they DID it, in the past. Its title must match one listed open goal character-for-character. If nothing matches, do not emit it.
- aim_progress requires the person to state an explicit NUMBER for a named aim. Never estimate, infer or interpolate a score yourself.
- Never invent, expand, tidy or improve a commitment. Copy their framing.
- Never propose anything that ranks the person, compares them to anyone, or measures them against their past self.
- At most 3 proposals. Usually the honest answer is {"proposals":[]} — return that freely.`;

export function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: cors(request) });
}

function cors(request) {
  const origin = request.headers.get('Origin') || '';
  const allowed = ['https://frqncy.network', 'https://frqncy-website.pages.dev'];
  const ok = allowed.includes(origin) || origin.endsWith('.frqncy-website.pages.dev');
  return {
    'Access-Control-Allow-Origin': ok ? origin : allowed[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

/** Always 200 with an array — the caller treats any failure as "nothing to propose". */
function empty(CORS) {
  return new Response(JSON.stringify({ proposals: [] }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...CORS },
  });
}

export async function onRequestPost({ request, env }) {
  const CORS = cors(request);
  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For');
  if (rateLimited(ip)) return empty(CORS);
  if (!env.AI) return empty(CORS);

  let body;
  try { body = await request.json(); } catch { return empty(CORS); }

  const messages = Array.isArray(body?.messages) ? body.messages : [];
  const clean = messages
    .filter(m => m && (m.role === 'user' || m.role === 'assistant')
      && typeof m.content === 'string' && m.content.trim())
    .map(m => ({ role: m.role, content: String(m.content).slice(0, MAX_CONTENT) }))
    .slice(-MAX_TURNS);
  if (!clean.some(m => m.role === 'user')) return empty(CORS);

  const g = body?.goals && typeof body.goals === 'object' ? body.goals : {};
  const openGoals = (Array.isArray(g.thisMonth) ? g.thisMonth : []).slice(0, 5).map(t => clip(t, 120)).filter(Boolean);
  const aims = (Array.isArray(g.chiefAims) ? g.chiefAims : []).slice(0, 3)
    .map(a => ({ name: clip(a && a.name, 120), current: a && typeof a.current === 'number' ? a.current : null,
                 target: a && typeof a.target === 'number' ? a.target : null }))
    .filter(a => a.name);

  const ctx = [
    openGoals.length
      ? `Currently open goals this month (exact text for goal_complete):\n${openGoals.map(t => `- ${t}`).join('\n')}`
      : 'No open goals recorded this month — goal_complete is therefore impossible; never emit one.',
    aims.length
      ? `Chief aims (exact names for aim_progress):\n${aims.map(a => `- ${a.name}${a.current != null ? ` (at ${a.current}${a.target != null ? ` of ${a.target}` : ''})` : ''}`).join('\n')}`
      : 'No chief aims recorded — aim_progress is therefore impossible; never emit one.',
  ].join('\n\n');

  let raw;
  try {
    const result = await env.AI.run(WORKERS_MODEL, {
      messages: [
        { role: 'system', content: '/no_think\n' + EXTRACT_PROMPT + '\n\n' + ctx },
        ...clean,
        { role: 'user', content: 'Output the JSON now. Nothing else.' },
      ],
      max_tokens: MAX_TOKENS,
      temperature: 0,   // extraction, not generation
    });
    raw = result?.choices?.[0]?.message?.content ?? result?.response ?? '';
    if (typeof raw !== 'string') raw = JSON.stringify(raw);
  } catch { return empty(CORS); }

  const proposals = parseProposals(raw, openGoals, aims);
  return new Response(JSON.stringify({ proposals }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...CORS },
  });
}

/**
 * Parse and then VALIDATE AGAINST REALITY. The model is never trusted to have
 * respected the rules: a completion must name a goal that is genuinely open, an
 * aim must genuinely exist. Anything else is dropped silently.
 */
export function parseProposals(raw, openGoals, aims) {
  let text = String(raw || '').replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) return [];

  let parsed;
  try { parsed = JSON.parse(text.slice(start, end + 1)); } catch { return []; }
  const list = Array.isArray(parsed?.proposals) ? parsed.proposals : [];

  const goalSet = new Set(openGoals);
  const aimMap = new Map(aims.map(a => [a.name, a]));
  const out = [];
  const seen = new Set();

  for (const p of list) {
    if (!p || typeof p !== 'object' || out.length >= MAX_PROPOSALS) continue;

    if (p.type === 'goal_add') {
      const title = clip(p.title, 90);
      if (!title || title.length < 3) continue;
      if (goalSet.has(title)) continue;              // already tracked
      const k = 'a:' + title.toLowerCase();
      if (seen.has(k)) continue; seen.add(k);
      out.push({ type: 'goal_add', title });

    } else if (p.type === 'goal_complete') {
      const title = clip(p.title, 120);
      if (!goalSet.has(title)) continue;             // must be a real open goal
      const k = 'c:' + title.toLowerCase();
      if (seen.has(k)) continue; seen.add(k);
      out.push({ type: 'goal_complete', title });

    } else if (p.type === 'aim_progress') {
      const name = clip(p.name, 120);
      const aim = aimMap.get(name);
      if (!aim) continue;                            // must be a real aim
      const current = Number(p.current);
      if (!Number.isFinite(current)) continue;
      const value = Math.round(current);
      if (value < 0 || value > 1_000_000) continue;
      if (aim.current != null && value === aim.current) continue;  // no change
      const k = 'p:' + name.toLowerCase();
      if (seen.has(k)) continue; seen.add(k);
      out.push({ type: 'aim_progress', name, current: value, previous: aim.current, target: aim.target });
    }
  }
  return out;
}
