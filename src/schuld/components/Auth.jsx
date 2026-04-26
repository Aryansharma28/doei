import { useState } from "react";
import { supabase } from "../../lib/supabase";

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
    <div style={{
      minHeight: "100vh",
      background: "var(--paper-0)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "0 28px",
    }}>
      <div style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", alignItems: "center" }}>

        {/* Logo */}
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ marginBottom: 10 }}>
          <path d="M5 6 L19 18" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M19 6 L5 18" stroke="var(--ink-0)" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
        <span style={{
          fontFamily: "'Instrument Serif', Georgia, serif",
          fontSize: 38,
          fontWeight: 400,
          letterSpacing: "-0.02em",
          color: "var(--ink-0)",
          lineHeight: 1,
          marginBottom: 8,
        }}>
          doei
        </span>
        <p style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 48, letterSpacing: "0.01em" }}>
          Say goodbye to debt
        </p>

        {/* Form */}
        {!sent ? (
          <div style={{ width: "100%" }}>
            <h2 style={{
              fontSize: 20,
              fontWeight: 600,
              color: "var(--ink-0)",
              marginBottom: 6,
              letterSpacing: "-0.02em",
              textAlign: "center",
            }}>
              Sign in
            </h2>
            <p style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 20, textAlign: "center", lineHeight: 1.5 }}>
              We'll email you a magic link — no password needed.
            </p>
            <form onSubmit={send} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                autoFocus
                style={{
                  width: "100%",
                  padding: "15px 16px",
                  background: "var(--paper-1)",
                  border: "1.5px solid var(--paper-3)",
                  borderRadius: 14,
                  fontSize: 16,
                  color: "var(--ink-0)",
                  boxSizing: "border-box",
                  outline: "none",
                  fontFamily: "inherit",
                  textAlign: "center",
                }}
              />
              {error && (
                <p style={{ fontSize: 13, color: "var(--action-fg)", textAlign: "center", margin: 0 }}>{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  height: 52,
                  background: "var(--accent)",
                  color: "white",
                  border: "none",
                  borderRadius: 14,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: loading ? "default" : "pointer",
                  opacity: loading ? 0.6 : 1,
                  fontFamily: "inherit",
                  letterSpacing: "-0.01em",
                  transition: "opacity 0.15s",
                }}
              >
                {loading ? "Sending…" : "Continue →"}
              </button>
            </form>
          </div>
        ) : (
          <div style={{ width: "100%", textAlign: "center" }}>
            <div style={{
              width: 56,
              height: 56,
              background: "var(--accent-tint)",
              borderRadius: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              fontSize: 26,
            }}>
              ✉️
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: "var(--ink-0)", marginBottom: 10, letterSpacing: "-0.02em" }}>
              Check your email
            </h2>
            <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.7 }}>
              Sent a sign-in link to<br />
              <strong style={{ color: "var(--ink-0)" }}>{email}</strong>
            </p>
            <button
              style={{ marginTop: 28, fontSize: 13, color: "var(--ink-2)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", textDecorationColor: "var(--paper-3)", fontFamily: "inherit" }}
              onClick={() => setSent(false)}
            >
              Use a different email
            </button>
          </div>
        )}

        <p style={{ fontSize: 12, color: "var(--ink-3)", textAlign: "center", marginTop: 40, lineHeight: 1.6 }}>
          Your data is stored securely with Supabase.
        </p>
      </div>
    </div>
  );
}
