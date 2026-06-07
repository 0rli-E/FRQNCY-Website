#!/usr/bin/env node
/**
 * blurb.mjs — generate FRQNCY-voiced descriptions for new uploads.
 *
 * Each candidate video needs a 1–2 sentence `desc` written in FRQNCY voice,
 * not the YouTube uploader's marketing copy. This script calls Claude with the
 * voice playbook as system context, generates a blurb per new upload, and
 * writes it back into the diff.
 *
 * Falls back to a trimmed raw description (no LLM) if ANTHROPIC_API_KEY is
 * unset — the pipeline still works, the blurbs just need more manual rewriting.
 *
 *   node scripts/ingest/blurb.mjs                    # in-place updates output/diff.json
 *
 * Reads: scripts/ingest/output/diff.json
 * Writes: scripts/ingest/output/diff.json (adds frqncy_desc per upload)
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');
const OUTPUT_DIR = join(__dirname, 'output');
const DIFF_PATH = join(OUTPUT_DIR, 'diff.json');

const API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.FRQNCY_BLURB_MODEL || 'claude-haiku-4-5-20251001';
const API_URL = 'https://api.anthropic.com/v1/messages';

function readJson(p) { return JSON.parse(readFileSync(p, 'utf8')); }
function writeJson(p, data) { writeFileSync(p, JSON.stringify(data, null, 2) + '\n'); }

/* ── System prompt: the constraints, not the full playbook ──── */
const SYSTEM_PROMPT = `You write video descriptions for FRQNCY, a consciousness-practice content platform.

Rules — non-negotiable:
1. ONE OR TWO short sentences. Maximum 35 words. Plain declarative prose.
2. Present tense. No "this video will show you" / "you'll learn" / "discover" / "join us."
3. No spiritual clichés: no "high vibe," "vibes," "wellness," "self care," "do the work," "holistic," "authentic self," "soul food," "love and light" (as direct self-description), "awakened" (as a status), "abundance mindset," "infinite energy," "manifest your dreams."
4. No startup hype: no "disrupt," "next gen," "game-changing," "unlock," "level up," "unleash."
5. No instructional condescension. Don't talk down to the reader. Don't frame them as a beginner.
6. No leaderboards, no "calls," no ranking people.
7. State what the video actually is and why it's worth watching — concretely. Reference the teacher's framework or the specific teaching, not generic spirituality.
8. If the video is a re-upload, compilation, or interview, say so plainly.

Voice example to match:
  "Esther Hicks channels Abraham on the pivot that changes everything — choosing yourself first and letting the rest of life rearrange around that choice."
  "Bashar's manifestation formula in his own words — clearer and more mechanical than most second-hand summaries."

Output the description text only. No preamble, no quotes, no markdown.`;

async function generateBlurb({ title, channel_name, raw_desc, full_desc, topic_id }) {
  const userPrompt = [
    `Teacher: ${channel_name || '(unknown channel)'}`,
    `Topic: ${topic_id || '(unassigned)'}`,
    `Video title: ${title}`,
    full_desc ? `\nFull YouTube description (raw, for context — DO NOT copy the voice):\n${full_desc.slice(0, 1200)}` : '',
    !full_desc && raw_desc ? `\nShort YouTube description (raw, for context):\n${raw_desc.slice(0, 600)}` : '',
    `\nWrite the FRQNCY description now.`,
  ].filter(Boolean).join('\n');

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 150,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    }),
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`anthropic_${res.status}: ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  const out = data.content?.[0]?.text?.trim() || '';
  // Strip surrounding quotes if the model added any
  return out.replace(/^["“'']|["”'']$/g, '').trim();
}

function fallbackBlurb(upload) {
  // No API key — return the first sentence of the raw description, trimmed.
  const src = upload.full_desc || upload.raw_desc || '';
  if (!src) return null;
  const firstSentence = src.split(/(?<=[.!?])\s+/)[0] || src;
  return firstSentence.slice(0, 200).trim();
}

export async function runBlurb(diffArg) {
  const diff = diffArg || (existsSync(DIFF_PATH) ? readJson(DIFF_PATH) : null);
  if (!diff) {
    console.log('  No diff.json — run listen.mjs --json first.');
    return null;
  }

  let total = 0, generated = 0, fallback = 0, failed = 0;

  for (const d of diff.diff) {
    for (const u of d.new_uploads) {
      total++;
      if (!API_KEY) {
        u.frqncy_desc = fallbackBlurb(u);
        u.blurb_source = 'fallback_raw_youtube_desc';
        fallback++;
        continue;
      }
      try {
        u.frqncy_desc = await generateBlurb({
          title: u.title,
          channel_name: u.channel_name || d.channel_name,
          raw_desc: u.raw_desc,
          full_desc: u.full_desc,
          topic_id: d.topic_id,
        });
        u.blurb_source = `llm_${MODEL}`;
        generated++;
        // tiny pause to avoid rate-limit drama on big runs
        await new Promise(r => setTimeout(r, 250));
      } catch (err) {
        u.frqncy_desc = fallbackBlurb(u);
        u.blurb_source = 'fallback_after_llm_error';
        u._llm_error = err.message;
        failed++;
      }
    }
  }

  if (!diffArg) writeJson(DIFF_PATH, diff);
  console.log(`  blurbs: total=${total}  llm=${generated}  fallback=${fallback}  failed=${failed}`);
  if (!API_KEY) console.log('  (ANTHROPIC_API_KEY unset — every blurb is a raw-description fallback. Expect to rewrite.)');
  return diff;
}

const isMain = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;
if (isMain) {
  runBlurb().catch(err => { console.error('blurb failed:', err); process.exit(1); });
}
