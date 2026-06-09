import { useEffect, useRef, useState } from 'preact/hooks';
import { searchAll, type SearchResults } from '../lib/api';
import { BlueskyPostCard } from './FederatedFeed';

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

function highlight(text: string, q: string) {
  if (!q.trim()) return text;
  const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig'));
  return parts.map((p, i) =>
    p.toLowerCase() === q.toLowerCase()
      ? <mark class="bg-gold/20 text-gold px-0.5 rounded-sm">{p}</mark>
      : p
  );
}

export default function SearchView() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'posts' | 'people' | 'projects' | 'bluesky'>('all');
  const debounceRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Read initial query from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') || '';
    if (q) {
      setQuery(q);
      runSearch(q);
    }
    inputRef.current?.focus();
  }, []);

  async function runSearch(q: string) {
    if (!q.trim()) {
      setResults(null);
      return;
    }
    setLoading(true);
    const data = await searchAll(q);
    setResults(data);
    setLoading(false);
  }

  function onInput(e: any) {
    const v = e.currentTarget.value;
    setQuery(v);

    // Update URL without reloading
    const url = new URL(window.location.href);
    if (v) url.searchParams.set('q', v);
    else url.searchParams.delete('q');
    window.history.replaceState({}, '', url.toString());

    // Debounce the fetch
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => runSearch(v), 250);
  }

  const counts = results
    ? {
        posts: results.posts.length,
        people: results.profiles.length,
        projects: results.projects.length,
        bluesky: results.bluesky.length,
      }
    : { posts: 0, people: 0, projects: 0, bluesky: 0 };

  const totalCount = counts.posts + counts.people + counts.projects + counts.bluesky;

  return (
    <div class="space-y-6">
      {/* Search input */}
      <div class="relative">
        <svg
          class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-dim pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onInput={onInput}
          placeholder="Search posts, people, projects..."
          class="w-full bg-card-bg border border-card-border rounded-full pl-12 pr-4 py-3.5 text-text placeholder-text-dim focus:outline-none focus:border-gold/40 transition-colors"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults(null);
              const url = new URL(window.location.href);
              url.searchParams.delete('q');
              window.history.replaceState({}, '', url.toString());
              inputRef.current?.focus();
            }}
            class="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim hover:text-gold text-sm"
            aria-label="Clear"
          >
            ✕
          </button>
        )}
      </div>

      {/* Tabs */}
      {results && totalCount > 0 && (
        <div class="flex gap-1 border-b border-card-border text-sm">
          {([
            ['all', 'All', totalCount],
            ['posts', 'Posts', counts.posts],
            ['people', 'People', counts.people],
            ['projects', 'Projects', counts.projects],
            ['bluesky', 'Bluesky', counts.bluesky],
          ] as const).map(([key, label, n]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              class={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === key
                  ? 'border-gold text-gold'
                  : 'border-transparent text-text-dim hover:text-text'
              }`}
            >
              {label} <span class="text-xs opacity-60">{n}</span>
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div class="py-12 text-center text-text-dim text-sm">Searching…</div>
      )}

      {/* Empty / prompts */}
      {!loading && !results && (
        <div class="py-16 text-center space-y-3">
          <p class="text-text-dim">Search the network.</p>
          <p class="text-xs text-text-dim/70">Try a project symbol like <span class="text-gold">BTC</span>, a handle, or a phrase from a post.</p>
        </div>
      )}

      {!loading && results && totalCount === 0 && (
        <div class="rounded-xl bg-card-bg border border-card-border p-8 text-center">
          <p class="text-text-dim">No results for "<span class="text-text">{query}</span>".</p>
          <p class="text-xs text-text-dim/70 mt-2">Try a broader term or a project symbol.</p>
        </div>
      )}

      {/* Results */}
      {!loading && results && totalCount > 0 && (
        <div class="space-y-10">
          {/* Projects */}
          {(activeTab === 'all' || activeTab === 'projects') && results.projects.length > 0 && (
            <section class="space-y-3">
              {activeTab === 'all' && (
                <h2 class="font-heading text-lg text-gold flex items-baseline gap-2">
                  Projects <span class="text-xs text-text-dim">· {results.projects.length}</span>
                </h2>
              )}
              <div class="grid md:grid-cols-2 gap-3">
                {results.projects.map((p) => (
                  <div
                    key={`${p.symbol}-${p.name}`}
                    class="rounded-xl bg-card-bg border border-card-border hover:border-gold/30 p-4 transition-colors"
                  >
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0">
                        <p class="font-heading text-gold">{highlight(p.name, query)}</p>
                        <p class="text-xs text-text-dim mt-0.5">
                          {highlight(p.symbol, query)} · {p.category}
                        </p>
                      </div>
                      <span
                        class="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border flex-shrink-0"
                        style={{ color: p.accent, borderColor: `${p.accent}40` }}
                      >
                        {p.tierLabel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* People */}
          {(activeTab === 'all' || activeTab === 'people') && results.profiles.length > 0 && (
            <section class="space-y-3">
              {activeTab === 'all' && (
                <h2 class="font-heading text-lg text-gold flex items-baseline gap-2">
                  People <span class="text-xs text-text-dim">· {results.profiles.length}</span>
                </h2>
              )}
              <div class="grid md:grid-cols-2 gap-3">
                {results.profiles.map((pr) => (
                  <a
                    key={pr.id}
                    href={`/social/profile/${pr.username}`}
                    class="rounded-xl bg-card-bg border border-card-border hover:border-gold/30 p-4 transition-colors flex gap-3 items-center"
                  >
                    <div class="w-10 h-10 rounded-full bg-navy-mid overflow-hidden flex-shrink-0 border border-card-border">
                      {pr.avatar_url ? (
                        <img src={pr.avatar_url} alt={pr.display_name} class="w-full h-full object-cover" />
                      ) : (
                        <div class="w-full h-full flex items-center justify-center text-gold font-heading">
                          {(pr.display_name || pr.username || '?')[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="font-heading text-text truncate">{highlight(pr.display_name || pr.username, query)}</p>
                      <p class="text-xs text-text-dim truncate">@{highlight(pr.username, query)}</p>
                    </div>
                    <div class="text-right flex-shrink-0 text-xs text-text-dim">
                      <p>{pr.follower_count ?? 0}</p>
                      <p class="opacity-60">followers</p>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* Posts */}
          {(activeTab === 'all' || activeTab === 'posts') && results.posts.length > 0 && (
            <section class="space-y-3">
              {activeTab === 'all' && (
                <h2 class="font-heading text-lg text-gold flex items-baseline gap-2">
                  Posts <span class="text-xs text-text-dim">· {results.posts.length}</span>
                </h2>
              )}
              <div class="space-y-3">
                {results.posts.map((post) => {
                  const author = (post as any).author;
                  return (
                    <article
                      key={post.id}
                      class="rounded-xl bg-card-bg border border-card-border hover:border-gold/30 p-4 transition-colors"
                    >
                      <header class="flex items-center gap-3 mb-2">
                        <a
                          href={author ? `/social/profile/${author.username}` : '#'}
                          class="w-8 h-8 rounded-full bg-navy-mid overflow-hidden border border-card-border flex-shrink-0"
                        >
                          {author?.avatar_url ? (
                            <img src={author.avatar_url} alt={author.display_name} class="w-full h-full object-cover" />
                          ) : (
                            <div class="w-full h-full flex items-center justify-center text-gold font-heading text-xs">
                              {(author?.display_name || author?.username || '?')[0]?.toUpperCase()}
                            </div>
                          )}
                        </a>
                        <div class="min-w-0 flex-1 flex items-baseline gap-2">
                          <a
                            href={author ? `/social/profile/${author.username}` : '#'}
                            class="font-heading text-sm text-text hover:text-gold truncate"
                          >
                            {author?.display_name || author?.username || 'Anonymous'}
                          </a>
                          <span class="text-xs text-text-dim">· {timeAgo(post.created_at)}</span>
                        </div>
                        {post.project_tag && (
                          <span class="text-[10px] px-2 py-0.5 rounded-full bg-gold/10 border border-gold/30 text-gold flex-shrink-0">
                            ${post.project_tag}
                          </span>
                        )}
                      </header>
                      <p class="text-sm text-text-dim leading-relaxed whitespace-pre-wrap">
                        {highlight(post.content, query)}
                      </p>
                      <footer class="flex gap-4 text-xs text-text-dim mt-3 pt-2 border-t border-card-border">
                        <span>♡ {post.likes_count ?? 0}</span>
                        <span>💬 {post.comments_count ?? 0}</span>
                        <span>⧖ {post.bookmarks_count ?? 0}</span>
                      </footer>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {/* Bluesky — public results from the federated AppView */}
          {(activeTab === 'all' || activeTab === 'bluesky') && results.bluesky.length > 0 && (
            <section class="space-y-3">
              {activeTab === 'all' && (
                <h2 class="font-heading text-lg text-gold flex items-baseline gap-2">
                  Bluesky <span class="text-xs text-text-dim">· {results.bluesky.length}</span>
                </h2>
              )}
              <p class="text-xs text-text-dim/70">
                Public posts from the wider network · open on bsky.app to reply or repost.
              </p>
              <div class="space-y-3">
                {results.bluesky.map((post) => (
                  <BlueskyPostCard key={post.uri} post={post} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
