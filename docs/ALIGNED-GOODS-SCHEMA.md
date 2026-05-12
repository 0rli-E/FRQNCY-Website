# Aligned Goods — Schema & Taxonomy

> **Status: superseded for taxonomy and rubric. Kept for design rationale.**
> The canonical spec is **`proposals/ALIGNED-GOODS.md`**. That doc reflects the shipped shelves layout, the 12 magazine-style categories, the 5-question rubric used on the page, and the `revenue_relationship` schema field that replaced the simple affiliate flag.

A first sketch for FRQNCY's curated index of products, places, people, orgs, texts, and tools that help people live in alignment. No code yet. This is the shape we'd build toward.

## What this is (and isn't)

**Is.** A trusted map of the best of everything across the domains that matter — body, home, money, books, places to stay, tools to think with. Information in abundance, with conviction. Each entry answers two questions a visitor actually has: *what is this* and *why is this on FRQNCY*.

**Isn't.** A coupon site. A leaderboard. A "Top 10" affiliate farm. Nothing on the list is here because someone paid for placement. Affiliate links exist where they exist, are disclosed, and never decide what gets in.

## Where it lives in the data model

The site already has `resources.json` (656 entries) with this shape:

```
{ type, name, desc, url, topicSlug, topicLabel, topicUrl,
  domain, domainSlug, external }
```

Existing types: `person, book, org, media, course, place, app, article, platform, reference, tool, website`.

The new layer extends — does not replace — that file. Same record per resource, four new fields:

```
{
  ...existing fields,
  category:  "body" | "nourishment" | "home" | "stay" |
             "wear" | "move" | "money" | "tech" |
             "library" | "learn" | "practice",
  tier:      "pick" | "aligned" | "referenced",
  criteria:  ["used", "clean", "independent", "verifiable",
              "accessible", "durable"],   // any subset
  vendor: [{
    name:       "Brand or store",
    url:        "https://...",
    affiliate:  false,                // or true, with disclosure
    region:     "global" | "EU" | "US" | "DACH" | ...
  }]
}
```

Three small notes on the choices:

- **`category` is parallel to `domain`, not a replacement.** Domain is the conceptual web (Money, Sciences, Consciousness). Category is the practical "department store" view. A water filter belongs to the topic *Water* (domain Sciences) **and** the category *nourishment*. Two views over the same record.
- **`tier` separates curation strength from existence.** `referenced` = mentioned because it's relevant to a topic. `aligned` = we'd recommend it. `pick` = FRQNCY pick, we use it ourselves.
- **`vendor` is a list, not a single URL.** Many goods have multiple legitimate places to buy (brand site, EU reseller, crypto-accepting store). Each gets its own row with its own affiliate state and region.

## The category taxonomy

Eleven categories. Designed so any "best of X" you can name fits somewhere obvious without forcing it.

| Category | What goes here | Examples from your list |
|---|---|---|
| **body** | What touches the body daily | toothpaste, shampoo, deodorant, EMF protection, supplements |
| **nourishment** | What goes in the body | food brands, water, water purifiers (Eva), kitchen, salt |
| **home** | The space around the body | bedding, air, light, furniture, candles |
| **stay** | Places to be, briefly | hotels, retreats, sanctuaries, conscious destinations |
| **wear** | Clothing & adornment | clothing brands, footwear, jewelry |
| **move** | Getting around | bikes, transport, travel services |
| **money** | Tools for value flow | Amex, crypto cards, exchanges, banks, on/off-ramps |
| **tech** | Tools that augment thinking | Anthropic/Claude, software, hardware, devices |
| **library** | Texts worth a lifetime | Bible, Tao Te Ching, Book of Enoch, primary sources |
| **learn** | Living education | ad-free courses, schools, lineages, teachers as offerings |
| **practice** | Tools to do the work | meditation apps, breath, journaling, therapy services |

Existing entries get categorized over time. New entries from your list slot in immediately.

## The alignment rubric

Six criteria. A resource can meet some or all. The rubric does the heavy lifting that "highest quality" alone can't.

1. **Used.** Someone on FRQNCY (or a trusted voice) actually uses it. No paper picks.
2. **Clean.** Non-toxic, non-extractive, doesn't quietly harm the body or the world that holds it.
3. **Independent.** Owned and run by people who answer to themselves and the work — not to a fund or a roll-up.
4. **Verifiable.** Claims you can check. No vague marketing science, no "clinically proven" without the study.
5. **Accessible.** Real people can actually have this. Not artificially gatekept by price, region, or scarcity theater.
6. **Durable.** Built to last, work with you over years, not designed for repeat-purchase.

`tier: "pick"` ≈ meets 5–6 of these. `tier: "aligned"` ≈ meets 3–4. `tier: "referenced"` = relevant, not vouched.

The criteria don't appear as checkboxes on the page — they appear as the **why** sentence under each entry. The rubric is the editorial backbone, not the UI.

## How it surfaces (two views, same data)

- **Topic view** (already exists). A resource appears on its topic page exactly as it does today. New: a small ✦ if `tier: "pick"`, a quiet "aligned" mark if `tier: "aligned"`, nothing if `referenced`.
- **Browse view** (new). A page — say `/aligned/` — that lets someone walk in and ask *what's the best toothpaste* without knowing about the topic graph. Filters by category, then by criteria. Each card links into the topic where the deeper "why" lives.

The browse view is what makes this a destination instead of a footnote. The topic view is what keeps it FRQNCY-native.

## Affiliate transparency

One sentence at the top of `/aligned/` and a small mark on any vendor row where `affiliate: true`. Affiliate status never affects `tier` or order. Full stop.

## What's open

A few things to decide before we start populating:

1. **Category list — final?** Eleven feels right; could collapse `home`/`stay` or split `library`/`learn` further. Easy to change before there's data.
2. **People as a category?** Right now `type: person` lives across categories (a teacher in `learn`, a doctor in `body`). Works, but worth confirming you don't want a dedicated *People* category.
3. **Free vs. paid distinction?** "Anthropic free" and "ad-free good courses" suggest a `free: true` flag could be useful for the Browse view. Cheap to add.
4. **WBNO** — couldn't place it. What is it?

Once these are settled, the next step is two things in one go: pick ~5 entries from your list (Eva, Amex, Tao, etc.) and populate them with the new fields, so the schema gets stress-tested against real data before it's locked in.
