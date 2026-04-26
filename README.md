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
SUPABASE_MCP_TOKEN=

# Gmail app credentials (same Google OAuth app used by Supabase Google auth)
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
GMAIL_MCP_QUERY=newer_than:1d
CRON_SECRET=

APP_URL=http://localhost:5173  # set to Vercel URL in prod
```

## API routes

| Route | Purpose |
|---|---|
| `POST /api/advisor` | Claude advisor chat |
| `POST /api/document/analyze` | Extract debt fields from scanned image |
| `POST /api/gmail/connect` | Persist a linked user’s Gmail refresh token |
| `GET /api/gmail/status` | Load the current user’s Gmail connection status |
| `POST /api/gmail/disconnect` | Remove the current user’s Gmail connection |
| `POST /api/gmail/sync` | Search the current user’s Gmail through MCP + flag debt emails |
| `GET /api/cron/gmail-sync` | Daily Gmail morning sync across all connected users |

## Supabase tables

| Table | Purpose |
|---|---|
| `bank_connections` | Bank connection records per user |
| `suggested_debts` | Detected debts awaiting user confirmation |
| `gmail_connections` | Per-user Gmail refresh tokens + sync status |

RLS enabled on both — users only touch their own rows.

## Gmail sync setup

The Gmail integration is per-user. Users connect Gmail from the Account screen, the app links Google to the existing Supabase user, and the backend stores that user’s Google refresh token for the morning cron.

1. Enable the Gmail API and create OAuth credentials in Google Cloud. Google’s official Node.js quickstart covers the Gmail API enablement and OAuth client setup flow: https://developers.google.com/workspace/gmail/api/quickstart/nodejs
2. Google’s Gmail auth guide explains the server-side OAuth flow and the need for refresh tokens for offline access: https://developers.google.com/workspace/gmail/api/auth/web-server
3. In Supabase Auth, enable the Google provider and turn on manual identity linking. Supabase documents that `linkIdentity()` requires the “Enable Manual Linking” auth setting: https://supabase.com/docs/reference/javascript/auth-linkidentity
4. Supabase documents that `provider_refresh_token` is exposed once on the session after OAuth sign-in/linking, so the app captures it and sends it to the backend for storage: https://supabase.com/docs/reference/javascript/auth-signinwithoauth
5. Put the same Google OAuth app credentials in server env as `GMAIL_CLIENT_ID` and `GMAIL_CLIENT_SECRET`, because the backend needs them to refresh user Gmail access for the cron.
6. Run the SQL in `supabase/gmail_connections.sql` to create the per-user Gmail connection table.

Notes:

- The morning cron is configured in `vercel.json` for `0 6 * * *`, which is 06:00 UTC every day.
- The current Gmail MCP package supports reading/searching Gmail only. It does not apply Gmail labels, so detected messages are marked inside doei as suggested debt items instead.
- Gmail scopes like `gmail.readonly` are sensitive/restricted and may require Google verification depending on how you ship the product.
- The Account screen’s Gmail button hits the same backend sync path as the cron job, so it is the quickest verification path after linking.

## Codebase notes

- No component library — styles in `src/schuld/styles/styles.js` + CSS vars in `src/schuld/utils/helpers.js`
- Design tokens: `--paper-0/1/2/3`, `--ink-0/1/2/3`, `--accent`, `--stable/warning/action-fg/bg/tint`
- Debts in localStorage (per user ID) — migrating to Supabase is the obvious next step
- To deploy: fill env vars → `vercel deploy`
