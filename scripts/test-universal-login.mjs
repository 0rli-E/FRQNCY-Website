/**
 * Universal login — end-to-end test against a real Supabase account.
 * Runs the local worktree build on :8787 in a single browser context, so the
 * session carrying from surface to surface is the actual thing under test.
 */
import { chromium } from 'playwright-core';

// Credentials come from the environment — this repo is public.
//   FRQNCY_TEST_EMAIL=... FRQNCY_TEST_PASSWORD=... node scripts/test-universal-login.mjs
// Serve the checkout first:  python3 -m http.server 8787
const EXEC  = process.env.PLAYWRIGHT_CHROMIUM ||
  '/Users/orli/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const BASE  = process.env.FRQNCY_TEST_BASE || 'http://localhost:8787';
const EMAIL = process.env.FRQNCY_TEST_EMAIL;
const PASS  = process.env.FRQNCY_TEST_PASSWORD;
const SHOTS = process.env.FRQNCY_TEST_SHOTS || '/tmp/frqncy-login-shots';

if (!EMAIL || !PASS) {
  console.error('Set FRQNCY_TEST_EMAIL and FRQNCY_TEST_PASSWORD (a throwaway Supabase account).');
  process.exit(2);
}
import { mkdirSync } from 'node:fs';
mkdirSync(SHOTS, { recursive: true });

const results = [];
function check(name, pass, detail) {
  results.push({ name, pass, detail: detail || '' });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
}

const authState = (page) => page.evaluate(() => {
  const ctlIn  = document.querySelector('[data-frqa="out"]');
  const ctlOk  = document.querySelector('[data-frqa="in"]');
  const own    = document.getElementById('acctSlot');
  const token  = localStorage.getItem('sb-vyazlspbmwmlyncdlezh-auth-token');
  let email = null;
  try { const s = JSON.parse(token || 'null'); email = (s && (s.user || (s.currentSession||{}).user) || {}).email || null; } catch (e) {}
  return {
    signInVisible: !!ctlIn,
    signedInVisible: !!ctlOk,
    ownSlotText: own ? own.textContent.trim() : null,
    navText: (document.querySelector('nav')?.innerText || '').replace(/\s+/g, ' ').slice(0, 220),
    hasToken: !!token,
    tokenEmail: email,
    sdkLoaded: !!(window.supabase && window.supabase.createClient),
    helperLoaded: !!window.frqncy,
    apiPresent: !!window.frqncyAuth,
  };
});

// Google Fonts can stall the headless font loader indefinitely; screenshots
// wait on it. Never let a screenshot fail the run.
async function shot(page, name, opts) {
  try { await page.screenshot(Object.assign({ path: `${SHOTS}/${name}`, timeout: 12000 }, opts || {})); }
  catch (e) { console.log(`  (screenshot ${name} skipped: ${String(e).split('\n')[0].slice(0, 60)})`); }
}

const browser = await chromium.launch({ executablePath: EXEC, headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
// Google Fonts never resolves in this sandbox, and page.screenshot() blocks on
// the font loader. Abort those requests so timing measures the app, not the CDN.
// (Screenshots therefore render in fallback faces — layout is real, type is not.)
await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push(String(e).slice(0, 200)));

// ── T1: a plain content page, logged out ───────────────────────────────────
await page.goto(`${BASE}/meditation/index.html`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(1200);
let s = await authState(page);
check('T1a  module loads on an ordinary topic page', s.apiPresent);
check('T1b  logged-out visitor is offered a sign-in', s.signInVisible, s.navText.slice(0, 90));
check('T1c  Supabase SDK NOT fetched when logged out', !s.sdkLoaded && !s.helperLoaded,
      `sdk=${s.sdkLoaded} helper=${s.helperLoaded}`);
await shot(page, '01-loggedout-topic.png');

// ── T2: sign in without leaving the page ───────────────────────────────────
const visibleSignIn = () => page.locator('[data-frqa="out"]:visible').first();
check('T1d  the sign-in is visible at 390px without opening a menu',
      await visibleSignIn().isVisible());
await visibleSignIn().click();
await page.waitForSelector('#frqncy-auth-sheet', { timeout: 5000 });
await shot(page, '02-sheet.png');
check('T2a  sheet opens in place (no navigation)', page.url().includes('/meditation/'));
// The card must actually be on top — a positioned div loses to hero stacking
// contexts on topic pages, which is why this is a <dialog> in the top layer.
const onTop = await page.evaluate(() => {
  const card = document.querySelector('#frqncy-auth-sheet .frqa-card');
  if (!card) return { ok: false, hit: 'no card' };
  const r = card.getBoundingClientRect();
  const el = document.elementFromPoint(r.x + r.width / 2, r.y + 24);
  return { ok: !!el && card.contains(el), hit: el ? (el.tagName + '.' + el.className).slice(0, 40) : 'null',
           tag: document.getElementById('frqncy-auth-sheet').tagName };
});
check('T2a2 the card is on top of the page, not painted through',
      onTop.ok, `${onTop.tag} → hit ${onTop.hit}`);

await page.fill('#frqaEmail', EMAIL);
await page.fill('#frqaPass', PASS);
await page.click('#frqaGo');
// Wait for the session to actually exist rather than for a guess at how long
// the CDN takes — the SDK is fetched on demand, so a cold fetch is in here.
await page.waitForFunction(
  () => !!localStorage.getItem('sb-vyazlspbmwmlyncdlezh-auth-token'),
  null, { timeout: 30000 }
).catch(() => {});
await page.waitForTimeout(1500);
s = await authState(page);
check('T2b  signed in from a content page', s.signedInVisible && s.hasToken, s.navText.slice(0, 90));
check('T2c  session belongs to the test account', s.tokenEmail === EMAIL, String(s.tokenEmail));
check('T2d  still on the same page afterwards', page.url().includes('/meditation/'), page.url());
await shot(page, '03-signedin-topic.png');

// ── T3: the same session on every other surface ────────────────────────────
const surfaces = [
  ['/index.html',                 'home'],
  ['/explore.html',               'explore'],
  ['/watch/index.html',           'watch'],
  ['/my-frqncy/index.html',       'my-frqncy hub'],
  ['/my-frqncy/dashboard/',       'sanctuary dashboard'],
  ['/courses/index.html',         'courses'],
];
for (const [path, label] of surfaces) {
  await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1800);
  const st = await authState(page);
  check(`T3  ${label} — signed in, no second login`, st.signedInVisible && st.hasToken,
        st.signedInVisible ? '' : st.navText.slice(0, 90));
}

// ── T4: VBRTN, which carries its own in-room control ───────────────────────
await page.goto(`${BASE}/my-frqncy/vbrtn/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(5000);
s = await authState(page);
check('T4a  VBRTN sees the session from the website login',
      (s.ownSlotText || '').includes('@') || (s.ownSlotText || '').includes('Sign out'),
      `acctSlot="${s.ownSlotText}"`);
check('T4b  no duplicate control painted over VBRTN\'s own',
      !s.signInVisible && !s.signedInVisible);
await shot(page, '04-vbrtn-signedin.png');

// ── T4c: the sync pill must not navigate out of the installed app ──────────
await page.evaluate(() => window.frqncyAuth ? window.frqncyAuth.signOut() : (window.frqncy && window.frqncy.auth.signOut()));
await page.waitForTimeout(1500);
await page.goto(`${BASE}/my-frqncy/vbrtn/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(3500);
const pill = page.locator('[data-vbrtn-signin]');
if (await pill.count()) {
  await pill.first().click();
  await page.waitForTimeout(800);
  const still = page.url().includes('/vbrtn/');
  const sheet = await page.locator('#vbrtnSheet, #frqncy-auth-sheet').count();
  check('T4c  sync pill opens the sheet instead of leaving for /social/login/',
        still && sheet > 0, `url=${page.url().split('8787')[1]} sheets=${sheet}`);
  await shot(page, '07-vbrtn-pill-sheet.png');
  await page.keyboard.press('Escape');
} else {
  check('T4c  sync pill present on VBRTN', false, 'no [data-vbrtn-signin] found');
}
// back in for the remaining surface checks
await page.evaluate(async ([e, p]) => { await window.frqncy.ready; return window.frqncy.auth.signIn({ email: e, password: p }); }, [EMAIL, PASS]);
await page.waitForTimeout(2000);

// ── T5: NRG / social, the Astro surface ────────────────────────────────────
await page.goto(`${BASE}/social/index.html`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(2500);
const nrg = await page.evaluate(() => ({
  token: !!localStorage.getItem('sb-vyazlspbmwmlyncdlezh-auth-token'),
  body: document.body.innerText.replace(/\s+/g, ' ').slice(0, 300),
}));
check('T5  NRG reads the same session token', nrg.token, nrg.body.slice(0, 80));

// ── T6: desktop width puts it in the nav proper ────────────────────────────
await page.setViewportSize({ width: 1280, height: 900 });
await page.goto(`${BASE}/explore.html`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(1500);
const desk = await page.evaluate(() => {
  const li = document.querySelector('li[data-frqa]');
  const bar = document.querySelector('[data-frqa="bar"]');
  const vis = el => !!el && !!(el.offsetWidth || el.offsetHeight);
  return { li: vis(li), bar: vis(bar), text: li ? li.innerText.trim() : '' };
});
check('T6  desktop shows it in the nav list, not the phone bar',
      desk.li && !desk.bar, `li=${desk.li} bar=${desk.bar} "${desk.text}"`);
await shot(page, '05-desktop-nav.png', { clip: { x: 0, y: 0, width: 1280, height: 120 } });
await page.setViewportSize({ width: 390, height: 844 });

// ── T9: the surfaces that do not load mobile-nav.js ────────────────────────
for (const [path, label] of [['/my-frqncy/intake/', 'intake'], ['/my-frqncy/charts/', 'charts'], ['/my-frqncy.html', 'my-frqncy (legacy)']]) {
  await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2000);
  const vis = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('[data-frqa]'));
    const shown = all.filter(el => !!(el.offsetWidth || el.offsetHeight));
    return { present: all.length, seen: shown.length,
             kinds: all.map(el => el.getAttribute('data-frqa')).join(','),
             api: !!window.frqncyAuth };
  });
  check(`T9  ${label} — account control present and visible`, vis.present > 0 && vis.seen > 0, JSON.stringify(vis));
}

// ── T7: signing out is universal too ───────────────────────────────────────
await page.evaluate(() => window.frqncyAuth.signOut());
await page.waitForTimeout(2500);
await page.goto(`${BASE}/watch/index.html`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(1500);
s = await authState(page);
check('T7  signing out on one surface signs out on the others', s.signInVisible && !s.hasToken,
      `token=${s.hasToken}`);

check('T8  no page errors across the whole run', errors.length === 0, errors.slice(0, 3).join(' | '));

await browser.close();

const failed = results.filter(r => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length) { console.log('FAILED:', failed.map(f => f.name).join(', ')); process.exit(1); }
