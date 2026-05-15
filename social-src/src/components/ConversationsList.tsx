import { useState, useEffect } from 'preact/hooks';
import { useAuth } from './AuthProvider';
import { supabase } from '../lib/supabase';
import ChatWindow from './ChatWindow';
import StartGroupConversation from './StartGroupConversation';
import SetupSecureDMs, { SKIP_LS_KEY as DM_SETUP_SKIP_KEY } from './SetupSecureDMs';

interface OtherUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

interface ConversationRow {
  id: string;
  updated_at: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  others: OtherUser[];
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '';
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function ConversationsList() {
  const { user, loading: authLoading, encryptionStatus } = useAuth();
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showStartGroup, setShowStartGroup] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  // Read the skip-flag once on mount so the inline banner softens (less
  // aggressive copy) for users who already dismissed the prompt. Live state
  // re-flips when the user actually completes setup (encryptionStatus -> ready).
  const [setupSkipped, setSetupSkipped] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setSetupSkipped(window.localStorage.getItem(DM_SETUP_SKIP_KEY) === '1');
  }, []);

  // Honor ?c=<id> (StartConversationButton, 1:1) and ?cid=<id>
  // (StartGroupConversation, group chats) so either deep-link works.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const c = params.get('c') || params.get('cid');
    if (c) setSelectedId(c);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      // 1. Get conversations this user is a member of
      const { data: memberships, error: memErr } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (cancelled) return;
      if (memErr || !memberships || memberships.length === 0) {
        setLoading(false);
        return;
      }

      const convIds = memberships.map((m: any) => m.conversation_id);

      // 2. Get the conversations themselves, ordered by updated_at
      const { data: convs } = await supabase
        .from('conversations')
        .select('id, updated_at')
        .in('id', convIds)
        .order('updated_at', { ascending: false });

      if (cancelled || !convs) {
        setLoading(false);
        return;
      }

      // 3. Get other members (excluding current user) across all conversations
      const { data: otherMembers } = await supabase
        .from('conversation_members')
        .select('conversation_id, user_id, profiles!user_id(id, username, display_name, avatar_url)')
        .in('conversation_id', convIds)
        .neq('user_id', user.id);

      // 4. Get last message per conversation
      const { data: recentMessages } = await supabase
        .from('messages')
        .select('conversation_id, content, created_at')
        .in('conversation_id', convIds)
        .order('created_at', { ascending: false });

      // Build a map of conversation_id → last message
      const lastMsgByConv: Record<string, { content: string | null; at: string }> = {};
      for (const m of (recentMessages as any[]) || []) {
        if (!lastMsgByConv[m.conversation_id]) {
          lastMsgByConv[m.conversation_id] = {
            content: m.content,
            at: m.created_at,
          };
        }
      }

      // Build a map of conversation_id → other users
      const othersByConv: Record<string, OtherUser[]> = {};
      for (const m of (otherMembers as any[]) || []) {
        const profile = m.profiles;
        if (!profile) continue;
        if (!othersByConv[m.conversation_id]) othersByConv[m.conversation_id] = [];
        othersByConv[m.conversation_id].push(profile);
      }

      const rows: ConversationRow[] = convs.map((c: any) => ({
        id: c.id,
        updated_at: c.updated_at,
        lastMessage: lastMsgByConv[c.id]?.content ?? null,
        lastMessageAt: lastMsgByConv[c.id]?.at ?? c.updated_at,
        others: othersByConv[c.id] || [],
      }));

      // Re-sort by last message time (conversations.updated_at isn't auto-bumped on new message yet)
      rows.sort((a, b) => {
        const at = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const bt = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return bt - at;
      });

      setConversations(rows);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div class="grid grid-cols-1 md:grid-cols-12 gap-0 rounded-xl border border-card-border overflow-hidden" style="min-height: 60vh;">
        <div class="md:col-span-4 bg-card-bg border-r border-card-border p-4">
          <div class="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} class="flex gap-3">
                <div class="w-10 h-10 rounded-full bg-navy-mid" />
                <div class="flex-1 space-y-2">
                  <div class="h-3 bg-navy-mid rounded w-1/2" />
                  <div class="h-2 bg-navy-mid rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div class="md:col-span-8 bg-navy" />
      </div>
    );
  }

  if (!user) {
    return (
      <div class="rounded-xl bg-card-bg border border-card-border p-12 text-center">
        <p class="text-text-dim text-sm mb-4">Sign in to see your messages.</p>
        <a
          href="/social/login"
          class="inline-block px-4 py-2 rounded-lg bg-gold/10 border border-gold/30 text-gold text-sm font-medium hover:bg-gold/20 transition-colors"
        >
          Sign In
        </a>
      </div>
    );
  }

  // Inline encryption-status banner. Surfaces once the user is signed in and
  // their state is one of:
  //   not-set-up           → primary CTA opens SetupSecureDMs modal
  //   new-device-import    → link out to /social/profile/keys/ to import backup
  // Softens to a subtle reminder when the user has previously skipped.
  const renderEncryptionBanner = () => {
    if (!user) return null;
    if (encryptionStatus === 'ready' || encryptionStatus === 'unknown') return null;
    if (encryptionStatus === 'new-device-import-needed') {
      return (
        <div class="mb-4 p-4 rounded-xl border border-amber/40 bg-amber/5 flex items-start gap-3">
          <span class="text-amber text-lg leading-none mt-0.5" aria-hidden="true">⚠</span>
          <div class="flex-1">
            <div class="text-sm text-text font-medium mb-1">Your encryption key isn't on this device</div>
            <p class="text-xs text-text-dim leading-relaxed mb-2">
              You have a profile key but no private key locally — your past DMs can't be read until you import your backup.
            </p>
            <a href="/social/profile/keys/" class="text-xs text-gold border-b border-gold/30 hover:border-gold transition-colors">
              Import keys backup →
            </a>
          </div>
        </div>
      );
    }
    // not-set-up
    const soft = setupSkipped;
    return (
      <div class={`mb-4 p-4 rounded-xl border ${soft ? 'border-card-border bg-card-bg/60' : 'border-gold/40 bg-gold/5'} flex items-start gap-3`}>
        <span class={`text-lg leading-none mt-0.5 ${soft ? 'text-text-dim' : 'text-gold'}`} aria-hidden="true">{soft ? '✦' : '◊'}</span>
        <div class="flex-1">
          <div class="text-sm text-text font-medium mb-1">
            {soft ? 'Messages are unencrypted' : 'Set up secure DMs'}
          </div>
          <p class="text-xs text-text-dim leading-relaxed mb-2">
            {soft
              ? 'You opted out of end-to-end encryption. You can enable it any time.'
              : "End-to-end encrypt your messages so even FRQNCY's servers can't read them. Takes a few seconds."}
          </p>
          <button
            type="button"
            onClick={() => setShowSetupModal(true)}
            class={`text-xs ${soft ? 'text-gold/80 border-b border-gold/20 hover:border-gold/60' : 'text-gold border-b border-gold/40 hover:border-gold'} transition-colors`}
          >
            {soft ? 'Enable encryption →' : 'Set up secure DMs →'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
    {renderEncryptionBanner()}
    {showSetupModal && (
      <SetupSecureDMs
        isModal
        onComplete={() => {
          setShowSetupModal(false);
          setSetupSkipped(false);
        }}
        onCancel={() => {
          setShowSetupModal(false);
          // SetupSecureDMs writes SKIP_LS_KEY itself on the skip path; re-read.
          if (typeof window !== 'undefined') {
            setSetupSkipped(window.localStorage.getItem(DM_SETUP_SKIP_KEY) === '1');
          }
        }}
      />
    )}
    <div class="grid grid-cols-1 md:grid-cols-12 gap-0 rounded-xl border border-card-border overflow-hidden" style="min-height: 60vh;">
      {/* Conversations list */}
      <div class="md:col-span-4 bg-card-bg border-r border-card-border">
        <div class="p-4 border-b border-card-border space-y-2">
          {user && (
            <button
              type="button"
              onClick={() => setShowStartGroup(true)}
              class="w-full px-3 py-2 rounded-lg text-sm text-gold border border-gold/30 bg-gold/5 hover:bg-gold/15 transition-colors"
            >
              + Start group chat
            </button>
          )}
          <input
            type="search"
            placeholder="Search conversations..."
            class="w-full bg-navy-mid border border-card-border rounded-lg px-3 py-2 text-sm text-text placeholder-text-dim focus:outline-none focus:border-gold/40 transition-colors"
          />
        </div>

        {conversations.length === 0 ? (
          <div class="p-8 text-center">
            <p class="text-text-dim text-sm">No conversations yet.</p>
            <p class="text-text-dim text-xs mt-2 opacity-70">
              Start a conversation by visiting someone's profile.
            </p>
          </div>
        ) : (
          <ul class="divide-y divide-card-border">
            {conversations.map((c) => {
              const primary = c.others[0];
              const title = primary
                ? primary.display_name || primary.username
                : 'Conversation';
              const initial = title.charAt(0).toUpperCase();
              const active = selectedId === c.id;
              return (
                <li
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  class={`px-4 py-3 cursor-pointer transition-colors ${
                    active ? 'bg-navy-mid/50' : 'hover:bg-navy-mid/30'
                  }`}
                >
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm font-semibold shrink-0 overflow-hidden">
                      {primary?.avatar_url ? (
                        <img src={primary.avatar_url} alt={title} class="w-full h-full object-cover" />
                      ) : (
                        initial
                      )}
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between">
                        <p class="text-sm font-medium text-text truncate">{title}</p>
                        <span class="text-xs text-text-dim">{timeAgo(c.lastMessageAt)}</span>
                      </div>
                      <p class="text-xs text-text-dim truncate">
                        {c.lastMessage || 'No messages yet'}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Message pane */}
      <div class="md:col-span-8 bg-navy flex flex-col">
        {selectedId ? (
          <ChatWindow conversationId={selectedId} />
        ) : (
          <div class="flex-1 flex items-center justify-center">
            <div class="text-center py-16 px-6">
              <div class="w-16 h-16 rounded-full bg-card-bg border border-card-border flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-text-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <p class="text-text-dim text-sm">Select a conversation to view messages</p>
              <p class="text-text-dim text-xs mt-1 opacity-60">
                Your direct messages will appear here.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
    {showStartGroup && (
      <StartGroupConversation onClose={() => setShowStartGroup(false)} />
    )}
    </>
  );
}
