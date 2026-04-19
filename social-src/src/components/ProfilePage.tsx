import { useState, useEffect } from 'preact/hooks';
import ProfileCard from './ProfileCard';
import ProfileStats from './ProfileStats';
import FollowButton from './FollowButton';
import StartConversationButton from './StartConversationButton';
import Feed from './Feed';

/**
 * ProfilePage — reads @username from the URL client-side, then renders the
 * full profile view. Lets us ship this page via pure static output:
 * _redirects rewrites /social/profile/:username → /social/profile/index.html
 * and this component reads the username from window.location.pathname.
 */
export default function ProfilePage() {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    // Extract :username from /social/profile/:username (trailing slash tolerant)
    const path = window.location.pathname.replace(/\/+$/, '');
    const parts = path.split('/');
    const last = parts[parts.length - 1];
    if (last && last !== 'profile' && last !== 'index.html') {
      setUsername(decodeURIComponent(last));
    } else {
      setUsername('');
    }
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
        <ProfileCard username={username} />
        <div class="rounded-xl bg-card-bg border border-card-border p-5">
          <FollowButton username={username} />
          <StartConversationButton username={username} />
        </div>
        <ProfileStats username={username} />
      </aside>
      <section class="lg:col-span-8">
        <h2 class="font-heading text-2xl text-gold mb-4">Posts by @{username}</h2>
        <Feed username={username} />
      </section>
    </div>
  );
}
