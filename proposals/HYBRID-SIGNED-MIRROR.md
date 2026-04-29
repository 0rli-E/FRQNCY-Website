---
title: NRG Hybrid Signed-Message Mirror — Phase 2 Commitment Device
date: 2026-04-29
status: design — partially shipped
---

# Hybrid Signed-Message Mirror

This is the cheap insurance recommended in `proposals/NRG-ONCHAIN-PIVOT.md` section 7 — the architectural move that keeps every protocol option open without committing to one. Every NRG post + follow gets cryptographically signed by its author. The signed records are portable: any future migration to ATProto, Farcaster, or a custom protocol becomes a workflow (export the signed records, re-publish them on the new substrate) rather than a rebuild.

## What's shipped this session (foundation)

1. **Ed25519 signing primitives** in `social-src/src/lib/crypto.ts`:
   - `generateSigningKeypair()`
   - `saveSigningPrivateKeyLocal()` / `loadSigningPrivateKeyLocal()`
   - `signPayload(payload, privKey)` — Ed25519 detached signature
   - `verifySignature(payload, sig, pubKey)`
   - `canonicalizeForSigning(record)` — sorted-keys stable JSON
   - `exportKeyBackup()` / `importKeyBackup(json)` — unified backup of both encryption + signing keys in one file

2. **Migration 009** (`supabase/migrations/009_signed_message_mirror.sql`):
   - `profiles.signing_public_key`
   - `posts.signature` + `posts.signed_payload`
   - `follows.signature` + `follows.signed_payload`
   - Partial indexes for fast export queries

3. **AuthProvider extension**: `ensureSigningKeypair()` runs alongside `ensureEncryptionKeypair()` on every signed-in load. Generates the Ed25519 keypair if missing, writes the public key to the profile. Refuses to regenerate over an existing key (would invalidate every past signature).

4. **`Profile` type extended** with `signing_public_key`. `fetchProfile` now selects it.

## What's NOT yet wired (next session)

The signing happens at the API layer (`src/lib/api.ts`). Three integration points:

### 1. Sign on post creation

In `api.ts::createPost`, after the post row is returned from Supabase:

```typescript
const signingPriv = loadSigningPrivateKeyLocal();
if (signingPriv) {
  const payload = canonicalizeForSigning({
    type: 'frqncy.post.v1',
    id: post.id,
    author_id: post.author_id,
    content: post.content,
    project_tag: post.project_tag,
    project_tier: post.project_tier,
    conviction: post.conviction,
    media_urls: post.media_urls,
    link_url: post.link_url,
    created_at: post.created_at,
  });
  const signature = await signPayload(payload, signingPriv);
  await supabase
    .from('posts')
    .update({ signature, signed_payload: payload })
    .eq('id', post.id);
}
```

If `signingPriv` is missing (new device, lost key), the post still ships unsigned. Verifiers skip unsigned rows.

### 2. Sign on follow creation

In `api.ts::followUser`, after the follow row is inserted:

```typescript
const signingPriv = loadSigningPrivateKeyLocal();
if (signingPriv) {
  const payload = canonicalizeForSigning({
    type: 'frqncy.follow.v1',
    follower_id: followerId,
    following_id: followingId,
    created_at: new Date().toISOString(),
  });
  const signature = await signPayload(payload, signingPriv);
  await supabase
    .from('follows')
    .update({ signature, signed_payload: payload })
    .eq('follower_id', followerId)
    .eq('following_id', followingId);
}
```

Same fall-through: unsigned follows still work.

### 3. Export endpoint

A Cloudflare Pages Function at `functions/api/export.js` that takes `?user=<username>` and returns a JSON dump of every signed record by that author:

```jsonc
{
  "user": "orlando",
  "signing_public_key": "...",
  "encryption_public_key": "...",
  "exported_at": "...",
  "posts": [
    { "signed_payload": "...", "signature": "..." },
    ...
  ],
  "follows": [
    { "signed_payload": "...", "signature": "..." },
    ...
  ]
}
```

Anyone can verify the signatures with the public key. Anyone can republish the records onto a different network.

## Why Ed25519 + canonical-JSON?

- **Ed25519** is the same curve ATProto uses for repository signatures and Farcaster uses for cast signing. If we ever migrate, the curve choice is already aligned — no key rotation needed.
- **Canonical JSON (sorted keys)** is what every "signed records" system in 2026 converges on (DCQL, IETF JSON Canonicalization Scheme RFC 8785, ATProto's ipld dag-cbor). Sticking to JSON-with-sorted-keys keeps the signed payloads human-readable for debugging and avoids the binary-encoding step that would be required for dag-cbor.
- We're NOT using JWS/JWT because the wrapping format adds 50 bytes per record for no benefit at FRQNCY scale.

## Threat model in plain language

**What signatures attest:**
- The author of a record had access to the signing private key at the time of signing.
- The record was not modified after signing.
- A future verifier (on any network) can confirm "this NRG user actually wrote this" without trusting Supabase.

**What signatures DON'T attest:**
- That the user is who they claim socially (Sybil resistance still depends on email + Privy + future identity layers).
- That the record was actually published when the `created_at` says it was (the server timestamp can be trusted; a self-attested timestamp inside `signed_payload` cannot).
- That the user actually wanted the record published (a malicious browser extension could sign a record without the user's knowledge).

## Migration path

Records signed in v1 stay verifiable forever. If we ever rotate the signing key (lost device, suspected compromise), past signatures with the old key stay valid; new records use the new key. Verifiers can query the profile for the current key and walk a small "key rotation log" if we add one later.

## Cost

Zero additional cost. Migration 009 adds three indexed nullable columns. Signing happens client-side (free, ~1ms). The export endpoint runs as a Cloudflare Pages Function on the existing free tier.

## Why ship this now (not Q4 2026 like the proposal suggested)?

Two reasons:

1. **The libsodium primitives were already shipped** for E2E encrypted messaging in this session. Adding signatures (different curve, same library) was incremental — about 80 lines of crypto.ts and one migration. Deferring to Q4 just to honor a proposal date doesn't serve anyone.

2. **The cost of unsigned legacy records grows monotonically.** Every post NRG accumulates without a signature is a record that won't survive a protocol pivot cleanly. Starting the signing now means by the time we're ready to migrate (Q1-Q2 2027 per the pivot proposal), we'll have a year of signed history to export instead of a year of ghosts.

The actual signing wire-up (api.ts integration + export endpoint) is still a focused next-session task — but the foundation is open.

## Verifiable export demo

A standalone verifier script lives at [`scripts/verify-export.mjs`](../scripts/verify-export.mjs). It fetches `/api/export?username=<x>`, re-runs the same Ed25519 signature check the browser does at sign-time, and prints a pass/fail report. The canonicalization function is duplicated inline so the script never imports a single byte from `social-src` — this is the whole point: a third party with no FRQNCY code in their tree can independently confirm that every record in the export was authored by the holder of the included signing public key. That's what makes the records portable rather than vendor-locked. See [`scripts/README.md`](../scripts/README.md) for sample output and usage.
