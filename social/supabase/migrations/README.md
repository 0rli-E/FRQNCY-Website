# FRQNCY Social — Supabase migrations

This folder holds the incremental SQL migrations for the FRQNCY Social schema.

## Applied order

Run these in order. All are idempotent (use `IF NOT EXISTS` / `CREATE OR REPLACE`), so re-running is safe.

| # | File | What it does | Required by |
|---|------|--------------|-------------|
| 001 | (initial schema — in Supabase dashboard) | profiles, posts, likes, bookmarks, follows, comments, notifications, conversations, messages | Everything |
| 002 | `002_conviction.sql` | Adds `posts.conviction` column (bullish/bearish/neutral) + composite index | ConvictionToggle, project filters |
| 003 | `003_search_and_leaderboard.sql` | pg_trgm indexes for search. (Leaderboard RPC removed April 2026 — no public ranking of people against each other.) | `/social/search` |

## How to apply (two options)

### A — Supabase dashboard (manual, no extra credentials)

1. Open the project → **SQL Editor** → **New query**.
2. Paste the contents of the migration file.
3. Click **Run**. Confirm success in the output panel.
4. Repeat for each subsequent file.

### B — psql / supabase CLI (scriptable)

From the repo root with a `SUPABASE_DB_URL` set:

```bash
psql "$SUPABASE_DB_URL" -f social/supabase/migrations/002_conviction.sql
psql "$SUPABASE_DB_URL" -f social/supabase/migrations/003_search_and_leaderboard.sql
```

Or with the Supabase CLI:

```bash
supabase db push
```

## Graceful degradation

The app is designed to survive missing migrations:

- **If 002 is missing**: `ConvictionToggle` is hidden, project-tagged posts still work.
- **If 003 is missing**: Search still functions — the client falls back to `ILIKE` without trigram indexes. Only performance degrades, not correctness.

That means: you can ship the frontend before applying migrations and the network will quietly upgrade as you apply each one.
