import { useState, useEffect, useCallback } from 'preact/hooks';
import { useAuth } from './AuthProvider';
import { supabase } from '../lib/supabase';

interface NotificationRow {
  id: string;
  type: string;
  actor_id: string | null;
  ref_type: string | null;
  ref_id: string | null;
  is_read: boolean;
  created_at: string;
  actor?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
  /** Resolved post id for comment-type notifications. Filled in by a
   *  bulk lookup after the main fetch so the click target is correct. */
  resolved_post_id?: string | null;
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function notifText(n: NotificationRow): string {
  switch (n.type) {
    case 'follow':         return 'started following you';
    case 'like':           return 'liked your post';
    case 'comment':        return 'commented on your post';
    case 'reply':          return 'replied to you';
    case 'mention':        return 'mentioned you';
    case 'friend_request': return 'sent you a friend request';
    case 'friend_accept':  return 'accepted your friend request';
    case 'message':        return 'sent you a message';
    default:               return n.type;
  }
}

/**
 * Resolve where a notification should route on click. Returns null when
 * we have nothing useful to link to (degraded gracefully — the card is
 * still rendered, just non-clickable).
 */
function notifHref(n: NotificationRow): string | null {
  switch (n.type) {
    case 'follow':
      return n.actor?.username ? `/social/u/${n.actor.username}` : null;
    case 'message':
      return '/social/messages';
    case 'like':
      // ref_type=post, ref_id=post_id
      if (n.ref_type === 'post' && n.ref_id) return `/social/post/${n.ref_id}`;
      return null;
    case 'mention':
      if (n.ref_type === 'post' && n.ref_id) return `/social/post/${n.ref_id}`;
      // For mentions on a comment, we resolved the post id in a later pass
      if (n.ref_type === 'comment' && n.resolved_post_id) return `/social/post/${n.resolved_post_id}`;
      return null;
    case 'comment':
    case 'reply':
      // Comment notifications carry ref_id = comment.id; the post id was
      // bulk-resolved after the fetch.
      if (n.resolved_post_id) return `/social/post/${n.resolved_post_id}`;
      return null;
    default:
      return null;
  }
}

export default function NotificationsList() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'all' | 'mentions' | 'follows' | 'likes'>('all');
  const [marking, setMarking] = useState(false);

  const enrichWithPostIds = useCallback(async (rows: NotificationRow[]) => {
    // Find every comment-typed notification that needs its parent post id.
    const commentIds = rows
      .filter(n => n.ref_type === 'comment' && n.ref_id)
      .map(n => n.ref_id as string);
    if (commentIds.length === 0) return rows;

    const { data: comments } = await supabase
      .from('comments')
      .select('id, post_id')
      .in('id', Array.from(new Set(commentIds)));

    const map = new Map<string, string>();
    (comments || []).forEach((c: any) => map.set(c.id, c.post_id));

    return rows.map(n => {
      if (n.ref_type === 'comment' && n.ref_id) {
        return { ...n, resolved_post_id: map.get(n.ref_id) || null };
      }
      return n;
    });
  }, []);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('notifications')
      .select(
        'id, type, actor_id, ref_type, ref_id, is_read, created_at, actor:profiles!actor_id(username, display_name, avatar_url)'
      )
      .eq('target_user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      const enriched = await enrichWithPostIds(data as unknown as NotificationRow[]);
      setItems(enriched);
    }
    setLoading(false);
  }, [user, enrichWithPostIds]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => { if (!cancelled) await fetchAll(); })();

    // Realtime — new notifications and mark-read updates flow into the list.
    const ch = supabase
      .channel(`notifs-list-${user.id}-${Math.random().toString(36).slice(2, 8)}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `target_user_id=eq.${user.id}` },
        () => { if (!cancelled) fetchAll(); }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [user, authLoading, fetchAll]);

  const markRead = useCallback(async (id: string) => {
    // Optimistic — flip locally first, then write through. The realtime
    // subscription would also bring this back, but that's slower.
    setItems(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  }, []);

  const markAllRead = useCallback(async () => {
    if (!user || marking) return;
    setMarking(true);
    setItems(prev => prev.map(n => ({ ...n, is_read: true })));
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('target_user_id', user.id)
      .eq('is_read', false);
    setMarking(false);
  }, [user, marking]);

  const handleClick = useCallback(
    (e: MouseEvent, n: NotificationRow) => {
      const href = notifHref(n);
      // Always try to mark-read; navigation happens via the anchor itself.
      if (!n.is_read) markRead(n.id);
      if (!href) {
        // Degraded card — keep it as a no-op click, nothing to navigate to.
        e.preventDefault();
      }
    },
    [markRead]
  );

  if (authLoading || loading) {
    return (
      <div class="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} class="rounded-xl bg-card-bg border border-card-border p-4 animate-pulse">
            <div class="flex gap-3">
              <div class="w-10 h-10 rounded-full bg-navy-mid" />
              <div class="flex-1 space-y-2">
                <div class="h-3 bg-navy-mid rounded w-2/3" />
                <div class="h-2 bg-navy-mid rounded w-1/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!user) {
    return (
      <div class="rounded-xl bg-card-bg border border-card-border p-8 text-center">
        <p class="text-text-dim text-sm mb-4">Sign in to see your notifications.</p>
        <a
          href="/social/login"
          class="inline-block px-4 py-2 rounded-lg bg-gold/10 border border-gold/30 text-gold text-sm font-medium hover:bg-gold/20 transition-colors"
        >
          Sign In
        </a>
      </div>
    );
  }

  const filtered = items.filter((n) => {
    if (tab === 'all') return true;
    if (tab === 'mentions') return n.type === 'mention';
    if (tab === 'follows') return n.type === 'follow';
    if (tab === 'likes') return n.type === 'like';
    return true;
  });

  const unreadCount = items.filter(n => !n.is_read).length;

  return (
    <>
      {/* Filter tabs + mark-all-read */}
      <div class="flex items-center gap-3 mb-6">
        <div class="flex-1 flex gap-1 bg-card-bg rounded-lg p-1 border border-card-border">
          {(['all', 'mentions', 'follows', 'likes'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              class={`flex-1 text-sm py-2 rounded-md font-medium transition-colors capitalize ${
                tab === t ? 'bg-navy-mid text-gold' : 'text-text-dim hover:text-text'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            disabled={marking}
            class="text-xs text-text-dim hover:text-gold border border-card-border rounded-full px-3 py-1.5 transition-colors disabled:opacity-50 whitespace-nowrap"
            aria-label={`Mark all ${unreadCount} notifications read`}
          >
            {marking ? 'Marking…' : 'Mark all read'}
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div class="rounded-xl bg-card-bg border border-card-border p-8 text-center">
          <p class="text-text-dim text-sm">
            {tab === 'all'
              ? "You're all caught up — no notifications yet."
              : `No ${tab} yet.`}
          </p>
        </div>
      ) : (
        <div class="space-y-2">
          {filtered.map((n) => {
            const actor = n.actor;
            const initial =
              (actor?.display_name || actor?.username || '?').charAt(0).toUpperCase();
            const href = notifHref(n);
            const Card = href ? 'a' : 'div';
            const cardProps: any = href
              ? { href, onClick: (e: MouseEvent) => handleClick(e, n) }
              : {};
            return (
              <Card
                key={n.id}
                {...cardProps}
                class={`rounded-xl border p-4 flex items-start gap-3 transition-colors ${
                  href ? 'cursor-pointer' : ''
                } ${
                  n.is_read
                    ? 'bg-card-bg border-card-border hover:border-gold/20'
                    : 'bg-gold/5 border-gold/20 hover:border-gold/40'
                }`}
              >
                <div class="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm font-semibold shrink-0 overflow-hidden">
                  {actor?.avatar_url ? (
                    <img
                      src={actor.avatar_url}
                      alt={actor.display_name}
                      class="w-full h-full object-cover"
                    />
                  ) : (
                    initial
                  )}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-text">
                    {actor?.username ? (
                      <span class="font-medium text-gold">
                        {actor.display_name || actor.username}
                      </span>
                    ) : (
                      <span class="font-medium text-gold">Someone</span>
                    )}{' '}
                    {notifText(n)}
                  </p>
                  <p class="text-xs text-text-dim mt-1">{timeAgo(n.created_at)}</p>
                </div>
                {!n.is_read && <div class="w-2 h-2 rounded-full bg-gold shrink-0 mt-2" aria-label="Unread" />}
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
