import { supabase } from './supabase';
import {
  loadSigningPrivateKeyLocal,
  FRQNCY_SIGNING_DOMAIN,
  derivePublicKeyDidKey,
  signPayloadWithDomain,
} from './crypto';
import { isBlueskyConnected, publishToBluesky, searchBluesky, type BlueskyPost } from './atproto-bridge';
import { notifyMentions } from './mention-notify';

// ─── Hybrid signed-message mirror helpers ─────────────────────────────────────
// Per proposals/HYBRID-SIGNED-MIRROR.md. Best-effort signing on post + follow
// creation. If the signing key is missing (new device, lost), the row ships
// unsigned and verifiers skip it. Never blocks the user-visible action.
//
// Domain-separated as of 2026-05-14: every payload is wrapped with
// `{ network: FRQNCY_SIGNING_DOMAIN, ... }` before canonicalization via
// `signPayloadWithDomain`. This makes signatures non-portable across
// future FRQNCY forks/migrations (replay-safety per the Farcaster audit).
// Each payload also carries a `did: did:key:z6Mk...` derived from the
// author's signing public key (ATProto / Onchain audits) and a `$type`
// NSID hint for Phase 3 ATProto Lexicon mapping.

async function signRowFireAndForget(
  table: 'posts' | 'follows',
  matchClause: { col: string; val: string } | { col: string; val: string }[],
  recordToSign: Record<string, unknown>,
): Promise<void> {
  try {
    const signingPriv = loadSigningPrivateKeyLocal();
    if (!signingPriv) return;
    const { signature, signedPayload } = await signPayloadWithDomain(
      signingPriv,
      recordToSign,
    );

    let q = supabase
      .from(table)
      .update({ signature, signed_payload: signedPayload });
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

/**
 * Return the caller's canonical FRQNCY DID (`did:key:z6Mk...`) derived from
 * their on-profile signing public key, or `null` if the user has no signing
 * key yet (legacy account, key never generated, or profile row missing).
 *
 * Useful for UI surfaces that want to show the user their portable identifier
 * — the same DID is what gets embedded in every signed post and follow
 * payload, and what an external verifier would use to look up the user's
 * public key for verification.
 *
 * Reads from the profile rather than recomputing locally so it works on
 * devices that don't hold the private key (e.g. read-only sessions). If
 * a Phase 3 ATProto migration adds a richer DID document, this is the
 * function to extend — callers shouldn't synthesize the DID themselves.
 */
export async function getMyDidKey(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('signing_public_key')
      .eq('id', userId)
      .single();
    if (error || !data?.signing_public_key) return null;
    return derivePublicKeyDidKey(data.signing_public_key as string);
  } catch (err) {
    console.warn('[getMyDidKey] threw (non-fatal):', err);
    return null;
  }
}

/**
 * Best-effort fetch of a signing public key + derived DID for the given
 * profile id. Returns nulls on miss so callers can decide whether to sign
 * with the legacy (no-DID) payload shape or skip signing entirely.
 *
 * NOTE: this is local to the mirror helpers — UI surfaces should use
 * `getMyDidKey` which doesn't leak the pubkey through its return value.
 */
async function loadSignerIdentity(
  userId: string,
): Promise<{ signingPublicKey: string; did: string } | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('signing_public_key')
      .eq('id', userId)
      .single();
    if (error || !data?.signing_public_key) return null;
    const pk = data.signing_public_key as string;
    return { signingPublicKey: pk, did: derivePublicKeyDidKey(pk) };
  } catch {
    return null;
  }
}

// Silence unused-import warnings for the domain constant — it's re-exported
// for callers that want to introspect the signing domain (e.g. external
// verifiers in tests) without re-importing from crypto.ts.
export { FRQNCY_SIGNING_DOMAIN };

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
  /** Permanent founder acknowledgement — flipped to true by
      functions/api/check-rewards.js once the user crosses 25 referred
      members (per proposals/REFERRAL-REWARDS-V0.md). Surfaced as a small
      ✦ Founder pill on ProfileCard. Personal acknowledgement, not status. */
  founder_badge: boolean | null;
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

// Tracks whether the `conviction` column exists on posts. We optimistically
// try to insert it; on the first schema error we flip this flag and retry
// without it. Lets the UI ship before migration 002_conviction.sql is applied.
let convictionColumnMissing = false;

export async function createPost(data: {
  author_id: string;
  content: string;
  media_urls?: string[];
  link_url?: string;
  link_preview?: any;
  project_tag?: string;
  project_tier?: string;
  /** Personal stance on the tagged project. Self-expression, not a score —
      only meaningful when project_tag is set. Persisted in the `conviction`
      column when migration 002 is applied; silently dropped on older
      schemas via the convictionColumnMissing fallback. */
  conviction?: 'bullish' | 'neutral' | 'bearish' | null;
  /** Whether to mirror this post to the user's connected Bluesky account.
      Defaults to true when the user has a connection, false otherwise.
      Pass false explicitly from the composer to suppress for one post. */
  crosspostToBluesky?: boolean;
}): Promise<Post | null> {
  const baseInsert: Record<string, any> = {
    author_id: data.author_id,
    content: data.content,
    media_urls: data.media_urls ?? [],
    link_url: data.link_url ?? null,
    link_preview: data.link_preview ?? null,
    project_tag: data.project_tag ?? null,
    project_tier: data.project_tier ?? null,
  };

  // Only include conviction when a project is tagged AND the column exists.
  // Sending it for untagged posts is noise; sending it on an older schema
  // throws a column-missing error which we recover from below.
  const insertWithConviction =
    data.project_tag && data.conviction && !convictionColumnMissing
      ? { ...baseInsert, conviction: data.conviction }
      : baseInsert;

  let { data: post, error } = await supabase
    .from('posts')
    .insert(insertWithConviction)
    .select('*, author:profiles!posts_author_id_fkey(*)')
    .single();

  // Fallback: if the conviction column doesn't exist yet, retry without it.
  if (
    error &&
    !convictionColumnMissing &&
    /conviction/i.test(error.message || '')
  ) {
    console.warn(
      '[createPost] conviction column missing — falling back. ' +
        'Run supabase/migrations/002_conviction.sql to enable it.',
    );
    convictionColumnMissing = true;
    ({ data: post, error } = await supabase
      .from('posts')
      .insert(baseInsert)
      .select('*, author:profiles!posts_author_id_fkey(*)')
      .single());
  }

  if (error) {
    console.error('createPost error:', error.message);
    return null;
  }

  // post_count on profiles is maintained by the handle_post_count trigger
  // (see migration 001). No client-side counter update needed.

  // Hybrid signed-message mirror — sign the canonical post record so it's
  // portable to any future protocol. Best-effort: never blocks the user
  // experience. Per proposals/HYBRID-SIGNED-MIRROR.md.
  //
  // Payload carries TWO type fields by design:
  //   - `type: 'frqncy.post.v1'`  → legacy, what verifiers read today
  //   - `$type: 'xyz.frqncy.feed.post.v1'`  → ATProto-shaped NSID for the
  //      Phase 3 Lexicon migration. Costs nothing to emit now, future-
  //      proofs the record. Per ATProto-expert audit.
  // Also injects `did: did:key:z6Mk...` derived from the author's signing
  // public key (Onchain + ATProto audits) so the signed record carries its
  // own canonical identity claim — verifiers don't need to look up the
  // author by Supabase id to resolve "who signed this".
  if (post) {
    const p = post as Post & { conviction?: string | null };
    // Best-effort identity load. If the profile lookup fails or the user
    // has no signing pubkey on file, we still sign (signRowFireAndForget
    // gates on the local PRIVATE key) but omit the `did` — verifiers can
    // fall back to looking up the pubkey by author_id.
    void (async () => {
      const id = await loadSignerIdentity(p.author_id);
      await signRowFireAndForget(
        'posts',
        { col: 'id', val: p.id },
        {
          // Legacy + ATProto-shaped type tags (both emitted).
          type: 'frqncy.post.v1',
          $type: 'xyz.frqncy.feed.post.v1',
          ...(id ? { did: id.did } : {}),
          id: p.id,
          author_id: p.author_id,
          content: p.content,
          project_tag: p.project_tag,
          project_tier: p.project_tier,
          // Include conviction in the canonical signed payload so flipping
          // bullish↔neutral↔bearish doesn't bypass signature verification.
          // canonicalizeForSigning sorts keys recursively, so source order
          // here is cosmetic. Null on older-schema rows where the column
          // doesn't exist — preserves verification on legacy posts.
          conviction: p.conviction ?? null,
          media_urls: p.media_urls ?? [],
          link_url: p.link_url ?? null,
          created_at: p.created_at,
        },
      );
    })();

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
        .then(async (res) => {
          if (!res.ok) {
            console.warn('[atproto] cross-post failed (non-fatal):', res.reason);
            return;
          }
          // Persist the Bluesky AT-URI on the NRG row so PostView can
          // rehydrate the Bluesky thread for reply backflow without
          // round-tripping the bridge again. Per migration 016 +
          // proposals/BLUESKY-TIMELINE-READER.md (v1.1). Best-effort —
          // if the column doesn't exist yet (migration 016 not applied)
          // we log and move on; the cross-post itself still succeeded.
          try {
            const { error: updErr } = await supabase
              .from('posts')
              .update({ bluesky_uri: res.uri, bluesky_cid: res.cid })
              .eq('id', p.id);
            if (updErr) {
              console.warn('[atproto] failed to persist bluesky_uri (non-fatal — apply migration 016?):', updErr.message);
            }
          } catch (err) {
            console.warn('[atproto] persist bluesky_uri threw (non-fatal):', err);
          }
        })
        .catch((err) => {
          console.warn('[atproto] cross-post threw (non-fatal):', err);
        });
    }

    // Nostr publish — opt-in per profiles.nostr_publish_enabled (migration
    // 021). The secp256k1 private key never leaves the user's localStorage;
    // we load it here, sign client-side, and WebSocket-publish to the
    // default relay set (relay.damus.io, nos.lol, relay.snort.social).
    //
    // Fail-soft on every step: if the profile lookup fails, the flag is
    // off, the key is missing, the @noble/curves dep isn't installed yet,
    // or any relay rejects — we swallow with console.warn. Never blocks
    // the user-visible post action. Per proposals/NRG-EXPERT-CRITIQUE-
    // 2026-05-14.md (Tier-2 fix #11).
    void (async () => {
      try {
        const profileResp = await supabase
          .from('profiles')
          .select('nostr_pubkey, nostr_publish_enabled')
          .eq('id', p.author_id)
          .maybeSingle();
        const profile = profileResp.data as
          | { nostr_pubkey: string | null; nostr_publish_enabled: boolean | null }
          | null;
        if (!profile?.nostr_publish_enabled || !profile.nostr_pubkey) return;
        const privKey =
          typeof localStorage !== 'undefined'
            ? localStorage.getItem('frqncy.nrg.nostr.privkey')
            : null;
        if (!privKey) return;
        const { publishNrgPostAsNote } = await import('./nostr-publish');
        const res = await publishNrgPostAsNote(privKey, {
          content: p.content,
          created_at_ms: new Date(p.created_at).getTime(),
          link_url: p.link_url ?? null,
          project_tag: p.project_tag ?? null,
          media_urls: p.media_urls ?? [],
          nrg_url: `https://frqncy.network/social/post/${p.id}`,
        });
        if (!res.ok) {
          console.warn('[nostr-publish] failed:', res.reason);
        } else if (res.relayResults.succeeded === 0) {
          console.warn(
            '[nostr-publish] no relays accepted the event:',
            res.relayResults.results
          );
        }
      } catch (e) {
        console.warn('[nostr-publish] threw (non-fatal):', e);
      }
    })();
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
  // likes PK is composite (user_id, post_id) — no `id` column exists.
  const { data, error } = await supabase
    .from('likes')
    .select('user_id')
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
  // bookmarks PK is composite (user_id, post_id) — no `id` column exists.
  const { data, error } = await supabase
    .from('bookmarks')
    .select('user_id')
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

  // Select the inserted row back so we can sign the canonical record using
  // the server-stamped `created_at`. Signing a client-generated timestamp
  // diverges from the row's actual created_at and breaks verification.
  const { data: follow, error } = await supabase
    .from('follows')
    .insert({ follower_id: followerId, following_id: followingId })
    .select('*')
    .single();

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
  // Per proposals/HYBRID-SIGNED-MIRROR.md. Uses the server-stored
  // created_at from the row Supabase just returned (NOT a client-side
  // new Date() — that would drift from the row by the request RTT and
  // make every signature fail verification).
  //
  // Payload shape mirrors createPost — legacy `type` + ATProto-shaped
  // `$type` NSID + `did:key` identity claim derived from the follower's
  // signing pubkey. See createPost above for the rationale.
  if (follow) {
    void (async () => {
      const id = await loadSignerIdentity(followerId);
      await signRowFireAndForget(
        'follows',
        [
          { col: 'follower_id', val: followerId },
          { col: 'following_id', val: followingId },
        ],
        {
          type: 'frqncy.follow.v1',
          $type: 'xyz.frqncy.graph.follow.v1',
          ...(id ? { did: id.did } : {}),
          follower_id: followerId,
          following_id: followingId,
          created_at: (follow as { created_at: string }).created_at,
        },
      );
    })();
  }

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
  // follows PK is composite (follower_id, following_id) — no `id` column exists.
  const { data, error } = await supabase
    .from('follows')
    .select('follower_id')
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
  bluesky: BlueskyPost[];
}

/**
 * Federated multi-entity search across NRG posts (content + project_tag), NRG
 * profiles (username + display_name), the crypto project corpus (name +
 * symbol), and public Bluesky posts (via the unauthenticated AppView). Each
 * source resolves independently — a slow or failing Bluesky search never
 * blocks the NRG-native results.
 */
export async function searchAll(query: string): Promise<SearchResults> {
  const q = query.trim();
  if (!q) return { posts: [], profiles: [], projects: [], bluesky: [] };

  const likeQ = `%${q}%`;

  const [postsRes, profilesRes, projectsRes, blueskyRes] = await Promise.all([
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
    // searchBluesky is best-effort and never throws, but guard anyway so a
    // rejected promise here can't sink the whole Promise.all.
    searchBluesky(q).catch(() => [] as BlueskyPost[]),
  ]);

  return {
    posts: (postsRes.data ?? []) as Post[],
    profiles: (profilesRes.data ?? []) as Profile[],
    projects: projectsRes,
    bluesky: blueskyRes,
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
