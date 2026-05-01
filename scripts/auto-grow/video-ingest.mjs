#!/usr/bin/env node
/**
 * video-ingest.mjs — drafts new video additions for Watch playlists.
 *
 * Reads playlists.json (c-teachers collection). For each playlist with a
 * channel_url, fetches the channel's videos page and extracts the latest 5
 * video IDs from the embedded JSON. Compares to playlist.video_ids.
 *
 * Writes scripts/auto-grow/output/videos-new.json with new candidates per
 * playlist. Never modifies videos.json or playlists.json.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');
const OUTPUT_DIR = join(__dirname, 'output');

async function fetchChannelVideoIds(channelUrl) {
  const url = channelUrl.replace(/\/$/, '') + '/videos';
  try {
    const res = await fetch(url, {
      headers: { 'user-agent': 'FRQNCY-AutoGrow/0.1' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const html = await res.text();
    // YouTube pages embed videoId references throughout — pull unique 11-char IDs.
    const ids = new Set();
    const re = /"videoId":"([a-zA-Z0-9_-]{11})"/g;
    let m;
    while ((m = re.exec(html)) && ids.size < 50) ids.add(m[1]);
    return [...ids];
  } catch (err) {
    return [];
  }
}

async function main() {
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

  let playlists;
  try {
    playlists = JSON.parse(readFileSync(join(REPO_ROOT, 'playlists.json'), 'utf8'));
  } catch (err) {
    console.error('Could not read playlists.json:', err.message);
    process.exit(0);
  }

  const teachers = (playlists.collections || []).find(c => c.id === 'c-teachers');
  if (!teachers || !teachers.playlists) {
    console.warn('No c-teachers collection in playlists.json');
    return;
  }

  const out = {
    generated_at: new Date().toISOString(),
    playlists_scanned: teachers.playlists.length,
    new_per_playlist: [],
  };

  for (const pl of teachers.playlists) {
    if (!pl.channel_url) continue;
    const fetched = await fetchChannelVideoIds(pl.channel_url);
    const existing = new Set(pl.video_ids || []);
    const newOnes = fetched.filter(id => !existing.has(id)).slice(0, 5);
    if (newOnes.length === 0) continue;
    out.new_per_playlist.push({
      playlist_id: pl.id,
      channel_name: pl.channel_name || null,
      channel_url: pl.channel_url,
      new_video_ids: newOnes,
      _review_notes: `Verify each video matches the playlist theme; titles + durations need a manual pass before merging into videos.json[t-${pl.id.replace('pl-', '')}].`,
    });
  }

  writeFileSync(join(OUTPUT_DIR, 'videos-new.json'), JSON.stringify(out, null, 2));
  console.log(`Wrote ${out.new_per_playlist.length} playlists with new candidates to videos-new.json`);
}

main().catch(err => { console.error('video-ingest failed:', err); process.exit(0); });
