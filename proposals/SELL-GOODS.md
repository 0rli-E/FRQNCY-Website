# Selling goods through Aligned Goods

Two ways FRQNCY makes money off the shelves. Both keep the editorial floor: the pick is decided first, on merit; money comes second and is disclosed.

## 1. Markup — FRQNCY sells the good (the "price on top" model)

FRQNCY lists the good at its own price (supplier cost + margin), takes the payment on-site via Stripe, and fulfils the order. This is the path where code unlocks the revenue directly.

**How it works**

- An entry in `aligned-goods.json` gets a `sell` block:
  ```json
  "sell": {
    "enabled": true,
    "price": 8900,            // cents — FRQNCY's sell price (cost + margin). Server-authoritative.
    "currency": "usd",
    "cost_cents": 0,          // your wholesale cost, internal margin tracking only
    "sku": "WBNO-AMPM-30",
    "ships_from": "supplier-dropship",
    "note": "…"
  }
  ```
- `aligned/buy.js` (loaded on `/aligned/` and every shelf page) turns the **Buy · $X** button into a checkout trigger. It sends only the `good_id` + quantity.
- `functions/api/checkout-session.js` (`kind: 'good'`) looks the price up **server-side** from `aligned-goods.json` — a tampered client can't set its own price — and opens a Stripe Checkout Session that collects email + shipping address. Guest-friendly: no FRQNCY account needed.
- `functions/api/stripe-webhook.js` records the paid order (item, qty, amount, email, shipping address) into the `goods_orders` table on `checkout.session.completed`.
- `/aligned/order/` is the post-checkout confirmation page.

**Seeded today (placeholder prices):** WBNO ($89.00) on Supplements, Lauretana water ($54.00) on Water. Both prices are placeholders flagged in the data.

**Go-live checklist (your steps)**

1. **Apply the migration** `supabase/migrations/024_goods_orders.sql` via the Supabase Management API (see memory `reference_supabase_apply_migrations`). Until it exists, paid orders make the webhook 500 and Stripe retries — so apply it before taking real money.
2. **Stripe env vars** (Cloudflare Pages → Settings → Environment): `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` — the same ones membership/courses already use. Test mode (`sk_test_…`) charges nothing; swap to live keys when ready.
3. **Webhook endpoint** in Stripe → Developers → Webhooks: `https://frqncy.network/api/stripe-webhook`, event `checkout.session.completed` (already configured for membership — no change needed).
4. **Set real prices.** Edit each `sell.price` (and `cost_cents`) in `aligned-goods.json`, run `node scripts/build-aligned-shelves.mjs`, bump `sw.js`, push.
5. **Fulfilment.** Each paid order lands in `goods_orders` with the shipping address. Forward it to the supplier / dropship, or ship from stock; then set the row `status = 'fulfilled'`.
6. **Sales tax.** Charging a markup makes FRQNCY merchant-of-record. For a live US launch, enable Stripe Tax in `checkout-session.js` (`automatic_tax[enabled]`) and register where required.

**To add another sellable good:** add a `sell` block to its entry, regenerate, bump `sw.js`, push. The Buy button appears automatically.

## 2. Referral — FRQNCY links out, earns commission (the affiliate model)

Already ~90% built in the data. 28 entries carry `revenue_relationship: "affiliate"` with `?ref=frqncy` links and the disclosure block is live on `/aligned/`. Nothing earns yet because the links are placeholders.

**Go-live (your steps)**

1. Enroll in each merchant's affiliate program (Amazon Associates, iHerb, the brand directly).
2. For each, replace the placeholder `?ref=frqncy` in `vendor[0].affiliate` **and** `vendor[0].url` with the real tracked URL, and set `vendor[0].affiliate_status: "live"`.
3. Regenerate (`node scripts/build-aligned-shelves.mjs`), bump `sw.js`, push. The merchant index flips the badge from pending to live automatically.

See `proposals/PARTNER-STRATEGY.md` for the outreach ladder and `proposals/ALIGNED-GOODS-MERCHANTS.md` for the tracking sheet.

## The floor

Neither model bends a pick. If a brand pays and a non-paying brand is better, the non-paying brand stays the pick. Resale goods (`Sold & shipped by FRQNCY`) are chosen by the same five questions as everything else. No paid placement, ever.
