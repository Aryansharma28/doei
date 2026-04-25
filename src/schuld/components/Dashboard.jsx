import { S } from "../styles/styles";
import { fmt } from "../utils/helpers";
import { useLang } from "../hooks/useLang";
import { getStageData, STAGE_KEYS } from "../constants/creditors";
export function Dashboard({ debts, totalDebt, escalationCost, monthlyIncome, notifications, onViewDebt, onNavigate }) {
  const { t, fmtDate } = useLang();
  const sortedDebts = [...debts].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  const byStage = {}; debts.forEach(d => { if (!byStage[d.stage]) byStage[d.stage] = { count: 0, amount: 0 }; byStage[d.stage].count++; byStage[d.stage].amount += d.amount; });

  return (
    <div style={S.sc} className="doei-sc screen-in">
      <div style={S.heroCard}>
        <div style={S.heroLabel}>{t("totalDebt")}</div>
        <div style={S.heroAmount}>{fmt(totalDebt)}</div>
        <div style={S.heroDivider} />
        <div style={S.heroStats}>
          <div style={S.heroStat}><div style={S.heroStatLabel}>{t("creditors")}</div><div style={S.heroStatVal}>{debts.length}</div></div>
        </div>
      </div>
      <div style={S.cardWarm}>
        <div style={S.cardTitle}>{t("stageOverview")}</div>
        <div style={S.stageBar}>{STAGE_KEYS.map(s => { const d = byStage[s.id]; if (!d) return null; return <div key={s.id} style={{ ...S.stageSeg, width: `${Math.max((d.amount / totalDebt) * 100, 8)}%`, backgroundColor: s.color }} />; })}</div>
        <div style={S.stageLegend}>{STAGE_KEYS.map(s => { const d = byStage[s.id]; if (!d) return null; const pct = Math.round((d.amount / totalDebt) * 100); return (<div key={s.id} style={S.stageLI}><span style={{ ...S.stageDot, backgroundColor: s.color }} /><span style={S.stageLL}>{t(s.labelKey)}</span><span style={S.stageLV}>{fmt(d.amount)}</span><span style={S.stagePct}>{pct}%</span></div>); })}</div>
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
