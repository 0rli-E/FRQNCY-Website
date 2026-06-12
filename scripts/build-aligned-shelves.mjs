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

  // Picture slot + research link — both point at the good's own page.
  const productUrl = (g.vendor && g.vendor[0] && g.vendor[0].url) || '';
  const researchUrl = g.research_url || productUrl;
  const mediaBlock = g.image
    ? `<a class="gcard-media" href="${esc(productUrl)}" target="_blank" rel="noopener noreferrer"><img src="${esc(g.image)}" alt="${esc(g.name)}" loading="lazy" onerror="this.insertAdjacentHTML('afterend','<span>FRQNCY</span>');this.parentElement.classList.add('gcard-media-empty');this.remove()"></a>`
    : `<div class="gcard-media gcard-media-empty"><span>FRQNCY</span></div>`;
  const researchBlock = researchUrl
    ? `<a class="gcard-research" href="${esc(researchUrl)}" target="_blank" rel="noopener noreferrer">Research ↗</a>`
    : '';

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

  return `<article class="gcard tier-${tierClass}" data-good-id="${esc(g.id)}">
      ${mediaBlock}
      ${head}
      <p class="gcard-desc">${esc(g.desc)}</p>
      ${critLine}
      ${vendorsBlock}
      ${researchBlock}
      ${buyBlock}
      ${relRow}
    </article>`;
}

// Picture-slot + research-link CSS. Injected as a body-level <style> by
// buildPage so it ships with every shelf page WITHOUT landing inside the
// head slice (which would duplicate on the next regen). Keep in sync with
// the same rules in aligned/index.html.
const CARDS_CSS = `<style>
.gcard-media{display:block;width:100%;aspect-ratio:16/10;border-radius:2px;overflow:hidden;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);margin:-0.2rem 0 0.35rem}
.gcard-media img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .35s ease}
.gcard-media:hover img{transform:scale(1.04)}
.gcard-media-empty{display:flex;align-items:center;justify-content:center;background:radial-gradient(ellipse at 50% 38%,rgba(196,151,58,0.08),transparent 70%)}
.gcard-media-empty span{font-family:'Cormorant',serif;font-size:1.5rem;letter-spacing:0.35em;color:var(--text-dim);opacity:0.45;padding-left:0.35em}
.gcard-research{display:inline-flex;align-items:center;gap:5px;margin-top:0.55rem;font-size:0.6rem;letter-spacing:0.18em;text-transform:uppercase;color:var(--text-dim);border-bottom:1px solid rgba(255,255,255,0.12);align-self:flex-start;padding-bottom:1px;transition:color .2s,border-color .2s}
.gcard-research:hover{color:var(--gold-light);border-color:rgba(196,151,58,0.5)}
</style>`;

function relatedHtml(catId) {
  const chips = CATEGORIES
    .filter((c) => c.id !== catId)
    .slice(0, 5)
    .map((c) => `<a class="related-chip" href="/aligned/#shelf-${c.id}">${esc(c.name)}</a>`)
    .join('');
  return `${chips}<a class="related-chip" href="/aligned/">View all →</a>`;
}

// Per-shelf editorial intro — one voice-forward line shown in the editorial
// band of each deep page, in place of the generic rubric. Keyed by shelf id.
const SHELF_INTROS = {
  'nourishment': 'Water is the first input and the most-used — the one thing you take into the body more than anything else. Get it right and everything downstream starts cleaner.',
  'food': 'Food is the second input, and the shortest supply chain wins. These are sources you can trace to a farm, a bay, a family — the opposite of the anonymous shelf.',
  'body-care': 'Whatever you put on the skin, assume it goes in. So the test here is the same as for food: can a literate person read the label and want to keep going.',
  'supplements': 'Most of the industry sells proprietary blends and synthetic fillers. This shelf is small on purpose — single ingredients, traceable sourcing, and makers who tell you exactly what’s inside.',
  'sleep': 'Sleep is the practice that compounds — the one input that improves every other. The goods here protect it: darkness, quiet, the right temperature, and gear that gets out of the way.',
  'movement': 'How the body trains and how the practice is held. Tools meant to survive a decade of use, from people who train on them too.',
  'cookware': 'Pots, pans, and knives are the rare objects that get better the longer you keep them. Bought once and handed down — the opposite of disposable.',
  'coffee-tea': 'The morning ritual deserves better than a pod. Beans and leaves with a named origin, and the simple tools that brew them the way they were meant to be.',
  'audio': 'The record asks for your whole attention and gives it back as coherence — the analogue answer to a feed that never stops. These are the machines built to spin one side at a time.',
  'tools-carry': 'Everyday objects that should outlast a decade of pockets and bags. Buy the good one once instead of the cheap one five times.',
  'cards': 'How money moves, chosen with intention — for the traveller, the sovereign, and the new financial layer. Held to the same bar as everything else: used, not just owned.',
  'privacy': 'The digital floor of a free life: tools that keep you the owner of your data, your money, and your attention. Sovereignty you can actually run.',
  'emce': 'Electro Magnetic Chaos Eliminators — the shelf for the invisible field. Pyramids, copper, shungite, structured energy: some of it is settled material science, some of it is open question. We label which is which and let you run the experiment.',
  'wear': 'Clothing built to last a decade — clean fibres, a supply chain you can follow, the opposite of the season-and-landfill cycle. Fewer things, kept longer.',
  'stay': 'Places to actually rest, practise, and come back changed. Retreat centers and conscious hospitality, chosen for what they protect rather than what they advertise.',
  'library': 'The books to keep on the shelf forever — primary sources and sacred texts, not commentary about them. Bought from a seller that funds independent bookshops, because where you buy a book is part of the teaching.',
  'learn': 'Courses and platforms that pay back the time you spend on them — ad-free, paced for depth, taught by people who know the thing. Education as an experiment you run on yourself.',
};

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

  // Per-shelf OG image: the pick's photo (or the first good with one), so a
  // shared shelf link previews the actual product, not a generic banner.
  const ogImage = (pick && pick.image) || (items.find((i) => i.image) || {}).image || 'https://frqncy.network/og/aligned.png';

  // Structured data: BreadcrumbList + an ItemList of the shelf's goods as
  // Products (with an Offer where FRQNCY resells). Makes the deep page — the
  // canonical target the topic-page callouts point at — eligible for rich
  // results, compounding the discoverability work.
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'FRQNCY', item: 'https://frqncy.network/' },
        { '@type': 'ListItem', position: 2, name: 'Aligned Goods', item: 'https://frqncy.network/aligned/' },
        { '@type': 'ListItem', position: 3, name: cat.name, item: url },
      ] },
      { '@type': 'ItemList', name: `${cat.name} — Aligned Goods`, numberOfItems: items.length,
        itemListElement: items.map((g, i) => {
          const v = (g.vendor && g.vendor[0]) || {};
          const product = {
            '@type': 'Product',
            name: g.name,
            description: (g.desc || '').slice(0, 300),
            url: v.url || url,
            brand: { '@type': 'Brand', name: v.name || 'FRQNCY' },
          };
          if (g.image) product.image = g.image;
          if (g.sell && g.sell.enabled && Number.isInteger(g.sell.price)) {
            product.offers = {
              '@type': 'Offer',
              price: (g.sell.price / 100).toFixed(2),
              priceCurrency: (g.sell.currency || 'usd').toUpperCase(),
              availability: 'https://schema.org/InStock',
              url,
            };
          }
          return { '@type': 'ListItem', position: i + 1, item: product };
        }),
      },
    ],
  };
  const ldScript = `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`;

  const hero = `<section class="hero">
  <span class="hero-eyebrow"><a href="/aligned/">Aligned Goods</a><span class="sep">·</span>${esc(cat.name)}</span>
  <h1>${esc(cat.name)}</h1>
  <p class="hero-desc">${esc(cat.desc)}</p>
  <p class="hero-meta">${heroMeta}</p>
</section>`;

  const RUBRIC = 'Every entry is held against five questions — used, clean, independent, verifiable, durable. One Editor’s Choice per shelf. Everything else is held to the same bar.';
  const introText = SHELF_INTROS[cat.id] || RUBRIC;
  const editorial = `<section class="editorial">
  <div class="editorial-rule"></div>
  <p>${esc(introText)}</p>
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
<meta property="og:image" content="${esc(ogImage)}">
<link rel="canonical" href="${url}">
${ldScript}
${HEAD_TAIL}
${CHROME}
${CARDS_CSS}

${hero}

${editorial}

${shelf}

${related}

${footer}
<script src="/assets/frqncy-analytics.js" defer></script>
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
