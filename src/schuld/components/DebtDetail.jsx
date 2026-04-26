import { useState, useEffect } from "react";
import { S } from "../styles/styles";
import { fmt } from "../utils/helpers";
import { useLang } from "../hooks/useLang";
import { getCreditor, getStageData } from "../constants/creditors";
import { supabase } from "../../lib/supabase";

async function fetchAIText(systemPrompt, userContent) {
  const response = await fetch("/api/advisor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemPrompt,
      messages: [{ role: "user", content: userContent }],
    }),
  });
  if (!response.ok) return "";
  const data = await response.json();
  const text = data.reply || "";
  // Hard-cap: take only the first sentence
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

export function DebtDetail({ debt, income = [], onBack, onDelete }) {
  const { t, lang, fmtDate } = useLang();
  const c = getCreditor(debt.creditorType);
  const s = getStageData(debt.stage);
  const collectionFees = debt.amount - debt.originalAmount;
  const monthlyIncome = income.reduce((sum, i) => sum + i.amount, 0);

  const [docs, setDocs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [actionContent, setActionContent] = useState(null);
  const [actionLoading, setActionLoading] = useState(true);
  const [summaryContent, setSummaryContent] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  useEffect(() => { loadDocs(); }, [debt.id]);

  useEffect(() => {
    let cancelled = false;
    setActionLoading(true);
    setActionContent(null);
    const language = lang === "nl" ? "Dutch" : "English";
    const incomeSummary = income.length > 0
      ? income.map(i => `${i.label}: €${i.amount}/month`).join(", ")
      : "unknown";
    fetchAIText(
      `Respond in ${language}. One sentence, max 15 words: the single most important action for this debt right now. Be specific.`,
      buildDebtContext(debt, c, s, collectionFees, monthlyIncome)
    ).then(text => {
      if (!cancelled) { setActionContent(text); setActionLoading(false); }
    }).catch(() => {
      if (!cancelled) { setActionContent(""); setActionLoading(false); }
    });
    return () => { cancelled = true; };
  }, [debt.id, lang]);

  useEffect(() => {
    let cancelled = false;
    setSummaryLoading(true);
    setSummaryContent(null);
    const language = lang === "nl" ? "Dutch" : "English";
    fetchAIText(
      `Respond in ${language}. One sentence, max 15 words: what this debt is and how urgent it is.`,
      buildDebtContext(debt, c, s, collectionFees, monthlyIncome)
    ).then(text => {
      if (!cancelled) { setSummaryContent(text); setSummaryLoading(false); }
    }).catch(() => {
      if (!cancelled) { setSummaryContent(""); setSummaryLoading(false); }
    });
    return () => { cancelled = true; };
  }, [debt.id, lang]);

  async function loadDocs() {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("debt_id", debt.id)
      .order("uploaded_at", { ascending: false });
    if (!error && data) setDocs(data);
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    const path = `${debt.id}/${Date.now()}_${file.name}`;
    const { error: upErr } = await supabase.storage.from("documents").upload(path, file);
    if (upErr) { setUploadError(upErr.message); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("documents").getPublicUrl(path);
    await supabase.from("documents").insert({ debt_id: debt.id, file_url: publicUrl, file_name: file.name, file_type: file.type });
    await loadDocs();
    setUploading(false);
    e.target.value = "";
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

      {/* iDEAL pay button */}
      <PayButton debt={debt} creditor={c} lang={lang} t={t} />

      {/* AI Summary */}
      <div style={S.card}>
        <div style={{ ...S.cardTitle, marginBottom: 12 }}>{t("aiSummary")}</div>
        {summaryLoading ? <LoadingDots /> : (
          <div style={{ fontSize: 14, lineHeight: 1.65, color: "var(--text-primary)" }}>
            {(summaryContent || "").split("\n").filter(l => l.trim()).map((line, i) => (
              <p key={i} style={{ margin: i > 0 ? "8px 0 0" : 0 }}>{line}</p>
            ))}
          </div>
        )}
      </div>

      {/* AI Action Items */}
      <div style={S.card}>
        <div style={{ ...S.cardTitle, marginBottom: 12 }}>{t("aiActionItems")}</div>
        {actionLoading ? <LoadingDots /> : (
          <div style={{ fontSize: 14, lineHeight: 1.65, color: "var(--text-primary)" }}>
            {(actionContent || "").split("\n").filter(l => l.trim()).map((line, i, arr) => (
              <div key={i} style={{ marginBottom: i < arr.length - 1 ? 10 : 0 }}>{line}</div>
            ))}
          </div>
        )}
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

function PayButton({ debt, creditor, lang, t }) {
  const paymentUrl = creditor.paymentUrl;

  if (paymentUrl) {
    return (
      <a
        href={paymentUrl}
        target="_blank"
        rel="noreferrer"
        style={payBtnStyle}
      >
        <IDealLogo />
        <span style={{ flex: 1 }}>{lang === "nl" ? `Betaal ${fmt(debt.amount)} via iDEAL` : `Pay ${fmt(debt.amount)} via iDEAL`}</span>
        <span style={{ fontSize: 16 }}>↗</span>
      </a>
    );
  }

  return (
    <div style={{ ...payBtnStyle, background: "var(--card-bg)", border: "1px solid var(--card-border)", color: "var(--text-secondary)", cursor: "default" }}>
      <span style={{ fontSize: 18 }}>🏦</span>
      <span style={{ flex: 1, fontSize: 13 }}>
        {lang === "nl"
          ? "Betaal via uw bank of neem contact op met de schuldeiser"
          : "Pay via your bank or contact the creditor directly"}
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

function buildDebtContext(debt, c, s, collectionFees, monthlyIncome) {
  return [
    `Creditor: ${debt.creditorName} (${c.type})`,
    `Outstanding: €${debt.amount}`,
    `Original: €${debt.originalAmount}`,
    `Fees added: €${collectionFees}`,
    `Stage: ${s.id}`,
    `Due: ${debt.dueDate}`,
    `Monthly income: €${monthlyIncome}`,
    `Notes: ${debt.notes || "none"}`,
  ].join("\n");
}
