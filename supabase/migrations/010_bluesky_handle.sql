-- Migration 010: Bluesky handle on profile (NRG ↔ Bluesky cross-post bridge)
--
-- Per proposals/ATPROTO-BRIDGE.md. Adds a public bluesky_handle column so
-- other NRG users can see "this person is also at @alice.bsky.social" and
-- so the Connections panel can fetch the user's last-cross-posted target.
--
-- The app password used to authenticate with the Bluesky PDS is NEVER stored
-- on FRQNCY's database — it lives in the user's localStorage only. The handle
-- is public information (every Bluesky user has a publicly-resolvable handle).
--
-- Idempotent.

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS bluesky_handle TEXT;

-- One handle per profile; same handle can't be claimed twice.
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_bluesky_handle_unique
    ON public.profiles (LOWER(bluesky_handle))
    WHERE bluesky_handle IS NOT NULL;

COMMENT ON COLUMN public.profiles.bluesky_handle IS
    'Public Bluesky/ATProto handle (e.g. alice.bsky.social) used by the cross-post bridge. App password lives in user localStorage only.';
