import type { VercelRequest, VercelResponse } from "@vercel/node";

const authServerUrl = process.env.PARALLECT_API_URL ?? "https://parallect.ai";
const resourceUrl = process.env.MCP_PUBLIC_URL ?? "https://mcp.parallect.ai";

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "max-age=3600");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  res.json({
    resource: resourceUrl,
    authorization_servers: [authServerUrl],
    scopes_supported: ["research", "account", "billing"],
    bearer_methods_supported: ["header"],
  });
}
