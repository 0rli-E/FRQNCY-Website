interface LinkPreview {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  site_name?: string;
}

interface LinkPreviewCardProps {
  preview: LinkPreview;
  /** Render an "x" remove button — used in the composer. */
  onRemove?: () => void;
  /** Compact variant for list views. */
  compact?: boolean;
}

/**
 * LinkPreviewCard — renders the OG-scraped preview as a clean card. Used
 * inside both PostComposer (with a remove button) and PostCard (read-only).
 *
 * Falls back gracefully when image / description / site_name are missing —
 * the URL itself is always rendered.
 */
export default function LinkPreviewCard({ preview, onRemove, compact }: LinkPreviewCardProps) {
  if (!preview || !preview.url) return null;

  let host = '';
  try { host = new URL(preview.url).hostname.replace(/^www\./, ''); } catch (_) { host = preview.site_name || ''; }

  return (
    <div class={`relative rounded-lg border border-card-border bg-navy-mid/40 overflow-hidden hover:border-gold/30 transition-colors ${compact ? 'flex items-stretch' : ''}`}>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove link preview"
          class="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-navy/70 backdrop-blur-sm text-text-dim hover:text-text hover:bg-navy text-sm flex items-center justify-center"
        >×</button>
      )}
      {preview.image && (
        <a
          href={preview.url}
          target="_blank"
          rel="noopener noreferrer"
          class={compact ? 'shrink-0 w-32 bg-navy-deep' : 'block bg-navy-deep'}
        >
          <img
            src={preview.image}
            alt=""
            loading="lazy"
            class={compact ? 'w-full h-full object-cover' : 'w-full max-h-72 object-cover'}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        </a>
      )}
      <a
        href={preview.url}
        target="_blank"
        rel="noopener noreferrer"
        class="block p-3 text-text hover:text-text"
      >
        <div class="text-xs text-text-dim uppercase tracking-wider mb-1">{preview.site_name || host}</div>
        {preview.title && <div class="font-medium text-sm leading-snug mb-1">{preview.title}</div>}
        {preview.description && !compact && (
          <p class="text-xs text-text-dim leading-relaxed line-clamp-2">{preview.description}</p>
        )}
      </a>
    </div>
  );
}

export type { LinkPreview };
