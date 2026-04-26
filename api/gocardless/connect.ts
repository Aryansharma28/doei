import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getGCToken } from "./token.js";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { institution_id, institution_name, user_id } = req.body as {
    institution_id: string;
    institution_name: string;
    user_id: string;
  };

  if (!institution_id || !user_id) return res.status(400).json({ error: "Missing fields" });

  try {
    const token = await getGCToken();

    // Create end-user agreement
    const agrRes = await fetch("https://bankaccountdata.gocardless.com/api/v2/agreements/enduser/", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        institution_id,
        max_historical_days: 90,
        access_valid_for_days: 30,
        access_scope: ["balances", "details", "transactions"],
      }),
    });
    const agreement = await agrRes.json();

    // Redirect back to the app after bank OAuth
    const redirectUrl = `${process.env.APP_URL || "http://localhost:5173"}/app?bank_ref=`;

    // Create requisition
    const reqRes = await fetch("https://bankaccountdata.gocardless.com/api/v2/requisitions/", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        redirect: redirectUrl,
        institution_id,
        agreement: agreement.id,
        user_language: "NL",
      }),
    });
    const requisition = await reqRes.json();

    // Store pending connection in Supabase
    const { error } = await supabase.from("bank_connections").insert({
      user_id,
      institution_id,
      institution_name,
      requisition_id: requisition.id,
      status: "pending",
    });

    if (error) throw error;

    // The redirect link appended with requisition id so we can match on callback
    const link = requisition.link + "&state=" + requisition.id;

    res.json({ link, requisition_id: requisition.id });
  } catch (err: any) {
    console.error("GoCardless connect error:", err);
    res.status(500).json({ error: err.message });
  }
}
