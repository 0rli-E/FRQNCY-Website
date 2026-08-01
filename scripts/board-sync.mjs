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
// FRQNCY DASHBOARDS. The old 'To-Do & Live Status' board (uXjVH1jzUtM=) was
// deleted 2026-08-01 — it now returns "Board access denied". This is the only
// kanban home. It works at ~25x normal coordinate scale, hence --scale=25.
const BOARD = 'https://miro.com/app/board/uXjVHBAAjNo=/';

const MD = process.argv.includes('--md');
const WITH_CLOSED = process.argv.includes('--closed');
// The FRQNCY DASHBOARDS board works at roughly 25x normal coordinate scale
// (frames ~44000 wide, font sizes ~288), so a default-scale kanban is invisible
// on it. --scale/--y place a correctly-sized board anywhere.
const SCALE = Number((process.argv.find((a) => a.startsWith('--scale=')) || '').split('=')[1]) || 1;
const Y_AT = (() => {
  const v = (process.argv.find((a) => a.startsWith('--y=')) || '').split('=')[1];
  return v === undefined ? null : Number(v);
})();

const OWNER = {
  'owner:orlando': 'Orlando', 'owner:claude': 'Claude', 'owner:norman': 'Norman',
  'owner:katzi': 'Katzi', 'owner:petra': 'Petra', 'owner:nikolaus': 'Nikolaus',
  'owner:team': 'Team',
};
const STATUS = { 'do-now': 'DO NOW', next: 'Next', later: 'Later', decision: 'Decision' };
const AREA = {
  'area:deploy': 'Deploy', 'area:visibility': 'Visibility', 'area:legal': 'Legal',
  'area:vbrtn': 'VBRTN', 'area:money': 'Money', 'area:content': 'Content',
  'area:social': 'Social', 'area:mvp': 'MVP', 'area:identity': 'Identity',
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
      wip: names.includes('in-progress'),
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

  // ── Miro kanban DSL ───────────────────────────────────────────────
  // Lanes are frames; issues are cards. Regenerating replaces the lanes
  // wholesale, so dragging a card in Miro is cosmetic — move the label in
  // GitHub instead. This is a printout, not a workspace.
  const LANES = [
    { key: 'In progress', fill: '#E3F0FD', theme: '#1d76db' },
    { key: 'DO NOW',   fill: '#FDECEA', theme: '#e53935' },
    { key: 'Next',     fill: '#FFF4E5', theme: '#ffa500' },
    { key: 'Decision', fill: '#F3E8FB', theme: '#8e24aa' },
    { key: 'Later',    fill: '#F0F0F0', theme: '#9e9e9e' },
    { key: 'Done',     fill: '#E8F7EF', theme: '#23C27F' },
  ];

  const K = SCALE;
  const CARD_W = 520 * K, CARD_H = 190 * K, GAP = 34 * K;
  const LANE_W = 620 * K, PAD = 150 * K, LANE_GAP = 60 * K;
  // Board y-offset: keeps the kanban clear of whatever is already placed.
  const LANE_Y = Y_AT === null ? 3200 : Y_AT;
  const tallest = Math.max(...LANES.map((l) =>
    list.filter((i) => laneOf(i) === l.key).length));
  const LANE_H = Math.max(900 * K, PAD + tallest * (CARD_H + GAP) + 80 * K);

  const esc = (t) => String(t).replace(/"/g, "'").replace(/&/g, 'and');

  console.log(`# Generated ${new Date().toISOString().slice(0, 10)} from github.com/${REPO}`);
  console.log(`# Board: ${BOARD}`);
  console.log(`# Kanban lanes are GENERATED. Move the label in GitHub, not the card here.`);

  LANES.forEach((lane, li) => {
    const rows = list.filter((i) => laneOf(i) === lane.key);
    const x = (li - 1) * (LANE_W + LANE_GAP);
    console.log(`\nlane${li} FRAME x=${x} y=${LANE_Y} w=${LANE_W} h=${LANE_H} fill=${lane.fill} "${lane.key}  (${rows.length})"`);
    rows.forEach((i, ri) => {
      const y = PAD + ri * (CARD_H + GAP);
      const desc = esc(i.why).slice(0, 200);
      console.log(`c${i.n} CARD parent=lane${li} x=${LANE_W / 2} y=${y} w=${CARD_W} h=${CARD_H} theme=${lane.theme} desc="${i.area ? i.area + '. ' : ''}${desc}" "[${i.owner || 'unassigned'}]  #${i.n} ${esc(i.title)}"`);
    });
  });
}

function laneOf(i) {
  if (i.state === 'CLOSED') return 'Done';
  if (i.wip) return 'In progress';
  return i.status || 'Later';
}

main();
