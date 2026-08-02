-- ============================================================================
-- 027_group_select_creator.sql — let a creator read back their own group
--
-- Found by end-to-end testing 026 against the live database, and it broke
-- private-group creation outright.
--
-- createGroup() in social-src/src/lib/groups.ts inserts with `.select('*')`,
-- which PostgREST sends as `Prefer: return=representation` — an
-- INSERT ... RETURNING. PostgreSQL applies the SELECT policy to the returned
-- row, and 026's groups_select was:
--
--     visibility = 'open' OR public.is_group_member(id)
--
-- For a PRIVATE group neither branch holds at that instant: it isn't open, and
-- the creator is not yet a member — trg_group_creator_join is an AFTER INSERT
-- trigger, so its row is not visible to the RETURNING evaluation. The insert
-- itself succeeds and is then rejected on read-back with
-- 42501 "new row violates row-level security policy", so the client sees a
-- failure for a group that was in fact created. Open groups were unaffected,
-- which is why this hid until a private group was actually created.
--
-- Verified against production before the fix:
--   private + return=representation -> 42501
--   private, no representation      -> 201
--   open    + return=representation -> 201
--
-- The fix is also just correct on its own terms: whoever created a group
-- should be able to see it, without depending on a membership row existing.
--
-- Idempotent — safe to re-run.
-- ============================================================================

DROP POLICY IF EXISTS groups_select ON public.groups;
CREATE POLICY groups_select ON public.groups FOR SELECT
    USING (
        visibility = 'open'
        OR created_by = auth.uid()
        OR public.is_group_member(id)
    );

COMMENT ON TABLE public.groups IS
    'Meeting-place primitive for NRG. Open groups are public + freely joinable; private groups are invite-only (migration 026) and readable by their members and their creator. Visibility is immutable after creation. No ranking surface (cooperation over competition).';
