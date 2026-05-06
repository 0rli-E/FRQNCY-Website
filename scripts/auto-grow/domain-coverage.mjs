#!/usr/bin/env node
/**
 * domain-coverage.mjs — surfaces FRQNCY's current domain coverage so a human
 * can judge gaps and off-topic membership.
 *
 * Replaces the deleted topic-balance.mjs (v1), which used per-domain count
 * floors — wrong model. Domain validity is judged by the real-world SCOPE
 * of the subject, not by how many topics FRQNCY has tagged inside it.
 * A small topic list inside a wide subject (e.g. Business with 3 topics)
 * is a coverage GAP, not a cull candidate.
 *
 * What this loop does:
 *   1. Reads `content.json` (canonical pillars + domains) and `search.json`
 *      (topics with primary pillar + primary domain fields).
 *   2. Per domain: lists current topics, shows domain `desc`, and surfaces
 *      `scope_intent` if Orlando has documented one (optional editorial
 *      annotation; no error if missing).
 *   3. Per pillar: lists topics where it's the primary pillar (reminder:
 *      pillars apply to every topic in the broader sense; primary-tag is
 *      a search.json artifact, not the full editorial truth).
 *   4. Leaves explicit human-review placeholders for "likely missing
 *      topics" and "off-topic membership" — these need an LLM/agent pass
 *      (v0.1 follow-up).
 *
 * What this loop does NOT do:
 *   - Recommend domain culls based on count.
 *   - Recommend new domains (Orlando proposes; ask before adding).
 *   - Recommend new pillars (manual-only by Orlando).
 *   - Make any auto-merge decision.
 *
 * Pure read-only, no API keys, no network.
 *
 * Outputs:
 *   scripts/auto-grow/output/domain-coverage.json
 *   scripts/auto-grow/output/domain-coverage.md
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');
const OUTPUT_DIR = join(__dirname, 'output');

function loadJson(path) {
  return JSON.parse(readFileSync(join(REPO_ROOT, path), 'utf8'));
}

function topicsByDomain(topics) {
  const grouped = new Map();
  for (const t of topics) {
    const k = t.domain || '(no domain)';
    if (!grouped.has(k)) grouped.set(k, []);
    grouped.get(k).push(t);
  }
  for (const arr of grouped.values()) arr.sort((a, b) => a.label.localeCompare(b.label));
  return grouped;
}

function topicsByPillar(topics) {
  const grouped = new Map();
  for (const t of topics) {
    const k = t.pillar || '(no pillar)';
    if (!grouped.has(k)) grouped.set(k, []);
    grouped.get(k).push(t);
  }
  for (const arr of grouped.values()) arr.sort((a, b) => a.label.localeCompare(b.label));
  return grouped;
}

function renderMarkdown({ content, topics, byDomain, byPillar }) {
  const lines = [];
  const ts = new Date().toISOString();

  lines.push('# Domain coverage report (v2)');
  lines.push('');
  lines.push(`Generated ${ts} from \`content.json\` (${(content.pillars || []).length} pillars, ${(content.domains || []).length} domains) + \`search.json\` (${topics.length} topics).`);
  lines.push('');
  lines.push('**Model:** domain validity is judged by the real-world *scope* of the subject, not by current topic count. A small topic list inside a wide subject is a coverage gap, not a cull candidate. Topic count alone is never the verdict.');
  lines.push('');
  lines.push('Editorial gate intact — this report surfaces structure for Orlando to judge. No auto-merges, no auto-recommendations on adding/cutting domains or pillars.');
  lines.push('');

  // ── Domain coverage ──────────────────────────────────────────
  lines.push('## Domains — coverage view');
  lines.push('');
  lines.push('Each domain section shows current topics tagged here as their *primary* domain. Topics may legitimately cross-list (schema follow-up pending). The two human-review prompts at the end of each section need an LLM/agent pass to fill in (v0.1).');
  lines.push('');

  const domainDefs = content.domains || [];
  const seenDomainLabels = new Set(domainDefs.map(d => d.label));

  for (const d of domainDefs) {
    const topicsHere = byDomain.get(d.label) || [];
    lines.push(`### ${d.label} — ${topicsHere.length} topic${topicsHere.length === 1 ? '' : 's'}`);
    lines.push('');
    if (d.desc) lines.push(`*${d.desc}*`);
    lines.push('');
    if (d.scope_intent) {
      lines.push(`**Scope intent:** ${d.scope_intent}`);
    } else {
      lines.push(`**Scope intent:** _not yet documented in content.json — add a \`scope_intent\` field to anchor what this domain should cover._`);
    }
    lines.push('');
    if (topicsHere.length === 0) {
      lines.push('_No topics currently tagged with this domain as primary._');
    } else {
      for (const t of topicsHere) {
        const pillar = t.pillar ? ` _(${t.pillar})_` : '';
        lines.push(`- **${t.label}**${pillar} — ${t.desc ? t.desc.slice(0, 140) : ''}`);
      }
    }
    lines.push('');
    lines.push(`- **Likely missing topics:** _v0.1 — agent pass not yet wired_`);
    lines.push(`- **Off-topic membership flags:** _v0.1 — agent pass not yet wired_`);
    lines.push('');
  }

  // Topics whose domain is not in content.json
  const orphanDomains = [...byDomain.keys()].filter(d => !seenDomainLabels.has(d));
  if (orphanDomains.length) {
    lines.push('### ⚠ Domains tagged on topics but not declared in `content.json`');
    lines.push('');
    for (const d of orphanDomains) {
      const topicsHere = byDomain.get(d) || [];
      lines.push(`- **${d}** — ${topicsHere.length} topic(s): ${topicsHere.map(t => t.label).join(', ')}`);
    }
    lines.push('');
    lines.push('Either add a definition to `content.json` `domains[]` or fix the topics\' `domain` field.');
    lines.push('');
  }

  // ── Pillar surface ──────────────────────────────────────────
  lines.push('## Pillars — primary-tag view');
  lines.push('');
  lines.push('Pillars are operating-mode verbs (what FRQNCY actively does). They apply to every topic in the broader sense. The `pillar` field on each topic is a *primary-tag*, not a partition — schema follow-up pending. This list shows which topics carry which pillar as their primary tag.');
  lines.push('');

  const pillarDefs = content.pillars || [];
  const seenPillarLabels = new Set(pillarDefs.map(p => p.label));

  for (const p of pillarDefs) {
    const topicsHere = byPillar.get(p.label) || [];
    lines.push(`### ${p.label} — ${topicsHere.length} primary-tagged topic${topicsHere.length === 1 ? '' : 's'}`);
    lines.push('');
    if (p.desc) lines.push(`*${p.desc}*`);
    lines.push('');
    if (topicsHere.length === 0) {
      lines.push('_No topics currently carry this pillar as their primary tag._');
    } else {
      lines.push(topicsHere.map(t => `- ${t.label} _(${t.domain || 'no domain'})_`).join('\n'));
    }
    lines.push('');
    lines.push(`- **Communication / fact / vision drift check:** _pillar QA pending — needs an LLM pass over site copy + shipped reality + stated intent._`);
    lines.push('');
  }

  const orphanPillars = [...byPillar.keys()].filter(p => !seenPillarLabels.has(p));
  if (orphanPillars.length) {
    lines.push('### ⚠ Pillars tagged on topics but not declared in `content.json`');
    lines.push('');
    for (const p of orphanPillars) {
      const topicsHere = byPillar.get(p) || [];
      lines.push(`- **${p}** — ${topicsHere.length} topic(s): ${topicsHere.map(t => t.label).join(', ')}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

function main() {
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

  const content = loadJson('content.json');
  const topics = loadJson('search.json');

  const byDomain = topicsByDomain(topics);
  const byPillar = topicsByPillar(topics);

  const report = {
    generated_at: new Date().toISOString(),
    model_note: 'Domain validity = real-world subject scope, not topic count. Pillars = operating-mode verbs, apply across every topic.',
    pillar_count: (content.pillars || []).length,
    domain_count: (content.domains || []).length,
    topic_count: topics.length,
    domains: (content.domains || []).map(d => ({
      id: d.id,
      label: d.label,
      desc: d.desc,
      scope_intent: d.scope_intent || null,
      topic_count: (byDomain.get(d.label) || []).length,
      topics: (byDomain.get(d.label) || []).map(t => ({ id: t.id, label: t.label, primary_pillar: t.pillar })),
    })),
    pillars: (content.pillars || []).map(p => ({
      id: p.id,
      label: p.label,
      desc: p.desc,
      primary_tagged_topic_count: (byPillar.get(p.label) || []).length,
      primary_tagged_topics: (byPillar.get(p.label) || []).map(t => ({ id: t.id, label: t.label, domain: t.domain })),
    })),
    orphan_domains: [...byDomain.keys()].filter(d => !(content.domains || []).some(cd => cd.label === d)),
    orphan_pillars: [...byPillar.keys()].filter(p => !(content.pillars || []).some(cp => cp.label === p)),
  };

  writeFileSync(join(OUTPUT_DIR, 'domain-coverage.json'), JSON.stringify(report, null, 2));
  writeFileSync(join(OUTPUT_DIR, 'domain-coverage.md'), renderMarkdown({ content, topics, byDomain, byPillar }));

  console.log(`Domain coverage v2: ${report.domain_count} domains, ${report.pillar_count} pillars, ${report.topic_count} topics.`);
  if (report.orphan_domains.length) console.log(`⚠ Orphan domains (tagged on topics but not in content.json): ${report.orphan_domains.join(', ')}`);
  if (report.orphan_pillars.length) console.log(`⚠ Orphan pillars (tagged on topics but not in content.json): ${report.orphan_pillars.join(', ')}`);
  console.log(`Wrote scripts/auto-grow/output/domain-coverage.{json,md}`);
}

main();
