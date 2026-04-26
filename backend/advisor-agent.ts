import { anthropic } from "@ai-sdk/anthropic";
import { generateText, type CoreMessage } from "ai";

const ALLOWED_MODELS = new Set([
  "claude-sonnet-4-6",
  "claude-haiku-4-5",
  "claude-haiku-4-5-20251001",
  "claude-opus-4-7",
]);

export async function runAdvisor(
  systemPrompt: string,
  messages: CoreMessage[],
  model: string = "claude-sonnet-4-6"
): Promise<string> {
  const safeModel = ALLOWED_MODELS.has(model) ? model : "claude-sonnet-4-6";
  const { text } = await generateText({
    model: anthropic(safeModel),
    system: systemPrompt,
    messages,
    maxTokens: 500,
  });

  return text;
}
