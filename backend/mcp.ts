import "dotenv/config";
import { fileURLToPath } from "node:url";
import { MCPClient } from "@mastra/mcp";

const supabaseToken = process.env.SUPABASE_MCP_TOKEN;
const supabaseProjectRef = process.env.SUPABASE_PROJECT_REF;

export const mcp = new MCPClient({
  servers: {
    ...(supabaseToken && supabaseProjectRef
      ? {
          supabase: {
            url: new URL(
              `https://mcp.supabase.com/mcp?project_ref=${supabaseProjectRef}`
            ),
            requestInit: {
              headers: {
                Authorization: `Bearer ${supabaseToken}`,
              },
            },
          },
        }
      : {}),
  },
});

const gmailServerPath = fileURLToPath(
  new URL("../node_modules/@cablate/mcp-gmail/dist/index.cjs", import.meta.url)
);

export const hasGmailOAuthConfig = Boolean(
  process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET
);

export function createGmailMcpClient(refreshToken: string) {
  if (!hasGmailOAuthConfig) {
    throw new Error("Gmail OAuth app credentials are not configured");
  }

  return new MCPClient({
    id: `gmail-mcp-${refreshToken.slice(0, 8)}`,
    servers: {
      gmail: {
        command: "node",
        args: [gmailServerPath],
        env: {
          GMAIL_CLIENT_ID: process.env.GMAIL_CLIENT_ID!,
          GMAIL_CLIENT_SECRET: process.env.GMAIL_CLIENT_SECRET!,
          GMAIL_REFRESH_TOKEN: refreshToken,
        },
      },
    },
  });
}
