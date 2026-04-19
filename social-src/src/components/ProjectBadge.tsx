/** Tier color map matching FRQNCY's design system */
const TIER_COLORS: Record<string, string> = {
  S: '#C4973A',
  A: '#7B61FF',
  B: '#4A9AE8',
  C: '#7090B8',
  D: '#5A6A7A',
  E: '#4A5260',
  F: '#3A3F48',
};

function getTierColor(tier: string): string {
  return TIER_COLORS[tier?.toUpperCase()] ?? TIER_COLORS.D;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

type Conviction = 'bullish' | 'bearish' | 'neutral';

const CONVICTION_GLYPH: Record<Conviction, string> = {
  bullish: '▲',
  bearish: '▼',
  neutral: '▬',
};

interface ProjectBadgeProps {
  name: string;
  tier: string;
  /** Render as a link to the project page (default: true) */
  linked?: boolean;
  /** Compact mode hides the tier letter (default: false) */
  compact?: boolean;
  /** Optional author conviction — renders a small indicator at the tail */
  conviction?: Conviction | null;
}

export default function ProjectBadge({
  name,
  tier,
  linked = true,
  compact = false,
  conviction = null,
}: ProjectBadgeProps) {
  const color = getTierColor(tier);
  const href = `/v2/crypto/projects.html#${slugify(name)}`;

  const convictionGlyph = conviction ? CONVICTION_GLYPH[conviction] : null;
  // Gold for bullish, muted for bearish/neutral — stays on-palette.
  const convictionColor =
    conviction === 'bullish'
      ? '#C4973A' // gold
      : conviction === 'bearish'
      ? '#7090B8' // text-dim
      : '#C8D8F0'; // text (for neutral)

  const badge = (
    <span
      class="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full transition-colors hover:brightness-110"
      style={{
        backgroundColor: `${color}15`,
        border: `1px solid ${color}30`,
        color: color,
      }}
    >
      {/* Tier dot indicator */}
      <span
        class="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      <span class="font-medium truncate max-w-[140px]">{name}</span>
      {!compact && (
        <span
          class="text-[10px] font-bold opacity-70 ml-0.5"
          style={{ color }}
        >
          {tier?.toUpperCase()}
        </span>
      )}
      {convictionGlyph && (
        <span
          class="text-[10px] leading-none ml-0.5"
          style={{ color: convictionColor }}
          title={`Author is ${conviction}`}
          aria-label={`Conviction: ${conviction}`}
        >
          {convictionGlyph}
        </span>
      )}
    </span>
  );

  if (!linked) return badge;

  return (
    <a
      href={href}
      class="inline-block no-underline"
      title={`View ${name} project page (Tier ${tier?.toUpperCase()})`}
    >
      {badge}
    </a>
  );
}

export { TIER_COLORS, getTierColor };
