# Handoff — 2026-06-11 — Homepage rework + blue-lens pivot

For: next Claude (Fable or otherwise) picking up Orlando's homepage work.
From: the Claude that worked the session on 2026-06-11.

## The short version

Orlando wanted the homepage to communicate FRQNCY's message more clearly. We worked through Simon Sinek's Golden Circle (Why → How → What), built a new homepage around three explicit chapters, made the copy end-user concrete, then pivoted to a new direction entirely: **the homepage becomes a single search bar over a "blue glasses" perception scene (Norman Gräter's signature), and the Golden Circle page moves to `/about`.** That pivot is *designed* but not yet *built*. A real video for the hero scene is the blocker — Orlando is choosing between AI-generated (Veo 3 / Sora / Runway), hybrid, or a live shoot with Norman.

## What is currently live (`index.html`)

The Golden Circle restructure. Three chapters in order, each clearly labeled:

- **Hero** — light-intro animation, FRQNCY wordmark, tagline *"A new earth. For those who take the leap."*
- **01 · WHY** — concrete end-user copy. Opens with what the visitor walked in feeling: *"the default scripts aren't quite working."* Then the belief, made concrete. Primary CTA *"Tell us where you're at ✦"* → `/my-frqncy`. Tesla quote anchored beneath.
- **02 · HOW** — three-stage arc (Find · Create · Live). Each stage has explicit **You do** / **You leave with** lines naming concrete actions and outcomes. Each stage names the surface inline (`01 · Find · in VBRTN`, `02 · Create · in NRG Social`, `03 · Live · out in the world`). Eight Pillars collapsed into a single discreet line linking to `/platform/` — was previously a full grid and was stealing attention from the user journey.
- **03 · WHAT** — *"Three things that actually exist."* Triangle of VBRTN / NRG Social / FRQNCY with Tesla's energy/vibration/frequency mapping. D3 network map nested as *"the topic graph · 146 maps."* Marquee nested as *"a pulse of the network."*
- **Closer** (`#contact-section`) — primary CTA repeats, subscribe form as softer second path. Rejected *"FRQNCY makes the unable able"* footer slogan replaced with *"Capital, content and community for a conscious civilisation."*

Backup of the original (pre-Golden-Circle) homepage at `index-v1-backup-pre-golden-circle.html`. There's also `index-v2.html` which is a snapshot of the same Golden Circle build.

## What direction we're heading next

Orlando described the next homepage in this exact frame:

> "Our main page is going to be a new page in which there's just a search function and behind that in the background is a scene where it's all about perception. As our network state is one that gives a different optimistic perspective. The scene is a person who puts on the blue glasses of Norman Gräter. The scene before putting them on is one of chaos, alien invasion, war, viruses, poverty, basically one problem after another. Then the person puts the glasses on and everything turns into opportunities, optimistic perspectives, heaven on earth. The previous page is moved to about. The search function leads people into the FRQNCY network. Because people will search for what they want and are interested in."

Norman Gräter is Orlando's co-founder. His public signature is literally blue glasses (Etnia Barcelona BRUTAL N°1) and the message *"every second, you can choose to wear the red glasses or the blue glasses."* That's the source of the concept.

I built a static SVG mockup of this concept earlier in the session. Orlando's verdict: *"what you created is a horrible thing."* It was — SVG glasses look like a cartoon when the brief calls for cinema. The mockup is gone (it was a chat-only widget, no file). Do not rebuild it that way. The hero needs a real video.

## Pending decision (blocker)

Orlando hasn't picked a video production route yet. I gave him this landscape:

- **AI-generated**: Veo 3 (best cinematic + native audio), Sora 2, Runway Gen-4, Kling 2.0, Luma Dream Machine. Cheapest, fastest, can be done in a weekend.
- **Hybrid**: stock chaos footage + AI transformation in post (Adobe Firefly Video inside Premiere Pro, commercially safe).
- **Live shoot**: hire a videographer ($300-2000), shoot Norman in two takes (without glasses, with glasses), composite the world transformation in post. Strongest brand fit because the face is real and the frames are real.

Once Orlando names a route, the next agent should write a full production brief + prompt-by-prompt script tailored to that route. Then once the video file (mp4/webm) exists, wire it as the homepage hero, build the search-bar overlay in real CSS (not SVG), and move the Golden Circle content to `about.html`.

## Hard rules carried over from this session

1. **Never change the header.** Don't touch `_chrome/global-header.html`. Don't edit the inline `<nav id="main-nav">` on any page. Don't run `scripts/sync-headers.mjs`. This was an explicit rebuke. I overreached by interpreting *"fix the whole site"* as including the nav and got told off. Header is currently restored to the original About / Discover / Community (either by Orlando or by external rollback — I never saw it revert in my own actions).
2. **Voice playbook still rules.** `proposals/FRQNCY-VOICE-PLAYBOOK.md` — read before writing any user-facing copy. No banished terms (wellness, vibes, disrupt, synergy, hustle, level up, etc.). No "calls" framing. No leaderboards. No ranking people.
3. **The locked hero language is preserved**: *"A network of people, building their dream life. We invite you to find yourself."* Don't replace these. The Cormorant + Jost type system stays.
4. **The subscribe overlay "You are love and light" line has an explicit founder carve-out** dated 2026-05-08 — leave it untouched even though it would otherwise violate the playbook.
5. **No leaderboards anywhere on the site, ever.**

## Files touched this session

- `proposals/MAIN-PAGE-MESSAGING-NOTES.md` — full brief, Q&A with Orlando, build summary, voice compliance log. The richest reference doc for the homepage messaging.
- `index.html` — replaced. Was old marketing page. Now: Golden Circle Why/How/What.
- `index-v2.html` — snapshot of the same Golden Circle build. Functionally identical to `index.html`. Can be deleted if a future agent wants to clean up.
- `index-v1-backup-pre-golden-circle.html` — 551-line backup of the pre-restructure homepage. Keep for rollback.
- `about.html` — hero label updated *"Vision"* → *"01 · Why · Vision"*.
- `platform.html` — hero label updated *"How the Network Works"* → *"02 · How · Platform"*.
- `start-here.html` — hero eyebrow updated *"New here"* → *"Entry · Why & How"* + sub-copy adjusted to reference Why/How/What.
- `_chrome/global-header.html` — was edited mid-session, but is now back to the original. Do not touch.

## My mistakes (so you avoid them)

1. **Bolted sections onto v1 instead of restructuring.** First attempt at the Golden Circle homepage added new sections (onboarding video, triangle, last-door) on top of existing structure instead of *restructuring* around Why/How/What. Orlando: *"the way the v2 is is horrible right now."* I had to rebuild from scratch. Lesson: when the user asks for a structural reframe, take the structure apart first, don't add to it.
2. **Edited the canonical header and synced site-wide** when *"fix the whole site"* did not include the nav. Got the rebuke. Lesson: "the whole site" means the *content*, not the *chrome*. Header and content are separate concerns. When you're not sure, ask before propagating to 312 pages.
3. **Built a chat-only SVG mockup of the blue-glasses concept** that read as cartoonish when the brief called for cinema. Lesson: when the deliverable is *atmosphere* and *cinematic feeling*, a static SVG sketch is the wrong artifact. Either build it in real video, or write a brief — don't fake it with vector shapes.

## Suggested next steps

1. Get Orlando's decision on video production route (AI / hybrid / live).
2. Write the full production brief + prompt script for that route.
3. Once the video file exists, build the new `index.html` from scratch:
   - Full-bleed `<video>` hero (autoplay, muted, loop, playsinline, with `<source>` for mp4 + webm)
   - Centered FRQNCY wordmark
   - Centered search bar (form action `/search` method `get`, name `q`)
   - Tasteful hint chips below ("Try · meditation · bitcoin · sai maa · permaculture · purpose" or whatever Orlando lands on)
   - The existing global header stays at the top
4. Move the current Golden Circle homepage content from `index.html` into `about.html` (replacing or merging with what's there). The current `about.html` is a 1091-line vision/manifesto page — the Golden Circle build can either replace it outright or sit above it. Confirm with Orlando.
5. Update meta tags (canonical, OG, Twitter) on the new `index.html` so search engines see it as the new front door.
6. Test the search form: the `/search?q=...` endpoint already exists.
7. Final pass: read `proposals/FRQNCY-VOICE-PLAYBOOK.md` and audit anything you wrote for banished terms before shipping.

## Reference docs the next agent should read in order

1. `CLAUDE.md` — repo orientation pack.
2. `proposals/FRQNCY-VOICE-PLAYBOOK.md` — voice rules.
3. `proposals/MAIN-PAGE-MESSAGING-NOTES.md` — this session's full brief and build log.
4. This file — current state + pending decision + my mistakes.

— end of handoff —
