import { S } from "../styles/styles";
import { fmt } from "../utils/helpers";
import { useLang } from "../hooks/useLang";
import { getStageData } from "../constants/creditors";

export function DebtList({ debts, onSelect, onAdd }) {
  const { t, fmtDate } = useLang();
  const sorted = [...debts].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  return (
    <div style={S.sc} className="doei-sc screen-in">
      <div style={S.screenHeader}><h2 style={S.screenTitle}>{t("allDebts")}</h2><button style={S.addBtn} onClick={onAdd}>{t("add")}</button></div>
      {sorted.map(d => { const s = getStageData(d.stage); const diff = Math.ceil((new Date(d.dueDate) - new Date()) / 864e5); return (
        <button key={d.id} style={{ ...S.debtCard, borderLeftColor: s.color }} className="card-lift" onClick={() => onSelect(d)}>
          <div style={S.dcRow}><span style={S.dcName}>{d.creditorName}</span><span style={S.dcAmt}>{fmt(d.amount)}</span></div>
          {d.notes && <div style={S.dcNotes}>{d.notes}</div>}
          <div style={S.dcMeta}><span style={{ ...S.stagePill, backgroundColor: s.color + "22", color: s.color }}>{t(s.labelKey)}</span><span style={S.dcDue}>{diff <= 0 ? t("expired") : fmtDate(d.dueDate)}</span></div>
        </button>
      ); })}
    </div>
  );
}
