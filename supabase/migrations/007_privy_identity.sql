-- Migration 007: Privy identity bridge
--
-- Adds privy_did to profiles + a UNIQUE index so a Privy DID maps to exactly
-- one Supabase profile. wallet_address already exists from migration 001.
--
-- The bridge is client-side (see social-src/src/lib/privy-bridge.ts): a Privy
-- login mints/refreshes a Supabase session via OTP on the same email, then
-- patches privy_did + wallet_address onto the profile. No server-side JWT
-- minting. Reversible — drop the column to disable Privy without breaking
-- existing email/password users.
--
-- Idempotent: safe to re-run.

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS privy_did TEXT;

-- One Privy DID maps to at most one profile. NULLs are allowed (existing
-- email/password users have no Privy DID until they link one).
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_privy_did_unique
    ON public.profiles (privy_did)
    WHERE privy_did IS NOT NULL;

-- Lower-case wallet addresses for stable lookups. Existing rows keep whatever
-- case they were inserted with; the bridge writes lower-case for new links.
CREATE INDEX IF NOT EXISTS idx_profiles_wallet_address_lower
    ON public.profiles (LOWER(wallet_address))
    WHERE wallet_address IS NOT NULL;

COMMENT ON COLUMN public.profiles.privy_did IS
    'Privy decentralized identifier (did:privy:...). NULL for users who never linked a Privy account. Set by social-src/src/lib/privy-bridge.ts after a successful Privy login.';
