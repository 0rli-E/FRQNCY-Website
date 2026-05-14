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
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
}

type Listener = (state: AuthState) => void;

const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL || '';
// Extract project ref from the URL: https://<ref>.supabase.co
const PROJECT_REF = SUPABASE_URL.replace('https://', '').split('.')[0];
const TOKEN_KEY = PROJECT_REF ? `sb-${PROJECT_REF}-auth-token` : '';

function readSessionFromStorage(): User | null {
  if (typeof window === 'undefined' || !TOKEN_KEY) return null;
  try {
    const raw = window.localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Check expiry
    const nowSec = Math.floor(Date.now() / 1000);
    if (parsed?.expires_at && parsed.expires_at < nowSec) return null;
    return (parsed?.user ?? null) as User | null;
  } catch {
    return null;
  }
}

let state: AuthState = { user: null, profile: null, loading: true };
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
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, bio, encryption_public_key, signing_public_key, privy_did, wallet_address, bluesky_handle, founder_badge')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return data as Profile;
}

/**
 * Ensure the signed-in user has a libsodium messaging keypair.
 *
 * Called on every signed-in load. Idempotent — if the user already has both
 * a private key in localStorage AND a public key on their profile, this is a
 * no-op. Otherwise:
 *
 *   - profile.encryption_public_key set, but no localStorage private key:
 *     this is a NEW DEVICE. We don't generate a fresh key (that would orphan
 *     all past messages). Surface the state so the UI can prompt for an
 *     import. Caller decides what to do.
 *
 *   - localStorage has a key but profile doesn't: rare race on signup. Push
 *     the public key to profile.
 *
 *   - Neither exists: first signup. Generate a keypair, save private key
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
 * Same idempotent pattern as ensureEncryptionKeypair. Generates only if BOTH
 * the localStorage key and the profile public key are missing — never
 * regenerates over an existing identity (would invalidate every past
 * signature).
 *
 * Until api.ts is wired to actually sign posts + follows, this just makes
 * sure the key exists and is portable. The signing happens in the next
 * session — schema is already open (migration 009).
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

function initAuthOnce() {
  if (initialized) return;
  if (typeof window === 'undefined') return;
  initialized = true;

  // Read session synchronously from storage — no lock contention, no hang.
  const user = readSessionFromStorage();
  state = { user, profile: null, loading: false };
  // Fetch profile in background; UI can render composer/nav immediately.
  if (user) {
    fetchProfile(user.id).then((profile) => {
      if (profile) setState({ profile });
      // Ensure messaging + signing keypairs exist. Runs once per signed-in load.
      ensureEncryptionKeypair(user.id, profile);
      ensureSigningKeypair(user.id, profile);
    });
    // If the user just returned from a Privy magic-link, finish the bridge.
    handlePrivyReturnIfPending(user.id).catch((err) =>
      console.warn('[privy] return-bridge patch failed:', err),
    );
  }

  // Keep state in sync with subsequent sign in / sign out events.
  supabase.auth.onAuthStateChange(async (_event, session) => {
    const u = session?.user ?? null;
    const p = u ? await fetchProfile(u.id) : null;
    setState({ user: u, profile: p, loading: false });
    if (u) {
      ensureEncryptionKeypair(u.id, p);
      ensureSigningKeypair(u.id, p);
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
    setState({ user: null, profile: null, loading: false });
  };

  return {
    user: snapshot.user,
    profile: snapshot.profile,
    loading: snapshot.loading,
    signOut,
  };
}

// Kept as a no-op passthrough for backward compat with any code that expects
// to wrap children in <AuthProvider>. The real work is done by useAuth().
export function AuthProvider({ children }: { children: ComponentChildren }) {
  return <>{children}</>;
}
