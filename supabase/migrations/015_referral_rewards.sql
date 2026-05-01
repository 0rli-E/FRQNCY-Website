-- Migration 015: Referral rewards (Phase 3 Wk 6 Mon-Tue).
--
-- Per proposals/EXECUTION-PLAN-90D.md Phase 3 Wk 6: refer 3 → free month
-- membership credit; refer 10 → quarterly gathering invite; refer 25 →
-- permanent founder badge on profile.
--
-- Rewards are tiered, opt-in, never publicly compared. The badge is shown
-- on the user's OWN profile only — not in some leaderboard or "top referrer"
-- surface (cooperation rule).
--
-- Insertion happens server-side via functions/api/check-rewards.js. RLS:
-- select-own only. Each (referrer_id, tier) pair is unique — re-running
-- check-rewards is idempotent.
--
-- Idempotent.

CREATE TABLE IF NOT EXISTS public.ref_rewards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    tier SMALLINT NOT NULL CHECK (tier IN (3, 10, 25)),
    kind TEXT NOT NULL CHECK (kind IN ('free_month_credit','gathering_invite','founder_badge')),
    granted_at TIMESTAMPTZ DEFAULT now(),
    redeemed_at TIMESTAMPTZ,
    notes TEXT,
    UNIQUE (referrer_id, tier)
);

CREATE INDEX IF NOT EXISTS idx_ref_rewards_referrer
    ON public.ref_rewards (referrer_id, granted_at DESC);

ALTER TABLE public.ref_rewards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ref_rewards_select_own ON public.ref_rewards;
CREATE POLICY ref_rewards_select_own
    ON public.ref_rewards FOR SELECT USING (referrer_id = auth.uid());

-- INSERT/UPDATE happen server-side via service-role only. No client-side
-- self-grant path — would let a user claim founder-badge with zero referrals.

-- A small profile field for the founder badge so the public profile page can
-- render it without an extra query.
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS founder_badge BOOLEAN DEFAULT false;

COMMENT ON TABLE public.ref_rewards IS
    'Tiered referral rewards (3/10/25). Granted by check-rewards function based on ref_signups.became_member count. Never aggregated into a public leaderboard per CLAUDE.md cooperation rule. Owner-only RLS.';
COMMENT ON COLUMN public.profiles.founder_badge IS
    'True when the user has reached 25 referred members. Visible only on their own public profile. Permanent — does not decay.';
