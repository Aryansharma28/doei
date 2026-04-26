import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getGCToken } from "./token.js";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { requisition_id, user_id } = req.body as { requisition_id: string; user_id: string };
  if (!requisition_id || !user_id) return res.status(400).json({ error: "Missing fields" });

  try {
    const token = await getGCToken();

    // Get accounts from requisition
    const reqRes = await fetch(
      `https://bankaccountdata.gocardless.com/api/v2/requisitions/${requisition_id}/`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const requisition = await reqRes.json();
    const accounts: string[] = requisition.accounts || [];

    // Update connection status + store account IDs
    await supabase
      .from("bank_connections")
      .update({ status: "connected", accounts })
      .eq("requisition_id", requisition_id)
      .eq("user_id", user_id);

    // Fetch transactions from all accounts
    const allTransactions: any[] = [];
    for (const accountId of accounts) {
      const txRes = await fetch(
        `https://bankaccountdata.gocardless.com/api/v2/accounts/${accountId}/transactions/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const txData = await txRes.json();
      const booked = txData.transactions?.booked || [];
      allTransactions.push(...booked);
    }

    if (allTransactions.length === 0) {
      return res.json({ suggested: [] });
    }

    // Ask Claude to identify debt-related transactions
    const txSample = allTransactions.slice(0, 150).map(tx => ({
      date: tx.bookingDate,
      amount: tx.transactionAmount?.amount,
      currency: tx.transactionAmount?.currency,
      description: tx.remittanceInformationUnstructured || tx.creditorName || tx.debtorName || "",
      creditor: tx.creditorName || "",
    }));

    const msg = await anthropic.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 2048,
      messages: [{
        role: "user",
        content: `You are analyzing Dutch bank transactions to find debt repayments, collections, or overdue payments.

Transactions:
${JSON.stringify(txSample, null, 2)}

Identify transactions that look like: debt repayments, incasso (collection) debits, overdue bill payments, CJIB fines, belastingdienst payments, DUO loan repayments, Klarna/BNPL payments, or similar.

Return a JSON array of objects with:
{
  "creditor_name": string,
  "creditor_type": one of [belasting, toeslagen, cjib, duo, gemeente, cak, zorg, energie, huur, water, telecom, hypotheek, bank, klarna, bnpl, incasso, overig],
  "amount": number (positive),
  "transaction_date": "YYYY-MM-DD",
  "description": string (1 line summary)
}

Only include debts (negative balance / money leaving the account toward a creditor). Return [] if none found. Return only valid JSON array, no markdown.`,
      }],
    });

    let suggested: any[] = [];
    try {
      const content = msg.content[0];
      if (content.type === "text") {
        suggested = JSON.parse(content.text);
      }
    } catch {
      suggested = [];
    }

    // Store suggested debts in Supabase
    if (suggested.length > 0) {
      const { data: connection } = await supabase
        .from("bank_connections")
        .select("id")
        .eq("requisition_id", requisition_id)
        .single();

      if (connection) {
        await supabase.from("suggested_debts").insert(
          suggested.map(s => ({
            user_id,
            bank_connection_id: connection.id,
            creditor_name: s.creditor_name,
            creditor_type: s.creditor_type,
            amount: Math.abs(s.amount),
            original_amount: Math.abs(s.amount),
            transaction_date: s.transaction_date,
            description: s.description,
            status: "pending",
          }))
        );
      }
    }

    res.json({ suggested });
  } catch (err: any) {
    console.error("GoCardless sync error:", err);
    res.status(500).json({ error: err.message });
  }
}
