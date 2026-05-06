import { useEffect, useState } from 'preact/hooks';
import { supabase } from '../lib/supabase';
import PostCard from './PostCard';
import BlueskyReplies from './BlueskyReplies';

interface PostRow {
  id: string;
  content: string;
  project_tag: string | null;
  project_tier: string | null;
  link_url: string | null;
  link_preview: any;
  created_at: string;
  likes_count: number;
  comments_count: number;
  bookmarks_count: number;
  signature: string | null;
  signed_payload: string | null;
  /** AT-URI of the Bluesky mirror when this post was cross-posted. NULL when
      the user wasn't connected at post time, opted out, or the cross-post
      failed. Surfaces the BlueskyReplies component when present. Per
      migration 016 + proposals/BLUESKY-TIMELINE-READER.md (v1.1). */
  bluesky_uri: string | null;
  profiles: {
    username: string;
    display_name: string;
    avatar_url: string | null;
    signing_public_key: string | null;
    bluesky_handle: string | null;
  } | null;
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

/**
 * PostView — single-post detail page rendered at /social/post/<id>.
 *
 * Reads the id from location.pathname so a single built shell serves every
 * post. Comments thread is shown expanded by default — this is the cast
 * page, the whole point is to read the conversation.
 */
export default function PostView() {
  const [postId, setPostId] = useState<string>('');
  const [post, setPost] = useState<PostRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Pull id from URL once
  useEffect(() => {
    const parts = location.pathname.split('/').filter(Boolean);
    // ['social','post','<id>']
    const id = parts[2] || '';
    setPostId(id);
  }, []);

  useEffect(() => {
    if (!postId || postId === 'shell') {
      setLoading(false);
      setNotFound(true);
      return;
    }
    let cancelled = false;
    (async () => {
      // Select bluesky_uri so we can surface the federated reply backflow
      // when present. Migration 016 adds this column — if it hasn't been
      // applied yet the select will fail and we degrade gracefully by
      // re-trying without it.
      let { data, error } = await supabase
        .from('posts')
        .select(
          'id, content, project_tag, project_tier, link_url, link_preview, created_at, likes_count, comments_count, bookmarks_count, signature, signed_payload, bluesky_uri, profiles!author_id(username, display_name, avatar_url, signing_public_key, bluesky_handle)'
        )
        .eq('id', postId)
        .maybeSingle();
      if (error && /bluesky_uri|bluesky_handle/.test(error.message || '')) {
        // Migration 010 or 016 not applied — fall back to the legacy column set.
        const fb = await supabase
          .from('posts')
          .select(
            'id, content, project_tag, project_tier, link_url, link_preview, created_at, likes_count, comments_count, bookmarks_count, signature, signed_payload, profiles!author_id(username, display_name, avatar_url, signing_public_key)'
          )
          .eq('id', postId)
          .maybeSingle();
        data = fb.data as any;
        error = fb.error;
      }
      if (cancelled) return;
      if (error || !data) {
        setNotFound(true);
      } else {
        setPost(data as unknown as PostRow);
        const author = (data as any).profiles?.display_name;
        if (author) document.title = `${author} on FRQNCY · NRG`;
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [postId]);

  if (loading) {
    return (
      <div class="max-w-3xl mx-auto mt-6">
        <div class="rounded-xl bg-card-bg border border-card-border p-5 animate-pulse">
          <div class="flex gap-3">
            <div class="w-10 h-10 rounded-full bg-navy-mid" />
            <div class="flex-1 space-y-2">
              <div class="h-4 bg-navy-mid rounded w-1/3" />
              <div class="h-3 bg-navy-mid rounded w-full" />
              <div class="h-3 bg-navy-mid rounded w-2/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div class="max-w-3xl mx-auto mt-6 rounded-xl bg-card-bg border border-card-border p-8 text-center">
        <p class="font-heading text-xl text-text mb-2">Post not found</p>
        <p class="text-sm text-text-dim">
          This thread may have been removed, or the link is incomplete.
        </p>
        <a href="/social" class="inline-block mt-4 text-sm text-gold hover:text-gold-light">
          ← Back to all threads
        </a>
      </div>
    );
  }

  return (
    <div class="max-w-3xl mx-auto mt-6 space-y-4">
      <div class="flex items-center gap-3 text-xs text-text-dim">
        <a href="/social" class="hover:text-gold transition-colors">← All threads</a>
        {post.project_tag && (
          <>
            <span class="opacity-50">·</span>
            <a
              href={`/social/channel/${encodeURIComponent(post.project_tag)}`}
              class="hover:text-gold transition-colors"
            >
              #{post.project_tag}
            </a>
          </>
        )}
      </div>

      <PostCard
        id={post.id}
        author={post.profiles?.display_name || 'Anonymous'}
        username={post.profiles?.username || 'anon'}
        avatar={post.profiles?.avatar_url || undefined}
        content={post.content}
        tags={post.project_tag ? [post.project_tag] : []}
        project_tag={post.project_tag}
        project_tier={post.project_tier}
        link_preview={post.link_preview}
        likes={post.likes_count ?? 0}
        comments={post.comments_count ?? 0}
        time={timeAgo(post.created_at)}
        defaultShowComments
        signature={post.signature ?? null}
        signed_payload={post.signed_payload ?? null}
        author_signing_public_key={post.profiles?.signing_public_key ?? null}
      />

      {post.bluesky_uri && (
        <BlueskyReplies
          bskyUri={post.bluesky_uri}
          authorHandleHint={post.profiles?.bluesky_handle ?? null}
        />
      )}
    </div>
  );
}
