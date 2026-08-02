/* ============================================================================
 * FRQNCY — Courses Room overlay
 * ----------------------------------------------------------------------------
 * Skool-like learner surface that activates on `/courses/<slug>/` pages.
 *
 *   - Reads the existing per-page localStorage progress (`frqncy-course-<slug>`)
 *     so the static page's own UI stays in sync; no refactor required.
 *   - When the visitor is signed in (via assets/frqncy-supabase.js), mirrors
 *     progress to Supabase so it follows the user across devices, and unlocks
 *     per-lesson notes (private) and a per-lesson Q&A thread (public to the
 *     cohort + teacher).
 *   - Floats as a small pill bottom-left of the viewport. Clicking opens a
 *     side panel with three tabs: Lessons · Notes · Q&A. On mobile the panel
 *     becomes a bottom-sheet.
 *
 * Editorial guardrails (FRQNCY voice playbook):
 *   - No streaks, no daily counts, no leaderboards. Progress is the user's own.
 *   - Notes are private. Teachers cannot see them (enforced by RLS, but also
 *     explicit in copy).
 *   - Q&A defaults closed — you have to choose to ask publicly.
 * ========================================================================== */

(function () {
  'use strict';

  // ── Activate only on course detail pages ────────────────────────────────
  const PATH_RE = /^\/courses\/([a-z0-9-]+)\/(?:index\.html)?$/i;
  const m = (location.pathname || '').match(PATH_RE);
  if (!m) return;
  const SLUG = m[1];
  if (SLUG === 'me' || SLUG === 'teach') return; // dashboards, not course rooms

  // ── Tiny helpers ────────────────────────────────────────────────────────
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
  const debounce = (fn, ms) => {
    let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  };
  const fmtRel = (iso) => {
    if (!iso) return '';
    const ms = Date.now() - new Date(iso).getTime();
    const s = Math.round(ms / 1000);
    if (s < 60) return 'just now';
    const mn = Math.round(s / 60); if (mn < 60) return mn + ' min ago';
    const h = Math.round(mn / 60); if (h < 24) return h + ' h ago';
    const d = Math.round(h / 24); if (d < 7) return d + ' d ago';
    const w = Math.round(d / 7);  if (w < 5) return w + ' w ago';
    const mo = Math.round(d / 30); if (mo < 12) return mo + ' mo ago';
    return Math.round(d / 365) + ' y ago';
  };
  const PROGRESS_KEY = 'frqncy-course-' + SLUG;
  function readLocalProgress() {
    try { return new Set(JSON.parse(localStorage.getItem(PROGRESS_KEY) || '[]')); }
    catch (_) { return new Set(); }
  }
  function writeLocalProgress(set) {
    try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(Array.from(set))); } catch (_) {}
  }

  // ── State ────────────────────────────────────────────────────────────────
  const state = {
    course: null,                // full course object from courses.json
    lessons: [],                 // shorthand: course.lessons
    user: null,                  // Supabase user (or null)
    authChecked: false,          // true once auth state is known — gate fails open until then
    isTeacher: false,
    enrolled: false,
    completedIdx: readLocalProgress(),  // Set<number> of completed lesson indices
    currentLessonId: null,       // 'l1' / 'l2' / ... — synced to URL hash
    activeTab: 'lessons',        // 'lessons' | 'notes' | 'qa'
    notes: '',                   // current lesson note body
    notesSaveAt: null,           // timestamp of last successful save
    questions: [],               // questions for current lesson
    repliesByQ: new Map(),       // questionId -> [replies]
    expandedQ: new Set(),        // questionId of expanded threads
    opened: false,
    store: null,                 // window.frqncy.coursesStore(user) or null
    bootedAt: Date.now(),
  };

  // ── Load courses.json (cached if already on the page) ────────────────────
  async function loadCourse() {
    // 1) The /courses/index.html page inlines COURSES — use it if we ever
    //    ship the overlay there. On detail pages courses.json is the source.
    if (Array.isArray(window.COURSES)) {
      const c = window.COURSES.find(x => x.slug === SLUG);
      if (c) return c;
    }
    // 2) Fetch courses.json. Cached by HTTP for repeat visits.
    try {
      const res = await fetch('/courses.json', { cache: 'force-cache' });
      if (!res.ok) throw new Error('courses.json ' + res.status);
      const arr = await res.json();
      return arr.find(x => x.slug === SLUG) || null;
    } catch (e) {
      // 3) Last-ditch: the per-page LESSONS const is on the window in some
      //    course pages via `<script>const LESSONS=...</script>` (block-scoped
      //    const isn't on window, so this won't usually catch — but we try).
      if (Array.isArray(window.LESSONS)) {
        return { slug: SLUG, title: document.title.split('—')[0].trim(), accent: '#C4973A', lessons: window.LESSONS };
      }
      console.warn('[courses-room] could not load course:', e);
      return null;
    }
  }

  // ── Hash routing ─────────────────────────────────────────────────────────
  function readHashLesson() {
    const h = (location.hash || '').match(/^#(l\d+)/i);
    return h ? h[1].toLowerCase() : null;
  }
  function currentLessonIdx() {
    if (!state.lessons.length) return 0;
    const byId = state.lessons.findIndex(l => l.id === state.currentLessonId);
    if (byId !== -1) return byId;
    // fallback: first incomplete
    const fi = state.lessons.findIndex((_, i) => !state.completedIdx.has(i));
    return fi !== -1 ? fi : 0;
  }
  function syncCurrentLessonFromHash() {
    const fromHash = readHashLesson();
    if (fromHash && state.lessons.some(l => l.id === fromHash)) {
      state.currentLessonId = fromHash;
    } else if (!state.currentLessonId && state.lessons.length) {
      state.currentLessonId = state.lessons[currentLessonIdx()].id;
    }
  }

  // ── Cloud sync ───────────────────────────────────────────────────────────
  async function pullCloudIntoLocal() {
    if (!state.store) return;
    try {
      const [enrolled, progress] = await Promise.all([
        state.store.isEnrolled(SLUG),
        state.store.listMyProgress(SLUG),
      ]);
      state.enrolled = enrolled;
      // Merge: cloud-completed lessons → local set. We never *remove* from
      // local — if the user marks locally as a guest then signs in, those
      // marks survive and get pushed up by pushLocalToCloud below.
      const idxById = new Map(state.lessons.map((l, i) => [l.id, i]));
      for (const r of progress) {
        if (r.completed_at && idxById.has(r.lesson_id)) {
          state.completedIdx.add(idxById.get(r.lesson_id));
        }
      }
      writeLocalProgress(state.completedIdx);
    } catch (e) {
      console.warn('[courses-room] cloud pull failed:', e);
    }
  }
  async function pushLocalToCloud() {
    if (!state.store) return;
    try {
      // Auto-enroll on first sync if the user has any progress at all.
      if (!state.enrolled && state.completedIdx.size > 0) {
        await state.store.enroll(SLUG);
        state.enrolled = true;
      }
      // Upsert every completed index. Cheap for v0; could batch later.
      const tasks = [];
      for (const idx of state.completedIdx) {
        const l = state.lessons[idx]; if (!l) continue;
        tasks.push(state.store.setLessonComplete(SLUG, l.id, true));
      }
      await Promise.all(tasks);
    } catch (e) {
      console.warn('[courses-room] cloud push failed:', e);
    }
  }

  // ── Soft login gate ──────────────────────────────────────────────────────
  // The curriculum, lesson titles and descriptions stay readable to everyone
  // (editorial value: every teaching lives on the site). But *starting* a
  // lesson and *tracking progress* bind to an account — so a signed-out user
  // who clicks play or "Mark complete" gets a gentle sign-in prompt instead.
  function promptSignIn(action) {
    try { if (window.frqncy && window.frqncy.track) window.frqncy.track('course_login_prompted', { slug: SLUG, action: action }); } catch (_) {}
    if (document.getElementById('frq-cr-gate')) return;
    const next = encodeURIComponent(location.pathname + location.hash);
    const line = action === 'complete'
      ? 'Sign in to track your progress — it saves to your account and follows you across devices.'
      : 'Sign in to start this lesson. Your progress and notes save to your account, so you can pick up where you left off anywhere.';
    const el = document.createElement('div');
    el.id = 'frq-cr-gate';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.innerHTML =
      '<div class="frq-cr-gate-backdrop"></div>' +
      '<div class="frq-cr-gate-box">' +
        '<div class="frq-cr-gate-eyebrow">FRQNCY Courses</div>' +
        '<h3 class="frq-cr-gate-title">Continue with a free account</h3>' +
        '<p class="frq-cr-gate-copy">' + line + '</p>' +
        '<a class="frq-cr-gate-btn" href="/social/login/?next=' + next + '">Sign in / Create account</a>' +
        '<button class="frq-cr-gate-dismiss" type="button">Not now</button>' +
      '</div>';
    const css =
      '#frq-cr-gate{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:1.25rem}' +
      '#frq-cr-gate .frq-cr-gate-backdrop{position:absolute;inset:0;background:rgba(4,9,22,0.72);backdrop-filter:blur(3px)}' +
      '#frq-cr-gate .frq-cr-gate-box{position:relative;max-width:400px;width:100%;background:#0B1C3D;border:1px solid rgba(196,151,58,0.35);border-radius:6px;padding:2rem 1.75rem;text-align:center;box-shadow:0 24px 60px rgba(0,0,0,0.5)}' +
      '#frq-cr-gate .frq-cr-gate-eyebrow{font-size:0.6rem;letter-spacing:0.22em;text-transform:uppercase;color:#C4973A;margin-bottom:0.75rem}' +
      '#frq-cr-gate .frq-cr-gate-title{font-family:\'Cormorant\',serif;font-size:1.55rem;font-weight:500;color:#fff;margin:0 0 0.6rem}' +
      '#frq-cr-gate .frq-cr-gate-copy{font-size:0.85rem;line-height:1.6;color:rgba(255,255,255,0.72);margin:0 0 1.4rem}' +
      '#frq-cr-gate .frq-cr-gate-btn{display:block;background:#C4973A;color:#0B1C3D;font-size:0.72rem;letter-spacing:0.14em;text-transform:uppercase;font-weight:600;padding:12px 18px;border-radius:3px;text-decoration:none;margin-bottom:0.7rem}' +
      '#frq-cr-gate .frq-cr-gate-btn:hover{background:#d4a850}' +
      '#frq-cr-gate .frq-cr-gate-dismiss{background:none;border:none;color:rgba(255,255,255,0.5);font-size:0.72rem;letter-spacing:0.08em;cursor:pointer;padding:6px}' +
      '#frq-cr-gate .frq-cr-gate-dismiss:hover{color:rgba(255,255,255,0.8)}';
    if (!document.getElementById('frq-cr-gate-css')) {
      const s = document.createElement('style'); s.id = 'frq-cr-gate-css'; s.textContent = css; document.head.appendChild(s);
    }
    function close() { el.remove(); }
    el.querySelector('.frq-cr-gate-backdrop').addEventListener('click', close);
    el.querySelector('.frq-cr-gate-dismiss').addEventListener('click', close);
    document.addEventListener('keydown', function esc(e){ if(e.key==='Escape'){ close(); document.removeEventListener('keydown', esc); } });
    document.body.appendChild(el);
  }

  // ── Hook the per-page markComplete + playVideo (progress + play bind to login) ──
  function hookPerPageMarkComplete() {
    // Per-page course pages define `function markComplete(idx)` and
    // `function playVideo(el)` at the top of an inline <script>. Top-level
    // `function` declarations become global, so we can wrap them to gate on
    // login and (for completion) push to cloud.
    const orig = window.markComplete;
    if (typeof orig === 'function') {
      window.markComplete = function (idx) {
        if (state.authChecked && !state.user) { promptSignIn('complete'); return; }
        try { orig.call(this, idx); } finally {
          state.completedIdx = readLocalProgress();
          const l = state.lessons[idx];
          if (l && state.store) {
            // mark cloud — fire and forget
            state.store.setLessonComplete(SLUG, l.id, state.completedIdx.has(idx))
              .catch(e => console.warn('[courses-room] cloud setLessonComplete:', e));
            state.store.touchEnrollment(SLUG).catch(() => {});
          }
          rerenderLessons();
        }
      };
    }
    const origPlay = window.playVideo;
    if (typeof origPlay === 'function') {
      window.playVideo = function (el) {
        if (state.authChecked && !state.user) { promptSignIn('play'); return; }
        try { if (window.frqncy && window.frqncy.track) window.frqncy.track('lesson_started', { slug: SLUG }); } catch (_) {}
        return origPlay.call(this, el);
      };
    }
    // Also: any time another tab writes to localStorage, pull it in.
    window.addEventListener('storage', (e) => {
      if (e.key === PROGRESS_KEY) {
        state.completedIdx = readLocalProgress();
        rerenderLessons();
      }
    });
  }

  // ── Notes (private) ──────────────────────────────────────────────────────
  const saveNoteDebounced = debounce(async () => {
    if (!state.store || !state.currentLessonId) return;
    try {
      await state.store.saveNote(SLUG, state.currentLessonId, state.notes);
      state.notesSaveAt = Date.now();
      const status = $('#frq-cr .frq-cr-notes-saved');
      if (status) { status.textContent = 'Saved'; status.classList.add('show'); setTimeout(() => status.classList.remove('show'), 1200); }
    } catch (e) {
      console.warn('[courses-room] saveNote failed:', e);
      const status = $('#frq-cr .frq-cr-notes-saved');
      if (status) { status.textContent = 'Couldn\'t save — try again'; status.classList.add('show', 'err'); }
    }
  }, 1200);
  async function loadNote() {
    if (!state.store || !state.currentLessonId) { state.notes = ''; return; }
    try {
      const { body } = await state.store.getNote(SLUG, state.currentLessonId);
      state.notes = body || '';
    } catch (e) { state.notes = ''; console.warn('[courses-room] loadNote:', e); }
  }

  // ── Questions (public) ───────────────────────────────────────────────────
  async function loadQuestions() {
    if (!state.store || !state.currentLessonId) { state.questions = []; return; }
    try {
      state.questions = await state.store.listQuestions(SLUG, state.currentLessonId);
    } catch (e) { state.questions = []; console.warn('[courses-room] listQuestions:', e); }
  }
  async function loadReplies(qid) {
    if (!state.store) return [];
    if (state.repliesByQ.has(qid)) return state.repliesByQ.get(qid);
    try {
      const r = await state.store.listReplies(qid);
      state.repliesByQ.set(qid, r);
      return r;
    } catch (e) { console.warn('[courses-room] listReplies:', e); return []; }
  }

  // ── Mount shell + render ────────────────────────────────────────────────
  function mountShell() {
    if ($('#frq-cr')) return;
    const root = document.createElement('div');
    root.id = 'frq-cr';
    root.className = 'frq-cr';
    root.innerHTML = `
      <button class="frq-cr-pill" type="button" aria-expanded="false" aria-controls="frq-cr-panel">
        <span class="frq-cr-pill-dot" aria-hidden="true"></span>
        <span class="frq-cr-pill-label">Course room</span>
        <span class="frq-cr-pill-progress" hidden></span>
      </button>
      <div class="frq-cr-scrim" hidden></div>
      <aside id="frq-cr-panel" class="frq-cr-panel" hidden role="dialog" aria-label="Course room">
        <header class="frq-cr-head">
          <div class="frq-cr-head-meta">
            <div class="frq-cr-head-eyebrow">Course room</div>
            <h2 class="frq-cr-head-title"></h2>
          </div>
          <button class="frq-cr-close" type="button" aria-label="Close course room">✕</button>
        </header>

        <div class="frq-cr-progress-strip">
          <div class="frq-cr-pbar"><div class="frq-cr-pfill"></div></div>
          <div class="frq-cr-plabel"></div>
        </div>

        <div class="frq-cr-auth" hidden>
          <p class="frq-cr-auth-msg">Sign in to enroll, track progress, take private notes, and ask questions.</p>
          <a class="frq-cr-auth-cta" href="#">Sign in</a>
          <p class="frq-cr-auth-fine">Already have an account? You'll come back here.</p>
        </div>

        <div class="frq-cr-enroll-row" hidden>
          <div class="frq-cr-enroll-state"></div>
          <button class="frq-cr-enroll-btn" type="button"></button>
        </div>

        <nav class="frq-cr-tabs" role="tablist">
          <button class="frq-cr-tab is-active" data-tab="lessons" role="tab" aria-selected="true">Lessons</button>
          <button class="frq-cr-tab" data-tab="notes" role="tab" aria-selected="false">Notes</button>
          <button class="frq-cr-tab" data-tab="qa" role="tab" aria-selected="false">Q&amp;A</button>
        </nav>

        <section class="frq-cr-tab-pane" data-tab="lessons" role="tabpanel">
          <ol class="frq-cr-lesson-list"></ol>
        </section>

        <section class="frq-cr-tab-pane" data-tab="notes" role="tabpanel" hidden>
          <div class="frq-cr-notes-head">
            <span class="frq-cr-notes-eyebrow">Private note · only you can see this</span>
            <span class="frq-cr-cur-title"></span>
          </div>
          <textarea class="frq-cr-notes-area" placeholder="What did you notice? What needs another pass?" spellcheck="true"></textarea>
          <div class="frq-cr-notes-saved" aria-live="polite"></div>
        </section>

        <section class="frq-cr-tab-pane" data-tab="qa" role="tabpanel" hidden>
          <div class="frq-cr-qa-head">
            <span class="frq-cr-qa-eyebrow">Asked here, visible to the cohort &amp; teacher</span>
            <span class="frq-cr-cur-title"></span>
          </div>
          <div class="frq-cr-qa-list" aria-live="polite"></div>
          <form class="frq-cr-qa-form">
            <textarea required maxlength="4000" placeholder="Ask a question about this lesson…" rows="3"></textarea>
            <div class="frq-cr-qa-form-row">
              <span class="frq-cr-qa-charcount"></span>
              <button type="submit" class="frq-cr-qa-submit">Post question</button>
            </div>
          </form>
        </section>
      </aside>
    `;
    document.body.appendChild(root);

    // Pill toggles panel
    const pill = $('.frq-cr-pill', root);
    const panel = $('#frq-cr-panel', root);
    const scrim = $('.frq-cr-scrim', root);
    function open() {
      state.opened = true;
      panel.hidden = false; scrim.hidden = false;
      requestAnimationFrame(() => root.classList.add('is-open'));
      pill.setAttribute('aria-expanded', 'true');
      // refresh on open
      rerenderAll();
      if (state.store && state.currentLessonId) {
        loadNote().then(() => fillNotes());
        loadQuestions().then(() => renderQuestions());
      }
    }
    function close() {
      state.opened = false;
      root.classList.remove('is-open');
      pill.setAttribute('aria-expanded', 'false');
      setTimeout(() => { panel.hidden = true; scrim.hidden = true; }, 260);
    }
    pill.addEventListener('click', () => state.opened ? close() : open());
    scrim.addEventListener('click', close);
    $('.frq-cr-close', root).addEventListener('click', close);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && state.opened) close(); });

    // Tab switching
    $$('.frq-cr-tab', root).forEach(btn => {
      btn.addEventListener('click', () => {
        const t = btn.dataset.tab;
        state.activeTab = t;
        $$('.frq-cr-tab', root).forEach(b => {
          b.classList.toggle('is-active', b.dataset.tab === t);
          b.setAttribute('aria-selected', b.dataset.tab === t ? 'true' : 'false');
        });
        $$('.frq-cr-tab-pane', root).forEach(p => { p.hidden = p.dataset.tab !== t; });
        if (t === 'notes') { loadNote().then(() => fillNotes()); }
        if (t === 'qa')    { loadQuestions().then(() => renderQuestions()); }
      });
    });

    // Notes textarea
    $('.frq-cr-notes-area', root).addEventListener('input', (e) => {
      state.notes = e.target.value;
      saveNoteDebounced();
    });

    // Auth CTA
    $('.frq-cr-auth-cta', root).addEventListener('click', (e) => {
      e.preventDefault();
      const next = encodeURIComponent(location.pathname + location.hash);
      location.href = '/social/login/?next=' + next;
    });

    // Enroll/unenroll
    $('.frq-cr-enroll-btn', root).addEventListener('click', async () => {
      if (!state.store) return;
      try {
        if (state.enrolled) {
          await state.store.unenroll(SLUG);
          state.enrolled = false;
        } else {
          await state.store.enroll(SLUG);
          state.enrolled = true;
        }
        renderEnroll();
      } catch (e) {
        console.warn('[courses-room] enroll toggle:', e);
      }
    });

    // Q&A form
    $('.frq-cr-qa-form', root).addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!state.store) return;
      const ta = $('.frq-cr-qa-form textarea', root);
      const body = (ta.value || '').trim();
      if (!body) return;
      const submitBtn = $('.frq-cr-qa-submit', root);
      submitBtn.disabled = true;
      try {
        await state.store.askQuestion(SLUG, state.currentLessonId, body);
        ta.value = '';
        await loadQuestions();
        renderQuestions();
      } catch (err) {
        alert('Couldn\'t post: ' + (err.message || err));
      } finally {
        submitBtn.disabled = false;
      }
    });
    const qaTa = $('.frq-cr-qa-form textarea', root);
    qaTa.addEventListener('input', () => {
      const remaining = 4000 - qaTa.value.length;
      $('.frq-cr-qa-charcount', root).textContent = remaining < 300 ? (remaining + ' left') : '';
    });
  }

  // ── Renderers ────────────────────────────────────────────────────────────
  function rerenderAll() {
    fillHeader();
    renderProgressStrip();
    renderAuthBlock();
    renderEnroll();
    rerenderLessons();
    if (state.activeTab === 'notes') fillNotes();
    if (state.activeTab === 'qa') renderQuestions();
    syncTabAccess();
  }
  function fillHeader() {
    const root = $('#frq-cr');
    if (!root || !state.course) return;
    $('.frq-cr-head-title', root).textContent = state.course.title || SLUG;
    const accent = state.course.accent || '#C4973A';
    root.style.setProperty('--cr-accent', accent);
    const lesson = state.lessons[currentLessonIdx()];
    $$('.frq-cr-cur-title', root).forEach(el => {
      el.textContent = lesson ? lesson.title : '';
    });
  }
  function renderProgressStrip() {
    const root = $('#frq-cr');
    if (!root || !state.lessons.length) return;
    const total = state.lessons.length;
    const done = state.completedIdx.size;
    const pct = Math.round((done / total) * 100);
    $('.frq-cr-pfill', root).style.width = pct + '%';
    $('.frq-cr-plabel', root).textContent = done + ' of ' + total + ' lessons · ' + pct + '%';
    const pillProg = $('.frq-cr-pill-progress', root);
    pillProg.textContent = done + '/' + total;
    pillProg.hidden = total === 0;
  }
  function renderAuthBlock() {
    const root = $('#frq-cr');
    if (!root) return;
    const isOut = !state.user;
    $('.frq-cr-auth', root).hidden = !isOut;
    $('.frq-cr-enroll-row', root).hidden = isOut;
  }
  function renderEnroll() {
    const root = $('#frq-cr');
    if (!root || !state.user) return;
    const stateEl = $('.frq-cr-enroll-state', root);
    const btn = $('.frq-cr-enroll-btn', root);
    if (state.enrolled) {
      stateEl.innerHTML = '<span class="frq-cr-enroll-tick">✓</span> You\'re enrolled';
      btn.textContent = 'Unenroll';
      btn.classList.add('is-ghost');
    } else {
      stateEl.textContent = 'Not enrolled yet';
      btn.textContent = 'Enroll — it\'s free to track progress';
      btn.classList.remove('is-ghost');
    }
  }
  function syncTabAccess() {
    const root = $('#frq-cr');
    if (!root) return;
    const locked = !state.user;
    ['notes', 'qa'].forEach(t => {
      const tab = $('.frq-cr-tab[data-tab="' + t + '"]', root);
      if (tab) {
        tab.classList.toggle('is-locked', locked);
        tab.title = locked ? 'Sign in to use this' : '';
      }
    });
  }
  function rerenderLessons() {
    const root = $('#frq-cr');
    if (!root) return;
    const list = $('.frq-cr-lesson-list', root);
    if (!list || !state.lessons.length) return;
    const curIdx = currentLessonIdx();
    const hasModules = state.lessons.some(l => l.module);
    let curMod = null;
    list.innerHTML = state.lessons.map((l, i) => {
      const done = state.completedIdx.has(i);
      const isCur = i === curIdx;
      const typeGlyph =
        l.type === 'video'      ? '▶' :
        l.type === 'reflection' ? '✎' :
        l.type === 'reading'    ? '☰' : '·';
      // Module section header — emitted when the module name changes
      let head = '';
      if (hasModules) {
        const mod = l.module || '';
        if (mod !== curMod) { curMod = mod; if (mod) head = `<li class="frq-cr-module-head" aria-hidden="true">${esc(mod)}</li>`; }
      }
      return head + `
        <li class="frq-cr-lesson ${done ? 'is-done' : ''} ${isCur ? 'is-cur' : ''}" data-idx="${i}" data-id="${esc(l.id)}">
          <button class="frq-cr-lesson-check" type="button" aria-pressed="${done}" aria-label="${done ? 'Mark incomplete' : 'Mark complete'}: ${esc(l.title)}">
            ${done ? '<span aria-hidden="true">✓</span>' : ''}
          </button>
          <a class="frq-cr-lesson-link" href="#${esc(l.id)}">
            <span class="frq-cr-lesson-num">${(i + 1).toString().padStart(2, '0')}</span>
            <span class="frq-cr-lesson-title">${esc(l.title)}</span>
            <span class="frq-cr-lesson-meta">
              <span class="frq-cr-lesson-type">${typeGlyph} ${esc(l.type)}</span>
              ${l.duration ? '<span class="frq-cr-lesson-dur">' + esc(l.duration) + '</span>' : ''}
            </span>
          </a>
        </li>
      `;
    }).join('');
    // Wire check buttons
    $$('.frq-cr-lesson-check', list).forEach((btn, i) => {
      btn.addEventListener('click', async () => {
        const wasDone = state.completedIdx.has(i);
        if (wasDone) state.completedIdx.delete(i); else state.completedIdx.add(i);
        writeLocalProgress(state.completedIdx);
        renderProgressStrip();
        rerenderLessons();
        // Mirror to cloud
        if (state.store) {
          try {
            await state.store.setLessonComplete(SLUG, state.lessons[i].id, !wasDone);
            // Auto-enroll on first completion
            if (!state.enrolled && !wasDone) {
              await state.store.enroll(SLUG);
              state.enrolled = true;
              renderEnroll();
            }
            await state.store.touchEnrollment(SLUG).catch(() => {});
          } catch (e) {
            console.warn('[courses-room] setLessonComplete:', e);
          }
        }
        // Also nudge per-page UI: most course pages expose updateProgress + updateSidebar globals
        try { window.updateProgress && window.updateProgress(); } catch (_) {}
        try { window.updateSidebar && window.updateSidebar(); } catch (_) {}
      });
    });
    // Wire link clicks: just change hash and let the per-page showLesson respond
    $$('.frq-cr-lesson-link', list).forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        location.hash = a.getAttribute('href');
        // Per-page pages don't always listen to hashchange — call showLesson directly
        const idx = +a.closest('.frq-cr-lesson').dataset.idx;
        try { window.showLesson && window.showLesson(idx); } catch (_) {}
        state.currentLessonId = state.lessons[idx].id;
        fillHeader();
        rerenderLessons();
      });
    });
  }
  function fillNotes() {
    const root = $('#frq-cr');
    if (!root) return;
    const ta = $('.frq-cr-notes-area', root);
    if (ta && ta.value !== state.notes) ta.value = state.notes;
  }
  function renderQuestions() {
    const root = $('#frq-cr');
    if (!root) return;
    const list = $('.frq-cr-qa-list', root);
    if (!list) return;
    if (!state.user) {
      list.innerHTML = '<div class="frq-cr-qa-empty">Sign in to read and post questions for this lesson.</div>';
      $('.frq-cr-qa-form', root).hidden = true;
      return;
    }
    $('.frq-cr-qa-form', root).hidden = false;
    if (!state.questions.length) {
      list.innerHTML = '<div class="frq-cr-qa-empty">No questions yet for this lesson. Be the first.</div>';
      return;
    }
    list.innerHTML = state.questions.map(q => {
      const name = q.author_display_name || q.author_username || 'Student';
      const isMe = state.user && q.author_id === state.user.id;
      const expanded = state.expandedQ.has(q.id);
      return `
        <article class="frq-cr-q ${q.resolved_at ? 'is-resolved' : ''}" data-qid="${esc(q.id)}">
          <header class="frq-cr-q-head">
            <span class="frq-cr-q-author">${esc(name)}${q.author_is_teacher ? ' <span class="frq-cr-q-teacher">Teacher</span>' : ''}</span>
            <span class="frq-cr-q-time">${esc(fmtRel(q.created_at))}</span>
            ${q.resolved_at ? '<span class="frq-cr-q-tag">Resolved</span>' : ''}
          </header>
          <div class="frq-cr-q-body">${esc(q.body).replace(/\n/g, '<br>')}</div>
          <div class="frq-cr-q-actions">
            <button class="frq-cr-q-toggle" type="button" data-qid="${esc(q.id)}">
              ${expanded ? 'Hide replies' : (q.reply_count > 0 ? ('Show ' + q.reply_count + ' repl' + (q.reply_count === 1 ? 'y' : 'ies')) : 'Reply')}
            </button>
            ${(isMe || state.isTeacher) ? `<button class="frq-cr-q-resolve" type="button" data-qid="${esc(q.id)}">${q.resolved_at ? 'Reopen' : 'Mark resolved'}</button>` : ''}
            ${(isMe || state.isTeacher) ? `<button class="frq-cr-q-delete" type="button" data-qid="${esc(q.id)}">Delete</button>` : ''}
          </div>
          <div class="frq-cr-q-replies" data-qid="${esc(q.id)}" ${expanded ? '' : 'hidden'}></div>
        </article>
      `;
    }).join('');

    // Reply toggle
    $$('.frq-cr-q-toggle', list).forEach(btn => {
      btn.addEventListener('click', async () => {
        const qid = btn.dataset.qid;
        const wrap = list.querySelector('.frq-cr-q-replies[data-qid="' + qid + '"]');
        if (state.expandedQ.has(qid)) {
          state.expandedQ.delete(qid);
          wrap.hidden = true;
          btn.textContent = (state.questions.find(x => x.id === qid)?.reply_count || 0) > 0
            ? 'Show replies' : 'Reply';
        } else {
          state.expandedQ.add(qid);
          wrap.hidden = false;
          const replies = await loadReplies(qid);
          wrap.innerHTML = `
            ${replies.map(r => `
              <div class="frq-cr-r ${r.is_teacher ? 'is-teacher' : ''}">
                <div class="frq-cr-r-head">
                  <span class="frq-cr-r-author">${esc(r.author_display_name || r.author_username || 'Student')}${r.is_teacher ? ' <span class="frq-cr-q-teacher">Teacher</span>' : ''}</span>
                  <span class="frq-cr-r-time">${esc(fmtRel(r.created_at))}</span>
                </div>
                <div class="frq-cr-r-body">${esc(r.body).replace(/\n/g, '<br>')}</div>
              </div>
            `).join('')}
            <form class="frq-cr-r-form" data-qid="${esc(qid)}">
              <textarea required rows="2" placeholder="Reply…" maxlength="4000"></textarea>
              <button type="submit">Post reply</button>
            </form>
          `;
          const form = wrap.querySelector('.frq-cr-r-form');
          form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const ta = form.querySelector('textarea');
            const body = (ta.value || '').trim(); if (!body) return;
            const btn2 = form.querySelector('button'); btn2.disabled = true;
            try {
              await state.store.replyToQuestion(qid, body);
              state.repliesByQ.delete(qid);
              await loadQuestions();
              renderQuestions();
              state.expandedQ.add(qid); // keep open after re-render
              // Re-expand visually
              const newWrap = list.querySelector('.frq-cr-q-replies[data-qid="' + qid + '"]');
              const newBtn  = list.querySelector('.frq-cr-q-toggle[data-qid="' + qid + '"]');
              if (newBtn) newBtn.click();
            } catch (err) {
              alert('Couldn\'t reply: ' + (err.message || err));
            } finally {
              btn2.disabled = false;
            }
          });
          btn.textContent = 'Hide replies';
        }
      });
    });

    // Resolve / reopen
    $$('.frq-cr-q-resolve', list).forEach(btn => {
      btn.addEventListener('click', async () => {
        const qid = btn.dataset.qid;
        const q = state.questions.find(x => x.id === qid);
        try {
          await state.store.resolveQuestion(qid, !q.resolved_at);
          await loadQuestions();
          renderQuestions();
        } catch (e) { alert('Couldn\'t update: ' + (e.message || e)); }
      });
    });

    // Delete
    $$('.frq-cr-q-delete', list).forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this question and all its replies?')) return;
        const qid = btn.dataset.qid;
        try {
          await state.store.deleteQuestion(qid);
          await loadQuestions();
          renderQuestions();
        } catch (e) { alert('Couldn\'t delete: ' + (e.message || e)); }
      });
    });
  }

  // ── Hash watcher: keeps the overlay in sync with per-page nav ───────────
  function watchHash() {
    let last = readHashLesson();
    function tick() {
      const next = readHashLesson();
      if (next !== last) {
        last = next;
        if (next && state.lessons.some(l => l.id === next)) {
          state.currentLessonId = next;
          fillHeader();
          rerenderLessons();
          if (state.opened) {
            if (state.activeTab === 'notes') loadNote().then(fillNotes);
            if (state.activeTab === 'qa')    loadQuestions().then(renderQuestions);
          }
        }
      }
    }
    window.addEventListener('hashchange', tick);
    // some pages set hash imperatively without firing the event in old code
    setInterval(tick, 700);
  }

  // ── Boot ────────────────────────────────────────────────────────────────
  async function boot() {
    // 1) Load course
    state.course = await loadCourse();
    if (!state.course || !Array.isArray(state.course.lessons) || !state.course.lessons.length) {
      console.warn('[courses-room] no course / no lessons for', SLUG);
      return;
    }
    state.lessons = state.course.lessons;

    // 2) Mount UI
    mountShell();
    syncCurrentLessonFromHash();
    fillHeader();
    renderProgressStrip();
    rerenderLessons();

    // 3) Hook the per-page completion path (works on pages that expose markComplete)
    hookPerPageMarkComplete();

    // 4) Wait for Supabase auth, then sync
    if (window.frqncy && window.frqncy.ready) {
      try {
        await window.frqncy.ready;
        state.user = await window.frqncy.auth.getUser();
        state.authChecked = true;  // gate is armed only once we truly know the auth state
        if (state.user) {
          state.store = window.frqncy.coursesStore(state.user);
          state.isTeacher = await state.store.amTeacher(SLUG).catch(() => false);
          await pullCloudIntoLocal();
          await pushLocalToCloud();
          renderProgressStrip();
          rerenderLessons();
        }
        renderAuthBlock();
        renderEnroll();
        syncTabAccess();
        // Subscribe to subsequent auth changes (sign in mid-session)
        window.frqncy.onAuth(async (u) => {
          state.user = u || null;
          state.authChecked = true;
          state.store = u ? window.frqncy.coursesStore(u) : null;
          if (state.store) {
            state.isTeacher = await state.store.amTeacher(SLUG).catch(() => false);
            await pullCloudIntoLocal();
            await pushLocalToCloud();
          } else {
            state.enrolled = false;
            state.isTeacher = false;
          }
          rerenderAll();
        });
      } catch (e) {
        console.warn('[courses-room] auth wait failed:', e);
      }
    }

    // 5) Watch the hash for per-page lesson changes
    watchHash();

    // 6) Handle deep-link params (e.g. teacher dashboard linking to a question).
    //    Recognised query params: cr=open · tab=lessons|notes|qa · q=<question-uuid>
    handleDeepLink();
  }

  function handleDeepLink() {
    try {
      const params = new URLSearchParams(location.search);
      if (params.get('cr') !== 'open') return;
      const tab = params.get('tab');
      const qid = params.get('q');

      // Defer to next frame so mountShell's listeners are attached.
      requestAnimationFrame(() => {
        const pill = $('#frq-cr .frq-cr-pill');
        if (pill && !state.opened) pill.click();

        if (tab && ['lessons', 'notes', 'qa'].includes(tab)) {
          // Logged-out users can't open Notes / QA.
          if ((tab === 'notes' || tab === 'qa') && !state.user) return;
          const tabBtn = $('.frq-cr-tab[data-tab="' + tab + '"]');
          if (tabBtn) tabBtn.click();
        }

        if (qid && state.user) {
          // Wait for questions to load (renderQuestions is async via tab-click).
          // Poll the DOM up to ~3s for the matching .frq-cr-q[data-qid].
          let tries = 0;
          const iv = setInterval(() => {
            tries++;
            const el = document.querySelector('#frq-cr .frq-cr-q[data-qid="' + qid.replace(/"/g, '') + '"]');
            if (el) {
              clearInterval(iv);
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              // Briefly highlight
              el.style.transition = 'box-shadow .4s';
              el.style.boxShadow = '0 0 0 2px var(--cr-accent)';
              setTimeout(() => { el.style.boxShadow = ''; }, 1800);
              // Auto-expand replies
              const toggle = el.querySelector('.frq-cr-q-toggle');
              if (toggle && !state.expandedQ.has(qid)) toggle.click();
            } else if (tries > 30) {
              clearInterval(iv);
            }
          }, 100);
        }
      });
    } catch (e) {
      console.warn('[courses-room] deep-link:', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
