import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ParallectClient } from "./client.js";
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

export function createServer(apiKey: string, apiUrl: string): McpServer {
  const server = new McpServer(
    { name: "parallect", version: "1.0.0" },
    { capabilities: { tools: {} } },
  );

  const client = new ParallectClient(apiKey, apiUrl);

  registerResearchTool(server, client);
  registerResearchStatusTool(server, client);
  registerGetResultsTool(server, client);
  registerFollowUpTool(server, client);
  registerListThreadsTool(server, client);
  registerGetThreadTool(server, client);
  registerBalanceTool(server, client);
  registerUsageTool(server, client);
  registerListProvidersTool(server, client);
  registerSearchClaimsTool(server, client);
  registerGetClaimEvidenceTool(server, client);

  return server;
}
