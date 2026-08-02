-- ============================================================================
-- 026_private_groups.sql — the private half of the meeting place
--
-- Migration 023 shipped open groups and deliberately deferred private ones,
-- leaving this note on the posts policy:
--
--     posts RLS: the existing "posts_select_all USING (true)" policy stays
--     as-is. That's correct for OPEN groups [...] When private groups ship,
--     this policy must be tightened to:
--       group_id IS NULL OR <group is open> OR is_group_member(group_id)
--     and posting into a group must require membership.
--
-- This migration does exactly that, and adds the invite path a private group
-- needs in order to be joinable at all.
--
-- Nothing was leaking before this: no UI created private groups, so every
-- group in the table was open. But `visibility` accepted 'private' at the REST
-- layer, so anyone posting directly to the API could have made a group that
-- looked private and wasn't. That gap closes here.
--
-- Depends on 025 (is_blocked_between) — the posts SELECT policy composes the
-- block filter with group gating, and must carry both.
--
-- Idempotent — safe to re-run.
-- ============================================================================

-- ── 1. Invites ──────────────────────────────────────────────────────────────
-- A private group is joinable only by someone holding an invite. Any member
-- can invite (flat by design — no admin tier, no hierarchy of who counts).
CREATE TABLE IF NOT EXISTS public.group_invites (
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    invited_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (group_id, invited_user_id)
);

CREATE INDEX IF NOT EXISTS group_invites_user_idx
    ON public.group_invites (invited_user_id, created_at DESC);

-- SECURITY DEFINER, same reasoning as is_group_member in 023: this is read
-- from inside a group_members policy, and an inline sub-select on an
-- RLS-protected table from within a policy either recurses or silently
-- evaluates false.
CREATE OR REPLACE FUNCTION public.has_group_invite(_group_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.group_invites
         WHERE group_id = _group_id
           AND invited_user_id = _user_id
    );
$$;

ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS group_invites_select ON public.group_invites;
DROP POLICY IF EXISTS group_invites_insert_member ON public.group_invites;
DROP POLICY IF EXISTS group_invites_delete ON public.group_invites;

-- You see invites addressed to you, plus every invite into a group you're in.
CREATE POLICY group_invites_select ON public.group_invites FOR SELECT
    USING (
        invited_user_id = auth.uid()
        OR public.is_group_member(group_id)
    );

-- Only a member can invite, never across a block in either direction.
CREATE POLICY group_invites_insert_member ON public.group_invites FOR INSERT
    WITH CHECK (
        public.is_group_member(group_id)
        AND invited_by = auth.uid()
        AND NOT public.is_blocked_between(invited_user_id, auth.uid())
    );

-- Withdraw an invite you sent, or decline one addressed to you.
CREATE POLICY group_invites_delete ON public.group_invites FOR DELETE
    USING (invited_by = auth.uid() OR invited_user_id = auth.uid());

-- ── 2. Joining a private group requires an invite ───────────────────────────
-- 023's policy allowed self-join for OPEN groups only, so private groups were
-- simply unjoinable. Widen it by exactly one case: you hold an invite.
DROP POLICY IF EXISTS group_members_insert_self ON public.group_members;
CREATE POLICY group_members_insert_self ON public.group_members FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        AND (
            EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_id AND g.visibility = 'open')
            OR public.has_group_invite(group_id, auth.uid())
        )
    );

-- Creating a private group would otherwise leave you outside your own group:
-- groups_insert_own lets you create it, but nothing lets you join it. Add the
-- creator as the first member automatically.
CREATE OR REPLACE FUNCTION public.handle_group_creator_join()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.created_by IS NOT NULL THEN
        -- role 'admin' matches what createGroup() in social-src/src/lib/groups.ts
        -- has always upserted. That client upsert now no-ops (the row already
        -- exists by the time it runs, and it sends ON CONFLICT DO NOTHING), so
        -- the role has to be set correctly here or creators silently demote to
        -- 'member'.
        INSERT INTO public.group_members (group_id, user_id, role)
        VALUES (NEW.id, NEW.created_by, 'admin')
        ON CONFLICT DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_group_creator_join ON public.groups;
CREATE TRIGGER trg_group_creator_join
    AFTER INSERT ON public.groups
    FOR EACH ROW EXECUTE FUNCTION public.handle_group_creator_join();

-- ── 3. Posts: gate private-group posts on membership ────────────────────────
-- Replaces the policy 025 set, carrying its block filter forward verbatim and
-- adding the group condition. Both must hold.
--
--   group_id IS NULL  → an ordinary network post, public as before
--   open group        → public, same as the global feed
--   private group     → members only
--
-- Anonymous readers keep full access to the first two: auth.uid() is NULL,
-- is_blocked_between short-circuits false, is_group_member returns false, and
-- private posts are the only thing that disappears.
DROP POLICY IF EXISTS posts_select_all ON public.posts;
CREATE POLICY posts_select_all ON public.posts FOR SELECT
    USING (
        NOT public.is_blocked_between(author_id, auth.uid())
        AND (
            group_id IS NULL
            OR EXISTS (
                SELECT 1 FROM public.groups g
                 WHERE g.id = posts.group_id AND g.visibility = 'open'
            )
            OR public.is_group_member(group_id)
        )
    );

-- Posting into a group now requires being in it — for open groups too. Before
-- this, membership was a client-side courtesy: the API accepted a post with
-- any group_id from any authenticated user.
DROP POLICY IF EXISTS "posts_insert_own" ON public.posts;
CREATE POLICY "posts_insert_own" ON public.posts FOR INSERT
    WITH CHECK (
        auth.uid() = author_id
        AND (
            group_id IS NULL
            OR public.is_group_member(group_id)
        )
    );

-- ── 4. Lock down visibility transitions ─────────────────────────────────────
-- Flipping a group from private to open would retroactively publish every
-- post ever made in it, to everyone, with no notice to the people who wrote
-- them. Nobody consents to that at the time of writing. The reverse direction
-- (open → private) is merely useless — the posts were already public and are
-- mirrored, indexed and quotable. So: visibility is fixed at creation.
CREATE OR REPLACE FUNCTION public.forbid_group_visibility_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.visibility IS DISTINCT FROM OLD.visibility THEN
        RAISE EXCEPTION
            'A group''s visibility cannot be changed after creation. Flipping private → open would publish every past post without the authors ever agreeing to it. Create a new group instead.';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_group_visibility_immutable ON public.groups;
CREATE TRIGGER trg_group_visibility_immutable
    BEFORE UPDATE ON public.groups
    FOR EACH ROW EXECUTE FUNCTION public.forbid_group_visibility_change();

-- ── Comments ────────────────────────────────────────────────────────────────
COMMENT ON TABLE public.group_invites IS
    'Invites into private groups. Any member may invite (flat by design — no admin tier). Holding an invite is what makes group_members_insert_self succeed for a private group.';
COMMENT ON FUNCTION public.forbid_group_visibility_change() IS
    'Visibility is immutable after creation. private → open would retroactively publish every post in the group without author consent.';
