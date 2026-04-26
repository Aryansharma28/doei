import type { VercelRequest, VercelResponse } from "@vercel/node";
import { AccessToken } from "livekit-server-sdk";
import { getAuthenticatedSupabaseUser } from "../../backend/supabase-admin.js";

// Mints a LiveKit room access token for an authenticated Supabase user.
// The user's financial snapshot (debts/income — currently in localStorage on
// the client) and language preference are embedded in the participant
// metadata so the agent can read them on connect without a second round trip.
//
// Body shape (POST):
//   {
//     debts: VoiceDebt[],
//     income: VoiceIncome[],
//     lang: "nl" | "en",
//     firstName?: string
//   }
//
// Auth: Supabase access token in Authorization: Bearer <jwt>.

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const livekitUrl = process.env.LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!livekitUrl || !apiKey || !apiSecret) {
    return res.status(500).json({ error: "LiveKit env vars not configured" });
  }

  let user;
  try {
    const auth = await getAuthenticatedSupabaseUser(req.headers.authorization);
    user = auth.user;
  } catch (err: any) {
    return res.status(401).json({ error: err.message ?? "Unauthorized" });
  }

  const { debts = [], income = [], lang = "en", firstName } = req.body ?? {};
  if (lang !== "nl" && lang !== "en") {
    return res.status(400).json({ error: "lang must be 'nl' or 'en'" });
  }

  const roomName = `advisor-${user.id}-${Date.now()}`;
  const metadata = JSON.stringify({
    user_id: user.id,
    lang,
    firstName: firstName ?? null,
    debts,
    income,
  });

  const at = new AccessToken(apiKey, apiSecret, {
    identity: user.id,
    metadata,
    ttl: 60 * 60, // 1 hour
  });
  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
  });

  const token = await at.toJwt();
  res.json({ token, url: livekitUrl, room: roomName });
}
