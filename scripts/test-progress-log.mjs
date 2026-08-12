/**
 * Progress log — end-to-end test against a real Supabase account.
 *
 * Covers the chain the log depends on:
 *   1. a signed-in visit to a topic page writes a Journey entry (charts row
 *      name='Journey') without the page doing anything,
 *   2. the existing per-surface stores (courses, practice, watch, Sanctuary,
 *      VBRTN) leave the rows/blobs the log derives from,
 *   3. /my-frqncy/log/ reads all of it back as one day-grouped record,
 *   4. logged out, the page offers the sign-in sheet and reads nothing.
 *
 * Serve the checkout first:  python3 -m http.server 8788
 * Credentials come from the environment — this repo is public:
 *   FRQNCY_TEST_EMAIL=... FRQNCY_TEST_PASSWORD=... node scripts/test-progress-log.mjs
 * The account is created via the auth API if it does not exist
 * (mailer_autoconfirm is on for this project, so no mail is sent).
 */
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const EXEC  = process.env.PLAYWRIGHT_CHROMIUM ||
  '/Users/orli/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const BASE  = process.env.FRQNCY_TEST_BASE || 'http://localhost:8788';
const EMAIL = process.env.FRQNCY_TEST_EMAIL;
const PASS  = process.env.FRQNCY_TEST_PASSWORD;
const SHOTS = process.env.FRQNCY_TEST_SHOTS || '/tmp/frqncy-log-shots';

const SUPABASE_URL  = 'https://vyazlspbmwmlyncdlezh.supabase.co';
const SUPABASE_ANON = 'sb_publishable_zFdrbkExarUfR2PAe4FcAQ_yvcL31CI';

if (!EMAIL || !PASS) {
  console.error('Set FRQNCY_TEST_EMAIL and FRQNCY_TEST_PASSWORD (a throwaway Supabase account).');
  process.exit(2);
}
mkdirSync(SHOTS, { recursive: true });

const results = [];
function check(name, pass, detail) {
  results.push({ name, pass, detail: detail || '' });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
}

// ── T0: make sure the account exists (idempotent — 400 if already there) ───
{
  const r = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', apikey: SUPABASE_ANON },
    body: JSON.stringify({ email: EMAIL, password: PASS }),
  });
  const body = await r.json().catch(() => ({}));
  const exists = /already|registered/i.test(JSON.stringify(body));
  check('T0  test account exists or was created', r.ok || exists,
        r.ok ? 'created/confirmed' : JSON.stringify(body).slice(0, 100));
}

const browser = await chromium.launch({ executablePath: EXEC, headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push(String(e).slice(0, 200)));

async function shot(name) {
  try { await page.screenshot({ path: `${SHOTS}/${name}`, timeout: 12000 }); }
  catch (e) { console.log(`  (screenshot ${name} skipped)`); }
}

// ── T1: sign in on a topic page; the visit journals itself ─────────────────
await page.goto(`${BASE}/meditation/index.html`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(1200);
await page.locator('[data-frqa="out"]:visible').first().click();
await page.waitForSelector('#frqaEmail', { timeout: 5000 });
await page.fill('#frqaEmail', EMAIL);
await page.fill('#frqaPass', PASS);
await page.click('#frqaGo');
await page.waitForFunction(
  () => !!localStorage.getItem('sb-vyazlspbmwmlyncdlezh-auth-token'),
  null, { timeout: 30000 }
).catch(() => {});
// journeyNote debounces 1200ms, then a round-trip — give it room.
await page.waitForTimeout(5000);
const journey = await page.evaluate(async () => {
  await window.frqncy.ready;
  const user = await window.frqncy.auth.getUser();
  if (!user) return { user: false };
  const st = await window.frqncy.journeyStore(user).getState();
  return { user: true, entries: (st.entries || []).map(e => e.s + ':' + e.k + ':' + (e.ref || '')) };
});
check('T1a  signed in on the topic page', journey.user === true);
check('T1b  the visit wrote a Journey entry (topics:read:meditation)',
      (journey.entries || []).includes('topics:read:meditation'),
      (journey.entries || []).slice(-5).join(' | '));

// ── T2: seed one record per surface through the real stores ────────────────
const seeded = await page.evaluate(async () => {
  const out = {};
  const user = await window.frqncy.auth.getUser();
  const c = window.frqncy.client;
  // Courses — enrollment + a completed lesson
  try {
    const cs = window.frqncy.coursesStore(user);
    await cs.enroll('meditation-101');
    await cs.setLessonComplete('meditation-101', 'l1', true);
    out.courses = true;
  } catch (e) { out.courses = String(e && e.message).slice(0, 80); }
  // Practice — one sitting
  try {
    const { error } = await c.from('practice_logs').insert({
      user_id: user.id, practice_slug: 'meditation', duration_minutes: 10 });
    out.practice = error ? String(error.message).slice(0, 80) : true;
  } catch (e) { out.practice = String(e && e.message).slice(0, 80); }
  // Watch — one finished video
  try {
    await window.frqncy.videoProgressStore(user).setState({
      testvid01: { pos: 540, dur: 600, pct: 100, completed: true,
        title: 'Test video for the log', provider: 'youtube',
        updatedAt: new Date().toISOString() } });
    out.watch = true;
  } catch (e) { out.watch = String(e && e.message).slice(0, 80); }
  // Sanctuary — today's intention (also fires the 'tended' journey note)
  try {
    const day = (d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`)(new Date());
    const st = window.frqncy.sanctuaryStore(user);
    const cur = (await st.getState()) || {};
    cur.dailyIntentions = cur.dailyIntentions || {};
    cur.dailyIntentions[day] = { intention: 'Move once with full attention.' };
    await st.setState(cur);
    out.sanctuary = true;
  } catch (e) { out.sanctuary = String(e && e.message).slice(0, 80); }
  // VBRTN — intake milestones
  try {
    await window.frqncy.vbrtnStore(user).setState({
      baseline: { intakeStartedAt: Date.now() - 60000, intakeCompletedAt: Date.now() },
      _updatedAt: Date.now() });
    out.vbrtn = true;
  } catch (e) { out.vbrtn = String(e && e.message).slice(0, 80); }
  // NRG — one post (tolerated if RLS or schema refuses; recorded either way)
  try {
    const { data, error } = await c.from('posts')
      .insert({ author_id: user.id, content: 'Progress-log test post — safe to delete.' })
      .select('id').single();
    out.nrg = error ? String(error.message).slice(0, 80) : (data && data.id ? true : false);
  } catch (e) { out.nrg = String(e && e.message).slice(0, 80); }
  return out;
});
check('T2a  courses seeded (enroll + lesson complete)', seeded.courses === true, String(seeded.courses));
check('T2b  practice seeded', seeded.practice === true, String(seeded.practice));
check('T2c  watch seeded', seeded.watch === true, String(seeded.watch));
check('T2d  sanctuary seeded', seeded.sanctuary === true, String(seeded.sanctuary));
check('T2e  vbrtn seeded', seeded.vbrtn === true, String(seeded.vbrtn));
const nrgSeeded = seeded.nrg === true;
console.log(nrgSeeded ? '  (NRG post created)' : `  (NRG post not created: ${seeded.nrg} — T3 checks it only if created)`);
// The sanctuary/vbrtn journey notes debounce 1200ms — let them land.
await page.waitForTimeout(3500);

// ── T3: the log reads it all back ───────────────────────────────────────────
await page.goto(`${BASE}/my-frqncy/log/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForFunction(
  () => { const r = document.getElementById('log-root'); return r && !/Reading…/.test(r.textContent); },
  null, { timeout: 30000 }
).catch(() => {});
await page.waitForTimeout(1000);
const log = await page.evaluate(() => {
  const r = document.getElementById('log-root');
  return { text: (r ? r.innerText : '').replace(/\s+/g, ' '),
           days: Array.from(document.querySelectorAll('.day h2')).map(h => h.textContent),
           chips: Array.from(document.querySelectorAll('.totals span')).map(s => s.textContent.trim()) };
});
check('T3a  a Today group renders', log.days.includes('Today'), log.days.join(', '));
check('T3b  the topic read is in the record', /Read Meditation/i.test(log.text));
check('T3c  the completed lesson is in the record', /Completed .*Meditation 101/i.test(log.text));
check('T3d  the enrolment is in the record', /Enrolled in Meditation 101/i.test(log.text));
check('T3e  the practice sitting is in the record', /Practised Meditation/i.test(log.text));
check('T3f  the finished video is in the record', /Finished Test video for the log/i.test(log.text));
check('T3g  the day\'s intention is in the record', /intention/i.test(log.text));
check('T3h  the VBRTN intake is in the record', /Completed the VBRTN intake/i.test(log.text));
if (nrgSeeded) check('T3i  the NRG post is in the record', /Posted .*Progress-log test post/i.test(log.text));
check('T3j  totals strip renders with counts', log.chips.length >= 3, log.chips.join(' · '));
check('T3k  no ranking or streak language on the page',
      !/streak|leaderboard|rank/i.test(log.text));
await shot('01-log-signedin.png');

// ── T4: logged out, the page holds the door instead of the data ────────────
await page.evaluate(() => window.frqncyAuth.signOut());
await page.waitForTimeout(2500);
await page.goto(`${BASE}/my-frqncy/log/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(2500);
const gate = await page.evaluate(() => ({
  gate: !!document.querySelector('.gate'),
  btn: !!document.getElementById('log-signin'),
  entries: document.querySelectorAll('.entry').length,
}));
check('T4a  signed out, the gate shows and no record renders',
      gate.gate && gate.btn && gate.entries === 0, JSON.stringify(gate));
const sheetOpens = await page.evaluate(() => {
  document.getElementById('log-signin').click();
  return new Promise(res => setTimeout(() => res(!!document.getElementById('frqncy-auth-sheet')), 800));
});
check('T4b  the gate button opens the sign-in sheet in place', sheetOpens);
await shot('02-log-gate.png');

check('T5  no page errors across the whole run', errors.length === 0, errors.slice(0, 3).join(' | '));

await browser.close();

const failed = results.filter(r => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length) { console.log('FAILED:', failed.map(f => f.name).join(', ')); process.exit(1); }
