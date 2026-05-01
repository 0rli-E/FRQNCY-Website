#!/usr/bin/env node
/**
 * trace-reflect.mjs — reads recent harness traces, writes a Markdown report.
 *
 * Aggregates: total runs, total cost, avg tool calls per run, top failure
 * modes (parse errors, timeouts, refusals). Honest report — shows failures
 * prominently. Never modifies any harness code.
 *
 * Reads from ~/.frqncy-harness/traces/<YYYY-MM-DD>/*.jsonl.
 */

import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, 'output');
const TRACE_ROOT = join(homedir(), '.frqncy-harness', 'traces');
const DAYS_BACK = parseInt(process.env.DAYS_BACK || '7', 10);

function recentDateDirs() {
  if (!existsSync(TRACE_ROOT)) return [];
  const all = readdirSync(TRACE_ROOT).filter(n => /^\d{4}-\d{2}-\d{2}$/.test(n));
  const cutoff = new Date(Date.now() - DAYS_BACK * 24 * 60 * 60 * 1000);
  return all.filter(d => new Date(d) >= cutoff).sort();
}

function readJsonl(path) {
  try {
    return readFileSync(path, 'utf8')
      .split('\n')
      .filter(l => l.trim())
      .map(l => { try { return JSON.parse(l); } catch { return null; } })
      .filter(Boolean);
  } catch { return []; }
}

function classifyFailure(events) {
  const text = events.map(e => e.message || e.text || '').join(' ').toLowerCase();
  if (text.includes('timeout')) return 'timeout';
  if (text.includes('parse') || text.includes('syntax')) return 'parse_error';
  if (text.includes('refus') || text.includes("won't") || text.includes('cannot help')) return 'refusal';
  if (text.includes('rate limit')) return 'rate_limit';
  if (text.includes('cost cap') || text.includes('hard abort')) return 'cost_cap';
  return null;
}

function main() {
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });
  const dirs = recentDateDirs();

  if (dirs.length === 0) {
    const report = `# Trace reflection — ${new Date().toISOString().slice(0, 10)}\n\n_No harness traces found in the last ${DAYS_BACK} days at ${TRACE_ROOT}._\n\nIf the harness has been running, check the trace store path. If it hasn't, that's the report — there's nothing to reflect on yet.\n`;
    writeFileSync(join(OUTPUT_DIR, `trace-summary-${new Date().toISOString().slice(0, 10)}.md`), report);
    console.log('No traces found; wrote empty report.');
    return;
  }

  let totalRuns = 0;
  let totalCostCents = 0;
  let totalToolCalls = 0;
  const failureModes = {};
  const perDay = {};

  for (const dir of dirs) {
    const dirPath = join(TRACE_ROOT, dir);
    const files = readdirSync(dirPath).filter(n => n.endsWith('.jsonl') && n !== 'INDEX.jsonl');
    const dayStats = { runs: 0, cost: 0, tools: 0, failures: {} };
    for (const file of files) {
      totalRuns++; dayStats.runs++;
      const events = readJsonl(join(dirPath, file));
      const lastUsage = [...events].reverse().find(e => e.type === 'usage' || e.usage);
      const costCents = Math.round((lastUsage?.usage?.costUsd || lastUsage?.costUsd || 0) * 100);
      totalCostCents += costCents; dayStats.cost += costCents;
      const toolCount = events.filter(e => e.type === 'tool_call').length;
      totalToolCalls += toolCount; dayStats.tools += toolCount;
      const failure = classifyFailure(events.filter(e => e.level === 'error' || e.type === 'tool_error'));
      if (failure) {
        failureModes[failure] = (failureModes[failure] || 0) + 1;
        dayStats.failures[failure] = (dayStats.failures[failure] || 0) + 1;
      }
    }
    perDay[dir] = dayStats;
  }

  const failurePct = totalRuns > 0 ? Object.values(failureModes).reduce((a, b) => a + b, 0) / totalRuns * 100 : 0;
  const lines = [];
  lines.push(`# Trace reflection — ${new Date().toISOString().slice(0, 10)}`);
  lines.push(`\nLast ${DAYS_BACK} days. Honest report — failures shown prominently, not buried.\n`);
  lines.push(`## Volume\n`);
  lines.push(`- Total runs: **${totalRuns}**`);
  lines.push(`- Total cost: **$${(totalCostCents / 100).toFixed(2)}**`);
  lines.push(`- Avg tool calls per run: **${totalRuns > 0 ? (totalToolCalls / totalRuns).toFixed(1) : 0}**`);
  lines.push(`- Failure rate: **${failurePct.toFixed(1)}%** (${Object.values(failureModes).reduce((a, b) => a + b, 0)} of ${totalRuns})\n`);

  if (Object.keys(failureModes).length > 0) {
    lines.push(`## Top failure modes\n`);
    Object.entries(failureModes).sort((a, b) => b[1] - a[1]).forEach(([mode, n]) => {
      lines.push(`- **${mode}** — ${n} run${n === 1 ? '' : 's'}`);
    });
    lines.push('');
    lines.push(`## Suggested fixes\n`);
    if (failureModes.timeout) lines.push(`- Tighten per-tool timeouts; consider switching slow MCP tools to streaming.`);
    if (failureModes.parse_error) lines.push(`- Audit the most-failing model's structured-output reliability; consider switching to a more constrained format or to Anthropic with strict tool schemas.`);
    if (failureModes.refusal) lines.push(`- Refusal pattern suggests a prompt that's confusing the safety classifier — rewrite the system prompt with a tighter framing.`);
    if (failureModes.rate_limit) lines.push(`- Add a backoff layer or move heavy lanes off OpenRouter free tier.`);
    if (failureModes.cost_cap) lines.push(`- Cost-cap aborts are working as designed but suggest the per-conversation budget or prompt is mis-sized for these tasks.`);
    lines.push('');
  } else {
    lines.push(`## No failures detected\n\nClean run. Either the harness is solid, or the failure detector is too lax. Trust but verify — sample a few traces by hand.\n`);
  }

  lines.push(`## Per-day breakdown\n`);
  Object.entries(perDay).forEach(([day, s]) => {
    lines.push(`- **${day}**: ${s.runs} runs · $${(s.cost / 100).toFixed(2)} · ${s.tools} tool calls`);
  });
  lines.push('');
  lines.push(`---\n_Generated by scripts/auto-grow/trace-reflect.mjs. This report is a recommendation, not a directive. The harness trace is the source of truth; any fix lives in the harness repo._\n`);

  const filename = `trace-summary-${new Date().toISOString().slice(0, 10)}.md`;
  writeFileSync(join(OUTPUT_DIR, filename), lines.join('\n'));
  console.log(`Wrote ${filename}: ${totalRuns} runs analyzed.`);
}

main();
