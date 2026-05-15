#!/usr/bin/env python3
"""
Comprehensive QA — domains + pillars + topics + entity bios.

Dimensions: voice violations, duplicate quotes per page, image alt text,
internal-link integrity, word count.
"""
import re, json, os
from pathlib import Path
from collections import Counter

ROOT = Path('/Users/orli/Documents/Claude/Projects/FRQNCY WEBSITE')

DOMAIN_SLUGS = ['society','places','business','money','energy','lifestyle','wellbeing','food','sciences','nature','consciousness','arts','communication','technology','creation','play','curation','commerce']
PILLAR_SLUGS = ['curate','education','research','media','sell','fund','builder','network-state']

BEDS = {'people':'people','books':'books','orgs':'orgs','media':'media','places':'places','music':'music'}

# Banished — same list as qa-broader.py
BANISHED_TERMS_SIMPLE = [
    'wellness','self care','do the work','holistic','authentic self','abundance mindset',
    'high vibe','soul food','infinite energy','disrupt','disruption','next gen',
    'next-generation','join the revolution','synergy','hustle','hustle culture',
]
BANISHED_PATTERNS = [
    re.compile(r'\b' + re.escape(t).replace(r'\ ', r'[ -]') + r'\b', re.I)
    for t in BANISHED_TERMS_SIMPLE
]
BANISHED_PATTERNS.append(re.compile(r'\bgame[ -]?chang(?:ing|er)\b', re.I))
BANISHED_PATTERNS.append(re.compile(r'\bawakened\b', re.I))

# Intentional exemptions: contexts where the banished term is meta-discussed.
EXEMPTIONS = [
    # Education pillar deliberately quotes the banned phrases as examples of what NOT to say.
    ('education', 'do the work'),
]
# Proper-noun phrases that contain a banished word — exempt anywhere they appear.
# These are registered methodology names, not editorial usage.
EXEMPT_PHRASES = [
    'Holistic Planned Grazing',  # Allan Savory's grazing method
    'Holistic Management',       # Savory's overarching framework
]

# CF-routed paths from memory: live but no on-disk file
CF_ROUTED = {'/my-frqncy', '/my-frqncy/', '/social', '/social/', '/social-login', '/social-callback'}

def strip_html(html):
    html = re.sub(r'<script[^>]*>.*?</script>', ' ', html, flags=re.S|re.I)
    html = re.sub(r'<style[^>]*>.*?</style>', ' ', html, flags=re.S|re.I)
    text = re.sub(r'<[^>]+>', ' ', html)
    text = (text.replace('&amp;','&').replace('&lt;','<').replace('&gt;','>')
                .replace('&quot;','"').replace('&#39;',"'").replace('&nbsp;',' ')
                .replace('&mdash;','—').replace('&ndash;','–'))
    return re.sub(r'\s+', ' ', text).strip()

def extract_quotes(html):
    quotes = []
    for m in re.finditer(r'<blockquote[^>]*>(.*?)</blockquote>', html, re.S|re.I):
        q = strip_html(m.group(1))
        if q: quotes.append(q)
    return quotes

def detect_voice(text, page_key=None):
    out = []
    for pat in BANISHED_PATTERNS:
        for m in pat.finditer(text):
            term = m.group()
            p = m.start()
            ctx = text[max(0,p-50):p+len(term)+50].strip()
            # skip page-key exemptions
            if page_key and any(page_key == k and term.lower() == t.lower() for k, t in EXEMPTIONS):
                continue
            # skip when the match is inside a proper-noun exempt phrase
            window = text[max(0,p-40):p+len(term)+40]
            if any(phrase in window for phrase in EXEMPT_PHRASES):
                continue
            out.append({'term': term, 'ctx': ctx})
    return out

def check_imgs(html):
    out = []
    for m in re.finditer(r'<img\b[^>]*>', html, re.I):
        tag = m.group()
        if not re.search(r'\balt\s*=', tag, re.I):
            out.append(tag[:120])
    return out

def check_internal_links(html):
    bad = []
    for m in re.finditer(r'href="(/[^"#?]+)"', html):
        href = m.group(1).split('?')[0].split('#')[0]
        if href in CF_ROUTED or href.startswith('/api/') or href.startswith('/_'): continue
        target = ROOT / href.lstrip('/')
        alt = ROOT / (href.lstrip('/').rstrip('/') + '.html')
        alt2 = ROOT / href.lstrip('/') / 'index.html'
        ok = (target.is_dir() and (target / 'index.html').exists()) or target.is_file() or alt.exists() or alt2.exists()
        if not ok: bad.append(href)
    return bad

def qa_page(html_path, slug, kind):
    html = html_path.read_text()
    text = strip_html(html)
    quotes = extract_quotes(html)
    dups = [q for q,n in Counter(quotes).items() if n > 1]
    voice = detect_voice(text, page_key=slug)
    return {
        'kind': kind,
        'slug': slug,
        'words': len(text.split()),
        'quote_count': len(quotes),
        'dup_quotes': dups,
        'voice': voice,
        'imgs_no_alt': check_imgs(html),
        'broken_links': check_internal_links(html),
    }

# ── Run ──────────────────────────────────────────────────────────────
results = []

print('=== DOMAINS ===')
for slug in DOMAIN_SLUGS:
    p = ROOT / slug / 'index.html'
    if not p.exists(): print(f'  [{slug}] MISSING'); continue
    r = qa_page(p, slug, 'domain'); results.append(r)

print('=== PILLARS ===')
for slug in PILLAR_SLUGS:
    p = ROOT / slug / 'index.html'
    if not p.exists(): print(f'  [{slug}] MISSING'); continue
    r = qa_page(p, slug, 'pillar'); results.append(r)

print('=== TOPICS ===')
content = json.loads((ROOT / 'content.json').read_text())
topic_slugs = [t['slug'] for t in content['topics']]
for slug in topic_slugs:
    p = ROOT / slug / 'index.html'
    if not p.exists(): print(f'  [{slug}] MISSING'); continue
    r = qa_page(p, slug, 'topic'); results.append(r)

print('=== ENTITY BIOS ===')
bio_findings = []
for bed_name, key in BEDS.items():
    data = json.loads((ROOT / f'{key}.json').read_text())
    items = data.get(key) or data.get(bed_name) or []
    if not isinstance(items, list): continue
    for item in items:
        bio = item.get('bio','') or ''
        if not bio: continue
        v = detect_voice(bio, page_key=item.get('id',''))
        for h in v:
            bio_findings.append({
                'bed': bed_name,
                'id': item.get('id','?'),
                'name': item.get('name', item.get('title','?')),
                'term': h['term'],
                'ctx': h['ctx'],
            })

# ── Report ───────────────────────────────────────────────────────────
print()
print('='*80)
print('FULL QA REPORT')
print('='*80)

pages_with_issues = []
for r in results:
    issues = []
    if r['voice']:        issues.append(f"voice:{len(r['voice'])}")
    if r['dup_quotes']:   issues.append(f"dup_quotes:{len(r['dup_quotes'])}")
    if r['imgs_no_alt']:  issues.append(f"imgs_no_alt:{len(r['imgs_no_alt'])}")
    if r['broken_links']: issues.append(f"broken_links:{len(r['broken_links'])}")
    if issues:
        pages_with_issues.append(r)

print(f'\nPages scanned:  domains=18  pillars=8  topics={len(topic_slugs)}')
print(f'Clean: {len(results) - len(pages_with_issues)} / {len(results)}')
print(f'Flagged: {len(pages_with_issues)}')

print(f'\nEntity bios scanned: {sum(len(json.loads((ROOT / f"{k}.json").read_text()).get(v) or json.loads((ROOT / f"{k}.json").read_text()).get(b) or []) for b,(k,v) in [(b,(k,k)) for b,k in BEDS.items()])}')
print(f'Bio voice flags: {len(bio_findings)}')

# Detail per flagged page
for r in pages_with_issues:
    print(f"\n⚠ [{r['kind']:6s}/{r['slug']:25s}]  {r['words']}w  " + " / ".join([
        x for x in [
            f"voice:{len(r['voice'])}" if r['voice'] else None,
            f"dup_quotes:{len(r['dup_quotes'])}" if r['dup_quotes'] else None,
            f"imgs_no_alt:{len(r['imgs_no_alt'])}" if r['imgs_no_alt'] else None,
            f"broken_links:{len(r['broken_links'])}" if r['broken_links'] else None,
        ] if x
    ]))
    for v in r['voice'][:5]:
        print(f"      voice \"{v['term']}\": …{v['ctx'][:120]}…")
    if len(r['voice']) > 5: print(f"      ... +{len(r['voice'])-5} more voice hits")
    for q in r['dup_quotes'][:3]:
        print(f"      dup quote: {q[:80]}")
    for t in r['imgs_no_alt'][:2]:
        print(f"      img no-alt: {t}")
    for b in r['broken_links'][:5]:
        print(f"      broken link: {b}")
    if len(r['broken_links']) > 5: print(f"      ... +{len(r['broken_links'])-5} more broken links")

print('\n--- BIO VIOLATIONS ---')
for h in bio_findings[:30]:
    print(f"  [{h['bed']:7s}] {h['id']:38s} {h['term']:14s} \"…{h['ctx'][:80]}…\"")
if len(bio_findings) > 30:
    print(f"  ... +{len(bio_findings)-30} more")

# JSON dump
out = ROOT / 'audits' / 'prod' / 'full-qa.json'
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps({'pages': results, 'bios': bio_findings}, indent=2))
print(f'\nJSON: {out.relative_to(ROOT)}')
