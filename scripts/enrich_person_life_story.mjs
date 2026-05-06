#!/usr/bin/env node
/**
 * FRQNCY · Person life_story enrichment.
 *
 * For each person in people.json without a populated `life_story` array, try
 * to gather biographical material from non-Wikipedia sources, then ask the
 * Claude Agent SDK to draft a three-paragraph life_story matching the FRQNCY
 * convention (see `p-adrienne-maree-brown` as the canonical example).
 *
 * Source order:
 *   1. The person's canonical URL (p.url) — usually their own site / "About"
 *   2. Open Library author search — biographical text on author records
 *   3. Open Library work descriptions for their books — often biographical
 *
 * Wikipedia is not used.
 *
 * Output:
 *   audits/beds/runs/<date>-person-life-story.md   — review queue
 *   audits/beds/runs/<date>-person-life-story.json — apply candidates
 *
 * Apply with:
 *   node scripts/enrich_person_life_story.mjs --apply <json>
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { query } from '@anthropic-ai/claude-agent-sdk';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const limitIdx = args.indexOf('--limit');
const LIMIT = args.includes('--all') ? Infinity : (limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : 5);
const idIdx = args.indexOf('--bed-id');
const ONLY_ID = idIdx !== -1 ? args[idIdx + 1] : null;
const applyIdx = args.indexOf('--apply');
const APPLY_FILE = applyIdx !== -1 ? args[applyIdx + 1] : null;
const TIMEOUT_MS = 12000;
const UA = 'FRQNCY-life-story-enrichment/0.1 (+https://frqncy.network)';
const MODEL = 'claude-sonnet-4-6';
const MAX_RETRIES = 2;

// ───────────────────────── apply mode ─────────────────────────
if (APPLY_FILE) {
  const approved = JSON.parse(fs.readFileSync(path.resolve(APPLY_FILE), 'utf8'));
  const peoplePath = path.join(ROOT, 'people.json');
  const data = JSON.parse(fs.readFileSync(peoplePath, 'utf8'));
  let written = 0;
  for (const entry of approved) {
    if (!entry.id || !Array.isArray(entry.life_story) || !entry.life_story.length) continue;
    const person = data.people.find(p => p.id === entry.id);
    if (!person) { console.warn(`skip: ${entry.id} not in people.json`); continue; }
    person.life_story = entry.life_story.map(s => String(s).trim()).filter(Boolean);
    if (entry.life_story_source) person.life_story_source = entry.life_story_source;
    written++;
  }
  fs.writeFileSync(peoplePath, JSON.stringify(data, null, 2) + '\n');
  console.log(`Wrote ${written} life_story field${written === 1 ? '' : 's'} to people.json`);
  process.exit(0);
}

console.error('Using @anthropic-ai/claude-agent-sdk (Claude Code auth)\n');

// ───────────────────────── targets ─────────────────────────
const people = JSON.parse(fs.readFileSync(path.join(ROOT, 'people.json'), 'utf8'));
const targets = people.people.filter(p => {
  if (ONLY_ID) return p.id === ONLY_ID;
  return !Array.isArray(p.life_story) || p.life_story.length === 0;
}).slice(0, LIMIT);

console.error(`Life-story enrichment: ${targets.length} person${targets.length === 1 ? '' : 's'} to attempt.\n`);

// ───────────────────────── http ─────────────────────────
async function safeFetch(url, opts = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { redirect: 'follow', signal: ctrl.signal, headers: { 'User-Agent': UA, ...(opts.headers || {}) } });
    clearTimeout(timer);
    return res;
  } catch (e) {
    clearTimeout(timer);
    return null;
  }
}

async function safeText(url) {
  const r = await safeFetch(url);
  if (!r || !r.ok) return null;
  const ct = r.headers.get('content-type') || '';
  if (!/text\/html|text\/plain|application\/xhtml/i.test(ct)) return null;
  return await r.text();
}

async function safeJSON(url) {
  const r = await safeFetch(url, { headers: { Accept: 'application/json' } });
  if (!r || !r.ok) return null;
  try { return await r.json(); } catch { return null; }
}

// ───────────────────────── source 1: canonical URL ─────────────────────────
function extractSiteText(html) {
  if (!html) return '';
  // og:description first
  const og = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
  // Then meta description
  const md = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  // Then a few longest <p> blocks (likely the about/bio prose)
  const slice = html.slice(0, 80000);
  const ps = [...slice.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map(m => m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(p => p.length > 100 && p.length < 1500);
  ps.sort((a, b) => b.length - a.length);
  const lines = [];
  if (og) lines.push(og[1].trim());
  if (md && md[1].trim() !== og?.[1]?.trim()) lines.push(md[1].trim());
  for (const p of ps.slice(0, 4)) lines.push(p);
  return lines.join('\n\n');
}

async function fromCanonical(person) {
  if (!person.url) return { source: 'canonical', text: '', note: 'no url' };
  const html = await safeText(person.url);
  if (!html) return { source: 'canonical', text: '', note: 'fetch failed' };
  return { source: 'canonical', url: person.url, text: extractSiteText(html) };
}

// ───────────────────────── source 2: openlibrary author ─────────────────────────
async function fromOpenLibraryAuthor(person) {
  const search = await safeJSON(`https://openlibrary.org/search/authors.json?q=${encodeURIComponent(person.name)}&limit=3`);
  if (!search?.docs?.length) return { source: 'openlibrary_author', text: '', note: 'no author hit' };
  // Pick the doc with the most works (proxy for the right one)
  const doc = [...search.docs].sort((a, b) => (b.work_count || 0) - (a.work_count || 0))[0];
  if (!doc?.key) return { source: 'openlibrary_author', text: '', note: 'no key' };
  const author = await safeJSON(`https://openlibrary.org/authors/${doc.key}.json`);
  if (!author) return { source: 'openlibrary_author', text: '', note: 'fetch failed' };
  let bio = '';
  if (typeof author.bio === 'string') bio = author.bio;
  else if (author.bio?.value) bio = author.bio.value;
  bio = bio.replace(/\(\[source\]\[\d+\]\)/g, '').replace(/\[Wikipedia\]\([^)]+\)/gi, '').replace(/\[\^\d+\]/g, '').trim();
  // Filter Wikipedia leaks: if bio attributes itself to Wikipedia, drop it
  if (/from wikipedia/i.test(bio)) bio = '';
  const url = `https://openlibrary.org/authors/${doc.key}`;
  return { source: 'openlibrary_author', url, text: bio, work_count: doc.work_count, birth_date: author.birth_date, death_date: author.death_date };
}

// ───────────────────────── source 3: openlibrary works ─────────────────────────
async function fromOpenLibraryWorks(person) {
  // Reuse the search to discover their canonical author key, then list top works
  const search = await safeJSON(`https://openlibrary.org/search/authors.json?q=${encodeURIComponent(person.name)}&limit=1`);
  const key = search?.docs?.[0]?.key;
  if (!key) return { source: 'openlibrary_works', text: '', note: 'no author' };
  const works = await safeJSON(`https://openlibrary.org/authors/${key}/works.json?limit=5`);
  if (!works?.entries?.length) return { source: 'openlibrary_works', text: '', note: 'no works' };
  const titles = works.entries.map(w => w.title).filter(Boolean);
  return { source: 'openlibrary_works', text: `Works: ${titles.slice(0, 8).join('; ')}`, url: `https://openlibrary.org/authors/${key}/works` };
}

// ───────────────────────── SDK call ─────────────────────────
async function askForLifeStory(person, gathered) {
  const system = `You write biographical entries for a literary network called FRQNCY. Your job: given source material about a person, draft a life_story as a JSON array of 3 paragraphs.

Voice and content rules:
- Each paragraph 70-110 words. Total ~250-330 words.
- Paragraph 1: birth, formative years, the path that led to the work they're known for.
- Paragraph 2: the central work or contribution; what they did; what shifted because of it.
- Paragraph 3: continuation, current state, death (if applicable). End with where their work lives now.
- Use British English spelling ("organising", "centre"). Discreet, unflashy, factual.
- Do NOT invent dates or facts not present in the sources. If a date is unclear, omit it.
- Do NOT mention Wikipedia or cite "According to..." sources inline.
- Avoid spiritual clichés, hyperbole, or "thought leader" framing.

Respond with ONLY a JSON object: {"life_story": ["paragraph 1", "paragraph 2", "paragraph 3"]}. If the source material is too thin to draft three paragraphs faithfully, respond with {"life_story": []}.`;

  const sourceText = gathered.filter(g => g.text).map(g => `[${g.source}${g.url ? ` — ${g.url}` : ''}]\n${g.text}`).join('\n\n---\n\n');
  if (!sourceText.trim()) return null;
  const user = `Person: ${person.name}\nCurrent bio: ${person.bio || '—'}\n\nSource material:\n\n${sourceText}`;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      let result = '';
      for await (const msg of query({
        prompt: user,
        options: {
          systemPrompt: system,
          model: MODEL,
          allowedTools: [],
          maxTurns: 3,
          permissionMode: 'bypassPermissions',
          settingSources: [],     // skip parent's Stop hook (auto-memory)
        },
      })) {
        if (msg.type === 'result' && msg.subtype === 'success') result = msg.result || '';
        else if (msg.type === 'assistant' && msg.message?.content) {
          for (const block of msg.message.content) {
            if (block.type === 'text') result += block.text;
          }
        }
      }
      const m = result.match(/\{[\s\S]*\}/);
      if (!m) {
        if (process.env.DEBUG) console.error(`\n  raw:\n${result.slice(0, 400)}\n`);
        return null;
      }
      const parsed = JSON.parse(m[0]);
      if (!Array.isArray(parsed.life_story) || parsed.life_story.length < 1) {
        if (process.env.DEBUG) console.error(`\n  parsed but empty: ${JSON.stringify(parsed).slice(0, 200)}\n`);
        return null;
      }
      return parsed;
    } catch (e) {
      if (attempt === MAX_RETRIES) throw e;
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
}

// ───────────────────────── per-person ─────────────────────────
async function enrich(person) {
  const out = { id: person.id, name: person.name, status: 'pending' };
  try {
    const [c, ola, olw] = await Promise.all([fromCanonical(person), fromOpenLibraryAuthor(person), fromOpenLibraryWorks(person)]);
    const sources = [c, ola, olw];
    out.sources = sources;
    const totalText = sources.map(s => s.text || '').join(' ').length;
    if (totalText < 200) { out.status = 'thin_sources'; return out; }
    const draft = await askForLifeStory(person, sources);
    if (!draft) { out.status = 'no_draft'; return out; }
    out.life_story = draft.life_story;
    out.life_story_source = sources.filter(s => s.text).map(s => s.url || s.source).join(' · ');
    out.status = 'ok';
  } catch (e) {
    out.status = 'error';
    out.error = String(e.message || e);
  }
  return out;
}

// ───────────────────────── run ─────────────────────────
const results = [];
for (const [i, p] of targets.entries()) {
  process.stderr.write(`  [${i + 1}/${targets.length}] ${p.name.slice(0, 55).padEnd(55)} `);
  const r = await enrich(p);
  process.stderr.write(`${r.status === 'ok' ? '✓' : '·'} ${r.status}\n`);
  results.push(r);
  await new Promise(res => setTimeout(res, 400));
}

// ───────────────────────── render ─────────────────────────
const date = new Date().toISOString().slice(0, 10);
const ok = results.filter(r => r.status === 'ok');
const md = [];
md.push(`# Person life_story enrichment — ${date}`);
md.push('');
md.push(`**People processed:** ${results.length} · **drafts returned:** ${ok.length}`);
md.push(`**Sources:** canonical url, openlibrary author, openlibrary works. Wikipedia not used.`);
md.push('');
md.push('Review each draft below. Edit/delete entries in the JSON sidecar, then commit:');
md.push('');
md.push(`\`\`\`\nnode scripts/enrich_person_life_story.mjs --apply audits/beds/runs/${date}-person-life-story.json\n\`\`\``);
md.push('');
for (const r of results) {
  md.push(`### \`${r.id}\` — ${r.name}`);
  md.push('');
  if (r.status === 'ok') {
    for (const para of r.life_story) {
      md.push(para);
      md.push('');
    }
    md.push(`_sources:_ ${r.life_story_source}`);
  } else {
    md.push(`_status:_ \`${r.status}\`${r.error ? ` — ${r.error}` : ''}`);
  }
  md.push('');
  md.push('---');
  md.push('');
}

const dest = path.join(ROOT, 'audits', 'beds', 'runs', `${date}-person-life-story.md`);
const sidecar = path.join(ROOT, 'audits', 'beds', 'runs', `${date}-person-life-story.json`);
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, md.join('\n'));
fs.writeFileSync(sidecar, JSON.stringify(ok, null, 2));
console.error(`\n→ Wrote ${path.relative(ROOT, dest)}\n→ Wrote ${path.relative(ROOT, sidecar)} (apply candidates)`);
