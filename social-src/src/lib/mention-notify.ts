import { supabase } from './supabase';
import { extractMentions } from './render-content';

interface NotifyMentionsArgs {
  /** Plain-text body the user just submitted. */
  content: string;
  /** Author of the post / comment — never notified about themselves. */
  authorId: string;
  /**
   * What the mention is attached to so the notification page can route the
   * click. `ref_type` is 'post' | 'comment'; `ref_id` is the row id.
   */
  refType: 'post' | 'comment';
  refId: string;
}

/**
 * notifyMentions — extracts @usernames from `content`, resolves them to
 * profile ids via a single `IN ()` query, and inserts one mention
 * notification per recipient.
 *
 * Best-effort. Errors are logged but never thrown — a failed notification
 * insert should never block the actual post / comment creation.
 *
 * Self-mentions are dropped so authors don't notify themselves. The cap of
 * 10 (in extractMentions) means a single submission can fan out to at most
 * 10 notifications.
 */
export async function notifyMentions({ content, authorId, refType, refId }: NotifyMentionsArgs) {
  try {
    const usernames = extractMentions(content);
    if (usernames.length === 0) return;

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, username')
      .in('username', usernames);
    if (error || !profiles) {
      console.warn('[notifyMentions] profile lookup failed:', error?.message);
      return;
    }

    const recipients = profiles
      .map((p: any) => p.id as string)
      .filter((id) => id && id !== authorId);
    if (recipients.length === 0) return;

    const rows = recipients.map((target_user_id) => ({
      target_user_id,
      actor_id: authorId,
      type: 'mention' as const,
      ref_type: refType,
      ref_id: refId,
    }));

    const { error: insErr } = await supabase.from('notifications').insert(rows);
    if (insErr) console.warn('[notifyMentions] insert failed:', insErr.message);
  } catch (err: any) {
    console.warn('[notifyMentions] unexpected error:', err?.message || err);
  }
}
