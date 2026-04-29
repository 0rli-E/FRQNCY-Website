import { useRef, useState } from 'preact/hooks';

interface MessageInputProps {
  onSend: (content: string, attachment?: File) => Promise<void>;
  disabled?: boolean;
}

// Bytes — must match the dm-media bucket file_size_limit in migration 011.
// Keep this synced if the migration ever raises/lowers the cap.
const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MessageInput({ onSend, disabled = false }: MessageInputProps) {
  const [value, setValue] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const doSend = async () => {
    const trimmed = value.trim();
    if (sending || disabled) return;
    // Allow attachment-only sends — at least one of {text, attachment} required.
    if (!trimmed && !attachment) return;
    setSending(true);
    setErr(null);
    try {
      await onSend(trimmed, attachment ?? undefined);
      setValue('');
      setAttachment(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
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

  const onPickFile = () => {
    if (disabled || sending) return;
    fileInputRef.current?.click();
  };

  const onFileChosen = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (!file) return;
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setErr(`Attachment too large (max ${formatSize(MAX_ATTACHMENT_BYTES)}).`);
      input.value = '';
      return;
    }
    setErr(null);
    setAttachment(file);
  };

  const removeAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const canSubmit = (!!value.trim() || !!attachment) && !sending && !disabled;

  return (
    <form
      onSubmit={onSubmit}
      class="border-t border-card-border bg-card-bg p-3"
    >
      {err && (
        <p class="text-xs text-red-400 mb-2 px-1">{err}</p>
      )}
      {attachment && (
        <div class="mb-2 flex items-center gap-2 px-2 py-1.5 rounded-lg bg-navy-mid border border-card-border text-xs text-text-dim">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="w-3.5 h-3.5 text-gold/70 shrink-0"
          >
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
          </svg>
          <span class="truncate flex-1">{attachment.name}</span>
          <span class="shrink-0">{formatSize(attachment.size)}</span>
          <button
            type="button"
            onClick={removeAttachment}
            disabled={sending}
            aria-label="Remove attachment"
            class="ml-1 text-text-dim hover:text-text disabled:opacity-30"
          >
            ×
          </button>
        </div>
      )}
      <div class="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          class="hidden"
          onChange={onFileChosen}
        />
        <button
          type="button"
          onClick={onPickFile}
          disabled={disabled || sending}
          aria-label="Attach image"
          class="p-2 rounded-xl text-text-dim hover:text-gold hover:bg-navy-mid transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="w-5 h-5"
          >
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
          </svg>
        </button>
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
          disabled={!canSubmit}
          class="px-4 py-2 rounded-xl bg-gold text-navy text-sm font-medium hover:bg-gold-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </div>
    </form>
  );
}
