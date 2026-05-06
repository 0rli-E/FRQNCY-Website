#!/usr/bin/env node
/**
 * FRQNCY · Auto-QA for the books + people beds.
 *
 * Runs four levels of validation against books.json + people.json against
 * content.json (the topic graph) and the rendered /books/<slug>/ /people/<slug>/
 * filesystem trees:
 *
 *   L0 schema       — required fields, ID/slug parity, duplicates, types
 *   L1 integrity    — coverage (content.json ↔ bed ↔ filesystem), reciprocity,
 *                     valid refs (appears_in / picked_in / author / channels),
 *                     orphan directories
 *   L2 depth        — bio/page word-count floors, author resolution rate,
 *                     pick distribution, life_story / channels presence
 *   L3 liveness     — consumes link-health.json (run scripts/check-links.mjs first)
 *
 * Exit code is non-zero ONLY on L0/L1 findings. L2/L3 are warnings.
 *
 * Usage:
 *   node scripts/qa_beds.mjs                                 # L0–L2 to stdout
 *   node scripts/qa_beds.mjs --external                      # adds L3
 *   node scripts/qa_beds.mjs --report                        # writes audits/beds/runs/<date>-bed-qa.md
 *   node scripts/qa_beds.mjs --report path/to/file.md
 *   node scripts/qa_beds.mjs --bed books                     # one bed only
 *
 * Output uses the same ✗ Flagged / ⚪ Watchlist / ✓ Approved headers as
 * qa_aggregate.py so that aggregator can re-bucket the rows if needed.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ───────────────────────── args ─────────────────────────
const args = process.argv.slice(2);
const externalMode = args.includes('--external');
const reportFlagIdx = args.indexOf('--report');
const wantsReport = reportFlagIdx !== -1;
const reportArg = wantsReport ? (args[reportFlagIdx + 1] && !args[reportFlagIdx + 1].startsWith('--') ? args[reportFlagIdx + 1] : null) : null;
const bedFilter = (() => {
  const i = args.indexOf('--bed');
  return i !== -1 ? args[i + 1] : null;
})();

// ───────────────────────── thresholds ─────────────────────────
const BIO_FLOOR = { books: 80, people: 100 };       // chars
const PAGE_FLOOR = { books: 120, people: 160 };     // body words

// ───────────────────────── load ─────────────────────────
const loadJSON = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const content = loadJSON('content.json');
const books = loadJSON('books.json');
const people = loadJSON('people.json');

const topicIds = new Set((content.topics || []).map(t => t.id));
const domainIds = new Set((content.domains || []).map(d => d.id));
const pillarSlugs = new Set((content.pillars || []).map(p => p.id || p.slug));
const allRefIds = new Set([...topicIds, ...domainIds, ...pillarSlugs]);

// ───────────────────────── findings collector ─────────────────────────
/** @type {Array<{rule:string,severity:'flag'|'watch',bed:string,id:string,msg:string}>} */
const findings = [];
const flag = (rule, bed, id, msg) => findings.push({ rule, severity: 'flag', bed, id, msg });
const warn = (rule, bed, id, msg) => findings.push({ rule, severity: 'watch', bed, id, msg });

// ───────────────────────── helpers ─────────────────────────
function bodyWordCount(htmlPath) {
  if (!fs.existsSync(htmlPath)) return null;
  const t = fs.readFileSync(htmlPath, 'utf8');
  const m = t.match(/<body[\s\S]*?<\/body>/i);
  if (!m) return 0;
  const text = m[0].replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return text ? text.split(' ').length : 0;
}

function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[.,'"`’“”()]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Build candidate slug keys for a content.json reference title.
// FRQNCY titles use " — " as the byline/subtitle separator (e.g.
// "Wind Energy — Fundamentals, Resource Analysis — Manwell"). Try the full
// slug first, then progressively drop em-dash chunks from the right —
// any of those slugs may match a bed entry. Colons are part of titles
// (e.g. "DMT: The Spirit Molecule") and are preserved by slugify().
function refSlugCandidates(title) {
  const parts = String(title || '').split(' — ');
  const out = new Set();
  for (let i = parts.length; i > 0; i--) {
    const slug = slugify(parts.slice(0, i).join(' '));
    if (slug) out.add(slug);
  }
  return [...out];
}

// Build the candidate slug keys for a bed entry. The id stem (e.g. "b-foo" → "foo")
// is canonical; the slugified title is a fallback.
function bedSlugCandidates(entry, prefix) {
  const stem = (entry.id || '').replace(new RegExp(`^${prefix}-`), '');
  const fromTitle = slugify(entry.title || entry.name || '');
  return stem && stem !== fromTitle ? [stem, fromTitle] : [stem || fromTitle];
}

function listDirs(rel) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) return [];
  return fs.readdirSync(p, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);
}

// ───────────────────────── L0 schema ─────────────────────────
function l0Books() {
  const seen = new Set();
  for (const b of books.books) {
    const id = b.id || '<no-id>';
    if (!b.id) flag('R0-MISSING', 'books', id, 'no id');
    else if (!b.id.startsWith('b-')) flag('R0-ID-PREFIX', 'books', id, `id should start with "b-"`);
    if (b.id) {
      if (seen.has(b.id)) flag('R0-DUP-ID', 'books', id, 'duplicate id');
      seen.add(b.id);
    }
    if (!b.title) flag('R0-MISSING', 'books', id, 'no title');
    if (!b.url) flag('R0-MISSING', 'books', id, 'no url');
    else if (!/^https?:\/\//i.test(b.url)) flag('R0-URL', 'books', id, `url not http(s): ${b.url}`);
    if (typeof b.bio !== 'string') flag('R0-MISSING', 'books', id, 'bio missing or not a string');
    if (!Array.isArray(b.appears_in)) flag('R0-TYPE', 'books', id, 'appears_in not an array');
    if (!Array.isArray(b.picked_in)) flag('R0-TYPE', 'books', id, 'picked_in not an array');
    if ('author_is_person_ref' in b && typeof b.author_is_person_ref !== 'boolean') flag('R0-TYPE', 'books', id, 'author_is_person_ref not a boolean');
  }
}

function l0People() {
  const seen = new Set();
  for (const p of people.people) {
    const id = p.id || '<no-id>';
    if (!p.id) flag('R0-MISSING', 'people', id, 'no id');
    else if (!p.id.startsWith('p-')) flag('R0-ID-PREFIX', 'people', id, `id should start with "p-"`);
    if (p.id) {
      if (seen.has(p.id)) flag('R0-DUP-ID', 'people', id, 'duplicate id');
      seen.add(p.id);
    }
    if (!p.name) flag('R0-MISSING', 'people', id, 'no name');
    if (!p.url) flag('R0-MISSING', 'people', id, 'no url');
    else if (!/^https?:\/\//i.test(p.url)) flag('R0-URL', 'people', id, `url not http(s): ${p.url}`);
    if (typeof p.bio !== 'string') flag('R0-MISSING', 'people', id, 'bio missing or not a string');
    if (!Array.isArray(p.appears_in)) flag('R0-TYPE', 'people', id, 'appears_in not an array');
    if (!Array.isArray(p.picked_in)) flag('R0-TYPE', 'people', id, 'picked_in not an array');
    if ('channels' in p && !Array.isArray(p.channels)) flag('R0-TYPE', 'people', id, 'channels not an array');
    if ('life_story' in p && !Array.isArray(p.life_story)) flag('R0-TYPE', 'people', id, 'life_story not an array');
  }
}

// ───────────────────────── L1 integrity ─────────────────────────
function l1Books() {
  // Index bed by id stem (slug) and by slugified title
  const bedBySlug = new Map();
  const bedByKey = new Map();
  for (const b of books.books) {
    if (b.id) bedBySlug.set(b.id.replace(/^b-/, ''), b);
    for (const k of bedSlugCandidates(b, 'b')) if (k) bedByKey.set(k, b);
  }

  // 1. Build content.json index of book references, grouped by raw title
  /** raw title → [{bucket, pick}] */
  const refsByRaw = new Map();
  for (const [bucket, items] of Object.entries(content.resources || {})) {
    for (const r of items || []) {
      if (r.type !== 'book') continue;
      if (!refsByRaw.has(r.title)) refsByRaw.set(r.title, []);
      refsByRaw.get(r.title).push({ bucket, raw: r.title, pick: !!r.frqncy_pick });
    }
  }

  // 2. Coverage: every content.json book ref resolves to a bed entry
  for (const [rawTitle, refs] of refsByRaw) {
    let match = null;
    for (const k of refSlugCandidates(rawTitle)) {
      if (bedByKey.has(k)) { match = bedByKey.get(k); break; }
    }
    if (!match) {
      flag('R1-COVERAGE-CONTENT', 'books', slugify(rawTitle), `content.json references "${rawTitle}" in ${refs.map(r => r.bucket).join(', ')} — no bed entry matches`);
      continue;
    }
    // 3. Reciprocity: bed entry's appears_in covers all referencing buckets
    const buckets = new Set(refs.map(r => r.bucket));
    const inAppears = new Set(match.appears_in || []);
    for (const b of buckets) {
      if (!inAppears.has(b)) flag('R1-RECIPROCITY', 'books', match.id, `content.json[${b}] references this book; bed appears_in does not include "${b}"`);
    }
    // Picks reciprocity: any bucket where frqncy_pick:true must be in picked_in
    const pickBuckets = refs.filter(r => r.pick).map(r => r.bucket);
    const inPicks = new Set(match.picked_in || []);
    for (const b of pickBuckets) {
      if (!inPicks.has(b)) flag('R1-RECIPROCITY-PICK', 'books', match.id, `content.json[${b}] marks frqncy_pick:true; bed picked_in does not include "${b}"`);
    }
  }

  // 4. Each bed entry has a built /books/<slug>/index.html
  const bookDirs = new Set(listDirs('books'));
  for (const b of books.books) {
    const slug = (b.id || '').replace(/^b-/, '');
    if (!slug) continue;
    if (!bookDirs.has(slug)) flag('R1-COVERAGE-DIR', 'books', b.id, `no /books/${slug}/ directory`);
    else if (!fs.existsSync(path.join(ROOT, 'books', slug, 'index.html'))) flag('R1-COVERAGE-DIR', 'books', b.id, `directory exists but no index.html`);
  }

  // 5. Orphan directories
  for (const d of bookDirs) {
    if (!bedBySlug.has(d)) flag('R1-ORPHAN-DIR', 'books', `b-${d}`, `directory /books/${d}/ exists but has no bed entry`);
  }

  // 6. Valid refs in appears_in / picked_in
  for (const b of books.books) {
    for (const id of b.appears_in || []) {
      if (!allRefIds.has(id)) flag('R1-INVALID-REF', 'books', b.id, `appears_in references unknown id "${id}"`);
    }
    for (const id of b.picked_in || []) {
      if (!allRefIds.has(id)) flag('R1-INVALID-REF', 'books', b.id, `picked_in references unknown id "${id}"`);
      if (!(b.appears_in || []).includes(id)) flag('R1-PICK-SUBSET', 'books', b.id, `picked_in "${id}" not in appears_in`);
    }
  }

  // 7. Author resolution where claimed
  const peopleIds = new Set(people.people.map(p => p.id));
  for (const b of books.books) {
    if (b.author_is_person_ref === true) {
      if (typeof b.author !== 'string' || !b.author.startsWith('p-')) {
        flag('R1-AUTHOR-RES', 'books', b.id, `author_is_person_ref:true but author "${b.author}" is not a p- ref`);
      } else if (!peopleIds.has(b.author)) {
        flag('R1-AUTHOR-RES', 'books', b.id, `author "${b.author}" not found in people bed`);
      }
    }
  }
}

function l1People() {
  const bedBySlug = new Map();
  const bedByKey = new Map();
  for (const p of people.people) {
    if (p.id) bedBySlug.set(p.id.replace(/^p-/, ''), p);
    for (const k of bedSlugCandidates(p, 'p')) if (k) bedByKey.set(k, p);
  }

  const refsByRaw = new Map();
  for (const [bucket, items] of Object.entries(content.resources || {})) {
    for (const r of items || []) {
      if (r.type !== 'person') continue;
      if (!refsByRaw.has(r.title)) refsByRaw.set(r.title, []);
      refsByRaw.get(r.title).push({ bucket, raw: r.title, pick: !!r.frqncy_pick });
    }
  }

  for (const [rawTitle, refs] of refsByRaw) {
    let match = null;
    for (const k of refSlugCandidates(rawTitle)) {
      if (bedByKey.has(k)) { match = bedByKey.get(k); break; }
    }
    if (!match) {
      flag('R1-COVERAGE-CONTENT', 'people', slugify(rawTitle), `content.json references "${rawTitle}" in ${refs.map(r => r.bucket).join(', ')} — no bed entry matches`);
      continue;
    }
    const buckets = new Set(refs.map(r => r.bucket));
    const inAppears = new Set(match.appears_in || []);
    for (const b of buckets) {
      if (!inAppears.has(b)) flag('R1-RECIPROCITY', 'people', match.id, `content.json[${b}] references this person; bed appears_in does not include "${b}"`);
    }
    const pickBuckets = refs.filter(r => r.pick).map(r => r.bucket);
    const inPicks = new Set(match.picked_in || []);
    for (const b of pickBuckets) {
      if (!inPicks.has(b)) flag('R1-RECIPROCITY-PICK', 'people', match.id, `content.json[${b}] marks frqncy_pick:true; bed picked_in does not include "${b}"`);
    }
  }

  const peopleDirs = new Set(listDirs('people'));
  for (const p of people.people) {
    const slug = (p.id || '').replace(/^p-/, '');
    if (!slug) continue;
    if (!peopleDirs.has(slug)) flag('R1-COVERAGE-DIR', 'people', p.id, `no /people/${slug}/ directory`);
    else if (!fs.existsSync(path.join(ROOT, 'people', slug, 'index.html'))) flag('R1-COVERAGE-DIR', 'people', p.id, `directory exists but no index.html`);
  }

  for (const d of peopleDirs) {
    if (!bedBySlug.has(d)) flag('R1-ORPHAN-DIR', 'people', `p-${d}`, `directory /people/${d}/ exists but has no bed entry`);
  }

  for (const p of people.people) {
    for (const id of p.appears_in || []) {
      if (!allRefIds.has(id)) flag('R1-INVALID-REF', 'people', p.id, `appears_in references unknown id "${id}"`);
    }
    for (const id of p.picked_in || []) {
      if (!allRefIds.has(id)) flag('R1-INVALID-REF', 'people', p.id, `picked_in references unknown id "${id}"`);
      if (!(p.appears_in || []).includes(id)) flag('R1-PICK-SUBSET', 'people', p.id, `picked_in "${id}" not in appears_in`);
    }
  }
}

// ───────────────────────── L2 depth ─────────────────────────
function l2Books() {
  for (const b of books.books) {
    const id = b.id || '<no-id>';
    if (typeof b.bio === 'string' && b.bio.length < BIO_FLOOR.books) {
      warn('R2-BIO-STUB', 'books', id, `bio ${b.bio.length} chars (<${BIO_FLOOR.books})`);
    }
    if (b.author_is_person_ref !== true) {
      warn('R2-AUTHOR-UNRES', 'books', id, `author "${b.author}" not linked to people bed`);
    }
    if (typeof b.intro !== 'string' || !b.intro.trim()) {
      warn('R2-INTRO-MISSING', 'books', id, 'no intro field — page renders bio only');
    }
    if (!b.quote || (typeof b.quote === 'object' && !b.quote.text) || (typeof b.quote === 'string' && !b.quote.trim())) {
      warn('R2-QUOTE-MISSING', 'books', id, 'no quote field');
    }
    const slug = (b.id || '').replace(/^b-/, '');
    const wc = bodyWordCount(path.join(ROOT, 'books', slug, 'index.html'));
    if (wc !== null && wc < PAGE_FLOOR.books) {
      warn('R2-PAGE-STUB', 'books', id, `rendered page ${wc} words (<${PAGE_FLOOR.books})`);
    }
  }
}

function l2People() {
  for (const p of people.people) {
    const id = p.id || '<no-id>';
    if (typeof p.bio === 'string' && p.bio.length < BIO_FLOOR.people) {
      warn('R2-BIO-STUB', 'people', id, `bio ${p.bio.length} chars (<${BIO_FLOOR.people})`);
    }
    if (!Array.isArray(p.life_story) || p.life_story.length === 0) {
      warn('R2-LIFE-STORY', 'people', id, `no life_story array`);
    }
    const slug = (p.id || '').replace(/^p-/, '');
    const wc = bodyWordCount(path.join(ROOT, 'people', slug, 'index.html'));
    if (wc !== null && wc < PAGE_FLOOR.people) {
      warn('R2-PAGE-STUB', 'people', id, `rendered page ${wc} words (<${PAGE_FLOOR.people})`);
    }
  }
}

// ───────────────────────── L3 liveness (consume only) ─────────────────────────
function l3External() {
  const lhPath = path.join(ROOT, 'link-health.json');
  if (!fs.existsSync(lhPath)) {
    warn('R3-NO-LINK-HEALTH', 'meta', '*', 'link-health.json missing — run `npm run check:links` first');
    return;
  }
  const lh = JSON.parse(fs.readFileSync(lhPath, 'utf8'));
  const broken = (lh.broken || []).concat(lh.errors || []);
  for (const entry of broken) {
    if (!entry.from) continue;
    const m = entry.from.match(/^(books|people)\.json:(.+)$/);
    if (!m) continue;
    const [, bedFile, label] = m;
    warn('R3-LINK-DEAD', bedFile, label, `${entry.url} → ${entry.status || entry.error || 'dead'}`);
  }
}

// ───────────────────────── run ─────────────────────────
const runBooks = !bedFilter || bedFilter === 'books';
const runPeople = !bedFilter || bedFilter === 'people';

if (runBooks) { l0Books(); l1Books(); l2Books(); }
if (runPeople) { l0People(); l1People(); l2People(); }
if (externalMode) l3External();

// ───────────────────────── render ─────────────────────────
function renderReport() {
  const flagged = findings.filter(f => f.severity === 'flag');
  const watch = findings.filter(f => f.severity === 'watch');

  const date = new Date().toISOString().slice(0, 10);
  const total = books.books.length + people.people.length;
  const flaggedIds = new Set(flagged.map(f => f.id));
  const watchIds = new Set(watch.map(f => f.id));
  const allIds = new Set([...books.books.map(b => b.id), ...people.people.map(p => p.id)]);
  const approvedCount = [...allIds].filter(id => !flaggedIds.has(id) && !watchIds.has(id)).length;

  const lines = [];
  lines.push(`# Books + People bed QA — ${date}`);
  lines.push('');
  lines.push(`**Beds:** books (${books.books.length}) · people (${people.people.length})`);
  lines.push(`**Findings:** ✗ ${flagged.length} hard · ⚪ ${watch.length} watch`);
  lines.push(`**Status:** ${flaggedIds.size} flagged · ${watchIds.size - [...watchIds].filter(id => flaggedIds.has(id)).length} watchlist · ${approvedCount} approved (of ${total})`);
  lines.push('');

  function table(rows) {
    if (!rows.length) return ['_(none)_', ''];
    const out = ['| rule | bed | id | message |', '|---|---|---|---|'];
    for (const r of rows) out.push(`| \`${r.rule}\` | ${r.bed} | \`${r.id}\` | ${r.msg.replace(/\|/g, '\\|')} |`);
    out.push('');
    return out;
  }

  lines.push(`## ✗ Flagged — L0/L1 (${flagged.length})`);
  lines.push('');
  lines.push(...table(flagged));

  lines.push(`## ⚪ Watchlist — L2/L3 (${watch.length})`);
  lines.push('');
  lines.push(...table(watch));

  lines.push(`## ✓ Approved — entries with zero findings (${approvedCount})`);
  lines.push('');
  lines.push('_Listing suppressed for brevity. Re-run with `--verbose` if needed._');
  lines.push('');

  // Rule-code summary (by frequency)
  const byRule = new Map();
  for (const f of findings) byRule.set(f.rule, (byRule.get(f.rule) || 0) + 1);
  const sorted = [...byRule.entries()].sort((a, b) => b[1] - a[1]);
  if (sorted.length) {
    lines.push(`## Rule-code summary`);
    lines.push('');
    lines.push('| rule | count |');
    lines.push('|---|---|');
    for (const [rule, count] of sorted) lines.push(`| \`${rule}\` | ${count} |`);
    lines.push('');
  }

  return lines.join('\n');
}

const report = renderReport();
process.stdout.write(report);

if (wantsReport) {
  const date = new Date().toISOString().slice(0, 10);
  const dest = reportArg
    ? path.resolve(reportArg)
    : path.join(ROOT, 'audits', 'beds', 'runs', `${date}-bed-qa.md`);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, report, 'utf8');
  process.stderr.write(`\n\n→ Wrote ${path.relative(ROOT, dest)}\n`);
}

process.exitCode = findings.some(f => f.severity === 'flag') ? 1 : 0;
