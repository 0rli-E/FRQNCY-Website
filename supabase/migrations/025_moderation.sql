-- ============================================================================
-- 025_moderation.sql — NRG moderation v1
--
-- Before this migration NRG had no moderation surface of any kind: no block,
-- no report, no mute, in the schema or the UI. That is the named gap in
-- proposals/NRG-GO-LIVE-CHECKLIST-2026-05-16.md standing between NRG and its
-- first 100 users. A meeting place needs an exit door.
--
-- What lands here:
--   1. blocks   — mutual, silent, symmetric-effect user blocking
--   2. reports  — a durable record of "this needs a human look"
--   3. posts SELECT gated on blocks (server-side, not a client filter)
--   4. DM insert gated on blocks
--   5. closes an unrelated hole in conversation_members INSERT (see §5)
--
-- Deliberately NOT here, per editorial values: no karma penalty, no strike
-- count, no public shaming surface, no ranking of people. Blocking is a
-- private boundary, not a verdict.
--
-- Idempotent — safe to re-run.
-- ============================================================================

-- ── 1. blocks ───────────────────────────────────────────────────────────────
-- Silent by design: the blocked party is never told and cannot read the row.
-- Effect is symmetric even though the row is directional — see is_blocked_between.
CREATE TABLE IF NOT EXISTS public.blocks (
    blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (blocker_id, blocked_id),
    CHECK (blocker_id <> blocked_id)
);

-- Reverse-direction index: the hot lookup is "did anyone block me?", which
-- leads with blocked_id. The PK already covers the (blocker_id, ...) direction.
CREATE INDEX IF NOT EXISTS blocks_blocked_id_idx
    ON public.blocks (blocked_id, blocker_id);

-- SECURITY DEFINER because it must see block rows in BOTH directions, while
-- RLS deliberately lets you read only your own. Without DEFINER a blocked user
-- could still see the blocker's posts — the policy would silently filter to
-- nothing readable and evaluate false. Same trap migration 023 hit with the
-- member_count trigger: a helper consulted from a policy must not itself be
-- subject to that policy.
CREATE OR REPLACE FUNCTION public.is_blocked_between(_a UUID, _b UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT CASE
        WHEN _a IS NULL OR _b IS NULL OR _a = _b THEN false
        ELSE EXISTS (
            SELECT 1 FROM public.blocks
             WHERE (blocker_id = _a AND blocked_id = _b)
                OR (blocker_id = _b AND blocked_id = _a)
        )
    END;
$$;

ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS blocks_select_own ON public.blocks;
DROP POLICY IF EXISTS blocks_insert_own ON public.blocks;
DROP POLICY IF EXISTS blocks_delete_own ON public.blocks;

-- Only the blocker sees the row. The blocked party must not be able to detect
-- the block by querying — that is what makes it safe to use.
CREATE POLICY blocks_select_own ON public.blocks FOR SELECT
    USING (blocker_id = auth.uid());
CREATE POLICY blocks_insert_own ON public.blocks FOR INSERT
    WITH CHECK (blocker_id = auth.uid());
CREATE POLICY blocks_delete_own ON public.blocks FOR DELETE
    USING (blocker_id = auth.uid());

-- ── 2. reports ──────────────────────────────────────────────────────────────
-- A report is a signal to a human, not an automated action. Nothing in this
-- schema hides content on its own — no auto-removal on N reports, which is
-- trivially weaponised. Review happens out-of-band via the service role.
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL CHECK (target_type IN ('post', 'profile', 'comment', 'message', 'group')),
    target_id UUID NOT NULL,
    reason TEXT NOT NULL CHECK (reason IN (
        'spam',
        'harassment',
        'hate',
        'violence',
        'sexual_content',
        'self_harm',
        'impersonation',
        'misinformation',
        'other'
    )),
    detail TEXT CHECK (detail IS NULL OR length(detail) <= 1000),
    status TEXT NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'reviewing', 'actioned', 'dismissed')),
    created_at TIMESTAMPTZ DEFAULT now(),
    reviewed_at TIMESTAMPTZ,
    reviewer_note TEXT,
    -- One open report per person per thing. Re-reporting the same target is a
    -- no-op rather than a way to manufacture volume.
    UNIQUE (reporter_id, target_type, target_id)
);

CREATE INDEX IF NOT EXISTS reports_status_idx
    ON public.reports (status, created_at DESC);
CREATE INDEX IF NOT EXISTS reports_target_idx
    ON public.reports (target_type, target_id);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reports_select_own ON public.reports;
DROP POLICY IF EXISTS reports_insert_own ON public.reports;

-- You can see what you reported (so the UI can say "you reported this") and
-- nothing else. There is no admin role in this schema yet, so triage is done
-- with the service role key, which bypasses RLS. When a reviewer role lands,
-- add a policy here rather than widening this one.
CREATE POLICY reports_select_own ON public.reports FOR SELECT
    USING (reporter_id = auth.uid());
CREATE POLICY reports_insert_own ON public.reports FOR INSERT
    WITH CHECK (reporter_id = auth.uid());
-- No UPDATE/DELETE policy: a reporter cannot alter or withdraw a filed report,
-- and cannot move it out of 'open'. Status transitions are service-role only.

-- ── 3. posts: hide blocked people's posts, in both directions ───────────────
-- Enforced in RLS rather than by filtering in the client, so a block holds for
-- every read path — feed, group, profile, permalink, search, /api/export —
-- including paths written later that forget to filter.
--
-- Anonymous readers are unaffected: auth.uid() is NULL, is_blocked_between
-- short-circuits to false, and the public feed stays fully public.
--
-- NOTE: migration 026 replaces this same policy to add private-group gating.
-- The two conditions compose; 026 carries this block clause forward verbatim.
DROP POLICY IF EXISTS posts_select_all ON public.posts;
CREATE POLICY posts_select_all ON public.posts FOR SELECT
    USING ( NOT public.is_blocked_between(author_id, auth.uid()) );

-- ── 4. DMs: a block closes the channel ──────────────────────────────────────
-- Returns true when the sender is blocked by (or has blocked) anyone else in
-- the conversation. SECURITY DEFINER for the same reason as above.
CREATE OR REPLACE FUNCTION public.conversation_has_block(_conversation_id UUID, _sender UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
          FROM public.conversation_members m
          JOIN public.blocks b
            ON (b.blocker_id = m.user_id AND b.blocked_id = _sender)
            OR (b.blocker_id = _sender  AND b.blocked_id = m.user_id)
         WHERE m.conversation_id = _conversation_id
           AND m.user_id <> _sender
    );
$$;

DROP POLICY IF EXISTS "messages_insert_member" ON public.messages;
CREATE POLICY "messages_insert_member"
    ON public.messages FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id
        AND public.is_conversation_member(conversation_id, auth.uid())
        AND NOT public.conversation_has_block(conversation_id, auth.uid())
    );

-- Existing history stays readable to both sides. Blocking stops what comes
-- next; it does not rewrite what was already said, and silently vanishing a
-- thread someone may need as a record would be its own harm.

-- ── 5. Close the conversation_members INSERT hole ───────────────────────────
-- Pre-existing, found while wiring §4. Migration 002 left this policy as
-- `WITH CHECK (auth.uid() IS NOT NULL)`, with a comment noting it should be
-- narrowed "once the messages composer flow is finalized". It never was.
--
-- As written, ANY authenticated user could insert (any conversation_id, self)
-- and thereby become a member of a conversation they were never part of —
-- which then satisfies messages_select_member and messages_insert_member. So
-- they could read every message row in a stranger's DM thread and post into
-- it. E2EE limits the damage (message bodies are sealed per recipient, so an
-- intruder gets ciphertext they hold no key for) but the metadata — who talks
-- to whom, how often, when — was fully exposed, and injection was possible.
--
-- New rule: you may add a row only if you are already a member of that
-- conversation (the invite path), or the conversation has no members at all
-- (the bootstrap path, a window that exists only between creating a
-- conversation row and adding its first member). Plus: no adding someone
-- across a block, in either direction.
--
-- Both membership tests must route through SECURITY DEFINER helpers. A policy
-- ON conversation_members that sub-selects conversation_members inline would
-- recurse — precisely the failure migration 002 exists to fix.
CREATE OR REPLACE FUNCTION public.conversation_is_empty(_conversation_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT NOT EXISTS (
        SELECT 1 FROM public.conversation_members
         WHERE conversation_id = _conversation_id
    );
$$;

DROP POLICY IF EXISTS "conversation_members_insert_self" ON public.conversation_members;
DROP POLICY IF EXISTS "conversation_members_insert_auth" ON public.conversation_members;
DROP POLICY IF EXISTS "conversation_members_insert_member_or_bootstrap" ON public.conversation_members;
CREATE POLICY "conversation_members_insert_member_or_bootstrap"
    ON public.conversation_members FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND (
            public.is_conversation_member(conversation_id, auth.uid())
            OR public.conversation_is_empty(conversation_id)
        )
        AND NOT public.is_blocked_between(user_id, auth.uid())
    );

-- ── Comments ────────────────────────────────────────────────────────────────
COMMENT ON TABLE public.blocks IS
    'Silent, symmetric-effect user blocks. The blocked party cannot read the row or detect the block. Enforced in RLS on posts + messages via is_blocked_between, so it holds on every read path rather than relying on client filtering. No karma effect, no public signal — a private boundary, not a verdict.';
COMMENT ON TABLE public.reports IS
    'Moderation reports awaiting human review. Nothing here auto-hides content: N reports do not remove a post, because that is trivially weaponised. Reporters see only their own rows; triage runs with the service role until a reviewer role exists.';
COMMENT ON FUNCTION public.is_blocked_between(UUID, UUID) IS
    'True when either user has blocked the other. SECURITY DEFINER: it must see both directions while RLS shows each user only their own block rows.';
