-- 017_bluesky_reply_count.sql
--
-- Per proposals/BLUESKY-TIMELINE-READER.md (v1.2 reply-count surface).
--
-- Persist the public Bluesky reply count for cross-posted NRG posts so the
-- Feed bridge hint can show "↗ N on Bluesky" without fetching the public
-- AppView per row on every feed render. Counts are refreshed nightly by
-- scripts/auto-grow/bluesky-counts-refresh.mjs (wired into the existing
-- auto-grow GitHub Actions workflow). On-demand freshness (when a user
-- opens a post detail page) is achieved by BlueskyReplies fetching the full
-- thread anyway — the persisted count is just for the Feed pill.
--
-- bluesky_reply_count       — int, default 0. NULL means "never synced"
--                             (the script will pick it up on the next run).
-- bluesky_replies_synced_at — timestamptz, NULL on first row write. Used by
--                             the refresh script to prioritise stale rows.
--
-- Both columns nullable. No index — we look these up per-post via the
-- primary key, never via a count predicate. The refresh script does its
-- own ORDER BY synced_at NULLS FIRST + bluesky_uri IS NOT NULL filter.
--
-- Idempotent — safe to re-run.

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS bluesky_reply_count integer,
  ADD COLUMN IF NOT EXISTS bluesky_replies_synced_at timestamptz;

COMMENT ON COLUMN posts.bluesky_reply_count IS
  'Public Bluesky reply count for cross-posted NRG posts. Refreshed nightly by scripts/auto-grow/bluesky-counts-refresh.mjs. Drives the "↗ N on Bluesky" Feed pill. Per proposals/BLUESKY-TIMELINE-READER.md (v1.2).';

COMMENT ON COLUMN posts.bluesky_replies_synced_at IS
  'When the reply count was last refreshed by the auto-grow script. NULL = never synced (priority queue).';
