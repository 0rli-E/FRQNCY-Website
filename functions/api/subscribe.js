/**
 * /api/subscribe  — FRQNCY email subscription
 * Cloudflare Pages Function
 *
 * Saves an email to the Supabase `subscribers` table (source of truth) and,
 * if a Resend API key is configured, sends a welcome email.
 *
 * POST /api/subscribe
 * Body: { email: "person@example.com", source?: "frqncy_website" }
 * Returns: JSON { ok: true } | { ok: false, error: "..." }
 *
 * Required Cloudflare Pages env vars (Settings → Environment variables):
 *   PUBLIC_SUPABASE_URL          — same as the .env value
 *   SUPABASE_SERVICE_ROLE_KEY    — service-role key (NOT the anon key) — bypasses RLS
 *
 * Optional (welcome email):
 *   RESEND_API_KEY               — re_... — get one at resend.com (free 3000/mo)
 *   RESEND_FROM                  — "FRQNCY <hello@frqncy.network>" — must be a verified domain
 *
 * If RESEND_API_KEY is missing the subscription still succeeds; we just skip
 * the welcome email. This means you can launch with Supabase first and add
 * Resend later without changing any code.
 */

import { makeUnsubToken } from './unsubscribe.js';

const RATE_WINDOW_MS = 60_000;
const RATE_MAX       = 5;            // 5 signups per IP per minute is plenty
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

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get('origin') || '';
  // ── Rate limit ──────────────────────────────────────────────────
  const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '';
  if (checkRateLimit(ip)) {
    return json({ ok: false, error: 'Too many requests, slow down a moment.' }, 429, origin);
  }

  // ── Parse + validate ────────────────────────────────────────────
  let body;
  try { body = await request.json(); }
  catch { return json({ ok: false, error: 'Invalid JSON.' }, 400, origin); }

  const email   = String(body.email || '').trim().toLowerCase();
  const source  = String(body.source || 'frqncy_website').slice(0, 64);
  const referrer = (request.headers.get('referer') || '').slice(0, 500);

  // Referral attribution: explicit `ref` in body wins, otherwise parse ?ref=
  // out of the page URL (Referer header). Codes are short alphanumeric.
  let ref = String(body.ref || '').trim().slice(0, 32);
  if (!ref && referrer) {
    try {
      const refUrl = new URL(referrer);
      ref = (refUrl.searchParams.get('ref') || '').trim().slice(0, 32);
    } catch { /* malformed referer — ignore */ }
  }
  if (ref && !/^[A-Za-z0-9_-]+$/.test(ref)) ref = '';

  if (!email || !EMAIL_RE.test(email) || email.length > 254) {
    return json({ ok: false, error: 'Please enter a valid email address.' }, 400, origin);
  }

  // ── Config ──────────────────────────────────────────────────────
  const SUPABASE_URL = env.PUBLIC_SUPABASE_URL;
  const SERVICE_KEY  = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_KEY) {
    // Don't leak which one is missing
    console.error('Missing Supabase config in env');
    return json({ ok: false, error: 'Subscription is temporarily unavailable. Please try again shortly.' }, 503, origin);
  }

  // ── Upsert subscriber via Supabase REST ─────────────────────────
  // Using service-role key bypasses RLS so we can also read the existing row
  // (e.g. to detect "already confirmed" and skip the welcome email).
  const upsertResp = await fetch(
    `${SUPABASE_URL}/rest/v1/subscribers?on_conflict=email`,
    {
      method: 'POST',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'content-type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify([{
        email,
        source,
        referrer: referrer || null,
        confirmed: true,           // single-opt-in for now; flip to double-opt-in later
        confirmed_at: new Date().toISOString(),
        metadata: {
          ip_country: request.headers.get('cf-ipcountry') || null,
          ua: (request.headers.get('user-agent') || '').slice(0, 200),
          ref: ref || null,
        },
      }]),
    }
  );

  if (!upsertResp.ok) {
    const text = await upsertResp.text();
    console.error('Supabase upsert failed', upsertResp.status, text);
    return json({ ok: false, error: 'Could not save your subscription. Please try again.' }, 502, origin);
  }

  const rows = await upsertResp.json().catch(() => []);
  const subscriber = Array.isArray(rows) ? rows[0] : null;

  // Detect whether this was a brand-new subscriber so we only send the welcome
  // email once per email address. If created_at == confirmed_at within ~5s,
  // we treat it as new.
  let isNew = true;
  if (subscriber?.created_at && subscriber?.confirmed_at) {
    const created = new Date(subscriber.created_at).getTime();
    const confirmed = new Date(subscriber.confirmed_at).getTime();
    isNew = Math.abs(confirmed - created) < 5_000;
  }

  // ── Send welcome email via Resend (optional) ────────────────────
  if (isNew && env.RESEND_API_KEY) {
    try {
      const from = env.RESEND_FROM || 'FRQNCY <onboarding@resend.dev>';
      const subject = 'Your free audio course';

      // Unsubscribe is not optional: CAN-SPAM requires a working opt-out, and
      // Gmail/Yahoo bulk-sender rules require RFC 8058 one-click. The token is
      // the address encrypted, so no email ever appears in a URL or a log.
      const unsubToken = await makeUnsubToken(email, env.UNSUBSCRIBE_SECRET || SERVICE_KEY);
      const unsubUrl = `https://frqncy.network/api/unsubscribe?t=${unsubToken}`;

      const html = welcomeEmailHTML(email, unsubUrl);
      const text = welcomeEmailText(email, unsubUrl);

      const resendResp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [email],
          subject,
          html,
          text,
          headers: {
            'List-Unsubscribe': `<${unsubUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        }),
      });
      if (!resendResp.ok) {
        const t = await resendResp.text();
        console.warn('Resend send failed (subscription saved anyway)', resendResp.status, t);
      }
    } catch (err) {
      console.warn('Resend threw (subscription saved anyway)', err);
    }
  }

  return json({ ok: true, isNew }, 200, origin);
}

// Reject anything that isn't POST/OPTIONS
export async function onRequest(context) {
  const { request } = context;
  const origin = request.headers.get('origin') || '';
  if (request.method === 'POST')    return onRequestPost(context);
  if (request.method === 'OPTIONS') return onRequestOptions(context);
  return json({ ok: false, error: 'Method not allowed' }, 405, origin);
}

// ── Email templates ───────────────────────────────────────────────

// The free audio course every door promises. Affiliate link — disclosure is
// mandatory in every email and on every page that carries it (FTC + our own
// editorial standards). Keep the disclosure in the same email as the link.
const FREE_COURSE_URL = 'https://freeyourwish.kevintrudeau.com/?ref=2b9q35';

function welcomeEmailHTML(email, unsubUrl = 'https://frqncy.network/api/unsubscribe') {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Your free audio course</title>
</head>
<body style="margin:0;padding:0;background:#0B1C3D;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#C8D8F0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0B1C3D;padding:40px 20px;">
    <tr><td align="center">
      <table width="540" cellpadding="0" cellspacing="0" style="max-width:540px;background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:48px 40px;">
        <tr><td align="center" style="padding-bottom:32px;">
          <div style="font-family:Georgia,'Cormorant Garamond',serif;font-size:24px;letter-spacing:0.28em;color:#fff;">FRQNCY</div>
        </td></tr>
        <tr><td style="padding-bottom:24px;">
          <h1 style="font-family:Georgia,'Cormorant Garamond',serif;font-weight:300;font-size:28px;line-height:1.25;color:#fff;margin:0 0 8px 0;">Here is the <em style="color:#E0C06A;">audio course</em>.</h1>
          <p style="color:#7090B8;font-size:14px;letter-spacing:0.04em;margin:0;">You asked for it. No hoops.</p>
        </td></tr>
        <tr><td align="center" style="padding:8px 0 28px 0;">
          <a href="${FREE_COURSE_URL}" style="display:inline-block;background:transparent;border:1px solid rgba(196,151,58,0.5);color:#C4973A;text-decoration:none;padding:14px 32px;border-radius:2px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;">Listen free</a>
        </td></tr>
        <tr><td style="padding-bottom:24px;color:#C8D8F0;font-size:15px;line-height:1.7;">
          <p style="margin:0 0 16px 0;">It is Kevin Trudeau on how wanting actually works. Put it on in the car, on a walk, anywhere you would otherwise be scrolling.</p>
          <p style="margin:0 0 16px 0;">We hand it over first because it treats desire as a compass rather than a problem. That is the same place FRQNCY starts.</p>
          <p style="margin:0;">FRQNCY is a network of people building their dream life. 146 maps of how money, energy, mind and matter work. All of it free to read. The thesis is never behind a wall.</p>
        </td></tr>
        <tr><td style="padding-bottom:28px;color:#7090B8;font-size:14px;line-height:2;">
          <p style="margin:0 0 8px 0;color:#4A6280;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;">Walk in where you were already headed</p>
          <a href="https://frqncy.network/money" style="color:#C8D8F0;text-decoration:none;">Money</a> &nbsp;·&nbsp;
          <a href="https://frqncy.network/spirituality" style="color:#C8D8F0;text-decoration:none;">Spirituality</a> &nbsp;·&nbsp;
          <a href="https://frqncy.network/books" style="color:#C8D8F0;text-decoration:none;">Books</a> &nbsp;·&nbsp;
          <a href="https://frqncy.network/breathwork" style="color:#C8D8F0;text-decoration:none;">Breathwork</a>
        </td></tr>
        <tr><td style="padding-bottom:24px;color:#C8D8F0;font-size:15px;line-height:1.7;">
          <p style="margin:0;">We write when there is something worth opening. If this is not for you, <a href="${unsubUrl}" style="color:#C4973A;">unsubscribe here</a> and we will not find you again.</p>
        </td></tr>
        <tr><td style="border-top:1px solid rgba(255,255,255,0.08);padding-top:20px;color:#4A6280;font-size:11px;line-height:1.6;letter-spacing:0.03em;text-align:center;">
          <p style="margin:0 0 10px 0;">The audio course link is an affiliate link. If you later buy something through it, FRQNCY earns a share. It costs you nothing extra, and we would send you the course either way.</p>
          <p style="margin:0 0 10px 0;"><a href="${unsubUrl}" style="color:#7090B8;text-decoration:underline;">Unsubscribe</a> — one press, no questions.</p>
          <p style="margin:0 0 6px 0;">© 2026 FRQNCY</p>
          <p style="margin:0;"><a href="https://frqncy.network" style="color:#7090B8;text-decoration:none;">frqncy.network</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function welcomeEmailText(email, unsubUrl = 'https://frqncy.network/api/unsubscribe') {
  return [
    'Here is the audio course. You asked for it. No hoops.',
    '',
    FREE_COURSE_URL,
    '',
    'It is Kevin Trudeau on how wanting actually works. Put it on in the car,',
    'on a walk, anywhere you would otherwise be scrolling.',
    '',
    'We hand it over first because it treats desire as a compass rather than a',
    'problem. That is the same place FRQNCY starts.',
    '',
    'FRQNCY is a network of people building their dream life. 146 maps of how',
    'money, energy, mind and matter work. All of it free to read. The thesis is',
    'never behind a wall.',
    '',
    'Walk in where you were already headed:',
    '  Money        https://frqncy.network/money',
    '  Spirituality https://frqncy.network/spirituality',
    '  Books        https://frqncy.network/books',
    '  Breathwork   https://frqncy.network/breathwork',
    '',
    'We write when there is something worth opening. If this is not for you,',
    'unsubscribe here and we will not find you again:',
    unsubUrl,
    '',
    '— FRQNCY',
    '',
    'The audio course link is an affiliate link. If you later buy something',
    'through it, FRQNCY earns a share. It costs you nothing extra, and we would',
    'send you the course either way.',
    '',
    '© 2026 FRQNCY · frqncy.network',
  ].join('\n');
}
