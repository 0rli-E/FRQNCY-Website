-- 002_conviction.sql
-- Adds a "conviction" field to posts so users can declare bullish / bearish /
-- neutral stance on the project they tag. This is FRQNCY's core differentiator:
-- project-anchored posts + conviction tracking.

-- Safe to run multiple times.

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS conviction TEXT
  CHECK (conviction IS NULL OR conviction IN ('bullish', 'bearish', 'neutral'));

-- Optional: index for feeds filtered by project + conviction (common query).
CREATE INDEX IF NOT EXISTS posts_project_conviction_idx
  ON posts (project_tag, conviction)
  WHERE project_tag IS NOT NULL;

COMMENT ON COLUMN posts.conviction IS
  'User stance on the tagged project at post time: bullish | bearish | neutral | NULL.';
