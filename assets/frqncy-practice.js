/* ============================================================================
 * FRQNCY — Practice Tracker API (vanilla JS / ES module)
 * ----------------------------------------------------------------------------
 * The Inhabit · Sanctuary daily-use loop. Reads/writes practice_logs in
 * Supabase (migration 012). Every user only ever sees their own rows. No
 * cross-user aggregation, no leaderboard surface — per CLAUDE.md.
 *
 * Voice constraints (non-negotiable, see proposals/FRQNCY-VOICE-PLAYBOOK.md):
 *   - Practices are framed as experiments, not prescriptions.
 *   - "Consistency" never "streak". No guilt-trip language for missed days.
 *   - Daily suggestions are "today's path" — invitation, not assignment.
 *   - Banished phrases: wellness, do the work, hustle, level up, unlock,
 *     manifest, vibes, high vibe, soul food, awakened, etc.
 *
 * Usage:
 *   import { logSession, getDailySuggestion, CURATED_PRACTICES }
 *     from '/assets/frqncy-practice.js';
 *   const sug = await getDailySuggestion();
 *
 * Requires `/assets/frqncy-supabase.js` to have loaded first — the API uses
 * `window.frqncy.client` for all DB calls.
 * ========================================================================== */

// ── Curated practices ─────────────────────────────────────────────────────
//
// Hand-picked. Voice-aligned. Each `framing` ≈10 words, declarative,
// present-tense, plain speech about non-plain things. `topicSlug` links to
// /v2/<slug>/ when a topic page exists for the practice.

export const CURATED_PRACTICES = [
  {
    slug: 'meditation',
    label: 'Meditation',
    framing: 'sit, breathe, notice. the original technology.',
    topicSlug: 'meditation',
    defaultDurationMinutes: 15,
  },
  {
    slug: 'breathwork',
    label: 'Breathwork',
    framing: 'the body as instrument. directed breath shifts state.',
    topicSlug: 'breathwork',
    defaultDurationMinutes: 10,
  },
  {
    slug: 'journaling',
    label: 'Journaling',
    framing: 'writing as listening. the page hears what the mind cannot.',
    topicSlug: 'journaling',
    defaultDurationMinutes: 15,
  },
  {
    slug: 'study',
    label: 'Study session',
    framing: 'sustained attention on a single text. the slow read.',
    defaultDurationMinutes: 45,
  },
  {
    slug: 'prayer',
    label: 'Prayer',
    framing: 'speaking toward what is greater than the self.',
    defaultDurationMinutes: 10,
  },
  {
    slug: 'contemplation',
    label: 'Contemplation',
    framing: 'staying with a question until it dissolves.',
    defaultDurationMinutes: 20,
  },
  {
    slug: 'walking-meditation',
    label: 'Walking meditation',
    framing: 'each step as practice. movement without arrival.',
    defaultDurationMinutes: 25,
  },
  {
    slug: 'fasting',
    label: 'Fasting',
    framing: 'the chosen empty. clarity that hunger reveals.',
    defaultDurationMinutes: 60,
  },
  {
    slug: 'sun-gazing',
    label: 'Sun gazing',
    framing: 'the morning sun, witnessed. ancient and disputed. brief.',
    defaultDurationMinutes: 5,
  },
];

const PRACTICE_BY_SLUG = Object.fromEntries(
  CURATED_PRACTICES.map((p) => [p.slug, p])
);

export function getPractice(slug) {
  return PRACTICE_BY_SLUG[slug] || null;
}

// ── Internal: get the Supabase client + signed-in user ────────────────────

async function getClientAndUser() {
  if (!window.frqncy) {
    throw new Error('frqncy-supabase.js must load before frqncy-practice.js');
  }
  await window.frqncy.ready;
  const user = await window.frqncy.auth.getUser();
  if (!user) return { client: window.frqncy.client, user: null };
  return { client: window.frqncy.client, user };
}

// ── logSession ────────────────────────────────────────────────────────────

/**
 * Insert a single practice log row for the signed-in user.
 * Returns the inserted row, or null if not signed in / on error.
 *
 * input:
 *   practice_slug    string  — required, slug from CURATED_PRACTICES
 *   duration_minutes number  — required, 1..600
 *   notes            string? — optional
 *   mood_pre         1..5 |null
 *   mood_post        1..5 |null
 *   started_at       ISO string? — defaults to now
 */
export async function logSession(input) {
  const { client, user } = await getClientAndUser();
  if (!user) return null;

  const row = {
    user_id: user.id,
    practice_slug: input.practice_slug,
    duration_minutes: input.duration_minutes,
    notes: input.notes ?? null,
    mood_pre: input.mood_pre ?? null,
    mood_post: input.mood_post ?? null,
  };
  if (input.started_at) row.started_at = input.started_at;

  const { data, error } = await client
    .from('practice_logs')
    .insert(row)
    .select('*')
    .single();
  if (error) {
    console.error('[frqncy-practice] logSession error', error);
    return null;
  }
  return data;
}

// ── listLogs ──────────────────────────────────────────────────────────────

/**
 * Returns the signed-in user's recent practice logs, newest first.
 *
 * opts:
 *   practice_slug  string?  — filter to a single practice
 *   limit          number?  — default 50
 *   sinceDays      number?  — only return logs from the last N days
 */
export async function listLogs(opts = {}) {
  const { client, user } = await getClientAndUser();
  if (!user) return [];

  let q = client
    .from('practice_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('started_at', { ascending: false })
    .limit(opts.limit ?? 50);

  if (opts.practice_slug) q = q.eq('practice_slug', opts.practice_slug);
  if (opts.sinceDays) {
    const since = new Date(Date.now() - opts.sinceDays * 24 * 3600 * 1000).toISOString();
    q = q.gte('started_at', since);
  }

  const { data, error } = await q;
  if (error) {
    console.error('[frqncy-practice] listLogs error', error);
    return [];
  }
  return data || [];
}

// ── getScores ─────────────────────────────────────────────────────────────

/**
 * Returns derived per-practice stats for the signed-in user, from the
 * `practice_scores` view. RLS keeps it scoped to the owner's logs.
 */
export async function getScores() {
  const { client, user } = await getClientAndUser();
  if (!user) return [];

  const { data, error } = await client
    .from('practice_scores')
    .select('*')
    .eq('user_id', user.id);
  if (error) {
    console.error('[frqncy-practice] getScores error', error);
    return [];
  }
  return data || [];
}

// ── getDailySuggestion ────────────────────────────────────────────────────

/**
 * "Today's path" — a 1-3 step suggestion based on the user's recent log
 * history. Acknowledgement + invitation, never judgement. Never returns a
 * "you missed N days" guilt message.
 *
 * Logic:
 *   1. If practiced today already → acknowledge, suggest a contemplative
 *      reflection (no second-prescription).
 *   2. Else if no logs in the last 3 days → suggest a short anchor practice
 *      (5-10 min) from the first three curated entries.
 *   3. Else if practiced ≥3 of the last 7 days → suggest a depth practice
 *      (longer duration, deeper topic).
 *   4. Otherwise → suggest the practice the user has done most recently.
 */
export async function getDailySuggestion() {
  // Default for signed-out / fall-through
  const defaultSuggestion = {
    headline: "Today's path",
    subline: 'Begin with the breath. Five minutes. The simplest door.',
    practice: PRACTICE_BY_SLUG['meditation'],
    durationMinutes: 5,
    reasoning: 'Default anchor practice. Short by design — the smallest doorway in.',
  };

  const { user } = await getClientAndUser();
  if (!user) return defaultSuggestion;

  const recent = await listLogs({ limit: 50, sinceDays: 7 });

  const now = Date.now();
  const dayMs = 24 * 3600 * 1000;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayStartMs = todayStart.getTime();

  const practicedToday = recent.some(
    (r) => new Date(r.started_at).getTime() >= todayStartMs
  );

  const last3DaysCount = recent.filter(
    (r) => now - new Date(r.started_at).getTime() <= 3 * dayMs
  ).length;

  // Distinct calendar days practiced in the last 7
  const distinctDays7 = new Set(
    recent
      .filter((r) => now - new Date(r.started_at).getTime() <= 7 * dayMs)
      .map((r) => new Date(r.started_at).toISOString().slice(0, 10))
  ).size;

  // Case 1 — practiced today already
  if (practicedToday) {
    return {
      headline: 'You already turned in today',
      subline:
        'A single sitting is enough. If something else calls, follow it without strain.',
      practice: PRACTICE_BY_SLUG['contemplation'],
      durationMinutes: 10,
      reasoning:
        "You've already practiced today. This is acknowledgement, not a second assignment — only here if you want it.",
    };
  }

  // Case 2 — no logs in the last 3 days → short anchor
  if (last3DaysCount === 0) {
    // Rotate through the first three anchor practices by day-of-year
    const anchors = ['meditation', 'breathwork', 'journaling'];
    const dayIdx = Math.floor(now / dayMs) % anchors.length;
    const anchor = PRACTICE_BY_SLUG[anchors[dayIdx]];
    return {
      headline: "Today's path",
      subline: anchor.framing,
      practice: anchor,
      durationMinutes: Math.min(anchor.defaultDurationMinutes, 10),
      reasoning:
        'A short anchor. The shape of practice returns by sitting once — duration is not the point today.',
    };
  }

  // Case 3 — consistent (≥3 of last 7) → depth practice
  if (distinctDays7 >= 3) {
    // Pick a longer-duration practice the user has not done in the last 3 days
    const recentSlugs = new Set(
      recent.filter((r) => now - new Date(r.started_at).getTime() <= 3 * dayMs)
        .map((r) => r.practice_slug)
    );
    const depthCandidates = ['contemplation', 'study', 'walking-meditation', 'fasting'];
    const pick =
      depthCandidates.find((s) => !recentSlugs.has(s)) || 'contemplation';
    const practice = PRACTICE_BY_SLUG[pick];
    return {
      headline: "Today's path — depth",
      subline: practice.framing,
      practice,
      durationMinutes: practice.defaultDurationMinutes,
      reasoning:
        'Recent days show consistency. The invitation now is depth — a longer sitting, a fuller question.',
    };
  }

  // Case 4 — fall through: the practice the user did most recently
  const last = recent[0];
  const practice =
    PRACTICE_BY_SLUG[last.practice_slug] || PRACTICE_BY_SLUG['meditation'];
  return {
    headline: "Today's path",
    subline: practice.framing,
    practice,
    durationMinutes: practice.defaultDurationMinutes,
    reasoning:
      'Picking up where you left off. Continuity is its own teaching.',
  };
}

// ── Helpers exported for the UI ───────────────────────────────────────────

/** Format a Date / ISO as "5 minutes ago", "2 days ago", etc. */
export function relativeTime(when) {
  const d = typeof when === 'string' ? new Date(when) : when;
  const diff = Date.now() - d.getTime();
  if (diff < 0) return 'just now';
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? '' : 's'} ago`;
}
