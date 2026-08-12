# Social Automation Blueprint — idea → creation → post, on the real stack
> How far the pipeline automates on the tools we actually run — Claude · ElevenLabs · engine (FFmpeg) · Runway · Higgsfield · Suno · CapCut · Postiz · CreatorFlow · Metricool — verified against each tool's August-2026 API reality. Supersedes the orchestrator section of `CONTENT-ENGINE-SPEC.md` (n8n → Claude-native for this lane). Companion to `IG-3CHANNEL-PLAN.md` §4 (the batch session this doc progressively dissolves). 2026-08-07.

---

## 0 · Five discoveries that change the plan

1. **ElevenLabs returns word timing with the audio.** `POST /v1/text-to-speech/{voice}/with-timestamps` returns the MP3 *and* character-level timestamps in one call. The faster-whisper alignment step is deleted; captions can never drift from the voice again.
2. **Postiz has a full public API + official MCP server.** `POST /upload` (multipart MP4) → `POST /posts` with **per-channel captions and per-platform settings in a single request**, `type: "draft" | "schedule" | "now"`, plus `find-slot` (next free queue time) and per-post analytics endpoints. API is included on every hosted paid tier. **`type: "draft"` is our approval gate** — Postiz has no native approval workflow.
3. **CreatorFlow needs no API — and the doors are already done.** No developer surface exists, but automations scope to **"all posts and Reels, current + future"** per account, and since 2026-08-03 the three door accounts run live account-wide: spirituality (CREATE, THINK → /create), books (READ, BOOKS → /read), money (RICH, WEALTH → /rich), DM-only, Growth plan 10k DMs/mo. The old "attach keywords per post, 15 min per batch session" step no longer exists. New accounts (orlando, KT, breathwork) are a one-time ~10-minute UI setup each.
4. **Higgsfield is now agent-scriptable; Suno still is not.** Higgsfield shipped an official MCP server (`mcp.higgsfield.ai/mcp`) + CLI (`npx skills add higgsfield-ai/skills`) — Claude drives it directly, burning plan credits. Suno remains UI-only (its API is an invite-only partner program as of July 2026); the batch-a-month-of-beds workflow stays, and third-party "Suno APIs" are account-ban bait — don't.
5. **Claude headless costs $0 marginal on the Max plan.** As of Aug 2026, `claude -p` / Agent SDK runs draw from the subscription pool (Anthropic's metered-credit change was cancelled June 2026). The orchestrator we were going to stand up n8n for is already paid for and already knows the voice playbook. n8n stays the answer for Telegram-fronted personas (`N8N-ALTERNATIVES-RESEARCH.md`) — it is not needed for this pipeline.

---

## 1 · Target architecture, one paragraph

A nightly Claude job on the Mac (launchd, headless) is the conductor: it reads the content calendar, drafts any missing scripts in FRQNCY voice, calls ElevenLabs for voice + timing, renders reels through the engine, runs mechanical QA (duration, loudness, caption frames), uploads to Postiz as **drafts** with per-channel captions and platform settings, and leaves a one-screen morning note. Orlando does the two things no machine substitutes: his face (film day) and his judgment (approve scripts, flip drafts live, make the Monday kill/double calls). CreatorFlow already runs the comment→DM funnel unattended. Weekly, Claude drafts the Monday memo from Postiz analytics + CreatorFlow's link-click export.

**Human time at steady state:** ~2h film day · ~20 min weekly script approval · ~5 min/day flipping drafts live (→ near-zero once auto-schedule with a 3-day veto buffer earns trust) · 15-min Monday review. Everything else runs itself.

---

## 2 · Stage by stage: idea → post

| # | Stage | Today | Automated end-state | Human gate |
|---|-------|-------|--------------------|------------|
| 1 | **Idea / queue** | Calendar rows in `IG-3CHANNEL-PLAN.md` §2 + the 30-day bank | Claude picks next rows, drafts Sunday bank-refill proposals from the source library | Approves refill (Sunday, 5 min) |
| 2 | **Script** | Claude/agent drafts, Orlando approves (batch step 0:00–0:20) | Same, but nightly job pre-drafts; approval moves to one weekly sitting | **Yes — always.** The voice is the brand |
| 3 | **Voice** | Paste into ElevenLabs UI, export, listen-check | API call: `eleven_multilingual_v2` (the PVC-safe model — v3 still degrades clones), stability ≈0.5 / similarity ≈0.75 / speed 0.9, `with-timestamps` → MP3 + timing JSON | Flat-read check rides along with draft review |
| 4 | **Captions** | faster-whisper → `words.json` → `make_ass.py` | ElevenLabs timestamps → 20-line adapter → same `make_ass.py`. Whisper stays only for Orlando's *filmed* pieces | None |
| 5 | **Visuals** | ESA/NASA library via `scenes.txt`; Higgsfield/Runway by hand | Library-first, forever. Runway API (`gen4_turbo` $0.05/s, `gen4.5` $0.12/s, 9:16 native) only when the library has no dense fit; Higgsfield hero frames via MCP in a Claude session | AI-only stays <30% — counted in the manifest, not vibes |
| 6 | **Assemble** | `render.sh <esa_id> <n>` — hardcoded voice/captions/duration | Manifest-driven `produce.sh`: one YAML row per reel (channel, script, bg, slot, ai-flag) → render + loudness-normalise + auto frame-grabs → contact sheet | Eyeballs the contact sheet |
| 7 | **Schedule / post** | Upload by hand in Postiz, paste captions (batch 1:20–1:45) | `schedule.sh`: `/upload` → `POST /posts` as **draft**, per-channel caption variants, IG `post_type: "post"`, TikTok `privacy_level: PUBLIC_TO_EVERYONE` + `video_made_with_ai` when AI visuals, YT `title` = hook line. `find-slot` keeps the 07:00 / 12:30 / 18:00 CET pattern | Flip drafts live — 5 min/day, or auto after 14 clean days |
| 8 | **Funnel** | **Already automated** (2026-08-03): account-wide keyword→DM live on the three doors | Nothing to build. New accounts: 10-min one-time setup. Email gate stays OFF — the subsite is the capture point; teachings live on the site | Open decision: books no longer answers RICH (old reel dead-ends) |
| 9 | **Analytics** | Metricool weekly review, manual | Monday memo auto-drafted from Postiz per-post analytics + CreatorFlow link-click CSV: keyword comments per reel, DM taps, per-format running averages, one kill / one double / one experiment *proposed* | **The call is Orlando's.** Claude proposes, never decides |

---

## 3 · The policy moat — why the human gate is load-bearing

The January 2026 YouTube purge (16 channels, ~35M subscribers, ~$10M/yr — AI narration + repurposed footage + templated scripts at multiple daily uploads) and the July 2026 "unsatisfying content" category define the failure mode precisely. Spiritual-narrative channels were among the casualties. What survives is exactly what the editorial rules already require: a distinct angle per video, human-authored scripts, format variation, a human pass before publish, sane cadence.

- **Own-voice clone needs no YouTube disclosure.** "Cloning one's own voice to create voice overs" is on YouTube's official *not-required* list. AI-assisted scripts likewise.
- **TikTok:** set `video_made_with_ai` on posts whose *visuals* are AI-generated (Runway/Higgsfield). ESA/NASA footage is real footage — no label. Labelled AIGC stays Creator-Rewards-eligible; unlabelled realistic AIGC gets suppressed or removed.
- **Instagram:** the "AI Creator" account label is voluntary and for accounts *primarily* posting AI content — the doors are not (real cosmic footage, Orlando's own voice, human scripts). API publishing is officially supported, 100 posts/day/account — two orders of magnitude above our volume.
- **The two-track model and the <30% ceiling are the compliance architecture**, not a preference. The manifest enforces both as hard checks. Cross-account sameness is the one *new* risk at five-plus accounts on shared source material: never the identical file or caption twice — per-channel hook/caption variants are a schema field, not a habit.
- **EU AI Act Article 50** (synthetic-content transparency) applies from 2026-08-02 — the platform labels above are also our compliance surface. Keep using them honestly.

---

## 4 · Orchestrator: Claude-native, on the Mac

**Recommended.** The engine's assets (ESA sources, beds, fonts) live on the Mac; FFmpeg runs there; the Max plan makes headless runs free. One launchd job, ~02:00 nightly:

```bash
claude -p "Run the FRQNCY reel pipeline for tomorrow per engine/PIPELINE.md. Produce, QA, upload drafts to Postiz, write the morning note to engine/out/MORNING.md. Touch nothing outside engine/." --allowedTools "Bash,Read,Write,Edit" --permission-mode acceptEdits --output-format json >> ~/frqncy-pipeline.log
```

`--output-format json` logs per-run cost (should read $0 on subscription auth). Postiz MCP + Higgsfield MCP additionally wire into *interactive* sessions — "schedule this reel", "make five hero frames" become chat commands. A Cowork scheduled task can own the Monday memo (pure API calls, no local files) — verify `api.postiz.com` is reachable from the cloud sandbox first; if not, the Mac job runs it.

**Not n8n, for this lane.** n8n would sit on a VPS away from the render assets, add a second brain to maintain, and duplicate what the harness/Claude already do — keep it for the Telegram-persona work it was actually chosen for. Revisit only if the Mac stops being always-on (then: harness lane on a small VPS, per the substrate framing).

**Postiz hosted vs self-hosted — the honest constraint.** Self-hosted Postiz posts through *your own* platform apps: Meta works for own accounts without review (add yourself as tester), but **TikTok forces all posts private until your app passes TikTok's audit**, and **YouTube uploads from unverified API projects are locked private** until Google's compliance audit. Hosted Postiz rides on their audited apps. Conclusion: **hosted is the only practical path to public TikTok/YouTube API posting.** Standard $29/mo covers 5 channels (the IG launch wave exactly); Team $39 covers 10 when TikTok/Shorts join. Self-host ($0) is viable for an IG-only phase if the month calls for it.

---

## 5 · Cost at steady state

| Tool | Plan | €/mo (≈$) | Note |
|------|------|-----------|------|
| ElevenLabs | Creator | $22 (+~$9 overage at 30×1k-char scripts/wk on v2) | PVC + commercial licence + timestamps. Flash v2.5 halves burn if quality holds |
| Postiz | Hosted Standard → Team | $29 → $39 | API + MCP on every paid tier. 5 channels now, 10 at wave 1.5 |
| CreatorFlow | Growth (live) | $30 | Already paying. 5 accounts, 10k DMs, link-click tracking |
| Suno | Pro, **batch months only** | $10 when used | Commercial rights persist for tracks made while subscribed → batch ~20 beds, pause |
| Runway API | pay-as-you-go | ~$5–20 | $0.60 per 5s gen4.5 clip; under the 30% ceiling this is seasoning |
| Higgsfield | Starter (optional) | $15 | Via MCP/CLI; skip until hero-frame demand is real |
| Claude | Max (existing) | $0 marginal | The conductor |
| engine / FFmpeg | — | $0 | The workhorse |
| Metricool | **defer** | $0 | API needs Advanced ($53+); Postiz analytics + CreatorFlow clicks cover the Monday memo. Revisit in 4 weeks |

**≈ $86–115/mo full stack; lean floor ≈ $81.** Confirms `CONTENT-ENGINE-SPEC.md`'s $80–180 estimate, at the low end.

---

## 6 · What stays manual forever — and why that's the moat

The film day (his face and presence are the trust layer; the three nevers apply to automation too). Script approval (the voice is the brand — nothing ships without the pass). The flat-read judgment on voice takes. The Suno batch session. CapCut for what the assembler can't do — Shelf Reels, partner clips (CapCut has no API and won't; note its 2025 ToS grants CapCut broad rights over uploaded content — keep drafts local, export finals only). Partner outreach DMs (a human asking a human). And the Monday *decision* — Claude drafts the memo; the kill/double/experiment call is Orlando's.

---

## 7 · Build order — each phase ships value alone

**Phase 1 — timing + manifest (~half day).**
Adapter: ElevenLabs char timestamps → `words.json` (same shape `make_ass.py` already eats):

```python
# el_words.py — chars→words from the with-timestamps response
import json, sys
r = json.load(open(sys.argv[1])); a = r["alignment"]
words, w, t0 = [], "", None
for ch, s, e in zip(a["characters"], a["character_start_times_seconds"], a["character_end_times_seconds"]):
    if ch.strip():
        if t0 is None: t0 = s
        w += ch; t1 = e
    elif w:
        words.append([t0, t1, w]); w, t0 = "", None
if w: words.append([t0, t1, w])
json.dump(words, open(sys.argv[2], "w"))
```

TTS call (one reel):

```bash
curl -s -X POST "https://api.elevenlabs.io/v1/text-to-speech/$VOICE_ID/with-timestamps" -H "xi-api-key: $XI_KEY" -H "Content-Type: application/json" -d "{\"text\": $(jq -Rs . < script.txt), \"model_id\": \"eleven_multilingual_v2\", \"voice_settings\": {\"stability\": 0.5, \"similarity_boost\": 0.75, \"speed\": 0.9}}" > tts.json
jq -r .audio_base64 tts.json | base64 -d > voice.mp3
python3 el_words.py tts.json words.json
```

Then generalise `render.sh` into `produce.sh` driven by a manifest (`reels.csv`: `channel,slot_time,script_file,bg_id,ai_visuals`), add `loudnorm` (EBU R128) and three auto frame-grabs per reel into a contact sheet.

**Phase 2 — the publish rail (~half day).** Hosted Postiz account, connect the 5 launch IG channels, API key into `.env` (Bitwarden). `schedule.sh` per reel:

```bash
MEDIA=$(curl -s -X POST "$POSTIZ_URL/public/v1/upload" -H "Authorization: $POSTIZ_KEY" -F "file=@$OUT.mp4")
curl -s -X POST "$POSTIZ_URL/public/v1/posts" -H "Authorization: $POSTIZ_KEY" -H "Content-Type: application/json" -d @- <<JSON
{"type":"draft","date":"$SLOT_UTC","posts":[{"integration":{"id":"$IG_CHANNEL_ID"},"value":[{"content":$(jq -Rs . < caption.txt),"image":[$MEDIA]}],"settings":{"__type":"instagram","post_type":"post"}}]}
JSON
```

End state of Phase 2: the 2-hour batch session becomes *approve 9 scripts + eyeball a contact sheet + flip drafts*.

**Phase 3 — the nightly conductor (an evening).** `engine/PIPELINE.md` (the runbook Claude executes), launchd plist calling the `claude -p` line from §4, morning note to `engine/out/MORNING.md`.

**Phase 4 — the Monday memo (~1h).** Scheduled task: pull Postiz per-post analytics + CreatorFlow link-click CSV → draft kill/double/experiment against the §6 format grid of `IG-3CHANNEL-PLAN.md`.

**Phase 5 — wave 1.5 (when funnel converts).** CreatorFlow setups for orlando/KT/breathwork (manual, 10 min each) · TikTok + YT Shorts channels in hosted Postiz (Team tier) · per-platform caption variants already in the manifest schema.

---

## 8 · This week, in order

1. ElevenLabs Creator plan + PVC confirmed → generate the week's voices via the API **with timestamps** (kills the Whisper step immediately, before any other build).
2. Build Phase 1 + 2 (one Claude session in the repo — the scripts above are skeletons, not yet run; say the word).
3. Postiz hosted trial → connect the 5 launch IG accounts → API key to Bitwarden + `.env`.
4. Days 1–3 reels through `produce.sh` → `schedule.sh` as drafts → flip live.
5. Resolve the books-RICH dead-end (old reel says "comment RICH"; books now answers READ/BOOKS only — re-caption the reel or add RICH back on books).
6. Decisions Orlando owns: hosted Postiz (rec: yes) · draft-gate vs auto-schedule+veto (rec: drafts until 14 clean days) · Metricool defer (rec: yes) · CreatorFlow email gate stays OFF (rec: yes — the subsite is the capture point).

---

## Sources (verified 2026-08-07)

Postiz API: docs.postiz.com/public-api/introduction · create-post: docs.postiz.com/public-api/posts/create.md · IG/TikTok/YT settings: docs.postiz.com/public-api/providers/ · MCP: postiz.com/mcp · pricing: postiz.com/pricing · TikTok self-host audit constraint: docs.postiz.com/providers/tiktok
ElevenLabs: with-timestamps API: elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps · PVC model support: elevenlabs.io/docs/product-guides/voices/voice-cloning/professional-voice-cloning · v3-not-for-PVC: elevenlabs.io/docs/best-practices/prompting/eleven-v3 · pricing: elevenlabs.io/pricing
CreatorFlow: creatorflow.so/comment-to-dm-instagram (account-wide scope) · creatorflow.so/pricing · no-API: creatorflow.so/vs/zernio
Runway: docs.dev.runwayml.com/guides/pricing (gen4.5 12cr/s, gen4_turbo 5cr/s) · models: docs.dev.runwayml.com/guides/models
Higgsfield MCP/CLI: higgsfield.ai/mcp · higgsfield.ai/creator-hub/help-center/mcp-cli/how-do-i-access-higgsfield-via-cli
Suno: no public API, partner program: digitalmusicnews.com 2026-07-03 · commercial rights: suno.com/pricing
Platform rules: IG publishing limit: developers.facebook.com/docs/instagram-platform/content-publishing · TikTok audit + 15/day: developers.tiktok.com/doc/content-sharing-guidelines · YT quota buckets (2026-06-01): developers.google.com/youtube/v3/revision_history · YT inauthentic content: support.google.com/youtube/answer/1311392 · YT disclosure not-required list (own voice clone): support.google.com/youtube/answer/14328491 · TikTok AIGC labels: newsroom.tiktok.com (2025-11-19) · IG AI Creator label: MediaPost 2026-05-06 · Jan-2026 purge: flocker.tv + TechTimes 2026-07-15
Claude headless: code.claude.com/docs/en/headless · subscription billing status: support.claude.com/en/articles/15036540
