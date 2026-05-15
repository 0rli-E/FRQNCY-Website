-- Migration 011: Encrypted media attachments for DMs
--
-- Adds a private "dm-media" Supabase Storage bucket and a column on messages
-- that points at the encrypted blob path. The blob itself is encrypted client-
-- side (libsodium sealed boxes per recipient via encrypted-upload.ts), so the
-- bucket can be public-readable — the URL alone reveals nothing without keys.
--
-- We still set the bucket to PRIVATE for an extra layer of protection: only
-- authenticated users can fetch any blob, and RLS on storage.objects scopes
-- access to the message's conversation members.
--
-- Idempotent.

ALTER TABLE public.messages
    ADD COLUMN IF NOT EXISTS encrypted_media_path TEXT,
    ADD COLUMN IF NOT EXISTS encrypted_media_mime TEXT,
    ADD COLUMN IF NOT EXISTS encrypted_media_size BIGINT;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('dm-media', 'dm-media', false, 26214400, ARRAY['application/octet-stream'])
ON CONFLICT (id) DO NOTHING;

-- RLS: a member of the conversation that owns the message can read the blob.
-- The path convention is `<conversation_id>/<message_id>` so we can join.
-- Note: PostgreSQL does NOT support CREATE POLICY IF NOT EXISTS — use the
-- DROP-then-CREATE pattern for idempotency (matches migrations 002 + 018).
DROP POLICY IF EXISTS dm_media_select_member ON storage.objects;
CREATE POLICY dm_media_select_member
    ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'dm-media'
        AND EXISTS (
            SELECT 1 FROM public.conversation_members cm
            WHERE cm.user_id = auth.uid()
              AND cm.conversation_id::text = (storage.foldername(name))[1]
        )
    );

-- The sender can upload to a path under their conversation.
DROP POLICY IF EXISTS dm_media_insert_member ON storage.objects;
CREATE POLICY dm_media_insert_member
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'dm-media'
        AND EXISTS (
            SELECT 1 FROM public.conversation_members cm
            WHERE cm.user_id = auth.uid()
              AND cm.conversation_id::text = (storage.foldername(name))[1]
        )
    );

COMMENT ON COLUMN public.messages.encrypted_media_path IS
    'Path in the dm-media private Supabase Storage bucket. Format: <conversation_id>/<message_id>. The blob is libsodium sealed-box ciphertext (per-recipient envelope when conversation has 3+ members).';

COMMENT ON COLUMN public.messages.encrypted_media_mime IS
    'Original MIME type of the file (e.g. image/jpeg). Plaintext metadata — visible to admins who query the row.';

COMMENT ON COLUMN public.messages.encrypted_media_size IS
    'Original (pre-encryption) byte size of the file. Plaintext metadata.';
