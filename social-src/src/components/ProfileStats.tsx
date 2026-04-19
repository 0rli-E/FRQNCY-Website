import { useState, useEffect } from 'preact/hooks';
import { supabase } from '../lib/supabase';

interface ProfileStatsProps {
  username: string;
}

interface StatsRow {
  post_count: number;
  follower_count: number;
  following_count: number;
}

export default function ProfileStats({ username }: ProfileStatsProps) {
  const [stats, setStats] = useState<StatsRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('post_count, follower_count, following_count')
        .eq('username', username)
        .maybeSingle();
      if (cancelled) return;
      if (data) setStats(data as StatsRow);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [username]);

  const posts = stats?.post_count ?? 0;
  const followers = stats?.follower_count ?? 0;
  const following = stats?.following_count ?? 0;

  return (
    <div class="rounded-xl bg-card-bg border border-card-border p-5">
      <h3 class="font-heading text-lg text-gold mb-4">Activity</h3>
      <div class="grid grid-cols-3 gap-4 text-center">
        <div>
          <p class={`text-xl font-semibold ${loading ? 'text-text-dim' : 'text-text'}`}>
            {loading ? '—' : posts}
          </p>
          <p class="text-xs text-text-dim mt-0.5">Posts</p>
        </div>
        <div>
          <p class={`text-xl font-semibold ${loading ? 'text-text-dim' : 'text-text'}`}>
            {loading ? '—' : followers}
          </p>
          <p class="text-xs text-text-dim mt-0.5">Followers</p>
        </div>
        <div>
          <p class={`text-xl font-semibold ${loading ? 'text-text-dim' : 'text-text'}`}>
            {loading ? '—' : following}
          </p>
          <p class="text-xs text-text-dim mt-0.5">Following</p>
        </div>
      </div>
    </div>
  );
}
