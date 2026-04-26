import { useState, useEffect } from "react";
import { VoiceCallModal } from "./VoiceCallModal";

// Drop-in button for the advisor screen. Opens the voice call modal.
// Pass the same `debts` and `income` props the chat advisor receives — the
// modal forwards them to the token endpoint, which embeds them in the
// LiveKit room metadata so the agent can read them on connect.
//
// Auto-opens the modal when the URL contains ?voice=1 — this is how Google
// Calendar reminders for scheduled follow-ups land the user directly in a
// call instead of making them hunt for the button.
export function VoiceCallButton({ debts, income, lang, firstName }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("voice") === "1") {
      setOpen(true);
      params.delete("voice");
      const next = params.toString();
      window.history.replaceState(
        null,
        "",
        window.location.pathname + (next ? `?${next}` : "")
      );
    }
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 16px",
          borderRadius: 999,
          background: "var(--accent, #0070f3)",
          color: "white",
          border: "none",
          fontWeight: 600,
          fontSize: 14,
          cursor: "pointer",
        }}
      >
        <span style={{ fontSize: 16 }}>🎙</span>
        {lang === "nl" ? "Bel je adviseur" : "Call your advisor"}
      </button>
      {open && (
        <VoiceCallModal
          debts={debts}
          income={income}
          lang={lang}
          firstName={firstName}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
