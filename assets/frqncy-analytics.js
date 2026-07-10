/**
 * frqncy-analytics.js — client-side event tracker
 *
 * Fires events to /api/analytics (Cloudflare Pages Function).
 * Auto-tracks: page_view, topic_view, scroll_depth, word_illuminated,
 *              illuminator_opened (deep-link), newsletter_subscribed,
 *              resource_click, explore_interaction, search_query.
 * Manual tracking via window.frqncy.track(event_type, properties).
 *
 * Privacy:
 *  - Respects navigator.doNotTrack === '1' — no events sent
 *  - Session ID via sessionStorage (tab-scoped, never persisted across sessions)
 *  - Reads Supabase JWT from localStorage for user_id association (optional)
 *  - Strips PII keys before sending
 *
 * Load order: place before </body> or in <head> with defer.
 * No dependencies. No cookies. ~4 KB minified.
 */

(function () {
  'use strict';

  // ─── Config ─────────────────────────────────────────────────────────────────

  const ENDPOINT       = '/api/analytics';
  const SUPABASE_KEY   = 'sb-vyazlspbmwmlyncdlezh-auth-token'; // localStorage key
  const PII_KEYS       = ['email', 'name', 'phone', 'password', 'token', 'key', 'secret'];
  const SCROLL_MARKS   = [25, 50, 75, 100];
  // Topic pages now live at the root (`/<slug>/`) — the old `/v2/` prefix was
  // removed. Match a single trailing-slash segment, but exclude the known
  // section hubs so /watch/, /social/, /courses/ etc. stay plain page_views.
  const TOPIC_URL_RE   = /^\/([a-z0-9][a-z0-9-]*)\/?$/;
  const NON_TOPIC      = new Set([
    'watch', 'social', 'courses', 'course', 'my-frqncy', 'about', 'browse',
    'search', 'research', 'media', 'orgs', 'affiliates', 'donations',
    'membership', 'explore', 'aligned', 'sanctuary', 'books', 'papers',
  ]);
  const COURSE_URL_RE  = /\/(course|courses?)\//i;

  // ─── Do-Not-Track gate ──────────────────────────────────────────────────────

  if (navigator.doNotTrack === '1') return;

  // ─── Session ID ─────────────────────────────────────────────────────────────

  function getSessionId() {
    const KEY = 'frqncy.analytics.session';
    let sid = sessionStorage.getItem(KEY);
    if (!sid) {
      sid = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem(KEY, sid);
    }
    return sid;
  }

  const sessionId = getSessionId();

  // ─── Auth token (optional) ───────────────────────────────────────────────────

  function getAuthHeader() {
    try {
      const raw = localStorage.getItem(SUPABASE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const token  = parsed?.access_token || parsed?.currentSession?.access_token;
      return token ? `Bearer ${token}` : null;
    } catch {
      return null;
    }
  }

  // ─── PII scrub ───────────────────────────────────────────────────────────────

  function scrub(props) {
    if (!props || typeof props !== 'object') return {};
    const out = {};
    for (const [k, v] of Object.entries(props)) {
      const kl = k.toLowerCase();
      if (PII_KEYS.some(p => kl.includes(p))) continue;
      out[k] = v;
    }
    return out;
  }

  // ─── Core send ───────────────────────────────────────────────────────────────

  function send(eventType, properties) {
    const body = {
      event_type:  eventType,
      session_id:  sessionId,
      properties:  scrub(properties || {}),
      url:         location.href,
      referrer:    document.referrer || null,
    };

    const headers = { 'Content-Type': 'application/json' };
    const auth    = getAuthHeader();
    if (auth) headers['Authorization'] = auth;

    try {
      fetch(ENDPOINT, {
        method:    'POST',
        headers,
        body:      JSON.stringify(body),
        keepalive: true,   // survives page unload
      }).catch(() => {}); // fire-and-forget — never throw
    } catch {}
  }

  // ─── Page view ───────────────────────────────────────────────────────────────

  function trackPageView() {
    const path  = location.pathname;
    const topicMatch = path.match(TOPIC_URL_RE);

    if (topicMatch && !NON_TOPIC.has(topicMatch[1])) {
      // Topic page — emit topic_view (richer) instead of plain page_view
      send('topic_view', {
        topic_slug: topicMatch[1],
        title:      document.title,
        path,
      });
    } else if (COURSE_URL_RE.test(path)) {
      send('course_view', { path, title: document.title });
    } else {
      send('page_view', { path, title: document.title });
    }

    // Deep-link: #illuminate=<word>
    if (location.hash.startsWith('#illuminate=')) {
      const word = decodeURIComponent(location.hash.slice('#illuminate='.length));
      if (word) send('illuminator_opened', { word, source: 'deep_link' });
    }
  }

  // ─── Scroll depth ────────────────────────────────────────────────────────────

  function initScrollDepth() {
    const fired  = new Set();
    let ticking  = false;

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const el     = document.documentElement;
        const pct    = Math.round((el.scrollTop + el.clientHeight) / el.scrollHeight * 100);
        for (const mark of SCROLL_MARKS) {
          if (pct >= mark && !fired.has(mark)) {
            fired.add(mark);
            send('scroll_depth', { depth_pct: mark, path: location.pathname });
          }
        }
        ticking = false;
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // ─── Resource clicks ─────────────────────────────────────────────────────────

  function initResourceClicks() {
    document.addEventListener('click', function (e) {
      const a = e.target.closest('a[href]');
      if (!a) return;
      const href = a.href || '';
      // Only external links (outbound resources)
      if (href.startsWith(location.origin)) return;
      if (!href.startsWith('http')) return;

      send('resource_click', {
        url:   href,
        text:  (a.textContent || '').trim().slice(0, 120),
        path:  location.pathname,
      });
    }, { passive: true });
  }

  // ─── Word Illuminator ────────────────────────────────────────────────────────
  //
  // The Illuminator fires on two surfaces:
  //  1. Form submit on Sanctuary dashboard
  //  2. Programmatic fetch inside the page's own JS (patched below)

  function initIlluminator() {
    // Patch fetch to intercept Illuminator API calls
    const _fetch = window.fetch;
    window.fetch = function (...args) {
      try {
        const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
        if (url.includes('illuminate') || url.includes('word-illuminator')) {
          let word = null;
          try {
            const body = args[1]?.body;
            if (typeof body === 'string') {
              const parsed = JSON.parse(body);
              word = parsed.word || parsed.query || null;
            }
          } catch {}
          send('word_illuminated', { word, source: 'fetch', path: location.pathname });
        }
      } catch {}
      return _fetch.apply(this, args);
    };

    // Also watch form submits with an illuminate-flavored action or id
    document.addEventListener('submit', function (e) {
      const form = e.target;
      if (!form) return;
      const id     = (form.id     || '').toLowerCase();
      const action = (form.action || '').toLowerCase();
      if (id.includes('illuminat') || action.includes('illuminat')) {
        const input = form.querySelector('input[type="text"], input[type="search"], textarea');
        const word  = input ? (input.value || '').trim().slice(0, 100) : null;
        send('word_illuminated', { word, source: 'form_submit', path: location.pathname });
      }
    }, { passive: true });
  }

  // ─── Newsletter subscribe ────────────────────────────────────────────────────

  function initNewsletterTracking() {
    document.addEventListener('submit', function (e) {
      const form = e.target;
      if (!form) return;
      const id     = (form.id     || '').toLowerCase();
      const cls    = (form.className || '').toLowerCase();
      const action = (form.action || '').toLowerCase();
      const isSubscribe = id.includes('subscri') || cls.includes('subscri') || action.includes('subscri');
      if (!isSubscribe) return;
      send('newsletter_subscribed', { path: location.pathname });
    }, { passive: true });
  }

  // ─── Explore interactions ─────────────────────────────────────────────────────

  function initExploreTracking() {
    if (!location.pathname.includes('explore')) return;

    // Debounce helper
    let debounceTimer;
    function debounce(fn, ms) {
      return function (...args) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => fn.apply(this, args), ms);
      };
    }

    // Node click
    document.addEventListener('click', function (e) {
      const node = e.target.closest('[data-topic-slug], [data-node-id], .node, .topic-node');
      if (!node) return;
      const slug = node.dataset.topicSlug || node.dataset.nodeId || (node.textContent || '').trim().slice(0, 60);
      send('explore_interaction', { action: 'node_click', topic_slug: slug });
    }, { passive: true });

    // Search in explore
    const searchInput = document.querySelector('#explore-search, [data-explore-search], input[placeholder*="search" i]');
    if (searchInput) {
      searchInput.addEventListener('input', debounce(function () {
        const q = this.value.trim();
        if (q.length > 1) send('search_query', { query: q, surface: 'explore' });
      }, 600));
    }
  }

  // ─── SPA navigation support ──────────────────────────────────────────────────
  // If FRQNCY ever moves to client-side routing, track navigations as page_views.

  (function patchHistory() {
    const _push    = history.pushState.bind(history);
    const _replace = history.replaceState.bind(history);

    function afterNav() {
      // Small delay to let the page render the new title
      setTimeout(trackPageView, 50);
    }

    history.pushState    = function (...a) { _push(...a);    afterNav(); };
    history.replaceState = function (...a) { _replace(...a); afterNav(); };
    window.addEventListener('popstate', afterNav);
  })();

  // ─── Public API: window.frqncy.track ─────────────────────────────────────────

  window.frqncy = window.frqncy || {};
  window.frqncy.track = function (eventType, properties) {
    send(eventType, properties);
  };

  // ─── Bootstrap ───────────────────────────────────────────────────────────────

  function init() {
    trackPageView();
    initScrollDepth();
    initResourceClicks();
    initIlluminator();
    initNewsletterTracking();
    initExploreTracking();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
