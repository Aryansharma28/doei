import { useState, useEffect, useCallback, useRef, useLayoutEffect } from "react";
import { LangContext } from "./context/LangContext";
import { Dashboard } from "./components/Dashboard";
import { DebtDetail } from "./components/DebtDetail";
import { Advisor } from "./components/Advisor";
import { Alerts } from "./components/Alerts";
import { Account } from "./components/Account";
import { AddDebtModal } from "./components/AddDebtModal";
import { S } from "./styles/styles";
import { globalCSS, storage, fmt } from "./utils/helpers";
import { translations } from "./utils/i18n";
import { DEMO_DEBTS, DEMO_INCOME } from "./constants/demoData";
import { getCreditor, getStageData } from "./constants/creditors";
import { supabase } from "../lib/supabase";

/* ── doei wordmark — X-mark + serif "doei" ─────────────── */
const DoeiLogo = ({ size = 22 }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M5 6 L19 18" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M19 6 L5 18" stroke="var(--ink-0)" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
    <span style={{
      fontFamily: "'Instrument Serif', 'Source Serif 4', Georgia, serif",
      fontSize: Math.round(size * 1.05),
      fontWeight: 400,
      letterSpacing: "-0.01em",
      lineHeight: 1,
      color: "var(--ink-0)",
    }}>doei</span>
  </div>
);

const Icon = ({ name, size = 18 }) => {
  const c = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "home":     return <svg {...c}><path d="M3 11l9-8 9 8" /><path d="M5 9.5V21h14V9.5" /></svg>;
    case "scan":     return <svg {...c}><path d="M3 8V5a2 2 0 012-2h3M21 8V5a2 2 0 00-2-2h-3M3 16v3a2 2 0 002 2h3M21 16v3a2 2 0 01-2 2h-3" /><path d="M7 12h10" /></svg>;
    case "sparkle":  return <svg {...c}><path d="M12 3l1.8 5.5L19 10l-5.2 1.5L12 17l-1.8-5.5L5 10l5.2-1.5L12 3z" /></svg>;
    case "user":     return <svg {...c}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
    case "bell":     return <svg {...c}><path d="M6 8a6 6 0 1112 0c0 7 3 9 3 9H3s3-2 3-9z" /><path d="M10 21a2 2 0 004 0" /></svg>;
    case "moon":     return <svg {...c}><path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" /></svg>;
    case "sun":      return <svg {...c}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>;
    case "chev":     return <svg {...c}><path d="M6 9l6 6 6-6" /></svg>;
    default: return null;
  }
};

const FlagUK = ({ size = 22 }) => (
  <svg width={size} height={Math.round(size * 0.6)} viewBox="0 0 60 40" style={{ borderRadius: 3, flexShrink: 0, display: "block" }}>
    <rect width="60" height="40" fill="#012169"/>
    <path d="M0,0 L60,40 M60,0 L0,40" stroke="white" strokeWidth="9"/>
    <path d="M0,0 L60,40 M60,0 L0,40" stroke="#C8102E" strokeWidth="6"/>
    <path d="M30,0 V40 M0,20 H60" stroke="white" strokeWidth="14"/>
    <path d="M30,0 V40 M0,20 H60" stroke="#C8102E" strokeWidth="9"/>
  </svg>
);
const FlagNL = ({ size = 22 }) => (
  <svg width={size} height={Math.round(size * 0.6)} viewBox="0 0 60 40" style={{ borderRadius: 3, flexShrink: 0, display: "block" }}>
    <rect width="60" height="13.33" fill="#AE1C28"/>
    <rect y="13.33" width="60" height="13.34" fill="white"/>
    <rect y="26.67" width="60" height="13.33" fill="#21468B"/>
  </svg>
);

export default function SchuldOverzicht() {
  const [lang, setLang] = useState("en");
  const [screen, setScreen] = useState("dashboard");
  const [debts, setDebts] = useState(DEMO_DEBTS);
  const [income, setIncome] = useState(DEMO_INCOME);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [scanInitData, setScanInitData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("doei-theme") || "light");
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [profile, setProfile] = useState({ name: "", email: "", phone: "" });
  const [connections, setConnections] = useState({});
  const scanRef = useRef();

  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("doei-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === "light" ? "dark" : "light");

  useEffect(() => {
    if (!showLangMenu) return;
    const close = () => setShowLangMenu(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [showLangMenu]);

  const LANGS = [{ code: "en", Flag: FlagUK, label: "English" }, { code: "nl", Flag: FlagNL, label: "Nederlands" }];
  const currentLang = LANGS.find(l => l.code === lang) || LANGS[0];

  const t = useCallback((key) => translations[lang]?.[key] || translations.en[key] || key, [lang]);
  const fmtDate = useCallback((d) => new Date(d).toLocaleDateString(lang === "nl" ? "nl-NL" : "en-GB", { day: "numeric", month: "short" }), [lang]);

  useEffect(() => {
    (async () => {
      const saved = await storage.get("app-data-v4");
      if (saved) {
        if (saved.debts) setDebts(saved.debts);
        if (saved.income) setIncome(saved.income);
        if (saved.lang) setLang(saved.lang);
        if (saved.profile) setProfile(saved.profile);
        if (saved.connections) setConnections(saved.connections);
      }
      setLoaded(true);
    })();
  }, []);

  useEffect(() => { if (loaded) storage.set("app-data-v4", { debts, income, lang, profile, connections }); }, [debts, income, lang, profile, connections, loaded]);

  useEffect(() => {
    const today = new Date();
    const notifs = [];
    debts.forEach(d => {
      const due = new Date(d.dueDate);
      const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
      if (diff <= 3 && diff >= 0) {
        const credLabel = t(getCreditor(d.creditorType).labelKey);
        const timeStr = diff === 0 ? t("dueToday") : (diff > 1 ? t("dueInPlural").replace("{n}", diff) : t("dueIn").replace("{n}", diff));
        notifs.push({ type: "urgent", text: `${credLabel}: ${fmt(d.amount)} ${t("expires")} ${timeStr}`, debtId: d.id });
      }
      if (d.stage === "action_needed") {
        const credLabel = t(getCreditor(d.creditorType).labelKey);
        const stageLabel = t(getStageData(d.stage).labelKey);
        notifs.push({ type: "escalation", text: `${credLabel} ${t("inPhase").replace("{stage}", stageLabel)}`, debtId: d.id });
      }
    });
    setNotifications(notifs);
  }, [debts, t]);

  const totalDebt = debts.reduce((s, d) => s + d.amount, 0);
  const totalOriginal = debts.reduce((s, d) => s + d.originalAmount, 0);
  const escalationCost = totalDebt - totalOriginal;
  const monthlyIncome = income.reduce((s, i) => s + i.amount, 0);
  const addDebt = (debt) => { setDebts(prev => [...prev, { ...debt, id: `d${Date.now()}`, createdAt: new Date().toISOString().slice(0, 10) }]); setShowAddDebt(false); setScanInitData(null); };
  const deleteDebt = (id) => { setDebts(prev => prev.filter(d => d.id !== id)); setSelectedDebt(null); };
  const connectIntegration = (id, data) => setConnections(prev => ({ ...prev, [id]: data }));
  const disconnectIntegration = (id) => setConnections(prev => { const n = { ...prev }; delete n[id]; return n; });

  const handleScan = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      const b64 = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result.split(",")[1]); r.onerror = () => rej(new Error("fail")); r.readAsDataURL(file); });
      const { data, error } = await supabase.functions.invoke("analyze-document", { body: { data: b64, mimeType: file.type || "image/jpeg" } });
      if (!error && data) setScanInitData(data);
    } catch {}
    setShowAddDebt(true);
  };

  const tabs = [
    { id: "dashboard", icon: "home",    lk: "overview" },
    { id: "upload",    icon: "scan",    lk: "scan",     action: () => scanRef.current?.click() },
    { id: "calendar",  icon: "sparkle", lk: "advisor"  },
    { id: "account",   icon: "user",    lk: "account"  },
  ];

  return (
    <LangContext.Provider value={{ lang, t, fmtDate }}>
      <div style={S.app} className="doei-app">
        <style>{globalCSS}</style>

        {/* ── Header ── */}
        <header style={S.header}>
          <div style={S.headerInner}>
            <DoeiLogo size={22} />
            <div style={S.headerRight}>
              <button style={S.iconBtn} onClick={toggleTheme} aria-label="Toggle theme">
                <Icon name={theme === "light" ? "moon" : "sun"} size={16} />
              </button>
              <button style={S.iconBtn} onClick={() => setScreen("alerts")} aria-label="Notifications">
                <Icon name="bell" size={16} />
                {notifications.length > 0 && <span style={S.notifDot} />}
              </button>
              <div style={{ position: "relative" }} onClick={e => e.stopPropagation()}>
                <button style={S.langDropBtn} onClick={() => setShowLangMenu(v => !v)}>
                  <currentLang.Flag size={20} />
                  <Icon name="chev" size={11} />
                </button>
                {showLangMenu && (
                  <div style={S.langDropMenu}>
                    {LANGS.map((l, i) => (
                      <button key={l.code} style={{ ...S.langDropItem, ...(lang === l.code ? S.langDropItemActive : {}), ...(i === LANGS.length - 1 ? { borderBottom: "none" } : {}) }} onClick={() => { setLang(l.code); setShowLangMenu(false); }}>
                        <l.Flag size={26} />
                        <span>{l.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* ── Main content ── */}
        <main style={S.main}>
          {screen === "dashboard" && <Dashboard debts={debts} totalDebt={totalDebt} escalationCost={escalationCost} monthlyIncome={monthlyIncome} notifications={notifications} onViewDebt={(d) => { setSelectedDebt(d); setScreen("detail"); }} onNavigate={setScreen} />}
          {screen === "detail" && selectedDebt && <DebtDetail debt={selectedDebt} income={income} onBack={() => setScreen("dashboard")} onDelete={deleteDebt} />}
          {screen === "calendar" && <Advisor debts={debts} income={income} />}
          {screen === "alerts" && <Alerts notifications={notifications} onViewDebt={(id) => { setSelectedDebt(debts.find(d => d.id === id)); setScreen("detail"); }} />}
          {screen === "account" && <Account profile={profile} onSaveProfile={setProfile} connections={connections} onConnect={connectIntegration} onDisconnect={disconnectIntegration} />}
        </main>

        <input ref={scanRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleScan} />
        {showAddDebt && <AddDebtModal onAdd={addDebt} onClose={() => { setShowAddDebt(false); setScanInitData(null); }} initialData={scanInitData} />}

        {/* ── Floating pill nav ── */}
        <nav style={S.nav}>
          {tabs.map(tab => {
            const active = screen === tab.id;
            return (
              <button key={tab.id} style={{ ...S.navBtn, ...(active ? S.navBtnActive : {}) }} onClick={() => tab.action ? tab.action() : setScreen(tab.id)}>
                <Icon name={tab.icon} size={17} />
                {active && <span>{t(tab.lk)}</span>}
              </button>
            );
          })}
        </nav>
      </div>
    </LangContext.Provider>
  );
}
