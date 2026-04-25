import type { VercelRequest, VercelResponse } from "@vercel/node";
import { analyzeDocument } from "../../backend/document-agent.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const { fileUrl, debtContext } = req.body;
  try {
    const analysis = await analyzeDocument(fileUrl, debtContext);
    res.json({ analysis });
  } catch (err: any) {
    console.error("Document analysis error:", err);
    res.status(500).json({ error: "Failed to analyze document" });
  }
}
