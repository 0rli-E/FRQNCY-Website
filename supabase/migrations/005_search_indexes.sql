-- 005_search_indexes.sql
-- Text-search indexes for /social/search.
--
-- NOTE (April 2026): The conviction leaderboard RPC that originally lived in
-- this file was removed. FRQNCY Social does not rank people against each
-- other — no public leaderboards, no competitive scoring of "calls". The
-- surface was deleted on cooperation-over-competition grounds.
-- See memory/feedback_frqncy_values.md for the full reasoning.
--
-- Conviction tagging on individual posts still exists as self-expression
-- (the bullish/neutral/bearish column on `posts`, added in 002_conviction.sql).
-- No aggregation RPC is needed to support it.
--
-- Safe to run multiple times.

-- ─── Search indexes ────────────────────────────────────────────────────────

-- Trigram indexes for fast ILIKE '%...%' on common fields.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS posts_content_trgm_idx
  ON posts USING gin (content gin_trgm_ops);

CREATE INDEX IF NOT EXISTS posts_project_tag_trgm_idx
  ON posts USING gin (project_tag gin_trgm_ops)
  WHERE project_tag IS NOT NULL;

CREATE INDEX IF NOT EXISTS profiles_username_trgm_idx
  ON profiles USING gin (username gin_trgm_ops);

CREATE INDEX IF NOT EXISTS profiles_display_name_trgm_idx
  ON profiles USING gin (display_name gin_trgm_ops);

-- ─── Leaderboard RPC (removed) ────────────────────────────────────────────
--
-- Previously: CREATE FUNCTION public.get_conviction_leaderboard(...)
-- If you ran an earlier version of this migration, you can drop the orphan
-- with:
--
--   DROP FUNCTION IF EXISTS public.get_conviction_leaderboard(INT);
--
-- It is harmless to leave in the DB if already created — nothing calls it.
