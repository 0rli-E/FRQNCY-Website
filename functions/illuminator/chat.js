/**
 * /illuminator/chat  — Word Illuminator
 * Cloudflare Pages Function
 *
 * Uses Cloudflare Workers AI — no API key needed, runs free on Cloudflare's edge.
 * Model: @cf/qwen/qwen3-30b-a3b-fp8 (same model as the Navigator for consistency)
 *
 * POST /illuminator/chat
 * Body: { messages: [{ role: "user"|"assistant", content: "..." }] }
 * Returns: JSON { response: "..." }
 *
 * Requires AI binding in Pages project (already configured — same binding the
 * Navigator uses):
 *   Cloudflare Dashboard → Pages → frqncy-website → Settings → Bindings
 *   → Add binding → Workers AI → variable name: AI
 */

import { PROMPT } from './_prompt.js';

const MODEL       = '@cf/qwen/qwen3-30b-a3b-fp8';
const MAX_TOKENS  = 2048;
const MAX_HISTORY = 10;   // keep last N messages to bound context size
const MAX_CONTENT = 3000; // max chars per message

// ── In-memory rate limiter ────────────────────────────────────────
const RATE_WINDOW_MS = 60_000;
const RATE_MAX       = 20;
const rateBuckets    = new Map();

function checkRateLimit(ip) {
  // Fail-closed: if we can't identify the caller, treat as rate-limited so
  // spoofed/missing IP headers can't bypass the limit.
  if (!ip) return true;
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

function getCorsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const allowedOrigins = ['https://frqncy.network', 'https://frqncy-website.pages.dev'];
  const isAllowed = allowedOrigins.includes(origin) || origin.endsWith('.frqncy-website.pages.dev');
  return {
    'Access-Control-Allow-Origin':  isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: getCorsHeaders(request) });
}

export async function onRequestPost({ request, env }) {
  const CORS_HEADERS = getCorsHeaders(request);
  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For');
  if (checkRateLimit(ip)) {
    return jsonError('Too many requests — please wait a moment and try again.', 429, CORS_HEADERS);
  }

  // Check for Workers AI binding
  if (!env.AI) {
    return jsonError('Workers AI binding not configured. Add an AI binding in Cloudflare Pages → Settings → Bindings.', 500, CORS_HEADERS);
  }

  let body;
  try { body = await request.json(); }
  catch { return jsonError('Invalid JSON body', 400, CORS_HEADERS); }

  const { messages } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return jsonError('messages array required', 400, CORS_HEADERS);
  }

  // Validate, sanitise, and trim history. Only allow user/assistant roles —
  // any other role (including "system") is rejected rather than coerced to
  // user, to prevent prompt-injection through arbitrary role labels.
  const clean = messages
    .filter(m => m && typeof m.role === 'string' && typeof m.content === 'string'
      && (m.role === 'user' || m.role === 'assistant'))
    .map(m => ({
      role:    m.role,
      content: String(m.content).slice(0, MAX_CONTENT),
    }))
    .slice(-MAX_HISTORY);

  if (clean.length === 0) return jsonError('No valid messages', 400, CORS_HEADERS);

  try {
    const result = await env.AI.run(MODEL, {
      messages: [
        { role: 'system', content: PROMPT },
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
    return jsonError('The Illuminator is resting — please try again in a moment.', 502, CORS_HEADERS);
  }
}

function jsonError(message, status = 400, corsHeaders = {}) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}
