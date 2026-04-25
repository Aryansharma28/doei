import type { VercelRequest, VercelResponse } from "@vercel/node";
import { runAdvisor } from "../backend/advisor-agent.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const { messages, systemPrompt } = req.body;
  try {
    const reply = await runAdvisor(systemPrompt, messages);
    res.json({ reply });
  } catch (err: any) {
    console.error("Advisor error:", err);
    res.status(500).json({ error: "Failed to process message" });
  }
}
