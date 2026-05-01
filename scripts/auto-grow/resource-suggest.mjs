#!/usr/bin/env node
/**
 * resource-suggest.mjs — drafts new resources.json entries from recent NRG posts.
 *
 * Reads posts from the last N days via Supabase. Extracts URLs from post
 * content. Filters out URLs already present in resources.json. For each new
 * URL, fetches title + meta description and infers type from URL pattern.
 * Writes candidates to scripts/auto-grow/output/resources-suggested.json
 * with a CONTEXT header showing the source post + author.
 *
 * Never modifies resources.json. The PR is the human-merger gate.
 *
 * Required env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');
const OUTPUT_DIR = join(__dirname, 'output');
const DAYS_BACK = parseInt(process.env.DAYS_BACK || '7', 10);

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.');
  process.exit(0); // exit-0 so workflow doesn't fail when secrets aren't set yet
}

function inferType(url) {
  if (/youtube\.com|youtu\.be|vimeo\.com/.test(url)) return 'video';
  if (/github\.com/.test(url)) return 'tool';
  if (/substack\.com|medium\.com|\.blog/.test(url)) return 'article';
  if (/podcasts\.apple|spotify\.com\/show|overcast/.test(url)) return 'podcast';
  if (/amazon\.com|bookshop\.org|goodreads/.test(url)) return 'book';
  return 'website';
}

async function fetchMeta(url) {
  try {
    const res = await fetch(url, { headers: { 'user-agent': 'FRQNCY-AutoGrow/0.1' }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return { title: null, desc: null };
    const html = await res.text();
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
                   || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
    return {
      title: titleMatch ? titleMatch[1].trim().slice(0, 200) : null,
      desc: descMatch ? descMatch[1].trim().slice(0, 300) : null,
    };
  } catch { return { title: null, desc: null }; }
}

async function loadExistingUrls() {
  try {
    const path = join(REPO_ROOT, 'resources.json');
    const data = JSON.parse(readFileSync(path, 'utf8'));
    const urls = new Set();
    if (Array.isArray(data)) {
      data.forEach(r => { if (r.url) urls.add(r.url); });
    } else {
      Object.values(data).forEach(arr => {
        if (Array.isArray(arr)) arr.forEach(r => { if (r.url) urls.add(r.url); });
      });
    }
    return urls;
  } catch (err) {
    console.warn('Could not load resources.json:', err.message);
    return new Set();
  }
}

async function fetchRecentPosts() {
  const since = new Date(Date.now() - DAYS_BACK * 24 * 60 * 60 * 1000).toISOString();
  const url = `${SUPABASE_URL}/rest/v1/posts?select=id,content,author_id,project_tag,created_at,author:profiles!posts_author_id_fkey(username)&created_at=gte.${since}&order=created_at.asc`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });
  if (!res.ok) {
    console.error('Posts fetch failed:', res.status, await res.text());
    return [];
  }
  return res.json();
}

function extractUrls(content) {
  if (!content) return [];
  const re = /https?:\/\/[^\s<>"']+/g;
  return [...new Set((content.match(re) || []).map(u => u.replace(/[.,;:!?)]+$/, '')))];
}

async function main() {
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });
  const existing = await loadExistingUrls();
  const posts = await fetchRecentPosts();
  console.log(`Scanning ${posts.length} posts from last ${DAYS_BACK} days; ${existing.size} URLs already indexed.`);

  const seen = new Set();
  const candidates = [];

  for (const post of posts) {
    const urls = extractUrls(post.content);
    for (const url of urls) {
      if (existing.has(url) || seen.has(url)) continue;
      seen.add(url);
      const meta = await fetchMeta(url);
      candidates.push({
        _context: {
          source_post_id: post.id,
          author: post.author?.username || post.author_id,
          posted_at: post.created_at,
          project_tag: post.project_tag || null,
        },
        type: inferType(url),
        name: meta.title || url,
        desc: meta.desc || '(no meta description; fill before merging)',
        url,
        topicSlug: post.project_tag || null,
        _review_notes: 'Verify topicSlug, type, and description before merging into resources.json.',
      });
    }
  }

  const out = {
    generated_at: new Date().toISOString(),
    days_scanned: DAYS_BACK,
    posts_scanned: posts.length,
    candidates_count: candidates.length,
    candidates,
  };
  writeFileSync(join(OUTPUT_DIR, 'resources-suggested.json'), JSON.stringify(out, null, 2));
  console.log(`Wrote ${candidates.length} candidates to scripts/auto-grow/output/resources-suggested.json`);
}

main().catch(err => { console.error('resource-suggest failed:', err); process.exit(0); });
