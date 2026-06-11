-- Migration 024: Goods orders (Aligned Goods reseller checkout).
--
-- The "additional price on top" model: FRQNCY sells curated physical goods
-- (water, supplements like WBNO, nutrients) at its own price (cost + margin)
-- via Stripe Checkout. This table is the order ledger — one row per paid
-- checkout session, including the shipping address needed to fulfil it.
--
-- Inserted server-side by functions/api/stripe-webhook.js on
-- `checkout.session.completed` with metadata.kind = 'good'. Guests can buy
-- (no FRQNCY account), so there is NO user_id / profiles FK here — orders are
-- keyed by the Stripe session id, which is unique and idempotent on retries.
--
-- RLS is enabled with NO client policies: this table is service-role only.
-- No leaderboard, no public aggregation — it is a private fulfilment ledger.
--
-- Idempotent. Apply via the Supabase Management API (see
-- reference: memory `reference_supabase_apply_migrations`).

CREATE TABLE IF NOT EXISTS public.goods_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stripe_session_id TEXT UNIQUE,
    stripe_payment_intent TEXT,
    good_id TEXT NOT NULL,
    good_name TEXT,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity >= 1),
    unit_amount_cents INT,
    amount_total_cents INT,
    currency TEXT DEFAULT 'usd',
    email TEXT,
    ship_name TEXT,
    ship_address JSONB,
    status TEXT NOT NULL DEFAULT 'paid'
        CHECK (status IN ('paid','fulfilled','refunded','disputed','cancelled')),
    created_at TIMESTAMPTZ DEFAULT now(),
    fulfilled_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_goods_orders_status
    ON public.goods_orders (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_goods_orders_good
    ON public.goods_orders (good_id, created_at DESC);

ALTER TABLE public.goods_orders ENABLE ROW LEVEL SECURITY;

-- No SELECT/INSERT/UPDATE/DELETE policies for anon or authenticated roles.
-- The webhook writes with the service-role key (bypasses RLS); fulfilment is
-- done from the Supabase dashboard or an admin tool, also service-role.

COMMENT ON TABLE public.goods_orders IS
    'Aligned Goods reseller order ledger. One row per paid Stripe checkout session (metadata.kind=good). Guest-friendly (no user_id). Inserted by stripe-webhook; service-role only, never publicly aggregated.';
