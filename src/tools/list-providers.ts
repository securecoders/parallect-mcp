import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ParallectClient } from "../client.js";

interface ProvidersResponse {
  providers: Array<{
    name: string;
    provider: string;
    model: string;
    displayName: string;
    isActive: boolean;
    typicalCostRange: [number, number] | null;
    strengths: string[];
  }>;
  budgetTiers: Array<{
    tier: string;
    maxCostCents: number;
    maxCostDollars: string;
    defaultProviders: string[];
  }>;
}

export function registerListProvidersTool(server: McpServer, client: ParallectClient) {
  server.registerTool(
    "list_providers",
    {
      title: "List Providers",
      description:
        "List available research providers, their models, capabilities, and the default provider assignments per budget tier.",
      inputSchema: {
        budgetTier: z
          .enum(["XXS", "XS", "S", "M", "L", "XL"])
          .optional()
          .describe("If provided, show only the defaults for this tier"),
      },
    },
    async (params) => {
      const res = await client.get<ProvidersResponse>("/api/v1/providers", {
        budget_tier: params.budgetTier,
      });

      return {
        content: [{ type: "text" as const, text: JSON.stringify(res) }],
      };
    },
  );
}
