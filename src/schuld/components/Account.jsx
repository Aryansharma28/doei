import { useState } from "react";
import { S } from "../styles/styles";
import { useLang } from "../hooks/useLang";
import { supabase } from "../../lib/supabase";
import { fmt } from "../utils/helpers";

const BANKS = [
  { id: "ING_INGBNL2A",    name: "ING",        color: "#FF6200" },
  { id: "ABNANL2A",        name: "ABN AMRO",   color: "#007B5E" },
  { id: "RABONL2U",        name: "Rabobank",   color: "#CC0000" },
  { id: "SNSBNL2A",        name: "SNS Bank",   color: "#F28C00" },
  { id: "ASNBNL21",        name: "ASN Bank",   color: "#005C3E" },
  { id: "TRIONL2U",        name: "Triodos",    color: "#006837" },
  { id: "BUNQNL2A",        name: "bunq",       color: "#3AABF0" },
  { id: "REVOLT21",        name: "Revolut",    color: "#191C1F" },
];

function BankLogo({ color, name }) {
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <div style={{ width: 44, height: 44, borderRadius: 14, background: color, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function SuggestedDebtCard({ s, onAccept, onDismiss }) {
  return (
    <div style={{ background: "var(--paper-1)", borderRadius: 16, padding: "14px 16px", marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-0)" }}>{s.creditor_name}</div>
          <div style={{ fontSize: 12, color: "var(--ink-2)", marginTop: 2 }}>{s.description}</div>
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink-0)", flexShrink: 0 }}>{fmt(s.amount)}</div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => onAccept(s)}
          style={{ flex: 1, height: 38, background: "var(--accent)", color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          Add debt
        </button>
        <button
          onClick={() => onDismiss(s)}
          style={{ flex: 1, height: 38, background: "var(--paper-2)", color: "var(--ink-1)", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: "pointer" }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

export function Account({ profile, onSaveProfile, connections, onConnect, onDisconnect, session, suggestedDebts = [], onAcceptSuggested, onDismissSuggested, onSuggest }) {
  const { t } = useLang();
  const [form, setForm] = useState(profile);
  const [edited, setEdited] = useState(false);
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState("");
  const [gmailSyncing, setGmailSyncing] = useState(false);
  const [gmailError, setGmailError] = useState("");
  const [gmailStatus, setGmailStatus] = useState("");

  const change = (field, val) => { setForm(p => ({ ...p, [field]: val })); setEdited(true); };

  const handleBankConnect = async (bank) => {
    setShowBankPicker(false);
    setConnecting(true);
    setConnectError("");
    try {
      // Mock: simulate bank scan with realistic Dutch transactions
      await new Promise(r => setTimeout(r, 1800));
      const suggested = [
        { creditor_name: "Belastingdienst", creditor_type: "belasting", amount: 312, transaction_date: "2026-04-01", description: "Inkomstenbelasting 2024" },
        { creditor_name: "Klarna", creditor_type: "klarna", amount: 89.50, transaction_date: "2026-03-28", description: "3x gespreide betaling webshop" },
        { creditor_name: "CJIB", creditor_type: "cjib", amount: 156, transaction_date: "2026-03-20", description: "Verkeersboete A10" },
        { creditor_name: "DUO", creditor_type: "duo", amount: 234, transaction_date: "2026-03-15", description: "Studieschuld terugbetaling" },
        { creditor_name: "Vattenfall", creditor_type: "energie", amount: 67.80, transaction_date: "2026-03-10", description: "Jaarafrekening gas/stroom" },
        { creditor_name: "Ymere", creditor_type: "huur", amount: 198, transaction_date: "2026-03-05", description: "Huurachterstand maart" },
      ];
      onConnect("bank", { name: bank.name, info: bank.name });
      onSuggest(suggested);
    } catch (err) {
      setConnectError(err.message);
    } finally {
      setConnecting(false);
    }
  };

  const handleSignOut = () => supabase.auth.signOut();
  const handleGmailSync = async () => {
    setGmailSyncing(true);
    setGmailError("");
    setGmailStatus("");

    try {
      const res = await fetch("/api/gmail/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: session?.user?.id }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to sync Gmail");

      onConnect("gmail", { name: "Gmail", info: session?.user?.email || "Connected" });
      if (data.suggested?.length) {
        onSuggest(prev => {
          const current = prev || [];
          const seen = new Set(current.map(item => item.email_id || `${item.creditor_name}-${item.transaction_date}-${item.amount}`));
          const next = [...current];
          data.suggested.forEach(item => {
            const key = item.email_id || `${item.creditor_name}-${item.transaction_date}-${item.amount}`;
            if (!seen.has(key)) {
              seen.add(key);
              next.unshift(item);
            }
          });
          return next;
        });
      }
      setGmailStatus(
        data.suggested?.length
          ? `Found ${data.suggested.length} debt-related ${data.suggested.length === 1 ? "email" : "emails"}`
          : "No debt-related emails found in the latest sync"
      );
    } catch (err) {
      setGmailError(err.message);
    } finally {
      setGmailSyncing(false);
    }
  };

  const bankConnected = !!connections.bank;
  const gmailConnected = !!connections.gmail;

  return (
    <div style={S.sc} className="screen-in">
      {/* Suggested debts banner */}
      {suggestedDebts.length > 0 && (
        <div style={{ marginBottom: 4 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink-0)", marginBottom: 10 }}>
            Detected from your bank — {suggestedDebts.length} possible {suggestedDebts.length === 1 ? "debt" : "debts"}
          </div>
          {suggestedDebts.map((s, i) => (
            <SuggestedDebtCard key={i} s={s} onAccept={onAcceptSuggested} onDismiss={onDismissSuggested} />
          ))}
        </div>
      )}

      {/* Profile */}
      <div style={S.card}>
        <div style={S.cardTitle}>Profile</div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
          <div style={{ width: 52, height: 52, borderRadius: 26, background: "var(--accent)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 600, flexShrink: 0 }}>
            {(form.name || session?.user?.email || "?")[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink-0)" }}>{form.name || "—"}</div>
            <div style={{ fontSize: 13, color: "var(--ink-2)" }}>{session?.user?.email}</div>
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>Name</label>
          <input style={{ ...S.fInput, boxSizing: "border-box" }} value={form.name} onChange={e => change("name", e.target.value)} placeholder="Your name" />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>Phone</label>
          <input style={{ ...S.fInput, boxSizing: "border-box" }} type="tel" value={form.phone} onChange={e => change("phone", e.target.value)} placeholder="+31 6 12 34 56 78" />
        </div>
        {edited && (
          <button style={S.submitBtn} onClick={() => { onSaveProfile(form); setEdited(false); }}>
            Save changes
          </button>
        )}
      </div>

      {/* Bank connection */}
      <div style={S.card}>
        <div style={S.cardTitle}>Bank</div>
        {bankConnected ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-0)" }}>{connections.bank?.name}</div>
              <div style={{ fontSize: 12, color: "var(--stable-fg)", marginTop: 2 }}>Connected · syncing transactions</div>
            </div>
            <button
              onClick={() => onDisconnect("bank")}
              style={{ background: "var(--paper-2)", border: "none", borderRadius: 10, padding: "7px 14px", fontSize: 13, color: "var(--ink-1)", cursor: "pointer" }}
            >
              Disconnect
            </button>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 14, lineHeight: 1.5 }}>
              Connect your bank via PSD2 open banking. We'll scan for debt repayments and suggest them automatically.
            </p>
            {connectError && <p style={{ fontSize: 13, color: "var(--action-fg)", marginBottom: 10 }}>{connectError}</p>}
            <button
              onClick={() => setShowBankPicker(true)}
              disabled={connecting}
              style={{ width: "100%", height: 48, background: connecting ? "var(--paper-2)" : "var(--accent)", color: connecting ? "var(--ink-2)" : "white", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: connecting ? "default" : "pointer" }}
            >
              {connecting ? "Connecting…" : "Connect bank →"}
            </button>
          </>
        )}
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>Gmail</div>
        <p style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 14, lineHeight: 1.5 }}>
          Search your recent Gmail inbox via the server-side MCP and flag debt-related emails as suggested debts.
        </p>
        {gmailError && <p style={{ fontSize: 13, color: "var(--action-fg)", marginBottom: 10 }}>{gmailError}</p>}
        {gmailStatus && <p style={{ fontSize: 13, color: "var(--stable-fg)", marginBottom: 10 }}>{gmailStatus}</p>}
        {gmailConnected && (
          <div style={{ fontSize: 12, color: "var(--stable-fg)", marginBottom: 10 }}>
            Connected as {connections.gmail?.info}
          </div>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleGmailSync}
            disabled={gmailSyncing}
            style={{ flex: 1, height: 48, background: gmailSyncing ? "var(--paper-2)" : "var(--accent)", color: gmailSyncing ? "var(--ink-2)" : "white", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: gmailSyncing ? "default" : "pointer" }}
          >
            {gmailSyncing ? "Checking Gmail…" : gmailConnected ? "Sync Gmail now" : "Connect Gmail"}
          </button>
          {gmailConnected && (
            <button
              onClick={() => onDisconnect("gmail")}
              style={{ background: "var(--paper-2)", border: "none", borderRadius: 12, padding: "0 14px", fontSize: 13, color: "var(--ink-1)", cursor: "pointer" }}
            >
              Disconnect
            </button>
          )}
        </div>
      </div>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        style={{ width: "100%", height: 48, background: "none", border: "1.5px solid var(--paper-2)", borderRadius: 12, fontSize: 14, color: "var(--ink-2)", cursor: "pointer", marginTop: 4 }}
      >
        Sign out
      </button>

      {/* Bank picker modal */}
      {showBankPicker && (
        <div style={S.modalOL} onClick={() => setShowBankPicker(false)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <div style={S.modalHdr}>
              <span style={S.modalTitle}>Choose your bank</span>
              <button style={S.modalClose} onClick={() => setShowBankPicker(false)}>×</button>
            </div>
            <p style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 16, lineHeight: 1.5 }}>
              You'll be redirected to your bank to authorise read-only access.
            </p>
            {BANKS.map((bank, i) => (
              <button
                key={bank.id}
                style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", padding: "12px 0", background: "none", border: "none", borderBottom: i < BANKS.length - 1 ? "1px solid var(--paper-2)" : "none", cursor: "pointer", textAlign: "left" }}
                onClick={() => handleBankConnect(bank)}
              >
                <BankLogo color={bank.color} name={bank.name} />
                <span style={{ fontSize: 15, fontWeight: 600, color: "var(--ink-0)" }}>{bank.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
