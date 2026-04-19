import ProjectBadge, { TIER_COLORS } from './ProjectBadge';

type ConvictionStatus = 'aged_well' | 'aged_poorly' | 'too_early';

interface ConvictionCardProps {
  projectName: string;
  projectTier: string;
  /** The user's conviction statement, e.g. "Core conviction — price target $10K" */
  call: string;
  /** ISO date string of when the call was made */
  date: string;
  /** How the call has aged */
  status: ConvictionStatus;
  /** Optional: who made the call */
  author?: string;
  /** Optional: link to the user's profile */
  authorUsername?: string;
}

const STATUS_CONFIG: Record<
  ConvictionStatus,
  { label: string; color: string; icon: string }
> = {
  aged_well: {
    label: 'Aged well',
    color: '#4ADE80',
    icon: 'M5 13l4 4L19 7', // checkmark
  },
  aged_poorly: {
    label: 'Aged poorly',
    color: '#F87171',
    icon: 'M6 18L18 6M6 6l12 12', // x mark
  },
  too_early: {
    label: 'Too early to tell',
    color: '#7090B8',
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', // clock
  },
};

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function daysSince(iso: string): number {
  try {
    const d = new Date(iso);
    const now = new Date();
    return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

export default function ConvictionCard({
  projectName,
  projectTier,
  call,
  date,
  status,
  author,
  authorUsername,
}: ConvictionCardProps) {
  const cfg = STATUS_CONFIG[status];
  const days = daysSince(date);

  return (
    <div class="rounded-xl bg-card-bg border border-card-border p-4 hover:border-gold/10 transition-colors">
      {/* Top row: project badge + status */}
      <div class="flex items-center justify-between gap-3">
        <ProjectBadge name={projectName} tier={projectTier} />

        <span
          class="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: `${cfg.color}12`,
            border: `1px solid ${cfg.color}25`,
            color: cfg.color,
          }}
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d={cfg.icon}
            />
          </svg>
          {cfg.label}
        </span>
      </div>

      {/* Conviction statement */}
      <p class="text-sm text-text leading-relaxed mt-3">{call}</p>

      {/* Footer: date + author */}
      <div class="flex items-center justify-between mt-3 pt-2.5 border-t border-card-border">
        <div class="flex items-center gap-2 text-[11px] text-text-dim">
          <svg class="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span>{formatDate(date)}</span>
          <span class="opacity-40">({days}d ago)</span>
        </div>

        {author && (
          <div class="text-[11px] text-text-dim">
            {authorUsername ? (
              <a
                href={`/social/profile/${authorUsername}`}
                class="hover:text-gold transition-colors"
              >
                @{authorUsername}
              </a>
            ) : (
              <span>{author}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export type { ConvictionStatus, ConvictionCardProps };
