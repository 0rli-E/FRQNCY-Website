# CURATION-AGENT.md — the Gardener

**Status:** Draft · 2026-06-12
**One line:** An AI curation agent that continuously proposes prunes and growth to the world tree, the constellation, and the beds — with one human steward per topic as the approver, and oversight that shrinks per-sector as trust is earned.

This is not a new system. It is the convergence of four things FRQNCY already has in motion: the QA harness, the editorial-canon memory, `frqncy-harness`, and the stewardship model. This doc specifies how they snap together.

---

## 1. The destination

> "An AI sufficiently advised, with enough memory and curation, to know how to prune the world tree / constellation / beds — with little human oversight, maybe 1 person per topic." — Orlando, 2026-06-12

The end state: each subsector (crypto, places, the Fund, …) has **one human steward** whose job has degraded from *editing* to *approving* to *spot-auditing*. The Gardener does the seeing and the proposing; the human keeps the taste and the veto.

What gets curated — the three surfaces:
- **World tree** — the `pillar → domain → topic` hierarchy (`content.json`).
- **Constellation** — the cross-topic edge graph (explore map / `network-map.js` / `appears_in` links).
- **Beds** — the entity data (`people`, `books`, `orgs`, `media`, `music`, `places`, `papers`).

Curation is two-directional: **prune** (remove, merge, demote, dedupe, kill dead edges, strip overclaim) *and* **grow** (add missing canon, attach resource cards, open new topics). The hard, dangerous half is pruning.

---

## 2. Architecture — four layers

| Layer | What it is | What exists today |
|---|---|---|
| **Senses** | How the agent sees what's wrong | `qa-full.py` (topics/pillars/domains/bios), `qa_beds.mjs` (beds), proposed `qa_coverage.mjs` (topic completeness) |
| **Memory** | The taste it prunes by | `/memory` editorial canon + `/proposals` (values, money source-canon, no-overclaim, no-Wikipedia, verb-locked pillars, bespoke-locks) |
| **Judgment** | The agent loop | `frqncy-harness` (traces, replay/eval, cost guardrails) |
| **Governance** | Who approves what | `stewards.json` manifest + `CODEOWNERS` |

The agent is thin. Its intelligence is **borrowed** — from the QA tools (what's broken), the memory (what FRQNCY values), and the steward (the final call). Build the senses and the memory well and the agent is mostly routing + drafting.

---

## 3. The two load-bearing principles

Everything else is plumbing. These two are the design.

### 3.1 The asymmetric prune gate

Additions are cheap to undo; **prunes are not**. Merging two topics or deleting a node touches `content.json`, every bed's `appears_in`, the constellation edges, the filesystem, and the explore graph *at once*. So changes are classed by reversibility, and the gate differs by class:

| Class | Examples | Gate |
|---|---|---|
| **Green — additive** | attach a resource card, add a bed entry, add a `frqncy_pick`, fill a missing field | fast lane; auto-applies once a sector is trusted |
| **Yellow — mechanical fix** | rename a broken `appears_in` ref, fix a dead link, normalize a field type | fast lane with a verifying QA re-run |
| **Red — destructive** | delete/merge/demote a topic, remove a bed entry, drop an edge, collapse a duplicate page | **always** stops at a human until the sector has *earned* red autonomy; never the default |

This mirrors FRQNCY's own rule — *don't delete what you didn't create* — and makes the scary operations the slowest by design.

### 3.2 Trust is calibrated, not assumed

This is the mechanism that actually shrinks oversight. **Every steward decision (approve/reject on a proposed change) becomes an eval case** in the harness trace store. Per sector, we track the agent's **proposal-vs-verdict agreement rate** over a rolling window.

- A sector advances a trust tier only when its agreement rate over the last *N* proposals clears a threshold (e.g. ≥95% on green/yellow before green auto-applies; a separate, higher bar for red).
- Autonomy is therefore **per-sector and earned, not global and granted.** Crypto graduates first — Orlando stewards it, so his verdicts train it fastest. Noisy sectors (traditions, commodities) stay propose-only until their numbers come up.
- Regression is automatic: if agreement drops (a steward starts rejecting), the sector demotes a tier. Trust is a live number, not a flag.

---

## 4. Staging

Each sector walks this ladder **independently**, gated by its eval score:

1. **Propose-only** — agent emits changesets; steward applies everything by hand. (Where every sector starts.)
2. **Bulk-approve** — steward approves a whole changeset in one pass; agent applies.
3. **Auto-apply safe class** — green + yellow auto-apply; red still queues for the human.
4. **Per-sector autonomy** — green/yellow run unattended; red auto-applies only for the rare classes that have themselves cleared the high bar; steward spot-audits.

The steward's effort curve: edit → approve → audit. That curve *is* "little oversight."

---

## 5. The stewards manifest

`stewards.json` is the single source of truth for who owns what and what each sector's current trust tier is. The ownership unit is a **sector** — explicitly *not* a domain, because real sectors are heterogeneous (crypto is a cross-domain cluster; places is a domain+bed; the Fund is a pillar).

```json
{
  "sectors": [
    {
      "id": "crypto",
      "steward": "orlando",
      "surface": {
        "topics": ["t-bitcoin", "t-defi", "t-nfts", "t-staking", "t-l1", "t-l2", "..."],
        "bed_prefixes": [],
        "globs": ["crypto/**", "crypto/crypto-projects.json"]
      },
      "trust": { "green": "auto", "yellow": "auto", "red": "manual" },
      "agreement_30d": 0.97
    },
    {
      "id": "places",
      "steward": "tbd",
      "surface": { "topics": [], "bed_prefixes": ["pl-"], "globs": ["places/**"] },
      "trust": { "green": "manual", "yellow": "manual", "red": "manual" },
      "agreement_30d": null
    }
  ]
}
```

This file drives `CODEOWNERS` generation (so a proposed change to `crypto/**` routes its PR to Orlando) and tells the agent which sector — and therefore which memory canon and which trust tier — a given change belongs to.

---

## 6. The changeset — the unit of work

The agent never edits the tree directly. It emits a **reviewable changeset**: a diff plus a one-line rationale and a class per change.

```yaml
sector: crypto
generated_by: gardener-run-2026-06-12
changes:
  - class: yellow
    op: rename_ref
    target: orgs.json#o-openclaw.appears_in
    from: "t-open-source"
    to: "t-opensource"
    why: "t-open-source is not a real topic id; t-opensource is. (qa_beds R1-INVALID-REF)"
  - class: red
    op: merge_topic
    from: "t-the-omnivores-dilemma-dupe"
    into: "b-omnivores-dilemma"
    why: "Duplicate book entry, identical Pollan quote. generate.js slug-dup bug."
```

Properties that make it safe:
- **Atomic + scoped** to one sector → clean git ownership, no cross-steward collisions (the parallel-commit hazard is structurally avoided).
- **Self-justifying** — every change cites its QA rule or memory principle, so the steward reviews *reasons*, not raw diffs.
- **Class-tagged** — the gate (§3.1) is applied per change, not per changeset.
- **Re-verified** — after apply, the relevant QA tool re-runs; a regression auto-reverts the change.

---

## 7. The first brick

Don't build the system. Build **one loop** and prove it:

> Agent reads the QA output + the sector's memory → emits a scoped, rationaled changeset → steward approves in one pass → agent applies → QA re-runs green.

The perfect first payload already exists: the **safe QA backlog** (`project_qa_backlog_2026_06_12`) — the 13 invalid refs, the Omnivore's Dilemma dupe, the `pl-lumina-casa` voice fix, the `/sports` dead link. All green/yellow. If the Gardener can produce *that* as a clean changeset and Orlando approves it in one pass, the loop is real and everything after is widening trust and scope.

---

## 8. Open decisions

1. **Where does sector content live?** Crypto stores content *outside* `content.resources` (own `/crypto/` tree + `crypto-projects.json`). Bless that per-sector pattern for everyone, or fold back into the monolith? (Recommendation: bless it — per-file ownership is what makes federation clean. Resolve the `/bitcoin/` vs `/crypto/bitcoin/` duplication as part of this.)
2. **Trust thresholds** — the actual numbers for tier promotion, and the window length, need calibration from the first dozen real changesets.
3. **Red-class autonomy** — does any destructive class *ever* go fully unattended, or is "spot-audit on red" the permanent ceiling? (Lean: permanent ceiling. Prunes always get a human glance.)
4. **Cadence** — scheduled (nightly cron / `frqncy-harness`) vs steward-triggered. (Lean: nightly propose, human-paced approve.)

## 9. Risks

- **`frqncy-harness` CLI is currently broken at startup** (privy-store TDZ) — the judgment layer's runtime needs a fix before the loop can run on it; until then the loop can run directly via the agent SDK.
- **Taste doesn't fully serialize.** The memory canon captures most of it, but the long tail of editorial judgment is why red-class never goes fully hands-off.
- **Silent scope creep.** A changeset that quietly bounds coverage (top-N, sampling) must say so — the agent logs what it did *not* touch, so "clean run" never masks "didn't look."

## 10. Next steps

1. Approve this framing (or push back on §3–§4 — they're the load-bearing parts).
2. Write `stewards.json` with the first three sectors: crypto (Orlando), places, fund.
3. Build `qa_coverage.mjs` — the missing sense (topic-completeness / card-coverage scoreboard).
4. Build the first brick: Gardener proposes the safe QA backlog as a changeset; Orlando approves; measure the first agreement datapoint.

---

*Companion docs: `proposals/SUB-AGENTS.md` (harness sub-agent posture), `proposals/HARNESS-PLAN.md` (the runtime), `EDITORIAL-STANDARDS.md` (what makes a pick), and the `/memory` canon (the taste).*
