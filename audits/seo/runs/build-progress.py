#!/usr/bin/env python3
"""
Generate a stats summary from the audits/seo/runs/ folder so that
PROGRESS.md and PROGRESS.html can be updated with current numbers.

Usage:
    python3 audits/seo/runs/build-progress.py

Prints:
    - run-log count by phase
    - schema coverage from grep across the site tree
    - sitemap entry count
    - any new run logs since the last PROGRESS.md update

Does NOT auto-edit PROGRESS.md / PROGRESS.html — review the output and
update those files by hand. Why: the dashboard's task descriptions
are editorial and shouldn't drift just because a counter ticked over.
"""

from __future__ import annotations
import os, re, glob, subprocess, sys, datetime

def find_base() -> str:
    """Locate the FRQNCY WEBSITE root by walking up from this script."""
    here = os.path.abspath(os.path.dirname(__file__))
    p = here
    for _ in range(6):
        if os.path.exists(f"{p}/sitemap.xml") and os.path.exists(f"{p}/v2"):
            return p
        p = os.path.dirname(p)
    # Fallback to the documented user path
    return os.path.expanduser("~/Documents/Claude/Projects/FRQNCY WEBSITE")

BASE = os.environ.get("FRQNCY_WEBSITE_DIR", find_base())
RUNS_DIR = f"{BASE}/audits/seo/runs"

# ── Run-log inventory ──────────────────────────────────────────
run_logs = sorted(glob.glob(f"{RUNS_DIR}/*.md"))
run_logs = [p for p in run_logs if "SESSION" not in os.path.basename(p).upper()]
print(f"Run-logs on disk: {len(run_logs)}")

phase_count = {}
for p in run_logs:
    name = os.path.basename(p)
    m = re.search(r"phase-(\d+)\.", name)
    if m:
        phase = m.group(1)
        phase_count[phase] = phase_count.get(phase, 0) + 1

print("\nRun-logs per phase:")
for ph in sorted(phase_count):
    print(f"  Phase {ph}: {phase_count[ph]}")

# ── Sitemap entry count ────────────────────────────────────────
try:
    with open(f"{BASE}/sitemap.xml") as f:
        sitemap_count = f.read().count("<url>")
    print(f"\nSitemap entries: {sitemap_count}")
except FileNotFoundError:
    print("\nSitemap not found")

# ── Schema grep counts ─────────────────────────────────────────
def count_schema(at_type: str, glob_pattern: str) -> int:
    pattern_a = f'"@type":"{at_type}"'
    pattern_b = f'"@type": "{at_type}"'
    paths = glob.glob(f"{BASE}/{glob_pattern}", recursive=True)
    n = 0
    for p in paths:
        try:
            src = open(p).read()
            if pattern_a in src.replace(" ", "") or pattern_b in src:
                n += 1
        except Exception:
            pass
    return n

print("\nSchema rollout coverage:")
for at_type, label, pattern in [
    ("Article", "Article (topic + standards + mcp)", "*/index.html"),
    ("BreadcrumbList", "BreadcrumbList (item pages)", "{books,people,orgs,media,places,v2/courses}/*/index.html"),
    ("FAQPage", "FAQPage (topic + ask)", "*/index.html"),
    ("HowTo", "HowTo (courses)", "courses/*/index.html"),
    ("WebPage", "WebPage hasPart (topics)", "*/index.html"),
    ("PodcastSeries", "PodcastSeries (media)", "media/*/index.html"),
]:
    if "{" in pattern:
        # Brace expansion not native to glob; expand manually
        bases = re.findall(r'\{([^}]+)\}', pattern)
        if bases:
            options = bases[0].split(',')
            n = 0
            for opt in options:
                n += count_schema(at_type, pattern.replace("{" + bases[0] + "}", opt))
            print(f"  {label}: {n}")
            continue
    n = count_schema(at_type, pattern)
    print(f"  {label}: {n}")

# ── Topic pages with byline ────────────────────────────────────
n_byline = 0
SKIP = {"courses", "watch", "builder", "fund", "og", "_chrome"}
for d in os.listdir(f"{BASE}/v2"):
    if d in SKIP or d.startswith('.'): continue
    p = f"{BASE}/v2/{d}/index.html"
    if os.path.isfile(p) and 'class="byline"' in open(p).read():
        n_byline += 1
print(f"\nTopic pages with byline: {n_byline}")

# ── Item pages with anchored-topics ────────────────────────────
n_anchored = 0
for sector in ["books", "people", "orgs", "media", "places"]:
    for ip in glob.glob(f"{BASE}/{sector}/*/index.html"):
        if 'class="anchored-topics"' in open(ip).read():
            n_anchored += 1
print(f"Item pages with anchored-topics: {n_anchored}")

# ── New runs since PROGRESS.md was last touched ────────────────
prog_path = f"{BASE}/audits/seo/PROGRESS.md"
if os.path.exists(prog_path):
    prog_mtime = os.path.getmtime(prog_path)
    new = [p for p in run_logs if os.path.getmtime(p) > prog_mtime]
    if new:
        print(f"\nRun-logs added since PROGRESS.md last edited:")
        for p in new:
            print(f"  - {os.path.basename(p)}")
    else:
        print(f"\nPROGRESS.md is in sync with run-logs.")

print("\n" + "─" * 60)
print("Update PROGRESS.md / PROGRESS.html by hand based on the numbers above.")
print("Counter rows + tasks tables only — leave the editorial copy alone.")
