export const fmt = (n) => new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);

export const storage = {
  async get(key) {
    try {
      const r = await window.storage.get(key);
      return r ? JSON.parse(r.value) : null;
    } catch {
      return null;
    }
  },
  async set(key, val) {
    try {
      await window.storage.set(key, JSON.stringify(val));
    } catch (e) {
      console.error("Storage error:", e);
    }
  }
};

export const globalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700&family=Instrument+Sans:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
  :root { --bg: #FAFAF7; --card-bg: #FFFFFF; --text-primary: #1A1A2E; --text-secondary: #6B7280; --border-color: #E8E8E3; --sidebar-w: 240px; }
  body { font-family: 'Instrument Sans', sans-serif; background: var(--bg); color: var(--text-primary); }
  input, select, button { font-family: inherit; }
  @keyframes dotPulse { 0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }
  @keyframes screenIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

  /* ── Scrollbar ───────────────────────────────────────────── */
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(61,64,91,0.16); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(61,64,91,0.3); }

  /* ── Hover lift (applied as className) ───────────────────── */
  .card-lift { transition: transform 0.18s ease, box-shadow 0.18s ease !important; }
  .card-lift:hover { transform: translateY(-2px) !important; box-shadow: 0 8px 28px rgba(0,0,0,0.1), 0 2px 6px rgba(0,0,0,0.06) !important; }
  .card-lift:active { transform: translateY(0px) !important; transition-duration: 0.05s !important; }

  /* ── Screen fade-in ──────────────────────────────────────── */
  .screen-in { animation: screenIn 0.2s ease both; }

  /* ── Input / Select focus ring ───────────────────────────── */
  input:focus, select:focus, textarea:focus {
    outline: none;
    border-color: #3D405B !important;
    box-shadow: 0 0 0 3px rgba(61,64,91,0.12) !important;
    transition: box-shadow 0.15s ease, border-color 0.15s ease;
  }

  /* ── Mobile nav button hover ─────────────────────────────── */
  .doei-nav button:hover { color: #3D405B !important; }

  /* ── Desktop layout ──────────────────────────────────────── */
  .doei-sidebar { display: none; }

  @media (min-width: 768px) {
    body { background: #EDEDEA; }

    .doei-app {
      max-width: none !important;
      margin: 0 !important;
      display: flex;
      flex-direction: row;
      min-height: 100vh;
      border-radius: 0 !important;
    }

    /* Sidebar */
    .doei-sidebar {
      display: flex;
      flex-direction: column;
      width: var(--sidebar-w);
      min-height: 100vh;
      position: fixed;
      left: 0; top: 0;
      background: linear-gradient(170deg, #3D405B 0%, #2B2E45 100%);
      z-index: 200;
      padding: 0;
      gap: 0;
      box-shadow: 2px 0 12px rgba(0,0,0,0.12);
    }
    .doei-sidebar-logo {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 24px 20px 20px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .doei-sidebar-logo-icon { font-size: 22px; color: rgba(255,255,255,0.9); }
    .doei-sidebar-logo-text { font-size: 18px; font-weight: 700; color: white; font-family: 'Source Serif 4', Georgia, serif; letter-spacing: -0.3px; }
    .doei-sidebar-nav { display: flex; flex-direction: column; gap: 2px; padding: 16px 10px; flex: 1; }
    .doei-sidebar-btn {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 11px 14px;
      border-radius: 10px;
      border: none;
      background: none;
      color: rgba(255,255,255,0.55);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      width: 100%;
      text-align: left;
      transition: background 0.15s, color 0.15s;
      position: relative;
    }
    .doei-sidebar-btn:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.9); }
    .doei-sidebar-btn.active {
      background: rgba(255,255,255,0.12);
      color: white;
      font-weight: 600;
    }
    .doei-sidebar-btn.active::before {
      content: '';
      position: absolute;
      left: 0; top: 50%;
      transform: translateY(-50%);
      width: 3px; height: 60%;
      background: rgba(255,255,255,0.7);
      border-radius: 0 2px 2px 0;
    }
    .doei-sidebar-icon { font-size: 18px; width: 22px; text-align: center; flex-shrink: 0; }
    .doei-sidebar-bottom {
      padding: 14px 10px 24px;
      border-top: 1px solid rgba(255,255,255,0.1);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .doei-sidebar-add {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 11px;
      background: rgba(255,255,255,0.14);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
    }
    .doei-sidebar-add:hover { background: rgba(255,255,255,0.22); }
    .doei-sidebar-lang {
      display: flex;
      background: rgba(255,255,255,0.08);
      border-radius: 8px;
      padding: 2px;
      border: none;
      cursor: pointer;
      gap: 0;
      width: 100%;
      justify-content: center;
    }
    .doei-sidebar-lang-opt {
      flex: 1;
      text-align: center;
      padding: 5px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      color: rgba(255,255,255,0.5);
      letter-spacing: 0.5px;
      transition: all 0.2s;
    }
    .doei-sidebar-lang-opt.active { background: rgba(255,255,255,0.18); color: white; }
    .doei-sidebar-notif {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      border-radius: 10px;
      background: rgba(224,122,95,0.2);
      border: none;
      color: #F2CC8F;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      text-align: left;
      transition: background 0.15s;
    }
    .doei-sidebar-notif:hover { background: rgba(224,122,95,0.3); }

    /* Hide mobile-only elements */
    .doei-header { display: none !important; }
    .doei-nav   { display: none !important; }
    .doei-fab   { display: none !important; }

    /* Main content area */
    .doei-main {
      margin-left: var(--sidebar-w) !important;
      padding-bottom: 40px !important;
      flex: 1;
      min-height: 100vh;
      max-width: none !important;
    }

    /* Content width cap + screen padding */
    .doei-main > * { max-width: 780px; margin-left: auto; margin-right: auto; }
    .doei-sc { padding: 36px 48px 52px !important; }

    /* Advisor fills full height on desktop */
    .doei-advisor-wrap { min-height: 100vh !important; }
  }
`;
