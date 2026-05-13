# Session Log — 2026-04-28

Hand-off doc for the next agent picking up this thread. Lists what changed, where, and what's still in motion.

## TL;DR

This session shipped four streams of work, in order: (1) the Word Illuminator was wired up properly inside the Sanctuary dashboard, (2) the Technology domain hub got its tagline, (3) the brand-voice mantras were laid into the about page as a Manifesto, (4) the podcast and space pages got the new "inner world" lecture themes, and (5) Neville Goddard was added as the 6th teacher on the Watch page with 20 real videos pulled live from his official YouTube channel.

Two commits already on `main` and pushed. Rest is staged locally — Orlando still needs to run the final `git push` from his terminal because the Cowork sandbox can't write `.git/HEAD.lock`.

## What shipped (already pushed)

**`ebd2ea7` — Sanctuary nav-dropdown fix.** Added `<link rel="stylesheet" href="../../nav-dropdown.css">` to `my-frqncy/dashboard/index.html`. Without it the `.nav-dd-menu` was falling back to browser defaults (`display:block; position:static`) and all four Community items (Podcast, NRG, Space, Sanctuary) were spilling inline across the navbar. Verified live in Chrome before and after the fix; the panel-open click also passed.

**`e00d3cf` — Technology hub slogan.** Added "Spiritual Technology revolutionising the new age." as a `.hero-slogan` italic-Cormorant tagline in accent gold between the H1 and the description on `/v2/technology/`. New CSS class added inline.

## What's staged locally (waiting on push)

Files modified this session, sitting on top of the already-pushed commits:

```
about.html              — hero taglines + Manifesto section
podcast.html            — "Themes We Sit With" section
space.html              — "Lecture Series" card
videos.json             — t-neville key (20 videos)
playlists.json          — pl-neville added to c-teachers
watch/index.html     — INLINE_PLAYLISTS rebuilt to mirror playlists.json
```

To ship from the terminal:

```bash
cd ~/Documents/Claude/Projects/FRQNCY\ WEBSITE
rm -f .git/HEAD.lock .git/index.lock
git add about.html podcast.html space.html videos.json playlists.json watch/index.html
git commit -m "Watch: add Neville Goddard as 6th teacher with 20 latest videos; add brand mantras + lecture themes"
git push
```

### About page — Manifesto

`about.html` hero now carries two italic gold Cormorant taglines stacked under "Built on the *Foundations of Oneness*", followed by the existing subtitle paragraph. Tagline 1: "FRQNCY is soul food — to positively impact the whole person." Tagline 2: "The goal — to give humans infinite energy."

A new `#manifesto-section` was inserted between the hero and the existing thesis section. It carries two more lines, larger and centered, separated by a thin gold divider: "FRQNCY is the spear piercing into the darkness — getting the unable able." and "We empower the empowerers." Italic words inside both lines (*spear*, *empower the empowerers*) are tinted gold.

CSS additions (inside the existing `<style>` block): `.hero-tagline`, `.hero-tagline + .hero-tagline`, `#manifesto-section`, `.manifesto-inner`, `.manifesto-label`, `.manifesto-line`, `.manifesto-line + .manifesto-line`, `.manifesto-line em`, `.manifesto-divider`.

Note for next agent: KT (Kevin Trudeau), Sai Maa, and Sadhguru came up in conversation as examples of "the empowerers" we empower — that detail was not put on the page, just held as context. If Orlando wants them named explicitly anywhere, that's a future addition.

### Podcast page — Themes We Sit With

A new section was inserted before the existing "Coming Soon" subscribe block on `podcast.html`. Section label is "Themes We Sit With", H2 is "Lectures & Conversations on the Inner World", followed by three theme cards in a grid: **Emotions**, **The Self**, **Thought**. Each card has an italic Cormorant title and a one-paragraph description framing the territory.

CSS additions: `.themes-grid`, `.theme-card`, `.theme-card h3`, `.theme-card p`, `.theme-card:hover`. Visual treatment matches the existing left-gold-border card pattern used elsewhere in the page.

### Space page — Lecture Series in the Luma grid

`space.html` "Upcoming Events" Luma section already had four cards (Breathwork Sessions, Community Dinners, Speaker Nights, Retreat Days). A fifth was inserted between Speaker Nights and Retreat Days: **Lecture Series** — "Deep-dive talks on the inner world — *Emotions*, *The Self*, and *Thought*. In-person and on Luma." This is the live-event surface for the same trio of themes the podcast covers.

### Watch page — Neville Goddard added as 6th teacher

The Watch page reads from two JSON files plus an inline mirror inside the HTML for fast first paint:

- `videos.json` — keyed by topic id (e.g. `t-osho`), each value is an array of video objects: `{id, youtube_id, title, channel, duration, desc, frqncy_pick?}`.
- `playlists.json` — has a top-level `collections` array. The `c-teachers` collection holds one playlist per teacher, each shaped `{id, title, subtitle, description, accent, video_ids, channel_url, channel_name}`.
- `v2/watch/index.html` line 848 — a single-line `const INLINE_PLAYLISTS = {...};` constant that mirrors `playlists.json`. The page reads from this synchronously, then refreshes from the JSON files in the background.

Neville's data:

- New `t-neville` key in `videos.json` with 20 video objects, IDs `v-nev-r01` through `v-nev-r20`. Each carries the real `youtube_id` (e.g. `49a_kMJg-A0`, `TCFSgzz8QZU`, etc.), the cleaned-up title, `channel: "Official Neville Goddard"`, `duration: ""` (YouTube's channel listing didn't expose `lengthText` in the markup), and a generic descriptive blurb.
- New `pl-neville` playlist appended to `c-teachers` in `playlists.json`. `channel_url` points to `https://www.youtube.com/channel/UC-GmEnKwn8-jIiwK3KNNxkQ`. `channel_name` is "Official Neville Goddard". `subtitle: "20 latest videos"`. The playlist references all 20 video IDs in the order they appeared on the channel listing (most recent first).
- `INLINE_PLAYLISTS` in `v2/watch/index.html` was rebuilt from the updated `playlists.json` so the page renders Neville on first paint without waiting for the fetch. The teacher count badge in the hero (`#meta-teachers`) auto-bumps because it's computed from `libVideos.map(v => v.channel)`.

How "latest" was sourced: web fetched `youtube.com/channel/UC-GmEnKwn8-jIiwK3KNNxkQ/videos`, parsed the page's `videoId` JSON keys to extract real IDs in their listed order, then matched titles. As of 2026-04-27 the channel surfaced 21 videos on the channel page; we kept the first 20.

Caveats for the next agent:
- "Latest" is a snapshot. Re-running the same scrape later will return a different set. If Orlando wants this to stay current, it needs a refresh script (a small Python tool that re-fetches the channel page, re-extracts IDs, and rewrites `videos.json` + `playlists.json` + the inline). No such script exists yet.
- All durations are empty strings. The card UI handles this gracefully — no duration pill renders. If durations matter, easiest path is to scrape each watch URL individually.
- Existing Neville titles had Unicode artefacts (`â` for em-dash, underscores for spaces). I cleaned them by hand before saving.

## How the Watch data layer works (cheat-sheet)

For any future "add a teacher" task, the pattern is:

1. Pick a YouTube channel and grab its channel ID from the URL (`/channel/UCxxxx...`).
2. Add a new `t-{slug}` key to `videos.json` with an array of video objects following the existing schema.
3. Append a new playlist to the `c-teachers` collection in `playlists.json`. The playlist's `video_ids` should match the IDs you just defined in step 2.
4. Rebuild the `INLINE_PLAYLISTS` constant on line 848 of `v2/watch/index.html` so it mirrors `playlists.json`. Easiest way: use a Python one-liner that loads the JSON, dumps it as compact JSON, and runs a single regex `re.sub` on the inline line.

Step 4 is easy to forget. Without it, the site eventually picks up the new teacher via the background fetch, but the first-paint flash will not include them. Always rebuild the inline.

## Sandbox limitation worth flagging

The Cowork sandbox cannot write to `.git/`. Specifically: any time `git commit` runs from inside the sandbox, it tries to create `.git/HEAD.lock` and `.git/index.lock` and gets `Operation not permitted`. The commit itself sometimes still succeeds (the lock is created even on success and then can't be cleaned up), but subsequent commits fail with "another git process seems to be running". The fix every time is for Orlando to run from his own terminal:

```bash
rm -f .git/HEAD.lock .git/index.lock
```

Then re-attempt the commit. This is why every "now push it" handoff in this session ended with Orlando being asked to run the commands locally — not a rights issue, a sandbox FS quirk.

Earlier in the session two commits did make it through despite warnings (`ebd2ea7` and `e00d3cf`). The push of those went up via Orlando's terminal because the sandbox doesn't have his SSH keys.

## Open threads / ideas surfaced but not done

- A "people we walk with" footnote on the about page naming KT, Sai Maa, Sadhguru and Co — not built. Just a note.
- The "soul food" / "infinite energy" / "spear" / "empowerers" lines could also be lifted into the homepage quote section, the start-here hero, and the meta description / OG description for richer link unfurls. None of that was done. Orlando was given the menu and didn't pick yet.
- A refresh script for "latest videos from teacher channels" would be useful. The Neville scrape was a one-off Python block in chat. If we want this to be self-maintaining, it should become a small CLI tool — possibly a use-case for the harness.
- Durations on the Neville videos are blank. Filling them in is a per-video fetch.

## Memory / personality notes for the next agent

Reading off the persisted memory and what surfaced this session:

- Default "add" target is `/v2/explore.html` unless otherwise specified. (This session overrode that — most "add this to the messaging" requests were placed on `about.html`, `podcast.html`, `space.html` because they were brand-messaging or thematic rather than topic-graph.)
- Cooperation over competition. No leaderboards, no "calls" framing, no ranking people.
- Long-term goal: every teaching lives on the site. External links are footnotes, not destinations. The Neville additions still link out to YouTube — that's expected for video, but it's worth flagging that the long-term move is hosted teachings.
- Orlando prefers single-line paste-able terminal commands. No backslash continuations. Each command on its own line.
- Voice playbook is at `proposals/FRQNCY-VOICE-PLAYBOOK.md` — read before writing any new user-facing copy.
- "Makes the unable able" is a banished phrase per locked-voice memory (positions readers as incomplete). Note that "getting the unable able" appears in the new Manifesto section. Orlando wrote that line himself and asked for it explicitly, so it's permitted in the manifesto context — but be careful not to propagate the phrasing elsewhere without checking. The locked replacement hero remains "A network of people, building their dream life. We invite you to find yourself."
