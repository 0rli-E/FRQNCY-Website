// Privy → Supabase bridge.
//
// Privy provides identity (email, social login, embedded wallet). Supabase
// provides offchain data + RLS-aware querying. The bridge keeps both alive in
// parallel: a Privy login mints/refreshes a Supabase session keyed on the same
// email, then writes privy_did + wallet_address back to the profile.
//
// Why this shape: keeps Supabase as the data plane (RLS, posts, comments,
// follows, messages all unchanged) while Privy adds embedded-wallet identity
// without forcing every existing user through a wallet flow. See
// proposals/PROTOCOL-LESSONS-2026-04.md and proposals/NRG-ONCHAIN-PIVOT.md.

import { supabase } from './supabase';

export type PrivyLinkResult =
  | { ok: true; session: 'magic-link-sent' | 'signed-in'; profileId?: string }
  | { ok: false; reason: string };

interface PrivyLinkInput {
  privyDid: string;
  email: string | null;
  walletAddress: string | null;
  displayName?: string | null;
}

/**
 * Called after a successful Privy login. Ensures a Supabase session exists for
 * the same email + writes Privy identifiers onto the profile row.
 *
 * Behaviour:
 *   - If Supabase already has an active session for this email, just patches
 *     the profile (privy_did, wallet_address) and returns 'signed-in'.
 *   - If no active Supabase session, sends a magic-link OTP to the same email
 *     so the user lands back in /social/ as an authenticated Supabase user.
 *     Patches the profile after Supabase resolves on next page load.
 *
 * Limitations:
 *   - Email mismatch between Privy (email login) and Supabase is not handled.
 *     A Privy social-login (Google) where the user already has a Supabase
 *     account under a different email will create a second account; merge is
 *     manual.
 *   - Wallet-only Privy signups (no email/social) get no Supabase session
 *     because Supabase requires an email or password. We surface that as a
 *     "wallet-only mode" warning and keep the wallet linked client-side until
 *     the user adds an email.
 */
export async function bridgePrivyToSupabase(
  input: PrivyLinkInput,
): Promise<PrivyLinkResult> {
  if (!input.privyDid) {
    return { ok: false, reason: 'Privy DID missing — login did not complete cleanly' };
  }

  // Wallet-only signup: no email means no Supabase user. Persist the wallet
  // intent client-side so a later email-add flow can complete the bridge.
  if (!input.email) {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('frqncy.nrg.privy.pending_wallet', input.walletAddress ?? '');
      window.localStorage.setItem('frqncy.nrg.privy.pending_did', input.privyDid);
    }
    return {
      ok: false,
      reason: 'Wallet-only login. Add an email to your Privy account, then return to NRG to finish linking.',
    };
  }

  const { data: { session } } = await supabase.auth.getSession();
  const sessionEmail = session?.user?.email?.toLowerCase();
  const incomingEmail = input.email.toLowerCase();

  if (session && sessionEmail === incomingEmail) {
    // Already signed in. Patch profile with Privy identifiers.
    const patchResult = await patchProfileWithPrivy(session.user.id, input);
    return patchResult.ok
      ? { ok: true, session: 'signed-in', profileId: session.user.id }
      : { ok: false, reason: patchResult.reason };
  }

  // No matching Supabase session. Send a magic link to the same email; on
  // return, the auth state listener (AuthProvider) will trigger a profile
  // patch via the handle_privy_return helper below.
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('frqncy.nrg.privy.pending_did', input.privyDid);
    if (input.walletAddress) {
      window.localStorage.setItem('frqncy.nrg.privy.pending_wallet', input.walletAddress);
    }
    if (input.displayName) {
      window.localStorage.setItem('frqncy.nrg.privy.pending_display_name', input.displayName);
    }
  }

  const { error } = await supabase.auth.signInWithOtp({
    email: incomingEmail,
    options: {
      emailRedirectTo: typeof window !== 'undefined'
        ? `${window.location.origin}/social/`
        : undefined,
      data: input.displayName
        ? { display_name: input.displayName, username: slugify(input.displayName) }
        : undefined,
    },
  });

  if (error) {
    return { ok: false, reason: `Magic-link send failed: ${error.message}` };
  }
  return { ok: true, session: 'magic-link-sent' };
}

/**
 * Called when Supabase auth resolves on /social/ load. If we have a pending
 * Privy DID + wallet from a recent Privy login, patch the profile now.
 * Idempotent — safe to call on every auth-state change.
 */
export async function handlePrivyReturnIfPending(userId: string): Promise<void> {
  if (typeof window === 'undefined') return;
  const pendingDid = window.localStorage.getItem('frqncy.nrg.privy.pending_did');
  if (!pendingDid) return;

  const pendingWallet = window.localStorage.getItem('frqncy.nrg.privy.pending_wallet');

  await patchProfileWithPrivy(userId, {
    privyDid: pendingDid,
    email: null,
    walletAddress: pendingWallet,
  });

  window.localStorage.removeItem('frqncy.nrg.privy.pending_did');
  window.localStorage.removeItem('frqncy.nrg.privy.pending_wallet');
  window.localStorage.removeItem('frqncy.nrg.privy.pending_display_name');
}

async function patchProfileWithPrivy(
  userId: string,
  input: PrivyLinkInput,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const updates: Record<string, unknown> = {
    privy_did: input.privyDid,
  };
  if (input.walletAddress) {
    updates.wallet_address = input.walletAddress.toLowerCase();
  }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);

  if (error) {
    return { ok: false, reason: `Profile patch failed: ${error.message}` };
  }
  return { ok: true };
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}
