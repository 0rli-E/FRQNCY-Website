# FRQNCY Crypto Stack

*Sequenced build plan for the FRQNCY economic layer.*

*Updated: 2026-05-12. Status: pre-build — sequencing, not shipping.*

---

## Why FRQNCY needs its own crypto layer

The graph is the substrate. The fund is one expression of capital on top of it. But the network needs an economic primitive that doesn't depend on extractive intermediaries — a way for value to move between people, projects, and places on FRQNCY without leaving the editorial frame at the door.

Three things the stack has to do:

1. **Let people transact in something that holds value** without sending them into the maw of a generic stablecoin that has its own politics. → **BLNC**
2. **Coordinate participation** across builders, curators, capital, and audience in a way that rewards real contribution and resists capture. → **FRQNY**
3. **Be defensible** against attack — both technical (smart-contract exploits) and economic (governance capture, monetary attack). → **Veto Council**

This doc sequences the build.

---

## Layer A — Stablecoin: BLNC (Balance) *(task #25)*

### What it is

A FRQNCY-aligned stablecoin pegged to the USD (initially) and over-collateralised by a basket of FRQNCY-screened assets. The name *Balance* does double work:

- **Balance** as in your wallet — the unit of account.
- **Balance** as in the editorial line — a currency that doesn't push you into either crypto-degen or fiat-passivity.

### Why not just use USDC

USDC and USDT solve the unit-of-account problem but route economic activity through issuers whose interests are not FRQNCY's interests. BLNC keeps the substrate inside the network and turns transaction volume into protocol fees that fund the work.

### Open questions

- Collateral mix — yield-bearing US treasuries? RWA tokens? Self-collateralised + governance-backstopped? Need to model under stress before committing.
- Chain choice — Ethereum L1 for credibility, an L2 for cost, or both with a canonical bridge. Lean toward Base or Arbitrum for v0, mirror on Solana later.
- Mint/redeem gating — fully permissionless or whitelisted issuance partners?
- Audit cadence — quarterly, monthly, or live-attestation feed.

---

## Layer B — Governance token: FRQNY *(tasks #59 #35)*

### What it is

The FRQNCY governance and coordination token. **Four functions** (canonical, in order of priority):

1. **Fund** — Holders can direct capital toward FRQNCY-incubated projects via the Launchpad mechanism (task #55). Token-weighted votes select recipients; FRQNCY editorial board holds a veto on alignment.
2. **Coordination** — Used to coordinate work across builders, curators, and operators. Bounties paid in FRQNY; contributor reputation accrues on-chain.
3. **Incentivisation** — Rewards curators who add real value (high-quality bed contributions, durable picks). Slashes for spam, plagiarism, or sock-puppeting.
4. **Governance** — Parameter changes, treasury allocations, editorial line shifts. *Bounded* — see Veto Council below.

### Why not just an NFT or a points system

Points work until participants want exit. A token with credible exit pressure forces the protocol to be honest about what value it actually creates. NFTs are good for membership but bad for coordinated decisions across a thousand small choices.

### Veto Council *(task #35)*

Pure token-weighted governance is fragile. A monetary attacker with enough capital can flip the vote and drain the treasury. The **FRQNY Veto Council** is the security backstop:

- A small group of council members (initial: 7, can expand to 13) with the ability to *veto*, but not *initiate*, governance actions.
- Council members are elected for staggered terms, with reputational and on-chain stake. Removal requires a supermajority of *both* tokenholders and the rest of the council.
- The council's only power is the veto. Everything they want to *do* still has to pass normal governance.
- Veto threshold: 5 of 7. High enough that one captured member can't block; low enough that a coordinated monetary attack still has to capture multiple council members on top of the tokenholder base.

The role of the council is closer to a constitutional court than a board. They can stop, not steer.

---

## Layer C — Liquidity, custody, wrappers *(task #31)*

### LPs

BLNC needs deep liquidity against major pairs (USDC, ETH, BTC). v0: Curve-style stableswap pool + Uniswap v3 concentrated liquidity. Incentivise with FRQNY emissions, capped and time-decaying.

FRQNY needs liquidity against ETH and BLNC. v0: Uniswap v3 + an integrated AMM on the FRQNCY frontend so users don't need to leave the site to swap.

### Custody

Multi-sig on the treasury, threshold 5-of-9. Council members hold 4 signatures; FRQNCY core team holds 5. This means *both* groups have to agree on any spend.

For users — non-custodial by default (their wallet, their keys). Optional managed-custody for high-touch capital partners who can't operate self-custody, routed through a regulated partner (Anchorage or similar).

### Wrappers (Orb Markets style)

Some FRQNCY users will hold tokenised positions in offline assets: a fractional ownership in a retreat property, a yield share in an aligned business, a contract right in a charter city. The wrapper architecture (referenced via Orb Markets) lets these positions exist on-chain as transferable tokens while the underlying claim is enforced off-chain by the wrapping entity.

This is the layer that makes the FRQNCY graph composable with real-world assets without forcing every project to do its own legal engineering.

---

## Layer D — AI battletest *(task #30)*

Before any token goes live, the stack gets adversarially tested by an ensemble of LLM-driven attackers.

### What's tested

- Smart-contract surface — standard exploits, novel attacks, MEV vulnerability.
- Governance dynamics — vote-buying, coordinated whale attacks, council-capture scenarios.
- Stress scenarios — bank-run on BLNC, FRQNY price collapse, oracle failure, bridge exploit.
- Economic — incentive misalignment, free-rider dynamics, sybil resistance.

### What's the bar

The battletest is not "find every bug" — it's "if we ship this and a well-funded adversary spends a year attacking it, what's the worst they can do, and is it survivable?" The stack ships when the worst credible attack costs more than it earns.

---

## Layer E — Listing and access

### Echo *(task #57)*

Echo.xyz is the listing platform of choice — high-quality investor base, aligned community, the right curation discipline. FRQNCY lists FRQNY on Echo before considering CEX listings. The Echo allocation funds initial liquidity and treasury runway.

### CEX listings

Not the priority. After Echo + on-chain liquidity is deep, CEX listings happen *opportunistically*, not proactively. Coinbase and Kraken are the only ones we'd push for; the rest can come to us.

---

## Layer F — Crypto.frqncy *(tasks #87 #71 #81 #92)*

The crypto sub-site that hosts the stack and the research.

### Crypto Overview page *(#87)*

`/crypto/` or `crypto.frqncy.network` — single page that explains the stack from the top: BLNC, FRQNY, Veto Council, Launchpad, audit reports, current parameters, treasury status. Live data, not screenshots.

### Crypto Research *(#71 #81)*

A research stream — written analysis, ratings, sector deep-dives. The 630+ projects already ranked in `/v2/crypto/projects.html` is the foundation; the stream sits on top.

Initial reading list:
- Frame: *The Network State* (Balaji Srinivasan), *Bitcoin Standard* (Saifedean Ammous), *Cypherpunks* (Assange et al.)
- DeFi mechanism: *DeFi and the Future of Finance* (Campbell Harvey), Curve and Uniswap papers, Liquity / Reflexer documentation
- Stablecoin design: MakerDAO MIPs, FRAX whitepapers, LST docs (Lido, Rocket Pool)
- Governance: Vitalik on governance ("Moving beyond coin voting governance"), Compound and Aave proposals histories, Optimism Citizens' House design

### Kickoff meta *(#92)*

Sequencing the actual build:

1. Manifest and treasury setup — multi-sig, initial allocation, council election design. *T+0.*
2. BLNC v0 — testnet, audit, mainnet beta with whitelisted minters. *T+3 months.*
3. FRQNY v0 — token contract, distribution model, vesting curves. *T+5 months.*
4. Liquidity bootstrap on Echo. *T+6 months.*
5. Veto Council elected. *T+6 months.*
6. AI battletest. *T+6–9 months.*
7. Public mainnet, full launchpad live. *T+9–12 months.*

These dates are anchored to when the *content* layer is dense enough to support the *capital* layer. The graph has to be real before the economy on top of it is.

---

## What's deliberately out of scope (for now)

- Cross-chain native — v0 lives on one chain, bridges later.
- Lending markets on BLNC — possible later, not v0.
- A FRQNCY DEX — Uniswap is fine; we're a curator, not an exchange.
- An NFT collection. We are a piece of network art (see manifesto), but we don't need to issue a JPEG collection to prove it.

---

*Living doc. Section additions, edits, and structural changes get committed; assumptions get re-examined at every stage gate.*
