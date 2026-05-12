# FRQNCY — Optimisation Paper

**Date:** 2026-05-11
**Method:** Ten specialist agents (UX research · CRO · brand voice · accessibility · visual design · information architecture · performance · SEO · code quality · mobile UX) audited the site in parallel against their disciplines. Each returned a ranked report. This paper synthesises where they converged, what to fix first, what to instrument, and how to sequence the work.

---

## 1 · Executive summary

FRQNCY has a real product underneath. The map is genuinely beautiful, the editorial voice is distinctive, the topic graph (208 topics, 1000+ pages, 621 entities cross-linked) is more substantive than 95 % of "content sites." The hand-shaped domain pages (`/v2/consciousness/`, `/v2/wellbeing/`) are best-in-class. The bones are good.

The visitor experience, however, is **strong in object and weak in path**. A cold visitor lands on a wordmark and a scroll hint, gets ambushed within one viewport by a "love and light" modal, has to reconcile three contradictory framings of the network (six pillars / eight pillars / 146 maps) before deciding whether to care, and — if they do care — falls through topic pages that have no prev/next, no related rail, and average <200 words of unique copy.

The convergence across ten lenses is stark: **the foundation is sound, the funnel is leaky, the topic surface is undernourished, and instrumentation is absent.** Every recommendation below follows from that diagnosis.

---

## 2 · Customer journey — friction map

```
LAND       → ORIENT    → EXPLORE   → DEEPEN     → CONVERT    → RETURN
 │            │            │            │            │            │
[homepage]  [explore]   [topic]     [entity]    [subscribe]  [sanctuary/
                                                /membership/  newsletter]
                                                 /chart]
```

| Stage | What works | What doesn't (P0 friction) |
|---|---|---|
| **Land** | The wordmark + Cormorant typography establishes editorial tone. | No value proposition above the fold. The `<meta description>` (rich, specific, well-written) never appears on the page itself. |
| **Orient** | Six-pillar grid is visually clean. Map preview pulls the eye downward. | Pillar count contradicts itself (6 / 8 / 146). Subscribe modal fires after 1 viewport with an unprimed mystical headline. |
| **Explore** | The force-directed map is the brand's strongest single asset. | Map page strips the global nav. Map labels are 7–12 px. Map has zero keyboard story (a11y blocker). |
| **Deepen** | Domain pages (consciousness, wellbeing) are exceptional. | Auto-generated topic pages are template-thin — no prev/next, no related rail, no editorial paragraph. Breadcrumb drops the topic and the pillar. |
| **Convert** | The chart generator is a genuine lead magnet. | It captures **no email**. Membership ships with placeholder pricing. Fund page has no LP form. Aligned Goods has no per-category capture. |
| **Return** | Sanctuary dashboard is rich, well-considered. | Sanctuary feels like a different product (different typography scale, different palette, SaaS-y blue accent appearing nowhere on marketing surfaces). |

---

## 3 · Cross-lens P0s — where multiple agents converged

The following findings were flagged by **two or more agents independently**. They are the highest-leverage moves because fixing one fixes the experience along multiple dimensions.

### P0-1 · The homepage hero is a value-prop void *(UX · CRO · Voice)*

`index.html` `#light-intro` renders only the wordmark and a "Scroll" hint. The actual proposition — "a topic graph for consciousness — 146 maps of how money, energy, mind, and matter actually work" — exists only inside `<meta description>`, where the visitor will never see it.

**Move:** Promote that line into the hero as a sub-headline. Add a primary CTA ("Generate your chart" — the lead magnet) and a secondary ("Explore the map"). Test variants against a baseline subscribe rate.

### P0-2 · The subscribe overlay is broken on four axes *(CRO · UX · Voice · A11y)*

- **Timing** — fires after 1 viewport of scroll, before the visitor has seen the pillars, the map, or any reason. **CRO fix:** delay to 3+ viewports or trigger on exit-intent.
- **Copy** — "You are *love* and light" lands on cold visitors as cult-greeting. The voice playbook itself flagged this; the recent restoration was at founder request. **Voice fix:** if kept, frame the *gift* explicitly first ("One email a week. The map, the reading, what's funded.").
- **A11y** — the overlay never leaves the accessibility tree when hidden; screen readers still announce it; no Escape handler. **A11y fix:** add `display:none` / `inert` toggle, Escape close, focus return.
- **Conversion analytics** — no `overlay_shown` event fires, so you can't measure show-to-submit rate.

### P0-3 · Topic pages are thin, dead-end, voiceless, under-linked *(UX · Voice · SEO · IA)*

- 170 of 243 topic pages are **under 200 words**.
- Only **37 of 243** emit JSON-LD (the bespoke domain pages do; the auto-generated topic template doesn't).
- **85 topics** have fewer than 3 inbound internal links.
- Breadcrumb on every auto-generated topic *drops the topic name and the pillar* ("FRQNCY / Consciousness" on the Oneness page — Oneness and Research both missing).
- No prev/next within domain, no "related topics," no "return to {domain}" link. Visitors hit a footer.
- The voice playbook explicitly prescribes a ~60-word editorial paragraph between hero and resources; the template doesn't render one.

**Move:** Rebuild the topic template **once**, propagate to 243 pages. Add: 60-word editorial bridge paragraph (start with template prose, hand-shape over time), `BreadcrumbList` + `DefinedTerm` + `ItemList` JSON-LD, prev/next module, related-topics rail (4–6 siblings via `appears_in`-reverse), correct breadcrumb hierarchy. Single biggest sitewide lift.

### P0-4 · Explore map has zero keyboard story *(A11y · Mobile · Performance)*

- All 198 nodes are SVG circles bound to pointer events only. `role="img"` makes the whole map one opaque image to assistive tech.
- Touch targets are 22–32 px on a 390 px viewport (autofit only scales *down*, never up).
- D3 (~270 KB) loads render-blocking and the force simulation + 1000-particle RAF kick off synchronously after script load.

**Move:** Render a parallel `<ul>` of nodes grouped by pillar (visually hidden if needed) with the same click handler so keyboard and SR users have an equivalent path. Add `defer` to D3, schedule `bootMap` via `requestIdleCallback`. At small viewports, scale touch targets via an invisible 44 px hit-circle behind each `<circle>`. Single change unlocks ~5–10 % of users (a11y + mobile).

### P0-5 · The 8-pillar promise is a 6-pillar reality *(IA · UX)*

`Curate` and `Sell` are top-level pillars with **zero domains, zero topics, zero edges** in the explore graph. They're operational concepts (modes of curation / commerce), not bodies of knowledge — yet they sit alongside `Research` and `Education`. Two empty pillars also explain part of the explore-map layout pathology: they are isolated nodes that drag the force-layout's centroid off-axis (fixed at the simulation level last week, root cause remains).

**Move:** Demote both to cross-cutting *modes* — tags/filters applied across the six real pillars, with `/curate/` and `/sell/` rendered as filtered views. Reconcile the pillar count across homepage, start-here, meta description, and explore-page hint copy so the visitor's mental model can stabilise. Six is the truth; commit to it.

### P0-6 · Chart generator captures no email *(CRO — single biggest funnel leak)*

The chart generator is named the primary lead magnet. Anonymous users can run a full chart, download a PDF, and trigger an AI reading **without entering an email address.**

**Move:** Gate the AI reading (not the chart itself — keep the value visible) behind email submit. Show a non-modal inline card after `generate()` succeeds: "Send the full reading to your inbox + the next dispatch." Capture, fire the reading. Estimated 25–40 % capture on completers — the difference between a free tool and an actual funnel.

### P0-7 · Money domain is a sub-taxonomy in disguise *(IA · SEO)*

55 topics under one domain (mean across the other 14 domains is ~14). Almost all commodities (gold, silver, copper, oil, wheat, sugar, cotton, palladium, nickel) + DeFi/DAOs/personal finance/prosperity mindset. This is at minimum two domains (`Markets`, `Sovereign Capital`) and arguably blurs into `Energy` (oil, gas, uranium) and `Food` (wheat, sugar, cotton). Findability collapses past topic #20.

**Move:** Split. Redistribute industrial commodities into Energy / a new Materials domain under Builder. The Money domain becomes "Money & Markets" or "Sovereign Capital" with ~15-20 topics — a real shelf, not a junk drawer.

### P0-8 · Visual system has fractured *(Visual · Voice)*

Five navies are loose in the codebase (`--dark`, `--dark-2`, `--navy`, `--navy-deep`, `--navy-mid`, `--navy-light`). Gold is doing every accent job at once (eyebrows, dividers, CTA borders, legend dots, pick pills, Sanctuary primary). Three different `H1` sizes across homepage / domain page / topic template (the bespoke domain page out-scales the homepage hero by ~2.5×). The Sanctuary uses `--accent #4A7AE8` blue that exists nowhere else.

**Move:** Promote `tokens.css` (single source of truth for navy + gold + typography scale). Demote gold to a *single* role — canonical CTAs and the wordmark. Codify three type scales — Display / Editorial / UI — explicitly assigned per surface. The visual coherence problem is upstream of half the smaller issues.

### P0-9 · The rejected tagline keeps coming back *(Voice)*

"FRQNCY makes the unable able" was explicitly rejected in the voice playbook on 2026-04-28 as offensive — yet it ships in **two places**: `index.html` footer and `about.html` line 825 ("That is the standard, applied without exception.").

**Move:** Delete both occurrences. Add a lint rule to the voice-enforce skill to flag this exact string. Same risk class as the metaphysics→consciousness migration; same remedy.

### P0-10 · Two real code-level bugs *(Code)*

- `v2/explore.html` search-results panel interpolates `r.name`, `r.desc`, `r.url`, `item.label` raw into `innerHTML` (lines 733–755). XSS sink as soon as any bed-import / Notion-sync feeds untrusted strings.
- `chat-widget.js` outside-click handler closes the panel when the user clicks an internal link inside a bot reply (line 494). The link still navigates, but the panel closes mid-flight; on slow connections the panel pops shut before navigation completes, creating an "ghost click" experience.

**Move:** Escape via shared `esc()` before any `innerHTML` template. Add `if (e.target.closest('.fc-msg a')) return;` to the outside-click guard.

---

## 4 · By discipline — one-line takes

| Lens | Take | Full report |
|---|---|---|
| **UX research** | Strong object, weak path. Hero, subscribe timing, topic dead-ends, /people/ hidden cards. | Agent 1 |
| **CRO** | Chart generator + membership are the two highest-leverage holes. Subscribe needs better timing and a concrete promise. | Agent 2 |
| **Brand voice** | Voice is sharp where hand-written, hollow where templated. The rejected tagline keeps re-shipping. | Agent 3 |
| **A11y (WCAG 2.2 AA)** | Real focus rings, real skip-nav on home — but explore map is a wall to AT, dropdowns are hover-only, no `prefers-reduced-motion`. | Agent 4 |
| **Visual design** | One brand system splintered into five. Demote gold; codify three type scales; one navy. | Agent 5 |
| **Information architecture** | 6-pillar reality wearing an 8-pillar costume. Money domain bloated. `d-places` is a zero-topic shell. | Agent 6 |
| **Performance** | Render-blocking D3 + 10-face Google Fonts are the dominant LCP costs. SW SWR rule for `.js` is overbroad. | Agent 7 |
| **SEO** | Foundations solid (canonicals, sitemap, AI policy). Topic pages are thin (170 < 200 words), most missing JSON-LD. 85 topics under-linked. | Agent 8 |
| **Frontend code** | Two real P0s (XSS sink in explore search, chat-widget outside-click). Worker rate-limit is per-isolate. SDK loader has a small race. | Agent 9 |
| **Mobile** | Breakpoint dead-zone 721–768 px. iOS auto-zoom on every form (inputs <16 px). Explore tap targets 22–32 px. | Agent 10 |

---

## 5 · KPIs — what to instrument first

Most of these are currently uninstrumented. None of them are hard to fire. Wire them all in one ticket — half the optimisation problem becomes a measurement problem once they're live.

| KPI | Definition | Where measured |
|---|---|---|
| **Email per chart completion** | `subscribers (source=chart_gate)` ÷ `chart.generate success` | Plausible custom events; fire on `generate()` success + on subscribe submit. *The single most important number on the site.* |
| **Overlay show → submit** | `subscribe_submit (overlay)` ÷ `overlay_shown` | Requires firing `overlay_shown` when `.visible` class is added. |
| **Subscribe rate (homepage)** | `subscribers (source ∈ overlay, contact)` ÷ `unique sessions on /` | Plausible. |
| **Topic-page depth** | mean `time on page` for `/v2/{topic}/` pages + scroll depth | Plausible custom event on scroll milestones (25/50/75/100%). |
| **Membership CTA click rate** | `clicks [data-checkout]` ÷ `unique /membership/ sessions` | Plausible; CTA already has the attribute. |
| **Fund LP-lead rate** | `lp_interest_submit` ÷ `unique /v2/fund/ sessions` | Requires a new form (see CRO P1). |
| **Explore engagement** | nodes-clicked-per-session on `/v2/explore` | Wire in the existing nodeSel click handler. |
| **Sanctuary 7-day return** | `% of new accounts returning to /my-frqncy/ within 7 days` | Supabase event log. |

---

## 6 · Roadmap

### Now — this week (small, high leverage, mostly content / template)

1. **Delete "FRQNCY makes the unable able" from `index.html` footer + `about.html`.** 15 min. Net positive day one.
2. **Reconcile the pillar count.** Pick six. Update homepage h2, start-here body, meta description, explore hint copy. 1 hour.
3. **Wire the eight KPIs above into Plausible.** No code changes elsewhere; just `plausible('event', {...})` calls in existing handlers. 2 hours.
4. **Add `defer` to D3 on `/v2/explore`** + move `bootMap()` into `requestIdleCallback`. 30 min. Largest perf win.
5. **Patch the two code P0s** — escape in explore search innerHTML, chat-widget outside-click guard. 1 hour.
6. **Hero copy** — promote the meta description into the hero as a sub-headline + add a primary CTA. 1 hour. (Voice can polish; ship the structure first.)
7. **Restyle the subscribe overlay's a11y** — `display:none` when hidden, Escape close, focus return. 1 hour.

### Next — 30 days (template overhaul, instrumented variants, IA cleanup)

1. **Rebuild the topic template once.** Add prev/next, related-topics rail, editorial-bridge paragraph slot, JSON-LD (`DefinedTerm` + `BreadcrumbList` + `ItemList`), corrected breadcrumb. Regenerate 243 pages.
2. **Chart-generator email gate.** Inline capture card after `generate()` success. Reading is the unlock.
3. **Subscribe overlay timing test.** Variant: 3-viewport scroll OR 25s dwell OR exit-intent. Track show-to-submit on each.
4. **IA: split Money, retire `d-places` as a shell, demote Curate + Sell to cross-cutting tags.** Regenerate the explore graph.
5. **Visual tokens unification.** `tokens.css`, one navy, gold demoted. Update all five surfaces that redefine the palette.
6. **Mobile breakpoint fix** (721–768 px gap) + bump every form input to ≥16 px to kill iOS auto-zoom.
7. **A11y: keyboard story for the explore map.** Hidden node list, focusable, Enter to navigate.
8. **Self-host the two LCP-critical font weights** with `<link rel="preload" as="font">`.

### Later — quarter (structural, content, business surfaces)

1. **Topic-page editorial pass.** 170 pages need 200+ words of hand-shaped voice. Phase: bespoke-handle the top 30 most-linked topics first; template-bridge the rest.
2. **Membership pricing live.** Replace placeholder. Stripe checkout firing. Track checkout-session-start.
3. **Fund LP-interest form.** Surface and segment list (size, jurisdiction, accreditation).
4. **Aligned Goods per-category email capture.** "Send me the {category} shortlist."
5. **Promote entity hubs to first-class IA peers** (People / Books / Orgs / Places / Media as a sibling axis to pillars). Every topic surfaces its top entities; every entity lists every topic it appears in.
6. **Worker rate-limit migration** from per-isolate `Map` to Durable Object or KV (before any traffic spike).
7. **Build-step minification** of `chart.js`, `network-map.js`, `chat-widget.js`, `index.js`, `mobile-nav.js`, `social-auth.js`. Halves transfer on cache-bust.

---

## 7 · One-page priority matrix

```
            HIGH IMPACT
                │
                │      P0-3 Topic template ────● ● P0-6 Chart email gate
                │      P0-1 Hero value-prop ──● ● P0-4 Map a11y/perf
                │                              │
                │              P0-2 Subscribe ─●─● P0-8 Visual tokens
                │              P0-5 Pillar=6 ──●─● P0-10 Code P0s
                │                              │
                │                              │   ● P0-7 Money split
                │                              │   ● P0-9 Delete rejected tagline
        ────────┼──────────────────────────────┼──────────────────
        LOW              LOW EFFORT            │   HIGH EFFORT
            COMPLEXITY                         │
                │
                │
                │
```

Top-right (high impact, high effort): **P0-3** (topic template rebuild) is the single best investment. Touches voice, SEO, UX, IA, and ships value across 243 pages in one move.

Top-left (high impact, low effort): **P0-9** (delete rejected tagline), **P0-1** (hero copy promotion), **P0-6** (chart email gate) — all under a day each.

---

## 8 · Appendix — full agent reports

The ten individual agent reports are quoted verbatim in the chat transcript that produced this paper. Each contains line-level evidence and concrete rewrites that didn't fit here. If a finding above seems thin, the underlying agent's report has the detail.

**Agents and their personas:**

1. Senior UX researcher — heuristic eval against Nielsen 10 / ISO 9241 / Krug
2. CRO lead — funnel, decision moments, KPI design
3. Brand-voice editor — playbook enforcement + structural copy patterns
4. Accessibility engineer — WCAG 2.2 AA
5. Senior product designer — typography, hierarchy, design-system coherence
6. Information architect — taxonomy, findability, naming
7. Performance engineer — Core Web Vitals, payload, cache
8. SEO lead — meta, structured data, internal linking, AI-crawler policy
9. Senior frontend engineer — real bugs, security, technical debt
10. Mobile UX specialist — touch, viewport, gesture, form ergonomics

— *End of paper.*
