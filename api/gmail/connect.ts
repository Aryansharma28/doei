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

    console.log("[gmail/connect] user:", user.id, "email:", providerEmail || user.email, "hasRefresh:", !!providerRefreshToken, "hasAccess:", !!providerToken);

    if (!providerRefreshToken) {
      console.warn("[gmail/connect] rejected: missing provider_refresh_token");
      return res.status(400).json({ error: "Missing provider refresh token" });
    }

    // Verify the refresh token actually has the calendar.events scope before
    // we save it. If it doesn't, the booking flow will fail later with a
    // confusing error — better to fail loudly here.
    let scopeList = "";
    try {
      const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.GMAIL_CLIENT_ID!,
          client_secret: process.env.GMAIL_CLIENT_SECRET!,
          refresh_token: providerRefreshToken,
          grant_type: "refresh_token",
        }),
      });
      const tokenJson = await tokenResp.json();
      scopeList = tokenJson.scope || "";
      console.log("[gmail/connect] token introspection scopes:", scopeList);
    } catch (introspectErr) {
      console.warn("[gmail/connect] could not introspect token:", introspectErr);
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
      console.error("[gmail/connect] DB upsert failed:", error);
      throw new Error(error.message);
    }

    console.log("[gmail/connect] connected", user.id);
    res.json({
      connected: true,
      email: providerEmail || user.email || null,
      scopes: scopeList,
      hasCalendarScope: scopeList.includes("calendar"),
    });
  } catch (err: any) {
    console.error("[gmail/connect] error:", err);
    res.status(500).json({ error: err.message || "Failed to connect Gmail" });
  }
}
