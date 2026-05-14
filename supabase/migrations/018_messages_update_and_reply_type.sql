-- ============================================================================
-- 018_messages_update_and_reply_type.sql
-- Date: 2026-05-14
--
-- Two production-broken paths surfaced by audit:
--
--   1. messages has no UPDATE policy. useMessages.ts patches
--      encrypted_media_path after uploading the encrypted blob; RLS silently
--      denies the write so DM image/file attachments never get linked to the
--      message row. Add messages_update_own_member: sender can patch their
--      own message in a conversation they are still a member of.
--
--   2. notifications.type CHECK omits 'reply'. api.ts writes type='reply' for
--      threaded replies (comments with parent_id), and every such insert
--      silently fails. Extend the CHECK to include 'reply'.
--
-- Idempotent. Safe to run twice.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. messages — sender can UPDATE their own message
-- ----------------------------------------------------------------------------
-- Mirrors the existing messages_insert_member policy (migration 002): the
-- sender must own the row AND still be a member of the conversation. The
-- conversation-member check goes through the SECURITY DEFINER helper from
-- migration 002 to avoid recursion on conversation_members RLS.

DROP POLICY IF EXISTS "messages_update_own_member" ON public.messages;
CREATE POLICY "messages_update_own_member"
    ON public.messages FOR UPDATE
    USING (
        auth.uid() = sender_id
        AND public.is_conversation_member(conversation_id, auth.uid())
    )
    WITH CHECK (
        auth.uid() = sender_id
        AND public.is_conversation_member(conversation_id, auth.uid())
    );

-- ----------------------------------------------------------------------------
-- 2. notifications.type — add 'reply' to the allowed set
-- ----------------------------------------------------------------------------
-- The inline CHECK on the notifications.type column in migration 001 took
-- PostgreSQL's default name: notifications_type_check. Drop and re-add with
-- the extended set including 'reply' (threaded comment replies).

ALTER TABLE public.notifications
    DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
    ADD CONSTRAINT notifications_type_check
    CHECK (type IN (
        'like',
        'comment',
        'reply',
        'follow',
        'friend_request',
        'friend_accept',
        'mention',
        'message'
    ));
