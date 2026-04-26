import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Realistic Dutch bank transactions
const MOCK_TRANSACTIONS = [
  { date: "2026-04-01", amount: "-312.00", description: "BELASTINGDIENST INKOMSTENBELASTING", creditor: "Belastingdienst" },
  { date: "2026-03-28", amount: "-89.50",  description: "KLARNA PAYMENTS AB STOCKHOLM",        creditor: "Klarna" },
  { date: "2026-03-25", amount: "-47.20",  description: "WATERNET AMSTERDAM FACTUUR",           creditor: "Waternet" },
  { date: "2026-03-20", amount: "-156.00", description: "CJIB BOETE VERKEERSBOETE",             creditor: "CJIB" },
  { date: "2026-03-15", amount: "-234.00", description: "DUO DIENST UITVOERING ONDERWIJS",      creditor: "DUO" },
  { date: "2026-03-10", amount: "-67.80",  description: "VATTENFALL ENERGIE FACTUUR",           creditor: "Vattenfall" },
  { date: "2026-03-05", amount: "-198.00", description: "YMERE HUURACHTERSTAND MAART",          creditor: "Ymere" },
  { date: "2026-02-28", amount: "-43.50",  description: "AFTERPAY RIVERTY BETALING",            creditor: "Afterpay" },
  { date: "2026-02-20", amount: "-520.00", description: "BELASTINGDIENST TOESLAGEN TERUGVORDERING", creditor: "Belastingdienst/Toeslagen" },
  { date: "2026-02-15", amount: "-29.99",  description: "T-MOBILE NETHERLANDS FACTUUR",         creditor: "T-Mobile" },
  { date: "2026-01-30", amount: "-112.00", description: "CAK EIGEN BIJDRAGE WMO",               creditor: "CAK" },
  { date: "2026-01-15", amount: "-78.40",  description: "INCASSOBUREAU LINDORFF VORDERING",     creditor: "Lindorff Incasso" },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: `Analyze these Dutch bank transactions and identify debts. Return a JSON array.

Transactions:
${JSON.stringify(MOCK_TRANSACTIONS, null, 2)}

For each transaction return:
{
  "creditor_name": string,
  "creditor_type": one of [belasting, toeslagen, cjib, duo, gemeente, cak, zorg, energie, huur, water, telecom, hypotheek, bank, klarna, bnpl, incasso, overig],
  "amount": number (positive),
  "transaction_date": "YYYY-MM-DD",
  "description": string (short, 1 line)
}

Return only valid JSON array, no markdown.`,
      }],
    });

    let suggested: any[] = [];
    const content = msg.content[0];
    if (content.type === "text") {
      try { suggested = JSON.parse(content.text); } catch { suggested = []; }
    }

    res.json({ suggested, mock: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
