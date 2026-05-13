# FRQNCY Telegram Channel — Launch Playbook

*Step-by-step for building the FRQNCY Telegram channel (task #68 — aufbauen).*

*Created: 2026-05-12. Status: ready to execute.*

---

## Goal

A public Telegram channel that becomes the daily heartbeat of the network — drops, picks, links, signal. Broadcast-first; a discussion group attaches later.

**Estimated effort:** ~2 hours of setup, then ~30 min/week to keep alive once content rhythms are running. The TG-Topic agent (task #49) is what makes it sustainable past month three.

---

## Step 1 · Decide channel type *(5 min)*

- **Channel** (recommended): one-way broadcasts. Admins post, members read. Cleanest for "the FRQNCY voice."
- **Group**: two-way. Better as Step 2 once there's a community to host.

**→ Go with Channel for v1. Attach a discussion group once ~200 subs.**

---

## Step 2 · Create the channel *(10 min)*

1. Open Telegram → ☰ → **New Channel**.
2. **Name:** `FRQNCY` (or `FRQNCY · The Network`).
3. **Public username:** `@frqncy_network` (or `@frqncy_official` if first is taken).
4. **Channel photo:** the FRQNCY favicon SVG, exported as 512×512 PNG.
5. **Description** (under 255 chars):
   > A topic graph for consciousness. A reading list with conviction. A fund underneath. Daily signal from the network.

---

## Step 3 · Bootstrap the look *(15 min)*

- **Pin a welcome message** — 3–4 lines describing what the channel is and isn't. Link to `/about`.
- **Post the manifesto's three lines as the first real post:**
  > FRQNCY is the spear piercing into the darkness.
  > We empower the empowerers.
  > And we make the unable able.
- **Enable "Sign messages"** — each admin post shows who wrote it. Matters once there are multiple admins.
- **Slow-mode:** off (channels don't have it).

---

## Step 4 · Cross-link the network to the channel *(20 min)*

Add `https://t.me/frqncy_network` to:

- Site footer
- `/about` page → Community section
- Global header → Community dropdown (add "Telegram" entry alongside Podcast / NRG / Membership / Sanctuary)
- Email signature
- X / Twitter bio
- LinkedIn page

Also add `<link rel="me" href="https://t.me/frqncy_network">` to the homepage `<head>` for verifiable identity.

---

## Step 5 · Posting rhythm — pick one and hold it *(decide now)*

A channel with no rhythm dies. Three options:

| Cadence | When | Pros | Cons |
|---|---|---|---|
| **Daily drop** | Every day, 09:00 local | Builds habit fast | Hard to sustain quality |
| **Three-times-a-week** *(recommended)* | Tue / Thu / Sat 09:00 | Sustainable; high quality bar | Slower growth |
| **Weekly digest** | Sunday only | Lowest effort | Misses momentum compounding |

**→ Recommend Tue/Thu/Sat. One post = one thing worth reading.**

---

## Step 6 · Five content formats — rotate so the channel feels alive

1. **The Pick** — one book / film / video / person with FRQNCY-voice bio + link to the network entry.
2. **The Topic** — short essay (300–400 words) on one topic from `content.json`.
3. **The Quote** — single line from a FRQNCY-curated source, attributed, with a link to the originator's page.
4. **The Drop** — what's new on the site this week (use the auto-summary from SPECS-INTEGRATIONS §5 once built).
5. **The Open Question** — something the editorial team is wrestling with. Invites replies via DM.

---

## Step 7 · Queue the first 14 posts before launch

Don't launch with an empty channel. Pre-queue:

- **Day 1 (pinned):** Welcome + the manifesto lines.
- **Days 2-14:** Cycle through the five formats. Pull material from existing surfaces — every entity on the site is potential post material.

Use Telegram's **scheduled messages** (long-press send → schedule) so they ship automatically.

### Sample 14-post queue

| Day | Format | Source |
|---|---|---|
| 1 | Pinned welcome | manifesto lines |
| 2 | The Pick | `b-the-bitcoin-standard` |
| 3 | The Topic | `t-networkstates` |
| 4 | The Quote | Yogananda from `b-autobiography-of-a-yogi` |
| 5 | The Pick | `m-frequency-movie` |
| 6 | The Drop | What landed on the site this week |
| 7 | The Open Question | "Spiritual technology / materialism — both?" |
| 8 | The Pick | `p-shi-heng-yi` |
| 9 | The Topic | `t-charter-cities` |
| 10 | The Quote | Ruskin from `b-unto-this-last` |
| 11 | The Pick | `pl-essencia` |
| 12 | The Topic | `t-abilities` |
| 13 | The Quote | Trungpa on spiritual materialism |
| 14 | The Drop | Week's network additions |

---

## Step 8 · Bot integration *(later — once TG-Topic exists, task #49)*

The `SPECS-AGENTS.md` doc covers this. Once `TG-Topic` and `TG-Harness` are built, posting to the channel becomes part of the harness:

- Every commit to `books.json` / `people.json` / `content.json` can auto-draft a TG post for review.
- Every published podcast episode triggers a "new episode" post.
- The weekly auto-summary (SPECS-INTEGRATIONS §5) auto-publishes Saturday at 18:00 UTC.

Until those agents are built, every post is hand-written or scheduled manually. That's fine for the first 3 months.

---

## Step 9 · Growth — earn the audience, don't beg for it *(month 2+)*

Don't promote the channel until you have **30 posts on it**. People who arrive at an empty channel never come back.

After 30 posts:

- Soft launch to the existing FRQNCY mailing list.
- Cross-post from the X / Substack audience.
- Add a "Subscribe on Telegram" CTA in the homepage marquee + newsletter signup form.

---

## Step 10 · Add to the site *(once channel exists)*

- Add Telegram link to the canonical header → Community dropdown.
- Embed the channel widget on `/podcast` and `/social/` — Telegram's official embed at `https://t.me/<channel>?embed=1`.
- Add the channel to `<meta property="og:see_also">` on key pages for SEO.

---

## What success looks like

- **Month 1:** 50–100 subs. Mostly people you personally invite. Pinned post + 14 scheduled posts shipped.
- **Month 3:** 300–500 subs. Cross-posts kicking in. First members posting their own picks to the editorial team for inclusion.
- **Month 6:** 1,000+ subs. TG-Topic agent live. Telegram is a real channel in the FRQNCY content rotation, not an afterthought.
- **Month 12:** 5,000+ subs. The Telegram is one of the three primary distribution surfaces (alongside the website and the podcast).

---

## What kills it

Three failure modes to avoid:

1. **Sporadic posting.** Two posts a week is fine. Two posts a month means the channel is dead.
2. **Marketing-voice posts.** Anything that reads like marketing in any other channel reads like marketing here, only worse. Every post passes the voice playbook.
3. **Engagement-baiting.** No "What do you think?" if you don't actually want the answer. No "Drop a 🔥 if you agree." That's not the FRQNCY voice.

---

## Cross-references

- `proposals/SPECS-AGENTS.md` — TG-Topic and TG-Harness agent specs
- `proposals/SPECS-INTEGRATIONS.md §5` — auto-summary feeding into TG
- `proposals/FRQNCY-VOICE-PLAYBOOK.md` — what every post has to clear
- `proposals/MASTER-ROADMAP.md` Layer 5 — Telegram in the social/comms stream
