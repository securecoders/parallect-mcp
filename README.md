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

## Configuration

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
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

## License

MIT
