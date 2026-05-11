#!/usr/bin/env node
/**
 * Merge /tmp/url-results-{1..4}.json into people.json.
 *
 * Each results file is an array of {id, url, source, confidence, notes?}.
 * Sequential: load, modify, write — all four files in one pass to avoid the
 * load-modify-write race that bit us before.
 *
 * Usage: node scripts/apply_url_results.mjs            # dry-run, prints summary
 *        node scripts/apply_url_results.mjs --apply    # writes people.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const APPLY = process.argv.includes('--apply');

const peoplePath = path.join(ROOT, 'people.json');
const data = JSON.parse(fs.readFileSync(peoplePath, 'utf8'));
const people = data.people;
const byId = new Map(people.map(p => [p.id, p]));

const allResults = [];
for (let i = 1; i <= 4; i++) {
  const f = `/tmp/url-results-${i}.json`;
  if (!fs.existsSync(f)) { console.error(`MISSING: ${f}`); process.exit(1); }
  const arr = JSON.parse(fs.readFileSync(f, 'utf8'));
  console.log(`batch-${i}: ${arr.length} entries`);
  allResults.push(...arr);
}

const stats = { applied: 0, skipped_no_person: 0, skipped_already_set: 0, source: {}, confidence: {}, none: [] };
for (const r of allResults) {
  const p = byId.get(r.id);
  if (!p) { stats.skipped_no_person++; console.warn(`  no such person: ${r.id}`); continue; }
  if (p.url && p.url.length > 0) { stats.skipped_already_set++; continue; }
  if (!r.url || r.source === 'none') { stats.none.push({ id: r.id, notes: r.notes || '' }); continue; }
  p.url = r.url;
  if (r.source) p._url_source = r.source;
  if (r.confidence) p._url_confidence = r.confidence;
  stats.applied++;
  stats.source[r.source] = (stats.source[r.source] || 0) + 1;
  stats.confidence[r.confidence] = (stats.confidence[r.confidence] || 0) + 1;
}

console.log('\n--- summary ---');
console.log(`applied:           ${stats.applied}`);
console.log(`skipped (no id):   ${stats.skipped_no_person}`);
console.log(`skipped (had url): ${stats.skipped_already_set}`);
console.log(`source: ${JSON.stringify(stats.source)}`);
console.log(`confidence: ${JSON.stringify(stats.confidence)}`);
console.log(`unfilled (source=none): ${stats.none.length}`);
for (const n of stats.none) console.log(`  ${n.id}: ${n.notes}`);

if (APPLY) {
  fs.writeFileSync(peoplePath, JSON.stringify(data, null, 2));
  console.log('\npeople.json written');
} else {
  console.log('\n(dry-run — pass --apply to write)');
}
