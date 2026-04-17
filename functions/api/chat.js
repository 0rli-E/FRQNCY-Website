/**
 * /api/chat  — FRQNCY AI Navigator
 * Cloudflare Pages Function
 *
 * Uses Cloudflare Workers AI — no API key needed, runs free on Cloudflare's edge.
 * Model: @cf/qwen/qwen3-30b-a3b-fp8
 *
 * POST /api/chat
 * Body: { messages: [{ role: "user"|"assistant", content: "..." }] }
 * Returns: JSON { response: "..." }
 *
 * Requires AI binding in Pages project:
 *   Cloudflare Dashboard → Pages → frqncy-website → Settings → Bindings
 *   → Add binding → Workers AI → variable name: AI
 */

import { KB } from './_kb.js';

const MODEL       = '@cf/qwen/qwen3-30b-a3b-fp8';
const MAX_TOKENS  = 2048;
const MAX_HISTORY = 10;   // keep last N messages to bound context size
const MAX_CONTENT = 3000; // max chars per message

// ── In-memory rate limiter ────────────────────────────────────────
const RATE_WINDOW_MS = 60_000;
const RATE_MAX       = 20;
const rateBuckets    = new Map();

function checkRateLimit(ip) {
  if (!ip) return false;
  const now = Date.now();
  let bucket = rateBuckets.get(ip);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + RATE_WINDOW_MS };
    rateBuckets.set(ip, bucket);
  }
  bucket.count++;
  if (rateBuckets.size > 5000) {
    for (const [k, v] of rateBuckets) { if (now >= v.resetAt) rateBuckets.delete(k); }
  }
  return bucket.count > RATE_MAX;
}

const SYSTEM = `/no_think
You are the FRQNCY Navigator — a warm, knowledgeable guide to the FRQNCY Conscious Living Network.

FRQNCY is a curated platform mapping the frontier of conscious living, spirituality, science, and self-mastery. You know every topic, domain, pillar, and resource on the site.

Your role:
• Help visitors explore the FRQNCY network and find what resonates
• Explain topics clearly — connect ideas across domains when relevant
• Recommend FRQNCY Picks and curated resources where helpful
• Guide users to the right page on the site — ALWAYS use markdown links: [Topic Name](/v2/topic-slug/) so they are clickable
• Be concise, warm, and insightful — like a knowledgeable friend, not a search engine
• When referencing a FRQNCY page, ALWAYS format it as a clickable markdown link, e.g. [Human Design](/v2/human-design/) — never just paste a bare path
• Use **bold** and bullet points sparingly for readability
• Keep answers focused (2–4 paragraphs max unless a detailed list is needed)

Never make up topics or resources that aren't in the knowledge base. If unsure, suggest exploring /v2/explore.html.
Do NOT include any <think> reasoning blocks in your response. Respond directly.

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
  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For');
  if (checkRateLimit(ip)) {
    return jsonError('Too many requests — please wait a moment and try again.', 429);
  }

  // Check for Workers AI binding
  if (!env.AI) {
    return jsonError('Workers AI binding not configured. Add an AI binding in Cloudflare Pages → Settings → Bindings.', 500);
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

  try {
    const result = await env.AI.run(MODEL, {
      messages: [
        { role: 'system', content: SYSTEM },
        ...clean
      ],
      max_tokens: MAX_TOKENS,
      temperature: 0.7,
    });

    // Qwen3 returns OpenAI-compatible format: { choices: [{ message: { content } }] }
    // Older models returned: { response: "..." }
    let text;
    if (result.choices && result.choices[0]?.message?.content) {
      text = result.choices[0].message.content.trim();
    } else if (result.response) {
      text = result.response;
    } else {
      text = typeof result === 'string' ? result : JSON.stringify(result);
    }

    // Qwen3 may emit <think>...</think> reasoning blocks — strip them
    text = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    // Handle unclosed <think> tag (model ran out of tokens mid-thought)
    if (text.includes('<think>')) {
      text = text.replace(/<think>[\s\S]*/g, '').trim();
    }

    return new Response(JSON.stringify({ response: text }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        ...CORS_HEADERS,
      },
    });

  } catch (err) {
    return jsonError('AI service temporarily unavailable — please try again.', 502);
  }
}

function jsonError(message, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}
