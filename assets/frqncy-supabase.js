/* ============================================================================
 * FRQNCY — shared Supabase client + auth + cloud sync
 * ----------------------------------------------------------------------------
 * One global entry point so any vanilla page on the site can:
 *   - check whether the visitor is logged in
 *   - sign up / sign in / sign out
 *   - read/write their personal data (sanctuary, charts, dreams) in Supabase
 *
 * Usage on any page:
 *   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 *   <script src="/assets/frqncy-supabase.js"></script>
 *   <script>
 *     // Wait for ready, then check auth
 *     await window.frqncy.ready;
 *     const user = await window.frqncy.auth.getUser();
 *     if (user) { ... } else { ... }
 *   </script>
 *
 * The Supabase URL + anon key are public values. Safe to ship to the browser.
 * Real authorization happens server-side via Supabase Row Level Security.
 * ========================================================================== */

(function () {
  // ── Config ──────────────────────────────────────────────────────────────
  const SUPABASE_URL  = 'https://vyazlspbmwmlyncdlezh.supabase.co';
  const SUPABASE_ANON = 'sb_publishable_zFdrbkExarUfR2PAe4FcAQ_yvcL31CI';

  // Bail if already initialized (multiple <script> tags on one page)
  if (window.frqncy && window.frqncy.client) return;

  // Load Supabase JS lazily from CDN if not present.
  function loadSdk() {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      return Promise.resolve();
    }
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.0/dist/umd/supabase.min.js';
      s.async = true;
      s.onload = () => res();
      s.onerror = () => rej(new Error('Failed to load Supabase SDK from CDN'));
      document.head.appendChild(s);
    });
  }

  // ── Client (created after SDK loads) ────────────────────────────────────
  let client = null;

  // Cache the current user across calls so sync paths don't re-hit network
  let cachedUser = null;
  let userListeners = [];

  function notifyUserChange(user) {
    cachedUser = user;
    for (const fn of userListeners) {
      try { fn(user); } catch (e) { console.error(e); }
    }
  }

  // ── Public API ──────────────────────────────────────────────────────────
  const frqncy = {
    /** Resolves when the SDK is ready. Always await this first. */
    ready: null,
    /** The Supabase client (null until ready resolves). */
    get client() { return client; },

    /** Subscribe to auth state changes. Returns an unsubscribe fn. */
    onAuth(fn) {
      userListeners.push(fn);
      // Fire immediately with current state
      try { fn(cachedUser); } catch (_) {}
      return () => { userListeners = userListeners.filter(f => f !== fn); };
    },

    auth: {
      async getUser() {
        if (!client) await frqncy.ready;
        const { data } = await client.auth.getUser();
        const u = data?.user || null;
        cachedUser = u;
        return u;
      },
      async signUp({ email, password, username, displayName }) {
        if (!client) await frqncy.ready;
        const meta = {};
        if (username)    meta.username     = username;
        if (displayName) meta.display_name = displayName;
        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: { data: meta, emailRedirectTo: `${location.origin}/social/login/` },
        });
        if (error) throw error;
        notifyUserChange(data.user);
        return data;
      },
      async signIn({ email, password }) {
        if (!client) await frqncy.ready;
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        notifyUserChange(data.user);
        return data;
      },
      async signInMagic(email) {
        if (!client) await frqncy.ready;
        const { error } = await client.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${location.origin}/social/login/` },
        });
        if (error) throw error;
      },
      async signOut() {
        if (!client) await frqncy.ready;
        const { error } = await client.auth.signOut();
        if (error) throw error;
        notifyUserChange(null);
      },
    },

    /**
     * Cloud store for the Sanctuary. Same interface as the existing LocalStore
     * (getState / setState / getImages / putImage / deleteImage / clearImages)
     * so the Sanctuary code can swap implementations transparently.
     *
     * Uses the `charts` table for state and the `chart-exports` storage bucket
     * for images. Each user has exactly one "primary" chart row (auto-created
     * on first save) referenced by name = 'Sanctuary'.
     */
    sanctuaryStore(user) {
      if (!user) throw new Error('sanctuaryStore requires a logged-in user');
      const userId = user.id;
      const SANCTUARY_NAME = 'Sanctuary';

      let chartRowId = null;
      let chartRowPromise = null;

      async function ensureRow() {
        if (chartRowId) return chartRowId;
        if (chartRowPromise) return chartRowPromise;
        chartRowPromise = (async () => {
          // Find existing
          const { data: existing, error: selErr } = await client
            .from('charts')
            .select('id')
            .eq('owner_id', userId)
            .eq('name', SANCTUARY_NAME)
            .maybeSingle();
          if (selErr) throw selErr;
          if (existing) { chartRowId = existing.id; return chartRowId; }
          // Create
          const { data: created, error: insErr } = await client
            .from('charts')
            .insert({ owner_id: userId, name: SANCTUARY_NAME, data: {}, dreams: [] })
            .select('id')
            .single();
          if (insErr) throw insErr;
          chartRowId = created.id;
          return chartRowId;
        })();
        return chartRowPromise;
      }

      return {
        async getState() {
          const id = await ensureRow();
          const { data, error } = await client
            .from('charts')
            .select('data')
            .eq('id', id)
            .single();
          if (error) throw error;
          return data?.data || null;
        },
        async setState(state) {
          const id = await ensureRow();
          const { error } = await client
            .from('charts')
            .update({ data: state })
            .eq('id', id);
          if (error) throw error;
        },
        async getImages() {
          // List images in the user's chart-exports/<uid>/ folder
          const { data, error } = await client.storage
            .from('chart-exports')
            .list(userId, { limit: 200, sortBy: { column: 'created_at', order: 'asc' } });
          if (error) throw error;
          // Convert to {id, url, position, ...} matching local format
          return (data || []).map((obj, i) => {
            const path = `${userId}/${obj.name}`;
            // Signed URL valid for 1 hour
            return {
              id:       obj.name,
              path,
              position: i,
              name:     obj.name,
              size:     obj.metadata?.size,
              created:  obj.created_at,
              // url is fetched lazily — see urlFor()
            };
          });
        },
        async urlFor(image) {
          const { data, error } = await client.storage
            .from('chart-exports')
            .createSignedUrl(image.path, 60 * 60);
          if (error) throw error;
          return data.signedUrl;
        },
        async putImage(img) {
          // img: { id, blob (File), position }
          if (!img.blob) throw new Error('putImage requires { blob: File }');
          const path = `${userId}/${img.id}`;
          const { error } = await client.storage
            .from('chart-exports')
            .upload(path, img.blob, {
              contentType: img.blob.type || 'image/png',
              upsert: true,
            });
          if (error) throw error;
        },
        async deleteImage(id) {
          const { error } = await client.storage
            .from('chart-exports')
            .remove([`${userId}/${id}`]);
          if (error) throw error;
        },
        async clearImages() {
          const { data: list } = await client.storage
            .from('chart-exports')
            .list(userId, { limit: 1000 });
          if (!list?.length) return;
          const paths = list.map(o => `${userId}/${o.name}`);
          const { error } = await client.storage
            .from('chart-exports')
            .remove(paths);
          if (error) throw error;
        },
      };
    },

    /**
     * Cloud store for the user's Constellation — birth-chart signature, modality
     * prefs, visited topics, and learning-path progress. Lives in the same
     * `charts` table as the Sanctuary, under `name = 'Constellation'`.
     *
     * Shape of the JSON `data` blob:
     *   {
     *     chart:   { hd: {...}, gk: {...}, dob: "YYYY-MM-DD", generatedAt: ISO },
     *     prefs:   ["channeled", "embodied", ...],     // modality picks
     *     visited: ["meditation", "water", ...],       // topic slugs opened
     *     pathDone:["step-id", ...],                   // learning-path checks
     *   }
     *
     * Same swap-on-login pattern as sanctuaryStore: anonymous visitors keep
     * localStorage; logged-in users get cross-device sync without disruption.
     */
    constellationStore(user) {
      if (!user) throw new Error('constellationStore requires a logged-in user');
      const userId = user.id;
      const ROW_NAME = 'Constellation';

      let rowId = null;
      let rowPromise = null;
      async function ensureRow() {
        if (rowId) return rowId;
        if (rowPromise) return rowPromise;
        rowPromise = (async () => {
          const { data: existing, error: selErr } = await client
            .from('charts')
            .select('id')
            .eq('owner_id', userId)
            .eq('name', ROW_NAME)
            .maybeSingle();
          if (selErr) throw selErr;
          if (existing) { rowId = existing.id; return rowId; }
          const { data: created, error: insErr } = await client
            .from('charts')
            .insert({ owner_id: userId, name: ROW_NAME, data: {}, dreams: [] })
            .select('id')
            .single();
          if (insErr) throw insErr;
          rowId = created.id;
          return rowId;
        })();
        return rowPromise;
      }
      return {
        async getState() {
          const id = await ensureRow();
          const { data, error } = await client
            .from('charts')
            .select('data')
            .eq('id', id)
            .single();
          if (error) throw error;
          return data?.data || null;
        },
        async setState(state) {
          const id = await ensureRow();
          const { error } = await client
            .from('charts')
            .update({ data: state })
            .eq('id', id);
          if (error) throw error;
        },
        /** Merge a patch into the stored state — small, atomic-feeling writes. */
        async patch(partial) {
          const id = await ensureRow();
          const { data, error } = await client
            .from('charts')
            .select('data')
            .eq('id', id)
            .single();
          if (error) throw error;
          const next = Object.assign({}, data?.data || {}, partial);
          const { error: updErr } = await client
            .from('charts')
            .update({ data: next })
            .eq('id', id);
          if (updErr) throw updErr;
          return next;
        },
      };
    },

    /**
     * Courses Room store — Skool-like progress/notes/Q&A for /courses/<slug>/ pages.
     *
     * Tables (migration 022):
     *   - course_enrollments        : (user_id, course_slug) — one row per enrollment
     *   - course_lesson_progress    : (user_id, course_slug, lesson_id) — completion ledger
     *   - course_lesson_notes       : (user_id, course_slug, lesson_id) — private notes
     *   - course_lesson_questions   : (course_slug, lesson_id) — public Q&A thread
     *   - course_question_replies   : (question_id) — threaded replies
     *   - course_teachers           : (user_id, course_slug) — teaches all if course_slug null
     *
     * RLS makes this safe to call directly from the browser. No service role here.
     *
     * Each method returns a Promise. Unless noted, throws on failure so callers
     * can `try/catch` cleanly. UI-level fallbacks (offline / not-logged-in) are
     * handled in courses-room.js — this layer assumes a live client + user.
     */
    coursesStore(user) {
      if (!user) throw new Error('coursesStore requires a logged-in user');
      const userId = user.id;
      const c = () => client;

      return {
        // ── Enrollment ────────────────────────────────────────────────
        async listMyEnrollments() {
          const { data, error } = await c()
            .from('course_enrollments')
            .select('course_slug, enrolled_at, last_active_at, status')
            .eq('user_id', userId)
            .order('last_active_at', { ascending: false });
          if (error) throw error;
          return data || [];
        },
        async isEnrolled(courseSlug) {
          const { data, error } = await c()
            .from('course_enrollments')
            .select('course_slug,status')
            .eq('user_id', userId)
            .eq('course_slug', courseSlug)
            .maybeSingle();
          if (error) throw error;
          return !!data && data.status !== 'dropped';
        },
        async enroll(courseSlug) {
          const { error } = await c()
            .from('course_enrollments')
            .upsert({ user_id: userId, course_slug: courseSlug, status: 'active', last_active_at: new Date().toISOString() },
                    { onConflict: 'user_id,course_slug' });
          if (error) throw error;
        },
        async unenroll(courseSlug) {
          // Soft-drop, keep progress around in case they re-enroll
          const { error } = await c()
            .from('course_enrollments')
            .update({ status: 'dropped' })
            .eq('user_id', userId)
            .eq('course_slug', courseSlug);
          if (error) throw error;
        },
        async touchEnrollment(courseSlug) {
          // Update last_active_at so the dashboard can sort by recency
          const { error } = await c()
            .from('course_enrollments')
            .update({ last_active_at: new Date().toISOString() })
            .eq('user_id', userId)
            .eq('course_slug', courseSlug);
          if (error) throw error;
        },

        // ── Progress ──────────────────────────────────────────────────
        async listMyProgress(courseSlug) {
          const { data, error } = await c()
            .from('course_lesson_progress')
            .select('lesson_id, completed_at, seconds_spent')
            .eq('user_id', userId)
            .eq('course_slug', courseSlug);
          if (error) throw error;
          return data || [];
        },
        async setLessonComplete(courseSlug, lessonId, complete) {
          const row = {
            user_id: userId,
            course_slug: courseSlug,
            lesson_id: lessonId,
            completed_at: complete ? new Date().toISOString() : null,
          };
          const { error } = await c()
            .from('course_lesson_progress')
            .upsert(row, { onConflict: 'user_id,course_slug,lesson_id' });
          if (error) throw error;
        },
        async addLessonSeconds(courseSlug, lessonId, deltaSeconds) {
          // Server-side RPC would be cleaner but for v0 we fetch+update.
          if (!deltaSeconds || deltaSeconds <= 0) return;
          const { data: existing } = await c()
            .from('course_lesson_progress')
            .select('seconds_spent')
            .eq('user_id', userId).eq('course_slug', courseSlug).eq('lesson_id', lessonId)
            .maybeSingle();
          const newTotal = (existing?.seconds_spent || 0) + Math.floor(deltaSeconds);
          const { error } = await c()
            .from('course_lesson_progress')
            .upsert({
              user_id: userId, course_slug: courseSlug, lesson_id: lessonId,
              seconds_spent: newTotal,
            }, { onConflict: 'user_id,course_slug,lesson_id' });
          if (error) throw error;
        },

        // ── Notes (private) ──────────────────────────────────────────
        async getNote(courseSlug, lessonId) {
          const { data, error } = await c()
            .from('course_lesson_notes')
            .select('body, updated_at')
            .eq('user_id', userId).eq('course_slug', courseSlug).eq('lesson_id', lessonId)
            .maybeSingle();
          if (error) throw error;
          return data || { body: '', updated_at: null };
        },
        async saveNote(courseSlug, lessonId, body) {
          const { error } = await c()
            .from('course_lesson_notes')
            .upsert({
              user_id: userId, course_slug: courseSlug, lesson_id: lessonId,
              body: body || '',
            }, { onConflict: 'user_id,course_slug,lesson_id' });
          if (error) throw error;
        },
        async listMyNotes(courseSlug) {
          // Returns all notes for a course (used by My Courses dashboard)
          const { data, error } = await c()
            .from('course_lesson_notes')
            .select('lesson_id, body, updated_at')
            .eq('user_id', userId).eq('course_slug', courseSlug)
            .order('updated_at', { ascending: false });
          if (error) throw error;
          return data || [];
        },

        // ── Questions (public per lesson) ────────────────────────────
        async listQuestions(courseSlug, lessonId) {
          const { data, error } = await c()
            .from('course_questions_with_author')
            .select('*')
            .eq('course_slug', courseSlug).eq('lesson_id', lessonId)
            .order('pinned', { ascending: false })
            .order('created_at', { ascending: false });
          if (error) throw error;
          return data || [];
        },
        async askQuestion(courseSlug, lessonId, body) {
          const trimmed = (body || '').trim();
          if (!trimmed) throw new Error('Question body required');
          const { data, error } = await c()
            .from('course_lesson_questions')
            .insert({ author_id: userId, course_slug: courseSlug, lesson_id: lessonId, body: trimmed })
            .select('id')
            .single();
          if (error) throw error;
          return data.id;
        },
        async resolveQuestion(questionId, resolved) {
          const { error } = await c()
            .from('course_lesson_questions')
            .update({ resolved_at: resolved ? new Date().toISOString() : null })
            .eq('id', questionId);
          if (error) throw error;
        },
        async deleteQuestion(questionId) {
          const { error } = await c()
            .from('course_lesson_questions')
            .delete()
            .eq('id', questionId);
          if (error) throw error;
        },

        // ── Replies ──────────────────────────────────────────────────
        async listReplies(questionId) {
          const { data, error } = await c()
            .from('course_replies_with_author')
            .select('*')
            .eq('question_id', questionId)
            .order('created_at', { ascending: true });
          if (error) throw error;
          return data || [];
        },
        async replyToQuestion(questionId, body) {
          const trimmed = (body || '').trim();
          if (!trimmed) throw new Error('Reply body required');
          const { error } = await c()
            .from('course_question_replies')
            .insert({ question_id: questionId, author_id: userId, body: trimmed });
          if (error) throw error;
        },
        async deleteReply(replyId) {
          const { error } = await c()
            .from('course_question_replies')
            .delete()
            .eq('id', replyId);
          if (error) throw error;
        },

        // ── Teacher reads ────────────────────────────────────────────
        async amTeacher(courseSlug) {
          const { data, error } = await c()
            .from('course_teachers')
            .select('course_slug')
            .eq('user_id', userId);
          if (error) throw error;
          if (!data || !data.length) return false;
          return data.some(r => r.course_slug === null || r.course_slug === courseSlug);
        },
        async teacherListRoster(courseSlug) {
          // Returns enrollments + per-user progress count for the course
          const { data: enrolls, error: e1 } = await c()
            .from('course_enrollments')
            .select('user_id, enrolled_at, last_active_at, status')
            .eq('course_slug', courseSlug);
          if (e1) throw e1;
          if (!enrolls?.length) return [];
          const userIds = enrolls.map(r => r.user_id);
          const { data: profs } = await c()
            .from('profiles').select('id, username, display_name, avatar_url')
            .in('id', userIds);
          const { data: progress } = await c()
            .from('course_lesson_progress')
            .select('user_id, lesson_id, completed_at')
            .eq('course_slug', courseSlug)
            .in('user_id', userIds);
          const byUser = {};
          for (const p of progress || []) {
            (byUser[p.user_id] = byUser[p.user_id] || []).push(p);
          }
          const profById = Object.fromEntries((profs || []).map(p => [p.id, p]));
          return enrolls.map(r => ({
            ...r,
            profile: profById[r.user_id] || null,
            lessons_completed: (byUser[r.user_id] || []).filter(x => x.completed_at).length,
            lessons_started:   (byUser[r.user_id] || []).length,
          }));
        },
        async teacherOpenQuestions() {
          // All questions across all courses the teacher teaches
          const { data, error } = await c()
            .from('course_questions_with_author')
            .select('*')
            .is('resolved_at', null)
            .order('created_at', { ascending: false })
            .limit(100);
          if (error) throw error;
          return data || [];
        },
      };
    },

    /**
     * Cloud store for the VBRTN profile — the founding-block profile produced by
     * the intake and read/written by the My FRQNCY hub + VBRTN companion. Lives
     * in the same `charts` table, under `name = 'VBRTN'`.
     *
     * The whole profile blob (standing / design / meta / triggers / baseline /
     * state / history / rememberOne / _intakeAnswers / _updatedAt) is stored as
     * the single JSON `data` column — same one-row-per-user pattern as the
     * Sanctuary and Constellation stores. Anonymous visitors keep localStorage;
     * logged-in users get cross-device sync transparently via the shared helper
     * in /assets/frqncy-vbrtn-store.js.
     */
    vbrtnStore(user) {
      if (!user) throw new Error('vbrtnStore requires a logged-in user');
      const userId = user.id;
      const ROW_NAME = 'VBRTN';

      let rowId = null;
      let rowPromise = null;
      async function ensureRow() {
        if (rowId) return rowId;
        if (rowPromise) return rowPromise;
        rowPromise = (async () => {
          const { data: existing, error: selErr } = await client
            .from('charts')
            .select('id')
            .eq('owner_id', userId)
            .eq('name', ROW_NAME)
            .maybeSingle();
          if (selErr) throw selErr;
          if (existing) { rowId = existing.id; return rowId; }
          const { data: created, error: insErr } = await client
            .from('charts')
            .insert({ owner_id: userId, name: ROW_NAME, data: {}, dreams: [] })
            .select('id')
            .single();
          if (insErr) throw insErr;
          rowId = created.id;
          return rowId;
        })();
        return rowPromise;
      }
      return {
        async getState() {
          const id = await ensureRow();
          const { data, error } = await client
            .from('charts')
            .select('data')
            .eq('id', id)
            .single();
          if (error) throw error;
          // An empty {} (freshly-created row) reads as "no profile yet".
          const d = data?.data;
          return (d && Object.keys(d).length) ? d : null;
        },
        async setState(state) {
          const id = await ensureRow();
          const { error } = await client
            .from('charts')
            .update({ data: state })
            .eq('id', id);
          if (error) throw error;
        },
      };
    },

    /**
     * Watch-progress store — resume-where-you-left-off for the /watch/ hub.
     *
     * Same one-row-per-user pattern as Sanctuary/VBRTN: stored in the shared
     * `charts` table under `name = 'WatchProgress'`. The `data` column holds a
     * map of `{ [videoId]: { pos, dur, pct, title, topicId, updatedAt } }`.
     * Anonymous visitors keep localStorage (frqncy.watch.v1); logged-in users
     * get cross-device sync via /assets/frqncy-watch-progress.js.
     */
    videoProgressStore(user) {
      if (!user) throw new Error('videoProgressStore requires a logged-in user');
      const userId = user.id;
      const ROW_NAME = 'WatchProgress';

      let rowId = null;
      let rowPromise = null;
      async function ensureRow() {
        if (rowId) return rowId;
        if (rowPromise) return rowPromise;
        rowPromise = (async () => {
          const { data: existing, error: selErr } = await client
            .from('charts')
            .select('id')
            .eq('owner_id', userId)
            .eq('name', ROW_NAME)
            .maybeSingle();
          if (selErr) throw selErr;
          if (existing) { rowId = existing.id; return rowId; }
          const { data: created, error: insErr } = await client
            .from('charts')
            .insert({ owner_id: userId, name: ROW_NAME, data: {}, dreams: [] })
            .select('id')
            .single();
          if (insErr) throw insErr;
          rowId = created.id;
          return rowId;
        })();
        return rowPromise;
      }
      return {
        async getState() {
          const id = await ensureRow();
          const { data, error } = await client
            .from('charts')
            .select('data')
            .eq('id', id)
            .single();
          if (error) throw error;
          const d = data?.data;
          return (d && Object.keys(d).length) ? d : {};
        },
        async setState(state) {
          const id = await ensureRow();
          const { error } = await client
            .from('charts')
            .update({ data: state })
            .eq('id', id);
          if (error) throw error;
        },
      };
    },

    /** Auth widget — drops a small "Log in / Profile" pill into a target element. */
    mountAuthPill(targetEl, opts = {}) {
      if (!targetEl) return;
      const loginUrl = opts.loginUrl || '/social/login/';

      function render(user) {
        if (user) {
          targetEl.innerHTML = `
            <a href="/social/" style="display:inline-flex;align-items:center;gap:6px;font-size:0.7rem;letter-spacing:0.12em;text-transform:uppercase;color:#C4973A;border:1px solid rgba(196,151,58,0.35);padding:5px 12px;border-radius:2px;text-decoration:none;">
              <span style="width:6px;height:6px;border-radius:50%;background:#5BC79A;"></span>
              <span>${escapeHtml(user.user_metadata?.username || (user.email || '').split('@')[0] || 'You')}</span>
            </a>`;
        } else {
          targetEl.innerHTML = `
            <a href="${loginUrl}" style="display:inline-flex;align-items:center;gap:6px;font-size:0.7rem;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.7);border:1px solid rgba(255,255,255,0.18);padding:5px 12px;border-radius:2px;text-decoration:none;">Log in</a>`;
        }
      }
      function escapeHtml(s) {
        return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
      }

      frqncy.ready.then(() => frqncy.auth.getUser()).then(render);
      frqncy.onAuth(render);
    },
  };

  // ── Boot ────────────────────────────────────────────────────────────────
  frqncy.ready = (async () => {
    await loadSdk();
    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
    // Push auth changes through the listener channel
    client.auth.onAuthStateChange((_event, session) => {
      notifyUserChange(session?.user || null);
    });
    // Prime the cache
    const { data } = await client.auth.getUser();
    cachedUser = data?.user || null;
    return frqncy;
  })();

  window.frqncy = frqncy;
})();
