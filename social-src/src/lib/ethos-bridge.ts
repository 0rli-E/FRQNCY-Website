/**
 * ethos-bridge.ts — read-only bridge to Ethos Network (api.ethos.network).
 *
 * Status: Track 3 Week-3 SPIKE deliverable. The read path below is verified
 * against the live OpenAPI spec (https://api.ethos.network/docs/openapi.json,
 * fetched 2026-06-09) — every endpoint used here is PUBLIC (no auth, only the
 * X-Ethos-Client header). The auth PROBE at the bottom (probeEthosAuth) is the
 * actual spike: it answers "does our Privy token authenticate against Ethos?"
 * and is meant to be run once from a connected session. See
 * proposals/ETHOS-INTEGRATION-V0.md for the full write-up.
 *
 * FRQNCY values note: Ethos exposes a numeric credibility `score`. We
 * DELIBERATELY DO NOT surface it — ranking people violates cooperation-over-
 * competition. We surface only existence + vouches received (a cooperative
 * signal: who has staked reputation FOR this person) + the public profile
 * link. See proposals/ROADMAP-90D-2026-05.md Track 3.
 */

const ETHOS_API = 'https://api.ethos.network/api/v2';
// Required on every request — unidentified clients get rate-limited / 403'd.
const ETHOS_CLIENT = 'frqncy-nrg@0.1.0';

export interface EthosProfile {
  exists: boolean;
  vouchesReceived: number;
  invitedBy: string | null;   // see TODO — not on the v2 user object yet
  profileUrl: string | null;
  displayName: string | null;
  username: string | null;
  // score is intentionally omitted — see file header.
}

const EMPTY: EthosProfile = {
  exists: false,
  vouchesReceived: 0,
  invitedBy: null,
  profileUrl: null,
  displayName: null,
  username: null,
};

type Lookup =
  | { address: string }
  | { xUsername: string }
  | { profileId: number };

// Per-session cache. Key is the stringified lookup; 5-min TTL — Ethos data
// moves slowly and a profile hover/render shouldn't re-hit the API.
const CACHE_TTL_MS = 5 * 60_000;
const cache = new Map<string, { value: EthosProfile; expiresAt: number }>();

function lookupUrl(lookup: Lookup): string | null {
  if ('address' in lookup && lookup.address) {
    return `${ETHOS_API}/user/by/address/${encodeURIComponent(lookup.address)}`;
  }
  if ('xUsername' in lookup && lookup.xUsername) {
    return `${ETHOS_API}/user/by/x/${encodeURIComponent(lookup.xUsername.replace(/^@/, ''))}`;
  }
  if ('profileId' in lookup && lookup.profileId) {
    return `${ETHOS_API}/user/by/profile-id/${encodeURIComponent(String(lookup.profileId))}`;
  }
  return null;
}

function cacheKey(lookup: Lookup): string {
  return JSON.stringify(lookup);
}

/**
 * Fetch an Ethos profile for the given identity (wallet address, X username,
 * or Ethos profileId). Public read — no auth. Best-effort: never throws.
 * Returns { exists: false, ... } on 404, network error, or missing config.
 */
export async function fetchEthosProfile(lookup: Lookup): Promise<EthosProfile> {
  const url = lookupUrl(lookup);
  if (!url) return EMPTY;

  const key = cacheKey(lookup);
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'X-Ethos-Client': ETHOS_CLIENT,
      },
    });

    // 404 — no Ethos presence for this identity. A normal, expected state.
    if (res.status === 404) {
      cache.set(key, { value: EMPTY, expiresAt: Date.now() + CACHE_TTL_MS });
      return EMPTY;
    }
    if (!res.ok) return EMPTY;

    const u = await res.json();
    const profile = mapUser(u);
    cache.set(key, { value: profile, expiresAt: Date.now() + CACHE_TTL_MS });
    return profile;
  } catch (err) {
    console.warn('[ethos] fetchEthosProfile failed', err);
    return EMPTY;
  }
}

/** Map the Ethos v2 user object to our deliberately-narrow shape. */
function mapUser(u: any): EthosProfile {
  if (!u || typeof u !== 'object') return EMPTY;

  // stats.vouch.received holds the cooperative signal. The exact leaf differs
  // by API minor version — coerce defensively from .count or a bare number.
  const received = u.stats?.vouch?.received;
  const vouchesReceived = Number(
    (received && typeof received === 'object' ? received.count : received) ?? 0,
  ) || 0;

  const username = u.username ?? null;
  // Public profile URL — prefer the X handle route, fall back to userkey.
  let profileUrl: string | null = null;
  if (username) {
    profileUrl = `https://app.ethos.network/profile/x/${encodeURIComponent(username)}`;
  } else if (Array.isArray(u.userkeys) && u.userkeys[0]) {
    profileUrl = `https://app.ethos.network/profile/${encodeURIComponent(u.userkeys[0])}`;
  }

  return {
    exists: true,
    vouchesReceived,
    // TODO(spike): "invited by" is not on the v2 user object. The candidate
    // public endpoints are /invitations/* (the tree is downward — who a
    // profile invited — not upward). Confirm during the live probe whether an
    // upward inviter can be derived, else drop this field from EthosPanel v0.
    invitedBy: null,
    profileUrl,
    displayName: u.displayName ?? null,
    username,
  };
}

// ─── The spike: does our Privy token authenticate against Ethos? ────────────
//
// Run this ONCE from a session that has a live Privy access token (call
// getAccessToken() from usePrivy() inside PrivyLoginButton, then pass it in).
// It hits an authenticated Ethos endpoint and reports the verdict.
//
// Expectation (documented in ETHOS-INTEGRATION-V0.md): a token minted by
// FRQNCY's Privy app will NOT validate against Ethos's backend, because Ethos
// verifies tokens issued by THEIR Privy app (app.ethos.network) — different
// app id / audience. A 401/403 here CONFIRMS we'd need separate registration
// (a SIWE-minted Ethos API key) for any WRITE action. It does NOT block the
// read-only surface above, which needs no auth at all.

export interface EthosAuthProbeResult {
  ok: boolean;            // true only if the token was accepted (2xx)
  status: number;         // raw HTTP status
  verdict: 'accepted' | 'rejected' | 'error';
  detail: string;
}

export async function probeEthosAuth(privyAccessToken: string): Promise<EthosAuthProbeResult> {
  if (!privyAccessToken) {
    return { ok: false, status: 0, verdict: 'error', detail: 'No Privy access token supplied.' };
  }

  try {
    // /users/me/review-suggestions is an auth-required ("Authorization") GET —
    // a clean read-only way to test token acceptance without mutating anything.
    const res = await fetch(`${ETHOS_API}/users/me/review-suggestions`, {
      headers: {
        Accept: 'application/json',
        'X-Ethos-Client': ETHOS_CLIENT,
        Authorization: `Bearer ${privyAccessToken}`,
      },
    });

    if (res.ok) {
      return {
        ok: true,
        status: res.status,
        verdict: 'accepted',
        detail: 'Ethos accepted the FRQNCY Privy token — shared Privy audience. Authenticated actions are possible without separate registration.',
      };
    }
    if (res.status === 401 || res.status === 403) {
      return {
        ok: false,
        status: res.status,
        verdict: 'rejected',
        detail: 'Ethos rejected the FRQNCY Privy token (expected). Authenticated/write actions require a separate Ethos credential (SIWE API key, or user auth via Ethos’s own Privy app). Read-only surface is unaffected — it needs no auth.',
      };
    }
    return {
      ok: false,
      status: res.status,
      verdict: 'error',
      detail: `Unexpected status ${res.status} — re-run; check X-Ethos-Client header and token freshness (Privy tokens expire ~1h).`,
    };
  } catch (err: any) {
    return { ok: false, status: 0, verdict: 'error', detail: `Network error: ${err?.message ?? String(err)}` };
  }
}
