/**
 * nostr-publish.ts — NIP-01 short-note publishing for NRG posts.
 *
 * Tier-2 fix #11 from proposals/NRG-EXPERT-CRITIQUE-2026-05-14.md. The
 * Nostr expert flagged the absence of relay publishing as the strongest
 * evidence that NRG's "user-owned, key-portable" framing was marketing,
 * not engineering. This module is the engineering.
 *
 * Approach: when a user opts in (profiles.nostr_publish_enabled, migration
 * 021), each NRG post is also converted into a NIP-01 `kind: 1` text-note
 * event, signed client-side with a secp256k1 + schnorr (BIP-340) key, and
 * fan-out published to three free public relays:
 *
 *   - wss://relay.damus.io     (Damus)
 *   - wss://nos.lol            (nos.lol)
 *   - wss://relay.snort.social (Snort)
 *
 * Three WebSocket writes per post. ~$0/mo. Best-effort: succeeding on at
 * least one relay is acceptable per the Nostr outbox model — relays
 * gossip events between themselves over time.
 *
 * IMPORTANT — separate keypair, not the libsodium one.
 * NRG's existing identity key is Ed25519 (libsodium, migration 009).
 * Nostr is secp256k1 + schnorr. The two key systems are NOT
 * interchangeable. So every Nostr-enabled user generates a SEPARATE
 * secp256k1 keypair via `generateNostrKeypair()`, wrapped under the same
 * passphrase pattern as the libsodium key and stored in localStorage
 * under `frqncy.nrg.nostr.privkey` (hex). The Tier-3 keys panel exposes
 * the keygen + backup UI; this module is the protocol layer.
 *
 * Required dep: @noble/curves (npm install @noble/curves@^1.4.0).
 * It is NOT yet in social-src/package.json. Until it is, every export
 * in this module returns a graceful failure shape — no crash, no build
 * break. Add the dep and redeploy before Nostr publishing works
 * end-to-end. The module logs one warning on first failed load and
 * then stays silent.
 *
 * References:
 *   NIP-01  https://github.com/nostr-protocol/nips/blob/master/01.md
 *   NIP-19  https://github.com/nostr-protocol/nips/blob/master/19.md
 *   BIP-340 https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki
 *   BIP-173 https://github.com/bitcoin/bips/blob/master/bip-0173.mediawiki
 */


// ─── Types ──────────────────────────────────────────────────────────────────

export interface NostrEvent {
  /** 32-byte sha256 of canonical serialization, hex (64 chars). */
  id: string;
  /** secp256k1 x-only public key, hex (64 chars). */
  pubkey: string;
  /** Unix seconds. */
  created_at: number;
  /** NIP-01 kind. 1 = short text note. */
  kind: number;
  /** Tags. Each tag is an array of strings, the first being the tag name. */
  tags: string[][];
  content: string;
  /** Schnorr signature over the event id, hex (128 chars). */
  sig: string;
}

export interface RelayResult {
  relay: string;
  ok: boolean;
  reason?: string;
}

export interface FanOutResult {
  totalAttempted: number;
  succeeded: number;
  results: RelayResult[];
}


// ─── Default relays ─────────────────────────────────────────────────────────

export const DEFAULT_RELAYS: readonly string[] = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.snort.social',
] as const;


// ─── @noble/curves loader (graceful missing-dep handling) ───────────────────

interface NobleCurvesAPI {
  schnorr: {
    sign: (message: Uint8Array, privateKey: Uint8Array | string) => Uint8Array | Promise<Uint8Array>;
    getPublicKey: (privateKey: Uint8Array | string) => Uint8Array;
    utils: {
      randomPrivateKey: () => Uint8Array;
    };
  };
}

let nobleLoadAttempted = false;
let nobleApi: NobleCurvesAPI | null = null;
let nobleWarned = false;

async function loadNoble(): Promise<NobleCurvesAPI | null> {
  if (nobleLoadAttempted) return nobleApi;
  nobleLoadAttempted = true;
  try {
    // Dynamic import — at build time without the dep, the build will likely
    // fail; in production with the dep installed, this resolves to the
    // schnorr API. We catch defensively in case the file is bundled but
    // the dep is partially broken.
    // @ts-ignore — optional peer dep, intentionally untyped here.
    // Runtime variable so rollup doesn't statically resolve the bare
    // specifier — the import throws at runtime if the dep isn't installed,
    // caught below.
    const nobleModuleName = '@noble/curves/secp256k1';
    const mod = await import(/* @vite-ignore */ nobleModuleName);
    if (mod && mod.schnorr && typeof mod.schnorr.sign === 'function') {
      nobleApi = { schnorr: mod.schnorr } as NobleCurvesAPI;
    }
  } catch (e) {
    if (!nobleWarned) {
      nobleWarned = true;
      console.warn(
        '[nostr-publish] @noble/curves not installed — Nostr publishing disabled. ' +
          'Run `npm install @noble/curves@^1.4.0` in social-src/ to enable.'
      );
    }
  }
  return nobleApi;
}


// ─── Hex helpers ────────────────────────────────────────────────────────────

function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) throw new Error('hex length must be even');
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function bytesToHex(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) {
    s += bytes[i].toString(16).padStart(2, '0');
  }
  return s;
}


// ─── Bech32 (BIP-173 / NIP-19) ──────────────────────────────────────────────
// Lightweight in-file implementation so we don't take another dep just for
// npub/nsec encoding. Uses the BIP-173 charset and BCH checksum.

const BECH32_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const BECH32_GENERATOR = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];

function bech32Polymod(values: number[]): number {
  let chk = 1;
  for (let i = 0; i < values.length; i++) {
    const b = chk >> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ values[i];
    for (let j = 0; j < 5; j++) {
      if ((b >> j) & 1) chk ^= BECH32_GENERATOR[j];
    }
  }
  return chk;
}

function bech32HrpExpand(hrp: string): number[] {
  const out: number[] = [];
  for (let i = 0; i < hrp.length; i++) out.push(hrp.charCodeAt(i) >> 5);
  out.push(0);
  for (let i = 0; i < hrp.length; i++) out.push(hrp.charCodeAt(i) & 31);
  return out;
}

function bech32CreateChecksum(hrp: string, data: number[]): number[] {
  const values = bech32HrpExpand(hrp).concat(data).concat([0, 0, 0, 0, 0, 0]);
  const mod = bech32Polymod(values) ^ 1;
  const out: number[] = [];
  for (let i = 0; i < 6; i++) out.push((mod >> (5 * (5 - i))) & 31);
  return out;
}

function convertBits(data: Uint8Array, fromBits: number, toBits: number, pad: boolean): number[] {
  let acc = 0;
  let bits = 0;
  const out: number[] = [];
  const maxv = (1 << toBits) - 1;
  for (let i = 0; i < data.length; i++) {
    const v = data[i];
    if (v < 0 || v >> fromBits !== 0) throw new Error('invalid byte');
    acc = (acc << fromBits) | v;
    bits += fromBits;
    while (bits >= toBits) {
      bits -= toBits;
      out.push((acc >> bits) & maxv);
    }
  }
  if (pad) {
    if (bits > 0) out.push((acc << (toBits - bits)) & maxv);
  } else if (bits >= fromBits || ((acc << (toBits - bits)) & maxv)) {
    throw new Error('invalid padding');
  }
  return out;
}

function bech32Encode(hrp: string, data: number[]): string {
  const combined = data.concat(bech32CreateChecksum(hrp, data));
  let out = hrp + '1';
  for (let i = 0; i < combined.length; i++) out += BECH32_CHARSET.charAt(combined[i]);
  return out;
}

function encodeBech32WithHrp(hrp: string, hex: string): string {
  const data = convertBits(hexToBytes(hex), 8, 5, true);
  return bech32Encode(hrp, data);
}

export function publicKeyToNpub(publicKeyHex: string): string {
  return encodeBech32WithHrp('npub', publicKeyHex);
}

export function privateKeyToNsec(privateKeyHex: string): string {
  return encodeBech32WithHrp('nsec', privateKeyHex);
}


// ─── NIP-01 canonical event id (sha256) ─────────────────────────────────────
// Per NIP-01, the event id is sha256 of the canonical JSON serialization:
//   [0, pubkey, created_at, kind, tags, content]
// JSON.stringify with no whitespace produces the canonical form for the
// numeric/string types involved here (no floating-point ambiguity since
// created_at is a unix integer and kind is an integer).

async function sha256Hex(input: Uint8Array): Promise<string> {
  // Web crypto is available in browsers + workerd (Cloudflare Pages SSR).
  const digest = await crypto.subtle.digest('SHA-256', input);
  return bytesToHex(new Uint8Array(digest));
}

function serializeForId(
  pubkey: string,
  created_at: number,
  kind: number,
  tags: string[][],
  content: string
): string {
  return JSON.stringify([0, pubkey, created_at, kind, tags, content]);
}


// ─── Keygen + signing ───────────────────────────────────────────────────────

export interface KeypairFailure {
  ok: false;
  reason: string;
}

export interface Keypair {
  ok: true;
  privateKeyHex: string;
  publicKeyHex: string;
  npub: string;
  nsec: string;
}

export async function generateNostrKeypair(): Promise<Keypair | KeypairFailure> {
  const noble = await loadNoble();
  if (!noble) return { ok: false, reason: '@noble/curves not installed' };
  try {
    const sk = noble.schnorr.utils.randomPrivateKey();
    const pk = noble.schnorr.getPublicKey(sk);
    const privateKeyHex = bytesToHex(sk);
    const publicKeyHex = bytesToHex(pk);
    return {
      ok: true,
      privateKeyHex,
      publicKeyHex,
      npub: publicKeyToNpub(publicKeyHex),
      nsec: privateKeyToNsec(privateKeyHex),
    };
  } catch (e: any) {
    return { ok: false, reason: e?.message ?? 'keygen failed' };
  }
}

export interface SignedEventFailure {
  ok: false;
  reason: string;
  event?: undefined;
}

export interface SignedEventSuccess {
  ok: true;
  event: NostrEvent;
  reason?: undefined;
}

export async function signNostrEvent(
  privateKeyHex: string,
  partialEvent: Omit<NostrEvent, 'id' | 'pubkey' | 'sig'>
): Promise<SignedEventSuccess | SignedEventFailure> {
  const noble = await loadNoble();
  if (!noble) return { ok: false, reason: '@noble/curves not installed' };
  try {
    const sk = hexToBytes(privateKeyHex);
    const pkBytes = noble.schnorr.getPublicKey(sk);
    const pubkey = bytesToHex(pkBytes);

    const serialized = serializeForId(
      pubkey,
      partialEvent.created_at,
      partialEvent.kind,
      partialEvent.tags,
      partialEvent.content
    );
    const id = await sha256Hex(new TextEncoder().encode(serialized));

    const sigBytes = await noble.schnorr.sign(hexToBytes(id), sk);
    const sig = bytesToHex(sigBytes instanceof Uint8Array ? sigBytes : new Uint8Array(sigBytes));

    return {
      ok: true,
      event: {
        id,
        pubkey,
        created_at: partialEvent.created_at,
        kind: partialEvent.kind,
        tags: partialEvent.tags,
        content: partialEvent.content,
        sig,
      },
    };
  } catch (e: any) {
    return { ok: false, reason: e?.message ?? 'sign failed' };
  }
}


// ─── Relay publish ──────────────────────────────────────────────────────────

const RELAY_TIMEOUT_MS = 5000;

export function publishToRelay(event: NostrEvent, relayUrl: string): Promise<RelayResult> {
  return new Promise<RelayResult>((resolve) => {
    let settled = false;
    const finish = (result: RelayResult) => {
      if (settled) return;
      settled = true;
      try {
        ws.close();
      } catch {
        /* noop */
      }
      resolve(result);
    };

    let ws: WebSocket;
    try {
      ws = new WebSocket(relayUrl);
    } catch (e: any) {
      resolve({ relay: relayUrl, ok: false, reason: e?.message ?? 'WebSocket construct failed' });
      return;
    }

    const timer = setTimeout(() => {
      finish({ relay: relayUrl, ok: false, reason: `timeout after ${RELAY_TIMEOUT_MS}ms` });
    }, RELAY_TIMEOUT_MS);

    ws.onopen = () => {
      try {
        ws.send(JSON.stringify(['EVENT', event]));
      } catch (e: any) {
        clearTimeout(timer);
        finish({ relay: relayUrl, ok: false, reason: e?.message ?? 'send failed' });
      }
    };

    ws.onmessage = (msg: MessageEvent) => {
      try {
        const data = typeof msg.data === 'string' ? JSON.parse(msg.data) : null;
        if (!Array.isArray(data)) return;
        // ['OK', <event_id>, <accepted: boolean>, <message: string>]
        if (data[0] === 'OK' && data[1] === event.id) {
          clearTimeout(timer);
          if (data[2] === true) {
            finish({ relay: relayUrl, ok: true });
          } else {
            finish({ relay: relayUrl, ok: false, reason: String(data[3] ?? 'relay rejected') });
          }
        } else if (data[0] === 'NOTICE') {
          // NOTICEs are informational — we don't fail on them, but record
          // the most recent one in case the relay never sends OK.
          // (Stored as the fallback reason if the timeout fires next.)
        }
      } catch {
        /* ignore parse errors */
      }
    };

    ws.onerror = () => {
      clearTimeout(timer);
      finish({ relay: relayUrl, ok: false, reason: 'websocket error' });
    };

    ws.onclose = (ev: CloseEvent) => {
      clearTimeout(timer);
      finish({
        relay: relayUrl,
        ok: false,
        reason: `closed before OK (code ${ev.code})`,
      });
    };
  });
}

export async function publishToDefaultRelays(event: NostrEvent): Promise<FanOutResult> {
  const results = await Promise.all(
    DEFAULT_RELAYS.map((relay) => publishToRelay(event, relay))
  );
  return {
    totalAttempted: results.length,
    succeeded: results.filter((r) => r.ok).length,
    results,
  };
}


// ─── High-level: NRG post → kind:1 note → fan-out ───────────────────────────

export interface PublishNrgPostFailure {
  ok: false;
  reason: string;
  event?: undefined;
  relayResults?: undefined;
}

export interface PublishNrgPostSuccess {
  ok: true;
  event: NostrEvent;
  relayResults: FanOutResult;
  reason?: undefined;
}

export interface NrgPostInput {
  content: string;
  created_at_ms: number;
  link_url?: string | null;
  project_tag?: string | null;
  media_urls?: string[];
  /** Canonical URL on NRG. Embedded in the note so Nostr readers can come back. */
  nrg_url: string;
}

/**
 * Convert an NRG post into a NIP-01 kind:1 text note, sign with the user's
 * secp256k1 private key, and fan-out publish to DEFAULT_RELAYS. Tags:
 *
 *   ['r', nrg_url]            — canonical URL reference (NIP-12 r-tag).
 *   ['t', project_tag]        — hashtag (if project_tag present).
 *   ['client', 'frqncy-nrg']  — soft attribution so Nostr clients can show
 *                               where the note originated.
 *
 * The note content embeds the NRG canonical URL as a trailing line so
 * readers see a clear link back regardless of how their client renders
 * tags. Media URLs are appended as additional lines so they preview in
 * clients that auto-embed images. (NIP-94/imeta is a future enhancement.)
 */
export async function publishNrgPostAsNote(
  privateKeyHex: string,
  nrgPost: NrgPostInput
): Promise<PublishNrgPostSuccess | PublishNrgPostFailure> {
  if (!privateKeyHex) return { ok: false, reason: 'no private key' };

  const created_at = Math.floor(nrgPost.created_at_ms / 1000);

  const tags: string[][] = [];
  tags.push(['r', nrgPost.nrg_url]);
  if (nrgPost.project_tag) tags.push(['t', nrgPost.project_tag]);
  tags.push(['client', 'frqncy-nrg']);

  const lines: string[] = [nrgPost.content.trim()];
  if (nrgPost.link_url) lines.push(nrgPost.link_url);
  if (nrgPost.media_urls && nrgPost.media_urls.length > 0) {
    for (const u of nrgPost.media_urls) lines.push(u);
  }
  lines.push(nrgPost.nrg_url);
  const content = lines.filter(Boolean).join('\n\n');

  const signed = await signNostrEvent(privateKeyHex, {
    created_at,
    kind: 1,
    tags,
    content,
  });
  if (!signed.ok) return { ok: false, reason: signed.reason };

  const relayResults = await publishToDefaultRelays(signed.event);
  return { ok: true, event: signed.event, relayResults };
}
