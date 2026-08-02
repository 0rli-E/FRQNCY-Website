/**
 * frqncy-watch-progress.js — resume-where-you-left-off for /watch/
 *
 * Offline-first: writes a per-video position map to localStorage
 * (`frqncy.watch.v1`). When the visitor is signed in (via
 * assets/frqncy-supabase.js), mirrors the same map to their account through
 * `frqncy.videoProgressStore(user)` (one row in `charts`, name='WatchProgress'),
 * so "keep watching" follows them across devices. Newest-updatedAt-wins merge
 * on login means switching devices never clobbers newer progress.
 *
 * Position is read from the YouTube IFrame Player API. Non-YouTube providers
 * (Vimeo/Gaia) still get coarse "opened / watched" tracking, just no second-
 * accurate resume.
 *
 * Public surface (window.FRQNCYWatch):
 *   getResume(videoId)            → seconds to start playback at (0 if none/complete)
 *   getProgress(videoId)          → { pos, dur, pct, completed } | null
 *   getContinueWatching(limit)    → [{ videoId, ...entry }] newest-first, unfinished
 *   attachYouTube(iframeEl, video)→ start tracking an opened YouTube video
 *   stop()                        → flush + detach the current player
 *   onChange(fn)                  → subscribe to store changes (re-render hook)
 *
 * No dependencies beyond the (optional) YouTube IFrame API, loaded on demand.
 */
(function () {
  'use strict';

  var LS_KEY       = 'frqncy.watch.v1';
  var COMPLETE_PCT = 90;   // ≥ this % counts as finished — don't offer resume
  var MIN_SAVE_SEC = 5;    // ignore blips under this many seconds watched
  var POLL_MS      = 5000; // how often to snapshot position while playing

  // ─── Store (localStorage, cloud-mirrored when logged in) ────────────────────

  var mem = load();
  var listeners = [];
  var cloud = null;        // videoProgressStore() once logged in

  function load() {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; }
    catch (_) { return {}; }
  }
  function persistLocal() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(mem)); } catch (_) {}
  }
  function emit() { listeners.forEach(function (fn) { try { fn(mem); } catch (_) {} }); }

  function nowIso() { return new Date().toISOString(); }

  // Merge two maps, newest _updatedAt per video wins.
  function mergeMaps(a, b) {
    var out = {};
    var keys = {};
    Object.keys(a || {}).forEach(function (k) { keys[k] = 1; });
    Object.keys(b || {}).forEach(function (k) { keys[k] = 1; });
    Object.keys(keys).forEach(function (k) {
      var ea = (a || {})[k], eb = (b || {})[k];
      if (!ea) { out[k] = eb; return; }
      if (!eb) { out[k] = ea; return; }
      out[k] = (new Date(eb.updatedAt || 0) > new Date(ea.updatedAt || 0)) ? eb : ea;
    });
    return out;
  }

  function saveEntry(videoId, patch) {
    if (!videoId) return;
    var prev = mem[videoId] || {};
    mem[videoId] = Object.assign({}, prev, patch, { updatedAt: nowIso() });
    persistLocal();
    emit();
    if (cloud) {
      // Fire-and-forget cloud mirror; localStorage is the source of truth locally.
      cloud.setState(mem).catch(function () {});
    }
  }

  // ─── Cloud swap on login ────────────────────────────────────────────────────

  function wireAuth() {
    if (!window.frqncy || !window.frqncy.onAuth) return;
    function adopt(user) {
      if (!user) { cloud = null; return; }
      try {
        cloud = window.frqncy.videoProgressStore(user);
      } catch (_) { cloud = null; return; }
      cloud.getState().then(function (remote) {
        mem = mergeMaps(mem, remote || {});
        persistLocal();
        emit();
        // Push the merged result back so both sides converge.
        cloud.setState(mem).catch(function () {});
      }).catch(function () {});
    }
    if (window.frqncy.ready && window.frqncy.auth) {
      window.frqncy.ready.then(function () {
        return window.frqncy.auth.getUser();
      }).then(adopt).catch(function () {});
    }
    window.frqncy.onAuth(adopt);
  }

  // ─── YouTube IFrame API (loaded on demand) ──────────────────────────────────

  var ytReady = null;
  function loadYT() {
    if (ytReady) return ytReady;
    ytReady = new Promise(function (resolve) {
      if (window.YT && window.YT.Player) { resolve(window.YT); return; }
      var prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () {
        if (typeof prev === 'function') { try { prev(); } catch (_) {} }
        resolve(window.YT);
      };
      var tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    });
    return ytReady;
  }

  // ─── Active player tracking ─────────────────────────────────────────────────

  var active = null; // { player, videoId, video, timer, dur, lastPos, started }

  function track(msg, props) {
    try { if (window.frqncy && window.frqncy.track) window.frqncy.track(msg, props); } catch (_) {}
  }

  function snapshot() {
    if (!active || !active.player || typeof active.player.getCurrentTime !== 'function') return;
    var pos, dur;
    try { pos = active.player.getCurrentTime(); dur = active.player.getDuration(); }
    catch (_) { return; }
    if (!dur || dur < 1 || pos < MIN_SAVE_SEC) return;
    var pct = Math.min(100, Math.round(pos / dur * 100));
    var completed = pct >= COMPLETE_PCT;
    active.lastPos = pos; active.dur = dur;
    saveEntry(active.videoId, {
      pos: Math.floor(pos),
      dur: Math.floor(dur),
      pct: pct,
      completed: completed,
      title: active.video.title || '',
      channel: active.video.channel || '',
      topicId: active.video.topicId || '',
      topicLabel: active.video.topicLabel || '',
      provider: active.video.provider || 'youtube',
    });
    track('video_progress', { video_id: active.videoId, pct: pct, pos: Math.floor(pos) });
    if (completed && !active.completedFired) {
      active.completedFired = true;
      track('video_completed', { video_id: active.videoId });
    }
  }

  function attachYouTube(iframeEl, video) {
    if (!iframeEl || !video) return;
    var videoId = video.video_id || video.youtube_id || video.id;
    detach(); // clean any prior player
    track('video_started', { video_id: videoId, title: video.title || '', topic: video.topicId || '' });
    loadYT().then(function (YT) {
      // Guard: modal may have closed before the API finished loading.
      if (!document.body.contains(iframeEl)) return;
      var player;
      try {
        player = new YT.Player(iframeEl, {
          events: {
            onStateChange: function (e) {
              // 1 = playing, 2 = paused, 0 = ended
              if (e.data === 2 || e.data === 0) snapshot();
              if (e.data === 0) { // ended → force-complete
                if (active) {
                  saveEntry(active.videoId, { pct: 100, completed: true, pos: Math.floor(active.dur || 0) });
                  if (!active.completedFired) { active.completedFired = true; track('video_completed', { video_id: active.videoId }); }
                }
              }
            }
          }
        });
      } catch (_) { return; }
      active = { player: player, videoId: videoId, video: video, dur: 0, lastPos: 0, completedFired: false,
        timer: setInterval(snapshot, POLL_MS) };
    });
  }

  function detach() {
    if (!active) return;
    if (active.timer) clearInterval(active.timer);
    snapshot();
    try { if (active.player && active.player.destroy) active.player.destroy(); } catch (_) {}
    active = null;
  }

  // Save on tab hide / unload too — modal close isn't the only exit.
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') snapshot();
  });
  window.addEventListener('pagehide', function () { snapshot(); });

  // ─── Public API ─────────────────────────────────────────────────────────────

  window.FRQNCYWatch = {
    getResume: function (videoId) {
      var e = mem[videoId];
      if (!e || e.completed) return 0;
      // Rewind a few seconds for context; never past the start.
      return Math.max(0, (e.pos || 0) - 4);
    },
    getProgress: function (videoId) {
      var e = mem[videoId];
      if (!e) return null;
      return { pos: e.pos || 0, dur: e.dur || 0, pct: e.pct || 0, completed: !!e.completed };
    },
    getContinueWatching: function (limit) {
      var arr = Object.keys(mem).map(function (id) {
        return Object.assign({ videoId: id }, mem[id]);
      }).filter(function (e) {
        return !e.completed && (e.pct || 0) >= 1 && (e.pct || 0) < COMPLETE_PCT;
      }).sort(function (a, b) {
        return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
      });
      return typeof limit === 'number' ? arr.slice(0, limit) : arr;
    },
    attachYouTube: attachYouTube,
    stop: detach,
    onChange: function (fn) { if (typeof fn === 'function') listeners.push(fn); },
  };

  wireAuth();
})();
