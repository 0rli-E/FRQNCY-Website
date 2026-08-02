# Courses → Skool-shape — handoff

**Repo:** `~/Documents/Claude/Projects/FRQNCY WEBSITE/`
**Goal:** Bring the FRQNCY course pages to a Skool.com-style classroom feel without breaking FRQNCY's voice playbook.
**Status (2026-06-11):** room overlay wired in; structural Skool features (community feed, modules, roster, calendar, inline Q&A) still to do.

---

## What "Skool shape" means here

Skool's defining surfaces:

1. Community feed — one rolling wall of posts across the whole group.
2. Classroom — courses in a left rail, lesson video centre, comments inline beneath.
3. Modules — lessons collapse into sections.
4. Members roster — anonymous-or-named, sortable.
5. Leaderboard — points/levels (their signature loop).
6. Calendar — live calls, RSVPs.
7. About — a Welcome tab per classroom.

Trade-off Orlando still owns: **Skool's leaderboard/points/streak loop conflicts with FRQNCY's voice rule** (see `assets/courses-room.js` line 18: *"No streaks, no daily counts, no leaderboards. Progress is the user's own."*). Treat that constraint as binding unless he explicitly relaxes it.

---

## What's already shipped (do not redo)

- `assets/courses-room.js` (823 lines) + `assets/courses-room.css` (702 lines) — the Skool-style overlay. Bottom-left pill → side panel with three tabs: **Lessons / Notes / Q&A**. Local progress works for guests; Supabase mirrors progress + private notes + public per-lesson Q&A for signed-in learners.
- Overlay is **wired into every course detail page** via `generate-courses.js`. Search for `courses-room.css` and `courses-room.js` in that file — the injection lives just above `</head>` and just above `</body>` in the detail template.
- The 7 course pages have been regenerated and include the room.
- Per-lesson YouTube comments link + Telegram CTA banner on crypto-fundamentals.
- Per-lesson video with YouTube facade pattern, schema.org `VideoObject`, `Course.hasPart`, and a localStorage progress store at key `frqncy-course-<slug>`.
- Supabase store API in `assets/frqncy-supabase.js` → `window.frqncy.coursesStore(user)` exposes `isEnrolled`, `enroll`, `unenroll`, `listMyProgress`, `setLessonComplete`, `touchEnrollment`, `getNote`, `saveNote`, `listQuestions`, `askQuestion`, `listReplies`, `amTeacher`.
- Auth flow: `/social/login/?next=<path>` after sign-in returns to the lesson. The room's auth CTA already points here.

---

## The gap (prioritised, with concrete file targets)

### Tier 1 — Skool feel, no voice-playbook conflict

1. **Inline the per-lesson Q&A under the video.**
   Today, Q&A only lives inside the overlay panel. Skool puts it on the main canvas. Render the same `state.questions` list as a section under the video on `generate-courses.js`'s detail template, with the room's `askQuestion` form duplicated below. The room can stay as the slide-out for cross-lesson nav; the inline panel is the primary surface.
   *Files:* `generate-courses.js` (around the lesson render block, after the discuss panel at ~line 186), `assets/courses-room.js` (extract the question render into a reusable function `window.frqncy.renderLessonQA(container, slug, lessonId)`).

2. **Module/section grouping in the lesson list.**
   `courses.json` lessons are flat. Add an optional `module` string per lesson. In both the inline sidebar (in the detail template) and the room's Lessons tab, group consecutive same-module lessons under a collapsible heading. Fall back to flat list when `module` is absent so existing courses don't break.
   *Files:* `courses.json` (add `module` to crypto-fundamentals as a pilot), `generate-courses.js` (sidebar render), `assets/courses-room.js` (`rerenderLessons`).

3. **"Recent activity" strip on `/courses/`.**
   Pull the last 5 questions + last 5 completions across all courses from Supabase. Render as a horizontal scrolling strip above the courses grid: "Sarah just finished L7 of Crypto Fundamentals · Mark asked a question in Meditation 101 · …". Anonymise to display_name + course. Cache 60s client-side.
   *Files:* `courses/index.html` (add a `<section id="course-activity">` and a fetch that calls a new `coursesStore.recentActivity(limit)`). Add `recentActivity(limit)` to `assets/frqncy-supabase.js`. Skool-style social proof without points.

4. **"Welcome" tab inside the room.**
   Add a fourth tab between Lessons and Notes. Renders `course.subtitle`, `course.desc`, the community banner (Telegram URL), and an "About this course" block (lesson count, total duration, level, topics). For signed-in learners, show their enrolment date.
   *Files:* `assets/courses-room.js` (`mountShell` HTML around the `<nav class="frq-cr-tabs">`), `assets/courses-room.css` (new pane styles match existing tabs).

5. **Resume tile on `/courses/me/`.**
   Pull the most-recently-touched enrolment, surface "Continue: Lesson N — <title>" with a button straight to `/courses/<slug>/#l<n>`. The room already drops users at their last-visited lesson via hash; this just makes the dashboard a one-click resume.
   *Files:* `courses/me/index.html` (top of `<main>`), `assets/frqncy-supabase.js` (`coursesStore.lastTouched()`).

### Tier 2 — Mid trade-off

6. **Anonymous roster inside the room.**
   New "Cohort" tab listing display names + first letter of last name of everyone enrolled. No counts, no ranks — just presence. Honours the voice rule because it shows *who's here*, not *who's winning*.

7. **Reply threading + at-mentions in Q&A.**
   `listReplies` already exists. Render reply count under each question, allow inline reply composer. `@name` triggers a notification (Supabase row in `notifications` table, surfaced in `/social/notifications/`).

8. **Course-wide thread.**
   Today Q&A is per-lesson. Add an optional `lesson_id = NULL` row class for course-level discussion. New tab "General" or fold into Welcome.

### Tier 3 — Editorial decisions Orlando still owns

9. **Leaderboard / points / streaks.** Default position: NO. If Orlando changes his mind, the room already tracks `completedIdx` per user; a streak counter is two queries away. Don't add this without an explicit decision.
10. **Calendar / live events.** No infra for this yet. Would need a new Supabase table and a UI surface; significant work.
11. **Push / email notifications.** Same — needs separate plumbing.

---

## Quirks the next agent should know

- **Auto-commit hook.** Cowork's commit hook on this repo occasionally strips injected work during merges. Confirmed pattern: anything injected directly into `v2/<topic>/index.html` or item pages (people, books, orgs, media, places) gets wiped on next generator run. **All edits must go through the generator OR be wrapped in `<!-- BESPOKE:slot -->...<!-- /BESPOKE -->` markers.** Course detail pages are generated — edit `generate-courses.js`, not the output HTML.
- **`.git/index.lock`** is sometimes held by the auto-commit hook. If `rm -f` returns "Operation not permitted", wait 30–60s; do not try to force-kill.
- **Path depth in the detail template.** `generate-courses.js` uses `../../../` prefixes (legacy from when courses lived at `/v2/courses/<slug>/`). They resolve at runtime because the browser clamps to root, but use **absolute paths** (`/assets/...`) for any new resources to avoid the trap.
- **`courses-room.js` activation.** Gated by `/^\/courses\/([a-z0-9-]+)\/(?:index\.html)?$/i`. Excludes `me` and `teach`. If you add a new top-level path, update the regex.
- **Supabase auth wait.** The room waits for `window.frqncy.ready` before touching cloud state. Don't assume the user is loaded synchronously.
- **Editorial voice.** FRQNCY's playbook forbids streaks, leaderboards, daily counts. Keep social proof to *presence* and *recent activity*, not *competition*.

---

## Recommended first session for the next agent

Take Tier-1 items 1, 2, 4 in one pass — they share the same template surface and ship together as "the inline classroom". Skip 3 (`recentActivity`) until the Supabase RPC is written. Item 5 (resume tile) is a 30-line patch — do it last in the same session.

Don't touch Tier 3 without an explicit instruction from Orlando.

---

## File map

- Generator: `generate-courses.js`
- Data: `courses.json`
- Overlay JS: `assets/courses-room.js`
- Overlay CSS: `assets/courses-room.css`
- Supabase wrapper: `assets/frqncy-supabase.js`
- Course detail pages: `courses/<slug>/index.html` (generated)
- Course hub: `courses/index.html`
- Learner dashboard: `courses/me/index.html`
- Teacher dashboard: `courses/teach/index.html`
- Auth pages: `social/login/`, `social/profile/`
- Editorial constraints: `assets/courses-room.js` header comment (lines 16–21)
