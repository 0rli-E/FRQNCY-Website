import { supabase } from './supabase';
import {
  canonicalizeForSigning,
  loadSigningPrivateKeyLocal,
  signPayload,
} from './crypto';
import { isBlueskyConnected, publishToBluesky } from './atproto-bridge';
import { notifyMentions } from './mention-notify';

// ─── Hybrid signed-message mirror helpers ─────────────────────────────────────
// Per proposals/HYBRID-SIGNED-MIRROR.md. Best-effort signing on post + follow
// creation. If the signing key is missing (new device, lost), the row ships
// unsigned and verifiers skip it. Never blocks the user-visible action.

async function signRowFireAndForget(
  table: 'posts' | 'follows',
  matchClause: { col: string; val: string } | { col: string; val: string }[],
  recordToSign: Record<string, unknown>,
): Promise<void> {
  try {
    const signingPriv = loadSigningPrivateKeyLocal();
    if (!signingPriv) return;
    const payload = canonicalizeForSigning(recordToSign);
    const signature = await signPayload(payload, signingPriv);

    let q = supabase.from(table).update({ signature, signed_payload: payload });
    const clauses = Array.isArray(matchClause) ? matchClause : [matchClause];
    for (const c of clauses) q = q.eq(c.col, c.val);
    const { error } = await q;
    if (error) {
      console.warn(`[mirror] ${table} signature update failed (non-fatal):`, error.message);
    }
  } catch (err) {
    console.warn(`[mirror] ${table} signing threw (non-fatal):`, err);
  }
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  wallet_address: string | null;
  post_count: number;
  follower_count: number;
  following_count: number;
  karma: number;
  created_at: string;
  /** libsodium Ed25519 public key for the hybrid signed-message mirror.
      Used to verify signatures on the user's posts + follows. */
  signing_public_key: string | null;
  /** libsodium X25519 public key for E2E encrypted messaging. */
  encryption_public_key: string | null;
  /** Privy DID — present only if the user signed in via the Privy bridge. */
  privy_did: string | null;
  /** Public Bluesky/ATProto handle (e.g. alice.bsky.social). Set when the
      user connects their Bluesky account in the Connections panel. The app
      password used to authenticate lives in localStorage only — never on
      FRQNCY's server. See proposals/ATPROTO-BRIDGE.md. */
  bluesky_handle: string | null;
}

export interface Post {
  id: string;
  author_id: string;
  content: string;
  media_urls: string[];
  link_url: string | null;
  link_preview: any;
  project_tag: string | null;
  project_tier: string | null;
  likes_count: number;
  comments_count: number;
  bookmarks_count: number;
  created_at: string;
  author?: Profile;
  /** Detached Ed25519 signature (base64) over `signed_payload`. Null on
      unsigned legacy rows or rows authored from a device without a
      signing key. */
  signature: string | null;
  /** Canonical JSON payload that was signed. Verifiers re-hash this exact
      string with the author's signing_public_key. */
  signed_payload: string | null;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  parent_id: string | null;
  likes_count: number;
  created_at: string;
  author?: Profile;
}

export interface Notification {
  id: string;
  target_user_id: string;
  actor_id: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'reply' | 'friend_request' | 'friend_accept' | 'message';
  ref_type: string | null;
  ref_id: string | null;
  is_read: boolean;
  created_at: string;
  actor?: Profile;
}

export interface CryptoProject {
  name: string;
  symbol: string;
  tier: string;
  tierLabel: string;
  category: string;
  chapter: string;
  accent: string;
}

// ─── Crypto Project Cache ───────────────────────────────────────────────────

let projectCache: CryptoProject[] | null = null;

async function fetchAllProjects(): Promise<CryptoProject[]> {
  if (projectCache) return projectCache;
  try {
    const res = await fetch('/api/crypto/projects');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    projectCache = data.projects ?? [];
    return projectCache!;
  } catch (err) {
    console.error('Failed to fetch crypto projects:', err);
    return [];
  }
}

// ─── Profile ────────────────────────────────────────────────────────────────

export async function getProfile(username: string): Promise<Profile | null> {
  // SELECT * so newly-added profile columns (e.g. bluesky_handle from
  // migration 010) are returned without a code change.
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (error) {
    console.error('getProfile error:', error.message);
    return null;
  }
  return data as Profile;
}

export async function getProfileById(id: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('getProfileById error:', error.message);
    return null;
  }
  return data as Profile;
}

export async function updateProfile(
  id: string,
  updates: Partial<Pick<Profile, 'display_name' | 'bio' | 'avatar_url' | 'wallet_address'>>
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('updateProfile error:', error.message);
    return null;
  }
  return data as Profile;
}

// ─── Posts ───────────────────────────────────────────────────────────────────

export async function getFeedPosts(
  userId: string,
  limit = 20,
  offset = 0
): Promise<Post[]> {
  // Fan-out-on-read: posts from users you follow + your own posts
  const { data: followRows, error: followErr } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId);

  if (followErr) {
    console.error('getFeedPosts follow lookup error:', followErr.message);
    return [];
  }

  const followedIds = (followRows ?? []).map((r: any) => r.following_id);
  const feedAuthorIds = [...followedIds, userId];

  const { data, error } = await supabase
    .from('posts')
    .select('*, author:profiles!posts_author_id_fkey(*)')
    .in('author_id', feedAuthorIds)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('getFeedPosts error:', error.message);
    return [];
  }
  return (data ?? []) as Post[];
}

export async function getGlobalPosts(limit = 20, offset = 0): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*, author:profiles!posts_author_id_fkey(*)')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('getGlobalPosts error:', error.message);
    return [];
  }
  return (data ?? []) as Post[];
}

export async function getUserPosts(
  userId: string,
  limit = 20,
  offset = 0
): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*, author:profiles!posts_author_id_fkey(*)')
    .eq('author_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('getUserPosts error:', error.message);
    return [];
  }
  return (data ?? []) as Post[];
}

export async function getProjectPosts(
  projectTag: string,
  limit = 20,
  offset = 0
): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*, author:profiles!posts_author_id_fkey(*)')
    .eq('project_tag', projectTag)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('getProjectPosts error:', error.message);
    return [];
  }
  return (data ?? []) as Post[];
}

export async function createPost(data: {
  author_id: string;
  content: string;
  media_urls?: string[];
  link_url?: string;
  link_preview?: any;
  project_tag?: string;
  project_tier?: string;
  /** Whether to mirror this post to the user's connected Bluesky account.
      Defaults to true when the user has a connection, false otherwise.
      Pass false explicitly from the composer to suppress for one post. */
  crosspostToBluesky?: boolean;
}): Promise<Post | null> {
  const { data: post, error } = await supabase
    .from('posts')
    .insert({
      author_id: data.author_id,
      content: data.content,
      media_urls: data.media_urls ?? [],
      link_url: data.link_url ?? null,
      link_preview: data.link_preview ?? null,
      project_tag: data.project_tag ?? null,
      project_tier: data.project_tier ?? null,
    })
    .select('*, author:profiles!posts_author_id_fkey(*)')
    .single();

  if (error) {
    console.error('createPost error:', error.message);
    return null;
  }

  // post_count on profiles is maintained by the handle_post_count trigger
  // (see migration 001). No client-side counter update needed.

  // Hybrid signed-message mirror — sign the canonical post record so it's
  // portable to any future protocol. Best-effort: never blocks the user
  // experience. Per proposals/HYBRID-SIGNED-MIRROR.md.
  if (post) {
    const p = post as Post;
    void signRowFireAndForget(
      'posts',
      { col: 'id', val: p.id },
      {
        type: 'frqncy.post.v1',
        id: p.id,
        author_id: p.author_id,
        content: p.content,
        project_tag: p.project_tag,
        project_tier: p.project_tier,
        media_urls: p.media_urls ?? [],
        link_url: p.link_url ?? null,
        created_at: p.created_at,
      },
    );

    // Bluesky cross-post — best-effort, never blocks the post's local return.
    // Default behaviour: mirror if the user has a connection. Composer can
    // pass crosspostToBluesky=false to suppress per-post.
    // Per proposals/ATPROTO-BRIDGE.md.
    const shouldCrosspost =
      data.crosspostToBluesky === false
        ? false
        : (data.crosspostToBluesky === true || data.crosspostToBluesky === undefined) && isBlueskyConnected();
    if (shouldCrosspost) {
      void publishToBluesky({
        text: p.content,
        nrgPostId: p.id,
      })
        .then((res) => {
          if (!res.ok) {
            console.warn('[atproto] cross-post failed (non-fatal):', res.reason);
          }
        })
        .catch((err) => {
          console.warn('[atproto] cross-post threw (non-fatal):', err);
        });
    }
  }

  return post as Post;
}

export async function deletePost(postId: string, authorId: string): Promise<boolean> {
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)
    .eq('author_id', authorId);

  if (error) {
    console.error('deletePost error:', error.message);
    return false;
  }

  // post_count is decremented by the handle_post_count trigger on DELETE.
  return true;
}

// ─── Likes ──────────────────────────────────────────────────────────────────

export async function toggleLike(
  userId: string,
  postId: string
): Promise<{ liked: boolean; count: number }> {
  const existing = await isLiked(userId, postId);

  if (existing) {
    // Unlike — handle_likes_count trigger decrements posts.likes_count.
    await supabase
      .from('likes')
      .delete()
      .eq('user_id', userId)
      .eq('post_id', postId);

    const { data: updated } = await supabase
      .from('posts')
      .select('likes_count')
      .eq('id', postId)
      .single();

    return { liked: false, count: updated?.likes_count ?? 0 };
  } else {
    // Like — handle_likes_count trigger increments posts.likes_count.
    await supabase
      .from('likes')
      .insert({ user_id: userId, post_id: postId });

    const { data: updated } = await supabase
      .from('posts')
      .select('likes_count')
      .eq('id', postId)
      .single();

    return { liked: true, count: updated?.likes_count ?? 0 };
  }
}

export async function isLiked(userId: string, postId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('likes')
    .select('id')
    .eq('user_id', userId)
    .eq('post_id', postId)
    .maybeSingle();

  if (error) {
    console.error('isLiked error:', error.message);
    return false;
  }
  return data !== null;
}

// ─── Bookmarks ──────────────────────────────────────────────────────────────

export async function toggleBookmark(
  userId: string,
  postId: string
): Promise<{ bookmarked: boolean }> {
  const existing = await isBookmarked(userId, postId);

  if (existing) {
    // handle_bookmarks_count trigger maintains posts.bookmarks_count.
    await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('post_id', postId);

    return { bookmarked: false };
  } else {
    // handle_bookmarks_count trigger maintains posts.bookmarks_count.
    await supabase
      .from('bookmarks')
      .insert({ user_id: userId, post_id: postId });

    return { bookmarked: true };
  }
}

export async function isBookmarked(userId: string, postId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('user_id', userId)
    .eq('post_id', postId)
    .maybeSingle();

  if (error) {
    console.error('isBookmarked error:', error.message);
    return false;
  }
  return data !== null;
}

// ─── Follows ────────────────────────────────────────────────────────────────

export async function followUser(
  followerId: string,
  followingId: string
): Promise<boolean> {
  if (followerId === followingId) return false;

  const { error } = await supabase
    .from('follows')
    .insert({ follower_id: followerId, following_id: followingId });

  if (error) {
    console.error('followUser error:', error.message);
    return false;
  }

  // follower_count + following_count maintained by trigger on follows
  // (see migration 001). No client-side counter update needed.

  // Create notification
  await supabase.from('notifications').insert({
    target_user_id: followingId,
    actor_id: followerId,
    type: 'follow',
  });

  // Hybrid signed-message mirror — sign the follow record so the social
  // graph is portable to any future protocol. Best-effort, never blocks.
  // Per proposals/HYBRID-SIGNED-MIRROR.md.
  void signRowFireAndForget(
    'follows',
    [
      { col: 'follower_id', val: followerId },
      { col: 'following_id', val: followingId },
    ],
    {
      type: 'frqncy.follow.v1',
      follower_id: followerId,
      following_id: followingId,
      created_at: new Date().toISOString(),
    },
  );

  return true;
}

export async function unfollowUser(
  followerId: string,
  followingId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId);

  if (error) {
    console.error('unfollowUser error:', error.message);
    return false;
  }

  // follower_count + following_count decremented by the follows trigger
  // on DELETE. No client-side counter update needed.

  return true;
}

export async function isFollowing(
  followerId: string,
  followingId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle();

  if (error) {
    console.error('isFollowing error:', error.message);
    return false;
  }
  return data !== null;
}

// ─── Comments ───────────────────────────────────────────────────────────────

export async function getComments(postId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*, author:profiles!comments_author_id_fkey(*)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('getComments error:', error.message);
    return [];
  }
  return (data ?? []) as Comment[];
}

export async function createComment(input: {
  post_id: string;
  author_id: string;
  content: string;
  parent_id?: string;
}): Promise<Comment | null> {
  const { data, error } = await supabase
    .from('comments')
    .insert({
      post_id: input.post_id,
      author_id: input.author_id,
      content: input.content,
      parent_id: input.parent_id ?? null,
    })
    .select('*, author:profiles!comments_author_id_fkey(*)')
    .single();

  if (error) {
    console.error('createComment error:', error.message);
    return null;
  }

  // posts.comments_count maintained by handle_comments_count trigger.

  // Fetch the post to get the author for notification
  const { data: post } = await supabase
    .from('posts')
    .select('author_id')
    .eq('id', input.post_id)
    .single();

  // Notify post author (if not commenting on own post). The notifications
  // table uses (target_user_id, ref_type, ref_id) per migration 001 — no
  // dedicated post_id/comment_id columns.
  if (post && post.author_id !== input.author_id) {
    await supabase.from('notifications').insert({
      target_user_id: post.author_id,
      actor_id: input.author_id,
      type: input.parent_id ? 'reply' : 'comment',
      ref_type: 'comment',
      ref_id: data.id,
    });
  }

  // Notify any @users mentioned in the comment body. Best-effort, never
  // throws — see mention-notify.ts. Skips self and skips the post author
  // (already notified above) so a single mention can't fan out twice.
  void notifyMentions({
    content: input.content,
    authorId: input.author_id,
    refType: 'comment',
    refId: data.id,
  });

  return data as Comment;
}

// ─── Notifications ──────────────────────────────────────────────────────────

export async function getNotifications(
  userId: string,
  limit = 20
): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*, actor:profiles!notifications_actor_id_fkey(*)')
    .eq('target_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('getNotifications error:', error.message);
    return [];
  }
  return (data ?? []) as Notification[];
}

export async function markNotificationRead(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id);

  if (error) {
    console.error('markNotificationRead error:', error.message);
    return false;
  }
  return true;
}

export async function markAllNotificationsRead(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('target_user_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('markAllNotificationsRead error:', error.message);
    return false;
  }
  return true;
}

export async function getUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('target_user_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('getUnreadCount error:', error.message);
    return 0;
  }
  return count ?? 0;
}

// ─── Conviction Leaderboard ────────────────────────────────────────────────
//
// Removed April 2026. FRQNCY Social is built on cooperation, not competition,
// so we do not rank people against each other. Conviction tracking on an
// individual post (as personal stance / journal) remains — that's self-
// expression, not a scoreboard. See memory/feedback_frqncy_values.md.

// ─── Search ────────────────────────────────────────────────────────────────

export interface SearchResults {
  posts: Post[];
  profiles: Profile[];
  projects: CryptoProject[];
}

/**
 * Multi-entity search across posts (content + project_tag), profiles
 * (username + display_name), and the crypto project corpus (name + symbol).
 */
export async function searchAll(query: string): Promise<SearchResults> {
  const q = query.trim();
  if (!q) return { posts: [], profiles: [], projects: [] };

  const likeQ = `%${q}%`;

  const [postsRes, profilesRes, projectsRes] = await Promise.all([
    supabase
      .from('posts')
      .select('*, author:profiles!posts_author_id_fkey(*)')
      .or(`content.ilike.${likeQ},project_tag.ilike.${likeQ}`)
      .order('created_at', { ascending: false })
      .limit(30),
    supabase
      .from('profiles')
      .select('*')
      .or(`username.ilike.${likeQ},display_name.ilike.${likeQ}`)
      .limit(20),
    searchProjects(q),
  ]);

  return {
    posts: (postsRes.data ?? []) as Post[],
    profiles: (profilesRes.data ?? []) as Profile[],
    projects: projectsRes,
  };
}

// ─── Bookmarks view ────────────────────────────────────────────────────────

export async function getUserBookmarks(
  userId: string,
  limit = 20,
  offset = 0
): Promise<Post[]> {
  const { data, error } = await supabase
    .from('bookmarks')
    .select('post_id, created_at, post:posts!bookmarks_post_id_fkey(*, author:profiles!posts_author_id_fkey(*))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('getUserBookmarks error:', error.message);
    return [];
  }

  return ((data ?? []) as any[])
    .map((r) => r.post as Post)
    .filter(Boolean);
}

// ─── Crypto Projects (from existing API) ────────────────────────────────────

export async function searchProjects(query: string): Promise<CryptoProject[]> {
  const projects = await fetchAllProjects();
  if (!query.trim()) return [];

  const q = query.toLowerCase();
  return projects
    .filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.symbol.toLowerCase().includes(q)
    )
    .slice(0, 20);
}

export async function getProjectByName(name: string): Promise<CryptoProject | null> {
  const projects = await fetchAllProjects();
  return projects.find((p) => p.name.toLowerCase() === name.toLowerCase()) ?? null;
}

export async function getAllProjects(): Promise<CryptoProject[]> {
  return fetchAllProjects();
}
