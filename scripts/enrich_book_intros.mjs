#!/usr/bin/env node
/**
 * FRQNCY · Book intro + quote enrichment queue.
 *
 * For every book flagged R2-BIO-STUB or R2-PAGE-STUB by qa_beds.mjs, attempt
 * to gather enrichment material from non-Wikipedia sources. Wikipedia is
 * explicitly excluded per editorial standards.
 *
 * Source order (priority):
 *   1. The book's own canonical URL (b.url) — usually publisher / author site
 *      → extract og:description, meta description, first long <p>
 *   2. Open Library Books API — open data, includes excerpts and publishers
 *      → https://openlibrary.org/search.json?title=...&author=...
 *   3. Internet Archive search — for online PDFs
 *      → https://archive.org/advancedsearch.php?q=...&output=json
 *   4. Amazon search URL — queued for manual click (auto-scrape gets blocked)
 *
 * Output: a markdown queue at audits/beds/runs/<date>-book-enrichment-queue.md
 * with one row per book containing the candidate intro + source links for the
 * editor (or a follow-up LLM pass) to choose from.
 *
 * Usage:
 *   node scripts/enrich_book_intros.mjs                 # default — first 25
 *   node scripts/enrich_book_intros.mjs --limit 50
 *   node scripts/enrich_book_intros.mjs --bed-id b-foo  # single book
 *   node scripts/enrich_book_intros.mjs --all           # all stub books
 *   node scripts/enrich_book_intros.mjs --apply <json>  # write curated intros to books.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const limitIdx = args.indexOf('--limit');
const LIMIT = args.includes('--all') ? Infinity : (limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : 25);
const idIdx = args.indexOf('--bed-id');
const ONLY_ID = idIdx !== -1 ? args[idIdx + 1] : null;
const applyIdx = args.indexOf('--apply');
const APPLY_FILE = applyIdx !== -1 ? args[applyIdx + 1] : null;
const TIMEOUT_MS = 8000;
const UA = 'FRQNCY-enrichment/0.1 (+https://frqncy.network)';
const PAGE_FLOOR = 120;
const BIO_FLOOR = 80;

// ───────────────────────── apply mode ─────────────────────────
if (APPLY_FILE) {
  const approved = JSON.parse(fs.readFileSync(path.resolve(APPLY_FILE), 'utf8'));
  const booksPath = path.join(ROOT, 'books.json');
  const data = JSON.parse(fs.readFileSync(booksPath, 'utf8'));
  let written = 0, skipped = 0;
  for (const entry of approved) {
    if (!entry.id || !entry.intro || !entry.intro.trim()) { skipped++; continue; }
    const book = data.books.find(b => b.id === entry.id);
    if (!book) { console.warn(`skip: ${entry.id} not in books.json`); skipped++; continue; }
    book.intro = entry.intro.trim();
    if (entry.intro_source) book.intro_source = entry.intro_source;
    written++;
  }
  fs.writeFileSync(booksPath, JSON.stringify(data, null, 2) + '\n');
  console.log(`Wrote ${written} intro field${written === 1 ? '' : 's'} to books.json (${skipped} skipped)`);
  process.exit(0);
}

const books = JSON.parse(fs.readFileSync(path.join(ROOT, 'books.json'), 'utf8'));
const people = JSON.parse(fs.readFileSync(path.join(ROOT, 'people.json'), 'utf8'));
const peopleById = new Map(people.people.map(p => [p.id, p]));
function authorDisplay(book) {
  if (book.author_is_person_ref === true) {
    const refs = Array.isArray(book.author) ? book.author : [book.author];
    return refs.map(id => peopleById.get(id)?.name).filter(Boolean).join(' & ');
  }
  return typeof book.author === 'string' ? book.author : '';
}

// ───────────────────────── targets ─────────────────────────
function bodyWords(slug) {
  const p = path.join(ROOT, 'books', slug, 'index.html');
  if (!fs.existsSync(p)) return null;
  const t = fs.readFileSync(p, 'utf8');
  const m = t.match(/<body[\s\S]*?<\/body>/i);
  if (!m) return 0;
  return m[0].replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length;
}

const targets = books.books.filter(b => {
  if (ONLY_ID) return b.id === ONLY_ID;
  if (!b.intro) return true;
  const slug = (b.id || '').replace(/^b-/, '');
  const words = bodyWords(slug);
  return (b.bio?.length ?? 0) < BIO_FLOOR || (words !== null && words < PAGE_FLOOR);
}).slice(0, LIMIT);

console.error(`Enriching ${targets.length} stub book${targets.length === 1 ? '' : 's'}…\n`);

// ───────────────────────── http helper ─────────────────────────
async function safeFetch(url, opts = {}) {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    const res = await fetch(url, { redirect: 'follow', signal: ctrl.signal, headers: { 'User-Agent': UA, ...(opts.headers || {}) } });
    clearTimeout(timer);
    if (!res.ok) return { ok: false, status: res.status };
    return { ok: true, status: res.status, text: await res.text(), contentType: res.headers.get('content-type') || '' };
  } catch (e) {
    return { ok: false, error: String(e.message || e) };
  }
}

async function safeJSON(url) {
  const r = await safeFetch(url, { headers: { Accept: 'application/json' } });
  if (!r.ok) return { ok: false, error: r.error || `${r.status}` };
  try { return { ok: true, data: JSON.parse(r.text) }; } catch { return { ok: false, error: 'parse' }; }
}

// ───────────────────────── source 1: canonical URL ─────────────────────────
function extractOgDescription(html) {
  const og = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
  if (og) return og[1].trim();
  const md = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  if (md) return md[1].trim();
  // Fallback: longest <p> in first 50KB
  const slice = html.slice(0, 50000);
  const ps = [...slice.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map(m => m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()).filter(p => p.length > 80 && p.length < 800);
  ps.sort((a, b) => b.length - a.length);
  return ps[0] || '';
}

async function fromCanonical(book) {
  if (!book.url) return { source: 'canonical', text: '', note: 'no url' };
  const r = await safeFetch(book.url);
  if (!r.ok) return { source: 'canonical', text: '', note: `fetch ${r.error || r.status}` };
  if (!/text\/html/i.test(r.contentType) && !/^text\//i.test(r.contentType) && r.contentType) return { source: 'canonical', text: '', note: `content-type ${r.contentType}` };
  return { source: 'canonical', text: extractOgDescription(r.text), url: book.url };
}

// ───────────────────────── source 2: Open Library ─────────────────────────
async function fromOpenLibrary(book) {
  const author = authorDisplay(book);
  const q = `title=${encodeURIComponent(book.title)}${author ? `&author=${encodeURIComponent(author.split('&')[0].split(',')[0].split(' (')[0].trim())}` : ''}&limit=3`;
  const search = await safeJSON(`https://openlibrary.org/search.json?${q}`);
  if (!search.ok || !search.data.docs?.length) return { source: 'openlibrary', text: '', note: search.error || 'no results' };
  const top = search.data.docs[0];
  const workKey = top.key;          // e.g. "/works/OL45804W"
  const editionId = top.cover_edition_key || top.edition_key?.[0];
  // Fetch the work for description
  const work = await safeJSON(`https://openlibrary.org${workKey}.json`);
  let text = '';
  if (work.ok && work.data?.description) {
    text = typeof work.data.description === 'string' ? work.data.description : (work.data.description.value || '');
  }
  // Strip Wikipedia citation noise that OL sometimes includes
  text = text.replace(/\(\[source\]\[\d+\]\)/g, '').replace(/\[Wikipedia\]\([^)]+\)/gi, '').replace(/^\s*-+\s*$/gm, '').trim();
  const url = `https://openlibrary.org${workKey}`;
  return { source: 'openlibrary', text, url, edition: editionId, first_published: top.first_publish_year };
}

// ───────────────────────── source 3: Internet Archive ─────────────────────────
async function fromInternetArchive(book) {
  const author = authorDisplay(book);
  const q = `title:("${book.title.replace(/"/g, '')}")${author ? ` AND creator:("${author.split('&')[0].split(',')[0].split(' (')[0].trim().replace(/"/g, '')}")` : ''} AND mediatype:texts`;
  const r = await safeJSON(`https://archive.org/advancedsearch.php?q=${encodeURIComponent(q)}&fl[]=identifier&fl[]=title&fl[]=creator&fl[]=description&fl[]=format&rows=3&output=json`);
  if (!r.ok || !r.data?.response?.docs?.length) return { source: 'archive_org', text: '', note: r.error || 'no results' };
  const top = r.data.response.docs[0];
  const desc = Array.isArray(top.description) ? top.description.join(' ') : (top.description || '');
  const url = `https://archive.org/details/${top.identifier}`;
  return { source: 'archive_org', text: String(desc).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(), url, identifier: top.identifier };
}

// ───────────────────────── source 4: Amazon search URL (queued, not scraped) ─────────────────────────
function amazonSearchUrl(book) {
  const author = authorDisplay(book);
  const q = `${book.title} ${author}`.trim();
  return `https://www.amazon.com/s?k=${encodeURIComponent(q)}&i=stripbooks`;
}

// ───────────────────────── per-book pipeline ─────────────────────────
async function enrich(book) {
  const slug = (book.id || '').replace(/^b-/, '');
  const [c, ol, ia] = await Promise.all([
    fromCanonical(book),
    fromOpenLibrary(book),
    fromInternetArchive(book),
  ]);
  return {
    id: book.id,
    slug,
    title: book.title,
    author: authorDisplay(book) || (typeof book.author === 'string' ? book.author : ''),
    current_bio: book.bio || '',
    sources: [c, ol, ia].filter(s => s.text || s.url),
    amazon_search: amazonSearchUrl(book),
  };
}

// Process serially with a small delay so we don't hammer any single host
const results = [];
for (const [i, book] of targets.entries()) {
  process.stderr.write(`  [${i + 1}/${targets.length}] ${book.title.slice(0, 60).padEnd(60)} `);
  const r = await enrich(book);
  const got = r.sources.filter(s => s.text).length;
  process.stderr.write(`✓ ${got}/3 sources\n`);
  results.push(r);
  await new Promise(res => setTimeout(res, 250));
}

// ───────────────────────── render queue ─────────────────────────
const date = new Date().toISOString().slice(0, 10);
const lines = [];
lines.push(`# Book intro + quote enrichment queue — ${date}`);
lines.push('');
lines.push(`**Books processed:** ${results.length}`);
lines.push(`**Sources:** canonical url, openlibrary.org, archive.org, amazon (search url)`);
lines.push(`**Wikipedia:** explicitly excluded.`);
lines.push('');
lines.push('For each book the script gathered candidate descriptions from up to three open sources. Pick the strongest, lightly edit for FRQNCY voice, and paste into a new `intro` field on the book entry. The `quote` field needs a separate manual pass (publisher pull-quote, author site, or the book itself).');
lines.push('');

for (const r of results) {
  lines.push(`### \`${r.id}\` — ${r.title}`);
  lines.push('');
  lines.push(`**Author:** ${r.author}`);
  lines.push(`**Current bio (${r.current_bio.length} chars):** ${r.current_bio || '_(empty)_'}`);
  lines.push('');
  if (!r.sources.length) {
    lines.push('_No source returned material. Manual sourcing needed._');
    lines.push('');
  } else {
    for (const s of r.sources) {
      const head = s.url ? `[${s.source}](${s.url})` : `\`${s.source}\``;
      const note = s.note ? ` — _${s.note}_` : '';
      lines.push(`**${head}${note}**`);
      if (s.text) {
        const trimmed = s.text.replace(/\s+/g, ' ').trim();
        const preview = trimmed.length > 1200 ? trimmed.slice(0, 1200) + '…' : trimmed;
        lines.push('');
        lines.push(`> ${preview}`);
      }
      lines.push('');
    }
  }
  lines.push(`**Amazon search:** [open](${r.amazon_search})`);
  lines.push('');
  lines.push('---');
  lines.push('');
}

const dest = path.join(ROOT, 'audits', 'beds', 'runs', `${date}-book-enrichment-queue.md`);
const sidecar = path.join(ROOT, 'audits', 'beds', 'runs', `${date}-book-intros.json`);
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, lines.join('\n'), 'utf8');

// JSON sidecar — one entry per book, pre-populated with the longest source as
// the candidate `intro`. Editor reviews, edits, deletes rejected rows, then
// runs `--apply <file>` to write the curated intros to books.json.
const sidecarRows = results
  .filter(r => r.sources.some(s => s.text))
  .map(r => {
    const best = [...r.sources].filter(s => s.text).sort((a, b) => b.text.length - a.text.length)[0];
    return {
      id: r.id,
      title: r.title,
      intro_source: best?.url || best?.source || '',
      intro: (best?.text || '').replace(/\s+/g, ' ').trim(),
    };
  });
fs.writeFileSync(sidecar, JSON.stringify(sidecarRows, null, 2));
process.stderr.write(`\n→ Wrote ${path.relative(ROOT, dest)}\n→ Wrote ${path.relative(ROOT, sidecar)} (apply candidates)\n`);

// Summary
const withMaterial = results.filter(r => r.sources.some(s => s.text));
process.stderr.write(`Coverage: ${withMaterial.length}/${results.length} books got at least one description back.\n`);
