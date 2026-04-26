import { anthropic } from "@ai-sdk/anthropic";
import { createClient } from "@supabase/supabase-js";
import { generateText } from "ai";
import { gmailMcp, hasGmailMcpConfig } from "./mcp.js";

const CREDITOR_TYPES = new Set([
  "belasting",
  "toeslagen",
  "cjib",
  "duo",
  "gemeente",
  "cak",
  "zorg",
  "energie",
  "huur",
  "water",
  "telecom",
  "hypotheek",
  "bank",
  "klarna",
  "bnpl",
  "incasso",
  "overig",
]);

type RawSuggestion = {
  email_id?: unknown;
  subject?: unknown;
  sender?: unknown;
  creditor_name?: unknown;
  creditor_type?: unknown;
  amount?: unknown;
  transaction_date?: unknown;
  description?: unknown;
};

export type GmailSuggestedDebt = {
  email_id: string;
  subject: string;
  sender: string;
  creditor_name: string;
  creditor_type: string;
  amount: number;
  transaction_date: string;
  description: string;
};

export type GmailSyncResult = {
  suggested: GmailSuggestedDebt[];
  stored: number;
};

function stripMarkdownFence(text: string) {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function normalizeDate(value: unknown) {
  if (typeof value === "string" && isIsoDate(value)) {
    return value;
  }

  return new Date().toISOString().slice(0, 10);
}

function normalizeSuggestion(item: RawSuggestion, index: number): GmailSuggestedDebt | null {
  const creditorName =
    typeof item.creditor_name === "string" && item.creditor_name.trim()
      ? item.creditor_name.trim()
      : null;

  if (!creditorName) {
    return null;
  }

  const creditorType =
    typeof item.creditor_type === "string" && CREDITOR_TYPES.has(item.creditor_type)
      ? item.creditor_type
      : "overig";

  const amount =
    typeof item.amount === "number"
      ? Math.abs(item.amount)
      : typeof item.amount === "string" && item.amount.trim()
      ? Math.abs(Number(item.amount))
      : 0;

  const subject =
    typeof item.subject === "string" && item.subject.trim()
      ? item.subject.trim()
      : `Debt-related email ${index + 1}`;

  const sender =
    typeof item.sender === "string" && item.sender.trim()
      ? item.sender.trim()
      : "unknown";

  const description =
    typeof item.description === "string" && item.description.trim()
      ? item.description.trim()
      : `Gmail: ${subject}`;

  const emailId =
    typeof item.email_id === "string" && item.email_id.trim()
      ? item.email_id.trim()
      : `gmail-${normalizeDate(item.transaction_date)}-${index}`;

  return {
    email_id: emailId,
    subject,
    sender,
    creditor_name: creditorName,
    creditor_type: creditorType,
    amount: Number.isFinite(amount) ? amount : 0,
    transaction_date: normalizeDate(item.transaction_date),
    description: description.slice(0, 240),
  };
}

function parseSuggestions(text: string) {
  const cleaned = stripMarkdownFence(text);
  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) {
    throw new Error("Gmail sync did not return a JSON array");
  }

  return parsed
    .map((item, index) => normalizeSuggestion(item as RawSuggestion, index))
    .filter((item): item is GmailSuggestedDebt => Boolean(item));
}

async function analyzeDebtEmails(query: string, maxResults: number) {
  if (!gmailMcp || !hasGmailMcpConfig) {
    throw new Error("Gmail MCP credentials are not configured");
  }

  const tools = await gmailMcp.listTools();
  const { text } = await generateText({
    model: anthropic("claude-sonnet-4-6"),
    system: `You classify Gmail messages for a debt-management app.

Use the Gmail tools to search only the mailbox messages relevant to the query you are given.

Return ONLY a valid JSON array. Each item must have:
- email_id: Gmail message id if available
- subject: message subject
- sender: sender name or email
- creditor_name: the creditor or collection agency
- creditor_type: one of belasting, toeslagen, cjib, duo, gemeente, cak, zorg, energie, huur, water, telecom, hypotheek, bank, klarna, bnpl, incasso, overig
- amount: numeric amount owed if explicit, otherwise 0
- transaction_date: YYYY-MM-DD; use due date if explicit, otherwise the email date
- description: one short sentence explaining why the email matters

Only include emails that are clearly debt-related, overdue payment reminders, collection notices, BNPL reminders, rent/utilities arrears, government repayment notices, or fines.
Exclude marketing, newsletters, payment confirmations for already-paid orders, and unrelated support emails.`,
    prompt: `Search Gmail for debt-related emails using the query "${query}". Review up to ${maxResults} recent results and return the JSON array only.`,
    tools,
    maxSteps: 5,
  });

  return parseSuggestions(text);
}

async function storeSuggestions(userId: string | undefined, suggested: GmailSuggestedDebt[]) {
  if (!userId || suggested.length === 0) {
    return 0;
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return 0;
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const descriptions = suggested.map((item) => `[gmail:${item.email_id}] ${item.description}`);
  const { data: existing, error: existingError } = await supabase
    .from("suggested_debts")
    .select("description")
    .eq("user_id", userId)
    .in("description", descriptions);

  if (existingError) {
    console.error("Gmail sync duplicate check failed:", existingError);
    return 0;
  }

  const existingDescriptions = new Set((existing ?? []).map((item) => item.description));
  const rows = suggested
    .filter((item) => !existingDescriptions.has(`[gmail:${item.email_id}] ${item.description}`))
    .map((item) => ({
      user_id: userId,
      creditor_name: item.creditor_name,
      creditor_type: item.creditor_type,
      amount: item.amount,
      original_amount: item.amount,
      transaction_date: item.transaction_date,
      description: `[gmail:${item.email_id}] ${item.description}`,
      status: "pending",
    }));

  if (rows.length === 0) {
    return 0;
  }

  const { error } = await supabase.from("suggested_debts").insert(rows);
  if (error) {
    console.error("Gmail sync store failed:", error);
    return 0;
  }

  return rows.length;
}

export async function syncDebtEmails(params?: {
  query?: string;
  maxResults?: number;
  userId?: string;
}) {
  const query = params?.query?.trim() || process.env.GMAIL_MCP_QUERY || "newer_than:1d";
  const maxResults = Math.min(Math.max(params?.maxResults ?? 20, 1), 50);
  const suggested = await analyzeDebtEmails(query, maxResults);
  const stored = await storeSuggestions(params?.userId, suggested);

  return {
    suggested,
    stored,
  } satisfies GmailSyncResult;
}
