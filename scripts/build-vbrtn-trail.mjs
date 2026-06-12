/**
 * build-vbrtn-trail.mjs
 *
 * Pre-joins the FRQNCY content + commerce surfaces into one compact file the
 * VBRTN companion reads to hand the user "one of each" — a practice, a book, a
 * piece of music, an aligned product, a course — routed by their dominant
 * desire. Deterministic and traceable (cause doc: "the user can always ask
 * why this?"). Keeps the heavy JSON (resources.json ~675KB) off the page.
 *
 * Run from repo root:  node scripts/build-vbrtn-trail.mjs
 * Output:              my-frqncy/vbrtn/trail-data.json
 *
 * Re-run whenever search.json / resources.json / music.json / courses.json /
 * aligned-goods.json change.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => JSON.parse(readFileSync(join(ROOT, f), 'utf8'));

const search   = read('search.json');        // topics (the spine)
const resources = read('resources.json');     // books, people, media…
const music    = read('music.json').music || [];
const courses  = read('courses.json');
const aligned  = read('aligned-goods.json');

// ── The curated nine (mirrors assets/frqncy-practice.js) ──────────
const PRACTICES = [
  { slug:'meditation',        label:'Meditation',        framing:'sit, breathe, notice. the original technology.',          topicSlug:'meditation',  defaultDurationMinutes:15 },
  { slug:'breathwork',        label:'Breathwork',        framing:'the body as instrument. directed breath shifts state.',   topicSlug:'breathwork',  defaultDurationMinutes:10 },
  { slug:'journaling',        label:'Journaling',        framing:'writing as listening. the page hears what the mind cannot.', topicSlug:'journaling', defaultDurationMinutes:15 },
  { slug:'study',             label:'Study session',     framing:'sustained attention on a single text. the slow read.',    topicSlug:null,          defaultDurationMinutes:45 },
  { slug:'prayer',            label:'Prayer',            framing:'speaking toward what is greater than the self.',          topicSlug:null,          defaultDurationMinutes:10 },
  { slug:'contemplation',     label:'Contemplation',     framing:'staying with a question until it dissolves.',             topicSlug:null,          defaultDurationMinutes:20 },
  { slug:'walking-meditation',label:'Walking meditation',framing:'each step as practice. movement without arrival.',         topicSlug:null,          defaultDurationMinutes:25 },
  { slug:'fasting',           label:'Fasting',           framing:'the chosen empty. clarity that hunger reveals.',          topicSlug:null,          defaultDurationMinutes:60 },
  { slug:'sun-gazing',        label:'Sun gazing',        framing:'the morning sun, witnessed. ancient and disputed. brief.', topicSlug:null,         defaultDurationMinutes:5 },
];

// ── desire → keyword bag (matched against slug + label + desc) ────
// The 12 intake dominantDesire values. Keywords are substrings; slug/label
// hits weigh more than desc hits.
const DESIRE_KEYWORDS = {
  freedom:    ['freedom','sovereign','liberat','autonom','minimal','decentral','independ','web3','self-custody'],
  peace:      ['peace','calm','still','meditat','mental-health','presence','rest','sleep','somatic'],
  purpose:    ['purpose','meaning','soul','source','oneness','calling','dharma','vision','akashic','human design','gene'],
  love:       ['love','relationship','connect','community','heart','nonviolent','compassion','oneness','dialogue'],
  health:     ['health','nutrition','movement','sleep','body','heal','detox','somatic','vital','yoga','breathwork','fermentation','plant medicine'],
  time:       ['time','presence','minimal','focus','leisure','rest','systems-thinking','natural-cycles'],
  money:      ['money','wealth','abund','finance','capital','crypto','defi','invest','prosper','business','economy'],
  creativity: ['creat','art','music','story','poetry','design','express','play','photo','film','dance','theater','make'],
  growth:     ['growth','learn','develop','evolv','master','psychology','education','emergence','wisdom','neuroscience'],
  impact:     ['impact','service','contribut','regenerat','social','movement','governance','enterprise','climate','biodiversity','sustainab'],
  adventure:  ['adventure','explore','outdoor','sport','travel','play','festival','gaming','games','esports'],
  stability:  ['stabil','ground','secur','steady','home','sustainab','minimal','governance','sleep','permac'],
};

function scoreTopic(topic, keywords) {
  const slug  = (topic.slug  || '').toLowerCase();
  const label = (topic.label || '').toLowerCase();
  const desc  = (topic.desc  || '').toLowerCase();
  let score = 0;
  for (const k of keywords) {
    if (slug.includes(k) || label.includes(k)) score += 3;
    else if (desc.includes(k)) score += 1;
  }
  return score;
}

// desire → ranked topic slugs (top 8 with any signal)
const desireMap = {};
for (const [desire, keywords] of Object.entries(DESIRE_KEYWORDS)) {
  desireMap[desire] = search
    .map((t) => ({ slug: t.slug, score: scoreTopic(t, keywords) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((x) => x.slug);
}

// ── Per-topic content index ───────────────────────────────────────
const cap = (n) => (s, x) => (s.length < n ? (s.push(x), s) : s);

const topics = {};
for (const t of search) {
  topics[t.slug] = {
    label: t.label,
    desc: (t.desc || '').slice(0, 240),
    url: t.url || ('/' + t.slug + '/'),
    books: [],
    music: [],
    products: [],
    courses: [],
  };
}

// Books (and a couple of media-films) from resources.json, joined on topicSlug
for (const r of resources) {
  const bucket = topics[r.topicSlug];
  if (!bucket) continue;
  if (r.type === 'book' && bucket.books.length < 4) {
    bucket.books.push({ name: r.name, url: r.url || r.external || '#', external: !!r.external && !r.url });
  }
}

// Music from music.json, joined on appears_in (t-<slug>)
for (const m of music) {
  for (const tid of (m.appears_in || [])) {
    const slug = tid.replace(/^t-/, '');
    const bucket = topics[slug];
    if (bucket && bucket.music.length < 3) {
      bucket.music.push({ title: m.title, artist: m.artist, url: m.url || '#' });
    }
  }
}

// Products from aligned-goods.json, joined on topicSlugs[]
for (const g of aligned) {
  const v = Array.isArray(g.vendor) && g.vendor[0] ? g.vendor[0] : null;
  const url = (v && (v.affiliate || v.url)) || ('/aligned/' + (g.category || '') + '/');
  for (const slug of (g.topicSlugs || [])) {
    const bucket = topics[slug];
    if (bucket && bucket.products.length < 3) {
      bucket.products.push({ name: g.name, desc: (g.desc || '').slice(0, 140), url, tier: g.tier || 'aligned', external: !!(v && (v.affiliate || v.url)) });
    }
  }
}

// Courses from courses.json, joined on topics[] (t-<slug>)
for (const c of courses) {
  for (const tid of (c.topics || [])) {
    const slug = tid.replace(/^t-/, '');
    const bucket = topics[slug];
    if (bucket && bucket.courses.length < 2) {
      bucket.courses.push({ title: c.title, url: '/courses/' + c.slug + '/', free: !c.pricing || c.pricing.model !== 'paid' });
    }
  }
}

// Drop empty topics from the index (keep the file lean) — but always keep any
// topic referenced by desireMap so routing never dead-ends.
const referenced = new Set(Object.values(desireMap).flat());
const leanTopics = {};
for (const [slug, t] of Object.entries(topics)) {
  const hasContent = t.books.length || t.music.length || t.products.length || t.courses.length;
  if (hasContent || referenced.has(slug)) leanTopics[slug] = t;
}

const out = {
  _note: 'Generated by scripts/build-vbrtn-trail.mjs — do not edit by hand.',
  practices: PRACTICES,
  desireMap,
  topics: leanTopics,
};

const outPath = 'my-frqncy/vbrtn/trail-data.json';
writeFileSync(join(ROOT, outPath), JSON.stringify(out));
const sizeKB = (JSON.stringify(out).length / 1024).toFixed(0);
const counts = Object.values(leanTopics).reduce(
  (a, t) => ({ b: a.b + t.books.length, m: a.m + t.music.length, p: a.p + t.products.length, c: a.c + t.courses.length }),
  { b: 0, m: 0, p: 0, c: 0 }
);
console.log(`Wrote ${outPath} — ${sizeKB}KB`);
console.log(`Topics in index: ${Object.keys(leanTopics).length} / ${search.length}`);
console.log(`Joined: ${counts.b} books, ${counts.m} music, ${counts.p} products, ${counts.c} courses`);
console.log('desireMap sample — money:', desireMap.money.join(', '));
console.log('desireMap sample — peace:', desireMap.peace.join(', '));
console.log('desireMap sample — creativity:', desireMap.creativity.join(', '));
