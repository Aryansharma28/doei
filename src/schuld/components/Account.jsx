import { useState } from "react";
import { S } from "../styles/styles";
import { useLang } from "../hooks/useLang";

const serif = "'Source Serif 4', Georgia, serif";

const BANKS = [
  { id: "ing",     name: "ING",        color: "#FF6200" },
  { id: "abn",     name: "ABN AMRO",   color: "#00A650" },
  { id: "rabo",    name: "Rabobank",   color: "#CC0000" },
  { id: "sns",     name: "SNS Bank",   color: "#F28C00" },
  { id: "asn",     name: "ASN Bank",   color: "#005C3E" },
  { id: "triodos", name: "Triodos",    color: "#006837" },
  { id: "bunq",    name: "bunq",       color: "#3AABF0" },
  { id: "revolut", name: "Revolut",    color: "#191C1F" },
];

function Initials({ name }) {
  const letters = name
    ? name.trim().split(/\s+/).map(n => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";
  return (
    <div style={{ width: 72, height: 72, borderRadius: 36, background: "linear-gradient(135deg, #3D405B, #5C6090)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700, flexShrink: 0 }}>
      {letters}
    </div>
  );
}

function IntegRow({ integ, connection, onConnect, onDisconnect, t }) {
  const connected = !!connection;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: "1px solid var(--border-color)" }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: integ.iconBg, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 800, flexShrink: 0 }}>
        {integ.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2, flexWrap: "wrap" }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>{integ.label}</span>
          {connected && (
            <span style={{ fontSize: 11, fontWeight: 700, color: "#16A34A", background: "#DCFCE7", padding: "2px 7px", borderRadius: 6 }}>
              {t("connected")}
            </span>
          )}
        </div>
        <div style={{ fontSize: 13, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {connected && connection.info ? connection.info : integ.description}
        </div>
      </div>
      {connected ? (
        <button style={{ background: "none", border: "1px solid var(--border-color)", borderRadius: 8, padding: "7px 12px", fontSize: 13, color: "var(--text-secondary)", cursor: "pointer", flexShrink: 0 }} onClick={() => onDisconnect(integ.id)}>
          {t("disconnect")}
        </button>
      ) : (
        <button style={{ background: "#3D405B", color: "white", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", flexShrink: 0 }} onClick={() => onConnect(integ.id)}>
          {t("connectBtn")}
        </button>
      )}
    </div>
  );
}

export function Account({ profile, onSaveProfile, connections, onConnect, onDisconnect }) {
  const { t } = useLang();
  const [form, setForm] = useState(profile);
  const [edited, setEdited] = useState(false);
  const [showBankPicker, setShowBankPicker] = useState(false);

  const change = (field, val) => {
    setForm(p => ({ ...p, [field]: val }));
    setEdited(true);
  };

  const integrations = [
    {
      id: "gmail",
      label: "Gmail",
      description: t("gmailDesc"),
      iconBg: "#EA4335",
      icon: "G",
    },
    {
      id: "bank",
      label: t("bankAccount"),
      description: t("bankDesc"),
      iconBg: "#1A73E8",
      icon: "🏦",
    },
    {
      id: "digid",
      label: "DigiD",
      description: t("digiDDesc"),
      iconBg: "#E17000",
      icon: "D",
    },
  ];

  const handleConnect = (id) => {
    if (id === "bank") { setShowBankPicker(true); return; }
    onConnect(id, {});
  };

  return (
    <div style={S.sc}>
      <div style={S.screenHeader}>
        <span style={S.screenTitle}>{t("account")}</span>
      </div>

      {/* Avatar + display name */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24, gap: 8 }}>
        <Initials name={form.name} />
        {form.name && (
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: serif, color: "var(--text-primary)" }}>{form.name}</div>
        )}
        {form.email && (
          <div style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: -4 }}>{form.email}</div>
        )}
      </div>

      {/* Profile */}
      <div style={S.card}>
        <div style={S.cardTitle}>{t("profile")}</div>
        <div style={S.fg}>
          <label style={S.fLabel}>{t("profileName")}</label>
          <input style={{ ...S.fInput, boxSizing: "border-box" }} value={form.name} onChange={e => change("name", e.target.value)} placeholder={t("profileNamePh")} />
        </div>
        <div style={S.fg}>
          <label style={S.fLabel}>{t("profileEmail")}</label>
          <input style={{ ...S.fInput, boxSizing: "border-box" }} type="email" value={form.email} onChange={e => change("email", e.target.value)} placeholder="naam@example.nl" />
        </div>
        <div style={S.fg}>
          <label style={S.fLabel}>{t("profilePhone")}</label>
          <input style={{ ...S.fInput, boxSizing: "border-box" }} type="tel" value={form.phone} onChange={e => change("phone", e.target.value)} placeholder="+31 6 12 34 56 78" />
        </div>
        {edited && (
          <button style={S.submitBtn} onClick={() => { onSaveProfile(form); setEdited(false); }}>
            {t("saveChanges")}
          </button>
        )}
      </div>

      {/* Integrations */}
      <div style={S.card}>
        <div style={S.cardTitle}>{t("integrations")}</div>
        <div style={{ ...S.cardSub, marginBottom: 4 }}>{t("integrationsSub")}</div>
        {integrations.map(integ => (
          <IntegRow key={integ.id} integ={integ} connection={connections[integ.id]} onConnect={handleConnect} onDisconnect={onDisconnect} t={t} />
        ))}
        <div style={{ height: 1 }} /> {/* remove last border */}
      </div>

      {/* Bank picker */}
      {showBankPicker && (
        <div style={S.modalOL} onClick={() => setShowBankPicker(false)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <div style={S.modalHdr}>
              <span style={S.modalTitle}>{t("chooseBank")}</span>
              <button style={S.modalClose} onClick={() => setShowBankPicker(false)}>×</button>
            </div>
            {BANKS.map((bank, i) => (
              <button key={bank.id} style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", padding: "13px 0", background: "none", border: "none", borderBottom: i < BANKS.length - 1 ? "1px solid var(--border-color)" : "none", cursor: "pointer", textAlign: "left" }}
                onClick={() => { onConnect("bank", { name: bank.name, info: bank.name }); setShowBankPicker(false); }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: bank.color, flexShrink: 0 }} />
                <span style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>{bank.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
