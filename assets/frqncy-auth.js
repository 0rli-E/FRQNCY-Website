/* ============================================================================
 * FRQNCY — universal sign-in
 * ----------------------------------------------------------------------------
 * One account, one session, every surface: the static site, My FRQNCY, the
 * Sanctuary, VBRTN, the Courses rooms and NRG all run on the same Supabase
 * project on the same origin, so the session has ALWAYS been shared. What was
 * missing was a way to sign in from anywhere but /social/login/ — 1400+ pages
 * offered no affordance at all, and the one link that existed threw people out
 * of the installed app (scoped to /my-frqncy/) into a browser tab.
 *
 * So: a sheet that opens on the page you are already on, and a nav control that
 * mounts itself wherever there is a nav to mount into.
 *
 * COST WHEN LOGGED OUT IS ZERO. The Supabase SDK (~40kb) is not fetched until
 * either (a) a stored session is found in localStorage, (b) the URL carries a
 * magic-link token, or (c) the visitor actually clicks "Sign in". A reader on a
 * topic page downloads nothing.
 *
 * Usage — nothing, on any page that loads /mobile-nav.js (it bootstraps this).
 * Explicitly:  <script src="/assets/frqncy-auth.js" defer></script>
 * Programmatic:
 *   window.frqncyAuth.open()                  // open the sign-in sheet
 *   window.frqncyAuth.isSignedIn()            // sync, cheap, localStorage-only
 *   window.frqncyAuth.onAuth(u => ...)        // fires now + on every change
 *   window.frqncyAuth.signOut()
 *   window.addEventListener('frqncy:auth', e => e.detail.user)
 *
 * Opt out on a page that has its own control:  <body data-frqncy-auth="off">
 * Choose where the control mounts:             <span data-frqncy-auth-slot></span>
 * ========================================================================== */

(function () {
  'use strict';

  if (window.frqncyAuth) return;

  // ── Config ────────────────────────────────────────────────────────────────
  // Project ref must match /assets/frqncy-supabase.js and /social-config.js.
  // It is what makes the session universal: supabase-js keys its localStorage
  // entry by project ref, so every surface on this origin reads the same one.
  var PROJECT_REF  = 'vyazlspbmwmlyncdlezh';
  var STORAGE_KEY  = 'sb-' + PROJECT_REF + '-auth-token';
  var HELPER_SRC   = '/assets/frqncy-supabase.js';

  var listeners = [];
  var cachedUser = null;
  var clientPromise = null;

  // ── Stored-session read (no network, no SDK) ──────────────────────────────
  // supabase-js v2 writes the session as JSON under STORAGE_KEY. Older builds
  // wrapped it in { currentSession }. Read both shapes; treat an expired token
  // as signed-out for painting purposes — the SDK will refresh it if it can.
  function storedSession() {
    var raw;
    try { raw = window.localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
    if (!raw) return null;
    var s;
    try { s = JSON.parse(raw); } catch (e) { return null; }
    if (s && s.currentSession) s = s.currentSession;
    if (!s || !s.access_token) return null;
    if (s.expires_at && (s.expires_at * 1000) < Date.now()) {
      // Expired access token. A refresh token may still revive it, so keep the
      // user for painting but let the SDK be the authority once it loads.
      return s.refresh_token ? s : null;
    }
    return s;
  }

  function storedUser() {
    var s = storedSession();
    return (s && s.user) ? s.user : null;
  }

  function label(user) {
    if (!user) return '';
    var m = user.user_metadata || {};
    return m.username || m.display_name || m.full_name ||
           (user.email || '').split('@')[0] || 'You';
  }

  function notify(user) {
    cachedUser = user || null;
    for (var i = 0; i < listeners.length; i++) {
      try { listeners[i](cachedUser); } catch (e) { /* a bad listener is not fatal */ }
    }
    try {
      window.dispatchEvent(new CustomEvent('frqncy:auth', { detail: { user: cachedUser } }));
    } catch (e) { /* older browsers */ }
    if (cachedUser) broadcastToShell();
    paint();
  }

  // ── VBRTN app-shell hand-off ──────────────────────────────────────────────
  // The mobile shell embeds this site in an iframe on its own webview origin.
  // Signing in HERE should sign the shell's local pages in too: post the
  // session to the parent, targetOrigin-restricted to the app origins, so the
  // browser guarantees no other embedder can receive it.
  var SHELL_ORIGINS = ['https://localhost', 'capacitor://localhost', 'http://localhost:5173'];
  function broadcastToShell() {
    if (window.parent === window) return;
    var s = storedSession();
    if (!s || !s.access_token) return;
    for (var i = 0; i < SHELL_ORIGINS.length; i++) {
      try { window.parent.postMessage({ type: 'frqncy:session', session: s }, SHELL_ORIGINS[i]); } catch (e) {}
    }
  }

  // The inverse direction: the shell appends its session to any site URL it
  // loads as a #frqncy_sso fragment (never sent over the network). Consume it,
  // adopt the session, and strip the hash before anything else reads it.
  function consumeShellSso() {
    var m = (location.hash || '').match(/frqncy_sso=([^&]+)/);
    if (!m) return;
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
    var payload = null;
    try { payload = JSON.parse(atob(decodeURIComponent(m[1]))); } catch (e) { return; }
    if (!payload || !payload.access_token || !payload.refresh_token) return;
    if (storedSession()) return; // already signed in here — don't overwrite
    ensureClient()
      .then(function () {
        return window.frqncy.auth.setSession({
          access_token: payload.access_token,
          refresh_token: payload.refresh_token,
        });
      })
      .catch(function () { /* invalid or expired hand-off — stay signed out */ });
  }

  // ── The Supabase client, loaded only when actually needed ─────────────────
  function ensureClient() {
    if (clientPromise) return clientPromise;
    clientPromise = new Promise(function (resolve, reject) {
      function attach() {
        window.frqncy.ready
          .then(function () {
            // Mirror the helper's auth changes into our own channel so pages
            // that only know about frqncyAuth still hear about sign-outs that
            // happen elsewhere (another tab, the NRG login page, the store).
            if (typeof window.frqncy.onAuth === 'function') {
              window.frqncy.onAuth(function (u) { notify(u); });
            }
            return window.frqncy.auth.getUser();
          })
          .then(function (u) { notify(u); resolve(window.frqncy); })
          .catch(function (err) { resolve(window.frqncy); void err; });
      }
      if (window.frqncy && window.frqncy.ready) return attach();
      var s = document.createElement('script');
      s.src = HELPER_SRC;
      s.async = true;
      s.onload = function () {
        if (window.frqncy && window.frqncy.ready) attach();
        else reject(new Error('frqncy-supabase.js loaded but exposed nothing'));
      };
      s.onerror = function () { reject(new Error('Could not load ' + HELPER_SRC)); };
      document.head.appendChild(s);
    });
    return clientPromise;
  }

  // ── Styles ────────────────────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('frqncy-auth-style')) return;
    var st = document.createElement('style');
    st.id = 'frqncy-auth-style';
    st.textContent = [
      '.frqa-ctl{font-family:"Jost",system-ui,sans-serif;font-size:0.64rem;letter-spacing:0.14em;',
      'text-transform:uppercase;color:inherit;opacity:0.72;background:none;border:none;padding:6px 2px;',
      'cursor:pointer;white-space:nowrap;transition:opacity .2s,color .2s;}',
      '.frqa-ctl:hover{opacity:1;color:#C4973A;}',
      '.frqa-ctl[disabled]{cursor:default;opacity:0.4;}',
      '.frqa-who{font-family:"Jost",system-ui,sans-serif;font-size:0.62rem;letter-spacing:0.1em;',
      'text-transform:uppercase;color:#C4973A;text-decoration:none;white-space:nowrap;max-width:11ch;',
      'overflow:hidden;text-overflow:ellipsis;display:inline-block;vertical-align:middle;}',
      // On a phone the nav links collapse into the hamburger at 720px. Sign-in
      // is not a destination — burying it in a drawer is how VBRTN's login went
      // unfound for months — so the phone gets its own copy in the bar itself,
      // beside the hamburger, and the list copy stands down.
      '.frqa-bar{display:none;align-items:center;gap:8px;margin-left:auto;padding-right:4px;}',
      '@media (max-width:720px){.frqa-bar{display:inline-flex;}li[data-frqa]{display:none;}}',
      '.frqa-bar.frqa-solo{display:inline-flex;}',
      /* The sheet is a <dialog> opened with showModal(), which puts it in the
         browser's top layer — above every z-index on the page. A plain
         positioned div loses this fight: topic-page heroes paint straight
         through it. The div path below is only the pre-dialog fallback. */
      'dialog.frqa-sheet{border:0;padding:20px;background:transparent;overflow:visible;',
      'max-width:100vw;max-height:100vh;width:100%;height:100%;box-sizing:border-box;',
      'display:flex;align-items:center;justify-content:center;}',
      'dialog.frqa-sheet::backdrop{background:rgba(4,10,22,0.72);',
      '-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);}',
      'dialog.frqa-sheet:not([open]){display:none;}',
      'div.frqa-sheet{position:fixed;inset:0;z-index:2147483000;background:rgba(4,10,22,0.72);',
      '-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);display:flex;align-items:center;',
      'justify-content:center;padding:20px;animation:frqaIn .18s ease-out;}',
      '@keyframes frqaIn{from{opacity:0}to{opacity:1}}',
      '.frqa-card{width:100%;max-width:380px;background:#0B1C3D;border:1px solid rgba(196,151,58,0.28);',
      'border-radius:4px;padding:26px 24px 22px;color:#E6EDF8;font-family:"Jost",system-ui,sans-serif;',
      'box-shadow:0 24px 60px rgba(0,0,0,0.5);max-height:92vh;overflow-y:auto;}',
      '.frqa-card h2{font-family:"Cormorant",Georgia,serif;font-size:1.5rem;font-weight:400;margin:0 0 6px;color:#fff;}',
      '.frqa-card .frqa-lede{font-size:0.82rem;line-height:1.5;color:#93A9C8;margin:0 0 18px;}',
      '.frqa-card label{display:block;font-size:0.6rem;letter-spacing:0.16em;text-transform:uppercase;',
      'color:#7B92B4;margin:12px 0 5px;}',
      '.frqa-card input{width:100%;box-sizing:border-box;background:#071530;color:#fff;font-size:16px;',
      'font-family:inherit;border:1px solid rgba(255,255,255,0.14);border-radius:3px;padding:11px 12px;}',
      '.frqa-card input:focus{outline:none;border-color:rgba(196,151,58,0.6);}',
      '.frqa-actions{display:flex;gap:8px;margin-top:18px;}',
      '.frqa-btn{flex:1;font-family:inherit;font-size:0.68rem;letter-spacing:0.16em;text-transform:uppercase;',
      'padding:11px 12px;border-radius:3px;cursor:pointer;transition:opacity .2s;}',
      '.frqa-btn:hover{opacity:0.85;}.frqa-btn[disabled]{opacity:0.45;cursor:default;}',
      '.frqa-primary{background:#C4973A;color:#0B1C3D;border:1px solid #C4973A;font-weight:500;}',
      '.frqa-ghost{background:none;color:#93A9C8;border:1px solid rgba(255,255,255,0.16);}',
      '.frqa-msg{font-size:0.76rem;line-height:1.45;margin-top:12px;min-height:1em;color:#93A9C8;}',
      '.frqa-msg.err{color:#E4907F;}.frqa-msg.ok{color:#5BC79A;}',
      '.frqa-alt{font-size:0.74rem;color:#7B92B4;margin-top:14px;line-height:1.5;',
      'border-top:1px solid rgba(255,255,255,0.08);padding-top:12px;}',
      '.frqa-alt button{background:none;border:none;color:#C4973A;font:inherit;cursor:pointer;',
      'text-decoration:underline;padding:0;}',
      '.frqa-tabs{display:flex;gap:0;margin:0 0 16px;border:1px solid rgba(255,255,255,0.12);border-radius:3px;overflow:hidden;}',
      '.frqa-tab{flex:1;background:none;border:none;color:#7B92B4;font-family:inherit;font-size:0.64rem;',
      'letter-spacing:0.14em;text-transform:uppercase;padding:9px 6px;cursor:pointer;}',
      '.frqa-tab[aria-selected="true"]{background:rgba(196,151,58,0.14);color:#C4973A;}'
    ].join('');
    document.head.appendChild(st);
  }

  // ── The nav control ───────────────────────────────────────────────────────
  function slots() {
    var out = [];
    var explicit = document.querySelectorAll('[data-frqncy-auth-slot]');
    if (explicit.length) {
      for (var i = 0; i < explicit.length; i++) out.push({ el: explicit[i], kind: 'slot' });
      return out;
    }
    var snav = document.querySelector('.snav-right');
    if (snav) out.push({ el: snav, kind: 'snav' });
    var links = document.querySelector('nav .nav-links');
    if (links) out.push({ el: links, kind: 'list' });
    // The phone bar. Sits just before the hamburger so it survives the 720px
    // collapse that hides .nav-links entirely.
    // `solo` — pages with no .nav-links at all (the intake, for one) have no
    // desktop list to fall back to, so this copy must show at every width.
    var nav = document.querySelector('nav');
    if (nav && !snav) out.push({ el: nav, kind: 'bar', solo: !links });
    return out;
  }

  function paint() {
    if (!document.body) return;
    if (document.body.getAttribute('data-frqncy-auth') === 'off') return;
    // Pages carrying their own account control (VBRTN's in-room sheet) keep it.
    if (document.getElementById('acctSlot')) return;

    var user = cachedUser || storedUser();
    var targets = slots();
    if (!targets.length) return;
    injectStyles();

    // Clear anything we previously painted (never touch other modules' nodes).
    var old = document.querySelectorAll('[data-frqa]');
    for (var i = 0; i < old.length; i++) old[i].remove();

    for (var t = 0; t < targets.length; t++) {
      var el = targets[t].el, kind = targets[t].kind, solo = targets[t].solo;
      var node;

      if (user) {
        // social-auth.js already paints an avatar into these navs on the 15
        // pages that load it. Don't double up — it links to the profile and
        // says the same thing. We still add a way OUT, which it never had.
        var hasAvatar = document.querySelector('[data-frq-auth="avatar"]');
        node = document.createElement('span');
        node.setAttribute('data-frqa', 'in');
        if (!hasAvatar || kind === 'bar') {
          var who = document.createElement('a');
          who.className = 'frqa-who';
          who.href = '/my-frqncy/';
          who.textContent = label(user);
          node.appendChild(who);
          node.appendChild(document.createTextNode(' '));
        }
        var out = document.createElement('button');
        out.type = 'button';
        out.className = 'frqa-ctl';
        out.textContent = 'Sign out';
        out.addEventListener('click', function (e) { e.preventDefault(); api.signOut(); });
        node.appendChild(out);
      } else {
        node = document.createElement('button');
        node.type = 'button';
        node.className = 'frqa-ctl';
        node.setAttribute('data-frqa', 'out');
        node.textContent = 'Sign in';
        node.addEventListener('click', function (e) { e.preventDefault(); api.open(); });
      }

      if (kind === 'list') {
        var li = document.createElement('li');
        li.setAttribute('data-frqa', 'li');
        li.appendChild(node);
        el.appendChild(li);
      } else if (kind === 'bar') {
        var holder = document.createElement('span');
        holder.className = 'frqa-bar' + (solo ? ' frqa-solo' : '');
        holder.setAttribute('data-frqa', 'bar');
        holder.appendChild(node);
        var burger = document.getElementById('frqncy-hamburger');
        if (burger && burger.parentNode === el) el.insertBefore(holder, burger);
        else el.appendChild(holder);
      } else {
        el.appendChild(node);
      }
    }
  }

  // ── The sheet ─────────────────────────────────────────────────────────────
  function open(opts) {
    opts = opts || {};
    if (document.getElementById('frqncy-auth-sheet')) return;
    injectStyles();

    var mode = opts.mode === 'signup' ? 'signup' : 'signin';
    var canDialog = typeof HTMLDialogElement === 'function' &&
                    typeof HTMLDialogElement.prototype.showModal === 'function';
    var wrap = document.createElement(canDialog ? 'dialog' : 'div');
    wrap.className = 'frqa-sheet';
    wrap.id = 'frqncy-auth-sheet';
    wrap.innerHTML =
      '<div class="frqa-card" role="dialog" aria-modal="true" aria-labelledby="frqaTitle">' +
        '<h2 id="frqaTitle">Sign in to FRQNCY</h2>' +
        '<p class="frqa-lede">One account across everything here — your Sanctuary, your chart, VBRTN, the courses, NRG. Sign in once and it follows you to any device.</p>' +
        '<div class="frqa-tabs" role="tablist">' +
          '<button class="frqa-tab" id="frqaTabIn"  role="tab" type="button" aria-selected="true">Sign in</button>' +
          '<button class="frqa-tab" id="frqaTabUp"  role="tab" type="button" aria-selected="false">Create account</button>' +
        '</div>' +
        '<label for="frqaEmail">Email</label>' +
        '<input id="frqaEmail" type="email" inputmode="email" autocomplete="email" autocapitalize="none" spellcheck="false" placeholder="you@example.com">' +
        '<label for="frqaPass">Password</label>' +
        '<input id="frqaPass" type="password" autocomplete="current-password" placeholder="At least 8 characters">' +
        '<div class="frqa-actions">' +
          '<button class="frqa-btn frqa-primary" id="frqaGo" type="button">Sign in</button>' +
          '<button class="frqa-btn frqa-ghost" id="frqaClose" type="button">Not now</button>' +
        '</div>' +
        '<div class="frqa-msg" id="frqaMsg" role="status" aria-live="polite"></div>' +
        '<div class="frqa-alt">No password, or forgotten it? <button id="frqaMagic" type="button">Email me a sign-in link</button></div>' +
      '</div>';
    document.body.appendChild(wrap);
    if (canDialog) {
      try { wrap.showModal(); } catch (e) { /* already open, or detached */ }
      // Escape fires 'cancel' → 'close'; take the node with it either way.
      wrap.addEventListener('close', function () { if (wrap.parentNode) wrap.remove(); });
    }

    var email = wrap.querySelector('#frqaEmail');
    var pass  = wrap.querySelector('#frqaPass');
    var msg   = wrap.querySelector('#frqaMsg');
    var go    = wrap.querySelector('#frqaGo');
    var tabIn = wrap.querySelector('#frqaTabIn');
    var tabUp = wrap.querySelector('#frqaTabUp');

    function say(text, cls) { msg.className = 'frqa-msg ' + (cls || ''); msg.textContent = text; }
    function close() {
      document.removeEventListener('keydown', onKey);
      if (canDialog && wrap.open) { wrap.close(); return; }  // 'close' removes it
      if (wrap.parentNode) wrap.remove();
    }
    function onKey(e) { if (e.key === 'Escape') close(); }
    if (!canDialog) document.addEventListener('keydown', onKey);

    wrap.querySelector('#frqaClose').addEventListener('click', close);
    wrap.addEventListener('click', function (e) { if (e.target === wrap) close(); });

    function setMode(next) {
      mode = next;
      var up = mode === 'signup';
      tabIn.setAttribute('aria-selected', up ? 'false' : 'true');
      tabUp.setAttribute('aria-selected', up ? 'true' : 'false');
      go.textContent = up ? 'Create account' : 'Sign in';
      pass.setAttribute('autocomplete', up ? 'new-password' : 'current-password');
      say('');
    }
    tabIn.addEventListener('click', function () { setMode('signin'); });
    tabUp.addEventListener('click', function () { setMode('signup'); });
    setMode(mode);

    go.addEventListener('click', function () {
      var em = (email.value || '').trim();
      var pw = pass.value || '';
      if (!em || !pw) { say('Both fields, then.', 'err'); return; }
      if (mode === 'signup' && pw.length < 8) { say('Eight characters or more.', 'err'); return; }
      go.disabled = true;
      say(mode === 'signup' ? 'Creating your account…' : 'Signing in…');
      ensureClient()
        .then(function () {
          return mode === 'signup'
            ? window.frqncy.auth.signUp({ email: em, password: pw })
            : window.frqncy.auth.signIn({ email: em, password: pw });
        })
        .then(function (res) {
          if (res && res.error) throw res.error;
          var user = (res && res.user) || (res && res.data && res.data.user) || { email: em };
          say('Signed in. Bringing your things across…', 'ok');
          notify(user);
          if (typeof opts.onSignedIn === 'function') { try { opts.onSignedIn(user); } catch (e) {} }
          setTimeout(close, 900);
        })
        .catch(function (err) {
          go.disabled = false;
          var m = (err && err.message) || '';
          if (/Invalid login/i.test(m)) m = 'That email and password do not match an account. Try "Create account", or the sign-in link below.';
          else if (/already registered/i.test(m)) m = 'That address already has an account — switch to Sign in.';
          say(m || 'That did not work. Check the address and password.', 'err');
        });
    });

    wrap.querySelector('#frqaMagic').addEventListener('click', function () {
      var em = (email.value || '').trim();
      if (!em) { say('Put your email in first and I will send the link there.', 'err'); return; }
      say('Sending…');
      ensureClient()
        .then(function () { return window.frqncy.auth.signInMagic(em, { redirectTo: location.href }); })
        .then(function (res) {
          if (res && res.error) throw res.error;
          say('Sent. Open the link on THIS device so it signs in here.', 'ok');
        })
        .catch(function (err) { say((err && err.message) || 'Could not send the link.', 'err'); });
    });

    setTimeout(function () { try { email.focus(); } catch (e) {} }, 60);
  }

  // ── Public API ────────────────────────────────────────────────────────────
  var api = {
    open: open,
    close: function () {
      var el = document.getElementById('frqncy-auth-sheet');
      if (!el) return;
      if (typeof el.close === 'function' && el.open) el.close();
      else el.remove();
    },
    isSignedIn: function () { return !!(cachedUser || storedUser()); },
    user: function () { return cachedUser || storedUser(); },
    /** Resolves with the live Supabase-confirmed user (loads the SDK). */
    getUser: function () {
      return ensureClient().then(function () { return window.frqncy.auth.getUser(); });
    },
    onAuth: function (fn) {
      listeners.push(fn);
      try { fn(cachedUser || storedUser()); } catch (e) {}
      return function () { listeners = listeners.filter(function (f) { return f !== fn; }); };
    },
    signOut: function () {
      return ensureClient()
        .then(function () { return window.frqncy.auth.signOut(); })
        .then(function () { notify(null); })
        .catch(function () {
          // Even if the network call fails, drop the local session so the
          // person is not stuck looking signed in on a shared machine.
          try { window.localStorage.removeItem(STORAGE_KEY); } catch (e) {}
          notify(null);
        });
    },
    /** Force the client to load — used by pages that need the session early. */
    ready: function () { return ensureClient(); }
  };

  // ── Boot ──────────────────────────────────────────────────────────────────
  function boot() {
    cachedUser = storedUser();
    consumeShellSso();
    if (cachedUser) broadcastToShell();
    paint();

    // The mobile drawer is built by mobile-nav.js at DOMContentLoaded. On pages
    // that load this file directly we may arrive first, so paint once more when
    // everything has settled — paint() clears its own nodes, so this is a
    // re-render, not a duplicate.
    window.addEventListener('load', function () { paint(); });

    // A magic link lands with the token in the hash (or ?code= for PKCE).
    // The SDK consumes it on construction (detectSessionInUrl), so load it now
    // — this is the one path where a logged-out visitor pays for the SDK, and
    // they asked for it by clicking the link in their email.
    var h = location.hash || '', q = location.search || '';
    if (/access_token=|refresh_token=|type=(magiclink|recovery|signup)/.test(h) || /[?&]code=/.test(q)) {
      ensureClient().then(function () {
        if (location.hash) {
          try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
        }
      });
    } else if (storedSession()) {
      // Already signed in: attach quietly so the token refreshes and any page
      // module listening on frqncy:auth gets the real user object.
      ensureClient();
    }

    // Signing in or out anywhere else on this origin — another tab, the NRG
    // login page, VBRTN's own sheet — writes that same localStorage key. This
    // is what makes one login visibly universal rather than merely shared.
    window.addEventListener('storage', function (e) {
      if (e.key !== STORAGE_KEY) return;
      notify(storedUser());
    });
  }

  window.frqncyAuth = api;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
