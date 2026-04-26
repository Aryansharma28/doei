import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getGmailConnectionForUser } from "../../backend/gmail-sync.js";
import { getAuthenticatedSupabaseUser } from "../../backend/supabase-admin.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).end();

  try {
    const { user } = await getAuthenticatedSupabaseUser(req.headers.authorization);
    const connection = await getGmailConnectionForUser(user.id);

    res.json({
      connected: Boolean(connection),
      email: connection?.google_email || null,
      status: connection?.status || null,
    });
  } catch (err: any) {
    console.error("Gmail status error:", err);
    res.status(500).json({ error: err.message || "Failed to load Gmail status" });
  }
}
