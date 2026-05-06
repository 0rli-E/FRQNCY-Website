#!/usr/bin/env node
/**
 * FRQNCY · Manual sourcing queue.
 *
 * For every book in books.json that was NOT covered by the auto-enrichment
 * sidecar, emit a markdown checklist with: title, author, current bio, the
 * book's canonical URL, plus pre-built search links (Amazon, archive.org,
 * publisher search) so the editor can paste a real intro fast.
 *
 * Reads:
 *   books.json
 *   audits/beds/runs/<date>-book-intros.json (the curated sidecar)
 *
 * Writes:
 *   audits/beds/runs/<date>-book-intros-manual-queue.md
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const today = new Date().toISOString().slice(0, 10);
// Find the most recent intros sidecar (today's, or the latest dated file).
const runsDir = path.join(ROOT, 'audits', 'beds', 'runs');
const candidates = fs.existsSync(runsDir)
  ? fs.readdirSync(runsDir).filter(f => /^\d{4}-\d{2}-\d{2}-book-intros\.json$/.test(f)).sort().reverse()
  : [];
const sidecarPath = candidates.length ? path.join(runsDir, candidates[0]) : path.join(runsDir, `${sidecarDate}-book-intros.json`);
if (!fs.existsSync(sidecarPath)) {
  console.error(`Sidecar not found at ${sidecarPath}. Run enrich_book_intros + rerank first.`);
  process.exit(1);
}
// Use sidecar's date for the output filename so it's traceable
const sidecarDate = path.basename(sidecarPath).match(/^(\d{4}-\d{2}-\d{2})/)?.[1] || today;

const books = JSON.parse(fs.readFileSync(path.join(ROOT, 'books.json'), 'utf8')).books;
// "Covered" = books that currently have an intro field on the live bed (post-cleanup).
// Sidecar is no longer the source of truth — books.json is, since cleanup scripts
// drop entries from books.json directly.
const covered = new Set(books.filter(b => typeof b.intro === 'string' && b.intro.trim()).map(b => b.id));

// PAGE_FLOOR/BIO_FLOOR mirror the QA — only stub books need intros
function bodyWords(slug) {
  const p = path.join(ROOT, 'books', slug, 'index.html');
  if (!fs.existsSync(p)) return null;
  const t = fs.readFileSync(p, 'utf8');
  const m = t.match(/<body[\s\S]*?<\/body>/i);
  if (!m) return 0;
  return m[0].replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length;
}

const targets = books.filter(b => {
  if (covered.has(b.id)) return false;
  const slug = (b.id || '').replace(/^b-/, '');
  const words = bodyWords(slug);
  return (b.bio?.length ?? 0) < 80 || (words !== null && words < 120);
});

const lines = [];
lines.push(`# Books needing manual intro sourcing — ${today}`);
lines.push('');
lines.push(`**Books in this queue:** ${targets.length} (auto-sourcing returned only catalogue notes or nothing usable)`);
lines.push('');
lines.push('For each book below, click the search links and grab a real description / pull-quote from the publisher, author site, or Amazon book page. Wikipedia is excluded by editorial standard.');
lines.push('');
lines.push('When you have a clean intro, append it to `audits/beds/runs/' + today + '-book-intros.json` as');
lines.push('`{"id":"b-foo","intro":"…","intro_source":"<url>"}` and run:');
lines.push('');
lines.push('```');
lines.push(`node scripts/enrich_book_intros.mjs --apply audits/beds/runs/${sidecarDate}-book-intros.json`);
lines.push('```');
lines.push('');

for (const b of targets) {
  const author = typeof b.author === 'string' && !b.author_is_person_ref ? b.author : '';
  const q = encodeURIComponent(`${b.title}${author ? ' ' + author : ''}`);
  lines.push(`### \`${b.id}\` — ${b.title}`);
  lines.push('');
  lines.push(`- **Author:** ${author || '(linked to people bed)'}`);
  lines.push(`- **Current bio (${(b.bio || '').length} chars):** ${b.bio || '_(empty)_'}`);
  if (b.url) lines.push(`- **Canonical:** ${b.url}`);
  lines.push(`- **Amazon search:** https://www.amazon.com/s?k=${q}&i=stripbooks`);
  lines.push(`- **Archive.org search:** https://archive.org/search?query=${q}&and[]=mediatype%3A%22texts%22`);
  lines.push(`- **Publisher search (Google):** https://www.google.com/search?q=${q}+book+publisher+description`);
  lines.push('');
  lines.push('- [ ] intro pasted into sidecar');
  lines.push('');
}

const dest = path.join(ROOT, 'audits', 'beds', 'runs', `${sidecarDate}-book-intros-manual-queue.md`);
fs.writeFileSync(dest, lines.join('\n'));
console.log(`${targets.length} books queued for manual sourcing.`);
console.log(`→ Wrote ${path.relative(ROOT, dest)}`);
