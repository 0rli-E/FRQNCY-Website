#!/usr/bin/env node
/**
 * resolve-handles.mjs — turns playlists.json channel_urls into stable channel IDs.
 *
 * YouTube RSS feeds need a UC… channel_id, not a @handle. This script walks every
 * playlist's channel_url, fetches the channel page, extracts the canonical
 * channel_id from the embedded JSON, and writes a cache to
 * scripts/ingest/output/channel-ids.json.
 *
 * Cached so we don't hammer YouTube on every ingest run. Re-run only when
 * teachers move or channels rename.
 *
 *   node scripts/ingest/resolve-handles.mjs                # use cache where present
 *   node scripts/ingest/resolve-handles.mjs --force        # refresh every entry
 *
 * Output: scripts/ingest/output/channel-ids.json
 *   { "<channel_url>": "UC...channelId" }
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');
const OUTPUT_DIR = join(__dirname, 'output');
const CACHE_PATH = join(OUTPUT_DIR, 'channel-ids.json');

const FORCE = process.argv.includes('--force');

function readJson(p) { return JSON.parse(readFileSync(p, 'utf8')); }
function writeJson(p, data) { writeFileSync(p, JSON.stringify(data, null, 2) + '\n'); }

async function fetchChannelId(channelUrl) {
  // If the URL already encodes a UC… ID, return it directly.
  const direct = channelUrl.match(/\/channel\/(UC[a-zA-Z0-9_-]{22})/);
  if (direct) return direct[1];

  try {
    const res = await fetch(channelUrl, {
      headers: { 'user-agent': 'FRQNCY-Ingest/0.5' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const html = await res.text();

    // YouTube embeds the channel ID in several places — try the most stable first.
    const patterns = [
      /"channelId":"(UC[a-zA-Z0-9_-]{22})"/,
      /"externalId":"(UC[a-zA-Z0-9_-]{22})"/,
      /<meta[^>]+itemprop="channelId"[^>]+content="(UC[a-zA-Z0-9_-]{22})"/,
      /<link[^>]+rel="canonical"[^>]+href="[^"]*\/channel\/(UC[a-zA-Z0-9_-]{22})/,
    ];
    for (const re of patterns) {
      const m = html.match(re);
      if (m) return m[1];
    }
    return null;
  } catch {
    return null;
  }
}

async function main() {
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

  const playlists = readJson(join(REPO_ROOT, 'playlists.json'));
  const cache = existsSync(CACHE_PATH) ? readJson(CACHE_PATH) : {};

  // Walk every collection that has playlists with channel_urls (c-teachers, c-domains, etc.)
  const urls = [];
  for (const c of (playlists.collections || [])) {
    for (const pl of (c.playlists || [])) {
      if (pl.channel_url) urls.push(pl.channel_url);
    }
  }
  if (urls.length === 0) {
    console.warn('No channel_urls found anywhere in playlists.json — nothing to resolve.');
    return;
  }

  let resolved = 0, skipped = 0, failed = 0;
  for (const url of urls) {
    if (cache[url] && !FORCE) { skipped++; continue; }
    const id = await fetchChannelId(url);
    if (id) {
      cache[url] = id;
      resolved++;
      console.log(`  ${url} → ${id}`);
    } else {
      failed++;
      console.log(`  ${url} → FAILED`);
    }
  }

  writeJson(CACHE_PATH, cache);
  console.log(`\n  resolved=${resolved}  skipped=${skipped}  failed=${failed}  total=${urls.length}`);
  console.log(`  cache → ${CACHE_PATH}`);
}

main().catch(err => { console.error('resolve-handles failed:', err); process.exit(1); });
