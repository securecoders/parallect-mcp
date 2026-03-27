import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ParallectClient } from "../client.js";

interface ClaimsResponse {
  claims: Array<{
    id: string;
    content: string;
    confidence: number;
    confidenceLevel: string;
    supportingProviders: string[];
    contradictingProviders: string[];
    jobId?: string;
    createdAt: string;
  }>;
  total: number;
}

export function registerSearchClaimsTool(server: McpServer, client: ParallectClient) {
  server.registerTool(
    "search_claims",
    {
      title: "Search Claims",
      description:
        "Search for claims across research jobs. Can search by text content, filter by confidence level, or list all claims for a thread.",
      inputSchema: {
        threadId: z.string().optional().describe("Filter claims by thread ID"),
        jobId: z.string().optional().describe("Filter claims by job ID"),
        query: z.string().optional().describe("Text search within claim content"),
        confidenceLevel: z
          .enum(["high", "medium", "low"])
          .optional()
          .describe("Filter by confidence level"),
        limit: z.number().min(1).max(100).default(20).describe("Max results"),
      },
    },
    async (params) => {
      if (!params.threadId && !params.jobId) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              error: "MISSING_FILTER",
              message: "Provide threadId, jobId, or query to search claims",
            }),
          }],
          isError: true,
        };
      }

      try {
        const res = await client.get<ClaimsResponse>("/api/v1/claims", {
          threadId: params.threadId,
          jobId: params.jobId,
          query: params.query,
          confidence_level: params.confidenceLevel,
          limit: String(params.limit),
        });

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              claims: res.claims,
              total: res.total,
            }),
          }],
        };
      } catch (err) {
        if (err instanceof Error && "status" in err) {
          const apiErr = err as { status: number };
          if (apiErr.status === 404) {
            return {
              content: [{ type: "text" as const, text: JSON.stringify({ error: "JOB_NOT_FOUND" }) }],
              isError: true,
            };
          }
        }
        throw err;
      }
    },
  );
}
