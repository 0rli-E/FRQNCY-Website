# PHASE 3 — Content & Topical Authority

**Goal:** make every topic page so unmistakably the best public reference on its subject that Google, Perplexity, ChatGPT, and a real reader all agree. Densify the cluster. Add the question-answering surface. Establish a freshness cadence that runs forever.

**Prerequisites:** Phase 1 keyword landscape + competitive intel doc on disk; Phase 2 BreadcrumbList + Article schema shipped on topic pages.

**Done when:** top 30 topic pages have FAQPage schema, every topic page has a glossary block, internal linking is dense both directions (Phase 2.9 + 2.10 shipped), the freshness rubric exists and the first quarterly review is scheduled, course HowTo schema is shipping, and the editorial standards doc is public and linked.

This phase is **continuous** — Phases 1-2 are one-shot foundations; Phase 3 is the work that compounds for years. The first sprint of Phase 3 is the highest-leverage initial run; the prompts below assume that first sprint.

---

## Run convention

Most Phase 3 work involves authoring real prose — use Sonnet:

```
frqncy-harness agent "<PROMPT>" --model claude-sdk/claude-sonnet-4-6 --yolo --cwd ~/Documents/Claude/Projects/FRQNCY\ WEBSITE/
```

Pure structural tasks (schema injection from existing prose) can use flash:

```
--model openrouter/google/gemini-2.5-flash
```

---

## Task 3.1 — FAQPage schema on top 30 topic pages

**Why:** zero pages on the site have FAQPage schema. Every topic page has natural Q&A material in its body. Adding FAQPage to the top 30 (per the Phase 1 opportunity ranking) is the single biggest rich-result unlock in this phase. Featured-snippet and People-Also-Ask eligibility on long-tail queries.

**Critical:** the Q&A entries must be REAL questions readers actually ask, with substantive answers. Do not invent FAQ entries to game schema; that's the path to spam-classifier flags.

```
Read /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/runs/2026-04-29-keyword-landscape.md (the Phase 1 deliverable) and pull the top 30 priority topics with their People Also Ask questions. For each topic, also read the topic page at /<slug>/index.html — extract any existing Q&A material, eyebrow questions, or section headers that are already framed as questions.

For each of the 30 topics:
1. Identify 5-8 real questions: from PAA, from natural questions a reader would ask, from existing page content. Do NOT invent commercial-intent questions like "where to buy meditation cushions"; FRQNCY's voice is editorial.
2. Draft answers from the existing topic-page content + the curated resources listed on the page. Keep answers 40-80 words. Cite the page's own resources where natural ("see [Book Title] linked above").
3. Inject a <script type="application/ld+json"> with @type FAQPage containing mainEntity[] of {@type: Question, name, acceptedAnswer: {@type: Answer, text}}. Place AFTER the existing JSON-LD blocks.
4. ALSO inject a visible <section class="faq"> in the HTML body (before </main>) with <details><summary> entries matching the schema. Visible content + schema is what Google requires; schema-only is hidden-content and risks penalty.

Write a per-topic log to ~/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/runs/2026-MM-DD-faq-rollout.md with: topic, questions, answer-source-confidence (high/medium — if low, skip and flag for editorial), word counts, and a final tally.
```

**Verification:** `grep -rl '"@type":"FAQPage"' /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/v2/*/index.html | wc -l` returns 30. Google's Rich Results test on 5 random topic pages from the rollout shows valid FAQPage detected. Visible <details> elements render correctly on the live page.

---

## Task 3.2 — Course HowTo schema on practice-oriented courses

**Why:** `meditation-101` and `working-with-claude` are HowTo-shaped content (step-by-step practice). Adding HowTo schema unlocks step-by-step rich results in SERPs.

```
Read /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/v2/courses/meditation-101/index.html and courses/working-with-claude/index.html. Each has a lesson list with class="lesson-h1" headings. For each course:
1. Extract the lesson titles in order.
2. Extract a 1-2 sentence description of what the lesson teaches (from the lesson body's first paragraph).
3. Build a JSON-LD block with @type HowTo and step[] containing {@type: HowToStep, name, text, position}. Add totalTime (use the course's existing timeRequired). Reuse the existing course's name, description, image. Inject as a SECOND JSON-LD block after the existing Course schema; both are valid simultaneously per Google.

Skip courses that don't fit the HowTo shape (e.g., crypto-fundamentals is more conceptual than step-by-step). Write to ~/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/runs/2026-MM-DD-howto-rollout.md.
```

**Verification:** Rich Results test on /courses/meditation-101/ shows both Course and HowTo detected.

---

## Task 3.3 — Glossary blocks on every topic page

**Why:** every topic has 3-5 terms a reader will encounter that need a quick definition (e.g., "vipassana", "samatha", "metacognitive insight" on a meditation page). A glossary block (also called a Definition List) is reader-helpful AND gives Google more co-occurring terminology to confirm topical authority.

```
For each topic page under /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/v2/<slug>/, identify the 5-8 most important terms in the topic's domain. Pull from: the page's existing prose, the topic's curated resources' descriptions, the topic's pillar association. Each term gets a 30-50 word definition written in the FRQNCY voice (present-tense, declarative, no spiritual cliches as direct self-description).

Add a <section class="glossary"> with class section-label "Terms" before the resources section, containing a <dl> with <dt>term</dt><dd>definition</dd> pairs. Also inject DefinedTermSet schema as JSON-LD: @type DefinedTermSet, name, hasDefinedTerm[] of {@type: DefinedTerm, name, description, inDefinedTermSet}.

Process the topics in batches of 20 to keep the runs manageable. Run-log per batch to ~/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/runs/2026-MM-DD-glossary-batch-N.md with terms-per-topic, average-definition-length, and any topic where you couldn't find 5+ terms (flag for editorial review — those topics may be too thin and need expansion before a glossary makes sense).
```

**Verification:** every topic page has a `<dl>` glossary section + DefinedTermSet schema. Average 6 terms per topic.

---

## Task 3.4 — Author bylines + Editorial Standards link on every topic page

**Why:** YMYL-adjacent topics (consciousness, well-being, money, regenerative living) want clear authorship. Adding a visible byline ("Edited by Orlando Eisenreich · Updated <dateModified>") + a link to the public Editorial Standards doc establishes E-E-A-T.

**Prerequisite:** publish `proposals/EDITORIAL-STANDARDS.md` as `/editorial-standards/` (currently in proposals/ which is robots-disallowed).

```
Step 1 — Publish editorial standards: copy /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/proposals/EDITORIAL-STANDARDS.md to /editorial-standards/index.html (build a simple page using the FRQNCY chrome). Add proper meta, canonical, JSON-LD CreativeWork schema. Add to sitemap.xml. Verify with curl after deploy.

Step 2 — Add bylines: for each topic page under <slug>/, add a visible byline element after the hero, before the main content: <p class="byline">Edited by <a href="/people/orlando/">Orlando Eisenreich</a> · Standards: <a href="/editorial-standards/">FRQNCY Editorial</a> · Last updated <time datetime="<ISO>"><human date></time></p>. Style the byline using existing Jost font small caps style. Pull the dateModified from the Article JSON-LD that was added in Phase 2.4.

Run-log to ~/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/runs/2026-MM-DD-bylines.md.
```

**Verification:** /editorial-standards/ is live and indexable; every topic page has a visible byline; the Article JSON-LD's `author` and `dateModified` align with the visible content.

---

## Task 3.5 — Topical-cluster cross-linking deepening pass

**Why:** Phase 2.9 + 2.10 established that topics link to items and items link to topics. Phase 3.5 deepens it: add CONTEXTUAL inline links inside the prose, not just the structured anchored-topics block. When a topic page mentions "the work of Carl Jung" inline, that should be a link to /people/carl-jung/ if the page exists. Same for book titles, org names, podcast names mentioned in body prose.

**This is a bulk find-and-link pass; do it carefully so we don't false-positive.**

```
Build a name-to-URL map by walking /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/{books,people,orgs,media,places}/*/index.html and extracting each page's <h1> name and canonical URL. Construct exact-match patterns like {name: "Carl Jung", url: "/people/carl-jung/"}.

For each topic page under <slug>/index.html: scan the prose inside <main> (skip nav, footer). Find first-mention occurrences of any name from the map; replace the literal text with an <a href> link. Rules: (1) only the FIRST mention per page gets linked, (2) skip text already inside an <a>, <h1>, <h2>, <h3>, (3) skip if the name appears inside a class="resource-list" already (the resource list links it explicitly). Limit to exact case-sensitive matches to avoid false positives ("blink" the verb vs "Blink" the book title).

Dry-run first: write a per-topic preview to ~/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/runs/2026-MM-DD-contextual-linking-dryrun.md showing topic-slug | proposed-changes (count) | sample-3-snippets-with-context. Orlando reviews. Then a follow-up task ships.
```

**Verification:** dry-run shows reasonable change counts (e.g., 2-15 links per topic page); Orlando approves; follow-up task ships actual edits.

---

## Task 3.6 — Freshness rubric + quarterly review schedule

**Why:** evergreen content decays. A topic page written 2 years ago without review starts losing rankings as competitors update theirs. We need a written rubric (when to refresh) and a schedule (which 1/4 of topics per quarter).

```
Write the freshness rubric to /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/FRESHNESS-RUBRIC.md covering: (a) cadence — every topic page reviewed at least annually, fast-moving topics (crypto, AI, biotech) reviewed quarterly, (b) review checklist — does the description still match? are the resources still vetted? are there 2-3 new picks since last review? does the dateModified update propagate? (c) sign-off — who reviews, who applies, where the per-page review log lives.

Then build the quarterly review calendar: read /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/content.json, classify each topic as fast-moving (review quarterly: AI, crypto, biotech, ar-vr, decentralized-networks, defi, etc.) or evergreen (review annually: meditation, philosophy, history, music, etc.). Assign each evergreen topic to one of the 4 quarters in a balanced way (~30 topics per quarter). Write the calendar to /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/QUARTERLY-REVIEW-CALENDAR.md as a table: quarter | topic-slug | review-type | last-review-date.

Then schedule the first quarterly review pass — pick 5 topics for an initial smoke test. The follow-up task does the actual review.
```

**Verification:** rubric + calendar on disk; 5 topics queued for the first review.

---

## Task 3.7 — First freshness review (5-topic smoke test)

**Why:** test the rubric before applying to all 146.

**Use Sonnet for this — real editorial work.**

```
Pick 5 topics from the quarterly calendar's Q1 list (any 5 of the fast-moving ones). For each topic at /<slug>/index.html: read the page in full. Apply the rubric from /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/FRESHNESS-RUBRIC.md. Specifically:
- Does the meta description still accurately describe the topic? Tighten if not.
- Are the 5-7 most-cited resources still the right top picks? web_search for "<topic> 2026" and identify 1-3 new candidate resources to consider; do NOT add them, just note them.
- Is the explainer prose dated? Look for any factual claim that's stale (e.g., "as of 2023", obsolete numbers).
- Update the dateModified in the Article JSON-LD to today.
- Bump <time datetime> in the byline.

Write a per-topic review at ~/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/runs/2026-MM-DD-freshness-Q<n>-smoke.md with: changes-made, candidate-additions-flagged-for-editorial, no-changes-needed (count). Do NOT add new resources unless the editorial review approves; just flag them.
```

**Verification:** 5 review reports on disk; Orlando reviews the candidate-additions and decides which to add via editorial follow-up.

---

## Task 3.8 — Speakable schema on intro paragraphs

**Why:** Google Assistant and voice search read pages aloud; SpeakableSpecification schema tells assistants which sections are good to read. Best for the topic page's hero description + first paragraph.

```
For each topic page under /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/v2/<slug>/index.html: identify the hero <p class="hero-desc"> and the first <p> inside the main story/explainer section. Add CSS selectors or xpath references to a SpeakableSpecification block in JSON-LD: @type SpeakableSpecification, cssSelector [".hero-desc", ".story p:first-child"]. Wrap into the existing Article schema as a "speakable" property OR add as a separate JSON-LD block referencing the Article via mainEntityOfPage.

Run-log to ~/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/runs/2026-MM-DD-speakable-rollout.md.
```

**Verification:** Rich Results test on a sample topic page detects Speakable.

---

## Task 3.9 — Thin-content remediation (the 30 thinnest pages)

**Why:** Phase 1 inventory identified the 30 thinnest pages. Either expand each to meet a minimum bar, or redirect to a parent page if the topic is too thin to defend.

**Use Sonnet — real editorial.**

```
Read /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/runs/2026-04-29-content-inventory.md and pull the 30 thinnest pages. For each: classify as (a) deserves expansion — clear subject, FRQNCY voice can deepen it, target word count 600-900 words minimum, (b) deserves merging — overlaps with a neighboring topic, recommend a 301 redirect to that neighbor, (c) deserves removal — never should have shipped, return 410 Gone.

Write a triage doc to ~/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/runs/2026-MM-DD-thin-content-triage.md with the 30 pages and one of (a/b/c) per page plus the rationale. Orlando reviews. Then a follow-up task executes the triage decisions: expansion drafts, redirect setup in functions/_redirects, or 410 responses.
```

**Verification:** triage doc exists; follow-up tasks scheduled per outcome.

---

## Task 3.10 — Aligned + Membership content depth

**Why:** /aligned/ and /membership/ are single landing pages with no schema and no item entries. As they grow, they need ItemList (aligned) and Service/Offer (membership) schema. Plan now so the schema goes on at launch, not retrofitted.

```
Read /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/{aligned/index.html, membership/index.html}. For aligned: write a content brief at ~/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/runs/2026-MM-DD-aligned-brief.md proposing the structure when item entries arrive — categories (e.g., books, courses, products, places), schema (ItemList of CreativeWork/Product), routing (/aligned/<category>/<slug>/), and how it relates to the existing books/people/orgs/media sectors (avoid duplication). For membership: draft the Service + Offer JSON-LD that should ship the moment Stripe lands — include name, description, provider (FRQNCY org), areaServed, hasOfferCatalog, offers (price tiers when known). Place the draft in /Users/orli/Documents/Claude/Projects/FRQNCY\ WEBSITE/audits/seo/runs/2026-MM-DD-membership-schema-draft.md ready to drop in.
```

**Verification:** both briefs on disk for the next time aligned and membership ship updates.

---

## Done definition for Phase 3 (first sprint)

- [ ] FAQPage schema on top 30 topic pages with REAL Q&A content visible + schema'd
- [ ] HowTo schema on the 2 practice-oriented courses
- [ ] Glossary blocks on every topic page with DefinedTermSet schema
- [ ] /editorial-standards/ published and indexable
- [ ] Author bylines on every topic page linking to Orlando + editorial standards
- [ ] Contextual cross-linking dry-run reviewed and shipped
- [ ] FRESHNESS-RUBRIC.md + QUARTERLY-REVIEW-CALENDAR.md on disk
- [ ] First 5-topic freshness smoke-test review complete
- [ ] Speakable schema on topic pages
- [ ] Thin-content triage executed
- [ ] Aligned + Membership content briefs ready

After Phase 3 first sprint, the topical authority is real, FAQ rich results are eligible, voice/AI engines have deeper hooks, freshness is on a calendar, and the cluster is dense. Subsequent quarterly sprints repeat the freshness pass and deepen the top-10 priority topics one at a time.
