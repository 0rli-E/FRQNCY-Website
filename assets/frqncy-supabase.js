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

    /** Auth widget — drops a small "Log in / Profile" pill into a target element. */
    mountAuthPill(targetEl, opts = {}) {
      if (!targetEl) return;
      const loginUrl = opts.loginUrl || '/social/login/';

      function render(user) {
        if (user) {
          targetEl.innerHTML = `
            <a href="/social/" style="display:inline-flex;align-items:center;gap:6px;font-size:0.7rem;letter-spacing:0.12em;text-transform:uppercase;color:#C4973A;border:1px solid rgba(196,151,58,0.35);padding:5px 12px;border-radius:2px;text-decoration:none;">
              <span style="width:6px;height:6px;border-radius:50%;background:#5BC79A;"></span>
              <span>${escapeHtml(user.user_metadata?.username || user.email.split('@')[0])}</span>
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
