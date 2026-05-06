#!/usr/bin/env node
/**
 * FRQNCY · Second-pass intro + cover enrichment via Google Books API.
 *
 * For books that the Open Library / Goodreads passes couldn't cover, hits
 * the public Google Books API (no auth, generous free quota):
 *   GET https://www.googleapis.com/books/v1/volumes?q=intitle:<t>+inauthor:<a>
 *
 * Returns up to N volumes per query; pick the best title-match. Each volume
 * has `volumeInfo.description` (book intro) and `volumeInfo.imageLinks.thumbnail`
 * (cover URL — already on books.google.com CDN, designed for hot-linking).
 *
 * Wikipedia not used.
 *
 * Usage:
 *   node scripts/enrich_books_google.mjs --limit 25
 *   node scripts/enrich_books_google.mjs --all --apply
 *   node scripts/enrich_books_google.mjs --target intro
 *   node scripts/enrich_books_google.mjs --target cover
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const limitIdx = args.indexOf('--limit');
const LIMIT = args.includes('--all') ? Infinity : (limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : 25);
const targetIdx = args.indexOf('--target');
const TARGET = targetIdx !== -1 ? args[targetIdx + 1] : 'both';   // 'intro' | 'cover' | 'both'
const APPLY = args.includes('--apply');
const TIMEOUT_MS = 10000;
const UA = 'FRQNCY-google-books/0.1 (+https://frqncy.network)';

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

const STOP = new Set(['the','of','a','an','and','or','to','in','on','at','for','with','by','is','are','i','ii','iii','iv','v','&','it','this','that','from','your','our','my']);
function tokens(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 3 && !STOP.has(w));
}
function intersect(a, b) { const set = new Set(a); return b.some(t => set.has(t)); }

async function safeFetch(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, { redirect: 'follow', signal: ctrl.signal, headers: { 'User-Agent': UA } });
    clearTimeout(t);
    return r;
  } catch { clearTimeout(t); return null; }
}

async function searchGoogleBooks(book) {
  const author = authorDisplay(book);
  const q = `intitle:${book.title}${author ? `+inauthor:${author}` : ''}`;
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=5&printType=books&langRestrict=en`;
  const r = await safeFetch(url);
  if (!r || !r.ok) return null;
  let data;
  try { data = await r.json(); } catch { return null; }
  return data?.items || [];
}

function pickBestVolume(items, book) {
  if (!items?.length) return null;
  const titleToks = tokens(book.title);
  // Prefer items whose volumeInfo.title contains our title tokens AND has a description
  const candidates = items
    .map(it => ({
      it,
      titleHits: intersect(titleToks, tokens(it.volumeInfo?.title || '')) ? 1 : 0,
      hasDesc: it.volumeInfo?.description ? 1 : 0,
      hasCover: it.volumeInfo?.imageLinks?.thumbnail ? 1 : 0,
      score: 0,
    }));
  for (const c of candidates) {
    c.score = c.titleHits * 10 + c.hasDesc * 5 + c.hasCover * 2;
  }
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.it || null;
}

function passesIntroGate(text, title) {
  if (!text) return { pass: false, reason: 'empty' };
  if (text.length < 150) return { pass: false, reason: `too short (${text.length})` };
  if (text.length > 1500) return { pass: false, reason: `too long (${text.length})` };
  const titleToks = tokens(title);
  const bodyToks = tokens(text);
  if (titleToks.length && !intersect(titleToks, bodyToks)) return { pass: false, reason: 'title not in body' };
  if (/[Ѐ-ӿ؀-ۿ一-鿿]/.test(text)) return { pass: false, reason: 'non-Latin script' };
  return { pass: true };
}

function cleanIntroHtml(text) {
  // Google Books descriptions sometimes contain inline HTML. Strip it.
  return String(text || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(+c))
    .replace(/\s+/g, ' ')
    .trim();
}

function upgradeCoverUrl(url) {
  // Google Books thumbnails come at zoom=1 (~128px). Upgrade to zoom=0 (full size).
  return String(url || '').replace('&zoom=1', '&zoom=0').replace('&edge=curl', '');
}

// ───────────────────────── targets ─────────────────────────
const targets = booksData.books.filter(b => {
  const needsIntro = !b.intro && (TARGET === 'both' || TARGET === 'intro');
  const needsCover = !b.image && (TARGET === 'both' || TARGET === 'cover');
  return needsIntro || needsCover;
}).slice(0, LIMIT);

console.error(`Google Books second-pass: ${targets.length} book${targets.length === 1 ? '' : 's'} (target=${TARGET})\n`);

const introResults = [];
const coverResults = [];

for (const [i, b] of targets.entries()) {
  process.stderr.write(`  [${i + 1}/${targets.length}] ${b.title.slice(0, 50).padEnd(50)} `);
  const items = await searchGoogleBooks(b);
  const best = pickBestVolume(items, b);
  const flags = [];
  if (best) {
    const info = best.volumeInfo;
    if (!b.intro && (TARGET === 'both' || TARGET === 'intro') && info.description) {
      const intro = cleanIntroHtml(info.description);
      const gate = passesIntroGate(intro, b.title);
      if (gate.pass) {
        introResults.push({ id: b.id, title: b.title, intro, intro_source: info.canonicalVolumeLink || info.previewLink || `https://books.google.com/books?id=${best.id}` });
        flags.push('I✓');
      } else {
        flags.push(`i?(${gate.reason})`);
      }
    }
    if (!b.image && (TARGET === 'both' || TARGET === 'cover') && info.imageLinks?.thumbnail) {
      coverResults.push({ id: b.id, title: b.title, image: upgradeCoverUrl(info.imageLinks.thumbnail), image_source: info.canonicalVolumeLink || `https://books.google.com/books?id=${best.id}` });
      flags.push('C✓');
    }
  }
  if (!flags.length) flags.push('—');
  process.stderr.write(`${flags.join(' ')}\n`);
  await new Promise(res => setTimeout(res, 250));
}

// ───────────────────────── apply or queue ─────────────────────────
const date = new Date().toISOString().slice(0, 10);
const introsPath = path.join(ROOT, 'audits', 'beds', 'runs', `${date}-google-intros.json`);
const coversPath = path.join(ROOT, 'audits', 'beds', 'runs', `${date}-google-covers.json`);
fs.mkdirSync(path.dirname(introsPath), { recursive: true });
fs.writeFileSync(introsPath, JSON.stringify(introResults, null, 2));
fs.writeFileSync(coversPath, JSON.stringify(coverResults, null, 2));

if (APPLY) {
  for (const r of introResults) {
    const b = booksData.books.find(b => b.id === r.id);
    if (b) { b.intro = r.intro; b.intro_source = r.intro_source; }
  }
  for (const r of coverResults) {
    const b = booksData.books.find(b => b.id === r.id);
    if (b) { b.image = r.image; b.image_source = r.image_source; }
  }
  fs.writeFileSync(booksPath, JSON.stringify(booksData, null, 2) + '\n');
  console.log(`\nWrote ${introResults.length} intros + ${coverResults.length} covers to books.json.`);
} else {
  console.log(`\nFound ${introResults.length} intros + ${coverResults.length} covers.`);
  console.log(`Sidecars: ${path.relative(ROOT, introsPath)}, ${path.relative(ROOT, coversPath)}`);
  console.log(`Apply with: --apply (re-run).`);
}
