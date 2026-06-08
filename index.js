/* FRQNCY homepage logic — extracted from index.html */
    // =====================
    // SHARED UTILITIES
    // =====================

    // Visibility — pause animations when tab is hidden (saves CPU/battery).
    // The particle render fn lives inside an IIFE below, so we expose a
    // resume hook on window for this handler to call. Without it, the
    // handler used to reference an out-of-scope `animate` and threw a
    // ReferenceError every time the user came back to the tab — particles
    // never resumed after the first switch-away.
    let pageVisible = !document.hidden;
    let animRunning = false;
    document.addEventListener('visibilitychange', () => {
      pageVisible = !document.hidden;
      if (pageVisible && !animRunning && typeof window.__frqResumeParticles === 'function') {
        animRunning = true;
        window.__frqResumeParticles();
      }
    });

    // Scroll-lock counter — prevents hamburger and subscribe overlay from
    // fighting over body.style.overflow when both are active simultaneously
    let _overflowLocks = 0;
    function lockBody()   { if (++_overflowLocks === 1) document.body.style.overflow = 'hidden'; }
    function unlockBody() { if (--_overflowLocks <= 0) { _overflowLocks = 0; document.body.style.overflow = ''; } }

    // =====================
    // PARTICLES
    // =====================
    (function () {
      const canvas = document.getElementById('particles-canvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      let particles = [];

      function resize() {
        canvas.width  = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
      }
      window.addEventListener('resize', resize, { passive: true });
      resize();

      function Particle() { this.reset(true); }
      Particle.prototype.reset = function (scatter) {
        this.x       = Math.random() * canvas.width;
        this.y       = scatter ? Math.random() * canvas.height : canvas.height + 10;
        this.size    = Math.random() * 1.8 + 0.4;
        this.speed   = Math.random() * 0.35 + 0.1;
        this.opacity = Math.random() * 0.35 + 0.1;
        this.drift   = (Math.random() - 0.5) * 0.25;
      };
      Particle.prototype.update = function () {
        this.y       -= this.speed;
        this.x       += this.drift;
        this.opacity -= 0.0008;
        if (this.y < -10 || this.opacity <= 0) this.reset(false);
      };

      for (let i = 0; i < 70; i++) particles.push(new Particle());

      function animate() {
        if (!pageVisible) { animRunning = false; return; }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
          p.update();
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(196, 151, 58, ${p.opacity})`;
          ctx.fill();
        });
        requestAnimationFrame(animate);
      }
      // Expose a resume hook so the top-level visibilitychange handler can
      // restart this RAF chain when the tab becomes visible again.
      window.__frqResumeParticles = () => requestAnimationFrame(animate);
      animRunning = true;
      requestAnimationFrame(animate);
    })();

    // =====================
    // SUBSCRIBE OVERLAY  (with localStorage cookie)
    // =====================
    const POPUP_KEY = 'frqncy_popup_v2';
    const POPUP_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

    function popupSeen() {
      try {
        const raw = localStorage.getItem(POPUP_KEY);
        if (!raw) return false;
        const { ts, reason } = JSON.parse(raw);
        // After subscribing, suppress permanently; after dismissing, 7 days
        if (reason === 'subscribed') return true;
        return (Date.now() - ts) < POPUP_TTL;
      } catch { return false; }
    }
    function markPopupSeen(reason) {
      try { localStorage.setItem(POPUP_KEY, JSON.stringify({ ts: Date.now(), reason })); } catch {}
    }

    let subscribeShown = false;

    function showSubscribe() {
      if (popupSeen()) { subscribeShown = true; return; }
      const overlay = document.getElementById('subscribe-overlay');
      if (!overlay) return;
      overlay.classList.add('visible');
      lockBody();
      // Focus trap: keep Tab within the overlay
      const focusable = overlay.querySelectorAll('input, button, a, [tabindex]:not([tabindex="-1"])');
      if (focusable.length) focusable[0].focus();
      overlay._trapHandler = function(e) {
        if (e.key !== 'Tab' || !focusable.length) return;
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus(); } }
        else { if (document.activeElement === last) { e.preventDefault(); first.focus(); } }
      };
      overlay.addEventListener('keydown', overlay._trapHandler);
    }
    function dismissSubscribe() {
      const overlay = document.getElementById('subscribe-overlay');
      if (!overlay) return;
      overlay.classList.remove('visible');
      if (overlay._trapHandler) { overlay.removeEventListener('keydown', overlay._trapHandler); overlay._trapHandler = null; }
      unlockBody();
      subscribeShown = true;
      markPopupSeen('dismissed');
    }
    async function handleSubscribe(e, form) {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      const email = input.value.trim();
      const btn   = form.querySelector('button[type="submit"]');

      // Determine which form (overlay vs contact section)
      const isOverlay = form.id === 'subscribe-form-overlay';
      const successEl = document.getElementById(isOverlay ? 'subscribe-success-overlay' : 'subscribe-success-contact');
      const errorEl   = document.getElementById(isOverlay ? 'subscribe-error-overlay'   : 'subscribe-error-contact');

      // Client-side email validation
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errorEl.textContent = 'Please enter a valid email address.';
        errorEl.style.display = 'block';
        input.focus();
        return;
      }

      // Loading state
      const origText = btn.textContent;
      btn.textContent = '···';
      btn.disabled = true;
      errorEl.style.display = 'none';

      try {
        // POST to /api/subscribe — Cloudflare Pages Function that:
        //  1. Saves the email to the Supabase `subscribers` table (source of truth)
        //  2. Sends a welcome email via Resend (if RESEND_API_KEY is configured)
        // See functions/api/subscribe.js + EMAIL-SETUP.md for env-var requirements.
        const resp = await fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            source: isOverlay ? 'frqncy_website_overlay' : 'frqncy_website_contact',
          }),
        });

        // Try to parse JSON; tolerate non-JSON failures
        let data = null;
        try { data = await resp.json(); } catch (_) { /* non-JSON */ }

        if (!resp.ok || !data || data.ok !== true) {
          const msg = (data && data.error) || (resp.status === 429
            ? 'Too many attempts — please wait a minute and try again.'
            : 'Connection error. Please try again.');
          errorEl.textContent = msg;
          errorEl.style.display = 'block';
          btn.textContent = origText;
          btn.disabled = false;
          return;
        }

        form.style.display = 'none';
        successEl.style.display = 'block';
        // Tweak the success copy depending on whether they were already on the list
        if (data.isNew === false) {
          successEl.textContent = '✦ Already on the list. Thank you for being here.';
        }
        markPopupSeen('subscribed'); // suppress permanently after subscribing
        // Auto-dismiss overlay after 2s
        if (isOverlay) setTimeout(dismissSubscribe, 2000);
      } catch (err) {
        errorEl.textContent = 'Connection error. Please try again.';
        errorEl.style.display = 'block';
        btn.textContent = origText;
        btn.disabled = false;
      }
    }

    // Close subscribe overlay on Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        const overlay = document.getElementById('subscribe-overlay');
        if (overlay && overlay.classList.contains('visible')) {
          dismissSubscribe();
        }
      }
    });

    // Trigger overlay only after the visitor has engaged with the proposition.
    // History: 55% fired on a single phone-thumb swipe; 100% still ambushed
    // visitors before they'd seen any value prop; 300% still fired before the
    // bubble map on common viewports (1440×900 → 2700px which lands mid-marquees).
    // 600% lets them scroll past bubble + details + contact (whole homepage)
    // before the modal interrupts — visitor sees every section, including the
    // inline contact-section subscribe form, before the overlay asks again.
    window.addEventListener('scroll', function () {
      if (!subscribeShown && window.scrollY > window.innerHeight * 6.0) {
        showSubscribe();
        subscribeShown = true;
      }
    }, { passive: true });

    // =====================
    // SCROLL REVEAL
    // =====================
    const revealEls = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.12 });
    revealEls.forEach(el => revealObserver.observe(el));

    // =====================
    // NAV BEHAVIOR
    // =====================
    // light-intro is also dark (#050810) — keep nav text white there too
    const darkSections = ['light-intro', 'bubble-section', 'contact-section'];
    function updateNav() {
      const nav = document.getElementById('main-nav');
      if (!nav) return;
      const scrolled = window.scrollY > 80;
      nav.classList.toggle('scrolled', scrolled);

      const midY = window.scrollY + window.innerHeight / 3;
      const overDark = darkSections.some(id => {
        const el = document.getElementById(id);
        if (!el) return false;
        return midY >= el.offsetTop && midY <= el.offsetTop + el.offsetHeight;
      });
      nav.classList.toggle('over-dark', overDark);
    }
    window.addEventListener('scroll', updateNav, { passive: true });
    updateNav();



  /* Network constellation widget — implementation lives in assets/network-map.js.
   * The home view passes no opts, so it gets the full topology + 1000 humans.
   * pageVisible (defined above) is independent of the widget's own visibility pause.
   *
   * Idempotency: the inline defensive init in index.html sets
   * window.__frqncyMapInited = true to prevent double-render if both paths fire. */
  if (typeof FRQNCYNetworkMap !== 'undefined' && !window.__frqncyMapInited) {
    window.__frqncyMapInited = true;
    FRQNCYNetworkMap.init({});
  }
