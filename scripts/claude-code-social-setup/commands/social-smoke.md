---
description: Run a production smoke test against frqncy.network/social — verify the deploy is actually serving a functional NRG app.
---

Probe the live deployment with a sequence of checks and report what works vs what's broken. No browser available in CLI, but `curl` + `grep` + `jq` cover the load-bearing surfaces.

```bash
# 1. Social shell loads and contains a module entry script (NOT skeletons-only).
curl -s https://frqncy.network/social/ | grep -c 'type="module"'

# 2. /api/export endpoint reachable + returns reasonable shape for a missing user.
curl -s "https://frqncy.network/api/export?username=__definitely_does_not_exist__" | head -c 200

# 3. Membership page renders.
curl -s -o /dev/null -w "membership: %{http_code}\n" https://frqncy.network/membership/

# 4. Word Illuminator worker accepts a request.
curl -s "https://frqncy.network/illuminator/word?word=test" | jq -r '.word // .error // "no shape"' 2>/dev/null

# 5. Word Illuminator deeper version returns the member_deepening section.
curl -s "https://frqncy.network/illuminator/word?word=test&member=1" | jq -r '.member_deepening | (if . == null then "NO deepening section" else "deepening present" end)' 2>/dev/null

# 6. Bluesky cross-post URI persistence — verify posts.bluesky_uri column exists.
echo "(check Supabase REST with anon key for posts.bluesky_uri — requires PUBLIC_SUPABASE_ANON_KEY)"

# 7. Auto-grow workflow last run.
gh run list --workflow=auto-grow.yml --limit 1 2>/dev/null || echo "(install gh + auth to check)"
```

Interpret results:

- **Step 1 > 0:** social-src is properly deployed. If 0: deploy is broken — run `/social-rebuild`.
- **Step 2 returns `{"error":"User not found"}`:** Supabase env vars set + schema present. If returns `{"error":"Export failed..."}`: env vars missing or migration 009 (signing columns) not applied.
- **Step 3 returns 200:** membership shell deployed.
- **Step 4 returns a word object:** AI binding wired. Returns `error` or no shape: AI binding missing on Pages.
- **Step 5 returns `deepening present`:** Track 2 Week 2 member-tier differentiation is working end-to-end.
- **Step 7 shows recent runs:** auto-grow workflow live; counts being refreshed nightly.

Prose summary at the end — what's green, what's red, what's the highest-priority fix.
