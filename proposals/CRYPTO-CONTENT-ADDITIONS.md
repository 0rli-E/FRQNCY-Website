# Crypto content additions

Concrete, ready-to-paste additions for FRQNCY's crypto pages. Lands primarily on `/v2/crypto/` (the channel) with secondary placement on `/v2/cryptocurrency/` (the topic page in the explore graph). Editorial frame: cooperation over competition, no hype, no techno-utopianism. The teachings live on the site; external links are footnotes.

## 1. The slogan and where it lands

The line is **"Crypto is freedom technology."** It belongs in the hero of `/v2/crypto/`, replacing the current "Projects rated, sectors mapped, conviction stated plainly" deck (which can move down a level into a sub-deck). The eyebrow stays as `crypto.frqncy`. The H1 stays as `Crypto`. The hero description becomes the slogan, followed by one supporting sentence.

Recommended hero copy:

> **Crypto is freedom technology.** Money you actually own. Networks no one can shut off. Rules written in code, not negotiated in private rooms.

Five supporting one-liners that expand the slogan — usable as a rotating subhead, a values strip below the hero, or as section openers across the channel:

1. Self-custody is a civil liberty in software form.
2. A network nobody owns is a network nobody can revoke.
3. The right to transact is the right to participate.
4. Open ledgers turn trust from a promise into a verifiable fact.
5. Programmable money lets cooperation scale without permission.

Tone notes for anything written under this banner: ground every claim in a real mechanism (proof-of-work, public keys, deterministic supply schedules) rather than vibes; treat freedom as a practice, not a slogan; never frame crypto as a replacement for community or wisdom — it's infrastructure that lets both travel further.

## 2. The values of Bitcoin (and crypto more broadly)

A short reference section, suitable for a dedicated block on `/v2/crypto/` or a fuller treatment at `/v2/cryptocurrency/`. Each value gets a one-sentence definition and a 2–3 sentence framing for the sovereign individual.

**Borderlessness.** A bitcoin transaction crosses any border the internet reaches, with no gatekeeper at the edge. For a sovereign individual this means your savings and your livelihood are not hostage to the country you happen to be standing in. It is the quiet end of the postal-era assumption that wealth must travel slower than people.

**Immutability.** Once a block is buried under enough proof-of-work, rewriting it costs more than the world is willing to pay. This matters because the historical record of who owns what stops being editable by whoever is currently in charge. A practice-grounded life needs at least one ledger that cannot be quietly rewritten while you sleep.

**Censorship resistance.** No actor — not a state, not a company, not a coalition — can reliably stop a valid transaction from settling. For a sovereign individual this is the difference between being deplatformed and being ignored: the network does not care who you are, only whether your signature is valid. It is the practical floor under freedom of association in a digital economy.

**Permissionless access.** Anyone with a key and an internet connection can use the network, with no application form. This collapses the gap between the banked and the unbanked into a software install. The ethical weight of this is enormous and easy to forget in places where banking is assumed.

**Scarcity.** Bitcoin's supply is fixed at 21 million, enforced by every node that runs the software. For a sovereign individual this provides a savings instrument that cannot be silently diluted by a printer. Scarcity is not magical; it is a social contract written in code that thousands of independent operators choose to keep.

**Transparency.** Every transaction is publicly auditable on the chain. This means the monetary base is verifiable by anyone, not just trusted intermediaries — a property no fiat system has ever offered. Sovereignty without transparency is just a rumour; transparency turns it into evidence.

**Programmable money.** On networks like Ethereum, value can carry instructions: escrow, vesting, splits, conditional payments. For a sovereign individual this means agreements no longer require a trusted middle party to enforce. Cooperation scales because the contract is the settlement.

**Financial sovereignty.** The ability to hold, send, and receive value without asking anyone's permission. This is the synthesis of the values above: when self-custody, censorship resistance, and permissionless access compound, what emerges is genuine financial agency. It is the precondition for many of the other freedoms FRQNCY cares about.

**Banking the unbanked.** The roughly 1.4 billion adults outside the formal banking system can, in principle, be one phone away from a global financial network. The framing matters: this is not charity but infrastructure removing a gate that should never have been there. Stablecoin remittance corridors and mobile-first wallets are already moving real volume on this thesis.

## 3. The good of crypto

The genuine benefits, with examples and credible voices, framed cooperatively wherever the structure allows.

**Remittances that don't tax the poorest hardest.** Stablecoin rails routinely move money home for a fraction of the 6–8% cut Western Union and friends used to take. Tether and USDC volumes on TRON, Solana, and Base now represent a meaningful share of corridors into the Philippines, Nigeria, and Latin America.

**Open monetary research.** Lyn Alden, Andreas Antonopoulos, David Hoffman, Vitalik Buterin, Hal Finney's archived writing — the educational corpus is unusually generous. Bankless and What Bitcoin Did make the literacy free.

**Cooperative ownership models.** DAOs at their best — Gitcoin, Optimism's RetroPGF, Nouns — are coordination experiments in funding public goods without a state. Imperfect, instructive, and improving.

**Financial inclusion in unstable currencies.** In Argentina, Turkey, Lebanon, and Nigeria, citizens reach for stablecoins because their own currency is being silently confiscated by inflation. This is the most under-reported humanitarian use of crypto.

**Programmable cooperation.** Multisig treasuries, streaming salaries (Sablier, Superfluid), split contracts (0xSplits) let teams cooperate across borders without a holding company. Small groups can now run real economic infrastructure.

**Verifiable identity and reputation.** Ethos Network, ENS, EAS — early but real attempts to make trust legible without making it surveillable.

**A counterweight to monetary debasement.** Bitcoin functions, for those who hold it patiently, as savings technology in an era of deliberate currency dilution. Saifedean Ammous makes this case rigorously in *The Bitcoin Standard*.

## 4. Featured projects to integrate

**Ethos Network** ([ethos.network](https://www.ethos.network/)). Ethos is an on-chain reputation and credibility system, originally built around X accounts and now operating on Base mainnet. Users can review, vouch (by staking ETH), and slash one another, producing a single dynamic credibility score that anyone can verify before transacting or collaborating. The bet is that web3 has a trust problem more than a technology problem, and that reputation — not just balances — should live on the chain. Co-founded by Trevor Thompson (Serpin Taxt) and Ben Walther; raised a $1.75M pre-seed in mid-2024 and shipped Ethos Markets after exiting testnet in early 2025.

**Obi** (placeholder — needs Orlando's input). Noted in `proposals/IDEAS-INBOX.md` as FRQNCY-aligned; Orlando wants a call before this gets a published page. From public search alone the name is ambiguous (multiple builders go by Obi in the crypto and fintech space, including Obi Emetarom of Zone). Recommend leaving the resource entry as a private placeholder until the call clarifies which Obi, what project, and what the FRQNCY-aligned work actually is.

## 5. Suggested resources.json entries

Eight entries below, schema-matched to existing `topicSlug:"cryptocurrency"` rows. Drop into `resources.json` as-is.

```json
{"type":"platform","name":"Ethos Network","desc":"On-chain reputation system on Base. Reviews, ETH-staked vouching, and slashing produce a verifiable credibility score — a serious attempt to put trust, not just balances, on a public ledger.","url":"/platforms/ethos-network/","topicSlug":"cryptocurrency","topicLabel":"Cryptocurrency","topicUrl":"/v2/cryptocurrency/","domain":"Money","domainSlug":"money","external":"https://www.ethos.network/"}
{"type":"person","name":"Trevor Thompson","desc":"Co-founder of Ethos Network (also known as Serpin Taxt). Building on-chain reputation as the missing trust layer for web3.","url":"/people/trevor-thompson/","topicSlug":"cryptocurrency","topicLabel":"Cryptocurrency","topicUrl":"/v2/cryptocurrency/","domain":"Money","domainSlug":"money","external":"https://x.com/SerpinTaxt"}
{"type":"person","name":"Vitalik Buterin","desc":"Co-creator of Ethereum and the most consistent voice for crypto as public-goods infrastructure rather than speculation. His essays on credible neutrality, quadratic funding, and soulbound identity define a generous strand of the field.","url":"/people/vitalik-buterin/","topicSlug":"cryptocurrency","topicLabel":"Cryptocurrency","topicUrl":"/v2/cryptocurrency/","domain":"Money","domainSlug":"money","external":"https://vitalik.eth.limo"}
{"type":"person","name":"Hal Finney","desc":"First person to receive a Bitcoin transaction and one of the original cypherpunks. His 2009 forum posts and end-of-life writing remain among the most thoughtful primary sources on what Bitcoin was meant to become.","url":"/people/hal-finney/","topicSlug":"cryptocurrency","topicLabel":"Cryptocurrency","topicUrl":"/v2/cryptocurrency/","domain":"Money","domainSlug":"money","external":"https://nakamotoinstitute.org/finney/"}
{"type":"person","name":"Saifedean Ammous","desc":"Economist whose The Bitcoin Standard reframed Bitcoin as the latest entrant in a long monetary lineage. A rigorous, sometimes polemical, Austrian-school case for sound money.","url":"/people/saifedean-ammous/","topicSlug":"cryptocurrency","topicLabel":"Cryptocurrency","topicUrl":"/v2/cryptocurrency/","domain":"Money","domainSlug":"money","external":"https://saifedean.com"}
{"type":"book","name":"The Bitcoin Standard","desc":"Saifedean Ammous's history of money culminating in the case for Bitcoin as a credible monetary base. The reference text for the sound-money strand of crypto thought.","url":"/books/the-bitcoin-standard/","topicSlug":"cryptocurrency","topicLabel":"Cryptocurrency","topicUrl":"/v2/cryptocurrency/","domain":"Money","domainSlug":"money","external":"https://saifedean.com/tbs"}
{"type":"book","name":"The Internet of Money","desc":"Andreas Antonopoulos's collected talks on the moral and architectural significance of open monetary networks. The clearest on-ramp for newcomers who want substance, not hype.","url":"/books/the-internet-of-money/","topicSlug":"cryptocurrency","topicLabel":"Cryptocurrency","topicUrl":"/v2/cryptocurrency/","domain":"Money","domainSlug":"money","external":"https://aantonop.com/books/the-internet-of-money-volume-one/"}
{"type":"org","name":"Gitcoin","desc":"Public-goods funding protocol that pioneered quadratic funding for open-source and ecosystem grants. A working example of crypto-native cooperation at scale.","url":"/orgs/gitcoin/","topicSlug":"cryptocurrency","topicLabel":"Cryptocurrency","topicUrl":"/v2/cryptocurrency/","domain":"Money","domainSlug":"money","external":"https://www.gitcoin.co"}
```

## Items flagged for Orlando

- **Obi** — needs disambiguation and the planned call before any resource entry ships. Public search returned no unambiguous match in the FRQNCY-aligned crypto space.
- **Ethos URL** — verified as `https://www.ethos.network/` (not `ethos.com`, which is an unrelated insurance company; not `ethos.io`, which is a defunct earlier project).
- **Hero replacement** — confirm whether "Projects rated, sectors mapped, conviction stated plainly" should move to a sub-deck or be retired entirely once the slogan lands.
- **Trevor Thompson handle** — `@SerpinTaxt` on X is the public handle; confirm preferred external link before publishing the person page.
