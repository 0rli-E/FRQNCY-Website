-- Migration 022: Courses Room (Skool-like learning surface)
--
-- Per proposals/EXECUTION-PLAN-90D.md + commissioned 2026-05-16:
-- /courses/ becomes a learner room — enrollment, per-lesson progress,
-- private notes, public Q&A thread, teacher dashboard. Course catalog
-- continues to live in courses.json; this migration tracks only per-user
-- state. Complementary to migration 014 (course_purchases for paid
-- access). RLS: students see only their own progress/notes; questions
-- are visible to any authenticated user; teachers see all student
-- progress for the courses they teach.
--
-- Editorial guardrails (per FRQNCY voice playbook):
--   - No leaderboards: progress is per-user, never aggregated publicly.
--   - No streaks: completion is binary; no day-counts persisted.
--   - Notes are private; teachers cannot see them. Q&A is opt-in
--     (posting requires the user to choose to ask publicly).
--
-- Idempotent.

-- ── Tables ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.course_enrollments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_slug TEXT NOT NULL,
    enrolled_at TIMESTAMPTZ DEFAULT now(),
    last_active_at TIMESTAMPTZ DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','completed','dropped')),
    UNIQUE (user_id, course_slug)
);

CREATE INDEX IF NOT EXISTS idx_ce_user ON public.course_enrollments (user_id, last_active_at DESC);
CREATE INDEX IF NOT EXISTS idx_ce_course ON public.course_enrollments (course_slug, enrolled_at DESC);

CREATE TABLE IF NOT EXISTS public.course_lesson_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_slug TEXT NOT NULL,
    lesson_id TEXT NOT NULL,
    completed_at TIMESTAMPTZ,
    seconds_spent INT DEFAULT 0 CHECK (seconds_spent >= 0),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, course_slug, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_clp_user_course
    ON public.course_lesson_progress (user_id, course_slug);
CREATE INDEX IF NOT EXISTS idx_clp_course_completed
    ON public.course_lesson_progress (course_slug, completed_at DESC)
    WHERE completed_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.course_lesson_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_slug TEXT NOT NULL,
    lesson_id TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, course_slug, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_cln_user
    ON public.course_lesson_notes (user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.course_lesson_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_slug TEXT NOT NULL,
    lesson_id TEXT NOT NULL,
    body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 4000),
    created_at TIMESTAMPTZ DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    pinned BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_clq_course_lesson_created
    ON public.course_lesson_questions (course_slug, lesson_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clq_open
    ON public.course_lesson_questions (course_slug, created_at DESC)
    WHERE resolved_at IS NULL;

CREATE TABLE IF NOT EXISTS public.course_question_replies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question_id UUID NOT NULL REFERENCES public.course_lesson_questions(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 4000),
    is_teacher BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cqr_question
    ON public.course_question_replies (question_id, created_at);

CREATE TABLE IF NOT EXISTS public.course_teachers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_slug TEXT,
    added_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ct_user ON public.course_teachers (user_id);

-- ── Helper: is_course_teacher ────────────────────────────────────────
-- SECURITY DEFINER so RLS policies can use it without recursing through
-- their own checks. course_slug NULL on the teacher row = teaches all.

CREATE OR REPLACE FUNCTION public.is_course_teacher(p_course_slug TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.course_teachers
        WHERE user_id = auth.uid()
        AND (course_slug IS NULL OR course_slug = p_course_slug)
    );
$$;

-- ── Auto-stamp updated_at on note edits ──────────────────────────────

CREATE OR REPLACE FUNCTION public.tg_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cln_touch ON public.course_lesson_notes;
CREATE TRIGGER trg_cln_touch
    BEFORE UPDATE ON public.course_lesson_notes
    FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

DROP TRIGGER IF EXISTS trg_clp_touch ON public.course_lesson_progress;
CREATE TRIGGER trg_clp_touch
    BEFORE UPDATE ON public.course_lesson_progress
    FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- ── Mark replies from teachers ──────────────────────────────────────
-- When a reply is inserted, set is_teacher = true if the author teaches
-- the parent question's course.

CREATE OR REPLACE FUNCTION public.tg_stamp_teacher_reply()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    q_slug TEXT;
BEGIN
    SELECT course_slug INTO q_slug
    FROM public.course_lesson_questions WHERE id = NEW.question_id;
    NEW.is_teacher := EXISTS (
        SELECT 1 FROM public.course_teachers
        WHERE user_id = NEW.author_id
        AND (course_slug IS NULL OR course_slug = q_slug)
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cqr_stamp ON public.course_question_replies;
CREATE TRIGGER trg_cqr_stamp
    BEFORE INSERT ON public.course_question_replies
    FOR EACH ROW EXECUTE FUNCTION public.tg_stamp_teacher_reply();

-- ── View: questions with author profile ─────────────────────────────
-- Used by the room overlay to render "username asked X days ago"
-- without a second round-trip. Joins to profiles (created in 001).

CREATE OR REPLACE VIEW public.course_questions_with_author AS
SELECT
    q.id,
    q.course_slug,
    q.lesson_id,
    q.body,
    q.created_at,
    q.resolved_at,
    q.pinned,
    q.author_id,
    p.username        AS author_username,
    p.display_name    AS author_display_name,
    p.avatar_url      AS author_avatar_url,
    EXISTS (
        SELECT 1 FROM public.course_teachers t
        WHERE t.user_id = q.author_id
        AND (t.course_slug IS NULL OR t.course_slug = q.course_slug)
    ) AS author_is_teacher,
    (
        SELECT count(*) FROM public.course_question_replies r
        WHERE r.question_id = q.id
    ) AS reply_count
FROM public.course_lesson_questions q
LEFT JOIN public.profiles p ON p.id = q.author_id;

CREATE OR REPLACE VIEW public.course_replies_with_author AS
SELECT
    r.id,
    r.question_id,
    r.body,
    r.is_teacher,
    r.created_at,
    r.author_id,
    p.username        AS author_username,
    p.display_name    AS author_display_name,
    p.avatar_url      AS author_avatar_url
FROM public.course_question_replies r
LEFT JOIN public.profiles p ON p.id = r.author_id;

-- ── RLS ──────────────────────────────────────────────────────────────

ALTER TABLE public.course_enrollments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lesson_progress    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lesson_notes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lesson_questions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_question_replies   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_teachers           ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ce_select_own_or_teacher ON public.course_enrollments;
DROP POLICY IF EXISTS ce_insert_own ON public.course_enrollments;
DROP POLICY IF EXISTS ce_update_own ON public.course_enrollments;
DROP POLICY IF EXISTS ce_delete_own ON public.course_enrollments;

CREATE POLICY ce_select_own_or_teacher ON public.course_enrollments
    FOR SELECT USING (user_id = auth.uid() OR public.is_course_teacher(course_slug));
CREATE POLICY ce_insert_own ON public.course_enrollments
    FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY ce_update_own ON public.course_enrollments
    FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY ce_delete_own ON public.course_enrollments
    FOR DELETE USING (user_id = auth.uid());

DROP POLICY IF EXISTS clp_select_own_or_teacher ON public.course_lesson_progress;
DROP POLICY IF EXISTS clp_insert_own ON public.course_lesson_progress;
DROP POLICY IF EXISTS clp_update_own ON public.course_lesson_progress;
DROP POLICY IF EXISTS clp_delete_own ON public.course_lesson_progress;

CREATE POLICY clp_select_own_or_teacher ON public.course_lesson_progress
    FOR SELECT USING (user_id = auth.uid() OR public.is_course_teacher(course_slug));
CREATE POLICY clp_insert_own ON public.course_lesson_progress
    FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY clp_update_own ON public.course_lesson_progress
    FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY clp_delete_own ON public.course_lesson_progress
    FOR DELETE USING (user_id = auth.uid());

DROP POLICY IF EXISTS cln_select_own ON public.course_lesson_notes;
DROP POLICY IF EXISTS cln_insert_own ON public.course_lesson_notes;
DROP POLICY IF EXISTS cln_update_own ON public.course_lesson_notes;
DROP POLICY IF EXISTS cln_delete_own ON public.course_lesson_notes;

-- Notes are owner-only; teachers explicitly cannot read student notes.
CREATE POLICY cln_select_own ON public.course_lesson_notes
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY cln_insert_own ON public.course_lesson_notes
    FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY cln_update_own ON public.course_lesson_notes
    FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY cln_delete_own ON public.course_lesson_notes
    FOR DELETE USING (user_id = auth.uid());

DROP POLICY IF EXISTS clq_select_all ON public.course_lesson_questions;
DROP POLICY IF EXISTS clq_insert_own ON public.course_lesson_questions;
DROP POLICY IF EXISTS clq_update_own_or_teacher ON public.course_lesson_questions;
DROP POLICY IF EXISTS clq_delete_own_or_teacher ON public.course_lesson_questions;

CREATE POLICY clq_select_all ON public.course_lesson_questions
    FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY clq_insert_own ON public.course_lesson_questions
    FOR INSERT WITH CHECK (author_id = auth.uid());
CREATE POLICY clq_update_own_or_teacher ON public.course_lesson_questions
    FOR UPDATE USING (author_id = auth.uid() OR public.is_course_teacher(course_slug))
    WITH CHECK (author_id = auth.uid() OR public.is_course_teacher(course_slug));
CREATE POLICY clq_delete_own_or_teacher ON public.course_lesson_questions
    FOR DELETE USING (author_id = auth.uid() OR public.is_course_teacher(course_slug));

DROP POLICY IF EXISTS cqr_select_all ON public.course_question_replies;
DROP POLICY IF EXISTS cqr_insert_authenticated ON public.course_question_replies;
DROP POLICY IF EXISTS cqr_update_own_or_teacher ON public.course_question_replies;
DROP POLICY IF EXISTS cqr_delete_own_or_teacher ON public.course_question_replies;

CREATE POLICY cqr_select_all ON public.course_question_replies
    FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY cqr_insert_authenticated ON public.course_question_replies
    FOR INSERT WITH CHECK (author_id = auth.uid());
CREATE POLICY cqr_update_own_or_teacher ON public.course_question_replies
    FOR UPDATE USING (
        author_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.course_lesson_questions q
            WHERE q.id = question_id AND public.is_course_teacher(q.course_slug)
        )
    );
CREATE POLICY cqr_delete_own_or_teacher ON public.course_question_replies
    FOR DELETE USING (
        author_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.course_lesson_questions q
            WHERE q.id = question_id AND public.is_course_teacher(q.course_slug)
        )
    );

DROP POLICY IF EXISTS ct_select_all ON public.course_teachers;
CREATE POLICY ct_select_all ON public.course_teachers
    FOR SELECT USING (auth.uid() IS NOT NULL);
-- No INSERT/UPDATE/DELETE policy: teacher list is managed by service-role only.

-- ── Seed Orlando as teacher of all courses (idempotent) ─────────────

INSERT INTO public.course_teachers (user_id, course_slug)
SELECT u.id, NULL
FROM auth.users u
WHERE u.email = 'orlando.eisenreich@gmail.com'
AND NOT EXISTS (
    SELECT 1 FROM public.course_teachers t
    WHERE t.user_id = u.id AND t.course_slug IS NULL
);

-- ── Comments ────────────────────────────────────────────────────────

COMMENT ON TABLE public.course_enrollments IS
    'User-initiated enrollment in a course. Free or paid (complementary to course_purchases). RLS: select-own or teacher.';
COMMENT ON TABLE public.course_lesson_progress IS
    'Per-lesson completion ledger. RLS: select-own or teacher; write own only.';
COMMENT ON TABLE public.course_lesson_notes IS
    'Private student notes per lesson. RLS: owner-only — teachers explicitly cannot see notes.';
COMMENT ON TABLE public.course_lesson_questions IS
    'Public Q&A thread per (course, lesson). Authenticated read; authors update/delete own; teachers manage all.';
COMMENT ON TABLE public.course_question_replies IS
    'Replies to lesson questions. is_teacher auto-stamped on INSERT via trigger.';
COMMENT ON TABLE public.course_teachers IS
    'Maps users to courses they teach. course_slug NULL = teaches all. Service-role managed.';
COMMENT ON FUNCTION public.is_course_teacher(TEXT) IS
    'Returns true if auth.uid() is a teacher for the given course slug (or teaches all). SECURITY DEFINER.';
