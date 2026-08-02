// Cloudflare Pages Function: /social/profile/[[path]]
//
// Purpose: route /social/profile/* requests correctly so that:
//   - Static sub-pages (keys/, connections/, bluesky-callback/,
//     bluesky-oauth-client.json) serve as themselves
//   - The bare profile root (/social/profile/ or /social/profile/index.html)
//     serves the user-profile shell
//   - Any other path (e.g. /social/profile/<username>) rewrites to the
//     profile shell so ProfilePage can read the username from
//     window.location.pathname
//
// This replaces a _redirects-only attempt that didn't work reliably on CF
// Pages — the 200 rewrite + 301 catchall both hijacked the static sub-pages
// regardless of order or status code. Pages Functions take precedence over
// _redirects AND can selectively defer to the static handler via
// context.next(), so we get the correct three-way routing.
//
// See proposals/NRG-EXPERT-CRITIQUE-2026-05-14.md and the
// project_cf_pages_catchall_hijacks_static memory for the full history.

// Every static page under /social/profile/ must be listed here. Anything not
// listed is treated as a username and rewritten to the profile shell — so a
// new sub-page that's missing from this array 404s into "no such user" in
// production while still working perfectly against a local static server,
// which does not run this function.
const STATIC_SUB_PATHS = [
  '/social/profile/keys',
  '/social/profile/connections',
  '/social/profile/blocked',
  '/social/profile/bluesky-callback',
  '/social/profile/bluesky-oauth-client.json',
];

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const pathname = url.pathname;

  // Bare profile root — let the static index.html serve
  if (pathname === '/social/profile' || pathname === '/social/profile/' || pathname === '/social/profile/index.html') {
    return context.next();
  }

  // Known static sub-paths — defer to static handler (serves the sub-page's
  // own index.html or the OAuth metadata JSON)
  for (const prefix of STATIC_SUB_PATHS) {
    if (pathname === prefix || pathname === prefix + '/' || pathname.startsWith(prefix + '/')) {
      return context.next();
    }
  }

  // Anything else under /social/profile/ is treated as a dynamic username
  // route. Rewrite to /social/profile/index.html so the Astro/Preact
  // ProfilePage component can parse the username from the URL pathname.
  const assetUrl = new URL('/social/profile/index.html', url.origin);
  // Use the env's ASSETS fetcher when available (Pages Functions runtime);
  // fall back to a normal fetch as a safety net.
  if (context.env && context.env.ASSETS && typeof context.env.ASSETS.fetch === 'function') {
    return context.env.ASSETS.fetch(assetUrl);
  }
  return fetch(assetUrl);
}
