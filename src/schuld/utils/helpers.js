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

  /* ── Light mode tokens ─────────────────────────────────── */
  :root {
    --body-bg: linear-gradient(160deg, #E8EDF5 0%, #EDE8F5 40%, #F5EDE8 70%, #E8F5EE 100%);
    --card-bg: rgba(255,255,255,0.55);
    --card-border: rgba(255,255,255,0.82);
    --card-shadow: 0 8px 32px rgba(31,38,135,0.07), 0 2px 8px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.9);
    --card-blur: blur(20px) saturate(1.6);
    --card-hover-shadow: 0 14px 44px rgba(31,38,135,0.13), 0 4px 14px rgba(0,0,0,0.07);
    --warm-card-bg: rgba(253,250,246,0.6);
    --warm-card-border: rgba(237,232,224,0.78);
    --text-primary: #1A1A2E;
    --text-secondary: #6B7280;
    --border-color: rgba(0,0,0,0.09);
    --header-bg: rgba(255,255,255,0.72);
    --nav-bg: rgba(255,255,255,0.82);
    --modal-bg: rgba(248,248,245,0.92);
    --modal-overlay: rgba(0,0,0,0.35);
    --input-bg: rgba(255,255,255,0.78);
    --input-border: rgba(0,0,0,0.12);
    --tag-bg: rgba(0,0,0,0.06);
    --chip-bg: rgba(255,255,255,0.72);
    --lang-toggle-bg: rgba(0,0,0,0.07);
    --lang-active-bg: #3D405B;
    --lang-active-color: white;
    --nav-active-color: #3D405B;
    --alert-banner-bg: rgba(255,243,235,0.88);
    --alert-banner-border: rgba(242,204,143,0.8);
    --sidebar-w: 240px;
    --sidebar-bg: rgba(255,255,255,0.82);
    --sidebar-border-color: rgba(0,0,0,0.08);
    --sidebar-btn-text: rgba(26,26,46,0.5);
    --sidebar-btn-active: #1A1A2E;
    --sidebar-active-bg: rgba(61,64,91,0.1);
    --sidebar-hover-bg: rgba(61,64,91,0.06);
    --sidebar-logo-color: #3D405B;
    --sidebar-indicator: rgba(61,64,91,0.7);
    --sidebar-add-bg: rgba(61,64,91,0.1);
    --sidebar-add-color: #3D405B;
    --sidebar-add-hover: rgba(61,64,91,0.17);
    --sidebar-lang-bg: rgba(0,0,0,0.05);
    --sidebar-lang-opt: rgba(26,26,46,0.4);
    --sidebar-lang-active-bg: rgba(61,64,91,0.12);
    --sidebar-lang-active: #3D405B;
  }

  /* ── Dark mode tokens ──────────────────────────────────── */
  [data-theme="dark"] {
    --body-bg: linear-gradient(135deg, #080812 0%, #10082A 45%, #0A080A 75%, #08100A 100%);
    --card-bg: rgba(255,255,255,0.07);
    --card-border: rgba(255,255,255,0.12);
    --card-shadow: 0 8px 32px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.06);
    --card-blur: blur(20px) saturate(1.35);
    --card-hover-shadow: 0 14px 44px rgba(0,0,0,0.6), 0 4px 14px rgba(0,0,0,0.35);
    --warm-card-bg: rgba(255,255,255,0.06);
    --warm-card-border: rgba(255,255,255,0.1);
    --text-primary: #F0F0F8;
    --text-secondary: #9CA3AF;
    --border-color: rgba(255,255,255,0.1);
    --header-bg: rgba(8,8,18,0.76);
    --nav-bg: rgba(8,8,18,0.88);
    --modal-bg: rgba(12,12,24,0.94);
    --modal-overlay: rgba(0,0,0,0.62);
    --input-bg: rgba(255,255,255,0.07);
    --input-border: rgba(255,255,255,0.15);
    --tag-bg: rgba(255,255,255,0.1);
    --chip-bg: rgba(255,255,255,0.08);
    --lang-toggle-bg: rgba(255,255,255,0.08);
    --lang-active-bg: rgba(255,255,255,0.18);
    --lang-active-color: white;
    --nav-active-color: rgba(255,255,255,0.95);
    --alert-banner-bg: rgba(255,243,235,0.08);
    --alert-banner-border: rgba(242,204,143,0.2);
    --sidebar-bg: rgba(8,8,18,0.9);
    --sidebar-border-color: rgba(255,255,255,0.08);
    --sidebar-btn-text: rgba(255,255,255,0.45);
    --sidebar-btn-active: rgba(255,255,255,0.95);
    --sidebar-active-bg: rgba(255,255,255,0.1);
    --sidebar-hover-bg: rgba(255,255,255,0.07);
    --sidebar-logo-color: rgba(255,255,255,0.9);
    --sidebar-indicator: rgba(255,255,255,0.72);
    --sidebar-add-bg: rgba(255,255,255,0.12);
    --sidebar-add-color: rgba(255,255,255,0.9);
    --sidebar-add-hover: rgba(255,255,255,0.18);
    --sidebar-lang-bg: rgba(255,255,255,0.07);
    --sidebar-lang-opt: rgba(255,255,255,0.4);
    --sidebar-lang-active-bg: rgba(255,255,255,0.15);
    --sidebar-lang-active: white;
  }

  /* ── Base ──────────────────────────────────────────────── */
  html { min-height: 100%; background: var(--body-bg); background-attachment: fixed; }
  body {
    font-family: 'Instrument Sans', sans-serif;
    background: transparent;
    color: var(--text-primary);
    min-height: 100vh;
  }
  input, select, button { font-family: inherit; }

  /* Dark mode input overrides */
  [data-theme="dark"] input,
  [data-theme="dark"] select,
  [data-theme="dark"] textarea {
    color-scheme: dark;
    color: var(--text-primary);
  }

  @keyframes dotPulse { 0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }
  @keyframes screenIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

  /* ── Scrollbar ───────────────────────────────────────────── */
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(61,64,91,0.16); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(61,64,91,0.3); }

  /* ── Hover lift ───────────────────────────────────────────── */
  .card-lift { transition: transform 0.18s ease, box-shadow 0.18s ease !important; }
  .card-lift:hover { transform: translateY(-2px) !important; box-shadow: var(--card-hover-shadow) !important; }
  .card-lift:active { transform: translateY(0px) !important; transition-duration: 0.05s !important; }

  /* ── Screen fade-in ──────────────────────────────────────── */
  .screen-in { animation: screenIn 0.2s ease both; }

  /* ── Input focus ring ───────────────────────────────────── */
  input:focus, select:focus, textarea:focus {
    outline: none;
    border-color: #3D405B !important;
    box-shadow: 0 0 0 3px rgba(61,64,91,0.12) !important;
    transition: box-shadow 0.15s ease, border-color 0.15s ease;
  }
  [data-theme="dark"] input:focus,
  [data-theme="dark"] select:focus,
  [data-theme="dark"] textarea:focus {
    border-color: rgba(255,255,255,0.4) !important;
    box-shadow: 0 0 0 3px rgba(255,255,255,0.08) !important;
  }

  /* ── Mobile nav hover ────────────────────────────────────── */
  .doei-nav button:hover { color: var(--nav-active-color) !important; }

  /* ── Desktop layout ──────────────────────────────────────── */
  .doei-sidebar { display: none; }

  @media (min-width: 768px) {
    html { background: var(--body-bg); background-attachment: fixed; }
    body { background: transparent; }

    .doei-app {
      max-width: none !important;
      margin: 0 !important;
      display: flex;
      flex-direction: row;
      min-height: 100vh;
      border-radius: 0 !important;
      background: transparent !important;
    }

    /* Sidebar */
    .doei-sidebar {
      display: flex;
      flex-direction: column;
      width: var(--sidebar-w);
      min-height: 100vh;
      position: fixed;
      left: 0; top: 0;
      background: var(--sidebar-bg);
      backdrop-filter: blur(24px) saturate(1.5);
      -webkit-backdrop-filter: blur(24px) saturate(1.5);
      z-index: 200;
      padding: 0;
      gap: 0;
      border-right: 1px solid var(--sidebar-border-color);
      box-shadow: 2px 0 20px rgba(0,0,0,0.08);
    }
    .doei-sidebar-logo {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 24px 20px 20px;
      border-bottom: 1px solid var(--sidebar-border-color);
    }
    .doei-sidebar-logo-icon { font-size: 22px; color: var(--sidebar-logo-color); }
    .doei-sidebar-logo-text {
      font-size: 18px;
      font-weight: 700;
      color: var(--sidebar-logo-color);
      font-family: 'Source Serif 4', Georgia, serif;
      letter-spacing: -0.3px;
    }
    .doei-sidebar-nav { display: flex; flex-direction: column; gap: 2px; padding: 16px 10px; flex: 1; }
    .doei-sidebar-btn {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 11px 14px;
      border-radius: 10px;
      border: none;
      background: none;
      color: var(--sidebar-btn-text);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      width: 100%;
      text-align: left;
      transition: background 0.15s, color 0.15s;
      position: relative;
    }
    .doei-sidebar-btn:hover { background: var(--sidebar-hover-bg); color: var(--sidebar-btn-active); }
    .doei-sidebar-btn.active {
      background: var(--sidebar-active-bg);
      color: var(--sidebar-btn-active);
      font-weight: 600;
    }
    .doei-sidebar-btn.active::before {
      content: '';
      position: absolute;
      left: 0; top: 50%;
      transform: translateY(-50%);
      width: 3px; height: 60%;
      background: var(--sidebar-indicator);
      border-radius: 0 2px 2px 0;
    }
    .doei-sidebar-icon { font-size: 18px; width: 22px; text-align: center; flex-shrink: 0; }
    .doei-sidebar-bottom {
      padding: 14px 10px 24px;
      border-top: 1px solid var(--sidebar-border-color);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .doei-sidebar-add {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 11px;
      background: var(--sidebar-add-bg);
      color: var(--sidebar-add-color);
      border: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
    }
    .doei-sidebar-add:hover { background: var(--sidebar-add-hover); }
    .doei-sidebar-lang {
      display: flex;
      background: var(--sidebar-lang-bg);
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
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 6px 8px;
      border-radius: 6px;
      border: none;
      background: none;
      cursor: pointer;
      opacity: 0.45;
      transition: all 0.2s;
    }
    .doei-sidebar-lang-opt.active { background: var(--sidebar-lang-active-bg); opacity: 1; }
    .doei-sidebar-theme {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 9px 14px;
      border-radius: 10px;
      background: var(--sidebar-lang-bg);
      border: 1px solid var(--sidebar-border-color);
      cursor: pointer;
      color: var(--sidebar-btn-text);
      font-size: 13px;
      font-weight: 500;
      width: 100%;
      transition: background 0.15s;
    }
    .doei-sidebar-theme:hover { background: var(--sidebar-hover-bg); }

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
