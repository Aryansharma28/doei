export const CREDITOR_TYPES = [
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

export const STAGE_KEYS = [
  { id: "factuur", labelKey: "invoice", color: "#81B29A" },
  { id: "herinnering", labelKey: "reminder", color: "#F2CC8F" },
  { id: "aanmaning", labelKey: "warning", color: "#F4A261" },
  { id: "incasso", labelKey: "collection", color: "#E76F51" },
  { id: "deurwaarder", labelKey: "bailiff", color: "#9B2226" },
];

export const getCreditor = (id) => CREDITOR_TYPES.find(c => c.id === id) || CREDITOR_TYPES[12];
export const getStageData = (id) => STAGE_KEYS.find(s => s.id === id) || STAGE_KEYS[0];
