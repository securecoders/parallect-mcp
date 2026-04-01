import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ApiError } from "../client.js";
import type { ClientFactory } from "../client.js";

interface ThreadCreateResponse {
  id: string;
  title: string;
  message: { id: string };
  job: {
    id: string;
    status: string;
    budgetTier: string;
    researchMode: string;
  };
}

export function registerResearchTool(server: McpServer, getClient: ClientFactory) {
  server.registerTool(
    "research",
    {
      title: "Research",
      description:
        "Submit a deep research query. Always creates a new research thread. To follow up on existing research, use the follow_up tool instead. Fans out to multiple AI research providers and synthesizes results into a unified report with cross-referenced citations and conflict resolution.",
      inputSchema: {
        query: z.string().describe("The research question or topic to investigate"),
        budgetTier: z
          .enum(["XXS", "XS", "S", "M", "L", "XL"])
          .default("M")
          .describe(
            "Budget tier. Typical cost: XXS=~$0.10, XS=~$1, S=~$2, M=~$4, L=~$7, XL=~$10 (max capped higher). Default: M",
          ),
        providers: z
          .array(z.enum(["perplexity", "gemini", "openai", "grok", "anthropic"]))
          .optional()
          .describe("Specific providers to use. If omitted, selected based on budget tier."),
        mode: z
          .enum(["fast", "methodical"])
          .default("methodical")
          .describe(
            "fast = single cheapest provider (seconds). methodical = multiple providers with synthesis (minutes).",
          ),
      },
    },
    async (params, extra) => {
      const client = getClient(extra);
      try {
        const res = await client.post<ThreadCreateResponse>("/api/v1/threads", {
          message: params.query,
          budget: params.budgetTier,
          mode: params.mode,
          providers: params.providers,
        });

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              threadId: res.id,
              jobId: res.job.id,
              status: "dispatched",
              selectedProviders: params.providers ?? [],
              budgetTier: params.budgetTier,
              estimatedDuration: params.mode === "fast" ? "10-30 seconds" : "2-5 minutes",
              message: "Research dispatched. Use research_status to check progress, then get_results when complete.",
            }),
          }],
        };
      } catch (err) {
        if (err instanceof ApiError && err.status === 402) {
          return {
            content: [{
              type: "text" as const,
              text: JSON.stringify({
                error: "INSUFFICIENT_BALANCE",
                message: (err.body as Record<string, string>)?.error ?? "Insufficient balance",
              }),
            }],
            isError: true,
          };
        }
        throw err;
      }
    },
  );
}
