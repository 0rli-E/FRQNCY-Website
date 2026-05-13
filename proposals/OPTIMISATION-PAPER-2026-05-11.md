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

### P0-5 · Pillar count + ordering needs to be canonised *(IA · UX)* — REVISED 2026-05-11

*Original diagnosis: Curate + Sell are empty (zero domains / topics / edges) and should be demoted.*

**Founder's call (2026-05-11):** all eight pillars stay as first-class. The pillar shelf on the homepage renders in this exact canonical order:

  1. **Curate**
  2. **Education**
  3. **Research**
  4. **Media**
  5. **Sell**
  6. **Fund**
  7. **Build** *(content.json id: `builder`)*
  8. **Network State** *(content.json id: `network-state`)*

**What still needs doing:**

- Reorder the pillar cards on `index.html` to match.
- Update the section heading: stop calling it "Six Pillars" anywhere it currently does. Eight is the truth.
- Reconcile the pillar count across homepage, `start-here.html`, `<meta description>`, and the explore-page hint copy so the visitor's mental model can stabilise.
- Reorder the `pillars` array in `content.json` so generators iterate in canonical order.
- Curate + Sell still need *something* to anchor them as page surfaces (right now `/curate/` and `/sell/` are flagged in `BESPOKE_PILLARS` as do-not-regenerate but the actual content of those pillar pages is still thin). Hand-shape both as bespoke landings with their own editorial — this is also what fixes the explore-map layout pathology, because the two pillar nodes will then carry real outbound edges instead of dangling free.

The earlier "demote both to cross-cutting modes" recommendation is withdrawn.

### P0-6 · Chart generator captures no email *(CRO — single biggest funnel leak)*

The chart generator is named the primary lead magnet. Anonymous users can run a full chart, download a PDF, and trigger an AI reading **without entering an email address.**

**Move:** Gate the AI reading (not the chart itself — keep the value visible) behind email submit. Show a non-modal inline card after `generate()` succeeds: "Send the full reading to your inbox + the next dispatch." Capture, fire the reading. Estimated 25–40 % capture on completers — the difference between a free tool and an actual funnel.

### P0-7 · Money domain is a sub-taxonomy in disguise *(IA · SEO)*

55 topics under one domain (mean across the other 14 domains is ~14). Almost all commodities (gold, silver, copper, oil, wheat, sugar, cotton, palladium, nickel) + DeFi/DAOs/personal finance/prosperity mindset. This is at minimum two domains (`Markets`, `Sovereign Capital`) and arguably blurs into `Energy` (oil, gas, uranium) and `Food` (wheat, sugar, cotton). Findability collapses past topic #20.

**Move:** Split. Redistribute industrial commodities into Energy / a new Materials domain under Builder. The Money domain becomes "Money & Markets" or "Sovereign Capital" with ~15-20 topics — a real shelf, not a junk drawer.

### P0-8 · Visual system has fractured *(Visual · Voice)*

Five navies are loose in the codebase (`--dark`, `--dark-2`, `--navy`, `--navy-deep`, `--navy-mid`, `--navy-light`). Gold is doing every accent job at once (eyebrows, dividers, CTA borders, legend dots, pick pills, Sanctuary primary). Three different `H1` sizes across homepage / domain page / topic template (the bespoke domain page out-scales the homepage hero by ~2.5×). The Sanctuary uses `--accent #4A7AE8` blue that exists nowhere else.

**Move:** Promote `tokens.css` (single source of truth for navy + gold + typography scale). Demote gold to a *single* role — canonical CTAs and the wordmark. Codify three type scales — Display / Editorial / UI — explicitly assigned per surface. The visual coherence problem is upstream of half the smaller issues.

### P0-9 · "FRQNCY makes the unable able" — keep it, but explain it *(Voice)* — REVISED 2026-05-11

*Original diagnosis: tagline is offensive, delete both occurrences.*

**Founder's call (2026-05-11):** keep the tagline. It stays in `index.html` footer and `about.html`. The risk the playbook flagged (positions readers as incomplete) is real, but the founder's read is that the line is doing the right work *when the philosophical frame is established by surrounding context*. Same logic as the "love and light" subscribe-overlay carve-out (P0-2).

**What still needs doing:**

- **Write a short explainer surface for the line.** A 100-200-word piece somewhere on the site (a footer-of-the-About page section, a `/standard/` page, or inside the existing "Door is Open" contact section) that names what *able* and *unable* mean in FRQNCY's frame — not capability deficit, but the practical question of whether a person has the conditions, the tools, the network, the surfaced opportunity to act on what they already are. *Unable able* = re-membering what's already there. Not addition; removal of obstacles. The line then earns its place.
- **Update the voice playbook** — un-reject this tagline (move from "Resolved Q3" to a "Carve-out" section with the explainer link).
- **Update EDITORIAL-VALUES-V2.md** if it still lists this tagline — keep, with a pointer to the explainer.

The original "delete and lint" recommendation is withdrawn.

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
| **Fund LP-lead rate** | `lp_interest_submit` ÷ `unique /fund/ sessions` | Requires a new form (see CRO P1). |
| **Explore engagement** | nodes-clicked-per-session on `/v2/explore` | Wire in the existing nodeSel click handler. |
| **Sanctuary 7-day return** | `% of new accounts returning to /my-frqncy/ within 7 days` | Supabase event log. |

---

## 6 · Roadmap

### Now — this week (small, high leverage, mostly content / template)

0a. **Unify the global header across every page and subpage.** One canonical `#main-nav` HTML fragment, one CSS file, inline-critical-CSS'd. Every generator (`generate.js`, `generate_topic_page.py`, `generate-courses.js`, `generate-watch.js`) and every bespoke page (homepage, explore, watch library, fund, crypto, aligned, social, sanctuary, my-frqncy/*, search, chart, podcast, space, about, platform, membership, /people/, /books/, /orgs/, /places/, /media/, /music/, 15 bespoke domain pages) emits the identical block — same logo, same dropdowns, same search bar, same My FRQNCY CTA, same height, same behaviour. *This is upstream of every other "where does X live on every page" fix.* 4–6 hours.

0b. **Remove every Sign In affordance.** Delete all `<li id="frqncy-auth-pill">` slots and `frqncy.mountAuthPill()` calls (currently on `my-frqncy/dashboard/`, `my-frqncy/charts/`, `my-frqncy/practice/`, `my-frqncy.html`). The Sanctuary entry in the Community dropdown reaches `/my-frqncy/dashboard/` which still requires sign-in via `/social/login/`. 30 min.

0c. **Universal "← Back" button in the unified header.** Same `history.back()`-with-fallback pattern, sized as part of the global header so it ships automatically once 0a lands. Audit anything that bypasses the shared header. 30 min once 0a is done.

0d. **Fix the nav search FOUC.** On every cold load the input renders as the **browser default** — stark white background, dark grey 1–2 px border, Times-ish font, browser-default magnifier glyph — for ~100–400 ms before `nav-dropdown.css` parses and the FRQNCY treatment (semi-transparent navy, Jost font, gold-on-focus border, ghost magnifier) replaces it. Visible flash on every page (visual evidence captured 2026-05-11). **Fix:** inline ~12 lines of critical `.nav-search` CSS into `<head>` **and** switch `<input type="search">` to `<input type="text" role="searchbox">` so the UA stylesheet stops contributing. 30 min. Same fix must be applied wherever the global nav ships (so do it as part of 0a — the unified header — not after).

0f. **Order the pillars on the main page in the canonical sequence** — *Curate · Education · Research · Media · Sell · Fund · Build · Network State* (founder-confirmed 2026-05-11). Stop calling the section "Six Pillars"; render eight cards in this exact order. Also reorder the `pillars` array in `content.json` so downstream generators iterate consistently. 30 min.

0e. **Simplify the header buttons.** Right now the global nav carries **4 dropdowns + 28 sub-items + search + CTA**: About (3), Discover (13!), Capital (4), Community (5). The mental load on first contact is high and the dropdowns are slow to scan. *Proposed simplification, to be applied once inside the canonical nav fragment from 0a:*

```
About       Start Here · Vision · Platform                       (3)
Discover    Explore · Library · Read · Aligned · Search          (5)
              ↳ Library subsumes Watch + Music + Audio + Courses
              ↳ Read subsumes People + Books + Orgs + Places + Media
              ↳ Chart Generator gets promoted to a primary CTA on
                the homepage, not buried in the dropdown
Fund        (single link — collapse Crypto / Project Ratings /
             Sector Explorer into tabs inside the Fund page)
Community   Podcast · NRG · Sanctuary · Membership               (4)
                                                  [search] [My FRQNCY]
```

Four top-level buttons instead of four-dropdowns-of-thirteen. Same hand on every page, immediately scannable. 1 hour to redesign + 30 min to propagate via the unified-header fragment from 0a.

1. **Write the "unable able" explainer.** *(Was: delete the line. Reversed 2026-05-11.)* Tagline stays in `index.html` footer + `about.html`. Add a 100-200-word explainer section somewhere it earns its meaning — most likely the About page (a small named section under the existing intro) or a dedicated `/standard/` mini-page that the footer line links to. Frame: *able / unable* is not about capability deficit but about whether conditions, tools, network, and surfaced opportunity are present to act on what's already there. *Unable able* = re-membering, not adding. 1-2 hours.
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

## 8 · Product & content backlog (added 2026-05-11)

The roadmap above is the *site optimisation* roadmap — UX/CRO/IA/perf/a11y work directly tied to KPIs on the existing surface. The list below is **what FRQNCY is building beyond the website**, captured for canonical reference. Each item is its own task in the tracker (#20–#50); this section is the strategic-level summary, grouped.

### Content additions (people / orgs / places / videos)
- Gary Spivey → Energy domain (#20)
- Matías De Stefano → person (#21)
- Dyson → person + Design domain (#34)
- Alex Jones → person, with neutral bio framing (#37)
- Jim Rohn → person (#38)
- Les Brown → person (#39)
- Merlin's restaurant → place/org (#44)
- Time-travel video → watch library (#42)
- Middleway intuition app → resource on the new Abilities topic (#22)
- Sedona Method · TFT · Gary Craig · Dr Roger Callahan — emotional-release cluster (Sedona Institute, Callahan Techniques, EFT) with topic / orgs / people / book entries (#69)
- **Infinita** (Niklas Anzinger's Roatán longevity / network-state project) → org + Laura Abioli → person, cross-linked if she's a resident teacher (#70)
- **George S. Patton** → person under t-leadership / t-discipline / t-history. Polarising figure handled like Alex Jones (#37) — documented, not sanitised, not idolised. Companion books (*War As I Knew It*, *The Patton Papers*, D'Este biography) as follow-ups. (#84)
- **The "Masonbook" YouTuber** → person + media entry (channel handle to confirm with founder before adding). Esoteric / hermetic / mystery-school content. `appears_in: t-spirituality · t-mythology · t-hermetic · t-sacred-geometry · t-history`. Candidate for a watch-library teacher chapter if his catalogue sustains it. (#91)

### New topics + new beds
- **Abilities** topic restored as a real topic page under Consciousness (#22)
- **Studies / Discoveries** bed — new entity type, surfaced on every topic, with its own hub (#23). Seeds: Dr Joe Dispenza studies, HeartMath, CIA Gateway docs, WikiLeaks-relevant releases, Princeton PEAR, Maharishi Effect, plant studies. Bridges the editorial network into rigorous primary sources.
- **Spiritual Technology** + **Spiritual Materialism** — long-form topic treatments, not passing mentions (#29)
- **Etiquette** — new topic under d-society. Not Victorian-performance but the actual social technology the present moment lost. Anchored by Emily Post's *Etiquette* (1922, public-domain canonical). Sister candidates for follow-up additions: *Book of Common Prayer*, Confucius' *Analects*, Cicero's *De Officiis*, Castiglione's *Courtier* (#76)
- **Tax / Jurisdictional Sovereignty** — new topic under d-money or as a cross-cutting strand on the Network State pillar. Anchored by **Paraguay** (0–10 % IRP regime, territorial tax, fast residency-to-citizenship) and **Próspera** (Honduran ZEDE on Roatán; cross-linked to Infinita #70). Concrete sites of the Network State pillar's lived practice. Also gives the Sell pillar a real referral surface — residency services, attorneys, accountants — per the affiliate-link task (#58). (#77)
- **Network Schools — overview + comparison** — research page + per-school org entries: The Network School (Balaji's Forest City), Próspera Schools, Sora, Synthesis, Praxis, Acton, Sudbury-Valley lineage, etc. Sister to Infinita (#70), Próspera (#77), Enlightened Nations (#62) — completes the cluster on lived network-state experiments. (#79)
- **Homeschooling** — new topic under Education. Framed not as the conservative-evangelical default but as practical exit from captured institutional schooling — secular / classical / Charlotte-Mason / unschooling / Acton / world-schooling / micro-schools / hybrid. Anchor reading: Holt, Illich (*Deschooling Society*), Bauer (*Well-Trained Mind*), Acton's playbook, Sora, Synthesis. Companion to Network Schools (#79) and Enlightened Nations (#62). (#88)
- **Chartered Cities** — new topic under d-society / Network State pillar. SEZs, charter cities, ZEDEs — the infrastructure layer making Próspera (#77), Infinita (#70), Itana, Dubai DIFC, Shenzhen-1980 possible. Anchored on Paul Romer's charter cities work, Lutter / Charter Cities Institute, Patri Friedman / Seasteading, Balaji's *Network State*. Forms a triplet with Network Schools (#79) and Tax / Jurisdictional Sovereignty (#77) as the lived-network-state cluster. (#89)
- **AI Agent Law** — new topic under d-tech and d-society (cross-domain). The emerging legal regime around AI agents — agent identity, agent-to-agent contracts, principal/agent doctrine for autonomous systems, EU AI Act provisions, the *Tornado Cash* / *Ooki DAO* precedents, on-chain identity (DIDs, Verifiable Credentials), insurance markets, *Code is Law* lineage. Sister to **Gitlaw / Gitlawb** (already in the crypto research backlog #81). Directly conditions what FRQNCY can ship via its own agent stack (Hermes #47, OpenClaw #48, Ironclaw #74, Amex bot #46, TG bots #49/#50, FRQNCY AI #80). (#90)

### Crypto / Capital projects
- **BLNC** ("Balance") — algorithmic stablecoin, tree-pose / tree visual identity, full mechanism design + audit + launch (#25)
- **AI battletest** of FRQNCY crypto — adversarial-agent suite simulating attackers across oracle / governance / MEV / peg-stability before any launch (#30)
- **FRQNCY LPs + custody + wrappers** — Orb Markets-style closed-loop liquidity, multisig custody, wBLNC + wFRQNY (#31)
- **FRQNY Veto Council** — fixed council (GIN, Sai Maa Foundation, Sadhguru, +) holding veto power + hard-fork procedure against governance attacks. The single most important security mechanism in the token design (#35)

### Manifesto / voice / philosophy
- **Lift and empower projects and people** — named goal (#26)
- **"SOURCE code"** — canonical phrasing for every FRQNCY codebase (#28)
- **Timelessness** — explicit design principle in voice playbook ("would this read well in 2126?") (#32)
- **FRQNCY is network art** — Loot reference; reframes the project class (#33)
- **"Technology is here for us to experience new things"** — manifesto line (#36)

### Strategic documents
- **Master FRQNCY roadmap** at proposals/FRQNCY-ROADMAP.md — every project, owner, status, milestones in one canonical doc (#24)
- **FRQNCY Projects paper** — what makes something a *FRQNCY project*, the SOURCE-code principle, editorial standard, Fund relationship (#27)
- **Content roadmap + ideation paper** at proposals/CONTENT-ROADMAP.md — companion to the master roadmap. The master roadmap is *what we're building*; this is *what we're saying*. Quarterly themes, monthly tentpole essays, weekly cadence per channel, topic-deepening priority order, ideation backlog, series mapping, channel-specific posture. (#85)

### Internationalisation
- **Multilingual support: English → German → Chinese → Spanish → eventually all relevant languages** (#83). Path-prefix strategy (`/de/`, `/zh/`, `/es/`) with hreflang + language switcher in the unified header (#16). Two-phase content: machine translation (eventually via FRQNCY AI #80) followed by native-speaker editorial pass to recover voice. Multi-month work; order and strategy locked now, execution after header unification + crypto launches stabilise. Voice playbook gains short-form per-language version. Long-tail expansion: French · Portuguese (BR+EU) · Japanese · Korean · Italian · Russian · Arabic · Hindi · Indonesian · Dutch · Turkish.

### Frontier ambition — FRQNCY AI
- **FRQNCY AI — a mankind-aligned neural network** (#80). Frontier-class AI under the FRQNCY umbrella with an explicit alignment thesis: aligned to **mankind's flourishing**, not to shareholders / regulators / engagement metrics / safety-theatre. Distinct positioning from OpenAI · Anthropic · Google · xAI · Meta — those are corporate-aligned with bolted-on safety; FRQNCY AI is mankind-aligned at the architecture level. Multi-year. **Near-term deliverables (next 6 months)**: (a) manifesto / one-pager defining "mankind-aligned" in mechanism terms — concrete axioms, not vibes; (b) reference implementation fine-tuning an open-weight base on FRQNCY's editorial corpus (208 topics · 284 books · 90 people · 100+ orgs + the studies bed once #23 ships — the highest-quality curated alignment-friendly corpus that doesn't already belong to Big Tech; this is FRQNCY's structural advantage); (c) ship first as the Sanctuary AI companion (small surface, fast feedback loop); (d) Veto Council pattern (#35) applied to AI — model updates require sign-off from a fixed council of aligned teachers; (e) SOURCE-code (#28) by default — open-weights, open-evals, open training-data lineage. Battletest under Ironclaw (#74) + the AI-adversarial framework used for crypto (#30). All the other FRQNCY agents (Hermes #47, OpenClaw #48, Amex bot #46, the chart generator, the chat widget) eventually run on this engine instead of calling OpenAI / Anthropic.

### Capital / Crypto (expanded)
- **FRQNY token functions**: Fund · Coordination · Incentivisation · Governance — locked as the canonical four-function spec in the BLNC/FRQNY whitepaper and the Echo listing deck (#59)
- **List FRQNCY on Echo** (echo.xyz, Cobie) — community-led raise rather than VC; coordinates with the battletest (#30), Veto Council (#35), BLNC design (#25) (#57)
- **FRQNCY Launchpad** at /launchpad/ — surface for funding + spotlighting aligned projects (curated + open application). Anchors Fund + Sell + Build pillars (#55)
- **Donation functionality** on every entity (videos / projects / people / places / studies) — per-entity `donation_url`, consistent widget, BLNC/FRQNY accepted once tokens ship (#51)
- **Donation buttons — three rails: crypto wallets · PayPal · Google Pay** (#75). Crypto: BTC + ETH/L2s + SOL + USDC, eventually BLNC/FRQNY. PayPal: SDK donate-button. Google Pay: Donation flow. Per-entity rails routing — a specific project (Frequency movie, a Launchpad project, a retreat) can supply its own addresses/IDs to receive funds directly; falls back to the FRQNCY treasury otherwise. Footer-level Donate CTA on every page.
- **Frequency movie spotlight + donation flow** — dedicated /frequency-movie/ page; template for how FRQNCY features other aligned projects (#54)
- **Referral / affiliate links across the network** — books (Bookshop.org + Amazon Associates + direct publishers), Aligned Goods, memberships, courses. Real revenue stream that scales with traffic without adding ads (#58)
- **Start FRQNCY Crypto Research** — analytical / thesis-building stream under /crypto/research/. Monthly long-form, per-project memos for the Fund, macro-shift one-pagers. Anchors the Capital pillar with substance beyond ratings. (#71)
- **Crypto research initial backlog** (#81) — first-cohort coverage queue. *Reading*: Delphi Digital + Sui ecosystem articles. *New coverage categories*: airdrop farming · Uniswap v4 Hooks · DeSci (VitaDAO/Molecule/ResearchHub/BIO — bridges to the studies bed #23) · Robotics · AI gaming (Dota AI · RogueAI · $NRN/Neuranet · Parallel) · FRQNCY work · Virtual ecosystem. *Projects to add as orgs*: Akash (decentralised compute — critical infra for FRQNCY AI #80) · Omni Network (interop L2) · trade.xyz (perp DEX, stock perps) · Gitlawb / Gitlaw (open-source legal code, adjacent to SOURCE code #28) · Cyberwren · OPG · ODAI · $NRN · Parallel · Gold (clarify: commodity coverage vs crypto project). A few names need disambiguation with the founder before they get added.
- **Integrate FRQNCY with Ethos** (#82) — the on-chain reputation primitive (Cobie's team, on Base). Members link their Ethos score to their FRQNCY profile. Integration points: social profile (#63), launchpad (#55) sybil-resistance, Veto Council (#35) accountability, referrals (#45) reward modulation, membership tier-keying, crypto-research bylines. Ethos sits one layer below FRQNCY (general reputation primitive); FRQNCY uses it the way a country uses a credit bureau.
- **FRQNCY Crypto Overview page** at /crypto/ (#87) — the canonical landing surface explaining what FRQNCY is doing in crypto, in one place, for someone arriving cold. Cards for BLNC · FRQNY · Launchpad · LPs/custody · Veto Council · Battletest · Research · Project Ratings · Echo · Ethos. Plus a 200-400-word thesis (why tokens become the substrate of network states; why mankind-aligned stables matter), latest-research auto-pull, and a "how to participate" splitter for members / founders / capital. The 90-second answer to "wait, what's FRQNCY doing in crypto exactly?"
- **Kick off crypto.frqncy** (#92) — go-time meta task. Stops scoping each crypto piece as a separate item and sequences the whole stack (BLNC #25 · FRQNY #59 · Veto Council #35 · Battletest #30 · LPs #31 · Research stream #71 + #81 · Ethos #82 · Echo listing #57 · Overview page #87) into a concrete 8-week build. Owns the architecture decision (path-prefix `/v2/crypto/*` today, upgrade to `crypto.frqncy.network` subdomain later if traffic warrants), the dependency graph, and the public-comms cadence (TG channel + research-memo drops into the topic newsletter). The unblocker for everything in the Capital / Crypto subsection.

### Live + automation
- **Live-stream capability** — aggregator (tracked teachers going live on YouTube/Twitch/X) + own-channel (Livepeer/Mux for FRQNCY's own broadcasts: founder convos, retreat broadcasts, BLNC launch, book club) (#52)
- **Auto-ingest new videos from tracked channels into the watch library** — kills the manual-maintenance bug that allowed Hidden Secrets Eps 3-10 to silently rot. Channel-watcher in the harness + approval queue via the TG bot (#53)
- **AI marketing + crypto Zusammenfassungen** — agent-produced FRQNCY-voice summaries of marketing developments + crypto/network-state developments. Posted to /dispatches/, TG channel (#68), and the topic-based newsletter (#56) for subscribers on relevant topics. Editor-in-the-loop via TG bot for sensitive items (#67)

### Marketing + community surfaces
- **Topic-based email newsletter** — subscriber picks any of the 208 topics; weekly dispatch filtered to new resources/studies/videos on those topics. Substantially better open + retention than undifferentiated "FRQNCY dispatch" (#56)
- **FRQNCY Telegram channel** — public broadcast surface, posts authored via the TG bot from every site change (new resources, watch additions, summaries, Fund updates, Frequency-movie-style spotlights, retreat invites, podcast episodes, BLNC/FRQNY updates) (#68)
- **Finish podcast guest outreach** — guest pipeline + outreach copy + CRM-lite. Hermes agent (#47) handles first-touch volume, founder closes high-tier (#60)
- **Finish Luma embed on /podcast + /events** — task #2 (already on the list; carried over)
- **Physical space** — first FRQNCY headquarters / sanctuary / studio. Hosts the team, the retreats (#41), podcast (#60), live streams (#52). Plan first as a one-pager (purpose stack · location candidates · capital structure · timeline). Anchors the Network State pillar + Enlightened Nations (#62) in concrete bricks (#72)
- **Music hub vs Music vs Concerts** — re-do the music surfaces properly. Currently /music/ is the Library hub (curated tracks) and /music-topic/ is the topic (the concept) — task #9 differentiated them. Add the missing third surface: **live music + concerts + festivals** — events featuring aligned musicians, FRQNCY-curated gatherings (Burning Man-class events, conscious-music festivals like Sonic Bloom / Lightning in a Bottle), the venues, the touring schedule. Probably lives at /music/live/ or as a Concerts tab on the Music Library. Cross-link properly so a visitor on any of the three immediately knows the other two exist (#73)

### Social network layer
- **LinkedIn-like social** on /social/ — profiles based on topics-followed + teachers-engaged + projects-backed + retreat-attendance + geography. Connections (opt-in) + interest-driven discovery + aligned-feed. Differentiator: shared *philosophical* alignment, not job titles (#63)
- **Dating layer (designed to be deleted)** — opt-in surface inside /social/, same matcher as the network layer, optimised for off-platform / in-person continuation rather than swipe-mechanic engagement (#64)

### Framing + manifesto (expanded)
- **100th-Monkey / morphic-resonance framing** as the one-line explainer of *what FRQNCY is accomplishing* — paired with the homepage one-sentence explainer (#40, #66)
- **Enlightened Nations** as the concept + surface where FRQNCY's Network State pillar terminates — distinct from Balaji's libertarian-technocratic version, consciousness-first. Editorial essay at /enlightened-nations/ (#62)

### Site-template addition (rides task #4)
- **Apply the 6-books treatment to the 8 pillar pages** — task #4 fixed the 15 domain pages from 5 → 6 books; pillar pages still on older 5-book or no-book template. Auto-pick from pillar-relevant frqncy_pick books, fall back to hand-pick where weak (#65)

### Audit
- **Verify metaphysics → consciousness rename is complete** — quick post-regen verification pass to catch anything that slipped through subsequent generator runs / new content (#61)

### Front-of-house additions
- **One-sentence FRQNCY explainer** on the homepage hero (pairs with paper P0-1) (#40)
- **Twitch-style rotating banners** below the hero — auto-rotating carousel of featured topics + books, swipe-on-mobile (#43)
- **Referrals built into the Sell pillar** — gives Sell its first substantive content surface; rides on existing `?ref=XYZ` infrastructure (#45)

### Operations
- **Organise the first FRQNCY retreat** — venue (Essência is a candidate), curriculum, invite list, application form (#41)

### Bots & agents
- **Amex bot** — statements, churn, points, disputes (#46)
- **Hermes** — messenger / synthesis agent, role TBD before build (#47)
- **OpenClaw** — data-grabber / aggregator agent, role TBD before build (#48)
- **Ironclaw** — guardian / security / adversarial-test agent. Sibling to Hermes (messenger) + OpenClaw (gatherer) — completes the trio as guardian. Continuous battletest of BLNC + FRQNY, intrusion detection on FRQNCY surfaces, copy-protection. Lock role before building. (#74)
- **Telegram → topic editor** — authorised editors update topics, add resources, trigger regen, commit + push from chat (#49)
- **Telegram → frqncy-harness** — control surface for harness jobs (scans, regens, link checks, battletests) from a phone; same bot as #49 (#50)

---

## 9 · Appendix — full agent reports

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
