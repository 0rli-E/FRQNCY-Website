# Aligned Goods — section handoff

Single source of truth for the `/aligned/` section of FRQNCY. Read before touching the page, the data file, or the schema. Supersedes the earlier sketch at `docs/ALIGNED-GOODS-SCHEMA.md`.

Last touched: 2026-04-28.

## What it is

A curated index of products, places, texts, and tools that help people live in alignment. Information in abundance, with conviction. Each entry answers two questions: *what is this* and *why is it on FRQNCY*.

Framed as a magazine edit (`FRQNCY edit · issue 01`), not a marketplace. Releases in editions. No paid placement. No leaderboards.

## What it isn't

- Not a coupon site or affiliate farm.
- Not a "Top 10" listicle. There are no rankings between entries.
- Not a competitor to existing topic pages — it sits beside them in the Discover dropdown.

## The vision (Orlando, 2026-04-28)

Direct quote from the brief:

> "überall referrals: gscheide zahnpasta, EMF's, shampoo, lebensmittel, wasser, kleidung, hotels und co. WBNO, wasser reiniger eva, gutes allgemein, alles highest quality, true freedom is living in full alignment with oneself, amex und crypto cards, book of enoch, bible, tao, feeling good is the real currency, ad-free good courses, anthropic free. The idea is we will get all of this on the website and refer people to the best products, people, places, orgs, everything and give information in abundance."

The slogan-level frame: **true freedom is living in full alignment with oneself**.

## Files

```
/aligned/index.html              The destination page (shelves layout)
/aligned-goods.json              Data — currently 56 entries across 12 shelves
/index.html                      Nav link added under Discover dropdown
/search.html                     Nav link added under Discover dropdown
/docs/ALIGNED-GOODS-SCHEMA.md    Original schema sketch (superseded; kept for design rationale)
/proposals/ALIGNED-GOODS.md      This document (canonical)
```

## Data schema

Per-entry shape in `aligned-goods.json`:

```json
{
  "id":          "kebab-case-unique",
  "type":        "tool" | "book" | "place" | "person" | "course" | ...,
  "name":        "Display name",
  "desc":        "One paragraph, FRQNCY voice, ends with a sentence that earns the pick.",
  "category":    "<shelf id from CATEGORIES list below>",
  "tier":        "pick" | "aligned" | "referenced",
  "criteria":    ["used", "clean", "independent", "verifiable", "accessible", "durable"],
  "topicSlugs":  ["topic-slug-from-search-json"],
  "vendor":      [{
    "name":      "Brand or store",
    "url":       "https://...",
    "affiliate": false,
    "region":    "global" | "US" | "EU" | "DACH" | ...,
    "free":      true     // optional, only when applicable
  }],
  "revenue_relationship": null | "none" | "contributor" | "partner" | "affiliate"
}
```

Notes:

- `tier` controls how the entry presents. **One `pick` per shelf** is the editorial convention — it becomes that shelf's *Editor's Choice*. Everything else is `aligned`. `referenced` is reserved for entries that are relevant but not vouched.
- `revenue_relationship` was added to be more honest than a binary affiliate flag. Four values: `none` (default — no money flows), `contributor` (brand contributes to FRQNCY Fund or Sanctuary; pick decision precedes the contribution), `partner` (direct revenue-share or co-marketing), `affiliate` (commission link, currently unused). All current entries are `null` (treat as `none`).
- `topicSlugs` link entries back to the topic graph so the same record can later surface on `/v2/<topic>/` pages.

## Categories (shelves)

Twelve shelves. Defined in `/aligned/index.html`'s `CATEGORIES` array — that array is the source of truth for shelf order, display name, and tagline. Shelves render only when they have at least one entry.

| Shelf id | Display name | What goes here |
|---|---|---|
| `nourishment` | Water | What you drink first |
| `food` | Food | Sources you can trace from farm to plate |
| `body-care` | Body care | What touches the skin and what you wash with |
| `supplements` | Supplements | Single ingredients, third-party tested |
| `sleep` | Sleep & recovery | The body's daily restoration |
| `movement` | Movement & practice | How the body trains and the practice is held |
| `cookware` | Cookware | Pots, pans, knives — multigenerational |
| `coffee-tea` | Coffee & tea | The morning ritual |
| `audio` | Audio | Headphones, speakers, how you actually hear it |
| `tools-carry` | Tools & carry | Everyday objects built to last |
| `cards` | Cards | How money moves with intention |
| `privacy` | Privacy & sovereignty | Tools that keep you the owner of your data |

These replaced an earlier 11-category sketch (body / nourishment / home / stay / wear / move / money / tech / library / learn / practice). The new set is more sensory and practical, more magazine than encyclopedia. If you add a shelf, add it to the `CATEGORIES` array; the nav and rendering pick it up automatically.

## The rubric

Five questions held against every entry. Stated on the page in the *Why these picks* block, not as per-card badges.

1. **Used** — does someone we trust actually use it.
2. **Clean** — does the ingredient or material list survive a literate reading.
3. **Independent** — is the maker free of the incentive to compromise.
4. **Verifiable** — can the claims be checked.
5. **Durable** — will it outlast its first replacement.

A sixth criterion — *accessible* — exists in the schema (and `CRIT_LABEL` map) but isn't in the page-level rubric copy. Use it on entries that are noteworthy for being free or low-cost; otherwise omit.

`tier: "pick"` ≈ meets nearly all of these. `tier: "aligned"` ≈ meets a meaningful subset.

## Page architecture

Sections, top to bottom:

1. **Nav** — fixed top, mirrors site nav. `/aligned/` is highlighted in the Discover dropdown.
2. **Hero** — `FRQNCY edit · issue 01` eyebrow, *Aligned Goods* headline, hero meta (auto-populated: `N entries · M rooms · Updated April 2026`).
3. **Why these picks** — the 5-question rubric, page-level not per-card.
4. **Editorial intro** — the *True freedom is living in full alignment with oneself* line.
5. **Sticky shelf nav** — horizontal scroll-snap chips, one per shelf with at least one entry. Active shelf updates as you scroll.
6. **Shelves** — one section per category. Each has: numbered eyebrow (`01 · 12`), Cormorant title, tagline, optional *Editor's choice* line, count, grid of cards, "Last reviewed by FRQNCY · April 2026" footer.
7. **Cards** — minimal: name, description, optional ★ Editor's choice marker, vendor link(s) with `Free` and `Aff` badges.
8. **Money flows disclosure** — explains the `revenue_relationship` field with all four values, links to `proposals/EDITORIAL-STANDARDS.md`.
9. **Site footer**.

## Conventions worth preserving

- **One pick per shelf.** Multiple `tier: "pick"` entries in the same category dilute the badge.
- **Cards stay quiet.** Criteria are stated once at page level. Cards show only the marker, the description, and vendor links.
- **No ranking copy.** "Best" is fine when it means "the one we recommend." Comparative copy between entries (X over Y) is not.
- **Sticky nav scrolls horizontally only.** There's a comment in `attachActiveShelfTracking()` explaining why `link.scrollIntoView()` is forbidden — it fights vertical scroll on sticky elements.
- **Categories without entries don't render.** Both the shelf nav and the shelves section filter to `itemsFor(c.id).length > 0`.

## Design language

Inherits from the rest of the site:

- Palette: `--navy: #0B1C3D`, `--gold: #C4973A`, `--gold-light: #E0C06A`, `--text: #C8D8F0`, `--text-dim: #7090B8`.
- Type: Cormorant (serif, headings + editorial italics) + Jost (sans, body + UI).
- Hero gradient: gold radial wash from top.
- Card border on hover shifts to gold at low opacity.

## Nav placement

Currently linked in:
- `/index.html` — Discover dropdown, between Explore and Watch.
- `/search.html` — Discover dropdown, same position.

Not yet linked in: `/about.html`, `/podcast.html`, `/start-here.html`, `/my-frqncy.html`, `/v2/explore.html`, the v2 hub pages, and the rest of the topic pages. Each of those has its own duplicated nav block — adding the link is mechanical (same `<a>` snippet under the Discover dropdown) but volume is real (152 topic pages each carry the nav).

## Open questions

These were flagged at sketch time and remain partially open:

1. **Shelves still to seed.** The original brief mentioned EMFs, shampoo, clothing (`wear`), hotels (`stay`), sacred texts (`library`), ad-free courses (`learn`). None of these have shelves yet. Decide whether to add them as shelves or fold into existing ones (e.g. shampoo under `body-care`, courses under a future `learn` shelf).
2. **What is WBNO?** Mentioned in the original brief, never identified.
3. **Library & learn shelves.** Bible, Tao Te Ching, Book of Enoch were in the first seed but removed in the rewrite. If reinstated, decide whether a `library` shelf joins the magazine or whether texts live only on their topic pages.
4. **Tech / Anthropic.** Same — Anthropic Claude was a seed entry, removed in the rewrite. Decide whether `/aligned/` recommends software at all.
5. **Issue cadence.** "Issue 01" implies issue 02 exists eventually. Define what triggers a new issue: time, entry count, or an editorial moment.

## How to add a new entry (procedure)

1. Confirm it meets enough of the 5-question rubric to merit `aligned`, or all of them to merit `pick`.
2. Decide its shelf. If no existing shelf fits, **stop and propose adding one** rather than forcing a fit.
3. If a `pick` already exists in that shelf and the new entry is also pick-worthy, decide which one is *the* Editor's Choice. Demote the loser to `aligned`. Don't ship two picks per shelf.
4. Add the record to `/aligned-goods.json`. Required fields: `id`, `type`, `name`, `desc`, `category`, `tier`, `criteria`, `vendor[]`. Set `revenue_relationship: null` unless declaring otherwise.
5. Reload `/aligned/`. Verify the entry shows on the right shelf and the shelf nav still tracks correctly.

## How to add a new shelf

1. Add a `{ id, name, desc }` object to the `CATEGORIES` array in `/aligned/index.html`.
2. Place it in the position you want it to render (the array is the order).
3. Seed at least one `tier: "pick"` entry — the Editor's Choice — and ideally 3-5 `aligned` siblings so the shelf doesn't look bare.
4. The shelf nav will pick it up automatically on next load.

## Related docs

- `proposals/EDITORIAL-STANDARDS.md` — the underlying editorial rules. Linked from the page disclosure.
- `proposals/REVENUE-MODEL.md` — Aligned is one of five revenue surfaces. Read before turning on any `revenue_relationship` other than `none`.
- `proposals/FRQNCY-VOICE-PLAYBOOK.md` — voice guide for entry copy.
- `docs/ALIGNED-GOODS-SCHEMA.md` — the original schema sketch from this conversation. Useful for design rationale; superseded for taxonomy.

## What was done in this conversation (2026-04-28)

In order:

1. Vision shared by Orlando — referrals across categories, "best of everything," information in abundance.
2. Schema and taxonomy sketched in `docs/ALIGNED-GOODS-SCHEMA.md`. Original proposal: 11 categories, 6-criterion rubric, 4 new schema fields (`category`, `tier`, `criteria`, `vendor[]`).
3. `/aligned/index.html` built — landing page matching site design system. First version was a category-grid + filterable list.
4. `/aligned-goods.json` seeded — 7 entries: Eva water, Anthropic Claude, Tao Te Ching, The Bible, The Book of Enoch, AmEx Platinum, Crypto.com Visa.
5. Nav links added in `index.html` and `search.html`.
6. Page rewritten to magazine "shelves" layout — sticky horizontal nav, one section per category, *Editor's Choice* per shelf framing, *FRQNCY edit · issue 01* hero, dedicated *Why these picks* rubric block.
7. Schema extended with `revenue_relationship` (4 values: none / contributor / partner / affiliate) — replaces the binary affiliate flag with a more honest disclosure.
8. Categories restructured from 11 conceptual to 12 sensory/practical shelves: Water, Food, Body care, Supplements, Sleep & recovery, Movement & practice, Cookware, Coffee & tea, Audio, Tools & carry, Cards, Privacy & sovereignty.
9. Data file expanded to 56 entries with one Editor's Choice per shelf.
10. This handoff doc written.
