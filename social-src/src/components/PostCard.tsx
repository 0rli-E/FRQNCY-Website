import { useState, useEffect } from 'preact/hooks';
import { useAuth } from './AuthProvider';
import { supabase } from '../lib/supabase';
import { parseQuote, buildQuoteBody } from '../lib/render-content';
import { verifySignature } from '../lib/crypto';
import QuotedPost from './QuotedPost';
import LinkPreviewCard, { type LinkPreview } from './LinkPreview';
import RichContent from './RichContent';

import ProjectBadge from './ProjectBadge';
import CommentsThread from './CommentsThread';
import CommentForm from './CommentForm';
import ReportDialog from './ReportDialog';
import { blockUser, moderationAvailable } from '../lib/moderation';

// ─────────────────────────────────────────────────────────────────────────────
// Signature-verification cache.
//
// We hold the result of verifySignature() in a module-level Map keyed by
// post.id so a feed scroll doesn't re-verify the same post every time it
// re-renders. Posts with null signature stay out of the map — the absence
// of the badge is the signal for unsigned content.
// ─────────────────────────────────────────────────────────────────────────────
type VerifyState = 'verified' | 'mismatch';
const verifyCache: Map<string, VerifyState> = new Map();

interface PostCardProps {
  id?: string;
  /** Author's profile id. Required for the block/report menu — without it the
      overflow menu falls back to share-only, since there's no one to act on. */
  author_id?: string | null;
  author?: string;
  username?: string;
  avatar?: string;
  content?: string;
  tags?: string[];
  project_tag?: string | null;
  project_tier?: string | null;
  /** Persisted Open Graph preview from the link-preview function. */
  link_preview?: LinkPreview | null;
  likes?: number;
  comments?: number;
  time?: string;
  /** Open the comment thread on first render. Used by the single-post page. */
  defaultShowComments?: boolean;
  /** Detached Ed25519 signature (base64) over `signed_payload`. */
  signature?: string | null;
  /** The exact canonical JSON bytes the signature was computed over. */
  signed_payload?: string | null;
  /** Author's libsodium signing public key (base64). Required to verify. */
  author_signing_public_key?: string | null;
  /** When set, this post has a Bluesky mirror — surfaces a small "↗ on
      Bluesky" hint in the actions row that links to the post detail view
      where BlueskyReplies will load the federated thread inline. NULL when
      the post wasn't cross-posted (or when migration 016 isn't applied).
      Per proposals/BLUESKY-TIMELINE-READER.md (v1.1). */
  bluesky_uri?: string | null;
  /** Persisted public Bluesky reply count (refreshed nightly by
      scripts/auto-grow/bluesky-counts-refresh.mjs, migration 017). When
      present and > 0 the hint pill shows "↗ N on Bluesky". When 0/null
      the pill stays as "↗ on Bluesky". Per BLUESKY-TIMELINE-READER.md v1.2. */
  bluesky_reply_count?: number | null;
}

export default function PostCard({
  id,
  author_id = null,
  author = 'Anonymous',
  username = 'anon',
  avatar,
  content = '',
  tags = [],
  project_tag = null,
  project_tier = null,
  link_preview = null,
  likes = 0,
  comments = 0,
  time = 'just now',
  defaultShowComments = false,
  signature = null,
  signed_payload = null,
  author_signing_public_key = null,
  bluesky_uri = null,
  bluesky_reply_count = null,
}: PostCardProps) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  const [bookmarked, setBookmarked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [showComments, setShowComments] = useState(defaultShowComments);
  const [commentCount, setCommentCount] = useState(comments);
  // Signature-verification state. Starts at the cached result if we've seen
  // this post before; otherwise null until the lazy useEffect resolves.
  const [verifyState, setVerifyState] = useState<VerifyState | null>(
    id && verifyCache.has(id) ? verifyCache.get(id)! : null,
  );

  // Lazily verify the signature once on mount. Skipped entirely for unsigned
  // posts (no badge rendered for those) and for posts whose author hasn't
  // published a signing public key yet (we can't verify without it). The
  // result is cached in the module-level Map so feed scrolls don't reverify.
  useEffect(() => {
    if (!id || !signature || !signed_payload || !author_signing_public_key) return;
    if (verifyCache.has(id)) {
      setVerifyState(verifyCache.get(id)!);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const ok = await verifySignature(signed_payload, signature, author_signing_public_key);
        const next: VerifyState = ok ? 'verified' : 'mismatch';
        verifyCache.set(id, next);
        if (!cancelled) setVerifyState(next);
      } catch (_) {
        // Treat verifier errors as mismatch — caller asked us to surface
        // anything anomalous.
        verifyCache.set(id, 'mismatch');
        if (!cancelled) setVerifyState('mismatch');
      }
    })();
    return () => { cancelled = true; };
  }, [id, signature, signed_payload, author_signing_public_key]);

  // Check if current user has liked/bookmarked this post
  useEffect(() => {
    if (!user || !id) return;

    const checkStatus = async () => {
      const [likeResult, bookmarkResult] = await Promise.all([
        supabase
          .from('likes')
          .select('user_id')
          .eq('user_id', user.id)
          .eq('post_id', id)
          .maybeSingle(),
        supabase
          .from('bookmarks')
          .select('user_id')
          .eq('user_id', user.id)
          .eq('post_id', id)
          .maybeSingle(),
      ]);

      if (likeResult.data) setLiked(true);
      if (bookmarkResult.data) setBookmarked(true);
    };

    checkStatus();
  }, [user, id]);

  // Keep comment count in sync with parent's prop
  useEffect(() => {
    setCommentCount(comments);
  }, [comments]);

  const toggleLike = async () => {
    if (!user || !id || likeLoading) return;
    setLikeLoading(true);

    try {
      if (liked) {
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', id);
        setLiked(false);
        setLikeCount(likeCount - 1);
      } else {
        await supabase
          .from('likes')
          .insert({ user_id: user.id, post_id: id });
        setLiked(true);
        setLikeCount(likeCount + 1);
      }
    } catch (err) {
      console.error('Like toggle failed:', err);
    } finally {
      setLikeLoading(false);
    }
  };

  const toggleBookmark = async () => {
    if (!user || !id || bookmarkLoading) return;
    setBookmarkLoading(true);

    try {
      if (bookmarked) {
        await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', id);
        setBookmarked(false);
      } else {
        await supabase
          .from('bookmarks')
          .insert({ user_id: user.id, post_id: id });
        setBookmarked(true);
      }
    } catch (err) {
      console.error('Bookmark toggle failed:', err);
    } finally {
      setBookmarkLoading(false);
    }
  };

  // ── Moderation (blocks + reports, migration 025) ──────────────────────────
  const [menuOpen, setMenuOpen] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reported, setReported] = useState(false);
  const [blocking, setBlocking] = useState(false);
  // Set after a successful block so the card disappears immediately. The RLS
  // policy already hides it — but only on the next fetch, and waiting for that
  // would leave the post you just blocked sitting on screen.
  const [selfHidden, setSelfHidden] = useState(false);

  // Nothing to report or block on your own post, and anon users can do neither.
  // Also gated on the moderation tables actually existing — offering a Block
  // button that errors is worse than not offering one.
  const [modReady, setModReady] = useState(false);
  useEffect(() => {
    if (user) moderationAvailable().then(setModReady);
  }, [user]);

  const canModerate = Boolean(user && author_id && author_id !== user.id && modReady);

  const handleBlock = async () => {
    if (!author_id || blocking) return;
    setBlocking(true);
    const res = await blockUser(author_id);
    setBlocking(false);
    setMenuOpen(false);
    if (res.ok) setSelfHidden(true);
    else console.error('block failed:', res.error);
  };

  const [shareCopied, setShareCopied] = useState(false);
  const [showQuote, setShowQuote] = useState(false);
  const [quoteText, setQuoteText] = useState('');
  const [quoteSubmitting, setQuoteSubmitting] = useState(false);

  const submitQuote = async () => {
    if (!user || !id || quoteSubmitting) return;
    setQuoteSubmitting(true);
    try {
      const body = buildQuoteBody(id, quoteText.trim());
      const { error } = await supabase.from('posts').insert({
        author_id: user.id,
        content: body,
        media_urls: [],
        link_url: null,
        link_preview: null,
        project_tag: null,
        project_tier: null,
      });
      if (error) {
        console.error('quote-post failed:', error.message);
      } else {
        setQuoteText('');
        setShowQuote(false);
      }
    } finally {
      setQuoteSubmitting(false);
    }
  };

  const initials = author
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const sharePost = async () => {
    if (!id) return;
    const url = `${location.origin}/social/post/${id}`;
    // Prefer the native share sheet on mobile, fall back to clipboard on desktop.
    if (navigator.share) {
      try { await navigator.share({ title: `${author} on FRQNCY`, text: content.slice(0, 140), url }); return; } catch (_) {}
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 1800);
    } catch (_) {
      // Last-ditch fallback for old browsers / insecure contexts
      const ta = document.createElement('textarea');
      ta.value = url; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); setShareCopied(true); setTimeout(() => setShareCopied(false), 1800); } catch (_) {}
      document.body.removeChild(ta);
    }
  };

  // Blocked from this card — collapse it in place rather than vanishing the
  // row, so the feed doesn't jump under the reader's finger.
  if (selfHidden) {
    return (
      <article class="rounded-xl bg-card-bg border border-card-border px-5 py-4 text-xs text-text-dim">
        You blocked @{username}. Their posts are hidden from you now.{' '}
        <a href="/social/profile/blocked" class="text-gold-light hover:underline">
          Manage blocked accounts
        </a>
      </article>
    );
  }

  return (
    <article class="rounded-xl bg-card-bg border border-card-border p-5 hover:border-gold/10 transition-colors">
      {showReport && id && (
        <ReportDialog
          targetType="post"
          targetId={id}
          targetLabel={`@${username}: ${content.slice(0, 60)}${content.length > 60 ? '…' : ''}`}
          onClose={() => setShowReport(false)}
          onReported={() => setReported(true)}
        />
      )}
      {/* Header */}
      <div class="flex items-start gap-3">
        <a
          href={`/social/profile/${username}`}
          class="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm font-semibold shrink-0 hover:ring-2 hover:ring-gold/30 transition-all overflow-hidden"
        >
          {avatar ? (
            <img src={avatar} alt={author} class="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </a>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <a href={`/social/profile/${username}`} class="text-sm font-medium text-text hover:text-gold transition-colors">
              {author}
            </a>
            <span class="text-xs text-text-dim">@{username}</span>
            <span class="text-xs text-text-dim opacity-50">·</span>
            <span class="text-xs text-text-dim">{time}</span>
            {verifyState === 'verified' && (
              <span
                class="text-[10px] text-gold/70 ml-1 flex items-center gap-0.5"
                title="Signature verified against author's signing public key"
              >
                <span aria-hidden="true">◊</span>
                <span>verified</span>
              </span>
            )}
            {verifyState === 'mismatch' && (
              <span
                class="text-[10px] text-amber-300 ml-1 flex items-center gap-0.5"
                title="Signature does not match the author's signing public key"
              >
                <span aria-hidden="true">✗</span>
                <span>signature mismatch</span>
              </span>
            )}
          </div>
        </div>
        {/* Overflow menu — report / block. Was a dead button until moderation
            v1; it renders for signed-in users looking at someone else's post,
            since there is nothing here to do to your own. */}
        <div class="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Post options"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            class="text-text-dim hover:text-text transition-colors p-1"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01" />
            </svg>
          </button>

          {menuOpen && (
            <>
              {/* Click-catcher so the menu closes on any outside tap. */}
              <div class="fixed inset-0 z-[90]" onClick={() => setMenuOpen(false)} />
              <div
                role="menu"
                class="absolute right-0 top-8 z-[100] w-48 rounded-lg bg-navy-mid border border-card-border py-1 shadow-xl"
              >
                {canModerate ? (
                  <>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => { setMenuOpen(false); setShowReport(true); }}
                      class="w-full text-left px-3 py-2 text-xs text-text hover:bg-gold/10 transition-colors"
                    >
                      {reported ? 'Reported ✓' : 'Report post'}
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleBlock}
                      disabled={blocking}
                      class="w-full text-left px-3 py-2 text-xs text-text hover:bg-gold/10 transition-colors disabled:opacity-40"
                    >
                      {blocking ? 'Blocking…' : `Block @${username}`}
                    </button>
                    <p class="px-3 pt-1.5 pb-1 text-[10px] leading-snug text-text-dim border-t border-card-border mt-1">
                      Blocking hides you from each other. They aren't told.
                    </p>
                  </>
                ) : (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => { setMenuOpen(false); sharePost(); }}
                    class="w-full text-left px-3 py-2 text-xs text-text hover:bg-gold/10 transition-colors"
                  >
                    Copy link to post
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content — quote posts get an embedded card; everything else goes
          through the safe tokeniser that linkifies @mentions and URLs. */}
      <div class="mt-3 ml-13">
        {(() => {
          const quote = parseQuote(content);
          if (quote) {
            return (
              <div class="space-y-3">
                {quote.comment.trim() && (
                  <p class="text-sm text-text leading-relaxed whitespace-pre-wrap">
                    <RichContent text={quote.comment} />
                  </p>
                )}
                <QuotedPost postId={quote.postId} />
              </div>
            );
          }
          return (
            <p class="text-sm text-text leading-relaxed whitespace-pre-wrap">
              <RichContent text={content} />
            </p>
          );
        })()}

        {/* Link preview (when persisted with the post) */}
        {link_preview && link_preview.url && (
          <div class="mt-3">
            <LinkPreviewCard preview={link_preview} compact />
          </div>
        )}

        {/* Project tag badge */}
        {project_tag && (
          <div class="mt-2.5">
            <ProjectBadge name={project_tag} tier={project_tier || 'D'} />
          </div>
        )}

        {/* Tags — link to the channel page so the network has navigable threads */}
        {tags.length > 0 && (
          <div class="flex flex-wrap gap-1.5 mt-3">
            {tags.map((tag) => (
              <a
                key={tag}
                href={`/social/channel/${encodeURIComponent(tag)}`}
                class="text-xs px-2.5 py-0.5 rounded-full bg-gold/5 border border-gold/15 text-gold hover:bg-gold/10 transition-colors"
              >
                #{tag}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div class="flex items-center gap-6 mt-4 ml-13">
        <button
          onClick={toggleLike}
          disabled={likeLoading}
          class={`flex items-center gap-1.5 text-xs transition-colors ${
            liked ? 'text-gold' : 'text-text-dim hover:text-gold'
          }`}
        >
          <svg class="w-4 h-4" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          {likeCount > 0 && <span>{likeCount}</span>}
        </button>

        <button
          onClick={() => id && setShowComments((v) => !v)}
          disabled={!id}
          aria-expanded={showComments}
          class={`flex items-center gap-1.5 text-xs transition-colors ${
            showComments ? 'text-accent' : 'text-text-dim hover:text-accent'
          }`}
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          {commentCount > 0 && <span>{commentCount}</span>}
        </button>

        {/* Quote-repost — opens an inline mini composer */}
        {user && id && (
          <button
            onClick={() => setShowQuote((v) => !v)}
            aria-expanded={showQuote}
            aria-label="Quote this post"
            title="Quote this post"
            class={`flex items-center gap-1.5 text-xs transition-colors ${showQuote ? 'text-gold-light' : 'text-text-dim hover:text-gold-light'}`}
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 7v6a4 4 0 004 4h0M4 7h6m-6 0V5a2 2 0 012-2h2m10 14v-6a4 4 0 00-4-4h0m4 10h-6m6 0v2a2 2 0 01-2 2h-2" />
            </svg>
          </button>
        )}

        <button
          onClick={sharePost}
          aria-label={shareCopied ? 'Link copied' : 'Copy or share post link'}
          title={shareCopied ? 'Link copied' : 'Share this post'}
          class={`flex items-center gap-1.5 text-xs transition-colors ${shareCopied ? 'text-gold-light' : 'text-text-dim hover:text-gold-light'}`}
        >
          {shareCopied ? (
            <>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 13l4 4L19 7" />
              </svg>
              <span>Copied</span>
            </>
          ) : (
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          )}
        </button>

        {/* Bluesky bridge hint — visible only on the Feed (not on the post
            detail view where BlueskyReplies already renders the thread inline).
            Click routes to the post detail where the replies will load. The
            count comes from posts.bluesky_reply_count, refreshed nightly by
            the auto-grow workflow (migration 017). When the count is 0/null
            the pill is still useful as a click-through.
            Per proposals/BLUESKY-TIMELINE-READER.md (v1.1 + v1.2). */}
        {bluesky_uri && id && !defaultShowComments && (
          <a
            href={`/social/post/${id}#bluesky`}
            class="ml-auto text-[10px] text-text-dim hover:text-gold-light transition-colors flex items-center gap-1 px-2 py-0.5 rounded-full border border-card-border hover:border-gold/30"
            title={
              bluesky_reply_count && bluesky_reply_count > 0
                ? `${bluesky_reply_count} ${bluesky_reply_count === 1 ? 'reply' : 'replies'} on Bluesky — click through to read`
                : 'This post has a Bluesky thread — click through to read replies'
            }
          >
            <span aria-hidden="true">↗</span>
            <span>
              {bluesky_reply_count && bluesky_reply_count > 0
                ? `${bluesky_reply_count} on Bluesky`
                : 'on Bluesky'}
            </span>
          </a>
        )}

        <button
          onClick={toggleBookmark}
          disabled={bookmarkLoading}
          class={`flex items-center gap-1.5 text-xs transition-colors ${
            bluesky_uri && id && !defaultShowComments ? '' : 'ml-auto'
          } ${bookmarked ? 'text-gold' : 'text-text-dim hover:text-gold-light'}`}
        >
          <svg class="w-4 h-4" fill={bookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      </div>

      {/* Inline quote-repost composer */}
      {showQuote && id && user && (
        <div class="mt-4 ml-13 rounded-lg bg-navy-mid border border-card-border p-3 space-y-2">
          <textarea
            value={quoteText}
            onInput={(e) => setQuoteText((e.target as HTMLTextAreaElement).value)}
            placeholder="Add your take, then quote-post…"
            rows={2}
            class="w-full bg-transparent text-sm text-text placeholder-text-dim resize-none focus:outline-none"
          />
          <div class="flex items-center justify-between gap-3 pt-2 border-t border-card-border">
            <span class="text-xs text-text-dim">Posts as a new post with the original embedded.</span>
            <div class="flex gap-2">
              <button
                type="button"
                onClick={() => { setShowQuote(false); setQuoteText(''); }}
                class="text-xs text-text-dim hover:text-text transition-colors px-3 py-1"
              >Cancel</button>
              <button
                type="button"
                onClick={submitQuote}
                disabled={quoteSubmitting}
                class="text-xs px-4 py-1 rounded-full bg-gold text-navy font-medium hover:bg-gold-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >{quoteSubmitting ? 'Posting…' : 'Quote post'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Comments section */}
      {showComments && id && (
        <div class="mt-4 ml-13 rounded-lg bg-navy-mid border border-card-border p-3 space-y-3">
          <CommentForm
            postId={id}
            onSubmit={() => setCommentCount((c) => c + 1)}
          />
          <div class="pt-2 border-t border-card-border">
            <CommentsThread
              postId={id}
              onCountChange={(n) => setCommentCount(n)}
            />
          </div>
        </div>
      )}
    </article>
  );
}

/* The token-walk renderer that used to live here moved into
   ./RichContent.tsx so it could be reused by CommentItem and any future
   user-content surface. Imported above. */
