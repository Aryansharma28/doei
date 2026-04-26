import type { VercelRequest, VercelResponse } from "@vercel/node";
import { syncGmailForUser } from "../../backend/gmail-sync.js";
import { getAuthenticatedSupabaseUser } from "../../backend/supabase-admin.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { user } = await getAuthenticatedSupabaseUser(req.headers.authorization);
    const { query, maxResults } = req.body as {
      query?: string;
      maxResults?: number;
    };

    const result = await syncGmailForUser(user.id, {
      query,
      maxResults,
    });

    res.json(result);
  } catch (err: any) {
    console.error("Gmail sync error:", err);
    res.status(500).json({ error: err.message || "Failed to sync Gmail" });
  }
}
