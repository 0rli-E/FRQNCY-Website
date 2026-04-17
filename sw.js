/**
 * FRQNCY — Service Worker
 * Strategy: network-first for HTML & JSON data, cache-first for static assets.
 * Provides offline fallback for the shell and fonts.
 */

const CACHE = 'frqncy-v14';

// Assets that should be pre-cached on install (the app shell)
const PRECACHE = [
  '/',
  '/index.html',
  '/index.css',
  '/index.js',
  '/favicon.svg',
  '/manifest.json',
  '/chat-widget.js',
  '/mobile-nav.js',
  '/nav-dropdown.css',
  '/chart.js',
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

// ── Fetch: network-first for HTML & JSON, cache-first for static ────
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

  // JSON data files: stale-while-revalidate (serve cache, update in background)
  if (url.pathname.endsWith('.json') && url.pathname !== '/manifest.json') {
    e.respondWith(
      caches.open(CACHE).then(cache =>
        cache.match(request).then(cached => {
          const fetchPromise = fetch(request).then(res => {
            if (res && res.status === 200) cache.put(request, res.clone());
            return res;
          }).catch(() => cached);
          return cached || fetchPromise;
        })
      )
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
