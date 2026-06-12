import { supabase } from './supabase';

/**
 * Courses-on-profile data layer.
 *
 * The course *catalog* (titles, accents, lesson lists) lives in the static
 * /courses.json at the site root — same source the course-room overlay reads.
 * Per-user state (enrollment + per-lesson completion) lives in Supabase
 * (migration 022_courses_room). This module joins the two so a profile can
 * show "the courses this person is taking, and how far along they are".
 *
 * RLS note: course_enrollments / course_lesson_progress are select-own-or-
 * teacher. So getMyCourses only returns data for the *signed-in* user — a
 * visitor viewing someone else's profile gets nothing back (by design).
 * Render this section on the owner's own profile only.
 */

// ── Types ────────────────────────────────────────────────────────────────────
export interface CourseCatalogEntry {
  slug: string;
  title: string;
  subtitle?: string;
  accent?: string;
  lessonIds: string[];
}

export interface EnrolledCourse {
  slug: string;
  title: string;
  subtitle?: string;
  accent: string;
  totalLessons: number;
  completedLessons: number;
  pct: number; // 0-100, rounded
  status: string; // active | paused | completed | dropped
  lastActiveAt: string | null;
}

// Mirrors groups.ts: flips true the first time a query fails because migration
// 022 isn't applied, so the UI degrades to "no courses" instead of throwing.
export let coursesSchemaMissing = false;

function isMissingSchema(message?: string | null): boolean {
  return /course_enrollment|course_lesson_progress|schema cache|does not exist|PGRST205/i.test(
    message || ''
  );
}

// ── Catalog (static /courses.json) ───────────────────────────────────────────
let catalogCache: Map<string, CourseCatalogEntry> | null = null;

/** Fetch + cache the static course catalog. Returns empty map if unreachable. */
export async function loadCourseCatalog(): Promise<Map<string, CourseCatalogEntry>> {
  if (catalogCache) return catalogCache;
  try {
    // Absolute from origin root — /courses.json sits beside /social on the
    // deployed site. (In standalone `astro dev` this 404s; we degrade quietly.)
    const res = await fetch('/courses.json', { cache: 'force-cache' });
    if (!res.ok) throw new Error('courses.json ' + res.status);
    const arr = await res.json();
    const map = new Map<string, CourseCatalogEntry>();
    for (const c of Array.isArray(arr) ? arr : []) {
      if (!c || !c.slug) continue;
      map.set(c.slug, {
        slug: c.slug,
        title: c.title || c.slug,
        subtitle: c.subtitle || undefined,
        accent: c.accent || undefined,
        lessonIds: Array.isArray(c.lessons) ? c.lessons.map((l: any) => l.id).filter(Boolean) : [],
      });
    }
    catalogCache = map;
    return map;
  } catch (e) {
    console.warn('[courses] catalog load failed:', e);
    return new Map();
  }
}

// ── Reads ────────────────────────────────────────────────────────────────────

/**
 * The signed-in user's enrolled courses with progress, newest-active first.
 * Dropped enrollments are excluded. Returns [] if the schema is missing,
 * the catalog is unreachable, or the user isn't the one signed in (RLS).
 */
export async function getMyCourses(userId: string): Promise<EnrolledCourse[]> {
  if (coursesSchemaMissing || !userId) return [];

  const { data: enrollments, error: enErr } = await supabase
    .from('course_enrollments')
    .select('course_slug, status, last_active_at')
    .eq('user_id', userId)
    .neq('status', 'dropped')
    .order('last_active_at', { ascending: false });

  if (enErr) {
    if (isMissingSchema(enErr.message)) {
      coursesSchemaMissing = true;
      console.warn('[courses] schema missing — apply migration 022_courses_room.sql.');
      return [];
    }
    console.error('getMyCourses enrollments error:', enErr.message);
    return [];
  }
  if (!enrollments?.length) return [];

  // Pull all completed lessons for this user in one query, then bucket by slug.
  const { data: progress, error: prErr } = await supabase
    .from('course_lesson_progress')
    .select('course_slug, lesson_id, completed_at')
    .eq('user_id', userId)
    .not('completed_at', 'is', null);

  if (prErr && isMissingSchema(prErr.message)) {
    coursesSchemaMissing = true;
    return [];
  }

  const completedBySlug = new Map<string, Set<string>>();
  for (const row of progress ?? []) {
    if (!row.completed_at) continue;
    let set = completedBySlug.get(row.course_slug);
    if (!set) { set = new Set(); completedBySlug.set(row.course_slug, set); }
    set.add(row.lesson_id);
  }

  const catalog = await loadCourseCatalog();

  return (enrollments as any[]).map((en) => {
    const cat = catalog.get(en.course_slug);
    const totalLessons = cat?.lessonIds.length ?? 0;
    // Count only completions that match a lesson still in the catalog.
    const doneSet = completedBySlug.get(en.course_slug) ?? new Set<string>();
    const completedLessons = cat
      ? cat.lessonIds.filter((id) => doneSet.has(id)).length
      : doneSet.size;
    const pct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    return {
      slug: en.course_slug,
      title: cat?.title ?? en.course_slug,
      subtitle: cat?.subtitle,
      accent: cat?.accent ?? '#C4973A',
      totalLessons,
      completedLessons,
      pct,
      status: en.status,
      lastActiveAt: en.last_active_at ?? null,
    } as EnrolledCourse;
  });
}
