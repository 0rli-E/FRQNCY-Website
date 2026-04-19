import { useEffect, useRef, useMemo } from 'preact/hooks';
import { useAuth } from './AuthProvider';
import { useMessages, type MessageRow } from '../lib/useMessages';
import MessageInput from './MessageInput';

interface ChatWindowProps {
  conversationId: string;
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
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString();
}

// Group consecutive messages by the same sender into runs.
// Each group starts with the sender header (avatar + name + time) and
// contains an ordered list of message rows.
interface MessageGroup {
  key: string;
  sender_id: string;
  sender: MessageRow['sender'];
  startedAt: string;
  messages: MessageRow[];
}

function groupMessages(messages: MessageRow[]): MessageGroup[] {
  const groups: MessageGroup[] = [];
  for (const m of messages) {
    const last = groups[groups.length - 1];
    if (last && last.sender_id === m.sender_id) {
      last.messages.push(m);
    } else {
      groups.push({
        key: m.id,
        sender_id: m.sender_id,
        sender: m.sender ?? null,
        startedAt: m.created_at,
        messages: [m],
      });
    }
  }
  return groups;
}

export default function ChatWindow({ conversationId }: ChatWindowProps) {
  const { user } = useAuth();
  const { messages, send, loading, error } = useMessages(conversationId);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const groups = useMemo(() => groupMessages(messages), [messages]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Defer to next tick so DOM has painted
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [messages.length, conversationId]);

  return (
    <div class="flex flex-col h-full min-h-[60vh] bg-navy">
      {/* Messages scroll area */}
      <div
        ref={scrollRef}
        class="flex-1 overflow-y-auto px-4 py-4 space-y-4"
      >
        {loading ? (
          <div class="flex items-center justify-center h-full">
            <p class="text-text-dim text-sm">Loading messages...</p>
          </div>
        ) : error ? (
          <div class="flex items-center justify-center h-full">
            <p class="text-red-400 text-sm">Failed to load messages: {error}</p>
          </div>
        ) : groups.length === 0 ? (
          <div class="flex items-center justify-center h-full">
            <p class="text-text-dim text-sm">No messages yet. Say hi.</p>
          </div>
        ) : (
          groups.map((g) => {
            const isSelf = user?.id === g.sender_id;
            const displayName =
              g.sender?.display_name || g.sender?.username || 'Unknown';
            const initial = displayName.charAt(0).toUpperCase();
            return (
              <div key={g.key} class="flex gap-3">
                {/* Avatar at head of group */}
                <div class="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-semibold shrink-0 overflow-hidden">
                  {g.sender?.avatar_url ? (
                    <img
                      src={g.sender.avatar_url}
                      alt={displayName}
                      class="w-full h-full object-cover"
                    />
                  ) : (
                    initial
                  )}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-baseline gap-2">
                    <span
                      class={`text-sm font-medium ${
                        isSelf ? 'text-gold' : 'text-text'
                      }`}
                    >
                      {displayName}
                    </span>
                    <span class="text-xs text-text-dim">
                      {timeAgo(g.startedAt)}
                    </span>
                  </div>
                  <div class="mt-1 space-y-1">
                    {g.messages.map((m) => (
                      <p
                        key={m.id}
                        class="text-sm text-text leading-relaxed whitespace-pre-wrap break-words"
                      >
                        {m.content}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Composer */}
      <MessageInput onSend={send} disabled={loading || !user} />
    </div>
  );
}
