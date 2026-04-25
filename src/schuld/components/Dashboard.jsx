import { S } from "../styles/styles";
import { fmt } from "../utils/helpers";
import { useLang } from "../hooks/useLang";
import { getStageData, STAGE_KEYS } from "../constants/creditors";
export function Dashboard({ debts, totalDebt, escalationCost, monthlyIncome, notifications, onViewDebt, onNavigate }) {
  const { t, fmtDate } = useLang();
  const stagePriority = { action_needed: 0, warning: 1, stable: 2 };
  const sortedDebts = [...debts].sort((a, b) => (stagePriority[a.stage] ?? 3) - (stagePriority[b.stage] ?? 3) || b.amount - a.amount);
  const byStage = {}; debts.forEach(d => { byStage[d.stage] = (byStage[d.stage] || 0) + 1; });

  return (
    <div style={S.sc} className="doei-sc screen-in">
      <div style={{ ...S.heroCard, textAlign: "center" }}>
        <div style={S.heroLabel}>{t("totalDebt")}</div>
        <div style={S.heroAmount}>{fmt(totalDebt)}</div>
        <div style={S.heroDivider} />
        <div style={{ ...S.heroStats, justifyContent: "center" }}>
          <div style={S.heroStat}><div style={S.heroStatLabel}>{t("creditors")}</div><div style={S.heroStatVal}>{debts.length}</div></div>
        </div>
      </div>
      <div style={S.cardWarm}>
        <div style={S.cardTitle}>{t("stageOverview")}</div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          {STAGE_KEYS.map(s => (
            <div key={s.id} style={{ flex: 1, textAlign: "center", background: s.color + "18", borderRadius: 12, padding: "12px 8px" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{byStage[s.id] || 0}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: s.color, marginTop: 2 }}>{t(s.labelKey)}</div>
            </div>
          ))}
        </div>
      </div>
      {sortedDebts.map(d => { const s = getStageData(d.stage); const diff = Math.ceil((new Date(d.dueDate) - new Date()) / 864e5); return (
        <button key={d.id} style={{ ...S.debtCard, borderLeftColor: s.color }} className="card-lift" onClick={() => onViewDebt(d)}>
          <div style={S.dcRow}><span style={S.dcName}>{d.creditorName}</span><span style={S.dcAmt}>{fmt(d.amount)}</span></div>
          {d.notes && <div style={S.dcNotes}>{d.notes}</div>}
          <div style={S.dcMeta}><span style={{ ...S.stagePill, backgroundColor: s.color + "22", color: s.color }}>{t(s.labelKey)}</span><span style={S.dcDue}>{diff <= 0 ? t("expired") : fmtDate(d.dueDate)}</span></div>
        </button>
      ); })}
    </div>
  );
}
