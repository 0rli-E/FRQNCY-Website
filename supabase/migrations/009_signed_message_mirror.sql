-- Migration 009: Hybrid signed-message mirror — Phase 2 commitment device
--
-- Per proposals/NRG-ONCHAIN-PIVOT.md section 7. The mirror gives every NRG
-- post + follow a portable signature so any future migration to ATProto,
-- Farcaster, or another protocol becomes a workflow rather than a rebuild.
--
-- Adds (additive only, no rewrites):
--   • profiles.signing_public_key  — Ed25519 base64 public key, generated
--     client-side alongside the X25519 encryption key on first signed-in load.
--   • posts.signature              — Ed25519 detached signature (base64) over
--     a canonical JSON payload of the post.
--   • posts.signed_payload         — the exact bytes that were signed, stored
--     so verifiers reproduce the message without rebuilding canonical JSON.
--   • follows.signature            — same shape, signs the follow record.
--   • follows.signed_payload
--
-- Rows created before this migration (and rows from clients that haven't
-- adopted signing) leave these columns NULL. The mirror is opportunistic:
-- some history is signed, some isn't, that's fine. Verifiers skip rows
-- without signatures.
--
-- The signing wire-up in api.ts is a follow-up — this migration just opens
-- the schema. See proposals/HYBRID-SIGNED-MIRROR.md for the canonical-JSON
-- format and the export endpoint design.
--
-- Idempotent: safe to re-run.

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS signing_public_key TEXT;

ALTER TABLE public.posts
    ADD COLUMN IF NOT EXISTS signature TEXT,
    ADD COLUMN IF NOT EXISTS signed_payload TEXT;

ALTER TABLE public.follows
    ADD COLUMN IF NOT EXISTS signature TEXT,
    ADD COLUMN IF NOT EXISTS signed_payload TEXT;

-- Index to make the future export endpoint fast: pull all signed rows for a
-- given author in chronological order.
CREATE INDEX IF NOT EXISTS idx_posts_author_signed
    ON public.posts (author_id, created_at DESC)
    WHERE signature IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_follows_follower_signed
    ON public.follows (follower_id, created_at DESC)
    WHERE signature IS NOT NULL;

COMMENT ON COLUMN public.profiles.signing_public_key IS
    'libsodium Ed25519 public key (base64). Used to verify signatures on posts and follows. Generated client-side alongside encryption_public_key.';

COMMENT ON COLUMN public.posts.signature IS
    'Ed25519 detached signature (base64) over signed_payload. NULL for unsigned legacy rows. Verifiable with the author profiles.signing_public_key.';

COMMENT ON COLUMN public.posts.signed_payload IS
    'Canonical JSON the author signed. Includes type=frqncy.post.v1, author_id, content, project_tag, conviction, created_at. Stored verbatim so verifiers reproduce the signed bytes without re-canonicalizing.';

COMMENT ON COLUMN public.follows.signature IS
    'Ed25519 detached signature (base64) over signed_payload. NULL for unsigned legacy rows.';

COMMENT ON COLUMN public.follows.signed_payload IS
    'Canonical JSON the author signed. Includes type=frqncy.follow.v1, follower_id, following_id, created_at.';
