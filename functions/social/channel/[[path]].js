/**
 * /social/channel/<slug> — dynamic channel routing, as a Pages Function.
 *
 * Same cause and fix as functions/social/g/[[path]].js: the `_redirects`
 * 200-rewrite `/social/channel/*  /social/channel/research/index.html  200`
 * does not work on this deployment, so any channel Astro did not pre-build
 * returned 404. The seeded channels (research, education, builder, …) happened
 * to work because getStaticPaths emits a real directory for each, which is
 * exactly why this went unnoticed.
 *
 * Defer to the static handler when the channel was pre-built; otherwise serve
 * the shell so ChannelView can read the slug from window.location.pathname.
 */

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const pathname = url.pathname;

  if (pathname === '/social/channel' || pathname === '/social/channel/') {
    return Response.redirect(new URL('/social', url.origin).toString(), 302);
  }

  const staticResponse = await context.next();
  if (staticResponse && staticResponse.status !== 404) {
    return staticResponse;
  }

  const shellUrl = new URL('/social/channel/research/index.html', url.origin);
  const shell =
    context.env && context.env.ASSETS && typeof context.env.ASSETS.fetch === 'function'
      ? await context.env.ASSETS.fetch(shellUrl)
      : await fetch(shellUrl);

  return new Response(shell.body, { status: 200, headers: shell.headers });
}
