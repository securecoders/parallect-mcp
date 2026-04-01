import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ApiError } from "../client.js";
import type { ClientFactory } from "../client.js";

interface Step {
  provider: string;
  status: string;
  durationSeconds?: number;
  startedAt?: string;
}

interface JobResponse {
  id: string;
  status: string;
  createdAt: string;
  steps?: Step[];
}

export function registerResearchStatusTool(server: McpServer, getClient: ClientFactory) {
  server.registerTool(
    "research_status",
    {
      title: "Research Status",
      description: "Check the status of a research job. Returns progress for each provider and overall job status.",
      inputSchema: {
        jobId: z.string().describe("The job ID returned by the research tool"),
      },
    },
    async (params, extra) => {
      const client = getClient(extra);
      try {
        const job = await client.get<JobResponse>(`/api/v1/jobs/${params.jobId}`, {
          include_steps: "true",
        });

        const steps = job.steps ?? [];
        const progress: Record<string, { status: string; durationSeconds?: number; startedAt?: string }> = {};
        for (const step of steps) {
          progress[step.provider] = {
            status: step.status,
            durationSeconds: step.durationSeconds ?? undefined,
            startedAt: step.startedAt,
          };
        }

        const completedCount = steps.filter((s) => s.status === "completed").length;
        const totalCount = steps.length;
        const elapsed = job.createdAt ? Date.now() - new Date(job.createdAt).getTime() : 0;

        let nextStep = "Waiting for job to start.";
        if (job.status === "running") {
          if (completedCount < totalCount) {
            nextStep = `${completedCount}/${totalCount} providers complete. Waiting for remaining providers.`;
          } else {
            nextStep = "All providers complete. Synthesis starting.";
          }
        } else if (job.status === "synthesizing") {
          nextStep = "Synthesizing results from all providers into unified report.";
        } else if (job.status === "completed") {
          nextStep = "Complete. Use get_results to retrieve the synthesized report.";
        } else if (job.status === "failed") {
          nextStep = "Job failed. Check error details.";
        }

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              jobId: job.id,
              status: job.status,
              progress,
              providersComplete: completedCount,
              providersTotal: totalCount,
              elapsedMs: elapsed,
              nextStep,
            }),
          }],
        };
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ error: "JOB_NOT_FOUND", message: "Job not found" }) }],
            isError: true,
          };
        }
        throw err;
      }
    },
  );
}
