-- ============================================================================
-- 020_per_device_signer_keys.sql
-- Date: 2026-05-14
--
-- Tier-2 fix #10 from proposals/NRG-EXPERT-CRITIQUE-2026-05-14.md. Lays the
-- FOUNDATION for per-device signing keys; the write-side (signed device
-- registration + revocation attestations issued by a custody key) is Tier-3.
--
-- Today every NRG user has exactly ONE Ed25519 signing key (migration 009,
-- profiles.signing_public_key) living in a single browser's localStorage.
-- Lose the device → lose the identity. No revocation, no multi-device, no
-- audit trail. Farcaster's custody/signer separation answers all three: a
-- custody key authorises N device-scoped signer keys via signed attestations,
-- and any one signer can be revoked without touching the others.
--
-- This migration ships the SCHEMA + the READ-side RLS. It does NOT add the
-- attestation column yet (signer_attestation, custody_signature, ...) — those
-- arrive in Tier-3 once the custody key lifecycle is designed. The current
-- INSERT/UPDATE policies trust auth.uid() the same way the rest of the schema
-- does; they exist so the read surface (ProfileCard device list) has rows to
-- render once AuthProvider starts writing them.
--
-- Tables:
--   • signing_keys — (profile_id, public_key, device_label, created_at,
--     revoked_at, revoked_reason). UNIQUE on (profile_id, public_key) so the
--     same key can't be registered twice under one profile. Partial index on
--     active rows for the common "list my active devices" query.
--
-- RLS:
--   • SELECT  — profile_id = auth.uid(): you only see your own devices.
--   • INSERT  — profile_id = auth.uid(): you only register under your own
--               profile.
--   • UPDATE  — profile_id = auth.uid(): you only revoke your own devices.
--               PostgreSQL has no column-level RLS; by convention UPDATE is
--               used ONLY to set revoked_at + revoked_reason. The Tier-3
--               write path will enforce this in application code (and ideally
--               via a BEFORE UPDATE trigger that rejects writes to any other
--               column).
--   • DELETE  — no policy. Devices are NEVER deleted, only revoked. Preserves
--               the audit trail forever.
--
-- Seeding existing users:
--   For every row in profiles with a non-NULL signing_public_key (the legacy
--   single-key world from migration 009), insert a corresponding row in
--   signing_keys with device_label='initial' and created_at = profiles
--   .created_at. ON CONFLICT DO NOTHING makes this idempotent across re-runs.
--
-- Relationship to profiles.signing_public_key:
--   profiles.signing_public_key STAYS in place. It represents the "currently
--   active signer" — a denormalised convenience for verifiers that only need
--   one key. Tier-3 will make signing_keys the source of truth; this column
--   either becomes a generated/derived value or gets dropped.
--
-- Idempotent. Safe to run twice.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. signing_keys table
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.signing_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    public_key TEXT NOT NULL,
    device_label TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_at TIMESTAMPTZ,
    revoked_reason TEXT,
    UNIQUE (profile_id, public_key)
);

COMMENT ON TABLE public.signing_keys IS
    'Per-device Ed25519 signing keys authorised under a profile. One row per (profile_id, public_key). Tier-2 foundation for Farcaster-style custody/signer separation — see proposals/NRG-EXPERT-CRITIQUE-2026-05-14.md.';

COMMENT ON COLUMN public.signing_keys.public_key IS
    'libsodium Ed25519 public key (base64). Matches the format used by profiles.signing_public_key (migration 009).';

COMMENT ON COLUMN public.signing_keys.device_label IS
    'User-set label like "Orli''s MacBook" or "iPhone 15". NULL allowed for keys imported without a label. Tier-3 write path lets the user edit this.';

COMMENT ON COLUMN public.signing_keys.revoked_at IS
    'When the user (or their custody key, in Tier-3) revoked this signer. NULL = active. Rows are NEVER deleted; revocation is a soft state so the audit trail survives.';

COMMENT ON COLUMN public.signing_keys.revoked_reason IS
    'Free-form short string. Conventional values: lost_device, rotated, user_request, compromised. Tier-3 may tighten this to a CHECK constraint.';


-- ----------------------------------------------------------------------------
-- 2. Indexes
-- ----------------------------------------------------------------------------
-- The common query is "list active devices for the signed-in user". The
-- partial index keeps it O(log N) without indexing revoked rows we rarely
-- read.

CREATE INDEX IF NOT EXISTS signing_keys_profile_active_idx
    ON public.signing_keys (profile_id)
    WHERE revoked_at IS NULL;


-- ----------------------------------------------------------------------------
-- 3. Row Level Security
-- ----------------------------------------------------------------------------

ALTER TABLE public.signing_keys ENABLE ROW LEVEL SECURITY;

-- SELECT — you see your own devices and only your own.
DROP POLICY IF EXISTS "signing_keys_select_own" ON public.signing_keys;
CREATE POLICY "signing_keys_select_own"
    ON public.signing_keys FOR SELECT
    USING (profile_id = auth.uid());

-- INSERT — you can only register a device under your own profile. Tier-3
-- adds a custody-signature column + a BEFORE INSERT trigger that verifies
-- the attestation before the row lands.
DROP POLICY IF EXISTS "signing_keys_insert_own" ON public.signing_keys;
CREATE POLICY "signing_keys_insert_own"
    ON public.signing_keys FOR INSERT
    WITH CHECK (profile_id = auth.uid());

-- UPDATE — you can only update your own rows. CONVENTION: the application
-- only writes revoked_at + revoked_reason; PostgreSQL has no column-level
-- RLS, so the policy stays row-level-permissive. Tier-3 will add a
-- BEFORE UPDATE trigger that rejects writes to any other column.
DROP POLICY IF EXISTS "signing_keys_update_own" ON public.signing_keys;
CREATE POLICY "signing_keys_update_own"
    ON public.signing_keys FOR UPDATE
    USING (profile_id = auth.uid())
    WITH CHECK (profile_id = auth.uid());

-- DELETE — NO POLICY. Rows are never deleted; revocation is a soft state so
-- the audit trail survives. Omitting the policy means RLS denies all DELETE
-- attempts by default for non-superuser roles.


-- ----------------------------------------------------------------------------
-- 4. Seed existing single-key users into the new table
-- ----------------------------------------------------------------------------
-- Every legacy user with profiles.signing_public_key (migration 009) gets one
-- row labelled 'initial', backdated to the profile's created_at so the audit
-- timeline is honest. ON CONFLICT DO NOTHING makes the seed idempotent — the
-- UNIQUE (profile_id, public_key) constraint absorbs re-runs cleanly.

INSERT INTO public.signing_keys (profile_id, public_key, device_label, created_at)
SELECT id, signing_public_key, 'initial', created_at
FROM public.profiles
WHERE signing_public_key IS NOT NULL
ON CONFLICT (profile_id, public_key) DO NOTHING;
