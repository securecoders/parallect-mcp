import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ApiError } from "../client.js";
import type { ClientFactory } from "../client.js";

interface Step {
  provider: string;
  status: string;
  providerCostCents?: number;
  durationSeconds?: number;
  reportMarkdown?: string;
}

interface SourceRegistryEntry {
  ref: string;
  url: string;
  title: string;
  domain: string;
  type: string;
}

interface ClaimSource {
  url: string;
  title: string;
  domain: string;
  type: string;
  relation: string;
}

interface Claim {
  id: string;
  content: string;
  confidence: number;
  confidenceLevel: string;
  supportingProviders: string[];
  contradictingProviders: string[];
  clusterSubject?: string;
  sources: ClaimSource[];
}

interface JobResponse {
  id: string;
  status: string;
  synthesisMarkdown?: string;
  sourceRegistry?: SourceRegistryEntry[] | null;
  suggestedFollowOns?: string[];
  totalProviderCostCents?: number;
  totalCustomerCostCents?: number;
  synthesisCostCents?: number;
  durationSeconds?: number;
  steps?: Step[];
  claims?: Claim[];
}

export function registerGetResultsTool(server: McpServer, getClient: ClientFactory) {
  server.registerTool(
    "get_results",
    {
      title: "Get Results",
      description:
        "Get the synthesized results of a completed research job. Returns the unified report with [src_N] inline citations, a sourceRegistry to resolve those citations to URLs, follow-on suggestions, and cost breakdown. Set includeClaimsJson to get first-class claims with source links and confidence scores.",
      inputSchema: {
        jobId: z.string().describe("The job ID"),
        includeProviderReports: z
          .boolean()
          .default(false)
          .describe("Include individual provider reports in addition to the synthesis."),
        includeClaimsJson: z
          .boolean()
          .default(false)
          .describe("Include first-class claims with source links, confidence scores, and provider agreement. Falls back to legacy synthesis claims for older jobs."),
      },
    },
    async (params, extra) => {
      const client = getClient(extra);
      try {
        const job = await client.get<JobResponse>(`/api/v1/jobs/${params.jobId}`, {
          include_steps: "true",
          include_claims: params.includeClaimsJson ? "true" : undefined,
          include_provider_reports: params.includeProviderReports ? "true" : undefined,
        });

        if (job.status !== "completed" && job.status !== "failed") {
          return {
            content: [{
              type: "text" as const,
              text: JSON.stringify({
                error: "JOB_NOT_COMPLETE",
                status: job.status,
                message: `Job is still ${job.status}. Use research_status to check progress.`,
              }),
            }],
            isError: true,
          };
        }

        const steps = job.steps ?? [];
        const providerCosts: Record<string, number> = {};
        const providerDurations: Record<string, number> = {};
        let providerReports: Record<string, string> | null = null;

        if (params.includeProviderReports) {
          providerReports = {};
        }

        for (const step of steps) {
          if (step.providerCostCents) providerCosts[step.provider] = step.providerCostCents;
          if (step.durationSeconds) providerDurations[step.provider] = step.durationSeconds * 1000;
          if (providerReports && step.reportMarkdown) {
            providerReports[step.provider] = step.reportMarkdown;
          }
        }

        const result: Record<string, unknown> = {
          jobId: job.id,
          status: job.status,
          synthesis: job.synthesisMarkdown,
          sourceRegistry: job.sourceRegistry ?? null,
          followOnSuggestions: job.suggestedFollowOns,
          cost: {
            totalProviderCents: job.totalProviderCostCents,
            totalCustomerCents: job.totalCustomerCostCents,
            synthesisCents: job.synthesisCostCents,
            byProvider: providerCosts,
          },
          duration: {
            totalSeconds: job.durationSeconds,
            byProvider: providerDurations,
          },
        };

        if (params.includeClaimsJson && job.claims) {
          result.claims = job.claims.map((c) => ({
            id: c.id,
            content: c.content,
            confidence: c.confidence,
            confidenceLevel: c.confidenceLevel,
            supportingProviders: c.supportingProviders,
            contradictingProviders: c.contradictingProviders,
            clusterSubject: c.clusterSubject,
            sources: c.sources.map((s) => ({
              url: s.url,
              title: s.title,
              domain: s.domain,
              type: s.type,
              relation: s.relation,
            })),
          }));
        }

        if (providerReports) {
          result.providerReports = providerReports;
        }

        return {
          content: [{ type: "text" as const, text: JSON.stringify(result) }],
        };
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ error: "JOB_NOT_FOUND" }) }],
            isError: true,
          };
        }
        throw err;
      }
    },
  );
}
