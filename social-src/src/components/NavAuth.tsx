import { useState, useRef, useEffect } from 'preact/hooks';
import { useAuth } from './AuthProvider';
import { loadPrivateKeyLocal } from '../lib/crypto';

const BACKUP_ACK_LS_KEY = 'frqncy.nrg.backup_acknowledged';

/** Read the backup-acknowledged flag. Returns true if the user has either
    downloaded their key file or imported one — both prove a backup exists
    somewhere outside this browser. */
function readBackupAck(): boolean {
  if (typeof window === 'undefined') return true; // SSR — assume fine.
  try {
    return window.localStorage.getItem(BACKUP_ACK_LS_KEY) === '1';
  } catch (_) {
    return true;
  }
}

export default function NavAuth() {
  const { user, profile, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  // We track `backupAck` and `hasLocalKey` so the warning dot can render
  // even before the Supabase profile resolves — anyone with cached
  // localStorage keys deserves to see the prompt.
  const [backupAck, setBackupAck] = useState<boolean>(true); // Default true to avoid a flash.
  const [hasLocalKey, setHasLocalKey] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Read both flags once on mount, and re-read whenever the dropdown opens
  // (covers the case where the user just downloaded a backup in another tab
  // or panel, then comes back to the nav).
  useEffect(() => {
    setBackupAck(readBackupAck());
    setHasLocalKey(!!loadPrivateKeyLocal());
  }, []);

  useEffect(() => {
    if (open) {
      setBackupAck(readBackupAck());
      setHasLocalKey(!!loadPrivateKeyLocal());
    }
  }, [open]);

  if (loading) {
    return null;
  }

  if (!user) {
    return (
      <a
        href="/social/login"
        class="px-4 py-1.5 rounded-full bg-gold text-navy text-sm font-medium hover:bg-gold-light transition-colors"
      >
        Sign In
      </a>
    );
  }

  const initials = (profile?.display_name || user.email || '?')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // The user "has keys" if either:
  //   (a) the profile has an encryption_public_key (Supabase has resolved), OR
  //   (b) localStorage already holds a private key (cached from a past visit).
  // Either case means we have something worth losing — and worth warning about.
  const userHasKeys = !!(profile?.encryption_public_key || hasLocalKey);
  const showWarning = userHasKeys && !backupAck;

  return (
    <div class="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        class="flex items-center gap-2 focus:outline-none relative"
      >
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.display_name}
            class="w-8 h-8 rounded-full object-cover border border-card-border"
          />
        ) : (
          <div class="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-semibold border border-card-border">
            {initials}
          </div>
        )}
        {showWarning && (
          <span
            aria-label="Back up your keys"
            title="Back up your keys"
            class="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-card-bg"
          />
        )}
      </button>

      {open && (
        <div class="absolute right-0 mt-2 w-48 rounded-xl bg-card-bg border border-card-border shadow-xl z-50 py-1 overflow-hidden">
          <div class="px-4 py-2 border-b border-card-border">
            <p class="text-sm font-medium text-text truncate">{profile?.display_name || 'User'}</p>
            <p class="text-xs text-text-dim truncate">@{profile?.username || 'user'}</p>
          </div>

          {showWarning && (
            <a
              href="/social/profile/keys/"
              class="flex items-center gap-2 px-4 py-2 text-sm text-amber-300 hover:bg-amber-500/5 transition-colors border-b border-card-border"
            >
              <span aria-hidden="true">⚠</span>
              <span>Back up your keys</span>
            </a>
          )}

          <a
            href={`/social/profile/${profile?.username || ''}`}
            class="flex items-center gap-2 px-4 py-2 text-sm text-text-dim hover:text-text hover:bg-navy-mid transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Profile
          </a>

          <a
            href="/social/messages"
            class="flex items-center gap-2 px-4 py-2 text-sm text-text-dim hover:text-text hover:bg-navy-mid transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Messages
          </a>

          <a
            href="/social/notifications"
            class="flex items-center gap-2 px-4 py-2 text-sm text-text-dim hover:text-text hover:bg-navy-mid transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Notifications
          </a>

          <a
            href="/social/profile/keys"
            class="flex items-center gap-2 px-4 py-2 text-sm text-text-dim hover:text-text hover:bg-navy-mid transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 7a4 4 0 100 8 4 4 0 000-8zM15 7l-6 6m0 0l-2-2m2 2l-2 2 2 2m-2-2H5" />
            </svg>
            Encryption keys
          </a>

          <a
            href="/social/profile/connections"
            class="flex items-center gap-2 px-4 py-2 text-sm text-text-dim hover:text-text hover:bg-navy-mid transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Connections
          </a>

          <a
            href="/membership/"
            class="flex items-center gap-2 px-4 py-2 text-sm text-text-dim hover:text-text hover:bg-navy-mid transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Membership
          </a>

          <div class="border-t border-card-border mt-1">
            <button
              onClick={async () => {
                await signOut();
                setOpen(false);
                window.location.href = '/social/';
              }}
              class="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/5 transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
