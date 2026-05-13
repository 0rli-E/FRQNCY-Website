---
description: Audit Supabase migration state — show which migrations are in source vs applied, and how to apply the gap.
---

Walk through the migration backlog and present a clean diff between source and applied.

```bash
# List all migration files in source.
ls -1 supabase/migrations/*.sql | sed 's|supabase/migrations/||' | sort

# Count.
echo "Source count: $(ls supabase/migrations/*.sql | wc -l)"
```

Then prompt Orlando to verify applied state by running these probes against Supabase (the schema columns added by each migration). If a probe returns a 200 with the expected column, the migration is applied. Each is non-destructive — read-only schema queries.

The fastest probe is in the Supabase SQL editor at <https://supabase.com/dashboard/project/vyazlspbmwmlyncdlezh/sql/new>:

```sql
-- One-shot column-existence audit for migrations 006-017.
select
  (select count(*) from information_schema.columns where table_name = 'profiles' and column_name = 'encryption_public_key') as m006,
  (select count(*) from information_schema.columns where table_name = 'profiles' and column_name = 'privy_did') as m007,
  (select count(*) from information_schema.tables where table_name = 'message_recipients') as m008,
  (select count(*) from information_schema.columns where table_name = 'profiles' and column_name = 'signing_public_key') as m009,
  (select count(*) from information_schema.columns where table_name = 'profiles' and column_name = 'bluesky_handle') as m010,
  (select count(*) from information_schema.columns where table_name = 'messages' and column_name = 'encrypted_media') as m011,
  (select count(*) from information_schema.tables where table_name = 'practice_logs') as m012,
  (select count(*) from information_schema.tables where table_name = 'memberships') as m013,
  (select count(*) from information_schema.tables where table_name = 'course_purchases') as m014,
  (select count(*) from information_schema.tables where table_name = 'ref_rewards') as m015,
  (select count(*) from information_schema.columns where table_name = 'posts' and column_name = 'bluesky_uri') as m016,
  (select count(*) from information_schema.columns where table_name = 'posts' and column_name = 'bluesky_reply_count') as m017;
```

Each column returns 1 if applied, 0 if not. Tell Orlando which migrations are missing and where to apply them.

All migrations are idempotent — safe to re-paste even if half-applied. Order matters: apply lowest-numbered missing migration first.

If many migrations are missing, point Orlando at `DEPLOY-WEEK-1.md` step 1 — the canonical paste-in-order list.
