/**
 * FRQNCY app entry point.
 *
 * Three surfaces, one shell:
 *   - "/"        → native Home surface (#home-screen)
 *   - "/explore" → native Explore surface (#explore-screen)
 *   - "/app/*"   → local HTML rendered inside the iframe (same-origin, no CSP issue)
 *
 * External links (frqncy.network content) open via Capacitor's Browser plugin
 * on device, or window.open() in dev. We deliberately do NOT iframe the live
 * site: production CSP sets `frame-ancestors 'none'` which blocks any framing
 * from the app origin.
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

async function openExternal(url: string) {
  // Stay in the app's top-level WebView. Capacitor's allowNavigation list
  // (frqncy.network + *.frqncy.network) permits this in-place navigation —
  // no new tab, no separate browser overlay. Back gesture returns to the app
  // shell. In dev (vite), this just navigates the same tab.
  window.location.href = url;
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
    openExternal(external);
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
    // If we're in the iframe (local /app/*), give its history a chance.
    // Same-origin so reading history.length is safe.
    if (frame.classList.contains('visible')) {
      try {
        const iframe = frame.contentWindow;
        if (iframe && iframe.history.length > 1) {
          iframe.history.back();
          return;
        }
      } catch { /* fall through */ }
      navigate('/');
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
