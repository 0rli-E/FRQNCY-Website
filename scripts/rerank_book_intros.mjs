#!/usr/bin/env node
/**
 * FRQNCY · Re-rank book intro candidates from the enrichment queue.
 *
 * Parses an existing audits/beds/runs/<date>-book-enrichment-queue.md and
 * produces a smarter JSON sidecar. Beats the original "longest source wins"
 * heuristic by:
 *
 *   1. Filtering out cataloguing-note junk ("Free eBook digitized…",
 *      "Includes bibliographical references…", "Book digitized by Google…").
 *   2. Preferring canonical URL > openlibrary > archive_org as the source.
 *   3. Among accepted sources for a book, taking the longest remaining text.
 *
 * Doesn't re-fetch — works entirely off the existing queue markdown.
 *
 * Usage:
 *   node scripts/rerank_book_intros.mjs                              # auto-picks today's queue
 *   node scripts/rerank_book_intros.mjs <queue.md>                   # explicit input
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const today = new Date().toISOString().slice(0, 10);
const inputPath = args[0]
  ? path.resolve(args[0])
  : path.join(ROOT, 'audits', 'beds', 'runs', `${today}-book-enrichment-queue.md`);

if (!fs.existsSync(inputPath)) {
  console.error(`Input not found: ${inputPath}`);
  process.exit(1);
}

const SOURCE_PRIORITY = { canonical: 0, openlibrary: 1, archive_org: 2 };

// Patterns that mark cataloguing/boilerplate noise or pure marketing rather
// than real book description.
const JUNK_PATTERNS = [
  // Library cataloguing
  /includes? (bibliograph|index)/i,
  /\d+\s*p\.\s*:\s*\d+\s*cm/i,            // "241 p. : 22 cm" pagination stamps
  /^[ivxlcdm]+,\s*\d+\s*p\./i,              // "xviii, 241 p." roman-numeral prefix
  /^free ebook (digitized|digitised|produced)/i,
  /^book digitized by google/i,
  /^digitized by/i,
  /uploaded to the internet archive/i,
  /^library of [\w\s]+ university/i,
  /from the library of/i,
  /this book was scanned/i,
  /^also issued in print/i,
  /^title of part \d/i,

  // Marketing taglines / CTAs / ad copy that the canonical-URL extractor
  // sometimes grabs from the homepage instead of the book page
  /^(try|discover|reset|explore|shop|join|get) /i,
  /^on amazon\.com/i,
  /\*free\* shipping/i,
  /qualifying offers/i,
  /(drives meaningful|advancing science-based|advances science-based)/i,
  /^on my substack/i,
  /sign up for (our|my) newsletter/i,
  /^\d+\s*-?day [a-z\- ]+experiment/i,    // "5-Day Meaning Design Experiment"
  /\b(plans?, recipes?, and supplements?)\b/i,
];

function looksLikeJunk(text) {
  const t = text.trim();
  if (t.length < 80) return true;
  return JUNK_PATTERNS.some(re => re.test(t));
}

// Some openlibrary / publisher snippets come back with multiply-encoded HTML
// entities (life&amp;#8217;s). Decode iteratively until stable.
const ENTITIES = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", ndash: '–', mdash: '—', hellip: '…', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', copy: '©', reg: '®', trade: '™' };
function decodeEntities(s) {
  if (typeof s !== 'string') return s;
  let prev = '';
  while (prev !== s) {
    prev = s;
    s = s
      .replace(/&(amp|nbsp|lt|gt|quot|apos|ndash|mdash|hellip|rsquo|lsquo|rdquo|ldquo|copy|reg|trade);/g, (_, n) => ENTITIES[n] ?? '')
      .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(+c))
      .replace(/&#x([0-9a-f]+);/gi, (_, c) => String.fromCharCode(parseInt(c, 16)));
  }
  return s.replace(/\s+/g, ' ').trim();
}

const text = fs.readFileSync(inputPath, 'utf8');
const lines = text.split('\n');

// Walk the markdown, collecting per-book source rows.
//
// Each section starts with: ### `b-foo` — Title
// Then: **Author:** ... and **Current bio (N chars):** ...
// Then per-source blocks: **[source](url)** ... > quoted text
const books = []; // { id, title, sources: [{source, url, text}] }
let current = null;
let pendingSource = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // New book section
  const headMatch = line.match(/^### `(b-[^`]+)` — (.+)$/);
  if (headMatch) {
    if (current) books.push(current);
    current = { id: headMatch[1], title: headMatch[2].trim(), sources: [] };
    pendingSource = null;
    continue;
  }
  if (!current) continue;

  // Source header: **[source](url)**  or  **[source](url) — _note_**
  const srcMatch = line.match(/^\*\*\[(\w+)\]\(([^)]+)\)/);
  if (srcMatch) {
    pendingSource = { source: srcMatch[1], url: srcMatch[2], text: '' };
    current.sources.push(pendingSource);
    continue;
  }

  // Quote line that follows a source header — capture into pendingSource.text
  if (pendingSource && line.startsWith('> ')) {
    pendingSource.text += (pendingSource.text ? ' ' : '') + line.slice(2).trim();
    continue;
  }

  // Section break ("---") closes the active source for this book
  if (line.trim() === '---') {
    pendingSource = null;
  }
}
if (current) books.push(current);

// Re-rank and emit sidecar
const sidecar = [];
let kept = 0, rejected = 0, noText = 0;

for (const b of books) {
  const candidates = b.sources
    .filter(s => s.text && !looksLikeJunk(s.text))
    .sort((a, b) =>
      (SOURCE_PRIORITY[a.source] ?? 99) - (SOURCE_PRIORITY[b.source] ?? 99)
      || b.text.length - a.text.length
    );

  if (!candidates.length) {
    if (b.sources.length === 0) noText++;
    else rejected++;
    continue;
  }

  // Among the top-priority bucket, take the longest
  const best = candidates[0];
  // Trim ellipsis tails + decode HTML entities (canonical fetches return them)
  const intro = decodeEntities(best.text.replace(/…$/, '').trim());
  sidecar.push({
    id: b.id,
    title: b.title,
    intro_source: best.url,
    intro,
  });
  kept++;
}

const dest = path.join(ROOT, 'audits', 'beds', 'runs', `${today}-book-intros.json`);
fs.writeFileSync(dest, JSON.stringify(sidecar, null, 2));

console.log(`Re-ranked ${books.length} books from ${path.relative(ROOT, inputPath)}`);
console.log(`  kept:     ${kept}`);
console.log(`  rejected: ${rejected} (only junk available)`);
console.log(`  no text:  ${noText} (no sources at all)`);
console.log(`→ Wrote ${path.relative(ROOT, dest)}`);
