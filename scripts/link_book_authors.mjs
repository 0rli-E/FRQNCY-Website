#!/usr/bin/env node
/**
 * FRQNCY · Auto-link unresolved book authors to people-bed entries.
 *
 * For each book where `author_is_person_ref` is false (or absent), tries to
 * match the plain-string author to a `p-` ID in people.json. Match strategies
 * in descending confidence:
 *
 *   high   — exact normalised name match
 *   high   — first author of "X & Y" or "X, Y" matches
 *   med    — strip common honorifics ("Dr.", "Sir") then exact match
 *   low    — last-name-only match (only used in --apply when --aggressive)
 *
 * Default run prints the proposed link list and writes a JSON sidecar.
 * Edit/delete rows you don't want, then run --apply to commit.
 *
 * Usage:
 *   node scripts/link_book_authors.mjs                   # dry-run, prints proposals
 *   node scripts/link_book_authors.mjs --apply <file>    # commits curated proposals
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const applyIdx = args.indexOf('--apply');
const APPLY_FILE = applyIdx !== -1 ? args[applyIdx + 1] : null;

// ───────────────────────── apply mode ─────────────────────────
if (APPLY_FILE) {
  const approved = JSON.parse(fs.readFileSync(path.resolve(APPLY_FILE), 'utf8'));
  const booksPath = path.join(ROOT, 'books.json');
  const data = JSON.parse(fs.readFileSync(booksPath, 'utf8'));
  let written = 0;
  for (const entry of approved) {
    const book = data.books.find(b => b.id === entry.book_id);
    if (!book) { console.warn(`skip: ${entry.book_id} not in books.json`); continue; }
    if (!entry.person_id?.startsWith('p-')) { console.warn(`skip: ${entry.book_id} bad person_id ${entry.person_id}`); continue; }
    book.author = entry.person_id;
    book.author_is_person_ref = true;
    written++;
  }
  fs.writeFileSync(booksPath, JSON.stringify(data, null, 2) + '\n');
  console.log(`Linked ${written} book author${written === 1 ? '' : 's'} to people bed.`);
  process.exit(0);
}

// ───────────────────────── load ─────────────────────────
const books = JSON.parse(fs.readFileSync(path.join(ROOT, 'books.json'), 'utf8'));
const people = JSON.parse(fs.readFileSync(path.join(ROOT, 'people.json'), 'utf8'));

// ───────────────────────── normalise ─────────────────────────
function normName(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/\(ed\.\)|\(eds\.\)|\(editor\)/g, '')
    .replace(/^(dr|sir|prof|professor|rev|fr)\.?\s+/i, '')
    .replace(/\b(jr|sr|iii|ii|iv)\.?\b/gi, '')
    .replace(/[.'"`’“”()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function firstAuthor(s) {
  // "X & Y" → "X" ;  "X, Y" → "X" ;  "X and Y" → "X"
  return String(s || '').split(/\s*&\s*|,\s*|\s+and\s+/)[0].trim();
}

// ───────────────────────── index ─────────────────────────
const peopleByName = new Map();
for (const p of people.people) {
  if (p.name) peopleByName.set(normName(p.name), p);
}

// ───────────────────────── match ─────────────────────────
const proposals = [];   // { book_id, book_title, current_author, person_id, person_name, confidence, strategy }

for (const b of books.books) {
  if (b.author_is_person_ref === true) continue;        // already linked
  if (typeof b.author !== 'string' || !b.author) continue;

  const original = b.author;
  const normWhole = normName(original);
  const normFirst = normName(firstAuthor(original));

  // Strategy 1: exact whole-string match
  let match = peopleByName.get(normWhole);
  let strategy = 'exact';
  let confidence = 'high';

  // Strategy 2: first-author of "X & Y" / "X, Y"
  if (!match && normFirst && normFirst !== normWhole) {
    match = peopleByName.get(normFirst);
    strategy = 'first-author';
    confidence = 'high';
  }

  if (!match) continue;
  proposals.push({
    book_id: b.id,
    book_title: b.title,
    current_author: original,
    person_id: match.id,
    person_name: match.name,
    confidence,
    strategy,
  });
}

// ───────────────────────── render ─────────────────────────
const date = new Date().toISOString().slice(0, 10);
const dest = path.join(ROOT, 'audits', 'beds', 'runs', `${date}-author-link-proposals.md`);
const sidecar = path.join(ROOT, 'audits', 'beds', 'runs', `${date}-author-link-proposals.json`);
fs.mkdirSync(path.dirname(dest), { recursive: true });

const md = [];
md.push(`# Book author auto-link proposals — ${date}`);
md.push('');
md.push(`**Books with unresolved authors:** ${books.books.filter(b => b.author_is_person_ref !== true).length}`);
md.push(`**Auto-link candidates:** ${proposals.length}`);
md.push('');
md.push('Review the proposed links below. Edit/delete rows in the JSON sidecar, then commit with:');
md.push('');
md.push('```');
md.push(`node scripts/link_book_authors.mjs --apply audits/beds/runs/${date}-author-link-proposals.json`);
md.push('```');
md.push('');
if (proposals.length) {
  md.push('| book | book id | author string | → person | confidence | strategy |');
  md.push('|---|---|---|---|---|---|');
  for (const p of proposals) {
    md.push(`| ${p.book_title} | \`${p.book_id}\` | ${p.current_author} | \`${p.person_id}\` (${p.person_name}) | ${p.confidence} | ${p.strategy} |`);
  }
}

fs.writeFileSync(dest, md.join('\n'));
fs.writeFileSync(sidecar, JSON.stringify(proposals, null, 2));

console.log(`${proposals.length} author link${proposals.length === 1 ? '' : 's'} proposed.`);
console.log(`→ ${path.relative(ROOT, dest)}`);
console.log(`→ ${path.relative(ROOT, sidecar)} (apply candidates)`);
