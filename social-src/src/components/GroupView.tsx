import { useEffect, useState } from 'preact/hooks';
import Feed from './Feed';
import PostComposer from './PostComposer';
import GroupInviteBox from './GroupInviteBox';
import { useAuth } from './AuthProvider';
import {
  getGroupBySlug,
  isMember,
  joinGroup,
  leaveGroup,
  groupsSchemaMissing,
  type Group,
} from '../lib/groups';

/**
 * GroupView — a single group's page. Reads the slug from the URL at runtime so
 * one built shell (/social/groups/[slug].astro) serves every group, the same
 * trick ChannelView uses. Header + join/leave + a group-scoped composer + feed.
 */
export default function GroupView() {
  const { user } = useAuth();
  const [slug, setSlug] = useState('');
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [joined, setJoined] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const parts = location.pathname.split('/').filter(Boolean);
    // ['social','groups','<slug>']
    const s = decodeURIComponent(parts[2] || '');
    setSlug(s);
    if (s) document.title = `${s.replace(/-/g, ' ')} · Groups · NRG · FRQNCY`;
  }, []);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      const g = await getGroupBySlug(slug);
      if (cancelled) return;
      if (!g) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setGroup(g);
      if (document.title.startsWith(slug.replace(/-/g, ' '))) document.title = `${g.name} · Groups · NRG · FRQNCY`;
      if (user?.id) setJoined(await isMember(g.id, user.id));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [slug, user?.id]);

  const toggleMembership = async () => {
    if (!group) return;
    if (!user?.id) {
      location.href = '/social/login';
      return;
    }
    setBusy(true);
    const ok = joined ? await leaveGroup(group.id, user.id) : await joinGroup(group.id, user.id);
    if (ok) {
      setJoined(!joined);
      setGroup({ ...group, member_count: Math.max(0, group.member_count + (joined ? -1 : 1)) });
    }
    setBusy(false);
  };

  if (loading) {
    return (
      <div class="max-w-3xl mx-auto mt-6 space-y-6">
        <div class="rounded-xl bg-card-bg border border-card-border p-5 animate-pulse h-28" />
        <div class="rounded-xl bg-card-bg border border-card-border p-5 animate-pulse h-24" />
      </div>
    );
  }

  if (notFound || !group) {
    return (
      <div class="max-w-3xl mx-auto mt-6 rounded-xl bg-card-bg border border-card-border p-8 text-center">
        <p class="text-text-dim text-sm">
          {groupsSchemaMissing
            ? 'Groups are being set up. Check back shortly.'
            : 'That group doesn’t exist (yet).'}{' '}
          <a href="/social/groups" class="text-gold hover:text-gold-light">All groups →</a>
        </p>
      </div>
    );
  }

  const accent = group.accent || '#C4973A';
  const isPrivate = group.visibility === 'private';

  return (
    <div class="max-w-3xl mx-auto mt-6 space-y-6">
      <header class="rounded-xl bg-card-bg border border-card-border p-5">
        <div class="flex items-start gap-4">
          <div
            class="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-heading shrink-0 border"
            style={{ color: accent, borderColor: accent + '4D', background: accent + '1A' }}
          >
            {group.slug === 'townhall' ? '◎' : group.name.charAt(0).toUpperCase()}
          </div>
          <div class="flex-1 min-w-0">
            <h1 class="font-heading text-2xl text-text mb-1">{group.name}</h1>
            {group.description && <p class="text-sm text-text-dim">{group.description}</p>}
            <p class="text-xs text-text-dim mt-2">
              {group.member_count} {group.member_count === 1 ? 'member' : 'members'}
              {group.visibility === 'private' && ' · private'}
            </p>
          </div>
          <div class="flex flex-col items-end gap-2 shrink-0">
            {/* No Join button on a private group you're not in — the RLS policy
                would reject the insert, so offering it would just fail. */}
            {isPrivate && !joined ? (
              <span class="text-xs text-text-dim border border-card-border rounded-full px-3 py-1.5">
                Invite only
              </span>
            ) : (
              <button
                type="button"
                onClick={toggleMembership}
                disabled={busy}
                class={`text-sm px-4 py-1.5 rounded-full transition-colors disabled:opacity-50 ${
                  joined
                    ? 'border border-card-border text-text-dim hover:text-text hover:border-gold/30'
                    : 'bg-gold text-navy font-medium hover:bg-gold-light'
                }`}
              >
                {busy ? '…' : joined ? 'Joined' : 'Join'}
              </button>
            )}
            <a href="/social/groups" class="text-xs text-text-dim hover:text-gold transition-colors">
              ← All groups
            </a>
          </div>
        </div>
      </header>

      {/* Members can invite. Flat by design — every member may invite, there is
          no admin tier deciding who counts. Private groups only: an open group
          needs no invite, the link is the invite. */}
      {joined && isPrivate && <GroupInviteBox groupId={group.id} groupName={group.name} />}

      {/* Composer: only members post. Non-members see a join prompt; the feed
          stays readable (open groups are public). */}
      {joined ? (
        <PostComposer groupId={group.id} groupName={group.name} />
      ) : isPrivate ? (
        /* Private + not a member. RLS already returns no posts here, so say
           why the page is empty rather than showing a bare "no posts yet". */
        <div class="rounded-xl bg-card-bg border border-card-border p-6 text-center space-y-2">
          <p class="text-sm text-text">This group is private.</p>
          <p class="text-xs text-text-dim leading-relaxed">
            {user
              ? 'Only members can read what’s written here. You need an invite from someone already inside.'
              : 'Only members can read what’s written here.'}
          </p>
          {!user && (
            <a
              href="/social/login"
              class="inline-block mt-1 px-5 py-2 rounded-full bg-gold text-navy text-sm font-medium hover:bg-gold-light transition-colors"
            >Sign in</a>
          )}
        </div>
      ) : (
        <div class="rounded-xl bg-card-bg border border-card-border p-5 text-center">
          <p class="text-sm text-text-dim mb-3">
            {user ? `Join ${group.name} to post here.` : `Sign in and join ${group.name} to post.`}
          </p>
          <button
            type="button"
            onClick={toggleMembership}
            disabled={busy}
            class="inline-block px-5 py-2 rounded-full bg-gold text-navy text-sm font-medium hover:bg-gold-light transition-colors disabled:opacity-50"
          >
            {busy ? '…' : user ? `Join ${group.name}` : 'Sign in to join'}
          </button>
        </div>
      )}

      {/* A private group you're not in returns no rows anyway — skip the feed
          entirely so it can't read as "this group is empty". */}
      {(!isPrivate || joined) && (
        <Feed
          groupId={group.id}
          emptyLabel={`No posts in ${group.name} yet. ${joined ? 'Be the first.' : 'Join to start the conversation.'}`}
        />
      )}
    </div>
  );
}
