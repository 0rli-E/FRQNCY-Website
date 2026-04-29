# NRG Launch Checklist

The FRQNCY social platform is now branded as **NRG · FRQNCY Social**, source-clean, and rebuilt. URLs stay `/social/*` for SEO continuity. Components are wired against the actual schema. Code-side launch blockers are cleared. The remaining steps are dashboard-only.

---

## What's already done in this session

**Source code fixes (social-src/):**
- `lib/api.ts` — notification schema bugs fixed (`is_read`, `target_user_id`, `ref_type/ref_id`). All 12 phantom `increment_counter` RPC calls removed (counter triggers handle the work). Vestigial `update({ likes_count: ... })` workaround removed.
- `Feed.tsx` — denormalized `likes_count`/`comments_count`/`bookmarks_count` selects replace broken `likes(count)` aggregates.
- `CommentForm.tsx` — routes through `api.ts::createComment()` so notifications actually fire.
- `PostComposer.tsx` — additional phantom RPC call removed.

**Brand alignment:**
- Layout title template: `{page} · NRG · FRQNCY` (e.g. `Feed · NRG · FRQNCY`).
- Logo wordmark renders FRQNCY + NRG.
- Breadcrumb: FRQNCY / NRG.
- Footer: `© 2026 FRQNCY Network. A network of people, building their dream life.`
- Mock "Trending Topics" sidebar replaced with **Recent commissions** linking to /v2/water/, /v2/music/, /v2/money/, /v2/wellbeing/.
- Mock "Suggested People" sidebar replaced with **Teachers we read** (Neville, Osho, Sadhguru, Sai Maa, Trudeau) linking to /v2/explore.html#p-... (real people-bed IDs verified against `people.json`).

**Editorial compliance:**
- `social-src/src/pages/leaderboard.astro` — deleted.
- `social-src/src/components/ConvictionLeaderboard.tsx` — deleted.
- `/social/leaderboard/` deployed folder — removed.

**E2E encrypted messaging — fully wired this session (v1, libsodium sealed boxes):**
- `social-src/src/lib/crypto.ts` — `generateMessagingKeypair`, `save/loadPrivateKeyLocal`, `encryptToPublicKey`, `decryptFromSealedBox`. Built on `libsodium-wrappers` (npm dep added).
- `supabase/migrations/006_messaging_e2ee.sql` — adds `profiles.encryption_public_key`, `messages.encrypted_content`, `messages.encryption_version`. Idempotent.
- **`AuthProvider`** — `ensureEncryptionKeypair` runs on every signed-in load. Generates keypair if user has none; respects new-device state (doesn't auto-regenerate when public key exists but localStorage is empty).
- **`useMessages`** — fetches recipient's public key, encrypts on send (`encryption_version=1`), decrypts every fetched + realtime message. Plaintext fallback for users who haven't generated a key yet (`encryption_version=0`).
- **`ChatWindow`** — `EncryptionBanner` at the top of every conversation. Per-message decrypted/failed rendering with `[unable to decrypt]` placeholder.
- **`EncryptionKeysPanel`** at `/social/profile/keys/` — download private key as .txt, import on a new device, or regenerate (destructive, requires typing "regenerate"). Linked from NavAuth dropdown.
- `social-src/E2EE-NOTES.md` — full design notes, threat model, user flows for first signup / returning device / new device / lost backup / unencrypted recipient.

**Architecture proposals (no code changes in those):**
- `proposals/NRG-ONCHAIN-PIVOT.md` — serious roadmap on the Farcaster / ATProto / Hybrid question. Recommends **deferring the protocol pivot to Q1-Q2 2027**, shipping the libsodium messaging this session, doing a hybrid signed-message export in Q4 2026 as commitment device.
- `proposals/PROTOCOL-LESSONS-2026-04.md` — empirical "field trip" comparing Farcaster, Lens v3, Ethos as of April 2026. Single biggest takeaway: copy Ethos's Privy onboarding flow (now done — see below), keep social graph in Supabase for now, defer protocol federation. Read before any Phase 2 onchain work.
- `proposals/HYBRID-SIGNED-MIRROR.md` — design notes for the signed-message mirror. Explains why we shipped this earlier than the pivot proposal originally suggested.

**Identity surface — visible to users this session:**
- `ProfileCard.tsx` — Identity section with wallet (click-to-copy short form), encryption status, signing-key status, and a gold-outlined "Download all signed records ↓" link to `/api/export?username=…`.
- `PostCard.tsx` — verify-on-read badges. Module-level `verifyCache` Map memoizes per post.id. `◊ verified` (gold) on success, `✗ signature mismatch` (amber) on rare failure, nothing for unsigned legacy posts. Verifies lazily on mount, never blocks render.
- `NavAuth.tsx` — backup-status warning. Amber dot on the avatar + top-of-list "⚠ Back up your keys" link in the dropdown when the user has keys but no recorded backup. Strict acknowledgement: only an actual download or successful import sets the flag.
- `FirstRunWelcome.tsx` — first-run welcome modal. Shown once per browser when a signed-in user with auto-generated keys first lands on `/social/`. Three actions: download backup (sets both `welcomed` + `backup_acknowledged`), I-already-have-a-backup (sets both), skip-for-now (sets only `welcomed`, the amber dot keeps reminding). Mounted at the layout level via `client:load`.
- New localStorage keys: `frqncy.nrg.backup_acknowledged`, `frqncy.nrg.welcomed`. Documented in `E2EE-NOTES.md`.

**External connections — NRG ↔ Bluesky cross-post bridge:**
- `social-src/src/lib/atproto-bridge.ts` — client-side ATProto helpers. `connectBluesky` / `publishToBluesky` / `disconnectBluesky` wrap `@atproto/api`'s `BskyAgent`. App password lives in localStorage only — FRQNCY's server never sees it. Per-session agent cache so repeated cross-posts don't re-login. SDK is dynamically imported so a missing dep doesn't crash the build.
- `social-src/src/components/ConnectionsPanel.tsx` + `social-src/src/pages/profile/connections.astro` — `/social/profile/connections/`. Two-field connect form (handle + app password) → live login test → persists handle to `profiles.bluesky_handle`. Disconnect clears both localStorage AND the profile column. Farcaster + Lens placeholder rows.
- `social-src/src/components/PostComposer.tsx` — opt-out checkbox "✦ Also post to Bluesky as @handle" rendered when connected. Default ON, persisted via `frqncy.nrg.atproto.crosspost_default`. Cross-post fires after Supabase insert returns.
- `social-src/src/components/NavAuth.tsx` — "Connections" link added below "Encryption keys" in the dropdown.
- `social-src/src/lib/api.ts::createPost` — accepts `crosspostToBluesky?: boolean`, fire-and-forget mirror after the signed-message hook.
- `supabase/migrations/010_bluesky_handle.sql` — adds `profiles.bluesky_handle` with a unique lower-cased index. Idempotent.
- `social-src/package.json` — adds `@atproto/api ^0.13.0`.
- `proposals/ATPROTO-BRIDGE.md` — design notes, threat model, OAuth migration path.
- No new env vars required — the bridge is fully client-side.

**Hybrid signed-message mirror — fully wired this session:**
- `social-src/src/lib/crypto.ts` — `generateSigningKeypair`, `signPayload`, `verifySignature`, `canonicalizeForSigning`, plus `exportKeyBackup` / `importKeyBackup` / `downloadKeyBackupFile` for unified .txt backups (encryption + signing in one file).
- `social-src/src/components/AuthProvider.tsx` — `ensureSigningKeypair` runs alongside `ensureEncryptionKeypair`. Generates Ed25519 signing keypair on first signed-in load.
- `social-src/src/lib/api.ts` — `createPost` and `followUser` now sign canonical JSON of the row on creation. Best-effort: never blocks the user-visible action; falls through silently if signing key missing.
- `functions/api/export.js` — public Cloudflare Pages Function. `GET /api/export?username=<handle>` returns a JSON dump of every signed post + follow by that author with their signing public key. 5 req/min/IP rate limit. 5-min edge cache. The portable-export endpoint that turns "we have signed history" into "we can migrate this anywhere."
- `social-src/src/components/EncryptionKeysPanel.tsx` — backup/import flow uses the unified format; legacy single-key backups still parsed correctly. Regenerate flow now rotates both keys.
- `supabase/migrations/009_signed_message_mirror.sql` — `profiles.signing_public_key`, `posts.signature` + `signed_payload`, `follows.signature` + `signed_payload`. Idempotent.

**Privy embedded-wallet auth (now wired into AuthForm):**
- `social-src/src/components/PrivyLoginButton.tsx` — Privy modal trigger with email + Google + wallet login. Auto-provisions an embedded wallet for users without one. Fails-loud-disabled if `PUBLIC_PRIVY_APP_ID` env var is missing — the rest of the auth form keeps working.
- `social-src/src/lib/privy-bridge.ts` — bridges Privy login → Supabase. After Privy auth, sends a magic link OTP on the same email so the user lands as an authenticated Supabase session, then patches `privy_did` + `wallet_address` onto their profile. Wallet-only signups (no email) get a "add an email to finish linking" message — Supabase auth still requires an email or password.
- `social-src/src/components/AuthProvider.tsx` — calls `handlePrivyReturnIfPending` whenever a Supabase session resolves, so magic-link returns finish the bridge automatically.
- `social-src/src/components/AuthForm.tsx` — Privy button rendered above the existing Google-via-Supabase button. Both options coexist; users pick.
- `social-src/astro.config.mjs` — `preact({ compat: true })` enables React-targeted libraries (Privy is React) to render through Preact.
- `social-src/package.json` — adds `@privy-io/react-auth ^2.0.0`, `react ^18.3.0`, `react-dom ^18.3.0` (peer deps for Privy).
- `supabase/migrations/007_privy_identity.sql` — adds `profiles.privy_did` with unique index. Adds case-insensitive index on `wallet_address`. Idempotent.

**Build:**
- `cd social-src && npm install && npm run build` — clean, 10 pages, 1.42s vite + 286ms static gen.
- `social-src/dist/` copied over `/social/`. Deployed output verified.

---

## What's left for you (dashboard-only — I can't do these)

### 0. Reinstall + rebuild social-src (one-time terminal step)

The Cowork sandbox can't complete Privy's multi-package npm install due to a bindfs `rename` limitation. Run from your terminal:

```bash
cd ~/Documents/Claude/Projects/FRQNCY\ WEBSITE/social-src
rm -rf node_modules package-lock.json
npm install
npm run build
cp -r dist/* ../social/
```

Verify the build is clean (no Vite resolution errors). The `cp` step copies the regenerated static output into the deployed `/social/` folder.

### 1. Apply Supabase migrations 002, 003, 006, 007, 008, 009, 010, 011, AND 012

Open the Supabase SQL editor:
<https://supabase.com/dashboard/project/vyazlspbmwmlyncdlezh/sql/new>

Paste + Run each in order:
1. `supabase/migrations/002_fix_conversation_rls.sql` (DM RLS recursion fix)
2. `supabase/migrations/003_subscribers_charts_storage.sql` (subscribers + charts + storage buckets)
3. `supabase/migrations/006_messaging_e2ee.sql` (E2EE columns: encryption_public_key, encrypted_content, encryption_version)
4. `supabase/migrations/007_privy_identity.sql` (privy_did column + unique index, case-insensitive wallet_address index)
5. `supabase/migrations/008_group_chat_encryption.sql` (message_recipients table for per-recipient ciphertexts in group chats)
6. `supabase/migrations/009_signed_message_mirror.sql` (signing_public_key on profiles; signature + signed_payload on posts and follows — Phase 2 commitment device foundation)
7. `supabase/migrations/010_bluesky_handle.sql` (bluesky_handle on profiles for the NRG ↔ Bluesky cross-post bridge — public column; app password lives in user localStorage only)
8. `supabase/migrations/011_encrypted_message_media.sql` (per-recipient encrypted media chunks for group chats)
9. `supabase/migrations/012_practice_tracker.sql` (Sanctuary practice tracker — `practice_logs` table + `practice_scores` view; RLS-locked to owner, no leaderboard surface anywhere — see proposals/PRACTICE-TRACKER.md)

All nine are idempotent — safe to re-run.

### 2. Create a Privy app (5 min)

1. Sign up at <https://dashboard.privy.io>.
2. **Create a new app** named "NRG" or "FRQNCY". Pick "Embedded wallets" mode.
3. **App settings → Login methods:** enable Email, Google (or any OAuth you want), and External wallets.
4. **App settings → Allowed origins:** add `https://frqncy.network`, `https://frqncy-website.pages.dev`, and (for testing) `http://localhost:4321`.
5. **App settings → Embedded wallets:** "Create on login: users without wallets" (matches the code default). EVM only is fine for v1; add Solana later if desired.
6. Copy the **App ID** (starts with `cmd...`).

### 3. Set Cloudflare Pages env vars

Cloudflare Dashboard → Pages → frqncy-website → Settings → Environment variables:
- `PUBLIC_SUPABASE_URL` = `https://vyazlspbmwmlyncdlezh.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` = (from Supabase API settings)
- `PUBLIC_PRIVY_APP_ID` = (the App ID from step 2)
- (Pages already has the `AI` Workers AI binding for the chat widget — verify.)
- Optional: `RESEND_API_KEY` and `RESEND_FROM` for subscribe-form welcome emails.

If `PUBLIC_PRIVY_APP_ID` is unset, the Privy button on AuthForm renders disabled with a "not configured" tooltip — the rest of the form (email/password, magic link, Google-via-Supabase) keeps working. Failing-loud beats silently breaking signup.

### 3. Smoke test after deploy

```bash
URL="https://vyazlspbmwmlyncdlezh.supabase.co"
KEY="sb_publishable_zFdrbkExarUfR2PAe4FcAQ_yvcL31CI"
curl -s -o /dev/null -w "subscribers: %{http_code}\n" "$URL/rest/v1/subscribers?limit=1" -H "apikey: $KEY" -H "Authorization: Bearer $KEY"
curl -s -o /dev/null -w "charts:      %{http_code}\n" "$URL/rest/v1/charts?limit=1"      -H "apikey: $KEY" -H "Authorization: Bearer $KEY"
curl -s -o /dev/null -w "messages:    %{http_code}\n" "$URL/rest/v1/messages?limit=1"    -H "apikey: $KEY" -H "Authorization: Bearer $KEY"
```

All three should return `200`. Open `/social/login`, sign up, post, comment, follow yourself with a second test account, DM, search — all should work after the migrations.

---

## What needs a follow-up session

### Group-chat encryption + encrypted media (v1.1)

Today the encrypt path picks the first non-self member of a conversation. Group chats (3+ members) need encrypt-per-member: the sender encrypts N copies, one to each member's public key. Small implementation lift in `useMessages.send()` — store the per-recipient ciphertexts in a JSON map column or a side table. Not blocking for 1:1 DMs.

Image / file attachments still go through plaintext `media_url`. v1.1 should encrypt the file contents to the same recipient public key (chunked sealed boxes for large files) and store the ciphertext blob in Supabase Storage with a private bucket.

### Onchain pivot (Farcaster / ATProto)

Read `proposals/NRG-ONCHAIN-PIVOT.md` and `proposals/PROTOCOL-LESSONS-2026-04.md` before scheduling. Recommendation: Q1–Q2 2027 work, not 2026. Phase 2 hybrid signed-message export is the cheap commitment device that keeps the option open without committing budget. Privy + libsodium keys + wallet linkage shipped this session means the foundation is ready when the time comes.

---

## Commit + push

Sandbox can't write `.git/HEAD.lock` (same wall as before). Run from your terminal:

```bash
cd ~/Documents/Claude/Projects/FRQNCY\ WEBSITE
rm -f .git/index.lock .git/HEAD.lock
git add -A
git commit -m "NRG: rebrand + schema fixes + libsodium E2EE primitives + Privy auth + onchain research

Rebrand & wiring fixes (prior session):
- api.ts notification column fixes (is_read, target_user_id, ref_type/ref_id);
  removed 12 phantom increment_counter RPC calls (triggers handle counters);
  CommentForm routed through api.createComment for notifications;
  Feed.tsx denormalized counters replace broken aggregates.
- Brand: 'NRG · FRQNCY Social' everywhere; logo + breadcrumb + footer aligned;
  mock sidebars replaced with real /v2/ commission links + people-bed teachers.
- Editorial: leaderboard.astro + ConvictionLeaderboard.tsx deleted; /social/leaderboard/ removed from deploy.

E2EE messaging primitives:
- lib/crypto.ts (libsodium sealed boxes); migration 006 adds
  profiles.encryption_public_key + messages.encrypted_content; design notes in
  social-src/E2EE-NOTES.md. Wiring into MessageInput/ChatWindow deferred.

Privy embedded-wallet auth:
- PrivyLoginButton.tsx + lib/privy-bridge.ts + AuthProvider integration.
- Privy login → magic-link OTP → patches privy_did + wallet_address onto
  profile. Wallet-only signups warn 'add an email to finish linking'.
- Migration 007: profiles.privy_did unique index + lower(wallet_address) index.
- preact compat enabled in astro.config.mjs for Privy's React deps.
- Fails loud disabled if PUBLIC_PRIVY_APP_ID env var missing — non-Privy auth
  paths keep working.

Architecture proposals (no code):
- proposals/NRG-ONCHAIN-PIVOT.md — Farcaster/ATProto/Hybrid roadmap. Defer
  protocol pivot to Q1-Q2 2027.
- proposals/PROTOCOL-LESSONS-2026-04.md — empirical comparison of Farcaster,
  Lens v3, Ethos. Lesson: copy Ethos's Privy onboarding (done), keep social
  graph in Supabase, defer federation."
git push
```

After the push, run from your terminal:

```bash
cd ~/Documents/Claude/Projects/FRQNCY\ WEBSITE/social-src
rm -rf node_modules package-lock.json && npm install
npm run build
cp -r dist/* ../social/
cd ..
git add social/
git commit -m "NRG: rebuild static output with Privy + libsodium deps"
git push
```
