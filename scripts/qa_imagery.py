#!/usr/bin/env python3
"""
FRQNCY · Auto-QA imagery program.

Scores each topic's hero+closing image pair against the rubric the user
ratified across four manual QA rounds (see proposals/IMAGERY-QA-LOG.md).
Flags anything below threshold so you only have to review edge cases.

Pipeline:
  1. Read each topic's YAML brief; resolve hero + closing image URLs
  2. HEAD-check each URL at 4K (C3 — automated, no LLM needed)
  3. Send to Claude with vision: topic label/desc + the 5-criterion rubric
     + the 13 distilled rules
  4. Receive structured scores per criterion (1-5) + rule-pattern flags
  5. Print per-topic report; aggregate to a markdown summary

Usage:
  python3 scripts/qa_imagery.py <slug>            # one topic
  python3 scripts/qa_imagery.py --bespoke         # only topics with overrides
  python3 scripts/qa_imagery.py --all             # every topic
  python3 scripts/qa_imagery.py --threshold 4.0   # flag <4.0 on C1 or C4
  python3 scripts/qa_imagery.py --report PATH     # write markdown summary

Requires: ANTHROPIC_API_KEY in env.
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, asdict
from pathlib import Path

import yaml

# Force unbuffered stdout so progress is visible when run in background
# (Python defaults to block-buffering when stdout is not a TTY).
try:
    sys.stdout.reconfigure(line_buffering=True)  # type: ignore[attr-defined]
except Exception:
    pass

try:
    from anthropic import Anthropic
except ImportError:
    Anthropic = None  # type: ignore

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None  # type: ignore

ROOT = Path(__file__).resolve().parent.parent
TOPICS_DIR = ROOT / "data" / "topics"
SEARCH_JSON = ROOT / "search.json"
HARNESS_KEYS = Path.home() / ".frqncy-harness" / "auth" / "keys.json"

# Provider chosen at runtime by load_client():
#   ANTHROPIC_API_KEY     → direct Anthropic, model "claude-sonnet-4-6"
#   harness OpenRouter    → OpenRouter, primary model below, with auto
#                           fallback to free Gemma 3 27B if the primary
#                           returns a 403 (key-cap exceeded).
#
# Cost notes (2026-04-29):
#   • Opus 4.1 vision: ~$0.10-0.15 per topic, ~$15-20 for full --all run
#   • Sonnet 4.6 vision: ~$0.02-0.03 per topic, ~$3-4 for full run
#   • Gemma 3 27B free: $0 — used as fallback when OR key cap is hit
ANTHROPIC_MODEL = "claude-sonnet-4-6"
OPENROUTER_MODEL = "anthropic/claude-sonnet-4.6"
OPENROUTER_FALLBACK = "google/gemma-3-27b-it:free"

# Image cache for the claude CLI provider (the CLI can only see local files).
QA_IMAGE_CACHE = Path.home() / ".frqncy-qa-cache"
THRESHOLD_C1 = 4.0  # literal subject readability — failure is a hard flag
THRESHOLD_C4 = 4.0  # FRQNCY-aesthetic alignment — failure is a hard flag

# ──────────────── The rubric (sourced from IMAGERY-QA-LOG.md) ────────
RUBRIC_PROMPT = """You are the FRQNCY imagery QA reviewer. The site is at frqncy.network — a consciousness-practice content platform with a quiet, editorial, atmospheric aesthetic (think Aman resort photography, Kinfolk magazine, Bulgari hotel imagery). Each topic page renders one HERO image at the top and one CLOSING image at the bottom; both images sit under a navy-gradient + filter chain (saturate 0.85, brightness 0.55).

Your job: score the HERO and CLOSING images for the topic below against five criteria, then flag any rule violations.

Topic
─────
slug:        {slug}
label:       {label}
domain:      {domain}
description: {desc}

Five criteria (score each 1-5 for hero AND closing separately)
──────────────────────────────────────────────────────────────
C1 · LITERAL TOPIC READABILITY (highest weight)
   Can a first-time viewer name the topic from the image alone in ~1 second?
   5 = primary subject IS the topic
   4 = primary subject is a canonical association
   3 = topic-adjacent but ambiguous
   1-2 = generic stock that could caption anything

C2 · ATMOSPHERIC MOOD
   Holds gracefully under the navy gradient + filter chain.
   5 = looks better filtered than raw
   3 = looks fine filtered, slightly washed-out raw
   1 = clashes with navy (warm orange-saturated, neon, harsh midday)

C3 · 4K TECHNICAL QUALITY
   Sharp, well-composed, professional. (HTTP 200 already verified out of band.)

C4 · FRQNCY-AESTHETIC ALIGNMENT
   5 = editorial photography in the Aman/Bulgari/Kinfolk register AND
       distinctive (named building, recognisable lineage, or signature
       composition that reads one-of-a-kind, not stock-shoot)
   4 = editorial but generic (good Unsplash/Pexels but interchangeable)
   3 = clean stock that doesn't undermine
   1 = oversaturated wedding-photographer vibes, posed selfie energy,
       real-estate-staging interior, conference-presentation aesthetic

C5 · HERO–CLOSING PAIR COHERENCE
   Same subject family, different composition. NOT the same shot twice.
   5 = related but distinct
   3 = related, somewhat repetitive
   1 = duplicate compositions or unrelated tonally

Thirteen rule patterns to check (flag any that apply)
─────────────────────────────────────────────────────
R1  Literal subject must read first; atmosphere second.
R2  Atmosphere is automatic via the CSS filter — pick for SUBJECT CLARITY.
R3  Strong fit when the photo's literal subject IS the topic's signature object.
R4  Ambiguous metaphysical/abstract topics need adjacent-symbol imagery, not "anything atmospheric."
R5  Hero–closing pair should relate but not duplicate.
R6  AVOID imagery that contradicts the topic literally (e.g., sunrise for "sleep").
R7  For abstract/inner-state topics, prefer human-presence imagery over inanimate-symbol imagery.
R8  Adjacent topics need distinct subject signatures (climate ≠ oceans; biodiversity ≠ forests).
R9  "Acceptable / alright" verdict means the bar is met but the imagery hasn't found its voice — note as parking signal.
R10 Pan-tradition stand-ins fail for tradition-specific topics (kriya-yoga needs SRF imagery, not generic Asian temples).
R11 Cold-breath imagery doesn't read as breathwork — it reads as winter / cigarette smoke.
R12 Averted faces fail human-presence imagery — face must be present in the practice (eyes closed, hands engaged).
R13 Stock-interior real-estate shots are below the FRQNCY bar even if they "fit" the topic literally. Prefer architectural exteriors, single-detail compositions, or museum/gallery interiors.

Output
──────
Return a JSON object with this exact shape (no markdown, no prose, no code fences — just the JSON):

{{
  "hero": {{
    "c1_literal": <1-5>,
    "c2_atmosphere": <1-5>,
    "c4_aesthetic": <1-5>,
    "rule_violations": [<list of rule numbers like R6, R11>],
    "subject_one_word": "<the photo's subject in 1-3 words>",
    "verdict": "approve" | "flag" | "watchlist",
    "reason": "<one short sentence>"
  }},
  "closing": {{
    "c1_literal": <1-5>,
    "c2_atmosphere": <1-5>,
    "c4_aesthetic": <1-5>,
    "rule_violations": [...],
    "subject_one_word": "<...>",
    "verdict": "approve" | "flag" | "watchlist",
    "reason": "<...>"
  }},
  "c5_pair_coherence": <1-5>,
  "overall": "approve" | "flag" | "watchlist"
}}

Verdict logic (relaxed 2026-04-29 — clean-stock no longer flags):
- "flag" only if any HARD failure:
    • c1_literal <= 2 (subject genuinely wrong/contradicts topic)
    • R6 (contradicts topic literally — e.g. sunrise for "sleep")
    • R10 (pan-tradition stand-in for tradition-specific topic — e.g. Asian pagoda for Christianity)
    • R11 (cold-breath imagery for breathwork)
    • R12 (averted face / face cropped on inner-state human-presence topic)
    • R13 (residential staging interior below FRQNCY editorial bar)
- "watchlist" if any soft signal: c1==3, c4<=3, R9 ("alright"), or pair-coherence c5<=3
- "approve" otherwise (c1>=4, c4>=4, no rule violations from the hard list)
"""


@dataclass
class Verdict:
    slug: str
    label: str
    domain: str
    hero_url: str
    closing_url: str
    hero_c1: int = 0
    hero_c2: int = 0
    hero_c4: int = 0
    hero_subject: str = ""
    hero_verdict: str = ""
    hero_reason: str = ""
    hero_violations: list = None
    closing_c1: int = 0
    closing_c2: int = 0
    closing_c4: int = 0
    closing_subject: str = ""
    closing_verdict: str = ""
    closing_reason: str = ""
    closing_violations: list = None
    c5_pair: int = 0
    overall: str = ""
    error: str = ""


def load_search() -> dict[str, dict]:
    return {t["slug"]: t for t in json.loads(SEARCH_JSON.read_text())}


def resolve_image_for(payload: dict, kind: str) -> str | None:
    """Extract hero or closing image URL from a topic YAML brief."""
    if kind == "hero":
        return ((payload.get("hero") or {}).get("media") or {}).get("poster_url")
    if kind == "closing":
        for s in payload.get("sections") or []:
            if s.get("module") == "bleed" and s.get("image_url"):
                return s["image_url"]
    return None


def head_check(url: str) -> bool:
    """Check that a URL serves a real image. Retries once on transient failure."""
    if not url:
        return False
    if url.startswith("/"):
        return (ROOT / url.lstrip("/")).exists()
    import urllib.request
    headers = {"User-Agent": "Mozilla/5.0 FRQNCY-QA/1.0"}
    for attempt in range(2):
        try:
            req = urllib.request.Request(url, method="HEAD", headers=headers)
            with urllib.request.urlopen(req, timeout=15) as r:
                return 200 <= r.status < 300
        except Exception:
            if attempt == 0:
                time.sleep(2)
                continue
    return False


def _local_data_url(url: str) -> str:
    """Encode a local /v2/_chrome/imagery/<file> as a data URL."""
    path = ROOT / url.lstrip("/")
    data = path.read_bytes()
    ext = path.suffix.lower().lstrip(".")
    mime = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
            "webp": "image/webp", "avif": "image/avif"}.get(ext, "image/jpeg")
    return f"data:{mime};base64,{base64.standard_b64encode(data).decode()}"


def image_block_anthropic(url: str) -> dict:
    """Anthropic content block from a URL or local path."""
    if url.startswith("/"):
        path = ROOT / url.lstrip("/")
        data = path.read_bytes()
        ext = path.suffix.lower().lstrip(".")
        mime = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
                "webp": "image/webp", "avif": "image/avif"}.get(ext, "image/jpeg")
        return {
            "type": "image",
            "source": {"type": "base64", "media_type": mime,
                       "data": base64.standard_b64encode(data).decode()},
        }
    return {"type": "image", "source": {"type": "url", "url": url}}


def image_block_openai(url: str) -> dict:
    """OpenAI/OpenRouter content block — always image_url with data URL for local files."""
    if url.startswith("/"):
        return {"type": "image_url", "image_url": {"url": _local_data_url(url)}}
    return {"type": "image_url", "image_url": {"url": url}}


def load_client() -> tuple[object, str, str]:
    """Return (client, provider, model).

    Priority order:
      1. claude-cli  — uses Claude Max subscription via OAuth, $0 to user
                       (within Max quota). Vision-capable; takes local
                       file paths only.
      2. anthropic   — direct Anthropic API. Per-token billing.
      3. openrouter  — paid Sonnet via OR; auto-falls back to free Gemma
                       on key-cap exhaustion.
    Override priority with QA_PROVIDER=claude-cli|anthropic|openrouter.
    """
    forced = os.environ.get("QA_PROVIDER")

    if forced != "anthropic" and forced != "openrouter":
        if shutil.which("claude"):
            return None, "claude-cli", "sonnet"

    if forced != "openrouter":
        if os.environ.get("ANTHROPIC_API_KEY") and Anthropic is not None:
            return Anthropic(), "anthropic", ANTHROPIC_MODEL

    if HARNESS_KEYS.exists():
        keys = json.loads(HARNESS_KEYS.read_text())
        or_key = keys.get("apiKeys", {}).get("openrouter")
        if or_key and OpenAI is not None:
            client = OpenAI(api_key=or_key, base_url="https://openrouter.ai/api/v1")
            return client, "openrouter", OPENROUTER_MODEL

    print("No usable provider found. Install claude CLI and run /login, "
          "set ANTHROPIC_API_KEY, or place an OpenRouter key in "
          "~/.frqncy-harness/auth/keys.json under apiKeys.openrouter",
          file=sys.stderr)
    sys.exit(1)


def _cache_image(url: str) -> Path:
    """Download a URL to ~/.frqncy-qa-cache/<hash>.<ext>; return local path.
    Local /v2/_chrome/imagery/ paths are returned unchanged."""
    if url.startswith("/"):
        return ROOT / url.lstrip("/")
    QA_IMAGE_CACHE.mkdir(parents=True, exist_ok=True)
    h = hashlib.sha1(url.encode()).hexdigest()[:16]
    ext = ".jpg"
    lower = url.lower()
    if ".png" in lower:
        ext = ".png"
    elif ".webp" in lower:
        ext = ".webp"
    elif ".avif" in lower:
        ext = ".avif"
    path = QA_IMAGE_CACHE / f"{h}{ext}"
    if not path.exists():
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 FRQNCY-QA/1.0"})
        with urllib.request.urlopen(req, timeout=30) as r, open(path, "wb") as f:
            shutil.copyfileobj(r, f)
    return path


def call_claude_cli(model: str, prompt: str, hero_url: str, closing_url: str) -> str:
    """Use the local claude CLI (Max subscription). Local image paths only."""
    hero_path = _cache_image(hero_url)
    closing_path = _cache_image(closing_url)
    full_prompt = (
        f"{prompt}\n\n"
        f"HERO image (local file): {hero_path}\n"
        f"CLOSING image (local file): {closing_path}\n"
    )
    result = subprocess.run(
        ["claude", "--print", "--output-format", "json", "--model", model, full_prompt],
        capture_output=True, text=True, timeout=180,
    )
    if result.returncode != 0:
        raise RuntimeError(f"claude CLI exit {result.returncode}: {result.stderr[:300]}")
    outer = json.loads(result.stdout)
    if outer.get("is_error"):
        raise RuntimeError(f"claude CLI error: {outer.get('result', '')[:300]}")
    return outer.get("result", "") or ""


def call_anthropic(client, model, prompt: str, hero_url: str, closing_url: str) -> str:
    msg = client.messages.create(
        model=model,
        max_tokens=1500,
        messages=[{"role": "user", "content": [
            {"type": "text", "text": prompt},
            {"type": "text", "text": "HERO image:"},
            image_block_anthropic(hero_url),
            {"type": "text", "text": "CLOSING image:"},
            image_block_anthropic(closing_url),
        ]}],
    )
    return msg.content[0].text


# Module-level state: once we get 403'd on the paid model, stop retrying it.
_OR_DEGRADED_TO_FREE = False


def call_openrouter(client, model, prompt: str, hero_url: str, closing_url: str) -> str:
    """Call OpenRouter; auto-fallback to free Gemma on 403; retry with backoff on 429."""
    global _OR_DEGRADED_TO_FREE

    def _do(m):
        completion = client.chat.completions.create(
            model=m,
            max_tokens=1500,
            messages=[{"role": "user", "content": [
                {"type": "text", "text": prompt},
                {"type": "text", "text": "HERO image:"},
                image_block_openai(hero_url),
                {"type": "text", "text": "CLOSING image:"},
                image_block_openai(closing_url),
            ]}],
        )
        return completion.choices[0].message.content

    primary = OPENROUTER_FALLBACK if _OR_DEGRADED_TO_FREE else model
    last_err = None
    for attempt in range(3):
        try:
            return _do(primary)
        except Exception as e:
            last_err = e
            msg = str(e)
            if "403" in msg or "Key limit exceeded" in msg:
                # Permanent for this session — switch to free model and retry once
                if not _OR_DEGRADED_TO_FREE:
                    _OR_DEGRADED_TO_FREE = True
                    primary = OPENROUTER_FALLBACK
                    print(f"  ⚠  paid model capped — degraded to {OPENROUTER_FALLBACK} for the rest of this run")
                    continue
                # Already on free and still 403 — give up
                raise
            if "429" in msg or "rate" in msg.lower():
                # Transient — sleep and retry
                wait = 8 * (attempt + 1)
                time.sleep(wait)
                continue
            raise
    raise last_err  # exhausted retries


def score_topic(client, provider: str, model: str,
                topic_meta: dict, brief: dict) -> Verdict:
    slug = topic_meta["slug"]
    label = topic_meta.get("label", slug)
    domain = topic_meta.get("domain", "")
    desc = topic_meta.get("desc", "")

    hero_url = resolve_image_for(brief, "hero") or ""
    closing_url = resolve_image_for(brief, "closing") or ""

    v = Verdict(slug=slug, label=label, domain=domain,
                hero_url=hero_url, closing_url=closing_url,
                hero_violations=[], closing_violations=[])

    if not hero_url or not closing_url:
        v.error = "missing image URL"
        return v
    # Skip HEAD checks under claude-cli — _cache_image will fetch and fail
    # loud if the URL is broken, so the HEAD round-trip is redundant. Saves
    # ~15-30s per topic when running parallel chunks.
    if provider != "claude-cli":
        if not head_check(hero_url):
            v.error = f"hero HEAD failed: {hero_url}"
            return v
        if not head_check(closing_url):
            v.error = f"closing HEAD failed: {closing_url}"
            return v

    prompt = RUBRIC_PROMPT.format(slug=slug, label=label, domain=domain, desc=desc[:300])

    try:
        if provider == "claude-cli":
            text = call_claude_cli(model, prompt, hero_url, closing_url)
        elif provider == "anthropic":
            text = call_anthropic(client, model, prompt, hero_url, closing_url)
        else:
            text = call_openrouter(client, model, prompt, hero_url, closing_url)
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if not match:
            v.error = f"no JSON in response: {text[:200]}"
            return v
        data = json.loads(match.group(0))
        h, c = data.get("hero", {}), data.get("closing", {})
        v.hero_c1 = int(h.get("c1_literal", 0))
        v.hero_c2 = int(h.get("c2_atmosphere", 0))
        v.hero_c4 = int(h.get("c4_aesthetic", 0))
        v.hero_subject = str(h.get("subject_one_word", ""))
        v.hero_verdict = str(h.get("verdict", ""))
        v.hero_reason = str(h.get("reason", ""))
        v.hero_violations = list(h.get("rule_violations", []))
        v.closing_c1 = int(c.get("c1_literal", 0))
        v.closing_c2 = int(c.get("c2_atmosphere", 0))
        v.closing_c4 = int(c.get("c4_aesthetic", 0))
        v.closing_subject = str(c.get("subject_one_word", ""))
        v.closing_verdict = str(c.get("verdict", ""))
        v.closing_reason = str(c.get("reason", ""))
        v.closing_violations = list(c.get("rule_violations", []))
        v.c5_pair = int(data.get("c5_pair_coherence", 0))
        v.overall = str(data.get("overall", ""))
    except Exception as e:
        v.error = f"{type(e).__name__}: {e}"

    return v


def render_row(v: Verdict) -> str:
    if v.error:
        return f"  ⚠  {v.slug:<24} ERROR: {v.error}"
    icon = {"approve": "✓", "watchlist": "⚪", "flag": "✗"}.get(v.overall, "?")
    line = (f"  {icon}  {v.slug:<24} {v.overall:<10} "
            f"hero[{v.hero_c1}/{v.hero_c4}] {v.hero_subject:<20} | "
            f"closing[{v.closing_c1}/{v.closing_c4}] {v.closing_subject}")
    if v.hero_violations or v.closing_violations:
        all_v = sorted(set(v.hero_violations + v.closing_violations))
        line += f"  rules: {','.join(all_v)}"
    return line


def render_markdown(verdicts: list[Verdict], model: str = "") -> str:
    out = ["# Imagery QA — auto-run", "",
           f"Generated: {time.strftime('%Y-%m-%d %H:%M')}  ·  Model: `{model}`",
           f"Topics scored: {len(verdicts)}", ""]
    counts = {"approve": 0, "watchlist": 0, "flag": 0, "error": 0}
    for v in verdicts:
        counts["error" if v.error else (v.overall or "flag")] += 1
    out.append(f"**Summary:** {counts['approve']} approved · {counts['watchlist']} watchlist · "
               f"{counts['flag']} flagged · {counts['error']} errors")
    out.append("")

    if any(v.overall == "flag" for v in verdicts if not v.error):
        out.append("## ✗ Flagged — recommend swap")
        out.append("")
        out.append("| slug | hero subject (C1/C4) | closing subject (C1/C4) | rules | reason |")
        out.append("|---|---|---|---|---|")
        for v in verdicts:
            if v.error or v.overall != "flag":
                continue
            rules = ",".join(sorted(set(v.hero_violations + v.closing_violations)))
            reason = v.hero_reason if v.hero_c1 < 4 or v.hero_c4 < 4 else v.closing_reason
            out.append(f"| `{v.slug}` | {v.hero_subject} ({v.hero_c1}/{v.hero_c4}) | "
                       f"{v.closing_subject} ({v.closing_c1}/{v.closing_c4}) | "
                       f"{rules} | {reason} |")
        out.append("")

    if any(v.overall == "watchlist" for v in verdicts if not v.error):
        out.append("## ⚪ Watchlist — passable, not great")
        out.append("")
        out.append("| slug | hero | closing | reason |")
        out.append("|---|---|---|---|")
        for v in verdicts:
            if v.error or v.overall != "watchlist":
                continue
            out.append(f"| `{v.slug}` | {v.hero_subject} | {v.closing_subject} | {v.hero_reason} |")
        out.append("")

    if any(v.overall == "approve" for v in verdicts if not v.error):
        out.append("## ✓ Approved")
        out.append("")
        for v in verdicts:
            if v.error or v.overall != "approve":
                continue
            out.append(f"- `{v.slug}` — {v.hero_subject} + {v.closing_subject}")
        out.append("")

    if any(v.error for v in verdicts):
        out.append("## ⚠ Errors")
        out.append("")
        for v in verdicts:
            if v.error:
                out.append(f"- `{v.slug}` — {v.error}")
    return "\n".join(out)


def topics_with_overrides() -> set[str]:
    """Parse draft_all_topics.py to find which slugs have override entries."""
    src = (ROOT / "scripts" / "draft_all_topics.py").read_text()
    slugs: set[str] = set()
    for m in re.finditer(r'"([a-z][a-z0-9-]+)":\s*[_\w(]', src):
        slugs.add(m.group(1))
    # Filter out non-slug keys: domains, treatment names, etc.
    domains = {"Sciences", "Money", "Metaphysics", "Well-being", "Lifestyle"}
    return {s for s in slugs if s not in {d.lower() for d in domains}}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("slug", nargs="?")
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--bespoke", action="store_true",
                    help="only topics with override imagery")
    ap.add_argument("--slug-file", default="",
                    help="newline-delimited file of slugs to score (for parallel chunks)")
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--workers", type=int, default=3,
                    help="number of parallel claude-cli calls per chunk (default 3)")
    ap.add_argument("--report", default="")
    args = ap.parse_args()

    client, provider, model = load_client()
    search = load_search()

    if args.slug:
        slugs = [args.slug]
    elif args.slug_file:
        slugs = [s.strip() for s in Path(args.slug_file).read_text().splitlines() if s.strip()]
    elif args.bespoke:
        slugs = sorted(topics_with_overrides() & set(search.keys()))
    elif args.all:
        slugs = sorted(search.keys())
    else:
        ap.print_help()
        return 1

    if args.limit:
        slugs = slugs[:args.limit]

    workers = max(1, args.workers)
    print(f"Scoring {len(slugs)} topic(s) via {provider} ({model}) — {workers} parallel worker(s)…\n")

    def _process(slug: str) -> tuple[Verdict | None, str, str]:
        meta = search.get(slug)
        brief_path = TOPICS_DIR / f"{slug}.yaml"
        if not meta or not brief_path.exists():
            return None, slug, "no brief or search.json entry"
        brief = yaml.safe_load(brief_path.read_text())
        v = score_topic(client, provider, model, meta, brief)
        return v, slug, ""

    verdicts: list[Verdict] = []
    if workers == 1:
        for slug in slugs:
            v, sl, err = _process(slug)
            if v is None:
                print(f"  ✗  {sl}: {err}")
                continue
            verdicts.append(v)
            print(render_row(v))
    else:
        with ThreadPoolExecutor(max_workers=workers) as ex:
            futures = {ex.submit(_process, slug): slug for slug in slugs}
            for fut in as_completed(futures):
                v, sl, err = fut.result()
                if v is None:
                    print(f"  ✗  {sl}: {err}")
                    continue
                verdicts.append(v)
                print(render_row(v))

    # Summary
    counts = {"approve": 0, "watchlist": 0, "flag": 0, "error": 0}
    for v in verdicts:
        counts["error" if v.error else (v.overall or "flag")] += 1
    print(f"\nSummary: {counts['approve']} approved · {counts['watchlist']} watchlist · "
          f"{counts['flag']} flagged · {counts['error']} errors")

    # Markdown report
    report_path = Path(args.report) if args.report else (
        ROOT / f"proposals/IMAGERY-QA-RUN-{time.strftime('%Y-%m-%d')}.md")
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(render_markdown(verdicts, model))
    try:
        rel = report_path.relative_to(ROOT)
    except ValueError:
        rel = report_path
    print(f"\nReport: {rel}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
