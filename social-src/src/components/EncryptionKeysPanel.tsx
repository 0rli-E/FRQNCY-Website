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
  downloadKeyBackupFile,
} from '../lib/crypto';

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

  useEffect(() => {
    setHasLocalKey(!!loadPrivateKeyLocal());
  }, [profile]);

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

  const handleDownload = () => {
    const username = profile?.username || 'frqncy';
    const ok = downloadKeyBackupFile(username);
    if (!ok) {
      flash('No private key in this browser to download.', true);
      return;
    }
    // Mark backup as acknowledged — user actually has a copy of the file.
    // Clears the amber dot in NavAuth and the welcome modal's nag state.
    try {
      window.localStorage.setItem(BACKUP_ACK_LS_KEY, '1');
    } catch (_) {
      // localStorage write can fail in private mode — non-fatal.
    }
    flash('Downloaded. Store this file like a password.');
  };

  const handleImport = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const text = await file.text();
      // Strip header comments — the body should be either a JSON KeyBackupV1
      // (current format) or a single base64 line (legacy single-key format).
      const stripped = text
        .split('\n')
        .filter((l) => !l.trim().startsWith('#') && !l.trim().startsWith('```'))
        .join('\n')
        .trim();

      const so = await ensureSodium();

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

      // Try the unified JSON backup first.
      if (stripped.startsWith('{')) {
        let parsed: any;
        try {
          parsed = JSON.parse(stripped);
        } catch (err: any) {
          flash(`Backup parse failed: ${err?.message ?? 'unknown error'}`, true);
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

        // Derive the encryption pubkey from the imported private key and
        // compare against what the profile holds. If they don't match, this
        // backup belongs to a different account — refuse to overwrite.
        let derivedEncPubB64: string;
        try {
          const encPrivBytes = so.from_base64(encPrivB64, so.base64_variants.ORIGINAL);
          const derivedEncPub = so.crypto_scalarmult_base(encPrivBytes);
          derivedEncPubB64 = so.to_base64(derivedEncPub, so.base64_variants.ORIGINAL);
        } catch (err: any) {
          flash(`Could not parse encryption private key: ${err?.message ?? 'invalid key bytes'}`, true);
          return;
        }

        const encCorrupted = !profileEncPub;
        if (!encCorrupted && derivedEncPubB64 !== profileEncPub) {
          flash(
            'This backup belongs to a different account. Imported public key does not match this profile\'s stored public key. If you want to use a different identity, log in to that account first.',
            true,
          );
          return;
        }

        // Same check for signing key when the backup includes one.
        let derivedSignPubB64: string | null = null;
        if (signPrivB64) {
          try {
            const signPrivBytes = so.from_base64(signPrivB64, so.base64_variants.ORIGINAL);
            const derivedSignPub = so.crypto_sign_ed25519_sk_to_pk(signPrivBytes);
            derivedSignPubB64 = so.to_base64(derivedSignPub, so.base64_variants.ORIGINAL);
          } catch (err: any) {
            flash(`Could not parse signing private key: ${err?.message ?? 'invalid key bytes'}`, true);
            return;
          }
          if (profileSignPub && derivedSignPubB64 !== profileSignPub) {
            flash(
              'This backup belongs to a different account. Imported signing public key does not match this profile\'s stored signing public key. If you want to use a different identity, log in to that account first.',
              true,
            );
            return;
          }
        }

        // Validation passed — safe to write.
        savePrivateKeyLocal(encPrivB64);
        if (signPrivB64) {
          saveSigningPrivateKeyLocal(signPrivB64);
        }

        // If the profile was missing its pubkey(s), write the derived one(s)
        // up — this is the "restoring on a fresh / corrupted profile" case.
        const profileUpdate: Record<string, string> = {};
        if (!profileEncPub) profileUpdate.encryption_public_key = derivedEncPubB64;
        if (!profileSignPub && derivedSignPubB64) profileUpdate.signing_public_key = derivedSignPubB64;
        if (Object.keys(profileUpdate).length > 0) {
          const { error: upErr } = await supabase
            .from('profiles')
            .update(profileUpdate)
            .eq('id', user.id);
          if (upErr) {
            console.warn('[encryption] failed to write derived pubkey(s) to profile:', upErr.message);
          }
        }

        setHasLocalKey(true);
        // Importing a backup proves the user has a copy of the file in
        // their possession — count it as acknowledgement.
        try { window.localStorage.setItem(BACKUP_ACK_LS_KEY, '1'); } catch (_) {}
        flash('Keys imported (encryption + signing). Refresh /social/messages/ to decrypt past messages.');
        return;
      }

      // Legacy fallback: single base64 line of just the encryption private key.
      const candidate = stripped
        .split('\n')
        .map((l) => l.trim())
        .find((l) => /^[A-Za-z0-9+/=_-]{40,}$/.test(l));
      if (!candidate) {
        flash('Could not find a valid key in that file. Upload the .txt FRQNCY gave you.', true);
        return;
      }

      // Validate the legacy single-key import the same way.
      let derivedEncPubB64: string;
      try {
        const encPrivBytes = so.from_base64(candidate, so.base64_variants.ORIGINAL);
        const derivedEncPub = so.crypto_scalarmult_base(encPrivBytes);
        derivedEncPubB64 = so.to_base64(derivedEncPub, so.base64_variants.ORIGINAL);
      } catch (err: any) {
        flash(`Could not parse encryption private key: ${err?.message ?? 'invalid key bytes'}`, true);
        return;
      }

      if (profileEncPub && derivedEncPubB64 !== profileEncPub) {
        flash(
          'This backup belongs to a different account. Imported public key does not match this profile\'s stored public key. If you want to use a different identity, log in to that account first.',
          true,
        );
        return;
      }

      savePrivateKeyLocal(candidate);

      if (!profileEncPub) {
        const { error: upErr } = await supabase
          .from('profiles')
          .update({ encryption_public_key: derivedEncPubB64 })
          .eq('id', user.id);
        if (upErr) {
          console.warn('[encryption] failed to write derived pubkey to profile:', upErr.message);
        }
      }

      setHasLocalKey(true);
      try { window.localStorage.setItem(BACKUP_ACK_LS_KEY, '1'); } catch (_) {}
      flash('Encryption key imported (legacy backup — no signing key found). Past encrypted messages should now decrypt.');
    } catch (err: any) {
      flash(err?.message || 'Import failed.', true);
    } finally {
      setBusy(false);
      input.value = '';
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
            Saves your private key as a .txt. Store it like a password — anyone with this file can read every encrypted message you receive on FRQNCY.
          </p>
          <button
            type="button"
            onClick={handleDownload}
            disabled={!hasLocalKey || busy}
            class="px-4 py-2 rounded-lg bg-gold text-navy text-sm font-medium hover:bg-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Download private key
          </button>
        </div>

        <div class="border-t border-card-border pt-5">
          <h3 class="font-heading text-lg text-gold mb-1">2. Import on a new device</h3>
          <p class="text-xs text-text-dim mb-3">
            Already have the .txt from another browser or device? Upload it here to decrypt past messages on this one.
          </p>
          <input
            type="file"
            accept=".txt,text/plain"
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
          v1 has no forward secrecy: compromising your private key reveals every past message. v2 will add Signal-style ratcheting. See{' '}
          <a href="https://github.com/0rli-E/frqncy-website/blob/main/social-src/E2EE-NOTES.md" class="underline hover:text-gold">E2EE-NOTES.md</a>.
        </p>
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
