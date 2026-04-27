# FRQNCY Editorial Standards

The protective standard for FRQNCY's curation. Required precondition (per `REVENUE-MODEL.md`) before scaling any revenue surface — Aligned Goods, Fund, sponsored content, or anything else where money meets a curatorial decision.

`CLAUDE.md` covers repo conventions. `EDITORIAL-VALUES-V2.md` covers slogans and voice. **This doc covers the *who* and *how* of curation:** what counts as a FRQNCY pick, when money is allowed to touch a pick, and who's authorized to make one.

If a future surface is unsure whether to ship, this is the doc to settle it against.

---

## 1. What makes a FRQNCY pick

A pick is a public endorsement: "this teacher / book / org / project / good has earned a place on FRQNCY." The criterion is the same regardless of category.

A pick must be:

1. **Personally vetted.** Someone in the picking body (see §3) has read the book, taken the course, used the product, met the person, or studied the practice deeply enough to vouch. **No second-hand picks.** "I heard it's good" doesn't qualify.
2. **In service of the practitioner.** The pick exists because it makes someone *more able*, not because it adorns FRQNCY. The slogan "FRQNCY makes the unable able" is the test.
3. **Spiritual-technology, not spiritual-materialism.** A pick should equip practice, not signal status. (See `EDITORIAL-VALUES-V2.md` §3 for the distinction.) If the appeal is collecting credentials or accessing a scene, decline.
4. **Independent of money flow.** The pick decision precedes any commercial relationship. We never start with "we could partner here" and back into a pick.
5. **Honest about what it is.** Picks are tagged with the *kind* of recommendation: a learning resource, a practice, a daily good, a network entry, etc. We don't pretend a product pick is a teaching pick or vice versa.

A pick is **not**:

- A directory entry. Most things on FRQNCY are listed because they're part of the field; only a fraction are picks.
- A sponsorship slot. Sponsorship doesn't exist as an editorial category. (Money flows are handled in §2.)
- A ranking. There's no #1 pick, no top-10 list, no leaderboard. Picks are flat — everything that meets the bar gets the same badge.

The data field is `picked_in: <list>` (set on the relevant entity). The `<list>` is the FRQNCY pillar(s) where the pick applies (e.g. `picked_in: ["network-state"]`, `picked_in: ["education", "research"]`). One entity can be picked across pillars, but only when it genuinely belongs in each.

---

## 2. Conflict-of-interest disclosure

A FRQNCY pick is allowed to coexist with a money flow only when the relationship is disclosed. Three relationships are recognised:

| Type | What it means | Disclosure |
|---|---|---|
| **`null`** | No money flows between FRQNCY and this entity. The default. | None required. |
| **`contributor`** | The entity contributes to the FRQNCY Fund or to a Sanctuary operating budget. The contribution does not influence the pick. | A small "supports FRQNCY" note on the entry, plus a line on the Aligned page explaining what contributor means. |
| **`partner`** | A direct partnership exists — co-marketing, revenue share, joint programming, etc. Picks involving partners are still made independently of the partnership terms. | A clearly-labelled "FRQNCY partner" badge on the entry, plus a per-page disclosure footer. |
| **`affiliate`** | An affiliate or referral commission exists on the link. (FRQNCY currently does not use this — kept here for completeness.) | A clearly-labelled "affiliate link" badge plus an affiliate disclosure on every page that contains an affiliate link. **Default: avoid this category unless there is no cleaner option.** |

The schema field is `revenue_relationship: null | "contributor" | "partner" | "affiliate"` on each picked entity. Disclosure renders automatically from the field — no per-entry copywriting needed.

**Conflict-of-interest hard rules:**

1. The Fund cannot pick a portfolio company without `revenue_relationship: "contributor" | "partner"` set, *and* a separate Fund disclosure on the entity's profile.
2. An Aligned Goods entry that becomes a partner cannot also be a Fund portfolio company without explicit founder-level approval and a double-disclosure (both surfaces named on the entity).
3. Sponsored content is not a category. If a piece of content was paid for, it is not editorial — and FRQNCY does not publish it. There's no in-between.
4. **Money flowing the other direction (FRQNCY paying for something to be featured) is also off the table.** No bought placements on partners' platforms framed as picks. If we want to be on someone's site, we earn it.

---

## 3. Who can mark a pick

Today (≤5 contributors) the picking body is the founder + co-founder. Picks are made by direct edit to the relevant entity file. No process beyond a code commit.

This works at small scale. At the next thresholds it has to become explicit:

- **At ~25 contributors** — a "pick committee" of 3–5 named people. Each pillar has at least one committee member. A pick requires one committee member to vouch and a second to confirm. Disagreements are kept on the entity file as a comment, not erased.
- **At ~100 contributors** — a published "pick charter" (this doc, expanded with concrete examples). Onboarding for new committee members. Quarterly review of recent picks against the standards.
- **At any scale** — the founder retains a final-say veto on individual picks. This is not used to push picks through; it is used to *block* picks that violate the standards when the committee is split.

The picking body is **not** a popularity-based group. New committee members are invited by existing ones based on demonstrated taste in their pillar — measured by the quality of their vouches, not their follower count.

---

## 4. Pick provenance

Every pick should leave a trail. Not as bureaucracy — as honesty.

For each picked entity, the entity's data file should include (or link to) a one-paragraph rationale: *who picked it, when, what the test of "personally vetted" was, and which pillar it serves.* Not a long essay. A few sentences.

Example, on a hypothetical Aligned Goods pick:

> Picked by Orlando, 2026-04, after using the kettle daily for nine months. Replaces a plastic-bodied appliance that was leaching, and a glass alternative that broke twice. Network-state pillar (durable, repair-favoured, transparent supply chain).

This rationale is not marketing copy — it's editorial accountability. It also gives future agents grounds to decide whether the pick still holds up if circumstances change.

---

## 5. When to retire a pick

Picks are not permanent. They are retired when:

- The reason for picking no longer holds (the teacher has reframed their work in a way that conflicts with the values; the product was reformulated; the org has been bought).
- New evidence undermines the original vouch (a teacher's work is shown to be substantially derivative without credit; a product is shown to harm; a partner repeatedly violates the agreement).
- The picker would not pick it again today.

Retirement is **not** the same as removal. The entity stays on the site as a directory entry where appropriate; only the `picked_in` field is cleared. If the retirement is significant enough to inform readers (e.g., a previously-picked teacher), a one-line note on the entity profile explains what changed and when. We keep the history; we just don't keep the endorsement.

---

## 6. Reviewing this doc

This document is reviewed and updated:

- After any pick is publicly contested.
- Before scaling any new revenue surface (per REVENUE-MODEL.md).
- Quarterly during the first year, then yearly.

Edits that loosen the standards require founder approval. Edits that tighten them can be made by any contributor with a clear rationale.

---

## 7. The integrity test

When in doubt: would FRQNCY pick this if there were *no* possibility of money ever flowing from the relationship?

If yes — fine. If no — decline, regardless of the financial upside.

This is the only standard that protects the network's most valuable asset (trust) from the network's most predictable failure mode (drift toward what pays).
