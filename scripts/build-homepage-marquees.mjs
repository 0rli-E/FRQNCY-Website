#!/usr/bin/env node
// scripts/build-homepage-marquees.mjs
//
// Generates the marquee-shelf HTML for the homepage and writes it between the
// ▼▼ FRQNCY_MARQUEE_SHELVES ▲▲ markers in index.html.
//
// Five shelves: Topics · Books · Films · Places · Watch.
// Each shelf renders ~20 cards. The track is duplicated (twice) so the
// CSS @keyframes mq-scroll can run a seamless -50% loop.
//
// Usage:
//   node scripts/build-homepage-marquees.mjs           # write to index.html
//   node scripts/build-homepage-marquees.mjs --check   # CI guard: fails if homepage stale
//
// Re-run any time the beds change meaningfully.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

// Deterministic-ish shuffle so the same run produces stable output for diffing,
// but the pick rotates when the bed changes.
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

function card({ eyebrow, title, meta, href }) {
  return (
    `<a class="mq-card" href="${esc(href)}">` +
      (eyebrow ? `<p class="mq-card-eyebrow">${esc(eyebrow)}</p>` : '') +
      `<h3 class="mq-card-title">${esc(title)}</h3>` +
      (meta ? `<p class="mq-card-meta">${esc(meta)}</p>` : '') +
    `</a>`
  );
}

function shelf({ tag, all, cards, speed }) {
  // Duplicate cards twice so the -50% scroll loops seamlessly.
  const doubled = cards.concat(cards);
  const track = doubled.join('');
  return (
    `<div class="mq-shelf">` +
      `<div class="mq-shelf-label">` +
        `<span class="mq-tag">${esc(tag)}</span>` +
        `<span class="mq-rule"></span>` +
        (all ? `<a class="mq-all" href="${esc(all)}">See all</a>` : '') +
      `</div>` +
      `<div class="mq-track" style="--mq-speed:${speed}s">${track}</div>` +
    `</div>`
  );
}

// --- Load beds --------------------------------------------------------------
const content = read('content.json');
const books = read('books.json').books;
const media = read('media.json').media;
const places = read('places.json').places;
let videosObj = {};
try { videosObj = read('videos.json'); } catch { videosObj = {}; }
const peopleById = new Map(read('people.json').people.map(p => [p.id, p]));

const topics = content.topics;
const topicById = new Map(topics.map(t => [t.id, t]));
const domainById = new Map(content.domains.map(d => [d.id, d]));
const pillarById = new Map(content.pillars.map(p => [p.id, p]));

function pillarLabelFor(topic) {
  const d = domainById.get(topic.domain);
  if (!d) return '';
  const p = pillarById.get(d.pillar);
  return p?.label || '';
}

function topicUrl(t) {
  return `/v2/${t.slug || t.id.replace(/^t-/, '')}/`;
}

// --- Shelf 1: Topics --------------------------------------------------------
// Mix: pull from each pillar so the shelf reads as a cross-section, not a
// single domain dump. Order by hand-picked seed first, then random remaining.
const handpickedTopicIds = [
  't-conscap', 't-meditation', 't-source', 't-eft', 't-networkstates',
  't-charter-cities', 't-abilities', 't-bitcoin', 't-soundheal',
  't-permaculture', 't-remote-view', 't-defi', 't-etiquette',
  't-homeschooling', 't-design', 't-leadership', 't-akashic',
  't-tax-sov', 't-netschools', 't-ai-agent-law'
];
const handpickedTopics = handpickedTopicIds
  .map(id => topicById.get(id))
  .filter(Boolean);
const remainingTopics = shuffle(topics.filter(t => !handpickedTopicIds.includes(t.id)), 7);
const shelfTopicsAll = handpickedTopics.concat(remainingTopics).slice(0, 22);

const topicCards = shelfTopicsAll.map(t =>
  card({
    eyebrow: pillarLabelFor(t),
    title: t.label,
    meta: t.desc,
    href: topicUrl(t),
  })
);

// --- Shelf 2: Books ---------------------------------------------------------
const pickedBooks = books.filter(b => Array.isArray(b.picked_in) && b.picked_in.length);
const shelfBooks = shuffle(pickedBooks, 13).slice(0, 22);

const bookCards = shelfBooks.map(b => {
  let authorName = '';
  if (b.author_is_person_ref && peopleById.has(b.author)) {
    authorName = peopleById.get(b.author).name;
  } else if (typeof b.author === 'string') {
    authorName = b.author;
  }
  const slug = b.id.replace(/^b-/, '');
  return card({
    eyebrow: authorName ? `By ${authorName}` : 'FRQNCY pick',
    title: b.title,
    meta: b.bio,
    href: `/books/${slug}/`,
  });
});

// --- Shelf 3: Films ---------------------------------------------------------
// Heuristic: anything in media whose bio mentions film/movie/documentary, plus
// any explicitly tagged. Skip channels and shows; surface long-form pieces only.
const filmKeywords = ['film', 'movie', 'documentary', 'feature', 'docuseries'];
const films = media.filter(m => {
  const bio = (m.bio || '').toLowerCase();
  return filmKeywords.some(k => bio.includes(k));
});
const shelfFilms = shuffle(films, 21).slice(0, 18);

const filmCards = shelfFilms.map(m => {
  let creatorName = '';
  if (m.creator_is_person_ref && peopleById.has(m.creator)) {
    creatorName = peopleById.get(m.creator).name;
  } else if (typeof m.creator === 'string' && m.creator) {
    creatorName = m.creator;
  }
  // generate.js: mediaSlug = m.id.replace(/^m-/, '')
  const slug = m.id.replace(/^m-/, '');
  return card({
    eyebrow: creatorName || 'Film',
    title: m.name,
    meta: m.bio,
    href: `/media/${slug}/`,
  });
});

// --- Shelf 4: Places --------------------------------------------------------
const shelfPlaces = shuffle(places, 31);
const placeCards = shelfPlaces.map(pl => {
  const slug = pl.id.replace(/^pl-/, '');
  return card({
    eyebrow: pl.location || 'Place',
    title: pl.name,
    meta: pl.bio,
    href: `/places/${slug}/`,
  });
});

// --- Shelf 5: Watch (videos) ------------------------------------------------
// videos.json is keyed by topic. Pick one or two from each topic that has any,
// up to ~22 cards.
const allVideos = [];
for (const [topicId, vids] of Object.entries(videosObj)) {
  if (!Array.isArray(vids)) continue;
  const t = topicById.get(topicId);
  if (!t) continue;
  for (const v of vids) {
    if (!v || !v.youtube_id) continue;
    allVideos.push({ topic: t, v });
  }
}
const shelfVideos = shuffle(allVideos, 41).slice(0, 22);
const videoCards = shelfVideos.map(({ topic, v }) =>
  card({
    eyebrow: topic.label,
    title: v.title,
    meta: v.channel ? `${v.channel}${v.duration ? ' · ' + v.duration : ''}` : (v.desc || ''),
    href: `/v2/watch/index.html#${encodeURIComponent(v.youtube_id)}`,
  })
);

// --- Assemble all shelves ---------------------------------------------------
const shelves = [
  shelf({ tag: 'Topics', all: '/v2/explore.html', cards: topicCards, speed: 110 }),
  shelf({ tag: 'Books', all: '/books/', cards: bookCards, speed: 120 }),
  shelf({ tag: 'Films', all: '/media/', cards: filmCards, speed: 100 }),
  shelf({ tag: 'Places', all: '/places/', cards: placeCards, speed: 90 }),
  shelf({ tag: 'Watch', all: '/v2/watch/index.html', cards: videoCards, speed: 130 }),
];

const generatedBlock = shelves.join('\n');

// --- Inject into index.html -------------------------------------------------
const HOMEPAGE = path.join(ROOT, 'index.html');
const homepage = fs.readFileSync(HOMEPAGE, 'utf8');

const MARK_START = '<!-- ▼▼ FRQNCY_MARQUEE_SHELVES ▼▼ -->';
const MARK_END = '<!-- ▲▲ FRQNCY_MARQUEE_SHELVES ▲▲ -->';

const startIdx = homepage.indexOf(MARK_START);
const endIdx = homepage.indexOf(MARK_END);
if (startIdx < 0 || endIdx < 0 || endIdx < startIdx) {
  console.error('Could not find marquee markers in index.html. Check that the section exists.');
  process.exit(1);
}

const before = homepage.slice(0, startIdx + MARK_START.length);
const after = homepage.slice(endIdx);
const updated = before + '\n' + generatedBlock + '\n    ' + after;

const isCheck = process.argv.includes('--check');
if (isCheck) {
  if (homepage === updated) {
    console.log('✓ Homepage marquees are in sync.');
    process.exit(0);
  } else {
    console.error('✗ Homepage marquees are stale. Run: node scripts/build-homepage-marquees.mjs');
    process.exit(1);
  }
}

fs.writeFileSync(HOMEPAGE, updated, 'utf8');

const counts = {
  topics: topicCards.length,
  books: bookCards.length,
  films: filmCards.length,
  places: placeCards.length,
  videos: videoCards.length,
};
console.log('✓ Homepage marquees rebuilt.');
console.log(`  Topics: ${counts.topics} · Books: ${counts.books} · Films: ${counts.films} · Places: ${counts.places} · Watch: ${counts.videos}`);
