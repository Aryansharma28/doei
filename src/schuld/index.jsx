import { useState, useEffect, useCallback, useRef, useLayoutEffect } from "react";
import { LangContext } from "./context/LangContext";
import { Dashboard } from "./components/Dashboard";
import { DebtDetail } from "./components/DebtDetail";
import { Advisor } from "./components/Advisor";
import { Alerts } from "./components/Alerts";
import { Account } from "./components/Account";
import { Auth } from "./components/Auth";
import { AddDebtModal } from "./components/AddDebtModal";
import { S } from "./styles/styles";
import { globalCSS, storage, fmt } from "./utils/helpers";
import { translations } from "./utils/i18n";
import { DEMO_INCOME } from "./constants/demoData";
import { getCreditor, getStageData } from "./constants/creditors";
import { supabase } from "../lib/supabase";

const PENDING_GMAIL_OAUTH_KEY = "doei-pending-gmail-oauth";

const debtFromDB = (r) => ({
  id: r.id,
  creditorType: r.creditor_type,
  creditorName: r.creditor_name,
  amount: Number(r.amount),
  originalAmount: Number(r.original_amount),
  dueDate: r.due_date,
  stage: r.stage,
  notes: r.notes || "",
  createdAt: typeof r.created_at === "string" ? r.created_at.slice(0, 10) : r.created_at,
});

const debtToDB = (debt, userId) => ({
  id: debt.id,
  user_id: userId,
  creditor_type: debt.creditorType,
  creditor_name: debt.creditorName,
  amount: debt.amount,
  original_amount: debt.originalAmount,
  due_date: debt.dueDate,
  stage: debt.stage,
  notes: debt.notes || null,
});

function mergeSuggestedDebts(existing, incoming) {
  const current = existing || [];
  const next = [...current];
  const seen = new Set(
    current.map(item => item.email_id || `${item.creditor_name}-${item.transaction_date}-${item.amount}`)
  );

  for (const item of incoming || []) {
    const key = item.email_id || `${item.creditor_name}-${item.transaction_date}-${item.amount}`;
    if (!seen.has(key)) {
      seen.add(key);
      next.unshift(item);
    }
  }

  return next;
}

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
  const [session, setSession] = useState(undefined); // undefined = loading, null = logged out
  const [lang, setLang] = useState("en");
  const [screen, setScreen] = useState("dashboard");
  const [debts, setDebts] = useState([]);
  const [income, setIncome] = useState(DEMO_INCOME);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [scanInitData, setScanInitData] = useState(null);
  const [pendingScanDoc, setPendingScanDoc] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("doei-theme") || "light");
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [profile, setProfile] = useState({ name: "", email: "", phone: "" });
  const [connections, setConnections] = useState({});
  const [suggestedDebts, setSuggestedDebts] = useState([]);
  const [gmailBusy, setGmailBusy] = useState(false);
  const [gmailMessage, setGmailMessage] = useState("");
  const [gmailError, setGmailError] = useState("");
  const scanRef = useRef();

  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);

      // Verbose for debugging the Gmail/Calendar connect flow.
      console.log("[auth] event:", event, {
        hasSession: !!session,
        provider: session?.user?.app_metadata?.provider,
        hasRefreshToken: !!session?.provider_refresh_token,
        hasProviderToken: !!session?.provider_token,
      });

      if (session?.provider_refresh_token) {
        sessionStorage.setItem(
          PENDING_GMAIL_OAUTH_KEY,
          JSON.stringify({
            providerEmail: session.user?.email || "",
            providerRefreshToken: session.provider_refresh_token,
            providerToken: session.provider_token || null,
          })
        );
        console.log("[auth] saved provider_refresh_token to sessionStorage");
      } else if (event === "SIGNED_IN" && session?.user?.app_metadata?.provider === "google") {
        // Came back from Google OAuth but no refresh_token issued.
        // Google only issues one when (a) access_type=offline AND prompt=consent
        // AND (b) the user is granting at least one new scope. If they've
        // already granted everything, Google returns an access_token only.
        // Fix: revoke the app at https://myaccount.google.com/permissions
        // and reconnect.
        console.warn("[auth] Google sign-in completed BUT no provider_refresh_token. Revoke access at https://myaccount.google.com/permissions then reconnect.");
        setGmailError(
          "Google didn't issue a refresh token. Open https://myaccount.google.com/permissions, remove access for this app, then click Connect Gmail again."
        );
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get("gmail")) {
      setScreen("account");
      params.delete("gmail");
      const next = params.toString();
      window.history.replaceState({}, "", `${window.location.pathname}${next ? `?${next}` : ""}`);
    }
  }, []);

  useEffect(() => {
    if (!session?.access_token) {
      return;
    }

    let cancelled = false;

    async function refreshGmailState() {
      const authHeaders = {
        Authorization: `Bearer ${session.access_token}`,
      };

      try {
        const statusRes = await fetch("/api/gmail/status", {
          headers: authHeaders,
        });
        const statusData = await statusRes.json();
        if (!cancelled) {
          if (statusRes.ok && statusData.connected) {
            connectIntegration("gmail", {
              name: "Gmail",
              info: statusData.email || session.user?.email || "Connected",
              status: statusData.status || "connected",
            });
          } else {
            disconnectIntegration("gmail");
          }
        }
      } catch {
        if (!cancelled) {
          setGmailError("Could not load Gmail connection status");
        }
      }

      const pendingRaw = sessionStorage.getItem(PENDING_GMAIL_OAUTH_KEY);
      if (!pendingRaw) {
        return;
      }

      try {
        const pending = JSON.parse(pendingRaw);
        setGmailBusy(true);
        setGmailError("");
        setGmailMessage("Finishing Gmail connection…");

        const connectRes = await fetch("/api/gmail/connect", {
          method: "POST",
          headers: {
            ...authHeaders,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(pending),
        });
        const connectData = await connectRes.json();
        if (!connectRes.ok || connectData.error) {
          throw new Error(connectData.error || "Failed to connect Gmail");
        }

        sessionStorage.removeItem(PENDING_GMAIL_OAUTH_KEY);
        if (!cancelled) {
          connectIntegration("gmail", {
            name: "Gmail",
            info: connectData.email || session.user?.email || "Connected",
            status: "connected",
          });
          setGmailMessage("Gmail connected. Morning sync is ready.");
          setScreen("account");
        }
      } catch (error) {
        if (!cancelled) {
          setGmailError(error.message || "Failed to connect Gmail");
        }
      } finally {
        if (!cancelled) {
          setGmailBusy(false);
        }
      }
    }

    refreshGmailState();

    return () => {
      cancelled = true;
    };
  }, [session]);


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

  // Load preferences from localStorage (debts come from Supabase, see effect below)
  useEffect(() => {
    (async () => {
      const saved = await storage.get("app-data-v4");
      if (saved) {
        if (saved.income) setIncome(saved.income);
        if (saved.lang) setLang(saved.lang);
        if (saved.profile) setProfile(saved.profile);
        if (saved.connections) setConnections(saved.connections);
      }
      setLoaded(true);
    })();
  }, []);

  // Persist preferences (NOT debts — those live in Supabase)
  useEffect(() => {
    if (loaded) storage.set("app-data-v4", { income, lang, profile, connections });
  }, [income, lang, profile, connections, loaded]);

  // Load debts from Supabase whenever the session is established
  useEffect(() => {
    if (!session?.user?.id) {
      setDebts([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("debts")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (error) {
        console.error("[debts] load failed:", error);
        return;
      }
      setDebts((data || []).map(debtFromDB));
    })();
    return () => { cancelled = true; };
  }, [session?.user?.id]);

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
  const addDebt = async (debt) => {
    if (!session?.user?.id) return null;
    const id = `d${Date.now()}`;
    const row = debtToDB({ ...debt, id }, session.user.id);
    const { data, error } = await supabase.from("debts").insert(row).select().single();
    if (error) { console.error("[debts] insert failed:", error); return null; }
    const created = debtFromDB(data);
    setDebts(prev => [created, ...prev]);
    if (pendingScanDoc?.publicUrl) {
      await supabase.from("documents").insert({
        user_id: session.user.id,
        debt_id: created.id,
        file_url: pendingScanDoc.publicUrl,
        file_name: pendingScanDoc.name,
        file_type: pendingScanDoc.type,
      });
    }
    setShowAddDebt(false);
    setScanInitData(null);
    setPendingScanDoc(null);
    setSelectedDebt(created);
    setScreen("detail");
    return created;
  };
  const deleteDebt = async (id) => {
    if (!session?.user?.id) return;
    const { error } = await supabase.from("debts").delete().eq("id", id).eq("user_id", session.user.id);
    if (error) { console.error("[debts] delete failed:", error); return; }
    setDebts(prev => prev.filter(d => d.id !== id));
    setSelectedDebt(null);
  };
  const markDebtPaid = async (id) => {
    await deleteDebt(id);
    setScreen("dashboard");
  };
  const connectIntegration = (id, data) => setConnections(prev => ({ ...prev, [id]: data }));
  const disconnectIntegration = (id) => setConnections(prev => { const n = { ...prev }; delete n[id]; return n; });
  const acceptSuggested = async (s) => {
    const created = await addDebt({ creditorName: s.creditor_name, creditorType: s.creditor_type, amount: s.amount, originalAmount: s.amount, dueDate: s.transaction_date, stage: "warning", notes: s.description });
    if (created && session?.user?.id && s.email_id) {
      const fileName = (s.subject || s.description || "Gmail email").slice(0, 200);
      const fileUrl = `https://mail.google.com/mail/u/0/#all/${s.email_id}`;
      await supabase.from("documents").insert({
        user_id: session.user.id,
        debt_id: created.id,
        file_url: fileUrl,
        file_name: fileName,
        file_type: "email/gmail",
      });
    }
    setSuggestedDebts(prev => prev.filter(x => x !== s));
    if (created) {
      setSelectedDebt(created);
      setScreen("detail");
    }
  };
  const dismissSuggested = (s) => setSuggestedDebts(prev => prev.filter(x => x !== s));
  const connectGmail = async () => {
    setGmailBusy(true);
    setGmailError("");
    setGmailMessage("");

    const oauthOptions = {
      redirectTo: `${window.location.origin}/app?gmail=callback`,
      scopes: "openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.events",
      queryParams: {
        access_type: "offline",
        include_granted_scopes: "true",
        prompt: "consent",
      },
    };

    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: oauthOptions });

    if (error) {
      setGmailBusy(false);
      setGmailError(error.message);
    }
  };
  const syncGmail = async () => {
    if (!session?.access_token) {
      return;
    }

    setGmailBusy(true);
    setGmailError("");
    setGmailMessage("");

    try {
      const res = await fetch("/api/gmail/sync", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to sync Gmail");
      }

      connectIntegration("gmail", {
        ...(connections.gmail || { name: "Gmail", info: session.user?.email || "Connected" }),
        status: "connected",
      });
      setSuggestedDebts(prev => mergeSuggestedDebts(prev, data.suggested));
      setGmailMessage(
        data.suggested?.length
          ? `Found ${data.suggested.length} debt-related ${data.suggested.length === 1 ? "email" : "emails"}`
          : "No debt-related emails found in the latest sync"
      );
    } catch (error) {
      setGmailError(error.message || "Failed to sync Gmail");
    } finally {
      setGmailBusy(false);
    }
  };
  const disconnectGmail = async () => {
    if (!session?.access_token) {
      return;
    }

    setGmailBusy(true);
    setGmailError("");

    try {
      const res = await fetch("/api/gmail/disconnect", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to disconnect Gmail");
      }

      disconnectIntegration("gmail");
      setGmailMessage("Gmail disconnected.");
    } catch (error) {
      setGmailError(error.message || "Failed to disconnect Gmail");
    } finally {
      setGmailBusy(false);
    }
  };

  const handleScan = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    if (!session?.user?.id) return;

    let publicUrl = null;
    try {
      const path = `${session.user.id}/scans/${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage.from("documents").upload(path, file);
      if (!upErr) publicUrl = supabase.storage.from("documents").getPublicUrl(path).data.publicUrl;
    } catch {}

    const scanDoc = publicUrl ? { publicUrl, name: file.name, type: file.type || "image/jpeg" } : null;
    setPendingScanDoc(scanDoc);

    let parsed = null;
    try {
      const b64 = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result.split(",")[1]); r.onerror = () => rej(new Error("fail")); r.readAsDataURL(file); });
      const { data, error } = await supabase.functions.invoke("analyze-document", { body: { data: b64, mimeType: file.type || "image/jpeg" } });
      if (!error && data) parsed = data;
    } catch {}

    if (parsed?.creditorName && parsed?.amount) {
      const created = await addDebt({
        creditorType: parsed.creditorType || "other",
        creditorName: parsed.creditorName,
        amount: parseFloat(parsed.amount),
        originalAmount: parseFloat(parsed.originalAmount || parsed.amount),
        dueDate: parsed.dueDate || new Date().toISOString().split("T")[0],
        stage: parsed.stage || "warning",
        notes: parsed.notes || "",
      });
      if (created) {
        if (scanDoc) {
          const { error: docErr } = await supabase.from("documents").insert({
            user_id: session.user.id,
            debt_id: created.id,
            file_url: scanDoc.publicUrl,
            file_name: scanDoc.name,
            file_type: scanDoc.type,
          });
          if (docErr) console.error("[scan] document insert failed:", docErr);
        }
        setPendingScanDoc(null);
        setSelectedDebt(created);
        setScreen("detail");
        return;
      }
    }

    if (parsed) setScanInitData(parsed);
    setShowAddDebt(true);
  };

  const tabs = [
    { id: "dashboard", icon: "home",    lk: "overview" },
    { id: "upload",    icon: "scan",    lk: "scan",     action: () => scanRef.current?.click() },
    { id: "calendar",  icon: "sparkle", lk: "advisor"  },
    { id: "account",   icon: "user",    lk: "account"  },
  ];

  // Loading
  if (session === undefined) {
    return (
      <>
        <style>{globalCSS}</style>
        <div style={{ minHeight: "100vh", background: "var(--paper-0)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 28, height: 28, border: "2.5px solid var(--paper-2)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </>
    );
  }

  // Not logged in
  if (!session) {
    return (
      <>
        <style>{globalCSS}</style>
        <Auth />
      </>
    );
  }

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
          {screen === "dashboard" && <Dashboard debts={debts} totalDebt={totalDebt} escalationCost={escalationCost} monthlyIncome={monthlyIncome} notifications={notifications} onViewDebt={(d) => { setSelectedDebt(d); setScreen("detail"); }} onNavigate={setScreen} bankBalance={connections.bank?.balance ?? null} bankName={connections.bank?.name ?? null} />}
          {screen === "detail" && selectedDebt && <DebtDetail debt={selectedDebt} income={income} onBack={() => setScreen("dashboard")} onDelete={deleteDebt} bankBalance={connections.bank?.balance ?? null} bankName={connections.bank?.name ?? null} onMarkPaid={markDebtPaid} onNavigate={setScreen} />}
          {screen === "calendar" && <Advisor debts={debts} income={income} />}
          {screen === "alerts" && <Alerts notifications={notifications} onViewDebt={(id) => { setSelectedDebt(debts.find(d => d.id === id)); setScreen("detail"); }} />}
          {screen === "account" && <Account profile={profile} onSaveProfile={setProfile} connections={connections} onConnect={connectIntegration} onDisconnect={disconnectIntegration} onConnectGmail={connectGmail} onSyncGmail={syncGmail} onDisconnectGmail={disconnectGmail} gmailBusy={gmailBusy} gmailMessage={gmailMessage} gmailError={gmailError} session={session} suggestedDebts={suggestedDebts} onAcceptSuggested={acceptSuggested} onDismissSuggested={dismissSuggested} />}
        </main>

        <input ref={scanRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleScan} />
        {showAddDebt && <AddDebtModal onAdd={addDebt} onClose={() => { setShowAddDebt(false); setScanInitData(null); setPendingScanDoc(null); }} initialData={scanInitData} />}

        {/* ── Floating pill nav ── */}
        <nav style={S.nav}>
          {tabs.map(tab => {
            const active = screen === tab.id;
            return (
              <button key={tab.id} style={{ ...S.navBtn, ...(active ? S.navBtnActive : {}) }} onClick={() => tab.action ? tab.action() : setScreen(tab.id)}>
                <Icon name={tab.icon} size={19} />
              </button>
            );
          })}
        </nav>
      </div>
    </LangContext.Provider>
  );
}
