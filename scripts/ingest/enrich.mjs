#!/usr/bin/env node
/**
 * enrich.mjs — optional YouTube Data API metadata enricher.
 *
 * The Atom feed gives us youtube_id, title, channel_name, published_at,
 * and a short description — but no duration. The Data API's videos.list
 * endpoint adds contentDetails.duration (ISO 8601 like "PT45M3S") and the
 * full snippet.description.
 *
 * Requires YOUTUBE_API_KEY. If unset, this script exits 0 without doing
 * anything — the pipeline still works, the proposal just won't have
 * durations.
 *
 * Cost: 1 unit per videos.list call, up to 50 ids per call. With ~20
 * teachers and ~2 new uploads each, that's a single API call per run,
 * well inside the 10k/day free tier.
 *
 *   node scripts/ingest/enrich.mjs                   # in-place modifies output/diff.json
 *
 * Reads: scripts/ingest/output/diff.json
 * Writes: scripts/ingest/output/diff.json (adds duration + full_desc per upload)
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, 'output');
const DIFF_PATH = join(OUTPUT_DIR, 'diff.json');

const API_KEY = process.env.YOUTUBE_API_KEY;
const API_BASE = 'https://www.googleapis.com/youtube/v3';

function readJson(p) { return JSON.parse(readFileSync(p, 'utf8')); }
function writeJson(p, data) { writeFileSync(p, JSON.stringify(data, null, 2) + '\n'); }

/* ── ISO 8601 duration → "45 min" / "8 min" / "1h 5min" ──────── */
function humanizeDuration(iso) {
  if (!iso) return null;
  const m = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!m) return null;
  const h = parseInt(m[1] || '0', 10);
  const min = parseInt(m[2] || '0', 10);
  const s = parseInt(m[3] || '0', 10);
  // Round seconds-only videos up to 1 min for display sanity
  if (h === 0 && min === 0) return s > 0 ? '1 min' : null;
  if (h === 0) return `${min} min`;
  if (min === 0) return `${h} hr`;
  return `${h}h ${min}min`;
}

async function fetchBatch(ids) {
  const url = `${API_BASE}/videos?part=contentDetails,snippet&id=${ids.join(',')}&key=${API_KEY}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`youtube_api_${res.status}`);
  const data = await res.json();
  const byId = new Map();
  for (const item of (data.items || [])) {
    byId.set(item.id, {
      duration: humanizeDuration(item.contentDetails?.duration),
      full_desc: item.snippet?.description || null,
    });
  }
  return byId;
}

export async function runEnrich(diffArg) {
  if (!API_KEY) {
    console.log('  YOUTUBE_API_KEY not set — skipping enrichment (the pipeline still works).');
    return diffArg || null;
  }

  const diff = diffArg || (existsSync(DIFF_PATH) ? readJson(DIFF_PATH) : null);
  if (!diff) {
    console.log('  No diff.json — run listen.mjs --json first.');
    return null;
  }

  const allIds = [];
  for (const d of diff.diff) {
    for (const u of d.new_uploads) allIds.push(u.youtube_id);
  }
  if (allIds.length === 0) {
    console.log('  No new uploads to enrich.');
    return diff;
  }

  // Chunk into batches of 50 (API limit)
  const enriched = new Map();
  for (let i = 0; i < allIds.length; i += 50) {
    const batch = allIds.slice(i, i + 50);
    try {
      const byId = await fetchBatch(batch);
      for (const [id, meta] of byId.entries()) enriched.set(id, meta);
    } catch (err) {
      console.warn(`  enrich batch ${i}-${i + batch.length} failed: ${err.message}`);
    }
  }

  // Splice enriched metadata back into the diff
  let added = 0;
  for (const d of diff.diff) {
    for (const u of d.new_uploads) {
      const meta = enriched.get(u.youtube_id);
      if (!meta) continue;
      if (meta.duration) u.duration = meta.duration;
      if (meta.full_desc) u.full_desc = meta.full_desc;
      added++;
    }
  }

  if (!diffArg) writeJson(DIFF_PATH, diff);
  console.log(`  enriched ${added}/${allIds.length} uploads with duration + description`);
  return diff;
}

const isMain = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;
if (isMain) {
  runEnrich().catch(err => { console.error('enrich failed:', err); process.exit(1); });
}
