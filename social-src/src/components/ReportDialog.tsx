import { useState } from 'preact/hooks';
import { REPORT_REASONS, reportContent, type ReportReason, type ReportTargetType } from '../lib/moderation';

interface ReportDialogProps {
  targetType: ReportTargetType;
  targetId: string;
  /** Shown in the heading so it's unambiguous what's being reported. */
  targetLabel?: string;
  onClose: () => void;
  onReported?: () => void;
}

/**
 * Report a post, profile, comment, message or group.
 *
 * Copy note: reporting is framed as "ask a human to look", not as punishment.
 * Nothing here removes content — migration 025 deliberately has no auto-hide
 * threshold, and the dialog says so, because a promise of instant removal is
 * one we can't keep.
 */
export default function ReportDialog({
  targetType,
  targetId,
  targetLabel,
  onClose,
  onReported,
}: ReportDialogProps) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [detail, setDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!reason) {
      setError('Pick what you saw, so a person knows what to look for.');
      return;
    }
    setSubmitting(true);
    setError(null);

    const res = await reportContent({ targetType, targetId, reason, detail });
    setSubmitting(false);

    if (!res.ok) {
      setError(res.error ?? 'That did not go through. Try again.');
      return;
    }
    setDone(true);
    onReported?.();
  };

  return (
    <div
      class="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Report content"
    >
      {done ? (
        <div class="w-full max-w-md rounded-xl bg-navy-mid border border-card-border p-5 space-y-4">
          <h3 class="font-heading text-xl text-gold">Thank you — it's on file</h3>
          <p class="text-sm text-text-dim leading-relaxed">
            A person will read this. Reports don't remove anything automatically,
            so if you'd rather not see this account at all, blocking takes effect
            straight away.
          </p>
          <div class="flex justify-end pt-2 border-t border-card-border">
            <button
              type="button"
              onClick={onClose}
              class="text-sm px-5 py-1.5 rounded-full bg-gold text-navy font-medium hover:bg-gold-light transition-colors"
            >Close</button>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          class="w-full max-w-md rounded-xl bg-navy-mid border border-card-border p-5 space-y-4 max-h-[85vh] overflow-y-auto"
        >
          <div class="flex items-start justify-between">
            <div>
              <h3 class="font-heading text-xl text-gold">Report this {targetType}</h3>
              {targetLabel && (
                <p class="text-xs text-text-dim mt-0.5 truncate max-w-[18rem]">{targetLabel}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              class="text-text-dim hover:text-text text-xl leading-none -mt-1"
            >×</button>
          </div>

          <fieldset class="space-y-1.5">
            <legend class="block text-xs uppercase tracking-wider text-text-dim mb-1.5">
              What did you see?
            </legend>
            {REPORT_REASONS.map((r) => (
              <label
                key={r.value}
                class={`flex items-start gap-2.5 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
                  reason === r.value
                    ? 'border-gold/60 bg-gold/10'
                    : 'border-card-border bg-navy-deep hover:border-gold/30'
                }`}
              >
                <input
                  type="radio"
                  name="report-reason"
                  value={r.value}
                  checked={reason === r.value}
                  onChange={() => { setReason(r.value); setError(null); }}
                  class="mt-1 accent-gold"
                />
                <span>
                  <span class="block text-sm text-text">{r.label}</span>
                  <span class="block text-xs text-text-dim">{r.hint}</span>
                </span>
              </label>
            ))}
          </fieldset>

          <div>
            <label class="block text-xs uppercase tracking-wider text-text-dim mb-1.5">
              Anything else? (optional)
            </label>
            <textarea
              value={detail}
              onInput={(e) => setDetail((e.target as HTMLTextAreaElement).value)}
              maxLength={1000}
              rows={3}
              placeholder="Context helps the person reading this."
              class="w-full bg-navy-deep border border-card-border rounded-lg px-3 py-2 text-sm text-text placeholder-text-dim focus:outline-none focus:border-gold/50"
            />
          </div>

          {error && (
            <div class="text-xs text-bad bg-bad/10 border border-bad/30 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div class="flex items-center justify-end gap-2 pt-2 border-t border-card-border">
            <button
              type="button"
              onClick={onClose}
              class="text-sm text-text-dim hover:text-text transition-colors px-3 py-1.5"
            >Cancel</button>
            <button
              type="submit"
              disabled={submitting}
              class="text-sm px-5 py-1.5 rounded-full bg-gold text-navy font-medium hover:bg-gold-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >{submitting ? 'Sending…' : 'Send report'}</button>
          </div>
        </form>
      )}
    </div>
  );
}
