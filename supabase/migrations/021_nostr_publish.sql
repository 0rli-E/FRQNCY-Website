-- ============================================================================
-- 021_nostr_publish.sql
-- Date: 2026-05-14
--
-- Opt-in Nostr (NIP-01) cross-publishing for NRG posts. Adds two columns to
-- profiles:
--
--   1. nostr_pubkey — the user's secp256k1 + schnorr public key as 64-char
--      hex (NIP-01 identifier; npub when bech32-encoded per NIP-19). Nostr
--      keys are NOT interchangeable with NRG's existing Ed25519 signing key
--      (libsodium / migration 009); each Nostr-enabled user generates a
--      SEPARATE secp256k1 keypair client-side, the private half wrapped via
--      the same passphrase pattern used for the libsodium key. The server
--      only stores the public half.
--
--   2. nostr_publish_enabled — boolean opt-in flag. When true and
--      nostr_pubkey is set, createPost fires a fire-and-forget WebSocket
--      publish to the default relay set (relay.damus.io, nos.lol,
--      relay.snort.social). Default false so existing users are unaffected
--      until they explicitly opt in via the keys panel (Tier-3 UI).
--
-- The Nostr expert audit (proposals/NRG-EXPERT-CRITIQUE-2026-05-14.md, fix
-- #11) flagged the absence of this as "the strongest evidence that the
-- user-owned, key-portable framing is marketing, not engineering." Three
-- writes per post to free public relays is the minimum bar for the claim
-- to be defensible.
--
-- Idempotent. Safe to run twice.
-- ============================================================================


ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS nostr_pubkey TEXT,
    ADD COLUMN IF NOT EXISTS nostr_publish_enabled BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_nostr_pubkey_uniq
    ON public.profiles (nostr_pubkey)
    WHERE nostr_pubkey IS NOT NULL;

COMMENT ON COLUMN public.profiles.nostr_pubkey IS
    'secp256k1 public key (hex, 64 chars). NIP-01 identifier (npub when bech32-encoded per NIP-19). Set when user enables Nostr publishing via the keys panel; the private key never touches the server.';

COMMENT ON COLUMN public.profiles.nostr_publish_enabled IS
    'Opt-in flag. When true and nostr_pubkey is set, createPost fires a fire-and-forget WebSocket publish to relay.damus.io et al. Default false; user opts in via the Tier-3 keys panel.';
