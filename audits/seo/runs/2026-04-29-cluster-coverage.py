import os, re, json, glob
from collections import defaultdict
base = "/sessions/zealous-magical-sagan/mnt/Projects/FRQNCY WEBSITE"

# Load resources.json — this is the canonical (resource → topic) mapping
resources = json.load(open(f"{base}/resources.json"))
print(f"Total resource entries in resources.json: {len(resources)}")

# Build topic_slug → list of resource entries
by_topic = defaultdict(list)
for r in resources:
    if 'topicSlug' in r and 'url' in r:
        by_topic[r['topicSlug']].append(r)

print(f"Topics with at least one resource entry: {len(by_topic)}")

# For each topic page, check if the resource URLs in resources.json are actually linked from the page HTML
missing_links = []  # (topic_slug, resource_url, resource_name)
topic_with_missing = defaultdict(list)

SKIP_V2 = {"courses", "watch", "builder", "fund", "og", "_chrome"}
topic_slugs_on_disk = set()
for d in os.listdir(f"{base}/v2"):
    if d in SKIP_V2 or d.startswith('.'): continue
    if os.path.isfile(f"{base}/v2/{d}/index.html"):
        topic_slugs_on_disk.add(d)

print(f"Topic pages on disk: {len(topic_slugs_on_disk)}")

# Cross-check
for slug, res_list in by_topic.items():
    if slug not in topic_slugs_on_disk:
        # Topic referenced in resources.json but no v2/<slug>/ page on disk
        missing_links.append(("__NO_TOPIC_PAGE__", slug, ""))
        continue
    page_path = f"{base}/v2/{slug}/index.html"
    src = open(page_path).read()
    for r in res_list:
        url = r['url']
        # match either the absolute URL or the trailing slug part
        url_normalized = url.rstrip('/')
        if url_normalized in src or (url_normalized + '/') in src:
            continue
        # also check by name
        name = r.get('name', r.get('title', ''))
        if name and name in src:
            continue
        missing_links.append((slug, url, name))
        topic_with_missing[slug].append((url, name))

# Now find orphan items — pages on disk under books/ people/ orgs/ media/ places/ that
# DON'T appear in resources.json
all_known_urls = set(r['url'] for r in resources if 'url' in r)
orphans_by_sector = defaultdict(list)
for sector in ['books', 'people', 'orgs', 'media', 'places']:
    for ip in glob.glob(f"{base}/{sector}/*/index.html"):
        slug = os.path.basename(os.path.dirname(ip))
        url = f"/{sector}/{slug}/"
        if url not in all_known_urls and url + '/' not in all_known_urls and url.rstrip('/') not in all_known_urls:
            orphans_by_sector[sector].append(slug)

# Topic-side orphans: topics on disk with no resources in resources.json
topics_no_resources = [s for s in topic_slugs_on_disk if s not in by_topic]

# Topic slugs in content.json that have no on-disk page
content_topics = json.load(open(f"{base}/content.json"))['topics']
content_topic_slugs = {t['slug'] for t in content_topics}
content_topics_missing_page = content_topic_slugs - topic_slugs_on_disk

# Build the report
log = f"""# Phase 2.10 run — Cluster coverage audit

Date: 2026-04-29

## Summary

This audit cross-references three sources of truth:
1. `content.json` — the topic taxonomy (145 topics)
2. `resources.json` — the topic → resource mapping (764 resource entries)
3. The on-disk page tree (174 topic pages, 559 item pages across books/people/orgs/media/places)

## Counters

- Topics in `content.json`: {len(content_topic_slugs)}
- Topics with a page on disk: {len(topic_slugs_on_disk)}
- Topics with a page on disk but no resources mapped: {len(topics_no_resources)}
- Topics in content.json with NO page on disk: {len(content_topics_missing_page)}
- Resources mapped to topics that have no page on disk: {sum(1 for s, _, _ in missing_links if s == '__NO_TOPIC_PAGE__')}
- Per-resource page-link mismatches (resources.json says the link should be there, page HTML doesn't have it): {len([m for m in missing_links if m[0] != '__NO_TOPIC_PAGE__'])}
- Item pages on disk with NO entry in resources.json (orphan items):
"""
for sector, items in sorted(orphans_by_sector.items()):
    log += f"  - {sector}: {len(items)}\n"

log += "\n## Topics in content.json with NO page on disk\n\n"
if content_topics_missing_page:
    for s in sorted(content_topics_missing_page):
        log += f"- `{s}`\n"
else:
    log += "_(none)_\n"

log += "\n## Topics on disk with NO resources mapped in resources.json\n\nThese topic pages exist but resources.json doesn't claim any resources for them. Either the resources.json is missing entries for these topics, or the topic pages are intentionally resource-less.\n\n"
for s in sorted(topics_no_resources):
    log += f"- `{s}`\n"

log += f"\n## Page-link mismatches (top 30 by topic; full list below)\n\n"
log += "These are cases where resources.json says a resource is listed under a topic, but the topic page's HTML doesn't actually link to or mention that resource. Indicates a publication-pipeline lag.\n\n"
sorted_topics = sorted(topic_with_missing.items(), key=lambda x: -len(x[1]))
for slug, missing in sorted_topics[:30]:
    log += f"### `{slug}` ({len(missing)} missing)\n\n"
    for url, name in missing[:5]:
        log += f"- `{url}` — {name}\n"
    if len(missing) > 5:
        log += f"- ... ({len(missing) - 5} more)\n"
    log += "\n"

log += f"\n## Orphan items per sector\n\nItems on disk with no entry in resources.json. Either (a) they need to be added to resources.json under a topic, (b) they're already deprecated and should be reviewed, or (c) the resources.json is stale.\n\n"
for sector, items in sorted(orphans_by_sector.items()):
    log += f"### {sector} ({len(items)} orphans)\n\n"
    for slug in sorted(items)[:30]:
        log += f"- `/{sector}/{slug}/`\n"
    if len(items) > 30:
        log += f"- ... ({len(items) - 30} more)\n"
    log += "\n"

log += """## Recommendations

### Immediate (Phase 2 follow-on)

1. **Topics in content.json with no page on disk** — either the `content.json` entry is stale and should be removed, or the topic page should be created. Decide topic-by-topic; this is a content gap.
2. **Topic pages with no resources mapped** — investigate: should resources.json entries exist for them, or are these topics intentionally resource-less and the page just has the explainer block?
3. **Page-link mismatches** — these point to a publication-pipeline lag. resources.json was updated but the topic page's static HTML wasn't regenerated. Run the generator that produces topic pages from resources.json to catch up.

### Editorial (Phase 3 follow-on)

4. **Orphan items** — for each, decide: add to resources.json under at least one topic, merge into another item, or retire (per Phase 3.9 thin-content triage).
5. **Items mapped to >5 topics** — over-tagging dilutes signal. Review whether each mapping is genuinely the right anchor.

### Process

6. After cleanup, the audit should re-run quarterly. The script is at `audits/seo/runs/2026-04-29-cluster-coverage.py` (this run) and can be re-invoked.
"""

with open(f"{base}/audits/seo/runs/2026-04-29-phase-2.10-cluster-coverage.md", "w") as f:
    f.write(log)

# Save the script too for re-runs
import shutil
shutil.copy("/tmp/cluster_coverage.py", f"{base}/audits/seo/runs/2026-04-29-cluster-coverage.py")

print(f"\nReport written.")
print(f"Total page-link mismatches: {len([m for m in missing_links if m[0] != '__NO_TOPIC_PAGE__'])}")
print(f"Total orphan items across sectors: {sum(len(v) for v in orphans_by_sector.values())}")
