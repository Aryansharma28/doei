import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  getAuthenticatedSupabaseUser,
  supabaseAdmin,
} from "../../backend/supabase-admin.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();

  if (!supabaseAdmin) {
    return res.status(500).json({ error: "Supabase admin is not configured" });
  }

  try {
    const { user } = await getAuthenticatedSupabaseUser(req.headers.authorization);

    const { error } = await supabaseAdmin
      .from("gmail_connections")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      throw new Error(error.message);
    }

    res.json({ connected: false });
  } catch (err: any) {
    console.error("Gmail disconnect error:", err);
    res.status(500).json({ error: err.message || "Failed to disconnect Gmail" });
  }
}
