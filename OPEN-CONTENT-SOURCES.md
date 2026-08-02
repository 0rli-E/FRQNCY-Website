---
name: open-content-sources
title: FRQNCY Open-Content Sources (freely-usable video & audio)
type: reference
generated: 2026-07-18
provenance: 10-agent web sweep; every licence checked on its source page
data_files:
  - frqncy-open-content.json         # master: 100 items, full licence fields, sorted by relevance_rank
  - frqncy-open-content-music.json   # music.json-shaped subset (commercial-usable audio)
  - frqncy-open-content-media.json   # media.json-shaped subset (source collections / channels)
tiers:
  free: "Public Domain / CC0 / royalty-free — commercial reuse OK, NO attribution. Safe to host/remix/monetise."
  credit: "CC BY / CC BY-SA / royalty-free-with-credit — commercial reuse OK WITH the attribution line (in the JSON)."
  restricted: "NonCommercial / NoDerivatives / unconfirmed — LINK or EMBED only. Do not host, remix, or monetise."
commercial_note: "FRQNCY is a commercial platform. Prefer `free` and `credit`. Treat every `restricted` item as link-only unless a separate licence is obtained."
---

# FRQNCY — Open-Content Sources

Freely-usable **video & audio** aligned to FRQNCY, gathered by a 10-agent sweep across the open-content internet (Internet Archive, LibriVox, Freesound, Free Music Archive, Musopen, NASA/ESA, NOAA/NPS/USFWS, Wikimedia Commons, Pexels/Pixabay/Mixkit, and more). Every licence was checked on the source page. **Not wired into the live site** — this is a sourcing index for future work on the Media pillar.

**Any agent working with FRQNCY media content: read this file, then load `frqncy-open-content.json` for the full structured data (each item has url, exact licence, reuse tier, attribution string, FRQNCY topics, and a note).**

## Counts

100 sources — 🟢 49 free reuse · 🟡 31 reuse + credit · 🔴 20 link only. By format: 36 audio · 10 video · 54 collections.

## How to use this (for agents)

1. **Pick by tier for the job.** Hosting/remixing/monetising → filter `tier == free` (or `credit` and include the `attribution` string). Only *pointing* to something → `restricted` is fine.
2. **Whole collections = the deep wells.** `format == "collection"` items are archives/channels/hubs; that's where "all the data" lives — send users there to browse.
3. **Re-verify per-file sources.** Freesound and Wikimedia Commons licences vary per file. The tier here reflects the checked item, but confirm on the file page before hosting.
4. **Map into existing content files** using the shaped subsets: music → `music.json` schema (`frqncy-open-content-music.json`), source collections → `media.json` schema (`frqncy-open-content-media.json`). Set `picked_in` when a FRQNCY pick.
5. **Editorial guardrails (per CLAUDE.md / voice playbook):** frequency-healing claims (432/528 Hz, Solfeggio, binaural) are contested — frame as experiments, not prescriptions. US-gov footage (NASA/NOAA/USFWS/NPS/USDA) is public domain but some clips carry third-party *music* that isn't — the picture is free, the soundtrack may not be.

## Top 16 — start here

- 🟢 **[A Universe of Sound — Chandra sonification hub](https://chandra.si.edu/sound/)** — Flagship hub — black holes, nebulae and star clusters turned into haunting, meditative audio. Ideal ambient backing. `Public Domain (NASA)` · _collection_
- 🟢 **[Straylight Drones — 101 atmospheric drones](https://freemusicarchive.org/music/John_Bartmann/100-ambient-atmospheric-soundtracks-straylight-drones-collection)** — 101 × ~4-min drones dedicated to the public domain — remix/host/redistribute with zero constraints. Ideal practice beds. `CC0` · _collection_
- 🟢 **[Musopen — public-domain classical library](https://musopen.org/music/)** — 100k+ royalty-free recordings with a 'relaxing' mood filter (Bach, Satie, Debussy, Chopin). A few tracks are CC BY — check the icon. `Public Domain / CC0 (per recording)` · _collection_
- 🟢 **[The Upanishads (collection)](https://librivox.org/group/568)** — Whole collection — Kena, Katha, Isha, Chandogya, Brihadaranyaka, Prasna and more. `Public Domain` · _collection_
- 🟢 **[Public Domain Review — film collection](https://publicdomainreview.org/collections/film/)** — Curated early cinema + art films (dreams, mysticism, dance, natural wonder) — a ready scouting index. `Public Domain` · _collection_
- 🟢 **[Public Domain Soundtrack Music: Album One](https://freemusicarchive.org/music/John_Bartmann/Public_Domain_Soundtrack_Music_Album_One)** — CC0 cinematic/ambient cues, freely hostable and remixable. `CC0` · _collection_
- 🟡 **[klankbeeld field-recording packs (curator)](https://freesound.org/people/klankbeeld/packs/)** — Prolific field-recordist; entire long-form forest/wind/storm/water catalogue is uniformly CC BY 4.0. `CC BY 4.0` · _collection_
- 🟡 **[Incompetech — Kevin MacLeod library](https://incompetech.com/music/royalty-free/music.html)** — Vast searchable library incl. explicit 'Meditation Impromptu' cues. Commercial + remix OK with one credit line. `CC BY 4.0` · _collection_
- 🟡 **[Chris Zabriskie — 'Cylinders' & ambient catalog](https://freemusicarchive.org/music/Chris_Zabriskie/)** — Minimal, meditative piano/synth loops — uncliched, fully reusable commercially. `CC BY 4.0` · _collection_
- 🟡 **[Scott Buckley — ambient / cinematic library](https://www.scottbuckley.com.au/library/genre/ambient/)** — High-production ambient/'calm'-mood pieces, commercially usable with credit. `CC BY 4.0` · _collection_
- 🟢 **[NASA Data Sonifications (master hub)](https://www.nasa.gov/data-sonifications/)** — Central index to 22+ Chandra + Hubble + Webb sonifications — deep well of unique cosmic audio. `Public Domain (NASA)` · _collection_
- 🟢 **[Tao Te Ching / Daodejing](https://librivox.org/daodejing-by-laozi/)** — Foundational Taoist text on wu-wei and the Way. PD in the USA (verify jurisdiction elsewhere). `Public Domain` · _audio_
- 🟡 **[Blender Open Movies (Sintel, Cosmos Laundromat, Spring…)](https://studio.blender.org/films/)** — Beautiful animation fully licensed for remix — rich abstract/mythic visuals. `CC BY (3.0/4.0 per film)` · _collection_
- 🟡 **[ccMixter — 'free for commercial use' section](http://dig.ccmixter.org/free)** — Use the /free area (attribution-only). The general remix listings mix in CC BY-NC. `CC BY 3.0/4.0 (this section)` · _collection_
- 🟡 **[Free Music Archive — Ambient genre](https://freemusicarchive.org/genre/Ambient/)** — Deep ambient/drone pool. FILTER to CC0/CC BY for commercial reuse — avoid CC BY-NC/ND. Each track page shows its license. `Mixed CC (per track)` · _collection_
- 🟡 **[Internet Archive Netlabels (ambient / drone / space)](https://archive.org/details/netlabels)** — Enormous CC netlabel archive. Filter to CC BY / CC BY-SA / CC0; avoid NC/ND for commercial reuse. `Mixed CC (per release)` · _collection_

## By theme

### Cosmos — sonifications
- 🟢 **[A Universe of Sound — Chandra sonification hub](https://chandra.si.edu/sound/)** — Flagship hub — black holes, nebulae and star clusters turned into haunting, meditative audio. Ideal ambient backing. `Public Domain (NASA)` · _collection_
- 🟢 **[NASA Data Sonifications (master hub)](https://www.nasa.gov/data-sonifications/)** — Central index to 22+ Chandra + Hubble + Webb sonifications — deep well of unique cosmic audio. `Public Domain (NASA)` · _collection_
- 🟢 **[Perseus black hole 'sound' (+ remix)](https://www.nasa.gov/universe/new-nasa-black-hole-sonifications-with-a-remix/)** — The actual pressure waves of a supermassive black hole scaled to audible tones — an otherworldly drone. `Public Domain (NASA)` · _audio_
- 🟢 **[Cosmic Cliffs (Carina) sonification](https://www.nasa.gov/data-sonifications/)** — Webb's 'cosmic cliffs' as layered sound — rich, immersive listening. `Public Domain (NASA)` · _audio_

### Music — reusable (CC0)
- 🟢 **[Straylight Drones — 101 atmospheric drones](https://freemusicarchive.org/music/John_Bartmann/100-ambient-atmospheric-soundtracks-straylight-drones-collection)** — 101 × ~4-min drones dedicated to the public domain — remix/host/redistribute with zero constraints. Ideal practice beds. `CC0` · _collection_
- 🟢 **[Public Domain Soundtrack Music: Album One](https://freemusicarchive.org/music/John_Bartmann/Public_Domain_Soundtrack_Music_Album_One)** — CC0 cinematic/ambient cues, freely hostable and remixable. `CC0` · _collection_

### Music — reusable (PD)
- 🟢 **[Musopen — public-domain classical library](https://musopen.org/music/)** — 100k+ royalty-free recordings with a 'relaxing' mood filter (Bach, Satie, Debussy, Chopin). A few tracks are CC BY — check the icon. `Public Domain / CC0 (per recording)` · _collection_
- 🟢 **[Bach — Cello Suites BWV 1007–1012](https://musopen.org/music/4008-6-cello-suites-bwv-1007-1012/)** — Touchstone of meditative depth + mathematical structure. Verify the specific recording's license icon. `Public Domain` · _audio_

### Wisdom traditions — PD audio
- 🟢 **[The Upanishads (collection)](https://librivox.org/group/568)** — Whole collection — Kena, Katha, Isha, Chandogya, Brihadaranyaka, Prasna and more. `Public Domain` · _collection_
- 🟢 **[Tao Te Ching / Daodejing](https://librivox.org/daodejing-by-laozi/)** — Foundational Taoist text on wu-wei and the Way. PD in the USA (verify jurisdiction elsewhere). `Public Domain` · _audio_
- 🟢 **[Bhagavad Gita (The Song Celestial)](https://librivox.org/bhagavad-gita-by-sir-edwin-arnold/)** — Krishna–Arjuna dialogue on duty, detachment, the eternal Self, in poetic verse. `Public Domain` · _audio_
- 🟢 **[I Ching — The Book of Changes](https://librivox.org/yi-king-i-ching-the-book-of-changes-by-confucius)** — The ancient oracle of change and complementarity. `Public Domain` · _audio_
- 🟢 **[Sermons of a Buddhist Abbot](https://librivox.org/sermons-of-a-buddhist-abbot-by-soyen-shaku/)** — Early Zen brought West by the first Zen master to teach in America. `Public Domain` · _audio_
- 🟢 **[The Cloud of Unknowing](https://librivox.org/the-cloud-of-unknowing-by-anonymous)** — Classic English apophatic mysticism on approaching the divine through unknowing. `Public Domain` · _audio_
- 🟢 **[The Interior Castle](https://librivox.org/the-interior-castle-by-st-teresa-of-avila/)** — The soul's seven mansions toward union — a summit of contemplative psychology. `Public Domain` · _audio_
- 🟢 **[The Meditations of Marcus Aurelius](https://librivox.org/the-meditations-of-the-emperor-marcus-aurelius-antoninus-by-marcus-aurelius/)** — The Stoic emperor's private notes on mortality, presence, equanimity. `Public Domain` · _audio_
- 🟢 **[The Prophet](https://librivox.org/the-prophet-by-kahlil-gibran/)** — Prose-poem counsels on love, work, freedom. PD in the US; verify jurisdiction elsewhere. `Public Domain (US)` · _audio_
- 🟢 **[The Dhammapada](https://librivox.org/the-dhammapada-translated-by-f-max-mueller/)** — The Buddha's verse teachings on mind, craving, the path. `Public Domain` · _audio_
- 🟢 **[The Poetry of Sa'di — a selection](https://archive.org/details/poetry_of_sadi_1507_librivox)** — Verse from the great Persian Sufi poet. `Public Domain` · _audio_
- 🟢 **[The Rubáiyát of Omar Khayyám](https://librivox.org/the-rubaiyat-of-omar-khayyam-by-omar-khayyam-3/)** — Persian quatrains on impermanence and the mystery of existence. `Public Domain` · _audio_

### Film & video — reusable
- 🟢 **[Public Domain Review — film collection](https://publicdomainreview.org/collections/film/)** — Curated early cinema + art films (dreams, mysticism, dance, natural wonder) — a ready scouting index. `Public Domain` · _collection_
- 🟡 **[Blender Open Movies (Sintel, Cosmos Laundromat, Spring…)](https://studio.blender.org/films/)** — Beautiful animation fully licensed for remix — rich abstract/mythic visuals. `CC BY (3.0/4.0 per film)` · _collection_
- 🟡 **[Wikimedia Commons — videos of meditation](https://commons.wikimedia.org/wiki/Category:Videos_of_meditation)** — On-topic hub of freely-licensed practice footage; copy exact license per file. `Free licenses only (per file)` · _collection_
- 🟢 **[Prelinger Archives (ephemeral films)](https://archive.org/details/prelinger)** — Thousands of films explicitly cleared to download, use, reproduce and make derivatives. `Public Domain / CC (varies)` · _collection_
- 🟢 **[Dream of a Rarebit Fiend (1906)](https://publicdomainreview.org/collection/dream-of-a-rarebit-fiend-1906/)** — Early film visualizing dreams/altered states — apt for consciousness themes. `Public Domain` · _video_
- 🟢 **[LoC — National Screening Room](https://www.loc.gov/collections/national-screening-room/)** — Hundreds of historic downloadable US films; check the per-item rights field. `Mostly Public Domain (per item)` · _collection_
- 🟡 **[Tibetan monks chanting, Drepung Monastery](https://commons.wikimedia.org/wiki/File:Monks_chanting,_Drepung_monastery,_Tibet.webm)** — Authentic chanting footage. Confirm exact CC license on the Commons file page. `CC (verify on file page)` · _video_
- 🟢 **[Denishawn dance film (c. 1916)](https://archive.org/details/denishawn-dance-film)** — Early footage of a foundational American movement/dance school. `Public Domain` · _video_
- 🟢 **[Le Voyage dans la Lune (1902)](https://archive.org/details/le-voyage-dans-la-lune-1902-georges-melies)** — Seminal dreamlike voyage-to-the-moon film for wonder-themed montage. `Public Domain` · _video_
- 🟢 **[The Cheese Mites (1903)](https://publicdomainreview.org/collection/the-cheese-mites-1903/)** — Pioneering microscopic nature film — the hidden living micro-world. `Public Domain` · _video_
- 🟢 **[LoC — Public Domain Films (National Film Registry)](https://www.loc.gov/free-to-use/public-domain-films-from-the-national-film-registry/)** — LoC-verified PD, explicitly 'free to use and reuse'. `Public Domain` · _collection_

### Nature soundscapes
- 🟡 **[klankbeeld field-recording packs (curator)](https://freesound.org/people/klankbeeld/packs/)** — Prolific field-recordist; entire long-form forest/wind/storm/water catalogue is uniformly CC BY 4.0. `CC BY 4.0` · _collection_
- 🟢 **[Dawn chorus birdsong — 8:51](https://freesound.org/people/squashy555/sounds/573080/)** — CC0 4am dawn chorus — morning-practice ambience, no attribution burden. `CC0` · _audio_
- 🟢 **[Humpback whale song (NOAA)](https://archive.org/details/WhaleSong_928)** — US-gov PD; hypnotic ocean soundscape for sound-healing beds. `Public Domain` · _audio_
- 🔴 **[Natural Sounds Field Recording Archive (16 scenes)](https://archive.org/details/NaturalSoundsFieldRecordingArchive)** — NonCommercial + ShareAlike — non-monetized layering only. `CC BY-NC-SA 3.0` · _collection_
- 🟡 **[Atlantic ocean waves — 4:40](https://freesound.org/people/tim.kahn/sounds/197714/)** — Clean natural surf; loops well for sound baths. `CC BY 4.0` · _audio_
- 🟡 **[Forest wind — 109 min](https://freesound.org/people/klankbeeld/sounds/276478/)** — Nearly two hours of seamless forest wind. `CC BY 4.0` · _audio_
- 🟡 **[Seamless rain loop — 10 min](https://freesound.org/people/qubodup/sounds/212580/)** — Purpose-built loop for continuous sleep/focus playback. `CC BY 3.0` · _audio_
- 🟡 **[Storm in the woods (6 bft) — 33 min](https://freesound.org/people/klankbeeld/sounds/185290/)** — Immersive wind-in-woods storm; loop-friendly grounding. `CC BY 4.0` · _audio_
- 🟡 **[Winter field ambience — 68 min](https://freesound.org/people/klankbeeld/sounds/553174/)** — Long, loopable quiet winter field — sound-bath / sleep bed. `CC BY 4.0` · _audio_

### Music — credit (CC BY)
- 🟡 **[Incompetech — Kevin MacLeod library](https://incompetech.com/music/royalty-free/music.html)** — Vast searchable library incl. explicit 'Meditation Impromptu' cues. Commercial + remix OK with one credit line. `CC BY 4.0` · _collection_
- 🟡 **[Chris Zabriskie — 'Cylinders' & ambient catalog](https://freemusicarchive.org/music/Chris_Zabriskie/)** — Minimal, meditative piano/synth loops — uncliched, fully reusable commercially. `CC BY 4.0` · _collection_
- 🟡 **[Scott Buckley — ambient / cinematic library](https://www.scottbuckley.com.au/library/genre/ambient/)** — High-production ambient/'calm'-mood pieces, commercially usable with credit. `CC BY 4.0` · _collection_
- 🟡 **[Kai Engel — neoclassical / ambient catalog](https://freemusicarchive.org/music/Kai_Engel/)** — Introspective piano/chamber ambient. NOTE: new work post-Jul 2025 is leaving CC — pre-2025 albums stay CC. `CC BY 4.0 (pre-Jul 2025 releases)` · _collection_
- 🟡 **[Kevin MacLeod — Complete Collection (108 tracks, bulk DL)](https://archive.org/details/Incompetech)** — Bulk-downloadable mirror (OGG+MP3) for hosting/redistribution. `CC BY 3.0` · _collection_
- 🟡 **[Satie — Gymnopédie No. 1 (MacLeod recording)](https://freemusicarchive.org/music/Kevin_MacLeod/Classical_Sampler/Gymnopedie_No_1/)** — The canonical reflective piano piece, freely reusable via the CC recording. `CC BY (recording) / PD (composition)` · _audio_

### Music — mixed pools
- 🟡 **[ccMixter — 'free for commercial use' section](http://dig.ccmixter.org/free)** — Use the /free area (attribution-only). The general remix listings mix in CC BY-NC. `CC BY 3.0/4.0 (this section)` · _collection_
- 🟡 **[Free Music Archive — Ambient genre](https://freemusicarchive.org/genre/Ambient/)** — Deep ambient/drone pool. FILTER to CC0/CC BY for commercial reuse — avoid CC BY-NC/ND. Each track page shows its license. `Mixed CC (per track)` · _collection_
- 🟡 **[Internet Archive Netlabels (ambient / drone / space)](https://archive.org/details/netlabels)** — Enormous CC netlabel archive. Filter to CC BY / CC BY-SA / CC0; avoid NC/ND for commercial reuse. `Mixed CC (per release)` · _collection_
- 🟡 **[Wikimedia Commons — Gregorian chant (audio)](https://commons.wikimedia.org/wiki/Category:Audio_files_of_Gregorian_chant)** — Sacred vocal chant from the Western contemplative tradition. `Mixed PD / CC BY-SA (per file)` · _collection_
- 🟡 **[Wikimedia Commons — singing bowls (audio)](https://commons.wikimedia.org/wiki/Category:Singing_bowls)** — Authentic singing-bowl recordings. Verify each file page's license. `Mixed PD / CC0 / CC BY-SA (per file)` · _collection_

### Frequencies & tones
- 🟢 **[432 Hz sustained tone — 5 min](https://freesound.org/people/The_Sample_Workshop/sounds/806285/)** — CC0 full-length 432 Hz tone — session-ready, redistributable. `CC0` · _audio_
- 🟢 **[432 Hz single-cycle tone (loopable)](https://freesound.org/people/steaq/sounds/316818/)** — CC0 — loop indefinitely into a tuning drone; fully free to host/remix. `CC0` · _audio_
- 🟢 **[Sine sweep 20 Hz–40 kHz (frequencies announced)](https://freesound.org/people/gregconquest/sounds/812237/)** — CC0 reference sweep — extract any individual pure tone from it. `CC0` · _audio_
- 🟢 **[White / pink / brown noise — 10 min each](https://archive.org/details/TenMinutesOfWhiteNoisePinkNoiseAndBrownianNoise)** — PD 24-bit noise generators, loopable, for focus/sleep masking. `Public Domain` · _audio_
- 🟡 **[528 Hz pure sine reference tone](https://freesound.org/people/miksmusic/sounds/676725/)** — Clean 528 Hz 'love frequency' tone. Frame the claim as an experiment — it's contested. `CC BY 4.0` · _audio_
- 🔴 **[Binaural beats — alpha→delta→back, 70 min](https://freesound.org/people/WIM/sounds/676878/)** — NonCommercial — non-monetized use only. `CC BY-NC 4.0` · _audio_
- 🔴 **[Solfeggio 9-tone set (174–963 Hz), 10 min each](https://archive.org/details/SolfeggioFrequencies-PureSineWaves-HealingTones)** — NonCommercial — cannot use in monetized content. Better to generate your own tones from the CC0 sine sources above. `CC BY-NC 3.0` · _audio_
- 🔴 **[SolTones — Solfeggio set, ~5 min each](https://archive.org/details/SolTones)** — NonCommercial + ShareAlike — not for commercial use. `CC BY-NC-SA 3.0` · _audio_

### Cosmos — video
- 🟢 **[NASA Image and Video Library](https://images.nasa.gov/)** — NASA's official searchable archive + open API — the primary well for PD cosmic footage/audio. Logo restricted; some items flag third-party content. `Public Domain (NASA)` · _collection_
- 🟢 **[Black hole plunge visualization (up to 8K / 360)](https://svs.gsfc.nasa.gov/14576/)** — Hypnotic supercomputer flight into a supermassive black hole. `Public Domain (NASA)` · _video_
- 🟢 **[NASA Scientific Visualization Studio galleries](https://svs.gsfc.nasa.gov/gallery/the-galleries/)** — Thousands of downloadable 4K/8K cosmic & Earth-science movies to mine. `Public Domain (NASA)` · _collection_
- 🟡 **[ESA/Webb video archive — zooms](https://esawebb.org/videos/archive/category/zooms/)** — Cinematic zoom flythroughs into Webb's nebulae/deep fields — premium awe footage. `CC BY 4.0` · _collection_
- 🟡 **[ESA/Hubble video archive — JWST](https://esahubble.org/videos/archive/category/jwst/)** — Professionally produced Webb pans/zooms/flythroughs curated for reuse. (Note: esa.int-hosted videos default to the stricter CC BY-SA 3.0 IGO.) `CC BY 4.0` · _collection_
- 🟢 **[Merging black holes — gravitational-wave sim (8K)](https://svs.gsfc.nasa.gov/13197/)** — Warping spacetime of two spiraling black holes — abstract, flowing, meditative. `Public Domain (NASA)` · _video_
- 🟡 **[Zoom into the Horsehead Nebula (Webb)](https://esawebb.org/videos/weic2411c/)** — Slow three-telescope descent into deep space; downloadable up to 4K. `CC BY 4.0` · _video_

### Guided practice — reusable
- 🟢 **[Following the Breath & Observing the Body](https://archive.org/details/FollowingTheBreathAndObservingTheBodyMeditation)** — PD breath-and-body-scan practice framed as observation, not prescription. `Public Domain` · _audio_
- 🟢 **[The Hindu-Yogi Science of Breath (LibriVox)](https://archive.org/details/hindu_yogi_science_breath_mj_1509_librivox)** — Classic PD pranayama text with practical exercises — usable as sourced breathwork material/excerpts. `Public Domain` · _audio_
- 🟢 **[The New Science of Controlled Breathing (LibriVox)](https://archive.org/details/thenewscienceofcontrolledbreathing_vol1and2_2310_librivox)** — PD instructional breathing text for a credibility-first explainer/remix. `Public Domain` · _audio_
- 🟢 **[The Power of Concentration (LibriVox)](https://archive.org/details/power_concentration_0810_librivox)** — PD attention/concentration exercises — frame as experiments. `Public Domain` · _audio_
- 🟡 **[Beginner's Guide to Meditation (4-track set)](https://archive.org/details/beginnersguidetomeditation_202004)** — Explicitly open-sourced (editable source files) — ideal for commercial remix with credit. `CC BY 4.0` · _audio_
- 🟡 **[Deep Sleep Meditation — 28 min](https://archive.org/details/DeepSleepMeditation)** — Rare commercially-remixable guided sleep/relaxation practice. `CC BY 3.0` · _audio_

### Nature & ecology video
- 🟢 **[NASA SVS — Carbon & Climate gallery](https://svs.gsfc.nasa.gov/gallery/carbon-gallery/)** — Data-driven carbon-cycle, forest-disturbance, phytoplankton visualizations. `Public Domain (US Gov)` · _collection_
- 🟢 **[NOAA Fisheries video gallery](https://videos.fisheries.noaa.gov/)** — Corals, sustainable fisheries, habitat restoration. `Public Domain (US Gov)` · _collection_
- 🟢 **[NOAA Ocean Exploration multimedia (deep sea)](https://oceanexplorer.noaa.gov/multimedia/)** — ROV footage of deep-sea corals, vents, unseen biodiversity — awe with credibility. `Public Domain (US Gov)` · _collection_
- 🟢 **[NOAA Ocean Today (video collection)](https://oceantoday.noaa.gov/)** — Hundreds of short credible ocean-science films. A few 'noted' items may differ — check. `Public Domain (US Gov)` · _collection_
- 🟢 **[NPS Nature video gallery](https://www.nps.gov/portals/nature/videos.htm)** — 'Outside Science', natural-sounds, E.O. Wilson biodiversity talks. Verify per-video for third-party inserts. `Public Domain (US Gov)` · _collection_
- 🟢 **[USDA Forest Service — Photo & Video Center / Vimeo](https://vimeo.com/forestservice)** — Forest-ecosystem, watershed, fire-ecology, stewardship footage. Check per-video for embedded licensed music before extracting audio. `Public Domain (US Gov)` · _collection_
- 🟢 **[USFWS B-Roll videos](https://www.fws.gov/library/collections/b-roll-videos)** — Pro wildlife/refuge b-roll. CAVEAT: some productions contain separately-licensed music — extracting audio needs its own license. `Public Domain (US Gov)` · _collection_
- 🟡 **[Wikimedia Commons — videos of nature](https://commons.wikimedia.org/wiki/Category:Videos_of_nature)** — Timelapses, wildlife, landscapes. Commons hosts only free licenses; verify + attribute per file. `Free licenses only (per file)` · _collection_

### Podcasts — restricted
- 🔴 **[AudioDharma (podcast feed)](https://podcasts.apple.com/us/podcast/audiodharma/id75519213)** — Meditation-pillar gold, but NC + ND — share whole, no clips/edits, non-commercial. `CC BY-NC-ND 4.0` · _collection_
- 🔴 **[Oxford Podcasts — Creative Commons episodes](https://podcasts.ox.ac.uk/creative-commons-episodes)** — ~5,700 CC lectures incl. 'Is Happiness Overrated?', Buddhist ethics/meditation. NC — non-commercial only. `CC BY-NC-SA 2.0 UK` · _collection_
- 🔴 **[Democracy Now!](https://www.democracynow.org/podcast)** — Independent news, strong ecology/social-systems coverage. NC + ND — reshare whole, no edits. `CC BY-NC-ND` · _collection_

### Guided practice — restricted
- 🔴 **[AudioDharma — talks & guided meditations](https://www.audiodharma.org/)** — Deep catalog; NC + ND — embed/link only. `CC BY-NC-ND 4.0` · _collection_
- 🔴 **[Dharma Seed — dharma talks & guided sits](https://dharmaseed.org/talks/)** — Huge credible library — but NC + ND: embed/link only, no commercial use or edits. `CC BY-NC-ND 4.0` · _collection_
- 🔴 **[Free Buddhist Audio — talks & meditations](https://www.freebuddhistaudio.com/creativecommons)** — 5,000+ talks. Treat as NC+ND / embed-only; confirm exact version before any reuse. `CC BY-NC-ND (version unconfirmed)` · _collection_
- 🔴 **[The Free Mindfulness Project](https://www.freemindfulness.org/download)** — Well-curated breathing spaces/body scans — NC: non-commercial only. `CC BY-NC-SA 3.0` · _collection_
- 🔴 **[UCLA Mindful (MARC) guided meditations](https://www.uclahealth.org/uclamindful/free-guided-meditations)** — Research-grade beginner meditations — NC + ND: embed only. `CC BY-NC-ND 4.0` · _collection_

### Open lectures — restricted (NC)
- 🔴 **[MIT OCW — 9.13 The Human Brain](https://ocw.mit.edu/courses/9-13-the-human-brain-spring-2019/video_galleries/lecture-videos/)** — How the brain builds perception/cognition/self. NC + SA. `CC BY-NC-SA 4.0` · _collection_
- 🔴 **[Open Yale — PHIL 176 Death](https://oyc.yale.edu/death/phil-176)** — Rigorous course on mortality, identity, the mind. NC + SA. `CC BY-NC-SA 3.0` · _collection_
- 🔴 **[Open Yale — ASTR 160 Astrophysics](https://oyc.yale.edu/astronomy/astr-160)** — Exoplanets, black holes, dark energy as live controversies. NC + SA. `CC BY-NC-SA 3.0` · _collection_
- 🔴 **[Complexity Explorer — Intro to Complexity](https://www.complexityexplorer.org/courses/)** — The definitive open course on emergence & complex systems. NC + SA. `CC BY-NC-SA 4.0` · _collection_
- 🔴 **[MIT OCW — 8.04 Quantum Physics I](https://ocw.mit.edu/courses/8-04-quantum-physics-i-spring-2016/pages/video-lectures/)** — Rigorous full quantum course. NC + SA — link/embed only for a commercial platform. `CC BY-NC-SA 4.0` · _collection_

### Music — restricted
- 🔴 **[Podington Bear (Chad Crouch) — ambient catalog](https://freemusicarchive.org/music/Podington_Bear/)** — Large, gorgeous gentle-ambient catalog BUT NonCommercial — needs a paid license for FRQNCY's commercial platform. `CC BY-NC 4.0` · _collection_

### Open lectures — restricted (ND)
- 🔴 **[Anil Seth — 'Your brain hallucinates your reality' (TED)](https://www.ted.com/talks/anil_seth_your_brain_hallucinates_your_conscious_reality)** — Predictive-processing 'controlled hallucination' account. NC + ND — embed unmodified via TED player only. (All TED talks are CC BY-NC-ND 4.0.) `CC BY-NC-ND 4.0` · _video_

### Film & video — restricted
- 🔴 **[Powers of Ten (1977)](https://archive.org/details/powers-of-tentm-1977_202202)** — Profound scale-of-the-universe meditation, but rights are actively held — treat embed-only until confirmed. `Uncertain (Eames Office licenses rights)` · _video_

### Podcasts — reusable
- 🟡 **[Berkman Klein Center — Audio Fishbowl](https://podcasts.apple.com/us/podcast/berkman-klein-center-for-internet-and-society-audio/id167015468)** — Scholarly talks on internet governance & digital society — fully reusable with credit. `CC BY 3.0` · _collection_
- 🟡 **[Frontiers of Commoning (David Bollier)](https://david-bollier.simplecast.com/episodes)** — Interviews on commons governance & regenerative economics — core to regeneration/decentralization. `CC BY 3.0 (site-wide)` · _collection_
- 🟡 **[Open Minds… from Creative Commons](https://open.spotify.com/show/5bTf4Ok2R58bIul5LIHJVf)** — CC's own show on open, collaborative, decentralized culture/tech — on the cooperation value. `CC BY 4.0` · _collection_

### Open lectures — reusable
- 🟡 **[Wikimedia Commons — videos of physics / brain](https://commons.wikimedia.org/wiki/Category:Videos_of_physics)** — The one genuinely commercial-reusable science-video source here — open animations/demos. Verify each file (some CC BY-SA carry ShareAlike). `Per-file CC0 / PD / CC BY / CC BY-SA` · _collection_

## Legend

🟢 free reuse · 🟡 reuse + credit · 🔴 link/embed only. Full attribution strings and per-item notes: `frqncy-open-content.json`.
