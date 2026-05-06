// Read-only Bluesky timeline reader, rendered in NRG's visual language.
//
// Per proposals/BLUESKY-TIMELINE-READER.md:
//   - Read-only: no like / repost / comment buttons. Interactions happen on
//     bsky.app via the post permalink. NRG hosts NRG; Bluesky hosts Bluesky.
//     The bridge is a reader, not a controller.
//   - Same gold-on-navy palette + Cormorant + Jost typography as the rest of
//     NRG. The provenance footer ("via @bsky.social ↗") is the only visual
//     differentiator from a native PostCard.
//   - When not connected, surfaces a small connect card pointing at
//     /social/profile/connections/.
//
// Used standalone on a "Federated" tab AND as a row component when Feed.tsx
// interleaves NRG + Bluesky chronologically.

import { useEffect, useState } from 'preact/hooks';
import { fetchBlueskyTimeline, isBlueskyConnected, type BlueskyPost } from '../lib/atproto-bridge';

interface FederatedFeedProps {
  /** Posts pulled per page. Defaults to 30 (the AppView default). */
  limit?: number;
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

export default function FederatedFeed({ limit = 30 }: FederatedFeedProps = {}) {
  const [posts, setPosts] = useState<BlueskyPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    setConnected(isBlueskyConnected());
    (async () => {
      const res = await fetchBlueskyTimeline({ limit });
      if (cancelled) return;
      if (!res.ok) {
        setError(res.reason);
        setPosts([]);
      } else {
        setError(null);
        setPosts(res.posts);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [limit]);

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

  if (!connected || error === 'not-connected') {
    return (
      <div class="rounded-xl bg-card-bg border border-card-border p-6">
        <h3 class="font-heading text-lg text-gold mb-1">Connect Bluesky to read your home timeline here</h3>
        <p class="text-sm text-text-dim mb-3">
          NRG can read your Bluesky home feed alongside NRG posts. Connect once with an app password — credentials live in this browser only.
        </p>
        <a
          href="/social/profile/connections/"
          class="inline-block text-sm text-gold border border-gold/30 rounded-full px-4 py-1.5 hover:bg-gold/10 transition-colors"
        >
          Connect Bluesky →
        </a>
      </div>
    );
  }

  if (error) {
    return (
      <div class="rounded-xl bg-card-bg border border-card-border p-6">
        <p class="text-sm text-text-dim">
          Couldn't load Bluesky timeline: <span class="text-text">{error}</span>
        </p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div class="rounded-xl bg-card-bg border border-card-border p-8 text-center">
        <p class="text-text-dim text-sm">
          Your Bluesky home timeline is empty right now.
        </p>
      </div>
    );
  }

  return (
    <div class="space-y-4">
      {posts.map((p) => (
        <BlueskyPostCard key={p.uri} post={p} />
      ))}
    </div>
  );
}

// ─── Single-row card ────────────────────────────────────────────────────────
//
// Exported so Feed.tsx can render Bluesky rows inline in the merged stream
// without duplicating layout. Read-only by design — see
// proposals/BLUESKY-TIMELINE-READER.md for the rationale.

interface BlueskyPostCardProps {
  post: BlueskyPost;
}

export function BlueskyPostCard({ post }: BlueskyPostCardProps) {
  const author = post.author;
  const display = author.displayName || author.handle || 'Bluesky user';
  const initials = display
    .split(/[\s-]+/)
    .map((n) => n[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <article class="rounded-xl bg-card-bg border border-card-border p-5 hover:border-gold/10 transition-colors">
      {/* Header */}
      <div class="flex items-start gap-3">
        <a
          href={`https://bsky.app/profile/${author.handle}`}
          target="_blank"
          rel="noopener noreferrer"
          class="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm font-semibold shrink-0 hover:ring-2 hover:ring-gold/30 transition-all overflow-hidden"
          title={`Open @${author.handle} on bsky.app`}
        >
          {author.avatar ? (
            <img src={author.avatar} alt={display} class="w-full h-full object-cover" />
          ) : (
            initials || 'B'
          )}
        </a>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <a
              href={`https://bsky.app/profile/${author.handle}`}
              target="_blank"
              rel="noopener noreferrer"
              class="text-sm font-medium text-text hover:text-gold transition-colors"
            >
              {display}
            </a>
            <span class="text-xs text-text-dim">@{author.handle}</span>
            <span class="text-xs text-text-dim opacity-50">·</span>
            <span class="text-xs text-text-dim">{timeAgo(post.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div class="mt-3 ml-13">
        <p class="text-sm text-text leading-relaxed whitespace-pre-wrap">
          {post.text}
        </p>

        {post.externalUrl && (
          <a
            href={post.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            class="mt-3 inline-flex items-center gap-1 text-xs text-text-dim hover:text-gold transition-colors break-all"
          >
            ↗ {post.externalUrl}
          </a>
        )}
      </div>

      {/* Footer — read-only; like / comment / repost go to bsky.app */}
      <div class="flex items-center justify-between gap-4 mt-4 ml-13">
        <div class="flex items-center gap-4 text-xs text-text-dim">
          {post.likeCount > 0 && <span>♥ {post.likeCount}</span>}
          {post.replyCount > 0 && <span>↩ {post.replyCount}</span>}
          {post.repostCount > 0 && <span>↻ {post.repostCount}</span>}
        </div>
        <a
          href={post.webUrl}
          target="_blank"
          rel="noopener noreferrer"
          class="text-[11px] text-text-dim hover:text-gold transition-colors"
          title="Open on bsky.app to like, reply, or repost"
        >
          via @bsky.social ↗
        </a>
      </div>
    </article>
  );
}
