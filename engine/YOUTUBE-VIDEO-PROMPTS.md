# YouTube Video Prompts & Pipeline (memory)
> Reusable prompt bank + workflow for producing faceless / AI-assisted YouTube videos. Referral & promo links stripped. Tool names kept as workflow references only — swap any tool for the FRQNCY stack (ElevenLabs voice clone, FFmpeg assembler, ESA/NASA footage, Postiz) where it fits.

## The core insight (why most AI videos flop)
YouTube now runs Gemini on the backend and reads your **transcript**, not just title/thumbnail. It can tell "genuinely new/obscure" from "recycled ChatGPT facts everyone has heard." Two channels with identical style/thumbnails diverge on views mainly because one shares more **specific, lesser-known, less-vague** material. So the whole edge is: model a proven channel's format, then fill it with obscure, surprising substance.

## STEP 1 — Find the niche / generate video ideas
Screenshot a channel's /videos grid, paste the image + this prompt:

```
Look at these videos from this YouTube channel. Analyze the topics they've already covered and the style/format they use (thumbnail style, title structure, question-based framing, tone, etc.).
Then generate 15 new video ideas this channel has NOT done yet, but would fit perfectly based on their existing content strategy.
For each idea give me:

The video title (match their exact title style and structure)
A one-line description of what the video would cover

Rules:

No overlap with any video already shown
Stay in the same niche and format as the channel
Titles should feel like they belong on this exact channel, not a generic history channel
Think about what questions the audience is already asking that this channel hasn't answered yet
```

Optional: also attach a PDF of viral title frameworks so Claude extracts title patterns from other channels too.

## STEP 2 — Research the ONE idea for obscure substance
Pick one title from Step 1, then:

```
I'm creating a YouTube video titled:

[TITLE]

I want this video to feel NEW and not like something people have already heard before.

Find:

lesser-known facts
obscure details
surprising insights
things that are rarely mentioned in typical content on this topic

Avoid:

basic or widely known information
surface-level explanations

Focus on:

specific examples
unusual details
things that make the viewer think 'I've never heard this before'

Give me:

10 unique points I can use in the video
```

## STEP 3–9 — Production pipeline
3. **Script** — feed the Step-2 points + reference style into a scriptwriter; set monetization goal (e.g. Ad Revenue). FRQNCY note: run the own-words pass so the script is our voice, not the source's.
4. **Voiceover** — paste script into a TTS voice tool. FRQNCY: use our ElevenLabs Adam/own-voice clone.
5. **Scenes** — batch-generate scene stills/prompts from the script. FRQNCY: substitute ESA/NASA CC-BY footage (see engine/scenes.txt + render.sh).
6. **Clips** — generate the scene clips from prompts.
7. **Assemble (CapCut)** — import clips, arrange start→finish, drop in the voiceover, keep pacing fast and satisfying. FRQNCY: engine/render.sh already does captioned 9:16 assembly via FFmpeg.
8. **Thumbnail** — generate with a thumbnail maker matching the modeled channel's style.
9. **Publish/monetize** — schedule via Postiz; credit sources in the description.

## Video-render learnings (what actually works — 2026-07-19)
- **Footage must be dense/detail-filled at the crop.** Winners: Wolf-Rayet 124 (spiked star), Tarantula, Pillars of Creation, Cartwheel Galaxy. Losers: sparse starfields, zoom-into-black tails (Southern Ring, Cas A), rotated/inset clips (Butterfly). Rule: if the 9:16 center-crop is mostly black, skip it.
- **Avoid labeled intros.** ESA zoom clips open on constellation charts/coordinate grids — never use the first ~20%. Use the fully-zoomed hero tail (boomeranged to fill runtime) OR the clean mid-flight flythrough window.
- **Motion:** the static tail can read as a "zooming image." For real motion use the mid-flythrough window (`-ss` past the chart, near-native speed). Boomerang works only on already-busy hero frames.
- **Captions (locked):** blue-on-white karaoke, cadet blue `&H00A09E5F` fills each word as spoken, white box. Generator: `make_ass.py`. Centered vertically = ASS `Alignment=5` (file `cap01c.ass`). Word timing from faster-whisper (`words01b.json`).
- **Render:** `render.sh <esa_id> <n>` → boomerang tail; 2-pass FFmpeg (bg → subtitles+audio). Reverse filter is slow on long tails — split passes if a single call exceeds 44s.
- **Footage license:** ESA/Webb CC BY 4.0 → credit "ESA/Webb, NASA & CSA". US-gov (NASA, USFWS) = public domain.

## FRQNCY adaptations (keep it on-brand)
- Model channels for **format**, never copy their substance — ideas are free, expression is protected (see proposals/OWN-WORDS-PIPELINE.md).
- Titles: match a proven structure, but stay in FRQNCY voice — no clickbait that violates the voice playbook.
- Every teaching should ultimately live on the site; external links are footnotes.
- Captions: blue-on-white karaoke style locked in engine/make_ass.py + cap style.
- Footage: ESA/Webb CC BY 4.0 (credit "ESA/Webb, NASA & CSA"); NASA PD.
