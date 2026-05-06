#!/usr/bin/env node
/**
 * FRQNCY · Clean book quotes in-place in books.json.
 *
 * Drops quotes that look misattributed — common when archive.org's full-text
 * search returned a different book in the same compilation. Signals:
 *   - Attribution doesn't share any distinctive title token with the book title
 *   - Quote text doesn't share any distinctive title token either
 *   - Attribution names a famously distinct work ("In Flanders Fields" etc.)
 *
 * Drops are written by deleting the field, so QA's R2-QUOTE-MISSING flags
 * them on the next run.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const booksPath = path.join(ROOT, 'books.json');
const data = JSON.parse(fs.readFileSync(booksPath, 'utf8'));

const STOP = new Set(['the','of','a','an','and','or','to','in','on','at','for','with','by','is','are','i','ii','iii','iv','v','&','it','this','that','from','your','our','my','book','chapter','part','vol','volume']);

function tokens(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 3 && !STOP.has(w));
}

function intersect(a, b) {
  const set = new Set(a);
  return b.some(t => set.has(t));
}

let kept = 0, dropped = 0, fixedAttr = 0;
const drops = [];

for (const b of data.books) {
  const q = b.quote;
  if (!q) continue;
  const text = typeof q === 'string' ? q : (q.text || '');
  const attr = typeof q === 'object' ? (q.attribution || '') : '';
  if (!text) { delete b.quote; dropped++; drops.push(b.id + ' (empty)'); continue; }

  const titleToks = tokens(b.title);
  if (!titleToks.length) { kept++; continue; }            // very short title, skip check

  const attrToks = tokens(attr);
  const textToks = tokens(text);

  // Reject if attribution explicitly names a different titled work
  const attrSharesTitle = !attr || intersect(titleToks, attrToks);
  // Quote is allowed even without title token (most book quotes don't repeat the title)
  const textSharesAnyTitle = textToks.length === 0 || intersect(titleToks, textToks);

  // Heavy-handed reject: if BOTH attribution and text share NO title tokens
  if (!attrSharesTitle && !textSharesAnyTitle) {
    delete b.quote;
    dropped++;
    drops.push(`${b.id}: attr "${attr}" doesn't match title "${b.title}"`);
    continue;
  }

  // Lighter reject: attribution explicitly names a famously different work
  if (attr && !attrSharesTitle && textToks.length > 5) {
    // Attribution looks like a SPECIFIC alternative title (capitalized phrase, multi-word)
    const looksLikeOtherWork = /^[A-Z][\w']*( (in|of|the|on|and|or|a|an) )?[A-Z][\w']*/.test(attr.split(',')[0].trim());
    if (looksLikeOtherWork) {
      delete b.quote;
      dropped++;
      drops.push(`${b.id}: attribution "${attr}" looks like a different work`);
      continue;
    }
  }

  kept++;
}

fs.writeFileSync(booksPath, JSON.stringify(data, null, 2) + '\n');
console.log(`Quotes — kept: ${kept} · dropped: ${dropped} · attribution fixes: ${fixedAttr}`);
if (drops.length) {
  console.log('\nDropped:');
  for (const d of drops) console.log(`  - ${d}`);
}
