import { useEffect, useState } from 'preact/hooks';
import { useAuth } from './AuthProvider';
import { getUserBookmarks, type Post } from '../lib/api';

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function BookmarksView() {
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const data = await getUserBookmarks(user.id, 100);
      if (!cancelled) {
        setPosts(data);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div class="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} class="rounded-xl bg-card-bg border border-card-border p-5 animate-pulse">
            <div class="flex gap-3">
              <div class="w-10 h-10 rounded-full bg-navy-mid" />
              <div class="flex-1 space-y-2">
                <div class="h-3 bg-navy-mid rounded w-1/3" />
                <div class="h-3 bg-navy-mid rounded w-full" />
                <div class="h-3 bg-navy-mid rounded w-2/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!user) {
    return (
      <div class="rounded-2xl bg-card-bg border border-card-border p-8 text-center space-y-3">
        <p class="font-heading text-xl text-gold">Sign in to see your bookmarks</p>
        <p class="text-sm text-text-dim max-w-md mx-auto">
          Bookmarks are a private reading list. They live with your account so you can come back to posts worth returning to.
        </p>
        <a
          href="/social/login"
          class="inline-block text-xs px-4 py-2 rounded-full bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20 transition-colors mt-2"
        >
          Sign in →
        </a>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div class="rounded-2xl bg-card-bg border border-card-border p-8 text-center space-y-3">
        <p class="font-heading text-xl text-gold">No bookmarks yet</p>
        <p class="text-sm text-text-dim max-w-md mx-auto">
          Tap the bookmark icon on any post to save it here. Think of this as a private reading list, not a "like."
        </p>
        <a
          href="/social"
          class="inline-block text-xs px-4 py-2 rounded-full bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20 transition-colors mt-2"
        >
          Browse the feed →
        </a>
      </div>
    );
  }

  return (
    <div class="space-y-3">
      {posts.map((post) => {
        const author = (post as any).author;
        const conviction = (post as any).conviction as string | null;
        return (
          <article
            key={post.id}
            class="rounded-xl bg-card-bg border border-card-border hover:border-gold/30 p-4 md:p-5 transition-colors"
          >
            <header class="flex items-center gap-3 mb-3">
              <a
                href={author ? `/social/profile/${author.username}` : '#'}
                class="w-10 h-10 rounded-full bg-navy-mid overflow-hidden border border-card-border flex-shrink-0"
              >
                {author?.avatar_url ? (
                  <img src={author.avatar_url} alt={author.display_name} class="w-full h-full object-cover" />
                ) : (
                  <div class="w-full h-full flex items-center justify-center text-gold font-heading">
                    {(author?.display_name || author?.username || '?')[0]?.toUpperCase()}
                  </div>
                )}
              </a>
              <div class="min-w-0 flex-1">
                <a
                  href={author ? `/social/profile/${author.username}` : '#'}
                  class="font-heading text-text hover:text-gold truncate block"
                >
                  {author?.display_name || author?.username || 'Anonymous'}
                </a>
                <p class="text-xs text-text-dim">@{author?.username} · {timeAgo(post.created_at)}</p>
              </div>
              <div class="flex gap-1.5 flex-shrink-0">
                {conviction === 'bullish' && (
                  <span class="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400">▲ Bullish</span>
                )}
                {conviction === 'bearish' && (
                  <span class="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400">▼ Bearish</span>
                )}
                {conviction === 'neutral' && (
                  <span class="text-[10px] px-2 py-0.5 rounded-full bg-gold/10 border border-gold/30 text-gold">◆ Neutral</span>
                )}
                {post.project_tag && (
                  <span class="text-[10px] px-2 py-0.5 rounded-full bg-navy-mid border border-card-border text-text-dim">
                    ${post.project_tag}
                  </span>
                )}
              </div>
            </header>

            <p class="text-sm text-text-dim leading-relaxed whitespace-pre-wrap">{post.content}</p>

            <footer class="flex gap-5 text-xs text-text-dim mt-3 pt-3 border-t border-card-border">
              <span>♡ {post.likes_count ?? 0}</span>
              <span>💬 {post.comments_count ?? 0}</span>
              <span class="text-gold">⧖ Bookmarked</span>
            </footer>
          </article>
        );
      })}
    </div>
  );
}
