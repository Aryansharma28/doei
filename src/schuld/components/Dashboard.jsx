import { useState, useMemo } from "react";
import { S } from "../styles/styles";
import { fmt } from "../utils/helpers";
import { useLang } from "../hooks/useLang";
import { getStageData, STAGE_KEYS } from "../constants/creditors";

/* ── Creditor avatar — initials in tinted square ───────── */
function CreditorAvatar({ creditor, size = 40 }) {
  const initials = (creditor.creditorName || "??")
    .split(/[\s/]+/)
    .map(w => w.match(/[\p{L}]/u)?.[0] || "")
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";
  // Per-creditor accent (warm, deterministic from id)
  const palette = ["#C25A3C", "#1E5BA8", "#0B6E4F", "#7A4FB8", "#0F4C81", "#0B3D2E", "#A33A2C"];
  const hash = (creditor.creditorType || creditor.id || "").split("").reduce((a, ch) => a + ch.charCodeAt(0), 0);
  const color = palette[hash % palette.length];
  return (
    <div style={{
      width: size, height: size,
      borderRadius: Math.round(size * 0.28),
      background: color + "18",
      color: color,
      display: "grid", placeItems: "center",
      fontWeight: 600, fontSize: Math.round(size * 0.32),
      letterSpacing: "0.02em",
      flexShrink: 0,
      border: "1px solid " + color + "24",
    }}>{initials}</div>
  );
}

/* ── Stage chip — pill with dot ────────────────────────── */
function StageChip({ stage, label }) {
  const s = getStageData(stage);
  return (
    <span style={{ ...S.stageChip, color: s.color, background: s.bg }}>
      <span style={{ ...S.stageChipDot, background: s.color }} />
      {label}
    </span>
  );
}

export function Dashboard({ debts, totalDebt, escalationCost, monthlyIncome, notifications, onViewDebt, onNavigate, bankBalance, bankName }) {
  const { t, fmtDate } = useLang();
  const [filter, setFilter] = useState(null);

  const byStage = useMemo(() => {
    const acc = { stable: 0, warning: 0, action_needed: 0 };
    debts.forEach(d => { acc[d.stage] = (acc[d.stage] || 0) + 1; });
    return acc;
  }, [debts]);

  const dueThisWeek = useMemo(() => {
    const now = new Date();
    const week = new Date(now); week.setDate(week.getDate() + 7);
    return debts.filter(d => {
      const due = new Date(d.dueDate);
      return due >= now && due <= week;
    }).length;
  }, [debts]);

  const filtered = useMemo(() => {
    const stagePriority = { action_needed: 0, warning: 1, stable: 2 };
    return [...debts]
      .sort((a, b) => (stagePriority[a.stage] ?? 3) - (stagePriority[b.stage] ?? 3) || b.amount - a.amount)
      .filter(d => !filter || d.stage === filter);
  }, [debts, filter]);

  const dueLabel = (dueDate) => {
    const diff = Math.ceil((new Date(dueDate) - new Date()) / 864e5);
    if (diff < 0) return t("expired");
    if (diff === 0) return t("today");
    return fmtDate(dueDate);
  };

  return (
    <div style={S.scFlush} className="screen-in">
      {/* ── Hero gradient card ── */}
      <div style={S.heroWrap}>
        <div style={S.hero}>
          <div style={S.heroBlobA} />
          <div style={S.heroBlobB} />
          <div style={S.heroInner}>
            <div style={S.heroLabel}>{t("totalDebt")}</div>
            <div style={S.heroAmount} className="tabular">{fmt(totalDebt)}</div>
            <div style={S.heroMeta}>
              <span style={S.heroMetaItem}>
                <BankIcon />
                {debts.length} {t("creditors").toLowerCase()}
              </span>
              {dueThisWeek > 0 && (
                <span style={S.heroMetaItem}>
                  <CalIcon />
                  {dueThisWeek} {t("dueThisWeek") || "due this week"}
                </span>
              )}
              {bankBalance != null && bankName && (
                <span style={{ ...S.heroMetaItem, color: "rgba(255,255,255,0.7)" }}>
                  <WalletIcon />
                  {fmt(bankBalance)} in {bankName}
                </span>
              )}
            </div>
            <button style={S.heroCta} onClick={() => onNavigate("calendar")}>
              <SparkIcon />
              {t("askAdvisorCta") || "Ask the advisor what to do"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Stage filter cards ── */}
      <div style={S.stageRow}>
        {STAGE_KEYS.map(s => {
          const active = filter === s.id;
          return (
            <button key={s.id} style={{
              ...S.stageCard,
              background: s.tint,
              outline: active ? `1.5px solid ${s.color}` : "none",
            }} onClick={() => setFilter(active ? null : s.id)}>
              <span style={{ ...S.stageCardLabel, color: s.color }}>{t(s.labelKey)}</span>
              <span style={{ ...S.stageCardCount, color: s.color }} className="tabular">{byStage[s.id] || 0}</span>
            </button>
          );
        })}
      </div>

      {/* ── Creditor list ── */}
      <div style={S.listSection}>
        <div style={S.listHeader}>
          <span style={S.listTitle}>{t("creditors")}</span>
          {filter && (
            <button style={S.listAction} onClick={() => setFilter(null)}>
              {t("clearFilter") || "Clear filter"}
            </button>
          )}
        </div>
        <div style={S.listStack}>
          {filtered.map(d => {
            const sd = getStageData(d.stage);
            return (
              <button key={d.id} style={S.debtCard} className="card-lift" onClick={() => onViewDebt(d)}>
                <CreditorAvatar creditor={d} size={40} />
                <div style={S.dcBody}>
                  <div style={S.dcName}>{d.creditorName}</div>
                  <div style={S.dcMeta}>
                    <StageChip stage={d.stage} label={t(sd.labelKey)} />
                    <span style={S.dcDue}>{dueLabel(d.dueDate)}</span>
                  </div>
                </div>
                <span style={S.dcAmt} className="tabular">{fmt(d.amount)}</span>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ ...S.empty, padding: "32px 12px" }}>{t("noResults") || "Nothing here yet."}</div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Tiny inline icons used in hero ────────────────────── */
const BankIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 10l9-6 9 6M5 10v8M19 10v8M9 10v8M15 10v8M3 21h18" />
  </svg>
);
const CalIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" />
  </svg>
);
const WalletIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 11h.01M2 7l10-5 10 5" />
  </svg>
);
const SparkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.8 5.5L19 10l-5.2 1.5L12 17l-1.8-5.5L5 10l5.2-1.5L12 3z" />
  </svg>
);
