/* ============================================================================
 * FRQNCY — VBRTN profile store (offline-first, cloud-mirrored)
 * ----------------------------------------------------------------------------
 * One shared helper so the My FRQNCY hub, the intake, and the VBRTN companion
 * all read and write the founding-block profile the same way:
 *
 *   - ALWAYS save to localStorage first (instant, works offline, works logged-out)
 *   - WHEN logged in (via the shared /assets/frqncy-supabase.js auth), mirror
 *     every write up to the cloud and pull the cloud copy down on login
 *   - On login, MERGE local vs cloud by newest `_updatedAt` so switching devices
 *     never silently clobbers the more recent profile
 *
 * Usage on a page (load AFTER frqncy-supabase.js, both `defer`):
 *   <script src="/assets/frqncy-supabase.js" defer></script>
 *   <script src="/assets/frqncy-vbrtn-store.js" defer></script>
 *   ...
 *   const profile = FRQNCYVbrtn.load();         // localStorage, instant
 *   FRQNCYVbrtn.save(profile);                  // local + cloud-if-logged-in
 *   FRQNCYVbrtn.onSync(p => renderAll(p));      // fires when cloud data arrives
 *
 * Degrades gracefully: if frqncy-supabase.js never loads, everything still
 * works as plain localStorage — no errors, no cloud.
 * ========================================================================== */

(function () {
  'use strict';

  const KEY = 'frqncy:vbrtn:profile';

  // ── Local read / write ──────────────────────────────────────────────────
  function localLoad() {
    try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null; }
    catch (_) { return null; }
  }
  function localSave(p) {
    try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (_) {}
  }

  // ── "How fresh is this profile?" — for newest-wins merge ─────────────────
  function activityTime(p) {
    if (!p) return 0;
    if (p._updatedAt) return p._updatedAt;
    let t = 0;
    if (p.history && p.history.lastSeen) t = Math.max(t, p.history.lastSeen);
    if (p.baseline) {
      if (p.baseline.intakeCompletedAt) t = Math.max(t, p.baseline.intakeCompletedAt);
      if (p.baseline.intakeStartedAt)   t = Math.max(t, p.baseline.intakeStartedAt);
    }
    if (p._intakeAnswers) {
      for (const k in p._intakeAnswers) {
        const a = p._intakeAnswers[k];
        if (a && a.at) t = Math.max(t, a.at);
      }
    }
    return t;
  }
  function answeredCount(p) {
    return (p && p._intakeAnswers) ? Object.keys(p._intakeAnswers).length : 0;
  }
  // Pick the profile to keep when both a local and a cloud copy exist.
  // Newest activity wins; ties break toward whichever has more answers.
  function chooseProfile(local, cloud) {
    if (!cloud) return local;
    if (!local) return cloud;
    const lt = activityTime(local), ct = activityTime(cloud);
    if (ct > lt) return cloud;
    if (lt > ct) return local;
    return answeredCount(cloud) > answeredCount(local) ? cloud : local;
  }

  // ── State ───────────────────────────────────────────────────────────────
  let cloud = null;          // vbrtnStore(user) when logged in, else null
  let status = 'local';      // 'local' | 'syncing' | 'synced' | 'error'
  let syncListeners = [];

  function setStatus(s) { status = s; renderStatus(); }

  // ── Public API ──────────────────────────────────────────────────────────
  const api = {
    KEY,

    /** Read the profile (localStorage — instant, always current). */
    load() { return localLoad(); },

    /** Save the profile: localStorage always, cloud too when logged in. */
    save(p) {
      if (p && typeof p === 'object') p._updatedAt = Date.now();
      localSave(p);
      if (cloud) {
        setStatus('syncing');
        cloud.setState(p)
          .then(() => setStatus('synced'))
          .catch((e) => { console.warn('[vbrtn] cloud save failed', e); setStatus('error'); });
      }
      return p;
    },

    /** True once a cloud copy is being mirrored. */
    get isSynced() { return !!cloud; },
    get status() { return status; },

    /** Register a callback fired after a cloud pull/merge completes. */
    onSync(fn) { if (typeof fn === 'function') syncListeners.push(fn); },

    /** Force the status pill to re-render (e.g. after injecting #vbrtn-sync). */
    refreshStatus() { renderStatus(); },
  };

  function emitSync(p) {
    for (const fn of syncListeners) { try { fn(p); } catch (e) { console.error(e); } }
  }

  // ── Cloud attach on login ───────────────────────────────────────────────
  async function attach(user) {
    if (!window.frqncy || typeof window.frqncy.vbrtnStore !== 'function') return;
    try {
      setStatus('syncing');
      cloud = window.frqncy.vbrtnStore(user);
      let remote = null;
      try { remote = await cloud.getState(); } catch (e) { console.warn('[vbrtn] cloud read failed', e); }
      const local = localLoad();
      const winner = chooseProfile(local, remote);
      if (winner) {
        localSave(winner);
        // If the winning copy isn't already what's in the cloud, push it up.
        if (!remote || activityTime(winner) > activityTime(remote)) {
          try { await cloud.setState(winner); } catch (e) { console.warn('[vbrtn] cloud push failed', e); }
        }
      }
      setStatus('synced');
      emitSync(winner);
    } catch (e) {
      console.warn('[vbrtn] attach failed', e);
      setStatus('error');
    }
  }
  function detach() {
    cloud = null;
    setStatus('local');
  }

  // ── Honest status pill (renders into #vbrtn-sync if present) ─────────────
  function renderStatus() {
    const el = document.getElementById('vbrtn-sync');
    if (!el) return;
    const next = encodeURIComponent(location.pathname + location.search);
    let html = '';
    if (status === 'synced') {
      html = '<span class="vbrtn-sync-dot ok"></span>Synced to your account';
    } else if (status === 'syncing') {
      html = '<span class="vbrtn-sync-dot"></span>Syncing…';
    } else if (status === 'error') {
      html = '<span class="vbrtn-sync-dot warn"></span>Saved on this device · cloud unavailable';
    } else {
      html = '<span class="vbrtn-sync-dot"></span>Saved on this device · '
           + '<a class="vbrtn-sync-link" href="/social/login/?next=' + next + '">sign in to keep it everywhere</a>';
    }
    el.innerHTML = html;
  }

  // Inject the tiny status-pill styling once (so pages only add a <div>).
  function injectStyle() {
    if (document.getElementById('vbrtn-sync-style')) return;
    const s = document.createElement('style');
    s.id = 'vbrtn-sync-style';
    s.textContent =
      '#vbrtn-sync{font-family:"Cormorant Garamond",Georgia,serif;font-style:italic;' +
      'font-size:13px;letter-spacing:.03em;color:#7d7866;display:inline-flex;align-items:center;gap:7px}' +
      '#vbrtn-sync .vbrtn-sync-dot{width:6px;height:6px;border-radius:50%;background:#7a5d22;' +
      'display:inline-block;flex:0 0 auto}' +
      '#vbrtn-sync .vbrtn-sync-dot.ok{background:#5BC79A}' +
      '#vbrtn-sync .vbrtn-sync-dot.warn{background:#C4973A}' +
      '#vbrtn-sync .vbrtn-sync-link{color:#C4973A;text-decoration:none;border-bottom:1px solid rgba(196,151,58,.35)}' +
      '#vbrtn-sync .vbrtn-sync-link:hover{color:#dcb15a}';
    document.head.appendChild(s);
  }

  // ── Boot ────────────────────────────────────────────────────────────────
  function init() {
    injectStyle();
    renderStatus();
    if (!window.frqncy || !window.frqncy.ready) return; // local-only, no auth layer
    window.frqncy.ready.then(() => {
      window.frqncy.onAuth((user) => { if (user) attach(user); else detach(); });
    }).catch(() => {});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.FRQNCYVbrtn = api;
})();
