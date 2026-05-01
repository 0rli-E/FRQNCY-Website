import json, os
base = "/sessions/zealous-magical-sagan/mnt/Projects/FRQNCY WEBSITE"

content = json.load(open(f"{base}/content.json"))
topics = content['topics']
domain_lookup = {d['id']: d['label'] for d in content['domains']}

# Fast-moving list (from FRESHNESS-RUBRIC.md §"Quarterly")
FAST_MOVING = {
    'artificial-intelligence', 'cryptocurrency', 'defi', 'decentralized-networks',
    'blockchain', 'ar-vr', 'biotechnology', 'psychedelics', 'network-state',
    'climate', 'bioenergy', 'ecological-economics',
}

# Build classification
fast = []
evergreen = []
for t in topics:
    rec = {'slug': t['slug'], 'label': t['label'], 'domain': domain_lookup.get(t['domain'], t['domain'])}
    if t['slug'] in FAST_MOVING:
        fast.append(rec)
    else:
        evergreen.append(rec)

# Sort evergreen alphabetically and round-robin into 4 quarters
evergreen.sort(key=lambda r: r['slug'])
quarters = {1: [], 2: [], 3: [], 4: []}
for i, t in enumerate(evergreen):
    q = (i % 4) + 1
    quarters[q].append(t)

# Build the calendar markdown
lines = ["# FRQNCY Quarterly Review Calendar",
         "",
         "Generated 2026-04-29. Pairs with `FRESHNESS-RUBRIC.md`.",
         "",
         "## Fast-moving topics (reviewed every quarter)",
         "",
         f"These {len(fast)} topics are reviewed every 90 days, regardless of which evergreen quarter is active. The next review is due 2026-07-29.",
         "",
         "| Slug | Label | Domain |",
         "| --- | --- | --- |",
         ]
for t in sorted(fast, key=lambda r: r['slug']):
    lines.append(f"| `{t['slug']}` | {t['label']} | {t['domain']} |")

lines += ["",
          "## Evergreen rotation (annual, balanced across 4 quarters)",
          "",
          f"{len(evergreen)} evergreen topics distributed evenly across the four quarters. Each topic is reviewed once per year. Quarter 1 starts in May 2026 (i.e., 2026-Q3 in fiscal terms — adjust if a different fiscal calendar is preferred).",
          ""]

# Add per-quarter sections
quarter_dates = {
    1: "May–Jul 2026 (next: 2026-05 to 2026-07)",
    2: "Aug–Oct 2026 (next: 2026-08 to 2026-10)",
    3: "Nov 2026–Jan 2027 (next: 2026-11 to 2027-01)",
    4: "Feb–Apr 2027 (next: 2027-02 to 2027-04)",
}
for q, items in quarters.items():
    lines += [f"### Quarter {q} — {quarter_dates[q]} ({len(items)} topics)", ""]
    lines += ["| Slug | Label | Domain |", "| --- | --- | --- |"]
    for t in items:
        lines.append(f"| `{t['slug']}` | {t['label']} | {t['domain']} |")
    lines.append("")

lines += ["## How to log a review",
          "",
          "Per `FRESHNESS-RUBRIC.md` §\"Log the review\". Append a one-line entry to the topic's review log when a review completes.",
          "",
          "## When to move a topic between fast-moving and evergreen",
          "",
          "- **Move evergreen → fast-moving** when the last annual review surfaced ≥ 3 substantive changes.",
          "- **Move fast-moving → evergreen** when two consecutive quarterly reviews each surfaced ≤ 1 change.",
          "",
          "Update this file when a topic moves. Re-run the calendar generator (`audits/seo/runs/2026-04-29-build-calendar.py`) to rebalance evergreen across quarters.",
          "",
          f"## Counters",
          "",
          f"- Fast-moving topics: **{len(fast)}**",
          f"- Evergreen topics: **{len(evergreen)}**",
          f"- Total topics in rotation: **{len(fast) + len(evergreen)}**",
          f"- Topics per evergreen quarter: ~{len(evergreen) // 4}",
          f"- Approximate weekly review load: ~{((len(fast) * 4 + len(evergreen)) // 52) + 1} topics/week",
          ]

open(f"{base}/audits/seo/QUARTERLY-REVIEW-CALENDAR.md", "w").write("\n".join(lines))

# Save the script for re-runs
import shutil
shutil.copy("/tmp/build_calendar.py", f"{base}/audits/seo/runs/2026-04-29-build-calendar.py")

print(f"Calendar built: {len(fast)} fast-moving + {len(evergreen)} evergreen across 4 quarters")
