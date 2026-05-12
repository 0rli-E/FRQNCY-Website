// FRQNCY Crypto — Live Market Data Proxy
// Proxies CoinGecko's free public API, caches results in KV.
// No API key required. Public endpoint is rate-limited to ~10-30 req/min by IP;
// our 120s KV cache keeps us well under that even at high traffic.

const COINGECKO_URL = "https://api.coingecko.com/api/v3/coins/markets";
const KV_KEY_PREFIX = "market_v1:";
const CACHE_TTL = 120; // seconds — fresh enough for "context not race"
const KV_TTL = 600;    // 10 min hard expiration

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

function normalizeIds(raw) {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .filter((id, i, arr) => arr.indexOf(id) === i) // dedupe
    .sort(); // canonical order so cache key is stable
}

async function fetchFromCoinGecko(ids) {
  // CoinGecko caps at 250 ids/request. Chunk if needed.
  const chunks = [];
  for (let i = 0; i < ids.length; i += 250) {
    chunks.push(ids.slice(i, i + 250));
  }

  const all = [];
  for (const chunk of chunks) {
    const url = new URL(COINGECKO_URL);
    url.searchParams.set("vs_currency", "usd");
    url.searchParams.set("ids", chunk.join(","));
    url.searchParams.set("per_page", "250");
    url.searchParams.set("page", "1");
    url.searchParams.set("sparkline", "false");
    url.searchParams.set("price_change_percentage", "24h");

    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      throw new Error(`CoinGecko ${res.status}`);
    }

    const data = await res.json();
    all.push(...data);
  }

  return all.map((c) => ({
    id: c.id,
    symbol: c.symbol,
    name: c.name,
    price: c.current_price,
    change24h: c.price_change_percentage_24h,
    mcap: c.market_cap,
    volume: c.total_volume,
    rank: c.market_cap_rank,
    image: c.image,
  }));
}

export async function onRequest(context) {
  const { request, env } = context;
  const origin = request.headers.get("Origin") || "";
  const cors = corsHeaders(origin);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  if (request.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const url = new URL(request.url);
  const ids = normalizeIds(url.searchParams.get("ids"));
  const forceRefresh = url.searchParams.get("refresh") === "true";

  if (ids.length === 0) {
    return new Response(
      JSON.stringify({ error: "Missing 'ids' query param (comma-separated CoinGecko IDs)" }),
      { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }

  if (ids.length > 250) {
    return new Response(
      JSON.stringify({ error: "Too many ids — max 250 per request" }),
      { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }

  const kv = env.CRYPTO_CACHE;
  const cacheKey = KV_KEY_PREFIX + ids.join(",");
  let cached = false;
  let payload = null;

  // Try cache
  if (!forceRefresh && kv) {
    try {
      const raw = await kv.get(cacheKey, { type: "json", cacheTtl: 60 });
      if (raw && raw.timestamp) {
        const age = (Date.now() - raw.timestamp) / 1000;
        if (age < CACHE_TTL) {
          payload = raw;
          cached = true;
        }
      }
    } catch (_) {}
  }

  // Fetch from CoinGecko if needed
  if (!payload) {
    try {
      const coins = await fetchFromCoinGecko(ids);
      payload = {
        timestamp: Date.now(),
        lastSync: new Date().toISOString(),
        coins,
      };
      if (kv) {
        context.waitUntil(
          kv.put(cacheKey, JSON.stringify(payload), { expirationTtl: KV_TTL })
        );
      }
    } catch (err) {
      // Try stale cache on failure
      if (kv) {
        try {
          const stale = await kv.get(cacheKey, { type: "json" });
          if (stale) {
            payload = stale;
            cached = true;
          }
        } catch (_) {}
      }
      if (!payload) {
        console.error('crypto/market failed:', err);
        return new Response(
          JSON.stringify({ error: "Market data temporarily unavailable" }),
          { status: 503, headers: { ...cors, "Content-Type": "application/json" } }
        );
      }
    }
  }

  // Build response — keyed by id for easy client merge
  const byId = {};
  for (const c of payload.coins) {
    byId[c.id] = c;
  }

  return new Response(
    JSON.stringify({
      lastSync: payload.lastSync,
      cached,
      requested: ids.length,
      returned: payload.coins.length,
      coins: byId,
    }),
    {
      status: 200,
      headers: {
        ...cors,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    }
  );
}
