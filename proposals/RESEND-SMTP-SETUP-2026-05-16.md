---
title: "Resend SMTP setup for NRG email — exact DNS records + Supabase config"
date: 2026-05-16
audience: Orlando (Cloudflare DNS + Resend dashboard + Supabase dashboard)
goal: Unblock unlimited transactional email on Supabase Free tier
time: ~25 minutes
cost: $0/month for up to 3,000 emails/mo + 100/day
---

# Resend SMTP setup

Free Supabase tier sends 3-4 magic-link emails/hour via shared SMTP. For a 100-user launch that's a 25-hour bottleneck. Resend free tier covers 3,000/mo + 100/day with proper domain verification and no rate-cap on transactional volume.

## Step 1 — Resend account + domain (10 min)

1. Sign up at https://resend.com — use orlando.eisenreich@gmail.com (or your founder email)
2. Dashboard → Domains → "Add Domain"
3. Enter: `frqncy.network`
4. Resend will show you 3 DNS records to add to Cloudflare. They look like this (exact values shown in Resend dashboard — DO NOT copy from this doc; the selector/value pairs are unique to your account):

| Type | Host | Value |
|---|---|---|
| **MX** | `send.frqncy.network` | `feedback-smtp.us-east-1.amazonses.com` (priority 10) |
| **TXT** | `send.frqncy.network` | `v=spf1 include:amazonses.com ~all` |
| **TXT** | `resend._domainkey.frqncy.network` | `p=MIGfMA0GCSqGSIb...` (long DKIM key, copy whole thing) |

Resend uses AWS SES under the hood; the SPF + DKIM records authorize your domain to send.

## Step 2 — Add DNS records in Cloudflare (5 min)

1. Cloudflare Dashboard → Domains → `frqncy.network` → DNS → Records → "Add record"
2. For each of the 3 records above, click "Add record" and fill:
   - **Type:** match the Type column (MX / TXT)
   - **Name:** match the Host (Cloudflare auto-strips `.frqncy.network` — paste only the subdomain part: `send` for MX/SPF, `resend._domainkey` for DKIM)
   - **Mail server / Content:** paste the Value
   - **Proxy status:** **DNS only (orange cloud OFF)** — load-bearing. CF proxy breaks SMTP.
   - **TTL:** Auto
3. Save each record.

## Step 3 — Verify in Resend (~2-10 min wait for DNS)

1. Back in Resend → Domains → frqncy.network → "Verify DNS Records"
2. Wait 2-10 min for DNS to propagate. Resend will mark each record green when valid.
3. Status flips to "Verified" once all 3 are valid.

If it stays "Pending" after 15 min: double-check the Cloudflare records. The most common failure is leaving the proxy ON (orange cloud) — must be DNS-only (gray cloud).

## Step 4 — Generate API key (1 min)

1. Resend → API Keys → "Create API Key"
2. Name: `frqncy-supabase`
3. Permission: "Sending access" (read-only on everything else)
4. Domain: scope to `frqncy.network` (don't use "All")
5. Copy the key (starts with `re_...`). **You'll only see it once.**

## Step 5 — Wire into Supabase (5 min)

1. https://supabase.com/dashboard/project/vyazlspbmwmlyncdlezh/settings/auth
2. Scroll to **SMTP Settings** → toggle "Enable Custom SMTP"
3. Fill:
   - **Host:** `smtp.resend.com`
   - **Port:** `465`
   - **Username:** `resend`
   - **Password:** `<your Resend API key from step 4>`
   - **Sender email:** `noreply@frqncy.network` (or `hello@frqncy.network` — either works on verified domain)
   - **Sender name:** `FRQNCY`
4. Click "Save"
5. Send a test: in Supabase Dashboard → Users → "Invite User" → use any email of yours. Should arrive within 30 seconds.

## Step 6 — Optional polish

Customize the auth email templates while you're in there (default Supabase templates are generic):

1. Supabase Dashboard → Authentication → Email Templates
2. Edit "Confirm signup", "Magic Link", "Reset Password" — match FRQNCY voice ("navy + gold" branding, Cormorant headline for "FRQNCY · NRG", honest copy per the no-overclaim memory).

Suggested copy for the Magic Link template — keeps the launch promise truthful:

```
Subject: Your FRQNCY sign-in link

Hi there —

Tap the link below to sign in to NRG · FRQNCY Social.

[Sign in to FRQNCY] ← {{ .ConfirmationURL }}

This link expires in 60 minutes and can only be used once.
If you didn't request it, you can ignore this email.

— FRQNCY
A network of people, building their dream life.
```

## What this unlocks

- Unlimited signup throughput on Free tier (was 4/hour before)
- Branded sender (noreply@frqncy.network instead of Supabase's shared noreply)
- Resend's deliverability is way better than Supabase's shared infrastructure
- Resend logs every email in their dashboard — easy to debug "did the magic link send?"

After this lands, the only remaining 100-user-launch blocker is the actual flow QA (Step 3 of `NRG-GO-LIVE-CHECKLIST-2026-05-16.md`): walk one fresh-email signup → post → DM round-trip yourself, screenshot anything that breaks.

## What it doesn't unlock (still requires Supabase Pro at some point)

- 500MB DB cap (you'll hit this around 1,000+ active users with attachments)
- 1GB egress/mo (probably fine for 100 users; monitor)
- Point-in-time recovery
- 60 concurrent realtime → 200 on Pro (won't bite at 100 users)

For early access to ~100 users, $0/month is achievable end-to-end with Free + Resend.
