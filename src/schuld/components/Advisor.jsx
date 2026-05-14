import { useState, useEffect, useRef } from "react";
import { S } from "../styles/styles";
import { useLang } from "../hooks/useLang";
import { getCreditor, getStageData } from "../constants/creditors";
import { fmt } from "../utils/helpers";
import { createTrace } from "../../lib/langwatch";
import { VoiceCallButton } from "./VoiceCallButton";

// Parse AI response into text segments and action cards ([PAY:...] single, [PAYPLAN:...] ranked list)
function parseMessage(content) {
  const parts = content.split(/(\[PAYPLAN:[^\]]+\]|\[PAY:[^\]]+\])/g);
  return parts.map(part => {
    const planM = part.match(/^\[PAYPLAN:([^\]]+)\]$/);
    if (planM) {
      const items = planM[1].split("|").map(entry => {
        const [creditorId, amount] = entry.split(":");
        return { creditorId, amount: parseFloat(amount) };
      }).filter(it => it.creditorId && !isNaN(it.amount));
      return items.length ? { type: "payplan", items } : { type: "text", content: "" };
    }
    const payM = part.match(/^\[PAY:([^:]+):([^:]+):([^\]]+)\]$/);
    if (payM) return { type: "pay", creditorId: payM[1], amount: parseFloat(payM[2]), label: payM[3] };
    return { type: "text", content: part };
  }).filter(p => p.type !== "text" || p.content?.trim());
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
          {displayAmt} via {lang === "nl" ? "je bank" : "your bank"}
        </div>
      </div>
    </div>
  );
}

function PayPlanCard({ items, lang }) {
  const enriched = items.map(it => ({ ...it, creditor: getCreditor(it.creditorId) }));
  const total = enriched.reduce((s, it) => s + it.amount, 0);

  return (
    <div style={{ ...actionCardStyle, flexDirection: "column", alignItems: "stretch", gap: 8, padding: 14, cursor: "default" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "white", marginBottom: 2 }}>
        {lang === "nl" ? "Betaal in deze volgorde" : "Pay in this order"}
      </div>
      {enriched.map((it, i) => {
        const url = it.creditor?.paymentUrl;
        const name = it.creditor?.id ? it.creditor.id.charAt(0).toUpperCase() + it.creditor.id.slice(1) : it.creditorId;
        const rowInner = (
          <>
            <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.6)", minWidth: 16 }}>{i + 1}</span>
            <span style={{ fontSize: 16 }}>{it.creditor?.icon || "📄"}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: "white", fontWeight: 600 }}>{name}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 1 }}>
                {url
                  ? (lang === "nl" ? "Open site om te betalen" : "Open site to pay")
                  : (lang === "nl" ? "Betaal via je bank" : "Pay via your bank")}
              </div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "white" }}>{fmt(it.amount)}</div>
            {url && <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", marginLeft: 4 }}>↗</span>}
          </>
        );
        const baseStyle = { display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "rgba(255,255,255,0.08)", borderRadius: 8, textDecoration: "none" };
        return url ? (
          <a key={i} href={url} target="_blank" rel="noreferrer" style={baseStyle}>{rowInner}</a>
        ) : (
          <div key={i} style={baseStyle}>{rowInner}</div>
        );
      })}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 6, borderTop: "1px solid rgba(255,255,255,0.15)" }}>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)" }}>{lang === "nl" ? "Totaal" : "Total"}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "white" }}>{fmt(total)}</div>
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

export function Advisor({ debts, income, initialPrompt, onConsumeInitialPrompt }) {
  const { t, lang } = useLang();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  useEffect(() => {
    if (initialPrompt) {
      setInput(initialPrompt);
      inputRef.current?.focus();
      onConsumeInitialPrompt?.();
    }
  }, [initialPrompt, onConsumeInitialPrompt]);

  const buildSystemPrompt = () => {
    const totalDebt = debts.reduce((s, d) => s + d.amount, 0);
    const monthlyIncome = income.reduce((s, i) => s + i.amount, 0);
    const debtList = debts.map(d => {
      const c = getCreditor(d.creditorType);
      const st = getStageData(d.stage);
      return `- id:${d.creditorType} | ${d.creditorName} (${c.type}): €${d.amount} owed (original €${d.originalAmount}), stage: ${st.id}, due: ${d.dueDate}, notes: ${d.notes || "none"}`;
    }).join("\n");
    const incomeList = income.map(i => `- ${i.label}: €${i.amount}/month (paid day ${i.day})`).join("\n");

    return `You are a debt advisor for someone in the Netherlands. Respond in ${lang === "nl" ? "Dutch" : "English"}.

Be helpful, honest, and keep responses short (a few sentences). Use plain text, no markdown.

Their situation:
Total debt: €${totalDebt.toFixed(0)} across ${debts.length} debts. Monthly income: €${monthlyIncome.toFixed(0)}.

Debts:
${debtList}

Income:
${incomeList}

Only reference the numbers above. Don't invent figures or promise specific outcomes.

If you recommend paying one specific debt, you may include a tag on its own line like:
[PAY:creditorId:amount:Short label]

If the user gives you an amount they have available and wants a plan across multiple debts, you may emit:
[PAYPLAN:creditorId1:amount1|creditorId2:amount2]

Use the creditor IDs from the debt list above. Don't mix the two tags in one response.`;
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
      const reply = data.reply || (lang === "nl" ? "Er ging iets mis. Probeer het opnieuw." : "Something went wrong. Please try again.");
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
        <div style={{ flex: 1 }}>
          <div style={S.advisorTitle}>{t("advisorTitle")}</div>
          <div style={S.advisorSubtitle}>{t("advisorSub")}</div>
        </div>
        <VoiceCallButton debts={debts} income={income} lang={lang} />
      </div>

      <div style={S.chatArea}>
        {messages.length === 0 && (
          <div style={S.chipsWrap}>
            <div style={S.welcomeMsg}>
              {lang === "nl"
                ? "Hallo. Ik ken jouw volledige schuldsituatie. Stel gerust een vraag, of kies een onderwerp hieronder."
                : "Hi there. I have a full picture of your debts. Ask me anything, or pick a topic below."}
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
                ? parseMessage(msg.content).map((part, j) => {
                    if (part.type === "pay") return <PayActionCard key={j} {...part} lang={lang} />;
                    if (part.type === "payplan") return <PayPlanCard key={j} items={part.items} lang={lang} />;
                    return part.content.split("\n").map((line, k) => (
                      <p key={`${j}-${k}`} style={{ margin: line.trim() ? "0 0 8px 0" : "0", lineHeight: 1.5 }}>{line}</p>
                    ));
                  })
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
