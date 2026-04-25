import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { mcp } from "./mcp.js";

export async function analyzeDocument(
  fileUrl: string,
  debtContext: string
): Promise<string> {
  const tools = await mcp.listTools();

  const { text } = await generateText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: `You are a document analyzer for Dutch debt-related documents. Extract key information and summarize in plain language. ${debtContext}`,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", image: new URL(fileUrl) },
          {
            type: "text",
            text: "Analyze this document. Extract: sender, amount owed, due date, required next steps, and any deadlines. Keep it brief and in plain language.",
          },
        ],
      },
    ],
    tools,
    maxSteps: 2,
  });

  return text;
}
