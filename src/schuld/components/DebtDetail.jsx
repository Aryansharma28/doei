import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { S } from "../styles/styles";
import { fmt } from "../utils/helpers";
import { useLang } from "../hooks/useLang";
import { getCreditor, getStageData } from "../constants/creditors";
import { supabase } from "../../lib/supabase";

const FAST_MODEL = "claude-haiku-4-5";

async function fetchAIText(systemPrompt, userContent, { oneSentence = true } = {}) {
  const response = await fetch("/api/advisor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemPrompt,
      messages: [{ role: "user", content: userContent }],
      model: FAST_MODEL,
    }),
  });
  if (!response.ok) return "";
  const data = await response.json();
  const text = data.reply || "";
  if (!oneSentence) return text;
  return text.split(/(?<=[.!?])\s/)[0] || text;
}

function LoadingDots() {
  return (
    <div style={S.thinkingDots}>
      <span style={{ ...S.dot, animationDelay: "0s" }} />
      <span style={{ ...S.dot, animationDelay: "0.2s" }} />
      <span style={{ ...S.dot, animationDelay: "0.4s" }} />
    </div>
  );
}

export function DebtDetail({ debt, income = [], onBack, onDelete, bankBalance, bankName, onMarkPaid }) {
  const { t, lang, fmtDate } = useLang();
  const c = getCreditor(debt.creditorType);
  const s = getStageData(debt.stage);
  const collectionFees = debt.amount - debt.originalAmount;
  const monthlyIncome = income.reduce((sum, i) => sum + i.amount, 0);

  const [docs, setDocs] = useState([]);
  const [docsLoaded, setDocsLoaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [actionContent, setActionContent] = useState(null);
  const [actionLoading, setActionLoading] = useState(true);
  const [summaryContent, setSummaryContent] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [showPayConfirm, setShowPayConfirm] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);

  useEffect(() => { setDocsLoaded(false); loadDocs(); }, [debt.id]);

  useEffect(() => {
    if (!docsLoaded) return;
    let cancelled = false;
    setActionLoading(true);
    setActionContent(null);
    const language = lang === "nl" ? "Dutch" : "English";
    fetchAIText(
      `You advise people in the Netherlands dealing with debt. Respond in ${language}.

Output 2-3 short action bullets (one per line, max 14 words each, in priority order). The FIRST line is the single most important next step — make it a concrete CTA: a phone number to call, a specific deadline, or a precise amount and date to pay. No bullet character — one action per line.

Read the LETTER CONTENT (if provided) carefully and extract any deadlines or thresholds the letter itself names (e.g. "binnen 7 dagen", "+ € 7,50 herinneringskosten", phone numbers). Quote the letter's own deadlines when present — don't make them up.

Use the URGENCY SIGNALS to set tone:
- If sommatie / debt-collector / overdue / wage-garnishment risk → first action MUST be "Pay before X" or "Call them today" with the specific date or phone.
- If extra costs will be added on a deadline (e.g. 7-day window), include "Pay before X to avoid +€Y in costs" as an action.
- Always include a fallback when the user might not be able to pay in full: "Bel ze en vraag een betalingsregeling" (or the English equivalent). Public creditors and most utilities legally must consider one.
- For huur arrears mention preventing ontruiming. For zorg achterstand mention avoiding CAK wanbetalersregeling. For BKR-risico (ING) mention the credit-rating impact.

Do NOT output one generic sentence. Do NOT downplay urgency when signals indicate sommatie or overdue.`,
      buildDebtContext(debt, c, s, collectionFees, monthlyIncome, docs),
      { oneSentence: false }
    ).then(text => {
      if (!cancelled) { setActionContent(text); setActionLoading(false); }
    }).catch(() => {
      if (!cancelled) { setActionContent(""); setActionLoading(false); }
    });
    return () => { cancelled = true; };
  }, [debt.id, lang, docs, docsLoaded]);

  useEffect(() => {
    if (!docsLoaded) return;
    let cancelled = false;
    setSummaryLoading(true);
    setSummaryContent(null);
    const language = lang === "nl" ? "Dutch" : "English";
    fetchAIText(
      `You advise people in the Netherlands dealing with debt. Respond in ${language}.

Output exactly TWO short sentences, separated by a single newline. No headers, no bullets.

Sentence 1 — WHAT THIS IS: name the kind of letter (e.g. "Sommatie van incassobureau", "Eindafrekening energie", "Eerste aanmaning verkeersboete"), what creditor sent it, and what it's for. Be concrete; do not say "this is a debt".
Sentence 2 — WHY IT MATTERS NOW: state the urgency in plain language (e.g. "Last warning before court", "Standard bill, no rush yet", "Will trigger CAK wanbetalersregeling at 6 months unpaid"). Reference the actual deadline or escalation step from the letter or signals.

Calibrate from URGENCY SIGNALS and LETTER CONTENT:
- sommatie / debt-collector / overdue / wage-garnishment risk → "critical" or "last warning". Do not soften.
- Fees already added or past first reminder → "urgent".
- Public creditor (Belastingdienst, CJIB, DUO, CAK) → mention wage-garnishment power if relevant.
- Quiet utility/standard bill, no signals → keep it calm but specific.

Never call a sommatie or overdue debt "manageable" or "no problem". Be honest and specific.`,
      buildDebtContext(debt, c, s, collectionFees, monthlyIncome, docs),
      { oneSentence: false }
    ).then(text => {
      if (!cancelled) { setSummaryContent(text); setSummaryLoading(false); }
    }).catch(() => {
      if (!cancelled) { setSummaryContent(""); setSummaryLoading(false); }
    });
    return () => { cancelled = true; };
  }, [debt.id, lang, docs, docsLoaded]);

  async function loadDocs() {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("debt_id", debt.id)
      .order("uploaded_at", { ascending: false });
    if (!error && data) setDocs(data);
    setDocsLoaded(true);
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUploadError("Not signed in"); setUploading(false); return; }
    const path = `${user.id}/${debt.id}/${Date.now()}_${file.name}`;
    const { error: upErr } = await supabase.storage.from("documents").upload(path, file);
    if (upErr) { setUploadError(upErr.message); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("documents").getPublicUrl(path);
    const { data: insertedRow } = await supabase
      .from("documents")
      .insert({ user_id: user.id, debt_id: debt.id, file_url: publicUrl, file_name: file.name, file_type: file.type })
      .select()
      .single();
    await loadDocs();
    setUploading(false);
    e.target.value = "";

    // Fire-and-forget: extract text from the letter so the AI summary/CTAs
    // can quote actual deadlines and amounts from the document.
    if (insertedRow?.id) {
      fetch("/api/document/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl: publicUrl, debtContext: `Creditor: ${debt.creditorName}, type: ${debt.creditorType}` }),
      })
        .then(r => r.ok ? r.json() : null)
        .then(async (data) => {
          if (data?.analysis) {
            await supabase.from("documents").update({ extracted_text: data.analysis }).eq("id", insertedRow.id);
            await loadDocs();
          }
        })
        .catch(() => {});
    }
  }

  return (
    <div style={S.sc} className="doei-sc screen-in">
      <button style={S.backBtn} onClick={onBack}>{t("back")}</button>

      <div style={S.debtDetailHero}>
        <h2 style={S.detailName}>{debt.creditorName}</h2>
        <div style={S.detailHeroAmt} className="tabular">{fmt(debt.amount)}</div>
        <span style={{ ...S.stageChip, color: s.color, background: s.bg, fontSize: 12, padding: "4px 10px" }}>
          <span style={{ ...S.stageChipDot, background: s.color }} />
          {t(s.labelKey)}
        </span>
      </div>

      {/* Pay button */}
      <PayButton
        debt={debt}
        creditor={c}
        lang={lang}
        t={t}
        bankBalance={bankBalance}
        bankName={bankName}
        onBankPay={() => setShowPayConfirm(true)}
      />

      {/* Payment confirmation sheet — portalled to body to escape stacking context */}
      {showPayConfirm && createPortal(
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1000 }} onClick={() => setShowPayConfirm(false)}>
          <div style={{ background: "var(--paper-0)", borderRadius: "24px 24px 0 0", padding: "28px 24px 44px", width: "100%", maxWidth: 480, boxSizing: "border-box" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--ink-0)", marginBottom: 6 }}>Confirm payment</div>
            <div style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.6, marginBottom: 24 }}>
              Send <strong style={{ color: "var(--ink-0)" }}>{fmt(debt.amount)}</strong> to <strong style={{ color: "var(--ink-0)" }}>{debt.creditorName}</strong><br />
              From {bankName} · {fmt(bankBalance)} available
            </div>
            <button
              onClick={() => { setShowPayConfirm(false); setPaySuccess(true); setTimeout(() => onMarkPaid(debt.id), 1600); }}
              style={{ width: "100%", height: 52, background: "var(--accent)", color: "white", border: "none", borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: "pointer", marginBottom: 12 }}
            >
              Confirm →
            </button>
            <button onClick={() => setShowPayConfirm(false)} style={{ width: "100%", height: 44, background: "none", color: "var(--ink-2)", border: "none", fontSize: 14, cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Payment success overlay */}
      {paySuccess && createPortal(
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "var(--paper-0)", borderRadius: 24, padding: "36px 32px", textAlign: "center", margin: 24, maxWidth: 320 }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: "var(--stable-bg)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28 }}>✓</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--ink-0)", marginBottom: 8 }}>Payment sent</div>
            <div style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.6 }}>{fmt(debt.amount)} to {debt.creditorName}</div>
          </div>
        </div>,
        document.body
      )}

      {/* What this is */}
      <div style={S.card}>
        <div style={{ ...S.cardTitle, marginBottom: 12 }}>{t("aiSummary")}</div>
        {summaryLoading ? <LoadingDots /> : (() => {
          const lines = (summaryContent || "").split("\n").map(l => l.trim()).filter(Boolean);
          const what = lines[0] || "";
          const why = lines.slice(1).join(" ");
          return (
            <div style={{ fontSize: 14, lineHeight: 1.65, color: "var(--text-primary)" }}>
              <p style={{ margin: 0, fontWeight: 600 }}>{what}</p>
              {why && <p style={{ margin: "8px 0 0", color: "var(--text-secondary)" }}>{why}</p>}
            </div>
          );
        })()}
      </div>

      {/* What to do — primary CTA + supporting actions */}
      <div style={S.card}>
        <div style={{ ...S.cardTitle, marginBottom: 12 }}>{t("aiActionItems")}</div>
        {actionLoading ? <LoadingDots /> : (() => {
          const items = (actionContent || "").split("\n").map(l => l.replace(/^[-•\d.\s]+/, "").trim()).filter(Boolean);
          const primary = items[0];
          const rest = items.slice(1);
          return (
            <div>
              {primary && (
                <div style={{
                  background: "var(--action-bg, #FFF1EE)",
                  borderLeft: "3px solid var(--action-fg, #C8102E)",
                  borderRadius: 8,
                  padding: "12px 14px",
                  fontSize: 15,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  lineHeight: 1.45,
                }}>
                  {primary}
                </div>
              )}
              {rest.length > 0 && (
                <ul style={{ margin: "12px 0 0", paddingLeft: 18, fontSize: 14, lineHeight: 1.6, color: "var(--text-primary)" }}>
                  {rest.map((line, i) => (
                    <li key={i} style={{ marginBottom: i < rest.length - 1 ? 6 : 0 }}>{line}</li>
                  ))}
                </ul>
              )}
            </div>
          );
        })()}
      </div>

      {/* Financial breakdown */}
      <div style={S.card}>
        <div style={S.dRow}><span style={S.dLabel}>{t("originalAmount")}</span><span>{fmt(debt.originalAmount)}</span></div>
        <div style={S.dRow}><span style={S.dLabel}>{t("feesInterest")}</span><span style={{ color: collectionFees > 0 ? "var(--action-fg)" : "inherit" }}>{collectionFees > 0 ? `+${fmt(collectionFees)}` : "—"}</span></div>
        <div style={S.dRow}><span style={S.dLabel}>{t("outstandingAmount")}</span><span style={{ fontWeight: 700 }}>{fmt(debt.amount)}</span></div>
        <div style={S.dRow}><span style={S.dLabel}>{t("created")}</span><span>{fmtDate(debt.createdAt)}</span></div>
        <div style={S.dRow}><span style={S.dLabel}>{t("dueDate")}</span><span>{fmtDate(debt.dueDate)}</span></div>
        <div style={{ ...S.dRow, borderBottom: "none" }}>
          <span style={S.dLabel}>{t("lastCorrespondence")}</span>
          <span style={{ color: docs.length > 0 ? "var(--text-primary)" : "var(--text-secondary)" }}>
            {docs.length > 0 ? fmtDate(docs[0].uploaded_at.split("T")[0]) : "—"}
          </span>
        </div>
      </div>

      {/* Correspondence */}
      <div style={S.card}>
        <div style={{ ...S.cardTitle, marginBottom: 14 }}>{t("correspondence")}</div>
        <label style={{ ...S.docUploadBtn, marginBottom: docs.length > 0 ? 14 : 0, cursor: uploading ? "not-allowed" : "pointer", opacity: uploading ? 0.6 : 1 }}>
          {uploading ? t("analyzing") : t("addDocument")}
          <input type="file" accept="image/*,application/pdf" style={{ display: "none" }} onChange={handleUpload} disabled={uploading} />
        </label>
        {uploadError && <div style={{ fontSize: 13, color: "var(--action-fg)", marginBottom: 10 }}>{uploadError}</div>}
        {docs.length > 0 ? (
          <div>
            <div style={S.docTableHdr}>
              <span style={{ flex: 2 }}>{t("docTitle")}</span>
              <span style={{ flex: 1, textAlign: "center" }}>{t("docDate")}</span>
              <span style={{ width: 36, textAlign: "center" }}>{t("docView")}</span>
            </div>
            {docs.map(doc => (
              <div key={doc.id} style={S.docTableRow}>
                <div style={{ flex: 2, display: "flex", alignItems: "center", gap: 6, overflow: "hidden" }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{doc.file_type?.startsWith("image") ? "🖼️" : "📄"}</span>
                  <span style={{ fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.file_name}</span>
                </div>
                <div style={{ flex: 1, fontSize: 11, color: "var(--text-secondary)", textAlign: "center" }}>
                  {fmtDate(doc.uploaded_at?.split("T")[0])}
                </div>
                <a href={doc.file_url} target="_blank" rel="noreferrer"
                  style={{ width: 36, display: "flex", justifyContent: "center", alignItems: "center", color: "var(--accent)", fontSize: 16, textDecoration: "none", fontWeight: 700 }}>
                  ↗
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "20px 0 6px", fontSize: 13, color: "var(--text-secondary)", marginTop: 10 }}>
            {t("noDocuments")}
          </div>
        )}
      </div>

      <button style={S.deleteBtn} onClick={() => onDelete(debt.id)}>{t("deleteDebt")}</button>
    </div>
  );
}

function PayButton({ debt, creditor, lang, t, bankBalance, bankName, onBankPay }) {
  if (bankBalance != null && bankName) {
    const canAfford = bankBalance >= debt.amount;
    return (
      <button
        onClick={canAfford ? onBankPay : undefined}
        disabled={!canAfford}
        style={{
          ...payBtnStyle,
          background: canAfford ? "var(--accent)" : "var(--paper-2)",
          color: canAfford ? "white" : "var(--ink-2)",
          cursor: canAfford ? "pointer" : "default",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 4,
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 700 }}>
          {canAfford ? `Pay ${fmt(debt.amount)} now` : "Insufficient balance"}
        </span>
        <span style={{ fontSize: 12, opacity: 0.75 }}>
          {bankName} · {fmt(bankBalance)} available
        </span>
      </button>
    );
  }

  const paymentUrl = creditor.paymentUrl;
  if (paymentUrl) {
    return (
      <a href={paymentUrl} target="_blank" rel="noreferrer" style={payBtnStyle}>
        <IDealLogo />
        <span style={{ flex: 1 }}>{lang === "nl" ? `Betaal ${fmt(debt.amount)} via iDEAL` : `Pay ${fmt(debt.amount)} with iDEAL`}</span>
        <span style={{ fontSize: 16 }}>↗</span>
      </a>
    );
  }

  return (
    <div style={{ ...payBtnStyle, background: "var(--card-bg)", border: "1px solid var(--card-border)", color: "var(--text-secondary)", cursor: "default" }}>
      <span style={{ fontSize: 18 }}>🏦</span>
      <span style={{ flex: 1, fontSize: 13 }}>
        {lang === "nl"
          ? "Betaal via je bank of neem contact op met de schuldeiser"
          : "Pay through your bank or get in touch with them directly"}
      </span>
    </div>
  );
}

const payBtnStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  width: "100%",
  padding: "16px 18px",
  background: "#003082",
  color: "white",
  borderRadius: 14,
  border: "none",
  fontSize: 15,
  fontWeight: 600,
  cursor: "pointer",
  textDecoration: "none",
  marginBottom: 14,
  boxSizing: "border-box",
};

function IDealLogo() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="6" fill="white" />
      <text x="4" y="23" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="16" fill="#003082">iD</text>
      <rect x="19" y="6" width="9" height="20" rx="2" fill="#CC0000" />
    </svg>
  );
}

function buildDebtContext(debt, c, s, collectionFees, monthlyIncome, docs = []) {
  const notes = (debt.notes || "").toLowerCase();
  const docTexts = (docs || []).map(d => d.extracted_text).filter(Boolean).join("\n").toLowerCase();
  const haystack = `${notes}\n${docTexts}`;
  const signals = [];

  if (c.id === "incasso" || /sommatie|deurwaarder|incassobureau/.test(haystack)) {
    signals.push("CRITICAL: At debt-collector / sommatie stage. Next escalation is dagvaarding (court summons) and possible loon- or bankbeslag.");
  }
  if (/aanmaning|verhoogd|achterstand|laatste/.test(haystack)) {
    signals.push("Already past first reminder — has been escalated at least once.");
  }
  if (collectionFees > 0) {
    signals.push(`€${collectionFees.toFixed(2)} in extra fees already added on top of the original €${debt.originalAmount}.`);
  }
  if (debt.dueDate) {
    const daysUntilDue = Math.ceil((new Date(debt.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (daysUntilDue < 0) signals.push(`Already ${Math.abs(daysUntilDue)} day(s) OVERDUE.`);
    else if (daysUntilDue <= 3) signals.push(`Due in ${daysUntilDue} day(s) — payment window is closing.`);
    else if (daysUntilDue <= 7) signals.push(`Due in ${daysUntilDue} days — must be arranged this week.`);
  }
  if (["belasting", "cjib", "duo", "cak", "toeslagen"].includes(c.id)) {
    signals.push("Public creditor — has legal authority to garnish wages without going to court.");
  }
  if (c.id === "huur") {
    signals.push("Rent arrears — landlord can start ontbinding/eviction procedure if it grows.");
  }
  if (c.id === "zorg" && /zorgpremie|premie/.test(haystack)) {
    signals.push("Zorgpremie achterstand — at 6 months unpaid you are auto-enrolled in CAK wanbetalersregeling (~€161/month penalty premium).");
  }

  const today = new Date().toISOString().slice(0, 10);
  const lines = [
    `Today: ${today}`,
    `Creditor: ${debt.creditorName} (${c.type}, id: ${c.id})`,
    `Outstanding: €${debt.amount}`,
    `Original: €${debt.originalAmount}`,
    `Fees added: €${collectionFees}`,
    `Stage: ${s.id}`,
    `Due: ${debt.dueDate}`,
    `Monthly income: €${monthlyIncome}`,
    `Notes: ${debt.notes || "none"}`,
    "",
    signals.length
      ? "URGENCY SIGNALS:\n" + signals.map(line => `- ${line}`).join("\n")
      : "URGENCY SIGNALS: none detected — this debt is in a manageable state.",
  ];

  const letters = (docs || []).map(d => d.extracted_text).filter(Boolean);
  if (letters.length) {
    lines.push("");
    lines.push("LETTER CONTENT (extracted from the attached document — quote deadlines and amounts from this if relevant):");
    letters.forEach((t, i) => {
      lines.push(`--- letter ${i + 1} ---`);
      lines.push(t);
    });
  }

  return lines.join("\n");
}
