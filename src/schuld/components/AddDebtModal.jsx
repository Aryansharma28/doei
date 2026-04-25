import { useState, useRef } from "react";
import { S } from "../styles/styles";
import { useLang } from "../hooks/useLang";
import { CREDITOR_TYPES, STAGE_KEYS } from "../constants/creditors";

export function AddDebtModal({ onAdd, onClose }) {
  const { t } = useLang();
  const [creditorType, setCreditorType] = useState("");
  const [creditorName, setCreditorName] = useState("");
  const [amount, setAmount] = useState("");
  const [originalAmount, setOriginalAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [stage, setStage] = useState("factuur");
  const [notes, setNotes] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const fileRef = useRef();

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setAnalyzing(true);
    try {
      const b64 = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result.split(",")[1]); r.onerror = () => rej(new Error("fail")); r.readAsDataURL(file); });
      const resp = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        model: "claude-sonnet-4-20250514", max_tokens: 1000,
        messages: [{ role: "user", content: [
          { type: "image", source: { type: "base64", media_type: file.type || "image/jpeg", data: b64 } },
          { type: "text", text: `Analyze this letter/invoice. Return ONLY a JSON object (no markdown, no backticks): creditorType (one of: belasting, cjib, zorg, gemeente, energie, huur, telecom, incasso, bank, bnpl, toeslagen, water, overig), creditorName, amount (number), dueDate (YYYY-MM-DD), stage (one of: factuur, herinnering, aanmaning, incasso, deurwaarder), notes. Use empty string or 0 if not found.` }
        ] }]
      }) });
      const data = await resp.json(); const text = data.content?.map(i => i.text || "").join("") || "";
      const p = JSON.parse(text.replace(/```json|```/g, "").trim());
      setCreditorType(p.creditorType || ""); setCreditorName(p.creditorName || ""); setAmount(p.amount ? String(p.amount) : ""); setOriginalAmount(p.amount ? String(p.amount) : ""); setDueDate(p.dueDate || ""); setStage(p.stage || "factuur"); setNotes(p.notes || "");
    } catch (err) { console.error(err); alert(t("photoError")); }
    setAnalyzing(false);
  };

  const ok = creditorType && creditorName && amount && dueDate;
  return (
    <div style={S.modalOL}>
      <div style={S.modal}>
        <div style={S.modalHdr}><h3 style={S.modalTitle}>{t("addDebt")}</h3><button style={S.modalClose} onClick={onClose}>×</button></div>
        <div style={S.photoSec}>
          <button style={S.photoBtn} onClick={() => fileRef.current?.click()} disabled={analyzing}>{analyzing ? t("analyzing") : t("photoBtn")}</button>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handlePhoto} />
          <div style={S.photoDivider}><span>{t("orManual")}</span></div>
        </div>
        <div style={S.fg}><label style={S.fLabel}>{t("creditorType")}</label><select style={S.fSelect} value={creditorType} onChange={e => setCreditorType(e.target.value)}><option value="">{t("choose")}</option>{CREDITOR_TYPES.map(c => <option key={c.id} value={c.id}>{c.icon} {t(c.labelKey)}</option>)}</select></div>
        <div style={S.fg}><label style={S.fLabel}>{t("creditorName")}</label><input style={S.fInput} value={creditorName} onChange={e => setCreditorName(e.target.value)} placeholder={t("creditorPlaceholder")} /></div>
        <div style={S.fRow}>
          <div style={{ ...S.fg, flex: 1 }}><label style={S.fLabel}>{t("amount")}</label><input style={S.fInput} type="number" value={amount} onChange={e => { setAmount(e.target.value); if (!originalAmount) setOriginalAmount(e.target.value); }} placeholder="0.00" /></div>
          <div style={{ ...S.fg, flex: 1 }}><label style={S.fLabel}>{t("original")}</label><input style={S.fInput} type="number" value={originalAmount} onChange={e => setOriginalAmount(e.target.value)} placeholder="0.00" /></div>
        </div>
        <div style={S.fRow}>
          <div style={{ ...S.fg, flex: 1 }}><label style={S.fLabel}>{t("dueDate")}</label><input style={S.fInput} type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></div>
          <div style={{ ...S.fg, flex: 1 }}><label style={S.fLabel}>{t("stage")}</label><select style={S.fSelect} value={stage} onChange={e => setStage(e.target.value)}>{STAGE_KEYS.map(s => <option key={s.id} value={s.id}>{t(s.labelKey)}</option>)}</select></div>
        </div>
        <div style={S.fg}><label style={S.fLabel}>{t("noteLabel")}</label><input style={S.fInput} value={notes} onChange={e => setNotes(e.target.value)} placeholder={t("notePlaceholder")} /></div>
        <button style={{ ...S.submitBtn, opacity: ok ? 1 : 0.4 }} disabled={!ok} onClick={() => onAdd({ creditorType, creditorName, amount: parseFloat(amount), originalAmount: parseFloat(originalAmount || amount), dueDate, stage, notes })}>{t("save")}</button>
      </div>
    </div>
  );
}
