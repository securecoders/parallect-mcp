import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ParallectClient, ApiError } from "../client.js";

interface ClaimDetailResponse {
  id: string;
  content: string;
  confidence: number;
  confidenceLevel: string;
  supportingProviders: string[];
  contradictingProviders: string[];
  evidence: Array<{
    id: string;
    relation: string;
    snippet: string | null;
    relevanceScore: number | null;
    discoveredByProvider: string | null;
    source: {
      id: string;
      url: string;
      title: string;
      domain: string;
      type: string;
      doi: string | null;
    };
  }>;
  events: Array<{
    id: string;
    eventType: string;
    actorType: string;
    payload: unknown;
    createdAt: string;
  }>;
}

export function registerGetClaimEvidenceTool(server: McpServer, client: ParallectClient) {
  server.registerTool(
    "get_claim_evidence",
    {
      title: "Get Claim Evidence",
      description:
        "Get the full evidence chain for a specific claim, including all supporting sources, their URLs, snippets, and the claim's history of events.",
      inputSchema: {
        claimId: z.string().describe("The claim ID to get evidence for"),
        includeHistory: z
          .boolean()
          .default(false)
          .describe("Include the full event history for this claim"),
      },
    },
    async (params) => {
      let claim: ClaimDetailResponse;
      try {
        claim = await client.get<ClaimDetailResponse>(`/api/v1/claims/${params.claimId}`);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ error: "CLAIM_NOT_FOUND" }) }],
            isError: true,
          };
        }
        throw err;
      }

      const result: Record<string, unknown> = {
        claim: {
          id: claim.id,
          content: claim.content,
          confidence: claim.confidence,
          confidenceLevel: claim.confidenceLevel,
          supportingProviders: claim.supportingProviders,
          contradictingProviders: claim.contradictingProviders,
        },
        evidence: claim.evidence.map((e) => ({
          id: e.id,
          relation: e.relation,
          snippet: e.snippet,
          relevanceScore: e.relevanceScore,
          discoveredByProvider: e.discoveredByProvider,
          source: {
            url: e.source.url,
            title: e.source.title,
            domain: e.source.domain,
            type: e.source.type,
            doi: e.source.doi,
          },
        })),
        evidenceCount: claim.evidence.length,
      };

      if (params.includeHistory) {
        result.history = claim.events.map((e) => ({
          eventType: e.eventType,
          actorType: e.actorType,
          payload: e.payload,
          createdAt: e.createdAt,
        }));
      }

      return {
        content: [{ type: "text" as const, text: JSON.stringify(result) }],
      };
    },
  );
}
