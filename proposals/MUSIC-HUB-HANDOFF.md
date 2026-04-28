# Music Hub — Handoff

**Date built:** 2026-04-28
**Status:** Scaffold live. Empty sections waiting for content. Orlando will fill.

## What this is

A new top-level music hub at `v2/music-hub/` modeled after the crypto hub. Hosts artists, albums, playlists, and genre/scene/label sub-navigation. The existing `v2/music/` topic page (curated books + tools) is untouched and now linked from the new hub as a companion "Topic Page" reference.

## Why two music pages

Per the user's choice when offered three options:

- `v2/music/` — topic page in the network graph. Curated resources (books, tools). Has an entry in `search.json`. Stays as-is.
- `v2/music-hub/` — listening hub. Artists, albums, playlists, genres. The "music itself" rather than what's been written about it.

The CTA at the bottom of the hub points back to the topic page so they cross-link.

## Files touched

| File | Change |
|---|---|
| `v2/music-hub/index.html` | **Created.** Full hub scaffold, ~395 lines, single-file vanilla HTML/CSS, no build step. |
| `v2/explore.html` | Added `<a href="music-hub/index.html">Music</a>` to the top nav between Watch and Courses (line ~343). |

Nothing else. No JSON edits. No changes to `v2/music/` topic page.

## Page structure

Five blocks in order:

1. **Hero** — eyebrow `music.frqncy`, h1 "Music", warm-amber radial glow background.
2. **Intro paragraph** — explains the relationship between this hub and the topic page, with an inline link.
3. **Four sections** in `<main>`:
   - `#artists` — grid of square `.acard` tiles (image/initial + name + meta + desc).
   - `#albums` — grid of `.bcard` cover-art tiles with year pill, title, artist.
   - `#playlists` — vertical `.pcard` rows for Spotify/YouTube/Bandcamp/SoundCloud links with platform tag and runtime.
   - `#genres` — `.cat-tile` accent-coloured tiles, exact same pattern as crypto sub-categories. Designed to link to future sub-pages (e.g. `ambient/`, `ceremonial/`).
4. **CTA banner** — links to topic page (primary) and `v2/arts/` parent domain (secondary).
5. **Footer** — Network / Search / Home links.

Each of the four content sections currently shows a dashed `.empty` placeholder with the message "Empty — ready to fill". Directly below each empty state is an HTML comment containing a copy-paste template for that section's card type.

## How to fill a section

Pattern, same for all four:

1. Find the section in the file.
2. Copy the markup out of the `<!-- TEMPLATE -->` comment block.
3. Paste it above the `<div class="empty">`.
4. Edit values (name, link, image src, etc.).
5. Once at least one card exists, delete the `.empty` div for that section.

The templates are deliberately minimal — one example card per type, with placeholder text. Add more by duplicating the inner element (e.g. another `<a class="acard">` inside `.artist-grid`).

## Visual system

Reuses the FRQNCY house style:

- Fonts: Cormorant (serif, headings) + Jost (sans, body) from Google Fonts, already imported.
- Color tokens: navy `#0B1C3D` background, amber accent `#E8A84A` (matches the existing topic page's accent so the two pages feel like siblings).
- Cards use `var(--card-bg)` / `var(--card-border)` — same vars as the rest of v2.
- `mobile-nav.js`, `chat-widget.js`, `nav-dropdown.css`, `sw.js`, Plausible analytics — all wired up identically to other v2 pages.
- Breadcrumb nav at top, footer at bottom, hero with radial glow — matches the established v2 page pattern.

## Important nuance — HTML comments

The template blocks use HTML comments (`<!-- ... -->`). HTML doesn't support nested comments. The first version of the file had inline `<!--  -->` notes inside the outer `<!-- TEMPLATE -->` blocks, which broke the outer comment and exposed template markup to the parser. Fixed by replacing inner comments with parenthetical hints using `&lt;` / `&gt;` HTML entities. **If you add inline annotations inside a template comment, do NOT use `<!--` — use parentheses or escaped entities instead.**

## What's NOT done

- No actual content. Every section is empty.
- No genre sub-pages exist yet. The `.cat-tile` template points at e.g. `ambient/` — those folders don't exist. When the user adds tiles, either create the sub-pages alongside or use external links.
- No JSON-LD `ItemList` schema (will add once content exists — empty schema is worse than none).
- Not added to `search.json`. The hub is a navigation surface, not a topic, so this may be intentional. Reconsider if Orlando wants it discoverable in the network search.
- No OG image — currently falls back to the default `/og-image.png`. A bespoke `v2/og/music-hub.png` would be nice once the page has visual identity.
- Not added to homepage nav, only to the explore-page nav. If the homepage has a hub-link bar, consider adding it there too.

## Verification done

- Tag balance: 5 `<section>` opens, 5 closes; `<main>`, `<style>`, all `<script>` blocks balanced.
- Python `HTMLParser` walk: zero unclosed tags, zero mismatches.
- Confirmed the `Music` nav link appears in `v2/explore.html` between Watch and Courses (line 343).

Did NOT manually open the page in a browser — visual QA is the next agent's or Orlando's first move.

## Suggested next steps for the next agent

If Orlando comes back asking to populate or extend this:

1. **Fill from his list** — paste templates per section, edit values. Five-minute job per chunk.
2. **Create genre sub-pages** if `.cat-tile` entries point to local paths. The crypto sub-pages (`v2/crypto/[category]/index.html`) are the reference pattern — generated from `outputs/gen_categories.py`. A music equivalent could mirror that structure.
3. **Add to `search.json`** if Orlando wants the hub to surface in network search. Schema: see existing entries.
4. **Build a music topic graph** like crypto's `PROJECTS` array — once there's enough content, hoist artist/album data into a JS array at the bottom of the file and render via template literals, mirroring `v2/crypto/index.html`.
5. **Consider a `now-playing` or embed widget** — Bandcamp and Spotify have iframe embeds that would fit nicely in the playlists section.

## Editorial constraints (per CLAUDE.md and memory)

- No leaderboards. No ranking artists against each other. Curation by inclusion, not by ordering.
- Conviction as self-expression is fine ("this album matters because…"); ranking people is not.
- Long-term: artist profiles should live on the site itself, not just link out. Treat external links (Bandcamp, Spotify) as footnotes, with substance written in.
- The hub uses the locked hero/voice direction implicitly — descriptive, calm, not hype.
