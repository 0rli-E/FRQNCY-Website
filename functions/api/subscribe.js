/**
 * FRQNCY — Email Subscribe Function
 * Cloudflare Pages Function: auto-deployed at /api/subscribe
 *
 * Uses Brevo (brevo.com) to store subscribers.
 * Set these in Cloudflare Pages → Settings → Environment Variables:
 *   BREVO_API_KEY  — your Brevo API key
 *   BREVO_LIST_ID  — your Brevo list ID (number, e.g. 2)
 */

const ALLOWED_ORIGINS = [
  'https://frqncy.network',
  'https://www.frqncy.network',
  'http://localhost',
  'http://127.0.0.1',
  'null', // file:// local preview
];

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
}

export async function onRequestOptions({ request }) {
  const origin = request.headers.get('Origin') || '';
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get('Origin') || '';
  const headers = corsHeaders(origin);

  // Parse body
  let email = '';
  try {
    const body = await request.json();
    email = (body.email || '').trim().toLowerCase();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body.' }), { status: 400, headers });
  }

  // Basic email validation
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(JSON.stringify({ error: 'Please enter a valid email address.' }), { status: 400, headers });
  }

  // Check env vars
  const apiKey = env.BREVO_API_KEY;
  const listId = parseInt(env.BREVO_LIST_ID, 10);

  if (!apiKey || !listId) {
    // Env vars not yet set — return success anyway during dev/testing
    console.warn('BREVO_API_KEY or BREVO_LIST_ID not set. Simulating success.');
    return new Response(JSON.stringify({ success: true, note: 'dev-mode' }), { status: 200, headers });
  }

  // Add contact to Brevo
  const brevoRes = await fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      email,
      listIds: [listId],
      updateEnabled: true, // update if contact already exists
      attributes: {
        SOURCE: 'FRQNCY Website',
        SIGNUP_DATE: new Date().toISOString().split('T')[0],
      },
    }),
  });

  // 201 = created, 204 = already exists (updated)
  if (brevoRes.status === 201 || brevoRes.status === 204) {
    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
  }

  // Handle duplicate (already subscribed)
  if (brevoRes.status === 400) {
    const err = await brevoRes.json().catch(() => ({}));
    if (err.code === 'duplicate_parameter') {
      return new Response(JSON.stringify({ success: true, note: 'already-subscribed' }), { status: 200, headers });
    }
    return new Response(JSON.stringify({ error: err.message || 'Could not subscribe.' }), { status: 400, headers });
  }

  return new Response(JSON.stringify({ error: 'Something went wrong. Please try again.' }), { status: 500, headers });
}
