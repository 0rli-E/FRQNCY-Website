// Gated setup flow for E2EE direct messages.
//
// Tier-2 fix #12 from proposals/NRG-EXPERT-CRITIQUE-2026-05-14.md. The
// previous behavior auto-generated encryption + signing keypairs on every
// signed-in load — the E2EE expert called that "unacceptable consent UX":
// a user who never opens DMs ends up with two cryptographic identities they
// were never told about, and clearing their browser data orphans every
// message anyone ever sent to them.
//
// This component renders the explicit opt-in. Drives all key generation
// through AuthProvider.setupSecureDMs(). The full passphrase-wrap flow
// (Argon2id-derived wrap key) is being added in a parallel patch; this
// component already has the right surface to absorb it — the "Set up" step
// will just grow a passphrase field, and the result handling stays the same.
//
// Mount points (Tier-3 follow-up — these wires live outside this file):
//
//   1. INLINE, at the top of /social/messages/ in ChannelView or
//      ConversationsList, gated on `encryptionStatus === 'not-set-up'`.
//      Shows the intro card directly in the page (no modal chrome).
//
//   2. MODAL, launched from NavAuth's dropdown ("Set up secure DMs").
//      Pass `isModal={true}` so the component renders its own overlay.
//
// The Skip path records `frqncy.nrg.setup_secure_dms.skipped` in localStorage
// so the inline CTA can downgrade to a soft amber banner on subsequent
// visits rather than nagging. Honoring the user's choice is the point —
// "skip" means "I'll use plaintext DMs," not "remind me forever."

import { useState } from 'preact/hooks';
import { useAuth } from './AuthProvider';

export const SKIP_LS_KEY = 'frqncy.nrg.setup_secure_dms.skipped';

type Step = 'intro' | 'generating' | 'done' | 'error';

interface SetupSecureDMsProps {
  /** Called when the user finishes setup successfully OR skips. The parent
      typically uses this to close a modal or hide an inline card. */
  onComplete?: () => void;
  /** Called when the user clicks Skip. Distinct from onComplete so a parent
      that wants to record the skip in its own state can react. */
  onCancel?: () => void;
  /** If true, render with a modal overlay + dialog chrome. If false, render
      inline (a card with no overlay). */
  isModal?: boolean;
}

export default function SetupSecureDMs({
  onComplete,
  onCancel,
  isModal = false,
}: SetupSecureDMsProps) {
  const { setupSecureDMs } = useAuth();
  const [step, setStep] = useState<Step>('intro');
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    setStep('generating');
    setError(null);
    const result = await setupSecureDMs();
    if (result.ok) {
      setStep('done');
    } else {
      setError(result.error ?? 'Unknown error');
      setStep('error');
    }
  };

  const handleSkip = () => {
    // Record the skip so the inline banner can downgrade to a soft amber
    // notice on subsequent visits. We don't store an expiry — the choice
    // is honored until the user clears localStorage or explicitly opts in.
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(SKIP_LS_KEY, '1');
      } catch (_) {
        // Private-mode localStorage write can fail — non-fatal.
      }
    }
    onCancel?.();
  };

  const handleDone = () => {
    // Clear any prior skip flag — the user is now set up. Any stale
    // 'skipped' marker would be misleading for downstream banners.
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(SKIP_LS_KEY);
      } catch (_) {
        // non-fatal
      }
    }
    onComplete?.();
  };

  const cardStyle = {
    maxWidth: '460px',
    margin: '0 auto',
    padding: '24px',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(196, 151, 58, 0.25)',
    borderRadius: '12px',
    color: '#e8ecf1',
    fontFamily:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    lineHeight: 1.5,
  } as const;

  const headingStyle = {
    margin: '0 0 12px 0',
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#C4973A',
  } as const;

  const bodyStyle = {
    margin: '0 0 18px 0',
    fontSize: '0.95rem',
    color: 'rgba(232, 236, 241, 0.85)',
  } as const;

  const buttonRowStyle = {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  } as const;

  const primaryBtnStyle = {
    background: '#C4973A',
    color: '#0B1C3D',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 18px',
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
  } as const;

  const secondaryBtnStyle = {
    background: 'transparent',
    color: 'rgba(232, 236, 241, 0.75)',
    border: '1px solid rgba(232, 236, 241, 0.3)',
    borderRadius: '8px',
    padding: '10px 18px',
    fontSize: '0.95rem',
    cursor: 'pointer',
  } as const;

  const linkBtnStyle = {
    background: 'transparent',
    color: '#C4973A',
    border: '1px solid #C4973A',
    borderRadius: '8px',
    padding: '10px 18px',
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-block',
  } as const;

  const renderStep = () => {
    if (step === 'intro') {
      return (
        <div style={cardStyle}>
          <h2 style={headingStyle}>Set up secure direct messages?</h2>
          <p style={bodyStyle}>
            We'll generate cryptographic keys for you so your DMs are
            end-to-end encrypted. <strong>Back them up after</strong> —
            losing them means losing access to your DMs.
          </p>
          <p style={{ ...bodyStyle, fontSize: '0.85rem', opacity: 0.7 }}>
            You can also skip and use plaintext DMs. You can opt in any time
            later from your account menu.
          </p>
          <div style={buttonRowStyle}>
            <button
              type="button"
              style={primaryBtnStyle}
              onClick={handleStart}
            >
              Set up secure DMs
            </button>
            <button
              type="button"
              style={secondaryBtnStyle}
              onClick={handleSkip}
            >
              Skip — use plaintext
            </button>
          </div>
        </div>
      );
    }

    if (step === 'generating') {
      return (
        <div style={cardStyle}>
          <h2 style={headingStyle}>Generating your keys…</h2>
          <p style={bodyStyle}>
            This takes a moment. Don't close the tab.
          </p>
        </div>
      );
    }

    if (step === 'done') {
      return (
        <div style={cardStyle}>
          <h2 style={headingStyle}>Your keys are ready.</h2>
          <p style={bodyStyle}>
            Back them up now — if you lose access to this browser without a
            backup, your DMs become unreadable.
          </p>
          <div style={buttonRowStyle}>
            <a
              href="/social/profile/keys/"
              style={linkBtnStyle}
              onClick={handleDone}
            >
              Backup keys
            </a>
            <button
              type="button"
              style={secondaryBtnStyle}
              onClick={handleDone}
            >
              I'll back up later
            </button>
          </div>
        </div>
      );
    }

    // error
    return (
      <div style={cardStyle}>
        <h2 style={headingStyle}>Couldn't set up secure DMs.</h2>
        <p style={bodyStyle}>{error}</p>
        <div style={buttonRowStyle}>
          <button
            type="button"
            style={primaryBtnStyle}
            onClick={handleStart}
          >
            Try again
          </button>
          <button
            type="button"
            style={secondaryBtnStyle}
            onClick={handleSkip}
          >
            Skip for now
          </button>
        </div>
      </div>
    );
  };

  if (!isModal) {
    return renderStep();
  }

  // Modal chrome — full-screen overlay with the card centered.
  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(11, 28, 61, 0.85)',
    backdropFilter: 'blur(4px)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  } as const;

  return <div style={overlayStyle}>{renderStep()}</div>;
}
