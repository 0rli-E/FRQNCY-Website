import { useState } from 'preact/hooks';

interface MessageInputProps {
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
}

export default function MessageInput({ onSend, disabled = false }: MessageInputProps) {
  const [value, setValue] = useState('');
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const doSend = async () => {
    const trimmed = value.trim();
    if (!trimmed || sending || disabled) return;
    setSending(true);
    setErr(null);
    try {
      await onSend(trimmed);
      setValue('');
    } catch (e: any) {
      setErr(e?.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      doSend();
    }
  };

  const onSubmit = (e: Event) => {
    e.preventDefault();
    doSend();
  };

  return (
    <form
      onSubmit={onSubmit}
      class="border-t border-card-border bg-card-bg p-3"
    >
      {err && (
        <p class="text-xs text-red-400 mb-2 px-1">{err}</p>
      )}
      <div class="flex items-end gap-2">
        <textarea
          value={value}
          onInput={(e) => setValue((e.target as HTMLTextAreaElement).value)}
          onKeyDown={onKeyDown}
          placeholder="Type a message..."
          rows={1}
          disabled={disabled || sending}
          class="flex-1 bg-navy-mid border border-card-border rounded-xl px-3 py-2 text-sm text-text placeholder-text-dim focus:outline-none focus:border-gold/40 transition-colors resize-none max-h-40 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!value.trim() || sending || disabled}
          class="px-4 py-2 rounded-xl bg-gold text-navy text-sm font-medium hover:bg-gold-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </div>
    </form>
  );
}
