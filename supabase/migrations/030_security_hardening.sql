-- ============================================================================
-- 030 — Security hardening (2026-10-23 audit)
-- ============================================================================
-- Closes RLS gaps found in a full read of 001–029. Every policy below REPLACES
-- the only permissive policy for its command on that table (checked against
-- the final policy set), so nothing older still ORs the old rule back in.
--
--   1. practice_scores ran as its owner (no security_invoker) → every user's
--      practice + mood stats were readable by anyone, logged out included.
--   2. comments / likes were USING (true) → private-group (026) comments and
--      likes leaked, and anyone could comment on / like a private post.
--      They now inherit post visibility through posts' own RLS.
--   3. posts_update_own didn't re-check group membership on UPDATE, so a post
--      could be moved into a group its author isn't in.
--   4. notifications insert only required a login → anyone could forge a
--      notification "from" anyone to anyone.
--   5. ref_signups insert let a throwaway account mark itself became_member
--      and point at any referrer → reward / founder-badge fraud.
--   6. Empty conversations were readable/joinable by anyone, so a stranger
--      could slip into a DM mid-bootstrap. Bootstrap is now creator-only.
--   7. Low: self-assigned group admin role; teacher badge kept on edit;
--      vbrtn message into someone else's thread; friendships between two
--      other people; anon INSERT on subscribers / analytics_events (only
--      service-role functions write those).
--   8. Clients could edit their own counters / badges (karma, follower
--      counts, founder_badge, likes_count…). Frozen for anon/authenticated;
--      the SECURITY DEFINER count triggers and service_role still write.
--
-- Idempotent — safe to re-run.
-- ============================================================================

-- ── 1. practice_scores honours practice_logs RLS ────────────────────────────
ALTER VIEW public.practice_scores SET (security_invoker = true);

-- ── 2. comments + likes inherit post visibility ─────────────────────────────
DROP POLICY IF EXISTS "comments_select_all" ON public.comments;
DROP POLICY IF EXISTS comments_select_visible ON public.comments;
CREATE POLICY comments_select_visible ON public.comments FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = comments.post_id));

DROP POLICY IF EXISTS "comments_insert_auth" ON public.comments;
CREATE POLICY "comments_insert_auth" ON public.comments FOR INSERT
    WITH CHECK (
        auth.uid() = author_id
        AND EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id)
    );

DROP POLICY IF EXISTS "likes_select_all" ON public.likes;
DROP POLICY IF EXISTS likes_select_visible ON public.likes;
CREATE POLICY likes_select_visible ON public.likes FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = likes.post_id));

DROP POLICY IF EXISTS "likes_insert_own" ON public.likes;
CREATE POLICY "likes_insert_own" ON public.likes FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id)
    );

-- ── 3. moving a post into a group requires membership ───────────────────────
DROP POLICY IF EXISTS "posts_update_own" ON public.posts;
CREATE POLICY "posts_update_own" ON public.posts FOR UPDATE
    USING (auth.uid() = author_id)
    WITH CHECK (
        auth.uid() = author_id
        AND (group_id IS NULL OR public.is_group_member(group_id))
    );

-- ── 4. notifications come from the signed-in actor only ─────────────────────
DROP POLICY IF EXISTS "notifications_insert_auth" ON public.notifications;
DROP POLICY IF EXISTS notifications_insert_actor ON public.notifications;
CREATE POLICY notifications_insert_actor ON public.notifications FOR INSERT
    WITH CHECK (
        actor_id = auth.uid()
        AND NOT public.is_blocked_between(target_user_id, auth.uid())
    );

-- ── 5. referral attribution can't be self-promoted ──────────────────────────
-- became_member is flipped only by the Stripe webhook (service_role).
DROP POLICY IF EXISTS ref_signups_insert_self ON public.ref_signups;
CREATE POLICY ref_signups_insert_self ON public.ref_signups FOR INSERT
    WITH CHECK (
        referred_id = auth.uid()
        AND became_member = false
        AND referrer_id <> auth.uid()
        AND referrer_id = (SELECT rc.owner_id FROM public.ref_codes rc WHERE rc.code = ref_code)
    );

-- ── 6. DM bootstrap belongs to the conversation's creator ───────────────────
-- The client inserts `{}` then both members in ONE statement; the default
-- fills created_by, and conversation_is_empty() is still true for both rows
-- under the statement snapshot, so that flow keeps working.
ALTER TABLE public.conversations
    ADD COLUMN IF NOT EXISTS created_by UUID DEFAULT auth.uid()
    REFERENCES public.profiles(id) ON DELETE SET NULL;

DROP POLICY IF EXISTS "conversations_insert_auth" ON public.conversations;
CREATE POLICY "conversations_insert_auth" ON public.conversations FOR INSERT
    WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "conversations_select_member" ON public.conversations;
CREATE POLICY "conversations_select_member" ON public.conversations FOR SELECT
    USING (
        public.is_conversation_member(id, auth.uid())
        OR (created_by = auth.uid() AND public.conversation_is_empty(id))
    );

DROP POLICY IF EXISTS "conversation_members_insert_member_or_bootstrap" ON public.conversation_members;
CREATE POLICY "conversation_members_insert_member_or_bootstrap"
    ON public.conversation_members FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND (
            public.is_conversation_member(conversation_id, auth.uid())
            OR (
                public.conversation_is_empty(conversation_id)
                AND EXISTS (SELECT 1 FROM public.conversations c
                             WHERE c.id = conversation_id AND c.created_by = auth.uid())
            )
        )
        AND NOT public.is_blocked_between(user_id, auth.uid())
    );

-- ── 7. low-severity tightenings ─────────────────────────────────────────────
-- Joining is as 026, plus: only a group's creator may hold role 'admin'.
DROP POLICY IF EXISTS group_members_insert_self ON public.group_members;
CREATE POLICY group_members_insert_self ON public.group_members FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        AND (
            role = 'member'
            OR EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_id AND g.created_by = auth.uid())
        )
        AND (
            EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_id AND g.visibility = 'open')
            OR public.has_group_invite(group_id, auth.uid())
        )
    );

-- Re-stamp is_teacher on edit too, so an author can't flip it after insert.
DROP TRIGGER IF EXISTS trg_cqr_stamp ON public.course_question_replies;
CREATE TRIGGER trg_cqr_stamp
    BEFORE INSERT OR UPDATE ON public.course_question_replies
    FOR EACH ROW EXECUTE FUNCTION public.tg_stamp_teacher_reply();

DROP POLICY IF EXISTS "vbrtn_messages_insert_own" ON public.vbrtn_messages;
CREATE POLICY "vbrtn_messages_insert_own" ON public.vbrtn_messages FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (SELECT 1 FROM public.vbrtn_threads t
                     WHERE t.id = thread_id AND t.user_id = auth.uid())
    );

DROP POLICY IF EXISTS "friendships_insert_auth" ON public.friendships;
CREATE POLICY "friendships_insert_auth" ON public.friendships FOR INSERT
    WITH CHECK (
        auth.uid() = initiated_by
        AND auth.uid() IN (user_a_id, user_b_id)
        AND status = 'pending'
    );

DROP POLICY IF EXISTS "subscribers_insert_anyone" ON public.subscribers;
DROP POLICY IF EXISTS "analytics_events_insert_all" ON public.analytics_events;

-- ── 8. counters + badges are server-written only ────────────────────────────
CREATE OR REPLACE FUNCTION public.protect_counters()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    -- Count triggers are SECURITY DEFINER (current_user = owner) and the
    -- service-role functions run as service_role — both pass through.
    IF current_user IN ('anon', 'authenticated') THEN
        IF TG_TABLE_NAME = 'profiles' THEN
            NEW.karma           := OLD.karma;
            NEW.founder_badge   := OLD.founder_badge;
            NEW.post_count      := OLD.post_count;
            NEW.follower_count  := OLD.follower_count;
            NEW.following_count := OLD.following_count;
        ELSE
            NEW.likes_count         := OLD.likes_count;
            NEW.comments_count      := OLD.comments_count;
            NEW.bookmarks_count     := OLD.bookmarks_count;
            NEW.bluesky_reply_count := OLD.bluesky_reply_count;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_protect ON public.profiles;
CREATE TRIGGER trg_profiles_protect BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.protect_counters();

DROP TRIGGER IF EXISTS trg_posts_protect ON public.posts;
CREATE TRIGGER trg_posts_protect BEFORE UPDATE ON public.posts
    FOR EACH ROW EXECUTE FUNCTION public.protect_counters();
