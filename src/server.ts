import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ClientFactory } from "./client.js";
import { registerResearchTool } from "./tools/research.js";
import { registerResearchStatusTool } from "./tools/research-status.js";
import { registerGetResultsTool } from "./tools/get-results.js";
import { registerFollowUpTool } from "./tools/follow-up.js";
import { registerListThreadsTool } from "./tools/list-threads.js";
import { registerGetThreadTool } from "./tools/get-thread.js";
import { registerBalanceTool } from "./tools/balance.js";
import { registerUsageTool } from "./tools/usage.js";
import { registerListProvidersTool } from "./tools/list-providers.js";
import { registerSearchClaimsTool } from "./tools/search-claims.js";
import { registerGetClaimEvidenceTool } from "./tools/get-claim-evidence.js";

export function createServer(getClient: ClientFactory): McpServer {
  const server = new McpServer(
    { name: "parallect", version: "1.0.0" },
    { capabilities: { tools: {} } },
  );

  registerResearchTool(server, getClient);
  registerResearchStatusTool(server, getClient);
  registerGetResultsTool(server, getClient);
  registerFollowUpTool(server, getClient);
  registerListThreadsTool(server, getClient);
  registerGetThreadTool(server, getClient);
  registerBalanceTool(server, getClient);
  registerUsageTool(server, getClient);
  registerListProvidersTool(server, getClient);
  registerSearchClaimsTool(server, getClient);
  registerGetClaimEvidenceTool(server, getClient);

  return server;
}
