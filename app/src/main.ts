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

// First-launch welcome + smart resume — Day 4 of the perfect-week roadmap.
const HOME_WELCOME_KEY = 'frqncy.home.welcome_ack';
const SMART_RESUME_HOURS = 12;

function maybeShowHomeWelcome() {
  const overlay = document.getElementById('home-welcome');
  if (!overlay) return;
  let acked = '0';
  try { acked = localStorage.getItem(HOME_WELCOME_KEY) || '0'; } catch {}
  if (acked === '1') return;

  overlay.classList.add('visible');

  const ackAndRoute = (route: string) => {
    try { localStorage.setItem(HOME_WELCOME_KEY, '1'); } catch {}
    overlay.classList.remove('visible');
    navigate(route);
  };

  document.getElementById('home-welcome-bedside')
    ?.addEventListener('click', () => ackAndRoute('/app/bedside.html'));
  document.getElementById('home-welcome-explore')
    ?.addEventListener('click', () => ackAndRoute('/v2/explore.html'));
}

/**
 * Smart resume — if the user opens the app within SMART_RESUME_HOURS of an
 * armed alarm, route directly to Bedside. The app behaves as a bedside
 * companion, not a generic content browser.
 *
 * We detect "armed" via localStorage state set by bedside.html; safer than
 * calling FrqncyAlarm.list() during bootstrap (which adds a permission-check
 * hop on a slow path).
 */
function shouldSmartResume(): boolean {
  try {
    const lastArmRaw = localStorage.getItem('frqncy.bedside.last_arm_ts');
    if (!lastArmRaw) return false;
    const lastArm = parseInt(lastArmRaw, 10);
    if (!Number.isFinite(lastArm)) return false;
    const ageMs = Date.now() - lastArm;
    const windowMs = SMART_RESUME_HOURS * 60 * 60 * 1000;
    return ageMs >= 0 && ageMs <= windowMs;
  } catch { return false; }
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

  // Routing decision tree:
  //   1. Has an alarm been armed in the last 12 hours? → Bedside (smart resume).
  //   2. First-ever launch? → Home welcome overlay.
  //   3. Otherwise → home content.
  if (shouldSmartResume()) {
    navigate('/app/bedside.html');
  } else {
    navigate('/');
    maybeShowHomeWelcome();
  }

  try {
    await SplashScreen.hide();
  } catch {
    /* no-op on web */
  }
}

bootstrap();
