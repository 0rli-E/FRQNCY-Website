-- Migration 013: Membership v0 + referral codes
-- Per proposals/EXECUTION-PLAN-90D.md Phase 3 Wk 5.
--
-- One tier (Network Member). Stripe lives off-chain — only the customer_id
-- and subscription_id are stored. RLS: only the owner reads their own row.
--
-- Referrals: each profile gets a 6-char ref_code on first visit to /membership/.
-- ref_signups records who joined via whose code. No public ranking, no public
-- leaderboard — per CLAUDE.md cooperation rule. Just attribution.
--
-- Idempotent.

-- ----------------------------------------------------------------------------
-- 1. memberships
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.memberships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    tier TEXT NOT NULL DEFAULT 'network_member',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','past_due','canceled','trialing')),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_memberships_user ON public.memberships (user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON public.memberships (status);
CREATE INDEX IF NOT EXISTS idx_memberships_stripe_sub ON public.memberships (stripe_subscription_id);

ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS memberships_select_own ON public.memberships;
CREATE POLICY memberships_select_own ON public.memberships FOR SELECT USING (user_id = auth.uid());
-- INSERT/UPDATE happen via the service-role webhook function only.

DROP TRIGGER IF EXISTS set_memberships_updated_at ON public.memberships;
CREATE TRIGGER set_memberships_updated_at
    BEFORE UPDATE ON public.memberships
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 2. ref_codes
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ref_codes (
    code TEXT PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ref_codes_owner ON public.ref_codes (owner_id);

ALTER TABLE public.ref_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ref_codes_select_public ON public.ref_codes;
-- Codes are public-readable so /signup?ref=XYZ can resolve them.
CREATE POLICY ref_codes_select_public ON public.ref_codes FOR SELECT USING (true);
DROP POLICY IF EXISTS ref_codes_insert_own ON public.ref_codes;
CREATE POLICY ref_codes_insert_own ON public.ref_codes FOR INSERT WITH CHECK (owner_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 3. ref_signups
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ref_signups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ref_code TEXT NOT NULL REFERENCES public.ref_codes(code) ON DELETE CASCADE,
    referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    became_member BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ref_signups_referrer ON public.ref_signups (referrer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ref_signups_referred ON public.ref_signups (referred_id);

ALTER TABLE public.ref_signups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ref_signups_select_referrer ON public.ref_signups;
-- Referrer sees who joined via them; the referred sees their own row.
CREATE POLICY ref_signups_select_referrer ON public.ref_signups FOR SELECT
    USING (referrer_id = auth.uid() OR referred_id = auth.uid());
DROP POLICY IF EXISTS ref_signups_insert_self ON public.ref_signups;
-- A user can only insert a row referencing themselves as the referred party.
CREATE POLICY ref_signups_insert_self ON public.ref_signups FOR INSERT
    WITH CHECK (referred_id = auth.uid());

COMMENT ON TABLE public.memberships IS 'Membership v0. One tier. Stripe lookup keys only — no PII.';
COMMENT ON TABLE public.ref_codes IS 'Per-profile 6-char referral codes. Public-readable so /?ref=XYZ resolves. Codes are not secrets.';
COMMENT ON TABLE public.ref_signups IS 'Attribution log. Never aggregated into a public leaderboard per CLAUDE.md.';
