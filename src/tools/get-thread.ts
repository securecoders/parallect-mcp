import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ApiError } from "../client.js";
import type { ClientFactory } from "../client.js";

interface ThreadResponse {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Array<{
    id: string;
    role: string;
    content: string;
    costCents: number | null;
    createdAt: string;
  }>;
  jobs: Array<{
    id: string;
    status: string;
    budgetTier: string;
    query: string;
    totalCustomerCostCents: number | null;
    durationSeconds: number | null;
    createdAt: string;
    completedAt: string | null;
  }>;
}

interface JobResponse {
  steps?: Array<{
    id: string;
    provider: string;
    status: string;
    providerCostCents: number | null;
    durationSeconds: number | null;
  }>;
}

export function registerGetThreadTool(server: McpServer, getClient: ClientFactory) {
  server.registerTool(
    "get_thread",
    {
      title: "Get Thread",
      description: "Get a specific research thread with all messages, jobs, and results.",
      inputSchema: {
        threadId: z.string().describe("Thread ID"),
      },
    },
    async (params, extra) => {
      const client = getClient(extra);
      let thread: ThreadResponse;
      try {
        thread = await client.get<ThreadResponse>(`/api/v1/threads/${params.threadId}`);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ error: "THREAD_NOT_FOUND" }) }],
            isError: true,
          };
        }
        throw err;
      }

      let steps: Array<{ id: string; provider: string; status: string; providerCostCents: number | null; durationSeconds: number | null }> = [];
      if (thread.jobs.length > 0) {
        try {
          const latestJob = await client.get<JobResponse>(`/api/v1/jobs/${thread.jobs[0].id}`, {
            include_steps: "true",
          });
          steps = latestJob.steps ?? [];
        } catch {
          // Steps are best-effort; don't fail the whole request
        }
      }

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            id: thread.id,
            title: thread.title,
            createdAt: thread.createdAt,
            messages: thread.messages,
            jobs: thread.jobs.map((j) => ({
              id: j.id,
              status: j.status,
              budgetTier: j.budgetTier,
              query: j.query,
              totalCustomerCostCents: j.totalCustomerCostCents,
              durationSeconds: j.durationSeconds,
              createdAt: j.createdAt,
              completedAt: j.completedAt,
            })),
            steps: steps.map((s) => ({
              id: s.id,
              provider: s.provider,
              status: s.status,
              providerCostCents: s.providerCostCents,
              durationSeconds: s.durationSeconds,
            })),
          }),
        }],
      };
    },
  );
}
