import { MCPClient } from "@mastra/mcp";

export const mcp = new MCPClient({
  servers: {
    supabase: {
      url: new URL("https://mcp.supabase.com/mcp?project_ref=YOUR_PROJECT_REF"),
      requestInit: {
        headers: {
          Authorization: `Bearer ${process.env.SUPABASE_MCP_TOKEN}`,
        },
      },
    },
  },
});
