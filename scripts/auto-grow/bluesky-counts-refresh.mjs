#!/usr/bin/env node
/**
 * bluesky-counts-refresh.mjs — refreshes bluesky_reply_count for cross-posted
 * NRG posts so the Feed bridge hint can show "↗ N on Bluesky" without each
 * page render hitting bsky.social.
 *
 * Per proposals/BLUESKY-TIMELINE-READER.md (v1.2 reply-count surface) +
 * migration 017.
 *
 * Selects up to BATCH_LIMIT posts where bluesky_uri IS NOT NULL, ordered by
 * bluesky_replies_synced_at NULLS FIRST + created_at DESC. Calls the public
 * Bluesky AppView (`https://api.bsky.app/xrpc/app.bsky.feed.getPosts`) in
 * groups of 25 URIs (the AppView limit) and writes back replyCount +
 * synced_at via the service-role REST API.
 *
 * No auth needed against bsky.social — getPosts is a public read.
 *
 * Why nightly + not on-demand: per-feed-render fetches would N+1 the public
 * AppView and add latency to NRG's most-rendered surface. The reply-backflow
 * thread on the post detail view (BlueskyReplies) gives users live counts
 * when they actually open the thread; the Feed pill just wants a "good
 * enough" recency signal that matches the tone of an acknowledgement, not a
 * counter.
 *
 * Required env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, 'output');

const BATCH_LIMIT = parseInt(process.env.BSKY_BATCH_LIMIT || '200', 10);
const APPVIEW_BATCH = 25; // hard cap from app.bsky.feed.getPosts
const APPVIEW_BASE = 'https://api.bsky.app/xrpc';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.');
  // exit-0 so the workflow doesn't fail when secrets aren't set yet — same
  // contract as the other auto-grow scripts.
  process.exit(0);
}

async function fetchStaleCrossposts() {
  // Two-phase select: NULL synced_at first (priority queue), then
  // oldest-synced. Postgres "NULLS FIRST" via PostgREST.
  const url = `${SUPABASE_URL}/rest/v1/posts`
    + `?select=id,bluesky_uri,bluesky_replies_synced_at`
    + `&bluesky_uri=not.is.null`
    + `&order=bluesky_replies_synced_at.asc.nullsfirst,created_at.desc`
    + `&limit=${BATCH_LIMIT}`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });
  if (!res.ok) {
    console.error('Posts fetch failed:', res.status, await res.text());
    return [];
  }
  return res.json();
}

async function fetchReplyCountsBatch(uris) {
  // Build the URI repetition: ?uris=at://x&uris=at://y...
  const qs = uris.map((u) => `uris=${encodeURIComponent(u)}`).join('&');
  const url = `${APPVIEW_BASE}/app.bsky.feed.getPosts?${qs}`;
  const res = await fetch(url, {
    headers: { 'user-agent': 'FRQNCY-AutoGrow/0.1' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    console.warn('AppView batch failed:', res.status, await res.text().catch(() => ''));
    return new Map();
  }
  const json = await res.json();
  const out = new Map();
  for (const p of json.posts || []) {
    const uri = p.uri;
    const count = Number(p.replyCount ?? 0);
    if (uri) out.set(uri, count);
  }
  return out;
}

async function persistCount(postId, count, syncedAt) {
  const url = `${SUPABASE_URL}/rest/v1/posts?id=eq.${postId}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      bluesky_reply_count: count,
      bluesky_replies_synced_at: syncedAt,
    }),
  });
  if (!res.ok) {
    console.warn(`Persist failed for ${postId}:`, res.status, await res.text().catch(() => ''));
    return false;
  }
  return true;
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function main() {
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });
  const posts = await fetchStaleCrossposts();
  if (posts.length === 0) {
    console.log('No cross-posted NRG posts to refresh — nothing to do.');
    writeFileSync(join(OUTPUT_DIR, 'bluesky-counts.json'), JSON.stringify({
      generated_at: new Date().toISOString(),
      processed: 0,
      updated: 0,
      missing: 0,
      note: 'no cross-posted NRG posts found',
    }, null, 2));
    return;
  }

  console.log(`Refreshing reply counts for ${posts.length} cross-posted NRG posts.`);

  const byUri = new Map();
  for (const p of posts) byUri.set(p.bluesky_uri, p.id);

  const uris = [...byUri.keys()];
  const batches = chunk(uris, APPVIEW_BATCH);

  let processed = 0;
  let updated = 0;
  let missing = 0;
  const syncedAt = new Date().toISOString();

  for (const batch of batches) {
    const counts = await fetchReplyCountsBatch(batch);
    for (const uri of batch) {
      const postId = byUri.get(uri);
      processed++;
      if (counts.has(uri)) {
        const ok = await persistCount(postId, counts.get(uri), syncedAt);
        if (ok) updated++;
      } else {
        // Post may have been deleted on bsky.app, or AppView didn't return
        // it. Mark it as synced with a 0 count so we don't re-poll it every
        // night forever — but log for the human review.
        const ok = await persistCount(postId, 0, syncedAt);
        if (ok) missing++;
      }
    }
    // Gentle pacing — Bluesky's public AppView doesn't publish a strict
    // rate limit but 25 URIs/200ms is well below what would draw attention.
    await new Promise((r) => setTimeout(r, 200));
  }

  const summary = {
    generated_at: syncedAt,
    processed,
    updated,
    missing,
    batch_count: batches.length,
    batch_size_cap: APPVIEW_BATCH,
    total_limit: BATCH_LIMIT,
  };
  writeFileSync(join(OUTPUT_DIR, 'bluesky-counts.json'), JSON.stringify(summary, null, 2));
  console.log(`Refreshed ${updated}/${processed} cross-posted NRG posts (${missing} missing on bsky).`);
}

main().catch((err) => {
  console.error('bluesky-counts-refresh failed:', err);
  process.exit(0);
});
