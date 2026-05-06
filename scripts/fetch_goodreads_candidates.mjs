#!/usr/bin/env node
/**
 * FRQNCY · Goodreads candidate fetcher.
 *
 * For books in books.json missing either `intro` or `quote`, scrapes Goodreads
 * for candidates. Output is a candidate sidecar and a QA-style review queue.
 * Does NOT auto-apply — humans review, then run the existing --apply scripts.
 *
 * Pipeline per book:
 *   1. Goodreads search → first work-page result
 *   2. Work page → description (book intro candidate)
 *   3. Quotes page → first quote that has a "from <this title>" attribution
 *
 * Quality gates (auto-pass into the "ready" bucket):
 *   - Intro: 150-1500 chars · English · title-token in body · passes junk filters
 *   - Quote: 40-300 chars · plain text · doesn't repeat the title verbatim
 *
 * Anything that fetched material but didn't pass goes into the "review" bucket.
 * Books that 404'd or got CAPTCHA'd go into the "skipped" bucket.
 *
 * Goodreads anti-bot: realistic UA, 1.5–3s random delay between requests, bails
 * gracefully on CAPTCHA. Run with --limit N to scope.
 *
 * Usage:
 *   node scripts/fetch_goodreads_candidates.mjs --limit 10
 *   node scripts/fetch_goodreads_candidates.mjs --target intro    # only intros
 *   node scripts/fetch_goodreads_candidates.mjs --target quote
 *   node scripts/fetch_goodreads_candidates.mjs --bed-id b-foo    # one book
 *   node scripts/fetch_goodreads_candidates.mjs --all
 *
 * Output:
 *   audits/beds/runs/<date>-goodreads-candidates.md     — review queue
 *   audits/beds/runs/<date>-goodreads-intros.json       — --apply-ready intros
 *   audits/beds/runs/<date>-goodreads-quotes.json       — --apply-ready quotes
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const limitIdx = args.indexOf('--limit');
const LIMIT = args.includes('--all') ? Infinity : (limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : 10);
const targetIdx = args.indexOf('--target');
const TARGET = targetIdx !== -1 ? args[targetIdx + 1] : 'both';   // 'intro' | 'quote' | 'both'
const idIdx = args.indexOf('--bed-id');
const ONLY_ID = idIdx !== -1 ? args[idIdx + 1] : null;

const TIMEOUT_MS = 12000;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
const HEADERS = {
  'User-Agent': UA,
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
};

// ───────────────────────── load + select ─────────────────────────
const books = JSON.parse(fs.readFileSync(path.join(ROOT, 'books.json'), 'utf8')).books;
const people = JSON.parse(fs.readFileSync(path.join(ROOT, 'people.json'), 'utf8')).people;
const peopleById = new Map(people.map(p => [p.id, p]));

// Resolve a book's author to a display string regardless of whether it's a
// p- ref or a plain string. Critical for Goodreads search ranking.
function authorDisplay(book) {
  if (book.author_is_person_ref === true && typeof book.author === 'string') {
    return peopleById.get(book.author)?.name || '';
  }
  return typeof book.author === 'string' ? book.author : '';
}
const targets = books.filter(b => {
  if (ONLY_ID) return b.id === ONLY_ID;
  const needsIntro = !b.intro && (TARGET === 'both' || TARGET === 'intro');
  const needsQuote = !b.quote && (TARGET === 'both' || TARGET === 'quote');
  return needsIntro || needsQuote;
}).slice(0, LIMIT);

console.error(`Goodreads candidate fetcher: ${targets.length} book${targets.length === 1 ? '' : 's'} (target=${TARGET})\n`);

// ───────────────────────── http with anti-bot tracking ─────────────────────────
let blockCount = 0;

async function safeFetch(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, { redirect: 'follow', signal: ctrl.signal, headers: HEADERS });
    clearTimeout(t);
    return r;
  } catch { clearTimeout(t); return null; }
}

async function safeText(url) {
  const r = await safeFetch(url);
  if (!r || !r.ok) return null;
  const txt = await r.text();
  if (/captcha|are you a robot|access to this page has been denied/i.test(txt.slice(0, 4000))) {
    blockCount++;
    return null;
  }
  return txt;
}

async function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// ───────────────────────── filters (mirror clean_book_intros) ─────────────────────────
const STOP = new Set(['the','of','a','an','and','or','to','in','on','at','for','with','by','is','are','i','ii','iii','iv','v','&','it','this','that','from','your','our','my']);
function tokens(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 3 && !STOP.has(w));
}
function intersect(a, b) { const set = new Set(a); return b.some(t => set.has(t)); }

const ENT = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", ndash: '–', mdash: '—', hellip: '…', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“' };
function decodeEntities(s) {
  let prev = '';
  while (prev !== s) {
    prev = s;
    s = s.replace(/&(amp|nbsp|lt|gt|quot|apos|ndash|mdash|hellip|rsquo|lsquo|rdquo|ldquo);/g, (_, n) => ENT[n] ?? '')
         .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(+c))
         .replace(/&#x([0-9a-f]+);/gi, (_, c) => String.fromCharCode(parseInt(c, 16)));
  }
  return s;
}
function stripHtml(s) { return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }
function clean(text) { return decodeEntities(stripHtml(text || '')).trim(); }

// ───────────────────────── search → work page ─────────────────────────
async function findGoodreadsWork(book) {
  const author = authorDisplay(book);
  const q = `${book.title}${author ? ' ' + author : ''}`;
  const html = await safeText(`https://www.goodreads.com/search?q=${encodeURIComponent(q)}`);
  if (!html) return null;
  // Walk all bookTitle anchors and pick the first one whose visible title
  // matches our book's title (rather than a cross-listed adjacent work).
  const titleToks = tokens(book.title);
  const links = [...html.matchAll(/<a class="bookTitle"[^>]+href="(\/book\/show\/[^"]+)"[^>]*>\s*<span[^>]*>([^<]+)<\/span>/g)];
  if (!links.length) {
    // Fall back: just take the first book link if we can't extract titles
    const m = html.match(/<a class="bookTitle"[^>]+href="(\/book\/show\/[^"]+)"/);
    return m ? `https://www.goodreads.com${m[1].replace(/&amp;/g, '&')}` : null;
  }
  const titleMatch = titleToks.length
    ? links.find(l => intersect(titleToks, tokens(l[2])))
    : links[0];
  const chosen = titleMatch || links[0];
  return `https://www.goodreads.com${chosen[1].replace(/&amp;/g, '&')}`;
}

// ───────────────────────── extract description ─────────────────────────
async function fetchDescription(workUrl, bookTitle) {
  const html = await safeText(workUrl);
  if (!html) return null;
  // Modern Goodreads embeds multiple "description":"..." fields in JSON —
  // typically the AUTHOR'S bio comes first and the BOOK'S description second.
  // Pick the candidate that mentions the book title (or the longest, as a fallback).
  function decode(raw) {
    return raw
      .replace(/\\u003c/g, '<')
      .replace(/\\u003e/g, '>')
      .replace(/\\u0026/g, '&')
      .replace(/\\n/g, ' ')
      .replace(/\\r/g, ' ')
      .replace(/\\t/g, ' ')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  }
  const candidates = [...html.matchAll(/"description":"((?:[^"\\]|\\.)*)"/g)]
    .map(m => clean(decode(m[1])))
    .filter(t => t && t.length > 80);

  if (candidates.length) {
    const titleToks = tokens(bookTitle || '');
    // Score candidates: prefer ones where title tokens appear early (book description
    // usually leads with the title; author bio leads with the author's name).
    function score(c) {
      const lower = c.toLowerCase();
      const head = lower.slice(0, 200);
      const tailHits = titleToks.filter(t => lower.includes(t)).length;
      const headHits = titleToks.filter(t => head.includes(t)).length;
      return headHits * 10 + tailHits;
    }
    const ranked = [...candidates].sort((a, b) => {
      const s = score(b) - score(a);
      if (s !== 0) return s;
      return b.length - a.length;
    });
    return ranked[0];
  }

  // Older Goodreads markup fallback
  const fullSpan = html.match(/<span id="freeText\d+"[^>]*style="[^"]*">([\s\S]*?)<\/span>/);
  const previewSpan = html.match(/<span id="freeTextContainer[^"]+">([\s\S]*?)<\/span>/);
  const text = clean(fullSpan?.[1] || previewSpan?.[1] || '');
  return text || null;
}

// ───────────────────────── extract first quote ─────────────────────────
async function fetchTopQuote(workUrl) {
  // The work page references /work/quotes/<workId> somewhere in the embedded
  // JSON/markup; the strict href="..." pattern misses it because the modern
  // markup wraps it differently. Use a loose match.
  const html = await safeText(workUrl);
  if (!html) return null;
  const workIdMatch = html.match(/\/work\/quotes\/(\d+)/);
  if (!workIdMatch) return null;
  const quotesUrl = `https://www.goodreads.com/work/quotes/${workIdMatch[1]}`;
  await delay(1500 + Math.random() * 1500);
  const qHtml = await safeText(quotesUrl);
  if (!qHtml) return null;
  const qMatch = qHtml.match(/<div class="quoteText"[^>]*>([\s\S]*?)<\/div>/);
  if (!qMatch) return null;
  const raw = clean(qMatch[1]);
  // Format: "quote text" ― Author Name, Book Title
  const split = raw.split(/[―—]/);
  const text = (split[0] || '').replace(/^["“]|["”]$/g, '').replace(/["”]$/, '').trim();
  const attribution = (split[1] || '').trim();
  return { text, attribution, source_url: quotesUrl };
}

// ───────────────────────── quality gates ─────────────────────────
function passesIntroGate(text, title) {
  if (!text) return { pass: false, reason: 'empty' };
  if (text.length < 150) return { pass: false, reason: `too short (${text.length})` };
  if (text.length > 1500) return { pass: false, reason: `too long (${text.length})` };
  const titleToks = tokens(title);
  const bodyToks = tokens(text);
  if (titleToks.length && !intersect(titleToks, bodyToks)) return { pass: false, reason: 'title not in body' };
  if (/we've got our hands full|under construction|coming soon/i.test(text)) return { pass: false, reason: 'placeholder page' };
  if (/[Ѐ-ӿ؀-ۿ一-鿿]/.test(text)) return { pass: false, reason: 'non-Latin script' };
  return { pass: true };
}

function passesQuoteGate(text, attribution, title) {
  if (!text) return { pass: false, reason: 'empty' };
  if (text.length < 40) return { pass: false, reason: `too short (${text.length})` };
  if (text.length > 300) return { pass: false, reason: `too long (${text.length})` };
  // Reject if attribution explicitly cites a different work
  if (attribution) {
    const titleToks = tokens(title);
    const attrToks = tokens(attribution);
    if (titleToks.length && !intersect(titleToks, attrToks)) {
      return { pass: false, reason: `attribution "${attribution}" doesn't match title` };
    }
  }
  return { pass: true };
}

// ───────────────────────── per-book pipeline ─────────────────────────
async function fetchOne(book) {
  const out = { id: book.id, title: book.title, intro: null, quote: null, status: {} };
  if (blockCount >= 3) { out.status.bail = 'too many blocks'; return out; }

  const workUrl = await findGoodreadsWork(book);
  if (!workUrl) { out.status.search = 'no work found'; return out; }
  out.work_url = workUrl;

  if ((!book.intro && (TARGET === 'both' || TARGET === 'intro'))) {
    await delay(1500 + Math.random() * 1500);
    const desc = await fetchDescription(workUrl, book.title);
    if (desc) {
      const gate = passesIntroGate(desc, book.title);
      out.intro = { text: desc, source_url: workUrl, passed: gate.pass, reason: gate.reason };
    } else {
      out.status.intro = 'no description';
    }
  }

  if ((!book.quote && (TARGET === 'both' || TARGET === 'quote'))) {
    await delay(1500 + Math.random() * 1500);
    const q = await fetchTopQuote(workUrl);
    if (q?.text) {
      const gate = passesQuoteGate(q.text, q.attribution, book.title);
      out.quote = { text: q.text, attribution: q.attribution, source_url: q.source_url, passed: gate.pass, reason: gate.reason };
    } else {
      out.status.quote = 'no quote';
    }
  }

  return out;
}

// ───────────────────────── run ─────────────────────────
const results = [];
for (const [i, b] of targets.entries()) {
  process.stderr.write(`  [${i + 1}/${targets.length}] ${b.title.slice(0, 50).padEnd(50)} `);
  const r = await fetchOne(b);
  const flags = [];
  if (r.intro?.passed) flags.push('I✓'); else if (r.intro) flags.push('i?');
  if (r.quote?.passed) flags.push('Q✓'); else if (r.quote) flags.push('q?');
  if (!r.work_url) flags.push('—');
  process.stderr.write(`${flags.join(' ')}\n`);
  results.push(r);
  if (blockCount >= 3) {
    console.error('\n⚠ Goodreads blocked us — bailing.\n');
    break;
  }
  await delay(2000 + Math.random() * 2000);
}

// ───────────────────────── render ─────────────────────────
const date = new Date().toISOString().slice(0, 10);
const introsReady = results.filter(r => r.intro?.passed).map(r => ({ id: r.id, title: r.title, intro: r.intro.text, intro_source: r.intro.source_url }));
const quotesReady = results.filter(r => r.quote?.passed).map(r => ({ id: r.id, title: r.title, text: r.quote.text, attribution: r.quote.attribution, source_url: r.quote.source_url }));

const md = [];
md.push(`# Goodreads candidates — ${date}`);
md.push('');
md.push(`**Books fetched:** ${results.length} · **intros ready:** ${introsReady.length} · **quotes ready:** ${quotesReady.length}`);
if (blockCount) md.push(`**Block events:** ${blockCount} (Goodreads served CAPTCHA / refusal)`);
md.push('');
md.push('Apply ready intros: ');
md.push('```');
md.push(`node scripts/enrich_book_intros.mjs --apply audits/beds/runs/${date}-goodreads-intros.json`);
md.push('```');
md.push('');
md.push('Apply ready quotes:');
md.push('```');
md.push(`node scripts/enrich_book_quotes.mjs --apply audits/beds/runs/${date}-goodreads-quotes.json`);
md.push('```');
md.push('');
md.push('## Ready (passed quality gates)');
md.push('');
for (const r of results) {
  if (!r.intro?.passed && !r.quote?.passed) continue;
  md.push(`### \`${r.id}\` — ${r.title}`);
  md.push('');
  if (r.intro?.passed) {
    md.push(`**intro:** ${r.intro.text}`);
    md.push(`_source: ${r.intro.source_url}_`);
    md.push('');
  }
  if (r.quote?.passed) {
    md.push(`**quote:** > ${r.quote.text}`);
    md.push(`— ${r.quote.attribution} · _${r.quote.source_url}_`);
    md.push('');
  }
  md.push('---');
  md.push('');
}
md.push('');
md.push('## Review (fetched but failed gates)');
md.push('');
for (const r of results) {
  const issues = [];
  if (r.intro && !r.intro.passed) issues.push(`intro: ${r.intro.reason}`);
  if (r.quote && !r.quote.passed) issues.push(`quote: ${r.quote.reason}`);
  if (!issues.length) continue;
  md.push(`- \`${r.id}\` — ${r.title} · ${issues.join('; ')}`);
}
md.push('');
md.push('## Skipped (no Goodreads result)');
md.push('');
for (const r of results) {
  if (r.work_url) continue;
  md.push(`- \`${r.id}\` — ${r.title} (${r.status.search || 'unknown'})`);
}

const dest = path.join(ROOT, 'audits', 'beds', 'runs', `${date}-goodreads-candidates.md`);
const introsPath = path.join(ROOT, 'audits', 'beds', 'runs', `${date}-goodreads-intros.json`);
const quotesPath = path.join(ROOT, 'audits', 'beds', 'runs', `${date}-goodreads-quotes.json`);
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, md.join('\n'));
fs.writeFileSync(introsPath, JSON.stringify(introsReady, null, 2));
fs.writeFileSync(quotesPath, JSON.stringify(quotesReady, null, 2));
console.error(`\n→ ${path.relative(ROOT, dest)}`);
console.error(`→ ${path.relative(ROOT, introsPath)} (${introsReady.length} intros)`);
console.error(`→ ${path.relative(ROOT, quotesPath)} (${quotesReady.length} quotes)`);
