#!/usr/bin/env node
/**
 * FRQNCY · Clean book intros in-place in books.json.
 *
 * Cleanup rules:
 *   - Strip raw HTML tags (<br>, <em>, etc) that leaked from canonical pages
 *   - Decode HTML entities (idempotent if already decoded)
 *   - Remove catalogue trailers ("Author Name, ISBN")
 *   - Drop intros that look amateur ("i've", "i think this", "imho")
 *   - Drop non-English intros (very rough heuristic)
 *   - Drop truncated intros (end with mid-word or naked clause)
 *   - Drop intros that start with site nav crumbs ("Home › Books › ...")
 *
 * Drops are written by clearing the field, so QA's R2-INTRO-MISSING picks
 * them up for the manual queue on the next run.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const booksPath = path.join(ROOT, 'books.json');
const data = JSON.parse(fs.readFileSync(booksPath, 'utf8'));

const ENT = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", ndash: '–', mdash: '—', hellip: '…', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“' };
function decode(s) {
  let prev = '';
  while (prev !== s) {
    prev = s;
    s = s.replace(/&(amp|nbsp|lt|gt|quot|apos|ndash|mdash|hellip|rsquo|lsquo|rdquo|ldquo);/g, (_, n) => ENT[n] ?? '')
         .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(+c))
         .replace(/&#x([0-9a-f]+);/gi, (_, c) => String.fromCharCode(parseInt(c, 16)));
  }
  return s;
}

function stripHtml(s) {
  return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function looksAmateur(s) {
  const lower = s.toLowerCase();
  return / i've /.test(lower)
    || / i think /.test(lower)
    || / imho /.test(lower)
    || / one of the best books i('ve| have) /.test(lower)
    || /it's curtains/.test(lower)
    || / hen with ducklings/.test(lower);
}

function looksLikePlaceholderPage(s) {
  const lower = s.toLowerCase();
  return /we've got our hands full/.test(lower)
    || /page will automatically refresh/.test(lower)
    || /up and moving shortly/.test(lower)
    || /coming soon/.test(lower)
    || /under (construction|maintenance)/.test(lower)
    || /this domain (is|may be) for sale/.test(lower);
}

function looksLikeSpamHijack(s) {
  // Indonesian/Malay gambling-spam keywords + cyrillic + arabic blocks
  return /\b(BANDAR|TARUHAN|BETTOR|JUDI|SLOT GACOR|TOGEL)\b/i.test(s)
    || /[Ѐ-ӿ]/.test(s)         // cyrillic
    || /[؀-ۿ]/.test(s)         // arabic
    || /[一-鿿]/.test(s);        // CJK
}

function looksLikeAuthorPage(s) {
  // "X is a celebrated bestselling author... Here you can find his life story and a complete catalogue of all N of his books"
  const lower = s.toLowerCase();
  return /catalogue of all \d+ of (his|her) books/.test(lower)
    || /find (his|her) life story/.test(lower)
    || /(this is the|the official) author (page|website) of/.test(lower);
}

function titleMatchesIntro(title, intro) {
  // Reject intro if no distinctive word from the title appears in it.
  const STOP = new Set(['the','of','a','an','and','or','to','in','on','at','for','with','by','is','are','i','ii','iii','iv','&','it','this','that','from','your','our','my']);
  const titleTokens = (title || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 3 && !STOP.has(w));
  if (!titleTokens.length) return true;   // very short title, can't check
  const introLower = intro.toLowerCase();
  return titleTokens.some(t => introLower.includes(t));
}

function looksNonEnglish(s) {
  // Heuristic: count common-English markers vs German/Spanish/French markers
  const enHits = (s.toLowerCase().match(/\b(the|and|of|to|in|that|is|was|with|for|as)\b/g) || []).length;
  const deHits = (s.match(/\b(und|wir|der|die|das|wohin|warum|sind|für)\b/gi) || []).length;
  const esHits = (s.match(/\b(que|para|con|son|los|las|una|del)\b/gi) || []).length;
  return enHits < 3 && (deHits > 2 || esHits > 2);
}

function looksTruncated(s) {
  const trimmed = s.trim();
  // Doesn't end with terminal punctuation AND last word looks fragmentary
  if (/[.!?…"']\)?$/.test(trimmed)) return false;
  // Ends with "Dr." or "Mr." common false positives — accept these
  if (/\b(Dr|Mr|Mrs|Ms|St|Jr|Sr)\.$/.test(trimmed)) return false;
  return true;
}

function looksLikeNav(s) {
  return /^(home|menu|skip to)\s/i.test(s) || /\s›\s/.test(s.slice(0, 80));
}

function looksLikeCatalogTrailer(s) {
  // ", David R. Montgomery, 9780393356090" — Author + ISBN at end
  return /,\s+\d{10,13}\s*$/.test(s.trim());
}

function looksLikeAuthorAdCopy(s) {
  // E.g. "Dr. Matthew Walker, Ph.D. — Professor of … Founder & CEO of Nightfall IQ"
  // Very short blurb that's mostly bio + corporate role rather than book content
  return /\bfounder\s*(&|and)?\s*ceo\b/i.test(s) && s.length < 200;
}

function clean(s, title) {
  if (typeof s !== 'string' || !s.trim()) return null;
  let t = decode(s);
  t = stripHtml(t);
  t = t.replace(/\s+/g, ' ').trim();
  // Drop trailing catalog fragments like ", Author Name, 9780393356090"
  t = t.replace(/,\s+[A-Z][A-Za-z .]+,\s+\d{10,13}\s*$/, '').trim();
  // Drop common publisher tag-suffixes
  t = t.replace(/\s*--\s*Publisher\.?\s*$/i, '').trim();
  // Drop empty fragments
  if (!t) return null;
  // Reject conditions
  if (t.length < 60) return null;
  if (looksAmateur(t)) return null;
  if (looksNonEnglish(t)) return null;
  if (looksTruncated(t)) return null;
  if (looksLikeNav(t)) return null;
  if (looksLikeCatalogTrailer(t)) return null;
  if (looksLikeAuthorAdCopy(t)) return null;
  if (looksLikePlaceholderPage(t)) return null;
  if (looksLikeSpamHijack(t)) return null;
  if (looksLikeAuthorPage(t)) return null;
  if (!titleMatchesIntro(title, t)) return null;
  return t;
}

let cleaned = 0, dropped = 0, unchanged = 0;
for (const b of data.books) {
  if (typeof b.intro !== 'string' || !b.intro) continue;
  const out = clean(b.intro, b.title);
  if (out === null) {
    delete b.intro;
    delete b.intro_source;
    dropped++;
  } else if (out !== b.intro) {
    b.intro = out;
    cleaned++;
  } else {
    unchanged++;
  }
}

fs.writeFileSync(booksPath, JSON.stringify(data, null, 2) + '\n');
console.log(`Cleaned: ${cleaned} · dropped: ${dropped} · unchanged: ${unchanged}`);
