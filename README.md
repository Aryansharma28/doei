# doei

**👉 Best experience: open on your phone → [doei-alpha.vercel.app/app](https://doei-alpha.vercel.app/app)**

> Dutch for "bye" — as in, bye debt.

**Problem:** People in debt in the Netherlands have no single place to track what they owe, to whom, and what happens next. Letters pile up, deadlines get missed, debts escalate to bailiffs.

**What doei does:** Connect your bank → Claude scans 90 days of transactions and auto-detects debts → you confirm them → the app tracks amounts, due dates, and escalation stages. Built-in AI advisor (Claude) answers questions about your specific situation in Dutch or English.

---

## Features

- **Magic link auth** — email sign-in, no password, per-user data with Supabase RLS
- **Bank scan** — PSD2 open banking (GoCardless/TrueLayer) fetches transactions; Claude identifies debt repayments and surfaces them as suggestions the user confirms
- **Document scan** — photograph a debt letter; Claude extracts creditor, amount, due date
- **AI advisor** — Claude chat with full context of your debts + income
- **Alerts** — upcoming due dates, escalating debts
- **Dutch + English** — full i18n

## Stack

React 18 + Vite · Supabase (auth + PostgreSQL + RLS) · Anthropic Claude · GoCardless Bank Account Data (PSD2) · Vercel (frontend + serverless API routes)

## Run it

```bash
npm install
npm run dev        # frontend on :5173 — auth + UI works immediately
npx vercel dev     # frontend + API routes — needed for real bank sync
```

The mock bank flow works with just `npm run dev` — no credentials needed. Go to Account tab → Connect bank → pick a bank → simulated scan → suggested debts appear.

## Env vars

```env
ANTHROPIC_API_KEY=

# Supabase server-side (for API routes)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=     # Supabase dashboard → Settings → API → service_role
SUPABASE_MCP_TOKEN=

# Gmail MCP morning sync
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
GMAIL_REFRESH_TOKEN=
GMAIL_SYNC_USER_ID=
GMAIL_MCP_QUERY=newer_than:1d
CRON_SECRET=

# GoCardless Bank Account Data — bankaccountdata.gocardless.com (free tier, NL banks)
GOCARDLESS_SECRET_ID=
GOCARDLESS_SECRET_KEY=

APP_URL=http://localhost:5173  # your Vercel URL in prod
```

## API routes

| Route | Purpose |
|---|---|
| `POST /api/advisor` | Claude advisor chat |
| `POST /api/document/analyze` | Extract debt fields from scanned image |
| `POST /api/gocardless/connect` | Start PSD2 OAuth → returns bank redirect URL |
| `POST /api/gocardless/sync` | Fetch transactions + Claude debt detection |
| `POST /api/gocardless/mock-connect` | Dev mock — no credentials needed |
| `POST /api/gmail/sync` | Search Gmail through MCP + flag debt emails |
| `GET /api/cron/gmail-sync` | Daily Gmail morning sync for one configured user |

## Supabase tables

| Table | Purpose |
|---|---|
| `bank_connections` | GoCardless requisition + account IDs, per user |
| `suggested_debts` | Claude-detected debts awaiting user confirmation |

RLS enabled on both — users only touch their own rows.

## Gmail sync setup

The Gmail integration uses a local MCP server in the backend, not a direct Gmail client inside the app.

1. Enable the Gmail API and create OAuth credentials in Google Cloud. Google’s official Node.js quickstart covers the Gmail API enablement and OAuth client setup flow: https://developers.google.com/workspace/gmail/api/quickstart/nodejs
2. Google’s Gmail auth guide explains the server-side OAuth flow and the need for refresh tokens for offline access: https://developers.google.com/workspace/gmail/api/auth/web-server
3. If you mint the refresh token with OAuth Playground, Google documents adding `https://developers.google.com/oauthplayground` as an authorized redirect URI and exchanging the auth code there: https://developers.google.com/admob/api/v1/how-tos/playground
4. Put `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, and `GMAIL_REFRESH_TOKEN` in the server environment.
5. Set `GMAIL_SYNC_USER_ID` to the Supabase user that should receive the suggested debts created by the daily run.

Notes:

- The morning cron is configured in `vercel.json` for `0 6 * * *`, which is 06:00 UTC every day.
- The current Gmail MCP package supports reading/searching Gmail only. It does not apply Gmail labels, so detected messages are marked inside doei as suggested debt items instead.
- The Account screen’s Gmail button hits the same backend sync path as the cron job, so it is the quickest verification path.

## How the bank scan works

1. User picks their bank (ING, ABN AMRO, Rabobank, Bunq, etc.)
2. `/api/gocardless/connect` creates a PSD2 requisition and returns an OAuth URL
3. User authenticates directly with their bank — no credentials touch our server
4. Bank redirects back to `/app?bank_ref=<id>`
5. `/api/gocardless/sync` fetches 90 days of transactions and sends them to Claude
6. Claude returns structured debt objects (creditor, type, amount, date)
7. App shows suggestions — user confirms or dismisses each one

## Codebase notes

- No component library — styles live in `src/schuld/styles/styles.js` (JS object) + CSS custom properties in `src/schuld/utils/helpers.js`
- Design tokens: `--paper-0/1/2/3`, `--ink-0/1/2/3`, `--accent`, `--stable/warning/action-fg/bg/tint`
- Debts currently stored in localStorage (per user ID) — migrating to Supabase is the obvious next step
- To deploy: fill env vars → `vercel deploy`
