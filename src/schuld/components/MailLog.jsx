import { S } from "../styles/styles";
import { fmt } from "../utils/helpers";
import { useLang } from "../hooks/useLang";
import { getCreditor } from "../constants/creditors";

export function MailLog({ mail, onViewDebt }) {
  const { t, fmtDate } = useLang();
  const sorted = [...mail].sort((a, b) => new Date(b.date) - new Date(a.date));
  const sLabel = { action: t("actionNeeded"), done: t("handled"), escalated: t("escalated") };
  const sColor = { action: "#E07A5F", done: "#81B29A", escalated: "#9B2226" };
  return (
    <div style={S.sc} className="doei-sc screen-in"><h2 style={S.screenTitle}>{t("mailOverview")}</h2><div style={{ ...S.cardSub, marginBottom: 16 }}>{t("mailSub")}</div>
      {sorted.map(m => { const c = getCreditor(m.creditorType); return (
        <button key={m.id} style={{ ...S.mailCard, borderLeftColor: sColor[m.status] }} className="card-lift" onClick={() => onViewDebt(m.debtId)}>
          <div style={S.mcTop}><span style={{ fontSize: 22 }}>{c.icon}</span><span style={S.mcCred}>{t(c.labelKey)}</span><span style={S.mcDate}>{fmtDate(m.date)}</span></div>
          <div style={S.mcSubj}>{m.subject}</div>
          <div style={S.mcBot}><span style={{ ...S.statusPill, backgroundColor: sColor[m.status] + "18", color: sColor[m.status] }}>{sLabel[m.status]}</span><span style={S.mcAmt}>{fmt(m.amount)}</span></div>
        </button>
      ); })}
    </div>
  );
}
