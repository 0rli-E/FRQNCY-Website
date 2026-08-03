/**
 * /api/scoreboard — the one number that matters, and its honest denominator
 * Cloudflare Pages Function (ESM, edge runtime)
 *
 * FRQNCY HQ names the metric: **emails captured**. This page reports it without
 * flattering it — the raw row count in `subscribers` is not the score, because
 * that table also holds smoke tests, deploy pre-checks and the founder's own
 * addresses. Reporting 9 when 2 strangers have actually signed up would make
 * this page worse than having no page.
 *
 * Built on the conventions already in functions/api/analytics.js rather than
 * beside them: same env var names (PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY),
 * same service-role REST call shape, same "never surface a stack trace" posture.
 *
 * Reads only. Never writes. Never renders an email address — only counts and
 * source labels, so an accidental share leaks no one's contact details.
 *
 * Deliberately NOT a leaderboard and never a ranking of people (editorial
 * values). It counts events and sources, not persons-by-merit.
 *
 * noindex via BOTH a meta tag and an X-Robots-Tag header, and it is linked from
 * nowhere. An unlinked URL is not a secret, which is exactly why no email, name
 * or token ever appears in the output.
 */

// ─── Exclusion rules ─────────────────────────────────────────────────────────
// Every excluded row is COUNTED AND SHOWN on the page with the rule that caught
// it. Silent filtering is how a dashboard starts lying — if the rules are wrong
// you should be able to see that they are wrong.

/** Address patterns that are ours, from the brief. */
const TEST_EMAIL_PATTERNS = [
  { label: 'frqncy.test.*', test: (e) => e.startsWith('frqncy.test.') },
  { label: '*+resendtest*', test: (e) => e.includes('+resendtest') },
];

/** Sources that only a script ever writes. Found in the live data, not guessed. */
const OPS_SOURCES = new Set(['smoke', 'deploy_precheck', 'resend-verification']);

/** Addresses belonging to the team. Not excluded — surfaced separately, so the
 *  external number is visible without anyone having to do subtraction. */
const TEAM_PATTERNS = [
  (e) => e.endsWith('@frqncy.network'),
  (e) => e.replace(/\+[^@]*/, '').toLowerCase() === 'orlando.eisenreich@gmail.com',
  (e) => e.toLowerCase() === 'eisenreichorlando@gmail.com',
];

export function classify(row) {
  const email = String(row.email || '').toLowerCase();
  for (const p of TEST_EMAIL_PATTERNS) {
    if (p.test(email)) return { kind: 'excluded', why: `address matches ${p.label}` };
  }
  if (OPS_SOURCES.has(row.source)) {
    return { kind: 'excluded', why: `source is "${row.source}" (written by a script)` };
  }
  if (TEAM_PATTERNS.some((t) => t(email))) return { kind: 'team', why: 'team address' };
  return { kind: 'external', why: null };
}

// ─── Supabase read (service role — subscribers is RLS-protected) ─────────────

async function fetchSubscribers(env) {
  const url =
    `${env.PUBLIC_SUPABASE_URL}/rest/v1/subscribers` +
    `?select=email,source,confirmed,unsubscribed_at,created_at&order=created_at.desc`;
  const res = await fetch(url, {
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });
  if (!res.ok) throw new Error(`subscribers read failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function countAnalyticsEvents(env) {
  // HEAD + count so we never pull the event log itself over the wire.
  const url = `${env.PUBLIC_SUPABASE_URL}/rest/v1/analytics_events?select=id`;
  const res = await fetch(url, {
    method: 'HEAD',
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      Prefer: 'count=exact',
      Range: '0-0',
    },
  });
  const cr = res.headers.get('content-range') || '';
  const m = cr.match(/\/(\d+)$/);
  return m ? Number(m[1]) : null;
}

// ─── Rendering ───────────────────────────────────────────────────────────────

const esc = (s) =>
  String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );

function dayKey(iso) {
  return String(iso).slice(0, 10);
}

export function buildTrend(rows, days = 7) {
  // Bucket by UTC day for the last `days` days, oldest first.
  const today = new Date();
  const buckets = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400000);
    buckets.push({ day: d.toISOString().slice(0, 10), n: 0 });
  }
  const index = new Map(buckets.map((b, i) => [b.day, i]));
  for (const r of rows) {
    const i = index.get(dayKey(r.created_at));
    if (i !== undefined) buckets[i].n++;
  }
  return buckets;
}

function bar(n, max) {
  if (!max) return '';
  const width = Math.round((n / max) * 24);
  return '█'.repeat(width) + '·'.repeat(24 - width);
}

function render({ rows, analyticsTotal, error }) {
  const now = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';

  if (error) {
    return page(`<h1>Scoreboard unavailable</h1>
      <p class="muted">${esc(error)}</p>
      <p class="muted">This page needs <code>PUBLIC_SUPABASE_URL</code> and
      <code>SUPABASE_SERVICE_ROLE_KEY</code> in the Cloudflare Pages environment.
      The service-role key is required because <code>subscribers</code> is RLS-protected
      and only <code>service_role</code> may read it.</p>`, now);
  }

  const classified = rows.map((r) => ({ ...r, ...classify(r) }));
  const excluded = classified.filter((r) => r.kind === 'excluded');
  const counted = classified.filter((r) => r.kind !== 'excluded');
  const team = counted.filter((r) => r.kind === 'team');
  const external = counted.filter((r) => r.kind === 'external');
  const unsub = counted.filter((r) => r.unsubscribed_at);
  const active = counted.filter((r) => !r.unsubscribed_at);
  const activeExternal = external.filter((r) => !r.unsubscribed_at);

  // Per-source, counted rows only, door_* grouped together.
  const bySource = new Map();
  for (const r of counted) {
    const key = String(r.source || 'unknown').startsWith('door_') ? 'door_* (funnel doors)' : String(r.source || 'unknown');
    bySource.set(key, (bySource.get(key) || 0) + 1);
  }
  const sourceRows = [...bySource.entries()].sort((a, b) => b[1] - a[1]);
  const hasDoor = sourceRows.some(([k]) => k.startsWith('door_'));

  const trend = buildTrend(counted);
  const trendMax = Math.max(...trend.map((t) => t.n), 0);

  return page(`
    <h1>Know the score</h1>
    <p class="muted">The metric that matters is <strong>emails captured</strong>. Generated live at ${esc(now)}.</p>

    <div class="grid">
      <div class="stat"><div class="n">${activeExternal.length}</div><div class="l">active · not us</div></div>
      <div class="stat"><div class="n">${active.length}</div><div class="l">active · incl. team</div></div>
      <div class="stat"><div class="n">${unsub.length}</div><div class="l">unsubscribed</div></div>
      <div class="stat"><div class="n">${excluded.length}</div><div class="l">excluded as test/ops</div></div>
    </div>

    <p class="note"><strong>Read the first number, not the second.</strong>
    ${activeExternal.length} ${activeExternal.length === 1 ? 'person is' : 'people are'} on the list who
    ${activeExternal.length === 1 ? 'is not' : 'are not'} us. ${team.length} of the counted rows
    ${team.length === 1 ? 'is a team address' : 'are team addresses'}, and ${excluded.length}
    ${excluded.length === 1 ? 'row was' : 'rows were'} left out entirely as test or ops noise.
    The raw table holds ${rows.length}.</p>

    <h2>Where they came from</h2>
    <table>
      <thead><tr><th>source</th><th class="r">n</th></tr></thead>
      <tbody>
        ${sourceRows.map(([s, n]) => `<tr><td><code>${esc(s)}</code></td><td class="r">${n}</td></tr>`).join('')}
      </tbody>
    </table>
    ${hasDoor ? '' : `<p class="warn">No <code>door_*</code> signups yet — the funnel doors
      (/create, /read, /rich) have not produced a single subscriber. Every row above came from
      the site overlay or the newsletter page.</p>`}

    <h2>Last 7 days</h2>
    <table class="trend">
      <tbody>
        ${trend.map((t) => `<tr><td><code>${esc(t.day)}</code></td><td class="bar">${bar(t.n, trendMax)}</td><td class="r">${t.n}</td></tr>`).join('')}
      </tbody>
    </table>

    <h2>Excluded rows</h2>
    ${excluded.length === 0
      ? '<p class="muted">Nothing excluded.</p>'
      : `<table><thead><tr><th>source</th><th>why it was excluded</th></tr></thead><tbody>
          ${excluded.map((r) => `<tr><td><code>${esc(r.source || 'unknown')}</code></td><td class="muted">${esc(r.why)}</td></tr>`).join('')}
        </tbody></table>
        <p class="muted">Addresses are never rendered on this page — only the source and the rule
        that matched. Change the rules in <code>functions/api/scoreboard.js</code>.</p>`}

    <h2>Event tracking</h2>
    ${analyticsTotal === 0
      ? `<p class="warn"><code>analytics_events</code> is <strong>empty</strong>. The
         <code>/api/analytics</code> collector is deployed and the table exists, but not one event
         has ever been recorded — so there is no page-view, funnel or engagement data behind this
         page, only the subscriber table. Worth fixing before trusting any traffic claim.</p>`
      : `<p class="muted"><code>analytics_events</code> holds ${analyticsTotal == null ? 'an unknown number of' : analyticsTotal} rows.</p>`}

    <p class="muted foot">No leaderboard, no ranking of people — counts and sources only.
    Not linked from anywhere and marked <code>noindex</code>; it still renders no personal data,
    because an unlinked URL is not a secret.</p>
  `, now);
}

function page(body, now) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow, noarchive">
<title>Scoreboard · FRQNCY</title>
<style>
  :root { --navy:#0B1C3D; --navy2:#12264d; --gold:#C4973A; --text:#E8ECF4; --dim:#8fa0bd; --line:#1e3260; }
  * { box-sizing:border-box; }
  body { margin:0; padding:2rem 1.25rem 4rem; background:var(--navy); color:var(--text);
         font:15px/1.6 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif; }
  main { max-width:52rem; margin:0 auto; }
  h1 { font-size:1.6rem; margin:0 0 .25rem; color:var(--gold); font-weight:600; }
  h2 { font-size:.95rem; margin:2.25rem 0 .6rem; color:var(--gold); text-transform:uppercase;
       letter-spacing:.12em; font-weight:600; }
  .muted { color:var(--dim); }
  .foot { margin-top:2.5rem; font-size:.8rem; }
  .grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(8.5rem,1fr)); gap:.75rem; margin:1.5rem 0 0; }
  .stat { background:var(--navy2); border:1px solid var(--line); border-radius:.65rem; padding:1rem; }
  .stat .n { font-size:2rem; font-weight:600; color:var(--gold); line-height:1.1; }
  .stat .l { font-size:.78rem; color:var(--dim); margin-top:.15rem; }
  .note { background:var(--navy2); border:1px solid var(--line); border-left:3px solid var(--gold);
          border-radius:.5rem; padding:.85rem 1rem; margin:1.25rem 0 0; font-size:.9rem; }
  .warn { background:#2a1e12; border:1px solid #6b4a1f; border-left:3px solid var(--gold);
          border-radius:.5rem; padding:.85rem 1rem; font-size:.88rem; }
  table { width:100%; border-collapse:collapse; font-size:.9rem; }
  th { text-align:left; font-weight:600; color:var(--dim); font-size:.75rem; text-transform:uppercase;
       letter-spacing:.08em; padding:.4rem .5rem; border-bottom:1px solid var(--line); }
  td { padding:.4rem .5rem; border-bottom:1px solid var(--line); vertical-align:top; }
  td.r, th.r { text-align:right; }
  code { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:.85em; color:var(--text); }
  .trend td { border-bottom:none; padding:.15rem .5rem; }
  .bar { font-family:ui-monospace,Menlo,monospace; color:var(--gold); letter-spacing:-1px; }
</style>
</head>
<body><main>${body}</main></body>
</html>`;
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function onRequest({ request, env }) {
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const headers = {
    'Content-Type': 'text/html; charset=utf-8',
    'X-Robots-Tag': 'noindex, nofollow, noarchive',
    'Cache-Control': 'no-store',
    'Referrer-Policy': 'no-referrer',
  };

  if (!env?.PUBLIC_SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(
      render({ error: 'Supabase environment variables are not configured on this deployment.' }),
      { status: 200, headers }
    );
  }

  try {
    const [rows, analyticsTotal] = await Promise.all([
      fetchSubscribers(env),
      countAnalyticsEvents(env).catch(() => null),
    ]);
    return new Response(render({ rows, analyticsTotal }), { status: 200, headers });
  } catch (err) {
    console.error('[scoreboard]', err);
    return new Response(render({ error: String(err.message || err) }), { status: 200, headers });
  }
}
