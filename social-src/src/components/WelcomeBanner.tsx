import { useEffect, useState } from 'preact/hooks';
import { useAuth } from './AuthProvider';
import { getProfileById, type Profile } from '../lib/api';
import EditProfileModal from './EditProfileModal';

const DISMISS_KEY = 'frqncy:welcome-banner-dismissed';

/**
 * WelcomeBanner — soft nudge for newly signed-up users to set their display
 * name + bio + avatar. Visible only when the logged-in user's profile is
 * incomplete (no display_name or display_name === username) and the banner
 * hasn't been dismissed for this device.
 *
 * One click opens the same EditProfileModal the profile page uses, so the
 * user can finish onboarding without leaving the feed.
 */
export default function WelcomeBanner() {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    try { setDismissed(localStorage.getItem(DISMISS_KEY) === '1'); } catch (_) {}
  }, []);

  useEffect(() => {
    if (!user) { setProfile(null); return; }
    let cancelled = false;
    (async () => {
      const p = await getProfileById(user.id);
      if (!cancelled) setProfile(p);
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (loading || !user || !profile || dismissed) return null;

  const displayNameMissing = !profile.display_name || profile.display_name.trim() === '' || profile.display_name === profile.username;
  const bioMissing = !profile.bio || profile.bio.trim() === '';
  const avatarMissing = !profile.avatar_url;

  // Nothing to nudge about → render nothing
  if (!displayNameMissing && !bioMissing && !avatarMissing) return null;

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch (_) {}
    setDismissed(true);
  };

  // Friendly status line — "set a display name + bio + avatar" or whichever subset is missing
  const missing: string[] = [];
  if (displayNameMissing) missing.push('a display name');
  if (bioMissing) missing.push('a short bio');
  if (avatarMissing) missing.push('an avatar');
  const list = missing.length === 1
    ? missing[0]
    : missing.length === 2
      ? `${missing[0]} and ${missing[1]}`
      : `${missing.slice(0, -1).join(', ')}, and ${missing[missing.length - 1]}`;

  return (
    <>
      <div class="rounded-xl border border-gold/30 bg-gold/5 p-4 flex items-start gap-3">
        <div class="w-10 h-10 rounded-full bg-gold/15 border border-gold/40 flex items-center justify-center text-gold text-lg shrink-0">✦</div>
        <div class="flex-1 min-w-0">
          <p class="text-sm text-text font-medium leading-snug">Welcome to FRQNCY.</p>
          <p class="text-xs text-text-dim mt-1 leading-relaxed">
            Add {list} so the network can find you.
          </p>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            class="text-xs px-3 py-1.5 rounded-full bg-gold text-navy font-medium hover:bg-gold-light transition-colors"
          >Set up</button>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss welcome banner"
            class="text-text-dim hover:text-text text-lg w-7 h-7 flex items-center justify-center"
          >×</button>
        </div>
      </div>

      <EditProfileModal
        open={editOpen}
        profile={profile}
        onClose={() => setEditOpen(false)}
        onSaved={(next) => setProfile(next)}
      />
    </>
  );
}
