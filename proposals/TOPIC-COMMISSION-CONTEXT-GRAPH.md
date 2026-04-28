# Topic-Page Commission Context Graph

> The reusable procedure for commissioning a unique FRQNCY topic page.
> Each topic page is its own piece of the artwork. This document is the
> shape of how a piece gets made — the same shape every time, the
> content emerging from the topic itself.
>
> Once this graph is dense and tested across ~5 commissions, the process
> can be run by the harness with light operator direction. Today it is
> run by hand with the operator's voice in the loop.
>
> **Reference commission:** `/v2/water/` — Topic 0001, shipped 2026-04-28.

---

## 0 · Inputs the operator provides

The minimum brief is one slug + one seed phrase. Everything else falls out of research + the voice playbook.

| Input | Required | Example (water) |
|---|---|---|
| Topic slug | yes | `water` |
| Seed phrase / concept | yes | "crystals in motion" |
| Feeling on the reader | helpful | inspired, informed, slowed-down |
| Hard-locked picks | optional | Eva Water, Klean Kanteen |
| Palette weight (gold/blue/cream/foam mix) | optional | gold + white + blue, photography carries depth |
| Voice register | implicit | always per `FRQNCY-VOICE-PLAYBOOK.md` |
| Reference materials | optional | none, do research |

Any input the operator skips is auto-decided by step 2. The operator can override at any step.

---

## 1 · Discovery — questions the operator can answer in any order

These are the seed questions to ask. Skipped answers default to the precedent set by `/v2/water/`.

1. **Pace and motion.** Subtle ambient · real wave/canvas animation · liquid scroll · cursor-interactive · all-of-the-above-layered.
2. **Hero treatment.** Looping 4K video · WebGL simulation · pure typography · still photo · stack-crossfade.
3. **Imagery scale.** Cinematic · restrained · maximal gallery.
4. **Signature SVG motif.** Topic-specific geometric motif (water crystal, Bitcoin mempool, mycelium, mandala, etc.) — yes/no/scale.
5. **Palette weight.** Network constants are non-negotiable (navy `#0B1C3D`, gold `#C4973A`, cream `#F5EBD8`, foam `#F5F8FB`). Topic gets one accent that emerges from the subject.
6. **Voice register tweaks.** Default is the playbook. Operator can ask for more philosophical / more empirical / more hands-on / more declarative.
7. **The philosophical thread.** Single phrase that recurs as the page's spine (e.g. "crystals in motion", "freedom technology"). Often = the seed.
8. **Length.** Short and poetic · medium with breathing room · long-form chapter. Default: medium.
9. **Picks.** Mankind-aligned tools, books, people, orgs the topic genuinely supports. Default: pull from existing `aligned-goods.json` + `resources.json` + ask operator for additions.
10. **Numbering label.** "Topic NNNN of 146" stays as the precedent (sets this as part of the artwork).

---

## 2 · Research — kicks off in parallel, no operator input needed

Six parallel WebSearch + WebFetch runs:

1. **Best-designed sites in this topic's neighbourhood.** Awwwards, FWA, Webflow showcase. Extract: visual rhythm, typography pairings, motion language, structural metaphors that worked.
2. **Image and video sources.** Pexels (verified working CDN: `https://videos.pexels.com/video-files/{id}/{id}-{...}.mp4`), Unsplash (verified working: `https://images.unsplash.com/photo-{id}?auto=format&fit=crop&q=85&w=2400`). Probe a batch of IDs with curl HEAD; keep the 200s.
3. **Master quotes.** The two or three voices the topic's tradition cannot avoid. (For water: Bruce Lee, Lao Tzu, Pollack, Schauberger, Emoto, Thich Nhat Hanh, da Vinci.)
4. **Empirical layer.** What serious scientists / engineers / practitioners have observed. Quote-bearing sources only.
5. **Contested layer.** What the mainstream contests, what the contestation is for, what FRQNCY's honest framing is. Avoid both true-believer and dismissive registers.
6. **Adjacent picks.** What books, tools, orgs, people, films a careful reader would actually want next. Filter through `EDITORIAL-STANDARDS.md`.

Output of step 2: a short research brief (in working memory or a temporary file) with quotes ready to drop, image URLs verified, design references named.

---

## 3 · Design language — extracted, not invented

Decisions to lock before any code:

- **Structural metaphor.** Water descends. Crypto encrypts. Mycelium branches. Whatever the topic's *gesture* is — that's the structural metaphor of the page itself. Pick one and let the layout obey it.
- **Accent colour.** One. Drawn from the network base, tinted by the topic. (Water: `#4A7AB5` water blue. Crypto: TBD — cypherpunk green? gold-on-black sovereignty? to be determined per topic.)
- **Typography weights.** Cormorant + Jost are the network constants. Topic decides whether to lean italic-heavy (water), bold-heavy (assertive topics), tracking-heavy (industrial topics), etc.
- **Motion language.** Slow drift, vortex spin, wave slide, particle sparkle, code-rain, scanline, hexagon flicker — pick the one motion that fits the topic's substance, layer 1–3 instances of it across the page.
- **One signature element.** The page has exactly one thing a reader will remember a week later. (Water: the hexagonal water-crystal SVG that breathes.) Decide it now.

---

## 4 · Page structure — ten sections, fixed shape, content varies

Every commissioned topic page follows this skeleton. The content fills it differently.

```
┌────────────────────────────────────────────────────┐
│ NAV                  network grammar, unchanged    │
├────────────────────────────────────────────────────┤
│ HERO                 video / image / type          │
│                      eyebrow: Topic NNNN of 146    │
│                      h1, hero-desc, anchor quote   │
│                      signature SVG motif           │
│                      scroll cue                    │
├────────────────────────────────────────────────────┤
│ WAVE / DIVIDER       motion artifact unique to     │
│                      topic (waves, particles, etc) │
├────────────────────────────────────────────────────┤
│ PRELUDE              opening prose,                │
│                      anchored by master quote 1    │
├────────────────────────────────────────────────────┤
│ BLEED 1              full-bleed image + caption    │
├────────────────────────────────────────────────────┤
│ SECTION I            main concept,                 │
│                      anchored by master quote 2    │
│                      + signature SVG feature       │
├────────────────────────────────────────────────────┤
│ SECTION II           empirical / lineage,          │
│                      anchored by master quote 3    │
├────────────────────────────────────────────────────┤
│ INTERLUDE            single-quote contemplative    │
│                      pause, master quote 4         │
├────────────────────────────────────────────────────┤
│ SECTION III          contested / honest framing    │
├────────────────────────────────────────────────────┤
│ STRUCTURED LIST      three layers / six properties │
│                      / four practices — the topic's │
│                      readable architecture         │
├────────────────────────────────────────────────────┤
│ BLEED 2              full-bleed image + caption    │
├────────────────────────────────────────────────────┤
│ PRACTICE             5 numbered steps, Roman lower │
│                      i / ii / iii / iv / v         │
├────────────────────────────────────────────────────┤
│ PICKS                4-6 vetted resources,         │
│                      grid of pick cards            │
├────────────────────────────────────────────────────┤
│ CLOSING              single image + master quote   │
│                      that resolves the seed phrase │
├────────────────────────────────────────────────────┤
│ FOOTER               network grammar, "Topic NNNN" │
└────────────────────────────────────────────────────┘
```

Sections can be skipped or doubled. The skeleton is the rhythm; each topic adapts.

---

## 5 · Reusable primitives (CSS + SVG)

### Palette tokens

```css
:root {
  --navy: #0B1C3D;
  --navy-deep: #081530;
  --navy-mid: #0D2451;
  --gold: #C4973A;
  --gold-light: #E0C06A;
  --gold-soft: rgba(196, 151, 58, 0.14);
  --cream: #F5EBD8;
  --foam: #F5F8FB;
  --pearl: #FFFFFF;
  /* Topic-specific accent — replace per page */
  --topic-accent: <hex>;
  --topic-accent-soft: <rgba>;
}
```

### Typography
- Display: `'Cormorant', Georgia, serif` — italic 300 for hero/h2, italic 400 for emphasis
- Body: `'Jost', sans-serif` — 300 default, 400 for strong
- Eyebrow / labels: 0.58rem, 0.42em letter-spacing, uppercase, gold-light

### Animations (keyframes worth keeping)
- `crystalSpin` (60s linear infinite) — slow signature rotation
- `crystalBreathe` (5s ease-in-out alternate) — scale + opacity pulse
- `waveSlide` (24s linear infinite, also reverse + 32s) — horizontal SVG scroll
- `drip` (2.4s ease-in-out infinite) — scroll-cue line
- `heroDrift` (28s ease-in-out alternate) — hero background slow zoom

### SVG primitives
- Hexagonal water-crystal (water-specific, defined as `<symbol id="water-crystal">`)
- Three-wave divider (reusable, three offset paths animating)
- Future motifs to add per topic: vortex (spiral), mycelium (branching), Bitcoin block (cube grid), mandala (radial), particle field, etc.

### Layout primitives
- `.section` (max-width 720) — reading column
- `.section-wide` (max-width 1080) — for grids and structured lists
- `.section-narrow` (max-width 600) — for interludes
- `.bleed` — full-viewport-width cinematic image with caption
- `.descent` — stacked layered cards
- `.practice` — numbered Roman steps
- `.picks` — auto-fit grid of pick cards
- `.closing` — full-bleed image + master quote
- `.fade-up` — IntersectionObserver reveal class

---

## 6 · Voice — non-negotiable

Every commissioned page passes through the voice playbook before ship.

**Read first:** `proposals/FRQNCY-VOICE-PLAYBOOK.md`

**Quick checklist (the most-violated rules):**

- [ ] No "FRQNCY's posture:" or "FRQNCY treats..." — write direct claims, not institutional self-reference.
- [ ] No italics for emphasis — only for titles and genuine stress.
- [ ] No "It's not X. It's Y." constructions.
- [ ] No "in some traditions" hedging.
- [ ] No "love and light" as direct self-description (only as concept inside earned context).
- [ ] No "wellness," "soul food," "high vibe," "manifest," "do the work," "join the movement."
- [ ] No "disrupt," "next gen," "level up," "unlock."
- [ ] British spelling (civilisation, decentralised, organisation, recognise, centre).
- [ ] Triads — three short fragments — at least once per major section.
- [ ] Present tense throughout. "FRQNCY is" not "will be."
- [ ] Conviction stated, not graded. Opinions are explicit.

---

## 7 · Asset sourcing — verified patterns

### Image (Unsplash — confirmed working URLs)
```
https://images.unsplash.com/photo-{ID}?auto=format&fit=crop&q=85&w=2400
```
Verify each ID with `curl -I` before committing.

### Video (Pexels — confirmed working URLs)
```
https://videos.pexels.com/video-files/{ID}/{ID}-{resolution}_{fps}fps.mp4
```
Probe with HEAD requests; some IDs return 403.

### Always provide a poster fallback
Hero `<video>` should always have `poster="<unsplash URL>"` so the page renders cinematically even if the video fails to load.

### Always set `preload="metadata"` and pause off-screen
Save bandwidth, save mobile data. The IntersectionObserver pause/play snippet is in `/v2/water/` near the bottom.

---

## 8 · Build, ship, iterate

1. **Add the slug to the right BESPOKE set in `generate.js`** — *critical step*. The site has a static-site generator that re-renders every templated page from `content.json`. Without this addition, the next regen run silently overwrites the commissioned page from the template. Pick the set by `id` prefix in `content.json`: `t-<slug>` → `BESPOKE_TOPICS`; `d-<slug>` → `BESPOKE_DOMAINS`. (Money and Wellbeing are domains; Water, Music, Crypto are topics.) Add *before* writing the page.
2. **Write the page** to `v2/<slug>/index.html`. Replace any prior templated content.
3. **Voice pass** — apply the checklist in §6 before any preview.
4. **Commit** with a message naming the topic number and the seed phrase.
5. **Deploy** via `wrangler pages deploy . --project-name=frqncy-website --commit-dirty=true`.
6. **Operator review** — operator opens production, names what feels off.
7. **Iterate** — apply notes, redeploy. The first commission (water) took ~2 iterations after first-look. Expect roughly the same per topic.
8. **Lock** — when operator says it's right, the topic graduates from "scaffolded" to "commissioned" in `BACKEND-STATUS.md`.

---

## 9 · The automation horizon

Once 5 commissions exist, the harness can run this graph end-to-end:

1. Operator runs `frqncy-harness commission --slug <slug> --seed "<phrase>"`.
2. The agent does §2 (research) automatically.
3. The agent generates a v0 following §4–§5.
4. The agent applies §6 (voice pass) before output.
5. The operator reviews the v0 in production.
6. Operator iterates verbally; agent edits.
7. Lock + commit.

Until the harness can do this autonomously, the procedure is run by hand, with this document as the recipe.

---

## 10 · Commissions log

| # | Topic | Slug | Seed phrase | Shipped | Iterations | Notes |
|---|---|---|---|---|---|---|
| 0001 | Water | `water` | "crystals in motion" | 2026-04-28 | 2 | Reference commission — sets the precedent. |
| 0002 | Music | `music` | "frequency made audible" | 2026-04-28 | 1 | Cymatic motif as visual signature. Analog-vs-digital split + lyric loop are the user-requested anchors. |
| 0003 | Money | `money` | "energy you create by being of service" | 2026-04-28 | 1 | Service-as-source frame. Maloney's currency-vs-money + six attributes preserved. Triangular flow SVG (service → value → exchange) as visual signature. |
| 0004 | Wellbeing | `wellbeing` | "the body knows how" | 2026-04-28 | 1 | Six pillars (sleep, food, movement, breath, sun, connection). Six-circle flower-of-life as visual signature. Sage-green accent (#8FAE7C). Conventional vs functional medicine split. Trauma-in-the-body section anchored by Maté + van der Kolk. Originally drafted as "Health" — renamed to Wellbeing on user direction. |
| 0005 | Crypto | `crypto` | "freedom technology" | 2026-04-28 | 1 | Bitcoin-orange accent (#F7931A). Trust-mesh signature SVG (hex lattice + sovereign-node centre, pulsing consensus rings). Hand-crafted hub at `/v2/crypto/index.html` (slug `cryptocurrency` → `t-crypto` is the *generated* topic; the visual hub lives at `/v2/crypto/`). Preserved data: six freedom-tech properties, what-it-buys-you list, 21 sector tiles, 12 featured projects (JS-driven grid), 15 curated resources, course callout, FRQNCY Fund CTA. Cryptocurrency URL serves the same artwork (mirrored copy with absolute `/v2/crypto/<sector>/` paths) — the merge is complete. |

Update this log when each commission ships.

---

## 11 · Maintenance

When this graph changes:

1. Increment the version on the next commission.
2. Note what changed and why.
3. If the change affects the skeleton in §4 or the primitives in §5, audit prior commissions for compatibility.

The graph is not stable yet. It firms up as commissions accumulate.

**v0 — 2026-04-28 — written after Topic 0001 (water) shipped.**
