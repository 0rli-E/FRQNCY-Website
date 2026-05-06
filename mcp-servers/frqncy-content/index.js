#!/usr/bin/env node
/**
 * FRQNCY Content MCP Server
 *
 * Exposes FRQNCY's topic graph + resource library as tools for any LLM agent
 * via the Model Context Protocol (MCP).
 *
 * Read-only. Writes (proposing additions) go through whatever client the agent
 * uses — keep concerns separate.
 *
 * Configuration:
 *   FRQNCY_CONTENT_DIR — absolute path to the FRQNCY WEBSITE folder.
 *                        Defaults to two levels up from this script
 *                        (i.e., assumes this server lives at
 *                        FRQNCY_WEBSITE/mcp-servers/frqncy-content/index.js).
 *
 * Usage from any MCP client (Claude Desktop, @frqncy/harness, Cursor, etc.):
 *   {
 *     "mcpServers": {
 *       "frqncy-content": {
 *         "command": "node",
 *         "args": ["/absolute/path/to/FRQNCY WEBSITE/mcp-servers/frqncy-content/index.js"]
 *       }
 *     }
 *   }
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { promises as fs } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// ────────────────────────────────────────────────────────────────────
// Path resolution
// ────────────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CONTENT_DIR =
  process.env.FRQNCY_CONTENT_DIR ?? resolve(__dirname, '..', '..');
const SEARCH_JSON_PATH = join(CONTENT_DIR, 'search.json');
const RESOURCES_JSON_PATH = join(CONTENT_DIR, 'resources.json');
const CONTENT_JSON_PATH = join(CONTENT_DIR, 'content.json');

// ────────────────────────────────────────────────────────────────────
// Lazy-loaded data caches
// ────────────────────────────────────────────────────────────────────

let topicsCache = null;
let resourcesCache = null;
let contentCache = null;

async function loadTopics() {
  if (topicsCache) return topicsCache;
  const raw = await fs.readFile(SEARCH_JSON_PATH, 'utf-8');
  topicsCache = JSON.parse(raw);
  return topicsCache;
}

async function loadResources() {
  if (resourcesCache) return resourcesCache;
  const raw = await fs.readFile(RESOURCES_JSON_PATH, 'utf-8');
  resourcesCache = JSON.parse(raw);
  return resourcesCache;
}

async function loadContent() {
  if (contentCache) return contentCache;
  const raw = await fs.readFile(CONTENT_JSON_PATH, 'utf-8');
  contentCache = JSON.parse(raw);
  return contentCache;
}

// ────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────

function lc(s) {
  return (s ?? '').toString().toLowerCase();
}

function fuzzyMatch(haystack, needle) {
  if (!needle) return true;
  return lc(haystack).includes(lc(needle));
}

function topicMatchesQuery(topic, query) {
  if (!query) return true;
  return (
    fuzzyMatch(topic.label, query) ||
    fuzzyMatch(topic.slug, query) ||
    fuzzyMatch(topic.desc, query) ||
    fuzzyMatch(topic.id, query)
  );
}

function resourceMatchesQuery(resource, query) {
  if (!query) return true;
  return (
    fuzzyMatch(resource.name, query) ||
    fuzzyMatch(resource.desc, query) ||
    fuzzyMatch(resource.topicLabel, query) ||
    fuzzyMatch(resource.topicSlug, query)
  );
}

function takeLimit(arr, limit) {
  if (limit === undefined || limit === null) return arr;
  return arr.slice(0, Math.max(0, Math.min(limit, 500)));
}

function ok(data) {
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
  };
}

function err(message) {
  return {
    content: [{ type: 'text', text: JSON.stringify({ error: message }) }],
    isError: true,
  };
}

// ────────────────────────────────────────────────────────────────────
// Tool definitions (schema + handler)
// ────────────────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'search_topics',
    description:
      'Full-text search FRQNCY topics by label/slug/description. Returns topic objects.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query (case-insensitive substring match)' },
        limit: { type: 'integer', description: 'Max results to return. Default 20.', minimum: 1, maximum: 500 },
      },
      required: ['query'],
    },
    handler: async ({ query, limit }) => {
      const topics = await loadTopics();
      const matches = topics.filter((t) => topicMatchesQuery(t, query));
      return ok({
        query,
        count: matches.length,
        results: takeLimit(matches, limit ?? 20),
      });
    },
  },
  {
    name: 'get_topic',
    description: 'Get a single topic by id ("t-quantum"), slug ("quantum"), or label ("Quantum Physics").',
    inputSchema: {
      type: 'object',
      properties: {
        identifier: { type: 'string', description: 'Topic id, slug, or label' },
      },
      required: ['identifier'],
    },
    handler: async ({ identifier }) => {
      const topics = await loadTopics();
      const needle = lc(identifier);
      const found = topics.find(
        (t) => lc(t.id) === needle || lc(t.slug) === needle || lc(t.label) === needle,
      );
      if (!found) return err(`No topic matching "${identifier}". Try search_topics first.`);
      return ok(found);
    },
  },
  {
    name: 'list_topics',
    description:
      'List all topics, optionally filtered by domain (e.g., "Sciences") and/or pillar (e.g., "Research").',
    inputSchema: {
      type: 'object',
      properties: {
        domain: { type: 'string', description: 'Optional domain filter' },
        pillar: { type: 'string', description: 'Optional pillar filter' },
        limit: { type: 'integer', description: 'Max results. Default 50.', minimum: 1, maximum: 500 },
      },
    },
    handler: async ({ domain, pillar, limit }) => {
      const topics = await loadTopics();
      let result = topics;
      if (domain) result = result.filter((t) => lc(t.domain) === lc(domain));
      if (pillar) result = result.filter((t) => lc(t.pillar) === lc(pillar));
      return ok({
        domain: domain ?? null,
        pillar: pillar ?? null,
        count: result.length,
        results: takeLimit(result, limit ?? 50),
      });
    },
  },
  {
    name: 'list_domains',
    description: 'List all distinct topic domains (e.g., "Sciences", "Technology", "Arts & Culture").',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      const topics = await loadTopics();
      const domains = [...new Set(topics.map((t) => t.domain))].sort();
      return ok({ count: domains.length, domains });
    },
  },
  {
    name: 'list_pillars',
    description: 'List FRQNCY pillars — what FRQNCY actively does (Research, Education, Builder, Media, Fund, Network State, Curate, Sell). Pillars apply across every domain and topic; canonical source is content.json.',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      const content = await loadContent();
      const pillars = (content.pillars || []).map((p) => p.label);
      return ok({ count: pillars.length, pillars, full: content.pillars || [] });
    },
  },
  {
    name: 'search_resources',
    description:
      'Full-text search FRQNCY resources by name/description/topic. Returns resource objects.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query (case-insensitive substring match)' },
        type: {
          type: 'string',
          description: 'Optional type filter: person, book, org, media, music, place, tool, platform, course, website, app, article, reference',
        },
        limit: { type: 'integer', description: 'Max results to return. Default 20.', minimum: 1, maximum: 500 },
      },
      required: ['query'],
    },
    handler: async ({ query, type, limit }) => {
      const resources = await loadResources();
      let matches = resources.filter((r) => resourceMatchesQuery(r, query));
      if (type) matches = matches.filter((r) => lc(r.type) === lc(type));
      return ok({
        query,
        type: type ?? null,
        count: matches.length,
        results: takeLimit(matches, limit ?? 20),
      });
    },
  },
  {
    name: 'get_resource',
    description: 'Get a single resource by exact name match. Use search_resources first if unsure.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Exact resource name' },
      },
      required: ['name'],
    },
    handler: async ({ name }) => {
      const resources = await loadResources();
      const matches = resources.filter((r) => lc(r.name) === lc(name));
      if (matches.length === 0) return err(`No resource named "${name}". Try search_resources first.`);
      return ok({ count: matches.length, results: matches });
    },
  },
  {
    name: 'list_resources_for_topic',
    description: 'List all resources tagged to a specific topic (by slug, e.g., "quantum").',
    inputSchema: {
      type: 'object',
      properties: {
        topic_slug: { type: 'string', description: 'Topic slug (e.g., "quantum", "neuroscience")' },
        type: { type: 'string', description: 'Optional resource type filter' },
        limit: { type: 'integer', description: 'Max results. Default 100.', minimum: 1, maximum: 500 },
      },
      required: ['topic_slug'],
    },
    handler: async ({ topic_slug, type, limit }) => {
      const resources = await loadResources();
      let matches = resources.filter((r) => lc(r.topicSlug) === lc(topic_slug));
      if (type) matches = matches.filter((r) => lc(r.type) === lc(type));
      return ok({
        topic_slug,
        type: type ?? null,
        count: matches.length,
        results: takeLimit(matches, limit ?? 100),
      });
    },
  },
  {
    name: 'list_resources_by_type',
    description:
      'List all resources of a specific type (person, book, org, media, music, place, tool, platform, course, website, app, article, reference).',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', description: 'Resource type' },
        limit: { type: 'integer', description: 'Max results. Default 50.', minimum: 1, maximum: 500 },
      },
      required: ['type'],
    },
    handler: async ({ type, limit }) => {
      const resources = await loadResources();
      const matches = resources.filter((r) => lc(r.type) === lc(type));
      return ok({
        type,
        count: matches.length,
        results: takeLimit(matches, limit ?? 50),
      });
    },
  },
  {
    name: 'random_topic',
    description:
      'Return a random topic, optionally filtered by domain. Useful for "give me something interesting to look at."',
    inputSchema: {
      type: 'object',
      properties: {
        domain: { type: 'string', description: 'Optional domain filter' },
      },
    },
    handler: async ({ domain }) => {
      const topics = await loadTopics();
      const pool = domain ? topics.filter((t) => lc(t.domain) === lc(domain)) : topics;
      if (pool.length === 0) return err(`No topics for domain "${domain}".`);
      const pick = pool[Math.floor(Math.random() * pool.length)];
      return ok(pick);
    },
  },
  {
    name: 'stats',
    description: 'Return overall stats: topic count, resource count, breakdown by domain/pillar/type.',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      const topics = await loadTopics();
      const resources = await loadResources();
      const byDomain = {};
      for (const t of topics) byDomain[t.domain] = (byDomain[t.domain] ?? 0) + 1;
      const byPillar = {};
      for (const t of topics) byPillar[t.pillar] = (byPillar[t.pillar] ?? 0) + 1;
      const byType = {};
      for (const r of resources) byType[r.type] = (byType[r.type] ?? 0) + 1;
      return ok({
        topics: { count: topics.length, by_domain: byDomain, by_pillar: byPillar },
        resources: { count: resources.length, by_type: byType },
        content_dir: CONTENT_DIR,
      });
    },
  },
];

// ────────────────────────────────────────────────────────────────────
// Server boot
// ────────────────────────────────────────────────────────────────────

const server = new Server(
  {
    name: '@frqncy/mcp-content',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })),
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const tool = TOOLS.find((t) => t.name === request.params.name);
  if (!tool) return err(`Unknown tool: ${request.params.name}`);
  try {
    return await tool.handler(request.params.arguments ?? {});
  } catch (e) {
    return err(`Tool ${tool.name} failed: ${e instanceof Error ? e.message : String(e)}`);
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);

// Quiet — MCP uses stdio for protocol; logs go to stderr
process.stderr.write(
  `[frqncy-mcp-content] ready. content_dir=${CONTENT_DIR}, ${TOOLS.length} tools registered.\n`,
);
