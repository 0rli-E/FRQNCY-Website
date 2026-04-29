import { useState, useEffect, useCallback } from 'preact/hooks';
import PostCard from './PostCard';
import { supabase } from '../lib/supabase';

interface FeedProps {
  /**
   * When provided, filter the feed to only posts by this username.
   * Used on profile pages.
   */
  username?: string;
  /**
   * When provided, filter the feed to only posts tagged with this channel
   * (project_tag). Used on /social/channel/[slug].
   */
  channel?: string;
}

interface PostRow {
  id: string;
  content: string;
  project_tag: string | null;
  link_url: string | null;
  link_preview: any;
  created_at: string;
  likes_count: number;
  comments_count: number;
  bookmarks_count: number;
  signature: string | null;
  signed_payload: string | null;
  profiles: {
    username: string;
    display_name: string;
    avatar_url: string | null;
    signing_public_key: string | null;
  };
}

const PAGE_SIZE = 20;

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

export default function Feed({ username, channel: channelFilter }: FeedProps = {}) {
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [authorId, setAuthorId] = useState<string | null>(null);

  // If a username is provided, first resolve it to an author_id
  useEffect(() => {
    if (!username) {
      setAuthorId(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .maybeSingle();
      if (!cancelled) setAuthorId(data?.id ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [username]);

  // Build a fresh query each call — used for both the initial fetch and
  // subsequent "load more" pages. `from` / `to` mark the inclusive range.
  const buildQuery = useCallback((from: number, to: number) => {
    let q = supabase
      .from('posts')
      .select(
        'id, content, project_tag, link_url, link_preview, created_at, likes_count, comments_count, bookmarks_count, signature, signed_payload, profiles!author_id(username, display_name, avatar_url, signing_public_key)'
      )
      .order('created_at', { ascending: false })
      .range(from, to);
    if (username && authorId) q = q.eq('author_id', authorId);
    if (channelFilter) q = q.eq('project_tag', channelFilter);
    return q;
  }, [username, authorId, channelFilter]);

  const fetchPosts = useCallback(async () => {
    if (username && !authorId) {
      setPosts([]);
      setLoading(false);
      return;
    }
    const { data, error } = await buildQuery(0, PAGE_SIZE - 1);
    if (!error && data) {
      const rows = data as unknown as PostRow[];
      setPosts(rows);
      setHasMore(rows.length === PAGE_SIZE);
    }
    setLoading(false);
  }, [buildQuery, username, authorId]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const offset = posts.length;
    const { data, error } = await buildQuery(offset, offset + PAGE_SIZE - 1);
    if (!error && data) {
      const rows = data as unknown as PostRow[];
      setPosts((prev) => {
        // Dedupe in case a realtime insert sneaked between fetches
        const seen = new Set(prev.map((p) => p.id));
        return [...prev, ...rows.filter((r) => !seen.has(r.id))];
      });
      setHasMore(rows.length === PAGE_SIZE);
    }
    setLoadingMore(false);
  }, [buildQuery, hasMore, loadingMore, posts.length]);

  useEffect(() => {
    // Wait for authorId to resolve before fetching if filtering by user
    if (username && !authorId) return;

    fetchPosts();

    // Subscribe to realtime inserts. Channel name must be unique per mount
    // so a global feed + a profile feed on different tabs don't collide.
    const channelKey = `posts-feed-${username ?? channelFilter ?? 'global'}-${Math.random().toString(36).slice(2, 8)}`;
    const channel = supabase
      .channel(channelKey)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPosts, username, authorId, channelFilter]);

  if (loading) {
    return (
      <div class="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} class="rounded-xl bg-card-bg border border-card-border p-5 animate-pulse">
            <div class="flex gap-3">
              <div class="w-10 h-10 rounded-full bg-navy-mid" />
              <div class="flex-1 space-y-2">
                <div class="h-4 bg-navy-mid rounded w-1/3" />
                <div class="h-3 bg-navy-mid rounded w-full" />
                <div class="h-3 bg-navy-mid rounded w-2/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div class="rounded-xl bg-card-bg border border-card-border p-8 text-center">
        <p class="text-text-dim text-sm">
          {username ? `@${username} hasn't posted yet.` : 'No posts yet. Be the first to share something!'}
        </p>
      </div>
    );
  }

  return (
    <div class="space-y-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          id={post.id}
          author={post.profiles?.display_name || 'Anonymous'}
          username={post.profiles?.username || 'anon'}
          avatar={post.profiles?.avatar_url || undefined}
          content={post.content}
          tags={post.project_tag ? [post.project_tag] : []}
          link_preview={post.link_preview}
          likes={post.likes_count ?? 0}
          comments={post.comments_count ?? 0}
          time={timeAgo(post.created_at)}
          signature={post.signature ?? null}
          signed_payload={post.signed_payload ?? null}
          author_signing_public_key={post.profiles?.signing_public_key ?? null}
        />
      ))}

      {/* Load more — disabled when there's nothing left, animates while fetching */}
      {hasMore ? (
        <div class="text-center py-6">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            class="text-sm text-text-dim hover:text-gold transition-colors border border-card-border rounded-full px-6 py-2 hover:border-gold/30 disabled:opacity-50 disabled:cursor-wait"
          >
            {loadingMore ? 'Loading…' : 'Load more posts'}
          </button>
        </div>
      ) : (
        <div class="text-center py-6 text-xs text-text-dim italic">
          You've reached the end of the thread.
        </div>
      )}
    </div>
  );
}
