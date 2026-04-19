---
section: "Monetization, Moderation, Community Health"
author: research-agent-3
date: 2026-04-18
---

# Monetization, Moderation, and Community Health

FRQNCY Social launches as a solo-dev project grafted onto an existing static site that already rates 630 crypto projects A–F. The social layer runs on Supabase + Astro + Preact, costs $0 at launch and roughly $50/mo at 10,000 users. Those numbers shape every decision in this section: any monetization scheme must clear the infrastructure floor without corroding the "conscious living" product, and any moderation system must survive the absence of a trust-and-safety team. What follows is a survey of what actually works at this scale, a concrete mechanism design for the conviction-market feature, a tiered moderation plan, a crypto-specific trust-and-safety posture, and the legal landmines a US-based solo dev faces in April 2026.

## 1. Monetization Without Selling Out

### The landscape, with real numbers

**Subscriptions** are the least intrusive model and the most predictable cash flow. Discord's global ARPU is about $3.47, with Nitro contributing roughly $280M in 2025 and paid subscriptions accounting for nearly 54% of Discord revenue [source: https://sacra.com/c/discord/]. X Premium remains opaque, but independent estimates put subscription revenue at 10–15% of X's $2.5B 2024 total — nowhere near replacing ads [source: https://www.businessofapps.com/data/twitter-statistics/]. The lesson: subscriptions work as a supplement, rarely as a sole engine, and ARPU rarely exceeds $3–5/month for general-purpose social.

**Creator tipping** has the cleanest economics for a values-driven product. Ko-fi charges 0% platform fee on one-time tips (Stripe/PayPal still take ~2.9% + $0.30); Buy Me a Coffee takes 5% on top of payment processing [source: https://talks.co/p/kofi-vs-buy-me-a-coffee/]. Farcaster has normalized $DEGEN tips as a native interaction primitive, and Warpcast distributes $25K+/week in USDC via creator pools. Farcaster Pro launched May 2025 at $120/year and sold its first 10,000 subscriptions in under six hours — $1.2M in six hours, 100% redistributed to creators [source: https://blockeden.xyz/blog/2025/10/28/farcaster-in-2025-the-protocol-paradox/]. Tipping generates low absolute revenue per platform, but the emotional flywheel is powerful and aligns with a conscious-living brand.

**Ads** would kill FRQNCY. The entire thesis of a conscious-living network is attention that heals rather than extracts. Ad-supported platforms optimize for time-on-site and outrage engagement; the cost of switching on ads at 10K users would be a measurable loss of the users most drawn to the product's differentiation. The revenue is also dismal at small scale: a niche community of 10K DAU earns roughly $3K–$8K/month from display ads (CPMs $1–3, 3–5 pageviews/session), about the same as 200–400 Ko-fi supporters tipping $10/mo without the brand damage.

**Crypto-native monetization** is the asymmetric bet. NFT memberships (one-time mint, ongoing utility) cost ~$0 to the platform after mint and tie identity to the community. Token-gated content is trivial on Base or Optimism. Protocol fees on conviction markets (see §2) scale with actual use. The risk is regulatory: anything that looks like a security or unlicensed gambling triggers SEC/CFTC/state-gaming exposure (see §5).

### Recommended mix for FRQNCY

1. **Free forever for the core product.** Posting, following, reading, basic conviction calls.
2. **FRQNCY Supporter — $5/mo or $50/yr.** Custom profile themes, higher media upload limits, early access to new features, a visible badge. Target: 2–3% conversion at 10K users = ~$1,000–$1,500/mo. This alone covers infrastructure with margin.
3. **Creator tipping via Stripe Connect.** Platform takes 0% at launch, 3% once processing is stable. Mirrors Ko-fi's goodwill posture [source: https://talks.co/p/kofi-vs-buy-me-a-coffee/] while keeping dollars on-platform.
4. **Conviction-market protocol fee — 1–2%** on winning-side payouts once the mechanism is live (§2). At modest volume ($50K/month in stakes, 1.5% take) that's $750/mo, and scales with engagement rather than attention extraction.
5. **Optional NFT "Founding Member" pass — one-time $100 mint, 500 total.** $50K one-time runway, permanent badge, governance voice on moderation disputes. Do not over-engineer the utility; scarcity + story is the point.

No ads. Ever. Put it in the charter.

## 2. Conviction Markets as the Headline Differentiator

### The smallest viable version

FRQNCY already rates 630 projects A–F. Posts can be tagged with a project and a bullish/bearish stance. The minimum-viable conviction market turns that stance into a tracked, score-able call — no money required for v1.

**v1: Points-only conviction tracking (ship in week 3 of §Build Order step 2).**
- Every post tagged to a project with stance B/b (bull) or S/s (bear) and a time horizon (7d / 30d / 90d / 1y) becomes a "call."
- At horizon end, the system resolves using on-chain price data (CoinGecko/CMC API, free tier) against a benchmark (BTC or the project's category index).
- Score per resolved call: `score = sign(direction) * log(1 + |return_vs_benchmark|) * conviction_weight`, where `conviction_weight ∈ {1, 2, 3}` set at post time (costs posting-frequency quota, not money).
- Leaderboard aggregates rolling 90-day Brier-adjusted accuracy: `BrierScore = mean((p - o)^2)` where p is the user's implied probability (inferred from conviction weight and stance) and o is outcome. Lower is better; display inverted as a 0–100 "Conviction Score."

This is not gambling. It's a public track record, analogous to a sports tipster's ledger. Legally uninteresting.

**v2: Staked conviction with on-chain escrow (month 4+).**
- Users stake small amounts (USDC, $1 minimum) on calls. Stakes go to a pool per (project, direction, horizon).
- Resolution uses a designated oracle (price feed) plus a 48-hour community dispute window — a lightweight version of Augur's reporter/disputer model where REP holders stake to challenge outcomes [source: https://arxiv.org/pdf/1501.01042].
- Payout uses a parimutuel split of the losing pool to the winning pool, pro-rata by stake. Platform fee: 1–2% of the losing-side pool.
- Optional: LMSR-priced continuous markets for the top 50 projects to provide always-on liquidity. LMSR's logarithmic cost function gives bounded subsidy loss and smooth price discovery, which is why Gnosis, Augur v2, and most serious prediction markets use it [source: https://timroughgarden.github.io/fob21/reports/ZLRL.pdf].

**Example math (parimutuel).** 100 users stake on "Project X outperforms BTC over 30d." 60 stake bull ($600 total), 40 stake bear ($400 total). Project X underperforms BTC. Bears win the $600 losing pool minus a 1.5% fee ($9), split pro-rata by their $400 stake: a $10 bear-side bet returns ($10/$400) * $591 + $10 = $24.77. Effective 2.48x on a correct call in a tight market. Compare to Polymarket-style binary contracts, which clear at par but require order-book liquidity FRQNCY won't have at 10K users.

### Is this gambling?

Yes and no. It depends on (a) the resolution source, (b) whether users risk money, and (c) the jurisdiction. Four 2026 data points to internalize:

- The CFTC approved Polymarket's US reentry in December 2025 via its $112M acquisition of QCX, a registered DCM; the CFTC also issued a no-action letter on reporting/recordkeeping requirements [source: https://www.regulatoryoversight.com/2025/12/cftc-approval-allows-polymarket-to-reenter-the-u-s-market/].
- CFTC Chairman Michael Selig (sworn in December 2025) announced withdrawal of the proposed ban on political/sports event contracts and is drafting new standards [source: https://www.corporatecomplianceinsights.com/cftc-withdraws-proposed-rule-prediction-markets/].
- Meanwhile, state gaming regulators are winning: Massachusetts (January 2026) and Ohio (March 2026) have enjoined Kalshi's sports event contracts as unlicensed gambling; Nevada and New Jersey federal courts ruled the CEA preempts state law. The legal ground is genuinely contested [source: https://en.wikipedia.org/wiki/Kalshi].
- A bipartisan "Prediction Markets are Gambling Act" has been introduced in Congress to classify election/sports/war markets as gambling [source: https://fortune.com/2026/04/02/crypto-prediction-markets-insider-trading-congress-gambling-act-bad-idea/].

**Practical recommendation for FRQNCY:** Ship v1 (points-only) immediately — zero legal risk. Defer v2 (real money) until either (a) a specialized crypto/prediction-market attorney has reviewed, or (b) partner with a regulated intermediary (e.g., a Polymarket-style DCM integration). Do not accept US residents staking real money until that review is done. Geofence conservatively; the operating assumption should be that any market resolving on a tradeable asset's price is potentially a swap or event contract under the CEA.

## 3. Moderation at Every Scale

### The 100-user phase (months 1–6)

The founder moderates. Everything. Use Supabase RLS to enforce basic rules (post length, rate limits, report-to-hide at 3 reports). Read every reported post. This phase is about hand-crafting the Schelling point for "what FRQNCY is for."

### The 10K-user phase (year 1–2)

Manual moderation breaks. A 2024 Sage study of ex-volunteer moderators found burnout is driven by exposure to toxic content, interpersonal conflict, and time pressure [source: https://journals.sagepub.com/eprint/BBWM7VPP9JCWFWFZMIZY/full]. A Northwestern study put the unpaid labor on Reddit alone at $3.4M/year; a Cornell 2025 study found 60% of moderators cite AI-generated content as degrading quality and 53% say it creates "nearly impossible governance challenges" [source: https://news.cornell.edu/stories/2025/10/ai-generated-content-triple-threat-reddit-moderators].

**Recommended stack at 10K:**

1. **Automated first pass with Llama Guard 3 or Llama Guard 4** (self-hosted on a small GPU or via Groq API). Llama Guard 3 is an 8B Llama-3.1 fine-tune that classifies both input and output across 14 MLCommons hazard categories in 8 languages, and has lower false-positive rates than Llama Guard 2 at equivalent F1 [source: https://huggingface.co/meta-llama/Llama-Guard-3-8B]. It replaces what Perspective API used to do — notable because Google announced Perspective will shut down after December 2026 with no migration path [source: https://www.lassomoderation.com/blog/what-is-perspective-api/].
2. **Discourse-style trust levels**, adapted. TL0 (new, sandboxed), TL1 (basic, after 10 posts / 3 days / no flags), TL2 (member, can flag with weight), TL3 (regular, flags auto-hide, can edit wiki posts), TL4 (leader, manual promotion). Discourse's experience shows multiple TL3 flags can auto-silence obvious spam, freeing moderators for nuance [source: https://blog.discourse.org/2018/06/understanding-discourse-trust-levels/].
3. **Reputation-gated privileges.** New accounts cannot post conviction calls with stakes, cannot tag projects, cannot DM users who don't follow them. Rate limits decay with reputation.
4. **Community mods per channel.** Borrow the Reddit subreddit model without the Reddit pathologies: each community (e.g., "Plant Medicine," "Bitcoin Theses") has 2–3 mods with clearly-scoped authority, rotating every 6 months to prevent fiefdoms.

### The 1M-user phase (hypothetical, year 3+)

At this scale FRQNCY would almost certainly federate via Farcaster or Nostr bridges (already in the roadmap). Moderation becomes client-side: different UIs filter the same backend differently, which is how Farcaster and Lens already operate [source: https://mirror.xyz/lensprotocol.eth/pIzwjs9uhH8eSS1Bx0K1r-3iHEgLlBt6ruPXcEJe0S0]. FRQNCY's canonical client would publish moderation lists (Nostr-style) that users can subscribe to or fork.

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

## 4. Trust & Safety in a Crypto-Adjacent Community

Four specific threats and how peer platforms handle them:

**Scams and impersonation.** Farcaster paywalled signup at $5 in 2024 and still saw bot swarms within weeks of opening [source: https://www.dlnews.com/articles/web3/farcaster-users-could-use-frames-and-nfts-to-stop-bots/]. A $5 floor deters nobody serious. Impersonation is addressed by Farcaster via ENS-tied handles and verified Ethereum addresses, which Lens handles with profile NFTs gated by governance approval [source: https://lens.xyz/]. **FRQNCY recommendation:** ship verified-handle via a signed message from a wallet the user holds, display a verification mark, and reserve brand/project names (the 630 project list) so no one can impersonate a project.

**Sybil attacks.** Research on Farcaster shows ENS-based identity is economic, not humanity-preserving — attackers buy multiple domains cheaply [source: https://repositorio.ufsc.br/bitstream/handle/123456789/267620/TCC.pdf]. Graph-based detection (follow-graph anomalies, timing correlations) is the current best practice. Newton Protocol now sells Farcaster identity guardrails as a service [source: https://blog.newt.foundation/newton-protocol-integrates-neynar-data-to-power-onchain-farcaster-identity-guardrails/]. **FRQNCY recommendation:** use a combination of (a) phone-or-email verification at signup, (b) behavioral graph scoring on follows/likes/posting patterns, (c) staking requirements for conviction markets that make sybil farms economically unattractive.

**Pump-and-dump coordination.** The playbook is well-documented: coordinators use Telegram groups (some exceeding 2M members) and Discord to synchronize buys, then dump on retail [source: https://tradersunion.com/interesting-articles/pump-and-dump-explained-and-defined-with-examples/best-groups-in-telegram/]. The SEC, CFTC, and foreign regulators (UK FCA, South Korea FSC, Australia) have brought criminal cases with up to 15-year maximum sentences [source: https://www.financemagnates.com/forex/regulation/this-telegram-pump-and-dump-scheme-may-cost-15-years-in-prison/]. **FRQNCY recommendation:** explicitly ban coordinated buying signals in ToS, auto-flag posts containing pump-coordination language (time-boxed calls to buy, group coordination language), and publish a channel-level "velocity" metric that shows unusual synchronized activity. The goal is not to catch 100% but to make FRQNCY a bad venue for this.

**Harassment and brigading.** Borrow Mastodon's federated block-list approach inside the platform: trusted moderators publish mute lists that users opt into. Combine with rate-limiting DMs from non-followers (Twitter's approach) and a "no quote-harass" default where quote posts require the original author's opt-in for accounts under 90 days old.

## 5. Legal & Regulatory Landscape (April 2026)

### What a solo dev actually needs to know before launch

**EU Digital Services Act.** FRQNCY launches far below the 45M-monthly-EU-user VLOP threshold. Small and micro enterprises are explicitly exempt from most obligations [source: https://digital-strategy.ec.europa.eu/en/policies/digital-services-act]. What still applies: illegal-content notice-and-action, a designated point of contact, and transparency reporting. Budget: a dedicated abuse email, a 48-hour response SLA for EU illegal-content notices, and a once-yearly transparency post. Cost: near zero if built in from day one.

**US Section 230.** Still largely intact in April 2026, but the landscape is actively shifting. H.R. 6746 (Sunset To Reform Section 230 Act) would sunset §230 at end of 2026; state-court verdicts in K.G.M. v. Meta and New Mexico v. Meta bypassed §230 defenses entirely [source: https://www.congress.gov/bill/119th-congress/house-bill/6746/text]. **Implication:** rely on §230 for user-generated-content immunity, but design moderation as if §230 may not exist — affirmative moderation, clear ToS, a functioning abuse pipeline, and documentation of good-faith action on known harms.

**Crypto/prediction-market ambiguity.** This is the big landmine. The CFTC opened a door to prediction markets via the Polymarket/QCX path, but state gaming authorities are pushing back — Massachusetts and Ohio have enjoined Kalshi sports contracts in early 2026, Nevada and New Jersey went the other way [source: https://www.wealthmanagement.com/advisor-support-platforms/prediction-markets-find-their-regulatory-footing-but-the-boundaries-remain-clear]. Token-gated content and NFT memberships are generally safe if not marketed as investments; staking mechanisms for conviction markets almost certainly require either a regulated intermediary or an explicit points-only design.

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

## Summary

FRQNCY's path is narrow but real: free core product, low-friction Supporter subscription, creator tipping, points-only conviction tracking at launch with a clearly-scoped path to staked v2 behind legal review, and a small optional NFT founding-member drop. Moderation scales with Llama Guard 3 + Discourse-style trust levels + per-channel community mods, backed by a blameless incident playbook the founder commits to in public. Crypto-adjacent threats are real but well-documented; ban coordinated manipulation in ToS, verify handles, and make the platform a bad venue for pump-and-dumps. Legal exposure is manageable if the founder resists the urge to ship staked markets before a lawyer reviews, treats Section 230 as a safety net rather than a strategy, and keeps the EU DSA obligations minimal-but-real from day one. None of this is heroic. It is survivable at $50/mo of infrastructure and one exhausted solo dev — which is the only bar that matters.
