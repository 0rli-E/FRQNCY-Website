import { useState } from 'preact/hooks';
import { inviteToGroup } from '../lib/groups';

interface Props {
  groupId: string;
  groupName: string;
}

/**
 * Invite someone into a private group by username.
 *
 * Any member can invite — flat by design. There is no admin tier deciding who
 * gets to bring people in, which matches how the rest of NRG avoids ranking
 * people against each other.
 */
export default function GroupInviteBox({ groupId, groupName }: Props) {
  const [open, setOpen] = useState(false);
  const [handle, setHandle] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string[]>([]);

  const submit = async (e: Event) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);

    const res = await inviteToGroup(groupId, handle);
    setBusy(false);

    if (!res.ok) {
      setError(res.error ?? 'Could not send that invite.');
      return;
    }
    setSent((prev) => [...prev, handle.trim().replace(/^@/, '')]);
    setHandle('');
  };

  if (!open) {
    return (
      <div class="rounded-xl bg-card-bg border border-card-border p-4">
        <button
          type="button"
          onClick={() => setOpen(true)}
          class="text-sm text-gold hover:text-gold-light transition-colors"
        >
          + Invite someone to {groupName}
        </button>
      </div>
    );
  }

  return (
    <div class="rounded-xl bg-card-bg border border-card-border p-4">
      <form onSubmit={submit} class="space-y-3">
        <label class="block text-xs uppercase tracking-wider text-text-dim">
          Invite by username
        </label>
        <div class="flex gap-2">
          <input
            value={handle}
            onInput={(e) => setHandle((e.target as HTMLInputElement).value)}
            placeholder="@username"
            class="flex-1 bg-navy-mid rounded-lg px-3 py-2 text-sm text-text placeholder-text-dim focus:outline-none focus:ring-1 focus:ring-gold/40"
          />
          <button
            type="submit"
            disabled={busy || !handle.trim()}
            class="px-4 py-1.5 rounded-full bg-gold text-navy text-sm font-medium hover:bg-gold-light transition-colors disabled:opacity-40"
          >
            {busy ? 'Sending…' : 'Invite'}
          </button>
        </div>

        {error && <p class="text-xs text-amber-400">{error}</p>}

        {sent.length > 0 && (
          <p class="text-xs text-text-dim">
            Invited {sent.map((h) => `@${h}`).join(', ')}. They'll see it on their
            groups page.
          </p>
        )}

        <button
          type="button"
          onClick={() => { setOpen(false); setError(null); }}
          class="text-xs text-text-dim hover:text-text transition-colors"
        >
          Done
        </button>
      </form>
    </div>
  );
}
