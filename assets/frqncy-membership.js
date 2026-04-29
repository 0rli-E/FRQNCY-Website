/* ============================================================================
 * FRQNCY — membership + referral helpers
 * ----------------------------------------------------------------------------
 * Vanilla ES module. Depends on `window.frqncy.client` from
 * /assets/frqncy-supabase.js — load that script before importing this one.
 *
 *   import {
 *     getMyMembership,
 *     getOrCreateRefCode,
 *     getMyRefSignups,
 *     attributeSignup,
 *   } from '/assets/frqncy-membership.js';
 *
 * All functions assume the Supabase client is configured. They throw or return
 * null on errors — callers handle UX.
 * ========================================================================== */

const REF_LS_KEY        = 'frqncy.ref_code';        // captured ?ref=XYZ for signup
const REF_OWN_LS_PREFIX = 'frqncy.my_ref_code:';    // cache of *my own* ref code per user

async function client() {
  if (!window.frqncy) throw new Error('frqncy-supabase.js not loaded');
  await window.frqncy.ready;
  return window.frqncy.client;
}

/** Generate a 6-char ref code: A-Z + 0-9, stripped of confusables (0/O, 1/I). */
function generateCode() {
  // Math.random is fine here — codes are not secrets.
  let raw = Math.random().toString(36).slice(2, 10).toUpperCase();
  raw = raw.replace(/[0OIL1]/g, '');
  if (raw.length < 6) raw += Math.random().toString(36).slice(2, 6).toUpperCase().replace(/[0OIL1]/g, '');
  return raw.slice(0, 6).padEnd(6, 'X');
}

// ────────────────────────────────────────────────────────────────────────────
// Membership
// ────────────────────────────────────────────────────────────────────────────

/**
 * Fetch the current user's membership row.
 * Returns null if the user has no membership or isn't logged in.
 */
export async function getMyMembership(user) {
  const c = await client();
  const u = user || (await window.frqncy.auth.getUser());
  if (!u) return null;
  const { data, error } = await c
    .from('memberships')
    .select('id, tier, status, current_period_end, created_at')
    .eq('user_id', u.id)
    .maybeSingle();
  if (error) {
    console.warn('getMyMembership error', error);
    return null;
  }
  return data;
}

// ────────────────────────────────────────────────────────────────────────────
// Referral codes
// ────────────────────────────────────────────────────────────────────────────

/**
 * Look up an existing 6-char ref code for the current user, or generate one
 * and insert it into ref_codes. Returns the code string.
 *
 * Cached in localStorage per user id to avoid repeated round-trips on the
 * /membership/ page.
 */
export async function getOrCreateRefCode(user) {
  const c = await client();
  const u = user || (await window.frqncy.auth.getUser());
  if (!u) throw new Error('getOrCreateRefCode requires a signed-in user');

  // 1) Check localStorage cache
  const lsKey = REF_OWN_LS_PREFIX + u.id;
  try {
    const cached = localStorage.getItem(lsKey);
    if (cached && /^[A-Z0-9]{4,12}$/.test(cached)) return cached;
  } catch (_) { /* private mode etc. */ }

  // 2) Check DB for existing code on this profile
  const { data: existing, error: selErr } = await c
    .from('ref_codes')
    .select('code')
    .eq('owner_id', u.id)
    .maybeSingle();
  if (selErr && selErr.code !== 'PGRST116') {
    // PGRST116 = "no rows" from PostgREST — not actually an error here
    console.warn('ref_codes select error', selErr);
  }
  if (existing?.code) {
    try { localStorage.setItem(lsKey, existing.code); } catch (_) {}
    return existing.code;
  }

  // 3) Generate + insert. Retry on collision (PK = code).
  for (let attempt = 0; attempt < 4; attempt++) {
    const code = generateCode();
    const { error: insErr } = await c
      .from('ref_codes')
      .insert({ code, owner_id: u.id });
    if (!insErr) {
      try { localStorage.setItem(lsKey, code); } catch (_) {}
      return code;
    }
    // 23505 = unique_violation in Postgres. Retry with a new code.
    if (insErr.code !== '23505') {
      console.warn('ref_codes insert error', insErr);
      throw insErr;
    }
  }
  throw new Error('Could not generate a unique referral code after 4 attempts');
}

// ────────────────────────────────────────────────────────────────────────────
// Referral signups
// ────────────────────────────────────────────────────────────────────────────

/**
 * Count + recent list of people who signed up via the current user's code.
 * Returns { count, list: [{ display_name, became_member }] }.
 *
 * RLS allows the referrer to see their own ref_signups rows; we then fetch
 * the referred profiles' display_name in a second query (RLS on profiles is
 * already permissive for read).
 */
export async function getMyRefSignups(user) {
  const c = await client();
  const u = user || (await window.frqncy.auth.getUser());
  if (!u) return { count: 0, list: [] };

  const { data: rows, error } = await c
    .from('ref_signups')
    .select('referred_id, became_member, created_at')
    .eq('referrer_id', u.id)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) {
    console.warn('getMyRefSignups error', error);
    return { count: 0, list: [] };
  }
  if (!rows?.length) return { count: 0, list: [] };

  // Fetch display names. profiles is publicly readable per the social schema.
  const ids = rows.map(r => r.referred_id);
  const { data: profiles } = await c
    .from('profiles')
    .select('id, display_name, username')
    .in('id', ids);
  const byId = new Map((profiles || []).map(p => [p.id, p]));

  const list = rows.map(r => {
    const p = byId.get(r.referred_id);
    return {
      display_name: p?.display_name || p?.username || 'Anonymous',
      became_member: !!r.became_member,
      created_at: r.created_at,
    };
  });

  return { count: rows.length, list };
}

/**
 * Called from the signup flow when ?ref=XYZ was captured.
 * Resolves the code → owner_id, then inserts a ref_signups row attributing
 * the new user. Idempotent: if a row already exists (UNIQUE on referred_id),
 * we treat it as success.
 *
 * Inputs:
 *   refCode    — the 4–12 char ref code captured at signup
 *   newUserId  — the freshly-signed-up user's id (auth.uid())
 *
 * Returns { ok, reason? } — never throws into the signup flow.
 */
export async function attributeSignup(refCode, newUserId) {
  if (!refCode || !newUserId) return { ok: false, reason: 'missing-args' };
  const code = String(refCode).trim().toUpperCase();
  if (!/^[A-Z0-9]{4,12}$/.test(code)) return { ok: false, reason: 'bad-code-format' };

  let c;
  try { c = await client(); }
  catch { return { ok: false, reason: 'no-client' }; }

  // Resolve code → owner
  const { data: owner, error: ownerErr } = await c
    .from('ref_codes')
    .select('owner_id')
    .eq('code', code)
    .maybeSingle();
  if (ownerErr || !owner) {
    return { ok: false, reason: 'code-not-found' };
  }
  if (owner.owner_id === newUserId) {
    // Self-referral — silently ignore.
    return { ok: false, reason: 'self-referral' };
  }

  const { error: insErr } = await c
    .from('ref_signups')
    .insert({
      ref_code: code,
      referrer_id: owner.owner_id,
      referred_id: newUserId,
      became_member: false,
    });
  if (insErr) {
    // 23505 = unique violation → already attributed. Treat as success.
    if (insErr.code === '23505') return { ok: true, reason: 'already-attributed' };
    console.warn('attributeSignup insert error', insErr);
    return { ok: false, reason: insErr.code || 'insert-failed' };
  }

  // Clear the captured ref code from localStorage now that it's been used.
  try { localStorage.removeItem(REF_LS_KEY); } catch (_) {}
  return { ok: true };
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers exposed for inline scripts on landing pages
// ────────────────────────────────────────────────────────────────────────────

/**
 * Read ?ref=XYZ from the current URL and persist to localStorage so the
 * eventual signup flow (Privy or Supabase email auth) can pick it up.
 *
 * Safe to call on every page — no-ops when there's no ref param.
 */
export function captureRefFromUrl() {
  try {
    const params = new URLSearchParams(location.search);
    const raw = (params.get('ref') || '').trim().toUpperCase();
    if (/^[A-Z0-9]{4,12}$/.test(raw)) {
      localStorage.setItem(REF_LS_KEY, raw);
      return raw;
    }
  } catch (_) {}
  return null;
}

/**
 * Read the captured ref code (set by captureRefFromUrl). Returns null if
 * none is stored.
 */
export function readStoredRefCode() {
  try {
    const v = localStorage.getItem(REF_LS_KEY);
    if (v && /^[A-Z0-9]{4,12}$/.test(v)) return v;
  } catch (_) {}
  return null;
}
