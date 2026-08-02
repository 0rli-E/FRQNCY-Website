# Homepage Hero Video — Production Brief

**The shot:** Norman Gräter in a cold, heavy world → the world transforms into colour, light and possibility. His blue glasses (Etnia Barcelona BRUTAL N°1 — his public signature) are the lens that does it. This becomes the full-bleed background of the search-first homepage.

**Route (locked by Orlando):** animate the **existing Norman photos** via **AI image-to-video** — not a live shoot, not text-to-video from scratch.

**Status:** the homepage hero is already built as a CSS placeholder (`#hero-perception` in `index.html`) and is **swap-ready** — when the video file exists it drops into two `<source>` slots and nothing else moves. See "Step 5" below.

---

## 1. Source assets — what we have

Three photos from one shoot, all Norman in the blue glasses, smiling, navy blazer, on a clean light background:

| File | Orientation | Size | Use |
|---|---|---|---|
| `images/norman.jpg` | **landscape 1280×853** | 96K | **MASTER** — hero-shaped, use this one |
| `images/Norman2.jpg` | portrait 853×1280 | 160K | mobile / fallback crop |
| `images/norman-graeter.jpg` | portrait 853×1280 | 160K | alt |

**Key realisation:** these photos are already the *destination* — glasses on, beaming, alive. We don't need to generate the happy end-state. We generate the **origin** (cold/troubled) and morph forward. The clean background means swapping the world behind him (chaos ↔ heaven) is a simple generative-fill job.

---

## 2. Creative approach — a two-keyframe morph

Every platform shares one weakness: faces drift over long generated clips. The fix the research is unanimous on: **don't let the AI invent the journey freely — give it a start frame and an end frame and have it interpolate.** Both frames derive from the *same* Norman photo, so his face is identical at both ends and can't drift.

We build two stills:

- **Frame A — BEFORE (cold):** Norman from `norman.jpg`, desaturated / cold-graded, expression softened to neutral-concerned, set against a **dark, heavy world** (storm light, grey, oppressive — "one problem after another"). Glasses can stay on (see below).
- **Frame B — AFTER (warm):** the same Norman, full colour, beaming (as shot), against a **luminous heaven-on-earth world** (golden dawn, depth, life). This is essentially the original photo + a transformed background + warm grade.

The AI fills the ~5–8 seconds between: the grade lifts, the world blooms from grey to gold, his expression opens. That *is* the perception shift.

### Two ways to handle the glasses

- **Option B — world-morph (RECOMMENDED, reliable):** glasses stay **on** in both frames (they're his constant signature). The transformation is carried by the world + grade + micro-expression. AI handles this cleanly. On-brand: the photo *is* the blue glasses.
- **Option A — literal "putting them on" (harder):** Frame A has glasses off / lowered, Frame B has them on. More literal to the narrative, but AI struggles to make glasses materialise correctly, and we have no glasses-off source photo. If Orlando wants the literal gesture, it likely needs a quick custom still (glasses removed via edit) or a 2-second phone clip of Norman raising the glasses. **Recommend shipping Option B first; revisit A only if the literal donning is essential.**

---

## 3. Step 1 — make the two keyframes

From `images/norman.jpg`, produce `frame-a-before.jpg` and `frame-b-after.jpg` at matched composition (same crop, same Norman, ~1920×1080 for the hero).

Tooling options, cheapest first:
- **Adobe Firefly / Photoshop generative fill** (or the Adobe MCP tools available in this session): select the background → generative-fill the chaos world (Frame A) and the heaven world (Frame B); then grade A cold/desaturated, B warm.
- **Nano-banana / Gemini image / any inpainting tool** if you prefer.
- I can generate both keyframes for you right now using the Adobe image tools in this session — just say go.

Grade targets: Frame A ≈ desaturated, −temperature (cold blue-grey), −exposure, heavy vignette. Frame B ≈ full saturation, +warmth (gold), lifted highlights, soft glow.

---

## 4. Step 2 — pick the platform

Research verdict (full report in chat history, June 2026). Ranked for *this* job — animate a real person's photo through a transformation:

| Rank | Platform | Why | Entry price | Link |
|---|---|---|---|---|
| 🥇 | **Hailuo / MiniMax (Hailuo 2.3)** | Best face fidelity from a single ref + a purpose-built **Start & End Frames** mode (and "End-Frame Only") explicitly for transformation sequences | **$9.99/mo** | hailuoai.video |
| 🥈 | **Kling AI (Kling 3.0)** | Cinematic-quality benchmark (4K/60fps, "looks filmed"); **O1 keyframe** interpolation praised for blending two environments; native audio if wanted | ~$6.99–10/mo | klingai.com |
| 🥉 | **Pika 2.5 (Pikaframes)** | Cheapest; Pikaframes is the most dedicated start→end morph tool (+ Pikaffects for the glasses beat); great for a fast prototype | **$8/mo** | pika.art |

**Practical play:** prototype on **Pika ($8)** to validate the concept cheaply, then run the final render on **Hailuo ($9.99)** or **Kling** for quality + face fidelity. Total under ~$20 for a month. Well within budget.

**Skip Runway** for this specific shot: it's the cinematic-quality leader but Gen-4 *dropped* last-frame keyframe support, and its best likeness tool (Act-Two) needs a driving performance *video*, not a photo. Reconsider only if Norman records himself acting the shot.

### The "Creatorwood" note
Creatorwood (creatorwood.tv) is **real but the wrong tool** — it's an AI *filmmaking/streaming studio* that turns a book/script into a full film and sells it on a marketplace (~$20/min, feature films ~$1,100–2,065). It only uses a photo as a style reference; it does **not** animate your actual photo. The on-target category is image-to-video generators (above). Likely Orlando meant it loosely as "an AI video studio."

---

## 5. Step 3 — the generation prompt

Upload `frame-a-before.jpg` as the **start frame** and `frame-b-after.jpg` as the **end frame**. Reference image = `norman.jpg` to pin identity. Suggested prompt (Hailuo Start & End Frames / Kling O1):

> Cinematic slow push-in on a man in blue glasses. The world around him begins in cold, grey, oppressive gloom — desaturated, heavy, storm-lit — then blooms gradually into warm golden light, colour and depth, like dawn breaking. His expression softens from troubled to a calm, genuine smile. Subtle, elegant, photoreal. No camera shake, no morphing artefacts on the face. Slow, dignified, hopeful.

Settings: 1080p+, ~6–8s, slowest motion / lowest "creativity" that still completes the morph, keep camera near-static (a gentle push-in only). Generate 3–4 takes, pick the one with the cleanest face hold.

---

## 6. Step 4 — post

- Add a quiet music swell + a soft "bloom" sound at the turn (top picks render silent). Any editor — CapCut, Premiere, DaVinci (free).
- Optional final grade pass to match FRQNCY navy #0B1C3D / gold #C4973A.
- Trim to a seamless **loop** (the hero autoplays muted on loop) OR a one-shot that holds on Frame B.

---

## 7. Step 5 — wire it into the homepage

The hero is already built to receive it. In `index.html`, the placeholder scene layers:

```html
<div class="scene" aria-hidden="true">
  <div class="scene-layer scene-before"></div>
  <div class="scene-layer scene-after"></div>
</div>
```

When the file exists, drop the video in as the full-bleed background (behind `.hero-fg`). Two clean options:
- **Simplest:** one looping `<video>` of the full morph as the scene; keep the CSS gradient as the poster/`prefers-reduced-motion` fallback.
- **Interactive (matches the current mechanic):** hold Frame A as a poster while "glasses off"; on search-focus / toggle (the existing `glasses-on` body class), play the morph to Frame B. I'll wire the JS when the file lands.

Export specs:
- **Format:** `hero.mp4` (H.264) **+** `hero.webm` (VP9) for the two `<source>`s.
- **Resolution:** 1920×1080 (desktop); optional 1080×1350 portrait crop for mobile from `Norman2.jpg`.
- **Length:** 6–10s. **Muted, autoplay, loop, playsinline.** Target < 3–4 MB each (compress hard — it's a background).
- **Poster:** a still of Frame B (or A) so something shows before the video loads / on reduced-motion.

---

## 8. Budget + timeline

- **Cost:** ~$8–20 for a month of one platform. Keyframes free if generated with Firefly/MCP.
- **Time:** keyframes ~1hr → generation + reroll ~1–2hr → post ~1hr → wire-in ~15min. **A single afternoon.**

## Recommended next action
Say the word and I'll generate **Frame A (cold/before)** and **Frame B (warm/after)** from `norman.jpg` right now using the Adobe image tools, so you have the two keyframes ready to upload to Hailuo or Pika.
