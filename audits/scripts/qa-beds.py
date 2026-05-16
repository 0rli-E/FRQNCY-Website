#!/usr/bin/env python3
"""
QA for the entity beds — people, books, orgs, media, places, music, aligned-goods.

Dimensions per bed:
  - schema: required-field presence (id, name|title, url, bio, image where expected)
  - placeholder bios: people 'Author of X' pattern, vague org/media stubs
  - URL integrity: each url field reachable (HEAD request, 200/301/302)
  - ref integrity: founder_is_person_ref + creator_is_person_ref point at extant p-ids
  - image reachability: each image URL returns 200 + content-type image/* (NOT a visual check)
  - aligned-goods vendor[] integrity: each entry has at least one vendor with a url
  - duplicate IDs / duplicate slugs

Pair with audits/scripts/qa-full.py for voice + page-level checks.

Usage:
  python3 audits/scripts/qa-beds.py              # all beds
  python3 audits/scripts/qa-beds.py orgs media   # subset
  python3 audits/scripts/qa-beds.py --skip-url   # skip slow HEAD checks
"""
import json
import re
import sys
import time
from pathlib import Path
from collections import Counter
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

ROOT = Path('/Users/orli/Documents/Claude/Projects/FRQNCY WEBSITE')

BEDS = {
    'people': {'file': 'people.json', 'key': 'people', 'id_prefix': 'p-', 'image_required': True},
    'books':  {'file': 'books.json',  'key': 'books',  'id_prefix': 'b-', 'image_required': False},
    'orgs':   {'file': 'orgs.json',   'key': 'orgs',   'id_prefix': 'o-', 'image_required': True},
    'media':  {'file': 'media.json',  'key': 'media',  'id_prefix': 'm-', 'image_required': True},
    'places': {'file': 'places.json', 'key': 'places', 'id_prefix': 'pl-','image_required': True},
    'music':  {'file': 'music.json',  'key': 'music',  'id_prefix': 'mu-','image_required': False},
    'aligned-goods': {'file': 'aligned-goods.json', 'key': None, 'id_prefix': '', 'image_required': False},
}

PLACEHOLDER_BIO_PATTERNS = [
    re.compile(r'^Author of [A-Z]'),       # people default
    re.compile(r'^Creator of [A-Z]'),      # media default
    re.compile(r'^Founder of [A-Z]'),      # org default (only if exactly this; longer bios fine)
]

def load(bed):
    cfg = BEDS[bed]
    data = json.loads((ROOT / cfg['file']).read_text())
    if cfg['key'] is None:
        return data if isinstance(data, list) else []
    return data.get(cfg['key'], [])

URL_CACHE = {}
def url_ok(url, timeout=8, expect_image=False):
    """HEAD a URL, return (ok, status, content_type). Cached per URL."""
    if not url: return (False, 'no-url', '')
    if url in URL_CACHE: return URL_CACHE[url]
    try:
        req = Request(url, method='HEAD', headers={'User-Agent': 'Mozilla/5.0 (compatible; FRQNCY-QA)'})
        with urlopen(req, timeout=timeout) as r:
            status = r.status
            ct = r.headers.get('Content-Type', '')
            ok = 200 <= status < 400
            if expect_image and not ct.startswith('image/'):
                ok = False
            res = (ok, status, ct)
    except HTTPError as e:
        res = (False, e.code, '')
    except URLError as e:
        # Some servers reject HEAD — fall back to GET with byte range.
        try:
            req = Request(url, headers={'User-Agent': 'Mozilla/5.0 (compatible; FRQNCY-QA)', 'Range': 'bytes=0-128'})
            with urlopen(req, timeout=timeout) as r:
                status = r.status
                ct = r.headers.get('Content-Type', '')
                ok = 200 <= status < 400
                if expect_image and not ct.startswith('image/'):
                    ok = False
                res = (ok, status, ct)
        except Exception as e2:
            res = (False, f'err:{type(e2).__name__}', '')
    except Exception as e:
        res = (False, f'err:{type(e).__name__}', '')
    URL_CACHE[url] = res
    return res

def is_placeholder_bio(bio):
    if not bio: return True
    bio = bio.strip()
    # Pattern: short + matches one of the bot-generated stubs
    if len(bio) < 60:
        for p in PLACEHOLDER_BIO_PATTERNS:
            if p.match(bio):
                # Allow "Founder of X and Y, building Z" — only flag the truly bare ones
                if bio.count('.') <= 1:
                    return True
    return False

def qa_bed(bed, items, check_urls=True, people_index=None):
    findings = {
        'count': len(items),
        'missing_image': [],
        'missing_url': [],
        'missing_bio': [],
        'placeholder_bio': [],
        'bad_image_url': [],
        'bad_canonical_url': [],
        'broken_person_ref': [],
        'dup_ids': [],
        'dup_slugs': [],
        'aligned_no_vendor_url': [],  # aligned-goods only
    }

    cfg = BEDS[bed]
    image_required = cfg['image_required']
    pfx = cfg['id_prefix']

    id_count = Counter()
    slug_count = Counter()
    for x in items:
        xid = x.get('id', '')
        id_count[xid] += 1
        slug = xid.replace(pfx, '', 1) if pfx and xid.startswith(pfx) else xid
        slug_count[slug] += 1

    findings['dup_ids'] = [i for i, n in id_count.items() if n > 1]
    findings['dup_slugs'] = [s for s, n in slug_count.items() if n > 1]

    for x in items:
        xid = x.get('id', '?')
        name = x.get('name', x.get('title', '?'))
        bio = x.get('bio', '') or x.get('desc', '')
        url = x.get('url', '')
        image = x.get('image', '') or x.get('image_source', '')

        if image_required and not x.get('image'):
            findings['missing_image'].append({'id': xid, 'name': name})
        if not url and bed != 'aligned-goods':
            findings['missing_url'].append({'id': xid, 'name': name})
        if not bio:
            findings['missing_bio'].append({'id': xid, 'name': name})
        elif bed == 'people' and is_placeholder_bio(bio):
            findings['placeholder_bio'].append({'id': xid, 'name': name, 'bio': bio[:80]})

        # founder_is_person_ref + creator_is_person_ref + author array
        if x.get('founder_is_person_ref'):
            ref = x.get('founder')
            refs = ref if isinstance(ref, list) else [ref]
            for r in refs:
                if people_index and r and r not in people_index:
                    findings['broken_person_ref'].append({'id': xid, 'field': 'founder', 'ref': r})
        if x.get('creator_is_person_ref'):
            ref = x.get('creator')
            refs = ref if isinstance(ref, list) else [ref]
            for r in refs:
                if people_index and r and r not in people_index:
                    findings['broken_person_ref'].append({'id': xid, 'field': 'creator', 'ref': r})
        if x.get('author_is_person_ref'):
            ref = x.get('author')
            refs = ref if isinstance(ref, list) else [ref]
            for r in refs:
                if people_index and r and r not in people_index:
                    findings['broken_person_ref'].append({'id': xid, 'field': 'author', 'ref': r})

        # aligned-goods special: vendor[].url
        if bed == 'aligned-goods':
            vendors = x.get('vendor', [])
            if not vendors or not any((v.get('url') or '').startswith('http') for v in vendors):
                findings['aligned_no_vendor_url'].append({'id': xid, 'name': name})

        # URL reachability (slow — gated)
        if check_urls:
            if url:
                ok, status, ct = url_ok(url)
                if not ok:
                    findings['bad_canonical_url'].append({'id': xid, 'name': name, 'url': url, 'status': status})
            if x.get('image'):
                ok, status, ct = url_ok(x['image'], expect_image=True)
                if not ok:
                    findings['bad_image_url'].append({'id': xid, 'name': name, 'url': x['image'], 'status': status, 'ct': ct})

    return findings

def print_findings(bed, f):
    print()
    print(f'== {bed} ({f["count"]} entries) ==')
    flags = []
    if f['missing_image']:  flags.append(f"no_image:{len(f['missing_image'])}")
    if f['missing_url']:    flags.append(f"no_url:{len(f['missing_url'])}")
    if f['missing_bio']:    flags.append(f"no_bio:{len(f['missing_bio'])}")
    if f['placeholder_bio']:flags.append(f"placeholder_bio:{len(f['placeholder_bio'])}")
    if f['bad_image_url']:  flags.append(f"bad_image_url:{len(f['bad_image_url'])}")
    if f['bad_canonical_url']: flags.append(f"bad_canonical_url:{len(f['bad_canonical_url'])}")
    if f['broken_person_ref']: flags.append(f"broken_person_ref:{len(f['broken_person_ref'])}")
    if f['dup_ids']:        flags.append(f"dup_ids:{len(f['dup_ids'])}")
    if f['dup_slugs']:      flags.append(f"dup_slugs:{len(f['dup_slugs'])}")
    if f['aligned_no_vendor_url']: flags.append(f"no_vendor_url:{len(f['aligned_no_vendor_url'])}")
    print('  ' + (' / '.join(flags) if flags else 'clean'))

    if f['bad_canonical_url']:
        print('  --- bad canonical urls ---')
        for b in f['bad_canonical_url'][:10]:
            print(f"    {b['id']:38s} {b['status']:>4} {b['url'][:80]}")
        if len(f['bad_canonical_url']) > 10:
            print(f"    +{len(f['bad_canonical_url'])-10} more")
    if f['bad_image_url']:
        print('  --- bad image urls ---')
        for b in f['bad_image_url'][:10]:
            print(f"    {b['id']:38s} {b['status']!s:>5} ct={b['ct'][:20]:<20} {b['url'][:60]}")
        if len(f['bad_image_url']) > 10:
            print(f"    +{len(f['bad_image_url'])-10} more")
    if f['broken_person_ref']:
        print('  --- broken person refs ---')
        for b in f['broken_person_ref'][:10]:
            print(f"    {b['id']:38s} {b['field']:8s} → {b['ref']}")
    if f['dup_ids']:
        print('  --- duplicate ids ---')
        for d in f['dup_ids']:
            print(f"    {d}")
    if f['aligned_no_vendor_url']:
        print('  --- aligned-goods missing vendor url ---')
        for b in f['aligned_no_vendor_url'][:10]:
            print(f"    {b['id']:30s} {b['name']}")

def main():
    args = sys.argv[1:]
    check_urls = '--skip-url' not in args
    args = [a for a in args if not a.startswith('--')]
    beds = args if args else list(BEDS.keys())

    # Build people index for ref-integrity checks
    ppl = load('people')
    people_index = {p['id'] for p in ppl}

    print('FRQNCY bed QA')
    print('=' * 64)
    if not check_urls:
        print('(skipping URL checks — pass without --skip-url for full audit)')
    else:
        print('(URL checks enabled — slow but thorough)')

    all_findings = {}
    for bed in beds:
        if bed not in BEDS:
            print(f'  unknown bed: {bed}'); continue
        items = load(bed)
        f = qa_bed(bed, items, check_urls=check_urls, people_index=people_index)
        all_findings[bed] = f
        print_findings(bed, f)

    out = ROOT / 'audits' / 'prod' / 'beds-qa.json'
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(all_findings, indent=2))
    print(f'\nJSON: {out.relative_to(ROOT)}')

if __name__ == '__main__':
    main()
