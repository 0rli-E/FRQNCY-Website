import { useEffect, useState } from 'preact/hooks';
import { supabase } from '../lib/supabase';

interface QuotedPostProps {
  postId: string;
}

interface PostRow {
  id: string;
  content: string;
  created_at: string;
  profiles: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
}

/**
 * QuotedPost — embedded card showing a quoted post inside another post.
 * The renderer in PostCard finds the QUOTE_PREFIX marker and mounts this.
 *
 * No new schema — quote posts are just posts whose body starts with the
 * marker. This card fetches the original by id and renders a compact
 * preview that links to the full single-post page.
 */
export default function QuotedPost({ postId }: QuotedPostProps) {
  const [post, setPost] = useState<PostRow | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('id, content, created_at, profiles!author_id(username, display_name, avatar_url)')
        .eq('id', postId)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) setMissing(true);
      else setPost(data as unknown as PostRow);
    })();
    return () => { cancelled = true; };
  }, [postId]);

  if (missing) {
    return (
      <div class="rounded-lg border border-card-border bg-navy-mid/50 p-3 text-xs text-text-dim italic">
        The quoted post is no longer available.
      </div>
    );
  }

  if (!post) {
    return (
      <div class="rounded-lg border border-card-border bg-navy-mid/50 p-3 animate-pulse">
        <div class="h-3 bg-navy-mid rounded w-1/3 mb-2" />
        <div class="h-3 bg-navy-mid rounded w-full mb-1" />
        <div class="h-3 bg-navy-mid rounded w-2/3" />
      </div>
    );
  }

  const author = post.profiles?.display_name || 'Anonymous';
  const username = post.profiles?.username || 'anon';

  return (
    <a
      href={`/social/post/${post.id}`}
      class="block rounded-lg border border-card-border bg-navy-mid/50 p-3 hover:border-gold/30 hover:bg-navy-mid transition-colors"
    >
      <div class="flex items-center gap-2 text-xs text-text-dim mb-1.5">
        <span class="text-text font-medium">{author}</span>
        <span class="opacity-60">@{username}</span>
      </div>
      <p class="text-sm text-text leading-relaxed line-clamp-4 whitespace-pre-wrap">
        {post.content}
      </p>
    </a>
  );
}
