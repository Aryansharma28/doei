import { useState, useEffect } from "react";
import { S } from "../styles/styles";
import { useLang } from "../hooks/useLang";
import { CREDITOR_TYPES, STAGE_KEYS } from "../constants/creditors";

export function AddDebtModal({ onAdd, onClose, initialData }) {
  const { t } = useLang();
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const [creditorType, setCreditorType] = useState(initialData?.creditorType || "");
  const [creditorName, setCreditorName] = useState(initialData?.creditorName || "");
  const [amount, setAmount] = useState(initialData?.amount ? String(initialData.amount) : "");
  const [originalAmount, setOriginalAmount] = useState(initialData?.originalAmount ? String(initialData.originalAmount) : initialData?.amount ? String(initialData.amount) : "");
  const [dueDate, setDueDate] = useState(initialData?.dueDate || "");
  const [stage, setStage] = useState(initialData?.stage || "stable");
  const [notes, setNotes] = useState(initialData?.notes || "");

  const ok = creditorType && creditorName && amount && dueDate;
  return (
    <div style={S.modalOL} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <div style={S.modalHdr}><h3 style={S.modalTitle}>{t("addDebt")}</h3><button style={S.modalClose} onClick={onClose}>×</button></div>
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
