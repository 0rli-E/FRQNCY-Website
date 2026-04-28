# Session log — 2026-04-28 — content expansion + reclassification

A working session focused on filling out underdeveloped surfaces of the FRQNCY site, fixing a search bug, capturing Orlando's notebook vision, and cleaning up the "Teachers" framing on Watch. Written for the next agent so you can pick up cleanly.

---

## What shipped

### New topic pages

- **`/v2/world-models/`** — AI sub-topic. Hero, 7 curated resources (David Ha/Schmidhuber's *World Models* paper, LeCun's JEPA paper, World Labs, Genie, Wayve, Decart Oasis, Dwarkesh's LeCun interview), Related grid linking AI / Decentralised AI / AR-VR / Robotics. Purple AI accent.
- **`/v2/abilities/`** — Research / Metaphysics topic. *"Capacities humans can develop beyond the consensus baseline — remote viewing, OBE, lucid dreaming, telepathy, intuition, psychokinesis."* 8 resources (Journeys Out of the Body, Monroe Institute, IONS, Real Magic, Phenomena, Robert Monroe, Dean Radin, Stephen LaBerge). 3 FRQNCY picks.
- **`/v2/spirituality/`** — Research / Metaphysics topic created when Gary Spivey was reclassified out of Teachers. 5 starter resources (Be Here Now, Power of Now, Gary Spivey, Ram Dass, Sounds True). 2 FRQNCY picks.

### New places (`/places/`)

Places had 2 entries before this session (Intaaya + a placeholder for the FRQNCY Space). Now 8.

- **Intaaya** (Bali, Indonesia) — preexisting, FRQNCY PICK.
- **The Monroe Institute** (Faber, Virginia) — Hemi-Sync, Gateway Voyage, Stargate research connection. FRQNCY PICK.
- **Esalen Institute** (Big Sur, California) — human potential movement, founded 1962.
- **Findhorn Foundation** (Findhorn, Scotland) — ecovillage, founded 1962.
- **Plum Village** (Dordogne, France) — Thich Nhat Hanh's mindfulness centre, 1982.
- **Auroville** (Tamil Nadu, India) — universal city, founded 1968, UNESCO-endorsed.
- **Tassajara Zen Mountain Center** (Carmel Valley, California) — first Zen monastery in the West, 1967.
- **Schumacher College** (Devon, England) — ecology + regenerative economics, 1990.

Each has a hero with location, "The story" prose section (3 paragraphs), and a "Practices hosted here" grid linking back into the topic graph. Each is wired into `v2/explore-data.json` as a `p-*` node with internal `node_url` and graph links to relevant topics/domains. `places/index.html` rebuilt to list all 8 with a card grid.

### Watch library — new shelves and reclassifications

- **Inspiration** (`t-inspiration`) — new domain shelf with 3 Les Brown talks: Georgia Dome (PICK), Dream Is Possible, Ultimate Motivational Speech.
- **Channeling** (`t-channeling`) — new shelf with 27 videos:
  - **Stargate Experience (7):** Prageet Harris & Julieanne Conard channeled activations, Opening Sequence marked PICK.
  - **Bashar / Darryl Anka (20):** Follow Your True Excitement (PICK), Permission Slips, the 5-step formula (PICK), parallel realities, timeline shifting, DNA activation. Aubrey Marcus interview marked PICK as the entry point for skeptics.
- **Spirituality** (`t-spirituality`, under **Domains**) — Gary Spivey's full 23-video catalogue, moved from the previous `t-garyspivey` Teacher shelf.
- **Quantum Physics** absorbed Gregg Braden's 7 videos (Divine Matrix, heart-brain coherence, DNA, etc.). His original `t-braden` Teacher shelf was deleted.

Both reclassifications were driven by an explicit editorial rule: the **Teachers** collection on Watch is reserved for fully realised lineage holders. Gary Spivey and Gregg Braden don't fit. Neville Goddard, Osho, Sadhguru, Sai Maa, Kevin Trudeau remain.

### Audio

- `/v2/audio/` got a new **Listen** section above the hardware list, with **Earl Nightingale's "The Strangest Secret"** (1956) embedded via youtube-nocookie iframe. Source: `youtube.com/watch?v=yYbAoJ_701M` (the explicitly "Quality Recording" cut). Marked FRQNCY PICK. Also added to `resources.json` as type `recording`.

### Visual Art — Vladimir Kush

- Added Kush to `/v2/visual-art/` as a person FRQNCY PICK plus three works: *Departure of the Winged Ship*, *Sunrise by the Ocean*, *Metaphorical Voyage* (book). New filter tabs: `person`, `artwork`. `resources.json` updated; `search.json` `visual-art` resourceCount bumped 3 → 6.

### Crypto / Cryptocurrency

- Merged the curated resources from `/v2/cryptocurrency/` into `/v2/crypto/` (the channel hub). Updated all internal links across 10 pages, repointed `search.json`, `resources.json`, and `v2/explore-data.json` to `/v2/crypto/`.
- The `/v2/cryptocurrency/` redirect was **subsequently undone by Orlando** — that page is back to its full original content. The merged content on `/v2/crypto/` remains. Both pages now exist; treat that as Orlando's intent until told otherwise.

### Search bug fix

The search bar on `/v2/explore.html` previously only queried `search.json` (topics only), so typing a person/book/artwork name would return nothing. **Now it queries both `search.json` AND `resources.json`** with a unified results panel: topics first, then a "RESOURCES" divider, then resource matches. Resource clicks open the resource's external URL in a new tab; topic clicks navigate internally. Source change in `v2/explore.html` lines ~1030–1170. Graph-node highlighting also propagates from resource matches via their `topicSlug`.

### The vision doc

`proposals/VISION-1H-DEMO.md` — a clean transcription of Orlando's notebook capture from late April 2026, organized into seven thematic groups (product alive / site reads like a book / graph alive on its own / economy clear / first stack operational / we are using it / we have land / network of products). Treat as **north star, not roadmap**. The 90-day plan in `proposals/EXECUTION-PLAN-90D.md` is the current roadmap.

---

## Conventions established or clarified

- **Search has two surfaces.** `/search.html` indexes both topics and resources; the explore-page search bar (recently) does too. If you find a "why can't I search for X" issue, check whether X is in `resources.json` and whether the surface in question reads it.
- **Places get internal pages.** The older note in CLAUDE.md ("NODE_URL → external site, don't put them in resources.json") is partially superseded: places now have internal `/places/{slug}/` pages with stories + topic links. The `node_url` for a place can be either the internal page or the external site — both are in use. Each new place page is a one-off piece (cf. `proposals/TOPIC-COMMISSION-CONTEXT-GRAPH.md` philosophy).
- **The "Teachers" collection on Watch is editorial.** Reserved for fully realised lineage holders. Researchers, psychics, and synthesists go under topical shelves (Quantum Physics, Spirituality, etc.) — not Teachers.
- **Watch shelves come from `videos.json` + the inline copy in `v2/watch/index.html`.** When you add or move videos, edit *both*. The inline blob is the first paint; `videos.json` overrides on network refresh. Skipping the inline edit means the change doesn't show until the network fetch lands.
- **The site is a graph of pages, not just a content tree.** Each topic / place / book / person / org / media / music page is its own piece. They reference each other through `ncard` grids and through the explore-page graph (`v2/explore-data.json`). Edits to one usually need a corresponding update to the graph data.

---

## Files touched (high-level)

```
proposals/VISION-1H-DEMO.md              (new — north star)
proposals/SESSION-2026-04-28-CONTENT-EXPANSION.md  (this file)

v2/world-models/index.html               (new)
v2/abilities/index.html                  (new)
v2/spirituality/index.html               (new)

places/esalen/index.html                 (new)
places/findhorn/index.html               (new)
places/plum-village/index.html           (new)
places/auroville/index.html              (new)
places/tassajara/index.html              (new)
places/schumacher-college/index.html     (new)
places/monroe-institute/index.html       (new)
places/index.html                        (rebuilt grid)

v2/visual-art/index.html                 (Kush + artwork filter)
v2/audio/index.html                      (Listen section + Strangest Secret)
v2/artificial-intelligence/index.html    (Sub-topics section: World Models + Decentralised AI)
v2/crypto/index.html                     (merged in cryptocurrency content)
v2/cryptocurrency/index.html             (redirect → undone by user — full page is back)
v2/money/, v2/blockchain/, v2/defi/,
v2/dao/, v2/cards/, v2/conscious-capital/,
v2/stocks/, v2/commodities/,
v2/impact-investing/, v2/prosperity-mindset/  (link updates, all → /v2/crypto/)

v2/explore.html                          (search bar now queries resources.json too)
v2/explore-data.json                     (new place + topic nodes, link bumps,
                                          t-garyspivey removed, t-crypto label/url)
v2/watch/index.html                      (TOPIC_LABELS + INLINE_VIDEOS +
                                          INLINE_PLAYLISTS — new shelves +
                                          Spivey/Braden moves)

search.json                              (+t-world-models, +t-abilities, +t-spirituality;
                                          t-crypto repointed; visual-art picks bumped)
resources.json                           (~+30 entries across the changes; final
                                          totals around 770-780)
videos.json                              (+t-inspiration, +t-channeling,
                                          t-garyspivey → t-spirituality,
                                          t-braden merged into t-quantum, deleted)
playlists.json                           (-pl-spivey from c-teachers,
                                          +pl-spirituality in c-domains)
```

---

## Pending — open decisions or undone work

These were touched on but not closed in this session.

### Harness — Claude Agent SDK + Perplexity

Orlando wants to add two new provider lanes to the sibling repo `@frqncy/harness` (`/Users/orli/Documents/Claude/Projects/frqncy-harness/`):

- **Perplexity** — easy, OpenAI-compatible. Clone the `chutes` lane, change base URL to `https://api.perplexity.ai`, env var `PERPLEXITY_API_KEY`, default model `sonar-pro`. Suppress the harness's `web_search` tool when the model is `perplexity/sonar*` to avoid double-searching. Models to register: `sonar`, `sonar-pro`, `sonar-reasoning`, `sonar-reasoning-pro`.
- **Claude Agent SDK (`@anthropic-ai/claude-agent-sdk`)** — three architectural options were laid out:
  - **Option A** *(recommended first move)*: new `claude-sdk/<model>` provider lane sibling to `claude-code` and `codex`. The SDK runs its own tool loop; harness wraps for cost gates and trace capture. ~150 lines.
  - **Option B**: subagent spawning inside the existing `anthropic` lane via the SDK's `query()`. Gives Task-tool-like delegation. v0.8 feature.
  - **Option C**: replace the existing `anthropic` lane's loop with the SDK's loop entirely. More invasive; not recommended.

**Blocker:** the harness repo isn't mounted in this Cowork session. Either Orlando points Cowork at that folder, or future agent writes diffs to `outputs/` for manual copy.

### The FRQNCY Space + Lugano FRQNCY (places)

These are in the vision but not yet built as place pages. Orlando's call — they're his projects, future agents shouldn't make up details. When Orlando provides the brief, build them at `/places/the-frqncy-space/` and `/places/lugano-frqncy/` using the Intaaya/Esalen template. Add corresponding `p-*` nodes to `v2/explore-data.json`.

### Other items in the vision still on the "not yet" side

Quick list of high-leverage ones from `proposals/VISION-1H-DEMO.md`:

- *Charts help determine paths* — concrete chart on My FRQNCY that suggests next topics based on consumption.
- *Make the network sortable by jurisdiction (Goods)* — add a jurisdiction filter on `/aligned`.
- *Visibility automated → in video and text* — a "What's New" feed that auto-generates from recent additions.
- *All topic pages full of pictures and content* — audit which are still sparse and enrich a batch.
- *Subsector opt-ins for mail lists* — needs backend (Supabase / Cloudflare).
- *Membership prices live* — needs the pricing decision.
- *DeFi super app* — requires significant scope; future.

---

## Notes for the next agent

- The cryptocurrency redirect was reverted by Orlando. Don't try to redirect or delete `/v2/cryptocurrency/` again unless he explicitly asks.
- When adding videos to Watch, **edit both `videos.json` and the inline `INLINE_VIDEOS` blob in `v2/watch/index.html`**, otherwise the shelf only renders after a network refresh.
- The Teachers collection in `playlists.json` and `INLINE_PLAYLISTS` (under `c-teachers`) is now: Osho, Sadhguru, Kevin Trudeau, Sai Maa, Neville Goddard. Don't add researchers, psychics, or synthesists here — they go to topical shelves.
- The vision doc isn't a checklist. Don't strike-through items aspirationally; only after a thing is actually true on the live site.
- Orlando prefers: prose explanations in chat, single-line paste-able terminal commands, no `cd` prefix on shell commands (he's already in the project folder), no slogans like "Makes the unable able" (rejected — don't reach for similar framings).
- If the user/linter modifies a file and a system-reminder marks it intentional: don't revert it. Keep working with the new state.
- Git commits in this session were assembled but not always executed — sandbox can't write `.git/index.lock`. Orlando runs the actual commits/pushes from his terminal. Always provide a paste-ready commit block at the end of work.
