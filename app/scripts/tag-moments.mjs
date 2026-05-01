#!/usr/bin/env node
/**
 * tag-moments.mjs
 *
 * Adds a `moment` field to resources.json entries that fit the wake/sleep flows.
 *
 * moment values:
 *   - "morning"   — gentle movement, breath, tuning-in, arrival
 *   - "evening"   — wind-down, stillness, sleep stories, ambient
 *   - "stillness" — meditation, silence, presence (used for both)
 *   - "release"   — reflection, journaling, letting go
 *
 * Schema is ADDITIVE — old app versions ignore the `moment` field.
 * Run this whenever resources.json changes. Idempotent.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RESOURCES = resolve(__dirname, '../../resources.json');

/**
 * Match on lowercased (name + desc + topicSlug + domain).
 * Patterns broadened in 2026-04-29 sweep — target 200/766 tagged (was 109).
 * Editorial guard: avoid auto-tagging anything that conflicts with FRQNCY's
 * "no scores, no streaks" stance — explicit "sleep tracker" / "score" entries
 * stay untagged.
 */
const PATTERNS = {
  morning: [
    /\bmorning\b/, /\bawaken/, /\bbreath\b/, /\bbreath[- ]?work\b/, /\bpranayama\b/,
    /\byoga\b/, /\btai\s*chi\b/, /\bqi\s*gong\b/, /\bchi\s*kung\b/,
    /\bsun\s*salut/, /\bintention/, /\bpresence\b/, /\btuning\b/, /\bfrequency\b/,
    /\bsolfeggio\b/, /\b432\s*hz\b/, /\b528\s*hz\b/, /\b639\s*hz\b/, /\b741\s*hz\b/,
    /\bmantra\b/, /\bactivat/, /\bembodiment\b/, /\bsomatic\b/, /\bmovement\b/,
    /\bgentle\s*movement\b/, /\bstretch\b/, /\binvocation\b/, /\bsacred\s*geometry\b/,
    /\bchant/, /\bkirtan\b/, /\bsadhana\b/, /\bdance\s*meditation\b/, /\b5rhythms\b/,
    /\bqi\b/, /\bprana\b/, /\benergy\s*work\b/, /\bcoherence\b/,
  ],
  evening: [
    /\bsleep\b/, /\bbedtime\b/, /\bnight\b/, /\bwind[\s-]?down\b/, /\bbefore[- ]bed\b/,
    /\blullab/, /\brest\b/, /\bambient\b/, /\bdrone\b/, /\bbinaural\b/,
    /\bdelta\b/, /\btheta\b/, /\balpha\s*waves?\b/, /\bsoundscape\b/, /\bnature\s*sound/,
    /\bsound\s*bath\b/, /\bsound\s*healing\b/, /\bsinging\s*bowls?\b/, /\bgong\b/,
    /\bharp\b/, /\bdrum\s*journey\b/, /\bsleep\s*story\b/, /\byoga\s*nidra\b/,
    /\bdream/, /\blucid/, /\bdeep\s*rest\b/, /\binsomnia\b/,
  ],
  stillness: [
    /\bmeditation\b/, /\bmindful/, /\bsilence\b/, /\bcontemplation\b/, /\bawareness\b/,
    /\bstillness\b/, /\bsit\s*with\b/, /\bvipassana\b/, /\bzen\b/, /\bdharma\b/,
    /\bnon[\s-]dual/, /\badvaita\b/, /\bself[- ]inquiry\b/, /\bsatsang\b/,
    /\bemptiness\b/, /\bconsciousness\b/, /\bawakening\b/, /\bpresence\s*practice\b/,
    /\bopen\s*awareness\b/, /\bmetta\b/, /\bloving[- ]?kindness\b/, /\btonglen\b/,
    /\bmonastic\b/, /\bcontemplative\b/, /\binsight\s*meditation\b/, /\bjhana\b/,
  ],
  release: [
    /\brelease\b/, /\bjournal/, /\breflect/, /\bshadow\s*work\b/, /\bletting\s*go\b/,
    /\bforgive/, /\bgrief\b/, /\bprocess\b/, /\bintegrate\b/, /\bunwind\b/,
    /\bcatharsi/, /\btrauma\s*release\b/, /\bTRE\b/, /\bemotional\s*release\b/,
    /\bbreath[- ]?work\b/, /\bcry\b/, /\bvocal\s*release\b/, /\btoning\b/,
    /\bcompletion\b/, /\bcompost(ing)?\b/, /\bshedding\b/, /\bunburden/,
    /\bgrief\s*ritual\b/, /\bclosure\b/, /\bend\s*of\s*day\b/,
  ],
};

function classify(r) {
  const hay = [r.name, r.desc, r.topicSlug, r.topicLabel, r.domain, r.domainSlug]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const moments = new Set();
  for (const [moment, patterns] of Object.entries(PATTERNS)) {
    if (patterns.some((p) => p.test(hay))) moments.add(moment);
  }
  return moments.size > 0 ? [...moments] : null;
}

async function main() {
  const raw = await readFile(RESOURCES, 'utf8');
  const resources = JSON.parse(raw);

  let tagged = 0;
  let updated = 0;
  const tally = { morning: 0, evening: 0, stillness: 0, release: 0 };

  for (const r of resources) {
    const moments = classify(r);
    if (!moments) {
      // Clear previous moment tags if classifier no longer matches.
      if (r.moment) {
        delete r.moment;
        updated++;
      }
      continue;
    }
    moments.forEach((m) => tally[m]++);
    const existing = JSON.stringify(r.moment ?? null);
    const next = JSON.stringify(moments);
    if (existing !== next) {
      r.moment = moments;
      updated++;
    }
    tagged++;
  }

  await writeFile(RESOURCES, JSON.stringify(resources, null, 2) + '\n', 'utf8');

  console.log(`[tag-moments] ${tagged}/${resources.length} resources tagged (${updated} changed)`);
  console.log(`[tag-moments] morning=${tally.morning} evening=${tally.evening} stillness=${tally.stillness} release=${tally.release}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
