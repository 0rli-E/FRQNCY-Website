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
  const { messages, send, loading, error, isEncrypted, encryptionStatus } = useMessages(conversationId);
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
      {/* Encryption status banner */}
      <EncryptionBanner status={encryptionStatus} encrypted={isEncrypted} />
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
                    {g.messages.map((m) => {
                      const text = m._decrypted ?? m.content;
                      const failed = m._state === 'failed';
                      const hasMedia = !!m.encrypted_media_path;
                      const hasText = !!text;
                      return (
                        <div key={m.id} class="space-y-1">
                          {(hasText || failed) && (
                            <p
                              class={`text-sm leading-relaxed whitespace-pre-wrap break-words ${
                                failed ? 'italic text-text-dim' : 'text-text'
                              }`}
                            >
                              {failed
                                ? '[unable to decrypt — sent before this device had your key, or the key was lost]'
                                : text}
                              {m._state === 'decrypted' && (
                                <span class="inline-block ml-1.5 text-xs text-gold/60" title="end-to-end encrypted">
                                  ◊
                                </span>
                              )}
                            </p>
                          )}
                          {hasMedia && <EncryptedMedia message={m} />}
                        </div>
                      );
                    })}
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

interface EncryptionBannerProps {
  status: 'ready' | 'no-own-key' | 'recipient-no-key' | 'unknown';
  encrypted: boolean;
}

/**
 * Inline status strip above the message scroll area. Communicates whether
 * messages in this conversation are end-to-end encrypted, and what to do if
 * not.
 *
 * - ready: faint gold "end-to-end encrypted" line, no friction.
 * - no-own-key: amber "set up your encryption key" with a link to /social/profile/keys/.
 * - recipient-no-key: amber "this person hasn't set up encryption — your messages are stored as plaintext."
 * - unknown: render nothing (avoids flicker on first paint).
 */
function EncryptionBanner({ status, encrypted }: EncryptionBannerProps) {
  if (status === 'unknown') return null;
  if (status === 'ready' && encrypted) {
    return (
      <div class="border-b border-card-border bg-card-bg px-4 py-1.5 text-[11px] text-gold/70 flex items-center gap-1.5">
        <span class="text-gold">◊</span>
        <span>End-to-end encrypted · only you and the recipient can read these messages</span>
      </div>
    );
  }
  if (status === 'no-own-key') {
    return (
      <div class="border-b border-amber-500/20 bg-amber-500/5 px-4 py-2 text-xs text-amber-200/90">
        Your encryption key isn't set up on this device.{' '}
        <a href="/social/profile/keys/" class="underline hover:text-amber-100">
          Set it up
        </a>{' '}
        — until then, messages here are stored as plaintext (the server can read them).
      </div>
    );
  }
  if (status === 'recipient-no-key') {
    return (
      <div class="border-b border-amber-500/20 bg-amber-500/5 px-4 py-2 text-xs text-amber-200/90">
        This person hasn't set up encryption yet. Your messages are sent as plaintext until they do.
      </div>
    );
  }
  return null;
}

/**
 * Renders the decrypted attachment for a single message. The download +
 * decrypt is driven by `useMessages` — this component only consumes the
 * derived `_media_state` + `_decrypted_media_url`. Object URLs are owned and
 * revoked by `useMessages` on unmount, so we don't manage their lifetime
 * here (no useEffect-cleanup leak).
 *
 * States:
 *   pending   → small spinner placeholder.
 *   decrypted → <img> for image MIMEs, generic download link otherwise.
 *   failed    → italic "[unable to decrypt attachment]" placeholder.
 */
function EncryptedMedia({ message }: { message: MessageRow }) {
  const state = message._media_state;
  const url = message._decrypted_media_url;
  const mime = message.encrypted_media_mime || '';
  const isImage = mime.startsWith('image/');

  if (state === 'failed') {
    return (
      <p class="text-xs italic text-text-dim mt-1">
        [unable to decrypt attachment]
      </p>
    );
  }
  if (state === 'pending' || !url) {
    return (
      <div class="mt-1 flex items-center gap-2 text-xs text-text-dim">
        <span class="inline-block w-3 h-3 rounded-full border-2 border-gold/40 border-t-transparent animate-spin" />
        <span>Decrypting attachment…</span>
      </div>
    );
  }
  // state === 'decrypted'
  if (isImage) {
    return (
      <a href={url} target="_blank" rel="noreferrer" class="inline-block mt-1">
        <img
          src={url}
          alt="encrypted attachment"
          class="max-w-xs max-h-64 rounded-lg border border-card-border object-cover"
        />
      </a>
    );
  }
  // Non-image: generic download link.
  return (
    <a
      href={url}
      download
      class="inline-flex items-center gap-1.5 mt-1 text-xs text-gold/80 hover:text-gold underline"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="w-3.5 h-3.5"
      >
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      Download attachment
    </a>
  );
}
