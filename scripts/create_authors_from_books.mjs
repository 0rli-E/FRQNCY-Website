#!/usr/bin/env node
/**
 * FRQNCY · Create people-bed entries for unresolved book authors.
 *
 * For each book where `author_is_person_ref !== true`, parses the author
 * string into one or more people, mints person IDs, and proposes new
 * people.json entries. Produces a queue file; --apply commits.
 *
 * Parsing rules:
 *   "X & Y" / "X and Y"     → two authors
 *   "X, Y, & Z"             → three authors
 *   "(ed.)" / "(eds.)"      → role: "editor", strip from name
 *   "Dr. X" / "Sir X"       → strip honorific
 *   lastname-only ambiguity → resolved via FULL_NAME_OVERRIDES below
 *
 * Schema:
 *   - For single-author books: book.author = "p-id", book.author_is_person_ref = true
 *   - For co-authored books:   book.author = ["p-id1","p-id2"], book.author_is_person_ref = true
 *
 * Person entry minted:
 *   { id, name, url: "", bio, appears_in, picked_in, author_role?: "editor" }
 *   (life_story + image are deferred to Phase 2 enrichment)
 *
 * Usage:
 *   node scripts/create_authors_from_books.mjs                       # dry-run
 *   node scripts/create_authors_from_books.mjs --apply <queue.json>  # commit
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const applyIdx = args.indexOf('--apply');
const APPLY_FILE = applyIdx !== -1 ? args[applyIdx + 1] : null;

// ───────────────────────── overrides for lastname-only / ambiguous strings
const FULL_NAME_OVERRIDES = {
  'McDonough & Braungart':       ['William McDonough', 'Michael Braungart'],
  'Schultes & Hofmann':          ['Richard Evans Schultes', 'Albert Hofmann'],
  'Zander & Zander':             ['Benjamin Zander', 'Rosamund Stone Zander'],
  'Wellinger, Murphy & Baxter':  ['Arthur Wellinger', 'Jerry Murphy', 'David Baxter'],
  'Graeber & Wengrow':           ['David Graeber', 'David Wengrow'],
  'Kovach & Rosenstiel':         ['Bill Kovach', 'Tom Rosenstiel'],
  'Davidson & Rees-Mogg':        ['James Dale Davidson', 'William Rees-Mogg'],
  'Wilkinson & Pickett':         ['Richard Wilkinson', 'Kate Pickett'],
  'Engler & Engler':             ['Mark Engler', 'Paul Engler'],
};

// ───────────────────────── helpers
function slugifyName(s) {
  return 'p-' + String(s || '')
    .toLowerCase()
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function stripHonorifics(s) {
  return String(s || '').replace(/^(Dr|Sir|Prof|Professor|Rev|Fr|Mr|Mrs|Ms)\.?\s+/i, '').trim();
}

function parseAuthors(raw) {
  // Returns array of { name, role? }
  if (FULL_NAME_OVERRIDES[raw]) {
    return FULL_NAME_OVERRIDES[raw].map(name => ({ name }));
  }
  let s = String(raw || '').trim();
  let role;
  if (/\(eds?\.?\)|\(editors?\)/i.test(s)) {
    role = 'editor';
    s = s.replace(/\(eds?\.?\)|\(editors?\)/gi, '').trim();
  }
  const parts = s.split(/\s*&\s*|\s+and\s+|,\s*(?=[A-Z])/).map(p => stripHonorifics(p.trim())).filter(Boolean);
  return parts.map(name => role ? { name, role } : { name });
}

// ───────────────────────── apply mode
if (APPLY_FILE) {
  const queue = JSON.parse(fs.readFileSync(path.resolve(APPLY_FILE), 'utf8'));
  const peoplePath = path.join(ROOT, 'people.json');
  const booksPath = path.join(ROOT, 'books.json');
  const peopleData = JSON.parse(fs.readFileSync(peoplePath, 'utf8'));
  const booksData = JSON.parse(fs.readFileSync(booksPath, 'utf8'));
  const peopleById = new Map(peopleData.people.map(p => [p.id, p]));

  let createdCount = 0;
  let updatedCount = 0;

  for (const item of queue) {
    // Create new people
    for (const person of item.new_people) {
      if (peopleById.has(person.id)) {
        // Merge appears_in / picked_in
        const existing = peopleById.get(person.id);
        existing.appears_in = [...new Set([...(existing.appears_in || []), ...(person.appears_in || [])])];
        existing.picked_in = [...new Set([...(existing.picked_in || []), ...(person.picked_in || [])])];
        continue;
      }
      peopleData.people.push(person);
      peopleById.set(person.id, person);
      createdCount++;
    }
    // Update book ref
    const book = booksData.books.find(b => b.id === item.book_id);
    if (!book) { console.warn(`skip: ${item.book_id} not found`); continue; }
    book.author = item.author_field; // string or array
    book.author_is_person_ref = true;
    updatedCount++;
  }

  // Sort people alphabetically by name (existing convention check)
  peopleData.people.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  peopleData.$updated = new Date().toISOString().slice(0, 10);

  fs.writeFileSync(peoplePath, JSON.stringify(peopleData, null, 2) + '\n');
  fs.writeFileSync(booksPath, JSON.stringify(booksData, null, 2) + '\n');
  console.log(`Created ${createdCount} new people; updated ${updatedCount} book author refs.`);
  process.exit(0);
}

// ───────────────────────── proposal mode
const books = JSON.parse(fs.readFileSync(path.join(ROOT, 'books.json'), 'utf8'));
const people = JSON.parse(fs.readFileSync(path.join(ROOT, 'people.json'), 'utf8'));
const peopleById = new Map(people.people.map(p => [p.id, p]));

const queue = [];   // { book_id, book_title, raw_author, author_field, new_people: [...] }
const newPeopleAccum = new Map(); // id → person (deduped across books)

for (const b of books.books) {
  if (b.author_is_person_ref === true) continue;
  if (typeof b.author !== 'string' || !b.author) continue;

  const parsed = parseAuthors(b.author);
  if (!parsed.length) continue;

  const ids = parsed.map(a => slugifyName(a.name));
  const new_people = [];

  parsed.forEach((a, i) => {
    const id = ids[i];
    if (peopleById.has(id)) {
      // Merge appears_in / picked_in onto existing person record
      const existing = peopleById.get(id);
      const merged = {
        ...existing,
        appears_in: [...new Set([...(existing.appears_in || []), ...(b.appears_in || [])])],
        picked_in: [...new Set([...(existing.picked_in || []), ...(b.picked_in || [])])],
      };
      new_people.push(merged);
      peopleById.set(id, merged);
      return;
    }
    if (newPeopleAccum.has(id)) {
      // Same author appearing on multiple books — merge appears_in
      const acc = newPeopleAccum.get(id);
      acc.appears_in = [...new Set([...(acc.appears_in || []), ...(b.appears_in || [])])];
      acc.picked_in = [...new Set([...(acc.picked_in || []), ...(b.picked_in || [])])];
      new_people.push(acc);
      return;
    }
    const person = {
      id,
      name: a.name,
      url: '',
      bio: `Author of ${b.title}.`,
      appears_in: [...(b.appears_in || [])],
      picked_in: [...(b.picked_in || [])],
    };
    if (a.role) person.author_role = a.role;
    newPeopleAccum.set(id, person);
    new_people.push(person);
  });

  queue.push({
    book_id: b.id,
    book_title: b.title,
    raw_author: b.author,
    author_field: ids.length === 1 ? ids[0] : ids,
    new_people,
  });
}

const date = new Date().toISOString().slice(0, 10);
const dest = path.join(ROOT, 'audits', 'beds', 'runs', `${date}-author-create-proposals.md`);
const sidecar = path.join(ROOT, 'audits', 'beds', 'runs', `${date}-author-create-proposals.json`);
fs.mkdirSync(path.dirname(dest), { recursive: true });

const md = [];
md.push(`# Author-creation proposals — ${date}`);
md.push('');
md.push(`**Books with unresolved authors:** ${queue.length}`);
md.push(`**Net-new people:** ${newPeopleAccum.size}`);
md.push('');
md.push('Review the JSON sidecar; remove rows you don\'t want, then run:');
md.push('```');
md.push(`node scripts/create_authors_from_books.mjs --apply audits/beds/runs/${date}-author-create-proposals.json`);
md.push('```');
md.push('');
md.push('## Multi-author books (schema becomes `author: [...]`)');
md.push('');
md.push('| book | author string | → person IDs |');
md.push('|---|---|---|');
for (const q of queue.filter(x => Array.isArray(x.author_field))) {
  md.push(`| ${q.book_title} | ${q.raw_author} | ${q.author_field.map(id => `\`${id}\``).join(', ')} |`);
}
md.push('');
md.push('## Editor / honorific-stripped (sample)');
md.push('');
md.push('| book | raw | parsed |');
md.push('|---|---|---|');
for (const q of queue) {
  if (/\(ed/i.test(q.raw_author) || /^Dr\.|^Sir |^Prof\./.test(q.raw_author)) {
    md.push(`| ${q.book_title} | ${q.raw_author} | ${q.new_people.map(p => p.name + (p.author_role ? ` (${p.author_role})` : '')).join(' · ')} |`);
  }
}

fs.writeFileSync(dest, md.join('\n'));
fs.writeFileSync(sidecar, JSON.stringify(queue, null, 2));

console.log(`${queue.length} books · ${newPeopleAccum.size} net-new people proposed.`);
console.log(`→ ${path.relative(ROOT, dest)}`);
console.log(`→ ${path.relative(ROOT, sidecar)}`);
