#!/usr/bin/env node
/**
 * BED-AWARE TEST GENERATOR
 * Reads content.json + 4 beds. For selected test topics, merges bed entities
 * with leftover non-bed resources and renders via the existing generate.js template,
 * outputting to ./proposals/test-output/ (does not touch ./v2/).
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DATA    = JSON.parse(fs.readFileSync(path.join(ROOT, 'content.json'), 'utf8'));
const PEOPLE  = JSON.parse(fs.readFileSync(path.join(ROOT, 'proposals/people-draft.json'), 'utf8'));
const BOOKS   = JSON.parse(fs.readFileSync(path.join(ROOT, 'proposals/books-draft.json'),  'utf8'));
const ORGS    = JSON.parse(fs.readFileSync(path.join(ROOT, 'proposals/orgs-draft.json'),   'utf8'));
const MEDIA   = JSON.parse(fs.readFileSync(path.join(ROOT, 'proposals/media-draft.json'),  'utf8'));

const LEFTOVER_TYPES = new Set(['tool', 'course', 'platform', 'app', 'website', 'reference', 'article']);

function peopleToResource(p, topicId) {
  return { type: 'person', title: p.name, url: p.url, desc: p.bio, frqncy_pick: (p.picked_in||[]).includes(topicId) };
}
function bookToResource(b, topicId) {
  const pid = b.author_is_person_ref ? b.author : null;
  const authorName = pid ? ((PEOPLE.people.find(p => p.id === pid)||{}).name || b.author) : b.author;
  const title = authorName ? `${b.title} — ${authorName}` : b.title;
  return { type: 'book', title, url: b.url, desc: b.bio, frqncy_pick: (b.picked_in||[]).includes(topicId) };
}
function orgToResource(o, topicId) {
  return { type: 'org', title: o.name, url: o.url, desc: o.bio, frqncy_pick: (o.picked_in||[]).includes(topicId) };
}
function mediaToResource(m, topicId) {
  return { type: 'media', title: m.name, url: m.url, desc: m.bio, frqncy_pick: (m.picked_in||[]).includes(topicId) };
}

function mergeForTopic(topicId) {
  const merged = [];
  const original = DATA.resources[topicId] || [];
  // Key by url+type so a person and an org at the same URL (Ra Uru Hu + Jovian Archive)
  // can both render — they're separate entities sharing infrastructure.
  const seenKeys = new Set();

  const fixTypos = (u) => (u||'').replace('erinclairehjones', 'erinclairejones');
  const normU = (u) => fixTypos((u||'').replace('https://www.', 'https://').replace(/\/$/, ''));

  for (const r of original) {
    const url = r.url;
    if (r.type === 'person') {
      const p = PEOPLE.people.find(x => normU(x.url) === normU(url) && x.appears_in.includes(topicId));
      const key = `person|${p?.url}`;
      if (p && !seenKeys.has(key)) { merged.push(peopleToResource(p, topicId)); seenKeys.add(key); }
    } else if (r.type === 'book') {
      const b = BOOKS.books.find(x => normU(x.url) === normU(url) && x.appears_in.includes(topicId));
      const key = `book|${b?.url}`;
      if (b && !seenKeys.has(key)) { merged.push(bookToResource(b, topicId)); seenKeys.add(key); }
    } else if (r.type === 'org') {
      const o = ORGS.orgs.find(x => normU(x.url) === normU(url) && x.appears_in.includes(topicId));
      const key = `org|${o?.url}`;
      if (o && !seenKeys.has(key)) { merged.push(orgToResource(o, topicId)); seenKeys.add(key); }
    } else if (r.type === 'media') {
      const m = MEDIA.media.find(x => normU(x.url) === normU(url) && x.appears_in.includes(topicId));
      const key = `media|${m?.url}`;
      if (m && !seenKeys.has(key)) { merged.push(mediaToResource(m, topicId)); seenKeys.add(key); }
    } else if (LEFTOVER_TYPES.has(r.type)) {
      merged.push(r);
    }
  }
  return merged;
}

const TEST_TOPICS = ['meditation', 'breathwork', 'cryptocurrency', 'human-design'];
const slugToTopic = new Map(DATA.topics.map(t => [t.slug, t]));

for (const slug of TEST_TOPICS) {
  const t = slugToTopic.get(slug);
  if (!t) { console.error(`Topic slug "${slug}" not found`); continue; }
  const before = (DATA.resources[t.id]||[]).length;
  DATA.resources[t.id] = mergeForTopic(t.id);
  const after = DATA.resources[t.id].length;
  console.log(`  ${slug}: ${before} → ${after} resources after bed merge`);
}

// Write patched content.json to an absolute tmp path
const tmpContent = path.join(ROOT, '_tmp_content_bed.json');
fs.writeFileSync(tmpContent, JSON.stringify(DATA, null, 2));

// Patch generate.js to read from tmp content + write to proposals/test-output/
const genSrc = fs.readFileSync(path.join(ROOT, 'generate.js'), 'utf8');
const genPatched = genSrc
  .replace(
    "const DATA      = JSON.parse(fs.readFileSync(path.join(ROOT, 'content.json'),   'utf8'));",
    `const DATA      = JSON.parse(fs.readFileSync(path.join(ROOT, '_tmp_content_bed.json'), 'utf8'));`
  )
  .replace(
    "const OUT       = path.join(ROOT, 'v2');",
    `const OUT       = path.join(ROOT, 'proposals/test-output');`
  );

// Write patched generator AT THE ROOT (so its __dirname resolves correctly)
const genTmp = path.join(ROOT, '_tmp_generate_bed.js');
fs.writeFileSync(genTmp, genPatched);

console.log(`\nPatched generator written. Executing...`);
require(genTmp);
