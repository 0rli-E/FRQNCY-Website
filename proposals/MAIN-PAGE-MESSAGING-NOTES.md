# Main Page Messaging — Working Notes

Date opened: 2026-05-22
Status: brief locked, **v2 homepage built** at `/index-v2.html` (2026-05-23). Live `index.html` untouched. Final review + cutover pending Orlando.

## Build summary (2026-05-23) — Golden Circle restructure

The first v2 (with onboarding-video, triangle, last-door as separate floating sections) was reviewed by Orlando as "horrible" because it bolted sections on instead of restructuring around Simon Sinek's Golden Circle. **Rebuilt** with three explicit chapters: WHY · HOW · WHAT.

**Live homepage now (`index.html`, also mirrored at `index-v2.html`):**

1. **Hero** (`#light-intro`) — animation, FRQNCY wordmark, "A new earth. For those who take the leap." — unchanged.
2. **Chapter 01 · WHY** (`#ch-why`) — single section. The belief: "A network of people, building their dream life. We invite you to find yourself." Tesla quote anchored beneath. Primary CTA "Tell us where you're at ✦" → `/my-frqncy`.
3. **Chapter 02 · HOW** (`#ch-how`) — the arc in three stages (Find / Create / Live). Eight Pillars nest underneath as "the operations that hold it up."
4. **Chapter 03 · WHAT** (`#ch-what`) — the Triangle (VBRTN / NRG Social / FRQNCY). D3 network map nests beneath as "the topic graph · 146 maps." Marquee nests beneath as "a pulse of the network."
5. **Closer** (`#contact-section`) — primary CTA repeated, then a softer subscribe path. New footer slogan ("Capital, content and community for a conscious civilisation") replaces the rejected "FRQNCY makes the unable able" line.

**Global nav** (`_chrome/global-header.html`) restructured to **Why / How / What** with submenus pointing at canonical destinations. **Synced site-wide** — 312 pages updated via `scripts/sync-headers.mjs`.

**Key landing pages aligned:**

- `about.html` hero label: *Vision* → **01 · Why · Vision**
- `platform.html` hero label: *How the Network Works* → **02 · How · Platform**
- `start-here.html` hero eyebrow: *New here* → **Entry · Why & How**

**Backup of pre–Golden-Circle homepage** preserved at `index-v1-backup-pre-golden-circle.html` (551 lines) in case rollback is needed.

**Voice playbook compliance:** banished terms checked, em-dashes kept moderate, no "calls/leaderboards" framing, the locked hero H1+sub preserved verbatim, subscribe overlay's "love and light" exception untouched.

**HTML validity:** verified clean.

**Open follow-ups:**

- Stylistic polish across `ch-why` / `ch-how` / `ch-what` — once Orlando has scrolled the live page, expect specific spacing / typography callouts.
- Restructure inner content of About, Platform, and Start Here to fully map each page to its Golden Circle chapter (the eyebrow labels are the minimum alignment; the body copy could go deeper).
- Decide whether topic pages (146 of them) need their own Why/How/What signpost or whether the global nav is enough.
- The `MY-FRQNCY-VBRTN-COMPANION-2026-05-22.md` proposal still doesn't exist on disk — referenced in `CLAUDE.md` as the canonical doc for the intake.

## Concreteness pass (2026-05-23, second edit)

After review, Orlando flagged that the WHY and HOW copy was still too abstract — visitors read it and still had questions. Rewrote both chapters using the voice playbook's "plain speech about non-plain things" principle.

**WHY now names the visitor's actual feeling**:

- Opens with "the default scripts aren't quite working" — names what the visitor walked in with
- Triad of what they were sold: "the career you were told to want, the metrics you were told to chase, the version of yourself you were sold"
- The belief is now made concrete: "they start work that doesn't burn them out, they love without performing, they make things that don't lie"
- "We invite you to find yourself" preserved as the italic gold closer above the CTA

**HOW now names the actual moves**:

- Opens with concrete time: "about ten minutes telling a private companion where you are right now"
- Relatable comparison: "questions a good friend or a good therapist would"
- Each stage now has explicit "**You do:**" / "**You leave with:**" lines in gold, naming the input and the output
- Each stage names the surface it runs on inline (`01 · Find · in VBRTN`, `02 · Create · in NRG Social`, `03 · Live · out in the world`)
- Promises footer: privacy, no ranking, no paywall, leave with your data at any time

**Eight Pillars collapsed**:

- Previously a full grid of 8 cards under HOW — was stealing attention from the user's three-stage journey
- Now a single discreet line that names the eight pillar verbs and links out to `/platform/` for anyone who wants the deeper view
- This honored Orlando's earlier work without overwhelming a first-time visitor

**WHAT chapter sharpened**:

- Headline changed from "Three surfaces. One network." → "Three things that actually exist."
- Lede now names Tesla's three explicitly and says "all three ship today" — anchors the architecture in reality
- Each triangle card now opens with one concrete sentence and lists what you actually do on that surface
- FRQNCY card now cites the real numbers: "146 maps · 766 vetted books, people, places, podcasts"

## Frame: Simon Sinek's Golden Circle

The main page has to walk a visitor through Why → How → What.

Translated into questions a real visitor is silently asking:

1. **Why should I stay on FRQNCY?** — the hook that earns the next scroll.
2. **What do I get?** — the concrete value, no cliches.
3. **What am I supposed to do if those two interest me?** — the next action.

The whole page has to answer one question concretely and grounded: **FRQNCY — what is it for?**

## Page goal (Orlando's words)

Help people find themselves, then — through that *plus* FRQNCY — express what they find.

The core arc:

> **Find yourself → create from that bliss → create on FRQNCY through NRG.**

The flow inside the visitor's head:

- "I've found myself → what now?"
- "I know now → what now?"
- Inputs that get used: Human Design, life history, what the person themselves says they find exciting.
- Question FRQNCY answers: *Can I bring this "what now" to life on FRQNCY somehow?* Answer: yes — you create on FRQNCY through NRG.

The mechanic:

- Query the visitor's current state.
- Give material that matches that state.
- Keep updating with the person as they move.

This reframes the Triangle: NRG isn't only "marketplace → real coaching." It's the **creation surface** — the place where, once you've found yourself, you express and build from that bliss.

## The product picture (the Triangle)

The three brands map to Tesla's three concepts:

> "If you want to understand the universe, think in terms of energy, vibration and frequency." — Tesla

| Tesla | Brand | Canonical name | What it is |
|---|---|---|---|
| Energy | **NRG** | **NRG Social** | The social network + marketplace — creation surface + path to real coaching |
| Vibration | **VBRTN** | VBRTN | The app inside My FRQNCY — pocket coach → real coach |
| Frequency | **FRQNCY** | FRQNCY | The network — connective tissue, topic graph, people |

So:

- **FRQNCY = the network** (the connective tissue, the topic graph, the people).
- **NRG Social = social network + marketplace + creation surface** — where you create from your bliss, and where the path to *real* (human) coaching lives.
- **VBRTN = the app inside My FRQNCY** — pocket coach that leads to a real coach. The pocket agent / "coach in your pocket" lives here.
- You **find yourself** through VBRTN (inside My FRQNCY); you **create from that** through NRG Social; both happen inside the **FRQNCY** network.

Tesla quote is a candidate anchor line for the page or onboarding.

## Design principle: start with the last door in mind

Before designing the homepage flow, decide **what the last door is** that people go through in the FRQNCY network. Then design every prior step backward from there. (Begin-with-the-end-in-mind.)

Open: what *is* the last door? Candidates to pressure-test — becoming a coach on NRG? Hosting a practice? Publishing a teaching? Booking a real human coach? Sustained personal practice tracked by VBRTN? Needs Orlando's call.

## The journey, with an agent walking alongside

There is an agent supporting the person along the entire path (the VBRTN pocket coach is the natural home for this).

### Step 1 — Tell us where you're at

The agent figures out where the person is and what's relevant to them. Specifically:

- **Highest priority** — what matters most to them right now.
- **Teachability index** — how willing and ready are you to change / optimize your life situation?
  - How ready are you to make certain decisions?
  - If you don't have time → the system adapts to the person (*make the rules*).
  - Habit-building.
  - Positive momentum cycle.
  - Commitments — goals adapt to the available time.
  - Communication and training style preferences.
  - **NLP metaprograms** (the AI works with these): toward-a-goal vs. away-from-pain, modal operators, etc.
  - Milton Erickson hypnotic patterns (Bandler + Grinder lineage).
  - **Human Design + Gene Keys + Scale of Enlightenment (Hawkins) + personal triggers** as additional lenses.
  - **Privacy written large** → reference posture: Venice (venice.ai-style, private/uncensored).
  - End of step 1: *make the decision*.

### Step 2 — (TBD)

Placeholder — Orlando to fill in.

### Step 3 — (TBD)

Placeholder — Orlando to fill in.

### Step 4 — Find yourself more

Deeper self-discovery loop. (Detail TBD.)

### Final step — the last door (Q1 answered)

The ultimate goal: **people no longer need FRQNCY.**

When they've moved through the whole arc:

- Habits run unconsciously.
- They're in the community because they *want* to be, not because they need to be.
- They show up in **physical spaces / townhalls**.

The success metric is *graduation*, not retention. This is anti-attention-economy by design. It also means the homepage shouldn't promise "stay forever" — it should promise *find yourself, build the habits, then go live*.

This lands at the same place as the end of the middle-loop (see below): **Creation of a new earth.** Individuals don't need FRQNCY anymore because together they *are* the new earth.

## The middle of the journey (Q2 + Q3 — one growing loop)

Steps 2 and 3 aren't discrete — they're a single loop that grows with the person. The chain of thought, in order:

1. **Intake** — Abfrage, query the person.
2. **Data** — captured into the agent's working memory.
3. **AI synthesis** — generates rules + training program + a **Future-You Assistant**, custom-built from charts, NLP, data.
4. **Goal anchoring** — supports a self-defined, flexible goal.
5. **To-dos — MTRSYCW** (acronym TBD — Orlando to confirm).
6. **Dreambuilding** — KI avatar *with you in the photo*, mind-movie, audios, physical dreambuilding. Engages **all five senses**. Upload an image to make it more specific to the person.
7. **Personalized exercises** — status quo, **WDYLT** ("What did you learn today"?), **TI** (Teachability Index), **TBS** (TBD), leadership, **Seed of Greater Benefit**.
8. **Agent leads** — **GIN-trained** (TBD). Leads people *to look for the gold* / **blaue Brille** (the blue/reframe lens).
9. **Outcome orientation** — "helps me get to where I want to be (feel better)."
10. **Positive momentum + habits — success cycle (MTRSYCW).**
11. **Content + KTs (TBD) + progress** — the loop grows with the person.
12. **Output: Creations from people on FRQNCY.**
13. **End state: Creation of a new earth.**

This loop is the answer to *"what now?"* after the visitor finds themselves. It feeds the last door.

### Acronyms to confirm with Orlando

- **MTRSYCW** — appears twice, tied to to-dos and the success cycle.
- **TBS** — appears alongside WDYLT, TI, leadership.
- **GIN** — the training the agent has gone through.
- **KTs** — appears in "content + KTs + progress."

## Agent presence on the homepage (Q4 answered)

The agent does **not** introduce itself first on the homepage. Plain copy does the hooking. The agent is **teased** before commitment, then enters fully **after Step 1**. So the visitor sees hints of the agent's presence early, but their first real conversation with it is once they've decided to start.

## Triangle on the homepage (Q6 answered)

The Triangle (NRG / VBRTN / FRQNCY) does **not** lead the homepage. The homepage focuses on the *experience* — find yourself → create from that bliss. NRG, VBRTN, and FRQNCY become visible **as the visitor moves through the flow**, each surface getting named when it's about to be relevant. Show, don't sell.

This matches the "experiment, not prescription" voice rule and the anti-attention-economy posture — we don't front-load architecture on a first-time visitor.

## Onboarding video placement (Q7 answered)

The video sits **after the first scroll down** from the homepage hero. The hero stays clean (Why hook + primary CTA + tiny secondary CTA). The video is the first thing the visitor meets *after* they choose to scroll — rewarding the small commitment of "I'm interested, show me more" with the clearest single-shot explanation of what FRQNCY is.

## Brand naming on the site today (Q8 answered)

NRG and VBRTN are **already real surfaces**, not concept-stage:

- **VBRTN** lives as the **app inside My FRQNCY**.
- **NRG Social** is the **social network and marketplace** (the canonical name is *NRG Social*, not bare *NRG*).

This means the homepage rework introduces nothing new in terms of brand architecture — it just makes the existing Triangle legible as the visitor moves through the flow.

## Tesla quote (Q9 answered)

The Tesla quote sits **directly below the Triangle**, wherever the Triangle is revealed inside the journey. Not on the homepage hero, not in the footer — it's the anchor under the diagram that names the three.

> "If you want to understand the universe, think in terms of energy, vibration and frequency." — Tesla

## Primary CTA (Q5 answered)

- **Primary CTA:** *"Tell us where you're at"* → opens the **My FRQNCY intake questionnaire** (this is Step 1 of the journey — homepage CTA and the agent's first prompt are the same sentence).
- **Secondary CTA, smaller, below:** *"See how it works (90 sec)"* → the onboarding video.
- **No signup wall at the gate.** Account creation is offered *after* the agent has produced something worth keeping (charts, future-you assistant, daily check-ins).
- Reference for the intake: `proposals/MY-FRQNCY-VBRTN-COMPANION-2026-05-22.md` (per CLAUDE.md — the intake questionnaire v0 and the four-shape companion architecture).

## Onboarding video

An onboarding video makes sense — short, grounded, explains the triangle and the "find yourself → express yourself" arc without spiritual cliches.

## Editorial guardrails (from CLAUDE.md + voice playbook)

- No leaderboards, no "calls" framing, no ranking people.
- Frame practices as experiments, not prescriptions.
- Every teaching lives on the site; external links are footnotes, not destinations.
- Voice attributes per `proposals/FRQNCY-VOICE-PLAYBOOK.md` — read before writing any copy.

## Open questions / to confirm with Orlando

- What exactly is the next action (CTA) for someone who's hooked? Account? Pocket agent? Explore page? Onboarding video?
- Does the onboarding video sit on the homepage hero, or behind a "start here" link?
- How explicit do we make the Triangle on the main page vs. let it emerge?
- Where do NRG and VBRTN live as named brands today — already on the site, or to be introduced?
- Tesla quote: use as hero, footer, or onboarding-only?

## Next steps (pending Orlando)

- Orlando to finish "Note that…" direction.
- Then: draft a Why / How / What outline for the homepage hero before touching any HTML.

---

## Topic universe — handwritten check-in (2026-05-22)

Orlando checked in three handwritten pages capturing every topic currently in motion with an active to-do list. Transcribed below as faithfully as possible. Items I could not confidently read are marked **[?]** (uncertain) or **[illegible]** (couldn't read at all). Open questions for Orlando at the bottom of this section.

**Structural rule (per Orlando's clarification).** Every double-underlined heading on the pages is **its own island of to-dos** — a free-standing workstream, not a sub-item of anything else. The only exception is **"Wait für Valentino"**, which is a *bracket label* over the Funding island's legal cluster: it signals "this whole cluster is on hold pending Valentino", not a separate island. There are **29 islands** in total across the three pages.

### Page 1 — 8 islands

Each ▣ below is its own island.

▣ **My FRQNCY**
- Polls
- Convergence

▣ **Law and Constitution**
- (no sub-items written)

▣ **Funding** — the legal-setup cluster underneath is *bracketed* "Wait für Valentino" (hold-state, not an island):
- Legal setup — sub-arrow to "Deep maggies[?]" (uncertain)
- Goal: ~0% Tax — arrows to **Norman → Ambrosi[?]**
- Legal Sork[?] / "50% safe aufnehmen" → Valentino
- Jurisdictions: Paraguay / Estonia / Hungary
- Jurisdictions: BVI / Cayman / Dubai / Schweiz — annotation "prosperafiken[?]" (illegible)
- polystate.io
- Lucerne 1x 5000
- "FRQNCY language" (sits near the legal cluster — possibly a separate to-do inside Funding)

▣ **Domains** (the word after Domains is scratched — possibly "and [?]")
- (no sub-items written)

▣ **Sanctuary**
- (no sub-items written)

▣ **Dreambuilding**
- (no sub-items written)

▣ **Pillars**
- Selling / referrals
- Building
- Research
- Curation
- Settlement
- "[?]date" — partially obscured by paper edge (Update? Validate? Mandate?)
- "cast" — last item cut off (Broadcast?)

▣ **KTS** (or KIS — initials unclear)
- Data Tracking

### Page 2 — 11 islands

▣ **FRQNCY attention**
- (no sub-items written)

▣ **Visibility**
- "[illegible]" — looks like "SoSchade" / "SaSchole"
- "[illegible]" — looks like "Tonadepol"

▣ **Partnerships**
- (no sub-items written)

▣ **Brand boulevards[?]**
- FRQNCY (Network)
- NRG
- VBRTN

▣ **Aligned Goods**
- Suppliers
- "FRQNCY WNNO real Ref Ctrl[?]" — illegible string

▣ **Maps and Kalender**
- (no sub-items written)

▣ **World constellation**
- (no sub-items written)

▣ **Roadmap**
- (no sub-items written)

▣ **Podcasts + Interviews + Reactions + Discussions**
- Norman and Orlando → Podcast Fotos
- Call: Study + Orga + Reflexion → "Plus presse Anfragen (23 Jun[?])" + "B Linkereg[?]"
- Norman pic uploads und Orlando pic uploads
- Dropbox video → Captions search
- Opus clip, Clip.opus.pro → Cutout pic init und add Caption → White → Blue ink
- Shorts → Grid / Vid → Grid → regrepise[?] (probably "repurpose")

▣ **NRG**
- (no sub-items written)

▣ **Courses**
- (no sub-items written)

### Page 3 — 10 islands

▣ **Token Utility and Tokenomics**
- Veto council

▣ **Research Papers**
- (no sub-items written)

▣ **Physical Space**
- (no sub-items written)

▣ **Team**
- Norman → Legal
- Orlando → "Spetron[?] / Stetron[?]" → "Kry[?]" (illegible — possibly a crypto / structuring role)
- AI's

▣ **Pitch**
- (no sub-items written)

▣ **Canvases**
- Founderpal

▣ **Topics**
- (no sub-items written)

▣ **AI company / Jarvis / Bot / Trading assistant**
- Perplexity, Gemini etc.
- Codex, abacus ai
- Harness, Hermes
- kaggle, Huggingface
- "iron near claw[?]" — illegible
- "opendow[?]" — illegible (possibly OpenDoor / open DAO)
- "cource centosfertaijinl Atom[?]" — illegible bottom row

▣ **Socials . FRQNCY**
- (no sub-items written)

▣ **Watch and Movies**
- (no sub-items written)

### Things I could not read confidently — please correct

1. The two items under **Visibility** on page 2 — both words illegible to me.
2. "Deep maggies[?]" annotation on the Legal Setup line.
3. "Legal Sork[?]" — the word after Legal in the Valentino cluster.
4. "prosperafiken[?]" — the word next to the BVI/Cayman/Dubai/Schweiz jurisdictions.
5. "FRQNCY WNNO real Ref Ctrl[?]" under Aligned Goods.
6. The two items obscured at the bottom of **Pillars** (looks like "...date" and "...cast").
7. **KTS vs KIS** — which initials are these?
8. **Brand boulevards** vs "boulevard" — the word ending unclear.
9. Under **Team / Orlando**: "Spetron / Stetron → Kry" — what is this?
10. Three illegible items in the **AI company** list: "iron near claw", "opendow", "course centosfertaijinl Atom".
11. "B Linkereg[?]" annotation next to "Plus presse Anfragen (23 Jun)".

### Reading the snapshot

This is a complete topic universe — **29 islands**, each its own free-standing workstream with its own to-do list. The islands span every layer of FRQNCY: editorial (Topics, Research Papers, Watch and Movies), product (My FRQNCY, NRG, VBRTN inside Brand boulevards, Sanctuary, Courses, AI company), org (Team, Pitch, Canvases, Funding, Law and Constitution, Token Utility, Domains, Physical Space), distribution (FRQNCY attention, Visibility, Partnerships, Brand boulevards, Aligned Goods, Podcasts + Interviews + Reactions + Discussions, Socials . FRQNCY), and operating mechanics (Pillars, Roadmap, Maps and Kalender, World constellation, KTS / Data Tracking, Dreambuilding).

A few cross-links worth noting:
- The **Pillars** island (Selling/referrals, Building, Research, Curation, Settlement, …) overlaps but doesn't exactly match the eight pillars on the live roadmap (Curate · Educate · Research · Broadcast · Sell · Fund · Build · Settle). Worth reconciling.
- **NRG** appears as its own island on page 2, and also as a member of the **Brand boulevards** island alongside FRQNCY (Network) + VBRTN. Both placements are intentional — NRG is both a brand-architecture peer and a workstream with its own to-dos.
- **Team** confirms the AI's as a first-class member alongside Norman + Orlando — fits the harness architecture.
- **Funding** is the island where the legal cluster sits behind the **"Wait für Valentino"** bracket — the cluster is on hold pending Valentino's input, but Funding itself is still an active island.
