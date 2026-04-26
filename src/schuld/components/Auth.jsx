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

  const signInWithGoogle = async () => {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/app" },
    });
    if (error) { setError(error.message); setLoading(false); }
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

            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0" }}>
              <div style={{ flex: 1, height: 1, background: "var(--paper-3)" }} />
              <span style={{ fontSize: 12, color: "var(--ink-3)" }}>or</span>
              <div style={{ flex: 1, height: 1, background: "var(--paper-3)" }} />
            </div>

            <button
              onClick={signInWithGoogle}
              disabled={loading}
              style={{
                width: "100%",
                height: 52,
                background: "var(--paper-1)",
                color: "var(--ink-0)",
                border: "1.5px solid var(--paper-3)",
                borderRadius: 14,
                fontSize: 15,
                fontWeight: 500,
                cursor: loading ? "default" : "pointer",
                opacity: loading ? 0.6 : 1,
                fontFamily: "inherit",
                letterSpacing: "-0.01em",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                transition: "opacity 0.15s",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
              </svg>
              Continue with Google
            </button>
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
