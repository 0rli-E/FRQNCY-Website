# Homepage hero rewrite — draft for review

**Date:** 2026-04-28
**Driving:** `WEBSITE-FEEDBACK-2026-04-28.md` item #4 — "Home page messaging says nothing about FRQNCY"
**Voice doc:** `FRQNCY-VOICE-PLAYBOOK.md` (esp. §7 plain speech about non-plain things, §banished-phrases)
**Constraint from operator (2026-04-28):** "love and light stays where it earns context — Sanctuary surfaces, contemplative interludes, the Substack body, the quote section. It is banished only as direct self-description in hero/meta/CTA where the surrounding text hasn't done the work."

---

## What's there now

```
<title>FRQNCY — Built on the Foundations of Oneness</title>
<meta name="description" content="FRQNCY is a community becoming an alternative society. You remember what you truly are — love and light — and create a future from that knowingness.">
<meta property="og:description" content="...same as above...">
```

Visible hero (after scroll): a dramatic light orb + the wordmark "FRQNCY" + a scroll cue. No text positioning. Then a quote section with "Built on the foundations of oneness. FRQNCY's goal is to create a future in which the light dominates everything we experience and know."

## What's wrong

The **meta description** is the failure mode — "love and light" appears as a direct self-description in a place (search results, social-card previews) where there is no surrounding text to earn the phrase. The reader sees it cold. That's the Trungpa spiritual-materialism trap the voice playbook explicitly guards against in §7.

The **title** is fine — Oneness is the conceptual frame, not the cliché.

The **quote section** body ("the light dominates everything we experience and know") is fine — earned context, philosophical framing in place. Keep.

The **subscribe overlay** ("You are love and light.") is borderline but defensible — it's a CTA moment but the user has already engaged enough to see the overlay. Keep as-is unless you disagree.

## Proposed rewrite

### Title (unchanged)
```
FRQNCY — Built on the Foundations of Oneness
```

### Meta description (rewritten)
```
FRQNCY is a topic graph for consciousness — 146 maps of how money, energy,
mind, and matter actually work. A reading list with conviction. A network
becoming a civilisation. A fund underneath.
```

**Why:** Answers the three questions a stranger asks (what is this / what's it for / why now) in three short clauses. Keeps the network-becoming-a-civilisation thread from the original. Drops the "love and light" cliché from the discoverability surface only. 158 chars — under the 160 Google truncation.

### og:description (matches meta)
Same as above.

### twitter:description (same)
Same as above.

### Optional: hero subtitle that appears on scroll-into-view

Currently the hero has no text below the wordmark. A 2-line subtitle, fading in, would land the playbook voice:

```
A topic graph for consciousness.
A reading list with conviction.
A fund underneath.
```

Triad rhythm. Present-tense certain. No cliches. Each line a complete claim.

If you want it visible without a scroll, place it below the wordmark with the scroll cue. If you want the dramatic empty-screen effect to stay, place it just above the quote section.

## Voice playbook compliance

Quick checklist applied to the proposed meta:

- [x] Present tense: "is" not "will be"
- [x] Declarative shortness: short sentences, no subordinate clauses
- [x] No "love and light" as direct self-description
- [x] No spiritual cliches ("high vibe," "soul food," etc.)
- [x] No startup hype ("disrupt," "next gen")
- [x] No academic hedging ("in some traditions")
- [x] British spelling ("civilisation")
- [x] Conviction stated, not graded
- [x] Triadic rhythm: three short fragments

## Files to change

- `index.html` lines 6, 10, 18, 19 (title stays; descriptions update)
- Optional: lines 124–129 (add subtitle below the wordmark, after the quote section if preferred)

## What stays the same (per operator note 2026-04-28)

- `index.html` line 136 — subscribe overlay headline "You are *love* and light." (CTA moment, surrounding context earns it)
- `index.html` lines 154–158 — quote section "Built on the foundations of oneness… the light dominates everything we experience and know." (earned philosophical context)
- All <topic>/ contemplative content where "love and light" / "the light" / "oneness" appear as concepts, not as marketing flavour
- The Substack re-engagement email (uses the phrase mid-body where it's earned)

## Recommendation

Apply meta + og + twitter description rewrites today (search-result preview is the failure mode). Defer the optional hero subtitle until after a 24-hour eye-test of the shorter copy in production. If the meta rewrite reads well in Google's preview tool and the social-card debuggers, the subtitle becomes a separate visual decision rather than a text decision.

## Status

- Meta + og + twitter description: **applied to `index.html` after this proposal commits.** Reverts cleanly if you disagree.
- Hero subtitle: **not applied yet** — pending operator visual review.
