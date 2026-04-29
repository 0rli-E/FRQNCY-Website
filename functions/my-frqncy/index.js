/**
 * /my-frqncy — server-rendered shell with rich OG meta when query params
 *               describe a constellation
 * Cloudflare Pages Function
 *
 * The /my-frqncy.html page is a static client-side experience. When a user
 * builds a constellation, the URL gains query params (?domains=...&intent=...&
 * depth=...&name=...) that the page restores on load. Sharing that URL on
 * Twitter / iMessage / Slack used to unfurl as the generic FRQNCY card —
 * indistinguishable from a homepage share. This function rewrites the meta
 * block when params are present so the unfurl reflects the recipient's own
 * intended snapshot: their name, what they chose to focus on, the depth.
 *
 * No params → fall through to the static shell unchanged. So the canonical
 * /my-frqncy/ URL behaves exactly as before for visitors who haven't yet
 * built a constellation.
 *
 * No env vars required — purely transforms the static HTML.
 */

const TITLE_LEN_CAP = 80;
const DESC_LEN_CAP = 200;

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
  const slice = s.slice(0, len);
  const lastSpace = slice.lastIndexOf(' ');
  return (lastSpace > len * 0.6 ? slice.slice(0, lastSpace) : slice).trimEnd() + '…';
}

function decodeDomains(raw) {
  if (!raw) return [];
  return decodeURIComponent(raw)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function intentLabel(v) {
  switch ((v || '').toLowerCase()) {
    case 'understand': return 'understanding';
    case 'practice':   return 'practising';
    case 'discover':   return 'discovering';
    case 'integrate':  return 'integrating';
    default:           return '';
  }
}

function depthLabel(v) {
  switch ((v || '').toLowerCase()) {
    case 'curious':     return 'curious';
    case 'practicing':  return 'practicing';
    case 'integrating': return 'integrating';
    case 'embodying':   return 'embodying';
    default:            return '';
  }
}

function buildMetaBlock({ name, domains, intent, depth, canonical }) {
  const who = name && name.trim() ? name.trim() : '';
  const whoTitle = who ? `${who}'s Constellation` : 'A FRQNCY Constellation';
  const intentText = intentLabel(intent);
  const depthText = depthLabel(depth);

  // Build a concrete description: name + domains + posture.
  const domainList = domains.length
    ? domains.length === 1
      ? domains[0]
      : domains.length === 2
        ? `${domains[0]} and ${domains[1]}`
        : `${domains.slice(0, -1).join(', ')}, and ${domains[domains.length - 1]}`
    : '';

  const opener = who
    ? `${who} is building a FRQNCY constellation`
    : `A FRQNCY constellation, built around`;

  const bodyParts = [];
  if (domainList) bodyParts.push(domainList);
  if (intentText && depthText) bodyParts.push(`${depthText}, ${intentText}`);
  else if (intentText) bodyParts.push(intentText);
  else if (depthText) bodyParts.push(depthText);

  const description = trim(
    bodyParts.length
      ? who
        ? `${opener} around ${bodyParts.join(' · ')}.`
        : `${opener} ${bodyParts.join(' · ')}.`
      : `${opener} the FRQNCY topic graph.`,
    DESC_LEN_CAP,
  );

  const title = trim(`${whoTitle} — FRQNCY`, TITLE_LEN_CAP);

  return `
  <link rel="canonical" href="${htmlEscape(canonical)}">
  <meta name="description" content="${htmlEscape(description)}">

  <meta property="og:type" content="profile">
  <meta property="og:site_name" content="FRQNCY">
  <meta property="og:title" content="${htmlEscape(title)}">
  <meta property="og:description" content="${htmlEscape(description)}">
  <meta property="og:url" content="${htmlEscape(canonical)}">
  <meta property="og:image" content="https://frqncy.network/og-image.png">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@frqncy_network">
  <meta name="twitter:title" content="${htmlEscape(title)}">
  <meta name="twitter:description" content="${htmlEscape(description)}">
  <meta name="twitter:image" content="https://frqncy.network/og-image.png">`;
}

function injectMeta(shellHtml, metaBlock, title) {
  let html = shellHtml;
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${htmlEscape(title)}</title>`);
  html = html.replace(/<meta\s+name="description"[^>]*>/gi, '');
  html = html.replace(/<meta\s+(?:property|name)="(og:|twitter:|article:)[^"]+"[^>]*>/gi, '');
  html = html.replace(/<link\s+rel="canonical"[^>]*>/gi, '');
  html = html.replace(/<\/title>/i, `</title>\n${metaBlock}`);
  return html;
}

export async function onRequestGet(context) {
  const { request, next } = context;
  const reqUrl = new URL(request.url);

  const domains = decodeDomains(reqUrl.searchParams.get('domains') || '');
  const intent  = reqUrl.searchParams.get('intent')  || '';
  const depth   = reqUrl.searchParams.get('depth')   || '';
  const name    = reqUrl.searchParams.get('name')    || '';

  // No constellation in the URL → bypass entirely; the static page handles
  // the default landing.
  if (!domains.length && !intent && !depth && !name) {
    return next();
  }

  // Fetch the static shell. /my-frqncy.html is the file the redirect rule
  // routes to; we mirror that fetch here.
  const shellRes = await fetch(new URL('/my-frqncy.html', request.url), {
    cf: { cacheTtl: 300, cacheEverything: true },
  });
  if (!shellRes.ok) return next();
  const shellHtml = await shellRes.text();

  const canonical = reqUrl.toString();
  const metaBlock = buildMetaBlock({ name, domains, intent, depth, canonical });
  const headTitle = name && name.trim()
    ? `${name.trim()}'s Constellation — FRQNCY`
    : 'A FRQNCY Constellation';

  const enriched = injectMeta(shellHtml, metaBlock, headTitle);

  return new Response(enriched, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // Constellation snapshots are public and don't churn — cache aggressively.
      'Cache-Control': 'public, max-age=300, s-maxage=600',
    },
  });
}
