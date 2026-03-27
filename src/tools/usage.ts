import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ParallectClient } from "../client.js";

interface UsageResponse {
  period: string;
  totalSpendCents: number;
  totalSpendDollars: string;
  providerBreakdown: Array<{
    provider: string;
    totalCostCents: number;
    jobCount: number;
  }>;
  recentJobs: Array<{
    id: string;
    status: string;
    budgetTier: string;
    query: string;
    costCents: number | null;
    createdAt: string;
  }>;
}

export function registerUsageTool(server: McpServer, client: ParallectClient) {
  server.registerTool(
    "usage",
    {
      title: "Usage",
      description: "Get usage analytics: spend by provider, job count, average cost per query.",
      inputSchema: {
        period: z
          .enum(["7d", "30d", "90d", "all"])
          .default("30d")
          .describe("Time period for usage statistics"),
      },
    },
    async (params) => {
      const res = await client.get<UsageResponse>("/api/v1/usage", {
        period: params.period,
      });

      return {
        content: [{ type: "text" as const, text: JSON.stringify(res) }],
      };
    },
  );
}
