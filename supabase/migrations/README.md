# FRQNCY — Supabase migrations

Authoritative migration set for the FRQNCY Supabase project (`vyazlspbmwmlyncdlezh`).

Run these in order. All are idempotent (`IF NOT EXISTS` / `CREATE OR REPLACE`), so re-running is safe.

| # | File | What it does |
|---|------|---|
| 001 | `001_social_schema.sql` | profiles, posts, likes, bookmarks, follows, comments, notifications, conversations, messages |
| 002 | `002_fix_conversation_rls.sql` | Fixes the DM RLS recursion bug. /social/messages stays 500 without it. |
| 003 | `003_subscribers_charts_storage.sql` | `subscribers` (homepage email signup), `charts` (My FRQNCY birth data + sanctuary state), three storage buckets (`avatars`, `post-media`, `chart-exports`) |
| 004 | `004_conviction.sql` | `posts.conviction` column (bullish/bearish/neutral) — self-expression per post, no aggregation |
| 005 | `005_search_indexes.sql` | pg_trgm indexes for /social/search. (Conviction leaderboard RPC was removed on cooperation-over-competition grounds.) |

## How to apply

### A — Supabase CLI (recommended, scriptable)

From the repo root:

```
supabase login
supabase db push
```

### B — psql

```
psql "$SUPABASE_DB_URL" -f supabase/migrations/001_social_schema.sql
psql "$SUPABASE_DB_URL" -f supabase/migrations/002_fix_conversation_rls.sql
psql "$SUPABASE_DB_URL" -f supabase/migrations/003_subscribers_charts_storage.sql
psql "$SUPABASE_DB_URL" -f supabase/migrations/004_conviction.sql
psql "$SUPABASE_DB_URL" -f supabase/migrations/005_search_indexes.sql
```

### C — Supabase dashboard (manual)

1. https://supabase.com/dashboard/project/vyazlspbmwmlyncdlezh/sql/new
2. Paste the file contents.
3. Click **Run**. Confirm success.
4. Repeat for each subsequent file.

## Note: `social-src/supabase/` was retired

The older `social-src/supabase/migrations/` folder (with `002_conviction.sql` + `003_search_and_leaderboard.sql`) was the early parallel attempt. Those files are now `004_conviction.sql` and `005_search_indexes.sql` here. The `social-src/supabase/` folder no longer exists — this is the single source.

## Graceful degradation

The app is designed to survive missing migrations:

- **001 missing:** social platform won't function at all.
- **002 missing:** `/social/messages` returns 500 (DM RLS recursion).
- **003 missing:** subscribe forms 500, chart save fails. Anonymous local-storage still works.
- **004 missing:** `ConvictionToggle` component is hidden; project-tagged posts still work.
- **005 missing:** search still functions via `ILIKE` fallback; performance degrades, correctness preserved.
