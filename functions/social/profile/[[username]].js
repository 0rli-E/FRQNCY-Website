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
  const shellUrl = new URL('/social/profile/index.html', url.origin).toString();
  const res = await env.ASSETS.fetch(new Request(shellUrl, { method: 'GET' }));

  // Re-wrap so the response status is 200 (ASSETS can return 404 for missing dir variant).
  const body = await res.arrayBuffer();
  return new Response(body, {
    status: res.status === 200 ? 200 : 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=0, must-revalidate',
    },
  });
}
