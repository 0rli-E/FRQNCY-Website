import { useEffect, useState } from 'preact/hooks';
import { fetchBlueskyThread, type BlueskyReply, blueskyWebUrl } from '../lib/atproto-bridge';

// ─────────────────────────────────────────────────────────────────────────────
// BlueskyReplies — surface the public Bluesky thread for a cross-posted NRG
// post inline on the NRG post detail view.
//
// Per proposals/BLUESKY-TIMELINE-READER.md (v1.1 reply backflow). The NRG row
// stores `bluesky_uri` after cross-post (migration 016). When PostView sees
// that column populated, it renders this component beneath the comments
// thread, giving any visitor (signed in or not) the public conversation
// happening on the bridge.
//
// Read-only by design — replying back routes to bsky.app via the per-reply
// permalink. NRG never publishes replies on the user's behalf into Bluesky's
// thread, so there's no "reply" affordance here.
//
// Voice contract:
//   - "Conversations on Bluesky" — neutral framing, not "engagement".
//   - "Reply on Bluesky ↗" — explicit external destination.
//   - No reply count chest-thumping; we just render what's there.
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  bskyUri: string;
  /** Optional handle hint to build a nicer permalink without an extra fetch. */
  authorHandleHint?: string | null;
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  return `${months}mo`;
}

export default function BlueskyReplies({ bskyUri, authorHandleHint }: Props) {
  const [replies, setReplies] = useState<BlueskyReply[] | null>(null);
  const [threadUrl, setThreadUrl] = useState<string>(() => blueskyWebUrl(bskyUri, authorHandleHint));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchBlueskyThread(bskyUri)
      .then((res) => {
        if (cancelled) return;
        if (res.ok) {
          setReplies(res.replies);
          setThreadUrl(res.thread_url);
        } else {
          setError(res.reason);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message || 'Could not load Bluesky thread.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [bskyUri]);

  return (
    <div id="bluesky" class="rounded-xl bg-card-bg border border-card-border p-5 space-y-4 scroll-mt-20">
      <div class="flex items-baseline justify-between gap-3">
        <h2 class="font-heading text-base text-text">
          Conversations on Bluesky
        </h2>
        <a
          href={threadUrl}
          target="_blank"
          rel="noopener noreferrer"
          class="text-xs text-text-dim hover:text-gold transition-colors whitespace-nowrap"
        >
          Reply on Bluesky ↗
        </a>
      </div>

      {loading && (
        <div class="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} class="flex gap-3 animate-pulse">
              <div class="w-8 h-8 rounded-full bg-navy-mid shrink-0" />
              <div class="flex-1 space-y-2">
                <div class="h-3 bg-navy-mid rounded w-1/3" />
                <div class="h-3 bg-navy-mid rounded w-full" />
                <div class="h-3 bg-navy-mid rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <p class="text-xs text-text-dim">
          Could not load Bluesky replies. <a href={threadUrl} target="_blank" rel="noopener noreferrer" class="text-gold hover:text-gold-light">View on Bluesky ↗</a>
        </p>
      )}

      {!loading && !error && replies && replies.length === 0 && (
        <p class="text-xs text-text-dim">
          No replies on Bluesky yet. <a href={threadUrl} target="_blank" rel="noopener noreferrer" class="text-gold hover:text-gold-light">Be the first ↗</a>
        </p>
      )}

      {!loading && !error && replies && replies.length > 0 && (
        <ul class="space-y-4">
          {replies.map((r) => (
            <li key={r.uri} class="flex gap-3">
              {r.author.avatar ? (
                <img
                  src={r.author.avatar}
                  alt={r.author.displayName || r.author.handle}
                  class="w-8 h-8 rounded-full shrink-0 object-cover"
                  loading="lazy"
                />
              ) : (
                <div class="w-8 h-8 rounded-full bg-navy-mid shrink-0" />
              )}
              <div class="flex-1 min-w-0">
                <div class="flex items-baseline gap-2 text-xs">
                  <a
                    href={`https://bsky.app/profile/${r.author.handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="font-medium text-text hover:text-gold transition-colors truncate"
                  >
                    {r.author.displayName || r.author.handle}
                  </a>
                  <span class="text-text-dim truncate">@{r.author.handle}</span>
                  <span class="text-text-dim">·</span>
                  <a
                    href={r.webUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-text-dim hover:text-gold transition-colors"
                  >
                    {timeAgo(r.createdAt)}
                  </a>
                </div>
                <p class="text-sm text-text mt-1 whitespace-pre-wrap break-words">
                  {r.text}
                </p>
                {(r.likeCount > 0 || r.repostCount > 0) && (
                  <div class="text-xs text-text-dim mt-1.5 flex gap-3">
                    {r.likeCount > 0 && <span>♡ {r.likeCount}</span>}
                    {r.repostCount > 0 && <span>↻ {r.repostCount}</span>}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <p class="text-[10px] text-text-dim opacity-70 pt-1 border-t border-card-border">
        Public replies fetched live from bsky.social. NRG never holds these — interactions stay on Bluesky.
      </p>
    </div>
  );
}
