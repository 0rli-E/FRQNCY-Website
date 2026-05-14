/**
 * FRQNCY app entry point.
 *
 * Surfaces:
 *   - "/"               → native Home (#home-screen)
 *   - "/explore"        → native Explore launcher (#explore-screen)
 *   - "/app/*"          → local HTML in the iframe (same-origin)
 *   - external URLs     → live site in the iframe (frqncy.network allow-listed
 *                          in production CSP frame-ancestors as of 2026-05-14)
 *
 * The tab bar stays visible across all surfaces, including while browsing
 * Sanctuary / My FRQNCY / Social inside the iframe.
 */

import { Network } from '@capacitor/network';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { initSyncManager } from './lib/sync-manager';

const frame = document.getElementById('site-frame') as HTMLIFrameElement;
const homeScreen = document.getElementById('home-screen') as HTMLElement;
const exploreScreen = document.getElementById('explore-screen') as HTMLElement;
const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('.tab'));
const offlineBanner = document.getElementById('offline-banner') as HTMLDivElement;

function showSurface(which: 'home' | 'explore' | 'frame') {
  homeScreen.classList.toggle('visible', which === 'home');
  exploreScreen.classList.toggle('visible', which === 'explore');
  frame.classList.toggle('visible', which === 'frame');
}

function setActiveTab(route: string) {
  tabs.forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.route === route);
  });
}

function navigate(route: string) {
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
    frame.src = route.replace(/^\//, './');
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
  // the user browses Sanctuary / My FRQNCY / Social / etc. inside the frame.
  frame.src = url;
  showSurface('frame');
  // Keep the originating tab visually active so the user knows which section
  // they're inside. Caller can pass an explicit route, or we infer from the
  // currently-active tab if one is set.
  if (tabRoute) setActiveTab(tabRoute);
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

// Handle offline state.
async function watchNetwork() {
  const status = await Network.getStatus();
  offlineBanner.classList.toggle('show', !status.connected);
  Network.addListener('networkStatusChange', (s) => {
    offlineBanner.classList.toggle('show', !s.connected);
  });
}

// Handle deep links (e.g., frqncy://wake from an alarm firing).
function watchDeepLinks() {
  App.addListener('appUrlOpen', (event) => {
    const url = new URL(event.url);
    if (url.protocol === 'frqncy:') {
      const route = `/app/${url.hostname}.html${url.search}`;
      navigate(route);
    }
  });
}

// Handle Android hardware back button.
function watchBackButton() {
  App.addListener('backButton', () => {
    // Iframe visible — try to go back inside it first. For same-origin frames
    // we can read history.length safely; for cross-origin (frqncy.network) we
    // can't, but history.back() may still work or may silently no-op. Wrapped
    // in try/catch so a SecurityError doesn't crash us out to App.exitApp.
    if (frame.classList.contains('visible')) {
      let wentBack = false;
      try {
        const iframe = frame.contentWindow;
        if (iframe) {
          // Same-origin check via lengths read.
          try {
            if (iframe.history.length > 1) {
              iframe.history.back();
              wentBack = true;
            }
          } catch {
            // Cross-origin — try blind back() anyway.
            try { iframe.history.back(); wentBack = true; } catch { /* no-op */ }
          }
        }
      } catch { /* fall through */ }
      if (wentBack) return;
      // No deeper history — return to the calling surface (active tab).
      const activeTab = tabs.find((t) => t.classList.contains('active'));
      navigate(activeTab?.dataset.route ?? '/');
      return;
    }
    // Already on a native surface — exit if home, route home otherwise.
    const activeTab = tabs.find((t) => t.classList.contains('active'));
    if (!activeTab || activeTab.dataset.route === '/') {
      App.exitApp();
    } else {
      navigate('/');
    }
  });
}

const SMART_RESUME_HOURS = 12;

/**
 * Smart resume — if the user opens the app within SMART_RESUME_HOURS of an
 * armed alarm, route directly to Bedside. Only fires on real Capacitor builds;
 * in browser dev (no native bridge) we always land on Home so the rest of the
 * app is reachable.
 */
function shouldSmartResume(): boolean {
  const onDevice = !!(window as any).Capacitor?.isNativePlatform?.();
  if (!onDevice) return false;
  try {
    const lastArmRaw = localStorage.getItem('frqncy.bedside.last_arm_ts');
    if (!lastArmRaw) return false;
    const lastArm = parseInt(lastArmRaw, 10);
    if (!Number.isFinite(lastArm)) return false;
    const ageMs = Date.now() - lastArm;
    const windowMs = SMART_RESUME_HOURS * 60 * 60 * 1000;
    return ageMs >= 0 && ageMs <= windowMs;
  } catch {
    return false;
  }
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
  watchBackButton();

  initSyncManager().catch((err) => console.warn('Sync failed:', err));

  if (shouldSmartResume()) {
    navigate('/app/bedside.html');
  } else {
    navigate('/');
  }

  try {
    await SplashScreen.hide();
  } catch {
    /* no-op on web */
  }
}

bootstrap();
