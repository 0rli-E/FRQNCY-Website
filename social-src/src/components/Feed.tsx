import { useState, useEffect, useCallback } from 'preact/hooks';
import PostCard from './PostCard';
import { BlueskyPostCard } from './FederatedFeed';
import { supabase } from '../lib/supabase';
import {
  fetchBlueskyTimeline,
  isBlueskyConnected,
  type BlueskyPost,
} from '../lib/atproto-bridge';

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
  /** Set when this post was cross-posted to Bluesky. Drives the
      "↗ on Bluesky" hint pill on the PostCard actions row. NULL when not
      cross-posted, or when migration 016 hasn't been applied (the select
      falls back to the legacy column set). */
  bluesky_uri: string | null;
  /** Persisted public Bluesky reply count, refreshed nightly by the
      auto-grow script (migration 017). When > 0 the hint becomes
      "↗ N on Bluesky". NULL when never synced or migration 017 isn't
      applied — the pill renders without a count, click-through still
      works. */
  bluesky_reply_count: number | null;
  profiles: {
    username: string;
    display_name: string;
    avatar_url: string | null;
    signing_public_key: string | null;
  };
}

const PAGE_SIZE = 20;
const FEED_TAB_KEY = 'frqncy.nrg.feed_tab';
type FeedTab = 'network' | 'federated';

/**
 * Merged-stream row — discriminated union so the tab renderer can dispatch
 * to PostCard for NRG rows or BlueskyPostCard for Bluesky rows in a single
 * map() over the chronological order.
 */
type MergedRow =
  | { kind: 'nrg'; key: string; created_at: string; post: PostRow }
  | { kind: 'bsky'; key: string; created_at: string; post: BlueskyPost };

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

  // ── Federated tab state ────────────────────────────────────────────────
  // The Federated tab is hidden when not on the global feed (profile / channel
  // feeds keep their existing single-source behaviour) AND when the user
  // hasn't connected Bluesky. We compute `bskyConnected` once at mount —
  // localStorage doesn't change underfoot during a feed render.
  const [bskyConnected, setBskyConnected] = useState(false);
  const [tab, setTab] = useState<FeedTab>('network');
  const [bskyPosts, setBskyPosts] = useState<BlueskyPost[]>([]);
  const [bskyLoading, setBskyLoading] = useState(false);
  const [bskyError, setBskyError] = useState<string | null>(null);

  const isGlobalFeed = !username && !channelFilter;
  const showTabs = isGlobalFeed && bskyConnected;

  useEffect(() => {
    setBskyConnected(isBlueskyConnected());
    if (typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem(FEED_TAB_KEY);
      if (stored === 'federated' || stored === 'network') {
        setTab(stored);
      }
    } catch {
      // localStorage read can fail in private mode — non-fatal.
    }
  }, []);

  const persistTab = (next: FeedTab) => {
    setTab(next);
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(FEED_TAB_KEY, next);
    } catch {
      // non-fatal
    }
  };

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

  // Track whether bluesky_uri is queryable. We try with it first; if the
  // column doesn't exist yet (migration 016 not applied) we degrade to the
  // legacy select for the rest of the session and the "↗ on Bluesky" hint
  // simply never renders. No retries — the flag is flipped on first failure.
  const [bskyColumnAvailable, setBskyColumnAvailable] = useState(true);

  // Build a fresh query each call — used for both the initial fetch and
  // subsequent "load more" pages. `from` / `to` mark the inclusive range.
  const buildQuery = useCallback((from: number, to: number, includeBskyCol: boolean) => {
    // bluesky_uri (migration 016) and bluesky_reply_count (migration 017)
    // are pulled together — they're a pair. If either column is missing
    // we fall back to the legacy set; the pill simply degrades to either
    // "↗ on Bluesky" (016 only) or hides entirely (no 016).
    const cols = includeBskyCol
      ? 'id, content, project_tag, link_url, link_preview, created_at, likes_count, comments_count, bookmarks_count, signature, signed_payload, bluesky_uri, bluesky_reply_count, profiles!author_id(username, display_name, avatar_url, signing_public_key)'
      : 'id, content, project_tag, link_url, link_preview, created_at, likes_count, comments_count, bookmarks_count, signature, signed_payload, profiles!author_id(username, display_name, avatar_url, signing_public_key)';
    let q = supabase
      .from('posts')
      .select(cols)
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
    let { data, error } = await buildQuery(0, PAGE_SIZE - 1, bskyColumnAvailable);
    if (error && bskyColumnAvailable && /bluesky_uri|bluesky_reply_count/.test(error.message || '')) {
      // Migration 016 or 017 not applied — drop the columns for the rest
      // of the session. The pill simply doesn't render when bluesky_uri is
      // absent; it renders without a count when 016 is present but 017 isn't.
      setBskyColumnAvailable(false);
      const fb = await buildQuery(0, PAGE_SIZE - 1, false);
      data = fb.data;
      error = fb.error;
    }
    if (!error && data) {
      const rows = data as unknown as PostRow[];
      setPosts(rows);
      setHasMore(rows.length === PAGE_SIZE);
    }
    setLoading(false);
  }, [buildQuery, username, authorId, bskyColumnAvailable]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const offset = posts.length;
    let { data, error } = await buildQuery(offset, offset + PAGE_SIZE - 1, bskyColumnAvailable);
    if (error && bskyColumnAvailable && /bluesky_uri|bluesky_reply_count/.test(error.message || '')) {
      setBskyColumnAvailable(false);
      const fb = await buildQuery(offset, offset + PAGE_SIZE - 1, false);
      data = fb.data;
      error = fb.error;
    }
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
  }, [buildQuery, hasMore, loadingMore, posts.length, bskyColumnAvailable]);

  // Fetch the Bluesky timeline once when the Federated tab activates. We
  // refetch whenever the tab toggles back on so a returning user gets fresh
  // posts, but otherwise the result sticks for the session — same model as
  // FederatedFeed standalone.
  useEffect(() => {
    if (!showTabs || tab !== 'federated') return;
    let cancelled = false;
    setBskyLoading(true);
    (async () => {
      const res = await fetchBlueskyTimeline({ limit: 30 });
      if (cancelled) return;
      if (!res.ok) {
        setBskyError(res.reason);
        setBskyPosts([]);
      } else {
        setBskyError(null);
        setBskyPosts(res.posts);
      }
      setBskyLoading(false);
    })();
    return () => { cancelled = true; };
  }, [showTabs, tab]);

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

  // Render a single NRG post via the existing PostCard (preserves like /
  // comment / quote / share / bookmark / signature-verify behaviour).
  const renderNrgPost = (post: PostRow) => (
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
      bluesky_uri={post.bluesky_uri ?? null}
      bluesky_reply_count={post.bluesky_reply_count ?? null}
    />
  );

  // Merge NRG + Bluesky rows by created_at desc. Each row carries its own
  // discriminant so the renderer dispatches without re-checking shape.
  const mergedRows: MergedRow[] = [
    ...posts.map<MergedRow>((p) => ({ kind: 'nrg', key: `nrg-${p.id}`, created_at: p.created_at, post: p })),
    ...bskyPosts.map<MergedRow>((p) => ({ kind: 'bsky', key: `bsky-${p.uri}`, created_at: p.createdAt, post: p })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // ── Tab strip ──────────────────────────────────────────────────────────
  // Only rendered on the global feed when the user has connected Bluesky.
  // Voice: the label is "Federated" (not "Bluesky" / "External") to frame
  // NRG as a federated client rather than a publisher with a side-bridge.
  const tabStrip = showTabs ? (
    <div class="flex items-center gap-1 mb-4 border-b border-card-border">
      <button
        type="button"
        onClick={() => persistTab('network')}
        class={`px-4 py-2 text-sm transition-colors border-b-2 -mb-px ${
          tab === 'network'
            ? 'text-gold border-gold'
            : 'text-text-dim border-transparent hover:text-text'
        }`}
      >
        Network
      </button>
      <button
        type="button"
        onClick={() => persistTab('federated')}
        class={`px-4 py-2 text-sm transition-colors border-b-2 -mb-px ${
          tab === 'federated'
            ? 'text-gold border-gold'
            : 'text-text-dim border-transparent hover:text-text'
        }`}
        title="Interleave NRG and Bluesky in one chronological stream"
      >
        Federated
      </button>
    </div>
  ) : null;

  // ── Federated tab body ─────────────────────────────────────────────────
  if (showTabs && tab === 'federated') {
    const stillLoading = loading || bskyLoading;
    return (
      <div class="space-y-4">
        {tabStrip}

        {stillLoading ? (
          <>
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
          </>
        ) : mergedRows.length === 0 ? (
          <div class="rounded-xl bg-card-bg border border-card-border p-8 text-center">
            <p class="text-text-dim text-sm">
              No posts in the federated stream yet.
            </p>
          </div>
        ) : (
          <>
            {bskyError && bskyError !== 'not-connected' && (
              <div class="rounded-xl bg-card-bg border border-amber-500/20 px-4 py-2 text-xs text-text-dim">
                Bluesky timeline error: <span class="text-text">{bskyError}</span>. Showing NRG only.
              </div>
            )}
            {mergedRows.map((row) =>
              row.kind === 'nrg' ? renderNrgPost(row.post) : (
                <BlueskyPostCard key={row.key} post={row.post} />
              ),
            )}
            {/* "Load more" in federated view loads more NRG only — Bluesky
                pagination via cursor lands in v1.1. */}
            {hasMore ? (
              <div class="text-center py-6">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  class="text-sm text-text-dim hover:text-gold transition-colors border border-card-border rounded-full px-6 py-2 hover:border-gold/30 disabled:opacity-50 disabled:cursor-wait"
                >
                  {loadingMore ? 'Loading…' : 'Load more NRG posts'}
                </button>
              </div>
            ) : (
              <div class="text-center py-6 text-xs text-text-dim italic">
                End of the federated thread.
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // ── Network tab body (default) ─────────────────────────────────────────

  if (loading) {
    return (
      <div class="space-y-4">
        {tabStrip}
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
      <div class="space-y-4">
        {tabStrip}
        <div class="rounded-xl bg-card-bg border border-card-border p-8 text-center">
          <p class="text-text-dim text-sm">
            {username ? `@${username} hasn't posted yet.` : 'No posts yet. Be the first to share something!'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div class="space-y-4">
      {tabStrip}
      {posts.map((post) => renderNrgPost(post))}

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
