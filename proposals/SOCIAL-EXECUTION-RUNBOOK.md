# FRQNCY Social — Execution Runbook

> Do these in order, top to bottom. Each step says what to do, how long it takes, and how you know it's done. Don't skip ahead — the foundation steps stop you from losing accounts later. The *why* behind each choice lives in `SOCIAL-MEDIA-PLAN.md`; this file is just the doing.

**Golden rule:** build the foundation first, let the domain sit a few days, *then* create social accounts. Making a fresh email + fresh account in the same minute, at scale, is what gets flagged.

---

## PHASE 0 — Foundation (one afternoon, ~3 hours)

Do all of Phase 0 in one sitting. Then wait ~5 days before Phase 2 (let the domain age).

**Step 1 · Email backbone — Google Workspace (45 min)**
- [ ] Go to workspace.google.com → Start free trial → choose **Business Starter**.
- [ ] When asked for a domain, enter **frqncy.network** (you already own it).
- [ ] Verify domain ownership by adding the TXT record it gives you in **Cloudflare → DNS**. (Say the word and I'll help you drop in the records once you're logged into Cloudflare.)
- [ ] Create your main admin user (e.g. `orlando@frqncy.network`).
- ✅ Done when you can send/receive mail at your new address.

**Step 2 · Catch-all + break-glass address (20 min)**
- [ ] Create a user/group `ops@frqncy.network` — this is your break-glass recovery address, used for *nothing else*.
- [ ] Turn on **catch-all routing**: Admin console → Apps → Gmail → Routing → add a default route so any `anything@frqncy.network` lands in your main inbox.
- [ ] Test: email `test-ig@frqncy.network` from your phone → confirm it arrives.
- ✅ Done when a made-up alias lands in your inbox.

**Step 3 · Password manager + hardware keys (45 min)**
- [ ] Install **Bitwarden** (bitwarden.com) — free account for now; self-host Vaultwarden later if you want.
- [ ] Order **two YubiKeys** (5 Series) today so they arrive this week — one you carry, one stays home.
- [ ] Put your Google Workspace admin login into Bitwarden.
- [ ] Turn on 2FA for the Workspace admin account (authenticator now; add the YubiKeys when they arrive).
- ✅ Done when Workspace + Bitwarden both have 2FA on and the login is saved.

**Step 4 · Phone SIMs — DEFERRED (not needed to start)**
- Decision: X, WhatsApp, and Telegram are lower priority, and they're the only platforms that require a phone number. The priority platforms (Instagram, TikTok, YouTube, Facebook) verify by **email**, which the catch-all already covers.
- So: **no numbers needed right now.** When WhatsApp/Telegram/X come up, get a dedicated no-KYC SMS eSIM (nadanada UK line / Silent.Link) — see backlog.

**→ Foundation is functionally complete. Proceed to Phase 1 (email-only platforms first).**

---

## PHASE 1 — Ownership containers (90 min) — do BEFORE making any social account

Create the "containers" first so accounts are owned by a business, not by your personal login.

**Step 5 · Meta (30 min)**
- [ ] At business.facebook.com, create a **Business Portfolio** first.
- [ ] Add a **second admin** immediately (a co-founder, or a second profile you control).
- ✅ Done when the portfolio exists with two admins.

**Step 6 · TikTok Business Center (15 min)**
- [ ] Create a **TikTok Business Center**; add a second Admin; turn on 2-step verification.
- ✅ Done when the Business Center exists with two admins.

**Step 7 · YouTube / Google (15 min)**
- [ ] Under your Workspace account, you'll create channels as **Brand Accounts** (in Phase 2). For now just confirm you're logged in as the Workspace user, not a personal Gmail.
- ✅ Done when your YouTube identity is the Workspace account.

**Step 8 · The registry (30 min)**
- [ ] Open `FRQNCY-Social-Account-Registry.xlsx`.
- [ ] Fill the **Recovery phone** column with your SIM numbers, and note which container each account will belong to.
- ✅ Done when Phase-1 rows have email alias + phone filled in.

---

## PHASE 2 — Claim the core accounts (2–3 sittings, spread over a few days)

Only the **blue / Phase 1** rows in the registry: **Hub, Founder, Crypto**. Do a few per day, not all at once, from your normal home connection (no VPN/proxy).

**Step 9 · Founder first (`orlando.frqncy`)** — real-person accounts warm up the SIM safely.
- [ ] Instagram, then TikTok, then X, LinkedIn, YouTube (Brand Account), Farcaster.
- [ ] Each: use an alias (`ig-orlando@frqncy.network`), set the SIM number, save login + turn on 2FA in Bitwarden, mark **Status → Squatted** in the registry.

**Step 10 · Hub (`frqncy` / keep existing `@frqncy_network`)**
- [ ] You already own @frqncy_network (X), instagram.com/frqncy.network, LinkedIn frqncy-network, frqncy.substack — **claim the gaps**, don't recreate these.
- [ ] Add the hub's missing platforms: YouTube, TikTok, Facebook Page, Telegram, Farcaster.

**Step 11 · Crypto (`crypto.frqncy`)**
- [ ] X, Farcaster, Telegram first (its real audience); add IG/TikTok/YouTube later.

- ✅ Phase 2 done when Hub + Founder + Crypto exist on their core platforms, each with 2FA on and a registry row completed.

---

## PHASE 3 — Wire up posting (60 min)

**Step 12 · Stand up Postiz**
- [ ] Sign up at postiz.com (hosted trial) — or self-host later.
- [ ] Connect the Hub, Founder, and Crypto accounts you just made.
- [ ] Do one test post to one platform to confirm it publishes.
- ✅ Done when a scheduled test post goes live.

---

## PHASE 4 — First content + expand (ongoing, ~2 pieces/week)

**Step 13 · Run one flagship through the waterfall**
- [ ] Take one existing audio/teaching → clip it (Opus Clip or Vizard) → 1 carousel (Canva) → 1 text thread → schedule across the core accounts in Postiz.

**Step 14 · Spin out verticals one at a time**
- [ ] Add `audios.frqncy` and `light.frqncy` (Phase 2 / green rows) once the core is running steadily.
- [ ] Then health, nutrition, naturalcures, books — one at a time, only when the prior one is alive.

**Step 15 · Affiliates (when ready)**
- [ ] Start with the aligned, low-risk programs: Bookshop.org, Sounds True, Gaia, Ledger, iHerb (via ShareASale).
- [ ] Put a clear affiliate disclosure next to every link (FTC requirement).
- [ ] For any Kevin Trudeau / natural-cures content: frame as conviction and curation, never as cure claims — that keeps the liability off you.

---

## Backlog — revisit later (parked on purpose)

- [ ] **YubiKeys (buy 2)** — hardware 2FA for the two crown-jewel logins only: the Bitwarden vault and the Workspace/email admin. Phishing- and SIM-swap-proof. Add when convenient.
- [ ] **Facebook (anchor account) 2FA** — skipped for now; Meta's flow only offered SMS/WhatsApp or a security key (no authenticator-app option). Fastest fix: SMS 2FA with Orlando's *personal* mobile number (fine, since it's his personal profile), or a YubiKey when it arrives. High priority — the whole Business Portfolio hangs off this login.
- [ ] **Workspace admin 2FA** — held for now (Orlando wants to settle the team-access model first). Note for when we revisit: personal 2FA is per-user and does NOT affect how teammates log in; org-wide enforcement is a separate setting. This is the master account, so it's the highest-priority one to protect.
- [ ] **DKIM / DMARC** on frqncy.network — for sending reputation. Only matters once actively *sending* from these addresses, not for receiving verification codes.
- [ ] **Self-host Vaultwarden** — migrate the Bitwarden vault off the cloud once the account set is stable.

## The one-line version

Set up Workspace email + catch-all → Bitwarden + 2 YubiKeys → 2 SIMs → (wait 5 days) → Meta/TikTok/YouTube business containers → claim Founder/Hub/Crypto accounts a few per day → connect Postiz → post one flagship → expand one vertical at a time.

*Start now with Step 1. When you're logged into Cloudflare for the DNS records, tell me and I'll walk you through them live.*
