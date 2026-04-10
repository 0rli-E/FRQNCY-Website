#!/usr/bin/env node
/**
 * build-og.js  —  Generates per-topic/domain/pillar OG images (1200×630 PNG)
 * Run:  node build-og.js
 * Also run automatically via GitHub Actions before generate.js
 *
 * Output: ./v2/og/[slug].png  (150 images + 1 default og-image.png)
 * Requires: sharp (global install at /usr/local/lib/node_modules_global/...)
 */

const fs   = require('fs');
const path = require('path');

// Resolve sharp: standard install first, then cowork sandbox global path
let sharp;
try {
  sharp = require('sharp');
} catch {
  sharp = require('/usr/local/lib/node_modules_global/lib/node_modules/sharp');
}

const ROOT = __dirname;
const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, 'content.json'), 'utf8'));
const OUT  = path.join(ROOT, 'v2', 'og');
fs.mkdirSync(OUT, { recursive: true });

// Pre-index
const domainMap = new Map(DATA.domains.map(d => [d.id, d]));
const pillarMap = new Map(DATA.pillars.map(p => [p.id, p]));

// ── SVG template ─────────────────────────────────────────────────
// Escape characters that would break SVG XML
function esc(s) { return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function makeSvg({ title, subtitle, accent, type }) {
  // Derive a darker shade of the accent for the gradient
  const r = parseInt(accent.slice(1,3),16);
  const g = parseInt(accent.slice(3,5),16);
  const b = parseInt(accent.slice(5,7),16);
  const accentDim  = `rgba(${r},${g},${b},0.18)`;
  const accentGlow = `rgba(${r},${g},${b},0.35)`;

  // Escape & truncate
  const MAX = 32;
  const rawTitle = esc(title);
  const displayTitle = rawTitle.length > MAX ? rawTitle.slice(0, MAX - 1) + '…' : rawTitle;
  const safeSubtitle = subtitle ? esc(subtitle) : '';
  const safeType = esc(type);

  // Word-wrap title into up to 2 lines for the SVG text
  const words = displayTitle.split(' ');
  const lines = [];
  let current = '';
  for (const w of words) {
    if ((current + ' ' + w).trim().length > 20 && current) {
      lines.push(current.trim());
      current = w;
    } else {
      current = (current + ' ' + w).trim();
    }
  }
  if (current) lines.push(current);

  const titleY1 = lines.length === 1 ? 310 : 285;
  const titleY2 = 345;
  const titleLine1 = lines[0] || '';
  const titleLine2 = lines[1] || '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="bg" cx="25%" cy="35%" r="85%">
      <stop offset="0%" stop-color="#0D2451"/>
      <stop offset="100%" stop-color="#050A18"/>
    </radialGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${accentGlow}"/>
      <stop offset="100%" stop-color="${accentGlow.replace('0.35','0')}"/>
    </radialGradient>
    <filter id="blur"><feGaussianBlur stdDeviation="42"/></filter>
    <filter id="blur-sm"><feGaussianBlur stdDeviation="12"/></filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Accent glow orb -->
  <ellipse cx="300" cy="260" rx="380" ry="300" fill="url(#glow)" filter="url(#blur)"/>

  <!-- Subtle grid lines -->
  <line x1="0" y1="210" x2="1200" y2="210" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
  <line x1="0" y1="420" x2="1200" y2="420" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
  <line x1="400" y1="0" x2="400" y2="630" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
  <line x1="800" y1="0" x2="800" y2="630" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>

  <!-- Accent bar left -->
  <rect x="0" y="0" width="5" height="630" fill="${accent}" opacity="0.7"/>

  <!-- FRQNCY wordmark top-left -->
  <text x="52" y="64" font-family="Georgia, serif" font-size="22" letter-spacing="12" fill="white" opacity="0.7" font-weight="300">FRQNCY</text>
  <text x="52" y="86" font-family="Georgia, serif" font-size="10" letter-spacing="6" fill="${accent}" opacity="0.8">NETWORK</text>

  <!-- Type badge -->
  <rect x="52" y="230" width="${safeType.length * 8 + 24}" height="26" rx="2" fill="${accentDim}" stroke="${accent}" stroke-width="1" stroke-opacity="0.4"/>
  <text x="64" y="248" font-family="'Helvetica Neue', Arial, sans-serif" font-size="11" letter-spacing="4" fill="${accent}" font-weight="400">${safeType.toUpperCase()}</text>

  <!-- Title -->
  <text x="52" y="${titleY1}" font-family="Georgia, 'Times New Roman', serif" font-size="68" fill="white" font-weight="300" opacity="0.95">${titleLine1}</text>
  ${titleLine2 ? `<text x="52" y="${titleY2}" font-family="Georgia, 'Times New Roman', serif" font-size="68" fill="white" font-weight="300" opacity="0.95">${titleLine2}</text>` : ''}

  <!-- Subtitle / domain -->
  ${safeSubtitle ? `<text x="52" y="${(titleLine2 ? titleY2 : titleY1) + 52}" font-family="'Helvetica Neue', Arial, sans-serif" font-size="18" fill="rgba(200,216,240,0.55)" letter-spacing="1">${safeSubtitle}</text>` : ''}

  <!-- Bottom accent line -->
  <line x1="52" y1="570" x2="320" y2="570" stroke="${accent}" stroke-width="1" opacity="0.5"/>

  <!-- Bottom tagline -->
  <text x="52" y="596" font-family="'Helvetica Neue', Arial, sans-serif" font-size="13" letter-spacing="3" fill="rgba(255,255,255,0.3)">CONSCIOUS LIVING NETWORK</text>

  <!-- Decorative corner circles (top-right) -->
  <circle cx="1060" cy="120" r="180" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
  <circle cx="1060" cy="120" r="120" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
  <circle cx="1060" cy="120" r="60"  fill="none" stroke="${accent}" stroke-width="1" opacity="0.12"/>
  <circle cx="1060" cy="120" r="8"   fill="${accent}" opacity="0.4"/>
</svg>`;
}

// ── Generate one image ────────────────────────────────────────────
async function generate(slug, svgString) {
  const outFile = path.join(OUT, `${slug}.png`);
  await sharp(Buffer.from(svgString))
    .resize(1200, 630)
    .png({ quality: 85, compressionLevel: 8 })
    .toFile(outFile);
}

// ── Run ───────────────────────────────────────────────────────────
async function main() {
  let count = 0;
  const errors = [];

  // Pillars
  for (const p of DATA.pillars) {
    try {
      await generate(p.slug, makeSvg({ title: p.label, subtitle: p.desc?.slice(0,60), accent: p.accent, type: 'Pillar' }));
      count++;
    } catch(e) { errors.push(`pillar:${p.slug} — ${e.message}`); }
  }

  // Domains
  for (const d of DATA.domains) {
    const pillar = pillarMap.get(d.pillar);
    try {
      await generate(d.slug, makeSvg({ title: d.label, subtitle: pillar?.label, accent: d.accent, type: 'Domain' }));
      count++;
    } catch(e) { errors.push(`domain:${d.slug} — ${e.message}`); }
  }

  // Topics
  for (const t of DATA.topics) {
    const domain = domainMap.get(t.domain);
    try {
      await generate(t.slug, makeSvg({ title: t.label, subtitle: domain?.label, accent: domain?.accent || '#C4973A', type: 'Topic' }));
      count++;
    } catch(e) { errors.push(`topic:${t.slug} — ${e.message}`); }
  }

  // Default og-image.png (replaces og-image.svg for twitter compatibility)
  try {
    await sharp(Buffer.from(makeSvg({ title: 'FRQNCY Network', subtitle: 'The Conscious Living Network', accent: '#4A7AE8', type: 'Explore' })))
      .resize(1200, 630)
      .png({ quality: 85, compressionLevel: 8 })
      .toFile(path.join(ROOT, 'og-image.png'));
    count++;
  } catch(e) { errors.push(`og-image.png — ${e.message}`); }

  console.log(`✓ OG images generated: ${count} → v2/og/ + og-image.png`);
  if (errors.length) {
    console.warn(`  ${errors.length} errors:`);
    errors.forEach(e => console.warn('   ', e));
  }
}

main().catch(err => { console.error('build-og.js failed:', err.message); process.exit(1); });
