---
section: "Decentralized Protocols"
author: research-agent-1
date: 2026-04-18
---

# Decentralized Social Protocols — What to bridge to, and how

## 1. The landscape in April 2026

Five protocols matter if you're building a social layer with any aspiration toward decentralization: Farcaster, Nostr, AT Protocol (Bluesky), Lens, and ActivityPub/Mastodon. They do not agree on what "decentralized" means, and the differences are load-bearing for product decisions. This section compares them on the axes that a solo dev actually has to reason about: data model, identity, signing, relay/hub/indexer architecture, current usage, developer ergonomics, infra cost, moderation, and failure modes. A recommendation follows.

### Farcaster

Farcaster is a "sufficiently decentralized" protocol whose identity layer is on-chain (Optimism L2) and whose content layer, since February 2025, lives on a purpose-built chain called Snapchain. Identity is an FID — an integer registered via the Id Registry contract on Optimism, owned by an Ethereum custody address. Posting is done with Ed25519 signer keys enrolled in a Key Registry contract, which means your wallet signs a delegation once and the app holds a hot key thereafter. Messages are EIP-712 signed for custody actions, Ed25519 for casts [source: https://docs.farcaster.xyz/reference/contracts/reference/key-registry]. Snapchain nodes (the renamed "hubs") replicate the full cast graph; Neynar-style indexers sit on top and expose it as HTTP/GraphQL to app clients. Snapchain reduced hub operating cost dramatically — under $1,000/month per node in 2026 versus the $575K/node/year the 2022 growth projections anticipated [source: https://blockeden.xyz/blog/2025/10/28/farcaster-in-2025-the-protocol-paradox/].

Current usage: September 2025 DAU was ~60K, down from a July 2025 peak of ~104K; late-2025 MAU fell below 20K on the official client [source: https://blockeden.xyz/blog/2025/10/28/farcaster-in-2025-the-protocol-paradox/]. In January 2026 Merkle Manufactory sold the Farcaster client and Clanker to Neynar as the founders pivoted to a wallet app, which is a non-trivial governance signal [source: https://www.theblock.co/post/386549/haun-backed-neynar-acquires-farcaster-after-founders-pivot-to-wallet-app]. Developer ergonomics are excellent — Neynar, Pinata, and Airstack all ship mature SDKs, and Frames v2 (rebranded to "Mini Apps") gives you an in-feed runtime with wallet access and `postMessage` plumbing [source: https://framesv2.com/]. Moderation is channel-host based plus per-client mute lists; governance on channels was reformed in 2025 with multi-host support [source: https://paragraph.com/@clauswilke/farcaster-channel-moderation]. Follow graphs, likes (reactions), and recasts are all first-class message types in Snapchain. Killer use case: crypto-native mini-apps with payments, token-gated channels, on-chain attestations. Failure mode: the network is small, the founders left, and the user economics depend on a $2/year storage fee the average non-crypto user will balk at.

### Nostr

Nostr is the simplest protocol on this list — a client-side Schnorr key pair over secp256k1 is your identity (npub = public, nsec = private), and any signed JSON event gets gossiped to whatever relays you and your followers subscribe to [source: https://learnnostr.org/modules/module-02-keys-identity]. There is no chain, no shared state beyond what relays voluntarily store, and no canonical event ordering. Events are kinds: kind 0 = profile, kind 1 = text note, kind 3 = contact list (follows), kind 7 = reaction. Relays are dumb stores that accept events matching their policy; a client publishes to N relays and queries M. NIP-05 gives you a human-readable handle (`name@domain.com`) verified by a static JSON file. NIP-65 (outbox model) tells clients which relays to read/write for a given pubkey — this is the de-facto federation layer [source: https://nips.nostr.com/65].

Usage is hard to pin down because the measurement is adversarial — stats.nostr.band showed ~3,675 DAU against ~21K profiled users as of October 2025, and a broader Manifold-tracked consensus is ~17K DAU flat for most of 2025 [source: https://www.glukhov.org/post/2025/10/nostr-overview-and-statistics/]. Total pubkeys observed hit 33M in August 2024 but the vast majority are empty or bot-generated. Developer ergonomics are "unix philosophy good" — every spec fits on a page, but there's no GraphQL, no rich indexer, no SDK that removes the relay-fanout logic for you. You write it. Cost to run: a relay is a single Go or Rust binary on a $5 VPS; most public relays cost <$50/month to operate. Moderation is per-relay — relays ban at will — plus client-side mute lists and, experimentally, NIP-56 reports. Follow graph is kind 3, a list of pubkeys replaced on each update (inefficient at scale). Killer use case: censorship resistance, Bitcoin Lightning "zap" payments (Lightning adoption grew ~82% YoY in 2025 per Voltage), anonymous or pseudonymous publishing [source: https://voltage.cloud/blog/the-growth-of-nostr-the-era-of-decentralization]. Failure modes: no account recovery (lose nsec = lose identity), relay policy fragmentation, and a UX floor that has kept normies out for three years running.

### AT Protocol (Bluesky)

ATProto separates three services: the PDS (Personal Data Server, hosts a user's signed repo as a Merkle tree of records), the Relay (formerly "BGS", crawls all PDSes and emits a firehose), and App Views (consume the firehose, build indexed views of posts/follows/likes) [source: https://docs.bsky.app/docs/advanced-guides/federation-architecture]. Identity is a DID — either `did:plc` (a centralized but auditable ledger run by Bluesky) or `did:web` (self-hosted via a `/.well-known` file). Handles are DNS-verified domains that resolve to a DID. Signing is secp256k1 on every repo commit. Portability is the selling point: you can migrate your PDS to a new host without losing followers or posts because your DID document is updatable and your repo is content-addressed [source: https://atproto.com/guides/identity].

Usage: ~40M registered accounts, 12–15M MAU, 4–4.5M DAU as of January 2026 — a 25–30% DAU/MAU ratio that beats every other decentralized protocol by an order of magnitude [source: https://backlinko.com/bluesky-statistics]. In December 2025 Bluesky shipped `tap` (reference Sync 1.1 consumer) and entered IETF standardization for the core specs [source: https://atproto.com/blog/2026-spring-roadmap]. Dev ergonomics are very good — official TypeScript SDK, rich Lexicon schema system, lots of tutorials. Self-hosting a PDS is ~$4/month on a VPS; Periwinkle launched managed PDS hosting at $4/month in March 2026 for non-technical users [source: https://techcrunch.com/2026/03/09/periwinkle-at-protocol-bluesky-self-hosted-social-media/]. The catch: running a *relay* (full firehose) costs roughly $150K/year in compute and most apps just consume Bluesky's. Moderation is the stackable Ozone system — anyone can run a labeling service, users subscribe to labelers the way they follow accounts, and the App View stacks those labels at render time [source: https://bsky.social/about/blog/03-12-2024-stackable-moderation]. Killer use cases: Twitter-replacement, news, community-run moderation. Failure mode: Bluesky PBC runs the only production relay, the only production App View, and most DIDs live on did:plc — "federated-ready, but centralized in practice" is a fair description for 2026.

### Lens Protocol

Lens v3 moved off Polygon onto its own L2 (Lens Chain, a ZKsync + Avail rollup) in April 2025, migrating 650K profiles [source: https://lens.xyz/news/introducing-the-new-lens]. Identity is now an Account smart contract keyed to an EVM address (no more profile NFTs). Social primitives are modular on-chain contracts: Accounts, Usernames, Graphs, Feeds, Groups, Rules, Actions [source: https://lens.xyz/docs/protocol]. Every follow, post, and collect is (optionally) an on-chain event; content usually lives in Grove/Storage Nodes with a hash on chain. A GraphQL API plus TypeScript SDK with React hooks sits over the chain; the SDK is the best-in-class of any protocol here for developer experience [source: https://github.com/lens-protocol/lens-sdk].

Usage: Lens does not publish DAU/MAU and the public proxies (Hey, Orb) never broke out meaningful numbers — MAU is widely estimated in the low tens of thousands, smaller than Farcaster [source: https://blockeden.xyz/blog/2026/01/15/decentralized-socialfi-farcaster-lens-protocol-web3-social-graph/]. Infra cost to run: you don't run a node, you pay gas on Lens Chain (USD-denominated, account-abstracted), which is cheap but non-zero per write. Moderation is per-app — Lens itself is permissionless, each frontend filters. Killer use case: creator monetization via on-chain "collects," modular rule engines, SocialFi. Failure mode: network effects are thin, there's no breakout consumer client, and the on-chain-everything thesis imposes UX friction that pure-off-chain rivals don't have.

### ActivityPub / Mastodon

ActivityPub is a W3C-standardized server-to-server protocol using signed HTTP (HTTP Signatures) to deliver JSON-LD activities (Create, Follow, Like, Announce). Identity is `@user@domain.example` — a domain-scoped handle; moving servers is possible but lossy (followers migrate, post history does not). The social graph is per-instance, federated by subscription. Usage: ~1–1.5M MAU across Mastodon in 2025–26, 10–15M registered accounts, thousands of active instances [source: https://expandedramblings.com/index.php/mastodon-statistics-facts/]. Dev ergonomics: well-documented, but "dev ergonomics" mostly means "write a Rails/Elixir server that speaks ActivityPub" — not a great fit for a solo dev with a Preact SPA. Cost to run: a Mastodon server at ~1K users costs ~$30–$100/month. Moderation is instance-admin driven, with shared blocklists. Killer use case: topic- or values-based communities, news orgs, fediverse-native journalism. Failure mode: post portability is unsolved, growth is anemic, and it has no crypto primitives at all — not even hypothetically.

### Comparison at a glance

| Protocol | DAU (Apr 2026) | Identity | Portability | Crypto-native | Self-host cost | SDK quality |
|---|---|---|---|---|---|---|
| Farcaster | ~60K | FID on Optimism | Yes | High | $1K/mo node | Excellent (Neynar) |
| Nostr | ~15–20K | secp256k1 keypair | Native | Medium (Lightning) | <$50/mo relay | Low-level only |
| AT Protocol | ~4.5M | DID + handle | Yes (design) | None | $4/mo PDS | Excellent |
| Lens v3 | ~low 10K's | EVM account contract | Yes | Very high | Gas only | Excellent |
| ActivityPub | ~700K | user@domain | Partial | None | $30–100/mo | Ecosystem-specific |

## 2. The recommendation: AT Protocol as primary bridge, Farcaster as secondary

For FRQNCY — a solo-dev, crypto-adjacent consumer social product already on Supabase — the right target is **AT Protocol (Bluesky) as the primary bridge, with a lightweight Farcaster side-channel for crypto-native surfaces**. The reasoning is deliberately pragmatic.

First, user reach: ATProto has ~100x the DAU of Farcaster or Nostr in 2026, and the gap is widening, not shrinking. For a "conscious-living network" whose moat is content and community, bridging to a network that is near-empty (Farcaster, Nostr) is a harder cold-start problem than importing onto a network that already has the audience you want. Conscious-living and wellness communities have demonstrably migrated from Twitter to Bluesky during the 2024–25 exodus, which is adjacent to FRQNCY's target persona.

Second, architectural fit: ATProto's PDS = "personal Supabase" is not a metaphor — it's almost literal. A PDS holds signed records (posts, follows, likes) indexed by a Lexicon schema; Supabase holds rows indexed by a Postgres schema. The migration path is "write each Supabase table to a Lexicon namespace and sign it with the user's DID key." No other protocol in this list has that clean a structural analogue. Nostr events are too unstructured, Lens records are constrained by EVM gas, Farcaster messages are protobuf-locked, ActivityPub activities are semantically loose.

Third, solo-dev economics: Periwinkle ($4/mo managed PDS) plus Bluesky's public relay plus a custom App View you run on a $20/mo Cloudflare Worker is a defensible infra bill under $100/mo for the first ~10K users. Farcaster hub at $1K/mo is 10x that and serves a smaller audience.

Fourth, crypto-adjacency: ATProto has no crypto primitives, but it has no anti-crypto primitives either. Records are arbitrary JSON under a Lexicon; you can post a Lexicon record that encodes an Ethereum attestation or a wallet-signed claim. The crypto-native requirement lives in what you *put in* records, not in the protocol itself. That's more flexible than Farcaster's FID-on-Optimism lock-in. To serve the 630 crypto projects from the main site, you also keep a Farcaster posting adapter — cross-post wellness-plus-crypto content to Farcaster channels like /wellness or /mindfulness where the audience already skews crypto-curious.

Fifth, optionality: ATProto's Lexicon system means *you can define your own record types* (`xyz.frqncy.resonance`, `xyz.frqncy.practice`) that are globally interoperable. If the ecosystem consolidates on ATProto, you're in. If it bifurcates, you can bridge a Lexicon record to a Farcaster cast or a Nostr event with a thin server-side adapter. Building *on* ATProto does not preclude bridging *to* other protocols later; building on Farcaster or Lens largely does.

The one argument against ATProto — that Bluesky PBC is still the center of gravity and technically the network is "federated-ready" rather than federated — is real but mitigable. The IETF standardization process started in Jan 2026, third-party PDS hosting is now commercial (Periwinkle), and the DID document is portable by design. The risk is that Bluesky captures value the way Mastodon.social captures Mastodon's — but you can insulate against that by hosting your own PDS and your own App View from day one.

## 3. Migration playbook: Supabase MVP → AT Protocol

The guiding principle is **dual-write, then dual-read, then cut over**. Your Supabase remains the source of truth through the entire transition; the protocol side is a shadow that gradually becomes authoritative.

**What belongs where.** On the PDS (signed, public, portable): profile records, posts (`app.bsky.feed.post` or custom `xyz.frqncy.resonance`), follows, likes, reposts, lists. Off-chain in Supabase (private or heavy): auth state, email/phone, private DMs (until the DM Lexicon matures), onboarding funnels, analytics, search indexes, the 604 resources + 133 topics corpus that is FRQNCY's content moat (this is *your* data, not the user's). On Cloudflare R2 or IPFS: blobs (audio, images, video) referenced by CID from PDS records. On-chain (optional, Farcaster side-channel only): tip receipts, token-gated access proofs, attestations to crypto projects from the 630-project ratings corpus.

**Identity migration.** Today a FRQNCY user signs in with email/magic-link through Supabase Auth. In phase 1 you create a `did:web` for every user lazily — `did:web:frqncy.com:users:<uuid>` — hosted via a `/.well-known/did.json` endpoint that FRQNCY's web server serves. You hold the signing keys server-side in Supabase Vault. Users don't know this exists. In phase 2 you offer "claim your DID" — the user can export their private key and migrate to `did:plc` or self-host a PDS; Periwinkle is the documented default. In phase 3 you stop being the custodian for new signups and just offer managed PDS as a tier. Follows translate cleanly (follow record has a subject DID). Handles: every FRQNCY user's default handle is `username.frqncy.social` (the existing /social/ subdomain), which you serve as TXT records or via `/.well-known/atproto-did`.

**What breaks.** Exact-ID links will change (Supabase UUID → DID), so any external links need a permanent redirect table. Private posts do not exist in the default ATProto Lexicon and will stay Supabase-only until you either ship a custom private Lexicon with E2EE or wait for the protocol to add one. Full-text search is not a protocol primitive — you keep running your own Postgres FTS or Meilisearch against the firehose you also consume. Rate limiting and anti-spam shift from "Supabase RLS policies" to "PDS-side validation + App View filtering + Ozone labelers." Real-time fan-out changes from Supabase Realtime (websockets to Postgres) to ATProto firehose (websocket from your Relay subscription). The UX should not change; the wiring behind it does.

**Migration steps in order:**

1. Define Lexicon schemas for FRQNCY's core record types (`xyz.frqncy.post`, `xyz.frqncy.resonance`, `xyz.frqncy.practice`).
2. Stand up an in-house PDS serving `*.frqncy.social` handles for the existing user base; lazily create DIDs on first login.
3. Dual-write: every Supabase insert on `posts`, `follows`, `likes` also writes the corresponding record to the user's PDS and signs with their server-held key.
4. Dual-read: add an ATProto-backed feed path behind a feature flag; compare parity with the Supabase path.
5. Consume the Bluesky firehose via Jetstream and a custom App View to mix FRQNCY content with public Bluesky content where the user has opted in.
6. Offer "claim your keys / export your PDS" as a user setting; hand out the private key.
7. Cut over — Supabase becomes the cache/index, PDS becomes source of truth for portable data.

## 4. Roadmap

**Phase 1 (today → 6 months): centralized-with-portable-bones.** Keep the Supabase + Astro + Preact stack exactly as it is. Add three things: (a) a Lexicon spec repo at `github.com/frqncy/lexicons` defining `xyz.frqncy.*` record types; (b) a server-side DID issuer that creates `did:web` identities lazily per user and stores signing keys in Supabase Vault; (c) a nightly Supabase→signed-JSON exporter so every user can download their repo today, even if nothing else is bridged yet. Concrete deliverables: Lexicon v0.1, DID issuer service, export-my-data endpoint, one end-to-end test showing a FRQNCY post round-tripping through a local PDS.

**Phase 2 (6 → 12 months): dual-write federation.** Stand up a production PDS for `*.frqncy.social`, dual-write posts/follows/likes, consume the Bluesky firehose via Jetstream, run a custom App View on Cloudflare Workers + D1 or a small Postgres. Ship cross-posting to Bluesky (one-click) and to Farcaster (via Neynar SDK) for power users. Add Ozone-style labeling for the FRQNCY community (your own labeler subscribed to by default in-app). Deliverables: production PDS, App View with firehose ingest, Bluesky cross-post, Farcaster cross-post, in-house Ozone labeler, Periwinkle-style "export your PDS" UI.

**Phase 3 (12 → 24+ months): protocol-native, platform-optional.** Flip the source of truth: PDS records are canonical, Supabase demotes to index/cache. Let users bring their own DID (migrate in from a Bluesky account or another PDS host). Publish FRQNCY's Lexicons to the ATProto Lexicon registry so other apps can consume `xyz.frqncy.resonance` records. Build a Farcaster Mini App wrapper for the 630-crypto-projects rating UI so the crypto-adjacent surface lives where crypto users already are. Evaluate Nostr bridging for the Bitcoin/Lightning-maxi edge of the audience — probably a one-way bridge (FRQNCY posts → kind 1 notes) until Nostr signer UX improves. Deliverables: canonical-PDS cutover, BYO-DID import, public Lexicon registry, Farcaster Mini App, Nostr read-bridge.

Net: in 24 months FRQNCY is an ATProto-native app with a Farcaster surface for crypto content and a Nostr read-path, which is the cheapest, widest-reach, most-optional decentralization posture available to a solo dev as of April 2026. It bets on the network that already has the users, keeps the crypto-native hooks your audience expects, and never puts you in a position where the protocol's failure mode is your product's failure mode.

---

## References

- [Farcaster in 2025: The Protocol Paradox (BlockEden, Oct 2025)](https://blockeden.xyz/blog/2025/10/28/farcaster-in-2025-the-protocol-paradox/)
- [Farcaster vs Lens: The $2.4B Battle for Web3's Social Graph (BlockEden, Jan 2026)](https://blockeden.xyz/blog/2026/01/15/decentralized-socialfi-farcaster-lens-protocol-web3-social-graph/)
- [Snapchain FIP Discussion (farcasterxyz/protocol #207)](https://github.com/farcasterxyz/protocol/discussions/207)
- [Farcaster Key Registry docs](https://docs.farcaster.xyz/reference/contracts/reference/key-registry)
- [Farcaster Frames v2 / Mini Apps](https://framesv2.com/)
- [Haun-backed Neynar acquires Farcaster (The Block, Jan 2026)](https://www.theblock.co/post/386549/haun-backed-neynar-acquires-farcaster-after-founders-pivot-to-wallet-app)
- [Farcaster channel moderation redesign (Paragraph)](https://paragraph.com/@clauswilke/farcaster-channel-moderation)
- [Nostr NIP-65 Relay List Metadata](https://nips.nostr.com/65)
- [Nostr overview and statistics (Glukhov, Oct 2025)](https://www.glukhov.org/post/2025/10/nostr-overview-and-statistics/)
- [LearnNostr: Keys & Identity](https://learnnostr.org/modules/module-02-keys-identity)
- [The Growth of Nostr (Voltage Blog)](https://voltage.cloud/blog/the-growth-of-nostr-the-era-of-decentralization)
- [Bluesky AT Protocol Federation Architecture](https://docs.bsky.app/docs/advanced-guides/federation-architecture)
- [AT Protocol Identity guide](https://atproto.com/guides/identity)
- [AT Protocol Spring 2026 Roadmap](https://atproto.com/blog/2026-spring-roadmap)
- [Bluesky Statistics (Backlinko, 2026)](https://backlinko.com/bluesky-statistics)
- [Bluesky MAU January 2026 (Skyscraper)](https://getskyscraper.com/blog/bluesky-mau-monthly-active-users-january-2026)
- [Periwinkle managed PDS hosting launch (TechCrunch, March 2026)](https://techcrunch.com/2026/03/09/periwinkle-at-protocol-bluesky-self-hosted-social-media/)
- [Bluesky Ozone moderation architecture](https://bsky.social/about/blog/03-12-2024-stackable-moderation)
- [did:plc method spec](https://web.plc.directory/spec/v0.1/did-plc)
- [Introducing the New Lens (Lens.xyz)](https://lens.xyz/news/introducing-the-new-lens)
- [Lens Social Protocol docs](https://lens.xyz/docs/protocol)
- [Lens SDK (GitHub)](https://github.com/lens-protocol/lens-sdk)
- [Mastodon Statistics 2026 (Expanded Ramblings)](https://expandedramblings.com/index.php/mastodon-statistics-facts/)
- [The Fediverse in Numbers 2026 (Fediview)](https://fediview.com/articles/fediverse-in-numbers-mastodon-stats-2026/)
- [ActivityPub protocol (Mastodon docs)](https://docs.joinmastodon.org/spec/activitypub/)
