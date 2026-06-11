#!/usr/bin/env node
// build-aligned-shelves.mjs
// ----------------------------------------------------------------------------
// Regenerates the per-shelf Aligned Goods landing pages at /aligned/<shelf>/.
//
// WHY THIS EXISTS
//   The /aligned/ main page renders client-side from aligned-goods.json, but the
//   17 per-shelf deep pages are STATIC HTML with the data inlined at build time.
//   Edit aligned-goods.json without regenerating and the deep pages silently go
//   stale. This script is the single source of truth for that regeneration.
//
// SOURCES OF TRUTH (read, never duplicated here)
//   • aligned-goods.json   — every entry
//   • aligned/index.html   — the CATEGORIES array (shelf id/name/desc/order) AND
//                            the shared <head> tail + global-header chrome, both
//                            sliced verbatim from a reference shelf page so the
//                            deep pages always match the live chrome.
//
// USAGE
//   node scripts/build-aligned-shelves.mjs            # write pages
//   node scripts/build-aligned-shelves.mjs --check    # dry-run, diff-only, exit 1 on drift
//
// AFTER RUNNING
//   • bump sw.js VERSION (these pages are precached)
//   • run `node scripts/sync-headers.mjs` to keep the global header canonical
//   • commit aligned-goods.json + the regenerated pages together
// ----------------------------------------------------------------------------

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Repo path contains a literal space — fileURLToPath, never .pathname.
const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CHECK = process.argv.includes('--check');

const GOODS = JSON.parse(readFileSync(join(ROOT, 'aligned-goods.json'), 'utf8'));
const INDEX_HTML = readFileSync(join(ROOT, 'aligned', 'index.html'), 'utf8');

// ── CATEGORIES: parsed straight out of aligned/index.html so shelf order, names,
//    and taglines never drift from the live page. The array is our own trusted
//    source file, so eval is acceptable in this build context.
const catMatch = INDEX_HTML.match(/const CATEGORIES = (\[[\s\S]*?\]);/);
if (!catMatch) throw new Error('Could not find CATEGORIES array in aligned/index.html');
// eslint-disable-next-line no-eval
const CATEGORIES = eval(catMatch[1]);

// ── Constant chrome, sliced verbatim from a reference shelf page that already
//    carries the canonical header. We use a committed deep page as the donor.
//    HEAD_TAIL = everything in <head> from the favicon link through </head>
//    (fonts, css, js, the shared <style> block).
//    CHROME    = <body> through the global-header end marker.
function sliceChrome() {
  const ref = readFileSync(join(ROOT, 'aligned', 'library', 'index.html'), 'utf8');
  const headTailStart = ref.indexOf('<link rel="icon"');
  const headTailEnd = ref.indexOf('</head>') + '</head>'.length;
  const HEAD_TAIL = ref.slice(headTailStart, headTailEnd);

  const chromeStart = ref.indexOf('<body>');
  const marker = '<!-- ▲▲ FRQNCY_GLOBAL_HEADER ▲▲ -->';
  const chromeEnd = ref.indexOf(marker) + marker.length;
  const CHROME = ref.slice(chromeStart, chromeEnd);

  return { HEAD_TAIL, CHROME };
}

const { HEAD_TAIL, CHROME } = sliceChrome();

// ── Helpers ──────────────────────────────────────────────────────────────────
const esc = (s) => String(s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#x27;');

// Per-shelf criteria display. The deep pages show the FULL criteria set (the
// main index whitelists only six). Labels come from this map, reconstructed
// 1:1 from the committed pages so regeneration is a no-op on existing entries.
// Note the deliberate inconsistency that was already shipped: most kebab keys
// render hyphen-as-space ("whole-food" → "Whole food"), but 'family-owned' and
// 'mission-aligned' keep their hyphen, and 'frqncy-flagship' carries the brand
// caps. Preserved verbatim. New criteria not in the map fall back to
// hyphen-as-space + first-letter-cap.
const CRIT_LABEL = {
  'accessible': 'Accessible',
  'ancient-lineage': 'Ancient lineage',
  'biodegradable': 'Biodegradable',
  'certified-organic': 'Certified organic',
  'clean': 'Clean',
  'durable': 'Durable',
  'fair-trade': 'Fair trade',
  'family-owned': 'Family-owned',
  'frqncy-flagship': 'FRQNCY flagship',
  'independent': 'Independent',
  'low-impact': 'Low impact',
  'mission-aligned': 'Mission-aligned',
  'modern-validation': 'Modern validation',
  'no-synthetics': 'No synthetics',
  'traceable': 'Traceable',
  'used': 'Used',
  'verifiable': 'Verifiable',
  'whole-food': 'Whole food',
};
const critLabel = (c) => {
  if (CRIT_LABEL[c]) return CRIT_LABEL[c];
  const s = String(c).replace(/-/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const REL_BADGES = {
  contributor: { label: '✦ contributes to FRQNCY', cls: 'rel-contributor' },
  partner:     { label: '⌬ co-marketing partner',  cls: 'rel-partner'     },
  affiliate:   { label: '⇄ commission link',        cls: 'rel-affiliate'   },
};

function itemsFor(catId) {
  const tr = { pick: 0, aligned: 1, referenced: 2 };
  return GOODS.filter((g) => g.category === catId)
    .sort((a, b) => (tr[a.tier] ?? 9) - (tr[b.tier] ?? 9) || a.name.localeCompare(b.name));
}

function vendorHtml(v) {
  const tags = [];
  if (v.free) tags.push('<span class="vendor-tag">Free</span>');
  if (v.affiliate) tags.push('<span class="vendor-tag aff">Aff</span>');
  return `<a class="vendor" href="${v.url}" target="_blank" rel="noopener noreferrer"><span class="vendor-name"><span>${esc(v.name)}</span>${tags.join('')}</span><span class="vendor-arrow">↗</span></a>`;
}

function cardHtml(g) {
  const isPick = g.tier === 'pick';
  const tierClass = isPick ? 'pick' : 'aligned';
  const tierSpan = isPick ? `<span class='gcard-tier'>★ Editor's choice</span>` : '';
  const head = `<div class="gcard-head"><div style="flex:1;min-width:0;"><h3>${esc(g.name)}</h3></div>${tierSpan}</div>`;

  const crits = (g.criteria || []).map(critLabel);
  const critLine = crits.length ? `<div class="gcard-crit-line">${crits.join(' · ')}</div>` : '';

  const vendors = (g.vendor || []).map(vendorHtml).join('');
  const vendorsBlock = vendors ? `<div class="gcard-vendors">${vendors}</div>` : '';

  const rel = REL_BADGES[g.revenue_relationship];
  const relRow = rel ? `<div class="gcard-rel-row"><span class="gcard-rel ${rel.cls}">${rel.label}</span></div>` : '';

  // Buy button — only for goods FRQNCY resells on-site (entry.sell.enabled).
  // Behaviour lives in /aligned/buy.js; price is re-derived server-side.
  const sell = g.sell;
  const buyBlock = (sell && sell.enabled && Number.isInteger(sell.price))
    ? `<div class="gcard-buy-row"><button class="gcard-buy" data-buy-good="${esc(g.id)}" data-qty="1">Buy · <span class="price">$${(sell.price / 100).toFixed(2)}</span></button><span class="gcard-buy-note">Sold &amp; shipped by FRQNCY</span></div>`
    : '';

  return `<article class="gcard tier-${tierClass}">
      ${head}
      <p class="gcard-desc">${esc(g.desc)}</p>
      ${critLine}
      ${vendorsBlock}
      ${buyBlock}
      ${relRow}
    </article>`;
}

function relatedHtml(catId) {
  const chips = CATEGORIES
    .filter((c) => c.id !== catId)
    .slice(0, 5)
    .map((c) => `<a class="related-chip" href="/aligned/#shelf-${c.id}">${esc(c.name)}</a>`)
    .join('');
  return `${chips}<a class="related-chip" href="/aligned/">View all →</a>`;
}

function buildPage(cat) {
  const items = itemsFor(cat.id);
  const pick = items.find((x) => x.tier === 'pick');
  const nPick = items.filter((x) => x.tier === 'pick').length;
  const nOther = items.length - nPick;

  const title = `${esc(cat.name)} — Aligned Goods · FRQNCY`;
  const url = `https://frqncy.network/aligned/${cat.id}/`;
  const descMeta = esc(
    `FRQNCY's Editor's Choice for ${cat.name}: ${pick ? pick.name : '—'}. ${nOther} more aligned entries. Picked first on merit, money flows declared after.`
  );

  const heroMeta = `${nPick} pick · ${nOther} aligned · Updated June 2026`;

  const hero = `<section class="hero">
  <span class="hero-eyebrow"><a href="/aligned/">Aligned Goods</a><span class="sep">·</span>${esc(cat.name)}</span>
  <h1>${esc(cat.name)}</h1>
  <p class="hero-desc">${esc(cat.desc)}</p>
  <p class="hero-meta">${heroMeta}</p>
</section>`;

  const editorial = `<section class="editorial">
  <div class="editorial-rule"></div>
  <p>Every entry is held against five questions — used, clean, independent, verifiable, durable. One Editor's Choice per shelf. Everything else is held to the same bar.</p>
</section>`;

  const shelf = `<section class="shelf">
  <div class="shelf-items">
${items.map(cardHtml).join('\n')}
  </div>
</section>`;

  const related = `<section class="related">
  <p class="related-eyebrow">Other shelves</p>
  <div class="related-chips">${relatedHtml(cat.id)}</div>
</section>`;

  const footer = `<footer class="site" role="contentinfo">
  <span class="wm">FRQNCY</span>
  <span>© 2026 · All frequencies reserved</span>
</footer>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<meta name="description" content="${descMeta}">
<meta name="theme-color" content="#0B1C3D">
<meta property="og:type" content="website">
<meta property="og:site_name" content="FRQNCY">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${descMeta}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="https://frqncy.network/og/aligned.png">
<link rel="canonical" href="${url}">
${HEAD_TAIL}
${CHROME}

${hero}

${editorial}

${shelf}

${related}

${footer}
<script src="/aligned/buy.js" defer></script>
</body>
</html>
`;
}

// ── Run ──────────────────────────────────────────────────────────────────────
let written = 0;
let drift = 0;
for (const cat of CATEGORIES) {
  const items = itemsFor(cat.id);
  if (items.length === 0) continue; // shelves with no entries get no page
  const dir = join(ROOT, 'aligned', cat.id);
  const file = join(dir, 'index.html');
  const html = buildPage(cat);

  const existing = existsSync(file) ? readFileSync(file, 'utf8') : null;
  if (existing === html) continue;

  drift++;
  if (CHECK) {
    console.log(`DRIFT  aligned/${cat.id}/index.html`);
  } else {
    mkdirSync(dir, { recursive: true });
    writeFileSync(file, html);
    written++;
    console.log(`wrote  aligned/${cat.id}/index.html  (${items.length} ${items.length === 1 ? 'entry' : 'entries'})`);
  }
}

if (CHECK) {
  console.log(drift ? `\n${drift} shelf page(s) out of sync with aligned-goods.json. Run without --check to rebuild.` : '\nAll shelf pages in sync.');
  process.exit(drift ? 1 : 0);
} else {
  console.log(`\nDone. ${written} page(s) written, ${CATEGORIES.length} shelves checked.`);
}
