import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ParallectClient, ApiError } from "../client.js";

interface JobResponse {
  id: string;
  threadId: string;
  budgetTier: string;
  suggestedFollowOns?: string[];
}

interface PursueResponse {
  id: string;
  threadId: string;
  parentJobId: string;
  topic: string;
  status: string;
  budgetTier: string;
}

export function registerFollowUpTool(server: McpServer, client: ParallectClient) {
  server.registerTool(
    "follow_up",
    {
      title: "Follow Up",
      description:
        "Pursue a follow-on research question from a completed job's suggestions, or ask a custom follow-up in the same thread.",
      inputSchema: {
        jobId: z.string().describe("The completed job ID that generated follow-on suggestions"),
        topicIndex: z
          .number()
          .optional()
          .describe("0-based index of the suggested follow-on to pursue"),
        customQuery: z
          .string()
          .optional()
          .describe("Custom follow-up query. Overrides topicIndex if both provided."),
        budgetTier: z
          .enum(["XXS", "XS", "S", "M", "L", "XL"])
          .optional()
          .describe("Budget tier for this follow-up. Defaults to same tier as parent job."),
      },
    },
    async (params) => {
      let parentJob: JobResponse;
      try {
        parentJob = await client.get<JobResponse>(`/api/v1/jobs/${params.jobId}`, {
          include_steps: "false",
        });
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ error: "JOB_NOT_FOUND" }) }],
            isError: true,
          };
        }
        throw err;
      }

      let query = params.customQuery;
      if (!query) {
        const suggestions = parentJob.suggestedFollowOns ?? [];
        const idx = params.topicIndex ?? 0;
        if (idx >= suggestions.length) {
          return {
            content: [{
              type: "text" as const,
              text: JSON.stringify({
                error: "INVALID_TOPIC",
                message: "No follow-on suggestion at that index. Provide a customQuery instead.",
                availableSuggestions: suggestions,
              }),
            }],
            isError: true,
          };
        }
        query = suggestions[idx];
      }

      const budgetTier = params.budgetTier ?? parentJob.budgetTier ?? "M";

      try {
        const res = await client.post<PursueResponse>(
          `/api/v1/threads/${parentJob.threadId}/jobs/${params.jobId}/pursue`,
          { topic: query, budget: budgetTier },
        );

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              threadId: res.threadId,
              jobId: res.id,
              parentJobId: res.parentJobId,
              query,
              status: "dispatched",
              budgetTier,
              message: "Follow-up research dispatched. Use research_status to check progress.",
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
