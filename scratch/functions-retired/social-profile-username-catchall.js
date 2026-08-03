// Cloudflare Pages Function — dynamic profile routes
// Catches /social/profile/<anything> and serves the profile shell HTML.
// The client-side ProfilePage component reads the username from window.location.pathname.

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '');

  // Base route: let the static asset (/social/profile/index.html) serve directly.
  if (path === '/social/profile') {
    return next();
  }

  // Dynamic username path: fetch the static shell HTML via the ASSETS binding.
  // Fail gracefully if ASSETS binding is missing or the fetch throws.
  if (!env.ASSETS || typeof env.ASSETS.fetch !== 'function') {
    return new Response('Profile shell unavailable', {
      status: 500,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }

  try {
    const shellUrl = new URL('/social/profile/index.html', url.origin).toString();
    const res = await env.ASSETS.fetch(new Request(shellUrl, { method: 'GET' }));
    const body = await res.arrayBuffer();
    // Always return 200 so the client-side router on the shell can render
    // the dynamic username path (ASSETS sometimes 404s for dir variants).
    return new Response(body, {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=0, must-revalidate',
      },
    });
  } catch (err) {
    return new Response('Profile shell fetch failed', {
      status: 502,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }
}
