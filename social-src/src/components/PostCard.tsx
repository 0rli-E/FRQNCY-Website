import { useState, useEffect } from 'preact/hooks';
import { useAuth } from './AuthProvider';
import { supabase } from '../lib/supabase';

import ProjectBadge from './ProjectBadge';
import CommentsThread from './CommentsThread';
import CommentForm from './CommentForm';

interface PostCardProps {
  id?: string;
  author?: string;
  username?: string;
  avatar?: string;
  content?: string;
  tags?: string[];
  project_tag?: string | null;
  project_tier?: string | null;
  likes?: number;
  comments?: number;
  time?: string;
}

export default function PostCard({
  id,
  author = 'Anonymous',
  username = 'anon',
  avatar,
  content = '',
  tags = [],
  project_tag = null,
  project_tier = null,
  likes = 0,
  comments = 0,
  time = 'just now',
}: PostCardProps) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  const [bookmarked, setBookmarked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(comments);

  // Check if current user has liked/bookmarked this post
  useEffect(() => {
    if (!user || !id) return;

    const checkStatus = async () => {
      const [likeResult, bookmarkResult] = await Promise.all([
        supabase
          .from('likes')
          .select('id')
          .eq('user_id', user.id)
          .eq('post_id', id)
          .maybeSingle(),
        supabase
          .from('bookmarks')
          .select('id')
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

  const initials = author
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <article class="rounded-xl bg-card-bg border border-card-border p-5 hover:border-gold/10 transition-colors">
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
          </div>
        </div>
        <button class="text-text-dim hover:text-text transition-colors p-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div class="mt-3 ml-13">
        <p class="text-sm text-text leading-relaxed whitespace-pre-wrap">{content}</p>

        {/* Project tag badge */}
        {project_tag && (
          <div class="mt-2.5">
            <ProjectBadge name={project_tag} tier={project_tier || 'D'} />
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div class="flex flex-wrap gap-1.5 mt-3">
            {tags.map((tag) => (
              <a
                key={tag}
                href="#"
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

        <button class="flex items-center gap-1.5 text-xs text-text-dim hover:text-gold-light transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </button>

        <button
          onClick={toggleBookmark}
          disabled={bookmarkLoading}
          class={`flex items-center gap-1.5 text-xs transition-colors ml-auto ${
            bookmarked ? 'text-gold' : 'text-text-dim hover:text-gold-light'
          }`}
        >
          <svg class="w-4 h-4" fill={bookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      </div>

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
