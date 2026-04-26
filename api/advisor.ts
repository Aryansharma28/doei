import type { VercelRequest, VercelResponse } from "@vercel/node";
import { runAdvisor } from "../backend/advisor-agent.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const { messages, systemPrompt, model } = req.body;
  try {
    const reply = await runAdvisor(systemPrompt, messages, model);
    res.json({ reply });
  } catch (err: any) {
    console.error("Advisor error:", err);
    res.status(500).json({ error: "Failed to process message" });
  }
}
