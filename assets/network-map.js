/* FRQNCY network constellation widget.
 *
 *   Used on the home page (full topology + 1000 human stars) and on each
 *   /<domain>/ page (filtered to just that domain and its topics).
 *
 *   Public API on window.FRQNCYNetworkMap:
 *     - init(opts)            — render into the configured container
 *     - filterByDomain(id)    — return {nodes,links,urls} subset for one d-* node
 *     - HOME_DATA             — { nodes, links, urls } for the full home view
 *
 *   opts (all optional):
 *     containerId, canvasId, svgId, defsId, tooltipId, hintId, loadingId
 *     nodes, links, urls      — defaults to HOME_DATA
 *     humans                  — number of background "human stars" (default 1000; 0 disables)
 *     showCoreLinks           — when false, skip core/pillar link layers (used for solo-domain views)
 */
(function(){
  'use strict';

  // ===== HOME DATASET (canonical full topology) =====
  const HOME_NODES = [
    {id:"frqncy",label:"FRQNCY",type:"core",r:52,desc:"The living network of consciousness"},
    {id:"network-state",label:"Network State",type:"main",r:30,desc:"The sovereign community"},
    {id:"fund",label:"Fund",type:"main",r:29,desc:"Capital allocation"},
    {id:"education",label:"Education",type:"main",r:30,desc:"Transmitting what's known"},
    {id:"research",label:"Research",type:"main",r:29,desc:"Exploring what isn't known yet"},
    {id:"media",label:"Media",type:"main",r:29,desc:"Spreading the signal"},
    {id:"builder",label:"Builder",type:"main",r:30,desc:"Creating products, tools, experiences"},
    {id:"curate",label:"Curate",type:"main",r:29,desc:"Picking with care"},
    {id:"sell",label:"Sell",type:"main",r:29,desc:"Commerce as transparent service"},
    {id:"d-sciences",label:"Sciences",type:"cluster",r:24,desc:"Empirical exploration of reality"},
    {id:"d-tech",label:"Technology",type:"cluster",r:24,desc:"Tools shaping the future"},
    {id:"d-arts",label:"Arts & Culture",type:"cluster",r:23,desc:"Expression of the human spirit"},
    {id:"d-nature",label:"Nature & Cosmos",type:"cluster",r:24,desc:"The living systems of existence"},
    {id:"d-business",label:"Business",type:"cluster",r:22,desc:"Regenerative enterprise and social models"},
    {id:"d-money",label:"Money",type:"cluster",r:23,desc:"Capital, crypto, and the new financial layer"},
    {id:"d-meta",label:"Consciousness",type:"cluster",r:25,desc:"The architecture of reality"},
    {id:"d-lifestyle",label:"Lifestyle",type:"cluster",r:22,desc:"Conscious ways of living"},
    {id:"d-creation",label:"Creation",type:"cluster",r:23,desc:"Building what has never existed"},
    {id:"d-wellbeing",label:"Well-being",type:"cluster",r:24,desc:"Healing and wholeness"},
    {id:"d-society",label:"Society & Networks",type:"cluster",r:23,desc:"Collective human systems"},
    {id:"d-communication",label:"Communication",type:"cluster",r:23,desc:"How humans connect and express meaning"},
    {id:"d-energy",label:"Energy",type:"cluster",r:23,desc:"The forces and resources that power existence"},
    {id:"d-food",label:"Food & Agriculture",type:"cluster",r:23,desc:"Growing, sharing and consuming nourishment"},
    {id:"d-play",label:"Play & Recreation",type:"cluster",r:22,desc:"Joy, games, sports and leisure"},
    {id:"t-quantum",label:"Quantum Physics",type:"topic",r:14},
    {id:"t-neuro",label:"Neuroscience",type:"topic",r:14},
    {id:"t-bio",label:"Biology",type:"topic",r:13},
    {id:"t-psych",label:"Psychology",type:"topic",r:14},
    {id:"t-med",label:"Medicine",type:"topic",r:13},
    {id:"t-math",label:"Mathematics",type:"topic",r:13},
    {id:"t-astrophys",label:"Astrophysics",type:"topic",r:14},
    {id:"t-ecology",label:"Ecology",type:"topic",r:13},
    {id:"t-genetics",label:"Genetics",type:"topic",r:13},
    {id:"t-chemistry",label:"Chemistry",type:"topic",r:12},
    {id:"t-ai",label:"Artificial Intelligence",type:"topic",r:16},
    {id:"t-blockchain",label:"Blockchain",type:"topic",r:15},
    {id:"t-decentral",label:"Decentralized Networks",type:"topic",r:15},
    {id:"t-arvr",label:"AR / VR",type:"topic",r:13},
    {id:"t-biotech",label:"Biotechnology",type:"topic",r:14},
    {id:"t-robotics",label:"Robotics",type:"topic",r:13},
    {id:"t-web3",label:"Web3",type:"topic",r:15},
    {id:"t-quantcomp",label:"Quantum Computing",type:"topic",r:14},
    {id:"t-cybersec",label:"Cybersecurity",type:"topic",r:13},
    {id:"t-music",label:"Music",type:"topic",r:16},
    {id:"t-visual",label:"Visual Art",type:"topic",r:14},
    {id:"t-film",label:"Film",type:"topic",r:13},
    {id:"t-poetry",label:"Poetry",type:"topic",r:13},
    {id:"t-dance",label:"Dance",type:"topic",r:13},
    {id:"t-archit",label:"Architecture",type:"topic",r:13},
    {id:"t-fashion",label:"Fashion",type:"topic",r:12},
    {id:"t-story",label:"Storytelling",type:"topic",r:14},
    {id:"t-photo",label:"Photography",type:"topic",r:12},
    {id:"t-theater",label:"Theater",type:"topic",r:12},
    {id:"t-sacredgeo",label:"Sacred Geometry",type:"topic",r:15},
    {id:"t-astrology",label:"Astrology",type:"topic",r:14},
    {id:"t-climate",label:"Climate",type:"topic",r:14},
    {id:"t-biodivers",label:"Biodiversity",type:"topic",r:13},
    {id:"t-oceans",label:"Oceans",type:"topic",r:13},
    {id:"t-forests",label:"Forests",type:"topic",r:13},
    {id:"t-cosmos",label:"Stars & Planets",type:"topic",r:14},
    {id:"t-efields",label:"Energy Fields",type:"topic",r:14},
    {id:"t-cycles",label:"Seasons & Cycles",type:"topic",r:13},
    {id:"t-defi",label:"DeFi",type:"topic",r:15},
    {id:"t-impact",label:"Impact Investing",type:"topic",r:14},
    {id:"t-socialent",label:"Social Enterprise",type:"topic",r:14},
    {id:"t-circular",label:"Circular Economy",type:"topic",r:14},
    {id:"t-conscap",label:"Conscious Capital",type:"topic",r:14},
    {id:"t-regenbiz",label:"Regenerative Business",type:"topic",r:14},
    {id:"t-dao",label:"DAOs",type:"topic",r:13},
    {id:"t-crypto",label:"Cryptocurrency",type:"subcluster",r:22},
    {id:"t-wealth-mind",label:"Prosperity Mindset",type:"topic",r:13},
    {id:"t-cards",label:"Cards",type:"topic",r:13},
    {id:"t-personal-finance",label:"Personal Finance",type:"topic",r:14},
    {id:"t-stocks",label:"Stocks",type:"subcluster",r:20},
    {id:"t-bonds",label:"Bonds",type:"topic",r:13},
    {id:"t-etfs",label:"ETFs",type:"topic",r:13},
    {id:"t-commodities",label:"Commodities",type:"subcluster",r:21},
    {id:"t-gold",label:"Gold",type:"topic",r:15},
    {id:"t-silver",label:"Silver",type:"topic",r:14},
    {id:"t-platinum",label:"Platinum",type:"topic",r:13},
    {id:"t-palladium",label:"Palladium",type:"topic",r:13},
    {id:"t-uranium",label:"Uranium",type:"topic",r:14},
    {id:"t-copper",label:"Copper",type:"topic",r:13},
    {id:"t-oil",label:"Oil",type:"topic",r:15},
    {id:"t-lithium",label:"Lithium",type:"topic",r:14},
    {id:"t-rare-earths",label:"Rare Earths",type:"topic",r:14},
    {id:"t-carbon-credits",label:"Carbon Credits",type:"topic",r:14},
    {id:"t-water",label:"Water",type:"topic",r:14},
    {id:"t-natgas",label:"Natural Gas",type:"topic",r:13},
    {id:"t-nickel",label:"Nickel",type:"topic",r:13},
    {id:"t-cobalt",label:"Cobalt",type:"topic",r:13},
    {id:"t-wheat",label:"Wheat",type:"topic",r:13},
    {id:"t-diamonds",label:"Diamonds",type:"topic",r:13},
    {id:"t-iron",label:"Iron Ore",type:"topic",r:13},
    {id:"t-aluminum",label:"Aluminum",type:"topic",r:12},
    {id:"t-zinc",label:"Zinc",type:"topic",r:12},
    {id:"t-lead",label:"Lead",type:"topic",r:12},
    {id:"t-tin",label:"Tin",type:"topic",r:12},
    {id:"t-sugar",label:"Sugar",type:"topic",r:13},
    {id:"t-cotton",label:"Cotton",type:"topic",r:13},
    {id:"t-hydrogen",label:"Hydrogen",type:"topic",r:14},
    {id:"t-bitcoin",label:"Bitcoin",type:"topic",r:16},
    {id:"t-sov",label:"Store of Value",type:"topic",r:14},
    {id:"t-l1",label:"Layer 1s",type:"topic",r:14},
    {id:"t-l2",label:"Layer 2s",type:"topic",r:13},
    {id:"t-stablecoins",label:"Stablecoins",type:"topic",r:14},
    {id:"t-rwa",label:"Real World Assets",type:"topic",r:14},
    {id:"t-depin",label:"DePIN",type:"topic",r:13},
    {id:"t-desci",label:"DeSci",type:"topic",r:13},
    {id:"t-gamefi",label:"GameFi",type:"topic",r:13},
    {id:"t-socialfi",label:"SocialFi",type:"topic",r:13},
    {id:"t-memes",label:"Memes",type:"topic",r:13},
    {id:"t-modular",label:"Modular",type:"topic",r:13},
    {id:"t-oracles",label:"Oracles",type:"topic",r:13},
    {id:"t-staking",label:"Staking",type:"topic",r:13},
    {id:"t-deai",label:"DeAI",type:"topic",r:13},
    {id:"t-icm",label:"Internet Capital",type:"topic",r:13},
    {id:"t-neobanks",label:"Neobanks",type:"topic",r:13},
    {id:"t-nfts",label:"NFTs",type:"topic",r:13},
    {id:"t-predictions",label:"Prediction Markets",type:"topic",r:13},
    {id:"t-crypto-privacy",label:"Crypto Privacy",type:"topic",r:13},
    {id:"t-privacy",label:"Privacy & Sovereignty",type:"topic",r:13},
    {id:"t-oneness",label:"Oneness",type:"topic",r:16},
    {id:"t-source",label:"Source Energy",type:"topic",r:15},
    {id:"t-soul",label:"Soul Purpose",type:"topic",r:14},
    {id:"t-akashic",label:"Akashic Records",type:"topic",r:14},
    {id:"t-dims",label:"Higher Dimensions",type:"topic",r:14},
    {id:"t-sync",label:"Synchronicity",type:"topic",r:13},
    {id:"t-saclaw",label:"Sacred Law",type:"topic",r:13},
    {id:"t-merkaba",label:"Merkaba",type:"topic",r:13},
    {id:"t-vibration",label:"Vibration & Frequency",type:"topic",r:15},
    {id:"t-nutrition",label:"Nutrition",type:"topic",r:13},
    {id:"t-movement",label:"Movement",type:"topic",r:13},
    {id:"t-sleep",label:"Sleep",type:"topic",r:12},
    {id:"t-plantmed",label:"Plant Medicine",type:"topic",r:14},
    {id:"t-community",label:"Community Living",type:"topic",r:14},
    {id:"t-minimalism",label:"Minimalism",type:"topic",r:13},
    {id:"t-detox",label:"Digital Detox",type:"topic",r:12},
    {id:"t-sustliving",label:"Sustainable Living",type:"topic",r:14},
    {id:"t-proddesign",label:"Product Design",type:"topic",r:13},
    {id:"t-systems",label:"Systems Thinking",type:"topic",r:14},
    {id:"t-opensource",label:"Open Source",type:"topic",r:14},
    {id:"t-cocreate",label:"Co-creation",type:"topic",r:14},
    {id:"t-proto",label:"Prototyping",type:"topic",r:13},
    {id:"t-emergence",label:"Emergence",type:"topic",r:14},
    {id:"t-biomimicry",label:"Biomimicry",type:"topic",r:14},
    {id:"t-futuretech",label:"Future of Work",type:"topic",r:13},
    {id:"t-meditation",label:"Meditation",type:"topic",r:16},
    {id:"t-soundheal",label:"Sound Healing",type:"topic",r:15},
    {id:"t-breathwork",label:"Breathwork",type:"topic",r:14},
    {id:"t-somatic",label:"Somatic Therapy",type:"topic",r:14},
    {id:"t-energyheal",label:"Energy Healing",type:"topic",r:14},
    {id:"t-yoga",label:"Yoga",type:"topic",r:14},
    {id:"t-mentalhlth",label:"Mental Health",type:"topic",r:14},
    {id:"t-governance",label:"Global Governance",type:"topic",r:14},
    {id:"t-indigenous",label:"Indigenous Wisdom",type:"topic",r:15},
    {id:"t-collective",label:"Collective Intelligence",type:"topic",r:15},
    {id:"t-socialmov",label:"Social Movements",type:"topic",r:14},
    {id:"t-peace",label:"Peace Building",type:"topic",r:14},
    {id:"t-futurecity",label:"Future Cities",type:"topic",r:14},
    {id:"t-edusystem",label:"Education Systems",type:"topic",r:14},
    {id:"t-diaspora",label:"Global Diaspora",type:"topic",r:13},
    {id:"t-language",label:"Language & Linguistics",type:"topic",r:14},
    {id:"t-speaking",label:"Public Speaking",type:"topic",r:13},
    {id:"t-dialogue",label:"Dialogue & Debate",type:"topic",r:13},
    {id:"t-journalism",label:"Journalism",type:"topic",r:14},
    {id:"t-socialmedia",label:"Social Media",type:"topic",r:14},
    {id:"t-nvc",label:"Nonviolent Communication",type:"topic",r:13},
    {id:"t-translation",label:"Translation",type:"topic",r:12},
    {id:"t-broadcasting",label:"Broadcasting",type:"topic",r:13},
    {id:"t-renewable",label:"Renewable Energy",type:"topic",r:15},
    {id:"t-solar",label:"Solar Energy",type:"topic",r:14},
    {id:"t-wind",label:"Wind Energy",type:"topic",r:13},
    {id:"t-geothermal",label:"Geothermal",type:"topic",r:13},
    {id:"t-storage",label:"Energy Storage",type:"topic",r:13},
    {id:"t-bioenergy",label:"Bioenergy",type:"topic",r:13},
    {id:"t-gridtech",label:"Grid Technology",type:"topic",r:13},
    {id:"t-energypolicy",label:"Energy Policy",type:"topic",r:13},
    {id:"t-regenfarm",label:"Regenerative Farming",type:"topic",r:14},
    {id:"t-permaculture",label:"Permaculture",type:"topic",r:14},
    {id:"t-foodsystems",label:"Food Systems",type:"topic",r:14},
    {id:"t-urbanfarm",label:"Urban Farming",type:"topic",r:13},
    {id:"t-fermentation",label:"Fermentation",type:"topic",r:12},
    {id:"t-foodsov",label:"Food Sovereignty",type:"topic",r:13},
    {id:"t-cuisine",label:"Cuisine & Culture",type:"topic",r:14},
    {id:"t-aquaculture",label:"Aquaculture",type:"topic",r:12},
    {id:"t-sports",label:"Sports & Athletics",type:"topic",r:15},
    {id:"t-gaming",label:"Games & Gaming",type:"topic",r:14},
    {id:"t-outdoor",label:"Outdoor Adventure",type:"topic",r:13},
    {id:"t-esports",label:"Esports",type:"topic",r:13},
    {id:"t-leisure",label:"Leisure & Rest",type:"topic",r:13},
    {id:"t-humor",label:"Humor & Comedy",type:"topic",r:13},
    {id:"t-festivals",label:"Festivals & Events",type:"topic",r:14},
    {id:"t-playcreat",label:"Play & Creativity",type:"topic",r:13}
  ];

  const HOME_RAW_LINKS = [
    ["frqncy","network-state"],["frqncy","fund"],["frqncy","education"],["frqncy","research"],["frqncy","media"],["frqncy","builder"],["frqncy","curate"],["frqncy","sell"],
    ["sell","d-money"],["sell","d-business"],["sell","d-tech"],["sell","d-creation"],["sell","d-society"],
    ["curate","d-arts"],["curate","d-communication"],["curate","d-lifestyle"],["curate","d-meta"],
    ["frqncy","d-sciences"],["frqncy","d-tech"],["frqncy","d-arts"],["frqncy","d-nature"],["frqncy","d-business"],["frqncy","d-money"],
    ["frqncy","d-meta"],["frqncy","d-lifestyle"],["frqncy","d-creation"],["frqncy","d-wellbeing"],["frqncy","d-society"],
    ["network-state","d-tech"],["network-state","d-society"],["network-state","d-business"],["network-state","d-money"],["network-state","d-creation"],
    ["fund","d-business"],["fund","d-money"],["fund","d-tech"],["fund","d-creation"],["fund","d-society"],
    ["education","d-sciences"],["education","d-arts"],["education","d-creation"],["education","d-society"],
    ["research","d-sciences"],["research","d-meta"],["research","d-nature"],["research","d-tech"],
    ["media","d-arts"],["media","d-communication"],["media","d-society"],["media","d-tech"],
    ["builder","d-creation"],["builder","d-tech"],["builder","d-business"],["builder","d-money"],["builder","d-society"],
    ["d-sciences","t-quantum"],["d-sciences","t-neuro"],["d-sciences","t-bio"],["d-sciences","t-psych"],
    ["d-sciences","t-med"],["d-sciences","t-math"],["d-sciences","t-astrophys"],["d-sciences","t-ecology"],
    ["d-sciences","t-genetics"],["d-sciences","t-chemistry"],
    ["d-tech","t-ai"],["d-tech","t-blockchain"],["d-tech","t-decentral"],["d-tech","t-arvr"],
    ["d-tech","t-biotech"],["d-tech","t-robotics"],["d-tech","t-web3"],["d-tech","t-quantcomp"],["d-tech","t-cybersec"],["d-tech","t-privacy"],
    ["d-arts","t-music"],["d-arts","t-visual"],["d-arts","t-film"],["d-arts","t-poetry"],["d-arts","t-dance"],
    ["d-arts","t-archit"],["d-arts","t-fashion"],["d-arts","t-story"],["d-arts","t-photo"],["d-arts","t-theater"],
    ["d-nature","t-sacredgeo"],["d-nature","t-astrology"],["d-nature","t-climate"],["d-nature","t-biodivers"],
    ["d-nature","t-oceans"],["d-nature","t-forests"],["d-nature","t-cosmos"],["d-nature","t-efields"],["d-nature","t-cycles"],
    ["d-business","t-socialent"],["d-business","t-circular"],["d-business","t-regenbiz"],
    ["d-money","t-defi"],["d-money","t-impact"],["d-money","t-conscap"],["d-money","t-dao"],["d-money","t-crypto"],["d-money","t-wealth-mind"],
    ["d-money","t-cards"],["d-money","t-personal-finance"],["d-money","t-stocks"],["d-money","t-bonds"],["d-money","t-etfs"],
    ["d-money","t-commodities"],
    ["d-money","t-gold"],["d-money","t-silver"],["d-money","t-platinum"],["d-money","t-palladium"],["d-money","t-uranium"],["d-money","t-copper"],
    ["d-money","t-oil"],["d-money","t-lithium"],["d-money","t-rare-earths"],["d-money","t-carbon-credits"],["d-money","t-water"],
    ["d-money","t-natgas"],["d-money","t-nickel"],["d-money","t-cobalt"],["d-money","t-wheat"],["d-money","t-diamonds"],
    ["d-money","t-iron"],["d-money","t-aluminum"],["d-money","t-zinc"],["d-money","t-lead"],["d-money","t-tin"],
    ["d-money","t-sugar"],["d-money","t-cotton"],["d-money","t-hydrogen"],
    ["t-commodities","t-gold"],["t-commodities","t-silver"],["t-commodities","t-platinum"],["t-commodities","t-palladium"],["t-commodities","t-uranium"],["t-commodities","t-copper"],
    ["t-commodities","t-oil"],["t-commodities","t-lithium"],["t-commodities","t-rare-earths"],["t-commodities","t-carbon-credits"],["t-commodities","t-water"],
    ["t-commodities","t-natgas"],["t-commodities","t-nickel"],["t-commodities","t-cobalt"],["t-commodities","t-wheat"],["t-commodities","t-diamonds"],
    ["t-commodities","t-iron"],["t-commodities","t-aluminum"],["t-commodities","t-zinc"],["t-commodities","t-lead"],["t-commodities","t-tin"],
    ["t-commodities","t-sugar"],["t-commodities","t-cotton"],["t-commodities","t-hydrogen"],
    ["t-gold","t-silver"],["t-gold","t-wealth-mind"],["t-gold","t-crypto"],
    ["t-silver","t-platinum"],["t-platinum","t-palladium"],
    ["t-uranium","d-energy"],["t-copper","t-renewable"],["t-copper","t-gridtech"],
    ["t-oil","d-energy"],["t-natgas","d-energy"],["t-natgas","t-oil"],
    ["t-lithium","d-energy"],["t-lithium","t-renewable"],["t-lithium","t-nickel"],["t-lithium","t-cobalt"],
    ["t-rare-earths","d-tech"],["t-hydrogen","d-energy"],["t-hydrogen","t-renewable"],
    ["t-carbon-credits","t-climate"],
    ["t-water","d-nature"],["t-water","d-lifestyle"],
    ["t-wheat","d-food"],["t-iron","t-aluminum"],
    ["t-stocks","t-bonds"],["t-stocks","t-etfs"],["t-bonds","t-etfs"],
    ["t-personal-finance","t-cards"],["t-personal-finance","t-stocks"],["t-personal-finance","t-wealth-mind"],
    ["t-stocks","t-impact"],["t-cards","t-defi"],
    ["d-money","t-bitcoin"],["d-money","t-sov"],["d-money","t-l1"],["d-money","t-l2"],["d-money","t-stablecoins"],
    ["d-money","t-rwa"],["d-money","t-depin"],["d-money","t-desci"],["d-money","t-gamefi"],["d-money","t-socialfi"],
    ["d-money","t-memes"],["d-money","t-modular"],["d-money","t-oracles"],["d-money","t-staking"],
    ["d-money","t-deai"],["d-money","t-icm"],["d-money","t-neobanks"],["d-money","t-nfts"],
    ["d-money","t-predictions"],["d-money","t-crypto-privacy"],
    ["t-crypto","t-bitcoin"],["t-crypto","t-sov"],["t-crypto","t-l1"],["t-crypto","t-l2"],["t-crypto","t-stablecoins"],
    ["t-crypto","t-rwa"],["t-crypto","t-depin"],["t-crypto","t-desci"],["t-crypto","t-gamefi"],["t-crypto","t-socialfi"],
    ["t-crypto","t-memes"],["t-crypto","t-modular"],["t-crypto","t-oracles"],["t-crypto","t-staking"],
    ["t-crypto","t-deai"],["t-crypto","t-icm"],["t-crypto","t-neobanks"],["t-crypto","t-nfts"],
    ["t-crypto","t-predictions"],["t-crypto","t-crypto-privacy"],
    ["t-crypto","t-defi"],["t-crypto","t-dao"],["t-crypto","t-web3"],
    ["t-bitcoin","t-sov"],["t-bitcoin","t-gold"],
    ["t-l2","t-l1"],["t-modular","t-l1"],["t-staking","t-l1"],
    ["t-stablecoins","t-defi"],["t-oracles","t-defi"],["t-rwa","t-stocks"],["t-rwa","t-bonds"],
    ["t-deai","t-ai"],["t-crypto-privacy","t-privacy"],["t-neobanks","t-cards"],
    ["d-meta","t-oneness"],["d-meta","t-source"],["d-meta","t-soul"],["d-meta","t-akashic"],
    ["d-meta","t-dims"],["d-meta","t-sync"],["d-meta","t-saclaw"],["d-meta","t-merkaba"],["d-meta","t-vibration"],
    ["d-lifestyle","t-nutrition"],["d-lifestyle","t-movement"],["d-lifestyle","t-sleep"],["d-lifestyle","t-plantmed"],
    ["d-lifestyle","t-community"],["d-lifestyle","t-minimalism"],["d-lifestyle","t-detox"],["d-lifestyle","t-sustliving"],
    ["d-creation","t-proddesign"],["d-creation","t-systems"],["d-creation","t-opensource"],["d-creation","t-cocreate"],
    ["d-creation","t-proto"],["d-creation","t-emergence"],["d-creation","t-biomimicry"],["d-creation","t-futuretech"],
    ["d-wellbeing","t-meditation"],["d-wellbeing","t-soundheal"],["d-wellbeing","t-breathwork"],["d-wellbeing","t-somatic"],
    ["d-wellbeing","t-energyheal"],["d-wellbeing","t-yoga"],["d-wellbeing","t-mentalhlth"],
    ["d-society","t-governance"],["d-society","t-indigenous"],["d-society","t-collective"],["d-society","t-socialmov"],
    ["d-society","t-peace"],["d-society","t-futurecity"],["d-society","t-edusystem"],["d-society","t-diaspora"],
    ["d-communication","t-language"],["d-communication","t-speaking"],["d-communication","t-dialogue"],
    ["d-communication","t-journalism"],["d-communication","t-socialmedia"],["d-communication","t-nvc"],
    ["d-communication","t-translation"],["d-communication","t-broadcasting"],
    ["d-energy","t-renewable"],["d-energy","t-solar"],["d-energy","t-wind"],["d-energy","t-geothermal"],
    ["d-energy","t-storage"],["d-energy","t-bioenergy"],["d-energy","t-gridtech"],["d-energy","t-energypolicy"],
    ["d-food","t-regenfarm"],["d-food","t-permaculture"],["d-food","t-foodsystems"],["d-food","t-urbanfarm"],
    ["d-food","t-fermentation"],["d-food","t-foodsov"],["d-food","t-cuisine"],["d-food","t-aquaculture"],
    ["d-play","t-sports"],["d-play","t-gaming"],["d-play","t-outdoor"],["d-play","t-esports"],
    ["d-play","t-leisure"],["d-play","t-humor"],["d-play","t-festivals"],["d-play","t-playcreat"],
    ["t-energypolicy","t-governance"],["t-gridtech","t-systems"],["t-storage","t-gridtech"],
    ["t-language","t-story"],["t-journalism","t-socialmov"],["t-nvc","t-peace"],
    ["t-socialmedia","t-collective"],["t-dialogue","t-peace"],["t-broadcasting","t-journalism"],
    ["t-sports","t-movement"],["t-festivals","t-community"],["t-gaming","t-ai"],
    ["t-esports","t-gaming"],["t-playcreat","t-cocreate"],["t-outdoor","t-ecology"],
    ["t-leisure","t-mentalhlth"],["t-humor","t-story"],
    ["t-quantum","t-oneness"],["t-quantum","t-vibration"],
    ["t-neuro","t-meditation"],["t-neuro","t-psych"],
    ["t-psych","t-mentalhlth"],["t-psych","t-somatic"],
    ["t-bio","t-ecology"],["t-genetics","t-biotech"],["t-med","t-mentalhlth"],
    ["t-ai","t-systems"],["t-ai","t-collective"],["t-ai","t-futuretech"],
    ["t-blockchain","t-defi"],["t-blockchain","t-dao"],
    ["t-web3","t-decentral"],["t-web3","t-dao"],
    ["fund","t-blockchain"],["fund","t-defi"],["fund","t-web3"],["fund","t-dao"],["fund","t-conscap"],
    ["t-music","t-soundheal"],["t-music","t-vibration"],
    ["t-sacredgeo","t-merkaba"],["t-sacredgeo","t-dims"],["t-sacredgeo","t-math"],
    ["t-astrology","t-cycles"],["t-cosmos","t-astrophys"],
    ["t-indigenous","t-saclaw"],["t-indigenous","t-ecology"],["t-indigenous","t-story"]
  ];

  const HOME_URL = {
    "network-state":"network-state/index.html","fund":"fund/index.html","education":"education/index.html","research":"research/index.html","media":"broadcast/index.html","builder":"builder/index.html","curate":"curate/index.html","sell":"sell/index.html",
    "d-sciences":"sciences/index.html","d-tech":"technology/index.html","d-arts":"arts/index.html","d-nature":"nature/index.html","d-business":"business/index.html","d-money":"money/index.html","d-meta":"consciousness/index.html","d-lifestyle":"lifestyle/index.html","d-creation":"creation/index.html","d-wellbeing":"wellbeing/index.html","d-society":"society/index.html","d-communication":"communication/index.html","d-energy":"energy/index.html","d-food":"food/index.html","d-play":"play/index.html",
    "t-quantum":"quantum/index.html","t-neuro":"neuroscience/index.html","t-bio":"biology/index.html","t-psych":"psychology/index.html","t-med":"medicine/index.html","t-math":"mathematics/index.html","t-astrophys":"astrophysics/index.html","t-ecology":"ecology/index.html","t-genetics":"genetics/index.html","t-chemistry":"chemistry/index.html",
    "t-ai":"artificial-intelligence/index.html","t-blockchain":"blockchain/index.html","t-decentral":"decentralized-networks/index.html","t-arvr":"ar-vr/index.html","t-biotech":"biotechnology/index.html","t-robotics":"robotics/index.html","t-web3":"web3/index.html","t-quantcomp":"quantum-computing/index.html","t-cybersec":"cybersecurity/index.html",
    "t-music":"music-topic/index.html","t-visual":"visual-art/index.html","t-film":"film/index.html","t-poetry":"poetry/index.html","t-dance":"dance/index.html","t-archit":"architecture/index.html","t-fashion":"fashion/index.html","t-story":"storytelling/index.html","t-photo":"photography/index.html","t-theater":"theater/index.html",
    "t-sacredgeo":"sacred-geometry/index.html","t-astrology":"astrology/index.html","t-climate":"climate/index.html","t-biodivers":"biodiversity/index.html","t-oceans":"oceans/index.html","t-forests":"forests/index.html","t-cosmos":"cosmos/index.html","t-efields":"energy-fields/index.html","t-cycles":"natural-cycles/index.html",
    "t-defi":"crypto/defi/index.html","t-impact":"impact-investing/index.html","t-socialent":"social-enterprise/index.html","t-circular":"circular-economy/index.html","t-conscap":"conscious-capital/index.html","t-regenbiz":"regenerative-business/index.html","t-dao":"dao/index.html","t-crypto":"crypto/index.html","t-wealth-mind":"prosperity-mindset/index.html","t-cards":"cards/index.html","t-personal-finance":"personal-finance/index.html","t-stocks":"stocks/index.html","t-bonds":"bonds/index.html","t-etfs":"etfs/index.html","t-commodities":"commodities/index.html","t-gold":"gold/index.html","t-silver":"silver/index.html","t-platinum":"platinum/index.html","t-palladium":"palladium/index.html","t-uranium":"uranium/index.html","t-copper":"copper/index.html","t-oil":"oil/index.html","t-lithium":"lithium/index.html","t-rare-earths":"rare-earths/index.html","t-carbon-credits":"carbon-credits/index.html","t-water":"water/index.html","t-natgas":"natural-gas/index.html","t-nickel":"nickel/index.html","t-cobalt":"cobalt/index.html","t-wheat":"wheat/index.html","t-diamonds":"diamonds/index.html","t-iron":"iron-ore/index.html","t-aluminum":"aluminum/index.html","t-zinc":"zinc/index.html","t-lead":"lead/index.html","t-tin":"tin/index.html","t-sugar":"sugar/index.html","t-cotton":"cotton/index.html","t-hydrogen":"hydrogen/index.html","t-bitcoin":"crypto/bitcoin/index.html","t-sov":"crypto/sov/index.html","t-l1":"crypto/l1/index.html","t-l2":"crypto/l2/index.html","t-stablecoins":"crypto/stablecoins/index.html","t-rwa":"crypto/rwa/index.html","t-depin":"crypto/depin/index.html","t-desci":"crypto/desci/index.html","t-gamefi":"crypto/gamefi/index.html","t-socialfi":"crypto/socialfi/index.html","t-memes":"crypto/memes/index.html","t-modular":"crypto/modular/index.html","t-oracles":"crypto/oracles/index.html","t-staking":"crypto/staking/index.html","t-deai":"crypto/ai/index.html","t-icm":"crypto/icm/index.html","t-neobanks":"crypto/neobanks/index.html","t-nfts":"crypto/nfts/index.html","t-predictions":"crypto/predictions/index.html","t-crypto-privacy":"crypto/privacy/index.html","t-privacy":"privacy/index.html",
    "t-oneness":"oneness/index.html","t-source":"source/index.html","t-soul":"soul/index.html","t-akashic":"akashic-records/index.html","t-dims":"dimensions/index.html","t-sync":"synchronicity/index.html","t-saclaw":"sacred-law/index.html","t-merkaba":"merkaba/index.html","t-vibration":"vibration/index.html",
    "t-nutrition":"nutrition/index.html","t-movement":"movement/index.html","t-sleep":"sleep/index.html","t-plantmed":"plant-medicine/index.html","t-community":"community/index.html","t-minimalism":"minimalism/index.html","t-detox":"detox/index.html","t-sustliving":"sustainable-living/index.html",
    "t-proddesign":"product-design/index.html","t-systems":"systems-thinking/index.html","t-opensource":"open-source/index.html","t-cocreate":"co-creation/index.html","t-proto":"prototyping/index.html","t-emergence":"emergence/index.html","t-biomimicry":"biomimicry/index.html","t-futuretech":"future-tech/index.html",
    "t-meditation":"meditation/index.html","t-soundheal":"sound-healing/index.html","t-breathwork":"breathwork/index.html","t-somatic":"somatic-therapy/index.html","t-energyheal":"energy-healing/index.html","t-yoga":"yoga/index.html","t-mentalhlth":"mental-health/index.html",
    "t-governance":"governance/index.html","t-indigenous":"indigenous-wisdom/index.html","t-collective":"collective-intelligence/index.html","t-socialmov":"social-movements/index.html","t-peace":"peace/index.html","t-futurecity":"future-cities/index.html","t-edusystem":"education-systems/index.html","t-diaspora":"diaspora/index.html",
    "t-language":"language/index.html","t-speaking":"public-speaking/index.html","t-dialogue":"dialogue/index.html","t-journalism":"journalism/index.html","t-socialmedia":"social-media/index.html","t-nvc":"nonviolent-communication/index.html","t-translation":"translation/index.html","t-broadcasting":"broadcasting/index.html",
    "t-renewable":"renewable-energy/index.html","t-solar":"solar/index.html","t-wind":"wind-energy/index.html","t-geothermal":"geothermal/index.html","t-storage":"energy-storage/index.html","t-bioenergy":"bioenergy/index.html","t-gridtech":"grid-technology/index.html","t-energypolicy":"energy-policy/index.html",
    "t-regenfarm":"regenerative-farming/index.html","t-permaculture":"permaculture/index.html","t-foodsystems":"food-systems/index.html","t-urbanfarm":"urban-farming/index.html","t-fermentation":"fermentation/index.html","t-foodsov":"food-sovereignty/index.html","t-cuisine":"cuisine/index.html","t-aquaculture":"aquaculture/index.html",
    "t-sports":"sports/index.html","t-gaming":"gaming/index.html","t-outdoor":"outdoor-adventure/index.html","t-esports":"esports/index.html","t-leisure":"leisure/index.html","t-humor":"humor/index.html","t-festivals":"festivals/index.html","t-playcreat":"play-creativity/index.html"
  };

  // ===== FILTER HELPER (domain + its topics, no humans, no other domains) =====
  function filterByDomain(domainId, opts) {
    opts = opts || {};
    const urlPrefix = opts.urlPrefix || ''; // domain pages live under /<slug>/, so they need '../../' to reach <other>/
    const isTopic = id => typeof id === 'string' && id.indexOf('t-') === 0;
    const childTopicIds = new Set();
    HOME_RAW_LINKS.forEach(pair => {
      if (pair[0] === domainId && isTopic(pair[1])) childTopicIds.add(pair[1]);
      if (pair[1] === domainId && isTopic(pair[0])) childTopicIds.add(pair[0]);
    });
    const keepIds = new Set([domainId, ...childTopicIds]);
    const nodes = HOME_NODES
      .filter(n => keepIds.has(n.id))
      .map(n => {
        const c = Object.assign({}, n);
        // Bump the focal domain's radius so it reads as the centerpiece
        if (c.id === domainId) c.r = 38;
        // Bump topic radii a touch in solo view (they're the only thing besides the centerpiece)
        else if (c.type === 'topic') c.r = Math.max(c.r, 16);
        return c;
      });
    const links = HOME_RAW_LINKS.filter(pair =>
      keepIds.has(pair[0]) && keepIds.has(pair[1])
    );
    const urls = {};
    Object.keys(HOME_URL).forEach(id => {
      if (keepIds.has(id)) urls[id] = urlPrefix + HOME_URL[id];
    });
    return { nodes, links, urls };
  }

  // ===== FILTER HELPER (pillar + linked domains + their topics, 2-hop) =====
  // Walks pillar → domains → topics. Pillar pages embed this so the constellation
  // shows the full graph reach of the pillar's work — every domain it serves,
  // and every topic those domains contain.
  function filterByPillar(pillarId, opts) {
    opts = opts || {};
    const urlPrefix = opts.urlPrefix || '';
    const isDomain = id => typeof id === 'string' && id.indexOf('d-') === 0;
    const isTopic  = id => typeof id === 'string' && id.indexOf('t-') === 0;

    // Hop 1: domains directly linked to the pillar
    const linkedDomains = new Set();
    HOME_RAW_LINKS.forEach(pair => {
      if (pair[0] === pillarId && isDomain(pair[1])) linkedDomains.add(pair[1]);
      if (pair[1] === pillarId && isDomain(pair[0])) linkedDomains.add(pair[0]);
    });

    // Hop 2: topics belonging to those domains
    const linkedTopics = new Set();
    HOME_RAW_LINKS.forEach(pair => {
      if (linkedDomains.has(pair[0]) && isTopic(pair[1])) linkedTopics.add(pair[1]);
      if (linkedDomains.has(pair[1]) && isTopic(pair[0])) linkedTopics.add(pair[0]);
    });

    const keepIds = new Set([pillarId, ...linkedDomains, ...linkedTopics]);
    const nodes = HOME_NODES
      .filter(n => keepIds.has(n.id))
      .map(n => {
        const c = Object.assign({}, n);
        if (c.id === pillarId) c.r = 42;       // centerpiece
        else if (c.type === 'cluster') c.r = Math.max(c.r, 22); // domains a touch bigger
        return c;
      });
    const links = HOME_RAW_LINKS.filter(pair =>
      keepIds.has(pair[0]) && keepIds.has(pair[1])
    );
    const urls = {};
    Object.keys(HOME_URL).forEach(id => {
      if (keepIds.has(id)) urls[id] = urlPrefix + HOME_URL[id];
    });
    return { nodes, links, urls };
  }

  // ===== D3 LOADER =====
  let _d3LoadStarted = false;
  let _d3LoadCallbacks = [];
  function _ensureD3(cb, fail) {
    if (typeof window.d3 !== 'undefined') return cb();
    _d3LoadCallbacks.push(cb);
    if (_d3LoadStarted) return;
    _d3LoadStarted = true;
    function flush() { const list = _d3LoadCallbacks.slice(); _d3LoadCallbacks = []; list.forEach(fn => { try { fn(); } catch(_) {} }); }
    function load(src, onErr) {
      const s = document.createElement('script');
      s.src = src;
      s.onload = flush; s.onerror = onErr;
      document.head.appendChild(s);
    }
    load('https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js', () => {
      load('https://cdn.jsdelivr.net/npm/d3@7.8.5/dist/d3.min.js', () => {
        if (typeof fail === 'function') fail();
      });
    });
  }

  // ===== RENDERER =====
  function init(opts) {
    opts = opts || {};
    const containerId = opts.containerId || 'nm-container';
    const canvasId    = opts.canvasId    || 'nm-fx';
    const svgId       = opts.svgId       || 'nm-svg';
    const defsId      = opts.defsId      || 'nm-svg-defs';
    const tooltipId   = opts.tooltipId   || 'nm-tooltip';
    const hintId      = opts.hintId      || 'nm-hint';
    const loadingId   = opts.loadingId   || 'nm-loading';

    _ensureD3(() => _render({
      containerId, canvasId, svgId, defsId, tooltipId, hintId, loadingId,
      nodes: opts.nodes || HOME_NODES,
      links: opts.links || HOME_RAW_LINKS,
      urls:  opts.urls  || HOME_URL,
      humans: typeof opts.humans === 'number' ? opts.humans : 1000,
      showCoreLinks: opts.showCoreLinks !== false
    }), () => {
      const c = document.getElementById(containerId);
      if (c) c.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:rgba(196,151,58,0.6);font-family:Jost,sans-serif;font-size:12px;letter-spacing:.18em;text-transform:uppercase;">Network map requires an internet connection</div>';
    });
  }

  function _render(cfg) {
    const d3 = window.d3;

    const _load = document.getElementById(cfg.loadingId);
    if (_load) _load.remove();

    const NM_NODES = cfg.nodes;
    const NM_LINKS = cfg.links.map(p => ({ source: p[0], target: p[1] }));
    const NM_URL   = cfg.urls;

    const nmContainer = document.getElementById(cfg.containerId);
    const nmCanvas    = document.getElementById(cfg.canvasId);
    if (!nmContainer || !nmCanvas) return;
    const nmCtx = nmCanvas.getContext('2d');

    // Touch hint
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      const nmHint = document.getElementById(cfg.hintId);
      if (nmHint) nmHint.textContent = 'TAP TO EXPLORE · PINCH TO ZOOM · DRAG TO PAN';
    }

    function nmResize(){
      nmCanvas.width  = nmContainer.offsetWidth;
      nmCanvas.height = nmContainer.offsetHeight;
      try { if (nmSim) nmSim.force('center', d3.forceCenter(NM_W()/2, NM_H()/2).strength(0.04)).alpha(0.25).restart(); }
      catch(_) {}
    }
    nmResize();
    window.addEventListener('resize', nmResize, { passive: true });

    const NM_W = () => nmContainer.offsetWidth;
    const NM_H = () => nmContainer.offsetHeight;

    // Background stars
    const NM_STARS = [];
    for (let i = 0; i < 120; i++) NM_STARS.push({
      x: Math.random()*2000, y: Math.random()*800,
      r: Math.random()*1.3+0.2, base: Math.random()*0.45+0.08, phase: Math.random()*Math.PI*2
    });

    // SVG setup
    const nmSvg  = d3.select('#' + cfg.svgId);
    const nmDefs = d3.select('#' + cfg.defsId);
    [
      {id: cfg.defsId+'-core',       c1:'#F4DC88', c2:'#A06818'},
      {id: cfg.defsId+'-main',       c1:'#5A8AFF', c2:'#122878'},
      {id: cfg.defsId+'-cluster',    c1:'#3062C8', c2:'#081640'},
      {id: cfg.defsId+'-subcluster', c1:'#2952B3', c2:'#0A1A4A'},
      {id: cfg.defsId+'-topic',      c1:'#213E88', c2:'#060E24'}
    ].forEach(g => {
      const gr = nmDefs.append('radialGradient').attr('id', g.id).attr('cx','38%').attr('cy','30%');
      gr.append('stop').attr('offset','0%').attr('stop-color', g.c1);
      gr.append('stop').attr('offset','100%').attr('stop-color', g.c2);
    });

    let nmZoom = { x:0, y:0, k:1 };
    const nmZoomG = nmSvg.append('g');
    nmSvg.call(d3.zoom().scaleExtent([0.1, 4]).on('zoom', e => {
      nmZoomG.attr('transform', e.transform);
      nmZoom = e.transform;
    }));

    let nmSim = d3.forceSimulation(NM_NODES)
      .force('link', d3.forceLink(NM_LINKS).id(d => d.id)
        .distance(d => {
          const s = d.source.type || 'topic', t = d.target.type || 'topic';
          if (s === 'core' || t === 'core') return (t === 'main' || s === 'main') ? 230 : 285;
          if (s === 'main' || t === 'main') return 200;
          if (s === 'cluster' || t === 'cluster') return (t === 'subcluster' || s === 'subcluster') ? 115 : (t === 'topic' || s === 'topic') ? 165 : 168;
          if (s === 'subcluster' || t === 'subcluster') return (t === 'topic' || s === 'topic') ? 100 : 130;
          return 110;
        })
        .strength(d => {
          const s = d.source.type || 'topic', t = d.target.type || 'topic';
          if (s === 'core' || t === 'core') return 0.55;
          if (s === 'subcluster' || t === 'subcluster') return 0.45;
          return 0.38;
        })
      )
      .force('charge', d3.forceManyBody().strength(d => {
        switch (d.type) {
          case 'core': return -1850;
          case 'main': return -880;
          case 'cluster': return -520;
          case 'subcluster': return -340;
          default: return -185;
        }
      }).theta(0.9))
      .force('center', d3.forceCenter(NM_W()/2, NM_H()/2).strength(0.04))
      .force('collide', d3.forceCollide(d => d.r + 22).strength(0.75).iterations(2))
      .alphaDecay(0.03).velocityDecay(0.45);

    const nmNodeById = {};
    NM_NODES.forEach(n => { nmNodeById[n.id] = n; });

    // Human stars (skip when humans === 0)
    const nmTopicPool = NM_NODES.filter(n => n.type === 'topic' || n.type === 'cluster' || n.type === 'subcluster');
    function srand(seed){ let x = seed; return () => { x = ((x ^ (x<<13)) ^ (x>>7) ^ (x<<17)) >>> 0; return (x % 100000) / 100000; }; }
    const NM_HUMANS = [];
    if (cfg.humans > 0 && nmTopicPool.length > 0) {
      for (let i = 0; i < cfg.humans; i++) {
        const rnd = srand(i*31337 + i*i + 1);
        const anchor = nmTopicPool[Math.floor(rnd() * nmTopicPool.length)];
        const dist = anchor.r + 8 + rnd()*55;
        const angle = rnd() * Math.PI * 2;
        NM_HUMANS.push({
          anchorId: anchor.id,
          ox: Math.cos(angle)*dist, oy: Math.sin(angle)*dist,
          r: 0.7 + rnd()*0.8, baseAlpha: 0.55 + rnd()*0.40,
          phase: rnd()*Math.PI*2, speed: 1.4 + rnd()*1.2,
          lineAlpha: 0.04 + rnd()*0.06, showLine: rnd() < 0.45
        });
      }
    }

    // SVG nodes
    const nmNodeG   = nmZoomG.append('g');
    const nmNodeSel = nmNodeG.selectAll('g.node').data(NM_NODES).join('g').attr('class','node').style('cursor','pointer');
    nmNodeSel.append('circle')
      .attr('r', d => d.r)
      .attr('fill', d => {
        if (d.type === 'cluster')    return 'url(#' + cfg.defsId + '-cluster)';
        if (d.type === 'subcluster') return 'url(#' + cfg.defsId + '-subcluster)';
        if (d.type === 'topic')      return 'url(#' + cfg.defsId + '-topic)';
        return 'url(#' + cfg.defsId + '-' + d.type + ')';
      })
      .attr('stroke', d => d.type === 'core' ? '#E0C06A' : d.type === 'main' ? '#4A7AE8' : d.type === 'cluster' ? '#2952B3' : d.type === 'subcluster' ? '#234FA8' : '#1A3A8F')
      .attr('stroke-width', d => d.type === 'core' ? 2.5 : d.type === 'subcluster' ? 1.5 : 1);
    nmNodeSel.filter(d => d.type !== 'dot').append('text')
      .attr('text-anchor','middle').attr('dominant-baseline','central')
      .attr('fill', d => d.type === 'core' ? '#0A1220' : d.type === 'main' ? '#FFFFFF' : (d.type === 'cluster' || d.type === 'subcluster') ? '#E8C97D' : 'rgba(172,202,255,0.88)')
      .attr('font-family', d => (d.type === 'core' || d.type === 'main') ? 'Cormorant,Georgia,serif' : "'Jost',sans-serif")
      .attr('font-size', d => d.type === 'core' ? '17px' : d.type === 'main' ? '13px' : d.type === 'cluster' ? '12px' : d.type === 'subcluster' ? '11.5px' : '11px')
      .attr('font-weight', d => d.type === 'core' ? '500' : d.type === 'subcluster' ? '400' : '300')
      .attr('letter-spacing', d => d.type === 'core' ? '0.18em' : d.type === 'subcluster' ? '0.08em' : '0.04em')
      .attr('pointer-events', 'none')
      .each(function(d){
        const el = d3.select(this);
        if (d.type === 'topic' && d.label.length > 14) {
          const w = d.label.split(' '), m = Math.ceil(w.length / 2);
          el.append('tspan').attr('x', 0).attr('dy', '-0.5em').text(w.slice(0, m).join(' '));
          el.append('tspan').attr('x', 0).attr('dy', '1em').text(w.slice(m).join(' '));
        } else { el.text(d.label); }
      });

    let nmWasDragged = false;
    nmNodeSel.call(d3.drag()
      .on('start', (e,d) => { nmWasDragged = false; if (!e.active) nmSim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
      .on('drag',  (e,d) => { nmWasDragged = true;  d.fx = e.x; d.fy = e.y; })
      .on('end',   (e,d) => { if (!e.active) nmSim.alphaTarget(0); d.fx = null; d.fy = null; })
    );
    nmSim.on('tick', () => { nmNodeSel.attr('transform', d => 'translate('+d.x+','+d.y+')'); });

    // Hover / tooltip
    const nmTip = document.getElementById(cfg.tooltipId);
    let nmHovered = null;
    nmNodeSel
      .on('mouseover', (e,d) => {
        const conn = new Set([d.id]);
        NM_LINKS.forEach(l => {
          const s = typeof l.source === 'object' ? l.source.id : l.source;
          const t = typeof l.target === 'object' ? l.target.id : l.target;
          if (s === d.id) conn.add(t); if (t === d.id) conn.add(s);
        });
        nmHovered = conn;
        nmNodeSel.style('opacity', n => conn.has(n.id) ? 1 : 0.05);
        if (nmTip) {
          nmTip.querySelector('.nm-tip-title').textContent = d.label;
          const clickHint = NM_URL[d.id] ? ' · click to explore' : '';
          nmTip.querySelector('.nm-tip-type').textContent = (d.desc || '') + ' · ' + ({core:'FRQNCY CORE', main:'PILLAR', cluster:'DOMAIN', subcluster:'CATEGORY', topic:'TOPIC'}[d.type] || '') + clickHint;
          nmTip.style.opacity = 1;
        }
      })
      .on('mousemove', e => {
        if (!nmTip) return;
        const rect = nmContainer.getBoundingClientRect();
        nmTip.style.left = (e.clientX - rect.left + 14) + 'px';
        nmTip.style.top  = (e.clientY - rect.top  - 14) + 'px';
      })
      .on('mouseout', () => { if (nmTip) nmTip.style.opacity = 0; nmHovered = null; nmNodeSel.style('opacity', 1); })
      .on('click', (event, d) => {
        if (nmWasDragged) { nmWasDragged = false; return; }
        if (event.defaultPrevented) return;
        event.stopPropagation();
        const url = NM_URL[d.id];
        if (url) window.location.assign(url);
      })
      .style('cursor', d => NM_URL[d.id] ? 'pointer' : 'default');

    // Visibility pause (self-contained)
    let pageVisible = !document.hidden;
    document.addEventListener('visibilitychange', () => { pageVisible = !document.hidden; });

    // Render loop
    const nmParticles = [];
    let nmLastMajor = 0, nmLastDot = 0;
    const nmMajorLinks = NM_LINKS.filter(l => { const s = typeof l.source === 'object' ? l.source.type : null; return s === 'core' || s === 'main' || s === 'cluster' || s === 'subcluster'; });

    function nmSpawn(fromDot){
      if (nmParticles.length > 200) return;
      if (fromDot) {
        if (NM_HUMANS.length === 0) return;
        const h = NM_HUMANS[Math.floor(Math.random() * NM_HUMANS.length)];
        const a = nmNodeById[h.anchorId]; if (!a || a.x === undefined) return;
        const hx = a.x + h.ox, hy = a.y + h.oy, fwd = Math.random() > 0.4;
        nmParticles.push({ x1: fwd ? hx : a.x, y1: fwd ? hy : a.y, x2: fwd ? a.x : hx, y2: fwd ? a.y : hy, prog: 0, speed: 0.013 + Math.random()*0.01, isDot: true });
      } else {
        if (nmMajorLinks.length === 0) return;
        const l = nmMajorLinks[Math.floor(Math.random() * nmMajorLinks.length)];
        const s = l.source, t = l.target; if (!s || !t || s.x === undefined) return;
        nmParticles.push({ x1: s.x, y1: s.y, x2: t.x, y2: t.y, prog: 0, speed: 0.009 + Math.random()*0.006, isDot: false });
      }
    }

    function nmRender(ts){
      requestAnimationFrame(nmRender);
      if (!pageVisible) return;
      const CW = nmCanvas.width, CH = nmCanvas.height;
      nmCtx.clearRect(0, 0, CW, CH);

      const t = ts * 0.0007;
      for (let i = 0; i < NM_STARS.length; i++) {
        const s = NM_STARS[i];
        const a = s.base * (0.65 + 0.35 * Math.sin(t + s.phase));
        nmCtx.fillStyle = 'rgba(255,255,255,' + a.toFixed(2) + ')';
        nmCtx.beginPath(); nmCtx.arc(s.x % CW, s.y % CH, s.r, 0, Math.PI*2); nmCtx.fill();
      }

      if (ts - nmLastMajor > 320) { nmSpawn(false); nmLastMajor = ts; }
      if (ts - nmLastDot   > 90)  { nmSpawn(true);  nmLastDot   = ts; }

      const { x: zx, y: zy, k: zk } = nmZoom;
      nmCtx.save();
      nmCtx.translate(zx, zy); nmCtx.scale(zk, zk);

      if (cfg.showCoreLinks) {
        nmCtx.setLineDash([]);
        nmCtx.strokeStyle = 'rgba(196,151,58,0.42)'; nmCtx.lineWidth = 1.8;
        nmCtx.beginPath();
        NM_LINKS.forEach(l => { const s = l.source, t_ = l.target; if (!s || !t_ || s.x === undefined) return; if (s.type !== 'core' && t_.type !== 'core') return; if (nmHovered && !nmHovered.has(s.id) && !nmHovered.has(t_.id)) return; nmCtx.moveTo(s.x, s.y); nmCtx.lineTo(t_.x, t_.y); });
        nmCtx.stroke();

        nmCtx.strokeStyle = 'rgba(74,122,232,0.25)'; nmCtx.lineWidth = 1.1;
        nmCtx.beginPath();
        NM_LINKS.forEach(l => { const s = l.source, t_ = l.target; if (!s || !t_ || s.x === undefined) return; if ((s.type !== 'main' && t_.type !== 'main') || (s.type === 'core' || t_.type === 'core')) return; if (nmHovered && !nmHovered.has(s.id) && !nmHovered.has(t_.id)) return; nmCtx.moveTo(s.x, s.y); nmCtx.lineTo(t_.x, t_.y); });
        nmCtx.stroke();
      }

      // Cluster ↔ topic links (always rendered — this is the "domain to its topics" layer)
      nmCtx.strokeStyle = cfg.showCoreLinks ? 'rgba(41,82,179,0.13)' : 'rgba(74,122,232,0.32)';
      nmCtx.lineWidth = cfg.showCoreLinks ? 0.55 : 1.1;
      nmCtx.beginPath();
      NM_LINKS.forEach(l => { const s = l.source, t_ = l.target; if (!s || !t_ || s.x === undefined) return; if (cfg.showCoreLinks && (s.type === 'core' || t_.type === 'core' || s.type === 'main' || t_.type === 'main')) return; if (nmHovered && !nmHovered.has(s.id) && !nmHovered.has(t_.id)) return; nmCtx.moveTo(s.x, s.y); nmCtx.lineTo(t_.x, t_.y); });
      nmCtx.stroke();

      NM_NODES.forEach(n => {
        if (n.x == null) return;
        if (n.type === 'core')      { const g = nmCtx.createRadialGradient(n.x, n.y, n.r*0.6, n.x, n.y, n.r*2.4); g.addColorStop(0,'rgba(196,151,58,0.2)');  g.addColorStop(1,'rgba(196,151,58,0)');  nmCtx.fillStyle = g; nmCtx.beginPath(); nmCtx.arc(n.x, n.y, n.r*2.4, 0, Math.PI*2); nmCtx.fill(); }
        else if (n.type === 'main') { const g = nmCtx.createRadialGradient(n.x, n.y, n.r*0.5, n.x, n.y, n.r*1.9); g.addColorStop(0,'rgba(74,122,232,0.16)'); g.addColorStop(1,'rgba(74,122,232,0)'); nmCtx.fillStyle = g; nmCtx.beginPath(); nmCtx.arc(n.x, n.y, n.r*1.9, 0, Math.PI*2); nmCtx.fill(); }
        else if (n.type === 'cluster' && !cfg.showCoreLinks) {
          // In solo-domain view, give the centerpiece a soft glow too
          const g = nmCtx.createRadialGradient(n.x, n.y, n.r*0.5, n.x, n.y, n.r*2.0); g.addColorStop(0,'rgba(48,98,200,0.18)'); g.addColorStop(1,'rgba(48,98,200,0)'); nmCtx.fillStyle = g; nmCtx.beginPath(); nmCtx.arc(n.x, n.y, n.r*2.0, 0, Math.PI*2); nmCtx.fill();
        }
        else if (n.type === 'subcluster') {
          // Mid-level glow — softer than cluster, brighter than topic — so categories read as intermediate
          const g = nmCtx.createRadialGradient(n.x, n.y, n.r*0.5, n.x, n.y, n.r*1.7); g.addColorStop(0,'rgba(70,116,210,0.13)'); g.addColorStop(1,'rgba(70,116,210,0)'); nmCtx.fillStyle = g; nmCtx.beginPath(); nmCtx.arc(n.x, n.y, n.r*1.7, 0, Math.PI*2); nmCtx.fill();
        }
      });

      // Human stars (skipped when 0)
      if (NM_HUMANS.length > 0) {
        const lineGroups = [{a:0.10, lines:[]}, {a:0.07, lines:[]}, {a:0.04, lines:[]}];
        for (let i = 0; i < NM_HUMANS.length; i++) {
          const h = NM_HUMANS[i]; if (!h.showLine) continue;
          const a = nmNodeById[h.anchorId]; if (!a || a.x === undefined) continue;
          if (nmHovered && !nmHovered.has(h.anchorId)) continue;
          const hx = a.x + h.ox, hy = a.y + h.oy;
          const g = h.lineAlpha > 0.08 ? lineGroups[0] : h.lineAlpha > 0.055 ? lineGroups[1] : lineGroups[2];
          g.lines.push(hx, hy, a.x, a.y);
        }
        nmCtx.lineWidth = 0.4;
        lineGroups.forEach(g => { if (!g.lines.length) return; nmCtx.strokeStyle = 'rgba(190,215,255,'+g.a+')'; nmCtx.beginPath(); for (let j = 0; j < g.lines.length; j += 4) { nmCtx.moveTo(g.lines[j], g.lines[j+1]); nmCtx.lineTo(g.lines[j+2], g.lines[j+3]); } nmCtx.stroke(); });

        for (let i = 0; i < NM_HUMANS.length; i++) {
          const h = NM_HUMANS[i]; const a = nmNodeById[h.anchorId]; if (!a || a.x === undefined) continue;
          const hx = a.x + h.ox, hy = a.y + h.oy;
          const twinkle = 0.55 + 0.45 * Math.sin(ts*0.001*h.speed + h.phase);
          const dimmed = nmHovered && !nmHovered.has(h.anchorId);
          const alpha = dimmed ? 0.02 : h.baseAlpha * twinkle;
          nmCtx.fillStyle = 'rgba(220,235,255,' + (alpha*0.25).toFixed(2) + ')';
          nmCtx.beginPath(); nmCtx.arc(hx, hy, h.r*3.5, 0, Math.PI*2); nmCtx.fill();
        }
        for (let i = 0; i < NM_HUMANS.length; i++) {
          const h = NM_HUMANS[i]; const a = nmNodeById[h.anchorId]; if (!a || a.x === undefined) continue;
          const hx = a.x + h.ox, hy = a.y + h.oy;
          const twinkle = 0.55 + 0.45 * Math.sin(ts*0.001*h.speed + h.phase);
          const dimmed = nmHovered && !nmHovered.has(h.anchorId);
          const alpha = dimmed ? 0.04 : h.baseAlpha * twinkle;
          nmCtx.fillStyle = 'rgba(255,255,255,' + alpha.toFixed(2) + ')';
          nmCtx.beginPath(); nmCtx.arc(hx, hy, h.r, 0, Math.PI*2); nmCtx.fill();
        }
      }

      for (let i = nmParticles.length - 1; i >= 0; i--) {
        const p = nmParticles[i]; p.prog += p.speed;
        if (p.prog >= 1) { nmParticles.splice(i, 1); continue; }
        const px = p.x1 + (p.x2 - p.x1) * p.prog, py = p.y1 + (p.y2 - p.y1) * p.prog;
        const fade = Math.min(p.prog*5, 1) * Math.min((1 - p.prog)*5, 1);
        nmCtx.fillStyle = p.isDot ? 'rgba(210,230,255,' + (0.75*fade).toFixed(2) + ')' : 'rgba(240,210,95,' + (0.9*fade).toFixed(2) + ')';
        nmCtx.beginPath(); nmCtx.arc(px, py, p.isDot ? 1.0 : 2.0, 0, Math.PI*2); nmCtx.fill();
      }

      nmCtx.restore();
    }
    requestAnimationFrame(nmRender);
  }

  // ===== EXPORT =====
  window.FRQNCYNetworkMap = {
    init: init,
    filterByDomain: filterByDomain,
    filterByPillar: filterByPillar,
    HOME_DATA: { nodes: HOME_NODES, links: HOME_RAW_LINKS, urls: HOME_URL }
  };
})();
