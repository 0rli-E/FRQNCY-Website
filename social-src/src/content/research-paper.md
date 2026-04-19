---
title: "Building FRQNCY Social — A Research Paper on the Best Social Media Platform for a Conscious-Living, Crypto-Adjacent Community"
subtitle: "From Supabase MVP to a Farcaster/Nostr-Grade Protocol-Native Network"
authors:
  - research-agent-1 (Decentralized Protocols)
  - research-agent-2 (Feed Ranking & Social Graph)
  - research-agent-3 (Monetization, Moderation, Community Health)
date: 2026-04-18
version: 1.0
status: "Founding thesis — informs the 24-month roadmap for FRQNCY Social"
---

# Building FRQNCY Social

A research paper on the architecture, ranking, economics, and governance of a social network for a conscious-living and crypto-adjacent community. Target outcome: a product that begins as a centralized MVP on Supabase + Astro + Preact, and evolves over 24 months into a protocol-native network — Farcaster- or Nostr-grade in decentralization, but retaining the retention, discovery, and economic primitives that keep people returning to a centralized product.

---

## Executive Summary

FRQNCY Social's ultimate destination — a decentralized, portable, user-owned network — is not the same project as FRQNCY Social's MVP. Treating them as the same project is how solo-dev consumer social products die. This paper argues for a staged thesis: ship a centralized network that is clearly usable today, with a protocol substrate that makes migration to AT Protocol (primary) and Farcaster (secondary crypto surface) mechanical rather than heroic.

Three threads run through the paper, each corresponding to one of the following chapters:

1. **Protocol choice.** Of the five protocols that matter (Farcaster, Nostr, AT Protocol, Lens, ActivityPub), **AT Protocol is the right primary bridge target**, with a Farcaster side-channel for crypto-native surfaces. This is a pragmatic call — ATProto has ~4.5M DAU to Farcaster's ~60K, its PDS architecture is a near-literal analogue of the Supabase schema FRQNCY already runs, and its Lexicon system allows FRQNCY to define `xyz.frqncy.*` record types that stay globally interoperable if the ecosystem consolidates. A concrete dual-write migration playbook takes the network from today's Supabase to ATProto-canonical over three phases.

2. **Feed ranking and social graph.** Every ad-funded platform's ranking history is a cautionary tale; every non-ranked platform's retention curve is a different cautionary tale. FRQNCY should launch with a **chronological-anchored, follow-graph-primary feed** with a transparent re-ranker adding quality, conviction, and interest tilts — closer to Bluesky's architecture than Twitter's or Mastodon's. A concrete scoring formula is proposed, including a **conviction-accuracy boost** (scored via Brier) that FRQNCY can own in a way no incumbent can copy without rebuilding around project-anchored content. The reputation system is a *vector* — Social, Conviction, Debate — not a scalar karma number. Graceful-degradation rules cover the cold start at n=3, n=10, n=100, and n=10,000 users.

3. **Monetization, moderation, community health.** No ads, ever. The model is **freemium — free core product, a $5/mo Supporter tier, Stripe Connect creator tipping, a 1–2% protocol fee on conviction markets once live, and a small one-time NFT Founding Member mint**. Conviction markets ship as **points-only (v1)** — legally uninteresting, ethically clean, and sufficient to run the leaderboard — with a staked v2 gated behind legal review and (likely) a regulated intermediary. Moderation scales from founder-only at 100 users to a Llama Guard 3 + Discourse trust-levels + community mods stack at 10K, backed by a blameless incident-response playbook. Legal exposure is manageable at solo-dev scale if real-money markets are deferred and the EU DSA + Section 230 expectations are built in from day one.

The through-line tying these together: **FRQNCY's differentiation is not a platform choice, it is the combination of (a) a project-anchored social graph built on top of the existing 630-project rating corpus, (b) Brier-scored conviction calibration as the headline reputation mechanic, and (c) a freemium monetization posture whose economics survive at <10K users without ads.** The protocol choice exists to make that differentiation portable and durable; the ranking choice exists to make it visible on every visit; the monetization choice exists to keep it unpolluted by the attention-extraction flywheel that ruined every incumbent.

## Table of Contents

- [Executive Summary](#executive-summary)
- [Chapter 1 — Decentralized Protocols: What to bridge to, and how](#chapter-1--decentralized-protocols)
- [Chapter 2 — Feed Ranking, Social Graph, and Retention](#chapter-2--feed-ranking-social-graph-and-retention)
- [Chapter 3 — Monetization, Moderation, Community Health](#chapter-3--monetization-moderation-community-health)
- [Unified 24-Month Roadmap](#unified-24-month-roadmap)
- [Consolidated References](#consolidated-references)
- [Appendix A — Glossary](#appendix-a--glossary)

---

# Chapter 1 — Decentralized Protocols

*Primary author: research-agent-1*

## 1.1 The landscape in April 2026

Five protocols matter if you're building a social layer with any aspiration toward decentralization: Farcaster, Nostr, AT Protocol (Bluesky), Lens, and ActivityPub/Mastodon. They do not agree on what "decentralized" means, and the differences are load-bearing for product decisions. This section compares them on the axes that a solo dev actually has to reason about: data model, identity, signing, relay/hub/indexer architecture, current usage, developer ergonomics, infra cost, moderation, and failure modes. A recommendation follows.

### Farcaster

Farcaster is a "sufficiently decentralized" protocol whose identity layer is on-chain (Optimism L2) and whose content layer, since February 2025, lives on a purpose-built chain called Snapchain. Identity is an FID — an integer registered via the Id Registry contract on Optimism, owned by an Ethereum custody address. Posting is done with Ed25519 signer keys enrolled in a Key Registry contract, which means your wallet signs a delegation once and the app holds a hot key thereafter. Messages are EIP-712 signed for custody actions, Ed25519 for casts [[Farcaster Key Registry docs](https://docs.farcaster.xyz/reference/contracts/reference/key-registry)]. Snapchain nodes (the renamed "hubs") replicate the full cast graph; Neynar-style indexers sit on top and expose it as HTTP/GraphQL to app clients. Snapchain reduced hub operating cost dramatically — under $1,000/month per node in 2026 versus the $575K/node/year the 2022 growth projections anticipated [[BlockEden, Oct 2025](https://blockeden.xyz/blog/2025/10/28/farcaster-in-2025-the-protocol-paradox/)].

Current usage: September 2025 DAU was ~60K, down from a July 2025 peak of ~104K; late-2025 MAU fell below 20K on the official client. In January 2026 Merkle Manufactory sold the Farcaster client and Clanker to Neynar as the founders pivoted to a wallet app, which is a non-trivial governance signal [[The Block, Jan 2026](https://www.theblock.co/post/386549/haun-backed-neynar-acquires-farcaster-after-founders-pivot-to-wallet-app)]. Developer ergonomics are excellent — Neynar, Pinata, and Airstack all ship mature SDKs, and Frames v2 (rebranded to "Mini Apps") gives you an in-feed runtime with wallet access and `postMessage` plumbing [[Frames v2](https://framesv2.com/)]. Moderation is channel-host based plus per-client mute lists; governance on channels was reformed in 2025 with multi-host support. Follow graphs, likes (reactions), and recasts are all first-class message types in Snapchain. Killer use case: crypto-native mini-apps with payments, token-gated channels, on-chain attestations. Failure mode: the network is small, the founders left, and the user economics depend on a $2/year storage fee the average non-crypto user will balk at.

### Nostr

Nostr is the simplest protocol on this list — a client-side Schnorr key pair over secp256k1 is your identity (npub = public, nsec = private), and any signed JSON event gets gossiped to whatever relays you and your followers subscribe to [[LearnNostr: Keys & Identity](https://learnnostr.org/modules/module-02-keys-identity)]. There is no chain, no shared state beyond what relays voluntarily store, and no canonical event ordering. Events are kinds: kind 0 = profile, kind 1 = text note, kind 3 = contact list (follows), kind 7 = reaction. Relays are dumb stores that accept events matching their policy; a client publishes to N relays and queries M. NIP-05 gives you a human-readable handle (`name@domain.com`) verified by a static JSON file. NIP-65 (outbox model) tells clients which relays to read/write for a given pubkey — this is the de-facto federation layer [[NIP-65](https://nips.nostr.com/65)].

Usage is hard to pin down because the measurement is adversarial — stats.nostr.band showed ~3,675 DAU against ~21K profiled users as of October 2025, and a broader Manifold-tracked consensus is ~17K DAU flat for most of 2025 [[Glukhov, Oct 2025](https://www.glukhov.org/post/2025/10/nostr-overview-and-statistics/)]. Total pubkeys observed hit 33M in August 2024 but the vast majority are empty or bot-generated. Developer ergonomics are "unix philosophy good" — every spec fits on a page, but there's no GraphQL, no rich indexer, no SDK that removes the relay-fanout logic for you. You write it. Cost to run: a relay is a single Go or Rust binary on a $5 VPS; most public relays cost <$50/month to operate. Moderation is per-relay — relays ban at will — plus client-side mute lists and, experimentally, NIP-56 reports. Follow graph is kind 3, a list of pubkeys replaced on each update (inefficient at scale). Killer use case: censorship resistance, Bitcoin Lightning "zap" payments (Lightning adoption grew ~82% YoY in 2025 per Voltage), anonymous or pseudonymous publishing. Failure modes: no account recovery (lose nsec = lose identity), relay policy fragmentation, and a UX floor that has kept normies out for three years running.

### AT Protocol (Bluesky)

ATProto separates three services: the PDS (Personal Data Server, hosts a user's signed repo as a Merkle tree of records), the Relay (formerly "BGS", crawls all PDSes and emits a firehose), and App Views (consume the firehose, build indexed views of posts/follows/likes) [[Federation Architecture](https://docs.bsky.app/docs/advanced-guides/federation-architecture)]. Identity is a DID — either `did:plc` (a centralized but auditable ledger run by Bluesky) or `did:web` (self-hosted via a `/.well-known` file). Handles are DNS-verified domains that resolve to a DID. Signing is secp256k1 on every repo commit. Portability is the selling point: you can migrate your PDS to a new host without losing followers or posts because your DID document is updatable and your repo is content-addressed [[AT Protocol Identity](https://atproto.com/guides/identity)].

Usage: ~40M registered accounts, 12–15M MAU, 4–4.5M DAU as of January 2026 — a 25–30% DAU/MAU ratio that beats every other decentralized protocol by an order of magnitude [[Backlinko, 2026](https://backlinko.com/bluesky-statistics)]. In December 2025 Bluesky shipped `tap` (reference Sync 1.1 consumer) and entered IETF standardization for the core specs [[ATProto Spring 2026 Roadmap](https://atproto.com/blog/2026-spring-roadmap)]. Dev ergonomics are very good — official TypeScript SDK, rich Lexicon schema system, lots of tutorials. Self-hosting a PDS is ~$4/month on a VPS; Periwinkle launched managed PDS hosting at $4/month in March 2026 for non-technical users [[TechCrunch, March 2026](https://techcrunch.com/2026/03/09/periwinkle-at-protocol-bluesky-self-hosted-social-media/)]. The catch: running a *relay* (full firehose) costs roughly $150K/year in compute and most apps just consume Bluesky's. Moderation is the stackable Ozone system — anyone can run a labeling service, users subscribe to labelers the way they follow accounts, and the App View stacks those labels at render time [[Stackable Moderation, Bluesky](https://bsky.social/about/blog/03-12-2024-stackable-moderation)]. Killer use cases: Twitter-replacement, news, community-run moderation. Failure mode: Bluesky PBC runs the only production relay, the only production App View, and most DIDs live on did:plc — "federated-ready, but centralized in practice" is a fair description for 2026.

### Lens Protocol

Lens v3 moved off Polygon onto its own L2 (Lens Chain, a ZKsync + Avail rollup) in April 2025, migrating 650K profiles [[Introducing the New Lens](https://lens.xyz/news/introducing-the-new-lens)]. Identity is now an Account smart contract keyed to an EVM address (no more profile NFTs). Social primitives are modular on-chain contracts: Accounts, Usernames, Graphs, Feeds, Groups, Rules, Actions [[Lens Social Protocol docs](https://lens.xyz/docs/protocol)]. Every follow, post, and collect is (optionally) an on-chain event; content usually lives in Grove/Storage Nodes with a hash on chain. A GraphQL API plus TypeScript SDK with React hooks sits over the chain; the SDK is the best-in-class of any protocol here for developer experience [[Lens SDK](https://github.com/lens-protocol/lens-sdk)].

Usage: Lens does not publish DAU/MAU and the public proxies (Hey, Orb) never broke out meaningful numbers — MAU is widely estimated in the low tens of thousands, smaller than Farcaster. Infra cost to run: you don't run a node, you pay gas on Lens Chain (USD-denominated, account-abstracted), which is cheap but non-zero per write. Moderation is per-app — Lens itself is permissionless, each frontend filters. Killer use case: creator monetization via on-chain "collects," modular rule engines, SocialFi. Failure mode: network effects are thin, there's no breakout consumer client, and the on-chain-everything thesis imposes UX friction that pure-off-chain rivals don't have.

### ActivityPub / Mastodon

ActivityPub is a W3C-standardized server-to-server protocol using signed HTTP (HTTP Signatures) to deliver JSON-LD activities (Create, Follow, Like, Announce). Identity is `@user@domain.example` — a domain-scoped handle; moving servers is possible but lossy (followers migrate, post history does not). The social graph is per-instance, federated by subscription. Usage: ~1–1.5M MAU across Mastodon in 2025–26, 10–15M registered accounts, thousands of active instances [[Expanded Ramblings, 2026](https://expandedramblings.com/index.php/mastodon-statistics-facts/)]. Dev ergonomics: well-documented, but "dev ergonomics" mostly means "write a Rails/Elixir server that speaks ActivityPub" — not a great fit for a solo dev with a Preact SPA. Cost to run: a Mastodon server at ~1K users costs ~$30–$100/month. Moderation is instance-admin driven, with shared blocklists. Killer use case: topic- or values-based communities, news orgs, fediverse-native journalism. Failure mode: post portability is unsolved, growth is anemic, and it has no crypto primitives at all — not even hypothetically.

### Comparison at a glance

| Protocol | DAU (Apr 2026) | Identity | Portability | Crypto-native | Self-host cost | SDK quality |
|---|---|---|---|---|---|---|
| Farcaster | ~60K | FID on Optimism | Yes | High | $1K/mo node | Excellent (Neynar) |
| Nostr | ~15–20K | secp256k1 keypair | Native | Medium (Lightning) | <$50/mo relay | Low-level only |
| AT Protocol | ~4.5M | DID + handle | Yes (design) | None | $4/mo PDS | Excellent |
| Lens v3 | ~low 10K's | EVM account contract | Yes | Very high | Gas only | Excellent |
| ActivityPub | ~700K | user@domain | Partial | None | $30–100/mo | Ecosystem-specific |

## 1.2 The recommendation: AT Protocol as primary bridge, Farcaster as secondary

For FRQNCY — a solo-dev, crypto-adjacent consumer social product already on Supabase — the right target is **AT Protocol (Bluesky) as the primary bridge, with a lightweight Farcaster side-channel for crypto-native surfaces**. The reasoning is deliberately pragmatic.

First, user reach: ATProto has ~100x the DAU of Farcaster or Nostr in 2026, and the gap is widening, not shrinking. For a "conscious-living network" whose moat is content and community, bridging to a network that is near-empty (Farcaster, Nostr) is a harder cold-start problem than importing onto a network that already has the audience you want. Conscious-living and wellness communities have demonstrably migrated from Twitter to Bluesky during the 2024–25 exodus, which is adjacent to FRQNCY's target persona.

Second, architectural fit: ATProto's PDS = "personal Supabase" is not a metaphor — it's almost literal. A PDS holds signed records (posts, follows, likes) indexed by a Lexicon schema; Supabase holds rows indexed by a Postgres schema. The migration path is "write each Supabase table to a Lexicon namespace and sign it with the user's DID key." No other protocol in this list has that clean a structural analogue. Nostr events are too unstructured, Lens records are constrained by EVM gas, Farcaster messages are protobuf-locked, ActivityPub activities are semantically loose.

Third, solo-dev economics: Periwinkle ($4/mo managed PDS) plus Bluesky's public relay plus a custom App View you run on a $20/mo Cloudflare Worker is a defensible infra bill under $100/mo for the first ~10K users. Farcaster hub at $1K/mo is 10x that and serves a smaller audience.

Fourth, crypto-adjacency: ATProto has no crypto primitives, but it has no anti-crypto primitives either. Records are arbitrary JSON under a Lexicon; you can post a Lexicon record that encodes an Ethereum attestation or a wallet-signed claim. The crypto-native requirement lives in what you *put in* records, not in the protocol itself. That's more flexible than Farcaster's FID-on-Optimism lock-in. To serve the 630 crypto projects from the main site, you also keep a Farcaster posting adapter — cross-post wellness-plus-crypto content to Farcaster channels like /wellness or /mindfulness where the audience already skews crypto-curious.

Fifth, optionality: ATProto's Lexicon system means *you can define your own record types* (`xyz.frqncy.resonance`, `xyz.frqncy.practice`) that are globally interoperable. If the ecosystem consolidates on ATProto, you're in. If it bifurcates, you can bridge a Lexicon record to a Farcaster cast or a Nostr event with a thin server-side adapter. Building *on* ATProto does not preclude bridging *to* other protocols later; building on Farcaster or Lens largely does.

The one argument against ATProto — that Bluesky PBC is still the center of gravity and technically the network is "federated-ready" rather than federated — is real but mitigable. The IETF standardization process started in Jan 2026, third-party PDS hosting is now commercial (Periwinkle), and the DID document is portable by design. The risk is that Bluesky captures value the way Mastodon.social captures Mastodon's — but you can insulate against that by hosting your own PDS and your own App View from day one.

## 1.3 Migration playbook: Supabase MVP → AT Protocol

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

---

# Chapter 2 — Feed Ranking, Social Graph, and Retention

*Primary author: research-agent-2*

## 2.1 What actually makes social networks retain users

Retention in social products is not, despite a decade of executive cant, a function of "engagement." It is a function of perceived signal-to-noise on each return visit. The user opens the app, samples the first three to seven items, and makes a sub-second decision about whether the session was worth it. Every major platform's ranking history is a record of trying to maximize the probability that those first items feel non-random and non-stale.

**Twitter / X.** The "For You" timeline, partially open-sourced in March 2023, runs a three-stage funnel: candidate sourcing reduces ~500M daily tweets to ~1,500 per user, the Heavy Ranker (a 48M-parameter parallel MaskNet) scores those candidates, and a heuristics layer filters and diversifies before presentation [[Twitter Engineering](https://blog.x.com/engineering/en_us/topics/open-source/2023/twitter-recommendation-algorithm)]. The Heavy Ranker outputs probabilities for ~10 engagement events; the published weights are revealing — `reply` is weighted 13.5, `reply_engaged_by_author` 75.0, `like` 0.5, and `report` -369.0 [[the-algorithm-ml](https://github.com/twitter/the-algorithm-ml/blob/main/projects/home/recap/README.md)]. The system is explicitly biased toward conversation and away from passive consumption. Where it fails: the candidate-source split (about 50% in-network, 50% out-of-network) regularly surfaces strangers' posts that have nothing to do with the user's social graph, producing the now-canonical "why am I seeing this" complaint [[Solomon MG](https://solomonmg.github.io/post/twitter-the-algorithm/)]. The Following timeline still exists but is hidden behind a tab; usage data Twitter will not publish strongly suggests it is a minority experience.

**Facebook EdgeRank and after.** The original EdgeRank (2010) scored each "edge" (post) as `affinity * weight * time_decay` — three terms, easy to reason about [[EdgeRank, Wikipedia](https://en.wikipedia.org/wiki/EdgeRank)]. By 2013 Facebook was using >100,000 features, and the algorithm became a black box. The 2018 "Meaningful Social Interactions" pivot weighted comments and shares from friends and family far above passive likes and Page content. Internal documents later leaked via the Facebook Files showed this change measurably increased outrage content because comments-per-impression was highest on divisive posts — a textbook Goodhart failure. The lesson FRQNCY must internalize: any single-objective ranking signal will be gamed, and "comments" is the most dangerous of all because it correlates with controversy.

**TikTok / Monolith.** TikTok's recommender (Monolith, ByteDance, 2022) is an interest-graph system, not a follow-graph system. It uses collisionless Cuckoo-hash embedding tables and online training that updates on user feedback within seconds [[Monolith paper](https://arxiv.org/pdf/2209.07663)]. The follow graph is almost decorative. This works because TikTok has billions of (user, video) interactions per day; the embedding table can densely cover interest space. It does not work for a network of 1,000 people. Retention here comes from raw novelty velocity, not social meaning, and the well-documented attentional cost is the entire reason FRQNCY's positioning exists.

**Reddit.** Reddit ships three sorts that each solve a different problem. *Hot* uses `score = log10(max(|U-D|,1)) * sign(U-D) + (T - 1134028003) / 45000`, where the log of net votes is added to a linear time term — old posts decay because the time term keeps shrinking relative to new posts [[Hacking & Gonzo](https://medium.com/hacking-and-gonzo/how-hacker-news-ranking-algorithm-works-1d9b0cf2c08d)]. *Best* (for comments) uses the Wilson lower-bound on the upvote ratio, which correctly penalizes small samples: a comment with 3/3 upvotes ranks below one with 280/300 because we are uncertain about the true rate [[Evan Miller](https://www.evanmiller.org/how-not-to-sort-by-average-rating.html)]. *Top* is the trivial baseline. The genius of Reddit is offering all three with a visible toggle — algorithmic choice avoided by every ad-funded platform.

**Hacker News.** `score = (P - 1) / (T + 2)^G`, gravity G = 1.8 [[righto.com](http://www.righto.com/2013/11/how-hacker-news-ranking-really-works.html)]. Because votes are linear and time is super-linear, every post eventually reaches zero. This is a feature: HN's front page turns over completely in ~24 hours, which is exactly what makes it worth re-checking.

**Instagram.** The 2022 Reels pivot — explicitly a competitive response to TikTok — caused a 50% reach decline for non-Reels posts in 2023 and provoked the "Make Instagram Instagram Again" backlash from Kardashian and others. The platform now weights `sends-via-DM` as the heaviest distribution signal — a private-share signal as proxy for genuine value. The lesson: bookmark and DM-share are stronger quality signals than likes.

**Mastodon.** Strict reverse chronological. The 2025 CSCW study of Mastodon users (Liu et al.) found that 8 of 11 participants liked chronological order for transparency but most also wanted "lightweight, transparent" algorithmic surfacing of missed posts — the absence of any ranking is itself a usability failure once a user follows >100 accounts [[Liu et al., 2025](https://arxiv.org/html/2504.18817)]. Mastodon's flat retention curve outside the Twitter-exodus spikes is the empirical proof.

**Bluesky.** The most useful precedent for FRQNCY. Built on AT Protocol, Bluesky separates identity, data, and ranking into independent layers and exposes a marketplace of "custom feeds" — community-built algorithms users can install [[Bluesky Custom Feeds](https://bsky.social/about/blog/7-27-2023-custom-feeds)]. By 2026 the platform reached >25M users with no algorithmic lock-in and is now experimenting with AI-generated personal feeds via Attie [[TechCrunch, March 2026](https://techcrunch.com/2026/03/28/bluesky-leans-into-ai-with-attie-an-app-for-building-custom-feeds/)]. Algorithmic *choice*, not algorithmic *absence*, is the actual answer.

## 2.2 The tradeoff matrix and where FRQNCY should live

Three orthogonal axes:

1. **Chronological ↔ Algorithmic.** Pure chronological breaks above ~100 follows. Pure algorithmic destroys author–reader relationships and makes the network feel like a TV channel.
2. **Follower-graph ↔ Interest-graph.** Follower graphs scale poorly for discovery and reward early-mover network effects. Interest graphs require dense interaction data FRQNCY will not have for years.
3. **Engagement-optimized ↔ Time-well-spent.** Optimizing comments-per-impression breeds outrage (Facebook 2018). Optimizing dwell time breeds infinite-scroll dissociation (TikTok). Optimizing for *return visits with positive recall* is harder to instrument but is the only objective that aligns with FRQNCY's brand.

Given FRQNCY's positioning — a small, conscious-living + crypto-projects community of likely <10K users in year one — the answer is: **lean chronological, follow-graph primary, with a thin algorithmic layer for re-ranking and a separate "Discover" surface for interest-graph exploration.** Concretely, the home feed should be a re-ranked recency-weighted follow feed with conviction-quality and novelty boosts; the Discover tab should run a lighter interest-match scorer over the project tag space. This mirrors Bluesky's split (Following + Discover + custom feeds) which is the only architecture that has demonstrably scaled small-community social without collapsing into either spam or quietude.

## 2.3 A concrete feed ranking scheme for FRQNCY MVP

Given the existing schema (`posts`, `follows`, `likes`, `bookmarks`, `comments`, `project_tag`, `project_tier`, `karma`), here is the proposed score for each candidate post `p` for viewer `u`:

```
Score(u, p) = w_R · R(p) + w_G · G(u, p) + w_Q · Q(p) + w_C · C(p, author) + w_I · I(u, p) - Penalties(p)
```

Each term defined:

**Recency** `R(p) = 1 / (1 + (T_now - T_post)/τ)^g`. This is the Hacker News form with τ = 6 hours and g = 1.5. After 6 hours score is halved; after 24 hours it is ~0.18. Tunable per surface (Discover gets τ = 48h).

**Graph proximity** `G(u, p) = α · 1[u follows author] + β · mutuals(u, author)/k + γ · co_engagement(u, author)`. With α = 1.0, β = 0.3, γ = 0.2, k = 5 (mutual follow count saturates at 5). `co_engagement` is the Jaccard similarity of which posts u and the author have both liked or bookmarked over the last 30 days — a cheap second-order signal.

**Quality** `Q(p) = log10(max(L(p) + 3·B(p) + 5·C(p), 1)) · WilsonLB(positive_signals, total_views, 0.95)`. We weight bookmarks 3x likes and comments 5x likes — bookmarks are the strongest implicit-value signal (Instagram's own data agrees), and comments are the strongest explicit-engagement signal but must be capped by the Wilson lower bound to avoid rewarding controversy. Until we have view counts, fall back to `total_signals = L + B + C` as the denominator proxy.

**Conviction-accuracy boost** `C(p, author)` — the FRQNCY-specific term. Defined only when the post has a `project_tag` and the author has a non-empty conviction history:

```
C(p, author) = κ(author, project_tier) · log(1 + n_author_calls)
```

where `κ(author, tier)` is the author's calibrated accuracy on prior calls within that project tier (definition in §2.4). The `log` factor prevents prolific-but-wrong posters from dominating. **Critical degradation rule:** if `n_author_calls < 3`, set `C = 0` and rely on the other terms. Conviction is a re-ranking *bonus*, never a gate.

**Interest match** `I(u, p) = cos(v_u, v_p)` where `v_u` is the user's project-tag affinity vector (built from their likes, bookmarks, follows, and the projects they have themselves posted about) and `v_p` is a one-hot or TF-IDF vector over the post's tags. Until embeddings are worth building, this can literally be the count of project tags the user has previously interacted with that also appear on `p`, normalized to [0,1].

**Penalties.** Self-vote subtraction (already in HN form). `-50` for any post the user has already seen (decays after 6h so re-surfacing is possible). `-10 · n_recent_posts_by_author_in_feed` to enforce author diversity. `-∞` for posts the user has muted, hidden, or whose author they have blocked.

**Suggested weights for MVP** (will be tuned via offline replay once we have ~10K interactions): `w_R = 1.0, w_G = 1.5, w_Q = 0.8, w_C = 0.6, w_I = 0.4`. Graph dominates; recency anchors; quality and conviction are tilts; interest is a tiebreaker.

**Graceful degradation.** When `n_users < 100`, set `w_G = 0.5` (most users won't follow many others yet) and `w_R = 2.0` (recency carries the feed). When conviction data is sparse (vast majority of posts have no `project_tag`), the `w_C` term simply contributes 0 and the other four terms span the full ranking. When the user is brand new (no follows, no likes), `G` and `I` collapse to 0 and we serve the global Wilson-Best feed scoped to high-tier projects — Reddit's r/all but quality-gated.

## 2.4 The differentiators FRQNCY must own

The three things no other platform does well: **project-anchored posts**, **conviction tracking**, **thesis debates**. The reputation system must reward calibrated calls and good-faith disagreement, not volume.

**Extending karma into a calibrated reputation vector.** Replace the scalar `karma` field with a struct stored alongside (kept as derived materialized view, refreshed nightly):

```
profile.karma_v2 = {
  social: float,        // legacy karma (likes + comments received)
  conviction: float,    // calibration score on project calls
  debate: float,        // good-faith debate score
  n_calls_resolved: int,
  brier: float          // mean Brier score across resolved calls
}
```

**Conviction score.** When a user posts about a project with an explicit directional claim (`bullish` / `bearish` with a probability `q ∈ [0,1]` and a horizon `h`), record it. When the horizon resolves, score the call with the **Brier score** `BS = (q - o)^2` where `o ∈ {0, 1}` is the realized outcome. Lower is better; perfect call is 0, max-wrong is 1, uninformed `q = 0.5` gives 0.25 [[Brier score](https://en.wikipedia.org/wiki/Brier_score)]. The user's `conviction` score is:

```
conviction(u) = (1 - mean_Brier(u)) · log(1 + n_calls_resolved(u))
```

The `log` prevents grinding; the `(1 - BS)` mapping puts an uninformed forecaster at 0.75 baseline and a perfect forecaster at 1.0. For comparison: Metaculus reports an aggregate community Brier of 0.111; Polymarket sits at 0.187. A FRQNCY user with mean Brier 0.20 and 25 resolved calls earns conviction = (0.80) · log(26) ≈ 2.6; a user with 5 calls at the same accuracy earns 1.4. The differential is real but not crushing.

**Debate score.** Reward the rare and underprovided behavior of good-faith disagreement. For any reply that (a) replies to a post tagged with the *opposite* directional claim, (b) cites a source URL or links a counter-thesis, and (c) is itself liked or bookmarked by users *who agree with the original poster's direction*, increment debate score. The third condition is the key — it requires cross-tribe upvoting, which is the closest behavioral proxy for "this changed my mind." A simple form:

```
debate(u) = Σ_replies r in u's_history { 1[has_source(r)] · (likes_from_opposite_camp(r) / max(total_likes(r), 1)) }
```

**Composite display.** The user's profile shows three orbs, not one number: Social, Conviction (with n and Brier), Debate. Feed ranking can use any weighted combination; my suggestion is `w_C` in the feed formula equals `conviction(author) / 10`, capped at 1.0.

**Anti-gaming.** Two bright lines. (1) Calls cannot be edited or deleted after timestamp + 1 hour; the call ledger is immutable thereafter. (2) Self-resolved calls (where the author also creates the resolution) require a second user to confirm. These are the minimum integrity guarantees; without them the conviction system is theater.

## 2.5 Cold start

**With 3 users.** There is no feed to rank; there is a chat. Build a single shared room called something like "The Core" for the founding members, ship a /now page that shows the last 20 posts globally in pure reverse chrono, and abandon all ranking. The product at n=3 is a group chat with profiles. Andrew Chen's classic observation applies: the only way to solve the cold start for social products at this scale is to identify a hyper-connected pre-existing network and convert it wholesale [[Andrew Chen](https://andrewchen.com/how-to-solve-the-cold-start-problem-for-social-products/)]. For FRQNCY that network is the existing 133-topic / 604-resource readership and the founder's direct contacts in the conscious-crypto space.

**With 10 users.** Still no algorithmic feed. Introduce three seeded "rooms" anchored to the highest-tier projects in the existing 630-project database. Each room shows reverse-chrono posts plus the project's resource sidebar. The feed formula's `w_G` and `w_C` are zero; only `R` and `I` (where `I` here means "is this room's tag in the post") matter. Use editorial seeding aggressively — the founder posts a daily thesis to give other users something to react to. This is how Reddit (Steve Huffman's sockpuppets), Quora (Adam D'Angelo's hand-recruited experts), and Product Hunt (Ryan Hoover's email blast) all began.

**With 100 users.** The full formula activates with the small-network weighting (`w_G = 0.5, w_R = 2.0`). Conviction tracking turns on for project-tagged posts but `w_C` stays at 0.3 until ~50 calls have resolved. Add a "What you missed" daily-digest email — a conscious-network analog of Hacker News' Best-of-Week — that uses the `Q(p)` term over a 7-day window, scoped to the user's followed authors and tag overlap. Email digests are the most underrated retention mechanic for small communities; they convert the network's quietness from a bug into a calmness signal.

The deepest cold-start lesson is that, at small scale, *editorial* and *ritual* outperform any algorithm. A weekly pinned thesis-debate prompt, a Friday "calls coming due" digest, and a quarterly conviction leaderboard generate more meaningful return visits than any reweighting of `w_G`. The algorithm exists to keep working when ritual stops scaling — not to substitute for it.

---

# Chapter 3 — Monetization, Moderation, Community Health

*Primary author: research-agent-3*

FRQNCY Social launches as a solo-dev project grafted onto an existing static site that already rates 630 crypto projects A–F. The social layer runs on Supabase + Astro + Preact, costs $0 at launch and roughly $50/mo at 10,000 users. Those numbers shape every decision in this chapter: any monetization scheme must clear the infrastructure floor without corroding the "conscious living" product, and any moderation system must survive the absence of a trust-and-safety team. What follows is a survey of what actually works at this scale, a concrete mechanism design for the conviction-market feature, a tiered moderation plan, a crypto-specific trust-and-safety posture, and the legal landmines a US-based solo dev faces in April 2026.

## 3.1 Monetization without selling out

### The landscape, with real numbers

**Subscriptions** are the least intrusive model and the most predictable cash flow. Discord's global ARPU is about $3.47, with Nitro contributing roughly $280M in 2025 and paid subscriptions accounting for nearly 54% of Discord revenue [[Sacra — Discord](https://sacra.com/c/discord/)]. X Premium remains opaque, but independent estimates put subscription revenue at 10–15% of X's $2.5B 2024 total — nowhere near replacing ads [[Business of Apps — Twitter](https://www.businessofapps.com/data/twitter-statistics/)]. The lesson: subscriptions work as a supplement, rarely as a sole engine, and ARPU rarely exceeds $3–5/month for general-purpose social.

**Creator tipping** has the cleanest economics for a values-driven product. Ko-fi charges 0% platform fee on one-time tips (Stripe/PayPal still take ~2.9% + $0.30); Buy Me a Coffee takes 5% on top of payment processing [[Talks.co](https://talks.co/p/kofi-vs-buy-me-a-coffee/)]. Farcaster has normalized $DEGEN tips as a native interaction primitive, and Warpcast distributes $25K+/week in USDC via creator pools. Farcaster Pro launched May 2025 at $120/year and sold its first 10,000 subscriptions in under six hours — $1.2M in six hours, 100% redistributed to creators. Tipping generates low absolute revenue per platform, but the emotional flywheel is powerful and aligns with a conscious-living brand.

**Ads** would kill FRQNCY. The entire thesis of a conscious-living network is attention that heals rather than extracts. Ad-supported platforms optimize for time-on-site and outrage engagement; the cost of switching on ads at 10K users would be a measurable loss of the users most drawn to the product's differentiation. The revenue is also dismal at small scale: a niche community of 10K DAU earns roughly $3K–$8K/month from display ads (CPMs $1–3, 3–5 pageviews/session), about the same as 200–400 Ko-fi supporters tipping $10/mo without the brand damage.

**Crypto-native monetization** is the asymmetric bet. NFT memberships (one-time mint, ongoing utility) cost ~$0 to the platform after mint and tie identity to the community. Token-gated content is trivial on Base or Optimism. Protocol fees on conviction markets (see §3.2) scale with actual use. The risk is regulatory: anything that looks like a security or unlicensed gambling triggers SEC/CFTC/state-gaming exposure (see §3.5).

### Recommended mix for FRQNCY

1. **Free forever for the core product.** Posting, following, reading, basic conviction calls.
2. **FRQNCY Supporter — $5/mo or $50/yr.** Custom profile themes, higher media upload limits, early access to new features, a visible badge. Target: 2–3% conversion at 10K users = ~$1,000–$1,500/mo. This alone covers infrastructure with margin.
3. **Creator tipping via Stripe Connect.** Platform takes 0% at launch, 3% once processing is stable. Mirrors Ko-fi's goodwill posture while keeping dollars on-platform.
4. **Conviction-market protocol fee — 1–2%** on winning-side payouts once the mechanism is live (§3.2). At modest volume ($50K/month in stakes, 1.5% take) that's $750/mo, and scales with engagement rather than attention extraction.
5. **Optional NFT "Founding Member" pass — one-time $100 mint, 500 total.** $50K one-time runway, permanent badge, governance voice on moderation disputes. Do not over-engineer the utility; scarcity + story is the point.

No ads. Ever. Put it in the charter.

## 3.2 Conviction markets as the headline differentiator

### The smallest viable version

FRQNCY already rates 630 projects A–F. Posts can be tagged with a project and a bullish/bearish stance. The minimum-viable conviction market turns that stance into a tracked, score-able call — no money required for v1.

**v1: Points-only conviction tracking (ship in week 3 of the build order).**

- Every post tagged to a project with stance B/b (bull) or S/s (bear) and a time horizon (7d / 30d / 90d / 1y) becomes a "call."
- At horizon end, the system resolves using on-chain price data (CoinGecko/CMC API, free tier) against a benchmark (BTC or the project's category index).
- Score per resolved call: `score = sign(direction) * log(1 + |return_vs_benchmark|) * conviction_weight`, where `conviction_weight ∈ {1, 2, 3}` set at post time (costs posting-frequency quota, not money).
- Leaderboard aggregates rolling 90-day Brier-adjusted accuracy: `BrierScore = mean((p - o)^2)` where p is the user's implied probability (inferred from conviction weight and stance) and o is outcome. Lower is better; display inverted as a 0–100 "Conviction Score."

This is not gambling. It's a public track record, analogous to a sports tipster's ledger. Legally uninteresting.

**v2: Staked conviction with on-chain escrow (month 4+).**

- Users stake small amounts (USDC, $1 minimum) on calls. Stakes go to a pool per (project, direction, horizon).
- Resolution uses a designated oracle (price feed) plus a 48-hour community dispute window — a lightweight version of Augur's reporter/disputer model where REP holders stake to challenge outcomes [[Augur whitepaper](https://arxiv.org/pdf/1501.01042)].
- Payout uses a parimutuel split of the losing pool to the winning pool, pro-rata by stake. Platform fee: 1–2% of the losing-side pool.
- Optional: LMSR-priced continuous markets for the top 50 projects to provide always-on liquidity. LMSR's logarithmic cost function gives bounded subsidy loss and smooth price discovery, which is why Gnosis, Augur v2, and most serious prediction markets use it [[LMSR analysis](https://timroughgarden.github.io/fob21/reports/ZLRL.pdf)].

**Example math (parimutuel).** 100 users stake on "Project X outperforms BTC over 30d." 60 stake bull ($600 total), 40 stake bear ($400 total). Project X underperforms BTC. Bears win the $600 losing pool minus a 1.5% fee ($9), split pro-rata by their $400 stake: a $10 bear-side bet returns ($10/$400) * $591 + $10 = $24.77. Effective 2.48x on a correct call in a tight market. Compare to Polymarket-style binary contracts, which clear at par but require order-book liquidity FRQNCY won't have at 10K users.

### Is this gambling?

Yes and no. It depends on (a) the resolution source, (b) whether users risk money, and (c) the jurisdiction. Four 2026 data points to internalize:

- The CFTC approved Polymarket's US reentry in December 2025 via its $112M acquisition of QCX, a registered DCM; the CFTC also issued a no-action letter on reporting/recordkeeping requirements [[Regulatory Oversight](https://www.regulatoryoversight.com/2025/12/cftc-approval-allows-polymarket-to-reenter-the-u-s-market/)].
- CFTC Chairman Michael Selig (sworn in December 2025) announced withdrawal of the proposed ban on political/sports event contracts and is drafting new standards [[Corporate Compliance Insights](https://www.corporatecomplianceinsights.com/cftc-withdraws-proposed-rule-prediction-markets/)].
- Meanwhile, state gaming regulators are winning: Massachusetts (January 2026) and Ohio (March 2026) have enjoined Kalshi's sports event contracts as unlicensed gambling; Nevada and New Jersey federal courts ruled the CEA preempts state law. The legal ground is genuinely contested [[Kalshi, Wikipedia](https://en.wikipedia.org/wiki/Kalshi)].
- A bipartisan "Prediction Markets are Gambling Act" has been introduced in Congress to classify election/sports/war markets as gambling [[Fortune, April 2026](https://fortune.com/2026/04/02/crypto-prediction-markets-insider-trading-congress-gambling-act-bad-idea/)].

**Practical recommendation for FRQNCY:** Ship v1 (points-only) immediately — zero legal risk. Defer v2 (real money) until either (a) a specialized crypto/prediction-market attorney has reviewed, or (b) partner with a regulated intermediary (e.g., a Polymarket-style DCM integration). Do not accept US residents staking real money until that review is done. Geofence conservatively; the operating assumption should be that any market resolving on a tradeable asset's price is potentially a swap or event contract under the CEA.

## 3.3 Moderation at every scale

### The 100-user phase (months 1–6)

The founder moderates. Everything. Use Supabase RLS to enforce basic rules (post length, rate limits, report-to-hide at 3 reports). Read every reported post. This phase is about hand-crafting the Schelling point for "what FRQNCY is for."

### The 10K-user phase (year 1–2)

Manual moderation breaks. A 2024 Sage study of ex-volunteer moderators found burnout is driven by exposure to toxic content, interpersonal conflict, and time pressure [[Sage study](https://journals.sagepub.com/eprint/BBWM7VPP9JCWFWFZMIZY/full)]. A Northwestern study put the unpaid labor on Reddit alone at $3.4M/year; a Cornell 2025 study found 60% of moderators cite AI-generated content as degrading quality and 53% say it creates "nearly impossible governance challenges" [[Cornell, Oct 2025](https://news.cornell.edu/stories/2025/10/ai-generated-content-triple-threat-reddit-moderators)].

**Recommended stack at 10K:**

1. **Automated first pass with Llama Guard 3 or Llama Guard 4** (self-hosted on a small GPU or via Groq API). Llama Guard 3 is an 8B Llama-3.1 fine-tune that classifies both input and output across 14 MLCommons hazard categories in 8 languages, and has lower false-positive rates than Llama Guard 2 at equivalent F1 [[Hugging Face — Llama Guard 3](https://huggingface.co/meta-llama/Llama-Guard-3-8B)]. It replaces what Perspective API used to do — notable because Google announced Perspective will shut down after December 2026 with no migration path [[Lasso Moderation on Perspective](https://www.lassomoderation.com/blog/what-is-perspective-api/)].
2. **Discourse-style trust levels**, adapted. TL0 (new, sandboxed), TL1 (basic, after 10 posts / 3 days / no flags), TL2 (member, can flag with weight), TL3 (regular, flags auto-hide, can edit wiki posts), TL4 (leader, manual promotion). Discourse's experience shows multiple TL3 flags can auto-silence obvious spam, freeing moderators for nuance [[Discourse Trust Levels](https://blog.discourse.org/2018/06/understanding-discourse-trust-levels/)].
3. **Reputation-gated privileges.** New accounts cannot post conviction calls with stakes, cannot tag projects, cannot DM users who don't follow them. Rate limits decay with reputation.
4. **Community mods per channel.** Borrow the Reddit subreddit model without the Reddit pathologies: each community (e.g., "Plant Medicine," "Bitcoin Theses") has 2–3 mods with clearly-scoped authority, rotating every 6 months to prevent fiefdoms.

### The 1M-user phase (hypothetical, year 3+)

At this scale FRQNCY would almost certainly federate via Farcaster or Nostr bridges (already in the roadmap). Moderation becomes client-side: different UIs filter the same backend differently, which is how Farcaster and Lens already operate. FRQNCY's canonical client would publish moderation lists (Nostr-style) that users can subscribe to or fork.

### Blameless incident-response playbook

When moderation fails — a scammer farms 50 users, a harassment mob coordinates across DMs, a coordinated pump-and-dump uses project tags — run this:

```
INCIDENT: <short name>         DATE: <yyyy-mm-dd>    SEVERITY: SEV1 / SEV2 / SEV3
LEAD: <one person, empowered to act>

1. CONTAIN (first 60 min)
   - Temp-disable affected feature/account/channel
   - Preserve evidence (DB snapshots, logs)
   - Post a public holding statement (template below)

2. COMMUNICATE (first 4 hours)
   - Public status post: what happened, who is affected, what we are doing
   - DM affected users individually
   - Do NOT speculate on attribution

3. REMEDIATE (24–72 hours)
   - Restore safe state
   - Refund/compensate affected users if funds involved
   - Document every action with timestamps

4. POST-MORTEM (within 10 days) — BLAMELESS
   - Timeline
   - Contributing factors (people, process, tech — never individuals)
   - What we got right
   - Concrete changes (rate limits, rule, automation, monitoring)
   - Publish a redacted summary to the community

5. FOLLOW-UP (30-day review)
   - Did the changes ship?
   - Did they work?
```

The non-negotiables: the lead has authority to act, the post-mortem names no individuals, and the public write-up ships even when it's embarrassing.

## 3.4 Trust & Safety in a crypto-adjacent community

Four specific threats and how peer platforms handle them:

**Scams and impersonation.** Farcaster paywalled signup at $5 in 2024 and still saw bot swarms within weeks of opening. A $5 floor deters nobody serious. Impersonation is addressed by Farcaster via ENS-tied handles and verified Ethereum addresses, which Lens handles with profile NFTs gated by governance approval. **FRQNCY recommendation:** ship verified-handle via a signed message from a wallet the user holds, display a verification mark, and reserve brand/project names (the 630 project list) so no one can impersonate a project.

**Sybil attacks.** Research on Farcaster shows ENS-based identity is economic, not humanity-preserving — attackers buy multiple domains cheaply [[UFSC TCC](https://repositorio.ufsc.br/bitstream/handle/123456789/267620/TCC.pdf)]. Graph-based detection (follow-graph anomalies, timing correlations) is the current best practice. Newton Protocol now sells Farcaster identity guardrails as a service. **FRQNCY recommendation:** use a combination of (a) phone-or-email verification at signup, (b) behavioral graph scoring on follows/likes/posting patterns, (c) staking requirements for conviction markets that make sybil farms economically unattractive.

**Pump-and-dump coordination.** The playbook is well-documented: coordinators use Telegram groups (some exceeding 2M members) and Discord to synchronize buys, then dump on retail [[Traders Union](https://tradersunion.com/interesting-articles/pump-and-dump-explained-and-defined-with-examples/best-groups-in-telegram/)]. The SEC, CFTC, and foreign regulators (UK FCA, South Korea FSC, Australia) have brought criminal cases with up to 15-year maximum sentences. **FRQNCY recommendation:** explicitly ban coordinated buying signals in ToS, auto-flag posts containing pump-coordination language (time-boxed calls to buy, group coordination language), and publish a channel-level "velocity" metric that shows unusual synchronized activity. The goal is not to catch 100% but to make FRQNCY a bad venue for this.

**Harassment and brigading.** Borrow Mastodon's federated block-list approach inside the platform: trusted moderators publish mute lists that users opt into. Combine with rate-limiting DMs from non-followers (Twitter's approach) and a "no quote-harass" default where quote posts require the original author's opt-in for accounts under 90 days old.

## 3.5 Legal & regulatory landscape (April 2026)

### What a solo dev actually needs to know before launch

**EU Digital Services Act.** FRQNCY launches far below the 45M-monthly-EU-user VLOP threshold. Small and micro enterprises are explicitly exempt from most obligations [[EU DSA](https://digital-strategy.ec.europa.eu/en/policies/digital-services-act)]. What still applies: illegal-content notice-and-action, a designated point of contact, and transparency reporting. Budget: a dedicated abuse email, a 48-hour response SLA for EU illegal-content notices, and a once-yearly transparency post. Cost: near zero if built in from day one.

**US Section 230.** Still largely intact in April 2026, but the landscape is actively shifting. H.R. 6746 (Sunset To Reform Section 230 Act) would sunset §230 at end of 2026; state-court verdicts in K.G.M. v. Meta and New Mexico v. Meta bypassed §230 defenses entirely [[H.R. 6746](https://www.congress.gov/bill/119th-congress/house-bill/6746/text)]. **Implication:** rely on §230 for user-generated-content immunity, but design moderation as if §230 may not exist — affirmative moderation, clear ToS, a functioning abuse pipeline, and documentation of good-faith action on known harms.

**Crypto/prediction-market ambiguity.** This is the big landmine. The CFTC opened a door to prediction markets via the Polymarket/QCX path, but state gaming authorities are pushing back — Massachusetts and Ohio have enjoined Kalshi sports contracts in early 2026, Nevada and New Jersey went the other way [[Wealth Management](https://www.wealthmanagement.com/advisor-support-platforms/prediction-markets-find-their-regulatory-footing-but-the-boundaries-remain-clear)]. Token-gated content and NFT memberships are generally safe if not marketed as investments; staking mechanisms for conviction markets almost certainly require either a regulated intermediary or an explicit points-only design.

**KYC/AML.** Any platform that custodies funds, facilitates token transfers beyond self-custodial tipping, or processes fiat on-ramps needs to address FinCEN MSB rules (US) and the EU's MiCA framework. Stripe Connect handles most of this for fiat tipping; self-custodial wallet tipping (user to user, no platform custody) is lower risk but not zero.

### When to bring in a lawyer

Bring a specialized crypto/securities attorney **before** any of the following go live:

1. Real-money conviction markets (v2).
2. An NFT membership with promised ongoing benefits (potential securities issue under Howey).
3. A native token, even a "points" token with off-platform utility.
4. Revenue sharing with creators funded by a platform-held pool.
5. Any geofencing change that lets previously-blocked jurisdictions in.

A 3–5 hour initial consult with a crypto-specialist attorney in 2026 runs $1,500–$3,000. That is cheap relative to a CFTC enforcement letter, which starts around $50K in defense costs before anyone talks settlement.

### The biggest single legal landmine

**Launching real-money conviction markets without a regulated intermediary or pre-launch legal opinion.** The CFTC is warming to event contracts, but state gaming regulators are actively suing; an unlicensed crypto-adjacent betting product is exactly the kind of target both sides want. Ship points-only conviction tracking (v1) indefinitely unless and until a lawyer signs off on v2.

---

# Unified 24-Month Roadmap

This roadmap synthesizes the recommendations from all three chapters into a single sequence. Each phase names its deliverables across protocol, ranking, and economics, so they can ship together and inform each other.

### Phase 1 — Centralized with portable bones (months 0–6)

*Protocol:* Keep the Supabase + Astro + Preact stack exactly as it is. Add three things: (a) a Lexicon spec repo at `github.com/frqncy/lexicons` defining `xyz.frqncy.*` record types; (b) a server-side DID issuer that creates `did:web` identities lazily per user and stores signing keys in Supabase Vault; (c) a nightly Supabase→signed-JSON exporter so every user can download their repo today, even if nothing else is bridged yet.

*Ranking:* Pure reverse-chrono feed + project-anchored rooms for the first 10–100 users. Introduce the full ranking formula only once `n_users ≥ 100`, with small-network weights (`w_G = 0.5, w_R = 2.0`). Conviction tracking ships points-only from day one — every project-tagged post with a stance gets a horizon and a resolution record. The Brier leaderboard becomes visible at ~50 resolved calls.

*Economics:* Free core product. FRQNCY Supporter at $5/mo (Stripe). Creator tipping via Stripe Connect at 0% platform fee. No ads, ever. Founder moderates everything; Llama Guard 3 runs as an automated first pass. EU DSA notice-and-action endpoint live from launch.

*Deliverables:* Lexicon v0.1, DID issuer service, export-my-data endpoint, one end-to-end test showing a FRQNCY post round-tripping through a local PDS. Full ranking formula implemented behind a feature flag. Points-only conviction v1 shipped. Supporter subscription live. Llama Guard integration + incident response playbook committed to repo.

### Phase 2 — Dual-write federation + differentiation lock-in (months 6–12)

*Protocol:* Stand up a production PDS for `*.frqncy.social`, dual-write posts/follows/likes, consume the Bluesky firehose via Jetstream, run a custom App View on Cloudflare Workers + D1 or a small Postgres. Ship cross-posting to Bluesky (one-click) and to Farcaster (via Neynar SDK) for power users. Add Ozone-style labeling for the FRQNCY community (your own labeler subscribed to by default in-app).

*Ranking:* Turn on the Discover surface (interest-graph scorer over project tags). Reputation vector (Social, Conviction, Debate) replaces the scalar karma number on profile displays. Debate score becomes user-visible. Weekly "calls coming due" email digest ships for all users with >1 open call. A/B test `w_C` in the feed formula once n_resolved_calls ≥ 500 across the network.

*Economics:* NFT Founding Member mint (500 seats, $100 each, one-time $50K runway). Creator tipping fee stays at 0% until Supporter + tips alone clear infra costs, then moves to 3%. Trust-level system (Discourse-style TL0–TL4) activates; community mods nominated for the top project channels. Legal consultation with a crypto-specialist attorney to draft the conviction-market v2 design doc.

*Deliverables:* Production PDS, App View with firehose ingest, Bluesky cross-post, Farcaster cross-post, in-house Ozone labeler, Periwinkle-style "export your PDS" UI. Reputation vector display. Founding Member NFT live. Pre-launch legal review of v2 markets complete (decision: ship v2 staked markets or stay points-only indefinitely).

### Phase 3 — Protocol-native, platform-optional (months 12–24)

*Protocol:* Flip the source of truth: PDS records are canonical, Supabase demotes to index/cache. Let users bring their own DID (migrate in from a Bluesky account or another PDS host). Publish FRQNCY's Lexicons to the ATProto Lexicon registry so other apps can consume `xyz.frqncy.resonance` records. Build a Farcaster Mini App wrapper for the 630-crypto-projects rating UI so the crypto-adjacent surface lives where crypto users already are. Evaluate Nostr bridging for the Bitcoin/Lightning-maxi edge of the audience — probably a one-way bridge (FRQNCY posts → kind 1 notes) until Nostr signer UX improves.

*Ranking:* Expose FRQNCY's ranker as a Bluesky custom feed so it runs on any ATProto client, not just FRQNCY's. Ship a user-facing "Feed tuning" UI that exposes the `w_*` weights as sliders (following Bluesky's precedent). Add AI-generated personal feeds (Attie-style) as an opt-in. The reputation vector becomes a PDS record (`xyz.frqncy.reputation`) users can bring to any compatible client.

*Economics:* If legal review green-lit v2: staked conviction markets with a regulated-intermediary partner, 1–2% protocol fee on winning-side payouts. If legal review did not: stay points-only, convert the conviction leaderboard into a user-visible "Calibration Leagues" ritual with quarterly cash prizes funded from Supporter revenue. Per-channel community mods with 6-month rotation. Blameless post-mortems for any SEV1/SEV2 incident published publicly.

*Deliverables:* Canonical-PDS cutover, BYO-DID import, public Lexicon registry, Farcaster Mini App, Nostr read-bridge, feed-tuning UI, v2 markets or Calibration Leagues (one or the other ships, not both), public transparency report.

**Net:** in 24 months FRQNCY is an ATProto-native app with a Farcaster surface for crypto content and a Nostr read-path, ranking its feed with a transparent formula that exposes a calibrated reputation vector, and monetizing through Supporter + tips + (maybe) a regulated staked market. It bets on the network that already has the users, keeps the crypto-native hooks its audience expects, and never puts the founder in a position where the protocol's failure mode is the product's failure mode, the algorithm's gaming is the community's failure mode, or the monetization is the brand's failure mode.

---

# Consolidated References

### Decentralized protocols (Chapter 1)

- [Farcaster in 2025: The Protocol Paradox — BlockEden, Oct 2025](https://blockeden.xyz/blog/2025/10/28/farcaster-in-2025-the-protocol-paradox/)
- [Farcaster vs Lens: The $2.4B Battle for Web3's Social Graph — BlockEden, Jan 2026](https://blockeden.xyz/blog/2026/01/15/decentralized-socialfi-farcaster-lens-protocol-web3-social-graph/)
- [Snapchain FIP Discussion — farcasterxyz/protocol #207](https://github.com/farcasterxyz/protocol/discussions/207)
- [Farcaster Key Registry docs](https://docs.farcaster.xyz/reference/contracts/reference/key-registry)
- [Farcaster Frames v2 / Mini Apps](https://framesv2.com/)
- [Haun-backed Neynar acquires Farcaster — The Block, Jan 2026](https://www.theblock.co/post/386549/haun-backed-neynar-acquires-farcaster-after-founders-pivot-to-wallet-app)
- [Farcaster channel moderation redesign — Paragraph](https://paragraph.com/@clauswilke/farcaster-channel-moderation)
- [Nostr NIP-65 Relay List Metadata](https://nips.nostr.com/65)
- [Nostr overview and statistics — Glukhov, Oct 2025](https://www.glukhov.org/post/2025/10/nostr-overview-and-statistics/)
- [LearnNostr: Keys & Identity](https://learnnostr.org/modules/module-02-keys-identity)
- [The Growth of Nostr — Voltage Blog](https://voltage.cloud/blog/the-growth-of-nostr-the-era-of-decentralization)
- [Bluesky AT Protocol Federation Architecture](https://docs.bsky.app/docs/advanced-guides/federation-architecture)
- [AT Protocol Identity guide](https://atproto.com/guides/identity)
- [AT Protocol Spring 2026 Roadmap](https://atproto.com/blog/2026-spring-roadmap)
- [Bluesky Statistics — Backlinko, 2026](https://backlinko.com/bluesky-statistics)
- [Bluesky MAU January 2026 — Skyscraper](https://getskyscraper.com/blog/bluesky-mau-monthly-active-users-january-2026)
- [Periwinkle managed PDS hosting launch — TechCrunch, March 2026](https://techcrunch.com/2026/03/09/periwinkle-at-protocol-bluesky-self-hosted-social-media/)
- [Bluesky Ozone moderation architecture](https://bsky.social/about/blog/03-12-2024-stackable-moderation)
- [did:plc method spec](https://web.plc.directory/spec/v0.1/did-plc)
- [Introducing the New Lens — Lens.xyz](https://lens.xyz/news/introducing-the-new-lens)
- [Lens Social Protocol docs](https://lens.xyz/docs/protocol)
- [Lens SDK — GitHub](https://github.com/lens-protocol/lens-sdk)
- [Mastodon Statistics 2026 — Expanded Ramblings](https://expandedramblings.com/index.php/mastodon-statistics-facts/)
- [The Fediverse in Numbers 2026 — Fediview](https://fediview.com/articles/fediverse-in-numbers-mastodon-stats-2026/)
- [ActivityPub protocol — Mastodon docs](https://docs.joinmastodon.org/spec/activitypub/)

### Feed ranking, social graph, reputation (Chapter 2)

- [Twitter Recommendation Algorithm — X Engineering blog](https://blog.x.com/engineering/en_us/topics/open-source/2023/twitter-recommendation-algorithm)
- [the-algorithm-ml: Heavy Ranker weights](https://github.com/twitter/the-algorithm-ml/blob/main/projects/home/recap/README.md)
- [Twitter Algorithm analysis — Solomon Messing](https://solomonmg.github.io/post/twitter-the-algorithm/)
- [EdgeRank — Wikipedia](https://en.wikipedia.org/wiki/EdgeRank)
- [Evolution of the Facebook Algorithm — Markinuity](https://markinuity.com/uncategorized/the-evolution-of-the-facebook-algorithm/)
- [Monolith: Real-time Recommendation System — ByteDance arXiv](https://arxiv.org/pdf/2209.07663)
- [How Hacker News Ranking Really Works — righto.com](http://www.righto.com/2013/11/how-hacker-news-ranking-really-works.html)
- [How Hacker News Ranking Algorithm Works — Hacking & Gonzo](https://medium.com/hacking-and-gonzo/how-hacker-news-ranking-algorithm-works-1d9b0cf2c08d)
- [How Not to Sort by Average Rating — Evan Miller](https://www.evanmiller.org/how-not-to-sort-by-average-rating.html)
- [Understanding Decentralized Social Feed Curation on Mastodon — Liu et al., arXiv:2504.18817](https://arxiv.org/html/2504.18817)
- [Bluesky Custom Feeds announcement](https://bsky.social/about/blog/7-27-2023-custom-feeds)
- [Bluesky Attie — AI-generated custom feeds, TechCrunch, March 2026](https://techcrunch.com/2026/03/28/bluesky-leans-into-ai-with-attie-an-app-for-building-custom-feeds/)
- [Instagram Reels pivot engagement analysis — V9 Digital](https://www.v9digital.com/insights/engagement-wars-tiktok-loses-ground-as-instagram-reels-gain-momentum/)
- [Brier Score — Wikipedia](https://en.wikipedia.org/wiki/Brier_score)
- [Metaculus Brier benchmarks — Prediction Markets Reviews](https://predictionmarketsreviews.com/reviews/metaculus)
- [Polymarket accuracy analysis — Fensory, 2026](https://fensory.com/intelligence/predict/polymarket-accuracy-analysis-track-record-2026)
- [How to solve the cold-start problem for social products — Andrew Chen](https://andrewchen.com/how-to-solve-the-cold-start-problem-for-social-products/)

### Monetization, moderation, legal (Chapter 3)

- [Discord revenue and ARPU — Sacra, 2025](https://sacra.com/c/discord/)
- [Twitter/X revenue statistics — Business of Apps](https://www.businessofapps.com/data/twitter-statistics/)
- [Ko-fi vs Buy Me a Coffee — Talks.co](https://talks.co/p/kofi-vs-buy-me-a-coffee/)
- [Augur whitepaper — arXiv](https://arxiv.org/pdf/1501.01042)
- [LMSR cost function analysis — Roughgarden seminar notes](https://timroughgarden.github.io/fob21/reports/ZLRL.pdf)
- [CFTC approves Polymarket US reentry — Regulatory Oversight, Dec 2025](https://www.regulatoryoversight.com/2025/12/cftc-approval-allows-polymarket-to-reenter-the-u-s-market/)
- [CFTC withdraws prediction-market rule — Corporate Compliance Insights](https://www.corporatecomplianceinsights.com/cftc-withdraws-proposed-rule-prediction-markets/)
- [Kalshi — Wikipedia (state gaming rulings)](https://en.wikipedia.org/wiki/Kalshi)
- [Prediction Markets are Gambling Act analysis — Fortune, April 2026](https://fortune.com/2026/04/02/crypto-prediction-markets-insider-trading-congress-gambling-act-bad-idea/)
- [Moderator burnout study — Sage Journals](https://journals.sagepub.com/eprint/BBWM7VPP9JCWFWFZMIZY/full)
- [AI-generated content is a triple threat for Reddit moderators — Cornell, Oct 2025](https://news.cornell.edu/stories/2025/10/ai-generated-content-triple-threat-reddit-moderators)
- [Llama Guard 3 — Hugging Face model card](https://huggingface.co/meta-llama/Llama-Guard-3-8B)
- [Perspective API shutdown — Lasso Moderation](https://www.lassomoderation.com/blog/what-is-perspective-api/)
- [Discourse Trust Levels explainer](https://blog.discourse.org/2018/06/understanding-discourse-trust-levels/)
- [Farcaster identity sybil resistance TCC — UFSC](https://repositorio.ufsc.br/bitstream/handle/123456789/267620/TCC.pdf)
- [Pump-and-dump Telegram groups explained — Traders Union](https://tradersunion.com/interesting-articles/pump-and-dump-explained-and-defined-with-examples/best-groups-in-telegram/)
- [EU Digital Services Act — policy page](https://digital-strategy.ec.europa.eu/en/policies/digital-services-act)
- [H.R. 6746 — Sunset to Reform Section 230 Act](https://www.congress.gov/bill/119th-congress/house-bill/6746/text)
- [Prediction markets regulatory footing — Wealth Management, 2026](https://www.wealthmanagement.com/advisor-support-platforms/prediction-markets-find-their-regulatory-footing-but-the-boundaries-remain-clear)

---

# Appendix A — Glossary

- **ATProto / AT Protocol** — Authenticated Transfer Protocol, the open spec underlying Bluesky. Separates identity (DID), data (PDS), and applications (App View) so users can migrate across services without losing their graph.
- **Brier score** — A proper scoring rule for probabilistic forecasts. For a binary outcome, `BS = (p - o)^2` where `p ∈ [0,1]` is the forecast probability and `o ∈ {0,1}` is the realized outcome. Lower is better.
- **DID (Decentralized Identifier)** — A self-sovereign identifier format (W3C standard). ATProto uses `did:plc` and `did:web` variants.
- **Firehose** — ATProto's global event stream of every public record change across all PDSes; consumed by App Views via the Jetstream websocket.
- **LMSR (Logarithmic Market Scoring Rule)** — A continuous market maker for prediction markets with bounded subsidy loss; standard in Gnosis and Augur v2.
- **Lexicon** — ATProto's JSON-schema-like system for defining record types. FRQNCY's custom Lexicons live under the `xyz.frqncy.*` namespace.
- **Monolith** — ByteDance's TikTok recommender architecture; uses collisionless Cuckoo-hash embedding tables and online training.
- **PDS (Personal Data Server)** — In ATProto, the server that hosts a user's signed record repo. Analogous to a personal Supabase. Managed PDS hosting available from Periwinkle for $4/mo.
- **Snapchain** — Farcaster's purpose-built content chain (launched Feb 2025), replacing the earlier Hubs architecture.
- **Wilson lower bound** — A small-sample–aware ranking score for binary upvote/downvote data; used by Reddit's "Best" comment sort.
