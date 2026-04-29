import { useState, useRef, useEffect } from 'preact/hooks';
import { useAuth } from './AuthProvider';
import { createComment } from '../lib/api';

interface CommentFormProps {
  postId: string;
  parentId?: string | null;
  onSubmit?: (comment: any) => void;
  onCancel?: () => void;
  autoFocus?: boolean;
}

const MAX_LEN = 1000;

export default function CommentForm({
  postId,
  parentId = null,
  onSubmit,
  onCancel,
  autoFocus = false,
}: CommentFormProps) {
  const { user, profile } = useAuth();
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  if (!user) {
    return (
      <div class="text-xs text-text-dim py-2">
        <a
          href="/social/login"
          class="text-gold hover:text-gold-light transition-colors"
        >
          Sign in to comment
        </a>
      </div>
    );
  }

  const initials = (profile?.display_name || user.email || '?')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || submitting) return;
    if (trimmed.length > MAX_LEN) {
      setError(`Comments must be ${MAX_LEN} characters or fewer.`);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      // Route through api.ts so notification side-effects fire consistently.
      const data = await createComment({
        post_id: postId,
        author_id: user.id,
        content: trimmed,
        parent_id: parentId ?? undefined,
      });

      if (!data) throw new Error('Comment insert returned null');

      setContent('');
      onSubmit?.(data);
    } catch (err: any) {
      console.error('Comment insert failed:', err?.message || err);
      setError('Failed to post comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const remaining = MAX_LEN - content.length;

  return (
    <form onSubmit={handleSubmit} class="flex gap-2 items-start">
      {profile?.avatar_url ? (
        <img
          src={profile.avatar_url}
          alt={profile.display_name}
          class="w-7 h-7 rounded-full object-cover shrink-0"
        />
      ) : (
        <div class="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-accent text-[10px] font-semibold shrink-0">
          {initials}
        </div>
      )}
      <div class="flex-1 min-w-0">
        <textarea
          ref={textareaRef}
          value={content}
          onInput={(e) => {
            const v = (e.target as HTMLTextAreaElement).value;
            setContent(v.slice(0, MAX_LEN));
          }}
          placeholder={parentId ? 'Write a reply...' : 'Add a comment...'}
          rows={parentId ? 2 : 2}
          maxLength={MAX_LEN}
          class="w-full bg-navy-deep/50 border border-card-border rounded-lg px-3 py-2 text-sm text-text placeholder-text-dim resize-none focus:outline-none focus:border-gold/30 transition-colors"
        />
        {error && <p class="text-xs text-red-400 mt-1">{error}</p>}
        <div class="flex items-center justify-between mt-1.5">
          <span
            class={`text-[10px] ${
              remaining < 50 ? 'text-gold' : 'text-text-dim'
            }`}
          >
            {remaining} left
          </span>
          <div class="flex items-center gap-2">
            {parentId && onCancel && (
              <button
                type="button"
                onClick={onCancel}
                class="text-xs px-3 py-1 rounded-full text-text-dim hover:text-text transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={!content.trim() || submitting}
              class="px-3 py-1 rounded-full bg-gold text-navy text-xs font-medium hover:bg-gold-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {submitting ? 'Posting...' : parentId ? 'Reply' : 'Comment'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
