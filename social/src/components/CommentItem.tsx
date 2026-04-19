import { useState } from 'preact/hooks';
import CommentForm from './CommentForm';
import { useAuth } from './AuthProvider';

export interface CommentNode {
  id: string;
  post_id: string;
  author_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  profiles?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
  children: CommentNode[];
}

interface CommentItemProps {
  comment: CommentNode;
  depth: number;
  maxDepth: number;
  postId: string;
  onReplyPosted: (comment: any) => void;
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w`;
  return new Date(dateStr).toLocaleDateString();
}

export default function CommentItem({
  comment,
  depth,
  maxDepth,
  postId,
  onReplyPosted,
}: CommentItemProps) {
  const { user } = useAuth();
  const [replyOpen, setReplyOpen] = useState(false);
  const [expanded, setExpanded] = useState(depth < maxDepth);

  const author = comment.profiles;
  const display = author?.display_name || author?.username || 'Unknown';
  const username = author?.username || 'unknown';
  const initial = display.charAt(0).toUpperCase();

  const hasChildren = comment.children && comment.children.length > 0;
  const atMaxDepth = depth >= maxDepth;

  return (
    <div class="flex gap-2">
      {/* Avatar */}
      <a
        href={`/social/profile/${username}`}
        class="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-accent text-[10px] font-semibold shrink-0 overflow-hidden hover:ring-1 hover:ring-gold/30 transition-all"
      >
        {author?.avatar_url ? (
          <img
            src={author.avatar_url}
            alt={display}
            class="w-full h-full object-cover"
          />
        ) : (
          initial
        )}
      </a>

      {/* Body */}
      <div class="flex-1 min-w-0">
        <div class="flex items-baseline gap-1.5 flex-wrap">
          <a
            href={`/social/profile/${username}`}
            class="text-xs font-medium text-text hover:text-gold transition-colors"
          >
            {display}
          </a>
          <span class="text-[11px] text-text-dim">@{username}</span>
          <span class="text-[11px] text-text-dim opacity-50">·</span>
          <span class="text-[11px] text-text-dim">
            {timeAgo(comment.created_at)}
          </span>
        </div>

        <p class="text-sm text-text leading-relaxed whitespace-pre-wrap mt-0.5">
          {comment.content}
        </p>

        {/* Actions */}
        <div class="flex items-center gap-4 mt-1.5">
          {/* TODO: comment_likes table not in schema — hook up when added */}
          <button
            type="button"
            title="Likes coming soon"
            class="flex items-center gap-1 text-[11px] text-text-dim/60 cursor-not-allowed"
          >
            <svg
              class="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>

          {user && !atMaxDepth && (
            <button
              type="button"
              onClick={() => setReplyOpen((v) => !v)}
              class="text-[11px] text-text-dim hover:text-gold transition-colors"
            >
              {replyOpen ? 'Cancel' : 'Reply'}
            </button>
          )}
        </div>

        {/* Reply form */}
        {replyOpen && (
          <div class="mt-2">
            <CommentForm
              postId={postId}
              parentId={comment.id}
              autoFocus
              onCancel={() => setReplyOpen(false)}
              onSubmit={(c) => {
                setReplyOpen(false);
                setExpanded(true);
                onReplyPosted(c);
              }}
            />
          </div>
        )}

        {/* Children */}
        {hasChildren && (
          <div class="mt-3">
            {atMaxDepth ? (
              <a
                href={`/social/post/${postId}`}
                class="text-[11px] text-gold hover:text-gold-light transition-colors"
              >
                Continue thread ({comment.children.length} more){' '}
                <span aria-hidden>-&gt;</span>
              </a>
            ) : expanded ? (
              <div class="space-y-3 pl-2 border-l border-card-border">
                {comment.children.map((child) => (
                  <CommentItem
                    key={child.id}
                    comment={child}
                    depth={depth + 1}
                    maxDepth={maxDepth}
                    postId={postId}
                    onReplyPosted={onReplyPosted}
                  />
                ))}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                class="text-[11px] text-gold hover:text-gold-light transition-colors"
              >
                Show {comment.children.length}{' '}
                {comment.children.length === 1 ? 'reply' : 'replies'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
