// FRQNCY Crypto — Live Market Data Hydration
// Reads CoinGecko IDs from PROJECTS array on the page,
// fetches live market data, paints price + 24h change pills onto each card.
//
// Usage: include after the page's PROJECTS array is defined.
//   <script src="../_market.js" defer></script>
// Auto-runs on DOMContentLoaded.

(function () {
  "use strict";

  const API_BASE =
    location.hostname === "localhost" || location.hostname === "127.0.0.1"
      ? "https://frqncy.network"
      : "";
  const ENDPOINT = API_BASE + "/api/crypto/market";

  // ── Helpers ────────────────────────────────────────────
  function fmtPrice(p) {
    if (p == null) return "";
    if (p >= 1000) return "$" + p.toLocaleString("en-US", { maximumFractionDigits: 0 });
    if (p >= 1) return "$" + p.toLocaleString("en-US", { maximumFractionDigits: 2 });
    if (p >= 0.01) return "$" + p.toFixed(3);
    if (p >= 0.0001) return "$" + p.toFixed(5);
    return "$" + p.toExponential(2);
  }

  function fmtChange(c) {
    if (c == null) return "";
    const sign = c >= 0 ? "+" : "";
    return sign + c.toFixed(2) + "%";
  }

  function changeClass(c) {
    if (c == null) return "neutral";
    if (c > 0.5) return "up";
    if (c < -0.5) return "down";
    return "neutral";
  }

  // ── Inject minimal styles once ─────────────────────────
  function injectStyles() {
    if (document.getElementById("market-overlay-styles")) return;
    const css = `
      .mkt-row{display:flex;align-items:baseline;gap:.6rem;margin-top:.6rem;font-family:'Jost',sans-serif;font-size:.78rem;letter-spacing:.02em}
      .mkt-price{color:#fff;font-weight:500}
      .mkt-change{padding:.1rem .45rem;border-radius:2px;font-size:.7rem;font-weight:500}
      .mkt-change.up{background:rgba(46,204,113,0.15);color:#4ade80}
      .mkt-change.down{background:rgba(231,76,60,0.15);color:#f87171}
      .mkt-change.neutral{background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.55)}
      .mkt-mcap{color:rgba(255,255,255,0.4);font-size:.66rem;margin-left:auto}
      .mkt-loading{display:inline-block;width:.5rem;height:.5rem;border-radius:50%;background:rgba(255,255,255,0.2);animation:mktPulse 1.4s ease-in-out infinite}
      @keyframes mktPulse{0%,100%{opacity:.3}50%{opacity:.7}}
    `;
    const s = document.createElement("style");
    s.id = "market-overlay-styles";
    s.textContent = css;
    document.head.appendChild(s);
  }

  function fmtMcap(m) {
    if (m == null || m === 0) return "";
    if (m >= 1e9) return "$" + (m / 1e9).toFixed(1) + "B mcap";
    if (m >= 1e6) return "$" + (m / 1e6).toFixed(0) + "M mcap";
    return "$" + m.toLocaleString("en-US") + " mcap";
  }

  // ── Find cards on the page ─────────────────────────────
  // Cards are .ccard with data-cgid attribute (set by generator),
  // OR inferred from the PROJECTS global if exposed.
  function collectIds() {
    const ids = new Set();

    // 1. From data attributes on cards (preferred)
    document.querySelectorAll(".ccard[data-cgid]").forEach((el) => {
      const id = el.getAttribute("data-cgid");
      if (id) ids.add(id.toLowerCase());
    });

    // 2. From PROJECTS global (fallback)
    if (typeof window.PROJECTS !== "undefined" && Array.isArray(window.PROJECTS)) {
      window.PROJECTS.forEach((p) => {
        if (p && p.coingeckoId) ids.add(String(p.coingeckoId).toLowerCase());
      });
    }

    return Array.from(ids);
  }

  function paintCard(card, coin) {
    if (!coin) return;
    // Avoid double-painting
    if (card.querySelector(".mkt-row")) return;

    const footer = card.querySelector(".ccard-footer");
    const row = document.createElement("div");
    row.className = "mkt-row";

    const price = document.createElement("span");
    price.className = "mkt-price";
    price.textContent = fmtPrice(coin.price);

    const change = document.createElement("span");
    change.className = "mkt-change " + changeClass(coin.change24h);
    change.textContent = fmtChange(coin.change24h);

    const mcap = document.createElement("span");
    mcap.className = "mkt-mcap";
    mcap.textContent = fmtMcap(coin.mcap);

    row.appendChild(price);
    row.appendChild(change);
    if (mcap.textContent) row.appendChild(mcap);

    if (footer) {
      footer.parentNode.insertBefore(row, footer);
    } else {
      card.appendChild(row);
    }
  }

  // ── Main hydration ─────────────────────────────────────
  async function hydrate() {
    injectStyles();
    const ids = collectIds();
    if (ids.length === 0) return;

    try {
      const res = await fetch(ENDPOINT + "?ids=" + encodeURIComponent(ids.join(",")));
      if (!res.ok) return;
      const data = await res.json();
      const coins = data.coins || {};

      // Paint by data-cgid
      document.querySelectorAll(".ccard[data-cgid]").forEach((card) => {
        const id = (card.getAttribute("data-cgid") || "").toLowerCase();
        if (coins[id]) paintCard(card, coins[id]);
      });

      // Also handle bitcoin/index.html style — match by name from PROJECTS global
      if (typeof window.PROJECTS !== "undefined" && Array.isArray(window.PROJECTS)) {
        const byName = {};
        window.PROJECTS.forEach((p) => {
          if (p && p.coingeckoId) byName[p.name] = p.coingeckoId.toLowerCase();
        });
        document.querySelectorAll(".ccard").forEach((card) => {
          if (card.querySelector(".mkt-row")) return;
          const nameEl = card.querySelector(".ccard-name");
          if (!nameEl) return;
          const cgid = byName[nameEl.textContent.trim()];
          if (cgid && coins[cgid]) paintCard(card, coins[cgid]);
        });
      }
    } catch (_) {
      // Silent — site works fine without prices
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", hydrate);
  } else {
    hydrate();
  }
})();
