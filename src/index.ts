#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ParallectClient } from "./client.js";
import { createServer } from "./server.js";

const apiKey = process.env.PARALLECT_API_KEY;

if (!apiKey) {
  console.error("PARALLECT_API_KEY environment variable is required");
  process.exit(1);
}

const apiUrl = process.env.PARALLECT_API_URL ?? "https://parallect.ai";

const client = new ParallectClient(apiKey, apiUrl);
const server = createServer(() => client);
const transport = new StdioServerTransport();
await server.connect(transport);
