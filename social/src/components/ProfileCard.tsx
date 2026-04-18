interface ProfileCardProps {
  username: string;
}

export default function ProfileCard({ username }: ProfileCardProps) {
  const displayName = username.charAt(0).toUpperCase() + username.slice(1);
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div class="rounded-xl bg-card-bg border border-card-border overflow-hidden">
      {/* Banner */}
      <div class="h-24 bg-gradient-to-br from-navy-mid via-accent/10 to-gold/10" />

      {/* Avatar + info */}
      <div class="px-5 pb-5">
        <div class="-mt-10 mb-3">
          <div class="w-20 h-20 rounded-full bg-navy-mid border-4 border-navy flex items-center justify-center text-gold text-xl font-heading font-semibold">
            {initials}
          </div>
        </div>

        <h2 class="font-heading text-2xl text-gold">{displayName}</h2>
        <p class="text-sm text-text-dim mt-0.5">@{username}</p>

        <p class="text-sm text-text leading-relaxed mt-3">
          Explorer of consciousness, seeker of truth. Connecting ancient wisdom with modern science on the FRQNCY network.
        </p>

        <div class="flex items-center gap-4 mt-4 text-xs text-text-dim">
          <span class="flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Earth
          </span>
          <span class="flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Joined March 2026
          </span>
        </div>
      </div>
    </div>
  );
}
