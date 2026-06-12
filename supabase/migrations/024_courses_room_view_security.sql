-- Migration 024: enforce RLS through the Courses-Room author views.
--
-- Migration 022 created course_questions_with_author / course_replies_with_author
-- as plain views. In Postgres a plain view runs with the *view owner's*
-- privileges (postgres), which BYPASSES row-level security on the underlying
-- course_lesson_questions / course_question_replies tables. Result: anyone —
-- including an unauthenticated anon caller — could read every question and reply
-- (bodies + author username/display_name/avatar) via the view, even though the
-- base tables require auth.uid() IS NOT NULL to SELECT.
--
-- security_invoker = true makes the views evaluate underlying RLS as the
-- QUERYING user, restoring the intended policy:
--   - anon (no auth.uid()) → sees nothing
--   - authenticated users   → see questions/replies (clq/cqr_select_all)
-- The course-room overlay only reads these views when signed in, and the
-- teacher dashboard is auth-gated, so no app flow regresses.
--
-- Idempotent.

ALTER VIEW public.course_questions_with_author SET (security_invoker = true);
ALTER VIEW public.course_replies_with_author   SET (security_invoker = true);
