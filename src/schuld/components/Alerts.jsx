import { S } from "../styles/styles";
import { useLang } from "../hooks/useLang";

export function Alerts({ notifications, onViewDebt }) {
  const { t } = useLang();
  const urgent = notifications.filter(n => n.type === "urgent");
  const escalations = notifications.filter(n => n.type === "escalation");

  return (
    <div style={{ ...S.sc, minHeight: "calc(100vh - 120px)", display: "flex", flexDirection: "column" }} className="doei-sc screen-in">
      <h2 style={S.screenTitle}>{t("alerts")}</h2>
      {notifications.length === 0
        ? <div style={S.empty}>{t("noAlerts")}</div>
        : <>
            {urgent.length > 0 && (
              <>
                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 0.8, margin: "16px 0 8px" }}>Due soon</p>
                {urgent.map((n, i) => (
                  <button key={i} style={S.alertCard} className="card-lift" onClick={() => n.debtId && onViewDebt(n.debtId)}>
                    <span style={{ fontSize: 20 }}>⏰</span>
                    <span style={S.alertText}>{n.text}</span>
                    <span style={S.alertArrow}>→</span>
                  </button>
                ))}
              </>
            )}
            {escalations.length > 0 && (
              <>
                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 0.8, margin: "16px 0 8px" }}>Escalations</p>
                {escalations.map((n, i) => (
                  <button key={i} style={S.alertCard} className="card-lift" onClick={() => n.debtId && onViewDebt(n.debtId)}>
                    <span style={{ fontSize: 20 }}>⚠️</span>
                    <span style={S.alertText}>{n.text}</span>
                    <span style={S.alertArrow}>→</span>
                  </button>
                ))}
              </>
            )}
            <div style={{ marginTop: "auto", paddingTop: 32, textAlign: "center" }}>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Tap any alert to view the debt and take action.<br />
                Alerts clear automatically when resolved.
              </p>
            </div>
          </>
      }
    </div>
  );
}
