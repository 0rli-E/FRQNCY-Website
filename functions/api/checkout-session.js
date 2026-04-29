/**
 * /api/checkout-session — Stripe Checkout for Membership v0
 * Cloudflare Pages Function
 *
 * POST /api/checkout-session
 * Body: { tier: 'monthly' | 'annual', user_id, email, ref_code? }
 * Returns: { url: <stripe_checkout_url> }
 *
 * Required env vars (Cloudflare Pages → Settings → Environment variables):
 *   STRIPE_SECRET_KEY               — sk_test_... (test mode first)
 *   STRIPE_PRICE_MONTHLY            — price_xxx for the monthly Network Member price
 *   STRIPE_PRICE_ANNUAL             — price_xxx for the annual Network Member price
 *
 * Stripe is called via the REST API directly — no SDK dependency, since Pages
 * Functions don't bundle node_modules cleanly. fetch() with form-urlencoded
 * bodies is the documented stable path.
 *
 * Per CLAUDE.md cooperation rule and proposals/MEMBERSHIP-V0.md: Stripe is the
 * fastest test-mode-first path. The webhook (functions/api/stripe-webhook.js)
 * is what flips the membership row to active. This function only opens the
 * Checkout Session.
 */

const RATE_WINDOW_MS = 60_000;
const RATE_MAX       = 10;
const rateBuckets    = new Map();

const ALLOWED_ORIGINS = [
  'https://frqncy.network',
  'https://www.frqncy.network',
];

function isAllowedOrigin(origin) {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (/^https:\/\/.*\.frqncy-website\.pages\.dev$/.test(origin)) return true;
  if (/^http:\/\/localhost(:\d+)?$/.test(origin)) return true;
  return false;
}

function checkRateLimit(ip) {
  if (!ip) return true; // fail closed
  const now = Date.now();
  let bucket = rateBuckets.get(ip);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + RATE_WINDOW_MS };
    rateBuckets.set(ip, bucket);
  }
  bucket.count++;
  if (rateBuckets.size > 1000) {
    for (const [k, v] of rateBuckets) if (v.resetAt < now) rateBuckets.delete(k);
  }
  return bucket.count > RATE_MAX;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE  = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const REF_RE   = /^[A-Z0-9]{4,12}$/;

function json(body, status = 200, origin = '') {
  const headers = {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '86400',
    'vary': 'origin',
  };
  if (isAllowedOrigin(origin)) {
    headers['access-control-allow-origin'] = origin;
  }
  return new Response(JSON.stringify(body), { status, headers });
}

export async function onRequestOptions({ request }) {
  const origin = request.headers.get('origin') || '';
  return json({ ok: true }, 200, origin);
}

/**
 * Format a flat object into application/x-www-form-urlencoded the way Stripe
 * expects — including bracketed sub-keys for nested objects (line_items[0][price]).
 * Caller passes already-flattened keys.
 */
function toFormBody(obj) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    params.append(k, String(v));
  }
  return params.toString();
}

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get('origin') || '';

  // ── Rate limit ─────────────────────────────────────────────────────────
  const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '';
  if (checkRateLimit(ip)) {
    return json({ error: 'Too many requests, slow down a moment.' }, 429, origin);
  }

  // ── Fail-loud config check ─────────────────────────────────────────────
  if (!env.STRIPE_SECRET_KEY) {
    return json(
      { error: 'Membership not configured. STRIPE_SECRET_KEY missing in Pages env vars.' },
      503,
      origin,
    );
  }

  // ── Parse + validate ───────────────────────────────────────────────────
  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON.' }, 400, origin); }

  const tier    = String(body.tier || '').toLowerCase();
  const userId  = String(body.user_id || '').trim();
  const email   = String(body.email || '').trim().toLowerCase();
  let   refCode = body.ref_code ? String(body.ref_code).trim().toUpperCase() : null;

  if (tier !== 'monthly' && tier !== 'annual') {
    return json({ error: 'tier must be "monthly" or "annual".' }, 400, origin);
  }
  if (!UUID_RE.test(userId)) {
    return json({ error: 'user_id must be a UUID.' }, 400, origin);
  }
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return json({ error: 'A valid email is required.' }, 400, origin);
  }
  if (refCode && !REF_RE.test(refCode)) refCode = null;

  // ── Resolve price ID ───────────────────────────────────────────────────
  const priceId = tier === 'annual' ? env.STRIPE_PRICE_ANNUAL : env.STRIPE_PRICE_MONTHLY;
  if (!priceId) {
    return json(
      { error: `Stripe price for tier "${tier}" is not configured. Set STRIPE_PRICE_${tier.toUpperCase()} in Pages env vars.` },
      503,
      origin,
    );
  }

  // ── Build Stripe Checkout Session payload ──────────────────────────────
  // Form-urlencoded, with array/object syntax Stripe's REST API expects.
  const payload = {
    mode: 'subscription',
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': 1,
    customer_email: email,
    client_reference_id: userId,
    success_url: 'https://frqncy.network/membership/?status=success&session_id={CHECKOUT_SESSION_ID}',
    cancel_url:  'https://frqncy.network/membership/?status=cancelled',
    'metadata[user_id]': userId,
    'metadata[tier]': tier,
    'subscription_data[metadata][user_id]': userId,
    'subscription_data[metadata][tier]': tier,
    allow_promotion_codes: 'true',
    'automatic_tax[enabled]': 'false',
  };
  if (refCode) {
    payload['metadata[ref_code]'] = refCode;
    payload['subscription_data[metadata][ref_code]'] = refCode;
  }

  // ── Call Stripe ────────────────────────────────────────────────────────
  let stripeResp;
  try {
    stripeResp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: toFormBody(payload),
    });
  } catch (err) {
    console.error('Stripe network error', err);
    return json({ error: 'Could not reach Stripe. Try again shortly.' }, 502, origin);
  }

  const stripeData = await stripeResp.json().catch(() => ({}));
  if (!stripeResp.ok) {
    console.error('Stripe rejected checkout session', stripeResp.status, stripeData);
    return json(
      { error: stripeData?.error?.message || 'Stripe rejected the checkout request.' },
      502,
      origin,
    );
  }

  if (!stripeData.url) {
    return json({ error: 'Stripe returned no checkout URL.' }, 502, origin);
  }

  return json({ url: stripeData.url, id: stripeData.id }, 200, origin);
}

export async function onRequest(context) {
  const { request } = context;
  const origin = request.headers.get('origin') || '';
  if (request.method === 'POST')    return onRequestPost(context);
  if (request.method === 'OPTIONS') return onRequestOptions(context);
  return json({ error: 'Method not allowed' }, 405, origin);
}
