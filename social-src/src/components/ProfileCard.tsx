import { useState, useEffect } from 'preact/hooks';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';

interface ProfileCardProps {
  username: string;
}

interface ProfileRow {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  post_count: number;
  follower_count: number;
  following_count: number;
  created_at: string;
  wallet_address: string | null;
  encryption_public_key: string | null;
  signing_public_key: string | null;
  /** Permanent founder acknowledgement — server-side flip at 25 referred
      members. See proposals/REFERRAL-REWARDS-V0.md. */
  founder_badge: boolean | null;
}

/** A single Ed25519 signer authorised under this profile. Source: migration
    020_per_device_signer_keys.sql. Tier-3 will add custody-signed attestation
    columns; for now the table is INSERT/UPDATE gated only by auth.uid(). */
interface SigningKeyRow {
  id: string;
  public_key: string;
  device_label: string | null;
  created_at: string;
}

/** "3 minutes ago" / "yesterday" / "May 14" for the device list. Short-form;
    falls back to the locale date for anything older than a week. */
function relativeTime(iso: string): string {
  try {
    const then = new Date(iso).getTime();
    const now = Date.now();
    const diffSec = Math.max(0, Math.floor((now - then) / 1000));
    if (diffSec < 60) return 'just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

/** Short-form a 0x-prefixed address as `0xabcd…1234`. */
function shortAddress(addr: string): string {
  if (!addr) return '';
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function monthYear(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  } catch {
    return '';
  }
}

export default function ProfileCard({ username }: ProfileCardProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [walletCopied, setWalletCopied] = useState(false);
  /** Active signing keys for the viewed profile. Only populated when the
      viewer is the profile owner (per RLS on signing_keys, SELECT is gated to
      profile_id = auth.uid()). `null` = not yet fetched; `[]` = fetched and
      empty. `'legacy'` = migration 020 not applied (table missing); show the
      one-device fallback. */
  const [devices, setDevices] = useState<SigningKeyRow[] | 'legacy' | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, bio, post_count, follower_count, following_count, created_at, wallet_address, encryption_public_key, signing_public_key, founder_badge')
        .eq('username', username)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        setNotFound(true);
      } else {
        setProfile(data as ProfileRow);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [username]);

  // Device list — only when the viewer is the profile owner. The SELECT RLS
  // policy on signing_keys (migration 020) already enforces this server-side,
  // but we skip the query entirely when ids don't match to avoid an extra
  // round trip on every profile view. Fails soft if the table doesn't exist
  // yet (legacy environments where migration 020 hasn't run).
  useEffect(() => {
    if (!profile || !user || profile.id !== user.id) {
      setDevices(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('signing_keys')
        .select('id, public_key, device_label, created_at')
        .eq('profile_id', profile.id)
        .is('revoked_at', null)
        .order('created_at', { ascending: false });
      if (cancelled) return;
      if (error) {
        // PGRST205 = "Could not find the table 'public.signing_keys'" — the
        // migration hasn't been applied. Render the legacy one-device line.
        const code = (error as { code?: string }).code;
        if (code === 'PGRST205' || code === '42P01') {
          setDevices('legacy');
        } else {
          // Any other error: keep the section hidden. Don't leak details.
          setDevices(null);
        }
      } else {
        setDevices((data || []) as SigningKeyRow[]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profile, user]);

  const copyWallet = async () => {
    if (!profile?.wallet_address) return;
    try {
      await navigator.clipboard.writeText(profile.wallet_address);
      setWalletCopied(true);
      setTimeout(() => setWalletCopied(false), 1600);
    } catch (_) {
      // No-op — copy is a nice-to-have.
    }
  };

  const displayName = profile?.display_name || (username.charAt(0).toUpperCase() + username.slice(1));
  const initials = (profile?.display_name || username).slice(0, 2).toUpperCase();

  if (loading) {
    return (
      <div class="rounded-xl bg-card-bg border border-card-border overflow-hidden animate-pulse">
        <div class="h-24 bg-navy-mid" />
        <div class="px-5 pb-5">
          <div class="-mt-10 mb-3">
            <div class="w-20 h-20 rounded-full bg-navy-mid border-4 border-navy" />
          </div>
          <div class="h-5 bg-navy-mid rounded w-1/2 mb-2" />
          <div class="h-3 bg-navy-mid rounded w-1/3 mb-3" />
          <div class="h-3 bg-navy-mid rounded w-full mb-1" />
          <div class="h-3 bg-navy-mid rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div class="rounded-xl bg-card-bg border border-card-border p-6 text-center">
        <p class="text-sm text-text-dim">No profile found for @{username}</p>
      </div>
    );
  }

  return (
    <div class="rounded-xl bg-card-bg border border-card-border overflow-hidden">
      {/* Banner */}
      <div class="h-24 bg-gradient-to-br from-navy-mid via-accent/10 to-gold/10" />

      {/* Avatar + info */}
      <div class="px-5 pb-5">
        <div class="-mt-10 mb-3">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={displayName}
              class="w-20 h-20 rounded-full object-cover border-4 border-navy"
            />
          ) : (
            <div class="w-20 h-20 rounded-full bg-navy-mid border-4 border-navy flex items-center justify-center text-gold text-xl font-heading font-semibold">
              {initials}
            </div>
          )}
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <h2 class="font-heading text-2xl text-gold">{displayName}</h2>
          {profile?.founder_badge === true && (
            <span
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold/10 border border-gold/30 text-gold text-[10px] tracking-wide"
              title="25 members joined via this account."
            >
              <span aria-hidden="true">✦</span>
              <span>Founder</span>
            </span>
          )}
        </div>
        <p class="text-sm text-text-dim mt-0.5">@{profile?.username || username}</p>

        {profile?.bio && (
          <p class="text-sm text-text leading-relaxed mt-3">{profile.bio}</p>
        )}

        {profile?.created_at && (
          <div class="flex items-center gap-4 mt-4 text-xs text-text-dim">
            <span class="flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Joined {monthYear(profile.created_at)}
            </span>
          </div>
        )}

        {/* Identity surface — wallet, encryption + signing key state, export.
            Renders for every profile (even unsigned-in viewers); clicking
            the wallet copies it. The export endpoint is public so any user
            can fetch any user's signed records. */}
        <div class="mt-5 pt-4 border-t border-card-border/60">
          <p class="text-[11px] uppercase tracking-[0.18em] text-text-dim mb-2.5">Identity</p>
          <div class="space-y-1.5 text-xs">
            {/* Wallet */}
            <div class="flex items-center justify-between gap-3">
              <span class="text-text-dim">Wallet</span>
              {profile?.wallet_address ? (
                <button
                  type="button"
                  onClick={copyWallet}
                  class="font-mono text-text hover:text-gold transition-colors"
                  title={walletCopied ? 'Copied' : 'Click to copy'}
                >
                  {walletCopied ? 'copied' : shortAddress(profile.wallet_address)}
                </button>
              ) : (
                <span class="text-text-dim/70 italic">not connected</span>
              )}
            </div>

            {/* Encryption */}
            <div class="flex items-center justify-between gap-3">
              <span class="text-text-dim">Encryption</span>
              {profile?.encryption_public_key ? (
                <span class="text-gold flex items-center gap-1">
                  <span aria-hidden="true">◊</span>
                  <span>End-to-end ready</span>
                </span>
              ) : (
                <span class="text-text-dim/70 italic">no keys yet</span>
              )}
            </div>

            {/* Signed records */}
            <div class="flex items-center justify-between gap-3">
              <span class="text-text-dim">Signed records</span>
              {profile?.signing_public_key ? (
                <span class="text-gold flex items-center gap-1">
                  <span aria-hidden="true">✓</span>
                  <span>Signing public key set</span>
                </span>
              ) : (
                <span class="text-text-dim/70 italic">no signing key</span>
              )}
            </div>
          </div>

          {/* Authorised devices — Tier-2 foundation for per-device signers
              (migration 020). Only renders for the profile owner (RLS gated).
              Tier-3 ships the actual /social/profile/keys/ management page;
              the link below is a stub until then. */}
          {devices !== null && profile && user && profile.id === user.id && (
            <div class="mt-4 pt-3 border-t border-card-border/40">
              {devices === 'legacy' ? (
                <div class="flex items-center justify-between gap-3 text-xs">
                  <span class="text-text-dim">Devices</span>
                  <span class="text-text-dim">1 — this browser <span class="text-text-dim/60">(legacy)</span></span>
                </div>
              ) : (
                <>
                  <div class="flex items-center justify-between gap-3 text-xs mb-1.5">
                    <span class="text-text-dim">Authorised devices</span>
                    <span class="text-text">{devices.length || 1}</span>
                  </div>
                  {/* Most-recently-created entry is rendered as "this browser"
                      if its public_key matches profiles.signing_public_key
                      (the currently active signer, migration 009). For users
                      that have only been seeded by migration 020 there is
                      exactly one row and the match is trivially true. */}
                  {devices.length > 0 ? (
                    <ul class="space-y-1 text-xs">
                      {devices.slice(0, 1).map((d) => {
                        const isThis = !!profile?.signing_public_key && d.public_key === profile.signing_public_key;
                        return (
                          <li key={d.id} class="flex items-center justify-between gap-3">
                            <span class="text-text">
                              {d.device_label || 'Unnamed device'}
                              {isThis && <span class="text-text-dim"> — this browser</span>}
                            </span>
                            <span class="text-text-dim/70">added {relativeTime(d.created_at)}</span>
                          </li>
                        );
                      })}
                      {devices.length > 1 && (
                        <li class="text-text-dim">
                          + {devices.length - 1} other device{devices.length - 1 === 1 ? '' : 's'}
                        </li>
                      )}
                    </ul>
                  ) : (
                    <p class="text-xs text-text-dim/70 italic">No signer registered yet.</p>
                  )}
                  <a
                    href="/social/profile/keys/"
                    class="block mt-2 text-xs text-gold/80 hover:text-gold transition-colors"
                  >
                    Manage devices →
                  </a>
                </>
              )}
            </div>
          )}

          {/* Export */}
          <a
            href={`/api/export?username=${encodeURIComponent(profile?.username || username)}`}
            class="block mt-4 text-center text-xs px-4 py-2 rounded-full border border-gold/40 text-gold hover:bg-gold/10 transition-colors"
          >
            Download all signed records ↓
          </a>
        </div>
      </div>
    </div>
  );
}
