-- ============================================================================
-- Migration 023: Groups — the meeting-place primitive
-- ----------------------------------------------------------------------------
-- Per proposals/NRG north-star (2026-06-11): NRG · FRQNCY Social is the
-- gathering layer of the network — open groups + private groups + a townhall.
-- Until now "channels" were a client-side slug filter with NO backing table
-- (posts had no channel/group column at all). This migration adds the first
-- real Group primitive.
--
-- This pass ships OPEN groups (public, freely joinable, discoverable) + the
-- Townhall. Private-group post gating is intentionally deferred (see the note
-- on posts RLS below) — open-group posts are public, identical to today's feed.
--
-- "Permanence through login": membership + posts are durable rows keyed to the
-- authenticated profile (= auth.uid()), surviving across sessions and devices.
--
-- Idempotent — safe to re-run.
-- ============================================================================

-- ── groups ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.groups (
    id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug         TEXT NOT NULL,
    name         TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 80),
    description  TEXT CHECK (description IS NULL OR length(description) <= 500),
    -- 'open'    = public, anyone signed-in can join + post + read
    -- 'private' = invite-only (join + read gating lands in a later migration)
    visibility   TEXT NOT NULL DEFAULT 'open' CHECK (visibility IN ('open', 'private')),
    -- Accent color for the group card / header (hex). Cosmetic, optional.
    accent       TEXT,
    created_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    -- Denormalized count maintained by the trigger below so the directory
    -- never has to aggregate group_members per row.
    member_count INT NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ DEFAULT now()
);

-- Slugs are the public URL key (/social/groups/<slug>) — unique, lower-cased.
CREATE UNIQUE INDEX IF NOT EXISTS idx_groups_slug ON public.groups (lower(slug));
CREATE INDEX IF NOT EXISTS idx_groups_visibility_created
    ON public.groups (visibility, created_at DESC);

-- ── group_members ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.group_members (
    group_id  UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role      TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
    joined_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_user ON public.group_members (user_id);

-- ── posts.group_id ──────────────────────────────────────────────────────────
-- A post belongs to at most one group. NULL = it's a plain network post (the
-- existing global-feed behaviour, unchanged).
ALTER TABLE public.posts
    ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_posts_group_created
    ON public.posts (group_id, created_at DESC) WHERE group_id IS NOT NULL;

-- ── membership helper (SECURITY DEFINER to avoid RLS recursion) ──────────────
-- Migration 002 fixed a DM RLS recursion; the same trap exists for any policy
-- that reads group_members from within a group_members policy. This helper
-- runs as definer (bypasses RLS) so membership checks never recurse.
CREATE OR REPLACE FUNCTION public.is_group_member(gid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.group_members
        WHERE group_id = gid AND user_id = auth.uid()
    );
$$;

-- ── member_count maintenance ────────────────────────────────────────────────
-- SECURITY DEFINER so the counter UPDATE runs as the function owner, NOT as the
-- joining user. Without it, the AFTER-INSERT UPDATE on groups is silently
-- filtered by the groups UPDATE RLS policy (the joiner isn't the group creator),
-- so member_count never moves. (Found via end-to-end test 2026-06-12.)
CREATE OR REPLACE FUNCTION public.handle_group_member_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.groups SET member_count = GREATEST(member_count - 1, 0) WHERE id = OLD.group_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_group_member_count ON public.group_members;
CREATE TRIGGER trg_group_member_count
    AFTER INSERT OR DELETE ON public.group_members
    FOR EACH ROW EXECUTE FUNCTION public.handle_group_member_count();

-- Backfill: recompute every group's member_count from the source of truth.
-- Idempotent + self-heals any rows that drifted before the trigger was fixed.
UPDATE public.groups g
   SET member_count = (SELECT count(*) FROM public.group_members m WHERE m.group_id = g.id);

-- ── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.groups         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members  ENABLE ROW LEVEL SECURITY;

-- groups: open groups visible to everyone (incl. anon); private only to members.
DROP POLICY IF EXISTS groups_select ON public.groups;
DROP POLICY IF EXISTS groups_insert_own ON public.groups;
DROP POLICY IF EXISTS groups_update_creator ON public.groups;

CREATE POLICY groups_select ON public.groups FOR SELECT
    USING (visibility = 'open' OR public.is_group_member(id));
CREATE POLICY groups_insert_own ON public.groups FOR INSERT
    WITH CHECK (auth.uid() = created_by);
CREATE POLICY groups_update_creator ON public.groups FOR UPDATE
    USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

-- group_members: see your own rows always; see a group's roster if the group is
-- open or you're a member. Self-join is allowed only for OPEN groups (private
-- groups get an invite path in a later migration). Leave = delete your own row.
DROP POLICY IF EXISTS group_members_select ON public.group_members;
DROP POLICY IF EXISTS group_members_insert_self ON public.group_members;
DROP POLICY IF EXISTS group_members_delete_self ON public.group_members;

CREATE POLICY group_members_select ON public.group_members FOR SELECT
    USING (
        user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_id AND g.visibility = 'open')
        OR public.is_group_member(group_id)
    );
CREATE POLICY group_members_insert_self ON public.group_members FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_id AND g.visibility = 'open')
    );
CREATE POLICY group_members_delete_self ON public.group_members FOR DELETE
    USING (user_id = auth.uid());

-- posts RLS: the existing "posts_select_all USING (true)" policy (migration 001)
-- stays as-is. That's correct for OPEN groups — their posts are public, same as
-- the global feed. When private groups ship, this policy must be tightened to:
--   group_id IS NULL OR <group is open> OR is_group_member(group_id)
-- and posting into a group must require membership. Tracked as private-groups
-- follow-up — do NOT loosen anything here without that change landing together.

-- ── Seed: the Townhall + the eight pillar groups ────────────────────────────
-- created_by NULL = system-seeded. Idempotent via ON CONFLICT on the slug.
INSERT INTO public.groups (slug, name, description, visibility, accent) VALUES
    ('townhall',      'The Townhall',      'The whole network in one room. Introductions, questions, and the conversations that belong to everyone.', 'open', '#C4973A'),
    ('curate',        'Curate',            'What we choose to give our attention to — and why.',                          'open', '#C4973A'),
    ('education',     'Education',          'Learning in public. Courses, teachers, and what you''re studying now.',       'open', '#7AA2C4'),
    ('research',      'Research',           'Open questions, experiments, and what the evidence actually says.',           'open', '#8FB996'),
    ('media',         'Media',             'What we''re watching, reading, and listening to.',                            'open', '#C49A7A'),
    ('sell',          'Sell',              'Building things people want — offers, craft, and honest commerce.',           'open', '#C4B07A'),
    ('fund',          'Fund',              'Capital with conscience — funding the work that matters.',                    'open', '#A88FC4'),
    ('build',         'Build',             'Makers at work. Shipping, prototypes, and works in progress.',                'open', '#7AC4B0'),
    ('network-state', 'Network State',     'Coordinating as a people before a place.',                                    'open', '#C47A8F')
-- Inference target must match the unique index, which is on lower(slug).
ON CONFLICT (lower(slug)) DO NOTHING;

COMMENT ON TABLE public.groups IS
    'Meeting-place primitive for NRG. Open groups are public + freely joinable; private groups (invite-only) gate join+read — gating lands in a later migration. No ranking surface (cooperation over competition).';
COMMENT ON TABLE public.group_members IS
    'Group membership. Self-join allowed for open groups only. RLS-enforced; member_count on groups maintained by trg_group_member_count.';
COMMENT ON COLUMN public.posts.group_id IS
    'When set, this post belongs to a group and renders in that group feed instead of (well, in addition to query-wise) the global stream. NULL = plain network post.';
