# FRQNCY · Imagery QA Log

Captures user verdicts on per-topic imagery. The signal we extract here
becomes the rules an automated quality program will eventually enforce.

This is a *learning log*, not a static doc. Each round of QA adds rows;
each pattern that emerges gets distilled into the rules section at the
bottom. Eventually the rules become rich enough that an LLM-vision
script can do most of the QA pass automatically and only escalate
ambiguous cases to the user.

---

## Round 1 — 2026-04-29 — Pexels batch + plant-medicine fix

### ✓ Approved (user said "great" / "amazing" / "fantastic")

| Topic | Hero | Closing | Approval signal |
|---|---|---|---|
| `history` | Pexels 30019381 vintage bookshelf | Pexels 14751147 vintage library | "history is great" |
| `oceans` | Pexels 18045518 aerial ocean ripples | Pexels 11795649 clear blue ocean | "oceans is great" |
| `audio` | Pexels 35254141 vinyl wall arrangement | Pexels 21821336 vintage vinyl wall | "audio is great" |
| `forests` | Pexels 35898950 misty forest | Pexels 9407824 aerial misty pines | "forest is fantastic" |
| `nutrition` | Pexels 6632286 nutritious bowl | Pexels 12174224 breakfast bowl | "nutrition is amazing" |
| `cosmos` | Pexels 207529 Milky Way | Pexels 1341279 deep starry sky | "cosmos is great" |
| `astrophysics` | Pexels 31876937 spiral galaxy | Pexels 821644 Andromeda | "astrophysics is great" |

### ✗ Rejected → swapped

| Topic | Original | Why rejected | Replacement |
|---|---|---|---|
| `plant-medicine` | Pexels 5718962 + 35410294 — both candle photography | "plants needs plant pics" — atmospheric mood fit, but the literal subject didn't read as plant medicine | Pexels 105028 marble mortar with fresh herbs · Pexels 28250490 mushroom on vibrant green moss |

---

## Round 2 — 2026-04-29 — Mixed Unsplash + Pexels batch

### ✓ Approved

| Topic | Hero | Closing | Approval signal |
|---|---|---|---|
| `meditation` | Unsplash zen garden, Japan | Unsplash wooden bridge, creek | "good" |
| `yoga` | Unsplash Japanese house | Unsplash resort lounge, mountain | "good" |
| `taoism` | Unsplash mountain low clouds | Unsplash pathway near water | "good" |
| `soul` | Unsplash red-black temple over water | Unsplash rock garden, gravel | "good" |
| `cuisine` | Pexels chopsticks, vegetable bowls | Pexels acai smoothie | "good" |
| `mythology` | Pexels antique books on wood | Pexels grand library, spiral | "great" |

### ⚠ Acceptable but marginal

| Topic | Hero | Closing | Signal |
|---|---|---|---|
| `biodiversity` | Pexels mountain fog with trees | Pexels forest covered in fog | "acceptable" — passable but not great. Both photos are essentially "trees in fog." Subject is *forest*, not *biodiversity* (biodiversity should communicate variety of life — birds, animals, insects, layered ecosystems). Watch this one. |

### ✗ Rejected → swapped

| Topic | Original | Why rejected | Replacement |
|---|---|---|---|
| `mental-health` | Pexels 5895125 + 11754778 — both candles | "redo" — candles are spiritual/ritual mood, don't read as mental health (which is about a person's inner state, calm presence, contemplative space) | Pexels 36852508 silhouette gazing over foggy lake · Pexels 31005853 solitary figure by misty lake |
| `climate` | Pexels 28520994 + 31434495 — both calm ocean | "redo" — calm ocean reads "peaceful seascape," not "climate" (which is about change, weather, atmosphere, melting ice) | Pexels 35264949 Aletsch glacier in Swiss Alps · Pexels 17845895 storm clouds over rural landscape |
| `sleep` | Pexels 6805483 + 36557053 — calm lake at dawn + sunrise meadow | "redo" — *sunrise* is the literal opposite of sleep. Subject said "morning/awakening," topic is "rest/night/bedroom" | Pexels 36710323 minimalist bedroom with mountain vista · Pexels 12277279 bedroom with ambient lighting |

---

## Round 3 — 2026-04-29 — Re-QA of Round 2 swaps

### ✓ Approved (all three Round-2 swaps ratified)

| Topic | Hero | Closing | Approval signal |
|---|---|---|---|
| `mental-health` | Pexels 36852508 silhouette over foggy lake | Pexels 31005853 solitary figure by misty lake | "great" |
| `climate` | Pexels 35264949 Aletsch glacier, Swiss Alps | Pexels 17845895 storm clouds over rural landscape | "great" |
| `sleep` | Pexels 36710323 minimalist bedroom, mountain vista | Pexels 12277279 bedroom with ambient lighting | "great" |

**Rules 6, 7, 8 (added in Round 2) all confirmed by Round 3 ratification:**
- Rule 6 — Don't contradict the topic literally → `sleep` swapped sunrise→bedroom = ✓
- Rule 7 — Inner-state topics prefer human presence → `mental-health` swapped candles→silhouette = ✓
- Rule 8 — Adjacent topics need distinct subjects → `climate` swapped ocean→glacier+storm = ✓

### Proactive fix applied (Rule 7 generalised)

`trauma` had the same candle imagery that failed for `mental-health`. Applied Rule 7 proactively without waiting for user QA: swapped to a solitary-figure-in-forest pair (Pexels 14332272 + 36005015). Logged here for next-round verification — if user approves, the rule is confirmed as predictive (not just descriptive of single cases).

---

## Round 4 — 2026-04-29 — Mixed source batch (8 pages)

### ⚪ Acceptable / "alright" (passable but not enthusiastic)

| Topic | Hero | Closing | Signal |
|---|---|---|---|
| `architecture` | Unsplash wooden window frame | Unsplash Japanese house, black roof | "alright" — passes the bar but doesn't sing. Both subjects are houses/window — could be more architecturally diverse (a famous building exterior + an interior detail). Park for future revisit. |
| `kriya-yoga` | Unsplash SE-Asian temple | Unsplash red temple by lake | "alright" — temples fit yoga lineages but feel generic. Could use imagery more specific to Yogananda/SRF's actual lineage (Mt. Washington headquarters, Encinitas hermitage). Park. |
| `siddha-yoga` | Unsplash pagoda | Unsplash bell in zen garden | "alright" — same issue as kriya-yoga: pan-Asian temple imagery, not specifically Siddha-tradition (Muktananda, Ganeshpuri ashram). Park. |

### ⚙ Topic deleted

| Topic | Reason | Cleanup |
|---|---|---|
| `trauma` | "remove trauma as a topic in the frqncy network" | search.json entry removed (146→145 topics); 3 trauma resources re-tagged to `somatic-therapy`; v2/trauma/ + data/topics/trauma.yaml deleted; entities.json t-trauma stripped; v2/explore-data.json node removed; quote and override entries commented out in draft script with retirement note |

### Pages opened but not commented (presumed pending re-review)

`leisure`, `minimalism`, `breathwork`, `detox` — open these next round if you want them ratified.

---

## Round 4 — addendum — proactive redos requested

User: "detox, minimalism, breathwork and rest need to be redone with more aligned visuals to the topics they represent and according to our needs"

| Topic | Old | Why rejected | Replacement |
|---|---|---|---|
| `detox` | Unsplash ceramic-bath + indoor-pool-forest | Bathtubs read as *spa* / *bath*, not *detox*. Detox's literal subject is cleansing — green juice, herbs, fasting, lemon water. | Pexels 30635724 green juice with ginger + lime · Pexels 4443437 green juice being poured with produce |
| `minimalism` | Local Aman jena-garden + Unsplash Japanese house black roof | Aman is *luxury* aesthetic that happens to be minimalist; not pure minimalism. Topic wants *empty white space, single object, geometric simplicity*. | Pexels 950241 minimalist white architectural interior · Pexels 7587370 minimalist room, white furniture, natural light |
| `breathwork` | Unsplash mountain-fog + mountain-trees | Mountain fog is mood-fit but the literal subject is *mountain*, not *breath*. Breathwork's signature subject is the breath itself — visible exhale, breath vapor, conscious breathing. | Pexels 2242447 woman exhaling vapor in winter forest · Pexels 6745296 man exhaling mist in golden-hour backlight |
| `leisure` | Local Aman sundowner + Aman jena-garden | Aman is luxury *resort dining*, not *leisure & rest*. Topic's signature subject is rest itself — hammock, reading slowly, doing nothing. | Pexels 19107554 woman reading in hammock · Pexels 34999621 woman in hammock reading in forest |

The Aman files remain on disk at `v2/_chrome/imagery/` for future use on a topic where luxury-resort imagery is the actual subject (e.g., a future "retreat" or "hospitality" page).

---

## Round 4 — second addendum — refinements after first redo pass

User: "detox is fine now / minimalism: bottom picture is ugly as fuck and doesnt align with frqncys elegance / breathwork: why is there a woman breathing out smoke? a guy looking away? aren't there pics that show people that breathe? / rest is fine"

| Topic | Old (rejected this round) | Why rejected | Replacement |
|---|---|---|---|
| `minimalism` (closing only) | Pexels 7587370 — minimalist room with white furniture | "ugly as fuck and doesn't align with FRQNCY's elegance" — generic stock interior, not editorial. Hero (Pexels 950241 architectural interior) approved by silence. | **Downloaded local:** `/v2/_chrome/imagery/minimalism-closing.jpg` — corner of modern building over ocean, elegant architectural minimal (Pexels 34189640) |
| `breathwork` (both) | Pexels 2242447 winter exhale + Pexels 6745296 man exhaling at golden hour | "Why is there a woman breathing out smoke? Also a guy looking away? Aren't there pics that show people that breathe?" — exhaled-vapor-as-smoke and an averted face don't read as conscious breathing. The topic is *the practice of breath*, not "people in cold air." | **Downloaded local:** `/v2/_chrome/imagery/breathwork-hero.jpg` (Pexels 32847438) — woman in pranayama posture on stone platform, forest · `/v2/_chrome/imagery/breathwork-closing.jpg` (Pexels 6173713) — woman seated cross-legged, hands on chest+belly, conscious breathing |

✓ `detox` and `leisure` confirmed: "detox is fine now / rest is fine"

---

## New pattern from Round 4 second addendum

11. **Cold-breath imagery doesn't read as breathwork — it reads as winter.** *(Round 4-b)*
    Visible vapor in cold air looks like exhaled smoke or cigarette breath, not a yoga/meditation practice. **For breathwork specifically, prefer pranayama posture imagery (seated cross-legged, hands on chest/belly, eyes closed) over outdoor "breathing visible" candids.** The literal subject must be the *practice* of breath, not the visibility of breath.

12. **Averted faces fail human-presence imagery.** *(Round 4-b)*
    Rule 7 says inner-state topics prefer human presence. Sub-rule: that human should be *present in the practice*, not "looking away." A face turned to the horizon reads as longing/escape, not the topic's interior state. Prefer eyes closed, hands engaged, body in the posture.

13. **"Elegant" closes the gap between "fine stock" and "FRQNCY editorial."** *(Round 4-b)*
    A minimalist white room with furniture passed Rules 1-3 (literal subject, atmosphere, 4K) but failed C4 (FRQNCY-aesthetic alignment) — the user called it "ugly." Architectural exterior with ocean view passed all four. **Lesson: stock-interior shots from real-estate-style photography are below the FRQNCY bar even when they "fit" minimalism literally. Prefer architectural exteriors, single-detail compositions, or museum/gallery interior shots.**

---

## New pattern from Round 4

9. **"Alright" / "acceptable" is a parking signal, not a pass.** *(Round 4)*
   When the user marks a topic "alright" or "acceptable" instead of "good/great/amazing", treat it as: *the bar is met for shipping but the imagery hasn't found its voice for this topic yet.* Park it on a watchlist; revisit when better candidates appear or when the topic earns a hand-curated commission. Do NOT proactively swap "alright" entries — the existing photo isn't wrong, just not great.

10. **Pan-tradition stand-ins fail for tradition-specific topics.** *(Round 4)*
    `kriya-yoga` got generic SE-Asian temple imagery; `siddha-yoga` got a pan-Asian pagoda. The user's "alright" verdict reads as: *the photos look like generic Asian sacred architecture, not the specific lineage this topic is about.* For lineage-specific topics (kriya-yoga = Yogananda/SRF; siddha-yoga = Muktananda/Ganeshpuri; christianity = the specific tradition; buddhism etc.), prefer imagery from that tradition's actual home/iconography. Generic associations are a parking-grade fallback at best.

---

## Watchlist (parked for future revisit)

Topics where current imagery is "acceptable / alright" but hasn't reached "great". Revisit when the right photo appears:

- `biodiversity` (Round 1, "passable but not great") — needs variety-of-life imagery, not just trees in fog
- `architecture` (Round 4, "alright") — could use more architecturally diverse pair
- `kriya-yoga` (Round 4, "alright") — needs Yogananda/SRF-lineage imagery
- `siddha-yoga` (Round 4, "alright") — needs Muktananda/Ganeshpuri-lineage imagery

---

## Auto-QA Round 1 — 2026-04-29 — `scripts/qa_imagery.py` first run

First end-to-end run of the automated quality program (smoke test on 8 bespoke topics, then full run on 140). Model: Claude Opus 4.1 via OpenRouter.

### Real bugs the auto-QA caught that manual QA missed

The smoke test surfaced three topics whose **default** imagery was objectively wrong — the agent flagged them via R6 (literal contradiction) and R1/R3 (wrong subject):

| Topic | Domain default served | Flagged because | Fix shipped |
|---|---|---|---|
| `aquaculture` | rural barn (hero) + vegetable market (closing) — Food & Agriculture default | Aquaculture is *fish farming in water*, not field crops. R6 violation — subject contradicts topic. | Pexels 28738440 floating fish farm aerial · Pexels 10436679 fish farm in blue sea |
| `ar-vr` | circuit board (hero) + Earth from space (closing) — Tech default | AR/VR is about *immersive interfaces / wearables*, not abstract tech motifs. R1/R3 violations. | Pexels 7776217 person in VR headset · Pexels 4389988 young man with VR goggles |
| `astrology` | starry night (hero) + mountain lake (closing) — Metaphysics + Nature defaults | Mountain lake doesn't relate to astrology. R4 violation (abstract topic needs adjacent symbol — natal charts, zodiac wheels, astrologers). | Pexels 20419150 astrology moon-phases wheel · Pexels 7222053 flat-lay astrology tools, natal chart |

These are exactly the kind of bug the auto-program is designed to find: topics that have never been manually QA'd because they weren't in any opened batch, but whose default imagery objectively fails the rubric.

### Disagreement → training signal

**`architecture`** — auto-agent scored 5/5 (approve). User in Round 4 said "alright" (watchlist).

The agent saw an "architectural window detail + temple roofline" pair and judged it as 5/5 editorial-aesthetic. The user judged it as parking-grade. The disagreement teaches the rubric something specific: **C4 (FRQNCY-aesthetic alignment) at 5/5 should require not just "editorial photography" but also "tradition-specific or architecturally-distinctive enough to feel one-of-a-kind."** Generic Asian-temple-rooflines, however well-shot, are 4/5 not 5/5 by user's calibrated standard.

Sharpening for C4 going forward: **5/5 = editorial *and* distinctive (named building, recognisable lineage, signature composition). 4/5 = editorial but generic. 3/5 = clean stock. 1/5 = stock cliché.** Adding this to the rubric for next run.

### Watchlist surfaced (no immediate swap, parked for revisit)

| Topic | Why parked |
|---|---|
| `akashic-records` | Cosmic night sky — passes R4 (adjacent-symbol for abstract topic) but generic |
| `aliens` | Night sky / deep space — passes but doesn't say *aliens* specifically |
| `artificial-intelligence` | Circuit board — passable but tech-default, not AI-distinctive |

These get revisited when better candidates appear or are ratified by next user QA round.

### Provider notes

- Auto-detects `ANTHROPIC_API_KEY` first; falls back to OpenRouter via the harness `keys.json`.
- Uses Claude Opus 4.1 (`anthropic/claude-opus-4.1` on OpenRouter). Each topic ~5-7 seconds (image fetch + scoring). Full 140-topic run ≈ 12-15 minutes.
- HEAD check now retries once on transient failure (Pexels rate-limited `astrophysics` on first run; passed on retry in Round 1.5).

---

## Patterns learned (carry into future rounds)

1. **Literal subject must read first; atmosphere second.**
   The candle photos for `plant-medicine` had the right mood (contemplative, warm-glow) but the subject (a candle) didn't tell a stranger this page is about plant medicine. **Rule: a stranger landing on the page should intuit the topic from the imagery alone within ~1 second.** Atmospheric mood is the second-order requirement.

2. **Strong topic fit when the photo's literal subject is the topic's signature object.**
   - `nutrition` → a food bowl ✓
   - `audio` → vinyl records ✓
   - `cosmos`/`astrophysics` → galaxies ✓
   - `forests` → misty forest ✓
   - `oceans` → ocean ✓
   - `history` → old library ✓
   The subject IS the topic. No abstraction tax for the viewer.

3. **The CSS filter chain (`saturate 0.85 brightness 0.55` + navy gradient) handles the mood layer automatically.**
   Don't pre-select for "dark and atmospheric" — Unsplash and Pexels editorial photography already passes that bar after the filter. Pick for *subject clarity* and let the chrome do the mood lifting.

4. **Ambiguous metaphysical/abstract topics need adjacent-symbol imagery.**
   For topics without a clear literal subject (`vibration`, `consciousness`, `synchronicity`, `akashic-records`), the next best thing is a *culturally-associated symbol* — a tuning fork for vibration, a clock face for synchronicity, an old illuminated manuscript for akashic-records. Avoid "anything atmospheric" — it reads as filler.

5. **Hero–closing pair should relate but not duplicate.**
   Same subject family, different composition. A spiral galaxy hero pairs with an Andromeda closing (both galaxies, distinct compositions). Don't pair "spiral galaxy" with "spiral galaxy at slightly different angle."

6. **Avoid imagery that contradicts the topic literally.** *(Round 2)*
   `sleep` was given a *sunrise* meadow — sunrise is the antonym of sleep. Even if the photo is beautiful and atmospheric, it actively reads against the topic. **Rule: if you can name the subject in one word and that word contradicts the topic, the photo fails — no matter how good it looks.**

7. **For abstract/inner-state topics, prefer human-presence imagery over inanimate-symbol imagery.** *(Round 2)*
   `mental-health` with a candle = atmospheric but cold; with a contemplative human figure = warm and topic-recognizable. Same for `presence`, `mindfulness`, `prosperity-mindset` — when the topic is about a person's interior, a human silhouette doing the action lands more honestly than an object that *symbolises* the action.

8. **Topic ≠ subject in adjacent themes.** *(Round 2)*
   `climate` ≠ `oceans`. `biodiversity` ≠ `forests`. Where two topics overlap in a domain, give each a *distinct* subject signature — climate gets weather/glaciers/atmospheric change; oceans gets the ocean itself. Otherwise the network reads repetitive.

---

## Quality criteria (refined from Round 1 feedback)

A photo passes QA only if it scores at least 4/5 on each criterion.
The four user-validated criteria, in order of weight:

### C1 · Literal topic readability (HIGHEST WEIGHT)

A first-time viewer can name the topic from the image alone in ~1 second.

- 5/5 — the image's primary subject *is* the topic
- 4/5 — the image's primary subject is a canonical association (shelves of books → library/history; candle → contemplation, not a topic in itself)
- 3/5 — requires squinting; topic-adjacent but ambiguous
- 1-2/5 — generic stock that could caption anything

### C2 · Atmospheric mood

The image holds gracefully under the navy gradient + filter chain.

- 5/5 — looks better filtered than raw (most Unsplash/Pexels editorial)
- 3/5 — looks fine filtered, slightly washed-out raw
- 1/5 — clashes with navy (warm orange-saturated, neon, harsh midday)

### C3 · 4K technical quality

Verified `?w=3840` returns HTTP 200 with sharp output. Non-negotiable.

### C4 · FRQNCY-aesthetic alignment

Editorial, not stock; intentional, not cheesy; quiet, not loud.

- 5/5 — editorial photography in the Aman/Bulgari/Kinfolk register
- 3/5 — clean stock that doesn't undermine
- 1/5 — over-saturated wedding-photographer vibes, posed selfie energy

### C5 · Hero–closing pair coherence

Hero and closing should relate without cloning.

---

## Future: the automated quality program

Once this log has ~30 rounds of feedback, the rules above will be sharp
enough that a single agent run can do most QA. Architecture sketch:

```
scripts/qa_imagery.py <slug-or-all>
  for each override:
    1. Fetch the rendered HTML page
    2. Extract the hero and closing image URLs
    3. HEAD each at ?w=3840 — must return 200 (C3 — automated)
    4. Pull a thumbnail
    5. Send to a vision-capable LLM with:
        - The topic slug + label + description
        - The four criteria above (C1-C4) with rubric
        - The hero+closing pair
    6. Receive scores per criterion
    7. Flag any image scoring <4 on C1 (literal readability) — the
       criterion the user weights heaviest based on the plant-medicine
       fix
    8. Print a per-topic report; user reviews flagged-only entries
```

Each subsequent round of human QA adds confirmation/correction signal
that tunes the rubric. By the time the log has ~30-50 rounds, the
agent is doing 90% of the work and the user is only ratifying edge
cases.

---

## How to use this log

When user QA's an imagery batch:

1. Add a new round section at the top with date.
2. Move approvals into the ✓ table with the exact approval signal in quotes.
3. Move rejections into the ✗ table with the user's reason and the swap.
4. Distill any new pattern into the "Patterns learned" section.
5. Sharpen any criterion in "Quality criteria" if a new dimension shows up.
6. Don't delete old rounds — the longitudinal record is what trains the eventual auto-QA.

---

*Started 2026-04-29. Update with every QA round.*
