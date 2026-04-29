-- Migration 006: E2E encrypted messaging primitives
-- Adds:
--   • profiles.encryption_public_key (libsodium X25519 public key, base64)
--   • messages.encrypted_content (sealed-box ciphertext, base64)
--   • messages.encryption_version (schema versioning for future ratchet upgrade)
-- Idempotent: safe to re-run. Existing plaintext messages remain readable;
-- new clients write to encrypted_content and leave content NULL.

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS encryption_public_key TEXT;

ALTER TABLE public.messages
    ADD COLUMN IF NOT EXISTS encrypted_content TEXT,
    ADD COLUMN IF NOT EXISTS encryption_version SMALLINT DEFAULT 0;

COMMENT ON COLUMN public.profiles.encryption_public_key IS
    'libsodium X25519 public key (base64). Generated client-side on signup. Private key never leaves the user device.';

COMMENT ON COLUMN public.messages.encrypted_content IS
    'libsodium sealed-box ciphertext (base64). When set, content is plaintext fallback (deprecated path); new clients encrypt only.';

COMMENT ON COLUMN public.messages.encryption_version IS
    '0 = plaintext (legacy), 1 = libsodium sealed box (sender-anonymous, no forward secrecy), 2 = future double-ratchet upgrade.';
