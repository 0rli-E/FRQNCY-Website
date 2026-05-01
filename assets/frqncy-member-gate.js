// frqncy-member-gate.js
//
// Light membership gating for /my-frqncy/* surfaces. Membership grants
// ADDITIONAL views — never gates the canonical version.
//
// Per CLAUDE.md cooperation rule + proposals/MEMBERSHIP-V0.md voice constraints:
//   - Never "exclusive", "premium", "unlock", "limited time".
//   - Frame gated UI as "deeper view for members" / "extra analytics for members".
//   - The basic chart, basic reading, basic practice tracker stay public-when-signed-in
//     for everyone. Membership unlocks ADDITIONAL surface area, not the core.
//
// Wires off `assets/frqncy-supabase.js` (vanilla pages) and the `memberships`
// table from migration 013. Returns null when membership tables don't exist
// yet (migration 013 not applied) — caller treats null as "not a member" and
// renders the basic surface only. Failing-gracefully beats throwing.

const READY = new Promise((resolve) => {
  if (typeof window === 'undefined') { resolve(false); return; }
  if (window.frqncy && window.frqncy.client) { resolve(true); return; }
  // assets/frqncy-supabase.js sets window.frqncy when it loads.
  let tries = 0;
  const t = setInterval(() => {
    if (window.frqncy && window.frqncy.client) { clearInterval(t); resolve(true); }
    else if (++tries > 50) { clearInterval(t); resolve(false); }
  }, 100);
});

/**
 * Returns the active membership row for the signed-in user, or null.
 * null can mean: not signed in, not a member, or migration 013 not applied.
 * Caller should not differentiate — render the basic public-when-signed-in
 * surface in all null cases.
 */
export async function getActiveMembership() {
  await READY;
  if (typeof window === 'undefined' || !window.frqncy || !window.frqncy.client) return null;
  try {
    const { data: { user } } = await window.frqncy.client.auth.getUser();
    if (!user) return null;
    const { data, error } = await window.frqncy.client
      .from('memberships')
      .select('id, tier, status, current_period_end')
      .eq('user_id', user.id)
      .maybeSingle();
    if (error) {
      // Table missing OR RLS blocking → treat as not-a-member, log quietly.
      console.info('[member-gate] membership lookup returned null:', error.message);
      return null;
    }
    if (!data) return null;
    if (data.status !== 'active' && data.status !== 'trialing') return null;
    return data;
  } catch (err) {
    console.warn('[member-gate] failed (non-fatal):', err);
    return null;
  }
}

/** Convenience: boolean. */
export async function isActiveMember() {
  return !!(await getActiveMembership());
}

/**
 * Render a "Members see deeper analytics" inline upsell card. Used as the
 * placeholder when a non-member opens a member-only surface. Voice-aligned
 * — invitation, never coercion.
 */
export function renderMemberUpsell(targetEl, opts = {}) {
  if (!targetEl) return;
  const headline = opts.headline || 'A deeper view for members';
  const body = opts.body || 'This view is one of the small extras members see. The reading itself stays free for everyone — supporters get a few more angles on it.';
  targetEl.innerHTML = `
    <div style="
      margin-top:1.5rem;padding:1.5rem 1.75rem;
      border:1px solid rgba(201,169,110,0.25);border-radius:0.75rem;
      background:linear-gradient(135deg, rgba(201,169,110,0.04), rgba(11,28,61,0.4));
    ">
      <p style="margin:0 0 0.5rem;font-family:'Cormorant',serif;font-style:italic;color:var(--gold,#C9A96E);font-size:1.15rem;">
        ${headline}
      </p>
      <p style="margin:0 0 1rem;color:var(--text-dim,#7090B8);font-size:0.9rem;line-height:1.55;">
        ${body}
      </p>
      <a href="/membership/" style="
        display:inline-block;padding:0.5rem 1rem;border:1px solid rgba(201,169,110,0.4);border-radius:9999px;
        color:var(--gold,#C9A96E);font-size:0.82rem;text-decoration:none;
      ">Become a member →</a>
    </div>
  `;
}
