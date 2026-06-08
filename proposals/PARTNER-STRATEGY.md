# Partner Strategy — Aligned Goods

Single source of truth for how FRQNCY contacts aligned merchants, structures the relationship, and earns revenue from the Aligned Goods surface without breaking editorial values. Read before sending any outreach.

Last touched: 2026-06-08.

## What this is for

Aligned Goods has 58 unique merchants in the index today across 13 shelves. None of them know FRQNCY exists yet. The page already pre-wires `?ref=frqncy` placeholder URLs on every iPyramids, Karelian Heritage, Energy Muse, DefenderShield, and Earthing entry — so the conversion plumbing is in place. What is missing is the partner contracts on the other end of those links.

This doc describes the system for closing that gap. It is deliberately small. The whole frame is that **the picks come first, the money comes second, and the second never bends the first.**

## The four-tier relationship ladder

Every Aligned Goods entry carries a `revenue_relationship` field with one of four values. The same four values are the rungs of the partner ladder:

**Tier 0 — `none`** (default). No money flows between FRQNCY and the merchant. We picked them because they meet the rubric. They may not even know they are on the page. Roughly 50 of our current 58 entries sit here.

**Tier 1 — `affiliate`**. A commission link. The merchant runs a public affiliate program; we enroll, we get a tracked URL, the URL goes into the `vendor.affiliate` field on the entry. Visitor clicks through, FRQNCY gets 3–15% of the sale. The lowest-friction step up from Tier 0 — no contract, no negotiation, just enrollment in a program the merchant already runs. About 8 of our entries currently have placeholder affiliate URLs awaiting enrollment.

**Tier 2 — `contributor`**. The brand makes a direct contribution to the FRQNCY Fund or a Sanctuary operating budget. Pick decision precedes the contribution. The brand is choosing to fund the editorial work rather than the placement. We disclose the relationship; the contribution does not promote the brand above any other.

**Tier 3 — `partner`**. A revenue-share or co-marketing agreement. The brand and FRQNCY are working together on something specific — a launch, a bundle, a course, a sanctuary residency. The brand may appear in editorial work (newsletters, podcast, events) beyond the static listing on Aligned Goods. This is the tier where money becomes substantial.

Every entry is independently classified. A brand can be Tier 0 in Cookware and Tier 2 in Body Care if they earn it.

## Who we contact

The screening criteria are the same as the picks: **used, clean, independent, verifiable, durable**. Add three operational filters:

1. **They run an affiliate program OR they take partner deals.** Brands that explicitly refuse both (some heritage Italian and Japanese makers do — Frantoio Franci, Misono) stay at Tier 0 forever. That is fine. The picks do not need to monetize.
2. **They are independent or founder-led.** Roll-ups and PE-owned consumer brands are a hard no. The bar is whether the founder still answers their own email.
3. **Their fulfilment is on-brand.** A great supplement brand that ships in single-use plastic, runs a Klaviyo spam funnel, or relies on Amazon for >80% of distribution is a no-go for Tier 2+. We can keep the link at Tier 1 if their product is genuinely best-in-class, but they do not get the deeper partnership.

## Outreach workflow

The funnel has four stages:

**Stage 1 — Research.** Pull the brand's affiliate page (most live at `/affiliates`, `/partners`, or `/wholesale`). Note commission rate, cookie window, payment terms. If they do not advertise a program, search for their Refersion, ShareASale, Impact, or Awin presence. If still nothing, they probably don't run one — escalate to direct partnership outreach.

**Stage 2 — First touch.** Cold email. Template below. One paragraph, link to the live FRQNCY entry, ask for affiliate enrollment OR a 15-minute call. No PDF attached. No deck on the first email.

**Stage 3 — Affiliate enrollment OR discovery call.** If they have a program, enroll, swap the placeholder URL in `aligned-goods.json`, set `affiliate_status: "live"`, push. Done. If they want a call, do it in 15 minutes. We are not selling — we are testing fit.

**Stage 4 — Tier 2/3 negotiation.** Only after the call confirms genuine alignment. Walk through the contributor ($X/month into the Fund) and partner (revenue share OR co-marketing) options. Close with a one-page agreement, not a contract.

## The cold-email template

Adapt per merchant; keep the rhythm.

```
Subject: FRQNCY picked you for our Aligned Goods index

Hi [first name],

I run FRQNCY Network — a consciousness-practice content platform with a
curated product index called Aligned Goods. We have a one-pick-per-shelf
editorial format, no paid placement, and a small but growing audience of
people who actually buy across body care, sleep, supplements, energy
tools, and a few other categories.

[BRAND] is the [tier: Editor's Choice / aligned entry] on our [shelf
name] shelf. You can see the entry here: [direct URL]. The pick was
made on the merit of the product; I want to ask about putting an
affiliate path on it so the work of pointing people at you also funds
the work of finding the next right thing.

Do you run a program I can enroll in, or is there someone on your side
I should talk to for 15 minutes?

Warm,
Orlando
Founder, FRQNCY Network
https://frqncy.network/aligned/
```

Three rules: lead with the pick, not the ask; show them their entry; do not pad the email with social proof we have not earned yet.

## What we won't do

**No paid placement.** Not for a flagship slot, not for an Editor's Choice slot, not for a category we don't have a shelf for. This is the value that makes the rest of the system mean anything.

**No exclusivity.** A merchant cannot pay us to keep a competitor off the shelf. If two products in the same shelf are both pick-worthy, we ship the one that meets the rubric better. Money flows do not break the tie.

**No sponsored content disguised as editorial.** If a brand pays us for placement in the newsletter or the podcast, it carries an `❖ Sponsored` mark and is not labeled as a pick.

**No data sale.** We do not sell, rent, or share visitor data with any partner. Affiliate links are server-tracked via `?ref=frqncy` parameters; the data stays with FRQNCY.

**No race-to-the-bottom commission games.** We will not stack affiliate IDs, hide higher-rate competitors, or rewrite picks to favor better-paying merchants. The commission rate has no input on the pick.

## Revenue model — back of envelope

**Affiliate (Tier 1) at scale.** Average shelf merchant runs 5–15% commission with a 30–60 day cookie. Aligned Goods today averages ~$200 AOV across the index (skewed high by iPyramids, balanced down by Pro-Ject, Bite, Loop). At 1% click-to-purchase conversion and 10% commission, that is ~$0.20 in earned revenue per merchant click.

For Aligned Goods to clear $5K/month from affiliate alone (a useful floor — covers tooling, hosting, the part-time editor we'd want), the page needs ~25,000 outbound merchant clicks per month. At 5% page-CTR-to-outbound that is ~500K page views per month. Realistic at a 12-month horizon, not on day one.

**Contributor (Tier 2).** Five brands at $500/month into the FRQNCY Fund is $30K/year. Closing five is a six-month negotiation, not a six-day one. The brands that say yes here are buying the editorial line, not the click.

**Partner (Tier 3).** One serious partnership — a sanctuary residency program co-marketed with WBNO, an iPyramids retreat bundled into the Sanctuary, a Linn LP12 listening-room installation — is in the $20K–$100K range per deal. Two per year covers the rest of the operating cost. These come from the relationships that started as Tier 1.

The realistic 18-month picture: ~$80–120K from a mix of all three tiers. Not a venture-scale business. Enough to fund the editorial work and the small operational team. Which is the only thing that matters.

## Reporting and disclosure

Two surfaces:

**The page.** Every entry shows its `revenue_relationship` badge when non-`none`. The merchants index at the bottom shows the live / pending / unmonetized status per merchant. The "How we earn" disclosure explains the four-tier system and links here.

**The Fund.** Quarterly, FRQNCY publishes a breakdown of all Tier 1–3 revenue, by merchant and by category, on `/fund/`. Total revenue, total contributions, total expenses. The same level of transparency we expect from the merchants we list.

## Workflow integration

The day-to-day operations live in three places:

- `aligned-goods.json` — the canonical source of truth for every entry's `vendor[].affiliate`, `vendor[].affiliate_status`, and `revenue_relationship`. Edits here flow automatically to the page render and the merchant index.
- `proposals/EDITORIAL-STANDARDS.md` — the rules for picks. Read before adding or moving anything.
- This doc — the rules for partnerships. Read before any outreach.

A new partner enrollment is a single PR:
1. Update `vendor[0].affiliate` to the live tracked URL.
2. Update `vendor[0].affiliate_status` to `"live"`.
3. Update `revenue_relationship` to the right tier.
4. Bump `sw.js` VERSION.
5. Push.

The merchants index header re-counts on the next page load. The badge flips from "Affiliate · pending" to "Affiliate · live." That is the whole loop.

## Open questions

1. **Who owns the outreach in practice?** Right now it is Orlando. At >10 merchants/month, it needs to be a dedicated partner manager or a clear async workflow. Decide before scaling.
2. **What is the cookie / attribution standard we ask for?** Some affiliate programs default to 7 days; we should ask for 30 minimum where we have leverage.
3. **Crypto-native settlement.** Several Tier 1 candidates (iPyramids, Karelian Heritage) might accept USDC payouts. Worth asking; reduces banking friction at scale.
4. **The non-affiliate picks** (Lauretana, Frantoio Franci, AeroPress, the Italian / Japanese heritage tier) are the picks that prove the page is not a commission farm. We should never feel pressure to monetize them — their presence as Tier 0 is the editorial floor.

## Related docs

- `proposals/ALIGNED-GOODS.md` — canonical handoff for the page itself.
- `proposals/EDITORIAL-STANDARDS.md` — what makes a FRQNCY pick.
- `proposals/REVENUE-MODEL.md` — Aligned is one of five revenue surfaces.
- `proposals/ALIGNED-GOODS-MERCHANTS.md` — when it exists, the per-merchant tracking sheet for affiliate status, contact owners, last-touched, MRR contribution.
