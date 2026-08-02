# FRQNCY AI Content Engine — Architecture & Build Spec
> Automated find → summarise → script → speech → video → post pipeline. Grounded on 2026 API reality (Runway/ElevenLabs/Postiz = full API; Suno/Higgsfield = UI-only, batch; Resolve = local scripting).

## The two-track model (policy-safe by design)
YouTube's 2025 policy demonetises *mass-produced pure-AI* content. So we split:

- **Track A — Human flagships (the moat):** Orlando records 2 real teachings/week (Riverside). Monetisable, un-flaggable, the source of authority. Polished in DaVinci Resolve.
- **Track B — AI-assembled dailies (the engine):** everything below. Runs on Orlando's *cloned voice* + *real editorial scripts* + a *human approval gate* → counts as human-anchored, not synthetic spam. This is what fills the daily slots across books / money / spirituality + hub.

## The pipeline (Track B), stage by stage

| # | Stage | Tool | Automatable? | Notes |
|---|-------|------|--------------|-------|
| 1 | **Find / queue** | PD library + master-summary list | ✅ full | Source is inventory we already own (Drive library) + a queue of master videos to summarise. Claude picks the next item. |
| 2 | **Summarise → script** | Claude API | ✅ full | Source text/transcript → FRQNCY-voice script (hook + teaching + CTA). The brain. Prompt in `/engine/script-prompt.md`. |
| 3 | **Speech** | ElevenLabs API | ✅ full | Orlando's voice clone. Script → MP3. ~$0.30/1k chars. |
| 4 | **Visuals** | Runway API **or** prebuilt library | ✅ Runway / 🔧 library | Runway Gen-4 for fresh b-roll (~$0.12/s), OR reuse a library of cosmic/abstract clips generated in Higgsfield/Runway batches. Library is cheaper for volume. |
| 5 | **Music** | Suno (batch) | ⚠️ no API | Pre-generate ~20 ambient tracks in one Suno session → reuse. Never per-post. |
| 6 | **Assemble + captions** | FFmpeg (auto) / Resolve (flagships) | ✅ FFmpeg | FFmpeg script layers voice + visual + music + burned-in captions → 9:16 MP4. No GUI. Captions via Whisper alignment. |
| 7 | **Post** | Postiz API/MCP | ✅ full | Schedule to the right channels; vary hook/caption per channel. |
| 8 | **Approve** | Human gate | 5-min batch | Orlando reviews the day's drafts before they publish. Quality + policy safety. |

## Orchestrator
**n8n (self-hosted, free)** chains stages 1→8 via HTTP nodes. It's the backbone that calls each API in sequence and hands off to Postiz. Later, fold into `frqncy-harness` as a native lane (the on-brand end state). Start with n8n — fastest to stand up.

## Tool stack + cost
| Tool | Role | Cost |
|------|------|------|
| Claude API | Script brain | usage (~$0–20/mo) |
| ElevenLabs | Voice clone + TTS | Creator $22 / Pro $99 |
| Runway | AI video (API) | Standard ~$15–35 + credits |
| Suno | Music library (batch) | Pro ~$10 |
| Higgsfield | Hero visuals (batch) | ~$17–49 |
| DaVinci Resolve Studio | Flagship editing | $295 one-time (or free version) |
| FFmpeg | Automated assembly | free |
| n8n | Orchestration | free self-host |
| Postiz | Scheduling | free self-host |
| Fal.ai (optional) | Video API aggregator (600+ models, cheaper/faster than Runway for some) | usage |

**≈ $80–180/mo + $295 one-time Resolve.** Start lean: ElevenLabs Creator + Runway Standard + Suno Pro + n8n/Postiz/FFmpeg free = ~$50/mo.

## Compliance
- Orlando's *own* voice clone needs **no** AI-disclosure on YouTube.
- AI *visuals*: tick TikTok's AIGC toggle, Meta's "Made with AI" label where prompted.
- Keep the human approval gate — it's what separates "AI-multiplied" (fine) from "AI slop" (demonetised).

## Phased build
- **Phase 1 (now) — prove one video by hand:** PD passage → Claude script → ElevenLabs voice → 1 Runway clip or library visual + 1 Suno track → FFmpeg assemble → post via Postiz. One end-to-end unit.
- **Phase 2 — automate the spine in n8n:** script → voice → draft video, dropped into a review folder.
- **Phase 3 — visual + music libraries + auto-captions:** batch Suno/Higgsfield once; Whisper captions.
- **Phase 4 — hands-off with approval queue:** n8n runs nightly, produces the next day's drafts, Orlando approves in one batch, Postiz publishes.

## What Claude builds (no API keys needed)
- `engine/script-prompt.md` — the FRQNCY-voice script generator (per channel).
- `engine/assemble.sh` — the FFmpeg assembler (voice + image/clip + music + captions → 9:16 MP4).
- `engine/pipeline.n8n.json` — the n8n workflow skeleton.
- `engine/README.md` — where you paste each API key and how to run it.

Orlando plugs in the keys (ElevenLabs, Runway, Postiz) — Claude can't enter credentials.
