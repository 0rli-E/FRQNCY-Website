-- ============================================================================
-- 003_subscribers_charts_storage.sql
-- Adds:
--   1. `subscribers` table — single source of truth for the homepage email
--      signup. A subscriber may or may not also be a profile (auth user).
--   2. `charts` table — persisted personalized chart / dreambuilding output
--      for logged-in users. Anonymous visitors continue to use localStorage.
--   3. Storage buckets — avatars (public), post-media (public), chart-exports
--      (private), with RLS policies tied to auth.uid().
-- Idempotent: safe to re-run.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. subscribers
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscribers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    -- Optional link to a profile if/when this email signs up for a full account
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    source TEXT DEFAULT 'frqncy_website',
    referrer TEXT,
    confirmed BOOLEAN DEFAULT false,
    confirmed_at TIMESTAMPTZ,
    unsubscribed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscribers_email ON public.subscribers (lower(email));
CREATE INDEX IF NOT EXISTS idx_subscribers_created ON public.subscribers (created_at DESC);

ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Anyone (anon role included) may INSERT a subscription via the API.
-- The Cloudflare function uses the anon key on the client side, then a
-- service-role key server-side for confirmation flows.
DROP POLICY IF EXISTS "subscribers_insert_anyone" ON public.subscribers;
CREATE POLICY "subscribers_insert_anyone"
    ON public.subscribers FOR INSERT
    WITH CHECK (true);

-- Reading subscribers is restricted: only the owning profile can see their own
-- record. Admin reads use the service-role key (which bypasses RLS).
DROP POLICY IF EXISTS "subscribers_select_own" ON public.subscribers;
CREATE POLICY "subscribers_select_own"
    ON public.subscribers FOR SELECT
    USING ( profile_id = auth.uid() );

-- Updates (e.g. unsubscribe) only by owner or service role.
DROP POLICY IF EXISTS "subscribers_update_own" ON public.subscribers;
CREATE POLICY "subscribers_update_own"
    ON public.subscribers FOR UPDATE
    USING ( profile_id = auth.uid() );

-- Auto-update updated_at
DROP TRIGGER IF EXISTS set_subscribers_updated_at ON public.subscribers;
CREATE TRIGGER set_subscribers_updated_at
    BEFORE UPDATE ON public.subscribers
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 2. charts (personalized chart / dreambuilding)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.charts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    -- Free-form name the user gives this chart ("My constellation", "v2", etc.)
    name TEXT NOT NULL DEFAULT 'My FRQNCY',
    -- The actual chart data — schema is intentionally JSON so the chart UI
    -- can evolve without migrations. Today this stores the my-frqncy.html
    -- 3-step form output + node selections.
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- Dreambuilding goals/intentions associated with this chart
    dreams JSONB DEFAULT '[]'::jsonb,
    is_public BOOLEAN DEFAULT false,
    -- Vanity slug for sharing (optional, set when is_public=true)
    slug TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_charts_owner ON public.charts (owner_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_charts_public ON public.charts (is_public) WHERE is_public = true;

ALTER TABLE public.charts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "charts_select_own_or_public" ON public.charts;
CREATE POLICY "charts_select_own_or_public"
    ON public.charts FOR SELECT
    USING ( owner_id = auth.uid() OR is_public = true );

DROP POLICY IF EXISTS "charts_insert_own" ON public.charts;
CREATE POLICY "charts_insert_own"
    ON public.charts FOR INSERT
    WITH CHECK ( owner_id = auth.uid() );

DROP POLICY IF EXISTS "charts_update_own" ON public.charts;
CREATE POLICY "charts_update_own"
    ON public.charts FOR UPDATE
    USING ( owner_id = auth.uid() );

DROP POLICY IF EXISTS "charts_delete_own" ON public.charts;
CREATE POLICY "charts_delete_own"
    ON public.charts FOR DELETE
    USING ( owner_id = auth.uid() );

DROP TRIGGER IF EXISTS set_charts_updated_at ON public.charts;
CREATE TRIGGER set_charts_updated_at
    BEFORE UPDATE ON public.charts
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 3. Storage buckets
-- ----------------------------------------------------------------------------
-- Buckets must be created via the Storage API or dashboard, but their RLS
-- policies live on the storage.objects table and we set them up here.

-- Create buckets idempotently. If a bucket already exists, ON CONFLICT DO NOTHING.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif']),
    ('post-media', 'post-media', true, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/gif']),
    ('chart-exports', 'chart-exports', false, 5242880, ARRAY['image/png','image/svg+xml','application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- avatars: public read, owner-only write to own folder (folder = uid)
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read"
    ON storage.objects FOR SELECT
    USING ( bucket_id = 'avatars' );

DROP POLICY IF EXISTS "avatars_owner_write" ON storage.objects;
CREATE POLICY "avatars_owner_write"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'avatars'
        AND auth.uid() IS NOT NULL
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "avatars_owner_update" ON storage.objects;
CREATE POLICY "avatars_owner_update"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "avatars_owner_delete" ON storage.objects;
CREATE POLICY "avatars_owner_delete"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- post-media: public read, any auth user may write to their own folder
DROP POLICY IF EXISTS "post_media_public_read" ON storage.objects;
CREATE POLICY "post_media_public_read"
    ON storage.objects FOR SELECT
    USING ( bucket_id = 'post-media' );

DROP POLICY IF EXISTS "post_media_owner_write" ON storage.objects;
CREATE POLICY "post_media_owner_write"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'post-media'
        AND auth.uid() IS NOT NULL
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "post_media_owner_delete" ON storage.objects;
CREATE POLICY "post_media_owner_delete"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'post-media'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- chart-exports: private — owner read/write only
DROP POLICY IF EXISTS "chart_exports_owner_read" ON storage.objects;
CREATE POLICY "chart_exports_owner_read"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'chart-exports'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "chart_exports_owner_write" ON storage.objects;
CREATE POLICY "chart_exports_owner_write"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'chart-exports'
        AND auth.uid() IS NOT NULL
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "chart_exports_owner_delete" ON storage.objects;
CREATE POLICY "chart_exports_owner_delete"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'chart-exports'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );
