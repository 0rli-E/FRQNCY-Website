# Affiliate enrollment map — Aligned Goods

The goal: turn the 30+ `?ref=frqncy` placeholder links into real, earning, tracked links. You don't enroll in 69 programs one by one — you enroll in a few **networks** that cover many brands at once, then the handful of **high-coverage direct** programs, then pick off the long tail as traffic justifies it.

Status today: 88 goods across 69 merchants. ~30 entries already carry a `?ref=frqncy` placeholder; **0 are live**. Click data starts flowing now that `good_click` tracking ships (query `analytics_events` where `event_type='good_click'`, group by `properties->>good_id` — enroll where the clicks already are).

How to flip one live (once you have the real tracked URL): in `aligned-goods.json` set `vendor[0].url` AND `vendor[0].affiliate` to the tracked URL, set `vendor[0].affiliate_status: "live"`, then `node scripts/build-aligned-shelves.mjs`, bump `sw.js`, push.

## Tier 1 — Networks (enroll first, widest coverage)

Most of the DTC brands below run their affiliate programs *through* one of these networks. One approval = many brands.

- **Amazon Associates** — covers the commodity/retail goods that also sell on Amazon: cookware (Lodge, Le Creuset, Smithey, John Boos), sleep (Manta, Hostage Tape), coffee gear (AeroPress, Fellow), tools (Leatherman, Leuchtturm1917, Klean Kanteen), books (fallback if not Bookshop). Lower commission (1–4%) but instant breadth and high buyer trust.
- **Impact.com / ShareASale / CJ / Awin / Rakuten** — the DTC affiliate networks. Apply to all (free). Then search each network's brand directory for the merchants below and request the ones present. Many wellness/apparel/tech DTC brands (Oura, Therabody, Patagonia, Coyuchi, Native, Ledger, Proton, 1Password, Mullvad, Brave) live on one of these.

After Tier 1 you'll likely have a live path for 25–40 of the 88 goods.

## Tier 2 — High-coverage direct programs (most goods per signup)

Enroll directly with the merchants that carry the most goods — biggest return per application:

| Merchant | Goods | Shelves | Program route |
|---|---|---|---|
| iPyramids | 9 | EMCE | Shopify store — check footer for "Affiliates"/"Ambassadors"; they also sell a reseller package. Email if no public program. |
| Monatomic-ORME | 5 | Supplements, EMCE | Shopify; has a "Gold Rush Re-sellers Package" — they clearly support resale/affiliates. Ask for an affiliate or reseller link. |
| Bookshop.org | 5 | Library | Has its own first-class affiliate program (you may already qualify as an organization). Replaces Amazon for books and pays indie bookstores. |
| Energy Muse | 3 | EMCE | Shopify; check for affiliate/ambassador program. |
| Patagonia | 2 | Wear, Tools | Patagonia affiliate runs via a network (Tier 1) — request once approved. |

## Tier 3 — Long tail (one good each, ~55 merchants)

Pick these off as click data shows interest. Priorities by likely click volume + commission:
- **Subscriptions with recurring payouts** (best LTV): Oura (sleep), Proton, Mullvad, 1Password, Ledger (privacy), Waking Up, Brilliant (learn — both already have `?ref` placeholders, so programs exist), Hatch (sleep).
- **High-ticket, worth a direct email**: the turntables (Linn, Rega, Technics, Pro-Ject, Clearaudio — audio shelf), Amex Platinum (Amex has a referral/affiliate program — apply), Avocado mattress (has an affiliate program).
- **Mission-but-non-commercial** (no affiliate, leave as plain links): the retreat centers (Esalen, Plum Village, Kripalu, Spirit Rock, 1 Hotels — `stay`), the orgs (80,000 Hours, Khan Academy, Anthropic — `learn`). These earn nothing and that's fine; they're there for the reader, not the referral.

## Notes

- A few entries (Lauretana, White Oak Pastures, Frantoio Franci, Manuka Health, the body-care DTCs, cookware, coffee, movement) have no `?ref` placeholder yet because their program wasn't confirmed. Add the placeholder + `revenue_relationship: "affiliate"` when you find the program; leave `null` if there genuinely isn't one.
- **Editorial floor stands**: enrolling never changes a pick. If a paying brand is worse than a non-paying one, the non-paying one stays the pick. Bookshop-over-Amazon is the model — choose the aligned merchant even at lower commission.
- Re-generate this map anytime: the per-merchant counts come straight from `aligned-goods.json` vendor hostnames.
