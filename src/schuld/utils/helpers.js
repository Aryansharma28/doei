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
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
  :root { --bg: #FAFAF7; --card-bg: #FFFFFF; --text-primary: #1A1A2E; --text-secondary: #6B7280; --border-color: #E8E8E3; }
  body { font-family: 'DM Sans', sans-serif; background: var(--bg); color: var(--text-primary); }
  input, select, button { font-family: inherit; }
`;
