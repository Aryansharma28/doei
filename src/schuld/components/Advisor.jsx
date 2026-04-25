import { useState, useEffect, useRef } from "react";
import { S } from "../styles/styles";
import { useLang } from "../hooks/useLang";
import { getCreditor, getStageData } from "../constants/creditors";
import { fmt } from "../utils/helpers";

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
    const debtSummary = debts.map(d => {
      const c = getCreditor(d.creditorType);
      const s = getStageData(d.stage);
      return `- ${d.creditorName} (${c.type}): €${d.amount} (original: €${d.originalAmount}), stage: ${s.id}, due: ${d.dueDate}, channel: ${c.channel}, notes: ${d.notes}`;
    }).join("\n");
    const incomeSummary = income.map(i => `- ${i.label}: €${i.amount}/month (day ${i.day})`).join("\n");

    return `You are a friendly financial helper for someone in the Netherlands dealing with debt. You speak ${lang === "nl" ? "Dutch" : "English"}.

You know their exact situation:

Total debt: €${totalDebt.toFixed(0)} across ${debts.length} debts. Monthly income: €${monthlyIncome.toFixed(0)}.

Their debts:
${debtSummary}

Their income:
${incomeSummary}

HOW TO RESPOND — THIS IS CRITICAL:
- Write like you're texting a friend. Short sentences. Simple words. No jargon.
- NEVER use markdown formatting. No **bold**, no headers, no ---, no bullet points, no numbered lists.
- Just write plain paragraphs. Keep them short — 2-3 sentences each.
- Use line breaks between paragraphs for readability.
- Talk about their actual debts by name and amount. Be specific.
- Total response should be 6-10 sentences max. This is a phone screen, not a document.
- Be warm and encouraging. No doom. These people are stressed already.
- When relevant, mention that their gemeente can help with free debt counseling (schuldhulpverlening).
- You know Dutch debt law (betalingsregeling, beslagvrije voet, vroegsignalering) but explain it in plain language, never use the Dutch legal terms without explaining what they mean.
- End with one simple question to keep the conversation going.`;
  };

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const userMsg = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: buildSystemPrompt(),
          messages: apiMessages,
        })
      });
      const data = await response.json();
      const reply = data.content?.map(i => i.text || "").join("") || "Sorry, I couldn't process that. Please try again.";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      console.error("Advisor error:", err);
      setMessages(prev => [...prev, { role: "assistant", content: lang === "nl" ? "Er ging iets mis. Probeer het opnieuw." : "Something went wrong. Please try again." }]);
    }
    setLoading(false);
  };

  const chips = [t("chip1"), t("chip2"), t("chip3"), t("chip4")];

  return (
    <div style={S.advisorWrap}>
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
                ? "Hallo! Ik ken uw volledige schuldsituatie. Stel me een vraag of kies een onderwerp hieronder."
                : "Hello! I know your full debt situation. Ask me a question or pick a topic below."}
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
              {msg.content.split("\n").map((line, j) => (
                <p key={j} style={{ margin: line ? "0 0 8px 0" : "0", lineHeight: 1.5 }}>{line}</p>
              ))}
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
