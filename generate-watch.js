#!/usr/bin/env node
// generate-watch.js — inlines videos.json + playlists.json data into
// v2/watch/index.html so the watch hub works on file:// protocol without
// a local server.
// Run: node generate-watch.js
// (also called by: npm run build:watch)

const fs   = require('fs');
const path = require('path');

const ROOT      = __dirname;
const VIDEOS    = JSON.parse(fs.readFileSync(path.join(ROOT, 'videos.json'),    'utf8'));
const PLAYLISTS = JSON.parse(fs.readFileSync(path.join(ROOT, 'playlists.json'), 'utf8'));
const PROVIDERS = JSON.parse(fs.readFileSync(path.join(ROOT, 'providers.json'), 'utf8'));

// ── Build the flat inlined videos array ────────────────────────
const providerMap = new Map(PROVIDERS.map(p => [p.id, p]));

function getProvider(v) { return providerMap.get(v.provider || 'youtube') || providerMap.get('youtube'); }
function getVideoId(v)  { return v.video_id || v.youtube_id || ''; }

const TOPIC_LABELS = {
  't-meditation':'Meditation','t-quantum':'Quantum Physics','t-neuro':'Neuroscience',
  't-breathwork':'Breathwork','t-manifestation':'Manifestation','t-plantmed':'Plant Medicine',
  't-soundheal':'Sound Healing','t-quantum-grammar':'Quantum Grammar','t-ai':'AI & Technology',
  't-sacredgeo':'Sacred Geometry','t-vibration':'Vibration','t-saclaw':'Sacred Law',
  't-trudeau':'Kevin Trudeau','t-osho':'Osho','t-sadhguru':'Sadhguru','t-saimaa':'Sai Maa','t-garyspivey':'Gary Spivey',
  't-history':'History','t-movies':'Films'
};

const allVideos = [];
for (const [topicId, videos] of Object.entries(VIDEOS)) {
  for (const v of videos) {
    const id = getVideoId(v);
    if (!id || id.startsWith('PLACEHOLDER')) continue;
    allVideos.push({ ...v, topicId, topicLabel: TOPIC_LABELS[topicId] || topicId });
  }
}
// Picks first
allVideos.sort((a, b) => (b.frqncy_pick ? 1 : 0) - (a.frqncy_pick ? 1 : 0));

// ── Inject into the template ────────────────────────────────────
const TEMPLATE_PATH = path.join(ROOT, 'v2', 'watch', 'index.html');
let html = fs.readFileSync(TEMPLATE_PATH, 'utf8');

const MARKER_START = '// ▼▼ INLINE_DATA_START ▼▼';
const MARKER_END   = '// ▲▲ INLINE_DATA_END ▲▲';

const inlineBlock = [
  MARKER_START,
  `// Inlined at build time by generate-watch.js — works on file:// and web servers`,
  `const INLINE_VIDEOS = ${JSON.stringify(allVideos)};`,
  `const INLINE_PLAYLISTS = ${JSON.stringify(PLAYLISTS)};`,
  MARKER_END
].join('\n');

// Support both new and legacy markers for backwards compatibility
const LEGACY_START = '// ▼▼ INLINE_VIDEOS_START ▼▼';
const LEGACY_END   = '// ▲▲ INLINE_VIDEOS_END ▲▲';

if (html.includes(MARKER_START)) {
  const re = new RegExp(`${escapeRegExp(MARKER_START)}[\\s\\S]*?${escapeRegExp(MARKER_END)}`);
  html = html.replace(re, inlineBlock);
} else if (html.includes(LEGACY_START)) {
  const re = new RegExp(`${escapeRegExp(LEGACY_START)}[\\s\\S]*?${escapeRegExp(LEGACY_END)}`);
  html = html.replace(re, inlineBlock);
} else {
  // First run: insert after the opening <script> tag
  html = html.replace(
    '<script>\nconst TOPIC_LABELS',
    `<script>\n${inlineBlock}\n\nconst TOPIC_LABELS`
  );
}

fs.writeFileSync(TEMPLATE_PATH, html, 'utf8');
const collectionCount = PLAYLISTS.collections?.length || 0;
const playlistCount = (PLAYLISTS.collections || []).reduce((n, c) => n + (c.playlists?.length || 0), 0);
console.log(`✓  v2/watch/index.html (${allVideos.length} videos, ${playlistCount} playlists across ${collectionCount} collections inlined)`);

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
