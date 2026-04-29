"""
Real crypto-website imagery per sub-hub — replaces Unsplash stock.

Each entry is sourced from the project's own site (OG meta image, official
share card, docs cover, GitHub avatar) or from a canonical crypto-data CDN
(CoinGecko, DefiLlama). Imagery agent verified each URL with curl HTTP 200
+ image/* content-type + hotlink-friendly under Referer: https://frqncy.network.

The destination filter chain (brightness 42% + saturate + navy gradient
overlay) tones these into atmospheric backdrops rather than logo placards.
"""
from __future__ import annotations

# Per-sector (hero_url, closing_url). Where the agent flagged a logo-only
# entry as the only credible option, we still use it — the filter chain
# desaturates it into texture.
SECTOR_IMAGERY: dict[str, tuple[str, str]] = {
    "bitcoin":     ("https://bitcoin.org/img/icons/opengraph.png?1777284471",
                    "https://nostr.org/assets/images/home/social-nostr.png"),
    "sov":         ("https://images.contentstack.io/v3/assets/bltf8d808d9b8cebd37/blt6cb59c1cbe362c8e/67a2761f956a029d56ba5499/strategy-page-thumbnail.png",
                    "https://bitcoin.org/img/icons/opengraph.png?1777284471"),
    "l1":          ("https://ethereum.org/images/home/hero.png",
                    "https://solana.com/src/img/index/og-image.jpeg"),
    "l2":          ("https://base.org/opengraph-image-1wcuri.png?4ab4be4a6c9183b9",
                    "https://arbitrum.foundation/preview.jpg"),
    "modular":     ("https://celestia.org/meta/og-image-default.jpg",
                    "https://framerusercontent.com/images/Fcf9YlD6gzrW8VXAi7tIURE7zww.png"),
    "defi":        ("https://aave.com/og/default.png",
                    "https://app.uniswap.org/images/1200x630_Rich_Link_Preview_Image.png"),
    "stablecoins": ("https://makerdao.com/dai.png",
                    "https://app.ethena.fi/shared/ethena-thumbnail.png"),
    "privacy":     ("https://z.cash/wp-content/uploads/2023/06/zcash-logo.jpg",
                    "https://www.getmonero.org/press-kit/symbols/monero-symbol-on-white-480.png"),
    "ai":          ("https://docs.learnbittensor.org/img/bittensor-dev-docs-social-card.png",
                    "https://cdn.sanity.io/images/hvk0tap5/production/a3528e77b010804af14908fab79f826d66437620-1600x900.png"),
    "gamefi":      ("https://avatars.githubusercontent.com/u/50816935?s=280&v=4",
                    "https://avatars.githubusercontent.com/u/40502837?v=4&s=400"),
    "socialfi":    ("https://docs.farcaster.xyz/og-image.png",
                    "https://lens.xyz/opengraph/home.png"),
    "rwa":         ("https://ondo.finance/images/ondo-wordmark-preview-card.png",
                    "https://maple.finance/images/seo-image-main.jpg"),
    "depin":       ("https://framerusercontent.com/images/oszNCq3vB5gMnTcN2HbnOmIlHI.jpg",
                    "https://filecoin.io/uploads/filecoin-server-rack-share.jpg?c=1774532473"),
    "oracles":     ("https://docs.chain.link/images/og.png",
                    "https://framerusercontent.com/assets/9ylQh3QXq9pfxiz64TkeSKWyM.png"),
    "staking":     ("https://stake.lido.fi/lido-preview.png",
                    "https://cdn.sanity.io/images/fqkdy2l3/production/154adc4df997f6b1fe8680543e03d926ec51543b-1200x630.png?w=1200"),
    "predictions": ("https://polymarket.com/images/homepage-twitter-card.png",
                    "https://kalshi-public-docs.s3.us-east-1.amazonaws.com/images/API_docs.png"),
    "desci":       ("https://docs.bio.xyz/bio/~gitbook/ogimage/kchm9e50XXiqXjlK2qay",
                    "https://www.vitadao.com/og-image.png"),
    "icm":         ("https://daos.fun/cover.jpg",
                    "https://icons.llamao.fi/icons/protocols/pump?w=1200&h=1200"),
    "memes":       ("https://dogecoin.com/assets/images/dogecoin-card.png",
                    "https://coin-images.coingecko.com/coins/images/29850/large/pepe-token.jpeg"),
    "nfts":        ("https://www.cryptopunks.app/images/cryptopunks/shareimage.png",
                    "https://imgs.blur.io/_assets/common/og.png"),
    "neobanks":    ("https://crypto.com/images/meta-og/listing.png",
                    "https://www.gemini.com/static/images/og-meta-v2.png"),
}
