# Session Summary: NRG & VBRTN Integration Planning — 2026-04-28

## Overview
This session added two new sub companies — **NRG** and **VBRTN** — to FRQNCY's integration pipeline, with associated planning docs and context graph updates.

---

## What Was Changed

### 1. **IDEAS.md** — Added Two Integration Opportunities

**File:** `/FRQNCY WEBSITE/IDEAS.md`

Added two new sections under the **Integrations** heading (after Legion Fund Integration):

#### NRG Integration
- Listed as a sub company integration opportunity for FRQNCY
- Potential contexts identified:
  - Could complement **FRQNCY Fund** (alongside Echo, Legion)
  - Could enhance **Social Platform** with wallet/feature integration
  - Could support **FRQNCY Space** partnerships or creator payouts
- Marked as requiring scope + API clarification

#### VBRTN Integration
- Listed as a sub company integration opportunity for FRQNCY
- Same potential contexts as NRG
- Marked as requiring scope + API clarification

**Why:** These represent strategic partnership/integration opportunities that Orlando wants to explore. Both could plug into existing FRQNCY features (Fund, Social, Space) once scope is clarified.

---

### 2. **context-graph.json** — Added Entities & Relationships

**File:** `/memory/context-graph.json`

#### New Entities Added:

```json
"platform:nrg": {
  "type": "platform",
  "name": "NRG",
  "aliases": ["NRG"],
  "observations": [
    {"fact": "Identified as sub company for FRQNCY integration", "since": "2026-04-20", "source": "conversation"},
    {"fact": "Listed in IDEAS.md as potential integration opportunity", "since": "2026-04-20", "source": "codebase"}
  ]
}

"platform:vbrtn": {
  "type": "platform",
  "name": "VBRTN",
  "aliases": ["VBRTN"],
  "observations": [
    {"fact": "Identified as sub company for FRQNCY integration", "since": "2026-04-20", "source": "conversation"},
    {"fact": "Listed in IDEAS.md as potential integration opportunity", "since": "2026-04-20", "source": "codebase"}
  ]
}
```

#### New Relationships Added:

```json
{"from": "feature:fund", "to": "platform:nrg", "type": "CONSIDERS_INTEGRATION", "context": "Listed in IDEAS.md for partnership exploration", "since": "2026-04-20"},
{"from": "feature:fund", "to": "platform:vbrtn", "type": "CONSIDERS_INTEGRATION", "context": "Listed in IDEAS.md for partnership exploration", "since": "2026-04-20"}
```

#### Metadata Updates:
- `lastUpdated`: Changed from `2026-04-18` → `2026-04-20`
- Changelog entry added: `"Added NRG and VBRTN as sub company integration opportunities in IDEAS.md and context graph"`

**Why:** The context graph tracks all FRQNCY project entities and their relationships. This ensures future agents can traverse the connection between FRQNCY Fund and these new platforms, and see when they were introduced.

---

## Key Details for Future Work

### Integration Exploration Status
Both NRG and VBRTN are in **discovery phase**:
- ✅ Identified as integration candidates
- ✅ Added to planning documents
- ❌ Scope not yet defined (marked `[capability — clarify scope and partnership model]`)
- ❌ Partnership model not confirmed
- ❌ API availability not verified

### Next Steps (for whoever continues this work)
1. **Clarify scope:** What specific capability would each bring to FRQNCY?
2. **Partnership model:** Is this a white-label integration, co-marketing, wallet bridge, creator payout flow, or something else?
3. **API investigation:** What endpoints/documentation exist for each platform?
4. **Feature mapping:** Which of these could most directly plug into:
   - FRQNCY Fund (primary candidate — ecosystem of fundraising platforms)
   - Social Platform (secondary — wallet/conviction tracking features)
   - FRQNCY Space (tertiary — membership/creator payouts)

### Related Existing Integrations
For reference, FRQNCY already has documented integrations with:
- **Echo.xyz** — Onchain capital formation platform ($200M+ facilitated, 300+ deals, acquired by Coinbase for $375M)
- **Legion** — Merit-based MiCA-compliant ICO platform (350K+ investors, Legion Score reputation system)
- **Luma** — Events calendar (embed placeholder in space.html, URL TBD)

Both Echo and Legion are featured on the FRQNCY Fund page (`v2/fund/index.html`).

---

## Files Modified

| File | Change Type | Key Updates |
|------|------------|-------------|
| `IDEAS.md` | Content addition | 2 new integration sections under "Integrations" |
| `context-graph.json` | Entity + relationship addition | 2 new platform entities, 2 new relationships, metadata + changelog |

---

## How This Fits Into FRQNCY

**FRQNCY Fund** (`v2/fund/index.html`) is positioned as a decentralized fundraising hub. The current vision:
- Showcases Echo.xyz and Legion as infrastructure partners
- 4-phase roadmap: Vision → Foundation → Launch → DAO Governance
- NRG and VBRTN would likely fit as additional infrastructure partners if scope aligns

**FRQNCY Social Platform** (Supabase + Astro + Preact) has project-anchored posts and conviction tracking. Either platform could integrate as:
- Wallet provider for creator payouts
- Reputation/conviction data source
- Ecosystem expansion

---

## Session Context
- **User:** Orlando (orlando.eisenreich@gmail.com)
- **Project:** FRQNCY Network
- **Scope:** Planning phase — identifying integration opportunities
- **Timeline:** Information current as of 2026-04-28

---

## For Next Agent

1. **Read this document first** — it gives the full context of why NRG and VBRTN were added.
2. **Check IDEAS.md** for the full planning context and "Open Questions" section.
3. **Check context-graph.json** to see how these platforms fit into the larger entity landscape.
4. **Reference existing integrations** (Echo, Legion) as templates for scope/API/partnership patterns.
5. **Coordinate with Orlando** once you've done scope discovery — the partnership model depends on Orlando's strategic intent.
