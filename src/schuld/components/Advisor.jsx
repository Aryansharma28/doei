import { useState, useEffect, useRef } from "react";
import { S } from "../styles/styles";
import { useLang } from "../hooks/useLang";
import { getCreditor, getStageData } from "../constants/creditors";
import { fmt } from "../utils/helpers";
import { createTrace } from "../../lib/langwatch";

// Parse AI response into text segments and [PAY:...] action cards
function parseMessage(content) {
  const parts = content.split(/(\[PAY:[^\]]+\])/g);
  return parts.map(part => {
    const m = part.match(/^\[PAY:([^:]+):([^:]+):([^\]]+)\]$/);
    if (m) return { type: "pay", creditorId: m[1], amount: parseFloat(m[2]), label: m[3] };
    return { type: "text", content: part };
  }).filter(p => p.type === "pay" || p.content?.trim());
}

function PayActionCard({ creditorId, amount, label, lang }) {
  const creditor = getCreditor(creditorId);
  const url = creditor?.paymentUrl;
  const displayAmt = fmt(amount);

  if (url) {
    return (
      <a href={url} target="_blank" rel="noreferrer" style={actionCardStyle}>
        <IDealLogo />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "white" }}>{label}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 1 }}>
            {lang === "nl" ? `Betaal ${displayAmt} via iDEAL` : `Pay ${displayAmt} via iDEAL`}
          </div>
        </div>
        <span style={{ fontSize: 14, color: "rgba(255,255,255,0.8)" }}>↗</span>
      </a>
    );
  }

  return (
    <div style={{ ...actionCardStyle, background: "var(--tag-bg)", border: "1px solid var(--card-border)", cursor: "default" }}>
      <span style={{ fontSize: 18 }}>🏦</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{label}</div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 1 }}>
          {displayAmt} — {lang === "nl" ? "betaal via uw bank" : "pay via your bank"}
        </div>
      </div>
    </div>
  );
}

function IDealLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" style={{ flexShrink: 0 }}>
      <rect width="32" height="32" rx="6" fill="white" />
      <text x="4" y="23" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="16" fill="#003082">iD</text>
      <rect x="19" y="6" width="9" height="20" rx="2" fill="#CC0000" />
    </svg>
  );
}

const actionCardStyle = {
  display: "flex", alignItems: "center", gap: 10,
  background: "#003082", borderRadius: 12, padding: "12px 14px",
  margin: "8px 0 4px", textDecoration: "none", border: "none",
  width: "100%", boxSizing: "border-box", cursor: "pointer",
};

export function Advisor({ debts, income }) {
  const { t, lang } = useLang();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const buildSystemPrompt = () => {
    const totalDebt = debts.reduce((s, d) => s + d.amount, 0);
    const monthlyIncome = income.reduce((s, i) => s + i.amount, 0);
    const debtList = debts.map(d => {
      const c = getCreditor(d.creditorType);
      const st = getStageData(d.stage);
      return `- id:${d.creditorType} | ${d.creditorName} (${c.type}): €${d.amount} owed (original €${d.originalAmount}), stage: ${st.id}, due: ${d.dueDate}, notes: ${d.notes || "none"}`;
    }).join("\n");
    const incomeList = income.map(i => `- ${i.label}: €${i.amount}/month (paid day ${i.day})`).join("\n");

    return `You are a financial wellbeing assistant for someone in the Netherlands dealing with debt. Respond in ${lang === "nl" ? "Dutch" : "English"}.

This person is likely stressed. Be warm, honest, and human — like a knowledgeable friend, not a formal advisor.

THEIR SITUATION:
Total debt: €${totalDebt.toFixed(0)} across ${debts.length} debts. Monthly income: €${monthlyIncome.toFixed(0)}.

Debts (use these exact creditor IDs in PAY tags):
${debtList}

Income:
${incomeList}

ACCURACY — NEVER BREAK THESE RULES:
- Only reference amounts, creditor names, and dates from the data above. Never invent or estimate figures.
- If you don't know something, say "I'm not sure" — never guess.
- Don't promise outcomes you can't guarantee (e.g. "they will definitely accept a payment plan").
- Dutch law references must be general and accurate. Don't cite specific article numbers.

TONE & FORMAT:
- Plain text only. No markdown, no bold, no bullet points, no numbered lists, no headers.
- Short paragraphs, 2-3 sentences each. Max 5-6 sentences total per response.
- Be warm and specific — use their actual creditor names and amounts.
- No doom. Acknowledge that debt is hard, then focus on what they CAN do.
- End with one short question to keep the conversation going.

DUTCH CONTEXT (explain in plain language, never use raw legal terms):
- Belastingdienst, CJIB, DUO, CAK have the strongest legal powers — they can garnish wages.
- Rent arrears risk eviction — always treat as urgent.
- All public creditors must offer a payment arrangement (betalingsregeling) if asked — always worth calling.
- Free municipal debt counseling is available (schuldhulpverlening via their gemeente) — mention when situation feels overwhelming.
- There is a protected minimum income that cannot be seized by law — reassuring to mention if they're scared of garnishment.

PAYMENT ACTION CARDS:
When you recommend paying a specific debt right now, include a payment tag on its own line (no surrounding text on that line):
[PAY:creditorId:amount:Short label]

Use the exact creditor id from the debt list (e.g. cjib, belasting, huur). Only include PAY tags when it is genuinely the right immediate action. Never include more than 3 PAY tags in one response.

Example:
Contact the CJIB today to avoid your fine escalating further.

[PAY:cjib:490:CJIB – Verkeersboete]`;
  };

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const userMsg = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const totalDebt = debts.reduce((s, d) => s + d.amount, 0);
    const trace = createTrace({
      feature: "advisor",
      metadata: { lang, debt_count: debts.length, total_debt_eur: Math.round(totalDebt) },
    });
    const span = trace.startLLMSpan("debt-advisor");

    try {
      const systemPrompt = buildSystemPrompt();
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));
      const response = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemPrompt, messages: apiMessages }),
      });
      if (!response.ok) throw new Error("API error");
      const data = await response.json();
      const reply = data.reply || (lang === "nl" ? "Sorry, probeer het opnieuw." : "Sorry, couldn't process that. Please try again.");
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
      await span.end({ model: "claude-sonnet-4-6", systemPrompt, messages: apiMessages, output: reply, usage: {} });
    } catch (err) {
      console.error("Advisor error:", err);
      await span.end({ model: "claude-sonnet-4-6", messages: newMessages, output: null, error: err });
      setMessages(prev => [...prev, { role: "assistant", content: lang === "nl" ? "Er ging iets mis. Probeer het opnieuw." : "Something went wrong. Please try again." }]);
    }
    setLoading(false);
  };

  const chips = [t("chip1"), t("chip2"), t("chip3"), t("chip4")];

  return (
    <div style={S.advisorWrap} className="doei-advisor-wrap screen-in">
      <div style={S.advisorHeader}>
        <div style={S.advisorAvatar}>◉</div>
        <div>
          <div style={S.advisorTitle}>{t("advisorTitle")}</div>
          <div style={S.advisorSubtitle}>{t("advisorSub")}</div>
        </div>
      </div>

      <div style={S.chatArea}>
        {messages.length === 0 && (
          <div style={S.chipsWrap}>
            <div style={S.welcomeMsg}>
              {lang === "nl"
                ? "Hallo! Ik ken uw volledige schuldsituatie. Stel me een vraag of kies een onderwerp."
                : "Hello! I know your full debt situation. Ask me anything or pick a topic below."}
            </div>
            <div style={S.chipsRow}>
              {chips.map((chip, i) => (
                <button key={i} style={S.chip} onClick={() => sendMessage(chip)}>{chip}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={msg.role === "user" ? S.msgUser : S.msgBot}>
            {msg.role === "assistant" && <div style={S.msgBotAvatar}>◉</div>}
            <div style={msg.role === "user" ? S.msgBubbleUser : S.msgBubbleBot}>
              {msg.role === "assistant"
                ? parseMessage(msg.content).map((part, j) =>
                    part.type === "pay"
                      ? <PayActionCard key={j} {...part} lang={lang} />
                      : part.content.split("\n").map((line, k) => (
                          <p key={`${j}-${k}`} style={{ margin: line.trim() ? "0 0 8px 0" : "0", lineHeight: 1.5 }}>{line}</p>
                        ))
                  )
                : msg.content.split("\n").map((line, j) => (
                    <p key={j} style={{ margin: line ? "0 0 8px 0" : "0", lineHeight: 1.5 }}>{line}</p>
                  ))
              }
            </div>
          </div>
        ))}

        {loading && (
          <div style={S.msgBot}>
            <div style={S.msgBotAvatar}>◉</div>
            <div style={S.msgBubbleBot}>
              <div style={S.thinkingDots}>
                <span style={{ ...S.dot, animationDelay: "0s" }} />
                <span style={{ ...S.dot, animationDelay: "0.2s" }} />
                <span style={{ ...S.dot, animationDelay: "0.4s" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      <div style={S.chatInputWrap}>
        <input
          ref={inputRef}
          style={S.chatInput}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
          placeholder={t("advisorPlaceholder")}
          disabled={loading}
        />
        <button style={{ ...S.sendBtn, opacity: input.trim() && !loading ? 1 : 0.4 }} onClick={() => sendMessage(input)} disabled={!input.trim() || loading}>
          <span style={{ fontSize: 18 }}>↑</span>
        </button>
      </div>
    </div>
  );
}
