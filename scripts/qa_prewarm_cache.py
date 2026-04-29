#!/usr/bin/env python3
"""
Pre-warm ~/.frqncy-qa-cache/ with every hero+closing image URL referenced
across the topic YAMLs. Parallel-download (16 workers) so the auto-QA
parallel chunks don't each pay download cost on first encounter.

Usage: python3 scripts/qa_prewarm_cache.py
"""
from __future__ import annotations

import hashlib
import shutil
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
TOPICS_DIR = ROOT / "data" / "topics"
CACHE = Path.home() / ".frqncy-qa-cache"
CACHE.mkdir(parents=True, exist_ok=True)


def collect_urls() -> set[str]:
    urls: set[str] = set()
    for path in TOPICS_DIR.glob("*.yaml"):
        if path.name.startswith("_"):
            continue
        try:
            brief = yaml.safe_load(path.read_text())
        except Exception:
            continue
        hero = (brief.get("hero") or {}).get("media", {}).get("poster_url")
        if hero and not hero.startswith("/v2/"):
            urls.add(hero)
        for s in brief.get("sections") or []:
            if s.get("module") == "bleed" and s.get("image_url"):
                u = s["image_url"]
                if not u.startswith("/v2/"):
                    urls.add(u)
    return urls


def cache_path(url: str) -> Path:
    h = hashlib.sha1(url.encode()).hexdigest()[:16]
    ext = ".jpg"
    lower = url.lower()
    if ".png" in lower:
        ext = ".png"
    elif ".webp" in lower:
        ext = ".webp"
    elif ".avif" in lower:
        ext = ".avif"
    return CACHE / f"{h}{ext}"


def fetch(url: str) -> tuple[str, str]:
    path = cache_path(url)
    if path.exists() and path.stat().st_size > 0:
        return url, "cached"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 FRQNCY-QA/1.0"})
        with urllib.request.urlopen(req, timeout=30) as r, open(path, "wb") as f:
            shutil.copyfileobj(r, f)
        return url, "ok"
    except Exception as e:
        return url, f"err: {type(e).__name__}"


def main() -> int:
    urls = sorted(collect_urls())
    print(f"Pre-warming {len(urls)} unique image URLs into {CACHE}…")
    counts = {"cached": 0, "ok": 0, "err": 0}
    with ThreadPoolExecutor(max_workers=16) as ex:
        for fut in as_completed([ex.submit(fetch, u) for u in urls]):
            url, status = fut.result()
            key = "err" if status.startswith("err") else status
            counts[key] += 1
            if key == "err":
                print(f"  ✗  {status}  {url[:80]}")
    print(f"\nDone — cached: {counts['cached']} | downloaded: {counts['ok']} | errors: {counts['err']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
