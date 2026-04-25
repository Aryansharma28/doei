import { describe, it, expect } from "vitest";
import scenario, {
  AgentAdapter,
  AgentRole,
  type AgentInput,
  judgeAgent,
  userSimulatorAgent,
} from "@langwatch/scenario";
import { anthropic } from "@ai-sdk/anthropic";

const DEMO_SYSTEM_PROMPT = `You are a friendly financial helper for someone in the Netherlands dealing with debt. You speak English.

You know their exact situation:

Total debt: €25029 across 11 debts. Monthly income: €2564.

Their debts:
- Belastingdienst (tax): €2340, stage: aanmaning, due: 2026-05-10
- CJIB (fine): €490, stage: incasso, due: 2026-05-03
- Zilveren Kruis (health insurance): €876, stage: herinnering, due: 2026-05-18
- Vattenfall (energy): €1240, stage: incasso, due: 2026-04-28
- Gemeente Amsterdam (municipality): €650, stage: factuur, due: 2026-06-01
- Belastingdienst/Toeslagen (benefits): €1820, stage: herinnering, due: 2026-05-25
- Ymere (rent): €430, stage: aanmaning, due: 2026-05-01
- DUO (student loan): €16400, stage: factuur, due: 2026-07-01
- CAK (care contribution): €320, stage: herinnering, due: 2026-05-15
- Klarna (BNPL): €285, stage: aanmaning, due: 2026-05-05
- Riverty/Afterpay (BNPL): €178, stage: herinnering, due: 2026-05-12

Their income:
- Salaris: €2180/month (day 25)
- Zorgtoeslag: €154/month (day 20)
- Huurtoeslag: €230/month (day 20)

HOW TO RESPOND — THIS IS CRITICAL:
- Write like you're texting a friend. Short sentences. Simple words. No jargon.
- NEVER use markdown formatting. No **bold**, no headers, no ---, no bullet points, no numbered lists.
- Just write plain paragraphs. Keep them short — 2-3 sentences each.
- Use line breaks between paragraphs for readability.
- Talk about their actual debts by name and amount. Be specific.
- Total response should be 6-10 sentences max.
- Be warm and encouraging. No doom.
- When relevant, mention that their gemeente can help with free debt counseling (schuldhulpverlening).
- End with one simple question to keep the conversation going.`;

class AdvisorAgent extends AgentAdapter {
  role = AgentRole.AGENT;

  async call({ messages }: AgentInput): Promise<string> {
    // Only pass user/assistant turns — strip system, tool, or scenario-internal messages
    const chatMessages = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
      }));

    const res = await fetch("http://localhost:3001/api/advisor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ systemPrompt: DEMO_SYSTEM_PROMPT, messages: chatMessages }),
    });
    if (!res.ok) throw new Error(`Backend error ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as { reply?: string; error?: string };
    if (data.error) throw new Error(data.error);
    return data.reply!;
  }
}

const model = anthropic("claude-haiku-4-5-20251001");

const advisor = new AdvisorAgent();
const user = userSimulatorAgent({ model });
const judge = judgeAgent({ model });

describe("Debt Advisor", () => {
  it("identifies the most urgent debts when user is overwhelmed", async () => {
    const result = await scenario.run({
      name: "Urgent debt — user asks what to tackle first",
      description: "User is overwhelmed and needs to know which debt is most urgent",
      agents: [advisor, user, judge],
      script: [
        scenario.user({
          situation:
            "You are a 34-year-old in Amsterdam, anxious and overwhelmed with 11 debts. Several are in collections. You just opened a pile of letters and feel paralyzed. Ask which debt is most urgent and what to do TODAY. You speak English. You are not financially literate.",
        }),
        scenario.agent(),
        scenario.judge({
          criteria: [
            "Agent identifies the most time-sensitive or legally risky debts (e.g., CJIB in incasso, Vattenfall overdue) rather than just the largest debt",
            "Agent does not use Dutch legal jargon without explaining it",
            "Agent gives a concrete first action the user can take today",
            "Agent is warm and does not add to the user's panic",
          ],
        }),
      ],
    });

    if (!result.success) console.error("JUDGE:", result.reasoning);
    expect(result.success).toBe(true);
  }, 60_000);

  it("explains payment arrangements with actionable steps", async () => {
    const result = await scenario.run({
      name: "User asks about setting up a payment arrangement",
      description: "User needs help requesting a betalingsregeling from Vattenfall",
      agents: [advisor, user, judge],
      script: [
        scenario.user({
          situation:
            "You received a second reminder from Vattenfall for €1240. You've heard you can ask for a payment arrangement (betalingsregeling) but don't know how. You want step-by-step help on how to contact them and what to say.",
        }),
        scenario.agent(),
        scenario.agent(),
        scenario.judge({
          criteria: [
            "Agent explains what a betalingsregeling is in plain language",
            "Agent gives actionable steps for how to contact the creditor",
            "Agent does not just say 'contact the creditor' without explaining what to say",
            "Agent acknowledges the user's stress empathetically",
          ],
        }),
      ],
    });

    if (!result.success) console.error("JUDGE:", result.reasoning);
    expect(result.success).toBe(true);
  }, 60_000);

  it("explains income protection (beslagvrije voet) clearly", async () => {
    const result = await scenario.run({
      name: "User asks about income protection",
      description: "User panicking about wage garnishment from CJIB",
      agents: [advisor, user, judge],
      script: [
        scenario.user({
          situation:
            "You received a wage garnishment notice from the CJIB. You are panicking because you think your entire salary will be seized. Ask how much money you are guaranteed to keep.",
        }),
        scenario.agent(),
        scenario.judge({
          criteria: [
            "Agent explains beslagvrije voet in plain language (the protected minimum income)",
            "Agent reassures the user they will always keep a protected portion of their income",
            "Agent does not give a specific euro amount without noting it depends on personal situation",
          ],
        }),
      ],
    });

    if (!result.success) console.error("JUDGE:", result.reasoning);
    expect(result.success).toBe(true);
  }, 60_000);

  it("informs about free municipal debt counseling", async () => {
    const result = await scenario.run({
      name: "User asks about free debt help from municipality",
      description: "Exhausted user wants to know if free government help exists",
      agents: [advisor, user, judge],
      script: [
        scenario.user({
          situation:
            "You are a 28-year-old single parent who has been managing debts alone for two years and is exhausted. You've heard there might be free help from the government. Ask if you qualify and what the process looks like.",
        }),
        scenario.agent(),
        scenario.judge({
          criteria: [
            "Agent mentions schuldhulpverlening by name and explains it is free",
            "Agent explains that the gemeente (municipality) is the right place to start",
            "Agent is encouraging and normalizes asking for help",
          ],
        }),
      ],
    });

    if (!result.success) console.error("JUDGE:", result.reasoning);
    expect(result.success).toBe(true);
  }, 60_000);

  it("responds to crisis with empathy before advice", async () => {
    const result = await scenario.run({
      name: "User in crisis — wants to ignore everything",
      description: "Burned-out user needs emotional grounding before practical steps",
      agents: [advisor, user, judge],
      script: [
        scenario.user({
          situation:
            "You are emotionally overwhelmed and want to stop opening mail and ignore all your debts. You feel hopeless. Express that you want to give up. You need emotional grounding before any practical advice.",
        }),
        scenario.agent(),
        scenario.judge({
          criteria: [
            "Agent responds to the emotional state first before giving practical advice",
            "Agent validates that the situation is hard without being dismissive",
            "Agent mentions at least one small, manageable step rather than overwhelming the user",
            "Agent mentions professional support is available (schuldhulpverlening)",
          ],
        }),
      ],
    });

    if (!result.success) console.error("JUDGE:", result.reasoning);
    expect(result.success).toBe(true);
  }, 60_000);

  it("responds in Dutch when user writes in Dutch", async () => {
    const result = await scenario.run({
      name: "Dutch-speaking user — advisor responds in Dutch",
      description: "User communicates in Dutch, advisor must respond in Dutch",
      agents: [advisor, user, judge],
      script: [
        scenario.user({
          situation:
            "Je bent een 45-jarige man die in het Nederlands wil communiceren. Je hebt een schuld bij Klarna van €285 en een aanmaning ontvangen. Vraag wat er gebeurt als je niet betaalt. Praat alleen in het Nederlands.",
        }),
        scenario.agent(),
        scenario.judge({
          criteria: [
            "Agent responds entirely in Dutch throughout the conversation",
            "Agent explains consequences of non-payment in plain Dutch without unexplained jargon",
          ],
        }),
      ],
    });

    if (!result.success) console.error("JUDGE:", result.reasoning);
    expect(result.success).toBe(true);
  }, 60_000);
});
