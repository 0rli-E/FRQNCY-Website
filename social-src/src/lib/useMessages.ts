import { useState, useEffect, useCallback, useRef } from 'preact/hooks';
import { supabase } from './supabase';
import { useAuth } from '../components/AuthProvider';

export interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  media_url: string | null;
  created_at: string;
  sender?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
}

interface UseMessagesResult {
  messages: MessageRow[];
  send: (content: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// useMessages(conversationId)
//
// - Initial fetch of messages (oldest → newest) joined with sender profile.
// - Subscribes to realtime INSERTs on `messages` filtered by conversation_id.
//   When a new row arrives we hydrate the sender profile if we don't already
//   have it cached, then append.
// - Exposes a stable send(content) which inserts into `messages` as the
//   current user. We rely on the realtime channel to surface our own message,
//   but if realtime is slow we also append optimistically and de-dupe by id.
// ─────────────────────────────────────────────────────────────────────────────
export function useMessages(conversationId: string | null): UseMessagesResult {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cache sender profiles so we don't refetch the same one for each message
  const profileCacheRef = useRef<Record<string, MessageRow['sender']>>({});

  // Initial fetch
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      const { data, error: fetchErr } = await supabase
        .from('messages')
        .select(
          'id, conversation_id, sender_id, content, media_url, created_at, sender:profiles!sender_id(id, username, display_name, avatar_url)'
        )
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (cancelled) return;

      if (fetchErr) {
        setError(fetchErr.message);
        setMessages([]);
        setLoading(false);
        return;
      }

      const rows = (data as any[] | null) || [];
      // Warm the profile cache from initial fetch
      for (const r of rows) {
        if (r.sender) profileCacheRef.current[r.sender_id] = r.sender;
      }
      setMessages(rows as MessageRow[]);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  // Realtime subscription
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel('msgs-' + conversationId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const row = payload.new as MessageRow;
          // De-dupe in case the optimistic insert beat us here
          let alreadyHave = false;
          setMessages((prev) => {
            alreadyHave = prev.some((m) => m.id === row.id);
            return prev;
          });
          if (alreadyHave) return;

          // Hydrate sender from cache if available, otherwise fetch it
          let sender = profileCacheRef.current[row.sender_id];
          if (!sender) {
            const { data: prof } = await supabase
              .from('profiles')
              .select('id, username, display_name, avatar_url')
              .eq('id', row.sender_id)
              .maybeSingle();
            if (prof) {
              sender = prof as MessageRow['sender'];
              profileCacheRef.current[row.sender_id] = sender;
            }
          }

          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            return [...prev, { ...row, sender: sender ?? null }];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const send = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || !user || !conversationId) return;

      const { data, error: insertErr } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: trimmed,
        })
        .select(
          'id, conversation_id, sender_id, content, media_url, created_at, sender:profiles!sender_id(id, username, display_name, avatar_url)'
        )
        .single();

      if (insertErr) {
        setError(insertErr.message);
        throw insertErr;
      }

      if (data) {
        const row = data as any as MessageRow;
        if (row.sender) profileCacheRef.current[row.sender_id] = row.sender;
        // Optimistic append; realtime will be de-duped by id.
        setMessages((prev) => {
          if (prev.some((m) => m.id === row.id)) return prev;
          return [...prev, row];
        });
      }
    },
    [user, conversationId]
  );

  return { messages, send, loading, error };
}
