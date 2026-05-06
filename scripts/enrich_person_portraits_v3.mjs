#!/usr/bin/env node
/**
 * FRQNCY · Person portrait enrichment v3 — Goodreads author photos.
 *
 * For people whose canonical site didn't expose og:image (v2 misses), search
 * Goodreads' author index. Most authors have an author profile page with a
 * portrait image hosted on Goodreads' Amazon CDN — stable for hot-linking.
 *
 * Pipeline per person:
 *   1. Search /search?q=<name> → first author-card link
 *   2. Fetch the author page → extract og:image (which is the portrait)
 *   3. Verify it's a real image, not a placeholder
 *
 * Pseudonymous / historical-anonymous figures are skipped (passed via SKIP_IDS).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const TIMEOUT_MS = 12000;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';

const SKIP_IDS = new Set([
  'p-hermes-trismegistus',  // mythological
  'p-three-initiates',      // anonymous authors
  'p-satoshi-nakamoto',     // pseudonym (already covered if found, this is just safety)
]);

const peoplePath = path.join(ROOT, 'people.json');
const peopleData = JSON.parse(fs.readFileSync(peoplePath, 'utf8'));

const targets = peopleData.people.filter(p => !p.image && !SKIP_IDS.has(p.id));
console.error(`Goodreads portrait v3: ${targets.length} people\n`);

async function safeFetch(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, {
      redirect: 'follow',
      signal: ctrl.signal,
      headers: { 'User-Agent': UA, 'Accept': 'text/html,*/*', 'Accept-Language': 'en-US,en;q=0.9' },
    });
    clearTimeout(t);
    return r;
  } catch { clearTimeout(t); return null; }
}

async function safeText(url) {
  const r = await safeFetch(url);
  if (!r || !r.ok) return null;
  return await r.text();
}

function nameTokens(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2);
}

async function findAuthorPage(person) {
  const html = await safeText(`https://www.goodreads.com/search?q=${encodeURIComponent(person.name)}`);
  if (!html) return null;
  // Match every author-result anchor (href can be absolute or relative).
  const matches = [...html.matchAll(/<a[^>]+class="authorName"[^>]+href="((?:https:\/\/www\.goodreads\.com)?\/author\/show\/[^"]+)"[^>]*>([^<]+)<\/a>/g)];
  if (!matches.length) return null;
  // Pick the first author whose visible name shares all tokens with our person.
  const wantTokens = new Set(nameTokens(person.name));
  for (const m of matches) {
    const visibleName = m[2].trim();
    const candidateTokens = new Set(nameTokens(visibleName));
    // Require every want-token to appear in candidate (so "Naval Ravikant" matches "Naval Ravikant" but not "Eric Jorgenson")
    let allFound = true;
    for (const t of wantTokens) {
      if (t.length > 2 && !candidateTokens.has(t)) { allFound = false; break; }
    }
    if (allFound) {
      const href = m[1].startsWith('http') ? m[1] : `https://www.goodreads.com${m[1]}`;
      return href.replace(/&amp;/g, '&');
    }
  }
  // No exact match → fall back to first hit (better than nothing for unusual names)
  const fallback = matches[0][1];
  return (fallback.startsWith('http') ? fallback : `https://www.goodreads.com${fallback}`).replace(/&amp;/g, '&');
}

function extractOgImage(html) {
  if (!html) return null;
  const og = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)
    || html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i);
  return og ? og[1] : null;
}

async function verifyImage(url) {
  const r = await safeFetch(url);
  if (!r || !r.ok) return false;
  const ct = r.headers.get('content-type') || '';
  if (!/^image\//i.test(ct)) return false;
  const buf = await r.arrayBuffer();
  // Goodreads "no photo" placeholder is ~3KB; real photos are 10KB+
  return buf.byteLength > 6000;
}

async function findGoodreadsPortrait(person) {
  const authorUrl = await findAuthorPage(person);
  if (!authorUrl) return null;
  const html = await safeText(authorUrl);
  if (!html) return null;
  const og = extractOgImage(html);
  if (!og) return null;
  if (!(await verifyImage(og))) return null;
  return { url: og, source: authorUrl };
}

const results = [];
for (const [i, p] of targets.entries()) {
  process.stderr.write(`  [${i + 1}/${targets.length}] ${p.name.slice(0, 50).padEnd(50)} `);
  const r = await findGoodreadsPortrait(p);
  process.stderr.write(`${r ? '✓' : '·'}\n`);
  if (r) results.push({ id: p.id, name: p.name, image: r.url, image_source: r.source });
  await new Promise(res => setTimeout(res, 800 + Math.random() * 800));
}

const date = new Date().toISOString().slice(0, 10);
const sidecar = path.join(ROOT, 'audits', 'beds', 'runs', `${date}-person-portraits-v3.json`);
fs.mkdirSync(path.dirname(sidecar), { recursive: true });
fs.writeFileSync(sidecar, JSON.stringify(results, null, 2));

if (APPLY) {
  for (const r of results) {
    const p = peopleData.people.find(p => p.id === r.id);
    if (p) { p.image = r.image; p.image_source = r.image_source; }
  }
  fs.writeFileSync(peoplePath, JSON.stringify(peopleData, null, 2) + '\n');
  console.log(`\nApplied ${results.length} portraits.`);
} else {
  console.log(`\nFound ${results.length} portraits.`);
  console.log(`Apply: --apply`);
}
