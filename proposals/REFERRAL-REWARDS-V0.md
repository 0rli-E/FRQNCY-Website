---
title: Referral rewards v0 (Phase 3 Wk 6)
date: 2026-04-29
status: shipped
---

# Referral rewards v0

Per `proposals/EXECUTION-PLAN-90D.md` Phase 3 Wk 6 Mon-Tue. Three tiers, server-granted, owner-only visible. **No public leaderboard surface anywhere.**

## TL;DR

When a friend you referred (`ref_signups.referred_id`) becomes a paying member (`became_member=true`), your count goes up. Crossing 3 → free month credit. Crossing 10 → quarterly gathering invite. Crossing 25 → permanent founder badge on your profile. The check + grant runs server-side every time you visit `/membership/` (idempotent).

## What's shipped

- **Migration 015**: `ref_rewards` table (referrer_id, tier, kind, granted_at, redeemed_at, notes) with `UNIQUE (referrer_id, tier)`. Plus `profiles.founder_badge BOOLEAN` for the 25-tier surface flag. RLS owner-only. Server-only INSERT/UPDATE.
- **`functions/api/check-rewards.js`**: counts the user's `ref_signups` with `became_member=true`, grants any newly-crossed tiers via service-role upsert, special-cases the founder badge to also flip `profiles.founder_badge`. Idempotent — UNIQUE constraint prevents double-grants.
- **`assets/frqncy-membership.js`**: new `getMyRewards()` + `checkAndGrantRewards()` exports. Read-only on the client; the grant happens server-side.
- **`/membership/` page**: under the "Friends who joined via you" list, an "Acknowledgements" block renders any granted rewards with their voice-aligned messages.

## Voice constraints

- **Acknowledgements, not rewards-in-the-marketing-sense.** "Three friends joined as members. Your next renewal is on us." NOT "You unlocked X."
- **No public ranking.** No "top referrers this month." Per CLAUDE.md cooperation rule.
- **Permanent founder badge is on the user's OWN profile only** — not in any public list.
- The free month credit is meant to be issued in Stripe (coupon code) after operator review for v0 — the row records the entitlement; the redemption flow is operator-handled until v1.1 automates.

## What's deferred (v1.1 candidates)

- Auto-issuance of Stripe coupons for the 3-tier reward (currently just records the entitlement).
- Email notification when a tier is crossed (currently the user only sees it on next /membership/ visit).
- Configurable thresholds (currently hardcoded 3/10/25). v1.1 could move them to env vars.
- Redemption-state UI (`redeemed_at` column exists but no surface yet).

## Operator gate

Apply migration 015 in the Supabase SQL editor (idempotent). No new env vars. The check-rewards endpoint reuses the existing `PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`.
