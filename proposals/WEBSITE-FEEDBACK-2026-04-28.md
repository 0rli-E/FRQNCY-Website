# Website feedback — 2026-04-28

Orlando's pass over the live site. Nine pain points, triaged.

## 1. Topic pages — too many buttons at the top

**What's there now.** The top nav on every `/v2/<topic>/` page has the breadcrumb plus eight chiplets: People, Books, Orgs, Media, Music, Places, Search, ← Main. It crowds the hero and competes with the topic name for attention.

**What to do.** Collapse the six type-bed links into one "Network" overflow (or just drop them — the main site nav already exposes /people, /books, etc.). Keep breadcrumb + ← Main + Search. That gets us from eight chiplets to two.

**Effort.** Small. One regeneration pass over `generate.js` and the 146 topic pages.

## 2. Topic pages are stale and boring

**Where this is going long-term.** Every topic gets its own treatment — a hand-shaped page that reflects its actual character. AI ≠ peace ≠ kriya yoga. Default scaffolding stops being the destination.

**What to do near-term.** Three layers. (a) Strip the dead "Curated Resources / 0 resources" empty-state from any topic that has nothing — it screams unfinished. (b) Add a topic-level intro paragraph that's longer than the meta description and actually says something. (c) Pull the first one or two FRQNCY picks into a hero callout above the resource grid so the page leads with conviction, not a filter row.

**Effort.** Medium. Needs editorial input per topic; or batch with a writing pass.

## 3. "Start here" gives no direction

**What's there now.** `start-here.html` exists but the user reports it adds confusion rather than orienting.

**What to do.** I haven't read it carefully yet. Probable fix: replace the page with a single arc — *"You arrived. Here's what FRQNCY is in three sentences. Here's the one thing to do next."* One CTA, not a menu of CTAs. Could be the chart, or the explore graph, or the Substack — pick one.

**Effort.** Small once we agree on the one CTA.

## 4. Home page messaging says nothing about FRQNCY

**What's there now.** Tagline: "Built on the Foundations of Oneness." Meta: "FRQNCY is a community becoming an alternative society. You remember what you truly are — love and light — and create a future from that knowingness."

**What's wrong.** Too abstract. A first-time visitor doesn't know whether this is a media outlet, a fund, a religion, an app, or a Substack. The four-essay corpus and the proposals folder have the actual answer; the home page doesn't show any of it.

**What to do.** Rewrite the hero to answer the three questions a stranger asks: (1) what is this, (2) what's it for, (3) why now. A draft worth testing: *"FRQNCY is a topic graph for consciousness — 146 maps of how money, energy, mind, and matter actually work. A reading list with conviction. A fund underneath."* Then under it: one line about the experiments-not-prescriptions stance, a single CTA into Explore.

**Effort.** Medium. Hero + below-the-fold needs to match.

## 5. Books / orgs / etc. are data points, not experiences

**What's there now.** The bed pages render entries as cards. They feel like a CSV with a stylesheet.

**What to do.** The fix isn't more data — it's editorial weight. Two moves: (a) Every entry needs a "why this is in FRQNCY" paragraph from us, not just the publisher's blurb. (b) Pull entries into thematic shelves on each topic page (e.g. "If you read three things on this topic, read these"), so the bed becomes a destination rather than a directory. The MCP server already exposes the data; we have what we need to make it active.

**Effort.** Large if done properly. Could phase: pick 30 anchor entries, write proper notes for those first.

## 6. Crypto and project ratings give no value

**What's there now.** `v2/crypto/projects.html` is the ratings table. The user says it doesn't earn its place.

**What to do.** I haven't audited the ratings logic. Two possible directions: kill the page and fold its picks into the relevant `v2/crypto/<sector>/` topic pages with conviction notes; or rebuild it as a thesis + scorecard format where each project has (a) what FRQNCY thinks, (b) why, (c) what would change our mind. Right now it's neither a list nor an argument.

**Effort.** Medium-large. Worth a deeper conversation before touching.

## 7. "My FRQNCY" filter — boring and unrevealing

**What's there now.** `my-frqncy.html` (1435 lines) — produces some sort of personalised constellation. The user says the result doesn't reveal anything about the person.

**What to do.** Need to look at it before proposing. The framing is good — "constellation of oneself" — but the output needs to feel like a mirror. Ideas to test: feed it through the chart-v2 calibration so the answer is grounded; produce a single-image artefact the user can save; write the constellation as a short narrative paragraph rather than a list of tags.

**Effort.** Medium. Depends what the current pipeline looks like.

## 8. Fund page got killed again — bring back Vision/Echo/Legion/Roadmap

**What's there now.** `v2/fund/index.html` is currently the auto-generated topic-page version (304 lines, the standard explore-page template). The bespoke version with Vision, Echo, Legion, and Roadmap was last seen in commit **c03faa3** — *"fund: restore full Fund page — Vision, Echo, Legion, Roadmap"*. It's recoverable.

**What to do.** Recover the bespoke fund page from c03faa3. Merge it with the topic-page resource list so we get both: the narrative (Vision, Echo, Legion, Roadmap) up top, and the topic-graph crosslinks underneath. Don't lose either.

**Effort.** Small. Mostly a git checkout + merge.

## 9. Community pages still look naked

**What's there now.** `v2/community/index.html` — the only thing in the community folder. Single page.

**What to do.** Need to look at it. The fact that there's *one* file in `v2/community/` is itself a smell — community needs sub-pages (gatherings, sanctuaries, online spaces, conduct, etc.), not a single landing. Feeds into the larger Sanctuary surface in the revenue model.

**Effort.** Large. This is a content-and-design project, not a tweak.

---

## Suggested order

If we're sequencing: 8 → 1 → 4 → 3 → 2 → 7 → 6 → 9 → 5.

Reasoning: bringing the fund page back is a 30-minute git operation that restores something the user explicitly misses (8). Trimming the topic-page button row is a one-pass fix that touches every topic page (1). Home page messaging is the highest-leverage external-facing fix (4). Start-here flows from the home page rewrite (3). The remaining items are larger projects — topic page redesign, my-frqncy redesign, crypto rebuild, community buildout, books/orgs editorial pass — and each deserves its own session.
