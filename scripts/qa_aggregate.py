#!/usr/bin/env python3
"""
Aggregate parallel-chunk QA reports into one network-wide triage.

Reads /tmp/qa-chunk-{1..N}.md (or any list of report paths), merges
the per-topic verdicts, and prints a single ✗ flagged / ⚪ watchlist /
✓ approved triage. Writes a combined markdown report.

Usage:
  python3 scripts/qa_aggregate.py
  python3 scripts/qa_aggregate.py /tmp/qa-chunk-1.md /tmp/qa-chunk-2.md ...
  python3 scripts/qa_aggregate.py --output proposals/IMAGERY-QA-RUN-FULL-<date>.md
"""
from __future__ import annotations

import argparse
import re
import sys
import time
from collections import defaultdict
from pathlib import Path

DEFAULT_GLOB = "/tmp/qa-chunk-*.md"


# Rule patterns that constitute HARD flags (all others → watchlist)
HARD_RULES = {"R6", "R10", "R11", "R12", "R13"}


def reclassify(cols: list[str]) -> str:
    """Given a flagged-table row's cols, decide if it's actually hard or soft.
       cols: [slug, hero(C1/C4), closing(C1/C4), rules, reason]
       Returns 'flag' | 'watchlist' | 'approve'."""
    if len(cols) < 4:
        return "watchlist"

    def parse_scores(cell: str) -> tuple[int, int]:
        m = re.search(r"\((\d)/(\d)\)", cell)
        if m:
            return int(m.group(1)), int(m.group(2))
        return 5, 5

    h_c1, h_c4 = parse_scores(cols[1])
    c_c1, c_c4 = parse_scores(cols[2])
    rules = cols[3] if len(cols) > 3 else ""
    rule_set = {r.strip() for r in rules.replace(",", " ").split() if r.strip().startswith("R")}

    # Hard flag conditions
    if h_c1 <= 2 or c_c1 <= 2:
        return "flag"
    if rule_set & HARD_RULES:
        return "flag"

    # Watchlist conditions (anything not perfect)
    if min(h_c1, c_c1) == 3 or h_c4 <= 3 or c_c4 <= 3 or rule_set:
        return "watchlist"

    return "approve"


def parse_report(path: Path) -> dict[str, list[dict]]:
    """Return {bucket: [rows]} where bucket is 'flag' | 'watchlist' | 'approve' | 'error'.
       Re-classifies the agent's flag/watchlist verdict against the relaxed rubric."""
    text = path.read_text() if path.exists() else ""
    out: dict[str, list[dict]] = {"flag": [], "watchlist": [], "approve": [], "error": []}
    section = None
    for line in text.splitlines():
        if line.startswith("## ✗ Flagged"):
            section = "flag"; continue
        if line.startswith("## ⚪ Watchlist"):
            section = "watchlist"; continue
        if line.startswith("## ✓ Approved"):
            section = "approve"; continue
        if line.startswith("## ⚠ Errors"):
            section = "error"; continue
        if section is None or not line.startswith("|") and not line.startswith("- "):
            continue
        if line.startswith("|---"):
            continue
        if section == "approve" and line.startswith("- "):
            m = re.match(r"- `([^`]+)` — (.+)", line)
            if m:
                out["approve"].append({"slug": m.group(1), "summary": m.group(2)})
        elif section == "error" and line.startswith("- "):
            m = re.match(r"- `([^`]+)` — (.+)", line)
            if m:
                out["error"].append({"slug": m.group(1), "reason": m.group(2)})
        elif section in ("flag", "watchlist") and line.startswith("| `"):
            cols = [c.strip() for c in line.split("|")[1:-1]]
            if not cols or not cols[0].startswith("`"):
                continue
            slug = cols[0].strip("`")
            row = {"slug": slug, "cols": cols}
            # Re-bucket using relaxed rubric
            new_bucket = reclassify(cols)
            out[new_bucket].append(row)
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("reports", nargs="*")
    ap.add_argument("--output", default="")
    args = ap.parse_args()

    paths = [Path(p) for p in args.reports] if args.reports else sorted(Path("/tmp").glob("qa-chunk-*.md"))
    if not paths:
        print("No reports found.", file=sys.stderr)
        return 1

    merged = {"flag": [], "watchlist": [], "approve": [], "error": []}
    for path in paths:
        if not path.exists():
            continue
        chunks = parse_report(path)
        for k in merged:
            merged[k].extend(chunks[k])

    total = sum(len(v) for v in merged.values())
    print(f"Aggregated {total} verdicts from {len(paths)} reports:")
    print(f"  ✓ approved:  {len(merged['approve'])}")
    print(f"  ⚪ watchlist: {len(merged['watchlist'])}")
    print(f"  ✗ flagged:   {len(merged['flag'])}")
    print(f"  ⚠ errors:    {len(merged['error'])}")

    out_path = Path(args.output) if args.output else Path(
        f"proposals/IMAGERY-QA-AGGREGATE-{time.strftime('%Y-%m-%d')}.md"
    )
    out_path.parent.mkdir(parents=True, exist_ok=True)

    lines = [
        "# Imagery QA — aggregated network-wide triage",
        "",
        f"Generated: {time.strftime('%Y-%m-%d %H:%M')}  ·  Sources: {', '.join(p.name for p in paths)}",
        "",
        f"**Summary:** {len(merged['approve'])} approved · "
        f"{len(merged['watchlist'])} watchlist · "
        f"{len(merged['flag'])} flagged · "
        f"{len(merged['error'])} errors",
        "",
    ]
    if merged["flag"]:
        lines += ["## ✗ Flagged — recommend swap", "",
                  "| slug | hero (C1/C4) | closing (C1/C4) | rules | reason |",
                  "|---|---|---|---|---|"]
        for r in sorted(merged["flag"], key=lambda x: x["slug"]):
            lines.append("| " + " | ".join(r["cols"]) + " |")
        lines.append("")
    if merged["watchlist"]:
        lines += ["## ⚪ Watchlist — passable, not great", "",
                  "| slug | hero | closing | reason |",
                  "|---|---|---|---|"]
        for r in sorted(merged["watchlist"], key=lambda x: x["slug"]):
            lines.append("| " + " | ".join(r["cols"]) + " |")
        lines.append("")
    if merged["approve"]:
        lines += ["## ✓ Approved", ""]
        for r in sorted(merged["approve"], key=lambda x: x["slug"]):
            if "summary" in r:
                lines.append(f"- `{r['slug']}` — {r['summary']}")
            else:
                # Came from reclassification — use cols
                cols = r.get("cols", [])
                summary = " · ".join(cols[1:3]) if len(cols) >= 3 else "auto-approved"
                lines.append(f"- `{r['slug']}` — {summary}")
        lines.append("")
    if merged["error"]:
        lines += ["## ⚠ Errors", ""]
        for r in sorted(merged["error"], key=lambda x: x["slug"]):
            lines.append(f"- `{r['slug']}` — {r['reason']}")
        lines.append("")

    out_path.write_text("\n".join(lines))
    print(f"\nReport: {out_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
