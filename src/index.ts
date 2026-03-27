#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

const apiKey = process.env.PARALLECT_API_KEY;

if (!apiKey) {
  console.error("PARALLECT_API_KEY environment variable is required");
  process.exit(1);
}

const apiUrl = process.env.PARALLECT_API_URL ?? "https://parallect.ai";

const server = createServer(apiKey, apiUrl);
const transport = new StdioServerTransport();
await server.connect(transport);
