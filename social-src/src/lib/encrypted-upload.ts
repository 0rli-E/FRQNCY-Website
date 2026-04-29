import { ensureSodium } from './crypto';

// ─────────────────────────────────────────────────────────────────────────────
// Encrypted file primitive (v1.1 foundation).
//
// Single-recipient (1:1):
//   wrap the file bytes in one libsodium sealed box → base64. Recipient with
//   the matching private key opens it. No symmetric layer, no envelope JSON.
//
// Multi-recipient (group):
//   pick a random symmetric key → encrypt the file bytes once with
//   crypto_secretbox_easy → encrypt that symmetric key once per recipient with
//   crypto_box_seal. Pack as a JSON envelope:
//     {
//       v: 1,
//       mime: "...",
//       originalSize: <bytes before encryption>,
//       nonce: <base64 nonce for the symmetric body>,
//       body: <base64 secretbox ciphertext>,
//       encryptedKey: { recipientPubKeyB64: <sealed-box-of-symmetric-key>, ... }
//     }
//   then base64-encode the whole envelope JSON for upload.
//
// The envelope JSON-then-base64 is intentionally simple: no chunking yet, no
// streaming. For very large files (>10MB), stream-decrypt could be added later
// by switching the body to crypto_secretstream chunks; the format version
// number ("v": 1) is the upgrade path. For the single-recipient path we use
// the raw sealed-box ciphertext directly (no envelope) so 1:1 attachments stay
// trivially small.
//
// Format detection on decrypt:
//   - Try to parse as envelope JSON. If that succeeds AND has the expected
//     fields, treat as multi-recipient envelope.
//   - Otherwise, treat as a raw single-recipient sealed box.
//
// This is a foundation primitive — no message-UI wiring yet. See E2EE-NOTES.md
// for the v1.1 media wiring plan.
// ─────────────────────────────────────────────────────────────────────────────

interface EnvelopeV1 {
  v: 1;
  mime: string;
  originalSize: number;
  nonce: string;
  body: string;
  encryptedKey: Record<string, string>;
}

function isEnvelopeV1(value: unknown): value is EnvelopeV1 {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<EnvelopeV1>;
  return (
    v.v === 1 &&
    typeof v.mime === 'string' &&
    typeof v.originalSize === 'number' &&
    typeof v.nonce === 'string' &&
    typeof v.body === 'string' &&
    !!v.encryptedKey &&
    typeof v.encryptedKey === 'object'
  );
}

/**
 * Encrypt a file blob with libsodium sealed boxes addressed to one or more
 * recipient public keys.
 *
 * For a single recipient, returns a base64 sealed-box of the raw file bytes.
 * For multiple recipients, returns a base64-encoded JSON envelope with one
 * shared symmetric ciphertext and one sealed-box-wrapped symmetric key per
 * recipient.
 *
 * Size grows by ~33% (base64) plus libsodium overhead (sealed-box adds 48
 * bytes; secretbox adds 16-byte MAC + 24-byte nonce stored in the envelope).
 */
export async function encryptFileForRecipients(
  file: File,
  recipientPublicKeysB64: string[],
): Promise<{ ciphertextB64: string; mimeType: string; originalSize: number }> {
  if (recipientPublicKeysB64.length === 0) {
    throw new Error('encryptFileForRecipients: at least one recipient public key required');
  }
  const so = await ensureSodium();
  const fileBytes = new Uint8Array(await file.arrayBuffer());
  const mimeType = file.type || 'application/octet-stream';
  const originalSize = file.size;

  // Single-recipient fast path: raw sealed box, no envelope.
  if (recipientPublicKeysB64.length === 1) {
    const recipientPk = so.from_base64(recipientPublicKeysB64[0], so.base64_variants.ORIGINAL);
    const ciphertext = so.crypto_box_seal(fileBytes, recipientPk);
    const ciphertextB64 = so.to_base64(ciphertext, so.base64_variants.ORIGINAL);
    return { ciphertextB64, mimeType, originalSize };
  }

  // Multi-recipient: symmetric body + per-recipient sealed-box-of-key envelope.
  const symmetricKey = so.crypto_secretbox_keygen();
  const nonce = so.randombytes_buf(so.crypto_secretbox_NONCEBYTES);
  const bodyCipher = so.crypto_secretbox_easy(fileBytes, nonce, symmetricKey);

  const encryptedKey: Record<string, string> = {};
  for (const pubKeyB64 of recipientPublicKeysB64) {
    const recipientPk = so.from_base64(pubKeyB64, so.base64_variants.ORIGINAL);
    const wrappedKey = so.crypto_box_seal(symmetricKey, recipientPk);
    encryptedKey[pubKeyB64] = so.to_base64(wrappedKey, so.base64_variants.ORIGINAL);
  }

  const envelope: EnvelopeV1 = {
    v: 1,
    mime: mimeType,
    originalSize,
    nonce: so.to_base64(nonce, so.base64_variants.ORIGINAL),
    body: so.to_base64(bodyCipher, so.base64_variants.ORIGINAL),
    encryptedKey,
  };
  const envelopeJson = JSON.stringify(envelope);
  const ciphertextB64 = so.to_base64(
    new TextEncoder().encode(envelopeJson),
    so.base64_variants.ORIGINAL,
  );
  return { ciphertextB64, mimeType, originalSize };
}

/**
 * Decrypt a ciphertext blob downloaded from Supabase Storage. Returns a Blob
 * the renderer can display via URL.createObjectURL(), or null on failure
 * (key missing, ciphertext corrupt, recipient not in the envelope).
 */
export async function decryptFileWithOwnKey(
  ciphertextB64: string,
  ownPublicKeyB64: string,
  ownPrivateKeyB64: string,
): Promise<Blob | null> {
  const so = await ensureSodium();
  let ownPk: Uint8Array;
  let ownSk: Uint8Array;
  try {
    ownPk = so.from_base64(ownPublicKeyB64, so.base64_variants.ORIGINAL);
    ownSk = so.from_base64(ownPrivateKeyB64, so.base64_variants.ORIGINAL);
  } catch {
    return null;
  }

  // First, try to parse as a multi-recipient envelope.
  let envelopeBytes: Uint8Array;
  try {
    envelopeBytes = so.from_base64(ciphertextB64, so.base64_variants.ORIGINAL);
  } catch {
    return null;
  }

  let envelope: unknown = null;
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(envelopeBytes);
    envelope = JSON.parse(text);
  } catch {
    envelope = null;
  }

  if (isEnvelopeV1(envelope)) {
    const wrappedKeyB64 = envelope.encryptedKey[ownPublicKeyB64];
    if (!wrappedKeyB64) {
      // No envelope entry addressed to this user.
      return null;
    }
    try {
      const wrappedKey = so.from_base64(wrappedKeyB64, so.base64_variants.ORIGINAL);
      const symmetricKey = so.crypto_box_seal_open(wrappedKey, ownPk, ownSk);
      const nonce = so.from_base64(envelope.nonce, so.base64_variants.ORIGINAL);
      const body = so.from_base64(envelope.body, so.base64_variants.ORIGINAL);
      const plaintextBytes = so.crypto_secretbox_open_easy(body, nonce, symmetricKey);
      return new Blob([plaintextBytes], { type: envelope.mime });
    } catch {
      return null;
    }
  }

  // Otherwise treat as a raw single-recipient sealed box of the file bytes.
  try {
    const plaintextBytes = so.crypto_box_seal_open(envelopeBytes, ownPk, ownSk);
    // We don't know the original MIME type for this path — caller must track
    // it out-of-band (stored alongside the ciphertext URL in the message row).
    return new Blob([plaintextBytes]);
  } catch {
    return null;
  }
}
