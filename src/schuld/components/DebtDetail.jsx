import { useState, useEffect } from "react";
import { S } from "../styles/styles";
import { fmt } from "../utils/helpers";
import { useLang } from "../hooks/useLang";
import { getCreditor, getStageData } from "../constants/creditors";
import { supabase } from "../../lib/supabase";

export function DebtDetail({ debt, onBack, onDelete }) {
  const { t, fmtDate } = useLang();
  const c = getCreditor(debt.creditorType);
  const s = getStageData(debt.stage);
  const collectionFees = debt.amount - debt.originalAmount;

  const [docs, setDocs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  useEffect(() => { loadDocs(); }, [debt.id]);

  async function loadDocs() {
    const { data } = await supabase
      .from("documents")
      .select("*")
      .eq("debt_id", debt.id)
      .order("uploaded_at", { ascending: false });
    if (data) setDocs(data);
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

  const lastCorrespondence = docs.length > 0 ? docs[0].uploaded_at : null;

  return (
    <div style={S.sc} className="doei-sc screen-in">
      <button style={S.backBtn} onClick={onBack}>{t("back")}</button>

      {/* Hero: creditor + amount due */}
      <div style={S.debtDetailHero}>
        <span style={{ fontSize: 44 }}>{c.icon}</span>
        <h2 style={S.detailName}>{debt.creditorName}</h2>
        <div style={S.detailHeroAmt}>{fmt(debt.amount)}</div>
        <span style={{ ...S.stagePill, backgroundColor: s.color + "22", color: s.color, fontSize: 13, padding: "5px 14px" }}>{t(s.labelKey)}</span>
      </div>

      {/* Key details list */}
      <div style={S.card}>
        <div style={S.dRow}><span style={S.dLabel}>{t("originalAmount")}</span><span>{fmt(debt.originalAmount)}</span></div>
        <div style={S.dRow}><span style={S.dLabel}>{t("feesInterest")}</span><span style={{ color: collectionFees > 0 ? "#E07A5F" : "inherit" }}>{collectionFees > 0 ? `+${fmt(collectionFees)}` : "—"}</span></div>
        <div style={S.dRow}><span style={S.dLabel}>{t("outstandingAmount")}</span><span style={{ fontWeight: 700 }}>{fmt(debt.amount)}</span></div>
        <div style={S.dRow}><span style={S.dLabel}>{t("created")}</span><span>{fmtDate(debt.createdAt)}</span></div>
        <div style={S.dRow}><span style={S.dLabel}>{t("dueDate")}</span><span>{fmtDate(debt.dueDate)}</span></div>
        <div style={{ ...S.dRow, borderBottom: "none" }}>
          <span style={S.dLabel}>{t("lastCorrespondence")}</span>
          <span style={{ color: lastCorrespondence ? "var(--text-primary)" : "var(--text-secondary)" }}>
            {lastCorrespondence ? fmtDate(lastCorrespondence.split("T")[0]) : "—"}
          </span>
        </div>
      </div>

      {/* Correspondence documents table */}
      <div style={S.card}>
        <div style={{ ...S.cardTitle, marginBottom: 14 }}>{t("correspondence")}</div>

        <label style={{ ...S.docUploadBtn, color: uploading ? "#999" : "#3D405B", cursor: uploading ? "not-allowed" : "pointer" }}>
          {uploading ? "Uploading..." : `📎 ${t("addDocument")}`}
          <input type="file" accept="image/*,.pdf" style={{ display: "none" }} onChange={handleUpload} disabled={uploading} />
        </label>
        {uploadError && <div style={{ fontSize: 12, color: "#E07A5F", marginTop: 8 }}>{uploadError}</div>}

        {docs.length > 0 ? (
          <div style={{ marginTop: 14 }}>
            <div style={S.docTableHdr}>
              <span style={{ flex: 2 }}>{t("docTitle")}</span>
              <span style={{ flex: 1, textAlign: "center" }}>{t("docStatus")}</span>
              <span style={{ flex: 1, textAlign: "center" }}>{t("docDate")}</span>
              <span style={{ width: 36, textAlign: "center" }}>{t("docView")}</span>
            </div>
            {docs.map(doc => (
              <div key={doc.id} style={S.docTableRow}>
                <div style={{ flex: 2, display: "flex", alignItems: "center", gap: 6, overflow: "hidden" }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{doc.file_type?.startsWith("image") ? "🖼️" : "📄"}</span>
                  <span style={{ fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.file_name}</span>
                </div>
                <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
                  <span style={{ ...S.stagePill, backgroundColor: s.color + "22", color: s.color, fontSize: 10, whiteSpace: "nowrap" }}>{t(s.labelKey)}</span>
                </div>
                <div style={{ flex: 1, fontSize: 11, color: "var(--text-secondary)", textAlign: "center" }}>
                  {fmtDate(doc.uploaded_at?.split("T")[0])}
                </div>
                <a href={doc.file_url} target="_blank" rel="noreferrer"
                  style={{ width: 36, display: "flex", justifyContent: "center", alignItems: "center", color: "#3D405B", fontSize: 16, textDecoration: "none", fontWeight: 700 }}>
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
