/**
 * Safe content renderer for post/comment text.
 *
 * Detects, in order:
 *   1. quote-post markers — a magic prefix lets us "embed" a quoted post
 *      without a schema change. See QUOTE_PREFIX below.
 *   2. @username mentions — renders as a link to /social/profile/<username>
 *   3. bare URLs — renders as a clickable link with rel="noopener noreferrer"
 *
 * Returns an array of segments; consumers can render each segment to JSX.
 * No raw HTML is ever produced; all consumer rendering is via React/Preact
 * children, so XSS via content is structurally impossible.
 */

export type Segment =
  | { kind: 'text'; value: string }
  | { kind: 'mention'; username: string }
  | { kind: 'hashtag'; tag: string }
  | { kind: 'url'; href: string; display: string }
  | { kind: 'quote'; postId: string; comment: string }
  | { kind: 'newline' };

/** Magic prefix the composer writes when a user clicks "Quote post".
 *  Picked so it's distinctive in plaintext but human-readable. */
export const QUOTE_PREFIX = '↗ quote:';

/** Build a quote-post body that round-trips through render(). */
export function buildQuoteBody(originalPostId: string, comment: string) {
  return `${QUOTE_PREFIX}${originalPostId}\n${comment}`;
}

/** Try to parse a quote post out of the content. Returns null if it's not one. */
export function parseQuote(content: string): { postId: string; comment: string } | null {
  if (!content.startsWith(QUOTE_PREFIX)) return null;
  const newlineIdx = content.indexOf('\n');
  if (newlineIdx < 0) return null;
  const postId = content.slice(QUOTE_PREFIX.length, newlineIdx).trim();
  if (!/^[0-9a-f-]{8,}$/i.test(postId)) return null;
  const comment = content.slice(newlineIdx + 1);
  return { postId, comment };
}

const MENTION_RE = /(^|[^\w@])@([a-z0-9_]{2,32})\b/gi;
const HASHTAG_RE = /(^|[^\w#])#([a-z0-9][a-z0-9-]{0,30})\b/gi;
const URL_RE = /https?:\/\/[^\s<>")]+/gi;

/**
 * Pull every @username out of a body of text. Used by composers to send
 * notifications. Returns lowercased usernames, deduplicated, in order of
 * first appearance — capped at 10 so a malicious post can't fan out to
 * the whole network.
 */
export function extractMentions(content: string): string[] {
  if (!content) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const m of content.matchAll(MENTION_RE)) {
    const u = m[2].toLowerCase();
    if (seen.has(u)) continue;
    seen.add(u);
    out.push(u);
    if (out.length >= 10) break;
  }
  return out;
}

/**
 * Tokenise a string into mention / url / text segments. Newlines are emitted
 * as their own segment so the renderer can preserve line breaks without
 * dangerous innerHTML.
 */
export function tokenize(content: string): Segment[] {
  if (!content) return [];

  // Walk line-by-line so we can emit explicit newline segments.
  const lines = content.split('\n');
  const out: Segment[] = [];
  lines.forEach((line, lineIdx) => {
    const slice: Segment[] = [];

    // First pass: find all matches across two regexes, then merge by index.
    type Match = { start: number; end: number; seg: Segment };
    const matches: Match[] = [];

    for (const m of line.matchAll(MENTION_RE)) {
      // Index of @ — m.index points at the prefix capture; we want the @
      const at = (m.index ?? 0) + (m[1] ? m[1].length : 0);
      matches.push({
        start: at,
        end: at + m[2].length + 1, // include @
        seg: { kind: 'mention', username: m[2] },
      });
    }
    for (const m of line.matchAll(HASHTAG_RE)) {
      // Index of # — same prefix-capture pattern as mentions.
      const hash = (m.index ?? 0) + (m[1] ? m[1].length : 0);
      matches.push({
        start: hash,
        end: hash + m[2].length + 1, // include #
        seg: { kind: 'hashtag', tag: m[2].toLowerCase() },
      });
    }
    for (const m of line.matchAll(URL_RE)) {
      const start = m.index ?? 0;
      let end = start + m[0].length;
      // Trim trailing punctuation that's almost never part of the URL
      let url = m[0];
      while (url.length > 1 && /[.,;!?)\]]$/.test(url)) {
        url = url.slice(0, -1);
        end -= 1;
      }
      matches.push({
        start,
        end,
        seg: { kind: 'url', href: url, display: url.replace(/^https?:\/\//, '') },
      });
    }

    matches.sort((a, b) => a.start - b.start);

    // Drop overlapping matches (URL ranges win since they're stricter)
    const filtered: Match[] = [];
    for (const m of matches) {
      const prev = filtered[filtered.length - 1];
      if (prev && m.start < prev.end) continue;
      filtered.push(m);
    }

    let cursor = 0;
    for (const m of filtered) {
      if (m.start > cursor) {
        slice.push({ kind: 'text', value: line.slice(cursor, m.start) });
      }
      slice.push(m.seg);
      cursor = m.end;
    }
    if (cursor < line.length) {
      slice.push({ kind: 'text', value: line.slice(cursor) });
    }

    out.push(...slice);
    if (lineIdx < lines.length - 1) out.push({ kind: 'newline' });
  });

  return out;
}
