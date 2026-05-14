-- ============================================================================
-- 019_did_sender_sigs_wallet_uniq.sql
-- Date: 2026-05-14
--
-- Three Tier-1 schema gaps surfaced by converging ATProto / E2EE / Onchain
-- audits. All additive; no data loss; idempotent.
--
--   1. profiles.did — globally-resolvable did:key derived from
--      signing_public_key. The Ed25519 signing key is already the de-facto
--      identifier (migration 009) but there is no column the app can render
--      as a stable cross-protocol handle. Adds the column + unique partial
--      index. Populated client-side after key generation.
--
--   2. messages.sender_signature + sender_signature_version — DMs are E2E
--      encrypted but the sender identity is only attested by auth.uid()
--      server-side. A malicious admin can rewrite sender_id; ciphertext
--      stays intact, recipient cannot tell. Add a base64 Ed25519 signature
--      over the canonical (conversation_id, message_id, ciphertext,
--      recipient_pubkey, created_at) tuple, plus a version int so we can
--      evolve the canonical form. Verified client-side against
--      profiles.signing_public_key. version=0 marks legacy/unsigned rows;
--      version=1 is the current scheme. The existing
--      messages_update_own_member UPDATE policy (migration 018) already
--      lets the sender patch sender_signature after insert — no new policy.
--
--   3. profiles.wallet_address index — migration 007 created a regular
--      LOWER(wallet_address) index, NOT a unique constraint. Two profiles
--      can claim the same wallet, silently breaking /api/export identity
--      guarantees. Drop the non-unique index and replace with a UNIQUE
--      partial index. Wrapped in a DO block that catches unique_violation
--      so a production with existing duplicates surfaces a clear notice
--      instead of a cryptic failure mid-migration.
--
-- Idempotent. Safe to run twice.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. profiles.did — did:key derived from signing_public_key
-- ----------------------------------------------------------------------------

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS did TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_did_uniq
    ON public.profiles (did)
    WHERE did IS NOT NULL;

COMMENT ON COLUMN public.profiles.did IS
    'did:key:z... derived from signing_public_key. Populated by the app on key generation. Globally-resolvable identifier; remains stable across username/email changes.';


-- ----------------------------------------------------------------------------
-- 2. messages.sender_signature + messages.sender_signature_version
-- ----------------------------------------------------------------------------
-- The sender signs (conversation_id, id, ciphertext, recipient_pubkey,
-- created_at) with their Ed25519 signing key. Stored base64. Verified
-- client-side against the sender's profiles.signing_public_key (migration
-- 009). version=0 marks rows from before this migration / unsigned clients;
-- version=1 is the current canonical scheme. Existing
-- messages_update_own_member policy (migration 018) lets the sender patch
-- sender_signature after insert without a new RLS policy.

ALTER TABLE public.messages
    ADD COLUMN IF NOT EXISTS sender_signature TEXT,
    ADD COLUMN IF NOT EXISTS sender_signature_version INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.messages.sender_signature IS
    'Base64 Ed25519 signature over canonical (conversation_id, id, encrypted_content_or_path, recipient_pubkey, created_at). Verified client-side against sender''s profiles.signing_public_key.';

COMMENT ON COLUMN public.messages.sender_signature_version IS
    '0 = legacy/unsigned; 1 = current scheme. Version bumps signal canonical-form changes.';


-- ----------------------------------------------------------------------------
-- 3. profiles.wallet_address — replace non-unique LOWER() index with UNIQUE
-- ----------------------------------------------------------------------------
-- Migration 007 created idx_profiles_wallet_address_lower (regular index).
-- Drop both that name and the spec's alternate name defensively so this
-- migration is safe regardless of which form is present in a given env.
-- Then create a UNIQUE partial index so a wallet address can map to at
-- most one profile. The DO block catches unique_violation (SQLSTATE 23505)
-- and emits a NOTICE — production duplicates need to be cleaned up before
-- this constraint can take effect.

DROP INDEX IF EXISTS public.idx_profiles_wallet_address_lower;
DROP INDEX IF EXISTS public.profiles_wallet_address_lower_idx;

DO $$
BEGIN
    CREATE UNIQUE INDEX IF NOT EXISTS profiles_wallet_address_lower_uniq
        ON public.profiles (LOWER(wallet_address))
        WHERE wallet_address IS NOT NULL;
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'profiles_wallet_address_lower_uniq: duplicate wallet addresses detected — clean up before re-running. The UNIQUE index was NOT created. Run: SELECT LOWER(wallet_address), COUNT(*) FROM public.profiles WHERE wallet_address IS NOT NULL GROUP BY 1 HAVING COUNT(*) > 1;';
END;
$$;
