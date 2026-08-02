import { useState, useEffect } from 'preact/hooks';
import { useAuth } from './AuthProvider';
import ReportDialog from './ReportDialog';
import { blockUser, unblockUser, isBlocked, moderationAvailable } from '../lib/moderation';

interface Props {
  profileId: string;
  username: string;
  onBlocked?: () => void;
}

/**
 * Block / unblock / report, on someone else's profile.
 *
 * Only rendered for signed-in users viewing a profile that isn't theirs —
 * ProfilePage handles that check. Block is confirmed inline rather than with a
 * window.confirm() so the wording can explain what a block actually does.
 */
export default function ProfileModerationActions({ profileId, username, onBlocked }: Props) {
  const { user } = useAuth();
  const [blocked, setBlocked] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reported, setReported] = useState(false);

  // Gated on migration 025 being applied — see moderationAvailable(). Renders
  // nothing at all until then, rather than buttons that would error.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const ok = await moderationAvailable();
      if (cancelled) return;
      setReady(ok);
      if (!ok) return;
      const b = await isBlocked(profileId);
      if (!cancelled) setBlocked(b);
    })();
    return () => { cancelled = true; };
  }, [user, profileId]);

  if (!user || !ready) return null;

  const doBlock = async () => {
    setBusy(true);
    const res = await blockUser(profileId);
    setBusy(false);
    setConfirming(false);
    if (res.ok) { setBlocked(true); onBlocked?.(); }
  };

  const doUnblock = async () => {
    setBusy(true);
    const res = await unblockUser(profileId);
    setBusy(false);
    if (res.ok) { setBlocked(false); onBlocked?.(); }
  };

  return (
    <>
      {showReport && (
        <ReportDialog
          targetType="profile"
          targetId={profileId}
          targetLabel={`@${username}`}
          onClose={() => setShowReport(false)}
          onReported={() => setReported(true)}
        />
      )}

      {blocked ? (
        <div class="space-y-2">
          <p class="text-xs text-text-dim leading-snug">
            You've blocked @{username}. You're hidden from each other.
          </p>
          <button
            type="button"
            onClick={doUnblock}
            disabled={busy}
            class="w-full text-sm px-4 py-2 rounded-full border border-card-border text-text-dim hover:text-text hover:border-gold/30 transition-colors disabled:opacity-40"
          >{busy ? 'Unblocking…' : 'Unblock'}</button>
        </div>
      ) : confirming ? (
        <div class="space-y-2 rounded-lg border border-card-border bg-navy-deep p-3">
          <p class="text-xs text-text-dim leading-snug">
            Block @{username}? You won't see each other's posts and neither of you
            can start a message. They aren't notified, and you can undo it here.
          </p>
          <div class="flex gap-2">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              class="flex-1 text-xs px-3 py-1.5 rounded-full border border-card-border text-text-dim hover:text-text transition-colors"
            >Cancel</button>
            <button
              type="button"
              onClick={doBlock}
              disabled={busy}
              class="flex-1 text-xs px-3 py-1.5 rounded-full bg-gold text-navy font-medium hover:bg-gold-light transition-colors disabled:opacity-40"
            >{busy ? 'Blocking…' : 'Block'}</button>
          </div>
        </div>
      ) : (
        <div class="flex gap-2 pt-1">
          <button
            type="button"
            onClick={() => setShowReport(true)}
            class="flex-1 text-xs px-3 py-1.5 rounded-full border border-card-border text-text-dim hover:text-text hover:border-gold/30 transition-colors"
          >{reported ? 'Reported ✓' : 'Report'}</button>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            class="flex-1 text-xs px-3 py-1.5 rounded-full border border-card-border text-text-dim hover:text-text hover:border-gold/30 transition-colors"
          >Block</button>
        </div>
      )}
    </>
  );
}
