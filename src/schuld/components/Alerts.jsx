import { S } from "../styles/styles";
import { useLang } from "../hooks/useLang";

export function Alerts({ notifications, onViewDebt }) {
  const { t } = useLang();
  return (
    <div style={S.sc}><h2 style={S.screenTitle}>{t("alerts")}</h2>
      {notifications.length === 0 && <div style={S.empty}>{t("noAlerts")}</div>}
      {notifications.map((n, i) => <button key={i} style={S.alertCard} onClick={() => n.debtId && onViewDebt(n.debtId)}><span style={{ fontSize: 20 }}>{n.type === "urgent" ? "⏰" : "⚠️"}</span><span style={S.alertText}>{n.text}</span><span style={S.alertArrow}>→</span></button>)}
    </div>
  );
}
