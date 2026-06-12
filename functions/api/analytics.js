/**
 * /api/analytics — FRQNCY event collector
 * Cloudflare Pages Function (ESM, edge runtime)
 *
 * POST  /api/analytics   { event_type, session_id, properties?, url?, referrer? }
 * OPTIONS /api/analytics  CORS preflight
 *
 * Design principles:
 *  - Fire-and-forget: always returns 200 so client never blocks on this
 *  - No raw PII stored: IP is SHA-256 hashed, UA is simplified to browser family
 *  - JWT auth optional: reads Supabase session token if present, falls through gracefully
 *  - Rate limit: 30 events/min/IP — analytics is lightweight; abuse still needs guarding
 *  - Writes to Supabase analytics_events via service-role REST (bypasses RLS)
 */

// ─── Config ──────────────────────────────────────────────────────────────────

const RATE_WINDOW_MS = 60_000;
const RATE_MAX       = 30;

const ALLOWED_ORIGINS = [
  'https://frqncy.network',
  'https://www.frqncy.network',
];

// Strip these keys from properties before persisting (belt + suspenders — client strips too)
const PII_KEYS = ['email', 'name', 'phone', 'password', 'token', 'key', 'secret', 'auth'];

// Allowlisted event types — unknown types are silently dropped (no error to caller)
const ALLOWED_EVENTS = new Set([
  // Content & navigation
  'page_view', 'topic_view', 'explore_interaction', 'resource_click',
  'search_query', 'course_view', 'scroll_depth',
  // Sanctuary / Word Illuminator
  'word_illuminated', 'illuminator_opened',
  'practice_session_started', 'practice_session_completed',
  // Identity / auth
  'signup', 'login', 'key_backed_up',
  // Social (NRG)
  'post_created', 'dm_sent', 'bluesky_connected', 'nostr_connected',
  // Revenue
  'membership_checkout_started', 'membership_converted',
  'course_purchased', 'newsletter_subscribed', 'referral_code_shared',
  // Aligned Goods — outbound interest signals (which goods people click)
  'good_click', 'good_buy_click',
  // Misc
  'export_downloaded',
]);

// ─── In-memory rate limiter (per isolate — good enough for analytics) ─────────

const rateBuckets = new Map(); // ip_hash → { count, resetAt }

function checkRateLimit(ipHash) {
  const now = Date.now();
  const bucket = rateBuckets.get(ipHash);
  if (!bucket || now >= bucket.resetAt) {
    rateBuckets.set(ipHash, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (bucket.count >= RATE_MAX) return false;
  bucket.count++;
  return true;
}

// ─── Origin check ─────────────────────────────────────────────────────────────

function isAllowedOrigin(origin) {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  // Cloudflare Pages preview deployments
  if (origin.endsWith('.frqncy-website.pages.dev')) return true;
  // Local dev
  if (origin === 'http://localhost:4321' || origin === 'http://localhost:3000') return true;
  return false;
}

// ─── IP hashing ───────────────────────────────────────────────────────────────

async function hashIP(ip) {
  if (!ip) return null;
  // Add date as salt so the hash rotates daily (no cross-day fingerprinting)
  const salt = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const data  = new TextEncoder().encode(`${ip}:${salt}`);
  const buf   = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─── UA simplification ────────────────────────────────────────────────────────

function simplifyUA(ua) {
  if (!ua) return null;
  // Extract browser family + major version only
  const patterns = [
    [/Edg\/(\d+)/,               'Edge'],
    [/OPR\/(\d+)/,               'Opera'],
    [/Chrome\/(\d+)/,            'Chrome'],
    [/Firefox\/(\d+)/,           'Firefox'],
    [/Safari\/\d+ Version\/(\d+)/,'Safari'],
    [/MSIE (\d+)/,               'IE'],
    [/Trident\/.*rv:(\d+)/,      'IE'],
  ];
  for (const [re, name] of patterns) {
    const m = ua.match(re);
    if (m) return `${name} ${m[1]}`;
  }
  // Bot / crawler
  if (/bot|crawl|spider|slurp|facebookexternalhit/i.test(ua)) return 'Bot';
  return 'Other';
}

// ─── JWT decode (no verify — we trust Supabase issued JWTs, just read the sub) ──

function extractUserIdFromJWT(authHeader) {
  try {
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token   = authHeader.slice(7);
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub || null; // Supabase puts user UUID in 'sub'
  } catch {
    return null;
  }
}

// ─── PII scrub ────────────────────────────────────────────────────────────────

function scrubProperties(props) {
  if (!props || typeof props !== 'object') return {};
  const cleaned = { ...props };
  for (const key of PII_KEYS) {
    delete cleaned[key];
    // Also catch camelCase variants like emailAddress
    for (const k of Object.keys(cleaned)) {
      if (k.toLowerCase().includes(key)) delete cleaned[k];
    }
  }
  return cleaned;
}

// ─── Supabase insert ──────────────────────────────────────────────────────────

async function insertEvent(env, row) {
  const url = `${env.PUBLIC_SUPABASE_URL}/rest/v1/analytics_events`;
  const res  = await fetch(url, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'apikey':        env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Prefer':        'return=minimal',
    },
    body: JSON.stringify(row),
  });
  if (!res.ok) {
    // Log but don't surface to caller — fire-and-forget
    console.error('[analytics] Supabase insert failed:', res.status, await res.text());
  }
}

// ─── CORS helper ──────────────────────────────────────────────────────────────

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin':  isAllowedOrigin(origin) ? origin : 'null',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age':       '86400',
  };
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

export async function onRequestOptions({ request }) {
  const origin = request.headers.get('Origin') || '';
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get('Origin') || '';
  const headers = { 'Content-Type': 'application/json', ...corsHeaders(origin) };

  // Always return 200 — analytics must never break the calling page
  const ok = () => new Response(JSON.stringify({ ok: true }), { status: 200, headers });

  try {
    // ── Origin gate ─────────────────────────────────────────────────────────
    if (!isAllowedOrigin(origin)) return ok();

    // ── Rate limit ──────────────────────────────────────────────────────────
    const rawIP  = request.headers.get('CF-Connecting-IP') || '';
    const ipHash = await hashIP(rawIP);
    if (!checkRateLimit(ipHash)) return ok(); // silently drop, never error

    // ── Parse body ──────────────────────────────────────────────────────────
    let body;
    try { body = await request.json(); } catch { return ok(); }

    const { event_type, session_id, properties, url, referrer } = body;

    // ── Validate event type ─────────────────────────────────────────────────
    if (!event_type || !ALLOWED_EVENTS.has(event_type)) return ok();
    if (!session_id || typeof session_id !== 'string') return ok();

    // ── Extract optional user ID from Supabase JWT ──────────────────────────
    const authHeader = request.headers.get('Authorization') || '';
    const userId     = extractUserIdFromJWT(authHeader);

    // ── Build row ───────────────────────────────────────────────────────────
    const row = {
      event_type,
      session_id:            String(session_id).slice(0, 64),
      properties:            scrubProperties(properties),
      url:                   url   ? String(url).slice(0, 2048)     : null,
      referrer:              referrer ? String(referrer).slice(0, 2048) : null,
      ip_hash:               ipHash,
      user_agent_simplified: simplifyUA(request.headers.get('User-Agent') || ''),
    };
    if (userId) row.user_id = userId;

    // ── Persist ─────────────────────────────────────────────────────────────
    // Don't await — true fire-and-forget so Cloudflare edge doesn't hold the response
    env?.PUBLIC_SUPABASE_URL && env?.SUPABASE_SERVICE_ROLE_KEY
      ? insertEvent(env, row).catch(console.error)
      : console.warn('[analytics] Supabase env vars missing — event dropped');

    return ok();
  } catch (err) {
    // Never surface errors to the caller
    console.error('[analytics] Unexpected error:', err);
    return ok();
  }
}

// Fallback for GET (health check)
export async function onRequest({ request }) {
  if (request.method === 'GET') {
    return new Response(JSON.stringify({ service: 'frqncy-analytics', status: 'ok' }), {
      status:  200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return new Response('Method not allowed', { status: 405 });
}
