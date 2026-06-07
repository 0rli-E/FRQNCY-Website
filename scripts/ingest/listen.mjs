#!/usr/bin/env node
/**
 * listen.mjs — RSS-based listener for new YouTube uploads.
 *
 * For every teacher in scripts/ingest/teachers.json, fetches the channel's
 * YouTube Atom feed (no API key, no quota) and diffs against the video_ids
 * already present in playlists.json + videos.json. Returns only the new
 * uploads.
 *
 *   node scripts/ingest/listen.mjs                # print diff summary
 *   node scripts/ingest/listen.mjs --json         # write output/diff.json
 *
 * Output (with --json): scripts/ingest/output/diff.json
 *   {
 *     "generated_at": "...",
 *     "teachers_scanned": 16,
 *     "new_count": 12,
 *     "diff": [
 *       {
 *         "teacher_id": "osho",
 *         "playlist_id": "pl-osho",
 *         "topic_id": "t-osho",
 *         "channel_id": "UC...",
 *         "new_uploads": [
 *           { "youtube_id": "...", "title": "...", "published_at": "...", "channel_name": "...", "raw_desc": "..." }
 *         ]
 *       }
 *     ]
 *   }
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');
const OUTPUT_DIR = join(__dirname, 'output');

const WRITE_JSON = process.argv.includes('--json');
const LIMIT_PER_TEACHER = 15; // YouTube Atom feed returns 15 most-recent uploads

function readJson(p) { return JSON.parse(readFileSync(p, 'utf8')); }
function writeJson(p, data) { writeFileSync(p, JSON.stringify(data, null, 2) + '\n'); }

/* ── Atom parser (regex; YouTube's feed is predictable) ───────── */
function parseAtomFeed(xml) {
  const entries = [];
  const entryRe = /<entry>([\s\S]*?)<\/entry>/g;
  let m;
  while ((m = entryRe.exec(xml))) {
    const block = m[1];
    const pick = (re) => { const x = block.match(re); return x ? x[1].trim() : null; };
    const decode = (s) => s ? s
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'") : s;

    entries.push({
      youtube_id: pick(/<yt:videoId>([^<]+)<\/yt:videoId>/),
      title: decode(pick(/<title>([\s\S]*?)<\/title>/)),
      channel_name: decode(pick(/<author>\s*<name>([\s\S]*?)<\/name>/)),
      published_at: pick(/<published>([^<]+)<\/published>/),
      raw_desc: decode(pick(/<media:description>([\s\S]*?)<\/media:description>/)),
    });
  }
  return entries.filter(e => e.youtube_id);
}

async function fetchFeed(channelId) {
  const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  try {
    const res = await fetch(url, {
      headers: { 'user-agent': 'FRQNCY-Ingest/0.5 (+https://frqncy.network)' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return { ok: false, reason: `http_${res.status}` };
    const xml = await res.text();
    return { ok: true, entries: parseAtomFeed(xml).slice(0, LIMIT_PER_TEACHER) };
  } catch (err) {
    return { ok: false, reason: err.message };
  }
}

/* ── Build "videos we already know about" index ────────────────── */
function buildKnownIds(videos, playlists) {
  const known = new Set();
  // From videos.json — every youtube_id in any topic
  for (const list of Object.values(videos)) {
    for (const v of list) {
      const id = v.youtube_id || v.video_id;
      if (id) known.add(id);
    }
  }
  // From playlists.json — every video_id slug that we can resolve back to a youtube_id
  // (these are the v-… short slugs that point at videos.json entries — already covered above)
  return known;
}

/* ── Main ──────────────────────────────────────────────────────── */
async function main() {
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

  const teachersFile = readJson(join(__dirname, 'teachers.json'));
  const playlists = readJson(join(REPO_ROOT, 'playlists.json'));
  const videos = readJson(join(REPO_ROOT, 'videos.json'));
  const channelIdCache = existsSync(join(OUTPUT_DIR, 'channel-ids.json'))
    ? readJson(join(OUTPUT_DIR, 'channel-ids.json'))
    : {};

  // Index every playlist across every collection so a teacher's playlist_id
  // resolves regardless of which collection (c-teachers / c-domains / ...) it lives in.
  const playlistMap = new Map();
  for (const c of (playlists.collections || [])) {
    for (const pl of (c.playlists || [])) playlistMap.set(pl.id, pl);
  }

  const known = buildKnownIds(videos, playlists);
  const excluded = new Set(teachersFile.excluded_video_ids || []);

  // Build topic mapping by looking at where each playlist's videos live
  const vidToTopic = new Map();
  for (const [topicId, list] of Object.entries(videos)) {
    for (const v of list) vidToTopic.set(v.id, topicId);
  }

  const diff = [];
  let scanned = 0, newCount = 0, failed = 0;

  for (const teacher of teachersFile.teachers) {
    const pl = playlistMap.get(teacher.playlist_id);
    if (!pl) { console.warn(`  ${teacher.id}: no playlist ${teacher.playlist_id} in playlists.json — skipping`); continue; }
    if (!pl.channel_url) { console.warn(`  ${teacher.id}: playlist has no channel_url — skipping`); continue; }

    const channelId = channelIdCache[pl.channel_url];
    if (!channelId) {
      console.warn(`  ${teacher.id}: no channel_id cached for ${pl.channel_url} — run resolve-handles.mjs first`);
      failed++;
      continue;
    }

    scanned++;
    const result = await fetchFeed(channelId);
    if (!result.ok) {
      console.warn(`  ${teacher.id}: feed fetch failed (${result.reason})`);
      failed++;
      continue;
    }

    // Topic for new videos: prefer explicit override, else derive from existing playlist contents
    const topicId = teacher.topic_override
      || (pl.video_ids?.[0] && vidToTopic.get(pl.video_ids[0]))
      || null;

    const fresh = result.entries.filter(e => !known.has(e.youtube_id) && !excluded.has(e.youtube_id));
    if (fresh.length === 0) continue;
    newCount += fresh.length;

    diff.push({
      teacher_id: teacher.id,
      playlist_id: teacher.playlist_id,
      topic_id: topicId,
      channel_id: channelId,
      channel_url: pl.channel_url,
      channel_name: pl.channel_name || null,
      new_uploads: fresh,
    });
  }

  const out = {
    generated_at: new Date().toISOString(),
    teachers_scanned: scanned,
    teachers_failed: failed,
    new_count: newCount,
    diff,
  };

  if (WRITE_JSON) {
    writeJson(join(OUTPUT_DIR, 'diff.json'), out);
    console.log(`\n  scanned=${scanned}  failed=${failed}  new=${newCount}`);
    console.log(`  wrote → ${join(OUTPUT_DIR, 'diff.json')}`);
  } else {
    // Pretty-print summary
    console.log(`\n  scanned=${scanned}  failed=${failed}  new=${newCount}`);
    for (const d of diff) {
      console.log(`\n  ${d.teacher_id} (${d.new_uploads.length} new)`);
      for (const u of d.new_uploads.slice(0, 3)) {
        console.log(`    • ${u.youtube_id}  ${u.title?.slice(0, 70)}`);
      }
      if (d.new_uploads.length > 3) console.log(`    … +${d.new_uploads.length - 3} more`);
    }
  }

  return out;
}

// Allow `import { runListen }` from other scripts (propose.mjs uses this)
export async function runListen() { return main(); }

// Detect "run as main" — works even when paths contain spaces (URL-encoding mismatch)
const isMain = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;
if (isMain) {
  main().catch(err => { console.error('listen failed:', err); process.exit(1); });
}
