import "dotenv/config";
import { fileURLToPath } from "node:url";
import { MCPClient } from "@mastra/mcp";

const supabaseToken = process.env.SUPABASE_MCP_TOKEN;

export const mcp = new MCPClient({
  servers: {
    ...(supabaseToken
      ? {
          supabase: {
            url: new URL("https://mcp.supabase.com/mcp?project_ref=kvsbclenpxdsldieyege"),
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

export const hasGmailMcpConfig = Boolean(
  process.env.GMAIL_CLIENT_ID &&
    process.env.GMAIL_CLIENT_SECRET &&
    process.env.GMAIL_REFRESH_TOKEN
);

export const gmailMcp = hasGmailMcpConfig
  ? new MCPClient({
      id: "gmail-mcp",
      servers: {
        gmail: {
          command: "node",
          args: [gmailServerPath],
          env: {
            GMAIL_CLIENT_ID: process.env.GMAIL_CLIENT_ID!,
            GMAIL_CLIENT_SECRET: process.env.GMAIL_CLIENT_SECRET!,
            GMAIL_REFRESH_TOKEN: process.env.GMAIL_REFRESH_TOKEN!,
          },
        },
      },
    })
  : null;
