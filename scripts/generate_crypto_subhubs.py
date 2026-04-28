#!/usr/bin/env python3
"""
Generate the 21 Crypto sub-hub pages in the FRQNCY artwork style.

Each sub-hub becomes its own commissioned piece:
  - Cormorant + Jost typography, navy + gold + sector accent palette
  - Hero with sector glyph signature (SVG), eyebrow, italic h1, descriptor, quote
  - Editorial prelude
  - Sector projects grid (filtered + tier-grouped from v2/crypto/crypto-projects.json)
  - Bleed image
  - Five-step practice
  - CTA banner (Crypto hub + Fund)
  - Closing seed line
  - Shared chrome via /v2/crypto/_artwork.css

Run:  python3 scripts/generate_crypto_subhubs.py
"""
from __future__ import annotations
import html as _h
import json
import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CRYPTO = ROOT / "v2" / "crypto"
PROJECTS = json.loads((CRYPTO / "crypto-projects.json").read_text())["projects"]


# ── Sector glyph SVG library ──────────────────────────────────────────
# Each glyph is a self-contained <svg>...</svg> with class hooks that the
# shared CSS animates (.glyph-rotate, .glyph-pulse-1, .glyph-pulse-2, etc.).
def glyph(kind: str, accent: str, warm: str) -> str:
    common_defs = f"""
    <defs>
      <radialGradient id="gGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%"  stop-color="{accent}" stop-opacity="0.34"/>
        <stop offset="60%" stop-color="#0B1C3D" stop-opacity="0.08"/>
        <stop offset="100%" stop-color="#0B1C3D" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="gEdge" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%"  stop-color="{warm}" stop-opacity="0.85"/>
        <stop offset="100%" stop-color="{accent}" stop-opacity="0.7"/>
      </linearGradient>
    </defs>
    <circle cx="0" cy="0" r="92" fill="url(#gGlow)"/>"""

    pulses = f"""
      <circle cx="0" cy="0" r="22" fill="none" stroke="{accent}" stroke-opacity="0.55" stroke-width="0.5" class="glyph-pulse-1"/>
      <circle cx="0" cy="0" r="32" fill="none" stroke="rgba(196,151,58,0.42)" stroke-width="0.4" class="glyph-pulse-2"/>"""

    if kind == "mountain":  # bitcoin / sov — a peak / sound foundation
        body = f"""
      <g class="glyph-rotate-rev">
        <circle cx="0" cy="0" r="78" fill="none" stroke="rgba(245,248,251,0.20)"
                stroke-width="0.4" stroke-dasharray="3 4"/>
      </g>
      <g class="glyph-rotate" stroke="url(#gEdge)" stroke-width="0.7" fill="none">
        <polygon points="-58,40 -22,-32 14,18 38,-12 60,40"/>
        <polygon points="-46,40 -18,-8 8,18 30,-2 52,40" opacity="0.55"/>
      </g>
      <line x1="-65" y1="40" x2="65" y2="40" stroke="{warm}" stroke-opacity="0.6" stroke-width="0.6"/>
      <circle cx="-22" cy="-32" r="3.5" fill="{warm}"/>"""
    elif kind == "lattice":  # l1 / l2 / modular — interlocking layered grids
        body = f"""
      <g class="glyph-rotate" stroke="url(#gEdge)" stroke-width="0.6" fill="none">
        <rect x="-50" y="-50" width="100" height="100" transform="rotate(15)"/>
        <rect x="-50" y="-50" width="100" height="100" transform="rotate(-15)"/>
        <rect x="-30" y="-30" width="60" height="60" opacity="0.6"/>
      </g>
      <g class="glyph-rotate-rev" stroke="rgba(245,248,251,0.20)" stroke-width="0.35" stroke-dasharray="2 4" fill="none">
        <circle cx="0" cy="0" r="68"/>
      </g>"""
    elif kind == "loop":  # defi — open-loop / counterparty replaced
        body = f"""
      <g class="glyph-rotate" stroke="url(#gEdge)" stroke-width="0.7" fill="none">
        <ellipse cx="-18" cy="0" rx="34" ry="50"/>
        <ellipse cx="18"  cy="0" rx="34" ry="50"/>
      </g>
      <g class="glyph-rotate-rev" stroke="rgba(245,248,251,0.18)" stroke-width="0.4" fill="none" stroke-dasharray="2 5">
        <circle cx="0" cy="0" r="72"/>
      </g>"""
    elif kind == "key":  # privacy / neobanks — key + cipher
        body = f"""
      <g class="glyph-rotate" stroke="url(#gEdge)" stroke-width="0.7" fill="none">
        <circle cx="-22" cy="0" r="26"/>
        <line x1="4" y1="0" x2="56" y2="0"/>
        <line x1="38" y1="0" x2="38" y2="14"/>
        <line x1="50" y1="0" x2="50" y2="10"/>
      </g>
      <circle cx="-22" cy="0" r="6" fill="{warm}"/>"""
    elif kind == "spiral":  # ai — emergent intelligence
        body = f"""
      <g class="glyph-rotate" fill="none" stroke="url(#gEdge)" stroke-width="0.7">
        <path d="M0,0 m-2,0 a2,2 0 1,0 4,0 a4,4 0 0,1 -8,0 a8,8 0 0,1 16,0 a16,16 0 0,1 -32,0 a32,32 0 0,1 64,0 a48,48 0 0,1 -72,0"/>
      </g>"""
    elif kind == "controller":  # gamefi — player + 4 corners
        body = f"""
      <g class="glyph-rotate" stroke="url(#gEdge)" stroke-width="0.6" fill="none">
        <rect x="-50" y="-30" width="100" height="60" rx="14"/>
        <circle cx="-26" cy="0" r="9"/>
        <circle cx="26"  cy="0" r="4" fill="{warm}"/>
      </g>"""
    elif kind == "graph":  # socialfi / desci — node graph
        body = f"""
      <g class="glyph-rotate" stroke="url(#gEdge)" stroke-width="0.55" fill="rgba(245,248,251,0.04)">
        <circle cx="0"   cy="-44" r="6"/>
        <circle cx="38"  cy="-22" r="6"/>
        <circle cx="38"  cy="22"  r="6"/>
        <circle cx="0"   cy="44"  r="6"/>
        <circle cx="-38" cy="22"  r="6"/>
        <circle cx="-38" cy="-22" r="6"/>
        <line x1="0" y1="-44" x2="38" y2="-22"/>
        <line x1="38" y1="-22" x2="38" y2="22"/>
        <line x1="38" y1="22" x2="0" y2="44"/>
        <line x1="0" y1="44" x2="-38" y2="22"/>
        <line x1="-38" y1="22" x2="-38" y2="-22"/>
        <line x1="-38" y1="-22" x2="0" y2="-44"/>
        <line x1="0" y1="-44" x2="0" y2="44" opacity="0.35"/>
        <line x1="38" y1="-22" x2="-38" y2="22" opacity="0.35"/>
        <line x1="-38" y1="-22" x2="38" y2="22" opacity="0.35"/>
      </g>
      <circle cx="0" cy="0" r="4" fill="{warm}"/>"""
    elif kind == "anchor":  # stablecoins — pegged dollar
        body = f"""
      <g class="glyph-rotate" stroke="url(#gEdge)" stroke-width="0.6" fill="none">
        <line x1="0" y1="-50" x2="0" y2="38"/>
        <circle cx="0" cy="-50" r="6"/>
        <path d="M-30,38 a30,30 0 0,0 60,0"/>
        <line x1="-22" y1="-30" x2="22" y2="-30"/>
      </g>"""
    elif kind == "bridge":  # rwa / oracles / interop — bridge
        body = f"""
      <g class="glyph-rotate" stroke="url(#gEdge)" stroke-width="0.6" fill="none">
        <path d="M-58,12 q58,-50 116,0"/>
        <line x1="-58" y1="12" x2="58" y2="12"/>
        <line x1="-30" y1="12" x2="-30" y2="40"/>
        <line x1="0"   y1="12" x2="0"   y2="40"/>
        <line x1="30"  y1="12" x2="30"  y2="40"/>
      </g>"""
    elif kind == "pulse":  # depin — physical signal nodes
        body = f"""
      <g class="glyph-rotate" stroke="url(#gEdge)" stroke-width="0.55" fill="none">
        <circle cx="-44" cy="-22" r="6"/>
        <circle cx="44"  cy="-22" r="6"/>
        <circle cx="0"   cy="44"  r="6"/>
        <circle cx="0"   cy="0"   r="3" fill="{warm}"/>
        <line x1="-44" y1="-22" x2="0" y2="0"/>
        <line x1="44"  y1="-22" x2="0" y2="0"/>
        <line x1="0"   y1="44"  x2="0" y2="0"/>
      </g>
      <circle cx="-44" cy="-22" r="14" fill="none" stroke="{warm}" stroke-opacity="0.35" stroke-dasharray="2 3"/>
      <circle cx="44"  cy="-22" r="14" fill="none" stroke="{warm}" stroke-opacity="0.35" stroke-dasharray="2 3"/>
      <circle cx="0"   cy="44"  r="14" fill="none" stroke="{warm}" stroke-opacity="0.35" stroke-dasharray="2 3"/>"""
    elif kind == "shield":  # staking — security marketplace
        body = f"""
      <g class="glyph-rotate" stroke="url(#gEdge)" stroke-width="0.6" fill="none">
        <path d="M0,-50 L42,-30 L42,18 Q42,38 0,52 Q-42,38 -42,18 L-42,-30 Z"/>
        <path d="M0,-30 L24,-18 L24,12 Q24,24 0,32 Q-24,24 -24,12 L-24,-18 Z" opacity="0.55"/>
      </g>"""
    elif kind == "compass":  # predictions — future direction
        body = f"""
      <g class="glyph-rotate" stroke="url(#gEdge)" stroke-width="0.55" fill="none">
        <circle cx="0" cy="0" r="58"/>
        <circle cx="0" cy="0" r="42"/>
        <line x1="0" y1="-58" x2="0" y2="-46"/>
        <line x1="0" y1="58"  x2="0" y2="46"/>
        <line x1="-58" y1="0" x2="-46" y2="0"/>
        <line x1="58"  y1="0" x2="46"  y2="0"/>
      </g>
      <polygon points="0,-30 8,0 0,30 -8,0" fill="{warm}" opacity="0.85"/>"""
    elif kind == "launch":  # icm — issuance curve
        body = f"""
      <g class="glyph-rotate-rev" stroke="rgba(245,248,251,0.18)" stroke-width="0.35" stroke-dasharray="2 4" fill="none">
        <circle cx="0" cy="0" r="72"/>
      </g>
      <g class="glyph-rotate" fill="none" stroke="url(#gEdge)" stroke-width="0.7">
        <path d="M-50,42 Q-20,-50 50,-32"/>
        <line x1="-50" y1="42" x2="50" y2="42"/>
      </g>
      <circle cx="50" cy="-32" r="5" fill="{warm}"/>"""
    elif kind == "meme":  # memes — concentric attention
        body = f"""
      <g class="glyph-rotate" stroke="url(#gEdge)" stroke-width="0.55" fill="none">
        <circle cx="0" cy="0" r="58"/>
        <circle cx="0" cy="0" r="42"/>
        <circle cx="0" cy="0" r="26"/>
        <circle cx="0" cy="0" r="10" fill="{warm}" fill-opacity="0.85"/>
      </g>
      <g class="glyph-rotate-rev" stroke="{warm}" stroke-width="0.4" stroke-dasharray="2 6" fill="none">
        <circle cx="0" cy="0" r="74"/>
      </g>"""
    elif kind == "frame":  # nfts — owned image
        body = f"""
      <g class="glyph-rotate" stroke="url(#gEdge)" stroke-width="0.55" fill="rgba(245,248,251,0.03)">
        <rect x="-50" y="-50" width="100" height="100" rx="2"/>
        <rect x="-32" y="-32" width="64" height="64" rx="1" opacity="0.5"/>
        <line x1="-32" y1="-32" x2="32" y2="32" opacity="0.4"/>
        <line x1="32"  y1="-32" x2="-32" y2="32" opacity="0.4"/>
      </g>"""
    else:
        body = ""

    return f"""<svg class="hero-glyph" viewBox="-100 -100 200 200" aria-hidden="true">
      {common_defs}
      {body}
      {pulses}
      <circle cx="0" cy="0" r="11" fill="rgba(247,147,26,0.04)" stroke="{warm}" stroke-opacity="0.55" stroke-width="0.55"/>
      <circle cx="0" cy="0" r="3.5" fill="{warm}"/>
    </svg>"""


# ── Sector configs ────────────────────────────────────────────────────
# Each entry drives a single page. Categories filter PROJECTS; chains too.
# 'practice' is 5 sector-specific actions. 'closing' is the seed triad.
def base_practice():
    """Default practice list — overridden where sector-specific work exists."""
    return [
        ("Hold your own keys.",
         "Move a meaningful position off an exchange and onto a hardware wallet you control. "
         "The first time it works, the abstraction stops being abstract."),
        ("Read one whitepaper a month.",
         "Develop a feel for how new monetary systems are actually proposed. The point is not to "
         "memorise the cryptography. The point is to recognise good design when you see it."),
        ("Send a transaction across a border.",
         "Bypass the bank, the wire-transfer fee, and the three-business-day delay. The lived "
         "experience of doing this once explains more than any essay can."),
        ("Stake conviction, not capital first.",
         "Pick one project you can write a paragraph about — what it does, why it matters, what "
         "would change your mind. Position size after that, not before."),
        ("Hold across cycles.",
         "The price chart is the worst lens on the technology. Most of the people who lose money "
         "in crypto sold a sound thesis at the wrong cycle moment."),
    ]


SECTORS = {
    "bitcoin": dict(
        title="Bitcoin Ecosystem",
        h1="Bitcoin",
        eyebrow="Sector · Bitcoin · The original freedom technology",
        accent="#F7931A", warm="#FFB257",
        glyph="mountain",
        hero_bg="https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&q=85&w=2400",
        closing_bg="https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&q=85&w=2400",
        desc="Bitcoin and the protocols that turn sound money into a usable layer. Lightning for payments, Fedimint for community custody, Cashu for ecash, Liquid for sidechain assets, Nostr for the relay graph that messages and value can ride together.",
        quote=("If you don't believe it or don't get it, I don't have time to try to convince you, sorry.",
               "Satoshi Nakamoto · 2010"),
        prelude=[
            "Bitcoin is the only monetary asset in human history with a fixed supply that no committee, treasury, or central bank can debase. Twenty-one million units, ever, public from the genesis block forward.",
            "What follows are the protocols, layers, and tools that extend the base property — payments at the speed of light, community-scale custody, privacy-preserving issuance, the social layer that runs on the same key.",
        ],
        bleed_cap="One ledger. Twenty-one million units. <em>Public from genesis forward.</em>",
        cats=["Bitcoin", "Store of Value"],
        chains=["Bitcoin", "Lightning", "Liquid"],
        keywords=["bitcoin", "lightning", "fedimint", "cashu", "liquid", "nostr"],
        practice=base_practice(),
        closing=("Sound money you can hold yourself.",
                 "A network nobody can switch off.",
                 "<em>The first thing to fix; the hardest to defend.</em>",
                 "Bitcoin is the floor."),
    ),
    "sov": dict(
        title="Store of Value",
        h1="Store of Value",
        eyebrow="Sector · Store of Value · Scarcity without permission",
        accent="#F7931A", warm="#FFB257",
        glyph="mountain",
        hero_bg="https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&q=85&w=2400",
        closing_bg="https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&q=85&w=2400",
        desc="Digital commodities. Assets whose supply curves are public, whose issuance schedules are predictable, whose ownership cannot be revoked by an intermediary. The opposite of paper money.",
        quote=("In the absence of the gold standard, there is no way to protect savings from confiscation through inflation.",
               "Alan Greenspan · 1966"),
        prelude=[
            "A store of value is a question, not a category. Will it still be worth something in twenty years? In a hundred? Under what conditions does the answer flip?",
            "The assets in this sector pass three tests: a supply curve set in code rather than policy, a network too distributed to capture, and a thesis that does not depend on a chart.",
        ],
        bleed_cap="Scarcity is a property of the protocol, <em>not a promise of the issuer.</em>",
        cats=["Store of Value"],
        keywords=["store of value", "digital gold", "scarcity"],
        practice=base_practice(),
        closing=("A unit nobody can print more of.",
                 "A ledger nobody can rewrite.",
                 "<em>A reserve that does not ask permission to exist.</em>",
                 "Scarcity, recovered."),
    ),
    "l1": dict(
        title="Layer 1s",
        h1="Layer 1s",
        eyebrow="Sector · L1 · Sovereign base chains",
        accent="#7B61FF", warm="#A99CFF",
        glyph="lattice",
        hero_bg="https://images.unsplash.com/photo-1493612276216-ee3925520721?auto=format&fit=crop&q=85&w=2400",
        closing_bg="https://images.unsplash.com/photo-1493612276216-ee3925520721?auto=format&fit=crop&q=85&w=2400",
        desc="Independent consensus, independent token, independent security model. Each L1 is a sovereign network running its own time and its own truth. The base layer everything else builds on top of.",
        quote=("The strength of a chain lies in the independence of its links.",
               "after Vitalik · 2016"),
        prelude=[
            "Every Layer 1 is an attempt to answer one question: what is the right tradeoff between throughput, decentralisation, and finality? There is no universal answer. There are only different settlements of the same constraint.",
            "What follows is the working set — the chains FRQNCY actually watches because their consensus model, validator distribution, or token economics extend the freedom-technology thesis in a different direction.",
        ],
        bleed_cap="A new base layer is a new <em>monetary jurisdiction.</em>",
        cats=["L1", "Infrastructure"],
        chains=["Solana", "Sui", "Aptos", "Avalanche", "TON", "Cosmos", "NEAR", "Cardano"],
        practice=base_practice(),
        closing=("Independent consensus.",
                 "Independent issuance.",
                 "<em>Independent truth.</em>",
                 "An L1 is a country."),
    ),
    "l2": dict(
        title="Layer 2s",
        h1="Layer 2s",
        eyebrow="Sector · L2 · Inheriting Ethereum's security",
        accent="#50E2C1", warm="#7BEDD2",
        glyph="lattice",
        hero_bg="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=85&w=2400",
        closing_bg="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=85&w=2400",
        desc="Rollups and validity-proof systems that scale Ethereum without compromising its security. The bet that the base layer should optimise for finality and the execution layer for throughput.",
        quote=("Rollups inherit security from their base layer. That is the whole trick.",
               "Vitalik Buterin · 2021"),
        prelude=[
            "Layer 2s are not separate chains. They are scaling primitives that lean on Ethereum's economic security, doing the heavy execution off-chain and posting compressed proofs back. The base layer never has to scale; the systems built on top of it do.",
            "The L2s in this sector compete on three axes: proof system (optimistic vs zero-knowledge), data availability (on-chain vs off-chain), and ecosystem (DeFi, gaming, social).",
        ],
        bleed_cap="The base layer holds the truth. <em>The L2 holds the speed.</em>",
        cats=["L2", "Infrastructure"],
        chains=["Arbitrum", "Optimism", "Base", "ZkSync", "Linea", "Scroll", "Blast", "Mantle"],
        practice=base_practice(),
        closing=("Speed without permission.",
                 "Throughput without trust.",
                 "<em>Settlement still on Ethereum.</em>",
                 "The bet pays off."),
    ),
    "defi": dict(
        title="DeFi",
        h1="DeFi",
        eyebrow="Sector · DeFi · Code as counterparty",
        accent="#3498DB", warm="#5FAEE0",
        glyph="loop",
        hero_bg="https://images.unsplash.com/photo-1605792657660-596af9009e82?auto=format&fit=crop&q=85&w=2400",
        closing_bg="https://images.unsplash.com/photo-1605792657660-596af9009e82?auto=format&fit=crop&q=85&w=2400",
        desc="Lending, exchange, derivatives, yield — operating without banks, brokers, or clearing houses. The middle of every traditional financial transaction replaced by a smart contract anyone can read, anyone can call.",
        quote=("Smart contracts are the lawyer that does not get tired, does not lie, and does not bill by the hour.",
               "Andreas Antonopoulos · 2016"),
        prelude=[
            "DeFi is what happens when financial primitives stop being a privilege and start being a public good. Lending, borrowing, market-making, derivatives — every one of them re-implemented as transparent code rather than opaque counterparty.",
            "The sector goes through cycles, breaks under stress, and recovers in different shape every time. What persists is the architectural fact: an entire stack of financial services running without permission.",
        ],
        bleed_cap="Finance without intermediaries. <em>The contract is the counterparty.</em>",
        cats=["DeFi", "DEX", "Money Market", "Yield", "Lending", "Stablecoin"],
        practice=base_practice(),
        closing=("Lending without a bank.",
                 "Trading without a broker.",
                 "<em>Settlement without a clearing house.</em>",
                 "The middle, removed."),
    ),
    "privacy": dict(
        title="Privacy",
        h1="Privacy",
        eyebrow="Sector · Privacy · A right, not a privilege",
        accent="#C88CFF", warm="#DDB1FF",
        glyph="key",
        hero_bg="https://images.unsplash.com/photo-1633265486064-086b219458ec?auto=format&fit=crop&q=85&w=2400",
        closing_bg="https://images.unsplash.com/photo-1633265486064-086b219458ec?auto=format&fit=crop&q=85&w=2400",
        desc="Cash is private by default. Most blockchains are transparent by default. Privacy crypto is the work to put the floor back where it should be — financial privacy as a precondition for financial freedom.",
        quote=("Privacy is necessary for an open society in the electronic age. Privacy is not secrecy.",
               "Eric Hughes · A Cypherpunk's Manifesto · 1993"),
        prelude=[
            "Cash is private. The cheque is private. The handshake is private. The default state of human commerce, for centuries, has been that two parties to a transaction know about it and nobody else does.",
            "Public blockchains broke that default. Privacy crypto is the work to put it back — zero-knowledge proofs, ring signatures, mixing protocols, shielded transactions. None of these are about hiding from law. They are about restoring the baseline of what private commerce already was.",
        ],
        bleed_cap="Cash is private. <em>The blockchain should be too.</em>",
        cats=["Privacy"],
        keywords=["zcash", "monero", "privacy", "shielded", "zero-knowledge", "tornado", "railgun"],
        practice=base_practice(),
        closing=("A floor, not a ceiling.",
                 "A right, not a permission.",
                 "<em>The default state of cash, recovered for the digital age.</em>",
                 "Privacy is freedom's substrate."),
    ),
    "ai": dict(
        title="Crypto × AI",
        h1="Crypto × AI",
        eyebrow="Sector · AI · Decentralised intelligence",
        accent="#E74C3C", warm="#EE7B6F",
        glyph="spiral",
        hero_bg="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=85&w=2400",
        closing_bg="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=85&w=2400",
        desc="If artificial intelligence is the most consequential technology of the century, it cannot end up controlled by three companies. The intersection of crypto and AI is the work to keep compute, models, agents, and data permissionless.",
        quote=("Decentralisation is not an aesthetic. It is the only honest answer to the alignment problem.",
               "FRQNCY editorial"),
        prelude=[
            "Centralised AI labs train the most capable models in the world on infrastructure no one outside their walls can audit. Crypto × AI is the parallel track — open compute markets, open model weights, open agent frameworks, all coordinated by tokenised incentives that anyone can join.",
            "The sector is young and the failure modes are real. What persists is the architectural commitment: if intelligence is going to compound, the substrate that intelligence runs on cannot be a black box.",
        ],
        bleed_cap="If AI is the century's lever, <em>the fulcrum cannot be private.</em>",
        cats=["AI", "Infrastructure"],
        keywords=["ai", "agent", "compute", "inference", "model"],
        practice=base_practice(),
        closing=("Compute, decentralised.",
                 "Models, open.",
                 "<em>Agents, ownable.</em>",
                 "The substrate stays neutral."),
    ),
    "gamefi": dict(
        title="GameFi & Metaverse",
        h1="GameFi",
        eyebrow="Sector · GameFi · Player-owned worlds",
        accent="#2ECC71", warm="#5EE294",
        glyph="controller",
        hero_bg="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=85&w=2400",
        closing_bg="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=85&w=2400",
        desc="Worlds where the assets you earn or buy are yours, not the studio's. Where time invested produces ownership, not just badges. Where the game economy survives the studio that built it.",
        quote=("If you cannot leave the game with what you earned, you were never really playing.",
               "FRQNCY editorial"),
        prelude=[
            "The first generation of GameFi over-promised and under-delivered. The second generation is doing the harder work — making the games actually fun first, then letting the on-chain layer do what it does well: portable assets, transparent economies, and player-driven secondary markets.",
            "What lives below is the working set. The games whose tokens have a reason to exist beyond the launch incentive.",
        ],
        bleed_cap="A world the player owns, <em>not the studio.</em>",
        cats=["Gaming", "GameFi"],
        keywords=["game", "metaverse", "play"],
        practice=base_practice(),
        closing=("Assets that leave the game.",
                 "Economies that outlive the studio.",
                 "<em>Time that compounds into ownership.</em>",
                 "The player is sovereign."),
    ),
    "socialfi": dict(
        title="SocialFi & Identity",
        h1="SocialFi",
        eyebrow="Sector · SocialFi · Your graph, your rails",
        accent="#9A4DFF", warm="#B884FF",
        glyph="graph",
        hero_bg="https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?auto=format&fit=crop&q=85&w=2400",
        closing_bg="https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?auto=format&fit=crop&q=85&w=2400",
        desc="The social graph as a public good rather than a private moat. Identity, content, and following relationships that travel with the user across applications. Whatever app you switch to, your network and history come with you.",
        quote=("If your followers can be deleted by a Trust & Safety committee, they were never your followers.",
               "FRQNCY editorial"),
        prelude=[
            "Web2 social platforms made the network effect the thing they sold. SocialFi is the architectural reversal — protocols where the graph is public, the identity is portable, and the application layer competes on user experience rather than lock-in.",
            "The early entries vary in approach: Lens, Farcaster, Nostr each move the locus of control to a different layer. What unites them is the commitment that the user, not the platform, owns the relationship.",
        ],
        bleed_cap="Your graph survives the platform <em>you got it on.</em>",
        cats=["SocialFi", "Decentralized Social", "Identity"],
        keywords=["social", "graph", "identity", "lens", "farcaster", "nostr"],
        practice=base_practice(),
        closing=("Identity that travels.",
                 "A graph that doesn't get deleted.",
                 "<em>Relationships that outlive the app.</em>",
                 "The user is the network."),
    ),
    "stablecoins": dict(
        title="Stablecoins",
        h1="Stablecoins",
        eyebrow="Sector · Stablecoins · Digital dollars on open rails",
        accent="#2775CA", warm="#5C9EE2",
        glyph="anchor",
        hero_bg="https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&q=85&w=2400",
        closing_bg="https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&q=85&w=2400",
        desc="Tokens that hold a stable peg — usually to the dollar, sometimes to a basket, sometimes to a synthetic. Stablecoins are the everyday rails that make on-chain commerce usable for anyone who isn't trying to speculate.",
        quote=("The stablecoin is the killer app of crypto, hiding in plain sight.",
               "Lyn Alden · 2024"),
        prelude=[
            "Stablecoins outrun every other use case in raw volume because they are the only piece of crypto that someone can use without thinking about crypto. Send dollars to anyone, anywhere, in seconds, for a fee that approaches zero.",
            "The model splits three ways: fiat-backed (USDC, USDT), crypto-collateralised (DAI, LUSD), and synthetic delta-neutral (Ethena). Each tradeoff differs; the property they share is dollar-equivalence on rails the dollar itself does not own.",
        ],
        bleed_cap="A dollar that moves at the speed of light <em>and asks no one for permission.</em>",
        cats=["Stablecoin", "Payments"],
        practice=base_practice(),
        closing=("A dollar that moves anywhere.",
                 "A peg the protocol holds.",
                 "<em>Rails that aren't owned by the issuer.</em>",
                 "Usable money, finally."),
    ),
    "rwa": dict(
        title="Real World Assets",
        h1="Real World Assets",
        eyebrow="Sector · RWA · Treasuries, credit, equities — tokenised",
        accent="#1652F0", warm="#4F84F5",
        glyph="bridge",
        hero_bg="https://images.unsplash.com/photo-1543699936-c901ddbf0c05?auto=format&fit=crop&q=85&w=2400",
        closing_bg="https://images.unsplash.com/photo-1543699936-c901ddbf0c05?auto=format&fit=crop&q=85&w=2400",
        desc="Government bonds, corporate credit, equities, real estate — bridged on-chain with the same composability and 24/7 settlement that crypto-native assets have always had. The legacy financial system meeting the new rails.",
        quote=("The biggest crypto innovation of the next decade may be making boring assets liquid.",
               "FRQNCY editorial"),
        prelude=[
            "RWA is the boring revolution. Tokenising a US Treasury bill is not a flashy story; making it tradeable 24/7, divisible to a dollar, and accessible to anyone with an internet connection is.",
            "The protocols below are the bridge between the legacy financial system and the new rails. Where the bridge holds, traditional yield becomes available without traditional gatekeeping.",
        ],
        bleed_cap="A treasury bill, <em>portable.</em>",
        cats=["RWA"],
        keywords=["rwa", "treasur", "real world", "tokenis", "tokenized"],
        practice=base_practice(),
        closing=("Boring assets, liquid.",
                 "Legacy yield, on-chain.",
                 "<em>Access without gatekeepers.</em>",
                 "The bridge holds."),
    ),
    "depin": dict(
        title="DePIN",
        h1="DePIN",
        eyebrow="Sector · DePIN · Physical networks, token-coordinated",
        accent="#00D4AA", warm="#3FE0BD",
        glyph="pulse",
        hero_bg="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=85&w=2400",
        closing_bg="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=85&w=2400",
        desc="Decentralised Physical Infrastructure Networks. Wireless coverage, GPU compute, mapping data, energy markets — coordinated by tokens that pay contributors for real-world work the network can verify.",
        quote=("The hardest networks to build used to be the ones with physical capital. Tokens just changed that.",
               "FRQNCY editorial"),
        prelude=[
            "DePIN is what happens when a token economy meets a physical good. Helium pays people to host wireless hotspots; Hivemapper pays drivers to record streets; Render and io.net pay GPU operators for inference and training cycles.",
            "The thesis is that coordinating physical-world capital with token incentives produces networks that scale faster, settle cheaper, and route around incumbents that depend on the old coordination model.",
        ],
        bleed_cap="A network of <em>physical things, paid in code.</em>",
        cats=["DePIN", "Infrastructure"],
        keywords=["depin", "helium", "hivemapper", "render", "io.net", "wireless", "compute"],
        practice=base_practice(),
        closing=("Hardware coordinated by code.",
                 "Capacity priced by the network.",
                 "<em>Infrastructure that doesn't need a corporation.</em>",
                 "Physical, decentralised."),
    ),
    "oracles": dict(
        title="Oracles & Interop",
        h1="Oracles",
        eyebrow="Sector · Oracles · Connecting chains to reality",
        accent="#2A5ADA", warm="#5C81E5",
        glyph="bridge",
        hero_bg="https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&q=85&w=2400",
        closing_bg="https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&q=85&w=2400",
        desc="The connective tissue. Oracles bring off-chain data on-chain. Interop bridges move assets and messages between chains. Both are the unglamorous middleware that lets everything else compose.",
        quote=("A blockchain is only as useful as the data it can act on.",
               "FRQNCY editorial"),
        prelude=[
            "Smart contracts cannot read the price of ETH on their own. They cannot know it rained in Lagos, or that an aircraft landed in Tokyo, or that the Fed cut rates. Oracles answer those questions, with reputational and economic stake on the answer being correct.",
            "Interop protocols solve a related problem: messages and assets crossing between chains without trusting a single bridge operator. Both layers are infrastructure — invisible when working, catastrophic when not.",
        ],
        bleed_cap="The middleware nobody sees, <em>that everything depends on.</em>",
        cats=["Oracle", "Bridge"],
        keywords=["oracle", "chainlink", "pyth", "bridge", "interop", "wormhole", "axelar", "layerzero"],
        practice=base_practice(),
        closing=("Off-chain data, on-chain truth.",
                 "Cross-chain messages, single-honest-actor security.",
                 "<em>The layer everything depends on.</em>",
                 "Connective tissue, decentralised."),
    ),
    "staking": dict(
        title="Liquid Staking & Restaking",
        h1="Staking",
        eyebrow="Sector · Staking · Security as a marketplace",
        accent="#00A3FF", warm="#4FC0FF",
        glyph="shield",
        hero_bg="https://images.unsplash.com/photo-1601597111158-2fceff292cdc?auto=format&fit=crop&q=85&w=2400",
        closing_bg="https://images.unsplash.com/photo-1601597111158-2fceff292cdc?auto=format&fit=crop&q=85&w=2400",
        desc="Proof-of-stake networks pay validators to secure them. Liquid staking turns that yield into a tradeable token; restaking turns it into a marketplace where the same security can be rented to other applications. Yield on the base layer, composable.",
        quote=("Security is no longer a network's monopoly. It is a marketplace.",
               "EigenLayer thesis · 2023"),
        prelude=[
            "On a proof-of-stake chain, validators lock up the native asset and earn yield for honest behaviour. Liquid staking protocols (Lido, Rocket Pool) issue a tradeable receipt token that lets stakers keep their position liquid while still earning the yield.",
            "Restaking takes the next step: the same staked capital is rented out as security to other applications, paying additional fees for additional risk. The architecture is new; the economic model — security as a tradeable good — is novel and consequential.",
        ],
        bleed_cap="Security, rentable. <em>Yield, composable.</em>",
        cats=["Liquid Staking", "Staking"],
        keywords=["lido", "rocket pool", "ssv", "eigenlayer", "restaking", "stake"],
        practice=base_practice(),
        closing=("Yield on the base layer.",
                 "Security as a market.",
                 "<em>The same stake, working in two places at once.</em>",
                 "Capital, multiplied."),
    ),
    "predictions": dict(
        title="Prediction Markets",
        h1="Prediction Markets",
        eyebrow="Sector · Predictions · Aggregating the crowd",
        accent="#0075E9", warm="#4F9FED",
        glyph="compass",
        hero_bg="https://images.unsplash.com/photo-1493997181344-712f2f19d87a?auto=format&fit=crop&q=85&w=2400",
        closing_bg="https://images.unsplash.com/photo-1493997181344-712f2f19d87a?auto=format&fit=crop&q=85&w=2400",
        desc="Markets that price the probability of a future event. Election outcomes, hurricane paths, sports results, geopolitics. Prediction markets aggregate dispersed information into a single auditable number.",
        quote=("Markets are a way of finding out what the truth is.",
               "Robin Hanson · 2003"),
        prelude=[
            "When people put money behind a forecast, the market price tends to converge on the most accurate available estimate of the underlying probability. Prediction markets formalise that observation into a venue.",
            "On-chain prediction markets remove the regulatory and counterparty constraints that limited their predecessors. The result is a global, 24/7, anyone-can-list, anyone-can-trade probability engine — and a real-time public good for forecasting.",
        ],
        bleed_cap="The crowd, <em>priced.</em>",
        cats=["Prediction"],
        keywords=["polymarket", "augur", "kalshi", "prediction"],
        practice=base_practice(),
        closing=("Markets price what polls cannot.",
                 "Conviction is auditable.",
                 "<em>The future, in basis points.</em>",
                 "Forecasting, public."),
    ),
    "desci": dict(
        title="Decentralised Science",
        h1="DeSci",
        eyebrow="Sector · DeSci · Funding, IP, and data — reorganised",
        accent="#9B5CFF", warm="#B989FF",
        glyph="graph",
        hero_bg="https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&q=85&w=2400",
        closing_bg="https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&q=85&w=2400",
        desc="Funding research without grant committees. Owning intellectual property without a publisher. Sharing data without a custodian. DeSci is the slow rebuild of the scientific institution on programmable rails.",
        quote=("Science already runs on a peer-to-peer trust network. The plumbing is just bad.",
               "FRQNCY editorial"),
        prelude=[
            "Twentieth-century science institutionalised three things: grant funding (centralised committees), publication (paywalled journals), and data custody (private servers). Each was a pragmatic answer to a coordination problem; each became a chokepoint.",
            "DeSci protocols re-implement the three layers as public goods. IP-NFTs, decentralised journals, on-chain replication markets. Most are early. Some are quietly working.",
        ],
        bleed_cap="Science as a public good, <em>not a publisher's franchise.</em>",
        cats=["DeSci"],
        keywords=["desci", "vitadao", "molecule", "research"],
        practice=base_practice(),
        closing=("Funding without committees.",
                 "Publishing without paywalls.",
                 "<em>Data without custodians.</em>",
                 "Science, rebuilt."),
    ),
    "icm": dict(
        title="Internet Capital Markets",
        h1="Internet Capital Markets",
        eyebrow="Sector · ICM · On-chain issuance",
        accent="#A46AFF", warm="#C194FF",
        glyph="launch",
        hero_bg="https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&q=85&w=2400",
        closing_bg="https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&q=85&w=2400",
        desc="Fundraising, issuance, and capital formation done as a programmable primitive rather than a multi-month legal process. Bonding curves, launchpads, and the new shape of going-to-market.",
        quote=("Capital formation should not require a banker.",
               "FRQNCY editorial"),
        prelude=[
            "ICM is what happens when raising capital becomes a smart-contract call. Bonding curves price tokens against demand in real-time. Launchpads automate fair issuance. The rails compress what used to take a quarter into a transaction.",
            "The model has been abused — most token launches in 2021 were ICM in name only. The 2024–2026 cohort is making the curves more honest, the unlocks more transparent, and the early-buyer edge less extractive.",
        ],
        bleed_cap="The IPO, <em>compressed into a transaction.</em>",
        cats=["ICM", "Launchpad"],
        keywords=["launchpad", "bonding curve", "issuance"],
        practice=base_practice(),
        closing=("Issuance as a function call.",
                 "Capital formation, programmable.",
                 "<em>Pricing in real time, not after roadshows.</em>",
                 "Markets, on-chain."),
    ),
    "memes": dict(
        title="Meme Coins",
        h1="Memes",
        eyebrow="Sector · Memes · The culture layer",
        accent="#FFC107", warm="#FFD759",
        glyph="meme",
        hero_bg="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=85&w=2400",
        closing_bg="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=85&w=2400",
        desc="Tokens whose entire thesis is attention. Pure liquid culture. Most meme coins are jokes; the ones that survive are jokes that became identity, and identity that became coordination.",
        quote=("The most efficient market in the world is the one for attention.",
               "FRQNCY editorial"),
        prelude=[
            "Meme coins are crypto's purest expression of price-as-attention. There is no protocol thesis to defend; the asset is the collective decision to keep paying attention to it.",
            "FRQNCY does not feature memes for the speculation. The cultural-coordination angle is real — Dogecoin, Shiba, Pepe each represent a community holding a token because of identity, not yield. The risk profile is binary; the rest of crypto under-prices how much of itself runs on the same logic.",
        ],
        bleed_cap="Attention, made tradeable. <em>The honest version of speculation.</em>",
        cats=["Meme"],
        practice=base_practice(),
        closing=("Attention, priced.",
                 "Identity, coordinated.",
                 "<em>A token that is its own thesis.</em>",
                 "The culture layer is real."),
    ),
    "modular": dict(
        title="Modular & Data Availability",
        h1="Modular",
        eyebrow="Sector · Modular · Unbundling the monolith",
        accent="#7C3AED", warm="#9C66F2",
        glyph="lattice",
        hero_bg="https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&q=85&w=2400",
        closing_bg="https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&q=85&w=2400",
        desc="Splitting a blockchain into separate execution, settlement, consensus, and data-availability layers. Optimising each independently. Composing them on demand. The modular thesis says the monolithic chain has always been an artefact of constraint, not design.",
        quote=("Specialisation everywhere — except, until recently, blockchains.",
               "Celestia thesis · 2022"),
        prelude=[
            "A monolithic blockchain does everything: it executes transactions, reaches consensus on order, settles disputes, and stores the data. The modular thesis is that each of those is a separate problem, with its own optimal trust model and economic design.",
            "Celestia, EigenDA, Avail, and the rollups built on top of them are the working set. The bet is that decoupling lets each layer scale at its own rate, and that the composed result outperforms any single chain that tries to do all four.",
        ],
        bleed_cap="A chain, <em>unbundled.</em>",
        cats=["Modular", "Data Availability"],
        keywords=["modular", "celestia", "eigenda", "avail", "data availability"],
        practice=base_practice(),
        closing=("Execution, separately.",
                 "Settlement, separately.",
                 "<em>Data availability, separately.</em>",
                 "The monolith breaks."),
    ),
    "nfts": dict(
        title="NFTs",
        h1="NFTs",
        eyebrow="Sector · NFTs · Digital ownership, priced",
        accent="#FF4D8D", warm="#FF7AAA",
        glyph="frame",
        hero_bg="https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=85&w=2400",
        closing_bg="https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=85&w=2400",
        desc="Tokens that represent a unique thing — an artwork, a domain, a membership, a credential. NFTs were over-hyped, then dismissed; the part that survives is the architectural fact that on-chain ownership of a unique digital good is now a primitive.",
        quote=("Digital scarcity used to be a contradiction in terms. It is no longer.",
               "FRQNCY editorial"),
        prelude=[
            "The NFT bubble of 2021 imprinted the worst association with the technology — overpriced JPEGs, obvious wash trading, ecosystem dominated by speculation. The bubble has cleared and the underlying primitive is still there: a way to register that a specific person owns a specific digital thing.",
            "What lives below is the working set after the cycle. Artists keeping royalties without a gallery. Domain names without a registrar. Memberships that move with the holder.",
        ],
        bleed_cap="A specific thing, <em>provably owned.</em>",
        cats=["NFT", "PFP", "Art"],
        keywords=["nft", "ordinals", "ens"],
        practice=base_practice(),
        closing=("Ownership, registered.",
                 "Royalties, programmable.",
                 "<em>Provenance, on-chain.</em>",
                 "Digital scarcity is real."),
    ),
    "neobanks": dict(
        title="Crypto Neobanks",
        h1="Neobanks",
        eyebrow="Sector · Neobanks · Banking for keyholders",
        accent="#00B3A4", warm="#3FCDC0",
        glyph="key",
        hero_bg="https://images.unsplash.com/photo-1556745753-b2904692b3cd?auto=format&fit=crop&q=85&w=2400",
        closing_bg="https://images.unsplash.com/photo-1556745753-b2904692b3cd?auto=format&fit=crop&q=85&w=2400",
        desc="Bank accounts, debit cards, and yield products that hold crypto natively. The interface most people experience banking through, rebuilt on rails that don't require trusting an intermediary with custody.",
        quote=("The interface is the bank. The rails do not have to be.",
               "FRQNCY editorial"),
        prelude=[
            "Crypto neobanks are the on-ramp that lets a regular person live off-chain assets without giving up self-custody on the underlying balance. Card-swiping, payroll, savings products — all running on rails the user can audit, on assets the user controls.",
            "The category is fragmented and regulation-sensitive. Where the model works, it produces an experience indistinguishable from a normal bank for everyone except the user, who knows the keys are theirs.",
        ],
        bleed_cap="A bank for the keyholder, <em>not on top of one.</em>",
        cats=["CeFi", "Neobank", "Payments"],
        keywords=["card", "neobank", "swiss"],
        practice=base_practice(),
        closing=("A card that draws from your keys.",
                 "Yield without custody.",
                 "<em>The interface, without the intermediary.</em>",
                 "Banking, finally yours."),
    ),
}


# ── Project filter helpers ────────────────────────────────────────────
def filter_for(slug: str, cfg: dict, max_n: int = 60) -> list[dict]:
    """Return projects matching this sector. Categories first, then keyword fallback."""
    cats = set(cfg.get("cats", []))
    chains = set(cfg.get("chains", []))
    kws = [k.lower() for k in cfg.get("keywords", [])]
    out = []
    seen = set()
    for p in PROJECTS:
        if p.get("name") in seen:
            continue
        match = False
        # Category match
        for c in p.get("categories", []):
            if c in cats:
                match = True; break
        # Chain match
        if not match and chains:
            chain = p.get("chain", "")
            if any(c in chain for c in chains):
                match = True
        # Keyword fallback (search name + desc + thesis)
        if not match and kws:
            blob = " ".join([
                str(p.get("name", "")), str(p.get("desc", "")),
                str(p.get("thesis", "")), str(p.get("ticker", "")),
            ]).lower()
            if any(k in blob for k in kws):
                match = True
        if match:
            seen.add(p.get("name"))
            out.append(p)
            if len(out) >= max_n:
                break
    # Sort: tier rank first, then name
    tier_rank = {"core": 0, "conviction": 1, "watch": 2, "speculative": 3, "unrated": 4, "avoid": 5}
    out.sort(key=lambda p: (tier_rank.get(p.get("tier", "unrated"), 9), p.get("name", "").lower()))
    return out


# ── HTML renderers ────────────────────────────────────────────────────
def esc(s: str) -> str:
    return _h.escape(str(s or ""), quote=True)


def render_project(p: dict) -> str:
    name = esc(p.get("name", ""))
    ticker = esc(p.get("ticker", ""))
    tier = p.get("tier", "unrated")
    tags = p.get("categories", [])
    tags = [t for t in tags if t and t != "Other"][:2]
    tag_html = "".join(f'<span class="ptag">{esc(t)}</span>' for t in tags)
    initials = (p.get("name") or "??")[:2].upper()
    desc = esc(p.get("desc", "")[:240])
    why = esc((p.get("thesis") or "")[:260])
    link = esc((p.get("links") or {}).get("website") or "")
    link_label = re.sub(r"^https?://(?:www\.)?", "", link).rstrip("/").split("/")[0] if link else ""
    accent = esc(p.get("accent") or "#F7931A")
    cat = esc(tags[0] if tags else (p.get("category") or "Crypto"))
    why_block = (
        f'<div class="project-why"><strong>Why FRQNCY watches this</strong>{why}</div>' if why else ""
    )
    foot_link = (
        f'<a class="project-link" href="{link}" target="_blank" rel="noopener noreferrer">{esc(link_label)} →</a>'
        if link else '<span class="project-cat" style="opacity:0.4">no website</span>'
    )
    return f"""<article class="project" data-tier="{esc(tier)}">
  <div class="project-accent" style="background:{accent}"></div>
  <div class="project-body">
    <div class="project-head">
      <div class="project-icon" style="background:linear-gradient(135deg,{accent}40,{accent}20);border:1px solid {accent}50">{esc(initials)}</div>
      <div class="project-meta">
        <div class="project-name">{name}</div>
        <div class="project-ticker">{ticker}</div>
      </div>
      <span class="project-tier tier-{esc(tier)}">{esc(tier)}</span>
    </div>
    <div class="project-tags">{tag_html}</div>
    <div class="project-desc">{desc}</div>
    {why_block}
  </div>
  <div class="project-foot">
    {foot_link}
    <span class="project-cat">{cat}</span>
  </div>
</article>"""


def render_tier_bar(projects: list[dict]) -> str:
    counts: dict[str, int] = {}
    for p in projects:
        t = p.get("tier", "unrated")
        counts[t] = counts.get(t, 0) + 1
    if not projects:
        return ""
    order = ["all", "core", "conviction", "watch", "speculative", "unrated", "avoid"]
    pieces = []
    for t in order:
        if t == "all":
            pieces.append(f'<button class="ttab active" data-tier="all">All<span class="ct">{len(projects)}</span></button>')
        elif counts.get(t):
            pieces.append(f'<button class="ttab" data-tier="{t}">{t}<span class="ct">{counts[t]}</span></button>')
    return f'<div class="tier-bar">{"".join(pieces)}</div>'


def render_practice(steps: list[tuple[str, str]]) -> str:
    rom = ["i", "ii", "iii", "iv", "v", "vi"]
    out = []
    for i, (head, body) in enumerate(steps):
        out.append(f"""<div class="step"><div class="step-num">{rom[i]}</div>
<div class="step-body"><strong>{head}</strong><p>{body}</p></div></div>""")
    return f'<div class="practice">{chr(10).join(out)}</div>'


def render_closing(triad: tuple[str, str, str, str], warm: str) -> str:
    line1, line2, line3, key = triad
    return f"""<section class="closing fade-up">
  <div class="closing-bg" aria-hidden="true"></div>
  <div class="closing-inner">
    <p>
      {line1}<br>
      {line2}<br>
      {line3}
    </p>
    <p style="font-size: clamp(1.5rem, 2.6vw, 2.2rem); margin-top: 1.4rem;">
      <strong>{key}</strong>
    </p>
    <cite>FRQNCY · Crypto</cite>
  </div>
</section>"""


WAVE_SVG_TEMPLATE = """<div class="wave-divider" aria-hidden="true">
  <svg viewBox="0 0 2880 100" preserveAspectRatio="none">
    <path class="w3" fill="{accent_a}" d="M0,55 C144,30 288,30 432,45 C576,60 720,72 864,55 C1008,38 1152,30 1296,45 C1440,60 1584,72 1728,55 C1872,38 2016,30 2160,45 C2304,60 2448,72 2592,55 C2736,38 2808,38 2880,45 L2880,100 L0,100 Z"/>
    <path class="w2" fill="{accent_b}" d="M0,65 C144,45 288,45 432,55 C576,65 720,75 864,65 C1008,55 1152,45 1296,55 C1440,65 1584,75 1728,65 C1872,55 2016,45 2160,55 C2304,65 2448,75 2592,65 C2736,55 2808,55 2880,60 L2880,100 L0,100 Z"/>
    <path class="w1" fill="rgba(245, 248, 251, 0.06)" d="M0,80 C144,68 288,68 432,75 C576,82 720,88 864,80 C1008,72 1152,68 1296,75 C1440,82 1584,88 1728,80 C1872,72 2016,68 2160,75 C2304,82 2448,88 2592,80 C2736,72 2808,72 2880,76 L2880,100 L0,100 Z"/>
  </svg>
</div>"""


def hex_alpha(hex_color: str, alpha: float) -> str:
    h = hex_color.lstrip("#")
    r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    return f"rgba({r}, {g}, {b}, {alpha})"


def render_page(slug: str, cfg: dict) -> str:
    accent = cfg["accent"]
    warm = cfg["warm"]
    soft = hex_alpha(accent, 0.16)
    soft_warm = hex_alpha(accent, 0.30)
    bg_soft = hex_alpha(accent, 0.06)
    wave_a = hex_alpha(accent, 0.16)
    wave_b = hex_alpha(accent, 0.10)
    title = cfg["title"]
    h1 = cfg["h1"]
    eyebrow = cfg["eyebrow"]
    desc = cfg["desc"]
    quote_text, quote_cite = cfg["quote"]
    prelude = cfg["prelude"]
    bleed_cap = cfg["bleed_cap"]
    closing = cfg["closing"]

    projects = filter_for(slug, cfg)
    project_html = "\n".join(render_project(p) for p in projects)
    if not projects:
        project_block = (
            '<div class="empty-grid">No FRQNCY-tracked projects yet in this sector — '
            'sub-hub awaiting curation. The thesis above stands; the working set will land here.</div>'
        )
    else:
        project_block = render_tier_bar(projects) + f'<div class="projects-grid" id="projects">{project_html}</div>'

    practice_html = render_practice(cfg["practice"])
    closing_html = render_closing(closing, warm)
    glyph_svg = glyph(cfg["glyph"], accent, warm)

    prelude_html = "\n".join(f"<p>{p}</p>" for p in prelude)
    wave = WAVE_SVG_TEMPLATE.format(accent_a=wave_a, accent_b=wave_b)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title} — FRQNCY Crypto</title>
<meta name="description" content="{esc(desc)}">
<meta name="theme-color" content="#0B1C3D">
<meta property="og:type" content="website">
<meta property="og:title" content="{title} — FRQNCY Crypto">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="https://frqncy.network/v2/crypto/{slug}/">
<meta property="og:image" content="https://frqncy.network/og-image.png">
<meta property="og:site_name" content="FRQNCY">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{title} — FRQNCY Crypto">
<meta name="twitter:description" content="{esc(desc)}">
<meta name="twitter:image" content="https://frqncy.network/og-image.png">
<link rel="icon" type="image/svg+xml" href="../../../favicon.svg">
<link rel="manifest" href="../../../manifest.json">
<link rel="canonical" href="https://frqncy.network/v2/crypto/{slug}/">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://images.unsplash.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500;1,600&family=Jost:wght@200;300;400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/v2/crypto/_artwork.css">
<style>
  :root {{
    --sector-accent: {accent};
    --sector-warm:   {warm};
    --sector-soft:   {soft};
    --sector-warm-soft: {soft_warm};
    --sector-bg:     {bg_soft};
  }}
  .hero-bg {{ background-image: url('{cfg["hero_bg"]}'); }}
  .closing-bg {{ background-image: url('{cfg["closing_bg"]}'); }}
</style>
<script defer data-domain="frqncy.network" src="https://plausible.io/js/script.js"></script>
<script src="../../../mobile-nav.js" defer></script>
<script src="../../../chat-widget.js" defer></script>
<link rel="stylesheet" href="../../../nav-dropdown.css">
<script>if('serviceWorker' in navigator){{window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js'));}}</script>
<script type="application/ld+json">{{"@context":"https://schema.org","@type":"CollectionPage","name":"{title} — FRQNCY Crypto","description":"{esc(desc)}","url":"https://frqncy.network/v2/crypto/{slug}/","isPartOf":{{"@type":"WebSite","name":"FRQNCY Network","url":"https://frqncy.network"}},"breadcrumb":{{"@type":"BreadcrumbList","itemListElement":[{{"@type":"ListItem","position":1,"name":"FRQNCY","item":"https://frqncy.network"}},{{"@type":"ListItem","position":2,"name":"Crypto","item":"https://frqncy.network/v2/crypto/"}},{{"@type":"ListItem","position":3,"name":"{title}","item":"https://frqncy.network/v2/crypto/{slug}/"}}]}}}}</script>
</head>
<body>

<nav class="snav">
  <div class="snav-left">
    <a href="/v2/explore.html" class="snav-logo">FRQNCY<span class="snav-badge">CRYPTO</span></a>
    <div class="breadcrumb">
      <a href="/v2/crypto/">Crypto</a><span class="sep">/</span>
      <span>{title}</span>
    </div>
  </div>
  <div style="display:flex;align-items:center;gap:0.75rem;flex-shrink:0">
    <a href="/v2/crypto/" class="snav-back">← Crypto hub</a>
    <a href="/v2/fund/" class="snav-back">Fund</a>
    <a href="/" class="snav-back">Main</a>
  </div>
</nav>

<section class="hero">
  <div class="hero-bg" aria-hidden="true"></div>
  <div class="hero-inner">
    <div>
      <div class="hero-eyebrow">{eyebrow}</div>
      <h1 class="hero-title">{h1}</h1>
      <p class="hero-desc">{desc}</p>
      <div class="hero-quote">
        {quote_text}
        <cite>{quote_cite}</cite>
      </div>
    </div>
    {glyph_svg}
  </div>
  <div class="scroll-hint">descend</div>
</section>

{wave}

<main class="sector-body">

<!-- PRELUDE -->
<section class="section section-narrow fade-up">
  {prelude_html}
</section>

<!-- BLEED -->
<div class="bleed fade-up">
  <img src="{cfg["hero_bg"]}" alt="">
  <div class="bleed-cap">{bleed_cap}</div>
</div>

<!-- WORKING SET -->
<section class="section section-wide fade-up">
  <span class="label">Working set</span>
  <h2>Projects we <strong>actually watch.</strong></h2>
  <p style="max-width: 60ch;">
    Conviction is stated as conviction; you decide what to do with it. Tiers below — Core,
    Conviction, Watch, Speculative — reflect how much of FRQNCY's attention each project
    currently earns, not a recommendation to buy.
  </p>

  {project_block}
</section>

<!-- PRACTICE -->
<section class="section fade-up">
  <span class="label">A practice</span>
  <h2>Five small things, repeated.</h2>
  <p>
    Conviction is theatre without practice. Five steps that turn the thesis above into something
    the body actually does, not just something the mind agrees with.
  </p>
  {practice_html}
</section>

<!-- CTA -->
<section class="section fade-up">
  <div class="cta">
    <h3>Two doors. <em>Pick one.</em></h3>
    <p>The Crypto hub is the index of all sectors and the freedom-technology frame they share. The Fund is what happens when the same conviction gets put to work on behalf of the network.</p>
    <div class="cta-buttons">
      <a href="/v2/crypto/" class="cta-btn primary">Crypto Hub</a>
      <a href="/v2/fund/" class="cta-btn secondary">FRQNCY Fund →</a>
    </div>
  </div>
</section>

</main>

{closing_html}

<footer class="site-foot">
  <span class="wm">FRQNCY · CRYPTO</span>
  <span class="legal">© 2026 · All frequencies reserved · Sector · {title}</span>
</footer>

<script>
// Tier filter
document.querySelectorAll('[data-tier]').forEach(btn => {{
  btn.addEventListener('click', () => {{
    document.querySelectorAll('[data-tier]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const f = btn.dataset.tier;
    document.querySelectorAll('.project').forEach(card => {{
      card.style.display = (f === 'all' || card.dataset.tier === f) ? '' : 'none';
    }});
  }});
}});

// Fade-up reveal
(function () {{
  if (!('IntersectionObserver' in window)) {{
    document.querySelectorAll('.fade-up').forEach(el => el.classList.add('in'));
    return;
  }}
  const io = new IntersectionObserver((entries) => {{
    entries.forEach(entry => {{
      if (entry.isIntersecting) {{
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }}
    }});
  }}, {{ rootMargin: '0px 0px -10% 0px', threshold: 0.05 }});
  document.querySelectorAll('.fade-up').forEach(el => io.observe(el));
}})();
</script>
</body>
</html>"""


def main() -> None:
    written = 0
    for slug, cfg in SECTORS.items():
        path = CRYPTO / slug / "index.html"
        path.parent.mkdir(parents=True, exist_ok=True)
        html = render_page(slug, cfg)
        path.write_text(html)
        # quick stats
        n_projects = len(filter_for(slug, cfg))
        print(f"  {slug:13s}  {n_projects:>3d} projects  → {path.relative_to(ROOT)}")
        written += 1
    print(f"\n✓ Wrote {written} sector hubs in /v2/crypto/")


if __name__ == "__main__":
    main()
