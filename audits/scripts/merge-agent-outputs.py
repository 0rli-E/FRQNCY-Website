#!/usr/bin/env python3
"""
Merge the 3 parallel-agent JSON outputs into the respective beds.

  /tmp/orgs-images-out.json    → orgs.json image + image_source fields
  /tmp/media-images-out.json   → media.json image + image_source fields
  /tmp/people-bios-out.json    → people.json bio field (placeholder replacement only)

Idempotent: if the bed already has a non-placeholder value, skip.
Reports counts.

Usage:
  python3 audits/scripts/merge-agent-outputs.py            # merge all 3
  python3 audits/scripts/merge-agent-outputs.py --dry      # show diff, don't write
  python3 audits/scripts/merge-agent-outputs.py orgs       # one at a time
"""
import json
import sys
import re
from pathlib import Path
ROOT = Path('/Users/orli/Documents/Claude/Projects/FRQNCY WEBSITE')

PLACEHOLDER_RE = re.compile(r'^Author of [A-Z]')

def load_bed(name, key):
    return json.loads((ROOT / f'{name}.json').read_text())

def write_bed(name, data):
    (ROOT / f'{name}.json').write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n')

def merge_orgs(dry=False):
    out_path = Path('/tmp/orgs-images-out.json')
    if not out_path.exists():
        print(f'  orgs: no /tmp/orgs-images-out.json yet — agent may still be running')
        return 0
    out = json.loads(out_path.read_text())
    bed = load_bed('orgs', 'orgs')
    by_id = {o['id']: o for o in bed['orgs']}
    merged = 0
    for entry in out:
        oid = entry.get('id')
        if oid not in by_id: continue
        existing = by_id[oid]
        if existing.get('image'): continue  # idempotent
        existing['image'] = entry['image']
        if entry.get('image_source'):
            existing['image_source'] = entry['image_source']
        merged += 1
    if not dry: write_bed('orgs', bed)
    print(f'  orgs: merged {merged} images (of {len(out)} agent findings)')
    return merged

def merge_media(dry=False):
    out_path = Path('/tmp/media-images-out.json')
    if not out_path.exists():
        print(f'  media: no /tmp/media-images-out.json yet — agent may still be running')
        return 0
    out = json.loads(out_path.read_text())
    bed = load_bed('media', 'media')
    by_id = {m['id']: m for m in bed['media']}
    merged = 0
    for entry in out:
        mid = entry.get('id')
        if mid not in by_id: continue
        existing = by_id[mid]
        if existing.get('image'): continue
        existing['image'] = entry['image']
        if entry.get('image_source'):
            existing['image_source'] = entry['image_source']
        merged += 1
    if not dry: write_bed('media', bed)
    print(f'  media: merged {merged} images (of {len(out)} agent findings)')
    return merged

def merge_people_bios(dry=False):
    out_path = Path('/tmp/people-bios-out.json')
    if not out_path.exists():
        print(f'  people: no /tmp/people-bios-out.json yet — agent may still be running')
        return 0
    out = json.loads(out_path.read_text())
    bed = load_bed('people', 'people')
    by_id = {p['id']: p for p in bed['people']}
    merged = 0
    skipped_not_placeholder = 0
    for entry in out:
        pid = entry.get('id')
        if pid not in by_id: continue
        existing = by_id[pid]
        current_bio = (existing.get('bio') or '').strip()
        # Only replace if current is placeholder
        is_placeholder = len(current_bio) < 60 and PLACEHOLDER_RE.match(current_bio)
        if not is_placeholder and current_bio:
            skipped_not_placeholder += 1
            continue
        existing['bio'] = entry['new_bio'].strip()
        merged += 1
    if not dry: write_bed('people', bed)
    print(f'  people: merged {merged} bios (of {len(out)} agent findings, skipped {skipped_not_placeholder} non-placeholder)')
    return merged

def main():
    args = sys.argv[1:]
    dry = '--dry' in args
    targets = [a for a in args if not a.startswith('--')]
    if not targets: targets = ['orgs', 'media', 'people']
    print(f"Merging agent outputs ({'DRY RUN' if dry else 'LIVE'})")
    print('=' * 50)
    if 'orgs' in targets: merge_orgs(dry)
    if 'media' in targets: merge_media(dry)
    if 'people' in targets: merge_people_bios(dry)
    print()
    print('Next: node generate.js + python3 scripts/generate_topic_page.py --all (BESPOKE topics)')

if __name__ == '__main__':
    main()
