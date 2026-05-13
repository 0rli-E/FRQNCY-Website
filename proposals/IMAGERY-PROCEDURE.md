# FRQNCY · Imagery Sourcing Procedure

The proven process for adding 4K topic-specific photography to FRQNCY topic pages.
Locked 2026-04-29 after the iteration that produced the imagery the user approved
("absolutely amazing", "history is great", "oceans is great", "forest is fantastic").

This document is the source of truth. Anyone (or any agent) extending the imagery
should follow this procedure exactly. Do not skip steps. Do not regress on the
quality bar.

---

## The quality bar (non-negotiable)

A photo qualifies for FRQNCY topic imagery only if it meets all five:

1. **4K resolution** — served at `?w=3840` (true 4K UHD width). Sub-4K only with explicit user approval, flagged in code.
2. **Landscape orientation** — fills the hero/closing-bleed slot edge-to-edge without awkward cropping.
3. **Atmospheric mood** — holds up under the navy filter chain (`saturate(0.85) brightness(0.55)` + radial gradient overlay). Test by rendering and viewing.
4. **Topically aligned** — sketches the topic visually without being literal-stock-photo cheesy. Aman/Bulgari/Pexels-editorial aesthetic > generic stock.
5. **Free + commercial-use license** — Unsplash, Pexels, Wikimedia, NASA are OK. Pinterest, all-rights-reserved, attribution-required-with-link are NOT.

If any of the five fails, don't use it. There are always more options.

---

## Approved sources (ranked by leverage)

| Source | License | Hotlinkable 4K | Helper | Best for |
|---|---|---|---|---|
| **Unsplash** | royalty-free | ✓ via `images.unsplash.com/<id>?w=3840` | `_u(id)` | lifestyle, architecture, atmospheric |
| **Pexels** | royalty-free | ✓ via `images.pexels.com/photos/<id>/pexels-photo-<id>.jpeg?w=3840` | `_p(id)` | wellness, food, nature, niche topics |
| **Local (Dreambuilding etc.)** | owned/licensed | served from `v2/_chrome/imagery/` | n/a | bespoke seeds (Aman, Bulgari, etc.) |
| **Wikimedia Commons** | CC/PD | partial (per-file lookup) | n/a | art history, historical, sculpture |
| **NASA Image Library** | public domain | needs API auth | n/a | space/cosmos *(not yet integrated)* |

**Avoid:**

- **Pinterest** — not a sourcing platform. Re-pin URLs expire, licenses are upstream and often unknown, hotlinks break. Even when an image looks right.
- **Pixabay** — anti-bot blocks WebFetch on search pages (HTTP 403). Would need an API key + auth flow. Skip until that's set up.
- **Google Image search** — license filter unreliable; many results are scraped/restated.

---

## The procedure (step-by-step)

### 1. Identify the topics that need elevation

Run a quick visual review of the existing override map versus the topic graph. Targets:

- A topic where the domain default feels wrong or generic.
- A topic the user has explicitly flagged.
- A topic where the editorial fit would obviously elevate the page (e.g., `astrophysics` → space photography; `forests` → misty trees).

### 2. Search the source for candidates

Use WebFetch against a topical search URL on the source. Examples that worked:

```
https://www.pexels.com/search/foggy%20forest/
https://www.pexels.com/search/galaxy%20space/
https://www.pexels.com/search/healthy%20food%20bowl/
https://unsplash.com/s/photos/zen-garden
https://unsplash.com/s/photos/buddhist-temple
```

Prompt: ask the model to extract the photo IDs and one-line descriptions.

### 3. Verify each ID resolves at 4K

Run a HEAD request against the CDN URL at `?w=3840`. Expected: `200`.

```bash
for id in <id1> <id2> ...; do
  url="https://images.unsplash.com/${id}?auto=format&fit=crop&q=85&w=3840"
  # or for Pexels:
  # url="https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?cs=srgb&fm=jpg&w=3840"
  code=$(curl -sIo /dev/null -w "%{http_code}" "$url")
  echo "$code  $id"
done
```

Discard any that 404. Don't assume — the search results often surface premium-only or removed photos.

### 4. Pick a hero + closing pair per topic

Each topic gets exactly two photos. The pair should be visually related but distinct (not the same composition twice). The hero opens the page; the closing seals it.

Avoid:

- Same image used for both hero and closing on a single topic.
- Same image used across multiple topics (zero collisions across the network).
- Pairs that fight each other tonally — both should sit in the same emotional register.

### 5. Add the entries to the override dicts

In `scripts/draft_all_topics.py`:

```python
TOPIC_OVERRIDE_HERO: dict[str, str] = {
    ...
    "<slug>":             _u("photo-XXXXXXXXXXXXX-XXXXXXXXXXXX"),  # description
    # or for Pexels:
    "<slug>":             _p(<numeric-id>),  # description
}

TOPIC_OVERRIDE_CLOSING: dict[str, str] = {
    ...
    "<slug>":             _p(<numeric-id>),  # description
}
```

Use the `_u()` helper for Unsplash, `_p()` for Pexels, and a literal `/v2/_chrome/imagery/<file>` path for local files. Leave a one-line trailing comment with the photo's gist — future agents will need it.

### 6. Re-draft and regenerate

```bash
cd "/Users/orli/Documents/Claude/Projects/FRQNCY WEBSITE"
find data/topics -maxdepth 1 -name "*.yaml" ! -name "_*" ! -name "sports.yaml" -delete
python3 scripts/draft_all_topics.py
python3 scripts/generate_topic_page.py --all
```

The first command wipes the auto-drafted YAML briefs (preserving locked + bespoke ones). The second re-generates them with the new overrides. The third produces all 142 HTML pages.

### 7. Visually verify

Open the affected pages in a browser. Check that:

- The hero image fills the viewport edge-to-edge with no awkward cropping.
- The image holds up under the navy gradient + filter chain (no neon clashing, no muddy mush).
- Hero and closing images relate but don't clone each other.
- The image fits the topic — a stranger landing on the page would intuit what it's about.

If any of these fail, swap the photo. Iterate until the page reads.

```bash
open <slug>/index.html
```

---

## Locked inventory (as of 2026-04-29)

- **Domain layer (Layer A):** 30 hand-picked Unsplash photos covering all 15 FRQNCY domains. Hero + closing pair per domain. The fallback that 111 of 142 topics still use. Approved by user. Defined in `DOMAIN_HERO` and `DOMAIN_CLOSING_IMG`.

- **Topic overrides (Layer B):** 31 topics with bespoke imagery — 15 Unsplash + 18 Pexels + 3 local Dreambuilding. Defined in `TOPIC_OVERRIDE_HERO` and `TOPIC_OVERRIDE_CLOSING`.

User-approved topic overrides locked into the system. Do NOT regress these without an explicit user request:

```
history, oceans, audio, forests, nutrition, cosmos, astrophysics, plant-medicine,
leisure, minimalism, body-care, meditation, mindfulness, presence, breathwork,
detox, siddha-yoga, kriya-yoga, taoism, christianity, architecture, yoga, soul,
somatic-therapy
```

---

## When to source vs. when to commission

**Source from Unsplash/Pexels** when:

- The topic is a known concept with stock imagery in abundance (yoga, meditation, food, ocean, forest, galaxy).
- The mood you want is "atmospheric editorial" rather than something specific.
- You can find a photo that hits the bar in under three searches.

**Commission a custom shoot or specific photographer** when:

- The topic is FRQNCY-original or has no good stock equivalent (Word Illuminator, the Council, specific FRQNCY rituals).
- The page is a flagship commission (water, music, channeling — already done).
- The user has identified a gap stock can't fill.

---

## Verifying network-wide uniqueness

Before shipping any new override, confirm no two topics share an image:

```bash
cd "/Users/orli/Documents/Claude/Projects/FRQNCY WEBSITE"
python3 -c "
import re, glob
from collections import Counter
urls = []
for path in glob.glob('*/index.html'):
    if path.count('/') > 3: continue
    txt = open(path).read()
    for u in re.findall(r'https://(?:images\.unsplash\.com|images\.pexels\.com)/[^\s\"\\']+', txt):
        urls.append(u.split('?')[0])  # strip query string for fair comparison
counts = Counter(urls)
dups = {u:c for u,c in counts.items() if c > 1}
print(f'Total: {len(urls)} | Unique: {len(set(urls))} | Duplicates: {len(dups)}')
"
```

Zero duplicates = ship. Any duplicates = swap one of the colliders before shipping.

---

## Future expansions

When the time comes:

- **NASA API** — register for an `api.nasa.gov` key, integrate into a search step. Unlocks public-domain space photography for the cosmos quadrant.
- **Wikimedia Commons API** — query by category, fetch original-size URLs (drop `/thumb/` from the URL pattern). Unlocks classical art for `mythology`, `sculpture`, `visual-art`.
- **Pixabay API** — register for a key, integrate. Unlocks the niche-science quadrant where Unsplash/Pexels thin out.
- **Local commissions** — when a topic earns it, commission an original photo and drop it into `v2/_chrome/imagery/` with a meaningful filename. Add to the override dict using a literal path.

Each expansion follows the same procedure above. The helpers (`_u`, `_p`) extend by analogy: `_n(asset_id)` for NASA, `_w(file_path)` for Wikimedia, `_x(pixabay_id)` for Pixabay.

---

*Procedure approved by user. Update only when the workflow itself changes — not with each new topic.*
