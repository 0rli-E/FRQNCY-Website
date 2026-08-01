#!/usr/bin/env node
/**
 * Regenerate the human-readable board view FROM GitHub issues.
 *
 * ARCHITECTURE — read this before changing anything:
 *
 *   GitHub Issues (0rli-E/frqncy-ops, private)  =  the ONLY source of truth.
 *   Everything else is a generated view. Never track task state anywhere else.
 *
 * Parallel tracking is what produced four mutually-contradicting status docs
 * in proposals/. Two systems that both hold state will disagree within weeks
 * and then neither can be trusted. So: write in GitHub, read anywhere.
 *
 *   node scripts/board-sync.mjs           # Miro DSL for the to-do table
 *   node scripts/board-sync.mjs --md      # markdown (Slack, docs, email)
 *   node scripts/board-sync.mjs --closed  # include closed issues
 *
 * The Miro DSL is emitted, not pushed — an agent session pipes it into
 * layout_update on the board. That keeps this script credential-free.
 */

import { execFileSync } from 'node:child_process';

const REPO = '0rli-E/frqncy-ops';
const BOARD = 'https://miro.com/app/board/uXjVH1jzUtM=/';

const MD = process.argv.includes('--md');
const WITH_CLOSED = process.argv.includes('--closed');

const OWNER = { 'owner:orlando': 'Orlando', 'owner:claude': 'Claude' };
const STATUS = { 'do-now': 'DO NOW', next: 'Next', later: 'Later', decision: 'Decision' };
const AREA = {
  'area:deploy': 'Deploy', 'area:visibility': 'Visibility', 'area:legal': 'Legal',
  'area:vbrtn': 'VBRTN', 'area:money': 'Money', 'area:content': 'Content',
};
const RANK = { 'DO NOW': 0, Next: 1, Decision: 2, Later: 3, '': 4 };

// First sentence of the body, minus markdown emphasis — the "why it matters"
// column. Issue bodies here open with the reason, by convention.
function why(body) {
  if (!body) return '';
  const firstPara = body.split(/\n\s*\n/)[0] || '';
  const plain = firstPara
    .replace(/\*\*|`|_/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
  const m = plain.match(/^.*?[.!?](?=\s|$)/);
  return (m ? m[0] : plain).slice(0, 240);
}

function issues() {
  const args = ['issue', 'list', '-R', REPO, '--limit', '200',
    '--json', 'number,title,labels,state,url,body'];
  if (WITH_CLOSED) args.push('--state', 'all');
  let raw;
  try {
    raw = execFileSync('gh', args, { encoding: 'utf8' });
  } catch (e) {
    console.error(`Could not read issues from ${REPO}.\n` +
      `Check: gh auth status  (needs repo scope, and access to a private repo)\n${e.message}`);
    process.exit(1);
  }
  return JSON.parse(raw).map((i) => {
    const names = i.labels.map((l) => l.name);
    const pick = (map) => names.map((n) => map[n]).find(Boolean) || '';
    return {
      n: i.number, title: i.title, url: i.url, state: i.state,
      owner: pick(OWNER), status: pick(STATUS), area: pick(AREA), why: why(i.body),
    };
  }).sort((a, b) => (RANK[a.status] - RANK[b.status]) || (a.n - b.n));
}

// Miro cells are pipe-delimited; a pipe or newline in a title would corrupt the row.
const cell = (s) => String(s).replace(/[|\n\r]+/g, ' ').trim();

function main() {
  const list = issues();
  if (!list.length) {
    console.error('No issues found — nothing to render.');
    process.exit(1);
  }

  if (MD) {
    const done = list.filter((i) => i.state === 'CLOSED').length;
    console.log(`# FRQNCY to-do — ${new Date().toISOString().slice(0, 10)}`);
    console.log(`\nSource of truth: https://github.com/${REPO}/issues · ${list.length} items${done ? ` (${done} closed)` : ''}\n`);
    for (const s of ['DO NOW', 'Next', 'Decision', 'Later']) {
      const rows = list.filter((i) => i.status === s && i.state !== 'CLOSED');
      if (!rows.length) continue;
      console.log(`\n## ${s}\n`);
      for (const r of rows) console.log(`- [ ] **#${r.n}** ${r.title} — _${r.owner}_ · ${r.area}`);
    }
    return;
  }

  // Miro DSL. Feed to layout_update (replacing the existing table) or layout_create.
  console.log(`# Generated ${new Date().toISOString().slice(0, 10)} from github.com/${REPO}`);
  console.log(`# Board: ${BOARD}`);
  console.log(`# Edit issues in GitHub, then re-run this. Never hand-edit the table.`);
  console.log(`tbl TABLE x=-1500 y=-1050 "FRQNCY To-Do" <<<`);
  console.log('Issue:link | Task:text | Owner:select(Orlando#C4973A, Claude#2d9bf0) | ' +
    'Status:select(DO NOW#e53935, Next#ffa500, Later#9e9e9e, Decision#8e24aa, Done#23C27F) | ' +
    'Area:select(Deploy#0B1C3D, Visibility#2d9bf0, Legal#e53935, VBRTN#8e24aa, Money#23C27F, Content#ffa500) | ' +
    'Why it matters:text');
  console.log('---');
  for (const i of list) {
    const st = i.state === 'CLOSED' ? 'Done' : i.status;
    console.log([i.url, `#${i.n} ${cell(i.title)}`, i.owner, st, i.area, cell(i.why)].join(' | '));
  }
  console.log('>>>');
}

main();
