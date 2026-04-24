/**
 * SyncManager — stale-while-revalidate content sync from frqncy.network.
 *
 * Boot flow:
 *   1. Serve cached search.json / resources.json instantly (if present).
 *   2. Fetch /content-version.json in the background (with 10s timeout).
 *   3. If manifest hash changed, conditionally fetch the changed JSON file
 *      with If-None-Match (304 = no-op, 200 = update cache + emit event).
 *   4. Store ETag alongside the file so subsequent revalidations are free.
 */

import { Preferences } from '@capacitor/preferences';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

const LIVE_ORIGIN = 'https://frqncy.network';
const MANIFEST_URL = `${LIVE_ORIGIN}/content-version.json`;
const MANIFEST_TIMEOUT_MS = 10_000;

interface ContentManifest {
  schemaVersion: number;
  publishedAt: string;
  files: {
    'search.json': { hash: string; etag?: string };
    'resources.json': { hash: string; etag?: string };
  };
}

async function fetchWithTimeout(url: string, init: RequestInit = {}, ms = MANIFEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function readCachedManifest(): Promise<ContentManifest | null> {
  const { value } = await Preferences.get({ key: 'manifest' });
  return value ? (JSON.parse(value) as ContentManifest) : null;
}

async function writeCachedManifest(m: ContentManifest) {
  await Preferences.set({ key: 'manifest', value: JSON.stringify(m) });
}

async function writeContentFile(filename: string, text: string) {
  await Filesystem.writeFile({
    path: `content/${filename}`,
    data: text,
    directory: Directory.Data,
    encoding: Encoding.UTF8,
    recursive: true,
  });
}

export async function readContentFile(filename: string): Promise<string | null> {
  try {
    const res = await Filesystem.readFile({
      path: `content/${filename}`,
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    });
    return typeof res.data === 'string' ? res.data : await res.data.text();
  } catch {
    return null;
  }
}

async function refreshFile(
  filename: 'search.json' | 'resources.json',
  remoteHash: string,
  etag: string | undefined,
  cachedEtag: string | undefined,
): Promise<{ updated: boolean; newEtag?: string }> {
  const headers: Record<string, string> = {};
  if (cachedEtag) headers['If-None-Match'] = cachedEtag;

  const res = await fetchWithTimeout(`${LIVE_ORIGIN}/${filename}`, { headers }, 30_000);
  if (res.status === 304) return { updated: false };
  if (!res.ok) throw new Error(`${filename} fetch failed: ${res.status}`);

  const text = await res.text();
  await writeContentFile(filename, text);
  const newEtag = res.headers.get('ETag') ?? etag ?? remoteHash;
  return { updated: true, newEtag };
}

/** Emit a DOM event any time content updates so UI can re-hydrate. */
function emitContentUpdate(filename: string) {
  window.dispatchEvent(new CustomEvent('frqncy:content-updated', { detail: { filename } }));
}

export async function initSyncManager(): Promise<void> {
  let cachedManifest: ContentManifest | null;
  try {
    cachedManifest = await readCachedManifest();
  } catch {
    cachedManifest = null;
  }

  let remoteManifest: ContentManifest;
  try {
    const res = await fetchWithTimeout(MANIFEST_URL);
    if (!res.ok) throw new Error(`manifest: ${res.status}`);
    remoteManifest = (await res.json()) as ContentManifest;
  } catch (err) {
    // Offline or manifest missing — continue with cached content.
    console.info('[sync] using cache only:', (err as Error).message);
    return;
  }

  const files: Array<'search.json' | 'resources.json'> = ['search.json', 'resources.json'];

  for (const filename of files) {
    const remote = remoteManifest.files[filename];
    const cached = cachedManifest?.files[filename];
    if (cached && cached.hash === remote.hash) continue; // no change

    try {
      const { updated, newEtag } = await refreshFile(
        filename,
        remote.hash,
        remote.etag,
        cached?.etag,
      );
      if (updated) {
        remoteManifest.files[filename].etag = newEtag;
        emitContentUpdate(filename);
      }
    } catch (err) {
      console.warn(`[sync] ${filename} update failed:`, err);
    }
  }

  await writeCachedManifest(remoteManifest);
}
