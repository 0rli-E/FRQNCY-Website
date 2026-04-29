-- ============================================================================
-- Migration 012: Sanctuary practice tracker
-- ----------------------------------------------------------------------------
-- Per proposals/EXECUTION-PLAN-90D.md Phase 2 Week 3 + the FRQNCY Inhabit
-- pillar. Records the user's own practice sessions. Aggregates derived per
-- user — never aggregated across users. NO leaderboard surface ever (per
-- CLAUDE.md cooperation-over-competition rule).
--
-- Idempotent.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.practice_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    practice_slug TEXT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    duration_minutes INT NOT NULL CHECK (duration_minutes > 0 AND duration_minutes <= 600),
    notes TEXT,
    -- Mood scale: 1-5. NULL = user didn't record.
    mood_pre SMALLINT CHECK (mood_pre IS NULL OR mood_pre BETWEEN 1 AND 5),
    mood_post SMALLINT CHECK (mood_post IS NULL OR mood_post BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_practice_logs_user_started
    ON public.practice_logs (user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_practice_logs_user_practice
    ON public.practice_logs (user_id, practice_slug, started_at DESC);

ALTER TABLE public.practice_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS practice_logs_select_own ON public.practice_logs;
DROP POLICY IF EXISTS practice_logs_insert_own ON public.practice_logs;
DROP POLICY IF EXISTS practice_logs_update_own ON public.practice_logs;
DROP POLICY IF EXISTS practice_logs_delete_own ON public.practice_logs;

CREATE POLICY practice_logs_select_own
    ON public.practice_logs FOR SELECT USING (user_id = auth.uid());
CREATE POLICY practice_logs_insert_own
    ON public.practice_logs FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY practice_logs_update_own
    ON public.practice_logs FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY practice_logs_delete_own
    ON public.practice_logs FOR DELETE USING (user_id = auth.uid());

-- Derived per-user view. Recomputed on read — small enough scale.
-- Returns: practice_slug, total_sessions, total_minutes, last_completed_at,
-- consistency_days_30d (number of distinct calendar days the user practiced
-- this in the last 30), avg_mood_delta (mean of mood_post - mood_pre across
-- rows with both set).
CREATE OR REPLACE VIEW public.practice_scores AS
SELECT
    user_id,
    practice_slug,
    COUNT(*) AS total_sessions,
    COALESCE(SUM(duration_minutes), 0) AS total_minutes,
    MAX(started_at) AS last_completed_at,
    COUNT(DISTINCT DATE(started_at AT TIME ZONE 'UTC')) FILTER (
        WHERE started_at >= now() - INTERVAL '30 days'
    ) AS consistency_days_30d,
    AVG(NULLIF(mood_post, 0)::numeric - NULLIF(mood_pre, 0)::numeric)
        FILTER (WHERE mood_pre IS NOT NULL AND mood_post IS NOT NULL)
        AS avg_mood_delta
FROM public.practice_logs
GROUP BY user_id, practice_slug;

-- View inherits RLS from the underlying table (only own rows visible).

COMMENT ON TABLE public.practice_logs IS
    'Personal practice sessions. RLS-locked to owner. Never aggregated across users — no leaderboard surface anywhere in the product per CLAUDE.md.';

COMMENT ON VIEW public.practice_scores IS
    'Per-user, per-practice derived stats. Reframe "consistency_days_30d" as "how many days you turned to this in the last 30" in UI — never as a streak rank.';
