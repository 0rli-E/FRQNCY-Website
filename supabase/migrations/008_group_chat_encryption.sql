-- Migration 008: per-recipient encrypted message bodies for group chats.
-- For 1:1 conversations the existing messages.encrypted_content + encryption_version=1
-- still works (no migration of historical rows). New 1:1 sends MAY use either path.
-- For 3+ member conversations, sender writes one row to messages (with NULL content
-- and NULL encrypted_content, encryption_version=2) and N rows to message_recipients.
-- Idempotent.

CREATE TABLE IF NOT EXISTS public.message_recipients (
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    encrypted_content TEXT NOT NULL,
    PRIMARY KEY (message_id, recipient_id)
);

CREATE INDEX IF NOT EXISTS idx_message_recipients_recipient
    ON public.message_recipients (recipient_id, message_id);

-- RLS: a recipient can SELECT only rows addressed to them. Senders can INSERT
-- (proven via the message they're sending). Nobody else.
ALTER TABLE public.message_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY message_recipients_select_own
    ON public.message_recipients
    FOR SELECT
    USING (recipient_id = auth.uid());

CREATE POLICY message_recipients_insert_via_message
    ON public.message_recipients
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.messages m
            WHERE m.id = message_id
              AND m.sender_id = auth.uid()
        )
    );

-- Bump encryption_version up to 2 to mean "look in message_recipients."
COMMENT ON COLUMN public.messages.encryption_version IS
    '0 = plaintext (legacy), 1 = libsodium sealed box in messages.encrypted_content (1:1 only), 2 = libsodium sealed box per-recipient in message_recipients table (group-chat capable).';
