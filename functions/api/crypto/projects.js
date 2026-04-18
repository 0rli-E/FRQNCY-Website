// FRQNCY Crypto Project Database — Cloudflare Pages Function
// Queries Notion API, caches in KV, returns structured JSON

const NOTION_DB_ID = "2885f874cee880d9a5fac5f6b89aecba";
const NOTION_API_VERSION = "2022-06-28";
const KV_KEY = "crypto_projects_v1";
const CACHE_TTL = 300; // 5 minutes

const ALLOWED_ORIGINS = [
  "https://frqncy.network",
  "https://www.frqncy.network",
];

function isAllowedOrigin(origin) {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (/^https:\/\/.*\.frqncy-website\.pages\.dev$/.test(origin)) return true;
  if (/^http:\/\/localhost(:\d+)?$/.test(origin)) return true;
  return false;
}

function corsHeaders(origin) {
  const headers = {
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
  if (isAllowedOrigin(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

// ── Tier mapping ──────────────────────────────────────────────

const TIER_MAP = {
  "\uD83D\uDC8E S":       { tier: "S",  tierLabel: "core" },
  "\uD83E\uDD47 A":       { tier: "A",  tierLabel: "conviction" },
  "\uD83E\uDD48 B":       { tier: "B",  tierLabel: "watch" },
  "\u2699\uFE0F C":       { tier: "C",  tierLabel: "speculative" },
  "\uD83E\uDE99 D":       { tier: "D",  tierLabel: "speculative" },
  "\uD83E\uDDF1 E":       { tier: "E",  tierLabel: "avoid" },
  "\uD83D\uDDD1\uFE0F F": { tier: "F",  tierLabel: "avoid" },
  "not rateable":          { tier: "NR", tierLabel: "unrated" },
};

function mapTier(raw) {
  if (!raw) return { tier: "", tierLabel: "unrated" };
  return TIER_MAP[raw] || { tier: "", tierLabel: "unrated" };
}

// ── Chapter metadata ──────────────────────────────────────────

const CHAPTER_META = {
  "Store of Value": { icon: "\uD83C\uDFDB", intro: "Store-of-value assets are the foundations of crypto \u2014 digital commodities designed to hold and grow wealth over time without relying on any central institution." },
  "Smart Contract Platforms": { icon: "\u26D3", intro: "Layer 1 blockchains are the base infrastructure of the decentralized web \u2014 independent networks with their own consensus, security, and rules." },
  "Layer 2 Solutions": { icon: "\uD83E\uDDE9", intro: "Layer 2s scale existing blockchains by processing transactions off the main chain while inheriting its security." },
  "DeFi Protocols": { icon: "\uD83C\uDFE6", intro: "Decentralized finance replaces traditional financial intermediaries with transparent, permissionless smart contracts." },
  "Stablecoins": { icon: "\uD83D\uDCB5", intro: "Stablecoins are crypto assets pegged to real-world currencies \u2014 the bridge between traditional finance and DeFi." },
  "AI & Blockchain": { icon: "\uD83E\uDD16", intro: "The intersection of AI and crypto \u2014 decentralizing machine intelligence from training data to compute power to autonomous agents." },
  "Meme Coins": { icon: "\uD83D\uDC38", intro: "Crypto\u2019s cultural layer \u2014 assets driven by community, humor, and social consensus rather than technology or utility." },
  "Privacy": { icon: "\uD83D\uDD10", intro: "Privacy coins and protocols protect the fundamental right to financial confidentiality using advanced cryptography." },
  "Payments": { icon: "\uD83D\uDCB8", intro: "Payment-focused projects making money movement as fast and borderless as sending a message." },
  "Oracles & Infrastructure": { icon: "\uD83D\uDD2E", intro: "Oracles bridge blockchains to the real world \u2014 feeding external data into smart contracts." },
  "Gaming & Metaverse": { icon: "\uD83C\uDFAE", intro: "Blockchain gaming gives players true ownership of in-game assets \u2014 items, characters, and currencies that exist outside any single game." },
  "DeSci & Longevity": { icon: "\uD83E\uDDEC", intro: "Decentralized science applies crypto coordination to research funding \u2014 communities pool capital to fund the science that matters." },
  "SocialFi & Identity": { icon: "\uD83C\uDF10", intro: "Social networks and identity systems built on decentralized protocols \u2014 owned by users, not platforms." },
  "Prediction Markets": { icon: "\uD83C\uDFAF", intro: "Markets for forecasting real-world events \u2014 harnessing collective intelligence through economic incentives." },
  "Real World Assets": { icon: "\uD83C\uDFE2", intro: "Tokenizing real-world assets \u2014 bringing stocks, bonds, real estate, and commodities on-chain." },
  "Other": { icon: "\uD83D\uDCE6", intro: "Projects that don\u2019t fit neatly into a single category." },
};

// ── Accent color from name ────────────────────────────────────

function accentColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  }
  const hue = Math.abs(hash) % 360;
  const sat = 60 + (Math.abs(hash >> 8) % 21);   // 60-80
  const lit = 55 + (Math.abs(hash >> 16) % 21);   // 55-75
  return `hsl(${hue}, ${sat}%, ${lit}%)`;
}

// ── Notion property helpers ───────────────────────────────────

function txt(prop) {
  if (!prop) return "";
  if (prop.type === "title") return prop.title?.[0]?.plain_text || "";
  if (prop.type === "rich_text") return prop.rich_text?.[0]?.plain_text || "";
  if (prop.type === "select") return prop.select?.name || "";
  return "";
}

// ── Notion pagination ─────────────────────────────────────────

async function fetchAllProjects(apiKey) {
  const url = `https://api.notion.com/v1/databases/${NOTION_DB_ID}/query`;
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Notion-Version": NOTION_API_VERSION,
    "Content-Type": "application/json",
  };

  let allResults = [];
  let startCursor = undefined;
  let hasMore = true;

  while (hasMore) {
    const body = { page_size: 100 };
    if (startCursor) body.start_cursor = startCursor;

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Notion API ${res.status}: ${errText}`);
    }

    const data = await res.json();
    allResults = allResults.concat(data.results);
    hasMore = data.has_more;
    startCursor = data.next_cursor;
  }

  return allResults;
}

// ── Transform Notion results ──────────────────────────────────

function transformResults(results) {
  return results
    .map((page) => {
      const p = page.properties;
      const name = txt(p["Project Name"]);
      if (!name) return null;
      if (name.startsWith("New Project") || name.startsWith("Placeholder")) return null;

      const tierRaw = p["Tier Rating"]?.select?.name || null;
      const { tier, tierLabel } = mapTier(tierRaw);

      return {
        name,
        symbol: txt(p["Symbol"]),
        tier,
        tierLabel,
        category: txt(p["Category"]),
        chapter: txt(p["Chapter"]),
        type: txt(p["Type"]),
        mcap: txt(p["Market Cap "]),
        conviction: txt(p["Conviction"]),
        thesis: txt(p["Investment Thesis"]),
        coingecko: txt(p["CoinGecko Link"]),
        notes: txt(p["Notes"]),
        watchlist: txt(p["Watchlist"]),
        accent: accentColor(name),
      };
    })
    .filter(Boolean);
}

// ── Main handler ──────────────────────────────────────────────

export async function onRequest(context) {
  const { request, env } = context;
  const origin = request.headers.get("Origin") || "";
  const cors = corsHeaders(origin);

  // Preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  if (request.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  // Check Notion key
  if (!env.NOTION_API_KEY) {
    return new Response(
      JSON.stringify({
        error: "NOTION_API_KEY not configured",
        help: "Add NOTION_API_KEY as a secret in Cloudflare Pages settings (Settings > Environment variables).",
      }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }

  const url = new URL(request.url);
  const forceRefresh = url.searchParams.get("refresh") === "true";
  const filterTier = url.searchParams.get("tier");
  const filterChapter = url.searchParams.get("chapter");

  const kv = env.CRYPTO_CACHE;
  let cached = false;
  let payload = null;

  // ── Try cache first ───────────────────────────────────────
  if (!forceRefresh && kv) {
    try {
      const raw = await kv.get(KV_KEY, { type: "json", cacheTtl: 60 });
      if (raw && raw.timestamp) {
        const age = (Date.now() - raw.timestamp) / 1000;
        if (age < CACHE_TTL) {
          payload = raw;
          cached = true;
        }
      }
    } catch (_) {
      // KV read failed, proceed to Notion
    }
  }

  // ── Fetch from Notion if needed ───────────────────────────
  if (!payload) {
    try {
      const results = await fetchAllProjects(env.NOTION_API_KEY);
      const projects = transformResults(results);

      payload = {
        timestamp: Date.now(),
        lastSync: new Date().toISOString(),
        projects,
      };

      // Write to KV (non-blocking)
      if (kv) {
        context.waitUntil(
          kv.put(KV_KEY, JSON.stringify(payload), { expirationTtl: CACHE_TTL * 6 })
        );
      }
    } catch (err) {
      // Notion failed — try stale cache
      if (kv) {
        try {
          const stale = await kv.get(KV_KEY, { type: "json" });
          if (stale) {
            payload = stale;
            cached = true; // serving stale
          }
        } catch (_) {
          // KV also failed
        }
      }

      if (!payload) {
        return new Response(
          JSON.stringify({
            error: "Service temporarily unavailable",
            detail: err.message,
          }),
          { status: 503, headers: { ...cors, "Content-Type": "application/json" } }
        );
      }
    }
  }

  // ── Apply filters ─────────────────────────────────────────
  let projects = payload.projects;

  if (filterTier) {
    projects = projects.filter(
      (p) => p.tier.toLowerCase() === filterTier.toLowerCase()
    );
  }
  if (filterChapter) {
    projects = projects.filter(
      (p) => p.chapter.toLowerCase() === filterChapter.toLowerCase()
    );
  }

  // ── Build response ────────────────────────────────────────
  const body = {
    lastSync: payload.lastSync,
    cached,
    totalProjects: projects.length,
    projects,
    chapters: CHAPTER_META,
  };

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      ...cors,
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=60",
    },
  });
}
