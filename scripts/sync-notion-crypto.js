#!/usr/bin/env node
/**
 * FRQNCY — Notion → crypto-projects.json sync script
 *
 * Pulls crypto project data from a Notion database and generates
 * the JSON file that powers the /v2/crypto/projects.html page.
 *
 * ─── SETUP ───────────────────────────────────────────────────
 *
 * 1. Create a Notion integration at https://www.notion.so/my-integrations
 *    - Give it "Read content" capability
 *    - Copy the "Internal Integration Secret"
 *
 * 2. Share your crypto database with the integration
 *    - Open the database in Notion → ••• → Connections → Add your integration
 *
 * 3. Get the database ID from the URL:
 *    https://notion.so/<workspace>/<DATABASE_ID>?v=...
 *
 * 4. Set environment variables:
 *    export NOTION_TOKEN=secret_xxxxx
 *    export NOTION_CRYPTO_DB=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *
 * 5. Run:
 *    node scripts/sync-notion-crypto.js
 *
 * ─── EXPECTED NOTION DATABASE SCHEMA ─────────────────────────
 *
 * The Notion database should have these properties (column names):
 *
 *   Name         (Title)        — Project name, e.g. "Bitcoin"
 *   Ticker       (Rich text)    — e.g. "BTC"
 *   Tier         (Select)       — Options: "Core", "Strong", "Watch"
 *   Categories   (Multi-select) — e.g. "Infrastructure", "DeFi", "AI"
 *   Chain        (Select)       — e.g. "Ethereum", "Solana", "Multi-chain"
 *   Market Cap   (Select)       — Options: "High", "Mid", "Low", "Micro", "N/A"
 *   Description  (Rich text)    — Short description of the project
 *   Thesis       (Rich text)    — Why FRQNCY watches this project
 *   Website      (URL)          — Project website
 *   Twitter      (URL)          — Twitter/X profile
 *   Docs         (URL)          — Documentation link
 *   Accent       (Rich text)    — Hex color, e.g. "#F7931A" (optional)
 *   Published    (Checkbox)     — Only published items get exported
 *
 * ────────────────────────────────────────────────────────────────
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DATABASE_ID  = process.env.NOTION_CRYPTO_DB;
const OUTPUT_PATH  = path.join(__dirname, '..', 'v2', 'crypto', 'crypto-projects.json');

if (!NOTION_TOKEN || !DATABASE_ID) {
  console.error('Missing NOTION_TOKEN or NOTION_CRYPTO_DB environment variables.');
  console.error('See setup instructions at the top of this script.');
  process.exit(1);
}

/* ── Notion API helpers ─────────────────────────────────────── */

function notionRequest(method, endpoint, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.notion.com',
      path: endpoint,
      method,
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
    };
    if (data) options.headers['Content-Length'] = Buffer.byteLength(data);

    const req = https.request(options, res => {
      let chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString();
        try { resolve(JSON.parse(raw)); }
        catch(e) { reject(new Error(`Invalid JSON: ${raw.slice(0,200)}`)); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function queryDatabase(startCursor) {
  const body = {
    page_size: 100,
    filter: {
      property: 'Published',
      checkbox: { equals: true }
    },
    sorts: [
      { property: 'Tier', direction: 'ascending' },
      { property: 'Name', direction: 'ascending' }
    ]
  };
  if (startCursor) body.start_cursor = startCursor;
  return notionRequest('POST', `/v1/databases/${DATABASE_ID}/query`, body);
}

/* ── Property extractors ────────────────────────────────────── */

function getText(prop) {
  if (!prop) return '';
  if (prop.type === 'title') return (prop.title || []).map(t => t.plain_text).join('');
  if (prop.type === 'rich_text') return (prop.rich_text || []).map(t => t.plain_text).join('');
  if (prop.type === 'url') return prop.url || '';
  if (prop.type === 'select') return prop.select?.name || '';
  if (prop.type === 'multi_select') return (prop.multi_select || []).map(s => s.name);
  if (prop.type === 'checkbox') return prop.checkbox || false;
  return '';
}

function mapTier(val) {
  const v = String(val).toLowerCase();
  if (v === 'core')   return 'core';
  if (v === 'strong') return 'strong';
  return 'watch';
}

function mapMcap(val) {
  const v = String(val).toLowerCase();
  if (v === 'high' || v === 'large')  return 'high';
  if (v === 'mid' || v === 'medium')  return 'mid';
  if (v === 'low' || v === 'small')   return 'low';
  if (v === 'micro')                  return 'micro';
  return 'n/a';
}

/* ── Main ───────────────────────────────────────────────────── */

async function main() {
  console.log('Fetching projects from Notion...');

  let allPages = [];
  let cursor = undefined;
  let hasMore = true;

  while (hasMore) {
    const result = await queryDatabase(cursor);
    if (result.object === 'error') {
      console.error('Notion API error:', result.message);
      process.exit(1);
    }
    allPages = allPages.concat(result.results || []);
    hasMore = result.has_more;
    cursor = result.next_cursor;
  }

  console.log(`Found ${allPages.length} published projects.`);

  const projects = allPages.map(page => {
    const p = page.properties;
    const links = {};
    const website = getText(p['Website']);
    const twitter = getText(p['Twitter']);
    const docs    = getText(p['Docs']);
    if (website) links.website = website;
    if (twitter) links.twitter = twitter;
    if (docs)    links.docs = docs;

    return {
      name:       getText(p['Name']),
      ticker:     getText(p['Ticker']) || '—',
      tier:       mapTier(getText(p['Tier'])),
      categories: Array.isArray(getText(p['Categories'])) ? getText(p['Categories']) : [getText(p['Categories'])].filter(Boolean),
      chain:      getText(p['Chain']) || 'Unknown',
      mcap:       mapMcap(getText(p['Market Cap'])),
      desc:       getText(p['Description']),
      thesis:     getText(p['Thesis']),
      links,
      accent:     getText(p['Accent']) || '#7B61FF',
    };
  }).filter(p => p.name); // Skip rows with no name

  const output = {
    lastSync: new Date().toISOString(),
    source: 'notion',
    projects,
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
  console.log(`✓ Wrote ${projects.length} projects to ${OUTPUT_PATH}`);
  console.log('  Tiers:', {
    core:   projects.filter(p => p.tier === 'core').length,
    strong: projects.filter(p => p.tier === 'strong').length,
    watch:  projects.filter(p => p.tier === 'watch').length,
  });
}

main().catch(err => {
  console.error('Sync failed:', err);
  process.exit(1);
});
