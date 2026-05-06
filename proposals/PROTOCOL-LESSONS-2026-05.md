---
title: Protocol lessons refresh + Ethos integration design (2026-05)
date: 2026-05-03
status: recommendation — no code yet, this is "should we" before "how we"
supersedes_partially: proposals/PROTOCOL-LESSONS-2026-04.md
related: proposals/NRG-ONCHAIN-PIVOT.md, proposals/HYBRID-SIGNED-MIRROR.md, proposals/ATPROTO-BRIDGE.md, proposals/BLUESKY-TIMELINE-READER.md
---

# Protocol lessons refresh + Ethos integration

## TL;DR

A year ago we surveyed Lens, Farcaster, and Ethos and chose to defer a
full protocol pivot to Q1–Q2 2027 (per `NRG-ONCHAIN-PIVOT.md`). Since
then: Lens shipped V3 + its own chain, Farcaster shipped Snapchain and
got acquired by Neynar, and Ethos went mainnet on Base with the four
primitives (review, vouch, slash, invite). Nostr stayed Nostr — slower
moving but the outbox model (NIP-65) matured.

Net assessment: the strategic call to stay on the AT-Protocol bridge
holds. Lens chose vertical integration (their own chain), Farcaster chose
their own consensus layer (Snapchain), Nostr chose to stay protocol-only.
NRG's federation surface — read-and-publish through Bluesky — is the
right shape for a content-first network.

The new piece worth integrating now is **Ethos invites** as a
voice-aligned reputation layer. Not the score (we'd never surface a
0–2800 number; that's a leaderboard with extra steps). Not slashing (it's
adversarial framing). The **invite** mechanism with a bonded-trust period
maps near-perfectly to FRQNCY's referral system, and the **review**
primitive — when used as "who has worked with whom" rather than ratings —
gives us a portable cooperative-history surface.

Recommendation: ship a thin Ethos read-only integration that surfaces
**vouches received** (not score) and **invite provenance** on the NRG
profile, and write a v0 spec for converting NRG referrals into Ethos
invites once a member has connected an Ethereum address. No score
surface. No slash UI. Defer Lens/Nostr/Farcaster bridges until Q1 2027
per the existing deferral.

---

## What's actually new since the April pass

### Lens — V3 + Lens Chain

Lens migrated from Polygon to its own ZK-rollup ("Lens Chain") in April
2025, moving 650K profiles in one of the largest L2 migrations to date.
The protocol got rebuilt around modular primitives (Accounts, Usernames,
Graphs, Feeds, Groups, Rules, Actions). Account abstraction, gasless
transactions, USD gas fees, email/phone onboarding.

**The strategic shift to notice:** Lens stopped trying to be portable
across chains and started trying to own the substrate. That's a viable
strategy if you believe the chain itself is the network effect — but it's
the opposite of where ATProto and Nostr are pointing. Lens is now closer
to a Web2 platform with crypto-native primitives than to a federated
protocol.

**Implication for NRG:** the "modular primitives" surface (Accounts /
Graphs / Feeds / Rules / Actions) is good vocabulary even if we're not
integrating the chain. Our `posts` + `follows` + `conversations` + RLS
rules already correspond to a less-formalised version of the same
shape. If we ever do build a portable schema layer (likely 2027) the
Lens vocabulary is the cleanest reference.

### Farcaster — Snapchain + Neynar acquisition

Farcaster replaced its CRDT-based hub system with **Snapchain** (April
2025), a blockchain-like consensus layer using Malachite BFT. 10K+ TPS,
sub-second finality, account-level sharding. Then in **January 2026
Neynar acquired the protocol** and Merkle Manufactory repaid roughly
$180M in venture funding.

**The strategic shift to notice:** Farcaster went the other way from
Lens — they kept the off-chain identity (FIDs aren't tokens) but added
a consensus layer to remove "are my replies actually there" worry. The
acquisition matters: Neynar was already the de facto Farcaster API, and
now they own the protocol too. That's a centralised-API risk for anyone
betting on Farcaster as a neutral substrate.

**Implication for NRG:** Farcaster integration via Neynar's API is a
straightforward HTTP read at `api.neynar.com`. **But** building anything
substantial on it now means betting on Neynar-as-good-steward. That's
not a no — Neynar has been the de facto API for two years and hasn't
abused that — but it's a different risk shape than Bluesky's (where the
AppView and the AT-Protocol are owned by separate orgs).

### Nostr — outbox model matured (NIP-65)

Nostr added almost nothing flashy — and that's the point. The big
maturity step was **NIP-65 (relay list metadata)**, which lets users
declare "publish my notes to these write relays, send mentions of me to
these read relays". Clients can stop guessing and use that to build
efficient routing without hitting hundreds of relays.

**The strategic shift to notice:** Nostr is treating the network as
literally just relays + signed events + an extensibility ladder (NIPs).
That matches the "trace-as-memory" thesis in the harness — the protocol
is just an envelope, the meaning lives in what you do with the events.

**Implication for NRG:** our **hybrid signed-message mirror** (`posts` +
`follows` with Ed25519 signatures over canonical JSON, exported via
`/api/export`) is two steps from being Nostr-postable. The kinds we'd
need are kind:1 (text note) and kind:30000-style replaceable
(generic-replaceable for follows). A **Nostr publish bridge** as a
mirror of the Bluesky one would cost less than the Bluesky bridge cost
because we already have signed events. Filing this as a 2026-Q3
candidate.

### Ethos — mainnet on Base

Ethos shipped Jan 2025 on Base, designed around four primitives:

- **Review** — write a positive/neutral/negative review of someone
  you've interacted with, attached to your identity (not anonymous).
  Reviews from higher-scored users carry more weight; low-effort
  reviewers lose review power.
- **Vouch** — stake ETH on someone. The stake is yours (they don't
  control it), but it can be slashed if you vouched for someone who
  later acts unethically. Diminishing returns prevent whale capture.
- **Slash** — accuse someone of unethical behaviour. 48-hour community
  vote, accuser locks a deposit, gets it back if they're vindicated,
  loses it if not.
- **Invite** — invite-only network. **90-day bonding period** where the
  inviter earns (or absorbs) 20% of the invitee's reputation delta.
  Forces careful inviting.

Score is 0–2800, six tiers, everyone starts at 1200. Public API at
`api.ethos.network` with OpenAPI docs and reasonable rate limiting.
Auth via Privy (which we already use!).

---

## The Ethos primitive that matters: invites with bonded trust

**Skip:** the score, slashing, vouching with ETH-at-risk. All three
collapse into "rank people on a number" or "punitive enforcement",
neither of which lives well in FRQNCY's voice.

**Lift:** invites with bonded reputation. This is the same mechanism
NRG already uses (`ref_codes` + `ref_signups`, migration 013) but with
a critical addition: **the inviter is publicly accountable for who they
bring in**.

The way it'd map:

1. NRG referral codes already exist. What's missing is the back-pressure
   that makes the inviter feel the invitee's behaviour.
2. The Ethos contract on Base already has the bonded-invite primitive
   built-in. If a NRG member connects an Ethereum address (via Privy
   embedded wallet — already wired!), they could optionally **upgrade**
   their NRG referral to an Ethos invite. The 90-day bonded period
   begins on accept; the existing NRG referral counter still ticks.
3. The "founder badge" we ship at 25 invites becomes more meaningful if
   the inviter has actual reputation skin in the game on Ethos. Not the
   inverse — Ethos doesn't replace the founder badge; the founder badge
   is the FRQNCY-native acknowledgement, Ethos is the optional
   externally-attested layer.

This is opt-in and additive. A FRQNCY member who never touches Ethos
loses nothing. A FRQNCY member who has a reputation-conscious presence
already (a writer with a Substack, a DJ, a researcher) gets to bring
that history with them.

## What we'd surface from Ethos (the read side)

Ethos's API gives us cheap public reads. The right surface inside NRG:

1. **"Vouches received" on the profile identity card** — but as a
   neutral list, not a sum. Same shape as the existing wallet /
   encryption / signing surface: "12 vouches received on Ethos ↗" with
   a click-through to `app.ethos.network/profile/<id>`. No score.
2. **"Invited by" on the profile** — already meaningful (we have the
   inviter's NRG handle from `ref_signups`). If both sides have an
   Ethos identity, link the invite to the on-chain bonded relationship
   for posterity. Voice: "Joined via @username · bonded on Ethos ↗".
3. **A small ◊ "Ethos verified" badge on PostCard** — appears next to
   the existing `◊ verified` Ed25519 signature badge when the author
   has any Ethos profile (regardless of score). Treats Ethos identity
   as a binary "this person also exists on a public reputation layer",
   not a quality signal.

Crucially: **never sort by Ethos score, never filter by it, never
threshold on it.** We're surfacing the existence of attestations, not
turning attestations into a ranking surface.

## What NRG should NOT lift from any of these

- **Lens Chain or any per-protocol token.** A token would invert the
  cooperation-over-competition gradient overnight. The only payment
  surface in NRG is the membership Stripe flow + course purchases, and
  that's where it stays.
- **Farcaster Frames inside NRG.** Frames are great for Farcaster — they
  are a tiny app inside a cast — but they create a "what's hot on
  Frames" pull that re-introduces engagement-bait dynamics. NRG already
  has cross-post via the bridge; that's the right amount of porosity.
- **Snapchain-style consensus for our content.** We don't need 10K TPS.
  Our throughput ceiling is "every member posts daily" which is
  vanishingly small compared to even one Snapchain shard. Postgres + a
  signed-message mirror is the right substrate for the next 18 months.
- **Ethos slashing.** No accuser-pays-deposit governance surface. If
  someone behaves badly on NRG we have moderation; we don't need a
  47-jurisdiction onchain dispute system.
- **Ethos score.** Repeated for emphasis. We will never display a number
  next to a person's name in NRG. The day we do is the day NRG is no
  longer FRQNCY.

## Honest pushback on what to do less of

Two observations from the research that aren't fun to say but are true:

**1. The ATProto bridge has been the cleanest call we've made.**
Bluesky's federation model — public AppView, no required auth for
reads, signed records, public DIDs — is the most "internet-shaped" of
the four protocols. Lens's pivot to its own chain and Farcaster's
acquisition both reduce the pluralism of those ecosystems. Bluesky
remains the one we should keep deepening. Specifically: the v1.2
reply-count surface we just shipped is the right kind of work to keep
doing. The v1.3 candidates (image embeds, OAuth+DPoP, cursor pagination)
should jump the queue ahead of any new-protocol bridge work.

**2. Don't build the Farcaster bridge yet.** It would feel like progress
because Farcaster is the highest-mindshare crypto-social network. But
(a) it depends on Neynar's continued goodwill post-acquisition, (b)
adding a Frames surface to NRG would import the engagement-loop
dynamics we explicitly walked away from, and (c) we'd be building three
bridges (Bluesky, Farcaster, Lens) before any of them have proven a
durable user pull. Stick to one bridge done well. The Farcaster
connection-panel placeholder on `/social/profile/connections/` should be
relabelled "coming Q3 2026" rather than implemented.

## Concrete next moves (proposed)

In rough priority order. Each is small enough to ship in a session:

1. **Ethos read-only profile surface.** Add `ethos_profile_id` (text
   nullable) on `profiles` (migration 018). Build
   `social-src/src/lib/ethos-bridge.ts` calling
   `api.ethos.network` for vouches + invite count + profile existence.
   Surface in `EthosPanel.tsx` on the profile identity card. No score
   surfacing.
2. **"Ethos verified" badge in PostCard.** Mirrors the existing `◊
   verified` Ed25519 badge. Cached at module level, lazy-fetched.
3. **Convert-to-Ethos-invite affordance** on the existing `/membership/`
   referral surface. "Optionally bond this referral on Ethos →" link
   that walks the user through the on-chain transaction (uses existing
   Privy embedded wallet). The NRG ref code still works as today; the
   Ethos bond is an extra layer.
4. **NIP-65 study + Nostr publish bridge spec.** Not implementation — a
   spec proposal documenting how our existing signed-message mirror
   would map onto kind:1 + kind:3 events. File alongside the existing
   `HYBRID-SIGNED-MIRROR.md`.
5. **Relabel the Farcaster + Lens connection rows** on
   `/social/profile/connections/` from "coming soon" to "deferred to Q3
   2026" with a brief paragraph explaining why (the Q1 2027 pivot
   window in NRG-ONCHAIN-PIVOT.md is the right trigger, not earlier).

## Risks I want flagged before any of this ships

- **Privy + Ethos auth alignment.** Ethos uses Privy tokens for
  authenticated endpoints. We're already a Privy app. The question is
  whether our app's Privy token is acceptable to Ethos's API or whether
  we need to register separately. Needs a 30-min spike before step 1.
- **Ethos score visibility on third-party profile pages.** If a user
  links to an Ethos profile from NRG, the destination page will show a
  score. We can't prevent that. The right framing is "we're linking out
  to a reputation surface that has its own conventions" — same way we
  link out to Bluesky knowing bsky.app shows like counts. Worth a
  one-line disclosure on the EthosPanel.
- **Bonded invite economics.** If we do step 3, members are taking on a
  90-day reputational risk for each invite. That's the right thing for
  some power-inviters and the wrong thing for casual ones. The UI must
  be loud about the trade-off; defaulting to off; explaining the
  bonding period.

## Why this still respects the deferral in NRG-ONCHAIN-PIVOT.md

`NRG-ONCHAIN-PIVOT.md` defers a *protocol* pivot to Q1–Q2 2027 — i.e.
when our content layer is portable to ATProto/Nostr/Farcaster as a
substrate. That's still the right window.

What this proposal adds is a *reputation* surface that's independent of
which protocol our content lives on. Ethos sits on top of any protocol;
it's a separate trust layer. Adding it now doesn't pull the protocol
deadline forward; it makes the eventual portability more meaningful by
giving members an attested cross-protocol identity to bring with them.

---

## Sources (May 2026 refresh)

- Lens V3 + Lens Chain: <https://lens.xyz/news/introducing-the-new-lens>
- Lens migration write-up: <https://lens.xyz/news/migrating-the-lens-ecosystem-to-lens-chain>
- Snapchain: <https://github.com/farcasterxyz/snapchain> + <https://www.theblock.co/post/347606/decentralized-social-media-protocol-farcaster-launches-blockchain-like-data-layer-snapchain>
- Farcaster 2025 protocol paradox: <https://blockeden.xyz/blog/2025/10/28/farcaster-in-2025-the-protocol-paradox/>
- Lens vs Farcaster strategy comparison: <https://blockeden.xyz/blog/2026/01/15/decentralized-socialfi-farcaster-lens-protocol-web3-social-graph/>
- Neynar API: <https://docs.neynar.com/>
- NIP-65 outbox model: <https://nips.nostr.com/65> + <https://nostrify.dev/relay/outbox>
- Ethos overview: <https://whitepaper.ethos.network/>
- Ethos invite mechanism: <https://whitepaper.ethos.network/ethos-mechanisms/invite>
- Ethos vouch mechanism: <https://whitepaper.ethos.network/ethos-mechanisms/vouch>
- Ethos developer API: <https://developers.ethos.network/>
