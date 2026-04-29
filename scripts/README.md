# scripts

Standalone tools that don't ship with the build pipeline. Run them directly.

## verify-export.mjs

Independent verifier for the hybrid signed-message mirror export endpoint
(`/api/export?username=<x>`). Fetches the JSON dump, re-verifies every Ed25519
detached signature against the included `signing_public_key`, and prints a
clean pass/fail report.

### What it proves

The export endpoint claims it serves "actually-portable cryptographic
records, not vendor-locked ones" (see
[`proposals/HYBRID-SIGNED-MIRROR.md`](../proposals/HYBRID-SIGNED-MIRROR.md)).
This script is the proof: a third party with no FRQNCY code in their tree
can fetch the export, run the verifier, and confirm "yes, these records were
authored by the holder of this signing key — Supabase or no Supabase."

The canonicalize function inside the script is duplicated inline (NOT
imported from `social-src`) on purpose — keeping the verifier independent of
the producer is the entire point.

### Usage

```bash
# One-time: install libsodium-wrappers if it isn't already.
npm i libsodium-wrappers

# Verify a user's signed export against production.
node scripts/verify-export.mjs <username>

# Or point at staging / a local dev tunnel.
NRG_BASE_URL=https://staging.frqncy.network node scripts/verify-export.mjs <username>
```

Exit codes:

- `0` — every signed record verified successfully
- `1` — fetch failed, no signing key on profile, or any signature mismatch
- `2` — usage error (missing username arg)

### Sample output

```
$ node scripts/verify-export.mjs orlando
Fetching https://frqncy.network/api/export?username=orlando ...
Got 32 signed posts and 8 signed follows from orlando.

Verifying signatures with signing public key:
  WqJ4...8vF5

✓ Posts: 32/32 verified
✓ Follows: 8/8 verified

Encryption public key on profile: kP3o...mN9X
Wallet: 0x6f3a...d24c

This export is portable. Anyone who fetches it can verify these records
were authored by the holder of signing key WqJ4...8vF5 — independent of
FRQNCY's database.

Republish path:
  - ATProto: each post + follow can become an `xyz.frqncy.post.v1` /
    `xyz.frqncy.follow.v1` Lexicon record on a target PDS.
  - Farcaster: cast bodies can be re-signed with the user's FID key (a
    new key — Farcaster signs with their own keypair) and broadcast to a hub.
  - Custom: any verifier with the signing public key + this JSON can
    confirm provenance.
```

### Requirements

- Node 22+ (uses built-in `fetch`)
- `libsodium-wrappers` (already a runtime dep of `social-src`; install
  globally or in this project root if running from a fresh clone)
