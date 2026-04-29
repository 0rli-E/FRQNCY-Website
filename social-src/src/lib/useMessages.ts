import { useState, useEffect, useCallback, useRef } from 'preact/hooks';
import { supabase } from './supabase';
import { useAuth } from '../components/AuthProvider';
import {
  encryptToPublicKey,
  decryptFromSealedBox,
  loadPrivateKeyLocal,
} from './crypto';
import { encryptFileForRecipients, decryptFileWithOwnKey } from './encrypted-upload';

export interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  /** Plaintext content for legacy / unencrypted messages. NULL for encrypted rows. */
  content: string | null;
  /** Sealed-box ciphertext (base64) when encryption_version === 1 (1:1 only). NULL for v2 group rows. */
  encrypted_content?: string | null;
  /** 0 = plaintext (legacy), 1 = libsodium sealed box in encrypted_content (1:1), 2 = per-recipient sealed boxes in message_recipients (group-capable). */
  encryption_version?: number | null;
  media_url: string | null;
  created_at: string;
  sender?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
  /** Derived plaintext for rendering. Set by useMessages after decrypt. */
  _decrypted?: string | null;
  /** Renderer status — 'plaintext' | 'decrypted' | 'failed' | 'pending'. */
  _state?: 'plaintext' | 'decrypted' | 'failed' | 'pending';
  // ── encrypted media (v1.2) ──────────────────────────────────────────────
  /** Path in the dm-media bucket: `<conversation_id>/<message_id>`. NULL when no attachment. */
  encrypted_media_path?: string | null;
  /** Plaintext MIME type of the original file. */
  encrypted_media_mime?: string | null;
  /** Plaintext (pre-encryption) byte size of the original file. */
  encrypted_media_size?: number | null;
  /** Object URL produced after a successful download+decrypt; cleared on unmount. */
  _decrypted_media_url?: string | null;
  /** 'pending' | 'decrypted' | 'failed' — separate state for media. */
  _media_state?: 'pending' | 'decrypted' | 'failed';
}

interface UseMessagesResult {
  messages: MessageRow[];
  send: (content: string, attachment?: File) => Promise<void>;
  loading: boolean;
  error: string | null;
  /** True when this conversation can be encrypted end-to-end (all members have keys). */
  isEncrypted: boolean;
  /** Surfaces "your device is missing a key" / "recipient has no key yet" states. */
  encryptionStatus: 'ready' | 'no-own-key' | 'recipient-no-key' | 'unknown';
}

// ─────────────────────────────────────────────────────────────────────────────
// useMessages(conversationId) — encrypted-by-default with plaintext fallback.
//
// On send:
//   - 1:1 conversation (exactly one non-self member with a key):
//       encrypt with libsodium sealed box, write to messages.encrypted_content
//       with encryption_version=1 and content=NULL. (v1 path, unchanged.)
//   - Group conversation (2+ non-self members, all with keys):
//       encrypt N times — once per recipient pubkey. Insert the messages row
//       with content=NULL, encrypted_content=NULL, encryption_version=2,
//       then insert N rows into message_recipients (one per recipient).
//   - Any recipient missing a key → fall back to plaintext (encryption_version=0).
//     We refuse-to-partial-encrypt: if even one member lacks a key, the message
//     is sent plaintext rather than half-encrypted, and encryptionStatus surfaces
//     'recipient-no-key' so the sender sees the warning before sending.
//
// On receive:
//   - encryption_version=1: decrypt encrypted_content with own keypair (1:1 path).
//   - encryption_version=2: query message_recipients for the row addressed to
//     the current user, decrypt that ciphertext with own keypair (group path).
//   - encryption_version=0 (or null): treat content as legacy plaintext.
//   - Failed decrypts get _state='failed' and the renderer shows a placeholder.
//
// ChatWindow renders `m._decrypted ?? m.content` and inspects `m._state` for
// the failure UI.
// ─────────────────────────────────────────────────────────────────────────────
export function useMessages(conversationId: string | null): UseMessagesResult {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /**
   * Public keys for *all* non-self members of the conversation, keyed by user_id.
   * For a 1:1 chat this is a single entry; for a group chat, one per other member.
   * A member with no encryption_public_key is omitted from the map (their absence
   * is what triggers the 'recipient-no-key' encryption status).
   */
  const [recipientPubKeys, setRecipientPubKeys] = useState<Map<string, string>>(new Map());
  /** Total non-self member count, regardless of whether they have a key yet. */
  const [otherMemberCount, setOtherMemberCount] = useState(0);
  const [encStatus, setEncStatus] = useState<UseMessagesResult['encryptionStatus']>('unknown');

  const profileCacheRef = useRef<Record<string, MessageRow['sender']>>({});
  /**
   * Cache of decrypted media object URLs keyed by message.id. Persists across
   * re-renders so we don't re-download + re-decrypt the same blob on every
   * realtime update. Entries are revoked + cleared on unmount.
   */
  const mediaUrlCacheRef = useRef<Map<string, string>>(new Map());
  /** Set of message ids currently being downloaded/decrypted (in-flight guard). */
  const mediaInflightRef = useRef<Set<string>>(new Set());

  // Resolve every non-self member's public key for this conversation.
  useEffect(() => {
    if (!conversationId || !user) {
      setRecipientPubKeys(new Map());
      setOtherMemberCount(0);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data: members } = await supabase
        .from('conversation_members')
        .select('user_id')
        .eq('conversation_id', conversationId);
      if (cancelled || !members) return;

      const otherIds = (members as Array<{ user_id: string }>)
        .map((m) => m.user_id)
        .filter((id) => id !== user.id);
      if (otherIds.length === 0) {
        setRecipientPubKeys(new Map());
        setOtherMemberCount(0);
        return;
      }
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, encryption_public_key')
        .in('id', otherIds);
      if (cancelled) return;

      const map = new Map<string, string>();
      for (const p of (profs as Array<{ id: string; encryption_public_key: string | null }> | null) ?? []) {
        if (p.encryption_public_key) {
          map.set(p.id, p.encryption_public_key);
        }
      }
      setRecipientPubKeys(map);
      setOtherMemberCount(otherIds.length);
    })();
    return () => { cancelled = true; };
  }, [conversationId, user]);

  // Track encryption readiness for the UI banner. "Ready" requires every
  // non-self member to have a key — partial coverage in a group still surfaces
  // 'recipient-no-key' so the sender knows the message will go out plaintext.
  useEffect(() => {
    const ownPriv = loadPrivateKeyLocal();
    const ownPub = (profile as any)?.encryption_public_key as string | null | undefined;
    if (!ownPriv || !ownPub) {
      setEncStatus('no-own-key');
      return;
    }
    if (otherMemberCount === 0) {
      // No counterparts loaded yet (or empty conversation) — keep prior state
      // until membership resolves to avoid flickering the banner.
      setEncStatus('unknown');
      return;
    }
    if (recipientPubKeys.size < otherMemberCount) {
      setEncStatus('recipient-no-key');
      return;
    }
    setEncStatus('ready');
  }, [profile, recipientPubKeys, otherMemberCount]);

  // Decrypt a single row (idempotent). For v2 rows the per-recipient ciphertext
  // is fetched from message_recipients on demand. Returns the row with
  // _decrypted + _state populated.
  const decryptRow = useCallback(async (row: MessageRow): Promise<MessageRow> => {
    if (row._state) return row; // Already processed.

    const ownPriv = loadPrivateKeyLocal();
    const ownPub = (profile as any)?.encryption_public_key as string | null | undefined;

    // v1: sealed box in messages.encrypted_content (1:1).
    if (row.encryption_version === 1 && row.encrypted_content) {
      if (!ownPriv || !ownPub) {
        return { ...row, _state: 'failed', _decrypted: null };
      }
      const plaintext = await decryptFromSealedBox(row.encrypted_content, ownPub, ownPriv);
      return plaintext === null
        ? { ...row, _state: 'failed', _decrypted: null }
        : { ...row, _state: 'decrypted', _decrypted: plaintext };
    }

    // v2: per-recipient sealed boxes in message_recipients (group-capable).
    if (row.encryption_version === 2) {
      if (!ownPriv || !ownPub || !user) {
        return { ...row, _state: 'failed', _decrypted: null };
      }
      const { data: recipientRow } = await supabase
        .from('message_recipients')
        .select('encrypted_content')
        .eq('message_id', row.id)
        .eq('recipient_id', user.id)
        .maybeSingle();
      const ciphertext = (recipientRow as { encrypted_content: string } | null)?.encrypted_content;
      if (!ciphertext) {
        // No row addressed to this user. Either we're the sender (we won't
        // typically hit this path because send() short-circuits with the known
        // plaintext) or membership changed. Either way: can't decrypt.
        return { ...row, _state: 'failed', _decrypted: null };
      }
      const plaintext = await decryptFromSealedBox(ciphertext, ownPub, ownPriv);
      return plaintext === null
        ? { ...row, _state: 'failed', _decrypted: null }
        : { ...row, _state: 'decrypted', _decrypted: plaintext };
    }

    // Legacy plaintext or no-encryption row.
    return { ...row, _state: 'plaintext', _decrypted: row.content };
  }, [profile, user]);

  // Initial fetch + decrypt
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
          'id, conversation_id, sender_id, content, encrypted_content, encryption_version, media_url, encrypted_media_path, encrypted_media_mime, encrypted_media_size, created_at, sender:profiles!sender_id(id, username, display_name, avatar_url)'
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

      const rawRows = (data as any[] | null) || [];
      for (const r of rawRows) {
        if (r.sender) profileCacheRef.current[r.sender_id] = r.sender;
      }
      const decryptedRows = await Promise.all(rawRows.map((r) => decryptRow(r as MessageRow)));
      if (cancelled) return;
      setMessages(decryptedRows);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [conversationId, decryptRow]);

  // ── Encrypted media hydration ───────────────────────────────────────────
  // For every message with `encrypted_media_path` and no decrypted URL yet,
  // download the ciphertext blob from the dm-media bucket and decrypt it
  // with the user's own keypair. Runs whenever the messages list grows. The
  // mediaInflightRef set keeps us from kicking off duplicate downloads on
  // rapid re-renders. mediaUrlCacheRef survives across renders so an already-
  // decrypted attachment doesn't re-download on a new realtime row.
  useEffect(() => {
    const ownPriv = loadPrivateKeyLocal();
    const ownPub = (profile as any)?.encryption_public_key as string | null | undefined;
    if (!ownPriv || !ownPub) return;

    let cancelled = false;
    (async () => {
      for (const m of messages) {
        if (cancelled) return;
        if (!m.encrypted_media_path) continue;
        if (m._media_state === 'decrypted' && m._decrypted_media_url) continue;
        if (m._media_state === 'failed') continue;
        if (mediaInflightRef.current.has(m.id)) continue;
        // Already cached from a previous render — patch onto the row.
        const cached = mediaUrlCacheRef.current.get(m.id);
        if (cached) {
          setMessages((prev) =>
            prev.map((row) =>
              row.id === m.id
                ? { ...row, _decrypted_media_url: cached, _media_state: 'decrypted' }
                : row,
            ),
          );
          continue;
        }
        mediaInflightRef.current.add(m.id);
        // Mark as pending so the renderer shows a spinner.
        setMessages((prev) =>
          prev.map((row) => (row.id === m.id ? { ...row, _media_state: 'pending' } : row)),
        );
        try {
          const { data: blob, error: dlErr } = await (supabase.storage as any)
            .from('dm-media')
            .download(m.encrypted_media_path);
          if (dlErr || !blob) throw dlErr || new Error('empty download');
          const ciphertextB64 = await (blob as Blob).text();
          const decryptedBlob = await decryptFileWithOwnKey(ciphertextB64, ownPub, ownPriv);
          if (!decryptedBlob) throw new Error('decrypt failed');
          // Re-tag the blob with the original MIME so <img>/download links work
          // even on the raw single-recipient path (which didn't preserve mime).
          const mimedBlob = m.encrypted_media_mime
            ? new Blob([await decryptedBlob.arrayBuffer()], { type: m.encrypted_media_mime })
            : decryptedBlob;
          const objUrl = URL.createObjectURL(mimedBlob);
          mediaUrlCacheRef.current.set(m.id, objUrl);
          if (cancelled) {
            URL.revokeObjectURL(objUrl);
            return;
          }
          setMessages((prev) =>
            prev.map((row) =>
              row.id === m.id
                ? { ...row, _decrypted_media_url: objUrl, _media_state: 'decrypted' }
                : row,
            ),
          );
        } catch {
          if (cancelled) return;
          setMessages((prev) =>
            prev.map((row) => (row.id === m.id ? { ...row, _media_state: 'failed' } : row)),
          );
        } finally {
          mediaInflightRef.current.delete(m.id);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [messages, profile]);

  // Revoke all cached object URLs on unmount / conversation change to avoid
  // leaking detached Blobs in the renderer process.
  useEffect(() => {
    return () => {
      for (const url of mediaUrlCacheRef.current.values()) {
        URL.revokeObjectURL(url);
      }
      mediaUrlCacheRef.current.clear();
      mediaInflightRef.current.clear();
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
          let alreadyHave = false;
          setMessages((prev) => {
            alreadyHave = prev.some((m) => m.id === row.id);
            return prev;
          });
          if (alreadyHave) return;

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

          const decrypted = await decryptRow({ ...row, sender: sender ?? null });
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            return [...prev, decrypted];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, decryptRow]);

  const send = useCallback(
    async (content: string, attachment?: File) => {
      const trimmed = content.trim();
      // Allow attachment-only sends (no text body) so users can ship a photo
      // with no caption. At least one of {text, attachment} must be present.
      if (!user || !conversationId) return;
      if (!trimmed && !attachment) return;

      const ownPriv = loadPrivateKeyLocal();
      const ownPub = (profile as any)?.encryption_public_key as string | null | undefined;

      const recipientEntries = Array.from(recipientPubKeys.entries());
      const allRecipientsHaveKeys =
        otherMemberCount > 0 && recipientEntries.length === otherMemberCount;
      const canEncrypt = !!(ownPriv && ownPub && allRecipientsHaveKeys);

      // Decision branches:
      //   1. Group (2+ recipients) and all have keys → v2 path.
      //   2. 1:1 (exactly one recipient) and they have a key → v1 path.
      //   3. Anything else (recipient missing key, no own key) → plaintext.
      const useGroupPath = canEncrypt && recipientEntries.length >= 2;

      let insertPayload: Record<string, unknown> = {
        conversation_id: conversationId,
        sender_id: user.id,
      };

      // Stash original-file metadata now (plaintext columns) so the row reflects
      // an attachment from the moment it lands; the path column gets populated
      // after the actual upload completes.
      if (attachment) {
        insertPayload.encrypted_media_mime = attachment.type || 'application/octet-stream';
        insertPayload.encrypted_media_size = attachment.size;
      }

      // Pre-compute v2 ciphertexts BEFORE inserting the message row, so we can
      // fail fast on encryption errors without leaving an orphan messages row.
      // For attachment-only sends (empty text body) we skip the body-encryption
      // work entirely and just record the encryption_version so the renderer
      // knows the row is encrypted-class.
      let groupCiphertexts: Array<{ recipientId: string; ciphertext: string }> = [];
      if (useGroupPath) {
        if (trimmed) {
          groupCiphertexts = await Promise.all(
            recipientEntries.map(async ([recipientId, pubKey]) => ({
              recipientId,
              ciphertext: await encryptToPublicKey(trimmed, pubKey),
            })),
          );
        }
        insertPayload.encryption_version = 2;
        // content + encrypted_content stay null for v2.
      } else if (canEncrypt) {
        // 1:1 with key — v1 path, byte-identical to pre-1.1 behavior.
        if (trimmed) {
          const [, pubKey] = recipientEntries[0];
          const ciphertext = await encryptToPublicKey(trimmed, pubKey);
          insertPayload.encrypted_content = ciphertext;
        }
        insertPayload.encryption_version = 1;
      } else {
        // Recipient(s) missing a key, or own key missing — fall back to plaintext.
        if (trimmed) insertPayload.content = trimmed;
        insertPayload.encryption_version = 0;
      }

      const { data, error: insertErr } = await supabase
        .from('messages')
        .insert(insertPayload)
        .select(
          'id, conversation_id, sender_id, content, encrypted_content, encryption_version, media_url, encrypted_media_path, encrypted_media_mime, encrypted_media_size, created_at, sender:profiles!sender_id(id, username, display_name, avatar_url)'
        )
        .single();

      if (insertErr) {
        setError(insertErr.message);
        throw insertErr;
      }

      if (!data) return;
      const row = data as any as MessageRow;

      if (row.sender) profileCacheRef.current[row.sender_id] = row.sender;

      // ── Encrypted media upload (post-insert) ─────────────────────────────
      // We insert first, get a real message_id, then encrypt the file to all
      // members' pubkeys (plus our own — we want to be able to read our own
      // attachment on a future device) and upload to
      // `dm-media/<conversation_id>/<message_id>`. On success we UPDATE the
      // row with `encrypted_media_path`. If anything in this block fails the
      // text part of the message is already delivered — the attachment just
      // doesn't show up. This is intentional: text reliability > media.
      let mediaPath: string | null = null;
      let optimisticMediaUrl: string | null = null;
      let mediaState: 'pending' | 'decrypted' | 'failed' | undefined = undefined;
      if (attachment) {
        mediaState = 'failed'; // pessimistic default; flipped to 'decrypted' on success
        try {
          // Build the recipient set for the envelope. Always include the
          // sender's own pubkey so they can decrypt their own message later
          // on a new device. Skip recipients who have no key (we already fell
          // back to plaintext text content for those, so the attachment
          // following the same policy is consistent).
          const envelopeRecipients = new Set<string>();
          if (ownPub) envelopeRecipients.add(ownPub);
          for (const [, pk] of recipientEntries) envelopeRecipients.add(pk);
          if (envelopeRecipients.size === 0) {
            throw new Error('No recipient keys available for media encryption');
          }
          const { ciphertextB64 } = await encryptFileForRecipients(
            attachment,
            Array.from(envelopeRecipients),
          );
          // The base64 ciphertext IS what we upload — keep it as text/octet-stream.
          // Storage cost: ~1.33x file size (base64 expansion). Acceptable for v1;
          // when files get larger we can switch to uploading raw bytes.
          const blob = new Blob([ciphertextB64], { type: 'application/octet-stream' });
          mediaPath = `${conversationId}/${row.id}`;
          const { error: uploadErr } = await (supabase.storage as any)
            .from('dm-media')
            .upload(mediaPath, blob, {
              contentType: 'application/octet-stream',
              upsert: false,
            });
          if (uploadErr) throw uploadErr;

          // Persist the path. If this UPDATE fails we still leave the blob
          // (the next reconciler can adopt orphans, or it expires unused).
          const { error: updateErr } = await supabase
            .from('messages')
            .update({ encrypted_media_path: mediaPath })
            .eq('id', row.id);
          if (updateErr) throw updateErr;

          // Optimistic local URL — we already have the plaintext file in hand,
          // skip the round-trip-and-decrypt by caching the original blob.
          optimisticMediaUrl = URL.createObjectURL(attachment);
          mediaUrlCacheRef.current.set(row.id, optimisticMediaUrl);
          mediaState = 'decrypted';
          row.encrypted_media_path = mediaPath;
        } catch (mediaErr: any) {
          // Surface but don't throw — text part already shipped successfully.
          setError(mediaErr?.message || 'Media upload failed');
        }
      }

      // For v2 group sends, fan out the per-recipient ciphertexts now that we
      // have the message_id from the insert. Skipped when there's no text body
      // (attachment-only group send) — there's nothing to fan out.
      if (useGroupPath && groupCiphertexts.length > 0) {
        const recipientRows = groupCiphertexts.map(({ recipientId, ciphertext }) => ({
          message_id: row.id,
          recipient_id: recipientId,
          encrypted_content: ciphertext,
        }));
        const { error: fanoutErr } = await supabase
          .from('message_recipients')
          .insert(recipientRows);
        if (fanoutErr) {
          setError(fanoutErr.message);
          throw fanoutErr;
        }
      }

      // We just sent it, so we know the plaintext — short-circuit decryption.
      const baseDecrypted: MessageRow = canEncrypt
        ? { ...row, _state: 'decrypted', _decrypted: trimmed || null }
        : { ...row, _state: 'plaintext', _decrypted: trimmed || null };
      const decrypted: MessageRow = attachment
        ? {
            ...baseDecrypted,
            _media_state: mediaState,
            _decrypted_media_url: optimisticMediaUrl,
          }
        : baseDecrypted;
      setMessages((prev) => {
        if (prev.some((m) => m.id === row.id)) return prev;
        return [...prev, decrypted];
      });
    },
    [user, profile, conversationId, recipientPubKeys, otherMemberCount]
  );

  return {
    messages,
    send,
    loading,
    error,
    isEncrypted: encStatus === 'ready',
    encryptionStatus: encStatus,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TODO (vitest not yet configured in social-src — wire these up when it is):
//
//   • single recipient with key:
//       send('hi') → messages row has encrypted_content set, encryption_version=1,
//       no message_recipients rows written. (v1 path, backward-compatible.)
//
//   • two recipients with keys (group):
//       send('hi') → messages row has content=NULL, encrypted_content=NULL,
//       encryption_version=2; message_recipients has exactly 2 rows, one per
//       recipient_id, each ciphertext distinct (different ephemeral keys).
//
//   • five recipients with keys (group):
//       send('hi') → 5 message_recipients rows, each decryptable only by the
//       matching recipient's private key.
//
//   • decrypt of v1 row:
//       fetch returns encryption_version=1 + encrypted_content → decryptRow
//       calls decryptFromSealedBox(encrypted_content) and sets _decrypted.
//
//   • decrypt of v2 row:
//       fetch returns encryption_version=2 → decryptRow does a follow-up query
//       to message_recipients filtered on (message_id, current user_id) and
//       decrypts the ciphertext from there.
//
//   • recipient with no key (group):
//       any non-self member missing encryption_public_key → encryptionStatus
//       flips to 'recipient-no-key' AND send() falls back to plaintext for
//       everyone. Documented choice: refuse partial encryption — better the
//       sender sees plaintext-warning UI than ship a half-encrypted group send
//       where some members read ciphertext placeholders and others read clear.
//
//   • own key missing:
//       encryptionStatus = 'no-own-key', send() writes plaintext, decryptRow
//       returns _state='failed' for any encrypted row.
//
//   • realtime v2 INSERT:
//       channel fires for a v2 row from another sender → decryptRow fetches
//       from message_recipients addressed to current user, decrypts, appends
//       to messages list with _state='decrypted'.
// ─────────────────────────────────────────────────────────────────────────────
