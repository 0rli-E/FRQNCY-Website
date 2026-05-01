-- Migration 014: Course purchases (Phase 3 Wk 5 Fri).
--
-- Per proposals/EXECUTION-PLAN-90D.md Phase 3 Wk 5 Fri: course pricing field +
-- one-time-payment checkout. courses.json[*].pricing now carries `model`,
-- `suggested`, and `stripe_price_id`. Quantum Grammar is the v0 paid course;
-- the rest stay free.
--
-- This table records granted access. Inserted by the stripe-webhook function
-- on `checkout.session.completed` with mode=payment. RLS: select-own only.
-- Not aggregated, not ranked. Simple access ledger.
--
-- Idempotent.

CREATE TABLE IF NOT EXISTS public.course_purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_slug TEXT NOT NULL,
    stripe_session_id TEXT,
    stripe_payment_intent TEXT,
    amount_cents INT,
    currency TEXT DEFAULT 'usd',
    status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('paid','refunded','disputed')),
    purchased_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, course_slug)
);

CREATE INDEX IF NOT EXISTS idx_course_purchases_user
    ON public.course_purchases (user_id, purchased_at DESC);

ALTER TABLE public.course_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS course_purchases_select_own ON public.course_purchases;
CREATE POLICY course_purchases_select_own
    ON public.course_purchases FOR SELECT USING (user_id = auth.uid());

-- INSERT happens server-side via the webhook using service-role; no client
-- INSERT policy. UPDATE / DELETE locked down — refunds + disputes flow through
-- the webhook only.

COMMENT ON TABLE public.course_purchases IS
    'Course access ledger. One row per (user, course) pair. Inserted by stripe-webhook on payment completion. RLS-locked to owner; never aggregated into a public surface.';
