// Privy embedded-wallet login button.
//
// Wraps the Privy hook surface in an island-friendly component that AuthForm
// can drop into any page. After a successful Privy login we hand off to
// lib/privy-bridge to either patch the existing Supabase profile or send a
// magic link so the same email becomes a Supabase session.
//
// IMPORTANT: This component depends on a PrivyProvider higher up the tree.
// We render the provider inline so AuthForm doesn't need to know about it.
//
// Required runtime env: PUBLIC_PRIVY_APP_ID. If unset, the button renders
// disabled with a "not configured" tooltip — failing-loud beats silently
// breaking signup for the non-Privy path.

import { useState } from 'preact/hooks';
import { PrivyProvider, usePrivy } from '@privy-io/react-auth';
import { bridgePrivyToSupabase } from '../lib/privy-bridge';

const PRIVY_APP_ID = (import.meta.env.PUBLIC_PRIVY_APP_ID || '').trim();

export default function PrivyLoginButton() {
  if (!PRIVY_APP_ID) {
    // User-facing copy when the embedded-wallet provider isn't configured.
    // Honest framing (per the no-decentralization-overclaim feedback memory):
    // wallet features aren't live yet, so render an honest "coming soon" state
    // instead of a dead-looking error button.
    return (
      <button
        type="button"
        disabled
        title="Wallet support is coming soon. Email or Google sign-in works today."
        class="w-full py-2.5 rounded-lg border border-card-border text-text-dim text-sm opacity-60 cursor-not-allowed flex items-center justify-center gap-2"
      >
        <WalletIcon />
        Wallet (coming soon)
      </button>
    );
  }

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ['email', 'google', 'wallet'],
        appearance: {
          theme: 'dark',
          accentColor: '#C9A96E',
          logo: '/favicon.svg',
          showWalletLoginFirst: false,
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
          requireUserPasswordOnCreate: false,
        },
      }}
    >
      <PrivyLoginInner />
    </PrivyProvider>
  );
}

function PrivyLoginInner() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const [linking, setLinking] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleClick = async () => {
    setMessage('');
    setIsError(false);

    if (!ready) return;
    if (!authenticated) {
      login();
      return;
    }

    // Already authenticated with Privy — bridge to Supabase.
    setLinking(true);
    try {
      const wallet = user?.wallet?.address ?? null;
      const email = user?.email?.address ?? user?.google?.email ?? null;
      const displayName = user?.google?.name ?? null;
      const did = user?.id ?? '';

      const result = await bridgePrivyToSupabase({
        privyDid: did,
        email,
        walletAddress: wallet,
        displayName,
      });

      if (!result.ok) {
        setIsError(true);
        setMessage(result.reason);
      } else if (result.session === 'magic-link-sent') {
        setMessage('Check your email — we sent a magic link to finish linking your wallet.');
      } else {
        setMessage('Wallet linked. Redirecting…');
        setTimeout(() => { window.location.href = '/social/'; }, 800);
      }
    } catch (err: any) {
      setIsError(true);
      setMessage(err?.message || 'Privy bridge failed. Try again.');
    } finally {
      setLinking(false);
    }
  };

  const label = !ready
    ? 'Loading wallet…'
    : !authenticated
      ? 'Continue with wallet or email (Privy)'
      : linking
        ? 'Linking…'
        : 'Finish linking with FRQNCY';

  return (
    <div class="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={!ready || linking}
        class="w-full py-2.5 rounded-lg border border-gold/30 text-gold text-sm hover:bg-gold/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <WalletIcon />
        {label}
      </button>

      {authenticated && user?.wallet?.address && (
        <div class="text-xs text-text-dim text-center font-mono">
          {short(user.wallet.address)}
          {' · '}
          <button
            type="button"
            onClick={() => logout()}
            class="underline hover:text-gold transition-colors"
          >
            disconnect
          </button>
        </div>
      )}

      {message && (
        <div class={`text-xs rounded-lg px-3 py-2 ${
          isError
            ? 'text-red-400 bg-red-500/5 border border-red-500/20'
            : 'text-gold-light bg-gold/5 border border-gold/20'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
}

function short(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function WalletIcon() {
  return (
    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
      <path d="M3 7a2 2 0 012-2h13l3 3v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
      <circle cx="17" cy="13" r="1.2" fill="currentColor" />
    </svg>
  );
}
