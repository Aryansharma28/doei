export const DEMO_DEBTS = [
  { id: "d1", creditorType: "belasting", creditorName: "Belastingdienst", amount: 2340, originalAmount: 2340, dueDate: "2026-05-10", stage: "herinnering", notes: "Inkomstenbelasting 2024", createdAt: "2026-01-15" },
  { id: "d2", creditorType: "cjib", creditorName: "CJIB", amount: 490, originalAmount: 490, dueDate: "2026-05-03", stage: "factuur", notes: "Verkeersboete A10", createdAt: "2026-02-20" },
  { id: "d3", creditorType: "zorg", creditorName: "Zilveren Kruis", amount: 876, originalAmount: 876, dueDate: "2026-05-18", stage: "herinnering", notes: "Eigen risico 2025", createdAt: "2026-03-10" },
  { id: "d4", creditorType: "energie", creditorName: "Vattenfall", amount: 1240, originalAmount: 1240, dueDate: "2026-04-28", stage: "factuur", notes: "Jaarafrekening gas/stroom", createdAt: "2025-11-05" },
  { id: "d5", creditorType: "gemeente", creditorName: "Gemeente Amsterdam", amount: 650, originalAmount: 650, dueDate: "2026-06-01", stage: "factuur", notes: "Gemeentebelasting 2026", createdAt: "2026-04-01" },
  { id: "d6", creditorType: "toeslagen", creditorName: "Belastingdienst/Toeslagen", amount: 1820, originalAmount: 1820, dueDate: "2026-05-25", stage: "herinnering", notes: "Zorgtoeslag terugvordering", createdAt: "2026-03-28" },
  { id: "d7", creditorType: "huur", creditorName: "Ymere", amount: 430, originalAmount: 430, dueDate: "2026-05-01", stage: "herinnering", notes: "Huurachterstand maart", createdAt: "2026-04-05" },
  { id: "d8", creditorType: "duo", creditorName: "DUO", amount: 16400, originalAmount: 16400, dueDate: "2026-07-01", stage: "factuur", notes: "Studieschuld terugbetaling", createdAt: "2024-09-01" },
  { id: "d9", creditorType: "cak", creditorName: "CAK", amount: 320, originalAmount: 320, dueDate: "2026-05-15", stage: "herinnering", notes: "Eigen bijdrage Wmo 2025", createdAt: "2026-02-10" },
  { id: "d10", creditorType: "klarna", creditorName: "Klarna", amount: 285, originalAmount: 285, dueDate: "2026-05-05", stage: "factuur", notes: "3x gespreide betaling webshop", createdAt: "2026-03-15" },
  { id: "d11", creditorType: "bnpl", creditorName: "Riverty (Afterpay)", amount: 178, originalAmount: 178, dueDate: "2026-05-12", stage: "herinnering", notes: "Online bestelling januari", createdAt: "2026-01-28" },
];

export const DEMO_MAIL = [
  { id: "m1", debtId: "d1", date: "2026-04-20", subject: "Aanmaning inkomstenbelasting", creditorType: "belasting", status: "action", amount: 2340 },
  { id: "m2", debtId: "d2", date: "2026-04-18", subject: "Overdracht aan incasso", creditorType: "cjib", status: "action", amount: 490 },
  { id: "m3", debtId: "d4", date: "2026-04-15", subject: "Laatste herinnering jaarafrekening", creditorType: "energie", status: "escalated", amount: 1240 },
  { id: "m4", debtId: "d3", date: "2026-04-12", subject: "Betalingsherinnering eigen risico", creditorType: "zorg", status: "action", amount: 876 },
  { id: "m5", debtId: "d7", date: "2026-04-10", subject: "Aanmaning huurachterstand", creditorType: "huur", status: "done", amount: 430 },
  { id: "m6", debtId: "d6", date: "2026-04-08", subject: "Terugvordering zorgtoeslag", creditorType: "toeslagen", status: "action", amount: 1820 },
  { id: "m7", debtId: "d8", date: "2026-04-05", subject: "Overzicht studieschuld 2026", creditorType: "duo", status: "done", amount: 16400 },
  { id: "m8", debtId: "d9", date: "2026-04-02", subject: "Herinnering eigen bijdrage Wmo", creditorType: "cak", status: "action", amount: 320 },
  { id: "m9", debtId: "d10", date: "2026-04-22", subject: "Aanmaning openstaand bedrag", creditorType: "klarna", status: "action", amount: 285 },
  { id: "m10", debtId: "d11", date: "2026-04-14", subject: "Betalingsherinnering Riverty", creditorType: "bnpl", status: "action", amount: 178 },
];

export const DEMO_INCOME = [
  { id: "i1", label: "Salaris", amount: 2180, day: 25 },
  { id: "i2", label: "Zorgtoeslag", amount: 154, day: 20 },
  { id: "i3", label: "Huurtoeslag", amount: 230, day: 20 },
];
