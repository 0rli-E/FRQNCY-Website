// First-run welcome + backup-gate modal.
//
// Mounted at the layout level (SocialLayout.astro) so it can appear on any
// /social/ page until the user dismisses it. Visible only when ALL of:
//
//   1. The user is signed in (Supabase session present).
//   2. The user has keys — either profile.encryption_public_key OR a
//      localStorage encryption private key (caching from a previous visit).
//   3. `frqncy.nrg.welcomed`            is NOT set in localStorage.
//   4. `frqncy.nrg.backup_acknowledged` is NOT set in localStorage.
//
// Three actions:
//
//   - Download backup file:    sets welcomed=1 + backup_acknowledged=1.
//   - I already have a backup: sets welcomed=1 + backup_acknowledged=1
//                              (implicit trust — we don't validate).
//   - Skip for now:            sets welcomed=1 only. The amber dot in NavAuth
//                              will keep nagging until the user actually backs up.
//
// The component is a no-op render (returns null) when the gating conditions
// aren't met, so it's safe to mount everywhere.

import { useState, useEffect } from 'preact/hooks';
import { useAuth } from './AuthProvider';
import { downloadPassphraseBackupFile, loadPrivateKeyLocal } from '../lib/crypto';

const WELCOMED_LS_KEY = 'frqncy.nrg.welcomed';
const BACKUP_ACK_LS_KEY = 'frqncy.nrg.backup_acknowledged';

// Mirrors EncryptionKeysPanel — keep these in sync if you change either.
const MIN_PASSPHRASE_LEN = 12;

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

function readFlag(key: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(key) === '1';
  } catch (_) {
    return false;
  }
}

function setFlag(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, '1');
  } catch (_) {
    // localStorage write can fail in private mode — non-fatal.
  }
}

export default function FirstRunWelcome() {
  const { user, profile } = useAuth();
  // Start hidden. We only flip to visible once the gating conditions all
  // resolve true — this avoids a flash of the modal during the brief window
  // before localStorage + auth state load.
  const [visible, setVisible] = useState(false);
  const [hasLocalKey, setHasLocalKey] = useState(false);

  // Passphrase prompt — opens when the user clicks "Download backup file".
  // Backing out of this modal = "skip for now" (welcomed without backup ack).
  const [passModalOpen, setPassModalOpen] = useState(false);
  const [pass, setPass] = useState('');
  const [passConfirm, setPassConfirm] = useState('');
  const [passError, setPassError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setHasLocalKey(!!loadPrivateKeyLocal());
  }, [user]);

  useEffect(() => {
    if (!user) { setVisible(false); return; }
    const welcomed = readFlag(WELCOMED_LS_KEY);
    const acked = readFlag(BACKUP_ACK_LS_KEY);
    if (welcomed || acked) { setVisible(false); return; }
    const userHasKeys = !!(profile?.encryption_public_key) || hasLocalKey;
    if (!userHasKeys) { setVisible(false); return; }
    setVisible(true);
  }, [user, profile, hasLocalKey]);

  if (!visible) return null;

  // "Download backup" — open the passphrase prompt. File emission happens
  // in handleConfirmPass once the user types + confirms a passphrase.
  const handleDownload = () => {
    setPass('');
    setPassConfirm('');
    setPassError('');
    setPassModalOpen(true);
  };

  // Backing out of the passphrase prompt counts as "skip for now": the user
  // saw the welcome, so set welcomed=1, but they didn't actually produce a
  // backup, so leave backup_acknowledged unset and let the amber dot nag.
  const handleCancelPass = () => {
    setPassModalOpen(false);
    setPass('');
    setPassConfirm('');
    setPassError('');
    setFlag(WELCOMED_LS_KEY);
    setVisible(false);
  };

  const handleConfirmPass = async () => {
    setPassError('');
    if (pass.length < MIN_PASSPHRASE_LEN) {
      setPassError(`Passphrase must be at least ${MIN_PASSPHRASE_LEN} characters.`);
      return;
    }
    if (pass !== passConfirm) {
      setPassError('Passphrases do not match.');
      return;
    }
    setBusy(true);
    try {
      const username = profile?.username || 'frqncy';
      const ok = await downloadPassphraseBackupFile(username, pass, {
        encryption_public_key_b64: (profile as any)?.encryption_public_key ?? undefined,
        signing_public_key_b64: (profile as any)?.signing_public_key ?? undefined,
      });
      if (!ok) {
        // No private key in this browser yet — rare. Close the prompt and
        // mark welcomed so we don't block; the keys panel will be available
        // for them later.
        setFlag(WELCOMED_LS_KEY);
        setPassModalOpen(false);
        setVisible(false);
        return;
      }
      setFlag(WELCOMED_LS_KEY);
      setFlag(BACKUP_ACK_LS_KEY);
      setPass('');
      setPassConfirm('');
      setPassModalOpen(false);
      setVisible(false);
    } catch (err: any) {
      setPassError(err?.message ?? 'Backup failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleAlreadyHave = () => {
    setFlag(WELCOMED_LS_KEY);
    setFlag(BACKUP_ACK_LS_KEY);
    setVisible(false);
  };

  const handleSkip = () => {
    setFlag(WELCOMED_LS_KEY);
    // Intentionally do NOT set backup_acknowledged — the amber dot stays.
    setVisible(false);
  };

  // Once the user clicks "Download backup file" we swap the welcome card for
  // a passphrase-prompt card in the same modal frame. Cancelling that prompt
  // counts as "skip for now" (see handleCancelPass).
  if (passModalOpen) {
    const strength = passphraseStrength(pass);
    const meterColor = ['bg-red-500', 'bg-red-400', 'bg-amber-400', 'bg-gold', 'bg-emerald-400'][strength.score];
    const canSubmit = pass.length >= MIN_PASSPHRASE_LEN && pass === passConfirm && !busy;
    return (
      <div class="fixed inset-0 bg-navy/80 backdrop-blur-sm z-[100] px-4">
        <div class="max-w-md mx-auto mt-32 rounded-xl bg-card-bg border border-card-border p-8">
          <h2 class="font-heading text-xl text-gold mb-2">Choose a backup passphrase</h2>
          <p class="text-sm text-text leading-relaxed mb-2">
            We're about to encrypt your keys with a passphrase you choose, then download the encrypted file.
          </p>
          <p class="text-xs text-text-dim leading-relaxed mb-4">
            You'll need this passphrase to restore on a new device.{' '}
            <strong class="text-amber-200">FRQNCY cannot recover it if you forget.</strong> Use a password manager.
          </p>

          <label class="block text-xs text-text-dim mb-1">Passphrase (min {MIN_PASSPHRASE_LEN} chars)</label>
          <input
            type="password"
            value={pass}
            onInput={(e) => setPass((e.target as HTMLInputElement).value)}
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
            value={passConfirm}
            onInput={(e) => setPassConfirm((e.target as HTMLInputElement).value)}
            autoComplete="new-password"
            class="w-full bg-navy-mid border border-card-border rounded-lg px-3 py-2 text-sm text-text placeholder-text-dim focus:outline-none focus:border-gold/40 mb-3"
            placeholder="Type it again"
          />

          {passError && <p class="text-xs text-red-400 mb-3">{passError}</p>}

          <div class="flex flex-col sm:flex-row gap-2 justify-end">
            <button
              type="button"
              onClick={handleCancelPass}
              disabled={busy}
              class="px-4 py-2 rounded-full text-text-dim text-sm hover:text-text transition-colors disabled:opacity-50"
            >
              Skip for now
            </button>
            <button
              type="button"
              onClick={handleConfirmPass}
              disabled={!canSubmit}
              class="px-4 py-2 rounded-full bg-gold text-navy text-sm font-medium hover:bg-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ? 'Encrypting…' : 'Download encrypted backup'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div class="fixed inset-0 bg-navy/80 backdrop-blur-sm z-[100] px-4">
      <div class="max-w-md mx-auto mt-32 rounded-xl bg-card-bg border border-card-border p-8">
        <h2 class="font-heading text-2xl text-gold mb-2">Welcome to NRG.</h2>
        <p class="text-sm text-text leading-relaxed mb-4">
          You just got an identity on the network — three things, all yours:
        </p>
        <ul class="space-y-2.5 mb-5 text-sm text-text leading-relaxed">
          <li class="flex gap-3">
            <span class="text-gold shrink-0" aria-hidden="true">◊</span>
            <span>An encryption key that lets you receive private DMs.</span>
          </li>
          <li class="flex gap-3">
            <span class="text-gold shrink-0" aria-hidden="true">✦</span>
            <span>A signing identity that signs every post you make so it's verifiable and portable to any future network.</span>
          </li>
          <li class="flex gap-3">
            <span class="text-gold shrink-0" aria-hidden="true">⛓</span>
            <span>An embedded wallet (if you signed in via Privy) — yours, no custody.</span>
          </li>
        </ul>
        <p class="text-xs text-text-dim leading-relaxed mb-6">
          The keys live in this browser. If you clear your data without backing them up, your encrypted messages can't be recovered. Take a moment to download an encrypted backup — you'll choose a passphrase only you know.
        </p>
        <div class="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={handleDownload}
            class="flex-1 px-4 py-2 rounded-full bg-gold text-navy text-sm font-medium hover:bg-gold-light transition-colors"
          >
            Download backup file
          </button>
          <button
            type="button"
            onClick={handleAlreadyHave}
            class="flex-1 px-4 py-2 rounded-full border border-gold/40 text-gold text-sm hover:bg-gold/10 transition-colors"
          >
            I already have a backup
          </button>
          <button
            type="button"
            onClick={handleSkip}
            class="flex-1 px-4 py-2 text-text-dim text-sm hover:text-text transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
