import sodium from 'libsodium-wrappers';

let _ready: Promise<void> | null = null;

export async function ensureSodium(): Promise<typeof sodium> {
  if (!_ready) {
    _ready = sodium.ready;
  }
  await _ready;
  return sodium;
}

const PRIVATE_KEY_LS_KEY = 'frqncy.nrg.encrypted_messaging.private_key.b64';

/**
 * Generate a libsodium box keypair (X25519 for sealed-box encryption).
 * Returns base64-encoded public + private keys. Caller must persist the
 * public key to profiles.encryption_public_key (Supabase) and the private
 * key to localStorage. IMPORTANT: if the user clears localStorage, all
 * past messages encrypted to that public key are unrecoverable.
 */
export async function generateMessagingKeypair(): Promise<{
  publicKeyB64: string;
  privateKeyB64: string;
}> {
  const so = await ensureSodium();
  const kp = so.crypto_box_keypair();
  return {
    publicKeyB64: so.to_base64(kp.publicKey, so.base64_variants.ORIGINAL),
    privateKeyB64: so.to_base64(kp.privateKey, so.base64_variants.ORIGINAL),
  };
}

/** Persist private key to localStorage (only the user's own browser sees this). */
export function savePrivateKeyLocal(privateKeyB64: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PRIVATE_KEY_LS_KEY, privateKeyB64);
}

/** Load private key from localStorage. Returns null if missing. */
export function loadPrivateKeyLocal(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(PRIVATE_KEY_LS_KEY);
}

/**
 * Encrypt plaintext to a recipient's public key using libsodium sealed boxes.
 * Sealed boxes use ephemeral sender keypairs — no metadata about who sent it
 * is in the ciphertext. Only the recipient (with their private key) can
 * decrypt. Returns base64 ciphertext.
 *
 * Limitations: no forward secrecy (compromising the recipient's key reveals
 * all past messages), no sender authentication (anyone can encrypt to a
 * public key — combine with a signature if sender attestation matters).
 */
export async function encryptToPublicKey(
  plaintext: string,
  recipientPublicKeyB64: string,
): Promise<string> {
  const so = await ensureSodium();
  const recipientPk = so.from_base64(recipientPublicKeyB64, so.base64_variants.ORIGINAL);
  const ciphertext = so.crypto_box_seal(plaintext, recipientPk);
  return so.to_base64(ciphertext, so.base64_variants.ORIGINAL);
}

/** Decrypt a sealed-box ciphertext using own keypair. Returns plaintext or null on failure. */
export async function decryptFromSealedBox(
  ciphertextB64: string,
  ownPublicKeyB64: string,
  ownPrivateKeyB64: string,
): Promise<string | null> {
  const so = await ensureSodium();
  try {
    const ct = so.from_base64(ciphertextB64, so.base64_variants.ORIGINAL);
    const pk = so.from_base64(ownPublicKeyB64, so.base64_variants.ORIGINAL);
    const sk = so.from_base64(ownPrivateKeyB64, so.base64_variants.ORIGINAL);
    const plaintext = so.crypto_box_seal_open(ct, pk, sk);
    return new TextDecoder().decode(plaintext);
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Signing keys (Ed25519) — separate from the encryption keys above.
//
// Used for the Hybrid signed-message mirror (per proposals/NRG-ONCHAIN-PIVOT.md
// section 7). Every post + follow gets signed by its author's Ed25519 private
// key on creation. The signature is stored alongside the row. A future export
// endpoint can serve `(record, signature)` pairs to any compatible network
// (ATProto, Farcaster, custom) — the signature is what makes the record
// portable independent of FRQNCY's database.
//
// Same key-loss caveat as encryption keys: localStorage is the only place the
// private key lives. The keys panel at /social/profile/keys/ exposes both
// keys in the same backup file.
// ─────────────────────────────────────────────────────────────────────────────

const SIGNING_KEY_LS_KEY = 'frqncy.nrg.signing.private_key.b64';

/**
 * Generate a libsodium Ed25519 signing keypair. Distinct from the encryption
 * (X25519) keypair — Ed25519 is the signature-friendly curve, X25519 is the
 * encryption-friendly one. Most modern systems pair them.
 */
export async function generateSigningKeypair(): Promise<{
  publicKeyB64: string;
  privateKeyB64: string;
}> {
  const so = await ensureSodium();
  const kp = so.crypto_sign_keypair();
  return {
    publicKeyB64: so.to_base64(kp.publicKey, so.base64_variants.ORIGINAL),
    privateKeyB64: so.to_base64(kp.privateKey, so.base64_variants.ORIGINAL),
  };
}

export function saveSigningPrivateKeyLocal(privateKeyB64: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SIGNING_KEY_LS_KEY, privateKeyB64);
}

export function loadSigningPrivateKeyLocal(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(SIGNING_KEY_LS_KEY);
}

/**
 * Sign a string payload with the user's Ed25519 private key. Returns base64
 * detached signature. The verifier needs the signer's public key + the same
 * exact payload bytes to verify.
 *
 * Caller is responsible for serializing records canonically (sorted keys,
 * stable JSON) before signing — `canonicalizeForSigning` below is the shared
 * helper.
 */
export async function signPayload(
  payload: string,
  privateKeyB64: string,
): Promise<string> {
  const so = await ensureSodium();
  const sk = so.from_base64(privateKeyB64, so.base64_variants.ORIGINAL);
  const sig = so.crypto_sign_detached(payload, sk);
  return so.to_base64(sig, so.base64_variants.ORIGINAL);
}

/** Verify a detached signature. Returns true if the signature matches. */
export async function verifySignature(
  payload: string,
  signatureB64: string,
  publicKeyB64: string,
): Promise<boolean> {
  const so = await ensureSodium();
  try {
    const sig = so.from_base64(signatureB64, so.base64_variants.ORIGINAL);
    const pk = so.from_base64(publicKeyB64, so.base64_variants.ORIGINAL);
    return so.crypto_sign_verify_detached(sig, payload, pk);
  } catch {
    return false;
  }
}

/**
 * Canonicalize a record for signing. Sorts object keys and uses stable JSON
 * stringification so the verifier reproduces exactly the same bytes the
 * signer signed. Arrays preserve order. Nested objects are canonicalized
 * recursively.
 */
export function canonicalizeForSigning(record: unknown): string {
  return JSON.stringify(record, function replacer(_key: string, value: unknown) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const sorted: Record<string, unknown> = {};
      for (const k of Object.keys(value as Record<string, unknown>).sort()) {
        sorted[k] = (value as Record<string, unknown>)[k];
      }
      return sorted;
    }
    return value;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Backup file format — exports both keypairs at once.
//
// We use a single portable .txt that the user downloads from the keys panel.
// This way they have one file to keep, not two, and migration to a new device
// restores both encryption and signing identity in one step.
// ─────────────────────────────────────────────────────────────────────────────

interface KeyBackupV1 {
  v: 1;
  encryption_private_key_b64: string;
  signing_private_key_b64: string | null;
  exported_at: string;
}

export function exportKeyBackup(): string | null {
  const enc = loadPrivateKeyLocal();
  if (!enc) return null;
  const sign = loadSigningPrivateKeyLocal();
  const payload: KeyBackupV1 = {
    v: 1,
    encryption_private_key_b64: enc,
    signing_private_key_b64: sign,
    exported_at: new Date().toISOString(),
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * Trigger a browser download of the user's key backup as a `.txt`. Wraps
 * `exportKeyBackup` and prepends the documented CSV-style header comments
 * so the file is human-skimmable. Returns `true` if a backup was actually
 * produced (i.e. the user had at least an encryption private key locally),
 * `false` otherwise. Caller is responsible for surfacing UI on failure.
 *
 * Same byte-for-byte output as the original handleDownload in
 * EncryptionKeysPanel — extracted so the first-run welcome modal can offer
 * a one-click backup without duplicating the file format.
 */
export function downloadKeyBackupFile(username: string): boolean {
  if (typeof window === 'undefined') return false;
  const backup = exportKeyBackup();
  if (!backup) return false;
  const safeUsername = username || 'frqncy';
  const blob = new Blob(
    [
      `# FRQNCY NRG — key backup (encryption + signing)\n`,
      `# User: ${safeUsername}\n`,
      `# Date: ${new Date().toISOString()}\n`,
      `# This file unlocks every message you've received and lets you continue\n`,
      `# signing posts as you. Keep it like a password — anyone with this file\n`,
      `# can read your DMs AND post as you (if they also have a Supabase session).\n`,
      `# Store it in a password manager (1Password, Bitwarden) or a secure offline vault.\n`,
      `\n`,
      `${backup}\n`,
    ].join(''),
    { type: 'text/plain' },
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `frqncy-nrg-keys-${safeUsername}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}

export function importKeyBackup(json: string): { ok: true } | { ok: false; reason: string } {
  try {
    const parsed = JSON.parse(json) as Partial<KeyBackupV1>;
    if (parsed.v !== 1) {
      return { ok: false, reason: `Unsupported backup version: ${parsed.v}` };
    }
    if (!parsed.encryption_private_key_b64) {
      return { ok: false, reason: 'Backup missing encryption_private_key_b64' };
    }
    savePrivateKeyLocal(parsed.encryption_private_key_b64);
    if (parsed.signing_private_key_b64) {
      saveSigningPrivateKeyLocal(parsed.signing_private_key_b64);
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, reason: `Backup parse failed: ${err?.message ?? 'unknown error'}` };
  }
}
