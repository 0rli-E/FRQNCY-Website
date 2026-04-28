---
title: "NRG Onchain Pivot — A Decision Framework for Going Farcaster-like or ATProto-like"
date: 2026-04-29
status: "proposal — operator review"
author: roadmap-agent
prior-art:
  - docs/FRQNCY_SOCIAL_RESEARCH_PAPER.md (v1.0, 2026-04-18; rev 2026-04-28)
  - proposals/EXECUTION-PLAN-90D.md
  - proposals/EDITORIAL-VALUES-V2.md
companion:
  - The libsodium sealed-box E2EE messaging spec being drafted in this same session.
    This proposal does NOT cover encryption; the two are deliberately decoupled.
---

# NRG Onchain Pivot

## TL;DR

You asked for "encrypted messaging and a Farcaster-style social platform with onchain social graph." The encryption half is being handled by the libsodium sealed-box spec in this session and is the right shape. The onchain half is more nuanced than it sounds: "onchain social graph" can mean five different things, with order-of-magnitude different costs and very different commitments. **The recommendation is to not pivot the protocol stack in 2026.** Ship the libsodium messaging now, then in Q4 add a thin signed-message export layer (the "hybrid" — a reversible bet that buys protocol optionality without protocol commitment), and only in 2027 — once the messaging is bedded in and we know where FRQNCY's audience actually is — pick ATProto or Farcaster as a parallel surface, not a replacement. The 2026-04-18 research paper recommended ATProto as the primary bridge target; nothing in the last ten days has changed that conclusion. This document is the "how do we sequence it given the 90-day plan and the libsodium work shipping now" companion.

## 1. "Onchain social graph" needs unpacking before deciding

When people say "onchain social" they're often pointing at five different things, each with very different operational profiles. It's worth being precise about which one you want, because the answer determines whether this is a weekend or an 18-month rebuild.

1. **Identity onchain.** A user has a globally-resolvable, user-controlled identifier. Farcaster's FID is an integer in a contract on Optimism; ATProto's `did:plc` is a key-pair recorded on a centrally-run-but-auditable DID ledger; Lens uses an EVM account contract; Nostr uses a raw secp256k1 keypair with no chain at all. This is the version with the best cost/benefit profile — you pay once (or zero, in Nostr's case), and you get portable identity.

2. **Follows onchain.** Every follow is a transaction. Lens v3 does this on Lens Chain. The math: at gas costs of even $0.001 per follow, a network with 10K users averaging 50 follows each is $500 in gas just to bootstrap the social graph — and that scales linearly with engagement. Most "onchain follows" implementations only persist the *root* of a follow set onchain, not each follow.

3. **Posts onchain.** Every cast/post is a transaction. Lens v2 stored hashes onchain and content offchain, and even that proved expensive enough that v3 moved to its own L2 specifically to make the economics work. At FRQNCY's price point, this is a non-starter.

4. **Reputation onchain.** A smart contract scores something — typically tips, token holdings, or attestations. EAS (Ethereum Attestation Service) is the closest thing to a reusable primitive. This is interesting but orthogonal to the "social graph" question.

5. **User-owned signing keys (the actual Farcaster model).** The version most people *mean* when they say "decentralized social." Identity is onchain (an FID, ~one-time cost), but every cast and follow is an Ed25519-signed message stored in offchain hubs. The chain is the identity ledger; everything else is signed records replicated peer-to-peer. This is what Farcaster is. ATProto is the same idea with different vocabulary (DID for identity, signed records in a PDS for everything else).

**Recommendation: pick #5.** Anything else is operationally untenable at FRQNCY's scale and budget. Identity-onchain plus user-owned signing keys gets you 90% of what people want from "decentralized social" — portability, censorship resistance, account ownership — without the gas economics that have killed every onchain-everything social network so far. If you wanted #2 or #3, the rest of this proposal would be a different document and the recommendation would be "don't."

## 2. Three credible architectures, compared

### A. Farcaster-native

Register an FID on Optimism, build NRG as a Farcaster client, store casts as protobuf messages signed by an Ed25519 signer key delegated from the user's custody wallet. Casts replicate to all hubs (or Snapchain nodes, post-Feb-2025). FRQNCY can run its own hub (~$1K/mo per the 2025 BlockEden numbers, way down from the 2022 $575K/yr projection) or read via Pinata or Neynar's hosted infrastructure. Frame mini-apps work natively, which is the only thing in the protocol space that actually feels like a 2026 product affordance — wallet-aware, in-feed, with `postMessage` plumbing.

The catch is reach. September 2025 DAU was ~60K, dropped to ~104K in July, fell below 20K MAU on the official client by late 2025, and in January 2026 Merkle Manufactory sold the Farcaster client and Clanker to Neynar as the founders pivoted to a wallet app. The protocol persists but the founding team's gravity has moved on. For FRQNCY's audience — conscious-living-curious people, not crypto-native traders — this is a network with the wrong demographics and possibly the wrong direction.

Costs: ~$5–10 per FID for users, though Warpcast's onboarding flow has covered this in the past. No infra cost for FRQNCY beyond a hub if we want to read directly. Lock-in is medium — FRQNCY's data is portable in principle, but the FRQNCY UX assumes Farcaster's social primitives and the brand association is hard to reverse.

### B. ATProto-native (the research paper's recommendation)

Register a DID (likely `did:plc`, possibly `did:web` for FRQNCY-hosted users), run a PDS that holds each user's signed repo as a Merkle tree of records, define `xyz.frqncy.*` Lexicon record types for FRQNCY-specific surfaces (resonance, practice, conviction-as-self-expression). Bluesky's AppView is the primary read surface; FRQNCY runs a custom AppView for FRQNCY-specific record types.

Reach: ~40M registered, 12–15M MAU, 4–4.5M DAU as of January 2026. That's ~100x Farcaster. The IETF standardization process started in January 2026, third-party PDS hosting is now commercial (Periwinkle launched at $4/mo in March 2026), and the conscious-living adjacency on Bluesky during the 2024–25 Twitter exodus is real and demographically closer to FRQNCY's persona than Farcaster's crypto-native base.

Costs: PDS hosting $4–15/mo, custom AppView ~$20/mo on Cloudflare Workers, Jetstream firehose consumption $0. Build effort is significant — Lexicon design plus AppView implementation plus dual-write migration is the bulk of the work.

Lock-in is low. Lexicon is open, FRQNCY can fork the AppView, and the PDS is portable by protocol design.

### C. Hybrid (Supabase + signed-message mirror)

Keep Supabase as source of truth — the existing schema, RLS, realtime fan-out, and search indexes don't change. But every post and follow is *also* signed (libsodium Ed25519, the same key material the messaging work is establishing) and exported to a private Cloudflare R2 bucket on a schedule, content-addressed by hash. Users own their keys (the same keys that decrypt their messages). If FRQNCY ever picks A or B, the export becomes the migration source. If FRQNCY never pivots, the export is a low-cost insurance policy.

This is not a real protocol. There's no globally-resolvable identifier, no peer can verify FRQNCY's records without trusting our endpoint, and no client outside FRQNCY can render the data. It's a *commitment device* — "we will not lock our users in" — backed by a working export, not a real federation surface.

Costs: ~$5/mo R2 storage at modest scale, ~80 hours engineering. Lock-in is zero — users always have a signed copy of their content keyed by a key they control.

## 3. Decision matrix

| Axis | A. Farcaster-native | B. ATProto-native | C. Hybrid (signed-mirror) |
|---|---|---|---|
| Time to ship working v1 | 8–12 weeks | 16–24 weeks | 4–6 weeks |
| Solo-dev feasibility (1=heroic, 5=easy) | 2 | 2 | 4 |
| Cost at FRQNCY scale (1=cheap, 5=expensive) | 3 ($10–30/mo hub) | 2 ($30–50/mo PDS+AppView) | 1 (~$5/mo R2) |
| Where is the audience? | Crypto-native, ~60K DAU | Conscious/news, ~4.5M DAU | N/A — this is local |
| Voice + cooperation-over-competition fit | Mixed (Farcaster channels + tipping culture skew toward visible-leaderboard dynamics; can be muted in client) | Strong (Bluesky's stackable moderation + custom feeds match the "algorithmic choice not algorithmic absence" thesis already in the research paper) | Native (we control the surface) |
| Reversibility | Low — public commitment, brand entanglement | Medium — Lexicon is portable, but AppView code is project-specific | High — we can stop writing the mirror tomorrow |
| Encryption story compatibility (libsodium) | Conflict — Farcaster casts are public-by-protocol, no DM Lexicon yet, the libsodium DM model would have to live offchain anyway | Clean — ATProto has no DM Lexicon yet either, but the libsodium DMs slot in as Supabase-only without violating any protocol rule | Native — same key material drives both |
| Frame mini-apps | Yes, native | No (closest: ATProto has no equivalent, custom feeds are read-only) | No |
| Wallet-as-identity UX cost | High — wallet onboarding is the auth path | Low — DIDs are server-managed by default; users never see a key unless they ask | None — keys are managed exactly as the messaging work specifies |

The one row that matters most for the 2026 decision is the encryption-compatibility row. The libsodium sealed-box messaging work is shipping in this session and is the most user-visible, most differentiating, and most reversibility-cheap thing on the social platform's roadmap. Anything that creates conflict with that work — which Farcaster does not directly, but the surrounding protocol commitments do — pays for itself in opportunity cost.

## 4. What "Farcaster-like" actually means in 2025–2026

It's worth being explicit about what's actually under the hood when people say "Farcaster" in conversation, because the gap between the brand and the protocol matters for the decision.

The protocol is real and well-engineered: FIDs on Optimism, Ed25519 signer keys delegated from custody wallets, EIP-712 for custody actions, Snapchain for cast replication, Frames v2 for in-feed mini-apps, channel-host moderation, Warpcast-mediated payments. None of that is vapor.

But the *network* is small (under 100K DAU), the founders left in January 2026, and the cultural center of gravity is crypto-native trading and meme economies. When most non-engineers say "I want a Farcaster-style platform," they mean: signed posts that are mine, a portable identity, frames as a UX primitive, and tipping built in. They usually don't mean "I want my users to onboard through a Coinbase Smart Wallet."

The "decentralized social" cultural moment of 2024–25 mostly landed on Bluesky/ATProto, not Farcaster. ATProto has the audience the research paper identified as adjacent to FRQNCY's. Farcaster has the better protocol affordances (frames, payments) but a smaller and more demographically-distant audience.

Be honest about the gap when describing this to anyone outside the operator pair. "Farcaster-style" as a *user-facing* description is mostly a vibe — signed, portable, mine. "Farcaster-native" as an *engineering* commitment is a specific protocol with specific tradeoffs.

## 5. The wallet-as-identity UX cost

This is the row in the matrix that's load-bearing for FRQNCY specifically.

The FRQNCY persona — conscious-living-first, lightly crypto-curious — does not, in the 2026 base case, have a wallet. The on-ramp from "I want to read about meditation" to "open Coinbase Wallet, connect, sign with your custody key, delegate a signer" is the steepest funnel in consumer onboarding. Every Farcaster client knows this and tries to flatten it (Warpcast's email + custodial fallback, Privy's embedded wallets, etc.), but the abstraction always leaks somewhere.

FRQNCY can survive that friction for a *secondary* surface — a "post this from NRG to your Farcaster" button is a perfectly good crypto-native side-channel, the same way the research paper recommends a Farcaster posting adapter alongside the ATProto primary. FRQNCY cannot survive that friction as the *primary* auth path. Email magic-link plus optional wallet-link is the right v1.

This single observation likely disqualifies architecture A as the primary path, even if everything else about Farcaster were stronger. It does not disqualify it as a secondary cross-post target.

## 6. Path forward — recommended sequence

### Phase 1 (now → end Q3 2026)

Keep Supabase as source of truth. Ship the libsodium E2EE messaging this session. Keep building NRG features against the existing schema. Phase 1 of the 90-day plan is already standing the social platform up; Phase 2 is rolling out FRQNCY OS. None of that requires a protocol commitment.

Do not pick a protocol in this window. Anyone telling you to pick one before the messaging is bedded in is selling something.

### Phase 2 (Q4 2026)

Implement the **hybrid (architecture C)**. Every post and follow gets a libsodium-signed mirror written to a private R2 bucket, content-addressed by hash, indexed by user public key. The user has a key (the same key established by the messaging work). If FRQNCY migrates later, this is the export. If not, the cost is ~$5/mo and ~80 engineering hours.

Two important design notes for the hybrid:

- The mirror is *not* publicly published. It's a private bucket with per-user signed access. This avoids any premature commitment to "FRQNCY content is on IPFS / public-by-default." If/when we go to ATProto, the export becomes the migration source. If/when we don't, no one is reading the bucket but us and the user.
- The signed records use a Lexicon-compatible JSON shape from day one — `xyz.frqncy.post`, `xyz.frqncy.follow` — so that if Phase 3 picks ATProto, the records *are* the migration. This is the cheapest forward-compat decision available; the schema work is half-done already in the research paper.

### Phase 3 (Q1–Q2 2027)

Pick ATProto OR Farcaster *based on three things you will know then but don't know now*:

- where FRQNCY's actual audience landed (if it skews crypto, Farcaster gets a second look; if it skews Bluesky/wellness, ATProto is the obvious call);
- how the protocol economics shake out (Farcaster's post-acquisition trajectory, ATProto's IETF standardization outcomes, Lens v3's audience numbers maturing);
- whether wallets become normal in the FRQNCY audience (likely no; if surprisingly yes, Farcaster gets another look).

Run the chosen protocol as a *parallel surface* first — "you can post from NRG to Bluesky" — for at least one full quarter before any consolidation conversation. Federation surfaces almost always perform worse than their operators expect; adding a surface is reversible, replacing the primary is not.

### Defer indefinitely

Posts onchain (cost-prohibitive at any scale FRQNCY will hit in 2027). Follows onchain (same; Lens v3 is the closest to making this work and it required a custom L2). Reputation onchain (interesting; orthogonal; revisit if EAS becomes ambient infrastructure).

## 7. What this proposal recommends *against*

- **Don't pivot to all-onchain in 2026.** The research paper reached this conclusion on 2026-04-18; nothing has changed in ten days that should change it. The ATProto recommendation in the paper still holds; the timing of *when* to act on it is the only open question, and the answer is not "now."
- **Don't ship Farcaster as the only login.** Wallet-only auth excludes most of FRQNCY's target audience. Ship email magic-link as primary; wallet-link as optional secondary; FID-acquisition as a third tier reserved for users who already have an FID and want to claim it.
- **Don't pick a protocol before shipping the libsodium messaging.** Encryption + protocol pivot in the same cycle is too much surface change for a solo founder. The messaging change is the bigger user-visible win and the cheaper-to-undo of the two; ship it first, alone.
- **Don't put NRG's editorial values inside someone else's moderation regime.** Bluesky's stackable Ozone labelers are good, but a FRQNCY user reading on Bluesky is reading FRQNCY content through Bluesky's filter stack. If that's acceptable as a federation surface, fine; if it's the *primary* read surface, the cooperation-over-competition values that distinguish FRQNCY have to survive Ozone's defaults, which is not a trivial integration.

## 8. Open questions for Orlando

- **Which "onchain" do you actually want?** (Identity / graph / content / reputation / signing keys.) The recommendation here is signing keys + onchain identity (the Farcaster/ATProto model), but if you wanted reputation onchain — for example, project-tier attestations from the 630-project corpus going onchain via EAS — that's a separate, smaller, much more interesting project.
- **Is the Farcaster audience aligned with FRQNCY's?** Crypto-native, mostly engineering/finance, with light overlap with conscious-living. The research paper assumed the answer was "no, but it's a good side-channel for the crypto pillar." Confirm this is still your read.
- **Does NRG remain a destination or become a federation surface?** The hybrid keeps NRG as destination with a portable export. ATProto-native consciously moves NRG toward "FRQNCY is one client among several." That's a strategic direction, not just an engineering one.
- **What's the wallet-as-identity threshold?** At what FRQNCY user count does it become viable as the primary auth? My guess: never, but ~25% of the user base having a wallet would change the calculus. We don't know that number today; we should instrument for it before we need to decide.
- **What's the budget envelope for protocol exploration?** PDS hosting, hub costs, FID acquisition, AppView hosting — what are you comfortable with as a 2027 line item? The 90-day plan operates on $100/quarter; Phase 3 should be planned against a different envelope or it can't actually happen.

## 9. Estimated effort and budget

| Item | Engineering effort | Monthly cost |
|---|---|---|
| Phase 2 hybrid (signed-message mirror to R2) | ~80 hrs | ~$5–20 |
| Phase 3 ATProto AppView (custom Lexicons + read paths + dual-write) | ~200–400 hrs | ~$30–50 |
| Phase 3 Farcaster client (FID flow + Snapchain hub or hosted read + frame surface) | ~120–200 hrs | ~$10–30 |
| Phase 3 cross-post adapter only (no full client) | ~30–50 hrs | ~$0–5 |

For comparison: the 90-day plan operates on ~$100/quarter total. Phase 3 lives on a different planning horizon and a different budget line, and that's fine — that's exactly what the Future Roadmap appendix in the execution plan is for. Add a line to it.

## 10. What to do this week

1. **Ship the libsodium sealed-box messaging.** That's the v1 design being drafted in this session and the most user-visible thing on the messaging roadmap. Don't gold-plate it for a future protocol pivot — the "use Ed25519 keys we control" assumption is forward-compatible enough already.
2. **Generate Ed25519 keys per user *as part of the messaging onboarding*** — not just for DMs, but for all signed records the user might emit later. This is the one structural decision the messaging work makes that locks Phase 2 in cheaply. The libsodium spec should establish: (a) one user Ed25519 keypair per account, (b) private key encrypted-at-rest with a passphrase-derived key, (c) public key stored in a `profile.public_key` column on Supabase. With those three, the Phase 2 hybrid is mostly write-the-export-job; without them, Phase 2 is "redo the key infrastructure first."
3. **Add an entry to the Future Roadmap appendix** in `EXECUTION-PLAN-90D.md`: "Phase 2 hybrid signed-mirror (Q4 2026)" and "Phase 3 protocol-surface decision (Q1–Q2 2027)." Don't commit to which protocol; commit to making the decision in that window with the data you'll have by then.
4. **Stop talking about NRG as "Farcaster-style" externally for now.** The "encrypted, user-owned, signed" framing is what Orlando actually wants and is what the libsodium work delivers. "Farcaster-style" sets an expectation about the protocol commitment that this roadmap explicitly defers. Use "user-owned" or "key-portable" in copy until the Phase 3 decision lands.

The research paper's call still holds: ATProto as primary bridge, Farcaster as secondary side-channel for the crypto pillar. This proposal is just the answer to "*when*" — and that answer is "after the messaging ships, after the hybrid is in place, and after we have the audience data we don't yet have." Anything faster than that buys protocol theater at the cost of the actual differentiating work. Anything slower than that lets the moment pass.

The single highest-leverage thing this week is making sure the libsodium key infrastructure is the foundation for *both* messaging (now) and signed records (later). Get that right and every future option in this document stays open for the cost of an export script.
