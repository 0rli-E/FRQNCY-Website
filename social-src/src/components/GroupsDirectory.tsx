import { useEffect, useState } from 'preact/hooks';
import { useAuth } from './AuthProvider';
import {
  listOpenGroups,
  listMyPrivateGroups,
  listMyInvites,
  declineInvite,
  getMyGroupIds,
  joinGroup,
  leaveGroup,
  createGroup,
  groupsSchemaMissing,
  type Group,
  type GroupInvite,
} from '../lib/groups';

/**
 * GroupsDirectory — the meeting-place index. Lists every open group, shows who
 * you've joined, and lets any signed-in human start a new one.
 *
 * The Townhall is lifted out of the list into its own pinned surface above it:
 * it's the room the whole network shares, not the most popular of nine peers.
 * Below that come any invites waiting on you, your private groups (which RLS
 * hides from everyone else), then the open rooms.
 */
export default function GroupsDirectory() {
  const { user, loading: authLoading } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [townhall, setTownhall] = useState<Group | null>(null);
  const [mine, setMine] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [schemaMissing, setSchemaMissing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Create-group form state
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPrivate, setNewPrivate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Private groups you're in + invites waiting on you (migration 026). Private
  // groups never appear in the open list — RLS won't return them to anyone but
  // their members — so they get their own section.
  const [privateGroups, setPrivateGroups] = useState<Group[]>([]);
  const [invites, setInvites] = useState<GroupInvite[]>([]);

  const load = async () => {
    const list = await listOpenGroups();
    setSchemaMissing(groupsSchemaMissing);
    // The townhall is pinned as its own surface above the list, so it comes
    // OUT of the list rather than being sorted to the top of it.
    setTownhall(list.find((g) => g.slug === 'townhall') ?? null);
    setGroups(list.filter((g) => g.slug !== 'townhall'));
    if (user?.id) {
      setMine(await getMyGroupIds(user.id));
      setPrivateGroups(await listMyPrivateGroups(user.id));
      setInvites(await listMyInvites(user.id));
    } else {
      setPrivateGroups([]);
      setInvites([]);
    }
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

  /** Accept a private-group invite: the join succeeds because has_group_invite
      is satisfied, then the invite row is consumed. */
  const acceptInvite = async (g: Group) => {
    if (!user?.id) return;
    setBusyId(g.id);
    const ok = await joinGroup(g.id, user.id);
    if (ok) {
      await declineInvite(g.id, user.id); // consume the invite now it's used
      location.href = `/social/g/${g.slug}`;
      return;
    }
    setBusyId(null);
  };

  const dismissInvite = async (g: Group) => {
    if (!user?.id) return;
    setBusyId(g.id);
    if (await declineInvite(g.id, user.id)) {
      setInvites((prev) => prev.filter((i) => i.group.id !== g.id));
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
    const { group, error } = await createGroup(
      { name: newName, description: newDesc, visibility: newPrivate ? 'private' : 'open' },
      user.id
    );
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

      {/* The Townhall isn't one room among nine — it's the one everybody
          shares. Pinned above the list rather than sorted to the top of it, so
          it doesn't read as merely the most popular pillar. */}
      {townhall && (
        <a
          href="/social/g/townhall"
          class="block rounded-xl border border-gold/30 bg-gradient-to-br from-gold/10 to-transparent p-5 hover:border-gold/50 transition-colors"
        >
          <div class="flex items-start gap-4">
            <div
              class="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-heading shrink-0 border"
              style={{ color: '#C4973A', borderColor: '#C4973A66', background: '#C4973A1A' }}
            >
              ◎
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-[10px] uppercase tracking-[0.2em] text-gold/70 mb-0.5">
                The room everyone shares
              </p>
              <p class="font-heading text-xl text-text">{townhall.name}</p>
              {townhall.description && (
                <p class="text-sm text-text-dim mt-1">{townhall.description}</p>
              )}
              <p class="text-xs text-text-dim mt-2">
                {townhall.member_count} {townhall.member_count === 1 ? 'member' : 'members'}
                {mine.has(townhall.id) && ' · you’re in'}
              </p>
            </div>
          </div>
        </a>
      )}

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

              {/* Visibility. Fixed at creation — migration 026 blocks changing
                  it later, because private → open would retroactively publish
                  everything anyone had written in the group. */}
              <div class="space-y-1.5">
                <label
                  class={`flex items-start gap-2.5 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
                    !newPrivate ? 'border-gold/60 bg-gold/10' : 'border-card-border bg-navy-mid hover:border-gold/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="group-visibility"
                    checked={!newPrivate}
                    onChange={() => setNewPrivate(false)}
                    class="mt-1 accent-gold"
                  />
                  <span>
                    <span class="block text-sm text-text">Open</span>
                    <span class="block text-xs text-text-dim">
                      Listed here. Anyone can read it and join.
                    </span>
                  </span>
                </label>
                <label
                  class={`flex items-start gap-2.5 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
                    newPrivate ? 'border-gold/60 bg-gold/10' : 'border-card-border bg-navy-mid hover:border-gold/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="group-visibility"
                    checked={newPrivate}
                    onChange={() => setNewPrivate(true)}
                    class="mt-1 accent-gold"
                  />
                  <span>
                    <span class="block text-sm text-text">Private</span>
                    <span class="block text-xs text-text-dim">
                      Unlisted. Only members can read it, and only by invite.
                    </span>
                  </span>
                </label>
                <p class="text-[11px] text-text-dim leading-snug pt-0.5">
                  This can't be changed later — switching a private group to open
                  would publish everything already written in it.
                </p>
              </div>

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
              </div>
            </form>
          )}
        </div>
      )}

      {/* Invites waiting on you */}
      {invites.length > 0 && (
        <section class="space-y-3">
          <h2 class="font-heading text-lg text-gold">You've been invited</h2>
          {invites.map((inv) => (
            <div
              key={inv.group.id}
              class="rounded-xl bg-card-bg border border-gold/30 p-5 flex items-start gap-4"
            >
              <div
                class="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-heading shrink-0 border"
                style={{
                  color: inv.group.accent || '#C4973A',
                  borderColor: (inv.group.accent || '#C4973A') + '4D',
                  background: (inv.group.accent || '#C4973A') + '1A',
                }}
              >
                {inv.group.name.charAt(0).toUpperCase()}
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-heading text-lg text-text">{inv.group.name}</p>
                {inv.group.description && (
                  <p class="text-sm text-text-dim mt-0.5 line-clamp-2">{inv.group.description}</p>
                )}
                <p class="text-xs text-text-dim mt-2">Private group · invitation</p>
              </div>
              <div class="flex flex-col gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => acceptInvite(inv.group)}
                  disabled={busyId === inv.group.id}
                  class="text-sm px-4 py-1.5 rounded-full bg-gold text-navy font-medium hover:bg-gold-light transition-colors disabled:opacity-50"
                >
                  {busyId === inv.group.id ? '…' : 'Accept'}
                </button>
                <button
                  type="button"
                  onClick={() => dismissInvite(inv.group)}
                  disabled={busyId === inv.group.id}
                  class="text-xs px-4 py-1 rounded-full border border-card-border text-text-dim hover:text-text transition-colors disabled:opacity-50"
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Private groups you're in — invisible to everyone else by RLS */}
      {privateGroups.length > 0 && (
        <section class="space-y-3">
          <h2 class="font-heading text-lg text-gold">Your private groups</h2>
          {privateGroups.map((g) => (
            <div key={g.id} class="rounded-xl bg-card-bg border border-card-border p-5 flex items-start gap-4">
              <div
                class="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-heading shrink-0 border"
                style={{
                  color: g.accent || '#C4973A',
                  borderColor: (g.accent || '#C4973A') + '4D',
                  background: (g.accent || '#C4973A') + '1A',
                }}
              >
                {g.name.charAt(0).toUpperCase()}
              </div>
              <div class="flex-1 min-w-0">
                <a href={`/social/g/${g.slug}`} class="font-heading text-lg text-text hover:text-gold transition-colors">
                  {g.name}
                </a>
                {g.description && <p class="text-sm text-text-dim mt-0.5 line-clamp-2">{g.description}</p>}
                <p class="text-xs text-text-dim mt-2">
                  Private · {g.member_count} {g.member_count === 1 ? 'member' : 'members'}
                </p>
              </div>
            </div>
          ))}
        </section>
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
          <h2 class="font-heading text-lg text-gold">Open rooms</h2>
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
