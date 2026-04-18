import { supabase } from './supabase';

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
  user_id: string;
  actor_id: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'reply';
  post_id: string | null;
  comment_id: string | null;
  read: boolean;
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

  // Increment the author's post_count
  await supabase.rpc('increment_counter', {
    row_id: data.author_id,
    table_name: 'profiles',
    column_name: 'post_count',
    amount: 1,
  });

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

  await supabase.rpc('increment_counter', {
    row_id: authorId,
    table_name: 'profiles',
    column_name: 'post_count',
    amount: -1,
  });

  return true;
}

// ─── Likes ──────────────────────────────────────────────────────────────────

export async function toggleLike(
  userId: string,
  postId: string
): Promise<{ liked: boolean; count: number }> {
  const existing = await isLiked(userId, postId);

  if (existing) {
    // Unlike
    await supabase
      .from('likes')
      .delete()
      .eq('user_id', userId)
      .eq('post_id', postId);

    const { data } = await supabase
      .from('posts')
      .update({ likes_count: supabase.rpc ? undefined : 0 })
      .eq('id', postId)
      .select('likes_count')
      .single();

    // Use RPC to decrement safely
    await supabase.rpc('increment_counter', {
      row_id: postId,
      table_name: 'posts',
      column_name: 'likes_count',
      amount: -1,
    });

    const { data: updated } = await supabase
      .from('posts')
      .select('likes_count')
      .eq('id', postId)
      .single();

    return { liked: false, count: updated?.likes_count ?? 0 };
  } else {
    // Like
    await supabase
      .from('likes')
      .insert({ user_id: userId, post_id: postId });

    await supabase.rpc('increment_counter', {
      row_id: postId,
      table_name: 'posts',
      column_name: 'likes_count',
      amount: 1,
    });

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
    await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('post_id', postId);

    await supabase.rpc('increment_counter', {
      row_id: postId,
      table_name: 'posts',
      column_name: 'bookmarks_count',
      amount: -1,
    });

    return { bookmarked: false };
  } else {
    await supabase
      .from('bookmarks')
      .insert({ user_id: userId, post_id: postId });

    await supabase.rpc('increment_counter', {
      row_id: postId,
      table_name: 'posts',
      column_name: 'bookmarks_count',
      amount: 1,
    });

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

  // Update follower/following counts
  await Promise.all([
    supabase.rpc('increment_counter', {
      row_id: followerId,
      table_name: 'profiles',
      column_name: 'following_count',
      amount: 1,
    }),
    supabase.rpc('increment_counter', {
      row_id: followingId,
      table_name: 'profiles',
      column_name: 'follower_count',
      amount: 1,
    }),
  ]);

  // Create notification
  await supabase.from('notifications').insert({
    user_id: followingId,
    actor_id: followerId,
    type: 'follow',
  });

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

  await Promise.all([
    supabase.rpc('increment_counter', {
      row_id: followerId,
      table_name: 'profiles',
      column_name: 'following_count',
      amount: -1,
    }),
    supabase.rpc('increment_counter', {
      row_id: followingId,
      table_name: 'profiles',
      column_name: 'follower_count',
      amount: -1,
    }),
  ]);

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

  // Increment post comment count
  await supabase.rpc('increment_counter', {
    row_id: input.post_id,
    table_name: 'posts',
    column_name: 'comments_count',
    amount: 1,
  });

  // Fetch the post to get the author for notification
  const { data: post } = await supabase
    .from('posts')
    .select('author_id')
    .eq('id', input.post_id)
    .single();

  // Notify post author (if not commenting on own post)
  if (post && post.author_id !== input.author_id) {
    await supabase.from('notifications').insert({
      user_id: post.author_id,
      actor_id: input.author_id,
      type: input.parent_id ? 'reply' : 'comment',
      post_id: input.post_id,
      comment_id: data.id,
    });
  }

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
    .eq('user_id', userId)
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
    .update({ read: true })
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
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);

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
    .eq('user_id', userId)
    .eq('read', false);

  if (error) {
    console.error('getUnreadCount error:', error.message);
    return 0;
  }
  return count ?? 0;
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
