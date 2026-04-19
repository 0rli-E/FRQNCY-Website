// ConvictionToggle — three-pill selector: Bullish / Neutral / Bearish.
//
// Used alongside ProjectPicker in PostComposer. Conviction is optional
// (null = user declined to declare). We intentionally avoid bright reds and
// greens; instead we use gold-forward variants keyed to the FRQNCY palette:
//   bullish  → gold (▲)
//   neutral  → text-dim (▬)
//   bearish  → muted slate (▼)

export type Conviction = 'bullish' | 'bearish' | 'neutral';

interface ConvictionToggleProps {
  value: Conviction | null;
  onChange: (value: Conviction | null) => void;
  /** Show a subtle label above the pills (default true). */
  showLabel?: boolean;
}

interface OptionConfig {
  key: Conviction;
  label: string;
  glyph: string;
  activeClass: string;
  inactiveClass: string;
}

const OPTIONS: OptionConfig[] = [
  {
    key: 'bullish',
    label: 'Bullish',
    glyph: '▲',
    activeClass: 'bg-gold/15 border-gold/40 text-gold',
    inactiveClass: 'border-card-border text-text-dim hover:text-gold hover:border-gold/20',
  },
  {
    key: 'neutral',
    label: 'Neutral',
    glyph: '▬',
    activeClass: 'bg-white/5 border-text-dim/40 text-text',
    inactiveClass: 'border-card-border text-text-dim hover:text-text hover:border-text-dim/30',
  },
  {
    key: 'bearish',
    label: 'Bearish',
    glyph: '▼',
    activeClass: 'bg-white/5 border-text-dim/40 text-text-dim',
    inactiveClass: 'border-card-border text-text-dim hover:text-text hover:border-text-dim/30',
  },
];

export default function ConvictionToggle({
  value,
  onChange,
  showLabel = true,
}: ConvictionToggleProps) {
  return (
    <div class="flex flex-col gap-1.5">
      {showLabel && (
        <span class="text-[10px] uppercase tracking-wider text-text-dim/70">
          Your conviction
        </span>
      )}
      <div class="flex items-center gap-1.5" role="radiogroup" aria-label="Conviction">
        {OPTIONS.map((opt) => {
          const active = value === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(active ? null : opt.key)}
              class={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                active ? opt.activeClass : opt.inactiveClass
              }`}
              title={
                active
                  ? `${opt.label} — click to clear`
                  : `Mark as ${opt.label.toLowerCase()}`
              }
            >
              <span aria-hidden="true" class="text-[10px] leading-none">
                {opt.glyph}
              </span>
              <span class="font-medium">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Small display-only helper used by ProjectBadge and potentially PostCard.
 * Returns an inline JSX element — caller wraps / positions as needed.
 */
export function ConvictionIndicator({ value }: { value: Conviction | null | undefined }) {
  if (!value) return null;
  const opt = OPTIONS.find((o) => o.key === value);
  if (!opt) return null;
  const colorClass =
    value === 'bullish'
      ? 'text-gold'
      : value === 'bearish'
      ? 'text-text-dim'
      : 'text-text';
  return (
    <span
      class={`inline-flex items-center text-[10px] leading-none ${colorClass}`}
      title={opt.label}
      aria-label={opt.label}
    >
      {opt.glyph}
    </span>
  );
}
