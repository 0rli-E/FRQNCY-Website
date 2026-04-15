/**
 * FRQNCY — Service Worker
 * Strategy: cache-first for static assets, network-first for HTML pages.
 * Provides offline fallback for the shell and fonts.
 */

const CACHE = 'frqncy-v1';

// Assets that should be pre-cached on install (the app shell)
const PRECACHE = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json',
  '/og-image.png',
  '/chat-widget.js',
  '/v2/watch/index.html',
  '/v2/courses/index.html',
  '/v2/explore.html',
  '/search.html',
];

// ── Install: pre-cache the app shell ────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

// ── Activate: delete old caches ──────────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: network-first for HTML, cache-first for everything else ───
self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // Skip API calls — always go to network
  if (url.pathname.startsWith('/api/')) return;

  // HTML pages: network-first with offline fallback
  if (request.headers.get('Accept')?.includes('text/html')) {
    e.respondWith(
      fetch(request)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request).then(r => r || caches.match('/index.html')))
    );
    return;
  }

  // Static assets: cache-first, fall back to network and cache on the fly
  e.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(res => {
        if (!res || res.status !== 200 || res.type === 'opaque') return res;
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(request, copy));
        return res;
      });
    })
  );
});
