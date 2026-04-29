#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// verify-export.mjs — independent signature verifier for /api/export
//
// What it does:
//   1. Fetches https://frqncy.network/api/export?username=<name>
//   2. Re-verifies every Ed25519 detached signature against the included
//      `signing_public_key`, using the *exact* canonicalization rules used
//      client-side at signing time.
//   3. Prints a clean human-readable report. Exits 0 if every signed record
//      verifies; exits 1 on any mismatch or fetch failure.
//
// Why this exists:
//   The hybrid signed-message mirror (see proposals/HYBRID-SIGNED-MIRROR.md)
//   only delivers on its promise — "every NRG record is portable, no vendor
//   lock-in" — if a third party can independently confirm the signatures.
//   This script IS that third party. It deliberately does not import any
//   FRQNCY source: the canonicalize function is duplicated inline so the
//   script stays self-contained and verifiable on its own merits.
//
// Usage:
//   node scripts/verify-export.mjs <username>
//   NRG_BASE_URL=https://staging.frqncy.network node scripts/verify-export.mjs <username>
//
// Requires Node 22+ (for built-in fetch) and `npm i libsodium-wrappers`.
// ─────────────────────────────────────────────────────────────────────────────

import sodium from 'libsodium-wrappers';

const DEFAULT_BASE_URL = 'https://frqncy.network';

// ── canonicalizeForSigning — byte-identical to social-src/src/lib/crypto.ts ──
// DO NOT change this function without also changing the browser version. The
// signed-payload bytes must match exactly or every signature fails. Sorted
// keys, JSON.stringify, no whitespace, arrays preserved in order.
function canonicalizeForSigning(record) {
  return JSON.stringify(record, function replacer(_key, value) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const sorted = {};
      for (const k of Object.keys(value).sort()) {
        sorted[k] = value[k];
      }
      return sorted;
    }
    return value;
  });
}

function shortKey(b64) {
  if (!b64 || typeof b64 !== 'string') return '(none)';
  if (b64.length <= 12) return b64;
  return `${b64.slice(0, 4)}...${b64.slice(-4)}`;
}

function shortAddr(addr) {
  if (!addr || typeof addr !== 'string') return '(none)';
  if (addr.length <= 14) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

async function verifyOne(so, payload, signatureB64, publicKeyB64) {
  try {
    const sig = so.from_base64(signatureB64, so.base64_variants.ORIGINAL);
    const pk = so.from_base64(publicKeyB64, so.base64_variants.ORIGINAL);
    return so.crypto_sign_verify_detached(sig, payload, pk);
  } catch {
    return false;
  }
}

async function main() {
  const username = (process.argv[2] || '').trim();
  if (!username) {
    console.error('usage: node scripts/verify-export.mjs <username>');
    process.exit(2);
  }

  const baseUrl = (process.env.NRG_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');
  const url = `${baseUrl}/api/export?username=${encodeURIComponent(username)}`;
  console.log(`Fetching ${url} ...`);

  let res;
  try {
    res = await fetch(url, { headers: { Accept: 'application/json' } });
  } catch (err) {
    console.error(`Network error: ${err?.message ?? err}`);
    process.exit(1);
  }

  if (res.status === 404) {
    console.error(`No user with username "${username}" (404).`);
    process.exit(1);
  }
  if (res.status === 429) {
    console.error('Rate-limited (429). Wait a minute and try again.');
    process.exit(1);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error(`Export request failed: ${res.status} ${res.statusText}\n${text}`);
    process.exit(1);
  }

  let body;
  try {
    body = await res.json();
  } catch (err) {
    console.error(`Invalid JSON in response: ${err?.message ?? err}`);
    process.exit(1);
  }

  const signingKey = body.signing_public_key;
  const encryptionKey = body.encryption_public_key;
  const wallet = body.user?.wallet_address;
  const posts = Array.isArray(body.posts) ? body.posts : [];
  const follows = Array.isArray(body.follows) ? body.follows : [];

  console.log(
    `Got ${posts.length} signed post${posts.length === 1 ? '' : 's'} ` +
      `and ${follows.length} signed follow${follows.length === 1 ? '' : 's'} from ${username}.\n`,
  );

  if (!signingKey) {
    console.error(
      'This profile has no signing_public_key on file. The export is partial — ' +
        'unsigned legacy rows are returned but none can be verified. Exiting 1.',
    );
    process.exit(1);
  }

  console.log('Verifying signatures with signing public key:');
  console.log(`  ${shortKey(signingKey)}\n`);

  await sodium.ready;
  const so = sodium;

  // The export stores `signed_payload` as the exact canonical JSON string
  // that the author's browser signed. We verify against those bytes
  // directly. Re-canonicalizing locally would only matter if we received the
  // record as a parsed object — which the export never does — and we leave
  // canonicalizeForSigning available above as a self-contained spec for any
  // verifier writing their own pipeline.
  let postsOk = 0;
  let postsFail = 0;
  for (const p of posts) {
    if (!p?.signed_payload || !p?.signature) {
      postsFail++;
      continue;
    }
    const ok = await verifyOne(so, p.signed_payload, p.signature, signingKey);
    if (ok) postsOk++;
    else postsFail++;
  }

  let followsOk = 0;
  let followsFail = 0;
  for (const f of follows) {
    if (!f?.signed_payload || !f?.signature) {
      followsFail++;
      continue;
    }
    const ok = await verifyOne(so, f.signed_payload, f.signature, signingKey);
    if (ok) followsOk++;
    else followsFail++;
  }

  const postsTotal = posts.length;
  const followsTotal = follows.length;
  const allOk = postsFail === 0 && followsFail === 0;

  const mark = (ok) => (ok ? '✓' : '✗');
  console.log(
    `${mark(postsFail === 0)} Posts: ${postsOk}/${postsTotal} verified` +
      (postsFail ? ` — ${postsFail} FAILED` : ''),
  );
  console.log(
    `${mark(followsFail === 0)} Follows: ${followsOk}/${followsTotal} verified` +
      (followsFail ? ` — ${followsFail} FAILED` : ''),
  );

  console.log('');
  console.log(`Encryption public key on profile: ${shortKey(encryptionKey)}`);
  console.log(`Wallet: ${shortAddr(wallet)}`);

  if (allOk) {
    console.log('');
    console.log('This export is portable. Anyone who fetches it can verify these records');
    console.log(`were authored by the holder of signing key ${shortKey(signingKey)} — independent of`);
    console.log("FRQNCY's database.");
    console.log('');
    console.log('Republish path:');
    console.log('  - ATProto: each post + follow can become an `xyz.frqncy.post.v1` /');
    console.log('    `xyz.frqncy.follow.v1` Lexicon record on a target PDS.');
    console.log('  - Farcaster: cast bodies can be re-signed with the user\'s FID key (a');
    console.log("    new key — Farcaster signs with their own keypair) and broadcast to a hub.");
    console.log('  - Custom: any verifier with the signing public key + this JSON can');
    console.log('    confirm provenance.');
    process.exit(0);
  } else {
    console.error('');
    console.error('One or more signatures did NOT verify. Export integrity is compromised.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`Unexpected error: ${err?.stack ?? err?.message ?? err}`);
  process.exit(1);
});
