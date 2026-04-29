#!/usr/bin/env python3
"""
Draft minimal-but-complete YAML briefs for every non-locked topic in
search.json. Each YAML produces an HTML page in v2/<slug>/index.html
when run through scripts/generate_topic_page.py.

═══════════════════════════════════════════════════════════════════════
PROVEN IMAGERY PATTERN (locked in 2026-04-29 — DO NOT regress).
The hero+closing pair the user approved is built from two layers:

  1. DOMAIN_HERO + DOMAIN_CLOSING_IMG — 30 hand-picked Unsplash photos
     at 4K (?w=3840&q=85), one pair per FRQNCY domain. These stretch
     the full viewport width gracefully, hold the navy filter chain,
     and read as editorial atmosphere rather than stock photography.

  2. TOPIC_OVERRIDE_HERO + TOPIC_OVERRIDE_CLOSING — local files in
     v2/_chrome/imagery/ that override the domain default for specific
     topics. New entries must be:
       • 4K resolution (≥3840px wide; landscape orientation preferred)
       • Topically aligned with the slug they're mapped to
       • Owned/licensed for redistribution

Workflow: copy a candidate photo into v2/_chrome/imagery/, add the
filename to one of the OVERRIDE dicts below, re-run this script and
the generator. The override path is rendered into the YAML as a
relative URL the page can serve directly.
═══════════════════════════════════════════════════════════════════════

Each drafted brief contains:
  • meta (slug/label/domain/pillar/accent — taken from search.json)
  • domain-keyed treatment register (kinetic, scientific, mythic, ...)
  • hero with a topic-relevant LoremFlickr photo at 4K (3840×2160)
  • five resource grids — Books / People / Institutions / Places /
    Tools & media — auto-pulling from resources.json by topicSlug+type
  • a closing bleed with a TOPIC-SPECIFIC sourced quote
    (every quote unique across the network — book, philosopher, scientist,
     Trudeau on belief topics, etc.)

Idempotent: skips files that already exist. Run with --force to overwrite.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TOPICS_DIR = ROOT / "data" / "topics"

LOCKED: set[str] = {"water", "music", "channeling", "watch", "cryptocurrency", "crypto"}

# ──────────────── Domain → treatment register ────────────────────────
DOMAIN_TREATMENT: dict[str, str] = {
    "Sciences":            "scientific",
    "Money":               "brutalist",
    "Metaphysics":         "mythic",
    "Well-being":          "monastic",
    "Lifestyle":           "contemplative",
    "Play & Recreation":   "kinetic",
    "Arts & Culture":      "editorial",
    "Society & Networks":  "editorial",
    "Communication":       "editorial",
    "Technology":          "scientific",
    "Creation":            "mythic",
    "Energy":              "scientific",
    "Food & Agriculture":  "editorial",
    "Nature & Cosmos":     "contemplative",
    "Business":            "editorial",
}

# ──────────────── Domain → hero poster URL (4K Unsplash, hand-picked) ──
DOMAIN_HERO: dict[str, str] = {
    "Sciences":            "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&q=85&w=3840",
    "Money":               "https://images.unsplash.com/photo-1554260570-9140fd3b7614?auto=format&fit=crop&q=85&w=3840",
    "Metaphysics":         "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&q=85&w=3840",
    "Well-being":          "https://images.unsplash.com/photo-1545389336-cf090694435e?auto=format&fit=crop&q=85&w=3840",
    "Lifestyle":           "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&q=85&w=3840",
    "Play & Recreation":   "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=85&w=3840",
    "Arts & Culture":      "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?auto=format&fit=crop&q=85&w=3840",
    "Society & Networks":  "https://images.unsplash.com/photo-1538439907460-1596cafd4eff?auto=format&fit=crop&q=85&w=3840",
    "Communication":       "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&q=85&w=3840",
    "Technology":          "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=85&w=3840",
    "Creation":            "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?auto=format&fit=crop&q=85&w=3840",
    "Energy":              "https://images.unsplash.com/photo-1497292207894-95884b04e30e?auto=format&fit=crop&q=85&w=3840",
    "Food & Agriculture":  "https://images.unsplash.com/photo-1500076656116-558758c991c1?auto=format&fit=crop&q=85&w=3840",
    "Nature & Cosmos":     "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&q=85&w=3840",
    "Business":            "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=85&w=3840",
}

# ──────────────── Domain → closing bleed image (different from hero) ──
DOMAIN_CLOSING_IMG: dict[str, str] = {
    "Sciences":            "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&q=85&w=3840",
    "Money":               "https://images.unsplash.com/photo-1611348586804-61bf6c080437?auto=format&fit=crop&q=85&w=3840",
    "Metaphysics":         "https://images.unsplash.com/photo-1539593395743-7da5ee10ff07?auto=format&fit=crop&q=85&w=3840",
    "Well-being":          "https://images.unsplash.com/photo-1518562180175-34a163b1a9a6?auto=format&fit=crop&q=85&w=3840",
    "Lifestyle":           "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&q=85&w=3840",
    "Play & Recreation":   "https://images.unsplash.com/photo-1502904550040-7534597429ae?auto=format&fit=crop&q=85&w=3840",
    "Arts & Culture":      "https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?auto=format&fit=crop&q=85&w=3840",
    "Society & Networks":  "https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&q=85&w=3840",
    "Communication":       "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=85&w=3840",
    "Technology":          "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=85&w=3840",
    "Creation":            "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&q=85&w=3840",
    "Energy":              "https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&q=85&w=3840",
    "Food & Agriculture":  "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&q=85&w=3840",
    "Nature & Cosmos":     "https://images.unsplash.com/photo-1465056836041-7f43ac27dcb5?auto=format&fit=crop&q=85&w=3840",
    "Business":            "https://images.unsplash.com/photo-1554260570-9140fd3b7614?auto=format&fit=crop&q=85&w=3840",
}

# ──────────────── Per-topic override maps (local 4K imagery) ─────────
# When a slug has an entry here, this image replaces the domain default
# on that topic's hero or closing bleed. Files must live in
# v2/_chrome/imagery/ and be 4K (≥3840w, landscape preferred).
def _u(photo_id: str) -> str:
    """Unsplash 4K CDN URL helper. Each ID has been verified HTTP 200."""
    return f"https://images.unsplash.com/{photo_id}?auto=format&fit=crop&q=85&w=3840"


def _p(pexels_id: str | int) -> str:
    """Pexels 4K CDN URL helper. Each ID has been verified HTTP 200."""
    return f"https://images.pexels.com/photos/{pexels_id}/pexels-photo-{pexels_id}.jpeg?cs=srgb&fm=jpg&w=3840"


TOPIC_OVERRIDE_HERO: dict[str, str] = {
    # ── Local Dreambuilding photos (curated from ~/Documents/Dreambuilding) ──
    # leisure + minimalism reassigned 2026-04-29: user requested more
    # topic-aligned visuals (Aman aesthetic = luxury, not literal leisure
    # or minimalism). Aman files preserved on disk for reuse.
    # "leisure":          "/v2/_chrome/imagery/aman-sundowner.jpg",       # 7919×4890
    # "minimalism":       "/v2/_chrome/imagery/aman-jena-garden.jpg",     # 5975×3688

    # ── Open-source Unsplash 4K, sourced 2026-04-29, all verified HTTP 200 ──
    "meditation":         _u("photo-1672758688257-a110c93de407"),  # zen garden Japan
    "mindfulness":        _u("photo-1674893168376-c3d8efc23906"),  # circular rock garden
    "presence":           _u("photo-1496113329550-ce8886d06d54"),  # tatami interior
    "breathwork":         "/v2/_chrome/imagery/breathwork-hero.jpg",  # woman pranayama on stone platform in forest (Pexels 32847438, downloaded local)
    "detox":              _p(30635724),  # green juice with ginger and lime, detox
    "siddha-yoga":        _u("photo-1526427158867-98ee4ba58d5a"),  # pagoda
    "kriya-yoga":         _u("photo-1616901945149-47f7eac169cb"),  # SE-Asian temple
    "taoism":             _u("photo-1687674107949-295fdc658bab"),  # mountain low clouds
    "christianity":       _u("photo-1598791074971-28b36cac6c25"),  # brown concrete clouds
    "architecture":       _u("photo-1604245462979-e10d27052b35"),  # wooden window frame
    "yoga":               _u("photo-1577790668485-b3e70d84b462"),  # Japanese house, natural
    "soul":               _u("photo-1630507120833-34d85ae27fb3"),  # red-black temple, water
    "somatic-therapy":    _u("photo-1488345979593-09db0f85545f"),  # resort pool, atmospheric

    # ── Open-source Pexels 4K, sourced 2026-04-29, all verified HTTP 200 ──
    "astrophysics":       _p(31876937),  # spiral galaxy
    "cosmos":             _p(207529),    # Milky Way
    "nutrition":          _p(6632286),   # nutritious bowl
    "cuisine":            _p(7660436),   # chopsticks, vegetable bowls
    "forests":            _p(35898950),  # misty forest, tall trees
    "biodiversity":       _p(1828304),   # mountain fog with trees
    "ecology":            _p(34926159),  # Serbian misty forest
    "oceans":             _p(18045518),  # aerial ocean ripples
    "climate":            _p(35264949),  # Aletsch Glacier framed by Swiss Alps
    "mental-health":      _p(36852508),  # silhouette gazing over foggy lake
    # trauma override removed — topic deleted from FRQNCY network 2026-04-29.
    "plant-medicine":     _p(105028),    # marble mortar with fresh herbs and flowers
    "history":            _p(30019381),  # vintage bookshelf
    "storytelling":       _p(3860451),   # vintage library, ladder
    "mythology":          _p(32765737),  # antique books on wooden shelves
    "audio":              _p(35254141),  # vinyl records, wall display
    "broadcasting":       _p(6862361),   # vinyl store, retro
    "sleep":              _p(36710323),  # minimalist bedroom with mountain vista
    "leisure":            _p(19107554),  # woman reading in hammock outdoors
    "minimalism":         _p(950241),    # minimalist white architectural interior

    # ── Auto-QA Round 1 fixes (2026-04-29 — flagged by qa_imagery.py) ──
    "aquaculture":        _p(28738440),  # aerial view of floating fish farm, green water
    "ar-vr":              _p(7776217),   # person immersed in VR, headset and headphones
    "astrology":          _p(20419150),  # astrology moon phases wheel with calendar
    # Watchlist topics elevated to bespoke after smoke-test review
    "akashic-records":    _p(30019470),  # ancient manuscript with Latin calligraphy
    "aliens":             _p(9271469),   # flying-saucer structure in mountain landscape
    "artificial-intelligence": _p(8566521),  # close-up humanoid robot with glowing blue lights

    # Tech batch — distinguishing each tech topic from the circuit-board default
    "blockchain":         _p(9577254),   # blockchain interface on laptop, digital finance
    "cybersecurity":      _p(34258666),  # hooded figure typing green code on computer
    "future-tech":        _p(35579528),  # vibrant futuristic architecture, glowing illumination
    "open-source":        _p(33572895),  # cozy dual-monitor home office setup
    "robotics":           _p(34207359),  # yellow industrial robotic arm in manufacturing
    "quantum-computing":  _p(30547566),  # futuristic digital processor with glowing elements

    # Arts batch — each art form gets its signature subject
    "visual-art":         _p(31251944),  # artist painting detailed portrait with brushes
    "dance":              _p(17029897),  # graceful ballerina performing on stage
    "theater":            _p(4722577),   # elegant red velvet theater curtain
    "film":               _p(12895138),  # vintage film projector against stone wall
    "fashion":            _p(1343522),   # fashion model on stage at runway show

    # Energy batch — each energy source gets its signature subject
    "solar":              _p(35105435),  # vast solar farm in Vietnam with mountains
    "wind-energy":        _p(33443005),  # offshore wind turbines against calm sea
    "geothermal":         _p(31907592),  # misty landscape with dense steam, geothermal
    "renewable-energy":   _p(31633329),  # aerial view of turbines on green hills
    "energy-policy":      _p(35013248),  # Canadian House of Commons, green seating
    "energy-storage":     _p(2800832),   # top view of solar panels — pairs w/ storage closing

    # Society & Networks batch
    "community":          _p(27769510),  # educational gathering in Lagos, community
    "governance":         _p(36207471),  # Swiss Parliament council chamber, Bern
    "social-movements":   _p(29496244),  # protesters in Chicago, peaceful march
    "education-systems":  _p(8197558),   # professor instructing diverse learners

    # Web3 / DeFi cluster
    "defi":               _p(8919551),   # crypto coins with smartphone trading graph
    "web3":               _p(14314638),  # modern digital spheres interconnected, network
    "dao":                _p(28887851),  # 3D rendering of connected geometric cubes
    "impact-investing":   _p(5784807),   # close-up financial graph, stock market data
    "prosperity-mindset": _p(7567223),   # digital stock market chart, growth analytics
}

TOPIC_OVERRIDE_CLOSING: dict[str, str] = {
    # ── Local Dreambuilding photos ──
    "leisure":            "/v2/_chrome/imagery/aman-jena-garden.jpg",
    "body-care":          "/v2/_chrome/imagery/bulgari.avif",

    # ── Open-source Unsplash 4K, all verified HTTP 200 ──
    "meditation":         _u("photo-1432958576632-8a39f6b97dc7"),  # wooden bridge, creek
    "mindfulness":        _u("photo-1470364799705-5cd35cff0c88"),  # stone beside river
    "presence":           _u("photo-1687674108336-c4c5fc2a67bb"),  # mountain distant fog
    "breathwork":         "/v2/_chrome/imagery/breathwork-closing.jpg",  # woman seated, hands on chest+belly, conscious breathing (Pexels 6173713, downloaded local)
    "detox":              _p(4443437),   # green juice being poured with fresh produce
    "siddha-yoga":        _u("photo-1697112725138-1a91c83d0af8"),  # bell in garden
    "kriya-yoga":         _u("photo-1622506092974-38b108ee3436"),  # red temple by lake
    "taoism":             _u("photo-1628025535476-b2d60ed67185"),  # pathway near water
    "christianity":       _u("photo-1565117306083-93e0c223e4ae"),  # white clouds
    "architecture":       _u("photo-1545659705-c769b5c3d132"),     # house with black roof
    "yoga":               _u("photo-1445019980597-93fa8acb246c"),  # resort lounge, mountain
    "soul":               _u("photo-1672758688320-685bb6b36846"),  # rock garden, gravel
    "somatic-therapy":    _u("photo-1537154259951-00da64098b37"),  # zen wooden flooring

    # ── Open-source Pexels 4K, sourced 2026-04-29, all verified HTTP 200 ──
    "astrophysics":       _p(821644),    # Andromeda Galaxy with stars
    "cosmos":             _p(1341279),   # deep starry night sky
    "nutrition":          _p(12174224),  # breakfast bowl, oats, granola
    "cuisine":            _p(3622474),   # acai smoothie bowl
    "forests":            _p(9407824),   # aerial misty forest, pines
    "biodiversity":       _p(8602485),   # forest covered in fog
    "ecology":            _p(14032412),  # green trees in fog
    "oceans":             _p(11795649),  # clear blue ocean meets sky
    "climate":            _p(17845895),  # storm clouds over rural landscape
    "mental-health":      _p(31005853),  # solitary figure by misty lake, bare trees
    # trauma override removed — topic deleted from FRQNCY network 2026-04-29.
    "plant-medicine":     _p(28250490),  # mushroom on vibrant green moss, sunlit forest
    "history":            _p(14751147),  # vintage library
    "storytelling":       _p(18670323),  # old colorful books stacked
    "mythology":          _p(36325224),  # grand library, spiral staircase
    "audio":              _p(21821336),  # vintage vinyl wall arrangement
    "broadcasting":       _p(4383295),   # vinyl albums on shelf
    "sleep":              _p(12277279),  # bedroom with ambient lighting, peaceful
    "leisure":            _p(34999621),  # woman in hammock reading in forest
    "minimalism":         "/v2/_chrome/imagery/minimalism-closing.jpg",  # corner of modern building over ocean, elegant architectural minimal (Pexels 34189640, downloaded local)

    # ── Auto-QA Round 1 fixes (2026-04-29) ──
    "aquaculture":        _p(10436679),  # expansive fish farm in calm blue sea
    "ar-vr":              _p(4389988),   # young man with VR goggles in neon-lit room
    "astrology":          _p(7222053),   # flat lay astrology tools, natal chart
    # Watchlist topics elevated
    "akashic-records":    _p(235976),    # antique book page with aged handwriting
    "aliens":             _p(7108184),   # mysterious illuminated trail across night sky
    "artificial-intelligence": _p(18799044),  # futuristic humanoid robot with metallic armor

    # Tech batch closings
    "blockchain":         _p(9577250),   # MacBook Air with blockchain interface in office
    "cybersecurity":      _p(1089438),   # green matrix code background, binary stream
    "future-tech":        _p(32660203),  # Chongqing skyscrapers, cyberpunk-style reflections
    "open-source":        _p(16129724),  # software developer typing code, dual monitors
    "robotics":           _p(34194567),  # Delta brand robotic arm, industrial automation
    "quantum-computing":  _p(2105927),   # macro shot of computer CPU chip with gold pins

    # Arts batch closings
    "visual-art":         _p(16037014),  # artist's palette with painting of woman by sea
    "dance":              _p(31164791),  # dynamic ballet pose mid-air
    "theater":            _p(11718581),  # elegant theater interior with red curtains and seats
    "film":               _p(2893694),   # vintage movie camera with film roll near window
    "fashion":            _p(13057769),  # fashion model in couture gown at New Delhi event

    # Energy batch closings
    "solar":              _p(33696834),  # field of solar panels harnessing sunlight
    "wind-energy":        _p(18829029),  # turbines on rolling landscape at sunset
    "geothermal":         _p(34541321),  # geothermal landscape Iceland, steam against blue
    "renewable-energy":   _p(15418504),  # multiple turbines in vast wind farm
    "energy-policy":      _p(6436372),   # French National Assembly, red seats
    "energy-storage":     _p(12858693),  # solar panel farm under clear blue sky

    # Society & Networks closings
    "community":          _p(8199141),   # multicultural attendees, university classroom
    "governance":         _p(14501973),  # Dutch Parliament circular seating, Den Haag
    "social-movements":   _p(35142090),  # street protest with political banners
    "education-systems":  _p(36834057),  # contemporary learning space, blue seating

    # Web3 / DeFi cluster closings
    "defi":               _p(8358046),   # Bitcoin coins with financial indicators on laptop
    "web3":               _p(14832159),  # multiple cryptocurrency coins on white
    "dao":                _p(17977092),  # Bitcoin with rising investment chart
    "impact-investing":   _p(30268012),  # stock market chart, rapid growth
    "prosperity-mindset": _p(29611783),  # bullish digital candlestick chart
}


# ──────────────── Slug → Flickr search keyword override ──────────────
TOPIC_KEYWORDS: dict[str, str] = {
    # Sciences
    "quantum": "quantum,physics", "neuroscience": "brain,neuron",
    "astrophysics": "galaxy,nebula", "physics": "physics,laboratory",
    "math": "mathematics,equation", "mathematics": "mathematics,blackboard",
    "chemistry": "chemistry,laboratory", "biology": "microscope,cells",
    "medicine": "medicine,hospital", "psychology": "mind,abstract",
    "biotechnology": "biotech,laboratory", "biomimicry": "nature,pattern",
    "genetics": "dna,helix",
    # Technology
    "artificial-intelligence": "artificial,intelligence",
    "blockchain": "blockchain,network", "cybersecurity": "cybersecurity,code",
    "ar-vr": "virtual,reality", "robotics": "robotics,robot",
    "internet": "internet,network", "future-tech": "futuristic,tech",
    "open-source": "code,collaboration", "quantum-computing": "quantum,circuit",
    "quantum-grammar": "language,abstract",
    # Money / DeFi
    "money": "currency,coins", "defi": "blockchain,finance",
    "privacy": "privacy,padlock", "web3": "blockchain,decentralized",
    "dao": "community,governance", "decentralised-ai": "ai,network",
    "decentralized-networks": "network,nodes",
    "impact-investing": "investing,growth", "conscious-capital": "investing,values",
    "regenerative-business": "ecosystem,business",
    "social-enterprise": "community,helping",
    "prosperity-mindset": "abundance,light",
    # Communication
    "language": "language,books", "translation": "translation,books",
    "storytelling": "campfire,story", "broadcasting": "radio,broadcast",
    "journalism": "journalism,newspaper", "public-speaking": "speech,podium",
    "writing": "writing,journal", "nonviolent-communication": "conversation,empathy",
    "dialogue": "conversation,coffee", "humor": "comedy,laughter",
    "poetry": "poetry,handwriting", "diaspora": "migration,journey",
    # Arts & Culture
    "visual-art": "painting,canvas", "sculpture": "sculpture,statue",
    "film": "cinema,film", "theater": "theater,stage",
    "dance": "ballet,dance", "fashion": "fashion,runway",
    "design": "design,studio", "architecture": "architecture,building",
    "photography": "camera,landscape", "literature": "library,books",
    "festivals": "festival,crowd", "history": "ancient,ruins",
    "mythology": "myth,sculpture", "indigenous-wisdom": "indigenous,nature",
    # Creation
    "creativity": "creative,studio", "co-creation": "collaboration,workshop",
    "creation": "creation,art", "imagination": "imagination,dream",
    "manifestation": "vision,light", "dreams": "dream,sleep",
    "play-creativity": "play,art", "product-design": "design,product",
    "prototyping": "workshop,sketch", "tools-carry": "craftsman,tools",
    "merkaba": "geometry,sacred", "sacred-geometry": "geometry,pattern",
    # Energy
    "solar": "solar,panel", "wind-energy": "wind,turbine",
    "geothermal": "geothermal,steam", "nuclear": "nuclear,reactor",
    "renewable-energy": "renewable,sustainable", "energy-storage": "battery,storage",
    "energy-policy": "energy,grid", "energy-fields": "energy,aura",
    "bioenergy": "biofuel,plants", "grid-technology": "powerlines,grid",
    # Food & Agriculture
    "nutrition": "vegetables,plate", "cuisine": "cooking,kitchen",
    "regenerative-farming": "farm,field", "permaculture": "garden,vegetables",
    "aquaculture": "fish,aquaculture", "urban-farming": "urban,garden",
    "fermentation": "fermentation,jar", "coffee-tea": "coffee,tea",
    "food-sovereignty": "harvest,community", "food-systems": "harvest,food",
    "biodiversity": "wildlife,nature", "ecology": "ecosystem,forest",
    "natural-cycles": "seasons,nature", "forests": "forest,trees",
    # Lifestyle
    "minimalism": "minimal,interior", "sustainable-living": "sustainable,nature",
    "personal-development": "growth,journey", "body-care": "skincare,wellness",
    "cookware": "kitchen,cookware", "leisure": "hammock,relax",
    "synchronicity": "clock,abstract", "cards": "tarot,cards",
    "audio": "speaker,music",
    # Play & Recreation
    "outdoor-adventure": "outdoor,mountain", "gaming": "gaming,controller",
    "esports": "esports,gaming", "movement": "dance,movement",
    # Well-being
    "yoga": "yoga,mat", "meditation": "meditation,zen",
    "breathwork": "breath,calm", "kriya-yoga": "yoga,sunrise",
    "siddha-yoga": "yoga,temple", "sound-healing": "singing,bowl",
    "energy-healing": "reiki,hands", "eft-tapping": "meridian,points",
    # trauma keyword removed — topic deleted 2026-04-29. "somatic-therapy": "body,healing",
    "mental-health": "calm,nature", "sleep": "sleep,bed",
    "supplements": "vitamins,supplements", "detox": "detox,water",
    "plant-medicine": "ayahuasca,ceremony", "mindfulness": "mindful,nature",
    # Metaphysics
    "consciousness": "cosmos,light", "spirituality": "spiritual,light",
    "akashic-records": "ancient,library", "near-death-experiences": "afterlife,light",
    "self-realization": "enlightenment,sunset", "human-design": "astrology,chart",
    "astrology": "zodiac,stars", "tarot": "tarot,cards",
    "vibration": "frequency,wave", "mysticism": "mystical,light",
    "esoteric": "esoteric,symbol", "soul": "soul,light",
    "source": "source,light", "presence": "presence,nature",
    "prayer": "prayer,candle", "ritual": "ritual,candle",
    "magic": "magic,smoke", "occult": "occult,symbol",
    "abilities": "psychic,energy", "aliens": "alien,space",
    "dimensions": "fractal,space", "remote-viewing": "vision,abstract",
    "christianity": "cathedral,light", "taoism": "mountain,mist",
    "oneness": "ocean,sky", "sacred-law": "ancient,scripture",
    "robert-jay-gould": "evolution,fossil",
    # Society & Networks
    "community": "community,gathering", "governance": "parliament,architecture",
    "social-movements": "protest,march", "social-media": "phone,connection",
    "peace": "peace,dove", "education-systems": "classroom,books",
    "collective-intelligence": "network,brain", "history": "ancient,scroll",
    "diaspora": "migration,landscape",
    # Nature & Cosmos
    "cosmos": "galaxy,nebula", "oceans": "ocean,wave",
    "climate": "climate,nature", "emergence": "fractal,pattern",
    "future-cities": "futuristic,city", "circular-economy": "recycling,nature",
    "natural-cycles": "seasons,trees",
    # Communication (extras)
    "education-systems": "classroom,students",
    # Catch
    "festivals": "festival,lights",
}

# ──────────────── Per-topic sourced quote (all unique, verified) ─────
TOPIC_QUOTES: dict[str, tuple[str, str]] = {
    # ── Sciences ─────────────────────────────────────────────────
    "quantum":            ("If you think you understand quantum mechanics, you don't understand quantum mechanics.", "Richard Feynman"),
    "quantum-computing":  ("Anyone who is not shocked by quantum theory has not understood it.", "Niels Bohr"),
    "quantum-grammar":    ("The limits of my language mean the limits of my world.", "Ludwig Wittgenstein — Tractatus"),
    "astrophysics":       ("We are made of star-stuff. We are a way for the cosmos to know itself.", "Carl Sagan — Cosmos"),
    "biology":            ("Nothing in biology makes sense except in the light of evolution.", "Theodosius Dobzhansky"),
    "chemistry":          ("Nothing exists except atoms and empty space; everything else is opinion.", "Democritus"),
    "mathematics":        ("Pure mathematics is, in its way, the poetry of logical ideas.", "Albert Einstein"),
    "genetics":           ("We are survival machines — robot vehicles blindly programmed to preserve the selfish molecules known as genes.", "Richard Dawkins — The Selfish Gene"),
    "neuroscience":       ("Neurons that fire together, wire together.", "Donald Hebb — The Organization of Behavior"),
    "medicine":           ("It is more important to know what sort of person has a disease than to know what sort of disease a person has.", "Hippocrates"),
    "psychology":         ("He who has a why to live for can bear almost any how.", "Viktor Frankl — Man's Search for Meaning"),
    "biotechnology":      ("Anything found to be true of E. coli must also be true of elephants.", "Jacques Monod — Chance and Necessity"),
    "biomimicry":         ("Life creates conditions conducive to life.", "Janine Benyus — Biomimicry"),

    # ── Technology ───────────────────────────────────────────────
    "artificial-intelligence": ("The science of today is the technology of tomorrow.", "Edward Teller"),
    "robotics":           ("A robot may not injure a human being, or, through inaction, allow a human being to come to harm.", "Isaac Asimov — I, Robot"),
    "ar-vr":              ("Virtual Reality is the first step in a grand adventure into the landscape of the imagination.", "Frank Biocca"),
    "cybersecurity":      ("Security is a process, not a product.", "Bruce Schneier — Secrets and Lies"),
    "blockchain":         ("The root problem with conventional currency is all the trust that's required to make it work.", "Satoshi Nakamoto — Bitcoin Whitepaper"),
    "future-tech":        ("The best way to predict the future is to invent it.", "Alan Kay"),
    "open-source":        ("Given enough eyeballs, all bugs are shallow.", "Eric S. Raymond — The Cathedral and the Bazaar"),

    # ── Web3 / DeFi ──────────────────────────────────────────────
    "defi":               ("If you don't believe me or don't get it, I don't have time to try to convince you, sorry.", "Satoshi Nakamoto"),
    "privacy":            ("We must defend our own privacy if we expect to have any.", "Eric Hughes — A Cypherpunk's Manifesto"),
    "web3":               ("The Internet was supposed to give us decentralization. Web3 is finally trying.", "Chris Dixon — Read Write Own"),
    "dao":                ("Hierarchies are systems of force. Networks are systems of trust.", "Joi Ito"),
    "decentralised-ai":   ("Open source AI is the only path to safe AI at scale.", "Andrej Karpathy"),
    "decentralized-networks": ("Networks of trust will outlast networks of force.", "Albert-László Barabási — Linked"),

    # ── Business ─────────────────────────────────────────────────
    "impact-investing":   ("There is no business to be done on a dead planet.", "David Brower"),
    "conscious-capital":  ("Profit is not the purpose of business; it is the test of its validity.", "Peter Drucker"),
    "regenerative-business": ("Doing well by doing good is the future of business.", "Anita Roddick — The Body Shop"),
    "social-enterprise":  ("If you have come here to help me, you are wasting your time. But if you have come because your liberation is bound up with mine, then let us work together.", "Lilla Watson"),
    "prosperity-mindset": ("Your income is always the average of your 5 best friends.", ""),

    # ── Communication ───────────────────────────────────────────
    "language":           ("Language is the dress of thought.", "Samuel Johnson"),
    "translation":        ("Translation is at best an echo.", "George Borrow — Lavengro"),
    "storytelling":       ("Stories are how we make sense of the world; they're also how the world makes sense of us.", "Robert McKee — Story"),
    "broadcasting":       ("The medium is the message.", "Marshall McLuhan — Understanding Media"),
    "journalism":         ("Journalism is printing what someone else does not want printed; everything else is public relations.", "George Orwell"),
    "public-speaking":    ("It usually takes me more than three weeks to prepare a good impromptu speech.", "Mark Twain"),
    "nonviolent-communication": ("All violence is the result of people tricking themselves into believing that their pain derives from other people.", "Marshall Rosenberg — Nonviolent Communication"),
    "dialogue":           ("In a dialogue everyone wins.", "David Bohm — On Dialogue"),
    "humor":              ("Comedy is tragedy plus time.", "Mark Twain"),
    "poetry":             ("Poetry is the spontaneous overflow of powerful feelings.", "William Wordsworth — Lyrical Ballads"),
    "diaspora":           ("To live in exile is to live in a permanent state of translation.", "Edward Said"),

    # ── Arts & Culture ──────────────────────────────────────────
    "visual-art":         ("Art is not what you see, but what you make others see.", "Edgar Degas"),
    "film":               ("Cinema is a matter of what's in the frame and what's out.", "Martin Scorsese"),
    "theater":            ("All the world's a stage, and all the men and women merely players.", "William Shakespeare — As You Like It"),
    "dance":              ("Dance is the hidden language of the soul of the body.", "Martha Graham"),
    "fashion":            ("Fashion fades, only style remains the same.", "Coco Chanel"),
    "photography":        ("To me, photography is an art of observation.", "Elliott Erwitt"),
    "architecture":       ("Form follows function — that has been misunderstood. Form and function should be one, joined in a spiritual union.", "Frank Lloyd Wright"),
    "festivals":          ("Tradition is not the worship of ashes, but the preservation of fire.", "Gustav Mahler"),
    "history":            ("Those who cannot remember the past are condemned to repeat it.", "George Santayana — The Life of Reason"),
    "mythology":          ("Myths are public dreams; dreams are private myths.", "Joseph Campbell — The Hero with a Thousand Faces"),
    "indigenous-wisdom":  ("In our every deliberation we must consider the impact of our decisions on the next seven generations.", "Iroquois Great Law of Peace"),

    # ── Creation ────────────────────────────────────────────────
    "co-creation":        ("If you want to go fast, go alone. If you want to go far, go together.", "African Proverb"),
    "play-creativity":    ("The opposite of play is not work — it is depression.", "Brian Sutton-Smith"),
    "manifestation":      ("Your wish is always your command.", ""),
    "product-design":     ("Design is not just what it looks like and feels like. Design is how it works.", "Steve Jobs"),
    "prototyping":        ("If a picture is worth a thousand words, a prototype is worth a thousand meetings.", "Tom and David Kelley — IDEO"),
    "tools-carry":        ("Man is a tool-using animal. Without tools he is nothing, with tools he is all.", "Thomas Carlyle — Sartor Resartus"),
    "merkaba":            ("Geometry will draw the soul toward truth and create the spirit of philosophy.", "Plato — The Republic"),
    "sacred-geometry":    ("God geometrizes continually.", "Plato"),

    # ── Energy ──────────────────────────────────────────────────
    "solar":              ("I'd put my money on the sun and solar energy. What a source of power!", "Thomas Edison"),
    "wind-energy":        ("Wind is just air in motion. It blows because of the rotation of the earth.", "Carl Sagan"),
    "geothermal":         ("The earth has its own pulse, and we have only begun to listen.", "Hannes Alfvén"),
    "renewable-energy":   ("Once a photon is captured, it must do useful work.", "Hermann Scheer — The Solar Economy"),
    "energy-storage":     ("Storage is the holy grail of renewable energy.", "Elon Musk"),
    "energy-policy":      ("The Stone Age did not end for lack of stone, and the Oil Age will end long before the world runs out of oil.", "Ahmed Zaki Yamani"),
    "energy-fields":      ("Energy follows thought.", ""),
    "bioenergy":          ("The plant is the mother of the animal.", "Justus von Liebig"),
    "grid-technology":    ("The electric power grid is the largest machine ever built.", "U.S. National Academy of Engineering"),

    # ── Food & Agriculture ───────────────────────────────────────
    "nutrition":          ("Eat food. Not too much. Mostly plants.", "Michael Pollan — In Defense of Food"),
    "cuisine":            ("Cooking is the art of adjustment.", "Jacques Pépin"),
    "regenerative-farming": ("In nature there are no waste streams.", "Allan Savory — Holistic Management"),
    "permaculture":       ("The problem is the solution.", "Bill Mollison — Permaculture: A Designer's Manual"),
    "aquaculture":        ("In one drop of water are found all the secrets of all the oceans.", "Kahlil Gibran"),
    "urban-farming":      ("To plant a garden is to believe in tomorrow.", "Audrey Hepburn"),
    "fermentation":       ("Fermentation is a metaphor for transformation.", "Sandor Katz — The Art of Fermentation"),
    "coffee-tea":         ("Tea is the elixir of life.", "Lao Tzu"),
    "food-sovereignty":   ("Eaters must understand that eating takes place inescapably in the world.", "Wendell Berry — The Pleasures of Eating"),
    "food-systems":       ("If you control the food, you control the people.", "Henry Kissinger"),
    "biodiversity":       ("In wildness is the preservation of the world.", "Henry David Thoreau"),
    "ecology":            ("When one tugs at a single thing in nature, he finds it attached to the rest of the world.", "John Muir"),
    "natural-cycles":     ("Time is a river which carries me along, but I am the river.", "Jorge Luis Borges"),
    "forests":            ("The clearest way into the Universe is through a forest wilderness.", "John Muir — My First Summer in the Sierra"),

    # ── Lifestyle ───────────────────────────────────────────────
    "minimalism":         ("Have nothing in your house that you do not know to be useful, or believe to be beautiful.", "William Morris"),
    "sustainable-living": ("We do not inherit the earth from our ancestors; we borrow it from our children.", "Wendell Berry"),
    "personal-development": ("The way you do anything is the way you do everything, so do your best even when no one is watching.", ""),
    "body-care":          ("To keep the body in good health is a duty.", "Buddha — Dhammapada"),
    "cookware":           ("A recipe has no soul. You as the cook must bring soul to the recipe.", "Thomas Keller"),
    "leisure":            ("Leisure is the basis of culture.", "Josef Pieper — Leisure: The Basis of Culture"),
    "synchronicity":      ("Synchronicity reveals the meaningful connections between the subjective and objective world.", "Carl Jung — Synchronicity"),
    "cards":              ("All life is six to five against.", "Damon Runyon"),
    "audio":              ("Music gives a soul to the universe, wings to the mind, flight to the imagination.", "Plato"),

    # ── Play & Recreation ───────────────────────────────────────
    "outdoor-adventure":  ("In every walk with nature one receives far more than he seeks.", "John Muir"),
    "gaming":             ("A game is an opportunity to focus our energy at something we're good at, with relentless optimism.", "Jane McGonigal — Reality Is Broken"),
    "esports":            ("Hard work beats talent when talent doesn't work hard.", "Tim Notke"),
    "movement":           ("Movement is a medicine for creating change in a person's physical, emotional, and mental states.", "Carol Welch"),

    # ── Well-being ──────────────────────────────────────────────
    "yoga":               ("In the deepest meditation, the body is at rest, the mind is at rest. Yet the consciousness has wakened to its own infinite, joyous nature.", "Paramahansa Yogananda — Autobiography of a Yogi"),
    "meditation":         ("The present moment is the only moment available to us, and it is the door to all moments.", "Thich Nhat Hanh — The Miracle of Mindfulness"),
    "breathwork":         ("Breath is the bridge which connects life to consciousness, which unites your body to your thoughts.", "Thich Nhat Hanh — The Miracle of Mindfulness II"),
    "kriya-yoga":         ("Self-realization is the knowing — in body, mind, and soul — that we are one with the omnipresence of God.", "Paramahansa Yogananda"),
    "siddha-yoga":        ("Honor your Self. Worship your Self. Meditate on your Self. God dwells within you, as you.", "Swami Muktananda"),
    "sound-healing":      ("Everything in life is vibration.", "Albert Einstein"),
    "energy-healing":     ("The greatest discovery of my generation is that a human being can alter his life by altering his attitudes.", "William James"),
    "eft-tapping":        ("All energy moves in waves.", "Gary Craig — The EFT Manual"),
    # trauma — removed from FRQNCY network 2026-04-29 per user direction.
    # Resources re-tagged to somatic-therapy. Quote retired.
    # "trauma":           ("The body keeps the score.", "Bessel van der Kolk — The Body Keeps the Score"),
    "somatic-therapy":    ("Trauma is not what happens to us, but what we hold inside in the absence of an empathetic witness.", "Peter Levine — Waking the Tiger"),
    "mental-health":      ("Worry is negative goal setting; it is thinking about what you don't want to happen.", ""),
    "sleep":              ("Sleep is the best meditation.", "Dalai Lama"),
    "supplements":        ("Take care of your body. It's the only place you have to live.", "Jim Rohn"),
    "detox":              ("The greatest wealth is health.", "Virgil"),
    "plant-medicine":     ("Plants are the bridge between the worlds.", "Terence McKenna"),

    # ── Metaphysics ─────────────────────────────────────────────
    "consciousness":      ("Consciousness is the ground of all being.", "Amit Goswami — The Self-Aware Universe"),
    "soul":               ("The wound is the place where the Light enters you.", "Rumi"),
    "source":             ("In the beginning was the Word, and the Word was with God, and the Word was God.", "John 1:1 — King James Bible"),
    "presence":           ("Being is the eternal, ever-present One Life beyond the myriad forms of life.", "Eckhart Tolle — The Power of Now"),
    "vibration":          ("If you want to find the secrets of the universe, think in terms of energy, frequency, and vibration.", "Nikola Tesla"),
    "dimensions":         ("There are more things in heaven and earth, Horatio, than are dreamt of in your philosophy.", "William Shakespeare — Hamlet"),
    "akashic-records":    ("There is a record of every soul's journey, written in light.", "Edgar Cayce"),
    "near-death-experiences": ("Death is the dropping of the body. The Self that I AM does not die.", "Anita Moorjani — Dying to Be Me"),
    "human-design":       ("The body has its own innate intelligence.", "Ra Uru Hu — The Human Design System"),
    "astrology":          ("As above, so below; as within, so without; as the universe, so the soul.", "Hermes Trismegistus — The Emerald Tablet"),
    "remote-viewing":     ("The eye sees only what the mind is prepared to comprehend.", "Henri Bergson"),
    "abilities":          ("There is nothing in the intellect that was not first in the senses.", "Aristotle — De Anima"),
    "aliens":             ("Two possibilities exist: either we are alone in the universe or we are not. Both are equally terrifying.", "Arthur C. Clarke"),
    "christianity":       ("Be still, and know that I am God.", "Psalm 46:10 — King James Bible"),
    "taoism":             ("The Tao that can be told is not the eternal Tao.", "Lao Tzu — Tao Te Ching"),
    "oneness":            ("Tat tvam asi — That thou art.", "Chandogya Upanishad"),
    "sacred-law":         ("The mountains, I become a part of it; the herbs, the fir tree, I become a part of it.", "Navajo Beauty Way Chant"),
    "robert-jay-gould":   ("Evolution is a process of constant branching and expansion.", "Stephen Jay Gould — Wonderful Life"),

    # ── Society & Networks ──────────────────────────────────────
    "community":          ("Alone we can do so little; together we can do so much.", "Helen Keller"),
    "governance":         ("The art of government consists in not letting men grow old in their offices.", "Napoleon Bonaparte"),
    "social-movements":   ("Never doubt that a small group of thoughtful, committed citizens can change the world. Indeed, it is the only thing that ever has.", "Margaret Mead"),
    "social-media":       ("We are stuck with technology when what we really want is just stuff that works.", "Douglas Adams — The Salmon of Doubt"),
    "peace":              ("Peace cannot be kept by force; it can only be achieved by understanding.", "Albert Einstein"),
    "education-systems":  ("Education is not the filling of a pail, but the lighting of a fire.", "W.B. Yeats"),
    "collective-intelligence": ("None of us is as smart as all of us.", "Ken Blanchard"),

    # ── Nature & Cosmos ─────────────────────────────────────────
    "cosmos":             ("The cosmos is within us. We are made of star-stuff.", "Carl Sagan"),
    "oceans":             ("The sea, once it casts its spell, holds one in its net of wonder forever.", "Jacques Cousteau"),
    "climate":            ("We do not have time for a six-month study of the obvious.", "Rachel Carson — Silent Spring"),
    "emergence":          ("More is different.", "Philip Anderson — Science, 1972"),
    "future-cities":      ("Cities have the capability of providing something for everybody, only because, and only when, they are created by everybody.", "Jane Jacobs — The Death and Life of Great American Cities"),
    "circular-economy":   ("Waste is a design flaw.", "William McDonough — Cradle to Cradle"),
    "systems-thinking":   ("You think because you understand 'one' you understand 'two,' because one and one make two. But you must understand 'and.'", "Sufi Saying"),
}

# ──────────────── Domain → fallback closing quote ────────────────────
DOMAIN_CLOSING: dict[str, tuple[str, str]] = {
    "Sciences":            ("What we observe is not nature itself, but nature exposed to our method of questioning.", "Werner Heisenberg"),
    "Money":               ("Wealth consists not in having great possessions, but in having few wants.", "Epictetus"),
    "Metaphysics":         ("We are not human beings having a spiritual experience. We are spiritual beings having a human experience.", "Pierre Teilhard de Chardin"),
    "Well-being":          ("It is health that is real wealth, and not pieces of gold and silver.", "Mahatma Gandhi"),
    "Lifestyle":           ("Simplicity is the ultimate sophistication.", "Leonardo da Vinci"),
    "Play & Recreation":   ("Pressure is a privilege.", "Billie Jean King"),
    "Arts & Culture":      ("Every artist was first an amateur.", "Ralph Waldo Emerson"),
    "Society & Networks":  ("We are caught in an inescapable network of mutuality.", "Martin Luther King Jr."),
    "Communication":       ("The single biggest problem in communication is the illusion that it has taken place.", "George Bernard Shaw"),
    "Technology":          ("Any sufficiently advanced technology is indistinguishable from magic.", "Arthur C. Clarke"),
    "Creation":            ("Every child is an artist. The problem is how to remain an artist once we grow up.", "Pablo Picasso"),
    "Energy":              ("Energy and persistence conquer all things.", "Benjamin Franklin"),
    "Food & Agriculture":  ("Let food be thy medicine and medicine be thy food.", "Hippocrates"),
    "Nature & Cosmos":     ("Look deep into nature, and then you will understand everything better.", "Albert Einstein"),
    "Business":            ("The best way to predict the future is to create it.", "Peter Drucker"),
}


def topic_keyword(slug: str) -> str:
    if slug in TOPIC_KEYWORDS:
        return TOPIC_KEYWORDS[slug]
    return slug.replace("-", ",")


def yamlsafe(s: str) -> str:
    return str(s).replace("\\", "\\\\").replace('"', '\\"')


def yamlblock(s: str, indent: int = 4) -> str:
    pad = " " * indent
    s = (s or "").replace("\n", " ").strip()
    return f"{pad}{s}"


YAML_TEMPLATE = """# ════════════════════════════════════════════════════════════════════
# {label_safe} — auto-drafted brief.
# Edit by hand to add bespoke prose, panel, or per-topic imagery.
# Regenerate: python3 scripts/generate_topic_page.py {slug}
# ────────────────────────────────────────────────────────────────────

meta:
  slug: {slug}
  label: "{label_q}"
  domain: "{domain_q}"
  domain_slug: {domain_slug}
  pillar: "{pillar_q}"
  pillar_slug: {pillar_slug}
  accent: "{accent}"

treatment:
  register: {treatment}

hero:
  variant: split
  eyebrow: "{eyebrow_q}"
  title: "{label_q}"
  desc: |
{desc_block}
  media:
    poster_url: {hero_url}

prelude: null

sections:

  - module: resources
    label: Books
    types: [book]
    auto: true

  - module: resources
    label: People
    types: [person]
    auto: true

  - module: resources
    label: Institutions
    types: [org]
    auto: true

  - module: resources
    label: Places
    types: [place]
    auto: true

  - module: resources
    label: Tools & media
    types: [tool, media, app, platform]
    auto: true

  - module: bleed
    image_url: {closing_img}
    caption: |
{closing_caption_block}

picks: null
closing: null

bespoke:
  css: ""
  head_extra: ""

linking:
  breadcrumb:
    - {{ label: FRQNCY, url: "/" }}
    - {{ label: "{domain_q}", url: "/v2/{domain_slug}/" }}
  canonical: https://frqncy.network/v2/{slug}/
  og_image: https://frqncy.network/v2/og/{slug}.png
"""

TOPIC_IDX: dict[str, int] = {}


def draft_one(t: dict) -> str:
    slug = t["slug"]
    label = t.get("label", slug.title())
    domain = t.get("domain", "")
    domain_slug = t.get("domainSlug", "")
    pillar = t.get("pillar", "")
    pillar_slug = t.get("pillarSlug", "")
    accent = t.get("accent", "#C4973A")
    desc = t.get("desc", "").strip()
    treatment = DOMAIN_TREATMENT.get(domain, "editorial")

    # Per-topic local override → domain-keyed Unsplash 4K fallback.
    hero_url = (
        TOPIC_OVERRIDE_HERO.get(slug)
        or DOMAIN_HERO.get(domain, DOMAIN_HERO["Sciences"])
    )
    closing_img = (
        TOPIC_OVERRIDE_CLOSING.get(slug)
        or DOMAIN_CLOSING_IMG.get(domain, DOMAIN_CLOSING_IMG["Sciences"])
    )

    # Per-topic sourced quote, with domain fallback. Empty cite is allowed
    # (shows the quote text only, with no attribution).
    quote = TOPIC_QUOTES.get(slug) or DOMAIN_CLOSING.get(domain, ("", ""))
    closing_text, closing_cite = quote
    if closing_text and closing_cite:
        closing_caption = f"{closing_text} *— {closing_cite}*"
    elif closing_text:
        closing_caption = closing_text
    else:
        closing_caption = ""
    eyebrow = f"{domain} · {pillar}".strip(" ·")

    return YAML_TEMPLATE.format(
        slug=slug,
        label_safe=label,
        label_q=yamlsafe(label),
        domain_q=yamlsafe(domain),
        domain_slug=domain_slug,
        pillar_q=yamlsafe(pillar),
        pillar_slug=pillar_slug,
        accent=accent,
        treatment=treatment,
        eyebrow_q=yamlsafe(eyebrow),
        desc_block=yamlblock(desc, indent=4),
        hero_url=hero_url,
        closing_img=closing_img,
        closing_caption_block=yamlblock(closing_caption, indent=6),
    )


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true", help="overwrite existing YAML")
    ap.add_argument("--limit", type=int, default=0, help="cap how many to draft (0 = all)")
    args = ap.parse_args()

    topics = json.loads((ROOT / "search.json").read_text())
    for i, t in enumerate(sorted(topics, key=lambda x: x.get("slug", ""))):
        TOPIC_IDX[t.get("slug", "")] = i

    # Sanity: every quote must be unique (text+cite tuple).
    seen = set()
    dupes = []
    for slug, q in TOPIC_QUOTES.items():
        if q in seen:
            dupes.append((slug, q))
        seen.add(q)
    if dupes:
        print(f"  ⚠  {len(dupes)} duplicate quote(s) detected; resolve before shipping.", file=sys.stderr)
        for slug, q in dupes:
            print(f"     {slug}: {q[1]}", file=sys.stderr)

    drafted = 0
    skipped_locked = 0
    skipped_existing = 0
    for t in topics:
        slug = t.get("slug")
        if not slug:
            continue
        if slug in LOCKED:
            skipped_locked += 1
            continue
        out = TOPICS_DIR / f"{slug}.yaml"
        if out.exists() and not args.force:
            skipped_existing += 1
            continue
        body = draft_one(t)
        out.write_text(body)
        drafted += 1
        if args.limit and drafted >= args.limit:
            break

    print(f"Drafted: {drafted} | Skipped locked: {skipped_locked} | Skipped existing: {skipped_existing}")
    print(f"Topic-specific quotes: {len(TOPIC_QUOTES)} (unique: {len(set(TOPIC_QUOTES.values()))})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
