import { useEffect, useState } from 'preact/hooks';
import { updateProfile, type Profile } from '../lib/api';

interface EditProfileModalProps {
  open: boolean;
  profile: Profile;
  onClose: () => void;
  onSaved: (next: Profile) => void;
}

/**
 * EditProfileModal — small modal for the profile owner to update their
 * display_name, bio, and avatar_url. Wallet address is editable too because
 * the schema supports it; if Privy is wired later, that field becomes
 * authoritative and we can hide it.
 *
 * No image upload here — the post-media bucket needs migration 003 to land
 * before we can host avatars. Until then users paste a URL (or use a Gravatar
 * / their existing socials' avatar) and we render that. Once the bucket is
 * live, this modal grows a file picker.
 */
export default function EditProfileModal({ open, profile, onClose, onSaved }: EditProfileModalProps) {
  const [displayName, setDisplayName] = useState(profile.display_name || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '');
  const [walletAddress, setWalletAddress] = useState(profile.wallet_address || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset fields whenever the modal is opened with a new profile
  useEffect(() => {
    if (!open) return;
    setDisplayName(profile.display_name || '');
    setBio(profile.bio || '');
    setAvatarUrl(profile.avatar_url || '');
    setWalletAddress(profile.wallet_address || '');
    setError(null);
  }, [open, profile.id]);

  // Esc-to-close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSave = async (e: Event) => {
    e.preventDefault();
    if (saving) return;
    setError(null);

    // Lightweight validation — keep error messages short and helpful
    const dn = displayName.trim();
    if (dn.length > 60) { setError('Display name must be 60 characters or fewer.'); return; }
    if (bio.length > 280) { setError('Bio must be 280 characters or fewer.'); return; }
    if (avatarUrl && !/^https?:\/\//i.test(avatarUrl)) {
      setError('Avatar must be a full https:// URL for now.'); return;
    }

    setSaving(true);
    try {
      const next = await updateProfile(profile.id, {
        display_name: dn,
        bio: bio.trim(),
        avatar_url: avatarUrl.trim() || null as any,
        wallet_address: walletAddress.trim() || null,
      });
      if (!next) throw new Error('Update returned no row — your session may have expired.');
      onSaved(next);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Could not save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      class="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Edit your profile"
    >
      <form
        onSubmit={handleSave}
        class="w-full max-w-md rounded-xl bg-navy-mid border border-card-border p-5 space-y-4"
      >
        <div class="flex items-start justify-between">
          <h3 class="font-heading text-xl text-gold">Edit profile</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            class="text-text-dim hover:text-text text-xl leading-none -mt-1"
          >×</button>
        </div>

        <div class="space-y-3">
          <div>
            <label class="block text-xs uppercase tracking-wider text-text-dim mb-1.5">Display name</label>
            <input
              type="text"
              value={displayName}
              onInput={(e) => setDisplayName((e.target as HTMLInputElement).value)}
              maxLength={60}
              placeholder="What should the network call you?"
              class="w-full bg-navy-deep border border-card-border rounded-lg px-3 py-2 text-sm text-text placeholder-text-dim focus:outline-none focus:border-gold/50"
            />
          </div>

          <div>
            <label class="block text-xs uppercase tracking-wider text-text-dim mb-1.5">Username</label>
            <div class="bg-navy-deep border border-card-border rounded-lg px-3 py-2 text-sm text-text-dim">
              @{profile.username}
              <span class="ml-2 text-xs opacity-60">(handle is permanent)</span>
            </div>
          </div>

          <div>
            <label class="block text-xs uppercase tracking-wider text-text-dim mb-1.5">Bio</label>
            <textarea
              value={bio}
              onInput={(e) => setBio((e.target as HTMLTextAreaElement).value)}
              maxLength={280}
              rows={3}
              placeholder="A line or two about who you are and what you're working on."
              class="w-full bg-navy-deep border border-card-border rounded-lg px-3 py-2 text-sm text-text placeholder-text-dim resize-none focus:outline-none focus:border-gold/50"
            />
            <div class="text-xs text-text-dim mt-1 text-right">{bio.length}/280</div>
          </div>

          <div>
            <label class="block text-xs uppercase tracking-wider text-text-dim mb-1.5">Avatar URL</label>
            <input
              type="url"
              value={avatarUrl}
              onInput={(e) => setAvatarUrl((e.target as HTMLInputElement).value)}
              placeholder="https://…"
              class="w-full bg-navy-deep border border-card-border rounded-lg px-3 py-2 text-sm text-text placeholder-text-dim focus:outline-none focus:border-gold/50"
            />
            <div class="text-xs text-text-dim mt-1">
              Paste a URL for now — direct upload arrives with the storage bucket.
            </div>
          </div>

          <div>
            <label class="block text-xs uppercase tracking-wider text-text-dim mb-1.5">Wallet address (optional)</label>
            <input
              type="text"
              value={walletAddress}
              onInput={(e) => setWalletAddress((e.target as HTMLInputElement).value)}
              placeholder="0x… or a Solana address"
              class="w-full bg-navy-deep border border-card-border rounded-lg px-3 py-2 text-sm text-text placeholder-text-dim focus:outline-none focus:border-gold/50 font-mono"
            />
          </div>
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
            disabled={saving}
            class="text-sm px-5 py-1.5 rounded-full bg-gold text-navy font-medium hover:bg-gold-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >{saving ? 'Saving…' : 'Save profile'}</button>
        </div>
      </form>
    </div>
  );
}
