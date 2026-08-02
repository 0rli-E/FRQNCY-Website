-- ============================================================================
-- 028_conversation_bootstrap_select.sql — make starting a DM possible at all
--
-- Pre-existing bug, not introduced by 025. Found while end-to-end testing the
-- moderation work against the live database.
--
-- StartConversationButton.tsx and StartGroupConversation.tsx both create a
-- thread with:
--
--     supabase.from('conversations').insert({}).select('id').single()
--
-- which PostgREST sends as INSERT ... RETURNING. PostgreSQL applies the SELECT
-- policy to the returned row, and conversations_select_member (migration 002)
-- is:
--
--     public.is_conversation_member(id, auth.uid())
--
-- A brand-new conversation has no members yet — the app inserts them on the
-- next call, using the id it is trying to read back here. So the read-back is
-- always denied and the client always sees
-- 42501 "new row violates row-level security policy", for a row that was in
-- fact created. Net effect: **starting a DM fails every time**, and has since
-- migration 002. It went unnoticed because NRG has had almost no real usage
-- and the messaging round-trip was never human-tested.
--
-- Verified against production: INSERT on conversations returns 201 on its own,
-- and 42501 the moment `Prefer: return=representation` is added.
--
-- Fix: let anyone read a conversation that has no members yet. That is the
-- same bootstrap window migration 025 already carved out for
-- conversation_members INSERT, and it discloses nothing — an empty
-- conversation row is an id and two timestamps, with no participants and no
-- messages attached. The instant the first member row lands, normal
-- membership rules resume.
--
-- conversation_is_empty() is the SECURITY DEFINER helper added by 025; a
-- policy on conversations may not sub-select conversation_members inline
-- without risking the recursion migration 002 exists to prevent.
--
-- Idempotent — safe to re-run.
-- ============================================================================

DROP POLICY IF EXISTS "conversations_select_member" ON public.conversations;
CREATE POLICY "conversations_select_member"
    ON public.conversations FOR SELECT
    USING (
        public.is_conversation_member(id, auth.uid())
        OR public.conversation_is_empty(id)
    );

COMMENT ON POLICY "conversations_select_member" ON public.conversations IS
    'Members can read their conversations. A conversation with no members yet is also readable, so the create-then-add-members flow can read back the id it just inserted — without this, starting a DM fails with 42501 every time.';
