/**
 * /api/unsubscribe — FRQNCY one-click + confirmed unsubscribe
 * Cloudflare Pages Function
 *
 * Every marketing email we send is legally required to carry a working
 * unsubscribe (CAN-SPAM §5, GDPR art. 21, and Gmail/Yahoo bulk-sender rules
 * which require RFC 8058 one-click since Feb 2024). This route serves both:
 *
 *   GET  /api/unsubscribe?t=<token>   → human confirmation page with a button
 *   POST /api/unsubscribe?t=<token>   → performs it (form post OR one-click)
 *
 * The token is the subscriber's email encrypted with AES-GCM, never the email
 * in plaintext — addresses must not travel in URLs, query strings, referrer
 * headers or server logs. An invalid or tampered token decrypts to nothing and
 * is rejected.
 *
 * GET never unsubscribes. Mail clients and security scanners prefetch links;
 * a GET that mutates would silently unsubscribe people who never clicked.
 * One-click unsubscribe is POST by specification for exactly this reason.
 *
 * Env:
 *   PUBLIC_SUPABASE_URL          — required
 *   SUPABASE_SERVICE_ROLE_KEY    — required (bypasses RLS to write the row)
 *   UNSUBSCRIBE_SECRET           — optional; falls back to the service key.
 *                                  HMAC/AES use never reveals the key, but set
 *                                  a dedicated secret if you want rotation
 *                                  independent of the database credential.
 */

const enc = new TextEncoder();
const dec = new TextDecoder();

function b64urlEncode(bytes) {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(str) {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function secretOf(env) {
  return env.UNSUBSCRIBE_SECRET || env.SUPABASE_SERVICE_ROLE_KEY || '';
}

async function keyFrom(secret) {
  const raw = await crypto.subtle.digest('SHA-256', enc.encode(secret));
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

/**
 * Build the opaque token that goes in the unsubscribe URL.
 * Exported so subscribe.js can mint one per outgoing email.
 */
export async function makeUnsubToken(email, secret) {
  if (!secret) return '';
  const key = await keyFrom(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(email))
  );
  const packed = new Uint8Array(iv.length + ct.length);
  packed.set(iv);
  packed.set(ct, iv.length);
  return b64urlEncode(packed);
}

async function readUnsubToken(token, secret) {
  if (!token || !secret) return null;
  try {
    const packed = b64urlDecode(token);
    if (packed.length < 13) return null;
    const key = await keyFrom(secret);
    const iv = packed.slice(0, 12);
    const ct = packed.slice(12);
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
    const email = dec.decode(pt).trim().toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
  } catch {
    return null; // wrong key, tampered ciphertext, malformed base64 — all the same answer
  }
}

// ── Pages ─────────────────────────────────────────────────────────
// Plain, self-contained, no external assets. These render inside a mail
// client's browser, which may block anything remote.

function page({ title, heading, body, action }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${title} · FRQNCY</title>
<style>
  :root { color-scheme: dark; }
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
         background:#0B1C3D; color:#C8D8F0; padding:24px;
         font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; }
  .card { width:100%; max-width:460px; background:rgba(255,255,255,0.025);
          border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:44px 36px; text-align:center; }
  .mark { font-family:Georgia,serif; font-size:20px; letter-spacing:0.28em; color:#fff; margin-bottom:28px; }
  h1 { font-family:Georgia,serif; font-weight:300; font-size:25px; line-height:1.3; color:#fff; margin:0 0 14px; }
  p { font-size:15px; line-height:1.7; margin:0 0 18px; }
  button { font:inherit; cursor:pointer; background:transparent; border:1px solid rgba(196,151,58,0.5);
           color:#C4973A; padding:13px 30px; border-radius:2px; font-size:12px;
           letter-spacing:0.18em; text-transform:uppercase; }
  button:hover { border-color:#C4973A; }
  a { color:#7090B8; }
  .quiet { color:#4A6280; font-size:12px; margin:26px 0 0; }
</style>
</head>
<body>
  <div class="card">
    <div class="mark">FRQNCY</div>
    <h1>${heading}</h1>
    ${body}
    ${action || ''}
    <p class="quiet"><a href="https://frqncy.network">frqncy.network</a></p>
  </div>
</body>
</html>`;
}

function html(body, status = 200) {
  return new Response(body, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  });
}

// ── GET — show the confirmation, change nothing ───────────────────

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const token = url.searchParams.get('t') || '';
  const email = await readUnsubToken(token, secretOf(env));

  if (!email) {
    return html(
      page({
        title: 'Link not valid',
        heading: 'That link is not valid.',
        body: `<p>It may have been altered on the way here, or it belongs to an older sending key.</p>
               <p>Reply to any FRQNCY email and we will take you off by hand, same day.</p>`,
      }),
      400
    );
  }

  const masked = email.replace(/^(.)(.*)(@.*)$/, (_, a, b, c) => a + '•'.repeat(Math.min(b.length, 8)) + c);

  return html(
    page({
      title: 'Unsubscribe',
      heading: 'Leaving is easy.',
      body: `<p>One press and we stop writing to <strong style="color:#C8D8F0">${masked}</strong>. No survey, no last offer.</p>`,
      action: `<form method="POST" action="/api/unsubscribe?t=${encodeURIComponent(token)}">
                 <button type="submit">Unsubscribe</button>
               </form>`,
    })
  );
}

// ── POST — perform it. Handles both the form and RFC 8058 one-click ─

export async function onRequestPost({ request, env }) {
  const url = new URL(request.url);
  let token = url.searchParams.get('t') || '';

  // One-click senders POST "List-Unsubscribe=One-Click" as the body; some
  // clients also echo the token in the body instead of the query string.
  if (!token) {
    try {
      const raw = await request.text();
      token = new URLSearchParams(raw).get('t') || '';
    } catch { /* no body — fine, the query string is the normal path */ }
  }

  const email = await readUnsubToken(token, secretOf(env));
  if (!email) {
    return html(
      page({
        title: 'Link not valid',
        heading: 'That link is not valid.',
        body: `<p>Reply to any FRQNCY email and we will take you off by hand.</p>`,
      }),
      400
    );
  }

  const SUPABASE_URL = env.PUBLIC_SUPABASE_URL;
  const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('Missing Supabase config in env (unsubscribe)');
    return html(
      page({
        title: 'Try again',
        heading: 'Something on our side failed.',
        body: `<p>You are not unsubscribed yet. Reply to any FRQNCY email and we will do it by hand, same day.</p>`,
      }),
      503
    );
  }

  // Cancel any still-pending scheduled email (the 24h audio gift) BEFORE
  // flipping the row: someone who unsubscribes must not hear from us tomorrow.
  // Best-effort — a cancel failure must not block the unsubscribe itself.
  if (env.RESEND_API_KEY) {
    try {
      const rowResp = await fetch(
        `${SUPABASE_URL}/rest/v1/subscribers?email=eq.${encodeURIComponent(email)}&select=metadata`,
        { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
      );
      const rows = rowResp.ok ? await rowResp.json().catch(() => []) : [];
      const giftId = rows?.[0]?.metadata?.scheduled_gift_id;
      if (giftId && /^[A-Za-z0-9-]+$/.test(giftId)) {
        const cancelResp = await fetch(`https://api.resend.com/emails/${giftId}/cancel`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${env.RESEND_API_KEY}` },
        });
        if (!cancelResp.ok) {
          // Already sent, already cancelled, or too close to send time — log, move on.
          console.warn('Gift cancel returned', cancelResp.status, await cancelResp.text().catch(() => ''));
        }
      }
    } catch (err) {
      console.warn('Gift cancel threw (unsubscribe continues)', err);
    }
  }

  const resp = await fetch(
    `${SUPABASE_URL}/rest/v1/subscribers?email=eq.${encodeURIComponent(email)}`,
    {
      method: 'PATCH',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'content-type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        unsubscribed_at: new Date().toISOString(),
        confirmed: false,
        updated_at: new Date().toISOString(),
      }),
    }
  );

  if (!resp.ok) {
    const text = await resp.text();
    console.error('Supabase unsubscribe failed', resp.status, text);
    return html(
      page({
        title: 'Try again',
        heading: 'Something on our side failed.',
        body: `<p>You are not unsubscribed yet. Reply to any FRQNCY email and we will do it by hand, same day.</p>`,
      }),
      502
    );
  }

  return html(
    page({
      title: 'Done',
      heading: 'Done. We will not write again.',
      body: `<p>Nothing further will be sent to that address.</p>
             <p>The maps stay open either way — no account, no email, no wall.</p>`,
      action: `<p style="margin-top:22px"><a href="https://frqncy.network/explore.html" style="color:#C4973A;text-decoration:none">Explore the network</a></p>`,
    })
  );
}

export async function onRequest(context) {
  const { request } = context;
  if (request.method === 'GET') return onRequestGet(context);
  if (request.method === 'POST') return onRequestPost(context);
  return new Response('Method not allowed', { status: 405 });
}
