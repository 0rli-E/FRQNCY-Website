#!/usr/bin/env node
/**
 * FRQNCY · Person portrait enrichment v2.
 *
 * For people without a portrait after the v1 Open Library pass, scrapes
 * og:image from the person's own canonical site. Most authors put a headshot
 * on their site (homepage, /about, /biography) and expose it as og:image.
 *
 * Pipeline per person:
 *   1. Fetch p.url, p.url/about, p.url/biography, p.url/about-me, p.url/bio
 *   2. Extract og:image meta tag from each
 *   3. Verify the URL returns a real image (≥5KB, image/* content type)
 *   4. Take the first valid hit
 *
 * No Wikipedia. Image URLs are stored as-is and hot-linked from the live site.
 *
 * Usage:
 *   node scripts/enrich_person_portraits_v2.mjs
 *   node scripts/enrich_person_portraits_v2.mjs --all --apply
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const limitIdx = args.indexOf('--limit');
const LIMIT = args.includes('--all') ? Infinity : (limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : 25);
const APPLY = args.includes('--apply');
const TIMEOUT_MS = 10000;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';

const peoplePath = path.join(ROOT, 'people.json');
const peopleData = JSON.parse(fs.readFileSync(peoplePath, 'utf8'));

const targets = peopleData.people.filter(p => !p.image && p.url).slice(0, LIMIT);

console.error(`Person portrait v2: ${targets.length} people to attempt\n`);

async function safeFetch(url, headers = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, { redirect: 'follow', signal: ctrl.signal, headers: { 'User-Agent': UA, ...headers } });
    clearTimeout(t);
    return r;
  } catch { clearTimeout(t); return null; }
}

async function fetchHtml(url) {
  const r = await safeFetch(url, { Accept: 'text/html,application/xhtml+xml' });
  if (!r || !r.ok) return null;
  const ct = r.headers.get('content-type') || '';
  if (!/text\/html|application\/xhtml/i.test(ct)) return null;
  return await r.text();
}

function extractOgImage(html) {
  if (!html) return null;
  const og = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)
    || html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
  return og ? og[1] : null;
}

function resolveUrl(maybeUrl, base) {
  if (!maybeUrl) return null;
  try { return new URL(maybeUrl, base).toString(); } catch { return null; }
}

async function verifyImage(url) {
  const r = await safeFetch(url);
  if (!r || !r.ok) return false;
  const ct = r.headers.get('content-type') || '';
  if (!/^image\//i.test(ct)) return false;
  const buf = await r.arrayBuffer();
  return buf.byteLength > 5000;     // skip tiny placeholder pixels
}

async function findPortrait(person) {
  const base = person.url.replace(/\/$/, '');
  const candidates = [base, `${base}/about`, `${base}/biography`, `${base}/bio`, `${base}/about-me`, `${base}/about-us`];
  const seenImages = new Set();
  for (const pageUrl of candidates) {
    const html = await fetchHtml(pageUrl);
    if (!html) continue;
    const ogUrl = extractOgImage(html);
    const resolved = resolveUrl(ogUrl, pageUrl);
    if (!resolved || seenImages.has(resolved)) continue;
    seenImages.add(resolved);
    if (await verifyImage(resolved)) return { url: resolved, source: pageUrl };
  }
  return null;
}

const results = [];
for (const [i, p] of targets.entries()) {
  process.stderr.write(`  [${i + 1}/${targets.length}] ${p.name.slice(0, 50).padEnd(50)} `);
  const r = await findPortrait(p);
  process.stderr.write(`${r ? '✓' : '·'}\n`);
  if (r) results.push({ id: p.id, name: p.name, image: r.url, image_source: r.source });
  await new Promise(res => setTimeout(res, 250));
}

const date = new Date().toISOString().slice(0, 10);
const sidecar = path.join(ROOT, 'audits', 'beds', 'runs', `${date}-person-portraits-v2.json`);
fs.mkdirSync(path.dirname(sidecar), { recursive: true });
fs.writeFileSync(sidecar, JSON.stringify(results, null, 2));

if (APPLY) {
  for (const r of results) {
    const p = peopleData.people.find(p => p.id === r.id);
    if (p) { p.image = r.image; p.image_source = r.image_source; }
  }
  fs.writeFileSync(peoplePath, JSON.stringify(peopleData, null, 2) + '\n');
  console.log(`\nApplied ${results.length} portraits to people.json.`);
} else {
  console.log(`\nFound ${results.length} portraits.`);
  console.log(`Sidecar: ${path.relative(ROOT, sidecar)}`);
  console.log(`Apply with: --apply.`);
}
