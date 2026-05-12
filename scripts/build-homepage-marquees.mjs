#!/usr/bin/env node
// scripts/build-homepage-marquees.mjs
//
// Generates a SINGLE mixed marquee row for the homepage — books, videos,
// people, films, places, topics all in one rotating shelf. Twitch-style
// compact image-forward cards with text below.
//
// Output goes between the ▼▼ FRQNCY_MARQUEE_SHELVES ▲▲ markers in index.html.
//
// Image strategy:
//   - books   → b.image (openlibrary covers)
//   - videos  → https://img.youtube.com/vi/<id>/hqdefault.jpg
//   - people  → p.image where present
//   - films/places/topics → text-only fallback card with a gradient backdrop
//
// Usage:
//   node scripts/build-homepage-marquees.mjs
//   node scripts/build-homepage-marquees.mjs --check

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
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function trimTo(s, max) {
  s = (s || '').trim();
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trim() + '…';
}

function card({ kind, eyebrow, title, image, href }) {
  const eyebrowHtml = eyebrow
    ? `<span class="mq-eyebrow">${esc(eyebrow)}</span>`
    : '';
  const titleHtml = `<span class="mq-title">${esc(trimTo(title, 70))}</span>`;
  const imgHtml = image
    ? `<span class="mq-img"><img src="${esc(image)}" alt="" loading="lazy" decoding="async"></span>`
    : `<span class="mq-img mq-img-fallback" data-kind="${esc(kind)}"><span class="mq-img-label">${esc(eyebrow || kind || '')}</span></span>`;
  return (
    `<a class="mq-card mq-kind-${esc(kind)}" href="${esc(href)}">` +
      imgHtml +
      `<span class="mq-meta">${eyebrowHtml}${titleHtml}</span>` +
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
const domainById = new Map(content.domains.map(d => [d.id, d]));
const pillarById = new Map(content.pillars.map(p => [p.id, p]));
function pillarLabelFor(t) {
  const d = domainById.get(t.domain);
  if (!d) return '';
  const p = pillarById.get(d.pillar);
  return p?.label || '';
}

// --- Build pools ------------------------------------------------------------

const bookPool = shuffle(books.filter(b => b.image && b.picked_in?.length), 11).slice(0, 3)
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

// Videos: keyed by topic.
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
    image: `https://img.youtube.com/vi/${v.youtube_id}/hqdefault.jpg`,
    href: `/v2/watch/index.html#${encodeURIComponent(v.youtube_id)}`,
  })
);

const peoplePool = shuffle(people.filter(p => p.image), 31).slice(0, 2).map(p =>
  card({
    kind: 'person',
    eyebrow: 'Person',
    title: p.name,
    image: p.image,
    href: `/people/${p.id.replace(/^p-/, '')}/`,
  })
);

// Topics — text-only cards
const handpickedTopicIds = [
  't-source','t-networkstates','t-abilities',
];
const topicPool = handpickedTopicIds.map(id => topicById.get(id)).filter(Boolean).map(t =>
  card({
    kind: 'topic',
    eyebrow: pillarLabelFor(t) || 'Topic',
    title: t.label,
    image: null,
    href: `/v2/${t.slug || t.id.replace(/^t-/, '')}/`,
  })
);

// Films — text-only cards (no images in bed)
const filmKeywords = ['film','movie','documentary','feature','docuseries'];
const films = media.filter(m => filmKeywords.some(k => (m.bio || '').toLowerCase().includes(k)));
const filmPool = shuffle(films, 41).slice(0, 2).map(m => {
  let creator = '';
  if (m.creator_is_person_ref && peopleById.has(m.creator)) creator = peopleById.get(m.creator).name;
  else if (typeof m.creator === 'string') creator = m.creator;
  return card({
    kind: 'film',
    eyebrow: creator || 'Film',
    title: m.name,
    image: null,
    href: `/media/${m.id.replace(/^m-/, '')}/`,
  });
});

// Places — text-only cards
const placePool = shuffle(places, 53).slice(0, 2).map(pl =>
  card({
    kind: 'place',
    eyebrow: pl.location || 'Place',
    title: pl.name,
    image: null,
    href: `/places/${pl.id.replace(/^pl-/, '')}/`,
  })
);

// --- Interleave -------------------------------------------------------------
// Round-robin merge with image-forward weighting (books + videos first), then
// people, then text-only types. Shuffle the assembled stream lightly so kinds
// don't clump.
function interleave(...streams) {
  const out = [];
  const lens = streams.map(s => s.length);
  const max = Math.max(...lens);
  for (let i = 0; i < max; i++) {
    for (const s of streams) if (i < s.length) out.push(s[i]);
  }
  return out;
}
const stream = interleave(bookPool, videoPool, peoplePool, topicPool, filmPool, placePool);
// Light shuffle while preserving cadence — swap 12% of adjacent positions.
let seed = 71;
for (let i = 1; i < stream.length; i += 8) {
  seed = (seed * 9301 + 49297) % 233280;
  const j = i + (seed % 3 === 0 ? -1 : 1);
  if (j > 0 && j < stream.length) {
    [stream[i], stream[j]] = [stream[j], stream[i]];
  }
}

// Cap at ~72 — long enough that the loop never feels short, short enough that
// the doubled track stays under ~144 cards in the DOM.
const finalCards = stream.slice(0, 14);
// Duplicate for seamless -50% animation.
const track = finalCards.concat(finalCards).join('');

const generatedBlock =
  `<div class="mq-shelf">` +
    `<div class="mq-track" style="--mq-speed:420s">${track}</div>` +
  `</div>`;

// --- Inject ----------------------------------------------------------------
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
    console.log('✓ Homepage marquee in sync.');
    process.exit(0);
  } else {
    console.error('✗ Homepage marquee stale. Run: node scripts/build-homepage-marquees.mjs');
    process.exit(1);
  }
}

fs.writeFileSync(HOMEPAGE, updated, 'utf8');

console.log(`✓ Mixed marquee rebuilt (${finalCards.length} cards, doubled to ${finalCards.length * 2}).`);
console.log(`  Books: ${bookPool.length} · Videos: ${videoPool.length} · People: ${peoplePool.length} · Topics: ${topicPool.length} · Films: ${filmPool.length} · Places: ${placePool.length}`);
