/**
 * FRQNCY — Service Worker
 *
 * Strategy:
 *   - SHELL cache: precached app-shell URLs. Versioned. Evicted on each release.
 *   - RUNTIME cache: anything cached at fetch-time (static assets / images).
 *     Unversioned. Survives across releases — this is what unblocks
 *     AUDIT-REPORT P5: a release no longer evicts every long-lived asset.
 *   - DATA cache: JSON data files. Versioned alongside SHELL because the
 *     graph + entity beds churn together.
 *
 * Network strategies:
 *   - HTML:           network-first → SHELL fallback
 *   - JSON data:      stale-while-revalidate from DATA
 *   - Static assets:  cache-first from RUNTIME
 *   - /api/*:         pass-through (functions handle their own caching)
 */

const VERSION = 'v67';
const SHELL_CACHE   = `frqncy-shell-${VERSION}`;
const DATA_CACHE    = `frqncy-data-${VERSION}`;
const RUNTIME_CACHE = 'frqncy-runtime';   // intentionally unversioned

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
  '/about.html',
  '/about/why/index.html',
  '/platform.html',
  '/podcast.html',
  '/space.html',
  '/my-frqncy.html',
  '/chart.html',
  '/start-here.html',
  '/browse/index.html',
  // Entity hub indexes — added with the world-model expansion
  '/media/index.html',
  '/music/index.html',
  '/places/index.html',
  '/aligned/index.html',
  '/aligned/buy.js',
];

// JSON data — pre-cached separately so DATA_CACHE owns them.
const DATA_PRECACHE = [
  '/search.json',
  '/entities.json',
  '/resources.json',
  '/explore-data.json',
  '/explore-data.js',
];

// ── Install: pre-cache the app shell + the data set ────────────────
// addAll() is atomic — if a single URL 404s, the entire install rejects.
// We fall back to cache.add() per-URL so a single missing asset doesn't
// brick the install. Failures are logged but don't block activation.
self.addEventListener('install', e => {
  e.waitUntil(
    Promise.all([
      caches.open(SHELL_CACHE).then(cache => Promise.all(
        PRECACHE.map(url =>
          cache.add(url).catch(err => {
            console.warn('[sw] shell precache failed for', url, err && err.message);
          })
        )
      )),
      caches.open(DATA_CACHE).then(cache => Promise.all(
        DATA_PRECACHE.map(url =>
          cache.add(url).catch(err => {
            console.warn('[sw] data precache failed for', url, err && err.message);
          })
        )
      )),
    ])
      .then(() => self.skipWaiting())
      .catch(err => {
        console.error('[sw] install failed catastrophically', err);
        throw err;
      })
  );
});

// ── Activate: delete only stale versioned caches ────────────────────
// We keep RUNTIME_CACHE across versions so unchanged static assets
// (images, fonts, third-party JS already in the cache) survive a
// release. Without this every deploy nuked ~all of cache.
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => {
            // Drop old versioned caches; leave RUNTIME_CACHE alone.
            if (k === RUNTIME_CACHE) return false;
            if (k === SHELL_CACHE)   return false;
            if (k === DATA_CACHE)    return false;
            // Anything else (legacy `frqncy-vN`, old shell/data caches) is stale.
            return true;
          })
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: route per resource type ──────────────────────────────────
self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // Skip API calls — always go to network
  if (url.pathname.startsWith('/api/')) return;

  // HTML pages: network-first with offline fallback to the shell
  if (request.headers.get('Accept')?.includes('text/html')) {
    e.respondWith(
      fetch(request)
        .then(res => {
          // Only cache successful responses — don't poison cache with 404/500
          if (res && res.status === 200 && res.type === 'basic') {
            const copy = res.clone();
            caches.open(SHELL_CACHE).then(c => c.put(request, copy));
          }
          return res;
        })
        .catch(() => caches.match(request).then(r => r || caches.match('/index.html')))
    );
    return;
  }

  // JSON + JS data files: stale-while-revalidate against DATA_CACHE.
  // (.js was previously served cache-first from RUNTIME_CACHE, which meant
  //  any stale snapshot — e.g. an older explore-data.js with broken
  //  link IDs — kept being served forever to existing users even after
  //  the source was fixed, breaking the map. SWR fixes this:
  //  cached is served immediately for speed, and the next reload picks
  //  up the freshly revalidated copy.)
  if (
    (url.pathname.endsWith('.json') && url.pathname !== '/manifest.json')
    || url.pathname.endsWith('.js')
  ) {
    e.respondWith(
      caches.open(DATA_CACHE).then(cache =>
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

  // Static assets (images/css/fonts): cache-first against RUNTIME_CACHE
  // (the long-lived bucket). On a release, these survive — only
  // SHELL_CACHE/DATA_CACHE rotate with VERSION.
  e.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(res => {
        if (!res || res.status !== 200 || res.type === 'opaque') return res;
        const copy = res.clone();
        caches.open(RUNTIME_CACHE).then(c => c.put(request, copy));
        return res;
      });
    })
  );
});
