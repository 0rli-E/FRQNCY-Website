#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────
// FRQNCY Network v2 — Static Site Generator
// Run: node generate.js
// Output: ./v2/  (150 HTML pages), sitemap.xml, search.json
// ─────────────────────────────────────────────────────────────────

const fs   = require('fs');
const path = require('path');

const ROOT      = __dirname;
const DATA      = JSON.parse(fs.readFileSync(path.join(ROOT, 'content.json'),   'utf8'));
const VIDEOS    = JSON.parse(fs.readFileSync(path.join(ROOT, 'videos.json'),    'utf8'));
const COURSES   = JSON.parse(fs.readFileSync(path.join(ROOT, 'courses.json'),   'utf8'));
const PROVIDERS = JSON.parse(fs.readFileSync(path.join(ROOT, 'providers.json'), 'utf8'));
const OUT       = path.join(ROOT, 'v2');

// ── Entity beds (world model, v1) ────────────────────────────────
// First-class lists of people, books, orgs, and media. Each entity declares
// `appears_in` (topic/domain/pillar ids) and `picked_in` (FRQNCY PICK buckets).
// When rendering a topic, resourcesFor() merges these into the resource list.
// A bed file being absent falls back to content.json-only behaviour (safe default).
function loadBed(filename) {
  const p = path.join(ROOT, filename);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null;
}
const PEOPLE = loadBed('people.json');
const BOOKS  = loadBed('books.json');
const ORGS   = loadBed('orgs.json');
const MEDIA  = loadBed('media.json');
const PLACES = loadBed('places.json');

// ── Provider helpers ─────────────────────────────────────────────
const providerMap = new Map(PROVIDERS.map(p => [p.id, p]));
function getProvider(v) { return providerMap.get(v.provider || 'youtube') || providerMap.get('youtube'); }
function videoId(v)     { return v.video_id || v.youtube_id || ''; }
function thumbUrl(v) {
  if (v.thumbnail) return v.thumbnail;
  const p = getProvider(v);
  if (!p.thumbnail_url) return '';
  return p.thumbnail_url.replace('{id}', videoId(v));
}
function embedUrl(v, autoplay) {
  const p = getProvider(v);
  if (!p.embeddable) return '';
  const tpl = autoplay ? p.embed_autoplay : p.embed_url;
  return tpl.replace('{id}', videoId(v));
}
function watchUrl(v) {
  const p = getProvider(v);
  return p.watch_url.replace('{id}', videoId(v));
}

// Pre-index courses by topic: topicId → [course, ...]
const coursesByTopic = new Map();
for (const course of COURSES) {
  for (const topicId of (course.topics || [])) {
    if (!coursesByTopic.has(topicId)) coursesByTopic.set(topicId, []);
    coursesByTopic.get(topicId).push(course);
  }
}

// ── Pre-indexed lookup maps ───────────────────────────────────────
const pillarMap       = new Map(DATA.pillars.map(p => [p.id, p]));
const domainMap       = new Map(DATA.domains.map(d => [d.id, d]));
const domainsByPillar = new Map(DATA.pillars.map(p => [p.id, []]));
const topicsByDomain  = new Map(DATA.domains.map(d => [d.id, []]));

for (const d of DATA.domains) domainsByPillar.get(d.pillar)?.push(d);
for (const t of DATA.topics)  topicsByDomain.get(t.domain)?.push(t);

// resourcesFor(nid) — merges bed-sourced entities (people, books, orgs, media)
// with content.json's remaining resources (tools, courses, platforms, apps, etc.).
// Preserves the original content.json ordering. Falls back to pure content.json
// if the beds aren't present.
const BED_TYPES = new Set(['person', 'book', 'org', 'media']);
const fixTypos = (u) => (u||'').replace('erinclairehjones', 'erinclairejones');
const normU = (u) => fixTypos((u||'').replace('https://www.', 'https://').replace(/\/$/, ''));

function peopleToCard(p, nid) {
  const slug = (p.id || '').replace(/^p-/, '');
  return {
    type: 'person',
    title: p.name,
    url: p.url,
    desc: p.bio,
    frqncy_pick: (p.picked_in||[]).includes(nid),
    internal_url: slug ? `/people/${slug}/` : null,
  };
}
function bookToCard(b, nid) {
  const pid = b.author_is_person_ref ? b.author : null;
  const authorName = pid ? ((PEOPLE?.people.find(p => p.id === pid)||{}).name || b.author) : b.author;
  const title = authorName ? `${b.title} — ${authorName}` : b.title;
  const slug = (b.id || '').replace(/^b-/, '');
  return {
    type: 'book',
    title,
    url: b.url,
    desc: b.bio,
    frqncy_pick: (b.picked_in||[]).includes(nid),
    internal_url: slug ? `/books/${slug}/` : null,
  };
}
function orgToCard(o, nid) {
  const slug = (o.id || '').replace(/^o-/, '');
  return {
    type: 'org',
    title: o.name,
    url: o.url,
    desc: o.bio,
    frqncy_pick: (o.picked_in||[]).includes(nid),
    internal_url: slug ? `/orgs/${slug}/` : null,
  };
}
function mediaToCard(m, nid) {
  const slug = (m.id || '').replace(/^m-/, '');
  return {
    type: 'media',
    title: m.name,
    url: m.url,
    desc: m.bio,
    frqncy_pick: (m.picked_in||[]).includes(nid),
    internal_url: slug ? `/media/${slug}/` : null,
  };
}
function placeToCard(pl, nid) {
  // Place cards include location in the description for context.
  const locPrefix = pl.location ? `${pl.location} — ` : '';
  const slug = (pl.id || '').replace(/^pl-/, '');
  return {
    type: 'place',
    title: pl.name,
    url: pl.url,
    desc: locPrefix + pl.bio,
    frqncy_pick: (pl.picked_in||[]).includes(nid),
    internal_url: slug ? `/places/${slug}/` : null,
  };
}

// ── Related topics computed from shared entities across the beds ──
// For a given topic, finds other topics that share people, books, orgs, media,
// or places with it. Returns topics sorted by overlap count (most shared first).
function relatedTopicsByEntities(topicId) {
  const counts = new Map();
  const bump = (otherTopicId) => {
    if (!otherTopicId || !otherTopicId.startsWith('t-')) return; // topics only, not domains/pillars
    if (otherTopicId === topicId) return;
    counts.set(otherTopicId, (counts.get(otherTopicId) || 0) + 1);
  };
  const scan = (arr) => {
    if (!arr) return;
    for (const e of arr) {
      if ((e.appears_in || []).includes(topicId)) {
        for (const other of e.appears_in) bump(other);
      }
    }
  };
  if (PEOPLE) scan(PEOPLE.people);
  if (BOOKS)  scan(BOOKS.books);
  if (ORGS)   scan(ORGS.orgs);
  if (MEDIA)  scan(MEDIA.media);
  if (PLACES) scan(PLACES.places);

  const topicById = new Map(DATA.topics.map(t => [t.id, t]));
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tid, count]) => ({ topic: topicById.get(tid), count }))
    .filter(x => x.topic);
}

function resourcesFor(nid) {
  const raw = DATA.resources[nid] || [];
  if (!PEOPLE && !BOOKS && !ORGS && !MEDIA && !PLACES) return raw; // beds not loaded, passthrough

  const out = [];
  const seen = new Set();
  for (const r of raw) {
    const key = `${r.type}|${normU(r.url)}`;
    if (r.type === 'person' && PEOPLE) {
      const p = PEOPLE.people.find(x => normU(x.url) === normU(r.url) && (x.appears_in||[]).includes(nid));
      const k = `person|${normU(p?.url)}`;
      if (p && !seen.has(k)) { out.push(peopleToCard(p, nid)); seen.add(k); }
    } else if (r.type === 'book' && BOOKS) {
      const b = BOOKS.books.find(x => normU(x.url) === normU(r.url) && (x.appears_in||[]).includes(nid));
      const k = `book|${normU(b?.url)}`;
      if (b && !seen.has(k)) { out.push(bookToCard(b, nid)); seen.add(k); }
    } else if (r.type === 'org' && ORGS) {
      const o = ORGS.orgs.find(x => normU(x.url) === normU(r.url) && (x.appears_in||[]).includes(nid));
      const k = `org|${normU(o?.url)}`;
      if (o && !seen.has(k)) { out.push(orgToCard(o, nid)); seen.add(k); }
    } else if (r.type === 'media' && MEDIA) {
      const m = MEDIA.media.find(x => normU(x.url) === normU(r.url) && (x.appears_in||[]).includes(nid));
      const k = `media|${normU(m?.url)}`;
      if (m && !seen.has(k)) { out.push(mediaToCard(m, nid)); seen.add(k); }
    } else if (!BED_TYPES.has(r.type)) {
      // Non-bed types (tools, courses, platforms, apps, websites, references, articles) pass through
      if (!seen.has(key)) { out.push(r); seen.add(key); }
    }
    // Bed types where the bed match failed silently drop — the bed is authoritative.
  }

  // Places don't have pre-existing content.json entries — append any whose
  // appears_in includes this node.
  if (PLACES) {
    for (const pl of PLACES.places) {
      if ((pl.appears_in||[]).includes(nid)) {
        const k = `place|${normU(pl.url)}`;
        if (!seen.has(k)) { out.push(placeToCard(pl, nid)); seen.add(k); }
      }
    }
  }

  return out;
}
function videosFor(nid)    { return (VIDEOS[nid] || []).filter(v => { const id = videoId(v); return id && !id.startsWith('PLACEHOLDER'); }); }
function mkdirp(dir)       { fs.mkdirSync(dir, { recursive: true }); }
function esc(s)            { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }

// Defence-in-depth: accent colours are dropped into inline <style>  (--accent:...)
// so a malformed value could break the stylesheet. Validate as #RGB or #RRGGBB hex,
// fall back to the brand gold if malformed.
const DEFAULT_ACCENT = '#C4973A';
function safeAccent(hex) {
  return (typeof hex === 'string' && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) ? hex : DEFAULT_ACCENT;
}

// Memoized hex → rgba (only ~14 unique accent colors in the dataset)
const rgbaCache = new Map();
function hexToRgba(hex, a) {
  const key = hex + a;
  if (rgbaCache.has(key)) return rgbaCache.get(key);
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const v = `rgba(${r},${g},${b},${a})`;
  rgbaCache.set(key, v);
  return v;
}

// ── Shared CSS ───────────────────────────────────────────────────
const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--navy:#0B1C3D;--navy-mid:#0D2451;--gold:#C4973A;--gold-light:#E0C06A;--text:#C8D8F0;--text-dim:#7090B8;--card-bg:rgba(255,255,255,0.04);--card-border:rgba(255,255,255,0.08)}
html,body{background:var(--navy);color:var(--text);font-family:'Jost',sans-serif;font-weight:300;min-height:100vh;line-height:1.6}
a{color:var(--accent);text-decoration:none}
a:hover{opacity:0.8}

/* NAV */
nav.snav{position:fixed;top:0;left:0;right:0;z-index:100;background:rgba(11,28,61,0.97);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-bottom:1px solid rgba(255,255,255,0.06);padding:0 clamp(1.25rem,4vw,2.5rem);height:56px;display:flex;align-items:center;justify-content:space-between}
.snav-left{display:flex;align-items:center;gap:1.75rem;min-width:0;overflow:hidden}
.snav-logo{font-family:'Cormorant',serif;font-size:1.1rem;letter-spacing:0.28em;color:#fff;text-transform:uppercase;text-decoration:none;flex-shrink:0;opacity:0.85;transition:opacity .2s}
.snav-logo:hover{opacity:1}
.snav-badge{font-size:0.55rem;letter-spacing:0.18em;color:var(--accent);border:1px solid currentColor;padding:1px 6px;border-radius:2px;vertical-align:middle;margin-left:4px;opacity:0.8}
.breadcrumb{font-size:0.7rem;letter-spacing:0.06em;color:var(--text-dim);display:flex;align-items:center;gap:0.35rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.breadcrumb a{color:var(--text-dim);transition:color .2s}
.breadcrumb a:hover{color:var(--text);opacity:1}
.breadcrumb .sep{opacity:0.25;font-size:0.65rem}
.snav-back{font-size:0.68rem;letter-spacing:0.1em;color:var(--text-dim);border:1px solid rgba(255,255,255,0.1);padding:5px 14px;border-radius:2px;transition:all .2s;text-decoration:none;flex-shrink:0;white-space:nowrap}
.snav-back:hover{color:var(--text);border-color:rgba(255,255,255,0.28);opacity:1}

/* HERO */
.hero{margin-top:56px;padding:clamp(3.5rem,8vw,6rem) clamp(1.25rem,5vw,2.5rem) clamp(3rem,6vw,5rem);text-align:center;position:relative;overflow:hidden}
.hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% -10%,var(--accent-glow) 0%,transparent 65%);pointer-events:none}
.hero::after{content:'';position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:1px;height:40px;background:linear-gradient(to bottom,rgba(255,255,255,0.08),transparent)}
.hero-eyebrow{display:inline-flex;align-items:center;gap:0.5rem;font-size:0.6rem;letter-spacing:0.32em;text-transform:uppercase;color:var(--accent);margin-bottom:1.25rem}
.hero-eyebrow::before,.hero-eyebrow::after{content:'';display:block;width:20px;height:1px;background:currentColor;opacity:0.4}
.hero h1{font-family:'Cormorant',serif;font-size:clamp(2.6rem,7vw,5.2rem);font-weight:300;color:#fff;line-height:1.08;margin-bottom:1.5rem;letter-spacing:-0.01em}
.hero-desc{max-width:560px;margin:0 auto;font-size:0.9rem;color:var(--text-dim);font-weight:300;line-height:1.75}

/* MAIN */
main{max-width:1080px;margin:0 auto;padding:3rem clamp(1.25rem,5vw,2.5rem) 7rem}
section{margin-bottom:4.5rem}
.section-label{font-size:0.58rem;letter-spacing:0.32em;text-transform:uppercase;color:var(--accent);margin-bottom:1.75rem;padding-bottom:0.75rem;border-bottom:1px solid rgba(255,255,255,0.05);opacity:0.9}

/* GRID */
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1px;border:1px solid var(--card-border);border-radius:4px;overflow:hidden;background:var(--card-border)}
.grid-sm{grid-template-columns:repeat(auto-fill,minmax(180px,1fr))}

/* NODE CARD */
.ncard{background:var(--navy);padding:1.4rem 1.4rem 1.1rem;text-decoration:none;color:var(--text);display:block;transition:background .2s;position:relative}
.ncard:hover{background:rgba(255,255,255,0.04);color:var(--text)}
.ncard-type{font-size:0.54rem;letter-spacing:0.28em;text-transform:uppercase;color:var(--accent);margin-bottom:0.6rem;opacity:0.8}
.ncard h3{font-family:'Cormorant',serif;font-size:1.25rem;font-weight:400;color:#fff;margin-bottom:0.4rem;line-height:1.2}
.ncard p{font-size:0.76rem;color:var(--text-dim);line-height:1.45}
.ncard-arrow{position:absolute;top:1.2rem;right:1.2rem;font-size:0.7rem;color:var(--accent);opacity:0;transition:opacity .2s}
.ncard:hover .ncard-arrow{opacity:1}

/* RESOURCE CARD */
.rcard{background:var(--card-bg);border:1px solid var(--card-border);border-radius:4px;padding:1.25rem 1.4rem;display:grid;grid-template-columns:auto 1fr auto;gap:1rem;align-items:start;transition:border-color .2s,background .2s}
.rcard:hover{border-color:rgba(255,255,255,0.14);background:rgba(255,255,255,0.05)}
.rtype{font-size:0.5rem;letter-spacing:0.22em;text-transform:uppercase;color:var(--navy);background:var(--accent);padding:3px 9px;border-radius:2px;font-weight:500;white-space:nowrap;line-height:1.6;margin-top:2px}
.rinfo{min-width:0}
.rinfo h4{font-size:0.9rem;font-weight:400;color:#fff;margin-bottom:0.35rem;display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;line-height:1.35}
.rinfo p{font-size:0.76rem;color:var(--text-dim);line-height:1.55}
.fpick{font-size:0.48rem;letter-spacing:0.15em;color:var(--gold);border:1px solid rgba(196,151,58,0.5);padding:1px 6px;border-radius:2px;flex-shrink:0;font-weight:400}
.rlink{font-size:0.66rem;letter-spacing:0.1em;color:var(--accent);border:1px solid rgba(255,255,255,0.1);padding:5px 12px;border-radius:2px;white-space:nowrap;transition:all .2s;text-decoration:none;margin-top:1px}
.rlink:hover{border-color:var(--accent);opacity:1}

/* EMPTY */
.empty{text-align:center;padding:3.5rem 2rem;border:1px dashed rgba(255,255,255,0.08);border-radius:4px}
.empty p{color:var(--text-dim);font-size:0.82rem;line-height:1.7}

/* FILTER TABS */
.ftabs{display:flex;gap:0.4rem;flex-wrap:wrap;margin-bottom:1.75rem}
.ftab{font-size:0.64rem;letter-spacing:0.14em;text-transform:uppercase;padding:5px 14px;border:1px solid rgba(255,255,255,0.1);border-radius:2px;cursor:pointer;color:var(--text-dim);background:none;transition:all .2s;font-family:'Jost',sans-serif}
.ftab:hover{border-color:rgba(255,255,255,0.22);color:var(--text)}
.ftab.active{border-color:var(--accent);color:var(--accent);background:rgba(255,255,255,0.03)}

/* RLIST */
.rlist{display:flex;flex-direction:column;gap:0.65rem}

/* PICKS CALLOUT */
.picks-intro{font-size:0.78rem;color:var(--text-dim);margin-bottom:1.5rem;line-height:1.6;max-width:600px}
.picks-intro strong{color:var(--gold);font-weight:400}

/* VIDEO SECTION */
.vgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:1rem;margin-top:0}
.vcard-t{
  background:var(--card-bg);border:1px solid var(--card-border);border-radius:4px;
  overflow:hidden;cursor:pointer;transition:border-color .22s,transform .22s,background .22s;
  display:flex;flex-direction:column;
}
.vcard-t:hover{border-color:rgba(255,255,255,0.18);transform:translateY(-2px);background:rgba(255,255,255,0.05)}
.vcard-t:active{transform:translateY(0);transition-duration:.1s}
.vthumb-t{position:relative;width:100%;aspect-ratio:16/9;background:#0a1428;overflow:hidden;flex-shrink:0}
.vthumb-t img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .3s}
.vcard-t:hover .vthumb-t img{transform:scale(1.04)}
.vplay-t{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.2);transition:background .2s}
.vcard-t:hover .vplay-t{background:rgba(0,0,0,0.38)}
.vplay-btn-t{
  width:40px;height:40px;border-radius:50%;
  background:rgba(255,255,255,0.18);backdrop-filter:blur(4px);
  border:1.5px solid rgba(255,255,255,0.35);
  display:flex;align-items:center;justify-content:center;
  transition:background .2s,transform .2s;
}
.vcard-t:hover .vplay-btn-t{background:rgba(255,255,255,0.28);transform:scale(1.1)}
.vdur-t{position:absolute;bottom:6px;right:6px;background:rgba(0,0,0,0.78);color:#fff;font-family:'Jost',sans-serif;font-size:0.6rem;padding:1px 6px;border-radius:2px;letter-spacing:0.02em}
.vpick-t{position:absolute;top:6px;left:6px;background:rgba(196,151,58,0.92);color:#0B1C3D;font-family:'Jost',sans-serif;font-size:0.46rem;letter-spacing:0.18em;text-transform:uppercase;font-weight:500;padding:2px 6px;border-radius:2px}
.vprov-t{position:absolute;bottom:6px;left:6px;font-family:'Jost',sans-serif;font-size:0.46rem;letter-spacing:0.12em;text-transform:uppercase;padding:2px 6px;border-radius:2px}
.vthumb-fallback-t{width:100%;height:100%;background:linear-gradient(135deg,rgba(74,122,232,0.12),rgba(196,151,58,0.08))}
.vplay-ext-t{border-style:dashed}
.vinfo-t{padding:0.8rem 1rem 0.9rem;flex:1;display:flex;flex-direction:column;gap:0.2rem}
.vtitle-t{font-family:'Cormorant',serif;font-size:1rem;font-weight:400;color:#fff;line-height:1.25}
.vchan-t{font-size:0.66rem;color:var(--text-dim)}
/* VIDEO MODAL */
.vmodal{
  position:fixed;inset:0;z-index:200;
  background:rgba(5,12,28,0.94);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
  display:flex;align-items:center;justify-content:center;padding:1.25rem;
  opacity:0;pointer-events:none;transition:opacity .25s;
}
.vmodal.open{opacity:1;pointer-events:all}
.vmodal-box{
  width:100%;max-width:860px;background:#0c1e42;
  border:1px solid rgba(255,255,255,0.1);border-radius:6px;overflow:hidden;
  transform:translateY(10px) scale(0.98);transition:transform .25s;
}
.vmodal.open .vmodal-box{transform:translateY(0) scale(1)}
.vmodal-player{width:100%;aspect-ratio:16/9}
.vmodal-player iframe{width:100%;height:100%;border:none;display:block}
.vmodal-footer{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;padding:1rem 1.25rem;border-top:1px solid rgba(255,255,255,0.07)}
.vmodal-title{font-family:'Cormorant',serif;font-size:1.2rem;color:#fff;line-height:1.2;margin-bottom:0.15rem}
.vmodal-chan{font-size:0.68rem;color:var(--text-dim)}
.vmodal-close{
  background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);
  cursor:pointer;width:30px;height:30px;border-radius:50%;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;
  color:var(--text-dim);font-size:0.95rem;transition:all .2s;
}
.vmodal-close:hover{color:#fff;background:rgba(255,255,255,0.12)}
.watch-link{
  display:inline-flex;align-items:center;gap:0.4rem;margin-top:1.1rem;
  font-size:0.64rem;letter-spacing:0.14em;text-transform:uppercase;
  color:var(--accent);border:1px solid rgba(255,255,255,0.1);
  padding:6px 14px;border-radius:2px;transition:border-color .2s;text-decoration:none;
}
.watch-link:hover{border-color:var(--accent);opacity:1}

/* COURSE CALLOUT */
.course-callout{
  display:flex;align-items:center;gap:1.25rem;
  background:var(--card-bg);border:1px solid var(--card-border);border-radius:4px;
  padding:1.25rem 1.4rem;margin-bottom:0.75rem;
  text-decoration:none;color:var(--text);transition:background .2s,border-color .2s;
  position:relative;overflow:hidden;
}
.course-callout::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--course-accent,var(--accent))}
.course-callout:hover{background:rgba(255,255,255,0.06);border-color:rgba(255,255,255,0.14);opacity:1}
.cc-level{font-size:0.5rem;letter-spacing:0.18em;text-transform:uppercase;padding:2px 8px;border-radius:2px;border:1px solid currentColor;flex-shrink:0;white-space:nowrap}
.cc-body{flex:1;min-width:0}
.cc-title{font-family:'Cormorant',serif;font-size:1.15rem;font-weight:400;color:#fff;line-height:1.2;margin-bottom:0.25rem}
.cc-meta{font-size:0.68rem;color:var(--text-dim)}
.cc-arrow{font-size:1rem;color:var(--accent);flex-shrink:0;transition:transform .2s}
.course-callout:hover .cc-arrow{transform:translateX(3px)}

/* FOOTER */
footer{border-top:1px solid rgba(255,255,255,0.05);padding:2.5rem clamp(1.25rem,5vw,2.5rem);text-align:center}
.footer-inner{max-width:1080px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap}
.footer-logo{font-family:'Cormorant',serif;font-size:1rem;letter-spacing:0.25em;color:rgba(255,255,255,0.3);text-transform:uppercase}
.footer-links{display:flex;gap:1.5rem}
.footer-links a{font-size:0.68rem;letter-spacing:0.1em;color:var(--text-dim);text-transform:uppercase;transition:color .2s}
.footer-links a:hover{color:var(--text);opacity:1}

@media(max-width:640px){
  .hero{padding:3rem 1.25rem 2.5rem}
  main{padding:2rem 1.25rem 5rem}
  .rcard{grid-template-columns:auto 1fr;grid-template-rows:auto auto}
  .rlink{grid-column:2;margin-top:0.5rem}
  .breadcrumb{display:none}
  .footer-inner{flex-direction:column;gap:1rem;text-align:center}
  .vgrid{grid-template-columns:1fr 1fr;gap:0.75rem}
  .snav-back{font-size:0.6rem;padding:4px 10px}
}
@media(max-width:400px){
  .vgrid{grid-template-columns:1fr}
  .rcard{grid-template-columns:1fr}
  .rlink{grid-column:1}
  .section-label{font-size:0.6rem}
  .snav-back:not(:last-child){display:none}
}
`;

// ── Shared filter JS (inlined once per page that has resources) ──
const FILTER_JS = `
<script>
document.querySelectorAll('.ftab').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.ftab').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const f=btn.dataset.filter;
    document.querySelectorAll('.rcard').forEach(c=>{
      c.style.display=(f==='all'||c.dataset.type===f)?'':'none';
    });
  });
});
</script>`;

// ── Nav / Footer ─────────────────────────────────────────────────
function nav(crumbHtml) {
  // Absolute paths so the nav works on any generated page regardless of
  // depth (v2/[topic]/, people/[slug]/, books/[slug]/, etc.).
  // Compact hub links for People / Books / Orgs / Media / Places so readers
  // can cross the world model without detouring through the homepage.
  const hubLinkStyle = "border:none;padding:0;font-size:0.64rem;letter-spacing:0.12em";
  return `<nav class="snav">
  <div class="snav-left">
    <a href="/v2/explore.html" class="snav-logo">FRQNCY<span class="snav-badge">NETWORK</span></a>
    ${crumbHtml ? `<div class="breadcrumb">${crumbHtml}</div>` : ''}
  </div>
  <div style="display:flex;align-items:center;gap:0.75rem;flex-shrink:0">
    <a href="/people/" class="snav-back" style="${hubLinkStyle}">People</a>
    <a href="/books/"  class="snav-back" style="${hubLinkStyle}">Books</a>
    <a href="/orgs/"   class="snav-back" style="${hubLinkStyle}">Orgs</a>
    <a href="/media/"  class="snav-back" style="${hubLinkStyle}">Media</a>
    <a href="/places/" class="snav-back" style="${hubLinkStyle}">Places</a>
    <a href="/search.html" class="snav-back" style="${hubLinkStyle}">Search</a>
    <a href="/" class="snav-back">← Main</a>
  </div>
</nav>`;
}

const FOOTER = `<footer>
  <div class="footer-inner">
    <span class="footer-logo">FRQNCY</span>
    <div class="footer-links">
      <a href="../explore.html">Explore</a>
      <a href="../watch/index.html">Watch</a>
      <a href="../courses/index.html">Courses</a>
      <a href="../../index.html">Main site</a>
      <a href="../../about.html">Vision</a>
    </div>
  </div>
</footer>`;

// ── Resource cards ───────────────────────────────────────────────
function rcard(r) {
  const link = r.url
    ? `<a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer" class="rlink">Visit →</a>`
    : '';
  // If the resource has a dedicated page on FRQNCY (e.g. a person profile),
  // make the title a link to that page so clicking the name navigates internally.
  // External "Visit →" button stays as-is.
  const titleInner = esc(r.title);
  const titleHtml = r.internal_url
    ? `<a href="${esc(r.internal_url)}" style="color:inherit;text-decoration:none;border-bottom:1px solid rgba(255,255,255,0.18)">${titleInner}</a>`
    : titleInner;
  return `<div class="rcard" data-type="${esc(r.type)}">
  <span class="rtype">${esc(r.type)}</span>
  <div class="rinfo">
    <h4>${titleHtml}${r.frqncy_pick ? ' <span class="fpick">✦ FRQNCY PICK</span>' : ''}</h4>
    ${r.desc ? `<p>${esc(r.desc)}</p>` : ''}
  </div>
  ${link}
</div>`;
}

function resourceSection(nodeId, label, res = null) {
  res = res ?? resourcesFor(nodeId);
  if (!res.length) {
    return `<section>
  <div class="section-label">${label}</div>
  <div class="empty"><p>FRQNCY is curating this space.<br>Resources coming soon.</p></div>
</section>`;
  }
  const types = [...new Set(res.map(r => r.type))];
  const tabs  = ['all', ...types].map(t =>
    `<button class="ftab${t === 'all' ? ' active' : ''}" data-filter="${t}">${t}</button>`
  ).join('');
  return `<section>
  <div class="section-label">${label}</div>
  <div class="ftabs">${tabs}</div>
  <div class="rlist">${res.map(rcard).join('\n')}</div>
</section>
${FILTER_JS}`;
}

// ── Video section for topic pages ────────────────────────────────
function videoSection(topicId) {
  const vids = videosFor(topicId);
  if (!vids.length) return '';

  // Use data-* attributes — avoids fragile onclick string escaping with apostrophes
  // data-embed: autoplay embed URL (empty string for non-embeddable providers like Gaia)
  // data-watch: canonical watch URL for external-link fallback
  const cards = vids.map(v => {
    const prov       = getProvider(v);
    const thumb      = thumbUrl(v);
    const embed      = embedUrl(v, true);  // autoplay
    const watch      = watchUrl(v);
    const provBadge  = prov.id !== 'youtube'
      ? `<span class="vprov-t" style="background:${prov.color}22;color:${prov.color};border:1px solid ${prov.color}55">${esc(prov.name)}</span>`
      : '';
    const playIcon   = prov.embeddable
      ? `<div class="vplay-btn-t"><svg viewBox="0 0 24 24" fill="white" width="16" height="16"><polygon points="5,3 19,12 5,21"/></svg></div>`
      : `<div class="vplay-btn-t vplay-ext-t"><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" width="14" height="14"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></div>`;

    return `
  <div class="vcard-t" data-embed="${esc(embed)}" data-watch="${esc(watch)}" data-title="${esc(v.title)}" data-chan="${esc(v.channel||'')}" tabindex="0" role="button" aria-label="${prov.embeddable ? 'Play' : 'Watch'} ${esc(v.title)}${prov.id !== 'youtube' ? ' on '+prov.name : ''}">
    <div class="vthumb-t">
      ${thumb ? `<img src="${thumb}" alt="" loading="lazy" decoding="async">` : '<div class="vthumb-fallback-t"></div>'}
      <div class="vplay-t">${playIcon}</div>
      ${v.duration ? `<span class="vdur-t">${esc(v.duration)}</span>` : ''}
      ${v.frqncy_pick ? '<span class="vpick-t">FRQNCY Pick</span>' : ''}
      ${provBadge}
    </div>
    <div class="vinfo-t">
      <div class="vtitle-t">${esc(v.title)}</div>
      ${v.channel ? `<div class="vchan-t">${esc(v.channel)}</div>` : ''}
    </div>
  </div>`;
  }).join('');

  return `<section>
  <div class="section-label">Watch</div>
  <div class="vgrid">${cards}</div>
  <a href="../watch/" class="watch-link">▶ Browse All Videos</a>
</section>

<!-- Video modal -->
<div class="vmodal" id="vmodal">
  <div class="vmodal-box">
    <div class="vmodal-player"><iframe id="vmodal-iframe" src="" allow="autoplay;encrypted-media;picture-in-picture" allowfullscreen title="Video"></iframe></div>
    <div class="vmodal-footer">
      <div>
        <div class="vmodal-title" id="vmodal-title"></div>
        <div class="vmodal-chan" id="vmodal-chan"></div>
      </div>
      <button class="vmodal-close" id="vmodal-close" aria-label="Close video">✕</button>
    </div>
  </div>
</div>
<script>
(function(){
  function openVid(embed,watch,title,chan){
    if(embed){
      document.getElementById('vmodal-title').textContent=title;
      document.getElementById('vmodal-chan').textContent=chan?'— '+chan:'';
      document.getElementById('vmodal-iframe').src=embed;
      document.getElementById('vmodal').classList.add('open');
      document.body.style.overflow='hidden';
    } else {
      window.open(watch,'_blank','noopener,noreferrer');
    }
  }
  function closeVid(){
    document.getElementById('vmodal').classList.remove('open');
    document.getElementById('vmodal-iframe').src='';
    document.body.style.overflow='';
  }
  document.querySelectorAll('.vcard-t').forEach(function(card){
    function activate(){ openVid(card.dataset.embed, card.dataset.watch, card.dataset.title, card.dataset.chan); }
    card.addEventListener('click', activate);
    card.addEventListener('keydown', function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); activate(); }});
  });
  document.getElementById('vmodal-close').addEventListener('click', closeVid);
  document.getElementById('vmodal').addEventListener('click', function(e){ if(e.target===this) closeVid(); });
  document.addEventListener('keydown', function(e){ if(e.key==='Escape') closeVid(); });
})();
<\/script>`;
}

// ── Course callout for topic pages ───────────────────────────────
function courseSection(topicId) {
  const courses = coursesByTopic.get(topicId) || [];
  if (!courses.length) return '';

  const cards = courses.map(c => `<a class="course-callout" href="../courses/${c.slug}/" style="--course-accent:${c.accent}">
  <span class="cc-level" style="color:${c.accent};border-color:${c.accent}60">${esc(c.level)}</span>
  <span class="cc-body">
    <span class="cc-title">${esc(c.title)}</span>
    <span class="cc-meta">${c.lessons.length} lessons · ${esc(c.duration)}${c.subtitle ? ' · ' + esc(c.subtitle) : ''}</span>
  </span>
  <span class="cc-arrow">→</span>
</a>`).join('\n');

  return `<section>
  <div class="section-label">Take a Course</div>
  ${cards}
</section>`;
}

// ── Shared JSON-LD helpers ───────────────────────────────────────
const SITE_REF = { '@type': 'WebSite', name: 'FRQNCY Network', url: 'https://frqncy.network' };

function collectionLd(label, desc, url) {
  return { '@context': 'https://schema.org', '@type': 'CollectionPage', name: `${label} — FRQNCY Network`, description: desc, url, isPartOf: SITE_REF };
}

// ── Head template ────────────────────────────────────────────────
function head(title, accent, desc = '', canonical = '', jsonLd = null, ogImageSlug = null) {
  const safe     = safeAccent(accent);
  const glow     = hexToRgba(safe, 0.14);
  const safeTitle = esc(title);
  const metaDesc = esc((desc || `Explore ${title} — curated resources, FRQNCY Picks, and the best thinkers in this space. Part of the FRQNCY conscious living network.`).slice(0, 155));
  const url      = canonical || 'https://frqncy.network/v2/';
  const ogImage  = ogImageSlug
    ? `https://frqncy.network/v2/og/${ogImageSlug}.png`
    : 'https://frqncy.network/og-image.png';
  const ldTag    = jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${safeTitle} — FRQNCY Network</title>
<meta name="description" content="${metaDesc}">
<meta name="theme-color" content="#0B1C3D">
<meta property="og:type" content="website">
<meta property="og:title" content="${safeTitle} — FRQNCY Network">
<meta property="og:description" content="${metaDesc}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ogImage}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:site_name" content="FRQNCY">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${safeTitle} — FRQNCY Network">
<meta name="twitter:description" content="${metaDesc}">
<meta name="twitter:image" content="${ogImage}">
<link rel="icon" type="image/svg+xml" href="../../favicon.svg">
<link rel="manifest" href="../../manifest.json">
<link rel="canonical" href="${url}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Jost:wght@300;400;500&display=swap" rel="stylesheet">
<style>
:root{--accent:${safe};--accent-glow:${glow}}
${CSS}
</style>
<script defer data-domain="frqncy.network" src="https://plausible.io/js/script.js"></script>
<script src="../../mobile-nav.js" defer></script>
<script src="../../chat-widget.js" defer></script>
<link rel="stylesheet" href="../../nav-dropdown.css">
<script>if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js'));}</script>
${ldTag}
</head>
<body>`;
}

// ── PILLAR PAGE ──────────────────────────────────────────────────
function pillarPage(p) {
  const domains = domainsByPillar.get(p.id) || [];
  const dcards  = domains.map(d => `<a href="../${d.slug}/index.html" class="ncard">
  <div class="ncard-type">Domain</div>
  <h3>${esc(d.label)}</h3>
  <p>${esc(d.desc || '')}</p>
  <span class="ncard-arrow">→</span>
</a>`).join('\n');

  const canonical = `https://frqncy.network/v2/${p.slug}/`;

  return head(p.label, p.accent, p.desc, canonical, collectionLd(p.label, p.desc, canonical), p.slug) +
nav('') +
`<div class="hero">
  <div class="hero-eyebrow">Pillar</div>
  <h1>${esc(p.label)}</h1>
  <p class="hero-desc">${esc(p.desc)}</p>
</div>
<main>
  <section>
    <div class="section-label">Domains within ${esc(p.label)}</div>
    <div class="grid">${dcards}</div>
  </section>
  ${resourceSection(p.id, 'FRQNCY Picks')}
</main>
${FOOTER}
</body></html>`;
}

// ── DOMAIN PAGE ──────────────────────────────────────────────────
function domainPage(d) {
  const pillar = pillarMap.get(d.pillar);
  const topics = topicsByDomain.get(d.id) || [];

  const tcards = topics.map(t => `<a href="../${t.slug}/index.html" class="ncard">
  <div class="ncard-type">Topic</div>
  <h3>${esc(t.label)}</h3>
  ${t.desc ? `<p>${esc(t.desc.slice(0, 85))}…</p>` : ''}
  <span class="ncard-arrow">→</span>
</a>`).join('\n');

  const crumb    = `<a href="../${pillar.slug}/index.html">${esc(pillar.label)}</a><span class="sep">/</span><span>${esc(d.label)}</span>`;
  const canonical = `https://frqncy.network/v2/${d.slug}/`;

  return head(d.label, d.accent, d.desc, canonical, collectionLd(d.label, d.desc, canonical), d.slug) +
nav(crumb) +
`<div class="hero">
  <div class="hero-eyebrow">${esc(pillar.label)} &nbsp;·&nbsp; Domain</div>
  <h1>${esc(d.label)}</h1>
  ${d.desc ? `<p class="hero-desc">${esc(d.desc)}</p>` : ''}
</div>
<main>
  ${resourceSection(d.id, `FRQNCY Picks — ${esc(d.label)}`)}
  <section>
    <div class="section-label">Explore topics in ${esc(d.label)}</div>
    <div class="grid grid-sm">${tcards}</div>
  </section>
</main>
${FOOTER}
</body></html>`;
}

// ── TOPIC PAGE ───────────────────────────────────────────────────
function topicPage(t) {
  const domain = domainMap.get(t.domain);
  const pillar = pillarMap.get(domain.pillar);

  // Related topics in same domain (exclude current, max 6)
  // ── Connected through the network — topics linked by shared bed entities ──
  const connected = relatedTopicsByEntities(t.id).slice(0, 6);
  const connectedIds = new Set(connected.map(x => x.topic.id));
  const connectedSection = connected.length ? `<section>
    <div class="section-label">Connected through the network</div>
    <div class="grid grid-sm">
      ${connected.map(({topic: r, count}) => `<a href="../${r.slug}/index.html" class="ncard">
  <div class="ncard-type">Topic &nbsp;·&nbsp; ${count} shared</div>
  <h3>${esc(r.label)}</h3>
  ${r.desc ? `<p>${esc(r.desc.slice(0, 70))}…</p>` : ''}
  <span class="ncard-arrow">→</span>
</a>`).join('\n')}
    </div>
  </section>` : '';

  // ── More in [Domain] — same-domain topics, excluding any already shown in "Connected" ──
  const related = (topicsByDomain.get(t.domain) || [])
    .filter(r => r.id !== t.id && !connectedIds.has(r.id))
    .slice(0, 6);
  const relatedCards = related.length ? `<section>
    <div class="section-label">More in ${esc(domain.label)}</div>
    <div class="grid grid-sm">
      ${related.map(r => `<a href="../${r.slug}/index.html" class="ncard">
  <div class="ncard-type">Topic</div>
  <h3>${esc(r.label)}</h3>
  ${r.desc ? `<p>${esc(r.desc.slice(0, 70))}…</p>` : ''}
  <span class="ncard-arrow">→</span>
</a>`).join('\n')}
    </div>
  </section>` : '';

  const canonical = `https://frqncy.network/v2/${t.slug}/`;
  // Single resourcesFor() call — reused for both JSON-LD and the resource section
  const res   = resourcesFor(t.id);
  const picks = res.filter(r => r.frqncy_pick);

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${t.label} — FRQNCY Picks`,
    description: t.desc || `Curated resources for ${t.label} on FRQNCY Network`,
    url: canonical,
    numberOfItems: picks.length,
    itemListElement: picks.slice(0, 10).map((r, i) => {
      const item = { '@type': 'ListItem', position: i + 1, name: r.title };
      if (r.url)  item.url = r.url;
      if (r.desc) item.description = r.desc;
      return item;
    }),
    isPartOf: SITE_REF,
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'FRQNCY', item: 'https://frqncy.network' },
        { '@type': 'ListItem', position: 2, name: pillar.label, item: `https://frqncy.network/v2/${pillar.slug}/` },
        { '@type': 'ListItem', position: 3, name: domain.label, item: `https://frqncy.network/v2/${domain.slug}/` },
        { '@type': 'ListItem', position: 4, name: t.label, item: canonical },
      ],
    },
  };

  const crumb = `<a href="../${pillar.slug}/index.html">${esc(pillar.label)}</a><span class="sep">/</span><a href="../${domain.slug}/index.html">${esc(domain.label)}</a><span class="sep">/</span><span>${esc(t.label)}</span>`;

  const vidSection    = videoSection(t.id);
  const courseCallout = courseSection(t.id);

  return head(t.label, domain.accent, t.desc, canonical, ld, t.slug) +
nav(crumb) +
`<div class="hero">
  <div class="hero-eyebrow">${esc(domain.label)} &nbsp;·&nbsp; Topic</div>
  <h1>${esc(t.label)}</h1>
  ${t.desc ? `<p class="hero-desc">${esc(t.desc)}</p>` : ''}
</div>
<main>
  ${vidSection}
  ${courseCallout}
  ${resourceSection(t.id, 'Curated Resources', res)}
  ${connectedSection}
  ${relatedCards}
</main>
${FOOTER}
</body></html>`;
}

// ── PERSON PAGE ──────────────────────────────────────────────────
// Renders a dedicated page for each person in the people bed.
// URL: /people/[slug]/ — two levels deep like v2/[topic]/, same asset paths.
// Page shows: hero (name + bio + external link), their works (books, orgs,
// media), any channels, and the topics they appear on.
function personSlug(person) {
  return (person.id || '').replace(/^p-/, '');
}

function worksForPerson(personId) {
  const out = [];
  if (BOOKS) for (const b of BOOKS.books) {
    if (b.author_is_person_ref && b.author === personId) {
      const title = b.title; // bare title; author is the current page's subject
      out.push({ type: 'book', title, url: b.url, desc: b.bio, frqncy_pick: false });
    }
  }
  if (ORGS) for (const o of ORGS.orgs) {
    if (o.founder_is_person_ref && o.founder === personId) {
      out.push({ type: 'org', title: o.name, url: o.url, desc: o.bio, frqncy_pick: false });
    }
  }
  if (MEDIA) for (const m of MEDIA.media) {
    if (m.creator_is_person_ref && m.creator === personId) {
      out.push({ type: 'media', title: m.name, url: m.url, desc: m.bio, frqncy_pick: false });
    }
  }
  return out;
}

function topicsForPerson(person) {
  const ids = new Set(person.appears_in || []);
  return DATA.topics.filter(t => ids.has(t.id));
}

// Shared "Appears on" section renderer for entity profile pages.
// Labels each card Topic/Domain/Pillar and optionally marks PICK.
function appearsOnSection(appearsIn, pickedIn) {
  const apps = appearancesFor(appearsIn);
  if (!apps.length) return '';
  const pickedSet = new Set(pickedIn || []);
  // Map each appearance back to its id to check pick status
  const pillarByLabel = new Map(DATA.pillars.map(p => [p.label, p.id]));
  const domainByLabel = new Map(DATA.domains.map(d => [d.label, d.id]));
  const topicByLabel  = new Map(DATA.topics.map(t => [t.label, t.id]));
  const lookupId = (a) => ({Topic: topicByLabel, Domain: domainByLabel, Pillar: pillarByLabel}[a.eyebrow] || new Map()).get(a.label);
  const cards = apps.map(a => {
    const id = lookupId(a);
    const pick = id && pickedSet.has(id) ? ' &nbsp;·&nbsp; ✦ PICK' : '';
    return `<a href="${esc(a.href)}" class="ncard">
  <div class="ncard-type">${esc(a.eyebrow)}${pick}</div>
  <h3>${esc(a.label)}</h3>
  ${a.desc ? `<p>${esc(a.desc.slice(0, 70))}…</p>` : ''}
  <span class="ncard-arrow">→</span>
</a>`;
  }).join('\n');
  return `<section>
  <div class="section-label">Appears on</div>
  <div class="grid grid-sm">${cards}</div>
</section>`;
}

// Returns every place the entity appears: topics, domains, pillars — as
// a card-renderable shape with `href` + `label` + `eyebrow` + `desc`.
function appearancesFor(appearsIn) {
  const out = [];
  const ids = new Set(appearsIn || []);
  const pillarById = new Map(DATA.pillars.map(p => [p.id, p]));
  const domainById = new Map(DATA.domains.map(d => [d.id, d]));
  const topicById  = new Map(DATA.topics.map(t => [t.id, t]));
  for (const id of appearsIn || []) {
    if (pillarById.has(id)) {
      const p = pillarById.get(id);
      out.push({ eyebrow: 'Pillar', label: p.label, desc: p.desc, href: `/v2/${p.slug}/index.html` });
    } else if (domainById.has(id)) {
      const d = domainById.get(id);
      out.push({ eyebrow: 'Domain', label: d.label, desc: d.desc, href: `/v2/${d.slug}/index.html` });
    } else if (topicById.has(id)) {
      const t = topicById.get(id);
      out.push({ eyebrow: 'Topic', label: t.label, desc: t.desc, href: `/v2/${t.slug}/index.html` });
    }
  }
  return out;
}

function personPage(person) {
  const slug = personSlug(person);
  const canonical = `https://frqncy.network/people/${slug}/`;
  const works = worksForPerson(person.id);
  const appearances = appearancesFor(person.appears_in);
  const topics = topicsForPerson(person); // kept for pick logic / legacy callers

  // Works section — reuse the rcard/resourceSection look
  const worksSection = works.length ? `<section>
  <div class="section-label">Works</div>
  <div class="rlist">${works.map(rcard).join('\n')}</div>
</section>` : '';

  // Channels section (for humans who channel named entities)
  const channelsSection = (person.channels && person.channels.length) ? `<section>
  <div class="section-label">Channels</div>
  <div class="rlist">${person.channels.map(c => `<div class="rcard" data-type="channel">
  <span class="rtype">channel</span>
  <div class="rinfo">
    <h4>${esc(c.name)}</h4>
    ${c.description ? `<p>${esc(c.description)}</p>` : ''}
  </div>
</div>`).join('\n')}</div>
</section>` : '';

  // All appearances (topics, domains, pillars) — renders a richer "teaches across"
  // section when a person is attached at the domain or pillar level rather than
  // only to specific topics.
  const topicsSection = appearances.length ? `<section>
  <div class="section-label">Teaches across</div>
  <div class="grid grid-sm">
    ${appearances.map(a => `<a href="${esc(a.href)}" class="ncard">
  <div class="ncard-type">${esc(a.eyebrow)}</div>
  <h3>${esc(a.label)}</h3>
  ${a.desc ? `<p>${esc(a.desc.slice(0, 70))}…</p>` : ''}
  <span class="ncard-arrow">→</span>
</a>`).join('\n')}
  </div>
</section>` : '';

  const crumb = `<a href="../../index.html">FRQNCY</a><span class="sep">/</span><span>People</span><span class="sep">/</span><span>${esc(person.name)}</span>`;
  const externalLink = person.url ? `<a href="${esc(person.url)}" target="_blank" rel="noopener noreferrer" class="rlink" style="margin-top:1.25rem;display:inline-block">Visit ${esc((person.url||'').replace(/^https?:\/\/(www\.)?/,'').replace(/\/$/,''))} →</a>` : '';

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: person.name,
    description: person.bio,
    url: canonical,
    sameAs: person.url ? [person.url] : undefined,
    isPartOf: SITE_REF,
  };

  return head(person.name, null, person.bio, canonical, ld, null) +
nav(crumb) +
`<div class="hero">
  <div class="hero-eyebrow">Person</div>
  <h1>${esc(person.name)}</h1>
  ${person.bio ? `<p class="hero-desc">${esc(person.bio)}</p>` : ''}
  ${externalLink}
</div>
<main>
  ${worksSection}
  ${channelsSection}
  ${topicsSection}
</main>
${FOOTER}
</body></html>`;
}

// ── BOOK PAGE — /books/[slug]/ ───────────────────────────────────
function bookSlug(book) { return (book.id || '').replace(/^b-/, ''); }

function topicsForBucketList(bucketIds) {
  const s = new Set(bucketIds || []);
  return DATA.topics.filter(t => s.has(t.id));
}

function bookPage(book) {
  const slug = bookSlug(book);
  const canonical = `https://frqncy.network/books/${slug}/`;

  // Resolve author — if p-id link, grab the Person for display + link
  let authorHtml = '';
  if (book.author_is_person_ref && PEOPLE) {
    const person = PEOPLE.people.find(p => p.id === book.author);
    if (person) {
      const pslug = personSlug(person);
      authorHtml = `<div style="margin-top:0.75rem;font-size:0.85rem;color:var(--text-dim)">By <a href="/people/${esc(pslug)}/" style="color:var(--accent);border-bottom:1px solid rgba(255,255,255,0.18);text-decoration:none">${esc(person.name)}</a></div>`;
    }
  } else if (typeof book.author === 'string') {
    authorHtml = `<div style="margin-top:0.75rem;font-size:0.85rem;color:var(--text-dim)">By ${esc(book.author)}</div>`;
  }

  const topicsSection = appearsOnSection(book.appears_in, book.picked_in);

  const crumb = `<a href="../../index.html">FRQNCY</a><span class="sep">/</span><a href="../index.html">Books</a><span class="sep">/</span><span>${esc(book.title)}</span>`;
  const externalLink = book.url ? `<a href="${esc(book.url)}" target="_blank" rel="noopener noreferrer" class="rlink" style="margin-top:1.25rem;display:inline-block">Visit →</a>` : '';

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: book.title,
    description: book.bio,
    url: canonical,
    sameAs: book.url ? [book.url] : undefined,
    isPartOf: SITE_REF,
  };

  return head(book.title, null, book.bio, canonical, ld, null) +
nav(crumb) +
`<div class="hero">
  <div class="hero-eyebrow">Book</div>
  <h1>${esc(book.title)}</h1>
  ${authorHtml}
  ${book.bio ? `<p class="hero-desc">${esc(book.bio)}</p>` : ''}
  ${externalLink}
</div>
<main>
  ${topicsSection}
</main>
${FOOTER}
</body></html>`;
}

// ── ORG PAGE — /orgs/[slug]/ ─────────────────────────────────────
function orgSlug(org) { return (org.id || '').replace(/^o-/, ''); }

function orgPage(org) {
  const slug = orgSlug(org);
  const canonical = `https://frqncy.network/orgs/${slug}/`;

  // Founder attribution — link to person page if p-id, otherwise plain string
  let founderHtml = '';
  if (org.founder_is_person_ref && PEOPLE) {
    const person = PEOPLE.people.find(p => p.id === org.founder);
    if (person) {
      const pslug = personSlug(person);
      founderHtml = `<div style="margin-top:0.75rem;font-size:0.85rem;color:var(--text-dim)">Founded by <a href="/people/${esc(pslug)}/" style="color:var(--accent);border-bottom:1px solid rgba(255,255,255,0.18);text-decoration:none">${esc(person.name)}</a></div>`;
    }
  } else if (typeof org.founder === 'string' && org.founder) {
    founderHtml = `<div style="margin-top:0.75rem;font-size:0.85rem;color:var(--text-dim)">Founded by ${esc(org.founder)}</div>`;
  }

  const topicsSection = appearsOnSection(org.appears_in, org.picked_in);

  const crumb = `<a href="../../index.html">FRQNCY</a><span class="sep">/</span><a href="../index.html">Orgs</a><span class="sep">/</span><span>${esc(org.name)}</span>`;
  const externalLink = org.url ? `<a href="${esc(org.url)}" target="_blank" rel="noopener noreferrer" class="rlink" style="margin-top:1.25rem;display:inline-block">Visit →</a>` : '';

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: org.name,
    description: org.bio,
    url: canonical,
    sameAs: org.url ? [org.url] : undefined,
    isPartOf: SITE_REF,
  };

  return head(org.name, null, org.bio, canonical, ld, null) +
nav(crumb) +
`<div class="hero">
  <div class="hero-eyebrow">Organisation</div>
  <h1>${esc(org.name)}</h1>
  ${founderHtml}
  ${org.bio ? `<p class="hero-desc">${esc(org.bio)}</p>` : ''}
  ${externalLink}
</div>
<main>
  ${topicsSection}
</main>
${FOOTER}
</body></html>`;
}

// ── MEDIA PAGE — /media/[slug]/ ──────────────────────────────────
function mediaSlug(media) { return (media.id || '').replace(/^m-/, ''); }

function mediaPage(media) {
  const slug = mediaSlug(media);
  const canonical = `https://frqncy.network/media/${slug}/`;

  let creatorHtml = '';
  if (media.creator_is_person_ref && PEOPLE) {
    const person = PEOPLE.people.find(p => p.id === media.creator);
    if (person) {
      const pslug = personSlug(person);
      creatorHtml = `<div style="margin-top:0.75rem;font-size:0.85rem;color:var(--text-dim)">By <a href="/people/${esc(pslug)}/" style="color:var(--accent);border-bottom:1px solid rgba(255,255,255,0.18);text-decoration:none">${esc(person.name)}</a></div>`;
    }
  } else if (typeof media.creator === 'string' && media.creator) {
    creatorHtml = `<div style="margin-top:0.75rem;font-size:0.85rem;color:var(--text-dim)">By ${esc(media.creator)}</div>`;
  }

  const topicsSection = appearsOnSection(media.appears_in, media.picked_in);

  const crumb = `<a href="../../index.html">FRQNCY</a><span class="sep">/</span><a href="../index.html">Media</a><span class="sep">/</span><span>${esc(media.name)}</span>`;
  const externalLink = media.url ? `<a href="${esc(media.url)}" target="_blank" rel="noopener noreferrer" class="rlink" style="margin-top:1.25rem;display:inline-block">Visit →</a>` : '';

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: media.name,
    description: media.bio,
    url: canonical,
    sameAs: media.url ? [media.url] : undefined,
    isPartOf: SITE_REF,
  };

  return head(media.name, null, media.bio, canonical, ld, null) +
nav(crumb) +
`<div class="hero">
  <div class="hero-eyebrow">Media</div>
  <h1>${esc(media.name)}</h1>
  ${creatorHtml}
  ${media.bio ? `<p class="hero-desc">${esc(media.bio)}</p>` : ''}
  ${externalLink}
</div>
<main>
  ${topicsSection}
</main>
${FOOTER}
</body></html>`;
}

// ── PLACE PAGE — /places/[slug]/ ─────────────────────────────────
function placeSlug(place) { return (place.id || '').replace(/^pl-/, ''); }

function placePage(place) {
  const slug = placeSlug(place);
  const canonical = `https://frqncy.network/places/${slug}/`;
  const topics = topicsForBucketList(place.appears_in);

  // Teachers in residence — if any p-ids are set, render as person cards
  let teachersSection = '';
  if (place.teachers_in_residence && place.teachers_in_residence.length && PEOPLE) {
    const teachers = place.teachers_in_residence
      .map(pid => PEOPLE.people.find(p => p.id === pid))
      .filter(Boolean);
    if (teachers.length) {
      teachersSection = `<section>
  <div class="section-label">Teachers in residence</div>
  <div class="rlist">${teachers.map(t => rcard(peopleToCard(t, place.id))).join('\n')}</div>
</section>`;
    }
  }

  const appearances = appearancesFor(place.appears_in);
  const topicsSection = appearances.length ? `<section>
  <div class="section-label">Practices hosted here</div>
  <div class="grid grid-sm">
    ${appearances.map(a => `<a href="${esc(a.href)}" class="ncard">
  <div class="ncard-type">${esc(a.eyebrow)}</div>
  <h3>${esc(a.label)}</h3>
  ${a.desc ? `<p>${esc(a.desc.slice(0, 70))}…</p>` : ''}
  <span class="ncard-arrow">→</span>
</a>`).join('\n')}
  </div>
</section>` : '';

  const crumb = `<a href="../../index.html">FRQNCY</a><span class="sep">/</span><a href="../index.html">Places</a><span class="sep">/</span><span>${esc(place.name)}</span>`;
  const externalLink = place.url ? `<a href="${esc(place.url)}" target="_blank" rel="noopener noreferrer" class="rlink" style="margin-top:1.25rem;display:inline-block">Visit →</a>` : '';
  const locationHtml = place.location ? `<div style="margin-top:0.75rem;font-size:0.85rem;color:var(--text-dim)">${esc(place.location)}</div>` : '';

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: place.name,
    description: place.bio,
    url: canonical,
    sameAs: place.url ? [place.url] : undefined,
    address: place.location || undefined,
    isPartOf: SITE_REF,
  };

  return head(place.name, null, place.bio, canonical, ld, null) +
nav(crumb) +
`<div class="hero">
  <div class="hero-eyebrow">Place</div>
  <h1>${esc(place.name)}</h1>
  ${locationHtml}
  ${place.bio ? `<p class="hero-desc">${esc(place.bio)}</p>` : ''}
  ${externalLink}
</div>
<main>
  ${teachersSection}
  ${topicsSection}
</main>
${FOOTER}
</body></html>`;
}

// ── EXPLORE-DATA SYNC ────────────────────────────────────────────
// Keep v2/explore-data.json in sync with content.json + places.json.
// Preserves hand-curated map topology (cross-pillar links, map-specific
// short descs, radius sizes) while adding any new entities automatically.
// Flags ghost entries (in the map but not in content/places) for review.
function syncExploreData() {
  const exploreDataPath = path.join(OUT, 'explore-data.json');
  if (!fs.existsSync(exploreDataPath)) {
    console.warn('  explore-data.json not found — skipping map sync');
    return;
  }
  const data = JSON.parse(fs.readFileSync(exploreDataPath, 'utf8'));
  const existingById = new Map(data.nodes.map(n => [n.id, n]));
  const existingLinks = new Set(data.links.map(([s, t]) => `${s}|${t}`));

  // ── Nodes ──
  // Add any pillar/domain/topic/place missing from the map.
  const additions = [];
  for (const p of DATA.pillars) {
    if (!existingById.has(p.id)) {
      data.nodes.push({ id: p.id, label: p.label, type: 'main', r: 30 });
      additions.push(`+ pillar ${p.id}`);
    }
  }
  for (const d of DATA.domains) {
    if (!existingById.has(d.id)) {
      data.nodes.push({ id: d.id, label: d.label, type: 'cluster', r: 23 });
      additions.push(`+ domain ${d.id}`);
    }
  }
  for (const t of DATA.topics) {
    if (!existingById.has(t.id)) {
      data.nodes.push({ id: t.id, label: t.label, type: 'topic', r: 12 });
      additions.push(`+ topic ${t.id}`);
    }
  }
  if (PLACES) {
    for (const pl of PLACES.places) {
      // Places historically used p- prefix in explore.html; we keep that convention
      // in the map's node id. Our world-model bed uses pl- to avoid collision with people.
      const mapId = pl.id.replace(/^pl-/, 'p-');
      if (!existingById.has(mapId)) {
        const loc = pl.location ? ` — ${pl.location}` : '';
        data.nodes.push({ id: mapId, label: pl.name, type: 'topic', r: 14, desc: pl.bio + (loc ? '' : '') });
        additions.push(`+ place ${mapId}`);
      }
    }
  }

  // ── Links ──
  // Add the primary pillar→domain link from content.json (hand-curated cross-pillar links preserved).
  for (const d of DATA.domains) {
    const key = `${d.pillar}|${d.id}`;
    if (!existingLinks.has(key)) {
      data.links.push([d.pillar, d.id]);
      existingLinks.add(key);
      additions.push(`+ link ${key}`);
    }
  }
  // Add domain→topic for every topic.
  for (const t of DATA.topics) {
    const key = `${t.domain}|${t.id}`;
    if (!existingLinks.has(key)) {
      data.links.push([t.domain, t.id]);
      existingLinks.add(key);
      additions.push(`+ link ${key}`);
    }
  }
  // Add place→topic for every topic a place appears in.
  if (PLACES) {
    for (const pl of PLACES.places) {
      const mapId = pl.id.replace(/^pl-/, 'p-');
      for (const aid of pl.appears_in || []) {
        if (!aid.startsWith('t-')) continue; // skip pillars/domains — topology handled separately
        const key = `${mapId}|${aid}`;
        if (!existingLinks.has(key)) {
          data.links.push([mapId, aid]);
          existingLinks.add(key);
          additions.push(`+ link ${key}`);
        }
      }
    }
  }

  // ── URLs ──
  // Fill in missing node_urls for pillars, domains, topics.
  for (const p of DATA.pillars) {
    if (!data.node_urls[p.id]) data.node_urls[p.id] = `${p.slug}/index.html`;
  }
  for (const d of DATA.domains) {
    if (!data.node_urls[d.id]) data.node_urls[d.id] = `${d.slug}/index.html`;
  }
  for (const t of DATA.topics) {
    if (!data.node_urls[t.id]) data.node_urls[t.id] = `${t.slug}/index.html`;
  }
  if (PLACES) {
    for (const pl of PLACES.places) {
      const mapId = pl.id.replace(/^pl-/, 'p-');
      if (!data.node_urls[mapId]) data.node_urls[mapId] = pl.url;
    }
  }

  // ── Ghost detection (in map but not in content/places) ──
  const validIds = new Set([
    'frqncy',
    ...DATA.pillars.map(p => p.id),
    ...DATA.domains.map(d => d.id),
    ...DATA.topics.map(t => t.id),
    ...(PLACES ? PLACES.places.map(pl => pl.id.replace(/^pl-/, 'p-')) : []),
  ]);
  const ghosts = data.nodes.filter(n => !validIds.has(n.id));

  // Mark sync state
  data.$synced_with_beds = true;
  data.$last_sync = new Date().toISOString().slice(0, 10);
  if (ghosts.length) {
    data.$ghost_nodes = ghosts.map(g => ({ id: g.id, label: g.label, reason: 'In explore map but not in content.json or places.json — review whether to keep or remove.' }));
  } else {
    delete data.$ghost_nodes;
  }

  fs.writeFileSync(exploreDataPath, JSON.stringify(data, null, 2));

  if (additions.length) {
    console.log(`  map: ${additions.length} additions to explore-data.json`);
    for (const a of additions.slice(0, 10)) console.log(`    ${a}`);
    if (additions.length > 10) console.log(`    ...and ${additions.length - 10} more`);
  }
  if (ghosts.length) {
    console.log(`  map: ${ghosts.length} ghost nodes in map but not in beds — see explore-data.json $ghost_nodes`);
  }
}

// ── VOICE LINTER ─────────────────────────────────────────────────
// Scans all bios across the beds plus content.json descs for banished words
// from the FRQNCY voice doc. Non-fatal — reports hits at build time so drift
// becomes visible. Word-boundary matched to reduce false positives (e.g.,
// "vibes" does not trip on "vibration" or "vibrational").
const BANISHED = [
  // Wellness / spiritual clichés
  'wellness', 'self care', 'do the work', 'holistic', 'authentic self',
  'vibes', 'abundance mindset', 'love-n-light', 'high vibe',
  // Tech / startup clichés
  'disrupt', 'disruptive', 'next gen', 'next-gen', 'game changing', 'game-changing',
  'join the revolution', 'join the movement',
  // Additional flagged in prior voice audits
  'signal over noise', 'grindset', 'synergy', 'level up', 'unlock your',
];
// Proper-noun phrases that contain banished words but are legitimate (brand/methodology names).
// If a hit falls inside one of these, it's skipped.
const VOICE_ALLOWLIST = [
  'Holistic Planned Grazing', // Allan Savory's named methodology
];
// Build a single regex with word boundaries.
function esc_re(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
const BANISHED_RE = new RegExp(`\\b(${BANISHED.map(esc_re).join('|')})\\b`, 'gi');

function lintVoice() {
  const hits = [];
  const check = (origin, text) => {
    if (!text || typeof text !== 'string') return;
    // Mask allowlisted phrases so banished words inside them aren't flagged
    let masked = text;
    for (const phrase of VOICE_ALLOWLIST) {
      masked = masked.split(phrase).join('_'.repeat(phrase.length));
    }
    const matches = masked.match(BANISHED_RE);
    if (matches) for (const m of matches) hits.push({ origin, term: m, snippet: text.length > 80 ? text.slice(0, 80) + '…' : text });
  };

  // Beds
  if (PEOPLE) for (const p of PEOPLE.people) check(`people[${p.id}].bio`, p.bio);
  if (BOOKS)  for (const b of BOOKS.books)   check(`books[${b.id}].bio`,  b.bio);
  if (ORGS)   for (const o of ORGS.orgs)     check(`orgs[${o.id}].bio`,   o.bio);
  if (MEDIA)  for (const m of MEDIA.media)   check(`media[${m.id}].bio`,  m.bio);
  if (PLACES) for (const pl of PLACES.places) check(`places[${pl.id}].bio`, pl.bio);

  // content.json descs on topics, domains, pillars, and resources
  for (const t of DATA.topics)  check(`topic[${t.id}].desc`, t.desc);
  for (const d of DATA.domains) check(`domain[${d.id}].desc`, d.desc);
  for (const p of DATA.pillars) check(`pillar[${p.id}].desc`, p.desc);
  for (const [bucketId, items] of Object.entries(DATA.resources)) {
    for (const r of items || []) {
      check(`${bucketId} > ${r.title || '(untitled)'}.desc`, r.desc);
    }
  }

  if (hits.length === 0) {
    console.log('  voice: clean — no banished words across beds or content.json descs');
    return;
  }
  console.log(`  voice: ${hits.length} banished-word hits across the content:`);
  const byTerm = {};
  for (const h of hits) (byTerm[h.term.toLowerCase()] = byTerm[h.term.toLowerCase()] || []).push(h);
  for (const [term, list] of Object.entries(byTerm).sort((a,b)=>b[1].length-a[1].length)) {
    console.log(`    "${term}" × ${list.length}`);
    for (const h of list.slice(0, 3)) console.log(`      ${h.origin} — "${h.snippet}"`);
    if (list.length > 3) console.log(`      ...and ${list.length - 3} more`);
  }
}

// ── RUN ──────────────────────────────────────────────────────────
mkdirp(OUT);
syncExploreData();
lintVoice();
let count = 0;

for (const p of DATA.pillars) {
  mkdirp(path.join(OUT, p.slug));
  fs.writeFileSync(path.join(OUT, p.slug, 'index.html'), pillarPage(p));
  count++;
}
for (const d of DATA.domains) {
  mkdirp(path.join(OUT, d.slug));
  fs.writeFileSync(path.join(OUT, d.slug, 'index.html'), domainPage(d));
  count++;
}
for (const t of DATA.topics) {
  mkdirp(path.join(OUT, t.slug));
  fs.writeFileSync(path.join(OUT, t.slug, 'index.html'), topicPage(t));
  count++;
}

// ── Helper: entity index page builder (one alphabetical grid of cards) ──
function entityIndexPage({ label, eyebrow, entities, slugFn, canonicalPath, intro }) {
  // Enrich each entity with appearance count + pick status for card display.
  // Counts every appears_in entry (topics, domains, pillars) — reflects total
  // visibility of the entity across the network.
  const enriched = entities.map(e => {
    const appCount = (e.appears_in || []).length;
    const picked = (e.picked_in || []).length > 0;
    return { e, appCount, picked };
  });
  // Sort: picks first, then alphabetical.
  enriched.sort((a, b) => {
    if (a.picked !== b.picked) return a.picked ? -1 : 1;
    const an = (a.e.name || a.e.title || '').toLowerCase();
    const bn = (b.e.name || b.e.title || '').toLowerCase();
    return an.localeCompare(bn);
  });

  const pickCount = enriched.filter(x => x.picked).length;

  const cards = enriched.map(({ e, appCount, picked }) => {
    const slug = slugFn(e);
    const display = e.name || e.title;
    const desc = e.bio || '';
    const snippet = desc.slice(0, 90);
    const meta = [];
    meta.push(eyebrow);
    if (appCount) meta.push(`${appCount} appearance${appCount === 1 ? '' : 's'}`);
    const pickBadge = picked ? ' <span style="color:var(--gold);font-size:0.54rem;letter-spacing:0.15em;border:1px solid rgba(196,151,58,0.5);padding:1px 5px;border-radius:2px;margin-left:0.35rem;vertical-align:middle">✦ PICK</span>' : '';
    return `<a href="./${slug}/index.html" class="ncard">
  <div class="ncard-type">${esc(meta.join(' · '))}</div>
  <h3>${esc(display)}${pickBadge}</h3>
  ${snippet ? `<p>${esc(snippet)}${desc.length > 90 ? '…' : ''}</p>` : ''}
  <span class="ncard-arrow">→</span>
</a>`;
  }).join('\n');

  const canonical = `https://frqncy.network${canonicalPath}`;
  const defaultIntro = `${entities.length} ${label.toLowerCase()} on the FRQNCY network — ${pickCount} ✦ picks first.`;
  const heroDesc = intro || defaultIntro;
  const metaDesc = `${entities.length} ${label.toLowerCase()} curated on the FRQNCY network.`;

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${label} — FRQNCY Network`,
    description: metaDesc,
    url: canonical,
    isPartOf: SITE_REF,
  };

  return head(label, null, metaDesc, canonical, ld, null) +
nav(`<a href="../index.html">FRQNCY</a><span class="sep">/</span><span>${esc(label)}</span>`) +
`<div class="hero">
  <div class="hero-eyebrow">Network</div>
  <h1>${esc(label)}</h1>
  <p class="hero-desc">${esc(heroDesc)}</p>
</div>
<main>
  <section>
    <div class="grid grid-sm">${cards}</div>
  </section>
</main>
${FOOTER}
</body></html>`;
}

// ── PERSON PAGES — /people/[slug]/ + /people/index.html ──────────
const PEOPLE_OUT = path.join(ROOT, 'people');
let personCount = 0;
if (PEOPLE) {
  mkdirp(PEOPLE_OUT);
  // Individual person pages
  for (const p of PEOPLE.people) {
    const slug = personSlug(p);
    if (!slug) continue;
    mkdirp(path.join(PEOPLE_OUT, slug));
    fs.writeFileSync(path.join(PEOPLE_OUT, slug, 'index.html'), personPage(p));
    personCount++;
  }
  fs.writeFileSync(path.join(PEOPLE_OUT, 'index.html'),
    entityIndexPage({
      label: 'People',
      eyebrow: 'Person',
      entities: PEOPLE.people,
      slugFn: personSlug,
      canonicalPath: '/people/',
      intro: `The humans FRQNCY points to — ${PEOPLE.people.length} teachers, founders, creators, and thinkers. Picks first.`,
    }));
  console.log(`  people: ${personCount} profiles + 1 index → ./people/`);
}

// ── BOOK PAGES — /books/[slug]/ + /books/index.html ──────────────
const BOOKS_OUT = path.join(ROOT, 'books');
let bookCount = 0;
if (BOOKS) {
  mkdirp(BOOKS_OUT);
  for (const b of BOOKS.books) {
    const slug = bookSlug(b);
    if (!slug) continue;
    mkdirp(path.join(BOOKS_OUT, slug));
    fs.writeFileSync(path.join(BOOKS_OUT, slug, 'index.html'), bookPage(b));
    bookCount++;
  }
  fs.writeFileSync(path.join(BOOKS_OUT, 'index.html'),
    entityIndexPage({ label: 'Books', eyebrow: 'Book', entities: BOOKS.books, slugFn: bookSlug, canonicalPath: '/books/', outPath: BOOKS_OUT }));
  console.log(`  books:  ${bookCount} profiles + 1 index → ./books/`);
}

// ── ORG PAGES — /orgs/[slug]/ + /orgs/index.html ─────────────────
const ORGS_OUT = path.join(ROOT, 'orgs');
let orgCount = 0;
if (ORGS) {
  mkdirp(ORGS_OUT);
  for (const o of ORGS.orgs) {
    const slug = orgSlug(o);
    if (!slug) continue;
    mkdirp(path.join(ORGS_OUT, slug));
    fs.writeFileSync(path.join(ORGS_OUT, slug, 'index.html'), orgPage(o));
    orgCount++;
  }
  fs.writeFileSync(path.join(ORGS_OUT, 'index.html'),
    entityIndexPage({ label: 'Orgs', eyebrow: 'Org', entities: ORGS.orgs, slugFn: orgSlug, canonicalPath: '/orgs/', outPath: ORGS_OUT }));
  console.log(`  orgs:   ${orgCount} profiles + 1 index → ./orgs/`);
}

// ── MEDIA PAGES — /media/[slug]/ + /media/index.html ─────────────
const MEDIA_OUT = path.join(ROOT, 'media');
let mediaCount = 0;
if (MEDIA) {
  mkdirp(MEDIA_OUT);
  for (const m of MEDIA.media) {
    const slug = mediaSlug(m);
    if (!slug) continue;
    mkdirp(path.join(MEDIA_OUT, slug));
    fs.writeFileSync(path.join(MEDIA_OUT, slug, 'index.html'), mediaPage(m));
    mediaCount++;
  }
  fs.writeFileSync(path.join(MEDIA_OUT, 'index.html'),
    entityIndexPage({ label: 'Media', eyebrow: 'Media', entities: MEDIA.media, slugFn: mediaSlug, canonicalPath: '/media/', outPath: MEDIA_OUT }));
  console.log(`  media:  ${mediaCount} profiles + 1 index → ./media/`);
}

// ── PLACE PAGES — /places/[slug]/ + /places/index.html ───────────
const PLACES_OUT = path.join(ROOT, 'places');
let placeCount = 0;
if (PLACES) {
  mkdirp(PLACES_OUT);
  for (const pl of PLACES.places) {
    const slug = placeSlug(pl);
    if (!slug) continue;
    mkdirp(path.join(PLACES_OUT, slug));
    fs.writeFileSync(path.join(PLACES_OUT, slug, 'index.html'), placePage(pl));
    placeCount++;
  }
  fs.writeFileSync(path.join(PLACES_OUT, 'index.html'),
    entityIndexPage({ label: 'Places', eyebrow: 'Place', entities: PLACES.places, slugFn: placeSlug, canonicalPath: '/places/', outPath: PLACES_OUT }));
  console.log(`  places: ${placeCount} profiles + 1 index → ./places/`);
}

// ── SITEMAP ──────────────────────────────────────────────────────
const today = new Date().toISOString().slice(0, 10);

const sitemapEntries = [
  { loc: 'https://frqncy.network/',                   priority: '1.0', freq: 'weekly'  },
  { loc: 'https://frqncy.network/about.html',         priority: '0.9', freq: 'monthly' },
  { loc: 'https://frqncy.network/start-here.html',    priority: '0.9', freq: 'monthly' },
  { loc: 'https://frqncy.network/platform.html',      priority: '0.8', freq: 'monthly' },
  { loc: 'https://frqncy.network/podcast.html',       priority: '0.7', freq: 'weekly'  },
  { loc: 'https://frqncy.network/space.html',         priority: '0.7', freq: 'monthly' },
  { loc: 'https://frqncy.network/search.html',         priority: '0.8', freq: 'weekly'  },
  { loc: 'https://frqncy.network/v2/explore.html',    priority: '0.9', freq: 'weekly'  },
  ...DATA.pillars.map(p => ({ loc: `https://frqncy.network/v2/${p.slug}/`, priority: '0.8', freq: 'weekly'  })),
  ...DATA.domains.map(d => ({ loc: `https://frqncy.network/v2/${d.slug}/`, priority: '0.7', freq: 'weekly'  })),
  ...DATA.topics.map(t  => ({ loc: `https://frqncy.network/v2/${t.slug}/`, priority: '0.6', freq: 'monthly' })),
  ...(PEOPLE ? [{ loc: 'https://frqncy.network/people/', priority: '0.7', freq: 'weekly' }] : []),
  ...(PEOPLE ? PEOPLE.people.map(p => ({ loc: `https://frqncy.network/people/${personSlug(p)}/`, priority: '0.5', freq: 'monthly' })) : []),
  ...(BOOKS  ? [{ loc: 'https://frqncy.network/books/',  priority: '0.7', freq: 'weekly' }]  : []),
  ...(BOOKS  ? BOOKS.books.map(b => ({ loc: `https://frqncy.network/books/${bookSlug(b)}/`, priority: '0.5', freq: 'monthly' })) : []),
  ...(ORGS   ? [{ loc: 'https://frqncy.network/orgs/',   priority: '0.7', freq: 'weekly' }]  : []),
  ...(ORGS   ? ORGS.orgs.map(o => ({ loc: `https://frqncy.network/orgs/${orgSlug(o)}/`, priority: '0.5', freq: 'monthly' })) : []),
  ...(MEDIA  ? [{ loc: 'https://frqncy.network/media/',  priority: '0.7', freq: 'weekly' }]  : []),
  ...(MEDIA  ? MEDIA.media.map(m => ({ loc: `https://frqncy.network/media/${mediaSlug(m)}/`, priority: '0.5', freq: 'monthly' })) : []),
  ...(PLACES ? [{ loc: 'https://frqncy.network/places/', priority: '0.7', freq: 'weekly' }] : []),
  ...(PLACES ? PLACES.places.map(pl => ({ loc: `https://frqncy.network/places/${placeSlug(pl)}/`, priority: '0.5', freq: 'monthly' })) : []),
];

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.freq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`, 'utf8');

// ── SEARCH INDEX ─────────────────────────────────────────────────
const searchIndex = DATA.topics.map(t => {
  const domain = domainMap.get(t.domain);
  const pillar = pillarMap.get(domain.pillar);
  const res    = resourcesFor(t.id);
  return {
    id:            t.id,
    label:         t.label,
    slug:          t.slug,
    desc:          t.desc || '',
    domain:        domain.label,
    domainLabel:   domain.label,
    domainSlug:    domain.slug,
    pillar:        pillar.label,
    pillarLabel:   pillar.label,
    pillarSlug:    pillar.slug,
    accent:        domain.accent,
    picks:         res.filter(r => r.frqncy_pick).map(r => r.title).slice(0, 5),
    resourceCount: res.length,
    url:           `/v2/${t.slug}/`,
  };
});

fs.writeFileSync(path.join(ROOT, 'search.json'), JSON.stringify(searchIndex), 'utf8');

// ── ENTITIES INDEX (search across the beds) ─────────────────────
// Unified slim index of every first-class entity — people, books, orgs,
// media, places. Consumed by search.html for real search across the world
// model. Small enough to ship as one JSON fetched on page load.
const entitiesIndex = [];
if (PEOPLE) for (const p of PEOPLE.people) {
  entitiesIndex.push({
    type: 'person',
    id: p.id,
    name: p.name,
    desc: (p.bio || '').slice(0, 200),
    url: `/people/${personSlug(p)}/`,
    external: p.url || '',
    topics: (p.appears_in || []).filter(x => x.startsWith('t-')),
    pick: (p.picked_in || []).length > 0,
  });
}
if (BOOKS) for (const b of BOOKS.books) {
  // Resolve author name for searchability (query "huberman" should find his book)
  let authorName = '';
  if (b.author_is_person_ref && PEOPLE) {
    const person = PEOPLE.people.find(pp => pp.id === b.author);
    authorName = person ? person.name : '';
  } else if (typeof b.author === 'string') {
    authorName = b.author;
  }
  entitiesIndex.push({
    type: 'book',
    id: b.id,
    name: b.title,
    author: authorName,
    desc: (b.bio || '').slice(0, 200),
    url: `/books/${bookSlug(b)}/`,
    external: b.url || '',
    topics: (b.appears_in || []).filter(x => x.startsWith('t-')),
    pick: (b.picked_in || []).length > 0,
  });
}
if (ORGS) for (const o of ORGS.orgs) {
  entitiesIndex.push({
    type: 'org',
    id: o.id,
    name: o.name,
    desc: (o.bio || '').slice(0, 200),
    url: `/orgs/${orgSlug(o)}/`,
    external: o.url || '',
    topics: (o.appears_in || []).filter(x => x.startsWith('t-')),
    pick: (o.picked_in || []).length > 0,
  });
}
if (MEDIA) for (const m of MEDIA.media) {
  entitiesIndex.push({
    type: 'media',
    id: m.id,
    name: m.name,
    desc: (m.bio || '').slice(0, 200),
    url: `/media/${mediaSlug(m)}/`,
    external: m.url || '',
    topics: (m.appears_in || []).filter(x => x.startsWith('t-')),
    pick: (m.picked_in || []).length > 0,
  });
}
if (PLACES) for (const pl of PLACES.places) {
  entitiesIndex.push({
    type: 'place',
    id: pl.id,
    name: pl.name,
    location: pl.location || '',
    desc: (pl.bio || '').slice(0, 200),
    url: `/places/${placeSlug(pl)}/`,
    external: pl.url || '',
    topics: (pl.appears_in || []).filter(x => x.startsWith('t-')),
    pick: (pl.picked_in || []).length > 0,
  });
}
fs.writeFileSync(path.join(ROOT, 'entities.json'), JSON.stringify(entitiesIndex), 'utf8');

// ── RESOURCES INDEX (regenerated from beds + non-bed types) ────
// search.html and my-frqncy.html currently consume resources.json — a flat
// list of resources pinned to a specific topic. Regenerating from the beds
// keeps it authoritative and in sync with content.json.
const resourcesIndex = [];
const topicById = new Map(DATA.topics.map(t => [t.id, t]));
const domainByTopic = (t) => domainMap.get(t.domain);

function emitResource(entity, typeLabel, topicId, overrides = {}) {
  const t = topicById.get(topicId);
  if (!t) return; // only emit for topic-level appearances
  const dom = domainByTopic(t);
  resourcesIndex.push({
    type: typeLabel,
    name: entity.name || entity.title,
    desc: entity.bio || entity.desc || '',
    url: entity.url || '',
    topicSlug: t.slug,
    topicLabel: t.label,
    topicUrl: `/v2/${t.slug}/`,
    domain: dom ? dom.label : '',
    domainSlug: dom ? dom.slug : '',
    ...overrides,
  });
}

if (PEOPLE) for (const p of PEOPLE.people) {
  const internalUrl = `/people/${personSlug(p)}/`;
  for (const tid of (p.appears_in || [])) emitResource(p, 'person', tid, { url: internalUrl, external: p.url || '' });
}
if (BOOKS) for (const b of BOOKS.books) {
  let authorName = '';
  if (b.author_is_person_ref && PEOPLE) {
    const person = PEOPLE.people.find(pp => pp.id === b.author);
    authorName = person ? person.name : '';
  } else if (typeof b.author === 'string') {
    authorName = b.author;
  }
  const displayName = authorName ? `${b.title} — ${authorName}` : b.title;
  const internalUrl = `/books/${bookSlug(b)}/`;
  for (const tid of (b.appears_in || [])) emitResource({ ...b, name: displayName }, 'book', tid, { url: internalUrl, external: b.url || '' });
}
if (ORGS) for (const o of ORGS.orgs) {
  const internalUrl = `/orgs/${orgSlug(o)}/`;
  for (const tid of (o.appears_in || [])) emitResource(o, 'org', tid, { url: internalUrl, external: o.url || '' });
}
if (MEDIA) for (const m of MEDIA.media) {
  const internalUrl = `/media/${mediaSlug(m)}/`;
  for (const tid of (m.appears_in || [])) emitResource(m, 'media', tid, { url: internalUrl, external: m.url || '' });
}
if (PLACES) for (const pl of PLACES.places) {
  const internalUrl = `/places/${placeSlug(pl)}/`;
  for (const tid of (pl.appears_in || [])) emitResource(pl, 'place', tid, { url: internalUrl, external: pl.url || '' });
}
// Non-bed types (tools, courses, platforms, apps, websites, references, articles)
// from content.json's original topic resource arrays
const leftoverTypes = new Set(['tool', 'course', 'platform', 'app', 'website', 'reference', 'article']);
for (const [bucketId, items] of Object.entries(DATA.resources)) {
  if (!bucketId.startsWith('t-')) continue; // topic-level only
  for (const r of items || []) {
    if (!leftoverTypes.has(r.type)) continue;
    emitResource({ name: r.title, desc: r.desc, url: r.url }, r.type, bucketId);
  }
}
fs.writeFileSync(path.join(ROOT, 'resources.json'), JSON.stringify(resourcesIndex), 'utf8');

console.log(`\n✓ FRQNCY Network v2 generated`);
console.log(`  Pillars : ${DATA.pillars.length}`);
console.log(`  Domains : ${DATA.domains.length}`);
console.log(`  Topics  : ${DATA.topics.length}`);
console.log(`  Total   : ${count} pages → ./v2/`);
console.log(`  People  : ${personCount} profiles → ./people/`);
console.log(`  Books   : ${bookCount} profiles → ./books/`);
console.log(`  Orgs    : ${orgCount} profiles → ./orgs/`);
console.log(`  Media   : ${mediaCount} profiles → ./media/`);
console.log(`  Places  : ${placeCount} profiles → ./places/`);
console.log(`  Sitemap : ${sitemapEntries.length} URLs → sitemap.xml`);
console.log(`  Search  : ${searchIndex.length} topics → search.json`);
console.log(`  Entities: ${entitiesIndex.length} entities → entities.json`);
console.log(`  Resources: ${resourcesIndex.length} rows → resources.json (regenerated from beds)\n`);
