# Crypto Sub-Hub Rubric — v1.0

The juror rubric for the 3-builder × 3-juror tournament on `/v2/crypto/<sector>/`.
Three axes. Each scored 1–10 with concrete anchors. A page passes at **8+ across
all three axes**. Below 8 on any axis fails the page back to the builder.

Voice authority: `proposals/FRQNCY-VOICE-PLAYBOOK.md`. Aesthetic authority: the
shipped commissions for water/music/money/wellbeing/audio (these are the family
the sub-hubs should fit inside, not depart from).

---

## Axis 1 — Crypto-Twitter (CT) culture alignment (1–10)

How would this read to someone who lives on Crypto Twitter — Bankless / aixbt /
Murad / Cobie / Vitalik / Hyperliquid degens — opening it on their phone in 2026?

**1–3 — Generic.** Reads like a press release. Names no founders. Uses
"blockchain ecosystem" instead of the chain's name. References no cultural
moments. Could be on any crypto site.

**4–6 — Aware.** Names the obvious figures. References one or two cultural
moments correctly. Gets the terminology right but not native (says "TVL"
when it should say "TVL is back above $X"). No quotable lines.

**7 — Native.** Names founders, real protocols, real cultural moments
(DeFi Summer, Curve Wars, Tornado sanction, Ronin hack, BlackRock IBIT,
Helium HNT migration). Uses native terminology correctly (AVS, restaking,
IL, MEV, OEV, IP-NFT, peg, basis trade). At least one line is quotable
on X.

**8 — Sharp.** Native + has a clear thesis the reader can disagree with.
Names tradeoffs other sources skip (sequencer centralization, AVS
slashing risk, Lido's 28% concentration, the Murad/normie split).
Closing triad reads as a cypherpunk proverb, not marketing.

**9 — Quotable.** Sharp + at least one line will be screenshotted to X.
A CT person with 50k followers would post this page un-edited and earn
engagement. Editorial voice clearly distinct from CoinGecko / Messari.

**10 — Canonical.** Quotable + treated as a reference. The page becomes
the link people send when someone asks "what is [sector]". Founders
named in the page approve of the framing if they read it.

**Score the page. Cite specific lines. Penalise generic phrases ruthlessly.**

---

## Axis 2 — Messaging clarity & thematic discipline (1–10)

Does the page do exactly one thing? Does every section reinforce that one
thing? Could a stranger explain the sector after reading it?

**1–3 — Confused.** Multiple theses. Tries to be a textbook. Section titles
don't follow from the hero. Projects listed don't fit the sector
(Tether on Bitcoin, DOGE on DeFi). Practice steps generic.

**4–6 — Acceptable.** Single thesis but not load-bearing. Most projects fit.
Tech grid generic ("Lightning is fast"). Practice steps correct but
unspecific ("hold across cycles").

**7 — Clear.** Single thesis stated in the prelude and revisited in the
closing. All projects in the working set are sector-native (no leakage).
Tech grid items are real, year-tagged, and use protocol-specific terms
(HTLC for Lightning, Yuma Consensus for Bittensor, IP-NFT for Molecule).
Practice steps are sector-specific and actionable in under 2 hours each.

**8 — Pointed.** Clear + the thesis sharpens against an alternative
("Solana says one chain; Ethereum says rollups; this is what's at stake").
Stats in the hero anchor the thesis ("1993 manifesto · Aug 2022
sanction"). At least one section answers an objection a CT cynic
would raise.

**9 — Inevitable.** Pointed + reads like the sector's official defence.
Removing any section weakens the thesis. The bleed caption, the
quote, and the closing triad all rhyme. No filler sentences.

**10 — Authoritative.** Inevitable + the page would survive being read
by the founders of the named protocols without embarrassment. They
might disagree with the framing; they cannot say it was wrongly
described.

**Score the page. Quote two sentences that are doing the most work. Quote
two sentences that are filler.**

---

## Axis 3 — UX & visual quality (1–10)

How does the page render and read on the device a CT user actually opens
it on (iPhone, Brave/Phantom-default, dark mode forced)?

**1–3 — Broken.** Hero overflows on 320px. Ticker rail wraps badly.
Project cards stack with broken accent borders. Glyph SVG renders
black-on-black or fails. Filter button row clips. Loading layout
shifts (CLS > 0.25).

**4–6 — Working.** Renders. Mobile usable but cramped. Hero stats present
but readable only on desktop. Glyph visible but generic. Project cards
all the same. Tech grid (when present) reads as boring.

**7 — Polished.** Renders cleanly to 320px. Hero stat strip stays legible
on mobile. Glyph is sector-iconic and animated. Ticker rail collapses to
just-avatar-and-ticker on phone. Drop cap renders correctly. Hero filter
visibly different from neighbouring sectors.

**8 — Refined.** Polished + the page has visual rhythm (variation between
prose-section and grid-section, not all fade-up boxes). One element
surprises (typewriter quote, ghost h1, ascending pattern overlay).
Image filter is sector-specific and contributes to mood (Privacy looks
darker and more monochrome than Memes).

**9 — Distinctive.** Refined + the page would be picked out of a
20-page lineup as belonging to this sector specifically — not just
"a FRQNCY page." Typography hierarchy is intentional (h1 weight,
italic accent words, monospace stats all serve the thesis). Loading
performance: hero LCP under 1.5s on 4G.

**10 — Memorable.** Distinctive + a designer would screenshot a section
for inspiration. The artwork is so coherent that the page works as
a printed editorial spread.

**Score the page. Test on a 320px viewport. Cite one element that lifts
the page and one that drags.**

---

## Composite scoring

- **CT alignment + messaging + UX, simple sum, max 30.**
- **Pass threshold: 24 (8/8/8 minimum, no axis below 8).**
- **Tournament winner: highest composite from the three builders, ties
  broken by CT-alignment score.**

Tie-breaker rationale: if two pages tie, the one that reads more native
to Crypto Twitter wins, because that's where this audience lives. UX
and messaging are necessary; CT-native is the differentiator FRQNCY
can credibly own.

---

## Anti-patterns (auto-fail any axis)

- "Wagmi" / "GM" used un-ironically in copy. Auto-fail CT axis.
- A single project on the page that isn't in `SECTOR_TOP_PROJECTS`.
  Auto-fail messaging axis.
- A page that copies prose verbatim from a competitor's home page
  (Pyth, Chainlink, Bankless, Messari). Auto-fail messaging axis.
- A page where the hero glyph is the same kind as a neighbouring
  sector's. Auto-fail UX axis.
- A page that uses `❤️`, `🔥`, `🚀`, or any other emoji in body copy.
  Auto-fail UX axis.

---

## Round structure

Each builder produces a full sub-hub HTML for their assigned sector.
Each juror scores all three builds independently. Winner is announced.
Builders read the juror notes and re-submit. Up to 3 rounds. After
round 3, highest composite ships even if below threshold.

After three reference sub-hubs reach 8+/8+/8+, the patterns that
delivered the wins are codified and applied to the remaining 18
sub-hubs via the existing generator.
