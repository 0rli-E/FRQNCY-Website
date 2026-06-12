import { useState, useEffect } from 'preact/hooks';
import { getMyCourses, type EnrolledCourse } from '../lib/courses';

interface ProfileCoursesProps {
  /** The signed-in user's id. Course progress is RLS-private, so this only
   *  renders meaningful data for the owner's own profile. */
  userId: string;
}

/**
 * "Courses" panel for the owner's own profile — the cross-course progress view
 * the platform was missing. Mirrors ProfileStats' card styling. Renders nothing
 * (returns null) when the user has no enrollments, so empty profiles stay clean.
 */
export default function ProfileCourses({ userId }: ProfileCoursesProps) {
  const [courses, setCourses] = useState<EnrolledCourse[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const rows = await getMyCourses(userId);
      if (cancelled) return;
      setCourses(rows);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [userId]);

  // While loading, show a quiet placeholder card so layout doesn't jump.
  if (loading) {
    return (
      <div class="rounded-xl bg-card-bg border border-card-border p-5">
        <h3 class="font-heading text-lg text-gold mb-3">Courses</h3>
        <p class="text-sm text-text-dim">Loading…</p>
      </div>
    );
  }

  // No enrollments → don't clutter the profile. Offer a gentle nudge instead.
  if (!courses || courses.length === 0) {
    return (
      <div class="rounded-xl bg-card-bg border border-card-border p-5">
        <h3 class="font-heading text-lg text-gold mb-2">Courses</h3>
        <p class="text-sm text-text-dim">
          No courses yet.{' '}
          <a href="/courses/" class="text-gold hover:underline">Browse the library →</a>
        </p>
      </div>
    );
  }

  return (
    <div class="rounded-xl bg-card-bg border border-card-border p-5">
      <div class="flex items-baseline justify-between mb-4">
        <h3 class="font-heading text-lg text-gold">Courses</h3>
        <a href="/courses/me/" class="text-xs text-text-dim hover:text-gold transition-colors">All →</a>
      </div>
      <ul class="space-y-4">
        {courses.map((c) => (
          <li key={c.slug}>
            <a
              href={`/courses/${c.slug}/`}
              class="block group"
            >
              <div class="flex items-baseline justify-between gap-3">
                <span class="text-sm text-text group-hover:text-gold transition-colors truncate">
                  {c.title}
                </span>
                <span class="text-xs text-text-dim shrink-0 tabular-nums">
                  {c.completedLessons}/{c.totalLessons}
                </span>
              </div>
              <div class="mt-1.5 h-1.5 rounded-full bg-card-border/60 overflow-hidden">
                <div
                  class="h-full rounded-full transition-all"
                  style={{ width: `${c.pct}%`, backgroundColor: c.accent }}
                />
              </div>
              {c.status === 'completed' && (
                <span class="inline-block mt-1 text-[11px] text-gold">✓ Completed</span>
              )}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
