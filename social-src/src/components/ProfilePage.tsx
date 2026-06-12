import { useState, useEffect, useCallback } from 'preact/hooks';
import ProfileCard from './ProfileCard';
import ProfileStats from './ProfileStats';
import ProfileCourses from './ProfileCourses';
import FollowButton from './FollowButton';
import StartConversationButton from './StartConversationButton';
import Feed from './Feed';
import EditProfileModal from './EditProfileModal';
import { useAuth } from './AuthProvider';
import { getProfile, type Profile } from '../lib/api';

/**
 * ProfilePage — reads @username from the URL client-side, then renders the
 * full profile view. Lets us ship this page via pure static output:
 * _redirects rewrites /social/u/:username → /social/profile/index.html
 * (moved from /social/profile/:username to avoid catchall collisions with
 *  the real static settings sub-pages /social/profile/{keys,connections,
 *  bluesky-callback,bluesky-oauth-client.json} — see _redirects comment).
 * This component reads the username from window.location.pathname and
 * tolerates both the new /social/u/<name> and the legacy
 * /social/profile/<name> URL during the migration window.
 */
export default function ProfilePage() {
  const [username, setUsername] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [profileVersion, setProfileVersion] = useState(0); // bump after save → ProfileCard refetches
  const { user } = useAuth();

  useEffect(() => {
    // Extract :username from /social/u/:username OR /social/profile/:username
    // (trailing slash tolerant). Skip the special static sub-pages of
    // /social/profile/ (keys/connections/bluesky-callback) which should not
    // be interpreted as usernames if the legacy path is hit somehow.
    const path = window.location.pathname.replace(/\/+$/, '');
    const parts = path.split('/');
    const last = parts[parts.length - 1];
    const stop = new Set(['', 'u', 'profile', 'index.html', 'keys', 'connections', 'bluesky-callback']);
    if (last && !stop.has(last)) {
      setUsername(decodeURIComponent(last));
    } else {
      setUsername('');
    }
  }, []);

  // Fetch the canonical profile row so we can compare ownership and seed the
  // edit modal with current values.
  useEffect(() => {
    if (!username) { setProfile(null); return; }
    let cancelled = false;
    (async () => {
      const p = await getProfile(username);
      if (!cancelled) setProfile(p);
    })();
    return () => { cancelled = true; };
  }, [username, profileVersion]);

  const isOwnProfile = !!(user && profile && user.id === profile.id);
  const handleSaved = useCallback((next: Profile) => {
    setProfile(next);
    setProfileVersion((v) => v + 1);
  }, []);

  if (username === null) {
    return (
      <div class="rounded-xl bg-card-bg border border-card-border p-6 text-center">
        <p class="text-sm text-text-dim">Loading…</p>
      </div>
    );
  }

  if (!username) {
    return (
      <div class="rounded-xl bg-card-bg border border-card-border p-8 text-center">
        <p class="text-sm text-text-dim">
          No profile specified. Try <a href="/social" class="text-gold">the feed</a>.
        </p>
      </div>
    );
  }

  return (
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
      <aside class="lg:col-span-4 space-y-4">
        <ProfileCard username={username} key={profileVersion /* refetch on save */} />
        <div class="rounded-xl bg-card-bg border border-card-border p-5 space-y-2">
          {isOwnProfile ? (
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              class="w-full text-sm px-4 py-2 rounded-full border border-gold/40 text-gold hover:bg-gold/10 transition-colors"
            >Edit profile</button>
          ) : (
            <>
              <FollowButton username={username} />
              <StartConversationButton username={username} />
            </>
          )}
        </div>
        <ProfileStats username={username} key={`stats-${profileVersion}`} />
        {isOwnProfile && user && <ProfileCourses userId={user.id} />}
      </aside>
      <section class="lg:col-span-8">
        <h2 class="font-heading text-2xl text-gold mb-4">Posts by @{username}</h2>
        <Feed username={username} />
      </section>
      {profile && (
        <EditProfileModal
          open={editOpen}
          profile={profile}
          onClose={() => setEditOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
