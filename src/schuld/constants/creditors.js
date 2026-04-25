export const CREDITOR_TYPES = [
  { id: "belasting", labelKey: "cr_belasting", icon: "🏛️", color: "#E07A5F", type: "public", channel: "Vorderingenoverzicht Rijk" },
  { id: "toeslagen", labelKey: "cr_toeslagen", icon: "💸", color: "#DDA15E", type: "public", channel: "Vorderingenoverzicht Rijk" },
  { id: "cjib", labelKey: "cr_cjib", icon: "⚖️", color: "#F2CC8F", type: "public", channel: "Vorderingenoverzicht Rijk" },
  { id: "duo", labelKey: "cr_duo", icon: "🎓", color: "#7209B7", type: "public", channel: "Vorderingenoverzicht Rijk" },
  { id: "gemeente", labelKey: "cr_gemeente", icon: "🏘️", color: "#3D405B", type: "public", channel: "Medeoverheid (TBD)" },
  { id: "cak", labelKey: "cr_cak", icon: "🏥", color: "#48BFE3", type: "public", channel: "Vorderingenoverzicht Rijk" },
  { id: "zorg", labelKey: "cr_zorg", icon: "➕", color: "#81B29A", type: "semi-public", channel: "Vroegsignalering (Wgs)" },
  { id: "energie", labelKey: "cr_energie", icon: "⚡", color: "#F4A261", type: "private", channel: "Vroegsignalering (Wgs)" },
  { id: "huur", labelKey: "cr_huur", icon: "🏠", color: "#E76F51", type: "private", channel: "Vroegsignalering (Wgs)" },
  { id: "water", labelKey: "cr_water", icon: "💧", color: "#457B9D", type: "private", channel: "Vroegsignalering (Wgs)" },
  { id: "telecom", labelKey: "cr_telecom", icon: "📱", color: "#264653", type: "private", channel: "Standard creditor" },
  { id: "hypotheek", labelKey: "cr_hypotheek", icon: "🔑", color: "#4A4E69", type: "private", channel: "BKR-registered" },
  { id: "bank", labelKey: "cr_bank", icon: "🏦", color: "#606C38", type: "private", channel: "BKR-registered" },
  { id: "klarna", labelKey: "cr_klarna", icon: "🟠", color: "#FFB3C7", type: "private", channel: "BKR (pending CCDII)" },
  { id: "bnpl", labelKey: "cr_bnpl", icon: "🛒", color: "#BC6C25", type: "private", channel: "BKR (pending CCDII)" },
  { id: "incasso", labelKey: "cr_incasso", icon: "📨", color: "#9B2226", type: "private", channel: "Standard creditor" },
  { id: "overig", labelKey: "cr_overig", icon: "📄", color: "#6C757D", type: "private", channel: "—" },
];

export const STAGE_KEYS = [
  { id: "factuur", labelKey: "invoice", color: "#81B29A" },
  { id: "herinnering", labelKey: "reminder", color: "#F2CC8F" },
  { id: "aanmaning", labelKey: "warning", color: "#F4A261" },
  { id: "incasso", labelKey: "collection", color: "#E76F51" },
  { id: "deurwaarder", labelKey: "bailiff", color: "#9B2226" },
];

export const getCreditor = (id) => CREDITOR_TYPES.find(c => c.id === id) || CREDITOR_TYPES[CREDITOR_TYPES.length - 1];
export const getStageData = (id) => STAGE_KEYS.find(s => s.id === id) || STAGE_KEYS[0];
