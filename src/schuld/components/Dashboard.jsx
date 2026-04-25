import { S } from "../styles/styles";
import { fmt } from "../utils/helpers";
import { useLang } from "../hooks/useLang";
import { getCreditor, getStageData, STAGE_KEYS } from "../constants/creditors";
export function Dashboard({ debts, totalDebt, escalationCost, monthlyIncome, notifications, onViewDebt, onNavigate }) {
  const { t } = useLang();
  const byCreditor = {}; debts.forEach(d => { byCreditor[d.creditorType] = (byCreditor[d.creditorType] || 0) + d.amount; });
  const sorted = Object.entries(byCreditor).sort((a, b) => b[1] - a[1]);
  const urgentDebts = debts.filter(d => { const diff = Math.ceil((new Date(d.dueDate) - new Date()) / 864e5); return diff <= 7 && diff >= 0; }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
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
      <div style={S.card}>
        <div style={S.cardTitle}>{t("stageOverview")}</div>
        <div style={S.stageBar}>{STAGE_KEYS.map(s => { const d = byStage[s.id]; if (!d) return null; return <div key={s.id} style={{ ...S.stageSeg, width: `${Math.max((d.amount / totalDebt) * 100, 8)}%`, backgroundColor: s.color }} />; })}</div>
        <div style={S.stageLegend}>{STAGE_KEYS.map(s => { const d = byStage[s.id]; if (!d) return null; return (<div key={s.id} style={S.stageLI}><span style={{ ...S.stageDot, backgroundColor: s.color }} /><span style={S.stageLL}>{t(s.labelKey)}</span><span style={S.stageLV}>{d.count}× {fmt(d.amount)}</span></div>); })}</div>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>{t("perCreditor")}</div>
        {sorted.map(([type, amount]) => { const c = getCreditor(type); const pct = (amount / totalDebt) * 100; return (
          <div key={type} style={S.bRow}><span style={S.bIcon}>{c.icon}</span><div style={S.bInfo}><div style={S.bLabel}>{t(c.labelKey)}</div><div style={S.bBarOut}><div style={{ ...S.bBarIn, width: `${pct}%`, backgroundColor: c.color }} /></div></div><span style={S.bAmt}>{fmt(amount)}</span></div>
        ); })}
      </div>
    </div>
  );
}
