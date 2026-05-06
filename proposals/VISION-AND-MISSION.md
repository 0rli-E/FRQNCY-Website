# FRQNCY — Vision and Mission

Drafted 2026-05-03 to give FRQNCY a formal Vision + Mission pair. Currently the About page hero is *labelled* "Vision" but the line under it ("A network of people, building their dream life") is the homepage slogan, and "Mission" appears only in nav copy ("Our mission & story") without being articulated anywhere. This doc proposes the two statements, situates them against the existing editorial material, and recommends a pair.

---

## Why split Vision from Mission

- **Vision = the future state we're building toward.** The world as it could be. Inspiring, future-tense, doesn't depend on what we're doing this quarter. North-star material.
- **Mission = what we do every day to get there.** Present-tense verb. The work itself. Operational, not aspirational.

Conflating them is the most common branding mistake. Vision answers *where are we going?* Mission answers *what do we do?* Together they hold the strategy.

The existing material splits naturally:
- The 1h-Demo north star (`proposals/VISION-1H-DEMO.md`) is **vision** material.
- The 8 pillars (Network State, Fund, Education, Research, Media, Builder, Curate, Sell) are **mission** material — they describe what FRQNCY does.
- The slogan "A network of people, building their dream life" is the **brand promise** — sits above both.
- "FRQNCY empowers the empowering" is the **network logic** — sits inside the mission.

---

## Vision — three options

Each is one sentence. Pick the one that feels most yours; I'll iterate.

### Vision A — the "remembrance" framing
**A civilisation of people remembering what they are and creating from that knowing — across the digital, the physical, and within.**

*Why this works:* Inherits the About page Thesis ("Remember. Create.") directly. Three-spaces frame (digital / physical / within) maps to the platform / network state / inner-practice triad already on the site. Strongest for readers who already speak the FRQNCY voice.

*Risk:* "Remembering what they are" is opaque to a normie reader without the page context.

### Vision B — the "alternative society" framing
**A parallel society of conscious people — online, in real-world places, and within — where every area of life has been rethought from alignment with the highest self.**

*Why this works:* Pulls directly from the existing About hero subtitle ("a community becoming an alternative society"). "Parallel society" is a self-evidently big idea. The "every area of life" clause earns the breadth of the topic graph.

*Risk:* "Highest self" is a spirituality-coded phrase — invites the reader in if they speak it, may close the door otherwise.

### Vision C — the "world we want" framing
**A world where every person has access to the teachings, tools, places, and capital they need to live as their highest self — and where the systems built around them reflect that.**

*Why this works:* Most normie-translatable. Names the four things FRQNCY actually delivers (teachings = Education, tools = Builder, places = Network State, capital = Fund). Vision-as-precondition for the mission.

*Risk:* Reads as a UN-aid mission statement — could be a magazine, a foundation, or FRQNCY. Less specific to what FRQNCY *is*.

**Claude's recommendation:** **Vision B**. It's the most distinctively FRQNCY, it's already most of the way written (it's almost the existing About hero subtitle promoted to a vision line), and it doesn't try to be normie-translatable at the cost of losing the editorial voice. Use Vision C as the OG/SEO/elevator version.

---

## Mission — three options

Each is one sentence (or one short paragraph). Pick the one that lands best.

### Mission A — the "we do four things" framing
**FRQNCY points you to the masters who already know, builds the tools and places where the network meets, funds the projects worth building, and holds the graph where it all comes together.**

*Why this works:* Names the operating modes (point = Curate + Education, builds = Builder, places = Network State, funds = Fund, holds the graph = Media + Research). Verb-led, present tense. Reader can see the work.

*Risk:* "Holds the graph" is internal language; would need a normie equivalent.

### Mission B — the "signal from noise" framing
**FRQNCY sifts the world's signal from its noise, hands it back as a single navigable graph, and connects the people building the next civilisation to one another and to the capital that funds them.**

*Why this works:* "Signal from noise" inherits the Curate pillar's vision language directly. "Single navigable graph" describes the actual product (the topic graph). Names the network function (connecting people) and the fund function in one breath.

*Risk:* "Next civilisation" is a strong claim — may overcommit. If you keep it, the rest of the site has to earn it.

### Mission C — the "empower the empowerers" framing
**FRQNCY platforms the people who already platform others — teachers, builders, researchers, healers — and makes their work readable, reachable, and worth your attention.**

*Why this works:* Promotes the existing slogan "FRQNCY empowers the empowering" to mission-line status. Names the network logic (multiplier picks) directly. Implies but doesn't list the pillars — leaves them as evidence.

*Risk:* Doesn't capture Fund or Network State / Sanctuary — feels like a Media/Education/Curate mission only.

**Claude's recommendation:** **Mission B**. It captures the most pillars in one line (Curate, Education, Media, Network State, Fund all visible), it gives the product its own definition ("a single navigable graph"), and it earns the editorial weight of the Vision. Use Mission C as a secondary line on the About / mission section because it carries the network logic in a way Mission B doesn't.

---

## Recommended pair (if you want one decision)

> **Vision.** A parallel society of conscious people — online, in real-world places, and within — where every area of life has been rethought from alignment with the highest self.
>
> **Mission.** FRQNCY sifts the world's signal from its noise, hands it back as a single navigable graph, and connects the people building the next civilisation to one another and to the capital that funds them.

These are written so they pair without echoing each other. Vision is the world; Mission is the verb. Both stay in FRQNCY voice (no positioning against, no cliches, abundance frame).

---

## Where these land on the site

If approved, surface in this order of priority:

1. **`about.html` hero section** — replace the current "A network of people, building their dream life" with the Vision line; add a second labelled section for Mission immediately below (currently the page jumps from "Vision" hero straight to Manifesto).
2. **`index.html` JSON-LD `description`** — currently uses the slogan; could swap to a compressed mission line for SEO.
3. **`/v2/colophon.html`** (proposed in EDITORIAL-VALUES-V2.md but not built) — the canonical home of Vision + Mission + values + slogans, plainly stated and linkable.
4. **Footer** — one line of either, rotating with the existing slogans (per EDITORIAL-VALUES-V2 §4).
5. **OG / Twitter card descriptions** — Vision C (the normie-translatable one) makes a good fallback here.

---

## Things that should NOT change

- **Slogan stays.** "A network of people, building their dream life. We invite you to find yourself." remains the homepage hero. It's the brand promise; Vision is the future state. Both can coexist on the same page in different sections.
- **Manifesto stays.** "FRQNCY is the spear piercing into the darkness. We empower the empowerers." is fight-language; Vision/Mission is north-star and operational language. Different registers, different sections.
- **Thesis stays.** "Remember. Create." is the practice-frame; sits inside the About page after Vision/Mission, not in front of it.

The rule: Vision sits above the Slogan in conceptual hierarchy (the world the slogan invites people into), and Mission sits below (the work the slogan promises gets done).

---

## Open questions for Orlando

1. Pick a Vision (A / B / C) and a Mission (A / B / C). Or rewrite — these are drafts, not commits.
2. Does the recommended pair feel right, or does the Vision/Mission split itself feel wrong (e.g. you want a single statement that does both)?
3. Should Mission name Curate / Sell explicitly, or accept that it's evidence-not-statement (per the recommended Mission B which subsumes Curate into "sifts the world's signal")?
4. Pillar schema drift (memory: `project_pillar_schema_drift.md`) is still open — Mission can't name pillars cleanly until that's resolved if you want pillar-named language.
