-- Migration 022: analytics_events
-- Created: 2026-05-22
-- Purpose: Append-only event log for all meaningful interactions across FRQNCY web surfaces.
--          Feeds the analytics dashboard. No raw PII stored — IP is SHA-256 hashed at
--          the collector function level; user_id is nullable (anonymous sessions allowed).
-- Idempotent. Safe to run twice.

-- ─────────────────────────────────────────────────────────────────────────────
-- Table
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at           timestamptz NOT NULL DEFAULT now(),
  user_id              uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_id           text        NOT NULL,
  event_type           text        NOT NULL,
  properties           jsonb       NOT NULL DEFAULT '{}'::jsonb,
  url                  text,
  referrer             text,
  ip_hash              text,       -- SHA-256 of real IP, never the raw IP
  user_agent_simplified text       -- browser family only, never the raw UA string
);

COMMENT ON TABLE  public.analytics_events IS 'Append-only event log for FRQNCY web + NRG interactions. Written by /api/analytics Cloudflare Pages Function. Never update or delete rows — insert only.';
COMMENT ON COLUMN public.analytics_events.user_id              IS 'Supabase auth UID if user is signed in; NULL for anonymous sessions.';
COMMENT ON COLUMN public.analytics_events.session_id           IS 'crypto.randomUUID() stored in sessionStorage — ties page views within one browser tab session.';
COMMENT ON COLUMN public.analytics_events.event_type           IS 'Allowlisted event name. See frqncy-analytics.js for the canonical list.';
COMMENT ON COLUMN public.analytics_events.properties           IS 'Event-specific payload. PII keys (email, name, phone, password, token, key) are stripped before insert.';
COMMENT ON COLUMN public.analytics_events.ip_hash              IS 'SHA-256(raw_ip + daily_salt). Never store raw IP.';
COMMENT ON COLUMN public.analytics_events.user_agent_simplified IS 'Browser family + major version only (e.g. "Chrome 124"). Never the full UA string.';

-- ─────────────────────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────────────────────

-- Dashboard time-range queries (most queries start here)
CREATE INDEX IF NOT EXISTS analytics_events_created_at_idx
  ON public.analytics_events (created_at DESC);

-- Filter by event type (page_view, topic_view, etc.)
CREATE INDEX IF NOT EXISTS analytics_events_event_type_idx
  ON public.analytics_events (event_type);

-- Per-user journey queries
CREATE INDEX IF NOT EXISTS analytics_events_user_id_idx
  ON public.analytics_events (user_id)
  WHERE user_id IS NOT NULL;

-- Session funnel queries
CREATE INDEX IF NOT EXISTS analytics_events_session_id_idx
  ON public.analytics_events (session_id);

-- Composite for dashboard: event_type + time range (covers the most common analytic query)
CREATE INDEX IF NOT EXISTS analytics_events_type_time_idx
  ON public.analytics_events (event_type, created_at DESC);

-- GIN index on properties for arbitrary property queries (e.g. properties->>'topic_slug')
CREATE INDEX IF NOT EXISTS analytics_events_properties_gin_idx
  ON public.analytics_events USING GIN (properties);

-- ─────────────────────────────────────────────────────────────────────────────
-- Row-Level Security
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Anyone (anon + authenticated) can insert — needed for fire-and-forget client beacon
DROP POLICY IF EXISTS "analytics_events_insert_all" ON public.analytics_events;
CREATE POLICY "analytics_events_insert_all"
  ON public.analytics_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only service_role (server-side dashboard queries) can read
DROP POLICY IF EXISTS "analytics_events_select_service_role" ON public.analytics_events;
CREATE POLICY "analytics_events_select_service_role"
  ON public.analytics_events
  FOR SELECT
  TO service_role
  USING (true);

-- Nobody can UPDATE or DELETE (append-only invariant enforced at policy level)
-- (No policies created for UPDATE/DELETE = those operations are blocked for all roles)

-- ─────────────────────────────────────────────────────────────────────────────
-- Canonical event_type allowlist (reference; enforcement is in analytics.js)
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Content & navigation
--   page_view                   any page load
--   topic_view                  /v2/<slug>/ topic page load
--   explore_interaction         node click / search / filter on explore.html
--   resource_click              outbound resource link clicked
--   search_query                site search executed
--   course_view                 course page visited
--   scroll_depth                25 / 50 / 75 / 100 scroll milestone
--
-- Sanctuary / Word Illuminator
--   word_illuminated            Illuminator lookup executed
--   illuminator_opened          #illuminate= deep-link received
--   practice_session_started    practice tracked
--   practice_session_completed  practice marked done
--
-- Identity / auth
--   signup                      new profile created
--   login                       returning sign-in
--   key_backed_up               libsodium keypair backup confirmed
--
-- Social (NRG)
--   post_created                new post published
--   dm_sent                     encrypted DM sent
--   bluesky_connected           Bluesky handle linked
--   nostr_connected             Nostr key linked
--
-- Revenue
--   membership_checkout_started stripe checkout session opened
--   membership_converted        membership confirmed
--   course_purchased            course unlocked
--   newsletter_subscribed       email opt-in
--   referral_code_shared        ref code copy / share
--
-- Misc
--   export_downloaded           any JSON/CSV export
