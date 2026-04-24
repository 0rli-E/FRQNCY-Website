/**
 * FRQNCY app entry point.
 *
 * Hybrid router: decides whether to load frqncy.network (live) or a local HTML
 * file from the Capacitor bundle (offline-capable, native-plugin-enabled).
 *
 * Rules:
 *   - Routes starting with /app/ are ALWAYS local.
 *   - Everything else loads from https://frqncy.network.
 *   - If the device is offline, local cached content is shown where possible.
 */

import { Network } from '@capacitor/network';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { initSyncManager } from './lib/sync-manager';

const LIVE_ORIGIN = 'https://frqncy.network';

const frame = document.getElementById('site-frame') as HTMLIFrameElement;
const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('.tab'));
const offlineBanner = document.getElementById('offline-banner') as HTMLDivElement;

function resolveUrl(route: string): string {
  if (route.startsWith('/app/')) {
    // Local bundle — resolved by Capacitor's custom scheme on device,
    // served from Vite dev server in development.
    return route.replace(/^\//, './');
  }
  return `${LIVE_ORIGIN}${route}`;
}

function navigate(route: string) {
  frame.src = resolveUrl(route);
  tabs.forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.route === route);
  });
}

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    const route = tab.dataset.route!;
    navigate(route);
  });
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
    // frqncy://wake?session=abc -> /app/wake.html?session=abc
    if (url.protocol === 'frqncy:') {
      const route = `/app/${url.hostname}.html${url.search}`;
      navigate(route);
    }
  });
}

// Handle Android hardware back button.
function watchBackButton() {
  App.addListener('backButton', () => {
    const iframe = frame.contentWindow;
    if (iframe && iframe.history.length > 1) {
      iframe.history.back();
    } else {
      App.exitApp();
    }
  });
}

async function bootstrap() {
  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#0a0a0a' });
  } catch {
    /* StatusBar only available on device. */
  }

  await watchNetwork();
  watchDeepLinks();
  watchBackButton();

  // Kick off content sync in the background — fetches /content-version.json,
  // compares to cached hash, pulls updated JSON files if needed.
  initSyncManager().catch((err) => console.warn('Sync failed:', err));

  // Start on home route.
  navigate('/');

  try {
    await SplashScreen.hide();
  } catch {
    /* no-op on web */
  }
}

bootstrap();
