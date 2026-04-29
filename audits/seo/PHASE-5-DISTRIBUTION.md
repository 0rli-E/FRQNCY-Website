# PHASE 5 — Distribution & Backlinks

**Goal:** earn the off-page signals that compound for years — Wikipedia entries, Google Knowledge Graph, podcast appearances, partner backlinks, and organic mentions. This is the slowest phase by design and has the highest absolute ceiling.

**Prerequisites:** Phases 1-4 substantially shipped. Without the on-page foundation, off-page work doesn't compound — backlinks point at pages that aren't ready to rank.

**Done when:** Wikipedia entries are live (or formally refused with a clear path to retry), Knowledge Graph entry is detected, FRQNCY's Wikidata IDs are populated and cross-referenced, the podcast outreach pipeline is running, and the partner-link tracker shows ≥ 10 high-quality natural backlinks.

This phase is **multi-quarter**. Don't expect Phase 5 wins inside the first sprint. Don't skip it.

---

## Run convention

Phase 5 is mostly research + writing + outreach. Most prompts use Sonnet:

```
frqncy-harness agent "<PROMPT>" --model claude-sdk/claude-sonnet-4-6 --yolo --cwd ~/Documents/Claude/Projects/FRQNCY\ WEBSITE/
```

Outreach drafting can use Opus for the highest-stakes pitches:

```
--model claude-sdk/claude-opus-4-6
```

---

## Task 5.1 — Wikipedia article drafts (research first, draft second)

**Why:** Wikipedia is the single most powerful backlink and knowledge-graph signal available. Notability is the bar — but FRQNCY's network has launched, the podcast exists, the Editorial Standards doc is public, and there are independent press mentions to cite. Worth the effort.

**Critical:** Wikipedia rejects self-promotion fast. The article must be third-person, neutral-point-of-view, well-sourced from independent third parties (not FRQNCY's own content). If FRQNCY is the only source for a claim, that claim doesn't survive.

```
Step 1 — Notability assessment: do a thorough independent-source search for FRQNCY (the network), Orlando Eisenreich (the founder), and The FRQNCY Podcast. For each, identify (a) third-party coverage — articles, podcasts, books that mention FRQNCY independently, (b) databases — Crunchbase, AngelList, Substack, Spotify entries, (c) any academic citations or industry-publication references. Rule of thumb for Wikipedia: 3+ independent reliable sources discussing the subject in non-trivial depth.

Write a notability dossier to /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/runs/2026-MM-DD-wikipedia-notability.md with: (a) entity name, (b) candidate sources with URLs and quotes, (c) verdict — meets Wikipedia notability today / needs more press / years away. For entities that don't yet meet the bar, recommend the path: more press first.

Step 2 — Draft articles for the entities that pass: write Wikipedia-format markdown drafts (not directly publishable, since Wikipedia uses MediaWiki syntax — but ready to convert). Sections: Lead paragraph (2-3 sentences, third person, neutral), History, Structure (pillars, IA), Editorial Standards (brief), Reception (third-party coverage), See Also, References (every claim cited). Use {{cite}} placeholders that map to the sources from step 1.

Place drafts in /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/wikipedia-drafts/<entity>.md

Step 3 — Submission plan: for each draft, write the Wikipedia submission path: (a) create account if not already (manual — Orlando), (b) start in user sandbox, (c) request review at Articles for Creation rather than direct mainspace submission for a higher acceptance rate, (d) timeline expectation (2-8 weeks for AfC review), (e) what to do on rejection — usually a list of source improvements.
```

**Verification:** notability dossier + at least 1 entity passing the bar with a draft on disk; submission plan in place.

---

## Task 5.2 — Wikidata entity creation

**Why:** Wikidata is structured data Wikipedia (and Google Knowledge Graph) draws from. Even before a Wikipedia article exists, a Wikidata entity can be created with `instance of`, `founded by`, `official website`, `inception` statements that tie FRQNCY into the linked-data graph.

```
Use the entity briefs from Phase 4.5 (audits/seo/runs/2026-MM-DD-knowledge-graph-entities.md). For each entity, prepare the Wikidata create-form payload:

(a) Label: entity's display name
(b) Description: one short sentence (max 250 chars)
(c) Statements: the structured facts (instance of, founded by, founding year, official website, located in, applies to part, etc.)
(d) References: independent sources for each statement (same sources as Wikipedia)

Write the per-entity submission package to /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/runs/2026-MM-DD-wikidata-submissions.md with everything Orlando needs to paste into wikidata.org/wiki/Special:NewItem.

Wikidata is more permissive than Wikipedia on notability (any subject discussed in a single secondary source can have an entity), so this is mostly always doable. Submit to Wikidata even if Wikipedia rejection is likely.

After creation, capture the Q-numbers (e.g., Q12345678) and update the FRQNCY Organization JSON-LD on the homepage with `identifier: { @type: PropertyValue, propertyID: "wikidata", value: "Q12345678" }` and `sameAs` to include the Wikidata URL.
```

**Verification:** Wikidata entities exist; Q-numbers captured; JSON-LD updated.

---

## Task 5.3 — Cross-platform sameAs consistency audit

**Why:** Google's entity-resolution algorithm fuses references across platforms. If FRQNCY claims @frqncy_network on Twitter but that handle doesn't exist (or is somebody else), the entity score collapses. Consistency audit closes the gap.

```
Audit FRQNCY's footprint across the major platforms. For each, capture (a) URL, (b) display name, (c) bio/description text, (d) profile photo, (e) link-back to frqncy.network present, (f) consistency score against the canonical FRQNCY description.

Platforms to audit:
- Twitter / X
- LinkedIn (Company page)
- Crunchbase
- AngelList / Wellfound
- GitHub (organization)
- YouTube
- Spotify (for The FRQNCY Podcast)
- Apple Podcasts
- Substack (if any)
- Mastodon
- Threads / Bluesky (emerging)
- Wikipedia (once live)
- Wikidata (once live)
- Facebook Page (low priority but Google still weights it)
- Instagram (if any)

For platforms where FRQNCY is missing or weak, write a per-platform setup brief with the canonical bio text (drafted in FRQNCY voice), profile-photo recommendation, and links to populate. Track in /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/SAMEAS-MATRIX.md as a living doc.

The SAMEAS matrix becomes the source of truth for the homepage Organization JSON-LD's sameAs[] array — Phase 2.5 ships a v1 with whatever exists; this task ships v2 with everything filled in.
```

**Verification:** SAMEAS-MATRIX.md exists and shows ≥ 80% platform coverage; homepage Organization JSON-LD references all live profiles.

---

## Task 5.4 — Podcast outreach kit

**Why:** podcast appearances are the highest-ROI distribution available to a founder. Each appearance is a backlink (show notes), a brand mention to a high-trust audience, and audio that gets syndicated everywhere. The FRQNCY podcast is the inverse — guests come to FRQNCY — but Orlando appearing on adjacent shows is what builds the network effect.

```
Build the outreach kit at /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/runs/PODCAST-OUTREACH-KIT.md containing:

1. The pitch — three variants (warm intro, cold email, social DM) at different lengths (50, 150, 300 words). Each emphasizes what makes FRQNCY interesting to that particular host's audience.

2. Press kit — speaker bio (one-liner, paragraph, 3-paragraph), photo URL, sample topics Orlando can speak to (network states, conscious capital, curation as a moat, the harness-as-substrate thesis, the FRQNCY editorial process, etc.), sample podcast clips if any.

3. Target list — research and curate a list of 50 podcast shows where FRQNCY would be a natural fit. Group by audience overlap: (a) consciousness/contemplative (Buddhist Geeks, Sounds True, On Being), (b) conscious capital / regenerative finance (The Long Now, Conscious Capitalism, Intentional Giving), (c) network states / digital nation-building (The Network State, Balaji), (d) intellectual / synthesis (EconTalk, Tim Ferriss for shorter slots, Lex Fridman for the longer ones, Rebel Wisdom, The Stoa, The Inner Game). For each: show name, host, audience size estimate, why FRQNCY fits, contact channel, recent guest list (so we can reference a guest in the pitch).

4. Tracker — spreadsheet schema for: pitched-on-date, status (pitched / accepted / passed / scheduled / aired), episode URL once aired, downloads if known, post-air metrics (referral traffic to FRQNCY, signups, mentions on Twitter).

The kit is a template; Orlando fills in actual outreach.
```

**Verification:** kit exists; first 5 outreach emails sent within 14 days of completion; tracker started.

---

## Task 5.5 — Partner backlink program

**Why:** sanctuaries (places we cover and may genuinely partner with), conscious-capital funds, regenerative-living organizations, mission-aligned schools — these are natural reciprocal linking opportunities WHEN the relationship is real. We don't link-swap; we partner.

```
Build a partner candidate list at /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/runs/2026-MM-DD-partner-prospects.md. For each, identify: (a) partner name, (b) URL, (c) why-aligned (specific shared values, audiences, or projects — not "they have a high domain authority"), (d) what FRQNCY can offer them (a topic page that links to their work, a podcast slot, a co-written brief, a place in /aligned/), (e) what they could offer FRQNCY (a backlink from their site to FRQNCY, an introduction to their network, a cross-promo).

Categories to research:
- Sanctuaries / retreat centers in /places/ (Esalen, Findhorn, Plum Village, Schumacher College, Tassajara, Monroe Institute, Auroville, Intaaya — already covered, formalize the partnership)
- Conscious capital funds (Patient Capital, Long-Now-aligned funds, B-Corp investors)
- Schools (Schumacher Society, alternative-education networks)
- Networks (The Network State association, Vitalik-adjacent communities, Paul Millerd's Strategy of No, etc.)
- Publications (Aeon, Emergence Magazine, Stoa Letter — possible cross-publishing)

Write outreach templates: each is a real letter with a real ask. Avoid the SEO-spam form ("Would you be interested in linking to our high-quality content?"). The pitch is "we cover your work in [topic page]; would you be open to [specific collaboration]?".

Track in /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/PARTNER-TRACKER.md.
```

**Verification:** prospect list exists with ≥ 30 candidates categorized; first 10 outreach attempts logged; first 2-3 reciprocal links land within 60 days.

---

## Task 5.6 — Press list and journalist outreach

**Why:** organic press mentions are the gold standard backlink. They're earned, they sit on high-authority domains (NYT, FT, Forbes, niche pubs), and they confer entity-recognition signal. The pitch must be a real story.

```
Build the press list at /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/runs/2026-MM-DD-press-list.md. Identify journalists actively covering: consciousness / contemplative neuroscience, conscious capitalism / B-Corp / impact investing, network states / sovereign-individual-adjacent, regenerative living / sustainability, AI's impact on culture / curation. For each journalist: (a) name, (b) outlet, (c) recent articles (last 6 months), (d) tone — does FRQNCY's framing match their angle?, (e) contact (Twitter, email, MuckRack, etc.).

Then draft 3 distinct story pitches:
1. "The 146-topic curation network" — about the editorial process and why it stands apart from algorithmic feeds
2. "Membership funds the free layer" — the economic model as a counter to attention-economy SaaS
3. "AI-citation as the next link economy" — Phase 4's strategic bet, why FRQNCY is shaped for it (this one has wider tech-press appeal)

For each pitch, write the email-ready version, the angle, the supporting URL list (FRQNCY pages a journalist can verify against), and the founder bio one-liner.

Track outreach in /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/PRESS-TRACKER.md.
```

**Verification:** press list ≥ 30 journalists; 3 story pitches drafted; first 5 outreach attempts logged.

---

## Task 5.7 — HARO / Qwoted / similar inbound press platforms

**Why:** Help A Reporter Out (now Connectively / Qwoted / similar successors) lets you respond to journalist queries on relevant topics. FRQNCY's domain breadth means there's almost always a relevant query — meditation, money, climate, AI, philosophy, books. Each successful pitch gets a quote in a published piece with a URL backlink.

```
Set up the inbound press pipeline. (1) Sign up for Qwoted (free tier) and any successor to HARO active in 2026 (research current platforms — HARO was acquired by Cision and rebranded Connectively, then sold). (2) Daily routine: skim incoming queries (5 min/day), respond to anything where FRQNCY has authoritative content. Each response includes: a 2-3 sentence answer in FRQNCY voice, the founder's credential, a link to the FRQNCY page that backs the answer, optional photo/asset.

Write a HARO-response template at /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/runs/HARO-RESPONSE-TEMPLATE.md with the template + 5 worked examples for queries FRQNCY commonly fits (meditation, conscious capital, etc.).

Track responses + landed quotes in /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/HARO-TRACKER.md.
```

**Verification:** Qwoted account active; first 10 responses sent; first quote-with-link lands within 30-60 days (typical hit rate is ~5-10%).

---

## Task 5.8 — The reference-content moat (the slow compound)

**Why:** the cleanest backlink is the one earned because the linker found the page they were going to write about themselves. FRQNCY's curated topic pages, when made into the best public reference on a subject, earn this naturally.

```
Identify the 5 topics most likely to earn natural reference links. Selection criteria: (a) FRQNCY's existing page is already strong, (b) other writers in the space frequently cite some "best book on X" or "introduction to X" page, (c) FRQNCY can credibly write the new canonical reference.

Candidates (Phase 1 keyword landscape will refine): "What is conscious capital", "The science of meditation in 2026", "The reading list for network states", "Regenerative agriculture: a primer with sources", "How to read more deeply in the attention age".

For each, write a 1500-3000 word deep entry that becomes THE canonical reference. Cite primary sources lavishly. Link to FRQNCY's curated picks as the structured library. Make it impossible to write the equivalent piece without finding ours and either (a) citing it directly, or (b) being clearly inferior.

Schedule one deep entry per quarter. Track in /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/REFERENCE-CONTENT-CALENDAR.md.

This is the slowest, highest-ceiling work in Phase 5. The compound only kicks in after 2-3 entries land and the pattern becomes visible.
```

**Verification:** calendar exists; first deep entry shipped within 90 days.

---

## Task 5.9 — Newsletter exchanges (warm, not transactional)

**Why:** newsletter cross-promotion (with publications whose readers genuinely overlap) is high-quality referral traffic + warm-audience signal that AI engines and Google increasingly value. NOT to be confused with "for $X your link in our newsletter" which is paid placement and off-strategy.

```
Identify 10 newsletters whose audiences overlap with FRQNCY's. Examples: Tom Morgan's What's Important?, Substack's contemplative-economics-adjacent writers, Maps of Meaning, The Stoa's letter, Where the Wild Things Grow (if active in 2026). For each: writer name, list size if known, recent issue topics, whether they do exchanges (some do, some refuse on principle — both fine), proposed exchange format ("I'll feature your work, you feature ours" — only when natural).

Write to /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/runs/2026-MM-DD-newsletter-prospects.md.

Outreach is Orlando's, written in his voice. Don't draft form letters; draft personalized notes referencing the writer's actual work.
```

**Verification:** 10 prospects identified; 3 conversations started; 1 exchange happens within 90 days.

---

## Task 5.10 — Brand-mention monitoring

**Why:** can't measure what you don't see. Set up persistent monitoring for "FRQNCY" / "frqncy.network" / variants across the open web so we know what's said and can respond when it matters.

```
Set up brand-mention monitoring across:

1. Google Alerts: "FRQNCY", "frqncy.network", "FRQNCY Network", "Orlando Eisenreich" (separate alerts; daily digest)
2. Mention.com or Talkwalker free tier for richer alerts
3. Twitter / X search: saved searches for the same terms; a TweetDeck-equivalent pinned column
4. Reddit search across relevant subs
5. Hacker News mentions (HN search RSS feed)
6. Substack mentions (manual check via Substack search)
7. Cloudflare logs: any inbound referrer matching specific patterns

Build the monitoring panel at /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/MENTION-MONITORING.md with: setup instructions per platform, the response playbook (when to engage, when to thank, when to ignore), and the place where mentions get logged for trend tracking.

Run a baseline scan now: search the open web for any current FRQNCY mentions. Capture the baseline — every mention found, with URL, date, context, sentiment. This is the row-zero of the mentions log.
```

**Verification:** all alerts active; baseline mentions captured; weekly review cadence in place.

---

## Done definition for Phase 5

- [ ] Wikipedia notability dossier + drafts on disk; first article submitted via AfC
- [ ] Wikidata entities created with Q-numbers; cross-references in JSON-LD
- [ ] sameAs matrix shows ≥ 80% platform coverage
- [ ] Podcast outreach kit live; first 10 outreach attempts logged
- [ ] Partner prospect list of ≥ 30; first 10 outreach attempts logged; first 2-3 reciprocal links earned
- [ ] Press list of ≥ 30 journalists with 3 story pitches drafted; first outreach logged
- [ ] HARO/Qwoted pipeline active; first responses sent
- [ ] Reference-content calendar with first deep entry shipped
- [ ] Newsletter prospect list with first 3 conversations
- [ ] Brand-mention monitoring active with baseline + weekly cadence

This phase doesn't "finish." After the foundation is in place, the work is operational — outreach, editorial, monitoring, conversion of mentions into relationships. Compounds for years.
