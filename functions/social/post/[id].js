/**
 * /social/post/<id> — server-rendered shell with rich Open Graph metadata
 * Cloudflare Pages Function
 *
 * The Astro build emits a static shell at /social/post/shell/index.html that
 * the Preact PostView mounts into and fetches the post client-side. That's
 * great for users — but bots scraping the page (Twitter / iMessage / Slack
 * / Discord / LinkedIn / WhatsApp) need OG meta tags AT THE PAGE URL or the
 * unfurl looks like the generic NRG card on every shared link.
 *
 * This function intercepts every /social/post/<id> request, fetches the post
 * via Supabase REST (anon key — RLS allows public reads), and returns the
 * static shell with the og:* / twitter:* meta tags rewritten to reflect the
 * actual post. Browsers still mount the same JS island via /social/post/[id]/
 * directly; bots only ever scrape the meta block.
 *
 * Required Cloudflare Pages env vars:
 *   PUBLIC_SUPABASE_URL          — same value as the .env file
 *   PUBLIC_SUPABASE_ANON_KEY     — the publishable anon key
 *
 * The function uses the anon key intentionally — the data we surface
 * (content, author display name, avatar) is publicly readable through RLS.
 * No service-role secret is ever required.
 */

const POST_LEN_CAP = 200;        // og:description preview length
const TITLE_LEN_CAP = 60;        // <title> preview length

function htmlEscape(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function trim(s, len) {
  if (!s) return '';
  if (s.length <= len) return s;
  // Hard cap, then back off to the previous space if there's one nearby.
  const slice = s.slice(0, len);
  const lastSpace = slice.lastIndexOf(' ');
  return (lastSpace > len * 0.6 ? slice.slice(0, lastSpace) : slice).trimEnd() + '…';
}

function isUuidLike(s) {
  return typeof s === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

async function fetchPost(env, id) {
  const url = env.PUBLIC_SUPABASE_URL;
  const key = env.PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const select = encodeURIComponent(
    'id,content,project_tag,link_preview,created_at,author:profiles!posts_author_id_fkey(username,display_name,avatar_url)',
  );
  const endpoint = `${url}/rest/v1/posts?id=eq.${encodeURIComponent(id)}&select=${select}&limit=1`;

  try {
    const res = await fetch(endpoint, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: 'application/vnd.pgrst.object+json',  // single row, error if 0/many
      },
      cf: { cacheTtl: 30, cacheEverything: true },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (_) {
    return null;
  }
}

function buildMetaBlock(post, canonical) {
  const author = post.author?.display_name || post.author?.username || 'a member';
  const titleBase = trim(post.content || '', TITLE_LEN_CAP) || `${author} on FRQNCY`;
  const title = `${titleBase} — ${author} on FRQNCY · NRG`;
  const description = trim(post.content || '', POST_LEN_CAP) || `${author} on FRQNCY · NRG`;

  // Pick the best image: prefer the post's link_preview image, fall back to
  // the author's avatar, then the site OG image.
  const lp = post.link_preview && typeof post.link_preview === 'object' ? post.link_preview : null;
  const image = (lp && lp.image) || post.author?.avatar_url || 'https://frqncy.network/og-image.png';

  return `
  <link rel="canonical" href="${htmlEscape(canonical)}">
  <meta name="description" content="${htmlEscape(description)}">

  <meta property="og:type" content="article">
  <meta property="og:site_name" content="FRQNCY · NRG">
  <meta property="og:title" content="${htmlEscape(title)}">
  <meta property="og:description" content="${htmlEscape(description)}">
  <meta property="og:url" content="${htmlEscape(canonical)}">
  <meta property="og:image" content="${htmlEscape(image)}">
  <meta property="article:author" content="${htmlEscape(author)}">
  ${post.created_at ? `<meta property="article:published_time" content="${htmlEscape(post.created_at)}">` : ''}

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@frqncy_network">
  <meta name="twitter:title" content="${htmlEscape(title)}">
  <meta name="twitter:description" content="${htmlEscape(description)}">
  <meta name="twitter:image" content="${htmlEscape(image)}">

  <script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'SocialMediaPosting',
    headline: titleBase,
    articleBody: post.content || '',
    datePublished: post.created_at,
    url: canonical,
    author: {
      '@type': 'Person',
      name: author,
      url: post.author?.username ? `https://frqncy.network/social/profile/${post.author.username}` : undefined,
    },
  }).replace(/</g, '\\u003c')}</script>`;
}

/** Take the static shell HTML and replace its <head> meta block. */
function injectMeta(shellHtml, metaBlock, title) {
  // Strip the shell's <title> + any existing meta description / og / twitter
  // tags so the new ones don't conflict with the old.
  let html = shellHtml;
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${htmlEscape(title)}</title>`);
  html = html.replace(/<meta\s+name="description"[^>]*>/gi, '');
  html = html.replace(/<meta\s+(?:property|name)="(og:|twitter:|article:)[^"]+"[^>]*>/gi, '');
  // Inject the new block right after the existing <title>
  html = html.replace(/<\/title>/i, `</title>\n${metaBlock}`);
  return html;
}

export async function onRequestGet(context) {
  const { request, params, env, next } = context;
  const id = params.id;

  // Reject obviously bad ids fast — the Astro shell still 404s gracefully.
  if (!isUuidLike(id)) {
    return next();
  }

  // Fetch the static shell that the Astro build emits. Pages rewrites already
  // point /social/post/* at the shell; we replicate that hop by fetching the
  // shell URL through the same edge.
  const shellRes = await fetch(new URL('/social/post/shell/index.html', request.url), {
    cf: { cacheTtl: 300, cacheEverything: true },
  });
  if (!shellRes.ok) {
    // Fall through to the static shell route — never block on our enrichment.
    return next();
  }
  const shellHtml = await shellRes.text();

  const post = await fetchPost(env, id);
  if (!post) {
    // Post doesn't exist (or RLS blocked) — let the JS shell render its
    // "Post not found" empty state.
    return new Response(shellHtml, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const canonical = `https://frqncy.network/social/post/${id}`;
  const metaBlock = buildMetaBlock(post, canonical);
  const author = post.author?.display_name || post.author?.username || 'a member';
  const titleBase = trim(post.content || '', TITLE_LEN_CAP) || `${author} on FRQNCY`;
  const headTitle = `${titleBase} — ${author} on FRQNCY · NRG`;

  const enriched = injectMeta(shellHtml, metaBlock, headTitle);

  return new Response(enriched, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // Posts are public; let edges + intermediaries cache for a minute so a
      // viral share doesn't hammer Supabase. Browser revalidates frequently.
      'Cache-Control': 'public, max-age=60, s-maxage=300',
    },
  });
}
