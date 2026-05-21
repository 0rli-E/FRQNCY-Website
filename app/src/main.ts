/**
 * VBRTN — entry point for the FRQNCY network's mobile app.
 *
 * App name (stores / device): VBRTN ("vibration"). The codebase folder, bundle
 * IDs, and Java package keep the FRQNCY codename — see app/README.md.
 *
 * Surfaces:
 *   - "/"               → native Home (#home-screen)
 *   - "/explore"        → native Explore launcher (#explore-screen)
 *   - "/app/*"          → local HTML in the iframe (same-origin)
 *   - external URLs     → live site in the iframe (frqncy.network allow-listed
 *                          in production CSP frame-ancestors as of 2026-05-14)
 *
 * The tab bar stays visible across all surfaces, including while browsing
 * Sanctuary / My FRQNCY / NRG (social) inside the iframe.
 */

import { Network, type ConnectionStatus } from '@capacitor/network';
import { App } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { FrqncyAlarm } from './native/frqncy-alarm';
import { initSyncManager } from './lib/sync-manager';
import {
  bumpNavGeneration,
  currentNavGeneration,
  recordAlarmFired,
  alarmFiredRecently,
  isNativeRuntime,
  isWithinPastWindow,
} from './lib/router-state';

const frame = document.getElementById('site-frame') as HTMLIFrameElement;
const homeScreen = document.getElementById('home-screen') as HTMLElement;
const exploreScreen = document.getElementById('explore-screen') as HTMLElement;
const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('.tab'));
const offlineBanner = document.getElementById('offline-banner') as HTMLDivElement;
const loadingBar = document.getElementById('loading-bar') as HTMLDivElement;

// --- Loading bar ----------------------------------------------------------
//
// Shown when iframe src changes, hidden on `load` (success or error pages
// still fire load) and force-hidden by an 8s timeout in case the WebView
// never fires load for a cross-origin failure. The user is never stranded
// with a pulsing bar.
//
// Tracks which navigation generation the in-flight load belongs to. If the
// user taps a different tab mid-load, the older load fires `load` for a
// document we're no longer showing — we must not let it clear the bar for
// the new generation. The current loadGen guards both sides.

let loadingTimer: number | null = null;
let loadingGen = 0;

frame.addEventListener('load', () => {
  // Only clear the bar if we're still on the frame surface AND the active
  // navigation matches the load we kicked off. Otherwise this is a stale
  // load from a superseded src swap and we should ignore it.
  stopLoading();
});
frame.addEventListener('error', () => stopLoading());

function startLoading() {
  loadingGen = (loadingGen + 1) | 0;
  const myGen = loadingGen;
  loadingBar.classList.add('loading');
  if (loadingTimer) window.clearTimeout(loadingTimer);
  loadingTimer = window.setTimeout(() => {
    // Only force-hide if this is still the active load. A faster, later
    // navigation would have already incremented loadingGen and cleared the
    // bar via its own load event.
    if (myGen === loadingGen) stopLoading();
  }, 8000);
}

function stopLoading() {
  loadingBar.classList.remove('loading');
  if (loadingTimer) {
    window.clearTimeout(loadingTimer);
    loadingTimer = null;
  }
}

function showSurface(which: 'home' | 'explore' | 'frame') {
  homeScreen.classList.toggle('visible', which === 'home');
  exploreScreen.classList.toggle('visible', which === 'explore');
  frame.classList.toggle('visible', which === 'frame');
  // Whenever we leave the iframe surface, drop the loading bar — otherwise
  // a slow external load keeps the gold strip pulsing across Home/Explore
  // (rapid tab-switching during a frqncy.network fetch used to do this).
  if (which !== 'frame') stopLoading();
}

function setActiveTab(route: string) {
  tabs.forEach((tab) => {
    const isActive = tab.dataset.route === route;
    tab.classList.toggle('active', isActive);
    // Mirror state into ARIA so screen-reader users hear the selection
    // (existing accessibility-review finding #12 in 04-accessibility.md).
    tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
}

function navigate(route: string) {
  // Bump the global navigation generation so any async callback (smart
  // resume, deep link, in-flight iframe load) that started earlier knows
  // it's been superseded and can self-cancel.
  bumpNavGeneration();

  if (route === '/') {
    showSurface('home');
    setActiveTab('/');
    return;
  }
  if (route === '/explore') {
    showSurface('explore');
    setActiveTab('/explore');
    return;
  }
  if (route.startsWith('/app/')) {
    const resolvedSrc = new URL(route.replace(/^\//, './'), window.location.href).toString();
    // Skip reload if the iframe is already on this URL — preserves in-page
    // state (form input, scroll position) when the user tabs away and back.
    if (frame.src !== resolvedSrc) {
      startLoading();
      frame.src = resolvedSrc;
    } else if (loadingBar.classList.contains('loading')) {
      // Same URL but a previous load is still pending and we're returning to
      // the frame surface — keep the bar honest by clearing it; the
      // already-cached document is up.
      stopLoading();
    }
    showSurface('frame');
    setActiveTab(route);
    return;
  }
  // Fallback: any unrecognized route routes home.
  showSurface('home');
  setActiveTab('/');
}

function openExternal(url: string, tabRoute?: string) {
  // Load the live-site URL into the app's iframe shell. Production CSP
  // frame-ancestors permits https://localhost / capacitor://localhost / vite
  // dev origin to embed frqncy.network, so the tab bar stays visible while
  // the user browses Sanctuary / My FRQNCY / NRG (social) / etc. inside the frame.
  //
  // Append ?embed=1 — the global header on frqncy.network reads this and adds
  // body.frqncy-embed which hides the site's #main-nav and the floating donate
  // button. The app's own tab bar becomes the only persistent chrome.
  bumpNavGeneration();
  const target = withEmbed(url);
  if (frame.src !== target) {
    startLoading();
    frame.src = target;
  }
  showSurface('frame');
  // Keep the originating tab visually active so the user knows which section
  // they're inside. Caller can pass an explicit route, or we infer from the
  // currently-active tab if one is set.
  if (tabRoute) setActiveTab(tabRoute);
}

function withEmbed(url: string): string {
  try {
    const u = new URL(url, window.location.href);
    if (!u.searchParams.has('embed')) u.searchParams.set('embed', '1');
    return u.toString();
  } catch {
    // URL constructor refused even with a base — last-ditch fallback. We
    // deliberately do NOT manually splice query-strings here because string
    // concatenation breaks for URLs containing fragments (`#hash`) — the
    // `?embed=1` would land inside the fragment. Return the URL unmodified
    // and log; the site-side embed cookie will keep chrome hidden for
    // subsequent navigations even without the query param.
    console.warn('[main] withEmbed: URL not parseable, embed param skipped:', url);
    return url;
  }
}

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    const route = tab.dataset.route!;
    navigate(route);
  });
});

// Surface-internal CTAs: anything with [data-route] navigates internally,
// anything with [data-external] opens in the in-app browser.
document.body.addEventListener('click', (ev) => {
  const target = (ev.target as HTMLElement).closest<HTMLElement>('[data-route], [data-external]');
  if (!target) return;
  const route = target.dataset.route;
  const external = target.dataset.external;
  if (route) {
    ev.preventDefault();
    navigate(route);
  } else if (external) {
    ev.preventDefault();
    // If the link sits inside a surface that has a primary tab, keep that
    // tab highlighted while the user reads. Otherwise leave whichever tab
    // was active.
    const tabRoute = target.closest<HTMLElement>('[data-tab-context]')?.dataset.tabContext;
    openExternal(external, tabRoute);
  }
});

// --- Network status -------------------------------------------------------
//
// Listener is registered BEFORE the initial getStatus() read so a status
// flip during the await window can't slip past us. The handle is stored so
// HMR / future re-runs of main.ts (deep-link reload, dev hot reload) don't
// stack duplicate listeners that all toggle the banner.

let networkHandle: PluginListenerHandle | null = null;

function applyNetworkStatus(s: Pick<ConnectionStatus, 'connected'>) {
  offlineBanner.classList.toggle('show', !s.connected);
}

async function watchNetwork() {
  // Subscribe first — any flip between now and the getStatus resolution
  // becomes a regular event and the banner state stays in sync.
  if (networkHandle) {
    try { await networkHandle.remove(); } catch { /* no-op */ }
    networkHandle = null;
  }
  try {
    networkHandle = await Network.addListener('networkStatusChange', applyNetworkStatus);
  } catch (err) {
    console.warn('[main] Network listener unavailable:', err);
  }
  try {
    const status = await Network.getStatus();
    applyNetworkStatus(status);
  } catch {
    // No native bridge — assume online so the banner stays hidden in dev.
    applyNetworkStatus({ connected: true });
  }
}

// Cleanup on pagehide / unload — Cap doesn't auto-remove plugin listeners
// when the document goes away in some embedded WebView scenarios.
window.addEventListener('pagehide', () => {
  if (networkHandle) {
    try { networkHandle.remove(); } catch { /* no-op */ }
    networkHandle = null;
  }
});

// --- Deep links -----------------------------------------------------------
//
// `frqncy://wake` is the post-alarm route — only legitimately reachable
// when the alarm actually fired. To prevent spoofing (a stale notification,
// a third-party deep link, a manual URL invocation), we gate the route
// behind a `recordAlarmFired()` flag set by the FrqncyAlarm `alarmFired`
// listener. Without a recent fire, `frqncy://wake` falls back to Bedside.

const DEEP_LINK_WHITELIST: Record<string, string> = {
  bedside: '/app/bedside.html',
  settings: '/app/settings.html',
  sleep: '/app/sleep.html',
  wake: '/app/wake.html', // gated below
  alarm: '/app/alarm.html', // gated below
};

function watchDeepLinks() {
  App.addListener('appUrlOpen', (event) => {
    let url: URL;
    try { url = new URL(event.url); } catch { return; }
    if (url.protocol !== 'frqncy:') return;
    const host = url.hostname.toLowerCase();
    const path = DEEP_LINK_WHITELIST[host];
    if (!path) {
      // Unknown deep link — refuse to construct an arbitrary file path.
      console.warn('[main] unknown deep-link host:', host);
      return;
    }
    // Gate the alarm-derived routes — only the native alarm plugin should be
    // able to land us there, never an external URL handler.
    if ((host === 'wake' || host === 'alarm') && !alarmFiredRecently()) {
      console.warn(`[main] deep-link frqncy://${host} blocked — no recent alarmFired event; routing to bedside instead.`);
      navigate('/app/bedside.html');
      return;
    }
    navigate(`${path}${url.search}`);
  });
}

// Subscribe to the native alarm plugin so the deep-link gate above has a
// real signal to gate on. We try-catch the whole thing — on web dev the
// plugin doesn't register and the gate just leaves wake/alarm deep-links
// behind Bedside.
function watchAlarmFired() {
  try {
    void FrqncyAlarm.addListener('alarmFired', (event) => {
      recordAlarmFired(event.firedAt || Date.now());
    });
  } catch {
    /* Plugin not available — gate stays strict. */
  }
}

// --- Back button ---------------------------------------------------------
//
// On Android, the hardware back key flows through here. Order of preference:
//   1. If the iframe is the visible surface AND the iframe is same-origin
//      with deeper history, hand back to it.
//   2. If the iframe is visible and cross-origin, do NOT blindly issue
//      `history.back()` — cross-origin frames silently no-op once at depth
//      1, which strands the user. Instead, return to the active tab's
//      surface (or Home).
//   3. If we're already on a native surface and it's Home, exit the app.
//   4. Otherwise, route home.

function isFrameSameOrigin(): boolean {
  try {
    // Accessing `location.origin` cross-origin throws SecurityError.
    return frame.contentWindow?.location.origin === window.location.origin;
  } catch {
    return false;
  }
}

function watchBackButton() {
  App.addListener('backButton', () => {
    if (frame.classList.contains('visible')) {
      // Only delegate to iframe history if we can SAFELY read depth — i.e.
      // same-origin. Cross-origin "blind back()" was the source of the
      // black-hole behaviour where Android back never escaped Sanctuary
      // (05-edge-cases.md #7).
      if (isFrameSameOrigin()) {
        try {
          const iframe = frame.contentWindow;
          if (iframe && iframe.history.length > 1) {
            iframe.history.back();
            return;
          }
        } catch { /* fall through to tab return */ }
      }
      // Cross-origin OR no deeper history — return to the active tab's
      // home surface. If the active tab IS the iframe surface (e.g.
      // Bedside), routing it again is a no-op redirect, so we fall through
      // to Home in that case to give a real escape.
      const activeRoute = tabs.find((t) => t.classList.contains('active'))?.dataset.route ?? '/';
      if (activeRoute.startsWith('/app/')) {
        navigate('/');
      } else {
        navigate(activeRoute);
      }
      return;
    }
    // Already on a native surface — exit if home, route home otherwise.
    const activeRoute = tabs.find((t) => t.classList.contains('active'))?.dataset.route ?? '/';
    if (activeRoute === '/') {
      App.exitApp();
    } else {
      navigate('/');
    }
  });
}

const SMART_RESUME_HOURS = 12;
const SMART_RESUME_CLOCK_SKEW_MS = 5 * 60 * 1000;

/**
 * Smart resume — if the user opens the app within SMART_RESUME_HOURS of an
 * armed alarm, route directly to Bedside. Rules:
 *   - Only fires on real Capacitor builds; in browser dev (no native bridge)
 *     we always land on Home so the rest of the app is reachable.
 *   - Rejects timestamps in the hard future (clock skew or corruption) so a
 *     wonky device-time setting can't pin the app to Bedside forever.
 *   - Skipped entirely when a deep-link override is in play; the deep link
 *     wins (handled by bootstrap order: we register the deep-link listener
 *     and Capacitor delivers any pending `appUrlOpen` synchronously before
 *     we evaluate smart-resume).
 */
function shouldSmartResume(): boolean {
  if (!isNativeRuntime()) return false;
  let raw: string | null = null;
  try {
    raw = localStorage.getItem('frqncy.bedside.last_arm_ts');
  } catch {
    return false;
  }
  if (!raw) return false;
  const lastArm = parseInt(raw, 10);
  if (!Number.isFinite(lastArm)) {
    // Corrupt value — purge so we don't recheck every boot.
    try { localStorage.removeItem('frqncy.bedside.last_arm_ts'); } catch { /* no-op */ }
    return false;
  }
  const windowMs = SMART_RESUME_HOURS * 60 * 60 * 1000;
  return isWithinPastWindow(lastArm, windowMs, SMART_RESUME_CLOCK_SKEW_MS);
}

async function bootstrap() {
  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#0B1C3D' });
  } catch {
    /* StatusBar only available on device. */
  }

  await watchNetwork();
  watchDeepLinks();
  watchAlarmFired();
  watchBackButton();

  // Sync runs in the background. We deliberately swallow rejection here so a
  // failed background sync never blocks bootstrap — but we DO dispatch an
  // event so surfaces that care (Settings' sync-status row) can react. The
  // event is also a non-trivial signal because the .catch fires only on
  // unexpected throws; routine offline cases already short-circuit cleanly
  // inside initSyncManager.
  initSyncManager().catch((err) => {
    console.warn('[main] sync init failed:', err);
    try {
      window.dispatchEvent(new CustomEvent('frqncy:sync-failed', {
        detail: { error: (err as Error)?.message ?? String(err) },
      }));
    } catch { /* CustomEvent unsupported — ignore. */ }
  });

  // Record the boot navigation generation so any async work that fires
  // before our routing decision can compare against it.
  const bootGen = bumpNavGeneration();
  const initialRoute = shouldSmartResume() ? '/app/bedside.html' : '/';

  // Apply the initial route only if no deep-link / user-interaction has
  // already navigated us in the meantime. (Capacitor delivers a pending
  // `appUrlOpen` synchronously inside addListener on some platforms.)
  if (currentNavGeneration() === bootGen) {
    navigate(initialRoute);
  }

  try {
    await SplashScreen.hide();
  } catch {
    /* no-op on web */
  }
}

bootstrap();
