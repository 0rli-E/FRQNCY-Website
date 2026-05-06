#!/usr/bin/env node
/**
 * domain-coverage-enrich.mjs — v0.1 LLM pass for the domain coverage loop.
 *
 * Reads `scripts/auto-grow/output/domain-coverage.json` (produced by the
 * structural pass `domain-coverage.mjs`) and, per domain, asks an LLM:
 *   1. likely_missing — topics that a reasonable reader would expect to
 *      find in this domain given its scope, but which aren't there.
 *   2. off_topic_flags — current topics whose subject doesn't fit the
 *      domain (membership pollution).
 *
 * Writes the enriched JSON back in place and re-renders the markdown
 * report with the placeholders filled in.
 *
 * Editorial gate intact — these are *suggestions for Orlando to judge*,
 * never auto-merged. Per-domain prompts are conservative (only flag what
 * a reasonable editor would obviously raise) so the report stays signal,
 * not noise.
 *
 * Gateway: direct OpenRouter HTTP call. Default model is
 * `google/gemini-2.5-flash` per CLAUDE.md's "cheap reliable" recommendation.
 * Override with FRQNCY_ENRICH_MODEL env var.
 *
 * Required env: OPENROUTER_API_KEY. Exit-0 if missing so the workflow
 * never fails when the secret isn't set yet (matches resource-suggest).
 *
 * Why not the harness? frqncy-harness has a startup error in
 * privy-store.js as of 2026-05-02 — this script bypasses it for now.
 * Migrate to `frqncy-harness chat` once the harness CLI starts cleanly.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');
const OUTPUT_DIR = join(__dirname, 'output');
const COVERAGE_JSON = join(OUTPUT_DIR, 'domain-coverage.json');
const COVERAGE_MD = join(OUTPUT_DIR, 'domain-coverage.md');

const MODEL = process.env.FRQNCY_ENRICH_MODEL || 'google/gemini-2.5-flash';
const { OPENROUTER_API_KEY } = process.env;

// Optional --from-file <path> — read enrichments from a precomputed JSON
// file (e.g. produced offline by Claude in the editor) instead of calling
// OpenRouter. File shape: { "<domain_id>": { likely_missing: [...], off_topic_flags: [...] }, ... }.
const argv = process.argv.slice(2);
const fromFileIdx = argv.indexOf('--from-file');
const FROM_FILE = fromFileIdx >= 0 ? argv[fromFileIdx + 1] : null;

if (!FROM_FILE && !OPENROUTER_API_KEY) {
  console.error('Missing OPENROUTER_API_KEY (and no --from-file given) — skipping LLM enrichment.');
  process.exit(0);
}

if (!existsSync(COVERAGE_JSON)) {
  console.error(`Run scripts/auto-grow/domain-coverage.mjs first — ${COVERAGE_JSON} not found.`);
  process.exit(0);
}

const SYSTEM_PROMPT = `You audit a single FRQNCY domain's topic coverage.

FRQNCY is a consciousness-practice content + social platform. Domains are large subject-matter buckets (e.g. Money, Energy, Sciences). A domain is judged by the real-world *scope* of its subject, not by current topic count — a small list inside a wide subject is a coverage gap, not a problem with the domain itself.

Your job per domain:
1. Propose "likely_missing" topics — what a reasonable reader would expect to find in this domain given its real-world scope, but which is not in the current topic list. Be conservative: only suggest topics that are clearly central to the subject and clearly missing.
2. Flag "off_topic_flags" — any current topic whose subject genuinely does not belong in this domain. Be conservative: a topic might validly cross-list across multiple domains, so only flag obvious mismatches.

Editorial values to respect:
- Cooperation over competition — no leaderboards / ranking framing.
- Conscious about consciousness — no spiritual cliches; frame practices as experiments.
- Every topic is meant to be a substantive piece of writing, not a stub.

Return STRICT JSON only, matching this exact schema:
{
  "likely_missing": [{ "label": "Topic Title", "rationale": "one sentence" }],
  "off_topic_flags": [{ "topic_id": "t-id", "topic_label": "Label", "rationale": "one sentence" }]
}

Return at most 6 likely_missing entries and at most 3 off_topic_flags. If you have no suggestions, return empty arrays. Do not include any text outside the JSON.`;

function buildUserPrompt(domain) {
  const topicsList = domain.topics.length
    ? domain.topics.map((t) => `- ${t.label} (${t.id}, primary pillar: ${t.primary_pillar || 'none'})`).join('\n')
    : '(no topics yet)';
  return `Domain: ${domain.label}
Description: ${domain.desc || '(no description)'}
Scope intent: ${domain.scope_intent || '(not yet documented — infer scope from the subject name and description)'}

Current topics tagged to this domain (primary):
${topicsList}

Audit this domain. Return JSON only.`;
}

function parseLlmJson(text) {
  if (!text) return null;
  // Strip markdown fences if present.
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Try to extract the first {...} block.
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try { return JSON.parse(m[0]); } catch { return null; }
  }
}

async function enrichDomain(domain) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://frqncy.io',
      'X-Title': 'FRQNCY domain-coverage-enrich',
    },
    body: JSON.stringify({
      model: MODEL,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(domain) },
      ],
      temperature: 0.3,
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) {
    console.error(`  ✗ ${domain.label}: HTTP ${res.status} — ${await res.text()}`);
    return { likely_missing: [], off_topic_flags: [], error: `HTTP ${res.status}` };
  }
  const json = await res.json();
  const content = json.choices?.[0]?.message?.content;
  const parsed = parseLlmJson(content);
  if (!parsed) {
    console.error(`  ✗ ${domain.label}: could not parse LLM JSON. Raw: ${content?.slice(0, 200)}`);
    return { likely_missing: [], off_topic_flags: [], error: 'parse_failure', raw: content };
  }
  const likely = Array.isArray(parsed.likely_missing) ? parsed.likely_missing.slice(0, 6) : [];
  const offtopic = Array.isArray(parsed.off_topic_flags) ? parsed.off_topic_flags.slice(0, 3) : [];
  console.log(`  ✓ ${domain.label}: ${likely.length} missing, ${offtopic.length} off-topic flags`);
  return { likely_missing: likely, off_topic_flags: offtopic };
}

function renderMarkdown(report) {
  const lines = [];
  lines.push('# Domain coverage report (v2 + LLM-enriched)');
  lines.push('');
  lines.push(`Generated ${report.generated_at}; enriched ${report.enriched_at} by \`${report.enrichment_model || MODEL}\`.`);
  lines.push('');
  lines.push('**Model:** domain validity is judged by the real-world *scope* of the subject, not by current topic count. LLM suggestions are conservative — surface for Orlando to judge, never auto-merged.');
  lines.push('');

  lines.push('## Domains — coverage view');
  lines.push('');
  for (const d of report.domains) {
    lines.push(`### ${d.label} — ${d.topic_count} topic${d.topic_count === 1 ? '' : 's'}`);
    lines.push('');
    if (d.desc) lines.push(`*${d.desc}*`);
    lines.push('');
    if (d.scope_intent) {
      lines.push(`**Scope intent:** ${d.scope_intent}`);
    } else {
      lines.push(`**Scope intent:** _not yet documented in content.json — add a \`scope_intent\` field to anchor what this domain should cover._`);
    }
    lines.push('');
    if (d.topics.length === 0) {
      lines.push('_No topics currently tagged with this domain as primary._');
    } else {
      for (const t of d.topics) {
        lines.push(`- **${t.label}** _(${t.primary_pillar || 'no pillar'})_`);
      }
    }
    lines.push('');

    const missing = d.llm_suggestions?.likely_missing || [];
    lines.push('**Likely missing topics**' + (missing.length ? ':' : ': _none surfaced._'));
    for (const m of missing) lines.push(`  - ${m.label} — ${m.rationale}`);
    lines.push('');

    const flags = d.llm_suggestions?.off_topic_flags || [];
    lines.push('**Off-topic membership flags**' + (flags.length ? ':' : ': _none surfaced._'));
    for (const f of flags) lines.push(`  - ${f.topic_label} (\`${f.topic_id}\`) — ${f.rationale}`);
    lines.push('');

    if (d.llm_suggestions?.error) {
      lines.push(`_LLM error for this domain: ${d.llm_suggestions.error}._`);
      lines.push('');
    }
  }

  if (report.orphan_domains?.length) {
    lines.push('## ⚠ Orphan domains');
    lines.push('');
    lines.push(`Tagged on topics but not declared in \`content.json\`: ${report.orphan_domains.join(', ')}`);
    lines.push('');
  }

  lines.push('## Pillars — primary-tag view + drift QA');
  lines.push('');
  lines.push('Pillars are nouns naming what FRQNCY is and does. Every pillar applies to every domain (many-to-many) — the `pillar` field on a topic is a primary-tag, not a partition. Per-pillar drift QA below compares **vision** (content.json), **communication** (site copy), and **fact** (what is shipped).');
  lines.push('');
  for (const p of report.pillars) {
    lines.push(`### ${p.label} — ${p.primary_tagged_topic_count} primary-tagged topic${p.primary_tagged_topic_count === 1 ? '' : 's'}`);
    lines.push('');
    if (p.desc) lines.push(`*${p.desc}*`); lines.push('');
    if (p.primary_tagged_topics?.length) {
      lines.push(p.primary_tagged_topics.map((t) => `- ${t.label} _(${t.domain || 'no domain'})_`).join('\n'));
    } else {
      lines.push('_No topics carry this pillar as primary._');
    }
    lines.push('');
    if (p.qa) {
      lines.push(`**Vision:** ${p.qa.vision}`);
      lines.push('');
      lines.push(`**Communication:** ${p.qa.communication}`);
      lines.push('');
      lines.push(`**Fact:** ${p.qa.fact}`);
      lines.push('');
      const findings = p.qa.drift_findings || [];
      if (findings.length === 0) {
        lines.push('**Drift findings:** _none._');
      } else {
        lines.push('**Drift findings:**');
        for (const f of findings) {
          const sev = f.severity ? `[${f.severity}]` : '';
          const kind = f.kind ? `_${f.kind}_` : '';
          lines.push(`  - ${sev} ${kind} — ${f.summary}`);
        }
      }
      lines.push('');
    } else {
      lines.push('- **Communication / fact / vision drift check:** _pillar QA not provided in enrichments file._');
      lines.push('');
    }
  }

  if (report.global_drift_findings?.length) {
    lines.push('## Global drift findings');
    lines.push('');
    lines.push('Cross-cutting issues that span multiple pillars or sit between schema and user-facing copy.');
    lines.push('');
    for (const f of report.global_drift_findings) {
      const sev = f.severity ? `[${f.severity}]` : '';
      const kind = f.kind ? `_${f.kind}_` : '';
      lines.push(`- ${sev} ${kind} — ${f.summary}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

async function main() {
  const report = JSON.parse(readFileSync(COVERAGE_JSON, 'utf8'));

  let sourceLabel = MODEL;
  if (FROM_FILE) {
    const enrichments = JSON.parse(readFileSync(FROM_FILE, 'utf8'));
    sourceLabel = enrichments._source || `file:${FROM_FILE}`;
    console.log(`Applying enrichments from ${FROM_FILE} (source: ${sourceLabel})…`);
    for (const domain of report.domains) {
      const e = enrichments[domain.id];
      domain.llm_suggestions = e
        ? { likely_missing: e.likely_missing || [], off_topic_flags: e.off_topic_flags || [] }
        : { likely_missing: [], off_topic_flags: [] };
    }
    if (enrichments._pillar_qa) {
      for (const pillar of report.pillars) {
        const q = enrichments._pillar_qa[pillar.id];
        if (q) pillar.qa = q;
      }
    }
    if (enrichments._global_drift_findings) {
      report.global_drift_findings = enrichments._global_drift_findings;
    }
  } else {
    console.log(`Enriching ${report.domains.length} domains with ${MODEL}…`);
    for (const domain of report.domains) {
      const enriched = await enrichDomain(domain);
      domain.llm_suggestions = enriched;
    }
  }

  report.enriched_at = new Date().toISOString();
  report.enrichment_model = sourceLabel;

  writeFileSync(COVERAGE_JSON, JSON.stringify(report, null, 2));
  writeFileSync(COVERAGE_MD, renderMarkdown(report));

  const totalMissing = report.domains.reduce((s, d) => s + (d.llm_suggestions?.likely_missing?.length || 0), 0);
  const totalFlags = report.domains.reduce((s, d) => s + (d.llm_suggestions?.off_topic_flags?.length || 0), 0);
  console.log(`\nEnrichment done. Total: ${totalMissing} missing-topic suggestions, ${totalFlags} off-topic flags.`);
  console.log(`Updated ${COVERAGE_JSON} and ${COVERAGE_MD}.`);
}

main().catch((err) => {
  console.error('domain-coverage-enrich failed:', err);
  process.exit(0);
});
