import { useState } from "react";
import { createPortal } from "react-dom";
import { S } from "../styles/styles";
import { useLang } from "../hooks/useLang";
import { supabase } from "../../lib/supabase";
import { fmt } from "../utils/helpers";

const BANKS = [
  { id: "ING_INGBNL2A",    name: "ING",        color: "#FF6200", balance: 1240 },
  { id: "ABNANL2A",        name: "ABN AMRO",   color: "#007B5E", balance: 2180 },
  { id: "RABONL2U",        name: "Rabobank",   color: "#CC0000", balance: 847  },
  { id: "SNSBNL2A",        name: "SNS Bank",   color: "#F28C00", balance: 1560 },
  { id: "ASNBNL21",        name: "ASN Bank",   color: "#005C3E", balance: 3200 },
  { id: "TRIONL2U",        name: "Triodos",    color: "#006837", balance: 920  },
  { id: "BUNQNL2A",        name: "bunq",       color: "#3AABF0", balance: 450  },
  { id: "REVOLT21",        name: "Revolut",    color: "#191C1F", balance: 780  },
];

function BankAvatar({ color, name, size = 40 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: Math.round(size * 0.3), background: color, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: Math.round(size * 0.3), fontWeight: 700, flexShrink: 0, letterSpacing: "0.01em" }}>
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

function SourceIcon({ children }) {
  return (
    <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
      {children}
    </div>
  );
}

function SuggestedDebtCard({ s, onAccept, onDismiss }) {
  return (
    <div style={{ background: "var(--paper-2)", borderRadius: 14, padding: "13px 14px", marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-0)" }}>{s.creditor_name}</div>
          <div style={{ fontSize: 12, color: "var(--ink-2)", marginTop: 2, lineHeight: 1.4 }}>{s.description}</div>
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink-0)", flexShrink: 0 }}>{fmt(s.amount)}</div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => onAccept(s)} style={{ flex: 1, height: 36, background: "var(--accent)", color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          Add debt
        </button>
        <button onClick={() => onDismiss(s)} style={{ flex: 1, height: 36, background: "var(--paper-3)", color: "var(--ink-2)", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
          Not mine
        </button>
      </div>
    </div>
  );
}

export function Account({
  profile,
  onSaveProfile,
  connections,
  onConnect,
  onDisconnect,
  onConnectGmail,
  onSyncGmail,
  onDisconnectGmail,
  gmailBusy = false,
  gmailMessage = "",
  gmailError = "",
  session,
  suggestedDebts = [],
  onAcceptSuggested,
  onDismissSuggested,
  onSuggest,
}) {
  const { t } = useLang();
  const [form, setForm] = useState(profile);
  const [edited, setEdited] = useState(false);
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState("");

  const change = (field, val) => { setForm(p => ({ ...p, [field]: val })); setEdited(true); };

  const handleBankConnect = async (bank) => {
    setShowBankPicker(false);
    setConnecting(true);
    setConnectError("");
    try {
      await new Promise(r => setTimeout(r, 1800));
      const suggested = [
        { creditor_name: "Belastingdienst", creditor_type: "belasting", amount: 312, transaction_date: "2026-04-01", description: "Inkomstenbelasting 2024" },
        { creditor_name: "Klarna", creditor_type: "klarna", amount: 89.50, transaction_date: "2026-03-28", description: "3x gespreide betaling webshop" },
        { creditor_name: "CJIB", creditor_type: "cjib", amount: 156, transaction_date: "2026-03-20", description: "Verkeersboete A10" },
        { creditor_name: "DUO", creditor_type: "duo", amount: 234, transaction_date: "2026-03-15", description: "Studieschuld terugbetaling" },
        { creditor_name: "Vattenfall", creditor_type: "energie", amount: 67.80, transaction_date: "2026-03-10", description: "Jaarafrekening gas/stroom" },
        { creditor_name: "Ymere", creditor_type: "huur", amount: 198, transaction_date: "2026-03-05", description: "Huurachterstand maart" },
      ];
      onConnect("bank", { name: bank.name, info: bank.name, balance: bank.balance });
      onSuggest(suggested);
    } catch (err) {
      setConnectError(err.message);
    } finally {
      setConnecting(false);
    }
  };

  const bankConnected = !!connections.bank;
  const gmailConnected = !!connections.gmail;
  const initial = (form.name || session?.user?.email || "?")[0].toUpperCase();

  return (
    <div style={S.sc} className="screen-in">

      {/* ── Profile hero ── */}
      <div style={{
        background: "linear-gradient(140deg, var(--accent) 0%, var(--accent-deep) 60%, #823B25 100%)",
        borderRadius: 20,
        padding: "20px 18px",
        marginBottom: 12,
        color: "white",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: 60, background: "rgba(255,255,255,0.07)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 14, position: "relative", zIndex: 1 }}>
          <div style={{ width: 54, height: 54, borderRadius: 27, background: "rgba(255,255,255,0.22)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, flexShrink: 0, backdropFilter: "blur(8px)" }}>
            {initial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.2 }}>{form.name || "Add your name"}</div>
            <div style={{ fontSize: 13, opacity: 0.75, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{session?.user?.email}</div>
          </div>
        </div>
      </div>

      {/* ── Suggested debts ── */}
      {suggestedDebts.length > 0 && (
        <div style={S.card}>
          <div style={{ ...S.cardTitle, color: "var(--accent)" }}>
            {suggestedDebts.length} detected automatically
          </div>
          {suggestedDebts.map((s, i) => (
            <SuggestedDebtCard key={i} s={s} onAccept={onAcceptSuggested} onDismiss={onDismissSuggested} />
          ))}
        </div>
      )}

      {/* ── Profile settings ── */}
      <div style={S.card}>
        <div style={S.cardTitle}>{t("profile")}</div>
        <div style={{ marginBottom: 12 }}>
          <label style={S.fLabel}>Name</label>
          <input style={{ ...S.fInput, boxSizing: "border-box" }} value={form.name} onChange={e => change("name", e.target.value)} placeholder="Your name" />
        </div>
        <div>
          <label style={S.fLabel}>Phone</label>
          <input style={{ ...S.fInput, boxSizing: "border-box" }} type="tel" value={form.phone} onChange={e => change("phone", e.target.value)} placeholder="+31 6 12 34 56 78" />
        </div>
        {edited && (
          <button style={{ ...S.submitBtn, marginTop: 14 }} onClick={() => { onSaveProfile(form); setEdited(false); }}>
            Save changes
          </button>
        )}
      </div>

      {/* ── Connected sources ── */}
      <div style={S.card}>
        <div style={S.cardTitle}>Connected sources</div>

        {/* Bank row */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 14, borderBottom: "1px solid var(--paper-2)", marginBottom: 14 }}>
          {bankConnected
            ? <BankAvatar color={BANKS.find(b => b.name === connections.bank?.name)?.color || "#666"} name={connections.bank?.name || "BK"} />
            : <SourceIcon>🏦</SourceIcon>
          }
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-0)" }}>
              {bankConnected ? connections.bank?.name : "Bank account"}
            </div>
            {bankConnected ? (
              <div style={{ fontSize: 12, marginTop: 2, display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: 3, background: "var(--stable-fg)", display: "inline-block" }} />
                <span style={{ color: "var(--stable-fg)" }}>{fmt(connections.bank?.balance)} available</span>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: "var(--ink-2)", marginTop: 2 }}>Scan transactions for debts</div>
            )}
          </div>
          {bankConnected ? (
            <button onClick={() => onDisconnect("bank")} style={disconnectBtnStyle}>
              Disconnect
            </button>
          ) : (
            <button
              onClick={() => setShowBankPicker(true)}
              disabled={connecting}
              style={{ ...connectBtnStyle, opacity: connecting ? 0.6 : 1 }}
            >
              {connecting ? "…" : "Connect"}
            </button>
          )}
        </div>

        {/* Gmail row */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <SourceIcon>✉️</SourceIcon>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-0)" }}>Gmail</div>
            {gmailConnected ? (
              <div style={{ fontSize: 12, marginTop: 2, display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: 3, background: "var(--stable-fg)", display: "inline-block" }} />
                <span style={{ color: "var(--stable-fg)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{connections.gmail?.info}</span>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: "var(--ink-2)", marginTop: 2 }}>Auto-detect debt emails</div>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            {gmailConnected && (
              <button onClick={onSyncGmail} disabled={gmailBusy} style={{ ...connectBtnStyle, opacity: gmailBusy ? 0.6 : 1 }}>
                {gmailBusy ? "…" : "Sync"}
              </button>
            )}
            <button
              onClick={gmailConnected ? onDisconnectGmail : onConnectGmail}
              disabled={gmailBusy}
              style={gmailConnected ? disconnectBtnStyle : { ...connectBtnStyle, opacity: gmailBusy ? 0.6 : 1 }}
            >
              {gmailBusy ? "…" : gmailConnected ? "Disconnect" : "Connect"}
            </button>
          </div>
        </div>

        {(gmailError || gmailMessage || connectError) && (
          <div style={{ marginTop: 12, fontSize: 12, lineHeight: 1.5, color: gmailError || connectError ? "var(--action-fg)" : "var(--stable-fg)" }}>
            {gmailError || connectError || gmailMessage}
          </div>
        )}
      </div>

      {/* ── Sign out ── */}
      <button
        onClick={() => supabase.auth.signOut()}
        style={{ width: "100%", height: 46, background: "none", border: "1px solid var(--paper-2)", borderRadius: 14, fontSize: 14, color: "var(--ink-2)", cursor: "pointer", marginTop: 4 }}
      >
        Sign out
      </button>

      {/* ── Bank picker sheet (portalled) ── */}
      {showBankPicker && createPortal(
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1000 }} onClick={() => setShowBankPicker(false)}>
          <div style={{ background: "var(--paper-0)", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 480, maxHeight: "80vh", overflowY: "auto", padding: "20px 18px 44px", boxSizing: "border-box" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 20, fontWeight: 600, color: "var(--ink-0)" }}>Choose your bank</div>
              <button style={S.modalClose} onClick={() => setShowBankPicker(false)}>×</button>
            </div>
            <p style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 18, lineHeight: 1.5 }}>
              We'll scan recent transactions to surface debt repayments as suggestions.
            </p>
            {BANKS.map((bank, i) => (
              <button
                key={bank.id}
                onClick={() => handleBankConnect(bank)}
                style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", padding: "12px 0", background: "none", border: "none", borderBottom: i < BANKS.length - 1 ? "1px solid var(--paper-2)" : "none", cursor: "pointer", textAlign: "left" }}
              >
                <BankAvatar color={bank.color} name={bank.name} />
                <span style={{ fontSize: 15, fontWeight: 600, color: "var(--ink-0)" }}>{bank.name}</span>
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

const connectBtnStyle = {
  height: 34,
  padding: "0 14px",
  background: "var(--accent)",
  color: "white",
  border: "none",
  borderRadius: 10,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  flexShrink: 0,
};

const disconnectBtnStyle = {
  height: 34,
  padding: "0 12px",
  background: "var(--paper-2)",
  color: "var(--ink-2)",
  border: "none",
  borderRadius: 10,
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  flexShrink: 0,
};
