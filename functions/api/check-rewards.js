/**
 * /api/check-rewards — Recompute and grant referral rewards (Phase 3 Wk 6).
 *
 * POST /api/check-rewards
 * Headers: Authorization: Bearer <supabase-access-token>  (required)
 * Body:    { user_id }  (optional; must match authed user if present)
 * Returns: { granted: [...], current_member_count: N }
 *
 * Counts the user's ref_signups with became_member=true and grants any of the
 * three tier rewards they've crossed but not yet been granted:
 *   - 3 → free_month_credit  (issued as a Stripe coupon — see notes)
 *   - 10 → gathering_invite  (logged; operator emails the invite manually for v0)
 *   - 25 → founder_badge     (sets profiles.founder_badge = true)
 *
 * Auth: Bearer-token JWT verified against Supabase /auth/v1/user before any DB
 * read. The authenticated user.id is the source of truth — body.user_id is
 * accepted but must match (back-compat with older callers). This prevents the
 * 2026-05-12 finding where anyone with a UUID could probe ref_signups counts
 * or force premature reward grants for an arbitrary user.
 *
 * Uses service-role to bypass RLS for the upsert (the rewards table is
 * service-role-only). Idempotent — re-running never double-grants because of
 * the UNIQUE (referrer_id, tier) constraint.
 *
 * Required env: PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY,
 *               SUPABASE_SERVICE_ROLE_KEY.
 *
 * Per CLAUDE.md cooperation rule: rewards are personal acknowledgements,
 * not public ranking. The badge appears on the user's own profile only.
 * No leaderboard surface anywhere.
 */

const ALLOWED_ORIGINS = [
  'https://frqncy.network',
  'https://www.frqncy.network',
];

// ── In-memory IP rate limit ────────────────────────────────────────
// 10 req/min per IP. Same pattern as subscribe.js / chat.js / etc.
// Per-isolate only (Workers don't share state); KV/DO is the real fix.
// Without this, anyone with a UUID could probe ref_signups counts in a tight
// loop or force premature reward grants for an arbitrary user.
const RATE_WINDOW_MS = 60_000;
const RATE_MAX       = 10;
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

function isAllowedOrigin(o) {
  if (!o) return false;
  if (ALLOWED_ORIGINS.includes(o)) return true;
  if (/^https:\/\/.*\.frqncy-website\.pages\.dev$/.test(o)) return true;
  if (/^http:\/\/localhost(:\d+)?$/.test(o)) return true;
  return false;
}

function json(body, status, origin) {
  const headers = {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'vary': 'origin',
  };
  if (isAllowedOrigin(origin)) headers['access-control-allow-origin'] = origin;
  return new Response(JSON.stringify(body), { status, headers });
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const TIER_DEFS = [
  { tier:  3, kind: 'free_month_credit',  message: '3 referrals — a free month is now on your next renewal.' },
  { tier: 10, kind: 'gathering_invite',   message: '10 referrals — you are invited to the next quarterly gathering.' },
  { tier: 25, kind: 'founder_badge',      message: '25 referrals — founder badge added to your profile.' },
];

async function supabaseFetch(env, path, opts = {}) {
  const res = await fetch(`${env.PUBLIC_SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'content-type': 'application/json',
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase ${path} → ${res.status}: ${text}`);
  }
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : null;
}

export async function onRequestOptions({ request }) {
  return json({ ok: true }, 200, request.headers.get('origin') || '');
}

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get('origin') || '';

  // Rate limit (per-IP, per-isolate)
  const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '';
  if (checkRateLimit(ip)) {
    return json({ error: 'Too many requests, slow down a moment.' }, 429, origin);
  }

  if (!env.PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY || !env.PUBLIC_SUPABASE_ANON_KEY) {
    return json({ error: 'Rewards service not configured.' }, 503, origin);
  }

  // ── Auth: Bearer-token verification via Supabase /auth/v1/user ─────
  // Without this, anyone with a UUID could probe ref_signups counts in a
  // tight loop or force premature reward grants for an arbitrary user.
  // Reject early if no token, invalid token, or user.id doesn't match the
  // body — same UUID could otherwise leak the rate-limited bucket from
  // multiple sessions.
  const authHeader = request.headers.get('authorization') || '';
  const tokenMatch = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!tokenMatch) {
    return json({ error: 'Authentication required.' }, 401, origin);
  }
  const accessToken = tokenMatch[1];

  let authedUserId;
  try {
    const authResp = await fetch(`${env.PUBLIC_SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: env.PUBLIC_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!authResp.ok) {
      return json({ error: 'Invalid or expired session.' }, 401, origin);
    }
    const u = await authResp.json();
    authedUserId = u && u.id;
  } catch (err) {
    console.error('Token verification failed:', err);
    return json({ error: 'Could not verify session.' }, 502, origin);
  }
  if (!authedUserId || !UUID_RE.test(authedUserId)) {
    return json({ error: 'Invalid session.' }, 401, origin);
  }

  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON.' }, 400, origin); }

  // Body still accepts user_id for backward compatibility, but the
  // server uses the authenticated user's id as the source of truth.
  // If body.user_id is present and doesn't match, reject loudly.
  const bodyUserId = String(body.user_id || '').trim();
  if (bodyUserId && bodyUserId !== authedUserId) {
    return json({ error: 'user_id does not match authenticated session.' }, 403, origin);
  }
  const userId = authedUserId;

  try {
    // 1. Count this user's ref_signups where became_member = true.
    const counted = await supabaseFetch(
      env,
      `ref_signups?referrer_id=eq.${encodeURIComponent(userId)}&became_member=eq.true&select=referred_id`,
    );
    const memberCount = Array.isArray(counted) ? counted.length : 0;

    // 2. Look up which tiers are already granted.
    const granted = await supabaseFetch(
      env,
      `ref_rewards?referrer_id=eq.${encodeURIComponent(userId)}&select=tier`,
    );
    const grantedTiers = new Set((granted || []).map((r) => r.tier));

    // 3. Grant any newly-crossed tiers.
    const newGrants = [];
    for (const def of TIER_DEFS) {
      if (memberCount >= def.tier && !grantedTiers.has(def.tier)) {
        try {
          await supabaseFetch(env, 'ref_rewards', {
            method: 'POST',
            headers: { Prefer: 'return=minimal' },
            body: JSON.stringify({
              referrer_id: userId,
              tier: def.tier,
              kind: def.kind,
            }),
          });
          // Special-case: founder badge also flips the public profile flag.
          if (def.kind === 'founder_badge') {
            await supabaseFetch(env, `profiles?id=eq.${encodeURIComponent(userId)}`, {
              method: 'PATCH',
              headers: { Prefer: 'return=minimal' },
              body: JSON.stringify({ founder_badge: true }),
            });
          }
          newGrants.push({ tier: def.tier, kind: def.kind, message: def.message });
        } catch (err) {
          // UNIQUE constraint race-loss is fine — silently skip.
          if (!/duplicate|conflict|23505/i.test(err.message)) {
            console.warn(`Grant ${def.kind} failed:`, err.message);
          }
        }
      }
    }

    return json({
      granted: newGrants,
      current_member_count: memberCount,
    }, 200, origin);

  } catch (err) {
    console.error('check-rewards failed:', err);
    return json({ error: 'Could not check rewards. Try again shortly.' }, 502, origin);
  }
}

export async function onRequest(context) {
  const { request } = context;
  if (request.method === 'POST') return onRequestPost(context);
  if (request.method === 'OPTIONS') return onRequestOptions(context);
  return json({ error: 'Method not allowed' }, 405, request.headers.get('origin') || '');
}
