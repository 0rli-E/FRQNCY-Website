/**
 * /social/g/<slug> — dynamic group routing, as a Pages Function.
 *
 * WHY THIS EXISTS: `_redirects` carried
 *
 *     /social/g/*   /social/g/townhall/index.html   200
 *
 * and that rule does not work on this deployment. Verified against production
 * 2026-08-03: every 301 rule in `_redirects` resolves correctly, while all four
 * 200-rewrites (`/social/u/*`, `/social/channel/*`, `/social/g/*`,
 * `/social/post/*`) fall through to the `/*  /404.html  404` catch-all. Pages
 * Functions, by contrast, work fine — which is why `/social/post/<real id>`
 * and `/social/profile/<username>` both resolve while the rewrite-backed paths
 * do not.
 *
 * The user-visible effect was that **every group a user created returned 404**.
 * Only the nine seeded groups worked, because Astro emits a real static
 * directory for each of those via getStaticPaths — so the rewrite was never
 * exercised for them and the breakage stayed hidden until someone made a group.
 *
 * Same shape as functions/social/profile/[[path]].js: defer to the static
 * handler when a real asset exists, otherwise serve the group shell so
 * GroupView can read the slug from window.location.pathname.
 */

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const pathname = url.pathname;

  // The bare index and any path that maps to a genuinely built page (the nine
  // seeded groups) should serve themselves. context.next() runs the static
  // asset handler; if it finds something, use it.
  if (pathname === '/social/g' || pathname === '/social/g/') {
    return Response.redirect(new URL('/social/groups', url.origin).toString(), 302);
  }

  const staticResponse = await context.next();
  if (staticResponse && staticResponse.status !== 404) {
    return staticResponse;
  }

  // No static page for this slug — it's a user-created group. Serve the shell.
  const shellUrl = new URL('/social/g/townhall/index.html', url.origin);
  const shell =
    context.env && context.env.ASSETS && typeof context.env.ASSETS.fetch === 'function'
      ? await context.env.ASSETS.fetch(shellUrl)
      : await fetch(shellUrl);

  // Re-wrap so the response is a 200 at the requested URL rather than
  // inheriting anything odd from the asset fetch.
  return new Response(shell.body, {
    status: 200,
    headers: shell.headers,
  });
}
