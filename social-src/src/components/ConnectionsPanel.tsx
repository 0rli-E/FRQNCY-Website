// External connections panel — link NRG to Bluesky / Farcaster / Lens.
//
// Lives at /social/profile/connections/. v1 ships Bluesky cross-post only;
// Farcaster + Lens are placeholder rows ("coming later") so the surface
// reads as a roadmap rather than a one-off.
//
// Bluesky flow (per proposals/ATPROTO-BRIDGE.md):
//   1. User generates an app password at bsky.app/settings/app-passwords.
//   2. Pastes handle + app password here. We attempt a login.
//   3. On success: persist app password to localStorage, persist handle to
//      profiles.bluesky_handle (public column).
//   4. PostComposer surfaces an opt-out checkbox; createPost mirrors to BSky.
//
// The app password NEVER reaches FRQNCY's server. See lib/atproto-bridge.ts.

import { useState, useEffect } from 'preact/hooks';
import { useAuth } from './AuthProvider';
import { supabase } from '../lib/supabase';
import {
  connectBluesky,
  disconnectBluesky,
  getConnectedBlueskyHandle,
  isBlueskyConnected,
} from '../lib/atproto-bridge';

export default function ConnectionsPanel() {
  const { user, profile, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // Bluesky form state.
  const [bskyHandle, setBskyHandle] = useState('');
  const [bskyAppPassword, setBskyAppPassword] = useState('');

  // Connection status — derived from localStorage on mount + after actions.
  const [connectedHandle, setConnectedHandle] = useState<string | null>(null);

  useEffect(() => {
    setConnectedHandle(getConnectedBlueskyHandle());
  }, [profile]);

  if (loading) {
    return <p class="text-sm text-text-dim">Loading…</p>;
  }

  if (!user) {
    return (
      <div class="rounded-xl bg-card-bg border border-card-border p-6">
        <p class="text-sm text-text-dim">
          Sign in to manage external connections.{' '}
          <a href="/social/login" class="text-gold underline">Sign in →</a>
        </p>
      </div>
    );
  }

  const flash = (msg: string, error = false) => {
    setMessage(msg);
    setIsError(error);
    setTimeout(() => setMessage(''), 8000);
  };

  const handleConnect = async (e: Event) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const result = await connectBluesky({
        handle: bskyHandle,
        appPassword: bskyAppPassword,
        userId: user.id,
      });
      if (!result.ok) {
        flash(result.reason, true);
        return;
      }

      // Login worked + credentials are in localStorage. Now patch the public
      // bluesky_handle column on the profile so the rest of NRG can show it.
      const normalized = bskyHandle.trim().toLowerCase().replace(/^@/, '');
      const { error } = await supabase
        .from('profiles')
        .update({ bluesky_handle: normalized })
        .eq('id', user.id);
      if (error) {
        // Login + localStorage persist worked but the column write failed —
        // most likely migration 010 hasn't been applied. Don't roll back the
        // localStorage credentials; the cross-post still works, the public
        // handle just isn't visible to others until the migration lands.
        console.warn('[connections] bluesky_handle column update failed (migration 010 not applied?):', error.message);
      }

      setConnectedHandle(normalized);
      setBskyHandle('');
      setBskyAppPassword('');
      flash(`Connected as @${normalized}. New posts will mirror to Bluesky.`);
    } catch (err: any) {
      flash(err?.message || 'Connect failed.', true);
    } finally {
      setBusy(false);
    }
  };

  const handleDisconnect = async () => {
    if (busy) return;
    setBusy(true);
    try {
      // Local credentials first — guarantees the cross-post stops even if the
      // server-side patch fails.
      disconnectBluesky();
      setConnectedHandle(null);

      const { error } = await supabase
        .from('profiles')
        .update({ bluesky_handle: null })
        .eq('id', user.id);
      if (error) {
        console.warn('[connections] failed to clear bluesky_handle on profile:', error.message);
        flash('Disconnected locally, but failed to clear the public handle on your profile. Refresh and try again if it still shows.', true);
        return;
      }
      flash('Disconnected. Your Bluesky app password has been removed from this browser.');
    } catch (err: any) {
      flash(err?.message || 'Disconnect failed.', true);
    } finally {
      setBusy(false);
    }
  };

  const isConnected = !!connectedHandle && isBlueskyConnected();

  return (
    <div class="space-y-6">
      {/* Bluesky */}
      <div class="rounded-xl bg-card-bg border border-card-border p-6">
        <div class="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 class="font-heading text-xl text-gold flex items-center gap-2">
              <BlueskyMark />
              Bluesky
            </h2>
            <p class="text-xs text-text-dim mt-1">
              ATProto cross-post bridge. App password lives in this browser only.
            </p>
          </div>
          <span class="flex items-center gap-2 text-xs">
            <span class={`w-2 h-2 rounded-full ${isConnected ? 'bg-gold' : 'bg-text-dim'}`} />
            <span class="text-text-dim">{isConnected ? 'connected' : 'not connected'}</span>
          </span>
        </div>

        {isConnected ? (
          <div class="space-y-3">
            <div class="rounded-lg bg-navy-mid/40 border border-card-border/60 px-4 py-3 flex items-center justify-between">
              <div>
                <p class="text-sm text-text">@{connectedHandle}</p>
                <p class="text-xs text-text-dim mt-0.5">
                  Posts you make on NRG will also appear on Bluesky (you can disable per-post).
                </p>
              </div>
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={busy}
                class="px-3 py-1.5 rounded-lg border border-amber-500/40 text-amber-200 text-xs font-medium hover:bg-amber-500/10 transition-colors disabled:opacity-30"
              >
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleConnect} class="space-y-3">
            <p class="text-xs text-text-dim leading-relaxed">
              Generate an app password at{' '}
              <a
                href="https://bsky.app/settings/app-passwords"
                target="_blank"
                rel="noopener noreferrer"
                class="text-gold hover:text-gold-light underline"
              >
                bsky.app/settings/app-passwords
              </a>
              . Don't paste your main password — app passwords are revocable and limited to specific apps.
            </p>
            <div>
              <label class="block text-xs text-text-dim mb-1">Bluesky handle</label>
              <input
                type="text"
                value={bskyHandle}
                onInput={(e) => setBskyHandle((e.target as HTMLInputElement).value)}
                placeholder="alice.bsky.social"
                disabled={busy}
                class="w-full bg-navy-mid border border-card-border rounded-lg px-3 py-2 text-sm text-text placeholder-text-dim/60 focus:outline-none focus:border-gold/40"
              />
            </div>
            <div>
              <label class="block text-xs text-text-dim mb-1">App password</label>
              <input
                type="password"
                value={bskyAppPassword}
                onInput={(e) => setBskyAppPassword((e.target as HTMLInputElement).value)}
                placeholder="xxxx-xxxx-xxxx-xxxx"
                disabled={busy}
                autoComplete="off"
                class="w-full bg-navy-mid border border-card-border rounded-lg px-3 py-2 text-sm text-text placeholder-text-dim/60 focus:outline-none focus:border-gold/40 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={busy || !bskyHandle.trim() || !bskyAppPassword.trim()}
              class="px-4 py-2 rounded-lg bg-gold text-navy text-sm font-medium hover:bg-gold-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {busy ? 'Connecting…' : 'Connect Bluesky'}
            </button>
          </form>
        )}
      </div>

      {/* Farcaster placeholder */}
      <PlaceholderRow
        title="Farcaster"
        description="Onchain social on Optimism. Frame-aware cross-post + Hub mirroring."
        eta="Coming in a future release."
      />

      {/* Lens placeholder */}
      <PlaceholderRow
        title="Lens"
        description="Lens v3 on the Lens Network. Cross-post + comment mirror."
        eta="Coming in a future release."
      />

      {message && (
        <div
          class={`rounded-lg px-4 py-3 text-sm ${
            isError
              ? 'text-red-400 bg-red-500/5 border border-red-500/20'
              : 'text-gold-light bg-gold/5 border border-gold/20'
          }`}
        >
          {message}
        </div>
      )}

      <div class="rounded-xl bg-card-bg/50 border border-card-border p-5 text-xs text-text-dim leading-relaxed">
        <p class="font-medium text-text mb-2">How this works</p>
        <p>
          The bridge runs entirely in your browser. When you post on NRG, we use your
          stored app password to publish the same text to your Bluesky PDS. FRQNCY's
          server never sees the password — it lives in this browser's localStorage.
        </p>
        <p class="mt-2">
          One-way for now: comments and likes on Bluesky don't mirror back to NRG.
          See{' '}
          <a
            href="https://github.com/0rli-E/frqncy-website/blob/main/proposals/ATPROTO-BRIDGE.md"
            class="underline hover:text-gold"
          >
            ATPROTO-BRIDGE.md
          </a>{' '}
          for the v2 plan.
        </p>
      </div>
    </div>
  );
}

function PlaceholderRow({
  title,
  description,
  eta,
}: {
  title: string;
  description: string;
  eta: string;
}) {
  return (
    <div class="rounded-xl bg-card-bg/40 border border-card-border/60 p-6 opacity-60">
      <div class="flex items-start justify-between gap-3 mb-2">
        <div>
          <h2 class="font-heading text-xl text-text-dim">{title}</h2>
          <p class="text-xs text-text-dim mt-1">{description}</p>
        </div>
        <span class="text-xs text-text-dim italic">{eta}</span>
      </div>
      <button
        type="button"
        disabled
        class="px-3 py-1.5 rounded-lg border border-card-border text-text-dim text-xs cursor-not-allowed"
      >
        Connect
      </button>
    </div>
  );
}

function BlueskyMark() {
  // Stylized butterfly — close enough for the panel header without lifting
  // the official asset. Inherits currentColor from the surrounding text.
  return (
    <svg
      class="w-5 h-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M5 5c2 0 5 2 7 6 2-4 5-6 7-6 1.5 0 2.5 1 2.5 3 0 2-1 5-2.5 7-1.5 2-4 4-7 4s-5.5-2-7-4C3.5 13 2.5 10 2.5 8c0-2 1-3 2.5-3z" />
      <circle cx="12" cy="13" r="0.5" fill="currentColor" />
    </svg>
  );
}
