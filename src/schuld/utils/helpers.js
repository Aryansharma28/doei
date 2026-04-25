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
  :root { --bg: #FAFAF7; --card-bg: #FFFFFF; --text-primary: #1A1A2E; --text-secondary: #6B7280; --border-color: #E8E8E3; }
  body { font-family: 'Instrument Sans', sans-serif; background: var(--bg); color: var(--text-primary); }
  input, select, button { font-family: inherit; }
  @keyframes dotPulse { 0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }
`;
