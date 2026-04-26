# Mock debt letters — 13 Dutch vendors

Generated 2026-04-26 for doei. Each PDF uses a different layout (government letter, utility bill, debt-collector sommatie, BNPL app-style, etc.).

## Vendors

| # | PDF | Template | Type | Vendor | Amount | Original | Due | Stage |
|---|---|---|---|---|---|---|---|---|
| 1 | `01_belastingdienst.pdf` | government | `belasting` | Belastingdienst | €1247.50 | €1247.50 | 2026-05-03 | action_needed |
| 2 | `02_cjib.pdf` | cjib | `cjib` | CJIB | €298.00 | €189.00 | 2026-05-01 | action_needed |
| 3 | `03_duo.pdf` | government | `duo` | DUO | €127.50 | €127.50 | 2026-05-10 | warning |
| 4 | `04_cak.pdf` | government | `cak` | CAK | €387.45 | €387.45 | 2026-05-17 | warning |
| 5 | `05_zilveren_kruis.pdf` | insurance | `zorg` | Zilveren Kruis | €312.00 | €234.00 | 2026-04-28 | action_needed |
| 6 | `06_eneco.pdf` | utility | `energie` | Eneco | €189.34 | €189.34 | 2026-05-06 | warning |
| 7 | `07_woonstad.pdf` | housing | `huur` | Woonstad Rotterdam | €825.00 | €825.00 | 2026-04-29 | action_needed |
| 8 | `08_vitens.pdf` | utility | `water` | Vitens | €98.20 | €98.20 | 2026-05-14 | warning |
| 9 | `09_kpn.pdf` | utility | `telecom` | KPN | €76.50 | €76.50 | 2026-05-08 | stable |
| 10 | `10_ing.pdf` | bank | `bank` | ING Bank | €215.00 | €215.00 | 2026-05-04 | warning |
| 11 | `11_klarna.pdf` | bnpl | `klarna` | Klarna | €124.99 | €124.99 | 2026-04-30 | warning |
| 12 | `12_intrum.pdf` | collector | `incasso` | Intrum Nederland | €445.00 | €312.00 | 2026-04-27 | action_needed |
| 13 | `13_gemeente_amsterdam.pdf` | government | `gemeente` | Gemeente Amsterdam | €67.00 | €67.00 | 2026-05-11 | stable |

## Load the 13 debts onto YOUR account (keep auth + profile)

Open the running app in your browser, sign in normally, then open DevTools → Console and paste the contents of `seed-my-account.js`.

It will:
- keep your `profile` (name, phone, email)
- keep your language preference
- replace `debts` with the 13 mocks
- reset `income` to €2,180 salary + €154 zorgtoeslag
- clear `connections` (gmail/bank integrations)

After reload you'll see all 13 debts pre-loaded. Open each debt and upload its matching PDF in the document section to attach the letter.