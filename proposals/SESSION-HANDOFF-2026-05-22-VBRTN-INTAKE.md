# Session Handoff — VBRTN intake + My FRQNCY trinity hub

**Date:** 2026-05-22
**Audience:** Next agent (Fable model or other) picking up the work
**Prereq reading:** `proposals/MY-FRQNCY-VBRTN-COMPANION-2026-05-22.md` (the cause doc — written this session; canonical for everything VBRTN-shaped)

---

## TL;DR

- **Cause doc written and locked.** `proposals/MY-FRQNCY-VBRTN-COMPANION-2026-05-22.md` defines what VBRTN is, the seven lenses it composes, the self-improvement loop, the full intake design, the data shape, and what ships first. ~400 lines, ~7,000 words. Referenced from top-level `CLAUDE.md`.
- **The 25-question intake is built and live** at `/my-frqncy/intake/`. Single-file vanilla HTML/CSS/JS, ~1,140 lines. Splash → 5 sessions → completion summary → VBRTN companion link. State persists to localStorage under `frqncy:vbrtn:profile`. Resumable.
- **First VBRTN companion surface is live** at `/my-frqncy/vbrtn/`. Single-file, ~560 lines. Reads the profile, renders a design-aware morning open (HD type → specific prompt), surfaces the user's modal-operator sentence with a rotating Bandler/Grinder recovery question, shows derived insights, persists reflections.
- **My FRQNCY hub at `/my-frqncy.html` rewritten** as the **trinity hub**. ~340 lines. Renders the user's constellation generated from the profile (animated SVG, gold center + 6 surrounding stars). Trinity nav cards: NRG, VBRTN, FRQNCY. The original 2,174-line constellation wizard is preserved at `my-frqncy.html.bak.vbrtn`.
- **The profile is the founding block.** Single source of truth at `frqncy:vbrtn:profile` in localStorage (Supabase row when signed in). Powers the constellation, the companion, the network, the map. Every downstream surface reads from it; every new signal writes back to it.

## What's been built this session

Three live surfaces and one canonical doc:

**`/proposals/MY-FRQNCY-VBRTN-COMPANION-2026-05-22.md`** — the cause doc. Sections:
1. What VBRTN is, the premise.
2. The arc from intake to a new earth (full flow).
3. The self-improvement loop architecture (two levels — per-user + aggregate, with HD as the foundation, privacy as the floor, composite improvement signal).
4. How we run it (parallel channels: AI assistant, online courses, app; offline-encouraged).
5. The ultimate goal (people don't need FRQNCY anymore; physical Spaces and Townhalls).
6. The intake design — 4 layers across 5 sessions.
7. The seven lenses (HD, Gene Keys, astrology, Hawkins, NLP meta-programs, modal operators, personal triggers).
8. The voice — Milton Model fused with FRQNCY register.
9. Four shapes VBRTN takes (morning open, Illuminator, companion thread, recommendation trail).
10. Rules-to-win architecture, with **MTRSYCW** (*Make The Rules So You Can Win*) as the meta-rule.
11. What VBRTN never does.
12. Full intake questionnaire v0 (25 questions written out).
13. Data shape sketch.
14. Open questions.
15. What ships first.

**Acronyms locked in this doc:**
- *MTRSYCW* — **Make The Rules So You Can Win** (always, easily).
- *KTS* — **Know The Score** (the user's metrics surface).
- *GIN* — **Global Information Network** (the FRQNCY corpus VBRTN trains against).
- *WDYLT* — **Who Do You Listen To** (daily attribution surface).
- *TI* — **Teachability Index** (Bob Proctor: desire × willingness).
- *TBS* — **Training Balance Scale** (companion's calibration for how hard to push).
- *Blaue Brille* — **the positive lens** (reframing as central method).
- *Seed of greater benefit* — left intact as a FRQNCY-coined contemplative term.

**`/my-frqncy/intake/index.html`** — the 25-question intake. Built this session in two passes (initial + post-feedback polish). Highlights:
- Opening splash with Milton-Model presupposition framing.
- Session 1 polished per direct user feedback: Q1 (life-state, 8 concrete options like "Hitting my stride" / "Just getting through"), Q2 (17 emotion tiles with common dominants — Stressed, Overwhelmed, Sad, Lonely, etc.), Q3 (12-tile dominant-desire chooser replacing a heavy textarea).
- Session 2 polished: Q8 reframed from *"thing you've never been able to change"* (too philosophical) to *"pattern that keeps coming back"* with concrete examples. Birth-form has prominent "Time unknown" toggle + dashed-border Skip card.
- Session 3 polished: Q12/Q13 (general/specific, sameness/difference) made into concrete situations instead of abstract self-quizzes. Q15/Q16 modal-operator captures made invitational.
- Session 4 polished: Q19 music hint mentions Mindmovies to give the user a reason to answer the optional. Q20/Q21 hints give concrete examples to lower cognitive load.
- Session 5 polished: Q24 changed from *"how open does change feel today?"* to *"What is your willingness to change today?"* (per direct user request — direct language beats metaphor).
- **Auto-advance** on tile selection (~1.75s after reflection appears). **Auto-advancing session interstitials** show derived insights between sessions ("VBRTN already sees: ..."). **600ms fade** for reflections (down from 1100ms).
- Produces the full profile blob at `frqncy:vbrtn:profile`. Position tracked at `frqncy:vbrtn:position`. Splash-shown flag at `frqncy:vbrtn:started`. Sessions-shown list at `frqncy:vbrtn:sessionsShown`.

**`/my-frqncy/vbrtn/index.html`** — the first real VBRTN companion surface. Renders six sections:
1. Design-aware morning open — Cormorant italic line picked deterministically from HD type via day-hash. Generator gets *"What are you responding to today?"* Projector gets *"Who saw you yesterday?"* Manifestor gets *"What needs to be initiated this morning?"* Fallback to feeling-based, then texture-based.
2. Reflection input — user writes, save persists to `profile.history.interactions`, **modal-operator regex scan** on save catches *I have to / I should / I must / I need to / I ought to / I can't / I cannot / I won't / I couldn't* and appends to `profile.meta.modalOperators` with source tagged as `reflection`.
3. **Modal-operator recovery prompt** — if user wrote modal sentences in intake, this card surfaces one of them with a rotating Bandler/Grinder recovery question. State persists in `frqncy:vbrtn:recoveryRotation` so prompts don't repeat unless user asks.
4. *What VBRTN sees* — derived insights (texture-to-verb mapping + HD type + meta-program + desire + triggers + rememberOne).
5. *The room knows* — 2×2 stat grid (current state, TI, distance from life you want, reaching toward).
6. Chart card — HD type, strategy, authority, profile, GK, astro. Placeholder note while chart engine is stubbed.

**`/my-frqncy.html`** — the trinity hub (was 2,174-line constellation wizard, now 341 lines). Two states:
- **No profile** — splash with "Begin to know yourself" + breathing CTA + founding-block strip + trinity preview.
- **Has profile** — Cormorant headline from `rememberOne`, animated SVG constellation (gold pulsing center for chief desire, 6 surrounding stars: Design / Recent state / Pulled toward / Door back / Strategy / Remember), *What VBRTN sees* card, founding-block strip, trinity nav.

Original wizard preserved at `my-frqncy.html.bak.vbrtn`.

## The architecture in one paragraph

**One profile, three surfaces.** The 25-question intake produces a profile blob (`frqncy:vbrtn:profile`) that lives in localStorage and is destined for a single Supabase `charts` row when the user signs in. This blob is the founding block — every part of FRQNCY (the companion VBRTN, the network NRG, the topic map FRQNCY) writes to it and reads from it. Adjacent stores (`frqncy:vbrtn:position`, `:started`, `:sessionsShown`, `:recoveryRotation`) hold intake-flow state and companion-rotation state. Nothing leaves the device until the user signs in.

## File map

```
proposals/
  MY-FRQNCY-VBRTN-COMPANION-2026-05-22.md       # the cause doc (canonical)
  SESSION-HANDOFF-2026-05-22-VBRTN-INTAKE.md    # this doc
  SANCTUARY-ROADMAP.md                          # what stays out forever (inherited)
  FRQNCY-VOICE-PLAYBOOK.md                      # voice constraints (inherited)
  SANCTUARY-DAILY-USE-SYNTHESIS-2026-05-16.md   # Today-card discipline (inherited)

my-frqncy.html                                  # NEW trinity hub (341 lines)
my-frqncy.html.bak.vbrtn                        # original wizard (2174 lines, preserved)

my-frqncy/
  intake/
    index.html                                  # 25-question intake (~1140 lines)
  vbrtn/
    index.html                                  # companion surface (~560 lines)
  dashboard/
    index.html                                  # Sanctuary (UNTOUCHED — 3313 lines)
    CLAUDE.md                                   # dashboard orientation (inherited)
  practice/
    index.html                                  # practice tracker (UNTOUCHED)
  charts/
    index.html                                  # chart view (UNTOUCHED)

CLAUDE.md                                       # top-level — updated with VBRTN cause doc reference
```

## The 25 questions — what each one is for

This is the honest accounting (done mid-session when Orlando asked *what are we getting?*):

**Seven lenses the companion writes against** (the load-bearing capabilities):
- Q6 (birth data) → HD chart, Gene Keys, astrology. *Architectural foundation.*
- Q7 (prior familiarity) → calibrates language depth.
- Q9–Q14 (Toward/Away, Internal/External, Options/Procedures, General/Specific, Sameness/Difference, Convincer) → how the companion phrases offers so they land on the first read.
- Q15, Q16 (modal-operator captures: *I have to* / *I can't*) → drive the Bandler/Grinder recovery prompts. Highest-leverage technique per cause doc.
- Q17, Q18 (negative + positive triggers) → anchor inventory. Q18 specifically gives the companion *doors back* it can hand the user in distress.

**State baseline that powers the self-improvement loop:**
- Q2 (recent feeling) → internal Hawkins state octave seed.
- Q23 + Q24 (TI baseline: desire × willingness) → rolling 30-day metric.
- Q25 (chief-aim distance) → re-asked every 30 days; the *trend* is the literal improvement signal.

**Direction and seed:**
- Q1 (texture / life-state) → content cadence.
- Q3 (dominant desire) → routes topics from the 146-topic graph.
- Q22 (remember one thing) → seed; *becomes the companion's opening line in every session* per cause doc.

**Future material — captured at intake, drives behavior over months:**
- Q4 (avoiding), Q5 (pull), Q8 (recurring pattern), Q19 (music — feeds Mindmovies), Q20 (where you feel most yourself), Q21 (witnessed truth). Currently surfaced in derived insights but not yet routing content or triggering interventions.

## Voice & convention notes

- **Present-tense declarative.** No future-promise. No *we will*. No *someday*.
- **Cormorant italic** appears in exactly four positions: hero, Chief Aim vow line, milestone lines, empty-state prompts. In the intake and VBRTN surface it's specifically for: morning open lines, derived insights, reflection responses, completion summaries. Don't dilute it.
- **Gold accent** (`#C4973A`) means one of three things: invitation, acknowledgment, or current state. Don't use gold for anything else.
- **Forbidden phrases:** *love and light* as direct self-description, *high vibe*, *sacred space* (cold), *do the work*, *your journey starts here*, *unlock*, *next gen*, *disrupt*, *we will*, *someday*. See `proposals/FRQNCY-VOICE-PLAYBOOK.md`.
- **What VBRTN never does** (from cause doc): prescribe, rank, moralise about Shadow, send data to third-party sinks, paywall the daily relationship, simulate emotion, persist harmful triggers as named content in prompts.
- **MTRSYCW is the meta-rule.** Every offer the companion makes is pre-checked: *given this user, given this state, given this offer — can they win, and is it easy?* If not, reshape.

## Open questions to resolve

From the cause doc's Open Questions section, the ones that still need calls:

1. **Model choice** for VBRTN — Anthropic Sonnet for daily, Haiku for micro-reflections? Local model option later for the most private layer?
2. **Astrology source** — Swiss Ephemeris (open) client-side via `swisseph-wasm`, or via a Cloudflare Worker?
3. **Voice-training corpus** — needs ~20 examples per HD type, 10 per Hawkins octave, 10 per common Gene Key Shadow. Build as a separate sub-project.
4. **Chart engine integration** — current intake stubs `design.hd` / `design.gk` / `design.astro` with random placeholders. Real computation is a 2-3 day focused build. **Highest-leverage next step.**
5. **Membership boundary** — Sanctuary roadmap forbids paywalls on Sanctuary features; 90-day plan gates `/my-frqncy/practice/` advanced charts behind member tier. Where exactly does the line sit for VBRTN's long-form reading, voice output, historical synthesis? Cause doc says daily companion thread is free in perpetuity.
6. **Sanctuary dashboard streak contradiction** (pre-existing, not introduced this session) — `my-frqncy/dashboard/index.html` lines ~2135 ships a 🔥 streak chip and "streak N" copy that contradicts the May-16 daily-use notes. Quiet milestones at lines ~2897 are aligned. Fix-pass needed.

## What ships next (in priority order)

1. **Real chart engine.** Replace the stub. Swiss Ephemeris client-side is feasible. The cause doc says HD is the foundation, not a feature — making this real turns the intake from prototype into product.
2. **Surface Q22 (rememberOne) at the top of VBRTN morning open.** Currently appears in a gold-bordered "You asked the companion to remember" block lower in the page. Move it to be the companion's actual opening line: *"You asked to be remembered as [X]. Today, that part of you needs to: [design-aware prompt]."*
3. **"Doors back" button in VBRTN.** When the user is in the companion surface and signals distress, one tap surfaces a specific positive trigger from Q18 as a suggested move.
4. **Wire VBRTN profile into the Sanctuary dashboard.** Currently the dashboard has its own state at `frqncy.sanctuary.v1`; the new profile is at `frqncy:vbrtn:profile`. A bridge layer that pulls chief desire + remember-one + recent feeling into the Today card greeting. Touchy edit on a 3,313-line file — proceed carefully.
5. **Cohort patterns / aggregate learning scaffolding.** The self-improvement loop section of the cause doc requires the system to log `(state-before, intervention, state-after)` triplets across users (anonymized). No infrastructure yet. Phase 2+ work.

## Quick-start commands

```
cd ~/Documents/Claude/Projects/FRQNCY\ WEBSITE
git status
git log --oneline -10
```

Local preview (any of the three surfaces):

```
open my-frqncy.html
open my-frqncy/intake/index.html
open my-frqncy/vbrtn/index.html
```

Run the intake fresh:

```
localStorage.clear()
```

(then refresh `/my-frqncy/intake/`)

Inspect the profile blob mid-flow:

```
JSON.parse(localStorage.getItem('frqncy:vbrtn:profile'))
```

## Cross-references

- `CLAUDE.md` (top-level) — has been updated to reference the VBRTN cause doc.
- `proposals/MY-FRQNCY-VBRTN-COMPANION-2026-05-22.md` — read this **first**. Canonical.
- `proposals/SANCTUARY-ROADMAP.md` — what-stays-out-forever, Phase plan. VBRTN cause doc inherits its principles.
- `proposals/FRQNCY-VOICE-PLAYBOOK.md` — voice playbook. Required reading before writing any user-facing copy.
- `proposals/SANCTUARY-DAILY-USE-SYNTHESIS-2026-05-16.md` — Today card discipline. Informs the morning-open shape.
- `my-frqncy/dashboard/CLAUDE.md` — dashboard implementation conventions (single-file, lazy-init reads, persist().then(renderAll) pattern). VBRTN surfaces adopt the same conventions.

## Style for the next agent

Per top-level `CLAUDE.md`: write in prose, not bullet lists, when explaining things to Orlando in chat. He prefers single-line paste-able commands when given terminal work — no backslash continuations, no multi-line commit messages. Each command on its own line. For documentation: lean and skimmable. Headers, short sections, one example per concept.

Orlando moves fast. He'll say *"just do it"* when he wants execution without further consultation. He'll say *"give me the X"* when he wants the smallest possible deliverable. When in doubt, ship the smallest valuable thing and report back, rather than asking for more clarification.

He validates by walking the work cold — opens the page, plays with it, and reports what feels off. Build for that test.

---

**End of handoff. The work continues.**
