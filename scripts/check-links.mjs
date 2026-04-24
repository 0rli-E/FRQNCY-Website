#!/usr/bin/env node
/**
 * FRQNCY link health checker
 * Run: node scripts/check-links.mjs
 *
 * Hits every external URL across content.json + beds, records the response,
 * writes link-health.json at repo root.
 *
 * Designed for manual review after run, not auto-fix. URLs change, old
 * endpoints redirect, platforms die — you decide what to replace with what.
 *
 * - HEAD request first with 8s timeout, falls back to GET if HEAD 405s
 * - 4 URLs in parallel at a time to stay polite
 * - Groups output by status class (broken / redirects / ok)
 * - Ignores fragment-only changes
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const UA = 'FRQNCY-link-health/1.0 (+https://frqncy.network)';
const TIMEOUT_MS = 8000;
const CONCURRENCY = 4;

function loadJSON(name) {
  const p = path.join(ROOT, name);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

// Collect every URL across beds + content.json
const sources = [];
const content = loadJSON('content.json');
if (content?.resources) {
  for (const [bucketId, items] of Object.entries(content.resources)) {
    for (const r of items || []) {
      if (r.url) sources.push({ url: r.url, from: `content.json:${bucketId}:${r.title || '?'}` });
    }
  }
}
const beds = [
  ['people.json', 'people', 'name'],
  ['books.json',  'books',  'title'],
  ['orgs.json',   'orgs',   'name'],
  ['media.json',  'media',  'name'],
  ['places.json', 'places', 'name'],
];
for (const [file, key, labelField] of beds) {
  const data = loadJSON(file);
  if (!data?.[key]) continue;
  for (const e of data[key]) {
    if (e.url) sources.push({ url: e.url, from: `${file}:${e[labelField] || '?'}` });
  }
}

// Dedup by URL — keep first origin as context
const seen = new Map();
for (const s of sources) {
  if (!seen.has(s.url)) seen.set(s.url, s);
}
const jobs = [...seen.values()];

console.log(`Checking ${jobs.length} unique external URLs…`);

async function checkOne(job) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const common = {
    signal: controller.signal,
    redirect: 'follow',
    headers: { 'User-Agent': UA, 'Accept': '*/*' },
  };
  try {
    let r = await fetch(job.url, { ...common, method: 'HEAD' });
    // Some servers block HEAD — retry with GET if 405 / 403 / 400
    if (!r.ok && (r.status === 405 || r.status === 403 || r.status === 400)) {
      r = await fetch(job.url, { ...common, method: 'GET' });
    }
    return {
      url: job.url,
      from: job.from,
      status: r.status,
      final_url: r.url !== job.url ? r.url : undefined,
      ok: r.ok,
    };
  } catch (e) {
    return {
      url: job.url,
      from: job.from,
      status: 0,
      error: e.name === 'AbortError' ? 'timeout' : e.message,
      ok: false,
    };
  } finally {
    clearTimeout(timer);
  }
}

// Run with concurrency cap
const results = [];
const q = [...jobs];
const workers = Array.from({ length: CONCURRENCY }, async () => {
  while (q.length) {
    const job = q.shift();
    const r = await checkOne(job);
    results.push(r);
    process.stdout.write(r.ok ? '.' : (r.status === 0 ? '×' : '!'));
  }
});
await Promise.all(workers);
console.log('\n');

// Bucket
const broken = results.filter(r => !r.ok);
const redirects = results.filter(r => r.ok && r.final_url);
const ok = results.filter(r => r.ok && !r.final_url);

// Sort broken by status (timeouts/0 first, then 4xx, then 5xx)
broken.sort((a, b) => (a.status || 0) - (b.status || 0));

const report = {
  $generated: new Date().toISOString().slice(0, 19) + 'Z',
  $summary: {
    total: results.length,
    ok: ok.length,
    redirects: redirects.length,
    broken: broken.length,
  },
  broken,
  redirects,
};

fs.writeFileSync(path.join(ROOT, 'link-health.json'), JSON.stringify(report, null, 2));
console.log(`Report: link-health.json`);
console.log(`  OK       : ${ok.length}`);
console.log(`  Redirects: ${redirects.length}`);
console.log(`  Broken   : ${broken.length}`);
if (broken.length) {
  console.log('\nBroken URLs (first 10):');
  for (const r of broken.slice(0, 10)) {
    console.log(`  [${r.status || r.error}] ${r.url}`);
    console.log(`       from: ${r.from}`);
  }
}
