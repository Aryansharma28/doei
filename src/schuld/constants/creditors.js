export const CREDITOR_TYPES = [
  { id: "belasting", labelKey: "cr_belasting", icon: "🏛️", color: "#E07A5F", type: "public", channel: "Vorderingenoverzicht Rijk", paymentUrl: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/bijzondere_situaties/schulden/betalen_aan_de_belastingdienst/betalen_aan_de_belastingdienst" },
  { id: "toeslagen", labelKey: "cr_toeslagen", icon: "💸", color: "#DDA15E", type: "public", channel: "Vorderingenoverzicht Rijk", paymentUrl: "https://mijn.belastingdienst.nl/mijn/mijntoeslagen/overzichttoeslagen" },
  { id: "cjib", labelKey: "cr_cjib", icon: "⚖️", color: "#F2CC8F", type: "public", channel: "Vorderingenoverzicht Rijk", paymentUrl: "https://www.cjib.nl/betalen-van-een-boete" },
  { id: "duo", labelKey: "cr_duo", icon: "🎓", color: "#7209B7", type: "public", channel: "Vorderingenoverzicht Rijk", paymentUrl: "https://www.duo.nl/particulier/studieschuld/terugbetalen-studieschuld.jsp" },
  { id: "gemeente", labelKey: "cr_gemeente", icon: "🏘️", color: "#3D405B", type: "public", channel: "Medeoverheid (TBD)", paymentUrl: null },
  { id: "cak", labelKey: "cr_cak", icon: "🏥", color: "#48BFE3", type: "public", channel: "Vorderingenoverzicht Rijk", paymentUrl: "https://www.hetcak.nl/clienten/betalen" },
  { id: "zorg", labelKey: "cr_zorg", icon: "➕", color: "#81B29A", type: "semi-public", channel: "Vroegsignalering (Wgs)", paymentUrl: null },
  { id: "energie", labelKey: "cr_energie", icon: "⚡", color: "#F4A261", type: "private", channel: "Vroegsignalering (Wgs)", paymentUrl: null },
  { id: "huur", labelKey: "cr_huur", icon: "🏠", color: "#E76F51", type: "private", channel: "Vroegsignalering (Wgs)", paymentUrl: null },
  { id: "water", labelKey: "cr_water", icon: "💧", color: "#457B9D", type: "private", channel: "Vroegsignalering (Wgs)", paymentUrl: null },
  { id: "telecom", labelKey: "cr_telecom", icon: "📱", color: "#264653", type: "private", channel: "Standard creditor", paymentUrl: null },
  { id: "hypotheek", labelKey: "cr_hypotheek", icon: "🔑", color: "#4A4E69", type: "private", channel: "BKR-registered", paymentUrl: null },
  { id: "bank", labelKey: "cr_bank", icon: "🏦", color: "#606C38", type: "private", channel: "BKR-registered", paymentUrl: null },
  { id: "klarna", labelKey: "cr_klarna", icon: "🟠", color: "#FFB3C7", type: "private", channel: "BKR (pending CCDII)", paymentUrl: "https://app.klarna.com/" },
  { id: "bnpl", labelKey: "cr_bnpl", icon: "🛒", color: "#BC6C25", type: "private", channel: "BKR (pending CCDII)", paymentUrl: null },
  { id: "incasso", labelKey: "cr_incasso", icon: "📨", color: "#9B2226", type: "private", channel: "Standard creditor", paymentUrl: null },
  { id: "overig", labelKey: "cr_overig", icon: "📄", color: "#6C757D", type: "private", channel: "—", paymentUrl: null },
];

export const STAGE_KEYS = [
  { id: "stable",        labelKey: "stage_stable",        color: "var(--stable-fg)",  bg: "var(--stable-bg)",  tint: "var(--stable-tint)"  },
  { id: "warning",       labelKey: "stage_warning",       color: "var(--warning-fg)", bg: "var(--warning-bg)", tint: "var(--warning-tint)" },
  { id: "action_needed", labelKey: "stage_action_needed", color: "var(--action-fg)",  bg: "var(--action-bg)",  tint: "var(--action-tint)"  },
];

export const getCreditor = (id) => CREDITOR_TYPES.find(c => c.id === id) || CREDITOR_TYPES[CREDITOR_TYPES.length - 1];
export const getStageData = (id) => STAGE_KEYS.find(s => s.id === id) || STAGE_KEYS[0];
