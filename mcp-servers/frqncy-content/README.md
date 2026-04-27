# @frqncy/mcp-content

MCP server that exposes FRQNCY's topic graph + resource library as tools for any LLM agent.

Read-only. Works with `@frqncy/harness`, Claude Desktop, Cursor, and any other MCP client.

## What it exposes

| Tool | Purpose |
|---|---|
| `search_topics(query, limit?)` | Full-text search over topics |
| `get_topic(identifier)` | Get one topic by id, slug, or label |
| `list_topics(domain?, pillar?, limit?)` | List topics with optional filters |
| `list_domains()` | List the 15 distinct topic domains |
| `list_pillars()` | List the 6 distinct topic pillars |
| `search_resources(query, type?, limit?)` | Full-text search over resources |
| `get_resource(name)` | Get one resource by exact name |
| `list_resources_for_topic(topic_slug, type?, limit?)` | Resources tagged to a topic |
| `list_resources_by_type(type, limit?)` | Filter by type (person/book/org/etc.) |
| `random_topic(domain?)` | Pick a random topic for inspiration |
| `stats()` | Overall stats: counts + breakdowns |

## Install once

From inside this folder:

```bash
cd "/Users/orli/Documents/Claude/Projects/FRQNCY WEBSITE/mcp-servers/frqncy-content"
npm install
```

## Wire it into the harness

```bash
frqncy-harness mcp add frqncy-content node "/Users/orli/Documents/Claude/Projects/FRQNCY WEBSITE/mcp-servers/frqncy-content/index.js"
```

Verify:

```bash
frqncy-harness mcp test frqncy-content
```

You should see all 11 tools listed.

## Wire it into Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "frqncy-content": {
      "command": "node",
      "args": ["/Users/orli/Documents/Claude/Projects/FRQNCY WEBSITE/mcp-servers/frqncy-content/index.js"]
    }
  }
}
```

Restart Claude Desktop. The 11 tools will appear in the tools list.

## Try it

Once wired into the harness, use it through an agent run:

```bash
frqncy-harness agent "Use the FRQNCY content tools to list all topics in the 'Sciences' domain. Then for the first three, give me their resource counts and pick the most interesting." --yolo
```

Or directly from a chat to confirm it works:

```bash
frqncy-harness chat "List all FRQNCY domains using the frqncy-content tool." --model openrouter/openrouter/free
```

## Configuration

By default the server reads `search.json` + `resources.json` from two levels up (the FRQNCY WEBSITE root). To point it at a different location, set the env var:

```bash
FRQNCY_CONTENT_DIR=/path/to/another/frqncy-content node index.js
```

In MCP config:

```json
{
  "mcpServers": {
    "frqncy-content": {
      "command": "node",
      "args": ["/path/to/index.js"],
      "env": {
        "FRQNCY_CONTENT_DIR": "/path/to/content"
      }
    }
  }
}
```

## Caching

The server lazily loads `search.json` + `resources.json` on first request and caches them for the life of the process. Restart the server to pick up content changes.

## License

MIT.
