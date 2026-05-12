/**
 * /api/export — Hybrid signed-message mirror export endpoint
 *
 * GET /api/export?username=<handle>
 *
 * Returns a JSON dump of every signed record by that author. Records that
 * went through `api.ts` after the signing wire-up (this session) carry an
 * Ed25519 detached signature + the canonical JSON the author signed; older
 * rows show up unsigned (signature: null).
 *
 * Public — no auth required. Signed records are publishable by design (per
 * proposals/HYBRID-SIGNED-MIRROR.md). Anyone who fetches this dump can
 * verify the signatures with the included signing_public_key and republish
 * the records on a different network (ATProto, Farcaster, custom).
 *
 * Rate-limited 5 req/min per IP — this is a heavy query and there's no
 * legitimate "scrape it every second" use case.
 *
 * Response shape:
 * {
 *   "user": { "id": "...", "username": "...", "display_name": "...", "wallet_address": "..." },
 *   "signing_public_key": "base64",
 *   "encryption_public_key": "base64",
 *   "exported_at": "ISO8601",
 *   "counts": { "posts_total": N, "posts_signed": M, "follows_total": N, "follows_signed": M },
 *   "posts": [ { "signed_payload": "...", "signature": "..." }, ... ],
 *   "follows": [ { "signed_payload": "...", "signature": "..." }, ... ]
 * }
 *
 * Required env: PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (for read-anywhere).
 */

const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 5;
const rateBuckets = new Map();

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
    for (const [k, v] of rateBuckets) {
      if (now >= v.resetAt) rateBuckets.delete(k);
    }
  }
  return bucket.count > RATE_MAX;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestGet({ request, env }) {
  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For');
  if (checkRateLimit(ip)) {
    return jsonError('Too many requests — try again in a minute.', 429);
  }

  const url = new URL(request.url);
  const username = (url.searchParams.get('username') || '').trim().toLowerCase();
  if (!username || !/^[a-z0-9_]{1,40}$/i.test(username)) {
    return jsonError('username param required (alphanumeric + underscore, 1-40 chars)', 400);
  }

  if (!env.PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return jsonError('Export endpoint not configured (missing Supabase env vars).', 500);
  }

  const supabaseFetch = async (path, opts = {}) => {
    const res = await fetch(`${env.PUBLIC_SUPABASE_URL}/rest/v1/${path}`, {
      ...opts,
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        ...(opts.headers || {}),
      },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Supabase ${path} → ${res.status}: ${text}`);
    }
    return res.json();
  };

  try {
    // 1. Resolve user.
    const profiles = await supabaseFetch(
      `profiles?username=eq.${encodeURIComponent(username)}&select=id,username,display_name,wallet_address,signing_public_key,encryption_public_key`,
    );
    if (!profiles.length) {
      return jsonError(`No user with username "${username}".`, 404);
    }
    const user = profiles[0];

    // 2. Fetch signed posts (oldest first — stable export order).
    const posts = await supabaseFetch(
      `posts?author_id=eq.${user.id}&select=id,signed_payload,signature,created_at&order=created_at.asc`,
    );
    const postsSigned = posts.filter((p) => !!p.signature);

    // 3. Fetch signed follows.
    const follows = await supabaseFetch(
      `follows?follower_id=eq.${user.id}&select=signed_payload,signature,created_at&order=created_at.asc`,
    );
    const followsSigned = follows.filter((f) => !!f.signature);

    const body = {
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        wallet_address: user.wallet_address,
      },
      signing_public_key: user.signing_public_key,
      encryption_public_key: user.encryption_public_key,
      exported_at: new Date().toISOString(),
      counts: {
        posts_total: posts.length,
        posts_signed: postsSigned.length,
        follows_total: follows.length,
        follows_signed: followsSigned.length,
      },
      posts: postsSigned.map((p) => ({
        signed_payload: p.signed_payload,
        signature: p.signature,
        created_at: p.created_at,
      })),
      follows: followsSigned.map((f) => ({
        signed_payload: f.signed_payload,
        signature: f.signature,
        created_at: f.created_at,
      })),
    };

    return new Response(JSON.stringify(body, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // 5-minute edge cache — exports are append-only over time, slight
        // staleness is fine and reduces backend pressure.
        'Cache-Control': 'public, max-age=300',
        ...CORS_HEADERS,
      },
    });
  } catch (err) {
    console.error('Export failed:', err);
    return jsonError('Export failed. Please try again.', 500);
  }
}

function jsonError(message, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}
