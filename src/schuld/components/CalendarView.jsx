import { S } from "../styles/styles";
import { fmt } from "../utils/helpers";
import { useLang } from "../hooks/useLang";

export function CalendarView({ debts, income }) {
  const { t, lang } = useLang();
  const today = new Date();
  const dim = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: dim }, (_, i) => i + 1);
  const dbd = {}; debts.forEach(d => { const dt = new Date(d.dueDate); if (dt.getMonth() === today.getMonth() && dt.getFullYear() === today.getFullYear()) { const day = dt.getDate(); if (!dbd[day]) dbd[day] = []; dbd[day].push(d); } });
  const ibd = {}; income.forEach(i => { if (!ibd[i.day]) ibd[i.day] = []; ibd[i.day].push(i); });
  const mn = today.toLocaleDateString(lang === "nl" ? "nl-NL" : "en-GB", { month: "long", year: "numeric" });
  return (
    <div style={S.sc}><h2 style={S.screenTitle}>{t("calendarTitle")}</h2><div style={S.cardSub}>{mn}</div>
      <div style={S.calLeg}><span style={S.calLI}><span style={{ ...S.calDot, backgroundColor: "#81B29A" }} /> {t("income")}</span><span style={S.calLI}><span style={{ ...S.calDot, backgroundColor: "#E07A5F" }} /> {t("payment")}</span></div>
      <div style={S.calGrid}>{days.map(day => { const isT = day === today.getDate(); const hD = dbd[day]; const hI = ibd[day]; const isP = day < today.getDate(); return (
        <div key={day} style={{ ...S.calDay, ...(isT ? S.calToday : {}), ...(isP ? { opacity: 0.5 } : {}) }}>
          <div style={S.calDayNum}>{day}</div>
          <div style={S.calDayDots}>{hI && <span style={{ ...S.calDot, backgroundColor: "#81B29A" }} />}{hD && <span style={{ ...S.calDot, backgroundColor: "#E07A5F" }} />}</div>
          {hD && <div style={S.calDayAmt}>{fmt(hD.reduce((s, d) => s + d.amount, 0))}</div>}
          {hI && <div style={{ ...S.calDayAmt, color: "#81B29A" }}>{fmt(hI.reduce((s, i) => s + i.amount, 0))}</div>}
        </div>
      ); })}</div>
    </div>
  );
}
