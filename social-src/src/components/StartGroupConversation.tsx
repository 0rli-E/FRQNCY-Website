import { useState, useEffect, useRef } from 'preact/hooks';
import { useAuth } from './AuthProvider';
import { supabase } from '../lib/supabase';

// ─────────────────────────────────────────────────────────────────────────────
// StartGroupConversation
//
// Modal/popover for starting a multi-member conversation. Search by username,
// pick up to 9 other members, click "Start group" → inserts a `conversations`
// row + N `conversation_members` rows (self + selected) and navigates to
// `/social/messages/?cid=<new_conversation_id>`.
//
// useMessages.ts v2 path handles per-recipient encryption automatically once
// the conversation has 2+ non-self members — no changes needed there.
//
// Voice rules: "Group chat", "Start", no member-cap marketing, no admin /
// owner surface. All members are equal in v1.
// ─────────────────────────────────────────────────────────────────────────────

const MAX_OTHER_MEMBERS = 9; // 10 total including self.

interface SearchResult {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

interface StartGroupConversationProps {
  /** Called to dismiss the modal (no group started). */
  onClose: () => void;
}

export default function StartGroupConversation({ onClose }: StartGroupConversationProps) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<SearchResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced username search. Excludes self and anyone already selected.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const term = query.trim();
    if (!term) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .ilike('username', `%${term}%`)
        .limit(10);
      if (error) {
        setSearching(false);
        return;
      }
      const excludeIds = new Set<string>(selected.map((s) => s.id));
      if (user) excludeIds.add(user.id);
      const filtered = ((data as SearchResult[]) ?? []).filter((r) => !excludeIds.has(r.id));
      setResults(filtered.slice(0, 10));
      setSearching(false);
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, selected, user]);

  const addMember = (r: SearchResult) => {
    if (selected.some((s) => s.id === r.id)) return;
    if (selected.length >= MAX_OTHER_MEMBERS) return;
    setSelected([...selected, r]);
    setQuery('');
    setResults([]);
  };

  const removeMember = (id: string) => {
    setSelected(selected.filter((s) => s.id !== id));
  };

  const startGroup = async () => {
    if (busy) return;
    if (!user) return;
    if (selected.length < 2) return;
    setBusy(true);
    setErr(null);
    try {
      // 1. Create the conversation row.
      const { data: conv, error: convErr } = await supabase
        .from('conversations')
        .insert({})
        .select('id')
        .single();
      if (convErr || !conv) throw convErr || new Error('Could not create conversation');
      const cid = conv.id as string;

      // 2. Insert membership rows — self + everyone selected.
      const memberRows = [
        { conversation_id: cid, user_id: user.id },
        ...selected.map((s) => ({ conversation_id: cid, user_id: s.id })),
      ];
      const { error: memErr } = await supabase.from('conversation_members').insert(memberRows);
      if (memErr) throw memErr;

      // 3. Navigate to the messages page with the new conversation pre-selected.
      window.location.href = `/social/messages/?cid=${cid}`;
    } catch (e: any) {
      console.error('Start group failed:', e);
      setErr(e?.message || 'Could not start group chat');
      setBusy(false);
    }
  };

  const canStart = selected.length >= 2 && !busy;

  return (
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={onClose}
    >
      <div
        class="w-full max-w-md rounded-xl bg-card-bg border border-card-border shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div class="px-5 py-4 border-b border-card-border flex items-center justify-between">
          <h3 class="font-heading text-lg text-gold">Start group chat</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            class="text-text-dim hover:text-text transition-colors p-1"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="px-5 py-4 space-y-4">
          {/* Selected member chips */}
          {selected.length > 0 && (
            <div class="flex flex-wrap gap-2">
              {selected.map((s) => (
                <span
                  key={s.id}
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-navy-mid border border-card-border text-xs text-text"
                >
                  <span class="text-text">{s.display_name || s.username}</span>
                  <span class="text-text-dim">@{s.username}</span>
                  <button
                    type="button"
                    onClick={() => removeMember(s.id)}
                    aria-label={`Remove ${s.username}`}
                    class="ml-0.5 text-text-dim hover:text-gold transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Search */}
          <div>
            <label class="block text-[11px] uppercase tracking-[0.18em] text-text-dim mb-2">
              Add members
            </label>
            <input
              type="search"
              placeholder="Search by username"
              value={query}
              onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
              disabled={selected.length >= MAX_OTHER_MEMBERS}
              class="w-full bg-navy-mid border border-card-border rounded-lg px-3 py-2 text-sm text-text placeholder-text-dim focus:outline-none focus:border-gold/40 transition-colors disabled:opacity-50"
            />

            {/* Results list */}
            {query.trim() && (
              <div class="mt-2 max-h-56 overflow-y-auto rounded-lg border border-card-border divide-y divide-card-border bg-navy-mid">
                {searching ? (
                  <p class="px-3 py-2.5 text-xs text-text-dim">Searching…</p>
                ) : results.length === 0 ? (
                  <p class="px-3 py-2.5 text-xs text-text-dim">No matches.</p>
                ) : (
                  results.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => addMember(r)}
                      class="w-full text-left px-3 py-2.5 hover:bg-navy/40 transition-colors flex items-center gap-3"
                    >
                      <div class="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-semibold shrink-0 overflow-hidden">
                        {r.avatar_url ? (
                          <img src={r.avatar_url} alt={r.display_name || r.username} class="w-full h-full object-cover" />
                        ) : (
                          (r.display_name || r.username).charAt(0).toUpperCase()
                        )}
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm text-text truncate">{r.display_name || r.username}</p>
                        <p class="text-xs text-text-dim truncate">@{r.username}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {err && <p class="text-xs text-red-400">{err}</p>}
        </div>

        <div class="px-5 py-4 border-t border-card-border flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            class="px-3 py-2 rounded-lg text-sm text-text-dim hover:text-text transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={startGroup}
            disabled={!canStart}
            class="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20"
          >
            {busy ? 'Starting…' : 'Start group'}
          </button>
        </div>
      </div>
    </div>
  );
}
