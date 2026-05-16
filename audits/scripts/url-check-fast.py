#!/usr/bin/env python3
"""Parallel URL reachability across all beds. ~100 workers, completes in 30-60s."""
import json, sys, ssl
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from pathlib import Path
ROOT = Path('/Users/orli/Documents/Claude/Projects/FRQNCY WEBSITE')

UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0 Safari/537.36'
TIMEOUT = 8

def check(label_url):
    label, url = label_url
    if not url or not url.startswith(('http://','https://')):
        return (label, url, 'no-url', '')
    # Try HEAD then GET
    for method in ('HEAD','GET'):
        try:
            req = Request(url, method=method, headers={'User-Agent': UA})
            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE
            with urlopen(req, timeout=TIMEOUT, context=ctx) as r:
                if 200 <= r.status < 400:
                    return (label, url, r.status, r.headers.get('Content-Type',''))
        except HTTPError as e:
            if method == 'GET' and e.code in (403, 405, 429):
                # Server doesn't like our request — might be anti-bot, not really broken
                return (label, url, f'bot-block({e.code})', '')
            if method == 'GET':
                return (label, url, e.code, '')
        except (URLError, ConnectionError, TimeoutError) as e:
            if method == 'GET':
                return (label, url, f'err:{type(e).__name__}', '')
        except Exception as e:
            if method == 'GET':
                return (label, url, f'err:{type(e).__name__}', '')
    return (label, url, 'unknown', '')

def collect_urls():
    targets = []
    for name, key in [('people','people'),('books','books'),('orgs','orgs'),
                      ('media','media'),('places','places'),('music','music')]:
        d = json.loads((ROOT / f'{name}.json').read_text())
        for x in d.get(key, []):
            if x.get('url'):
                targets.append((f"{name}:{x['id']}", x['url']))
            # also images
            if x.get('image'):
                targets.append((f"{name}-img:{x['id']}", x['image']))
    return targets

def main():
    targets = collect_urls()
    print(f'Checking {len(targets)} URLs (HEAD+GET, 8s timeout, 100 workers)...')
    bad = []
    with ThreadPoolExecutor(max_workers=100) as pool:
        futures = {pool.submit(check, t): t for t in targets}
        done = 0
        for f in as_completed(futures):
            label, url, status, ct = f.result()
            done += 1
            if done % 100 == 0:
                print(f'  {done}/{len(targets)}', file=sys.stderr)
            ok = isinstance(status, int) and 200 <= status < 400
            if not ok and not str(status).startswith('bot-block'):
                bad.append({'label': label, 'url': url, 'status': str(status), 'ct': ct})
    print(f'\nDone. Bad: {len(bad)} of {len(targets)}')
    bad.sort(key=lambda b: b['label'])
    for b in bad[:80]:
        print(f"  {b['label']:50s} {b['status']:>20s}  {b['url'][:60]}")
    if len(bad) > 80:
        print(f'  ... +{len(bad)-80} more')
    (ROOT / 'audits' / 'prod').mkdir(parents=True, exist_ok=True)
    (ROOT / 'audits' / 'prod' / 'url-check.json').write_text(json.dumps(bad, indent=2))
    print(f'\nJSON: audits/prod/url-check.json')

if __name__ == '__main__':
    main()
