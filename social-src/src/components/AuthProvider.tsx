import { useState, useEffect } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import { handlePrivyReturnIfPending } from '../lib/privy-bridge';
import {
  ensureSodium,
  generateMessagingKeypair,
  loadPrivateKeyLocal,
  savePrivateKeyLocal,
  generateSigningKeypair,
  loadSigningPrivateKeyLocal,
  saveSigningPrivateKeyLocal,
  derivePublicKeyDidKey,
} from '../lib/crypto';

// ─────────────────────────────────────────────────────────────────────────────
// Astro-friendly auth hook.
//
// Each Astro island is its own Preact root, so React Context can't be shared
// across islands. Instead we keep a module-level store that every island on
// the page subscribes to.
//
// We avoid supabase.auth.getSession() on boot because in dev it frequently
// gets stuck on an orphaned localStorage lock (lock:sb-*-auth-token), which
// makes islands hang in a "loading" state forever. Instead we read the token
// directly from localStorage synchronously, parse the user out of it, and
// then rely on onAuthStateChange for any subsequent updates.
// ─────────────────────────────────────────────────────────────────────────────

interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  /** libsodium X25519 public key for E2E encrypted messaging. Set on first
      signed-in load if missing — see ensureEncryptionKeypair() below. */
  encryption_public_key?: string | null;
  /** libsodium Ed25519 public key for the hybrid signed-message mirror. Set
      alongside encryption_public_key on first signed-in load. Used to verify
      signatures on the user's posts + follows so they're portable to any
      future protocol (ATProto, Farcaster, etc.) per the onchain pivot proposal. */
  signing_public_key?: string | null;
  privy_did?: string | null;
  wallet_address?: string | null;
  /** Public Bluesky handle for the cross-post bridge. App password lives in
      localStorage only (see lib/atproto-bridge.ts). */
  bluesky_handle?: string | null;
  /** Permanent founder acknowledgement — flipped server-side once the user
      has referred 25 members. See proposals/REFERRAL-REWARDS-V0.md. */
  founder_badge?: boolean | null;
  /** Canonical did:key identifier derived from signing_public_key (round-2
      onchain-pivot column). Populated when the user explicitly sets up
      secure DMs via setupSecureDMs(); see proposals/NRG-ONCHAIN-PIVOT.md. */
  did?: string | null;
}

/**
 * Crypto-identity state for a single axis (encryption or signing).
 *
 *   'ready'                    — privkey in localStorage + pubkey on profile.
 *   'not-set-up'               — neither side has anything yet. User is a new
 *                                signup or an existing user who never opened
 *                                DMs. Tier-2 gate: only generate when the
 *                                user explicitly opts in via setupSecureDMs().
 *   'new-device-import-needed' — pubkey on profile but no privkey locally.
 *                                The user signed in from a new device (or
 *                                cleared browser data). The UI should prompt
 *                                for a backup import — generating a fresh
 *                                key would orphan every past message.
 *   'unknown'                  — initial state before the auth load resolves
 *                                or while signed out.
 */
export type CryptoIdentityStatus =
  | 'ready'
  | 'not-set-up'
  | 'new-device-import-needed'
  | 'unknown';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  encryptionStatus: CryptoIdentityStatus;
  signingStatus: CryptoIdentityStatus;
}

type Listener = (state: AuthState) => void;

const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL || '';
// Extract project ref from the URL: https://<ref>.supabase.co
const PROJECT_REF = SUPABASE_URL.replace('https://', '').split('.')[0];
const TOKEN_KEY = PROJECT_REF ? `sb-${PROJECT_REF}-auth-token` : '';

interface StoredSession {
  user: User | null;
  /** Access token already expired, but a refresh token is on hand — the
      session is recoverable and the user should NOT be treated as signed out. */
  needsRefresh: boolean;
}

/**
 * Read the persisted session straight out of localStorage.
 *
 * An expired ACCESS token does not mean signed out. Access tokens last an hour;
 * the refresh token sitting beside it is what keeps a login alive for weeks.
 * This used to `return null` on expiry, so anyone coming back more than an hour
 * later booted into the signed-out UI — "Sign In" in the nav, "Sign in to post"
 * on the composer — until the SDK's background refresh landed and flipped it
 * back. They were never signed out; they were shown as signed out. If the
 * orphaned `lock:sb-*-auth-token` this file works around happened to be stuck,
 * the refresh never landed and it stayed that way until they signed in again.
 *
 * Now: an expired token with a refresh token still yields the user, flagged as
 * needing a refresh. The UI stays signed-in and the SDK confirms it moments
 * later — or clears it via onAuthStateChange if the refresh token really is
 * dead, which is the rare case and the only one that should ever sign you out.
 */
function readSessionFromStorage(): StoredSession {
  const empty: StoredSession = { user: null, needsRefresh: false };
  if (typeof window === 'undefined' || !TOKEN_KEY) return empty;
  try {
    const raw = window.localStorage.getItem(TOKEN_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw);
    const user = (parsed?.user ?? null) as User | null;
    if (!user) return empty;

    // 10s of skew so a token about to expire mid-request is treated as stale
    // rather than live — cheaper to refresh early than to fire a doomed call.
    const nowSec = Math.floor(Date.now() / 1000) + 10;
    const expired = Boolean(parsed?.expires_at && parsed.expires_at < nowSec);
    if (!expired) return { user, needsRefresh: false };

    // Expired. Recoverable only if a refresh token survived; without one there
    // is genuinely nothing to restore and signed-out is the honest answer.
    if (!parsed?.refresh_token) return empty;
    return { user, needsRefresh: true };
  } catch {
    return empty;
  }
}

let state: AuthState = {
  user: null,
  profile: null,
  loading: true,
  encryptionStatus: 'unknown',
  signingStatus: 'unknown',
};
const listeners = new Set<Listener>();
let initialized = false;

function setState(next: Partial<AuthState>) {
  state = { ...state, ...next };
  listeners.forEach((cb) => cb(state));
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  // Selecting an explicit column list (rather than *) so this stays cheap
  // and so the new bluesky_handle column is visible without depending on
  // the column already existing — when migration 010 hasn't been run, the
  // select will fail and we fall through. Keep this list aligned with the
  // Profile interface above.
  //
  // `did` is the round-2 onchain-pivot column. If migration hasn't run yet,
  // this select fails and we retry without it so the rest of the profile
  // still loads (matches the bluesky_handle pattern above).
  let { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, bio, encryption_public_key, signing_public_key, privy_did, wallet_address, bluesky_handle, founder_badge, did')
    .eq('id', userId)
    .single();

  if (error) {
    const retry = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, bio, encryption_public_key, signing_public_key, privy_did, wallet_address, bluesky_handle, founder_badge')
      .eq('id', userId)
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (error || !data) return null;
  return data as Profile;
}

/**
 * Derive crypto-identity status from local + remote state without doing any
 * generation. Tier-2 fix #12: replaces the auto-generate behavior on load.
 */
function computeEncryptionStatus(profile: Profile | null): CryptoIdentityStatus {
  const localPriv = loadPrivateKeyLocal();
  const remotePub = profile?.encryption_public_key ?? null;
  if (localPriv && remotePub) return 'ready';
  if (remotePub && !localPriv) return 'new-device-import-needed';
  if (localPriv && !remotePub) {
    // Edge case: localStorage has a key but remote pubkey is missing.
    // Treat as ready for status purposes — setupSecureDMs() will re-derive
    // and push the pubkey up via the existing round-1 recovery path.
    return 'ready';
  }
  return 'not-set-up';
}

function computeSigningStatus(profile: Profile | null): CryptoIdentityStatus {
  const localPriv = loadSigningPrivateKeyLocal();
  const remotePub = profile?.signing_public_key ?? null;
  if (localPriv && remotePub) return 'ready';
  if (remotePub && !localPriv) return 'new-device-import-needed';
  if (localPriv && !remotePub) return 'ready'; // see note above
  return 'not-set-up';
}

/**
 * Ensure the signed-in user has a libsodium messaging keypair.
 *
 * Tier-2 fix #12 (2026-05-14): NO LONGER called on every signed-in load.
 * The auto-generate-on-signup behavior was unacceptable consent UX — users
 * who never opened DMs were silently issued cryptographic identities they
 * couldn't recover. This function now runs only via the explicit
 * setupSecureDMs() entry point, which is gated behind a user action in
 * <SetupSecureDMs />.
 *
 * Behaviour preserved (idempotent):
 *
 *   - localStorage privkey + remote pubkey already set → no-op.
 *
 *   - profile.encryption_public_key set, but no localStorage private key:
 *     NEW DEVICE. We don't generate a fresh key (that would orphan all
 *     past messages). Caller should route the user through the backup
 *     import flow instead.
 *
 *   - localStorage has a key but profile doesn't: rare race on signup, or
 *     the profile row lost its pubkey. DERIVE the pubkey from the local
 *     private key (round-1 fix — never regenerate over an existing
 *     identity) and push it up.
 *
 *   - Neither exists: first opt-in. Generate a keypair, save private key
 *     locally, push public key to profile.
 */
async function ensureEncryptionKeypair(userId: string, profile: Profile | null) {
  try {
    const localPriv = loadPrivateKeyLocal();
    const remotePub = profile?.encryption_public_key ?? null;

    if (localPriv && remotePub) return; // Healthy.

    if (remotePub && !localPriv) {
      // New device. Don't auto-generate — past messages are unrecoverable
      // without the original key. The UI will detect the mismatch and prompt.
      console.info('[encryption] new-device state: profile has public key but localStorage is empty. Past messages will need a key import.');
      return;
    }

    if (localPriv && !remotePub) {
      // Push existing local key up. This happens when the profile row lost
      // its public key (rare race on signup, or a manual DB edit) but the
      // user's localStorage still holds the working private key. DO NOT
      // regenerate — that would orphan every past message encrypted to the
      // old derivable pubkey. Instead, derive the pubkey from the local
      // private key (same math libsodium uses inside crypto_box_keypair)
      // and push that up.
      try {
        const so = await ensureSodium();
        const privBytes = so.from_base64(localPriv, so.base64_variants.ORIGINAL);
        const derivedPub = so.crypto_scalarmult_base(privBytes);
        const derivedPubB64 = so.to_base64(derivedPub, so.base64_variants.ORIGINAL);
        const { error } = await supabase
          .from('profiles')
          .update({ encryption_public_key: derivedPubB64 })
          .eq('id', userId);
        if (error) {
          console.warn('[encryption] failed to save derived public key to profile:', error.message);
        } else {
          setState({
            profile: profile ? { ...profile, encryption_public_key: derivedPubB64 } : null,
          });
        }
      } catch (derivErr) {
        console.warn('[encryption] failed to derive public key from local private key:', derivErr);
      }
      return;
    }

    // First-time generation — only reached when neither localPriv nor remotePub exists.
    const { publicKeyB64, privateKeyB64 } = await generateMessagingKeypair();
    savePrivateKeyLocal(privateKeyB64);
    const { error } = await supabase
      .from('profiles')
      .update({ encryption_public_key: publicKeyB64 })
      .eq('id', userId);
    if (error) {
      console.warn('[encryption] failed to save public key to profile:', error.message);
    } else {
      // Refresh state with the new public key so messaging UI flips to encrypted.
      setState({
        profile: profile ? { ...profile, encryption_public_key: publicKeyB64 } : null,
      });
    }
  } catch (err) {
    console.warn('[encryption] ensureEncryptionKeypair failed (non-fatal):', err);
  }
}

/**
 * Ensure the signed-in user has a libsodium Ed25519 signing keypair for the
 * hybrid signed-message mirror (per proposals/NRG-ONCHAIN-PIVOT.md section 7).
 *
 * Same idempotent pattern as ensureEncryptionKeypair, and same Tier-2 gating
 * (2026-05-14): no longer called on every signed-in load. Runs only via the
 * explicit setupSecureDMs() entry point.
 *
 * Generates only if BOTH the localStorage key and the profile public key are
 * missing — never regenerates over an existing identity (would invalidate
 * every past signature).
 */
async function ensureSigningKeypair(userId: string, profile: Profile | null) {
  try {
    const localPriv = loadSigningPrivateKeyLocal();
    const remotePub = profile?.signing_public_key ?? null;

    if (localPriv && remotePub) return; // Healthy.

    if (remotePub && !localPriv) {
      console.info('[signing] new-device state: profile has signing public key but localStorage is empty. Past-author signatures stay verifiable; new posts on this device need a key import to be signed.');
      return;
    }

    if (!remotePub) {
      if (localPriv) {
        // Same recovery as encryption: profile lost its pubkey but the local
        // private key is still good. Regenerating would invalidate every
        // past signature. Derive the Ed25519 pubkey from the local private
        // key (sk_to_pk) and push it up instead.
        try {
          const so = await ensureSodium();
          const privBytes = so.from_base64(localPriv, so.base64_variants.ORIGINAL);
          const derivedPub = so.crypto_sign_ed25519_sk_to_pk(privBytes);
          const derivedPubB64 = so.to_base64(derivedPub, so.base64_variants.ORIGINAL);
          const { error } = await supabase
            .from('profiles')
            .update({ signing_public_key: derivedPubB64 })
            .eq('id', userId);
          if (error) {
            console.warn('[signing] failed to save derived signing public key to profile:', error.message);
          } else {
            setState({
              profile: profile ? { ...profile, signing_public_key: derivedPubB64 } : null,
            });
          }
        } catch (derivErr) {
          console.warn('[signing] failed to derive signing public key from local private key:', derivErr);
        }
        return;
      }

      // First-time generation — neither side has anything.
      const { publicKeyB64, privateKeyB64 } = await generateSigningKeypair();
      saveSigningPrivateKeyLocal(privateKeyB64);
      const { error } = await supabase
        .from('profiles')
        .update({ signing_public_key: publicKeyB64 })
        .eq('id', userId);
      if (error) {
        console.warn('[signing] failed to save signing public key to profile:', error.message);
      } else {
        setState({
          profile: profile ? { ...profile, signing_public_key: publicKeyB64 } : null,
        });
      }
    }
  } catch (err) {
    console.warn('[signing] ensureSigningKeypair failed (non-fatal):', err);
  }
}

/**
 * Module-level implementation of setupSecureDMs — explicit, user-initiated
 * crypto-identity setup. Tier-2 fix #12 entry point. Returns a clean result
 * object so the calling UI can render a generating / done / error step
 * without parsing exceptions.
 *
 * Steps:
 *   1. Encryption: if status is 'not-set-up', run ensureEncryptionKeypair.
 *   2. Signing:    if status is 'not-set-up', run ensureSigningKeypair.
 *   3. Derive a did:key from the (now-present) signing pubkey and push it
 *      to profiles.did. Tolerates the column being absent (migration not
 *      yet run) — logs a warning and continues.
 *   4. Recompute status fields from the fresh profile and broadcast.
 *
 * NOT idempotent in the loud sense — calling it when status is already
 * 'ready' on both axes is fine (each ensure* short-circuits), but the
 * did-derivation step still runs, which keeps things consistent for users
 * who first set up keys before the round-2 column existed.
 */
async function setupSecureDMsImpl(): Promise<{ ok: boolean; error?: string }> {
  const user = state.user;
  if (!user) return { ok: false, error: 'Not signed in.' };

  try {
    const beforeProfile = state.profile;
    const encStatus = computeEncryptionStatus(beforeProfile);
    const sigStatus = computeSigningStatus(beforeProfile);

    if (encStatus === 'new-device-import-needed') {
      return {
        ok: false,
        error:
          'This account already has encryption keys on the server, but no private key on this device. Import your backup instead of generating new keys — generating would orphan every past message.',
      };
    }
    if (sigStatus === 'new-device-import-needed') {
      return {
        ok: false,
        error:
          'This account already has signing keys on the server, but no private key on this device. Import your backup instead of generating new keys — generating would invalidate every past signature.',
      };
    }

    await ensureEncryptionKeypair(user.id, beforeProfile);
    // ensureEncryptionKeypair may have mutated module state.profile via
    // setState() — read the latest snapshot before running signing.
    await ensureSigningKeypair(user.id, state.profile);

    // Populate profiles.did from the freshly-set signing pubkey. The brief
    // notes this hasn't been wired anywhere else yet, so this is the
    // canonical site to do it. Tolerates the column being absent.
    const latestProfile = state.profile;
    const signingPub = latestProfile?.signing_public_key ?? null;
    if (signingPub) {
      try {
        const didKey = await derivePublicKeyDidKey(signingPub);
        const { error: didErr } = await supabase
          .from('profiles')
          .update({ did: didKey })
          .eq('id', user.id);
        if (didErr) {
          console.warn(
            '[did:key] failed to save did to profile (column may not exist yet):',
            didErr.message,
          );
        } else if (latestProfile) {
          setState({ profile: { ...latestProfile, did: didKey } });
        }
      } catch (derivErr) {
        console.warn('[did:key] derive failed (non-fatal):', derivErr);
      }
    }

    // Recompute statuses against whatever the ensure* paths left us with.
    setState({
      encryptionStatus: computeEncryptionStatus(state.profile),
      signingStatus: computeSigningStatus(state.profile),
    });

    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  }
}

function initAuthOnce() {
  if (initialized) return;
  if (typeof window === 'undefined') return;
  initialized = true;

  // Read session synchronously from storage — no lock contention, no hang.
  const { user, needsRefresh } = readSessionFromStorage();

  // Stale access token: nudge the SDK to refresh, but never await it. The
  // whole reason this file reads localStorage directly is that awaiting the
  // auth client can hang on an orphaned lock — so the refresh is fire-and-
  // forget and the UI has already rendered signed-in either way. Success or
  // failure both arrive through onAuthStateChange below.
  if (user && needsRefresh) {
    supabase.auth
      .refreshSession()
      .catch((err) => console.warn('[auth] background session refresh failed:', err));
  }

  state = {
    user,
    profile: null,
    loading: false,
    // Status stays 'unknown' until the profile has loaded. UI should treat
    // 'unknown' as "wait" rather than "not set up" to avoid flashing the
    // setup CTA for existing healthy users while their profile is in-flight.
    encryptionStatus: 'unknown',
    signingStatus: 'unknown',
  };
  // Fetch profile in background; UI can render composer/nav immediately.
  if (user) {
    fetchProfile(user.id).then((profile) => {
      // Tier-2 fix #12 (2026-05-14): no longer auto-generate keys here.
      // Compute crypto-identity status only. Users who already auto-
      // generated keys in prior sessions will resolve to status='ready'
      // (their localStorage privkey + remote pubkey are both intact), so
      // existing users see no change. NEW signups will sit in 'not-set-up'
      // until they explicitly run setupSecureDMs() via <SetupSecureDMs />.
      setState({
        profile: profile ?? null,
        encryptionStatus: computeEncryptionStatus(profile),
        signingStatus: computeSigningStatus(profile),
      });
    });
    // If the user just returned from a Privy magic-link, finish the bridge.
    handlePrivyReturnIfPending(user.id).catch((err) =>
      console.warn('[privy] return-bridge patch failed:', err),
    );
  }

  // Keep state in sync with subsequent sign in / sign out events.
  let awaitingRefresh = Boolean(user && needsRefresh);

  supabase.auth.onAuthStateChange(async (event, session) => {
    const u = session?.user ?? null;

    // While a restore is in flight, a null session is not yet an answer.
    // supabase-js emits INITIAL_SESSION as soon as it starts up — before
    // _recoverAndRefresh has finished — and that first event can legitimately
    // carry null. Acting on it would blank the user we just restored from
    // storage and reintroduce exactly the signed-out flash this change exists
    // to remove. Only an explicit SIGNED_OUT, or a resolved refresh, decides.
    if (awaitingRefresh && !u && event !== 'SIGNED_OUT') return;
    if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
      awaitingRefresh = false;
    }

    const p = u ? await fetchProfile(u.id) : null;
    setState({
      user: u,
      profile: p,
      loading: false,
      encryptionStatus: u ? computeEncryptionStatus(p) : 'unknown',
      signingStatus: u ? computeSigningStatus(p) : 'unknown',
    });
    if (u) {
      // Tier-2 fix #12: do NOT call ensureEncryptionKeypair / ensureSigningKeypair
      // here. They are now reached only via setupSecureDMsImpl().
      handlePrivyReturnIfPending(u.id).catch((err) =>
        console.warn('[privy] return-bridge patch failed:', err),
      );
    }
  });
}

export function useAuth() {
  const [snapshot, setSnapshot] = useState<AuthState>(state);

  useEffect(() => {
    initAuthOnce();
    const listener: Listener = (s) => setSnapshot(s);
    listeners.add(listener);
    // Pick up any state that arrived before this island mounted
    setSnapshot(state);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setState({
      user: null,
      profile: null,
      loading: false,
      encryptionStatus: 'unknown',
      signingStatus: 'unknown',
    });
  };

  return {
    user: snapshot.user,
    profile: snapshot.profile,
    loading: snapshot.loading,
    /**
     * Crypto-identity status, computed lazily from local + remote state.
     * See CryptoIdentityStatus for the meaning of each value.
     *
     * UI rules:
     *   - 'unknown'                  → wait, don't render anything decisive.
     *   - 'ready'                    → composer can encrypt; show no banner.
     *   - 'not-set-up'               → render <SetupSecureDMs /> (or banner).
     *   - 'new-device-import-needed' → prompt for backup import, NOT setup.
     */
    encryptionStatus: snapshot.encryptionStatus,
    signingStatus: snapshot.signingStatus,
    /**
     * Explicit, user-initiated crypto-identity setup. Tier-2 fix #12 entry
     * point — the only path that generates messaging + signing keys. Safe
     * to call when status is already 'ready' (no-op on the keypair side,
     * still ensures profiles.did is populated).
     */
    setupSecureDMs: setupSecureDMsImpl,
    signOut,
  };
}

// Kept as a no-op passthrough for backward compat with any code that expects
// to wrap children in <AuthProvider>. The real work is done by useAuth().
export function AuthProvider({ children }: { children: ComponentChildren }) {
  return <>{children}</>;
}
