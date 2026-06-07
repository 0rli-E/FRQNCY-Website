#!/usr/bin/env node
/**
 * propose.mjs — orchestrator. Stitches listen → enrich → blurb into a single
 * proposal file shaped exactly like the deltas you'd merge into videos.json
 * and playlists.json.
 *
 *   node scripts/ingest/propose.mjs
 *
 * Reads:  scripts/ingest/teachers.json, playlists.json, videos.json,
 *         scripts/ingest/output/channel-ids.json
 * Writes: scripts/ingest/output/proposals/INGEST-YYYY-MM-DD.json
 *         scripts/ingest/output/proposals/INGEST-YYYY-MM-DD.md (human-readable summary)
 *
 * The pipeline never touches videos.json, playlists.json, or watch/index.html.
 * Merging is a separate manual step (or a future PR-bot action).
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runListen } from './listen.mjs';
import { runEnrich } from './enrich.mjs';
import { runBlurb } from './blurb.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');
const OUTPUT_DIR = join(__dirname, 'output');
const PROPOSALS_DIR = join(OUTPUT_DIR, 'proposals');

function readJson(p) { return JSON.parse(readFileSync(p, 'utf8')); }
function writeJson(p, data) { writeFileSync(p, JSON.stringify(data, null, 2) + '\n'); }
function writeText(p, s) { writeFileSync(p, s); }

/* ── Build a short stable slug for new video IDs ──────────────── */
function makeVideoSlug(teacherId, existingIds) {
  // Match existing convention: v-osho-r16, v-sg-r18, v-gs-r21, v-hicks-8
  const prefixMap = {
    osho: 'osho-r',
    sadhguru: 'sg-r',
    trudeau: 'kt-r',
    saimaa: 'sm-r',
    neville: 'nev-r',
    shihengyi: 'shy-r',
    tolle: 'et-r',
    hancock: 'gh-r',
    'local-project': 'tlp-r',
    'planet-wild': 'pw-r',
    dispenza: 'jd-r',
    'kitchen-nightmares': 'kn-r',
    'master-key': 'mks-r',
    hicks: 'hicks-',
    'gary-spivey': 'gs-r',
    goldsilver: 'hsom-r',
  };
  const prefix = prefixMap[teacherId] || `${teacherId}-r`;
  // Find next available number
  let n = 1;
  let candidate;
  do {
    candidate = `v-${prefix}${String(n).padStart(2, '0')}`;
    n++;
  } while (existingIds.has(candidate) && n < 999);
  return candidate;
}

/* ── Compute rotation: append new, pop oldest if at cap ────────── */
function computeRotation(playlist, newSlugs, teacher, rotationDefault) {
  const max = teacher.max_videos ?? rotationDefault.max_videos ?? 20;
  const rotate = teacher.rotate ?? rotationDefault.rotate ?? true;
  const current = [...(playlist.video_ids || [])];
  const proposed = [...newSlugs, ...current];

  let popped = [];
  if (rotate && proposed.length > max) {
    popped = proposed.slice(max);
  }
  const finalIds = rotate ? proposed.slice(0, max) : proposed;
  return { final_video_ids: finalIds, popped, would_grow_to: proposed.length, cap: max };
}

/* ── Render the human-readable markdown summary ────────────────── */
function renderMarkdown(proposal) {
  const lines = [];
  lines.push(`# Ingest proposal — ${proposal.generated_at.slice(0, 10)}`);
  lines.push('');
  lines.push(`**Status:** draft (PR-mode) · **Teachers scanned:** ${proposal.summary.teachers_scanned} · **New uploads:** ${proposal.summary.new_uploads}`);
  lines.push('');
  if (proposal.summary.new_uploads === 0) {
    lines.push('No new uploads since last run. Nothing to merge.');
    return lines.join('\n');
  }
  lines.push('## Per-teacher additions');
  lines.push('');
  for (const t of proposal.teachers) {
    lines.push(`### ${t.teacher_id} → \`${t.playlist_id}\` (topic: \`${t.topic_id}\`)`);
    lines.push('');
    for (const v of t.video_additions) {
      lines.push(`- **\`${v.id}\`** — [${v.title}](https://www.youtube.com/watch?v=${v.youtube_id})`);
      lines.push(`  - \`channel:\` ${v.channel}${v.duration ? ` · \`duration:\` ${v.duration}` : ''}`);
      lines.push(`  - \`desc:\` ${v.desc || '_(no blurb generated)_'}`);
      lines.push(`  - \`source:\` ${v._blurb_source}`);
    }
    if (t.rotation.popped.length > 0) {
      lines.push('');
      lines.push(`  _Rotation would pop:_ ${t.rotation.popped.map(s => `\`${s}\``).join(', ')}`);
    }
    lines.push('');
  }
  lines.push('---');
  lines.push('');
  lines.push('## How to merge');
  lines.push('');
  lines.push('1. Read every blurb. Rewrite anything that violates the voice playbook (`proposals/FRQNCY-VOICE-PLAYBOOK.md`).');
  lines.push('2. Decide `frqncy_pick: true` for any starter-quality entry. Leave the rest `false`.');
  lines.push('3. Apply `proposal.videos_json_additions` to `videos.json` (append to the relevant `t-*` array).');
  lines.push('4. Apply `proposal.playlists_json_updates` to `playlists.json` (replace `video_ids` on the named playlists).');
  lines.push('5. Run `node generate-watch.js` to re-inline the data.');
  lines.push('6. Commit, push, done.');
  return lines.join('\n');
}

/* ── Main ──────────────────────────────────────────────────────── */
async function main() {
  if (!existsSync(PROPOSALS_DIR)) mkdirSync(PROPOSALS_DIR, { recursive: true });

  console.log('▶ listen…');
  let diff = await runListen();
  if (!diff || diff.diff.length === 0) {
    console.log('  No new uploads detected. Nothing to propose.');
    // Still write an empty proposal so the run is auditable
    const today = new Date().toISOString().slice(0, 10);
    const empty = {
      generated_at: new Date().toISOString(),
      summary: { teachers_scanned: diff?.teachers_scanned || 0, new_uploads: 0 },
      teachers: [],
      videos_json_additions: {},
      playlists_json_updates: {},
    };
    writeJson(join(PROPOSALS_DIR, `INGEST-${today}.json`), empty);
    writeText(join(PROPOSALS_DIR, `INGEST-${today}.md`), renderMarkdown(empty));
    return;
  }

  console.log('\n▶ enrich…');
  diff = await runEnrich(diff) || diff;

  console.log('\n▶ blurb…');
  diff = await runBlurb(diff) || diff;

  console.log('\n▶ assemble proposal…');
  const teachersFile = readJson(join(__dirname, 'teachers.json'));
  const playlists = readJson(join(REPO_ROOT, 'playlists.json'));
  const videos = readJson(join(REPO_ROOT, 'videos.json'));

  // Index every playlist across every collection so a teacher's playlist_id
  // resolves regardless of which collection (c-teachers / c-domains / ...) it lives in.
  const playlistMap = new Map();
  for (const c of (playlists.collections || [])) {
    for (const pl of (c.playlists || [])) playlistMap.set(pl.id, pl);
  }
  const teacherIngestMap = new Map((teachersFile.teachers || []).map(t => [t.playlist_id, t]));
  const rotationDefault = teachersFile.rotation_default || {};

  // Build a set of every video id we've ever used so makeVideoSlug doesn't collide
  const existingVideoIds = new Set();
  for (const list of Object.values(videos)) {
    for (const v of list) existingVideoIds.add(v.id);
  }

  const proposal = {
    generated_at: new Date().toISOString(),
    summary: {
      teachers_scanned: diff.teachers_scanned,
      teachers_failed: diff.teachers_failed,
      new_uploads: diff.new_count,
    },
    teachers: [],
    videos_json_additions: {},   // { "t-osho": [video, video], "t-sadhguru": [...] }
    playlists_json_updates: {},  // { "pl-osho": { "video_ids": [...] } }
  };

  for (const d of diff.diff) {
    const teacher = teacherIngestMap.get(d.playlist_id);
    const pl = playlistMap.get(d.playlist_id);
    if (!teacher || !pl) continue;

    const additions = [];
    const newSlugs = [];
    for (const u of d.new_uploads) {
      const slug = makeVideoSlug(teacher.id, existingVideoIds);
      existingVideoIds.add(slug);
      newSlugs.push(slug);
      additions.push({
        id: slug,
        youtube_id: u.youtube_id,
        title: u.title,
        channel: u.channel_name || d.channel_name || pl.channel_name || '',
        duration: u.duration || null,
        desc: u.frqncy_desc || '',
        frqncy_pick: false,
        _published_at: u.published_at || null,
        _source_url: `https://www.youtube.com/watch?v=${u.youtube_id}`,
        _raw_youtube_desc: (u.full_desc || u.raw_desc || '').slice(0, 500),
        _blurb_source: u.blurb_source || 'unknown',
      });
    }

    const rotation = computeRotation(pl, newSlugs, teacher, rotationDefault);

    proposal.teachers.push({
      teacher_id: teacher.id,
      playlist_id: d.playlist_id,
      topic_id: d.topic_id,
      channel_id: d.channel_id,
      video_additions: additions,
      rotation,
    });

    // Aggregate into the merge-shaped deltas
    if (!proposal.videos_json_additions[d.topic_id]) proposal.videos_json_additions[d.topic_id] = [];
    proposal.videos_json_additions[d.topic_id].push(...additions);

    proposal.playlists_json_updates[d.playlist_id] = {
      video_ids: rotation.final_video_ids,
      _rotation: { popped: rotation.popped, cap: rotation.cap, would_grow_to: rotation.would_grow_to },
    };
  }

  const today = proposal.generated_at.slice(0, 10);
  const jsonPath = join(PROPOSALS_DIR, `INGEST-${today}.json`);
  const mdPath = join(PROPOSALS_DIR, `INGEST-${today}.md`);
  writeJson(jsonPath, proposal);
  writeText(mdPath, renderMarkdown(proposal));

  console.log(`\n  proposal → ${jsonPath}`);
  console.log(`  summary  → ${mdPath}`);
  console.log(`\n  teachers=${proposal.teachers.length}  new_uploads=${proposal.summary.new_uploads}`);
  console.log('\n  Nothing has been written to videos.json or playlists.json. Review the proposal first.');
}

main().catch(err => { console.error('propose failed:', err); process.exit(1); });
