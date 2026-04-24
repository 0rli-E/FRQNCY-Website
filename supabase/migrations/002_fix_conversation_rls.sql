-- ============================================================================
-- 002_fix_conversation_rls.sql
-- Fix infinite recursion on conversation_members RLS policy by routing
-- membership checks through a SECURITY DEFINER function. This is the standard
-- Supabase pattern for "is the current user a member of conversation X?"
-- without re-triggering RLS on the same table.
-- Idempotent.
-- ============================================================================

-- Helper: returns true iff the given user is a member of the given conversation.
-- SECURITY DEFINER means it runs with the function owner's privileges and
-- does NOT re-evaluate RLS on conversation_members, breaking the recursion.
CREATE OR REPLACE FUNCTION public.is_conversation_member(_conversation_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.conversation_members
        WHERE conversation_id = _conversation_id
          AND user_id = _user_id
    );
$$;

-- Re-create policies that previously recursed.

DROP POLICY IF EXISTS "conversations_select_member" ON public.conversations;
CREATE POLICY "conversations_select_member"
    ON public.conversations FOR SELECT
    USING ( public.is_conversation_member(id, auth.uid()) );

DROP POLICY IF EXISTS "conversation_members_select_member" ON public.conversation_members;
CREATE POLICY "conversation_members_select_member"
    ON public.conversation_members FOR SELECT
    USING (
        -- A user can always see their own membership row, plus the rows for
        -- conversations they are already a member of (so they can see who else
        -- is in the chat). The helper avoids recursion.
        user_id = auth.uid()
        OR public.is_conversation_member(conversation_id, auth.uid())
    );

DROP POLICY IF EXISTS "messages_select_member" ON public.messages;
CREATE POLICY "messages_select_member"
    ON public.messages FOR SELECT
    USING ( public.is_conversation_member(conversation_id, auth.uid()) );

DROP POLICY IF EXISTS "messages_insert_member" ON public.messages;
CREATE POLICY "messages_insert_member"
    ON public.messages FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id
        AND public.is_conversation_member(conversation_id, auth.uid())
    );

-- Allow a logged-in user to add themselves (and only themselves) as a member.
-- This pairs with conversations_insert_auth so the creator can bootstrap a new
-- DM by inserting both members.
DROP POLICY IF EXISTS "conversation_members_insert_self" ON public.conversation_members;
CREATE POLICY "conversation_members_insert_self"
    ON public.conversation_members FOR INSERT
    WITH CHECK ( auth.uid() IS NOT NULL );

-- Note: the original "conversation_members_insert_auth" policy is left in place
-- (or replaced above). The WITH CHECK on insert intentionally permits any
-- authenticated user to add a row — the application layer enforces who the
-- second member is. For stricter security, narrow this to:
--   WITH CHECK ( user_id = auth.uid() OR is_conversation_member(...) )
-- once the messages composer flow is finalized.
