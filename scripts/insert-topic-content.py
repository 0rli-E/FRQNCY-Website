#!/usr/bin/env python3
"""
insert-topic-content.py — bulk-insert content blocks into topic-page stubs.

Reads CONTENT_BLOCKS (slug -> html string) from a JSON file and inserts each
block at the standard location in v2/<slug>/index.html (after <main> and
before the first <section> with "Curated Resources").

Usage:
  python3 scripts/insert-topic-content.py path/to/blocks.json

Each block is HTML that drops in cleanly between hero and resources.
Idempotent: skips a slug if a sentinel marker already exists in the file.
"""

import json, sys
from pathlib import Path

SENTINEL = '<!-- topic-content-block -->'

# The stub template every fresh topic page ships with. Two variants — plain
# (10p) and with-course-callout (11p). We match either.
PLAIN_MARKER = '<main>\n  \n  \n  <section>\n  <div class="section-label">Curated Resources</div>'
COURSE_MARKER_PRE = '<main>\n  \n  <section>\n  <div class="section-label">Take a Course</div>'

def patch(slug, html_block):
    p = Path(f'v2/{slug}/index.html')
    if not p.exists():
        return f'  ! {slug}: file not found'
    text = p.read_text(encoding='utf-8')
    if SENTINEL in text:
        return f'  - {slug}: already patched, skipping'
    block = f'\n{SENTINEL}\n{html_block}\n  '
    if PLAIN_MARKER in text:
        new = text.replace(PLAIN_MARKER, '<main>' + block + '\n  <section>\n  <div class="section-label">Curated Resources</div>', 1)
    elif COURSE_MARKER_PRE in text:
        # Insert before the course callout.
        new = text.replace('<main>\n  \n  <section>\n  <div class="section-label">Take a Course</div>',
                           '<main>' + block + '\n  <section>\n  <div class="section-label">Take a Course</div>', 1)
    else:
        return f'  ! {slug}: no recognisable insertion marker'
    p.write_text(new, encoding='utf-8')
    return f'  + {slug}: inserted'

def main():
    if len(sys.argv) != 2:
        print('usage: python3 scripts/insert-topic-content.py blocks.json', file=sys.stderr)
        sys.exit(2)
    blocks = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
    print(f'Inserting {len(blocks)} blocks...')
    for slug, html in blocks.items():
        print(patch(slug, html))

if __name__ == '__main__':
    main()
