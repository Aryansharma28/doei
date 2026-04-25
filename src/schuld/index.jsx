import { useState, useEffect, useCallback, useRef, useLayoutEffect } from "react";
import { LangContext } from "./context/LangContext";
import { Dashboard } from "./components/Dashboard";
import { DebtDetail } from "./components/DebtDetail";
import { Advisor } from "./components/Advisor";
import { Alerts } from "./components/Alerts";
import { AddDebtModal } from "./components/AddDebtModal";
import { S } from "./styles/styles";
import { globalCSS, storage, fmt } from "./utils/helpers";
import { translations } from "./utils/i18n";
import { DEMO_DEBTS, DEMO_INCOME } from "./constants/demoData";
import { getCreditor, getStageData } from "./constants/creditors";
import { supabase } from "../lib/supabase";

const IconHome = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><path d="M9 21V12h6v9"/>
  </svg>
);
const IconCamera = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
  </svg>
);
const IconMessage = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const IconSun = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);
const IconMoon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
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
  const scanRef = useRef();

  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("doei-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === "light" ? "dark" : "light");

  const t = useCallback((key) => translations[lang]?.[key] || translations.en[key] || key, [lang]);
  const fmtDate = useCallback((d) => new Date(d).toLocaleDateString(lang === "nl" ? "nl-NL" : "en-GB", { day: "numeric", month: "short" }), [lang]);

  useEffect(() => {
    (async () => {
      const saved = await storage.get("app-data-v4");
      if (saved) {
        if (saved.debts) setDebts(saved.debts);
        if (saved.income) setIncome(saved.income);
        if (saved.lang) setLang(saved.lang);
      }
      setLoaded(true);
    })();
  }, []);

  useEffect(() => { if (loaded) storage.set("app-data-v4", { debts, income, lang }); }, [debts, income, lang, loaded]);

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
    { id: "dashboard", icon: <IconHome />,    lk: "overview" },
    { id: "upload",    icon: <IconCamera />,  lk: "scan",    action: () => scanRef.current?.click() },
    { id: "calendar",  icon: <IconMessage />, lk: "advisor"  },
  ];

  return (
    <LangContext.Provider value={{ lang, t, fmtDate }}>
      <div style={S.app} className="doei-app">
        <style>{globalCSS}</style>

        {/* ── Desktop sidebar ── */}
        <aside className="doei-sidebar">
          <div className="doei-sidebar-logo">
            <svg width="30" height="30" viewBox="0 0 120 120" style={{ flexShrink: 0 }}>
              <g transform="translate(60,60) scale(0.52)">
                <ellipse cx="-22" cy="-22" rx="18" ry="28" transform="rotate(-45 -22 -22)" fill="#5CC8C8"/>
                <ellipse cx="22" cy="-22" rx="18" ry="28" transform="rotate(45 22 -22)" fill="#F0C246"/>
                <ellipse cx="-22" cy="22" rx="18" ry="28" transform="rotate(45 -22 22)" fill="#7B6CB2"/>
                <ellipse cx="22" cy="22" rx="18" ry="28" transform="rotate(-45 22 22)" fill="#C49090"/>
              </g>
            </svg>
            <span className="doei-sidebar-logo-text">doei</span>
          </div>
          <nav className="doei-sidebar-nav">
            {tabs.map(tab => (
              <button key={tab.id} className={`doei-sidebar-btn${screen === tab.id ? " active" : ""}`} onClick={() => tab.action ? tab.action() : setScreen(tab.id)}>
                <span className="doei-sidebar-icon">{tab.icon}</span>
                {t(tab.lk)}
              </button>
            ))}
          </nav>
          <div className="doei-sidebar-bottom">
            <button className="doei-sidebar-add" onClick={() => { setScanInitData(null); setShowAddDebt(true); }}>
              + {t("addDebt")}
            </button>
            <button className="doei-sidebar-lang" onClick={() => setLang(l => l === "nl" ? "en" : "nl")}>
              <span className={`doei-sidebar-lang-opt${lang === "en" ? " active" : ""}`}>EN</span>
              <span className={`doei-sidebar-lang-opt${lang === "nl" ? " active" : ""}`}>NL</span>
            </button>
            <button className="doei-sidebar-theme" onClick={toggleTheme}>
              <span>{theme === "light" ? "Dark mode" : "Light mode"}</span>
              {theme === "light" ? <IconMoon /> : <IconSun />}
            </button>
          </div>
        </aside>

        {/* ── Mobile header ── */}
        <header style={S.header} className="doei-header">
          <div style={S.headerInner}>
            <div style={S.logo}>
              <svg width="30" height="30" viewBox="0 0 120 120" style={{ flexShrink: 0 }}>
                <g transform="translate(60,60) scale(0.52)">
                  <ellipse cx="-22" cy="-22" rx="18" ry="28" transform="rotate(-45 -22 -22)" fill="#5CC8C8"/>
                  <ellipse cx="22" cy="-22" rx="18" ry="28" transform="rotate(45 22 -22)" fill="#F0C246"/>
                  <ellipse cx="-22" cy="22" rx="18" ry="28" transform="rotate(45 -22 22)" fill="#7B6CB2"/>
                  <ellipse cx="22" cy="22" rx="18" ry="28" transform="rotate(-45 22 22)" fill="#C49090"/>
                </g>
              </svg>
              <span style={S.logoText}>doei</span>
            </div>
            <div style={S.headerRight}>
              <button style={S.themeBtn} onClick={toggleTheme}>
                {theme === "light" ? <IconMoon /> : <IconSun />}
              </button>
              <button style={S.langToggle} onClick={() => setLang(l => l === "nl" ? "en" : "nl")}>
                <span style={{ ...S.langOpt, ...(lang === "en" ? S.langActive : {}) }}>EN</span>
                <span style={{ ...S.langOpt, ...(lang === "nl" ? S.langActive : {}) }}>NL</span>
              </button>
            </div>
          </div>
        </header>

        {/* ── Main content ── */}
        <main style={S.main} className="doei-main">
          {screen === "dashboard" && <Dashboard debts={debts} totalDebt={totalDebt} escalationCost={escalationCost} monthlyIncome={monthlyIncome} notifications={notifications} onViewDebt={(d) => { setSelectedDebt(d); setScreen("detail"); }} onNavigate={setScreen} />}
          {screen === "detail" && selectedDebt && <DebtDetail debt={selectedDebt} onBack={() => setScreen("dashboard")} onDelete={deleteDebt} />}
          {screen === "calendar" && <Advisor debts={debts} income={income} />}
          {screen === "alerts" && <Alerts notifications={notifications} onViewDebt={(id) => { setSelectedDebt(debts.find(d => d.id === id)); setScreen("detail"); }} />}
        </main>

        <input ref={scanRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleScan} />
        {showAddDebt && <AddDebtModal onAdd={addDebt} onClose={() => { setShowAddDebt(false); setScanInitData(null); }} initialData={scanInitData} />}
<nav style={S.nav} className="doei-nav">
          {tabs.map(tab => (
            <button key={tab.id} style={{ ...S.navBtn, ...(screen === tab.id ? S.navBtnActive : {}) }} onClick={() => tab.action ? tab.action() : setScreen(tab.id)}>
              {tab.icon}<span style={S.navLabel}>{t(tab.lk)}</span>
            </button>
          ))}
        </nav>
      </div>
    </LangContext.Provider>
  );
}
