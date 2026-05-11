#!/usr/bin/env node
/**
 * FRQNCY · Book quote enrichment.
 *
 * For each book in books.json without a `quote` field, attempts to pull a
 * single representative gist quote from the book itself.
 *
 * Pipeline:
 *   1. Find an Internet Archive readable copy via the IA search API.
 *   2. Fetch the IA full-text stream (plain-text OCR) for that item.
 *   3. Send a sampled excerpt to the Anthropic API and ask for ONE quote
 *      that captures the gist — text + page-context attribution.
 *   4. Append to a queue file. Editor reviews, approves, then runs --apply
 *      to write `quote: { text, attribution, source_url }` back into books.json.
 *
 * Wikipedia is not used.
 *
 * Requirements:
 *   ANTHROPIC_API_KEY in env (or pulled from ~/.frqncy-harness/auth/keys.json
 *   if present, matching the pattern used by qa_imagery.py).
 *
 * Usage:
 *   node scripts/enrich_book_quotes.mjs --limit 5
 *   node scripts/enrich_book_quotes.mjs --bed-id b-the-power-of-now
 *   node scripts/enrich_book_quotes.mjs --apply audits/beds/runs/<file>.json
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { query } from '@anthropic-ai/claude-agent-sdk';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const limitIdx = args.indexOf('--limit');
const LIMIT = args.includes('--all') ? Infinity : (limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : 5);
const idIdx = args.indexOf('--bed-id');
const ONLY_ID = idIdx !== -1 ? args[idIdx + 1] : null;
const applyIdx = args.indexOf('--apply');
const APPLY_FILE = applyIdx !== -1 ? args[applyIdx + 1] : null;
const TIMEOUT_MS = 15000;
const UA = 'FRQNCY-quote-enrichment/0.1 (+https://frqncy.network)';
const MODEL = 'claude-sonnet-4-6';
const SAMPLE_CHARS = 60000;   // ~15k tokens of book text per call
const MAX_RETRIES = 2;

// ───────────────────────── apply mode ─────────────────────────
if (APPLY_FILE) {
  const approved = JSON.parse(fs.readFileSync(path.resolve(APPLY_FILE), 'utf8'));
  const booksPath = path.join(ROOT, 'books.json');
  const data = JSON.parse(fs.readFileSync(booksPath, 'utf8'));
  let written = 0;
  for (const entry of approved) {
    const book = data.books.find(b => b.id === entry.id);
    if (!book) { console.warn(`skip: ${entry.id} not in books.json`); continue; }
    book.quote = { text: entry.text, attribution: entry.attribution || book.title, source_url: entry.source_url };
    written++;
  }
  fs.writeFileSync(booksPath, JSON.stringify(data, null, 2) + '\n');
  console.log(`Wrote ${written} quote fields to books.json`);
  process.exit(0);
}

// LLM provider: @anthropic-ai/claude-agent-sdk in-process. Auth falls through
// to ANTHROPIC_API_KEY or the Claude Code login at ~/.claude/.credentials.json.
console.error('Using @anthropic-ai/claude-agent-sdk (Claude Code auth)\n');

// ───────────────────────── load + select ─────────────────────────
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
const targets = books.books.filter(b => {
  if (ONLY_ID) return b.id === ONLY_ID;
  return !b.quote;
}).slice(0, LIMIT);

console.error(`Quote enrichment: ${targets.length} book${targets.length === 1 ? '' : 's'} to attempt.\n`);

// ───────────────────────── http ─────────────────────────
async function safeFetch(url, opts = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { redirect: 'follow', signal: ctrl.signal, headers: { 'User-Agent': UA, ...(opts.headers || {}) } });
    clearTimeout(timer);
    return res;
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

async function findArchiveCandidates(book) {
  const author = authorDisplay(book);
  const titleQ = book.title.replace(/[":]/g, ' ').replace(/\s+/g, ' ').trim();
  const authorQ = author ? author.split('&')[0].split(',')[0].split(' (')[0].trim().replace(/[":]/g, ' ').trim() : '';
  // Filter out collections that can't be fully downloaded (in-library only).
  const q = `title:(${JSON.stringify(titleQ)})${authorQ ? ` AND creator:(${JSON.stringify(authorQ)})` : ''} AND mediatype:texts AND -collection:inlibrary`;
  const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(q)}&fl[]=identifier&fl[]=collection&rows=12&output=json`;
  const res = await safeFetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return (data?.response?.docs || []).map(d => d.identifier).filter(Boolean);
}

async function fetchPlainText(identifier) {
  // Use the metadata endpoint to find a public-domain plain-text file.
  // /download/<id>/<id>_djvu.txt returns 401 for restricted items, which the
  // search filter alone doesn't always catch — so we ask the metadata first.
  const meta = await safeFetch(`https://archive.org/metadata/${identifier}`);
  if (!meta.ok) return null;
  let metadata;
  try { metadata = await meta.json(); } catch { return null; }
  if (metadata?.is_dark) return null;
  if (metadata?.metadata?.['access-restricted-item'] === 'true') return null;
  const files = metadata?.files || [];
  // Prefer DjVuTXT, then plain text, then OCR Search Text
  const txtFile = files.find(f => /_djvu\.txt$/i.test(f.name) && f.format !== 'Metadata')
    || files.find(f => /\.txt$/i.test(f.name) && /TXT/i.test(f.format || ''));
  if (!txtFile) return null;
  const url = `https://archive.org/download/${identifier}/${encodeURIComponent(txtFile.name)}`;
  const res = await safeFetch(url);
  if (!res.ok) return null;
  const ct = res.headers.get('content-type') || '';
  if (/text\/html/i.test(ct)) return null;
  const txt = await res.text();
  return txt.length >= 1000 ? txt : null;
}

function sampleMiddle(text, size) {
  if (!text) return '';
  if (text.length <= size) return text;
  const start = Math.floor((text.length - size) / 2);
  return text.slice(start, start + size);
}

// ───────────────────────── claude agent sdk ─────────────────────────
async function askForQuote(book, excerpt) {
  const system = `You are a careful editor selecting a single representative gist quote from a book for a literary network called FRQNCY. The quote must be:
- Verbatim from the excerpt provided (no paraphrasing).
- 1 to 4 sentences, max ~250 characters.
- Self-contained — readable without surrounding context.
- Captures the book's central insight or voice (not a throwaway sentence).
- Avoid quotes that name living people unrelated to the book or contain dated references.

Respond with ONLY valid JSON: {"quote": "...", "attribution": "..."} where attribution is the book title (and chapter or page if discernible). If no suitable quote exists in the excerpt, respond with {"quote": "", "attribution": ""}.`;

  const user = `Book: ${book.title}\nAuthor: ${authorDisplay(book) || '—'}\n\nExcerpt:\n\n${excerpt}`;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      let result = '';
      for await (const msg of query({
        prompt: user,
        options: {
          systemPrompt: system,
          model: MODEL,
          allowedTools: [],     // pure text — no bash, no file access, no web
          maxTurns: 3,
          permissionMode: 'bypassPermissions',
          settingSources: [],   // CRITICAL — skip user settings so the parent's Stop hook doesn't fire ("MEMORY-NOOP")
        },
      })) {
        if (msg.type === 'result' && msg.subtype === 'success') {
          result = msg.result || '';
        } else if (msg.type === 'assistant' && msg.message?.content) {
          for (const block of msg.message.content) {
            if (block.type === 'text') result += block.text;
          }
        }
      }
      const m = result.match(/\{[\s\S]*\}/);
      if (!m) {
        if (process.env.DEBUG) console.error(`\n  raw model response:\n${result.slice(0, 500)}\n`);
        return null;
      }
      const parsed = JSON.parse(m[0]);
      if (!parsed.quote) {
        if (process.env.DEBUG) console.error(`\n  empty quote, raw: ${JSON.stringify(parsed)}\n`);
        return null;
      }
      return parsed;
    } catch (e) {
      if (attempt === MAX_RETRIES) throw e;
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
}

// ───────────────────────── per-book ─────────────────────────
async function enrich(book) {
  const out = { id: book.id, title: book.title, status: 'pending' };
  try {
    const candidates = await findArchiveCandidates(book);
    if (!candidates.length) { out.status = 'no_archive_item'; return out; }
    let fullText = null;
    let identifier = null;
    for (const id of candidates) {
      const t = await fetchPlainText(id);
      if (t) { fullText = t; identifier = id; break; }
    }
    if (!fullText) {
      out.source_url = `https://archive.org/details/${candidates[0]}`;
      out.status = 'no_fulltext';
      return out;
    }
    out.source_url = `https://archive.org/details/${identifier}`;
    const excerpt = sampleMiddle(fullText, SAMPLE_CHARS);
    const result = await askForQuote(book, excerpt);
    if (!result) { out.status = 'no_quote'; return out; }
    out.text = result.quote;
    out.attribution = result.attribution || book.title;
    out.status = 'ok';
  } catch (e) {
    out.status = 'error';
    out.error = String(e.message || e);
  }
  return out;
}

// ───────────────────────── run ─────────────────────────
const results = [];
for (const [i, book] of targets.entries()) {
  process.stderr.write(`  [${i + 1}/${targets.length}] ${book.title.slice(0, 55).padEnd(55)} `);
  const r = await enrich(book);
  process.stderr.write(`${r.status === 'ok' ? '✓' : '·'} ${r.status}\n`);
  results.push(r);
  await new Promise(res => setTimeout(res, 500));
}

// ───────────────────────── render queue ─────────────────────────
const date = new Date().toISOString().slice(0, 10);
const ok = results.filter(r => r.status === 'ok');
const skipped = results.filter(r => r.status !== 'ok');

const md = [];
md.push(`# Book quote enrichment — ${date}`);
md.push('');
md.push(`**Books processed:** ${results.length} · **quotes returned:** ${ok.length} · **skipped:** ${skipped.length}`);
md.push(`**Source:** Internet Archive full-text only. Wikipedia not used.`);
md.push('');
md.push('Review each quote below. To apply approved quotes, save the JSON sidecar (auto-written next to this file) with only the entries you want kept, then run:');
md.push('');
md.push('```');
md.push(`node scripts/enrich_book_quotes.mjs --apply audits/beds/runs/${date}-book-quotes.json`);
md.push('```');
md.push('');
for (const r of results) {
  md.push(`### \`${r.id}\` — ${r.title}`);
  md.push('');
  if (r.status === 'ok') {
    md.push(`> ${r.text}`);
    md.push('');
    md.push(`— ${r.attribution} · [source](${r.source_url})`);
  } else {
    md.push(`_status:_ \`${r.status}\`${r.error ? ` — ${r.error}` : ''}${r.source_url ? `\n_archive item:_ ${r.source_url}` : ''}`);
  }
  md.push('');
  md.push('---');
  md.push('');
}

const dest = path.join(ROOT, 'audits', 'beds', 'runs', `${date}-book-quotes.md`);
const sidecar = path.join(ROOT, 'audits', 'beds', 'runs', `${date}-book-quotes.json`);
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, md.join('\n'));
fs.writeFileSync(sidecar, JSON.stringify(ok, null, 2));
console.error(`\n→ Wrote ${path.relative(ROOT, dest)}\n→ Wrote ${path.relative(ROOT, sidecar)} (apply candidates)`);
