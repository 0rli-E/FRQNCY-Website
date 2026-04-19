import { useState, useEffect, useCallback } from 'preact/hooks';
import PostCard from './PostCard';
import { supabase } from '../lib/supabase';

interface FeedProps {
  /**
   * When provided, filter the feed to only posts by this username.
   * Used on profile pages.
   */
  username?: string;
}

interface PostRow {
  id: string;
  content: string;
  project_tag: string | null;
  created_at: string;
  profiles: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  likes: { count: number }[];
  comments: { count: number }[];
}

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

export default function Feed({ username }: FeedProps = {}) {
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);
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

  const fetchPosts = useCallback(async () => {
    let query = supabase
      .from('posts')
      .select('*, profiles!author_id(username, display_name, avatar_url), likes(count), comments(count)')
      .order('created_at', { ascending: false })
      .limit(20);

    if (username) {
      // If filtering by user, require the authorId to be resolved first
      if (!authorId) {
        setPosts([]);
        setLoading(false);
        return;
      }
      query = query.eq('author_id', authorId);
    }

    const { data, error } = await query;

    if (!error && data) {
      setPosts(data as unknown as PostRow[]);
    }
    setLoading(false);
  }, [username, authorId]);

  useEffect(() => {
    // Wait for authorId to resolve before fetching if filtering by user
    if (username && !authorId) return;

    fetchPosts();

    // Subscribe to realtime inserts. Channel name must be unique per mount
    // so a global feed + a profile feed on different tabs don't collide.
    const channelKey = `posts-feed-${username ?? 'global'}-${Math.random().toString(36).slice(2, 8)}`;
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
  }, [fetchPosts, username, authorId]);

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
          likes={post.likes?.[0]?.count || 0}
          comments={post.comments?.[0]?.count || 0}
          time={timeAgo(post.created_at)}
        />
      ))}

      {/* Load more */}
      <div class="text-center py-6">
        <button class="text-sm text-text-dim hover:text-gold transition-colors border border-card-border rounded-full px-6 py-2 hover:border-gold/30">
          Load more posts
        </button>
      </div>
    </div>
  );
}
