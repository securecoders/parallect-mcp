import type { VercelRequest, VercelResponse } from "@vercel/node";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { ParallectClient } from "../src/client.js";
import { createServer } from "../src/server.js";

const apiUrl = process.env.PARALLECT_API_URL ?? "https://parallect.ai";
const mcpPublicUrl = process.env.MCP_PUBLIC_URL ?? "https://mcp.parallect.ai";
const wwwAuthenticate = `Bearer resource_metadata="${mcpPublicUrl}/.well-known/oauth-protected-resource"`;

function extractBearerToken(header: string | undefined): string | null {
  if (!header) return null;
  const match = header.match(/^Bearer\s+(\S+)$/i);
  return match?.[1] ?? null;
}

function cors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Method not allowed. Use POST for stateless MCP." },
      id: null,
    });
    return;
  }

  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    res.setHeader("WWW-Authenticate", wwwAuthenticate);
    res.status(401).json({
      error: "invalid_token",
      error_description: "Missing Authorization: Bearer <token>",
    });
    return;
  }

  try {
    const client = new ParallectClient(token, apiUrl);
    const mcpServer = createServer(() => client);
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

    await mcpServer.connect(transport);
    await transport.handleRequest(req, res, req.body);

    res.on("close", () => {
      transport.close();
      mcpServer.close();
    });
  } catch (error) {
    console.error("Error handling MCP request:", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    }
  }
}
