/**
 * /api/check-rewards — Recompute and grant referral rewards (Phase 3 Wk 6).
 *
 * POST /api/check-rewards
 * Body: { user_id }
 * Returns: { granted: [...], current_member_count: N }
 *
 * Counts the user's ref_signups with became_member=true and grants any of the
 * three tier rewards they've crossed but not yet been granted:
 *   - 3 → free_month_credit  (issued as a Stripe coupon — see notes)
 *   - 10 → gathering_invite  (logged; operator emails the invite manually for v0)
 *   - 25 → founder_badge     (sets profiles.founder_badge = true)
 *
 * Uses service-role to bypass RLS for the upsert. Idempotent — re-running
 * never double-grants because of the UNIQUE (referrer_id, tier) constraint.
 *
 * Required env: PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 *
 * Per CLAUDE.md cooperation rule: rewards are personal acknowledgements,
 * not public ranking. The badge appears on the user's own profile only.
 * No leaderboard surface anywhere.
 */

const ALLOWED_ORIGINS = [
  'https://frqncy.network',
  'https://www.frqncy.network',
];

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

  if (!env.PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: 'Rewards service not configured.' }, 503, origin);
  }

  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON.' }, 400, origin); }

  const userId = String(body.user_id || '').trim();
  if (!UUID_RE.test(userId)) return json({ error: 'user_id must be a UUID.' }, 400, origin);

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
