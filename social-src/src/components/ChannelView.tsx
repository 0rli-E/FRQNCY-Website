import { useEffect, useState } from 'preact/hooks';
import Feed from './Feed';
import PostComposer from './PostComposer';

/**
 * ChannelView — reads the channel slug from the URL at runtime so a single
 * built shell (`/social/channel/[slug].astro`) serves every channel page.
 *
 * The slug is the third path segment: /social/channel/<slug>.
 */
export default function ChannelView() {
  const [slug, setSlug] = useState<string>('');

  useEffect(() => {
    const parts = location.pathname.split('/').filter(Boolean);
    // ['social','channel','<slug>'] — but Cloudflare may add a trailing slash
    const s = parts[2] || '';
    setSlug(decodeURIComponent(s));
    // Update tab title for shareability — the SocialLayout sets a generic one
    if (s) document.title = `#${decodeURIComponent(s).replace(/-/g, ' ')} · NRG · FRQNCY`;
  }, []);

  if (!slug) {
    return (
      <div class="max-w-3xl mx-auto mt-6 rounded-xl bg-card-bg border border-card-border p-8 text-center">
        <p class="text-text-dim text-sm">No channel selected. <a href="/social" class="text-gold hover:text-gold-light">Back to all threads →</a></p>
      </div>
    );
  }

  const display = slug.replace(/-/g, ' ');

  return (
    <div class="max-w-3xl mx-auto mt-6 space-y-6">
      <header class="rounded-xl bg-card-bg border border-card-border p-5">
        <div class="flex items-start gap-4">
          <div class="w-14 h-14 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center text-gold text-2xl font-heading shrink-0">
            #
          </div>
          <div class="flex-1 min-w-0">
            <h1 class="font-heading text-2xl text-text mb-1">
              <span class="text-gold">#</span>{display}
            </h1>
            <p class="text-sm text-text-dim">
              Threads tagged with this channel. Posts land here when authors pick the channel in their composer.
            </p>
          </div>
          <a href="/social" class="text-xs text-text-dim hover:text-gold transition-colors whitespace-nowrap" aria-label="Back to all threads">
            ← All threads
          </a>
        </div>
      </header>

      <PostComposer />
      <Feed channel={slug} />
    </div>
  );
}
