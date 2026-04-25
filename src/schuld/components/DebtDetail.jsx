import { S } from "../styles/styles";
import { fmt } from "../utils/helpers";
import { useLang } from "../hooks/useLang";
import { getCreditor, getStageData } from "../constants/creditors";

export function DebtDetail({ debt, mail, onBack, onDelete }) {
  const { t, fmtDate } = useLang();
  const c = getCreditor(debt.creditorType); const s = getStageData(debt.stage); const ci = debt.amount - debt.originalAmount;
  const typeLabel = c.type === "public" ? t("typePublic") : c.type === "semi-public" ? t("typeSemiPublic") : t("typePrivate");
  const typeColor = c.type === "public" ? "#3D405B" : c.type === "semi-public" ? "#457B9D" : "#6C757D";
  return (
    <div style={S.sc}>
      <button style={S.backBtn} onClick={onBack}>{t("back")}</button>
      <div style={S.detailHdr}><span style={{ fontSize: 40 }}>{c.icon}</span><h2 style={S.detailName}>{debt.creditorName}</h2><div style={S.detailAmt}>{fmt(debt.amount)}</div><span style={{ ...S.stagePill, backgroundColor: s.color + "22", color: s.color, fontSize: 14, padding: "6px 14px" }}>{t(s.labelKey)}</span></div>
      <div style={S.card}>
        <div style={S.dRow}><span style={S.dLabel}>{t("originalAmount")}</span><span>{fmt(debt.originalAmount)}</span></div>
        <div style={S.dRow}><span style={S.dLabel}>{t("collectionFees")}</span><span style={{ color: ci > 0 ? "#E07A5F" : "inherit" }}>{ci > 0 ? `+${fmt(ci)}` : "—"}</span></div>
        <div style={S.dRow}><span style={S.dLabel}>{t("dueDate")}</span><span>{fmtDate(debt.dueDate)}</span></div>
        <div style={S.dRow}><span style={S.dLabel}>{t("created")}</span><span>{fmtDate(debt.createdAt)}</span></div>
        <div style={S.dRow}><span style={S.dLabel}>{t("creditorTypeLabel")}</span><span style={{ ...S.typePill, backgroundColor: typeColor + "18", color: typeColor }}>{typeLabel}</span></div>
        <div style={S.dRow}><span style={S.dLabel}>{t("channel")}</span><span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{c.channel}</span></div>
        <div style={S.dRow}><span style={S.dLabel}>{t("notes")}</span><span>{debt.notes}</span></div>
      </div>
      {mail.length > 0 && <div style={S.card}><div style={S.cardTitle}>{t("correspondence")}</div>{mail.map(m => <div key={m.id} style={S.mailRow}><div style={S.mailDate}>{fmtDate(m.date)}</div><div style={S.mailSubj}>{m.subject}</div><span style={{ ...S.statusDot, backgroundColor: m.status === "action" ? "#E07A5F" : m.status === "escalated" ? "#9B2226" : "#81B29A" }} /></div>)}</div>}
      <button style={S.deleteBtn} onClick={() => onDelete(debt.id)}>{t("deleteDebt")}</button>
    </div>
  );
}
