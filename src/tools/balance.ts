import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ClientFactory } from "../client.js";

interface BalanceResponse {
  balanceCents: number;
  balanceDollars: string;
  hasPaymentMethod: boolean;
  transactions?: Array<{
    id: string;
    type: string;
    amountCents: number;
    description: string | null;
    creditSource: string | null;
    createdAt: string;
  }>;
}

export function registerBalanceTool(server: McpServer, getClient: ClientFactory) {
  server.registerTool(
    "balance",
    {
      title: "Balance",
      description: "Check current credit balance and optionally view recent transactions.",
      inputSchema: {
        includeTransactions: z
          .boolean()
          .default(false)
          .describe("Include recent balance transactions"),
      },
    },
    async (params, extra) => {
      const client = getClient(extra);
      const res = await client.get<BalanceResponse>("/api/v1/balance", {
        include_transactions: params.includeTransactions ? "true" : undefined,
      });

      return {
        content: [{ type: "text" as const, text: JSON.stringify(res) }],
      };
    },
  );
}
