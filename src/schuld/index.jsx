import { useState, useEffect, useCallback } from "react";
import { LangContext } from "./context/LangContext";
import { Dashboard } from "./components/Dashboard";
import { DebtList } from "./components/DebtList";
import { DebtDetail } from "./components/DebtDetail";
import { MailLog } from "./components/MailLog";
import { Advisor } from "./components/Advisor";
import { Alerts } from "./components/Alerts";
import { AddDebtModal } from "./components/AddDebtModal";
import { S } from "./styles/styles";
import { globalCSS, storage, fmt } from "./utils/helpers";
import { translations } from "./utils/i18n";
import { DEMO_DEBTS, DEMO_MAIL, DEMO_INCOME } from "./constants/demoData";
import { getCreditor, getStageData } from "./constants/creditors";

export default function SchuldOverzicht() {
  const [lang, setLang] = useState("en");
  const [screen, setScreen] = useState("dashboard");
  const [debts, setDebts] = useState(DEMO_DEBTS);
  const [mail, setMail] = useState(DEMO_MAIL);
  const [income, setIncome] = useState(DEMO_INCOME);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const t = useCallback((key) => translations[lang]?.[key] || translations.en[key] || key, [lang]);
  const fmtDate = useCallback((d) => new Date(d).toLocaleDateString(lang === "nl" ? "nl-NL" : "en-GB", { day: "numeric", month: "short" }), [lang]);

  useEffect(() => {
    (async () => {
      const saved = await storage.get("app-data-v4");
      if (saved) {
        if (saved.debts) setDebts(saved.debts);
        if (saved.mail) setMail(saved.mail);
        if (saved.income) setIncome(saved.income);
        if (saved.lang) setLang(saved.lang);
      }
      setLoaded(true);
    })();
  }, []);

  useEffect(() => { if (loaded) storage.set("app-data-v4", { debts, mail, income, lang }); }, [debts, mail, income, lang, loaded]);

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
      if (d.stage === "incasso" || d.stage === "deurwaarder") {
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
  const projectDebt = (months) => debts.reduce((total, d) => {
    const rate = (d.stage === "incasso" || d.stage === "deurwaarder") ? 0.02 : (d.stage === "aanmaning" ? 0.01 : 0.005);
    return total + d.amount * Math.pow(1 + rate, months);
  }, 0);
  const projected3 = projectDebt(3);
  const projected6 = projectDebt(6);
  const projected12 = projectDebt(12);

  const addDebt = (debt) => { setDebts(prev => [...prev, { ...debt, id: `d${Date.now()}`, createdAt: new Date().toISOString().slice(0, 10) }]); setShowAddDebt(false); };
  const deleteDebt = (id) => { setDebts(prev => prev.filter(d => d.id !== id)); setMail(prev => prev.filter(m => m.debtId !== id)); setSelectedDebt(null); };

  return (
    <LangContext.Provider value={{ lang, t, fmtDate }}>
      <div style={S.app}>
        <style>{globalCSS}</style>
        <header style={S.header}>
          <div style={S.headerInner}>
            <div style={S.logo}><span style={S.logoIcon}>◉</span><span style={S.logoText}>Doei Debt</span></div>
            <div style={S.headerRight}>
              <button style={S.langToggle} onClick={() => setLang(l => l === "nl" ? "en" : "nl")}>
                <span style={{ ...S.langOpt, ...(lang === "en" ? S.langActive : {}) }}>EN</span>
                <span style={{ ...S.langOpt, ...(lang === "nl" ? S.langActive : {}) }}>NL</span>
              </button>
              {notifications.length > 0 && (
                <button style={S.notifBadge} onClick={() => setScreen("alerts")}>
                  <span>🔔</span><span style={S.notifCount}>{notifications.length}</span>
                </button>
              )}
            </div>
          </div>
        </header>
        <main style={S.main}>
          {screen === "dashboard" && <Dashboard debts={debts} totalDebt={totalDebt} escalationCost={escalationCost} projected3={projected3} projected6={projected6} projected12={projected12} monthlyIncome={monthlyIncome} notifications={notifications} onViewDebt={(d) => { setSelectedDebt(d); setScreen("detail"); }} onNavigate={setScreen} />}
          {screen === "debts" && <DebtList debts={debts} onSelect={(d) => { setSelectedDebt(d); setScreen("detail"); }} onAdd={() => setShowAddDebt(true)} />}
          {screen === "detail" && selectedDebt && <DebtDetail debt={selectedDebt} mail={mail.filter(m => m.debtId === selectedDebt.id)} onBack={() => setScreen("debts")} onDelete={deleteDebt} />}
          {screen === "mail" && <MailLog mail={mail} onViewDebt={(id) => { setSelectedDebt(debts.find(d => d.id === id)); setScreen("detail"); }} />}
          {screen === "calendar" && <Advisor debts={debts} income={income} />}
          {screen === "alerts" && <Alerts notifications={notifications} onViewDebt={(id) => { setSelectedDebt(debts.find(d => d.id === id)); setScreen("detail"); }} />}
        </main>
        {showAddDebt && <AddDebtModal onAdd={addDebt} onClose={() => setShowAddDebt(false)} />}
        <button style={S.fab} onClick={() => setShowAddDebt(true)}><span style={{ fontSize: 28, lineHeight: 1 }}>+</span></button>
        <nav style={S.nav}>
          {[{ id: "dashboard", icon: "◉", lk: "overview" }, { id: "debts", icon: "☰", lk: "debts" }, { id: "mail", icon: "✉", lk: "mail" }, { id: "calendar", icon: "💬", lk: "advisor" }].map(tab => (
            <button key={tab.id} style={{ ...S.navBtn, ...(screen === tab.id ? S.navBtnActive : {}) }} onClick={() => setScreen(tab.id)}>
              <span style={{ fontSize: 20 }}>{tab.icon}</span><span style={S.navLabel}>{t(tab.lk)}</span>
            </button>
          ))}
        </nav>
      </div>
    </LangContext.Provider>
  );
}
