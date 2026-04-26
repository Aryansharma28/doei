import type { VercelRequest, VercelResponse } from "@vercel/node";
import { syncDebtEmails } from "../../backend/gmail-sync.js";
import { hasGmailMcpConfig } from "../../backend/mcp.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();

  if (!hasGmailMcpConfig) {
    return res.status(500).json({
      error: "Gmail MCP is not configured",
    });
  }

  const { user_id, query, maxResults } = req.body as {
    user_id?: string;
    query?: string;
    maxResults?: number;
  };

  try {
    const result = await syncDebtEmails({
      userId: user_id,
      query,
      maxResults,
    });

    res.json(result);
  } catch (err: any) {
    console.error("Gmail sync error:", err);
    res.status(500).json({ error: err.message || "Failed to sync Gmail" });
  }
}
