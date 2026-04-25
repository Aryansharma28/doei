import { S } from "../styles/styles";
import { fmt } from "../utils/helpers";
import { useLang } from "../hooks/useLang";
import { getCreditor, getStageData } from "../constants/creditors";

export function DebtList({ debts, onSelect, onAdd }) {
  const { t, fmtDate } = useLang();
  const sorted = [...debts].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  return (
    <div style={S.sc}>
      <div style={S.screenHeader}><h2 style={S.screenTitle}>{t("allDebts")}</h2><button style={S.addBtn} onClick={onAdd}>{t("add")}</button></div>
      {sorted.map(d => { const c = getCreditor(d.creditorType); const s = getStageData(d.stage); const diff = Math.ceil((new Date(d.dueDate) - new Date()) / 864e5); return (
        <button key={d.id} style={S.debtCard} onClick={() => onSelect(d)}>
          <div style={S.dcLeft}><span style={{ fontSize: 28 }}>{c.icon}</span></div>
          <div style={S.dcCenter}><div style={S.dcName}>{d.creditorName}</div><div style={S.dcNotes}>{d.notes}</div><div style={S.dcMeta}><span style={{ ...S.stagePill, backgroundColor: s.color + "22", color: s.color }}>{t(s.labelKey)}</span><span style={S.dcDue}>{diff <= 0 ? t("expired") : fmtDate(d.dueDate)}</span></div></div>
          <div style={S.dcRight}><div style={S.dcAmt}>{fmt(d.amount)}</div>{d.amount > d.originalAmount && <div style={S.dcOrig}>was {fmt(d.originalAmount)}</div>}</div>
        </button>
      ); })}
    </div>
  );
}
