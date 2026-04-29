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
import { downloadKeyBackupFile, loadPrivateKeyLocal } from '../lib/crypto';

const WELCOMED_LS_KEY = 'frqncy.nrg.welcomed';
const BACKUP_ACK_LS_KEY = 'frqncy.nrg.backup_acknowledged';

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

  const handleDownload = () => {
    const username = profile?.username || 'frqncy';
    const ok = downloadKeyBackupFile(username);
    if (!ok) {
      // No private key in this browser yet — rare; just close so we don't
      // block the user. They'll see the keys panel later if they need it.
      setFlag(WELCOMED_LS_KEY);
      setVisible(false);
      return;
    }
    setFlag(WELCOMED_LS_KEY);
    setFlag(BACKUP_ACK_LS_KEY);
    setVisible(false);
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
          The keys live in this browser. If you clear your data without backing them up, your encrypted messages can't be recovered. Take a moment to download a backup.
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
