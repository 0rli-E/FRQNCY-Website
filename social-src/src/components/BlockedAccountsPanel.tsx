import { useState, useEffect } from 'preact/hooks';
import { useAuth } from './AuthProvider';
import { listBlockedProfiles, unblockUser, type BlockedProfile } from '../lib/moderation';

/** Manage the accounts you've blocked. Undo is one tap — a block is a boundary
    you can move, not a punishment you have to justify. */
export default function BlockedAccountsPanel() {
  const { user } = useAuth();
  const [rows, setRows] = useState<BlockedProfile[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => setRows(await listBlockedProfiles());

  useEffect(() => {
    if (!user) { setRows([]); return; }
    load();
  }, [user]);

  if (!user) {
    return (
      <div class="rounded-xl bg-card-bg border border-card-border p-6 text-center">
        <p class="text-sm text-text-dim">
          <a href="/social/login" class="text-gold hover:underline">Sign in</a> to see your blocked accounts.
        </p>
      </div>
    );
  }

  if (rows === null) {
    return (
      <div class="rounded-xl bg-card-bg border border-card-border p-6 text-center">
        <p class="text-sm text-text-dim">Loading…</p>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div class="rounded-xl bg-card-bg border border-card-border p-6 text-center">
        <p class="text-sm text-text-dim">
          You haven't blocked anyone. Nothing to manage here — which is the good outcome.
        </p>
      </div>
    );
  }

  const handleUnblock = async (id: string) => {
    setBusyId(id);
    const res = await unblockUser(id);
    setBusyId(null);
    if (res.ok) setRows((prev) => (prev ?? []).filter((r) => r.blocked_id !== id));
  };

  return (
    <div class="space-y-2">
      {rows.map((r) => (
        <div
          key={r.blocked_id}
          class="rounded-xl bg-card-bg border border-card-border p-4 flex items-center gap-3"
        >
          <div class="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm font-semibold shrink-0 overflow-hidden">
            {r.avatar_url
              ? <img src={r.avatar_url} alt="" class="w-full h-full object-cover" />
              : (r.display_name || r.username).slice(0, 2).toUpperCase()}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm text-text truncate">{r.display_name}</p>
            <p class="text-xs text-text-dim truncate">@{r.username}</p>
          </div>
          <button
            type="button"
            onClick={() => handleUnblock(r.blocked_id)}
            disabled={busyId === r.blocked_id}
            class="text-xs px-4 py-1.5 rounded-full border border-card-border text-text-dim hover:text-text hover:border-gold/30 transition-colors disabled:opacity-40 shrink-0"
          >{busyId === r.blocked_id ? 'Unblocking…' : 'Unblock'}</button>
        </div>
      ))}
    </div>
  );
}
