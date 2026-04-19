import { useState, useEffect } from 'preact/hooks';
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
    case 'follow':
      return 'started following you';
    case 'like':
      return 'liked your post';
    case 'comment':
      return 'commented on your post';
    case 'mention':
      return 'mentioned you in a post';
    case 'friend_request':
      return 'sent you a friend request';
    case 'friend_accept':
      return 'accepted your friend request';
    case 'message':
      return 'sent you a message';
    default:
      return n.type;
  }
}

export default function NotificationsList() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'all' | 'mentions' | 'follows' | 'likes'>('all');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select(
          'id, type, actor_id, ref_type, ref_id, is_read, created_at, actor:profiles!actor_id(username, display_name, avatar_url)'
        )
        .eq('target_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (cancelled) return;
      if (!error && data) {
        setItems(data as unknown as NotificationRow[]);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

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

  return (
    <>
      {/* Filter tabs */}
      <div class="flex gap-1 mb-6 bg-card-bg rounded-lg p-1 border border-card-border">
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
            return (
              <div
                key={n.id}
                class="rounded-xl bg-card-bg border border-card-border p-4 flex items-start gap-3 hover:border-gold/20 transition-colors"
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
                      <a
                        href={`/social/profile/${actor.username}`}
                        class="font-medium text-gold hover:text-gold-light transition-colors"
                      >
                        {actor.display_name || actor.username}
                      </a>
                    ) : (
                      <span class="font-medium text-gold">Someone</span>
                    )}{' '}
                    {notifText(n)}
                  </p>
                  <p class="text-xs text-text-dim mt-1">{timeAgo(n.created_at)}</p>
                </div>
                {!n.is_read && <div class="w-2 h-2 rounded-full bg-gold shrink-0 mt-2" />}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
