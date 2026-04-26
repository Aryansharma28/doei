import { useState } from "react";
import { supabase } from "../../lib/supabase";

const DoeiLogo = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M5 6 L19 18" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M19 6 L5 18" stroke="var(--ink-0)" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
    <span style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 30, fontWeight: 400, letterSpacing: "-0.01em", lineHeight: 1, color: "var(--ink-0)" }}>doei</span>
  </div>
);

export function Auth() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const send = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin + "/app" },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper-0)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 28px" }}>
      <div style={{ width: "100%", maxWidth: 360 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 48 }}>
          <DoeiLogo />
        </div>

        {!sent ? (
          <>
            <h1 style={{ fontSize: 26, fontWeight: 600, color: "var(--ink-0)", marginBottom: 8, letterSpacing: "-0.02em", textAlign: "center", fontFamily: "'Instrument Serif', Georgia, serif" }}>
              Sign in
            </h1>
            <p style={{ fontSize: 14, color: "var(--ink-2)", marginBottom: 32, textAlign: "center", lineHeight: 1.6 }}>
              We'll email you a magic link — no password needed.
            </p>
            <form onSubmit={send}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                autoFocus
                style={{ width: "100%", padding: "14px 16px", background: "var(--paper-1)", border: "1.5px solid var(--paper-2)", borderRadius: 14, fontSize: 15, color: "var(--ink-0)", marginBottom: 10, boxSizing: "border-box", outline: "none" }}
              />
              {error && (
                <p style={{ fontSize: 13, color: "var(--action-fg)", marginBottom: 10 }}>{error}</p>
              )}
              <button
                type="submit"
                disabled={loading || !email.trim()}
                style={{ width: "100%", height: 52, background: loading || !email.trim() ? "var(--paper-2)" : "var(--accent)", color: loading || !email.trim() ? "var(--ink-2)" : "white", border: "none", borderRadius: 14, fontSize: 15, fontWeight: 600, cursor: loading ? "default" : "pointer", transition: "background 0.15s" }}
              >
                {loading ? "Sending…" : "Continue →"}
              </button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 64, height: 64, background: "var(--accent-tint)", borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 28 }}>
              ✉️
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--ink-0)", marginBottom: 10, letterSpacing: "-0.02em" }}>Check your email</h2>
            <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.7 }}>
              We sent a sign-in link to <br />
              <strong style={{ color: "var(--ink-0)" }}>{email}</strong>
            </p>
            <button
              style={{ marginTop: 28, fontSize: 13, color: "var(--ink-2)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", textDecorationColor: "var(--paper-3)" }}
              onClick={() => setSent(false)}
            >
              Use a different email
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
