const display = "'Instrument Serif', 'Source Serif 4', Georgia, serif";

export const S = {
  /* ── App shell ─────────────────────────────────────────── */
  app: { width: "100%", minHeight: "100vh", background: "var(--paper-0)", display: "flex", flexDirection: "column", position: "relative", overflowX: "hidden" },

  /* ── Header (56px, flat) ──────────────────────────────── */
  header: { position: "sticky", top: 0, zIndex: 100, background: "var(--paper-0)" },
  headerInner: { height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px" },
  logo: { display: "flex", alignItems: "center", gap: 8 },
  logoText: { fontSize: 22, fontWeight: 400, fontFamily: display, color: "var(--ink-0)", letterSpacing: "-0.01em", lineHeight: 1 },
  headerRight: { display: "flex", alignItems: "center", gap: 6 },

  /* Pill icon button (theme, bell, lang) */
  iconBtn: { width: 34, height: 34, borderRadius: 10, background: "var(--paper-1)", display: "grid", placeItems: "center", color: "var(--ink-1)", padding: 0, position: "relative", flexShrink: 0 },
  notifDot: { position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: 4, background: "var(--accent)", border: "2px solid var(--paper-0)", boxSizing: "content-box" },
  langDropBtn: { display: "flex", alignItems: "center", gap: 5, background: "var(--paper-1)", borderRadius: 10, padding: "0 9px", height: 34, color: "var(--ink-1)", flexShrink: 0 },
  langDropMenu: { position: "absolute", top: "calc(100% + 6px)", right: 0, background: "var(--paper-0)", border: "1px solid var(--paper-2)", borderRadius: 14, overflow: "hidden", zIndex: 300, minWidth: 160, boxShadow: "var(--shadow-pop)" },
  langDropItem: { display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 14px", background: "none", border: "none", borderBottom: "1px solid var(--paper-2)", cursor: "pointer", fontSize: 13, fontWeight: 500, color: "var(--ink-0)", textAlign: "left" },
  langDropItemActive: { background: "var(--paper-1)", fontWeight: 600 },

  /* ── Main / screen container ──────────────────────────── */
  main: { flex: 1, paddingBottom: 110 },
  sc: { padding: "8px 16px 16px" },
  scFlush: { padding: "4px 0 0" },

  /* ── Hero (gradient terracotta) ──────────────────────── */
  heroWrap: { padding: "4px 16px 0" },
  hero: { borderRadius: 24, padding: "24px 22px", background: "linear-gradient(140deg, var(--accent) 0%, var(--accent-deep) 60%, #823B25 100%)", color: "white", position: "relative", overflow: "hidden" },
  heroBlobA: { position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: 80, background: "rgba(255,255,255,0.08)" },
  heroBlobB: { position: "absolute", bottom: -50, left: -30, width: 120, height: 120, borderRadius: 60, background: "rgba(255,255,255,0.05)" },
  heroInner: { position: "relative", zIndex: 1 },
  heroLabel: { fontSize: 12, opacity: 0.85, letterSpacing: "0.04em", textTransform: "uppercase" },
  heroAmount: { fontSize: 44, fontWeight: 600, letterSpacing: "-0.025em", marginTop: 6, lineHeight: 1 },
  heroMeta: { marginTop: 14, display: "flex", gap: 14, fontSize: 12.5 },
  heroMetaItem: { display: "inline-flex", alignItems: "center", gap: 6, opacity: 0.95 },
  heroCta: { marginTop: 20, width: "100%", height: 48, borderRadius: 14, background: "rgba(255,255,255,0.18)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", color: "white", fontSize: 14, fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, border: "1px solid rgba(255,255,255,0.25)" },

  /* ── Stage filter cards (3-col) ──────────────────────── */
  stageRow: { padding: "16px 16px 0", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 },
  stageCard: { padding: "12px 12px", borderRadius: 16, textAlign: "left", display: "flex", flexDirection: "column", gap: 2 },
  stageCardLabel: { fontSize: 11, fontWeight: 600, letterSpacing: "0.02em" },
  stageCardCount: { fontSize: 26, fontWeight: 600, lineHeight: 1.1, marginTop: 2 },
  stageCardSub: { fontSize: 10.5, opacity: 0.75 },

  /* ── Section header + creditor list ──────────────────── */
  listSection: { padding: "20px 16px 0" },
  listHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 4px 12px" },
  listTitle: { fontSize: 16, fontWeight: 600, color: "var(--ink-0)" },
  listAction: { fontSize: 12, color: "var(--ink-2)", display: "inline-flex", alignItems: "center", gap: 4, background: "none", border: "none", padding: 0 },
  listStack: { display: "flex", flexDirection: "column", gap: 8 },

  /* Flat creditor row */
  debtCard: { display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 16, background: "var(--paper-1)", width: "100%", textAlign: "left", border: "none", cursor: "pointer" },
  dcBody: { flex: 1, minWidth: 0 },
  dcName: { fontSize: 14, fontWeight: 600, color: "var(--ink-0)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  dcMeta: { display: "flex", alignItems: "center", gap: 8, marginTop: 3 },
  dcDue: { fontSize: 11.5, color: "var(--ink-2)" },
  dcAmt: { fontSize: 14, fontWeight: 600, color: "var(--ink-0)", flexShrink: 0 },

  /* Stage chip (pill with dot) */
  stageChip: { display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 999, fontSize: 11, fontWeight: 500, letterSpacing: "0.01em" },
  stageChipDot: { width: 5, height: 5, borderRadius: 5, opacity: 0.8 },

  /* ── Bottom nav (floating dark pill) ─────────────────── */
  nav: { position: "fixed", bottom: 12, left: "50%", transform: "translateX(-50%)", width: "calc(100% - 24px)", maxWidth: 456, height: 64, borderRadius: 22, display: "flex", background: "var(--ink-0)", padding: 6, boxShadow: "0 8px 32px rgba(26,23,20,0.18)", zIndex: 100 },
  navBtn: { flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 16, fontSize: 13, fontWeight: 600, background: "transparent", color: "var(--paper-1)", transition: "background 160ms, color 160ms", border: "none", cursor: "pointer", padding: 0 },
  navBtnActive: { background: "var(--accent)", color: "white" },

  /* ── Detail screen ────────────────────────────────────── */
  scPad: { padding: "8px 16px 0" },
  backBtn: { display: "inline-flex", alignItems: "center", gap: 6, background: "var(--paper-1)", borderRadius: 999, padding: "6px 12px 6px 8px", fontSize: 13, color: "var(--ink-1)", border: "none", marginBottom: 16, fontWeight: 500 },
  debtDetailHero: { textAlign: "left", padding: "0 4px 18px" },
  detailName: { fontSize: 22, fontWeight: 600, color: "var(--ink-0)", marginBottom: 4, letterSpacing: "-0.01em" },
  detailHeroAmt: { fontSize: 42, fontWeight: 600, color: "var(--ink-0)", margin: "4px 0 12px", letterSpacing: "-0.025em", lineHeight: 1, fontVariantNumeric: "tabular-nums" },

  /* Card surfaces */
  card: { background: "var(--paper-1)", borderRadius: 18, padding: 18, marginBottom: 12, border: "none" },
  cardWarm: { background: "var(--accent-tint)", borderRadius: 18, padding: 18, marginBottom: 12 },
  cardTitle: { fontSize: 13, fontWeight: 600, color: "var(--ink-2)", marginBottom: 10, letterSpacing: "0.02em", textTransform: "uppercase" },
  cardSub: { fontSize: 13, color: "var(--ink-2)", marginBottom: 14 },

  /* Detail rows */
  dRow: { display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--paper-2)", fontSize: 14, color: "var(--ink-0)" },
  dLabel: { color: "var(--ink-2)", fontWeight: 500 },

  /* Doc upload */
  docUploadBtn: { display: "block", width: "100%", padding: 12, background: "var(--paper-2)", border: "1.5px dashed var(--paper-3)", borderRadius: 12, textAlign: "center", fontSize: 14, fontWeight: 600, color: "var(--ink-1)", cursor: "pointer", boxSizing: "border-box" },
  docTableHdr: { display: "flex", alignItems: "center", padding: "8px 0 6px", borderBottom: "1px solid var(--paper-2)", fontSize: 11, fontWeight: 600, color: "var(--ink-2)", textTransform: "uppercase", letterSpacing: 0.5, gap: 4 },
  docTableRow: { display: "flex", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--paper-2)", gap: 4 },

  deleteBtn: { width: "100%", background: "transparent", border: "1px solid var(--action-fg)", color: "var(--action-fg)", borderRadius: 14, padding: 14, fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 16 },

  /* ── Alerts list ──────────────────────────────────────── */
  alertCard: { display: "flex", alignItems: "center", gap: 12, background: "var(--paper-1)", borderRadius: 16, padding: 14, marginBottom: 8, border: "none", cursor: "pointer", width: "100%", textAlign: "left" },
  alertText: { flex: 1, fontSize: 14, lineHeight: 1.4, color: "var(--ink-0)" },
  alertArrow: { color: "var(--ink-2)", fontSize: 18 },
  empty: { textAlign: "center", padding: "60px 20px", fontSize: 15, color: "var(--ink-2)" },

  screenTitle: { fontSize: 22, fontWeight: 600, color: "var(--ink-0)", padding: "8px 4px 16px", letterSpacing: "-0.01em" },

  /* ── Advisor chat ─────────────────────────────────────── */
  advisorWrap: { display: "flex", flexDirection: "column", height: "100%", minHeight: "calc(100vh - 56px - 110px)" },
  advisorHeader: { display: "flex", alignItems: "center", gap: 12, padding: "8px 18px 14px" },
  advisorAvatar: { width: 40, height: 40, borderRadius: 12, background: "var(--accent)", color: "white", display: "grid", placeItems: "center", flexShrink: 0 },
  advisorTitle: { fontSize: 16, fontWeight: 600, color: "var(--ink-0)" },
  advisorSubtitle: { fontSize: 12, color: "var(--ink-2)" },
  chatArea: { flex: 1, overflowY: "auto", padding: "4px 16px 8px" },
  welcomeMsg: { background: "var(--paper-1)", borderRadius: 16, padding: "14px 16px", fontSize: 14, lineHeight: 1.5, color: "var(--ink-0)", marginBottom: 14 },
  chipsWrap: { display: "flex", flexDirection: "column" },
  chipsRow: { display: "flex", flexWrap: "wrap", gap: 8 },
  chip: { background: "var(--paper-1)", border: "none", borderRadius: 999, padding: "8px 14px", fontSize: 13, fontWeight: 500, color: "var(--ink-1)", cursor: "pointer" },
  msgUser: { display: "flex", justifyContent: "flex-end", marginBottom: 12 },
  msgBot: { display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 12 },
  msgBotAvatar: { width: 26, height: 26, borderRadius: 8, background: "var(--accent)", color: "white", display: "grid", placeItems: "center", flexShrink: 0, marginTop: 2 },
  msgBubbleUser: { background: "var(--ink-0)", color: "var(--paper-0)", borderRadius: "18px 18px 4px 18px", padding: "10px 14px", maxWidth: "80%", fontSize: 14, lineHeight: 1.5 },
  msgBubbleBot: { background: "var(--paper-1)", borderRadius: "18px 18px 18px 4px", padding: "10px 14px", maxWidth: "85%", fontSize: 14, lineHeight: 1.5, color: "var(--ink-0)" },
  thinkingDots: { display: "flex", gap: 5, padding: "4px 0" },
  dot: { width: 7, height: 7, borderRadius: 4, background: "var(--ink-2)", animation: "dotPulse 1.4s ease-in-out infinite" },
  chatInputWrap: { display: "flex", gap: 8, padding: "10px 16px 14px", background: "var(--paper-0)", flexShrink: 0 },
  chatInput: { flex: 1, padding: "12px 16px", border: "1px solid var(--paper-2)", borderRadius: 999, fontSize: 15, background: "var(--paper-1)", outline: "none", color: "var(--ink-0)" },
  sendBtn: { width: 44, height: 44, borderRadius: 22, background: "var(--accent)", color: "white", border: "none", cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 },

  /* ── Modals ───────────────────────────────────────────── */
  modalOL: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "var(--modal-overlay)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" },
  modal: { background: "var(--paper-0)", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 480, maxHeight: "92vh", overflowY: "auto", padding: "20px 18px 36px" },
  modalHdr: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  modalTitle: { fontSize: 20, fontWeight: 600, color: "var(--ink-0)" },
  modalClose: { background: "var(--paper-1)", border: "none", width: 32, height: 32, borderRadius: 16, fontSize: 22, color: "var(--ink-1)", cursor: "pointer", padding: 0, lineHeight: 1, display: "grid", placeItems: "center" },

  /* Form */
  fg: { marginBottom: 14 },
  fLabel: { display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-2)", marginBottom: 6, letterSpacing: "0.02em", textTransform: "uppercase" },
  fInput: { width: "100%", padding: "12px 14px", border: "1px solid var(--paper-2)", borderRadius: 12, fontSize: 15, background: "var(--paper-1)", outline: "none", color: "var(--ink-0)" },
  fSelect: { width: "100%", padding: "12px 14px", border: "1px solid var(--paper-2)", borderRadius: 12, fontSize: 15, background: "var(--paper-1)", outline: "none", color: "var(--ink-0)" },
  fRow: { display: "flex", gap: 10 },
  submitBtn: { width: "100%", padding: 16, background: "var(--accent)", color: "white", border: "none", borderRadius: 14, fontSize: 15, fontWeight: 600, cursor: "pointer", marginTop: 10 },

  photoSec: { marginBottom: 18 },
  photoBtn: { width: "100%", padding: 16, background: "var(--paper-1)", border: "1.5px dashed var(--paper-3)", borderRadius: 14, fontSize: 15, fontWeight: 600, color: "var(--ink-1)", cursor: "pointer" },
  photoDivider: { textAlign: "center", margin: "14px 0", fontSize: 12, color: "var(--ink-2)", letterSpacing: "0.03em", textTransform: "uppercase" },

  /* ── Calendar (kept simple, light tweaks) ────────────── */
  calLeg: { display: "flex", gap: 16, marginBottom: 14, padding: "0 4px" },
  calLI: { display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--ink-2)" },
  calDot: { width: 8, height: 8, borderRadius: 4, display: "inline-block" },
  calGrid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 },
  calDay: { background: "var(--paper-1)", borderRadius: 10, padding: "8px 4px", textAlign: "center", minHeight: 70 },
  calToday: { outline: "2px solid var(--accent)", background: "var(--accent-tint)" },
  calDayNum: { fontSize: 13, fontWeight: 600, marginBottom: 4, color: "var(--ink-0)" },
  calDayDots: { display: "flex", justifyContent: "center", gap: 3, marginBottom: 2 },
  calDayAmt: { fontSize: 9, fontWeight: 600, color: "var(--accent)" },

  /* Hidden FAB — replaced by hero CTA */
  fab: { display: "none" },
};
