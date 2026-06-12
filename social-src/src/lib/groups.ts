import { supabase } from './supabase';

// ── Types ────────────────────────────────────────────────────────────────────
export interface Group {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  visibility: 'open' | 'private';
  accent: string | null;
  created_by: string | null;
  member_count: number;
  created_at: string;
}

export type NewGroup = {
  name: string;
  description?: string;
  visibility?: 'open' | 'private';
  accent?: string;
};

// Flips to true the first time a query fails because migration 023 hasn't been
// applied yet. Lets the UI ship + the global feed keep working before the
// groups schema lands — every reader degrades to "no groups" instead of throwing.
export let groupsSchemaMissing = false;

function isMissingSchema(message?: string | null): boolean {
  return /relation .*group|column .*group_id|groups.*does not exist|group_members/i.test(
    message || ''
  );
}

/** Turn a free-text group name into a URL-safe slug. */
export function slugifyGroupName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

// ── Reads ────────────────────────────────────────────────────────────────────

/** All open groups, most-populated first (then newest). */
export async function listOpenGroups(): Promise<Group[]> {
  if (groupsSchemaMissing) return [];
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('visibility', 'open')
    .order('member_count', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) {
    if (isMissingSchema(error.message)) {
      groupsSchemaMissing = true;
      console.warn('[groups] schema missing — apply migration 023_groups.sql.');
      return [];
    }
    console.error('listOpenGroups error:', error.message);
    return [];
  }
  return (data ?? []) as Group[];
}

export async function getGroupBySlug(slug: string): Promise<Group | null> {
  if (groupsSchemaMissing) return null;
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .ilike('slug', slug)
    .maybeSingle();
  if (error) {
    if (isMissingSchema(error.message)) {
      groupsSchemaMissing = true;
      return null;
    }
    console.error('getGroupBySlug error:', error.message);
    return null;
  }
  return (data as Group) ?? null;
}

/** The group ids the user has joined (used to render join/leave state). */
export async function getMyGroupIds(userId: string): Promise<Set<string>> {
  if (groupsSchemaMissing || !userId) return new Set();
  const { data, error } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', userId);
  if (error) {
    if (isMissingSchema(error.message)) groupsSchemaMissing = true;
    return new Set();
  }
  return new Set((data ?? []).map((r: any) => r.group_id));
}

export async function isMember(groupId: string, userId: string): Promise<boolean> {
  if (groupsSchemaMissing || !userId) return false;
  const { data, error } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    if (isMissingSchema(error.message)) groupsSchemaMissing = true;
    return false;
  }
  return !!data;
}

// ── Writes ───────────────────────────────────────────────────────────────────

/** Join an open group. Idempotent — re-joining is a no-op (PK conflict ignored). */
export async function joinGroup(groupId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('group_members')
    .upsert({ group_id: groupId, user_id: userId, role: 'member' }, { onConflict: 'group_id,user_id', ignoreDuplicates: true });
  if (error) {
    console.error('joinGroup error:', error.message);
    return false;
  }
  return true;
}

export async function leaveGroup(groupId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId);
  if (error) {
    console.error('leaveGroup error:', error.message);
    return false;
  }
  return true;
}

/**
 * Create a group and auto-join the creator as admin. Returns the new group, or
 * null on failure (e.g. slug collision — surfaced to the caller for a retry).
 */
export async function createGroup(input: NewGroup, userId: string): Promise<{ group: Group | null; error?: string }> {
  const slug = slugifyGroupName(input.name);
  if (!slug) return { group: null, error: 'Please choose a name with at least one letter or number.' };

  const { data, error } = await supabase
    .from('groups')
    .insert({
      slug,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      visibility: input.visibility ?? 'open',
      accent: input.accent ?? null,
      created_by: userId,
    })
    .select('*')
    .single();

  if (error) {
    if (/duplicate key|unique|idx_groups_slug/i.test(error.message)) {
      return { group: null, error: `A group at /${slug} already exists. Try a different name.` };
    }
    if (isMissingSchema(error.message)) {
      groupsSchemaMissing = true;
      return { group: null, error: 'Groups aren’t enabled yet (migration 023 not applied).' };
    }
    return { group: null, error: error.message };
  }

  const group = data as Group;
  // Auto-join the creator as admin so they immediately appear as a member and
  // can post. Best-effort: the group exists even if this insert races.
  await supabase
    .from('group_members')
    .upsert({ group_id: group.id, user_id: userId, role: 'admin' }, { onConflict: 'group_id,user_id', ignoreDuplicates: true });

  return { group };
}
