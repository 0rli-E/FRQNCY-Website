#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────
// FRQNCY Network v2 — Static Site Generator
// Run: node generate.js
// Output: ./v2/  (150 HTML pages), sitemap.xml, search.json
// ─────────────────────────────────────────────────────────────────

const fs   = require('fs');
const path = require('path');

const ROOT = __dirname;
const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, 'content.json'), 'utf8'));
const OUT  = path.join(ROOT, 'v2');

// ── Pre-indexed lookup maps ───────────────────────────────────────
const pillarMap       = new Map(DATA.pillars.map(p => [p.id, p]));
const domainMap       = new Map(DATA.domains.map(d => [d.id, d]));
const domainsByPillar = new Map(DATA.pillars.map(p => [p.id, []]));
const topicsByDomain  = new Map(DATA.domains.map(d => [d.id, []]));

for (const d of DATA.domains) domainsByPillar.get(d.pillar)?.push(d);
for (const t of DATA.topics)  topicsByDomain.get(t.domain)?.push(t);

function resourcesFor(nid) { return DATA.resources[nid] || []; }
function mkdirp(dir)       { fs.mkdirSync(dir, { recursive: true }); }

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
  <a href="../../index.html" class="snav-back">← Main Site</a>
</nav>`;
}

const FOOTER = `<footer>
  <div class="footer-inner">
    <span class="footer-logo">FRQNCY</span>
    <div class="footer-links">
      <a href="../explore.html">Explore the network</a>
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

  return head(t.label, domain.accent, t.desc, canonical, ld, t.slug) +
nav(crumb) +
`<div class="hero">
  <div class="hero-eyebrow">${domain.label} &nbsp;·&nbsp; Topic</div>
  <h1>${t.label}</h1>
  ${t.desc ? `<p class="hero-desc">${t.desc}</p>` : ''}
</div>
<main>
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
