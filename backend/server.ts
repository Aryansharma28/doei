import express from "express";
import cors from "cors";
import { runAdvisor } from "./advisor-agent.js";
import { analyzeDocument } from "./document-agent.js";

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.post("/api/advisor", async (req, res) => {
  const { messages, systemPrompt, model } = req.body;
  try {
    const reply = await runAdvisor(systemPrompt, messages, model);
    res.json({ reply });
  } catch (err: any) {
    console.error("Advisor error:", err);
    res.status(500).json({ error: "Failed to process message" });
  }
});

app.post("/api/document/analyze", async (req, res) => {
  const { fileUrl, debtContext } = req.body;
  try {
    const analysis = await analyzeDocument(fileUrl, debtContext);
    res.json({ analysis });
  } catch (err: any) {
    console.error("Document analysis error:", err);
    res.status(500).json({ error: "Failed to analyze document" });
  }
});

const PORT = Number(process.env.PORT ?? 3001);
app.listen(PORT, "0.0.0.0", () => process.stdout.write(`Mastra backend on :${PORT}\n`));
