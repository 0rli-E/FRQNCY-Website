#!/usr/bin/env node
// One-shot injector: stamps every page currently in generate.js's BESPOKE_*
// sets with the BESPOKE-LOCK marker. Idempotent — re-running is safe.
//
// After this runs, the page itself becomes the source of truth for "skip me."
// generate.js reads existing files and bails on the marker (see generate.js
// write-loops). The pre-commit hook also catches markers being stripped.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const SENTINEL = '<!-- BESPOKE-LOCK: hand-shaped page, generate.js will not regenerate -->';

const generateSrc = await fs.readFile(path.join(ROOT, 'generate.js'), 'utf8');

function parseSet(name) {
  const re = new RegExp(`const ${name}\\s*=\\s*new Set\\(\\[([\\s\\S]+?)\\]\\);`);
  const m = generateSrc.match(re);
  if (!m) throw new Error(`Could not parse ${name} in generate.js`);
  return [...m[1].matchAll(/'([a-z0-9-]+)'/g)].map(x => x[1]);
}

const slugs = [
  ...parseSet('BESPOKE_PILLARS'),
  ...parseSet('BESPOKE_DOMAINS'),
  ...parseSet('BESPOKE_TOPICS'),
];

let injected = 0, alreadyHad = 0, missing = 0, weird = 0;

for (const slug of slugs) {
  const fp = path.join(ROOT, 'v2', slug, 'index.html');
  let src;
  try { src = await fs.readFile(fp, 'utf8'); }
  catch { console.log(`MISS ${slug}`); missing++; continue; }
  if (src.includes('BESPOKE-LOCK')) { alreadyHad++; continue; }
  const out = src.replace(/<!DOCTYPE html>\s*\n/i, `<!DOCTYPE html>\n${SENTINEL}\n`);
  if (out === src) { console.log(`SKIP ${slug} — no <!DOCTYPE html> match`); weird++; continue; }
  await fs.writeFile(fp, out);
  injected++;
}

console.log(`\nInjected: ${injected}  Already had: ${alreadyHad}  Missing: ${missing}  Weird: ${weird}  Total: ${slugs.length}`);
