import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <span style={styles.logo}>◉ SchuldWijzer</span>
        <button style={styles.btn} onClick={() => navigate("/app")}>Open app</button>
      </nav>

      <section style={styles.hero}>
        <h1 style={styles.h1}>Take control of your debt</h1>
        <p style={styles.sub}>SchuldWijzer helps you track deadlines, avoid escalation costs, and stay ahead of collectors — all in one place.</p>
        <button style={styles.ctaBtn} onClick={() => navigate("/app")}>Get started for free</button>
      </section>

      <section style={styles.features}>
        {[
          { icon: "📋", title: "Track every debt", desc: "See all your open debts, stages, and due dates at a glance." },
          { icon: "🔔", title: "Smart alerts", desc: "Get notified before a debt escalates to incasso or bailiff." },
          { icon: "📈", title: "Cost projections", desc: "See exactly how much extra you'll owe in 3, 6, and 12 months." },
        ].map((f) => (
          <div key={f.title} style={styles.card}>
            <span style={styles.cardIcon}>{f.icon}</span>
            <h3 style={styles.cardTitle}>{f.title}</h3>
            <p style={styles.cardDesc}>{f.desc}</p>
          </div>
        ))}
      </section>

      <footer style={styles.footer}>© 2025 SchuldWijzer</footer>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#0f0f0f", color: "#fff", fontFamily: "system-ui, sans-serif", display: "flex", flexDirection: "column" },
  nav: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 40px", borderBottom: "1px solid #222" },
  logo: { fontSize: 20, fontWeight: 700, letterSpacing: -0.5 },
  btn: { background: "#fff", color: "#000", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 600, cursor: "pointer", fontSize: 14 },
  hero: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "80px 24px" },
  h1: { fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 800, margin: "0 0 20px", lineHeight: 1.1 },
  sub: { fontSize: 18, color: "#999", maxWidth: 520, margin: "0 0 36px", lineHeight: 1.6 },
  ctaBtn: { background: "#7c3aed", color: "#fff", border: "none", borderRadius: 10, padding: "14px 32px", fontSize: 16, fontWeight: 700, cursor: "pointer" },
  features: { display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap", padding: "60px 40px", borderTop: "1px solid #222" },
  card: { background: "#1a1a1a", borderRadius: 12, padding: "28px 24px", maxWidth: 260, flex: "1 1 220px" },
  cardIcon: { fontSize: 28 },
  cardTitle: { margin: "12px 0 8px", fontSize: 16, fontWeight: 700 },
  cardDesc: { margin: 0, color: "#888", fontSize: 14, lineHeight: 1.5 },
  footer: { textAlign: "center", padding: "24px", color: "#555", fontSize: 13, borderTop: "1px solid #1a1a1a" },
};
