#!/usr/bin/env node
/**
 * FRQNCY · Goodreads quote scrape (server-rendered HTML, no JS).
 *
 * For each book missing a quote, find the Goodreads work-quotes page and
 * extract the most-popular quote. Goodreads quotes are wrapped in smart
 * curly quotes (“…”) in the rendered HTML, so a regex over the page text
 * is enough — no DOM parsing needed.
 *
 * Path discovery per book:
 *   1. If `book.image_source` already points at goodreads.com/book/show/<id>,
 *      use that URL.
 *   2. Otherwise search /search?q=<title>+<author> and follow the first
 *      /book/show/... result.
 *   3. From the book page, extract /work/quotes/<workId> and visit it.
 *
 * Output: `audits/beds/runs/<date>-goodreads-quotes.json`. Editor reviews,
 * trims, then runs `enrich_book_quotes.mjs --apply` against the same file.
 *
 * Usage:
 *   node scripts/scrape_goodreads_quotes.mjs --limit 25
 *   node scripts/scrape_goodreads_quotes.mjs --all
 *   node scripts/scrape_goodreads_quotes.mjs --bed-id b-the-secret
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
const TIMEOUT_MS = 12000;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';

const books = JSON.parse(fs.readFileSync(path.join(ROOT, 'books.json'), 'utf8'));
const people = JSON.parse(fs.readFileSync(path.join(ROOT, 'people.json'), 'utf8'));
const peopleById = new Map(people.people.map(p => [p.id, p]));

function authorDisplay(book) {
  if (book.author_is_person_ref === true) {
    const refs = Array.isArray(book.author) ? book.author : [book.author];
    return refs.map(id => peopleById.get(id)?.name).filter(Boolean).join(' ');
  }
  return typeof book.author === 'string' ? book.author : '';
}

async function safeText(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, { redirect: 'follow', signal: ctrl.signal, headers: { 'User-Agent': UA, 'Accept': 'text/html,*/*', 'Accept-Language': 'en-US,en;q=0.9' } });
    clearTimeout(t);
    if (!r.ok) return null;
    return await r.text();
  } catch { clearTimeout(t); return null; }
}

async function findGoodreadsBookUrl(book) {
  if (book.image_source?.includes('goodreads.com/book/show/')) {
    return book.image_source.split('?')[0];
  }
  const author = authorDisplay(book);
  const q = encodeURIComponent(`${book.title} ${author}`.trim());
  const html = await safeText(`https://www.goodreads.com/search?q=${q}`);
  if (!html) return null;
  // Skip "summary"/"study guide"/"key takeaways" companion books — pick the first non-summary result
  const matches = [...html.matchAll(/href="(\/book\/show\/[^"?]+)/g)].map(m => m[1]);
  const real = matches.find(url => !/summary|study[-_]guide|key[-_]takeaways|cliff[-_]?notes|sparknotes|workbook/i.test(url));
  const pick = real || matches[0];
  return pick ? `https://www.goodreads.com${pick}` : null;
}

async function findWorkQuotesUrl(bookUrl) {
  const html = await safeText(bookUrl);
  if (!html) return null;
  const m = html.match(/\/work\/quotes\/(\d+)/);
  if (!m) return null;
  return `https://www.goodreads.com/work/quotes/${m[1]}`;
}

function pickBestQuote(html, book) {
  // Smart-quote pattern: “...”
  const matches = [...html.matchAll(/“([^“”]{60,260})”/g)].map(m => m[1].trim());
  if (!matches.length) return null;
  // Filter: must contain English-y stop words, must NOT be a fragment ("the labeled data..."), must not contain Goodreads-page noise.
  const good = matches.filter(q => {
    if (!/\b(the|and|is|of|to|in|that|you|are|with)\b/i.test(q)) return false;
    if (/^[a-z]/.test(q)) return false;       // fragment starting lowercase
    if (q.endsWith(',')) return false;         // mid-sentence cutoff
    if (/Goodreads|Sign in|Sign up|Browse/.test(q)) return false;
    if (/^\s*[.…]/.test(q)) return false;
    // Drop quotes that contain a stray closing quote inside (parsing artefact)
    if (/”/.test(q)) return false;
    return true;
  });
  if (!good.length) return null;
  // Prefer length 80–200; sort by closeness to that range
  good.sort((a, b) => Math.abs(a.length - 140) - Math.abs(b.length - 140));
  return good[0];
}

const targets = books.books.filter(b => {
  if (ONLY_ID) return b.id === ONLY_ID;
  return !b.quote;
}).slice(0, LIMIT);

console.error(`Goodreads quote scrape: ${targets.length} book${targets.length === 1 ? '' : 's'}\n`);

const results = [];
for (const [i, book] of targets.entries()) {
  process.stderr.write(`  [${i + 1}/${targets.length}] ${book.title.slice(0, 55).padEnd(55)} `);
  let bookUrl, workUrl, quote;
  try {
    bookUrl = await findGoodreadsBookUrl(book);
    if (!bookUrl) { process.stderr.write('· no_book_url\n'); continue; }
    workUrl = await findWorkQuotesUrl(bookUrl);
    if (!workUrl) { process.stderr.write('· no_work_quotes\n'); continue; }
    const html = await safeText(workUrl);
    if (!html) { process.stderr.write('· quotes_fetch_failed\n'); continue; }
    quote = pickBestQuote(html, book);
    if (!quote) { process.stderr.write('· no_clean_quote\n'); continue; }
    results.push({
      id: book.id,
      title: book.title,
      text: quote,
      attribution: book.title,
      source_url: workUrl,
    });
    process.stderr.write('✓\n');
  } catch (e) {
    process.stderr.write(`· err ${String(e.message || e).slice(0, 30)}\n`);
  }
  // Goodreads is rate-sensitive; be polite.
  await new Promise(r => setTimeout(r, 1200 + Math.random() * 800));
}

const date = new Date().toISOString().slice(0, 10);
const outPath = path.join(ROOT, 'audits', 'beds', 'runs', `${date}-goodreads-quotes.json`);
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(results, null, 2));

console.log(`\n${results.length}/${targets.length} quotes scraped.`);
console.log(`→ ${path.relative(ROOT, outPath)}`);
console.log(`Apply: node scripts/enrich_book_quotes.mjs --apply ${path.relative(ROOT, outPath)}`);
