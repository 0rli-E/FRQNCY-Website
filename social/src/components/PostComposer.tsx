import { useState } from 'preact/hooks';
import { useAuth } from './AuthProvider';
import { supabase } from '../lib/supabase';
import type { Post } from '../lib/api';
import ProjectPicker from './ProjectPicker';
import ConvictionToggle, { type Conviction } from './ConvictionToggle';
import type { Project } from '../lib/projects';

interface PostComposerProps {
  onPost?: () => void;
}

// Tracks whether the `conviction` column exists on posts. We optimistically
// try to insert it; on the first schema error we flip this flag and retry
// without it. This lets the UI ship before the migration is applied.
let convictionColumnMissing = false;

export default function PostComposer({ onPost }: PostComposerProps) {
  const { user, profile, loading } = useAuth();
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [project, setProject] = useState<Project | null>(null);
  const [conviction, setConviction] = useState<Conviction | null>(null);
  const [focused, setFocused] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div class="rounded-xl bg-card-bg border border-card-border p-5 animate-pulse">
        <div class="flex gap-3">
          <div class="w-10 h-10 rounded-full bg-navy-mid shrink-0" />
          <div class="flex-1 space-y-2">
            <div class="h-3 bg-navy-mid rounded w-1/3" />
            <div class="h-3 bg-navy-mid rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div class="rounded-xl bg-card-bg border border-card-border p-5 text-center">
        <p class="text-sm text-text-dim mb-3">Sign in to share your thoughts with the community</p>
        <a
          href="/social/login"
          class="inline-block px-5 py-2 rounded-full bg-gold text-navy text-sm font-medium hover:bg-gold-light transition-colors"
        >
          Sign in to post
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

  const addTag = () => {
    const tag = tagInput.trim().replace(/^#/, '');
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;

    setSubmitting(true);
    try {
      const basePayload: Record<string, any> = {
        author_id: user.id,
        content: content.trim(),
        media_urls: [],
        link_url: null,
        link_preview: null,
        project_tag: project?.name ?? null,
        project_tier: project?.tier ?? null,
      };

      // Only include conviction when a project is tagged. Sending it for
      // untagged posts is noise.
      const payload =
        project && conviction && !convictionColumnMissing
          ? { ...basePayload, conviction }
          : basePayload;

      let insert = await supabase
        .from('posts')
        .insert(payload)
        .select('*, author:profiles!posts_author_id_fkey(*)')
        .single();

      // If the conviction column doesn't exist yet, retry without it.
      if (
        insert.error &&
        !convictionColumnMissing &&
        /conviction/i.test(insert.error.message || '')
      ) {
        console.warn(
          '[PostComposer] conviction column missing — falling back. ' +
            'Run supabase/migrations/002_conviction.sql to enable it.',
        );
        convictionColumnMissing = true;
        insert = await supabase
          .from('posts')
          .insert(basePayload)
          .select('*, author:profiles!posts_author_id_fkey(*)')
          .single();
      }

      if (insert.error) throw new Error(insert.error.message);
      const post = insert.data as Post | null;
      if (!post) throw new Error('Post creation returned null');

      // Bump the author's post_count (matches the logic in lib/api.ts).
      await supabase.rpc('increment_counter', {
        row_id: user.id,
        table_name: 'profiles',
        column_name: 'post_count',
        amount: 1,
      });

      setContent('');
      setTags([]);
      setTagInput('');
      setProject(null);
      setConviction(null);
      onPost?.();
    } catch (err: any) {
      console.error('Failed to create post:', err?.message || err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      class={`rounded-xl bg-card-bg border transition-colors p-5 ${
        focused ? 'border-gold/30' : 'border-card-border'
      }`}
    >
      <div class="flex gap-3">
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.display_name}
            class="w-10 h-10 rounded-full object-cover border border-card-border shrink-0"
          />
        ) : (
          <div class="w-10 h-10 rounded-full bg-accent/20 border border-card-border flex items-center justify-center text-accent text-sm font-semibold shrink-0">
            {initials}
          </div>
        )}
        <div class="flex-1">
          <textarea
            value={content}
            onInput={(e) => setContent((e.target as HTMLTextAreaElement).value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Share an insight, question, or discovery..."
            rows={focused || content ? 4 : 2}
            class="w-full bg-transparent text-sm text-text placeholder-text-dim resize-none focus:outline-none transition-all"
          />

          {/* Tag input area */}
          {(focused || tags.length > 0) && (
            <div class="mt-2 pt-2 border-t border-card-border">
              <div class="flex flex-wrap gap-1.5 items-center">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    class="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      class="hover:text-gold-light transition-colors"
                    >
                      x
                    </button>
                  </span>
                ))}
                {tags.length < 5 && (
                  <input
                    type="text"
                    value={tagInput}
                    onInput={(e) => setTagInput((e.target as HTMLInputElement).value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="Add topic tag..."
                    class="bg-transparent text-xs text-text-dim placeholder-text-dim/50 focus:outline-none min-w-[100px] flex-1 py-1"
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Project tag + conviction */}
      {(focused || project || content) && (
        <div class="mt-3 pl-[52px] space-y-2">
          <ProjectPicker
            value={project}
            onChange={(p) => {
              setProject(p);
              // Reset conviction if the project is cleared.
              if (!p) setConviction(null);
            }}
            placeholder="Tag a project (optional)"
          />
          {project && (
            <ConvictionToggle value={conviction} onChange={setConviction} />
          )}
        </div>
      )}

      {/* Actions */}
      <div class="flex items-center justify-between mt-3 pt-3 border-t border-card-border">
        <div class="flex gap-2">
          <button
            type="button"
            class="text-text-dim hover:text-gold transition-colors p-1.5 rounded-lg hover:bg-gold/5"
            title="Attach image"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            type="button"
            class="text-text-dim hover:text-gold transition-colors p-1.5 rounded-lg hover:bg-gold/5"
            title="Link a resource"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </button>
        </div>
        <button
          type="submit"
          disabled={!content.trim() || submitting}
          class="px-5 py-1.5 rounded-full bg-gold text-navy text-sm font-medium hover:bg-gold-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {submitting ? 'Posting...' : 'Post'}
        </button>
      </div>
    </form>
  );
}
