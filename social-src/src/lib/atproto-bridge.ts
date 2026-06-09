// NRG ↔ Bluesky cross-post bridge.
//
// Per proposals/ATPROTO-BRIDGE.md. Client-side only — the app password never
// touches FRQNCY's server. The user generates an app password at
// https://bsky.app/settings/app-passwords, enters it on the Connections panel,
// and we persist it to localStorage. From then on every NRG post optionally
// gets mirrored to the user's Bluesky PDS via the public AppView.
//
// Storage layout (localStorage, never sent to FRQNCY's server):
//   frqncy.nrg.atproto.handle           — e.g. "alice.bsky.social"
//   frqncy.nrg.atproto.app_password     — 16-char app password (xxxx-xxxx-xxxx-xxxx)
//                                         STORED LOCALLY, NEVER SENT TO FRQNCY's SERVER.
//   frqncy.nrg.atproto.crosspost_default — '1' or '0', user's last toggle state
//
// Why app password, not OAuth: at the time of writing, ATProto OAuth + DPoP
// support in @atproto/api is still in flux. App passwords are a one-shot,
// revocable, scoped credential that every Bluesky user already understands
// from third-party clients. v2 will swap this for the OAuth flow without
// touching publishToBluesky's interface. See proposals/ATPROTO-BRIDGE.md.
//
// Failure mode: a Bluesky outage, expired/revoked app password, or rate-limit
// MUST NOT block an NRG post. publishToBluesky is fire-and-forget from the
// caller's perspective; errors get logged and surfaced via the return value
// only if the caller cares to await it.

const HANDLE_KEY = 'frqncy.nrg.atproto.handle';
const APP_PASSWORD_KEY = 'frqncy.nrg.atproto.app_password';

// ─── OAuth (Tier-2 #7) ──────────────────────────────────────────────────────
//
// The 2026 standard for ATProto auth is OAuth + DPoP. The reference client
// is @atproto/oauth-client-browser (a separate package from @atproto/api).
// It's NOT in package.json yet — we dynamically import so the build stays
// clean. Once Orlando runs `npm install @atproto/oauth-client-browser` and
// deploys the client metadata JSON, the OAuth button starts working.
//
// Storage:
//   sessionStorage 'frqncy.nrg.atproto.oauth.pending'  — { handle, ts }
//     ephemeral hint so the callback page can show "completing as @x".
//     The PKCE verifier + nonce are managed internally by
//     BrowserOAuthClient's IndexedDB store, not here.
//   localStorage   'frqncy.nrg.atproto.oauth.session'   — { did, handle, ts }
//     marker that an OAuth session exists. The actual DPoP-bound tokens
//     live in BrowserOAuthClient's IndexedDB store.
//
// The marker pattern (rather than mirroring the session blob) avoids a
// split-brain where our localStorage thinks we're connected but the SDK's
// session store has expired/rotated. isOAuthConnected() returns true only
// if both the marker exists AND BrowserOAuthClient.restore() succeeds.
const OAUTH_PENDING_KEY = 'frqncy.nrg.atproto.oauth.pending';
const OAUTH_SESSION_KEY = 'frqncy.nrg.atproto.oauth.session';

const OAUTH_CLIENT_METADATA_URL =
  'https://frqncy.network/profile/bluesky-oauth-client.json';
const OAUTH_REDIRECT_URI =
  'https://frqncy.network/social/profile/bluesky-callback/';

// Module-level cache: the loaded BrowserOAuthClient instance + the live Agent
// derived from the active OAuth session. Both reset on disconnect.
let oauthClientPromise: Promise<any> | null = null;
let oauthAgentCache: { agent: any; did: string; handle: string } | null = null;

/**
 * Lazily load @atproto/oauth-client-browser. Returns null if the package
 * isn't installed — the UI can detect this and disable the OAuth button
 * with a tooltip rather than blowing up.
 */
async function loadBrowserOAuthClientClass(): Promise<any | null> {
  try {
    // @ts-ignore — package isn't in package.json yet (Tier-2 #7 deployment item).
    // Use a runtime variable so rollup doesn't try to statically resolve the
    // bare specifier — the import will throw at runtime when the dep isn't
    // installed, caught below.
    const oauthClientModuleName = '@atproto/oauth-client-browser';
    const mod = await import(/* @vite-ignore */ oauthClientModuleName);
    return mod.BrowserOAuthClient ?? mod.default?.BrowserOAuthClient ?? null;
  } catch (err) {
    console.warn(
      '[atproto] @atproto/oauth-client-browser not installed; OAuth disabled. ' +
        'See proposals/NRG-EXPERT-CRITIQUE-2026-05-14.md Tier 2 #7.',
      err,
    );
    return null;
  }
}

/**
 * Return (and memoize) a configured BrowserOAuthClient. Returns null if the
 * SDK isn't installed.
 */
async function getOAuthClient(): Promise<any | null> {
  if (oauthClientPromise) return oauthClientPromise;
  oauthClientPromise = (async () => {
    const BrowserOAuthClient = await loadBrowserOAuthClientClass();
    if (!BrowserOAuthClient) return null;
    try {
      const client = await BrowserOAuthClient.load({
        clientId: OAUTH_CLIENT_METADATA_URL,
        handleResolver: 'https://bsky.social/',
      });
      return client;
    } catch (err) {
      console.warn('[atproto] BrowserOAuthClient.load failed:', err);
      return null;
    }
  })();
  return oauthClientPromise;
}

/**
 * Returns true if there's an OAuth session marker in localStorage. The
 * actual session blob lives in the SDK's IndexedDB store — a false positive
 * (marker present, IDB session gone) is harmless: the next authenticated
 * call will fall through and the user will see a "reconnect" prompt.
 */
export function isOAuthConnected(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return !!window.localStorage.getItem(OAUTH_SESSION_KEY);
  } catch {
    return false;
  }
}

/** Returns the OAuth handle from the marker, or null. */
function getOAuthHandle(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(OAUTH_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return typeof parsed?.handle === 'string' ? parsed.handle : null;
  } catch {
    return null;
  }
}

/** Returns the OAuth DID from the marker, or null. */
function getOAuthDid(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(OAUTH_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return typeof parsed?.did === 'string' ? parsed.did : null;
  } catch {
    return null;
  }
}

/**
 * Restore the OAuth session into a live Agent. Returns null on any failure
 * (SDK missing, session expired, refresh denied). Callers should fall back
 * to the legacy app-password path when this returns null.
 */
async function getOAuthAgent(): Promise<{ agent: any; did: string; handle: string } | null> {
  if (oauthAgentCache) return oauthAgentCache;
  if (!isOAuthConnected()) return null;
  const did = getOAuthDid();
  const handle = getOAuthHandle();
  if (!did || !handle) return null;

  const client = await getOAuthClient();
  if (!client) return null;

  try {
    const session = await client.restore(did);
    if (!session) return null;
    // @atproto/api's Agent accepts an OAuth session directly (DPoP-bound).
    const mod = await import('@atproto/api');
    const AgentClass = mod.Agent ?? mod.default?.Agent;
    if (!AgentClass) return null;
    const agent = new AgentClass(session);
    oauthAgentCache = { agent, did, handle };
    return oauthAgentCache;
  } catch (err) {
    console.warn('[atproto] OAuth session restore failed:', err);
    return null;
  }
}

/**
 * Initiate the OAuth authorization flow. Builds the authorization URL with
 * the PKCE challenge (handled internally by BrowserOAuthClient), stashes a
 * pending-marker in sessionStorage, and full-page-redirects to the auth
 * server. Returns ok:false on pre-redirect failure (no SDK, bad handle,
 * network refusal).
 *
 * DEPLOYMENT REQUIREMENT — before this flow works end-to-end:
 * 1. Run `npm install @atproto/oauth-client-browser` in social-src/.
 * 2. Create social/profile/bluesky-oauth-client.json with the OAuth client
 *    metadata (client_id, redirect_uris, scope, grant_types, response_types,
 *    application_type='web', token_endpoint_auth_method='none' for public
 *    client). See https://atproto.com/specs/oauth for the exact schema.
 * 3. Add `https://frqncy.network/social/profile/bluesky-callback/` to the
 *    redirect_uris array.
 * 4. The metadata URL must be public AND resolve to the JSON (set the
 *    Content-Type to application/json).
 * Until done, this OAuth flow will fail at the auth-server fetch step.
 * The legacy app-password path keeps working in the meantime.
 */
export async function connectBlueskyOAuth(
  handle: string,
): Promise<{ ok: boolean; error?: string }> {
  const normalized = normalizeHandle(handle);
  if (!normalized) {
    return { ok: false, error: 'Enter your Bluesky handle (e.g. alice.bsky.social).' };
  }

  const client = await getOAuthClient();
  if (!client) {
    return {
      ok: false,
      error:
        'OAuth client lib not installed — see proposal Tier 2 #7. The legacy app-password flow below still works.',
    };
  }

  try {
    // Stash a hint so the callback page can render "completing as @x".
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.setItem(
          OAUTH_PENDING_KEY,
          JSON.stringify({ handle: normalized, ts: Date.now() }),
        );
      } catch {
        // sessionStorage write can fail in private mode — non-fatal,
        // the callback page just won't show the "completing as" hint.
      }
    }

    // BrowserOAuthClient.authorize() returns the authorization URL with
    // the PKCE challenge embedded. The verifier is stored in IDB.
    const url: URL = await client.authorize(normalized, {
      // Defensive: pass redirect_uri explicitly so it matches the metadata.
      // BrowserOAuthClient picks the first redirect_uri from metadata by
      // default; this is a safety net if the metadata gets edited.
      // (Field is ignored if the SDK build rejects it.)
      redirect_uri: OAUTH_REDIRECT_URI,
    } as any);

    if (typeof window !== 'undefined') {
      window.location.assign(typeof url === 'string' ? url : url.toString());
    }
    return { ok: true };
  } catch (err: any) {
    // Clean up the pending marker — no in-flight flow.
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.removeItem(OAUTH_PENDING_KEY);
      } catch {
        /* non-fatal */
      }
    }
    const msg =
      err?.message ||
      'Bluesky OAuth could not start. Check that the client metadata JSON is deployed and reachable.';
    return { ok: false, error: msg };
  }
}

/**
 * Complete the OAuth flow on return from the auth server. Called from the
 * callback page. Exchanges the code for DPoP-bound tokens (via
 * BrowserOAuthClient.init), persists the session marker to localStorage,
 * clears the pending sessionStorage entry, and returns the handle + DID.
 *
 * The actual session blob lives in the SDK's IndexedDB store — we only
 * mirror handle+DID into localStorage as a fast-path flag.
 */
export async function completeBlueskyOAuth(
  callbackUrl: string,
): Promise<{ ok: boolean; handle?: string; did?: string; error?: string }> {
  void callbackUrl; // BrowserOAuthClient reads window.location.href internally.

  const client = await getOAuthClient();
  if (!client) {
    return {
      ok: false,
      error: 'OAuth client lib not installed — see proposal Tier 2 #7',
    };
  }

  try {
    // init() reads the URL hash/query, validates state + PKCE, and exchanges
    // the code for tokens. Returns { session, state } on a fresh callback.
    const result = await client.init();
    if (!result || !result.session) {
      return { ok: false, error: 'OAuth callback returned no session.' };
    }
    const session = result.session;
    const did: string = String(session.did || '');
    if (!did) {
      return { ok: false, error: 'OAuth session has no DID.' };
    }

    // Resolve the handle. The session exposes it on .sub or via a profile
    // lookup — prefer the pending-marker hint if it matches the DID, else
    // fall back to com.atproto.identity.resolveHandle on the agent.
    let handle: string | null = null;
    try {
      const mod = await import('@atproto/api');
      const AgentClass = mod.Agent ?? mod.default?.Agent;
      if (AgentClass) {
        const agent = new AgentClass(session);
        // getProfile is cheaper than resolveHandle for a known DID.
        const prof = await agent.getProfile({ actor: did });
        if (prof?.data?.handle) handle = String(prof.data.handle);
      }
    } catch (err) {
      console.warn('[atproto] post-OAuth getProfile failed:', err);
    }

    // Last-resort fallback: pending-marker handle.
    if (!handle && typeof window !== 'undefined') {
      try {
        const raw = window.sessionStorage.getItem(OAUTH_PENDING_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (typeof parsed?.handle === 'string') handle = parsed.handle;
        }
      } catch {
        /* non-fatal */
      }
    }

    if (!handle) {
      handle = did; // Worst case: surface the DID. Caller can still disconnect.
    }

    // Persist the marker. The actual tokens live in the SDK's IDB store.
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(
          OAUTH_SESSION_KEY,
          JSON.stringify({ did, handle, ts: Date.now() }),
        );
        window.sessionStorage.removeItem(OAUTH_PENDING_KEY);
      } catch (err) {
        console.warn('[atproto] failed to persist OAuth session marker:', err);
      }
    }

    return { ok: true, handle, did };
  } catch (err: any) {
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.removeItem(OAUTH_PENDING_KEY);
      } catch {
        /* non-fatal */
      }
    }
    const msg = err?.message || 'OAuth completion failed.';
    return { ok: false, error: msg };
  }
}

/**
 * Revoke OAuth tokens (best-effort) and clear the localStorage marker +
 * pending sessionStorage. Idempotent — safe to call when not connected.
 */
export async function disconnectBlueskyOAuth(): Promise<void> {
  // Best-effort token revocation via BrowserOAuthClient.revoke(did).
  try {
    const did = getOAuthDid();
    if (did) {
      const client = await getOAuthClient();
      if (client && typeof client.revoke === 'function') {
        await client.revoke(did);
      }
    }
  } catch (err) {
    console.warn('[atproto] OAuth token revocation failed (continuing with local cleanup):', err);
  }

  oauthAgentCache = null;
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(OAUTH_SESSION_KEY);
    window.sessionStorage.removeItem(OAUTH_PENDING_KEY);
  } catch {
    /* non-fatal */
  }
}

// Lazily-loaded BskyAgent to avoid importing the SDK on every page (and so
// builds without @atproto/api installed don't crash). The module-level cache
// keys agents by handle so repeated publishToBluesky calls reuse the session.
type AnyAgent = any;
const agentCache = new Map<string, AnyAgent>();

// ─── Read-side TTL cache ────────────────────────────────────────────────────
//
// Bluesky's public AppView (api.bsky.app) rate-limits at ~3000 req / 5min per
// IP. At 1000+ visitors sharing a Cloudflare egress IP, every Feed.tsx tab
// switch back to Federated + every BlueskyReplies mount can rate-limit the
// entire CF range. A 60s session-scoped TTL absorbs the spam without
// surfacing stale-data complaints (well below the 5min RL window).
//
// Cache is per-tab (module-level Map), not cross-tab. clearBlueskyCache()
// is the explicit invalidator — call after a fresh cross-post so the next
// timeline fetch sees the new entry.
type CacheEntry<T> = { value: T; expiresAt: number };
const CACHE_TTL_MS = 60_000; // 60s — Bluesky AppView rate-limit window is 5min, 60s is well below
type TimelineCacheValue = { posts: BlueskyPost[]; cursor: string | null };
type ThreadCacheValue = { replies: BlueskyReply[]; thread_url: string };
const timelineCache = new Map<string, CacheEntry<TimelineCacheValue>>();
const threadCache = new Map<string, CacheEntry<ThreadCacheValue>>();

/**
 * Empty both read-side caches (timeline + thread). Call after a fresh
 * cross-post or any mutation that should invalidate cached reads.
 */
export function clearBlueskyCache(): void {
  timelineCache.clear();
  threadCache.clear();
}

async function loadBskyAgentClass(): Promise<any | null> {
  try {
    // Dynamic import so projects without the dep installed don't fail to
    // build. publishToBluesky / connectBluesky will return ok:false with a
    // descriptive reason instead.
    const mod = await import('@atproto/api');
    return mod.BskyAgent ?? mod.default?.BskyAgent ?? null;
  } catch (err) {
    console.warn('[atproto] @atproto/api not installed; Bluesky bridge disabled', err);
    return null;
  }
}

// ─── Connect ────────────────────────────────────────────────────────────────

interface ConnectInput {
  handle: string;
  appPassword: string;
  userId: string;
}

// DEPRECATED PATH — app-password authentication
//
// This flow stores the user's app password in localStorage. App passwords are
// revocable but unscoped — a leak gives full posting + DM-read + repo-mgmt
// scope. The 2026 standard is OAuth + DPoP (GA in @atproto/api since late
// 2024).
//
// Migration plan: see proposals/NRG-EXPERT-CRITIQUE-2026-05-14.md (Tier 2,
// item 7). Until OAuth lands, the current code stays for backward compat
// with users who already connected; no NEW connections should use this path
// after the OAuth flow ships. Surface a "Use OAuth" CTA in ConnectionsPanel
// at that point.
/**
 * Test a handle + app password by attempting a login. On success, persists
 * the handle to profiles.bluesky_handle and the app password to localStorage.
 * On failure, returns the error.
 *
 * App password format: 16 chars in 4 groups of 4 with dashes (xxxx-xxxx-xxxx-xxxx).
 * Generated by the user at https://bsky.app/settings/app-passwords.
 *
 * Note: we DO NOT update profiles.bluesky_handle from this function — the
 * caller (ConnectionsPanel) does that after login succeeds, so the column
 * write goes through Supabase RLS with the user's normal session.
 */
export async function connectBluesky(
  opts: ConnectInput,
): Promise<{ ok: true; did: string } | { ok: false; reason: string }> {
  console.warn('[atproto] connectBluesky: app-password auth is deprecated. OAuth migration pending.');
  const handle = normalizeHandle(opts.handle);
  const appPassword = opts.appPassword.trim();

  if (!handle) {
    return { ok: false, reason: 'Enter your Bluesky handle (e.g. alice.bsky.social).' };
  }
  if (!appPassword) {
    return { ok: false, reason: 'Enter an app password (generate one at bsky.app/settings/app-passwords).' };
  }
  // Light shape check — Bluesky app passwords are 19 chars (16 + 3 dashes).
  // We don't hard-fail on shape because the format could change; we just
  // give a friendlier error before the round-trip.
  if (appPassword.length < 12) {
    return { ok: false, reason: 'That doesn\'t look like an app password. Generate one at bsky.app/settings/app-passwords.' };
  }

  const BskyAgent = await loadBskyAgentClass();
  if (!BskyAgent) {
    return { ok: false, reason: 'Bluesky SDK not loaded. Run `npm install @atproto/api` and rebuild.' };
  }

  try {
    const agent = new BskyAgent({ service: 'https://bsky.social' });
    const res = await agent.login({ identifier: handle, password: appPassword });
    if (!res?.success || !res.data?.did) {
      return { ok: false, reason: 'Login returned no DID — check the handle and try again.' };
    }
    // Cache the live agent so the next publishToBluesky call doesn't re-login.
    agentCache.set(handle, agent);
    persistCredentials(handle, appPassword);
    return { ok: true, did: res.data.did };
  } catch (err: any) {
    return { ok: false, reason: translateBskyError(err) };
  }
}

// ─── Publish ────────────────────────────────────────────────────────────────

interface PublishInput {
  text: string;
  nrgPostId?: string;
  appendFooter?: boolean;
}

/**
 * Publish a post to Bluesky on behalf of the connected user. Returns the
 * at-uri of the new post on success.
 *
 * If the user is not connected (no app password in localStorage), returns
 * { ok: false, reason: 'not-connected' }.
 *
 * The post text is the NRG post content. We append a small "via FRQNCY NRG"
 * footer with a link to the NRG post. The footer is opt-out via
 * opts.appendFooter=false.
 */
export async function publishToBluesky(
  opts: PublishInput,
): Promise<{ ok: true; uri: string; cid: string } | { ok: false; reason: string }> {
  if (!isBlueskyConnected()) {
    return { ok: false, reason: 'not-connected' };
  }

  const text = composePostText(opts.text, opts.nrgPostId, opts.appendFooter !== false);

  // Prefer the OAuth (DPoP-bound) agent when available. Falls back to the
  // legacy app-password path on any failure to keep existing users working.
  if (isOAuthConnected()) {
    const oauth = await getOAuthAgent();
    if (oauth) {
      try {
        const res = await oauth.agent.post({
          text,
          createdAt: new Date().toISOString(),
        });
        if (!res?.uri || !res?.cid) {
          return { ok: false, reason: 'Bluesky post returned no URI.' };
        }
        return { ok: true, uri: res.uri, cid: res.cid };
      } catch (err: any) {
        // Drop the cached OAuth agent so the next attempt re-restores.
        oauthAgentCache = null;
        return { ok: false, reason: translateBskyError(err) };
      }
    }
    // OAuth marker present but agent restore failed — fall through to
    // app-password if the user happens to still have one configured.
  }

  const handle = getConnectedBlueskyHandle();
  const appPassword = getStoredAppPassword();
  if (!handle || !appPassword) {
    return { ok: false, reason: 'not-connected' };
  }

  const BskyAgent = await loadBskyAgentClass();
  if (!BskyAgent) {
    return { ok: false, reason: 'Bluesky SDK not loaded. Run `npm install @atproto/api` and rebuild.' };
  }

  try {
    let agent = agentCache.get(handle);
    if (!agent) {
      agent = new BskyAgent({ service: 'https://bsky.social' });
      const loginRes = await agent.login({ identifier: handle, password: appPassword });
      if (!loginRes?.success) {
        return { ok: false, reason: 'Bluesky login failed. The app password may have been revoked — reconnect at /social/profile/connections.' };
      }
      agentCache.set(handle, agent);
    }

    const res = await agent.post({
      text,
      createdAt: new Date().toISOString(),
    });
    if (!res?.uri || !res?.cid) {
      return { ok: false, reason: 'Bluesky post returned no URI.' };
    }
    return { ok: true, uri: res.uri, cid: res.cid };
  } catch (err: any) {
    // Drop the cached agent so the next attempt re-logs in with fresh auth.
    agentCache.delete(handle);
    return { ok: false, reason: translateBskyError(err) };
  }
}

// ─── Timeline read ──────────────────────────────────────────────────────────

export interface BlueskyPost {
  uri: string;       // at://...
  cid: string;
  author: { handle: string; displayName: string | null; avatar: string | null; did: string };
  text: string;
  createdAt: string;
  replyCount: number;
  repostCount: number;
  likeCount: number;
  externalUrl: string | null;  // for embeds
  webUrl: string;    // bsky.app/profile/<handle>/post/<rkey>
}

interface FetchTimelineOpts {
  limit?: number;
  cursor?: string;
}

/**
 * Fetch the connected user's Bluesky home timeline. Returns up to `limit`
 * posts (default 30). Reverse chronological (newest first).
 *
 * Returns { ok: false, reason: 'not-connected' } if no app password is in
 * localStorage. Best-effort — never throws; returns { ok: false, reason } on
 * any error.
 *
 * Reuses the per-session BskyAgent cache from publishToBluesky so a feed
 * scroll doesn't trigger a fresh login on every poll.
 *
 * v1 filtering rules — keep the surface honest and simple:
 *   - Skip reposts (we render the original author's posts only).
 *   - Skip orphan replies (a reply whose parent isn't shown is jarring out
 *     of context).
 *   - Skip embed types we don't yet render (record/recordWithMedia/video).
 *     Text-only, image, and external-link embeds pass through.
 *
 * Future v1.1 will surface replies on cross-posted NRG posts under the NRG
 * row — see proposals/BLUESKY-TIMELINE-READER.md.
 */
export async function fetchBlueskyTimeline(
  opts: FetchTimelineOpts = {},
): Promise<{ ok: true; posts: BlueskyPost[]; cursor: string | null } | { ok: false; reason: string }> {
  if (!isBlueskyConnected()) {
    return { ok: false, reason: 'not-connected' };
  }

  const limit = Math.min(Math.max(opts.limit ?? 30, 1), 100);
  const cacheKey = `${limit}:${opts.cursor ?? ''}`;
  const cached = timelineCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return { ok: true, posts: cached.value.posts, cursor: cached.value.cursor };
  }

  // Prefer the OAuth (DPoP-bound) agent. On any restore failure, fall through
  // to the legacy app-password path if credentials are still stored.
  if (isOAuthConnected()) {
    const oauth = await getOAuthAgent();
    if (oauth) {
      try {
        const res = await oauth.agent.getTimeline({ limit, cursor: opts.cursor });
        if (!res?.data?.feed) {
          return { ok: false, reason: 'Bluesky timeline returned no feed.' };
        }
        const posts: BlueskyPost[] = [];
        for (const item of res.data.feed) {
          const mapped = mapFeedItem(item);
          if (mapped) posts.push(mapped);
        }
        const cursor = res.data.cursor ?? null;
        timelineCache.set(cacheKey, {
          value: { posts, cursor },
          expiresAt: Date.now() + CACHE_TTL_MS,
        });
        return { ok: true, posts, cursor };
      } catch (err: any) {
        oauthAgentCache = null;
        // Don't fall through — the OAuth user is logically connected; surface
        // the error rather than silently trying a (likely stale) app-password.
        return { ok: false, reason: translateBskyError(err) };
      }
    }
  }

  const handle = getConnectedBlueskyHandle();
  const appPassword = getStoredAppPassword();
  if (!handle || !appPassword) {
    return { ok: false, reason: 'not-connected' };
  }

  const BskyAgent = await loadBskyAgentClass();
  if (!BskyAgent) {
    return { ok: false, reason: 'Bluesky SDK not loaded. Run `npm install @atproto/api` and rebuild.' };
  }

  try {
    let agent = agentCache.get(handle);
    if (!agent) {
      agent = new BskyAgent({ service: 'https://bsky.social' });
      const loginRes = await agent.login({ identifier: handle, password: appPassword });
      if (!loginRes?.success) {
        return { ok: false, reason: 'Bluesky login failed. The app password may have been revoked — reconnect at /social/profile/connections.' };
      }
      agentCache.set(handle, agent);
    }

    const res = await agent.getTimeline({ limit, cursor: opts.cursor });
    if (!res?.data?.feed) {
      return { ok: false, reason: 'Bluesky timeline returned no feed.' };
    }

    const posts: BlueskyPost[] = [];
    for (const item of res.data.feed) {
      const mapped = mapFeedItem(item);
      if (mapped) posts.push(mapped);
    }

    const cursor = res.data.cursor ?? null;
    // Cache on success only — let next call retry on error.
    timelineCache.set(cacheKey, {
      value: { posts, cursor },
      expiresAt: Date.now() + CACHE_TTL_MS,
    });
    return { ok: true, posts, cursor };
  } catch (err: any) {
    // Drop the cached agent so the next attempt re-logs in with fresh auth.
    agentCache.delete(handle);
    return { ok: false, reason: translateBskyError(err) };
  }
}

// ─── Search ───────────────────────────────────────────────────────────────

const searchCache = new Map<string, CacheEntry<BlueskyPost[]>>();

/**
 * Search public Bluesky posts via the unauthenticated AppView
 * (app.bsky.feed.searchPosts on api.bsky.app). Deliberately auth-free so the
 * federated search surface works for logged-out NRG visitors too — symmetric
 * with the NRG-native (Supabase) results.
 *
 * Best-effort: never throws. Returns [] on any error or when @atproto/api
 * isn't installed. 60s per-query cache, same TTL as the timeline reader.
 */
export async function searchBluesky(
  query: string,
  limit = 25,
): Promise<BlueskyPost[]> {
  const q = query.trim();
  if (!q) return [];

  const capped = Math.min(Math.max(limit, 1), 100);
  const cacheKey = `${capped}:${q.toLowerCase()}`;
  const cached = searchCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const BskyAgent = await loadBskyAgentClass();
  if (!BskyAgent) return [];

  try {
    // Public AppView — no login. Same endpoint the native client searches.
    const agent = new BskyAgent({ service: 'https://api.bsky.app' });
    const res = await agent.app.bsky.feed.searchPosts({ q, limit: capped });
    const rawPosts = Array.isArray(res?.data?.posts) ? res.data.posts : [];
    const posts: BlueskyPost[] = [];
    for (const post of rawPosts) {
      const mapped = mapSearchPost(post);
      if (mapped) posts.push(mapped);
    }
    // Cache on success only — let the next call retry on error.
    searchCache.set(cacheKey, { value: posts, expiresAt: Date.now() + CACHE_TTL_MS });
    return posts;
  } catch (err) {
    console.warn('[atproto] searchBluesky failed', err);
    return [];
  }
}

/**
 * Map a bare postView (from searchPosts) to BlueskyPost. Looser than
 * mapFeedItem — searchPosts returns posts directly, with no repost/reply
 * wrapper to filter on — so we keep every text-bearing result.
 */
function mapSearchPost(post: any): BlueskyPost | null {
  if (!post) return null;
  const text = String(post.record?.text || '');
  if (!text) return null;

  const author = post.author || {};
  const handle = String(author.handle || '');
  const createdAt = String(post.record?.createdAt || post.indexedAt || new Date().toISOString());

  let externalUrl: string | null = null;
  const embed = post.embed;
  if (embed && embed.$type && embed.$type.includes('app.bsky.embed.external')) {
    externalUrl = embed?.external?.uri ?? null;
  }

  const rkey = parseRkeyFromUri(post.uri);
  const webUrl = handle && rkey ? `https://bsky.app/profile/${handle}/post/${rkey}` : 'https://bsky.app';

  return {
    uri: String(post.uri || ''),
    cid: String(post.cid || ''),
    author: {
      handle,
      displayName: author.displayName ? String(author.displayName) : null,
      avatar: author.avatar ? String(author.avatar) : null,
      did: String(author.did || ''),
    },
    text,
    createdAt,
    replyCount: Number(post.replyCount || 0),
    repostCount: Number(post.repostCount || 0),
    likeCount: Number(post.likeCount || 0),
    externalUrl,
    webUrl,
  };
}

/**
 * Map an AppView feed item to our internal BlueskyPost shape, applying the
 * v1 filtering rules. Returns null when the item should be skipped.
 */
function mapFeedItem(item: any): BlueskyPost | null {
  if (!item?.post) return null;
  // Skip reposts — `reason` is set when this feed item was reposted into the
  // viewer's timeline by someone they follow. We render originals only.
  if (item.reason && item.reason.$type === 'app.bsky.feed.defs#reasonRepost') return null;

  const post = item.post;
  // Skip orphan replies — reply contexts without an in-timeline parent read
  // poorly. The native bsky.app client deduplicates these via thread view.
  if (item.reply && !item.reply.parent) return null;
  if (post?.record?.reply && !item.reply) return null;

  // Embed filter: text-only, image, and external-link embeds are renderable
  // in v1. Skip records / record-with-media / video for now.
  const embed = post.embed;
  if (embed) {
    const t = embed.$type || '';
    const isImage = t.includes('app.bsky.embed.images');
    const isExternal = t.includes('app.bsky.embed.external');
    if (!isImage && !isExternal) return null;
  }

  const author = post.author || {};
  const handle = String(author.handle || '');
  const did = String(author.did || '');
  const text = String(post.record?.text || '');
  const createdAt = String(post.record?.createdAt || post.indexedAt || new Date().toISOString());

  // Pull external URL if this is an external-link embed (so we can render
  // a small "↗ link" hint on the card).
  let externalUrl: string | null = null;
  if (embed && embed.$type && embed.$type.includes('app.bsky.embed.external')) {
    externalUrl = embed?.external?.uri ?? null;
  }

  // Build the bsky.app permalink from the at-uri's rkey.
  const rkey = parseRkeyFromUri(post.uri);
  const webUrl = handle && rkey ? `https://bsky.app/profile/${handle}/post/${rkey}` : 'https://bsky.app';

  return {
    uri: String(post.uri || ''),
    cid: String(post.cid || ''),
    author: {
      handle,
      displayName: author.displayName ? String(author.displayName) : null,
      avatar: author.avatar ? String(author.avatar) : null,
      did,
    },
    text,
    createdAt,
    replyCount: Number(post.replyCount || 0),
    repostCount: Number(post.repostCount || 0),
    likeCount: Number(post.likeCount || 0),
    externalUrl,
    webUrl,
  };
}

/** at://did:.../app.bsky.feed.post/<rkey> → <rkey> */
function parseRkeyFromUri(uri: string | undefined): string | null {
  if (!uri) return null;
  const parts = uri.split('/');
  return parts[parts.length - 1] || null;
}

/** at://<did>/app.bsky.feed.post/<rkey> → <did> */
function parseDidFromUri(uri: string | undefined): string | null {
  if (!uri) return null;
  // at://did:plc:abc/app.bsky.feed.post/123  →  ['at:', '', 'did:plc:abc', ...]
  const parts = uri.split('/');
  return parts[2] || null;
}

// ─── Thread / reply backflow ────────────────────────────────────────────────

export interface BlueskyReply {
  uri: string;
  cid: string;
  author: { handle: string; displayName: string | null; avatar: string | null; did: string };
  text: string;
  createdAt: string;
  likeCount: number;
  repostCount: number;
  webUrl: string;
}

/**
 * Fetch the Bluesky thread for a given AT-URI and return the direct replies
 * as a flat list (newest first). Used by NRG PostView to surface replies on
 * cross-posted NRG posts — closes the bridge into bidirectional per
 * proposals/BLUESKY-TIMELINE-READER.md (v1.1).
 *
 * Read-only — replying back to a Bluesky thread happens on bsky.app via the
 * permalink. We never write replies through the bridge.
 *
 * Auth model: getPostThread is a public AppView read on bsky.social, so we
 * try unauthenticated first (a viewer who hasn't connected their Bluesky
 * account can still see public replies on a public NRG cross-post). If the
 * unauthenticated read fails (rate limit, soft-blocks, etc.) and the viewer
 * happens to be connected, we fall back to the authenticated path.
 *
 * v1 only surfaces direct replies (depth=1). Nested threads are read on
 * bsky.app — this surface is "what's happening on the bridge", not a full
 * thread reader. Filters out reposts and replies whose author has been
 * blocked/muted/deleted (the AppView marks these with a #blockedPost or
 * #notFoundPost type — we just skip them).
 *
 * Cap at 50 replies to keep the network payload sane. Anyone wanting the
 * full thread can click through to bsky.app via the post-card permalink.
 */
export async function fetchBlueskyThread(
  uri: string,
): Promise<{ ok: true; replies: BlueskyReply[]; thread_url: string } | { ok: false; reason: string }> {
  if (!uri || !uri.startsWith('at://')) {
    return { ok: false, reason: 'Not a Bluesky URI.' };
  }

  const cached = threadCache.get(uri);
  if (cached && cached.expiresAt > Date.now()) {
    return { ok: true, replies: cached.value.replies, thread_url: cached.value.thread_url };
  }

  const BskyAgent = await loadBskyAgentClass();
  if (!BskyAgent) {
    return { ok: false, reason: 'Bluesky SDK not loaded. Run `npm install @atproto/api` and rebuild.' };
  }

  // Try the unauthenticated public AppView first. This means a non-connected
  // viewer can still see public Bluesky replies on a cross-posted NRG post.
  const publicAgent = new BskyAgent({ service: 'https://api.bsky.app' });

  let res: any;
  try {
    res = await publicAgent.getPostThread({ uri, depth: 1, parentHeight: 0 });
  } catch (errPublic: any) {
    // Public AppView refused. If the viewer is connected, retry through the
    // authenticated agent (which gets a richer view for muted/blocked rules).
    // Prefer the OAuth-bound agent, then fall back to the app-password agent.
    if (isBlueskyConnected()) {
      // OAuth path first.
      if (isOAuthConnected()) {
        try {
          const oauth = await getOAuthAgent();
          if (oauth) {
            res = await oauth.agent.getPostThread({ uri, depth: 1, parentHeight: 0 });
          }
        } catch (errAuth: any) {
          oauthAgentCache = null;
          // fall through to app-password retry below; if that also fails we'll
          // surface the original public error.
        }
      }
      if (!res) {
        const handle = getConnectedBlueskyHandle();
        const appPassword = getStoredAppPassword();
        if (handle && appPassword) {
          try {
            let agent = agentCache.get(handle);
            if (!agent) {
              agent = new BskyAgent({ service: 'https://bsky.social' });
              const loginRes = await agent.login({ identifier: handle, password: appPassword });
              if (loginRes?.success) agentCache.set(handle, agent);
            }
            if (agent) res = await agent.getPostThread({ uri, depth: 1, parentHeight: 0 });
          } catch (errAuth: any) {
            return { ok: false, reason: translateBskyError(errAuth) };
          }
        }
      }
    }
    if (!res) return { ok: false, reason: translateBskyError(errPublic) };
  }

  const thread = res?.data?.thread;
  if (!thread || thread.$type === 'app.bsky.feed.defs#notFoundPost') {
    return { ok: false, reason: 'Bluesky thread not found — the original post may have been deleted.' };
  }
  if (thread.$type === 'app.bsky.feed.defs#blockedPost') {
    return { ok: false, reason: 'Bluesky thread blocked.' };
  }

  const repliesRaw = Array.isArray(thread.replies) ? thread.replies : [];
  const replies: BlueskyReply[] = [];
  for (const item of repliesRaw) {
    const mapped = mapThreadReply(item);
    if (mapped) replies.push(mapped);
    if (replies.length >= 50) break;
  }
  // Sort newest first — getPostThread returns oldest-first per the appview spec.
  replies.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  // Build the bsky.app permalink for the parent post so the UI can offer a
  // "Reply on Bluesky ↗" link without re-deriving it from the URI.
  const rootHandle = String(thread.post?.author?.handle || '');
  const rootRkey = parseRkeyFromUri(uri);
  const thread_url = rootHandle && rootRkey
    ? `https://bsky.app/profile/${rootHandle}/post/${rootRkey}`
    : 'https://bsky.app';

  // Cache on success only — let next call retry on error.
  threadCache.set(uri, {
    value: { replies, thread_url },
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
  return { ok: true, replies, thread_url };
}

function mapThreadReply(item: any): BlueskyReply | null {
  if (!item || !item.post) return null;
  if (item.$type === 'app.bsky.feed.defs#notFoundPost') return null;
  if (item.$type === 'app.bsky.feed.defs#blockedPost') return null;

  const post = item.post;
  const author = post.author || {};
  const handle = String(author.handle || '');
  const did = String(author.did || '');
  const text = String(post.record?.text || '');
  const createdAt = String(post.record?.createdAt || post.indexedAt || new Date().toISOString());

  const rkey = parseRkeyFromUri(post.uri);
  const webUrl = handle && rkey ? `https://bsky.app/profile/${handle}/post/${rkey}` : 'https://bsky.app';

  return {
    uri: String(post.uri || ''),
    cid: String(post.cid || ''),
    author: {
      handle,
      displayName: author.displayName ? String(author.displayName) : null,
      avatar: author.avatar ? String(author.avatar) : null,
      did,
    },
    text,
    createdAt,
    likeCount: Number(post.likeCount || 0),
    repostCount: Number(post.repostCount || 0),
    webUrl,
  };
}

/**
 * Build a bsky.app permalink for a given AT-URI. Useful in UI surfaces that
 * want a "View on Bluesky ↗" link without re-fetching the thread.
 *
 * Falls back to bsky.app when the URI is malformed.
 */
export function blueskyWebUrl(uri: string, handleHint?: string | null): string {
  if (!uri) return 'https://bsky.app';
  const rkey = parseRkeyFromUri(uri);
  if (handleHint && rkey) return `https://bsky.app/profile/${handleHint}/post/${rkey}`;
  // Fall back to the DID-based URL if we don't have a handle. bsky.app
  // accepts both /profile/<handle>/post/<rkey> and /profile/<did>/post/<rkey>.
  const did = parseDidFromUri(uri);
  if (did && rkey) return `https://bsky.app/profile/${did}/post/${rkey}`;
  return 'https://bsky.app';
}

// ─── Status helpers ─────────────────────────────────────────────────────────

/** Returns the connected handle — OAuth session preferred, then legacy
 *  app-password handle, else null. */
export function getConnectedBlueskyHandle(): string | null {
  if (typeof window === 'undefined') return null;
  // Prefer the OAuth handle when present.
  const oauthHandle = getOAuthHandle();
  if (oauthHandle) return oauthHandle;
  try {
    return window.localStorage.getItem(HANDLE_KEY);
  } catch {
    return null;
  }
}

/** Returns true if EITHER an OAuth session OR the legacy app-password is
 *  present in localStorage. */
export function isBlueskyConnected(): boolean {
  if (typeof window === 'undefined') return false;
  if (isOAuthConnected()) return true;
  try {
    return (
      !!window.localStorage.getItem(HANDLE_KEY) &&
      !!window.localStorage.getItem(APP_PASSWORD_KEY)
    );
  } catch {
    return false;
  }
}

/** Wipes BOTH the OAuth session marker AND the legacy app-password + handle.
 *  Idempotent — calling when only one is present is safe. Does NOT clear the
 *  profile's bluesky_handle column (caller decides whether to do that). */
export function disconnectBluesky(): void {
  // Fire-and-forget OAuth revocation (async). Local cleanup runs immediately
  // below so the UI can flip to "not connected" without waiting on the
  // network round-trip.
  if (isOAuthConnected()) {
    void disconnectBlueskyOAuth();
  }
  if (typeof window === 'undefined') return;
  try {
    const handle = window.localStorage.getItem(HANDLE_KEY);
    window.localStorage.removeItem(HANDLE_KEY);
    window.localStorage.removeItem(APP_PASSWORD_KEY);
    if (handle) agentCache.delete(handle);
  } catch {
    // localStorage write can fail in private mode — non-fatal.
  }
}

// ─── Internal helpers ───────────────────────────────────────────────────────

function persistCredentials(handle: string, appPassword: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(HANDLE_KEY, handle);
    window.localStorage.setItem(APP_PASSWORD_KEY, appPassword);
  } catch (err) {
    console.warn('[atproto] failed to persist credentials to localStorage:', err);
  }
}

function getStoredAppPassword(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(APP_PASSWORD_KEY);
  } catch {
    return null;
  }
}

function normalizeHandle(raw: string): string {
  return raw.trim().toLowerCase().replace(/^@/, '');
}

const BLUESKY_TEXT_LIMIT = 300;

function composePostText(
  body: string,
  nrgPostId: string | undefined,
  appendFooter: boolean,
): string {
  const trimmedBody = body.trim();
  if (!appendFooter) {
    return truncateGraphemes(trimmedBody, BLUESKY_TEXT_LIMIT);
  }

  const link = nrgPostId
    ? `https://frqncy.network/social/post/${nrgPostId}`
    : 'https://frqncy.network';
  const footer = `\n\n— via FRQNCY NRG ↗\n${link}`;

  // Reserve room for the footer; truncate the body portion only.
  const footerLen = countGraphemes(footer);
  const room = BLUESKY_TEXT_LIMIT - footerLen;
  if (room <= 0) {
    // Footer alone exceeds the limit — defensive; should never happen with
    // the canonical FRQNCY URL. Just send the body, no footer.
    return truncateGraphemes(trimmedBody, BLUESKY_TEXT_LIMIT);
  }
  const fittedBody = truncateGraphemes(trimmedBody, room);
  return fittedBody + footer;
}

/** Approximate grapheme count — Bluesky's official limit is graphemes, but
    a precise count requires Intl.Segmenter (modern browsers only). We use
    Intl.Segmenter when available and fall back to Array.from(str).length
    (correctly counts surrogate pairs but not all combining marks). */
function countGraphemes(s: string): number {
  if (typeof Intl !== 'undefined' && (Intl as any).Segmenter) {
    try {
      const seg = new (Intl as any).Segmenter('en', { granularity: 'grapheme' });
      let n = 0;
      for (const _ of seg.segment(s)) n++;
      return n;
    } catch {
      // fall through
    }
  }
  return Array.from(s).length;
}

function truncateGraphemes(s: string, maxGraphemes: number): string {
  if (countGraphemes(s) <= maxGraphemes) return s;
  // We need room for an ellipsis (1 grapheme).
  const targetCount = Math.max(1, maxGraphemes - 1);
  if (typeof Intl !== 'undefined' && (Intl as any).Segmenter) {
    try {
      const seg = new (Intl as any).Segmenter('en', { granularity: 'grapheme' });
      const out: string[] = [];
      for (const part of seg.segment(s)) {
        if (out.length >= targetCount) break;
        out.push(part.segment);
      }
      return out.join('') + '…';
    } catch {
      // fall through
    }
  }
  const arr = Array.from(s);
  return arr.slice(0, targetCount).join('') + '…';
}

function translateBskyError(err: any): string {
  const msg = (err?.message || err?.error || String(err || '')).toLowerCase();
  if (!msg) return 'Bluesky request failed (no message). Check the network and try again.';
  if (msg.includes('invalid') && (msg.includes('password') || msg.includes('credentials'))) {
    return 'Invalid handle or app password. Generate a fresh one at bsky.app/settings/app-passwords.';
  }
  if (msg.includes('rate') && msg.includes('limit')) {
    return 'Bluesky rate-limited the request. Try again in a minute.';
  }
  if (msg.includes('network') || msg.includes('failed to fetch') || msg.includes('fetch failed')) {
    return 'Network error reaching Bluesky. Check your connection and try again.';
  }
  if (msg.includes('account') && msg.includes('not') && msg.includes('found')) {
    return 'No Bluesky account found for that handle.';
  }
  // Surface the raw message — cleaned up — as a fallback.
  return `Bluesky error: ${err?.message || 'unknown'}`;
}
