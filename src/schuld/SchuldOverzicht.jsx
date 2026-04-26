import { useState, useEffect, useCallback, useRef, createContext, useContext } from "react";

// ─── i18n System ───
const translations = {
  nl: {
    overview: "Overzicht", debts: "Schulden", mail: "Post", calendar: "Kalender", scan: "Scan",
    totalDebt: "Totale schuld", collectionCosts: "incassokosten", debtsCount: "Schulden",
    creditors: "Schuldeisers", incomeMonth: "Inkomen/mnd",
    debtTrajectory: "Schuldverloop", projectionSub: "Projectie als er niets verandert",
    now: "Nu", months3: "3 mnd", months6: "6 mnd", months12: "12 mnd",
    m3: "3m", m6: "6m", m12: "12m",
    stageOverview: "Stadium overzicht",
    stage_stable: "Stabiel", stage_warning: "Waarschuwing", stage_action_needed: "Actie vereist",
    invoice: "Factuur", reminder: "Herinnering", collection_agency: "Incassobureau",
    bailiff: "Deurwaarder", summons: "Dagvaarding",
    perCreditor: "Per schuldeiser",
    dueSoon: "⚠ Binnenkort te betalen",
    today: "Vandaag!", inDays: "Over {n} dag", inDaysPlural: "Over {n} dagen",
    alerts: "Meldingen", noAlerts: "Geen meldingen op dit moment 👍",
    alertsTap: "melding(en) — tik om te bekijken",
    dueToday: "vandaag", dueIn: "over {n} dag", dueInPlural: "over {n} dagen",
    expires: "vervalt", inPhase: "is in {stage} fase",
    allDebts: "Alle schulden", add: "+ Toevoegen", expired: "Verlopen!",
    back: "← Terug", originalAmount: "Oorspronkelijk bedrag",
    collectionFees: "Incassokosten", dueDate: "Vervaldatum",
    created: "Aangemaakt", notes: "Notities", correspondence: "Correspondentie",
    deleteDebt: "Schuld verwijderen",
    mailOverview: "Postoverzicht", mailSub: "Alle ontvangen brieven en e-mails",
    actionNeeded: "Actie nodig", handled: "Afgehandeld", escalated: "Geëscaleerd",
    calendarTitle: "Kalender", income: "Inkomen", payment: "Betaling",
    addDebt: "Schuld toevoegen", photoBtn: "📸 Foto van brief maken",
    analyzing: "⏳ Analyseren...", orManual: "of vul handmatig in",
    creditorType: "Type schuldeiser", choose: "Kies...",
    creditorName: "Naam schuldeiser", creditorPlaceholder: "bijv. Belastingdienst",
    amount: "Bedrag", original: "Oorspronkelijk", stage: "Stadium",
    noteLabel: "Notities", notePlaceholder: "Korte omschrijving...", save: "Opslaan",
    photoError: "Kon de brief niet analyseren. Vul de gegevens handmatig in.",
    cr_belasting: "Belastingdienst", cr_cjib: "CJIB Boetes",
    cr_zorg: "Zorgverzekeraar", cr_gemeente: "Gemeente",
    cr_energie: "Energiebedrijf", cr_huur: "Huur / Woningcorp.",
    cr_telecom: "Telecom", cr_incasso: "Incassobureau",
    cr_bank: "Bank / Lening", cr_bnpl: "Buy Now Pay Later",
    cr_toeslagen: "Toeslagen Terug.", cr_water: "Waterbedrijf", cr_overig: "Overig",
  },
  en: {
    overview: "Overview", debts: "Debts", mail: "Mail", calendar: "Calendar", scan: "Scan",
    totalDebt: "Total debt", collectionCosts: "collection costs", debtsCount: "Debts",
    creditors: "Creditors", incomeMonth: "Income/mo",
    debtTrajectory: "Debt Trajectory", projectionSub: "Projection if nothing changes",
    now: "Now", months3: "3 mo", months6: "6 mo", months12: "12 mo",
    m3: "3m", m6: "6m", m12: "12m",
    stageOverview: "Stage Overview",
    stage_stable: "Stable", stage_warning: "Warning", stage_action_needed: "Action Needed",
    invoice: "Invoice", reminder: "Reminder", collection_agency: "Debt Collection Agency",
    bailiff: "Bailiff", summons: "Summons",
    perCreditor: "By Creditor",
    dueSoon: "⚠ Due Soon",
    today: "Today!", inDays: "In {n} day", inDaysPlural: "In {n} days",
    alerts: "Alerts", noAlerts: "No alerts at this time 👍",
    alertsTap: "alert(s) — tap to view",
    dueToday: "today", dueIn: "in {n} day", dueInPlural: "in {n} days",
    expires: "due", inPhase: "is in {stage} stage",
    allDebts: "All Debts", add: "+ Add", expired: "Overdue!",
    back: "← Back", originalAmount: "Original Amount",
    collectionFees: "Collection Fees", dueDate: "Due Date",
    created: "Created", notes: "Notes", correspondence: "Correspondence",
    deleteDebt: "Delete Debt",
    mailOverview: "Mail Overview", mailSub: "All received letters and emails",
    actionNeeded: "Action needed", handled: "Handled", escalated: "Escalated",
    calendarTitle: "Calendar", income: "Income", payment: "Payment",
    addDebt: "Add Debt", photoBtn: "📸 Photo of letter",
    analyzing: "⏳ Analyzing...", orManual: "or enter manually",
    creditorType: "Creditor Type", choose: "Choose...",
    creditorName: "Creditor Name", creditorPlaceholder: "e.g. Tax Authority",
    amount: "Amount", original: "Original", stage: "Stage",
    noteLabel: "Notes", notePlaceholder: "Short description...", save: "Save",
    photoError: "Could not analyze the letter. Please enter details manually.",
    cr_belasting: "Tax Authority", cr_cjib: "CJIB Fines",
    cr_zorg: "Health Insurance", cr_gemeente: "Municipality",
    cr_energie: "Energy Company", cr_huur: "Rent / Housing",
    cr_telecom: "Telecom", cr_incasso: "Collection Agency",
    cr_bank: "Bank / Loan", cr_bnpl: "Buy Now Pay Later",
    cr_toeslagen: "Benefits Repayment", cr_water: "Water Company", cr_overig: "Other",
  }
};

const LangContext = createContext({ lang: "en", t: (k) => k, fmtDate: () => "" });
const useLang = () => useContext(LangContext);

// ─── Storage ───
const storage = {
  async get(key) { try { const item = localStorage.getItem(key); return item ? JSON.parse(item) : null; } catch { return null; } },
  async set(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { console.error("Storage error:", e); } }
};

// ─── Data ───
const CREDITOR_TYPES = [
  { id: "belasting", labelKey: "cr_belasting", icon: "🏛️", color: "#E07A5F" },
  { id: "cjib", labelKey: "cr_cjib", icon: "⚖️", color: "#F2CC8F" },
  { id: "zorg", labelKey: "cr_zorg", icon: "🏥", color: "#81B29A" },
  { id: "gemeente", labelKey: "cr_gemeente", icon: "🏘️", color: "#3D405B" },
  { id: "energie", labelKey: "cr_energie", icon: "⚡", color: "#F4A261" },
  { id: "huur", labelKey: "cr_huur", icon: "🏠", color: "#E76F51" },
  { id: "telecom", labelKey: "cr_telecom", icon: "📱", color: "#264653" },
  { id: "incasso", labelKey: "cr_incasso", icon: "📨", color: "#9B2226" },
  { id: "bank", labelKey: "cr_bank", icon: "🏦", color: "#606C38" },
  { id: "bnpl", labelKey: "cr_bnpl", icon: "🛒", color: "#BC6C25" },
  { id: "toeslagen", labelKey: "cr_toeslagen", icon: "💸", color: "#DDA15E" },
  { id: "water", labelKey: "cr_water", icon: "💧", color: "#457B9D" },
  { id: "overig", labelKey: "cr_overig", icon: "📄", color: "#6C757D" },
];

const STAGE_KEYS = [
  { id: "stable",        labelKey: "stage_stable",        color: "#81B29A" },
  { id: "warning",       labelKey: "stage_warning",       color: "#F2CC8F" },
  { id: "action_needed", labelKey: "stage_action_needed", color: "#E07A5F" },
];

const DEMO_DEBTS = [
  { id: "d1", creditorType: "belasting", creditorName: "Belastingdienst", amount: 2340, originalAmount: 2100, dueDate: "2026-05-10", stage: "action_needed", notes: "Inkomstenbelasting 2024", createdAt: "2026-01-15" },
  { id: "d2", creditorType: "cjib", creditorName: "CJIB", amount: 490, originalAmount: 380, dueDate: "2026-05-03", stage: "action_needed", notes: "Verkeersboete A10", createdAt: "2026-02-20" },
  { id: "d3", creditorType: "zorg", creditorName: "Zilveren Kruis", amount: 876, originalAmount: 876, dueDate: "2026-05-18", stage: "warning", notes: "Eigen risico 2025", createdAt: "2026-03-10" },
  { id: "d4", creditorType: "energie", creditorName: "Vattenfall", amount: 1240, originalAmount: 980, dueDate: "2026-04-28", stage: "action_needed", notes: "Jaarafrekening gas/stroom", createdAt: "2025-11-05" },
  { id: "d5", creditorType: "gemeente", creditorName: "Gemeente Amsterdam", amount: 650, originalAmount: 650, dueDate: "2026-06-01", stage: "stable", notes: "Gemeentebelasting 2026", createdAt: "2026-04-01" },
  { id: "d6", creditorType: "toeslagen", creditorName: "Belastingdienst/Toeslagen", amount: 1820, originalAmount: 1820, dueDate: "2026-05-25", stage: "warning", notes: "Zorgtoeslag terugvordering", createdAt: "2026-03-28" },
  { id: "d7", creditorType: "huur", creditorName: "Ymere", amount: 430, originalAmount: 430, dueDate: "2026-05-01", stage: "action_needed", notes: "Huurachterstand maart", createdAt: "2026-04-05" },
];

const DEMO_INCOME = [
  { id: "i1", label: "Salaris", amount: 2180, day: 25 },
  { id: "i2", label: "Zorgtoeslag", amount: 154, day: 20 },
  { id: "i3", label: "Huurtoeslag", amount: 230, day: 20 },
];

const fmt = (n) => new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);
const getCreditor = (id) => CREDITOR_TYPES.find(c => c.id === id) || CREDITOR_TYPES[12];
const getStageData = (id) => STAGE_KEYS.find(s => s.id === id) || STAGE_KEYS[0];

// Dutch legal stages from document analysis → our stage IDs
const LEGAL_STAGE_MAP = { factuur: "stable", herinnering: "stable", aanmaning: "warning", incasso: "action_needed", deurwaarder: "action_needed" };
const HIGH_STAKES = ["belasting", "cjib", "toeslagen", "incasso", "huur"];

function computeStage(debt) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const daysUntilDue = Math.ceil((new Date(debt.dueDate) - today) / 864e5);
  const hasEscalation = debt.amount > debt.originalAmount;
  const isHighStakes = HIGH_STAKES.includes(debt.creditorType);

  // Document-detected legal stage takes precedence when it signals urgency
  if (debt.legalStage && LEGAL_STAGE_MAP[debt.legalStage]) {
    const fromDoc = LEGAL_STAGE_MAP[debt.legalStage];
    if (fromDoc === "action_needed") return "action_needed";
    if (fromDoc === "warning" && daysUntilDue > 7) return "warning";
  }

  if (daysUntilDue <= 7) return "action_needed";
  if (daysUntilDue <= 30 || hasEscalation || isHighStakes) return "warning";
  return "stable";
}

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

// ─── Main App ───
export default function SchuldOverzicht() {
  const [lang, setLang] = useState("en");
  const [screen, setScreen] = useState("dashboard");
  const [debts, setDebts] = useState(DEMO_DEBTS);
  const [income, setIncome] = useState(DEMO_INCOME);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const t = useCallback((key) => translations[lang]?.[key] || translations.en[key] || key, [lang]);
  const fmtDate = useCallback((d) => new Date(d).toLocaleDateString(lang === "nl" ? "nl-NL" : "en-GB", { day: "numeric", month: "short" }), [lang]);

  useEffect(() => {
    (async () => {
      const saved = await storage.get("app-data-v2");
      if (saved) {
        if (saved.debts) setDebts(saved.debts);
        if (saved.income) setIncome(saved.income);
        if (saved.lang) setLang(saved.lang);
      }
      setLoaded(true);
    })();
  }, []);

  useEffect(() => { if (loaded) storage.set("app-data-v2", { debts, income, lang }); }, [debts, income, lang, loaded]);

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
      if (computeStage(d) === "action_needed") {
        const credLabel = t(getCreditor(d.creditorType).labelKey);
        const stageLabel = t(getStageData(computeStage(d)).labelKey);
        notifs.push({ type: "escalation", text: `${credLabel} ${t("inPhase").replace("{stage}", stageLabel)}`, debtId: d.id });
      }
    });
    setNotifications(notifs);
  }, [debts, t]);

  const totalDebt = debts.reduce((s, d) => s + d.amount, 0);
  const totalOriginal = debts.reduce((s, d) => s + d.originalAmount, 0);
  const escalationCost = totalDebt - totalOriginal;
  const monthlyIncome = income.reduce((s, i) => s + i.amount, 0);
  const addDebt = (debt) => { setDebts(prev => [...prev, { ...debt, id: `d${Date.now()}`, createdAt: new Date().toISOString().slice(0, 10) }]); setShowAddDebt(false); };
  const deleteDebt = (id) => { setDebts(prev => prev.filter(d => d.id !== id)); setSelectedDebt(null); };

  const tabs = [
    { id: "dashboard", icon: <IconHome />,    lk: "overview" },
    { id: "upload",    icon: <IconCamera />,  lk: "scan",    action: () => setShowAddDebt(true) },
    { id: "calendar",  icon: <IconMessage />, lk: "advisor"  },
  ];

  return (
    <LangContext.Provider value={{ lang, t, fmtDate }}>
      <div style={S.app}>
        <style>{globalCSS}</style>
        <header style={S.header}>
          <div style={S.headerInner}>
            <div style={S.logo}><span style={S.logoIcon}>◉</span><span style={S.logoText}>SchuldWijzer</span></div>
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
          {screen === "dashboard" && <Dashboard debts={debts} totalDebt={totalDebt} escalationCost={escalationCost} monthlyIncome={monthlyIncome} notifications={notifications} onViewDebt={(d) => { setSelectedDebt(d); setScreen("detail"); }} onNavigate={setScreen} />}
          {screen === "detail" && selectedDebt && <DebtDetail debt={selectedDebt} onBack={() => setScreen("dashboard")} onDelete={deleteDebt} />}
          {screen === "calendar" && <CalendarView debts={debts} income={income} />}
          {screen === "alerts" && <Alerts notifications={notifications} onViewDebt={(id) => { setSelectedDebt(debts.find(d => d.id === id)); setScreen("detail"); }} />}
        </main>
        {showAddDebt && <AddDebtModal onAdd={addDebt} onClose={() => setShowAddDebt(false)} />}
        <button style={S.fab} onClick={() => setShowAddDebt(true)}><span style={{ fontSize: 28, lineHeight: 1 }}>+</span></button>
        <nav style={S.nav}>
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

// ─── Dashboard ───
function Dashboard({ debts, totalDebt, escalationCost, monthlyIncome, notifications, onViewDebt, onNavigate }) {
  const { t, fmtDate } = useLang();
  const stagePriority = { action_needed: 0, warning: 1, stable: 2 };
  const sortedDebts = [...debts].sort((a, b) => (stagePriority[computeStage(a)] ?? 3) - (stagePriority[computeStage(b)] ?? 3) || b.amount - a.amount);
  const byStage = {}; debts.forEach(d => { const sid = computeStage(d); byStage[sid] = (byStage[sid] || 0) + 1; });

  return (
    <div style={S.sc}>
      <div style={S.heroCard}>
        <div style={S.heroLabel}>{t("totalDebt")}</div>
        <div style={S.heroAmount}>{fmt(totalDebt)}</div>
        <div style={S.heroSub}>{escalationCost > 0 && <span style={S.escBadge}>+{fmt(escalationCost)} {t("collectionCosts")}</span>}</div>
        <div style={S.heroDivider} />
        <div style={S.heroStats}>
          <div style={S.heroStat}><div style={S.heroStatLabel}>{t("debtsCount")}</div><div style={S.heroStatVal}>{debts.length}</div></div>
          <div style={S.heroStat}><div style={S.heroStatLabel}>{t("creditors")}</div><div style={S.heroStatVal}>{new Set(debts.map(d => d.creditorType)).size}</div></div>
          <div style={S.heroStat}><div style={S.heroStatLabel}>{t("incomeMonth")}</div><div style={S.heroStatVal}>{fmt(monthlyIncome)}</div></div>
        </div>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>{t("stageOverview")}</div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          {STAGE_KEYS.map(s => (
            <div key={s.id} style={{ flex: 1, textAlign: "center", background: s.color + "18", borderRadius: 12, padding: "12px 8px" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{byStage[s.id] || 0}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: s.color, marginTop: 2 }}>{t(s.labelKey)}</div>
            </div>
          ))}
        </div>
      </div>
      {sortedDebts.map(d => { const c = getCreditor(d.creditorType); const s = getStageData(computeStage(d)); const diff = Math.ceil((new Date(d.dueDate) - new Date()) / 864e5); return (
        <button key={d.id} style={S.debtCard} onClick={() => onViewDebt(d)}>
          <div style={S.dcLeft}><span style={{ fontSize: 28 }}>{c.icon}</span></div>
          <div style={S.dcCenter}><div style={S.dcName}>{d.creditorName}</div><div style={S.dcNotes}>{d.notes}</div><div style={S.dcMeta}><span style={{ ...S.stagePill, backgroundColor: s.color + "22", color: s.color }}>{t(s.labelKey)}</span><span style={S.dcDue}>{diff <= 0 ? t("expired") : fmtDate(d.dueDate)}</span></div></div>
          <div style={S.dcRight}><div style={S.dcAmt}>{fmt(d.amount)}</div>{d.amount > d.originalAmount && <div style={S.dcOrig}>was {fmt(d.originalAmount)}</div>}</div>
        </button>
      ); })}
      {notifications.length > 0 && <button style={S.alertBanner} onClick={() => onNavigate("alerts")}><span>🔔</span><span>{notifications.length} {t("alertsTap")}</span><span>→</span></button>}
    </div>
  );
}

// ─── Debt List ───
function DebtList({ debts, onSelect, onAdd }) {
  const { t, fmtDate } = useLang();
  const sorted = [...debts].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  return (
    <div style={S.sc}>
      <div style={S.screenHeader}><h2 style={S.screenTitle}>{t("allDebts")}</h2><button style={S.addBtn} onClick={onAdd}>{t("add")}</button></div>
      {sorted.map(d => { const c = getCreditor(d.creditorType); const s = getStageData(computeStage(d)); const diff = Math.ceil((new Date(d.dueDate) - new Date()) / 864e5); return (
        <button key={d.id} style={S.debtCard} onClick={() => onSelect(d)}>
          <div style={S.dcLeft}><span style={{ fontSize: 28 }}>{c.icon}</span></div>
          <div style={S.dcCenter}><div style={S.dcName}>{d.creditorName}</div><div style={S.dcNotes}>{d.notes}</div><div style={S.dcMeta}><span style={{ ...S.stagePill, backgroundColor: s.color + "22", color: s.color }}>{t(s.labelKey)}</span><span style={S.dcDue}>{diff <= 0 ? t("expired") : fmtDate(d.dueDate)}</span></div></div>
          <div style={S.dcRight}><div style={S.dcAmt}>{fmt(d.amount)}</div>{d.amount > d.originalAmount && <div style={S.dcOrig}>was {fmt(d.originalAmount)}</div>}</div>
        </button>
      ); })}
    </div>
  );
}

// ─── Detail ───
function DebtDetail({ debt, onBack, onDelete }) {
  const { t, fmtDate } = useLang();
  const c = getCreditor(debt.creditorType); const s = getStageData(computeStage(debt)); const ci = debt.amount - debt.originalAmount;
  return (
    <div style={S.sc}>
      <button style={S.backBtn} onClick={onBack}>{t("back")}</button>
      <div style={S.detailHdr}><span style={{ fontSize: 40 }}>{c.icon}</span><h2 style={S.detailName}>{debt.creditorName}</h2><div style={S.detailAmt}>{fmt(debt.amount)}</div><span style={{ ...S.stagePill, backgroundColor: s.color + "22", color: s.color, fontSize: 14, padding: "6px 14px" }}>{t(s.labelKey)}</span></div>
      <div style={S.card}>
        <div style={S.dRow}><span style={S.dLabel}>{t("originalAmount")}</span><span>{fmt(debt.originalAmount)}</span></div>
        <div style={S.dRow}><span style={S.dLabel}>{t("collectionFees")}</span><span style={{ color: ci > 0 ? "#E07A5F" : "inherit" }}>{ci > 0 ? `+${fmt(ci)}` : "—"}</span></div>
        <div style={S.dRow}><span style={S.dLabel}>{t("dueDate")}</span><span>{fmtDate(debt.dueDate)}</span></div>
        <div style={S.dRow}><span style={S.dLabel}>{t("created")}</span><span>{fmtDate(debt.createdAt)}</span></div>
        <div style={S.dRow}><span style={S.dLabel}>{t("notes")}</span><span>{debt.notes}</span></div>
      </div>
      <button style={S.deleteBtn} onClick={() => onDelete(debt.id)}>{t("deleteDebt")}</button>
    </div>
  );
}

// ─── Calendar ───
function CalendarView({ debts, income }) {
  const { t, lang } = useLang();
  const today = new Date();
  const dim = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: dim }, (_, i) => i + 1);
  const dbd = {}; debts.forEach(d => { const dt = new Date(d.dueDate); if (dt.getMonth() === today.getMonth() && dt.getFullYear() === today.getFullYear()) { const day = dt.getDate(); if (!dbd[day]) dbd[day] = []; dbd[day].push(d); } });
  const ibd = {}; income.forEach(i => { if (!ibd[i.day]) ibd[i.day] = []; ibd[i.day].push(i); });
  const mn = today.toLocaleDateString(lang === "nl" ? "nl-NL" : "en-GB", { month: "long", year: "numeric" });
  return (
    <div style={S.sc}><h2 style={S.screenTitle}>{t("calendarTitle")}</h2><div style={S.cardSub}>{mn}</div>
      <div style={S.calLeg}><span style={S.calLI}><span style={{ ...S.calDot, backgroundColor: "#81B29A" }} /> {t("income")}</span><span style={S.calLI}><span style={{ ...S.calDot, backgroundColor: "#E07A5F" }} /> {t("payment")}</span></div>
      <div style={S.calGrid}>{days.map(day => { const isT = day === today.getDate(); const hD = dbd[day]; const hI = ibd[day]; const isP = day < today.getDate(); return (
        <div key={day} style={{ ...S.calDay, ...(isT ? S.calToday : {}), ...(isP ? { opacity: 0.5 } : {}) }}>
          <div style={S.calDayNum}>{day}</div>
          <div style={S.calDayDots}>{hI && <span style={{ ...S.calDot, backgroundColor: "#81B29A" }} />}{hD && <span style={{ ...S.calDot, backgroundColor: "#E07A5F" }} />}</div>
          {hD && <div style={S.calDayAmt}>{fmt(hD.reduce((s, d) => s + d.amount, 0))}</div>}
          {hI && <div style={{ ...S.calDayAmt, color: "#81B29A" }}>{fmt(hI.reduce((s, i) => s + i.amount, 0))}</div>}
        </div>
      ); })}</div>
    </div>
  );
}

// ─── Alerts ───
function Alerts({ notifications, onViewDebt }) {
  const { t } = useLang();
  return (
    <div style={S.sc}><h2 style={S.screenTitle}>{t("alerts")}</h2>
      {notifications.length === 0 && <div style={S.empty}>{t("noAlerts")}</div>}
      {notifications.map((n, i) => <button key={i} style={S.alertCard} onClick={() => n.debtId && onViewDebt(n.debtId)}><span style={{ fontSize: 20 }}>{n.type === "urgent" ? "⏰" : "⚠️"}</span><span style={S.alertText}>{n.text}</span><span style={S.alertArrow}>→</span></button>)}
    </div>
  );
}

// ─── Add Debt Modal ───
function AddDebtModal({ onAdd, onClose }) {
  const { t } = useLang();
  const [creditorType, setCreditorType] = useState("");
  const [creditorName, setCreditorName] = useState("");
  const [amount, setAmount] = useState("");
  const [originalAmount, setOriginalAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [legalStage, setLegalStage] = useState("");
  const [notes, setNotes] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const fileRef = useRef();

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setAnalyzing(true);
    try {
      const b64 = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result.split(",")[1]); r.onerror = () => rej(new Error("fail")); r.readAsDataURL(file); });
      const resp = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        model: "claude-sonnet-4-20250514", max_tokens: 1000,
        messages: [{ role: "user", content: [
          { type: "image", source: { type: "base64", media_type: file.type || "image/jpeg", data: b64 } },
          { type: "text", text: `Analyze this letter/invoice. Return ONLY a JSON object (no markdown, no backticks): creditorType (one of: belasting, cjib, zorg, gemeente, energie, huur, telecom, incasso, bank, bnpl, toeslagen, water, overig), creditorName, amount (number), dueDate (YYYY-MM-DD), legalStage (one of: factuur, herinnering, aanmaning, incasso, deurwaarder — the Dutch legal escalation stage of this letter), notes. Use empty string or 0 if not found.` }
        ] }]
      }) });
      const data = await resp.json(); const text = data.content?.map(i => i.text || "").join("") || "";
      const p = JSON.parse(text.replace(/```json|```/g, "").trim());
      setCreditorType(p.creditorType || ""); setCreditorName(p.creditorName || ""); setAmount(p.amount ? String(p.amount) : ""); setOriginalAmount(p.amount ? String(p.amount) : ""); setDueDate(p.dueDate || ""); setLegalStage(p.legalStage || ""); setNotes(p.notes || "");
    } catch (err) { console.error(err); alert(t("photoError")); }
    setAnalyzing(false);
  };

  const ok = creditorType && creditorName && amount && dueDate;
  return (
    <div style={S.modalOL}>
      <div style={S.modal}>
        <div style={S.modalHdr}><h3 style={S.modalTitle}>{t("addDebt")}</h3><button style={S.modalClose} onClick={onClose}>×</button></div>
        <div style={S.photoSec}>
          <button style={S.photoBtn} onClick={() => fileRef.current?.click()} disabled={analyzing}>{analyzing ? t("analyzing") : t("photoBtn")}</button>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handlePhoto} />
          <div style={S.photoDivider}><span>{t("orManual")}</span></div>
        </div>
        <div style={S.fg}><label style={S.fLabel}>{t("creditorType")}</label><select style={S.fSelect} value={creditorType} onChange={e => setCreditorType(e.target.value)}><option value="">{t("choose")}</option>{CREDITOR_TYPES.map(c => <option key={c.id} value={c.id}>{c.icon} {t(c.labelKey)}</option>)}</select></div>
        <div style={S.fg}><label style={S.fLabel}>{t("creditorName")}</label><input style={S.fInput} value={creditorName} onChange={e => setCreditorName(e.target.value)} placeholder={t("creditorPlaceholder")} /></div>
        <div style={S.fRow}>
          <div style={{ ...S.fg, flex: 1 }}><label style={S.fLabel}>{t("amount")}</label><input style={S.fInput} type="number" value={amount} onChange={e => { setAmount(e.target.value); if (!originalAmount) setOriginalAmount(e.target.value); }} placeholder="0.00" /></div>
          <div style={{ ...S.fg, flex: 1 }}><label style={S.fLabel}>{t("original")}</label><input style={S.fInput} type="number" value={originalAmount} onChange={e => setOriginalAmount(e.target.value)} placeholder="0.00" /></div>
        </div>
        <div style={S.fg}><label style={S.fLabel}>{t("dueDate")}</label><input style={S.fInput} type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></div>
        <div style={S.fg}><label style={S.fLabel}>{t("noteLabel")}</label><input style={S.fInput} value={notes} onChange={e => setNotes(e.target.value)} placeholder={t("notePlaceholder")} /></div>
        <button style={{ ...S.submitBtn, opacity: ok ? 1 : 0.4 }} disabled={!ok} onClick={() => onAdd({ creditorType, creditorName, amount: parseFloat(amount), originalAmount: parseFloat(originalAmount || amount), dueDate, legalStage, notes })}>{t("save")}</button>
      </div>
    </div>
  );
}

// ─── Styles ───
const globalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
  :root { --bg: #FAFAF7; --card-bg: #FFFFFF; --text-primary: #1A1A2E; --text-secondary: #6B7280; --border-color: #E8E8E3; }
  body { font-family: 'DM Sans', sans-serif; background: var(--bg); color: var(--text-primary); }
  input, select, button { font-family: inherit; }
`;

const serif = "'Fraunces', serif";
const S = {
  app: { maxWidth: 430, margin: "0 auto", minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", position: "relative" },
  header: { position: "sticky", top: 0, zIndex: 100, background: "rgba(250,250,247,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border-color)" },
  headerInner: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px" },
  logo: { display: "flex", alignItems: "center", gap: 8 },
  logoIcon: { fontSize: 24, color: "#3D405B" },
  logoText: { fontSize: 20, fontWeight: 700, fontFamily: serif, color: "#3D405B", letterSpacing: "-0.5px" },
  headerRight: { display: "flex", alignItems: "center", gap: 10 },
  langToggle: { display: "flex", background: "#F0F0EB", borderRadius: 8, padding: 2, border: "none", cursor: "pointer", gap: 0 },
  langOpt: { padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700, color: "#6B7280", transition: "all 0.2s", letterSpacing: 0.5 },
  langActive: { background: "#3D405B", color: "white" },
  notifBadge: { background: "none", border: "none", fontSize: 22, position: "relative", cursor: "pointer", padding: 4 },
  notifCount: { position: "absolute", top: -2, right: -4, background: "#E07A5F", color: "white", fontSize: 11, fontWeight: 700, borderRadius: 10, padding: "1px 6px", minWidth: 18, textAlign: "center" },
  main: { flex: 1, paddingBottom: 90 },
  sc: { padding: "16px 20px 20px" },
  heroCard: { background: "linear-gradient(135deg, #3D405B 0%, #2A2D42 100%)", borderRadius: 20, padding: "28px 24px 22px", color: "white", marginBottom: 16 },
  heroLabel: { fontSize: 13, fontWeight: 500, opacity: 0.7, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 4 },
  heroAmount: { fontSize: 38, fontWeight: 700, fontFamily: serif, letterSpacing: "-1px", lineHeight: 1.1 },
  heroSub: { marginTop: 8 },
  escBadge: { background: "rgba(224,122,95,0.25)", color: "#F2CC8F", fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 8 },
  heroDivider: { height: 1, background: "rgba(255,255,255,0.12)", margin: "18px 0 14px" },
  heroStats: { display: "flex", justifyContent: "space-between" },
  heroStat: { textAlign: "center" },
  heroStatLabel: { fontSize: 11, opacity: 0.6, marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.5 },
  heroStatVal: { fontSize: 18, fontWeight: 700, fontFamily: serif },
  card: { background: "var(--card-bg)", borderRadius: 16, padding: 20, marginBottom: 14, border: "1px solid var(--border-color)" },
  cardTitle: { fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4, fontFamily: serif },
  cardSub: { fontSize: 13, color: "var(--text-secondary)", marginBottom: 14 },
  projRow: { display: "flex", gap: 6, marginTop: 12 },
  projPill: { flex: 1, textAlign: "center", background: "#F7F7F4", borderRadius: 10, padding: "8px 4px" },
  projPillL: { fontSize: 11, color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 },
  projPillV: { fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginTop: 2 },
  projPillD: { fontSize: 11, color: "#E07A5F", fontWeight: 600, marginTop: 1 },
  stageBar: { display: "flex", height: 14, borderRadius: 7, overflow: "hidden", marginBottom: 12, gap: 2 },
  stageSeg: { borderRadius: 7, transition: "width 0.3s" },
  stageLegend: { display: "flex", flexDirection: "column", gap: 6 },
  stageLI: { display: "flex", alignItems: "center", gap: 8, fontSize: 13 },
  stageDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  stageLL: { fontWeight: 500, flex: 1 },
  stageLV: { color: "var(--text-secondary)", fontSize: 12 },
  bRow: { display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border-color)" },
  bIcon: { fontSize: 24, width: 36, textAlign: "center" },
  bInfo: { flex: 1 },
  bLabel: { fontSize: 14, fontWeight: 500, marginBottom: 4 },
  bBarOut: { height: 6, background: "#F0F0EB", borderRadius: 3 },
  bBarIn: { height: 6, borderRadius: 3, transition: "width 0.4s" },
  bAmt: { fontSize: 15, fontWeight: 700, fontFamily: serif, whiteSpace: "nowrap" },
  urgRow: { display: "flex", alignItems: "center", gap: 12, padding: "10px 0", background: "none", border: "none", borderBottom: "1px solid var(--border-color)", width: "100%", cursor: "pointer", textAlign: "left" },
  urgDue: { fontSize: 12, color: "#E07A5F", fontWeight: 600 },
  alertBanner: { display: "flex", alignItems: "center", gap: 10, background: "#FFF3EB", border: "1px solid #F2CC8F", borderRadius: 12, padding: "14px 16px", marginTop: 8, cursor: "pointer", width: "100%", fontSize: 14, color: "#3D405B", fontWeight: 500 },
  screenHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  screenTitle: { fontSize: 22, fontWeight: 700, fontFamily: serif, color: "var(--text-primary)" },
  addBtn: { background: "#3D405B", color: "white", border: "none", borderRadius: 10, padding: "8px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer" },
  debtCard: { display: "flex", alignItems: "center", gap: 14, background: "var(--card-bg)", borderRadius: 14, padding: 16, marginBottom: 10, border: "1px solid var(--border-color)", cursor: "pointer", width: "100%", textAlign: "left" },
  dcLeft: { width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", background: "#F7F7F4", borderRadius: 12 },
  dcCenter: { flex: 1, minWidth: 0 },
  dcName: { fontSize: 15, fontWeight: 600, marginBottom: 2 },
  dcNotes: { fontSize: 12, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 6 },
  dcMeta: { display: "flex", alignItems: "center", gap: 8 },
  stagePill: { fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6 },
  dcDue: { fontSize: 12, color: "var(--text-secondary)" },
  dcRight: { textAlign: "right", flexShrink: 0 },
  dcAmt: { fontSize: 17, fontWeight: 700, fontFamily: serif },
  dcOrig: { fontSize: 11, color: "var(--text-secondary)", textDecoration: "line-through" },
  backBtn: { background: "none", border: "none", fontSize: 15, color: "var(--text-secondary)", cursor: "pointer", marginBottom: 16, padding: 0, fontWeight: 500 },
  detailHdr: { textAlign: "center", marginBottom: 20 },
  detailName: { fontSize: 22, fontWeight: 700, fontFamily: serif, marginTop: 8 },
  detailAmt: { fontSize: 36, fontWeight: 700, fontFamily: serif, color: "#E07A5F", margin: "8px 0" },
  dRow: { display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border-color)", fontSize: 14 },
  dLabel: { color: "var(--text-secondary)", fontWeight: 500 },
  deleteBtn: { width: "100%", background: "none", border: "1px solid #E07A5F", color: "#E07A5F", borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 600, cursor: "pointer", marginTop: 20 },
  mailRow: { display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--border-color)" },
  mailDate: { fontSize: 12, color: "var(--text-secondary)", width: 50, flexShrink: 0 },
  mailSubj: { fontSize: 13, flex: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  mailCard: { display: "block", background: "var(--card-bg)", borderRadius: 14, padding: 16, marginBottom: 10, border: "1px solid var(--border-color)", cursor: "pointer", width: "100%", textAlign: "left" },
  mcTop: { display: "flex", alignItems: "center", gap: 8, marginBottom: 6 },
  mcCred: { fontSize: 14, fontWeight: 600, flex: 1 },
  mcDate: { fontSize: 12, color: "var(--text-secondary)" },
  mcSubj: { fontSize: 14, marginBottom: 8, lineHeight: 1.4 },
  mcBot: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  statusPill: { fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 6 },
  mcAmt: { fontSize: 15, fontWeight: 700, fontFamily: serif },
  calLeg: { display: "flex", gap: 16, marginBottom: 14 },
  calLI: { display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-secondary)" },
  calDot: { width: 8, height: 8, borderRadius: 4, display: "inline-block" },
  calGrid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 },
  calDay: { background: "var(--card-bg)", borderRadius: 10, padding: "8px 4px", textAlign: "center", minHeight: 70, border: "1px solid var(--border-color)" },
  calToday: { border: "2px solid #3D405B", background: "#F7F7F4" },
  calDayNum: { fontSize: 13, fontWeight: 600, marginBottom: 4 },
  calDayDots: { display: "flex", justifyContent: "center", gap: 3, marginBottom: 2 },
  calDayAmt: { fontSize: 9, fontWeight: 600, color: "#E07A5F" },
  alertCard: { display: "flex", alignItems: "center", gap: 12, background: "var(--card-bg)", borderRadius: 14, padding: 16, marginBottom: 10, border: "1px solid var(--border-color)", cursor: "pointer", width: "100%", textAlign: "left" },
  alertText: { flex: 1, fontSize: 14, lineHeight: 1.4 },
  alertArrow: { color: "var(--text-secondary)", fontSize: 18 },
  empty: { textAlign: "center", padding: "40px 20px", fontSize: 16, color: "var(--text-secondary)" },
  fab: { position: "fixed", bottom: 80, right: 20, width: 56, height: 56, borderRadius: 28, background: "#3D405B", color: "white", border: "none", boxShadow: "0 4px 20px rgba(61,64,91,0.3)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 },
  nav: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderTop: "1px solid var(--border-color)", display: "flex", padding: "8px 0 env(safe-area-inset-bottom, 8px)", zIndex: 100 },
  navBtn: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, background: "none", border: "none", cursor: "pointer", padding: "6px 0", color: "var(--text-secondary)", transition: "color 0.2s" },
  navBtnActive: { color: "#3D405B" },
  navLabel: { fontSize: 11, fontWeight: 600 },
  modalOL: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" },
  modal: { background: "var(--bg)", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 430, maxHeight: "92vh", overflowY: "auto", padding: "24px 20px 40px" },
  modalHdr: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 700, fontFamily: serif },
  modalClose: { background: "none", border: "none", fontSize: 28, color: "var(--text-secondary)", cursor: "pointer", padding: 0, lineHeight: 1 },
  photoSec: { marginBottom: 20 },
  photoBtn: { width: "100%", padding: 16, background: "#F7F7F4", border: "2px dashed var(--border-color)", borderRadius: 14, fontSize: 16, fontWeight: 600, color: "#3D405B", cursor: "pointer" },
  photoDivider: { textAlign: "center", margin: "16px 0", fontSize: 13, color: "var(--text-secondary)" },
  fg: { marginBottom: 14 },
  fLabel: { display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 },
  fInput: { width: "100%", padding: "12px 14px", border: "1px solid var(--border-color)", borderRadius: 10, fontSize: 15, background: "white", outline: "none" },
  fSelect: { width: "100%", padding: "12px 14px", border: "1px solid var(--border-color)", borderRadius: 10, fontSize: 15, background: "white", outline: "none" },
  fRow: { display: "flex", gap: 10 },
  submitBtn: { width: "100%", padding: 16, background: "#3D405B", color: "white", border: "none", borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: "pointer", marginTop: 10 },
};
