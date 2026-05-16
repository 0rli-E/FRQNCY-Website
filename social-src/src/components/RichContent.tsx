import { tokenize } from '../lib/render-content';

interface RichContentProps {
  /** The raw text to render with mention/hashtag/URL linkification. */
  text: string;
}

/**
 * RichContent — safe renderer for any free-text body on FRQNCY social.
 *
 * Walks the segment list from tokenize() and emits JSX. Never produces raw
 * HTML, so post or comment content can never inject markup. Used by
 * PostCard, CommentItem, and anywhere else we render user-authored prose.
 */
export default function RichContent({ text }: RichContentProps) {
  if (!text) return null;
  const segments = tokenize(text);
  return (
    <>
      {segments.map((seg, i) => {
        switch (seg.kind) {
          case 'text':
            return <span key={i}>{seg.value}</span>;
          case 'mention':
            return (
              <a
                key={i}
                href={`/social/u/${seg.username}`}
                class="text-gold hover:text-gold-light transition-colors"
              >@{seg.username}</a>
            );
          case 'hashtag':
            return (
              <a
                key={i}
                href={`/social/channel/${seg.tag}`}
                class="text-accent hover:text-gold transition-colors"
              >#{seg.tag}</a>
            );
          case 'url':
            return (
              <a
                key={i}
                href={seg.href}
                target="_blank"
                rel="noopener noreferrer"
                class="text-accent hover:text-gold transition-colors underline decoration-accent/40"
              >{seg.display}</a>
            );
          case 'newline':
            return <br key={i} />;
          default:
            return null;
        }
      })}
    </>
  );
}
