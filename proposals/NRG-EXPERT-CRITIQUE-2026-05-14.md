---
title: "NRG · FRQNCY Social — Five-Expert Critique"
date: 2026-05-14
sources:
  - ATProto / Bluesky deep expert (Lexicon, did:plc, AppView, custom feeds, IETF I-D)
  - Farcaster + frames expert (FIDs, Snapchain, FIP series, Frames v2, post-Merkle-acquisition)
  - Nostr expert (NIPs through latest, NIP-44 v2, NIP-17, NIP-29, NIP-65, NIP-104 MLS)
  - E2EE / Signal / MLS expert (Signal Protocol, RFC 9420 MLS, RFC 8785 JCS, key transparency)
  - Onchain identity expert (Lens v3, EAS, ERC-4337/5114/5192, did:key/web/plc, Coinbase Smart Wallet)
status: critique
---

# NRG · FRQNCY Social — Five-Expert Critique

Five domain experts independently audited NRG's design. Each had read the relevant protocol specs, papers, and codebases — and each was asked to deliver STRONG feedback, not polite review. This doc consolidates their findings, surfaces cross-cutting themes, and ranks the must-do fixes.

## TL;DR — the brutal-truth chorus

Five different experts reading independently converged on the same indictment:

> **NRG has shipped 80% of a decentralization story with 20% of the decentralization payoff.** Ed25519 signatures without DIDs are a research project, not a protocol. A signed mirror to a private R2 bucket is a notarized hostage note. App-passwords in localStorage is a 2023 design in 2026. Sealed-box DMs with server-attested sender_id is encryption-that-looks-like-encryption. The "Lexicon-compatible from day one" claim doesn't survive a 5-minute schema diff. The wallet shows but does nothing. The libsodium key is the entire identity with no rotation, no revocation, and a .txt file as the only escape hatch.

The good news: most of these are 1-to-30-hour fixes, not architectural rewrites. The hybrid signed-mirror is conceptually right; the surrounding plumbing needs to grow up.

---

## Section 1 — ATProto expert: "Lexicon-compatible from day one" doesn't hold

**Brutal truth.** Phase 2 is called a commitment device but isn't one. The signed records use `type: 'frqncy.post.v1'` (not a valid NSID), sign canonical JSON (not DAG-CBOR that ATProto verifies), use Supabase UUIDs for ids (not TIDs that the MST needs), use plain media URLs (not BlobRef CIDs), and miss `langs`/`facets`/`reply` entirely. Migration day will require re-signing every record. **App passwords in localStorage is a credential exfiltration vector you shipped to production** — OAuth + DPoP has been GA since late 2024.

**Top 5 recommendations:**
1. **OAuth + DPoP** for the Bluesky bridge — kill app-password storage this quarter.
2. **Mint `did:web:<username>.frqncy.network`** per user NOW — six lines of code, a Pages Function serving `/users/<u>/.well-known/did.json`.
3. **Sign DAG-CBOR**, not canonical JSON, for records destined for ATProto.
4. **Rewrite `signed_payload` shape** to match `app.bsky.feed.post`: emit `$type`, derive TID from `created_at`, replace `media_urls` with `embed.images[].image` BlobRefs (upload to R2 content-addressed first).
5. **Cursor-keyed cache + 60s TTL** on `fetchBlueskyTimeline` and `fetchBlueskyThread` — current per-render fetches will rate-limit your CF egress IP range.

**AppView readiness score: 3/10.** Zero PDS, zero Lexicon files, zero custom feed generators. The "riskiest unbuilt piece" is a custom feed generator — shipping ONE would teach you 80% of ATProto's quirks at ~$0/mo.

---

## Section 2 — Farcaster expert: NRG copied the wrong lesson

**Brutal truth.** You correctly chose ATProto-primary over Farcaster-primary. But you took the wrong lesson from Farcaster's architecture: its actual gift to social-protocol design is not "FIDs on Optimism," it's **custody/signer key separation with per-device revocable keys**. NRG has one Ed25519 key in localStorage that, if exfiltrated once, forges your identity forever — no rotation, no revocation, no per-device signers. The Frames v2 primitive (in-feed mini-apps with wallet-aware actions) is exactly the kind of practice-shaped UX the FRQNCY persona would love, and ATProto has nothing close. Privy is currently a decoration, not a Farcaster-grade identity layer.

**Top 5 recommendations:**
1. **Custody/signer separation, even without onchain custody.** Add a `signing_keys` table (`profile_id, public_key, created_at, revoked_at, device_label`); treat `profiles.signing_public_key` as deprecated "current active signer."
2. **Per-device signer keys.** localStorage key becomes `SIGNING_KEY_LS_KEY_${deviceId}`; new login on a new device → new signer → registered against the user's set → revocable independently.
3. **Domain-separated signatures.** Add `network: 'frqncy.nrg.v1'` to every `signed_payload`. One-line change; prevents an entire replay-attack class before there's history to migrate.
4. **Frames v2 envelope + 3 practice frames.** Generic iframe+postMessage container; ship: (a) `frqncy.frame.breath-pace.v1`, (b) `frqncy.frame.evening-bedside.v1`, (c) `frqncy.frame.conviction-as-stance.v1`. Renderable as Frames v2 on Farcaster cross-post.
5. **Sponsored embedded-wallet provisioning** — auto-provision Privy at signup, sponsor gas via paymaster, hide the wallet entirely until needed.

---

## Section 3 — Nostr expert: "the signed mirror is a hostage note"

**Brutal truth.** You wrote a 170-line proposal about deferring the protocol pivot to 2027 and the word "relay" appears zero times. You signed every post with Ed25519 and then stored those signatures in a private bucket only you can read — that's notarization, not federation. You used `crypto_box_seal` (anonymous-sender) and papered over the missing sender identity with a `sender_id` database column. You added eight identifiers to a user profile when one would do. The thing that would deliver on the "user-owned, key-portable" framing — `WebSocket.send()` to a free relay nobody can shut down — is six lines of code you haven't written. **You're not behind because the technology is hard; you're behind because you treated decentralization as a brand commitment, not an engineering one.**

**Top 5 recommendations:**
1. **Publish signed records to ≥1 public Nostr relay** (relay.damus.io, nos.lol). 30 lines of WebSocket; the records are already signed. Real federation, single-file diff, $0/mo.
2. **Replace sealed boxes with NIP-44 v2** (ChaCha20-Poly1305 + HKDF over X25519 ECDH + length padding) — ~150 lines, same library, real sender authentication.
3. **NIP-49 passphrase-encrypted backups** before scaling — `crypto_pwhash` (argon2id) + `crypto_secretbox` around the existing backup JSON. Eliminates the "anyone with the .txt has your DMs" failure mode.
4. **Generate a secp256k1 Nostr identity per user**, surfaced as optional. Third keypair, opt-in to publish.
5. **NIP-65 outbox model** for federation READS (more valuable at NRG's scale than writes) — users declare which Bluesky/Nostr/Farcaster surfaces they read from.

---

## Section 4 — E2EE expert: "encryption that looks like encryption"

**Brutal truth.** What you have today is "Supabase admin can't read message bodies." That is real and good for v1 — but it is **not what users hear when they see 'end-to-end encrypted.'** Users hear "even FRQNCY can't impersonate me, can't link my conversations, can't read my old messages if my phone is seized in 2027." None of those three are true. A consciousness-practice community discussing psychedelics, trauma, mental health, and dissident wellness in countries that don't love any of that is **exactly the population** for whom "the server can swap your conversation partner's public key" is a non-academic threat.

**Top 5 today-actions (ranked):**
1. **Sign every DM ciphertext with the existing Ed25519 key**, verify on receive. The crypto primitives exist (`signPayload`, `verifySignature` in crypto.ts) — they're just not called on DMs. **Two hours of code.** Closes the server-can-forge-sender_id gap.
2. **Stop auto-generating keys in `ensureEncryptionKeypair` on first session.** Move generation behind a gated "Set up secure DMs" flow that mandates passphrase or backup before generation completes. "Skip" becomes "I'll use plaintext DMs," not "I have a crypto identity I cannot recover."
3. **Wrap localStorage private keys with a passphrase** via `crypto_pwhash_str` (Argon2id). Store the wrapped blob; unwrap into memory on first DM open per session. Defeats casual localStorage exfiltration.
4. **Replace `canonicalizeForSigning` with RFC 8785 JCS reference implementation** (`npm i canonicalize`). Bespoke canonicalization will silently break the moment a non-JS verifier exists. NFC, number-format, and undefined-vs-null gaps are interop landmines.
5. **Add member-removal key-rotation step.** When a member leaves, force remaining members to rotate their messaging keys for that conversation (per-conversation sub-keys derived from long-term key + conversation salt). Not MLS, but not "removed-means-still-reading-cached-rows."

**v2 destination:** MLS (RFC 9420), not Signal. Multi-member groups are already a primitive in NRG; MLS Tree-KEM is the only spec with rigorous treatment of group epochs + member removal; `wire-server/core-crypto` ships browser WASM bindings under MPL-2.0.

---

## Section 5 — Onchain expert: "wallet shows, wallet does nothing"

**Brutal truth.** You've shipped 80% of an onchain story with none of the onchain payoff. Ed25519 signatures with no DID is a research project, not a protocol. A `wallet_address` column with no affordance is dead pixels paying Privy a license fee. A `founder_badge` boolean is a participation trophy that no one outside FRQNCY can see — which is exactly the opposite of what a badge is supposed to do. Migration 013 is Stripe-with-extra-steps when it could be an EAS attestation that survives FRQNCY entirely. The frontier-lab essays you've read are about protocols; your users are about credentials, payments, and portable identity.

**Top 5 recommendations:**
1. **Mint `did:key` per user this week.** Derive `did:key:z6Mk...` from the existing Ed25519 public key (multibase + multicodec prefix 0xed01); add `profiles.did`; include in signed payloads and `/api/export`. Two hours of work, locks in 2027 optionality.
2. **Add `UNIQUE(LOWER(wallet_address))` partial index immediately.** Migration 007 lets two profiles claim the same wallet — silently breaks the `/api/export` identity guarantee. Fifteen minutes of work, fixes a P0 identity bug.
3. **Move Network Membership to EAS on Base.** Stripe webhook calls EAS `attest()` for `(recipient, tier, validFrom, validUntil, referrerCode)`. ~$10/mo gas; portable membership that survives Supabase outage.
4. **Decide on Privy this quarter: kill or wire to something real.** Either ship EAS-gated `/courses/` premium + conviction-as-attestation by end of Q3, OR replace PrivyLoginButton with a "Wallet coming Q4 2026" placeholder.
5. **Replace `founder_badge BOOLEAN` with a non-transferable EAS attestation** (ERC-5114-style). Users can show the badge on Bluesky bios, Farcaster, ENS records — anywhere. Same cooperation-rule compliance because EAS isn't a leaderboard, it's a possession.

---

## Cross-cutting themes — what 3+ experts agreed on

| Theme | Flagged by | Severity |
|---|---|---|
| **No DID / globally-resolvable identifier** | ATProto, Farcaster, Onchain | HIGH |
| **Bespoke canonicalization (not JCS / not DAG-CBOR)** | ATProto, E2EE | HIGH |
| **Sender authentication missing on DMs** | E2EE, Nostr | HIGH |
| **No signer-key rotation / revocation** | Farcaster, E2EE | HIGH |
| **App-password-in-localStorage instead of OAuth** | ATProto | HIGH |
| **No domain separator in signed payload** | Farcaster | MED |
| **No passphrase-derived key recovery** | E2EE, Nostr | MED |
| **Federated reader has no cache** | ATProto | MED |
| **Wallet UNIQUE index missing** | Onchain | MED |
| **Privy is decorative, not load-bearing** | Onchain, Farcaster | MED |
| **Signed mirror is private, not federated** | Nostr | MED |
| **Membership/founder_badge should be EAS, not Supabase columns** | Onchain | MED |
| **Member-removal lacks PCS (post-compromise security)** | E2EE | MED |
| **Frames v2 / in-feed mini-apps missing** | Farcaster | LOW |
| **Nostr / NIP-44 v2 for DMs** | Nostr | LOW |

---

## Prioritized fix list

### Tier 1 — Ship this week (small, high-leverage, mostly self-contained)
1. **Mint `did:key` per user.** crypto.ts helper + profile column + export field. ~2 hours.
2. **Add `network: 'frqncy.nrg.v1'` domain separator to signed payloads.** crypto.ts + api.ts. ~1 hour.
3. **Sign DM ciphertexts with Ed25519** for sender authentication. useMessages.ts + new `messages.sender_signature` column. ~2 hours.
4. **Add UNIQUE(LOWER(wallet_address)) partial index** + ON CONFLICT in privy-bridge.ts. Migration + 15 min.
5. **Fix canonicalization** — NFC normalize strings, document/fix number-handling. crypto.ts. ~1 hour.
6. **Cache fetchBlueskyTimeline + fetchBlueskyThread** — session-scoped 60s TTL. atproto-bridge.ts. ~2 hours.

### Tier 2 — Ship this month
7. **OAuth + DPoP for Bluesky bridge.** Replace app-password storage. ~16 hours.
8. **Passphrase-wrap localStorage private keys** with Argon2id. crypto.ts + UI flow. ~8 hours.
9. **NIP-49 / passphrase-encrypted .txt backups.** ~4 hours.
10. **Per-device signer-keys table.** Migration + AuthProvider + keys panel. ~16 hours.
11. **Publish signed records to ≥1 Nostr relay** (relay.damus.io). New helper + api.ts call. ~6 hours.
12. **Gate ensureEncryptionKeypair behind a "Set up secure DMs" flow.** Remove auto-generate-on-signup. ~6 hours.

### Tier 3 — Ship this quarter
13. **EAS membership attestations** on Base. Stripe webhook → `attest()`. ~30 hours, ~$10/mo gas.
14. **EAS founder_badge / conviction attestations.** ~16 hours.
15. **DAG-CBOR signed-record path** for ATProto-bound records (`@ipld/dag-cbor`). ~16 hours.
16. **Lexicon-shape rewrite** of signed_payload: `$type`, TIDs from created_at, BlobRef CIDs for media. ~24 hours.
17. **Frames v2 envelope** + 3 starter frames (breath-pace, evening-bedside, conviction-as-stance). ~40 hours.
18. **Member-removal key rotation** (per-conversation sub-keys). ~12 hours.

### Defer indefinitely (or to 2027)
- Full MLS Tree-KEM (RFC 9420) for groups — wait until ≥6-member groups are common.
- Posts/follows onchain (Lens-v3 model) — too expensive at scale.
- ATProto Phase 3 cutover — Q1–Q2 2027 as planned.

---

## Source documents (each expert's full critique was preserved in conversation)

Files audited by all 5 experts:
- `proposals/NRG-ONCHAIN-PIVOT.md`
- `proposals/HYBRID-SIGNED-MIRROR.md`
- `social-src/E2EE-NOTES.md`
- `social-src/src/lib/crypto.ts`
- `social-src/src/lib/api.ts`
- `social-src/src/components/AuthProvider.tsx`
- `supabase/migrations/009_signed_message_mirror.sql`
- `functions/api/export.js`

Plus domain-specific files (atproto-bridge.ts, useMessages.ts, privy-bridge.ts, EncryptionKeysPanel.tsx, migrations 006-017).

---

**Next step:** the Tier 1 fixes ship in parallel via 5 scoped agents. Tier 2 + 3 await Orlando's prioritization.
