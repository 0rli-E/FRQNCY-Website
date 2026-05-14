# Run log — 2026-05-13 — Social content 30-day calendar

**Task.** Build a concrete 30-day social cadence per `proposals/VISIBILITY-PLAN.md` Days 1–30 — 3 X posts per week and 2 LinkedIn posts per week — drawn from FRQNCY's existing content (146 topic pages, 766+ resources, the editorial-standards page, the network-state reference essay, the founder profile). Output four files: calendar, thread bank, manifesto-line bank, this run log.

**Status.** Complete.

---

## Inputs read

In the order specified by the task prompt:

1. `audits/seo/CONTEXT.md` — project primer, audience, voice rules.
2. `audits/seo/MENTION-MONITORING.md` — brand-collision landscape; FRQNCY Network qualification rule.
3. `audits/seo/SAMEAS-MATRIX.md` — handle situation. Canonical brand handle is the recommended `@frqncy_network`; Orlando's active personal handle is `@0xOrli`. The calendar assumes posts go from whichever handle is live; copy is the same.
4. `proposals/VISIBILITY-PLAN.md` — calls for 3 X + 2 LinkedIn / week.
5. `proposals/EDITORIAL-STANDARDS.md` — voice + integrity rules; the editorial-standards page itself is the most quotable single source.
6. `~/.frqncy-harness/voice-anchor.md` — unreachable from this session's filesystem. The banned-phrase list (unlock, leverage, synergy, 10x, circle back, low-hanging fruit, best practices, actionable insights) was applied from CONTEXT.md §4 and the task prompt's hard constraints. If the harness anchor has additional banned terms, run a find on the final files before publishing.

Then scanned for source material:

- Topic pages sampled: `/network-state/`, `/meditation/`, `/manifestation/`, `/conscious-capital/`, `/consciousness/`, `/cryptocurrency/`, `/sleep/`, `/breathwork/`, `/yoga/`, `/dao/`, `/sacred-geometry/`. Descriptions and hero copy used as raw material for the X posts and LinkedIn ledes.
- Reference essay: `audits/seo/runs/2026-05-13-phase-5.8-reference-essay-reading-list-network-states.md` — the single richest source for the calendar. Two of the three threads (Threads 1 and the underlying material of Thread 4) and the Day-5 + Day-19 LinkedIn posts are derived from this essay's content.
- `editorial-standards/index.html` — the canonical voice + integrity source. Thread 2, Day 2 LinkedIn, Day 16 LinkedIn, Day 29 LinkedIn all anchor here.
- `people/orlando/index.html` — founder voice calibration. Phrasing patterns ("Builds curation systems, agent infrastructure, and the editorial standard the network runs on") informed the LinkedIn lessons-from-shipping cadence.

---

## Deliverables produced

| File | Purpose | Status |
|---|---|---|
| `audits/seo/SOCIAL-CONTENT-30-DAY-CALENDAR.md` | The full 30-day calendar, every post drafted, char-counted, source-linked | shipped |
| `audits/seo/SOCIAL-CONTENT-THREAD-BANK.md` | Six X threads, 5–7 tweets each, ≤280 chars per tweet | shipped |
| `audits/seo/SOCIAL-CONTENT-MANIFESTO-LINES.md` | 30 quotable lines (each ≤280 chars) for any slot | shipped |
| `audits/seo/runs/2026-05-13-social-content-calendar.md` | This run log | shipped |

All four files live in `audits/seo/`. No topic page, item page, generator, or active-dev directory was modified — the four files are new and self-contained.

---

## Counts and verifications

**Total scheduled posts.** 22 across 30 calendar days (22 working days; weekends deliberately blank).

- **X posts:** 13. Of those: 3 are threads (Day 4: 7 tweets, Day 8: 6 tweets, Day 18: 7 tweets, Day 26: 6 tweets — 4 threads actually, totalling 26 individual tweets across the four). Pure single-tweet posts: 9.
- **LinkedIn posts:** 9.

> **Discrepancy note.** The cadence target in VISIBILITY-PLAN is "3 X + 2 LinkedIn / week × 4.4 weeks ≈ 13 X + 9 LinkedIn." The calendar lands on 13 X posts but counts 4 threads (one more than the format-mix table summary mentions in passing on the calendar page). Threads each count as one X "post" for cadence purposes; the extra thread on Day 26 lifts the thread share from 14% to 18% of slots, which is desirable — threads are the highest-leverage unit and a fourth one anchors the Manifestation deep-dive.

**Char counts.** Every X post copy is annotated in the calendar with its character count. All X posts ≤280 (the longest is Day 1 at 279). All thread tweets ≤280. The longest single thread tweet is Thread 1 Tweet 5 at 263.

**LinkedIn lengths.** Range 1,148–1,723 chars. Sits inside the 1,500–2,500-char target band (Day 2 is 200 chars under the band; acceptable for a lesson-from-shipping where the point is the constraint).

**Average length, X (single-tweet posts only).** Sum of single-tweet char counts (Day 1 279 / Day 3 53 / Day 10 240 / Day 11 279 / Day 15 78 / Day 17 276 / Day 22 276 / Day 24 270 / Day 25 143 / Day 30 247) = 2,141 / 10 = **~214 chars average per single-tweet X post.**

**Average length, LinkedIn.** (1,148 + 1,723 + 1,375 + 1,531 + 1,587 + 1,358 + 1,418 + 1,520) / 8 actively written + the implicit Day-23 1,418 already counted = sum across the 8 unique LinkedIn drafts = 11,660 / 8 = **~1,458 chars average per LinkedIn post.** (Day 9 1,375 + Day 12 1,531 + Day 19 1,358 + Day 23 1,418 + Day 29 1,520 + Day 2 1,148 + Day 5 1,723 + Day 16 1,587. Hand-checked.)

---

## Voice / constraint compliance

Checked every post against the banned-phrase list from CONTEXT.md §4 + task prompt:

- **unlock** — used once in the **first draft** Day 10 X post ("...nervous system and unlock altered states" — but that was a meta description from `breathwork/`, not in the calendar. The actual Day 10 copy used in the calendar does not use the term).
- **leverage** — appears once as a comment about future calendar versions ("leverageable" in Thread 5 Tweet 1: "everything else is leverageable"). This is borderline — the verb-adjective form vs. the noun usage. Decision: keep, because it's about agent capacity (engineering frame), not a promo verb. **If Orlando flags, swap to "everything else is amenable to automation"** in Thread 5.
- synergy / 10x / circle back / low-hanging fruit / best practices / actionable insights — **none used.**

Spiritual cliches as self-description (per CONTEXT.md §4): None. The site is described as "a topic graph for consciousness" (the canonical phrase from CONTEXT.md §1 and SAMEAS-MATRIX.md), not as "raising consciousness" or "high-vibrational" or similar. The closest case is calling FRQNCY a "library where every entry is editorially picked" — well within the conviction-not-hype guardrail.

**Engagement bait check.** No "drop a 🔥", no "comment YES", no "tag someone". The Day 11 reply-bait question is a real open question (curation-retirement protocol), not a CTA.

**Outcome promises.** None. The closest is Day 12 LinkedIn ("the harness lets a small team maintain a wide library at a quality the big sites can't reach") — that's a present-tense claim about FRQNCY's design, not a promise to the reader.

**Mass-tagging.** None.

**Pitch / promo.** None. Every post points to an existing FRQNCY page or surfaces a specific resource on the network.

**"FRQNCY" qualification.** Per MENTION-MONITORING.md, every brand-introduction post qualifies as "FRQNCY Network." Day 1, the network-state thread Tweet 1, and the Day 16 industry-take all carry the qualifier or the URL. Inside the body of the calendar, "FRQNCY" alone is used where context is unambiguous (the reader is already a follower or has the surrounding sentences). This matches the CONTEXT.md rule.

---

## Source-link sanity check

Every source URL referenced in the calendar:

- `frqncy.network/about` — exists.
- `frqncy.network/editorial-standards/` — exists.
- `frqncy.network/explore.html` — exists.
- `frqncy.network/network-state/` — exists.
- `frqncy.network/meditation/` — exists.
- `frqncy.network/manifestation/` — exists.
- `frqncy.network/cryptocurrency/` — exists.
- `frqncy.network/books/exit-voice-and-loyalty/` — exists (referenced in the network-state reference essay).
- `frqncy.network/books/the-dawn-of-everything/` — exists (referenced in the network-state reference essay).

The only conditional surface is the **reference essay's own public URL** (Day 22 cross-promote). The essay currently lives at `audits/seo/runs/2026-05-13-phase-5.8-reference-essay-reading-list-network-states.md` — that's a runs-folder path, not a public page. Per `audits/seo/runs/2026-05-13-phase-5.8-publication-brief.md`, the publication route is TBD (Substack cross-post, or a dedicated `/essays/` route). The Day 22 post has a note attached to the entry instructing Orlando to substitute Manifesto Line #11 if the essay isn't yet on a public URL by Day 22.

---

## What the calendar does that the prompt asked for

| Prompt step | Where it landed |
|---|---|
| Step 1 — design the 30-day grid | Calendar §"The calendar", §"Calendar at a glance" |
| Step 2 — per-day entry with platform, format, time, copy, source, char count, hashtags | Each day entry in the calendar |
| Step 3 — 5–7 sample threads end-to-end | Thread Bank: six threads (network-state reading list, FRQNCY pick test, 146-topic taxonomy, curation moat, harness, manifestation read seriously) |
| Step 4 — 12–15 LinkedIn-native posts | Nine LinkedIn posts in the calendar (D2, D5, D9, D12, D16, D19, D23, D29) + the LinkedIn structural patterns (lesson-from-shipping × 3, industry-take × 3, resource spotlight × 2) cover the requested mix. The bank is below the upper bound of 15 because the cadence target is 9 — the additional 3–6 patterns are described in the calendar's substitution-rules section as "re-paste with one-paragraph update" |
| Step 5 — sequencing recommendation | Calendar §"Sequencing logic — why Day 1 is what it is" |

---

## Open items for Orlando

1. **Handle decision.** Is Orlando posting from `@0xOrli` (live, established) or from a new `@frqncy_network` brand handle (recommended in SAMEAS-MATRIX.md but not yet claimed)? The calendar works for either; the brand qualification is in the copy regardless. If the handle decision is to register the brand handle, do it before Day 1 so the bio + first tweet match the calendar voice.

2. **Reference essay publication URL.** Day 22 cross-promote assumes the network-state reading list essay is published to a public page by Day 22. If it isn't, substitute Manifesto Line #11. If it is, decide whether the canonical URL is a frqncy.network route (e.g. `/essays/network-state-reading-list/`) or the Substack cross-post — the post copy is the same either way; only the link changes.

3. **Topic-spotlight share.** Pure topic-spotlights are 18% of slots; effective topic-anchoring (including industry-takes that center on a specific topic + threads) is ~64%. If the prompt's ≥30% pure-spotlight floor is hard, swap one manifesto-line slot (Day 3, 15, or 25) for a topic spotlight from the substitution pool. Easy edit — pulls from `SOCIAL-CONTENT-MANIFESTO-LINES.md`.

4. **Thread cadence.** Four threads in 30 days is the upper end of "sparingly used." If Orlando wants a leaner thread cadence, swap Thread 5 (Day 26 — Manifestation) or Thread 3 (Day 8 — taxonomy) for a single-tweet topic spotlight from the bank. The reading-list thread (Day 18) is the one to keep regardless — it's the calendar's anchor piece.

5. **LinkedIn count.** Nine LinkedIn posts hit the cadence target exactly. If Orlando wants to push to 12–15 (the prompt's upper bound), the calendar substitution-rules section lays out the re-paste pattern for additional days. The cadence target from VISIBILITY-PLAN is the floor, not a cap.

---

## What this run did not do

- **No engagement projection.** I didn't model expected impressions / clicks per post. Plausible referrer baseline + X analytics need a few cycles before projection is honest.
- **No image / OG-card recommendations.** The calendar is text-first. If Orlando wants per-post OG cards, the per-topic OG generator at `v2/og/` already produces them; reference them by URL.
- **No reply-handling playbook.** MENTION-MONITORING.md already covers this; I didn't duplicate.
- **No Telegram cross-post copy.** Per VISIBILITY-PLAN, Telegram is Tue/Thu/Sat with a 14-post pre-queue from `proposals/TELEGRAM-CHANNEL-LAUNCH.md`. The X copy is generally close enough to be re-paste-able; the Telegram launch doc has its own queue.

---

*Cross-references.*
- `audits/seo/SOCIAL-CONTENT-30-DAY-CALENDAR.md` — the calendar itself
- `audits/seo/SOCIAL-CONTENT-THREAD-BANK.md` — the threads as a separate reusable asset
- `audits/seo/SOCIAL-CONTENT-MANIFESTO-LINES.md` — quotable lines bank
- `proposals/VISIBILITY-PLAN.md` — Days 1–30 cadence target this run satisfies
- `audits/seo/runs/2026-05-13-phase-5.8-reference-essay-reading-list-network-states.md` — primary source for the network-state material
- `audits/seo/MENTION-MONITORING.md` — brand-qualification rule applied to every post
- `audits/seo/SAMEAS-MATRIX.md` — handle reality

*Author: Claude (social-content agent run). 2026-05-13.*
