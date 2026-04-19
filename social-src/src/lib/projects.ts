// FRQNCY Social — project data loader
//
// Loads the 600+ rated crypto projects from the main FRQNCY site's
// /api/crypto/projects Cloudflare Pages Function (same origin in prod).
// Provides a memoized in-memory cache plus a simple ranked search.

export interface Project {
  name: string;
  symbol: string;
  tier: string;        // "S" | "A" | "B" | "C" | "D" | "E" | "F" | "NR" | ""
  tierLabel?: string;  // "core" | "conviction" | "watch" | "speculative" | "avoid" | "unrated"
  category?: string;
  chapter?: string;
  accent?: string;
}

// ─── Module-level cache ─────────────────────────────────────────────────────

let cache: Project[] | null = null;
let inflight: Promise<Project[]> | null = null;

/**
 * Load the full project list. Memoized — subsequent calls return the cached
 * array without re-fetching. Concurrent calls share a single inflight promise.
 */
export async function loadProjects(): Promise<Project[]> {
  if (cache) return cache;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const res = await fetch('/api/crypto/projects');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const projects: Project[] = Array.isArray(data?.projects) ? data.projects : [];
      // Drop entries without a name — nothing to pick.
      cache = projects.filter((p) => p && typeof p.name === 'string' && p.name.length > 0);
      return cache;
    } catch (err) {
      console.error('loadProjects failed:', err);
      cache = [];
      return cache;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

/**
 * Clear the in-memory cache. Mostly for tests / admin UI — call sites
 * normally never need this.
 */
export function clearProjectCache(): void {
  cache = null;
  inflight = null;
}

// ─── Search ─────────────────────────────────────────────────────────────────

/**
 * Rank projects against a query. Exact symbol matches win, then prefix
 * matches on symbol/name, then substring matches. Returns up to `limit`.
 */
export function searchProjects(query: string, limit = 20): Project[] {
  const list = cache ?? [];
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const scored: Array<{ project: Project; score: number }> = [];

  for (const p of list) {
    const name = p.name.toLowerCase();
    const symbol = (p.symbol || '').toLowerCase();

    let score = 0;
    if (symbol === q) score = 100;
    else if (name === q) score = 90;
    else if (symbol.startsWith(q)) score = 80;
    else if (name.startsWith(q)) score = 70;
    else if (symbol.includes(q)) score = 50;
    else if (name.includes(q)) score = 40;

    if (score > 0) {
      // Tie-breaker: higher tier (S > A > B > ...) ranks first.
      const tierBonus = tierWeight(p.tier);
      scored.push({ project: p, score: score + tierBonus });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.project);
}

function tierWeight(tier: string | undefined): number {
  switch ((tier || '').toUpperCase()) {
    case 'S': return 7;
    case 'A': return 6;
    case 'B': return 5;
    case 'C': return 4;
    case 'D': return 3;
    case 'E': return 2;
    case 'F': return 1;
    default: return 0;
  }
}
