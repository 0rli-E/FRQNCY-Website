/**
 * FRQNCY Social Auth — sign-in state awareness for static pages
 * Self-executing module. Loads Supabase from CDN, checks session,
 * and injects auth UI into the nav bar.
 */
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

(async () => {
  'use strict';

  /* ── Config ─────────────────────────────────────────────────── */
  const url = window.FRQNCY_SUPABASE_URL;
  const key = window.FRQNCY_SUPABASE_ANON_KEY;
  if (!url || !key || url === 'https://your-project.supabase.co') return;

  const supabase = createClient(url, key);

  /* ── Detect nav type ────────────────────────────────────────── */
  // V2 pages use <nav class="snav"> with .snav-right
  // Main pages use <nav id="main-nav"> with .nav-links
  const snavRight = document.querySelector('.snav-right');
  const navLinks  = document.querySelector('#main-nav .nav-links');
  if (!snavRight && !navLinks) return;

  /* ── Styles (injected once) ─────────────────────────────────── */
  const style = document.createElement('style');
  style.textContent = `
    .frq-auth-avatar {
      width: 28px; height: 28px; border-radius: 50%;
      background: #0D2451; border: 1px solid rgba(255,255,255,0.08);
      display: inline-flex; align-items: center; justify-content: center;
      font-family: inherit; font-size: 0.56rem; font-weight: 500;
      letter-spacing: 0.06em; text-transform: uppercase;
      color: #C8D8F0; text-decoration: none; flex-shrink: 0;
      transition: border-color 0.2s, color 0.2s;
    }
    .frq-auth-avatar:hover {
      border-color: rgba(255,255,255,0.28); color: #fff;
    }
    .frq-auth-bell {
      font-size: 0.64rem; letter-spacing: 0.14em; text-transform: uppercase;
      color: #7090B8; text-decoration: none; transition: color 0.2s;
      display: inline-flex; align-items: center; flex-shrink: 0;
    }
    .frq-auth-bell:hover { color: #C8D8F0; }
    .frq-auth-signin {
      font-size: 0.64rem; letter-spacing: 0.14em; text-transform: uppercase;
      color: #7090B8; text-decoration: none; transition: color 0.2s;
      white-space: nowrap;
    }
    .frq-auth-signin:hover { color: #C8D8F0; }
  `;
  document.head.appendChild(style);

  /* ── Helpers ─────────────────────────────────────────────────── */

  /** Extract initials from user metadata or email (safe against null/partial user objects) */
  function getInitials(user) {
    if (!user) return '?';
    const meta = user.user_metadata || {};
    const name = meta.display_name || meta.full_name || meta.name || '';
    if (name) {
      const parts = name.trim().split(/\s+/).filter(Boolean);
      if (parts.length === 0) return '?';
      const first = parts[0][0] || '';
      const last  = parts.length > 1 ? (parts[parts.length - 1][0] || '') : '';
      return (first + last).toUpperCase() || '?';
    }
    const email = user.email || '';
    return (email[0] || '?').toUpperCase();
  }

  /** Extract username (fallback to user id, then empty string — never undefined) */
  function getUsername(user) {
    if (!user) return '';
    const meta = user.user_metadata || {};
    return meta.username || meta.preferred_username || user.id || '';
  }

  /** Build the bell icon (lightweight SVG) */
  function bellSVG() {
    return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>';
  }

  /* ── Render functions ───────────────────────────────────────── */

  /** Remove any previously injected auth elements */
  function clearAuthUI() {
    document.querySelectorAll('[data-frq-auth]').forEach(el => el.remove());
  }

  /** Render logged-in state */
  function renderLoggedIn(user) {
    clearAuthUI();
    const username = getUsername(user);
    const initials = getInitials(user);

    // Bell icon
    const bell = document.createElement('a');
    bell.href = '/social/notifications';
    bell.className = 'frq-auth-bell';
    bell.setAttribute('data-frq-auth', 'bell');
    bell.setAttribute('aria-label', 'Notifications');
    bell.innerHTML = bellSVG();

    // Avatar circle
    const avatar = document.createElement('a');
    avatar.href = '/social/profile/' + encodeURIComponent(username);
    avatar.className = 'frq-auth-avatar';
    avatar.setAttribute('data-frq-auth', 'avatar');
    avatar.setAttribute('aria-label', 'Your profile');
    avatar.textContent = initials;

    if (snavRight) {
      // V2 nav — append to .snav-right
      removeExistingSignIn(snavRight);
      snavRight.appendChild(bell);
      snavRight.appendChild(avatar);
    } else if (navLinks) {
      // Main nav — append as <li> items
      removeExistingSignIn(navLinks);
      const liBell = document.createElement('li');
      liBell.setAttribute('data-frq-auth', 'bell-li');
      liBell.appendChild(bell);
      const liAvatar = document.createElement('li');
      liAvatar.setAttribute('data-frq-auth', 'avatar-li');
      liAvatar.appendChild(avatar);
      navLinks.appendChild(liBell);
      navLinks.appendChild(liAvatar);
    }
  }

  /** Render logged-out state */
  function renderLoggedOut() {
    clearAuthUI();

    const link = document.createElement('a');
    link.href = '/social/login';
    link.className = 'frq-auth-signin';
    link.setAttribute('data-frq-auth', 'signin');
    link.textContent = 'Sign In';

    if (snavRight) {
      // V2 nav — add as a snav-link style element
      link.classList.add('snav-link');
      snavRight.appendChild(link);
    } else if (navLinks) {
      // Main nav — add as <li>
      const li = document.createElement('li');
      li.setAttribute('data-frq-auth', 'signin-li');
      li.appendChild(link);
      navLinks.appendChild(li);
    }
  }

  /** Remove any pre-existing static "Sign In" link */
  function removeExistingSignIn(container) {
    container.querySelectorAll('a').forEach(a => {
      const text = a.textContent.trim().toLowerCase();
      if (text === 'sign in' || text === 'join frqncy' || text === 'login') {
        const parent = a.closest('li');
        if (parent && container.contains(parent)) {
          parent.remove();
        } else {
          a.remove();
        }
      }
    });
  }

  /* ── Init ────────────────────────────────────────────────────── */
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      renderLoggedIn(session.user);
    } else {
      renderLoggedOut();
    }
  } catch (_) {
    renderLoggedOut();
  }

  /* ── Listen for auth changes (login/logout in other tabs) ──── */
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      renderLoggedIn(session.user);
    } else {
      renderLoggedOut();
    }
  });
})();
