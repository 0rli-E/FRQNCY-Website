#!/usr/bin/env node
/**
 * build-manifest.mjs
 *
 * Generates /content-version.json at the root of the website.
 * The app polls this file to know when content has changed.
 *
 * This script should run as part of the website build (not just the app build).
 * Wire it into the Cloudflare Pages build command, e.g.:
 *   node app/scripts/build-manifest.mjs
 */

import { createHash } from 'node:crypto';
import { readFile, writeFile, stat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = resolve(__dirname, '../..');  // /FRQNCY WEBSITE
const OUTPUT = resolve(SITE_ROOT, 'content-version.json');

const TRACKED_FILES = ['search.json', 'resources.json'];

async function hashFile(path) {
  const buf = await readFile(path);
  return 'sha256:' + createHash('sha256').update(buf).digest('hex').slice(0, 16);
}

async function main() {
  const files = {};
  for (const name of TRACKED_FILES) {
    const path = resolve(SITE_ROOT, name);
    try {
      await stat(path);
    } catch {
      console.warn(`[manifest] ${name} not found at ${path}, skipping`);
      continue;
    }
    files[name] = { hash: await hashFile(path) };
  }

  const manifest = {
    schemaVersion: 1,
    publishedAt: new Date().toISOString(),
    files,
  };

  await writeFile(OUTPUT, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log(`[manifest] wrote ${OUTPUT}`);
  console.log(JSON.stringify(manifest, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
