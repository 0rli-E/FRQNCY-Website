#!/usr/bin/env node
/**
 * FRQNCY status probe — derives state instead of asserting it.
 *
 * Every status doc in proposals/ goes stale within weeks because it states
 * facts in prose that nothing re-checks. This script checks them instead.
 *
 *   node scripts/status.mjs            # human-readable
 *   node scripts/status.mjs --md       # markdown (for pasting into Miro/docs)
 *   node scripts/status.mjs --no-net   # skip prod probes (offline / fast)
 *
 * Exit code is always 0 — this is a report, not a gate.
 */

import { execSync } from 'node:child_process';
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

// repo path contains a space — never use URL.pathname here
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const MD = process.argv.includes('--md');
const NO_NET = process.argv.includes('--no-net');
const PROD = 'https://frqncy.network';

const sh = (cmd) => {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
};

// ── prod probes ────────────────────────────────────────────────────
// Clean URLs only. Requesting /x/index.html returns 0 bytes and reads as a
// false negative — see reference_prod_route_truth.
const ROUTES = [
  '/', '/privacy', '/terms', '/podcast', '/newsletter', '/aligned',
  '/my-frqncy', '/my-frqncy/intake/', '/my-frqncy/vbrtn/',
  '/my-frqncy/dashboard/', '/social/', '/nrg', '/create', '/read', '/rich',
];

async function probeRoutes() {
  if (NO_NET) return null;
  const out = await Promise.all(ROUTES.map(async (p) => {
    try {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), 12000);
      const r = await fetch(PROD + p, { redirect: 'follow', signal: ctl.signal });
      clearTimeout(t);
      return [p, r.status];
    } catch {
      return [p, 'ERR'];
    }
  }));
  return out;
}

// The companion validates shape before it can hit the crash, so a body using
// `message` returns a clean 400 that looks healthy. Must send `messages` AND a
// string-valued profile.music to surface the real failure.
async function probeCompanion() {
  if (NO_NET) return null;
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 40000);
    const r = await fetch(PROD + '/api/companion', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'hello' }],
        profile: { music: 'ambient', name: 'probe' },
      }),
      signal: ctl.signal,
    });
    clearTimeout(t);
    const body = await r.text();
    return { status: r.status, hint: r.status >= 500 ? body.trim().slice(0, 60) : 'responds' };
  } catch (e) {
    return { status: 'ERR', hint: e.message.slice(0, 60) };
  }
}

// ── git ────────────────────────────────────────────────────────────
function gitState() {
  const branch = sh('git branch --show-current') || '(detached)';
  const counts = sh('git rev-list --left-right --count origin/main...HEAD');
  const [behind, ahead] = counts ? counts.split(/\s+/) : ['?', '?'];
  const dirty = sh('git status --porcelain').split('\n').filter(Boolean).length;
  const unpushed = sh('git log origin/main..HEAD --oneline').split('\n').filter(Boolean);
  const branches = sh("git for-each-ref --format='%(refname:short)' refs/heads")
    .split('\n').filter(Boolean);
  const aheadOf = branches.map((b) => {
    const n = sh(`git rev-list --count origin/main..${b}`);
    return n && n !== '0' ? { branch: b, ahead: Number(n) } : null;
  }).filter(Boolean).sort((a, b) => b.ahead - a.ahead);
  const worktrees = sh('git worktree list').split('\n').filter(Boolean).length;
  return { branch, behind, ahead, dirty, unpushed, aheadOf, worktrees };
}

// ── data beds ──────────────────────────────────────────────────────
const BEDS = ['people.json', 'books.json', 'orgs.json', 'media.json', 'music.json',
  'places.json', 'papers.json', 'aligned-goods.json', 'content.json', 'resources.json'];

function bedCounts() {
  return BEDS.map((f) => {
    const p = join(ROOT, f);
    if (!existsSync(p)) return { f, n: '—' };
    try {
      const d = JSON.parse(readFileSync(p, 'utf8'));
      const n = Array.isArray(d)
        ? d.length
        : Object.values(d).reduce((a, v) => a + (Array.isArray(v) ? v.length : 0), 0)
          || Object.keys(d).length;
      return { f, n };
    } catch {
      return { f, n: 'PARSE FAIL' };
    }
  });
}

// ── doc staleness ──────────────────────────────────────────────────
// Status docs that claim to describe reality. Age is the signal.
const STATUS_DOCS = [
  'proposals/MASTER-ROADMAP.md',
  'proposals/BACKEND-STATUS.md',
  'proposals/VISIBILITY-PLAN.md',
  'proposals/SANCTUARY-ROADMAP.md',
  'proposals/EXECUTION-PLAN-90D.md',
];

function docAges() {
  const now = Date.now();
  return STATUS_DOCS.map((d) => {
    const p = join(ROOT, d);
    if (!existsSync(p)) return { d, days: '—' };
    const days = Math.floor((now - statSync(p).mtimeMs) / 86400000);
    return { d, days };
  }).sort((a, b) => (b.days || 0) - (a.days || 0));
}

// ── render ─────────────────────────────────────────────────────────
const ok = (b) => (MD ? (b ? '✅' : '🔴') : (b ? 'OK  ' : 'FAIL'));

async function main() {
  const g = gitState();
  const [routes, companion] = await Promise.all([probeRoutes(), probeCompanion()]);
  const beds = bedCounts();
  const docs = docAges();
  const L = [];
  const h = (t) => L.push(MD ? `\n## ${t}\n` : `\n=== ${t} ===`);

  L.push(MD ? `# FRQNCY status — ${new Date().toISOString().slice(0, 10)}` : `FRQNCY STATUS — ${new Date().toISOString().slice(0, 10)}`);
  if (NO_NET) L.push(MD ? '\n_(offline run — prod not probed)_' : '(offline run)');

  h('Deploy gap — built vs live');
  L.push(`branch: ${g.branch} · ${g.ahead} ahead / ${g.behind} behind origin/main · ${g.dirty} uncommitted files · ${g.worktrees} worktrees`);
  if (g.aheadOf.length) {
    L.push(MD ? '\nBranches carrying undeployed work:\n' : 'Branches carrying undeployed work:');
    g.aheadOf.forEach((b) => L.push(`${MD ? '- ' : '  '}${b.branch} — ${b.ahead} commits ahead of origin/main`));
  } else {
    L.push('No branch is ahead of origin/main. Everything committed is deployed.');
  }

  if (routes) {
    h('Prod routes');
    routes.forEach(([p, s]) => {
      const good = s === 200;
      L.push(`${MD ? '- ' : '  '}${ok(good)} ${s}  ${p}`);
    });
  }

  if (companion) {
    h('VBRTN companion');
    const good = companion.status === 200;
    L.push(`${ok(good)} POST /api/companion -> ${companion.status} (${companion.hint})`);
    if (!good) L.push(MD ? '  \n  _500 here = the fix is written but not deployed._' : '  (500 = fix written, not deployed)');
  }

  h('Data beds');
  beds.forEach((b) => L.push(`${MD ? '- ' : '  '}${String(b.n).padStart(6)}  ${b.f}`));

  h('Status-doc staleness');
  docs.forEach((d) => {
    const stale = typeof d.days === 'number' && d.days > 30;
    L.push(`${MD ? '- ' : '  '}${stale ? '⚠️ ' : '   '}${String(d.days).padStart(4)}d  ${d.d}${stale ? '  — older than 30d, do not trust its claims' : ''}`);
  });

  console.log(L.join('\n'));
}

main();
