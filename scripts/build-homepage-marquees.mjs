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

// Read the first content image from a built static page.
// Used to keep the marquee tile picture in lock-step with the page's hero
// art — the user's "use the first pic of the page as picture" rule.
// We skip data:/svg icons and obviously-decorative ones via simple heuristics.
function imageFromPageFile(href) {
  if (!href || typeof href !== 'string') return null;
  // Translate a site path → local file. Strips leading "/", appends index.html
  // if it ends with "/". Anchors (#…) are stripped.
  const clean = href.split('#')[0].split('?')[0].replace(/^\//, '');
  const candidate = clean.endsWith('/') ? clean + 'index.html' : clean;
  const filePath = path.join(ROOT, candidate);
  let html;
  try { html = fs.readFileSync(filePath, 'utf8'); } catch { return null; }
  // Heuristic: prefer hero-poster, then first <img src=...> after <main>/<body>.
  const heroMatch = html.match(/<img[^>]*class="[^"]*hero-poster[^"]*"[^>]*src="([^"]+)"/i)
    || html.match(/<img[^>]*src="([^"]+)"[^>]*class="[^"]*hero-poster[^"]*"/i);
  if (heroMatch) return decodeAmp(heroMatch[1]);
  // Look past the <main> tag (skips header/logo). If no <main>, use full HTML.
  const body = html.split(/<main\b/i)[1] || html;
  const re = /<img\b[^>]*\bsrc="([^"]+)"/gi;
  let m;
  while ((m = re.exec(body))) {
    const url = decodeAmp(m[1]);
    if (!url) continue;
    if (url.startsWith('data:')) continue;
    if (/favicon|logo|icon|sprite/i.test(url)) continue;
    if (url.endsWith('.svg')) continue;
    return url;
  }
  return null;
}

function decodeAmp(s) {
  return String(s || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"');
}

function imageForEntity(entityId) {
  if (typeof entityId !== 'string') return null;
  // Map entity id → built page path (used for first-pic-of-page fallback).
  const pageFor = (id) => {
    if (id.startsWith('b-'))  return `/books/${id.slice(2)}/`;
    if (id.startsWith('p-'))  return `/people/${id.slice(2)}/`;
    if (id.startsWith('pl-')) return `/places/${id.slice(3)}/`;
    if (id.startsWith('m-'))  return `/media/${id.slice(2)}/`;
    return null;
  };
  const fromPage = () => {
    const href = pageFor(entityId);
    return href ? imageFromPageFile(href) : null;
  };

  if (entityId.startsWith('b-')) {
    const b = bookById.get(entityId);
    return b?.image || fromPage();
  }
  if (entityId.startsWith('p-')) {
    const p = peopleById.get(entityId);
    return p?.image || fromPage();
  }
  if (entityId.startsWith('pl-')) {
    const pl = placeById.get(entityId);
    return pl?.image || fromPage();
  }
  if (entityId.startsWith('m-')) {
    const m = mediaById.get(entityId);
    if (!m) return null;
    if (m.image) return m.image;
    const yt = ytIdFromUrl(m.url);
    if (yt) return ytThumb(yt);
    // Use creator photo, then page-image as last resorts.
    if (m.creator_is_person_ref && peopleById.has(m.creator)) {
      const c = peopleById.get(m.creator);
      if (c?.image) return c.image;
    }
    return fromPage();
  }
  return null;
}

// For topics: first try the topic page's own hero poster (the "first pic of
// the page" rule — keeps the marquee visually consistent with what readers
// actually see when they click through). Fall back to walking picked_in then
// appears_in across the beds.
function imageForTopic(topicId) {
  const t = topicById.get(topicId);
  if (t) {
    const slug = t.slug || topicId.replace(/^t-/, '');
    const fromPage = imageFromPageFile(`/${slug}/`);
    if (fromPage) return fromPage;
  }
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
    href: `/watch/index.html#${encodeURIComponent(v.youtube_id)}`,
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

// Topics — pull in a broader set. Each tile uses the topic page's own hero
// art (via imageForTopic), so they read as standalone tiles rather than
// borrowed covers. Six handpicked plus a topped-up shuffle so the marquee
// always has variety even if some are missing pages.
const handpickedTopicIds = [
  't-source','t-meditation','t-networkstates','t-charter-cities','t-abilities','t-conscap',
  't-bitcoin','t-conscious-living','t-flow','t-sound-healing','t-permaculture','t-ai-alignment',
];
const TOPIC_TARGET = 6;
const topicPool = [];
const seenTopicIds = new Set();
for (const id of handpickedTopicIds) {
  if (topicPool.length >= TOPIC_TARGET) break;
  const t = topicById.get(id);
  if (!t) continue;
  const img = imageForTopic(id);
  if (!img) continue;
  seenTopicIds.add(id);
  topicPool.push(card({
    kind: 'topic',
    eyebrow: 'Topic',
    title: t.label,
    image: img,
    href: `/${t.slug || t.id.replace(/^t-/, '')}/`,
  }));
}
// Top up from a shuffled remainder so we always reach the target if possible.
if (topicPool.length < TOPIC_TARGET) {
  const remainder = shuffle(topics.filter(t => !seenTopicIds.has(t.id)), 67);
  for (const t of remainder) {
    if (topicPool.length >= TOPIC_TARGET) break;
    const img = imageForTopic(t.id);
    if (!img) continue;
    topicPool.push(card({
      kind: 'topic',
      eyebrow: 'Topic',
      title: t.label,
      image: img,
      href: `/${t.slug || t.id.replace(/^t-/, '')}/`,
    }));
  }
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
// User request 2026-05-15: the full 28-card band, hand-curated.
// Pulled from live beds; missing items skip silently.
const leadIds = [
  { kind: 'topic',  id: 't-ecovillages' },                       //  1
  { kind: 'person', id: 'p-kevin-trudeau' },                     //  2
  { kind: 'topic',  id: 't-permaculture' },                      //  3
  { kind: 'person', id: 'p-sai-maa' },                           //  4
  { kind: 'topic',  id: 't-crypto',
    imageOverride: '/images/topics/crypto-hero.png' },           //  5
  { kind: 'topic',  id: 't-privacy',
    imageOverride: '/images/topics/privacy-hero.webp' },         //  6
  { kind: 'topic',  id: 't-renewable' },                         //  7
  { kind: 'book',   id: 'b-the-magic-of-thinking-big' },         //  8
  { kind: 'video',  id: 'v-film-sun' },                          //  9
  { kind: 'person', id: 'p-andreas-antonopoulos' },              // 10
  { kind: 'place',  id: 'pl-bali' },                             // 11
  { kind: 'topic',  id: 't-source' },                            // 12
  { kind: 'film',   id: 'm-hidden-secrets-of-money' },           // 13
  { kind: 'book',   id: 'b-fingerprints-of-the-gods' },          // 14
  { kind: 'video',  id: 'v-_nB13VUT' },                          // 15  Bashar
  { kind: 'person', id: 'p-carlo-rovelli' },                     // 16
  { kind: 'place',  id: 'pl-yogaville' },                        // 17
  { kind: 'topic',  id: 't-meditation' },                        // 18
  { kind: 'film',   id: 'm-roger-eberts-reviews' },              // 19
  { kind: 'book',   id: 'b-ask-and-it-is-given' },               // 20
  { kind: 'video',  id: 'v-sacgeo-1' },                          // 21
  { kind: 'person', id: 'p-matt-debenham' },                     // 22
  { kind: 'place',  id: 'pl-sedona' },                           // 23
  { kind: 'topic',  id: 't-networkstates',                       // 24
    imageOverride: 'https://covers.openlibrary.org/b/id/14569476-L.jpg' },
  { kind: 'book',   id: 'b-wishes-fulfilled' },                  // 25
  { kind: 'topic',  id: 't-abilities' },                         // 26
  { kind: 'topic',  id: 't-conscap' },                           // 27
  { kind: 'topic',  id: 't-bitcoin',
    imageOverride: '/images/topics/bitcoin-hero.jpg' },          // 28
];
const leadCards = [];
const leadSeen = new Set();
for (const { kind, id, imageOverride } of leadIds) {
  if (kind === 'topic') {
    const t = topicById.get(id);
    if (!t) continue;
    const img = imageOverride || imageForTopic(id);
    if (!img) continue;
    leadCards.push(card({
      kind: 'topic',
      eyebrow: 'Topic',
      title: t.label,
      image: img,
      href: `/${t.slug || t.id.replace(/^t-/, '')}/`,
    }));
    leadSeen.add(id);
  } else if (kind === 'person') {
    const p = peopleById.get(id);
    if (!p || !p.image) continue;
    leadCards.push(card({
      kind: 'person',
      eyebrow: 'Person',
      title: p.name,
      image: p.image,
      href: `/people/${p.id.replace(/^p-/, '')}/`,
    }));
    leadSeen.add(id);
  } else if (kind === 'book') {
    const b = bookById.get(id);
    if (!b || !b.image) continue;
    let author = '';
    if (b.author_is_person_ref && peopleById.has(b.author)) author = peopleById.get(b.author).name;
    else if (typeof b.author === 'string') author = b.author;
    leadCards.push(card({
      kind: 'book',
      eyebrow: author || 'Book',
      title: b.title,
      image: b.image,
      href: `/books/${b.id.replace(/^b-/, '')}/`,
    }));
    leadSeen.add(id);
  } else if (kind === 'video') {
    // Search videosObj for a video with this id (the id can match v-* form)
    let found = null;
    let topicLabel = '';
    for (const [topicId, vids] of Object.entries(videosObj)) {
      if (!Array.isArray(vids)) continue;
      for (const v of vids) {
        if (v?.id === id || v?.youtube_id === id) {
          found = v;
          const t = topicById.get(topicId);
          if (t) topicLabel = t.label;
          break;
        }
      }
      if (found) break;
    }
    if (!found?.youtube_id) continue;
    leadCards.push(card({
      kind: 'video',
      eyebrow: found.channel || topicLabel || 'Film',
      title: found.title,
      image: ytThumb(found.youtube_id),
      href: `/watch/index.html#${encodeURIComponent(found.youtube_id)}`,
    }));
    leadSeen.add(id);
  } else if (kind === 'place') {
    const pl = placeById.get(id);
    if (!pl || !pl.image) continue;
    leadCards.push(card({
      kind: 'place',
      eyebrow: pl.location || 'Place',
      title: pl.name,
      image: pl.image,
      href: `/places/${pl.id.replace(/^pl-/, '')}/`,
    }));
    leadSeen.add(id);
  } else if (kind === 'film') {
    const mm = mediaById.get(id);
    if (!mm) continue;
    const img = imageForEntity(id);
    if (!img) continue;
    let creator = '';
    if (mm.creator_is_person_ref && peopleById.has(mm.creator)) creator = peopleById.get(mm.creator).name;
    else if (typeof mm.creator === 'string') creator = mm.creator;
    leadCards.push(card({
      kind: 'film',
      eyebrow: creator || 'Film',
      title: mm.name,
      image: img,
      href: `/media/${mm.id.replace(/^m-/, '')}/`,
    }));
    leadSeen.add(id);
  }
}

// De-dupe: drop anything from the shuffled pools that we already pinned in lead.
const leadSlugs = [...leadSeen].map(id => id.replace(/^[pt]-/, ''));
const removeIfLead = (cards) => cards.filter(c => !leadSlugs.some(s => c.includes(`/${s}/`)));

// User request 2026-05-15: curated band only — no shuffled mid-band fill.
// Only the hand-picked lead cards appear in the marquee. The pools above
// are intentionally unused so the band stays exactly the items chosen.
const finalCards = [...leadCards];
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
