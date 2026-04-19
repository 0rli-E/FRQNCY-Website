import { useState, useEffect } from 'preact/hooks';
import { supabase } from '../lib/supabase';

interface ProfileCardProps {
  username: string;
}

interface ProfileRow {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  post_count: number;
  follower_count: number;
  following_count: number;
  created_at: string;
}

function monthYear(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  } catch {
    return '';
  }
}

export default function ProfileCard({ username }: ProfileCardProps) {
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, bio, post_count, follower_count, following_count, created_at')
        .eq('username', username)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        setNotFound(true);
      } else {
        setProfile(data as ProfileRow);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [username]);

  const displayName = profile?.display_name || (username.charAt(0).toUpperCase() + username.slice(1));
  const initials = (profile?.display_name || username).slice(0, 2).toUpperCase();

  if (loading) {
    return (
      <div class="rounded-xl bg-card-bg border border-card-border overflow-hidden animate-pulse">
        <div class="h-24 bg-navy-mid" />
        <div class="px-5 pb-5">
          <div class="-mt-10 mb-3">
            <div class="w-20 h-20 rounded-full bg-navy-mid border-4 border-navy" />
          </div>
          <div class="h-5 bg-navy-mid rounded w-1/2 mb-2" />
          <div class="h-3 bg-navy-mid rounded w-1/3 mb-3" />
          <div class="h-3 bg-navy-mid rounded w-full mb-1" />
          <div class="h-3 bg-navy-mid rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div class="rounded-xl bg-card-bg border border-card-border p-6 text-center">
        <p class="text-sm text-text-dim">No profile found for @{username}</p>
      </div>
    );
  }

  return (
    <div class="rounded-xl bg-card-bg border border-card-border overflow-hidden">
      {/* Banner */}
      <div class="h-24 bg-gradient-to-br from-navy-mid via-accent/10 to-gold/10" />

      {/* Avatar + info */}
      <div class="px-5 pb-5">
        <div class="-mt-10 mb-3">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={displayName}
              class="w-20 h-20 rounded-full object-cover border-4 border-navy"
            />
          ) : (
            <div class="w-20 h-20 rounded-full bg-navy-mid border-4 border-navy flex items-center justify-center text-gold text-xl font-heading font-semibold">
              {initials}
            </div>
          )}
        </div>

        <h2 class="font-heading text-2xl text-gold">{displayName}</h2>
        <p class="text-sm text-text-dim mt-0.5">@{profile?.username || username}</p>

        {profile?.bio && (
          <p class="text-sm text-text leading-relaxed mt-3">{profile.bio}</p>
        )}

        {profile?.created_at && (
          <div class="flex items-center gap-4 mt-4 text-xs text-text-dim">
            <span class="flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Joined {monthYear(profile.created_at)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
