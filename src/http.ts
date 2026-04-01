#!/usr/bin/env node
import { createServer as createHttpServer, type IncomingMessage, type ServerResponse } from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { ParallectClient } from "./client.js";
import { createServer } from "./server.js";

const apiUrl = process.env.PARALLECT_API_URL ?? "https://parallect.ai";
const port = parseInt(process.env.PORT ?? "8080", 10);
const mcpPublicUrl = process.env.MCP_PUBLIC_URL ?? `http://localhost:${process.env.PORT ?? "8080"}`;
const wwwAuthenticate = `Bearer resource_metadata="${mcpPublicUrl}/.well-known/oauth-protected-resource"`;

function extractBearerToken(header: string | undefined): string | null {
  if (!header) return null;
  const match = header.match(/^Bearer\s+(\S+)$/i);
  return match?.[1] ?? null;
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    req.on("error", reject);
  });
}

function sendJson(res: ServerResponse, status: number, body: unknown, headers?: Record<string, string>) {
  res.writeHead(status, { "Content-Type": "application/json", ...headers });
  res.end(JSON.stringify(body));
}

function handleOAuthDiscovery(_req: IncomingMessage, res: ServerResponse) {
  sendJson(res, 200, {
    resource: mcpPublicUrl,
    authorization_servers: [apiUrl],
    scopes_supported: ["research", "account", "billing"],
    bearer_methods_supported: ["header"],
  }, {
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "max-age=3600",
  });
}

const httpServer = createHttpServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  const path = url.pathname;

  if (path === "/.well-known/oauth-protected-resource") {
    handleOAuthDiscovery(req, res);
    return;
  }

  if (path !== "/mcp" && path !== "/") {
    sendJson(res, 404, { error: "not_found", message: "MCP endpoint is at /mcp" });
    return;
  }

  if (req.method === "GET" || req.method === "DELETE") {
    sendJson(res, 405, {
      jsonrpc: "2.0",
      error: { code: -32000, message: "Method not allowed. Use POST for stateless MCP." },
      id: null,
    });
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { error: "method_not_allowed" });
    return;
  }

  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    sendJson(res, 401, {
      error: "invalid_token",
      error_description: "Missing Authorization: Bearer <token>",
    }, { "WWW-Authenticate": wwwAuthenticate });
    return;
  }

  try {
    const raw = await readBody(req);
    const body = JSON.parse(raw);

    const client = new ParallectClient(token, apiUrl);
    const mcpServer = createServer(() => client);
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

    await mcpServer.connect(transport);
    await transport.handleRequest(req, res, body);

    res.on("close", () => {
      transport.close();
      mcpServer.close();
    });
  } catch (error) {
    console.error("Error handling MCP request:", error);
    if (!res.headersSent) {
      sendJson(res, 500, {
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    }
  }
});

httpServer.listen(port, "0.0.0.0", () => {
  console.log(`Parallect MCP HTTP server listening on port ${port}`);
});

process.on("SIGINT", () => {
  console.log("Shutting down...");
  httpServer.close();
  process.exit(0);
});
