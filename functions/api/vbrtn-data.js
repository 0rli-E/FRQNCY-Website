/**
 * /api/vbrtn-data — export and erasure for VBRTN memory
 * Cloudflare Pages Function
 *
 * The other half of server-canonical memory (VBRTN-APP-STRATEGY decision #1):
 * everything VBRTN holds about a person is theirs to take or destroy.
 *
 *   GET    /api/vbrtn-data          → full JSON export: profile row, semantic
 *                                     memories, every thread, every message
 *   DELETE /api/vbrtn-data          → permanent wipe of all of the above
 *
 * Both require Authorization: Bearer <supabase JWT>. Deletion removes only
 * VBRTN surfaces — the Sanctuary/Journey/Constellation rows are untouched.
 */

function getCorsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const allowedOrigins = [
    'https://frqncy.network',
    'https://frqncy-website.pages.dev',
    'https://localhost',
    'capacitor://localhost',
    'http://localhost:5173',
  ];
  const isAllowed = allowedOrigins.includes(origin) || origin.endsWith('.frqncy-website.pages.dev');
  return {
    'Access-Control-Allow-Origin':  isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: getCorsHeaders(request) });
}

function sbReady(env) {
  return Boolean(env && env.PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
}

async function sbFetch(env, path, init = {}) {
  const res = await fetch(`${env.PUBLIC_SUPABASE_URL}${path}`, {
    ...init,
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`supabase ${res.status}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function verifyUser(env, request) {
  try {
    const auth = request.headers.get('Authorization') || '';
    const m = auth.match(/^Bearer\s+(.+)$/i);
    if (!m || !sbReady(env)) return null;
    const res = await fetch(`${env.PUBLIC_SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${m[1]}` },
    });
    if (!res.ok) return null;
    const user = await res.json();
    return user && user.id ? { id: user.id } : null;
  } catch { return null; }
}

export async function onRequestGet({ request, env }) {
  const CORS = getCorsHeaders(request);
  const user = await verifyUser(env, request);
  if (!user) return jsonError('Sign in to export your data.', 401, CORS);
  try {
    const [rows, threads, messages] = await Promise.all([
      sbFetch(env, `/rest/v1/charts?owner_id=eq.${user.id}&name=eq.VBRTN&select=data,created_at,updated_at&limit=1`),
      sbFetch(env, `/rest/v1/vbrtn_threads?user_id=eq.${user.id}&select=id,title,summary,created_at,updated_at&order=created_at.asc`),
      sbFetch(env, `/rest/v1/vbrtn_messages?user_id=eq.${user.id}&select=thread_id,role,content,via,created_at&order=id.asc`),
    ]);
    const payload = {
      exportedAt: new Date().toISOString(),
      surface: 'VBRTN',
      memory: rows && rows[0] ? rows[0] : null,
      threads: threads || [],
      messages: messages || [],
    };
    return new Response(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="vbrtn-export.json"',
        'Cache-Control': 'no-store',
        ...CORS,
      },
    });
  } catch {
    return jsonError('Export is unreachable right now — try again shortly.', 502, CORS);
  }
}

export async function onRequestDelete({ request, env }) {
  const CORS = getCorsHeaders(request);
  const user = await verifyUser(env, request);
  if (!user) return jsonError('Sign in to erase your data.', 401, CORS);
  try {
    // Messages cascade from threads, but delete explicitly so a partial
    // failure can never leave orphaned content behind.
    await sbFetch(env, `/rest/v1/vbrtn_messages?user_id=eq.${user.id}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
    await sbFetch(env, `/rest/v1/vbrtn_threads?user_id=eq.${user.id}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
    await sbFetch(env, `/rest/v1/charts?owner_id=eq.${user.id}&name=eq.VBRTN`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
    return new Response(JSON.stringify({ erased: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...CORS },
    });
  } catch {
    return jsonError('Erasure did not complete — try again.', 502, CORS);
  }
}

function jsonError(message, status = 400, CORS = {}) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}
