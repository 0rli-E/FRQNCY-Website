---
description: Walk through the full Track 1 deploy week — migrations, env vars, Privy + Stripe + GitHub secrets, build, smoke.
---

Read `DEPLOY-WEEK-1.md` end-to-end. It's the canonical day-by-day runbook for unblocking the NRG production launch. Don't shortcut it — operator gates on multiple vendor dashboards (Supabase, Cloudflare Pages, Privy, Stripe, GitHub Actions secrets) can't be parallelised because each one feeds the next.

Output a tight status of where Orlando is in the deploy week by checking these markers:

```bash
# 1. Migrations applied? Probe one of the latest tables/columns via Supabase REST.
echo "Checking if migration 017 is applied..."
curl -s "https://vyazlspbmwmlyncdlezh.supabase.co/rest/v1/posts?select=bluesky_reply_count&limit=1" -H "apikey: $(grep -E '^PUBLIC_SUPABASE_ANON_KEY' ~/.env.frqncy 2>/dev/null | cut -d= -f2)" | head -c 200
echo ""

# 2. Build present locally?
ls social-src/dist/social/index.html 2>/dev/null && echo "dist present" || echo "dist MISSING — run /social-rebuild"

# 3. Module entry script present in deployed /social/?
grep -c 'type="module"' social/index.html

# 4. /api/export reachable in prod?
curl -s -o /dev/null -w "%{http_code}\n" https://frqncy.network/api/export?username=nonexistent
```

Based on the markers, identify the next blocking operator gate and tell Orlando exactly which step of `DEPLOY-WEEK-1.md` to execute. Don't repeat the whole runbook — point at the specific Day + step.

If everything is green, run `/social-smoke` to verify end-to-end functionality.

Always remind Orlando: sandbox cannot run `npm install`, `git push`, or vendor-dashboard work. Those are operator-only. Surface the commands; Orlando runs them.
