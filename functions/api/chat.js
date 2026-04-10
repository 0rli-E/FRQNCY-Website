/**
 * /api/chat  — FRQNCY AI Navigator
 * Cloudflare Pages Function
 *
 * Env vars required (Cloudflare Pages → Settings → Environment Variables):
 *   ANTHROPIC_API_KEY   your Anthropic API key
 *
 * POST /api/chat
 * Body: { messages: [{ role: "user"|"assistant", content: "..." }] }
 * Returns: text/event-stream (Anthropic SSE proxied through)
 */

import { KB } from './_kb.js';

const MODEL       = 'claude-haiku-4-5-20251001';
const MAX_TOKENS  = 1024;
const MAX_HISTORY = 12;   // keep last N messages to bound context size
const MAX_CONTENT = 4000; // max chars per message

// ── In-memory rate limiter ────────────────────────────────────────
// Resets per worker instance (Cloudflare spins up many, but still limits bursts)
// For persistent limits, bind a KV namespace as env.RATE_LIMIT_KV
const RATE_WINDOW_MS = 60_000; // 1 minute
const RATE_MAX       = 20;     // max requests per IP per window
const rateBuckets    = new Map(); // ip → { count, resetAt }

function checkRateLimit(ip) {
  if (!ip) return false; // no IP = can't limit, allow
  const now = Date.now();
  let bucket = rateBuckets.get(ip);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + RATE_WINDOW_MS };
    rateBuckets.set(ip, bucket);
  }
  bucket.count++;
  // Prune map if it grows large (many unique IPs)
  if (rateBuckets.size > 5000) {
    for (const [k, v] of rateBuckets) { if (now >= v.resetAt) rateBuckets.delete(k); }
  }
  return bucket.count > RATE_MAX;
}

const SYSTEM = `You are the FRQNCY Navigator — a warm, knowledgeable guide to the FRQNCY Conscious Living Network.

FRQNCY is a curated platform mapping the frontier of conscious living, spirituality, science, and self-mastery. You know every topic, domain, pillar, and resource on the site.

Your role:
• Help visitors explore the FRQNCY network and find what resonates
• Explain topics clearly — connect ideas across domains when relevant
• Recommend FRQNCY Picks and curated resources where helpful
• Guide users to the right page on the site (/v2/[topic-slug]/)
• Be concise, warm, and insightful — like a knowledgeable friend, not a search engine
• Use **bold** and bullet points sparingly for readability
• Keep answers focused (2–4 paragraphs max unless a detailed list is needed)

Never make up topics or resources that aren't in the knowledge base. If unsure, suggest exploring /v2/explore.html.

--- FULL SITE KNOWLEDGE BASE ---
${KB}`;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestPost({ request, env }) {
  // Rate limiting — Cloudflare sets CF-Connecting-IP on all requests
  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For');
  if (checkRateLimit(ip)) {
    return jsonError('Too many requests — please wait a moment and try again.', 429);
  }

  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return jsonError('ANTHROPIC_API_KEY not set. Add it in Cloudflare Pages → Settings → Environment Variables.', 500);
  }

  let body;
  try { body = await request.json(); }
  catch { return jsonError('Invalid JSON body', 400); }

  const { messages } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return jsonError('messages array required', 400);
  }

  // Validate, sanitise, and trim history
  const clean = messages
    .filter(m => m && typeof m.role === 'string' && typeof m.content === 'string')
    .map(m => ({
      role:    m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content).slice(0, MAX_CONTENT),
    }))
    .slice(-MAX_HISTORY);

  if (clean.length === 0) return jsonError('No valid messages', 400);

  let upstream;
  try {
    upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({ model: MODEL, max_tokens: MAX_TOKENS, system: SYSTEM, messages: clean, stream: true }),
    });
  } catch (err) {
    return jsonError(`Upstream request failed: ${err.message}`, 502);
  }

  if (!upstream.ok) {
    // Return a generic error to the client — avoid leaking API details
    return jsonError(`AI service error (${upstream.status})`, upstream.status);
  }

  // Proxy the SSE stream straight through to the client
  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type':      'text/event-stream',
      'Cache-Control':     'no-cache',
      'X-Accel-Buffering': 'no',
      ...CORS_HEADERS,
    },
  });
}

function jsonError(message, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}
