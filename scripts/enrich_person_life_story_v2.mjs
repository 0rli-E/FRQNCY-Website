#!/usr/bin/env node
/**
 * FRQNCY · Person life_story enrichment v2 — for the no_draft cohort.
 *
 * Targets people who failed the v1 run (no life_story field). Uses richer
 * sources to break through the JS-heavy canonical-site ceiling that capped v1:
 *
 *   1. Canonical URL — try the homepage, then /about, /biography, /bio, /about-me
 *   2. Books they authored — pulls intros from books.json where author_is_person_ref
 *      points to this person (these intros were applied today and contain
 *      a lot of biographical context).
 *   3. Open Library author record — same as v1, kept as backstop.
 *
 * Wikipedia is excluded.
 *
 * Output mirrors v1: markdown queue + JSON sidecar + --apply.
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
const UA = 'FRQNCY-life-story-v2/0.1 (+https://frqncy.network)';
const MODEL = 'claude-sonnet-4-6';

if (APPLY_FILE) {
  const approved = JSON.parse(fs.readFileSync(path.resolve(APPLY_FILE), 'utf8'));
  const peoplePath = path.join(ROOT, 'people.json');
  const data = JSON.parse(fs.readFileSync(peoplePath, 'utf8'));
  let written = 0;
  for (const e of approved) {
    if (!e.id || !Array.isArray(e.life_story) || !e.life_story.length) continue;
    const person = data.people.find(p => p.id === e.id);
    if (!person) { console.warn(`skip: ${e.id}`); continue; }
    person.life_story = e.life_story.map(s => String(s).trim()).filter(Boolean);
    if (e.life_story_source) person.life_story_source = e.life_story_source;
    written++;
  }
  fs.writeFileSync(peoplePath, JSON.stringify(data, null, 2) + '\n');
  console.log(`Wrote ${written} life_story field${written === 1 ? '' : 's'}`);
  process.exit(0);
}

console.error('Using @anthropic-ai/claude-agent-sdk\n');

const people = JSON.parse(fs.readFileSync(path.join(ROOT, 'people.json'), 'utf8'));
const books = JSON.parse(fs.readFileSync(path.join(ROOT, 'books.json'), 'utf8'));

const targets = people.people.filter(p => {
  if (ONLY_ID) return p.id === ONLY_ID;
  return !Array.isArray(p.life_story) || p.life_story.length === 0;
}).slice(0, LIMIT);

console.error(`v2 life-story: ${targets.length} person${targets.length === 1 ? '' : 's'}\n`);

// ───────────────────────── http ─────────────────────────
async function safeFetch(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, { redirect: 'follow', signal: ctrl.signal, headers: { 'User-Agent': UA } });
    clearTimeout(t);
    return r;
  } catch { clearTimeout(t); return null; }
}

async function safeText(url) {
  const r = await safeFetch(url);
  if (!r || !r.ok) return null;
  const ct = r.headers.get('content-type') || '';
  if (!/text\/html|text\/plain|application\/xhtml/i.test(ct)) return null;
  return await r.text();
}

async function safeJSON(url) {
  const r = await safeFetch(url);
  if (!r || !r.ok) return null;
  try { return await r.json(); } catch { return null; }
}

function extractSiteText(html) {
  if (!html) return '';
  const og = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
  const md = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  const slice = html.slice(0, 100000);
  const ps = [...slice.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map(m => m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(p => p.length > 80 && p.length < 2000);
  ps.sort((a, b) => b.length - a.length);
  const out = [];
  if (og) out.push(og[1].trim());
  if (md && md[1].trim() !== og?.[1]?.trim()) out.push(md[1].trim());
  for (const p of ps.slice(0, 6)) out.push(p);
  return out.join('\n\n');
}

// ───────────────────────── source 1: canonical + about-paths ─────────────────────────
async function fromCanonical(person) {
  if (!person.url) return { source: 'canonical', text: '', note: 'no url' };
  const base = person.url.replace(/\/$/, '');
  const candidates = [base, `${base}/about`, `${base}/biography`, `${base}/bio`, `${base}/about-me`, `${base}/about-us`];
  let best = '';
  let bestUrl = base;
  for (const url of candidates) {
    const html = await safeText(url);
    if (!html) continue;
    const text = extractSiteText(html);
    if (text.length > best.length) { best = text; bestUrl = url; }
  }
  return { source: 'canonical', url: bestUrl, text: best };
}

// ───────────────────────── source 2: their books' intros ─────────────────────────
function fromAuthoredBooks(person) {
  const authored = books.books.filter(b => b.author_is_person_ref === true && b.author === person.id && b.intro);
  if (!authored.length) return { source: 'authored_books', text: '', note: 'no linked books with intros' };
  const text = authored.map(b => `From "${b.title}": ${b.intro}`).join('\n\n');
  return { source: 'authored_books', text, count: authored.length };
}

// ───────────────────────── source 3: openlibrary author ─────────────────────────
async function fromOpenLibraryAuthor(person) {
  const search = await safeJSON(`https://openlibrary.org/search/authors.json?q=${encodeURIComponent(person.name)}&limit=3`);
  if (!search?.docs?.length) return { source: 'openlibrary_author', text: '', note: 'no author hit' };
  const doc = [...search.docs].sort((a, b) => (b.work_count || 0) - (a.work_count || 0))[0];
  if (!doc?.key) return { source: 'openlibrary_author', text: '', note: 'no key' };
  const author = await safeJSON(`https://openlibrary.org/authors/${doc.key}.json`);
  if (!author) return { source: 'openlibrary_author', text: '', note: 'fetch failed' };
  let bio = '';
  if (typeof author.bio === 'string') bio = author.bio;
  else if (author.bio?.value) bio = author.bio.value;
  bio = bio.replace(/\(\[source\]\[\d+\]\)/g, '').replace(/\[Wikipedia\]\([^)]+\)/gi, '').replace(/\[\^\d+\]/g, '').trim();
  if (/from wikipedia/i.test(bio)) bio = '';
  return { source: 'openlibrary_author', url: `https://openlibrary.org/authors/${doc.key}`, text: bio, birth_date: author.birth_date, death_date: author.death_date };
}

// ───────────────────────── SDK ─────────────────────────
async function askForLifeStory(person, gathered) {
  const system = `You write biographical entries for FRQNCY. Given source material about a person, draft a life_story as a JSON array of 3 paragraphs.

Voice and content rules:
- Each paragraph 70-110 words. Total ~250-330 words.
- Paragraph 1: birth, formative years, the path that led to the work they're known for.
- Paragraph 2: the central work or contribution; what they did; what shifted because of it.
- Paragraph 3: continuation, current state, death (if applicable). End with where their work lives now.
- British English ("organising", "centre"). Discreet, unflashy, factual.
- Do NOT invent dates or facts not present in the sources. If unclear, omit.
- Do NOT mention Wikipedia. Do NOT use spiritual clichés or "thought leader" framing.

Respond with ONLY a JSON object: {"life_story": ["p1", "p2", "p3"]}. If sources are too thin to draft three faithful paragraphs, respond with {"life_story": []}.`;

  const sourceText = gathered.filter(g => g.text).map(g => `[${g.source}${g.url ? ` — ${g.url}` : ''}]\n${g.text}`).join('\n\n---\n\n');
  if (!sourceText.trim()) return null;
  const user = `Person: ${person.name}\nCurrent bio: ${person.bio || '—'}\n\nSource material:\n\n${sourceText}`;

  let result = '';
  for await (const msg of query({
    prompt: user,
    options: {
      systemPrompt: system,
      model: MODEL,
      allowedTools: [],
      maxTurns: 3,
      permissionMode: 'bypassPermissions',
      settingSources: [],
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
  if (!m) return null;
  try {
    const parsed = JSON.parse(m[0]);
    if (!Array.isArray(parsed.life_story) || parsed.life_story.length < 1) return null;
    return parsed;
  } catch { return null; }
}

// ───────────────────────── per-person ─────────────────────────
async function enrich(person) {
  const out = { id: person.id, name: person.name, status: 'pending' };
  try {
    const [c, ab, ola] = await Promise.all([fromCanonical(person), Promise.resolve(fromAuthoredBooks(person)), fromOpenLibraryAuthor(person)]);
    const sources = [c, ab, ola];
    out.sources = sources;
    const totalText = sources.map(s => s.text || '').join(' ').length;
    if (totalText < 250) { out.status = 'thin_sources'; return out; }
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

const results = [];
for (const [i, p] of targets.entries()) {
  process.stderr.write(`  [${i + 1}/${targets.length}] ${p.name.slice(0, 55).padEnd(55)} `);
  const r = await enrich(p);
  process.stderr.write(`${r.status === 'ok' ? '✓' : '·'} ${r.status}\n`);
  results.push(r);
  await new Promise(res => setTimeout(res, 400));
}

const date = new Date().toISOString().slice(0, 10);
const ok = results.filter(r => r.status === 'ok');
const md = [];
md.push(`# Person life_story v2 — ${date}`);
md.push('');
md.push(`**Processed:** ${results.length} · **drafts:** ${ok.length}`);
md.push(`**Sources:** canonical (+ /about variants), authored books' intros, openlibrary author`);
md.push('');
md.push(`Apply with: \`node scripts/enrich_person_life_story_v2.mjs --apply audits/beds/runs/${date}-person-life-story-v2.json\``);
md.push('');
for (const r of results) {
  md.push(`### \`${r.id}\` — ${r.name}`);
  md.push('');
  if (r.status === 'ok') {
    for (const para of r.life_story) { md.push(para); md.push(''); }
    md.push(`_sources:_ ${r.life_story_source}`);
  } else {
    md.push(`_status:_ \`${r.status}\`${r.error ? ` — ${r.error}` : ''}`);
  }
  md.push('');
  md.push('---');
  md.push('');
}

const dest = path.join(ROOT, 'audits', 'beds', 'runs', `${date}-person-life-story-v2.md`);
const sidecar = path.join(ROOT, 'audits', 'beds', 'runs', `${date}-person-life-story-v2.json`);
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, md.join('\n'));
fs.writeFileSync(sidecar, JSON.stringify(ok, null, 2));
console.error(`\n→ ${path.relative(ROOT, dest)}\n→ ${path.relative(ROOT, sidecar)}`);
