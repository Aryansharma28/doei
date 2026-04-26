export const fmt = (n) => new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);

export const storage = {
  async get(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  async set(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.error("Storage error:", e);
    }
  }
};

export const globalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }

  /* ── Light tokens — warm paper / ink ───────────────────── */
  :root {
    --paper-0: #FBF7F1;
    --paper-1: #F5EFE6;
    --paper-2: #EDE5D7;
    --paper-3: #DDD3C1;

    --ink-0: #1A1714;
    --ink-1: #4A433A;
    --ink-2: #756B5C;
    --ink-3: #A99E8B;

    --accent: #C25A3C;
    --accent-deep: #9A4530;
    --accent-soft: #F2DDD2;
    --accent-tint: #FAEEE6;

    --stable-fg: #4A6B47;
    --stable-bg: #E2EBDB;
    --stable-tint: #EFF3E9;

    --warning-fg: #8A5A1F;
    --warning-bg: #F4E3C4;
    --warning-tint: #F8EFD9;

    --action-fg: #A33A2C;
    --action-bg: #F2D5CE;
    --action-tint: #F9E5DF;

    --shadow-card: 0 1px 2px rgba(26, 23, 20, 0.04), 0 4px 16px rgba(26, 23, 20, 0.04);
    --shadow-pop: 0 2px 4px rgba(26, 23, 20, 0.06), 0 12px 32px rgba(26, 23, 20, 0.08);

    /* Legacy compatibility shims (gradually being replaced) */
    --body-bg: var(--paper-0);
    --card-bg: var(--paper-1);
    --card-border: transparent;
    --card-shadow: none;
    --card-hover-shadow: var(--shadow-card);
    --warm-card-bg: var(--paper-1);
    --warm-card-border: transparent;
    --text-primary: var(--ink-0);
    --text-secondary: var(--ink-2);
    --border-color: var(--paper-2);
    --header-bg: var(--paper-0);
    --nav-bg: var(--paper-0);
    --modal-bg: var(--paper-0);
    --modal-overlay: rgba(26,23,20,0.45);
    --input-bg: var(--paper-1);
    --input-border: var(--paper-2);
    --tag-bg: var(--paper-1);
    --chip-bg: var(--paper-1);
    --alert-banner-bg: var(--accent-tint);
    --alert-banner-border: var(--accent-soft);
  }

  /* ── Dark tokens ───────────────────────────────────────── */
  [data-theme="dark"] {
    --paper-0: #181513;
    --paper-1: #211D1A;
    --paper-2: #2B2622;
    --paper-3: #3A3430;

    --ink-0: #F4EFE7;
    --ink-1: #D9D2C6;
    --ink-2: #A39B8C;
    --ink-3: #756D60;

    --accent: #E27556;
    --accent-deep: #C25A3C;
    --accent-soft: #3A241D;
    --accent-tint: #2A1B16;

    --stable-fg: #B3CFA8;
    --stable-bg: #2B3A29;
    --stable-tint: #232E22;

    --warning-fg: #E6C07A;
    --warning-bg: #3D2F1A;
    --warning-tint: #2D2415;

    --action-fg: #E89687;
    --action-bg: #3F221C;
    --action-tint: #2E1B17;

    --shadow-card: 0 1px 2px rgba(0, 0, 0, 0.3), 0 4px 16px rgba(0, 0, 0, 0.25);
    --shadow-pop: 0 2px 4px rgba(0, 0, 0, 0.4), 0 12px 32px rgba(0, 0, 0, 0.4);

    --modal-overlay: rgba(0,0,0,0.65);
  }

  /* ── Base ──────────────────────────────────────────────── */
  html, body { min-height: 100%; background: var(--paper-0); }
  body {
    font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
    color: var(--ink-0);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  input, select, button, textarea { font-family: inherit; }
  button { cursor: pointer; border: none; background: none; color: inherit; }

  [data-theme="dark"] input, [data-theme="dark"] select, [data-theme="dark"] textarea {
    color-scheme: dark;
    color: var(--ink-0);
  }

  .tabular { font-variant-numeric: tabular-nums; }

  @keyframes dotPulse { 0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }
  @keyframes screenIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
  .screen-in { animation: screenIn 0.22s ease both; }

  /* ── Scrollbar ─────────────────────────────────────────── */
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--paper-3); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--ink-3); }

  /* ── Card hover lift ───────────────────────────────────── */
  .card-lift { transition: transform 0.18s ease, box-shadow 0.18s ease !important; }
  .card-lift:hover { transform: translateY(-1px) !important; box-shadow: var(--shadow-card) !important; }
  .card-lift:active { transform: translateY(0) !important; transition-duration: 0.05s !important; }

  /* ── Input focus ring ──────────────────────────────────── */
  input:focus, select:focus, textarea:focus {
    outline: none;
    border-color: var(--accent) !important;
    box-shadow: 0 0 0 3px var(--accent-soft) !important;
    transition: box-shadow 0.15s ease, border-color 0.15s ease;
  }

  /* ── App shell — mobile only ──────────────────────────── */
  .doei-app { max-width: 480px; margin: 0 auto; min-height: 100vh; background: var(--paper-0); position: relative; }

  /* Hide legacy desktop sidebar markup if it exists */
  .doei-sidebar { display: none !important; }
`;
