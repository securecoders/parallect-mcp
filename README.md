# Parallect MCP Server

A [Model Context Protocol](https://modelcontextprotocol.io/) server for [Parallect.ai](https://parallect.ai) — multi-provider deep research from AI.

This MCP server gives AI assistants (Cursor, Claude Desktop, Claude Code, etc.) access to Parallect's deep research capabilities: submit queries, track progress, retrieve synthesized reports with cross-referenced citations, and explore claims with full evidence chains.

## Quick Start

### Cursor

Add to your Cursor MCP settings (`.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "parallect": {
      "command": "npx",
      "args": ["-y", "@parallect/mcp-server"],
      "env": {
        "PARALLECT_API_KEY": "par_live_your_key_here"
      }
    }
  }
}
```

### Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "parallect": {
      "command": "npx",
      "args": ["-y", "@parallect/mcp-server"],
      "env": {
        "PARALLECT_API_KEY": "par_live_your_key_here"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add parallect -- npx -y @parallect/mcp-server
```

Then set `PARALLECT_API_KEY` in your environment.

## Transport Modes

The server supports two transport modes: **stdio** for local MCP clients and **HTTP** for hosted/remote deployments.

### Stdio (Local)

Used by Cursor, Claude Desktop, Claude Code, and other local MCP clients. The API key is set via environment variable and used for all requests.

### Hosted HTTP

Runs as a standalone HTTP server. Each client authenticates with their own `Authorization: Bearer <token>` header, which is passed through to the Parallect API.

```bash
# Start the HTTP server
PORT=8080 PARALLECT_API_URL=https://parallect.ai npm run start:http
```

Clients send MCP JSON-RPC messages via `POST /mcp` with their API key as a Bearer token:

```bash
curl -X POST http://localhost:8080/mcp \
  -H "Authorization: Bearer par_live_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize","params":{...},"id":1}'
```

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `8080` | HTTP server listen port |
| `PARALLECT_API_URL` | No | `https://parallect.ai` | API base URL |

No `PARALLECT_API_KEY` env var is needed in HTTP mode — each request carries its own token.

## Configuration (stdio mode)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PARALLECT_API_KEY` | Yes | — | Your Parallect API key (`par_live_...`) |
| `PARALLECT_API_URL` | No | `https://parallect.ai` | API base URL (for self-hosted or dev) |

Get your API key at [parallect.ai/settings](https://parallect.ai/settings).

## Available Tools

| Tool | Description |
|------|-------------|
| `research` | Submit a deep research query across multiple AI providers |
| `research_status` | Check progress of a running research job |
| `get_results` | Retrieve the synthesized report, citations, and claims |
| `follow_up` | Pursue follow-on research in the same thread |
| `list_threads` | List your recent research threads |
| `get_thread` | Get a thread with all messages, jobs, and results |
| `balance` | Check your credit balance and recent transactions |
| `usage` | View spend analytics by provider and time period |
| `list_providers` | See available research providers and budget tiers |
| `search_claims` | Search and filter extracted claims |
| `get_claim_evidence` | Get the full evidence chain for a specific claim |

## Development

```bash
npm install
npm run build

# stdio mode
npm start

# HTTP mode
npm run start:http
```

Or for development with auto-reload:

```bash
# stdio
npm run dev

# HTTP
npm run dev:http
```

## License

MIT
