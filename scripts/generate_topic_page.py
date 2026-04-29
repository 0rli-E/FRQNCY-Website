#!/usr/bin/env python3
"""
FRQNCY · Generic topic page generator.

Reads a per-topic brief at data/topics/<slug>.yaml and writes
v2/<slug>/index.html, applying the right treatment overlay and
composing the modules from v2/_chrome/topic-base.css.

Source of truth: the YAML brief. The HTML can be re-derived at any
time, except for two protections:

  • LOCKED_TOPICS — the sacred list. Generator refuses to overwrite.
    Add a topic here once it has been hand-edited and you don't want
    a future regen to clobber it.

  • <!-- BESPOKE:slot --> ... <!-- /BESPOKE --> blocks inside the
    generated HTML. The generator preserves whatever sits between
    those markers across regenerations.

Usage:
  python scripts/generate_topic_page.py <slug>           # one topic
  python scripts/generate_topic_page.py --all            # all unlocked
  python scripts/generate_topic_page.py --dry <slug>     # print, don't write
"""
from __future__ import annotations

import argparse
import html as _html
import json
import re
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
TOPICS_DIR = ROOT / "data" / "topics"
BED_DIR = ROOT / "data"
OUT_DIR = ROOT / "v2"
TREATMENTS_DIR_REL = "../_chrome/treatments"
BASE_CSS_REL = "../_chrome/topic-base.css"

# ──────────────── Sacred list — generator refuses to overwrite ────────────────
LOCKED_TOPICS: set[str] = {
    "water",
    "music",
    "channeling",
    "watch",
    "cryptocurrency",
    "crypto",
    # Crypto sub-hubs are under /v2/crypto/<sector>/ and are managed
    # by scripts/generate_crypto_subhubs.py; this generator does not
    # touch the /v2/<slug>/ shells for those sectors either.
}

BESPOKE_BLOCK_RE = re.compile(
    r"<!--\s*BESPOKE:(?P<name>[a-zA-Z0-9_\-]+)\s*-->(?P<body>.*?)<!--\s*/BESPOKE\s*-->",
    re.DOTALL,
)


# ──────────────── Tiny markdown ────────────────
def md_inline(text: str) -> str:
    """Bold **x**, italic *x*, links [t](u). Escapes the rest."""
    if not text:
        return ""
    s = _html.escape(text, quote=False)
    s = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2">\1</a>', s)
    s = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", s)
    s = re.sub(r"\*([^*]+)\*", r"<em>\1</em>", s)
    return s


def md_block(text: str) -> str:
    """Multi-paragraph prose. Splits on blank line. Returns <p>…</p>."""
    if not text:
        return ""
    paras = [p.strip() for p in re.split(r"\n\s*\n", text.strip()) if p.strip()]
    return "\n".join(f"<p>{md_inline(p)}</p>" for p in paras)


# ──────────────── Bed lookup ────────────────
def resolve_ref(ref: str) -> dict | None:
    """ref of shape `<type>/<slug>` resolves to data/<type>/<slug>.json."""
    if "/" not in ref:
        return None
    typ, slug = ref.split("/", 1)
    p = BED_DIR / typ / f"{slug}.json"
    if p.exists():
        return json.loads(p.read_text())
    return None


# ──────────────── Bespoke slot preservation ────────────────
def extract_bespoke_slots(html: str) -> dict[str, str]:
    return {m.group("name"): m.group("body") for m in BESPOKE_BLOCK_RE.finditer(html)}


def reapply_bespoke_slots(html: str, preserved: dict[str, str]) -> str:
    """Re-inject preserved bespoke bodies into the freshly-generated HTML."""
    def _replace(m: re.Match) -> str:
        name = m.group("name")
        body = preserved.get(name, m.group("body"))
        return f"<!-- BESPOKE:{name} -->{body}<!-- /BESPOKE -->"
    return BESPOKE_BLOCK_RE.sub(_replace, html)


# ──────────────── Renderers ────────────────
def render_breadcrumb(brief: dict) -> str:
    items = brief.get("linking", {}).get("breadcrumb", [])
    if not items:
        return ""
    parts: list[str] = []
    for i, b in enumerate(items):
        last = i == len(items) - 1
        url = b.get("url")
        label = _html.escape(b.get("label", ""))
        if last or not url:
            parts.append(f"<span>{label}</span>")
        else:
            parts.append(f'<a href="{_html.escape(url)}">{label}</a>')
    return '<span class="sep">/</span>'.join(parts)


def render_hero(brief: dict) -> str:
    h = brief.get("hero") or {}
    if not h:
        return ""
    variant = h.get("variant") or "split"
    eyebrow = h.get("eyebrow", "")
    title = h.get("title", brief["meta"]["label"])
    desc = h.get("desc", "")
    quote = h.get("quote") or {}
    media = h.get("media") or {}
    poster = media.get("poster_url", "")
    video = media.get("video_url")

    media_html = ""
    if poster:
        media_html += f'<img class="hero-poster" src="{_html.escape(poster)}" alt="" aria-hidden="true">'
    if video:
        media_html += (
            f'<video class="hero-video" autoplay muted loop playsinline preload="metadata" '
            f'poster="{_html.escape(poster)}" aria-hidden="true">'
            f'<source src="{_html.escape(video)}" type="video/mp4"></video>'
        )

    glyph_html = ""
    if h.get("glyph_inline"):
        glyph_html = f'<div class="hero-glyph">{h["glyph_inline"]}</div>'

    quote_html = ""
    if quote.get("text"):
        cite = _html.escape(quote.get("cite", ""))
        quote_html = (
            f'<div class="hero-quote">{md_inline(quote["text"])}'
            + (f"<cite>{cite}</cite>" if cite else "")
            + "</div>"
        )

    inner_layout = f"layout-{variant}"
    inner_main = (
        f'<div>'
        f'<div class="hero-eyebrow">{_html.escape(eyebrow)}</div>'
        f'<h1 class="hero-title">{_html.escape(title)}</h1>'
        f'<p class="hero-desc">{md_inline(desc)}</p>'
        f"{quote_html}"
        f"</div>"
    )
    inner = inner_main + (glyph_html if glyph_html else "")

    return (
        '<section class="hero">'
        f"{media_html}"
        f'<div class="hero-inner {inner_layout}">{inner}</div>'
        '<div class="scroll-hint">descend</div>'
        "</section>"
    )


def render_prelude(brief: dict) -> str:
    p = brief.get("prelude")
    if not p:
        return ""
    parts = []
    if p.get("lede"):
        parts.append(f'<p class="lede">{md_inline(p["lede"])}</p>')
    for para in p.get("paragraphs", []) or []:
        parts.append(f"<p>{md_inline(para)}</p>")
    bq = p.get("blockquote") or {}
    if bq.get("text"):
        cite = _html.escape(bq.get("cite", ""))
        parts.append(
            f"<blockquote>{md_inline(bq['text'])}"
            + (f"<cite>{cite}</cite>" if cite else "")
            + "</blockquote>"
        )
    return f'<section class="section section-narrow fade-up">{"".join(parts)}</section>'


def render_section(s: dict, brief: dict | None = None) -> str:
    mod = s.get("module")
    if mod == "prose":
        return _render_prose(s)
    if mod == "bleed":
        return _render_bleed(s)
    if mod == "interlude":
        return _render_interlude(s)
    if mod == "descent":
        return _render_descent(s)
    if mod == "forms-grid":
        return _render_forms_grid(s)
    if mod == "practice":
        return _render_practice(s)
    if mod == "resources":
        return _render_resources(s, brief or {})
    if mod == "panel":
        return _render_panel(s)
    if mod == "bespoke":
        slot = s.get("slot", "block")
        body = s.get("html", "")
        return f"<!-- BESPOKE:{slot} -->{body}<!-- /BESPOKE -->"
    return f"<!-- unknown module: {mod} -->"


# ──────────────── Resource grid: pull from resources.json by type+topic ────────────────
_RESOURCES_CACHE: list[dict] | None = None


def _all_resources() -> list[dict]:
    global _RESOURCES_CACHE
    if _RESOURCES_CACHE is None:
        path = ROOT / "resources.json"
        _RESOURCES_CACHE = json.loads(path.read_text()) if path.exists() else []
    return _RESOURCES_CACHE


def _resources_for(topic_slug: str, types: list[str]) -> list[dict]:
    out: list[dict] = []
    seen: set[str] = set()
    for r in _all_resources():
        if r.get("topicSlug") != topic_slug:
            continue
        if types and r.get("type") not in types:
            continue
        key = r.get("name", "")
        if key in seen:
            continue
        seen.add(key)
        out.append(r)
    return out


_TYPE_LABELS = {
    "book": "Book",
    "person": "Person",
    "org": "Institution",
    "place": "Place",
    "tool": "Tool",
    "media": "Media",
    "music": "Music",
    "course": "Course",
    "platform": "Platform",
    "app": "App",
    "article": "Article",
    "reference": "Reference",
    "website": "Website",
}


def _render_resources(s: dict, brief: dict) -> str:
    label = s.get("label", "")
    title = s.get("title", "")
    types = s.get("types") or []
    extra_inline = s.get("inline") or []
    auto = s.get("auto", True)
    limit = s.get("limit", 3)

    items: list[dict] = []
    if auto:
        topic_slug = brief.get("meta", {}).get("slug", "")
        items.extend(_resources_for(topic_slug, types))
    for it in extra_inline:
        items.append(it)
    items = items[:limit]

    cards: list[str] = []
    for it in items:
        rtype = it.get("type", "")
        type_label = _TYPE_LABELS.get(rtype, rtype.title())
        url = it.get("external") or it.get("url") or "#"
        cards.append(
            f'<a class="rcard" href="{_html.escape(url)}" target="_blank" rel="noopener noreferrer">'
            f'<span class="rtype">{_html.escape(type_label)}</span>'
            '<div class="rinfo">'
            f'<h4>{md_inline(it.get("name", ""))}</h4>'
            f'<p>{md_inline(it.get("desc", ""))}</p>'
            "</div>"
            f'<span class="rlink">Visit →</span>'
            "</a>"
        )

    # Forward button to /search.html?q=<topic>&type=<primary-type>
    topic_label = brief.get("meta", {}).get("label", "")
    primary_type = types[0] if types else ""
    search_url = f"/search.html?q={_html.escape(topic_label)}"
    if primary_type:
        search_url += f"&type={_html.escape(primary_type)}"
    forward_label = s.get("forward_label") or f"All {label.lower()} on {topic_label}"
    forward = (
        f'<a class="r-forward" href="{search_url}">'
        f'{_html.escape(forward_label)} <span class="r-forward-arrow">→</span>'
        "</a>"
    )

    # Hide section entirely if no items resolved (no header, no empty placeholder).
    if not cards:
        return ""

    body = f'<div class="rlist">{"".join(cards)}</div>{forward}'

    parts: list[str] = []
    if label:
        parts.append(f'<span class="label">{_html.escape(label)}</span>')
    if title:
        parts.append(f'<h3 class="r-title">{md_inline(title)}</h3>')
    return f'<section class="resource-block fade-up">{"".join(parts)}{body}</section>'


def _render_panel(s: dict) -> str:
    label = s.get("label", "")
    title = s.get("title", "")
    intro = s.get("intro", "")
    items = s.get("items") or []
    quote = s.get("quote") or {}

    parts: list[str] = []
    if label:
        parts.append(f'<span class="label">{_html.escape(label)}</span>')
    if title:
        parts.append(f"<h3>{md_inline(title)}</h3>")
    if intro:
        parts.append(f"<p>{md_inline(intro)}</p>")

    if items:
        roman = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii"]
        cells = []
        for i, it in enumerate(items):
            num = it.get("num") or roman[i] if i < len(roman) else str(i + 1)
            cells.append(
                '<div class="panel-item">'
                f'<span class="panel-item-num">{_html.escape(num)}</span>'
                f'<h4>{md_inline(it.get("title", ""))}</h4>'
                f'<p>{md_inline(it.get("body", ""))}</p>'
                "</div>"
            )
        parts.append(f'<div class="panel-grid">{"".join(cells)}</div>')

    if quote.get("text"):
        cite = _html.escape(quote.get("cite", ""))
        parts.append(
            f'<div class="panel-quote">{md_inline(quote["text"])}'
            + (f"<cite>{cite}</cite>" if cite else "")
            + "</div>"
        )

    return f'<section class="panel fade-up">{"".join(parts)}</section>'


def _render_prose(s: dict) -> str:
    label = s.get("label", "")
    title = s.get("title", "")
    paras = s.get("paragraphs", []) or []
    parts = []
    if label:
        parts.append(f'<span class="label">{_html.escape(label)}</span>')
    if title:
        parts.append(f"<h2>{md_inline(title)}</h2>")
    for p in paras:
        parts.append(f"<p>{md_inline(p)}</p>")
    return f'<section class="section fade-up">{"".join(parts)}</section>'


def _render_bleed(s: dict) -> str:
    img = _html.escape(s.get("image_url", ""))
    cap = md_inline(s.get("caption", ""))
    cap_html = f'<div class="bleed-cap">{cap}</div>' if cap else ""
    return (
        f'<div class="bleed fade-up">'
        f'<img src="{img}" alt="" aria-hidden="true">'
        f"{cap_html}"
        "</div>"
    )


def _render_interlude(s: dict) -> str:
    quote = md_inline(s.get("quote", ""))
    cite = _html.escape(s.get("cite", ""))
    cite_html = f"<cite>{cite}</cite>" if cite else ""
    return (
        '<section class="section section-narrow interlude fade-up">'
        f"<blockquote>{quote}{cite_html}</blockquote>"
        "</section>"
    )


def _render_descent(s: dict) -> str:
    label = s.get("label", "")
    title = s.get("title", "")
    intro = s.get("intro", "")
    layers = s.get("layers", []) or []
    parts = []
    if label:
        parts.append(f'<span class="label">{_html.escape(label)}</span>')
    if title:
        parts.append(f"<h2>{md_inline(title)}</h2>")
    if intro:
        parts.append(f'<p style="max-width:60ch">{md_inline(intro)}</p>')
    layer_html = []
    for L in layers:
        num = _html.escape(L.get("num", ""))
        head = _html.escape(L.get("head", ""))
        ltitle = md_inline(L.get("title", ""))
        body = md_block(L.get("body", ""))
        callouts = ""
        for c in L.get("callouts", []) or []:
            callouts += (
                '<div class="callout">'
                f'<div class="callout-label">{_html.escape(c.get("label",""))}</div>'
                f'<div class="callout-body">{md_block(c.get("body",""))}</div>'
                "</div>"
            )
        layer_html.append(
            '<div class="layer">'
            '<div class="layer-head">'
            f'<span class="layer-num"><em>{num}</em>&thinsp;{head}</span>'
            f'<span class="layer-title">{ltitle}</span>'
            "</div>"
            f"{body}{callouts}"
            "</div>"
        )
    return (
        '<section class="section section-wide fade-up">'
        + "".join(parts)
        + f'<div class="descent">{"".join(layer_html)}</div>'
        + "</section>"
    )


def _render_forms_grid(s: dict) -> str:
    label = s.get("label", "")
    title = s.get("title", "")
    intro = s.get("intro", "")
    sub = s.get("sub_label", "")
    cells = s.get("cells", []) or []
    parts = []
    if label:
        parts.append(f'<span class="label">{_html.escape(label)}</span>')
    if title:
        parts.append(f"<h2>{md_inline(title)}</h2>")
    if intro:
        parts.append(f'<p style="max-width:60ch">{md_inline(intro)}</p>')
    if sub:
        parts.append(f'<h3 class="subgrid-label">— {_html.escape(sub)}</h3>')
    cell_html = []
    for c in cells:
        cls = "form-cell accent" if c.get("accent") else "form-cell"
        cell_html.append(
            f'<div class="{cls}">'
            f'<div class="form-cell-eyebrow">{_html.escape(c.get("eyebrow",""))}</div>'
            f'<h4>{md_inline(c.get("title",""))}</h4>'
            f"<p>{md_inline(c.get('body',''))}</p>"
            "</div>"
        )
    return (
        '<section class="section section-wide fade-up">'
        + "".join(parts)
        + f'<div class="forms-grid">{"".join(cell_html)}</div>'
        + "</section>"
    )


def _render_practice(s: dict) -> str:
    label = s.get("label", "")
    title = s.get("title", "")
    intro = s.get("intro", "")
    steps = s.get("steps", []) or []
    parts = []
    if label:
        parts.append(f'<span class="label">{_html.escape(label)}</span>')
    if title:
        parts.append(f"<h2>{md_inline(title)}</h2>")
    if intro:
        parts.append(f"<p>{md_inline(intro)}</p>")
    roman = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"]
    step_html = []
    for i, st in enumerate(steps):
        num = roman[i] if i < len(roman) else str(i + 1)
        step_html.append(
            '<div class="step">'
            f'<div class="step-num">{num}</div>'
            "<div class=\"step-body\">"
            f'<strong>{md_inline(st.get("title",""))}</strong>'
            f'<p>{md_inline(st.get("body",""))}</p>'
            "</div>"
            "</div>"
        )
    return (
        '<section class="section fade-up">'
        + "".join(parts)
        + f'<div class="practice">{"".join(step_html)}</div>'
        + "</section>"
    )


def render_picks(brief: dict) -> str:
    p = brief.get("picks") or {}
    items = p.get("items") or []
    if not items:
        return ""
    intro = p.get("intro", "")
    intro_html = (
        f'<p style="max-width:60ch">{md_inline(intro)}</p>' if intro else ""
    )
    cards = []
    for it in items:
        eyebrow = it.get("eyebrow", "")
        if "ref" in it:
            data = resolve_ref(it["ref"]) or {}
        else:
            data = it.get("inline", {}) or {}
        name = data.get("name", "")
        desc = data.get("desc", "")
        url = data.get("external") or data.get("url") or "#"
        cards.append(
            '<div class="pick">'
            f'<div class="pick-eyebrow">{_html.escape(eyebrow)}</div>'
            f'<h4>{md_inline(name)}</h4>'
            f'<p>{md_inline(desc)}</p>'
            f'<a class="pick-link" href="{_html.escape(url)}" target="_blank" rel="noopener noreferrer">Visit →</a>'
            "</div>"
        )
    return (
        '<section class="section section-wide fade-up">'
        '<span class="label">FRQNCY picks</span>'
        '<h2>Tools and texts, deeply <strong>vetted.</strong></h2>'
        f"{intro_html}"
        f'<div class="picks">{"".join(cards)}</div>'
        "</section>"
    )


def render_closing(brief: dict) -> str:
    c = brief.get("closing") or {}
    if not c:
        return ""
    bg = _html.escape(c.get("background_url", ""))
    lines = c.get("lines", []) or []
    emph = c.get("emphasis", "")
    cite = _html.escape(c.get("cite", ""))
    lines_html = "<br>".join(md_inline(L) for L in lines)
    emph_html = (
        f'<p class="emphasis"><strong>{md_inline(emph)}</strong></p>' if emph else ""
    )
    cite_html = f"<cite>{cite}</cite>" if cite else ""
    return (
        '<section class="closing fade-up">'
        f'<div class="closing-bg" style="background-image:url(\'{bg}\')" aria-hidden="true"></div>'
        '<div class="closing-inner">'
        f"<p>{lines_html}</p>"
        f"{emph_html}"
        f"{cite_html}"
        "</div></section>"
    )


# ──────────────── Page assembly ────────────────
def render_page(brief: dict) -> str:
    meta = brief["meta"]
    treatment = brief.get("treatment", {}) or {}
    register = treatment.get("register", "editorial")
    overrides = treatment.get("overrides", {}) or {}
    accent = meta.get("accent", "#C4973A")
    accent_warm = overrides.get("accent_warm", accent)
    accent_soft = f"rgba({_hex_to_rgb(accent)}, 0.14)"

    body_class = f"t-{register}"
    breadcrumb = render_breadcrumb(brief)
    bespoke = brief.get("bespoke") or {}
    bespoke_css = bespoke.get("css", "") or ""
    head_extra = bespoke.get("head_extra", "") or ""

    sections = brief.get("sections") or []
    sections_html = "\n".join(render_section(s, brief) for s in sections)

    canonical = brief.get("linking", {}).get("canonical", "")
    og_image = brief.get("linking", {}).get("og_image", "")
    raw_desc = (brief.get("hero") or {}).get("desc", "").strip().split("\n")[0]
    desc = re.sub(r"\*+", "", raw_desc)

    title = f"{meta['label']} — FRQNCY Network"
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{_html.escape(title)}</title>
<meta name="description" content="{_html.escape(desc)}">
<meta name="theme-color" content="#0B1C3D">
<meta property="og:type" content="website">
<meta property="og:title" content="{_html.escape(title)}">
<meta property="og:description" content="{_html.escape(desc)}">
<meta property="og:url" content="{_html.escape(canonical)}">
<meta property="og:image" content="{_html.escape(og_image)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:site_name" content="FRQNCY">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{_html.escape(title)}">
<meta name="twitter:description" content="{_html.escape(desc)}">
<meta name="twitter:image" content="{_html.escape(og_image)}">
<link rel="icon" type="image/svg+xml" href="../../favicon.svg">
<link rel="manifest" href="../../manifest.json">
<link rel="canonical" href="{_html.escape(canonical)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500;1,600&family=Jost:wght@200;300;400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{BASE_CSS_REL}">
<link rel="stylesheet" href="{TREATMENTS_DIR_REL}/{register}.css">
<style>
:root {{
  --accent: {accent};
  --accent-warm: {accent_warm};
  --accent-soft: {accent_soft};
}}
{bespoke_css}
</style>
{head_extra}
<script defer data-domain="frqncy.network" src="https://plausible.io/js/script.js"></script>
<script src="../../mobile-nav.js" defer></script>
<script src="../../chat-widget.js" defer></script>
<link rel="stylesheet" href="../../nav-dropdown.css">
</head>
<body class="{body_class}">

<nav class="snav">
  <div class="snav-left">
    <a href="/v2/explore.html" class="snav-logo">FRQNCY<span class="snav-badge">NETWORK</span></a>
    <div class="breadcrumb">{breadcrumb}</div>
  </div>
  <div style="display:flex;align-items:center;gap:0.75rem;flex-shrink:0">
    <a href="/people/" class="snav-back" style="border:none;padding:0;font-size:0.64rem;letter-spacing:0.12em">People</a>
    <a href="/books/"  class="snav-back" style="border:none;padding:0;font-size:0.64rem;letter-spacing:0.12em">Books</a>
    <a href="/orgs/"   class="snav-back" style="border:none;padding:0;font-size:0.64rem;letter-spacing:0.12em">Orgs</a>
    <a href="/aligned/" class="snav-back">Aligned</a>
    <a href="/" class="snav-back">← Main</a>
  </div>
</nav>

{render_hero(brief)}

<main class="topic-body">
{render_prelude(brief)}
{sections_html}
{render_picks(brief)}
</main>

{render_closing(brief)}

<footer class="site-foot">
  <span class="wm">FRQNCY</span>
  <span class="legal">© 2026 · {_html.escape(meta['label'])} · FRQNCY Network</span>
</footer>

<script>
(function () {{
  if (!('IntersectionObserver' in window)) {{
    document.querySelectorAll('.fade-up').forEach(el => el.classList.add('in'));
    return;
  }}
  const io = new IntersectionObserver((entries) => {{
    entries.forEach(entry => {{
      if (entry.isIntersecting) {{
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }}
    }});
  }}, {{ rootMargin: '0px 0px -10% 0px', threshold: 0.05 }});
  document.querySelectorAll('.fade-up').forEach(el => io.observe(el));
}})();
</script>
</body>
</html>
"""


def _hex_to_rgb(hex_str: str) -> str:
    h = hex_str.lstrip("#")
    if len(h) != 6:
        return "196, 151, 58"
    return f"{int(h[0:2], 16)}, {int(h[2:4], 16)}, {int(h[4:6], 16)}"


# ──────────────── Drive ────────────────
def generate(slug: str, dry: bool = False, force: bool = False) -> None:
    if slug in LOCKED_TOPICS and not force:
        print(f"  ⌐  {slug}: LOCKED — skipping. Use --force to override.")
        return
    brief_path = TOPICS_DIR / f"{slug}.yaml"
    if not brief_path.exists():
        print(f"  ✗  {slug}: no brief at {brief_path}")
        return
    brief = yaml.safe_load(brief_path.read_text())
    out_dir = OUT_DIR / slug
    out_dir.mkdir(exist_ok=True, parents=True)
    out_path = out_dir / "index.html"
    fresh = render_page(brief)
    if out_path.exists():
        existing = out_path.read_text()
        preserved = extract_bespoke_slots(existing)
        if preserved:
            fresh = reapply_bespoke_slots(fresh, preserved)
    if dry:
        print(fresh)
        return
    out_path.write_text(fresh)
    print(f"  ✓  {slug} → {out_path.relative_to(ROOT)}")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("slug", nargs="?", help="topic slug to generate")
    ap.add_argument("--all", action="store_true", help="generate all unlocked topics")
    ap.add_argument("--dry", action="store_true", help="print HTML, don't write")
    ap.add_argument("--force", action="store_true", help="override LOCKED_TOPICS")
    args = ap.parse_args()

    if args.all:
        for path in sorted(TOPICS_DIR.glob("*.yaml")):
            if path.name.startswith("_"):
                continue
            generate(path.stem, dry=args.dry, force=args.force)
        return 0

    if not args.slug:
        ap.print_help()
        return 1

    generate(args.slug, dry=args.dry, force=args.force)
    return 0


if __name__ == "__main__":
    sys.exit(main())
