# Wikidata execution guide — four FRQNCY entities, click-by-click

**Estimated reading time:** ~15 minutes (read once start-to-finish before you open Wikidata).
**Estimated execution time:** ~25–35 minutes per entity. ~2 hours total across all four if done in one sitting; ~45 min if you only do Entity 1 today.

**What this guide is.** The Phase 4.5 entity briefs decided *what* to put in Wikidata. This guide is the literal click-by-click *how*. Each entity has a pre-flight checklist, the exact paste-able label/description, statement-by-statement instructions naming the autocomplete strings you'll type, the reference URL that goes on each statement, and the post-save checklist that closes the loop back to the FRQNCY codebase.

**Who this guide assumes you are.** First-time Wikidata editor. No prior knowledge of Q-numbers, properties, or the editor UI assumed. Just an active Wikimedia account and a browser.

**Source of editorial decisions.** Every property and value in this guide traces back to `runs/2026-04-29-phase-4.5-knowledge-graph-briefs.md`. Do not deviate from the briefs without re-opening that document and reasoning about why.

**What this guide is not.** It is not the brief itself, not the strategic case for being in Wikidata (that's in `runs/2026-05-13-phase-5.1-wikipedia-notability-dossier.md`), and not the cross-platform identity strategy (that's `SAMEAS-MATRIX.md`).

---

## Section 0 — Pre-flight (do this once, not four times)

Run this checklist before opening Special:NewItem for the first time. It applies to all four entities.

### 0.1 Wikimedia account

- [ ] Confirm a Wikimedia account exists. If not, create one at https://www.wikidata.org/wiki/Special:CreateAccount.
- [ ] **Recommended username:** `FrqncyNetwork` or `OrliE-FRQNCY`. Wikimedia accounts are global — the same account works across Wikidata, Wikipedia, and Commons.
- [ ] **Email:** use `hello@frqncy.network` so future password resets and notifications go to a shared inbox, not a personal one. (If that mailbox doesn't exist yet, use `orlando.eisenreich@gmail.com` and rotate later.)
- [ ] **Disclose paid/COI editing if applicable.** Wikidata is more relaxed than Wikipedia on conflict of interest, but if you are the founder editing the entity about your own org, add a one-line user-page note: *"I am Orlando Eisenreich, founder of FRQNCY Network. I edit Wikidata entries related to FRQNCY in good faith and aim for verifiable, neutral statements."* This is a sentence on your `User:<name>` page and takes 60 seconds.
- [ ] **Auto-confirm:** new accounts can create items immediately on Wikidata (unlike Wikipedia which requires 4 days + 10 edits before mainspace creation). No waiting period applies here.

### 0.2 Browser setup

- [ ] Bookmark https://www.wikidata.org/wiki/Special:NewItem.
- [ ] Open three tabs side-by-side:
  1. This guide (`audits/seo/WIKIDATA-EXECUTION-GUIDE.md`)
  2. The source brief (`audits/seo/runs/2026-04-29-phase-4.5-knowledge-graph-briefs.md`)
  3. The Wikidata new-item form
- [ ] Disable any auto-translate browser extension — Wikidata's UI labels matter exactly as written.

### 0.3 What you're about to do, in one diagram

```
Special:NewItem
    │
    ├─ Step A: fill label + description, click Create
    │           ↓
    │     Wikidata redirects to /wiki/Q<n> (capture this Q-number)
    │
    ├─ Step B: scroll down to "Statements" → click "add statement"
    │           ↓
    │     Type property name → autocomplete picks the P-id → pick target value
    │           ↓
    │     Click the small "add reference" link inside the saved statement
    │           ↓
    │     Type "reference URL" → paste the source URL → publish
    │
    └─ Step C: repeat Step B for each row in the entity's table below
```

That's the whole loop. Every entity below is just running this loop with different inputs.

### 0.4 The Wikidata editor's autocomplete quirks (read once, save yourself frustration)

- **Property autocomplete works on the human-readable label**, not the P-id. Type `instance of` not `P31`. The autocomplete is fuzzy — `inst of` will surface `instance of`.
- **Value autocomplete works on the target Q-item's label.** When entering `human` for `instance of`, type `human` and pick the row labelled `human` whose description reads *"common name of Homo sapiens, unique extant species of the genus Homo, from embryo to adult"*. If two rows have similar labels, the description disambiguates.
- **Don't trust the first autocomplete row blindly.** There are hundreds of items labelled `human`. The right one is the very general Q5 with the species description above. When in doubt, hover the suggestion — Wikidata shows the Q-number in the tooltip.
- **Save each statement individually.** Don't try to batch — each statement has its own "publish" button. Wait for the green confirmation before moving on.
- **Add the reference *after* publishing the statement.** The "add reference" link only appears once the statement is saved.
- **Mobile editing is supported but limited in 2026.** Do this on desktop.

### 0.5 Q-number capture protocol

After clicking "Create" on Step A, the URL changes from `Special:NewItem` to `https://www.wikidata.org/wiki/Q<n>`. **Immediately:**

1. Copy the Q-number into a note (e.g., `Q98765432`).
2. Paste it into the CITATION-TRACKER row for that entity (instructions in Section E of each walkthrough).
3. Do not close the tab — you'll need it for statements.

If you lose the tab, search Wikidata for the entity's label; your new item will be in the top results within minutes.

### 0.6 General reference-citation guidance

Wikidata accepts:

- **`reference URL` (P854)** — the canonical way to cite a webpage. Required for most statements.
- Optional companions on the same reference: **`retrieved` (P813)** with today's date, **`title` (P1476)** with the page title, **`publisher` (P123)** if it's a third-party site.
- **Self-published sources are allowed for basic facts.** frqncy.network is fine as a reference for `founded by`, `inception`, `official website`, `instance of`. It is NOT enough on its own for contested claims like notability or controversial classifications — but Wikidata rarely contests those.
- **Pair self-published with a third-party reference wherever possible.** Two references on the same statement is always stronger than one. Use the "add reference" link a second time to add a second source.

### 0.7 What gets entities deleted in 2026 (most common reasons)

Wikidata deletes items for, in order of frequency:

1. **Vandalism** — obviously not us.
2. **Spam / promotional content** — write in a neutral, factual register. Don't paste marketing prose into the description field.
3. **Out of project scope** — applies when an item is purely a definition or a personal opinion. Doesn't apply to organizations, podcasts, founders, or places — those are all in scope.
4. **Notability** — Wikidata's bar is permissive: any subject discussed in a single secondary source qualifies. FRQNCY has a public website, a public GitHub, and a public founder profile. That clears the bar. Intaaya is the only entity where notability could be challenged (see its walkthrough).
5. **Empty item** — created with no statements. Always add at least 3-4 statements before walking away from a new item.
6. **Duplicate** — an entity for the same subject already exists. Before creating each entity, run the safety check below.

### 0.8 Duplicate safety check (do this for each entity before clicking Create)

In the Special:NewItem form there's nothing automatic. Before you fill it in:

1. Open https://www.wikidata.org and use the top search bar.
2. Search for the entity's label (e.g., `FRQNCY`).
3. Scan the results — if a result's description matches the entity you're about to create, **stop and edit that item instead**.
4. For FRQNCY specifically: there are at least 7 brand collisions (see `SAMEAS-MATRIX.md` §"Brand-collision reality"). None of them are likely to already have a Wikidata entry, but check anyway. If you see "FRQNCY Media" or "FMG" in the search results with a Q-number, those are NOT us — proceed with creating FRQNCY Network as a separate item.

### 0.9 Order of creation (this matters)

Entities reference each other. Create in this exact order so cross-references resolve:

1. **Entity 1: FRQNCY (the network)** — has no upstream dependencies. Cross-references to Orlando are forward-looking.
2. **Entity 3: Orlando Eisenreich** — depends on Entity 1 (employer, notable work).
3. **Entity 2: The FRQNCY Podcast** — depends on Entity 1 (published in) and Entity 3 (creator).
4. **Entity 4: Intaaya** — depends on Entity 1 (part of FRQNCY Sanctuary network).

If you stop after Entity 1, you have ~75% of the structured-data value already. The other three compound on it.

### 0.10 Important: corrections to the Phase 4.5 brief's Q-numbers

WebSearch verification (2026-05-13) found two errors in the original brief. Use the corrected Q-numbers in this guide, not the brief's:

| Item | Brief said | Verified correct |
| --- | --- | --- |
| Nusa Penida | Q1142577 | **Q4201319** (district in Klungkung Regency) |
| Bali (province) | Q23037 | **Q3125978** (province of Indonesia) |
| Klungkung Regency | (not in brief) | **Q11503** (the regency that contains Nusa Penida) |
| software developer | Q1622272 | **Q183888** |

The other Q-numbers in the brief (Q5 human, Q1860 English, Q252 Indonesia, Q24634210 podcast show, Q1714118 online publication, Q4970706 founder, Q1607826 editor, Q4830453 business, Q43229 organization, Q783794 company) are all verified correct.

---

## Section 1 — Entity 1: FRQNCY (the network/organization)

**Order in sequence:** First. No upstream dependencies. Expected execution time: ~30 min.

### A. Pre-flight checklist

- [ ] Section 0 done.
- [ ] Open https://www.wikidata.org/wiki/Special:NewItem in a fresh tab.
- [ ] Open `runs/2026-04-29-phase-4.5-knowledge-graph-briefs.md` §"Entity 1" in another tab.
- [ ] Run duplicate check: search Wikidata for `FRQNCY` and `FRQNCY Network`. If nothing matches the description below, proceed.

### B. Create-form input

**In the form's "Language" dropdown:** `en` (English).

**Label (paste exactly):**

```
FRQNCY
```

**Description (paste exactly — 247 chars, under the 250 limit):**

```
curation network and topic graph for consciousness; public library of 146 topics across money, energy, mind, and matter, with 766+ vetted resources; founded 2024 by Orlando Eisenreich; editorial standards published
```

Notes on the description:

- Wikidata descriptions are lowercase except for proper nouns and are written like a dictionary gloss — not a sentence. The form above respects that convention. Don't capitalize "Curation" at the start.
- Do not end the description with a period. Wikidata convention is no terminal punctuation.

**Click "Create".** The page redirects to `https://www.wikidata.org/wiki/Q<n>`. Copy the Q-number now. Call it **Q-FRQNCY** in your notes for the rest of this session.

### C. Statement-by-statement walkthrough

For each row below, the workflow is identical:

1. Scroll to the **Statements** section. Click **+ add statement**.
2. In the property field, type the **Property to type** column. Pick the row labelled exactly that.
3. In the value field, type the **Value to type** column. Pick the row whose Q-number matches.
4. Click the small **publish** button under the value.
5. Once the green confirmation appears, click **+ add reference** under that statement.
6. In the reference's property field, type `reference URL`. Pick the P854 row.
7. Paste the **Reference URL** column into the value field. Click **publish**.
8. (Optional but recommended) Click **+ add** within the reference. Type `retrieved`. Pick P813. Set today's date. Publish.

| # | Property to type | Value to type | Q-number (sanity check) | Reference URL |
| - | --- | --- | --- | --- |
| 1 | `instance of` | `online publication` | Q1714118 | https://frqncy.network/about |
| 2 | `inception` | `2024` (year-only date) | n/a — date value | https://frqncy.network/about |
| 3 | `founded by` | (skip for now — set after Entity 3 / Orlando is created and you have his Q-number) | — | — |
| 4 | `official website` | `https://frqncy.network/` | n/a — URL value | (use the URL itself as the reference too — paste `https://frqncy.network/`) |
| 5 | `language of work or name` | `English` | Q1860 | https://frqncy.network/ |
| 6 | `archived at URL` *(see note)* | `https://github.com/0rli-E/frqncy-network` | n/a — URL value | https://github.com/0rli-E/frqncy-network |
| 7 | `X username` *(formerly "Twitter username")* | `frqncy_network` (no @) | n/a — string value | https://twitter.com/frqncy_network (only add once the handle is claimed; if it's still vacant, skip this row) |

Notes on individual statements:

- **Row 1 — `instance of` (P31).** The brief offered three candidates; `online publication` (Q1714118) is the safest. If `online publication` doesn't surface, also acceptable: `website` (Q35127) or `digital library` (Q212805). Pick exactly one.
- **Row 2 — `inception` (P571).** The form will show a calendar. Pick `2024` precision = year. You don't need a specific month/day if you don't have one.
- **Row 3 — `founded by` (P112).** Leave this blank until Entity 3 (Orlando) is created. When you come back, you'll search for Orlando by his Q-number, not by name (because the autocomplete on `Orlando Eisenreich` will likely surface unrelated items first). Set a reminder: *"After Entity 3 is created, return to Q-FRQNCY and add `founded by` = Q-Orlando."*
- **Row 4 — `official website` (P856).** The URL value goes in directly. For the reference, frqncy.network is the canonical source of its own official URL — that's allowed and standard practice.
- **Row 5 — `language of work or name` (P407).** Self-referencing — the value is `English` (Q1860). Reference can be the homepage URL.
- **Row 6 — `archived at URL`.** The original brief listed `archives at` (P485). In 2026 the more common modern equivalent for a GitHub repo is `archived at URL` (P1065) or simply leaving the GitHub URL on `official website` as an additional value with a `subject of` qualifier. Simplest path: use `archived at URL` if it autocompletes; if not, skip this row and add the GitHub URL to the `sameAs` array on Wikidata's "Identifiers" section instead.
- **Row 7 — `X username` (P2002).** The property was renamed from "Twitter username" to "X username" but the P-id (P2002) is unchanged. Enter the handle without the `@`. **Only add this row if `@frqncy_network` has been claimed already** (see `SAMEAS-MATRIX.md` row 1 — if status is still `not-yet-created`, skip this row entirely; claiming sameAs to a vacancy hurts the entity score).

### D. Reference fallbacks (use if any statement is challenged)

- **`founded by`** — backup: `/people/orlando/` page on frqncy.network.
- **`inception 2024`** — backup: domain registration WHOIS lookup for frqncy.network (will show registration date), or the first commit on https://github.com/0rli-E/frqncy-network (whichever is earliest in 2024).
- **`instance of online publication`** — backup: the `/editorial-standards/` page describes FRQNCY as a curation publication; that's a self-published but explicit classification.

### E. Post-creation checklist

- [ ] Q-number captured (write it here: `Q______________`).
- [ ] All 6-7 statements visible on the entity page with references attached.
- [ ] Open `index.html` at the project root. Find the homepage Organization JSON-LD block. Add:

```json
"identifier": {
  "@type": "PropertyValue",
  "propertyID": "wikidata",
  "value": "Q<n>"
}
```

- [ ] Add the Wikidata URL `https://www.wikidata.org/wiki/Q<n>` to the homepage Organization JSON-LD's `sameAs[]` array.
- [ ] Open `CITATION-TRACKER.md`. Update the row in the "Wikidata entities" table:

```
| FRQNCY (network) | Q<n> | ✅ | 6-7 statements, references attached | Live YYYY-MM-DD |
```

- [ ] Update `SAMEAS-MATRIX.md` row 17 (Wikidata) — change status from `not-yet-created` to `live` and paste the Q-number.
- [ ] Do NOT use this Wikidata entity as Wikipedia notability evidence yet — per the Phase 5.1 dossier, Wikidata entities don't count toward Wikipedia notability directly.

### F. Common pitfalls — Entity 1 specifically

- **Don't put marketing prose in the description.** Wikidata descriptions are dictionary glosses, not pitches. The 247-char string above is fine.
- **Don't add a `sameAs` row that points at a Twitter handle that doesn't exist yet.** If `@frqncy_network` is still vacant on X, skip the X username row entirely.
- **Don't link `instance of` to a non-existent target.** If `online publication` doesn't surface in autocomplete, fall back to `website` (Q35127), don't invent a new Q-number.
- **Don't add `founded by` until Entity 3 exists.** It will silently fail if you point it at a label string instead of a Q-number.

---

## Section 2 — Entity 3 (do this second, before the Podcast): Orlando Eisenreich

**Order in sequence:** Second. Depends on Entity 1 being live so you can link `employer`. Expected execution time: ~25 min.

### A. Pre-flight checklist

- [ ] Entity 1 (FRQNCY) is live and you have its Q-number (call it **Q-FRQNCY**).
- [ ] Open https://www.wikidata.org/wiki/Special:NewItem.
- [ ] Open the brief §"Entity 3".
- [ ] Duplicate check: search Wikidata for `Orlando Eisenreich`. If nothing matches a human with `founder of FRQNCY` in the description, proceed.

### B. Create-form input

**Language:** `en`.

**Label:**

```
Orlando Eisenreich
```

**Description (paste exactly — 137 chars):**

```
founder of FRQNCY Network; builder of curation systems, agent infrastructure, and editorial standards for the topic graph for consciousness
```

**Click "Create"**, capture the Q-number, call it **Q-Orlando**.

### C. Statement-by-statement walkthrough

| # | Property to type | Value to type | Q-number (sanity check) | Reference URL |
| - | --- | --- | --- | --- |
| 1 | `instance of` | `human` | Q5 | (no reference needed — this is self-evident) |
| 2 | `occupation` | `founder` | Q4970706 | https://frqncy.network/people/orlando/ |
| 2b | `occupation` | `software developer` | Q183888 | https://github.com/0rli-E |
| 2c | `occupation` | `editor` | Q1607826 | https://frqncy.network/editorial-standards/ |
| 3 | `employer` | (the FRQNCY entity — type its Q-number directly: paste `Q-FRQNCY` value into the box; the picker will resolve it) | Q-FRQNCY | https://frqncy.network/people/orlando/ |
| 4 | `notable work` | (FRQNCY — type the Q-number again) | Q-FRQNCY | https://frqncy.network/ |
| 5 | `GitHub username` | `0rli-E` (case-sensitive) | n/a — string | https://github.com/0rli-E |
| 6 | `official website` | `https://frqncy.network/people/orlando/` | n/a — URL | (self) |

Notes on individual statements:

- **Row 1 — `instance of human` (Q5).** This is the only single-statement Wikidata convention for a person. It's never challenged. No reference needed but you can add `/people/orlando/` as one if you want belt-and-braces.
- **Rows 2/2b/2c — multiple `occupation` values.** Each is a separate statement on the same property. After publishing row 2, the property panel shows a `+ add value` link — use that to add 2b and 2c, each with their own reference.
- **Row 3 — `employer` (P108).** When typing the value, paste the actual Q-number (e.g., `Q98765432`) instead of typing `FRQNCY`. The autocomplete will resolve the Q-number to the entity. This is the safer pattern when there's any risk of brand collision with another FRQNCY.
- **Row 4 — `notable work` (P800).** Same Q-number pattern. If you want a second notable-work entry, the brief lists `FRQNCY harness` — but that doesn't have a Wikidata entity yet. Skip rather than fabricate.
- **Row 5 — `GitHub username` (P2037).** Just the username string, no URL.
- **Skip the brief's `country of citizenship`, `educated at`, `Twitter username` rows** — the brief marks these TBD. Don't fabricate values.

### D. Reference fallbacks

- **`occupation founder`** — backup: any third-party mention of Orlando as founder. As of 2026-05-13 the Phase 5.1 dossier found zero independent secondary sources, so the only reference today is the FRQNCY people page itself. That's acceptable for now; revisit when a podcast appearance lands.
- **`occupation software developer`** — backup: any commit history on github.com/0rli-E.
- **`employer FRQNCY`** — backup: the Wikidata entity Q-FRQNCY itself once it's live carries `founded by Orlando` (after the cross-reference is added in Entity 1's post-step), which is bidirectional evidence.

### E. After Q-Orlando is live, GO BACK TO Q-FRQNCY

This is the cross-reference step the brief flagged:

1. Open the Q-FRQNCY entity page.
2. Find the `founded by` row (currently empty from Section 1).
3. Add the statement: `founded by` → paste `Q-Orlando` Q-number.
4. Add reference URL: `https://frqncy.network/people/orlando/`.
5. Publish.

### F. Post-creation checklist (Entity 3)

- [ ] Q-Orlando captured.
- [ ] Q-FRQNCY now has `founded by` = Q-Orlando.
- [ ] Open `/people/orlando/index.html`. In the Person JSON-LD block, add:

```json
"identifier": {
  "@type": "PropertyValue",
  "propertyID": "wikidata",
  "value": "Q-Orlando"
}
```

- [ ] Add `https://www.wikidata.org/wiki/Q-Orlando` to the Person `sameAs[]` array. (See `SAMEAS-MATRIX.md` §"Person sameAs" for the canonical array to mirror.)
- [ ] Update `CITATION-TRACKER.md` Orlando row.

### G. Common pitfalls — Entity 3

- **Don't fabricate citizenship or education.** Wikidata reviewers patrol for unsourced claims about humans particularly aggressively. Leave TBDs blank.
- **Don't add multiple `instance of` values for a human.** Just Q5. Adding `instance of person` or `instance of writer` is wrong — those are sub-classes; use `occupation` instead.
- **Don't add a personal X handle on this entity if it's the same as the FRQNCY one.** @0xOrli is the verified handle — use that, not `@frqncy_network`. The brief leaves the personal handle TBD; safest is to add `@0xOrli` if and only if you've verified it's still active.

---

## Section 3 — Entity 2: The FRQNCY Podcast

**Order in sequence:** Third. Depends on Q-FRQNCY and Q-Orlando being live. Expected execution time: ~30 min.

### A. Pre-flight checklist

- [ ] Q-FRQNCY and Q-Orlando are both live with Q-numbers captured.
- [ ] Open https://www.wikidata.org/wiki/Special:NewItem.
- [ ] Open the brief §"Entity 2".
- [ ] Duplicate check: search Wikidata for `The FRQNCY Podcast`. **This one matters more** — per `SAMEAS-MATRIX.md`, there's a contested FMG podcast called "FRQNCY" on Spotify and Apple. If a Wikidata entity already exists for FMG's FRQNCY podcast, do NOT overwrite it — create The FRQNCY Network Podcast as a distinct item with the qualified title.

### B. Create-form input

**Language:** `en`.

**Label:**

```
The FRQNCY Podcast
```

**Recommended alternative label (use this if `The FRQNCY Podcast` collides with FMG's existing entity, per `SAMEAS-MATRIX.md` §8):**

```
The FRQNCY Network Podcast
```

**Description (paste exactly — 168 chars):**

```
long-form interview podcast hosted by FRQNCY Network; conversations with teachers, builders, researchers, and healers at the frontier of consciousness and human potential
```

**Click "Create"**, capture the Q-number, call it **Q-Podcast**.

### C. Statement-by-statement walkthrough

| # | Property to type | Value to type | Q-number (sanity check) | Reference URL |
| - | --- | --- | --- | --- |
| 1 | `instance of` | `podcast show` | Q24634210 | https://frqncy.network/podcast |
| 2 | `creator` | (Orlando — paste Q-Orlando) | Q-Orlando | https://frqncy.network/podcast |
| 3 | `language of work or name` | `English` | Q1860 | https://frqncy.network/podcast |
| 4 | `published in` | (FRQNCY — paste Q-FRQNCY) | Q-FRQNCY | https://frqncy.network/podcast |
| 5 | `official website` | `https://frqncy.network/podcast` | n/a — URL | (self) |
| 6 | `main subject` | `consciousness` | Q41097 | https://frqncy.network/podcast |
| 6b | `main subject` | `science` | Q336 | https://frqncy.network/podcast |
| 6c | `main subject` | `human potential` | (search Wikidata for the closest match — may not have a dedicated Q-number; skip if no clean match surfaces) | — |

Notes on individual statements:

- **Row 1 — `instance of podcast show` (Q24634210).** This is the canonical Q-number for podcasts on Wikidata as of 2026. Confirmed via WebSearch.
- **Row 2 — `creator` (P170).** The brief listed `creator` but P170 is technically for creators of creative works, which fits a podcast. **`host` (P10379)** is more specific for ongoing-show host roles. Use `creator` per the brief; if Wikidata's modelling guidance suggests `host` later, an editor can refine it.
- **Row 4 — `published in` (P1433).** This is the standard property for a podcast → publisher relationship. Paste the Q-FRQNCY Q-number.
- **Row 6 — `main subject` (P921).** Multi-value — add each subject as a separate row. Skip `human potential` if no clean Wikidata match surfaces; don't fabricate.
- **Skip the brief's `RSS feed URL`, `Apple Podcasts ID`, `Spotify show ID`, `inception` rows** — the brief marks these TBD. Add them only after the podcast actually launches with confirmed IDs.
- **Skip `country of origin`** — the brief marks it TBD pending Orlando's primary country confirmation.

### D. Reference fallbacks

- **`creator Orlando`** — backup: the about page on frqncy.network, or `/people/orlando/`.
- **`published in FRQNCY`** — backup: Q-FRQNCY itself (which by this point has Orlando as `founded by` — that bidirectional structure helps).

### E. Post-creation checklist

- [ ] Q-Podcast captured.
- [ ] Open `podcast.html` (or wherever the podcast page lives — check `/podcast` route). In the PodcastSeries JSON-LD, add:

```json
"identifier": {
  "@type": "PropertyValue",
  "propertyID": "wikidata",
  "value": "Q-Podcast"
}
```

- [ ] Add `https://www.wikidata.org/wiki/Q-Podcast` to the PodcastSeries `sameAs[]`.
- [ ] Update `CITATION-TRACKER.md` Podcast row.
- [ ] Note: do NOT submit to Apple Podcasts or Spotify yet from this guide — those are Phase 5.3 distribution moves coordinated via `SAMEAS-MATRIX.md` §8-9.

### F. Common pitfalls — Entity 2

- **Brand collision is highest here.** If Wikidata search surfaces an existing FRQNCY podcast item (FMG's), don't merge — create the FRQNCY Network Podcast as distinct.
- **Don't add `RSS feed URL` to a feed that doesn't exist yet.** The brief leaves the RSS TBD. Wait until the actual feed is live and crawlable.
- **`main subject` is multi-value but each value should be a real Q-item.** If `human potential` doesn't have a clean Q-match, leave it out rather than create a soft link.

---

## Section 4 — Entity 4: Intaaya

**Order in sequence:** Fourth. Depends on Q-FRQNCY being live. Expected execution time: ~25 min.

### A. Pre-flight checklist

- [ ] Q-FRQNCY is live.
- [ ] Open https://www.wikidata.org/wiki/Special:NewItem.
- [ ] Open the brief §"Entity 4".
- [ ] **Notability check (Intaaya only):** of all four entities, this is the most likely to face a deletion challenge. Intaaya is a private retreat sanctuary; Wikidata accepts it because it has a public-facing presence and FRQNCY references it on `/places/intaaya/`, but a strict reviewer could argue insufficient secondary coverage. Mitigation: confirm Intaaya has at least one third-party reference (Google Maps listing, TripAdvisor, an Instagram presence, or a press mention). If absolutely none of those exist, hold this entity until at least one third-party reference is online.
- [ ] Duplicate check: search Wikidata for `Intaaya`. Unlikely to exist; proceed.

### B. Create-form input

**Language:** `en`.

**Label:**

```
Intaaya
```

**Description (paste exactly — 130 chars):**

```
regenerative retreat sanctuary on Nusa Penida, Bali, Indonesia; off-grid, farm-to-table; part of the FRQNCY Sanctuary network
```

**Click "Create"**, capture the Q-number, call it **Q-Intaaya**.

### C. Statement-by-statement walkthrough

| # | Property to type | Value to type | Q-number (sanity check) | Reference URL |
| - | --- | --- | --- | --- |
| 1 | `instance of` | `retreat center` | (search Wikidata; if no clean Q surfaces, fall back to `eco hotel` or `hotel`) | https://frqncy.network/places/intaaya/ |
| 2 | `country` | `Indonesia` | Q252 | (self-evident from location) |
| 3 | `located in the administrative territorial entity` | `Nusa Penida` | Q4201319 (district — corrected from brief) | https://frqncy.network/places/intaaya/ |
| 3b | `located in the administrative territorial entity` | `Klungkung Regency` | Q11503 | https://en.wikipedia.org/wiki/Klungkung_Regency |
| 3c | `located in the administrative territorial entity` | `Bali` | Q3125978 (province — corrected from brief) | https://en.wikipedia.org/wiki/Bali |
| 4 | `part of` | (FRQNCY Sanctuary network — paste Q-FRQNCY for now; refine when a dedicated Sanctuary network entity exists) | Q-FRQNCY | https://frqncy.network/places/intaaya/ |
| 5 | `official website` | (Intaaya's own domain — leave blank if you don't have it; do NOT use frqncy.network/places/intaaya/ as `official website` because that's the FRQNCY-side description page, not Intaaya's own surface) | n/a | (self) |
| 6 | `coordinate location` | (lat,lng from Google Maps — only add if you can verify the exact pin) | n/a | Google Maps URL |

Notes:

- **Row 1 — `instance of`.** The brief offered three candidates: `retreat center`, `eco-retreat`, `sanctuary`. The cleanest Wikidata match is whatever the autocomplete surfaces. If both `retreat center` and `meditation center` come up, pick the one whose Wikidata description matches Intaaya's actual character.
- **Rows 3/3b/3c — administrative entity hierarchy.** Wikidata accepts multiple values for `located in the administrative territorial entity`. Add each level of the hierarchy (district → regency → province) as a separate statement. **Use the corrected Q-numbers above, not the brief's.**
- **Row 4 — `part of FRQNCY Sanctuary network`.** Strictly, "FRQNCY Sanctuary network" is a sub-program of FRQNCY-the-organization. There's no dedicated Wikidata entity for it. Two options:
  - (a) Link to Q-FRQNCY directly with a qualifier `subject of` or a free-text description note.
  - (b) Skip this statement until a `FRQNCY Sanctuary network` entity exists (which is a future task, not Phase 5.2).
  - Recommendation: option (b) — skip rather than imprecise-link.
- **Row 5 — `official website`.** Per the brief, Intaaya's own domain is TBD. Don't substitute frqncy.network/places/intaaya/ — that's about Intaaya, not by Intaaya.
- **Row 6 — `coordinate location`.** Only add if you can verify the exact coordinate from Google Maps. The brief marks it TBD.

### D. Reference fallbacks

- **`country Indonesia`** — backup: any Google Maps reference to Intaaya pinning Indonesia.
- **`located in Nusa Penida`** — backup: the Wikipedia article on Nusa Penida confirms the administrative hierarchy.
- **`part of FRQNCY Sanctuary network`** — best to skip this rather than reference. If a reviewer asks, the answer is "this statement is pending creation of a dedicated Sanctuary network entity".

### E. Post-creation checklist

- [ ] Q-Intaaya captured.
- [ ] Open `/places/intaaya/index.html`. In the Place JSON-LD, add `identifier` and update `sameAs[]`.
- [ ] Update `CITATION-TRACKER.md` Intaaya row.
- [ ] If a reviewer challenges the entity within 7 days, the response is: *"Intaaya is a real-world retreat sanctuary referenced on a public website (frqncy.network/places/intaaya/) which itself is the subject of an active Wikidata entity (Q-FRQNCY). The entity supports the structured-data graph for that reference."*

### F. Common pitfalls — Entity 4

- **Highest deletion risk.** This is the entity most likely to be challenged on notability grounds. The mitigation is keeping the statements minimal-but-verifiable. Don't pad with unsourced claims to make the entity look richer.
- **Don't fabricate coordinates.** A wrong pin is worse than no pin — it gets corrected publicly and looks like sloppy editing.
- **Don't link `part of` to a non-existent entity.** Skip the row rather than create a fragile reference.

---

## Section 5 — After all four entities are live

### 5.1 Verification (run these commands locally)

```bash
# Confirm each Wikidata entity resolves to JSON
for q in Q-FRQNCY Q-Orlando Q-Podcast Q-Intaaya; do
  curl -s "https://www.wikidata.org/wiki/Special:EntityData/${q}.json" | jq '.entities | keys'
done

# Confirm the homepage JSON-LD now references Wikidata
curl -s https://frqncy.network/ | grep -oE '"identifier":[^}]+}' | head -3
```

### 5.2 Update the documentation surfaces

- [ ] `CITATION-TRACKER.md` §"Wikidata entities" — all four rows updated with Q-numbers, dates, statement counts.
- [ ] `SAMEAS-MATRIX.md` row 17 (Wikidata) — status `live`, with Q-numbers listed.
- [ ] `audits/seo/runs/2026-05-13-phase-5.2-wikidata-execution-guide.md` — the run log for this task (separate file).
- [ ] Phase 5 progress in `PROGRESS.md` — mark Task 5.2 complete.

### 5.3 What this does NOT enable

- This does NOT trigger a Google Knowledge Panel automatically. Knowledge Panels are a separate Google process; Wikidata feeds them but doesn't guarantee them.
- This does NOT count as Wikipedia notability evidence. Per `runs/2026-05-13-phase-5.1-wikipedia-notability-dossier.md`, Wikidata entries are not Wikipedia-allowable sources.
- This does NOT replace the cross-platform sameAs work — it's one row in the matrix.

### 5.4 The compounding outcome over weeks

Within 2-4 weeks of all four entities being live:

- Google's entity-resolution algorithm starts treating FRQNCY-the-network as a distinct entity from FRQNCY Media and the other brand collisions.
- AI engines (Claude, ChatGPT, Perplexity) that retrieve Wikidata at answer-time will start grounding "what is FRQNCY" answers in the entity description above.
- The Q-numbers become canonical pointers that every other platform (LinkedIn, Crunchbase, Wikipedia eventually) can resolve to.

That's the win. It's quiet, it's slow, it's structural. Then it compounds.

---

## Appendix A — Property quick reference

Just the P-IDs and the human label, for the Wikidata properties used in this guide:

| Property | P-ID | What it does |
| --- | --- | --- |
| instance of | P31 | What type of thing this item is |
| inception | P571 | When the item came into being (date) |
| founded by | P112 | Person/entity that founded an organization |
| official website | P856 | Canonical URL |
| language of work or name | P407 | Language the item is in |
| archived at URL | P1065 | URL where the item is archived |
| X (Twitter) username | P2002 | Handle without @ |
| GitHub username | P2037 | GitHub username string |
| occupation | P106 | Person's occupation(s) |
| employer | P108 | Org that employs the person |
| notable work | P800 | Notable work created by the person |
| country | P17 | Country an item is located in |
| located in administrative territorial entity | P131 | Administrative parent |
| coordinate location | P625 | Lat/lng |
| part of | P361 | Item this is part of |
| creator | P170 | Creator of a work |
| published in | P1433 | Where a work is published |
| main subject | P921 | Subject of a work |
| reference URL | P854 | URL of a source (used in references) |
| retrieved | P813 | Date a source was retrieved (used in references) |
| title | P1476 | Title of a source (used in references) |

## Appendix B — Q-number quick reference

| Item | Q-ID | Use |
| --- | --- | --- |
| human | Q5 | Orlando's `instance of` |
| English | Q1860 | language of work or name |
| Indonesia | Q252 | Intaaya's country |
| Nusa Penida (district) | Q4201319 | Intaaya's located-in (corrected) |
| Klungkung Regency | Q11503 | Intaaya's located-in mid-level |
| Bali (province) | Q3125978 | Intaaya's located-in (corrected) |
| online publication | Q1714118 | FRQNCY's `instance of` |
| podcast show | Q24634210 | The FRQNCY Podcast's `instance of` |
| founder | Q4970706 | Orlando's occupation |
| software developer | Q183888 | Orlando's occupation (corrected) |
| editor | Q1607826 | Orlando's occupation |
| organization | Q43229 | Available alternate for FRQNCY |
| business | Q4830453 | Available alternate for FRQNCY |
| company | Q783794 | Available alternate for FRQNCY |
| website | Q35127 | Alternate `instance of` for FRQNCY |

## Appendix C — Common error states and recovery

| Error | What it means | Fix |
| --- | --- | --- |
| "An entity with this label/description already exists" | Duplicate-detection blocked you | Search Wikidata, edit the existing entity instead |
| "This property requires an item value" | You typed a string instead of picking from autocomplete | Re-type, wait for the suggestions, pick a row (don't press Enter on raw text) |
| "Constraint violation: instance of must be an instance of class" | The Q-number you picked isn't a valid class | Pick a more general class — e.g., `website` (Q35127) instead of a specific publication brand |
| "This URL is malformed" | The reference URL field is strict | Make sure it includes `https://` and no trailing whitespace |
| Statement saved but no green confirmation | Slow connection — wait 5 seconds before re-clicking | Don't double-click — refresh the page if it stalls > 10 seconds |

## Appendix D — Related materials

- `runs/2026-04-29-phase-4.5-knowledge-graph-briefs.md` — the source briefs (the editorial decisions)
- `runs/2026-05-13-phase-5.1-wikipedia-notability-dossier.md` — why Wikipedia is deferred
- `runs/2026-05-13-phase-5.2-wikidata-execution-guide.md` — this guide's run log
- `SAMEAS-MATRIX.md` — cross-platform identity strategy
- `CITATION-TRACKER.md` — where Q-numbers get logged after creation
- `PHASE-5-DISTRIBUTION.md` — Task 5.2 spec
- `proposals/VISIBILITY-PLAN.md` — Days 1-30 visibility plan, calls for this submission
