/**
 * /api/link-preview — Open Graph scraper
 * Cloudflare Pages Function
 *
 * Fetches a URL server-side, parses Open Graph + standard meta tags from
 * the first ~256KB of HTML, and returns a small JSON preview the client
 * can render as a card next to a post.
 *
 * GET /api/link-preview?url=<encoded-url>
 * Returns: { ok: true, preview: { url, title, description, image, site_name } }
 *          { ok: false, error: "..." }
 *
 * Why a server function: scraping client-side would be blocked by CORS on
 * almost every external domain. The function runs on Cloudflare's edge with
 * full HTTP access, so it can fetch any public URL.
 *
 * Hardening:
 *   - Per-IP rate limit (30/min) — the typical user only previews a handful
 *     of links per session, so this is generous but not abusable.
 *   - URL validation — only http(s), no localhost / RFC1918 / IPv6 link-local.
 *   - Response cap at 256KB, 5s fetch timeout — keeps cost predictable.
 *   - Origin allowlist on CORS so other sites can't piggyback on this
 *     endpoint as a free metadata API.
 *   - Browser-like User-Agent so sites that gate on UA don't return 403.
 */

const RATE_WINDOW_MS = 60_000;
const RATE_MAX       = 30;
const rateBuckets    = new Map();

const ALLOWED_ORIGINS = [
  'https://frqncy.network',
  'https://www.frqncy.network',
];

const FETCH_TIMEOUT_MS = 5_000;
const MAX_BYTES        = 256 * 1024;

function isAllowedOrigin(origin) {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (/^https:\/\/.*\.frqncy-website\.pages\.dev$/.test(origin)) return true;
  if (/^http:\/\/localhost(:\d+)?$/.test(origin)) return true;
  return false;
}

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const allowed = isAllowedOrigin(origin) ? origin : '';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

function checkRateLimit(ip) {
  if (!ip) return true; // fail-closed
  const now = Date.now();
  let bucket = rateBuckets.get(ip);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + RATE_WINDOW_MS };
    rateBuckets.set(ip, bucket);
  }
  bucket.count++;
  if (rateBuckets.size > 1000) {
    for (const [k, v] of rateBuckets) { if (now >= v.resetAt) rateBuckets.delete(k); }
  }
  return bucket.count > RATE_MAX;
}

function isPrivateHost(hostname) {
  // Block obvious internal targets so this can't be used as an SSRF probe.
  const h = hostname.toLowerCase();
  if (h === 'localhost' || h === '127.0.0.1' || h === '0.0.0.0' || h === '::1') return true;
  if (/^10\./.test(h)) return true;
  if (/^192\.168\./.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true;
  if (/^169\.254\./.test(h)) return true;
  if (/^fc[0-9a-f]{2}:/i.test(h) || /^fd[0-9a-f]{2}:/i.test(h)) return true;
  if (/\.local$/i.test(h) || /\.internal$/i.test(h)) return true;
  return false;
}

function validateUrl(raw) {
  let u;
  try { u = new URL(raw); } catch { return null; }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
  if (isPrivateHost(u.hostname)) return null;
  return u;
}

/* ── HTML meta extraction ────────────────────────────────────────────
   Tiny tag-based parser — scans ≤256KB of HTML. Looks for <title> plus
   meta tags with property/name in {og:title, og:description, og:image,
   og:site_name, twitter:title, twitter:description, twitter:image,
   description}. First match wins for each field, with og:* preferred. */
function extractMeta(html, baseUrl) {
  const truncated = html.slice(0, MAX_BYTES);

  const out = { title: '', description: '', image: '', site_name: '', url: baseUrl };

  // <title>
  const titleMatch = truncated.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) out.title = decodeEntities(titleMatch[1].trim());

  // <meta ...> walk
  const metaRe = /<meta\b[^>]+>/gi;
  let m;
  while ((m = metaRe.exec(truncated)) !== null) {
    const tag = m[0];
    const propMatch = tag.match(/\b(?:property|name)\s*=\s*["']([^"']+)["']/i);
    const contentMatch = tag.match(/\bcontent\s*=\s*["']([^"']*)["']/i);
    if (!propMatch || !contentMatch) continue;
    const prop = propMatch[1].toLowerCase();
    const content = decodeEntities(contentMatch[1]);
    if (!content) continue;

    if (prop === 'og:title' || (prop === 'twitter:title' && !out.title)) out.title = content;
    else if (prop === 'og:description' || prop === 'description' || prop === 'twitter:description') {
      if (!out.description) out.description = content;
    }
    else if (prop === 'og:image' || (prop === 'twitter:image' && !out.image)) out.image = content;
    else if (prop === 'og:site_name') out.site_name = content;
    else if (prop === 'og:url' && !out.url) out.url = content;
  }

  // Resolve a relative image path against the page URL
  if (out.image && !/^https?:\/\//i.test(out.image)) {
    try { out.image = new URL(out.image, baseUrl).toString(); } catch (_) { out.image = ''; }
  }

  // Cap field lengths so a malicious page can't return megabytes of metadata
  out.title       = (out.title       || '').slice(0, 200);
  out.description = (out.description || '').slice(0, 400);
  out.site_name   = (out.site_name   || '').slice(0, 100);

  return out;
}

function decodeEntities(s) {
  if (!s) return s;
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => {
      const c = parseInt(n, 10);
      return c > 0 && c < 0x110000 ? String.fromCodePoint(c) : '';
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => {
      const c = parseInt(n, 16);
      return c > 0 && c < 0x110000 ? String.fromCodePoint(c) : '';
    });
}

async function fetchTextWithCap(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        // Some sites refuse default fetch UAs; mimic a real browser politely.
        'User-Agent': 'Mozilla/5.0 (compatible; FRQNCYbot/1.0; +https://frqncy.network)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en',
      },
      signal: ctrl.signal,
    });
    if (!res.ok) return { ok: false, status: res.status };
    const ct = res.headers.get('Content-Type') || '';
    if (!/text\/html|application\/xhtml/i.test(ct)) {
      return { ok: false, status: 415 };
    }

    // Read up to MAX_BYTES then drop the rest. Avoids loading huge pages.
    const reader = res.body.getReader();
    const chunks = [];
    let total = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      chunks.push(value);
      total += value.byteLength;
      if (total >= MAX_BYTES) { ctrl.abort(); break; }
    }
    const buf = new Uint8Array(total);
    let offset = 0;
    for (const c of chunks) { buf.set(c.subarray(0, Math.min(c.byteLength, buf.length - offset)), offset); offset += c.byteLength; }
    const text = new TextDecoder('utf-8', { fatal: false }).decode(buf);
    return { ok: true, html: text };
  } catch (err) {
    return { ok: false, status: err.name === 'AbortError' ? 504 : 500 };
  } finally {
    clearTimeout(timer);
  }
}

export async function onRequestGet(context) {
  const { request } = context;
  const cors = corsHeaders(request);
  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || '';

  if (checkRateLimit(ip)) {
    return new Response(JSON.stringify({ ok: false, error: 'Rate limit exceeded' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', ...cors },
    });
  }

  const reqUrl = new URL(request.url);
  const target = reqUrl.searchParams.get('url') || '';
  const u = validateUrl(target);
  if (!u) {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid URL' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...cors },
    });
  }

  const fetched = await fetchTextWithCap(u.toString());
  if (!fetched.ok) {
    return new Response(JSON.stringify({ ok: false, error: `Fetch failed (${fetched.status})` }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', ...cors },
    });
  }

  const preview = extractMeta(fetched.html, u.toString());

  return new Response(JSON.stringify({ ok: true, preview }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      // Cache previews for an hour so popular links don't hit the origin repeatedly.
      'Cache-Control': 'public, max-age=3600',
      ...cors,
    },
  });
}

export async function onRequestOptions(context) {
  return new Response(null, { status: 204, headers: corsHeaders(context.request) });
}
