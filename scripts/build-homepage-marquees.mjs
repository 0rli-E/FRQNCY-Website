#!/usr/bin/env node
// scripts/build-homepage-marquees.mjs
//
// Single mixed marquee. ALL cards same size, ALL cards have real pictures.
//
// Image resolution per kind:
//   book   → b.image (openlibrary covers)
//   video  → https://img.youtube.com/vi/<id>/hqdefault.jpg
//   person → p.image
//   place  → pl.image (added 2026-05-12)
//   film   → if media URL is YouTube → derive thumbnail; else creator's photo
//   topic  → walk picked_in/appears_in, return the first entity's image
//
// Any item that can't resolve a real image is filtered out (no gradient
// fallbacks). User explicitly requested "pictures for all of them".

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

function shuffle(arr, seed = 42) {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function trimTo(s, max) {
  s = (s || '').trim();
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trim() + '…';
}

function card({ kind, eyebrow, title, image, href }) {
  return (
    `<a class="mq-card mq-kind-${esc(kind)}" href="${esc(href)}">` +
      `<span class="mq-img"><img src="${esc(image)}" alt="" loading="lazy" decoding="async" onerror="this.parentElement.classList.add('mq-img-broken')"></span>` +
      `<span class="mq-meta">` +
        (eyebrow ? `<span class="mq-eyebrow">${esc(eyebrow)}</span>` : '') +
        `<span class="mq-title">${esc(trimTo(title, 64))}</span>` +
      `</span>` +
    `</a>`
  );
}

// --- Load beds --------------------------------------------------------------
const content = read('content.json');
const books = read('books.json').books;
const media = read('media.json').media;
const places = read('places.json').places;
let videosObj = {};
try { videosObj = read('videos.json'); } catch { videosObj = {}; }
const people = read('people.json').people;
const peopleById = new Map(people.map(p => [p.id, p]));

const topics = content.topics;
const topicById = new Map(topics.map(t => [t.id, t]));
const placeById = new Map(places.map(pl => [pl.id, pl]));
const bookById = new Map(books.map(b => [b.id, b]));
const mediaById = new Map(media.map(m => [m.id, m]));

// --- Image helpers ----------------------------------------------------------

function ytIdFromUrl(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

function ytThumb(id) {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

function imageForEntity(entityId) {
  if (typeof entityId !== 'string') return null;
  if (entityId.startsWith('b-')) {
    const b = bookById.get(entityId);
    return b?.image || null;
  }
  if (entityId.startsWith('p-')) {
    const p = peopleById.get(entityId);
    return p?.image || null;
  }
  if (entityId.startsWith('pl-')) {
    const pl = placeById.get(entityId);
    return pl?.image || null;
  }
  if (entityId.startsWith('m-')) {
    const m = mediaById.get(entityId);
    if (!m) return null;
    if (m.image) return m.image;
    const yt = ytIdFromUrl(m.url);
    if (yt) return ytThumb(yt);
    // Use creator photo as last resort
    if (m.creator_is_person_ref && peopleById.has(m.creator)) {
      const c = peopleById.get(m.creator);
      return c?.image || null;
    }
    return null;
  }
  return null;
}

// For topics: walk picked_in (preferred), then appears_in across all beds
// and return the first entity that resolves to an image URL.
function imageForTopic(topicId) {
  const candidatePools = [
    books,
    people.filter(p => p.image),
    places,
    media,
  ];
  // Pass 1: picked_in (FRQNCY's top picks)
  for (const pool of candidatePools) {
    for (const e of pool) {
      if (Array.isArray(e.picked_in) && e.picked_in.includes(topicId)) {
        const img = imageForEntity(e.id);
        if (img) return img;
      }
    }
  }
  // Pass 2: appears_in (broader pool)
  for (const pool of candidatePools) {
    for (const e of pool) {
      if (Array.isArray(e.appears_in) && e.appears_in.includes(topicId)) {
        const img = imageForEntity(e.id);
        if (img) return img;
      }
    }
  }
  return null;
}

// --- Build pools ------------------------------------------------------------

const bookPool = shuffle(books.filter(b => b.image && b.picked_in?.length), 11).slice(0, 4)
  .map(b => {
    let author = '';
    if (b.author_is_person_ref && peopleById.has(b.author)) author = peopleById.get(b.author).name;
    else if (typeof b.author === 'string') author = b.author;
    return card({
      kind: 'book',
      eyebrow: author || 'Book',
      title: b.title,
      image: b.image,
      href: `/books/${b.id.replace(/^b-/, '')}/`,
    });
  });

// Videos
const allVideos = [];
for (const [topicId, vids] of Object.entries(videosObj)) {
  if (!Array.isArray(vids)) continue;
  const t = topicById.get(topicId);
  if (!t) continue;
  for (const v of vids) {
    if (!v?.youtube_id) continue;
    allVideos.push({ topic: t, v });
  }
}
const videoPool = shuffle(allVideos, 23).slice(0, 3).map(({ topic, v }) =>
  card({
    kind: 'video',
    eyebrow: v.channel || topic.label,
    title: v.title,
    image: ytThumb(v.youtube_id),
    href: `/v2/watch/index.html#${encodeURIComponent(v.youtube_id)}`,
  })
);

const peoplePool = shuffle(people.filter(p => p.image), 31).slice(0, 3).map(p =>
  card({
    kind: 'person',
    eyebrow: 'Person',
    title: p.name,
    image: p.image,
    href: `/people/${p.id.replace(/^p-/, '')}/`,
  })
);

// Topics — only include if we can find a representative image
const handpickedTopicIds = [
  't-source','t-meditation','t-networkstates','t-charter-cities','t-abilities','t-conscap',
];
const topicPool = [];
for (const id of handpickedTopicIds) {
  const t = topicById.get(id);
  if (!t) continue;
  const img = imageForTopic(id);
  if (!img) continue;  // Skip if no representative image
  topicPool.push(card({
    kind: 'topic',
    eyebrow: 'Topic',
    title: t.label,
    image: img,
    href: `/v2/${t.slug || t.id.replace(/^t-/, '')}/`,
  }));
  if (topicPool.length >= 3) break;
}

// Films — only include if we can resolve an image
const filmKeywords = ['film','movie','documentary','feature','docuseries'];
const films = media.filter(m => filmKeywords.some(k => (m.bio || '').toLowerCase().includes(k)));
const filmCards = [];
for (const m of shuffle(films, 41)) {
  const img = imageForEntity(m.id);
  if (!img) continue;
  let creator = '';
  if (m.creator_is_person_ref && peopleById.has(m.creator)) creator = peopleById.get(m.creator).name;
  else if (typeof m.creator === 'string') creator = m.creator;
  filmCards.push(card({
    kind: 'film',
    eyebrow: creator || 'Film',
    title: m.name,
    image: img,
    href: `/media/${m.id.replace(/^m-/, '')}/`,
  }));
  if (filmCards.length >= 2) break;
}

// Places
const placePool = shuffle(places.filter(pl => pl.image), 53).slice(0, 3).map(pl =>
  card({
    kind: 'place',
    eyebrow: pl.location || 'Place',
    title: pl.name,
    image: pl.image,
    href: `/places/${pl.id.replace(/^pl-/, '')}/`,
  })
);

// --- Interleave -------------------------------------------------------------
function interleave(...streams) {
  const out = [];
  const max = Math.max(...streams.map(s => s.length));
  for (let i = 0; i < max; i++) {
    for (const s of streams) if (i < s.length) out.push(s[i]);
  }
  return out;
}
const stream = interleave(bookPool, videoPool, peoplePool, placePool, topicPool, filmCards);

const finalCards = stream;
const track = finalCards.concat(finalCards).join('');

const generatedBlock =
  `<div class="mq-shelf">` +
    `<div class="mq-track" style="--mq-speed:420s">${track}</div>` +
  `</div>`;

// --- Inject ---------------------------------------------------------------
const HOMEPAGE = path.join(ROOT, 'index.html');
const homepage = fs.readFileSync(HOMEPAGE, 'utf8');

const MARK_START = '<!-- ▼▼ FRQNCY_MARQUEE_SHELVES ▼▼ -->';
const MARK_END = '<!-- ▲▲ FRQNCY_MARQUEE_SHELVES ▲▲ -->';

const startIdx = homepage.indexOf(MARK_START);
const endIdx = homepage.indexOf(MARK_END);
if (startIdx < 0 || endIdx < 0 || endIdx < startIdx) {
  console.error('Could not find marquee markers in index.html.');
  process.exit(1);
}

const before = homepage.slice(0, startIdx + MARK_START.length);
const after = homepage.slice(endIdx);
const updated = before + '\n' + generatedBlock + '\n    ' + after;

if (process.argv.includes('--check')) {
  if (homepage === updated) {
    console.log('✓ Marquee in sync.');
    process.exit(0);
  } else {
    console.error('✗ Marquee stale. Run: node scripts/build-homepage-marquees.mjs');
    process.exit(1);
  }
}

fs.writeFileSync(HOMEPAGE, updated, 'utf8');
console.log(`✓ Mixed marquee rebuilt (${finalCards.length} cards, doubled to ${finalCards.length*2}).`);
console.log(`  Books: ${bookPool.length} · Videos: ${videoPool.length} · People: ${peoplePool.length} · Places: ${placePool.length} · Topics: ${topicPool.length} · Films: ${filmCards.length}`);
