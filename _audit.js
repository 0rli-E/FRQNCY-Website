// Temporary audit scratchpad — safe to delete.
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;
const MARKER = 'BESPOKE-LOCK';
function hasLock(fp) {
  if (!fs.existsSync(fp)) return false;
  const fd = fs.openSync(fp, 'r');
  const buf = Buffer.alloc(1024);
  const n = fs.readSync(fd, buf, 0, 1024, 0);
  fs.closeSync(fd);
  return buf.slice(0, n).toString('utf8').includes(MARKER);
}
const sample = process.argv.slice(2);
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'content.json'), 'utf8'));
const topicMap = new Map(data.topics.map(t => [t.slug, t]));
const domainMap = new Map(data.domains.map(d => [d.id, d]));
const topicById = new Map(data.topics.map(t => [t.id, t]));
const allSlugSet = new Set(data.topics.map(t => t.slug));

// Load beds to know which topics SHOULD have resources
let PEOPLE, BOOKS, ORGS, MEDIA;
try { PEOPLE = JSON.parse(fs.readFileSync(path.join(ROOT, 'people.json'), 'utf8')); } catch {}
try { BOOKS  = JSON.parse(fs.readFileSync(path.join(ROOT, 'books.json'), 'utf8')); } catch {}
try { ORGS   = JSON.parse(fs.readFileSync(path.join(ROOT, 'orgs.json'), 'utf8')); } catch {}
try { MEDIA  = JSON.parse(fs.readFileSync(path.join(ROOT, 'media.json'), 'utf8')); } catch {}

function entitiesForTopic(tid) {
  return {
    people: (PEOPLE?.people || []).filter(p => (p.appears_in||[]).includes(tid)).length,
    books:  (BOOKS?.books   || []).filter(b => (b.appears_in||[]).includes(tid)).length,
    orgs:   (ORGS?.orgs     || []).filter(o => (o.appears_in||[]).includes(tid)).length,
    media:  (MEDIA?.media   || []).filter(m => (m.appears_in||[]).includes(tid)).length,
  };
}

const results = [];
for (const slug of sample) {
  const fp = path.join(ROOT, slug, 'index.html');
  const topic = topicMap.get(slug);
  const r = { slug, issues: [] };
  r.bespoke = hasLock(fp);
  r.topic_exists = !!topic;
  if (topic) {
    r.expected = entitiesForTopic(topic.id);
    r.expected.resources_json = (data.resources[topic.id] || []).length;
  }
  if (!fs.existsSync(fp)) { r.issues.push('MISSING_FILE'); results.push(r); continue; }
  const html = fs.readFileSync(fp, 'utf8');
  r.size = html.length;

  // STRUCTURE
  if (!/^<!doctype/i.test(html)) r.issues.push('NO_DOCTYPE');
  if (!html.includes('</html>')) r.issues.push('NO_CLOSE_HTML');
  if (!/<head\b/.test(html) || !html.includes('</head>')) r.issues.push('NO_HEAD');
  if (!/<body\b/.test(html) || !html.includes('</body>')) r.issues.push('NO_BODY');

  // HERO: h1, eyebrow, desc
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  if (!h1) r.issues.push('NO_H1'); else r.h1 = h1[1].replace(/<[^>]+>/g,'').trim().slice(0,60);
  if (!/hero-eyebrow|class="[^"]*eyebrow/i.test(html)) r.issues.push('NO_HERO_EYEBROW');
  if (!/hero-desc/i.test(html) && !/<meta\s+name="description"/i.test(html)) r.issues.push('NO_HERO_DESC');
  if (!/<meta\s+name="description"/i.test(html)) r.issues.push('NO_META_DESC');

  // EXPLORE section
  if (!/section-label[^>]*>\s*Explore\s*</.test(html)) r.issues.push('NO_EXPLORE_SECTION');
  // Count explore neighbor cards (ncards in explore)
  const exploreMatch = html.match(/section-label[^>]*>\s*Explore\s*<[\s\S]*?<\/section>/);
  if (exploreMatch) {
    const ec = (exploreMatch[0].match(/<a[^>]*class="ncard"/g) || []).length;
    r.exploreCount = ec;
    if (ec === 0) r.issues.push('EXPLORE_EMPTY');
  }

  // PREV/NEXT
  const prevHref = html.match(/topic-prevnext-link\s+prev[^"]*"\s+href="([^"]+)"/);
  const nextHref = html.match(/topic-prevnext-link\s+next[^"]*"\s+href="([^"]+)"/);
  // alt: class="topic-prevnext-link prev"
  const prevA = html.match(/class="topic-prevnext-link prev"\s+href="([^"]+)"/);
  const nextA = html.match(/class="topic-prevnext-link next"\s+href="([^"]+)"/);
  r.prevHref = prevHref?.[1] || prevA?.[1] || null;
  r.nextHref = nextHref?.[1] || nextA?.[1] || null;
  // Check prev/next slug exists in topic set
  const slugFromHref = (h) => {
    if (!h) return null;
    const m = h.match(/\.\.\/([^/]+)\/index\.html|\.\.\/([^/]+)\/$/);
    return m ? (m[1] || m[2]) : null;
  };
  const prevSlug = slugFromHref(r.prevHref);
  const nextSlug = slugFromHref(r.nextHref);
  if (r.prevHref && prevSlug && !allSlugSet.has(prevSlug)) r.issues.push('PREV_SLUG_BROKEN:' + prevSlug);
  if (r.nextHref && nextSlug && !allSlugSet.has(nextSlug)) r.issues.push('NEXT_SLUG_BROKEN:' + nextSlug);
  if (!r.prevHref && !r.nextHref) r.issues.push('NO_PREVNEXT_NAV');
  if (prevSlug && nextSlug && prevSlug === nextSlug) r.issues.push('PREVNEXT_SAME:' + prevSlug);

  // SHELVES: count rcards with images (resource cards have classes rcard / .rcard-img)
  const rcardCount = (html.match(/<div class="rcard"/g) || []).length;
  const ncardCount = (html.match(/class="ncard"/g) || []).length;
  r.rcardCount = rcardCount;
  r.ncardCount = ncardCount;

  // Check for shelf headings (Books/People/Orgs/Media labels)
  const shelfHeadings = (html.match(/section-label[^>]*>\s*(Books|People|Orgs|Media|Teachers|Curated Resources)\s*</gi) || []).length;
  r.shelfHeadings = shelfHeadings;

  // Images: in rcards and overall
  const rcardImgs = (html.match(/rcard-img|rcard[^"]*"[^>]*>\s*<img/g) || []).length;
  r.rcardImgs = rcardImgs;
  r.imgCount = (html.match(/<img[^>]+>/g) || []).length;

  // HERO image
  const afterHead = html.split('</head>')[1] || '';
  const firstImg = afterHead.match(/<img[^>]*\bsrc="([^"]+)"/);
  r.heroImg = firstImg ? firstImg[1].replace(/&amp;/g,'&') : null;

  // Template artifacts
  if (/\{\{[^}]+\}\}/.test(html)) r.issues.push('UNRENDERED_TEMPLATE_VAR');
  if (/>undefined</.test(html)) r.issues.push('UNDEFINED_LITERAL');
  if (/>null</.test(html)) r.issues.push('NULL_LITERAL');
  if (html.includes('NaN<')) r.issues.push('NAN_LITERAL');

  // Detect resource expectation vs actual
  if (topic) {
    const expectedResources = (r.expected.people + r.expected.books + r.expected.orgs + r.expected.media);
    if (expectedResources > 0 && rcardCount === 0 && ncardCount > 0) {
      // ncards in explore but no rcards -> shelves missing
      // Only flag if expected resources > 0
      // r.issues.push(`SHELVES_MISSING (expected ${expectedResources} entities)`);
    }
  }

  results.push(r);
}
console.log(JSON.stringify(results, null, 2));
