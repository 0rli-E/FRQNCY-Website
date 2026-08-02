import { supabase } from './supabase';

// ─────────────────────────────────────────────────────────────────────────────
// Moderation v1 — blocks + reports.
//
// The enforcement lives in RLS (migration 025), not here. These helpers drive
// the UI; they are not the security boundary. A block holds even if a future
// read path forgets to call anything in this file.
// ─────────────────────────────────────────────────────────────────────────────

export type ReportTargetType = 'post' | 'profile' | 'comment' | 'message' | 'group';

export type ReportReason =
  | 'spam'
  | 'harassment'
  | 'hate'
  | 'violence'
  | 'sexual_content'
  | 'self_harm'
  | 'impersonation'
  | 'misinformation'
  | 'other';

/** Reasons in the order they're offered, with the copy the UI shows. */
export const REPORT_REASONS: { value: ReportReason; label: string; hint: string }[] = [
  { value: 'harassment',     label: 'Harassment',            hint: 'Targeting or intimidating a person.' },
  { value: 'hate',           label: 'Hate',                  hint: 'Attacks on people for who they are.' },
  { value: 'violence',       label: 'Violence or threats',   hint: 'Threatening or glorifying harm.' },
  { value: 'self_harm',      label: 'Self-harm',             hint: 'Someone may be at risk.' },
  { value: 'sexual_content', label: 'Sexual content',        hint: 'Explicit material, or content involving minors.' },
  { value: 'spam',           label: 'Spam',                  hint: 'Repetitive, automated, or purely promotional.' },
  { value: 'impersonation',  label: 'Impersonation',         hint: 'Pretending to be someone else.' },
  { value: 'misinformation', label: 'Misleading claims',     hint: 'Presented as fact, likely to cause harm.' },
  { value: 'other',          label: 'Something else',        hint: 'Tell us what you saw.' },
];

export interface BlockedProfile {
  blocked_id: string;
  created_at: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

// Mirrors the groupsSchemaMissing pattern in groups.ts: flips true the first
// time a query fails because migration 025 hasn't been applied, so the UI
// degrades to "no moderation surface" instead of throwing on every render.
export let moderationSchemaMissing = false;

function isMissingSchema(message?: string | null): boolean {
  return /relation .*(blocks|reports)|table .*(blocks|reports).*does not exist|schema cache/i.test(
    message || ''
  );
}

/**
 * Is migration 025 actually applied to the database this build is talking to?
 *
 * The UI must not offer Block or Report before the tables exist — an action
 * that silently fails is worse than no action, and moderation is the last
 * place to be casual about that. Probed once per page load and cached.
 *
 * A signed-out user gets an empty result rather than an error (RLS filters to
 * their own rows, of which there are none), so this distinguishes "table
 * missing" from "nothing to see", which is what we need.
 */
let moderationAvailability: Promise<boolean> | null = null;

export function moderationAvailable(): Promise<boolean> {
  if (!moderationAvailability) {
    moderationAvailability = supabase
      .from('blocks')
      .select('blocker_id')
      .limit(1)
      .then(({ error }) => {
        if (error) {
          moderationSchemaMissing = true;
          console.warn('[moderation] schema missing — apply migration 025_moderation.sql.');
          return false;
        }
        return true;
      });
  }
  return moderationAvailability;
}

// ── Blocks ───────────────────────────────────────────────────────────────────

/**
 * IDs the current user has blocked. RLS shows only rows where you are the
 * blocker — you cannot enumerate who blocked you, by design.
 *
 * Cached per session: the feed calls this on every fetch, and the answer
 * changes only when this tab blocks or unblocks someone (both of which clear
 * the cache below).
 */
let blockedIdCache: string[] | null = null;

export async function getBlockedIds(force = false): Promise<string[]> {
  if (moderationSchemaMissing) return [];
  if (!force && blockedIdCache) return blockedIdCache;

  const { data, error } = await supabase.from('blocks').select('blocked_id');
  if (error) {
    if (isMissingSchema(error.message)) {
      moderationSchemaMissing = true;
      console.warn('[moderation] schema missing — apply migration 025_moderation.sql.');
      return [];
    }
    console.error('getBlockedIds error:', error.message);
    return [];
  }
  blockedIdCache = (data ?? []).map((r: any) => r.blocked_id);
  return blockedIdCache;
}

export function clearBlockCache(): void {
  blockedIdCache = null;
}

/** Blocked accounts with enough profile detail to render the manage list. */
export async function listBlockedProfiles(): Promise<BlockedProfile[]> {
  if (moderationSchemaMissing) return [];
  const { data, error } = await supabase
    .from('blocks')
    .select('blocked_id, created_at, blocked:profiles!blocks_blocked_id_fkey(username, display_name, avatar_url)')
    .order('created_at', { ascending: false });

  if (error) {
    if (isMissingSchema(error.message)) {
      moderationSchemaMissing = true;
      return [];
    }
    console.error('listBlockedProfiles error:', error.message);
    return [];
  }

  return (data ?? []).map((r: any) => ({
    blocked_id: r.blocked_id,
    created_at: r.created_at,
    username: r.blocked?.username ?? 'unknown',
    display_name: r.blocked?.display_name ?? 'Unknown',
    avatar_url: r.blocked?.avatar_url ?? null,
  }));
}

export async function isBlocked(userId: string): Promise<boolean> {
  const ids = await getBlockedIds();
  return ids.includes(userId);
}

export async function blockUser(blockedId: string): Promise<{ ok: boolean; error?: string }> {
  const { data: auth } = await supabase.auth.getUser();
  const me = auth?.user?.id;
  if (!me) return { ok: false, error: 'Sign in to block someone.' };
  if (me === blockedId) return { ok: false, error: "You can't block yourself." };

  const { error } = await supabase
    .from('blocks')
    .upsert({ blocker_id: me, blocked_id: blockedId }, { onConflict: 'blocker_id,blocked_id' });

  if (error) {
    if (isMissingSchema(error.message)) {
      moderationSchemaMissing = true;
      return { ok: false, error: 'Blocking is not available yet.' };
    }
    return { ok: false, error: error.message };
  }
  clearBlockCache();
  return { ok: true };
}

export async function unblockUser(blockedId: string): Promise<{ ok: boolean; error?: string }> {
  const { data: auth } = await supabase.auth.getUser();
  const me = auth?.user?.id;
  if (!me) return { ok: false, error: 'Sign in first.' };

  const { error } = await supabase
    .from('blocks')
    .delete()
    .eq('blocker_id', me)
    .eq('blocked_id', blockedId);

  if (error) return { ok: false, error: error.message };
  clearBlockCache();
  return { ok: true };
}

// ── Reports ──────────────────────────────────────────────────────────────────

export async function reportContent(input: {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  detail?: string;
}): Promise<{ ok: boolean; error?: string; alreadyReported?: boolean }> {
  const { data: auth } = await supabase.auth.getUser();
  const me = auth?.user?.id;
  if (!me) return { ok: false, error: 'Sign in to report.' };

  const { error } = await supabase.from('reports').insert({
    reporter_id: me,
    target_type: input.targetType,
    target_id: input.targetId,
    reason: input.reason,
    detail: input.detail?.trim() || null,
  });

  if (error) {
    // Unique (reporter, target_type, target_id) — you already reported this.
    // Treat as success: the report is on file, which is what the user wanted.
    if (error.code === '23505') return { ok: true, alreadyReported: true };
    if (isMissingSchema(error.message)) {
      moderationSchemaMissing = true;
      return { ok: false, error: 'Reporting is not available yet.' };
    }
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/** Target IDs the current user has already reported, for a given target type. */
export async function getMyReportedIds(targetType: ReportTargetType): Promise<string[]> {
  if (moderationSchemaMissing) return [];
  const { data, error } = await supabase
    .from('reports')
    .select('target_id')
    .eq('target_type', targetType);

  if (error) {
    if (isMissingSchema(error.message)) moderationSchemaMissing = true;
    return [];
  }
  return (data ?? []).map((r: any) => r.target_id);
}
