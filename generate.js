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

function resourcesFor(nid) { return DATA.resources[nid] || []; }
function videosFor(nid)    { return (VIDEOS[nid] || []).filter(v => { const id = videoId(v); return id && !id.startsWith('PLACEHOLDER'); }); }
function mkdirp(dir)       { fs.mkdirSync(dir, { recursive: true }); }
function esc(s)            { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }

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
@import url('https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Jost:wght@300;400;500&display=swap');
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
  return `<nav class="snav">
  <div class="snav-left">
    <a href="../explore.html" class="snav-logo">FRQNCY<span class="snav-badge">NETWORK</span></a>
    ${crumbHtml ? `<div class="breadcrumb">${crumbHtml}</div>` : ''}
  </div>
  <div style="display:flex;align-items:center;gap:0.75rem;flex-shrink:0">
    <a href="../watch/index.html" class="snav-back" style="border:none;padding:0;font-size:0.64rem;letter-spacing:0.12em">Watch</a>
    <a href="../courses/index.html" class="snav-back" style="border:none;padding:0;font-size:0.64rem;letter-spacing:0.12em">Courses</a>
    <a href="../../index.html" class="snav-back">← Main Site</a>
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
    ? `<a href="${r.url}" target="_blank" rel="noopener noreferrer" class="rlink">Visit →</a>`
    : '';
  return `<div class="rcard" data-type="${r.type}">
  <span class="rtype">${r.type}</span>
  <div class="rinfo">
    <h4>${r.title}${r.frqncy_pick ? ' <span class="fpick">✦ FRQNCY PICK</span>' : ''}</h4>
    ${r.desc ? `<p>${r.desc}</p>` : ''}
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
  const glow     = hexToRgba(accent, 0.14);
  const metaDesc = (desc || `Explore ${title} — curated resources, FRQNCY Picks, and the best thinkers in this space. Part of the FRQNCY conscious living network.`).slice(0, 155);
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
<title>${title} — FRQNCY Network</title>
<meta name="description" content="${metaDesc}">
<meta name="theme-color" content="#0B1C3D">
<meta property="og:type" content="website">
<meta property="og:title" content="${title} — FRQNCY Network">
<meta property="og:description" content="${metaDesc}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ogImage}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:site_name" content="FRQNCY">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title} — FRQNCY Network">
<meta name="twitter:description" content="${metaDesc}">
<meta name="twitter:image" content="${ogImage}">
<link rel="icon" type="image/svg+xml" href="../../favicon.svg">
<link rel="manifest" href="../../manifest.json">
<link rel="canonical" href="${url}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<style>
:root{--accent:${accent};--accent-glow:${glow}}
${CSS}
</style>
<script defer data-domain="frqncy.network" src="https://plausible.io/js/script.js"></script>
<script src="../../chat-widget.js" defer></script>
${ldTag}
</head>
<body>`;
}

// ── PILLAR PAGE ──────────────────────────────────────────────────
function pillarPage(p) {
  const domains = domainsByPillar.get(p.id) || [];
  const dcards  = domains.map(d => `<a href="../${d.slug}/index.html" class="ncard">
  <div class="ncard-type">Domain</div>
  <h3>${d.label}</h3>
  <p>${d.desc || ''}</p>
  <span class="ncard-arrow">→</span>
</a>`).join('\n');

  const canonical = `https://frqncy.network/v2/${p.slug}/`;

  return head(p.label, p.accent, p.desc, canonical, collectionLd(p.label, p.desc, canonical), p.slug) +
nav('') +
`<div class="hero">
  <div class="hero-eyebrow">Pillar</div>
  <h1>${p.label}</h1>
  <p class="hero-desc">${p.desc}</p>
</div>
<main>
  <section>
    <div class="section-label">Domains within ${p.label}</div>
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
  <h3>${t.label}</h3>
  ${t.desc ? `<p>${t.desc.slice(0, 85)}…</p>` : ''}
  <span class="ncard-arrow">→</span>
</a>`).join('\n');

  const crumb    = `<a href="../${pillar.slug}/index.html">${pillar.label}</a><span class="sep">/</span><span>${d.label}</span>`;
  const canonical = `https://frqncy.network/v2/${d.slug}/`;

  return head(d.label, d.accent, d.desc, canonical, collectionLd(d.label, d.desc, canonical), d.slug) +
nav(crumb) +
`<div class="hero">
  <div class="hero-eyebrow">${pillar.label} &nbsp;·&nbsp; Domain</div>
  <h1>${d.label}</h1>
  ${d.desc ? `<p class="hero-desc">${d.desc}</p>` : ''}
</div>
<main>
  ${resourceSection(d.id, `FRQNCY Picks — ${d.label}`)}
  <section>
    <div class="section-label">Explore topics in ${d.label}</div>
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
  const related = (topicsByDomain.get(t.domain) || []).filter(r => r.id !== t.id).slice(0, 6);
  const relatedCards = related.length ? `<section>
    <div class="section-label">More in ${domain.label}</div>
    <div class="grid grid-sm">
      ${related.map(r => `<a href="../${r.slug}/index.html" class="ncard">
  <div class="ncard-type">Topic</div>
  <h3>${r.label}</h3>
  ${r.desc ? `<p>${r.desc.slice(0, 70)}…</p>` : ''}
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

  const crumb = `<a href="../${pillar.slug}/index.html">${pillar.label}</a><span class="sep">/</span><a href="../${domain.slug}/index.html">${domain.label}</a><span class="sep">/</span><span>${t.label}</span>`;

  const vidSection    = videoSection(t.id);
  const courseCallout = courseSection(t.id);

  return head(t.label, domain.accent, t.desc, canonical, ld, t.slug) +
nav(crumb) +
`<div class="hero">
  <div class="hero-eyebrow">${domain.label} &nbsp;·&nbsp; Topic</div>
  <h1>${t.label}</h1>
  ${t.desc ? `<p class="hero-desc">${t.desc}</p>` : ''}
</div>
<main>
  ${vidSection}
  ${courseCallout}
  ${resourceSection(t.id, 'Curated Resources', res)}
  ${relatedCards}
</main>
${FOOTER}
</body></html>`;
}

// ── RUN ──────────────────────────────────────────────────────────
mkdirp(OUT);
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

// ── SITEMAP ──────────────────────────────────────────────────────
const today = new Date().toISOString().slice(0, 10);

const sitemapEntries = [
  { loc: 'https://frqncy.network/',                   priority: '1.0', freq: 'weekly'  },
  { loc: 'https://frqncy.network/about.html',         priority: '0.9', freq: 'monthly' },
  { loc: 'https://frqncy.network/start-here.html',    priority: '0.9', freq: 'monthly' },
  { loc: 'https://frqncy.network/platform.html',      priority: '0.8', freq: 'monthly' },
  { loc: 'https://frqncy.network/podcast.html',       priority: '0.7', freq: 'weekly'  },
  { loc: 'https://frqncy.network/space.html',         priority: '0.7', freq: 'monthly' },
  { loc: 'https://frqncy.network/v2/explore.html',    priority: '0.9', freq: 'weekly'  },
  ...DATA.pillars.map(p => ({ loc: `https://frqncy.network/v2/${p.slug}/`, priority: '0.8', freq: 'weekly'  })),
  ...DATA.domains.map(d => ({ loc: `https://frqncy.network/v2/${d.slug}/`, priority: '0.7', freq: 'weekly'  })),
  ...DATA.topics.map(t  => ({ loc: `https://frqncy.network/v2/${t.slug}/`, priority: '0.6', freq: 'monthly' })),
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
    domainSlug:    domain.slug,
    pillar:        pillar.label,
    pillarSlug:    pillar.slug,
    accent:        domain.accent,
    picks:         res.filter(r => r.frqncy_pick).map(r => r.title).slice(0, 5),
    resourceCount: res.length,
    url:           `/v2/${t.slug}/`,
  };
});

fs.writeFileSync(path.join(ROOT, 'search.json'), JSON.stringify(searchIndex), 'utf8');

console.log(`\n✓ FRQNCY Network v2 generated`);
console.log(`  Pillars : ${DATA.pillars.length}`);
console.log(`  Domains : ${DATA.domains.length}`);
console.log(`  Topics  : ${DATA.topics.length}`);
console.log(`  Total   : ${count} pages → ./v2/`);
console.log(`  Sitemap : ${sitemapEntries.length} URLs → sitemap.xml`);
console.log(`  Search  : ${searchIndex.length} topics → search.json\n`);
