import { useAuth } from './AuthProvider';

/**
 * Auth-aware link/button shown inside the mobile menu dropdown.
 * Shows a "Sign In" link when signed out and a "Sign Out" button otherwise.
 */
export default function MobileNavAuth() {
  const { user, profile, loading, signOut } = useAuth();

  if (loading) {
    return <span class="block text-text-dim py-1.5 opacity-50">…</span>;
  }

  if (!user) {
    return (
      <a href="/social/login" class="block text-text-dim py-1.5">
        Sign In
      </a>
    );
  }

  const displayName = profile?.display_name || profile?.username || 'Profile';
  const username = profile?.username;

  return (
    <>
      {username && (
        <a href={`/social/profile/${username}`} class="block text-text py-1.5">
          {displayName}
        </a>
      )}
      <button
        onClick={signOut}
        class="block text-left text-text-dim py-1.5 w-full"
      >
        Sign Out
      </button>
    </>
  );
}
