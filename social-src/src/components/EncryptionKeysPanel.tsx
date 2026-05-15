// Encryption keys panel — backup, restore, regenerate.
//
// Lives at /social/profile/keys/. Surfaces the user's libsodium messaging
// keypair status and gives them three actions:
//
//   1. Download private key as .txt — the only way to survive a localStorage
//      wipe or move to a new device. Without this, key loss = message loss.
//   2. Import private key from .txt — restore on a new device.
//   3. Regenerate keypair — destructive: invalidates all past encrypted
//      messages. Confirms with a typed phrase before doing it.
//
// Also shows the wallet + Privy DID for completeness.
//
// This panel is the load-bearing UX for the v1 sealed-box scheme. v2 (Signal-
// style double ratchet) reduces the cost of key loss but doesn't eliminate it.

import { useState, useEffect } from 'preact/hooks';
import { useAuth } from './AuthProvider';
import { supabase } from '../lib/supabase';
import {
  ensureSodium,
  generateMessagingKeypair,
  generateSigningKeypair,
  savePrivateKeyLocal,
  loadPrivateKeyLocal,
  saveSigningPrivateKeyLocal,
  loadSigningPrivateKeyLocal,
  downloadPassphraseBackupFile,
  importPassphraseBackup,
  isPassphraseWrappedBackup,
} from '../lib/crypto';

// Minimum passphrase length — short enough to be memorable, long enough that
// brute-forcing past Argon2id INTERACTIVE limits is infeasible for casual
// attackers. Users who want stronger should be guided by the strength meter.
const MIN_PASSPHRASE_LEN = 12;

/**
 * Lightweight passphrase strength meter — returns a 0..4 score and a label.
 * Not a substitute for zxcvbn; just enough signal to nudge users away from
 * "password123". We weight length heavily because Argon2id makes a 16+ char
 * passphrase astronomically harder to brute-force than a short one.
 */
function passphraseStrength(pass: string): { score: 0 | 1 | 2 | 3 | 4; label: string } {
  if (!pass) return { score: 0, label: 'empty' };
  let score = 0;
  if (pass.length >= 8) score++;
  if (pass.length >= 12) score++;
  if (pass.length >= 20) score++;
  if (/[a-z]/.test(pass) && /[A-Z]/.test(pass) && /[0-9]/.test(pass)) score++;
  if (/[^A-Za-z0-9]/.test(pass)) score++;
  const clamped = Math.min(4, score) as 0 | 1 | 2 | 3 | 4;
  const labels = ['empty', 'very weak', 'weak', 'fair', 'strong', 'very strong'];
  return { score: clamped, label: labels[Math.min(clamped + 1, labels.length - 1)] };
}

// localStorage flag set when the user has actually downloaded a backup OR
// imported a backup file (both prove they have a copy somewhere). Read by
// NavAuth + FirstRunWelcome to decide whether to keep nagging.
const BACKUP_ACK_LS_KEY = 'frqncy.nrg.backup_acknowledged';

export default function EncryptionKeysPanel() {
  const { user, profile, loading } = useAuth();
  const [hasLocalKey, setHasLocalKey] = useState(false);
  const [confirmRegen, setConfirmRegen] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // Backup passphrase modal — opened by "Download backup". Two password
  // inputs (passphrase + confirm) and a strength meter. Closed without
  // emitting a file if the user cancels.
  const [backupModalOpen, setBackupModalOpen] = useState(false);
  const [backupPass, setBackupPass] = useState('');
  const [backupPassConfirm, setBackupPassConfirm] = useState('');
  const [backupModalError, setBackupModalError] = useState('');

  // Import passphrase modal — opened when the user picks a v2 backup file.
  // Holds the parsed (still-encrypted) blob + the user's typed passphrase.
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importPass, setImportPass] = useState('');
  const [importModalError, setImportModalError] = useState('');
  // Pending parsed v2 blob waiting for passphrase decryption.
  const [pendingImportBlob, setPendingImportBlob] = useState<any | null>(null);

  // Nostr identity (optional federation surface). See
  // proposals/NRG-EXPERT-CRITIQUE-2026-05-14.md Tier 2 #11 + Nostr expert
  // critique. The private key is held in localStorage; the public key + opt-in
  // flag persist to profiles.nostr_pubkey + nostr_publish_enabled
  // (supabase/migrations/021_nostr_publish.sql). Generation is gated behind
  // an explicit user click — never auto-generated.
  const NOSTR_LS_KEY = 'frqncy.nrg.nostr.privkey';
  const [nostrNpub, setNostrNpub] = useState<string | null>(null);
  const [nostrEnabled, setNostrEnabled] = useState<boolean>(false);
  const [nostrBusy, setNostrBusy] = useState(false);
  const [nostrMessage, setNostrMessage] = useState('');
  const [nostrError, setNostrError] = useState(false);
  const [nostrConfirmRegen, setNostrConfirmRegen] = useState('');

  useEffect(() => {
    setHasLocalKey(!!loadPrivateKeyLocal());
  }, [profile]);

  // Hydrate Nostr identity state from the profile row + localStorage.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const pub = (profile as any)?.nostr_pubkey ?? null;
    const enabled = !!(profile as any)?.nostr_publish_enabled;
    setNostrEnabled(enabled);
    if (pub) {
      // Lazy-import to avoid loading the bech32/secp256k1 helper module on
      // panels that don't need it.
      import('../lib/nostr-publish').then((mod) => {
        try {
          setNostrNpub(mod.publicKeyToNpub(pub));
        } catch {
          setNostrNpub(null);
        }
      });
    } else {
      setNostrNpub(null);
    }
  }, [profile]);

  const handleGenerateNostr = async () => {
    if (!user) return;
    setNostrBusy(true);
    setNostrMessage('');
    setNostrError(false);
    try {
      const mod = await import('../lib/nostr-publish');
      const result = await mod.generateNostrKeypair();
      if (!('publicKeyHex' in result)) {
        setNostrError(true);
        setNostrMessage(
          `Couldn't generate a Nostr key: ${result.reason}. Run \`npm install @noble/curves@^1.4.0\` in social-src/ to enable Nostr publishing.`,
        );
        return;
      }
      // Persist private key to localStorage (browser-only, never to the server)
      window.localStorage.setItem(NOSTR_LS_KEY, result.privateKeyHex);
      // Write pubkey + enable opt-in to profiles
      const { error } = await supabase
        .from('profiles')
        .update({ nostr_pubkey: result.publicKeyHex, nostr_publish_enabled: true })
        .eq('id', user.id);
      if (error) {
        setNostrError(true);
        setNostrMessage(`Saved locally, but profile update failed: ${error.message}. Apply migration 021 in Supabase.`);
        return;
      }
      setNostrNpub(result.npub);
      setNostrEnabled(true);
      setNostrMessage('Nostr identity generated. Your posts will now also publish to relay.damus.io, nos.lol, relay.snort.social.');
    } catch (e: any) {
      setNostrError(true);
      setNostrMessage(e?.message || 'Nostr keygen failed.');
    } finally {
      setNostrBusy(false);
    }
  };

  const handleToggleNostr = async (next: boolean) => {
    if (!user) return;
    setNostrBusy(true);
    setNostrMessage('');
    setNostrError(false);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ nostr_publish_enabled: next })
        .eq('id', user.id);
      if (error) {
        setNostrError(true);
        setNostrMessage(error.message);
        return;
      }
      setNostrEnabled(next);
      setNostrMessage(next ? 'Nostr publishing enabled.' : 'Nostr publishing paused. Your identity stays — flip it back any time.');
    } finally {
      setNostrBusy(false);
    }
  };

  const handleRegenNostr = async () => {
    if (!user || nostrConfirmRegen !== 'regenerate') return;
    setNostrBusy(true);
    setNostrMessage('');
    setNostrError(false);
    try {
      const mod = await import('../lib/nostr-publish');
      const result = await mod.generateNostrKeypair();
      if (!('publicKeyHex' in result)) {
        setNostrError(true);
        setNostrMessage(`Regen failed: ${result.reason}`);
        return;
      }
      window.localStorage.setItem(NOSTR_LS_KEY, result.privateKeyHex);
      const { error } = await supabase
        .from('profiles')
        .update({ nostr_pubkey: result.publicKeyHex, nostr_publish_enabled: true })
        .eq('id', user.id);
      if (error) {
        setNostrError(true);
        setNostrMessage(error.message);
        return;
      }
      setNostrNpub(result.npub);
      setNostrEnabled(true);
      setNostrConfirmRegen('');
      setNostrMessage('Regenerated. Old npub no longer signs posts.');
    } finally {
      setNostrBusy(false);
    }
  };

  if (loading) {
    return <p class="text-sm text-text-dim">Loading…</p>;
  }

  if (!user) {
    return (
      <div class="rounded-xl bg-card-bg border border-card-border p-6">
        <p class="text-sm text-text-dim">
          Sign in to manage your encryption keys.{' '}
          <a href="/social/login" class="text-gold underline">Sign in →</a>
        </p>
      </div>
    );
  }

  const remotePub = (profile as any)?.encryption_public_key ?? null;
  const remoteSigningPub = (profile as any)?.signing_public_key ?? null;
  const hasLocalSigningKey = !!loadSigningPrivateKeyLocal();
  const wallet = (profile as any)?.wallet_address ?? null;
  const privyDid = (profile as any)?.privy_did ?? null;

  const status: 'healthy' | 'new-device' | 'no-keys' =
    hasLocalKey && remotePub
      ? 'healthy'
      : remotePub && !hasLocalKey
        ? 'new-device'
        : 'no-keys';

  const flash = (msg: string, error = false) => {
    setMessage(msg);
    setIsError(error);
    setTimeout(() => setMessage(''), 6000);
  };

  // "Download backup" — open the passphrase modal. Actual file emission
  // happens in handleConfirmBackup once the user types + confirms a passphrase.
  const handleDownload = () => {
    if (!hasLocalKey) {
      flash('No private key in this browser to download.', true);
      return;
    }
    setBackupPass('');
    setBackupPassConfirm('');
    setBackupModalError('');
    setBackupModalOpen(true);
  };

  const handleCancelBackup = () => {
    setBackupModalOpen(false);
    setBackupPass('');
    setBackupPassConfirm('');
    setBackupModalError('');
  };

  const handleConfirmBackup = async () => {
    setBackupModalError('');
    if (backupPass.length < MIN_PASSPHRASE_LEN) {
      setBackupModalError(`Passphrase must be at least ${MIN_PASSPHRASE_LEN} characters.`);
      return;
    }
    if (backupPass !== backupPassConfirm) {
      setBackupModalError('Passphrases do not match.');
      return;
    }
    setBusy(true);
    try {
      const username = profile?.username || 'frqncy';
      const ok = await downloadPassphraseBackupFile(username, backupPass, {
        encryption_public_key_b64: remotePub ?? undefined,
        signing_public_key_b64: remoteSigningPub ?? undefined,
      });
      if (!ok) {
        setBackupModalError('No private key in this browser to download.');
        return;
      }
      // Mark backup acknowledged — user has the encrypted file. Clears the
      // amber dot in NavAuth and the welcome modal's nag state.
      try {
        window.localStorage.setItem(BACKUP_ACK_LS_KEY, '1');
      } catch (_) {
        // localStorage write can fail in private mode — non-fatal.
      }
      // Clear inputs before unmounting the modal so passphrase isn't left in
      // component state any longer than necessary.
      setBackupPass('');
      setBackupPassConfirm('');
      setBackupModalOpen(false);
      flash('Encrypted backup downloaded. Store the passphrase somewhere safe — FRQNCY cannot recover it.');
    } catch (err: any) {
      setBackupModalError(err?.message ?? 'Backup failed.');
    } finally {
      setBusy(false);
    }
  };

  // Shared validator: given a candidate `encPrivB64` (+ optional `signPrivB64`),
  // derive the matching pubkeys and confirm they line up with the profile's
  // stored pubkeys. Returns `{ derivedEncPubB64, derivedSignPubB64 }` on
  // success or null after surfacing an error via flash().
  const validateAndPersistInnerKeys = async (
    encPrivB64: string,
    signPrivB64: string | null,
    profileEncPub: string | null,
    profileSignPub: string | null,
  ): Promise<boolean> => {
    const so = await ensureSodium();

    let derivedEncPubB64: string;
    try {
      const encPrivBytes = so.from_base64(encPrivB64, so.base64_variants.ORIGINAL);
      const derivedEncPub = so.crypto_scalarmult_base(encPrivBytes);
      derivedEncPubB64 = so.to_base64(derivedEncPub, so.base64_variants.ORIGINAL);
    } catch (err: any) {
      flash(`Could not parse encryption private key: ${err?.message ?? 'invalid key bytes'}`, true);
      return false;
    }

    const encCorrupted = !profileEncPub;
    if (!encCorrupted && derivedEncPubB64 !== profileEncPub) {
      flash(
        'This backup belongs to a different account. Imported public key does not match this profile\'s stored public key. If you want to use a different identity, log in to that account first.',
        true,
      );
      return false;
    }

    let derivedSignPubB64: string | null = null;
    if (signPrivB64) {
      try {
        const signPrivBytes = so.from_base64(signPrivB64, so.base64_variants.ORIGINAL);
        const derivedSignPub = so.crypto_sign_ed25519_sk_to_pk(signPrivBytes);
        derivedSignPubB64 = so.to_base64(derivedSignPub, so.base64_variants.ORIGINAL);
      } catch (err: any) {
        flash(`Could not parse signing private key: ${err?.message ?? 'invalid key bytes'}`, true);
        return false;
      }
      if (profileSignPub && derivedSignPubB64 !== profileSignPub) {
        flash(
          'This backup belongs to a different account. Imported signing public key does not match this profile\'s stored signing public key. If you want to use a different identity, log in to that account first.',
          true,
        );
        return false;
      }
    }

    savePrivateKeyLocal(encPrivB64);
    if (signPrivB64) {
      saveSigningPrivateKeyLocal(signPrivB64);
    }

    // If the profile was missing its pubkey(s), write the derived one(s) up.
    const profileUpdate: Record<string, string> = {};
    if (!profileEncPub) profileUpdate.encryption_public_key = derivedEncPubB64;
    if (!profileSignPub && derivedSignPubB64) profileUpdate.signing_public_key = derivedSignPubB64;
    if (Object.keys(profileUpdate).length > 0 && user) {
      const { error: upErr } = await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('id', user.id);
      if (upErr) {
        console.warn('[encryption] failed to write derived pubkey(s) to profile:', upErr.message);
      }
    }

    setHasLocalKey(true);
    try { window.localStorage.setItem(BACKUP_ACK_LS_KEY, '1'); } catch (_) {}
    return true;
  };

  const handleImport = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const text = await file.text();
      // Strip header comments — the body should be either a JSON backup
      // (v1 plaintext or v2 passphrase-wrapped) or a single base64 line
      // (legacy single-key format).
      const stripped = text
        .split('\n')
        .filter((l) => !l.trim().startsWith('#') && !l.trim().startsWith('```'))
        .join('\n')
        .trim();

      // Pull the latest pubkeys from the profile so a stale auth snapshot
      // can't let a mismatched backup slip through.
      let profileEncPub: string | null = remotePub;
      let profileSignPub: string | null = remoteSigningPub;
      try {
        const { data, error: fetchErr } = await supabase
          .from('profiles')
          .select('encryption_public_key, signing_public_key')
          .eq('id', user.id)
          .single();
        if (!fetchErr && data) {
          profileEncPub = (data as any).encryption_public_key ?? null;
          profileSignPub = (data as any).signing_public_key ?? null;
        }
      } catch (_) {
        // Non-fatal — fall back to the snapshot from useAuth().
      }

      // JSON path — could be v1 (plaintext) or v2 (passphrase-wrapped).
      if (stripped.startsWith('{')) {
        let parsed: any;
        try {
          parsed = JSON.parse(stripped);
        } catch (err: any) {
          flash(`Backup parse failed: ${err?.message ?? 'unknown error'}`, true);
          return;
        }

        // v2 — passphrase-wrapped. Hand off to the import passphrase modal;
        // validation against profile pubkeys happens in handleConfirmImport
        // once we can decrypt the payload.
        if (isPassphraseWrappedBackup(parsed)) {
          setPendingImportBlob(parsed);
          setImportPass('');
          setImportModalError('');
          setImportModalOpen(true);
          return;
        }

        if (parsed?.v !== 1) {
          flash(`Unsupported backup version: ${parsed?.v}`, true);
          return;
        }
        const encPrivB64 = parsed.encryption_private_key_b64;
        const signPrivB64 = parsed.signing_private_key_b64 ?? null;
        if (!encPrivB64) {
          flash('Backup missing encryption_private_key_b64', true);
          return;
        }

        const ok = await validateAndPersistInnerKeys(
          encPrivB64,
          signPrivB64,
          profileEncPub,
          profileSignPub,
        );
        if (!ok) return;
        flash('Keys imported (legacy plaintext backup). This backup was created before passphrase encryption was added — consider downloading a fresh encrypted backup now. Refresh /social/messages/ to decrypt past messages.');
        return;
      }

      // Legacy fallback: single base64 line of just the encryption private key.
      const candidate = stripped
        .split('\n')
        .map((l) => l.trim())
        .find((l) => /^[A-Za-z0-9+/=_-]{40,}$/.test(l));
      if (!candidate) {
        flash('Could not find a valid key in that file. Upload the backup file FRQNCY gave you.', true);
        return;
      }

      const ok = await validateAndPersistInnerKeys(
        candidate,
        null,
        profileEncPub,
        profileSignPub,
      );
      if (!ok) return;
      flash('Encryption key imported (legacy backup — no signing key found). Past encrypted messages should now decrypt.');
    } catch (err: any) {
      flash(err?.message || 'Import failed.', true);
    } finally {
      setBusy(false);
      input.value = '';
    }
  };

  const handleCancelImport = () => {
    setImportModalOpen(false);
    setImportPass('');
    setImportModalError('');
    setPendingImportBlob(null);
  };

  const handleConfirmImport = async () => {
    setImportModalError('');
    if (!pendingImportBlob) {
      setImportModalError('No backup loaded.');
      return;
    }
    if (!importPass) {
      setImportModalError('Enter the passphrase used when this backup was created.');
      return;
    }
    setBusy(true);
    try {
      let inner;
      try {
        // The import library exposes a JSON-string entrypoint; we already
        // parsed, so call wrap/unwrap directly via re-serialization. Easier
        // than threading a second helper for the already-parsed-blob case.
        inner = await importPassphraseBackup(JSON.stringify(pendingImportBlob), importPass);
      } catch (err: any) {
        // Most common path: wrong passphrase. Keep modal open so user can retry.
        setImportModalError(err?.message ?? 'Decryption failed.');
        return;
      }

      // Pull current profile pubkeys fresh — same defensive read as in handleImport.
      let profileEncPub: string | null = remotePub;
      let profileSignPub: string | null = remoteSigningPub;
      try {
        const { data, error: fetchErr } = await supabase
          .from('profiles')
          .select('encryption_public_key, signing_public_key')
          .eq('id', user.id)
          .single();
        if (!fetchErr && data) {
          profileEncPub = (data as any).encryption_public_key ?? null;
          profileSignPub = (data as any).signing_public_key ?? null;
        }
      } catch (_) {
        // Non-fatal.
      }

      const ok = await validateAndPersistInnerKeys(
        inner.encryption_private_key_b64,
        inner.signing_private_key_b64 || null,
        profileEncPub,
        profileSignPub,
      );
      if (!ok) {
        // validator surfaces its own error message via flash() — close the
        // modal so that flash is visible.
        handleCancelImport();
        return;
      }

      handleCancelImport();
      flash('Keys imported (encryption + signing). Refresh /social/messages/ to decrypt past messages.');
    } finally {
      setBusy(false);
    }
  };

  const handleRegenerate = async () => {
    if (confirmRegen.trim().toLowerCase() !== 'regenerate') {
      flash('Type "regenerate" exactly to confirm. This will make all past encrypted messages unreadable AND invalidate every past signature.', true);
      return;
    }
    setBusy(true);
    try {
      // Regenerate BOTH keys — they're a paired identity. Past encrypted
      // messages are unreadable; past signatures stay verifiable (with the
      // old public key — but that's not on the profile anymore so verifiers
      // querying current state will report "unknown signer" for old posts).
      const enc = await generateMessagingKeypair();
      const sign = await generateSigningKeypair();
      savePrivateKeyLocal(enc.privateKeyB64);
      saveSigningPrivateKeyLocal(sign.privateKeyB64);
      const { error } = await supabase
        .from('profiles')
        .update({
          encryption_public_key: enc.publicKeyB64,
          signing_public_key: sign.publicKeyB64,
        })
        .eq('id', user.id);
      if (error) throw error;
      setHasLocalKey(true);
      setConfirmRegen('');
      flash('New keypairs generated. Past messages encrypted to the old key are no longer readable; new posts are signed with the new identity.');
    } catch (err: any) {
      flash(err?.message || 'Regenerate failed.', true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div class="space-y-6">
      {/* Status card */}
      <div class="rounded-xl bg-card-bg border border-card-border p-6">
        <h2 class="font-heading text-xl text-gold mb-4">Encryption status</h2>
        <StatusRow label="Encryption public key (on FRQNCY)" value={remotePub ? short(remotePub) : 'not set'} ok={!!remotePub} />
        <StatusRow label="Encryption private key (in this browser)" value={hasLocalKey ? 'present' : 'missing'} ok={hasLocalKey} />
        <StatusRow label="Signing public key (on FRQNCY)" value={remoteSigningPub ? short(remoteSigningPub) : 'not set'} ok={!!remoteSigningPub} />
        <StatusRow label="Signing private key (in this browser)" value={hasLocalSigningKey ? 'present' : 'missing'} ok={hasLocalSigningKey} />
        <StatusRow label="Wallet" value={wallet ? short(wallet) : 'not linked'} neutral />
        <StatusRow label="Privy identity" value={privyDid ? short(privyDid) : 'not linked'} neutral />

        {status === 'healthy' && (
          <p class="mt-4 text-sm text-gold-light">
            ◊ End-to-end encryption is active. Anyone you message who also has a key set up will get encrypted DMs.
          </p>
        )}
        {status === 'new-device' && (
          <p class="mt-4 text-sm text-amber-200/90">
            This browser doesn't have your private key. Past encrypted messages can't be read here until you import the key file you downloaded earlier. Or regenerate (loses past messages).
          </p>
        )}
        {status === 'no-keys' && (
          <p class="mt-4 text-sm text-text-dim">
            No keypair yet. One is being generated in the background; refresh in a moment.
          </p>
        )}
      </div>

      {/* Actions */}
      <div class="rounded-xl bg-card-bg border border-card-border p-6 space-y-5">
        <div>
          <h3 class="font-heading text-lg text-gold mb-1">1. Download backup</h3>
          <p class="text-xs text-text-dim mb-3">
            Encrypts your keys with a passphrase you choose, then downloads the encrypted file. Safe to email to yourself, store in iCloud / Drive, or print — without the passphrase the file is useless.
          </p>
          <button
            type="button"
            onClick={handleDownload}
            disabled={!hasLocalKey || busy}
            class="px-4 py-2 rounded-lg bg-gold text-navy text-sm font-medium hover:bg-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Download encrypted backup
          </button>
        </div>

        <div class="border-t border-card-border pt-5">
          <h3 class="font-heading text-lg text-gold mb-1">2. Import on a new device</h3>
          <p class="text-xs text-text-dim mb-3">
            Already have your backup file from another browser or device? Upload it here to decrypt past messages on this one. We'll ask for the passphrase if the backup is encrypted.
          </p>
          <input
            type="file"
            accept=".txt,.json,.frqbak,text/plain,application/json"
            onChange={handleImport}
            disabled={busy}
            class="block text-xs text-text-dim file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-navy-mid file:text-text file:text-xs file:hover:bg-navy-mid/80 file:cursor-pointer"
          />
        </div>

        <div class="border-t border-card-border pt-5">
          <h3 class="font-heading text-lg text-amber-300 mb-1">3. Regenerate keypair</h3>
          <p class="text-xs text-text-dim mb-3">
            Fresh keypair. Useful if you think your old key is compromised. <strong class="text-amber-300">Destructive:</strong> every encrypted message you've received with the old key becomes unreadable forever. Type{' '}
            <code class="px-1 py-0.5 rounded bg-navy-mid text-amber-200">regenerate</code> below to confirm.
          </p>
          <div class="flex gap-2">
            <input
              type="text"
              value={confirmRegen}
              onInput={(e) => setConfirmRegen((e.target as HTMLInputElement).value)}
              placeholder="type: regenerate"
              class="flex-1 bg-navy-mid border border-card-border rounded-lg px-3 py-2 text-sm text-text placeholder-text-dim focus:outline-none focus:border-amber-500/40"
            />
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={busy || confirmRegen.trim().toLowerCase() !== 'regenerate'}
              class="px-4 py-2 rounded-lg border border-amber-500/40 text-amber-200 text-sm font-medium hover:bg-amber-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Regenerate
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div class={`rounded-lg px-4 py-3 text-sm ${
          isError
            ? 'text-red-400 bg-red-500/5 border border-red-500/20'
            : 'text-gold-light bg-gold/5 border border-gold/20'
        }`}>
          {message}
        </div>
      )}

      <div class="rounded-xl bg-card-bg/50 border border-card-border p-5 text-xs text-text-dim leading-relaxed">
        <p class="font-medium text-text mb-2">How this works</p>
        <p>
          NRG uses libsodium sealed boxes — your messages are encrypted in your browser before they leave your device. The server stores ciphertext only. Only your private key can decrypt.
        </p>
        <p class="mt-2">
          Backups are wrapped with Argon2id-derived encryption using a passphrase you choose. FRQNCY never sees the passphrase and cannot recover it. v1 has no forward secrecy: compromising your private key reveals every past message. v2 will add Signal-style ratcheting. See{' '}
          <a href="https://github.com/0rli-E/frqncy-website/blob/main/social-src/E2EE-NOTES.md" class="underline hover:text-gold">E2EE-NOTES.md</a>.
        </p>
      </div>

      {/* ─── Nostr identity (optional federation surface) ─────────────── */}
      <div class="mt-6 rounded-xl border border-card-border bg-card-bg p-5">
        <div class="flex items-start justify-between gap-3 mb-3">
          <div>
            <p class="font-medium text-text">Nostr publishing</p>
            <p class="text-xs text-text-dim mt-0.5">optional · federation surface</p>
          </div>
          {nostrNpub ? (
            <span class={`text-[10px] uppercase tracking-wider px-2 py-1 rounded ${nostrEnabled ? 'bg-gold/10 text-gold border border-gold/30' : 'bg-card-bg text-text-dim border border-card-border'}`}>
              {nostrEnabled ? 'live' : 'paused'}
            </span>
          ) : null}
        </div>

        {!nostrNpub ? (
          <>
            <p class="text-sm text-text-dim leading-relaxed mb-3">
              Generate a Nostr identity to also publish your posts to public relays (relay.damus.io, nos.lol, relay.snort.social). This is a separate secp256k1 keypair from your libsodium messaging keys — it lives in your browser only.
            </p>
            <button
              type="button"
              onClick={handleGenerateNostr}
              disabled={nostrBusy}
              class="px-4 py-2 text-sm rounded-lg bg-gold/15 border border-gold/40 text-gold hover:bg-gold/25 disabled:opacity-50 transition-colors"
            >
              {nostrBusy ? 'Generating…' : 'Generate Nostr identity'}
            </button>
          </>
        ) : (
          <>
            <p class="text-sm text-text-dim mb-2">
              Your Nostr public identifier (anyone can use this to find your published posts on Nostr clients):
            </p>
            <div class="font-mono text-xs text-gold bg-navy-mid border border-card-border rounded-lg p-3 mb-3 break-all select-all">
              {nostrNpub}
            </div>

            <div class="flex flex-wrap gap-2 items-center">
              <button
                type="button"
                onClick={() => handleToggleNostr(!nostrEnabled)}
                disabled={nostrBusy}
                class="px-3 py-1.5 text-xs rounded-lg border border-card-border text-text hover:border-gold/40 disabled:opacity-50 transition-colors"
              >
                {nostrEnabled ? 'Pause publishing' : 'Resume publishing'}
              </button>

              <details class="text-xs">
                <summary class="cursor-pointer text-text-dim hover:text-text transition-colors px-2 py-1.5">
                  Regenerate
                </summary>
                <div class="mt-2 p-3 rounded-lg border border-amber/30 bg-amber/5">
                  <p class="text-xs text-text-dim mb-2 leading-relaxed">
                    Generates a fresh secp256k1 keypair. <span class="text-amber">Your old npub stops signing posts</span>, but past Nostr-published events stay on relays under the old identifier. Type <span class="text-gold font-mono">regenerate</span> to confirm.
                  </p>
                  <div class="flex gap-2">
                    <input
                      type="text"
                      value={nostrConfirmRegen}
                      onInput={(e) => setNostrConfirmRegen((e.target as HTMLInputElement).value)}
                      placeholder="type regenerate"
                      class="flex-1 px-3 py-1.5 text-xs bg-navy-mid border border-card-border rounded-lg text-text placeholder-text-dim focus:outline-none focus:border-amber/50"
                    />
                    <button
                      type="button"
                      onClick={handleRegenNostr}
                      disabled={nostrBusy || nostrConfirmRegen !== 'regenerate'}
                      class="px-3 py-1.5 text-xs rounded-lg bg-amber/15 border border-amber/40 text-amber hover:bg-amber/25 disabled:opacity-30 transition-colors"
                    >
                      Regenerate
                    </button>
                  </div>
                </div>
              </details>
            </div>
          </>
        )}

        {nostrMessage && (
          <p class={`mt-3 text-xs leading-relaxed ${nostrError ? 'text-amber' : 'text-text-dim'}`}>{nostrMessage}</p>
        )}

        <p class="mt-3 text-[11px] text-text-dim leading-relaxed border-t border-card-border pt-3 opacity-75">
          Posts publish to relays after you create them. There is no fan-out for past posts. Disable any time — your identity stays.{' '}
          <a href="https://github.com/nostr-protocol/nips/blob/master/19.md" class="underline hover:text-gold" target="_blank" rel="noopener noreferrer">NIP-19</a> bech32 encoding · BIP-340 schnorr signatures.
        </p>
      </div>

      {backupModalOpen && (
        <BackupPassphraseModal
          passphrase={backupPass}
          confirm={backupPassConfirm}
          error={backupModalError}
          busy={busy}
          onPassphrase={setBackupPass}
          onConfirm={setBackupPassConfirm}
          onCancel={handleCancelBackup}
          onSubmit={handleConfirmBackup}
        />
      )}

      {importModalOpen && (
        <ImportPassphraseModal
          passphrase={importPass}
          error={importModalError}
          busy={busy}
          onPassphrase={setImportPass}
          onCancel={handleCancelImport}
          onSubmit={handleConfirmImport}
        />
      )}
    </div>
  );
}

interface BackupPassphraseModalProps {
  passphrase: string;
  confirm: string;
  error: string;
  busy: boolean;
  onPassphrase: (v: string) => void;
  onConfirm: (v: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
}

function BackupPassphraseModal({
  passphrase,
  confirm,
  error,
  busy,
  onPassphrase,
  onConfirm,
  onCancel,
  onSubmit,
}: BackupPassphraseModalProps) {
  const strength = passphraseStrength(passphrase);
  const meterColor = ['bg-red-500', 'bg-red-400', 'bg-amber-400', 'bg-gold', 'bg-emerald-400'][strength.score];
  const canSubmit = passphrase.length >= MIN_PASSPHRASE_LEN && passphrase === confirm && !busy;
  return (
    <div class="fixed inset-0 bg-navy/80 backdrop-blur-sm z-[100] px-4 flex items-start justify-center pt-24">
      <div class="max-w-md w-full rounded-xl bg-card-bg border border-card-border p-6">
        <h3 class="font-heading text-lg text-gold mb-2">Choose a backup passphrase</h3>
        <p class="text-xs text-text-dim leading-relaxed mb-4">
          You'll need this passphrase to restore your keys on a new device.{' '}
          <strong class="text-amber-200">FRQNCY cannot recover this passphrase if you forget it.</strong> Use a password manager.
        </p>
        <label class="block text-xs text-text-dim mb-1">Passphrase (min {MIN_PASSPHRASE_LEN} chars)</label>
        <input
          type="password"
          value={passphrase}
          onInput={(e) => onPassphrase((e.target as HTMLInputElement).value)}
          autoComplete="new-password"
          class="w-full bg-navy-mid border border-card-border rounded-lg px-3 py-2 text-sm text-text placeholder-text-dim focus:outline-none focus:border-gold/40 mb-2"
          placeholder="A strong passphrase…"
        />
        <div class="h-1 rounded-full bg-navy-mid mb-1 overflow-hidden">
          <div class={`h-full ${meterColor} transition-all`} style={{ width: `${(strength.score / 4) * 100}%` }} />
        </div>
        <p class="text-xs text-text-dim mb-3">Strength: {strength.label}</p>

        <label class="block text-xs text-text-dim mb-1">Confirm passphrase</label>
        <input
          type="password"
          value={confirm}
          onInput={(e) => onConfirm((e.target as HTMLInputElement).value)}
          autoComplete="new-password"
          class="w-full bg-navy-mid border border-card-border rounded-lg px-3 py-2 text-sm text-text placeholder-text-dim focus:outline-none focus:border-gold/40 mb-3"
          placeholder="Type it again"
        />

        {error && <p class="text-xs text-red-400 mb-3">{error}</p>}

        <div class="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            class="px-4 py-2 text-text-dim text-sm hover:text-text transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit}
            class="px-4 py-2 rounded-lg bg-gold text-navy text-sm font-medium hover:bg-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? 'Encrypting…' : 'Download encrypted backup'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ImportPassphraseModalProps {
  passphrase: string;
  error: string;
  busy: boolean;
  onPassphrase: (v: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
}

function ImportPassphraseModal({
  passphrase,
  error,
  busy,
  onPassphrase,
  onCancel,
  onSubmit,
}: ImportPassphraseModalProps) {
  return (
    <div class="fixed inset-0 bg-navy/80 backdrop-blur-sm z-[100] px-4 flex items-start justify-center pt-24">
      <div class="max-w-md w-full rounded-xl bg-card-bg border border-card-border p-6">
        <h3 class="font-heading text-lg text-gold mb-2">Enter backup passphrase</h3>
        <p class="text-xs text-text-dim leading-relaxed mb-4">
          Enter the passphrase you chose when this backup was created. FRQNCY cannot recover it for you.
        </p>
        <input
          type="password"
          value={passphrase}
          onInput={(e) => onPassphrase((e.target as HTMLInputElement).value)}
          autoComplete="current-password"
          class="w-full bg-navy-mid border border-card-border rounded-lg px-3 py-2 text-sm text-text placeholder-text-dim focus:outline-none focus:border-gold/40 mb-3"
          placeholder="Passphrase"
          onKeyDown={(e) => { if ((e as KeyboardEvent).key === 'Enter' && !busy) onSubmit(); }}
        />

        {error && <p class="text-xs text-red-400 mb-3">{error}</p>}

        <div class="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            class="px-4 py-2 text-text-dim text-sm hover:text-text transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={busy || !passphrase}
            class="px-4 py-2 rounded-lg bg-gold text-navy text-sm font-medium hover:bg-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? 'Decrypting…' : 'Decrypt + import'}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusRow({ label, value, ok, neutral }: { label: string; value: string; ok?: boolean; neutral?: boolean }) {
  const dotClass = neutral
    ? 'bg-text-dim'
    : ok
      ? 'bg-gold'
      : 'bg-amber-400';
  return (
    <div class="flex items-center justify-between py-2 border-b border-card-border/50 last:border-b-0">
      <span class="text-sm text-text-dim">{label}</span>
      <span class="flex items-center gap-2">
        <span class={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
        <span class="text-sm font-mono text-text">{value}</span>
      </span>
    </div>
  );
}

function short(str: string): string {
  if (!str) return '';
  if (str.length <= 16) return str;
  return `${str.slice(0, 8)}…${str.slice(-6)}`;
}
