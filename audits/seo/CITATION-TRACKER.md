# FRQNCY Citation Tracker

**Purpose.** Track every Wikipedia-allowable mention of FRQNCY (the network at frqncy.network) as it lands. When the tracker shows ≥ 5 hard sources or ≥ 8 mixed sources, the Wikipedia notability case opens.

**Pairs with:** `runs/2026-05-13-phase-5.1-wikipedia-notability-dossier.md`. Re-run the dossier quarterly; this tracker is updated on every new mention.

**Conventions.** A "hard" source is significant in-depth coverage in a Wikipedia-recognized publication. A "soft" source is shorter or in a smaller venue. Three softs ≈ one hard. The dossier's §"Notability path" lists what qualifies.

---

## Quick stats

| Class | Count | Target before submission |
| --- | ---: | ---: |
| Hard sources landed | 0 | 5 |
| Soft sources landed | 0 | (3 ≈ 1 hard) |
| In-flight pitches | 0 | — |
| Wikidata entities live | 0 | 4 (briefs ready) |

Recommendation: submit Wikipedia draft only when **hard ≥ 5** OR **(hard × 1) + (soft / 3) ≥ 5**.

---

## Hard qualifying sources

Each entry is a Wikipedia-allowable source giving significant, in-depth, independent coverage of FRQNCY-the-network. Examples: NYT/FT/Forbes/Atlantic/Wired feature article, Tim Ferriss / Lex Fridman / EconTalk podcast episode about FRQNCY, peer-reviewed paper citation, published book citation.

| Date | Source | Type | URL | Context | Sentence-quote | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| – | – | – | – | – | – | – |

_(empty — first entries land via Days 30-90 of the visibility plan)_

---

## Soft qualifying sources

Each entry is a shorter or smaller-venue mention. Examples: Stratechery / The Generalist / Common Cog / verified Substacks; podcast Tier 2 appearances; aggregator features (HN, Product Hunt, Indie Hackers); conference programs.

| Date | Source | Type | URL | Context | Sentence-quote | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| – | – | – | – | – | – | – |

_(empty — first entries land via the Days 1-30 podcast outreach + LinkedIn cadence)_

---

## In-flight (pitched but not landed)

| Pitched-on | Target | Type | Channel | Status | Expected outcome | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| – | – | – | – | – | – | – |

_(empty — populate from `PODCAST-TRACKER.md` and any earned-media pitches once they're sent)_

---

## Wikidata entities (separate path, can ship now)

These don't count toward Wikipedia notability directly, but they create the structured-data substrate the eventual article can pull from. Briefs ready in `runs/2026-04-29-phase-4.5-knowledge-graph-briefs.md`.

| Entity | Q-number | Live | Statements | Notes |
| --- | --- | --- | --- | --- |
| FRQNCY (network) | – | ☐ | – | Brief ready |
| The FRQNCY Podcast | – | ☐ | – | Brief ready |
| Orlando Eisenreich | – | ☐ | – | Brief ready |
| Intaaya | – | ☐ | – | Brief ready |

After each entity is created, capture the Q-number, then update:

1. Homepage Organization JSON-LD — add `identifier: { @type: PropertyValue, propertyID: "wikidata", value: "Q<n>" }`
2. The entity's `sameAs` arrays across `/people/orlando/`, `/podcast`, `/places/intaaya/`, etc.

---

## Brand-collision register

Wikipedia notability research must explicitly disambiguate FRQNCY-the-network from these other entities. Add to this list whenever a new collision is discovered.

| Entity | Domain | What | Established |
| --- | --- | --- | --- |
| FRQNCY Media | [frqncy.media](https://frqncy.media/) | Atlanta podcast/documentary studio (Michelle Khouri) | 2018 |
| FRQNCY Media Group | [fmgnetworks.com](https://fmgnetworks.com/) | Conscious-media network (Jody Colvard) | 2004 |
| FRQNCY Magazine | [frqncymagazine.com](https://frqncymagazine.com/) | Magazine subsidiary of FMG | unknown |
| FRQNCY Radio | [fmgradio.com](https://fmgradio.com/) | Radio subsidiary of FMG | unknown |
| FRQNCY +  | [frqncyplus.com](https://frqncyplus.com/) | Subscription subsidiary of FMG | unknown |
| FRQNCY Performance | [frqncyperformance.com](https://www.frqncyperformance.com/) | Fitness/gym (Islip, NY) | unknown |
| FRQNCY | [frqncy.com](https://frqncy.com/) | Lifestyle/retail brand | unknown |
| Frequency Holdings | [newmediawire NewsNation feature](https://www.newmediawire.com/news/frequency-holdings-otc-frqn-ceo-rick-jordan-featured-on-newsnation-prime-to-discuss-1-billion-national-text-scam-7083613) | OTC: FRQN, fintech / security (Rick Jordan) | unknown |

---

## Update cadence

- **Monthly:** add any new mentions discovered via Google Alerts, Plausible referrers, manual scan of HN / Reddit / Substack
- **Quarterly:** re-run the Phase 5.1 notability dossier with this tracker as the evidence pack
- **On notability event:** when a hard source lands, both this tracker AND the dossier get updated within 24 hours so future agents see the new state

---

## What triggers re-evaluation

Any of these = open the dossier and reconsider:

- First Wikipedia-allowable publication feature
- First Tim-Ferriss-tier podcast appearance
- First academic citation
- First published-book citation
- Wikipedia mainspace article on a related subject that cites FRQNCY in passing (catch this via Google Alerts)

When any of those happens, **don't wait for the quarterly review**. Open the dossier the same week, add the source to this tracker, reassess submission readiness.
