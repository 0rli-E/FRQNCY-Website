#!/usr/bin/env node
/**
 * reflect-traces.js — Phase 4 seed of harness self-optimisation
 *
 * Reads ~/.frqncy-harness/traces/ and emits a markdown report grouped by
 * model, tool, error type, and cost. Designed to surface "where is time and
 * money going?" without trying to be a full analytics product.
 *
 * Usage:
 *   node scripts/reflect-traces.js                 # last 7 days, write to ~/.frqncy-harness/reports/
 *   node scripts/reflect-traces.js --since 30d     # last 30 days
 *   node scripts/reflect-traces.js --stdout        # print to stdout, don't write
 *   node scripts/reflect-traces.js --json          # machine-readable JSON instead of markdown
 *
 * No external deps — pure node stdlib so it works against any node ≥18.
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

// ─── arg parsing ──────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt  = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
};
const SINCE   = opt('--since', '7d');
const STDOUT  = flag('--stdout');
const JSON_OUT = flag('--json');

// ─── paths ────────────────────────────────────────────────────────────────
const HOME = homedir();
const TRACE_DIR = join(HOME, '.frqncy-harness', 'traces');
const REPORT_DIR = join(HOME, '.frqncy-harness', 'reports');
const INDEX = join(TRACE_DIR, 'INDEX.jsonl');

// ─── time window ──────────────────────────────────────────────────────────
function parseSince(s) {
  const m = /^(\d+)([dhm])$/.exec(s);
  if (!m) throw new Error(`bad --since: ${s}`);
  const n = Number(m[1]);
  const ms = { d: 86400000, h: 3600000, m: 60000 }[m[2]];
  return Date.now() - n * ms;
}
const sinceMs = parseSince(SINCE);

// ─── load index ───────────────────────────────────────────────────────────
function readJsonl(path) {
  try {
    return readFileSync(path, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        try { return JSON.parse(line); } catch { return null; }
      })
      .filter(Boolean);
  } catch { return []; }
}

const indexRows = readJsonl(INDEX);
const conversations = indexRows.filter((r) => {
  const t = Date.parse(r.started_at);
  return Number.isFinite(t) && t >= sinceMs;
});

// ─── stream events from each conversation file ────────────────────────────
function eventsFor(conv) {
  const date = (conv.started_at || '').slice(0, 10);
  const path = join(TRACE_DIR, date, `${conv.conversation_id}.jsonl`);
  return readJsonl(path);
}

// ─── aggregations ─────────────────────────────────────────────────────────
const byModel = new Map();   // model → {convs, cost, in, out, cached, errors}
const byTool  = new Map();   // tool name → {calls, errors, success}
const byStatus = new Map();  // status → count
const errors = [];           // {conv_id, model, error_text}

function bump(map, key, fn) {
  const cur = map.get(key) || {};
  map.set(key, fn(cur));
}

for (const conv of conversations) {
  const model = conv.model || 'unknown';
  bump(byModel, model, (c) => ({
    convs:   (c.convs || 0) + 1,
    cost:    (c.cost || 0) + (conv.total_cost_usd || 0),
    in:      (c.in || 0) + (conv.total_input_tokens || 0),
    out:     (c.out || 0) + (conv.total_output_tokens || 0),
    cached:  (c.cached || 0) + (conv.total_cached_input_tokens || 0),
    errors:  (c.errors || 0) + (conv.status === 'aborted_error' ? 1 : 0),
  }));
  bump(byStatus, conv.status || 'unknown', (c) => ({ count: (c.count || 0) + 1 }));

  // Walk events for tool stats
  const events = eventsFor(conv);
  const lastByCall = new Map();
  for (const ev of events) {
    if (ev.type === 'tool_call') {
      const c = ev.content || {};
      const name = c.toolName || ev.name || ev.tool || 'unknown';
      const id = c.toolCallId || ev.id;
      bump(byTool, name, (cur) => ({ calls: (cur.calls || 0) + 1, errors: cur.errors || 0, success: cur.success || 0 }));
      if (id) lastByCall.set(id, name);
    } else if (ev.type === 'tool_result') {
      const c = ev.content || {};
      const id = c.toolCallId || ev.id;
      const name = lastByCall.get(id) || c.toolName || ev.name || 'unknown';
      const resultText = typeof c.output === 'string' ? c.output : JSON.stringify(c.output ?? '');
      const isError = c.isError === true || ev.is_error === true || /^error|failed/i.test(resultText);
      bump(byTool, name, (cur) => ({
        calls: cur.calls || 0,
        errors: (cur.errors || 0) + (isError ? 1 : 0),
        success: (cur.success || 0) + (isError ? 0 : 1),
      }));
    } else if (ev.type === 'error') {
      const raw = ev.error ?? ev.message ?? ev.content ?? '';
      const text = (typeof raw === 'string' ? raw : JSON.stringify(raw)).slice(0, 240);
      errors.push({ conv_id: conv.conversation_id, model, text });
    }
  }
}

// ─── render ───────────────────────────────────────────────────────────────
function fmtUsd(n) { return n ? `$${n.toFixed(4)}` : '$0'; }
function fmtTok(n) { return n.toLocaleString(); }

function renderMarkdown() {
  const lines = [];
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  lines.push(`# Harness trace reflection — ${now} UTC`);
  lines.push('');
  lines.push(`Window: last ${SINCE}. Conversations: **${conversations.length}**.`);
  lines.push('');

  // ── Summary
  const totalCost = [...byModel.values()].reduce((s, m) => s + (m.cost || 0), 0);
  const totalIn   = [...byModel.values()].reduce((s, m) => s + (m.in || 0), 0);
  const totalOut  = [...byModel.values()].reduce((s, m) => s + (m.out || 0), 0);
  const totalErr  = [...byModel.values()].reduce((s, m) => s + (m.errors || 0), 0);
  lines.push('## Summary');
  lines.push('');
  lines.push(`- Spend: **${fmtUsd(totalCost)}**`);
  lines.push(`- Tokens in: ${fmtTok(totalIn)} · out: ${fmtTok(totalOut)}`);
  lines.push(`- Errored conversations: ${totalErr}`);
  lines.push('');

  // ── By status
  lines.push('## By status');
  lines.push('');
  lines.push('| Status | Count |');
  lines.push('|---|---:|');
  [...byStatus.entries()].sort((a, b) => b[1].count - a[1].count).forEach(([k, v]) => {
    lines.push(`| ${k} | ${v.count} |`);
  });
  lines.push('');

  // ── By model
  lines.push('## By model');
  lines.push('');
  lines.push('| Model | Convs | Spend | In | Out | Cached | Errors |');
  lines.push('|---|---:|---:|---:|---:|---:|---:|');
  [...byModel.entries()]
    .sort((a, b) => (b[1].cost || 0) - (a[1].cost || 0))
    .forEach(([model, m]) => {
      lines.push(`| ${model} | ${m.convs} | ${fmtUsd(m.cost)} | ${fmtTok(m.in || 0)} | ${fmtTok(m.out || 0)} | ${fmtTok(m.cached || 0)} | ${m.errors || 0} |`);
    });
  lines.push('');

  // ── By tool
  lines.push('## By tool');
  lines.push('');
  lines.push('| Tool | Calls | Success | Errors |');
  lines.push('|---|---:|---:|---:|');
  [...byTool.entries()]
    .sort((a, b) => (b[1].calls || 0) - (a[1].calls || 0))
    .forEach(([tool, t]) => {
      lines.push(`| ${tool} | ${t.calls || 0} | ${t.success || 0} | ${t.errors || 0} |`);
    });
  lines.push('');

  // ── Top errors
  if (errors.length) {
    lines.push('## Recent errors (first 10)');
    lines.push('');
    for (const e of errors.slice(0, 10)) {
      lines.push(`- **${e.model}** · \`${e.conv_id.slice(0, 8)}\` — ${e.text}`);
    }
    lines.push('');
  }

  // ── Hints
  lines.push('## Hints for next iteration');
  lines.push('');
  if (totalErr > conversations.length * 0.3) {
    lines.push('- ⚠️ More than 30% of conversations errored. Inspect the most-errored model + tool combinations.');
  }
  const expensive = [...byModel.entries()].filter(([, m]) => (m.cost || 0) > 1)[0];
  if (expensive) {
    lines.push(`- 💸 ${expensive[0]} consumed > $1 on its own. Consider routing cheap-suitable tasks to a smaller model.`);
  }
  const flakyTool = [...byTool.entries()].find(([, t]) => (t.errors || 0) > (t.success || 0));
  if (flakyTool) {
    lines.push(`- 🔧 ${flakyTool[0]} fails more than it succeeds. Inspect prompt or tool wrapper.`);
  }
  if (!totalErr && !expensive && !flakyTool) {
    lines.push('- Nothing flagged — clean window.');
  }
  lines.push('');

  return lines.join('\n');
}

function renderJson() {
  return JSON.stringify({
    generated_at: new Date().toISOString(),
    window: SINCE,
    conversations: conversations.length,
    by_status: Object.fromEntries(byStatus),
    by_model:  Object.fromEntries(byModel),
    by_tool:   Object.fromEntries(byTool),
    errors:    errors.slice(0, 50),
  }, null, 2);
}

const out = JSON_OUT ? renderJson() : renderMarkdown();

if (STDOUT) {
  process.stdout.write(out);
} else {
  try { mkdirSync(REPORT_DIR, { recursive: true }); } catch {}
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const ext = JSON_OUT ? 'json' : 'md';
  const path = join(REPORT_DIR, `reflect-${stamp}.${ext}`);
  writeFileSync(path, out, 'utf8');
  process.stderr.write(`wrote ${path}\n`);
}
