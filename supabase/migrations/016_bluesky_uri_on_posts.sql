-- 016_bluesky_uri_on_posts.sql
--
-- Per proposals/BLUESKY-TIMELINE-READER.md (v1.1 reply backflow).
--
-- When a user cross-posts an NRG post to Bluesky, publishToBluesky returns the
-- AT-URI of the new Bluesky record. We persist that URI on the NRG row so the
-- post detail view can rehydrate the Bluesky thread without round-tripping
-- through the cross-post bridge again.
--
-- bluesky_uri    — at://did:.../app.bsky.feed.post/<rkey>, NULL when the post
--                  was never cross-posted (e.g. the user wasn't connected, or
--                  the cross-post failed).
-- bluesky_cid    — content identifier from the same response, kept for thread
--                  validation and as a tiebreaker if the URI ever gets reused.
--
-- Both columns are nullable. No index for now — we look these up per-post via
-- the primary key in PostView, never via a bluesky_uri filter.
--
-- Idempotent — safe to re-run.

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS bluesky_uri text,
  ADD COLUMN IF NOT EXISTS bluesky_cid text;

COMMENT ON COLUMN posts.bluesky_uri IS
  'AT-URI of the Bluesky mirror of this post when cross-posted. NULL means never cross-posted. Per proposals/BLUESKY-TIMELINE-READER.md (v1.1 reply backflow).';

COMMENT ON COLUMN posts.bluesky_cid IS
  'Content identifier from the Bluesky publish response. Pairs with bluesky_uri.';
