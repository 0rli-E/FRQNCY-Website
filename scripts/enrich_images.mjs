#!/usr/bin/env node
/**
 * FRQNCY · Image enrichment for books and people.
 *
 * Books — fetches cover images from Open Library:
 *   1. Search OL by title + author → take the top work's `cover_id` or `cover_edition_key`
 *   2. Build URL: https://covers.openlibrary.org/b/id/<coverId>-L.jpg
 *   3. Verify the URL returns a real image (not the 1x1 "no cover" placeholder)
 *
 * People — fetches portraits from Open Library author records:
 *   1. Search /search/authors.json by name → take top hit
 *   2. Fetch /authors/<key>.json → extract photos[0]
 *   3. Build URL: https://covers.openlibrary.org/a/id/<photoId>-L.jpg
 *
 * No Wikipedia. Open Library covers API is designed for hot-linking (no rate
 * limit, no auth) so we store the URL on the bed entry directly rather than
 * downloading.
 *
 * Usage:
 *   node scripts/enrich_images.mjs                       # both, default 25 each
 *   node scripts/enrich_images.mjs --type books --all    # all books missing image
 *   node scripts/enrich_images.mjs --type people --all
 *   node scripts/enrich_images.mjs --apply               # writes to bed JSONs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const limitIdx = args.indexOf('--limit');
const LIMIT = args.includes('--all') ? Infinity : (limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : 25);
const typeIdx = args.indexOf('--type');
const TYPE = typeIdx !== -1 ? args[typeIdx + 1] : 'both';   // 'books' | 'people' | 'both'
const APPLY = args.includes('--apply');
const TIMEOUT_MS = 10000;
const UA = 'FRQNCY-image-enrichment/0.1 (+https://frqncy.network)';

const booksPath = path.join(ROOT, 'books.json');
const peoplePath = path.join(ROOT, 'people.json');
const booksData = JSON.parse(fs.readFileSync(booksPath, 'utf8'));
const peopleData = JSON.parse(fs.readFileSync(peoplePath, 'utf8'));
const peopleById = new Map(peopleData.people.map(p => [p.id, p]));

function authorDisplay(book) {
  if (book.author_is_person_ref === true && typeof book.author === 'string') {
    return peopleById.get(book.author)?.name || '';
  }
  return typeof book.author === 'string' ? book.author : '';
}

async function safeFetch(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, { redirect: 'follow', signal: ctrl.signal, headers: { 'User-Agent': UA } });
    clearTimeout(t);
    return r;
  } catch { clearTimeout(t); return null; }
}

async function safeJSON(url) {
  const r = await safeFetch(url);
  if (!r || !r.ok) return null;
  try { return await r.json(); } catch { return null; }
}

// Open Library covers redirect to a CDN; content-length is missing from the
// final response. Stream the body and check actual size + content type.
// "No cover" responds with a tiny 1x1 placeholder (~800 bytes); real covers
// are typically 20-200 KB.
async function verifyCover(url) {
  const r = await safeFetch(url);
  if (!r || !r.ok) return false;
  const ct = r.headers.get('content-type') || '';
  if (!/^image\//i.test(ct)) return false;
  const buf = await r.arrayBuffer();
  return buf.byteLength > 2000;
}

// ───────────────────────── books ─────────────────────────
async function findBookCover(book) {
  const author = authorDisplay(book);
  const params = `title=${encodeURIComponent(book.title)}${author ? `&author=${encodeURIComponent(author)}` : ''}&limit=3`;
  const data = await safeJSON(`https://openlibrary.org/search.json?${params}`);
  if (!data?.docs?.length) return null;
  // Prefer docs that have a cover_i or cover_edition_key
  for (const doc of data.docs) {
    if (doc.cover_i) {
      const url = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
      if (await verifyCover(url)) return { url, source: `https://openlibrary.org${doc.key}` };
    }
    if (doc.cover_edition_key) {
      const url = `https://covers.openlibrary.org/b/olid/${doc.cover_edition_key}-L.jpg`;
      if (await verifyCover(url)) return { url, source: `https://openlibrary.org${doc.key}` };
    }
  }
  return null;
}

// ───────────────────────── people ─────────────────────────
async function findPersonPortrait(person) {
  const search = await safeJSON(`https://openlibrary.org/search/authors.json?q=${encodeURIComponent(person.name)}&limit=3`);
  if (!search?.docs?.length) return null;
  // Pick doc with most works (likely the right author)
  const doc = [...search.docs].sort((a, b) => (b.work_count || 0) - (a.work_count || 0))[0];
  if (!doc?.key) return null;
  const author = await safeJSON(`https://openlibrary.org/authors/${doc.key}.json`);
  const photos = author?.photos || [];
  for (const id of photos) {
    if (id < 0) continue;       // -1 = no photo placeholder
    const url = `https://covers.openlibrary.org/a/id/${id}-L.jpg`;
    if (await verifyCover(url)) return { url, source: `https://openlibrary.org/authors/${doc.key}` };
  }
  return null;
}

// ───────────────────────── run ─────────────────────────
const bookTargets = (TYPE === 'both' || TYPE === 'books')
  ? booksData.books.filter(b => !b.image).slice(0, LIMIT)
  : [];
const peopleTargets = (TYPE === 'both' || TYPE === 'people')
  ? peopleData.people.filter(p => !p.image).slice(0, LIMIT)
  : [];

console.error(`Image enrichment: ${bookTargets.length} books · ${peopleTargets.length} people\n`);

const bookResults = [];
for (const [i, b] of bookTargets.entries()) {
  process.stderr.write(`  books [${i + 1}/${bookTargets.length}] ${b.title.slice(0, 50).padEnd(50)} `);
  const r = await findBookCover(b);
  process.stderr.write(`${r ? '✓' : '·'}\n`);
  if (r) bookResults.push({ id: b.id, title: b.title, image: r.url, image_source: r.source });
  await new Promise(res => setTimeout(res, 200));
}

const peopleResults = [];
for (const [i, p] of peopleTargets.entries()) {
  process.stderr.write(`  people [${i + 1}/${peopleTargets.length}] ${p.name.slice(0, 50).padEnd(50)} `);
  const r = await findPersonPortrait(p);
  process.stderr.write(`${r ? '✓' : '·'}\n`);
  if (r) peopleResults.push({ id: p.id, name: p.name, image: r.url, image_source: r.source });
  await new Promise(res => setTimeout(res, 200));
}

// ───────────────────────── apply or queue ─────────────────────────
const date = new Date().toISOString().slice(0, 10);
const sidecar = path.join(ROOT, 'audits', 'beds', 'runs', `${date}-images.json`);
fs.mkdirSync(path.dirname(sidecar), { recursive: true });
fs.writeFileSync(sidecar, JSON.stringify({ books: bookResults, people: peopleResults }, null, 2));

if (APPLY) {
  for (const r of bookResults) {
    const b = booksData.books.find(b => b.id === r.id);
    if (b) { b.image = r.image; b.image_source = r.image_source; }
  }
  for (const r of peopleResults) {
    const p = peopleData.people.find(p => p.id === r.id);
    if (p) { p.image = r.image; p.image_source = r.image_source; }
  }
  fs.writeFileSync(booksPath, JSON.stringify(booksData, null, 2) + '\n');
  fs.writeFileSync(peoplePath, JSON.stringify(peopleData, null, 2) + '\n');
  console.log(`\nWrote ${bookResults.length} book covers + ${peopleResults.length} person portraits to beds.`);
} else {
  console.log(`\nFound ${bookResults.length} book covers + ${peopleResults.length} person portraits.`);
  console.log(`Sidecar: ${path.relative(ROOT, sidecar)}`);
  console.log(`Apply with: node scripts/enrich_images.mjs --apply (re-run with --apply to persist).`);
}
