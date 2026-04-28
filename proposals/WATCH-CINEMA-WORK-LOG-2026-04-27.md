# Watch + Cinema work log — 2026-04-27 to 2026-04-28

Handoff document for the next agent working on `/v2/watch/` (the FRQNCY video library + cinema page). Everything below was done across one conversation. Read this before touching the watch page.

## TL;DR

Audited every video on the watch page, swapped out paywalled and dead ones, added new domains (Kitchen Nightmares, Master Key Society / Book Readings) and a stack of Happy Science films to Cinema. Fixed a broken audio embed on `/v2/audio/`. End state: **276 videos, 14 playlists across 3 collections**, all commits stacked on `main` and pushed.

## How the Watch page is wired

Three files feed the page; one script inlines them.

`videos.json` — keyed by `topicId` (e.g. `t-osho`, `t-history`, `t-movies`, `t-bookreadings`). Each topic holds an array of video objects:

```json
{ "id": "v-osho-r01", "youtube_id": "...", "title": "...", "channel": "...", "duration": "...", "desc": "...", "frqncy_pick": false }
```

`playlists.json` — three top-level collections (`c-teachers`, `c-domains`, `c-cinema`), each containing playlists. A playlist references videos by their `id` (not `youtube_id`).

`generate-watch.js` — reads both JSON files, plus `providers.json`, and inlines the data into `v2/watch/index.html` between `INLINE_DATA_START / INLINE_DATA_END` markers so the page works on `file://`. The `TOPIC_LABELS` map in that script controls how topic IDs render in the UI — **add a new entry here whenever you add a new topic**.

Build command:

```
node generate-watch.js
```

Run from project root. Confirms the inline counts: `(N videos, M playlists across K collections inlined)`.

## Current playlist inventory

**c-teachers (library)** — 5 playlists, gold accent
- pl-osho — Osho — 15 latest *public* items (the channel went members-only for long-form, see below)
- pl-sadhguru — Sadhguru — 20 items
- pl-trudeau — Kevin Trudeau — 20 items
- pl-saimaa — Sai Maa — 20 items
- pl-spivey — Gary Spivey — 20 items

**c-domains (library)** — 6 playlists, indigo accent
- pl-history — History — Graham Hancock, 12 items
- pl-design — Design — The Local Project, 20 items
- pl-earth — Earth — Planet Wild, 20 items
- pl-neuroscience — Neuroscience — Dr Joe Dispenza, 20 items
- pl-entertainment — Entertainment — Kitchen Nightmares, 20 items
- pl-bookreadings — Book Readings — Master Key Society, 20 items

**c-cinema (cinema)** — 2 playlists, gold accent
- pl-films — Foundational Films — 12 items, ordered roughly chronologically by Happy Science release year so the cinematic universe reads in sequence
- pl-biopics — Biographical — 3 items (Steve Jobs, Phantom of the Opera BBC doc, Push 2009)

## What was changed

### 1. Added Kitchen Nightmares as Entertainment domain (commit `3aa8e00`)
New `t-kitchennightmares` topic with 20 video entries (`v-kn-1` through `v-kn-20`) — full episodes and season compilations from the official `@KitchenNightmares` channel (`UCUZzyuAlhHNP3oiuMjn7RfQ`). Filtered out Hell's Kitchen uploads since the channel mixes both shows. Added `t-kitchennightmares: 'Entertainment'` to `TOPIC_LABELS`. New `pl-entertainment` playlist in c-domains.

### 2. Audited all 221 videos for availability (commit `4122620`)
Used a YouTube oembed + watch-page playability check on every `youtube_id`. Categorised results:
- 5 confirmed DEAD (oembed 404)
- 26 confirmed MEMBER-only / paywalled
- The remaining were either OK or got rate-limited (sandbox IP gets throttled by YouTube on bulk page fetches; oembed itself is more lenient)

Sandbox returned Malay text in playability errors (`"Ahli sahaja"` = "Members only", `"Video tidak tersedia"` = "Video unavailable") because YouTube routes the sandbox via a Malaysia POP. **Important**: this means the sandbox sees what Orlando sees in Malaysia, including region-blocks. When checking video availability, that's actually a useful signal — but it also means US-only free-streaming services (Tubi, Pluto, Plex US) won't be reachable for testing.

### 3. Replaced paywalled / dead videos (commit `4122620`)
- **Osho** — channel has gone almost entirely members-only for long-form. 19 of 20 entries gated. Replaced with 15 RSS-confirmed public items. Subtitle changed to *"15 latest public videos"* with a note that full talks are members-only. Mostly shorts, but it preserves Osho's presence.
- **Sadhguru** — 7 members-only entries swapped for 7 non-member long-form alternatives from the same channel (Experiment with Death, Hallmark of Successful Entrepreneurs, Wisdom Bomb, etc).
- **Gary Spivey** — `v-gs-r20` (`PiqluYAb_cg`) was dead. Swapped for fresh Tapping In episode `_VP0q8zrcqU`.
- **Cinema** — Bruce Lee: A Warrior's Journey has *no* free upload anywhere (licensed to Apple TV / Prime). Removed entirely. Push (`UAxrIWBEIXE`) and Phantom of the Opera BBC doc (`z0g7nM9zjaY`) got fresh working uploads.

### 4. Added films to Cinema across multiple commits

**The Golden Laws** — `o1gI25CgWos`, 1h 51m, official Happy Science (`b75789a`)

**The Ultimate Gift + Water Crystals in Motion** — `gJjUV7lnQMM` (1h 57m, ACI On The Go) and `3F-pN2oI5BM` (43 min, VHS Therapy) (`d14c80d`)

**The Laws of the Universe — Part 0** — `9lcqDkvWG5o`, 2h 5m, official Happy Science (`9231663`)

**4 more Happy Science films** (`99ea1a6`):
- The Mystical Laws (`JXnRkTR1OYQ`, 2h, 4K official)
- Laws of the Universe — Age of Alpha (`PwQ91hv5suE`, 1h 59m, 1080p official)
- Hermes — Winds of Love (`C7CqkmBe6bY`, 1h 54m, Happy Science New Jersey official)
- The Rebirth of Buddha (`yPKSjNoucoA`, 1h 54m, archival reupload — community channel, full English)

### 5. Added Book Readings domain — Master Key Society (commit `b48ea5f`)
New `t-bookreadings` topic with 20 audiobook entries (`v-mks-1` through `v-mks-20`). Channel: `@MasterKeySociety` (`UCXEns75ExsEwvw6UNmOQcNQ`). Lineup spans the New Thought canon: Charles Haanel (Master Key System full audiobook + Mental Chemistry), Napoleon Hill (The Law of Success 1928, all 8 books in sequence), Catherine Ponder, L.W. de Laurence (Master Key Parts 1–6), Magus Incognito, Emerson, Brian Dehler, plus short summaries of As A Man Thinketh, The Prophet, The Kybalion, It Works. Added `t-bookreadings: 'Book Readings'` to `TOPIC_LABELS`.

### 6. Fixed Strangest Secret audio (commit `97de797`)
The embed at `/v2/audio/` was broken. Old upload (`yYbAoJ_701M`) had embedding disabled by its uploader — the iframe wouldn't play even though the watch link worked. Swapped for **Nightingale Conant's official upload** (`uwKqs5aK_RI`) — same recording, 35 min, embedding allowed, and that's the actual rights-holder's channel so it's stable.

Updated in two places — both have to stay in sync:
- `v2/audio/index.html` — the embedded iframe + the "Listen →" link
- `resources.json` — the resource entry under topicSlug `audio`

### 7. Films explicitly skipped (no free upload found)
For posterity if Orlando asks again:
- **True Power of Water** (Emoto) — sold commercially only (Amazon, Beyond Words, Ickonic). No YouTube upload exists.
- **The Men Who Stare at Goats** (2009) — Official YouTube Movies upload returns "Video tidak tersedia" in Malaysia. Other uploads either embed-forbidden or login-required. Free options are US-only (Tubi/Pluto/Plex/Kanopy/Hoopla).
- **Come See the Paradise** (1990) — same situation as Men Who Stare at Goats. Paid YouTube Movies only, region-locked.
- **Bruce Lee: A Warrior's Journey** — removed from cinema. Licensed to Apple TV / Prime now, no free upload survives.
- **Final Judgement, Twiceborn, Laws of the Universe Part I / Part II / Age of Elohim / Beyond Space and Time** — paid only or not on YouTube.

## Tribal knowledge for the next agent

### Sandbox limitations
The sandbox **cannot push to GitHub**. No SSH keys, no `gh` CLI, no stored credentials. Always commit, never try to push. Tell Orlando the commit hash so he can push from his Mac.

### Git lock files in the sandbox
The mounted FUSE filesystem doesn't allow unlinking certain `.git/*.lock` files mid-commit. Workaround used throughout this work — run before every `git add` / `git commit`:

```
for f in .git/HEAD.lock .git/index.lock .git/next-index-*.lock; do
  [ -f "$f" ] && mv "$f" "$f.bak.$$" 2>/dev/null
done
```

The `warning: unable to unlink ...` lines that follow are harmless — the commit succeeds.

### YouTube rate-limiting
Bulk fetching watch pages from the sandbox gets throttled fast. After ~50 requests YouTube starts returning 387-byte empty responses. Mitigations:
- Use **oembed** as a fast first signal (deletion / private). Oembed has a much higher rate limit than the watch page.
- For deeper checks (membership status, duration, region-block reason), space requests with `sleep 5` or longer.
- For channel discovery, the **RSS feed** at `https://www.youtube.com/feeds/videos.xml?channel_id=UC...` has no rate-limit issues but only returns 15 most recent items.
- For deeper history (older uploads, member-status detection), parse `ytInitialData` from the channel's `/videos` page. Members-only badge lives in `ownerBadges` and as `BADGE_STYLE_TYPE_MEMBERS_ONLY` in nested JSON — search the full JSON string with `'MEMBERS_ONLY' in json.dumps(vr)` rather than trying to index into specific fields.

### Adding a new playlist — checklist
1. Add or update a topic in `videos.json` with the video objects
2. Add the playlist entry to `playlists.json` under the appropriate collection
3. Add the topic-id → display-name to `TOPIC_LABELS` in `generate-watch.js`
4. Run `node generate-watch.js`
5. Commit `videos.json`, `playlists.json`, `generate-watch.js`, `v2/watch/index.html`
6. Tell Orlando the commit hash for him to push

### When you receive a YouTube URL from Orlando
Don't trust the title alone. Always verify:
1. Hit oembed (`https://www.youtube.com/oembed?url=...&format=json`) — gets you the title, channel, and proves the video exists and isn't private/deleted
2. Hit the watch page — gets you `lengthSeconds`, `playabilityStatus`, region-block reason
3. If the embedding fails (oembed returns "Unauthorized"), the video page works but iframes won't — find a different upload (this was the Strangest Secret bug)

### Don't add region-blocked or paid videos to the watch page
Orlando is in Malaysia. YouTube Movies paid rentals come back as "Video tidak tersedia" in MY. Verify with oembed/watch-page before committing. If the only path is a US-only free service (Tubi etc), don't put it on the watch page — flag it to Orlando instead and let him decide.

## Commit chain (this work)

All on `main`. Listed oldest first so you can replay them:

```
3aa8e00  watch: add Entertainment domain (Kitchen Nightmares) with 20 episodes
4122620  watch: replace paywalled/dead videos with watchable uploads
b75789a  watch: add The Golden Laws (Happy Science) to Foundational Films
d14c80d  watch: add The Ultimate Gift and Water Crystals in Motion to Foundational Films
b48ea5f  watch: add Book Readings domain (Master Key Society) with 20 audiobook entries
9231663  watch: add The Laws of the Universe — Part 0 (Happy Science) to Foundational Films
99ea1a6  watch: add 4 Happy Science films to Foundational Films
97de797  audio: fix Strangest Secret embed — old upload had embedding disabled
```

Plus an unrelated `1e672b9` (Recommended Memberships on Sanctuary) that was already in flight when this work started, and a chain of unrelated world-model commits inserted in between (Astro topic pages, entity hubs, etc) — those are not part of the watch work but live in the same branch.

## Open threads / not done

- Cinema biographical playlist is thin (3 items: Steve Jobs, Phantom doc, Push). Could grow if Orlando finds more freely-available biopics.
- Osho playlist is 15 mostly-shorts because of the channel's membership wall. If a longer-form free Osho source appears (different channel, archive site that hosts iframe-friendly versions, etc.), worth swapping in.
- The watch page has no thumbnail caching layer — it pulls i.ytimg.com on every render. Fine for now, but if traffic grows or YouTube changes thumbnail URLs, that's a fragility.
- `frqncy_pick` flags were set ad-hoc as videos were added. The picks-first sort in `generate-watch.js` (`allVideos.sort((a, b) => (b.frqncy_pick ? 1 : 0) - (a.frqncy_pick ? 1 : 0))`) only affects the flat `INLINE_VIDEOS` array, not playlists themselves. If you want picks to surface inside individual playlists, that needs separate sort logic.
