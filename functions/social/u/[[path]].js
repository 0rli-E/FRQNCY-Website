/**
 * /social/u/<username> — the clean profile namespace, as a Pages Function.
 *
 * `_redirects` carried `/social/u/*  /social/profile/index.html  200`, and that
 * rewrite does not work on this deployment (see functions/social/g/[[path]].js
 * for the full diagnosis), so /social/u/<anyone> returned 404 in production.
 *
 * Lower blast radius than the groups case — the app itself links to
 * /social/profile/<username>, which is served by
 * functions/social/profile/[[path]].js and works — but /social/u/ is the
 * documented canonical profile URL, so any link shared from that namespace was
 * dead. ProfilePage already parses either form from window.location.pathname.
 */

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const pathname = url.pathname.replace(/\/+$/, '');

  // Bare namespace has nothing to show — send them to the feed.
  if (pathname === '/social/u') {
    return Response.redirect(new URL('/social', url.origin).toString(), 302);
  }

  const shellUrl = new URL('/social/profile/index.html', url.origin);
  const shell =
    context.env && context.env.ASSETS && typeof context.env.ASSETS.fetch === 'function'
      ? await context.env.ASSETS.fetch(shellUrl)
      : await fetch(shellUrl);

  return new Response(shell.body, { status: 200, headers: shell.headers });
}
