# FRQNCY Structure Playbook — General Scenarios

> Generalized from the 2026-07 research (see `LEGAL-STRUCTURE-PLAN-2026-07-05.md` and `GLOBAL-TAX-SCAN-2026-07-07.md`). No names — roles and scenarios only, so it applies to anyone who joins. Not legal or tax advice; every real person slots into a scenario only after local sign-off.

---

## The structure

```
        Sole Director (territorial-tax resident, e.g. Paraguay; travels)
        Majority shareholder 51%+ · signs everything · manages from outside high-tax states
                                    │
     [optional] FRQNCY MTÜ (Estonian nonprofit — commons, mission lock, grants)
                                    │
                      ┌─────────────┴─────────────┐
                      │   FRQNCY OÜ (Estonia)     │   ← THE HUB
                      │   0% on retained profits  │
                      │   22% only on dividends   │
                      └─────────────┬─────────────┘
        ┌──────────────┬────────────┼───────────────┬───────────────┐
   US LLC sidecar   Spaces SPVs   Course/content   future country   (each new venture
   (Wyoming,        (one entity   ops inside OÜ    subsidiaries     = its own entity
   disregarded —    per property/                  (only where      under the OÜ)
   US rails,        city, local                    substance
   0% US tax)       jurisdiction)                  actually is)

   BESIDE the hub, never under it — the CRYPTO LAYER:
   Cayman Foundation (token governance/treasury) ── BVI Ltd (token issuer)
   BVI Incubator Fund (≤20 LPs, $20k min)
   Stablecoin via white-label permitted issuer, or non-redeemable credits
   RULE: no high-tax-country resident holds ≥1% or any role here
```

**Why the hub is Estonian:** 0% corporate tax on everything retained and reinvested (indefinitely — it's the tax system, not an incentive); ~22% once, only on distributed dividends, no withholding on top; salary to non-resident staff working outside Estonia is 0% tax and 0% social; fully remote administration (e-Residency), no local director, no audit at startup size, ~€3–6k/yr; Stripe + EU VAT (OSS) native; crypto-tolerant; EU-respectable. Verified against ~200 jurisdictions — nothing beats this combination for a reinvesting digital company with EU customers and mixed-country founders.

---

## Role scenarios (slot anyone in)

**Scenario A — Founder-director in a territorial/zero-tax country (traveling).**
Majority stake, sole signatory, manages the company from outside any high-tax state. Money out: (1) market-rate **salary** for real work performed outside Estonia — 0% Estonian tax/social, 0% at home under territorial rules; (2) **dividends** for surplus — 22% total; (3) **share sale** on exit — 0% (Estonia doesn't tax non-resident share sales; territorial home country doesn't tax foreign gains). Hygiene: real substance at the anchor residency (lease, tax registration, some presence), under ~120 days/yr in any high-tax country he visits, decisions documented from wherever he is.

**Scenario B — Co-founder/shareholder resident in a high-tax country (e.g. Germany).**
Holds equity **granted at par on day one** (exit-tax base ≈ zero forever), strictly **non-managing**: never signs, never directs day-to-day from the high-tax country. Combined shareholding of ALL residents of any one high-tax country stays **below 50%** (kills CFC control tests). Paid for actual work via **arm's-length contractor invoices** from their own local setup, taxed normally at home — they choose the volume. Dividends deferred (≈42% combined if taken while German-resident); the upgrade path is relocating first (e.g. Cyprus 60-day non-dom → dividends/gains at ~0–3%), cheap precisely because equity was granted at par. **Zero roles or holdings ≥1% in the crypto layer.**

**Scenario C — Employee resident in a high-tax country (e.g. Germany).**
No equity needed (or a small at-par grant under the same rules as B). Two clean hiring routes: (1) the OÜ registers as a foreign employer / uses an **Employer-of-Record** in the employee's country — local payroll, income tax and social contributions handled properly there; or (2) the person works as a **self-employed contractor** invoicing the OÜ (only if genuinely independent — sham self-employment is the classic trap German auditors hunt). What to avoid: a home office that functions as the company's fixed place of business (permanent-establishment risk) — keep authority to conclude contracts out of the employee's hands and the risk stays theoretical. Their salary is a normal deductible expense of the OÜ; costs the company nothing extra in Estonian tax.

**Scenario D — Employee/contractor anywhere low-tax or nomadic.**
Salary from the OÜ for work performed outside Estonia: 0% Estonian tax and social. Their own residence country decides what they owe — territorial-country residents and true nomads often owe ~0%. The company's obligation is just the contract and documentation.

**Scenario E — Future local teams (Spaces, country operations).**
The moment FRQNCY has a real presence in a country — a Space, staff, an office — that country gets its **own subsidiary** under the OÜ (a local GmbH/Ltd/SL per property or operation). Local revenue is taxed locally (unavoidable and correct for physical business); profits flow up to the OÜ as dividends (EU parent-subsidiary rules usually 0% WHT) and sit at 0% until redistributed. Real estate always lives in its own SPV — one property, one entity — so risk and financing stay ring-fenced.

---

## Revenue streams — how each flows

**Affiliate & partnership income.** Contracts and payouts run to the OÜ (or the US LLC sidecar for US-only networks — Awin, Impact, Amazon, brand deals all onboard foreign entities; commissions for work performed abroad carry 0% US withholding). Taxed nowhere until distributed. Disclosure fields per REVENUE-MODEL.md render automatically.

**Courses & memberships.** Stripe on the OÜ (EU cards ~3.5–4pp cheaper than a US account); EU consumer VAT via Union OSS, computed by Stripe Tax, one quarterly return. US sales tax only matters past ~$100k/state — monitor, ignore for now.

**Platform/creator payouts (YouTube etc.).** Paid to the OÜ. US-viewer royalty slice: budget 30% withholding (the US–Estonia 10% treaty rate needs a limitation-on-benefits opinion — treat as upside). Everything else pays gross.

**Token.** Issued by the BVI company under the Cayman foundation — never by the hub. The OÜ provides development/services to the token layer under an arm's-length, cost-plus agreement (that margin is the only part touching Estonia, still 0% retained). Token treasury appreciation stays offshore at 0%. High-tax-country residents: no roles, no ≥1% holdings. EU-facing anything now needs a licensed partner (MiCA grandfathering ended July 2026).

**Stablecoin.** Not self-issued anywhere feasible. Either white-label through a permitted issuer (Bridge/Stripe, Brale) or redesigned as **non-redeemable closed-loop credits** (no par redemption, no off-platform transfer → outside stablecoin regimes). Testnet as credits; legal opinion before anything redeemable.

**Fund.** BVI incubator fund (≤20 investors, $20k minimum, ~$15k setup) beside the structure. Outside LPs + the founder personally (0% at home). The OÜ may hold at most a small, non-controlling LP position — a big passive book inside the hub re-triggers both Estonian CFC rules and high-tax-country attribution for Scenario-B shareholders. The fund underwriting the free public layer works exactly as designed — from its own vehicle.

**Spaces / real estate / physical.** Per Scenario E: one SPV per property in its local jurisdiction, membership revenue local, profits upstream. The reciprocal-membership network is an OÜ-level product wrapped around locally-owned nodes.

---

## Money out — the complete menu

| Route | Total tax | Use for |
|---|---|---|
| Reinvest (product, team, subsidiaries, Spaces) | **0%** | Default — the network state funds itself |
| Salary for work outside Estonia (non-resident staff) | **0%** Estonia; home country's rules apply (territorial → ~0%) | Living costs of founder + nomad team |
| Contractor invoices (high-tax residents) | Their home rate, their choice of volume | Scenario B/C compensation |
| Dividends | ~22% once | Genuine surplus only |
| Share sale (non-resident seller) | **0%** | The real exit — build value, sell equity |
| Director/board fees to non-residents | ~43% | **Never** — use salary instead |
| Loans to shareholders | Reclassified as dividends | Don't |

There is no legal structure that turns the 22% dividend tax into 0 — buybacks, capital reductions above paid-in capital, and liquidation all hit the same tax by design. The system's honest answer: consume via salary (0%), grow via retention (0%), exit via share sale (0%), and let the 22% touch only the dividend slice in between.

---

## Standing rules (break these, break the structure)

1. **Paper matches reality.** The director signs everything; high-tax-country people never sign or manage from home; decisions documented where they're actually made.
2. **High-tax-country residents combined < 50% of equity**, all grants at par before value accrues, zero crypto-layer roles.
3. **Passive wealth stays out of the hub.** Fund, token treasury, big investment books → the offshore layer. The hub holds operating assets and subsidiaries.
4. **One venture, one entity.** New country, new property, new risk → its own subsidiary. Never mix Spaces debt with platform revenue.
5. **No letterboxes.** Every entity has a real function; the offshore layer is industry-standard for its purpose (token/fund), not a tax dodge for operating income.
6. **Redundant rails.** Stripe EE + US LLC sidecar (Stripe Atlas) + Wise/Payoneer/Revolut; sweep balances weekly; verify Stripe accepts the director's residency before launch.
7. **Sign-offs before money moves:** Estonian accountant (salary mechanics, VAT), high-tax-country tax advisor per Scenario B/C person (cap table + contractor documentation + payroll route), fund/token counsel (MiCA/GENIUS), residency counsel for the founder.
8. **Annual review.** Rates, blacklists, and platform policies move (this research is dated 2026-07). One afternoon a year keeps the structure current.

---

*The deep logic: Estonia taxes extraction, not creation. FRQNCY's economics — gift layer funded by surfaces, everything reinvested into the commons — pay ~0% by design, not by trickery. The structure is the revenue model, incorporated.*
