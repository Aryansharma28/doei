import type { VercelRequest, VercelResponse } from "@vercel/node";
import { syncAllGmailConnections } from "../../backend/gmail-sync.js";

function isAuthorized(req: VercelRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return true;
  }

  return req.headers.authorization === `Bearer ${secret}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).end();
  if (!isAuthorized(req)) return res.status(401).json({ error: "Unauthorized" });

  try {
    const result = await syncAllGmailConnections({
      query: process.env.GMAIL_MCP_QUERY,
    });

    res.json({
      ok: true,
      checkedAt: new Date().toISOString(),
      connections: result.connections,
      matched: result.matched,
      stored: result.stored,
    });
  } catch (err: any) {
    console.error("Gmail cron sync error:", err);
    res.status(500).json({ error: err.message || "Failed to run Gmail cron sync" });
  }
}
