import { useState, useEffect } from 'preact/hooks';
import { useAuth } from './AuthProvider';
import { supabase } from '../lib/supabase';

interface FollowButtonProps {
  username: string;
}

export default function FollowButton({ username }: FollowButtonProps) {
  const { user } = useAuth();
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [following, setFollowing] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(true);

  // Resolve username → user id
  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .maybeSingle();
      if (cancelled) return;
      setTargetUserId(data?.id ?? null);
      setResolving(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [username]);

  // Check if current user follows this profile
  useEffect(() => {
    if (!user || !targetUserId || user.id === targetUserId) return;

    const checkFollow = async () => {
      const { data } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .maybeSingle();

      if (data) setFollowing(true);
    };

    checkFollow();
  }, [user, targetUserId]);

  // Hide while resolving, on own profile, or when signed out
  if (resolving || !user || !targetUserId || user.id === targetUserId) return null;

  const toggle = async () => {
    if (loading) return;
    setLoading(true);

    try {
      if (following) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId);
        setFollowing(false);
      } else {
        await supabase
          .from('follows')
          .insert({ follower_id: user.id, following_id: targetUserId });
        setFollowing(true);
      }
    } catch (err) {
      console.error('Follow toggle failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const label = following ? (hovering ? 'Unfollow' : 'Following') : 'Follow';

  return (
    <button
      onClick={toggle}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      disabled={loading}
      class={`w-full py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 ${
        following
          ? hovering
            ? 'bg-red-500/10 border border-red-500/30 text-red-400'
            : 'bg-gold/10 border border-gold/30 text-gold'
          : 'bg-gold text-navy hover:bg-gold-light'
      }`}
    >
      {label}
    </button>
  );
}
