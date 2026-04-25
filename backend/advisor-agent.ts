import { anthropic } from "@ai-sdk/anthropic";
import { generateText, type CoreMessage } from "ai";

export async function runAdvisor(
  systemPrompt: string,
  messages: CoreMessage[]
): Promise<string> {
  const { text } = await generateText({
    model: anthropic("claude-sonnet-4-6"),
    system: systemPrompt,
    messages,
  });

  return text;
}
