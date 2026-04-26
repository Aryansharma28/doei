import type { VercelRequest, VercelResponse } from "@vercel/node";
import { hasGmailOAuthConfig } from "../../backend/mcp.js";
import {
  getAuthenticatedSupabaseUser,
  supabaseAdmin,
} from "../../backend/supabase-admin.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();

  if (!hasGmailOAuthConfig) {
    return res.status(500).json({ error: "Gmail OAuth app credentials are not configured" });
  }

  if (!supabaseAdmin) {
    return res.status(500).json({ error: "Supabase admin is not configured" });
  }

  try {
    const { user } = await getAuthenticatedSupabaseUser(req.headers.authorization);
    const { providerRefreshToken, providerToken, providerEmail } = req.body as {
      providerRefreshToken?: string;
      providerToken?: string | null;
      providerEmail?: string | null;
    };

    if (!providerRefreshToken) {
      return res.status(400).json({ error: "Missing provider refresh token" });
    }

    const { error } = await supabaseAdmin.from("gmail_connections").upsert(
      {
        user_id: user.id,
        google_email: providerEmail || user.email || null,
        refresh_token: providerRefreshToken,
        access_token: providerToken || null,
        status: "connected",
        last_error: null,
      },
      { onConflict: "user_id" }
    );

    if (error) {
      throw new Error(error.message);
    }

    res.json({
      connected: true,
      email: providerEmail || user.email || null,
    });
  } catch (err: any) {
    console.error("Gmail connect error:", err);
    res.status(500).json({ error: err.message || "Failed to connect Gmail" });
  }
}
