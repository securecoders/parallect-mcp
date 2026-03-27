import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ParallectClient } from "../client.js";

interface ThreadsResponse {
  threads: Array<{
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
  }>;
  limit: number;
  offset: number;
}

export function registerListThreadsTool(server: McpServer, client: ParallectClient) {
  server.registerTool(
    "list_threads",
    {
      title: "List Threads",
      description: "List recent research threads for the authenticated user.",
      inputSchema: {
        limit: z.number().default(20).describe("Max threads to return (max 100)"),
        offset: z.number().default(0).describe("Pagination offset"),
      },
    },
    async (params) => {
      const limit = Math.min(params.limit, 100);
      const res = await client.get<ThreadsResponse>("/api/v1/threads", {
        limit: String(limit),
        offset: String(params.offset),
      });

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            threads: res.threads,
            count: res.threads.length,
            limit,
            offset: params.offset,
          }),
        }],
      };
    },
  );
}
