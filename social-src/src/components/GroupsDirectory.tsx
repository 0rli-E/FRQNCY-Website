import { useEffect, useState } from 'preact/hooks';
import { useAuth } from './AuthProvider';
import {
  listOpenGroups,
  getMyGroupIds,
  joinGroup,
  leaveGroup,
  createGroup,
  groupsSchemaMissing,
  type Group,
} from '../lib/groups';

/**
 * GroupsDirectory — the meeting-place index. Lists every open group, shows who
 * you've joined, and lets any signed-in human start a new one. The Townhall is
 * pinned first; the rest sort by membership then recency (handled server-side).
 */
export default function GroupsDirectory() {
  const { user, loading: authLoading } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [mine, setMine] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [schemaMissing, setSchemaMissing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Create-group form state
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const load = async () => {
    const list = await listOpenGroups();
    setSchemaMissing(groupsSchemaMissing);
    // Pin the townhall first regardless of member_count ordering.
    list.sort((a, b) => (a.slug === 'townhall' ? -1 : b.slug === 'townhall' ? 1 : 0));
    setGroups(list);
    if (user?.id) setMine(await getMyGroupIds(user.id));
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const toggleMembership = async (g: Group) => {
    if (!user?.id) {
      location.href = '/social/login';
      return;
    }
    setBusyId(g.id);
    const joined = mine.has(g.id);
    const ok = joined ? await leaveGroup(g.id, user.id) : await joinGroup(g.id, user.id);
    if (ok) {
      setMine((prev) => {
        const next = new Set(prev);
        joined ? next.delete(g.id) : next.add(g.id);
        return next;
      });
      setGroups((prev) =>
        prev.map((x) =>
          x.id === g.id ? { ...x, member_count: Math.max(0, x.member_count + (joined ? -1 : 1)) } : x
        )
      );
    }
    setBusyId(null);
  };

  const handleCreate = async (e: Event) => {
    e.preventDefault();
    if (!user?.id || creating) return;
    if (!newName.trim()) {
      setCreateError('Give your group a name.');
      return;
    }
    setCreating(true);
    setCreateError(null);
    const { group, error } = await createGroup({ name: newName, description: newDesc }, user.id);
    if (group) {
      location.href = `/social/g/${group.slug}`;
      return;
    }
    setCreateError(error ?? 'Could not create the group.');
    setCreating(false);
  };

  return (
    <div class="max-w-3xl mx-auto mt-6 space-y-6 pb-16">
      <header class="rounded-xl bg-card-bg border border-card-border p-5">
        <h1 class="font-heading text-2xl text-text mb-1">Groups</h1>
        <p class="text-sm text-text-dim">
          The meeting places of the network. Join the rooms that resonate — or start your own.
        </p>
      </header>

      {schemaMissing && (
        <div class="rounded-xl bg-card-bg border border-amber-500/20 p-4 text-sm text-text-dim">
          Groups are being set up. Check back shortly.
        </div>
      )}

      {/* Create group */}
      {!schemaMissing && (
        <div class="rounded-xl bg-card-bg border border-card-border p-4">
          {!showCreate ? (
            <button
              type="button"
              onClick={() => (user ? setShowCreate(true) : (location.href = '/social/login'))}
              class="text-sm text-gold hover:text-gold-light transition-colors"
            >
              + Start a new group
            </button>
          ) : (
            <form onSubmit={handleCreate} class="space-y-3">
              <input
                value={newName}
                onInput={(e) => setNewName((e.target as HTMLInputElement).value)}
                placeholder="Group name"
                maxLength={80}
                class="w-full bg-navy-mid rounded-lg px-3 py-2 text-sm text-text placeholder-text-dim focus:outline-none focus:ring-1 focus:ring-gold/40"
              />
              <textarea
                value={newDesc}
                onInput={(e) => setNewDesc((e.target as HTMLTextAreaElement).value)}
                placeholder="What's this group for? (optional)"
                maxLength={500}
                rows={2}
                class="w-full bg-navy-mid rounded-lg px-3 py-2 text-sm text-text placeholder-text-dim resize-none focus:outline-none focus:ring-1 focus:ring-gold/40"
              />
              {createError && <p class="text-xs text-amber-400">{createError}</p>}
              <div class="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={creating}
                  class="px-4 py-1.5 rounded-full bg-gold text-navy text-sm font-medium hover:bg-gold-light transition-colors disabled:opacity-50"
                >
                  {creating ? 'Creating…' : 'Create group'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowCreate(false); setCreateError(null); }}
                  class="text-sm text-text-dim hover:text-text transition-colors"
                >
                  Cancel
                </button>
                <span class="text-xs text-text-dim ml-auto">Open group — anyone can join</span>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Group list */}
      {loading ? (
        <div class="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} class="rounded-xl bg-card-bg border border-card-border p-5 animate-pulse h-24" />
          ))}
        </div>
      ) : groups.length === 0 && !schemaMissing ? (
        <div class="rounded-xl bg-card-bg border border-card-border p-8 text-center">
          <p class="text-text-dim text-sm">No groups yet. Be the first to start one.</p>
        </div>
      ) : (
        <div class="space-y-3">
          {groups.map((g) => {
            const joined = mine.has(g.id);
            return (
              <div key={g.id} class="rounded-xl bg-card-bg border border-card-border p-5 flex items-start gap-4">
                <div
                  class="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-heading shrink-0 border"
                  style={{
                    color: g.accent || '#C4973A',
                    borderColor: (g.accent || '#C4973A') + '4D',
                    background: (g.accent || '#C4973A') + '1A',
                  }}
                >
                  {g.slug === 'townhall' ? '◎' : g.name.charAt(0).toUpperCase()}
                </div>
                <div class="flex-1 min-w-0">
                  <a href={`/social/g/${g.slug}`} class="font-heading text-lg text-text hover:text-gold transition-colors">
                    {g.name}
                  </a>
                  {g.description && <p class="text-sm text-text-dim mt-0.5 line-clamp-2">{g.description}</p>}
                  <p class="text-xs text-text-dim mt-2">
                    {g.member_count} {g.member_count === 1 ? 'member' : 'members'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleMembership(g)}
                  disabled={busyId === g.id}
                  class={`shrink-0 text-sm px-4 py-1.5 rounded-full transition-colors disabled:opacity-50 ${
                    joined
                      ? 'border border-card-border text-text-dim hover:text-text hover:border-gold/30'
                      : 'bg-gold text-navy font-medium hover:bg-gold-light'
                  }`}
                >
                  {busyId === g.id ? '…' : joined ? 'Joined' : 'Join'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
