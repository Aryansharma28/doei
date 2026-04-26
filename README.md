# doei

**👉 Best experience: open on your phone → [doei-alpha.vercel.app/app](https://doei-alpha.vercel.app/app)**

> Dutch for "bye" — as in, bye debt.

**Problem:** People in debt in the Netherlands have no single place to track what they owe, to whom, and what happens next. Letters pile up, deadlines get missed, debts escalate to bailiffs.

**What doei does:** Connect your bank → scans transactions and auto-detects debts → you confirm them → tracks amounts, due dates, and escalation stages. Built-in AI advisor (Claude) answers questions about your specific situation in Dutch or English.

---

## Features

- **Magic link auth** — email sign-in, no password, per-user data with Supabase RLS
- **Bank scan (mock)** — simulates PSD2 transaction scan; Claude identifies debt repayments and surfaces them as suggestions the user confirms or dismisses
- **Document scan** — photograph a debt letter; Claude extracts creditor, amount, due date
- **AI advisor** — Claude chat with full context of your debts + income
- **Alerts** — upcoming due dates, escalating debts
- **Dutch + English** — full i18n

## Stack

React 18 + Vite · Supabase (auth + PostgreSQL + RLS) · Anthropic Claude · Vercel

## Run it

```bash
npm install
npm run dev        # frontend on :5173
npx vercel dev     # frontend + API routes (advisor, document scan)
```

Mock bank flow works with just `npm run dev` — no credentials needed. Account tab → Connect bank → pick a bank → simulated scan → suggested debts appear.

## Env vars

```env
ANTHROPIC_API_KEY=

# Supabase server-side (for API routes)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=     # Supabase → Settings → API → service_role

APP_URL=http://localhost:5173  # set to Vercel URL in prod
```

## API routes

| Route | Purpose |
|---|---|
| `POST /api/advisor` | Claude advisor chat |
| `POST /api/document/analyze` | Extract debt fields from scanned image |

## Supabase tables

| Table | Purpose |
|---|---|
| `bank_connections` | Bank connection records per user |
| `suggested_debts` | Detected debts awaiting user confirmation |

RLS enabled on both — users only touch their own rows.

## Codebase notes

- No component library — styles in `src/schuld/styles/styles.js` + CSS vars in `src/schuld/utils/helpers.js`
- Design tokens: `--paper-0/1/2/3`, `--ink-0/1/2/3`, `--accent`, `--stable/warning/action-fg/bg/tint`
- Debts in localStorage (per user ID) — migrating to Supabase is the obvious next step
- To deploy: fill env vars → `vercel deploy`
