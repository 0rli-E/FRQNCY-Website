-- 029 — VBRTN server-canonical memory (strategy: proposals/VBRTN-APP-STRATEGY-2026-08-20.md)
--
-- L3 episodic memory: chat threads + messages, one row per message, RLS'd to
-- the owner. The profile / semantic-memory layers (L0/L1/L2/L4) live in the
-- existing `charts` table as a JSON blob row (name='VBRTN') per user — no new
-- table needed there.
--
-- Idempotent for real: CREATE TABLE IF NOT EXISTS + DROP POLICY IF EXISTS
-- before every CREATE POLICY (CREATE POLICY has no IF NOT EXISTS).

create table if not exists public.vbrtn_threads (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null default '',
  summary     text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.vbrtn_messages (
  id          bigint generated always as identity primary key,
  thread_id   uuid not null references public.vbrtn_threads(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null check (role in ('user', 'assistant')),
  content     text not null,
  via         text,
  created_at  timestamptz not null default now()
);

create index if not exists vbrtn_messages_thread_idx on public.vbrtn_messages (thread_id, id);
create index if not exists vbrtn_messages_user_idx   on public.vbrtn_messages (user_id, created_at);
create index if not exists vbrtn_threads_user_idx    on public.vbrtn_threads (user_id, updated_at desc);

alter table public.vbrtn_threads  enable row level security;
alter table public.vbrtn_messages enable row level security;

-- Owner-only access. The companion API writes with the service role (bypasses
-- RLS); these policies are for direct client reads/exports and client-side
-- deletion of a thread.
drop policy if exists "vbrtn_threads_select_own" on public.vbrtn_threads;
create policy "vbrtn_threads_select_own" on public.vbrtn_threads
  for select using (auth.uid() = user_id);

drop policy if exists "vbrtn_threads_insert_own" on public.vbrtn_threads;
create policy "vbrtn_threads_insert_own" on public.vbrtn_threads
  for insert with check (auth.uid() = user_id);

drop policy if exists "vbrtn_threads_update_own" on public.vbrtn_threads;
create policy "vbrtn_threads_update_own" on public.vbrtn_threads
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "vbrtn_threads_delete_own" on public.vbrtn_threads;
create policy "vbrtn_threads_delete_own" on public.vbrtn_threads
  for delete using (auth.uid() = user_id);

drop policy if exists "vbrtn_messages_select_own" on public.vbrtn_messages;
create policy "vbrtn_messages_select_own" on public.vbrtn_messages
  for select using (auth.uid() = user_id);

drop policy if exists "vbrtn_messages_insert_own" on public.vbrtn_messages;
create policy "vbrtn_messages_insert_own" on public.vbrtn_messages
  for insert with check (auth.uid() = user_id);

drop policy if exists "vbrtn_messages_delete_own" on public.vbrtn_messages;
create policy "vbrtn_messages_delete_own" on public.vbrtn_messages
  for delete using (auth.uid() = user_id);
